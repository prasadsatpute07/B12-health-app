// ─── B12 Questionnaire Data ───────────────────────────────────────────────────
// All questions structured with scoring, categories, filters

export const DIET_TYPES = [
  { id: 'vegan',       label: 'Vegan',        icon: '🌱', weight: 3 },
  { id: 'vegetarian',  label: 'Vegetarian',   icon: '🥦', weight: 2 },
  { id: 'pescatarian', label: 'Pescatarian',  icon: '🐟', weight: 1 },
  { id: 'omnivore',    label: 'Non-Veg',      icon: '🍖', weight: 0 },
];

export const FREQUENCY_OPTIONS = [
  { id: 'never',     label: 'Never',      score: 0 },
  { id: 'rarely',    label: 'Rarely',     score: 1 },
  { id: 'sometimes', label: 'Sometimes',  score: 2 },
  { id: 'often',     label: 'Often',      score: 3 },
  { id: 'always',    label: 'Always',     score: 4 },
];

export const YES_NO_OPTIONS = [
  { id: 'yes', label: 'Yes', score: 3 },
  { id: 'no',  label: 'No',  score: 0 },
];

export const SLEEP_OPTIONS = [
  { id: 'great',  label: '😴 Great',   score: 0 },
  { id: 'good',   label: '🙂 Good',    score: 1 },
  { id: 'fair',   label: '😐 Fair',    score: 2 },
  { id: 'poor',   label: '😫 Poor',    score: 3 },
];

export const MOOD_OPTIONS = [
  { id: 'happy',    label: '😄 Happy',     score: 0 },
  { id: 'neutral',  label: '😐 Neutral',   score: 1 },
  { id: 'low',      label: '😔 Low',       score: 2 },
  { id: 'irritable',label: '😤 Irritable', score: 3 },
];

export const B12_FOOD_OPTIONS = [
  { id: 'daily',   label: 'Daily',         score: 0 },
  { id: 'weekly',  label: 'A few/week',    score: 1 },
  { id: 'monthly', label: 'A few/month',   score: 2 },
  { id: 'rarely',  label: 'Rarely/Never',  score: 3 },
];

