import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  ArrowUpRight,
  ArrowDownRight,
  Star,
  DollarSign,
  BarChart3,
  TrendingUp,
  Activity,
  BrainCircuit,
  Clock,
  Gauge,
  FileText,
  Sparkles,
  Target,
  History,
} from 'lucide-react';
import { fetchAssetBySymbol, fetchPriceHistory, fetchLatestPrice } from '@/services/asset.service';
import { formatPrice, formatNumber, formatPercent, formatTimeAgo, cn } from '@/lib/utils';
import { LoadingScreen } from '@/components/common/LoadingScreen';
import { ScorePanel } from '@/components/analysis/ScorePanel';
import { RiskPanel } from '@/components/analysis/RiskPanel';
import { EvidencePanel } from '@/components/analysis/EvidencePanel';
import { ScenarioPanel } from '@/components/analysis/ScenarioPanel';
import { RecommendationPanel } from '@/components/analysis/RecommendationPanel';
import { BacktestPanel } from '@/components/analysis/BacktestPanel';

export function AssetDetailPage() {
  const { symbol } = useParams<{ symbol: string }>();
  const { t } = useTranslation();

  const { data: asset, isLoading: assetLoading } = useQuery({
    queryKey: ['asset', symbol],
    queryFn: () => fetchAssetBySymbol(symbol!),
    enabled: !!symbol,
  });

  const { data: history } = useQuery({
    queryKey: ['price-history', asset?.id],
    queryFn: () => fetchPriceHistory(asset!.id, 30),
    enabled: !!asset?.id,
    staleTime: 60_000,
  });

  const { data: latestPrice } = useQuery({
    queryKey: ['latest-price', asset?.id],
    queryFn: () => fetchLatestPrice(asset!.id),
    enabled: !!asset?.id,
    staleTime: 60_000,
  });

  if (assetLoading) return <LoadingScreen />;

  if (!asset) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <p className="text-secondary-400">{t('asset.notFound')}</p>
        <Link to="/scanner" className="btn-primary">
          {t('scanner.title')}
        </Link>
      </div>
    );
  }

  const price = latestPrice ?? null;
  const change = price?.change_24h ?? 0;
  const change7d = price?.change_7d ?? 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Breadcrumb */}
      <Link
        to="/scanner"
        className="inline-flex items-center gap-2 text-sm text-secondary-400 hover:text-secondary-200"
      >
        <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
        {t('scanner.title')}
      </Link>

      {/* Asset header */}
      <div className="card p-6">
        <div className="flex items-start gap-4">
          {asset.logo_url ? (
            <img
              src={asset.logo_url}
              alt={asset.symbol}
              className="w-16 h-16 rounded-full"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-surface-3 border border-surface-4 flex items-center justify-center text-primary-300 font-bold text-2xl">
              {asset.symbol[0]}
            </div>
          )}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-secondary-100">{asset.name}</h1>
              <span className="badge bg-surface-3 text-secondary-300">{asset.symbol}</span>
              <span className="badge bg-primary-500/10 text-primary-300 uppercase">
                {asset.market_type}
              </span>
            </div>
            {asset.description && (
              <p className="text-sm text-secondary-400 mt-2 max-w-2xl">{asset.description}</p>
            )}
          </div>
          <button className="btn-secondary" aria-label="Add to watchlist">
            <Star className="w-4 h-4" />
            {t('asset.addToWatchlist')}
          </button>
        </div>
      </div>

      {/* Price overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card p-5 lg:col-span-1">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-primary-400" />
            <span className="text-xs text-secondary-400">{t('asset.currentPrice')}</span>
          </div>
          <p className="text-3xl font-bold text-secondary-100" dir="ltr">
            {formatPrice(price?.price_usd)}
          </p>
          <div className="flex items-center gap-3 mt-2">
            <span
              className={cn(
                'inline-flex items-center gap-0.5 text-sm font-medium',
                change >= 0 ? 'text-success-400' : 'text-error-400'
              )}
            >
              {change >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
              {formatPercent(change)}
            </span>
            <span className="text-xs text-secondary-500">24h</span>
          </div>
        </div>

        <MetricCard icon={BarChart3} label={t('asset.marketCap')} value={`$${formatNumber(price?.market_cap)}`} />
        <MetricCard icon={Activity} label={t('asset.volume24h')} value={`$${formatNumber(price?.volume_24h)}`} />
      </div>

      {/* Price range */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard icon={TrendingUp} label={t('asset.high24h')} value={formatPrice(price?.high_24h)} />
        <MetricCard icon={ArrowDownRight} label={t('asset.low24h')} value={formatPrice(price?.low_24h)} />
        <MetricCard
          icon={Clock}
          label={t('asset.change7d')}
          value={formatPercent(change7d)}
          valueClass={change7d >= 0 ? 'text-success-400' : 'text-error-400'}
        />
      </div>

      {/* Price history sparkline */}
      {history && history.length > 1 && (
        <div className="card p-5">
          <h2 className="text-base font-semibold text-secondary-100 mb-4">
            {t('asset.priceHistory')}
          </h2>
          <Sparkline data={history.map((h) => h.price_usd)} />
          <div className="flex justify-between mt-2 text-xs text-secondary-500">
            <span>{formatTimeAgo(history[0].recorded_at)}</span>
            <span>{formatTimeAgo(history[history.length - 1].recorded_at)}</span>
          </div>
        </div>
      )}

      {/* Scoring Engine */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center">
            <BrainCircuit className="w-5 h-5 text-primary-400" strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="text-base font-semibold text-secondary-100">{t('scoring.title')}</h2>
            <p className="text-xs text-secondary-500">{t('scoring.subtitle')}</p>
          </div>
        </div>
        <ScorePanel assetId={asset.id} />
      </div>

      {/* Risk Engine */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-warning-500/10 flex items-center justify-center">
            <Gauge className="w-5 h-5 text-warning-400" strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="text-base font-semibold text-secondary-100">{t('risk.title')}</h2>
            <p className="text-xs text-secondary-500">{t('risk.subtitle')}</p>
          </div>
        </div>
        <RiskPanel assetId={asset.id} />
      </div>

      {/* Evidence Engine */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-accent-500/10 flex items-center justify-center">
            <FileText className="w-5 h-5 text-accent-400" strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="text-base font-semibold text-secondary-100">{t('evidence.title')}</h2>
            <p className="text-xs text-secondary-500">{t('evidence.subtitle')}</p>
          </div>
        </div>
        <EvidencePanel assetId={asset.id} />
      </div>

      {/* AI Recommendation */}
      <div className="card p-6 bg-gradient-to-br from-surface-2 to-surface-1 border-primary-500/20">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center">
            <Target className="w-5 h-5 text-primary-400" strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="text-base font-semibold text-secondary-100">{t('recommendation.title')}</h2>
            <p className="text-xs text-secondary-500">{t('recommendation.subtitle')}</p>
          </div>
        </div>
        <RecommendationPanel assetId={asset.id} />
      </div>

      {/* Scenario Engine */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-accent-500/10 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-accent-400" strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="text-base font-semibold text-secondary-100">{t('scenario.title')}</h2>
            <p className="text-xs text-secondary-500">{t('scenario.subtitle')}</p>
          </div>
        </div>
        <ScenarioPanel assetId={asset.id} />
      </div>

      {/* Backtest Results */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-secondary-500/10 flex items-center justify-center">
            <History className="w-5 h-5 text-secondary-400" strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="text-base font-semibold text-secondary-100">{t('backtest.title')}</h2>
            <p className="text-xs text-secondary-500">{t('backtest.subtitle')}</p>
          </div>
        </div>
        <BacktestPanel assetId={asset.id} />
      </div>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  valueClass,
}: {
  icon: typeof DollarSign;
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 text-secondary-500" />
        <span className="text-xs text-secondary-400">{label}</span>
      </div>
      <p className={cn('text-lg font-semibold text-secondary-100', valueClass)} dir="ltr">
        {value}
      </p>
    </div>
  );
}

function Sparkline({ data }: { data: number[] }) {
  const width = 800;
  const height = 120;
  const padding = 8;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((value, i) => {
    const x = padding + (i / (data.length - 1)) * (width - padding * 2);
    const y = height - padding - ((value - min) / range) * (height - padding * 2);
    return `${x},${y}`;
  });

  const isPositive = data[data.length - 1] >= data[0];
  const strokeColor = isPositive ? '#34d399' : '#f87171';

  const areaPath = `M ${points[0]} L ${points.join(' L ')} L ${width - padding},${height - padding} L ${padding},${height - padding} Z`;
  const linePath = `M ${points.join(' L ')}`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-24" preserveAspectRatio="none">
      <defs>
        <linearGradient id="sparkGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={strokeColor} stopOpacity="0.2" />
          <stop offset="100%" stopColor={strokeColor} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#sparkGradient)" />
      <path d={linePath} fill="none" stroke={strokeColor} strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}
