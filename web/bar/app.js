{
// Back Home Bar — shares sign-in, households, members, shopping lists and spending with We're Cooked.
const SUPABASE_URL = 'https://iticnrxdxykvgwoueqtk.supabase.co';
const SUPABASE_KEY = 'sb_publishable_JyHvBjN_1lfvcjsLfX2ybQ_lnU67nP_';
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'pkce' } });
const IS_APP = !!(window.Android && window.Android.openExternal);
const WEB_HOME = 'https://nychawg.github.io/werecooked/bar/';

// ---------- helpers ----------
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = n => String(n).padStart(2, '0');
const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const parseYmd = s => { const [y, m, d] = String(s).split('-').map(Number); return new Date(y, m - 1, d); };
const today = () => ymd(new Date());
const daysUntil = d => Math.round((parseYmd(d) - parseYmd(today())) / 864e5);
const money = n => '$' + (Math.round(Number(n || 0) * 100) / 100).toFixed(2);
const hashStr = s => { let h = 0; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) | 0; return Math.abs(h); };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lsGet = (k, d) => { try { return localStorage.getItem(k) ?? d; } catch (_) { return d; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch (_) { } };
const toast = msg => { document.querySelectorAll('.toast').forEach(t => t.remove()); const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; document.body.appendChild(t); setTimeout(() => t.remove(), 3200); };
const fail = e => { console.error(e); toast(e?.message || 'Something went wrong. Try again.'); };
const first = m => esc((m?.display_name || '').split(' ')[0]);
const FR = [[0, ''], [0.125, '⅛'], [0.25, '¼'], [0.33, '⅓'], [0.5, '½'], [0.67, '⅔'], [0.75, '¾'], [1, '']];
function frac(q) {
  if (q == null || isNaN(q)) return '';
  const n = Math.round(q * 100) / 100, w = Math.floor(n + 1e-9), f = n - w;
  const best = FR.reduce((a, b) => Math.abs(b[0] - f) < Math.abs(a[0] - f) ? b : a);
  if (Math.abs(best[0] - f) > 0.04) return String(n);
  const whole = best[0] === 1 ? w + 1 : w;
  return (whole ? whole : '') + best[1] || '0';
}
const nice = (n, step = 1) => { const v = Math.round(n / step) * step; return Math.round(v * 100) / 100; };

// ---------- icons ----------
const ICONS = {
  home: '<path d="M3 11 12 4l9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  bar: '<path d="M7 3h3v4l1 2v12H6V9l1-2zM14 6h3v3l1 2v10h-5V11l1-2z"/>',
  specs: '<path d="M4 4h12l-5 7v6l3 2v1H6v-1l3-2v-6zM15 4l5-1M18 3v4"/>',
  prep: '<path d="M7 3h10M8 3v3a5 5 0 0 0-3 4.6V19a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8.4A5 5 0 0 0 16 6V3M6 13h12"/>',
  host: '<path d="M4 20h16M6 20V9l6-5 6 5v11M10 20v-5h4v5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>', search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>', sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>', scan: '<path d="M4 7V4h3M17 4h3v3M20 17v3h-3M7 20H4v-3M7 12h10"/>',
  cart: '<path d="M3 4h2l2.5 11h10L20 8H7"/><circle cx="9" cy="19" r="1.5"/><circle cx="17" cy="19" r="1.5"/>',
  calc: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 12h2M12 12h2M16 12h0M8 16h2M12 16h2M16 16h0"/>',
  spark: '<path d="M12 3l1.8 4.6L18 9l-4.2 1.4L12 15l-1.8-4.6L6 9l4.2-1.4zM18 15l.9 2.1L21 18l-2.1.9L18 21l-.9-2.1L15 18l2.1-.9z"/>',
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
  star: '<path d="m12 3 2.7 5.6 6.1.8-4.4 4.3 1 6.1L12 17l-5.4 2.8 1-6.1L3.2 9.4l6.1-.8z"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>', check: '<path d="m5 12 5 5 9-10"/>', edit: '<path d="M4 20h4l11-11-4-4L4 16z"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>', clock: '<circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/>',
};
const svg = (k, cls = '') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="${cls}">${ICONS[k] || ''}</svg>`;
const MARK = `<svg class="mark" viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" rx="16" fill="#15161B"/><path d="M15.5 24.5h31c-1.2 8.5-7.5 13.5-15.5 13.5s-14.3-5-15.5-13.5z" fill="#C8792C"/><path d="M13 20.5h36c-1.5 11.5-9 17.5-18 17.5s-16.5-6-18-17.5z" fill="none" stroke="#D9B76A" stroke-width="2.2" stroke-linejoin="round"/><path d="M31 38v11M24 50.5h14" stroke="#D9B76A" stroke-width="2.2" stroke-linecap="round"/><path d="M41 20.5c.8-3.6 3.6-5 5-3.3 1.5 1.8-1.2 3.5-1.9 1.4-.5-1.8 1.4-4.2 4.3-3.9" fill="none" stroke="#F28A1E" stroke-width="2" stroke-linecap="round"/></svg>`;

// glassware drawings for spec cards
const GLASS = {
  coupe: '<path d="M8 10h32c-1.5 9-8 13.5-16 13.5S9.5 19 8 10zM24 23.5V42M16 44h16"/>',
  nick: '<path d="M12 8h24c0 10-5 16-12 16S12 18 12 8zM24 24v18M17 44h14"/>',
  rocks: '<path d="M10 16h28l-2.5 26h-23zM12.5 30h23"/>',
  highball: '<path d="M14 6h20l-2 38H16zM15 20h18"/>',
  flute: '<path d="M18 4h12l-1.5 20a4.5 4.5 0 0 1-9 0zM24 28v14M18 44h12"/>',
  julep: '<path d="M12 12h24l-2 30H14zM12 12c4-5 20-5 24 0M30 4l-2 10"/>',
  tiki: '<path d="M14 6h20l-1 38H15zM18 16h3M27 16h3M19 26h10M20 32h8"/>',
  wine: '<path d="M14 6h20c0 12-4 18-10 18S14 18 14 6zM24 24v18M17 44h14"/>',
  mug: '<path d="M10 12h22v30H10zM32 18h4a4 4 0 0 1 4 4v6a4 4 0 0 1-4 4h-4"/>',
  hurricane: '<path d="M17 4h14c2 6-4 9-2 16s4 9 1 16H18c-3-7-1-9 1-16s-4-10-2-16zM24 36v6M17 44h14"/>',
  punch: '<path d="M10 14h28c0 8-6 14-14 14S10 22 10 14zM34 16a5 5 0 0 1 4 6"/>',
};
function glassKey(g) { g = String(g || '').toLowerCase();
  return /nick/.test(g) ? 'nick' : /coupe|cocktail|martini/.test(g) ? 'coupe' : /flute/.test(g) ? 'flute' : /julep/.test(g) ? 'julep' : /tiki|bowl/.test(g) ? 'tiki' : /hurricane|pilsner/.test(g) ? 'hurricane'
    : /mug|copper/.test(g) ? 'mug' : /punch cup|punch/.test(g) ? 'punch' : /wine|crusta|copa/.test(g) ? 'wine' : /highball|collins|fizz|pint/.test(g) ? 'highball' : 'rocks'; }
const glassSvg = (g, cls = 'gl') => `<svg class="${cls}" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${GLASS[glassKey(g)]}</svg>`;

// ---------- catalog ----------
let C = { styles: [], families: {}, fresh: [], preps: [], specs: [], bottles: [], cats: [] };
const STY = {}, FRESH = {}, PREP = {}, LSPEC = {};
async function loadCatalog() {
  const j = await fetch('data/catalog.json').then(r => r.json()); C = j;
  for (const s of j.styles) STY[s.id] = s;
  for (const f of j.fresh) FRESH[f.id] = f;
  for (const p of j.preps) PREP[p.id] = p;
  for (const s of j.specs) LSPEC[s.id] = s;
}
const famName = f => C.families[f]?.name || f;
const SPIRIT_CATS = ['Gin', 'Genever', 'Vodka', 'Rum', 'Tequila', 'Mezcal', 'Whiskey', 'Brandy'];
const OZ_ML = 30;  // bar convention: 1 oz ≈ 30 ml

// ---------- state ----------
const S = { session: null, me: null, household: null, members: [], bottles: [], preps: [], specs: [], meta: {}, events: [], gear: [], lists: [], list: [],
  tab: 'home', units: lsGet('bhb_units', 'oz'), barView: lsGet('bhb_barview', 'shelf'), barCat: '', barQ: '', specView: 'all', specFam: '', specBase: '', specQ: '',
  prepView: 'onhand', prepKind: '', prepQ: '', hostView: 'events', loaded: false };
const memberById = id => S.members.find(m => m.user_id === id);

// ---------- what you have ----------
const DEFAULT_FRESH = new Set(['Citrus', 'Pantry', 'Dairy & eggs', 'Condiments']);
const DEFAULT_STAPLE_STYLES = new Set(['mix-soda']);
const custom = () => S.household?.custom || {};
const stapleIn = id => (custom().bar_in || []).includes(id);
const stapleOut = id => (custom().bar_out || []).includes(id);
function freshHave(id) { if (stapleOut(id)) return false; if (stapleIn(id)) return true; return DEFAULT_FRESH.has(FRESH[id]?.group); }
const bottleOn = b => Number(b.fill_ml) > 0 || Number(b.sealed) > 0;
function styleHave(sid) { if (S.bottles.some(b => b.style_id === sid && bottleOn(b))) return true; if (STY[sid]?.cat === 'Mixers') return !stapleOut(sid) && (stapleIn(sid) || DEFAULT_STAPLE_STYLES.has(sid)); return false; }
function famHave(f) { return (C.families[f]?.styles || []).some(styleHave); }
const prepRows = pid => S.preps.filter(p => p.recipe_key === pid);
const prepExpired = p => p.expires_on && daysUntil(p.expires_on) < 0;
const prepLive = p => Number(p.qty_ml) > 0 && !prepExpired(p);
const prepHave = pid => prepRows(pid).some(prepLive);
const QUICK = new Set(['simple-syrup', 'rich-simple', 'demerara-syrup', 'demerara-simple', 'honey-syrup', 'honey-syrup-1-1', 'agave-syrup', 'maple-syrup-cut', 'brown-sugar-syrup', 'saline-20', 'cane-syrup']);
function prepMakeable(pid, depth = 0) {
  const p = PREP[pid]; if (!p || depth > 1) return false;
  return p.ings.every(i => !i.ref || i.ref.some(a => altOk(a, depth + 1).ok));
}
/** Can this alternative be poured? {ok, how: have|sub|make|quick, bottle} */
function altOk(a, depth = 0) {
  if (a.style) { if (styleHave(a.style)) return { ok: true, how: 'have', bottle: pickBottle(a) };
    const f = STY[a.style]?.fam; if (f && famHave(f)) return { ok: true, how: 'sub', bottle: pickBottle({ fam: f }) }; return { ok: false }; }
  if (a.fam) return famHave(a.fam) ? { ok: true, how: 'have', bottle: pickBottle(a) } : { ok: false };
  if (a.fresh) return freshHave(a.fresh) ? { ok: true, how: 'have' } : { ok: false };
  if (a.prep) { if (prepHave(a.prep)) return { ok: true, how: 'have', prep: prepRows(a.prep).find(prepLive) };
    if (QUICK.has(a.prep) && prepMakeable(a.prep, depth)) return { ok: true, how: 'quick' };
    return { ok: false, how: 'make' }; }
  return { ok: true, how: 'have' };
}
function pickBottle(a) {
  const live = S.bottles.filter(bottleOn);
  const sort = arr => arr.sort((x, y) => (Number(y.fill_ml) > 0) - (Number(x.fill_ml) > 0) || Number(y.fill_ml) - Number(x.fill_ml));
  if (a.style) { const ex = sort(live.filter(b => b.style_id === a.style)); if (ex.length) return ex[0]; a = { fam: STY[a.style]?.fam }; }
  if (a.fam) { const st = new Set(C.families[a.fam]?.styles || []); return sort(live.filter(b => st.has(b.style_id)))[0] || null; }
  return null;
}
function ingState(ing) {
  if (!ing.ref || !ing.ref.length) return { ok: true, free: true };
  let miss = null;
  for (const a of ing.ref) { const r = altOk(a); if (r.ok) return { ...r, alt: a }; if (!miss) miss = a; }
  return { ok: false, alt: miss, how: ing.ref.some(a => a.prep) && ing.ref.every(a => a.prep) ? 'make' : 'buy' };
}
function altName(a) {
  if (!a) return '';
  if (a.style) return STY[a.style]?.name || a.style; if (a.fam) return famName(a.fam);
  if (a.fresh) return FRESH[a.fresh]?.name || a.fresh; if (a.prep) return PREP[a.prep]?.name || a.prep; return '';
}
const ingLabel = ing => ing.t || altName(ing.ref?.[0]);
const fold = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const orNames = ing => (ing.ref || []).slice(1).map(altName);

// ---------- specs (library + yours) ----------
function mySpecs() { return S.specs.map(s => ({ id: 'c:' + s.id, row: s, name: s.name, family: s.family || 'Other', glass: s.glass || '', ice: s.ice || '', method: s.method || '', garnish: s.garnish || '', origin: s.parent_key ? `Riff on ${LSPEC[s.parent_key]?.name || 'a classic'}` : 'House spec', ings: s.ingredients || [], notes: s.notes ? [s.notes] : [], mine: true, parent: s.parent_key })); }
const allSpecs = () => [...mySpecs(), ...C.specs];
const specByKey = k => k?.startsWith('c:') ? mySpecs().find(s => s.id === k) : LSPEC[k];
const metaOf = k => S.meta[k] || {};
function specStatus(sp) {
  const rows = sp.ings.filter(i => i.ref?.length).map(i => ({ i, st: ingState(i) }));
  const isBitters = r => r.i.ref.some(a => (a.style || a.fam || '').startsWith('bitters'));
  // a second dash of bitters is a grace note: if another bitters in the spec is covered, pour without it
  const coreBitters = r => r.i.ref.some(a => /^bitters-(aromatic|peychaud|boker|creole)$/.test(a.style || '') || /^bitters-(aromatic|peychaud)$/.test(a.fam || ''));
  const optional = r => isBitters(r) && /^dash/.test(r.i.u) && (r.i.q || 1) <= 2 && (!coreBitters(r) || rows.some(o => o !== r && isBitters(o) && o.st.ok));
  const missing = rows.filter(r => !r.st.ok && !optional(r));
  return { ok: !missing.length, missing, quick: rows.filter(r => r.st.how === 'quick'), subs: rows.filter(r => r.st.how === 'sub'), rows };
}
const baseCache = new Map();
function baseOf(sp) {
  if (baseCache.has(sp.id)) return baseCache.get(sp.id);
  let best = null, bq = -1;
  for (const i of sp.ings) { const a = i.ref?.[0]; if (!a || i.u !== 'oz') continue; const st = a.style ? STY[a.style] : a.fam ? STY[C.families[a.fam]?.styles?.[0]] : null;
    if (st && SPIRIT_CATS.includes(st.cat) && (i.q || 0) > bq) { bq = i.q || 0; best = st.cat; } }
  const out = best === 'Genever' ? 'Gin' : best === 'Mezcal' ? 'Agave' : best === 'Tequila' ? 'Agave' : best || 'Low & other';
  baseCache.set(sp.id, out); return out;
}

// ---------- amounts ----------
function mlOf(q, u) { u = String(u || '').toLowerCase(); if (q == null) return 0;
  return u === 'oz' ? q * OZ_ML : u === 'ml' ? q : u === 'tsp' || /^barspoons?$/.test(u) ? q * 5 : u === 'tbsp' ? q * 15 : /^dash/.test(u) ? q * 0.8 : /^drops?$/.test(u) ? q * 0.05 : u === 'cl' ? q * 10 : /^bottles?$/.test(u) ? q * 750 : u === 'cup' || u === 'cups' ? q * 240 : 0; }
function amtText(ing, scale = 1) {
  if (ing.q == null) return ing.u === 'top' ? 'top' : '';
  const q = ing.q * scale, u = ing.u || '';
  if (u === 'oz') return S.units === 'ml' ? `${nice(q * OZ_ML, q * OZ_ML >= 20 ? 5 : 2.5)} ml` : `${frac(q)} oz`;
  if (u === 'ml' && S.units === 'oz') return `${frac(q / OZ_ML)} oz`;
  const label = { dash: q === 1 ? 'dash' : 'dashes', drops: q === 1 ? 'drop' : 'drops', drop: q === 1 ? 'drop' : 'drops', barspoon: q === 1 ? 'barspoon' : 'barspoons', leaves: 'leaves', whole: '', rinse: 'rinse', bottle: q === 1 ? 'bottle' : 'bottles' }[u] ?? u;
  return `${frac(q)}${label ? ' ' + label : ''}`;
}
const volText = ml => S.units === 'ml' ? `${Math.round(ml)} ml` : `${frac(nice(ml / OZ_ML, 0.25))} oz`;
const DILUTION = m => /stir/i.test(m) ? 0.22 : /shak|flash|blend/i.test(m) ? (/blend/i.test(m) ? 0.4 : 0.27) : /swizzl|crushed/i.test(m) ? 0.3 : /built|roll/i.test(m) ? 0.12 : 0.2;
function abvOfIng(i, st) {
  const a = st?.alt;
  if (st?.bottle && st.bottle.abv != null) return Number(st.bottle.abv);
  if (a?.style) { const r = STY[a.style]?.abv; return r ? (r[0] + r[1]) / 2 : 0; }
  if (a?.fam) { const r = STY[C.families[a.fam]?.styles?.[0]]?.abv; return r ? (r[0] + r[1]) / 2 : 0; }
  if (a?.prep) { const k = PREP[a.prep]?.kind; return k === 'infusion' || k === 'fat-wash' ? 40 : k === 'liqueur' ? 28 : k === 'clarified' ? 20 : k === 'bitters' || k === 'tincture' ? 45 : 0; }
  return 0;
}
/** ABV after dilution, standard drinks and cost for one serving. */
function drinkNumbers(sp) {
  let vol = 0, alc = 0, cost = 0, priced = true;
  for (const i of sp.ings) { const ml = mlOf(i.q, i.u); if (!ml) continue; const st = ingState(i); vol += ml; alc += ml * abvOfIng(i, st) / 100;
    if (st.bottle?.price && st.bottle.size_ml) cost += Number(st.bottle.price) / Number(st.bottle.size_ml) * ml; else if (abvOfIng(i, st) > 0) priced = false; }
  const d = DILUTION(sp.method), total = vol * (1 + d);
  return { vol, total, abv: total ? alc / total * 100 : 0, std: alc * 0.789 / 14, cost: priced && cost ? cost : null };
}

// ---------- low stock ----------
const fillPct = b => Number(b.size_ml) ? clamp(Number(b.fill_ml) / Number(b.size_ml), 0, 1) : 0;
function bottleLow(b) { const p = Number(b.par) || 0, open = Number(b.fill_ml) > 0 ? 1 : 0, sealed = Number(b.sealed) || 0;
  if (p > 0) return open + sealed < p || (sealed === 0 && fillPct(b) < 0.2); return false; }
const bottleRunningLow = b => !Number(b.sealed) && Number(b.fill_ml) > 0 && fillPct(b) < 0.15;


// ---------- load & save ----------
let quietUntil = 0;
async function loadAll() {
  const hid = S.household.id;
  const q = t => sb.from(t).select('*').eq('household_id', hid);
  const [mem, bt, pr, sp, me, ev, ge, ls] = await Promise.all([q('members').order('joined_at'), q('bar_bottles').order('name'), q('bar_preps').order('made_on', { ascending: false }),
    q('bar_specs').order('name'), q('bar_spec_meta'), q('bar_events').order('day'), q('bar_gear').order('name'), q('shopping_lists').order('created_at')]);
  for (const r of [mem, bt, pr, sp, me, ev, ge, ls]) if (r.error) throw r.error;
  S.members = mem.data; S.bottles = bt.data; S.preps = pr.data; S.specs = sp.data; S.events = ev.data; S.gear = ge.data; S.lists = ls.data;
  S.meta = Object.fromEntries(me.data.map(m => [m.spec_key, m]));
  const bl = barList();
  if (bl) { const li = await sb.from('shopping_items').select('*').eq('household_id', hid).eq('list_id', bl.id).order('created_at'); if (!li.error) S.list = li.data; } else S.list = [];
  S.loaded = true; baseCache.clear();
  scheduleListSync();
}
const barList = () => S.lists.find(l => l.name === 'Bar');
async function ensureBarList() {
  let l = barList(); if (l) return l;
  const r = await sb.from('shopping_lists').insert({ household_id: S.household.id, name: 'Bar', emoji: '🍸', created_by: S.session.user.id }).select().single();
  if (r.error) throw r.error; S.lists.push(r.data); return r.data;
}
async function addToList(items) {
  const l = await ensureBarList();
  const open = S.list.filter(x => !x.checked).map(x => x.name.toLowerCase());
  const rows = items.filter(it => !open.includes(it.name.toLowerCase())).map(it => ({ household_id: S.household.id, list_id: l.id, name: it.name.slice(0, 120), qty: it.qty || null, unit: it.unit || '', category: it.category || 'Drinks', source: it.source || 'manual', added_by: S.session.user.id }));
  if (!rows.length) return 0;
  quietUntil = Date.now() + 2500;
  const r = await sb.from('shopping_items').insert(rows).select(); if (r.error) throw r.error;
  S.list.push(...r.data); return rows.length;
}
/** Bottles with a par that run low go on the Bar list by themselves, and come off when restocked. */
let syncT, syncing = false;
const scheduleListSync = () => { clearTimeout(syncT); syncT = setTimeout(() => syncList().catch(console.error), 1200); };
async function syncList() {
  if (syncing || !S.household) return; syncing = true;
  try {
    const low = S.bottles.filter(bottleLow), names = new Set(low.map(b => b.name.toLowerCase()));
    const auto = S.list.filter(x => x.source === 'par' && !x.checked);
    const del = auto.filter(x => !names.has(x.name.toLowerCase()));
    const add = low.filter(b => !S.list.some(x => !x.checked && x.name.toLowerCase() === b.name.toLowerCase()));
    if (!del.length && !add.length) return;
    quietUntil = Date.now() + 3000;
    if (del.length) { await sb.from('shopping_items').delete().in('id', del.map(x => x.id)); S.list = S.list.filter(x => !del.includes(x)); }
    if (add.length) await addToList(add.map(b => ({ name: b.name, qty: Math.max(1, (Number(b.par) || 1) - (Number(b.sealed) || 0)), unit: 'bottle', source: 'par' })));
    softRender();
  } finally { syncing = false; }
}
async function setCustom(patch) {
  const c = { ...custom(), ...patch };
  const r = await sb.from('households').update({ custom: c }).eq('id', S.household.id); if (r.error) throw r.error; S.household.custom = c;
}
async function toggleStaple(id, on) {
  const def = FRESH[id] ? DEFAULT_FRESH.has(FRESH[id].group) : DEFAULT_STAPLE_STYLES.has(id);
  const inn = new Set(custom().bar_in || []), out = new Set(custom().bar_out || []);
  inn.delete(id); out.delete(id); if (on && !def) inn.add(id); if (!on && def) out.add(id);
  await setCustom({ bar_in: [...inn], bar_out: [...out] });
}
async function saveMeta(key, patch) {
  const row = { household_id: S.household.id, spec_key: key, ...metaOf(key), ...patch }; delete row.created_at;
  quietUntil = Date.now() + 2500;
  const r = await sb.from('bar_spec_meta').upsert(row, { onConflict: 'household_id,spec_key' }).select().single(); if (r.error) throw r.error; S.meta[key] = r.data || row;
}

// ---------- keep the screen still (taps, scroll rows, background refreshes) ----------
const SCROLLERS = '.shelf,.chips.scroll,.mini,[data-sk]';
const scrollMem = new Map(), restoredEls = new WeakSet();
const scrollBase = el => el.dataset.sk || (el.id ? '#' + el.id : String(el.className).split(' ')[0] + '|' + (el.getAttribute('aria-label') || ''));
const scrollKey = el => { const b = scrollBase(el); if (el.dataset.sk || el.id) return b; return b + '|' + [...document.querySelectorAll(SCROLLERS)].filter(x => scrollBase(x) === b).indexOf(el); };
document.addEventListener('scroll', e => { const el = e.target; if (el instanceof Element && el.matches(SCROLLERS)) scrollMem.set(scrollKey(el), [el.scrollLeft, Date.now()]); }, { capture: true, passive: true });
function restoreScroll(root) { for (const el of root.querySelectorAll(SCROLLERS)) { if (restoredEls.has(el)) continue; restoredEls.add(el); const m = scrollMem.get(scrollKey(el)); if (m && Date.now() - m[1] < 120000) { el.style.scrollSnapType = 'none'; el.scrollLeft = m[0]; requestAnimationFrame(() => { el.scrollLeft = m[0]; el.style.scrollSnapType = ''; }); } } }
let lastInput = 0, softT, tapAnchor = null;
for (const ev of ['pointerdown', 'touchstart', 'keydown', 'wheel', 'scroll']) document.addEventListener(ev, () => { lastInput = Date.now(); }, { capture: true, passive: true });
document.addEventListener('pointerdown', e => { const t = e.target instanceof Element && e.target.closest('main button, main input, main a');
  const attrs = t ? [...t.attributes].filter(a => a.name.startsWith('data-') || a.name === 'id').map(a => `[${a.name}="${CSS.escape(a.value)}"]`).join('') : '';
  tapAnchor = attrs ? { sel: t.tagName.toLowerCase() + attrs, at: Date.now() } : null; }, { capture: true, passive: true });
const anchorTop = () => { if (!tapAnchor || Date.now() - tapAnchor.at > 4000) return null; const el = $('main')?.querySelector(tapAnchor.sel); return el ? el.getBoundingClientRect().top : null; };
function softRender() { clearTimeout(softT); if ($('.sheet')) return; const typing = document.activeElement && /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName);
  if (Date.now() - lastInput < 1500 || typing) { softT = setTimeout(softRender, 700); return; } render(); }

