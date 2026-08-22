import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  Bell,
  Plus,
  Trash2,
  BellRing,
  BellOff,
  X,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import {
  fetchAlerts,
  createAlert,
  toggleAlert,
  deleteAlert,
  alertTypeConfig,
} from '@/services/alert.service';
import { fetchAssets } from '@/services/asset.service';
import { formatPrice, formatTimeAgo, cn } from '@/lib/utils';
import { LoadingScreen } from '@/components/common/LoadingScreen';
import type { Asset, AlertType } from '@/types';

export function AlertsPage() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);

  const { data: alerts, isLoading } = useQuery({
    queryKey: ['alerts', profile?.id],
    queryFn: () => fetchAlerts(profile!.id),
    enabled: !!profile?.id,
  });

  const { data: assets } = useQuery({
    queryKey: ['assets'],
    queryFn: () => fetchAssets(),
    staleTime: 300_000,
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      toggleAlert(id, isActive),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['alerts', profile?.id] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteAlert(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['alerts', profile?.id] }),
  });

  if (isLoading) return <LoadingScreen />;

  const activeCount = alerts?.filter((a) => a.is_active).length ?? 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-100">{t('alerts.title')}</h1>
          <p className="text-sm text-secondary-400 mt-1">
            {t('alerts.subtitle')} · {activeCount} {t('alerts.active')}
          </p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary">
          <Plus className="w-4 h-4" />
          {t('alerts.add')}
        </button>
      </div>

      {!alerts || alerts.length === 0 ? (
        <div className="card p-12 flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 rounded-full bg-surface-3 flex items-center justify-center">
            <Bell className="w-8 h-8 text-secondary-500" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-secondary-200 font-medium">{t('alerts.empty')}</p>
            <p className="text-sm text-secondary-400 mt-1">{t('alerts.emptyDesc')}</p>
          </div>
          <button onClick={() => setShowAdd(true)} className="btn-primary">
            <Plus className="w-4 h-4" />
            {t('alerts.add')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {alerts.map((alert) => {
            const config = alertTypeConfig[alert.alert_type];
            return (
              <div
                key={alert.id}
                className={cn(
                  'card p-4 transition-colors',
                  alert.is_active ? 'border-surface-4/30' : 'opacity-60'
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div
                      className={cn(
                        'w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0',
                        alert.is_active ? 'bg-primary-500/10 text-primary-400' : 'bg-surface-3 text-secondary-500'
                      )}
                    >
                      {config.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-secondary-400">{t(config.labelKey)}</span>
                        <Link
                          to={`/assets/${alert.asset?.symbol}`}
                          className="text-sm font-medium text-primary-300 hover:text-primary-200"
                        >
                          {alert.asset?.symbol}
                        </Link>
                      </div>
                      <p className="text-lg font-bold text-secondary-100" dir="ltr">
                        {alert.alert_type.startsWith('price_')
                          ? formatPrice(alert.threshold)
                          : alert.threshold}
                      </p>
                      {alert.message && (
                        <p className="text-xs text-secondary-400 mt-1">{alert.message}</p>
                      )}
                      <p className="text-xs text-secondary-500 mt-1">
                        {formatTimeAgo(alert.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => toggleMutation.mutate({ id: alert.id, isActive: !alert.is_active })}
                      className={cn(
                        'p-1.5 rounded-lg transition-colors',
                        alert.is_active
                          ? 'text-primary-400 hover:bg-primary-500/10'
                          : 'text-secondary-500 hover:bg-surface-3'
                      )}
                      aria-label={alert.is_active ? t('alerts.deactivate') : t('alerts.activate')}
                    >
                      {alert.is_active ? <BellRing className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => deleteMutation.mutate(alert.id)}
                      className="text-secondary-500 hover:text-error-400 transition-colors p-1.5 rounded-lg hover:bg-error-500/10"
                      aria-label={t('common.delete')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showAdd && assets && (
        <AddAlertModal
          assets={assets}
          onClose={() => setShowAdd(false)}
          onAdd={async (assetId, alertType, threshold, message) => {
            await createAlert(profile!.id, assetId, alertType, threshold, message);
            queryClient.invalidateQueries({ queryKey: ['alerts', profile?.id] });
            setShowAdd(false);
          }}
        />
      )}
    </div>
  );
}

function AddAlertModal({
  assets,
  onClose,
  onAdd,
}: {
  assets: Asset[];
  onClose: () => void;
  onAdd: (
    assetId: string,
    alertType: AlertType,
    threshold: number,
    message?: string
  ) => Promise<void>;
}) {
  const { t } = useTranslation();
  const [assetId, setAssetId] = useState('');
  const [alertType, setAlertType] = useState<AlertType>('price_above');
  const [threshold, setThreshold] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const alertTypes: AlertType[] = ['price_above', 'price_below', 'score_above', 'score_below', 'risk_above'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const thresholdNum = parseFloat(threshold);
    if (!assetId) { setError(t('portfolio.errors.selectAsset')); return; }
    if (!thresholdNum || thresholdNum <= 0) { setError(t('alerts.errors.invalidThreshold')); return; }
    await onAdd(assetId, alertType, thresholdNum, message.trim() || undefined);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative card p-6 w-full max-w-md animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-secondary-100">{t('alerts.addTitle')}</h2>
          <button onClick={onClose} className="text-secondary-400 hover:text-secondary-100">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-secondary-400 mb-1">{t('scanner.asset')}</label>
            <select value={assetId} onChange={(e) => setAssetId(e.target.value)} className="input-field">
              <option value="">{t('portfolio.selectAsset')}</option>
              {assets.map((a) => (
                <option key={a.id} value={a.id}>{a.symbol} — {a.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-secondary-400 mb-1">{t('alerts.type')}</label>
            <select
              value={alertType}
              onChange={(e) => setAlertType(e.target.value as AlertType)}
              className="input-field"
            >
              {alertTypes.map((type) => (
                <option key={type} value={type}>{t(alertTypeConfig[type].labelKey)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-secondary-400 mb-1">{t('alerts.threshold')}</label>
            <input
              type="number"
              step="any"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              className="input-field"
              placeholder={alertType.startsWith('price_') ? '50000' : '75'}
            />
          </div>
          <div>
            <label className="block text-xs text-secondary-400 mb-1">{t('alerts.message')}</label>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="input-field"
              placeholder={t('alerts.messagePlaceholder')}
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
