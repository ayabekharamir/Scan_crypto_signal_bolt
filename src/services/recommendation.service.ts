import type { Recommendation, RecommendationAction } from '@/types';
import { supabase } from '@/lib/supabase';

export async function fetchLatestRecommendation(
  assetId: string
): Promise<Recommendation | null> {
  const { data, error } = await supabase
    .from('recommendations')
    .select('*')
    .eq('asset_id', assetId)
    .order('computed_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data as Recommendation | null;
}

export const actionConfig: Record<
  RecommendationAction,
  { labelKey: string; color: string; bg: string; border: string }
> = {
  strong_buy: {
    labelKey: 'recommendation.actions.strong_buy',
    color: 'text-success-400',
    bg: 'bg-success-500/15',
    border: 'border-success-500/30',
  },
  buy: {
    labelKey: 'recommendation.actions.buy',
    color: 'text-success-300',
    bg: 'bg-success-500/10',
    border: 'border-success-500/20',
  },
  hold: {
    labelKey: 'recommendation.actions.hold',
    color: 'text-primary-300',
    bg: 'bg-primary-500/10',
    border: 'border-primary-500/20',
  },
  reduce: {
    labelKey: 'recommendation.actions.reduce',
    color: 'text-warning-300',
    bg: 'bg-warning-500/10',
    border: 'border-warning-500/20',
  },
  sell: {
    labelKey: 'recommendation.actions.sell',
    color: 'text-error-400',
    bg: 'bg-error-500/10',
    border: 'border-error-500/20',
  },
  avoid: {
    labelKey: 'recommendation.actions.avoid',
    color: 'text-error-500',
    bg: 'bg-error-500/15',
    border: 'border-error-500/30',
  },
};