// ─── COMMON QUESTIONS (all users see these) ──────────────────────────────────
export const COMMON_QUESTIONS = [
  {
    id: 'fatigue_frequency',
    category: 'Energy & Fatigue',
    categoryIcon: '⚡',
    question: 'How often do you feel tired without doing heavy work?',
    insight: 'Persistent fatigue without exertion is one of the earliest and most common signs of Vitamin B12 deficiency.',
    type: 'frequency',
    options: FREQUENCY_OPTIONS,
    weight: 3,
  },
  {
    id: 'weakness_after_rest',
    category: 'Energy & Fatigue',
    categoryIcon: '⚡',
    question: 'Do you feel weak or drained even after a full night of rest?',
    insight: 'Weakness despite adequate sleep can signal a nutritional imbalance — particularly low B12 or iron.',
    type: 'frequency',
    options: FREQUENCY_OPTIONS,
    weight: 3,
  },
  {
    id: 'low_energy_day',
    category: 'Energy & Fatigue',
    categoryIcon: '⚡',
    question: 'Do you experience low energy during the day?',
    insight: 'Daytime energy crashes often correlate with poor vitamin and nutrient absorption.',
    type: 'frequency',
    options: FREQUENCY_OPTIONS,
    weight: 2,
  },
  {
    id: 'tingling_numbness',
    category: 'Neurological',
    categoryIcon: '🧠',
    question: 'Do you feel tingling or numbness in your hands or feet?',
    insight: 'Tingling sensations can indicate nerve-related issues directly linked to B12 deficiency.',
    type: 'frequency',
    options: FREQUENCY_OPTIONS,
    weight: 4,
  },
  {
    id: 'concentration',
    category: 'Neurological',
    categoryIcon: '🧠',
    question: 'Do you face difficulty concentrating or staying focused?',
    insight: 'Vitamin B12 plays a critical role in brain function, including focus and cognitive performance.',
    type: 'frequency',
    options: FREQUENCY_OPTIONS,
    weight: 3,
  },
  {
    id: 'memory_issues',
    category: 'Neurological',
    categoryIcon: '🧠',
    question: 'Do you experience memory problems or brain fog?',
    insight: 'Memory lapses and foggy thinking can be early indicators of B12 deficiency.',
    type: 'frequency',
    options: FREQUENCY_OPTIONS,
    weight: 3,
  },
  {
    id: 'mood',
    category: 'Mood',
    categoryIcon: '😔',
    question: 'Do you frequently feel low mood or irritability without clear reason?',
    insight: 'Nutritional deficiencies, especially B12, can significantly affect mood regulation and emotional balance.',
    type: 'frequency',
    options: FREQUENCY_OPTIONS,
    weight: 2,
  },
  {
    id: 'b12_food_intake',
    category: 'Diet',
    categoryIcon: '🥩',
    question: 'How often do you eat B12-rich foods? (meat, fish, eggs, dairy, fortified cereals)',
    insight: 'Low dietary B12 intake is the most preventable cause of deficiency, especially in plant-based diets.',
    type: 'custom',
    options: B12_FOOD_OPTIONS,
    weight: 4,
  },
  {
    id: 'sleep_quality',
    category: 'Lifestyle',
    categoryIcon: '💤',
    question: 'How would you rate your overall sleep quality?',
    insight: 'Poor sleep can worsen fatigue and compound the effects of vitamin deficiency.',
    type: 'custom',
    options: SLEEP_OPTIONS,
    weight: 2,
  },
  {
    id: 'dizziness',
    category: 'Lifestyle',
    categoryIcon: '💫',
    question: 'Do you experience dizziness or lightheadedness?',
    insight: 'Dizziness may be linked to anemia caused by low B12 levels.',
    type: 'frequency',
    options: FREQUENCY_OPTIONS,
    weight: 3,
  },
];

// ─── AGE-BASED QUESTIONS ─────────────────────────────────────────────────────
export const AGE_QUESTIONS = {
  '15-24': [
    {
      id: 'skip_meals_young',
      category: 'Diet Habits',
      categoryIcon: '🍔',
      question: 'Do you skip meals frequently during the day?',
      insight: 'Skipping meals disrupts nutrient absorption patterns, increasing deficiency risk.',
      type: 'yesno',
      options: YES_NO_OPTIONS,
      weight: 2,
    },
    {
      id: 'junk_food',
      category: 'Diet Habits',
      categoryIcon: '🍟',
      question: 'Do you rely heavily on junk or processed food?',
      insight: 'Processed foods contain little to no B12 and deplete essential nutrients.',
      type: 'yesno',
      options: YES_NO_OPTIONS,
      weight: 2,
    },
    {
      id: 'irregular_sleep_young',
      category: 'Sleep',
      categoryIcon: '🌙',
      question: 'Do you have irregular sleep patterns? (sleeping at different times each night)',
      insight: 'Irregular sleep cycles disrupt the body\'s recovery, worsening nutritional deficiencies.',
      type: 'yesno',
      options: YES_NO_OPTIONS,
      weight: 2,
    },
  ],
  '25-40': [
    {
      id: 'skip_meals_work',
      category: 'Work Lifestyle',
      categoryIcon: '💼',
      question: 'Do you skip meals due to a busy work schedule?',
      insight: 'Work-driven meal skipping is a leading cause of nutritional gaps in adults.',
      type: 'frequency',
      options: FREQUENCY_OPTIONS,
      weight: 2,
    },
    {
      id: 'caffeine_reliance',
      category: 'Work Lifestyle',
      categoryIcon: '☕',
      question: 'Do you rely on caffeine (coffee/energy drinks) to get through the day?',
      insight: 'High caffeine reliance often masks fatigue caused by underlying B12 deficiency.',
      type: 'frequency',
      options: FREQUENCY_OPTIONS,
      weight: 2,
    },
    {
      id: 'drained_after_work',
      category: 'Work Lifestyle',
      categoryIcon: '😮‍💨',
      question: 'Do you feel completely drained after a regular workday?',
      insight: 'Disproportionate fatigue relative to effort is a common B12 deficiency symptom.',
      type: 'frequency',
      options: FREQUENCY_OPTIONS,
      weight: 3,
    },
  ],
  '41-60': [
    {
      id: 'tired_after_rest_mid',
      category: 'Fatigue',
      categoryIcon: '🛋️',
      question: 'Do you frequently feel tired even after resting?',
      insight: 'B12 absorption naturally decreases with age, making deficiency more common after 40.',
      type: 'frequency',
      options: FREQUENCY_OPTIONS,
      weight: 3,
    },
    {
      id: 'digestive_issues',
      category: 'Digestive Health',
      categoryIcon: '🫁',
      question: 'Do you experience digestive issues like bloating or indigestion?',
      insight: 'Poor gut health significantly reduces B12 absorption capacity in middle-aged adults.',
      type: 'frequency',
      options: FREQUENCY_OPTIONS,
      weight: 2,
    },
  ],
  '60+': [
    {
      id: 'balance_issues',
      category: 'Neurological',
      categoryIcon: '🦵',
      question: 'Do you experience balance problems or unsteadiness when walking?',
      insight: 'Balance issues in older adults are a serious neurological symptom of long-term B12 deficiency.',
      type: 'frequency',
      options: FREQUENCY_OPTIONS,
      weight: 4,
    },
    {
      id: 'frequent_numbness',
      category: 'Neurological',
      categoryIcon: '🤲',
      question: 'Do you frequently experience numbness or tingling in your limbs?',
      insight: 'Frequent numbness in seniors often indicates advanced nerve damage from B12 deficiency.',
      type: 'frequency',
      options: FREQUENCY_OPTIONS,
      weight: 4,
    },
  ],
};

