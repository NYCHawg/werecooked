import json, re, glob, sys
from fractions import Fraction
U={'cup':'cup','cups':'cup','tbsp':'tbsp','tsp':'tsp','lb':'lb','oz':'oz','g':'g','ml':'ml','clove':'clove','can':'can','stick':'stick','pinch':'pinch','qt':'qt','package':'package','packet':'packet','head':'head','sheet':'sheet','slice':'slice','bag':'bag','box':'box','jar':'jar','bunch':'bunch','ear':'ear','sprig':'sprig','gal':'gal','pint':'pint','chub':'chub','tub':'tub','sleeve':'sleeve','bottle':'bottle','leaves':'leaf','dash':'dash'}
def ing(s):
    s=s.strip(); m=re.match(r'^((?:\d+\s+)?\d+(?:/\d+)?(?:\.\d+)?)\s+(.*)$',s)
    if not m: return {'qty':None,'unit':'','name':s}
    q=sum(Fraction(x) for x in m.group(1).split()); rest=m.group(2); w=rest.split(' ',1); u=''
    if w[0].lower() in U and len(w)>1: u=U[w[0].lower()]; rest=w[1]
    return {'qty':round(float(q),3),'unit':u,'name':rest.strip()}
out=[]; errs=[]
for f in sorted(glob.glob(sys.argv[1]+'/*.txt')):
    cur=None
    for ln in open(f, encoding='utf-8'):
        ln=ln.rstrip('\n')
        if ln.startswith('# '):
            p=[x.strip() for x in ln[2:].split('|')]
            while len(p)<7: p.append('')
            cur={'title':p[0],'servings':int(p[1] or 4),'time_min':int(p[2]) if p[2] else None,'category':p[3] or None,'kind':p[4] or 'meal',
                 'book_names':[b.strip() for b in p[5].split(',') if b.strip()],'tags':[t.strip() for t in p[6].split(',') if t.strip()],'ingredients':[],'steps':[],'notes':'','found_in':'We\'re Cooked library'}
            out.append(cur)
        elif ln.startswith('- '): cur['ingredients'].append(ing(ln[2:]))
        elif ln.startswith('> '): cur['steps'].append(ln[2:].strip())
        elif ln.startswith('! '): cur['notes']=(cur['notes']+' '+ln[2:].strip()).strip()
        elif ln.strip(): errs.append((f,ln))
seen={}
for r in out:
    if r['title'] in seen: errs.append(('dup',r['title']))
    seen[r['title']]=1
    if r['kind'] not in ('meal','component'): errs.append(('kind',r['title']))
json.dump(out,open(sys.argv[2],'w'),ensure_ascii=False,separators=(',',':'))
full=sum(1 for r in out if r['ingredients'] and r['steps']); steps=sum(1 for r in out if r['steps'] and not r['ingredients']); books=sum(1 for r in out if not r['steps'] and not r['ingredients'])
print(len(out),'entries | full',full,'| steps-only',steps,'| book-only',books, '| errors',errs[:10])
from collections import Counter
print(Counter(b for r in out for b in r['book_names']))
print(Counter(r['kind'] for r in out))
