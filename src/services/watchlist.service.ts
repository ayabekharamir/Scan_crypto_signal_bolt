import type { Watchlist, WatchlistItem, Asset } from '@/types';
import { supabase } from '@/lib/supabase';

export async function fetchUserWatchlists(userId: string): Promise<Watchlist[]> {
  const { data, error } = await supabase
    .from('watchlists')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data as Watchlist[];
}

export async function fetchWatchlistItems(
  watchlistId: string
): Promise<(WatchlistItem & { asset: Asset })[]> {
  const { data, error } = await supabase
    .from('watchlist_items')
    .select('*, asset:assets(*)')
    .eq('watchlist_id', watchlistId)
    .order('added_at', { ascending: false });

  if (error) throw error;
  return data as (WatchlistItem & { asset: Asset })[];
}

export async function createWatchlist(
  userId: string,
  name: string
): Promise<Watchlist> {
  const { data, error } = await supabase
    .from('watchlists')
    .insert({ user_id: userId, name })
    .select()
    .single();

  if (error) throw error;
  return data as Watchlist;
}

export async function addToWatchlist(
  watchlistId: string,
  assetId: string
): Promise<void> {
  const { error } = await supabase
    .from('watchlist_items')
    .insert({ watchlist_id: watchlistId, asset_id: assetId });

  if (error) throw error;
}

export async function removeFromWatchlist(
  watchlistId: string,
  assetId: string
): Promise<void> {
  const { error } = await supabase
    .from('watchlist_items')
    .delete()
    .eq('watchlist_id', watchlistId)
    .eq('asset_id', assetId);

  if (error) throw error;
}

export async function isAssetInWatchlist(
  watchlistId: string,
  assetId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('watchlist_items')
    .select('id')
    .eq('watchlist_id', watchlistId)
    .eq('asset_id', assetId)
    .maybeSingle();

  if (error) throw error;
  return data !== null;
}
