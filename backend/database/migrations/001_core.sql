-- ============================================================
-- Migration 001: Core Tables (Users, Profiles, Push Tokens)
-- B12 Health Tracker Backend
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─────────────────────────────────────────────
-- USERS — authentication
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),                   -- NULL for Google OAuth users
  google_id     VARCHAR(255) UNIQUE,            -- Google OAuth (Phase 2)
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- USER PROFILES — demographic & medical baseline
-- All columns are ML feature candidates
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_profiles (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  name                    VARCHAR(255),

  -- Demographics (ML features)
  age                     SMALLINT CHECK (age > 0 AND age < 120),
  age_group               VARCHAR(10),           -- '15-24' | '25-40' | '41-60' | '60+'
  gender                  VARCHAR(20),           -- 'male' | 'female' | 'other'

  -- Diet (ML feature — scored)
  diet_type               VARCHAR(20),           -- 'vegan' | 'vegetarian' | 'pescatarian' | 'omnivore'
  diet_penalty_score      SMALLINT DEFAULT 0,    -- vegan=12, vegetarian=8, pescatarian=4, omnivore=0

  -- Medical conditions (binary ML features)
  has_pernicious_anemia   BOOLEAN DEFAULT FALSE,
  has_crohns_disease      BOOLEAN DEFAULT FALSE,
  has_celiac_disease      BOOLEAN DEFAULT FALSE,
  has_gastric_surgery     BOOLEAN DEFAULT FALSE, -- gastric bypass/resection
  has_ibs                 BOOLEAN DEFAULT FALSE,

  -- Medications (binary ML features)
  takes_metformin         BOOLEAN DEFAULT FALSE,
  takes_ppi               BOOLEAN DEFAULT FALSE, -- proton pump inhibitors

  -- Female-specific (Phase 2)
  is_pregnant             BOOLEAN DEFAULT FALSE,
  is_breastfeeding        BOOLEAN DEFAULT FALSE,

  -- Lifestyle
  alcohol_frequency       VARCHAR(20),           -- 'never' | 'social' | 'weekly' | 'daily'
  smoking_status          VARCHAR(20),           -- 'never' | 'former' | 'current'

  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- PUSH TOKENS — Expo push notifications
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS push_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  token       VARCHAR(500) NOT NULL,
  platform    VARCHAR(10),                       -- 'ios' | 'android'
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, token)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_profiles_user ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_push_tokens_user ON push_tokens(user_id);
