import type { PriceRefreshResult, AlertCheckResult, ScheduledRefreshResult } from '@/types';

const FUNCTION_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

const headers = {
  Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
  'Content-Type': 'application/json',
};

export async function refreshPrices(): Promise<PriceRefreshResult> {
  const response = await fetch(`${FUNCTION_BASE}/coingecko-prices`, {
    method: 'POST',
    headers,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(
      errorBody?.error || `Failed to refresh prices (${response.status})`
    );
  }

  const data = await response.json();
  if (!data || typeof data.success === 'undefined') {
    throw new Error('Invalid response from price refresh service');
  }

  return data as PriceRefreshResult;
}

export async function checkAlerts(): Promise<AlertCheckResult> {
  const response = await fetch(`${FUNCTION_BASE}/refresh-prices`, {
    method: 'POST',
    headers,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(
      errorBody?.error || `Failed to check alerts (${response.status})`
    );
  }

  const data = await response.json();
  if (!data || typeof data.success === 'undefined') {
    throw new Error('Invalid response from alert checker service');
  }

  return data as AlertCheckResult;
}

export async function scheduledRefresh(): Promise<ScheduledRefreshResult> {
  const response = await fetch(`${FUNCTION_BASE}/scheduled-refresh`, {
    method: 'POST',
    headers,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(
      errorBody?.error || `Failed to run scheduled refresh (${response.status})`
    );
  }

  const data = await response.json();
  if (!data || typeof data.success === 'undefined') {
    throw new Error('Invalid response from scheduled refresh service');
  }

  return data as ScheduledRefreshResult;
}
