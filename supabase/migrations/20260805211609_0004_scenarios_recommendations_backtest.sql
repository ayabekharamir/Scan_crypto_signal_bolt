/*
# Aegis Phase 4 — Scenarios, Recommendations, and Backtest tables

## Overview
Adds the AI reasoning layer tables: scenario predictions, AI-generated
recommendations, and backtest accuracy tracking. These tables complete the
intelligence pipeline: Scores + Risk + Evidence → AI Reasoning → Scenarios
→ Recommendations, with Backtest measuring historical accuracy.

## New Tables

### 1. scenarios
Possible future paths for an asset, each with probability, description,
key drivers, and price targets.

- `id` (uuid, PK)
- `asset_id` (uuid, FK → assets, CASCADE)
- `scenario_type` (enum: continuation, correction, breakout, weakness, crash)
- `title` (text) — short headline
- `description` (text) — detailed explanation
- `probability` (integer 0–100) — likelihood of this scenario
- `price_target_low` (numeric, nullable) — low end of target range
- `price_target_high` (numeric, nullable) — high end of target range
- `timeframe` (text) — e.g. "1-3 days", "1 week", "1 month"
- `key_drivers` (text[]) — array of driver descriptions
- `computed_at` (timestamptz)
- `created_at` (timestamptz, default now())

### 2. recommendations
AI-generated actionable recommendations per asset.

- `id` (uuid, PK)
- `asset_id` (uuid, FK → assets, CASCADE)
- `action` (enum: strong_buy, buy, hold, reduce, sell, avoid)
- `confidence` (integer 0–100)
- `summary` (text) — one-line summary
- `reasoning` (text) — detailed AI reasoning
- `entry_zone_low` / `entry_zone_high` (numeric, nullable) — suggested entry range
- `stop_loss` (numeric, nullable) — suggested stop loss
- `take_profit` (numeric, nullable) — suggested take profit
- `position_size` (text, nullable) — e.g. "Small", "Medium", "Large"
- `risk_reward_ratio` (numeric, nullable) — R:R ratio
- `valid_until` (timestamptz, nullable) — when the recommendation expires
- `computed_at` (timestamptz)
- `created_at` (timestamptz, default now())

### 3. backtest_results
Tracks the accuracy of past scores, scenarios, and recommendations over time.

- `id` (uuid, PK)
- `asset_id` (uuid, FK → assets, CASCADE)
- `metric_type` (enum: score_accuracy, scenario_accuracy, recommendation_accuracy)
- `accuracy` (integer 0–100) — percentage accuracy
- `total_predictions` (integer) — number of predictions evaluated
- `correct_predictions` (integer) — number that were correct
- `period_start` (timestamptz) — start of backtest period
- `period_end` (timestamptz) — end of backtest period
- `metadata` (jsonb, nullable) — extra context
- `created_at` (timestamptz, default now())

## Security
- All three tables: public read (anon + authenticated), no user writes.
  Populated by edge functions / service role background jobs.

## Important Notes
1. Scenarios are alternative futures — the sum of probabilities across
   scenarios for a given asset at a given time may not equal 100% because
   they are independent predictions, not mutually exclusive outcomes.
2. Recommendations include actionable trading parameters (entry zone,
   stop loss, take profit, position size, R:R ratio) when applicable.
3. Backtest results track accuracy over configurable periods, enabling
   users to see how reliable the AI analysis has been historically.
*/

-- ── Enums ────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE scenario_type AS ENUM ('continuation', 'correction', 'breakout', 'weakness', 'crash');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE recommendation_action AS ENUM ('strong_buy', 'buy', 'hold', 'reduce', 'sell', 'avoid');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE backtest_metric_type AS ENUM ('score_accuracy', 'scenario_accuracy', 'recommendation_accuracy');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── scenarios ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS scenarios (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id          uuid NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  scenario_type     scenario_type NOT NULL,
  title             text NOT NULL,
  description       text,
  probability       integer NOT NULL DEFAULT 50 CHECK (probability BETWEEN 0 AND 100),
  price_target_low  numeric,
  price_target_high numeric,
  timeframe         text,
  key_drivers       text[] DEFAULT '{}',
  computed_at       timestamptz NOT NULL,
  created_at        timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE scenarios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "scenarios_read_all" ON scenarios;
CREATE POLICY "scenarios_read_all" ON scenarios FOR SELECT
  TO anon, authenticated USING (true);

-- ── recommendations ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS recommendations (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id         uuid NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  action           recommendation_action NOT NULL,
  confidence       integer NOT NULL DEFAULT 50 CHECK (confidence BETWEEN 0 AND 100),
  summary          text NOT NULL,
  reasoning        text,
  entry_zone_low   numeric,
  entry_zone_high  numeric,
  stop_loss        numeric,
  take_profit     numeric,
  position_size    text,
  risk_reward_ratio numeric,
  valid_until      timestamptz,
  computed_at      timestamptz NOT NULL,
  created_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "recs_read_all" ON recommendations;
CREATE POLICY "recs_read_all" ON recommendations FOR SELECT
  TO anon, authenticated USING (true);

-- ── backtest_results ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS backtest_results (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id            uuid NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  metric_type         backtest_metric_type NOT NULL,
  accuracy            integer NOT NULL DEFAULT 0 CHECK (accuracy BETWEEN 0 AND 100),
  total_predictions   integer NOT NULL DEFAULT 0,
  correct_predictions integer NOT NULL DEFAULT 0,
  period_start        timestamptz NOT NULL,
  period_end          timestamptz NOT NULL,
  metadata            jsonb,
  created_at          timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE backtest_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "backtest_read_all" ON backtest_results;
CREATE POLICY "backtest_read_all" ON backtest_results FOR SELECT
  TO anon, authenticated USING (true);

-- ── Indexes ──────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_scenarios_asset_computed ON scenarios(asset_id, computed_at DESC);
CREATE INDEX IF NOT EXISTS idx_scenarios_type ON scenarios(scenario_type);
CREATE INDEX IF NOT EXISTS idx_recs_asset_computed ON recommendations(asset_id, computed_at DESC);
CREATE INDEX IF NOT EXISTS idx_recs_action ON recommendations(action);
CREATE INDEX IF NOT EXISTS idx_backtest_asset_type ON backtest_results(asset_id, metric_type);