// ─── GENDER-BASED QUESTIONS ───────────────────────────────────────────────────
export const GENDER_QUESTIONS = {
  female: [
    {
      id: 'heavy_bleeding',
      category: 'Female Health',
      categoryIcon: '🩸',
      question: 'Do you experience heavy menstrual bleeding?',
      insight: 'Heavy bleeding leads to significant iron and B12 loss, increasing deficiency risk.',
      type: 'yesno',
      options: YES_NO_OPTIONS,
      weight: 3,
    },
    {
      id: 'period_fatigue',
      category: 'Female Health',
      categoryIcon: '🔋',
      question: 'Do you feel significantly more fatigued during your periods?',
      insight: 'Cycle-related fatigue can be both a symptom and amplifier of nutritional deficiencies.',
      type: 'yesno',
      options: YES_NO_OPTIONS,
      weight: 2,
    },
    {
      id: 'irregular_periods',
      category: 'Female Health',
      categoryIcon: '📅',
      question: 'Are your periods irregular?',
      insight: 'Irregular cycles can be connected to hormonal imbalances influenced by nutritional status.',
      type: 'yesno',
      options: YES_NO_OPTIONS,
      weight: 2,
    },
    {
      id: 'period_dizziness',
      category: 'Female Health',
      categoryIcon: '💫',
      question: 'Do you feel dizzy during or after your period?',
      insight: 'Dizziness around the cycle can signal anemia linked to blood-loss and low B12.',
      type: 'yesno',
      options: YES_NO_OPTIONS,
      weight: 3,
    },
    {
      id: 'pregnant_postpartum',
      category: 'Female Health',
      categoryIcon: '🤰',
      question: 'Are you currently pregnant or in the postpartum period?',
      insight: 'Pregnancy and breastfeeding dramatically increase B12 requirements.',
      type: 'yesno',
      options: YES_NO_OPTIONS,
      weight: 4,
    },
  ],
  male: [
    {
      id: 'low_energy_rest_male',
      category: 'Energy',
      categoryIcon: '⚡',
      question: 'Do you experience consistently low energy despite adequate rest?',
      insight: 'Unexplained energy crashes in men often point to nutritional deficiencies including B12.',
      type: 'frequency',
      options: FREQUENCY_OPTIONS,
      weight: 3,
    },
    {
      id: 'unexplained_weakness',
      category: 'Physical',
      categoryIcon: '💪',
      question: 'Do you experience unexplained physical weakness or reduced strength?',
      insight: 'B12 deficiency can impair muscle function and physical performance.',
      type: 'frequency',
      options: FREQUENCY_OPTIONS,
      weight: 3,
    },
  ],
};

