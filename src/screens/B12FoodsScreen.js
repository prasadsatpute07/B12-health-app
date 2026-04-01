import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, TextInput, KeyboardAvoidingView, Platform,
  ActivityIndicator, Alert, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { colors, fontSizes, fontWeights, spacing, radius, shadow } from '../theme';
import { useApp, setBmiData } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { bmiAPI } from '../services/api';
import { getRecommendedFoods, calculateBMI, getBMICategory, BMI_INFO } from '../data/b12Foods';

// ── BMI staleness check: re-prompt if > 15 days ─────────────────────────────
const isBmiStale = (measuredAt) => {
  if (!measuredAt) return true;
  const last = new Date(measuredAt);
  const now  = new Date();
  const diffDays = (now - last) / (1000 * 60 * 60 * 24);
  return diffDays > 15;
};

const TIER_COLORS = {
  high:     { bg: 'rgba(251,191,36,0.12)',  border: 'rgba(251,191,36,0.30)',  text: '#FBBF24' },
  moderate: { bg: 'rgba(129,140,248,0.10)', border: 'rgba(129,140,248,0.28)', text: '#818CF8' },
  low:      { bg: 'rgba(0,201,167,0.10)',   border: 'rgba(0,201,167,0.28)',   text: '#00C9A7' },
};
const TIER_LABELS = { high: '🔥 High Cal', moderate: '⚡ Moderate', low: '🌿 Light' };

