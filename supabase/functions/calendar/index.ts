// We're Cooked calendar sync: reads Google Calendar (read-only) and marks nights people are away for dinner.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { evaluate, toMin, defaultWatch } from "./rules.ts";

const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...CORS, "Content-Type": "application/json" } });
const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
const DAYS_AHEAD = 28;

async function accessToken(refresh: string) {
  const id = Deno.env.get("GOOGLE_CLIENT_ID"), secret = Deno.env.get("GOOGLE_CLIENT_SECRET");
  if (!id || !secret) throw new Error("SETUP: add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET secrets in Supabase (Edge Functions › Secrets).");
  const r = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ client_id: id, client_secret: secret, refresh_token: refresh, grant_type: "refresh_token" }) });
  const j = await r.json();
  if (!r.ok) throw new Error(j.error === "invalid_grant" ? "RECONNECT: Google access expired or was removed. Reconnect your calendar." : `Google sign-in error: ${j.error_description || j.error}`);
  return j.access_token as string;
}
async function g(token: string, path: string) {
  const r = await fetch(`https://www.googleapis.com/calendar/v3${path}`, { headers: { authorization: `Bearer ${token}` } });
  const j = await r.json();
  if (!r.ok) throw new Error(j.error?.status === "PERMISSION_DENIED" ? "SETUP: turn on the Google Calendar API in your Google Cloud project." : `Google Calendar error: ${j.error?.message || r.status}`);
  return j;
}
async function listCalendars(token: string) {
  const j = await g(token, "/users/me/calendarList?minAccessRole=reader&maxResults=250");
  return (j.items || []).filter((c: any) => !/#holiday@|#contacts@|#weather@/.test(c.id)).map((c: any) => ({ id: c.id, summary: c.summaryOverride || c.summary, role: c.accessRole, primary: !!c.primary, tz: c.timeZone }));
}
function mergeCalendars(found: any[], saved: any[]) {
  return found.map((c) => { const s = saved.find((x) => x.id === c.id); return { id: c.id, summary: c.summary, role: c.role, primary: c.primary, watch: s ? !!s.watch : defaultWatch(c.summary), mode: s?.mode || (c.role === "owner" ? "all" : "mine") }; });
}

async function syncLink(link: any) {
  try {
    const token = await accessToken(link.refresh_token);
    const today = new Date(); const from = new Date(today.getTime() - 36e5 * 24), to = new Date(today.getTime() + 864e5 * DAYS_AHEAD);
    const rule = { name: (link.match_name || "").trim(), winStart: toMin(link.dinner_start), winEnd: toMin(link.dinner_end), tz: link.tz || "America/New_York" };
    const hits = new Map<string, { day: string; reason: string; calendar: string }>();
    for (const c of (link.calendars || []).filter((x: any) => x.watch)) {
      const q = new URLSearchParams({ timeMin: from.toISOString(), timeMax: to.toISOString(), singleEvents: "true", orderBy: "startTime", maxResults: "500" });
      const j = await g(token, `/calendars/${encodeURIComponent(c.id)}/events?${q}`);
      for (const ev of j.items || []) for (const h of evaluate(ev, { ...rule, mode: c.mode })) { const k = h.day; if (!hits.has(k)) hits.set(k, { ...h, calendar: c.summary }); }
    }
    const start = new Intl.DateTimeFormat("en-CA", { timeZone: rule.tz }).format(from);
    await admin.from("calendar_busy").delete().eq("user_id", link.user_id).gte("day", start);
    const rows = [...hits.values()].filter((h) => h.day >= start).map((h) => ({ household_id: link.household_id, user_id: link.user_id, day: h.day, reason: h.reason.slice(0, 200), calendar: h.calendar }));
    if (rows.length) { const r = await admin.from("calendar_busy").insert(rows); if (r.error) throw r.error; }
    await admin.from("calendar_links").update({ last_sync: new Date().toISOString(), last_error: null }).eq("user_id", link.user_id);
    return { nights: rows.length };
  } catch (e) {
    await admin.from("calendar_links").update({ last_sync: new Date().toISOString(), last_error: (e as Error).message.replace(/^(SETUP|RECONNECT): /, "").slice(0, 300) }).eq("user_id", link.user_id);
    return { error: (e as Error).message.replace(/^(SETUP|RECONNECT): /, "") };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    const body = await req.json().catch(() => ({}));
    // scheduled run (pg_cron, every 2 hours)
    const sent = req.headers.get("x-cron-secret");
    const { data: cfg } = sent ? await admin.from("app_config").select("value").eq("key", "cron_token").maybeSingle() : { data: null };
    if (sent && cfg?.value && sent === cfg.value) {
      const { data } = await admin.from("calendar_links").select("*");
      const res = []; for (const l of data || []) res.push(await syncLink(l));
      return json({ synced: res.length });
    }
    const jwt = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
    const { data: u } = await admin.auth.getUser(jwt);
    if (!u?.user) return json({ error: "Please sign in again." }, 401);
    const uid = u.user.id;
    const { data: me } = await admin.from("members").select("household_id, display_name").eq("user_id", uid).maybeSingle();
    if (!me) return json({ error: "Join a household first." }, 400);
    const action = body.action as string;

    if (action === "connect") {
      if (!body.refresh_token) return json({ error: "Google didn't send calendar access. Try connecting again." }, 400);
      const token = await accessToken(body.refresh_token);
      const found = await listCalendars(token);
      const { data: old } = await admin.from("calendar_links").select("calendars, match_name").eq("user_id", uid).maybeSingle();
      const primary = found.find((c: any) => c.primary);
      const row = { user_id: uid, household_id: me.household_id, refresh_token: body.refresh_token, google_email: primary?.id || u.user.email, calendars: mergeCalendars(found, old?.calendars || []),
        match_name: old?.match_name || (me.display_name || "").split(/\s+/)[0], tz: primary?.tz || "America/New_York" };
      const r = await admin.from("calendar_links").upsert(row); if (r.error) throw r.error;
      const s = await syncLink({ ...row, dinner_start: "17:00", dinner_end: "20:00" });
      return json({ ok: true, calendars: row.calendars, ...s });
    }
    const { data: link } = await admin.from("calendar_links").select("*").eq("user_id", uid).maybeSingle();

    if (action === "refresh_list") {
      if (!link) return json({ error: "Not connected" }, 400);
      const found = await listCalendars(await accessToken(link.refresh_token));
      const calendars = mergeCalendars(found, link.calendars || []);
      await admin.from("calendar_links").update({ calendars }).eq("user_id", uid);
      return json({ calendars });
    }
    if (action === "sync") {
      // sync everyone linked in my household (at most every 20 minutes unless forced)
      const { data: links } = await admin.from("calendar_links").select("*").eq("household_id", me.household_id);
      const res: any[] = [];
      for (const l of links || []) { if (!body.force && l.last_sync && Date.now() - new Date(l.last_sync).getTime() < 20 * 60e3) continue; res.push(await syncLink(l)); }
      return json({ synced: res.length, results: res });
    }
    if (action === "disconnect") {
      if (link) {
        await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(link.refresh_token)}`, { method: "POST" }).catch(() => {});
        await admin.from("calendar_busy").delete().eq("user_id", uid);
        await admin.from("calendar_links").delete().eq("user_id", uid);
      }
      return json({ ok: true });
    }
    return json({ error: "Unknown action" }, 400);
  } catch (e) {
    const m = (e as Error).message;
    return json({ error: m.replace(/^(SETUP|RECONNECT): /, ""), code: m.startsWith("SETUP") ? "SETUP" : m.startsWith("RECONNECT") ? "RECONNECT" : undefined }, 500);
  }
});
