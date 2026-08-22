import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

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

    // Fetch all active alerts
    const { data: alerts, error: alertError } = await supabase
      .from("alerts")
      .select("id, user_id, asset_id, alert_type, threshold, message, is_active")
      .eq("is_active", true)
      .is("triggered_at", null);

    if (alertError) throw alertError;
    if (!alerts || alerts.length === 0) {
      return new Response(
        JSON.stringify({ message: "No active alerts to check", triggered: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get latest price for each asset referenced in alerts
    const assetIds = [...new Set(alerts.map((a: AlertRow) => a.asset_id))];
    const priceMap = new Map<string, { price: number | null; score: number | null; risk: number | null }>();

    for (const assetId of assetIds) {
      // Latest price
      const { data: priceData } = await supabase
        .from("price_snapshots")
        .select("price_usd")
        .eq("asset_id", assetId)
        .order("recorded_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      // Latest score
      const { data: scoreData } = await supabase
        .from("asset_scores")
        .select("confidence_score")
        .eq("asset_id", assetId)
        .order("computed_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      // Latest risk
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

    // Check each alert against its threshold
    const triggeredAlerts: string[] = [];
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
          triggeredAlerts.push(alert.id);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        alerts_checked: alerts.length,
        alerts_triggered: triggeredAlerts.length,
        triggered_ids: triggeredAlerts,
        checked_at: new Date().toISOString(),
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
