-- ============================================================
-- Migration 003: Daily Check-in & Streak Tracking
-- B12 Health Tracker Backend
-- ============================================================

-- ─────────────────────────────────────────────
-- DAILY_CHECKINS — 5-question daily log
-- Matches DailyCheckInScreen.js (5 questions, scored 0–4)
-- Also ML-ready: each metric is a separate column
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS daily_checkins (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID REFERENCES users(id) ON DELETE CASCADE,
  checkin_date      DATE NOT NULL,

  -- ── 5 daily symptom scores (0–4 each) ──
  -- These 5 dimensions match WeeklyProgressScreen.js chart categories
  energy_score      SMALLINT NOT NULL CHECK (energy_score BETWEEN 0 AND 4),
  fatigue_score     SMALLINT NOT NULL CHECK (fatigue_score BETWEEN 0 AND 4),
  mood_score        SMALLINT NOT NULL CHECK (mood_score BETWEEN 0 AND 4),
  sleep_score       SMALLINT NOT NULL CHECK (sleep_score BETWEEN 0 AND 4),
  focus_score       SMALLINT NOT NULL CHECK (focus_score BETWEEN 0 AND 4),

  -- Auto-computed total (0–20)
  total_score       SMALLINT GENERATED ALWAYS AS
                    (energy_score + fatigue_score + mood_score + sleep_score + focus_score) STORED,

  -- Optional free-text note
  notes             TEXT,

  -- Metadata
  duration_seconds  SMALLINT,                   -- how long the check-in took (UX metric)
  created_at        TIMESTAMPTZ DEFAULT NOW(),

  -- One check-in per user per day
  UNIQUE(user_id, checkin_date)
);

-- ─────────────────────────────────────────────
-- USER_STREAKS — streak + habit tracking
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_streaks (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  current_streak      INT DEFAULT 0,
  longest_streak      INT DEFAULT 0,
  total_checkins      INT DEFAULT 0,
  last_checkin_date   DATE,
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- INSIGHTS_LOG — server-generated insights cache
-- Stored so we can track what insights were shown
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS insights_log (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES users(id) ON DELETE CASCADE,
  insight_type  VARCHAR(30),                    -- 'risk_based' | 'trend_alert' | 'streak'
  insight_text  TEXT NOT NULL,
  metadata      JSONB,                          -- { "triggered_by": "fatigue_3days", ... }
  shown_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- Indexes
-- ─────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_daily_checkins_user_date
  ON daily_checkins(user_id, checkin_date DESC);

CREATE INDEX IF NOT EXISTS idx_streaks_user
  ON user_streaks(user_id);

CREATE INDEX IF NOT EXISTS idx_insights_user
  ON insights_log(user_id, shown_at DESC);
