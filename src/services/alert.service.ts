import type { Alert, AlertType, Asset } from '@/types';
import { supabase } from '@/lib/supabase';

export async function fetchAlerts(userId: string): Promise<Alert[]> {
  const { data, error } = await supabase
    .from('alerts')
    .select('*, asset:assets(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as (Alert & { asset: Asset })[];
}

export async function createAlert(
  userId: string,
  assetId: string,
  alertType: AlertType,
  threshold: number,
  message?: string
): Promise<Alert> {
  const { data, error } = await supabase
    .from('alerts')
    .insert({
      user_id: userId,
      asset_id: assetId,
      alert_type: alertType,
      threshold,
      message: message || null,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Alert;
}

export async function toggleAlert(id: string, isActive: boolean): Promise<void> {
  const { error } = await supabase
    .from('alerts')
    .update({ is_active: isActive })
    .eq('id', id);

  if (error) throw error;
}

export async function deleteAlert(id: string): Promise<void> {
  const { error } = await supabase.from('alerts').delete().eq('id', id);
  if (error) throw error;
}

export const alertTypeConfig: Record<
  AlertType,
  { labelKey: string; icon: string }
> = {
  price_above: { labelKey: 'alerts.types.priceAbove', icon: '↑' },
  price_below: { labelKey: 'alerts.types.priceBelow', icon: '↓' },
  score_above: { labelKey: 'alerts.types.scoreAbove', icon: '★' },
  score_below: { labelKey: 'alerts.types.scoreBelow', icon: '★' },
  risk_above: { labelKey: 'alerts.types.riskAbove', icon: '⚠' },
};
