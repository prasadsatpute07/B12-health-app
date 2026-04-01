-- ─── 004_bmi.sql — BMI Logs Table ─────────────────────────────────────────────
-- Stores periodic BMI measurements per user.
-- One record per measurement. The latest record is used for food recommendations.

CREATE TABLE IF NOT EXISTS user_bmi_logs (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  height_cm       REAL         NOT NULL CHECK (height_cm BETWEEN 50 AND 300),
  weight_kg       REAL         NOT NULL CHECK (weight_kg BETWEEN 10 AND 500),
  bmi             REAL         NOT NULL,
  bmi_category    VARCHAR(20)  NOT NULL,  -- 'underweight' | 'normal' | 'overweight' | 'obese'
  measured_at     DATE         NOT NULL DEFAULT CURRENT_DATE,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Index for fast lookup of latest record per user
CREATE INDEX IF NOT EXISTS idx_user_bmi_logs_user_date
  ON user_bmi_logs (user_id, measured_at DESC);
