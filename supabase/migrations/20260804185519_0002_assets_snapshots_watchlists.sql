/*
# Aegis Phase 2 — Assets, price snapshots, and watchlist tables

## Overview
Adds the core market-data tables needed for the dashboard, scanner, and asset
detail pages. This migration introduces:

1. `assets` — the catalog of tradeable instruments (crypto, stocks, etc.)
2. `price_snapshots` — historical price records for each asset
3. `watchlists` — user watchlists (many-to-many between users and assets)

## New Tables

### 1. assets
- `id` (uuid, PK)
- `symbol` (text, unique, not null) — e.g. "BTC", "ETH"
- `name` (text, not null) — e.g. "Bitcoin"
- `market_type` (market_type enum, default 'crypto')
- `coingecko_id` (text, nullable) — CoinGecko API identifier
- `logo_url` (text, nullable)
- `description` (text, nullable)
- `is_active` (boolean, default true)
- `rank` (integer, nullable) — market cap rank
- `created_at` / `updated_at` (timestamptz)

### 2. price_snapshots
- `id` (uuid, PK)
- `asset_id` (uuid, FK → assets, cascading delete)
- `price_usd` (numeric, not null)
- `market_cap` (numeric, nullable)
- `volume_24h` (numeric, nullable)
- `change_24h` (numeric, nullable) — percentage
- `change_7d` (numeric, nullable) — percentage
- `high_24h` (numeric, nullable)
- `low_24h` (numeric, nullable)
- `recorded_at` (timestamptz, not null) — when the price was observed
- `created_at` (timestamptz, default now())

### 3. watchlists
- `id` (uuid, PK)
- `user_id` (uuid, FK → profiles, cascading delete)
- `name` (text, default 'My Watchlist')
- `created_at` / `updated_at` (timestamptz)

### 4. watchlist_items
- `id` (uuid, PK)
- `watchlist_id` (uuid, FK → watchlists, cascading delete)
- `asset_id` (uuid, FK → assets, cascading delete)
- `added_at` (timestamptz, default now())
- UNIQUE(watchlist_id, asset_id)

## Security
- `assets`: public read (anon + authenticated), no user writes (admin only via service role)
- `price_snapshots`: public read, no user writes (populated by edge functions / service role)
- `watchlists`: owner-scoped CRUD (authenticated only)
- `watchlist_items`: owner-scoped through parent watchlist ownership check

## Important Notes
1. assets and price_snapshots are read-only for frontend users — they are
   populated by background jobs / edge functions using the service role key.
2. Watchlist ownership is checked via the parent watchlist's user_id.
3. Indexes are added for common query patterns (symbol lookup, latest prices,
   watchlist membership).
*/

-- ── assets ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS assets (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol        text UNIQUE NOT NULL,
  name          text NOT NULL,
  market_type   market_type NOT NULL DEFAULT 'crypto',
  coingecko_id  text,
  logo_url      text,
  description   text,
  is_active     boolean NOT NULL DEFAULT true,
  rank          integer,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "assets_read_all" ON assets;
CREATE POLICY "assets_read_all" ON assets FOR SELECT
  TO anon, authenticated USING (true);

DROP TRIGGER IF EXISTS assets_updated_at ON assets;
CREATE TRIGGER assets_updated_at BEFORE UPDATE ON assets
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── price_snapshots ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS price_snapshots (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id     uuid NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  price_usd    numeric NOT NULL,
  market_cap   numeric,
  volume_24h   numeric,
  change_24h   numeric,
  change_7d    numeric,
  high_24h     numeric,
  low_24h      numeric,
  recorded_at  timestamptz NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE price_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "snapshots_read_all" ON price_snapshots;
CREATE POLICY "snapshots_read_all" ON price_snapshots FOR SELECT
  TO anon, authenticated USING (true);

-- ── watchlists ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS watchlists (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  name        text NOT NULL DEFAULT 'My Watchlist',
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE watchlists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "watchlists_select_own" ON watchlists;
CREATE POLICY "watchlists_select_own" ON watchlists FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "watchlists_insert_own" ON watchlists;
CREATE POLICY "watchlists_insert_own" ON watchlists FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "watchlists_update_own" ON watchlists;
CREATE POLICY "watchlists_update_own" ON watchlists FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "watchlists_delete_own" ON watchlists;
CREATE POLICY "watchlists_delete_own" ON watchlists FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS watchlists_updated_at ON watchlists;
CREATE TRIGGER watchlists_updated_at BEFORE UPDATE ON watchlists
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── watchlist_items ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS watchlist_items (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  watchlist_id  uuid NOT NULL REFERENCES watchlists(id) ON DELETE CASCADE,
  asset_id      uuid NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  added_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE(watchlist_id, asset_id)
);

ALTER TABLE watchlist_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wl_items_select_own" ON watchlist_items;
CREATE POLICY "wl_items_select_own" ON watchlist_items FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM watchlists WHERE watchlists.id = watchlist_items.watchlist_id AND watchlists.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "wl_items_insert_own" ON watchlist_items;
CREATE POLICY "wl_items_insert_own" ON watchlist_items FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM watchlists WHERE watchlists.id = watchlist_items.watchlist_id AND watchlists.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "wl_items_delete_own" ON watchlist_items;
CREATE POLICY "wl_items_delete_own" ON watchlist_items FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM watchlists WHERE watchlists.id = watchlist_items.watchlist_id AND watchlists.user_id = auth.uid())
  );

-- ── Indexes ──────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_assets_market_type ON assets(market_type);
CREATE INDEX IF NOT EXISTS idx_assets_symbol ON assets(symbol);
CREATE INDEX IF NOT EXISTS idx_assets_rank ON assets(rank);
CREATE INDEX IF NOT EXISTS idx_snapshots_asset_recorded ON price_snapshots(asset_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_snapshots_recorded_at ON price_snapshots(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_watchlists_user_id ON watchlists(user_id);
CREATE INDEX IF NOT EXISTS idx_wl_items_watchlist_id ON watchlist_items(watchlist_id);
CREATE INDEX IF NOT EXISTS idx_wl_items_asset_id ON watchlist_items(asset_id);
