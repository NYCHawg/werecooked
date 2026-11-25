"""Builds web/bar/data/catalog.json from the text sources in tools/bar/ and checks every reference.
Run: python3 tools/bar/build.py
"""
import json, re, sys, glob, os

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', '..', 'web', 'bar', 'data', 'catalog.json')
errors = []

def lines(name):
    for ln in open(os.path.join(HERE, name), encoding='utf-8'):
        ln = ln.rstrip('\n')
        if ln.strip() and not (ln.startswith('# ') or ln.strip() == '#'):
            yield ln

def num(s):
    s = s.strip()
    if not s: return None
    m = re.match(r'^(\d+(?:\.\d+)?)(?:\s*-\s*(\d+(?:\.\d+)?))?$', s)
    if not m: return None
    return [float(m.group(1)), float(m.group(2) or m.group(1))]

# ---------- styles ----------
styles, families = {}, {}
for ln in lines('styles.txt'):
    p = [x.strip() for x in ln.split('|')]
    if len(p) != 7: errors.append(f'style line: {ln}'); continue
    sid, cat, fam, name, origin, abv, notes = p
    if sid in styles: errors.append(f'duplicate style {sid}')
    styles[sid] = {'id': sid, 'cat': cat, 'fam': fam, 'name': name, 'origin': origin, 'abv': num(abv), 'notes': notes}
    families.setdefault(fam, []).append(sid)
CATS = []
for s in styles.values():
    if s['cat'] not in CATS: CATS.append(s['cat'])

