#!/usr/bin/env python3
# SPDX-License-Identifier: AGPL-3.0-or-later
"""Controleert dat alle versies in de repo kloppen en bij elkaar horen (SemVer, zie AGENTS.md "Regel: versies").

  python3 docs/tools/check-versions.py          # alles controleren, exitcode 1 bij een fout
  python3 docs/tools/check-versions.py --quiet  # alleen fouten

Gecontroleerd:
  * patchkamer/version.json: version (x.y.z), contract (x.y) en skinsContract (x.y)
  * contract: kop van NL, EN en de validator, en `patchkamer:'x.y'` in patchkamer/js/songs.js gelijk aan version.json
  * skinscontract: kop van NL, EN en de validator gelijk aan version.json
  * de changelogs (EN en NL): het bovenste kopje is de versie uit version.json
  * app/package.json: zelfde versie als de host
  * elke skin, elk preset-, tune- en samplepack: `version` (x.y.z); een skin noemt een skinsContract die niet nieuwer is dan de huidige
  * elk apparaat: `version` (x.y.z)
"""
import json, re, sys, glob, os
R = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
quiet = '--quiet' in sys.argv
err, ok = [], []
SEM, MM = re.compile(r'^\d+\.\d+\.\d+$'), re.compile(r'^\d+\.\d+$')
def rd(p):
    with open(os.path.join(R, p), encoding='utf-8') as f: return f.read()
def first(p): return rd(p).split('\n', 1)[0]
def key(v): return tuple(int(x) for x in v.split('.'))

vj = json.loads(rd('patchkamer/version.json'))
ver, con, scon = vj.get('version'), vj.get('contract'), vj.get('skinsContract')
if not (isinstance(ver, str) and SEM.match(ver)): err.append('patchkamer/version.json: version moet x.y.z zijn, nu %r' % ver)
if not (isinstance(con, str) and MM.match(con)): err.append('patchkamer/version.json: contract moet x.y zijn, nu %r' % con)
if not (isinstance(scon, str) and MM.match(scon)): err.append('patchkamer/version.json: skinsContract moet x.y zijn, nu %r' % scon)

def head(p, rx, what):
    m = re.search(rx, first(p))
    if not m: err.append('%s: kop niet herkend (%s)' % (p, first(p)[:70])); return
    if con and what == 'c' and m.group(1) != con: err.append('%s noemt contract v%s, version.json zegt %s' % (p, m.group(1), con))
    if scon and what == 's' and m.group(1) != scon: err.append('%s noemt skinscontract v%s, version.json zegt %s' % (p, m.group(1), scon))
head('contract/PATCHKAMER-CONTRACT_NL.md', r'Instrumentcontract v(\d+\.\d+)', 'c')
head('contract/PATCHKAMER-CONTRACT_EN.md', r'Instrument contract v(\d+\.\d+)', 'c')
head('contract/validate-instrument.mjs', r'contract v(\d+\.\d+)', 'c')
m = re.search(r"patchkamer:'(\d+\.\d+)'", rd('patchkamer/js/songs.js'))
if not m: err.append('patchkamer/js/songs.js: patchkamer:\'x.y\' niet gevonden')
elif con and m.group(1) != con: err.append("patchkamer/js/songs.js: patchkamer:'%s', version.json zegt %s" % (m.group(1), con))
head('skins/contract/SKINS-CONTRACT_NL.md', r'Skinscontract v(\d+\.\d+)', 's')
head('skins/contract/SKINS-CONTRACT_EN.md', r'Skins contract v(\d+\.\d+)', 's')
head('skins/contract/validate-skin.mjs', r'skins contract v(\d+\.\d+)', 's')

for p in ('CHANGELOG.md', 'CHANGELOG_NL.md'):
    m = re.search(r'(?m)^## (\S+)', rd(p))
    if not m: err.append('%s: geen versiekopje' % p)
    elif m.group(1) != ver: err.append('%s: bovenste kopje is %s, version.json zegt %s (nieuwe wijziging = nieuwe versie, zie AGENTS.md)' % (p, m.group(1), ver))
try:
    pv = json.loads(rd('app/package.json')).get('version')
    if pv != ver: err.append('app/package.json: version %s, host %s (node app/sync-version.js zet hem gelijk)' % (pv, ver))
except FileNotFoundError: pass

n = {'skins': 0, 'packs': 0, 'devices': 0}
for f in sorted(glob.glob(os.path.join(R, 'skins/library/*/*.json'))):
    j = json.load(open(f, encoding='utf-8')); n['skins'] += 1; rel = os.path.relpath(f, R)
    if not (isinstance(j.get('version'), str) and SEM.match(j['version'])): err.append('%s: version moet x.y.z zijn, nu %r' % (rel, j.get('version')))
    sc = j.get('skinsContract')
    if isinstance(sc, str) and MM.match(sc) and scon and key(sc) > key(scon): err.append('%s: skinsContract %s is nieuwer dan de host (%s)' % (rel, sc, scon))
for pat in ('presets/*.json', 'tunes/*.json', 'samples/*.json'):
    for f in sorted(glob.glob(os.path.join(R, pat))):
        j = json.load(open(f, encoding='utf-8')); n['packs'] += 1; rel = os.path.relpath(f, R)
        if not (isinstance(j.get('version'), str) and SEM.match(j['version'])): err.append('%s: version moet x.y.z zijn, nu %r' % (rel, j.get('version')))
for f in sorted(glob.glob(os.path.join(R, 'devices/**/*.patchkamer-device.js'), recursive=True)):
    n['devices'] += 1; m = re.search(r"""[,{\s]"?version"?:\s*['"]([^'"]*)['"]""", open(f, encoding='utf-8').read())
    if not (m and SEM.match(m.group(1))): err.append('%s: version moet x.y.z zijn' % os.path.relpath(f, R))

if err:
    print('VERSIES: %d fout(en)' % len(err)); [print('  - ' + e) for e in err]; sys.exit(1)
if not quiet: print('OK versies: host %s, contract %s, skinscontract %s; %d skins, %d packs, %d apparaten' % (ver, con, scon, n['skins'], n['packs'], n['devices']))
