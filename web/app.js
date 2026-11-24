{
const SUPABASE_URL = 'https://iticnrxdxykvgwoueqtk.supabase.co';
const SUPABASE_KEY = 'sb_publishable_JyHvBjN_1lfvcjsLfX2ybQ_lnU67nP_';
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'pkce' } });
const IS_APP = !!(window.Android && window.Android.openExternal);
const IS_IOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const WEB_HOME = 'https://nychawg.github.io/werecooked/';

// ---------- helpers ----------
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = n => String(n).padStart(2, '0');
const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const parseYmd = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const money = n => { const v = Math.round(Number(n || 0) * 100) / 100; return '$' + v.toLocaleString(undefined, { minimumFractionDigits: v % 1 ? 2 : 0, maximumFractionDigits: 2 }); };
const fmtQty = q => { if (q == null || q === '') return ''; const n = Math.round(Number(q) * 100) / 100; const w = Math.floor(n), f = n - w; const fr = [[.25, '¼'], [.5, '½'], [.75, '¾'], [.33, '⅓'], [.67, '⅔'], [.125, '⅛']].find(([v]) => Math.abs(v - f) < .03); return f < .03 ? String(w) : fr ? (w ? w : '') + fr[1] : String(n); };
const norm = s => String(s || '').toLowerCase().replace(/\(.*?\)/g, '').replace(/,.*$/, '').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim().replace(/(es|s)$/, '');
const same = (a, b) => { const x = norm(a), y = norm(b); return !!x && !!y && (x === y || (x.length > 3 && y.length > 3 && (x.includes(y) || y.includes(x)))); };
const normUnit = u => { u = String(u || '').toLowerCase().replace(/\.$/, ''); const m = { cups: 'cup', c: 'cup', tbsps: 'tbsp', tablespoon: 'tbsp', tablespoons: 'tbsp', tsps: 'tsp', teaspoon: 'tsp', teaspoons: 'tsp', lbs: 'lb', pound: 'lb', pounds: 'lb', ounce: 'oz', ounces: 'oz', grams: 'g', gram: 'g', cloves: 'clove', cans: 'can', pieces: 'piece', slices: 'slice', bunches: 'bunch', each: '' }; return u in m ? m[u] : u; };
const toast = t => { const e = $('#toast'); e.textContent = t; e.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(() => e.classList.remove('on'), 2600); };
const UNITS = 'cups?|tbsps?|tablespoons?|tsps?|teaspoons?|oz|ounces?|lbs?|pounds?|g|grams?|kg|ml|l|cloves?|cans?|pinch|bunch(?:es)?|pieces?|slices?|sticks?|heads?|packages?|pkgs?|jars?|bags?|boxes|box|dozen|qt|gal';
const FRAC = { '½': .5, '¼': .25, '¾': .75, '⅓': 1 / 3, '⅔': 2 / 3, '⅛': .125 };
function parseIng(line) {
  let s = String(line).trim().replace(/^[-•*▢☐]\s*/, ''); if (!s) return null;
  const m = new RegExp(`^((?:\\d+\\s+)?\\d*[.\\/]?\\d+|\\d+|[½¼¾⅓⅔⅛])?\\s*([½¼¾⅓⅔⅛])?\\s*(${UNITS})?\\.?\\s+(.+)$`, 'i').exec(s);
  if (!m || (!m[1] && !m[2])) return { qty: null, unit: '', name: s };
  let q = 0; const a = m[1] || '';
  if (FRAC[a]) q = FRAC[a]; else if (a.includes('/')) { for (const t of a.split(/\s+/)) { if (t.includes('/')) { const [x, y] = t.split('/').map(Number); q += x / y; } else q += Number(t); } } else if (a) q = Number(a);
  if (m[2]) q += FRAC[m[2]];
  return { qty: q || null, unit: normUnit(m[3] || ''), name: m[4].trim() };
}
const COUNT_UNITS = ['', 'each', 'bunch', 'can', 'clove', 'piece', 'slice', 'head', 'package', 'pkg', 'jar', 'bag', 'stick', 'dozen', 'box', 'packet', 'ear', 'sprig', 'sheet'];
const roundBuy = (q, u) => q == null ? null : COUNT_UNITS.includes(normUnit(u)) ? Math.ceil(q - 0.001) : Math.ceil(q * 4 - 0.001) / 4;
const buyName = n => String(n || '').replace(/\(.*?\)/g, '').replace(/,.*$/, '').replace(/\s+(to garnish|for garnish|for serving|to serve|divided)$/i, '').replace(/\s+/g, ' ').trim();
const ingLine = i => [fmtQty(i.qty), i.unit, i.name].filter(Boolean).join(' ');
const KINDS = { cook: 'Cooking in', out: 'Eating out', takeout: 'Takeout', leftovers: 'Leftovers', away: 'Nobody home', other: 'Other plans' };
const CATS = ['Produce', 'Meat & Seafood', 'Dairy & Eggs', 'Bakery', 'Pantry', 'Spices', 'Frozen', 'Drinks', 'Snacks', 'Household', 'Other'];
const RCATS = {
  breakfast: ['Breakfast', '🍳', '#D68A1E'], main: ['Main dish', '🍲', '#A8432A'], side: ['Side', '🥔', '#5F8A3E'], soup: ['Soup & stew', '🥣', '#B9682F'],
  salad: ['Salad', '🥗', '#3F8A5A'], appetizer: ['Appetizer', '🧀', '#C98A12'], dessert: ['Dessert', '🥧', '#9A4D72'], bread: ['Bread', '🍞', '#A97A3E'],
  drink: ['Drink', '☕', '#3D6F96'], sauce: ['Sauce', '🫙', '#8A3A2C'], seasoning: ['Seasoning', '🧂', '#6E6150'], dressing: ['Dressing', '🥄', '#5C7A4A'], condiment: ['Condiment', '🫙', '#7A5A2E']
};
const COMPONENT_CATS = ['sauce', 'seasoning', 'dressing', 'condiment', 'drink'];
const DEFAULT_BOOKS = [['Family Recipes', '👪', '#2E6B4E'], ['Quick Meals', '⚡', '#D24F14'], ['Arkansas Classics', '🐗', '#8A2A2A'], ['Thanksgiving', '🦃', '#A0611C'], ['Holiday & Desserts', '🥧', '#7A3F6B']];
const BOOK_COLORS = ['#2E6B4E', '#D24F14', '#8A2A2A', '#A0611C', '#7A3F6B', '#2F6F9F', '#5E7D2A', '#4B4A8A', '#9A6A12', '#3D3A36'];
const EMOJI = [[/waffle/, '🧇'], [/pancake/, '🥞'], [/french toast/, '🍞'], [/turkey/, '🦃'], [/duck/, '🦆'], [/catfish|fish|salmon|bream|crappie/, '🐟'], [/shrimp|crawfish|crab|seafood|oyster/, '🦐'], [/frog/, '🐸'],
  [/taco|burrito|nacho|tamale/, '🌮'], [/burger|patty melt/, '🍔'], [/sandwich|blt|bologna|po' boy/, '🥪'], [/pizza/, '🍕'], [/chili|gumbo|stew|soup|chowder|étouffée|etouffee/, '🍲'],
  [/spaghetti|alfredo|pasta|mac and cheese|tetrazzini|noodle|stroganoff/, '🍝'], [/fried chicken|chicken/, '🍗'], [/steak|ribeye|roast|beef/, '🥩'], [/ham|ribs|pork|bologna|spam/, '🍖'],
  [/egg/, '🥚'], [/rice/, '🍚'], [/potato|fries|hash/, '🥔'], [/corn/, '🌽'], [/tomato/, '🍅'], [/okra|green|cabbage|bean|pea|squash|zucchini|broccoli|collard/, '🥬'], [/pickle/, '🥒'],
  [/biscuit|bread|roll|cornbread|hushpupp/, '🍞'], [/dip|cheese|fondue|pimento/, '🧀'], [/ice cream|sorbet/, '🍨'], [/cake/, '🍰'], [/cookie|crispies/, '🍪'],
  [/pie|cobbler|crisp|pudding|shortcake|ambrosia|salad/, '🥧'], [/fudge|candy|praline|brittle|divinity|frosting/, '🍬'], [/latte|coffee|tea/, '☕'], [/apple/, '🍎'], [/peach/, '🍑'], [/strawberr/, '🍓'], [/banana/, '🍌'],
  [/seasoning|rub|blend/, '🧂'], [/sauce|gravy|dressing|preserve|chow|vinegar|jelly/, '🫙']];

// ---------- state ----------
const S = { session: null, me: null, household: null, members: [], pantry: [], recipes: [], books: [], plan: [], list: [], spending: [], tab: 'week', weekStart: ymd(new Date()),
  recipeQ: '', rview: 'meal', book: null, channel: null, library: [], libLoaded: false, loc: null, checks: {}, done: {}, pantryQ: '' };
try { S.loc = JSON.parse(localStorage.getItem('wc-loc') || 'null'); } catch (_) { }
const memberById = id => S.members.find(m => m.user_id === id);
const initials = n => (n || '?').trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
const av = (m, off) => m ? `<span class="av${off ? ' off' : ''}" style="background:${esc(m.color)}" title="${esc(m.display_name)}">${esc(initials(m.display_name))}</span>` : '';
const bookById = id => S.books.find(b => b.id === id);

// ---------- recipe classification ----------
function catOf(r) {
  if (r.category && RCATS[r.category]) return r.category;
  const t = (r.title || '').toLowerCase(), tags = (r.tags || []).join(' ').toLowerCase();
  if (/seasoning|rub|blend/.test(t)) return 'seasoning';
  if (/dressing/.test(t)) return 'dressing';
  if (/sauce|gravy(?! and)|syrup/.test(t) && !/chicken|steak|biscuit/.test(t)) return 'sauce';
  if (/latte|tea$|coffee|smoothie/.test(t)) return 'drink';
  if (/preserve|relish|chow chow|pickled|vinegar|jelly/.test(t)) return 'condiment';
  if (/dessert|cake|pie|cookie|fudge|cobbler|pudding|ice cream|sorbet|candy|brittle|praline|crisp|frosting/.test(t + ' ' + tags)) return 'dessert';
  if (/breakfast|waffle|pancake|french toast|grits|scrambled/.test(t + ' ' + tags)) return 'breakfast';
  if (/soup|stew|chili|gumbo|chowder/.test(t)) return 'soup';
  if (/dip|appetizer|deviled|nachos|popper/.test(t + ' ' + tags)) return 'appetizer';
  if (/bread|biscuit|roll|cornbread/.test(t)) return 'bread';
  if (/side|potato|greens|beans|peas|okra|slaw|corn|casserole|rice/.test(t + ' ' + tags)) return 'side';
  return 'main';
}
const kindOf = r => r.kind === 'component' || (r.kind == null && COMPONENT_CATS.includes(catOf(r))) ? 'component' : 'meal';
const isMeal = r => kindOf(r) === 'meal';
const emojiOf = r => { const t = (r.title || '').toLowerCase(); const e = EMOJI.find(([re]) => re.test(t)); return e ? e[1] : RCATS[catOf(r)][1]; };
const hash = s => { let h = 0; for (const ch of String(s)) h = (h * 31 + ch.charCodeAt(0)) | 0; return Math.abs(h); };
const colorOf = r => { const base = RCATS[catOf(r)][2], v = hash(r.title) % 4; return v === 0 ? base : `color-mix(in oklab, ${base}, ${v % 2 ? '#000' : '#fff'} ${v === 3 ? 18 : 12}%)`; };
const fmtTime = m => !m ? '' : m < 90 ? m + ' min' : (Math.round(m / 60 * 2) / 2) + ' hr';
const isTodo = r => !(r.ingredients || []).length && !(r.steps || []).length;
const stars = n => n ? '★'.repeat(n) + '☆'.repeat(5 - n) : '';

// ---------- data ----------
async function loadAll() {
  const hid = S.household.id;
  const [mem, pan, rec, pl, li, bk, sp] = await Promise.all([
    sb.from('members').select('*').eq('household_id', hid).order('joined_at'),
    sb.from('pantry_items').select('*').eq('household_id', hid).order('name'),
    sb.from('recipes').select('*').eq('household_id', hid).order('title'),
    sb.from('meal_plan').select('*').eq('household_id', hid).gte('day', ymd(addDays(new Date(), -120))).order('day'),
    sb.from('shopping_items').select('*').eq('household_id', hid).order('created_at'),
    sb.from('recipe_books').select('*').eq('household_id', hid).order('sort'),
    sb.from('spending').select('*').eq('household_id', hid).gte('day', ymd(addDays(new Date(), -62))).order('day')
  ]);
  for (const r of [mem, pan, rec, pl, li, bk, sp]) if (r.error) throw r.error;
  S.members = mem.data; S.pantry = pan.data; S.recipes = rec.data; S.plan = pl.data; S.list = li.data; S.books = bk.data; S.spending = sp.data;
  if (!S.libLoaded) await loadLibrary();
}
async function ensureBooks() {
  if (S.books.length) return;
  const rows = DEFAULT_BOOKS.map(([name, emoji, color], i) => ({ household_id: S.household.id, name, emoji, color, sort: i }));
  const r = await sb.from('recipe_books').upsert(rows, { onConflict: 'household_id,name', ignoreDuplicates: true }); if (r.error) throw r.error;
  const b = await sb.from('recipe_books').select('*').eq('household_id', S.household.id).order('sort'); if (!b.error) S.books = b.data;
}
let reloadT;
function subscribe() {
  if (S.channel) sb.removeChannel(S.channel);
  const f = `household_id=eq.${S.household.id}`;
  S.channel = sb.channel('hh-' + S.household.id);
  for (const t of ['members', 'pantry_items', 'recipes', 'meal_plan', 'shopping_items', 'recipe_books', 'spending'])
    S.channel.on('postgres_changes', { event: '*', schema: 'public', table: t, filter: f }, () => { clearTimeout(reloadT); reloadT = setTimeout(async () => { try { await loadAll(); if (!$('.sheet')) render(); } catch (e) { } }, 400); });
  S.channel.subscribe();
}
const fail = e => { console.error(e); toast(e?.message || 'Something went wrong. Try again.'); };

// ---------- recipe library (found recipes + bundled Southern library) ----------
const PARTIAL = /only shows part of the recipe|Only the name was saved|no amounts or steps were saved|ingredient amounts weren't in the screenshot/i;
function cleanNote(old, extra) {
  const kept = String(old || '').split(/(?<=\.)\s+/).filter(s => s && !PARTIAL.test(s) && !/open the original photo for the rest|when you write it down|then add the ingredients here/i.test(s)).join(' ');
  return [kept, 'Filled in with a classic Southern version so you can cook it now — edit it to make it yours.', extra].filter(Boolean).join(' ');
}
function improve(cur, L) {
  // returns the fields of L that would improve cur, or null
  const patch = {};
  const curIng = cur.ingredients || [];
  if ((L.ingredients || []).length && (!curIng.length || (curIng.every(i => i.qty == null) && L.ingredients.some(i => i.qty != null)))) { patch.ingredients = L.ingredients; if (isTodo(cur)) patch.servings = L.servings; }
  if ((L.steps || []).length && (!(cur.steps || []).length || PARTIAL.test(cur.notes || ''))) patch.steps = L.steps;
  if (!Object.keys(patch).length) return null;
  patch.notes = cleanNote(cur.notes, L.notes && !String(cur.notes || '').includes(L.notes) ? L.notes : '');
  patch.tags = [...new Set([...(cur.tags || []).map(t => t === 'to write down' ? 'to personalize' : t), ...(L.tags || [])])];
  if (!cur.time_min && L.time_min) patch.time_min = L.time_min;
  return patch;
}
async function loadLibrary() {
  const [db, bundle] = await Promise.all([
    sb.from('recipe_library').select('*').order('title').then(r => r.error ? [] : r.data),
    fetch('library.json').then(r => r.ok ? r.json() : []).catch(() => [])
  ]);
  const m = new Map(db.map(r => [r.title.toLowerCase(), { ...r, book_names: r.book_names || [] }]));
  for (const b of bundle) {
    const k = b.title.toLowerCase(), cur = m.get(k);
    if (!cur) { if (b.ingredients.length && b.steps.length) m.set(k, { ...b }); continue; }
    const out = { ...cur, ...(improve(cur, b) || {}) };
    out.book_names = [...new Set([...(cur.book_names || []), ...b.book_names])];
    out.category = cur.category || b.category; out.kind = b.kind || cur.kind;
    m.set(k, out);
  }
  S.library = [...m.values()]; S.libLoaded = true;
}
function libraryPlan() {
  const byTitle = new Map(S.recipes.map(r => [r.title.toLowerCase(), r]));
  const fresh = S.library.filter(l => !byTitle.has(l.title.toLowerCase()));
  const fills = [], meta = [];
  for (const L of S.library) {
    const r = byTitle.get(L.title.toLowerCase()); if (!r) continue;
    const p = improve(r, L);
    if (p) fills.push([r, L, p]);
    else if ((!(r.books || []).length && (L.book_names || []).length) || !r.category) meta.push([r, L]);
  }
  return { fresh, fills, meta };
}
async function ensureBookNames(names) {
  const missing = [...new Set(names)].filter(n => n && !S.books.some(b => b.name === n));
  if (missing.length) {
    const rows = missing.map((name, i) => { const d = DEFAULT_BOOKS.find(x => x[0] === name); return { household_id: S.household.id, name, emoji: d?.[1] || '📖', color: d?.[2] || BOOK_COLORS[(S.books.length + i) % BOOK_COLORS.length], sort: S.books.length + i }; });
    const r = await sb.from('recipe_books').upsert(rows, { onConflict: 'household_id,name', ignoreDuplicates: true }); if (r.error) throw r.error;
    const b = await sb.from('recipe_books').select('*').eq('household_id', S.household.id).order('sort'); if (!b.error) S.books = b.data;
  }
  return n => S.books.find(b => b.name === n)?.id;
}
async function importLibrary(btn) {
  const { fresh, fills, meta } = libraryPlan();
  if (btn) { btn.disabled = true; btn.textContent = 'Adding…'; }
  try {
    const idOf = await ensureBookNames(S.library.flatMap(l => l.book_names || []));
    const booksFor = (L, existing = []) => [...new Set([...existing, ...(L.book_names || []).map(idOf).filter(Boolean)])];
    if (fresh.length) {
      const rows = fresh.map(L => ({ household_id: S.household.id, title: L.title, servings: L.servings || 4, time_min: L.time_min, tags: L.tags || [], ingredients: L.ingredients || [], steps: L.steps || [],
        notes: L.notes || null, source_url: L.source_url || null, created_by: S.session.user.id, kind: L.kind || kindOf(L), category: L.category || catOf(L), books: booksFor(L), found_in: L.found_in || null }));
      for (let i = 0; i < rows.length; i += 50) { const r = await sb.from('recipes').insert(rows.slice(i, i + 50)); if (r.error) throw r.error; }
    }
    const ups = [...fills.map(([r, L, p]) => [r.id, { ...p, kind: L.kind || kindOf(r), category: r.category || L.category || catOf(r), books: booksFor(L, r.books) }]),
      ...meta.map(([r, L]) => [r.id, { kind: L.kind || kindOf(r), category: r.category || L.category || catOf(r), books: booksFor(L, r.books) }])];
    for (let i = 0; i < ups.length; i += 8) await Promise.all(ups.slice(i, i + 8).map(([id, row]) => sb.from('recipes').update(row).eq('id', id).then(r => { if (r.error) throw r.error; })));
    await loadAll(); render();
    toast([fresh.length && `Added ${fresh.length} recipes`, fills.length && `filled in ${fills.length}`].filter(Boolean).join(', ') || 'Cookbooks organized');
  } catch (e) { if (btn) { btn.disabled = false; btn.textContent = 'Try again'; } fail(e); }
}

// ---------- planning logic ----------
function pantryFor(name) { return S.pantry.find(p => same(p.name, name)); }
function recipeMatch(r) {
  const ings = (r.ingredients || []).filter(i => !/^(salt|pepper|black pepper|water|salt and pepper|kosher salt|ice)$/i.test(norm(i.name)));
  if (!ings.length) return { pct: 0, have: 0, total: 0, missing: [] };
  const missing = ings.filter(i => { const p = pantryFor(i.name); return !p || Number(p.qty) <= 0; });
  return { pct: Math.round((ings.length - missing.length) / ings.length * 100), have: ings.length - missing.length, total: ings.length, missing };
}
function ideas(limit = 3) {
  const soon = S.pantry.filter(p => p.expires_on && parseYmd(p.expires_on) <= addDays(new Date(), 3) && Number(p.qty) > 0);
  return S.recipes.filter(isMeal).map(r => { const m = recipeMatch(r); const uses = soon.filter(p => (r.ingredients || []).some(i => same(i.name, p.name))).length; return { r, m, score: m.pct + uses * 15 + (r.favorite ? 5 : 0) + (r.rating || 0) * 2 }; })
    .filter(x => x.m.total >= 3 && x.m.pct >= 50).sort((a, b) => b.score - a.score).slice(0, limit);
}
const homeCount = p => Math.max(0, S.members.length - (p?.away?.length || 0)) || 1;
const factorFor = (p, r) => (p.headcount || homeCount(p)) / (r.servings || 4);

async function buildList() {
  const hid = S.household.id, today = ymd(new Date()), end = ymd(addDays(new Date(), 6));
  const need = new Map();
  const add = (name, qty, unit, category) => { name = buyName(name); if (!name || /\bwater\b|^ice$/i.test(name)) return; const k = norm(name) + '|' + normUnit(unit); const cur = need.get(k); if (cur) { cur.qty = (cur.qty || 0) + (qty || 0); } else need.set(k, { name, qty: qty || null, unit: normUnit(unit), category }); };
  for (const p of S.plan) {
    if (p.kind !== 'cook' || p.cooked || p.day < today || p.day > end || !p.recipe_id) continue;
    const r = S.recipes.find(x => x.id === p.recipe_id); if (!r) continue;
    const f = factorFor(p, r);
    for (const i of r.ingredients || []) add(i.name, i.qty ? i.qty * f : null, i.unit, pantryFor(i.name)?.category || 'Other');
  }
  const rows = [];
  for (const n of need.values()) {
    if (/^(salt|water|ice)$/.test(norm(n.name))) continue;
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
  if (r) ratePrompt(r);
}
async function addToPantry(items) {
  // items: [{name, qty, unit, category, expires_on, barcode}] — merges with what's already there
  let added = 0, updated = 0;
  for (const it of items) {
    const p = (it.barcode && S.pantry.find(x => x.barcode === it.barcode)) || pantryFor(it.name); const q = Number(it.qty) || 1;
    if (p && (normUnit(p.unit) === normUnit(it.unit) || !it.unit || !p.unit)) {
      const u = await sb.from('pantry_items').update({ qty: Math.round((Number(p.qty) + q) * 100) / 100, updated_at: new Date().toISOString(), ...(it.expires_on ? { expires_on: it.expires_on } : {}), ...(it.barcode && !p.barcode ? { barcode: it.barcode } : {}) }).eq('id', p.id); if (u.error) throw u.error; updated++;
      p.qty = Number(p.qty) + q;
    } else {
      const i = await sb.from('pantry_items').insert({ household_id: S.household.id, name: it.name, qty: q, unit: normUnit(it.unit || ''), category: CATS.includes(it.category) ? it.category : 'Other', expires_on: it.expires_on || null, barcode: it.barcode || null }); if (i.error) throw i.error; added++;
      S.pantry.push({ name: it.name, qty: q, unit: it.unit || '' });
    }
  }
  return { added, updated };
}
async function checkedToPantry() {
  const done = S.list.filter(l => l.checked); if (!done.length) return toast('Check off items first');
  await addToPantry(done.map(l => ({ name: l.name, qty: l.qty, unit: l.unit, category: l.category })));
  const d = await sb.from('shopping_items').delete().in('id', done.map(x => x.id)); if (d.error) throw d.error;
  await loadAll(); render(); toast(`Put away ${done.length} item${done.length > 1 ? 's' : ''}`);
  spendEditor('groceries');
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
  const pts = places.map((p, i) => { const mk = L.circleMarker([p.lat, p.lon], { radius: 9, color: '#fff', weight: 2, fillColor: '#FF6A1F', fillOpacity: 1 }).addTo(m); mk.bindTooltip(p.name); mk.on('click', () => pick(i)); return [p.lat, p.lon]; });
  const me = biasPoint(); if (me) L.circleMarker([me.lat, me.lon], { radius: 6, color: '#fff', weight: 2, fillColor: '#2E6B4E', fillOpacity: 1 }).addTo(m).bindTooltip('Home / you');
  if (pts.length > 1) m.fitBounds(pts, { padding: [24, 24] }); else if (pts.length) m.setView(pts[0], 15); else if (me) m.setView([me.lat, me.lon], 13); else m.setView([40.7, -73.95], 11);
  setTimeout(() => m.invalidateSize(), 50); return m;
}
function usualSpots(kind) {
  const c = new Map();
  for (const p of S.plan) if (p.place_name && (!kind || p.kind === kind)) { const k = p.place_name.toLowerCase(); const cur = c.get(k) || { n: 0, place: { name: p.place_name, address: p.place_address, lat: p.place_lat, lon: p.place_lon } }; cur.n++; c.set(k, cur); }
  return [...c.values()].sort((a, b) => b.n - a.n).slice(0, 6).map(x => x.place);
}

// ---------- AI helper (Supabase edge function) ----------
async function ai(mode, body) {
  const { data, error } = await sb.functions.invoke('ai', { body: { mode, ...body } });
  if (error) {
    let msg = error.message, code;
    try { const j = await error.context.json(); msg = j.error || msg; code = j.code; } catch (_) { }
    const e = new Error(code === 'NO_KEY' ? 'Photo scanning and the AI chef need one-time setup: add an ANTHROPIC_API_KEY secret in Supabase (Edge Functions › Secrets).' : msg); e.code = code; throw e;
  }
  if (data?.error) throw new Error(data.error);
  return data;
}
function imageToBase64(src, max = 1600) {
  return new Promise((res, rej) => {
    const draw = img => { const w = img.videoWidth || img.naturalWidth || img.width, h = img.videoHeight || img.naturalHeight || img.height; const s = Math.min(1, max / Math.max(w, h)); const c = document.createElement('canvas'); c.width = Math.round(w * s); c.height = Math.round(h * s); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); res(c.toDataURL('image/jpeg', 0.82).split(',')[1]); };
    if (src instanceof HTMLVideoElement) return draw(src);
    const img = new Image(); img.onload = () => { draw(img); URL.revokeObjectURL(img.src); }; img.onerror = () => rej(new Error('Could not read that photo')); img.src = URL.createObjectURL(src);
  });
}
let zxingP;
const loadZxing = () => zxingP || (zxingP = new Promise((res, rej) => { if (window.ZXing) return res(window.ZXing); const s = document.createElement('script'); s.src = 'vendor/zxing.min.js'; s.onload = () => res(window.ZXing); s.onerror = () => { zxingP = null; rej(new Error('Barcode reader failed to load')); }; document.head.appendChild(s); }));
async function lookupBarcode(code) {
  try {
    const r = await fetch(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json?fields=product_name,brands,quantity,categories_tags`);
    const j = await r.json(); if (j.status !== 1 || !j.product) return null;
    const p = j.product, tags = (p.categories_tags || []).join(' ');
    const category = /dairy|milk|cheese|yogurt|egg/.test(tags) ? 'Dairy & Eggs' : /meat|fish|seafood|poultry/.test(tags) ? 'Meat & Seafood' : /frozen/.test(tags) ? 'Frozen' : /beverage|drink|juice|soda|water/.test(tags) ? 'Drinks' : /snack|chip|cookie|candy|chocolate/.test(tags) ? 'Snacks' : /spice|seasoning|herb/.test(tags) ? 'Spices' : /bread|bakery/.test(tags) ? 'Bakery' : /fruit|vegetable|produce/.test(tags) ? 'Produce' : 'Pantry';
    const name = [p.brands?.split(',')[0], p.product_name].filter(Boolean).join(' ').trim();
    return { name: name || p.product_name || '', size: p.quantity || '', category };
  } catch (_) { return null; }
}

// ---------- icons ----------
const I = {
  week: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  pantry: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M4 9h16M4 15h16M9 6h2M9 12h2M9 18h2"/>',
  recipes: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5M9 7h7M9 11h5"/>',
  list: '<path d="M9 6h11M9 12h11M9 18h11"/><path d="m3.5 6 1.2 1.2L7 5M3.5 12l1.2 1.2L7 11M3.5 18l1.2 1.2L7 17"/>',
  family: '<circle cx="9" cy="8" r="3.2"/><circle cx="17" cy="9.5" r="2.5"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M15 14.6c3.2-.6 6 1.6 6 5.4"/>',
  scan: '<path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"/><path d="M7 8v8M10 8v8M13 8v8M16.5 8v8"/>',
  camera: '<path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13.5" r="3.5"/>',
  receipt: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6M9 16h3"/>',
  plus: '<path d="M12 5v14M5 12h14"/>', spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>',
  link: '<path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/>',
  pen: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>', search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  cart: '<path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6"/><circle cx="10" cy="20" r="1.4"/><circle cx="17" cy="20" r="1.4"/>',
  cal: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4M8 14h3"/>', fire: '<path d="M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-3 2-4 2-7 1.5 1 2 2 2 3 0-2 0-4 1-6z"/>'
};
const svg = k => `<svg viewBox="0 0 24 24" aria-hidden="true">${I[k]}</svg>`;
const TABS = [['week', 'Week'], ['pantry', 'Pantry'], ['recipes', 'Cookbooks'], ['list', 'List'], ['family', 'Family']];

function shell(inner) {
  const lowN = S.pantry.filter(p => Number(p.par) > 0 && Number(p.qty) < Number(p.par)).length;
  const listN = S.list.filter(l => !l.checked).length;
  return `<header class="top"><img src="logo.svg" alt=""><div class="brand"><b>We're Cooked</b><span>${esc(S.household.name)}</span></div>${av(S.me)}</header>
  <main id="main">${inner}</main>
  <nav class="tabs" aria-label="Sections">${TABS.map(([k, l]) => `<button data-tab="${k}" aria-current="${S.tab === k ? 'page' : 'false'}"><span class="pill">${svg(k === 'recipes' ? 'recipes' : k)}</span><span>${l}</span>${k === 'list' && listN ? `<b class="cnt">${listN}</b>` : ''}${k === 'pantry' && lowN ? `<b class="cnt">${lowN}</b>` : ''}</button>`).join('')}</nav>`;
}

// ---------- week ----------
function spendSummary() {
  const now = new Date(), wk = ymd(addDays(now, -6)), mo = ymd(new Date(now.getFullYear(), now.getMonth(), 1));
  const sum = (from, k) => S.spending.filter(s => s.day >= from && (!k || s.kind === k)).reduce((a, s) => a + Number(s.amount), 0) + S.plan.filter(p => p.cost && p.day >= from && (!k || p.kind === k)).reduce((a, p) => a + Number(p.cost), 0);
  return { wk: { groceries: sum(wk, 'groceries'), out: sum(wk, 'out'), takeout: sum(wk, 'takeout') }, mo: sum(mo) };
}
function weekView() {
  const start = parseYmd(S.weekStart), today = ymd(new Date());
  const days = [...Array(7)].map((_, i) => ymd(addDays(start, i)));
  const ide = ideas(1)[0];
  const cards = days.map(d => {
    const p = S.plan.find(x => x.day === d); const dt = parseYmd(d);
    const k = p?.kind; const r = p?.recipe_id && S.recipes.find(x => x.id === p.recipe_id);
    const title = p ? (r?.title || p.place_name || p.title || (k === 'away' ? 'No dinner at home' : KINDS[k])) : 'Nothing planned';
    const cook = p?.cook_id && memberById(p.cook_id);
    const who = S.members.map(m => av(m, p?.away?.includes(m.user_id))).join('');
    return `<button class="card day${d === today ? ' today' : ''}" data-day="${d}" style="--k:var(--${k || 'line'})">
      <span class="dd"><span>${d === today ? 'Today' : DOW[dt.getDay()]}</span><b>${dt.getDate()}</b></span>
      <span>${p ? `<span class="kind" style="--k:var(--${k})"><i></i>${esc(KINDS[k])}${p.cooked ? ' · cooked ✓' : ''}</span>` : ''}
        <span class="dt${p ? '' : ' none'}">${r ? emojiOf(r) + ' ' : ''}${esc(title)}</span>
        ${p?.place_name ? `<span class="dm" style="display:block">${esc(p.place_address || '')}${p.place_address ? ' · ' : ''}<span role="link" tabindex="0" data-ext="${esc(mapsUrl(p))}" style="color:var(--greend);font-weight:700;text-decoration:underline">Directions</span></span>` : ''}
        <span class="row" style="margin-top:4px"><span class="dm">${[cook ? `${esc(cook.display_name)} cooking` : '', p && k !== 'away' ? `${p.headcount || homeCount(p)} eating` : '', p?.cost ? money(p.cost) : '', p?.note ? esc(p.note) : ''].filter(Boolean).join(' · ')}</span><span class="avs">${who}</span></span>
        ${!p && ide && d >= today ? `<span class="idea">${svg('spark').replace('<svg', '<svg width="15" height="15" style="stroke:currentColor;fill:none;stroke-width:2"')} Idea: ${esc(ide.r.title)} · ${ide.m.have}/${ide.m.total} at home</span>` : ''}
      </span></button>`;
  }).join('');
  const label = `${parseYmd(days[0]).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – ${parseYmd(days[6]).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
  const sp = spendSummary();
  return `<div class="weekbar"><button class="ib" data-week="-7" aria-label="Previous week">‹</button><h2>${label}</h2><button class="ib" data-week="7" aria-label="Next week">›</button></div>
  <div class="legend">${Object.entries(KINDS).map(([k, l]) => `<span class="kind" style="--k:var(--${k})"><i></i>${l}</span>`).join('')}</div>
  ${cards}
  <button class="btn wide" data-act="buildlist">${svg('cart')} Build this week's shopping list</button>
  <h3>Food spending</h3>
  <div class="card"><div class="stat"><div><b>${money(sp.wk.groceries)}</b><span>Groceries · 7 days</span></div><div><b>${money(sp.wk.out)}</b><span>Eating out</span></div><div><b>${money(sp.wk.takeout)}</b><span>Takeout</span></div></div>
  <div class="row" style="margin-top:12px"><span class="imeta sp">${money(sp.mo)} so far this month</span><button class="btn sm ghost" data-act="logspend">+ Log spending</button></div></div>`;
}

// ---------- pantry ----------
function pantryView() {
  const soon = ymd(addDays(new Date(), 3)), q = S.pantryQ.toLowerCase();
  const items = S.pantry.filter(p => !q || p.name.toLowerCase().includes(q));
  const groups = CATS.map(c => [c, items.filter(p => (CATS.includes(p.category) ? p.category : 'Other') === c)]).filter(g => g[1].length);
  const low = S.pantry.filter(p => Number(p.par) > 0 && Number(p.qty) < Number(p.par)).length, exp = S.pantry.filter(p => p.expires_on && p.expires_on <= soon && Number(p.qty) > 0).length;
  return `<h2>Pantry</h2><p class="lede">${S.pantry.length} items${low ? ` · ${low} running low` : ''}${exp ? ` · ${exp} to use soon` : ''}</p>
  <div class="tools">
    <button class="tool" data-act="scanbarcode"><span class="ico">${svg('scan')}</span>Scan barcode</button>
    <button class="tool f" data-act="snappantry"><span class="ico">${svg('camera')}</span>Snap shelves</button>
    <button class="tool" data-act="snapreceipt"><span class="ico">${svg('receipt')}</span>Scan receipt</button>
  </div>
  <div class="row" style="margin-bottom:14px;flex-wrap:nowrap"><div class="search sp" style="margin:0">${svg('search')}<input type="search" id="psearch" placeholder="Search the pantry" value="${esc(S.pantryQ)}" aria-label="Search the pantry"></div><button class="btn" data-act="addpantry" aria-label="Add item">${svg('plus')}</button></div>
  ${S.pantry.length ? '' : `<div class="empty"><span class="e">🥫</span>Nothing here yet. Scan a barcode, snap a photo of your fridge or pantry, or add items by hand. Set a par for staples you never want to run out of.</div>`}
  ${groups.map(([c, items]) => `<h3>${esc(c)}</h3><div class="card">${items.map(p => {
    const lo = Number(p.par) > 0 && Number(p.qty) < Number(p.par); const ex = p.expires_on && p.expires_on <= soon;
    return `<div class="item"><button style="all:unset;cursor:pointer" data-edit-pantry="${p.id}"><span class="iname">${esc(p.name)}</span> ${lo ? '<span class="badge">Low</span>' : ''} ${ex ? `<span class="badge red">${p.expires_on < ymd(new Date()) ? 'Expired' : 'Use soon'}</span>` : ''}
      <span class="imeta" style="display:block">${Number(p.par) > 0 ? `Keep ${fmtQty(p.par)} ${esc(p.unit)}` : 'No par set'}${p.expires_on ? ` · Use by ${parseYmd(p.expires_on).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}` : ''}</span></button>
      <span class="stepper"><button data-dq="${p.id}" data-d="-1" aria-label="Less">−</button><span>${fmtQty(p.qty)} ${esc(p.unit)}</span><button data-dq="${p.id}" data-d="1" aria-label="More">+</button></span></div>`;
  }).join('')}</div>`).join('')}`;
}

// ---------- cookbooks ----------
function rcard(r) {
  const m = isMeal(r) ? recipeMatch(r) : { total: 0 };
  return `<button class="rcard" data-recipe="${r.id}" style="--c:${colorOf(r)}"><span class="art"><span class="e">${emojiOf(r)}</span>${r.favorite ? '<span class="fav">★</span>' : ''}</span>
  <span class="body"><span class="t">${esc(r.title)}</span><span class="m">${isTodo(r) ? '<span class="todo">Needs recipe</span>' : ''}${r.time_min ? `<span>⏱ ${fmtTime(r.time_min)}</span>` : ''}${r.rating ? `<span class="stars">${'★'.repeat(r.rating)}</span>` : ''}${m.total ? `<span class="match">${m.have}/${m.total} at home</span>` : ''}</span></span></button>`;
}
function cookbooksView() {
  const q = S.recipeQ.toLowerCase();
  const pool = S.recipes.filter(r => kindOf(r) === S.rview);
  const inBook = S.book ? pool.filter(r => (r.books || []).includes(S.book)) : pool;
  const list = inBook.filter(r => !q || r.title.toLowerCase().includes(q) || (r.tags || []).join(' ').toLowerCase().includes(q) || (r.ingredients || []).some(i => i.name.toLowerCase().includes(q)))
    .sort((a, b) => (b.favorite - a.favorite) || (b.rating || 0) - (a.rating || 0) || (isTodo(a) - isTodo(b)) || a.title.localeCompare(b.title));
  const { fresh, fills, meta } = libraryPlan();
  const ide = S.rview === 'meal' && !S.book && !q ? ideas(4) : [];
  const groups = {};
  for (const r of list) { const c = catOf(r); (groups[c] = groups[c] || []).push(r); }
  const order = S.rview === 'meal' ? ['main', 'side', 'soup', 'breakfast', 'appetizer', 'bread', 'salad', 'dessert', 'drink', 'sauce', 'seasoning', 'dressing', 'condiment'] : ['sauce', 'seasoning', 'dressing', 'condiment', 'drink', 'main', 'side', 'soup', 'breakfast', 'appetizer', 'bread', 'salad', 'dessert'];
  const counts = id => pool.filter(r => (r.books || []).includes(id)).length;
  return `<div class="row"><h2 class="sp">Cookbooks</h2><button class="btn sm" data-act="addrecipe">${svg('plus')} Add</button></div>
  <p class="lede">${S.recipes.filter(isMeal).length} meals · ${S.recipes.filter(r => !isMeal(r)).length} sauces & staples</p>
  ${fresh.length || fills.length || meta.length ? `<div class="banner"><span class="em">📚</span><span class="sp"><b>${fresh.length ? `${fresh.length} recipes ready to add` : 'Recipes ready to update'}</b><p>${[fresh.length && 'your saved recipes plus Arkansas classics and a full Thanksgiving', fills.length && `${fills.length} of yours filled in with Southern versions`, !fresh.length && !fills.length && meta.length && 'sort recipes into books'].filter(Boolean).join(' · ')}</p></span><button class="btn sm" data-act="importlib">Add</button></div>` : ''}
  <div class="switch" role="group" aria-label="Show"><button data-rview="meal" aria-pressed="${S.rview === 'meal'}">🍽 Meals</button><button data-rview="component" aria-pressed="${S.rview === 'component'}">🫙 Sauces & staples</button></div>
  <div class="shelf" role="group" aria-label="Cookbooks">
    <button class="book" style="--c:#3D3A36" data-book="" aria-pressed="${!S.book}"><span class="e">📚</span><span><b>All recipes</b><br><small>${pool.length}</small></span></button>
    ${S.books.map(b => `<button class="book" style="--c:${esc(b.color)}" data-book="${b.id}" aria-pressed="${S.book === b.id}"><span class="e">${esc(b.emoji)}</span><span><b>${esc(b.name)}</b><br><small>${counts(b.id)}</small></span></button>`).join('')}
    <button class="book add" data-act="newbook"><span><span style="font-size:28px">＋</span><br><b style="font-family:var(--sans);font-size:13px">New book</b></span></button>
  </div>
  ${S.book ? `<div class="row" style="margin:-4px 0 12px"><span class="imeta sp">${esc(bookById(S.book)?.name || '')}</span><button class="btn sm ghost" data-act="editbook">Edit book</button></div>` : ''}
  <div class="search">${svg('search')}<input type="search" id="rq" placeholder="Search recipes, tags or ingredients" value="${esc(S.recipeQ)}" aria-label="Search recipes"></div>
  ${ide.length ? `<h3>Cook tonight with what you have</h3><div class="rgrid">${ide.map(x => rcard(x.r)).join('')}</div>` : ''}
  ${S.rview === 'meal' && !S.book && !q ? `<button class="btn flame wide" style="margin-top:14px" data-act="chef">${svg('spark')} Ask the chef what to make</button>` : ''}
  ${list.length ? order.filter(c => groups[c]).map(c => `<h3>${RCATS[c][0]}${RCATS[c][0].endsWith('s') ? '' : 's'} · ${groups[c].length}</h3><div class="rgrid">${groups[c].map(rcard).join('')}</div>`).join('')
    : `<div class="empty"><span class="e">${S.rview === 'meal' ? '🍽' : '🫙'}</span>${q ? 'No recipes match that search.' : S.book ? 'This book is empty. Open a recipe and tap the book to add it here.' : 'No recipes here yet. Tap Add to type one in, snap a recipe card, or save one from a website.'}</div>`}`;
}

// ---------- list ----------
function listView() {
  const open = S.list.filter(l => !l.checked), done = S.list.filter(l => l.checked);
  const groups = CATS.map(c => [c, open.filter(l => (CATS.includes(l.category) ? l.category : 'Other') === c)]).filter(g => g[1].length);
  const row = l => `<div class="chk${l.checked ? ' done' : ''}"><input type="checkbox" data-check="${l.id}" ${l.checked ? 'checked' : ''} aria-label="Got ${esc(l.name)}"><span><span class="iname">${esc(l.name)}</span><span class="imeta" style="display:block">${[l.qty ? fmtQty(l.qty) + ' ' + l.unit : '', l.source === 'plan' ? 'for this week' : l.source === 'par' ? 'below par' : ''].filter(Boolean).map(esc).join(' · ')}</span></span><button class="del" data-delitem="${l.id}" aria-label="Remove">×</button></div>`;
  return `<div class="row"><h2 class="sp">Shopping list</h2><button class="btn sm ghost" data-act="buildlist">Rebuild</button></div>
  <p class="lede">${open.length} to get${done.length ? ` · ${done.length} in the cart` : ''}</p>
  <form id="addlist" class="row" style="flex-wrap:nowrap;margin-bottom:6px"><input type="text" id="li" placeholder="Add an item, e.g. 2 lb chicken thighs" aria-label="Add item" autocomplete="off"><button class="btn" type="submit" aria-label="Add">${svg('plus')}</button></form>
  ${open.length ? groups.map(([c, items]) => `<h3>${esc(c)}</h3><div class="card">${items.map(row).join('')}</div>`).join('') : `<div class="empty"><span class="e">🛒</span>The list is empty. Tap Rebuild to add what this week's meals need and anything below par.</div>`}
  ${done.length ? `<h3>In the cart</h3><div class="card">${done.map(row).join('')}</div><button class="btn wide" data-act="putaway">Put checked items in the pantry</button>` : ''}
  <button class="btn line wide" style="margin-top:10px" data-act="logspend">Log a grocery trip</button>`;
}

// ---------- family ----------
function familyView() {
  return `<h2>${esc(S.household.name)}</h2><p class="lede">${S.members.length} ${S.members.length === 1 ? 'member' : 'members'}</p>
  <div class="card"><div class="imeta">Invite code — family members sign in, then enter this code to join</div><div class="row" style="margin-top:8px"><span class="code">${esc(S.household.invite_code)}</span><span class="sp"></span><button class="btn sm ghost" data-act="copycode">Copy invite</button></div></div>
  <h3>Members</h3><div class="card">${S.members.map(m => `<div class="item"><span class="row" style="flex-wrap:nowrap">${av(m)}<span><span class="iname">${esc(m.display_name)}${m.user_id === S.session.user.id ? ' (you)' : ''}</span><span class="imeta" style="display:block">${m.role === 'owner' ? 'Owner' : 'Member'}${m.dislikes ? ' · Avoids: ' + esc(m.dislikes) : ''}</span></span></span></div>`).join('')}</div>
  <h3>Home area</h3><div class="card"><div class="imeta">Used to find nearby restaurants when phone location is off</div>
  <div class="row" style="margin-top:6px"><span class="iname sp">${esc(S.household.home_label || 'Not set')}</span><button class="btn sm ghost" data-act="sethome">${S.household.home_label ? 'Change' : 'Set home area'}</button></div></div>
  <h3>Your profile</h3>
  <form id="profile" class="card"><label for="pn" style="margin-top:0">Your name</label><input type="text" id="pn" value="${esc(S.me.display_name)}" maxlength="40">
  <label for="pd">Foods you avoid or dislike</label><input type="text" id="pd" value="${esc(S.me.dislikes || '')}" placeholder="e.g. mushrooms, shellfish allergy">
  <label>Your color</label><div class="chips">${['#2E6B4E', '#D24F14', '#2F6F9F', '#8B5BD6', '#C9961B', '#8A2A2A', '#5E9E3A', '#3D3A36'].map(c => `<button type="button" class="chip" data-color="${c}" aria-pressed="${S.me.color === c}" style="background:${c};border-color:${c};width:36px;height:36px;padding:0" aria-label="Color ${c}"></button>`).join('')}</div>
  <button class="btn" style="margin-top:14px" type="submit">Save profile</button></form>
  <p class="imeta">Signed in as ${esc(S.session.user.email)}</p>
  <button class="btn line" data-act="signout">Sign out</button>`;
}

function render() {
  const app = $('#app');
  if (!S.session) return authView();
  if (!S.household) return onboardView();
  const v = { week: weekView, pantry: pantryView, recipes: cookbooksView, list: listView, family: familyView }[S.tab]();
  const y = $('#main')?.scrollTop || 0;
  app.innerHTML = shell(v);
  $('#main').scrollTop = y;
  const live = (id, key) => { const el = $(id); if (el) el.oninput = e => { S[key] = e.target.value; const pos = e.target.selectionStart; render(); const n = $(id); n.focus(); n.setSelectionRange(pos, pos); }; };
  live('#rq', 'recipeQ'); live('#psearch', 'pantryQ');
  const al = $('#addlist'); if (al) al.onsubmit = async e => { e.preventDefault(); const v = $('#li').value.trim(); if (!v) return; const p = parseIng(v); const pi = pantryFor(p.name); const r = await sb.from('shopping_items').insert({ household_id: S.household.id, name: p.name, qty: p.qty, unit: p.unit, category: pi?.category || 'Other', source: 'manual', added_by: S.session.user.id }); if (r.error) return fail(r.error); await loadAll(); render(); $('#li')?.focus(); };
  const pf = $('#profile'); if (pf) {
    let color = S.me.color;
    pf.querySelectorAll('[data-color]').forEach(b => b.onclick = () => { color = b.dataset.color; pf.querySelectorAll('[data-color]').forEach(x => x.setAttribute('aria-pressed', x === b)); });
    pf.onsubmit = async e => { e.preventDefault(); const r = await sb.from('members').update({ display_name: $('#pn').value.trim() || S.me.display_name, dislikes: $('#pd').value.trim() || null, color }).eq('user_id', S.session.user.id); if (r.error) return fail(r.error); await refreshMe(); await loadAll(); render(); toast('Profile saved'); };
  }
}

// ---------- auth & onboarding ----------
const GOOGLE_G = '<svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>';
function authView(mode = 'in', msg = '') {
  $('#app').innerHTML = `<main><div class="auth"><div class="hero-logo"><img src="logo.svg" alt=""></div>
  <h1>We're Cooked</h1><p class="lede" style="text-align:center">Plan the week, stock the pantry, and keep every family recipe in one place.</p>
  <button class="btn google" id="gbtn" type="button">${GOOGLE_G} Continue with Google</button>
  <div class="or"><span>or use email</span></div>
  <form id="auth"><label for="ae">Email</label><input type="email" id="ae" autocomplete="email" required>
  <label for="ap">Password</label><input type="password" id="ap" autocomplete="${mode === 'in' ? 'current-password' : 'new-password'}" minlength="6" required>
  <button class="btn wide" type="submit" style="margin-top:16px">${mode === 'in' ? 'Sign in' : 'Create account'}</button>
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
async function googleSignIn() {
  const redirectTo = IS_APP ? 'werecooked://auth-callback' : location.origin + location.pathname;
  const r = await sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo, skipBrowserRedirect: IS_APP, queryParams: { prompt: 'select_account' } } });
  if (r.error) throw r.error;
  if (IS_APP) window.Android.openExternal(r.data.url);
}
window.__authCallback = async url => {
  try { const u = new URL(url); const code = u.searchParams.get('code'); const err = u.searchParams.get('error_description');
    if (err) return authView('in', err);
    if (code) { const r = await sb.auth.exchangeCodeForSession(code); if (r.error) authView('in', r.error.message); } } catch (e) { fail(e); }
};
function onboardView() {
  $('#app').innerHTML = `<main><div class="auth"><div class="hero-logo"><img src="logo.svg" alt="" style="width:96px;height:96px"></div><h1 style="font-size:28px">Set up your household</h1>
  <form id="mk" class="card"><h3 style="margin-top:0">Start a new household</h3><label for="hn">Household name</label><input type="text" id="hn" placeholder="The Carter House" required maxlength="80">
  <label for="yn">Your name</label><input type="text" id="yn" required maxlength="40"><button class="btn wide" style="margin-top:14px">Create household</button></form>
  <form id="jn" class="card"><h3 style="margin-top:0">Join your family's household</h3><label for="ic">Invite code</label><input type="text" id="ic" placeholder="6 letters and numbers" required maxlength="6" style="text-transform:uppercase">
  <label for="jy">Your name</label><input type="text" id="jy" required maxlength="40"><button class="btn wide" style="margin-top:14px">Join household</button></form>
  <div class="err" id="oerr"></div><button class="btn line sm" data-act="signout">Sign out</button></div></main>`;
  $('#mk').onsubmit = async e => { e.preventDefault(); const r = await sb.rpc('create_household', { p_name: $('#hn').value, p_display_name: $('#yn').value }); if (r.error) return ($('#oerr').textContent = r.error.message); await enter(); };
  $('#jn').onsubmit = async e => { e.preventDefault(); const r = await sb.rpc('join_household', { p_code: $('#ic').value, p_display_name: $('#jy').value }); if (r.error) return ($('#oerr').textContent = r.error.message); await enter(); };
}
async function refreshMe() { const r = await sb.from('members').select('*').eq('user_id', S.session.user.id).maybeSingle(); if (r.error) throw r.error; S.me = r.data; if (S.me) { const h = await sb.from('households').select('*').eq('id', S.me.household_id).single(); if (h.error) throw h.error; S.household = h.data; } else S.household = null; }
async function enter() { try { await refreshMe(); if (S.household) { await loadAll(); await ensureBooks(); subscribe(); } render(); } catch (e) { fail(e); } }

// ---------- sheets ----------
function sheet(html, onReady, opts = {}) {
  const el = document.createElement('div'); el.className = 'sheet' + (opts.full ? ' full' : ''); el.innerHTML = `<div role="dialog" aria-modal="true">${html}</div>`;
  const close = () => { el.remove(); opts.onClose?.(); if (!$('.sheet')) render(); };
  el.close = close;
  el.onclick = e => { if (e.target === el || e.target.closest('[data-close]')) close(); };
  document.body.appendChild(el); onReady?.(el, close); if (!opts.full) el.querySelector('input:not([type=checkbox]),select,textarea')?.focus();
  return el;
}
const busy = (el, text) => { el.querySelector('[role=dialog]').innerHTML = `<div class="spin"></div><p class="lede" style="text-align:center">${esc(text)}</p>`; };

// ---------- day planner ----------
function dayEditor(day) {
  const p = S.plan.find(x => x.day === day) || { day, kind: 'cook', away: [], recipe_id: null, cook_id: null, headcount: null, title: '', note: '', cost: null };
  const st = { kind: p.kind, away: [...(p.away || [])], recipe_id: p.recipe_id, cook_id: p.cook_id, q: '', results: [], busy: false, err: '',
    place: p.place_name ? { name: p.place_name, address: p.place_address, lat: p.place_lat, lon: p.place_lon } : null };
  let map = null, keepRef = () => { };
  const keep = () => keepRef();
  const dt = parseYmd(day);
  const ide = ideas(5);
  const meals = S.recipes.filter(r => isMeal(r) && !isTodo(r));
  const placePicker = () => {
    const usual = usualSpots(st.kind);
    return st.place ? `<label>${st.kind === 'out' ? 'Where' : 'Ordering from'}</label>
      <div class="card flat" style="margin:0"><div class="iname">${esc(st.place.name)}</div><div class="imeta">${esc(st.place.address || '')}</div>
      <div class="row" style="margin-top:8px">${st.place.lat != null || st.place.address ? `<button type="button" class="btn sm ghost" data-ext="${esc(mapsUrl({ place_name: st.place.name, place_address: st.place.address, place_lat: st.place.lat, place_lon: st.place.lon }))}">Open in Maps</button>` : ''}<span class="sp"></span><button type="button" class="btn sm line" id="pchg">Change</button></div></div>`
    : `${usual.length ? `<label>Your usual spots</label><div class="chips">${usual.map((u, i) => `<button type="button" class="chip" data-usual="${i}">${esc(u.name)}</button>`).join('')}</div>` : ''}
      <label for="pq2">${st.kind === 'out' ? 'Where are we eating?' : 'Where are we ordering from?'}</label>
      <div class="row" style="gap:6px;flex-wrap:nowrap"><input type="search" id="pq2" class="sp" value="${esc(st.q)}" placeholder="Restaurant name or type, e.g. tacos" autocomplete="off"><button type="button" class="btn sm" id="pgo">Search</button></div>
      <div class="row" style="margin-top:6px"><button type="button" class="btn sm ghost" id="pnear">📍 ${S.loc ? 'Update my location' : 'Use my location'}</button><span class="imeta sp" style="text-align:right">${S.loc ? 'Searching near you' : S.household.home_label ? 'Near ' + esc(S.household.home_label) : 'Set a home area on the Family tab'}</span></div>
      ${st.err ? `<div class="err">${esc(st.err)}</div>` : ''}${st.busy ? '<div class="spin"></div>' : ''}
      ${st.results.length ? `<div id="pmap" style="height:180px;border-radius:14px;margin-top:10px;overflow:hidden;border:1.5px solid var(--line)"></div>
      <div class="card flat" style="margin:8px 0 0;padding:4px 12px">${st.results.map((r, i) => `<button type="button" data-place="${i}" style="all:unset;display:block;width:100%;padding:10px 0;border-bottom:1px solid var(--line);cursor:pointer"><span class="iname">${esc(r.name)}</span> <span class="imeta">${esc(r.kind)}${r.d != null ? ` · ${r.d < 10 ? r.d.toFixed(1) : Math.round(r.d)} mi` : ''}</span><br><span class="imeta">${esc(r.address)}</span></button>`).join('')}</div>` : ''}
      <label for="dt">Or just type it</label><input type="text" id="dt" value="${esc(p.title || '')}" maxlength="80" placeholder="e.g. Grandma's, the taco truck">`;
  };
  const draw = el => {
    const sel = st.recipe_id && S.recipes.find(r => r.id === st.recipe_id);
    el.querySelector('#dbody').innerHTML = `
    <div class="seg">${Object.entries(KINDS).map(([k, l]) => `<button type="button" data-kind="${k}" style="--k:var(--${k})" aria-pressed="${st.kind === k}">${l}</button>`).join('')}</div>
    ${st.kind === 'cook' ? `<label for="dr">What's for dinner</label><select id="dr"><option value="">Choose from your cookbooks…</option>${meals.map(r => { const m = recipeMatch(r); return `<option value="${r.id}" ${st.recipe_id === r.id ? 'selected' : ''}>${esc(r.title)}${m.total ? ` (${m.have}/${m.total} at home)` : ''}</option>`; }).join('')}</select>
      ${!st.recipe_id && ide.length ? `<div class="imeta" style="margin-top:8px">From what's in the pantry:</div><div class="chips" style="margin-top:6px">${ide.map(x => `<button type="button" class="chip" data-pick="${x.r.id}">${emojiOf(x.r)} ${esc(x.r.title)}</button>`).join('')}</div>` : ''}
      ${!st.recipe_id ? `<button type="button" class="btn sm flame" style="margin-top:10px" id="dchef">${svg('spark')} Ask the chef</button>` : ''}
      ${sel ? `<div class="imeta" style="margin-top:6px">${recipeMatch(sel).missing.length ? 'Missing: ' + esc(recipeMatch(sel).missing.map(i => i.name).join(', ')) : 'Everything is in the pantry'}</div>` : ''}
      <label for="dc">Who's cooking</label><select id="dc"><option value="">Not decided</option>${S.members.map(m => `<option value="${m.user_id}" ${st.cook_id === m.user_id ? 'selected' : ''}>${esc(m.display_name)}</option>`).join('')}</select>` : ''}
    ${st.kind === 'out' || st.kind === 'takeout' ? placePicker() + `<label for="dcost">What did it cost? (optional)</label><input type="number" id="dcost" min="0" step="0.01" inputmode="decimal" value="${p.cost ?? ''}" placeholder="$">` : ''}
    ${st.kind === 'other' ? `<label for="dt">Plan</label><input type="text" id="dt" value="${esc(p.title || '')}" maxlength="80">` : ''}
    ${st.kind !== 'away' ? `<label>Who's home (tap to mark away)</label><div class="chips">${S.members.map(m => `<button type="button" class="chip" data-away="${m.user_id}" aria-pressed="${!st.away.includes(m.user_id)}" style="display:inline-flex;align-items:center;gap:6px">${av(m, st.away.includes(m.user_id))}${esc(m.display_name)}</button>`).join('')}</div>
    <label for="dh">How many eating (blank = everyone home)</label><input type="number" id="dh" min="0" max="50" value="${p.headcount ?? ''}" placeholder="${homeCount({ away: st.away })}">` : ''}
    <label for="dn">Note</label><input type="text" id="dn" value="${esc(p.note || '')}" maxlength="120" placeholder="e.g. game night, early dinner">`;
    if (map) { map.remove(); map = null; }
    if (st.results.length && !st.place) map = miniMap(el.querySelector('#pmap'), st.results, i => choose(el, i));
  };
  const choose = (el, i) => { keep(); const r = st.results[i]; st.place = { name: r.name, address: r.address, lat: r.lat, lon: r.lon }; st.results = []; draw(el); };
  const runSearch = async el => { keep(); st.q = (el.querySelector('#pq2')?.value || '').trim(); if (!st.q) return; st.busy = true; st.err = ''; draw(el);
    try { st.results = await searchFood(st.q); if (!st.results.length) st.err = 'No places found. Try another name, or just type it below.'; } catch (e) { st.err = e.message; }
    st.busy = false; draw(el); };
  sheet(`<h2>${DOW[dt.getDay()]}, ${dt.toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}</h2><form id="dform"><div id="dbody"></div>
    <div class="row" style="margin-top:18px"><button class="btn" type="submit">Save</button><button class="btn ghost" type="button" data-close>Cancel</button><span class="sp"></span>
    ${p.id ? `<button class="btn line sm" type="button" id="dclear">Clear day</button>` : ''}</div>
    ${p.id && p.kind === 'cook' && p.recipe_id && !p.cooked ? `<button class="btn line wide" type="button" id="dcooked" style="margin-top:10px">We cooked this — update the pantry</button>` : ''}</form>`, (el, close) => {
    draw(el);
    keepRef = () => { const g = id => el.querySelector(id); if (g('#dr')) st.recipe_id = g('#dr').value || null; if (g('#dc')) st.cook_id = g('#dc').value || null; if (g('#dt')) p.title = g('#dt').value; if (g('#dh')) p.headcount = g('#dh').value ? Number(g('#dh').value) : null; if (g('#dn')) p.note = g('#dn').value; if (g('#pq2')) st.q = g('#pq2').value; if (g('#dcost')) p.cost = g('#dcost').value ? Number(g('#dcost').value) : null; };
    el.addEventListener('click', e => {
      const k = e.target.closest('[data-kind]'); if (k) { keep(); st.kind = k.dataset.kind; draw(el); return; }
      const a = e.target.closest('[data-away]'); if (a) { keep(); const id = a.dataset.away; st.away = st.away.includes(id) ? st.away.filter(x => x !== id) : [...st.away, id]; draw(el); return; }
      const pk = e.target.closest('[data-pick]'); if (pk) { keep(); st.recipe_id = pk.dataset.pick; draw(el); return; }
      const pl = e.target.closest('[data-place]'); if (pl) { choose(el, Number(pl.dataset.place)); return; }
      const us = e.target.closest('[data-usual]'); if (us) { keep(); st.place = usualSpots(st.kind)[Number(us.dataset.usual)]; draw(el); return; }
      if (e.target.closest('#pgo')) { runSearch(el); return; }
      if (e.target.closest('#dchef')) { keep(); chefSheet(day); return; }
      if (e.target.closest('#pchg')) { keep(); st.place = null; draw(el); setTimeout(() => el.querySelector('#pq2')?.focus(), 0); return; }
      if (e.target.closest('#pnear')) { keep(); st.err = ''; st.busy = true; draw(el); locateMe().then(() => { st.busy = false; if ((el.querySelector('#pq2')?.value || st.q).trim()) runSearch(el); else draw(el); }).catch(er => { st.busy = false; st.err = er.message; draw(el); }); return; }
    });
    el.addEventListener('change', e => { if (e.target.id === 'dr') { keep(); draw(el); } });
    el.addEventListener('keydown', e => { if (e.target.id === 'pq2' && e.key === 'Enter') { e.preventDefault(); runSearch(el); } });
    el.querySelector('#dform').onsubmit = async e => {
      e.preventDefault(); keep();
      const pl = (st.kind === 'out' || st.kind === 'takeout') && st.place;
      const row = { household_id: S.household.id, day, kind: st.kind, recipe_id: st.kind === 'cook' ? st.recipe_id : null, cook_id: st.kind === 'cook' ? st.cook_id : null, title: st.kind === 'cook' || st.kind === 'away' ? null : (p.title || null),
        place_name: pl ? pl.name : null, place_address: pl ? pl.address || null : null, place_lat: pl ? pl.lat ?? null : null, place_lon: pl ? pl.lon ?? null : null, cost: (st.kind === 'out' || st.kind === 'takeout') ? p.cost : null,
        away: st.kind === 'away' ? S.members.map(m => m.user_id) : st.away, headcount: st.kind === 'away' ? 0 : p.headcount, note: p.note || null, cooked: st.kind === p.kind && st.recipe_id === p.recipe_id ? !!p.cooked : false };
      const r = await sb.from('meal_plan').upsert(row, { onConflict: 'household_id,day' }); if (r.error) return fail(r.error);
      await loadAll(); close();
    };
    el.querySelector('#dclear')?.addEventListener('click', async () => { const r = await sb.from('meal_plan').delete().eq('id', p.id); if (r.error) return fail(r.error); await loadAll(); close(); });
    el.querySelector('#dcooked')?.addEventListener('click', async () => { try { el.remove(); await markCooked(p); } catch (e) { fail(e); } });
  });
}

// ---------- pantry editor ----------
function pantryEditor(id, preset = {}) {
  const p = S.pantry.find(x => x.id === id) || { name: '', category: 'Pantry', qty: 1, unit: '', par: 0, expires_on: '', barcode: '', ...preset };
  sheet(`<h2>${id ? 'Edit item' : 'Add to pantry'}</h2><form id="pform">
  <label for="pnm">Item</label><input type="text" id="pnm" value="${esc(p.name)}" required maxlength="80" placeholder="e.g. Eggs">
  ${p.size ? `<p class="imeta" style="margin:6px 0 0">Package size: ${esc(p.size)}</p>` : ''}
  <div class="grid2"><div><label for="pq">On hand</label><input type="number" id="pq" step="any" min="0" value="${p.qty}"></div><div><label for="pu">Unit</label><input type="text" id="pu" value="${esc(p.unit)}" placeholder="each, lb, cup…" maxlength="20"></div></div>
  <div class="grid2"><div><label for="ppar">Always keep (par)</label><input type="number" id="ppar" step="any" min="0" value="${p.par}"></div><div><label for="pex">Use by</label><input type="date" id="pex" value="${esc(p.expires_on || '')}"></div></div>
  <label for="pcat">Category</label><select id="pcat">${CATS.map(c => `<option ${c === p.category ? 'selected' : ''}>${c}</option>`).join('')}</select>
  ${p.barcode ? `<p class="imeta">Barcode ${esc(p.barcode)} — scanning it again will add one more.</p>` : ''}
  <div class="row" style="margin-top:18px"><button class="btn" type="submit">Save</button><button class="btn ghost" type="button" data-close>Cancel</button><span class="sp"></span>${id ? '<button class="btn line sm" type="button" id="pdel">Delete</button>' : ''}</div></form>`, (el, close) => {
    el.querySelector('#pform').onsubmit = async e => {
      e.preventDefault(); const g = s => el.querySelector(s).value;
      const row = { household_id: S.household.id, name: g('#pnm').trim(), qty: Number(g('#pq')) || 0, unit: normUnit(g('#pu').trim()), par: Number(g('#ppar')) || 0, expires_on: g('#pex') || null, category: g('#pcat'), barcode: p.barcode || null, updated_at: new Date().toISOString() };
      const r = id ? await sb.from('pantry_items').update(row).eq('id', id) : await sb.from('pantry_items').insert(row); if (r.error) return fail(r.error);
      await loadAll(); close();
    };
    el.querySelector('#pdel')?.addEventListener('click', async () => { const r = await sb.from('pantry_items').delete().eq('id', id); if (r.error) return fail(r.error); await loadAll(); close(); });
  });
}

// ---------- recipe page ----------
let wakeLock = null;
function recipeView(id) {
  const r = S.recipes.find(x => x.id === id); if (!r) return;
  let serves = r.servings || 4, cook = false;
  const got = S.checks[id] = S.checks[id] || new Set(), done = S.done[id] = S.done[id] || new Set();
  const cat = RCATS[catOf(r)];
  const html = () => {
    const f = serves / (r.servings || 4);
    const m = recipeMatch(r);
    return `<div class="hero" style="--c:${colorOf(r)}"><div class="bar"><button data-close aria-label="Back">‹</button><span class="row"><button id="rfav" aria-label="Favorite">${r.favorite ? '★' : '☆'}</button><button id="redit" aria-label="Edit">✎</button></span></div>
    <span class="e">${emojiOf(r)}</span><h1>${esc(r.title)}</h1>
    <div class="meta"><span>${cat[0]}</span>${r.time_min ? `<span>⏱ ${fmtTime(r.time_min)}</span>` : ''}<span>Serves ${r.servings || 4}</span>${m.total ? `<span>${m.have}/${m.total} at home</span>` : ''}</div></div>
    <div class="rbody${cook ? ' cook' : ''}">
    <div class="row"><div class="rate" aria-label="Rating">${[1, 2, 3, 4, 5].map(n => `<button data-rate="${n}" class="${(r.rating || 0) >= n ? 'on' : ''}" aria-label="${n} stars">★</button>`).join('')}</div><span class="sp"></span><button class="btn sm ${cook ? '' : 'ghost'}" id="rcook">${svg('fire')} ${cook ? 'Cooking' : 'Cook mode'}</button></div>
    ${S.books.length ? `<h3>In these books</h3><div class="bchips">${S.books.map(b => `<button class="bchip" style="--c:${esc(b.color)}" data-tbook="${b.id}" aria-pressed="${(r.books || []).includes(b.id)}">${esc(b.emoji)} ${esc(b.name)}</button>`).join('')}</div>` : ''}
    ${isTodo(r) ? `<div class="banner flame" style="margin-top:16px"><span class="em">✍️</span><span class="sp"><b>No recipe written down yet</b><p>Tap edit to add the ingredients and steps.</p></span></div>` : ''}
    ${(r.ingredients || []).length ? `<div class="row" style="margin-top:22px;margin-bottom:6px"><h3 class="sp" style="margin:0">Ingredients</h3><span class="stepper"><button id="rm" aria-label="Fewer servings">−</button><span>Serves ${serves}</span><button id="rp" aria-label="More servings">+</button></span></div>
    <ul class="ings">${r.ingredients.map((i, n) => { const p = pantryFor(i.name); const have = p && Number(p.qty) > 0; const q = fmtQty(i.qty ? i.qty * f : null); return `<li data-ing="${n}" class="${got.has(n) ? 'got' : ''}"><span class="box">${got.has(n) ? '✓' : ''}</span><span class="txt">${q || i.unit ? `<b>${esc([q, i.unit].filter(Boolean).join(' '))}</b> ` : ''}${esc(i.name)}</span>${have ? '<span class="home">AT HOME</span>' : '<span></span>'}</li>`; }).join('')}</ul>` : ''}
    ${(r.steps || []).length ? `<h3>Steps</h3><ol class="steps">${r.steps.map((s, n) => `<li data-stp="${n}" class="${done.has(n) ? 'done' : ''}"><span>${esc(s)}</span></li>`).join('')}</ol>` : ''}
    ${r.notes ? `<h3>Notes</h3><div class="note">${esc(r.notes)}</div>` : ''}
    ${r.source_url ? `<p><span role="link" tabindex="0" data-ext="${esc(r.source_url)}" style="color:var(--greend);font-weight:700;text-decoration:underline">Open the original ↗</span></p>` : ''}
    <div class="actions">${isMeal(r) ? `<button class="btn" id="rplan">${svg('cal')} Plan it</button>` : ''}${(r.ingredients || []).length ? `<button class="btn ghost" id="rmiss">${svg('cart')} Add missing</button>` : ''}</div>
    <p class="imeta" style="margin-top:16px">${[r.found_in ? 'From ' + r.found_in : '', 'Added by ' + (memberById(r.created_by)?.display_name || 'family'), (r.tags || []).join(', ')].filter(Boolean).map(esc).join(' · ')}</p></div>`;
  };
  sheet(html(), (el, close) => {
    const box = el.querySelector('[role=dialog]');
    const redraw = () => { const y = box.scrollTop; box.innerHTML = html(); box.scrollTop = y; };
    el.addEventListener('click', async e => {
      const t = e.target;
      if (t.closest('#rm')) { serves = Math.max(1, serves - 1); return redraw(); }
      if (t.closest('#rp')) { serves = Math.min(60, serves + 1); return redraw(); }
      const ing = t.closest('[data-ing]'); if (ing) { const n = Number(ing.dataset.ing); got.has(n) ? got.delete(n) : got.add(n); return redraw(); }
      const stp = t.closest('[data-stp]'); if (stp) { const n = Number(stp.dataset.stp); done.has(n) ? done.delete(n) : done.add(n); return redraw(); }
      if (t.closest('#rcook')) { cook = !cook; try { if (cook && navigator.wakeLock) wakeLock = await navigator.wakeLock.request('screen'); else { wakeLock?.release(); wakeLock = null; } } catch (_) { } toast(cook ? 'Cook mode: bigger text, screen stays on' : 'Cook mode off'); return redraw(); }
      const rt = t.closest('[data-rate]'); if (rt) { const n = Number(rt.dataset.rate); r.rating = r.rating === n ? null : n; redraw(); const u = await sb.from('recipes').update({ rating: r.rating }).eq('id', r.id); if (u.error) fail(u.error); return; }
      const tb = t.closest('[data-tbook]'); if (tb) { const b = tb.dataset.tbook; r.books = (r.books || []).includes(b) ? r.books.filter(x => x !== b) : [...(r.books || []), b]; redraw(); const u = await sb.from('recipes').update({ books: r.books }).eq('id', r.id); if (u.error) fail(u.error); return; }
      if (t.closest('#rfav')) { r.favorite = !r.favorite; redraw(); const u = await sb.from('recipes').update({ favorite: r.favorite }).eq('id', r.id); if (u.error) fail(u.error); return; }
      if (t.closest('#redit')) { el.remove(); return recipeEditor(id); }
      if (t.closest('#rplan')) return planRecipe(r);
      if (t.closest('#rmiss')) {
        const f = serves / (r.servings || 4); const miss = recipeMatch(r).missing.filter(i => !S.list.some(l => !l.checked && same(l.name, i.name)));
        if (!miss.length) return toast('Nothing missing — you have it all');
        const u = await sb.from('shopping_items').insert(miss.map(i => ({ household_id: S.household.id, name: buyName(i.name), qty: i.qty ? roundBuy(i.qty * f, i.unit) : null, unit: i.unit || '', category: pantryFor(i.name)?.category || 'Other', source: 'manual', added_by: S.session.user.id }))); if (u.error) return fail(u.error);
        await loadAll(); toast(`Added ${miss.length} to the shopping list`);
      }
    });
  }, { full: true, onClose: () => { wakeLock?.release(); wakeLock = null; } });
}
function planRecipe(r) {
  const days = [...Array(14)].map((_, i) => ymd(addDays(new Date(), i)));
  sheet(`<h2>Plan ${esc(r.title)}</h2><p class="lede">Pick a night</p><div class="card flat" style="padding:4px 14px">${days.map(d => { const p = S.plan.find(x => x.day === d); const dt = parseYmd(d); const cur = p ? (p.recipe_id ? S.recipes.find(x => x.id === p.recipe_id)?.title : p.place_name || p.title || KINDS[p.kind]) : ''; return `<button class="item" data-pday="${d}" style="all:unset;display:grid;grid-template-columns:minmax(0,1fr) auto;width:100%;padding:12px 0;border-bottom:1px solid var(--line);cursor:pointer"><span><span class="iname">${d === ymd(new Date()) ? 'Tonight' : dt.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</span>${cur ? `<span class="imeta" style="display:block">Replaces: ${esc(cur)}</span>` : ''}</span><span class="imeta">›</span></button>`; }).join('')}</div>`, (el, close) => {
    el.addEventListener('click', async e => { const b = e.target.closest('[data-pday]'); if (!b) return; const d = b.dataset.pday;
      const u = await sb.from('meal_plan').upsert({ household_id: S.household.id, day: d, kind: 'cook', recipe_id: r.id, title: null, place_name: null, place_address: null, place_lat: null, place_lon: null, cost: null, cooked: false }, { onConflict: 'household_id,day' }); if (u.error) return fail(u.error);
      await loadAll(); el.remove(); toast(`${r.title} planned for ${parseYmd(d).toLocaleDateString(undefined, { weekday: 'long' })}`); });
  });
}
function ratePrompt(r) {
  sheet(`<h2>How was it?</h2><p class="lede">${esc(r.title)}</p><div class="rate" style="justify-content:center">${[1, 2, 3, 4, 5].map(n => `<button data-r="${n}" style="font-size:40px" class="${(r.rating || 0) >= n ? 'on' : ''}" aria-label="${n} stars">★</button>`).join('')}</div><button class="btn ghost wide" data-close style="margin-top:12px">Skip</button>`, (el) => {
    el.addEventListener('click', async e => { const b = e.target.closest('[data-r]'); if (!b) return; const u = await sb.from('recipes').update({ rating: Number(b.dataset.r) }).eq('id', r.id); if (u.error) return fail(u.error); await loadAll(); el.close(); toast('Thanks — rated'); });
  });
}

// ---------- recipe editor ----------
function recipeEditor(id, draft) {
  const r = S.recipes.find(x => x.id === id) || { title: '', servings: 4, time_min: '', tags: [], ingredients: [], steps: [], notes: '', kind: 'meal', category: '', books: S.book ? [S.book] : [], ...(draft || {}) };
  const st = { kind: kindOf(r), books: [...(r.books || [])] };
  sheet(`<h2>${id ? 'Edit recipe' : 'New recipe'}</h2><form id="rform">
  <label for="rt">Name</label><input type="text" id="rt" value="${esc(r.title)}" required maxlength="120" placeholder="Grandma's cheese dip">
  <label>Where it goes</label><div class="switch" style="margin:0"><button type="button" data-rk="meal" aria-pressed="${st.kind === 'meal'}">🍽 Meal</button><button type="button" data-rk="component" aria-pressed="${st.kind === 'component'}">🫙 Sauce or staple</button></div>
  <label for="rc">Type</label><select id="rc">${Object.entries(RCATS).map(([k, v]) => `<option value="${k}" ${catOf(r) === k ? 'selected' : ''}>${v[1]} ${v[0]}</option>`).join('')}</select>
  ${S.books.length ? `<label>Cookbooks</label><div class="bchips">${S.books.map(b => `<button type="button" class="bchip" style="--c:${esc(b.color)}" data-eb="${b.id}" aria-pressed="${st.books.includes(b.id)}">${esc(b.emoji)} ${esc(b.name)}</button>`).join('')}</div>` : ''}
  <div class="grid2"><div><label for="rsv">Serves</label><input type="number" id="rsv" min="1" max="60" value="${r.servings}"></div><div><label for="rtm">Minutes</label><input type="number" id="rtm" min="0" max="2880" value="${r.time_min ?? ''}"></div></div>
  <label for="rig">Ingredients, one per line</label><textarea id="rig" placeholder="2 cup rice&#10;1 lb chicken thighs&#10;3 clove garlic">${esc((r.ingredients || []).map(ingLine).join('\n'))}</textarea>
  <label for="rst">Steps, one per line</label><textarea id="rst">${esc((r.steps || []).join('\n'))}</textarea>
  <label for="rtg">Tags (comma separated)</label><input type="text" id="rtg" value="${esc((r.tags || []).join(', '))}" placeholder="weeknight, chicken, kid favorite">
  <label for="rno">Notes</label><textarea id="rno" style="min-height:70px" maxlength="1200">${esc(r.notes || '')}</textarea>
  <label for="rsu">Link to the original (optional)</label><input type="url" id="rsu" value="${esc(r.source_url || '')}" placeholder="https://…">
  <div class="row" style="margin-top:18px"><button class="btn" type="submit">Save recipe</button><button class="btn ghost" type="button" data-close>Cancel</button><span class="sp"></span>${id ? '<button class="btn line sm" type="button" id="rdel">Delete</button>' : ''}</div></form>`, (el, close) => {
    el.addEventListener('click', e => {
      const k = e.target.closest('[data-rk]'); if (k) { st.kind = k.dataset.rk; el.querySelectorAll('[data-rk]').forEach(b => b.setAttribute('aria-pressed', b === k)); if (st.kind === 'component' && !COMPONENT_CATS.includes(el.querySelector('#rc').value)) el.querySelector('#rc').value = 'sauce'; return; }
      const b = e.target.closest('[data-eb]'); if (b) { const v = b.dataset.eb; st.books = st.books.includes(v) ? st.books.filter(x => x !== v) : [...st.books, v]; b.setAttribute('aria-pressed', st.books.includes(v)); }
    });
    el.querySelector('#rform').onsubmit = async e => {
      e.preventDefault(); const g = s => el.querySelector(s).value;
      const row = { household_id: S.household.id, title: g('#rt').trim(), servings: Math.min(60, Math.max(1, Number(g('#rsv')) || 4)), time_min: g('#rtm') ? Number(g('#rtm')) : null, tags: g('#rtg').split(',').map(s => s.trim()).filter(Boolean),
        ingredients: g('#rig').split('\n').map(parseIng).filter(Boolean), steps: g('#rst').split('\n').map(s => s.replace(/^\s*\d+[.)]\s*/, '').trim()).filter(Boolean), notes: g('#rno').trim() || null,
        source_url: /^https?:\/\//i.test(g('#rsu').trim()) ? g('#rsu').trim() : null, kind: st.kind, category: g('#rc'), books: st.books };
      if (!id) { row.created_by = S.session.user.id; if (draft?.found_in) row.found_in = draft.found_in; }
      const q = id ? await sb.from('recipes').update(row).eq('id', id).select().single() : await sb.from('recipes').insert(row).select().single(); if (q.error) return fail(q.error);
      await loadAll(); el.remove(); toast('Saved'); recipeView(q.data.id);
    };
    el.querySelector('#rdel')?.addEventListener('click', async () => { if (!confirmDel(el)) return; const q = await sb.from('recipes').delete().eq('id', id); if (q.error) return fail(q.error); await loadAll(); close(); toast('Recipe deleted'); });
  });
}
function confirmDel(el) { const b = el.querySelector('#rdel,#bdel'); if (b.dataset.sure) return true; b.dataset.sure = 1; b.textContent = 'Tap again to delete'; return false; }
function bookEditor(id) {
  const b = S.books.find(x => x.id === id) || { name: '', emoji: '📖', color: BOOK_COLORS[S.books.length % BOOK_COLORS.length] };
  const EM = ['📖', '👪', '⚡', '🐗', '🦃', '🥧', '🎄', '🍗', '🥩', '🐟', '🌮', '🍝', '🥗', '🍳', '🔥', '🌶️', '🍰', '🍪', '🥘', '🧑‍🍳'];
  const st = { emoji: b.emoji, color: b.color };
  sheet(`<h2>${id ? 'Edit cookbook' : 'New cookbook'}</h2><form id="bform"><label for="bn">Name</label><input type="text" id="bn" value="${esc(b.name)}" required maxlength="40" placeholder="Sunday Suppers">
  <label>Icon</label><div class="chips">${EM.map(e => `<button type="button" class="chip" data-em="${e}" aria-pressed="${st.emoji === e}" style="font-size:20px;padding:4px 10px">${e}</button>`).join('')}</div>
  <label>Color</label><div class="chips">${BOOK_COLORS.map(c => `<button type="button" class="chip" data-bc="${c}" aria-pressed="${st.color === c}" style="background:${c};border-color:${c};width:36px;height:36px;padding:0" aria-label="Color ${c}"></button>`).join('')}</div>
  <div class="row" style="margin-top:18px"><button class="btn" type="submit">Save</button><button class="btn ghost" type="button" data-close>Cancel</button><span class="sp"></span>${id ? '<button class="btn line sm" type="button" id="bdel">Delete book</button>' : ''}</div></form>`, (el, close) => {
    el.addEventListener('click', e => { const em = e.target.closest('[data-em]'); if (em) { st.emoji = em.dataset.em; el.querySelectorAll('[data-em]').forEach(x => x.setAttribute('aria-pressed', x === em)); } const c = e.target.closest('[data-bc]'); if (c) { st.color = c.dataset.bc; el.querySelectorAll('[data-bc]').forEach(x => x.setAttribute('aria-pressed', x === c)); } });
    el.querySelector('#bform').onsubmit = async e => { e.preventDefault(); const row = { household_id: S.household.id, name: el.querySelector('#bn').value.trim(), emoji: st.emoji, color: st.color };
      const q = id ? await sb.from('recipe_books').update(row).eq('id', id).select().single() : await sb.from('recipe_books').insert({ ...row, sort: S.books.length }).select().single(); if (q.error) return fail(q.error.code === '23505' ? new Error('You already have a book with that name') : q.error);
      S.book = q.data.id; await loadAll(); close(); };
    el.querySelector('#bdel')?.addEventListener('click', async () => { if (!confirmDel(el)) return; const q = await sb.from('recipe_books').delete().eq('id', id); if (q.error) return fail(q.error);
      await Promise.all(S.recipes.filter(r => (r.books || []).includes(id)).map(r => sb.from('recipes').update({ books: r.books.filter(x => x !== id) }).eq('id', r.id))); S.book = null; await loadAll(); close(); toast('Book deleted — its recipes are still in All recipes'); });
  });
}
function addRecipeMenu() {
  sheet(`<h2>Add a recipe</h2><div class="card flat" style="padding:4px 14px">
  ${[['type', 'pen', 'Type it in', 'Write out ingredients and steps'], ['photo', 'camera', 'Snap a recipe card', 'Handwritten cards, cookbook pages or screenshots'], ['link', 'link', 'Save from a website', 'Paste a link to any recipe page'], ['chef', 'spark', 'Ask the chef', 'Get ideas from what\'s in your pantry']].map(([k, ic, t, d]) => `<button data-add="${k}" style="all:unset;display:grid;grid-template-columns:44px minmax(0,1fr);gap:12px;align-items:center;width:100%;padding:12px 0;border-bottom:1px solid var(--line);cursor:pointer"><span class="tool${k === 'photo' || k === 'chef' ? ' f' : ''}" style="padding:0;border:0;box-shadow:none;background:none"><span class="ico">${svg(ic)}</span></span><span><span class="iname">${t}</span><span class="imeta" style="display:block">${d}</span></span></button>`).join('')}</div>`, (el) => {
    el.addEventListener('click', e => { const b = e.target.closest('[data-add]'); if (!b) return; el.remove(); const k = b.dataset.add;
      if (k === 'type') recipeEditor(null); if (k === 'photo') captureImage('Snap a recipe', 'Fill the frame with the recipe card or page', recipeFromPhoto); if (k === 'link') recipeFromLink(); if (k === 'chef') chefSheet(); });
  });
}
function draftFromAi(x, found) {
  const ings = (x.ingredients || []).length ? x.ingredients.map(i => typeof i === 'string' ? parseIng(i) : { qty: i.qty ?? null, unit: normUnit(i.unit || ''), name: i.name }) : (x.ingredients_text || []).map(parseIng).filter(Boolean);
  return { title: x.title || '', servings: x.servings || 4, time_min: x.time_min || '', tags: x.tags || [], ingredients: ings, steps: x.steps || [], notes: x.notes || '', source_url: x.source_url || '', category: RCATS[x.category] ? x.category : '', kind: x.kind === 'component' ? 'component' : 'meal', found_in: found, books: S.book ? [S.book] : [] };
}
async function recipeFromPhoto(file) {
  const el = sheet('', null); busy(el, 'Reading the recipe…');
  try { const image = await imageToBase64(file); const out = await ai('recipe_photo', { image, media_type: 'image/jpeg' }); el.remove(); recipeEditor(null, draftFromAi(out.recipe || {}, 'a photo')); }
  catch (e) { el.remove(); fail(e); }
}
function recipeFromLink() {
  sheet(`<h2>Save from a website</h2><form id="uf"><label for="uu">Recipe link</label><input type="url" id="uu" placeholder="https://www.allrecipes.com/recipe/…" required>
  <button class="btn wide" style="margin-top:14px" type="submit">Get the recipe</button></form>`, (el) => {
    el.querySelector('#uf').onsubmit = async e => { e.preventDefault(); const url = el.querySelector('#uu').value.trim(); busy(el, 'Fetching the recipe…');
      try { const out = await ai('recipe_url', { url }); el.remove(); recipeEditor(null, draftFromAi(out.recipe || {}, new URL(url).hostname.replace(/^www\./, ''))); } catch (er) { el.remove(); fail(er); } };
  });
}
function chefSheet(day) {
  sheet(`<h2>Ask the chef</h2><p class="lede">Dinner ideas from what's in your pantry, steering clear of what the family avoids.</p><form id="cf"><label for="cw">In the mood for anything? (optional)</label><input type="text" id="cw" placeholder="e.g. something with chicken, quick, comfort food">
  <button class="btn flame wide" style="margin-top:14px" type="submit">${svg('spark')} Get ideas</button></form>`, (el) => {
    el.querySelector('#cf').onsubmit = async e => { e.preventDefault(); const wish = el.querySelector('#cw').value.trim(); busy(el, 'Thinking about dinner…');
      try {
        const soon = ymd(addDays(new Date(), 3));
        const out = await ai('generate', { pantry: S.pantry.filter(p => Number(p.qty) > 0).map(p => p.name), use_soon: S.pantry.filter(p => p.expires_on && p.expires_on <= soon && Number(p.qty) > 0).map(p => p.name), dislikes: S.members.map(m => m.dislikes).filter(Boolean).join('; '), servings: S.members.length || 4, wish });
        const recs = out.recipes || [];
        el.querySelector('[role=dialog]').innerHTML = `<h2>Here's what I'd make</h2>${recs.map((x, i) => `<div class="card"><div class="row" style="flex-wrap:nowrap"><span style="font-size:30px">${emojiOf(x)}</span><span class="sp"><span class="iname" style="font-family:var(--serif);font-size:17px">${esc(x.title)}</span><span class="imeta" style="display:block">${x.time_min ? x.time_min + ' min · ' : ''}${(x.missing || []).length ? 'Need: ' + esc(x.missing.join(', ')) : 'Everything is at home'}</span></span></div>
          <div class="row" style="margin-top:10px"><button class="btn sm" data-save="${i}">Save to cookbooks</button>${day ? `<button class="btn sm ghost" data-plan="${i}">Plan it</button>` : ''}</div></div>`).join('') || '<p class="empty">No ideas came back. Try again.</p>'}<button class="btn ghost wide" data-close>Done</button>`;
        el.addEventListener('click', async ev => {
          const sv = ev.target.closest('[data-save],[data-plan]'); if (!sv) return; const x = recs[Number(sv.dataset.save ?? sv.dataset.plan)]; const d = draftFromAi(x, 'the We\'re Cooked chef');
          const ins = await sb.from('recipes').insert({ household_id: S.household.id, title: d.title, servings: d.servings, time_min: d.time_min || null, tags: d.tags, ingredients: d.ingredients, steps: d.steps, notes: d.notes || null, kind: 'meal', category: d.category || 'main', books: [], created_by: S.session.user.id, found_in: d.found_in }).select().single();
          if (ins.error) return fail(ins.error);
          if (sv.dataset.plan != null && day) { const u = await sb.from('meal_plan').upsert({ household_id: S.household.id, day, kind: 'cook', recipe_id: ins.data.id, cooked: false }, { onConflict: 'household_id,day' }); if (u.error) return fail(u.error); }
          await loadAll(); document.querySelectorAll('.sheet').forEach(s => s.remove()); render(); toast(sv.dataset.plan != null ? 'Saved and planned' : 'Saved to your cookbooks');
        });
      } catch (er) { el.remove(); fail(er); }
    };
  });
}

// ---------- camera ----------
function openCamera({ title, hint, barcode, onFrame, onPick }) {
  let stream = null, timer = null, stopped = false;
  const stop = () => { stopped = true; clearInterval(timer); stream?.getTracks().forEach(t => t.stop()); };
  const el = sheet(`<h2>${esc(title)}</h2><div class="cam"><video playsinline muted autoplay></video>${barcode ? '<div class="reticle"></div>' : ''}<div class="hint">${esc(hint)}</div></div>
    ${barcode ? '' : '<button class="shutter" id="shoot" aria-label="Take photo"></button>'}
    <div class="row" style="justify-content:center;margin-top:12px"><label class="btn sm ghost" style="margin:0;color:var(--ink)">Choose from photos<input type="file" accept="image/*" id="pick" hidden></label>${barcode ? '<button class="btn sm ghost" id="typecode">Type the number</button>' : ''}<button class="btn sm line" data-close>Cancel</button></div>`, async (el) => {
    const video = el.querySelector('video');
    el.querySelector('#pick').onchange = e => { const f = e.target.files[0]; if (f) { stop(); el.remove(); onPick(f); } };
    el.querySelector('#typecode')?.addEventListener('click', () => { stop(); el.remove(); const c = prompt('Barcode number'); if (c && /^\d{6,14}$/.test(c.trim())) onFrame(c.trim()); });
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false });
      if (stopped) return stop(); video.srcObject = stream; await video.play().catch(() => { });
    } catch (e) { el.querySelector('.hint').textContent = 'Camera unavailable — allow camera access, or choose a photo instead.'; return; }
    el.querySelector('#shoot')?.addEventListener('click', async () => { const b64 = await imageToBase64(video); stop(); el.remove(); onFrame(b64); });
    if (barcode) {
      let detector = null, zx = null, canvas = document.createElement('canvas');
      if ('BarcodeDetector' in window) { try { detector = new BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128'] }); } catch (_) { detector = null; } }
      if (!detector) { try { const Z = await loadZxing(); const hints = new Map(); hints.set(Z.DecodeHintType.POSSIBLE_FORMATS, [Z.BarcodeFormat.EAN_13, Z.BarcodeFormat.EAN_8, Z.BarcodeFormat.UPC_A, Z.BarcodeFormat.UPC_E, Z.BarcodeFormat.CODE_128]); hints.set(Z.DecodeHintType.TRY_HARDER, true); zx = { Z, reader: new Z.MultiFormatReader() }; zx.reader.setHints(hints); } catch (e) { el.querySelector('.hint').textContent = e.message; } }
      let busyScan = false;
      timer = setInterval(async () => {
        if (busyScan || stopped || !video.videoWidth) return; busyScan = true;
        try {
          let code = null;
          if (detector) { const r = await detector.detect(video); code = r[0]?.rawValue; }
          else if (zx) { const w = video.videoWidth, h = video.videoHeight, cw = Math.min(1280, w), ch = Math.round(h * cw / w); canvas.width = cw; canvas.height = ch; canvas.getContext('2d').drawImage(video, 0, 0, cw, ch);
            try { const src = new zx.Z.HTMLCanvasElementLuminanceSource(canvas); const res = zx.reader.decode(new zx.Z.BinaryBitmap(new zx.Z.HybridBinarizer(src))); code = res.getText(); } catch (_) { } }
          if (code) { navigator.vibrate?.(60); stop(); el.remove(); onFrame(code); }
        } finally { busyScan = false; }
      }, 280);
    }
  }, { onClose: stop });
  return el;
}
function captureImage(title, hint, cb) {
  openCamera({ title, hint, onFrame: b64 => cb({ b64 }), onPick: f => cb(f) });
}
function scanBarcodeFlow() {
  openCamera({ title: 'Scan a barcode', hint: 'Line the barcode up inside the box', barcode: true, onPick: async f => toast('Use the live camera for barcodes, or type the number'), onFrame: async code => {
    const existing = S.pantry.find(p => p.barcode === code);
    if (existing) { const u = await sb.from('pantry_items').update({ qty: Number(existing.qty) + 1, updated_at: new Date().toISOString() }).eq('id', existing.id); if (u.error) return fail(u.error); await loadAll(); render(); toast(`Added one more ${existing.name}`); return; }
    toast('Looking up the product…');
    const info = await lookupBarcode(code);
    pantryEditor(null, { name: info?.name || '', category: info?.category || 'Pantry', qty: 1, unit: '', barcode: code, size: info?.size || '' });
    if (!info) toast('Not in the product database — type the name once and it will be remembered');
  } });
}
async function pantryPhoto(src, mode) {
  const el = sheet('', null); busy(el, mode === 'receipt_photo' ? 'Reading the receipt…' : 'Spotting what\'s on the shelves…');
  try {
    const image = src.b64 || await imageToBase64(src);
    const out = await ai(mode, { image, media_type: 'image/jpeg' });
    const items = (out.items || []).map(x => ({ ...x, on: true }));
    if (!items.length) { el.remove(); return toast('Couldn\'t make out any items. Try a closer, brighter photo.'); }
    const draw = () => `<h2>${items.length} items found</h2><p class="lede">Uncheck anything that's wrong and fix amounts before adding.</p>
      <div class="card flat" style="padding:4px 12px">${items.map((x, i) => `<div class="chk"><input type="checkbox" data-on="${i}" ${x.on ? 'checked' : ''} aria-label="Add ${esc(x.name)}"><span><input type="text" data-nm="${i}" value="${esc(x.name)}" style="min-height:38px;padding:6px 10px;font-weight:600"><span class="imeta">${esc(x.category || '')}${x.expires_days ? ` · use within ${x.expires_days} days` : ''}</span></span><span class="row" style="flex-wrap:nowrap;gap:4px"><input type="number" data-q="${i}" value="${x.qty ?? 1}" min="0" step="any" style="width:64px;min-height:38px;padding:6px"><input type="text" data-u="${i}" value="${esc(x.unit || '')}" style="width:58px;min-height:38px;padding:6px" placeholder="unit"></span></div>`).join('')}</div>
      <button class="btn wide" id="addall" style="margin-top:12px">Add ${items.filter(x => x.on).length} to the pantry</button><button class="btn ghost wide" data-close style="margin-top:8px">Cancel</button>`;
    const box = el.querySelector('[role=dialog]'); box.innerHTML = draw();
    el.addEventListener('change', e => { const t = e.target; const i = Number(t.dataset.on ?? t.dataset.nm ?? t.dataset.q ?? t.dataset.u); if (Number.isNaN(i)) return;
      if (t.dataset.on != null) { items[i].on = t.checked; el.querySelector('#addall').textContent = `Add ${items.filter(x => x.on).length} to the pantry`; }
      if (t.dataset.nm != null) items[i].name = t.value; if (t.dataset.q != null) items[i].qty = Number(t.value); if (t.dataset.u != null) items[i].unit = t.value; });
    el.addEventListener('click', async e => { if (!e.target.closest('#addall')) return; const pick = items.filter(x => x.on && x.name.trim()); if (!pick.length) return toast('Nothing selected'); busy(el, 'Adding to the pantry…');
      try { const r = await addToPantry(pick.map(x => ({ name: x.name.trim(), qty: x.qty, unit: x.unit, category: x.category, expires_on: x.expires_days ? ymd(addDays(new Date(), x.expires_days)) : null }))); await loadAll(); el.remove(); render(); toast([r.added && `Added ${r.added} new item${r.added > 1 ? 's' : ''}`, r.updated && `topped up ${r.updated}`].filter(Boolean).join(', ')); if (mode === 'receipt_photo') spendEditor('groceries'); } catch (er) { el.remove(); fail(er); } });
  } catch (e) { el.remove(); fail(e); }
}

// ---------- spending & home area ----------
function spendEditor(kind = 'groceries') {
  sheet(`<h2>Log spending</h2><form id="sf"><div class="seg">${[['groceries', 'Groceries'], ['out', 'Eating out'], ['takeout', 'Takeout']].map(([k, l]) => `<button type="button" data-sk="${k}" style="--k:var(--${k === 'groceries' ? 'leftovers' : k})" aria-pressed="${kind === k}">${l}</button>`).join('')}</div>
  <div class="grid2"><div><label for="sa">Amount</label><input type="number" id="sa" min="0" step="0.01" inputmode="decimal" required placeholder="$0.00"></div><div><label for="sd">Date</label><input type="date" id="sd" value="${ymd(new Date())}"></div></div>
  <label for="sn">Note (optional)</label><input type="text" id="sn" maxlength="80" placeholder="e.g. Kroger, Costco run">
  <div class="row" style="margin-top:18px"><button class="btn" type="submit">Save</button><button class="btn ghost" type="button" data-close>Skip</button></div></form>`, (el, close) => {
    el.addEventListener('click', e => { const b = e.target.closest('[data-sk]'); if (b) { kind = b.dataset.sk; el.querySelectorAll('[data-sk]').forEach(x => x.setAttribute('aria-pressed', x === b)); } });
    el.querySelector('#sf').onsubmit = async e => { e.preventDefault(); const r = await sb.from('spending').insert({ household_id: S.household.id, kind, amount: Number(el.querySelector('#sa').value), day: el.querySelector('#sd').value || ymd(new Date()), note: el.querySelector('#sn').value.trim() || null }); if (r.error) return fail(r.error); await loadAll(); close(); toast('Logged'); };
  });
}
function homeEditor() {
  const st = { results: [], err: '' };
  const drawRes = el => { el.querySelector('#hres').innerHTML = (st.err ? `<div class="err">${esc(st.err)}</div>` : '') + st.results.map((r, i) => `<button type="button" data-h="${i}" style="all:unset;display:block;width:100%;padding:10px 0;border-bottom:1px solid var(--line);cursor:pointer"><span class="iname">${esc(r.name)}</span><br><span class="imeta">${esc(r.address)}</span></button>`).join(''); };
  sheet(`<h2>Home area</h2><p class="lede">Pick your neighborhood or zip code. Restaurant searches show places near here first. Only this rough area is saved, not your address.</p>
  <div class="row" style="gap:6px;flex-wrap:nowrap"><input type="search" id="hq" class="sp" placeholder="e.g. Bushwick, Brooklyn or 11237"><button type="button" class="btn sm" id="hgo">Search</button></div>
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
  const t = e.target.closest('[data-tab],[data-day],[data-week],[data-act],[data-edit-pantry],[data-recipe],[data-check],[data-delitem],[data-dq],[data-rview],[data-book]');
  if (!t || t.closest('.sheet')) return;
  try {
    if (t.dataset.tab) { S.tab = t.dataset.tab; render(); $('#main').scrollTop = 0; return; }
    if (t.dataset.day) return dayEditor(t.dataset.day);
    if (t.dataset.week) { S.weekStart = ymd(addDays(parseYmd(S.weekStart), Number(t.dataset.week))); return render(); }
    if (t.dataset.editPantry) return pantryEditor(t.dataset.editPantry);
    if (t.dataset.recipe) return recipeView(t.dataset.recipe);
    if (t.dataset.rview) { S.rview = t.dataset.rview; return render(); }
    if (t.dataset.book != null) { S.book = t.dataset.book || null; return render(); }
    if (t.dataset.dq) { const p = S.pantry.find(x => x.id === t.dataset.dq); const q = Math.max(0, Number(p.qty) + Number(t.dataset.d)); p.qty = q; render(); const r = await sb.from('pantry_items').update({ qty: q, updated_at: new Date().toISOString() }).eq('id', p.id); if (r.error) fail(r.error); return; }
    if (t.dataset.check) { const l = S.list.find(x => x.id === t.dataset.check); l.checked = t.checked; render(); const r = await sb.from('shopping_items').update({ checked: l.checked }).eq('id', l.id); if (r.error) fail(r.error); return; }
    if (t.dataset.delitem) { S.list = S.list.filter(x => x.id !== t.dataset.delitem); render(); const r = await sb.from('shopping_items').delete().eq('id', t.dataset.delitem); if (r.error) fail(r.error); return; }
    const a = t.dataset.act;
    if (a === 'addpantry') return pantryEditor(null);
    if (a === 'scanbarcode') return scanBarcodeFlow();
    if (a === 'snappantry') return captureImage('Snap your shelves', 'Fridge, freezer, pantry or a counter of groceries', src => pantryPhoto(src, 'pantry_photo'));
    if (a === 'snapreceipt') return captureImage('Scan a receipt', 'Lay the receipt flat and fill the frame', src => pantryPhoto(src, 'receipt_photo'));
    if (a === 'addrecipe') return addRecipeMenu();
    if (a === 'chef') return chefSheet();
    if (a === 'newbook') return bookEditor(null);
    if (a === 'editbook') return bookEditor(S.book);
    if (a === 'logspend') return spendEditor(S.tab === 'list' ? 'groceries' : 'groceries');
    if (a === 'buildlist') { t.disabled = true; await buildList(); return; }
    if (a === 'putaway') return checkedToPantry();
    if (a === 'importlib') return importLibrary(t);
    if (a === 'sethome') return homeEditor();
    if (a === 'copycode') { try { await navigator.clipboard.writeText(`Join our household on We're Cooked: ${WEB_HOME} — invite code ${S.household.invite_code}`); toast('Invite copied'); } catch (_) { toast('Code: ' + S.household.invite_code); } return; }
    if (a === 'signout') { if (S.channel) sb.removeChannel(S.channel); await sb.auth.signOut(); return; }
  } catch (err) { fail(err); }
});

window.__back = () => { const s = [...document.querySelectorAll('.sheet')].pop(); if (s) { s.close ? s.close() : s.remove(); return true; } if (S.session && S.household && S.tab !== 'week') { S.tab = 'week'; render(); return true; } return false; };

sb.auth.onAuthStateChange((ev, session) => {
  const was = S.session?.user?.id; S.session = session;
  if (!session) { S.household = null; S.me = null; render(); return; }
  if (session.user.id !== was) setTimeout(enter, 0);
});
sb.auth.getSession().then(({ data }) => { S.session = data.session; if (data.session) enter(); else render(); });

if ('serviceWorker' in navigator && location.hostname.endsWith('github.io')) navigator.serviceWorker.register('sw.js').catch(() => {});
}