export default function B12FoodsScreen({ navigation }) {
  const { state, dispatch } = useApp();
  const { isAuthenticated } = useAuth();

  const dietType    = state.user?.dietType || 'omnivore';
  const bmiData     = state.bmiData;

  // ── BMI modal state ──────────────────────────────────────────────────────
  const [showModal,  setShowModal]  = useState(false);
  const [height,     setHeight]     = useState('');
  const [weight,     setWeight]     = useState('');
  const [saving,     setSaving]     = useState(false);
  const [previewBmi, setPreviewBmi] = useState(null);
  const slideAnim = useRef(new Animated.Value(400)).current;

  // ── Show BMI modal when user NAVIGATES to this tab ───────────────────────
  // Runs every time this screen comes into focus (i.e. user taps the tab).
  // • New user or stale data (> 15 days) → open the form
  // • Fresh data (≤ 15 days)             → skip form, banner already shown
  useFocusEffect(
    useCallback(() => {
      if (!isAuthenticated) return;
      if (!bmiData || isBmiStale(bmiData.measuredAt)) {
        const t = setTimeout(() => openModal(), 300);
        return () => clearTimeout(t);
      }
      // fresh data — no modal, just display the banner
    }, [isAuthenticated, bmiData])
  );

  const openModal = () => {
    setShowModal(true);
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  };

  const closeModal = () => {
    Animated.timing(slideAnim, {
      toValue: 400,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setShowModal(false));
  };

  // ── Live BMI preview as user types ──────────────────────────────────────
  useEffect(() => {
    const h = parseFloat(height);
    const w = parseFloat(weight);
    if (h > 50 && h < 300 && w > 10 && w < 500) {
      setPreviewBmi(calculateBMI(h, w));
    } else {
      setPreviewBmi(null);
    }
  }, [height, weight]);

  const handleSubmit = async () => {
    const h = parseFloat(height);
    const w = parseFloat(weight);
    if (!h || !w || h < 50 || h > 300 || w < 10 || w > 500) {
      Alert.alert('Invalid Data', 'Please enter a valid height (50–300 cm) and weight (10–500 kg).');
      return;
    }

    setSaving(true);
    const bmi      = calculateBMI(h, w);
    const category = getBMICategory(bmi);

    try {
      await bmiAPI.save(h, w);
    } catch (_) {
      // Silently fail — we still update local state
    }

    const today = new Date().toISOString().split('T')[0];
    dispatch(setBmiData({
      bmi,
      bmiCategory: category,
      heightCm: h,
      weightKg: w,
      measuredAt: today,
    }));

    setSaving(false);
    closeModal();
  };

  // ── Filtered & sorted food list ──────────────────────────────────────────
  const foods = getRecommendedFoods(dietType, bmiData?.bmiCategory);
  const bmiInfo = bmiData ? BMI_INFO[bmiData.bmiCategory] : null;

  const DIET_LABELS = {
    vegan: '🌿 Vegan',
    vegetarian: '🥗 Vegetarian',
    pescatarian: '🐟 Pescatarian',
    omnivore: '🍽️ Omnivore',
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>B12 Rich Foods</Text>
        {isAuthenticated ? (
          <TouchableOpacity onPress={openModal} style={styles.updateBtn}>
            <Text style={styles.updateBtnTxt}>📏 Update</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 70 }} />
        )}
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

        {/* ── BMI + Diet Banner ── */}
        {bmiData && bmiInfo ? (
          <View style={[styles.bmiBanner, { borderColor: bmiInfo.color + '55', backgroundColor: bmiInfo.color + '12' }]}>
            <View style={styles.bmiRow}>
              <Text style={styles.bmiIcon}>{bmiInfo.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.bmiTitle, { color: bmiInfo.color }]}>
                  BMI {bmiData.bmi} · {bmiInfo.label}
                </Text>
                <Text style={styles.bmiTip}>{bmiInfo.tip}</Text>
              </View>
            </View>
            <View style={styles.tagRow}>
              <View style={styles.dietTag}>
                <Text style={styles.dietTagTxt}>{DIET_LABELS[dietType] || dietType}</Text>
              </View>
              <View style={styles.preferTag}>
                <Text style={styles.preferTagTxt}>⭐ {bmiInfo.preferLabel}</Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.noBmiBanner}>
            <Text style={styles.noBmiEmoji}>📏</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.noBmiTitle}>
                {isAuthenticated ? 'Add your measurements' : 'Log in to get personalised suggestions'}
              </Text>
              <Text style={styles.noBmiSub}>
                {isAuthenticated
                  ? 'We\'ll recommend foods based on your BMI and diet type.'
                  : 'Showing general B12 foods.'}
              </Text>
            </View>
            {isAuthenticated && (
              <TouchableOpacity onPress={openModal} style={styles.addMeasureBtn}>
                <Text style={styles.addMeasureTxt}>Add</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* ── Food list ── */}
        <Text style={styles.sectionLabel}>
          {foods.length} foods · filtered for {DIET_LABELS[dietType] || dietType}
        </Text>

        {foods.map((food, i) => {
          const tc = TIER_COLORS[food.calorieTier] || TIER_COLORS.moderate;
          return (
            <View key={i} style={styles.card}>
              <View style={styles.emojiWrap}>
                <Text style={styles.emoji}>{food.emoji}</Text>
              </View>
              <View style={styles.cardContent}>
                <View style={styles.cardHeader}>
                  <Text style={styles.foodName}>{food.name}</Text>
                  <Text style={styles.foodAmount}>{food.b12mcg} mcg</Text>
                </View>
                <View style={styles.tagLine}>
                  <Text style={styles.foodType}>{food.type}</Text>
                  <View style={[styles.tierBadge, { backgroundColor: tc.bg, borderColor: tc.border }]}>
                    <Text style={[styles.tierBadgeTxt, { color: tc.text }]}>
                      {TIER_LABELS[food.calorieTier]}
                    </Text>
                  </View>
                  <Text style={styles.calText}>{food.calories} kcal</Text>
                </View>
                <Text style={styles.foodDesc}>{food.desc}</Text>
              </View>
            </View>
          );
        })}

        <Text style={styles.disclaimer}>
          ⚕️ B12 values are per 100g (raw). Consult a dietitian for personal advice.
        </Text>
        <View style={{ height: spacing.xxl }} />
      </ScrollView>

      {/* ── BMI Modal ── */}
      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={closeModal} />

          <Animated.View style={[styles.modalSheet, { transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.modalHandle} />

            <Text style={styles.modalTitle}>Your Measurements</Text>
            <Text style={styles.modalSub}>
              {bmiData
                ? 'It\'s been over 15 days — update your measurements to keep recommendations accurate.'
                : 'Enter your details so we can suggest the best B12 foods for your goals.'}
            </Text>

            {/* Height */}
            <Text style={styles.inputLabel}>Height (cm)</Text>
            <TextInput
              style={styles.input}
              value={height}
              onChangeText={setHeight}
              keyboardType="decimal-pad"
              placeholder="e.g. 170"
              placeholderTextColor={colors.textMuted}
            />

            {/* Weight */}
            <Text style={styles.inputLabel}>Weight (kg)</Text>
            <TextInput
              style={styles.input}
              value={weight}
              onChangeText={setWeight}
              keyboardType="decimal-pad"
              placeholder="e.g. 65"
              placeholderTextColor={colors.textMuted}
            />

            {/* Live BMI Preview */}
            {previewBmi && (() => {
              const cat  = getBMICategory(previewBmi);
              const info = BMI_INFO[cat];
              return (
                <View style={[styles.bmiPreview, { backgroundColor: info.color + '15', borderColor: info.color + '40' }]}>
                  <Text style={[styles.bmiPreviewVal, { color: info.color }]}>
                    {info.icon} BMI {previewBmi}
                  </Text>
                  <Text style={[styles.bmiPreviewCat, { color: info.color }]}>{info.label}</Text>
                </View>
              );
            })()}

            <TouchableOpacity
              style={[styles.submitBtn, saving && { opacity: 0.7 }]}
              onPress={handleSubmit}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitBtnTxt}>Save & Get Recommendations →</Text>
              )}
            </TouchableOpacity>

            {bmiData && (
              <TouchableOpacity onPress={closeModal} style={styles.skipBtn}>
                <Text style={styles.skipTxt}>Skip for now</Text>
              </TouchableOpacity>
            )}
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },

  // ── Header ──────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.bgCard,
  },
  backBtn:       { padding: spacing.sm },
  backArrow:     { fontSize: fontSizes.xl, color: colors.textSecondary },
  headerTitle:   { fontSize: fontSizes.lg, fontWeight: fontWeights.bold, color: colors.textPrimary },
  updateBtn: {
    backgroundColor: 'rgba(0,201,167,0.10)',
    borderRadius: radius.full,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(0,201,167,0.25)',
  },
  updateBtnTxt: { fontSize: fontSizes.xs, fontWeight: fontWeights.semibold, color: colors.primary },

  container: { padding: spacing.lg },

  // ── BMI banner ────────────────────────────────────────────────────────────
  bmiBanner: {
    borderRadius: radius.xl,
    borderWidth: 1.5,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  bmiRow:   { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, marginBottom: spacing.sm },
  bmiIcon:  { fontSize: 28 },
  bmiTitle: { fontSize: fontSizes.base, fontWeight: fontWeights.bold, marginBottom: 2 },
  bmiTip:   { fontSize: fontSizes.xs, color: colors.textSecondary, lineHeight: 18 },
  tagRow:   { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  dietTag: {
    backgroundColor: 'rgba(129,140,248,0.12)',
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(129,140,248,0.25)',
  },
  dietTagTxt: { fontSize: 11, fontWeight: fontWeights.semibold, color: '#818CF8' },
  preferTag: {
    backgroundColor: 'rgba(251,191,36,0.12)',
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.25)',
  },
  preferTagTxt: { fontSize: 11, fontWeight: fontWeights.semibold, color: colors.riskMedium },

  noBmiBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
    ...shadow.subtle,
  },
  noBmiEmoji:  { fontSize: 26 },
  noBmiTitle:  { fontSize: fontSizes.sm, fontWeight: fontWeights.semibold, color: colors.textPrimary, marginBottom: 2 },
  noBmiSub:    { fontSize: fontSizes.xs, color: colors.textMuted },
  addMeasureBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  addMeasureTxt: { color: '#fff', fontSize: fontSizes.sm, fontWeight: fontWeights.bold },

  sectionLabel: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
  },

  // ── Food card ─────────────────────────────────────────────────────────────
  card: {
    flexDirection: 'row',
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.subtle,
  },
  emojiWrap: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: 'rgba(0,201,167,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(0,201,167,0.25)',
    flexShrink: 0,
  },
  emoji:       { fontSize: 28 },
  cardContent: { flex: 1 },
  cardHeader:  {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  foodName:    { fontSize: fontSizes.md, fontWeight: fontWeights.bold, color: colors.textPrimary, flex: 1 },
  foodAmount:  { fontSize: fontSizes.sm, fontWeight: fontWeights.bold, color: colors.primary },
  tagLine:     { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6, flexWrap: 'wrap' },
  foodType: {
    fontSize: 10,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    fontWeight: fontWeights.semibold,
  },
  tierBadge: {
    borderRadius: radius.full,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderWidth: 1,
  },
  tierBadgeTxt: { fontSize: 10, fontWeight: fontWeights.bold },
  calText:      { fontSize: 10, color: colors.textMuted },
  foodDesc:     { fontSize: fontSizes.xs, color: colors.textSecondary, lineHeight: 18 },

  disclaimer: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.lg,
    lineHeight: 18,
  },

  // ── Modal ─────────────────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  modalSheet: {
    backgroundColor: colors.bgCard,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.xl,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.extrabold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  modalSub: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  inputLabel: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    fontSize: fontSizes.base,
    color: colors.textPrimary,
    backgroundColor: colors.bgMuted,
  },
  bmiPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  bmiPreviewVal: { fontSize: fontSizes.lg, fontWeight: fontWeights.extrabold },
  bmiPreviewCat: { fontSize: fontSizes.sm, fontWeight: fontWeights.semibold },
  submitBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  submitBtnTxt: { color: '#fff', fontSize: fontSizes.base, fontWeight: fontWeights.bold },
  skipBtn:   { alignItems: 'center', marginTop: spacing.md, padding: spacing.sm },
  skipTxt:   { color: colors.textMuted, fontSize: fontSizes.sm },
});
