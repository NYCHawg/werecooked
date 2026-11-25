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
const mondayOf = d => { const x = new Date(d); x.setHours(12, 0, 0, 0); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; };
const money = n => { const v = Math.round(Number(n || 0) * 100) / 100; return '$' + v.toLocaleString(undefined, { minimumFractionDigits: v % 1 ? 2 : 0, maximumFractionDigits: 2 }); };
const fmtQty = q => { if (q == null || q === '') return ''; const n = Math.round(Number(q) * 100) / 100; const w = Math.floor(n), f = n - w; const fr = [[.25, '¼'], [.5, '½'], [.75, '¾'], [.33, '⅓'], [.67, '⅔'], [.125, '⅛']].find(([v]) => Math.abs(v - f) < .03); return f < .03 ? String(w) : fr ? (w ? w : '') + fr[1] : String(n); };
const DESCRIPTORS = /\b(sharp|mild|large|small|medium|extra|fresh|freshly|dried|ground|rubbed|packed|lightly|light|dark|unsalted|salted|whole|chopped|minced|diced|sliced|shredded|grated|softened|melted|cold|warm|hot|day old|extra virgin|boneless|skinless|thin|thick|cut|cubed|peeled|seeded|crushed|frozen|unbaked|baked|deep dish|\d+ inch|room temperature|optional|good quality|best quality|store bought|homemade|plain|pure|real|raw|cooked)\b/g;
const norm = s => String(s || '').toLowerCase().replace(/\(.*?\)/g, '').replace(/,.*$/, '').replace(/[^a-z0-9 ]/g, ' ').replace(DESCRIPTORS, ' ').replace(/\s+/g, ' ').trim().replace(/(es|s)$/, '');
const isSubRecipe = n => /^recipe\b|^\d*\s*recipe\b/i.test(String(n || '').trim());
const DIFFERENT = /\b(peanut|apple|almond|coconut|cocoa|ice|sour|corn|sweet|evaporated|condensed|powdered|cream of|green|red|hot|smoked|powder|salt|broth|stock|sauce|oil|paste|juice|seasoning|flakes|vinegar|soup|chips|crackers|syrup|butter|milk|cream|jam|jelly|seed|zest|leaves)\b/;
const same = (a, b) => { const x = norm(a), y = norm(b); if (!x || !y) return false; if (x === y) return true; if (x.length < 3 || y.length < 3) return false;
  const [sh, lo] = x.length <= y.length ? [x, y] : [y, x]; if (!` ${lo} `.includes(` ${sh} `)) return false;
  const extra = ` ${lo} `.replace(` ${sh} `, ' ').trim(); return !DIFFERENT.test(extra); };
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
const CATS = ['Produce', 'Meat & Seafood', 'Dairy & Eggs', 'Bakery', 'Pantry', 'Baking', 'Spices', 'Frozen', 'Drinks', 'Snacks', 'Household', 'Other'];
const RCATS = {
  breakfast: ['Breakfast', '🍳', '#D68A1E'], main: ['Main dish', '🍲', '#A8432A'], side: ['Side', '🥔', '#5F8A3E'], soup: ['Soup & stew', '🥣', '#B9682F'],
  salad: ['Salad', '🥗', '#3F8A5A'], appetizer: ['Appetizer', '🧀', '#C98A12'], dessert: ['Dessert', '🥧', '#9A4D72'], bread: ['Bread', '🍞', '#A97A3E'],
  drink: ['Drink', '☕', '#3D6F96'], sauce: ['Sauce', '🫙', '#8A3A2C'], seasoning: ['Seasoning', '🧂', '#6E6150'], dressing: ['Dressing', '🥄', '#5C7A4A'], condiment: ['Condiment', '🫙', '#7A5A2E']
};
const COMPONENT_CATS = ['sauce', 'seasoning', 'dressing', 'condiment', 'drink'];
const DEFAULT_BOOKS = [['Family Recipes', '👪', '#2E6B4E'], ['Quick Meals', '⚡', '#D24F14'], ['Arkansas Classics', '🐗', '#8A2A2A'], ['Thanksgiving', '🦃', '#A0611C'], ['Holiday & Desserts', '🥧', '#7A3F6B'], ['Side Dishes', '🥔', '#5E7D2A']];
const BOOK_COLORS = ['#2E6B4E', '#D24F14', '#8A2A2A', '#A0611C', '#7A3F6B', '#2F6F9F', '#5E7D2A', '#4B4A8A', '#9A6A12', '#3D3A36'];
const EMOJI = [[/waffle/, '🧇'], [/pancake/, '🥞'], [/french toast/, '🍞'], [/turkey/, '🦃'], [/duck/, '🦆'], [/catfish|fish|salmon|bream|crappie/, '🐟'], [/shrimp|crawfish|crab|seafood|oyster/, '🦐'], [/frog/, '🐸'],
  [/taco|burrito|nacho|tamale/, '🌮'], [/burger|patty melt/, '🍔'], [/sandwich|blt|bologna|po' boy/, '🥪'], [/pizza/, '🍕'], [/chili|gumbo|stew|soup|chowder|étouffée|etouffee/, '🍲'],
  [/spaghetti|alfredo|pasta|mac and cheese|tetrazzini|noodle|stroganoff/, '🍝'], [/fried chicken|chicken/, '🍗'], [/steak|ribeye|roast|beef/, '🥩'], [/ham|ribs|pork|bologna|spam/, '🍖'],
  [/egg/, '🥚'], [/rice/, '🍚'], [/potato|fries|hash/, '🥔'], [/corn/, '🌽'], [/tomato/, '🍅'], [/okra|green|cabbage|bean|pea|squash|zucchini|broccoli|collard/, '🥬'], [/pickle/, '🥒'],
  [/biscuit|bread|roll|cornbread|hushpupp/, '🍞'], [/dip|cheese|fondue|pimento/, '🧀'], [/ice cream|sorbet/, '🍨'], [/cake/, '🍰'], [/cookie|crispies/, '🍪'],
  [/pie|cobbler|crisp|pudding|shortcake|ambrosia|salad/, '🥧'], [/fudge|candy|praline|brittle|divinity|frosting/, '🍬'], [/latte|coffee|tea/, '☕'], [/apple/, '🍎'], [/peach/, '🍑'], [/strawberr/, '🍓'], [/banana/, '🍌'],
  [/seasoning|rub|blend/, '🧂'], [/sauce|gravy|dressing|preserve|chow|vinegar|jelly/, '🫙']];

// ---------- state ----------
const S = { session: null, me: null, household: null, members: [], busy: [], calLink: null, lists: [], listId: null, pantry: [], recipes: [], books: [], plan: [], list: [], spending: [], events: [], tab: 'home', weekStart: ymd(mondayOf(new Date())),
  recipeQ: '', rview: 'meal', book: null, channel: null, library: [], libLoaded: false, loc: null, checks: {}, done: {}, pantryQ: '', zone: null, pview: 'kitchen' };
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
  await loadCalendar();
  S.members = mem.data; S.pantry = pan.data; S.recipes = rec.data; S.plan = pl.data; S.list = li.data.filter(x => x.source !== 'skip'); S.skips = li.data.filter(x => x.source === 'skip'); S.books = bk.data; S.spending = sp.data;
  if (!S.libLoaded) await loadLibrary();
  if (!Object.keys(ING.items).length) await loadIngredientMap();
  scheduleLinks(); scheduleListSync();
  setTimeout(() => ensureSideBook().catch(console.error), 300);
}
async function loadCalendar() {
  const hid = S.household.id;
  const [b, l, ev, sl] = await Promise.all([
    sb.from('calendar_busy').select('user_id, day, reason, calendar').eq('household_id', hid).gte('day', ymd(addDays(new Date(), -7))).order('day'),
    sb.from('calendar_links').select('user_id, google_email, calendars, match_name, dinner_start, dinner_end, tz, last_sync, last_error').eq('user_id', S.session.user.id).maybeSingle(),
    sb.from('household_events').select('*').eq('household_id', hid).gte('day', ymd(addDays(new Date(), -1))).order('day'),
    sb.from('shopping_lists').select('*').eq('household_id', hid).order('created_at')
  ]);
  S.lists = sl.error ? [] : sl.data; if (S.listId && !S.lists.some(x => x.id === S.listId)) S.listId = null;
  S.events = ev.error ? [] : ev.data;
  S.busy = b.error ? [] : b.data; S.calLink = l.error ? null : l.data;
}
async function calFn(body) {
  const { data, error } = await sb.functions.invoke('calendar', { body });
  if (error) { let m = error.message; try { const j = await error.context.json(); m = j.error || m; } catch (_) { } throw new Error(m); }
  if (data?.error) throw new Error(data.error);
  return data;
}
let calSyncing = false;
async function autoSyncCalendar() {
  if (calSyncing) return; calSyncing = true;
  try { const r = await calFn({ action: 'sync' }); if (r.synced) { await loadCalendar(); if (!$('.sheet')) render(); } } catch (_) { } finally { calSyncing = false; }
}
let sideBookDone = false;
/** Make sure there's a Side Dishes cookbook holding every side and salad. */
async function ensureSideBook() {
  if (sideBookDone || !S.household || !S.books.length) return;
  let b = S.books.find(x => x.name.toLowerCase() === 'side dishes');
  const todo = b ? S.recipes.filter(r => ['side', 'salad'].includes(catOf(r)) && !(r.books || []).includes(b.id)) : [1];
  if (b && !todo.length) return;
  sideBookDone = true;
  try {
  if (!b) { const r = await sb.from('recipe_books').insert({ household_id: S.household.id, name: 'Side Dishes', emoji: '🥔', color: '#5E7D2A', sort: S.books.length }).select().single(); if (r.error) return console.error(r.error); b = r.data; S.books.push(b); }
  quietUntil = Date.now() + 6000;
  for (const r of S.recipes) if (['side', 'salad'].includes(catOf(r)) && !(r.books || []).includes(b.id)) { r.books = [...(r.books || []), b.id]; await sb.from('recipes').update({ books: r.books }).eq('id', r.id); }
  if (!$('.sheet')) render();
  } finally { sideBookDone = false; }
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
  for (const t of ['members', 'pantry_items', 'recipes', 'meal_plan', 'shopping_items', 'recipe_books', 'spending', 'calendar_busy', 'household_events', 'shopping_lists'])
    S.channel.on('postgres_changes', { event: '*', schema: 'public', table: t, filter: f }, () => { if (Date.now() < quietUntil) return; clearTimeout(reloadT); reloadT = setTimeout(async () => { try { await loadAll(); if (!$('.sheet')) render(); } catch (e) { } }, 400); });
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
// ---------- pantry links: every ingredient points at specific pantry items ----------
let ING = { items: {}, sizes: {}, convert: new Set(), map: {}, rules: [] };
const linkCache = new Map();
async function loadIngredientMap() {
  try { const j = await fetch('ingredients.json').then(r => r.json()); ING = { items: j.items || {}, sizes: j.sizes || {}, convert: new Set(j.convert || []), lower: Object.fromEntries(Object.keys(j.items || {}).map(k => [k.toLowerCase(), k])), map: j.map || {}, rules: (j.rules || []).map(([p, r]) => [new RegExp(p), r]) }; linkCache.clear(); } catch (_) { }
}
const BASICS = /^(Table salt|Kosher salt|Sea salt|Black pepper)$/;
const OPTIONAL = /\b(optional|to serve|for serving|to garnish|for garnish|garnish|for dipping|for topping)\b/i;
/** {items:[pantry item names], sub:[recipe titles], skip:bool} or null when not linked yet */
const aliasOf = n => S.household?.custom?.alias?.[String(n).toLowerCase()] || n;
const withAlias = l => (l && S.household?.custom?.alias && l.items.length) ? { ...l, items: l.items.map(aliasOf) } : l;
function linkOf(i) { return withAlias(rawLinkOf(i)); }
function rawLinkOf(i) {
  if (i && typeof i === 'object' && (Array.isArray(i.items) || Array.isArray(i.sub) || i.skip)) return { items: i.items || [], sub: i.sub || [], skip: !!i.skip };
  const n = String((i && typeof i === 'object') ? i.name : i || '').trim().toLowerCase(); if (!n) return null;
  if (linkCache.has(n)) return linkCache.get(n);
  let out = ING.map[n] || null;
  if (!out) { const hit = ING.lower?.[n]; if (hit) out = { items: [hit], sub: [] }; }
  if (!out) for (const [rx, res] of ING.rules) if (rx.test(n)) {
    if (res === 'skip') { out = { items: [], sub: [], skip: true }; break; }
    const parts = res.split('+').map(x => x.trim()); out = { items: parts.filter(x => !x.startsWith('sub:')), sub: parts.filter(x => x.startsWith('sub:')).map(x => x.slice(4)) }; break;
  }
  if (!out && isSubRecipe(n)) out = { items: [], sub: [n.replace(/^\d*\s*recipe\s+/, '').replace(/,.*$/, '')] };
  linkCache.set(n, out); return out;
}
/** The pantry row for a canonical item name (exact name, or a pantry row whose own name links to it). */
function rowsFor(name) {
  const k = String(name || '').toLowerCase(); if (!k) return [];
  return S.pantry.filter(p => p.name.toLowerCase() === k || (linkOf(p.name)?.items || [])[0]?.toLowerCase() === k);
}
/** The pantry row for a canonical item: a stocked row first (exact name preferred), else the exact row, else any linked row. */
function itemNamed(name) {
  const k = String(name || '').toLowerCase(), rows = rowsFor(name); if (!rows.length) return null;
  return rows.find(p => Number(p.qty) > 0 && p.name.toLowerCase() === k) || rows.find(p => Number(p.qty) > 0) || rows.find(p => p.name.toLowerCase() === k) || rows[0];
}
const haveItem = name => rowsFor(name).some(p => Number(p.qty) > 0);
// ---------- units: compare and subtract across lb/oz, cups/tbsp/gallons, dozen/each ----------
const UNIT_SETS = [{ oz: 1, lb: 16, g: 1 / 28.3495, kg: 35.274 },
  { tsp: 1, tbsp: 3, 'fl oz': 6, cup: 48, pint: 96, pt: 96, quart: 192, qt: 192, gal: 768, gallon: 768, ml: 0.202884, l: 202.884 },
  { '': 1, dozen: 12, piece: 1 }];
/** q in `from` expressed in `to`, or null when the two units don't convert. */
function convertQty(q, from, to) { const f = normUnit(from), t = normUnit(to); if (f === t) return q; for (const u of UNIT_SETS) if (f in u && t in u) return q * u[f] / u[t]; return null; }
// ---------- package sizes: a bag of flour is 5 lb, a cup of flour is 4.25 oz ----------
/** An item's package size: the one set on its pantry row, else the standard one. {pkg, amt, unit, opc} */
function sizeOf(name, row) {
  const canon = linkOf(name)?.items?.[0] || name, k = ING.sizes[canon] ? canon : ING.lower?.[String(canon || '').toLowerCase()], d = k ? ING.sizes[k] : null;
  if (row?.pack_qty && row?.pack_unit) return { pkg: normUnit(row.pack_name || d?.[0] || ''), amt: Number(row.pack_qty), unit: normUnit(row.pack_unit), opc: d?.[3] || null };
  return d ? { pkg: d[0], amt: Number(d[1]), unit: normUnit(d[2]), opc: d[3] || null } : null;
}
function toBase(q, u, sz, depth = 0) {
  u = normUnit(u); if (u in UNIT_SETS[0]) return { k: 'm', v: q * UNIT_SETS[0][u] }; if (u in UNIT_SETS[1]) return { k: 'v', v: q * UNIT_SETS[1][u] };
  if (sz && !depth && u && (u === sz.pkg || PACKAGE_UNITS.has(u))) return toBase(q * sz.amt, sz.unit, sz, 1);
  return null;
}
/** Like convertQty, but knows this item: bags/boxes/cans become pounds or ounces, and cups become weight for dry goods. */
function itemConvert(q, from, to, name, row) {
  const c = convertQty(q, from, to); if (c != null) return c;
  const sz = name ? sizeOf(name, row) : null; if (!sz) return null;
  const a = toBase(q, from, sz), b = toBase(1, to, sz); if (!a || !b) return null;
  let v = a.v; if (a.k !== b.k) { if (!sz.opc) return null; v = a.k === 'v' ? v / 48 * sz.opc : v / sz.opc * 48; }
  return v / b.v;
}
/** "≈ 2 bags" next to an amount kept in pounds or ounces. */
function packsLabel(p) {
  const sz = sizeOf(p.name, p); if (!sz || !ING.convert.has(sz.pkg) || normUnit(p.unit) !== sz.unit || !(Number(p.qty) > 0)) return '';
  const n = Math.round(Number(p.qty) / sz.amt * 2) / 2; return n > 0 ? `≈ ${fmtQty(n)} ${sz.pkg}${n > 1 ? (sz.pkg.endsWith('x') ? 'es' : 's') : ''}` : `under a ${sz.pkg}`;
}
const stepOf = p => { const sz = sizeOf(p.name, p); return sz && ING.convert.has(sz.pkg) && normUnit(p.unit) === sz.unit ? sz.amt : 1; };
/** A par of "keep 1 bag" becomes "restock when about a quarter bag is left", so one bake doesn't send flour to the list. */
const parIn = (par, amt) => { par = Number(par) || 0; return par > 0 ? Math.round(Math.max(amt * 0.25, (par - 0.75) * amt) * 100) / 100 : 0; };
/** Pantry rows counted in bags, boxes and containers switch to the weight or volume they hold (2 bags of flour → 10 lb). */
async function measureRows() {
  const now = new Date().toISOString(), todo = [];
  for (const p of S.pantry) {
    let u = normUnit(p.unit), mult = 1; const m = u.match(/^(\d+(?:\.\d+)?)\s*(lb|oz|g|kg)s?\s+(\w+)$/);   // "5lb bag"
    if (m) { todo.push([p, { qty: Number(p.qty) * Number(m[1]), par: parIn(p.par, Number(m[1])), unit: m[2], pack_name: m[3], pack_qty: Number(m[1]), pack_unit: m[2], updated_at: now }]); continue; }
    if (!ING.convert.has(u)) continue;
    const sz = sizeOf(p.name, p); if (!sz || !(sz.unit in UNIT_SETS[0] || sz.unit in UNIT_SETS[1])) continue;
    mult = sz.amt; todo.push([p, { qty: Math.round(Number(p.qty) * mult * 100) / 100, par: parIn(p.par, mult), unit: sz.unit, pack_name: u, pack_qty: sz.amt, pack_unit: sz.unit, updated_at: now }]);
  }
  if (!todo.length) return 0;
  quietUntil = Date.now() + 6000;
  for (const [p, row] of todo) { const r = await sb.from('pantry_items').update(row).eq('id', p.id); if (r.error) { console.error(r.error); break; } Object.assign(p, row); }
  return todo.length;
}
/** Everything on hand for an item, across every pantry row that links to it, in `unit` where it converts. */
function stockOf(name, unit, rows) {
  rows = rows || rowsFor(name); let qty = 0, any = false, exact = true;
  for (const p of rows) { const h = Number(p.qty) || 0; if (h <= 0) continue; any = true; const c = itemConvert(h, p.unit, unit, name, p); if (c == null) exact = false; else qty += c; }
  return { qty, any, exact };
}
/** A recipe's lines with linked sub-recipes ("1 recipe pie crust") folded in, each with its scale factor. */
function expandIngs(r, f = 1, depth = 0, seen = new Set()) {
  const out = []; seen = new Set(seen).add(r.id);
  for (const i of r.ingredients || []) {
    const l = linkOf(i), subs = depth < 2 ? (l?.sub || []).map(subRecipe).filter(x => x && !seen.has(x.id)) : [];
    if (subs.length) { const k = i.qty && (!i.unit || /^(recipe|batch|crust|portion)s?$/i.test(i.unit)) ? Number(i.qty) : 1; for (const x of subs) out.push(...expandIngs(x, f * k, depth + 1, seen)); if (!l.items.length) continue; }
    out.push({ i, f });
  }
  return out;
}
// ---------- family dislikes ----------
const DISLIKE_GROUPS = { shellfish: 'shrimp|crab|lobster|crawfish|scallop|oyster|clam|mussel', seafood: 'shrimp|crab|lobster|crawfish|scallop|oyster|clam|mussel|fish|catfish|salmon|tuna|cod|tilapia', fish: 'fish|catfish|salmon|tuna|cod|tilapia|anchov',
  pork: 'pork|bacon|ham|sausage|chorizo|prosciutto|pancetta', nut: 'pecan|walnut|almond|peanut|cashew|pistachio|hazelnut', dairy: 'milk|cheese|butter|cream|yogurt|buttermilk|sour cream', gluten: 'flour|bread|pasta|noodle|biscuit|cracker|breadcrumb',
  spicy: 'jalape|cayenne|hot sauce|chili|chile|habanero|red pepper flake', mushroom: 'mushroom', egg: 'egg', beef: 'beef|steak|ribeye|brisket', red_meat: 'beef|steak|lamb|venison|brisket' };
const reEsc = x => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function dislikePatterns(m) {
  return String(m.dislikes || '').toLowerCase().split(/[,;\/]|\band\b|\bor\b/).map(x => x.replace(/\b(allerg(y|ies|ic)|intoleran\w*|no|hate|don'?t|dislike|avoid|anything|any|foods?|really|not|eat)\b/g, ' ').replace(/[^a-z ]/g, ' ').replace(/\s+/g, ' ').trim()).filter(x => x.length >= 3)
    .map(w => { const stem = w.replace(/(es|s)$/, ''), g = DISLIKE_GROUPS[stem] || DISLIKE_GROUPS[stem.replace(/ /g, '_')]; return { w, rx: new RegExp(`\\b(${g ? g + '|' : ''}${reEsc(stem)})`) }; });
}
/** Who (home that night, or anyone when no day) avoids something in this recipe: [{m, what}] */
function avoidersOf(r, day) {
  const pl = day ? S.plan.find(x => x.day === day) : null, away = day ? new Set(awayOn(pl, day)) : new Set();
  const text = [r.title, ...expandIngs(r).flatMap(({ i }) => [i.name, ...(linkOf(i)?.items || [])])].join(' | ').toLowerCase(), out = [];
  for (const m of S.members) { if (away.has(m.user_id)) continue; const hit = dislikePatterns(m).find(d => d.rx.test(text)); if (hit) out.push({ m, what: hit.w }); }
  return out;
}
const guestsOn = d => d ? (S.events || []).filter(e => e.day === d).reduce((a, e) => a + (Number(e.guests) || 0), 0) : 0;
const subRecipe = title => S.recipes.find(r => r.title.toLowerCase() === String(title).toLowerCase()) || S.recipes.find(r => same(r.title, title));
const itemMeta = n => ING.items[n] || null;
function pantryFor(x) {
  const l = linkOf(x);
  if (l) return l.items.length ? itemNamed(l.items[0]) : null;
  const n = typeof x === 'object' ? x?.name : x; return S.pantry.find(p => same(p.name, n)) || null;
}
/** Does ingredient i use pantry row p? */
const usesItem = (i, p) => { const l = linkOf(i); return l ? l.items.some(n => itemNamed(n)?.id === p.id) : same(i.name, p.name); };
/** Shopping rows for whatever this recipe is missing, by pantry item name. */
function missingBuys(r, f = 1) {
  const out = [];
  for (const { i, its, need } of recipeMatch(r, f).missingRows) {
    if (!its) { out.push({ name: buyName(i.name), qty: need, unit: normUnit(i.unit || ''), category: 'Other' }); continue; }
    for (const n of its) { const single = its.length === 1, st = stockOf(n, i.unit); if (!single && st.any) continue;
      const q = single && need != null ? (st.exact ? Math.max(0, need - st.qty) : need) : null; const p = itemNamed(n);
      out.push({ name: n, qty: q || null, unit: single ? normUnit(i.unit || '') : '', category: p?.category || itemMeta(n)?.[1] || 'Other' }); }
  }
  return out;
}
let linking = false, linkT;
const scheduleLinks = () => { clearTimeout(linkT); linkT = setTimeout(() => ensureLinks().catch(console.error), 700); };
/** Make sure every item any recipe links to exists in the pantry (at 0 if you don't have it), and save links onto recipes. */
async function ensureLinks() {
  if (linking || !S.household || !Object.keys(ING.items).length) return; linking = true;
  try {
  const need = new Set();
  for (const r of S.recipes) for (const i of r.ingredients || []) for (const n of linkOf(i)?.items || []) need.add(n);
  const add = [...need].filter(n => !itemNamed(n)).map(n => { const m = itemMeta(n) || ['pantry', 'Other', '']; return { household_id: S.household.id, name: n, qty: 0, par: 0, unit: m[2] || '', location: m[0], category: m[1], updated_at: new Date().toISOString() }; });
  quietUntil = Date.now() + 8000;
  for (let k = 0; k < add.length; k += 100) { const r = await sb.from('pantry_items').insert(add.slice(k, k + 100)); if (r.error) { console.error(r.error); break; } }
  for (const r of S.recipes) {
    const ings = r.ingredients || []; if (!ings.some(i => !Array.isArray(i.items) && !i.skip && linkOf(i))) continue;
    const next = ings.map(i => { if (Array.isArray(i.items) || i.skip) return i; const l = linkOf(i); return l ? { ...i, items: l.items, sub: l.sub, ...(l.skip ? { skip: true } : {}) } : i; });
    r.ingredients = next; quietUntil = Date.now() + 3000; await sb.from('recipes').update({ ingredients: next }).eq('id', r.id);
  }
  const measured = await measureRows();
  if (add.length || measured) { const pr = await sb.from('pantry_items').select('*').eq('household_id', S.household.id).order('name'); if (!pr.error) S.pantry = pr.data; if (!$('.sheet')) render(); }
  } finally { linking = false; }
}
/** Re-link edited ingredient lines, keeping links you set by hand on lines that didn't change. */
function relink(newIngs, oldIngs = []) {
  return newIngs.map(i => { const o = oldIngs.find(x => x.name.trim().toLowerCase() === i.name.trim().toLowerCase() && (Array.isArray(x.items) || x.skip));
    if (o) return { ...i, items: o.items || [], sub: o.sub || [], ...(o.skip ? { skip: true } : {}) };
    const l = linkOf(i.name); return l ? { ...i, items: l.items, sub: l.sub, ...(l.skip ? { skip: true } : {}) } : i; });
}
function recipeMatch(r, f = 1) {
  const rows = [], seen = new Map();
  for (const { i, f: k } of expandIngs(r, f)) {
    const l = linkOf(i);
    if (l) { if (l.skip || !l.items.length || l.items.every(n => BASICS.test(n)) || OPTIONAL.test(i.name)) continue;
      const key = l.items.join('|').toLowerCase(), prev = seen.get(key);
      if (prev) { const c = prev.i.qty != null && i.qty != null ? itemConvert(i.qty * k, i.unit, prev.i.unit, l.items[0]) : null; if (c != null) prev.need += c; else prev.need = null; continue; }
      const row = { i, its: l.items, need: i.qty != null ? i.qty * k : null }; seen.set(key, row); rows.push(row); }
    else { if (isSubRecipe(i.name) || /^(salt|pepper|black pepper|water|ice)$/i.test(norm(i.name)) || OPTIONAL.test(i.name)) continue; rows.push({ i, its: null, need: i.qty != null ? i.qty * k : null }); }
  }
  if (!rows.length) return { pct: 0, have: 0, total: 0, missing: [], missingRows: [] };
  // missing = none on hand, or (when units compare) clearly less than the recipe needs
  const shortOf = (st, need) => !st.any || (need != null && st.exact && st.qty < need * 0.9);
  const lacks = ({ i, its, need }) => its ? (its.length === 1 ? shortOf(stockOf(its[0], i.unit), need) : its.some(n => !haveItem(n))) : shortOf(stockOf(i.name, i.unit, S.pantry.filter(p => same(p.name, i.name))), need);
  const missingRows = rows.filter(lacks);
  return { pct: Math.round((rows.length - missingRows.length) / rows.length * 100), have: rows.length - missingRows.length, total: rows.length, missing: missingRows.map(x => x.i), missingRows };
}
function ideas(limit = 3) {
  const soon = S.pantry.filter(p => p.expires_on && parseYmd(p.expires_on) <= addDays(new Date(), 3) && Number(p.qty) > 0);
  return S.recipes.filter(r => isMeal(r) && !avoidersOf(r, ymd(new Date())).length).map(r => { const m = recipeMatch(r); const uses = soon.filter(p => (r.ingredients || []).some(i => usesItem(i, p))).length; return { r, m, score: m.pct + uses * 15 + (r.favorite ? 5 : 0) + (r.rating || 0) * 2 }; })
    .filter(x => x.m.total >= 3 && x.m.pct >= 50).sort((a, b) => b.score - a.score).slice(0, limit);
}
const busyOn = d => d ? S.busy.filter(b => b.day === d && memberById(b.user_id)) : [];
/** Who's away for dinner: marked away on the plan, plus anyone working per their calendar (unless marked home). */
function awayOn(p, d) {
  d = d || p?.day; const set = new Set(p?.away || []);
  for (const b of busyOn(d)) if (!(p?.present || []).includes(b.user_id)) set.add(b.user_id);
  return [...set];
}
const shortReason = b => (b.reason || '').replace(/\s+/g, ' ').slice(0, 70);
const homeCount = p => (Math.max(0, S.members.length - awayOn(p).length) + guestsOn(p?.day)) || 1;
const factorFor = (p, r) => (p.headcount || homeCount(p)) / (r.servings || 4);

/** What this week's meals and staples need from the store, after what's on hand. */
function weekNeeds() {
  const today = ymd(new Date()), end = ymd(addDays(new Date(), 6)), need = new Map();
  const add = (name, qty, unit, category) => {
    if (isSubRecipe(name)) return; name = buyName(name); if (!name || /\bwater\b|^ice$/i.test(name)) return; unit = normUnit(unit);
    const k = norm(name), cur = need.get(k);
    if (cur) { const c = qty != null ? itemConvert(qty, unit, cur.unit, name) : null; if (c != null && cur.qty != null) { cur.qty += c; return; } if (qty == null || cur.qty == null) { if (cur.unit === unit || qty == null) { cur.qty = cur.qty ?? qty; return; } } const k2 = k + '|' + unit, c2 = need.get(k2); if (c2) c2.qty = (c2.qty || 0) + (qty || 0); else need.set(k2, { name, qty, unit, category }); return; }
    need.set(k, { name, qty: qty ?? null, unit, category });
  };
  for (const p of S.plan) {
    if (p.kind !== 'cook' || p.cooked || p.day < today || p.day > end) continue;
    for (const r of dishesOf(p)) for (const { i, f } of expandIngs(r, factorFor(p, r))) {
      const l = linkOf(i);
      if (!l) { add(i.name, i.qty != null ? i.qty * f : null, i.unit, 'Other'); continue; }
      if (l.skip) continue;
      for (const n of l.items) { if (BASICS.test(n)) continue; const single = l.items.length === 1; add(n, single && i.qty != null ? i.qty * f : null, single ? i.unit : '', itemNamed(n)?.category || itemMeta(n)?.[1] || 'Other'); }
    }
  }
  const rows = [];
  for (const n of need.values()) {
    if (/^(salt|water|ice)$/.test(norm(n.name))) continue;
    const linked = rowsFor(n.name), st = stockOf(n.name, n.unit, linked.length ? linked : S.pantry.filter(p => same(p.name, n.name)));
    if (st.any) { if (n.qty == null || !st.exact) continue; const short = n.qty - st.qty; if (short <= 0.001) continue; n.qty = short; }
    rows.push({ name: n.name, qty: roundBuy(n.qty, n.unit), unit: n.unit, category: n.category, source: 'plan' });
  }
  for (const p of S.pantry) if (Number(p.par) > 0 && Number(p.qty) < Number(p.par) && !rows.some(r => same(r.name, p.name)))
    rows.push({ name: p.name, qty: Number(p.par) - Number(p.qty), unit: p.unit || '', category: p.category || 'Other', source: 'par' });
  return rows;
}
const canonKey = n => (linkOf(n)?.items?.[0] || n).toLowerCase();
let listSyncing = false, listAgain = false, listSyncT;
const scheduleListSync = (ms = 1200) => { clearTimeout(listSyncT); listSyncT = setTimeout(() => syncList().catch(console.error), ms); };
/** Keep the grocery list in step with the plan and the pantry: add what's needed, update amounts, drop what's covered.
    Items you added, checked, or removed yourself are left alone. */
async function syncList() {
  if (!S.household || !S.session) return { added: 0, changed: 0, removed: 0 };
  if (listSyncing) { listAgain = true; return { added: 0, changed: 0, removed: 0 }; } listSyncing = true;
  try {
    const want = weekNeeds(), byKey = new Map(want.map(w => [canonKey(w.name), w]));
    const main = S.list.filter(l => !l.list_id), skips = (S.skips || []).filter(l => !l.list_id);
    const auto = main.filter(l => !l.checked && (l.source === 'plan' || l.source === 'par'));
    const mine = [...main.filter(l => l.checked || !(l.source === 'plan' || l.source === 'par')), ...skips];
    const blocked = w => mine.some(l => canonKey(l.name) === canonKey(w.name) || same(l.name, w.name));
    const del = [], upd = [], kept = new Set();
    for (const l of auto) { const k = canonKey(l.name), w = byKey.get(k);
      if (!w || kept.has(k) || blocked(w)) { del.push(l.id); continue; } kept.add(k);
      if (Number(l.qty || 0) !== Number(w.qty || 0) || normUnit(l.unit) !== normUnit(w.unit) || l.source !== w.source) upd.push([l.id, { qty: w.qty, unit: w.unit || '', source: w.source }]); }
    for (const l of skips) if (!byKey.has(canonKey(l.name))) del.push(l.id);
    const ins = want.filter(w => !kept.has(canonKey(w.name)) && !blocked(w)).map(w => ({ household_id: S.household.id, name: w.name, qty: w.qty, unit: w.unit || '', category: w.category || 'Other', source: w.source, added_by: S.session.user.id }));
    if (!del.length && !upd.length && !ins.length) return { added: 0, changed: 0, removed: 0 };
    quietUntil = Date.now() + 4000;
    if (del.length) { const r = await sb.from('shopping_items').delete().in('id', del); if (r.error) throw r.error; }
    for (const [id, row] of upd) { const r = await sb.from('shopping_items').update(row).eq('id', id); if (r.error) throw r.error; }
    if (ins.length) { const r = await sb.from('shopping_items').insert(ins); if (r.error) throw r.error; }
    const li = await sb.from('shopping_items').select('*').eq('household_id', S.household.id).order('created_at');
    if (!li.error) { S.list = li.data.filter(x => x.source !== 'skip'); S.skips = li.data.filter(x => x.source === 'skip'); if (!$('.sheet')) render(); }
    return { added: ins.length, changed: upd.length, removed: del.length - skips.filter(l => del.includes(l.id)).length };
  } finally { listSyncing = false; if (listAgain) { listAgain = false; scheduleListSync(300); } }
}
async function buildList() {
  const r = await syncList(); await loadAll(); render();
  const n = S.list.filter(l => !l.list_id && !l.checked && (l.source === 'plan' || l.source === 'par')).length;
  toast(r.added || r.removed || r.changed ? [r.added && `Added ${r.added}`, r.changed && `updated ${r.changed}`, r.removed && `removed ${r.removed} you no longer need`].filter(Boolean).join(', ') : n ? 'List is up to date with this week' : 'Nothing needed: the pantry covers this week');
}
async function markCooked(p) {
  const ds = dishesOf(p), left = new Map();
  for (const r of ds) for (const { i, f } of expandIngs(r, factorFor(p, r))) {
    const lk = linkOf(i); if (i.qty == null) continue;
    if (lk && (lk.skip || lk.items.length !== 1 || BASICS.test(lk.items[0]) || OPTIONAL.test(i.name))) continue;
    const rows = (lk ? rowsFor(lk.items[0]) : S.pantry.filter(x => same(x.name, i.name))).filter(x => Number(x.qty) > 0)
      .sort((a, b) => (a.expires_on || '9999').localeCompare(b.expires_on || '9999'));
    let need = i.qty * f;
    for (const it of rows) {
      if (need <= 0.0001) break;
      const nm = lk ? lk.items[0] : it.name, c = itemConvert(need, i.unit, it.unit, nm, it); if (c == null) continue;   // no size known for this package: leave it
      const take = Math.min(Number(it.qty), c); it.qty = Math.max(0, Math.round((Number(it.qty) - take) * 100) / 100); left.set(it.id, it.qty);
      need -= itemConvert(take, it.unit, i.unit, nm, it) ?? need;
    }
  }
  const now = new Date().toISOString();
  for (const [id, qty] of left) { const u = await sb.from('pantry_items').update({ qty, updated_at: now }).eq('id', id); if (u.error) throw u.error; }
  const u = await sb.from('meal_plan').update({ cooked: true }).eq('id', p.id); if (u.error) throw u.error;
  await loadAll(); render(); toast(left.size ? `Marked cooked. Used up ${left.size} pantry item${left.size > 1 ? 's' : ''}.` : 'Marked cooked.');
  if (ds.length) ratePrompt(ds[0], ds.slice(1));
}
const PACKAGE_UNITS = new Set(['', 'each', 'bag', 'box', 'can', 'jar', 'bottle', 'pack', 'package', 'carton', 'loaf', 'bunch', 'block', 'tub', 'roll', 'stick', 'dozen', 'container', 'head', 'piece']);
/** Where a bought item should land: barcode match, else the linked pantry item (exact canonical row first), else a loose name match. */
function pantryTarget(it) {
  if (it.barcode) { const b = S.pantry.find(x => x.barcode === it.barcode); if (b) return b; }
  const canon = linkOf(it.name)?.items?.[0];
  if (canon) { const k = canon.toLowerCase(); return S.pantry.find(p => p.name.toLowerCase() === k) || rowsFor(canon)[0] || null; }
  return S.pantry.find(p => p.name.toLowerCase() === String(it.name).trim().toLowerCase()) || S.pantry.find(p => same(p.name, it.name)) || null;
}
async function addToPantry(items) {
  // items: [{name, qty, unit, category, expires_on, barcode}] — tops up what's already there; new things are filed under their pantry name
  let added = 0, updated = 0;
  for (const it of items) {
    const q = Number(it.qty) || 1, unit = normUnit(it.unit || ''), p = pantryTarget(it);
    if (p) {
      const pu = normUnit(p.unit || ''), have = Number(p.qty) || 0;
      let qty, newUnit = p.unit;
      const conv = itemConvert(q, unit, pu, p.name, p);
      if (pu === unit || !unit) qty = have + q;                         // same unit: add
      else if (conv != null) qty = have + conv;                         // lb onto oz, a dozen onto eggs counted singly… (keeps par in step)
      else if (!pu && have <= 0) { qty = q; newUnit = unit; }           // no unit yet: take the receipt's
      else if (have <= 0 && !(Number(p.par) > 0)) { qty = q; newUnit = unit; } // was out: take what was bought, in its unit
      else qty = have + (PACKAGE_UNITS.has(unit) ? q : 1);              // different kinds of unit: count packages bought
      const u = await sb.from('pantry_items').update({ qty: Math.round(qty * 100) / 100, unit: newUnit || '', updated_at: new Date().toISOString(), ...(it.expires_on ? { expires_on: it.expires_on } : {}), ...(it.barcode && !p.barcode ? { barcode: it.barcode } : {}) }).eq('id', p.id); if (u.error) throw u.error; updated++;
      p.qty = qty; p.unit = newUnit;
    } else {
      const canon = linkOf(it.name)?.items?.[0], meta = canon ? itemMeta(canon) : null, name = canon || it.name.replace(/^./, c => c.toUpperCase());
      const sz = sizeOf(name), inPk = sz && ING.convert.has(sz.pkg) && (unit === sz.pkg || (ING.convert.has(unit) && toBase(1, unit, sz)));
      const row = { household_id: S.household.id, name, qty: inPk ? Math.round(q * sz.amt * 100) / 100 : q, unit: inPk ? sz.unit : unit, ...(inPk ? { pack_name: unit, pack_qty: sz.amt, pack_unit: sz.unit } : {}), category: meta?.[1] || (CATS.includes(it.category) ? it.category : 'Other'), location: meta?.[0] || locationFor(name, it.category), expires_on: it.expires_on || null, barcode: it.barcode || null, updated_at: new Date().toISOString() };
      const i2 = await sb.from('pantry_items').insert(row).select().single(); if (i2.error) throw i2.error; added++;
      S.pantry.push(i2.data || row);
    }
  }
  return { added, updated };
}
/** Bought it: take matching unchecked items (and everything already checked) off the grocery list. */
async function clearBoughtFromList(names) {
  const keys = new Set(names.map(canonKey)), hits = l => keys.has(canonKey(l.name)) || names.some(n => same(n, l.name));
  const off = [...S.list, ...(S.skips || [])].filter(l => !l.list_id && (l.checked || hits(l)));
  const tick = S.list.filter(l => l.list_id && !l.checked && hits(l));
  if (off.length) { const d = await sb.from('shopping_items').delete().in('id', off.map(x => x.id)); if (d.error) throw d.error; }
  if (tick.length) { const u = await sb.from('shopping_items').update({ checked: true }).in('id', tick.map(x => x.id)); if (u.error) throw u.error; }
  return off.filter(l => l.source !== 'skip').length + tick.length;
}
async function checkedToPantry() {
  const done = S.list.filter(l => l.checked && (l.list_id || null) === S.listId); if (!done.length) return toast('Check off items first');
  await addToPantry(done.map(l => ({ name: l.name, qty: l.qty, unit: l.unit, category: l.category })));
  const d = await sb.from('shopping_items').delete().in('id', done.map(x => x.id)); if (d.error) throw d.error;
  await loadAll(); render(); toast(`Put away ${done.length} item${done.length > 1 ? 's' : ''}`);
  if (!S.listId) receiptFlow({ spend: true, itemsOff: true });
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

// ---------- photos: free-license placeholders from Wikipedia, or your own ----------
const PH_TRIED = new Set(); let phActive = 0; const phQueue = [];
const photoQuery = t => String(t || '').replace(/\(.*?\)/g, '').replace(/^(mom'?s|grandma'?s|carolyn garrett'?s|keith'?s)\s+/i, '')
  .replace(/\b(classic|southern|homemade|easy|best|favorite|old-fashioned|sunday|stuttgart|delta|bradley county|arkansas|smoked|cajun|no-churn|ultimate|spicy|simple|quick|sweet breakfast|standard)\b/gi, '')
  .replace(/\bwith\b.*$/i, '').replace(/\s+/g, ' ').trim();
async function wikiPhoto(q) {
  const u = `https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&generator=search&gsrnamespace=0&gsrlimit=4&gsrsearch=${encodeURIComponent(q)}&prop=pageimages&piprop=thumbnail|name&pithumbsize=640`;
  const j = await fetch(u).then(r => r.json());
  const pages = Object.values(j.query?.pages || {}).sort((a, b) => a.index - b.index);
  const p = pages.find(x => x.thumbnail && !/\.svg/i.test(x.pageimage || '')); 
  return p ? { url: p.thumbnail.source, credit: 'wiki:' + p.title } : null;
}
function queuePhotos() {
  document.querySelectorAll('[data-ph]').forEach(el => {
    const key = el.dataset.ph + ':' + el.dataset.phId; if (PH_TRIED.has(key)) return; PH_TRIED.add(key); phQueue.push([el.dataset.ph, el.dataset.phId]);
  });
  pumpPhotos();
}
function pumpPhotos() {
  while (phActive < 3 && phQueue.length) {
    const [kind, id] = phQueue.shift(); phActive++;
    const rec = kind === 'r' ? S.recipes.find(x => x.id === id) : S.pantry.find(x => x.id === id);
    (async () => {
      if (!rec || rec.photo_url) return;
      const name = kind === 'r' ? rec.title : rec.name;
      let hit = null;
      try { hit = await wikiPhoto(kind === 'r' ? photoQuery(name) : name.replace(/^(sliced|shredded|frozen|ground|dried|rubbed)\s+/i, '')); } catch (_) { return; }
      rec.photo_url = hit?.url || null; rec.photo_credit = hit?.credit || 'none';
      if (hit) document.querySelectorAll(`[data-ph="${kind}"][data-ph-id="${id}"]`).forEach(el => { el.style.backgroundImage = `url('${hit.url}')`; el.classList.add('has'); });
      silentUpdate(kind === 'r' ? 'recipes' : 'pantry_items', id, { photo_url: rec.photo_url, photo_credit: rec.photo_credit });
    })().finally(() => { phActive--; pumpPhotos(); });
  }
}
let quietUntil = 0;
async function silentUpdate(table, id, row) { quietUntil = Date.now() + 2500; await sb.from(table).update(row).eq('id', id); }
async function uploadPhoto(src) {
  const b64 = src.b64 || await imageToBase64(src, 1400);
  const bin = atob(b64), arr = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  const path = `${S.household.id}/${crypto.randomUUID()}.jpg`;
  const up = await sb.storage.from('photos').upload(path, new Blob([arr], { type: 'image/jpeg' }), { contentType: 'image/jpeg', upsert: false });
  if (up.error) throw up.error;
  return sb.storage.from('photos').getPublicUrl(path).data.publicUrl;
}
function setOwnPhoto(table, rec, after) {
  captureImage('Take a photo', table === 'recipes' ? 'Show off the finished dish' : 'Fill the frame with the item', async src => {
    toast('Uploading photo…');
    try { const url = await uploadPhoto(src); rec.photo_url = url; rec.photo_credit = 'own'; const u = await sb.from(table).update({ photo_url: url, photo_credit: 'own' }).eq('id', rec.id); if (u.error) throw u.error; await loadAll(); toast('Photo saved'); after?.(); } catch (e) { fail(e); }
  });
}
const creditLine = (rec, table) => rec.photo_credit?.startsWith('wiki:') ? `<p class="imeta">Placeholder photo: <span role="link" tabindex="0" data-ext="https://en.wikipedia.org/wiki/${encodeURIComponent(rec.photo_credit.slice(5).replace(/ /g, '_'))}" style="text-decoration:underline">Wikipedia — ${esc(rec.photo_credit.slice(5))}</span> · <button class="btn sm ghost" data-ownphoto="${table}" style="min-height:30px;padding:4px 10px">Use my photo</button></p>` : '';

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
  sun: '<circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6"/>', moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>',
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M8.5 21h7"/>',
  home: '<path d="M3.5 10.5 12 3.5l8.5 7"/><path d="M5.5 9v10.5h13V9"/><path d="M10 19.5v-5h4v5"/>',
  cal: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4M8 14h3"/>', fire: '<path d="M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-3 2-4 2-7 1.5 1 2 2 2 3 0-2 0-4 1-6z"/>'
};
const svg = k => `<svg viewBox="0 0 24 24" aria-hidden="true">${I[k]}</svg>`;
const TABS = [['home', 'Home'], ['week', 'Week'], ['pantry', 'Pantry'], ['recipes', 'Recipes'], ['list', 'List'], ['family', 'Family']];

const getTheme = () => { try { return localStorage.getItem('wc_theme') || 'system'; } catch (_) { return 'system'; } };
const isDark = () => { const t = getTheme(); return t === 'dark' || (t === 'system' && matchMedia('(prefers-color-scheme: dark)').matches); };
function setTheme(t) {
  try { t === 'system' ? localStorage.removeItem('wc_theme') : localStorage.setItem('wc_theme', t); } catch (_) { }
  document.documentElement.style.colorScheme = t === 'system' ? '' : t;
  document.querySelector('meta[name=theme-color]')?.setAttribute('content', isDark() ? '#14120E' : '#1F4D38');
  render();
}
matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () => { if (getTheme() === 'system' && S.session) render(); });
function shell(inner) {
  const lowN = S.pantry.filter(p => Number(p.par) > 0 && Number(p.qty) < Number(p.par)).length;
  const listN = S.list.filter(l => !l.checked && !l.list_id).length;
  return `<header class="top"><img src="logo.svg" alt=""><div class="brand"><b>We're Cooked</b><span>${esc(S.household.name)}</span></div><button class="themebtn" data-act="theme" aria-label="Switch to ${isDark() ? 'light' : 'dark'} mode" title="Switch to ${isDark() ? 'light' : 'dark'} mode">${svg(isDark() ? 'sun' : 'moon')}</button>${av(S.me)}</header>
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
    const k = p?.kind; const ds = k === 'cook' ? dishesOf(p) : []; const r = ds[0];
    const title = p ? ((ds.length ? mealTitle(p) : '') || p.place_name || p.title || (k === 'away' ? 'No dinner at home' : KINDS[k])) : 'Nothing planned';
    const cook = p?.cook_id && memberById(p.cook_id);
    const aw = awayOn(p, d); const who = S.members.map(m => av(m, aw.includes(m.user_id))).join('');
    const work = busyOn(d).map(b => { const m = memberById(b.user_id); const home = (p?.present || []).includes(b.user_id);
      return `<span class="work${home ? ' home' : ''}">${svg('cal')}<span style="white-space:nowrap">${esc(m.display_name.split(' ')[0])} ${home ? 'home for dinner' : 'working'}</span><span class="wr"> · ${esc(shortReason(b))}</span></span>`; }).join('');
    return `<button class="card day${d === today ? ' today' : ''}" data-day="${d}" style="--k:var(--${k || 'line'})">
      <span class="dd"><span>${d === today ? 'Today' : DOW[dt.getDay()]}</span><b>${dt.getDate()}</b></span>
      <span>${p ? `<span class="kind" style="--k:var(--${k})"><i></i>${esc(KINDS[k])}${p.cooked ? ' · cooked ✓' : ''}</span>` : ''}
        <span class="dt${p ? '' : ' none'}">${r ? emojiOf(r) + ' ' : ''}${esc(title)}</span>${ds.length > 1 ? `<span class="dm" style="display:block">${esc(withLine(p))}</span>` : ''}
        ${work}
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
const LOCS = { spices: ['Spice rack', '🧂', '#8A5A2E'], fridge: ['Fridge', '🥛', '#5B8FA8'], freezer: ['Freezer', '🧊', '#7FA7BA'], pantry: ['Pantry', '🥫', '#B5793F'], baking: ['Baking shelf', '🌾', '#C9961B'], counter: ['Counter', '🧺', '#5E9E3A'], household: ['Under the sink', '🧽', '#2F6F9F'] };
const LOC_ORDER = ['fridge', 'freezer', 'pantry', 'spices', 'baking', 'counter', 'household'];
function locationFor(name, category) {
  const n = String(name || '').toLowerCase();
  if (/flour|cornmeal|sugar|baking (powder|soda)|yeast|vanilla|cocoa|chocolate chip|shortening|cornstarch|corn syrup|condensed|evaporated|pecan|sprinkles|extract/.test(n)) return 'baking';
  if (/frozen|ice cream|popsicle/.test(n)) return 'freezer';
  if (/towel|toilet|soap|detergent|bag|foil|wrap|sponge|napkin|bleach|cleaner|parchment|pods/.test(n)) return 'household';
  if (category === 'Spices' || /salt|pepper$|powder|paprika|cumin|oregano|thyme|basil|rosemary|sage|bay lea|flakes|seasoning|cinnamon|nutmeg|ginger|cloves|mustard seed|celery seed|dry mustard|old bay/.test(n)) return 'spices';
  if (category === 'Frozen') return 'freezer';
  if (category === 'Household') return 'household';
  if (category === 'Baking') return 'baking';
  if (category === 'Dairy & Eggs' || category === 'Meat & Seafood' || /milk|cheese|butter|cream|yogurt|egg|bacon|mayo|ketchup|pickle|jalape|lemon|lime|celery|carrot|lettuce|green onion|salsa|tortillas?$/.test(n)) return 'fridge';
  if (/onion|garlic|potato|tomato|banana|apple|avocado|bread|bun|roll|orange|peach/.test(n) || category === 'Produce' || category === 'Bakery') return 'counter';
  return 'pantry';
}
const ITEM_EMOJI = [[/egg/, '🥚'], [/milk|buttermilk/, '🥛'], [/butter/, '🧈'], [/cheese|velveeta/, '🧀'], [/bacon/, '🥓'], [/chicken|turkey/, '🍗'], [/beef|steak|roast/, '🥩'], [/sausage|hot dog|bologna/, '🌭'], [/catfish|fish|salmon|tuna/, '🐟'], [/shrimp|crawfish/, '🦐'],
  [/sweet potato/, '🍠'], [/potato|hash brown|fries/, '🥔'], [/onion/, '🧅'], [/garlic/, '🧄'], [/tomato|rotel/, '🍅'], [/carrot/, '🥕'], [/lettuce|celery|greens|spinach|cabbage/, '🥬'], [/lemon|lime/, '🍋'], [/banana/, '🍌'], [/apple/, '🍎'], [/peach/, '🍑'], [/avocado/, '🥑'], [/jalape|chile|chili|cayenne|pepper flake|hot sauce/, '🌶️'], [/bell pepper/, '🫑'], [/corn(?!meal|starch| syrup)/, '🌽'], [/peas/, '🫛'], [/bean/, '🫘'], [/broccoli/, '🥦'], [/pickle/, '🥒'],
  [/bread|bun|roll|tortilla/, '🍞'], [/rice/, '🍚'], [/spaghetti|macaroni|noodle|pasta/, '🍝'], [/flour|cornmeal|grits|oats/, '🌾'], [/sugar|syrup|honey/, '🍯'], [/chocolate|cocoa/, '🍫'], [/peanut/, '🥜'], [/pecan|nut/, '🌰'], [/oil/, '🫒'], [/vinegar|soy|worcestershire|sauce/, '🍶'], [/broth|soup|can|paste/, '🥫'], [/ketchup|mustard|mayo/, '🫙'], [/coffee/, '☕'], [/tea/, '🍵'], [/ice cream/, '🍨'], [/pie/, '🥧'], [/chip|cracker|panko|crumb/, '🍘'],
  [/salt|pepper|powder|paprika|cumin|oregano|thyme|basil|rosemary|sage|bay|seasoning|cinnamon|nutmeg|ginger|clove|seed|mustard/, '🧂'], [/vanilla|extract|yeast|baking/, '🧁'], [/towel|toilet|napkin|foil|wrap|parchment/, '🧻'], [/soap|detergent|pods/, '🧼'], [/sponge/, '🧽'], [/trash/, '🗑️'], [/bag/, '🛍️']];
const itemEmoji = p => (ITEM_EMOJI.find(([re]) => re.test(String(p.name || '').toLowerCase())) || [0, LOCS[p.location || 'pantry']?.[1] || '🥫'])[1];
const locOf = p => p.location || locationFor(p.name, p.category);
const isLow = p => Number(p.par) > 0 && Number(p.qty) < Number(p.par);
const photoStyle = url => url ? ` style="background-image:url('${esc(url)}')"` : '';
const needsPhoto = (x) => !x.photo_url && x.photo_credit !== 'none';
function ptile(p) {
  return `<div class="ptile${isLow(p) ? ' low' : ''}"><button class="pimg${p.photo_url ? ' has' : ''}" data-edit-pantry="${p.id}"${photoStyle(p.photo_url)} ${needsPhoto(p) ? `data-ph="p" data-ph-id="${p.id}"` : ''} aria-label="Edit ${esc(p.name)}"><span class="pe">${itemEmoji(p)}</span>${isLow(p) ? '<span class="badge">Low</span>' : ''}</button>
  <div class="pbody"><span class="iname">${esc(p.name)}</span><span class="imeta">${Number(p.par) > 0 ? `keep ${fmtQty(p.par)}` : 'no par'}${packsLabel(p) ? ' · ' + packsLabel(p) : ''}${p.expires_on && p.expires_on <= ymd(addDays(new Date(), 3)) ? ' · <b style="color:var(--flamed)">use soon</b>' : ''}</span>
  <span class="stepper sm"><button data-dq="${p.id}" data-d="${-stepOf(p)}" aria-label="Less">−</button><span>${fmtQty(p.qty)}${p.unit ? ' ' + esc(p.unit) : ''}</span><button data-dq="${p.id}" data-d="${stepOf(p)}" aria-label="More">+</button></span></div></div>`;
}
function zoneCounts() { const c = {}; for (const k of LOC_ORDER) c[k] = { n: 0, low: 0 }; for (const p of S.pantry) { const k = locOf(p); if (Number(p.qty) > 0 || Number(p.par) > 0) c[k].n++; if (isLow(p)) c[k].low++; } return c; }
function pantryView() {
  const q = S.pantryQ.toLowerCase();
  const low = S.pantry.filter(isLow).length, soon = ymd(addDays(new Date(), 3)), exp = S.pantry.filter(p => p.expires_on && p.expires_on <= soon && Number(p.qty) > 0).length;
  const onHand = S.pantry.filter(p => Number(p.qty) > 0 || Number(p.par) > 0).length;
  const head = `<h2>Pantry</h2><p class="lede">${onHand} on hand · ${S.pantry.length - onHand} tracked for recipes${low ? ` · ${low} below par (on your list)` : ''}${exp ? ` · ${exp} to use soon` : ''}</p>
  <div class="switch" role="group" aria-label="Show"><button data-pview="kitchen" aria-pressed="${S.pview !== 'staples'}">🏠 Kitchen</button><button data-pview="staples" aria-pressed="${S.pview === 'staples'}">📋 Staples & pars</button></div>`;
  if (S.pview === 'staples') return head + staplesView();
  if (S.zone) {
    const items = S.pantry.filter(p => locOf(p) === S.zone).sort((a, b) => isLow(b) - isLow(a) || a.name.localeCompare(b.name));
    const L = LOCS[S.zone];
    return head + `<div class="row" style="margin-bottom:12px"><button class="btn sm ghost" data-zone-go="">‹ Kitchen</button><h2 class="sp" style="margin:0;font-size:22px">${L[1]} ${L[0]}</h2><button class="btn sm" data-act="addpantry" aria-label="Add item">${svg('plus')}</button></div>
    ${(() => { const on = items.filter(p => Number(p.qty) > 0 || Number(p.par) > 0), off = items.filter(p => !(Number(p.qty) > 0 || Number(p.par) > 0));
      return (on.length ? `<div class="pgrid">${on.map(ptile).join('')}</div>` : `<div class="empty"><span class="e">${L[1]}</span>Nothing in the ${L[0].toLowerCase()} right now. Tap + to add something, or set up your staples.</div>`)
        + (off.length ? `<details class="offstock"><summary>Not in stock · ${off.length} used by your recipes</summary><p class="imeta">Every recipe ingredient is linked to one of these. Tap one to set how much you have.</p><div class="pgrid">${off.map(ptile).join('')}</div></details>` : ''); })()}`;
  }
  const hits = q ? S.pantry.filter(p => p.name.toLowerCase().includes(q)) : [];
  const zc = zoneCounts(), extraSpots = LOC_ORDER.filter(k => k.startsWith('c:'));
  return head + `<div class="kwrap">${window.kitchenSVG(zc)}</div><p class="imeta" style="text-align:center;margin:-2px 0 10px">Tap any spot in the kitchen to see what's there</p>
  <div class="spots">${extraSpots.map(k => `<button class="spot" data-zone="${esc(k)}"><span>${esc(LOCS[k][1])}</span><b>${esc(LOCS[k][0])}</b><i>${zc[k]?.n || 0}</i></button>`).join('')}<button class="spot add" data-act="newspot"><span>＋</span><b>Add a spot</b></button></div>
  <div class="tools">
    <button class="tool" data-act="scanbarcode"><span class="ico">${svg('scan')}</span>Scan barcode</button>
    <button class="tool f" data-act="snappantry"><span class="ico">${svg('camera')}</span>Snap shelves</button>
    <button class="tool" data-act="snapreceipt"><span class="ico">${svg('receipt')}</span>Scan receipt</button>
  </div>
  <div class="row" style="margin-bottom:14px;flex-wrap:nowrap"><div class="search sp" style="margin:0">${svg('search')}<input type="search" id="psearch" placeholder="Find something in the kitchen" value="${esc(S.pantryQ)}" aria-label="Search the pantry"></div><button class="btn" data-act="addpantry" aria-label="Add item">${svg('plus')}</button></div>
  ${q ? (hits.length ? `<div class="pgrid">${hits.map(ptile).join('')}</div>` : '<p class="empty">Nothing matches.</p>') : ''}
  ${!S.pantry.some(p => Number(p.par) > 0) ? `<div class="banner"><span class="em">📋</span><span class="sp"><b>Stock the kitchen in one tap</b><p>Add ${STAPLE_COUNT} standard household staples with pars, sorted into the fridge, freezer, pantry, spice rack and more.</p></span><button class="btn sm" data-act="staples">Add</button></div>` : ''}`;
}
const STAPLE_COUNT = 139;
function staplesView() {
  const staples = S.pantry.filter(p => Number(p.par) > 0);
  const groups = LOC_ORDER.map(k => [k, staples.filter(p => locOf(p) === k).sort((a, b) => a.name.localeCompare(b.name))]).filter(g => g[1].length);
  const low = staples.filter(isLow);
  return `<p class="lede" style="margin-top:-4px">Staples are things you always keep. When one drops below its par, it goes straight onto the shopping list — and comes off when you restock.</p>
  ${staples.length < 40 ? `<div class="banner"><span class="em">🧺</span><span class="sp"><b>Standard household staples</b><p>${STAPLE_COUNT} everyday items with sensible pars. They start as "in stock" — tap − on anything you're out of.</p></span><button class="btn sm" data-act="staples">Add</button></div>` : ''}
  <div class="row" style="margin-bottom:6px"><span class="imeta sp">${staples.length} staples · ${low.length} below par</span><button class="btn sm ghost" data-act="addstaple">+ Add a staple</button></div>
  ${groups.map(([k, items]) => `<h3>${LOCS[k][1]} ${LOCS[k][0]} · ${items.length}</h3><div class="card">${items.map(p => `<div class="srow${isLow(p) ? ' low' : ''}"><button class="thumb${p.photo_url ? ' has' : ''}" data-edit-pantry="${p.id}"${photoStyle(p.photo_url)} ${needsPhoto(p) ? `data-ph="p" data-ph-id="${p.id}"` : ''} aria-label="Edit ${esc(p.name)}"><span>${itemEmoji(p)}</span></button>
    <button style="all:unset;cursor:pointer;min-width:0" data-edit-pantry="${p.id}"><span class="iname">${esc(p.name)}</span><span class="imeta" style="display:block">${isLow(p) ? '<b style="color:var(--flamed)">On the list</b> · ' : ''}keep ${fmtQty(p.par)}${p.unit ? ' ' + esc(p.unit) : ''}</span></button>
    <span class="stepper sm"><button data-dq="${p.id}" data-d="${-stepOf(p)}" aria-label="Less">−</button><span>${fmtQty(p.qty)}${p.unit ? ' ' + esc(p.unit) : ''}</span><button data-dq="${p.id}" data-d="${stepOf(p)}" aria-label="More">+</button></span></div>`).join('')}</div>`).join('')}`;
}
async function addStaples(btn) {
  if (btn) { btn.disabled = true; btn.textContent = 'Adding…'; }
  try {
    const list = await fetch('staples.json').then(r => r.json());
    const rows = list.filter(s => !S.pantry.some(p => same(p.name, s.name))).map(s => ({ household_id: S.household.id, name: s.name, qty: s.par, par: s.par, unit: s.unit, category: s.category, location: s.location }));
    for (let i = 0; i < rows.length; i += 60) { const r = await sb.from('pantry_items').insert(rows.slice(i, i + 60)); if (r.error) throw r.error; }
    await loadAll(); S.pview = 'staples'; render(); toast(`Added ${rows.length} staples`);
  } catch (e) { if (btn) { btn.disabled = false; btn.textContent = 'Try again'; } fail(e); }
}

// ---------- cookbooks ----------
function rcard(r) {
  const m = isMeal(r) ? recipeMatch(r) : { total: 0 };
  return `<button class="rcard" data-recipe="${r.id}" style="--c:${colorOf(r)}"><span class="art${r.photo_url ? ' has' : ''}"${photoStyle(r.photo_url)} ${needsPhoto(r) ? `data-ph="r" data-ph-id="${r.id}"` : ''}><span class="e">${emojiOf(r)}</span>${r.favorite ? '<span class="fav">★</span>' : ''}</span>
  <span class="body"><span class="eye">${esc(RCATS[catOf(r)]?.[0] || '')}</span><span class="t">${esc(r.title)}</span><span class="m">${isTodo(r) ? '<span class="todo">Needs recipe</span>' : ''}${r.time_min ? `<span>${fmtTime(r.time_min)}</span>` : ''}${r.rating ? `<span class="stars">${'★'.repeat(r.rating)}</span>` : ''}${m.total ? `<span class="match${m.have === m.total ? ' all' : ''}">${m.have}/${m.total} at home</span>` : ''}</span></span></button>`;
}
const hashStr = t => { let h = 2166136261; for (const ch of String(t)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
function bookCover(b, n, i) {
  const h = hashStr(b.name + (b.id || 'all')), all = i < 0;
  const variant = all ? 'v-all' : ['v-bands', 'v-frame', 'v-spine', 'v-mono'][h % 4];
  const ht = all ? 168 : 150 + (h % 5) * 6, wd = all ? 120 : 108 + ((h >> 3) % 4) * 6;
  const words = b.name.trim().split(/\s+/), mono = (words[0]?.[0] || '') + (words[1]?.[0] || '');
  return `<button class="book ${variant}" style="--c:${esc(b.color || '#2F5D47')};--h:${ht}px;--w:${wd}px" data-book="${b.id}" aria-pressed="${all ? !S.book : S.book === b.id}" aria-label="${esc(b.name)}, ${n} recipes">
    <span class="cover"><span class="foil-top"></span>
      <span class="kick">${all ? 'The Complete' : i < ROMAN.length ? 'Vol. ' + ROMAN[i] : 'Vol. ' + (i + 1)}</span>
      ${variant === 'v-mono' ? `<span class="mono">${esc(mono.toUpperCase())}</span>` : ''}
      <b class="ttl">${esc(b.name)}</b>
      <span class="orn" aria-hidden="true"></span>
      <span class="bcnt">${n} recipe${n === 1 ? '' : 's'}</span>
      <span class="foil-bot"></span></span></button>`;
}
// ---------- CSV import: cookbooks and their recipes ----------
function parseCSV(text) {
  text = String(text || '').replace(/^﻿/, '');
  const first = text.split(/\r?\n/)[0] || '', delim = (first.match(/\t/g) || []).length > (first.match(/,/g) || []).length ? '\t' : (first.match(/;/g) || []).length > (first.match(/,/g) || []).length ? ';' : ',';
  const rows = []; let row = [], cell = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) { if (ch === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += ch; continue; }
    if (ch === '"' && cell === '') { q = true; continue; }
    if (ch === delim) { row.push(cell); cell = ''; continue; }
    if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i++; row.push(cell); cell = ''; if (row.some(c => c.trim())) rows.push(row); row = []; continue; }
    cell += ch;
  }
  row.push(cell); if (row.some(c => c.trim())) rows.push(row);
  return rows;
}
const CSV_COLS = { book: /^(cook ?book|book|collection|cookbooks|books)$/, title: /^(title|recipe|name|recipe name|dish)$/, servings: /^(servings|serves|yield)$/, time: /^(time|minutes|mins|total time|time \(min\)|cook time)$/,
  category: /^(category|type of dish|course|dish type)$/, kind: /^(kind|section|meal or sauce)$/, ingredients: /^(ingredients?)$/, steps: /^(steps|instructions|directions|method)$/, notes: /^(notes?|description)$/,
  tags: /^(tags?|keywords)$/, url: /^(url|source|source url|link)$/, emoji: /^(emoji|icon)$/, color: /^(colou?r)$/ };
const splitList = v => String(v || '').split(/\r?\n|\s*\|\s*/).map(x => x.trim()).filter(Boolean);
const catFrom = v => { const t = String(v || '').trim().toLowerCase(); if (!t) return ''; const hit = Object.entries(RCATS).find(([k, [label]]) => k === t || label.toLowerCase() === t || label.toLowerCase().startsWith(t) || t.startsWith(k)); return hit ? hit[0] : ''; };
function readCookbookCSV(text) {
  const rows = parseCSV(text); if (!rows.length) throw new Error('That file is empty.');
  const head = rows[0].map(h => h.trim().toLowerCase()), col = {};
  for (const [k, rx] of Object.entries(CSV_COLS)) { const i = head.findIndex(h => rx.test(h)); if (i >= 0) col[k] = i; }
  if (col.book == null && col.title == null) throw new Error('Add a header row with at least a "Cookbook" or "Title" column.');
  const get = (r, k) => col[k] == null ? '' : String(r[col[k]] ?? '').trim();
  const books = new Map(), recipes = [];
  for (const r of rows.slice(1)) {
    const bnames = col.book != null ? get(r, 'book').split(/\s*[|;]\s*/).map(x => x.trim()).filter(Boolean) : [];
    for (const b of bnames) if (!books.has(b.toLowerCase())) books.set(b.toLowerCase(), { name: b, emoji: get(r, 'emoji') || '📖', color: /^#[0-9a-f]{6}$/i.test(get(r, 'color')) ? get(r, 'color') : '' });
    const title = get(r, 'title'); if (!title) continue;
    const kindRaw = get(r, 'kind').toLowerCase(), category = catFrom(get(r, 'category'));
    recipes.push({ title, books: bnames, servings: Math.min(50, Math.max(1, parseInt(get(r, 'servings')) || 4)), time_min: Math.min(1440, parseInt(get(r, 'time')) || 0) || null, category,
      kind: /sauce|condiment|staple|component|seasoning/.test(kindRaw) || ['sauce', 'seasoning', 'dressing', 'condiment'].includes(category) ? 'component' : 'meal',
      ingredients: splitList(get(r, 'ingredients')).map(parseIng).filter(Boolean), steps: splitList(get(r, 'steps')).map(x => x.replace(/^\s*\d+[.)]\s*/, '')), notes: get(r, 'notes') || null,
      tags: get(r, 'tags').split(/\s*[,;]\s*/).filter(Boolean), source_url: /^https?:\/\//i.test(get(r, 'url')) ? get(r, 'url') : null });
  }
  return { books: [...books.values()], recipes };
}
const CSV_TEMPLATE = 'Cookbook,Title,Servings,Minutes,Category,Ingredients,Steps,Notes,Tags\n"Sunday Suppers","Smothered Pork Chops",4,60,Main dish,"4 bone-in pork chops\n1 cup all-purpose flour\n2 cup chicken broth\n1 onion, sliced","Season and dredge the chops.\nBrown in a skillet.\nMake the gravy and simmer the chops until tender.","Grandma\'s way","dinner, comfort"\n"Sunday Suppers","Buttermilk Biscuits",8,25,Bread,"2 cup self-rising flour | 1/2 cup cold butter | 3/4 cup buttermilk","Cut butter into flour. | Stir in buttermilk. | Bake at 450°F for 12 minutes.",,"breakfast"\n"Game Day",,,,,,,,\n';
function importCSVSheet() {
  let parsed = null;
  const draw = () => {
    if (!parsed) return `<h2>Import cookbooks</h2><p class="lede">Upload a CSV (from Excel, Google Sheets or Numbers) to add cookbooks and their recipes in one go.</p>
      <div class="card flat" style="font-size:13.5px;line-height:1.5"><b>Columns we read</b> (header row required, any order):<br><b>Cookbook</b>, <b>Title</b>, Servings, Minutes, Category, Ingredients, Steps, Notes, Tags, URL<br>
      <span class="imeta">One recipe per row. Put each ingredient or step on its own line in the cell, or separate them with “|”. A row with only a Cookbook name creates an empty book. List several books with “|”.</span></div>
      <input type="file" id="csvf" accept=".csv,.tsv,.txt,text/csv,text/plain" hidden>
      <div class="row" style="gap:8px;margin-top:14px"><button class="btn" id="csvpick">${svg('plus')} Choose CSV file</button><a class="btn ghost" id="csvtpl" download="werecooked-cookbooks-template.csv" href="data:text/csv;charset=utf-8,${encodeURIComponent(CSV_TEMPLATE)}">Download template</a></div>
      <p class="err" id="csverr"></p>`;
    const existingB = new Set(S.books.map(b => b.name.toLowerCase())), existingR = new Set(S.recipes.map(r => r.title.toLowerCase()));
    const newB = parsed.books.filter(b => !existingB.has(b.name.toLowerCase())), dupR = parsed.recipes.filter(r => existingR.has(r.title.toLowerCase())), newR = parsed.recipes.filter(r => !existingR.has(r.title.toLowerCase()));
    return `<h2>Ready to import</h2><p class="lede">${newB.length} new cookbook${newB.length === 1 ? '' : 's'} · ${newR.length} new recipe${newR.length === 1 ? '' : 's'}${dupR.length ? ` · ${dupR.length} already in your recipes (skipped)` : ''}</p>
      ${parsed.books.length ? `<div class="chips">${parsed.books.map(b => `<span class="chip" aria-pressed="${!existingB.has(b.name.toLowerCase())}">${esc(b.name)} · ${parsed.recipes.filter(r => r.books.some(x => x.toLowerCase() === b.name.toLowerCase())).length}</span>`).join('')}</div>` : ''}
      <div class="card flat" style="max-height:38vh;overflow:auto;padding:4px 14px;margin-top:10px">${newR.slice(0, 200).map(r => `<div class="item" style="padding:9px 0;border-bottom:1px solid var(--line)"><span class="iname">${esc(r.title)}</span><span class="imeta" style="display:block">${[r.books.join(', '), r.ingredients.length ? `${r.ingredients.length} ingredients` : 'no ingredients', r.steps.length ? `${r.steps.length} steps` : ''].filter(Boolean).map(esc).join(' · ')}</span></div>`).join('') || '<p class="imeta">No new recipes, just cookbooks.</p>'}</div>
      <div class="row" style="margin-top:16px"><button class="btn" id="csvgo" ${newB.length + newR.length ? '' : 'disabled'}>Import</button><button class="btn ghost" id="csvback">Choose a different file</button></div>`;
  };
  sheet(draw(), (el, close) => {
    const box = el.querySelector('[role=dialog]'); const redraw = () => { box.innerHTML = draw(); };
    el.addEventListener('click', async e => {
      if (e.target.closest('#csvpick')) return el.querySelector('#csvf').click();
      if (e.target.closest('#csvback')) { parsed = null; return redraw(); }
      const go = e.target.closest('#csvgo'); if (!go) return;
      go.disabled = true; go.textContent = 'Importing…';
      try {
        const existing = new Map(S.books.map(b => [b.name.toLowerCase(), b]));
        const add = parsed.books.filter(b => !existing.has(b.name.toLowerCase())).map((b, i) => ({ household_id: S.household.id, name: b.name.slice(0, 60), emoji: b.emoji, color: b.color || BOOK_COLORS[(S.books.length + i) % BOOK_COLORS.length], sort: S.books.length + i }));
        if (add.length) { const r = await sb.from('recipe_books').insert(add); if (r.error) throw r.error; }
        const bk = await sb.from('recipe_books').select('*').eq('household_id', S.household.id).order('sort'); if (bk.error) throw bk.error; S.books = bk.data;
        const idOf = n => S.books.find(b => b.name.toLowerCase() === n.toLowerCase())?.id;
        const have = new Set(S.recipes.map(r => r.title.toLowerCase()));
        const rows = parsed.recipes.filter(r => !have.has(r.title.toLowerCase())).map(r => ({ household_id: S.household.id, title: r.title.slice(0, 120), servings: r.servings, time_min: r.time_min, category: r.category || null, kind: r.kind,
          ingredients: relink(r.ingredients), steps: r.steps, notes: r.notes, tags: r.tags, source_url: r.source_url, books: r.books.map(idOf).filter(Boolean), created_by: S.session.user.id, found_in: 'CSV import' }));
        for (let k = 0; k < rows.length; k += 50) { const r = await sb.from('recipes').insert(rows.slice(k, k + 50)); if (r.error) throw r.error; }
        await loadAll(); close(); toast(`Imported ${add.length} cookbook${add.length === 1 ? '' : 's'} and ${rows.length} recipe${rows.length === 1 ? '' : 's'}`);
      } catch (er) { go.disabled = false; go.textContent = 'Import'; fail(er); }
    });
    el.addEventListener('change', async e => {
      if (e.target.id !== 'csvf' || !e.target.files?.[0]) return;
      try { parsed = readCookbookCSV(await e.target.files[0].text()); if (!parsed.books.length && !parsed.recipes.length) throw new Error('No cookbooks or recipes found in that file.'); redraw(); }
      catch (er) { const m = el.querySelector('#csverr'); if (m) m.textContent = er.message; }
    });
  });
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
  <div class="shelfwrap"><div class="shelf" role="group" aria-label="Cookbooks">
    ${bookCover({ id: '', name: 'All Recipes', color: '#2B2723' }, pool.length, -1)}
    ${S.books.map((b, i) => bookCover(b, counts(b.id), i)).join('')}
    <button class="book add" data-act="newbook" aria-label="New cookbook"><span class="cover"><span class="plus">＋</span><span class="bcnt">New book</span></span></button>
    <button class="book add" data-act="importcsv" aria-label="Import cookbooks from a CSV file"><span class="cover"><span class="plus">⇪</span><span class="bcnt">Import CSV</span></span></button>
  </div></div>
  ${S.book ? `<div class="row" style="margin:-4px 0 12px"><span class="imeta sp">${esc(bookById(S.book)?.name || '')}</span><button class="btn sm ghost" data-act="editbook">Edit book</button></div>` : ''}
  <div class="search">${svg('search')}<input type="search" id="rq" placeholder="Search recipes, tags or ingredients" value="${esc(S.recipeQ)}" aria-label="Search recipes"></div>
  ${ide.length ? `<h3>Cook tonight with what you have</h3><div class="rgrid">${ide.map(x => rcard(x.r)).join('')}</div>` : ''}
  ${S.rview === 'meal' && !S.book && !q ? `<button class="btn flame wide" style="margin-top:14px" data-act="chef">${svg('spark')} Ask the chef what to make</button>` : ''}
  ${list.length ? order.filter(c => groups[c]).map(c => `<h3>${RCATS[c][0]}${RCATS[c][0].endsWith('s') ? '' : 's'} · ${groups[c].length}</h3><div class="rgrid">${groups[c].map(rcard).join('')}</div>`).join('')
    : `<div class="empty"><span class="e">${S.rview === 'meal' ? '🍽' : '🫙'}</span>${q ? 'No recipes match that search.' : S.book ? 'This book is empty. Open a recipe and tap the book to add it here.' : 'No recipes here yet. Tap Add to type one in, snap a recipe card, or save one from a website.'}</div>`}`;
}

// ---------- list ----------
const LIST_PRESETS = [['🦃', 'Thanksgiving'], ['🎄', 'Christmas'], ['🎉', 'Party'], ['🎁', 'Gifts'], ['🏖️', 'Trip'], ['📦', 'Bulk run'], ['🧹', 'Household']];
const LIST_EMOJI = ['🛍️', '🦃', '🎄', '🎉', '🎁', '🏖️', '📦', '🧹', '🎂', '🍖', '🥂', '🏈', '🐣', '🎃', '🧺', '🛠️'];
const curList = () => S.lists.find(x => x.id === S.listId) || null;
const itemsOn = id => S.list.filter(l => (l.list_id || null) === (id || null));
function listView() {
  const L = curList(), items = itemsOn(S.listId);
  const open = items.filter(l => !l.checked), done = items.filter(l => l.checked);
  const groups = CATS.map(c => [c, open.filter(l => (CATS.includes(l.category) ? l.category : 'Other') === c)]).filter(g => g[1].length);
  const row = l => `<div class="chk${l.checked ? ' done' : ''}"><input type="checkbox" data-check="${l.id}" ${l.checked ? 'checked' : ''} aria-label="Got ${esc(l.name)}"><span><span class="iname">${esc(l.name)}</span><span class="imeta" style="display:block">${[l.qty ? fmtQty(l.qty) + ' ' + l.unit : '', l.source === 'plan' ? 'for this week' : l.source === 'par' ? 'below par' : '', !l.checked && l.source !== 'par' && stockOf(linkOf(l.name)?.items?.[0] || l.name, l.unit, rowsFor(linkOf(l.name)?.items?.[0] || l.name).length ? null : S.pantry.filter(p => same(p.name, l.name))).any ? 'some at home' : ''].filter(Boolean).map(esc).join(' · ')}</span></span><button class="del" data-delitem="${l.id}" aria-label="Remove ${esc(l.name)}">×</button></div>`;
  const tabs = `<div class="ltabs" role="tablist" aria-label="Shopping lists"><button class="lt" role="tab" data-lst="" aria-selected="${!L}">🛒 Groceries${itemsOn(null).filter(l => !l.checked).length ? ` <b>${itemsOn(null).filter(l => !l.checked).length}</b>` : ''}</button>${S.lists.map(x => { const n = itemsOn(x.id).filter(l => !l.checked).length;
    return `<button class="lt" role="tab" data-lst="${x.id}" aria-selected="${L?.id === x.id}">${esc(x.emoji)} ${esc(x.name)}${n ? ` <b>${n}</b>` : ''}</button>`; }).join('')}<button class="lt add" data-act="newlist">＋ New list</button></div>`;
  const due = L?.due ? (() => { const n = Math.round((parseYmd(L.due) - parseYmd(ymd(new Date()))) / 864e5); return n < 0 ? 'Date passed' : n === 0 ? 'Today' : n === 1 ? 'Tomorrow' : `In ${n} days · ${parseYmd(L.due).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}`; })() : '';
  const head = L ? `<div class="lhero"><span class="le">${esc(L.emoji)}</span><span class="sp"><h2>${esc(L.name)}</h2><p>${[due, `${open.length} to get`, done.length ? `${done.length} got` : ''].filter(Boolean).join(' · ')}</p></span><button class="ib" data-act="editlist" aria-label="Edit list">${svg('pen')}</button></div>`
    : `<div class="row"><h2 class="sp">Groceries</h2><button class="btn sm ghost" data-act="buildlist">Rebuild</button></div><p class="lede">${open.length} to get${done.length ? ` · ${done.length} in the cart` : ''} · this week's meals and anything below par land here</p>`;
  const empty = L ? `<div class="empty"><span class="e">${esc(L.emoji)}</span>Nothing on this list yet. Add things as you think of them — it's yours to keep running until ${L.due ? 'the day' : 'you clear it'}.</div>`
    : `<div class="empty"><span class="e">🛒</span>The list is empty. Tap Rebuild to add what this week's meals need and anything below par.</div>`;
  return `${tabs}${head}
  <form id="addlist" class="row" style="flex-wrap:nowrap;margin-bottom:6px"><input type="text" id="li" placeholder="${L ? 'Add anything: turkey, napkins, folding chairs…' : 'Add an item, e.g. 2 lb chicken thighs'}" aria-label="Add item" autocomplete="off"><button class="btn" type="submit" aria-label="Add">${svg('plus')}</button></form>
  ${L ? `<button class="btn sm ghost" data-act="listrecipes" style="margin:4px 0 6px">${svg('recipes')} Add what recipes need</button>` : ''}
  ${open.length ? groups.map(([c, its]) => `<h3>${esc(c)}</h3><div class="card">${its.map(row).join('')}</div>`).join('') : empty}
  ${done.length ? `<h3>${L ? 'Got it' : 'In the cart'}</h3><div class="card">${done.map(row).join('')}</div><div class="row" style="gap:8px"><button class="btn sp" data-act="putaway">Put checked in the pantry</button>${L ? '<button class="btn ghost" data-act="clearchecked">Clear checked</button>' : ''}</div>` : ''}
  ${L ? '' : '<button class="btn line wide" style="margin-top:10px" data-act="logspend">Log a grocery trip</button>'}`;
}
function listEditor(id, opts = {}) {
  const L = S.lists.find(x => x.id === id) || { name: '', emoji: '🛍️', due: '' };
  let emoji = L.emoji, sure = false;
  sheet(`<h2>${id ? 'Edit list' : 'New list'}</h2><p class="lede">${id ? '' : 'A running list for a holiday, a party, a trip — anything that isn’t this week’s groceries.'}</p>
    ${id ? '' : `<div class="chips">${LIST_PRESETS.map(([e, n]) => `<button type="button" class="chip" data-preset="${esc(e)}|${esc(n)}">${e} ${esc(n)}</button>`).join('')}</div>`}
    <form id="lf"><label for="lname">Name</label><input type="text" id="lname" value="${esc(L.name)}" required maxlength="60" placeholder="Thanksgiving">
    <label>Icon</label><div class="emo">${LIST_EMOJI.map(e => `<button type="button" data-emo="${e}" aria-pressed="${e === emoji}">${e}</button>`).join('')}</div>
    <label for="ldue">Date (optional)</label><input type="date" id="ldue" value="${esc(L.due || '')}">
    <p class="imeta" style="margin:4px 0 0">Lists with a date show up under Coming up on Home.</p>
    <div class="row" style="margin-top:18px"><button class="btn" type="submit">${id ? 'Save' : 'Create list'}</button><button class="btn ghost" type="button" data-close>Cancel</button><span class="sp"></span>${id ? '<button class="btn line sm" type="button" id="ldel">Delete list</button>' : ''}</div></form>`, (el, close) => {
    const pickEmo = e => { emoji = e; el.querySelectorAll('[data-emo]').forEach(b => b.setAttribute('aria-pressed', b.dataset.emo === e)); };
    el.querySelectorAll('[data-emo]').forEach(b => b.onclick = () => pickEmo(b.dataset.emo));
    el.querySelectorAll('[data-preset]').forEach(b => b.onclick = () => { const [e, n] = b.dataset.preset.split('|'); el.querySelector('#lname').value = n; if (!LIST_EMOJI.includes(e)) LIST_EMOJI.push(e); pickEmo(e);
      if (n === 'Thanksgiving' || n === 'Christmas') { const y = new Date().getFullYear(); const d = n === 'Christmas' ? new Date(y, 11, 25) : (() => { const f = new Date(y, 10, 1); return new Date(y, 10, 1 + ((4 - f.getDay() + 7) % 7) + 21); })(); if (d >= new Date(new Date().toDateString())) el.querySelector('#ldue').value = ymd(d); } });
    el.querySelector('#lf').onsubmit = async e => { e.preventDefault();
      const row = { household_id: S.household.id, name: el.querySelector('#lname').value.trim(), emoji, due: el.querySelector('#ldue').value || null };
      const r = id ? await sb.from('shopping_lists').update(row).eq('id', id).select().single() : await sb.from('shopping_lists').insert(row).select().single();
      if (r.error) return fail(r.error); if (opts.onSaved) { await loadAll(); el.remove(); toast(`${row.emoji} ${row.name} list created`); return opts.onSaved(r.data.id); } S.listId = r.data?.id || id; S.tab = 'list'; await loadAll(); close(); toast(id ? 'List saved' : `${row.emoji} ${row.name} list created`); };
    el.querySelector('#ldel')?.addEventListener('click', async e => { if (!sure) { sure = true; e.target.textContent = 'Tap again to delete'; return; }
      const r = await sb.from('shopping_lists').delete().eq('id', id); if (r.error) return fail(r.error); S.listId = null; await loadAll(); close(); toast('List deleted'); });
  });
}
/** Ask which list (when there's more than Groceries), then run cb(listId|null). */
function chooseList(title, cb) {
  sheet(`<h2>${esc(title)}</h2><p class="lede">Which list?</p><div class="card flat" style="padding:4px 14px">${[{ id: '', emoji: '🛒', name: 'Groceries' }, ...S.lists].map(x => `<button class="item" data-pick-list="${x.id}" style="all:unset;display:flex;gap:12px;align-items:center;width:100%;padding:13px 0;border-bottom:1px solid var(--line);cursor:pointer"><span style="font-size:22px">${esc(x.emoji)}</span><span class="iname sp">${esc(x.name)}</span><span class="imeta">${itemsOn(x.id || null).filter(l => !l.checked).length} items ›</span></button>`).join('')}<button class="item" data-newlist="1" style="all:unset;display:flex;gap:12px;align-items:center;width:100%;padding:13px 0;cursor:pointer;color:var(--greend)"><span style="font-size:22px">＋</span><span class="iname sp" style="color:var(--greend)">New list</span></button></div>`,
    (el, close) => el.addEventListener('click', e => { if (e.target.closest('[data-newlist]')) { el.remove(); return listEditor(null, { onSaved: id => cb(id) }); } const b = e.target.closest('[data-pick-list]'); if (!b) return; el.remove(); cb(b.dataset.pickList || null); }));
}
async function addBuys(listId, buys) {
  const on = itemsOn(listId).filter(l => !l.checked);
  const add = buys.filter(b => !on.some(l => l.name.toLowerCase() === b.name.toLowerCase() || same(l.name, b.name)));
  if (!add.length) return toast(buys.length ? 'Already on the list' : 'Nothing missing — you have it all');
  const u = await sb.from('shopping_items').insert(add.map(b => ({ household_id: S.household.id, list_id: listId, name: b.name, qty: b.qty ? roundBuy(b.qty, b.unit) : null, unit: b.unit || '', category: b.category || 'Other', source: 'manual', added_by: S.session.user.id })));
  if (u.error) return fail(u.error);
  await loadAll(); if (!$('.sheet')) render(); toast(`Added ${add.length} to ${listId ? S.lists.find(x => x.id === listId)?.name : 'Groceries'}`);
}
// ---------- family ----------
function familyView() {
  return `<h2>${esc(S.household.name)}</h2><p class="lede">${S.members.length} ${S.members.length === 1 ? 'member' : 'members'}</p>
  <div class="card"><div class="imeta">Invite code — family members sign in, then enter this code to join</div><div class="row" style="margin-top:8px"><span class="code">${esc(S.household.invite_code)}</span><span class="sp"></span><button class="btn sm ghost" data-act="copycode">Copy invite</button></div></div>
  <h3>Members</h3><div class="card">${S.members.map(m => `<div class="item"><span class="row" style="flex-wrap:nowrap">${av(m)}<span><span class="iname">${esc(m.display_name)}${m.user_id === S.session.user.id ? ' (you)' : ''}</span><span class="imeta" style="display:block">${m.role === 'owner' ? 'Owner' : 'Member'}${m.dislikes ? ' · Avoids: ' + esc(m.dislikes) : ''}</span></span></span></div>`).join('')}</div>
  <h3>Appearance</h3><div class="card"><div class="seg" role="group" aria-label="Appearance">${[['system', 'Match phone'], ['light', '☀️ Light'], ['dark', '🌙 Dark']].map(([k, l]) => `<button type="button" data-act="themeset" data-theme-set="${k}" aria-pressed="${getTheme() === k}">${l}</button>`).join('')}</div></div>
  ${calendarSection()}
  <h3>Home area</h3><div class="card"><div class="imeta">Used to find nearby restaurants when phone location is off</div>
  <div class="row" style="margin-top:6px"><span class="iname sp">${esc(S.household.home_label || 'Not set')}</span><button class="btn sm ghost" data-act="sethome">${S.household.home_label ? 'Change' : 'Set home area'}</button></div></div>
  <h3>Your profile</h3>
  <form id="profile" class="card"><label for="pn" style="margin-top:0">Your name</label><input type="text" id="pn" value="${esc(S.me.display_name)}" maxlength="40">
  <label for="pd">Foods you avoid or dislike</label><input type="text" id="pd" value="${esc(S.me.dislikes || '')}" placeholder="e.g. mushrooms, shellfish allergy">
  <label>Your color</label><div class="chips">${['#2E6B4E', '#D24F14', '#2F6F9F', '#8B5BD6', '#C9961B', '#8A2A2A', '#5E9E3A', '#3D3A36'].map(c => `<button type="button" class="chip" data-color="${c}" aria-pressed="${S.me.color === c}" style="background:${c};border-color:${c};width:36px;height:36px;padding:0" aria-label="Color ${c}"></button>`).join('')}</div>
  <button class="btn" style="margin-top:14px" type="submit">Save profile</button></form>
  <p class="imeta">Signed in as ${esc(S.session.user.email)} · <a href="privacy.html" target="_blank">Privacy</a> · <a href="terms.html" target="_blank">Terms</a></p>
  <button class="btn line" data-act="signout">Sign out</button>`;
}

const fmtDay = d => { const t = parseYmd(d), today = ymd(new Date()); return d === today ? 'Tonight' : d === ymd(addDays(new Date(), 1)) ? 'Tomorrow' : t.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }); };
const ago = t => { const m = Math.round((Date.now() - new Date(t)) / 60000); return m < 2 ? 'just now' : m < 60 ? `${m} min ago` : m < 1440 ? `${Math.round(m / 60)} hr ago` : `${Math.round(m / 1440)} days ago`; };
function calendarSection() {
  const L = S.calLink, today = ymd(new Date());
  const up = S.busy.filter(b => b.day >= today && memberById(b.user_id)).slice(0, 10);
  const nights = up.length ? `<div class="card">${up.map(b => { const m = memberById(b.user_id); return `<div class="item"><span class="row" style="flex-wrap:nowrap">${av(m, true)}<span><span class="iname">${fmtDay(b.day)} · ${esc(m.display_name)} working</span><span class="imeta" style="display:block">${esc(shortReason(b))}</span></span></span></div>`; }).join('')}</div>` : '';
  if (!L) return `<h3>Work schedule</h3><div class="card calcard"><div class="row" style="flex-wrap:nowrap;align-items:flex-start;gap:12px"><span class="calicon">${svg('cal')}</span><span><span class="iname">Sync your work calendar</span>
    <span class="imeta" style="display:block;margin-top:2px">We're Cooked reads your Google Calendar and marks the nights you're working as away, so dinner gets planned for whoever's home. Read-only. Nothing on your calendar is changed.</span></span></div>
    <button class="btn wide" style="margin-top:12px" data-act="calconnect">${GOOGLE_G} Connect Google Calendar</button></div>${nights ? '<h3>Coming up</h3>' + nights : ''}`;
  const cals = (L.calendars || []);
  return `<h3>Work schedule</h3><form id="calform" class="card calcard">
    <div class="row"><span class="calicon">${svg('cal')}</span><span class="sp"><span class="iname">Google Calendar connected</span><span class="imeta" style="display:block">${esc(L.google_email || '')}${L.last_sync ? ' · synced ' + ago(L.last_sync) : ''}</span></span></div>
    ${L.last_error ? `<p class="err" style="margin:10px 0 0">${esc(L.last_error)}</p>` : ''}
    <label style="margin-top:14px">Calendars to watch</label>
    <div class="callist">${cals.map((c, i) => `<div class="calrow"><label class="tog"><input type="checkbox" data-cw="${i}" ${c.watch ? 'checked' : ''}><span>${esc(c.summary)}</span></label>
      <select data-cm="${i}" aria-label="How to read ${esc(c.summary)}"><option value="mine" ${c.mode === 'mine' ? 'selected' : ''}>Only shifts with my name</option><option value="all" ${c.mode === 'all' ? 'selected' : ''}>Every event means I'm out</option></select></div>`).join('') || '<p class="imeta">No calendars found.</p>'}</div>
    <label for="cmn">Your name on shared schedules</label><input type="text" id="cmn" value="${esc(L.match_name || '')}" placeholder="e.g. Keith" maxlength="40">
    <p class="imeta" style="margin:4px 0 0">On a shared schedule like "Tom Open / Keith Close", Close, DBL, PM and night shifts count as working at dinner. Open, AM and OFF count as home.</p>
    <div class="row" style="gap:10px;margin-top:4px"><span class="sp"><label for="cds">Dinner starts</label><input type="time" id="cds" value="${esc(L.dinner_start)}"></span><span class="sp"><label for="cde">Dinner ends</label><input type="time" id="cde" value="${esc(L.dinner_end)}"></span></div>
    <p class="imeta" style="margin:4px 0 0">Timed events that overlap this window count as away.</p>
    <div class="row" style="gap:8px;margin-top:14px"><button class="btn" type="submit">Save &amp; sync</button><button class="btn ghost" type="button" data-act="calsync">Sync now</button><span class="sp"></span><button class="btn line sm" type="button" data-act="caldisconnect">Disconnect</button></div>
  </form>${nights ? '<h3>Coming up</h3>' + nights : '<p class="imeta">No working nights found in the next 4 weeks.</p>'}`;
}
async function connectCalendar() {
  try { localStorage.setItem('wc_cal', String(Date.now())); } catch (_) { }
  const redirectTo = IS_APP ? 'werecooked://auth-callback' : location.origin + location.pathname;
  const r = await sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo, skipBrowserRedirect: IS_APP, scopes: 'https://www.googleapis.com/auth/calendar.readonly',
    queryParams: { access_type: 'offline', prompt: 'consent', login_hint: S.session?.user?.email || '' } } });
  if (r.error) throw r.error;
  if (IS_APP) window.Android.openExternal(r.data.url); else location.assign(r.data.url);
}
let calFinishing = false;
async function finishCalendar(session) {
  let pending = 0; try { pending = Number(localStorage.getItem('wc_cal') || 0); } catch (_) { }
  if (!pending || Date.now() - pending > 15 * 60e3 || !session?.provider_refresh_token || calFinishing || !S.household) return;
  calFinishing = true;
  try {
    localStorage.removeItem('wc_cal');
    toast('Connecting your calendar…');
    const r = await calFn({ action: 'connect', refresh_token: session.provider_refresh_token });
    await loadCalendar(); S.tab = 'family'; render();
    toast(r.error ? r.error : `Calendar connected · ${r.nights || 0} working night${r.nights === 1 ? '' : 's'} found`);
  } catch (e) { fail(e); } finally { calFinishing = false; }
}
async function saveCalendar(form, sync = true) {
  const cals = (S.calLink.calendars || []).map((c, i) => ({ ...c, watch: form.querySelector(`[data-cw="${i}"]`).checked, mode: form.querySelector(`[data-cm="${i}"]`).value }));
  const row = { calendars: cals, match_name: $('#cmn').value.trim() || null, dinner_start: $('#cds').value || '17:00', dinner_end: $('#cde').value || '20:00' };
  const r = await sb.from('calendar_links').update(row).eq('user_id', S.session.user.id); if (r.error) throw r.error;
  Object.assign(S.calLink, row);
  if (sync) { const s = await calFn({ action: 'sync', force: true }); await loadCalendar(); render(); const e = (s.results || []).find(x => x.error); toast(e ? e.error : 'Saved · schedule synced'); }
}
function render() {
  const app = $('#app');
  if (!S.session) return authView();
  if (!S.household) return onboardView();
  const v = { home: homeView, week: weekView, pantry: pantryView, recipes: cookbooksView, list: listView, family: familyView }[S.tab]();
  const y = $('#main')?.scrollTop || 0;
  app.innerHTML = shell(v);
  $('#main').scrollTop = y;
  const live = (id, key) => { const el = $(id); if (el) el.oninput = e => { S[key] = e.target.value; const pos = e.target.selectionStart; render(); const n = $(id); n.focus(); n.setSelectionRange(pos, pos); }; };
  live('#rq', 'recipeQ'); live('#psearch', 'pantryQ');
  setTimeout(queuePhotos, 60);
  const al = $('#addlist'); if (al) al.onsubmit = async e => { e.preventDefault(); const v = $('#li').value.trim(); if (!v) return; const p = parseIng(v); const lk = linkOf(p.name); const pi = lk?.items.length ? itemNamed(lk.items[0]) : null; const r = await sb.from('shopping_items').insert({ household_id: S.household.id, name: p.name, qty: p.qty, unit: p.unit, category: pi?.category || (lk?.items[0] && itemMeta(lk.items[0])?.[1]) || 'Other', source: 'manual', list_id: S.listId || null, added_by: S.session.user.id }); if (r.error) return fail(r.error); await loadAll(); render(); $('#li')?.focus(); };
  const cf = $('#calform'); if (cf) cf.onsubmit = async e => { e.preventDefault(); const b = cf.querySelector('[type=submit]'); b.disabled = true; b.textContent = 'Syncing…'; try { await saveCalendar(cf); } catch (er) { fail(er); render(); } };
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
async function refreshMe() { const r = await sb.from('members').select('*').eq('user_id', S.session.user.id).maybeSingle(); if (r.error) throw r.error; S.me = r.data; if (S.me) { const h = await sb.from('households').select('*').eq('id', S.me.household_id).single(); if (h.error) throw h.error; S.household = h.data; applyCustom(); } else S.household = null; }
async function enter() { try { await refreshMe(); if (S.household) { await loadAll(); await ensureBooks(); subscribe(); } render(); if (S.household) { finishCalendar(S.session); setTimeout(autoSyncCalendar, 1500); } } catch (e) { fail(e); } }

// ---------- sheets ----------
const TOUCH = matchMedia('(pointer: coarse)').matches;
// ---------- household-added options (new spots, aisles, recipe types, courses) ----------
let CUSTOM_COURSES = [];
const slugKey = (pre, name) => pre + ':' + String(name).trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
function applyCustom() {
  const c = S.household?.custom || {};
  for (const l of c.locations || []) if (!LOCS[l.key]) { LOCS[l.key] = [l.name, l.emoji || '📦', '#7A6A55']; LOC_ORDER.push(l.key); }
  for (const a of c.aisles || []) if (!CATS.includes(a)) CATS.splice(Math.max(0, CATS.indexOf('Other')), 0, a);
  for (const k of c.rcats || []) if (!RCATS[k.key]) { RCATS[k.key] = [k.name, k.emoji || '🍽', '#6E6150']; const sl = SLOT_CATS[k.slot] ? k.slot : 'main'; if (!SLOT_CATS[sl].includes(k.key)) SLOT_CATS[sl].push(k.key); }
  CUSTOM_COURSES = c.courses || []; linkCache.clear();
}
async function addCustom(kind, value) {
  const c = { ...(S.household.custom || {}) }; c[kind] = [...(c[kind] || []), value];
  const r = await sb.from('households').update({ custom: c }).eq('id', S.household.id); if (r.error) throw r.error;
  S.household.custom = c; applyCustom();
}
/** A pantry item got renamed: recipes linked to the old name follow it, and so do list items. */
async function renameItem(from, to) {
  const used = S.recipes.some(r => (r.ingredients || []).some(i => (rawLinkOf(i)?.items || []).some(n => n.toLowerCase() === from.toLowerCase()))) || ING.items[from] || Object.values(S.household.custom?.alias || {}).includes(from);
  if (used) { const c = { ...(S.household.custom || {}) }, A = { ...(c.alias || {}) };
    for (const k of Object.keys(A)) if (A[k] === from) A[k] = to;
    A[from.toLowerCase()] = to; delete A[to.toLowerCase()]; c.alias = A;
    const r = await sb.from('households').update({ custom: c }).eq('id', S.household.id); if (r.error) throw r.error; S.household.custom = c; linkCache.clear(); }
  quietUntil = Date.now() + 3000;
  await sb.from('shopping_items').update({ name: to }).eq('household_id', S.household.id).eq('name', from);
}
/** A small "name it" sheet. Resolves {name, emoji} or null. */
function askNew(title, placeholder, emojis = null) {
  return new Promise(res => {
    let emoji = emojis?.[0] || null, done = false;
    const el = sheet(`<h2>${esc(title)}</h2><form id="anf"><label for="ann">Name</label><input type="text" id="ann" maxlength="40" required placeholder="${esc(placeholder)}" autocomplete="off">
      ${emojis ? `<label>Icon</label><div class="emo">${emojis.map(e => `<button type="button" data-ane="${e}" aria-pressed="${e === emoji}">${e}</button>`).join('')}</div>` : ''}
      <div class="row" style="margin-top:16px"><button class="btn" type="submit">Add</button><button class="btn ghost" type="button" data-close>Cancel</button></div></form>`, (el, close) => {
      el.querySelectorAll('[data-ane]').forEach(b => b.onclick = () => { emoji = b.dataset.ane; el.querySelectorAll('[data-ane]').forEach(x => x.setAttribute('aria-pressed', x === b)); });
      el.querySelector('#anf').onsubmit = e => { e.preventDefault(); const name = el.querySelector('#ann').value.trim(); if (!name) return; done = true; el.remove(); res({ name, emoji }); };
      setTimeout(() => el.querySelector('#ann')?.focus(), 50);
    }, { onClose: () => { if (!done) res(null); } });
  });
}
/** "+ New" handlers for chip-row menus (selects marked data-add). Each returns {value, label} or null. */
const ADDERS = {
  location: async () => { const n = await askNew('New storage spot', 'Garage freezer, wine fridge, deep pantry…', ['📦', '🧊', '🍷', '🥫', '🧺', '🗄️', '🚪', '🏠']); if (!n) return null;
    const key = slugKey('c', n.name); if (!LOCS[key]) await addCustom('locations', { key, name: n.name, emoji: n.emoji }); return { value: key, label: `${LOCS[key][1]} ${LOCS[key][0]}` }; },
  aisle: async () => { const n = await askNew('New store aisle', 'Deli, International, Pet…'); if (!n) return null; if (!CATS.includes(n.name)) await addCustom('aisles', n.name); return { value: n.name, label: n.name }; },
  rcat: async () => { const n = await askNew('New recipe type', 'Casserole, Cocktail, Smoker…', ['🍽', '🥘', '🍹', '🔥', '🥪', '🍕', '🌮', '🍜', '🥟', '🧁']); if (!n) return null;
    const key = slugKey('c', n.name); if (!RCATS[key]) await addCustom('rcats', { key, name: n.name, emoji: n.emoji, slot: 'main' }); return { value: key, label: `${RCATS[key][1]} ${RCATS[key][0]}` }; },
  member: async () => { try { await navigator.clipboard.writeText(`Join our household on We're Cooked: ${WEB_HOME} — invite code ${S.household.invite_code}`); toast('Invite copied — text it to them'); } catch (_) { toast('Invite code: ' + S.household.invite_code); } return null; }
};
const ADD_LABEL = { location: 'New spot', aisle: 'New aisle', rcat: 'New type', member: 'Invite someone' };
/** Swap every <select> for a one-row strip of chips (no full-screen pickers) and switch off browser autofill lists. */
function tameInputs(root = document) {
  root.querySelectorAll('input:not([type=checkbox]):not([type=radio]):not([type=file]):not([autocomplete]),textarea:not([autocomplete])').forEach(i => i.setAttribute('autocomplete', 'off'));
  root.querySelectorAll('select:not([data-enh])').forEach(sel => {
    sel.dataset.enh = '1'; sel.hidden = true;
    const wrap = document.createElement('div'); wrap.className = 'pickrow'; wrap.setAttribute('role', 'radiogroup');
    const lab = sel.id && root.querySelector?.(`label[for="${sel.id}"]`); if (lab) { lab.removeAttribute('for'); wrap.setAttribute('aria-label', lab.textContent); } else if (sel.getAttribute('aria-label')) wrap.setAttribute('aria-label', sel.getAttribute('aria-label'));
    const build = () => { wrap.innerHTML = [...sel.options].map(o => `<button type="button" role="radio" aria-checked="${o.selected}" data-v="${esc(o.value)}">${esc(o.textContent)}</button>`).join('') + (sel.dataset.add && ADDERS[sel.dataset.add] ? `<button type="button" class="pr-new" data-new="1">＋ ${esc(ADD_LABEL[sel.dataset.add] || 'New')}</button>` : ''); };
    build();
    wrap.addEventListener('click', async e => {
      if (e.target.closest('[data-new]')) { try { const got = await ADDERS[sel.dataset.add](); if (!got) return; if (![...sel.options].some(o => o.value === got.value)) sel.add(new Option(got.label, got.value)); sel.value = got.value; build(); sel.dispatchEvent(new Event('change', { bubbles: true })); requestAnimationFrame(() => { wrap.scrollLeft = wrap.scrollWidth; }); } catch (er) { fail(er); } return; }
      const b = e.target.closest('[data-v]'); if (!b) return; sel.value = b.dataset.v; [...wrap.children].forEach(x => x.setAttribute('aria-checked', x === b)); sel.dispatchEvent(new Event('change', { bubbles: true })); });
    sel.after(wrap);
    requestAnimationFrame(() => { const on = wrap.querySelector('[aria-checked=true]'); if (on) wrap.scrollLeft = Math.max(0, on.offsetLeft - wrap.clientWidth / 2 + on.offsetWidth / 2); });
  });
}
new MutationObserver(muts => { for (const m of muts) for (const n of m.addedNodes) if (n.nodeType === 1) tameInputs(n.parentNode || document); }).observe(document.documentElement, { childList: true, subtree: true });
function sheet(html, onReady, opts = {}) {
  const el = document.createElement('div'); el.className = 'sheet' + (opts.full ? ' full' : ''); el.innerHTML = `<div role="dialog" aria-modal="true">${html}</div>`;
  const close = () => { el.remove(); opts.onClose?.(); if (!$('.sheet')) render(); };
  el.close = close;
  el.onclick = e => { if (e.target === el || e.target.closest('[data-close]')) close(); };
  document.body.appendChild(el); onReady?.(el, close); if (!opts.full && !TOUCH) el.querySelector('input:not([type=checkbox]),textarea')?.focus();
  return el;
}
const busy = (el, text) => { el.querySelector('[role=dialog]').innerHTML = `<div class="spin"></div><p class="lede" style="text-align:center">${esc(text)}</p>`; };

// ---------- day planner ----------
const dishIds = p => p ? (p.recipe_ids?.length ? p.recipe_ids : p.recipe_id ? [p.recipe_id] : []) : [];
const SLOTS = { main: ['Main', 'Choose a main', 'Add another main'], side: ['Sides', 'Add a side', 'Add another side'], salad: ['Salad', 'Add a salad', 'Add another salad'], bread: ['Bread', 'Add bread', 'Add more bread'], dessert: ['Dessert', 'Add dessert', 'Add another dessert'] };
const SLOT_ORDER = ['main', 'side', 'salad', 'bread', 'dessert'];
const SLOT_CATS = { main: ['main', 'soup', 'breakfast', 'appetizer'], side: ['side'], salad: ['salad'], bread: ['bread'], dessert: ['dessert'] };
const slotFor = r => { const c = catOf(r); return ['side', 'salad', 'bread', 'dessert'].includes(c) ? c : 'main'; };
const orderCourses = cs => [...SLOT_ORDER.flatMap(sl => cs.filter(x => x.slot === sl)), ...cs.filter(x => !SLOT_ORDER.includes(x.slot))];
const slotInfo = sl => SLOTS[sl] || (() => { const n = String(sl).replace(/^x:/, ''); return [n, `Add ${n.toLowerCase()}`, `Add more ${n.toLowerCase()}`]; })();
/** [{id, slot}] for a plan row; older rows without courses get roles from each recipe's type. */
function coursesOf(p) {
  if (!p) return []; const ids = dishIds(p);
  const c = Array.isArray(p.courses) ? p.courses.filter(x => x && ids.includes(x.id)) : [], known = new Set(c.map(x => x.id));
  for (const id of ids) if (!known.has(id)) { const r = S.recipes.find(x => x.id === id); c.push({ id, slot: r ? slotFor(r) : 'main' }); }
  return orderCourses(c);
}
const dishesOf = p => coursesOf(p).map(x => S.recipes.find(r => r.id === x.id)).filter(Boolean);
const bySlot = (p, sl) => coursesOf(p).filter(x => x.slot === sl).map(x => S.recipes.find(r => r.id === x.id)).filter(Boolean);
function mealTitle(p) { const m = bySlot(p, 'main'); const ds = dishesOf(p); return (m.length ? m : ds.slice(0, 1)).map(r => r.title).join(' + '); }
function mealWith(p) { const cs = coursesOf(p), hasMain = cs.some(x => x.slot === 'main'); return (hasMain ? cs.filter(x => x.slot !== 'main') : cs.slice(1)).map(x => S.recipes.find(r => r.id === x.id)).filter(Boolean); }
const withLine = p => { const w = mealWith(p); return w.length ? 'with ' + w.map(r => r.title).join(', ') : ''; };
const PAIRS = [
  [/catfish|fish fry|crappie|fried fish|fish fillets/i, ['Hushpuppies', 'Arkansas BBQ Coleslaw', 'French Fries', 'Fried Green Tomatoes', 'Southern Baked Beans']],
  [/fried chicken|chicken fried|cube steak|country fried|pork chop|smothered|chicken and dumplings/i, ['Mashed Potatoes', 'Southern Green Beans', 'Collard Greens', 'Baked Mac and Cheese', 'Fried Okra', 'Southern Creamed Corn']],
  [/bbq|barbecue|pulled pork|ribs|brisket|smoked|pork shoulder/i, ['Arkansas BBQ Coleslaw', 'Southern Baked Beans', 'Southern Potato Salad', 'Baked Mac and Cheese', 'Southern Macaroni Salad']],
  [/turkey|\bham\b|thanksgiving|christmas/i, ['Cornbread Dressing', 'Green Bean Casserole', 'Sweet Potato Casserole', 'Mashed Potatoes', 'Candied Yams', 'Corn Pudding', 'Southern Green Beans']],
  [/meatloaf|pot roast|roast beef|chuck|salisbury/i, ['Mashed Potatoes', 'Southern Green Beans', 'Honey Glazed Carrots', 'Southern Creamed Corn']],
  [/steak|ribeye|sirloin/i, ['Baked Potatoes', 'Twice Baked Potatoes', 'Southern Creamed Corn', 'Sautéed Squash and Onions', 'Au Gratin Potatoes']],
  [/gumbo|jambalaya|etouffee|étouffée|red beans|creole|cajun/i, ['Dirty Rice', 'Fried Okra', 'Stewed Okra and Tomatoes']],
  [/pinto|soup beans|beans and cornbread|ham hock/i, ['Fried Potatoes', 'Fried Cabbage', 'Fried Apples', 'Turnip Greens']],
  [/burger|hot dog|sandwich|bologna|po.?boy/i, ['French Fries', 'Southern Potato Salad', 'Southern Macaroni Salad', 'Southern Baked Beans']],
  [/spaghetti|lasagna|pasta|alfredo|italian|parm/i, ['Sautéed Squash and Onions', 'Fried Zucchini']],
  [/duck|venison|quail|dove|game/i, ['Dirty Rice', 'Collard Greens', 'Sweet Potato Casserole']],
  [/chicken/i, ['Mashed Potatoes', 'Southern Green Beans', 'Baked Mac and Cheese', 'Broccoli Rice Casserole']]];
const PAIR_EXTRAS = { salad: [[/steak|ribeye/i, ['Classic Wedge Salad']], [/bbq|barbecue|burger|catfish|fish/i, ['Cucumber, Tomato and Onion Salad', 'Broccoli Salad with Bacon']], [/turkey|ham|thanksgiving/i, ['Seven-Layer Salad', 'English Pea Salad']]],
  bread: [[/beans|greens|catfish|fish|chili|soup|stew|gumbo/i, ['Skillet Cornbread', 'Fried Cornbread (Hoecakes)', 'Hot Water Cornbread']], [/turkey|ham|roast|thanksgiving/i, ['Yeast Dinner Rolls', 'Angel Biscuits', 'Sweet Potato Biscuits']], [/fried chicken|pork chop|smothered|steak/i, ['Cathead Biscuits', 'Garlic Texas Toast']], [/spaghetti|pasta|lasagna|italian/i, ['Garlic Texas Toast']]],
  dessert: [[/turkey|thanksgiving/i, ['Pecan Pie', 'Sweet Potato Pie', 'Pumpkin Pie']], [/bbq|barbecue|catfish|fish|burger/i, ['Banana Pudding', 'Peach Cobbler']]] };
/** Best recipes for a slot, given the mains: known pairings first, then what you can make, then favorites. */
function suggestFor(mains, slot, exclude = [], n = 4) {
  const want = new Map();
  const rules = slot === 'side' ? PAIRS : (PAIR_EXTRAS[slot] || []);
  for (const m of mains) for (const [rx, names] of rules) if (rx.test(m.title)) names.forEach((nm, j) => { const k = nm.toLowerCase(); want.set(k, Math.max(want.get(k) || 0, 50 - j * 4)); });
  return S.recipes.filter(r => isMeal(r) && !isTodo(r) && slotFor(r) === slot && !exclude.includes(r.id))
    .map(r => ({ r, s: (want.get(r.title.toLowerCase()) || 0) + recipeMatch(r).pct * 0.2 + (r.rating || 0) * 3 + (r.favorite ? 6 : 0) + Math.random() * 5 - (avoidersOf(r).length ? 60 : 0) }))
    .sort((a, b) => b.s - a.s).slice(0, n).map(x => x.r);
}
/** Write a whole cooked meal for a day in one go. */
async function setMeal(day, courses) {
  const cs = orderCourses(courses), ids = cs.map(x => x.id);
  const u = await sb.from('meal_plan').upsert({ household_id: S.household.id, day, kind: 'cook', courses: cs, recipe_ids: ids, recipe_id: ids[0] || null, cooked: false, title: null, place_name: null, place_address: null, place_lat: null, place_lon: null, cost: null }, { onConflict: 'household_id,day' });
  if (u.error) throw u.error;
}
function dishPicker(selected, onDone, opts = {}) {
  const pkBooks = () => [['', '📚', 'All']].concat(S.books.map(b => [b.id, b.emoji, b.name])).map(([id, e, n]) => `<button class="chip" data-pb="${id}" aria-pressed="${st.book === id}" style="white-space:nowrap">${esc(e)} ${esc(n)}</button>`).join('') + '<button class="chip pr-new" data-pbnew="1" style="white-space:nowrap">＋ New book</button>';
  const st = { sel: [...selected], book: opts.slot ? '' : (S.book || ''), q: '', all: !opts.slot || !SLOT_CATS[opts.slot] };
  const list = () => S.recipes.filter(r => isMeal(r) && !isTodo(r) && (st.all || !SLOT_CATS[opts.slot] || SLOT_CATS[opts.slot].includes(catOf(r))) && (!st.book || (r.books || []).includes(st.book)) && (!st.q || r.title.toLowerCase().includes(st.q.toLowerCase()) || (r.tags || []).join(' ').toLowerCase().includes(st.q.toLowerCase())));
  const body = () => {
    const rs = list(); const groups = {}; for (const r of rs) (groups[catOf(r)] = groups[catOf(r)] || []).push(r);
    return ['main', 'side', 'soup', 'salad', 'bread', 'appetizer', 'breakfast', 'dessert', 'drink'].filter(c => groups[c]).map(c => `<h3>${RCATS[c][0]}${RCATS[c][0].endsWith('s') ? '' : 's'}</h3><div class="card flat" style="padding:2px 12px">${groups[c].sort((a, b) => a.title.localeCompare(b.title)).map(r => { const on = st.sel.includes(r.id), m = recipeMatch(r); return `<button class="pick${on ? ' on' : ''}" data-pk="${r.id}"><span class="thumb${r.photo_url ? ' has' : ''}" style="--c:${colorOf(r)}${r.photo_url ? `;background-image:url('${esc(r.photo_url)}')` : ''}"><span>${emojiOf(r)}</span></span><span style="min-width:0"><span class="iname">${esc(r.title)}</span><span class="imeta" style="display:block">${[fmtTime(r.time_min), m.total ? `${m.have}/${m.total} at home` : '', r.rating ? '★'.repeat(r.rating) : ''].filter(Boolean).join(' · ')}</span></span><span class="tick">${on ? '✓' : '+'}</span></button>`; }).join('')}</div>`).join('') || '<p class="empty">No recipes in this book yet.</p>';
  };
  sheet(`<div class="row"><h2 class="sp">${opts.slot ? esc(slotInfo(opts.slot)[1].replace(/^Add /, 'Choose ').replace(/^Choose a main$/, 'Choose the main')) : 'Add dishes'}</h2><button class="btn sm" id="pkdone">Done</button></div>
  ${opts.slot ? `<div class="row" style="margin:-4px 0 8px"><span class="imeta sp">Showing ${esc(slotInfo(opts.slot)[0].toLowerCase())}</span><button type="button" class="btn sm ghost" id="pkall">Show every recipe</button></div>` : ''}
  <div class="chips scroll" id="pkbooks">${pkBooks()}</div>
  <button type="button" class="newrow" id="pknew">${svg('plus')}<span><b>New recipe</b><i>${opts.slot ? `Add a ${esc(slotInfo(opts.slot)[0].toLowerCase().replace(/s$/, ''))} that isn’t in your cookbooks yet` : 'Add a dish that isn’t in your cookbooks yet'}</i></span></button>
  <div class="search">${svg('search')}<input type="search" id="pkq" placeholder="Search this cookbook"></div><div id="pkl">${body()}</div>`, (el) => {
    const redraw = () => { el.querySelector('#pkl').innerHTML = body(); el.querySelector('#pkdone').textContent = st.sel.length ? `Done (${st.sel.length})` : 'Done'; };
    el.querySelector('#pkq').oninput = e => { st.q = e.target.value; redraw(); };
    el.addEventListener('click', e => {
      const b = e.target.closest('[data-pb]'); if (b) { st.book = b.dataset.pb; el.querySelectorAll('[data-pb]').forEach(x => x.setAttribute('aria-pressed', x === b)); return redraw(); }
      const k = e.target.closest('[data-pk]'); if (k) { const id = k.dataset.pk; st.sel = st.sel.includes(id) ? st.sel.filter(x => x !== id) : [...st.sel, id]; return redraw(); }
      if (e.target.closest('#pknew')) { const cat = opts.slot && SLOT_CATS[opts.slot] ? SLOT_CATS[opts.slot][0] : ''; recipeEditor(null, { category: cat, books: st.book ? [st.book] : [], kind: 'meal' }, { onSaved: id => { if (!st.sel.includes(id)) st.sel.push(id); redraw(); toast('Added and picked'); } }); return; }
      if (e.target.closest('[data-pbnew]')) { bookEditor(null, { onSaved: id => { st.book = id; el.querySelector('#pkbooks').innerHTML = pkBooks(); redraw(); } }); return; }
      if (e.target.closest('#pkall')) { st.all = !st.all; e.target.closest('#pkall').textContent = st.all ? `Only ${slotInfo(opts.slot)[0].toLowerCase()}` : 'Show every recipe'; return redraw(); }
      if (e.target.closest('#pkdone')) { el.remove(); onDone(st.sel); }
    });
    redraw();
  });
}
function dayEditor(day) {
  const p = S.plan.find(x => x.day === day) || { day, kind: 'cook', away: [], recipe_id: null, recipe_ids: [], cook_id: null, headcount: null, title: '', note: '', cost: null };
  const busyIds = busyOn(day).map(b => b.user_id);
  const st = { kind: p.kind, away: awayOn(p, day), courses: coursesOf(p), open: new Set(coursesOf(p).map(x => x.slot)), cook_id: p.cook_id, q: '', results: [], busy: false, err: '',
    place: p.place_name ? { name: p.place_name, address: p.place_address, lat: p.place_lat, lon: p.place_lon } : null };
  let map = null, keepRef = () => { };
  const keep = () => keepRef();
  const dt = parseYmd(day);
  const ide = ideas(5);
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
  const menu = () => {
    const ds = st.courses.map(c => ({ ...c, r: S.recipes.find(x => x.id === c.id) })).filter(c => c.r);
    const of = sl => ds.filter(c => c.slot === sl), mains = of('main').map(c => c.r), used = ds.map(c => c.id);
    const miss = [...new Set(ds.flatMap(c => missingBuys(c.r).map(b => b.name)))];
    const dish = c => `<div class="pick on" style="cursor:default"><span class="thumb${c.r.photo_url ? ' has' : ''}" style="--c:${colorOf(c.r)}${c.r.photo_url ? `;background-image:url('${esc(c.r.photo_url)}')` : ''}"><span>${emojiOf(c.r)}</span></span><span style="min-width:0"><span class="iname">${esc(c.r.title)}</span><span class="imeta" style="display:block">${(() => { const m = recipeMatch(c.r); return [c.r.time_min ? fmtTime(c.r.time_min) : '', m.total ? `${m.have}/${m.total} at home` : ''].filter(Boolean).join(' · '); })()}</span></span><button type="button" class="del" data-undish="${c.id}" aria-label="Remove ${esc(c.r.title)}">×</button></div>`;
    const section = sl => { const list = of(sl), sug = mains.length && sl !== 'main' ? suggestFor(mains, sl, used, list.length ? (sl === 'side' ? 3 : 2) : (sl === 'side' ? 4 : 3)) : [];
      return `<div class="course"><div class="course-h"><span>${slotInfo(sl)[0]}</span>${sl !== 'main' && sl !== 'side' && !list.length ? `<button type="button" class="course-x" data-unslot="${sl}" aria-label="Remove ${slotInfo(sl)[0]} slot">×</button>` : ''}</div>
        ${list.length ? `<div class="card flat" style="padding:2px 12px;margin:0">${list.map(dish).join('')}</div>` : ''}
        ${sug.length && list.length < 4 ? `<div class="sugrow"><span class="imeta">${list.length ? 'More that go with it' : 'Goes well with ' + esc(mains[0].title)}</span><div class="chips">${sug.map(r => `<button type="button" class="chip" data-addslot="${sl}" data-rid="${r.id}">${svg('plus')} ${esc(r.title)}</button>`).join('')}</div></div>` : ''}
        <button type="button" class="btn sm ghost" data-pickslot="${sl}">${svg('plus')} ${list.length ? slotInfo(sl)[2] : slotInfo(sl)[1]}</button></div>`; };
    const extras = ['salad', 'bread', 'dessert', ...CUSTOM_COURSES.map(n => 'x:' + n), ...[...st.open].filter(sl => sl.startsWith('x:') && !CUSTOM_COURSES.includes(sl.slice(2)))], shown = extras.filter(sl => st.open.has(sl) || of(sl).length), hidden = extras.filter(sl => !shown.includes(sl));
    return `<label>On the menu</label>
      ${section('main')}
      ${!mains.length && ide.length ? `<div class="imeta" style="margin:-2px 0 6px">Makeable from your pantry:</div><div class="chips" style="margin-bottom:8px">${ide.map(x => `<button type="button" class="chip" data-addslot="main" data-rid="${x.r.id}">${emojiOf(x.r)} ${esc(x.r.title)}</button>`).join('')}</div>` : ''}
      ${section('side')}
      ${shown.map(section).join('')}
      <div class="course-add"><span class="imeta">Add a course</span>${hidden.map(sl => `<button type="button" class="chip" data-openslot="${esc(sl)}">${svg('plus')} ${esc(slotInfo(sl)[0])}</button>`).join('')}<button type="button" class="chip pr-new" data-newcourse="1">＋ New course</button></div>
      <div class="row" style="margin-top:10px"><button type="button" class="btn sm flame" id="dchef">${svg('spark')} Ask the chef</button></div>
      ${ds.length ? `<div class="imeta" style="margin-top:8px">${miss.length ? 'Need to buy: ' + esc(miss.slice(0, 10).join(', ')) + (miss.length > 10 ? '…' : '') : 'Everything is in the pantry'}</div>` : ''}`;
  };

  const draw = el => {
    el.querySelector('#dbody').innerHTML = `
    <div class="seg">${Object.entries(KINDS).map(([k, l]) => `<button type="button" data-kind="${k}" style="--k:var(--${k})" aria-pressed="${st.kind === k}">${l}</button>`).join('')}</div>
    ${st.kind === 'cook' ? menu() + `<label for="dc">Who's cooking</label><select id="dc" data-add="member"><option value="">Not decided</option>${S.members.map(m => `<option value="${m.user_id}" ${st.cook_id === m.user_id ? 'selected' : ''}>${esc(m.display_name)}</option>`).join('')}</select>` : ''}
    ${st.kind === 'out' || st.kind === 'takeout' ? placePicker() + `<label for="dcost">What did it cost? (optional)</label><input type="number" id="dcost" min="0" step="0.01" inputmode="decimal" value="${p.cost ?? ''}" placeholder="$">` : ''}
    ${st.kind === 'other' ? `<label for="dt">Plan</label><input type="text" id="dt" value="${esc(p.title || '')}" maxlength="80">` : ''}
    ${st.kind !== 'away' ? `<label>Who's home (tap to mark away)</label><div class="chips">${S.members.map(m => `<button type="button" class="chip" data-away="${m.user_id}" aria-pressed="${!st.away.includes(m.user_id)}" style="display:inline-flex;align-items:center;gap:6px">${av(m, st.away.includes(m.user_id))}${esc(m.display_name)}${busyIds.includes(m.user_id) ? `<small style="opacity:.75">· ${st.away.includes(m.user_id) ? 'working' : 'home anyway'}</small>` : ''}</button>`).join('')}</div>
    ${busyOn(day).map(b => `<p class="calnote">${svg('cal')}<span><b>${esc(memberById(b.user_id).display_name)}'s calendar:</b> ${esc(shortReason(b))}. ${st.away.includes(b.user_id) ? 'Tap their name if they\'ll be home for dinner after all.' : 'Marked home for dinner anyway.'}</span></p>`).join('')}
    <label for="dh">How many eating (blank = everyone home)</label><input type="number" id="dh" min="0" max="80" value="${p.headcount ?? ''}" placeholder="${homeCount({ away: st.away, present: p.present, day: p.day })}">` : ''}
    <label for="dn">Note</label><input type="text" id="dn" value="${esc(p.note || '')}" maxlength="120" placeholder="e.g. game night, Thanksgiving at our house">`;
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
    ${p.id && p.kind === 'cook' && dishIds(p).length && !p.cooked ? `<button class="btn line wide" type="button" id="dcooked" style="margin-top:10px">We cooked this — update the pantry</button>` : ''}</form>`, (el, close) => {
    draw(el);
    keepRef = () => { const g = id => el.querySelector(id); if (g('#dc')) st.cook_id = g('#dc').value || null; if (g('#dt')) p.title = g('#dt').value; if (g('#dh')) p.headcount = g('#dh').value ? Number(g('#dh').value) : null; if (g('#dn')) p.note = g('#dn').value; if (g('#pq2')) st.q = g('#pq2').value; if (g('#dcost')) p.cost = g('#dcost').value ? Number(g('#dcost').value) : null; };
    el.addEventListener('click', async e => {
      const k = e.target.closest('[data-kind]'); if (k) { keep(); st.kind = k.dataset.kind; draw(el); return; }
      const a = e.target.closest('[data-away]'); if (a) { keep(); const id = a.dataset.away; st.away = st.away.includes(id) ? st.away.filter(x => x !== id) : [...st.away, id]; draw(el); return; }
      const ud = e.target.closest('[data-undish]'); if (ud) { keep(); st.courses = st.courses.filter(c => c.id !== ud.dataset.undish); draw(el); return; }
      const as = e.target.closest('[data-addslot]'); if (as) { keep(); if (!st.courses.some(c => c.id === as.dataset.rid)) st.courses = orderCourses([...st.courses, { id: as.dataset.rid, slot: as.dataset.addslot }]); st.open.add(as.dataset.addslot); draw(el); return; }
      if (e.target.closest('[data-newcourse]')) { keep(); const n = await askNew('New course', 'Appetizers, Cocktails, Soup…'); if (!n) return; if (!CUSTOM_COURSES.includes(n.name)) { try { await addCustom('courses', n.name); } catch (er) { return fail(er); } } st.open.add('x:' + n.name); draw(el); return; }
      const os = e.target.closest('[data-openslot]'); if (os) { keep(); st.open.add(os.dataset.openslot); draw(el); return; }
      const uso = e.target.closest('[data-unslot]'); if (uso) { keep(); st.open.delete(uso.dataset.unslot); draw(el); return; }
      const ps = e.target.closest('[data-pickslot]'); if (ps) { keep(); const sl = ps.dataset.pickslot; dishPicker(st.courses.filter(c => c.slot === sl).map(c => c.id), sel => { st.courses = orderCourses([...st.courses.filter(c => c.slot !== sl && !sel.includes(c.id)), ...sel.map(id => ({ id, slot: sl }))]); st.open.add(sl); draw(el); }, { slot: sl }); return; }
      const pl = e.target.closest('[data-place]'); if (pl) { choose(el, Number(pl.dataset.place)); return; }
      const us = e.target.closest('[data-usual]'); if (us) { keep(); st.place = usualSpots(st.kind)[Number(us.dataset.usual)]; draw(el); return; }
      if (e.target.closest('#pgo')) { runSearch(el); return; }
      if (e.target.closest('#dchef')) { keep(); chefSheet(day); return; }
      if (e.target.closest('#pchg')) { keep(); st.place = null; draw(el); setTimeout(() => el.querySelector('#pq2')?.focus(), 0); return; }
      if (e.target.closest('#pnear')) { keep(); st.err = ''; st.busy = true; draw(el); locateMe().then(() => { st.busy = false; if ((el.querySelector('#pq2')?.value || st.q).trim()) runSearch(el); else draw(el); }).catch(er => { st.busy = false; st.err = er.message; draw(el); }); return; }
    });
    el.addEventListener('keydown', e => { if (e.target.id === 'pq2' && e.key === 'Enter') { e.preventDefault(); runSearch(el); } });
    el.querySelector('#dform').onsubmit = async e => {
      e.preventDefault(); keep();
      const pl = (st.kind === 'out' || st.kind === 'takeout') && st.place, cookCourses = st.kind === 'cook' ? orderCourses(st.courses) : [], cookDishes = cookCourses.map(c => c.id);
      const same0 = JSON.stringify(cookDishes) === JSON.stringify(dishIds(p)) && st.kind === p.kind;
      const row = { household_id: S.household.id, day, kind: st.kind, courses: cookCourses, recipe_ids: cookDishes, recipe_id: cookDishes[0] || null, cook_id: st.kind === 'cook' ? st.cook_id : null, title: st.kind === 'cook' || st.kind === 'away' ? null : (p.title || null),
        place_name: pl ? pl.name : null, place_address: pl ? pl.address || null : null, place_lat: pl ? pl.lat ?? null : null, place_lon: pl ? pl.lon ?? null : null, cost: (st.kind === 'out' || st.kind === 'takeout') ? p.cost : null,
        away: st.kind === 'away' ? S.members.map(m => m.user_id) : st.away.filter(id => !busyIds.includes(id)), present: st.kind === 'away' ? [] : busyIds.filter(id => !st.away.includes(id)), headcount: st.kind === 'away' ? 0 : p.headcount, note: p.note || null, cooked: same0 ? !!p.cooked : false };
      const r = await sb.from('meal_plan').upsert(row, { onConflict: 'household_id,day' }); if (r.error) return fail(r.error);
      await loadAll(); close();
    };
    el.querySelector('#dclear')?.addEventListener('click', async () => { const r = await sb.from('meal_plan').delete().eq('id', p.id); if (r.error) return fail(r.error); await loadAll(); close(); });
    el.querySelector('#dcooked')?.addEventListener('click', async () => { try { el.remove(); await markCooked(p); } catch (e) { fail(e); } });
  });
}
async function addDishToDay(day, recipeId) {
  const p = S.plan.find(x => x.day === day);
  const r = S.recipes.find(x => x.id === recipeId);
  const prev = p && p.kind === 'cook' ? coursesOf(p) : [];
  const cs = orderCourses(prev.some(x => x.id === recipeId) ? prev : [...prev, { id: recipeId, slot: r ? slotFor(r) : 'main' }]), ids = cs.map(x => x.id);
  const base = p && p.kind === 'cook' ? {} : { title: null, place_name: null, place_address: null, place_lat: null, place_lon: null, cost: null };
  const u = await sb.from('meal_plan').upsert({ household_id: S.household.id, day, kind: 'cook', courses: cs, recipe_ids: ids, recipe_id: ids[0], cooked: false, ...base }, { onConflict: 'household_id,day' });
  if (u.error) throw u.error;
}

// ---------- pantry editor ----------
function pantryEditor(id, preset = {}) {
  const p = S.pantry.find(x => x.id === id) || { name: '', category: 'Pantry', qty: 1, unit: '', par: 0, expires_on: '', barcode: '', location: S.zone || '', ...preset };
  sheet(`<div class="row" style="flex-wrap:nowrap"><span class="thumb big${p.photo_url ? ' has' : ''}"${photoStyle(p.photo_url)}><span>${itemEmoji(p)}</span></span><h2 class="sp" style="margin:0">${id ? esc(p.name) : 'Add to the kitchen'}</h2></div>
  ${id ? `<div class="row" style="margin-top:8px"><button type="button" class="btn sm ghost" id="pphoto">📷 ${p.photo_credit === 'own' ? 'Retake photo' : 'Use my own photo'}</button>${p.photo_credit?.startsWith('wiki:') ? '<span class="imeta">Placeholder from Wikipedia</span>' : ''}</div>` : ''}
  <form id="pform">
  <label for="pnm">Item</label><input type="text" id="pnm" value="${esc(p.name)}" required maxlength="80" placeholder="e.g. Eggs">
  ${p.size ? `<p class="imeta" style="margin:6px 0 0">Package size: ${esc(p.size)}</p>` : ''}
  <div class="grid2"><div><label for="pq">On hand</label><input type="number" id="pq" step="any" min="0" value="${p.qty}"></div><div><label for="pu">Unit</label><input type="text" id="pu" value="${esc(p.unit)}" placeholder="each, lb, can…" maxlength="20"></div></div>
  ${(() => { const sz = id ? sizeOf(p.name, p) : null; return `<div class="grid2"><div><label for="ppk">Comes in a</label><input type="text" id="ppk" value="${esc(sz?.pkg || '')}" placeholder="bag, box, can…" maxlength="20"></div>
  <div><label for="ppq">That holds</label><div class="row" style="flex-wrap:nowrap;gap:6px"><input type="number" id="ppq" step="any" min="0" value="${sz?.amt ?? ''}" placeholder="5" style="min-width:0;flex:1"><input type="text" id="ppu" value="${esc(sz?.unit || '')}" placeholder="lb, oz" maxlength="12" style="width:72px"></div></div></div>
  <p class="imeta" style="margin:4px 0 0">Bags and boxes are kept in the weight they hold, so recipes in cups can come out of them.</p>`; })()}
  <div class="grid2"><div><label for="ppar">Always keep (par)</label><input type="number" id="ppar" step="any" min="0" value="${p.par}"></div><div><label for="pex">Use by</label><input type="date" id="pex" value="${esc(p.expires_on || '')}"></div></div>
  <div class="grid2"><div><label for="ploc">Where it lives</label><select id="ploc" data-add="location">${LOC_ORDER.map(k => `<option value="${k}" ${(p.location || locationFor(p.name, p.category)) === k ? 'selected' : ''}>${LOCS[k][1]} ${LOCS[k][0]}</option>`).join('')}</select></div>
  <div><label for="pcat">Store aisle</label><select id="pcat" data-add="aisle">${CATS.map(c => `<option ${c === p.category ? 'selected' : ''}>${c}</option>`).join('')}</select></div></div>
  <p class="imeta">Set a par and it becomes a staple: drop below it and it lands on the shopping list automatically.</p>
  ${p.barcode ? `<p class="imeta">Barcode ${esc(p.barcode)} — scanning it again adds one more.</p>` : ''}
  <div class="row" style="margin-top:18px"><button class="btn" type="submit">Save</button><button class="btn ghost" type="button" data-close>Cancel</button><span class="sp"></span>${id ? '<button class="btn line sm" type="button" id="pdel">Delete</button>' : ''}</div></form>`, (el, close) => {
    el.querySelector('#pnm').addEventListener('change', e => { if (!id && !p.location) el.querySelector('#ploc').value = locationFor(e.target.value, el.querySelector('#pcat').value); });
    el.querySelector('#pphoto')?.addEventListener('click', () => { el.remove(); setOwnPhoto('pantry_items', p, () => pantryEditor(id)); });
    el.querySelector('#pform').onsubmit = async e => {
      e.preventDefault(); const g = s => el.querySelector(s).value;
      const row = { household_id: S.household.id, name: g('#pnm').trim(), qty: Number(g('#pq')) || 0, unit: normUnit(g('#pu').trim()), par: Number(g('#ppar')) || 0, expires_on: g('#pex') || null, category: g('#pcat'), location: g('#ploc'), barcode: p.barcode || null, updated_at: new Date().toISOString() };
      const pk = normUnit(g('#ppk').trim()), pq = Number(g('#ppq')), pu = normUnit(g('#ppu').trim());
      if (pq > 0 && pu) Object.assign(row, { pack_name: pk || null, pack_qty: pq, pack_unit: pu }); else Object.assign(row, { pack_name: null, pack_qty: null, pack_unit: null });
      if (pq > 0 && pu && row.unit === pk && ING.convert.has(pk) && (pu in UNIT_SETS[0] || pu in UNIT_SETS[1])) { row.qty = Math.round(row.qty * pq * 100) / 100; row.par = parIn(row.par, pq); row.unit = pu; }
      if (id && row.name !== p.name && p.photo_credit !== 'own') { row.photo_url = null; row.photo_credit = null; }
      if (!id) { const t = pantryTarget({ name: row.name, barcode: row.barcode });
        if (t) { try { await addToPantry([{ name: row.name, qty: row.qty || 1, unit: row.unit, expires_on: row.expires_on }]); if (row.par > 0 && !(Number(t.par) > 0)) await sb.from('pantry_items').update({ par: row.par }).eq('id', t.id); } catch (er) { return fail(er); }
          await loadAll(); close(); return toast(`Added to ${t.name}`); } }
      const r = id ? await sb.from('pantry_items').update(row).eq('id', id) : await sb.from('pantry_items').insert(row); if (r.error) return fail(r.error);
      if (id && row.name !== p.name) { try { await renameItem(p.name, row.name); } catch (er) { console.error(er); } }
      await loadAll(); close();
    };
    el.querySelector('#pdel')?.addEventListener('click', async () => { const r = await sb.from('pantry_items').delete().eq('id', id); if (r.error) return fail(r.error); await loadAll(); close(); });
  });
}

// ---------- recipe page ----------
function linkChips(i, n) {
  const l = linkOf(i);
  if (!l) return `<button class="lchip warn" data-relink="${n}">⚠ Link to pantry</button>`;
  if (l.skip) return `<button class="lchip none" data-relink="${n}">Not a pantry item</button>`;
  return [...l.items.map(nm => { const p = itemNamed(nm); const have = p && Number(p.qty) > 0;
      return `<button class="lchip ${have ? 'have' : 'out'}" data-pitem="${p ? p.id : ''}" data-pname="${esc(nm)}" data-ln="${n}">${have ? '✓' : '○'} ${esc(nm)}${p ? ` · ${have ? esc(fmtQty(Number(p.qty)) + (p.unit ? ' ' + p.unit : '')) : 'out'}` : ''}</button>`; }),
    ...l.sub.map(t => { const sr = subRecipe(t); return `<button class="lchip sub" ${sr ? `data-subr="${sr.id}"` : 'disabled'}>📖 ${esc(t)}</button>`; }),
    `<button class="lchip edit" data-relink="${n}" aria-label="Change pantry link">✎</button>`].join('');
}
/** Pick which pantry item(s) an ingredient line uses. */
function linkPicker(r, n, done) {
  const ing = r.ingredients[n], l = linkOf(ing) || { items: [], sub: [] };
  const names = [...new Set([...S.pantry.map(p => p.name), ...Object.keys(ING.items)])].sort((a, b) => a.localeCompare(b));
  let picked = [...l.items], skip = !!l.skip;
  const draw = () => `<h2>Link to the pantry</h2><p class="lede">${esc(ing.name)}</p>
    <div class="chips">${picked.map((x, k) => `<button type="button" class="chip" aria-pressed="true" data-unpick="${k}">${esc(x)} ✕</button>`).join('') || `<span class="imeta">${skip ? 'Marked as not a pantry item (like water).' : 'No pantry item linked yet.'}</span>`}</div>
    <label for="lkq">Add a pantry item</label><input type="text" id="lkq" placeholder="Start typing: kosher salt, cheddar…" autocomplete="off"><div class="sugg" id="lksug" role="listbox"></div>
    <div class="row" style="margin-top:8px"><button type="button" class="btn sm ghost" id="lkadd">Add</button><span class="sp"></span><button type="button" class="btn sm line" id="lkskip">${skip ? 'It is a pantry item' : 'Not a pantry item'}</button></div>
    ${l.sub.length ? `<p class="imeta">Also uses the recipe: ${esc(l.sub.join(', '))}</p>` : ''}
    <div class="row" style="margin-top:18px"><button class="btn" id="lksave">Save link</button><button class="btn ghost" data-close>Cancel</button></div>`;
  sheet(draw(), (el, close) => {
    const box = el.querySelector('[role=dialog]'); const redraw = () => { box.innerHTML = draw(); };
    const addOne = () => { const v = el.querySelector('#lkq').value.trim(); if (!v) return; const hit = names.find(x => x.toLowerCase() === v.toLowerCase()) || v.replace(/^./, c => c.toUpperCase()); if (!picked.includes(hit)) picked.push(hit); skip = false; redraw(); el.querySelector('#lkq')?.focus(); };
    el.addEventListener('keydown', e => { if (e.target.id === 'lkq' && e.key === 'Enter') { e.preventDefault(); addOne(); } });
    el.addEventListener('input', e => { if (e.target.id !== 'lkq') return; const q = e.target.value.trim().toLowerCase(), box2 = el.querySelector('#lksug'); if (!q) { box2.innerHTML = ''; return; }
      const hits = names.filter(x => x.toLowerCase().includes(q)).sort((a, b) => a.toLowerCase().indexOf(q) - b.toLowerCase().indexOf(q) || a.length - b.length).slice(0, 6);
      const exact = hits.some(x => x.toLowerCase() === q), typed = e.target.value.trim().replace(/^./, c => c.toUpperCase());
      box2.innerHTML = hits.map(x => `<button type="button" role="option" data-sug="${esc(x)}">${esc(x)}</button>`).join('') + (exact ? '' : `<button type="button" class="pr-new" data-sug="${esc(typed)}">＋ Add “${esc(typed)}” as a new item</button>`); });
    el.addEventListener('click', async e => {
      const sg = e.target.closest('[data-sug]'); if (sg) { el.querySelector('#lkq').value = sg.dataset.sug; return addOne(); }
      const u = e.target.closest('[data-unpick]'); if (u) { picked.splice(+u.dataset.unpick, 1); return redraw(); }
      if (e.target.closest('#lkadd')) return addOne();
      if (e.target.closest('#lkskip')) { skip = !skip; if (skip) picked = []; return redraw(); }
      if (e.target.closest('#lksave')) {
        const next = r.ingredients.map((x, k) => k === n ? { ...x, items: picked, sub: l.sub || [], ...(skip ? { skip: true } : { skip: undefined }) } : x).map(x => { if (x.skip === undefined) delete x.skip; return x; });
        const fresh = picked.filter(nm => !itemNamed(nm)).map(nm => { const m = itemMeta(nm) || ['pantry', 'Other', '']; return { household_id: S.household.id, name: nm, qty: 0, par: 0, unit: m[2] || '', location: m[0], category: m[1] }; });
        if (fresh.length) { const ins = await sb.from('pantry_items').insert(fresh); if (ins.error) return fail(ins.error); }
        const up = await sb.from('recipes').update({ ingredients: next }).eq('id', r.id); if (up.error) return fail(up.error);
        r.ingredients = next; await loadAll(); close(); toast('Pantry link saved'); done?.();
      }
    });
  });
}
let wakeLock = null;
function recipeView(id, opts = {}) {
  const r = S.recipes.find(x => x.id === id); if (!r) return;
  let serves = r.servings || 4, cook = !!opts.cook;
  if (cook && navigator.wakeLock) navigator.wakeLock.request('screen').then(w => { wakeLock = w; }).catch(() => { });
  const got = S.checks[id] = S.checks[id] || new Set(), done = S.done[id] = S.done[id] || new Set();
  const cat = RCATS[catOf(r)];
  const html = () => {
    const f = serves / (r.servings || 4);
    const m = recipeMatch(r);
    return `<div class="hero${r.photo_url ? ' has' : ''}" style="--c:${colorOf(r)};${r.photo_url ? `--img:url('${esc(r.photo_url)}')` : ''}"><div class="bar"><button data-close aria-label="Back">‹</button><span class="row"><button id="rphoto" aria-label="Add your photo">📷</button><button id="rfav" aria-label="Favorite">${r.favorite ? '★' : '☆'}</button><button id="redit" aria-label="Edit">✎</button></span></div>
    ${r.photo_url ? '<span class="e" style="visibility:hidden;height:30px"></span>' : `<span class="e">${emojiOf(r)}</span>`}<h1>${esc(r.title)}</h1>
    <div class="meta"><span>${cat[0]}</span>${r.time_min ? `<span>⏱ ${fmtTime(r.time_min)}</span>` : ''}<span>Serves ${r.servings || 4}</span>${m.total ? `<span>${m.have}/${m.total} at home</span>` : ''}</div></div>
    <div class="rbody${cook ? ' cook' : ''}">
    <div class="row"><div class="rate" aria-label="Rating">${[1, 2, 3, 4, 5].map(n => `<button data-rate="${n}" class="${(r.rating || 0) >= n ? 'on' : ''}" aria-label="${n} stars">★</button>`).join('')}</div><span class="sp"></span><button class="btn sm ${cook ? '' : 'ghost'}" id="rcook">${svg('fire')} ${cook ? 'Cooking' : 'Cook mode'}</button></div>
    ${`<h3>In these books</h3><div class="bchips">${S.books.map(b => `<button class="bchip" style="--c:${esc(b.color)}" data-tbook="${b.id}" aria-pressed="${(r.books || []).includes(b.id)}">${esc(b.emoji)} ${esc(b.name)}</button>`).join('')}<button class="bchip pr-new" data-tbooknew="1">＋ New book</button></div>`}
    ${isTodo(r) ? `<div class="banner flame" style="margin-top:16px"><span class="em">✍️</span><span class="sp"><b>No recipe written down yet</b><p>Tap edit to add the ingredients and steps.</p></span></div>` : ''}
    ${(r.ingredients || []).length ? `<div class="row" style="margin-top:22px;margin-bottom:6px"><h3 class="sp" style="margin:0">Ingredients</h3><span class="stepper"><button id="rm" aria-label="Fewer servings">−</button><span>Serves ${serves}</span><button id="rp" aria-label="More servings">+</button></span></div>
    <ul class="ings">${r.ingredients.map((i, n) => { const q = fmtQty(i.qty ? i.qty * f : null); return `<li data-ing="${n}" class="${got.has(n) ? 'got' : ''}"><span class="box">${got.has(n) ? '✓' : ''}</span><span class="txt">${q || i.unit ? `<b>${esc([q, i.unit].filter(Boolean).join(' '))}</b> ` : ''}${esc(i.name)}<span class="links">${linkChips(i, n)}</span></span></li>`; }).join('')}</ul>` : ''}
    ${(r.steps || []).length ? `<h3>Steps</h3><ol class="steps">${r.steps.map((s, n) => `<li data-stp="${n}" class="${done.has(n) ? 'done' : ''}"><span>${esc(s)}</span></li>`).join('')}</ol>` : ''}
    ${r.notes ? `<h3>Notes</h3><div class="note">${esc(r.notes)}</div>` : ''}
    ${r.source_url ? `<p><span role="link" tabindex="0" data-ext="${esc(r.source_url)}" style="color:var(--greend);font-weight:700;text-decoration:underline">Open the original ↗</span></p>` : ''}
    <div class="actions">${isMeal(r) ? `<button class="btn" id="rplan">${svg('cal')} Plan it</button>` : ''}${(r.ingredients || []).length ? `<button class="btn ghost" id="rmiss">${svg('cart')} Add missing</button>` : ''}</div>
    ${creditLine(r, 'recipes')}
    <p class="imeta" style="margin-top:16px">${[r.found_in ? 'From ' + r.found_in : '', 'Added by ' + (memberById(r.created_by)?.display_name || 'family'), (r.tags || []).join(', ')].filter(Boolean).map(esc).join(' · ')}</p></div>`;
  };
  sheet(html(), (el, close) => {
    const box = el.querySelector('[role=dialog]');
    const redraw = () => { const y = box.scrollTop; box.innerHTML = html(); box.scrollTop = y; };
    el.addEventListener('click', async e => {
      const t = e.target;
      if (t.closest('#rm')) { serves = Math.max(1, serves - 1); return redraw(); }
      if (t.closest('#rp')) { serves = Math.min(60, serves + 1); return redraw(); }
      const pi = t.closest('[data-pitem]'); if (pi) { if (pi.dataset.pitem) pantryEditor(pi.dataset.pitem); else linkPicker(r, +pi.dataset.ln, redraw); return; }
      const sr = t.closest('[data-subr]'); if (sr) return recipeView(sr.dataset.subr);
      const rl = t.closest('[data-relink]'); if (rl) return linkPicker(r, +rl.dataset.relink, redraw);
      const ing = t.closest('[data-ing]'); if (ing) { const n = Number(ing.dataset.ing); got.has(n) ? got.delete(n) : got.add(n); return redraw(); }
      const stp = t.closest('[data-stp]'); if (stp) { const n = Number(stp.dataset.stp); done.has(n) ? done.delete(n) : done.add(n); return redraw(); }
      if (t.closest('#rcook')) { cook = !cook; try { if (cook && navigator.wakeLock) wakeLock = await navigator.wakeLock.request('screen'); else { wakeLock?.release(); wakeLock = null; } } catch (_) { } toast(cook ? 'Cook mode: bigger text, screen stays on' : 'Cook mode off'); return redraw(); }
      const rt = t.closest('[data-rate]'); if (rt) { const n = Number(rt.dataset.rate); r.rating = r.rating === n ? null : n; redraw(); const u = await sb.from('recipes').update({ rating: r.rating }).eq('id', r.id); if (u.error) fail(u.error); return; }
      if (t.closest('[data-tbooknew]')) { bookEditor(null, { onSaved: async id => { r.books = [...(r.books || []), id]; const u = await sb.from('recipes').update({ books: r.books }).eq('id', r.id); if (u.error) return fail(u.error); redraw(); toast('Added to the new book'); } }); return; }
      const tb = t.closest('[data-tbook]'); if (tb) { const b = tb.dataset.tbook; r.books = (r.books || []).includes(b) ? r.books.filter(x => x !== b) : [...(r.books || []), b]; redraw(); const u = await sb.from('recipes').update({ books: r.books }).eq('id', r.id); if (u.error) fail(u.error); return; }
      if (t.closest('#rfav')) { r.favorite = !r.favorite; redraw(); const u = await sb.from('recipes').update({ favorite: r.favorite }).eq('id', r.id); if (u.error) fail(u.error); return; }
      if (t.closest('#redit')) { el.remove(); return recipeEditor(id); }
      if (t.closest('#rphoto') || t.closest('[data-ownphoto]')) return setOwnPhoto('recipes', r, redraw);
      if (t.closest('#rplan')) return planRecipe(r);
      if (t.closest('#rmiss')) { const f = serves / (r.servings || 4); return chooseList(`Add what's missing for ${r.title}`, id => addBuys(id, missingBuys(r, f))); }
    });
  }, { full: true, onClose: () => { wakeLock?.release(); wakeLock = null; } });
}
function planRecipe(r) {
  const days = [...Array(14)].map((_, i) => ymd(addDays(new Date(), i)));
  sheet(`<h2>Plan ${esc(r.title)}</h2><p class="lede">Pick a night</p><div class="card flat" style="padding:4px 14px">${days.map(d => { const p = S.plan.find(x => x.day === d); const dt = parseYmd(d); const cur = p ? (p.kind === 'cook' && dishesOf(p).length ? 'Adds to: ' + dishesOf(p).map(x => x.title).join(', ') : 'Replaces: ' + (p.place_name || p.title || KINDS[p.kind])) : ''; return `<button class="item" data-pday="${d}" style="all:unset;display:grid;grid-template-columns:minmax(0,1fr) auto;width:100%;padding:12px 0;border-bottom:1px solid var(--line);cursor:pointer"><span><span class="iname">${d === ymd(new Date()) ? 'Tonight' : dt.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</span>${cur ? `<span class="imeta" style="display:block">${esc(cur)}</span>` : ''}</span><span class="imeta">›</span></button>`; }).join('')}</div>`, (el, close) => {
    el.addEventListener('click', async e => { const b = e.target.closest('[data-pday]'); if (!b) return; const d = b.dataset.pday;
      try { await addDishToDay(d, r.id); } catch (er) { return fail(er); }
      await loadAll(); el.remove(); toast(`${r.title} planned for ${parseYmd(d).toLocaleDateString(undefined, { weekday: 'long' })}`); });
  });
}
function ratePrompt(r, rest = []) {
  sheet(`<h2>How was it?</h2><p class="lede">${esc(r.title)}</p><div class="rate" style="justify-content:center">${[1, 2, 3, 4, 5].map(n => `<button data-r="${n}" style="font-size:40px" class="${(r.rating || 0) >= n ? 'on' : ''}" aria-label="${n} stars">★</button>`).join('')}</div><button class="btn ghost wide" data-close style="margin-top:12px">Skip</button>`, (el) => {
    el.addEventListener('click', async e => { const b = e.target.closest('[data-r]'); if (!b) return; const u = await sb.from('recipes').update({ rating: Number(b.dataset.r) }).eq('id', r.id); if (u.error) return fail(u.error); await loadAll(); el.close(); if (rest.length) ratePrompt(rest[0], rest.slice(1)); else toast('Thanks — rated'); });
    el.querySelector('[data-close]').addEventListener('click', () => { if (rest.length) setTimeout(() => ratePrompt(rest[0], rest.slice(1)), 50); });
  });
}

// ---------- recipe editor ----------
function recipeEditor(id, draft, opts = {}) {
  const r = S.recipes.find(x => x.id === id) || { title: '', servings: 4, time_min: '', tags: [], ingredients: [], steps: [], notes: '', kind: 'meal', category: '', books: S.book ? [S.book] : [], ...(draft || {}) };
  const st = { kind: kindOf(r), books: [...(r.books || [])] };
  sheet(`<h2>${id ? 'Edit recipe' : 'New recipe'}</h2><form id="rform">
  <label for="rt">Name</label><input type="text" id="rt" value="${esc(r.title)}" required maxlength="120" placeholder="Grandma's cheese dip">
  <label>Where it goes</label><div class="switch" style="margin:0"><button type="button" data-rk="meal" aria-pressed="${st.kind === 'meal'}">🍽 Meal</button><button type="button" data-rk="component" aria-pressed="${st.kind === 'component'}">🫙 Sauce or staple</button></div>
  <label for="rc">Type</label><select id="rc" data-add="rcat">${Object.entries(RCATS).map(([k, v]) => `<option value="${k}" ${catOf(r) === k ? 'selected' : ''}>${v[1]} ${v[0]}</option>`).join('')}</select>
  ${`<label>Cookbooks</label><div class="bchips" id="rbooks">${S.books.map(b => `<button type="button" class="bchip" style="--c:${esc(b.color)}" data-eb="${b.id}" aria-pressed="${st.books.includes(b.id)}">${esc(b.emoji)} ${esc(b.name)}</button>`).join('')}<button type="button" class="bchip pr-new" data-ebnew="1">＋ New book</button></div>`}
  <div class="grid2"><div><label for="rsv">Serves</label><input type="number" id="rsv" min="1" max="50" value="${r.servings}"></div><div><label for="rtm">Minutes</label><input type="number" id="rtm" min="0" max="1440" value="${r.time_min ?? ''}"></div></div>
  <label for="rig">Ingredients, one per line</label><textarea id="rig" placeholder="2 cup rice&#10;1 lb chicken thighs&#10;3 clove garlic">${esc((r.ingredients || []).map(ingLine).join('\n'))}</textarea>
  <label for="rst">Steps, one per line</label><textarea id="rst">${esc((r.steps || []).join('\n'))}</textarea>
  <label for="rtg">Tags (comma separated)</label><input type="text" id="rtg" value="${esc((r.tags || []).join(', '))}" placeholder="weeknight, chicken, kid favorite">
  <label for="rno">Notes</label><textarea id="rno" style="min-height:70px" maxlength="1200">${esc(r.notes || '')}</textarea>
  <label for="rsu">Link to the original (optional)</label><input type="url" id="rsu" value="${esc(r.source_url || '')}" placeholder="https://…">
  <div class="row" style="margin-top:18px"><button class="btn" type="submit">Save recipe</button><button class="btn ghost" type="button" data-close>Cancel</button><span class="sp"></span>${id ? '<button class="btn line sm" type="button" id="rdel">Delete</button>' : ''}</div></form>`, (el, close) => {
    el.addEventListener('click', e => {
      const k = e.target.closest('[data-rk]'); if (k) { st.kind = k.dataset.rk; el.querySelectorAll('[data-rk]').forEach(b => b.setAttribute('aria-pressed', b === k)); if (st.kind === 'component' && !COMPONENT_CATS.includes(el.querySelector('#rc').value)) el.querySelector('#rc').value = 'sauce'; return; }
      if (e.target.closest('[data-ebnew]')) { bookEditor(null, { onSaved: id => { st.books.push(id); const nb = S.books.find(x => x.id === id), btn = document.createElement('button'); btn.type = 'button'; btn.className = 'bchip'; btn.style.setProperty('--c', nb.color); btn.dataset.eb = id; btn.setAttribute('aria-pressed', 'true'); btn.textContent = `${nb.emoji} ${nb.name}`; el.querySelector('[data-ebnew]').before(btn); } }); return; }
      const b = e.target.closest('[data-eb]'); if (b) { const v = b.dataset.eb; st.books = st.books.includes(v) ? st.books.filter(x => x !== v) : [...st.books, v]; b.setAttribute('aria-pressed', st.books.includes(v)); }
    });
    el.querySelector('#rform').onsubmit = async e => {
      e.preventDefault(); const g = s => el.querySelector(s).value;
      const row = { household_id: S.household.id, title: g('#rt').trim(), servings: Math.min(50, Math.max(1, Number(g('#rsv')) || 4)), time_min: g('#rtm') ? Math.min(1440, Number(g('#rtm'))) : null, tags: g('#rtg').split(',').map(s => s.trim()).filter(Boolean),
        ingredients: relink(g('#rig').split('\n').map(parseIng).filter(Boolean), r.ingredients || []), steps: g('#rst').split('\n').map(s => s.replace(/^\s*\d+[.)]\s*/, '').trim()).filter(Boolean), notes: g('#rno').trim() || null,
        source_url: /^https?:\/\//i.test(g('#rsu').trim()) ? g('#rsu').trim() : null, kind: st.kind, category: g('#rc'), books: st.books };
      if (!id) { row.created_by = S.session.user.id; if (draft?.found_in) row.found_in = draft.found_in; }
      const q = id ? await sb.from('recipes').update(row).eq('id', id).select().single() : await sb.from('recipes').insert(row).select().single(); if (q.error) return fail(q.error);
      await loadAll(); el.remove(); toast('Saved'); if (opts.onSaved) opts.onSaved(q.data.id); else recipeView(q.data.id);
    };
    el.querySelector('#rdel')?.addEventListener('click', async () => { if (!confirmDel(el)) return; const q = await sb.from('recipes').delete().eq('id', id); if (q.error) return fail(q.error); await loadAll(); close(); toast('Recipe deleted'); });
  });
}
function confirmDel(el) { const b = el.querySelector('#rdel,#bdel'); if (b.dataset.sure) return true; b.dataset.sure = 1; b.textContent = 'Tap again to delete'; return false; }
function bookEditor(id, opts = {}) {
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
      if (opts.onSaved) { await loadAll(); el.remove(); opts.onSaved(q.data.id); return; } S.book = q.data.id; await loadAll(); close(); };
    el.querySelector('#bdel')?.addEventListener('click', async () => { if (!confirmDel(el)) return; const q = await sb.from('recipe_books').delete().eq('id', id); if (q.error) return fail(q.error);
      await Promise.all(S.recipes.filter(r => (r.books || []).includes(id)).map(r => sb.from('recipes').update({ books: r.books.filter(x => x !== id) }).eq('id', r.id))); S.book = null; await loadAll(); close(); toast('Book deleted — its recipes are still in All recipes'); });
  });
}
function addRecipeMenu() {
  sheet(`<h2>Add a recipe</h2><div class="card flat" style="padding:4px 14px">
  ${[['voice', 'mic', 'Describe it out loud', 'Talk through the dish and what’s in it, and we’ll write it up'], ['type', 'pen', 'Type it in', 'Write out ingredients and steps'], ['photo', 'camera', 'Snap a recipe card', 'Handwritten cards, cookbook pages or screenshots'], ['link', 'link', 'Save from a website', 'Paste a link to any recipe page'], ['chef', 'spark', 'Ask the chef', 'Get ideas from what\'s in your pantry']].map(([k, ic, t, d]) => `<button data-add="${k}" style="all:unset;display:grid;grid-template-columns:44px minmax(0,1fr);gap:12px;align-items:center;width:100%;padding:12px 0;border-bottom:1px solid var(--line);cursor:pointer"><span class="tool${k === 'photo' || k === 'chef' ? ' f' : ''}" style="padding:0;border:0;box-shadow:none;background:none"><span class="ico">${svg(ic)}</span></span><span><span class="iname">${t}</span><span class="imeta" style="display:block">${d}</span></span></button>`).join('')}</div>`, (el) => {
    el.addEventListener('click', e => { const b = e.target.closest('[data-add]'); if (!b) return; el.remove(); const k = b.dataset.add;
      if (k === 'voice') voiceRecipe();
      if (k === 'type') recipeEditor(null); if (k === 'photo') captureImage('Snap a recipe', 'Fill the frame with the recipe card or page', recipeFromPhoto); if (k === 'link') recipeFromLink(); if (k === 'chef') chefSheet(); });
  });
}
function draftFromAi(x, found) {
  const ings = (x.ingredients || []).length ? x.ingredients.map(i => typeof i === 'string' ? parseIng(i) : { qty: i.qty ?? null, unit: normUnit(i.unit || ''), name: i.name }) : (x.ingredients_text || []).map(parseIng).filter(Boolean);
  return { title: x.title || '', servings: x.servings || 4, time_min: x.time_min || '', tags: x.tags || [], ingredients: ings, steps: x.steps || [], notes: x.notes || '', source_url: x.source_url || '', category: RCATS[x.category] ? x.category : '', kind: x.kind === 'component' ? 'component' : 'meal', found_in: found, books: S.book ? [S.book] : [] };
}
// ---------- describe a recipe out loud ----------
const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
const canNativeVoice = () => { try { return !!(window.Android && window.Android.startVoice && window.Android.canVoice()); } catch (_) { return false; } };
function voiceRecipe() {
  const native = canNativeVoice(), web = !native && !!SpeechRec;
  let rec = null, listening = false, finalText = '', interim = '';
  const html = `<h2>Describe your recipe</h2>
    <p class="lede">Say what it’s called, what goes in it (amounts if you know them) and how you make it. Ramble, it’s fine. Pause any time and tap the mic again to keep going.</p>
    <div class="vbox"><button type="button" class="vmic" id="vmic" aria-label="Start talking">${svg('mic')}</button><p class="vstat" id="vstat">${native || web ? 'Tap to start talking' : 'Tap the 🎤 on your keyboard to dictate, or type it out'}</p></div>
    <label for="vtx">What we heard <span class="imeta">(fix anything it got wrong)</span></label>
    <textarea id="vtx" rows="7" placeholder="“My mama’s chicken spaghetti. You boil a whole chicken, shred it, then a can of Rotel, a block of Velveeta, a can of cream of chicken, a pound of spaghetti… bake it at 350 till it’s bubbly.”"></textarea>
    <div class="row" style="margin-top:14px;gap:8px"><button class="btn" id="vgo">${svg('spark')} Write up the recipe</button><button class="btn ghost" type="button" data-close>Cancel</button></div>`;
  sheet(html, (el, close) => {
    const tx = el.querySelector('#vtx'), stat = el.querySelector('#vstat'), mic = el.querySelector('#vmic');
    const show = () => { tx.value = (finalText + (interim ? ' ' + interim : '')).trim(); };
    const setListening = on => { listening = on; mic.classList.toggle('on', on); mic.setAttribute('aria-label', on ? 'Stop' : (finalText ? 'Keep talking' : 'Start talking')); stat.textContent = on ? 'Listening… tap to stop' : (finalText ? 'Tap the mic to keep talking' : 'Tap to start talking'); };
    tx.addEventListener('input', () => { finalText = tx.value; interim = ''; });
    window.__voiceResult = (text, err) => { setListening(false); if (err === 'unavailable') { stat.textContent = 'Voice isn’t available on this phone. Type it, or use your keyboard’s mic.'; return; } if (text) { finalText = (finalText + ' ' + text).trim(); show(); } };
    mic.onclick = () => {
      if (native) { setListening(true); window.Android.startVoice('Describe your recipe'); return; }
      if (!web) { tx.focus(); return; }
      if (listening) { rec?.stop(); return; }
      rec = new SpeechRec(); rec.lang = navigator.language || 'en-US'; rec.continuous = true; rec.interimResults = true;
      rec.onresult = e => { interim = ''; for (let i = e.resultIndex; i < e.results.length; i++) { const t = e.results[i][0].transcript; if (e.results[i].isFinal) finalText = (finalText + ' ' + t).trim(); else interim += t; } show(); };
      rec.onerror = e => { setListening(false); if (e.error === 'not-allowed') stat.textContent = 'Allow microphone access to talk, or type it out.'; };
      rec.onend = () => { interim = ''; show(); setListening(false); };
      try { rec.start(); setListening(true); } catch (_) { setListening(false); }
    };
    el.querySelector('#vgo').onclick = async () => {
      try { rec?.stop(); } catch (_) { }
      const t = tx.value.trim(); if (t.length < 8) { stat.textContent = 'Say or type a little more about the dish first.'; return; }
      busy(el, 'Writing up your recipe…');
      try {
        const out = await ai('recipe_voice', { transcript: t });
        const d = draftFromAi(out.recipe || {}, 'Described out loud');
        const est = (out.estimated || []).filter(Boolean);
        d.notes = [est.length ? `Filled in by the chef, check these: ${est.join(', ')}.` : '', d.notes || ''].filter(Boolean).join('\n\n');
        if (est.length && !(d.tags || []).includes('to personalize')) d.tags = [...(d.tags || []), 'to personalize'];
        window.__voiceResult = null; el.remove(); recipeEditor(null, d);
      } catch (er) { el.remove(); fail(er); }
    };
  }, { onClose: () => { try { rec?.stop(); } catch (_) { } window.__voiceResult = null; } });
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
          if (sv.dataset.plan != null && day) await addDishToDay(day, ins.data.id);
          await loadAll(); document.querySelectorAll('.sheet').forEach(s => s.remove()); render(); toast(sv.dataset.plan != null ? 'Saved and planned' : 'Saved to your cookbooks');
        });
      } catch (er) { el.remove(); fail(er); }
    };
  });
}