// ---------- shell ----------
const TABS = [['home', 'Home'], ['bar', 'Back bar'], ['specs', 'Specs'], ['prep', 'Prep'], ['host', 'Host']];
const isDark = () => { const t = lsGet('bhb_theme', 'dark'); return t === 'dark' || (t === 'system' && matchMedia('(prefers-color-scheme: dark)').matches); };
function setTheme(t) { lsSet('bhb_theme', t); document.documentElement.style.colorScheme = t === 'system' ? 'light dark' : t; render(); }
function shell(inner) {
  return `<header class="top">${MARK}<div class="brand"><b>Back Home Bar</b><i>${esc(S.household?.name || '')}</i></div><span class="sp"></span>
    <button class="hbtn" data-act="theme" aria-label="${isDark() ? 'Switch to light' : 'Switch to dark'}">${svg(isDark() ? 'sun' : 'moon')}</button>
    <button class="hbtn" data-act="household" aria-label="Household and settings">${svg('user')}</button></header>
    <main id="main">${inner}</main>
    <nav class="tabs" aria-label="Sections">${TABS.map(([k, l]) => `<button data-tab="${k}" aria-current="${S.tab === k}">${svg(k)}${l}</button>`).join('')}</nav>`;
}
function render() {
  const app = $('#app');
  if (!S.session) return authView();
  if (!S.household) return onboardView();
  if (!S.loaded) { app.innerHTML = `<main><div class="spin"></div></main>`; return; }
  const v = { home: homeView, bar: barView, specs: specsView, prep: prepView, host: hostView }[S.tab]();
  const y = $('#main')?.scrollTop || 0, top0 = anchorTop();
  app.innerHTML = shell(v);
  const main = $('#main'); main.scrollTop = y; restoreScroll(app);
  if (top0 != null) { const t1 = anchorTop(); if (t1 != null) main.scrollTop += t1 - top0; }
  for (const [id, key] of [['#bq', 'barQ'], ['#sq', 'specQ'], ['#pq', 'prepQ'], ['#hq', 'homeQ']]) { const el = $(id); if (el) el.oninput = e => { S[key] = e.target.value; const pos = e.target.selectionStart; render(); const n = $(id); n.focus(); n.setSelectionRange(pos, pos); }; }
}

// ---------- home: your bartender ----------
/** Technique, the way a head bartender would teach it on a slow Tuesday. */
const TIPS = [
  ['Shake like you mean it', 'Ten to twelve hard seconds, tins full of ice. You\'re chilling, diluting and aerating all at once. When the tin frosts over and hurts to hold, you\'re there.'],
  ['Stir until it sings', 'Stirred drinks want 20 to 30 seconds with a barspoon riding the inside of the glass. Taste it off the spoon: it should be cold and silky, never watery.'],
  ['Shake citrus, stir spirits', 'Juice, cream or egg in the drink? Shake it. All spirits, vermouth and bitters? Stir it, so it stays clear and heavy on the tongue.'],
  ['The dry shake', 'For egg white sours, shake everything without ice first to whip the foam, then add ice and shake again. Some bars reverse it: shake with ice, strain, dump the ice, shake again. Both work.'],
  ['Express, don\'t just garnish', 'Hold the peel skin-side down over the drink and pinch. That mist of oil is the first thing your guest smells. Rub the rim, then decide if it goes in.'],
  ['Juice it fresh, every time', 'Bottled lime juice is the fastest way to ruin a Daiquiri. Lime is best 4 to 8 hours after squeezing and falls off a cliff after a day.'],
  ['Build in the small tin', 'Pour the cheapest ingredients first: citrus, syrup, then the spirit. If you mess up the measure, you lose lime juice, not your good rye.'],
  ['Ice is an ingredient', 'Wet, cloudy freezer ice melts fast and waters a drink. Use big, dry cubes for shaking and stirring, and a fresh cube in the glass. Never reuse shaking ice.'],
  ['Chill the glass', 'A drink served up starts warming the second it\'s poured. Park coupes in the freezer, or fill them with ice and water while you build.'],
  ['Balance is a seesaw', 'Most sours are 2 parts spirit, ¾ part sour, ¾ part sweet. If it\'s too tart, add a quarter ounce of syrup; too sweet, a quarter of citrus. Adjust in quarters.'],
  ['Salt is the secret', 'Two drops of 20% saline in a sour or a Margarita makes the fruit brighter and the bitterness rounder. Nobody tastes salt; they taste a better drink.'],
  ['Measure. Always.', 'The best bartenders in New York still jigger every pour. Free-pouring is a party trick; consistency is the craft.'],
  ['Rich syrup for stirred drinks', '2:1 syrup sweetens with less water, which matters in an Old Fashioned. Swap ¾ oz simple for ½ oz rich and keep the same sweetness.'],
  ['Vermouth is wine', 'Once it\'s open, it oxidizes. Keep vermouth in the fridge and finish it in about a month. Flat, brown vermouth is why people think they hate Manhattans.'],
  ['Taste before you pour', 'Dip a straw and taste every drink before it leaves your hands. It takes three seconds and catches the missing syrup, the extra lime, the wrong bottle.'],
  ['The rinse', 'For a Sazerac, pour a little absinthe in a chilled glass, swirl to coat, dump the rest. You want the aroma, not the flavor.'],
  ['Strain twice for up drinks', 'Hawthorne strainer over the tin, fine strainer over the glass. No ice shards, no mint bits, just a clean, velvety pour.'],
  ['Long drinks: build in the glass', 'Highballs are built over ice with cold soda poured down a barspoon. One gentle lift to mix: stirring kills the bubbles.'],
  ['Know your proof', 'A 100-proof spirit stands up to citrus and dilution better than an 80. That\'s why bartenders love bottled-in-bond whiskey for sours.'],
  ['Bitters are the salt and pepper', 'A dash or two ties sweet and strong together. An Old Fashioned without bitters is just sweet whiskey.'],
  ['Muddle gently', 'Mint wants to be pressed, not shredded. Bruise it and you get bitter chlorophyll. Citrus and cucumber can take more muscle.'],
  ['Batch the night before', 'For parties, batch spirits, syrups and bitters ahead. Add citrus within 4 hours and shake to order. Stirred drinks can be fully batched with water and frozen.'],
  ['The swizzle', 'Pack the glass with crushed ice, then spin a swizzle stick between your palms until the outside frosts. Top with more ice and a dash of bitters.'],
  ['Read the drink\'s family', 'Learn the templates, not 500 recipes. A Sidecar, a Margarita and a Cosmo are the same drink: spirit, orange liqueur, citrus.'],
  ['Split the base', 'Half rye, half cognac. Half mezcal, half tequila. Splitting the spirit adds depth without a single new ingredient. It\'s how the Vieux Carré was born.'],
  ['Garnish with purpose', 'Every garnish should add aroma or flavor. An orange peel on a Negroni: yes. A sad maraschino skewer on a Martini: no.'],
  ['Temperature beats everything', 'A perfectly balanced drink served lukewarm tastes worse than a sloppy one served ice cold. Cold is the first rule.'],
  ['Egg whites, not eggs', 'One white (about ¾ oz) foams two sours. Keep a carton of pasteurized whites in the fridge, or use aquafaba for a vegan foam.'],
  ['Sherry is your friend', 'A quarter ounce of fino or amontillado makes a Martini or Old Fashioned taste expensive. Low-proof, high-flavor, cheap.'],
  ['Clean as you go', 'Rinse your tins and spoon between drinks. Lime in your Manhattan is how you lose regulars.'],
];
/** Every NYC bartender worth their bitters can make these blindfolded. */
const CANON = ['old-fashioned', 'manhattan', 'martini', 'negroni', 'daiquiri', 'margarita', 'whiskey-sour', 'sidecar', 'mojito', 'tom-collins', 'gimlet', 'french-75', 'sazerac', 'mai-tai', 'last-word',
  'paper-plane', 'penicillin', 'bees-knees', 'boulevardier', 'moscow-mule', 'mint-julep', 'espresso-martini', 'aviation', 'pisco-sour', 'clover-club', 'corpse-reviver-2', 'vieux-carre', 'ramos-gin-fizz', 'jungle-bird', 'paloma'];
const METHOD_TIP = { shaken: 'Hard shake, 10–12 seconds, then fine-strain.', stirred: 'Stir 25–30 seconds in a chilled mixing glass, strain over clean ice or up.', built: 'Build in the glass over good ice, one gentle lift.', swizzled: 'Swizzle in crushed ice until the glass frosts.', 'flash-blended': 'Flash-blend 5 seconds, or shake hard with crushed ice and dump.', blended: 'Blend until smooth, serve immediately.', rolled: 'Roll between two tins to mix without foaming.' };
/** The moment: time of day and season shape what a good bartender would pour you. */
function moment() {
  const h = new Date().getHours(), mo = new Date().getMonth(), dow = new Date().getDay();
  const season = [11, 0, 1].includes(mo) ? 'winter' : [5, 6, 7].includes(mo) ? 'summer' : [2, 3, 4].includes(mo) ? 'spring' : 'fall';
  if (h < 11) return { key: 'brunch', label: dow === 0 || dow === 6 ? 'Weekend brunch' : 'Morning', fams: ['Highball', 'Champagne', 'Fizz', 'Spritz'], names: ['bloody-mary', 'mimosa', 'bellini', 'ramos-gin-fizz', 'espresso-martini', 'red-snapper', 'garibaldi', 'irish-coffee'], why: 'Something bright and easy to start the day.' };
  if (h < 16) return { key: 'day', label: 'Afternoon', fams: ['Highball', 'Spritz', 'Sour', 'Julep', 'Cobbler'], why: season === 'summer' ? 'It\'s hot out: tall, cold and refreshing.' : 'Daytime drinking calls for something light.' };
  if (h < 19) return { key: 'aperitivo', label: 'Aperitivo hour', fams: ['Martini', 'Spritz', 'Highball'], names: ['negroni', 'americano', 'aperol-spritz', 'bamboo', 'martini', 'adonis', 'white-negroni', 'campari-spritz'], why: 'Before dinner: bitter, dry and appetite-waking.' };
  if (h < 22) return { key: 'evening', label: 'Tonight', fams: season === 'summer' ? ['Tiki', 'Sour', 'Highball', 'Swizzle'] : season === 'winter' ? ['Old Fashioned', 'Manhattan', 'Flip', 'Hot', 'Sour'] : ['Sour', 'Old Fashioned', 'Manhattan', 'Martini', 'Tiki'], why: season === 'winter' ? 'A cold night wants something brown and stirred, or a warm one.' : season === 'summer' ? 'Summer night: break out the tiki mugs.' : 'Prime time. Make the good stuff.' };
  return { key: 'nightcap', label: 'Nightcap', fams: ['Old Fashioned', 'Manhattan', 'Flip', 'Duo'], names: ['old-fashioned', 'vieux-carre', 'sazerac', 'black-manhattan', 'stinger', 'brandy-alexander', 'toronto', 'rusty-nail', 'godfather'], why: 'Last call at home: slow, strong and stirred.' };
}
const dayKey = () => Math.floor(Date.now() / 864e5);
function tonightsPour(can, skip = 0) {
  const m = moment();
  const scored = can.map(sp => { const me = metaOf(sp.id); let s = 0;
    if (m.names?.includes(sp.id)) s += 40; if (m.fams.includes(sp.family)) s += 25; if (me.favorite) s += 15; s += (me.rating || 0) * 4;
    if (me.last_made && daysUntil(me.last_made) > -2) s -= 30; if (!me.made_count && CANON.includes(sp.id)) s += 8;   // nudge toward learning the canon
    s += (hashStr(sp.id + dayKey() + m.key) % 20); return { sp, s }; }).sort((a, b) => b.s - a.s);
  return { pick: scored.length ? scored[skip % scored.length].sp : null, m };
}
function ringSvg(n, total) { const r = 28, c = 2 * Math.PI * r, f = total ? n / total : 0;
  return `<svg class="ring" viewBox="0 0 68 68" aria-hidden="true"><circle cx="34" cy="34" r="${r}" fill="none" stroke="var(--sunk)" stroke-width="7"/><circle cx="34" cy="34" r="${r}" fill="none" stroke="var(--brass)" stroke-width="7" stroke-linecap="round" stroke-dasharray="${(c * f).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 34 34)"/><text x="34" y="40" text-anchor="middle">${n}</text></svg>`; }
const greet = () => { const h = new Date().getHours(), n = first(S.me);
  return h < 11 ? `Morning, ${n}. Coffee first, then the bar.` : h < 16 ? `Afternoon, ${n}. Too early? Never too early to prep.` : h < 19 ? `Evening, ${n}. Aperitivo hour.` : h < 22 ? `Evening, ${n}. The bar is open.` : `Late one, ${n}. Something stirred?`; };
function unlocks(st) {
  const unlock = new Map();
  for (const x of st) if (x.s.missing.length === 1) { const a = x.s.missing[0].i.ref[0], key = a.prep ? 'prep:' + a.prep : a.style ? 'fam:' + (STY[a.style]?.fam || a.style) : a.fam ? 'fam:' + a.fam : 'fresh:' + a.fresh;
    const cur = unlock.get(key) || { key, a: a.style ? { fam: STY[a.style]?.fam } : a, n: 0, names: [] }; cur.n++; cur.names.push(x.sp.name); unlock.set(key, cur); }
  return [...unlock.values()].sort((a, b) => b.n - a.n);
}
const COMMON = ['old-fashioned', 'manhattan', 'martini', 'negroni', 'margarita', 'daiquiri', 'whiskey-sour', 'mojito', 'moscow-mule', 'gin-and-tonic', 'paloma', 'espresso-martini',
  'aperol-spritz', 'cosmopolitan', 'french-75', 'tom-collins', 'gimlet', 'sidecar', 'boulevardier', 'mai-tai', 'last-word', 'penicillin', 'bloody-mary', 'dark-and-stormy'];
