import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fontSizes, fontWeights, spacing, radius } from '../theme';

export default function DisclaimerStrip({ text }) {
  return (
    <View style={styles.strip}>
      <Text style={styles.icon}>ℹ️</Text>
      <Text style={styles.text}>
        {text || 'Educational purpose only — this is not a medical diagnosis.'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  strip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.tintWarning,
    borderWidth: 1,
    borderColor: colors.tintWarningBorder,
    borderRadius: radius.md,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
    gap: 8,
  },
  icon: {
    fontSize: 14,
  },
  text: {
    flex: 1,
    fontSize: fontSizes.xs,
    color: colors.amber,
    fontWeight: fontWeights.medium,
    lineHeight: 16,
  },
});
