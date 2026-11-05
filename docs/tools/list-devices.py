#!/usr/bin/env python3
# SPDX-License-Identifier: AGPL-3.0-or-later
"""Genereert de overzichtstabellen in devices/AGENTS.md, presets/AGENTS.md en tunes/AGENTS.md uit de bestanden zelf.

Gebruik, vanuit de root van de repo:
    python3 docs/tools/list-devices.py            # werkt de drie tabellen bij (tussen de <!-- list-devices:... -->-markeringen)
    python3 docs/tools/list-devices.py --check    # schrijft niets; exitcode 1 als een tabel niet meer klopt
    python3 docs/tools/list-devices.py --print devices|presets|tunes   # drukt één tabel af

Waar de gegevens vandaan komen:
- Per apparaat (id, naam, soort `kind`, poorten met id, naam en richting): de definitie in het apparaatbestand
  (devices/<soort>/<Naam>/<naam>.patchkamer-device.js). Dat wordt met Node geladen (`node` moet bestaan); de definitie
  is gewone data naast `create`, dus er is geen host voor nodig. Namen komen uit `i18n.nl` als die er is.
- De omschrijving, de handleiding-link en het anker: de tabel in devices/<soort>/README_NL.md. Staat een apparaat daar
  niet in, dan komt de omschrijving uit de kop van het apparaatbestand.
- Tunes en presets: de packs in tunes/ en presets/ (device, naam, aantal, mappen op het hoogste niveau).
- Elke link in de uitvoer wordt gecontroleerd (bestaat het bestand, bestaat het anker in de handleiding); een kapotte link
  staat op stderr en geeft exitcode 1.
Nodig: Python 3 en Node.
"""
import argparse, glob, json, os, re, subprocess, sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
SUFFIX = '.patchkamer-device.js'
AREAS = ['synths', 'samplers', 'drums', 'sequencers', 'modulators', 'effects', 'mastering', 'mixer', 'tools']
AREA_TITLE = {'synths': 'Synths', 'samplers': 'Samplers', 'drums': 'Drums', 'sequencers': 'Sequencers', 'modulators': 'Modulators',
              'effects': 'Effects', 'mastering': 'Mastering', 'mixer': 'Mixer', 'tools': 'Tools'}
PORT_KINDS = ['audio', 'event', 'mod', 'multi', 'mastering', 'multievent']
problems = []

NODE = r"""
import {pathToFileURL} from 'url';
const out = [];
for (const f of process.argv.slice(1)) {
  const d = (await import(pathToFileURL(f).href)).default, nl = (d.i18n && d.i18n.nl) || {}, pn = nl.ports || {};
  const ports = {};
  for (const [k, list] of Object.entries(d.ports || {})) if (Array.isArray(list) && list.length) ports[k] = list.map(p => ({id: p.id, name: pn[p.id] || p.name}));
  out.push({file: f, id: d.id, name: nl.name || d.name, version: d.version, kind: d.kind, ports});
}
console.log(JSON.stringify(out));
"""

def rel(p, base):
    return os.path.relpath(p, base).replace(os.sep, '/')

def slug(h):
    # GitHub-anker van een kopregel
    h = re.sub(r'[`*_]', '', h.strip().lower())
    h = re.sub(r'[^\w\s-]', '', h, flags=re.U)
    return re.sub(r'\s', '-', h)

_anchors = {}
def anchors(path):
    if path not in _anchors:
        s = set()
        if os.path.exists(path):
            for line in open(path, encoding='utf-8'):
                m = re.match(r'#{1,6}\s+(.*)', line)
                if m: s.add(slug(m.group(1)))
        _anchors[path] = s
    return _anchors[path]

def link_ok(target, base):
    """target is een relatieve link (met optioneel #anker) vanaf map base."""
    path, _, anc = target.partition('#')
    full = os.path.normpath(os.path.join(base, path))
    if not os.path.exists(full):
        problems.append('bestaat niet: %s (vanuit %s)' % (target, rel(base, ROOT))); return False
    if anc and anc not in anchors(full):
        problems.append('anker bestaat niet: %s (vanuit %s)' % (target, rel(base, ROOT))); return False
    return True

