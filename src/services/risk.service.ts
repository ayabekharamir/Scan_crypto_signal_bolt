import type { RiskAssessment, RiskField, RiskLabel } from '@/types';
import { supabase } from '@/lib/supabase';

export async function fetchLatestRisk(assetId: string): Promise<RiskAssessment | null> {
  const { data, error } = await supabase
    .from('risk_assessments')
    .select('*')
    .eq('asset_id', assetId)
    .order('computed_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data as RiskAssessment | null;
}

export const riskFields: { key: RiskField; labelKey: string }[] = [
  { key: 'market_risk', labelKey: 'risk.market' },
  { key: 'asset_risk', labelKey: 'risk.asset' },
  { key: 'liquidity_risk', labelKey: 'risk.liquidity' },
  { key: 'timing_risk', labelKey: 'risk.timing' },
  { key: 'news_risk', labelKey: 'risk.news' },
  { key: 'event_risk', labelKey: 'risk.event' },
];

export function getRiskColor(risk: number): string {
  if (risk <= 25) return 'text-success-400';
  if (risk <= 50) return 'text-primary-400';
  if (risk <= 75) return 'text-warning-400';
  return 'text-error-400';
}

export function getRiskBgColor(risk: number): string {
  if (risk <= 25) return 'bg-success-500';
  if (risk <= 50) return 'bg-primary-500';
  if (risk <= 75) return 'bg-warning-500';
  return 'bg-error-500';
}

export function getRiskLabelColor(label: RiskLabel): string {
  switch (label) {
    case 'Low':
      return 'text-success-400 bg-success-500/10';
    case 'Moderate':
      return 'text-primary-400 bg-primary-500/10';
    case 'High':
      return 'text-warning-400 bg-warning-500/10';
    case 'Extreme':
      return 'text-error-400 bg-error-500/10';
  }
}
