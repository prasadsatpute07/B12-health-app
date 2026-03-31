import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fontSizes, fontWeights, spacing, radius, shadow } from '../theme';

const FOODS = [
  { name: 'Clams', emoji: '🦪', amount: '84.1 mcg', type: 'Seafood', desc: 'Highest natural source of B12.' },
  { name: 'Beef Liver', emoji: '🥩', amount: '70.6 mcg', type: 'Meat', desc: 'Extremely rich in B12 and iron.' },
  { name: 'Fortified Cereal', emoji: '🥣', amount: '6.0 mcg', type: 'Fortified', desc: 'Excellent vegan/vegetarian option.' },
  { name: 'Salmon', emoji: '🐟', amount: '4.8 mcg', type: 'Seafood', desc: 'Great for B12 and Omega-3s.' },
  { name: 'Nutritional Yeast', emoji: '🧀', amount: '2.4 mcg', type: 'Fortified', desc: 'A staple for vegans needing B12.' },
  { name: 'Milk', emoji: '🥛', amount: '1.2 mcg', type: 'Dairy', desc: 'Easily absorbed source for vegetarians.' },
  { name: 'Eggs', emoji: '🥚', amount: '0.6 mcg', type: 'Dairy/Poultry', desc: 'Good source, mostly in the yolk.' },
];

export default function B12FoodsScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>B12 Rich Foods</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>
          Incorporate these foods into your diet to naturally boost your Vitamin B12 levels.
        </Text>

        {FOODS.map((food, i) => (
          <View key={i} style={styles.card}>
            <View style={styles.emojiWrap}>
              <Text style={styles.emoji}>{food.emoji}</Text>
            </View>
            <View style={styles.cardContent}>
              <View style={styles.cardHeader}>
                <Text style={styles.foodName}>{food.name}</Text>
                <Text style={styles.foodAmount}>{food.amount}</Text>
              </View>
              <Text style={styles.foodType}>{food.type}</Text>
              <Text style={styles.foodDesc}>{food.desc}</Text>
            </View>
          </View>
        ))}

        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
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
  backBtn: { padding: spacing.sm },
  backArrow: { fontSize: fontSizes.xl, color: colors.textSecondary },
  headerTitle: { fontSize: fontSizes.lg, fontWeight: fontWeights.bold, color: colors.textPrimary },
  
  container: { padding: spacing.xl },
  subtitle: {
    fontSize: fontSizes.base,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
    lineHeight: 22,
  },

  card: {
    flexDirection: 'row',
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  emojiWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.tintPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(0, 201, 167, 0.30)',
  },
  emoji: { fontSize: 32 },
  cardContent: { flex: 1 },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  foodName: { fontSize: fontSizes.md, fontWeight: fontWeights.bold, color: colors.textPrimary },
  foodAmount: { fontSize: fontSizes.sm, fontWeight: fontWeights.bold, color: colors.primary },
  foodType: { fontSize: fontSizes.xs, color: colors.textMuted, textTransform: 'uppercase', marginBottom: spacing.sm },
  foodDesc: { fontSize: fontSizes.sm, color: colors.textSecondary, lineHeight: 20 },
});
