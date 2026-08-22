import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { fetchAssetsWithPrices } from '@/services/asset.service';
import { refreshPrices } from '@/services/market-data.service';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Eye,
  BrainCircuit,
  ArrowUpRight,
  ArrowDownRight,
  Coins,
  DollarSign,
  BarChart3,
  Globe,
  RefreshCw,
} from 'lucide-react';
import { formatPrice, formatNumber, formatPercent, cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { LoadingScreen } from '@/components/common/LoadingScreen';

export function DashboardPage() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const { data: assets, isLoading } = useQuery({
    queryKey: ['assets-with-prices', 'crypto'],
    queryFn: () => fetchAssetsWithPrices('crypto'),
    staleTime: 60_000,
  });

  const refreshMutation = useMutation({
    mutationFn: refreshPrices,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets-with-prices'] });
      queryClient.invalidateQueries({ queryKey: ['latest-price'] });
    },
  });

  if (isLoading) return <LoadingScreen />;

  const movers = (assets ?? [])
    .filter((a) => a.latest_price?.change_24h !== null)
    .sort(
      (a, b) =>
        Math.abs(b.latest_price?.change_24h ?? 0) -
        Math.abs(a.latest_price?.change_24h ?? 0)
    )
    .slice(0, 6);

  const gainers = (assets ?? []).filter((a) => (a.latest_price?.change_24h ?? 0) > 0).length;
  const losers = (assets ?? []).filter((a) => (a.latest_price?.change_24h ?? 0) < 0).length;
  const totalMarketCap = (assets ?? []).reduce(
    (sum, a) => sum + (a.latest_price?.market_cap ?? 0),
    0
  );
  const totalVolume = (assets ?? []).reduce(
    (sum, a) => sum + (a.latest_price?.volume_24h ?? 0),
    0
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-100">{t('dashboard.title')}</h1>
          <p className="text-sm text-secondary-400 mt-1">
            {profile?.display_name ?? profile?.email} — {t('dashboard.overview')}
          </p>
        </div>
        <button
          onClick={() => refreshMutation.mutate()}
          disabled={refreshMutation.isPending}
          className="btn-ghost"
        >
          <RefreshCw className={cn('w-4 h-4', refreshMutation.isPending && 'animate-spin')} />
          <span className="text-sm hidden sm:inline">{t('dashboard.refresh')}</span>
        </button>
      </div>

      {refreshMutation.isError && (
        <div className="card p-3 border-error-500/30">
          <p className="text-sm text-error-400">{t('dashboard.refreshError')}</p>
        </div>
      )}

      {refreshMutation.isSuccess && refreshMutation.data && (
        <div className="card p-3 border-success-500/30">
          <p className="text-sm text-success-400">
            {t('dashboard.refreshSuccess', { count: refreshMutation.data.assets_updated })}
          </p>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={DollarSign}
          label={t('dashboard.totalMarketCap')}
          value={`$${formatNumber(totalMarketCap)}`}
          color="primary"
        />
        <StatCard
          icon={BarChart3}
          label={t('dashboard.totalVolume')}
          value={`$${formatNumber(totalVolume)}`}
          color="accent"
        />
        <StatCard
          icon={TrendingUp}
          label={t('dashboard.gainers')}
          value={String(gainers)}
          trend="up"
          color="success"
        />
        <StatCard
          icon={TrendingDown}
          label={t('dashboard.losers')}
          value={String(losers)}
          trend="down"
          color="error"
        />
      </div>

      {/* Market sentiment banner */}
      <div className="card p-5 bg-gradient-to-r from-surface-2 to-surface-1">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary-500/10 flex items-center justify-center">
            <Globe className="w-6 h-6 text-primary-400" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-sm text-secondary-400">{t('dashboard.marketSentiment')}</p>
            <p className="text-lg font-bold text-secondary-100">
              {gainers > losers ? t('dashboard.bullish') : t('dashboard.bearish')}
            </p>
          </div>
          <div className="ms-auto flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-success-500/10">
              <TrendingUp className="w-4 h-4 text-success-400" />
              <span className="text-sm text-success-400">{gainers}</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-error-500/10">
              <TrendingDown className="w-4 h-4 text-error-400" />
              <span className="text-sm text-error-400">{losers}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Top movers */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-secondary-100">{t('dashboard.topMovers')}</h2>
          <Link to="/scanner" className="text-sm text-primary-400 hover:text-primary-300">
            {t('dashboard.viewAll')}
          </Link>
        </div>
        <div className="space-y-2">
          {movers.map((mover) => (
            <Link
              key={mover.id}
              to={`/assets/${mover.symbol}`}
              className="flex items-center justify-between p-3 rounded-xl bg-surface-1 hover:bg-surface-3 transition-colors group"
            >
              <div className="flex items-center gap-3">
                {mover.logo_url ? (
                  <img
                    src={mover.logo_url}
                    alt={mover.symbol}
                    className="w-10 h-10 rounded-full"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-surface-3 border border-surface-4 flex items-center justify-center text-primary-300 font-bold text-sm">
                    {mover.symbol[0]}
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-secondary-100 group-hover:text-primary-300 transition-colors">
                    {mover.symbol}
                  </p>
                  <p className="text-xs text-secondary-500">{mover.name}</p>
                </div>
              </div>
              <div className="text-end">
                <p className="text-sm font-medium text-secondary-100" dir="ltr">
                  {formatPrice(mover.latest_price?.price_usd)}
                </p>
                <p
                  className={cn(
                    'text-xs flex items-center gap-0.5 justify-end',
                    (mover.latest_price?.change_24h ?? 0) >= 0
                      ? 'text-success-400'
                      : 'text-error-400'
                  )}
                >
                  {(mover.latest_price?.change_24h ?? 0) >= 0 ? (
                    <ArrowUpRight className="w-3 h-3" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3" />
                  )}
                  {formatPercent(mover.latest_price?.change_24h)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <QuickLink
          to="/scanner"
          icon={Coins}
          label={t('nav.scanner')}
          desc={t('dashboard.scannerDesc')}
        />
        <QuickLink
          to="/watchlist"
          icon={Eye}
          label={t('nav.watchlist')}
          desc={t('dashboard.watchlistDesc')}
        />
        <QuickLink
          to="/analysis"
          icon={BrainCircuit}
          label={t('nav.analysis')}
          desc={t('dashboard.analysisDesc')}
        />
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  trend,
  color,
}: {
  icon: typeof TrendingUp;
  label: string;
  value: string;
  trend?: 'up' | 'down';
  color: 'primary' | 'secondary' | 'accent' | 'success' | 'error';
}) {
  const colorMap = {
    primary: 'text-primary-400 bg-primary-500/10',
    secondary: 'text-secondary-400 bg-secondary-500/10',
    accent: 'text-accent-400 bg-accent-500/10',
    success: 'text-success-400 bg-success-500/10',
    error: 'text-error-400 bg-error-500/10',
  };

  return (
    <div className="card card-hover p-5">
      <div className="flex items-center justify-between mb-3">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', colorMap[color])}>
          <Icon className="w-5 h-5" strokeWidth={1.5} />
        </div>
        {trend === 'up' && <TrendingUp className="w-4 h-4 text-success-400" />}
        {trend === 'down' && <TrendingDown className="w-4 h-4 text-error-400" />}
      </div>
      <p className="text-2xl font-bold text-secondary-100" dir="ltr">{value}</p>
      <p className="text-xs text-secondary-500 mt-1">{label}</p>
    </div>
  );
}

function QuickLink({
  to,
  icon: Icon,
  label,
  desc,
}: {
  to: string;
  icon: typeof Activity;
  label: string;
  desc: string;
}) {
  return (
    <Link to={to} className="card card-hover p-5 group">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-400 group-hover:bg-primary-500/20 transition-colors">
          <Icon className="w-5 h-5" strokeWidth={1.5} />
        </div>
        <h3 className="text-base font-semibold text-secondary-100 group-hover:text-primary-300 transition-colors">
          {label}
        </h3>
      </div>
      <p className="text-sm text-secondary-400">{desc}</p>
    </Link>
  );
}
