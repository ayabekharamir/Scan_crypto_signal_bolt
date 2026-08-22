# Changelog

All notable changes to Aegis are documented here.

## [0.7.0] — Phase 7: Production Optimization, Monitoring & Testing

### Added
- Performance:
  - Route-based code splitting via React.lazy + Suspense — each page is now a separate chunk (main bundle reduced from 575KB to 485KB)
  - React Query default staleTime (30s), retry (1), and refetchOnWindowFocus (false) for optimal caching
- Monitoring & Error Handling:
  - ErrorBoundary component — catches render errors and shows a recovery screen with reload button
  - ToastProvider + useToast hook — global toast notification system (success, error, info) with auto-dismiss
  - Global mutation error logging via React Query default options
- Testing:
  - Vitest + React Testing Library + jsdom test environment
  - 20 unit tests covering: cn(), formatPrice(), formatNumber(), formatPercent(), formatTimeAgo(), ToastProvider (rendering + context boundary)
  - Test scripts: `npm test` (run), `npm run test:watch` (watch mode)
- Config:
  - vitest.config.ts with `@/` alias and jsdom environment
  - test setup file with @testing-library/jest-dom matchers

## [0.6.0] — Phase 6: Live Market Data, API Caching & Alert Checking

### Added
- Database:
  - `api_cache` table — key-value cache for external API responses with TTL (fetched_at, expires_at)
  - `upsert_price_snapshot()` SECURITY DEFINER function — allows edge functions to insert price snapshots
  - RLS enabled on api_cache (deny-by-default, internal infrastructure only)
- Edge Functions (deployed to Supabase):
  - `coingecko-prices` — fetches live prices from CoinGecko Markets API for all active crypto assets, upserts price snapshots, updates asset logo URLs, caches raw API response
  - `refresh-prices` — checks all active alerts against latest price/score/risk data, marks triggered alerts as inactive with triggered_at timestamp
- Services:
  - `market-data.service.ts` — refreshPrices() and checkAlerts() client-side functions that call the edge functions
- UI:
  - "Refresh Prices" button on Dashboard page with success/error feedback
  - "Refresh Prices" button on Scanner page with success/error feedback
  - Both buttons show spinning icon during refresh and invalidate React Query caches on success
- i18n translations for refresh, refreshError, refreshSuccess (both Persian and English)

## [0.5.0] — Phase 5: Portfolio, Journal & Alerts

### Added
- Database tables:
  - `portfolio_items` — user holdings with quantity, avg buy price, notes (UNIQUE per user+asset)
  - `journal_entries` — decision journal with entry type, emotion, tags, rating
  - `alerts` — price/score/risk alerts with threshold and active/triggered state
  - Enums: `journal_entry_type` (buy, sell, hold, watch, note), `alert_type` (price_above, price_below, score_above, score_below, risk_above)
- Services:
  - `portfolio.service.ts` — fetchPortfolio (with live P&L), addToPortfolio, updatePortfolioItem, removeFromPortfolio, computePortfolioSummary
  - `journal.service.ts` — fetchJournalEntries, createJournalEntry, updateJournalEntry, deleteJournalEntry, journalTypeConfig
  - `alert.service.ts` — fetchAlerts, createAlert, toggleAlert, deleteAlert, alertTypeConfig
- Pages:
  - PortfolioPage — summary cards (total value, cost, P&L, return), holdings table with live prices, add holding modal
  - JournalPage — entry cards with type badges, emotion, star rating, tags, add entry modal with full form
  - AlertsPage — alert cards with type icons, threshold values, activate/deactivate toggle, add alert modal
- Routes: /portfolio, /journal, /alerts
- i18n translations for portfolio, journal, alerts sections (both Persian and English)
- All three tables use ownership-scoped RLS (auth.uid() = user_id) with full CRUD

## [0.4.0] — Phase 4: AI Reasoning, Scenarios, Recommendations & Backtest

### Added
- Database tables:
  - `scenarios` — future path predictions with probability, price targets, key drivers
  - `recommendations` — AI-generated actionable recommendations with trade parameters
  - `backtest_results` — historical accuracy tracking for scores, scenarios, and recommendations
  - Enums: `scenario_type` (continuation, correction, breakout, weakness, crash), `recommendation_action` (strong_buy, buy, hold, reduce, sell, avoid), `backtest_metric_type`
- Seeded 9 scenarios across BTC (3), ETH (3), SOL (3) covering all scenario types
- Seeded 4 recommendations: BTC (buy, 82% confidence), ETH (buy, 76%), SOL (hold, 58%), DOT (reduce, 52%)
- Seeded 5 backtest results for BTC and ETH across all metric types
- Services:
  - `scenario.service.ts` — fetchScenarios, scenario type config with colors and icons
  - `recommendation.service.ts` — fetchLatestRecommendation, action config with colors
  - `backtest.service.ts` — fetchBacktestResults, metric config, accuracy color helpers
