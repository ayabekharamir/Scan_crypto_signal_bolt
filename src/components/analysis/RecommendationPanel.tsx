import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  fetchLatestRecommendation,
  actionConfig,
} from '@/services/recommendation.service';
import { formatPrice, cn } from '@/lib/utils';
import { Target, Shield, TrendingUp, Clock, Activity } from 'lucide-react';

export function RecommendationPanel({ assetId }: { assetId: string }) {
  const { t } = useTranslation();

  const { data: rec, isLoading } = useQuery({
    queryKey: ['latest-recommendation', assetId],
    queryFn: () => fetchLatestRecommendation(assetId),
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="skeleton h-8 w-32" />
        <div className="skeleton h-4 w-full" />
        <div className="skeleton h-4 w-3/4" />
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton h-16 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!rec) {
    return (
      <p className="text-sm text-secondary-500 text-center py-4">
        {t('recommendation.noData')}
      </p>
    );
  }

  const config = actionConfig[rec.action];
  const isValid = !rec.valid_until || new Date(rec.valid_until) > new Date();

  return (
    <div className="space-y-4">
      {/* Action badge */}
      <div className="flex items-center gap-3">
        <span
          className={cn(
            'inline-flex items-center gap-2 px-4 py-2 rounded-xl text-lg font-bold border',
            config.bg,
            config.color,
            config.border
          )}
        >
          {t(config.labelKey)}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-sm text-secondary-400">{t('recommendation.confidence')}</span>
          <div className="flex items-center gap-1.5">
            <div className="h-1.5 w-20 rounded-full bg-surface-4 overflow-hidden">
              <div
                className={cn('h-full rounded-full', config.color.replace('text-', 'bg-'))}
                style={{ width: `${rec.confidence}%` }}
              />
            </div>
            <span className={cn('text-sm font-bold', config.color)}>{rec.confidence}%</span>
          </div>
        </div>
        {!isValid && (
          <span className="badge bg-error-500/10 text-error-400 text-xs">
            {t('recommendation.expired')}
          </span>
        )}
      </div>

      {/* Summary */}
      <p className="text-sm font-medium text-secondary-100">{rec.summary}</p>

      {/* Reasoning */}
      {rec.reasoning && (
        <div className="p-4 rounded-xl bg-surface-1 border border-surface-4/30">
          <p className="text-xs text-secondary-500 mb-1">{t('recommendation.aiReasoning')}</p>
          <p className="text-sm text-secondary-300 leading-relaxed">{rec.reasoning}</p>
        </div>
      )}

      {/* Trading parameters */}
      {(rec.entry_zone_low !== null || rec.stop_loss !== null || rec.take_profit !== null) && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {rec.entry_zone_low !== null && rec.entry_zone_high !== null && (
            <ParamCard
              icon={Target}
              label={t('recommendation.entryZone')}
              value={`${formatPrice(rec.entry_zone_low)} - ${formatPrice(rec.entry_zone_high)}`}
            />
          )}
          {rec.stop_loss !== null && (
            <ParamCard
              icon={Shield}
              label={t('recommendation.stopLoss')}
              value={formatPrice(rec.stop_loss)}
              valueClass="text-error-400"
            />
          )}
          {rec.take_profit !== null && (
            <ParamCard
              icon={TrendingUp}
              label={t('recommendation.takeProfit')}
              value={formatPrice(rec.take_profit)}
              valueClass="text-success-400"
            />
          )}
        </div>
      )}

      {/* Position size and R:R */}
      <div className="flex flex-wrap items-center gap-4">
        {rec.position_size && (
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-secondary-500" />
            <span className="text-xs text-secondary-500">{t('recommendation.positionSize')}</span>
            <span className="text-sm text-secondary-200">{rec.position_size}</span>
          </div>
        )}
        {rec.risk_reward_ratio !== null && (
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-secondary-500" />
            <span className="text-xs text-secondary-500">{t('recommendation.riskReward')}</span>
            <span className="text-sm text-secondary-200" dir="ltr">1:{rec.risk_reward_ratio.toFixed(1)}</span>
          </div>
        )}
        {rec.valid_until && (
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-secondary-500" />
            <span className="text-xs text-secondary-500">{t('recommendation.validUntil')}</span>
            <span className="text-sm text-secondary-200">
              {new Date(rec.valid_until).toLocaleDateString()}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function ParamCard({
  icon: Icon,
  label,
  value,
  valueClass,
}: {
  icon: typeof Target;
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="rounded-xl bg-surface-1 border border-surface-4/30 p-3">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-4 h-4 text-secondary-500" />
        <span className="text-xs text-secondary-500">{label}</span>
      </div>
      <p className={cn('text-sm font-semibold text-secondary-100', valueClass)} dir="ltr">
        {value}
      </p>
    </div>
  );
}