function homeView() {
  const h = new Date().getHours(), hi = h < 12 ? 'Morning' : h < 17 ? 'Afternoon' : 'Evening';
  const specs = allSpecs(), can = specs.filter(sp => specStatus(sp).ok);
  const live = S.bottles.filter(bottleOn), low = S.bottles.filter(b => bottleLow(b) || bottleRunningLow(b) || (!bottleOn(b) && Number(b.par) > 0));
  const soon = S.preps.filter(p => Number(p.qty_ml) > 0 && p.expires_on && daysUntil(p.expires_on) <= 3).sort((a, b) => a.expires_on.localeCompare(b.expires_on));
  const q = fold(S.homeQ || '').trim();
  const found = q.length >= 2 ? specs.filter(sp => fold(sp.name).includes(q) || sp.ings.some(i => fold(ingLabel(i)).includes(q))).sort((a, b) => fold(b.name).startsWith(q) - fold(a.name).startsWith(q) || specStatus(b).ok - specStatus(a).ok).slice(0, 8) : [];
  const common = COMMON.map(k => LSPEC[k]).filter(Boolean).map(sp => ({ sp, ok: specStatus(sp).ok }));
  const shown = S.homeReady ? common.filter(x => x.ok) : common;
  const cats = C.cats.map(c => [c, S.bottles.filter(b => STY[b.style_id]?.cat === c)]).filter(x => x[1].length);
  const ordered = cats.flatMap(([, bs]) => bs);
  const next = S.events.filter(e => e.day && daysUntil(e.day) >= 0).sort((a, b) => a.day.localeCompare(b.day))[0];
  return `<div class="hello"><div class="eyebrow">${new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</div><h2 style="font-size:28px">${hi}, ${first(S.me)}</h2></div>
  <div class="search">${svg('search')}<input type="search" id="hq" placeholder="Find a cocktail or ingredient" value="${esc(S.homeQ || '')}" aria-label="Find a cocktail" autocomplete="off"></div>
  ${q.length >= 2 ? `<div class="card" style="margin-bottom:6px">${found.length ? found.map(sp => `<button class="tap item" data-spec="${esc(sp.id)}"><span style="width:28px;flex:none;color:var(--brass)">${glassSvg(sp.glass, 'gl')}</span><span class="grow"><span class="iname">${esc(sp.name)}</span><span class="imeta" style="display:block">${esc(sp.family)}</span></span>${specStatus(sp).ok ? '<span class="pill ok">Ready</span>' : ''}</button>`).join('') : '<p class="imeta" style="margin:4px 0">No cocktails match.</p>'}</div>` : ''}
  <div class="stats" style="margin-top:4px"><button class="stat tap" data-act="cannow"><b>${can.length}</b><span>Ready to pour</span></button><button class="stat tap" data-tab="bar"><b>${live.length}</b><span>Bottles</span></button><button class="stat tap" data-act="lowlist"><b style="${low.length ? 'color:var(--ox)' : ''}">${low.length}</b><span>Running low</span></button></div>
  <div class="row" style="margin:20px 0 6px"><h3 style="margin:0" class="sp">Your shelves</h3><button class="lnk" data-tab="bar">Back bar ›</button></div>
  ${S.bottles.length ? `<div class="ministrip" data-sk="homeshelf" aria-label="Your bottles">${ordered.map(b => `<button class="mb${bottleLow(b) ? ' low' : ''}" data-bottle="${b.id}" aria-label="${esc(b.name)}, ${Math.round(fillPct(b) * 100)}% full">${bottleVisual(b, true)}<span>${esc(b.name.split(' ').slice(0, 2).join(' '))}</span></button>`).join('')}<button class="mb add" data-act="addbottle" aria-label="Add a bottle"><span class="plus">+</span><span>Add</span></button></div>
    <div class="chips" style="margin-top:10px">${cats.map(([c, bs]) => `<button class="chip" data-gocat="${esc(c)}">${esc(c)} <span class="muted">${bs.length}</span></button>`).join('')}</div>`
  : `<div class="card flat"><p class="imeta" style="margin:0 0 10px">Add your bottles to see what you can pour.</p><div class="row"><button class="btn sm" data-act="scanshelf">${svg('camera')} Snap your shelf</button><button class="btn sm ghost" data-act="addbottle">Add by name</button><button class="btn sm ghost" data-act="barcode">${svg('scan')} Barcode</button></div></div>`}
  <div class="row" style="margin:22px 0 8px"><h3 style="margin:0" class="sp">Classics</h3><div class="seg" style="width:150px" role="group" aria-label="Show"><button data-homeready="0" aria-pressed="${!S.homeReady}">All</button><button data-homeready="1" aria-pressed="${!!S.homeReady}">Ready</button></div></div>
  ${shown.length ? `<div class="cgrid">${shown.map(({ sp, ok }) => `<button class="ctile${ok ? '' : ' off'}" data-spec="${esc(sp.id)}">${glassSvg(sp.glass, 'gl')}<b>${esc(sp.name)}</b><span>${ok ? '<i class="dot olive"></i>Ready' : `Need ${esc(altName(specStatus(sp).missing[0]?.i.ref[0]))}`}</span></button>`).join('')}</div>` : '<p class="imeta">None of the classics are ready yet. Tap All to see what each one needs.</p>'}
  <button class="lnk" data-tab="specs" style="display:block;margin-top:10px">All ${specs.length} specs ›</button>
  ${low.length ? `<h3>Running low</h3><div class="card">${low.slice(0, 6).map(b => `<button class="tap item" data-bottle="${b.id}"><span style="width:20px;flex:none">${bottleVisual(b, true)}</span><span class="grow"><span class="iname">${esc(b.name)}</span><span class="fillbar" style="margin-top:6px"><i style="width:${Math.round(fillPct(b) * 100)}%;background:var(--ox)"></i></span></span><span class="imeta">${bottleOn(b) ? Math.round(fillPct(b) * 100) + '%' : 'Out'}</span></button>`).join('')}${low.length > 6 ? `<button class="lnk" data-act="lowlist" style="margin-top:8px">${low.length - 6} more ›</button>` : ''}</div>` : ''}
  ${soon.length ? `<h3>Use soon</h3><div class="card">${soon.map(p => `<button class="tap item" data-prep="${p.id}"><span class="grow"><span class="iname">${esc(p.name)}</span><span class="imeta" style="display:block">${volText(Number(p.qty_ml))} left</span></span><span class="pill ${daysUntil(p.expires_on) < 0 ? 'bad' : 'warn'}">${daysUntil(p.expires_on) < 0 ? 'Past date' : daysUntil(p.expires_on) === 0 ? 'Today' : daysUntil(p.expires_on) + 'd'}</span></button>`).join('')}</div>` : ''}
  ${next ? `<h3>Next up</h3><button class="tap card" data-event="${next.id}"><span class="eyebrow">${daysUntil(next.day) === 0 ? 'Tonight' : daysUntil(next.day) === 1 ? 'Tomorrow' : `In ${daysUntil(next.day)} days`}</span><b style="display:block;font:700 19px var(--serif)">${esc(next.name)}</b><span class="imeta">${next.guests ? `${next.guests} guests · ` : ''}${(next.drinks || []).length} drinks</span></button>` : ''}
  <div class="qgrid" style="margin-top:22px">
    <button class="q" data-act="addbottle">${svg('plus')}Add bottle</button>
    <button class="q" data-act="barcode">${svg('scan')}Barcode</button>
    <button class="q" data-act="batchcalc">${svg('calc')}Batch</button>
    <button class="q" data-act="ask">${svg('spark')}Ask</button></div>`;
}
// ---------- ask your bartender ----------
const chat = [];
function askSheet(q0 = '') {
  const draw = () => `<div class="row" style="flex-wrap:nowrap"><span class="av" style="width:42px;height:42px;border-radius:50%;display:grid;place-items:center;background:var(--brassbg);color:var(--brassd);font:800 18px var(--serif);flex:none">B</span><div><h2 style="font-size:24px">Your bartender</h2><p class="imeta" style="margin:0">25 years behind NYC bars. Knows your shelf.</p></div></div>
    <div class="chat">${chat.length ? chat.map(c => `<div class="msg ${c.who}">${esc(c.text)}</div>${c.drinks?.length ? `<div class="chips">${c.drinks.map(d => `<button class="chip" data-spec="${esc(d.id)}">${esc(d.name)} ›</button>`).join('')}</div>` : ''}`).join('') : `<div class="msg bt">What are we drinking? Ask me anything: what to make with what you've got, how to fix a drink, a substitute, a technique, a menu for Saturday.</div>`}</div>
    <form id="askf" class="row" style="flex-wrap:nowrap;gap:8px"><input type="text" id="askq" placeholder="Ask your bartender…" value="${esc(q0)}" autocomplete="off" aria-label="Your question"><button class="btn" type="submit" aria-label="Send">${svg('spark')}</button></form>`;
  sheet(draw(), (el) => {
    const go = async q => { q = q.trim(); if (!q) return; chat.push({ who: 'me', text: q }); chat.push({ who: 'bt', text: '…' }); redraw(el, draw()); bind();
      try {
        const bar = S.bottles.filter(bottleOn).map(b => `${b.name}${STY[b.style_id] ? ` (${STY[b.style_id].name})` : ''}`);
        const out = await ai('bartender', { question: q, history: chat.slice(0, -2).slice(-8).map(c => ({ role: c.who === 'me' ? 'user' : 'assistant', text: c.text })), bar, preps: S.preps.filter(prepLive).map(p => p.name), units: S.units, can_make: allSpecs().filter(sp => specStatus(sp).ok).map(sp => sp.name).slice(0, 120) });
        const drinks = (out.drinks || []).map(n => allSpecs().find(sp => fold(sp.name) === fold(n))).filter(Boolean);
        chat[chat.length - 1] = { who: 'bt', text: out.answer || 'Hm. Ask me that another way?', drinks };
      } catch (er) { chat[chat.length - 1] = { who: 'bt', text: `Couldn't reach the back right now (${er.message}). Try again in a minute.` }; }
      redraw(el, draw()); bind(); const box = el.querySelector('[role=dialog]'); box.scrollTop = box.scrollHeight; };
    const bind = () => { el.querySelector('#askf').onsubmit = e => { e.preventDefault(); const v = el.querySelector('#askq').value; el.querySelector('#askq').value = ''; go(v); }; };
    el.addEventListener('click', e => { const t = e.target.closest('[data-spec]'); if (t) { el.remove(); specSheet(t.dataset.spec); } });
    bind(); if (q0) { el.querySelector('#askq').value = ''; go(q0); }
  });
}

// ---------- back bar ----------
const LIQ = { Gin: '#CFE6EC', Genever: '#E8D9A8', Vodka: '#E7EEF2', Rum: '#9B5A2A', Tequila: '#E6D493', Mezcal: '#DCCF9E', Whiskey: '#B7651F', Brandy: '#8E4519', Liqueur: '#C9853A', Anise: '#D8E6C8', Amaro: '#6A1D1A', Vermouth: '#6B2A22', 'Fortified wine': '#7C3A14', Bitters: '#5A1C12', 'Other spirits': '#E5E0D2', 'Wine & beer': '#D7BE5E', Mixers: '#E3EEF0' };
const LIQ_BY_STYLE = { 'liq-green-chartreuse': '#8DBF3A', 'liq-chartreuse-alt': '#8DBF3A', 'liq-yellow-chartreuse': '#E1C341', 'liq-maraschino': '#EFEDE5', 'liq-triple-sec': '#F2EEE2', 'liq-blue-curacao': '#2E7FC0', 'liq-cassis': '#40102A', 'liq-cherry': '#6E0F1F',
  'liq-violette': '#7A5BA8', 'liq-menthe-green': '#2FA35A', 'liq-menthe-white': '#EEF2EE', 'liq-cacao-white': '#F0ECE2', 'liq-elderflower': '#F2EAC0', 'liq-coffee': '#2A140A', 'liq-coffee-dry': '#2A140A', 'liq-irish-cream': '#D9C3A0', 'liq-galliano': '#E9C53A',
  'liq-melon': '#7ACB4B', 'liq-limoncello': '#F2E35A', 'amaro-aperol': '#F0682B', 'amaro-red-bitter': '#C2142B', 'amaro-gentian': '#E8D66A', 'verm-dry': '#EEE6C4', 'verm-dry-extra': '#EEE6C4', 'verm-blanc': '#F1E5BE', 'verm-americano': '#E9C978', 'verm-quinquina-blanc': '#ECD27A',
  'fort-fino': '#EADFA8', 'fort-manzanilla': '#EADFA8', 'anise-absinthe': '#9CC16A', 'rum-spanish-white': '#EEF0EC', 'rum-agricole-blanc': '#F0F0E8', 'rum-cachaca-branca': '#F0F0E8', 'rum-jamaican-overproof': '#F0F0E8', 'rum-overproof-white': '#F0F0E8', 'rum-clairin': '#F0F0E8',
  'tequila-blanco': '#F1EEDF', 'tequila-blanco-highland': '#F1EEDF', 'tequila-blanco-still': '#F1EEDF', 'mezcal-espadin': '#F1EEDF', 'mezcal-ensamble': '#F1EEDF', 'whiskey-corn': '#F1EDE0', 'brandy-kirsch': '#F1F1EC', 'brandy-poire': '#F1F1EC', 'brandy-grappa': '#F1F1EC' };
// generic bottle silhouettes (52×120): body path, cap [x,y,w,h], label [x,y,w,h], top of the liquid
const SHAPES = {
  tall: { name: 'Tall', d: 'M19 4h14v14c0 4 8 6 8 14v82a4 4 0 0 1-4 4H15a4 4 0 0 1-4-4V32c0-8 8-10 8-14z', cap: [19, 0, 14, 6], top: 30 },
  tallsquare: { name: 'Tall square', d: 'M21 6h10v12h7a3 3 0 0 1 3 3v93a4 4 0 0 1-4 4H15a4 4 0 0 1-4-4V21a3 3 0 0 1 3-3h7z', cap: [20, 0, 12, 8], top: 20 },
  square: { name: 'Square shoulder', d: 'M20 4h12v14c0 2 2 4 6 4h4a2 2 0 0 1 2 2v90a4 4 0 0 1-4 4H10a4 4 0 0 1-4-4V24a2 2 0 0 1 2-2h4c4 0 6-2 6-4z', cap: [19, 0, 14, 6], top: 24 },
  apothecary: { name: 'Apothecary', d: 'M19 12h14v6c8 2 12 6 12 14v82a4 4 0 0 1-4 4H11a4 4 0 0 1-4-4V32c0-8 4-12 12-14z', cap: [15, 0, 22, 12], top: 30, round: true },
  squat: { name: 'Squat', d: 'M20 4h12v18c0 3 12 5 12 14v78a4 4 0 0 1-4 4H12a4 4 0 0 1-4-4V36c0-9 12-11 12-14z', cap: [19, 0, 14, 6], top: 34 },
  round: { name: 'Round', d: 'M21 4h10v24c10 3 14 10 14 20v66a4 4 0 0 1-4 4H11a4 4 0 0 1-4-4V48c0-10 4-17 14-20z', cap: [20, 0, 12, 6], top: 40 },
  decanter: { name: 'Decanter', d: 'M22 6h8v26c12 4 16 14 16 30v52a4 4 0 0 1-4 4H10a4 4 0 0 1-4-4V62c0-16 4-26 16-30z', cap: [19, 0, 14, 8], top: 46, round: true },
  flask: { name: 'Flask', d: 'M21 4h10v12c0 2 4 3 8 5 3 2 5 5 5 10v83a4 4 0 0 1-4 4H12a4 4 0 0 1-4-4V31c0-5 2-8 5-10 4-2 8-3 8-5z', cap: [20, 0, 12, 6], top: 30 },
  stout: { name: 'Stout', d: 'M20 30h12v8c10 2 13 6 13 14v62a4 4 0 0 1-4 4H11a4 4 0 0 1-4-4V52c0-8 3-12 13-14z', cap: [19, 24, 14, 7], top: 50 },
  jug: { name: 'Jug', d: 'M20 18h12v8c8 2 13 8 13 18v70a4 4 0 0 1-4 4H11a4 4 0 0 1-4-4V44c0-10 5-16 13-18z', cap: [19, 12, 14, 7], top: 44, handle: true },
  bell: { name: 'Bell', d: 'M21 4h10v26c0 10 14 22 14 50v34a4 4 0 0 1-4 4H11a4 4 0 0 1-4-4V80c0-28 14-40 14-50z', cap: [20, 0, 12, 6], top: 46 },
  cone: { name: 'Cone', d: 'M22 6h8v18l12 90a4 4 0 0 1-4 4H14a4 4 0 0 1-4-4l12-90z', cap: [21, 0, 10, 7], top: 30 },
  slim: { name: 'Slim', d: 'M22 4h8v30c0 3 9 6 9 14v66a4 4 0 0 1-4 4H17a4 4 0 0 1-4-4V48c0-8 9-11 9-14z', cap: [21, 0, 10, 6], top: 46 },
  longneck: { name: 'Long neck', d: 'M23 4h6v48c0 4 10 6 10 16v46a4 4 0 0 1-4 4H17a4 4 0 0 1-4-4V68c0-10 10-12 10-16z', cap: [22, 0, 8, 6], top: 66 },
  wine: { name: 'Wine', d: 'M22 4h8v36c0 6 10 8 10 18v56a4 4 0 0 1-4 4H16a4 4 0 0 1-4-4V58c0-10 10-12 10-18z', cap: [21, 0, 10, 8], top: 56 },
  dasher: { name: 'Bitters dasher', d: 'M23 44h6v10c0 2 7 4 7 10v50a4 4 0 0 1-4 4H20a4 4 0 0 1-4-4V64c0-6 7-8 7-10z', cap: [22, 38, 8, 6], top: 62 },
};
const SHAPE_BY_CAT = { Gin: ['tall', 'tallsquare', 'apothecary', 'square', 'longneck'], Genever: ['tallsquare', 'apothecary'], Vodka: ['tall', 'tallsquare', 'longneck', 'square'],
  Whiskey: ['squat', 'square', 'decanter', 'flask', 'round', 'stout'], Brandy: ['decanter', 'round', 'bell', 'squat'], Rum: ['round', 'squat', 'stout', 'jug', 'tall'],
  Tequila: ['round', 'bell', 'cone', 'stout', 'square'], Mezcal: ['stout', 'round', 'jug', 'cone'], Liqueur: ['slim', 'longneck', 'apothecary', 'cone', 'bell', 'square'], Anise: ['slim', 'tall', 'square'],
  Amaro: ['slim', 'longneck', 'tall', 'apothecary'], Vermouth: ['wine', 'longneck'], 'Fortified wine': ['wine', 'decanter'], Bitters: ['dasher'], 'Wine & beer': ['wine'], Mixers: ['longneck', 'tall'], 'Other spirits': ['tall', 'round', 'slim'] };
function bottleShape(b) { if (b.shape && SHAPES[b.shape]) return b.shape; const opts = SHAPE_BY_CAT[STY[b.style_id]?.cat] || ['slim', 'tall', 'round']; return opts[hashStr(b.name || '') % opts.length]; }
function bottleSvg(b, cls = '') {
  const sh = SHAPES[bottleShape(b)], shape = sh.d, col = LIQ_BY_STYLE[b.style_id] || LIQ[STY[b.style_id]?.cat] || '#C9853A', f = fillPct(b), id = 'c' + String(b.id || b.name).replace(/[^a-z0-9]/gi, '').slice(0, 16);
  const topY = sh.top, botY = 118, y = botY - (botY - topY) * f, [cx, cy, cw, ch] = sh.cap, ly = Math.max(topY + 12, 76);
  return `<svg viewBox="0 0 52 120" class="${cls}" aria-hidden="true"><defs><clipPath id="${id}"><path d="${shape}"/></clipPath></defs>
    ${sh.handle ? `<path d="M45 52c6 0 6 22 0 22" fill="none" style="stroke:light-dark(rgba(60,45,25,.55),rgba(255,255,255,.35))" stroke-width="2.4"/>` : ''}
    <path d="${shape}" style="fill:light-dark(rgba(255,255,255,.55),rgba(255,255,255,.07))"/>
    <rect x="0" y="${y.toFixed(1)}" width="52" height="${(botY - y + 4).toFixed(1)}" fill="${col}" clip-path="url(#${id})" opacity=".92"/>
    <rect x="0" y="${y.toFixed(1)}" width="52" height="2" fill="rgba(255,255,255,.35)" clip-path="url(#${id})"/>
    <rect x="12" y="${ly}" width="28" height="20" rx="2" style="fill:light-dark(#F7F1E3,#E9DFC8)" opacity=".92" clip-path="url(#${id})"/>
    <path d="M17 ${ly + 7}h18M19 ${ly + 12}h14" stroke="#7B6A4E" stroke-width="1.4" stroke-linecap="round" clip-path="url(#${id})"/>
    <path d="${shape}" fill="none" style="stroke:light-dark(rgba(60,45,25,.55),rgba(255,255,255,.35))" stroke-width="1.4"/>
    ${sh.round ? `<ellipse cx="${cx + cw / 2}" cy="${cy + ch / 2}" rx="${cw / 2}" ry="${ch / 2}" style="fill:light-dark(#5B4A33,#8C7650)"/>` : `<rect x="${cx}" y="${cy}" width="${cw}" height="${ch}" rx="1.5" style="fill:light-dark(#5B4A33,#8C7650)"/>`}</svg>`;
}
/** Your own photo of the bottle when you've taken one, otherwise the drawn silhouette. */
function bottleVisual(b, small = false) {
  if (!b.photo_url) return bottleSvg(b);
  return `<span class="bph${small ? ' sm' : ''}"><img src="${esc(b.photo_url)}" alt="" loading="lazy"><i style="height:${Math.round(fillPct(b) * 100)}%"></i></span>`;
}
const shapeChip = (k, on) => `<button type="button" class="shp" data-shape="${k}" aria-pressed="${on}" aria-label="${k ? SHAPES[k].name : 'Automatic'}">${k ? `<svg viewBox="0 0 52 120"><path d="${SHAPES[k].d}" fill="none" stroke="currentColor" stroke-width="3"/></svg>` : '<b>Auto</b>'}</button>`;
function barView() {
  const q = S.barQ.trim().toLowerCase();
  const match = b => !q || b.name.toLowerCase().includes(q) || (STY[b.style_id]?.name || '').toLowerCase().includes(q);
  const list = S.bottles.filter(b => match(b) && (!S.barCat || STY[b.style_id]?.cat === S.barCat || (!STY[b.style_id] && S.barCat === 'Other spirits')));
  const cats = C.cats.filter(c => S.bottles.some(b => STY[b.style_id]?.cat === c));
  const groups = cats.map(c => [c, list.filter(b => STY[b.style_id]?.cat === c)]).filter(g => g[1].length);
  const loose = list.filter(b => !STY[b.style_id]); if (loose.length) groups.push(['Other', loose]);
  const fullCount = S.bottles.filter(bottleOn).length, lowN = S.bottles.filter(bottleLow).length;
  const head = `<div class="row"><h2 class="sp">Back bar</h2><button class="btn sm" data-act="addbottle">${svg('plus')} Add</button></div>
  <p class="lede">${fullCount} bottle${fullCount === 1 ? '' : 's'} open or sealed${lowN ? ` · <b style="color:var(--ox)">${lowN} low</b>` : ''}</p>
  <div class="seg" role="group" aria-label="View"><button data-barview="shelf" aria-pressed="${S.barView === 'shelf'}">Shelves</button><button data-barview="list" aria-pressed="${S.barView === 'list'}">List</button><button data-barview="fresh" aria-pressed="${S.barView === 'fresh'}">Fresh &amp; mixers</button></div>`;
  if (S.barView === 'fresh') return head + freshView();
  if (!S.bottles.length) return head + `<div class="card flat" style="margin-top:14px;text-align:center"><p style="font:700 20px var(--serif);margin:6px 0">An empty back bar</p><p class="imeta">Snap your shelf and the AI lists every bottle it can read, or search 1,200+ bottles by name.</p><div class="row" style="justify-content:center;margin-top:12px"><button class="btn sm" data-act="scanshelf">${svg('camera')} Scan shelf</button><button class="btn sm ghost" data-act="addbottle">Search bottles</button></div></div>`;
  const filters = `<div class="search">${svg('search')}<input type="search" id="bq" placeholder="Search your bottles" value="${esc(S.barQ)}" aria-label="Search your bottles"></div>
  <div class="chips scroll" aria-label="Categories"><button class="chip" data-barcat="" aria-pressed="${!S.barCat}">All</button>${cats.map(c => `<button class="chip" data-barcat="${esc(c)}" aria-pressed="${S.barCat === c}">${esc(c)}</button>`).join('')}</div>`;
  if (S.barView === 'list') return head + filters + groups.map(([c, bs]) => `<h3>${esc(c)} <span class="imeta" style="font-family:var(--sans);font-weight:500">· ${bs.length}</span></h3><div class="card">${bs.map(b => `<button class="tap item" data-bottle="${b.id}">
      <span style="width:26px;flex:none">${bottleVisual(b, true)}</span><span class="grow"><span class="iname">${esc(b.name)}</span><span class="imeta" style="display:block">${esc(STY[b.style_id]?.name || 'Unlisted style')}${b.abv ? ` · ${b.abv}%` : ''}</span>
      <span class="fillbar" style="margin-top:6px"><i style="width:${Math.round(fillPct(b) * 100)}%;${bottleLow(b) ? 'background:var(--ox)' : ''}"></i></span></span>
      <span class="imeta" style="text-align:right;white-space:nowrap">${Number(b.fill_ml) > 0 ? Math.round(fillPct(b) * 100) + '%' : 'Empty'}${Number(b.sealed) ? `<br>+${b.sealed} sealed` : ''}</span></button>`).join('')}</div>`).join('') || '<p class="imeta">Nothing matches.</p>';
  return head + filters + groups.map(([c, bs]) => `<div class="shelfset"><div class="shelfhead"><b>${esc(c)}</b><span class="imeta">${bs.length}</span></div>
    <div class="shelf" data-sk="shelf:${esc(c)}" aria-label="${esc(c)} shelf">${bs.map(b => `<button class="btl${bottleLow(b) ? ' low' : ''}" data-bottle="${b.id}" aria-label="${esc(b.name)}, ${Math.round(fillPct(b) * 100)}% full">${bottleVisual(b)}${Number(b.sealed) ? `<span class="bx">+${b.sealed}</span>` : ''}<span class="bn">${esc(b.name)}</span></button>`).join('')}
    <button class="btl add" data-act="addbottle" data-cat="${esc(c)}" aria-label="Add to ${esc(c)}"><svg viewBox="0 0 52 120"><path d="${SHAPES.slim.d}" fill="none" stroke="currentColor" stroke-dasharray="4 4" opacity=".5"/><path d="M26 68v16M18 76h16" stroke="currentColor" stroke-width="2"/></svg><span class="bn muted">Add</span></button></div></div>`).join('') || '<p class="imeta">Nothing matches.</p>';
}
function freshView() {
  const groups = {}; for (const f of C.fresh) (groups[f.group] = groups[f.group] || []).push(f);
  const mixers = C.styles.filter(s => s.cat === 'Mixers');
  const row = (id, name, have, note) => `<label class="item" style="margin:0;color:var(--ink);font-size:15px;font-weight:500;cursor:pointer"><input type="checkbox" data-staple="${esc(id)}" ${have ? 'checked' : ''} style="width:22px;height:22px;accent-color:var(--brass)"><span class="grow"><span class="iname">${esc(name)}</span>${note ? `<span class="imeta" style="display:block">${esc(note)}</span>` : ''}</span></label>`;
  return `<p class="imeta" style="margin:12px 0 4px">Tick what's in the fridge and pantry. Citrus, sugar, eggs and dairy count as on hand unless you untick them.</p>
    <h3>Mixers</h3><div class="card">${mixers.map(m => row(m.id, m.name, styleHave(m.id), '')).join('')}</div>
    ${Object.entries(groups).map(([g, fs]) => `<h3>${esc(g)}</h3><div class="card">${fs.map(f => row(f.id, f.name, freshHave(f.id), f.keeps ? 'Keeps ' + f.keeps : '')).join('')}</div>`).join('')}`;
}

