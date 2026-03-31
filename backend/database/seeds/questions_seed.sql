-- ============================================================
-- Questions Seed — B12 Adaptive Questionnaire
-- 25 questions matching src/data/questions.js in the RN app
-- Categories: diet, neurological, energy, digestive, lifestyle, psychological
-- Audiences: all | female | male
-- Age groups: all | 15-24 | 25-40 | 41-60 | 60+
-- ============================================================

-- Clear existing data (for re-seeding)
TRUNCATE TABLE questions RESTART IDENTITY CASCADE;

-- ─────────────────────
-- COMMON QUESTIONS (10) — shown to everyone
-- ─────────────────────

INSERT INTO questions (question_text, category, weight, max_option_score, audience, age_group, options, display_order) VALUES
(
  'How often do you eat animal-based foods (meat, fish, eggs, dairy)?',
  'diet', 2.0, 4, 'all', 'all',
  '[
    {"label":"Daily","value":"daily","score":0},
    {"label":"A few times a week","value":"few_week","score":1},
    {"label":"Rarely (once a week or less)","value":"rarely","score":3},
    {"label":"Never","value":"never","score":4}
  ]',
  1
),
(
  'Do you take any Vitamin B12 supplements?',
  'diet', 1.5, 4, 'all', 'all',
  '[
    {"label":"Yes, regularly","value":"yes_regular","score":0},
    {"label":"Yes, occasionally","value":"yes_occasional","score":1},
    {"label":"No","value":"no","score":4}
  ]',
  2
),
(
  'How often do you experience unusual tiredness or fatigue?',
  'energy', 1.8, 4, 'all', 'all',
  '[
    {"label":"Never","value":"never","score":0},
    {"label":"Sometimes (1-2 days/week)","value":"sometimes","score":1},
    {"label":"Often (3-5 days/week)","value":"often","score":3},
    {"label":"Almost always","value":"always","score":4}
  ]',
  3
),
(
  'Do you experience numbness, tingling, or "pins and needles" in your hands or feet?',
  'neurological', 2.0, 4, 'all', 'all',
  '[
    {"label":"Never","value":"never","score":0},
    {"label":"Occasionally","value":"occasionally","score":1},
    {"label":"Frequently","value":"frequently","score":3},
    {"label":"Daily","value":"daily","score":4}
  ]',
  4
),
(
  'Have you noticed any difficulty concentrating, memory lapses, or "brain fog"?',
  'neurological', 1.8, 4, 'all', 'all',
  '[
    {"label":"Never","value":"never","score":0},
    {"label":"Occasionally","value":"occasionally","score":1},
    {"label":"Frequently","value":"frequently","score":3},
    {"label":"Very often","value":"very_often","score":4}
  ]',
  5
),
(
  'Do you experience shortness of breath or heart palpitations without physical exertion?',
  'energy', 1.6, 4, 'all', 'all',
  '[
    {"label":"Never","value":"never","score":0},
    {"label":"Rarely","value":"rarely","score":1},
    {"label":"Sometimes","value":"sometimes","score":2},
    {"label":"Frequently","value":"frequently","score":4}
  ]',
  6
),
(
  'How would you describe your mood in general?',
  'psychological', 1.5, 4, 'all', 'all',
  '[
    {"label":"Generally positive","value":"positive","score":0},
    {"label":"Occasionally low or irritable","value":"occasional_low","score":1},
    {"label":"Frequently anxious or depressed","value":"frequent_low","score":3},
    {"label":"Persistently depressed or moody","value":"persistent_low","score":4}
  ]',
  7
),
(
  'Do you have any digestive issues such as bloating, indigestion, or loss of appetite?',
  'digestive', 1.4, 4, 'all', 'all',
  '[
    {"label":"Never","value":"never","score":0},
    {"label":"Occasionally","value":"occasionally","score":1},
    {"label":"Frequently","value":"frequently","score":3},
    {"label":"Very often or always","value":"always","score":4}
  ]',
  8
),
(
  'Has a doctor ever told you that you have anaemia?',
  'energy', 2.0, 4, 'all', 'all',
  '[
    {"label":"No","value":"no","score":0},
    {"label":"In the past but resolved","value":"past","score":2},
    {"label":"Currently diagnosed","value":"current","score":4}
  ]',
  9
),
(
  'Is the top of your tongue smooth, red, or sore (glossitis)?',
  'digestive', 1.6, 4, 'all', 'all',
  '[
    {"label":"No, looks normal","value":"no","score":0},
    {"label":"Occasionally sore","value":"occasionally","score":2},
    {"label":"Yes, smooth and often sore","value":"yes","score":4}
  ]',
  10
),

-- ─────────────────────
-- AGE-BASED QUESTIONS
-- ─────────────────────

-- Young adults (15–24)
(
  'Are you currently following a strict vegan or plant-based diet without B12 fortified foods?',
  'diet', 1.8, 4, 'all', '15-24',
  '[
    {"label":"No","value":"no","score":0},
    {"label":"Vegetarian but eat dairy/eggs","value":"vegetarian","score":1},
    {"label":"Vegan with some fortified foods","value":"vegan_fortified","score":2},
    {"label":"Strict vegan, no fortified foods","value":"strict_vegan","score":4}
  ]',
  11
),
(
  'How often do you consume energy drinks or highly processed foods as meal replacements?',
  'lifestyle', 1.2, 4, 'all', '15-24',
  '[
    {"label":"Never","value":"never","score":0},
    {"label":"Occasionally (1-2/week)","value":"occasionally","score":1},
    {"label":"Often (3-5/week)","value":"often","score":3},
    {"label":"Daily","value":"daily","score":4}
  ]',
  12
),

