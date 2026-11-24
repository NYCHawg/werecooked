{
const SUPABASE_URL = 'https://iticnrxdxykvgwoueqtk.supabase.co';
const SUPABASE_KEY = 'sb_publishable_JyHvBjN_1lfvcjsLfX2ybQ_lnU67nP_';
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'pkce' } });
const IS_APP = !!(window.Android && window.Android.openExternal);
const IS_IOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

// ---------- helpers ----------
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = n => String(n).padStart(2, '0');
const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const parseYmd = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const fmtQty = q => { if (q == null || q === '') return ''; const n = Math.round(Number(q) * 100) / 100; const w = Math.floor(n), f = n - w; const fr = [[.25, '¼'], [.5, '½'], [.75, '¾'], [.33, '⅓'], [.67, '⅔']].find(([v]) => Math.abs(v - f) < .03); return f < .03 ? String(w) : fr ? (w ? w : '') + fr[1] : String(n); };
const norm = s => String(s || '').toLowerCase().replace(/\(.*?\)/g, '').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim().replace(/(es|s)$/, '');
const same = (a, b) => { const x = norm(a), y = norm(b); return !!x && !!y && (x === y || x.includes(y) || y.includes(x)); };
const normUnit = u => { u = String(u || '').toLowerCase().replace(/\.$/, ''); const m = { cups: 'cup', tbsps: 'tbsp', tablespoon: 'tbsp', tablespoons: 'tbsp', tsps: 'tsp', teaspoon: 'tsp', teaspoons: 'tsp', lbs: 'lb', pound: 'lb', pounds: 'lb', ounce: 'oz', ounces: 'oz', grams: 'g', gram: 'g', cloves: 'clove', cans: 'can', pieces: 'piece', slices: 'slice', bunches: 'bunch' }; return m[u] || u; };
const toast = t => { const e = $('#toast'); e.textContent = t; e.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(() => e.classList.remove('on'), 2200); };
const UNITS = 'cups?|tbsps?|tablespoons?|tsps?|teaspoons?|oz|ounces?|lbs?|pounds?|g|grams?|kg|ml|l|cloves?|cans?|pinch|bunch(?:es)?|pieces?|slices?|sticks?|heads?|packages?|pkgs?|jars?|bags?|dozen';
const FRAC = { '½': .5, '¼': .25, '¾': .75, '⅓': 1 / 3, '⅔': 2 / 3 };
function parseIng(line) {
  let s = line.trim().replace(/^[-•*]\s*/, ''); if (!s) return null;
  const m = new RegExp(`^((?:\\d+\\s+)?\\d*[.\\/]?\\d+|\\d+|[½¼¾⅓⅔])?\\s*([½¼¾⅓⅔])?\\s*(${UNITS})?\\.?\\s+(.+)$`, 'i').exec(s);
  if (!m || (!m[1] && !m[2])) return { qty: null, unit: '', name: s };
  let q = 0; const a = m[1] || '';
  if (FRAC[a]) q = FRAC[a]; else if (a.includes('/')) { const p = a.split(/\s+/); for (const t of p) { if (t.includes('/')) { const [x, y] = t.split('/').map(Number); q += x / y; } else q += Number(t); } } else if (a) q = Number(a);
  if (m[2]) q += FRAC[m[2]];
  return { qty: q || null, unit: normUnit(m[3] || ''), name: m[4].trim() };
}
const COUNT_UNITS = ['', 'each', 'bunch', 'can', 'clove', 'piece', 'slice', 'head', 'package', 'pkg', 'jar', 'bag', 'stick', 'dozen'];
const roundBuy = (q, u) => q == null ? null : COUNT_UNITS.includes(normUnit(u)) ? Math.ceil(q - 0.001) : Math.ceil(q * 4 - 0.001) / 4;
const ingLine = i => [fmtQty(i.qty), i.unit, i.name].filter(Boolean).join(' ');
const KINDS = { cook: 'Cooking in', out: 'Eating out', takeout: 'Takeout', leftovers: 'Leftovers', away: 'Nobody home', other: 'Other plans' };
const CATS = ['Produce', 'Meat & Seafood', 'Dairy & Eggs', 'Pantry', 'Spices', 'Frozen', 'Bakery', 'Drinks', 'Household', 'Other'];

// ---------- state ----------
const S = { session: null, me: null, household: null, members: [], pantry: [], recipes: [], plan: [], list: [], tab: 'week', weekStart: ymd(new Date()), recipeQ: '', channel: null, library: [], loc: null };
try { S.loc = JSON.parse(localStorage.getItem('wc-loc') || 'null'); } catch (_) { }
const memberById = id => S.members.find(m => m.user_id === id);
const initials = n => (n || '?').trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
const av = (m, off) => m ? `<span class="av${off ? ' off' : ''}" style="background:${esc(m.color)}" title="${esc(m.display_name)}">${esc(initials(m.display_name))}</span>` : '';

// ---------- data ----------
async function loadAll() {
  const hid = S.household.id;
  const [mem, pan, rec, pl, li] = await Promise.all([
    sb.from('members').select('*').eq('household_id', hid).order('joined_at'),
    sb.from('pantry_items').select('*').eq('household_id', hid).order('name'),
    sb.from('recipes').select('*').eq('household_id', hid).order('title'),
    sb.from('meal_plan').select('*').eq('household_id', hid).gte('day', ymd(addDays(new Date(), -35))).order('day'),
    sb.from('shopping_items').select('*').eq('household_id', hid).order('created_at')
  ]);
  for (const r of [mem, pan, rec, pl, li]) if (r.error) throw r.error;
  S.members = mem.data; S.pantry = pan.data; S.recipes = rec.data; S.plan = pl.data; S.list = li.data;
  if (!S.library.length) { const lib = await sb.from('recipe_library').select('*').order('title'); if (!lib.error) S.library = lib.data; }
}
let reloadT;
function subscribe() {
  if (S.channel) sb.removeChannel(S.channel);
  const f = `household_id=eq.${S.household.id}`;
  S.channel = sb.channel('hh-' + S.household.id);
  for (const t of ['members', 'pantry_items', 'recipes', 'meal_plan', 'shopping_items'])
    S.channel.on('postgres_changes', { event: '*', schema: 'public', table: t, filter: f }, () => { clearTimeout(reloadT); reloadT = setTimeout(async () => { try { await loadAll(); if (!$('.sheet')) render(); } catch (e) { } }, 400); });
  S.channel.subscribe();
}
const fail = e => { console.error(e); toast(e?.message || 'Something went wrong. Try again.'); };

// ---------- matching / planning logic ----------
function pantryFor(name) { return S.pantry.find(p => same(p.name, name)); }
function recipeMatch(r) {
  const ings = r.ingredients || []; if (!ings.length) return { pct: 0, have: 0, total: 0, missing: [] };
  const missing = ings.filter(i => { const p = pantryFor(i.name); return !p || Number(p.qty) <= 0; });
  return { pct: Math.round((ings.length - missing.length) / ings.length * 100), have: ings.length - missing.length, total: ings.length, missing };
}
function ideas(limit = 3) {
  const soon = S.pantry.filter(p => p.expires_on && parseYmd(p.expires_on) <= addDays(new Date(), 3) && Number(p.qty) > 0);
  return S.recipes.map(r => { const m = recipeMatch(r); const uses = soon.filter(p => (r.ingredients || []).some(i => same(i.name, p.name))).length; return { r, m, score: m.pct + uses * 15 + (r.favorite ? 5 : 0) }; })
    .filter(x => x.m.total && x.m.pct >= 40).sort((a, b) => b.score - a.score).slice(0, limit);
}
const homeCount = p => Math.max(0, S.members.length - (p?.away?.length || 0)) || 1;
const factorFor = (p, r) => (p.headcount || homeCount(p)) / (r.servings || 4);

