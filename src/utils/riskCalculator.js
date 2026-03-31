// ─── Risk Calculator ─────────────────────────────────────────────────────────

/**
 * Calculate B12 deficiency risk from questionnaire answers
 * @param {Object} answers   { questionId: { id, score } }
 * @param {Array}  questions full question set used
 * @param {string} dietType  vegan | vegetarian | pescatarian | omnivore
 * @returns {{ score, level, percentage, breakdown, suggestions }}
 */
export const calculateRisk = (answers, questions, dietType) => {
  const DIET_PENALTY = { vegan: 12, vegetarian: 8, pescatarian: 4, omnivore: 0 };

  let totalScore    = DIET_PENALTY[dietType] || 0;
  let maxPossible   = Object.values(DIET_PENALTY).reduce((a, b) => Math.max(a, b), 0);

  const breakdown = {
    'Energy & Fatigue':   { score: 0, max: 0 },
    'Neurological':       { score: 0, max: 0 },
    'Mood':               { score: 0, max: 0 },
    'Diet':               { score: 0, max: 0 },
    'Lifestyle':          { score: 0, max: 0 },
    'Work Lifestyle':     { score: 0, max: 0 },
    'Female Health':      { score: 0, max: 0 },
    'Physical':           { score: 0, max: 0 },
    'Sleep':              { score: 0, max: 0 },
    'Fatigue':            { score: 0, max: 0 },
    'Digestive Health':   { score: 0, max: 0 },
    'Diet Habits':        { score: 0, max: 0 },
  };

  questions.forEach((q) => {
    const maxOptionScore = Math.max(...q.options.map((o) => o.score));
    const weighted = maxOptionScore * q.weight;
    maxPossible += weighted;

    if (breakdown[q.category] !== undefined) {
      breakdown[q.category].max += weighted;
    }

    const answer = answers[q.id];
    if (answer) {
      const contribution = answer.score * q.weight;
      totalScore += contribution;
      if (breakdown[q.category] !== undefined) {
        breakdown[q.category].score += contribution;
      }
    }
  });

  const percentage = Math.min(Math.round((totalScore / maxPossible) * 100), 100);

  let level;
  if (percentage < 35)      level = 'LOW';
  else if (percentage < 65) level = 'MEDIUM';
  else                      level = 'HIGH';

  const suggestions = getSuggestions(level, answers, dietType);

  return { score: totalScore, maxPossible, percentage, level, breakdown, suggestions };
};

const getSuggestions = (level, answers, dietType) => {
  const base = [
    'Eat B12-rich foods: eggs, dairy, fish, or fortified cereals daily',
    'Stay well-hydrated — dehydration worsens fatigue',
    'Maintain a consistent sleep schedule of 7-9 hours',
  ];

  if (dietType === 'vegan' || dietType === 'vegetarian') {
    base.unshift('Consider a B12 supplement — plant-based diets are naturally low in B12');
    base.unshift('Look for B12-fortified plant milks and nutritional yeast');
  }

  if (level === 'HIGH') {
    return [
      '🩺 Consult a doctor and request a B12 blood test as soon as possible',
      '💊 Ask about B12 injections or high-dose supplements',
      '🥩 Immediately increase B12-rich food intake',
      ...base,
    ];
  }

  if (level === 'MEDIUM') {
    return [
      '💊 Consider adding a B12 supplement to your routine',
      '🥩 Increase your B12-rich food intake: meat, eggs, fish, dairy',
      '📋 Schedule a routine blood test in the next 1-2 months',
      ...base,
    ];
  }

  return [
    '✅ Your B12 levels appear healthy — keep it up!',
    '🥗 Continue maintaining a balanced, nutrient-rich diet',
    ...base,
  ];
};

/**
 * Compute weekly trend from daily check-in history
 * @param {Array} history  array of { date, answers } daily logs
 * @returns {{ energyTrend, fatigueTrend, moodTrend, sleepTrend }}
 */
export const computeWeeklyTrend = (history) => {
  const last7 = history.slice(-7);
  const extract = (key) =>
    last7.map((day) => {
      const ans = day.answers?.[key];
      return ans ? 5 - ans.score : null; // invert so 5 = best
    });

  return {
    energyTrend:  extract('daily_energy'),
    fatigueTrend: extract('daily_fatigue'),
    moodTrend:    extract('daily_mood'),
    sleepTrend:   extract('daily_sleep'),
    labels:       last7.map((d) => {
      const date = new Date(d.date);
      return date.toLocaleDateString('en', { weekday: 'short' });
    }),
  };
};

/**
 * Calculate streak from daily log history
 */
export const calculateStreak = (history) => {
  if (!history.length) return 0;
  let streak = 0;
  const today = new Date().toDateString();
  for (let i = history.length - 1; i >= 0; i--) {
    const expected = new Date();
    expected.setDate(expected.getDate() - (history.length - 1 - i));
    if (new Date(history[i].date).toDateString() === expected.toDateString()) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
};