-- Adults (25–40)
(
  'Are you currently pregnant, planning to become pregnant, or breastfeeding?',
  'lifestyle', 2.0, 4, 'female', '25-40',
  '[
    {"label":"No","value":"no","score":0},
    {"label":"Planning to become pregnant","value":"planning","score":1},
    {"label":"Currently pregnant","value":"pregnant","score":3},
    {"label":"Breastfeeding","value":"breastfeeding","score":3}
  ]',
  13
),
(
  'Do you regularly take medications such as metformin (for diabetes) or proton pump inhibitors (antacids)?',
  'lifestyle', 2.0, 4, 'all', '25-40',
  '[
    {"label":"No","value":"no","score":0},
    {"label":"Occasionally","value":"occasionally","score":1},
    {"label":"Yes, one of these","value":"yes_one","score":3},
    {"label":"Yes, both","value":"yes_both","score":4}
  ]',
  14
),

-- Middle-aged (41–60)
(
  'Have you ever had any stomach or gastrointestinal surgery (e.g., gastric bypass, stomach removal)?',
  'lifestyle', 2.5, 4, 'all', '41-60',
  '[
    {"label":"No","value":"no","score":0},
    {"label":"Minor GI procedure","value":"minor","score":1},
    {"label":"Yes, major GI surgery","value":"major","score":4}
  ]',
  15
),
(
  'Have you been diagnosed with an autoimmune condition such as pernicious anaemia, Crohn''s disease, or Celiac disease?',
  'lifestyle', 2.5, 4, 'all', '41-60',
  '[
    {"label":"No","value":"no","score":0},
    {"label":"Suspected but not confirmed","value":"suspected","score":2},
    {"label":"Yes, diagnosed","value":"yes","score":4}
  ]',
  16
),

-- Seniors (60+)
(
  'Did you know that B12 absorption decreases with age? Do you take a B12 supplement specifically for this reason?',
  'diet', 1.5, 4, 'all', '60+',
  '[
    {"label":"Yes, I take a supplement","value":"yes","score":0},
    {"label":"No, but I eat B12-rich foods daily","value":"diet_focused","score":1},
    {"label":"No supplement, eat some B12 foods","value":"no_supplement_some","score":3},
    {"label":"No supplement, limited B12 foods","value":"no_supplement_none","score":4}
  ]',
  17
),
(
  'Have you noticed any problems with balance, walking steadily, or coordination?',
  'neurological', 2.2, 4, 'all', '60+',
  '[
    {"label":"No","value":"no","score":0},
    {"label":"Occasionally","value":"occasionally","score":2},
    {"label":"Frequently","value":"frequently","score":4}
  ]',
  18
),
(
  'Have you experienced any confusion, memory problems, or early signs of dementia?',
  'neurological', 2.5, 4, 'all', '60+',
  '[
    {"label":"No","value":"no","score":0},
    {"label":"Some forgetfulness","value":"some","score":1},
    {"label":"Noticeable memory issues","value":"noticeable","score":3},
    {"label":"Yes, diagnosed/significant concern","value":"significant","score":4}
  ]',
  19
),

-- ─────────────────────
-- GENDER-BASED QUESTIONS
-- ─────────────────────

-- Female-specific
(
  'Do you experience heavy menstrual periods that last more than 5 days?',
  'energy', 1.6, 4, 'female', 'all',
  '[
    {"label":"No / Not applicable","value":"no","score":0},
    {"label":"Moderate (5–7 days)","value":"moderate","score":1},
    {"label":"Heavy (over 7 days or very heavy flow)","value":"heavy","score":3}
  ]',
  20
),
(
  'Have you recently given birth or finished breastfeeding in the last 12 months?',
  'lifestyle', 1.8, 4, 'female', 'all',
  '[
    {"label":"No","value":"no","score":0},
    {"label":"Gave birth over 6 months ago","value":"over_6mo","score":1},
    {"label":"Currently breastfeeding or gave birth within 6 months","value":"recent","score":3}
  ]',
  21
),

-- Male-specific
(
  'Do you consume alcohol more than 3 times per week?',
  'lifestyle', 1.4, 4, 'male', 'all',
  '[
    {"label":"No / Rarely","value":"no","score":0},
    {"label":"1-2 times a week","value":"low","score":1},
    {"label":"3-4 times a week","value":"moderate","score":2},
    {"label":"Daily","value":"daily","score":4}
  ]',
  22
),
(
  'Do you engage in high-intensity training or endurance sports that require a high-protein diet?',
  'lifestyle', 1.2, 4, 'male', 'all',
  '[
    {"label":"No","value":"no","score":0},
    {"label":"Recreational exercise","value":"recreational","score":0},
    {"label":"Regular high-intensity training","value":"high_intensity","score":1},
    {"label":"Professional / daily endurance sport","value":"professional","score":2}
  ]',
  23
),

-- General lifestyle (applicable to all)
(
  'How would you rate your current stress levels?',
  'psychological', 1.3, 4, 'all', 'all',
  '[
    {"label":"Low — I manage stress well","value":"low","score":0},
    {"label":"Moderate — sometimes stressed","value":"moderate","score":1},
    {"label":"High — frequently stressed","value":"high","score":3},
    {"label":"Very high — chronic stress","value":"very_high","score":4}
  ]',
  24
),
(
  'How many hours of sleep do you typically get per night?',
  'lifestyle', 1.1, 4, 'all', 'all',
  '[
    {"label":"7–9 hours (recommended)","value":"optimal","score":0},
    {"label":"6–7 hours","value":"slightly_less","score":1},
    {"label":"5–6 hours","value":"less","score":2},
    {"label":"Less than 5 hours","value":"very_less","score":4}
  ]',
  25
);
