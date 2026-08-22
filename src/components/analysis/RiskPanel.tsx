import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  fetchLatestRisk,
  riskFields,
  getRiskColor,
  getRiskBgColor,
  getRiskLabelColor,
} from '@/services/risk.service';
import { cn } from '@/lib/utils';

export function RiskPanel({ assetId }: { assetId: string }) {
  const { t } = useTranslation();

  const { data: risk, isLoading } = useQuery({
    queryKey: ['latest-risk', assetId],
    queryFn: () => fetchLatestRisk(assetId),
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="skeleton h-8 w-24" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl bg-surface-3/50 border border-surface-4/30 p-3">
              <div className="skeleton h-3 w-16 mb-2" />
              <div className="skeleton h-6 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!risk) {
    return (
      <p className="text-sm text-secondary-500 text-center py-4">
        {t('risk.noData')}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {/* Overall risk gauge */}
      <div className="flex items-center gap-4">
        <div className="relative w-20 h-20 shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
            <circle
              cx="40"
              cy="40"
              r="34"
              fill="none"
              strokeWidth="6"
              className="stroke-surface-4"
            />
            <circle
              cx="40"
              cy="40"
              r="34"
              fill="none"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${(risk.overall_risk / 100) * 213.6} 213.6`}
              className={cn(
                risk.overall_risk <= 25
                  ? 'stroke-success-500'
                  : risk.overall_risk <= 50
                  ? 'stroke-primary-500'
                  : risk.overall_risk <= 75
                  ? 'stroke-warning-500'
                  : 'stroke-error-500'
              )}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={cn('text-xl font-bold', getRiskColor(risk.overall_risk))}>
              {risk.overall_risk}
            </span>
          </div>
        </div>
        <div>
          <span className={cn('badge text-sm', getRiskLabelColor(risk.risk_label))}>
            {t(`risk.labels.${risk.risk_label.toLowerCase()}`)}
          </span>
          <p className="text-xs text-secondary-500 mt-1">{t('risk.overallDesc')}</p>
        </div>
      </div>

      {/* Individual risk factors */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {riskFields.map(({ key, labelKey }) => {
          const value = risk[key];
          return (
            <div
              key={key}
              className="rounded-xl bg-surface-3/50 border border-surface-4/30 p-3"
            >
              <p className="text-xs text-secondary-500 mb-2">{t(labelKey)}</p>
              <div className="flex items-baseline gap-1 mb-2">
                <span className={cn('text-lg font-bold', getRiskColor(value))}>
                  {value}
                </span>
                <span className="text-xs text-secondary-500">/100</span>
              </div>
              <div className="h-1.5 rounded-full bg-surface-4 overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all duration-500', getRiskBgColor(value))}
                  style={{ width: `${value}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
