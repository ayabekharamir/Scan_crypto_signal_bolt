# API Reference

## Overview

Aegis uses Supabase as its backend. The frontend communicates directly with Supabase PostgreSQL via the anon-key client, protected by Row Level Security (RLS). Server-side logic runs as Supabase Edge Functions.

## Client-Side Services

### Profile Service (`src/services/profile.service.ts`)

#### `fetchProfile(userId: string): Promise<Profile | null>`
Retrieves the current user's profile. Returns null if not found.

#### `updateProfile(userId: string, updates): Promise<Profile>`
Updates display name, avatar URL, or locale.

### Audit Service (`src/services/audit.service.ts`)

#### `logAudit(userId: string | null, action: AuditAction, metadata?): Promise<void>`
Writes an audit log entry. Failures are logged to console but do not throw.

### Asset Service (`src/services/asset.service.ts`)

#### `fetchAssets(market?: MarketType): Promise<Asset[]>`
Returns all active assets, optionally filtered by market type. Ordered by rank.

#### `fetchAssetBySymbol(symbol: string): Promise<Asset | null>`
Returns a single asset by its symbol (e.g. "BTC"). Returns null if not found.

#### `fetchAssetById(id: string): Promise<Asset | null>`
Returns a single asset by its UUID.

#### `fetchLatestPrice(assetId: string): Promise<PriceSnapshot | null>`
Returns the most recent price snapshot for an asset.

#### `fetchAssetsWithPrices(market?: MarketType): Promise<AssetWithPrice[]>`
Returns all assets with their latest price snapshot attached. Used by dashboard and scanner.

#### `fetchPriceHistory(assetId: string, limit?): Promise<PriceSnapshot[]>`
Returns historical price snapshots for an asset, ordered oldest to newest.

### Watchlist Service (`src/services/watchlist.service.ts`)

#### `fetchUserWatchlists(userId: string): Promise<Watchlist[]>`
Returns all watchlists owned by the user.

#### `fetchWatchlistItems(watchlistId: string): Promise<(WatchlistItem & { asset: Asset })[]>`
Returns all items in a watchlist, with the associated asset data.

#### `createWatchlist(userId: string, name: string): Promise<Watchlist>`
Creates a new watchlist for the user.

#### `addToWatchlist(watchlistId: string, assetId: string): Promise<void>`
Adds an asset to a watchlist.

#### `removeFromWatchlist(watchlistId: string, assetId: string): Promise<void>`
Removes an asset from a watchlist.

#### `isAssetInWatchlist(watchlistId: string, assetId: string): Promise<boolean>`
Checks if an asset is already in a watchlist.

### Scoring Service (`src/services/scoring.service.ts`)

#### `fetchLatestScore(assetId: string): Promise<AssetScore | null>`
Returns the most recent computed scores for an asset (trend, momentum, volume, liquidity, attention, confidence).

#### `fetchScoreHistory(assetId: string, limit?): Promise<AssetScore[]>`
Returns historical score snapshots, ordered oldest to newest.

### Risk Service (`src/services/risk.service.ts`)

#### `fetchLatestRisk(assetId: string): Promise<RiskAssessment | null>`
Returns the most recent risk assessment for an asset (market, asset, liquidity, timing, news, event, overall + label).

### Evidence Service (`src/services/evidence.service.ts`)

#### `fetchEvidence(assetId: string, limit?): Promise<Evidence[]>`
Returns evidence records for an asset, ordered most recent first.

### Scenario Service (`src/services/scenario.service.ts`)

#### `fetchScenarios(assetId: string): Promise<Scenario[]>`
Returns scenario predictions for an asset, ordered by probability descending.

### Recommendation Service (`src/services/recommendation.service.ts`)

#### `fetchLatestRecommendation(assetId: string): Promise<Recommendation | null>`
Returns the most recent AI recommendation for an asset, including action, confidence, reasoning, and trade parameters.

### Backtest Service (`src/services/backtest.service.ts`)

#### `fetchBacktestResults(assetId: string): Promise<BacktestResult[]>`
Returns backtest accuracy results for an asset across all metric types.