// ---------- specs ----------
const FAMS = ['Sour', 'Old Fashioned', 'Manhattan', 'Martini', 'Highball', 'Fizz', 'Tiki', 'Champagne', 'Spritz', 'Julep', 'Swizzle', 'Cobbler', 'Sling', 'Flip', 'Punch', 'Hot', 'Duo'];
const BASES = ['Gin', 'Whiskey', 'Rum', 'Agave', 'Brandy', 'Vodka', 'Low & other'];
function specsView() {
  const q = fold(S.specQ).trim();
  let list = allSpecs().map(sp => ({ sp, s: specStatus(sp), m: metaOf(sp.id) }));
  if (q) list = list.filter(x => fold(x.sp.name).includes(q) || x.sp.ings.some(i => fold(ingLabel(i)).includes(q)) || fold(x.sp.origin).includes(q));
  if (S.specFam) list = list.filter(x => x.sp.family === S.specFam);
  if (S.specBase) list = list.filter(x => baseOf(x.sp) === S.specBase);
  const counts = { all: list.length, can: list.filter(x => x.s.ok).length, one: list.filter(x => x.s.missing.length === 1).length, fav: list.filter(x => x.m.favorite).length, mine: list.filter(x => x.sp.mine).length };
  if (S.specView === 'can') list = list.filter(x => x.s.ok); else if (S.specView === 'one') list = list.filter(x => x.s.missing.length === 1); else if (S.specView === 'fav') list = list.filter(x => x.m.favorite); else if (S.specView === 'mine') list = list.filter(x => x.sp.mine);
  list.sort((a, b) => (b.s.ok - a.s.ok) || (a.s.missing.length - b.s.missing.length) || (b.m.favorite ? 1 : 0) - (a.m.favorite ? 1 : 0) || a.sp.name.localeCompare(b.sp.name));
  const status = x => x.s.ok ? (x.s.quick.length ? `<span class="pill ok">Ready · stir up ${esc(altName(x.s.quick[0].st.alt || x.s.quick[0].i.ref[0]))}</span>` : '<span class="pill ok">Ready</span>')
    : x.s.missing.length === 1 ? `<span class="pill warn">Need ${esc(altName(x.s.missing[0].i.ref[0]))}</span>` : `<span class="pill">Missing ${x.s.missing.length}</span>`;
  return `<div class="row"><h2 class="sp">Specs</h2><button class="btn sm" data-act="newspec">${svg('plus')} Add</button></div>
  <p class="lede">${counts.can} ready to pour from ${allSpecs().length}</p>
  <div class="search">${svg('search')}<input type="search" id="sq" placeholder="Search drinks, ingredients, bartenders" value="${esc(S.specQ)}" aria-label="Search specs"></div>
  <div class="chips scroll" aria-label="Show">${[['all', 'All'], ['can', 'Can make'], ['one', 'One away'], ['fav', 'Favorites'], ['mine', 'House specs']].map(([k, l]) => `<button class="chip" data-specview="${k}" aria-pressed="${S.specView === k}">${l} <span class="muted">${counts[k]}</span></button>`).join('')}</div>
  <div class="chips scroll" aria-label="Base spirit"><button class="chip" data-specbase="" aria-pressed="${!S.specBase}">Any spirit</button>${BASES.map(b => `<button class="chip" data-specbase="${esc(b)}" aria-pressed="${S.specBase === b}">${esc(b)}</button>`).join('')}</div>
  <div class="chips scroll" aria-label="Family"><button class="chip" data-specfam="" aria-pressed="${!S.specFam}">Every style</button>${FAMS.map(f => `<button class="chip" data-specfam="${esc(f)}" aria-pressed="${S.specFam === f}">${esc(f)}</button>`).join('')}</div>
  <div class="sgrid" style="margin-top:6px">${list.slice(0, 300).map(x => `<button class="scard" data-spec="${esc(x.sp.id)}">${glassSvg(x.sp.glass)}<span style="flex:1;min-width:0"><b>${esc(x.sp.name)}${x.m.favorite ? ' <span style="color:var(--brass)">★</span>' : ''}</b><span class="imeta" style="display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(x.sp.family)} · ${esc(x.sp.ings.filter(i => i.ref?.length && i.u === 'oz').slice(0, 3).map(ingLabel).join(', '))}</span><span style="display:block;margin-top:5px">${status(x)}</span></span></button>`).join('') || '<p class="imeta">No specs match.</p>'}</div>`;
}


// ---------- prep ----------
const KINDS = [['syrup', 'Syrups'], ['cordial', 'Cordials'], ['oleo', 'Oleo saccharum'], ['shrub', 'Shrubs'], ['acid', 'Acids'], ['juice', 'Juices'], ['tincture', 'Tinctures & saline'], ['bitters', 'House bitters'],
  ['infusion', 'Infusions'], ['fat-wash', 'Fat washes'], ['clarified', 'Clarified'], ['foam', 'Foams & cream'], ['liqueur', 'House liqueurs'], ['other', 'Other']];
