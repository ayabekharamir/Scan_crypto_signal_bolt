# Database

## Overview

Aegis uses PostgreSQL via Supabase. All tables use UUID primary keys, foreign keys, indexes, and Row Level Security (RLS).

## Tables

### profiles
Links to Supabase `auth.users`. Auto-created via trigger on signup.

| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | References `auth.users(id)` ON DELETE CASCADE |
| email | text, unique | Denormalized from auth |
| display_name | text, nullable | User-chosen name |
| avatar_url | text, nullable | Profile picture URL |
| role | user_role | `user` (default), `analyst`, `admin` |
| locale | app_locale | `fa` (default), `en` |
| created_at | timestamptz | Default now() |
| updated_at | timestamptz | Auto-updated via trigger |

**RLS:**
- SELECT: own row only (`auth.uid() = id`)
- UPDATE: own row only
- No direct INSERT — handled by trigger `on_auth_user_created`

### user_preferences
Per-user settings. Auto-created via trigger when profile is created.

| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | Default gen_random_uuid() |
| user_id | uuid, unique | FK → profiles(id) ON DELETE CASCADE |
| locale | app_locale | `fa`, `en` |
| theme | theme_mode | `dark` |
| default_market | market_type | `crypto` (default) |
| risk_tolerance | risk_tolerance | `moderate` (default) |
| notification_enabled | boolean | Default true |
| email_alerts | boolean | Default false |
| created_at | timestamptz | |
| updated_at | timestamptz | Auto-updated |

**RLS:** Full CRUD, own row only (`auth.uid() = user_id`)

### audit_logs
Security audit trail.

| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| user_id | uuid, nullable | FK → profiles(id) ON DELETE SET NULL |
| action | audit_action | login, logout, signup, profile_update, preferences_update, password_change |
| metadata | jsonb, nullable | Extra context |
| ip_address | inet, nullable | |
| created_at | timestamptz | Default now() |

**RLS:**
- SELECT: own logs only
- INSERT: own logs only
- No UPDATE or DELETE

## Enums

| Enum | Values |
|---|---|
| user_role | user, analyst, admin |
| app_locale | fa, en |
| theme_mode | dark |
| market_type | crypto, stock, forex, commodity, etf |
| risk_tolerance | conservative, moderate, aggressive |
| audit_action | login, logout, signup, profile_update, preferences_update, password_change |

## Triggers

1. `on_auth_user_created` — After INSERT on `auth.users` → creates `profiles` row
2. `on_profile_created` — After INSERT on `profiles` → creates `user_preferences` row
3. `profiles_updated_at` — Before UPDATE on `profiles` → sets `updated_at = now()`
4. `prefs_updated_at` — Before UPDATE on `user_preferences` → sets `updated_at = now()`

## Indexes

| Index | Table | Column(s) |
|---|---|---|
| idx_audit_logs_user_id | audit_logs | user_id |
| idx_audit_logs_created_at | audit_logs | created_at DESC |
| idx_profiles_role | profiles | role |

## New Tables (Phase 6)

### api_cache
Key-value cache for external API responses with TTL support. Internal infrastructure — no direct client access.

| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| cache_key | text, UNIQUE | e.g. "coingecko:markets" |
| response_data | jsonb | Raw API response |
| fetched_at | timestamptz | When data was fetched |
| expires_at | timestamptz | When cache entry expires |

**RLS:** Deny-by-default (all policies use `false`). Only accessible via service role key in edge functions.

### upsert_price_snapshot() function
SECURITY DEFINER function that inserts a price snapshot for an asset. Called by edge functions with the service role key.

Parameters: p_asset_id, p_price_usd, p_market_cap, p_volume_24h, p_change_24h, p_change_7d, p_high_24h, p_low_24h

## New Tables (Phase 5)

### portfolio_items
User's holdings — what they own, how much, at what cost basis.

| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| user_id | uuid, FK → profiles | ON DELETE CASCADE |
| asset_id | uuid, FK → assets | ON DELETE CASCADE |
| quantity | numeric, > 0 | |
| avg_buy_price | numeric, > 0 | Cost basis in USD |
| notes | text, nullable | |
| added_at | timestamptz | |
| updated_at | timestamptz | |
| | UNIQUE(user_id, asset_id) | |

**RLS:** Full CRUD, own row only (auth.uid() = user_id).

### journal_entries
Decision journal — users record reasoning for decisions.

| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| user_id | uuid, FK → profiles | ON DELETE CASCADE |
| asset_id | uuid, FK → assets | ON DELETE CASCADE |
| entry_type | journal_entry_type | buy, sell, hold, watch, note |
| title | text | |
| content | text, nullable | Detailed reasoning |
| emotion | text, nullable | e.g. confident, anxious |
| tags | text[] | User-defined tags |
| rating | integer 1–5, nullable | Self-assessment |
| created_at | timestamptz | |
| updated_at | timestamptz | |

**RLS:** Full CRUD, own row only.

### alerts
User-defined price or score alerts.

| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| user_id | uuid, FK → profiles | ON DELETE CASCADE |
| asset_id | uuid, FK → assets | ON DELETE CASCADE |
| alert_type | alert_type | price_above, price_below, score_above, score_below, risk_above |
| threshold | numeric | Trigger value |
| message | text, nullable | Custom message |
| is_active | boolean | Default true |
| triggered_at | timestamptz, nullable | When alert fired |
| created_at | timestamptz | |

**RLS:** Full CRUD, own row only.

## New Enums (Phase 5)

| Enum | Values |
|---|---|
| journal_entry_type | buy, sell, hold, watch, note |
| alert_type | price_above, price_below, score_above, score_below, risk_above |

## New Tables (Phase 4)

### scenarios
Possible future paths for an asset.

| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| asset_id | uuid, FK → assets | ON DELETE CASCADE |
| scenario_type | scenario_type | continuation, correction, breakout, weakness, crash |
| title | text | Short headline |
| description | text, nullable | Detailed explanation |
| probability | integer 0–100 | Likelihood |
| price_target_low | numeric, nullable | Low end of target range |
| price_target_high | numeric, nullable | High end of target range |
| timeframe | text, nullable | e.g. "1-3 days" |
| key_drivers | text[] | Array of driver descriptions |
| computed_at | timestamptz | |
| created_at | timestamptz | |

**RLS:** Public read. No user writes.

### recommendations
AI-generated actionable recommendations.

| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| asset_id | uuid, FK → assets | ON DELETE CASCADE |
| action | recommendation_action | strong_buy, buy, hold, reduce, sell, avoid |
| confidence | integer 0–100 | |
| summary | text | One-line summary |
| reasoning | text, nullable | Detailed AI reasoning |
| entry_zone_low / entry_zone_high | numeric, nullable | Suggested entry range |
| stop_loss | numeric, nullable | Suggested stop loss |
| take_profit | numeric, nullable | Suggested take profit |
| position_size | text, nullable | Small, Medium, Large |
| risk_reward_ratio | numeric, nullable | R:R ratio |
| valid_until | timestamptz, nullable | Expiration |
| computed_at | timestamptz | |
| created_at | timestamptz | |

**RLS:** Public read. No user writes.

### backtest_results
Historical accuracy tracking.

| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| asset_id | uuid, FK → assets | ON DELETE CASCADE |
| metric_type | backtest_metric_type | score_accuracy, scenario_accuracy, recommendation_accuracy |
| accuracy | integer 0–100 | Percentage accuracy |
| total_predictions | integer | Total evaluated |
| correct_predictions | integer | Correct count |
| period_start | timestamptz | Backtest start |
| period_end | timestamptz | Backtest end |
| metadata | jsonb, nullable | Extra context |
| created_at | timestamptz | |

**RLS:** Public read. No user writes.

## New Enums (Phase 4)

| Enum | Values |
|---|---|
| scenario_type | continuation, correction, breakout, weakness, crash |
| recommendation_action | strong_buy, buy, hold, reduce, sell, avoid |
| backtest_metric_type | score_accuracy, scenario_accuracy, recommendation_accuracy |

