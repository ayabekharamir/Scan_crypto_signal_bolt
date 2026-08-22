import type { BacktestResult, BacktestMetricType } from '@/types';
import { supabase } from '@/lib/supabase';

export async function fetchBacktestResults(
  assetId: string
): Promise<BacktestResult[]> {
  const { data, error } = await supabase
    .from('backtest_results')
    .select('*')
    .eq('asset_id', assetId)
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) throw error;
  return data as BacktestResult[];
}

export const backtestMetricConfig: Record<
  BacktestMetricType,
  { labelKey: string }
> = {
  score_accuracy: { labelKey: 'backtest.metrics.scoreAccuracy' },
  scenario_accuracy: { labelKey: 'backtest.metrics.scenarioAccuracy' },
  recommendation_accuracy: {
    labelKey: 'backtest.metrics.recommendationAccuracy',
  },
};

export function getAccuracyColor(accuracy: number): string {
  if (accuracy >= 75) return 'text-success-400';
  if (accuracy >= 60) return 'text-primary-400';
  if (accuracy >= 40) return 'text-warning-400';
  return 'text-error-400';
}

export function getAccuracyBgColor(accuracy: number): string {
  if (accuracy >= 75) return 'bg-success-500';
  if (accuracy >= 60) return 'bg-primary-500';
  if (accuracy >= 40) return 'bg-warning-500';
  return 'bg-error-500';
}