def load_devices():
    files = sorted(glob.glob(os.path.join(ROOT, 'devices', '*', '*', '*' + SUFFIX)))
    r = subprocess.run(['node', '--input-type=module', '-e', NODE] + files, capture_output=True, text=True, env=dict(os.environ, NODE_NO_WARNINGS='1'))
    if r.returncode: sys.exit('Node kon de apparaten niet laden:\n' + r.stderr)
    devs = []
    for d in json.loads(r.stdout):
        parts = rel(d['file'], os.path.join(ROOT, 'devices')).split('/')
        d['area'], d['folder'] = parts[0], parts[1]
        d['path'] = d['area'] + '/' + d['folder']
        devs.append(d)
    return devs

def header_summary(d):
    # reserve: de omschrijving uit de kopregels van het apparaatbestand ("Eerste versie. <omschrijving>")
    txt = ''
    for line in open(d['file'], encoding='utf-8'):
        if not line.startswith('//'): break
        txt += ' ' + line[2:].strip()
    m = re.search(r'Eerste versie\.\s*(.+?)(?:\.\s|$)', txt)
    return (m.group(1).strip() if m else '').rstrip('.') + ('.' if m else '')

def readme_rows(area):
    """folder -> {desc, manual} uit de tabel in devices/<soort>/README_NL.md"""
    rows = {}
    p = os.path.join(ROOT, 'devices', area, 'README_NL.md')
    for line in open(p, encoding='utf-8'):
        if not line.startswith('| ') or line.startswith('| Apparaat') or line.startswith('|---'): continue
        cells = [c.strip() for c in line.strip().strip('|').split(' | ')]
        m = re.search(r'`([A-Za-z0-9]+)/`', cells[2]) if len(cells) > 2 else None
        if not m: continue
        man = re.search(r'\]\((\.\./\.\./docs/[a-z]+/USER-MANUAL_NL\.md(?:#[^)]*)?)\)', line)
        rows[m.group(1)] = {'desc': cells[1], 'manual': man.group(1)[len('../../'):] if man else None}
    return rows

def packs():
    out = []
    for kind, ext in (('tunes', '.patchkamer-tunes.json'), ('presets', '.patchkamer-presets.json')):
        for f in sorted(glob.glob(os.path.join(ROOT, kind, '*' + ext))):
            j = json.load(open(f, encoding='utf-8'))
            def count(tree):
                n = 0
                for x in tree:
                    n += count(x.get('items') or x.get('children') or []) if 'folder' in x else 1
                return n
            tree = j.get('tree') or []
            if not tree and j.get('presets'):   # formatVersion 1
                tree = [{'name': p.get('name'), 'kind': 'set'} for p in j['presets']]
            top = [x['folder'] for x in tree if 'folder' in x]
            def parts(tr):
                return sum((parts(x.get('items', [])) if 'folder' in x else (1 if x.get('kind') == 'part' else 0)) for x in tr)
            out.append({'type': kind, 'file': rel(f, ROOT), 'device': j.get('device'), 'name': j.get('name'), 'n': count(tree),
                        'top': top, 'ntop': len(top), 'parts': parts(tree), 'license': j.get('license'), 'fv': j.get('formatVersion')})
    return out

def port_cell(d):
    segs = []
    for k in PORT_KINDS:
        for dirn, suffix in (('in', 'In'), ('uit', 'Out')):
            lst = d['ports'].get(k + suffix)
            if lst: segs.append('%s %s: %s' % (k, dirn, ', '.join('`%s` (%s)' % (p['id'], p['name']) for p in lst)))
    return '<br>'.join(segs) if segs else 'geen'

def table_devices(devs, base):
    packs_by = {}
    for p in packs(): packs_by.setdefault(p['device'], []).append(p)
    out = []
    for area in AREAS:
        rows = readme_rows(area)
        out.append('### %s\n' % AREA_TITLE[area])
        out.append('| Apparaat | `id` | Map | Wat het doet | Poorten (`id` en naam) | Tunes of presets | Documentatie |')
        out.append('|---|---|---|---|---|---|---|')
        for d in sorted((x for x in devs if x['area'] == area), key=lambda x: x['name'].lower()):
            info = rows.get(d['folder'], {})
            desc = info.get('desc') or header_summary(d) or 'geen omschrijving beschikbaar'
            mp = d['path'] + '/'
            link_ok(mp, os.path.join(ROOT, 'devices'))
            ag = os.path.exists(os.path.join(ROOT, 'devices', d['path'], 'AGENTS.md'))
            docs = []
            if ag: docs.append('[AGENTS.md](%s/AGENTS.md)' % d['path'])
            if info.get('manual'):
                t = '../' + info['manual']
                if link_ok(t, os.path.join(ROOT, 'devices')): docs.append('[handleiding](%s)' % t)
            ps = packs_by.get(d['id'], [])
            kindname = 'tunes' if d['kind'] == 'instrument' else 'presets'
            if ps:
                pk = '; '.join('[%d %s](%s)' % (p['n'], p['type'], '../' + p['file']) for p in ps)
                for p in ps: link_ok('../' + p['file'], os.path.join(ROOT, 'devices'))
            else:
                pk = 'geen pack (%s zouden %s zijn)' % ('tunes' if d['kind'] == 'instrument' else 'presets', kindname) if False else 'geen pack'
            out.append('| %s | `%s` | [`%s`](%s) | %s | %s | %s | %s |' % (d['name'], d['id'], d['path'] + '/', mp, desc.replace('|', '\\|'), port_cell(d), '%s (`kind: %s`)' % (pk, d['kind']), ' · '.join(docs) or '–'))
        out.append('')
    return '\n'.join(out).rstrip() + '\n'

