import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { fetchScenarios, scenarioTypeConfig } from '@/services/scenario.service';
import { formatPrice, cn } from '@/lib/utils';
import { Sparkles } from 'lucide-react';

export function ScenarioPanel({ assetId }: { assetId: string }) {
  const { t } = useTranslation();

  const { data: scenarios, isLoading } = useQuery({
    queryKey: ['scenarios', assetId],
    queryFn: () => fetchScenarios(assetId),
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="p-4 rounded-xl bg-surface-1">
            <div className="skeleton h-5 w-1/3 mb-2" />
            <div className="skeleton h-3 w-full mb-1" />
            <div className="skeleton h-3 w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  if (!scenarios || scenarios.length === 0) {
    return (
      <p className="text-sm text-secondary-500 text-center py-4">
        {t('scenario.noData')}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {scenarios.map((scenario) => {
        const config = scenarioTypeConfig[scenario.scenario_type];
        return (
          <div
            key={scenario.id}
            className="p-4 rounded-xl bg-surface-1 hover:bg-surface-3/50 transition-colors"
          >
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-lg font-bold',
                  config.bg,
                  config.color
                )}
              >
                {config.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={cn('badge text-xs', config.bg, config.color)}>
                    {t(config.labelKey)}
                  </span>
                  <span className="text-xs text-secondary-500">
                    {scenario.timeframe}
                  </span>
                </div>
                <p className="text-sm font-medium text-secondary-100 mb-1">
                  {scenario.title}
                </p>
                {scenario.description && (
                  <p className="text-xs text-secondary-400 mb-3">
                    {scenario.description}
                </p>
                )}

                {/* Probability bar */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs text-secondary-500 shrink-0">
                    {t('scenario.probability')}
                  </span>
                  <div className="flex-1 h-2 rounded-full bg-surface-4 overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all duration-500', config.color.replace('text-', 'bg-'))}
                      style={{ width: `${scenario.probability}%` }}
                    />
                  </div>
                  <span className={cn('text-sm font-bold', config.color)}>
                    {scenario.probability}%
                  </span>
                </div>

                {/* Price targets */}
                {scenario.price_target_low !== null && scenario.price_target_high !== null && (
                  <div className="flex items-center gap-4 text-xs">
                    <div>
                      <span className="text-secondary-500">{t('scenario.targetLow')}: </span>
                      <span className="text-secondary-200" dir="ltr">
                        {formatPrice(scenario.price_target_low)}
                      </span>
                    </div>
                    <div>
                      <span className="text-secondary-500">{t('scenario.targetHigh')}: </span>
                      <span className="text-secondary-200" dir="ltr">
                        {formatPrice(scenario.price_target_high)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Key drivers */}
                {scenario.key_drivers.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {scenario.key_drivers.map((driver, i) => (
                      <span
                        key={i}
                        className="badge bg-surface-3 text-secondary-300 text-xs"
                      >
                        <Sparkles className="w-3 h-3" />
                        {driver}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