async function buildList() {
  const hid = S.household.id, today = ymd(new Date()), end = ymd(addDays(new Date(), 6));
  const need = new Map();
  const add = (name, qty, unit, category) => { const k = norm(name) + '|' + normUnit(unit); const cur = need.get(k); if (cur) { cur.qty = (cur.qty || 0) + (qty || 0); } else need.set(k, { name, qty: qty || null, unit: normUnit(unit), category }); };
  for (const p of S.plan) {
    if (p.kind !== 'cook' || p.cooked || p.day < today || p.day > end || !p.recipe_id) continue;
    const r = S.recipes.find(x => x.id === p.recipe_id); if (!r) continue;
    const f = factorFor(p, r);
    for (const i of r.ingredients || []) add(i.name, i.qty ? i.qty * f : null, i.unit, pantryFor(i.name)?.category || 'Other');
  }
  const rows = [];
  for (const n of need.values()) {
    const p = pantryFor(n.name);
    if (p) {
      if (normUnit(p.unit) === n.unit && n.qty != null) { const short = n.qty - Number(p.qty); if (short <= 0.001) continue; n.qty = short; }
      else if (Number(p.qty) > 0) continue;
    }
    rows.push({ household_id: hid, name: n.name, qty: roundBuy(n.qty, n.unit), unit: n.unit, category: n.category, source: 'plan', added_by: S.session.user.id });
  }
  for (const p of S.pantry) if (Number(p.par) > 0 && Number(p.qty) < Number(p.par) && !rows.some(r => same(r.name, p.name)))
    rows.push({ household_id: hid, name: p.name, qty: Number(p.par) - Number(p.qty), unit: p.unit, category: p.category, source: 'par', added_by: S.session.user.id });
  const finalRows = rows.filter(r => !S.list.some(l => l.source === 'manual' && !l.checked && same(l.name, r.name)));
  const del = await sb.from('shopping_items').delete().eq('household_id', hid).eq('checked', false).in('source', ['plan', 'par']);
  if (del.error) throw del.error;
  if (finalRows.length) { const ins = await sb.from('shopping_items').insert(finalRows); if (ins.error) throw ins.error; }
  await loadAll(); render();
  toast(finalRows.length ? `Added ${finalRows.length} item${finalRows.length > 1 ? 's' : ''} from this week's meals and low stock` : 'Nothing needed: the pantry covers this week');
}

async function markCooked(p) {
  const r = S.recipes.find(x => x.id === p.recipe_id);
  if (r) {
    const f = factorFor(p, r);
    for (const i of r.ingredients || []) {
      const it = pantryFor(i.name); if (!it || i.qty == null) continue;
      if (normUnit(it.unit) !== normUnit(i.unit) && it.unit && i.unit) continue;
      const q = Math.max(0, Math.round((Number(it.qty) - i.qty * f) * 100) / 100);
      const u = await sb.from('pantry_items').update({ qty: q, updated_at: new Date().toISOString() }).eq('id', it.id); if (u.error) throw u.error;
    }
  }
  const u = await sb.from('meal_plan').update({ cooked: true }).eq('id', p.id); if (u.error) throw u.error;
  await loadAll(); render(); toast('Marked cooked. Pantry updated.');
}

async function checkedToPantry() {
  const done = S.list.filter(l => l.checked); if (!done.length) return toast('Check off items first');
  for (const l of done) {
    const p = pantryFor(l.name); const q = Number(l.qty) || 1;
    if (p && (normUnit(p.unit) === normUnit(l.unit) || !l.unit || !p.unit)) {
      const u = await sb.from('pantry_items').update({ qty: Number(p.qty) + q, updated_at: new Date().toISOString() }).eq('id', p.id); if (u.error) throw u.error;
    } else {
      const i = await sb.from('pantry_items').insert({ household_id: S.household.id, name: l.name, qty: q, unit: l.unit || '', category: CATS.includes(l.category) ? l.category : 'Other' }); if (i.error) throw i.error;
    }
  }
  const d = await sb.from('shopping_items').delete().in('id', done.map(x => x.id)); if (d.error) throw d.error;
  await loadAll(); render(); toast(`Put away ${done.length} item${done.length > 1 ? 's' : ''}`);
}

