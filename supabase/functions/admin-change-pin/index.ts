// Edge function: admin-change-pin
// Lets an admin change the PIN of existing logins (username@tickets.local).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")!;
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Missing authorization" }, 401);

    const caller = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: userErr } = await caller.auth.getUser();
    if (userErr || !user) return json({ error: "Not authenticated" }, 401);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", user.id);
    if (!(roles || []).some((r: { role: string }) => r.role === "admin")) return json({ error: "Forbidden — admin only" }, 403);

    const body = await req.json();
    const usernames: unknown = body?.usernames;
    const pin: unknown = body?.pin;
    if (!Array.isArray(usernames) || usernames.length === 0 || usernames.length > 50 ||
        !usernames.every((u) => typeof u === "string" && /^[a-zA-Z0-9_]{3,20}$/.test(u))) {
      return json({ error: "Invalid usernames" }, 400);
    }
    if (typeof pin !== "string" || !/^(\d{4}|\d{6})$/.test(pin)) return json({ error: "PIN must be 4 or 6 digits" }, 400);

    const { data: list, error: listErr } = await admin.auth.admin.listUsers({ page: 1, perPage: 500 });
    if (listErr) return json({ error: listErr.message }, 500);

    const results: Record<string, string> = {};
    for (const u of usernames as string[]) {
      const email = `${u.toLowerCase()}@tickets.local`;
      const found = list.users.find((x) => (x.email || "").toLowerCase() === email);
      if (!found) { results[u] = "not found"; continue; }
      const { error } = await admin.auth.admin.updateUserById(found.id, { password: `pin_${pin}_secure` });
      results[u] = error ? `error: ${error.message}` : "updated";
    }
    return json({ ok: true, results });
  } catch (e) {
    return json({ error: (e as Error).message || "Unexpected error" }, 500);
  }
});
