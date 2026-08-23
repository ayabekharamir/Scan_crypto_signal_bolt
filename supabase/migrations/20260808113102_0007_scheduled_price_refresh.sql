/*
# Scheduled Price Refresh (Cron Job)

## Overview
This migration sets up automatic, scheduled price refreshes using the
pg_cron and pg_net PostgreSQL extensions. Every five minutes, the database
calls the "scheduled-refresh" edge function, which:
  1. Fetches live prices from CoinGecko for all active crypto assets.
  2. Stores price snapshots in the database.
  3. Checks all active alerts against the latest prices/scores/risk.
  4. Triggers any alerts whose thresholds have been met.

## Extensions
- pg_cron: PostgreSQL job scheduler (runs SQL on a schedule).
- pg_net: Async HTTP client (lets PostgreSQL make HTTP requests).

## Scheduled Job
- Job name: refresh-prices-job
- Schedule: every five minutes
- Action: HTTP POST to the scheduled-refresh edge function

## Security
- The cron job runs with elevated privileges.
- The HTTP request uses the anon key, safe for the public edge function.
- No new tables or RLS policies are created.
*/

-- Enable extensions

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA cron;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Drop existing job if it exists (idempotent)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'refresh-prices-job') THEN
    PERFORM cron.unschedule('refresh-prices-job');
  END IF;
END $$;

-- Schedule the job: POST to the scheduled-refresh edge function every five minutes
SELECT cron.schedule(
  'refresh-prices-job',
  '*/5 * * * *',
  $$
    SELECT net.http_post(
      url := (
        SELECT current_setting('app.supabase_url', true)
      ) || '/functions/v1/scheduled-refresh',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (
          SELECT current_setting('app.supabase_anon_key', true)
        )
      ),
      body := '{}'::jsonb
    );
  $$
);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA extensions TO postgres;
GRANT USAGE ON SCHEMA cron TO postgres;