## New Tables (Phase 3)

### asset_scores
Computed scores per asset per timestamp. Each score is 0–100 (higher = better).

| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| asset_id | uuid, FK → assets | ON DELETE CASCADE |
| trend_score | integer 0–100 | Trend direction strength |
| momentum_score | integer 0–100 | Price momentum |
| volume_score | integer 0–100 | Trading volume health |
| liquidity_score | integer 0–100 | Market liquidity |
| attention_score | integer 0–100 | Social/market attention |
| confidence_score | integer 0–100 | Aggregate confidence |
| computed_at | timestamptz | When scores were calculated |
| created_at | timestamptz | |

**RLS:** Public read. No user writes (populated by engine services).

### risk_assessments
Computed risk metrics per asset per timestamp. Each risk is 0–100 (higher = more risk).

| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| asset_id | uuid, FK → assets | ON DELETE CASCADE |
| market_risk | integer 0–100 | Broad market risk |
| asset_risk | integer 0–100 | Asset-specific risk |
| liquidity_risk | integer 0–100 | Liquidity risk |
| timing_risk | integer 0–100 | Timing risk |
| news_risk | integer 0–100 | News-related risk |
| event_risk | integer 0–100 | Event risk |
| overall_risk | integer 0–100 | Aggregate risk |
| risk_label | text | Low, Moderate, High, Extreme |
| computed_at | timestamptz | |
| created_at | timestamptz | |

**RLS:** Public read. No user writes.

### evidence
Evidence records supporting analysis and recommendations.

| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| asset_id | uuid, FK → assets | ON DELETE CASCADE |
| source | text | market_data, news, on_chain, social |
| title | text | Short headline |
| description | text, nullable | Detailed explanation |
| impact_type | impact_type | positive, negative, neutral |
| impact_score | integer 0–100 | Strength of evidence |
| confidence | integer 0–100 | Confidence in evidence |
| url | text, nullable | Source link |
| recorded_at | timestamptz | When evidence was observed |
| created_at | timestamptz | |

**RLS:** Public read. No user writes.

## New Enums (Phase 3)

| Enum | Values |
|---|---|
| impact_type | positive, negative, neutral |

## New Tables (Phase 2)

### assets
Market asset catalog. Read-only for frontend users (populated by background jobs / admin).

| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| symbol | text, unique | e.g. "BTC" |
| name | text | e.g. "Bitcoin" |
| market_type | market_type | crypto (default), stock, forex, commodity, etf |
| coingecko_id | text, nullable | CoinGecko API identifier |
| logo_url | text, nullable | Asset logo |
| description | text, nullable | |
| is_active | boolean | Default true |
| rank | integer, nullable | Market cap rank |
| created_at / updated_at | timestamptz | |

**RLS:** Public read (anon + authenticated). No user writes.

### price_snapshots
Historical price data per asset.

| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| asset_id | uuid, FK → assets | ON DELETE CASCADE |
| price_usd | numeric | |
| market_cap | numeric, nullable | |
| volume_24h | numeric, nullable | |
| change_24h | numeric, nullable | Percentage |
| change_7d | numeric, nullable | Percentage |
| high_24h | numeric, nullable | |
| low_24h | numeric, nullable | |
| recorded_at | timestamptz | When price was observed |
| created_at | timestamptz | |

**RLS:** Public read. No user writes.

### watchlists
User watchlists.

| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| user_id | uuid, FK → profiles | ON DELETE CASCADE, DEFAULT auth.uid() |
| name | text | Default 'My Watchlist' |
| created_at / updated_at | timestamptz | |

**RLS:** Full CRUD, own row only.

### watchlist_items
Many-to-many join between watchlists and assets.

| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| watchlist_id | uuid, FK → watchlists | ON DELETE CASCADE |
| asset_id | uuid, FK → assets | ON DELETE CASCADE |
| added_at | timestamptz | |
| | UNIQUE(watchlist_id, asset_id) | |

**RLS:** Owner-scoped through parent watchlist ownership check.
