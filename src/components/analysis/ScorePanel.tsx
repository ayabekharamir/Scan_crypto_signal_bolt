import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { fetchLatestScore, scoreFields, getScoreColor, getScoreBgColor } from '@/services/scoring.service';
import { cn } from '@/lib/utils';

export function ScorePanel({ assetId }: { assetId: string }) {
  const { t } = useTranslation();

  const { data: score, isLoading } = useQuery({
    queryKey: ['latest-score', assetId],
    queryFn: () => fetchLatestScore(assetId),
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl bg-surface-3/50 border border-surface-4/30 p-3">
            <div className="skeleton h-3 w-16 mb-2" />
            <div className="skeleton h-6 w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (!score) {
    return (
      <p className="text-sm text-secondary-500 text-center py-4">
        {t('scoring.noData')}
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {scoreFields.map(({ key, labelKey }) => {
        const value = score[key];
        return (
          <div
            key={key}
            className="rounded-xl bg-surface-3/50 border border-surface-4/30 p-3"
          >
            <p className="text-xs text-secondary-500 mb-2">{t(labelKey)}</p>
            <div className="flex items-baseline gap-1 mb-2">
              <span className={cn('text-2xl font-bold', getScoreColor(value))}>
                {value}
              </span>
              <span className="text-xs text-secondary-500">/100</span>
            </div>
            <div className="h-1.5 rounded-full bg-surface-4 overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all duration-500', getScoreBgColor(value))}
                style={{ width: `${value}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
