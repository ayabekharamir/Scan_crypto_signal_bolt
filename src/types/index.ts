// ── Market domains ──────────────────────────────────────────────

export type MarketType = 'crypto' | 'stock' | 'forex' | 'commodity' | 'etf';

// ── Asset ───────────────────────────────────────────────────────

export interface Asset {
  id: string;
  symbol: string;
  name: string;
  market_type: MarketType;
  coingecko_id: string | null;
  logo_url: string | null;
  description: string | null;
  is_active: boolean;
  rank: number | null;
  created_at: string;
  updated_at: string;
}

// ── Price snapshot ───────────────────────────────────────────────

export interface PriceSnapshot {
  id: string;
  asset_id: string;
  price_usd: number;
  market_cap: number | null;
  volume_24h: number | null;
  change_24h: number | null;
  change_7d: number | null;
  high_24h: number | null;
  low_24h: number | null;
  recorded_at: string;
  created_at: string;
}

// ── Asset with latest price (joined view) ────────────────────────

export interface AssetWithPrice extends Asset {
  latest_price: PriceSnapshot | null;
}

// ── Watchlist ────────────────────────────────────────────────────

export interface Watchlist {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface WatchlistItem {
  id: string;
  watchlist_id: string;
  asset_id: string;
  added_at: string;
  asset?: Asset;
}

// ── User profile ────────────────────────────────────────────────

export type UserRole = 'user' | 'analyst' | 'admin';

export interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  locale: 'fa' | 'en';
  created_at: string;
  updated_at: string;
}

// ── User preferences ─────────────────────────────────────────────

export type ThemeMode = 'dark';

export interface UserPreferences {
  id: string;
  user_id: string;
  locale: 'fa' | 'en';
  theme: ThemeMode;
  default_market: MarketType;
  risk_tolerance: 'conservative' | 'moderate' | 'aggressive';
  notification_enabled: boolean;
  email_alerts: boolean;
  created_at: string;
  updated_at: string;
}

// ── Audit log ────────────────────────────────────────────────────

export type AuditAction =
  | 'login'
  | 'logout'
  | 'signup'
  | 'profile_update'
  | 'preferences_update'
  | 'password_change';

export interface AuditLog {
  id: string;
  user_id: string | null;
  action: AuditAction;
  metadata: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}

// ── Auth session ────────────────────────────────────────────────

export interface AuthSession {
  user: Profile | null;
  session: import('@supabase/supabase-js').Session | null;
  loading: boolean;
}

// ── Scoring engine ──────────────────────────────────────────────

export interface AssetScore {
  id: string;
  asset_id: string;
  trend_score: number;
  momentum_score: number;
  volume_score: number;
  liquidity_score: number;
  attention_score: number;
  confidence_score: number;
  computed_at: string;
  created_at: string;
}

export type ScoreField =
  | 'trend_score'
  | 'momentum_score'
  | 'volume_score'
  | 'liquidity_score'
  | 'attention_score'
  | 'confidence_score';

// ── Risk engine ─────────────────────────────────────────────────

export type RiskLabel = 'Low' | 'Moderate' | 'High' | 'Extreme';

export interface RiskAssessment {
  id: string;
  asset_id: string;
  market_risk: number;
  asset_risk: number;
  liquidity_risk: number;
  timing_risk: number;
  news_risk: number;
  event_risk: number;
  overall_risk: number;
  risk_label: RiskLabel;
  computed_at: string;
  created_at: string;
}

export type RiskField =
  | 'market_risk'
  | 'asset_risk'
  | 'liquidity_risk'
  | 'timing_risk'
  | 'news_risk'
  | 'event_risk'
  | 'overall_risk';

// ── Evidence engine ─────────────────────────────────────────────

export type ImpactType = 'positive' | 'negative' | 'neutral';
export type EvidenceSource = 'market_data' | 'news' | 'on_chain' | 'social';