const kindName = k => KINDS.find(x => x[0] === k)?.[1] || k;
function jarSvg(p) {
  const f = clamp(Number(p.qty_ml) / Math.max(1, Number(p.par_ml) || PREP[p.recipe_key]?.yield || 500), 0, 1), y = 40 - 30 * f;
  return `<svg class="jar" viewBox="0 0 38 44" aria-hidden="true"><rect x="8" y="2" width="22" height="5" rx="1.5" fill="var(--brass)"/><path d="M7 9h24v29a4 4 0 0 1-4 4H11a4 4 0 0 1-4-4z" fill="none" stroke="var(--mute)" stroke-width="1.6"/>
    <clipPath id="j${p.id.slice(0, 8)}"><path d="M7 9h24v29a4 4 0 0 1-4 4H11a4 4 0 0 1-4-4z"/></clipPath><rect x="0" y="${y}" width="38" height="44" fill="${prepExpired(p) ? 'var(--ox)' : 'var(--brass)'}" opacity=".55" clip-path="url(#j${p.id.slice(0, 8)})"/></svg>`;
}
/** Preps your favorite specs and upcoming menus call for that you don't have (or that are past their date or below par). */
function prepsToMake() {
  const want = new Map();
  const note = (pid, why) => { const w = want.get(pid) || { pid, why: new Set() }; w.why.add(why); want.set(pid, w); };
  const keys = new Set([...Object.values(S.meta).filter(m => m.favorite).map(m => m.spec_key), ...S.events.filter(e => !e.day || daysUntil(e.day) >= 0).flatMap(e => (e.drinks || []).map(d => d.key))]);
  for (const k of keys) { const sp = specByKey(k); if (!sp) continue; for (const i of sp.ings) for (const a of i.ref || []) if (a.prep && !prepHave(a.prep)) { if (i.ref.some(x => altOk(x).ok && !x.prep)) continue; note(a.prep, sp.name); } }
  for (const p of S.preps) if (p.recipe_key && PREP[p.recipe_key] && (prepExpired(p) || (Number(p.par_ml) > 0 && Number(p.qty_ml) < Number(p.par_ml)))) note(p.recipe_key, prepExpired(p) ? 'past its date' : 'below par');
  return [...want.values()].filter(w => PREP[w.pid]);
}
function prepView() {
  const live = S.preps.filter(p => Number(p.qty_ml) > 0).sort((a, b) => (a.expires_on || '9999').localeCompare(b.expires_on || '9999'));
  const todo = prepsToMake();
  const head = `<div class="row"><h2 class="sp">Prep</h2><button class="btn sm" data-act="customprep">${svg('plus')} Custom</button></div>
    <p class="lede">${live.length} house prep${live.length === 1 ? '' : 's'} on hand${todo.length ? ` · ${todo.length} to make` : ''}</p>
    <div class="seg" role="group" aria-label="View"><button data-prepview="onhand" aria-pressed="${S.prepView === 'onhand'}">On hand</button><button data-prepview="todo" aria-pressed="${S.prepView === 'todo'}">To make${todo.length ? ` (${todo.length})` : ''}</button><button data-prepview="library" aria-pressed="${S.prepView === 'library'}">Library</button></div>`;
  if (S.prepView === 'onhand') return head + (live.length ? `<div class="card" style="margin-top:12px">${live.map(p => { const d = p.expires_on ? daysUntil(p.expires_on) : null;
      return `<button class="tap prow" data-prep="${p.id}">${jarSvg(p)}<span style="flex:1;min-width:0"><span class="iname">${esc(p.name)}</span><span class="imeta" style="display:block">${esc(kindName(p.kind))} · ${volText(Number(p.qty_ml))} · made ${p.made_on === today() ? 'today' : new Date(parseYmd(p.made_on)).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span></span>
      <span class="days" style="color:${d == null ? 'var(--mute)' : d < 0 ? 'var(--ox)' : d <= 2 ? 'var(--brass)' : 'var(--ink)'}">${d == null ? '—' : d < 0 ? 'Out' : d}<small>${d == null ? '' : d < 0 ? 'of date' : d === 1 ? 'day' : 'days'}</small></span></button>`; }).join('')}</div>`
    : `<div class="card flat" style="margin-top:12px;text-align:center"><p style="font:700 20px var(--serif);margin:6px 0">Nothing in the fridge yet</p><p class="imeta">Pick a recipe from the library, scale it to the batch you want, and log it. You'll get a countdown to its use-by date.</p><button class="btn sm" data-prepview="library" style="margin-top:8px">Open the library</button></div>`);
  if (S.prepView === 'todo') return head + (todo.length ? `<div class="card" style="margin-top:12px">${todo.map(w => `<div class="prow"><span class="dot"></span><span style="flex:1;min-width:0"><span class="iname">${esc(PREP[w.pid].name)}</span><span class="imeta" style="display:block">For ${esc([...w.why].slice(0, 3).join(', '))}</span></span><button class="btn sm ghost" data-prep-lib="${esc(w.pid)}">Make</button></div>`).join('')}</div>`
    : `<p class="imeta" style="margin-top:14px">Nothing needed. Favorite a few specs or plan a menu, and anything they call for that's missing shows up here.</p>`);
  const q = S.prepQ.trim().toLowerCase();
  const lib = C.preps.filter(p => (!S.prepKind || p.kind === S.prepKind) && (!q || p.name.toLowerCase().includes(q) || p.ings.some(i => (i.t || '').toLowerCase().includes(q))));
  const groups = KINDS.map(([k, l]) => [l, lib.filter(p => p.kind === k)]).filter(g => g[1].length);
  return head + `<div class="search" style="margin-top:12px">${svg('search')}<input type="search" id="pq" placeholder="Search ${C.preps.length} recipes" value="${esc(S.prepQ)}" aria-label="Search prep recipes"></div>
    <div class="chips scroll" aria-label="Kinds"><button class="chip" data-prepkind="" aria-pressed="${!S.prepKind}">All</button>${KINDS.filter(([k]) => C.preps.some(p => p.kind === k)).map(([k, l]) => `<button class="chip" data-prepkind="${k}" aria-pressed="${S.prepKind === k}">${l}</button>`).join('')}</div>
    ${groups.map(([l, ps]) => `<h3>${esc(l)}</h3><div class="card">${ps.map(p => `<button class="tap item" data-prep-lib="${esc(p.id)}"><span class="grow"><span class="iname">${esc(p.name)}</span><span class="imeta" style="display:block">Keeps ${p.keeps >= 365 ? Math.round(p.keeps / 365) + ' year' + (p.keeps >= 730 ? 's' : '') : p.keeps >= 60 ? Math.round(p.keeps / 30) + ' months' : p.keeps + ' days'}${p.yield ? ` · makes ${volText(p.yield)}` : ''}</span></span>${prepHave(p.id) ? '<span class="pill ok">On hand</span>' : ''}</button>`).join('')}</div>`).join('') || '<p class="imeta">No recipes match.</p>'}`;
}

// ---------- host ----------
function hostView() {
  const up = S.events.filter(e => !e.day || daysUntil(e.day) >= 0).sort((a, b) => (a.day || '9').localeCompare(b.day || '9')), past = S.events.filter(e => e.day && daysUntil(e.day) < 0).reverse();
  const open = S.list.filter(x => !x.checked), done = S.list.filter(x => x.checked);
  const head = `<div class="row"><h2 class="sp">Host</h2>${S.hostView === 'events' ? `<button class="btn sm" data-act="newevent">${svg('plus')} New menu</button>` : S.hostView === 'shop' ? `<button class="btn sm" data-act="additem">${svg('plus')} Add</button>` : `<button class="btn sm" data-act="addgear">${svg('plus')} Add</button>`}</div>
    <p class="lede">Menus for nights in, the Bar shopping list and your glassware.</p>
    <div class="seg" role="group" aria-label="View"><button data-hostview="events" aria-pressed="${S.hostView === 'events'}">Menus</button><button data-hostview="shop" aria-pressed="${S.hostView === 'shop'}">Shopping${open.length ? ` (${open.length})` : ''}</button><button data-hostview="gear" aria-pressed="${S.hostView === 'gear'}">Glass &amp; tools</button></div>`;
  if (S.hostView === 'shop') return head + `<p class="imeta" style="margin:12px 0 0">This is the "Bar" list. It also shows in We're Cooked, so whoever's at the store sees it.</p>
    ${open.length ? `<div class="card" style="margin-top:10px">${open.map(x => `<div class="item"><input type="checkbox" data-check="${x.id}" aria-label="Got ${esc(x.name)}" style="width:22px;height:22px;accent-color:var(--brass)"><span class="grow"><span class="iname">${esc(x.name)}</span><span class="imeta" style="display:block">${x.qty ? `${frac(Number(x.qty))} ${esc(x.unit || '')}` : ''}${x.source === 'par' ? ' · below par' : ''}</span></span><button class="lnk" data-delitem="${x.id}" aria-label="Remove ${esc(x.name)}">${svg('close')}</button></div>`).join('')}</div>` : '<p class="imeta" style="margin-top:14px">Nothing on the list.</p>'}
    ${done.length ? `<div class="row" style="margin-top:14px"><span class="imeta sp">${done.length} checked off</span><button class="btn sm ghost" data-act="putaway">Put away on the back bar</button></div>` : ''}`;
  if (S.hostView === 'gear') { const groups = [['glass', 'Glassware'], ['tool', 'Tools'], ['ice', 'Ice']];
    return head + groups.map(([k, l]) => { const items = S.gear.filter(g => g.kind === k); return `<h3>${l}</h3>${items.length ? `<div class="card">${items.map(g => `<div class="item"><span class="grow"><span class="iname">${esc(g.name)}</span>${g.notes ? `<span class="imeta" style="display:block">${esc(g.notes)}</span>` : ''}</span><span class="stepper"><button data-gq="${g.id}" data-d="-1" aria-label="Fewer">−</button><span>${g.qty}</span><button data-gq="${g.id}" data-d="1" aria-label="More">+</button></span></div>`).join('')}</div>` : `<p class="imeta">None added yet.</p>`}`; }).join(''); }
  return head + (up.length ? `<h3>Coming up</h3>${up.map(e => eventCard(e)).join('')}` : `<div class="card flat" style="margin-top:14px"><b style="font:700 18px var(--serif)">Plan a night in</b><p class="imeta" style="margin:4px 0 12px">Pick the drinks and the guest count. You get a printed menu, batch sheets, a prep list and a shopping list sized for the party.</p><button class="btn sm" data-act="newevent">${svg('plus')} New menu</button></div>`)
    + (past.length ? `<h3>Past menus</h3>${past.slice(0, 8).map(e => eventCard(e)).join('')}` : '');
}
function eventCard(e) { const d = e.day ? daysUntil(e.day) : null;
  return `<button class="tap card" data-event="${e.id}" style="margin-bottom:10px"><span class="eyebrow">${d == null ? 'No date' : d === 0 ? 'Tonight' : d === 1 ? 'Tomorrow' : d > 0 ? `In ${d} days` : new Date(parseYmd(e.day)).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span><b style="display:block;font:700 20px var(--serif);margin:2px 0">${esc(e.name)}</b><span class="imeta">${e.guests ? `${e.guests} guests · ` : ''}${(e.drinks || []).map(x => specByKey(x.key)?.name).filter(Boolean).join(', ') || 'No drinks yet'}</span></button>`; }

// ---------- sheets ----------
const TOUCH = matchMedia('(pointer: coarse)').matches;
function sheet(html, onReady, opts = {}) {
  const el = document.createElement('div'); el.className = 'sheet'; el.innerHTML = `<div role="dialog" aria-modal="true">${html}</div>`;
  const close = () => { el.remove(); opts.onClose?.(); if (!$('.sheet')) render(); };
  el.close = close; el.onclick = e => { if (e.target === el || e.target.closest('[data-close]')) close(); };
  document.body.appendChild(el); onReady?.(el, close); return el;
}
const redraw = (el, html) => { const box = el.querySelector('[role=dialog]'); const y = box.scrollTop; box.innerHTML = html; box.scrollTop = y; };

// ---------- spec detail ----------
function specSheet(key, scale = 1) {
  const sp = specByKey(key); if (!sp) return;
  let sc = scale;
  const draw = () => { const st = specStatus(sp), m = metaOf(sp.id), n = drinkNumbers(sp);
    return `<div class="spec-head">${glassSvg(sp.glass)}<div style="flex:1"><div class="eyebrow">${esc(sp.family)}${sp.mine ? ' · House spec' : ''}</div><h2>${esc(sp.name)}</h2><div class="imeta">${esc(sp.origin || '')}</div></div></div>
    <div class="facts"><div class="fact"><span>Glass</span><b>${esc(sp.glass || '—')}</b></div><div class="fact"><span>Ice</span><b>${esc(sp.ice || '—')}</b></div><div class="fact"><span>Method</span><b>${esc(sp.method || '—')}</b></div><div class="fact"><span>Garnish</span><b>${esc(sp.garnish || '—')}</b></div></div>
    <div class="row" style="justify-content:space-between"><div class="seg" style="width:120px" role="group" aria-label="Units"><button data-units="oz" aria-pressed="${S.units === 'oz'}">oz</button><button data-units="ml" aria-pressed="${S.units === 'ml'}">ml</button></div>
      <span class="row" style="gap:6px"><span class="imeta">Drinks</span><span class="stepper"><button data-sc="-1" aria-label="Fewer">−</button><span>${sc}</span><button data-sc="1" aria-label="More">+</button></span></span></div>
    <div class="card" style="margin-top:10px">${sp.ings.map(i => { const s = i.ref?.length ? ingState(i) : { ok: true, free: true }, ors = orNames(i);
      const use = !i.ref?.length ? '' : s.ok ? (s.bottle ? `${s.how === 'sub' ? 'Sub: ' : 'Pour '}${esc(s.bottle.name)}` : s.how === 'quick' ? 'Quick to make (2 minutes)' : s.prep ? `House batch · ${daysUntil(s.prep.expires_on) >= 0 ? `${daysUntil(s.prep.expires_on)}d left` : 'check date'}` : '')
        : `<span style="color:var(--ox)">${s.how === 'make' ? 'Make a batch' : 'Not on the back bar'}</span>${ors.length ? ` · or ${esc(ors.join(' or '))}` : ''}`;
      return `<div class="ing${s.ok ? '' : ' miss'}"><span class="amt">${esc(amtText(i, sc))}</span><span><span class="nm">${esc(ingLabel(i))}</span>${use ? `<span class="use">${use}</span>` : ''}</span><span>${!s.ok && i.ref?.[0]?.prep ? `<button class="lnk" data-prep-lib="${esc(i.ref[0].prep)}">Recipe</button>` : !s.ok ? `<button class="lnk" data-buy="${esc(altName(i.ref[0].style ? { fam: STY[i.ref[0].style]?.fam } : i.ref[0]))}">+ List</button>` : s.how === 'quick' && i.ref?.[0]?.prep ? `<button class="lnk" data-prep-lib="${esc(i.ref[0].prep)}">How</button>` : ''}</span></div>`; }).join('')}</div>
    ${sp.notes.length ? `<div style="margin-top:12px">${sp.notes.map(t => `<p style="margin:6px 0">${esc(t)}</p>`).join('')}</div>` : ''}
    <p class="imeta" style="margin:12px 0 0">≈ ${n.abv.toFixed(0)}% ABV after dilution · ${n.std.toFixed(1)} standard drink${n.std >= 1.05 || n.std < 0.95 ? 's' : ''} · ${volText(n.total)} in the glass${n.cost ? ` · ${money(n.cost)} to make` : ''}</p>
    <div class="row" style="margin-top:14px;justify-content:space-between"><div class="stars" role="group" aria-label="Rating">${[1, 2, 3, 4, 5].map(k => `<button data-rate="${k}" aria-pressed="${(m.rating || 0) >= k}" aria-label="${k} star${k > 1 ? 's' : ''}">★</button>`).join('')}</div>
      <button class="btn sm ${m.favorite ? '' : 'ghost'}" data-fav="1">${m.favorite ? '★ Favorite' : '☆ Favorite'}</button></div>
    ${m.made_count ? `<p class="imeta" style="margin:8px 0 0">Made ${m.made_count} time${m.made_count === 1 ? '' : 's'}${m.last_made ? `, last on ${new Date(parseYmd(m.last_made)).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}` : ''}</p>` : ''}
    <label for="snotes">Your notes</label><textarea id="snotes" placeholder="Tweaks, the bottle that worked best, who loved it">${esc(m.notes || '')}</textarea>
    <div class="row" style="margin-top:14px"><button class="btn" data-made="1" ${st.ok ? '' : 'disabled'}>${svg('check')} Made it</button><button class="btn ghost" data-batch="1">${svg('calc')} Batch</button><button class="btn ghost" data-riff="1">Riff on it</button>
      ${st.missing.length ? `<button class="btn line sm" data-buyall="1">Add missing to list</button>` : ''}${sp.mine ? `<button class="btn line sm" data-editspec="1">${svg('edit')} Edit</button>` : ''}</div>`; };
  sheet(draw(), (el, close) => {
    const save = () => { const v = el.querySelector('#snotes')?.value ?? ''; if (v !== (metaOf(sp.id).notes || '')) saveMeta(sp.id, { notes: v || null }).catch(fail); };
    el.addEventListener('focusout', e => { if (e.target.id === 'snotes') save(); });
    el.addEventListener('click', async e => {
      const t = e.target.closest('button'); if (!t) return;
      try {
        if (t.dataset.units) { S.units = t.dataset.units; lsSet('bhb_units', S.units); return redraw(el, draw()); }
        if (t.dataset.sc) { sc = clamp(sc + Number(t.dataset.sc), 1, 24); return redraw(el, draw()); }
        if (t.dataset.rate) { const k = Number(t.dataset.rate); await saveMeta(sp.id, { rating: metaOf(sp.id).rating === k ? null : k }); return redraw(el, draw()); }
        if (t.dataset.fav) { await saveMeta(sp.id, { favorite: !metaOf(sp.id).favorite }); return redraw(el, draw()); }
        if (t.dataset.made) { await madeIt(sp, sc); return redraw(el, draw()); }
        if (t.dataset.batch) { el.remove(); return batchSheet(sp.id); }
        if (t.dataset.riff) { el.remove(); return specEditor(null, { ...sp, name: `${sp.name} (riff)`, parent: sp.mine ? sp.parent : sp.id }); }
        if (t.dataset.editspec) { el.remove(); return specEditor(sp.row.id); }
        if (t.dataset.buy) { const n = await addToList([{ name: t.dataset.buy }]); toast(n ? `${t.dataset.buy} is on the Bar list` : 'Already on the list'); return; }
        if (t.dataset.buyall) { const st = specStatus(sp); const items = st.missing.filter(r => !r.i.ref.every(a => a.prep)).map(r => ({ name: altName(r.i.ref[0].style ? { fam: STY[r.i.ref[0].style]?.fam } : r.i.ref[0]) }));
          const n = await addToList(items); const mk = st.missing.filter(r => r.i.ref.every(a => a.prep)); toast([n && `${n} added to the Bar list`, mk.length && `make ${mk.map(r => altName(r.i.ref[0])).join(', ')}`].filter(Boolean).join(' · ') || 'Already on the list'); return; }
        if (t.dataset.prepLib) { el.remove(); return prepRecipeSheet(t.dataset.prepLib); }
      } catch (er) { fail(er); }
    });
  }, { onClose: () => { const v = document.querySelector('#snotes'); } });
}
/** Made it: take what you poured off the bottles and batches, count it. */
async function madeIt(sp, n = 1) {
  const now = new Date().toISOString(), opened = [];
  for (const i of sp.ings) { const ml = mlOf(i.q, i.u) * n; if (!ml || !i.ref?.length || /^dash|^drop/.test(i.u)) continue; const st = ingState(i); if (!st.ok) continue;
    if (st.bottle) { const b = st.bottle; let fill = Number(b.fill_ml) - ml, sealed = Number(b.sealed) || 0;
      if (fill <= 0 && sealed > 0) { fill = Number(b.size_ml) + fill; sealed--; opened.push(b.name); }
      b.fill_ml = Math.max(0, Math.round(fill)); b.sealed = sealed; quietUntil = Date.now() + 2500;
      const r = await sb.from('bar_bottles').update({ fill_ml: b.fill_ml, sealed, updated_at: now, opened_on: b.opened_on || today() }).eq('id', b.id); if (r.error) throw r.error; }
    else if (st.prep) { const p = st.prep; p.qty_ml = Math.max(0, Math.round(Number(p.qty_ml) - ml)); const r = await sb.from('bar_preps').update({ qty_ml: p.qty_ml, updated_at: now }).eq('id', p.id); if (r.error) throw r.error; } }
  await saveMeta(sp.id, { made_count: (metaOf(sp.id).made_count || 0) + n, last_made: today() });
  scheduleListSync();
  toast(`Cheers. ${n > 1 ? n + ' poured' : 'Logged'}${opened.length ? ` · opened a new ${opened.join(', ')}` : ''}`);
}

// ---------- bottles ----------
const SIZES = [50, 200, 375, 500, 700, 750, 1000, 1750];
const LOCS = [['backbar', 'Back bar'], ['well', 'Well'], ['fridge', 'Fridge'], ['freezer', 'Freezer'], ['cellar', 'Cabinet']];
function catalogSearch(q, n = 25) {
  q = fold(q).trim(); if (q.length < 2) return [];
  const words = q.split(/\s+/);
  const bs = C.bottles.filter(([name]) => words.every(w => fold(name).includes(w))).slice(0, n).map(([name, sid, abv]) => ({ kind: 'bottle', name, sid, abv }));
  const ss = C.styles.filter(s => words.every(w => fold(s.name + ' ' + s.cat).includes(w))).slice(0, 8).map(s => ({ kind: 'style', name: s.name, sid: s.id, abv: s.abv ? Math.round((s.abv[0] + s.abv[1]) / 2) : null }));
  return [...bs, ...ss];
}
function addBottleSheet(preCat = '') {
  let q = '';
  const results = () => { const r = catalogSearch(q);
    return r.length ? `<div class="card flat" style="padding:2px 12px;margin-top:8px">${r.map((x, k) => `<button class="tap item" data-pick="${k}"><span class="grow"><span class="iname">${esc(x.name)}</span><span class="imeta" style="display:block">${x.kind === 'style' ? 'Any bottle of this style' : esc(STY[x.sid]?.name || '')}${x.abv ? ` · ${x.abv}%` : ''}</span></span>${svg('plus')}</button>`).join('')}</div>`
      : q.trim().length >= 2 ? `<p class="imeta">Not in the catalog. <button class="lnk" data-custom="1">Add “${esc(q.trim())}” anyway</button></p>` : '<p class="imeta">Type a brand or style: “Smith & Cross”, “rye”, “amaro”.</p>'; };
  sheet(`<h2>Add a bottle</h2><p class="lede">Search 1,200+ bottles, or scan.</p>
    <div class="row" style="gap:8px"><button class="btn sm ghost" data-scan="shelf">${svg('camera')} Photo of bottles</button><button class="btn sm ghost" data-scan="barcode">${svg('scan')} Barcode</button></div>
    <div class="search" style="margin-top:12px">${svg('search')}<input type="search" id="abq" placeholder="Brand, bottle or style" aria-label="Search bottles" autocomplete="off"></div><div id="abr">${results()}</div>`, (el, close) => {
    const inp = el.querySelector('#abq'); if (!TOUCH) inp.focus();
    inp.oninput = () => { q = inp.value; el.querySelector('#abr').innerHTML = results(); };
    el.addEventListener('click', e => { const t = e.target.closest('button'); if (!t) return;
      if (t.dataset.scan === 'shelf') { el.remove(); return scanShelf(); }
      if (t.dataset.scan === 'barcode') { el.remove(); return scanBarcode(); }
      if (t.dataset.pick != null) { const x = catalogSearch(q)[Number(t.dataset.pick)]; el.remove(); return bottleEditor(null, { name: x.kind === 'style' ? x.name : x.name, style_id: x.sid, abv: x.abv }); }
      if (t.dataset.custom) { el.remove(); return bottleEditor(null, { name: q.trim() }); }
    });
  });
}
function bottleEditor(id, preset = {}) {
  const b = S.bottles.find(x => x.id === id) || { name: '', style_id: '', abv: null, size_ml: 750, fill_ml: 750, sealed: 0, par: 0, price: null, location: 'backbar', notes: '', barcode: id ? null : pendingBarcode, ...preset };
  if (!id && preset.size_ml && preset.fill_ml == null) b.fill_ml = preset.size_ml;
  let shape = b.shape || '', photoB64 = null, photoUrl = b.photo_url || null;
  let style = b.style_id || '', size = Number(b.size_ml) || 750, fill = clamp(Number(b.fill_ml) / size, 0, 1), sealed = Number(b.sealed) || 0, par = Number(b.par) || 0, cat = STY[style]?.cat || C.cats[0];
  const fills = [[1, 'Full'], [0.75, '¾'], [0.5, '½'], [0.25, '¼'], [0.1, 'Low'], [0, 'Empty']];
  const draw = () => `<div class="row" style="flex-wrap:nowrap;gap:14px"><span style="width:52px;flex:none">${bottleVisual({ ...b, style_id: style, size_ml: size, fill_ml: fill * size, id: 'ed', shape, photo_url: photoB64 ? 'data:image/jpeg;base64,' + photoB64 : photoUrl })}</span><h2 class="sp" style="font-size:24px">${id ? esc(b.name) : 'New bottle'}</h2></div>
    <form id="bf"><label for="bn">Bottle</label><input type="text" id="bn" value="${esc(b.name)}" required maxlength="120" placeholder="e.g. Rittenhouse Rye">
    <label>Category</label><div class="chips scroll" data-sk="bcat">${C.cats.map(c => `<button type="button" class="chip" data-bcat="${esc(c)}" aria-pressed="${cat === c}">${esc(c)}</button>`).join('')}</div>
    <label for="bs">Style (sets what it can stand in for)</label><select id="bs"><option value="">Not sure</option>${C.styles.filter(s => s.cat === cat).map(s => `<option value="${s.id}" ${s.id === style ? 'selected' : ''}>${esc(s.name)}</option>`).join('')}</select>
    ${STY[style] ? `<p class="imeta" style="margin:6px 0 0">${esc(STY[style].notes)}</p>` : ''}
    <label>Look on the shelf</label><div class="row" style="gap:8px"><button type="button" class="btn sm ghost" data-photo="1">${svg('camera')} ${photoUrl || photoB64 ? 'Retake photo' : 'Use my photo'}</button>${photoUrl || photoB64 ? '<button type="button" class="btn sm line" data-nophoto="1">Use a drawing</button>' : ''}</div>
    ${photoUrl || photoB64 ? '' : `<div class="shapes" data-sk="shapes">${shapeChip('', !shape)}${Object.keys(SHAPES).map(k => shapeChip(k, shape === k)).join('')}</div>`}
    <label>How full is the open bottle?</label><div class="fillpick">${fills.map(([v, l]) => `<button type="button" data-fill="${v}" aria-pressed="${Math.abs(fill - v) < 0.06}">${l}</button>`).join('')}</div>
    <div class="grid2" style="margin-top:4px"><div><label>Sealed backups</label><span class="stepper"><button type="button" data-sealed="-1" aria-label="Fewer">−</button><span>${sealed}</span><button type="button" data-sealed="1" aria-label="More">+</button></span></div>
      <div><label>Always keep (bottles)</label><span class="stepper"><button type="button" data-par="-1" aria-label="Lower">−</button><span>${par}</span><button type="button" data-par="1" aria-label="Higher">+</button></span></div></div>
    <label>Size</label><div class="chips">${SIZES.map(z => `<button type="button" class="chip" data-size="${z}" aria-pressed="${size === z}">${z >= 1000 ? (z / 1000) + ' L' : z + ' ml'}</button>`).join('')}</div>
    <div class="grid2"><div><label for="ba">ABV %</label><input type="number" id="ba" step="0.1" min="0" max="100" value="${b.abv ?? ''}" placeholder="${STY[style]?.abv ? Math.round((STY[style].abv[0] + STY[style].abv[1]) / 2) : '40'}"></div>
      <div><label for="bp">Price paid</label><input type="number" id="bp" step="0.01" min="0" value="${b.price ?? ''}" placeholder="$" inputmode="decimal"></div></div>
    <label>Where it lives</label><div class="chips">${LOCS.map(([k, l]) => `<button type="button" class="chip" data-loc="${k}" aria-pressed="${(b.location || 'backbar') === k}">${l}</button>`).join('')}</div>
    <label for="bno">Notes</label><textarea id="bno" placeholder="Tasting notes, where you bought it">${esc(b.notes || '')}</textarea>
    <p class="imeta">Set "always keep" and it goes on the Bar shopping list when you're down to the last of it.</p>
    <div class="row" style="margin-top:14px"><button class="btn" type="submit">Save</button><button class="btn ghost" type="button" data-close>Cancel</button><span class="sp"></span>${id ? '<button class="btn line sm" type="button" id="bdel">Delete</button>' : ''}</div></form>`;
  sheet(draw(), (el, close) => {
    const keep = () => { b.name = el.querySelector('#bn').value; b.abv = el.querySelector('#ba').value === '' ? null : Number(el.querySelector('#ba').value); b.price = el.querySelector('#bp').value === '' ? null : Number(el.querySelector('#bp').value); b.notes = el.querySelector('#bno').value; style = el.querySelector('#bs').value; };
    const re = () => { keep(); redraw(el, draw()); bind(); };
    const bind = () => {
      el.querySelector('#bs').onchange = () => { keep(); re(); };
      el.querySelector('#bf').onsubmit = async e => { e.preventDefault(); keep(); if (!b.name.trim()) return;
        if (photoB64) { try { toast('Uploading photo…'); photoUrl = await uploadPhoto(photoB64); } catch (er) { return fail(er); } }
        const row = { household_id: S.household.id, name: b.name.trim(), shape: shape || null, photo_url: photoUrl, style_id: style || null, category: STY[style]?.cat || cat, abv: b.abv ?? (STY[style]?.abv ? Math.round((STY[style].abv[0] + STY[style].abv[1]) / 2 * 10) / 10 : null), size_ml: size, fill_ml: Math.round(fill * size), sealed, par, price: b.price, location: b.location || 'backbar', notes: b.notes || null, barcode: b.barcode || null, updated_at: new Date().toISOString() };
        quietUntil = Date.now() + 2500;
        const r = id ? await sb.from('bar_bottles').update(row).eq('id', id) : await sb.from('bar_bottles').insert({ ...row, opened_on: fill < 1 ? today() : null });
        if (r.error) return fail(r.error); if (!id) pendingBarcode = null; await loadAll(); close(); toast(id ? 'Saved' : `${row.name} is on the back bar`); };
      el.querySelector('#bdel')?.addEventListener('click', async ev => { if (ev.target.dataset.sure !== '1') { ev.target.dataset.sure = '1'; ev.target.textContent = 'Tap again to delete'; return; }
        const r = await sb.from('bar_bottles').delete().eq('id', id); if (r.error) return fail(r.error); await loadAll(); close(); });
    };
    el.addEventListener('click', e => { const t = e.target.closest('button[type=button]'); if (!t) return;
      if (t.dataset.bcat) { cat = t.dataset.bcat; if (STY[style]?.cat !== cat) style = ''; return re(); }
      if (t.dataset.fill) { fill = Number(t.dataset.fill); return re(); }
      if (t.dataset.sealed) { sealed = clamp(sealed + Number(t.dataset.sealed), 0, 99); return re(); }
      if (t.dataset.par) { par = clamp(par + Number(t.dataset.par), 0, 24); return re(); }
      if (t.dataset.size) { size = Number(t.dataset.size); return re(); }
      if (t.dataset.loc) { b.location = t.dataset.loc; return re(); }
      if (t.dataset.shape != null) { shape = t.dataset.shape; return re(); }
      if (t.dataset.nophoto) { photoB64 = null; photoUrl = null; return re(); }
      if (t.dataset.photo) { keep(); pickPhotos(false).then(async ([f]) => { if (!f) return; photoB64 = await fileToB64(f, 900); redraw(el, draw()); bind(); }).catch(fail); return; }
    });
    bind();
  });
}
async function fileToB64(file, max = 1600) {
  const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = URL.createObjectURL(file); });
  const s = Math.min(1, max / Math.max(img.width, img.height)), c = document.createElement('canvas'); c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); return c.toDataURL('image/jpeg', 0.85).split(',')[1];
}
async function uploadPhoto(b64) {
  const bin = atob(b64), arr = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  const path = `${S.household.id}/${crypto.randomUUID()}.jpg`;
  const up = await sb.storage.from('photos').upload(path, new Blob([arr], { type: 'image/jpeg' }), { contentType: 'image/jpeg', upsert: false });
  if (up.error) throw up.error; return sb.storage.from('photos').getPublicUrl(path).data.publicUrl;
}
async function ai(mode, body) {
  const { data, error } = await sb.functions.invoke('ai', { body: { mode, ...body } });
  if (error) { let m = error.message; try { const j = await error.context.json(); m = j.error || m; } catch (_) { } throw new Error(m); }
  if (data?.error) throw new Error(data.error); return data;
}
function pickPhotos(multiple = true) { return new Promise(res => { const i = document.createElement('input'); i.type = 'file'; i.accept = 'image/*'; i.multiple = multiple; i.onchange = () => res([...i.files]); i.click(); }); }
/** Match a bottle name read off a label to the catalog without ever swapping a specific bottle for a generic one.
    Returns {name, sid, abv, hit} — hit is the catalog entry when the label clearly is that bottle. */
const toks = s => fold(s).replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(w => w && !['the', 'and', 'de', 'of', 'la', 'le', 'el'].includes(w));
function bestCatalog(name, brand = '') {
  const at = new Set(toks(`${brand} ${name}`)); let best = null, bs = 0;
  if (!at.size) return { name, sid: '', abv: null, hit: null };
  for (const c of C.bottles) { const ct = toks(c[0]); if (!ct.length || !at.has(ct[0])) continue;   // the brand has to match
    const inter = ct.filter(w => at.has(w)).length, cover = inter / ct.length, prec = inter / at.size, score = cover * 0.75 + prec * 0.25;
    if (cover >= 0.75 && score > bs) { bs = score; best = c; } }
  if (!best) return { name, sid: '', abv: null, hit: null };
  const precise = toks(best[0]).length >= at.size - 1;   // the catalog name is as specific as the label: use its spelling
  return { name: precise ? best[0] : name, sid: best[1], abv: best[2], hit: best };
}
/** Closest style for a description like "bottled-in-bond bourbon" (used when the AI's style is missing). */
function styleFromHint(hint, cat) {
  const t = toks(hint); if (!t.length) return '';
  let best = '', bs = 0;
  for (const st of C.styles) { if (cat && st.cat.toLowerCase() !== String(cat).toLowerCase()) continue; const w = toks(st.name + ' ' + st.notes); const sc = t.filter(x => w.includes(x)).length / t.length; if (sc > bs) { bs = sc; best = st.id; } }
  return bs >= 0.5 ? best : '';
}
async function scanShelf() {
  const files = await pickPhotos(true); if (!files.length) return;
  const el = sheet(`<div class="spin"></div><p class="lede" style="text-align:center">Reading labels like a bar-back on inventory night…</p>`);
  try {
    const images = await Promise.all(files.slice(0, 4).map(f => fileToB64(f, 2000)));
    const out = await ai('bar_photo', { images, media_type: 'image/jpeg', styles: C.styles.map(st => `${st.id}|${st.cat}|${st.name}`) });
    const found = (out.bottles || []).filter(x => x.name).map(x => {
      const m = bestCatalog(x.name, x.brand), sid = STY[x.style_id] ? x.style_id : m.sid || styleFromHint(x.style_hint || x.name, x.category);
      const name = m.hit ? m.name : x.name;
      return { name, sid, abv: x.abv || m.abv || null, size_ml: x.size_ml || null, fill: clamp(Number(x.fill ?? 1), 0, 1), dupe: S.bottles.some(b => fold(b.name) === fold(name)) }; });
    if (!found.length) { el.remove(); return toast("Couldn't make out any labels. Get closer, face the labels to the camera, good light."); }
    const draw = () => `<h2>Found ${found.length} bottle${found.length === 1 ? '' : 's'}</h2><p class="lede">Check the names (tap to fix), untick anything wrong. Fill levels are the AI's best eyeball.</p>
      <div class="card flat" style="padding:2px 12px">${found.map((x, k) => `<div class="item"><input type="checkbox" data-k="${k}" ${x.dupe ? '' : 'checked'} aria-label="Add ${esc(x.name)}" style="width:22px;height:22px;accent-color:var(--brass)"><span class="grow"><input type="text" data-nm="${k}" value="${esc(x.name)}" style="min-height:38px;padding:6px 10px;font-weight:600" aria-label="Bottle name">
        <span class="imeta" style="display:block;margin-top:3px">${esc(STY[x.sid]?.name || 'Style unknown: set it after adding')} · about ${Math.round(x.fill * 100)}% full${x.dupe ? ' · already on your back bar' : ''}</span></span></div>`).join('')}</div>
      <div class="row" style="margin-top:14px"><button class="btn" id="addall">Add to the back bar</button><button class="btn ghost" data-close>Cancel</button></div>`;
    redraw(el, draw());
    el.querySelector('#addall').onclick = async () => {
      const pick = found.map((x, k) => ({ ...x, name: (el.querySelector(`[data-nm="${k}"]`).value || x.name).trim() })).filter((x, k) => el.querySelector(`[data-k="${k}"]`).checked);
      for (const x of pick) if (!STY[x.sid]) { const m = bestCatalog(x.name); if (m.hit) x.sid = m.sid; }
      const rows = pick.map(x => ({ household_id: S.household.id, name: x.name.slice(0, 120), style_id: x.sid || null, category: STY[x.sid]?.cat || null, abv: x.abv || (STY[x.sid]?.abv ? Math.round((STY[x.sid].abv[0] + STY[x.sid].abv[1]) / 2) : null), size_ml: x.size_ml || 750, fill_ml: Math.round((x.size_ml || 750) * x.fill), location: 'backbar' }));
      if (rows.length) { const r = await sb.from('bar_bottles').insert(rows); if (r.error) return fail(r.error); }
      await loadAll(); el.remove(); render(); toast(`${rows.length} bottle${rows.length === 1 ? '' : 's'} on the back bar`);
    };
  } catch (e) { el.remove(); fail(e); }
}
const BC_FORMATS = ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128'];
let nativeBcOK = null, zxingP = null;
const loadZxing = () => zxingP || (zxingP = new Promise((res, rej) => { if (window.ZXing) return res(window.ZXing); const sc = document.createElement('script'); sc.src = '../vendor/zxing.min.js'; sc.onload = () => res(window.ZXing); sc.onerror = () => { zxingP = null; rej(new Error('The barcode reader failed to load')); }; document.head.appendChild(sc); }));
async function makeReader() {
  if (nativeBcOK !== false && 'BarcodeDetector' in window) {
    try { const f = await BarcodeDetector.getSupportedFormats(); const want = BC_FORMATS.filter(x => f.includes(x)); if (want.length) return { kind: 'native', d: new BarcodeDetector({ formats: want }) }; } catch (_) { }
    nativeBcOK = false;
  }
  const Z = await loadZxing(); const hints = new Map();
  hints.set(Z.DecodeHintType.POSSIBLE_FORMATS, [Z.BarcodeFormat.EAN_13, Z.BarcodeFormat.EAN_8, Z.BarcodeFormat.UPC_A, Z.BarcodeFormat.UPC_E, Z.BarcodeFormat.CODE_128]); hints.set(Z.DecodeHintType.TRY_HARDER, true);
  const reader = new Z.MultiFormatReader(); reader.setHints(hints); return { kind: 'zx', Z, reader };
}
function zxDecode(r, canvas) { const { Z, reader } = r;
  for (const Bin of [Z.HybridBinarizer, Z.GlobalHistogramBinarizer]) { try { const res = reader.decode(new Z.BinaryBitmap(new Bin(new Z.HTMLCanvasElementLuminanceSource(canvas)))); if (res) return res.getText(); } catch (_) { } }
  return null; }