# family display names: the first style's name, generalized
FAM_NAMES = {
    'gin-dry': 'London Dry / Plymouth gin', 'gin-modern': 'Contemporary gin', 'gin-old-tom': 'Old Tom gin', 'genever': 'Genever',
    'vodka': 'Vodka', 'vodka-flavored': 'Flavored vodka', 'rum-jamaican': 'Jamaican rum', 'rum-overproof': 'Overproof rum', 'rum-demerara': 'Demerara rum',
    'rum-blended-aged': 'Aged rum (Barbados / blended)', 'rum-light': 'Light / white rum', 'rum-sweet-aged': 'Aged rum (Central American)', 'rum-dark': 'Dark / navy rum',
    'rum-spiced': 'Spiced rum', 'rum-agricole': 'Rhum agricole (blanc)', 'rum-agricole-aged': 'Rhum agricole (aged)', 'rum-cachaca': 'Cachaça', 'arrack': 'Batavia arrack',
    'liq-coconut': 'Coconut rum / liqueur', 'tequila-blanco': 'Blanco tequila', 'tequila-reposado': 'Reposado tequila', 'tequila-aged': 'Añejo tequila', 'mezcal': 'Mezcal',
    'mezcal-wild': 'Wild agave mezcal', 'agave-other': 'Other agave spirits', 'whiskey-bourbon': 'Bourbon', 'whiskey-rye': 'Rye whiskey', 'whiskey-corn': 'Corn whiskey',
    'whiskey-malt': 'Single malt (non-Scotch)', 'scotch-blend': 'Blended Scotch', 'scotch-malt': 'Single malt Scotch', 'scotch-peated': 'Peated Scotch', 'irish': 'Irish whiskey',
    'japanese': 'Japanese whisky', 'canadian': 'Canadian whisky', 'brandy-cognac': 'Cognac / Armagnac', 'eau-de-vie': 'Eau de vie / grappa', 'brandy-apple': 'Apple brandy',
    'brandy-grape': 'Grape brandy', 'pisco': 'Pisco', 'liq-orange': 'Orange liqueur', 'liq-citrus': 'Citrus liqueur', 'liq-chartreuse-green': 'Green Chartreuse',
    'liq-chartreuse-yellow': 'Yellow Chartreuse', 'liq-alpine': 'Génépy', 'liq-benedictine': 'Bénédictine', 'liq-herbal-sweet': 'Sweet herbal liqueur', 'liq-honey-whisky': 'Honey whisky liqueur',
    'liq-kummel': 'Kümmel', 'liq-vanilla': 'Vanilla liqueur', 'absinthe': 'Absinthe', 'pastis': 'Pastis', 'anise-sweet': 'Sweet anise liqueur', 'anise-dry': 'Arak / rakı',
    'liq-amaretto': 'Amaretto', 'liq-nut': 'Nut liqueur', 'liq-coffee': 'Coffee liqueur', 'liq-cacao-white': 'Crème de cacao (white)', 'liq-cacao-dark': 'Crème de cacao (dark)',
    'liq-cream': 'Cream liqueur', 'liq-maraschino': 'Maraschino liqueur', 'liq-cherry': 'Cherry liqueur', 'liq-cassis': 'Crème de cassis', 'liq-berry': 'Berry liqueur',
    'liq-peach': 'Peach liqueur', 'liq-apricot': 'Apricot liqueur', 'liq-banana': 'Crème de banane', 'liq-tropical': 'Tropical fruit liqueur', 'liq-pear': 'Pear liqueur',
    'liq-apple': 'Apple liqueur', 'liq-elderflower': 'Elderflower liqueur', 'liq-violette': 'Crème de violette', 'liq-floral': 'Floral liqueur', 'liq-ginger': 'Ginger liqueur',
    'liq-allspice': 'Allspice dram', 'liq-falernum': 'Falernum', 'liq-menthe': 'Crème de menthe', 'liq-spice': 'Spice liqueur', 'liq-sloe': 'Sloe gin', 'liq-pimms': "Pimm's",
    'aperitivo-red': 'Red bitter aperitivo', 'aperitivo-light': 'Light aperitivo', 'gentian': 'Gentian liqueur', 'amaro-alpine': 'Alpine amaro', 'amaro-carciofo': 'Carciofo amaro',
    'amaro-rabarbaro': 'Rabarbaro', 'fernet': 'Fernet', 'amaro-medium': 'Medium amaro', 'amaro-rich': 'Rich amaro', 'amaro-china': 'China / amer', 'amaro-krauter': 'Kräuterlikör',
    'amaro-malort': 'Malört', 'verm-sweet': 'Sweet vermouth', 'verm-dry': 'Dry vermouth', 'verm-blanc': 'Blanc vermouth', 'verm-quinquina': 'Quinquina / Americano',
    'verm-quinquina-red': 'Quinquina rouge / chinato', 'sherry-dry': 'Fino / manzanilla sherry', 'sherry-nutty': 'Amontillado / oloroso sherry', 'sherry-sweet': 'Sweet sherry',
    'port-red': 'Ruby port', 'port-tawny': 'Tawny port', 'port-white': 'White port', 'madeira': 'Madeira / Marsala', 'bitters-aromatic': 'Aromatic bitters',
    'bitters-peychaud': "Peychaud's bitters", 'bitters-orange': 'Orange bitters', 'bitters-other': 'Specialty bitters', 'aquavit': 'Aquavit', 'baijiu': 'Baijiu', 'shochu': 'Shochu',
    'soju': 'Soju', 'sake': 'Sake', 'sparkling': 'Sparkling wine', 'wine-red': 'Red wine', 'wine-white': 'White wine', 'beer': 'Beer', 'beer-dark': 'Stout / porter', 'cider': 'Cider',
    'mix-soda': 'Club soda', 'mix-tonic': 'Tonic', 'mix-ginger-beer': 'Ginger beer', 'mix-ginger-ale': 'Ginger ale', 'mix-cola': 'Cola', 'mix-lemon-lime': 'Lemon-lime soda',
    'mix-grapefruit-soda': 'Grapefruit soda', 'mix-other': 'Other mixers', 'mix-coffee': 'Coffee', 'mix-tea': 'Tea', 'mix-juice': 'Juice'}
for f in families:
    if f not in FAM_NAMES: errors.append(f'family without a name: {f}')

# ---------- fresh ----------
fresh = {}
for ln in lines('fresh.txt'):
    p = [x.strip() for x in ln.split('|')]
    if len(p) != 5: errors.append(f'fresh line: {ln}'); continue
    fid, name, group, keeps, notes = p
    if fid in fresh or fid in styles: errors.append(f'duplicate fresh id {fid}')
    fresh[fid] = {'id': fid, 'name': name, 'group': group, 'keeps': keeps, 'notes': notes}

# ---------- references ----------
def parse_ref(tok, where):
    alts = []
    for a in tok.split('|'):
        a = a.strip()
        if a.startswith('prep:'): alts.append({'prep': a[5:]})
        elif a.startswith('*'):
            if a[1:] not in families: errors.append(f'{where}: unknown family {a}')
            alts.append({'fam': a[1:]})
        elif a in styles: alts.append({'style': a})
        elif a in families: alts.append({'fam': a})
        elif a in fresh: alts.append({'fresh': a})
        else: errors.append(f'{where}: unknown ref @{a}')
    return alts

