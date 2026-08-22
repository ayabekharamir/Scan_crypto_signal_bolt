/*
# Aegis Phase 3 — Scoring, Risk, and Evidence tables

## Overview
Adds the three intelligence-engine tables that power Aegis's analytical
capabilities: asset scores, risk assessments, and evidence records. These
tables are written by the scoring/risk/evidence engines (Phase 3 services)
and read by the frontend to display intelligence panels on asset pages.

## New Tables

### 1. asset_scores
Stores computed scores per asset per timestamp. Each score is 0–100.

- `id` (uuid, PK)
- `asset_id` (uuid, FK → assets, CASCADE)
- `trend_score` (integer 0–100)
- `momentum_score` (integer 0–100)
- `volume_score` (integer 0–100)
- `liquidity_score` (integer 0–100)
- `attention_score` (integer 0–100)
- `confidence_score` (integer 0–100) — aggregate confidence
- `computed_at` (timestamptz) — when the scores were calculated
- `created_at` (timestamptz, default now())

### 2. risk_assessments
Stores computed risk metrics per asset per timestamp. Each risk is 0–100
(higher = more risk).

- `id` (uuid, PK)
- `asset_id` (uuid, FK → assets, CASCADE)
- `market_risk` (integer 0–100)
- `asset_risk` (integer 0–100)
- `liquidity_risk` (integer 0–100)
- `timing_risk` (integer 0–100)
- `news_risk` (integer 0–100)
- `event_risk` (integer 0–100)
- `overall_risk` (integer 0–100) — aggregate
- `risk_label` (text) — e.g. "Low", "Moderate", "High", "Extreme"
- `computed_at` (timestamptz)
- `created_at` (timestamptz, default now())

### 3. evidence
Stores evidence records that support analysis and recommendations.

- `id` (uuid, PK)
- `asset_id` (uuid, FK → assets, CASCADE)
- `source` (text) — e.g. "market_data", "news", "on_chain", "social"
- `title` (text) — short headline
- `description` (text) — detailed explanation
- `impact_type` (enum: positive, negative, neutral)
- `impact_score` (integer 0–100) — how strong the evidence is
- `confidence` (integer 0–100) — how confident we are in this evidence
- `url` (text, nullable) — source link
- `recorded_at` (timestamptz)
- `created_at` (timestamptz, default now())

## Security
- All three tables: public read (anon + authenticated), no user writes.
  They are populated by edge functions / service role background jobs.
- No UPDATE or DELETE policies — data is append-only from the server side.

## Important Notes
1. Scores and risk assessments are snapshot-based — each computation run
   creates a new row with a fresh `computed_at` timestamp, enabling
   historical tracking and future backtesting.
2. Evidence records support multiple sources and impact types, allowing
   the AI reasoning layer (Phase 4) to cite specific evidence.
3. Indexes target the common query pattern: latest scores/risk/evidence
   for a given asset.
*/

-- ── Enums ────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE impact_type AS ENUM ('positive', 'negative', 'neutral');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── asset_scores ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS asset_scores (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id         uuid NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  trend_score      integer NOT NULL DEFAULT 0 CHECK (trend_score BETWEEN 0 AND 100),
  momentum_score   integer NOT NULL DEFAULT 0 CHECK (momentum_score BETWEEN 0 AND 100),
  volume_score     integer NOT NULL DEFAULT 0 CHECK (volume_score BETWEEN 0 AND 100),
  liquidity_score  integer NOT NULL DEFAULT 0 CHECK (liquidity_score BETWEEN 0 AND 100),
  attention_score  integer NOT NULL DEFAULT 0 CHECK (attention_score BETWEEN 0 AND 100),
  confidence_score integer NOT NULL DEFAULT 0 CHECK (confidence_score BETWEEN 0 AND 100),
  computed_at      timestamptz NOT NULL,
  created_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE asset_scores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "scores_read_all" ON asset_scores;
CREATE POLICY "scores_read_all" ON asset_scores FOR SELECT
  TO anon, authenticated USING (true);

-- ── risk_assessments ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS risk_assessments (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id        uuid NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  market_risk     integer NOT NULL DEFAULT 0 CHECK (market_risk BETWEEN 0 AND 100),
  asset_risk      integer NOT NULL DEFAULT 0 CHECK (asset_risk BETWEEN 0 AND 100),
  liquidity_risk  integer NOT NULL DEFAULT 0 CHECK (liquidity_risk BETWEEN 0 AND 100),
  timing_risk     integer NOT NULL DEFAULT 0 CHECK (timing_risk BETWEEN 0 AND 100),
  news_risk       integer NOT NULL DEFAULT 0 CHECK (news_risk BETWEEN 0 AND 100),
  event_risk      integer NOT NULL DEFAULT 0 CHECK (event_risk BETWEEN 0 AND 100),
  overall_risk    integer NOT NULL DEFAULT 0 CHECK (overall_risk BETWEEN 0 AND 100),
  risk_label      text NOT NULL DEFAULT 'Moderate',
  computed_at     timestamptz NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE risk_assessments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "risk_read_all" ON risk_assessments;
CREATE POLICY "risk_read_all" ON risk_assessments FOR SELECT
  TO anon, authenticated USING (true);

-- ── evidence ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS evidence (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id      uuid NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  source        text NOT NULL,
  title         text NOT NULL,
  description   text,
  impact_type   impact_type NOT NULL DEFAULT 'neutral',
  impact_score  integer NOT NULL DEFAULT 50 CHECK (impact_score BETWEEN 0 AND 100),
  confidence    integer NOT NULL DEFAULT 50 CHECK (confidence BETWEEN 0 AND 100),
  url           text,
  recorded_at   timestamptz NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE evidence ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "evidence_read_all" ON evidence;
CREATE POLICY "evidence_read_all" ON evidence FOR SELECT
  TO anon, authenticated USING (true);

-- ── Indexes ──────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_scores_asset_computed ON asset_scores(asset_id, computed_at DESC);
CREATE INDEX IF NOT EXISTS idx_risk_asset_computed ON risk_assessments(asset_id, computed_at DESC);
CREATE INDEX IF NOT EXISTS idx_evidence_asset_recorded ON evidence(asset_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_evidence_impact_type ON evidence(impact_type);
