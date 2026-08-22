import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Star, ArrowUpRight, ArrowDownRight, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import {
  fetchUserWatchlists,
  fetchWatchlistItems,
  removeFromWatchlist,
} from '@/services/watchlist.service';
import { fetchLatestPrice } from '@/services/asset.service';
import type { Asset, PriceSnapshot } from '@/types';
import { formatPrice, formatPercent, cn } from '@/lib/utils';
import { LoadingScreen } from '@/components/common/LoadingScreen';

export function WatchlistPage() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const { data: watchlists, isLoading: wlLoading } = useQuery({
    queryKey: ['watchlists', profile?.id],
    queryFn: () => fetchUserWatchlists(profile!.id),
    enabled: !!profile?.id,
  });

  const activeWatchlist = watchlists?.[0];

  const { data: items, isLoading: itemsLoading } = useQuery({
    queryKey: ['watchlist-items', activeWatchlist?.id],
    queryFn: () => fetchWatchlistItems(activeWatchlist!.id),
    enabled: !!activeWatchlist?.id,
  });

  const removeMutation = useMutation({
    mutationFn: ({ watchlistId, assetId }: { watchlistId: string; assetId: string }) =>
      removeFromWatchlist(watchlistId, assetId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlist-items', activeWatchlist?.id] });
    },
  });

  if (wlLoading || itemsLoading) return <LoadingScreen />;

  if (!activeWatchlist || (items && items.length === 0)) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-secondary-100">{t('watchlist.title')}</h1>
          <p className="text-sm text-secondary-400 mt-1">{t('watchlist.subtitle')}</p>
        </div>
        <div className="card p-12 flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 rounded-full bg-surface-3 flex items-center justify-center">
            <Star className="w-8 h-8 text-secondary-500" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-secondary-200 font-medium">{t('watchlist.empty')}</p>
            <p className="text-sm text-secondary-400 mt-1">{t('watchlist.emptyDesc')}</p>
          </div>
          <Link to="/scanner" className="btn-primary">
            <Plus className="w-4 h-4" />
            {t('watchlist.browseAssets')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-secondary-100">{t('watchlist.title')}</h1>
        <p className="text-sm text-secondary-400 mt-1">{activeWatchlist.name}</p>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-3">
                <th className="px-4 py-3 text-xs font-medium text-secondary-400 text-start">
                  {t('scanner.asset')}
                </th>
                <th className="px-4 py-3 text-xs font-medium text-secondary-400 text-end">
                  {t('scanner.price')}
                </th>
                <th className="px-4 py-3 text-xs font-medium text-secondary-400 text-end">24h %</th>
                <th className="px-4 py-3 text-xs font-medium text-secondary-400 text-end">
                  {t('common.delete')}
                </th>
              </tr>
            </thead>
            <tbody>
              {items?.map((item) => (
                <WatchlistRow
                  key={item.id}
                  asset={item.asset}
                  watchlistId={activeWatchlist.id}
                  onRemove={() =>
                    removeMutation.mutate({
                      watchlistId: activeWatchlist.id,
                      assetId: item.asset.id,
                    })
                  }
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function WatchlistRow({
  asset,
  watchlistId: _watchlistId,
  onRemove,
}: {
  asset: Asset;
  watchlistId: string;
  onRemove: () => void;
}) {
  const { data: price } = useQuery({
    queryKey: ['latest-price', asset.id],
    queryFn: () => fetchLatestPrice(asset.id),
    staleTime: 60_000,
  });

  const change = price?.change_24h ?? 0;

  return (
    <tr className="border-b border-surface-3/50 hover:bg-surface-1 transition-colors">
      <td className="px-4 py-3">
        <Link to={`/assets/${asset.symbol}`} className="flex items-center gap-3 group">
          {asset.logo_url ? (
            <img src={asset.logo_url} alt={asset.symbol} className="w-8 h-8 rounded-full" loading="lazy" />
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
        {formatPrice(price?.price_usd)}
      </td>
      <td className="px-4 py-3 text-end">
        <span
          className={cn(
            'inline-flex items-center gap-0.5 text-sm font-medium',
            change >= 0 ? 'text-success-400' : 'text-error-400'
          )}
        >
          {change >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
          {formatPercent(change)}
        </span>
      </td>
      <td className="px-4 py-3 text-end">
        <button
          onClick={onRemove}
          className="text-secondary-500 hover:text-error-400 transition-colors p-1.5 rounded-lg hover:bg-error-500/10"
          aria-label="Remove from watchlist"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </td>
    </tr>
  );
}
