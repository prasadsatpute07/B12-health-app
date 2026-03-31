import React, { useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fontSizes, fontWeights, spacing, radius, shadow } from '../theme';
import { RiskBadge, SectionHeader } from '../components/UI';
import DisclaimerStrip from '../components/DisclaimerStrip';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { calculateStreak } from '../utils/riskCalculator';

const MOTIVATIONS = [
  "Small daily check-ins add up to big clarity.",
  "Building a habit your future self will thank you for.",
  "Consistency turns data into insight.",
  "Stay curious about how you feel - the first step to care.",
];

export default function DashboardScreen({ navigation }) {
  const { state } = useApp();
  const { logout } = useAuth();
  const { user, guestName, riskResult, dailyLogs, serverInsights, serverStreak } = state;

  const localStreak = useMemo(() => calculateStreak(dailyLogs), [dailyLogs]);
  const streak = serverStreak?.current_streak || localStreak;
  const today = new Date().toDateString();
  const checkedToday = dailyLogs.some((l) => new Date(l.date).toDateString() === today);

  const motivation = MOTIVATIONS[new Date().getDay() % MOTIVATIONS.length];

  const recentLogs = dailyLogs.slice(-7);
  const avgEnergy = recentLogs.length
    ? Math.round(
        recentLogs.reduce((sum, l) => {
          const e = l.answers?.daily_energy;
          return sum + (e ? 5 - e.score : 3);
        }, 0) / recentLogs.length
      )
    : null;

  const riskCfg = {
    LOW: { color: colors.riskLow, label: 'Lower concern' },
    MEDIUM: { color: colors.riskMedium, label: 'Moderate attention' },
    HIGH: { color: colors.riskHigh, label: 'Higher attention' },
  };
  const rc = riskResult ? riskCfg[riskResult.level] : null;
  const displayName = user?.name || guestName || 'there';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Hero header (dash-hero) ────────────────────── */}
        <LinearGradient
          colors={['rgba(0, 201, 167, 0.14)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroGradient}
        >
          {/* Ambient glow orb */}
          <View style={styles.heroOrb} />

          <Text style={styles.heroEyebrow}>Good morning ☀️</Text>
          <Text style={styles.heroGreeting}>{displayName}</Text>

          <View style={styles.streakPill}>
            <Text style={styles.streakEmoji}>🔥</Text>
            <Text style={styles.streakVal}>{streak}-day streak</Text>
          </View>
        </LinearGradient>

        <View style={styles.body}>
          {/* ─── Stat cards (dash-stats) ──────────────── */}
          <View style={styles.statRow}>
            <View style={styles.statCell}>
              <Text style={styles.statIcon}>⚡</Text>
              <Text style={[styles.statVal, { color: colors.primary }]}>
                {avgEnergy != null ? `${avgEnergy}` : '—'}
              </Text>
              <Text style={styles.statSub}>Energy</Text>
            </View>
            <View style={styles.statCell}>
              <Text style={styles.statIcon}>📝</Text>
              <Text style={styles.statVal}>{serverStreak?.total_checkins ?? dailyLogs.length}</Text>
              <Text style={styles.statSub}>Check-ins</Text>
            </View>
            <View style={styles.statCell}>
              <Text style={styles.statIcon}>🎯</Text>
              <Text style={[styles.statVal, { color: colors.cyan }]}>
                {riskResult ? `${riskResult.percentage}%` : '—'}
              </Text>
              <Text style={styles.statSub}>B12 Score</Text>
            </View>
          </View>

          {/* ─── Check-in CTA ────────────────────────── */}
          {!checkedToday ? (
            <TouchableOpacity
              style={styles.checkinCTA}
              onPress={() => navigation.navigate('DailyCheckIn')}
              activeOpacity={0.92}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.ctaTitle}>Today's Check-in</Text>
                <Text style={styles.ctaSub}>Not done yet · 3 min</Text>
              </View>
              <LinearGradient
                colors={[colors.gradientHeroStart, colors.primary, colors.mint]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.ctaBtnGrad}
              >
                <Text style={styles.ctaBtnText}>Start →</Text>
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <View style={styles.doneCard}>
              <Text style={styles.doneEmoji}>✅</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.doneTitle}>You're checked in today</Text>
                <Text style={styles.doneSub}>Come back tomorrow to keep your streak.</Text>
              </View>
            </View>
          )}

          {/* ─── AI Insight (dash-insight) ───────────── */}
          {serverInsights.length > 0 ? (
            serverInsights.slice(0, 2).map((insight, i) => (
              <View
                key={i}
                style={[
                  styles.insightCard,
                  insight.priority === 'high' && styles.insightHigh,
                ]}
              >
                <Text style={styles.insightLabel}>✨ AI INSIGHT</Text>
                <Text style={styles.insightBody}>{insight.message}</Text>
              </View>
            ))
          ) : (
            <View style={styles.insightCard}>
              <Text style={styles.insightLabel}>✨ AI INSIGHT</Text>
              <Text style={styles.insightBody}>{motivation}</Text>
            </View>
          )}

          {/* ─── Risk card (if available) ─────────────── */}
          {riskResult && (
            <TouchableOpacity
              style={styles.riskCard}
              onPress={() => navigation.navigate('Results')}
              activeOpacity={0.9}
            >
              <View style={styles.riskRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.riskLabel}>LATEST RESULT</Text>
                  <RiskBadge level={riskResult.level} />
                </View>
                <View style={styles.riskScore}>
                  <Text style={[styles.riskPct, { color: rc?.color }]}>{riskResult.percentage}%</Text>
                  <Text style={styles.riskHint}>score</Text>
                </View>
              </View>
              <Text style={styles.riskTap}>View full report →</Text>
            </TouchableOpacity>
          )}

          {!riskResult && (
            <TouchableOpacity
              style={styles.assessCard}
              onPress={() => navigation.navigate('Questionnaire')}
              activeOpacity={0.9}
            >
              <Text style={styles.assessEmoji}>📋</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.assessTitle}>Complete your B12 assessment</Text>
                <Text style={styles.assessSub}>~3 minutes · personalized risk overview</Text>
              </View>
              <View style={styles.assessGoBtn}>
                <Text style={styles.assessGoText}>Start</Text>
              </View>
            </TouchableOpacity>
          )}

          {riskResult?.suggestions?.length > 0 && (
            <>
              <SectionHeader title="Tip of the day" />
              <View style={styles.tipCard}>
                <Text style={styles.tipText}>{riskResult.suggestions[0]}</Text>
              </View>
            </>
          )}

          <DisclaimerStrip style={{ marginBottom: spacing.sm }} />

          {/* ─── Shortcuts (dash-shortcuts) ───────────── */}
          <View style={styles.shortcuts}>
            <Shortcut emoji="📊" label="Progress" onPress={() => navigation.navigate('Progress')} />
            <Shortcut emoji="🥗" label="Foods" onPress={() => navigation.navigate('B12Foods')} />
            <Shortcut emoji="👤" label="Profile" onPress={() => navigation.navigate('Profile')} />
            <Shortcut
              emoji="🚪"
              label="Log out"
              onPress={async () => {
                await logout();
                navigation.reset({ index: 0, routes: [{ name: 'Onboarding' }] });
              }}
            />
          </View>

          <View style={{ height: 88 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Shortcut({ emoji, label, onPress }) {
  return (
    <TouchableOpacity style={styles.shortcut} onPress={onPress} activeOpacity={0.88}>
      <Text style={styles.shortcutEmoji}>{emoji}</Text>
      <Text style={styles.shortcutLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgMid },
  scroll: { paddingBottom: spacing.xl },

  /* Hero — matches dash-hero */
  heroGradient: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    overflow: 'hidden',
  },
  heroOrb: {
    position: 'absolute',
    right: -20,
    top: -30,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(0, 201, 167, 0.12)',
  },
  heroEyebrow: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
    color: colors.primary,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  heroGreeting: {
    fontSize: 22,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  streakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(251, 191, 36, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.22)',
    borderRadius: radius.full,
    paddingHorizontal: 12,
    paddingVertical: 4,
    gap: 5,
    marginTop: 2,
  },
  streakEmoji: { fontSize: 13 },
  streakVal: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.semibold,
    color: colors.amber,
  },

  body: { paddingHorizontal: 14, paddingTop: 10 },

  /* Stat row — matches dash-stats */
  statRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 9,
  },
  statCell: {
    flex: 1,
    backgroundColor: colors.bgGlass,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 14,
    paddingVertical: 9,
    paddingHorizontal: 8,
    alignItems: 'center',
    ...shadow.subtle,
  },
  statIcon: { fontSize: 16, marginBottom: 3 },
  statVal: {
    fontSize: 18,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
  },
  statSub: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: fontWeights.semibold,
    marginTop: 2,
  },

  /* Check-in CTA — matches dash-cta */
  checkinCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 201, 167, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(0, 201, 167, 0.22)',
    borderRadius: 14,
    padding: 12,
    marginBottom: 9,
    gap: 8,
    ...shadow.subtle,
  },
  ctaTitle: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
  },
  ctaSub: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  ctaBtnGrad: {
    borderRadius: radius.full,
    paddingHorizontal: 16,
    paddingVertical: 7,
    ...shadow.button,
  },
  ctaBtnText: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
    color: '#fff',
  },

  /* Done card */
  doneCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accentSoft,
    borderRadius: 14,
    padding: 12,
    gap: spacing.md,
    marginBottom: 9,
    borderWidth: 1,
    borderColor: colors.tintAccentBorder,
  },
  doneEmoji: { fontSize: 28 },
  doneTitle: { fontSize: fontSizes.base, fontWeight: fontWeights.bold, color: colors.textPrimary },
  doneSub: { fontSize: fontSizes.sm, color: colors.textSecondary, marginTop: 2 },

  /* Insight — matches dash-insight */
  insightCard: {
    backgroundColor: colors.bgGlass,
    borderWidth: 1,
    borderColor: 'rgba(129, 140, 248, 0.18)',
    borderRadius: 14,
    padding: 11,
    marginBottom: 9,
    ...shadow.subtle,
  },
  insightHigh: {
    borderColor: 'rgba(251, 113, 133, 0.22)',
    backgroundColor: 'rgba(251, 113, 133, 0.05)',
  },
  insightLabel: {
    fontSize: 10,
    fontWeight: fontWeights.bold,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.violet,
    marginBottom: 5,
  },
  insightBody: { fontSize: fontSizes.sm, color: colors.textSecondary, lineHeight: 20 },

  /* Risk card */
  riskCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.xl,
    padding: spacing.md,
    marginBottom: 9,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.subtle,
  },
  riskRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.sm },
  riskLabel: {
    fontSize: 10,
    color: colors.textMuted,
    marginBottom: spacing.sm,
    fontWeight: fontWeights.bold,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  riskScore: { alignItems: 'flex-end' },
  riskPct: { fontSize: fontSizes.xxl, fontWeight: fontWeights.bold },
  riskHint: { fontSize: fontSizes.xs, color: colors.textMuted },
  riskTap: { fontSize: fontSizes.sm, color: colors.primary, fontWeight: fontWeights.semibold, textAlign: 'right' },

  /* Assessment card */
  assessCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: 14,
    padding: 12,
    gap: 10,
    marginBottom: 9,
    borderWidth: 2,
    borderColor: colors.tintPrimaryStrong,
    borderStyle: 'dashed',
  },
  assessEmoji: { fontSize: 28 },
  assessTitle: { fontSize: fontSizes.base, fontWeight: fontWeights.bold, color: colors.textPrimary },
  assessSub: { fontSize: fontSizes.xs, color: colors.textMuted, marginTop: 4 },
  assessGoBtn: {
    backgroundColor: colors.tintPrimary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.full,
  },
  assessGoText: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
    color: colors.primary,
  },

  /* Tip */
  tipCard: {
    backgroundColor: colors.bgCard,
    borderRadius: 14,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 9,
  },
  tipText: { fontSize: fontSizes.sm, color: colors.textSecondary, lineHeight: 21 },

  /* Shortcuts — matches dash-shortcuts (4-grid) */
  shortcuts: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: spacing.lg,
  },
  shortcut: {
    flex: 1,
    backgroundColor: colors.bgCard,
    borderRadius: 13,
    paddingVertical: 9,
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    gap: 4,
  },
  shortcutEmoji: { fontSize: 17, marginBottom: 2 },
  shortcutLabel: {
    fontSize: 10,
    fontWeight: fontWeights.semibold,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
