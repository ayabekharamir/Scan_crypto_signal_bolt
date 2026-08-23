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

interface AlertRow {
  id: string;
  user_id: string;
  asset_id: string;
  alert_type: string;
  threshold: number;
  message: string | null;
  is_active: boolean;
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

    // ── Step 1: Fetch live prices from CoinGecko ──────────────────────

    const { data: assets, error: assetError } = await supabase
      .from("assets")
      .select("id, symbol, coingecko_id, logo_url")
      .eq("is_active", true)
      .eq("market_type", "crypto")
      .not("coingecko_id", "is", null)
      .order("rank", { ascending: true, nullsFirst: false })
      .limit(50);

    if (assetError) throw assetError;

    let assetsUpdated = 0;
    let symbolsUpdated: string[] = [];

    if (assets && assets.length > 0) {
      const coinIds = (assets as AssetRow[])
        .map((a) => a.coingecko_id)
        .filter(Boolean) as string[];

      const idsParam = coinIds.join(",");
      const cgUrl = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${idsParam}&order=market_cap_desc&per_page=250&page=1&sparkline=false&price_change_percentage=24h,7d`;

      let cgResponse: Response;
      try {
        cgResponse = await fetch(cgUrl, {
          headers: { accept: "application/json" },
        });
      } catch {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Failed to reach CoinGecko API",
            assets_updated: 0,
            alerts_triggered: 0,
          }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!cgResponse.ok) {
        return new Response(
          JSON.stringify({
            success: false,
            error: `CoinGecko API returned ${cgResponse.status}`,
            assets_updated: 0,
            alerts_triggered: 0,
          }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const cgData = (await cgResponse.json()) as CoinGeckoMarket[];
      const cgMap = new Map<string, CoinGeckoMarket>();
      for (const coin of cgData) {
        cgMap.set(coin.id, coin);
      }

      // Update logo_url for assets missing one
      const logoUpdates: Array<Promise<unknown>> = [];
      for (const asset of assets as AssetRow[]) {
        const cgCoin = cgMap.get(asset.coingecko_id);
        if (cgCoin && !asset.logo_url && cgCoin.image) {
          logoUpdates.push(
            supabase
              .from("assets")
              .update({ logo_url: cgCoin.image, updated_at: new Date().toISOString() })
              .eq("id", asset.id)
          );
        }
      }
      await Promise.all(logoUpdates);

      // Insert price snapshots
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
      symbolsUpdated = results.filter(Boolean) as string[];
      assetsUpdated = symbolsUpdated.length;

      // Cache the raw API response
      await supabase.from("api_cache").upsert({
        cache_key: "coingecko:markets",
        response_data: cgData,
        fetched_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 60 * 1000).toISOString(),
      }, { onConflict: "cache_key" });
    }

    // ── Step 2: Check active alerts against latest prices/scores/risk ──

    const { data: alerts, error: alertError } = await supabase
      .from("alerts")
      .select("id, user_id, asset_id, alert_type, threshold, message, is_active")
      .eq("is_active", true)
      .is("triggered_at", null);

    if (alertError) throw alertError;

    let alertsTriggered = 0;
    const triggeredIds: string[] = [];

    if (alerts && alerts.length > 0) {
      const assetIds = [...new Set(alerts.map((a: AlertRow) => a.asset_id))];
      const priceMap = new Map<string, { price: number | null; score: number | null; risk: number | null }>();

      for (const assetId of assetIds) {
        const { data: priceData } = await supabase
          .from("price_snapshots")
          .select("price_usd")
          .eq("asset_id", assetId)
          .order("recorded_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        const { data: scoreData } = await supabase
          .from("asset_scores")
          .select("confidence_score")
          .eq("asset_id", assetId)
          .order("computed_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        const { data: riskData } = await supabase
          .from("risk_assessments")
          .select("overall_risk")
          .eq("asset_id", assetId)
          .order("computed_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        priceMap.set(assetId, {
          price: priceData?.price_usd ?? null,
          score: scoreData?.confidence_score ?? null,
          risk: riskData?.overall_risk ?? null,
        });
      }

      for (const alert of alerts as AlertRow[]) {
        const data = priceMap.get(alert.asset_id);
        if (!data) continue;

        let shouldTrigger = false;
        const threshold = Number(alert.threshold);

        switch (alert.alert_type) {
          case "price_above":
            shouldTrigger = data.price !== null && data.price >= threshold;
            break;
          case "price_below":
            shouldTrigger = data.price !== null && data.price <= threshold;
            break;
          case "score_above":
            shouldTrigger = data.score !== null && data.score >= threshold;
            break;
          case "score_below":
            shouldTrigger = data.score !== null && data.score <= threshold;
            break;
          case "risk_above":
            shouldTrigger = data.risk !== null && data.risk >= threshold;
            break;
        }

        if (shouldTrigger) {
          const { error: updateError } = await supabase
            .from("alerts")
            .update({
              is_active: false,
              triggered_at: new Date().toISOString(),
            })
            .eq("id", alert.id);

          if (updateError) {
            console.error(`Failed to mark alert ${alert.id} as triggered:`, updateError.message);
          } else {
            triggeredIds.push(alert.id);
            alertsTriggered++;
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        assets_updated: assetsUpdated,
        symbols: symbolsUpdated,
        alerts_checked: alerts?.length ?? 0,
        alerts_triggered: alertsTriggered,
        triggered_ids: triggeredIds,
        checked_at: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
