/*
# Aegis Phase 5 — Portfolio, Journal, and Alerts

## Overview
Adds user-owned tables for portfolio tracking, decision journaling,
and price/alert management. These tables complete the user workflow:
Scanner → Watchlist → Portfolio → Journal → Alerts.

## New Tables

### 1. portfolio_items
User's holdings — what they own, how much, at what cost basis.

- `id` (uuid, PK)
- `user_id` (uuid, FK → profiles, CASCADE)
- `asset_id` (uuid, FK → assets, CASCADE)
- `quantity` (numeric, > 0)
- `avg_buy_price` (numeric, > 0) — average cost basis in USD
- `notes` (text, nullable)
- `added_at` (timestamptz, default now())
- `updated_at` (timestamptz, default now())

UNIQUE(user_id, asset_id) — one entry per asset per user.

### 2. journal_entries
Decision journal — users record their reasoning for buy/sell/hold decisions.

- `id` (uuid, PK)
- `user_id` (uuid, FK → profiles, CASCADE)
- `asset_id` (uuid, FK → assets, CASCADE)
- `entry_type` (enum: buy, sell, hold, watch, note)
- `title` (text)
- `content` (text) — detailed reasoning
- `emotion` (text, nullable) — e.g. "confident", "anxious", "neutral"
- `tags` (text[]) — user-defined tags
- `rating` (integer 1–5, nullable) — self-assessment of decision quality
- `created_at` (timestamptz, default now())
- `updated_at` (timestamptz, default now())

### 3. alerts
User-defined price or score alerts.

- `id` (uuid, PK)
- `user_id` (uuid, FK → profiles, CASCADE)
- `asset_id` (uuid, FK → assets, CASCADE)
- `alert_type` (enum: price_above, price_below, score_above, score_below, risk_above)
- `threshold` (numeric) — the trigger value
- `message` (text, nullable) — custom message
- `is_active` (boolean, default true)
- `triggered_at` (timestamptz, nullable) — when the alert fired
- `created_at` (timestamptz, default now())

## Security
All three tables: user-owned (auth.uid() = user_id), full CRUD for owner only.
*/

-- ── Enums ────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE journal_entry_type AS ENUM ('buy', 'sell', 'hold', 'watch', 'note');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE alert_type AS ENUM ('price_above', 'price_below', 'score_above', 'score_below', 'risk_above');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── portfolio_items ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS portfolio_items (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  asset_id      uuid NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  quantity      numeric NOT NULL CHECK (quantity > 0),
  avg_buy_price numeric NOT NULL CHECK (avg_buy_price > 0),
  notes         text,
  added_at      timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, asset_id)
);

ALTER TABLE portfolio_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "portfolio_select_own" ON portfolio_items;
CREATE POLICY "portfolio_select_own" ON portfolio_items FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "portfolio_insert_own" ON portfolio_items;
CREATE POLICY "portfolio_insert_own" ON portfolio_items FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "portfolio_update_own" ON portfolio_items;
CREATE POLICY "portfolio_update_own" ON portfolio_items FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "portfolio_delete_own" ON portfolio_items;
CREATE POLICY "portfolio_delete_own" ON portfolio_items FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ── journal_entries ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS journal_entries (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  asset_id   uuid NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  entry_type journal_entry_type NOT NULL,
  title      text NOT NULL,
  content    text,
  emotion    text,
  tags       text[] DEFAULT '{}',
  rating     integer CHECK (rating BETWEEN 1 AND 5),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "journal_select_own" ON journal_entries;
CREATE POLICY "journal_select_own" ON journal_entries FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "journal_insert_own" ON journal_entries;
CREATE POLICY "journal_insert_own" ON journal_entries FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "journal_update_own" ON journal_entries;
CREATE POLICY "journal_update_own" ON journal_entries FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "journal_delete_own" ON journal_entries;
CREATE POLICY "journal_delete_own" ON journal_entries FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ── alerts ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS alerts (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  asset_id     uuid NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  alert_type   alert_type NOT NULL,
  threshold    numeric NOT NULL,
  message      text,
  is_active    boolean NOT NULL DEFAULT true,
  triggered_at timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "alerts_select_own" ON alerts;
CREATE POLICY "alerts_select_own" ON alerts FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "alerts_insert_own" ON alerts;
CREATE POLICY "alerts_insert_own" ON alerts FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "alerts_update_own" ON alerts;
CREATE POLICY "alerts_update_own" ON alerts FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "alerts_delete_own" ON alerts;
CREATE POLICY "alerts_delete_own" ON alerts FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ── Indexes ──────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_portfolio_user ON portfolio_items(user_id);
CREATE INDEX IF NOT EXISTS idx_journal_user_created ON journal_entries(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_journal_asset ON journal_entries(asset_id);
CREATE INDEX IF NOT EXISTS idx_alerts_user_active ON alerts(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_alerts_asset ON alerts(asset_id);
