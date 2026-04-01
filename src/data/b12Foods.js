// ─── B12 Rich Foods — tagged by diet type and calorie tier ───────────────────
// dietTags: which diet types CAN eat this food
//   'vegan', 'vegetarian', 'pescatarian', 'omnivore'
// calorieTier: 'high' | 'moderate' | 'low'
//   Used to match BMI recommendations:
//   Underweight (<18.5)  → prefer 'high'
//   Normal (18.5-24.9)   → show all (sorted by B12 content)
//   Overweight (25-29.9) → prefer 'low'
//   Obese (≥30)          → prefer 'low'

export const B12_FOODS = [
  // ── SEAFOOD (pescatarian + omnivore) ──────────────────────────────────────
  {
    name: 'Clams',
    emoji: '🦪',
    b12mcg: 84.1,
    type: 'Seafood',
    dietTags: ['pescatarian', 'omnivore'],
    calorieTier: 'low',
    calories: 74,
    desc: 'Highest natural B12 source. Low-fat, high-protein — ideal for weight management.',
  },
  {
    name: 'Mussels',
    emoji: '🐚',
    b12mcg: 20.4,
    type: 'Seafood',
    dietTags: ['pescatarian', 'omnivore'],
    calorieTier: 'low',
    calories: 86,
    desc: 'Excellent lean B12 source with iron and omega-3s.',
  },
  {
    name: 'Oysters',
    emoji: '🦪',
    b12mcg: 16.0,
    type: 'Seafood',
    dietTags: ['pescatarian', 'omnivore'],
    calorieTier: 'low',
    calories: 68,
    desc: 'Rich in B12, zinc, and selenium. Very low calorie.',
  },
  {
    name: 'Rainbow Trout',
    emoji: '🐟',
    b12mcg: 5.4,
    type: 'Seafood',
    dietTags: ['pescatarian', 'omnivore'],
    calorieTier: 'moderate',
    calories: 168,
    desc: 'Lean fish with very high B12 content.',
  },
  {
    name: 'Salmon',
    emoji: '🐠',
    b12mcg: 4.8,
    type: 'Seafood',
    dietTags: ['pescatarian', 'omnivore'],
    calorieTier: 'moderate',
    calories: 208,
    desc: 'Great for B12 and heart-healthy Omega-3 fatty acids.',
  },
  {
    name: 'Sardines (canned)',
    emoji: '🐟',
    b12mcg: 8.9,
    type: 'Seafood',
    dietTags: ['pescatarian', 'omnivore'],
    calorieTier: 'moderate',
    calories: 208,
    desc: 'Affordable, convenient B12 powerhouse with omega-3s.',
  },
  {
    name: 'Tuna (canned)',
    emoji: '🐟',
    b12mcg: 2.5,
    type: 'Seafood',
    dietTags: ['pescatarian', 'omnivore'],
    calorieTier: 'low',
    calories: 132,
    desc: 'Affordable, high-protein, low-fat B12 source.',
  },

  // ── MEAT (omnivore only) ──────────────────────────────────────────────────
  {
    name: 'Beef Liver',
    emoji: '🫀',
    b12mcg: 70.6,
    type: 'Meat',
    dietTags: ['omnivore'],
    calorieTier: 'high',
    calories: 175,
    desc: 'Richest B12 source in nature. Also high in iron. Best if underweight.',
  },
  {
    name: 'Chicken Liver',
    emoji: '🍗',
    b12mcg: 16.6,
    type: 'Meat',
    dietTags: ['omnivore'],
    calorieTier: 'moderate',
    calories: 167,
    desc: 'Great B12 with moderate calories. Rich in folate too.',
  },
  {
    name: 'Lean Ground Beef',
    emoji: '🥩',
    b12mcg: 2.4,
    type: 'Meat',
    dietTags: ['omnivore'],
    calorieTier: 'high',
    calories: 215,
    desc: 'Everyday red meat B12 source. Choose lean cuts.',
  },
  {
    name: 'Lamb',
    emoji: '🍖',
    b12mcg: 2.7,
    type: 'Meat',
    dietTags: ['omnivore'],
    calorieTier: 'high',
    calories: 258,
    desc: 'Rich in B12, iron, and zinc. Higher in calories.',
  },

  // ── DAIRY (vegetarian, pescatarian, omnivore) ─────────────────────────────
  {
    name: 'Skim Milk',
    emoji: '🥛',
    b12mcg: 1.2,
    type: 'Dairy',
    dietTags: ['vegetarian', 'pescatarian', 'omnivore'],
    calorieTier: 'low',
    calories: 83,
    desc: 'Same B12 as whole milk, far fewer calories. Great for calorie management.',
  },
  {
    name: 'Whole Milk',
    emoji: '🍶',
    b12mcg: 1.2,
    type: 'Dairy',
    dietTags: ['vegetarian', 'pescatarian', 'omnivore'],
    calorieTier: 'moderate',
    calories: 149,
    desc: 'Classic vegetarian B12 source. Easily absorbed.',
  },
  {
    name: 'Greek Yogurt',
    emoji: '🥣',
    b12mcg: 1.3,
    type: 'Dairy',
    dietTags: ['vegetarian', 'pescatarian', 'omnivore'],
    calorieTier: 'low',
    calories: 100,
    desc: 'High protein, probiotic-rich B12 source. Low calorie per serving.',
  },
  {
    name: 'Swiss Cheese',
    emoji: '🧀',
    b12mcg: 1.7,
    type: 'Dairy',
    dietTags: ['vegetarian', 'pescatarian', 'omnivore'],
    calorieTier: 'high',
    calories: 380,
    desc: 'Highest B12 among cheeses. Best enjoyed in moderation.',
  },
  {
    name: 'Cottage Cheese',
    emoji: '🍦',
    b12mcg: 0.6,
    type: 'Dairy',
    dietTags: ['vegetarian', 'pescatarian', 'omnivore'],
    calorieTier: 'low',
    calories: 98,
    desc: 'Low calorie, high protein. Great for weight management with B12.',
  },

  // ── EGGS (vegetarian, pescatarian, omnivore) ──────────────────────────────
  {
    name: 'Eggs',
    emoji: '🥚',
    b12mcg: 0.6,
    type: 'Eggs',
    dietTags: ['vegetarian', 'pescatarian', 'omnivore'],
    calorieTier: 'moderate',
    calories: 155,
    desc: 'Versatile B12 source. The yolk contains most of the B12.',
  },

  // ── FORTIFIED / PLANT (all diets including vegan) ─────────────────────────
  {
    name: 'Nutritional Yeast',
    emoji: '🌿',
    b12mcg: 24.0,
    type: 'Fortified',
    dietTags: ['vegan', 'vegetarian', 'pescatarian', 'omnivore'],
    calorieTier: 'low',
    calories: 60,
    desc: 'Best vegan B12 source. Sprinkle on meals. Always choose fortified.',
  },
  {
    name: 'Fortified Cereal',
    emoji: '🥣',
    b12mcg: 6.0,
    type: 'Fortified',
    dietTags: ['vegan', 'vegetarian', 'pescatarian', 'omnivore'],
    calorieTier: 'moderate',
    calories: 110,
    desc: 'Easy daily B12 hit. Check the label — look for 100% B12 DV.',
  },
  {
    name: 'Fortified Soy Milk',
    emoji: '🥤',
    b12mcg: 2.7,
    type: 'Fortified',
    dietTags: ['vegan', 'vegetarian', 'pescatarian', 'omnivore'],
    calorieTier: 'low',
    calories: 80,
    desc: 'Best plant milk for B12 content. Great for vegans.',
  },
  {
    name: 'Fortified Almond Milk',
    emoji: '🥤',
    b12mcg: 1.5,
    type: 'Fortified',
    dietTags: ['vegan', 'vegetarian', 'pescatarian', 'omnivore'],
    calorieTier: 'low',
    calories: 30,
    desc: 'Very low calorie. Check for B12 fortification on label.',
  },
  {
    name: 'Fortified Oat Milk',
    emoji: '🫙',
    b12mcg: 1.2,
    type: 'Fortified',
    dietTags: ['vegan', 'vegetarian', 'pescatarian', 'omnivore'],
    calorieTier: 'low',
    calories: 120,
    desc: 'Popular plant milk with B12 fortification.',
  },
  {
    name: 'Tempeh',
    emoji: '🌱',
    b12mcg: 0.1,
    type: 'Plant',
    dietTags: ['vegan', 'vegetarian', 'pescatarian', 'omnivore'],
    calorieTier: 'moderate',
    calories: 193,
    desc: 'Fermented soy with trace B12. Combine with fortified foods for best results.',
  },
];

