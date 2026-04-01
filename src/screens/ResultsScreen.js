import React, { useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  Animated, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fontSizes, fontWeights, spacing, radius, shadow } from '../theme';
import { PrimaryButton, SectionHeader } from '../components/UI';
import DisclaimerStrip from '../components/DisclaimerStrip';
import { useApp } from '../context/AppContext';

const RISK_CONFIG = {
  LOW: {
    color:    colors.riskLow,
    bg:       colors.riskBgLow,
    emoji:    '✅',
    title:    'Great News!',
    subtitle: 'Your B12 levels appear to be in a healthy range.',
    icon:     '🟢',
  },
  MEDIUM: {
    color:    colors.riskMedium,
    bg:       colors.riskBgMedium,
    emoji:    '⚠️',
    title:    'Moderate Risk',
    subtitle: 'Some indicators suggest you may need to improve your B12 intake.',
    icon:     '🟡',
  },
  HIGH: {
    color:    colors.riskHigh,
    bg:       colors.riskBgHigh,
    emoji:    '🚨',
    title:    'High Risk Detected',
    subtitle: 'Your responses indicate significant risk of B12 deficiency. Medical attention recommended.',
    icon:     '🔴',
  },
};

const CATEGORY_ICONS = {
  'Energy & Fatigue':  '⚡',
  'Neurological':      '🧠',
  'Mood':              '😔',
  'Diet':              '🥩',
  'Lifestyle':         '🏃',
  'Work Lifestyle':    '💼',
  'Female Health':     '🩸',
  'Physical':          '💪',
  'Sleep':             '💤',
  'Fatigue':           '😴',
  'Digestive Health':  '🫁',
  'Diet Habits':       '🍔',
};