// ---------- places (OpenStreetMap search) ----------
const FOOD_TAGS = ['amenity:restaurant', 'amenity:fast_food', 'amenity:cafe', 'amenity:bar', 'amenity:pub', 'amenity:food_court', 'amenity:ice_cream', 'amenity:biergarten'];
const biasPoint = () => S.loc || (S.household?.home_lat != null ? { lat: S.household.home_lat, lon: S.household.home_lon } : null);
const distMi = (a, b) => { if (!a || !b) return null; const R = 3958.8, r = x => x * Math.PI / 180; const dl = r(b.lat - a.lat), dn = r(b.lon - a.lon); const h = Math.sin(dl / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(dn / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(h)); };
async function photon(q, tags) {
  const c = biasPoint();
  let u = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=10&lang=en`;
  if (c) u += `&lat=${c.lat}&lon=${c.lon}&location_bias_scale=0.4&zoom=12`;
  for (const t of tags || []) u += '&osm_tag=' + encodeURIComponent(t);
  const r = await fetch(u); if (!r.ok) throw new Error('Place search is unavailable right now');
  const j = await r.json();
  return (j.features || []).map(f => { const p = f.properties || {}; const [lon, lat] = f.geometry.coordinates;
    const addr = [[p.housenumber, p.street].filter(Boolean).join(' '), p.district || p.locality, p.city || p.town || p.village, p.state].filter(Boolean).join(', ');
    return { name: p.name || p.street || q, address: addr, lat, lon, kind: (p.osm_value || '').replace(/_/g, ' '), d: distMi(c, { lat, lon }) }; });
}
async function searchFood(q) { let r = await photon(q, FOOD_TAGS); if (!r.length) r = await photon(q); return r.sort((a, b) => (a.d ?? 1e9) - (b.d ?? 1e9)); }
function locateMe() {
  return new Promise((res, rej) => { if (!navigator.geolocation) return rej(new Error('Location is not available on this device'));
    navigator.geolocation.getCurrentPosition(p => { S.loc = { lat: p.coords.latitude, lon: p.coords.longitude }; try { localStorage.setItem('wc-loc', JSON.stringify(S.loc)); } catch (_) { } res(S.loc); },
      () => rej(new Error('Location permission was denied. Set a home area on the Family tab instead.')), { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 }); });
}
const mapsUrl = p => { const q = encodeURIComponent([p.place_name, p.place_address].filter(Boolean).join(', ')); return IS_IOS ? `https://maps.apple.com/?q=${encodeURIComponent(p.place_name || '')}${p.place_lat != null ? `&ll=${p.place_lat},${p.place_lon}` : `&address=${q}`}` : `https://www.google.com/maps/search/?api=1&query=${q}`; };
function openOut(url) { if (IS_APP) window.Android.openExternal(url); else window.open(url, '_blank', 'noopener'); }
function miniMap(el, places, pick) {
  if (!window.L || !el) return null;
  el.innerHTML = ''; const m = L.map(el, { zoomControl: false, attributionControl: true });
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(m);
  const pts = places.map((p, i) => { const mk = L.circleMarker([p.lat, p.lon], { radius: 9, color: '#fff', weight: 2, fillColor: '#E4572E', fillOpacity: 1 }).addTo(m); mk.bindTooltip(p.name); mk.on('click', () => pick(i)); return [p.lat, p.lon]; });
  const me = biasPoint(); if (me) L.circleMarker([me.lat, me.lon], { radius: 6, color: '#fff', weight: 2, fillColor: '#2E86AB', fillOpacity: 1 }).addTo(m).bindTooltip('Home / you');
  if (pts.length > 1) m.fitBounds(pts, { padding: [24, 24] }); else if (pts.length) m.setView(pts[0], 15); else if (me) m.setView([me.lat, me.lon], 13); else m.setView([40.7, -73.95], 11);
  setTimeout(() => m.invalidateSize(), 50); return m;
}

// ---------- screens ----------
const ICONS = {
  week: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  pantry: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M4 9h16M4 15h16M9 6h2M9 12h2M9 18h2"/>',
  recipes: '<path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M5 17a3 3 0 0 1 3-3h11M9 8h6"/>',
  list: '<path d="M9 6h11M9 12h11M9 18h11"/><path d="m3.5 6 1.2 1.2L7 5M3.5 12l1.2 1.2L7 11M3.5 18l1.2 1.2L7 17"/>',
  family: '<circle cx="9" cy="8" r="3.2"/><circle cx="17" cy="9.5" r="2.5"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M15 14.6c3.2-.6 6 1.6 6 5.4"/>'
};
const TABS = [['week', 'Week'], ['pantry', 'Pantry'], ['recipes', 'Recipes'], ['list', 'List'], ['family', 'Family']];

function shell(inner, sub) {
  const lowN = S.pantry.filter(p => Number(p.par) > 0 && Number(p.qty) < Number(p.par)).length;
  const listN = S.list.filter(l => !l.checked).length;
  return `<header><div><h1>We're Cooked</h1><div class="hsub">${esc(sub || S.household.name)}</div></div>${av(S.me)}</header>
  <main id="main">${inner}</main>
  <nav class="tabs" aria-label="Sections">${TABS.map(([k, l]) => `<button data-tab="${k}" aria-current="${S.tab === k ? 'page' : 'false'}"><svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[k]}</svg><span>${l}${k === 'list' && listN ? ` <b class="cnt">${listN}</b>` : ''}${k === 'pantry' && lowN ? ` <b class="cnt">${lowN}</b>` : ''}</span></button>`).join('')}</nav>`;
}

function weekView() {
  const start = parseYmd(S.weekStart), today = ymd(new Date());
  const days = [...Array(7)].map((_, i) => ymd(addDays(start, i)));
  const ide = ideas(1)[0];
  const cards = days.map(d => {
    const p = S.plan.find(x => x.day === d); const dt = parseYmd(d);
    const k = p?.kind; const r = p?.recipe_id && S.recipes.find(x => x.id === p.recipe_id);
    const title = p ? (r?.title || p.title || p.place_name || (k === 'away' ? 'No dinner at home' : KINDS[k])) : 'Not planned yet';
    const cook = p?.cook_id && memberById(p.cook_id);
    const who = S.members.map(m => av(m, p?.away?.includes(m.user_id))).join('');
    return `<button class="card day${d === today ? ' today' : ''}" data-day="${d}" style="--k:var(--${k || 'line'})">
      <span class="dd"><span>${DOW[dt.getDay()]}</span><b>${dt.getDate()}</b></span>
      <span>${p ? `<span class="kind" style="--k:var(--${k})">${esc(KINDS[k])}${p.cooked ? ' ✓' : ''}</span>` : ''}
        <span class="dt" style="display:block${p ? '' : ';color:var(--mute)'}">${esc(p?.place_name || title)}</span>
        ${p?.place_name ? `<span class="dm" style="display:block">${esc(p.place_address || '')} · <span role="link" tabindex="0" data-ext="${esc(mapsUrl(p))}" style="color:var(--tomd);font-weight:700;text-decoration:underline">Directions</span></span>` : ''}
        <span class="row" style="justify-content:space-between"><span class="dm">${cook ? `${esc(cook.display_name)} cooking · ` : ''}${p && k !== 'away' ? `${p.headcount || homeCount(p)} eating` : ''}${p?.note ? ` · ${esc(p.note)}` : ''}</span><span class="avs">${who}</span></span>
        ${!p && ide && d >= today ? `<span class="idea" style="display:block;margin-top:4px">Idea: ${esc(ide.r.title)} (${ide.m.have}/${ide.m.total} in pantry)</span>` : ''}
      </span></button>`;
  }).join('');
  const label = `${parseYmd(days[0]).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – ${parseYmd(days[6]).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
  return `<div class="weekbar"><button class="ib" data-week="-7" aria-label="Previous week">‹</button><h2 style="margin:0">${label}</h2><button class="ib" data-week="7" aria-label="Next week">›</button></div>
  <div class="legend">${Object.entries(KINDS).map(([k, l]) => `<span class="kind" style="--k:var(--${k})">${l}</span>`).join('')}</div>
  ${cards}
  <button class="btn" style="width:100%;margin-top:6px" data-act="buildlist">Build shopping list for the next 7 days</button>`;
}

function pantryView() {
  const soon = ymd(addDays(new Date(), 3));
  const groups = CATS.map(c => [c, S.pantry.filter(p => (CATS.includes(p.category) ? p.category : 'Other') === c)]).filter(g => g[1].length);
  return `<div class="row"><h2 class="sp">Pantry</h2><button class="btn sm" data-act="addpantry">+ Add item</button></div>
  ${S.pantry.length ? '' : '<p class="empty">Nothing here yet. Add what you keep at home, and set a par for staples you never want to run out of.</p>'}
  ${groups.map(([c, items]) => `<h3>${esc(c)}</h3><div class="card">${items.map(p => {
    const low = Number(p.par) > 0 && Number(p.qty) < Number(p.par); const exp = p.expires_on && p.expires_on <= soon;
    return `<div class="item"><button style="all:unset;cursor:pointer" data-edit-pantry="${p.id}"><span class="iname">${esc(p.name)}</span> ${low ? '<span class="badge">Low</span>' : ''} ${exp ? `<span class="badge red">${p.expires_on < ymd(new Date()) ? 'Expired' : 'Use soon'}</span>` : ''}
      <span class="imeta" style="display:block">${Number(p.par) > 0 ? `Par ${fmtQty(p.par)} ${esc(p.unit)}` : 'No par'}${p.expires_on ? ` · Exp ${esc(p.expires_on)}` : ''}</span></button>
      <span class="step"><button data-dq="${p.id}" data-d="-1" aria-label="Less">−</button><span>${fmtQty(p.qty)} ${esc(p.unit)}</span><button data-dq="${p.id}" data-d="1" aria-label="More">+</button></span></div>`;
  }).join('')}</div>`).join('')}`;
}

function recipesView() {
  const q = S.recipeQ.toLowerCase();
  const list = S.recipes.filter(r => !q || r.title.toLowerCase().includes(q) || (r.tags || []).join(' ').toLowerCase().includes(q) || (r.ingredients || []).some(i => i.name.toLowerCase().includes(q)))
    .map(r => ({ r, m: recipeMatch(r) })).sort((a, b) => (b.r.favorite - a.r.favorite) || b.m.pct - a.m.pct || a.r.title.localeCompare(b.r.title));
  const ide = ideas(3);
  const fresh = S.library.filter(l => !S.recipes.some(r => r.title.toLowerCase() === l.title.toLowerCase()));
  return `<div class="row"><h2 class="sp">Family recipe book</h2><button class="btn sm" data-act="addrecipe">+ Add recipe</button></div>
  ${fresh.length ? `<div class="card" style="background:var(--soft)"><div class="iname">${fresh.length} recipe${fresh.length > 1 ? 's' : ''} found in your Drive and Gmail</div><div class="imeta">${esc(fresh.slice(0, 4).map(l => l.title).join(', '))}${fresh.length > 4 ? '…' : ''}</div><button class="btn sm" style="margin-top:8px" data-act="importlib">Add them to the family book</button></div>` : ''}
  <input type="search" id="rq" placeholder="Search recipes, tags or ingredients" value="${esc(S.recipeQ)}" aria-label="Search recipes">
  ${ide.length ? `<h3>You can make these with what's at home</h3>${ide.map(x => `<button class="card recipe" data-recipe="${x.r.id}"><span><span class="iname">${esc(x.r.title)}</span><span class="imeta" style="display:block">${x.m.missing.length ? `Missing: ${esc(x.m.missing.slice(0, 3).map(i => i.name).join(', '))}` : 'Everything is in the pantry'}</span></span><span class="match">${x.m.have}/${x.m.total}</span></button>`).join('')}` : ''}
  <h3>All recipes (${S.recipes.length})</h3>
  ${list.length ? list.map(({ r, m }) => `<button class="card recipe" data-recipe="${r.id}"><span><span class="iname">${r.favorite ? '★ ' : ''}${esc(r.title)}</span><span class="imeta" style="display:block">${[r.time_min ? r.time_min + ' min' : '', 'Serves ' + r.servings, (r.tags || []).join(', '), 'by ' + (memberById(r.created_by)?.display_name || 'family')].filter(Boolean).map(esc).join(' · ')}</span></span><span class="match">${m.total ? m.have + '/' + m.total : ''}</span></button>`).join('') : '<p class="empty">No recipes yet. Add the family favorites and everyone in the household will see them.</p>'}`;
}

function listView() {
  const open = S.list.filter(l => !l.checked), done = S.list.filter(l => l.checked);
  const groups = CATS.map(c => [c, open.filter(l => (CATS.includes(l.category) ? l.category : 'Other') === c)]).filter(g => g[1].length);
  const row = l => `<div class="chk${l.checked ? ' done' : ''}"><input type="checkbox" data-check="${l.id}" ${l.checked ? 'checked' : ''} aria-label="Got ${esc(l.name)}"><span><span class="iname">${esc(l.name)}</span><span class="imeta" style="display:block">${[l.qty ? fmtQty(l.qty) + ' ' + l.unit : '', l.source === 'plan' ? 'for this week' : l.source === 'par' ? 'below par' : ''].filter(Boolean).map(esc).join(' · ')}</span></span><button class="del" data-delitem="${l.id}" aria-label="Remove">×</button></div>`;
  return `<div class="row"><h2 class="sp">Shopping list</h2><button class="btn sm ghost" data-act="buildlist">Rebuild</button></div>
  <form id="addlist" class="row" style="flex-wrap:nowrap"><input type="text" id="li" placeholder="Add an item, e.g. 2 lb chicken thighs" aria-label="Add item" autocomplete="off"><button class="btn" type="submit">Add</button></form>
  ${open.length ? groups.map(([c, items]) => `<h3>${esc(c)}</h3><div class="card">${items.map(row).join('')}</div>`).join('') : '<p class="empty">The list is empty. Tap Rebuild to add what this week\'s meals need and anything below par.</p>'}
  ${done.length ? `<h3>In the cart (${done.length})</h3><div class="card">${done.map(row).join('')}</div><button class="btn" style="width:100%" data-act="putaway">Put checked items in the pantry</button>` : ''}`;
}

function familyView() {
  return `<h2>${esc(S.household.name)}</h2>
  <div class="card"><div class="imeta">Invite code: family members create an account, then enter this code</div><div class="row" style="margin-top:6px"><span class="code">${esc(S.household.invite_code)}</span><span class="sp"></span><button class="btn sm ghost" data-act="copycode">Copy</button></div></div>
  <h3>Home area</h3><div class="card"><div class="imeta">Used to find nearby restaurants when phone location is off</div>
  <div class="row" style="margin-top:6px"><span class="iname sp">${esc(S.household.home_label || 'Not set')}</span><button class="btn sm ghost" data-act="sethome">${S.household.home_label ? 'Change' : 'Set home area'}</button></div></div>
  <h3>Members</h3><div class="card">${S.members.map(m => `<div class="item"><span class="row">${av(m)}<span><span class="iname">${esc(m.display_name)}${m.user_id === S.session.user.id ? ' (you)' : ''}</span><span class="imeta" style="display:block">${m.role === 'owner' ? 'Owner' : 'Member'}${m.dislikes ? ' · Avoids: ' + esc(m.dislikes) : ''}</span></span></span></div>`).join('')}</div>
  <h3>Your profile</h3>
  <form id="profile" class="card"><label for="pn">Your name</label><input type="text" id="pn" value="${esc(S.me.display_name)}" maxlength="40">
  <label for="pd">Foods you avoid or dislike</label><input type="text" id="pd" value="${esc(S.me.dislikes || '')}" placeholder="e.g. mushrooms, shellfish allergy">
  <label for="pc">Your color</label><input type="text" id="pc" value="${esc(S.me.color)}" placeholder="#E4572E">
  <button class="btn" style="margin-top:12px" type="submit">Save</button></form>
  <p class="imeta">Signed in as ${esc(S.session.user.email)}</p>
  <button class="btn line" data-act="signout">Sign out</button>`;
}

function render() {
  const app = $('#app');
  if (!S.session) return authView();
  if (!S.household) return onboardView();
  const v = { week: weekView, pantry: pantryView, recipes: recipesView, list: listView, family: familyView }[S.tab]();
  const y = $('#main')?.scrollTop || 0;
  app.innerHTML = shell(v);
  $('#main').scrollTop = y;
  const rq = $('#rq'); if (rq) rq.oninput = e => { S.recipeQ = e.target.value; const pos = e.target.selectionStart; render(); const n = $('#rq'); n.focus(); n.setSelectionRange(pos, pos); };
  const al = $('#addlist'); if (al) al.onsubmit = async e => { e.preventDefault(); const v = $('#li').value.trim(); if (!v) return; const p = parseIng(v); const pi = pantryFor(p.name); const r = await sb.from('shopping_items').insert({ household_id: S.household.id, name: p.name, qty: p.qty, unit: p.unit, category: pi?.category || 'Other', source: 'manual', added_by: S.session.user.id }); if (r.error) return fail(r.error); await loadAll(); render(); $('#li')?.focus(); };
  const pf = $('#profile'); if (pf) pf.onsubmit = async e => { e.preventDefault(); const color = /^#[0-9a-f]{6}$/i.test($('#pc').value.trim()) ? $('#pc').value.trim() : S.me.color; const r = await sb.from('members').update({ display_name: $('#pn').value.trim() || S.me.display_name, dislikes: $('#pd').value.trim() || null, color }).eq('user_id', S.session.user.id); if (r.error) return fail(r.error); await refreshMe(); render(); toast('Saved'); };
}

// ---------- auth & onboarding ----------
function authView(mode = 'in', msg = '') {
  $('#app').innerHTML = `<main><div class="auth"><div class="hero"><img src="icon-192.png" alt=""></div>
  <h2 style="text-align:center">We're Cooked</h2><p class="imeta" style="text-align:center">Plan the week, stock the pantry, share the family recipe book.</p>
  <button class="btn google" id="gbtn" type="button"><svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>Continue with Google</button>
  <div class="or"><span>or use email</span></div>
  <form id="auth"><label for="ae">Email</label><input type="email" id="ae" autocomplete="email" required>
  <label for="ap">Password</label><input type="password" id="ap" autocomplete="${mode === 'in' ? 'current-password' : 'new-password'}" minlength="6" required>
  <button class="btn" type="submit" style="width:100%;margin-top:16px">${mode === 'in' ? 'Sign in' : 'Create account'}</button>
  <div class="err" id="aerr">${esc(msg)}</div></form>
  <p style="text-align:center"><button class="btn line sm" id="swap">${mode === 'in' ? 'New here? Create an account' : 'Have an account? Sign in'}</button></p></div></main>`;
  $('#swap').onclick = () => authView(mode === 'in' ? 'up' : 'in');
  $('#gbtn').onclick = () => googleSignIn().catch(e => { $('#aerr').textContent = e.message; });
  $('#auth').onsubmit = async e => {
    e.preventDefault(); const email = $('#ae').value.trim(), password = $('#ap').value; $('#aerr').textContent = '';
    const btn = e.target.querySelector('button'); btn.disabled = true;
    const r = mode === 'in' ? await sb.auth.signInWithPassword({ email, password }) : await sb.auth.signUp({ email, password, options: { emailRedirectTo: IS_APP ? WEB_HOME : location.origin + location.pathname } });
    btn.disabled = false;
    if (r.error) return ($('#aerr').textContent = r.error.message);
    if (mode === 'up' && !r.data.session) return authView('in', 'Check your email for a confirmation link, then sign in here.');
  };
}
const WEB_HOME = 'https://nychawg.github.io/werecooked/';
async function googleSignIn() {
  const redirectTo = IS_APP ? 'werecooked://auth-callback' : location.origin + location.pathname;
  const r = await sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo, skipBrowserRedirect: IS_APP, queryParams: { prompt: 'select_account' } } });
  if (r.error) throw r.error;
  if (IS_APP) window.Android.openExternal(r.data.url);
}
// Android hands the deep link back here after Google sign-in in the system browser
window.__authCallback = async url => {
  try { const u = new URL(url); const code = u.searchParams.get('code'); const err = u.searchParams.get('error_description');
    if (err) return authView('in', err);
    if (code) { const r = await sb.auth.exchangeCodeForSession(code); if (r.error) authView('in', r.error.message); } } catch (e) { fail(e); }
};
function onboardView() {
  $('#app').innerHTML = `<main><div class="auth"><div class="hero"><img src="icon-192.png" alt=""></div><h2>Set up your household</h2>
  <form id="mk" class="card"><h3 style="margin-top:0">Start a new household</h3><label for="hn">Household name</label><input type="text" id="hn" placeholder="The Carter House" required maxlength="80">
  <label for="yn">Your name</label><input type="text" id="yn" required maxlength="40"><button class="btn" style="width:100%;margin-top:14px">Create household</button></form>
  <form id="jn" class="card"><h3 style="margin-top:0">Join your family's household</h3><label for="ic">Invite code</label><input type="text" id="ic" placeholder="6 letters and numbers" required maxlength="6" style="text-transform:uppercase">
  <label for="jy">Your name</label><input type="text" id="jy" required maxlength="40"><button class="btn" style="width:100%;margin-top:14px">Join household</button></form>
  <div class="err" id="oerr"></div><button class="btn line sm" data-act="signout">Sign out</button></div></main>`;
  $('#mk').onsubmit = async e => { e.preventDefault(); const r = await sb.rpc('create_household', { p_name: $('#hn').value, p_display_name: $('#yn').value }); if (r.error) return ($('#oerr').textContent = r.error.message); await enter(); };
  $('#jn').onsubmit = async e => { e.preventDefault(); const r = await sb.rpc('join_household', { p_code: $('#ic').value, p_display_name: $('#jy').value }); if (r.error) return ($('#oerr').textContent = r.error.message); await enter(); };
}
async function refreshMe() { const r = await sb.from('members').select('*').eq('user_id', S.session.user.id).maybeSingle(); if (r.error) throw r.error; S.me = r.data; if (S.me) { const h = await sb.from('households').select('*').eq('id', S.me.household_id).single(); if (h.error) throw h.error; S.household = h.data; } else S.household = null; }
async function enter() { try { await refreshMe(); if (S.household) { await loadAll(); subscribe(); } render(); } catch (e) { fail(e); } }

// ---------- sheets ----------
function sheet(html, onReady) {
  const el = document.createElement('div'); el.className = 'sheet'; el.innerHTML = `<div role="dialog" aria-modal="true">${html}</div>`;
  el.onclick = e => { if (e.target === el || e.target.closest('[data-close]')) close(); };
  const close = () => { el.remove(); render(); };
  document.body.appendChild(el); onReady?.(el, close); el.querySelector('input,select,textarea,button')?.focus();
}

function dayEditor(day) {
  const p = S.plan.find(x => x.day === day) || { day, kind: 'cook', away: [], recipe_id: null, cook_id: null, headcount: null, title: '', note: '' };
  const st = { kind: p.kind, away: [...(p.away || [])], recipe_id: p.recipe_id, cook_id: p.cook_id, q: '', results: [], busy: false, err: '',
    place: p.place_name ? { name: p.place_name, address: p.place_address, lat: p.place_lat, lon: p.place_lon } : null };
  let map = null, keepRef = () => { };
  const keep = () => keepRef();
  const dt = parseYmd(day);
  const ide = ideas(5);
  const placePicker = () => st.place ? `<label>${st.kind === 'out' ? 'Where' : 'Ordering from'}</label>
      <div class="card" style="margin:0"><div class="iname">${esc(st.place.name)}</div><div class="imeta">${esc(st.place.address || '')}</div>
      <div class="row" style="margin-top:8px">${st.place.lat != null || st.place.address ? `<button type="button" class="btn sm ghost" data-ext="${esc(mapsUrl({ place_name: st.place.name, place_address: st.place.address, place_lat: st.place.lat, place_lon: st.place.lon }))}">Open in Maps</button>` : ''}<span class="sp"></span><button type="button" class="btn sm line" id="pchg">Change</button></div></div>`
    : `<label for="pq">${st.kind === 'out' ? 'Where are we eating?' : 'Where are we ordering from?'}</label>
      <div class="row" style="gap:6px"><input type="search" id="pq" class="sp" value="${esc(st.q)}" placeholder="Restaurant name or type, e.g. tacos" autocomplete="off"><button type="button" class="btn sm" id="pgo">Search</button></div>
      <div class="row" style="margin-top:6px"><button type="button" class="btn sm ghost" id="pnear">📍 ${S.loc ? 'Update my location' : 'Use my location'}</button><span class="imeta sp" style="text-align:right">${S.loc ? 'Searching near you' : S.household.home_label ? 'Near ' + esc(S.household.home_label) : 'Set a home area on the Family tab for nearby results'}</span></div>
      ${st.err ? `<div class="err">${esc(st.err)}</div>` : ''}${st.busy ? '<div class="imeta" style="margin-top:8px">Searching…</div>' : ''}
      ${st.results.length ? `<div id="pmap" style="height:180px;border-radius:14px;margin-top:10px;overflow:hidden;border:1.5px solid var(--line)"></div>
      <div class="card" style="margin:8px 0 0;padding:4px 12px">${st.results.map((r, i) => `<button type="button" data-place="${i}" style="all:unset;display:block;width:100%;padding:10px 0;border-bottom:1px solid var(--line);cursor:pointer"><span class="iname">${esc(r.name)}</span> <span class="imeta">${esc(r.kind)}${r.d != null ? ` · ${r.d < 10 ? r.d.toFixed(1) : Math.round(r.d)} mi` : ''}</span><br><span class="imeta">${esc(r.address)}</span></button>`).join('')}</div>` : ''}
      <label for="dt">Or just type it</label><input type="text" id="dt" value="${esc(p.title || '')}" maxlength="80" placeholder="e.g. Grandma's, the taco truck">`;
  const draw = el => {
    const sel = st.recipe_id && S.recipes.find(r => r.id === st.recipe_id);
    el.querySelector('#dbody').innerHTML = `
    <div class="seg">${Object.entries(KINDS).map(([k, l]) => `<button type="button" data-kind="${k}" style="--k:var(--${k})" aria-pressed="${st.kind === k}">${l}</button>`).join('')}</div>
    ${st.kind === 'cook' ? `<label for="dr">Recipe</label><select id="dr"><option value="">Choose from the family book…</option>${S.recipes.map(r => { const m = recipeMatch(r); return `<option value="${r.id}" ${st.recipe_id === r.id ? 'selected' : ''}>${esc(r.title)}${m.total ? ` (${m.have}/${m.total} at home)` : ''}</option>`; }).join('')}</select>
      ${!st.recipe_id && ide.length ? `<div class="imeta" style="margin-top:8px">Ideas from the pantry: ${ide.map(x => `<button type="button" class="btn sm ghost" style="margin:4px 4px 0 0" data-pick="${x.r.id}">${esc(x.r.title)} ${x.m.have}/${x.m.total}</button>`).join('')}</div>` : ''}
      ${sel ? `<div class="imeta" style="margin-top:6px">${recipeMatch(sel).missing.length ? 'Missing: ' + esc(recipeMatch(sel).missing.map(i => i.name).join(', ')) : 'Everything is in the pantry'}</div>` : ''}
      <label for="dc">Who's cooking</label><select id="dc"><option value="">Not decided</option>${S.members.map(m => `<option value="${m.user_id}" ${st.cook_id === m.user_id ? 'selected' : ''}>${esc(m.display_name)}</option>`).join('')}</select>` : ''}
    ${st.kind === 'out' || st.kind === 'takeout' ? placePicker() : ''}
    ${st.kind === 'other' ? `<label for="dt">Plan</label><input type="text" id="dt" value="${esc(p.title || '')}" maxlength="80">` : ''}
    ${st.kind !== 'away' ? `<label>Who's home (tap to mark away)</label><div class="avs" style="gap:8px">${S.members.map(m => `<button type="button" data-away="${m.user_id}" style="all:unset;cursor:pointer;display:inline-flex;align-items:center;gap:6px;padding:6px 10px;border:1.5px solid var(--line);border-radius:999px">${av(m, st.away.includes(m.user_id))}<span style="font-size:14px;${st.away.includes(m.user_id) ? 'text-decoration:line-through;color:var(--mute)' : ''}">${esc(m.display_name)}</span></button>`).join('')}</div>
    <label for="dh">How many eating (blank = everyone home)</label><input type="number" id="dh" min="0" max="50" value="${p.headcount ?? ''}" placeholder="${homeCount({ away: st.away })}">` : ''}
    <label for="dn">Note</label><input type="text" id="dn" value="${esc(p.note || '')}" maxlength="120" placeholder="e.g. game night, early dinner">`;
    if (map) { map.remove(); map = null; }
    if (st.results.length && !st.place) map = miniMap(el.querySelector('#pmap'), st.results, i => choose(el, i));
  };
  const choose = (el, i) => { keep(el); const r = st.results[i]; st.place = { name: r.name, address: r.address, lat: r.lat, lon: r.lon }; st.results = []; draw(el); };
  const runSearch = async el => { keep(el); st.q = (el.querySelector('#pq')?.value || '').trim(); if (!st.q) return; st.busy = true; st.err = ''; draw(el);
    try { st.results = await searchFood(st.q); if (!st.results.length) st.err = 'No places found. Try another name, or just type it below.'; } catch (e) { st.err = e.message; }
    st.busy = false; draw(el); };
  sheet(`<h2>${DOW[dt.getDay()]} ${dt.toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}</h2><form id="dform"><div id="dbody"></div>
    <div class="row" style="margin-top:16px"><button class="btn" type="submit">Save</button><button class="btn ghost" type="button" data-close>Cancel</button><span class="sp"></span>
    ${p.id ? `<button class="btn line sm" type="button" id="dclear">Clear day</button>` : ''}</div>
    ${p.id && p.kind === 'cook' && p.recipe_id && !p.cooked ? `<button class="btn line" type="button" id="dcooked" style="width:100%;margin-top:10px">We cooked this (update the pantry)</button>` : ''}</form>`, (el, close) => {
    draw(el);
    const keep0 = () => { const g = id => el.querySelector(id); if (g('#dr')) st.recipe_id = g('#dr').value || null; if (g('#dc')) st.cook_id = g('#dc').value || null; if (g('#dt')) p.title = g('#dt').value; if (g('#dh')) p.headcount = g('#dh').value ? Number(g('#dh').value) : null; if (g('#dn')) p.note = g('#dn').value; if (g('#pq')) st.q = g('#pq').value; };
    keepRef = keep0;
    el.addEventListener('click', e => {
      const k = e.target.closest('[data-kind]'); if (k) { keep(); st.kind = k.dataset.kind; draw(el); return; }
      const a = e.target.closest('[data-away]'); if (a) { keep(); const id = a.dataset.away; st.away = st.away.includes(id) ? st.away.filter(x => x !== id) : [...st.away, id]; draw(el); return; }
      const pk = e.target.closest('[data-pick]'); if (pk) { keep(); st.recipe_id = pk.dataset.pick; draw(el); return; }
      const pl = e.target.closest('[data-place]'); if (pl) { choose(el, Number(pl.dataset.place)); return; }
      if (e.target.closest('#pgo')) { runSearch(el); return; }
      if (e.target.closest('#pchg')) { keep(); st.place = null; draw(el); setTimeout(() => el.querySelector('#pq')?.focus(), 0); return; }
      if (e.target.closest('#pnear')) { keep(); st.err = ''; st.busy = true; draw(el); locateMe().then(() => { st.busy = false; if ((el.querySelector('#pq')?.value || st.q).trim()) runSearch(el); else draw(el); }).catch(er => { st.busy = false; st.err = er.message; draw(el); }); return; }
    });
    el.addEventListener('change', e => { if (e.target.id === 'dr') { keep(); draw(el); } });
    el.addEventListener('keydown', e => { if (e.target.id === 'pq' && e.key === 'Enter') { e.preventDefault(); runSearch(el); } });
    el.querySelector('#dform').onsubmit = async e => {
      e.preventDefault(); keep();
      const row = { household_id: S.household.id, day, kind: st.kind, recipe_id: st.kind === 'cook' ? st.recipe_id : null, cook_id: st.kind === 'cook' ? st.cook_id : null, title: st.kind === 'cook' || st.kind === 'away' ? null : (p.title || null), ...(() => { const pl = (st.kind === 'out' || st.kind === 'takeout') && st.place; return { place_name: pl ? pl.name : null, place_address: pl ? pl.address || null : null, place_lat: pl ? pl.lat ?? null : null, place_lon: pl ? pl.lon ?? null : null }; })(), away: st.kind === 'away' ? S.members.map(m => m.user_id) : st.away, headcount: st.kind === 'away' ? 0 : p.headcount, note: p.note || null, cooked: st.kind === p.kind && st.recipe_id === p.recipe_id ? !!p.cooked : false };
      const r = await sb.from('meal_plan').upsert(row, { onConflict: 'household_id,day' }); if (r.error) return fail(r.error);
      await loadAll(); close();
    };
    el.querySelector('#dclear')?.addEventListener('click', async () => { const r = await sb.from('meal_plan').delete().eq('id', p.id); if (r.error) return fail(r.error); await loadAll(); close(); });
    el.querySelector('#dcooked')?.addEventListener('click', async () => { try { el.remove(); await markCooked(p); } catch (e) { fail(e); } });
  });
}

function pantryEditor(id) {
  const p = S.pantry.find(x => x.id === id) || { name: '', category: 'Pantry', qty: 1, unit: '', par: 0, expires_on: '' };
  sheet(`<h2>${id ? 'Edit item' : 'Add to pantry'}</h2><form id="pform">
  <label for="pnm">Item</label><input type="text" id="pnm" value="${esc(p.name)}" required maxlength="80" placeholder="e.g. Eggs">
  <div class="grid2"><div><label for="pq">On hand</label><input type="number" id="pq" step="any" min="0" value="${p.qty}"></div><div><label for="pu">Unit</label><input type="text" id="pu" value="${esc(p.unit)}" placeholder="each, lb, cup…" maxlength="20"></div></div>
  <div class="grid2"><div><label for="ppar">Par (always keep)</label><input type="number" id="ppar" step="any" min="0" value="${p.par}"></div><div><label for="pex">Expires</label><input type="date" id="pex" value="${esc(p.expires_on || '')}"></div></div>
  <label for="pcat">Category</label><select id="pcat">${CATS.map(c => `<option ${c === p.category ? 'selected' : ''}>${c}</option>`).join('')}</select>
  <div class="row" style="margin-top:16px"><button class="btn" type="submit">Save</button><button class="btn ghost" type="button" data-close>Cancel</button><span class="sp"></span>${id ? '<button class="btn line sm" type="button" id="pdel">Delete</button>' : ''}</div></form>`, (el, close) => {
    el.querySelector('#pform').onsubmit = async e => {
      e.preventDefault(); const g = s => el.querySelector(s).value;
      const row = { household_id: S.household.id, name: g('#pnm').trim(), qty: Number(g('#pq')) || 0, unit: normUnit(g('#pu').trim()), par: Number(g('#ppar')) || 0, expires_on: g('#pex') || null, category: g('#pcat'), updated_at: new Date().toISOString() };
      const r = id ? await sb.from('pantry_items').update(row).eq('id', id) : await sb.from('pantry_items').insert(row); if (r.error) return fail(r.error);
      await loadAll(); close();
    };
    el.querySelector('#pdel')?.addEventListener('click', async () => { const r = await sb.from('pantry_items').delete().eq('id', id); if (r.error) return fail(r.error); await loadAll(); close(); });
  });
}

function recipeView(id) {
  const r = S.recipes.find(x => x.id === id); if (!r) return;
  let serves = r.servings;
  const drawI = el => { const f = serves / r.servings; el.querySelector('#ri').innerHTML = (r.ingredients || []).map(i => { const p = pantryFor(i.name); const have = p && Number(p.qty) > 0; return `<li><span class="${have ? 'have' : 'need'}">${have ? '✓' : '•'}</span><span>${esc(ingLine({ ...i, qty: i.qty ? i.qty * f : null }))}</span></li>`; }).join(''); el.querySelector('#rs').textContent = serves; };
  sheet(`<div class="row"><h2 class="sp">${esc(r.title)}</h2><button class="ib" id="rfav" aria-label="Favorite" style="color:var(--tomd)">${r.favorite ? '★' : '☆'}</button></div>
  <p class="imeta">${[r.time_min ? r.time_min + ' min' : '', (r.tags || []).join(', '), 'Added by ' + (memberById(r.created_by)?.display_name || 'family')].filter(Boolean).map(esc).join(' · ')}</p>
  <div class="row"><span class="iname">Serves</span><span class="step"><button id="rm" aria-label="Fewer">−</button><span id="rs"></span><button id="rp" aria-label="More">+</button></span></div>
  <h3>Ingredients <span style="font-weight:500">(✓ at home)</span></h3><ul class="ings" id="ri"></ul>
  ${(r.steps || []).length ? `<h3>Steps</h3><ol class="steps">${r.steps.map(s => `<li>${esc(s)}</li>`).join('')}</ol>` : ''}
  ${r.notes ? `<h3>Notes</h3><p>${esc(r.notes)}</p>` : ''}
  ${r.source_url ? `<p><a href="${esc(r.source_url)}" data-ext="${esc(r.source_url)}" style="color:var(--tomd);font-weight:700">Open the original recipe ↗</a></p>` : ''}
  <div class="row" style="margin-top:16px"><button class="btn" id="rmiss">Add missing to list</button><button class="btn ghost" id="redit">Edit</button><button class="btn ghost" data-close>Close</button></div>`, (el, close) => {
    drawI(el);
    el.querySelector('#rm').onclick = () => { serves = Math.max(1, serves - 1); drawI(el); };
    el.querySelector('#rp').onclick = () => { serves = Math.min(50, serves + 1); drawI(el); };
    el.querySelector('#rfav').onclick = async () => { const u = await sb.from('recipes').update({ favorite: !r.favorite }).eq('id', r.id); if (u.error) return fail(u.error); await loadAll(); el.remove(); recipeView(id); };
    el.querySelector('#redit').onclick = () => { el.remove(); recipeEditor(id); };
    el.querySelector('#rmiss').onclick = async () => {
      const f = serves / r.servings; const miss = recipeMatch(r).missing.filter(i => !S.list.some(l => !l.checked && same(l.name, i.name)));
      if (!miss.length) return toast('Nothing missing');
      const u = await sb.from('shopping_items').insert(miss.map(i => ({ household_id: S.household.id, name: i.name, qty: i.qty ? roundBuy(i.qty * f, i.unit) : null, unit: i.unit || '', category: 'Other', source: 'manual', added_by: S.session.user.id }))); if (u.error) return fail(u.error);
      await loadAll(); toast(`Added ${miss.length} to the list`);
    };
  });
}

function recipeEditor(id) {
  const r = S.recipes.find(x => x.id === id) || { title: '', servings: 4, time_min: '', tags: [], ingredients: [], steps: [], notes: '' };
  sheet(`<h2>${id ? 'Edit recipe' : 'Add a recipe'}</h2><form id="rform">
  <label for="rt">Name</label><input type="text" id="rt" value="${esc(r.title)}" required maxlength="120" placeholder="Grandma's cheese dip">
  <div class="grid2"><div><label for="rsv">Serves</label><input type="number" id="rsv" min="1" max="50" value="${r.servings}"></div><div><label for="rtm">Minutes</label><input type="number" id="rtm" min="0" max="1440" value="${r.time_min ?? ''}"></div></div>
  <label for="rtg">Tags (comma separated)</label><input type="text" id="rtg" value="${esc((r.tags || []).join(', '))}" placeholder="weeknight, chicken, kid favorite">
  <label for="rig">Ingredients, one per line</label><textarea id="rig" placeholder="2 cup rice&#10;1 lb chicken thighs&#10;3 clove garlic">${esc((r.ingredients || []).map(ingLine).join('\n'))}</textarea>
  <label for="rst">Steps, one per line</label><textarea id="rst">${esc((r.steps || []).join('\n'))}</textarea>
  <label for="rno">Notes</label><input type="text" id="rno" value="${esc(r.notes || '')}" maxlength="400">
  <label for="rsu">Link to the original (optional)</label><input type="text" id="rsu" value="${esc(r.source_url || '')}" placeholder="https://…">
  <div class="row" style="margin-top:16px"><button class="btn" type="submit">Save to family book</button><button class="btn ghost" type="button" data-close>Cancel</button><span class="sp"></span>${id ? '<button class="btn line sm" type="button" id="rdel">Delete</button>' : ''}</div></form>`, (el, close) => {
    el.querySelector('#rform').onsubmit = async e => {
      e.preventDefault(); const g = s => el.querySelector(s).value;
      const row = { household_id: S.household.id, title: g('#rt').trim(), servings: Math.min(50, Math.max(1, Number(g('#rsv')) || 4)), time_min: g('#rtm') ? Number(g('#rtm')) : null, tags: g('#rtg').split(',').map(s => s.trim()).filter(Boolean), ingredients: g('#rig').split('\n').map(parseIng).filter(Boolean), steps: g('#rst').split('\n').map(s => s.trim()).filter(Boolean), notes: g('#rno').trim() || null, source_url: /^https?:\/\//i.test(g('#rsu').trim()) ? g('#rsu').trim() : null };
      if (!id) row.created_by = S.session.user.id;
      const q = id ? await sb.from('recipes').update(row).eq('id', id) : await sb.from('recipes').insert(row); if (q.error) return fail(q.error);
      await loadAll(); close(); toast('Saved to the family recipe book');
    };
    el.querySelector('#rdel')?.addEventListener('click', async () => { const q = await sb.from('recipes').delete().eq('id', id); if (q.error) return fail(q.error); await loadAll(); close(); });
  });
}

async function importLibrary(btn) {
  const fresh = S.library.filter(l => !S.recipes.some(r => r.title.toLowerCase() === l.title.toLowerCase()));
  if (!fresh.length) return; btn.disabled = true;
  const rows = fresh.map(l => ({ household_id: S.household.id, title: l.title, servings: l.servings, time_min: l.time_min, tags: l.tags, ingredients: l.ingredients, steps: l.steps, notes: [l.notes, l.found_in ? `Found in ${l.found_in}.` : ''].filter(Boolean).join(' '), source_url: l.source_url, created_by: S.session.user.id }));
  const r = await sb.from('recipes').insert(rows); if (r.error) { btn.disabled = false; return fail(r.error); }
  await loadAll(); render(); toast(`Added ${rows.length} recipes`);
}
function homeEditor() {
  const st = { results: [], err: '' };
  const drawRes = el => { el.querySelector('#hres').innerHTML = (st.err ? `<div class="err">${esc(st.err)}</div>` : '') + st.results.map((r, i) => `<button type="button" data-h="${i}" style="all:unset;display:block;width:100%;padding:10px 0;border-bottom:1px solid var(--line);cursor:pointer"><span class="iname">${esc(r.name)}</span><br><span class="imeta">${esc(r.address)}</span></button>`).join(''); };
  sheet(`<h2>Home area</h2><p class="imeta">Pick your neighborhood or zip code. Restaurant searches show places near here first. Only this rough area is saved, not your address.</p>
  <div class="row" style="gap:6px"><input type="search" id="hq" class="sp" placeholder="e.g. Bushwick, Brooklyn or 11237"><button type="button" class="btn sm" id="hgo">Search</button></div>
  <button type="button" class="btn sm ghost" id="hme" style="margin-top:8px">📍 Use my current location</button><div id="hres" style="margin-top:8px"></div>
  <div class="row" style="margin-top:16px"><button class="btn ghost" type="button" data-close>Cancel</button></div>`, (el, close) => {
    const save = async (label, lat, lon) => { const r = await sb.from('households').update({ home_label: label, home_lat: Math.round(lat * 100) / 100, home_lon: Math.round(lon * 100) / 100 }).eq('id', S.household.id); if (r.error) return fail(r.error); await refreshMe(); close(); toast('Home area saved'); };
    const go = async () => { const q = el.querySelector('#hq').value.trim(); if (!q) return; st.err = ''; try { st.results = (await photon(q, ['place', 'boundary:postal_code', 'boundary:administrative'])).slice(0, 6); if (!st.results.length) st.err = 'Nothing found'; } catch (e) { st.err = e.message; } drawRes(el); };
    el.querySelector('#hgo').onclick = go;
    el.querySelector('#hq').onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); go(); } };
    el.querySelector('#hme').onclick = async () => { try { const l = await locateMe(); await save('Near my location', l.lat, l.lon); } catch (e) { st.err = e.message; drawRes(el); } };
    el.addEventListener('click', e => { const b = e.target.closest('[data-h]'); if (b) { const r = st.results[Number(b.dataset.h)]; save([r.name, r.address].filter(Boolean).join(', ').slice(0, 60), r.lat, r.lon); } });
  });
}

// ---------- events ----------
document.addEventListener('click', e => {
  const x = e.target.closest('[data-ext]'); if (!x) return;
  e.preventDefault(); e.stopPropagation(); openOut(x.dataset.ext);
}, true);
document.addEventListener('click', async e => {
  const t = e.target.closest('[data-tab],[data-day],[data-week],[data-act],[data-dq],[data-edit-pantry],[data-recipe],[data-check],[data-delitem]');
  if (!t || t.closest('.sheet')) return;
  try {
    if (t.dataset.tab) { S.tab = t.dataset.tab; render(); $('#main').scrollTop = 0; return; }
    if (t.dataset.day) return dayEditor(t.dataset.day);
    if (t.dataset.week) { S.weekStart = ymd(addDays(parseYmd(S.weekStart), Number(t.dataset.week))); return render(); }
    if (t.dataset.editPantry) return pantryEditor(t.dataset.editPantry);
    if (t.dataset.recipe) return recipeView(t.dataset.recipe);
    if (t.dataset.dq) { const p = S.pantry.find(x => x.id === t.dataset.dq); const q = Math.max(0, Number(p.qty) + Number(t.dataset.d)); p.qty = q; render(); const r = await sb.from('pantry_items').update({ qty: q, updated_at: new Date().toISOString() }).eq('id', p.id); if (r.error) fail(r.error); return; }
    if (t.dataset.check) { const l = S.list.find(x => x.id === t.dataset.check); l.checked = t.checked; render(); const r = await sb.from('shopping_items').update({ checked: l.checked }).eq('id', l.id); if (r.error) fail(r.error); return; }
    if (t.dataset.delitem) { S.list = S.list.filter(x => x.id !== t.dataset.delitem); render(); const r = await sb.from('shopping_items').delete().eq('id', t.dataset.delitem); if (r.error) fail(r.error); return; }
    const a = t.dataset.act;
    if (a === 'addpantry') return pantryEditor(null);
    if (a === 'addrecipe') return recipeEditor(null);
    if (a === 'buildlist') { t.disabled = true; await buildList(); return; }
    if (a === 'putaway') return checkedToPantry();
    if (a === 'copycode') { try { await navigator.clipboard.writeText(`Join our household on We're Cooked with code ${S.household.invite_code}`); toast('Invite copied'); } catch (_) { toast('Code: ' + S.household.invite_code); } return; }
    if (a === 'importlib') return importLibrary(t);
    if (a === 'sethome') return homeEditor();
    if (a === 'signout') { if (S.channel) sb.removeChannel(S.channel); await sb.auth.signOut(); return; }
  } catch (err) { fail(err); }
});

window.__back = () => { const s = $('.sheet'); if (s) { s.remove(); render(); return true; } if (S.session && S.household && S.tab !== 'week') { S.tab = 'week'; render(); return true; } return false; };

sb.auth.onAuthStateChange((ev, session) => {
  const was = S.session?.user?.id; S.session = session;
  if (!session) { S.household = null; S.me = null; render(); return; }
  if (session.user.id !== was) setTimeout(enter, 0);
});
sb.auth.getSession().then(({ data }) => { S.session = data.session; if (data.session) enter(); else render(); });

if ('serviceWorker' in navigator && location.hostname.endsWith('github.io')) navigator.serviceWorker.register('sw.js').catch(() => {});
}