// ── BMI calculation helper ────────────────────────────────────────────────────
export const calculateBMI = (heightCm, weightKg) => {
  const h = heightCm / 100;
  return Math.round((weightKg / (h * h)) * 10) / 10;
};

export const getBMICategory = (bmi) => {
  if (bmi < 18.5) return 'underweight';
  if (bmi < 25)   return 'normal';
  if (bmi < 30)   return 'overweight';
  return 'obese';
};

// ── Food filtering + sorting ──────────────────────────────────────────────────
export const getRecommendedFoods = (dietType, bmiCategory) => {
  // Step 1: filter by diet type
  const diet = dietType || 'omnivore';
  const dietFiltered = B12_FOODS.filter((f) => f.dietTags.includes(diet));

  // Step 2: determine preferred calorie tier based on BMI
  let preferredTier = null;
  if (bmiCategory === 'underweight') preferredTier = 'high';
  else if (bmiCategory === 'overweight' || bmiCategory === 'obese') preferredTier = 'low';

  // Step 3: sort — preferred tier first, then by B12 content descending
  const tierOrder = { high: 0, moderate: 1, low: 2 };
  if (preferredTier === 'low') tierOrder.low = 0;
  else if (preferredTier === 'high') { tierOrder.high = 0; tierOrder.moderate = 1; tierOrder.low = 2; }

  return [...dietFiltered].sort((a, b) => {
    const tierDiff = (tierOrder[a.calorieTier] ?? 1) - (tierOrder[b.calorieTier] ?? 1);
    if (tierDiff !== 0) return tierDiff;
    return b.b12mcg - a.b12mcg; // higher B12 first within same tier
  });
};

// ── BMI UI helpers ────────────────────────────────────────────────────────────
export const BMI_INFO = {
  underweight: {
    label: 'Underweight',
    icon: '⬆️',
    color: '#60A5FA',
    tip: 'Focus on calorie-dense B12 foods to support healthy weight gain.',
    preferLabel: 'High-Calorie B12 Sources',
  },
  normal: {
    label: 'Normal Weight',
    icon: '✅',
    color: '#00C9A7',
    tip: 'Great! Maintain a balanced mix of B12 sources for optimal health.',
    preferLabel: 'Balanced B12 Sources',
  },
  overweight: {
    label: 'Overweight',
    icon: '⚖️',
    color: '#FBBF24',
    tip: 'Choose low-calorie B12 sources to support your health goals.',
    preferLabel: 'Light & B12-Rich Foods',
  },
  obese: {
    label: 'High BMI',
    icon: '💪',
    color: '#F87171',
    tip: 'Prioritize low-calorie, nutrient-dense B12 foods for your journey.',
    preferLabel: 'Low-Calorie B12 Sources',
  },
};
