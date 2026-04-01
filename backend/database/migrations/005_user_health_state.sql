-- ============================================================
-- Migration 005: User Health State
-- B12 Health Tracker Backend
-- ============================================================
-- This is a LIVING table — one row per user.
-- Created when the user first submits the questionnaire.
-- Overwritten every time the user submits a daily check-in.
-- The source assessments row is NEVER modified.
-- ============================================================

CREATE TABLE IF NOT EXISTS user_health_state (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- ── Identity ──────────────────────────────────────────────
  -- One row per user (UNIQUE enforces this)
  user_id               UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE (user_id),

  -- ── Link to original questionnaire (read-only reference) ──
  -- We never touch the assessments row; this FK just lets us
  -- trace which questionnaire session seeded this record.
  assessment_id         UUID REFERENCES assessments(id) ON DELETE SET NULL,

  -- ── Questionnaire data (copied once from assessments) ─────
  -- These reflect the user's medical baseline from onboarding.
  -- They do NOT change unless the user re-does the questionnaire.
  age_at_assessment     SMALLINT,
  age_group             VARCHAR(10),
  gender                VARCHAR(20),
  diet_type             VARCHAR(20),
  diet_penalty_score    SMALLINT       DEFAULT 0,
  has_pernicious_anemia BOOLEAN        DEFAULT FALSE,
  has_crohns_disease    BOOLEAN        DEFAULT FALSE,
  has_celiac_disease    BOOLEAN        DEFAULT FALSE,
  has_gastric_surgery   BOOLEAN        DEFAULT FALSE,
  takes_metformin       BOOLEAN        DEFAULT FALSE,
  takes_ppi             BOOLEAN        DEFAULT FALSE,

  -- Original risk result from the questionnaire
  baseline_risk_level   VARCHAR(10),          -- 'low' | 'medium' | 'high'
  baseline_risk_score   NUMERIC(5, 2),        -- normalized 0-100

  -- ── Daily updated fields (overwritten on every check-in) ──
  -- Latest daily scores (0-4 each)
  current_energy_score  SMALLINT,
  current_fatigue_score SMALLINT,
  current_mood_score    SMALLINT,
  current_sleep_score   SMALLINT,
  current_focus_score   SMALLINT,
  current_daily_total   SMALLINT,             -- sum of 5 scores (0-20)

  -- ── Metadata ──────────────────────────────────────────────
  last_checkin_date     DATE,
  total_checkins        INT            DEFAULT 0,
  created_at            TIMESTAMPTZ    DEFAULT NOW(),
  updated_at            TIMESTAMPTZ    DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_health_state_user
  ON user_health_state(user_id);

CREATE INDEX IF NOT EXISTS idx_user_health_state_assessment
  ON user_health_state(assessment_id);
