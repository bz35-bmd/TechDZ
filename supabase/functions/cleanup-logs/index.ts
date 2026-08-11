// TechDZ — cleanup-logs
// Archivage des connection_logs de plus de 90 jours
// (déplacement vers connection_logs_archive, puis suppression).
//
// Déploiement :
//   supabase functions deploy cleanup-logs --no-verify-jwt
//
// Planification via pg_cron (dashboard SQL) :
//   select cron.schedule('techdz-edge-cleanup-logs', '0 3 * * 0',
//     $$select net.http_post(
//       url := 'https://<ref>.supabase.co/functions/v1/cleanup-logs',
//       headers := jsonb_build_object('Authorization', 'Bearer <SERVICE_ROLE_KEY>')
//     )$$);
//
// Alternative sans Edge Function : voir supabase-activity-setup.sql
// (fonction public.cleanup_old_logs + pg_cron direct).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

Deno.serve(async () => {
  try {
    const { error } = await supabase.rpc("cleanup_old_logs", {
      keep_days: 90,
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
