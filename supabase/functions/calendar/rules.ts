// Decides which nights someone is away for dinner, from calendar events.
export type Ev = { summary?: string; start: { date?: string; dateTime?: string }; end: { date?: string; dateTime?: string }; transparency?: string; status?: string };
export type Rule = { mode: "all" | "mine"; name: string; winStart: number; winEnd: number; tz: string; calName?: string };
export type Hit = { day: string; reason: string };

const EVENING = /\b(close|closer|closing|dbl|double|pm|p\.m\.|night|nights|late|swing|mid|overnight)\b/i;
const DAYTIME = /\b(open|opener|opening|am|a\.m\.|morning|brunch|lunch)\b/i;
const OFF = /\b(off|pto|vacation|req(uested)? off)\b/i;

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
export function nameSegment(summary: string, name: string): string | null {
  if (!name) return null;
  const re = new RegExp(`(^|[^a-z])${esc(name.toLowerCase())}([^a-z]|$)`, "i");
  const segs = summary.split(/\s*(?:\/|\||,|;|&|\+|\s-\s|\s–\s)\s*/).filter(Boolean);
  return segs.find((s) => re.test(s)) ?? (re.test(summary) ? summary : null);
}
/** For a shift title that mentions the person: true = working at dinner, false = home for dinner. */
export function shiftAway(seg: string): boolean {
  if (OFF.test(seg)) return false;
  if (EVENING.test(seg)) return true;
  if (DAYTIME.test(seg)) return false;
  return true; // just the name (or "Keith working") on an all-day schedule: assume a full day
}
function local(iso: string, tz: string) {
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date(iso)).map((x) => [x.type, x.value]));
  return { day: `${p.year}-${p.month}-${p.day}`, min: Number(p.hour) * 60 + Number(p.minute) };
}
function addDay(d: string, n = 1) { const t = new Date(d + "T12:00:00Z"); t.setUTCDate(t.getUTCDate() + n); return t.toISOString().slice(0, 10); }
const fmtT = (m: number) => { const h = Math.floor(m / 60) % 24, mm = m % 60; return `${h % 12 || 12}${mm ? ":" + String(mm).padStart(2, "0") : ""}${h < 12 ? "am" : "pm"}`; };

export function evaluate(ev: Ev, r: Rule): Hit[] {
  if (ev.status === "cancelled") return [];
  const title = (ev.summary || "").trim(); if (!title) return [];
  const seg = nameSegment(title, r.name);
  const out: Hit[] = [];
  if (ev.start.date) {
    // all-day entry (shift schedules, festivals, trips)
    let away: boolean;
    if (seg) away = shiftAway(seg);
    else if (r.mode === "all") away = !OFF.test(title);
    else return [];
    if (!away) return [];
    for (let d = ev.start.date; d < (ev.end.date || addDay(ev.start.date)); d = addDay(d)) out.push({ day: d, reason: title });
    return out;
  }
  if (!ev.start.dateTime || !ev.end.dateTime) return [];
  if (r.mode === "mine" && !seg) return [];
  if (ev.transparency === "transparent" && !seg) return [];
  if (seg && OFF.test(seg)) return [];
  const s = local(ev.start.dateTime, r.tz), e = local(ev.end.dateTime, r.tz);
  for (let d = s.day; d <= e.day; d = addDay(d)) {
    const a = d === s.day ? s.min : 0, b = d === e.day ? e.min : 1440;
    if (Math.min(b, r.winEnd) - Math.max(a, r.winStart) > 0) out.push({ day: d, reason: `${title} (${fmtT(s.min)}–${fmtT(e.min)})` });
    if (out.length > 31) break;
  }
  return out;
}
export const toMin = (hhmm: string) => { const [h, m] = (hhmm || "17:00").split(":").map(Number); return h * 60 + (m || 0); };
export const defaultWatch = (summary: string) => /work|schedule|mgmt|shift|booked|performance|gig|on.?call/i.test(summary);
