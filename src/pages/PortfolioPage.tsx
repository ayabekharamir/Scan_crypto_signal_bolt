import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  Wallet,
  DollarSign,
  Percent,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import {
  fetchPortfolio,
  addToPortfolio,
  removeFromPortfolio,
  computePortfolioSummary,
} from '@/services/portfolio.service';
import { fetchAssets } from '@/services/asset.service';
import { formatPrice, formatPercent, cn } from '@/lib/utils';
import { LoadingScreen } from '@/components/common/LoadingScreen';
import type { Asset } from '@/types';

export function PortfolioPage() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);

  const { data: items, isLoading } = useQuery({
    queryKey: ['portfolio', profile?.id],
    queryFn: () => fetchPortfolio(profile!.id),
    enabled: !!profile?.id,
  });

  const { data: assets } = useQuery({
    queryKey: ['assets'],
    queryFn: () => fetchAssets(),
    staleTime: 300_000,
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => removeFromPortfolio(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['portfolio', profile?.id] }),
  });

  if (isLoading) return <LoadingScreen />;

  const summary = items ? computePortfolioSummary(items) : null;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-100">{t('portfolio.title')}</h1>
          <p className="text-sm text-secondary-400 mt-1">{t('portfolio.subtitle')}</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary">
          <Plus className="w-4 h-4" />
          {t('portfolio.add')}
        </button>
      </div>

      {/* Summary cards */}
      {summary && items && items.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard
            icon={Wallet}
            label={t('portfolio.totalValue')}
            value={formatPrice(summary.totalValue)}
          />
          <SummaryCard
            icon={DollarSign}
            label={t('portfolio.totalCost')}
            value={formatPrice(summary.totalCost)}
          />
          <SummaryCard
            icon={summary.totalPnl >= 0 ? TrendingUp : TrendingDown}
            label={t('portfolio.totalPnl')}
            value={formatPrice(summary.totalPnl)}
            valueClass={summary.totalPnl >= 0 ? 'text-success-400' : 'text-error-400'}
          />
          <SummaryCard
            icon={Percent}
            label={t('portfolio.totalReturn')}
            value={formatPercent(summary.totalPnlPercent)}
            valueClass={summary.totalPnlPercent >= 0 ? 'text-success-400' : 'text-error-400'}
          />
        </div>
      )}

      {/* Holdings table */}
      {!items || items.length === 0 ? (
        <div className="card p-12 flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 rounded-full bg-surface-3 flex items-center justify-center">
            <Briefcase className="w-8 h-8 text-secondary-500" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-secondary-200 font-medium">{t('portfolio.empty')}</p>
            <p className="text-sm text-secondary-400 mt-1">{t('portfolio.emptyDesc')}</p>
          </div>
          <button onClick={() => setShowAdd(true)} className="btn-primary">
            <Plus className="w-4 h-4" />
            {t('portfolio.add')}
          </button>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-3">
                  <th className="px-4 py-3 text-xs font-medium text-secondary-400 text-start">
                    {t('scanner.asset')}
                  </th>
                  <th className="px-4 py-3 text-xs font-medium text-secondary-400 text-end">
                    {t('portfolio.quantity')}
                  </th>
                  <th className="px-4 py-3 text-xs font-medium text-secondary-400 text-end">
                    {t('portfolio.avgPrice')}
                  </th>
                  <th className="px-4 py-3 text-xs font-medium text-secondary-400 text-end">
                    {t('portfolio.currentPrice')}
                  </th>
                  <th className="px-4 py-3 text-xs font-medium text-secondary-400 text-end">
                    {t('portfolio.value')}
                  </th>
                  <th className="px-4 py-3 text-xs font-medium text-secondary-400 text-end">
                    {t('portfolio.pnl')}
                  </th>
                  <th className="px-4 py-3 text-xs font-medium text-secondary-400 text-end">
                    {t('common.delete')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-surface-3/50 hover:bg-surface-1 transition-colors">
                    <td className="px-4 py-3">
                      <Link to={`/assets/${item.asset.symbol}`} className="flex items-center gap-3 group">
                        {item.asset.logo_url ? (
                          <img src={item.asset.logo_url} alt={item.asset.symbol} className="w-8 h-8 rounded-full" loading="lazy" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-surface-3 border border-surface-4 flex items-center justify-center text-primary-300 font-bold text-xs">
                            {item.asset.symbol[0]}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-secondary-100 group-hover:text-primary-300 transition-colors">
                            {item.asset.symbol}
                          </p>
                          <p className="text-xs text-secondary-500">{item.asset.name}</p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-secondary-200 text-end" dir="ltr">
                      {Number(item.quantity).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-secondary-200 text-end" dir="ltr">
                      {formatPrice(item.avg_buy_price)}
                    </td>
                    <td className="px-4 py-3 text-sm text-secondary-200 text-end" dir="ltr">
                      {formatPrice(item.current_price)}
                    </td>
                    <td className="px-4 py-3 text-sm text-secondary-100 text-end" dir="ltr">
                      {formatPrice(item.market_value)}
                    </td>
                    <td className="px-4 py-3 text-end">
                      <span className={cn(
                        'inline-flex items-center gap-0.5 text-sm font-medium',
                        (item.pnl ?? 0) >= 0 ? 'text-success-400' : 'text-error-400'
                      )} dir="ltr">
                        {(item.pnl ?? 0) >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                        {formatPrice(item.pnl)}
                        <span className="text-xs">({formatPercent(item.pnl_percent ?? 0)})</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-end">
                      <button
                        onClick={() => removeMutation.mutate(item.id)}
                        className="text-secondary-500 hover:text-error-400 transition-colors p-1.5 rounded-lg hover:bg-error-500/10"
                        aria-label={t('common.delete')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add modal */}
      {showAdd && assets && (
        <AddPortfolioModal
          assets={assets}
          onClose={() => setShowAdd(false)}
          onAdd={async (assetId, qty, price, notes) => {
            await addToPortfolio(profile!.id, assetId, qty, price, notes);
            queryClient.invalidateQueries({ queryKey: ['portfolio', profile?.id] });
            setShowAdd(false);
          }}
        />
      )}
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  valueClass,
}: {
  icon: typeof Wallet;
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 text-secondary-500" />
        <span className="text-xs text-secondary-500">{label}</span>
      </div>
      <p className={cn('text-lg font-bold text-secondary-100', valueClass)} dir="ltr">
        {value}
      </p>
    </div>
  );
}

function AddPortfolioModal({
  assets,
  onClose,
  onAdd,
}: {
  assets: Asset[];
  onClose: () => void;
  onAdd: (assetId: string, qty: number, price: number, notes?: string) => Promise<void>;
}) {
  const { t } = useTranslation();
  const [assetId, setAssetId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(quantity);
    const buyPrice = parseFloat(price);
    if (!assetId) { setError(t('portfolio.errors.selectAsset')); return; }
    if (!qty || qty <= 0) { setError(t('portfolio.errors.invalidQty')); return; }
    if (!buyPrice || buyPrice <= 0) { setError(t('portfolio.errors.invalidPrice')); return; }
    await onAdd(assetId, qty, buyPrice, notes.trim() || undefined);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative card p-6 w-full max-w-md animate-fade-in">
        <h2 className="text-lg font-semibold text-secondary-100 mb-4">{t('portfolio.addTitle')}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-secondary-400 mb-1">{t('scanner.asset')}</label>
            <select
              value={assetId}
              onChange={(e) => setAssetId(e.target.value)}
              className="input-field"
            >
              <option value="">{t('portfolio.selectAsset')}</option>
              {assets.map((a) => (
                <option key={a.id} value={a.id}>{a.symbol} — {a.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-secondary-400 mb-1">{t('portfolio.quantity')}</label>
              <input
                type="number"
                step="any"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="input-field"
                placeholder="0.5"
              />
            </div>
            <div>
              <label className="block text-xs text-secondary-400 mb-1">{t('portfolio.avgPrice')}</label>
              <input
                type="number"
                step="any"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="input-field"
                placeholder="50000"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-secondary-400 mb-1">{t('portfolio.notes')}</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input-field resize-none"
              rows={2}
              placeholder={t('portfolio.notesPlaceholder')}
            />
          </div>
          {error && <p className="text-sm text-error-400">{error}</p>}
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={onClose} className="btn-ghost">
              {t('common.cancel')}
            </button>
            <button type="submit" className="btn-primary">
              {t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
