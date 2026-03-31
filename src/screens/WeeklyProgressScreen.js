import React, { useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Dimensions,
} from 'react-native';
import Svg, { Rect, Defs, LinearGradient, Stop } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fontSizes, fontWeights, spacing, radius, shadow } from '../theme';
import { PrimaryButton, SectionHeader, StatCard } from '../components/UI';
import DisclaimerStrip from '../components/DisclaimerStrip';
import { useApp } from '../context/AppContext';
import { computeWeeklyTrend, calculateStreak } from '../utils/riskCalculator';

const { width } = Dimensions.get('window');
const CHART_PAD = spacing.xl * 2;
const CHART_INNER = width - CHART_PAD - 24;
const CHART_HEIGHT = 120;
const BAR_GAP = 6;

const METRICS = [
  { key: 'energyTrend', label: 'Energy', gradId: 'gE', emoji: '⚡' },
  { key: 'fatigueTrend', label: 'Fatigue', gradId: 'gF', emoji: '😴' },
  { key: 'moodTrend', label: 'Mood', gradId: 'gM', emoji: '🧠' },
  { key: 'sleepTrend', label: 'Sleep', gradId: 'gS', emoji: '💤' },
];

const GRADIENTS = {
  gE: ['#00C9A7', '#2DDCBC'],
  gF: ['#FBBF24', '#F59E0B'],
  gM: ['#34D399', '#059669'],
  gS: ['#818CF8', '#6366F1'],
};

function TrendChart({ data, labels, gradId }) {
  const max = 5;
  const n = (data || []).length || 7;
  const barSlot = CHART_INNER / n;
  const barW = Math.max(8, barSlot - BAR_GAP);
  const grad = GRADIENTS[gradId] || GRADIENTS.gE;

  return (
    <View style={chartStyles.wrap}>
      <Svg width={CHART_INNER + 24} height={CHART_HEIGHT + 28}>
        <Defs>
          <LinearGradient id={gradId} x1="0" y1="1" x2="0" y2="0">
            <Stop offset="0" stopColor={grad[0]} stopOpacity="1" />
            <Stop offset="1" stopColor={grad[1]} stopOpacity="1" />
          </LinearGradient>
        </Defs>
        {(data || []).map((val, i) => {
          const h = val != null ? Math.max(6, (val / max) * (CHART_HEIGHT - 8)) : 0;
          const x = 12 + i * barSlot + (barSlot - barW) / 2;
          const y = CHART_HEIGHT - h;
          return (
            <Rect
              key={i}
              x={x}
              y={y}
              width={barW}
              height={h}
              rx={7}
              ry={7}
              fill={`url(#${gradId})`}
            />
          );
        })}
      </Svg>
      <View style={chartStyles.labelsRow}>
        {(labels || []).map((lab, i) => (
          <Text key={i} style={chartStyles.barLabel} numberOfLines={1}>
            {lab}
          </Text>
        ))}
      </View>
    </View>
  );
}

