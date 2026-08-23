import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Search, ArrowUpRight, ArrowDownRight, Filter, RefreshCw } from 'lucide-react';
import { fetchAssetsWithPrices } from '@/services/asset.service';
import { refreshPrices } from '@/services/market-data.service';
import type { MarketType } from '@/types';
import { formatPrice, formatNumber, formatPercent, cn } from '@/lib/utils';
import { LoadingScreen } from '@/components/common/LoadingScreen';

type SortField = 'rank' | 'price' | 'change_24h' | 'market_cap' | 'volume_24h';
type SortDir = 'asc' | 'desc';

export function ScannerPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [market, setMarket] = useState<MarketType>('crypto');
  const [sortField, setSortField] = useState<SortField>('rank');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const { data: assets, isLoading } = useQuery({
    queryKey: ['assets-with-prices', market],
    queryFn: () => fetchAssetsWithPrices(market),
    staleTime: 60_000,
  });

  const refreshMutation = useMutation({
    mutationFn: refreshPrices,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets-with-prices'] });
      queryClient.invalidateQueries({ queryKey: ['latest-price'] });
    },
  });

  const filtered = useMemo(() => {
    let list = (assets ?? []).filter(
      (a) =>
        a.symbol.toLowerCase().includes(search.toLowerCase()) ||
        a.name.toLowerCase().includes(search.toLowerCase())
    );

    list = list.sort((a, b) => {
      let valA: number | null = 0;
      let valB: number | null = 0;

      switch (sortField) {
        case 'rank':
          valA = a.rank ?? 999;
          valB = b.rank ?? 999;
          break;
        case 'price':
          valA = a.latest_price?.price_usd ?? 0;
          valB = b.latest_price?.price_usd ?? 0;
          break;
        case 'change_24h':
          valA = a.latest_price?.change_24h ?? 0;
          valB = b.latest_price?.change_24h ?? 0;
          break;
        case 'market_cap':
          valA = a.latest_price?.market_cap ?? 0;
          valB = b.latest_price?.market_cap ?? 0;
          break;
        case 'volume_24h':
          valA = a.latest_price?.volume_24h ?? 0;
          valB = b.latest_price?.volume_24h ?? 0;
          break;
      }

      return sortDir === 'asc' ? (valA ?? 0) - (valB ?? 0) : (valB ?? 0) - (valA ?? 0);
    });

    return list;
  }, [assets, search, sortField, sortDir]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir(field === 'rank' ? 'asc' : 'desc');
    }
  };

  if (isLoading) return <LoadingScreen />;

  const marketOptions: { value: MarketType; label: string }[] = [
    { value: 'crypto', label: t('scanner.crypto') },
    { value: 'stock', label: t('scanner.stocks') },
    { value: 'forex', label: t('scanner.forex') },
    { value: 'commodity', label: t('scanner.commodities') },
    { value: 'etf', label: t('scanner.etfs') },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-secondary-100">{t('scanner.title')}</h1>
            <p className="text-sm text-secondary-400 mt-1">{t('scanner.subtitle')}</p>
          </div>
          <button
            onClick={() => refreshMutation.mutate()}
            disabled={refreshMutation.isPending}
            className="btn-ghost"
          >
            <RefreshCw className={cn('w-4 h-4', refreshMutation.isPending && 'animate-spin')} />
            <span className="text-sm hidden sm:inline">{t('scanner.refresh')}</span>
          </button>
        </div>
      </div>

      {refreshMutation.isError && (
        <div className="card p-3 border-error-500/30">
          <p className="text-sm text-error-400">{t('scanner.refreshError')}</p>
        </div>
      )}

      {refreshMutation.isSuccess && refreshMutation.data && (
        <div className="card p-3 border-success-500/30">
          <p className="text-sm text-success-400">
            {t('scanner.refreshSuccess', { count: refreshMutation.data.assets_updated })}
          </p>
        </div>
      )}

      {/* Filters bar */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 -translate-y-1/2 start-3 w-5 h-5 text-secondary-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('common.search')}
            className="input-field ps-11"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-secondary-500" />
          <select
            value={market}
            onChange={(e) => setMarket(e.target.value as MarketType)}
            className="input-field w-auto cursor-pointer"
          >
            {marketOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-3 text-start">
                <th
                  className="px-4 py-3 text-xs font-medium text-secondary-400 cursor-pointer hover:text-secondary-200"
                  onClick={() => handleSort('rank')}
                >
                  #
                </th>
                <th className="px-4 py-3 text-xs font-medium text-secondary-400 text-start">
                  {t('scanner.asset')}
                </th>
                <th
                  className="px-4 py-3 text-xs font-medium text-secondary-400 cursor-pointer hover:text-secondary-200 text-end"
                  onClick={() => handleSort('price')}
                >
                  {t('scanner.price')}
                </th>
                <th
                  className="px-4 py-3 text-xs font-medium text-secondary-400 cursor-pointer hover:text-secondary-200 text-end"
                  onClick={() => handleSort('change_24h')}
                >
                  24h %
                </th>
                <th
                  className="px-4 py-3 text-xs font-medium text-secondary-400 cursor-pointer hover:text-secondary-200 text-end hidden sm:table-cell"
                  onClick={() => handleSort('market_cap')}
                >
                  {t('scanner.marketCap')}
                </th>
                <th
                  className="px-4 py-3 text-xs font-medium text-secondary-400 cursor-pointer hover:text-secondary-200 text-end hidden md:table-cell"
                  onClick={() => handleSort('volume_24h')}
                >
                  {t('scanner.volume')}
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((asset) => {
                const change = asset.latest_price?.change_24h ?? 0;
                return (
                  <tr
                    key={asset.id}
                    className="border-b border-surface-3/50 hover:bg-surface-1 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm text-secondary-500">{asset.rank ?? '—'}</td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/assets/${asset.symbol}`}
                        className="flex items-center gap-3 group"
                      >
                        {asset.logo_url ? (
                          <img
                            src={asset.logo_url}
                            alt={asset.symbol}
                            className="w-8 h-8 rounded-full"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-surface-3 border border-surface-4 flex items-center justify-center text-primary-300 font-bold text-xs">
                            {asset.symbol[0]}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-secondary-100 group-hover:text-primary-300 transition-colors">
                            {asset.symbol}
                          </p>
                          <p className="text-xs text-secondary-500">{asset.name}</p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-secondary-100 text-end" dir="ltr">
                      {formatPrice(asset.latest_price?.price_usd)}
                    </td>
                    <td className="px-4 py-3 text-end">
                      <span
                        className={cn(
                          'inline-flex items-center gap-0.5 text-sm font-medium',
                          change >= 0 ? 'text-success-400' : 'text-error-400'
                        )}
                      >
                        {change >= 0 ? (
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        ) : (
                          <ArrowDownRight className="w-3.5 h-3.5" />
                        )}
                        {formatPercent(change)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-secondary-300 text-end hidden sm:table-cell" dir="ltr">
                      ${formatNumber(asset.latest_price?.market_cap)}
                    </td>
                    <td className="px-4 py-3 text-sm text-secondary-300 text-end hidden md:table-cell" dir="ltr">
                      ${formatNumber(asset.latest_price?.volume_24h)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="p-8 text-center text-secondary-400 text-sm">
            {t('common.noData')}
          </div>
        )}
      </div>
    </div>
  );
}