UNITS = r'(oz|dash|dashes|drop|drops|barspoon|barspoons|tsp|tbsp|leaves|leaf|sprig|sprigs|cube|cubes|whole|rinse|slices|slice|wedges|wedge|coin|pinch|float|ml|g|kg|l|cup|cups|bottle|bottles|top|piece|pieces|heads|head)'
def parse_ing(line, where, mode):
    line = line[1:].strip()
    ref = None
    m = re.search(r'@([^\s]+)\s*$', line)
    if m: ref = parse_ref(m.group(1), where); line = line[:m.start()].strip()
    q = None; unit = ''; text = line
    mm = re.match(r'^(\d+(?:\.\d+)?|\d+/\d+|\d+\s+\d+/\d+)\s*(?:' + UNITS + r'\b)?\s*(.*)$', line)
    if mm:
        raw = mm.group(1)
        if '/' in raw:
            parts = raw.split(); val = 0
            for pp in parts:
                if '/' in pp: a, b = pp.split('/'); val += float(a) / float(b)
                else: val += float(pp)
            q = val
        else: q = float(raw)
        unit = mm.group(2) or ''; text = mm.group(3).strip()
    out = {'q': q, 'u': unit, 't': text}
    if ref: out['ref'] = ref
    return out

def blocks(files):
    cur = None
    for fn in files:
        for ln in lines(fn):
            if ln.startswith('## '):
                if cur: yield cur
                cur = {'head': ln[3:], 'ings': [], 'notes': [], 'file': fn}
            elif ln.startswith('- '): cur['ings'].append(ln)
            elif ln.startswith('> '): cur['notes'].append(ln[2:])
    if cur: yield cur

preps = {}
for b in blocks(['preps1.txt', 'preps2.txt']):
    p = [x.strip() for x in b['head'].split('|')]
    if len(p) != 5: errors.append(f'prep head: {b["head"]}'); continue
    pid, name, kind, keeps, yld = p
    if pid in preps: errors.append(f'duplicate prep {pid}')
    preps[pid] = {'id': pid, 'name': name, 'kind': kind, 'keeps': int(keeps), 'yield': int(yld),
                  'ings': [parse_ing(x, pid, 'prep') for x in b['ings']], 'steps': b['notes']}

specs = {}
for b in blocks(['specs1.txt', 'specs2.txt', 'specs3.txt']):
    p = [x.strip() for x in b['head'].split('|')]
    if len(p) != 8: errors.append(f'spec head: {b["head"]}'); continue
    sid, name, fam, glass, ice, method, garnish, origin = p
    if sid in specs: errors.append(f'duplicate spec {sid}')
    specs[sid] = {'id': sid, 'name': name, 'family': fam, 'glass': glass, 'ice': ice, 'method': method, 'garnish': garnish, 'origin': origin,
                  'ings': [parse_ing(x, sid, 'spec') for x in b['ings']], 'notes': b['notes']}

# prep references resolve?
for coll, label in ((preps, 'prep'), (specs, 'spec')):
    for it in coll.values():
        for ing in it['ings']:
            for alt in ing.get('ref', []):
                if 'prep' in alt and alt['prep'] not in preps: errors.append(f'{label} {it["id"]}: unknown prep {alt["prep"]}')

# ---------- bottles ----------
bottles = []
seen = set()
for fn in sorted(glob.glob(os.path.join(HERE, 'bottles*.txt'))):
    for ln in lines(os.path.basename(fn)):
        p = [x.strip() for x in ln.split('|')]
        if len(p) != 3: errors.append(f'bottle line: {ln}'); continue
        name, sid, abv = p
        if sid not in styles: errors.append(f'bottle {name}: unknown style {sid}'); continue
        if name.lower() in seen: continue
        seen.add(name.lower())
        bottles.append([name, sid, float(abv)])

if errors:
    print('\n'.join(errors[:80])); print(f'{len(errors)} problems'); sys.exit(1)

out = {'v': 1, 'cats': CATS, 'styles': list(styles.values()), 'families': {k: {'name': FAM_NAMES[k], 'styles': v} for k, v in families.items()},
       'fresh': list(fresh.values()), 'preps': list(preps.values()), 'specs': list(specs.values()), 'bottles': bottles}
os.makedirs(os.path.dirname(OUT), exist_ok=True)
json.dump(out, open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print(f'styles {len(styles)} · families {len(families)} · fresh {len(fresh)} · preps {len(preps)} · specs {len(specs)} · bottles {len(bottles)} · {os.path.getsize(OUT)//1024} KB')
