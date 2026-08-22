import type { PortfolioItem, PortfolioItemWithPrice, Asset } from '@/types';
import { supabase } from '@/lib/supabase';
import { fetchLatestPrice } from './asset.service';

export async function fetchPortfolio(
  userId: string
): Promise<PortfolioItemWithPrice[]> {
  const { data, error } = await supabase
    .from('portfolio_items')
    .select('*, asset:assets(*)')
    .eq('user_id', userId)
    .order('added_at', { ascending: false });

  if (error) throw error;

  const items = (data || []) as (PortfolioItem & { asset: Asset })[];

  const enriched = await Promise.all(
    items.map(async (item) => {
      const price = await fetchLatestPrice(item.asset_id);
      const currentPrice = price?.price_usd ?? null;
      const marketValue = currentPrice !== null ? currentPrice * Number(item.quantity) : null;
      const costBasis = Number(item.avg_buy_price) * Number(item.quantity);
      const pnl = marketValue !== null ? marketValue - costBasis : null;
      const pnlPercent = pnl !== null ? (pnl / costBasis) * 100 : null;

      return {
        ...item,
        current_price: currentPrice,
        market_value: marketValue,
        cost_basis: costBasis,
        pnl,
        pnl_percent: pnlPercent,
      } as PortfolioItemWithPrice;
    })
  );

  return enriched;
}

export async function addToPortfolio(
  userId: string,
  assetId: string,
  quantity: number,
  avgBuyPrice: number,
  notes?: string
): Promise<void> {
  const { error } = await supabase
    .from('portfolio_items')
    .upsert(
      {
        user_id: userId,
        asset_id: assetId,
        quantity,
        avg_buy_price: avgBuyPrice,
        notes: notes || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,asset_id' }
    );

  if (error) throw error;
}

export async function updatePortfolioItem(
  id: string,
  updates: { quantity?: number; avg_buy_price?: number; notes?: string | null }
): Promise<void> {
  const { error } = await supabase
    .from('portfolio_items')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;
}

export async function removeFromPortfolio(id: string): Promise<void> {
  const { error } = await supabase.from('portfolio_items').delete().eq('id', id);
  if (error) throw error;
}

export function computePortfolioSummary(items: PortfolioItemWithPrice[]) {
  const totalValue = items.reduce((sum, item) => sum + (item.market_value ?? 0), 0);
  const totalCost = items.reduce((sum, item) => sum + item.cost_basis, 0);
  const totalPnl = totalValue - totalCost;
  const totalPnlPercent = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;

  return { totalValue, totalCost, totalPnl, totalPnlPercent };
}
