/*
# Aegis Phase 1 — Core schema: profiles, user_preferences, audit_logs

## Overview
Creates the foundational tables for Aegis, an AI Market Intelligence Platform.
This migration establishes user profiles (linked to Supabase auth), per-user
preferences (locale, theme, risk tolerance, default market), and an audit log
table for tracking security-relevant user actions.

## New Tables

### 1. profiles
- `id` (uuid, PK) — references `auth.users.id`, cascading delete.
- `email` (text, unique, not null) — denormalized from auth for fast lookups.
- `display_name` (text, nullable) — user-chosen display name.
- `avatar_url` (text, nullable) — profile picture URL.
- `role` (enum: user, analyst, admin; default: user) — RBAC role.
- `locale` (enum: fa, en; default: fa) — preferred language.
- `created_at` (timestamptz, default now()).
- `updated_at` (timestamptz, default now()).

### 2. user_preferences
- `id` (uuid, PK).
- `user_id` (uuid, FK → profiles.id, unique, cascading delete).
- `locale` (enum: fa, en; default: fa).
- `theme` (enum: dark; default: dark) — only dark for now.
- `default_market` (enum: crypto, stock, forex, commodity, etf; default: crypto).
- `risk_tolerance` (enum: conservative, moderate, aggressive; default: moderate).
- `notification_enabled` (boolean, default: true).
- `email_alerts` (boolean, default: false).
- `created_at` (timestamptz, default now()).
- `updated_at` (timestamptz, default now()).

### 3. audit_logs
- `id` (uuid, PK).
- `user_id` (uuid, nullable, FK → profiles.id, set null on delete).
- `action` (enum: login, logout, signup, profile_update, preferences_update, password_change).
- `metadata` (jsonb, nullable) — extra context.
- `ip_address` (inet, nullable).
- `created_at` (timestamptz, default now()).

## Security
- RLS enabled on all three tables.
- profiles: users can read/update only their own row. INSERT is handled via
  trigger from auth.users, so no direct INSERT policy for users.
- user_preferences: users can read/insert/update/delete only their own preferences.
- audit_logs: users can read only their own logs; INSERT is allowed for
  authenticated users (they log their own actions). No UPDATE or DELETE.

## Important Notes
1. A trigger auto-creates a profile row when a new auth.users record is inserted.
2. A trigger auto-creates a user_preferences row when a new profile is inserted.
3. The `updated_at` columns are auto-maintained via a trigger function.
4. All enums use `CREATE TYPE` and are idempotent via `DO $$` blocks.
*/

-- ── Enums ────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('user', 'analyst', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE app_locale AS ENUM ('fa', 'en');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE theme_mode AS ENUM ('dark');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE market_type AS ENUM ('crypto', 'stock', 'forex', 'commodity', 'etf');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE risk_tolerance AS ENUM ('conservative', 'moderate', 'aggressive');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE audit_action AS ENUM (
    'login', 'logout', 'signup',
    'profile_update', 'preferences_update', 'password_change'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── updated_at helper ────────────────────────────────────────────

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ── profiles ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       text UNIQUE NOT NULL,
  display_name text,
  avatar_url  text,
  role        user_role NOT NULL DEFAULT 'user',
  locale      app_locale NOT NULL DEFAULT 'fa',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Auto-create profile when a new auth user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ── user_preferences ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_preferences (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              uuid UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  locale               app_locale NOT NULL DEFAULT 'fa',
  theme                theme_mode NOT NULL DEFAULT 'dark',
  default_market       market_type NOT NULL DEFAULT 'crypto',
  risk_tolerance       risk_tolerance NOT NULL DEFAULT 'moderate',
  notification_enabled boolean NOT NULL DEFAULT true,
  email_alerts         boolean NOT NULL DEFAULT false,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "prefs_select_own" ON user_preferences;
CREATE POLICY "prefs_select_own" ON user_preferences FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "prefs_insert_own" ON user_preferences;
CREATE POLICY "prefs_insert_own" ON user_preferences FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "prefs_update_own" ON user_preferences;
CREATE POLICY "prefs_update_own" ON user_preferences FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "prefs_delete_own" ON user_preferences;
CREATE POLICY "prefs_delete_own" ON user_preferences FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS prefs_updated_at ON user_preferences;
CREATE TRIGGER prefs_updated_at BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Auto-create preferences when a new profile is created
CREATE OR REPLACE FUNCTION handle_new_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO user_preferences (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_profile_created ON profiles;
CREATE TRIGGER on_profile_created AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION handle_new_profile();

-- ── audit_logs ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS audit_logs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES profiles(id) ON DELETE SET NULL,
  action      audit_action NOT NULL,
  metadata    jsonb,
  ip_address  inet,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_select_own" ON audit_logs;
CREATE POLICY "audit_select_own" ON audit_logs FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "audit_insert_own" ON audit_logs;
CREATE POLICY "audit_insert_own" ON audit_logs FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

-- ── Indexes ──────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
