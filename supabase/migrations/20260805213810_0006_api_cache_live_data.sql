/*
# Aegis Phase 6 — Live Data Infrastructure

## Overview
Adds an API response cache table and a function to upsert price snapshots
from edge function fetches. This supports the CoinGecko integration and
scheduled price updates.

## New Table: api_cache
A simple key-value cache for external API responses, with TTL support.

- `id` (uuid, PK)
- `cache_key` (text, UNIQUE) — e.g. "coingecko:markets:bitcoin"
- `response_data` (jsonb) — the raw API response
- `fetched_at` (timestamptz) — when the data was fetched
- `expires_at` (timestamptz) — when the cache entry expires

## New Function: upsert_price_snapshot
A SECURITY DEFINER function that allows edge functions (using the service
role key) to upsert price snapshots for active assets. This is called by
the scheduled price-update edge function.
*/

-- ── api_cache ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS api_cache (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key     text NOT NULL UNIQUE,
  response_data jsonb NOT NULL,
  fetched_at    timestamptz NOT NULL DEFAULT now(),
  expires_at    timestamptz NOT NULL
);

ALTER TABLE api_cache ENABLE ROW LEVEL SECURITY;

-- Cache is internal infrastructure — no direct client access
DROP POLICY IF EXISTS "api_cache_select" ON api_cache;
CREATE POLICY "api_cache_select" ON api_cache FOR SELECT
  TO authenticated USING (false);

DROP POLICY IF EXISTS "api_cache_insert" ON api_cache;
CREATE POLICY "api_cache_insert" ON api_cache FOR INSERT
  TO authenticated WITH CHECK (false);

DROP POLICY IF EXISTS "api_cache_update" ON api_cache;
CREATE POLICY "api_cache_update" ON api_cache FOR UPDATE
  TO authenticated USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "api_cache_delete" ON api_cache;
CREATE POLICY "api_cache_delete" ON api_cache FOR DELETE
  TO authenticated USING (false);

CREATE INDEX IF NOT EXISTS idx_api_cache_key ON api_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_api_cache_expires ON api_cache(expires_at);

-- ── upsert_price_snapshot function ────────────────────────────────
-- Allows edge functions (service role) to upsert price snapshots

CREATE OR REPLACE FUNCTION upsert_price_snapshot(
  p_asset_id    uuid,
  p_price_usd   numeric,
  p_market_cap  numeric DEFAULT NULL,
  p_volume_24h  numeric DEFAULT NULL,
  p_change_24h  numeric DEFAULT NULL,
  p_change_7d   numeric DEFAULT NULL,
  p_high_24h    numeric DEFAULT NULL,
  p_low_24h     numeric DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO price_snapshots (
    asset_id, price_usd, market_cap, volume_24h,
    change_24h, change_7d, high_24h, low_24h, recorded_at
  ) VALUES (
    p_asset_id, p_price_usd, p_market_cap, p_volume_24h,
    p_change_24h, p_change_7d, p_high_24h, p_low_24h, now()
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION upsert_price_snapshot TO authenticated;