export interface Evidence {
  id: string;
  asset_id: string;
  source: EvidenceSource;
  title: string;
  description: string | null;
  impact_type: ImpactType;
  impact_score: number;
  confidence: number;
  url: string | null;
  recorded_at: string;
  created_at: string;
}

// ── Scenario engine ─────────────────────────────────────────────

export type ScenarioType =
  | 'continuation'
  | 'correction'
  | 'breakout'
  | 'weakness'
  | 'crash';

export interface Scenario {
  id: string;
  asset_id: string;
  scenario_type: ScenarioType;
  title: string;
  description: string | null;
  probability: number;
  price_target_low: number | null;
  price_target_high: number | null;
  timeframe: string | null;
  key_drivers: string[];
  computed_at: string;
  created_at: string;
}

// ── Recommendation engine ────────────────────────────────────────

export type RecommendationAction =
  | 'strong_buy'
  | 'buy'
  | 'hold'
  | 'reduce'
  | 'sell'
  | 'avoid';

export interface Recommendation {
  id: string;
  asset_id: string;
  action: RecommendationAction;
  confidence: number;
  summary: string;
  reasoning: string | null;
  entry_zone_low: number | null;
  entry_zone_high: number | null;
  stop_loss: number | null;
  take_profit: number | null;
  position_size: string | null;
  risk_reward_ratio: number | null;
  valid_until: string | null;
  computed_at: string;
  created_at: string;
}

// ── Backtest ─────────────────────────────────────────────────────

export type BacktestMetricType =
  | 'score_accuracy'
  | 'scenario_accuracy'
  | 'recommendation_accuracy';

export interface BacktestResult {
  id: string;
  asset_id: string;
  metric_type: BacktestMetricType;
  accuracy: number;
  total_predictions: number;
  correct_predictions: number;
  period_start: string;
  period_end: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

// ── Portfolio ───────────────────────────────────────────────────

export interface PortfolioItem {
  id: string;
  user_id: string;
  asset_id: string;
  quantity: number;
  avg_buy_price: number;
  notes: string | null;
  added_at: string;
  updated_at: string;
  asset?: Asset;
}

export interface PortfolioItemWithPrice extends PortfolioItem {
  asset: Asset;
  current_price: number | null;
  market_value: number | null;
  cost_basis: number;
  pnl: number | null;
  pnl_percent: number | null;
}

// ── Journal ──────────────────────────────────────────────────────

export type JournalEntryType = 'buy' | 'sell' | 'hold' | 'watch' | 'note';

export interface JournalEntry {
  id: string;
  user_id: string;
  asset_id: string;
  entry_type: JournalEntryType;
  title: string;
  content: string | null;
  emotion: string | null;
  tags: string[];
  rating: number | null;
  created_at: string;
  updated_at: string;
  asset?: Asset;
}

// ── Alerts ───────────────────────────────────────────────────────

export type AlertType =
  | 'price_above'
  | 'price_below'
  | 'score_above'
  | 'score_below'
  | 'risk_above';

export interface Alert {
  id: string;
  user_id: string;
  asset_id: string;
  alert_type: AlertType;
  threshold: number;
  message: string | null;
  is_active: boolean;
  triggered_at: string | null;
  created_at: string;
  asset?: Asset;
}

// ── API Cache ───────────────────────────────────────────────────

export interface ApiCacheEntry {
  id: string;
  cache_key: string;
  response_data: Record<string, unknown>;
  fetched_at: string;
  expires_at: string;
}

// ── Live data refresh result ──────────────────────────────────────

export interface PriceRefreshResult {
  success: boolean;
  assets_updated: number;
  symbols: string[];
  cached_at: string;
  error?: string;
}

export interface AlertCheckResult {
  success: boolean;
  alerts_checked: number;
  alerts_triggered: number;
  triggered_ids: string[];
  checked_at: string;
  error?: string;
}

export interface ScheduledRefreshResult {
  success: boolean;
  assets_updated: number;
  symbols: string[];
  alerts_checked: number;
  alerts_triggered: number;
  triggered_ids: string[];
  checked_at: string;
  error?: string;
}