- UI Components:
  - ScenarioPanel — scenario cards with type badges, probability bars, price targets, key driver tags
  - RecommendationPanel — action badge with confidence bar, AI reasoning block, entry zone/stop loss/take profit cards, position size and R:R ratio
  - BacktestPanel — accuracy metric cards with progress bars and prediction counts
- Asset Detail page updated with all three new panels (recommendation, scenarios, backtest)
- i18n translations for scenario, recommendation, backtest sections (both Persian and English)

## [0.3.0] — Phase 3: Scoring, Risk, and Evidence Engines

### Added
- Database tables:
  - `asset_scores` — computed scores per asset (trend, momentum, volume, liquidity, attention, confidence)
  - `risk_assessments` — risk metrics per asset (market, asset, liquidity, timing, news, event, overall)
  - `evidence` — evidence records with source, impact type, impact score, and confidence
  - `impact_type` enum (positive, negative, neutral)
- Seeded scores and risk assessments for all 10 crypto assets
- Seeded 7 evidence records (BTC: 3, ETH: 2, SOL: 1, DOT: 1) covering market_data, news, on_chain, and social sources
- Services:
  - `scoring.service.ts` — fetchLatestScore, fetchScoreHistory, score field definitions, color helpers
  - `risk.service.ts` — fetchLatestRisk, risk field definitions, color and label helpers
  - `evidence.service.ts` — fetchEvidence, impact and source color helpers
- UI Components:
  - ScorePanel — 6 score cards with color-coded progress bars (green/cyan/yellow/red)
  - RiskPanel — circular SVG gauge for overall risk + 6 risk factor cards with progress bars
  - EvidencePanel — timeline of evidence records with source badges, impact arrows, and dual progress bars (impact + confidence)
- Asset Detail page updated to show all three intelligence panels
- i18n translations for scoring, risk, evidence (both Persian and English)

## [0.2.0] — Phase 2: Dashboard, Scanner, Assets & Watchlist

### Added
- Database tables:
  - `assets` — market asset catalog (crypto, stocks, etc.) with CoinGecko ID mapping
  - `price_snapshots` — historical price records per asset
  - `watchlists` — user watchlists with ownership-scoped RLS
  - `watchlist_items` — many-to-many join between watchlists and assets
- Seeded 10 cryptocurrency assets (BTC, ETH, SOL, BNB, XRP, ADA, AVAX, DOT, LINK, MATIC) with price snapshots
- Services:
  - `asset.service.ts` — fetchAssets, fetchAssetBySymbol, fetchLatestPrice, fetchAssetsWithPrices, fetchPriceHistory
  - `watchlist.service.ts` — fetchUserWatchlists, fetchWatchlistItems, createWatchlist, addToWatchlist, removeFromWatchlist, isAssetInWatchlist
- Pages:
  - Dashboard: market cap/volume stats, gainers/losers count, market sentiment banner, top movers, quick links
  - Scanner: searchable/sortable asset table with market type filter
  - Asset Detail: price overview, 24h/7d metrics, high/low range, SVG sparkline price chart, AI intelligence placeholder
  - Watchlist: user watchlist with add/remove and empty state
- Formatting utilities: formatPrice, formatNumber, formatPercent, formatTimeAgo
- i18n translations for scanner, asset detail, watchlist, and dashboard additions
- Routes: /scanner, /assets/:symbol, /watchlist wired into router

## [0.1.0] — Phase 1: Foundation

### Added
- Project structure following Clean Architecture / DDD
- Vite + React + TypeScript setup with path alias (`@/`)
- Tailwind CSS dark theme design system with custom color ramps
  - Primary (cyan), Secondary (slate), Accent (emerald)
  - Success, Warning, Error color scales
  - Surface color ramp for layered dark backgrounds
- Supabase client singleton (`src/lib/supabase.ts`)
- Database schema:
  - `profiles` table (linked to auth.users, auto-created on signup)
  - `user_preferences` table (auto-created with defaults)
  - `audit_logs` table (security audit trail)
  - Custom enums: user_role, app_locale, theme_mode, market_type, risk_tolerance, audit_action
  - Database triggers for auto-creation and updated_at maintenance
  - Row Level Security on all tables with ownership-scoped policies
- Authentication:
  - Sign in page with error handling
  - Sign up page with validation
  - AuthContext with session management
  - AuthGuard for protected routes
  - Audit logging for login/logout/signup events
- Internationalization:
  - i18next with Persian (default, RTL) and English (LTR) support
  - `applyDocumentLocale()` for dynamic `dir` and `lang` attributes
  - Translation files for auth, navigation, dashboard, settings, common UI
- Routing:
  - React Router v6 with AppRouter
  - AuthLayout (public) and AppLayout (authenticated)
  - Dashboard and Settings pages
  - 404 NotFound page
- UI Components:
  - LoadingScreen with animated logo
  - AppLayout with sidebar navigation, mobile drawer, language toggle
  - Dashboard with stat cards and top movers preview
  - Settings page with language, notifications, and account sections
- PWA configuration (vite-plugin-pwa)
- Documentation: README, ARCHITECTURE, DATABASE, API, ROADMAP, CHANGELOG, PROJECT_STRUCTURE