// ---------- camera ----------
// ---------- barcode reading (native detector when it really works, ZXing otherwise) ----------
const BC_FORMATS = ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128'];
let nativeBcOK = null;
async function makeReader() {
  if (nativeBcOK !== false && 'BarcodeDetector' in window) {
    try { const f = await BarcodeDetector.getSupportedFormats(); const want = BC_FORMATS.filter(x => f.includes(x)); if (want.length) return { kind: 'native', d: new BarcodeDetector({ formats: want }) }; } catch (_) { }
    nativeBcOK = false;
  }
  const Z = await loadZxing(); const hints = new Map();
  hints.set(Z.DecodeHintType.POSSIBLE_FORMATS, [Z.BarcodeFormat.EAN_13, Z.BarcodeFormat.EAN_8, Z.BarcodeFormat.UPC_A, Z.BarcodeFormat.UPC_E, Z.BarcodeFormat.CODE_128]); hints.set(Z.DecodeHintType.TRY_HARDER, true);
  const reader = new Z.MultiFormatReader(); reader.setHints(hints); return { kind: 'zx', Z, reader };
}
function zxDecode(r, canvas) {
  const { Z, reader } = r;
  for (const Bin of [Z.HybridBinarizer, Z.GlobalHistogramBinarizer]) { try { const res = reader.decode(new Z.BinaryBitmap(new Bin(new Z.HTMLCanvasElementLuminanceSource(canvas)))); if (res) return res.getText(); } catch (_) { } }
  return null;
}
/** Try to read a barcode from a canvas; falls back from the native detector to ZXing if the native one errors. */
async function readCode(r, canvas) {
  if (r.kind === 'native') {
    try { const out = await r.d.detect(canvas); nativeBcOK = true; return out[0]?.rawValue || null; }
    catch (_) { nativeBcOK = false; const z = await makeReader(); Object.assign(r, z); return zxDecode(r, canvas); }
  }
  return zxDecode(r, canvas);
}
const drawTo = (src, w, h, sx = 0, sy = 0, sw, sh, rot = 0) => { const c = document.createElement('canvas'); c.width = rot ? h : w; c.height = rot ? w : h; const g = c.getContext('2d'); if (rot) { g.translate(c.width / 2, c.height / 2); g.rotate(rot * Math.PI / 180); g.translate(-w / 2, -h / 2); } g.drawImage(src, sx, sy, sw ?? (src.videoWidth || src.naturalWidth || src.width), sh ?? (src.videoHeight || src.naturalHeight || src.height), 0, 0, w, h); return c; };
async function readCodeFromFile(file) {
  const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('Could not read that photo')); i.src = URL.createObjectURL(file); });
  const r = await makeReader(), W = img.naturalWidth, H = img.naturalHeight;
  for (const max of [1600, 1100, 800]) for (const rot of [0, 90]) {
    const sc = Math.min(1, max / Math.max(W, H)), code = await readCode(r, drawTo(img, Math.round(W * sc), Math.round(H * sc), 0, 0, W, H, rot));
    if (code) { URL.revokeObjectURL(img.src); return code; }
  }
  URL.revokeObjectURL(img.src); return null;
}
function openCamera({ title, hint, barcode, onFrame, onPick }) {
  let stream = null, timer = null, stopped = false;
  const stop = () => { stopped = true; clearInterval(timer); stream?.getTracks().forEach(t => t.stop()); };
  const el = sheet(`<h2>${esc(title)}</h2><div class="cam"><video playsinline muted autoplay></video>${barcode ? '<div class="reticle"></div>' : ''}<div class="hint">${esc(hint)}</div></div>
    ${barcode ? '' : '<button class="shutter" id="shoot" aria-label="Take photo" disabled></button>'}
    <div class="camopts"><label class="btn sm">${svg('camera')} ${barcode ? 'Photo of the barcode' : 'Use phone camera'}<input type="file" accept="image/*" capture="environment" class="campick" hidden></label>
      <label class="btn sm ghost">Choose from photos<input type="file" accept="image/*" class="campick" hidden></label>
      ${barcode ? '<button class="btn sm ghost" id="typec">Type the number</button>' : ''}</div>
    ${barcode ? `<form id="typeform" class="row" style="flex-wrap:nowrap;margin-top:10px" hidden><input type="text" id="typenum" inputmode="numeric" pattern="[0-9]*" placeholder="Numbers under the barcode" autocomplete="off"><button class="btn" type="submit">Look up</button></form>` : ''}`, async (el) => {
    const video = el.querySelector('video'), hintEl = el.querySelector('.hint');
    el.querySelectorAll('.campick').forEach(inp => inp.onchange = async e => {
      const f = e.target.files[0]; if (!f) return;
      if (!barcode) { stop(); el.remove(); return onPick(f); }
      hintEl.textContent = 'Reading the barcode in your photo…';
      try { const code = await readCodeFromFile(f); if (code) { stop(); el.remove(); return onFrame(code); } hintEl.textContent = 'Couldn’t find a barcode in that photo. Try closer, flat and in good light, or type the number.'; }
      catch (er) { hintEl.textContent = er.message; }
      e.target.value = '';
    });
    el.querySelector('#typec')?.addEventListener('click', () => { const f = el.querySelector('#typeform'); f.hidden = false; f.querySelector('input').focus(); });
    el.querySelector('#typeform')?.addEventListener('submit', e => { e.preventDefault(); const c = el.querySelector('#typenum').value.replace(/\D/g, ''); if (c.length < 6 || c.length > 14) { hintEl.textContent = 'Barcodes are 8 to 13 digits — check the number.'; return; } stop(); el.remove(); onFrame(c); });
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false });
      if (stopped) return stop(); video.srcObject = stream; await video.play().catch(() => { });
    } catch (e) { hintEl.textContent = `Live camera unavailable. Use ${barcode ? '“Photo of the barcode”' : '“Use phone camera”'} below instead.`; return; }
    const ready = () => video.videoWidth > 0 && video.readyState >= 2;
    const shoot = el.querySelector('#shoot');
    const arm = () => { if (shoot) shoot.disabled = false; };
    if (ready()) arm(); else video.addEventListener('loadeddata', arm, { once: true });
    setTimeout(() => { if (!stopped && !ready()) hintEl.textContent = 'The live preview didn’t start. Use the buttons below instead.'; }, 4000);
    shoot?.addEventListener('click', async () => { if (!ready()) return; const b64 = await imageToBase64(video, 2000); stop(); el.remove(); onFrame(b64); });
    if (barcode) {
      let r = null; try { r = await makeReader(); } catch (e) { hintEl.textContent = e.message + '. Use a photo or type the number.'; return; }
      let busyScan = false, tick = 0;
      timer = setInterval(async () => {
        if (busyScan || stopped || !ready()) return; busyScan = true; tick++;
        try {
          const w = video.videoWidth, h = video.videoHeight; let c;
          if (tick % 2) { const cw = Math.round(w * .8), chh = Math.round(h * .45), sc = Math.min(1, 1280 / cw); c = drawTo(video, Math.round(cw * sc), Math.round(chh * sc), (w - cw) / 2, (h - chh) / 2, cw, chh); }
          else { const sc = Math.min(1, 1280 / w); c = drawTo(video, Math.round(w * sc), Math.round(h * sc)); }
          const code = await readCode(r, c);
          if (code && /^\d{6,14}$/.test(code)) { navigator.vibrate?.(60); stop(); el.remove(); onFrame(code); }
        } catch (_) { } finally { busyScan = false; }
      }, 250);
    }
  }, { onClose: stop });
}
/** Receipts: sharp, full-resolution photos from the phone's camera; up to 3 for long receipts. */
/** After a receipt is read: confirm the total (logged as spending) and, for groceries, which items go in the pantry. */
function receiptReview(el, out, opts = {}) {
  const today = ymd(new Date()), d0 = /^\d{4}-\d{2}-\d{2}$/.test(out.date || '') && out.date <= today && out.date >= ymd(addDays(new Date(), -90)) ? out.date : today;
  const st = { kind: ['groceries', 'out', 'takeout'].includes(out.kind) ? out.kind : 'groceries', total: out.total != null ? Number(out.total) : '', store: out.store || '', day: d0, add: !opts.itemsOff };
  const items = (out.items || []).map(x => ({ ...x, on: true }));
  const n = () => st.kind === 'groceries' && st.add ? items.filter(x => x.on).length : 0;
  const label = () => { const amt = Number(st.total); return `${amt > 0 ? `Log ${money(amt)}` : 'Log it'}${n() ? ` + add ${n()} item${n() === 1 ? '' : 's'}` : ''}`; };
  const draw = () => `<h2>${st.store ? esc(st.store) : 'Your receipt'}</h2><p class="lede">Check the total, then log it.${out.total == null ? ' We couldn’t read the total. Type it in.' : ''}</p>
    <div class="seg">${[['groceries', 'Groceries'], ['out', 'Eating out'], ['takeout', 'Takeout']].map(([k, l]) => `<button type="button" data-rk="${k}" style="--k:var(--${k === 'groceries' ? 'leftovers' : k})" aria-pressed="${st.kind === k}">${l}</button>`).join('')}</div>
    <div class="grid2"><div><label for="rtot">Total paid</label><input type="number" id="rtot" min="0" step="0.01" inputmode="decimal" value="${st.total}" placeholder="$0.00"></div><div><label for="rday">Date</label><input type="date" id="rday" value="${st.day}" max="${today}"></div></div>
    <label for="rsto">Store</label><input type="text" id="rsto" value="${esc(st.store)}" maxlength="60" placeholder="e.g. Kroger">
    ${st.kind === 'groceries' && items.length ? `<label class="tog" style="margin-top:16px"><input type="checkbox" id="radd" ${st.add ? 'checked' : ''}><span>Also add items to the pantry</span></label>
      ${st.add ? `<div class="card flat" style="padding:4px 12px;margin-top:8px;max-height:36vh;overflow:auto">${items.map((x, i) => `<div class="chk"><input type="checkbox" data-on="${i}" ${x.on ? 'checked' : ''} aria-label="Add ${esc(x.name)}"><span><input type="text" data-nm="${i}" value="${esc(x.name)}" style="margin:0;padding:6px 8px;min-height:36px"></span><span class="imeta">${x.qty || 1}${x.unit ? ' ' + esc(x.unit) : ''}</span></div>`).join('')}</div>` : ''}` : ''}
    <button class="btn wide" id="rsave" style="margin-top:14px">${label()}</button><button class="btn ghost wide" data-close style="margin-top:8px">Cancel</button>`;
  const box = el.querySelector('[role=dialog]'), keep = () => { const g = q => el.querySelector(q); if (g('#rtot')) st.total = g('#rtot').value; if (g('#rday')) st.day = g('#rday').value; if (g('#rsto')) st.store = g('#rsto').value; };
  const redraw = () => { keep(); box.innerHTML = draw(); };
  box.innerHTML = draw();
  el.addEventListener('input', e => { if (e.target.id === 'rtot') { st.total = e.target.value; el.querySelector('#rsave').textContent = label(); } if (e.target.dataset.nm != null) items[+e.target.dataset.nm].name = e.target.value; });
  el.addEventListener('change', e => { const t = e.target; if (t.id === 'radd') { st.add = t.checked; return redraw(); } if (t.dataset.on != null) { items[+t.dataset.on].on = t.checked; el.querySelector('#rsave').textContent = label(); } });
  el.addEventListener('click', async e => {
    const k = e.target.closest('[data-rk]'); if (k) { st.kind = k.dataset.rk; return redraw(); }
    if (!e.target.closest('#rsave')) return;
    keep(); const amt = Number(st.total), pick = n() ? items.filter(x => x.on && x.name.trim()) : [];
    if (!(amt > 0) && !pick.length) { el.querySelector('#rtot').focus(); return toast('Enter the total from the receipt'); }
    busy(el, 'Saving…');
    try {
      let msg = '';
      if (amt > 0) { const r = await sb.from('spending').insert({ household_id: S.household.id, kind: st.kind, amount: Math.round(amt * 100) / 100, day: st.day || today, note: st.store.trim() || null, added_by: S.session.user.id }); if (r.error) throw r.error; msg = `Logged ${money(amt)}${st.store ? ' at ' + st.store.trim() : ''}`; }
      if (pick.length) { const a = await addToPantry(pick.map(x => ({ name: x.name.trim(), qty: x.qty, unit: x.unit, category: x.category, expires_on: x.expires_days ? ymd(addDays(new Date(), x.expires_days)) : null }))); msg += `${msg ? ' · ' : ''}${a.added + a.updated} items in the pantry`;
        const off = await clearBoughtFromList(pick.map(x => x.name.trim())); if (off) msg += ` · ${off} off the list`; }
      await loadAll(); el.remove(); render(); toast(msg);
    } catch (er) { el.remove(); fail(er); }
  });
}
function receiptFlow(opts = {}) {
  const shots = [];
  const draw = () => `<h2>${opts.spend ? 'Log a purchase' : 'Scan a receipt'}</h2><p class="lede">${opts.spend ? 'Snap the receipt and we’ll log the total. Grocery items can go straight into the pantry.' : 'We’ll log what you spent and add the items to your pantry.'} Lay it flat in good light. Long receipt? Take it in 2 or 3 photos, top to bottom.</p>
    ${shots.length ? `<div class="shots">${shots.map((x, i) => `<span class="shot" style="background-image:url('${x.url}')"><button type="button" data-unshot="${i}" aria-label="Remove photo ${i + 1}">×</button><b>${i + 1}</b></span>`).join('')}</div>` : ''}
    <div class="camopts" style="margin-top:12px">${shots.length < 3 ? `<label class="btn">${svg('camera')} ${shots.length ? 'Add the next part' : 'Take a photo'}<input type="file" accept="image/*" capture="environment" class="rpick" hidden></label><label class="btn ghost">Choose from photos<input type="file" accept="image/*" class="rpick" hidden></label>` : ''}</div>
    ${shots.length ? `<button class="btn wide flame" id="rread" style="margin-top:14px">${svg('spark')} Read ${shots.length > 1 ? `${shots.length} photos` : 'the receipt'}</button>` : ''}
    <p style="text-align:center;margin:14px 0 0"><button type="button" class="linkbtn" id="rtype">No receipt? Type the amount</button></p>`;
  sheet(draw(), (el, close) => {
    const box = el.querySelector('[role=dialog]'), redraw = () => { box.innerHTML = draw(); };
    el.addEventListener('change', e => { if (!e.target.classList.contains('rpick')) return; const f = e.target.files[0]; if (f) { shots.push({ f, url: URL.createObjectURL(f) }); redraw(); } });
    el.addEventListener('click', async e => {
      const u = e.target.closest('[data-unshot]'); if (u) { shots.splice(+u.dataset.unshot, 1); return redraw(); }
      if (e.target.closest('#rtype')) { el.remove(); return spendEditor('groceries'); }
      if (!e.target.closest('#rread')) return;
      const files = shots.map(x => x.f); el.remove(); pantryPhoto({ files }, 'receipt_photo', opts);
    });
  });
}
function scanBarcodeFlow() {
  openCamera({ title: 'Scan a barcode', hint: 'Line the barcode up inside the box', barcode: true, onPick: () => { }, onFrame: async code => {
    const existing = S.pantry.find(p => p.barcode === code);
    if (existing) { const u = await sb.from('pantry_items').update({ qty: Number(existing.qty) + 1, updated_at: new Date().toISOString() }).eq('id', existing.id); if (u.error) return fail(u.error); await loadAll(); render(); toast(`Added one more ${existing.name}`); return; }
    toast('Looking up the product…');
    const info = await lookupBarcode(code);
    pantryEditor(null, { name: info?.name || '', category: info?.category || 'Pantry', qty: 1, unit: '', barcode: code, size: info?.size || '' });
    if (!info) toast('Not in the product database — type the name once and it will be remembered');
  } });
}
async function pantryPhoto(src, mode, opts = {}) {
  const el = sheet('', null); busy(el, mode === 'receipt_photo' ? 'Reading the receipt…' : 'Spotting what\'s on the shelves…');
  try {
    const big = mode === 'receipt_photo' ? 2200 : 1600;
    const images = src.files ? await Promise.all(src.files.map(f => imageToBase64(f, big))) : [src.b64 || await imageToBase64(src, big)];
    const out = await ai(mode, { image: images[0], images, media_type: 'image/jpeg' });
    if (mode === 'receipt_photo') return receiptReview(el, out, opts);
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
      try { const r = await addToPantry(pick.map(x => ({ name: x.name.trim(), qty: x.qty, unit: x.unit, category: x.category, expires_on: x.expires_days ? ymd(addDays(new Date(), x.expires_days)) : null }))); const off = await clearBoughtFromList(pick.map(x => x.name.trim())); await loadAll(); el.remove(); render(); toast([r.added && `Added ${r.added} new item${r.added > 1 ? 's' : ''}`, r.updated && `topped up ${r.updated}`, off && `${off} off the list`].filter(Boolean).join(', ')); if (mode === 'receipt_photo') spendEditor('groceries'); } catch (er) { el.remove(); fail(er); } });
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
let pantryT;
document.addEventListener('keydown', e => { const z = e.target.closest?.('[data-zone]'); if (z && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); z.dispatchEvent(new MouseEvent('click', { bubbles: true })); } });
document.addEventListener('click', async e => {
  const t = e.target.closest('[data-lst],[data-tab],[data-day],[data-week],[data-act],[data-edit-pantry],[data-recipe],[data-check],[data-delitem],[data-dq],[data-rview],[data-book],[data-pview],[data-zone],[data-zone-go]');
  if (!t || t.closest('.sheet')) return;
  try {
    if (t.dataset.lst != null) { S.listId = t.dataset.lst || null; render(); $('#main').scrollTop = 0; return; }
    if (t.dataset.tab) { S.tab = t.dataset.tab; render(); $('#main').scrollTop = 0; return; }
    if (t.dataset.day) return dayEditor(t.dataset.day);
    if (t.dataset.week) { S.weekStart = ymd(addDays(parseYmd(S.weekStart), Number(t.dataset.week))); return render(); }
    if (t.dataset.editPantry) return pantryEditor(t.dataset.editPantry);
    if (t.dataset.recipe) return recipeView(t.dataset.recipe);
    if (t.dataset.rview) { S.rview = t.dataset.rview; return render(); }
    if (t.dataset.pview) { S.pview = t.dataset.pview; S.zone = null; render(); $('#main').scrollTop = 0; return; }
    if (t.dataset.zone) { S.zone = t.dataset.zone; S.pantryQ = ''; render(); $('#main').scrollTop = 0; return; }
    if (t.dataset.zoneGo != null) { S.zone = null; render(); return; }
    if (t.dataset.book != null) { S.book = t.dataset.book || null; return render(); }
    if (t.dataset.dq) { const p = S.pantry.find(x => x.id === t.dataset.dq); const q = Math.max(0, Math.round((Number(p.qty) + Number(t.dataset.d)) * 100) / 100); const wasLow = isLow(p); p.qty = q; render(); const r = await sb.from('pantry_items').update({ qty: q, updated_at: new Date().toISOString() }).eq('id', p.id); if (r.error) return fail(r.error);
      if (wasLow !== isLow(p)) toast(isLow(p) ? `${p.name} added to the shopping list` : `${p.name} is stocked — off the list`);
      clearTimeout(pantryT); pantryT = setTimeout(async () => { try { await loadAll(); if (!$('.sheet')) render(); } catch (_) { } }, 900); return; }
    if (t.dataset.check) { const l = S.list.find(x => x.id === t.dataset.check); l.checked = t.checked; render(); const r = await sb.from('shopping_items').update({ checked: l.checked }).eq('id', l.id); if (r.error) fail(r.error); return; }
    if (t.dataset.delitem) { const it = S.list.find(x => x.id === t.dataset.delitem); S.list = S.list.filter(x => x.id !== t.dataset.delitem); render(); quietUntil = Date.now() + 2500;
      const r = it && !it.list_id && !it.checked && (it.source === 'plan' || it.source === 'par') ? await sb.from('shopping_items').update({ source: 'skip' }).eq('id', it.id).then(x => { if (!x.error) (S.skips = S.skips || []).push({ ...it, source: 'skip' }); return x; }) : await sb.from('shopping_items').delete().eq('id', t.dataset.delitem); if (r.error) fail(r.error); return; }
    const a = t.dataset.act;
    if (a === 'addpantry') return pantryEditor(null);
    if (a === 'addstaple') return pantryEditor(null, { par: 1, qty: 1 });
    if (a === 'staples') return addStaples(t);
    if (a === 'scanbarcode') return scanBarcodeFlow();
    if (a === 'snappantry') return captureImage('Snap your shelves', 'Fridge, freezer, pantry or a counter of groceries', src => pantryPhoto(src, 'pantry_photo'));
    if (a === 'snapreceipt') return receiptFlow();
    if (a === 'addrecipe') return addRecipeMenu();
    if (a === 'chef') return chefSheet();
    if (a === 'newbook') return bookEditor(null);
    if (a === 'newspot') { const got = await ADDERS.location(); if (got) { render(); toast(`${LOCS[got.value][0]} added. Choose it under “Where it lives” on any item.`); } return; }
    if (a === 'importcsv') return importCSVSheet();
    if (a === 'editbook') return bookEditor(S.book);
    if (a === 'logspend') return receiptFlow({ spend: true });
    if (a === 'buildlist') { t.disabled = true; await buildList(); return; }
    if (a === 'putaway') return checkedToPantry();
    if (a === 'newlist') return listEditor(null);
    if (a === 'editlist') return listEditor(S.listId);
    if (a === 'clearchecked') { const ids = itemsOn(S.listId).filter(l => l.checked).map(l => l.id); if (!ids.length) return; const r = await sb.from('shopping_items').delete().in('id', ids); if (r.error) return fail(r.error); await loadAll(); render(); return toast(`Cleared ${ids.length}`); }
    if (a === 'listrecipes') { const lid = S.listId; return dishPicker([], ids => { const buys = ids.map(id => S.recipes.find(r => r.id === id)).filter(Boolean).flatMap(r => missingBuys(r, 1)); const seen = new Map(); for (const b of buys) { const k = b.name.toLowerCase(); if (seen.has(k)) { const c = seen.get(k); if (c.qty && b.qty && c.unit === b.unit) c.qty += b.qty; } else seen.set(k, { ...b }); } addBuys(lid, [...seen.values()]); }); }
    if (a === 'importlib') return importLibrary(t);
    if (a === 'sethome') return homeEditor();
    if (a === 'theme') return setTheme(isDark() ? 'light' : 'dark');
    if (t.dataset.themeSet) return setTheme(t.dataset.themeSet);
    if (a === 'calconnect') return connectCalendar();
    if (a === 'calsync') { t.disabled = true; t.textContent = 'Syncing…'; const s = await calFn({ action: 'sync', force: true }); await loadCalendar(); render(); const e = (s.results || []).find(x => x.error); toast(e ? e.error : 'Schedule synced'); return; }
    if (a === 'caldisconnect') { t.disabled = true; await calFn({ action: 'disconnect' }); await loadCalendar(); render(); toast('Calendar disconnected'); return; }
    if (a === 'copycode') { try { await navigator.clipboard.writeText(`Join our household on We're Cooked: ${WEB_HOME} — invite code ${S.household.invite_code}`); toast('Invite copied'); } catch (_) { toast('Code: ' + S.household.invite_code); } return; }
    if (a === 'signout') { if (S.channel) sb.removeChannel(S.channel); await sb.auth.signOut(); return; }
  } catch (err) { fail(err); }
});

