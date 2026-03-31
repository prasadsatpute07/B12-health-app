import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fontSizes, fontWeights, spacing, radius, shadow } from '../theme';

// ─── PrimaryButton ────────────────────────────────────────────────────────────
export const PrimaryButton = ({ label, onPress, disabled, loading, style }) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={disabled || loading}
    activeOpacity={0.88}
    style={[styles.primaryBtnOuter, disabled && styles.primaryBtnDisabled, style]}
  >
    <LinearGradient
      colors={[colors.gradientHeroStart, colors.primary, colors.mint]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.primaryBtnGradient}
    >
      {loading ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : (
        <Text style={styles.primaryBtnText}>{label}</Text>
      )}
    </LinearGradient>
  </TouchableOpacity>
);

// ─── SecondaryButton ──────────────────────────────────────────────────────────
export const SecondaryButton = ({ label, onPress, style }) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.78} style={[styles.secondaryBtn, style]}>
    <Text style={styles.secondaryBtnText}>{label}</Text>
  </TouchableOpacity>
);

// ─── OptionChip ───────────────────────────────────────────────────────────────
export const OptionChip = ({ label, emoji, selected, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.82}
    style={[styles.chip, selected && styles.chipSelected]}
  >
    {emoji ? <Text style={styles.chipEmoji}>{emoji}</Text> : null}
    <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>
      {label}
    </Text>
  </TouchableOpacity>
);

// ─── ProgressBar ─────────────────────────────────────────────────────────────
export const ProgressBar = ({ progress, total, color = colors.primary }) => {
  const pct = Math.min((progress / total) * 100, 100);
  return (
    <View style={styles.progressWrap}>
      <View style={styles.progressTrack}>
        <LinearGradient
          colors={[colors.primary, colors.cyan]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.progressFill, { width: `${pct}%` }]}
        />
      </View>
      <Text style={styles.progressLabel}>{progress}/{total}</Text>
    </View>
  );
};

// ─── CategoryBadge ────────────────────────────────────────────────────────────
export const CategoryBadge = ({ icon, label }) => (
  <View style={styles.catBadge}>
    <Text style={styles.catIcon}>{icon}</Text>
    <Text style={styles.catLabel}>{label}</Text>
  </View>
);

// ─── InsightCard ─────────────────────────────────────────────────────────────
export const InsightCard = ({ text }) => (
  <View style={styles.insightCard}>
    <Text style={styles.insightIcon}>💡</Text>
    <Text style={styles.insightText}>{text}</Text>
  </View>
);

// ─── RiskBadge ───────────────────────────────────────────────────────────────
export const RiskBadge = ({ level }) => {
  const config = {
    LOW: {
      color: colors.riskLow,
      bg: colors.riskBgLow,
      label: 'Low risk',
    },
    MEDIUM: {
      color: colors.riskMedium,
      bg: colors.riskBgMedium,
      label: 'Medium risk',
    },
    HIGH: {
      color: colors.riskHigh,
      bg: colors.riskBgHigh,
      label: 'High risk',
    },
  };
  const c = config[level] || config.LOW;
  return (
    <View style={[styles.riskBadge, { backgroundColor: c.bg, borderColor: c.color }]}>
      <Text style={[styles.riskLabel, { color: c.color }]}>{c.label}</Text>
    </View>
  );
};

// ─── SectionHeader ────────────────────────────────────────────────────────────
export const SectionHeader = ({ title }) => (
  <Text style={styles.sectionHeader}>{title}</Text>
);

// ─── StatCard ─────────────────────────────────────────────────────────────────
export const StatCard = ({ icon, value, label, color = colors.primary, style }) => (
  <View style={[styles.statCard, style]}>
    <Text style={styles.statIcon}>{icon}</Text>
    <Text style={[styles.statValue, { color }]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  primaryBtnOuter: {
    borderRadius: radius.full,
    overflow: 'hidden',
    ...shadow.button,
  },
  primaryBtnDisabled: {
    opacity: 0.5,
  },
  primaryBtnGradient: {
    paddingVertical: 16,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
    width: '100%',
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: fontSizes.md,
    fontWeight: fontWeights.bold,
    letterSpacing: 0.3,
  },
  secondaryBtn: {
    borderWidth: 1.5,
    borderColor: colors.borderTeal,
    backgroundColor: colors.tintPrimary,
    borderRadius: radius.full,
    paddingVertical: 14,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: colors.primaryLight,
    fontSize: fontSizes.base,
    fontWeight: fontWeights.semibold,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginVertical: 5,
  },
  chipSelected: {
    backgroundColor: colors.tintPrimaryStrong,
    borderColor: 'rgba(0, 201, 167, 0.40)',
  },
  chipEmoji: {
    fontSize: 18,
    marginRight: 10,
  },
  chipLabel: {
    fontSize: fontSizes.base,
    color: colors.textSecondary,
    fontWeight: fontWeights.medium,
  },
  chipLabelSelected: {
    color: colors.textPrimary,
    fontWeight: fontWeights.semibold,
  },
  progressWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: radius.full,
  },
  progressLabel: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    minWidth: 36,
    textAlign: 'right',
    fontWeight: fontWeights.medium,
  },
  catBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.tintPrimary,
    borderRadius: radius.full,
    paddingHorizontal: 14,
    paddingVertical: 7,
    alignSelf: 'flex-start',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.tintAccentBorder,
  },
  catIcon: { fontSize: 14 },
  catLabel: {
    fontSize: fontSizes.xs,
    color: colors.primaryLight,
    fontWeight: fontWeights.semibold,
    letterSpacing: 0.2,
  },
  insightCard: {
    flexDirection: 'row',
    backgroundColor: colors.bgGlass,
    borderLeftWidth: 4,
    borderLeftColor: colors.violet,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.tintVioletBorder,
  },
  insightIcon: { fontSize: 16, marginTop: 1 },
  insightText: {
    flex: 1,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    lineHeight: 21,
  },
  riskBadge: {
    borderWidth: 1.5,
    borderRadius: radius.full,
    paddingHorizontal: 14,
    paddingVertical: 7,
    alignSelf: 'flex-start',
  },
  riskLabel: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
    letterSpacing: 0.2,
  },
  sectionHeader: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.semibold,
    color: colors.textMuted,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
    marginTop: spacing.lg,
  },
  statCard: {
    backgroundColor: colors.bgGlass,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
    flex: 1,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadow.subtle,
  },
  statIcon: { fontSize: 22, marginBottom: 6 },
  statValue: {
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.extrabold,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    textAlign: 'center',
    fontWeight: fontWeights.medium,
  },
});