export default function WeeklyProgressScreen({ navigation }) {
  const { state } = useApp();
  const { dailyLogs, riskResult, serverStreak, serverCheckinHistory } = state;
  const serverLogs = serverCheckinHistory || [];

  const serverTrend = useMemo(() => {
    if (!serverLogs.length) return null;
    const mapped = serverLogs.map((log) => ({
      date: log.checkin_date,
      answers: {
        daily_energy: { score: 4 - log.energy_score },
        daily_fatigue: { score: 4 - log.fatigue_score },
        daily_mood: { score: 4 - log.mood_score },
        daily_sleep: { score: 4 - log.sleep_score },
      },
    }));
    return computeWeeklyTrend(mapped);
  }, [serverLogs]);

  const localTrend = useMemo(() => computeWeeklyTrend(dailyLogs), [dailyLogs]);
  const localStreak = useMemo(() => calculateStreak(dailyLogs), [dailyLogs]);

  const trend = serverTrend || localTrend;
  const streak = serverStreak?.current_streak || localStreak;
  const totalLogs = serverStreak?.total_checkins || dailyLogs.length;
  const thisWeek = serverLogs.length || dailyLogs.filter((l) => {
    const d = new Date(l.date);
    const now = new Date();
    return (now - d) / (1000 * 60 * 60 * 24) < 7;
  }).length;

  const weekLogs = serverLogs.length > 0 ? serverLogs : dailyLogs.slice(-7);
  const avg = (key) => {
    if (!weekLogs.length) return null;
    if (serverLogs.length > 0) {
      const scoreMap = {
        daily_energy: 'energy_score',
        daily_fatigue: 'fatigue_score',
        daily_mood: 'mood_score',
        daily_sleep: 'sleep_score',
      };
      const field = scoreMap[key];
      if (!field) return null;
      const vals = weekLogs.map((l) => l[field]).filter((v) => v != null);
      if (!vals.length) return null;
      return Math.round((vals.reduce((s, v) => s + v, 0) / vals.length) * 10) / 10;
    }
    const vals = weekLogs.map((l) => l.answers?.[key]?.score).filter((v) => v != null);
    if (!vals.length) return null;
    const rawAvg = vals.reduce((s, v) => s + v, 0) / vals.length;
    return Math.round((5 - rawAvg) * 10) / 10;
  };

  const avgEnergy = avg('daily_energy');
  const avgFatigue = avg('daily_fatigue');
  const avgMood = avg('daily_mood');
  const avgSleep = avg('daily_sleep');
  const hasTrend = dailyLogs.length > 0 || serverLogs.length > 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.screenEyebrow}>Insights</Text>
        <Text style={styles.title}>Your progress</Text>
        <Text style={styles.subtitle}>
          {hasTrend
            ? `Tracking from your last ${Math.min(thisWeek, 7)} check-ins this week.`
            : 'Log how you feel each day — your trends will appear here.'}
        </Text>

        <DisclaimerStrip style={{ marginBottom: spacing.lg }} />

        <View style={styles.statsRow}>
          <StatCard icon="🔥" value={streak} label="Streak" color={colors.riskMedium} />
          <StatCard icon="📋" value={totalLogs} label="Total" color={colors.primary} />
          <StatCard icon="📅" value={thisWeek} label="This week" color={colors.accent} />
        </View>

        {hasTrend && (
          <>
            <SectionHeader title="This week (avg)" />
            <View style={styles.avgGrid}>
              {[
                { icon: '⚡', label: 'Energy', val: avgEnergy, c: colors.primary },
                { icon: '😴', label: 'Fatigue', val: avgFatigue, c: colors.riskMedium },
                { icon: '🧠', label: 'Mood', val: avgMood, c: colors.accent },
                { icon: '💤', label: 'Sleep', val: avgSleep, c: colors.violet },
              ].map(({ icon, label, val, c }) => (
                <View key={label} style={styles.avgCard}>
                  <Text style={styles.avgIcon}>{icon}</Text>
                  <Text style={[styles.avgVal, { color: c }]}>
                    {val != null ? `${val}/4` : '—'}
                  </Text>
                  <Text style={styles.avgLabel}>{label}</Text>
                </View>
              ))}
            </View>

            <SectionHeader title="7-day rhythm" />
            <Text style={styles.legendText}>
              Interpretation: higher bars mean stronger day scores. (Educational only)
            </Text>
            {METRICS.map(({ key, label, gradId, emoji }) => {
              const data = trend[key];
              if (!data?.some((v) => v != null)) return null;
              return (
                <View key={key} style={styles.chartCard}>
                  <View style={styles.chartHeader}>
                    <View style={styles.chartTitleRow}>
                      <Text style={styles.chartEmoji}>{emoji}</Text>
                      <Text style={styles.chartLabel}>{label}</Text>
                    </View>
                    <Text style={styles.chartHint}>Higher = better this week</Text>
                  </View>
                  <TrendChart data={data} labels={trend.labels} gradId={gradId} />
                </View>
              );
            })}

            {weekLogs.length >= 3 && (
              <>
                <SectionHeader title="Signals" />
                {avgFatigue != null && avgFatigue <= 2 && (
                  <View style={styles.alertCard}>
                    <Text style={styles.alertIcon}>💬</Text>
                    <Text style={styles.alertText}>
                      Fatigue has been high on several days. If it persists, consider speaking with a clinician.
                    </Text>
                  </View>
                )}
                {avgEnergy != null && avgEnergy <= 2 && (
                  <View style={styles.alertCard}>
                    <Text style={styles.alertIcon}>💬</Text>
                    <Text style={styles.alertText}>
                      Energy has been on the lower side — worth reviewing sleep, nutrition, and B12 sources with a professional.
                    </Text>
                  </View>
                )}
                {avgFatigue != null && avgFatigue > 3 && avgEnergy != null && avgEnergy > 3 && (
                  <View style={[styles.alertCard, styles.alertGood]}>
                    <Text style={styles.alertIcon}>✨</Text>
                    <Text style={[styles.alertText, { color: colors.riskLow }]}>
                      Nice — energy and fatigue look balanced this week.
                    </Text>
                  </View>
                )}
              </>
            )}
          </>
        )}

        {!hasTrend && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📈</Text>
            <Text style={styles.emptyTitle}>No rhythm yet</Text>
            <Text style={styles.emptyText}>
              Complete a few daily check-ins and we’ll chart how energy, mood, and sleep move together.
            </Text>
            <PrimaryButton
              label="Go to Daily check-in →"
              onPress={() => navigation.navigate('DailyCheckIn')}
              style={{ marginTop: spacing.lg }}
            />
          </View>
        )}

        {riskResult && (
          <>
            <SectionHeader title="Assessment context" />
            <View style={styles.riskContext}>
              <Text style={styles.riskContextIcon}>
                {riskResult.level === 'LOW' ? '✅' : riskResult.level === 'MEDIUM' ? '⚠️' : '❗'}
              </Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.riskContextTitle}>
                  {riskResult.level} · {riskResult.percentage}%
                </Text>
                <Text style={styles.riskContextText}>{riskResult.suggestions?.[0]}</Text>
              </View>
            </View>
          </>
        )}

        <View style={{ height: 88 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const chartStyles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingTop: spacing.sm },
  labelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: CHART_INNER + 24,
    paddingHorizontal: 4,
    marginTop: 8,
  },
  barLabel: {
    flex: 1,
    fontSize: 9,
    color: colors.textMuted,
    textAlign: 'center',
    fontWeight: fontWeights.medium,
  },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { padding: spacing.xl },
  screenEyebrow: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.semibold,
    color: colors.textMuted,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  title: {
    fontSize: fontSizes.xxl,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  legendText: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    marginTop: -spacing.sm,
    marginBottom: spacing.sm,
    lineHeight: 18,
  },
  statsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  avgGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.sm },
  avgCard: {
    width: '47%',
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.subtle,
  },
  avgIcon: { fontSize: 20, marginBottom: 4 },
  avgVal: { fontSize: fontSizes.lg, fontWeight: fontWeights.bold, marginBottom: 2 },
  avgLabel: { fontSize: fontSizes.xs, color: colors.textMuted, textAlign: 'center' },

  chartCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.subtle,
  },
  chartHeader: { marginBottom: spacing.sm },
  chartTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  chartEmoji: { fontSize: 18 },
  chartLabel: { fontSize: fontSizes.md, color: colors.textPrimary, fontWeight: fontWeights.bold },
  chartHint: { fontSize: fontSizes.xs, color: colors.textMuted, marginTop: 4 },

  alertCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.tintWarning,
    borderWidth: 1,
    borderColor: colors.tintWarningBorder,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  alertGood: {
    backgroundColor: colors.tintAccent,
    borderColor: colors.tintAccentBorder,
  },
  alertIcon: { fontSize: 18 },
  alertText: { flex: 1, fontSize: fontSizes.sm, color: colors.textSecondary, lineHeight: 20 },

  emptyState: { alignItems: 'center', paddingVertical: spacing.xxl },
  emptyEmoji: { fontSize: 56, marginBottom: spacing.md },
  emptyTitle: {
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: fontSizes.base,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 300,
  },

  riskContext: {
    flexDirection: 'row',
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.subtle,
  },
  riskContextIcon: { fontSize: 24 },
  riskContextTitle: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  riskContextText: { fontSize: fontSizes.sm, color: colors.textSecondary, lineHeight: 19 },
});