async function readCode(r, canvas) {
  if (r.kind === 'native') { try { const out = await r.d.detect(canvas); nativeBcOK = true; return out[0]?.rawValue || null; } catch (_) { nativeBcOK = false; Object.assign(r, await makeReader()); return zxDecode(r, canvas); } }
  return zxDecode(r, canvas);
}
const drawTo = (src, w, h, sx = 0, sy = 0, sw, sh, rot = 0) => { const c = document.createElement('canvas'); c.width = rot ? h : w; c.height = rot ? w : h; const g = c.getContext('2d'); if (rot) { g.translate(c.width / 2, c.height / 2); g.rotate(rot * Math.PI / 180); g.translate(-w / 2, -h / 2); } g.drawImage(src, sx, sy, sw ?? (src.videoWidth || src.naturalWidth || src.width), sh ?? (src.videoHeight || src.naturalHeight || src.height), 0, 0, w, h); return c; };
async function readCodeFromFile(file) {
  const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('Could not open that photo')); i.src = URL.createObjectURL(file); });
  const r = await makeReader(), W = img.naturalWidth, H = img.naturalHeight;
  for (const max of [1600, 1100, 800]) for (const rot of [0, 90]) { const sc = Math.min(1, max / Math.max(W, H)), code = await readCode(r, drawTo(img, Math.round(W * sc), Math.round(H * sc), 0, 0, W, H, rot)); if (code) { URL.revokeObjectURL(img.src); return code; } }
  URL.revokeObjectURL(img.src); return null;
}
/** Live camera with a reticle, plus photo and type-it-in fallbacks. */
function barcodeCamera(onCode) {
  let stream = null, timer = null, stopped = false;
  const stop = () => { stopped = true; clearInterval(timer); stream?.getTracks().forEach(t => t.stop()); };
  sheet(`<h2>Scan a barcode</h2><div class="cam"><video playsinline muted autoplay></video><div class="reticle"></div><div class="hint">Line the barcode up in the box</div></div>
    <div class="camopts"><label class="btn sm">${svg('camera')} Photo of the barcode<input type="file" accept="image/*" capture="environment" class="campick" hidden></label><label class="btn sm ghost">From photos<input type="file" accept="image/*" class="campick" hidden></label><button class="btn sm ghost" id="typec" type="button">Type the number</button></div>
    <form id="typeform" class="row" style="flex-wrap:nowrap;margin-top:10px" hidden><input type="text" id="typenum" inputmode="numeric" placeholder="Numbers under the barcode" autocomplete="off"><button class="btn" type="submit">Look up</button></form>`, async el => {
    const video = el.querySelector('video'), hint = el.querySelector('.hint');
    el.querySelectorAll('.campick').forEach(inp => inp.onchange = async e => { const f = e.target.files[0]; if (!f) return; hint.textContent = 'Reading the barcode…';
      try { const code = await readCodeFromFile(f); if (code) { stop(); el.remove(); return onCode(code); } hint.textContent = "Couldn't find it. Get closer, flat and in good light, or type the number."; } catch (er) { hint.textContent = er.message; } e.target.value = ''; });
    el.querySelector('#typec').onclick = () => { const f = el.querySelector('#typeform'); f.hidden = false; f.querySelector('input').focus(); };
    el.querySelector('#typeform').onsubmit = e => { e.preventDefault(); const c = el.querySelector('#typenum').value.replace(/\D/g, ''); if (c.length < 6 || c.length > 14) { hint.textContent = 'Barcodes are 8 to 13 digits.'; return; } stop(); el.remove(); onCode(c); };
    try { stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false }); if (stopped) return stop(); video.srcObject = stream; await video.play().catch(() => { }); }
    catch (_) { hint.textContent = 'Live camera unavailable: use “Photo of the barcode” below.'; return; }
    let r; try { r = await makeReader(); } catch (er) { hint.textContent = er.message; return; }
    let busy = false, tick = 0;
    timer = setInterval(async () => { if (busy || stopped || !(video.videoWidth > 0 && video.readyState >= 2)) return; busy = true; tick++;
      try { const w = video.videoWidth, h = video.videoHeight; let c;
        if (tick % 2) { const cw = Math.round(w * .8), ch = Math.round(h * .45), sc = Math.min(1, 1280 / cw); c = drawTo(video, Math.round(cw * sc), Math.round(ch * sc), (w - cw) / 2, (h - ch) / 2, cw, ch); }
        else { const sc = Math.min(1, 1280 / w); c = drawTo(video, Math.round(w * sc), Math.round(h * sc)); }
        const code = await readCode(r, c); if (code && /^\d{6,14}$/.test(code)) { navigator.vibrate?.(60); stop(); el.remove(); onCode(code); }
      } catch (_) { } finally { busy = false; } }, 350);
  }, { onClose: stop });
}
async function lookupBarcode(code) {
  try { const r = await fetch(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json?fields=product_name,brands,quantity,alcohol_by_volume_value,nutriments`);
    if (!r.ok) return null; const j = await r.json(); if (j.status !== 1 || !j.product) return null; const p = j.product;
    const ml = (() => { const m = String(p.quantity || '').toLowerCase().match(/([\d.,]+)\s*(ml|cl|l)\b/); if (!m) return null; const v = parseFloat(m[1].replace(',', '.')); return m[2] === 'l' ? v * 1000 : m[2] === 'cl' ? v * 10 : v; })();
    const name = [p.brands?.split(',')[0], p.product_name].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
    return name ? { name, brand: p.brands?.split(',')[0] || '', size_ml: ml, abv: Number(p.alcohol_by_volume_value || p.nutriments?.alcohol_100g || p.nutriments?.alcohol) || null } : null;
  } catch (_) { return null; }
}
function scanBarcode() {
  barcodeCamera(async code => {
    const have = S.bottles.find(b => b.barcode === code);
    if (have) { const sealed = (Number(have.sealed) || 0) + 1; const r = await sb.from('bar_bottles').update({ sealed, updated_at: new Date().toISOString() }).eq('id', have.id); if (r.error) return fail(r.error); await loadAll(); render(); return toast(`Another ${have.name}: ${sealed} sealed`); }
    toast('Looking it up…');
    const p = await lookupBarcode(code);
    if (p) { const m = bestCatalog(p.name, p.brand); return bottleEditor(null, { name: m.hit ? m.name : p.name, style_id: m.sid || styleFromHint(p.name), abv: p.abv || m.abv, size_ml: SIZES.includes(Math.round(p.size_ml)) ? Math.round(p.size_ml) : 750, barcode: code }); }
    pendingBarcode = code; toast("Not in the barcode database. Find it by name once and it'll be remembered."); addBottleSheet();
  });
}
let pendingBarcode = null;


// ---------- prep recipes ----------
function scaleAmt(i, f) {
  if (i.q == null) return '';
  const q = i.q * f, u = i.u || '';
  if (u === 'g' || u === 'ml') return `${q >= 100 ? Math.round(q / 5) * 5 : q >= 10 ? Math.round(q) : Math.round(q * 10) / 10} ${u}`;
  if (u === 'kg' || u === 'l') return `${Math.round(q * 100) / 100} ${u}`;
  if (u === 'oz') return amtText(i, f);
  return `${frac(Math.round(q * 4) / 4) || Math.round(q * 10) / 10}${u ? ' ' + u : ''}`;
}
function prepRecipeSheet(pid) {
  const p = PREP[pid]; if (!p) return;
  let target = p.yield || 500;
  const keepTxt = p.keeps >= 365 ? `${Math.round(p.keeps / 365)} year${p.keeps >= 730 ? 's' : ''}` : p.keeps >= 60 ? `${Math.round(p.keeps / 30)} months` : `${p.keeps} days`;
  const steps = [250, 500, 750, 1000, 1500, 2000];
  const draw = () => { const f = p.yield ? target / p.yield : 1;
    return `<div class="eyebrow">${esc(kindName(p.kind))}</div><h2>${esc(p.name)}</h2><p class="lede">Keeps about ${keepTxt} cold${prepHave(pid) ? ' · you have a batch going' : ''}</p>
    ${p.yield ? `<label>Batch size</label><div class="chips">${steps.map(z => `<button class="chip" data-target="${z}" aria-pressed="${target === z}">${volText(z)}</button>`).join('')}<button class="chip" data-target="${p.yield}" aria-pressed="${target === p.yield}">Recipe (${volText(p.yield)})</button></div>` : ''}
    <h3>Ingredients</h3><div class="card">${p.ings.map(i => { const st = i.ref?.length ? ingState(i) : null;
      return `<div class="ing"><span class="amt" style="font-size:15px">${esc(scaleAmt(i, f))}</span><span><span class="nm">${esc(ingLabel(i))}</span>${st && !st.ok ? `<span class="use" style="color:var(--ox)">${i.ref[0].prep ? 'Make this first' : 'Not on hand'}</span>` : ''}</span><span>${i.ref?.[0]?.prep ? `<button class="lnk" data-sub="${esc(i.ref[0].prep)}">Recipe</button>` : ''}</span></div>`; }).join('')}</div>
    <h3>Method</h3><ol class="steps">${p.steps.map(s => `<li>${esc(s)}</li>`).join('')}</ol>
    <div class="row" style="margin-top:16px"><button class="btn" data-log="1">${svg('check')} Log this batch</button><button class="btn ghost" data-close>Close</button></div>`; };
  sheet(draw(), (el, close) => el.addEventListener('click', async e => { const t = e.target.closest('button'); if (!t) return;
    if (t.dataset.target) { target = Number(t.dataset.target); return redraw(el, draw()); }
    if (t.dataset.sub) { el.remove(); return prepRecipeSheet(t.dataset.sub); }
    if (t.dataset.log) { try { await logBatch(pid, target); close(); toast(`${p.name} logged · use by ${new Date(addDays(new Date(), p.keeps)).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`); } catch (er) { fail(er); } }
  }));
}
async function logBatch(pid, ml) {
  const p = PREP[pid], row = { household_id: S.household.id, recipe_key: pid, name: p.name, kind: p.kind, made_on: today(), expires_on: ymd(addDays(new Date(), p.keeps)), qty_ml: Math.round(ml), updated_at: new Date().toISOString() };
  const cur = prepRows(pid)[0]; quietUntil = Date.now() + 2500;
  const r = cur ? await sb.from('bar_preps').update(row).eq('id', cur.id) : await sb.from('bar_preps').insert(row); if (r.error) throw r.error;
  await loadAll(); render();
}
function prepRowSheet(id) {
  const p = S.preps.find(x => x.id === id); if (!p) return;
  let qty = Number(p.qty_ml) || 0, par = Number(p.par_ml) || 0;
  const d = p.expires_on ? daysUntil(p.expires_on) : null, lib = PREP[p.recipe_key];
  const draw = () => `<div class="eyebrow">${esc(kindName(p.kind))}</div><h2>${esc(p.name)}</h2>
    <p class="lede">Made ${new Date(parseYmd(p.made_on)).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}${d == null ? '' : d < 0 ? ` · <b style="color:var(--ox)">past its date</b>` : ` · use within ${d} day${d === 1 ? '' : 's'}`}</p>
    <div class="calc"><span>Left in the bottle</span><span class="stepper"><button data-q="-50" aria-label="Less">−</button><span style="min-width:70px">${volText(qty)}</span><button data-q="50" aria-label="More">+</button></span>
      <span>Keep at least</span><span class="stepper"><button data-par="-50" aria-label="Lower">−</button><span style="min-width:70px">${par ? volText(par) : 'none'}</span><button data-par="50" aria-label="Higher">+</button></span></div>
    ${lib ? '' : p.recipe?.text ? `<h3>Recipe</h3><p style="white-space:pre-wrap">${esc(p.recipe.text)}</p>` : ''}
    <div class="row" style="margin-top:16px"><button class="btn" data-save="1">Save</button>${lib ? '<button class="btn ghost" data-again="1">Make again</button>' : ''}<button class="btn line sm" data-done="1">Finished / tossed</button></div>`;
  sheet(draw(), (el, close) => el.addEventListener('click', async e => { const t = e.target.closest('button'); if (!t) return;
    try {
      if (t.dataset.q) { qty = Math.max(0, qty + Number(t.dataset.q)); return redraw(el, draw()); }
      if (t.dataset.par) { par = Math.max(0, par + Number(t.dataset.par)); return redraw(el, draw()); }
      if (t.dataset.save || t.dataset.done) { const r = await sb.from('bar_preps').update({ qty_ml: t.dataset.done ? 0 : qty, par_ml: par, updated_at: new Date().toISOString() }).eq('id', id); if (r.error) throw r.error; await loadAll(); close(); return; }
      if (t.dataset.again) { el.remove(); return prepRecipeSheet(p.recipe_key); }
    } catch (er) { fail(er); }
  }));
}
function customPrepSheet() {
  sheet(`<h2>Custom prep</h2><p class="lede">Your own syrup, infusion or batch.</p><form id="cp"><label for="cpn">Name</label><input type="text" id="cpn" required maxlength="120" placeholder="e.g. Toasted coconut syrup">
    <label>Kind</label><select id="cpk">${KINDS.map(([k, l]) => `<option value="${k}">${l}</option>`).join('')}</select>
    <div class="grid2"><div><label for="cpy">Made (ml)</label><input type="number" id="cpy" min="0" value="500"></div><div><label for="cpd">Keeps (days)</label><input type="number" id="cpd" min="1" value="21"></div></div>
    <label for="cpt">Recipe and notes</label><textarea id="cpt" placeholder="250 g coconut, toasted&#10;500 g water…"></textarea>
    <div class="row" style="margin-top:14px"><button class="btn" type="submit">Log batch</button><button class="btn ghost" type="button" data-close>Cancel</button></div></form>`, (el, close) => {
    el.querySelector('#cp').onsubmit = async e => { e.preventDefault(); const g = s => el.querySelector(s).value;
      const r = await sb.from('bar_preps').insert({ household_id: S.household.id, name: g('#cpn').trim(), kind: g('#cpk'), made_on: today(), expires_on: ymd(addDays(new Date(), Number(g('#cpd')) || 21)), qty_ml: Number(g('#cpy')) || 0, recipe: { text: g('#cpt') } });
      if (r.error) return fail(r.error); await loadAll(); close(); };
  });
}

// ---------- your own specs ----------
const UNITS = ['oz', 'ml', 'dash', 'barspoon', 'tsp', 'drops', 'leaves', 'whole', 'rinse', 'top'];
function refOptions() {
  const out = [];
  for (const [k, f] of Object.entries(C.families)) out.push({ ref: { fam: k }, label: f.name, sub: 'any bottle in this group' });
  for (const s of C.styles) out.push({ ref: { style: s.id }, label: s.name, sub: s.cat });
  for (const p of C.preps) out.push({ ref: { prep: p.id }, label: p.name, sub: 'house prep' });
  for (const f of C.fresh) out.push({ ref: { fresh: f.id }, label: f.name, sub: f.group });
  return out;
}
function findRef(text) {
  const t = fold(text).trim(); if (!t) return null;
  const opts = refOptions(); let best = null, bs = 0;
  const words = t.replace(/[^a-z0-9' ]/g, ' ').split(/\s+/).filter(w => w.length > 2);
  for (const o of opts) { const l = fold(o.label); let s = l === t ? 3 : l.includes(t) ? 2 : words.filter(w => l.includes(w)).length / Math.max(words.length, 1); if (o.ref.fam) s += 0.05; if (s > bs) { bs = s; best = o; } }
  return bs >= 0.6 ? best.ref : null;
}
function specEditor(id, preset = null) {
  const row = id ? S.specs.find(s => s.id === id) : null;
  const sp = row ? { name: row.name, family: row.family || 'Sour', glass: row.glass || '', ice: row.ice || '', method: row.method || '', garnish: row.garnish || '', ings: (row.ingredients || []).map(x => ({ ...x })), notes: row.notes || '', parent: row.parent_key }
    : preset ? { name: preset.name, family: preset.family, glass: preset.glass, ice: preset.ice, method: preset.method, garnish: preset.garnish, ings: preset.ings.map(x => ({ ...x })), notes: (preset.notes || []).join('\n'), parent: preset.parent || null }
    : { name: '', family: 'Sour', glass: 'coupe', ice: 'none', method: 'shaken', garnish: '', ings: [{ q: 2, u: 'oz', t: '' }, { q: 0.75, u: 'oz', t: '' }, { q: 0.75, u: 'oz', t: '' }], notes: '', parent: null };
  const opts = refOptions();
  const draw = () => `<h2>${id ? 'Edit spec' : sp.parent ? `Riff on ${esc(LSPEC[sp.parent]?.name || '')}` : 'New house spec'}</h2>
    ${!id ? `<div class="row" style="margin:8px 0 2px"><button class="btn sm ghost" type="button" data-voice="1">${svg('mic')} Describe it</button><button class="btn sm ghost" type="button" data-photo="1">${svg('camera')} From a photo</button></div>` : ''}
    <form id="sf"><label for="sn">Name</label><input type="text" id="sn" value="${esc(sp.name)}" required maxlength="120">
    <div class="grid2"><div><label for="sfam">Style</label><select id="sfam">${FAMS.map(f => `<option ${sp.family === f ? 'selected' : ''}>${f}</option>`).join('')}<option ${!FAMS.includes(sp.family) ? 'selected' : ''}>Other</option></select></div>
      <div><label for="sme">Method</label><select id="sme">${['shaken', 'stirred', 'built', 'swizzled', 'flash-blended', 'blended', 'rolled', 'thrown'].map(m => `<option ${sp.method === m ? 'selected' : ''}>${m}</option>`).join('')}</select></div></div>
    <div class="grid2"><div><label for="sgl">Glass</label><input type="text" id="sgl" value="${esc(sp.glass)}" maxlength="40" list="glasses"></div><div><label for="sic">Ice</label><input type="text" id="sic" value="${esc(sp.ice)}" maxlength="40" list="ices"></div></div>
    <datalist id="glasses">${['coupe', 'Nick & Nora', 'rocks', 'double rocks', 'highball', 'Collins', 'flute', 'julep cup', 'tiki mug', 'wine glass', 'copper mug', 'hurricane'].map(g => `<option value="${g}">`).join('')}</datalist>
    <datalist id="ices">${['none', 'large cube', 'cubes', 'crushed', 'spear', 'pebble'].map(g => `<option value="${g}">`).join('')}</datalist>
    <label for="sga">Garnish</label><input type="text" id="sga" value="${esc(sp.garnish)}" maxlength="200">
    <label>Ingredients</label><div id="ings">${sp.ings.map((i, k) => `<div class="card flat" style="padding:8px;margin-bottom:6px"><div class="row" style="flex-wrap:nowrap;gap:6px">
        <input type="number" step="any" min="0" data-iq="${k}" value="${i.q ?? ''}" style="width:72px" aria-label="Amount"><select data-iu="${k}" style="width:108px" aria-label="Unit">${UNITS.map(u => `<option ${i.u === u ? 'selected' : ''}>${u}</option>`).join('')}</select>
        <input type="text" data-it="${k}" value="${esc(i.ref?.length ? altName(i.ref[0]) : i.t || '')}" placeholder="Ingredient" list="refs" aria-label="Ingredient"><button type="button" class="lnk" data-irm="${k}" aria-label="Remove">${svg('close')}</button></div>
        <span class="imeta" style="display:block;margin-top:4px">${i.ref?.length ? `Linked: ${esc(altName(i.ref[0]))}` : i.t ? 'Not linked to the back bar (won\'t count for "can make")' : ''}</span></div>`).join('')}</div>
    <datalist id="refs">${opts.map(o => `<option value="${esc(o.label)}">${esc(o.sub)}</option>`).join('')}</datalist>
    <button type="button" class="btn sm ghost" data-iadd="1">${svg('plus')} Ingredient</button>
    <label for="sno">Notes</label><textarea id="sno" placeholder="Method details, why it works">${esc(sp.notes)}</textarea>
    <div class="row" style="margin-top:14px"><button class="btn" type="submit">Save</button><button class="btn ghost" type="button" data-close>Cancel</button><span class="sp"></span>${id ? '<button class="btn line sm" type="button" id="sdel">Delete</button>' : ''}</div></form>`;
  sheet(draw(), (el, close) => {
    const keep = () => { const g = s => el.querySelector(s)?.value ?? '';
      Object.assign(sp, { name: g('#sn'), family: g('#sfam'), method: g('#sme'), glass: g('#sgl'), ice: g('#sic'), garnish: g('#sga'), notes: g('#sno') });
      sp.ings = sp.ings.map((i, k) => { const t = g(`[data-it="${k}"]`).trim(), q = g(`[data-iq="${k}"]`), u = g(`[data-iu="${k}"]`);
        const exact = opts.find(o => o.label.toLowerCase() === t.toLowerCase()); const ref = exact ? exact.ref : (i.ref?.length && altName(i.ref[0]) === t ? i.ref[0] : findRef(t));
        return { q: q === '' ? null : Number(q), u, t: ref ? '' : t, ...(ref ? { ref: [ref] } : {}) }; }); };
    const re = () => { keep(); redraw(el, draw()); bind(); };
    const bind = () => {
      el.querySelector('#sf').onsubmit = async e => { e.preventDefault(); keep(); if (!sp.name.trim()) return;
        const row2 = { household_id: S.household.id, name: sp.name.trim(), family: sp.family, glass: sp.glass, ice: sp.ice, method: sp.method, garnish: sp.garnish, ingredients: sp.ings.filter(i => i.t || i.ref), notes: sp.notes || null, parent_key: sp.parent || null, created_by: S.session.user.id };
        const r = id ? await sb.from('bar_specs').update(row2).eq('id', id).select().single() : await sb.from('bar_specs').insert(row2).select().single(); if (r.error) return fail(r.error);
        await loadAll(); close(); specSheet('c:' + r.data.id); };
      el.querySelector('#sdel')?.addEventListener('click', async ev => { if (ev.target.dataset.sure !== '1') { ev.target.dataset.sure = '1'; ev.target.textContent = 'Tap again to delete'; return; }
        const r = await sb.from('bar_specs').delete().eq('id', id); if (r.error) return fail(r.error); await loadAll(); close(); });
    };
    el.addEventListener('click', async e => { const t = e.target.closest('button[type=button]'); if (!t) return;
      if (t.dataset.iadd) { keep(); sp.ings.push({ q: null, u: 'oz', t: '' }); return re(); }
      if (t.dataset.irm != null) { keep(); sp.ings.splice(Number(t.dataset.irm), 1); return re(); }
      if (t.dataset.voice || t.dataset.photo) { try { const got = t.dataset.voice ? await describeSpec() : await specFromPhoto(); if (!got) return;
        Object.assign(sp, { name: got.name || sp.name, family: FAMS.includes(got.family) ? got.family : sp.family, glass: got.glass || sp.glass, ice: got.ice || sp.ice, method: got.method || sp.method, garnish: got.garnish || sp.garnish, notes: got.notes || sp.notes,
          ings: (got.ingredients || []).map(x => { const ref = findRef(x.name); return { q: x.qty ?? null, u: x.unit || 'oz', t: ref ? '' : x.name, ...(ref ? { ref: [ref] } : {}) }; }) });
        redraw(el, draw()); bind(); } catch (er) { fail(er); } }
    });
    bind();
  });
}
function describeSpec() {
  return new Promise(res => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition, native = !!(window.Android && window.Android.canVoice && window.Android.canVoice());
    const el = sheet(`<h2>Describe the drink</h2><p class="lede">Say or type the spec the way you'd tell a bartender: "two ounces rye, three quarters sweet vermouth, quarter ounce Bénédictine, two dashes Peychaud's, stirred, coupe, lemon twist."</p>
      <textarea id="dt" style="min-height:140px" placeholder="Talk or type…"></textarea>
      <div class="row" style="margin-top:12px">${SR || native ? `<button class="btn ghost" id="dm">${svg('mic')} Talk</button>` : ''}<button class="btn" id="dgo">Write it up</button><button class="btn line" data-close>Cancel</button></div>`, (el2, close) => {
      const ta = el2.querySelector('#dt');
      el2.querySelector('#dm')?.addEventListener('click', () => {
        if (native) { window.__voiceResult = txt => { ta.value = (ta.value + ' ' + txt).trim(); }; window.Android.startVoice('Describe the drink'); return; }
        const r = new SR(); r.lang = 'en-US'; r.interimResults = false; r.continuous = true; r.onresult = ev => { for (let k = ev.resultIndex; k < ev.results.length; k++) if (ev.results[k].isFinal) ta.value = (ta.value + ' ' + ev.results[k][0].transcript).trim(); }; r.start(); setTimeout(() => { try { r.stop(); } catch (_) { } }, 30000);
      });
      el2.querySelector('#dgo').onclick = async () => { const t = ta.value.trim(); if (t.length < 8) return; redraw(el2, `<div class="spin"></div><p class="lede" style="text-align:center">Writing up the spec…</p>`);
        try { const out = await ai('spec_voice', { transcript: t }); el2.remove(); res(out.spec); } catch (er) { el2.remove(); fail(er); res(null); } };
    }, { onClose: () => res(null) });
  });
}
async function specFromPhoto() { const [f] = await pickPhotos(false); if (!f) return null; toast('Reading the spec…'); const out = await ai('spec_photo', { image: await fileToB64(f), media_type: 'image/jpeg' }); return out.spec; }

// ---------- batching & tools ----------
function batchSheet(key, servings = 8) {
  let k = key || allSpecs()[0]?.id, n = servings, water = true, dil = null;
  const draw = () => { const sp = specByKey(k); if (!sp) return '<p>Pick a drink.</p>';
    const d = dil ?? DILUTION(sp.method), rows = sp.ings.filter(i => mlOf(i.q, i.u) > 0 && i.u !== 'top'), tot = rows.reduce((a, i) => a + mlOf(i.q, i.u) * n, 0), w = water ? tot * d : 0;
    const citrus = sp.ings.some(i => /juice|egg|cream|milk/.test(i.ref?.[0]?.fresh || '') || /juice/.test(i.t || '')), top = sp.ings.find(i => i.u === 'top' || i.ref?.[0]?.style?.startsWith('mix-') || i.ref?.[0]?.fam === 'sparkling');
    const nums = drinkNumbers(sp);
    return `<h2>Batch</h2><label for="bk">Drink</label><select id="bk">${allSpecs().slice().sort((a, b) => a.name.localeCompare(b.name)).map(s => `<option value="${esc(s.id)}" ${s.id === k ? 'selected' : ''}>${esc(s.name)}</option>`).join('')}</select>
      <div class="row" style="justify-content:space-between;margin-top:12px"><span class="iname">Servings</span><span class="stepper"><button data-n="-1" aria-label="Fewer">−</button><span>${n}</span><button data-n="1" aria-label="More">+</button></span></div>
      <div class="chips" style="margin-top:8px">${[4, 8, 12, 16, 25, 40].map(x => `<button class="chip" data-nn="${x}" aria-pressed="${n === x}">${x}</button>`).join('')}</div>
      <div class="row" style="justify-content:space-between;margin-top:12px"><label style="margin:0;display:flex;gap:8px;align-items:center;color:var(--ink)"><input type="checkbox" id="bw" ${water ? 'checked' : ''} style="width:20px;height:20px;accent-color:var(--brass)"> Add dilution water (to serve straight from the fridge or freezer)</label></div>
      ${water ? `<div class="row" style="justify-content:space-between;margin-top:6px"><span class="imeta">Dilution</span><span class="stepper"><button data-d="-0.02" aria-label="Less">−</button><span style="min-width:52px">${Math.round(d * 100)}%</span><button data-d="0.02" aria-label="More">+</button></span></div>` : ''}
      <table class="batch" style="margin-top:12px"><tr><th>Ingredient</th><th style="text-align:right">Total</th><th style="text-align:right">ml</th></tr>
      ${rows.map(i => `<tr><td>${esc(ingLabel(i))}</td><td class="n">${esc(amtText(i, n))}</td><td class="n">${Math.round(mlOf(i.q, i.u) * n)}</td></tr>`).join('')}
      ${water ? `<tr><td>Filtered water</td><td class="n">${volText(w)}</td><td class="n">${Math.round(w)}</td></tr>` : ''}
      <tr class="tot"><td>Total</td><td class="n">${volText(tot + w)}</td><td class="n">${Math.round(tot + w)}</td></tr></table>
      <p class="imeta" style="margin-top:10px">${(Math.round((tot + w) / 750 * 10) / 10)} × 750 ml bottles · ${volText((tot + w) / n)} per drink · ≈ ${nums.abv.toFixed(0)}% ABV${nums.cost ? ` · ${money(nums.cost * n)} total` : ''}</p>
      ${citrus ? `<p class="imeta" style="color:var(--brass)">Fresh citrus, egg and dairy fade fast: batch the spirits and sweeteners ahead, add juice within 4 hours, and shake to order${water ? ' (then skip the water)' : ''}.</p>` : ''}
      ${top ? `<p class="imeta">Top each drink with ${esc(ingLabel(top))} as you serve; it's not in the batch.</p>` : ''}
      ${/stir/i.test(sp.method) && water ? `<p class="imeta">Stirred batches: keep in the freezer and pour straight into a chilled glass.</p>` : ''}`; };
  sheet(draw(), (el, close) => {
    const bind = () => { el.querySelector('#bk')?.addEventListener('change', e => { k = e.target.value; dil = null; redraw(el, draw()); bind(); }); el.querySelector('#bw')?.addEventListener('change', e => { water = e.target.checked; redraw(el, draw()); bind(); }); };
    el.addEventListener('click', e => { const t = e.target.closest('button'); if (!t) return;
      if (t.dataset.n) { n = clamp(n + Number(t.dataset.n), 1, 200); } else if (t.dataset.nn) { n = Number(t.dataset.nn); } else if (t.dataset.d) { const sp = specByKey(k); dil = clamp((dil ?? DILUTION(sp.method)) + Number(t.dataset.d), 0, 0.6); } else return;
      redraw(el, draw()); bind(); });
    bind();
  });
}
function toolsSheet() {
  let tool = 'syrup', ratio = 1, ml = 500, abvA = 40, abvB = 0, volA = 2, volB = 1, conv = 1, convU = 'oz';
  const draw = () => {
    let body = '';
    if (tool === 'syrup') { const sugar = ml * ratio / (ratio + 1) * 1.33, waterG = sugar / ratio; // syrup density ~1.33 for 1:1 approx
      const s = ratio / (ratio + 1), dens = 1 + 0.38 * s * 1.4, mass = ml * dens, sg = mass * ratio / (ratio + 1), wg = mass / (ratio + 1);
      body = `<p class="imeta">Sugar and water by weight for the syrup you want.</p><label>Ratio (sugar : water)</label><div class="chips">${[[1, '1:1'], [1.5, '1.5:1'], [2, '2:1 rich']].map(([r, l]) => `<button class="chip" data-ratio="${r}" aria-pressed="${ratio === r}">${l}</button>`).join('')}</div>
        <label>Syrup wanted</label><div class="chips">${[250, 500, 750, 1000, 2000].map(v => `<button class="chip" data-ml="${v}" aria-pressed="${ml === v}">${volText(v)}</button>`).join('')}</div>
        <div class="calc" style="margin-top:14px"><span>Sugar</span><span class="v">${Math.round(sg)} g</span><span>Water</span><span class="v">${Math.round(wg)} g</span><span>Brix</span><span class="v">${Math.round(s * 100)}°</span></div>
        <p class="imeta" style="margin-top:10px">Swapping 1:1 for 2:1 in a spec? Use about two-thirds as much rich syrup (¾ oz simple ≈ ½ oz rich).</p>`; }
    if (tool === 'abv') { const alc = volA * abvA + volB * abvB, v = volA + volB;
      body = `<p class="imeta">Proof down a spirit or check a mix: two parts, any unit.</p>
        <div class="grid2"><div><label for="ta">Spirit ABV %</label><input type="number" id="ta" value="${abvA}" step="0.1"></div><div><label for="tva">Amount</label><input type="number" id="tva" value="${volA}" step="0.25"></div>
        <div><label for="tb">Second ABV % (water = 0)</label><input type="number" id="tb" value="${abvB}" step="0.1"></div><div><label for="tvb">Amount</label><input type="number" id="tvb" value="${volB}" step="0.25"></div></div>
        <div class="calc" style="margin-top:14px"><span>Mixed ABV</span><span class="v">${v ? (alc / v).toFixed(1) : 0}%</span><span>Proof (US)</span><span class="v">${v ? (alc / v * 2).toFixed(0) : 0}</span></div>`; }
    if (tool === 'convert') { const mlv = mlOf(conv, convU);
      body = `<div class="row" style="flex-wrap:nowrap;gap:8px"><input type="number" id="cv" value="${conv}" step="0.25" style="width:110px"><select id="cu">${['oz', 'ml', 'cl', 'tsp', 'barspoon', 'tbsp', 'dash', 'cup', 'bottle'].map(u => `<option ${u === convU ? 'selected' : ''}>${u}</option>`).join('')}</select></div>
        <div class="calc" style="margin-top:14px"><span>Milliliters</span><span class="v">${Math.round(mlv * 10) / 10}</span><span>Ounces</span><span class="v">${frac(Math.round(mlv / OZ_ML * 100) / 100)}</span><span>Barspoons</span><span class="v">${Math.round(mlv / 5 * 10) / 10}</span><span>Dashes</span><span class="v">${Math.round(mlv / 0.8)}</span></div>
        <p class="imeta" style="margin-top:8px">Bar math: 1 oz = 30 ml, 1 barspoon = 5 ml, 1 dash ≈ 0.8 ml.</p>`; }
    return `<h2>Bar tools</h2><div class="seg" role="group" aria-label="Tool" style="margin:10px 0 6px"><button data-tool="syrup" aria-pressed="${tool === 'syrup'}">Syrup</button><button data-tool="abv" aria-pressed="${tool === 'abv'}">ABV</button><button data-tool="convert" aria-pressed="${tool === 'convert'}">Convert</button><button data-tool="batch">Batch</button></div>${body}`;
  };
  sheet(draw(), (el, close) => {
    const re = () => { redraw(el, draw()); bind(); };
    const bind = () => { for (const [s, set] of [['#ta', v => abvA = v], ['#tb', v => abvB = v], ['#tva', v => volA = v], ['#tvb', v => volB = v], ['#cv', v => conv = v]]) el.querySelector(s)?.addEventListener('change', e => { set(Number(e.target.value) || 0); re(); });
      el.querySelector('#cu')?.addEventListener('change', e => { convU = e.target.value; re(); }); };
    el.addEventListener('click', e => { const t = e.target.closest('button'); if (!t) return;
      if (t.dataset.tool === 'batch') { el.remove(); return batchSheet(); }
      if (t.dataset.tool) { tool = t.dataset.tool; return re(); } if (t.dataset.ratio) { ratio = Number(t.dataset.ratio); return re(); } if (t.dataset.ml) { ml = Number(t.dataset.ml); return re(); } });
    bind();
  });
}

// ---------- hosting ----------
function eventEditor(id) {
  const ev = S.events.find(e => e.id === id) || { name: '', day: ymd(addDays(new Date(), 7)), guests: 8, drinks: [], notes: '' };
  const drinks = (ev.drinks || []).map(d => ({ ...d }));
  let q = '';
  const draw = () => { const qq = fold(q).trim(), res = qq.length >= 2 ? allSpecs().filter(s => fold(s.name).includes(qq) && !drinks.some(d => d.key === s.id)).sort((a, b) => (fold(b.name) === qq) - (fold(a.name) === qq) || fold(b.name).startsWith(qq) - fold(a.name).startsWith(qq) || a.name.length - b.name.length).slice(0, 8) : [];
    return `<h2>${id ? 'Edit menu' : 'New menu'}</h2><form id="ef"><label for="en">Occasion</label><input type="text" id="en" value="${esc(ev.name)}" required maxlength="120" placeholder="Friday night, Holiday party…">
    <div class="grid2"><div><label for="ed">Date</label><input type="date" id="ed" value="${esc(ev.day || '')}"></div><div><label for="eg">Guests</label><input type="number" id="eg" min="1" max="500" value="${ev.guests ?? ''}"></div></div>
    <label>On the menu</label>${drinks.length ? `<div class="card flat" style="padding:2px 12px">${drinks.map((d, k) => `<div class="item"><span class="grow iname">${esc(specByKey(d.key)?.name || '?')}</span><button type="button" class="lnk" data-drm="${k}" aria-label="Remove">${svg('close')}</button></div>`).join('')}</div>` : '<p class="imeta">Add 3–5 drinks: something stirred, something shaken, something long, one low-proof.</p>'}
    <div class="search" style="margin-top:8px">${svg('search')}<input type="search" id="eq" placeholder="Add a drink" value="${esc(q)}" autocomplete="off" aria-label="Add a drink"></div>
    <div id="eres">${res.map(s => `<button type="button" class="tap item" data-dadd="${esc(s.id)}"><span class="grow"><span class="iname">${esc(s.name)}</span><span class="imeta" style="display:block">${esc(s.family)}${specStatus(s).ok ? ' · ready' : ''}</span></span>${svg('plus')}</button>`).join('')}</div>
    <label for="eno">Notes</label><textarea id="eno">${esc(ev.notes || '')}</textarea>
    <div class="row" style="margin-top:14px"><button class="btn" type="submit">Save</button><button class="btn ghost" type="button" data-close>Cancel</button><span class="sp"></span>${id ? '<button class="btn line sm" type="button" id="edel">Delete</button>' : ''}</div></form>`; };
  sheet(draw(), (el, close) => {
    const keep = () => { ev.name = el.querySelector('#en').value; ev.day = el.querySelector('#ed').value; ev.guests = el.querySelector('#eg').value ? Number(el.querySelector('#eg').value) : null; ev.notes = el.querySelector('#eno').value; };
    const re = () => { keep(); redraw(el, draw()); bind(); const i = el.querySelector('#eq'); i.focus(); i.setSelectionRange(i.value.length, i.value.length); };
    const bind = () => { el.querySelector('#eq').oninput = e => { q = e.target.value; keep(); el.querySelector('#eres').innerHTML = ''; re(); };
      el.querySelector('#ef').onsubmit = async e => { e.preventDefault(); keep(); const row = { household_id: S.household.id, name: ev.name.trim(), day: ev.day || null, guests: ev.guests, drinks, notes: ev.notes || null };
        const r = id ? await sb.from('bar_events').update(row).eq('id', id).select().single() : await sb.from('bar_events').insert(row).select().single(); if (r.error) return fail(r.error); await loadAll(); close(); eventSheet(r.data.id); };
      el.querySelector('#edel')?.addEventListener('click', async ev2 => { if (ev2.target.dataset.sure !== '1') { ev2.target.dataset.sure = '1'; ev2.target.textContent = 'Tap again to delete'; return; } const r = await sb.from('bar_events').delete().eq('id', id); if (r.error) return fail(r.error); await loadAll(); close(); }); };
    el.addEventListener('click', e => { const t = e.target.closest('button[type=button]'); if (!t) return;
      if (t.dataset.dadd) { drinks.push({ key: t.dataset.dadd }); q = ''; return re(); } if (t.dataset.drm != null) { drinks.splice(Number(t.dataset.drm), 1); return re(); } });
    bind();
  });
}
/** Servings per drink: about 2.5 drinks a guest over an evening, split across the menu. */
const servingsFor = ev => { const d = (ev.drinks || []).length || 1; return Math.max(1, Math.ceil((ev.guests || 6) * 2.5 / d)); };
function eventNeeds(ev) {
  const per = servingsFor(ev), spirits = new Map(), preps = new Map(), fresh = new Map();
  for (const d of ev.drinks || []) { const sp = specByKey(d.key); if (!sp) continue; const n = d.n || per;
    for (const i of sp.ings) { const ml = mlOf(i.q, i.u) * n, a = i.ref?.[0]; if (!a) continue;
      if (a.prep) { preps.set(a.prep, (preps.get(a.prep) || 0) + ml); continue; }
      if (a.fresh) { const cur = fresh.get(a.fresh) || { ml: 0, n: 0 }; cur.ml += ml; cur.n += (i.u === 'whole' || i.u === 'leaves' || i.u === 'slices' || i.u === 'wedges' ? (i.q || 1) * n : 0); fresh.set(a.fresh, cur); continue; }
      const key = a.style ? (STY[a.style]?.fam || a.style) : a.fam; const cur = spirits.get(key) || { ml: 0, alt: a.style ? { fam: STY[a.style]?.fam } : a }; cur.ml += ml; spirits.set(key, cur); } }
  return { per, spirits, preps, fresh };
}
const juiceYield = { 'lemon-juice': ['lemons', 30], 'lime-juice': ['limes', 22], 'orange-juice': ['oranges', 75], 'grapefruit-juice': ['grapefruit', 150], 'egg-white': ['eggs', 30] };
function eventSheet(id) {
  const ev = S.events.find(e => e.id === id); if (!ev) return;
  const draw = () => { const nd = eventNeeds(ev), per = nd.per;
    const sp = [...nd.spirits.entries()].map(([k, v]) => { const have = (C.families[k]?.styles || []).flatMap(s => S.bottles.filter(b => b.style_id === s)).reduce((a, b) => a + Number(b.fill_ml) + Number(b.sealed || 0) * Number(b.size_ml), 0);
      return { name: altName(v.alt) || famName(k), need: v.ml, have, short: Math.max(0, v.ml - have) }; }).sort((a, b) => b.need - a.need);
    const pr = [...nd.preps.entries()].map(([pid, ml]) => ({ pid, ml, have: prepRows(pid).filter(prepLive).reduce((a, p) => a + Number(p.qty_ml), 0) }));
    const fr = [...nd.fresh.entries()].filter(([fid]) => !['sugar-white', 'kosher-salt'].includes(fid)).map(([fid, v]) => { const jy = juiceYield[fid]; return { name: jy ? jy[0] : FRESH[fid]?.name || fid, qty: jy ? Math.ceil(v.ml / jy[1]) : v.n ? Math.ceil(v.n) : null, ml: v.ml, fid }; });
    return `<div class="eyebrow">${ev.day ? new Date(parseYmd(ev.day)).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }) : 'No date set'}</div><h2>${esc(ev.name)}</h2>
      <p class="lede">${ev.guests || '?'} guests · about ${per} of each drink</p>
      <div class="row"><button class="btn sm" data-guestmenu="1">Guest menu</button><button class="btn sm ghost" data-editev="1">${svg('edit')} Edit</button><button class="btn sm ghost" data-shopev="1">${svg('cart')} Add shortfalls to list</button></div>
      <h3>Menu</h3><div class="card">${(ev.drinks || []).map(d => { const s = specByKey(d.key); if (!s) return ''; const st = specStatus(s);
        return `<div class="item"><span class="grow"><span class="iname">${esc(s.name)}</span><span class="imeta" style="display:block">${st.ok ? 'Ready' : `Missing ${st.missing.map(m => altName(m.i.ref[0])).join(', ')}`}</span></span><button class="btn sm ghost" data-batchev="${esc(s.id)}">Batch ${per}</button></div>`; }).join('') || '<p class="imeta">No drinks yet.</p>'}</div>
      ${sp.length ? `<h3>Spirits &amp; modifiers</h3><div class="card">${sp.map(x => `<div class="item"><span class="grow"><span class="iname">${esc(x.name)}</span><span class="imeta" style="display:block">Need ${volText(x.need)} · have ${volText(x.have)}</span></span>${x.short ? `<span class="pill bad">Short ${Math.ceil(x.short / 750)} bottle${Math.ceil(x.short / 750) > 1 ? 's' : ''}</span>` : '<span class="pill ok">Covered</span>'}</div>`).join('')}</div>` : ''}
      ${pr.length ? `<h3>Prep list</h3><div class="card">${pr.map(x => `<div class="item"><span class="grow"><span class="iname">${esc(PREP[x.pid]?.name || x.pid)}</span><span class="imeta" style="display:block">Need ${volText(x.ml)}${x.have ? ` · have ${volText(x.have)}` : ''}</span></span>${x.have >= x.ml ? '<span class="pill ok">Ready</span>' : `<button class="btn sm ghost" data-prep-lib="${esc(x.pid)}">Make</button>`}</div>`).join('')}</div>` : ''}
      ${fr.length ? `<h3>Fresh</h3><div class="card">${fr.map(x => `<div class="item"><span class="grow iname">${esc(x.name)}</span><span class="imeta">${x.qty ? `about ${x.qty}` : volText(x.ml)}</span></div>`).join('')}</div>` : ''}
      ${ev.notes ? `<h3>Notes</h3><p style="white-space:pre-wrap">${esc(ev.notes)}</p>` : ''}`; };
  sheet(draw(), (el, close) => el.addEventListener('click', async e => { const t = e.target.closest('button'); if (!t) return;
    try {
      if (t.dataset.editev) { el.remove(); return eventEditor(id); }
      if (t.dataset.batchev) { el.remove(); return batchSheet(t.dataset.batchev, servingsFor(ev)); }
      if (t.dataset.prepLib) { el.remove(); return prepRecipeSheet(t.dataset.prepLib); }
      if (t.dataset.guestmenu) { el.remove(); return guestMenu(ev); }
      if (t.dataset.shopev) { const nd = eventNeeds(ev); const items = [];
        for (const [k, v] of nd.spirits) { const have = (C.families[k]?.styles || []).flatMap(s => S.bottles.filter(b => b.style_id === s)).reduce((a, b) => a + Number(b.fill_ml) + Number(b.sealed || 0) * Number(b.size_ml), 0); const short = v.ml - have; if (short > 0) items.push({ name: altName(v.alt) || famName(k), qty: Math.ceil(short / 750), unit: 'bottle' }); }
        for (const [fid, v] of nd.fresh) { const jy = juiceYield[fid]; if (jy) items.push({ name: jy[0][0].toUpperCase() + jy[0].slice(1), qty: Math.ceil(v.ml / jy[1]), category: 'Produce' }); else if (!freshHave(fid)) items.push({ name: FRESH[fid]?.name || fid, category: 'Produce' }); }
        const n = await addToList(items); toast(n ? `${n} item${n === 1 ? '' : 's'} added to the Bar list` : 'Nothing short'); }
    } catch (er) { fail(er); }
  }));
}
function guestMenu(ev) {
  const desc = sp => sp.ings.filter(i => i.ref?.length && !/^dash|^drop|^rinse/.test(i.u) && !i.ref[0].fresh?.includes('sugar')).map(i => { const a = i.ref[0]; return a.prep ? PREP[a.prep]?.name : a.fresh ? FRESH[a.fresh]?.name.replace(/ \(fresh\)/, '') : a.style ? STY[a.style]?.name : famName(a.fam); }).filter(Boolean).slice(0, 4).join(', ').toLowerCase();
  sheet(`<div class="menu-card"><div class="eyebrow">${esc(S.household.name)}</div><h2>${esc(ev.name)}</h2><p class="imeta" style="margin:0 0 10px">${ev.day ? new Date(parseYmd(ev.day)).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }) : ''}</p>
    ${(ev.drinks || []).map(d => specByKey(d.key)).filter(Boolean).map(sp => `<div class="mi"><b>${esc(sp.name)}</b><i>${esc(desc(sp))}</i></div>`).join('')}</div>
    <div class="row noprint" style="margin-top:14px"><button class="btn" onclick="window.print()">Print</button><button class="btn ghost" data-close>Close</button></div>`);
}

// ---------- household ----------
const GEAR = { glass: ['Coupe', 'Nick & Nora', 'Rocks / Old Fashioned', 'Double rocks', 'Highball', 'Collins', 'Julep cup', 'Tiki mug', 'Flute', 'Wine glass', 'Copper mug', 'Hurricane', 'Punch bowl & cups', 'Irish coffee glass'],
  tool: ['Jigger (1 & 2 oz)', 'Japanese jigger', 'Shaker tins', 'Mixing glass', 'Barspoon', 'Hawthorne strainer', 'Julep strainer', 'Fine strainer', 'Muddler', 'Y-peeler', 'Citrus press', 'Lewis bag & mallet', 'Swizzle stick', 'Atomizer', 'Digital scale', 'iSi whipper', 'Refractometer', 'Ice pick'],
  ice: ['Large cube molds', 'Clear ice cooler', 'Sphere molds', 'Collins spear molds', 'Pebble / crushed ice'] };
function gearAdd() {
  sheet(`<h2>Add glassware &amp; tools</h2>${Object.entries(GEAR).map(([k, items]) => `<h3>${k === 'glass' ? 'Glassware' : k === 'tool' ? 'Tools' : 'Ice'}</h3><div class="chips">${items.map(n => `<button class="chip" data-g="${esc(n)}" data-k="${k}" aria-pressed="${S.gear.some(g => g.name === n)}">${esc(n)}</button>`).join('')}</div>`).join('')}
    <form id="gf" style="margin-top:14px"><label for="gn">Something else</label><div class="row" style="flex-wrap:nowrap"><input type="text" id="gn" maxlength="80" placeholder="e.g. Vintage Nick & Noras"><select id="gk" style="width:120px"><option value="glass">Glass</option><option value="tool">Tool</option><option value="ice">Ice</option></select><button class="btn sm">Add</button></div></form>`, (el, close) => {
    el.addEventListener('click', async e => { const t = e.target.closest('[data-g]'); if (!t) return; const have = S.gear.find(g => g.name === t.dataset.g);
      try { if (have) await sb.from('bar_gear').delete().eq('id', have.id); else await sb.from('bar_gear').insert({ household_id: S.household.id, kind: t.dataset.k, name: t.dataset.g, qty: t.dataset.k === 'glass' ? 4 : 1 }); await loadAll(); t.setAttribute('aria-pressed', !have); } catch (er) { fail(er); } });
    el.querySelector('#gf').onsubmit = async e => { e.preventDefault(); const n = el.querySelector('#gn').value.trim(); if (!n) return; const r = await sb.from('bar_gear').insert({ household_id: S.household.id, kind: el.querySelector('#gk').value, name: n, qty: 1 }); if (r.error) return fail(r.error); await loadAll(); el.querySelector('#gn').value = ''; toast(`${n} added`); };
  });
}
function householdSheet() {
  const t = lsGet('bhb_theme', 'dark');
  sheet(`<h2>${esc(S.household.name)}</h2><p class="lede">Shared with We're Cooked: the same household, family and shopping lists.</p>
    <div class="card"><div class="imeta">Invite code. Family sign in, then enter this to join.</div><div class="row" style="margin-top:6px"><b style="font:800 26px var(--serif);letter-spacing:.12em">${esc(S.household.invite_code)}</b><span class="sp"></span><button class="btn sm ghost" data-copy="1">Copy</button></div></div>
    <h3>Members</h3><div class="card">${S.members.map(m => `<div class="item"><span class="grow iname">${esc(m.display_name)}${m.user_id === S.session.user.id ? ' (you)' : ''}</span><span class="imeta">${m.role === 'owner' ? 'Owner' : 'Member'}</span></div>`).join('')}</div>
    <h3>Measurements</h3><div class="seg" role="group" aria-label="Units"><button data-u="oz" aria-pressed="${S.units === 'oz'}">Ounces</button><button data-u="ml" aria-pressed="${S.units === 'ml'}">Milliliters</button></div>
    <h3>Appearance</h3><div class="seg" role="group" aria-label="Appearance"><button data-th="dark" aria-pressed="${t === 'dark'}">After hours</button><button data-th="light" aria-pressed="${t === 'light'}">Daylight</button><button data-th="system" aria-pressed="${t === 'system'}">Match phone</button></div>
    <div class="row" style="margin-top:20px"><a class="btn ghost" href="${IS_APP ? '#' : '../'}" ${IS_APP ? 'data-wc="1"' : ''}>Open We're Cooked</a><button class="btn line" data-signout="1">Sign out</button></div>`, (el, close) => el.addEventListener('click', async e => {
    const b = e.target.closest('button,a'); if (!b) return;
    if (b.dataset.copy) { try { await navigator.clipboard.writeText(`Join our home bar on Back Home Bar: ${WEB_HOME} · invite code ${S.household.invite_code}`); toast('Invite copied'); } catch (_) { toast(S.household.invite_code); } }
    if (b.dataset.u) { S.units = b.dataset.u; lsSet('bhb_units', S.units); el.querySelectorAll('[data-u]').forEach(x => x.setAttribute('aria-pressed', x === b)); }
    if (b.dataset.th) { lsSet('bhb_theme', b.dataset.th); document.documentElement.style.colorScheme = b.dataset.th === 'system' ? 'light dark' : b.dataset.th; el.querySelectorAll('[data-th]').forEach(x => x.setAttribute('aria-pressed', x === b)); }
    if (b.dataset.wc) { e.preventDefault(); window.Android.openExternal('https://nychawg.github.io/werecooked/'); }
    if (b.dataset.signout) { await sb.auth.signOut(); el.remove(); }
  }));
}