def table_packs(kind, devs, base):
    names = {d['id']: d for d in devs}
    out = []
    ps = [p for p in packs() if p['type'] == kind]
    if kind == 'presets':
        out.append('| Apparaat | Pack | Presets | Mappen op het hoogste niveau | Bestand | formatVersion |')
        out.append('|---|---|---|---|---|---|')
    else:
        out.append('| Apparaat | Pack | Tunes | Stijlmappen (hoogste niveau) | Bestand | Losse instrumenten (`part`) |')
        out.append('|---|---|---|---|---|---|')
    for p in sorted(ps, key=lambda p: (names.get(p['device'], {}).get('area', 'zzz'), names.get(p['device'], {}).get('name', p['device']).lower())):
        d = names.get(p['device'])
        if not d: problems.append('pack %s: device %s niet gevonden' % (p['file'], p['device'])); continue
        dl = '[%s](../devices/%s/)' % (d['name'], d['path']); link_ok('../devices/%s/' % d['path'], base)
        fl = os.path.basename(p['file']); link_ok(fl, base)
        folders = ', '.join(p['top']) if p['top'] else 'geen (alles op het hoogste niveau)'
        if kind == 'presets':
            out.append('| %s | %s | %d | %d: %s | [`%s`](%s) | %s |' % (dl, p['name'], p['n'], p['ntop'], folders, fl, fl, p['fv']))
        else:
            out.append('| %s | %s | %d | %d: %s | [`%s`](%s) | %s |' % (dl, p['name'], p['n'], p['ntop'], folders, fl, fl, p['parts'] if p['parts'] else '–'))
    out.append('')
    tot = sum(p['n'] for p in ps)
    out.append('Samen %d packs met %d %s.' % (len(ps), tot, kind))
    return '\n'.join(out) + '\n'

TARGETS = {'devices': 'devices/AGENTS.md', 'presets': 'presets/AGENTS.md', 'tunes': 'tunes/AGENTS.md'}

def build(which, devs):
    base = os.path.join(ROOT, os.path.dirname(TARGETS[which]))
    return table_devices(devs, base) if which == 'devices' else table_packs(which, devs, base)

def splice(text, which, body):
    b, e = '<!-- list-devices:begin %s -->' % which, '<!-- list-devices:end %s -->' % which
    m = re.search(re.escape(b) + r'.*?' + re.escape(e), text, re.S)
    if not m: sys.exit('markeringen %s ontbreken in %s' % (b, TARGETS[which]))
    return text[:m.start()] + b + '\n' + body + e + text[m.end():]

def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--check', action='store_true'); ap.add_argument('--print', dest='pr', choices=list(TARGETS))
    a = ap.parse_args(); devs = load_devices()
    if a.pr:
        sys.stdout.write(build(a.pr, devs))
    else:
        stale = False
        for which, path in TARGETS.items():
            full = os.path.join(ROOT, path); old = open(full, encoding='utf-8').read(); new = splice(old, which, build(which, devs))
            if new != old:
                stale = True
                if not a.check: open(full, 'w', encoding='utf-8').write(new); print('bijgewerkt:', path)
        if a.check and stale: print('verouderd: draai docs/tools/list-devices.py'); problems.append('verouderd')
        if not stale: print('alle tabellen kloppen')
    for p in problems: print('PROBLEEM:', p, file=sys.stderr)
    sys.exit(1 if problems else 0)

if __name__ == '__main__':
    main()
