# Roadmap

## Phase 1 — Foundation (Complete)
- [x] Project structure (Clean Architecture / DDD)
- [x] Environment configuration
- [x] Database schema (profiles, user_preferences, audit_logs)
- [x] Authentication (sign in, sign up, session management)
- [x] Core architecture (Supabase client, AuthContext, i18n, routing, PWA)
- [x] Dark theme design system
- [x] RTL/LTR localization (Persian default, English supported)

## Phase 2 — Dashboard & Navigation (Complete)
- [x] Full dashboard with market overview widgets (market cap, volume, gainers/losers)
- [x] Market sentiment banner (bullish/bearish)
- [x] Top movers section with live data
- [x] Quick-link cards to scanner, watchlist, analysis
- [x] Navigation system (sidebar, mobile drawer, language toggle)
- [x] Market scanner page with search, market filter, sortable columns
- [x] Asset detail page with price overview, metrics, sparkline chart
- [x] Watchlist page with add/remove functionality
- [x] Database tables: assets, price_snapshots, watchlists, watchlist_items
- [x] Seeded 10 crypto assets with price snapshots
- [x] RTL/LTR localization for all new pages

## Phase 3 — Intelligence Engines (Complete)
- [x] Scoring Engine (trend, momentum, volume, liquidity, attention, confidence — 0–100)
- [x] Risk Engine (market, asset, liquidity, timing, news, event, overall — 0–100)
- [x] Evidence Engine (market_data, news, on_chain, social sources with impact + confidence)
- [x] Database tables: asset_scores, risk_assessments, evidence
- [x] Seeded scores and risk assessments for 10 crypto assets
- [x] Seeded 7 evidence records across BTC, ETH, SOL, DOT
- [x] ScorePanel component with progress bars and color-coded scores
- [x] RiskPanel component with circular gauge and risk factor breakdown
- [x] EvidencePanel component with source badges, impact indicators, and confidence bars
- [x] Integrated all three panels into Asset Detail page
- [x] i18n translations for scoring, risk, and evidence sections

## Phase 4 — AI Analysis (Complete)
- [x] AI Reasoning layer — recommendations with detailed reasoning text
- [x] Scenario Engine (continuation, correction, breakout, weakness, crash) with probability, price targets, key drivers
- [x] Recommendation generation with confidence, entry zone, stop loss, take profit, position size, R:R ratio
- [x] Backtest recording system — score accuracy, scenario accuracy, recommendation accuracy
- [x] Database tables: scenarios, recommendations, backtest_results
- [x] Seeded 9 scenarios across BTC, ETH, SOL
- [x] Seeded 4 recommendations (BTC: buy, ETH: buy, SOL: hold, DOT: reduce)
- [x] Seeded 5 backtest results across BTC and ETH
- [x] ScenarioPanel component with probability bars, price targets, key driver tags
- [x] RecommendationPanel component with action badge, confidence bar, reasoning block, trading parameters
- [x] BacktestPanel component with accuracy metrics and prediction counts
- [x] Integrated all three panels into Asset Detail page
- [x] i18n translations for scenario, recommendation, backtest sections

## Phase 5 — User Tools (Complete)
- [x] Portfolio management (holdings, cost basis, P&L, performance summary)
- [x] Decision Journal (buy/sell/hold/watch/note entries with emotion, tags, rating)
- [x] Watchlist management (add/remove assets)
- [x] Alerts system (price above/below, score above/below, risk above)
- [x] Database tables: portfolio_items, journal_entries, alerts
- [x] Services: portfolio.service.ts, journal.service.ts, alert.service.ts
- [x] Pages: PortfolioPage, JournalPage, AlertsPage
- [x] Routes: /portfolio, /journal, /alerts wired into router
- [x] i18n translations for portfolio, journal, alerts sections

## Phase 6 — Live Data & External APIs (Complete)
- [x] CoinGecko integration (edge function fetches live prices for all active crypto assets)
- [x] Price snapshot storage (upsert_price_snapshot SECURITY DEFINER function)
- [x] Caching layer (api_cache table with TTL support)
- [x] Alert checking (refresh-prices edge function checks active alerts against latest prices/scores/risk)
- [x] "Refresh Prices" button on Dashboard and Scanner pages
- [x] Market-data service layer (client-side fetch to edge functions)
- [ ] Binance / Bybit / OKX public endpoints (future enhancement)
- [x] Scheduled background jobs (pg_cron + pg_net, auto-refresh every 5 minutes)

## Phase 7 — Production (Complete)
- [x] Performance optimization (route-based code splitting via React.lazy, React Query tuning)
- [x] Monitoring and error tracking (ErrorBoundary, toast notifications, mutation error logging)
- [x] Testing (Vitest + React Testing Library, 20 unit tests for utils and components)
- [x] Production build verified (all pages split into separate chunks)
- [ ] Deployment pipeline (CI/CD, future)
- [ ] Production launch (future)

## Future Markets
- [ ] Stocks
- [ ] Forex
- [ ] Commodities
- [ ] ETFs
