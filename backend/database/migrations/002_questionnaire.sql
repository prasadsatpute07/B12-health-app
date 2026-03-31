-- ============================================================
-- Migration 002: Questionnaire — ML-Ready Answer Storage
-- B12 Health Tracker Backend
-- ============================================================

-- ─────────────────────────────────────────────
-- QUESTIONS — master question bank
-- Matches src/data/questions.js in the RN app
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS questions (
  id              SERIAL PRIMARY KEY,
  question_text   TEXT NOT NULL,

  -- ML feature grouping
  category        VARCHAR(30) NOT NULL,
  -- 'diet' | 'neurological' | 'energy' | 'digestive' | 'lifestyle' | 'psychological'

  question_type   VARCHAR(20) DEFAULT 'multiple_choice',

  -- Adaptive filtering (matches RN app logic)
  audience        VARCHAR(20) DEFAULT 'all',    -- 'all' | 'female' | 'male'
  age_group       VARCHAR(20) DEFAULT 'all',    -- 'all' | '15-24' | '25-40' | '41-60' | '60+'

  -- Scoring
  weight          NUMERIC(4,2) NOT NULL DEFAULT 1.0,  -- ML feature importance multiplier
  max_option_score NUMERIC(4,2) NOT NULL DEFAULT 4.0, -- highest answer.score in options

  -- Options stored as structured JSON for ML export
  -- Format: [{ "label": "Never", "value": "never", "score": 0 }]
  options         JSONB NOT NULL,

  -- Admin
  is_active       BOOLEAN DEFAULT TRUE,
  display_order   SMALLINT DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- ASSESSMENTS — one row per completed questionnaire
-- Stores profile snapshot at time of assessment for ML
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS assessments (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID REFERENCES users(id) ON DELETE CASCADE,

  -- ── Profile snapshot at assessment time ──
  -- (Stored separately so changing profile doesn't corrupt history)
  age_at_assessment     SMALLINT,
  age_group             VARCHAR(10),
  gender                VARCHAR(20),
  diet_type             VARCHAR(20),
  diet_penalty_score    SMALLINT,
  has_pernicious_anemia BOOLEAN DEFAULT FALSE,
  has_crohns_disease    BOOLEAN DEFAULT FALSE,
  has_celiac_disease    BOOLEAN DEFAULT FALSE,
  has_gastric_surgery   BOOLEAN DEFAULT FALSE,
  takes_metformin       BOOLEAN DEFAULT FALSE,
  takes_ppi             BOOLEAN DEFAULT FALSE,

  -- ── Scoring results ──
  raw_score             NUMERIC(6,2),           -- Σ(answer.score × question.weight)
  max_possible_score    NUMERIC(6,2),           -- max score for this adaptive question set
  normalized_score      NUMERIC(5,2),           -- (raw/max) × 100, range 0–100
  risk_percentage       NUMERIC(5,2),           -- same as normalized_score, kept for clarity
  risk_level            VARCHAR(10) NOT NULL,   -- 'low' | 'medium' | 'high'

  -- Category breakdown (JSON for frontend charts)
  -- Format: { "diet": 45.0, "neurological": 70.0, ... }
  category_breakdown    JSONB,

  -- Suggestions list returned to app
  suggestions           JSONB,                  -- ["Eat more fish", ...]

  -- ── ML labels ──
  -- Filled later when ground truth is available (doctor/lab test confirmation)
  ml_label              VARCHAR(15),            -- 'deficient' | 'borderline' | 'normal'
  doctor_confirmed      BOOLEAN DEFAULT FALSE,
  lab_b12_value_pmol    NUMERIC(8,2),           -- actual lab B12 level if user inputs it (pmol/L)

  -- Metadata
  questions_shown       SMALLINT,               -- adaptive: 20–25 questions per session
  scoring_version       VARCHAR(10) DEFAULT '1.0', -- version tag for rule changes
  completed_at          TIMESTAMPTZ DEFAULT NOW(),
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- ASSESSMENT_ANSWERS — core ML training table
-- One row per answer = ready for ML feature matrix
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS assessment_answers (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id     UUID REFERENCES assessments(id) ON DELETE CASCADE,

  -- Denormalized for direct ML export without joins
  user_id           UUID REFERENCES users(id) ON DELETE CASCADE,

  -- Question reference
  question_id       INT REFERENCES questions(id),

  -- ── Raw answer ──
  answer_value      VARCHAR(100) NOT NULL,      -- e.g. 'never', 'sometimes', 'daily'
  answer_label      VARCHAR(200),               -- human-readable at time of answer

  -- ── Scoring (snapshot — question weights can change over time) ──
  answer_score      NUMERIC(4,2) NOT NULL,      -- score from the options array
  question_weight   NUMERIC(4,2) NOT NULL,      -- weight at time of this answer
  weighted_score    NUMERIC(6,2) GENERATED ALWAYS AS (answer_score * question_weight) STORED,

  -- Question metadata snapshot (for ML without joining questions table)
  question_category VARCHAR(30),
  question_text_snapshot TEXT,                  -- text at time of answer

  -- Timing
  answered_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- Indexes — performance + ML export
-- ─────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_assessments_user_date
  ON assessments(user_id, completed_at DESC);

CREATE INDEX IF NOT EXISTS idx_assessment_answers_export
  ON assessment_answers(user_id, question_category, answered_at);

CREATE INDEX IF NOT EXISTS idx_assessment_answers_assessment
  ON assessment_answers(assessment_id);

CREATE INDEX IF NOT EXISTS idx_questions_active
  ON questions(is_active, audience, age_group, display_order);
