import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, Animated, KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fontSizes, fontWeights, spacing, radius, shadow } from '../theme';
import { bmiAPI } from '../services/api';

// ─── BMI Category Config ──────────────────────────────────────────────────────
const BMI_CATEGORIES = {
  underweight: {
    label: 'Underweight',
    color: colors.sky,
    bgColor: 'rgba(56, 189, 248, 0.13)',
    borderColor: 'rgba(56, 189, 248, 0.28)',
    emoji: '🌱',
    tip: 'Consider increasing calorie intake with nutrient-dense foods.',
    range: '< 18.5',
  },
  normal: {
    label: 'Healthy Weight',
    color: colors.primary,
    bgColor: 'rgba(0, 201, 167, 0.13)',
    borderColor: 'rgba(0, 201, 167, 0.28)',
    emoji: '✅',
    tip: 'Great! Maintain your healthy weight with balanced nutrition and exercise.',
    range: '18.5 – 24.9',
  },
  overweight: {
    label: 'Overweight',
    color: colors.amber,
    bgColor: 'rgba(251, 191, 36, 0.13)',
    borderColor: 'rgba(251, 191, 36, 0.28)',
    emoji: '⚠️',
    tip: 'A modest reduction in daily intake and regular activity can help.',
    range: '25 – 29.9',
  },
  obese: {
    label: 'Obese',
    color: colors.rose,
    bgColor: 'rgba(251, 113, 133, 0.13)',
    borderColor: 'rgba(251, 113, 133, 0.28)',
    emoji: '🔴',
    tip: 'Consider consulting a healthcare professional for personalised guidance.',
    range: '≥ 30',
  },
};

function calcBMI(height, weight) {
  const h = parseFloat(height) / 100;
  const w = parseFloat(weight);
  if (!h || !w || h <= 0 || w <= 0) return null;
  return Math.round((w / (h * h)) * 10) / 10;
}

function getCategory(bmi) {
  if (bmi < 18.5) return 'underweight';
  if (bmi < 25) return 'normal';
  if (bmi < 30) return 'overweight';
  return 'obese';
}

// BMI scale bar — shows a marker at the right position
function BMIScaleBar({ bmi, category }) {
  const cfg = BMI_CATEGORIES[category];
  // Map BMI 10→40 to 0→100%
  const pct = Math.min(Math.max(((bmi - 10) / 30) * 100, 2), 98);

  return (
    <View style={scaleStyles.wrap}>
      <View style={scaleStyles.bar}>
        {/* Gradient segments */}
        <View style={[scaleStyles.seg, { backgroundColor: colors.sky, flex: 1 }]} />
        <View style={[scaleStyles.seg, { backgroundColor: colors.primary, flex: 1.3 }]} />
        <View style={[scaleStyles.seg, { backgroundColor: colors.amber, flex: 1 }]} />
        <View style={[scaleStyles.seg, { backgroundColor: colors.rose, flex: 1.5 }]} />
        {/* Marker */}
        <View style={[scaleStyles.markerWrap, { left: `${pct}%` }]}>
          <View style={[scaleStyles.markerLine, { backgroundColor: cfg.color }]} />
          <View style={[scaleStyles.markerDot, { backgroundColor: cfg.color }]} />
        </View>
      </View>
      <View style={scaleStyles.labels}>
        <Text style={scaleStyles.labelTxt}>Underweight</Text>
        <Text style={scaleStyles.labelTxt}>Normal</Text>
        <Text style={scaleStyles.labelTxt}>Over</Text>
        <Text style={scaleStyles.labelTxt}>Obese</Text>
      </View>
    </View>
  );
}

