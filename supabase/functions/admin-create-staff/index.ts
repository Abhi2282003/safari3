// Edge function: admin-create-staff
// Creates a Supabase auth user (username@tickets.local + padded PIN password),
// then inserts user_roles ('staff') and staff_members rows. Only callable by admins.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Missing authorization" }, 401);

    // Verify caller is admin
    const caller = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userErr } = await caller.auth.getUser();
    if (userErr || !user) return json({ error: "Not authenticated" }, 401);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: roles } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);
    const isAdmin = (roles || []).some((r: { role: string }) => r.role === "admin");
    if (!isAdmin) return json({ error: "Forbidden — admin only" }, 403);

    const { username, full_name, pin } = await req.json();
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username || "")) return json({ error: "Invalid username" }, 400);
    if (!/^\d{4}$/.test(pin || "")) return json({ error: "PIN must be 4 digits" }, 400);
    if (!full_name || typeof full_name !== "string") return json({ error: "Full name required" }, 400);

    const email = `${username.toLowerCase()}@tickets.local`;
    const password = `pin_${pin}_secure`;

    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, username: username.toLowerCase() },
    });
    if (createErr || !created.user) return json({ error: createErr?.message || "Failed to create user" }, 400);

    const newUserId = created.user.id;

    // Assign staff role
    const { error: roleErr } = await admin.from("user_roles").insert({ user_id: newUserId, role: "staff" });
    if (roleErr) return json({ error: `Role insert failed: ${roleErr.message}` }, 500);

    // Create staff_members record
    const { error: smErr } = await admin.from("staff_members").insert({
      user_id: newUserId,
      username: username.toLowerCase(),
      full_name,
      created_by: user.id,
    });
    if (smErr) return json({ error: `Staff insert failed: ${smErr.message}` }, 500);

    return json({ ok: true, user_id: newUserId });
  } catch (e) {
    return json({ error: (e as Error).message || "Unexpected error" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