// ---------- auth ----------
const GOOGLE_G = '<svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>';
function authView(mode = 'in', msg = '') {
  $('#app').innerHTML = `<main><div class="auth">${MARK}<h1>Back Home Bar</h1><p class="lede" style="text-align:center">Your back bar, your specs, your house preps. Same sign-in as We're Cooked.</p>
    <button class="btn google" id="gbtn" type="button">${GOOGLE_G} Continue with Google</button>
    <form id="auth" class="card"><label for="ae" style="margin-top:0">Email</label><input type="email" id="ae" required autocomplete="email"><label for="ap">Password</label><input type="password" id="ap" required minlength="6" autocomplete="${mode === 'in' ? 'current-password' : 'new-password'}">
    <button class="btn wide" style="margin-top:14px">${mode === 'in' ? 'Sign in' : 'Create account'}</button><div class="err" id="aerr">${esc(msg)}</div></form>
    <button class="lnk" id="swap" style="text-align:center">${mode === 'in' ? 'New here? Create an account' : 'Have an account? Sign in'}</button></div></main>`;
  $('#swap').onclick = () => authView(mode === 'in' ? 'up' : 'in');
  $('#gbtn').onclick = async () => { const redirectTo = IS_APP ? 'backhomebar://auth-callback' : location.origin + location.pathname;
    const r = await sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo, skipBrowserRedirect: IS_APP, queryParams: { prompt: 'select_account' } } }); if (r.error) return ($('#aerr').textContent = r.error.message); if (IS_APP) window.Android.openExternal(r.data.url); };
  $('#auth').onsubmit = async e => { e.preventDefault(); const email = $('#ae').value.trim(), password = $('#ap').value; const btn = e.target.querySelector('button'); btn.disabled = true;
    const r = mode === 'in' ? await sb.auth.signInWithPassword({ email, password }) : await sb.auth.signUp({ email, password, options: { emailRedirectTo: IS_APP ? WEB_HOME : location.origin + location.pathname } });
    btn.disabled = false; if (r.error) return ($('#aerr').textContent = r.error.message); if (mode === 'up' && !r.data.session) authView('in', 'Check your email for a confirmation link, then sign in here.'); };
}
window.__authCallback = async url => { try { const u = new URL(url); const code = u.searchParams.get('code'), err = u.searchParams.get('error_description'); if (err) return authView('in', err); if (code) { const r = await sb.auth.exchangeCodeForSession(code); if (r.error) authView('in', r.error.message); } } catch (e) { fail(e); } };
function onboardView() {
  $('#app').innerHTML = `<main><div class="auth">${MARK}<h1 style="font-size:28px">Set up your household</h1><p class="lede" style="text-align:center">Already on We're Cooked? Join with your family's invite code and everything is shared.</p>
    <form id="jn" class="card"><h3 style="margin-top:0">Join a household</h3><label for="ic">Invite code</label><input type="text" id="ic" required maxlength="6" style="text-transform:uppercase"><label for="jy">Your name</label><input type="text" id="jy" required maxlength="40"><button class="btn wide" style="margin-top:14px">Join</button></form>
    <form id="mk" class="card"><h3 style="margin-top:0">Start a new household</h3><label for="hn">Household name</label><input type="text" id="hn" required maxlength="80" placeholder="The Carter House"><label for="yn">Your name</label><input type="text" id="yn" required maxlength="40"><button class="btn wide" style="margin-top:14px">Create</button></form>
    <div class="err" id="oerr"></div><button class="btn line sm" id="so">Sign out</button></div></main>`;
  $('#mk').onsubmit = async e => { e.preventDefault(); const r = await sb.rpc('create_household', { p_name: $('#hn').value, p_display_name: $('#yn').value }); if (r.error) return ($('#oerr').textContent = r.error.message); await enter(); };
  $('#jn').onsubmit = async e => { e.preventDefault(); const r = await sb.rpc('join_household', { p_code: $('#ic').value, p_display_name: $('#jy').value }); if (r.error) return ($('#oerr').textContent = r.error.message); await enter(); };
  $('#so').onclick = () => sb.auth.signOut();
}
async function refreshMe() { const r = await sb.from('members').select('*').eq('user_id', S.session.user.id).maybeSingle(); if (r.error) throw r.error; S.me = r.data;
  if (S.me) { const h = await sb.from('households').select('*').eq('id', S.me.household_id).single(); if (h.error) throw h.error; S.household = h.data; } else S.household = null; }
