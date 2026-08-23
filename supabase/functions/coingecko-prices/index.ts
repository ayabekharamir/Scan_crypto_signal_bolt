import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface CoinGeckoMarket {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  market_cap: number;
  total_volume: number;
  price_change_percentage_24h: number;
  price_change_percentage_7d_in_currency: number | null;
  high_24h: number;
  low_24h: number;
  image: string;
}

interface AssetRow {
  id: string;
  symbol: string;
  coingecko_id: string;
  logo_url: string | null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch all active crypto assets that have a coingecko_id
    const { data: assets, error: assetError } = await supabase
      .from("assets")
      .select("id, symbol, coingecko_id, logo_url")
      .eq("is_active", true)
      .eq("market_type", "crypto")
      .not("coingecko_id", "is", null)
      .order("rank", { ascending: true, nullsFirst: false })
      .limit(50);

    if (assetError) throw assetError;
    if (!assets || assets.length === 0) {
      return new Response(
        JSON.stringify({ message: "No assets with coingecko_id found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const coinIds = (assets as AssetRow[])
      .map((a) => a.coingecko_id)
      .filter(Boolean) as string[];

    // Fetch prices from CoinGecko (free API, no key needed)
    const idsParam = coinIds.join(",");
    const cgUrl = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${idsParam}&order=market_cap_desc&per_page=250&page=1&sparkline=false&price_change_percentage=24h,7d`;

    let cgResponse: Response;
    try {
      cgResponse = await fetch(cgUrl, {
        headers: { accept: "application/json" },
      });
    } catch (fetchErr) {
      return new Response(
        JSON.stringify({
          error: "Failed to reach CoinGecko API",
          detail: fetchErr instanceof Error ? fetchErr.message : "Unknown error",
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!cgResponse.ok) {
      return new Response(
        JSON.stringify({
          error: `CoinGecko API returned ${cgResponse.status}`,
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const cgData = (await cgResponse.json()) as CoinGeckoMarket[];

    // Build a lookup: coingecko_id → market data
    const cgMap = new Map<string, CoinGeckoMarket>();
    for (const coin of cgData) {
      cgMap.set(coin.id, coin);
    }

    // Update logo_url for assets that don't have one
    const updates: Array<Promise<unknown>> = [];
    for (const asset of assets as AssetRow[]) {
      const cgCoin = cgMap.get(asset.coingecko_id);
      if (cgCoin && !asset.logo_url && cgCoin.image) {
        updates.push(
          supabase
            .from("assets")
            .update({ logo_url: cgCoin.image, updated_at: new Date().toISOString() })
            .eq("id", asset.id)
        );
      }
    }
    await Promise.all(updates);

    // Insert price snapshots via the upsert_price_snapshot function
    const snapshotPromises = (assets as AssetRow[]).map(async (asset) => {
      const cgCoin = cgMap.get(asset.coingecko_id);
      if (!cgCoin) return null;

      const { error } = await supabase.rpc("upsert_price_snapshot", {
        p_asset_id: asset.id,
        p_price_usd: cgCoin.current_price,
        p_market_cap: cgCoin.market_cap ?? null,
        p_volume_24h: cgCoin.total_volume ?? null,
        p_change_24h: cgCoin.price_change_percentage_24h ?? null,
        p_change_7d: cgCoin.price_change_percentage_7d_in_currency ?? null,
        p_high_24h: cgCoin.high_24h ?? null,
        p_low_24h: cgCoin.low_24h ?? null,
      });

      if (error) {
        console.error(`Failed to insert snapshot for ${asset.symbol}:`, error.message);
      }
      return asset.symbol;
    });

    const results = await Promise.all(snapshotPromises);
    const inserted = results.filter(Boolean) as string[];

    // Cache the raw API response
    await supabase.from("api_cache").upsert({
      cache_key: "coingecko:markets",
      response_data: cgData,
      fetched_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 60 * 1000).toISOString(),
    }, { onConflict: "cache_key" });

    return new Response(
      JSON.stringify({
        success: true,
        assets_updated: inserted.length,
        symbols: inserted,
        cached_at: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
