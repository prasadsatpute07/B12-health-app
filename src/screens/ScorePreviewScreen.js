import React, { useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  Animated, TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fontSizes, fontWeights, spacing, radius, shadow } from '../theme';
import { useApp } from '../context/AppContext';
import DisclaimerStrip from '../components/DisclaimerStrip';

const RISK_CONFIG = {
  LOW: {
    color:    colors.riskLow,
    bg:       colors.riskBgLow,
    emoji:    '✅',
    title:    'Great News!',
    subtitle: 'Your B12 levels appear to be in a healthy range.',
  },
  MEDIUM: {
    color:    colors.riskMedium,
    bg:       colors.riskBgMedium,
    emoji:    '⚠️',
    title:    'Moderate Risk',
    subtitle: 'Some indicators suggest you may need to improve your B12 intake.',
  },
  HIGH: {
    color:    colors.riskHigh,
    bg:       colors.riskBgHigh,
    emoji:    '🚨',
    title:    'High Risk Detected',
    subtitle: 'Your responses indicate significant risk of B12 deficiency.',
  },
};

export default function ScorePreviewScreen({ navigation }) {
  const { state } = useApp();
  const result = state.riskResult;
  const userName = state.guestName || state.user?.name || 'Friend';

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(200),
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 60, friction: 7 }),
        Animated.timing(fadeAnim,  { toValue: 1, duration: 600, useNativeDriver: true }),
      ]),
    ]).start();

    // Pulse animation for the save button
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.03, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  if (!result) return null;

  const cfg = RISK_CONFIG[result.level];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

        {/* Greeting */}
        <Text style={styles.greeting}>Hey {userName}! 👋</Text>
        <Text style={styles.greetingSub}>Here's your assessment score</Text>

        {/* Hero Score Card */}
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

        {/* Locked Full Results Section */}
        <View style={styles.lockedSection}>
          <View style={styles.lockedOverlay}>
            {/* Fake blurred breakdown items */}
            {['Energy & Fatigue', 'Neurological', 'Diet Habits'].map((cat, i) => (
              <View key={i} style={styles.lockedItem}>
                <View style={styles.lockedItemBar}>
                  <View style={[styles.lockedItemFill, { width: `${60 - i * 15}%` }]} />
                </View>
                <Text style={styles.lockedItemText}>{cat}</Text>
              </View>
            ))}

            {/* Lock icon overlay */}
            <View style={styles.lockBadge}>
              <Text style={styles.lockIcon}>🔒</Text>
            </View>
          </View>
        </View>

        {/* Notice Banner */}
        <View style={styles.noticeBanner}>
          <Text style={styles.noticeIcon}>🔐</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.noticeTitle}>Unlock Full Results</Text>
            <Text style={styles.noticeText}>
              Sign up or log in to see your detailed risk breakdown, personalized recommendations, and access the daily tracking system.
            </Text>
          </View>
        </View>

        {/* Save Result / Login CTA */}
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <TouchableOpacity
            style={styles.saveBtnOuter}
          onPress={() => navigation.navigate('Auth', { initialMode: 'register' })}
            activeOpacity={0.88}
          >
            <LinearGradient
              colors={[colors.primaryLight, colors.primary, colors.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.saveBtn}
            >
              <Text style={styles.saveBtnIcon}>💾</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.saveBtnText}>Save result & sign up</Text>
                <Text style={styles.saveBtnSubtext}>Create an account to keep your results safe</Text>
              </View>
              <Text style={styles.saveBtnArrow}>→</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Already have an account */}
        <TouchableOpacity
          style={styles.loginLink}
          onPress={() => navigation.navigate('Auth', { initialMode: 'login' })}    >
          <Text style={styles.loginLinkText}>
            Already have an account?{' '}
            <Text style={styles.loginLinkHighlight}>Log In</Text>
          </Text>
        </TouchableOpacity>

        {/* Retake */}
        <TouchableOpacity
          onPress={() => navigation.replace('Questionnaire')}
          style={styles.retakeBtn}
        >
          <Text style={styles.retakeText}>↻ Retake Assessment</Text>
        </TouchableOpacity>

        {/* Disclaimer */}
        <DisclaimerStrip
          text="⚠️ This assessment is for informational purposes only. It is not a medical diagnosis. Always consult a healthcare professional."
        />

        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: colors.bg },
  container: { padding: spacing.xl },

  greeting: {
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.extrabold,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  greetingSub: {
    fontSize: fontSizes.sm,
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },

  heroCard: {
    borderWidth: 1.5,
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.lg,
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

  // Locked section (blurred preview)
  lockedSection: {
    marginBottom: spacing.lg,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  lockedOverlay: {
    backgroundColor: colors.bgCard,
    padding: spacing.lg,
    opacity: 0.5,
    position: 'relative',
  },
  lockedItem: {
    marginBottom: spacing.md,
  },
  lockedItemBar: {
    height: 6,
    backgroundColor: colors.bgElevated,
    borderRadius: radius.full,
    overflow: 'hidden',
    marginBottom: 4,
  },
  lockedItemFill: {
    height: '100%',
    backgroundColor: colors.textMuted,
    borderRadius: radius.full,
  },
  lockedItemText: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
  },
  lockBadge: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -20 }, { translateY: -20 }],
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.tintPrimaryStrong,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockIcon: { fontSize: 22 },

  // Notice banner
  noticeBanner: {
    flexDirection: 'row',
    backgroundColor: colors.tintPrimary,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 201, 167, 0.22)',
    borderRadius: radius.xl,
    padding: spacing.md,
    gap: spacing.md,
    marginBottom: spacing.lg,
    alignItems: 'flex-start',
  },
  noticeIcon: { fontSize: 24 },
  noticeTitle: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.bold,
    color: colors.primaryDark,
    marginBottom: 4,
  },
  noticeText: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },

  saveBtnOuter: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    marginBottom: spacing.md,
    ...shadow.button,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.xl,
    padding: spacing.md,
    gap: spacing.md,
  },
  saveBtnIcon: { fontSize: 24 },
  saveBtnText: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.bold,
    color: '#fff',
  },
  saveBtnSubtext: {
    fontSize: fontSizes.xs,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  saveBtnArrow: {
    fontSize: fontSizes.xl,
    color: '#fff',
    fontWeight: fontWeights.bold,
  },

  // Login link
  loginLink: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  loginLinkText: {
    fontSize: fontSizes.sm,
    color: colors.textMuted,
  },
  loginLinkHighlight: {
    color: colors.primaryDark,
    fontWeight: fontWeights.bold,
  },

  // Retake
  retakeBtn: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  retakeText: {
    color: colors.textMuted,
    fontSize: fontSizes.sm,
  },

  // Disclaimer
  disclaimer: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  disclaimerText: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    lineHeight: 18,
    textAlign: 'center',
  },
});
