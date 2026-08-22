import type { Asset, AssetWithPrice, PriceSnapshot, MarketType } from '@/types';
import { supabase } from '@/lib/supabase';

export async function fetchAssets(market?: MarketType): Promise<Asset[]> {
  let query = supabase
    .from('assets')
    .select('*')
    .eq('is_active', true)
    .order('rank', { ascending: true, nullsFirst: false });

  if (market) query = query.eq('market_type', market);

  const { data, error } = await query;
  if (error) throw error;
  return data as Asset[];
}

export async function fetchAssetBySymbol(symbol: string): Promise<Asset | null> {
  const { data, error } = await supabase
    .from('assets')
    .select('*')
    .eq('symbol', symbol.toUpperCase())
    .eq('is_active', true)
    .maybeSingle();

  if (error) throw error;
  return data as Asset | null;
}

export async function fetchAssetById(id: string): Promise<Asset | null> {
  const { data, error } = await supabase
    .from('assets')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data as Asset | null;
}

export async function fetchLatestPrice(assetId: string): Promise<PriceSnapshot | null> {
  const { data, error } = await supabase
    .from('price_snapshots')
    .select('*')
    .eq('asset_id', assetId)
    .order('recorded_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data as PriceSnapshot | null;
}

export async function fetchAssetsWithPrices(market?: MarketType): Promise<AssetWithPrice[]> {
  const assets = await fetchAssets(market);

  const results = await Promise.all(
    assets.map(async (asset) => {
      const latestPrice = await fetchLatestPrice(asset.id);
      return { ...asset, latest_price: latestPrice };
    })
  );

  return results;
}

export async function fetchPriceHistory(
  assetId: string,
  limit = 30
): Promise<PriceSnapshot[]> {
  const { data, error } = await supabase
    .from('price_snapshots')
    .select('*')
    .eq('asset_id', assetId)
    .order('recorded_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data as PriceSnapshot[]).reverse();
}