let channel = null, reloadT;
function subscribe() {
  if (channel) sb.removeChannel(channel);
  channel = sb.channel('bar-' + S.household.id); const f = `household_id=eq.${S.household.id}`;
  for (const t of ['bar_bottles', 'bar_preps', 'bar_specs', 'bar_spec_meta', 'bar_events', 'bar_gear', 'shopping_items', 'shopping_lists', 'households', 'members'])
    channel.on('postgres_changes', { event: '*', schema: 'public', table: t, filter: t === 'households' ? `id=eq.${S.household.id}` : f }, () => { if (Date.now() < quietUntil) return; clearTimeout(reloadT); reloadT = setTimeout(async () => { try { if (t === 'households') await refreshMe(); await loadAll(); softRender(); } catch (_) { } }, 400); });
  channel.subscribe();
}
async function enter() { try { await refreshMe(); if (S.household) { S.loaded = false; render(); if (!C.styles.length) await loadCatalog(); await loadAll(); subscribe(); } render(); } catch (e) { fail(e); } }

// ---------- taps ----------
document.addEventListener('click', async e => {
  const t = e.target.closest('button, [data-act]'); if (!t || t.closest('.sheet')) return;
  const a = t.dataset.act;
  try {
    if (t.dataset.tab) { S.tab = t.dataset.tab; render(); $('#main').scrollTop = 0; return; }
    if (a === 'theme') return setTheme(isDark() ? 'light' : 'dark');
    if (a === 'household') return householdSheet();
    if (a === 'addbottle') return addBottleSheet(t.dataset.cat || '');
    if (a === 'scanshelf') return scanShelf();
    if (a === 'batchcalc') return batchSheet();
    if (a === 'tools') return toolsSheet();
    if (a === 'ask') return askSheet();
    if (t.dataset.homeready != null) { S.homeReady = t.dataset.homeready === '1'; return render(); }
    if (t.dataset.gocat) { S.tab = 'bar'; S.barCat = t.dataset.gocat; S.barView = S.barView === 'fresh' ? 'shelf' : S.barView; render(); $('#main').scrollTop = 0; return; }
    if (a === 'lowlist') { S.tab = 'bar'; S.barView = 'list'; S.barCat = ''; render(); $('#main').scrollTop = 0; return; }
    if (t.dataset.askq) return askSheet(t.dataset.askq);
    if (a === 'barcode') return scanBarcode();
    if (a === 'pournext') { S.pourSkip = (S.pourSkip || 0) + 1; return render(); }
    if (a === 'nexttip') { S.tipSkip = (S.tipSkip || 0) + 1; return render(); }
    if (a === 'cannow') { S.tab = 'specs'; S.specView = 'can'; render(); $('#main').scrollTop = 0; return; }
    if (a === 'surprise') { const can = allSpecs().filter(s => specStatus(s).ok); const favs = can.filter(s => metaOf(s.id).favorite); const pool = favs.length && Math.random() < 0.6 ? favs : can; return specSheet(pool[Math.floor(Math.random() * pool.length)].id); }
    if (a === 'newspec') return specEditor(null);
    if (a === 'customprep') return customPrepSheet();
    if (a === 'newevent') return eventEditor(null);
    if (a === 'addgear') return gearAdd();
    if (a === 'additem') { const name = prompt('Add to the Bar list'); if (name && name.trim()) { await addToList([{ name: name.trim() }]); render(); } return; }
    if (a === 'putaway') { const done = S.list.filter(x => x.checked); let n = 0;
      for (const x of done) { const b = S.bottles.find(b => b.name.toLowerCase() === x.name.toLowerCase()); if (b) { const add = Math.max(1, Math.round(Number(x.qty) || 1)); const r = await sb.from('bar_bottles').update({ sealed: (Number(b.sealed) || 0) + (Number(b.fill_ml) > 0 ? add : add - 1), fill_ml: Number(b.fill_ml) > 0 ? b.fill_ml : b.size_ml, updated_at: new Date().toISOString() }).eq('id', b.id); if (!r.error) n++; } }
      await sb.from('shopping_items').delete().in('id', done.map(x => x.id)); await loadAll(); render(); return toast(n ? `Restocked ${n} bottle${n === 1 ? '' : 's'}` : 'Cleared. Add new bottles from the back bar'); }
    if (t.dataset.barview) { S.barView = t.dataset.barview; lsSet('bhb_barview', S.barView); return render(); }
    if (t.dataset.barcat != null) { S.barCat = t.dataset.barcat; return render(); }
    if (t.dataset.bottle) return bottleEditor(t.dataset.bottle);
    if (t.dataset.spec) return specSheet(t.dataset.spec);
    if (t.dataset.specview) { S.specView = t.dataset.specview; return render(); }
    if (t.dataset.specfam != null) { S.specFam = t.dataset.specfam; return render(); }
    if (t.dataset.specbase != null) { S.specBase = t.dataset.specbase; return render(); }
    if (t.dataset.prepview) { S.prepView = t.dataset.prepview; return render(); }
    if (t.dataset.prepkind != null) { S.prepKind = t.dataset.prepkind; return render(); }
    if (t.dataset.prepLib) return prepRecipeSheet(t.dataset.prepLib);
    if (t.dataset.prep) return prepRowSheet(t.dataset.prep);
    if (t.dataset.hostview) { S.hostView = t.dataset.hostview; return render(); }
    if (t.dataset.event) return eventSheet(t.dataset.event);
    if (t.dataset.buy) { const n = await addToList([{ name: t.dataset.buy }]); render(); return toast(n ? `${t.dataset.buy} is on the Bar list` : 'Already on the list'); }
    if (t.dataset.delitem) { quietUntil = Date.now() + 2000; S.list = S.list.filter(x => x.id !== t.dataset.delitem); render(); const r = await sb.from('shopping_items').delete().eq('id', t.dataset.delitem); if (r.error) fail(r.error); return; }
    if (t.dataset.gq) { const g = S.gear.find(x => x.id === t.dataset.gq); g.qty = Math.max(0, g.qty + Number(t.dataset.d)); render(); quietUntil = Date.now() + 2000; const r = await sb.from('bar_gear').update({ qty: g.qty }).eq('id', g.id); if (r.error) fail(r.error); return; }
  } catch (err) { fail(err); }
});
document.addEventListener('change', async e => {
  const t = e.target; if (t.closest('.sheet')) return;
  try {
    if (t.dataset.staple) { await toggleStaple(t.dataset.staple, t.checked); return; }
    if (t.dataset.check) { const x = S.list.find(i => i.id === t.dataset.check); x.checked = t.checked; quietUntil = Date.now() + 2000; const r = await sb.from('shopping_items').update({ checked: t.checked }).eq('id', x.id); if (r.error) fail(r.error); render(); }
  } catch (err) { fail(err); }
});
window.__back = () => { const s = [...document.querySelectorAll('.sheet')].pop(); if (s) { s.close ? s.close() : s.remove(); return true; } if (S.session && S.household && S.tab !== 'home') { S.tab = 'home'; render(); return true; } return false; };
if (/^(localhost|127\.)/.test(location.hostname)) window.__bar = { S: () => S, C: () => C, specStatus, allSpecs, altOk, drinkNumbers, eventNeeds, madeIt, logBatch, bottleLow, prepsToMake, loadAll, render };

sb.auth.onAuthStateChange((ev, session) => { const was = S.session?.user?.id; S.session = session; if (!session) { S.household = null; S.me = null; S.loaded = false; render(); return; } if (session.user.id !== was) setTimeout(enter, 0); });
sb.auth.getSession().then(({ data }) => { S.session = data.session; if (data.session) enter(); else render(); });
if ('serviceWorker' in navigator && location.hostname.endsWith('github.io')) navigator.serviceWorker.register('sw.js').catch(() => {});

}
