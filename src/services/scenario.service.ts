import type { Scenario, ScenarioType } from '@/types';
import { supabase } from '@/lib/supabase';

export async function fetchScenarios(assetId: string): Promise<Scenario[]> {
  const { data, error } = await supabase
    .from('scenarios')
    .select('*')
    .eq('asset_id', assetId)
    .order('probability', { ascending: false })
    .limit(5);

  if (error) throw error;
  return data as Scenario[];
}

export const scenarioTypeConfig: Record<
  ScenarioType,
  { labelKey: string; color: string; bg: string; icon: string }
> = {
  continuation: {
    labelKey: 'scenario.types.continuation',
    color: 'text-success-400',
    bg: 'bg-success-500/10',
    icon: '↗',
  },
  correction: {
    labelKey: 'scenario.types.correction',
    color: 'text-warning-400',
    bg: 'bg-warning-500/10',
    icon: '↔',
  },
  breakout: {
    labelKey: 'scenario.types.breakout',
    color: 'text-primary-400',
    bg: 'bg-primary-500/10',
    icon: '↑↑',
  },
  weakness: {
    labelKey: 'scenario.types.weakness',
    color: 'text-error-400',
    bg: 'bg-error-500/10',
    icon: '↘',
  },
  crash: {
    labelKey: 'scenario.types.crash',
    color: 'text-error-500',
    bg: 'bg-error-500/20',
    icon: '↓↓',
  },
};