// ─── DAILY CHECK-IN QUESTIONS ─────────────────────────────────────────────────
export const DAILY_CHECKIN = [
  {
    id: 'daily_energy',
    question: 'How is your energy today?',
    icon: '⚡',
    type: 'scale5',
    options: [
      { id: '1', label: 'Very Low',  emoji: '😴', score: 4 },
      { id: '2', label: 'Low',       emoji: '😔', score: 3 },
      { id: '3', label: 'Moderate',  emoji: '😐', score: 2 },
      { id: '4', label: 'Good',      emoji: '🙂', score: 1 },
      { id: '5', label: 'Excellent', emoji: '😄', score: 0 },
    ],
  },
  {
    id: 'daily_fatigue',
    question: 'How tired do you feel right now?',
    icon: '😴',
    type: 'scale5',
    options: [
      { id: '1', label: 'Exhausted',     emoji: '😫', score: 4 },
      { id: '2', label: 'Very Tired',    emoji: '😔', score: 3 },
      { id: '3', label: 'Somewhat Tired',emoji: '😐', score: 2 },
      { id: '4', label: 'A Little',      emoji: '🙂', score: 1 },
      { id: '5', label: 'Refreshed',     emoji: '😄', score: 0 },
    ],
  },
  {
    id: 'daily_mood',
    question: 'How is your mood today?',
    icon: '🧠',
    type: 'scale5',
    options: [
      { id: '1', label: 'Very Low',   emoji: '😢', score: 4 },
      { id: '2', label: 'Low',        emoji: '😔', score: 3 },
      { id: '3', label: 'Neutral',    emoji: '😐', score: 2 },
      { id: '4', label: 'Good',       emoji: '🙂', score: 1 },
      { id: '5', label: 'Great',      emoji: '😄', score: 0 },
    ],
  },
  {
    id: 'daily_sleep',
    question: 'How did you sleep last night?',
    icon: '💤',
    type: 'scale5',
    options: [
      { id: '1', label: 'Terrible', emoji: '😫', score: 4 },
      { id: '2', label: 'Poor',     emoji: '😔', score: 3 },
      { id: '3', label: 'Fair',     emoji: '😐', score: 2 },
      { id: '4', label: 'Good',     emoji: '🙂', score: 1 },
      { id: '5', label: 'Great',    emoji: '😴', score: 0 },
    ],
  },
  {
    id: 'daily_dizziness',
    question: 'Any dizziness or weakness today?',
    icon: '💫',
    type: 'yesno',
    options: [
      { id: 'yes', label: 'Yes', emoji: '😵', score: 3 },
      { id: 'no',  label: 'No',  emoji: '✅', score: 0 },
    ],
  },
];

// ─── Helper: get age group ───────────────────────────────────────────────────
export const getAgeGroup = (age) => {
  const n = parseInt(age);
  if (n >= 15 && n <= 24) return '15-24';
  if (n >= 25 && n <= 40) return '25-40';
  if (n >= 41 && n <= 60) return '41-60';
  if (n > 60)             return '60+';
  return '25-40'; // default
};

// ─── Build personalised question set ────────────────────────────────────────
export const buildQuestionSet = (age, gender) => {
  const ageGroup  = getAgeGroup(age);
  const ageQs     = AGE_QUESTIONS[ageGroup]    || [];
  const genderQs  = GENDER_QUESTIONS[gender]   || [];
  return [...COMMON_QUESTIONS, ...ageQs, ...genderQs];
};