### Portfolio Service (`src/services/portfolio.service.ts`)

#### `fetchPortfolio(userId: string): Promise<PortfolioItemWithPrice[]>`
Returns user's portfolio with live prices, market value, and P&L computed per holding.

#### `addToPortfolio(userId, assetId, quantity, avgBuyPrice, notes?): Promise<void>`
Adds or updates a holding. Uses upsert on (user_id, asset_id).

#### `updatePortfolioItem(id, updates): Promise<void>`
Updates quantity, price, or notes for a holding.

#### `removeFromPortfolio(id: string): Promise<void>`
Removes a holding.

#### `computePortfolioSummary(items): { totalValue, totalCost, totalPnl, totalPnlPercent }`
Computes aggregate portfolio metrics from enriched items.

### Journal Service (`src/services/journal.service.ts`)

#### `fetchJournalEntries(userId: string): Promise<JournalEntry[]>`
Returns user's journal entries with associated asset data, newest first.

#### `createJournalEntry(userId, assetId, entryType, title, content, emotion?, tags?, rating?): Promise<JournalEntry>`
Creates a new journal entry.

#### `updateJournalEntry(id, updates): Promise<void>`
Updates a journal entry.

#### `deleteJournalEntry(id: string): Promise<void>`
Deletes a journal entry.

### Alert Service (`src/services/alert.service.ts`)

#### `fetchAlerts(userId: string): Promise<Alert[]>`
Returns user's alerts with associated asset data, newest first.

#### `createAlert(userId, assetId, alertType, threshold, message?): Promise<Alert>`
Creates a new alert.

#### `toggleAlert(id, isActive): Promise<void>`
Activates or deactivates an alert.

#### `deleteAlert(id: string): Promise<void>`
Deletes an alert.

### Market Data Service (`src/services/market-data.service.ts`)

#### `refreshPrices(): Promise<PriceRefreshResult>`
Calls the `coingecko-prices` edge function to fetch live prices from CoinGecko and upsert price snapshots. Returns the number of assets updated.

#### `checkAlerts(): Promise<AlertCheckResult>`
Calls the `refresh-prices` edge function to check all active alerts against latest price/score/risk data and mark triggered alerts.

## Edge Functions

### `coingecko-prices` (deployed)
- **Method:** POST
- **Auth:** No JWT verification (called with anon key)
- **Purpose:** Fetches live prices from CoinGecko Markets API for all active crypto assets with a coingecko_id. Upserts price snapshots via `upsert_price_snapshot()` function. Updates asset logo URLs. Caches raw API response in `api_cache` table.
- **Returns:** `{ success, assets_updated, symbols[], cached_at }`

### `refresh-prices` (deployed)
- **Method:** POST
- **Auth:** No JWT verification (called with anon key)
- **Purpose:** Checks all active, untriggered alerts against latest price/score/risk data. Marks triggered alerts as inactive with `triggered_at` timestamp.
- **Returns:** `{ success, alerts_checked, alerts_triggered, triggered_ids[], checked_at }`

## Supabase Auth

### `supabase.auth.signUp({ email, password })`
Creates a new user account. A trigger auto-creates the profile and preferences rows.

### `supabase.auth.signInWithPassword({ email, password })`
Authenticates and returns a session.

### `supabase.auth.signOut()`
Clears the current session.

### `supabase.auth.onAuthStateChange(callback)`
Subscribes to auth state changes. Used by `AuthContext`.

## Edge Function Conventions

All deployed edge functions follow these patterns:
- CORS headers on every response (preflight, success, error)
- Try/catch error handling with JSON error responses
- `npm:` / `jsr:` prefixed imports (pinned versions)
- No shared module-level state (state lives in database tables)
- Service role key for privileged database operations

## Data Access Patterns

```
Frontend (anon key)
    ↓
Supabase Client (RLS enforced)
    ↓
PostgreSQL Tables
    ↓
Triggers (auto-create profile, preferences)
```

For privileged operations (admin actions, bulk data operations), Edge Functions with the service role key will be used in future phases.
