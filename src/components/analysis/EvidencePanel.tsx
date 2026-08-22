import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  fetchEvidence,
  getImpactColor,
  getImpactIcon,
  getSourceColor,
} from '@/services/evidence.service';
import { formatTimeAgo, cn } from '@/lib/utils';
import { FileText } from 'lucide-react';

export function EvidencePanel({ assetId }: { assetId: string }) {
  const { t } = useTranslation();

  const { data: evidence, isLoading } = useQuery({
    queryKey: ['evidence', assetId],
    queryFn: () => fetchEvidence(assetId),
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-3 p-3 rounded-xl bg-surface-1">
            <div className="skeleton h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-4 w-3/4" />
              <div className="skeleton h-3 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!evidence || evidence.length === 0) {
    return (
      <p className="text-sm text-secondary-500 text-center py-4">
        {t('evidence.noData')}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {evidence.map((item) => (
        <div
          key={item.id}
          className="flex gap-3 p-3 rounded-xl bg-surface-1 hover:bg-surface-3/50 transition-colors"
        >
          <div
            className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-lg font-bold',
              getImpactColor(item.impact_type)
            )}
          >
            {getImpactIcon(item.impact_type)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={cn('badge text-xs', getSourceColor(item.source))}>
                {t(`evidence.sources.${item.source}`)}
              </span>
              <span className="text-xs text-secondary-500">
                {formatTimeAgo(item.recorded_at)}
              </span>
            </div>
            <p className="text-sm font-medium text-secondary-100 mb-1">
              {item.title}
            </p>
            {item.description && (
              <p className="text-xs text-secondary-400 line-clamp-2">
                {item.description}
              </p>
            )}
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-secondary-500">{t('evidence.impact')}</span>
                <div className="h-1.5 w-16 rounded-full bg-surface-4 overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full',
                      item.impact_type === 'positive'
                        ? 'bg-success-500'
                        : item.impact_type === 'negative'
                        ? 'bg-error-500'
                        : 'bg-secondary-500'
                    )}
                    style={{ width: `${item.impact_score}%` }}
                  />
                </div>
                <span className="text-xs text-secondary-300">{item.impact_score}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-secondary-500">{t('evidence.confidence')}</span>
                <div className="h-1.5 w-16 rounded-full bg-surface-4 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary-500"
                    style={{ width: `${item.confidence}%` }}
                  />
                </div>
                <span className="text-xs text-secondary-300">{item.confidence}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