window.__reload = async () => { if (S.household) { await loadAll(); render(); } };
if (/^(localhost|127\.)/.test(location.hostname)) window.__wc = { S: () => S, recipeMatch, missingBuys, weekNeeds, syncList, markCooked, setMeal, homeCount, avoidersOf, stockOf, convertQty, clearBoughtFromList, addToPantry, expandIngs, renameItem, pantryTarget };
window.__back = () => { const s = [...document.querySelectorAll('.sheet')].pop(); if (s) { s.close ? s.close() : s.remove(); return true; } if (S.session && S.household && S.tab !== 'home') { S.tab = 'home'; render(); return true; } return false; };

sb.auth.onAuthStateChange((ev, session) => {
  const was = S.session?.user?.id; S.session = session;
  if (!session) { S.household = null; S.me = null; render(); return; }
  if (session.user.id !== was) setTimeout(enter, 0); else if (session.provider_refresh_token) setTimeout(() => finishCalendar(session), 0);
});
sb.auth.getSession().then(({ data }) => { S.session = data.session; if (data.session) enter(); else render(); });

document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && S.household) autoSyncCalendar(); });
if ('serviceWorker' in navigator && location.hostname.endsWith('github.io')) navigator.serviceWorker.register('sw.js').catch(() => {});
// ---------- home: the at-a-glance dashboard ----------
{
  const MS_DAY = 864e5;
  const todayStr = () => ymd(new Date());
  const daysUntil = d => Math.round((parseYmd(d) - parseYmd(todayStr())) / MS_DAY);
  const inDays = n => n === 0 ? 'Today' : n === 1 ? 'Tomorrow' : `In ${n} days`;
  const first = m => esc((m?.display_name || '').split(' ')[0]);
  const dismissed = k => { try { return localStorage.getItem('wc_dis_' + k) === '1'; } catch (_) { return false; } };
  const dismiss = k => { try { localStorage.setItem('wc_dis_' + k, '1'); } catch (_) { } };

  // ---------- holidays ----------
  function nthDow(y, m, dow, n) {
    if (n > 0) { const d = new Date(y, m, 1); return new Date(y, m, 1 + ((dow - d.getDay() + 7) % 7) + (n - 1) * 7); }
    const d = new Date(y, m + 1, 0); return new Date(y, m, d.getDate() - ((d.getDay() - dow + 7) % 7));
  }
  function easter(y) {
    const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3),
      h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
    return new Date(y, Math.floor((h + l - 7 * m + 114) / 31) - 1, ((h + l - 7 * m + 114) % 31) + 1);
  }
  const PREP = {
    thanksgiving: [[-7, 'Buy or order the turkey'], [-5, 'Move a frozen turkey to the fridge to thaw (about 1 day per 4–5 lb)'], [-3, 'Big grocery run'], [-2, 'Make cranberry sauce and pie dough'], [-1, 'Bake the pies, make cornbread for the dressing, chop vegetables'], [0, 'Roast the turkey: about 13–15 min per lb at 325°F, until it reaches 165°F']],
    christmas: [[-6, 'Settle the menu and the guest count'], [-4, 'Big grocery run'], [-3, 'Move a frozen ham or roast to the fridge to thaw'], [-1, 'Bake desserts and prep the sides'], [0, 'Main in the oven — enjoy the day']],
    easter: [[-3, 'Grocery run and pick up the ham'], [-1, 'Dye eggs and bake dessert'], [0, 'Ham in the oven']],
    july4: [[-2, 'Plan the cookout and shop'], [0, 'Fire up the grill']],
    nye: [[-2, 'Shop for party food and black-eyed peas for tomorrow'], [0, 'Snacks out by 8']],
    newyear: [[-1, 'Soak the black-eyed peas, buy greens'], [0, 'Black-eyed peas, greens and cornbread for luck']]
  };
  function holidays() {
    const out = [];
    for (const y of [new Date().getFullYear(), new Date().getFullYear() + 1]) out.push(
      ['New Year’s Day', new Date(y, 0, 1), '🎆', 'newyear'], ['Valentine’s Day', new Date(y, 1, 14), '💘'], ['Easter', easter(y), '🐣', 'easter'],
      ['Mother’s Day', nthDow(y, 4, 0, 2), '💐'], ['Memorial Day', nthDow(y, 4, 1, -1), '🇺🇸'], ['Father’s Day', nthDow(y, 5, 0, 3), '🍖'],
      ['Fourth of July', new Date(y, 6, 4), '🎇', 'july4'], ['Labor Day', nthDow(y, 8, 1, 1), '🌭'], ['Halloween', new Date(y, 9, 31), '🎃'],
      ['Thanksgiving', nthDow(y, 10, 4, 4), '🦃', 'thanksgiving'], ['Christmas Eve', new Date(y, 11, 24), '🕯️'], ['Christmas', new Date(y, 11, 25), '🎄', 'christmas'], ['New Year’s Eve', new Date(y, 11, 31), '🥂', 'nye']);
    return out.map(([name, d, emoji, prep]) => ({ name, day: ymd(d), emoji, prep })).filter(h => { const n = daysUntil(h.day); return n >= 0 && n <= 30; });
  }

  // ---------- data helpers ----------
  function lastCooked() {
    const m = new Map();
    for (const p of S.plan) if (p.cooked) for (const id of dishIds(p)) if (!m.has(id) || m.get(id) < p.day) m.set(id, p.day);
    return m;
  }
  const NOT_DINNER = ['dessert', 'drink', 'side', 'appetizer', 'bread', 'breakfast', 'salad'];
  function dinnerCandidates() {
    return S.recipes.filter(r => isMeal(r) && !isTodo(r) && (r.ingredients || []).length && !NOT_DINNER.includes(catOf(r)));
  }
  function bigMealDays() { return new Set(holidays().filter(h => h.prep).map(h => h.day)); }
  function propose() {
    const t = new Date(), lc = lastCooked(), big = bigMealDays();
    const sun = addDays(mondayOf(t), 6), left = Math.round((sun - mondayOf(t)) / 864e5) - ((t.getDay() + 6) % 7) + 1, span = left < 3 ? left + 7 : left;
    const days = [...Array(span)].map((_, i) => ymd(addDays(t, i))).filter(d => !S.plan.find(p => p.day === d) && !big.has(d) && !(d === todayStr() && new Date().getHours() >= 20));
    const planned = new Set(S.plan.filter(p => p.day >= todayStr()).flatMap(dishIds));
    const cands = dinnerCandidates().filter(r => !planned.has(r.id));
    const scored = cands.map(r => { const m = recipeMatch(r); const last = lc.get(r.id); const recent = last && daysUntil(last) > -14;
      return { r, m, base: m.pct * 0.5 + (r.rating || 0) * 8 + (r.favorite ? 10 : 0) + (recent ? -40 : 0) + Math.random() * 12 }; });
    const used = new Set(), usedSides = new Set();
    const rows = days.map(d => {
      const awayNames = awayOn(null, d).map(memberById).filter(Boolean).map(m => m.display_name.split(' ')[0]); const short = awayNames.length > 0;
      const ranked = scored.map(x => ({ ...x, s: x.base + (short && x.r.time_min && x.r.time_min <= 45 ? 15 : 0) - (avoidersOf(x.r, d).length ? 80 : 0) })).sort((a, b) => b.s - a.s);
      const pick = ranked.find(x => !used.has(x.r.id)); if (pick) used.add(pick.r.id);
      const sides = pick ? suggestFor([pick.r], 'side', [...usedSides], 2) : []; sides.forEach(x => usedSides.add(x.id));
      return { day: d, short, awayNames, ranked, pick, sides };
    }).filter(x => x.pick);
    return rows;
  }
  function weekMissing() {
    const t = todayStr(), end = ymd(addDays(new Date(), 6)), out = new Map();
    for (const p of S.plan.filter(p => p.kind === 'cook' && !p.cooked && p.day >= t && p.day <= end))
      for (const r of dishesOf(p)) for (const b of missingBuys(r)) {
        if (S.list.some(l => !l.checked && !l.list_id && (l.name.toLowerCase() === b.name.toLowerCase() || same(l.name, b.name)))) continue;
        if (!out.has(b.name.toLowerCase())) out.set(b.name.toLowerCase(), b.name);
      }
    return [...out.values()];
  }
  function spend(from, to, kinds) {
    const ok = s => s.day >= from && s.day < to && kinds.includes(s.kind);
    return S.spending.filter(ok).reduce((a, s) => a + Number(s.amount), 0) + S.plan.filter(p => p.cost && ok(p)).reduce((a, p) => a + Number(p.cost), 0);
  }

  // ---------- sections ----------
  const section = (title, link, body) => body ? `<section class="hs"><div class="hs-h"><h2>${title}</h2>${link || ''}</div>${body}</section>` : '';
  const linkBtn = (label, attrs) => `<button class="hs-link" ${attrs}>${label} <span aria-hidden="true">→</span></button>`;

  function greeting() {
    const h = new Date().getHours(), name = first(S.me);
    const hi = h < 5 ? 'Up late' : h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
    return `<div class="hgreet"><p class="hdate">${new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p><h1>${hi}, ${name}.</h1></div>`;
  }

  function nudge() {
    const y = ymd(addDays(new Date(), -1)), p = S.plan.find(x => x.day === y);
    if (!p || p.kind !== 'cook') return '';
    const ds = dishesOf(p); if (!ds.length) return '';
    if (!p.cooked) {
      if (dismissed('made-' + y)) return '';
      return `<div class="hnudge"><span class="hn-e">${emojiOf(ds[0])}</span><span class="sp"><b>Did you make ${esc(ds[0].title)} last night?</b><span>Marking it cooked updates the pantry.</span></span>
        <span class="hn-a"><button class="btn sm" data-h="cooked" data-pid="${p.id}">Yes</button><button class="btn sm ghost" data-h="dismiss" data-key="made-${y}">No</button></span></div>`;
    }
    const un = ds.find(r => !r.rating); if (!un || dismissed('rate-' + y + un.id)) return '';
    return `<div class="hnudge"><span class="hn-e">${emojiOf(un)}</span><span class="sp"><b>How was the ${esc(un.title)}?</b><span>Ratings help the chef pick dinners you'll love.</span></span>
      <span class="hn-a"><button class="btn sm" data-h="rate" data-id="${un.id}">Rate it</button><button class="btn sm ghost" data-h="dismiss" data-key="rate-${y}${un.id}" aria-label="Dismiss">✕</button></span></div>`;
  }

  function tonight() {
    const d = todayStr(), p = S.plan.find(x => x.day === d), k = p?.kind;
    const away = awayOn(p, d), home = S.members.filter(m => !away.includes(m.user_id));
    const ds = k === 'cook' ? dishesOf(p) : [], r = ds[0];
    const cook = p?.cook_id && memberById(p.cook_id);
    const people = S.members.map(m => { const b = busyOn(d).find(x => x.user_id === m.user_id && away.includes(m.user_id));
      return `<span class="tp${away.includes(m.user_id) ? ' off' : ''}">${av(m, away.includes(m.user_id))}<span><b>${first(m)}</b><i>${b ? 'Working' : away.includes(m.user_id) ? 'Away' : 'Home'}</i></span></span>`; }).join('');
    const eating = k === 'away' ? 0 : (p?.headcount || home.length);
    let title, sub = '', actions = '', extra = '';
    if (!p) {
      title = 'Nothing planned yet';
      const ide = ideas(3);
      sub = home.length < S.members.length ? `${home.length} home tonight` : 'Everyone’s home tonight';
      extra = ide.length ? `<div class="tideas"><p class="tl">From what’s in your kitchen</p>${ide.map(x => `<div class="tidea"><button class="ti-main" data-recipe="${x.r.id}"><span class="ti-e">${emojiOf(x.r)}</span><span><b>${esc(x.r.title)}</b><i>${x.m.have}/${x.m.total} at home${x.r.time_min ? ' · ' + fmtTime(x.r.time_min) : ''}</i></span></button><button class="ti-add" data-h="tonight-add" data-id="${x.r.id}" aria-label="Plan ${esc(x.r.title)} tonight">${svg('plus')}</button></div>`).join('')}</div>` : '';
      actions = `<button class="hbtn" data-day="${d}">${svg('cal')} Plan tonight</button><button class="hbtn ghost" data-act="chef">${svg('spark')} Ask the chef</button>`;
    } else if (k === 'cook') {
      title = ds.length ? esc(mealTitle(p)) : 'Cooking in';
      if (mealWith(p).length) extra = `<p class="t-with">${esc(withLine(p))}</p>`;
      sub = [cook ? `${first(cook)} is cooking` : 'Cook not picked', r?.time_min ? fmtTime(Math.max(...ds.map(x => x.time_min || 0))) : ''].filter(Boolean).join(' · ');
      actions = p.cooked ? `<span class="tdone">✓ Cooked</span><button class="hbtn ghost" data-day="${d}">Details</button>`
        : `${r ? `<button class="hbtn" data-h="cook" data-id="${(bySlot(p, 'main')[0] || r).id}">${svg('fire')} Start cooking</button>` : ''}${ds.length ? `<button class="hbtn ghost" data-h="cooked" data-pid="${p.id}">Mark cooked</button>` : `<button class="hbtn ghost" data-day="${d}">Add dishes</button>`}`;
    } else if (k === 'away') {
      title = 'Nobody’s home for dinner'; sub = p.note ? esc(p.note) : 'Night off from the kitchen';
      actions = `<button class="hbtn ghost" data-day="${d}">Change plans</button>`;
    } else {
      title = esc(p.place_name || p.title || KINDS[k]); sub = [KINDS[k], p.place_address ? esc(p.place_address) : '', p.cost ? money(p.cost) : ''].filter(Boolean).join(' · ');
      actions = p.place_name ? `<button class="hbtn" data-ext="${esc(mapsUrl(p))}">${svg('link')} Directions</button>` : `<button class="hbtn ghost" data-day="${d}">Edit</button>`;
    }
    const tm = S.plan.find(x => x.day === ymd(addDays(new Date(), 1)));
    const tmText = tm ? (tm.kind === 'cook' && dishesOf(tm).length ? mealTitle(tm) + (mealWith(tm).length ? ` + ${mealWith(tm).length} more` : '') : tm.place_name || tm.title || KINDS[tm.kind]) : 'Nothing planned';
    const photo = r?.photo_url;
    return `<article class="tonight${photo ? ' has' : ''}"${photo ? ` style="--img:url('${esc(photo)}')"` : ''}>
      <div class="t-top"><span class="t-eye">Tonight${k !== 'away' ? ` · ${eating} eating` : ''}</span>${p ? `<button class="t-kind" style="--k:var(--${k})" data-day="${d}" aria-label="Edit tonight's plan">${esc(KINDS[k])} ${svg('pen')}</button>` : ''}</div>
      <h2 class="t-title">${r && !photo ? `<span class="t-emoji">${emojiOf(r)}</span>` : ''}${title}</h2>${sub ? `<p class="t-sub">${sub}</p>` : ''}
      <div class="t-people">${people}</div>${extra}
      <div class="t-act">${actions}</div>
      <button class="t-next" data-day="${ymd(addDays(new Date(), 1))}"><span>Tomorrow</span><b>${esc(tmText)}</b><span aria-hidden="true">›</span></button>
    </article>`;
  }

  function weekStrip() {
    const big = bigMealDays(), mon = mondayOf(new Date()), tdy = todayStr();
    const days = [...Array(7)].map((_, i) => ymd(addDays(mon, i)));
    const ico = { out: '🍽️', takeout: '🥡', leftovers: '🍱', away: '✈️', other: '✨' };
    const cells = days.map((d, i) => { const p = S.plan.find(x => x.day === d), dt = parseYmd(d), ds = p?.kind === 'cook' ? dishesOf(p) : [];
      const em = ds[0] ? emojiOf(ds[0]) : p ? (ico[p.kind] || '🍳') : big.has(d) ? holidays().find(h => h.day === d).emoji : '';
      const aw = awayOn(p, d).map(memberById).filter(Boolean);
      const label = p ? (ds.length ? ds.map(x => x.title).join(', ') : p.place_name || p.title || KINDS[p.kind]) : 'Nothing planned';
      return `<button class="wd${p ? ' on' : ''}${d === tdy ? ' now' : ''}${d < tdy ? ' past' : ''}" data-day="${d}" style="--k:var(--${p?.kind || 'line'})" aria-label="${DOW[dt.getDay()]} ${dt.getDate()}: ${esc(label)}${aw.length ? ', ' + aw.map(m => m.display_name).join(' and ') + ' away' : ''}">
        <span class="wd-d">${d === tdy ? 'Today' : DOW[dt.getDay()]}</span><span class="wd-n">${dt.getDate()}</span><span class="wd-b">${em || '<span class="wd-plus">+</span>'}</span>
        <span class="wd-a">${aw.slice(0, 2).map(m => av(m, true)).join('')}</span></button>`; }).join('');
    const open = days.filter(d => d >= tdy && !S.plan.find(p => p.day === d) && !big.has(d)).length;
    const hasCands = dinnerCandidates().length > 0;
    return `<div class="card hweek"><div class="wstrip">${cells}</div>
      <div class="wfoot"><span>${open ? `<b>${open}</b> open night${open > 1 ? 's' : ''} this week` : '<b>Every night is planned.</b> Nice.'}</span>${open && hasCands ? `<button class="btn sm" data-h="fill">${svg('spark')} Fill my week</button>` : ''}</div></div>`;
  }

  function quick() {
    const q = [['scanbarcode', 'scan', 'Scan'], ['snappantry', 'camera', 'Snap fridge'], ['addrecipe', 'plus', 'Add recipe'], ['chef', 'spark', 'Ask chef'], ['logspend', 'receipt', 'Log groceries']];
    return `<div class="hquick">${q.map(([a, i, l]) => `<button data-act="${a}"><span>${svg(i)}</span>${l}</button>`).join('')}</div>`;
  }

  function kitchen() {
    const soonLimit = ymd(addDays(new Date(), 3));
    const soon = S.pantry.filter(p => p.expires_on && p.expires_on <= soonLimit && Number(p.qty) > 0).sort((a, b) => a.expires_on.localeCompare(b.expires_on)).slice(0, 4);
    const low = S.pantry.filter(isLow);
    const miss = weekMissing();
    const soonCard = `<div class="kc"><p class="kc-l">Use soon</p>${soon.length ? soon.map(p => { const n = daysUntil(p.expires_on); const r = S.recipes.find(r => isMeal(r) && (r.ingredients || []).some(i => usesItem(i, p)));
      return `<div class="kc-row"><span class="kc-t"><b>${esc(p.name)}</b><i class="${n <= 0 ? 'hot' : ''}">${n < 0 ? 'Past date' : n === 0 ? 'Today' : n === 1 ? 'Tomorrow' : `${n} days`}</i></span>${r ? `<button class="kc-r" data-recipe="${r.id}">Use in ${esc(r.title)} →</button>` : ''}</div>`; }).join('') : '<p class="kc-e">Nothing about to expire.</p>'}</div>`;
    const lowCard = `<button class="kc kc-btn" data-tab="list"><p class="kc-l">Running low</p><p class="kc-big">${low.length}</p><p class="kc-s">${low.length ? esc(low.slice(0, 3).map(p => p.name).join(', ')) + (low.length > 3 ? ` +${low.length - 3}` : '') + ' · on your list' : 'Staples are stocked'}</p></button>`;
    const missCard = `<div class="kc"><p class="kc-l">Missing for this week</p><p class="kc-big">${miss.length}</p><p class="kc-s">${miss.length ? esc(miss.slice(0, 3).join(', ')) + (miss.length > 3 ? ` +${miss.length - 3}` : '') : 'You have everything planned'}</p>${miss.length ? '<button class="btn sm" data-act="buildlist">Add to list</button>' : ''}</div>`;
    return `<div class="kgrid">${soonCard}${lowCard}${missCard}</div>`;
  }

  function comingUp() {
    const hs = holidays(), evs = (S.events || []).filter(e => { const n = daysUntil(e.day); return n >= 0 && n <= 60; });
    const mine = S.busy.filter(b => b.user_id === S.session.user.id && b.day >= todayStr()).slice(0, 3);
    const feature = hs.find(h => h.prep && daysUntil(h.day) <= 14);
    let html = '';
    if (feature) {
      const n = daysUntil(feature.day), p = S.plan.find(x => x.day === feature.day), ds = p?.kind === 'cook' ? dishesOf(p) : [];
      const steps = PREP[feature.prep].map(([off, txt]) => { const d = ymd(addDays(parseYmd(feature.day), off)); const past = d < todayStr(), now = d === todayStr();
        return `<li class="${past ? 'past' : now ? 'now' : ''}"><span class="tl-d">${now ? 'Today' : parseYmd(d).toLocaleDateString(undefined, { weekday: 'short', month: 'numeric', day: 'numeric' })}</span><span>${esc(txt)}</span></li>`; }).join('');
      html += `<article class="feat"><div class="feat-h"><span class="feat-e">${feature.emoji}</span><span class="sp"><span class="feat-n">${inDays(n)}</span><h3>${esc(feature.name)}</h3><p>${ds.length ? `${ds.length} dish${ds.length > 1 ? 'es' : ''} on the menu${p.headcount ? ` · ${p.headcount} eating` : ''}` : 'Menu not planned yet'}</p></span><span class="feat-c"><b>${n}</b><i>day${n === 1 ? '' : 's'}</i></span></div>
        <ol class="tline">${steps}</ol><div class="row" style="gap:8px"><button class="btn sm" data-day="${feature.day}">${ds.length ? 'Edit the menu' : 'Plan the menu'}</button>${ds.length ? '<button class="btn sm ghost" data-act="buildlist">Build shopping list</button>' : ''}</div></article>`;
    }
    const rows = [
      ...hs.filter(h => h !== feature).map(h => ({ day: h.day, e: h.emoji, t: h.name, s: 'Holiday', a: `data-day="${h.day}"` })),
      ...evs.map(e => ({ day: e.day, e: { birthday: '🎂', guests: '👥', party: '🎉', other: '📌' }[e.kind], t: e.title, s: [e.guests ? `${e.guests} guests` : '', e.note || ''].filter(Boolean).join(' · ') || { birthday: 'Birthday', guests: 'Guests coming', party: 'Party', other: 'Occasion' }[e.kind], a: `data-h="occ" data-id="${e.id}"` })),
      ...S.lists.filter(x => x.due && daysUntil(x.due) >= 0 && daysUntil(x.due) <= 60).map(x => ({ day: x.due, e: x.emoji, t: `${x.name} list`, s: `${itemsOn(x.id).filter(l => !l.checked).length} to get`, a: `data-h="openlist" data-id="${x.id}"` })),
      ...mine.map(b => ({ day: b.day, e: '💼', t: 'You’re working', s: shortReason(b), a: `data-day="${b.day}"` }))
    ].sort((a, b) => a.day.localeCompare(b.day)).slice(0, 6);
    html += `<div class="card cup">${rows.map(r => `<button class="cu" ${r.a}><span class="cu-d"><b>${parseYmd(r.day).getDate()}</b><i>${parseYmd(r.day).toLocaleDateString(undefined, { month: 'short' })}</i></span><span class="cu-e">${r.e}</span><span class="cu-t"><b>${esc(r.t)}</b><i>${esc(r.s)}</i></span><span class="cu-n">${inDays(daysUntil(r.day))}</span></button>`).join('') || '<p class="kc-e" style="padding:14px 16px">Nothing coming up. Add a birthday or a night with guests.</p>'}
      <button class="cu cu-add" data-h="occ-new"><span class="cu-d">${svg('plus')}</span><span class="cu-t"><b>Add an occasion</b><i>Birthdays, guests, parties</i></span></button></div>`;
    return html;
  }

  function moneyHabits() {
    const now = new Date(), t = todayStr(), tomorrow = ymd(addDays(now, 1));
    const m0 = ymd(new Date(now.getFullYear(), now.getMonth(), 1)), lm0 = ymd(new Date(now.getFullYear(), now.getMonth() - 1, 1));
    const lmSame = ymd(new Date(now.getFullYear(), now.getMonth() - 1, Math.min(now.getDate() + 1, new Date(now.getFullYear(), now.getMonth(), 0).getDate() + 1)));
    const G = ['groceries'], O = ['out', 'takeout'];
    const g = spend(m0, tomorrow, G), o = spend(m0, tomorrow, O), tot = g + o;
    const lastSame = spend(lm0, lmSame, [...G, ...O]), lastFull = spend(lm0, m0, [...G, ...O]);
    const delta = lastSame ? Math.round((tot - lastSame) / lastSame * 100) : null;
    const lc = lastCooked();
    const miss = S.recipes.filter(r => isMeal(r) && (r.favorite || (r.rating || 0) >= 4)).map(r => ({ r, last: lc.get(r.id) })).filter(x => !x.last || daysUntil(x.last) < -30)
      .sort((a, b) => (b.r.rating || 0) - (a.r.rating || 0) || (a.last || '').localeCompare(b.last || '')).slice(0, 3);
    const gw = tot ? Math.round(g / tot * 100) : 0;
    const spendCard = `<div class="mc"><p class="kc-l">Food spending · ${now.toLocaleDateString(undefined, { month: 'long' })}</p><p class="mc-big">${money(tot)}</p>
      <p class="mc-d">${delta == null ? (lastFull ? `Last month: ${money(lastFull)}` : 'Log groceries to start tracking') : `<span class="${delta > 0 ? 'up' : 'down'}">${delta > 0 ? '▲' : '▼'} ${Math.abs(delta)}%</span> vs. this point last month`}</p>
      <div class="mbar" role="img" aria-label="Groceries ${money(g)}, eating out ${money(o)}"><span style="width:${gw}%"></span></div>
      <div class="mleg"><span><i class="g"></i>Groceries <b>${money(g)}</b></span><span><i class="o"></i>Eating out <b>${money(o)}</b></span></div>
      <button class="btn sm ghost" data-act="logspend" style="margin-top:12px">Log spending</button></div>`;
    const R = 34, C = 2 * Math.PI * R;
    const mx = weekMix(), planned = mx.home + mx.out + mx.other, pct = planned ? Math.round(mx.home / planned * 100) : 0;
    const habitCard = `<button class="mc mc-btn" data-h="mix" aria-label="This week's dinners: ${mx.home} of ${planned} planned nights home-cooked. Tap for details."><p class="kc-l">Home-cooked · this week</p>${planned ? `<div class="ring"><svg viewBox="0 0 84 84" aria-hidden="true"><circle cx="42" cy="42" r="${R}" class="rb"/><circle cx="42" cy="42" r="${R}" class="rf" stroke-dasharray="${C * pct / 100} ${C}"/></svg><b>${pct}%</b></div>
      <p class="kc-s" style="text-align:center">${[`${mx.home} home`, mx.out ? `${mx.out} out` : '', mx.away ? `${mx.away} nobody home` : '', mx.none ? `${mx.none} not planned` : ''].filter(Boolean).join(' · ')}</p><p class="mc-more">See the week ›</p>` : '<p class="kc-s">Plan a few nights this week and your home-cooked share shows up here.</p>'}</button>`;
    const missCard = `<div class="mc mc-wide"><p class="kc-l">Haven’t made in a while</p>${miss.length ? miss.map(x => `<div class="hm"><button class="hm-m" data-recipe="${x.r.id}"><span class="hm-e">${emojiOf(x.r)}</span><span><b>${esc(x.r.title)}</b><i>${x.last ? 'Last made ' + parseYmd(x.last).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Not cooked yet'}${x.r.rating ? ' · ' + '★'.repeat(x.r.rating) : x.r.favorite ? ' · ★ favorite' : ''}</i></span></button><button class="btn sm ghost" data-h="plan" data-id="${x.r.id}">Plan it</button></div>`).join('') : '<p class="kc-s">Rate or favorite recipes and this reminds you of the ones you’ve been missing.</p>'}</div>`;
    return `<div class="mgrid">${spendCard}${habitCard}${missCard}</div>`;
  }

  const MIX = [['cook', 'Cooked at home', 'home'], ['leftovers', 'Leftovers', 'home'], ['out', 'Eating out', 'out'], ['takeout', 'Takeout', 'out'], ['other', 'Other plans', 'other'], ['away', 'Nobody home', 'away'], ['none', 'Not planned', 'none']];
  function weekMix(start = mondayOf(new Date())) {
    const rows = [...Array(7)].map((_, i) => { const d = ymd(addDays(start, i)), p = S.plan.find(x => x.day === d), k = p?.kind || 'none'; return { d, p, k, grp: (MIX.find(m => m[0] === k) || MIX[6])[2] }; });
    const c = g => rows.filter(r => r.grp === g).length;
    return { rows, home: c('home'), out: c('out'), other: c('other'), away: c('away'), none: c('none') };
  }
  function mixSheet() {
    const mon = mondayOf(new Date()), mx = weekMix(mon), planned = mx.home + mx.out + mx.other, tdy = todayStr();
    const by = k => mx.rows.filter(r => r.k === k).length;
    const seg = MIX.filter(([k]) => by(k)).map(([k, l]) => `<span style="flex:${by(k)};background:${k === 'none' ? 'var(--sunk)' : `var(--${k})`}" title="${l}: ${by(k)}"></span>`).join('');
    const last = weekMix(addDays(mon, -7)), lp = last.home + last.out + last.other;
    const m0 = ymd(new Date(new Date().getFullYear(), new Date().getMonth(), 1)), mn = S.plan.filter(p => p.day >= m0 && p.day <= tdy);
    const mh = mn.filter(p => p.kind === 'cook' || p.kind === 'leftovers').length, mo = mn.filter(p => ['out', 'takeout', 'other'].includes(p.kind)).length;
    const dayRow = r => { const dt = parseYmd(r.d), p = r.p, ds = r.k === 'cook' ? dishesOf(p) : [];
      const what = !p ? 'Nothing planned yet' : ds.length ? mealTitle(p) + (mealWith(p).length ? ` + ${mealWith(p).length} more` : '') : (p.place_name || p.title || KINDS[r.k]);
      const aw = awayOn(p, r.d).map(memberById).filter(Boolean);
      return `<button class="mixrow${r.d === tdy ? ' now' : ''}${r.d < tdy ? ' past' : ''}" data-day="${r.d}"><span class="mx-d"><b>${DOW[dt.getDay()]}</b><i>${dt.getDate()}</i></span><span class="mx-k" style="--k:${r.k === 'none' ? 'var(--line)' : `var(--${r.k})`}"></span><span class="mx-t"><b>${esc(what)}</b><i>${p ? esc(KINDS[r.k]) : 'Tap to plan'}${aw.length ? ' · ' + esc(aw.map(m => m.display_name.split(' ')[0]).join(' & ')) + ' away' : ''}</i></span><span class="mx-go">›</span></button>`; };
    sheet(`<h2>This week’s dinners</h2><p class="lede">${parseYmd(mx.rows[0].d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – ${parseYmd(mx.rows[6].d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} · as planned</p>
      <div class="mixhead"><div><b>${planned ? Math.round(mx.home / planned * 100) : 0}%</b><span>home-cooked</span></div><div><b>${mx.home}</b><span>at home</span></div><div><b>${mx.out + mx.other}</b><span>out</span></div><div><b>${mx.none}</b><span>open</span></div></div>
      <div class="mixbar" role="img" aria-label="${MIX.filter(([k]) => by(k)).map(([k, l]) => `${l} ${by(k)}`).join(', ')}">${seg}</div>
      <div class="mixleg">${MIX.filter(([k]) => by(k)).map(([k, l]) => `<span><i style="background:${k === 'none' ? 'var(--sunk);border:1px solid var(--line)' : `var(--${k})`}"></i>${l} <b>${by(k)}</b></span>`).join('')}</div>
      <div class="card flat" style="padding:2px 12px;margin-top:14px">${mx.rows.map(dayRow).join('')}</div>
      <div class="mixcmp"><span>Last week <b>${lp ? Math.round(last.home / lp * 100) + '%' : '—'}</b></span><span>This month so far <b>${mh + mo ? Math.round(mh / (mh + mo) * 100) + '%' : '—'}</b> <i>(${mh} of ${mh + mo} nights)</i></span></div>
      <p class="imeta" style="margin:10px 0 0">Home-cooked share = nights cooked or leftovers out of nights planned for dinner (nights nobody’s home aren’t counted).</p>`,
      (el, close) => el.addEventListener('click', e => { const d = e.target.closest('[data-day]'); if (d) { el.remove(); } }));
  }
  window.homeView = function () {
    return `<div class="home">${greeting()}${nudge()}${tonight()}
      ${section('This week', linkBtn('Full week', 'data-tab="week"'), weekStrip())}
      ${section('Quick actions', '', quick())}
      ${section('Kitchen', linkBtn('Pantry', 'data-tab="pantry"'), kitchen())}
      ${section('Coming up', '', comingUp())}
      ${section('Money &amp; habits', '', moneyHabits())}
      <p class="hfoot">We’re Cooked · ${esc(S.household.name)}</p></div>`;
  };

  // ---------- sheets ----------
  function fillWeek() {
    let rows = propose();
    if (!rows.length) return toast('Add a few dinner recipes first and the chef can fill your week.');
    const draw = () => `<h2>Fill my week</h2><p class="lede">Picked from your cookbooks: a main you can make with what’s at home plus two sides that go with it. Quicker meals on nights someone’s working. Tap ↻ to swap.</p>
      <div class="fw">${rows.map((x, i) => { const dt = parseYmd(x.day), m = x.pick.m;
        return `<div class="fw-row"><span class="fw-d"><b>${daysUntil(x.day) === 0 ? 'Tonight' : DOW[dt.getDay()]}</b><i>${dt.getDate()}</i></span>
        <button class="fw-r" data-recipe="${x.pick.r.id}"><span class="fw-e">${emojiOf(x.pick.r)}</span><span><b>${esc(x.pick.r.title)}</b><i>${x.sides.length ? `with ${esc(x.sides.map(r => r.title).join(' & '))}` : [m.total ? `${m.have}/${m.total} at home` : '', x.pick.r.time_min ? fmtTime(x.pick.r.time_min) : ''].filter(Boolean).join(' · ')}${x.short ? ` · ${esc(x.awayNames.join(' & '))} working` : ''}</i></span></button>
        <span class="fw-a"><button class="ib" data-fswap="${i}" aria-label="Swap">↻</button><button class="ib" data-fdel="${i}" aria-label="Remove">✕</button></span></div>`; }).join('') || '<p class="imeta">No nights left to fill.</p>'}</div>
      <div class="row" style="gap:8px;margin-top:16px"><button class="btn" id="fwgo" ${rows.length ? '' : 'disabled'}>Add ${rows.length} dinner${rows.length === 1 ? '' : 's'}</button><button class="btn ghost" id="fwlist" ${rows.length ? '' : 'disabled'}>Add + shopping list</button></div>`;
    sheet(draw(), (el, close) => {
      const box = el.querySelector('[role=dialog]'); const redraw = () => { box.innerHTML = draw(); };
      el.addEventListener('click', async e => {
        const sw = e.target.closest('[data-fswap]'); if (sw) { const x = rows[+sw.dataset.fswap]; const usedIds = new Set(rows.map(r => r.pick.r.id));
          const idx = x.ranked.findIndex(c => c.r.id === x.pick.r.id); const next = [...x.ranked.slice(idx + 1), ...x.ranked.slice(0, idx)].find(c => !usedIds.has(c.r.id)); if (next) { x.pick = next; x.sides = suggestFor([next.r], 'side', rows.filter(y => y !== x).flatMap(y => y.sides.map(r => r.id)), 2); } else toast('No other options right now'); return redraw(); }
        const dl = e.target.closest('[data-fdel]'); if (dl) { rows.splice(+dl.dataset.fdel, 1); return redraw(); }
        const go = e.target.closest('#fwgo, #fwlist'); if (!go) return;
        go.disabled = true; go.textContent = 'Adding…';
        try { for (const x of rows) await setMeal(x.day, [{ id: x.pick.r.id, slot: 'main' }, ...x.sides.map(r => ({ id: r.id, slot: 'side' }))]); await loadAll(); if (go.id === 'fwlist') await buildList(); } catch (er) { return fail(er); }
        el.remove(); render(); toast(`${rows.length} dinner${rows.length === 1 ? '' : 's'} planned`);
      });
    });
  }

  function occasionEditor(id) {
    const ev = (S.events || []).find(x => x.id === id) || { title: '', day: ymd(addDays(new Date(), 7)), kind: 'birthday', guests: '', note: '' };
    const K = [['birthday', '🎂 Birthday'], ['guests', '👥 Guests'], ['party', '🎉 Party'], ['other', '📌 Other']];
    let kind = ev.kind;
    sheet(`<h2>${id ? 'Edit occasion' : 'Add an occasion'}</h2><form id="occf">
      <div class="seg" style="grid-template-columns:repeat(2,minmax(0,1fr))">${K.map(([k, l]) => `<button type="button" data-ok="${k}" aria-pressed="${kind === k}">${l}</button>`).join('')}</div>
      <label for="ot">What is it?</label><input type="text" id="ot" value="${esc(ev.title)}" required maxlength="80" placeholder="Mom's birthday, Smiths over for dinner…">
      <div class="grid2"><div><label for="od">Date</label><input type="date" id="od" value="${esc(ev.day)}" required></div><div><label for="og">Guests (optional)</label><input type="number" id="og" min="0" max="200" value="${ev.guests ?? ''}"></div></div>
      <label for="on">Note (optional)</label><input type="text" id="on" value="${esc(ev.note || '')}" maxlength="120" placeholder="Wants chocolate cake">
      <div class="row" style="margin-top:18px"><button class="btn" type="submit">Save</button><button class="btn ghost" type="button" data-close>Cancel</button><span class="sp"></span>${id ? '<button class="btn line sm" type="button" id="odel">Delete</button>' : ''}</div>
      <button class="btn sm ghost wide" type="button" id="oplan" style="margin-top:10px">${svg('cal')} Plan the meal for that day</button></form>`, (el, close) => {
      el.querySelectorAll('[data-ok]').forEach(b => b.onclick = () => { kind = b.dataset.ok; el.querySelectorAll('[data-ok]').forEach(x => x.setAttribute('aria-pressed', x === b)); });
      const row = () => ({ household_id: S.household.id, title: el.querySelector('#ot').value.trim(), day: el.querySelector('#od').value, kind, guests: el.querySelector('#og').value ? Number(el.querySelector('#og').value) : null, note: el.querySelector('#on').value.trim() || null });
      const save = async () => { const r = id ? await sb.from('household_events').update(row()).eq('id', id) : await sb.from('household_events').insert(row()); if (r.error) throw r.error; await loadAll(); };
      el.querySelector('#occf').onsubmit = async e => { e.preventDefault(); try { await save(); close(); toast('Saved'); } catch (er) { fail(er); } };
      el.querySelector('#odel')?.addEventListener('click', async () => { const r = await sb.from('household_events').delete().eq('id', id); if (r.error) return fail(r.error); await loadAll(); close(); });
      el.querySelector('#oplan').onclick = async () => { const d = el.querySelector('#od').value; if (el.querySelector('#ot').value.trim()) { try { await save(); } catch (er) { return fail(er); } } el.remove(); dayEditor(d); };
    });
  }

  document.addEventListener('click', async e => {
    const t = e.target.closest('[data-h]'); if (!t) return;
    e.preventDefault();
    try {
      const h = t.dataset.h;
      if (h === 'cook') return recipeView(t.dataset.id, { cook: true });
      if (h === 'cooked') { t.disabled = true; const p = S.plan.find(x => x.id === t.dataset.pid); if (p) await markCooked(p); return; }
      if (h === 'rate') { const r = S.recipes.find(x => x.id === t.dataset.id); if (r) ratePrompt(r); return; }
      if (h === 'dismiss') { dismiss(t.dataset.key); return render(); }
      if (h === 'tonight-add') { t.disabled = true; await addDishToDay(todayStr(), t.dataset.id); await loadAll(); render(); return toast('Planned for tonight'); }
      if (h === 'plan') { const r = S.recipes.find(x => x.id === t.dataset.id); if (r) planRecipe(r); return; }
      if (h === 'fill') return fillWeek();
      if (h === 'mix') return mixSheet();
      if (h === 'openlist') { S.listId = t.dataset.id; S.tab = 'list'; render(); $('#main').scrollTop = 0; return; }
      if (h === 'occ-new') return occasionEditor(null);
      if (h === 'occ') return occasionEditor(t.dataset.id);
    } catch (er) { fail(er); }
  });
}
}
