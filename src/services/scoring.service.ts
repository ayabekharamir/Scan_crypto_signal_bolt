import type { AssetScore, ScoreField } from '@/types';
import { supabase } from '@/lib/supabase';

export async function fetchLatestScore(assetId: string): Promise<AssetScore | null> {
  const { data, error } = await supabase
    .from('asset_scores')
    .select('*')
    .eq('asset_id', assetId)
    .order('computed_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data as AssetScore | null;
}

export async function fetchScoreHistory(
  assetId: string,
  limit = 30
): Promise<AssetScore[]> {
  const { data, error } = await supabase
    .from('asset_scores')
    .select('*')
    .eq('asset_id', assetId)
    .order('computed_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data as AssetScore[]).reverse();
}

export const scoreFields: { key: ScoreField; labelKey: string }[] = [
  { key: 'trend_score', labelKey: 'scoring.trend' },
  { key: 'momentum_score', labelKey: 'scoring.momentum' },
  { key: 'volume_score', labelKey: 'scoring.volume' },
  { key: 'liquidity_score', labelKey: 'scoring.liquidity' },
  { key: 'attention_score', labelKey: 'scoring.attention' },
  { key: 'confidence_score', labelKey: 'scoring.confidence' },
];

export function getScoreColor(score: number): string {
  if (score >= 75) return 'text-success-400';
  if (score >= 50) return 'text-primary-400';
  if (score >= 25) return 'text-warning-400';
  return 'text-error-400';
}

export function getScoreBgColor(score: number): string {
  if (score >= 75) return 'bg-success-500';
  if (score >= 50) return 'bg-primary-500';
  if (score >= 25) return 'bg-warning-500';
  return 'bg-error-500';
}
