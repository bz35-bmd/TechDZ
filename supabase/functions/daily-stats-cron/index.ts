// TechDZ — daily-stats-cron
// Agrégat journalier des statistiques dans daily_stats.
//
// Déploiement :
//   supabase functions deploy daily-stats-cron --no-verify-jwt
//
// Planification via pg_cron (dashboard SQL) :
//   select cron.schedule('techdz-edge-daily-stats', '0 0 * * *',
//     $$select net.http_post(
//       url := 'https://<ref>.supabase.co/functions/v1/daily-stats-cron',
//       headers := jsonb_build_object('Authorization', 'Bearer <SERVICE_ROLE_KEY>')
//     )$$);
//
// Alternative sans Edge Function : voir supabase-activity-setup.sql
// (fonction public.compute_daily_stats + pg_cron direct).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

Deno.serve(async () => {
  try {
    const { error } = await supabase.rpc("compute_daily_stats", {
      target_date: null,
    });
    if (error) throw error;
    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: e.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
