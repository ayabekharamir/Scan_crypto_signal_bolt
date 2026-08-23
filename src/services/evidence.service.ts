import type { Evidence, ImpactType } from '@/types';
import { supabase } from '@/lib/supabase';

export async function fetchEvidence(assetId: string, limit = 10): Promise<Evidence[]> {
  const { data, error } = await supabase
    .from('evidence')
    .select('*')
    .eq('asset_id', assetId)
    .order('recorded_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data as Evidence[];
}

export function getImpactColor(impact: ImpactType): string {
  switch (impact) {
    case 'positive':
      return 'text-success-400 bg-success-500/10';
    case 'negative':
      return 'text-error-400 bg-error-500/10';
    case 'neutral':
      return 'text-secondary-400 bg-secondary-500/10';
  }
}

export function getImpactIcon(impact: ImpactType): string {
  switch (impact) {
    case 'positive':
      return '↑';
    case 'negative':
      return '↓';
    case 'neutral':
      return '—';
  }
}

export function getSourceColor(source: string): string {
  switch (source) {
    case 'market_data':
      return 'text-primary-300 bg-primary-500/10';
    case 'news':
      return 'text-accent-300 bg-accent-500/10';
    case 'on_chain':
      return 'text-warning-300 bg-warning-500/10';
    case 'social':
      return 'text-secondary-300 bg-secondary-500/10';
    default:
      return 'text-secondary-300 bg-secondary-500/10';
  }
}
