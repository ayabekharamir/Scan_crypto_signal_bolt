import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { applyDocumentLocale, supportedLanguages } from '@/lib/i18n';
import { Globe, Bell, Mail, Shield, RefreshCw, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { scheduledRefresh } from '@/services/market-data.service';
import type { ScheduledRefreshResult } from '@/types';
import { cn } from '@/lib/utils';

export function SettingsPage() {
  const { t, i18n } = useTranslation();
  const { profile } = useAuth();
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [refreshResult, setRefreshResult] = useState<ScheduledRefreshResult | null>(null);
  const [refreshError, setRefreshError] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('last-scheduled-refresh');
    if (stored) {
      const date = new Date(stored);
      if (!isNaN(date.getTime())) setLastRefresh(date);
    }
  }, []);

  const handleManualRefresh = useCallback(async () => {
    setRefreshing(true);
    setRefreshError(false);
    try {
      const result = await scheduledRefresh();
      setRefreshResult(result);
      const now = new Date();
      setLastRefresh(now);
      localStorage.setItem('last-scheduled-refresh', now.toISOString());
    } catch {
      setRefreshError(true);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const changeLanguage = (code: string) => {
    i18n.changeLanguage(code);
    applyDocumentLocale(code);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-secondary-100">{t('settings.title')}</h1>
      </div>

      {/* Language */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-primary-400" />
          <h2 className="text-base font-semibold text-secondary-100">{t('settings.language')}</h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {supportedLanguages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => changeLanguage(lang.code)}
              className={`p-4 rounded-xl border transition-all ${
                i18n.language === lang.code
                  ? 'border-primary-500/50 bg-primary-500/10 text-primary-300'
                  : 'border-surface-4 bg-surface-1 text-secondary-300 hover:border-surface-4'
              }`}
            >
              <span className="text-sm font-medium">{lang.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Notifications */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary-400" />
          <h2 className="text-base font-semibold text-secondary-100">{t('settings.notifications')}</h2>
        </div>
        <ToggleRow
          label={t('settings.notifications')}
          enabled={notifEnabled}
          onToggle={() => setNotifEnabled((v) => !v)}
        />
        <ToggleRow
          label={t('settings.emailAlerts')}
          enabled={emailAlerts}
          onToggle={() => setEmailAlerts((v) => !v)}
        />
      </div>

      {/* Auto Refresh */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary-400" />
          <h2 className="text-base font-semibold text-secondary-100">{t('settings.autoRefresh')}</h2>
        </div>
        <p className="text-sm text-secondary-400">{t('settings.autoRefreshDesc')}</p>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-success-500/10 border border-success-500/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-success-500"></span>
            </span>
            <span className="text-xs font-medium text-success-400">{t('settings.autoRefreshActive')}</span>
          </span>
          {lastRefresh && (
            <span className="text-xs text-secondary-500">
              {t('settings.lastRefresh')}: {lastRefresh.toLocaleTimeString()}
            </span>
          )}
        </div>

        {refreshResult && !refreshError && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-success-500/10 border border-success-500/20">
            <CheckCircle2 className="w-4 h-4 text-success-400 shrink-0" />
            <p className="text-sm text-success-400">
              {t('settings.refreshSuccess', { count: refreshResult.assets_updated, alerts: refreshResult.alerts_checked })}
            </p>
          </div>
        )

        {refreshError && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-error-500/10 border border-error-500/20">
            <AlertCircle className="w-4 h-4 text-error-400 shrink-0" />
            <p className="text-sm text-error-400">{t('settings.refreshError')}</p>
          </div>
        )

        <button
          onClick={handleManualRefresh}
          disabled={refreshing}
          className="btn-ghost"
        >
          <RefreshCw className={cn('w-4 h-4', refreshing && 'animate-spin')} />
          <span className="text-sm">{t('settings.refreshNow')}</span>
        </button>
      </div>

      {/* Account */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary-400" />
          <h2 className="text-base font-semibold text-secondary-100">Account</h2>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 rounded-xl bg-surface-1">
            <span className="text-sm text-secondary-400">Email</span>
            <span className="text-sm text-secondary-100" dir="ltr">{profile?.email}</span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-surface-1">
            <span className="text-sm text-secondary-400">Role</span>
            <span className="text-sm text-secondary-100">{profile?.role}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  enabled,
  onToggle,
}: {
  label: string;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-secondary-300">{label}</span>
      <button
        onClick={onToggle}
        className={`relative w-12 h-6 rounded-full transition-colors ${
          enabled ? 'bg-primary-500' : 'bg-surface-4'
        }`}
      >
        <span
          className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
            enabled ? 'start-7' : 'start-1'
          }`}
        />
      </button>
    </div>
  );
}
