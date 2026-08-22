import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  fetchBacktestResults,
  backtestMetricConfig,
  getAccuracyColor,
  getAccuracyBgColor,
} from '@/services/backtest.service';
import { cn } from '@/lib/utils';
import { History } from 'lucide-react';

export function BacktestPanel({ assetId }: { assetId: string }) {
  const { t } = useTranslation();

  const { data: results, isLoading } = useQuery({
    queryKey: ['backtest-results', assetId],
    queryFn: () => fetchBacktestResults(assetId),
    staleTime: 120_000,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="skeleton h-24 rounded-xl" />
        ))}
      </div>
    );
  }

  if (!results || results.length === 0) {
    return (
      <p className="text-sm text-secondary-500 text-center py-4">
        {t('backtest.noData')}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {/* Overall accuracy summary */}
      <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-1">
        <History className="w-5 h-5 text-primary-400" />
        <p className="text-sm text-secondary-300">{t('backtest.description')}</p>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {results.map((result) => {
          const config = backtestMetricConfig[result.metric_type];
          return (
            <div
              key={result.id}
              className="rounded-xl bg-surface-3/50 border border-surface-4/30 p-4"
            >
              <p className="text-xs text-secondary-500 mb-2">{t(config.labelKey)}</p>
              <div className="flex items-baseline gap-1 mb-2">
                <span className={cn('text-2xl font-bold', getAccuracyColor(result.accuracy))}>
                  {result.accuracy}%
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-surface-4 overflow-hidden mb-2">
                <div
                  className={cn('h-full rounded-full transition-all duration-500', getAccuracyBgColor(result.accuracy))}
                  style={{ width: `${result.accuracy}%` }}
                />
              </div>
              <p className="text-xs text-secondary-500">
                {result.correct_predictions} / {result.total_predictions} {t('backtest.correct')}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