export default function ResultsScreen({ navigation }) {
  const { state } = useApp();
  const result = state.riskResult;

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(200),
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 60, friction: 7 }),
        Animated.timing(fadeAnim,  { toValue: 1, duration: 600, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  if (!result) return null;

  const cfg = RISK_CONFIG[result.level];

  // Filter breakdown categories with data
  const breakdownItems = Object.entries(result.breakdown)
    .filter(([_, v]) => v.max > 0)
    .map(([cat, v]) => ({
      cat,
      pct: Math.round((v.score / v.max) * 100),
    }))
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 5);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

        {/* Hero Risk Card */}
        <Animated.View style={[
          styles.heroCard,
          { backgroundColor: cfg.bg, borderColor: cfg.color },
          { transform: [{ scale: scaleAnim }], opacity: fadeAnim },
        ]}>
          <Text style={styles.heroEmoji}>{cfg.emoji}</Text>
          <Text style={[styles.heroTitle, { color: cfg.color }]}>{cfg.title}</Text>
          <Text style={styles.heroSubtitle}>{cfg.subtitle}</Text>

          {/* Score gauge */}
          <View style={styles.gauge}>
            <View style={styles.gaugeTrack}>
              <View style={[
                styles.gaugeFill,
                {
                  width: `${result.percentage}%`,
                  backgroundColor: cfg.color,
                },
              ]} />
            </View>
            <Text style={[styles.gaugeLabel, { color: cfg.color }]}>
              {result.percentage}% Risk Score
            </Text>
          </View>
        </Animated.View>

        {/* Breakdown by category */}
        {breakdownItems.length > 0 && (
          <>
            <SectionHeader title="Risk Breakdown by Area" />
            <View style={styles.breakdownGrid}>
              {breakdownItems.map(({ cat, pct }) => (
                <View key={cat} style={styles.breakdownItem}>
                  <View style={styles.breakdownHeader}>
                    <Text style={styles.breakdownIcon}>{CATEGORY_ICONS[cat] || '📌'}</Text>
                    <Text style={styles.breakdownCat}>{cat}</Text>
                    <Text style={[
                      styles.breakdownPct,
                      { color: pct >= 65 ? colors.riskHigh : pct >= 35 ? colors.riskMedium : colors.riskLow },
                    ]}>
                      {pct}%
                    </Text>
                  </View>
                  <View style={styles.miniTrack}>
                    <View style={[
                      styles.miniFill,
                      {
                        width: `${pct}%`,
                        backgroundColor: pct >= 65 ? colors.riskHigh : pct >= 35 ? colors.riskMedium : colors.riskLow,
                      },
                    ]} />
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Action Suggestions */}
        <SectionHeader title="Recommended Actions" />
        <View style={styles.suggestionsWrap}>
          {result.suggestions.map((s, i) => (
            <View key={i} style={styles.suggestionItem}>
              <View style={[styles.suggestionDot, { backgroundColor: cfg.color }]} />
              <Text style={styles.suggestionText}>{s}</Text>
            </View>
          ))}
        </View>

        {/* Medical note for high risk */}
        {result.level === 'HIGH' && (
          <View style={styles.medicalAlert}>
            <Text style={styles.medicalAlertIcon}>🩺</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.medicalAlertTitle}>Medical Recommendation</Text>
              <Text style={styles.medicalAlertText}>
                Please consult a doctor and request a Vitamin B12 blood test. Early diagnosis leads to better outcomes.
              </Text>
            </View>
          </View>
        )}

        {/* Disclaimer */}
        <DisclaimerStrip
          text="⚠️ This assessment is for informational purposes only. It is not a medical diagnosis. Always consult a healthcare professional for medical advice."
        />

        {/* CTAs */}
        <PrimaryButton
          label="Start Daily Tracking →"
          onPress={() => navigation.replace('Main')}
          style={{ marginTop: spacing.xl }}
        />
        <TouchableOpacity
          onPress={() => navigation.replace('Questionnaire')}
          style={styles.retakeBtn}
        >
          <Text style={styles.retakeText}>Retake Assessment</Text>
        </TouchableOpacity>

        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: colors.bg },
  container: { padding: spacing.xl },

  heroCard: {
    borderWidth: 1.5,
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.md,
    ...shadow.card,
  },
  heroEmoji:    { fontSize: 48, marginBottom: spacing.sm },
  heroTitle: {
    fontSize: fontSizes.xxl,
    fontWeight: fontWeights.extrabold,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: fontSizes.base,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  gauge:      { width: '100%', alignItems: 'center', gap: spacing.sm },
  gaugeTrack: {
    width: '100%',
    height: 8,
    backgroundColor: colors.bgElevated,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  gaugeFill:  { height: '100%', borderRadius: radius.full },
  gaugeLabel: { fontSize: fontSizes.sm, fontWeight: fontWeights.bold, letterSpacing: 0.5 },

  breakdownGrid: { gap: spacing.sm },
  breakdownItem: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  breakdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  breakdownIcon: { fontSize: 16 },
  breakdownCat:  { flex: 1, fontSize: fontSizes.sm, color: colors.textSecondary, fontWeight: fontWeights.medium },
  breakdownPct:  { fontSize: fontSizes.sm, fontWeight: fontWeights.bold },
  miniTrack:     { height: 4, backgroundColor: colors.border, borderRadius: radius.full, overflow: 'hidden' },
  miniFill:      { height: '100%', borderRadius: radius.full },

  suggestionsWrap: { gap: spacing.sm, marginBottom: spacing.md },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  suggestionDot: { width: 8, height: 8, borderRadius: 4, marginTop: 5, flexShrink: 0 },
  suggestionText: { flex: 1, fontSize: fontSizes.sm, color: colors.textSecondary, lineHeight: 20 },

  medicalAlert: {
    flexDirection: 'row',
    backgroundColor: colors.tintDanger,
    borderWidth: 1.5,
    borderColor: colors.tintDangerBorder,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.md,
    marginVertical: spacing.md,
  },
  medicalAlertIcon:  { fontSize: 24 },
  medicalAlertTitle: { fontSize: fontSizes.base, fontWeight: fontWeights.bold, color: colors.riskHigh, marginBottom: 4 },
  medicalAlertText:  { fontSize: fontSizes.sm, color: colors.textSecondary, lineHeight: 19 },

  disclaimer: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    padding: spacing.md,
    marginVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  disclaimerText: { fontSize: fontSizes.xs, color: colors.textMuted, lineHeight: 18, textAlign: 'center' },

  retakeBtn:  { alignItems: 'center', marginTop: spacing.md, paddingVertical: spacing.sm },
  retakeText: { color: colors.textMuted, fontSize: fontSizes.sm },
});
