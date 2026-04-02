-- ============================================================
-- Migration 006: Security Tables
-- B12 Health Tracker Backend
--
-- Tables created:
--   1. token_blacklist  — JWT logout / token revocation
--   2. login_attempts   — Brute-force & credential stuffing tracking
--   3. audit_logs       — Full security event audit trail
--
-- Defends against:
--   Stolen tokens, brute-force login, credential stuffing,
--   IDOR attacks, account takeover, insider threats
-- ============================================================


-- ─────────────────────────────────────────────────────────────
-- 1. TOKEN BLACKLIST — JWT logout / revocation
--
-- When a user logs out, their token's unique ID (jti) is
-- stored here. The auth middleware checks this table on EVERY
-- request. If the jti is found → token is rejected immediately,
-- even if it hasn't expired yet.
--
-- Self-cleaning: expired entries are purged by cleanup_expired_tokens()
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS token_blacklist (
  jti         VARCHAR(36) PRIMARY KEY,              -- JWT unique ID (UUID format)
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  expires_at  TIMESTAMPTZ NOT NULL,                -- Token's original expiry — used for cleanup
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Fast lookup on every authenticated request
CREATE INDEX IF NOT EXISTS idx_token_blacklist_jti     ON token_blacklist(jti);
CREATE INDEX IF NOT EXISTS idx_token_blacklist_expires ON token_blacklist(expires_at);
CREATE INDEX IF NOT EXISTS idx_token_blacklist_user    ON token_blacklist(user_id);


-- ─────────────────────────────────────────────────────────────
-- 2. LOGIN ATTEMPTS — Brute-force & credential stuffing tracking
--
-- Every login attempt (success or failure) is recorded here.
-- The auth route queries this table to:
--   a) Block login if ≥5 failures in last 15 minutes (per email)
--   b) Auto-lock account after consecutive failures
--   c) Detect credential stuffing (same IP, many emails)
--
-- INET type stores IPv4 and IPv6 addresses natively in Postgres
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS login_attempts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) NOT NULL,
  ip_address    INET NOT NULL,
  success       BOOLEAN NOT NULL DEFAULT FALSE,
  attempted_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Query pattern: WHERE email = ? AND attempted_at >= ? AND success = false
CREATE INDEX IF NOT EXISTS idx_login_attempts_email ON login_attempts(email, attempted_at DESC);
-- Query pattern: WHERE ip_address = ? AND attempted_at >= ?  (detect credential stuffing)
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip    ON login_attempts(ip_address, attempted_at DESC);


-- ─────────────────────────────────────────────────────────────
-- 3. AUDIT LOGS — Security event trail
--
-- Every security-relevant action is recorded here:
--   LOGIN, LOGOUT, FAILED_LOGIN, ACCOUNT_LOCKED, REGISTER,
--   PASSWORD_CHANGE, TOKEN_REFRESH, IDOR_ATTEMPT, etc.
--
-- Purpose:
--   a) Forensic investigation after a breach
--   b) Compliance (DPDP Act, HIPAA, GDPR principles)
--   c) Real-time alerting integration (export to SIEM)
--   d) Detect anomalous patterns (login from new country, etc.)
--
-- metadata JSONB allows flexible extra context per event type
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id) ON DELETE SET NULL,  -- Keep log even if user deleted
  event_type  VARCHAR(50) NOT NULL,
  ip_address  INET,
  user_agent  TEXT,
  metadata    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Query by user (all actions by a specific user)
CREATE INDEX IF NOT EXISTS idx_audit_logs_user       ON audit_logs(user_id, created_at DESC);
-- Query by event type (all failed logins in last 24h)
CREATE INDEX IF NOT EXISTS idx_audit_logs_event      ON audit_logs(event_type, created_at DESC);
-- Query by IP (all activity from a suspicious IP)
CREATE INDEX IF NOT EXISTS idx_audit_logs_ip         ON audit_logs(ip_address, created_at DESC);
-- General time-range queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);


-- ─────────────────────────────────────────────────────────────
-- MAINTENANCE: Cleanup function for expired blacklisted tokens
--
-- Blacklisted tokens are only needed until they expire naturally.
-- After expiry, they can't be used anyway — so we clean them up.
--
-- Schedule with pg_cron (if available):
--   SELECT cron.schedule('cleanup-tokens', '0 * * * *', 'SELECT cleanup_expired_tokens()');
--
-- Or call manually / from a Node.js cron job.
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM token_blacklist WHERE expires_at < NOW();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Also purge very old login_attempts (keep last 90 days for forensics)
CREATE OR REPLACE FUNCTION cleanup_old_login_attempts()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM login_attempts WHERE attempted_at < NOW() - INTERVAL '90 days';
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;