const scaleStyles = StyleSheet.create({
  wrap: { marginTop: spacing.md },
  bar: {
    flexDirection: 'row',
    height: 10,
    borderRadius: radius.full,
    overflow: 'visible',
    position: 'relative',
  },
  seg: { height: '100%' },
  markerWrap: {
    position: 'absolute',
    top: -8,
    alignItems: 'center',
    transform: [{ translateX: -6 }],
  },
  markerLine: { width: 2, height: 26, borderRadius: 1 },
  markerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 2,
    borderWidth: 2,
    borderColor: colors.bgCard,
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
  },
  labelTxt: {
    fontSize: 9,
    color: colors.textMuted,
    fontWeight: fontWeights.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
});

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function BMIScreen({ navigation }) {
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [bmi, setBmi] = useState(null);
  const [category, setCategory] = useState(null);
  const [saving, setSaving] = useState(false);
  const [resultVisible, setResultVisible] = useState(false);

  const resultAnim = useRef(new Animated.Value(0)).current;

  // Live BMI calculation
  useEffect(() => {
    const val = calcBMI(height, weight);
    if (val) {
      setBmi(val);
      setCategory(getCategory(val));
      if (!resultVisible) {
        setResultVisible(true);
        Animated.spring(resultAnim, { toValue: 1, useNativeDriver: true, tension: 60, friction: 8 }).start();
      }
    } else {
      setResultVisible(false);
      resultAnim.setValue(0);
      setBmi(null);
      setCategory(null);
    }
  }, [height, weight]);

  const cfg = category ? BMI_CATEGORIES[category] : null;

  const handleSave = async () => {
    if (!bmi) {
      Alert.alert('Missing data', 'Enter your height and weight first.');
      return;
    }
    setSaving(true);
    try {
      await bmiAPI.save(parseFloat(height), parseFloat(weight));
      Alert.alert('Saved!', `BMI ${bmi} saved successfully.`, [{ text: 'Great' }]);
    } catch (e) {
      Alert.alert('Could not save', e.message || 'Try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* ── Header ── */}
      <LinearGradient
        colors={['rgba(0, 201, 167, 0.13)', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backTxt}>‹</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>BMI Calculator</Text>
          <Text style={styles.headerSub}>Body Mass Index tracker</Text>
        </View>
        <Text style={styles.headerEmoji}>⚖️</Text>
      </LinearGradient>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >

          {/* ── Input Card ── */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Enter your measurements</Text>

            <View style={styles.inputRow}>
              {/* Height */}
              <View style={styles.inputBlock}>
                <Text style={styles.inputLabel}>Height</Text>
                <View style={styles.inputWrap}>
                  <TextInput
                    style={styles.input}
                    value={height}
                    onChangeText={setHeight}
                    keyboardType="decimal-pad"
                    placeholder="170"
                    placeholderTextColor={colors.textMuted}
                    maxLength={5}
                  />
                  <Text style={styles.inputUnit}>cm</Text>
                </View>
              </View>

              {/* Divider */}
              <View style={styles.inputDivider} />

              {/* Weight */}
              <View style={styles.inputBlock}>
                <Text style={styles.inputLabel}>Weight</Text>
                <View style={styles.inputWrap}>
                  <TextInput
                    style={styles.input}
                    value={weight}
                    onChangeText={setWeight}
                    keyboardType="decimal-pad"
                    placeholder="70"
                    placeholderTextColor={colors.textMuted}
                    maxLength={5}
                  />
                  <Text style={styles.inputUnit}>kg</Text>
                </View>
              </View>
            </View>

            {/* Formula hint */}
            <Text style={styles.formulaHint}>BMI = kg ÷ m²</Text>
          </View>

          {/* ── Result Card (animated) ── */}
          {bmi && cfg && (
            <Animated.View
              style={[
                styles.resultCard,
                { backgroundColor: cfg.bgColor, borderColor: cfg.borderColor },
                {
                  opacity: resultAnim,
                  transform: [{ scale: resultAnim.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) }],
                },
              ]}
            >
              {/* BMI number */}
              <View style={styles.resultTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.resultLabel}>Your BMI</Text>
                  <Text style={[styles.resultBMI, { color: cfg.color }]}>{bmi}</Text>
                  <Text style={[styles.resultCat, { color: cfg.color }]}>
                    {cfg.emoji} {cfg.label}
                  </Text>
                </View>
                <View style={styles.resultMeta}>
                  <Text style={styles.resultMetaLabel}>Range</Text>
                  <Text style={[styles.resultMetaVal, { color: cfg.color }]}>{cfg.range}</Text>
                </View>
              </View>

              {/* Scale bar */}
              <BMIScaleBar bmi={bmi} category={category} />

              {/* Tip */}
              <View style={styles.tipBox}>
                <Text style={styles.tipText}>{cfg.tip}</Text>
              </View>

              {/* Save Button */}
              <TouchableOpacity
                style={[styles.saveBtn, saving && { opacity: 0.7 }]}
                onPress={handleSave}
                disabled={saving}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={[colors.gradientHeroStart, colors.primary, colors.mint]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.saveBtnGrad}
                >
                  {saving ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.saveBtnTxt}>💾  Save to History</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* ── BMI Reference Table ── */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>BMI Reference</Text>
            {Object.entries(BMI_CATEGORIES).map(([key, c]) => (
              <View
                key={key}
                style={[
                  styles.refRow,
                  category === key && { backgroundColor: c.bgColor, borderColor: c.borderColor, borderWidth: 1 },
                ]}
              >
                <Text style={styles.refEmoji}>{c.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.refLabel, category === key && { color: c.color }]}>{c.label}</Text>
                </View>
                <Text style={[styles.refRange, category === key && { color: c.color, fontWeight: fontWeights.bold }]}>
                  {c.range}
                </Text>
              </View>
            ))}
          </View>

          {/* ── History — Coming Soon ── */}
          <View style={styles.comingSoonCard}>
            <View style={styles.comingSoonInner}>
              <Text style={styles.comingSoonEmoji}>📊</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.comingSoonTitle}>BMI History</Text>
                <Text style={styles.comingSoonSub}>Track your BMI over time · coming soon</Text>
              </View>
              <View style={styles.comingSoonBadge}>
                <Text style={styles.comingSoonBadgeTxt}>Soon</Text>
              </View>
            </View>
          </View>

          <View style={{ height: 60 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgMid },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 10,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.tintPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderTeal,
  },
  backTxt: { fontSize: 22, color: colors.primary, lineHeight: 26, fontWeight: fontWeights.bold },
  headerTitle: { fontSize: fontSizes.md, fontWeight: fontWeights.bold, color: colors.textPrimary },
  headerSub: { fontSize: fontSizes.xs, color: colors.textMuted, marginTop: 1 },
  headerEmoji: { fontSize: 28 },

  scroll: { padding: 14, paddingTop: 12 },

  /* Card */
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.xl,
    padding: spacing.md,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.subtle,
  },
  cardTitle: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.md,
  },

  /* Inputs */
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  inputBlock: { flex: 1 },
  inputDivider: { width: 1, height: 56, backgroundColor: colors.border },
  inputLabel: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.semibold,
    color: colors.textMuted,
    marginBottom: 6,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgMuted,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    fontSize: 26,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
    paddingVertical: 12,
  },
  inputUnit: {
    fontSize: fontSizes.sm,
    color: colors.textMuted,
    fontWeight: fontWeights.semibold,
    marginLeft: 4,
  },
  formulaHint: {
    textAlign: 'center',
    marginTop: spacing.md,
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    fontStyle: 'italic',
  },

  /* Result */
  resultCard: {
    borderRadius: radius.xl,
    padding: spacing.md,
    marginBottom: 12,
    borderWidth: 1.5,
    ...shadow.subtle,
  },
  resultTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  resultLabel: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  resultBMI: {
    fontSize: 52,
    fontWeight: fontWeights.extrabold,
    letterSpacing: -1,
    lineHeight: 58,
  },
  resultCat: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.semibold,
    marginTop: 2,
  },
  resultMeta: {
    alignItems: 'flex-end',
    paddingTop: 4,
  },
  resultMetaLabel: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    fontWeight: fontWeights.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  resultMetaVal: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
    marginTop: 4,
  },
  tipBox: {
    backgroundColor: colors.bgGlass,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  tipText: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  saveBtn: { marginTop: spacing.md },
  saveBtnGrad: {
    borderRadius: radius.full,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.button,
  },
  saveBtnTxt: { fontSize: fontSizes.base, fontWeight: fontWeights.bold, color: '#fff' },

  /* Reference table */
  refRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: radius.md,
    marginBottom: 4,
    gap: 8,
  },
  refEmoji: { fontSize: 20, width: 28 },
  refLabel: { fontSize: fontSizes.base, color: colors.textSecondary },
  refRange: { fontSize: fontSizes.sm, color: colors.textMuted },

  /* History */
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  emptyState: { alignItems: 'center', paddingVertical: spacing.lg, gap: 8 },
  emptyEmoji: { fontSize: 32 },
  emptyText: { fontSize: fontSizes.sm, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },

  /* Login prompt */
  loginPrompt: {
    backgroundColor: colors.tintViolet,
    borderRadius: radius.xl,
    padding: spacing.md,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.tintVioletBorder,
  },
  /* Coming Soon */
  comingSoonCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.xl,
    padding: spacing.md,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.subtle,
  },
  comingSoonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  comingSoonEmoji: { fontSize: 26 },
  comingSoonTitle: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.semibold,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  comingSoonSub: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
  },
  comingSoonBadge: {
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.30)',
  },
  comingSoonBadgeTxt: {
    fontSize: 10,
    fontWeight: fontWeights.bold,
    color: colors.amber,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
