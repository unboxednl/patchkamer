#!/usr/bin/env python3
# SPDX-License-Identifier: AGPL-3.0-or-later
"""Bouwt de index met vingerafdrukken van alle tunes en zet hem in het apparaatbestand van Tune Finder.

Elke tune van elk instrument dat noten speelt wordt offline gerenderd met de echte apparaatcode (OfflineAudioContext in headless
Chromium) op vier referentienoten (C2, C3, C4, C5, velocity 0,8, 0,9 s) en geanalyseerd met het analysegedeelte uit
devices/tools/TuneFinder/tune-finder.patchkamer-device.js (dezelfde code als in het apparaat). Zo hoort er nooit een afwijkende
kopie van de analyse bij de index: verander je de analyse, verhoog dan TA.VERSION en draai dit script opnieuw.

Gebruik, vanuit de root van de repo (Python 3, Node, Playwright met Chromium):
    python3 docs/tools/build-tune-index.py                 # alles; zet de index tussen de TUNE-INDEX-markeringen onderaan het apparaatbestand
    python3 docs/tools/build-tune-index.py --json x.json   # schrijft de index ook (of alleen, met --no-embed) als los JSON-bestand
    python3 docs/tools/build-tune-index.py --only duofone  # alleen tunes van apparaten waarvan de id dit bevat (voor een test; schrijft niet, tenzij je --target geeft)
    python3 docs/tools/build-tune-index.py --only lowbass --target devices/tools/BassFinder/bass-finder.patchkamer-device.js   # een eigen index in een ander apparaat (met dezelfde markeringen)
    python3 docs/tools/build-tune-index.py --jobs 8        # aantal Chromium-processen (standaard: de helft van de kernen)
Een apparaat mag geen bestanden of netwerk gebruiken (contract §15), dus de index zit in het apparaatbestand zelf. Een nieuwe tune of een nieuw
pack in tunes/ komt er door opnieuw te draaien in; verander je de analyse (TUNE-ANALYSIS in het apparaatbestand), verhoog dan TA.VERSION. Apparaten die niet te renderen zijn (drumcomputers,
loop-apparaten) en tunes die stil blijven staan in de melding aan het eind en in het veld "skipped" van de index.
Niet beluisterd: de index is een meting, geen oordeel over de klank."""
import argparse, base64, datetime, json, multiprocessing as mp, os, struct, sys, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from tunefinder_lib import *

def work(args):
    """One worker: its own server and Chromium; a list of (key, url, state, evport) -> results."""
    jobs, code = args
    from playwright.sync_api import sync_playwright
    srv, base = serve(); res = []
    with sync_playwright() as p:
        b, pg = open_page(p, base, code)
        for key, f, state, hasmode in jobs:
            url = url_of(base, f); how = 'notes'; vecs = None
            def run(st, notes, total, transport=False):
                out = []
                for note in notes:
                    r = render(pg, dict(deviceUrl=url, state=st, notes=[dict(note=note, vel=REF_VEL, t=0.1, dur=REF_DUR)] if note else [], total=total, transport=transport))
                    out.append(r)
                return out
            try:
                rs = run(state, REFS, REF_TOTAL)
                if all(r['peak'] < 2e-4 for r in rs) and hasmode:                  # a device with its own sequencer or drone mode: ask for notes
                    st2 = dict(state); st2['mode'] = 'notes'; rs2 = run(st2, REFS, REF_TOTAL)
                    if any(r['peak'] >= 2e-4 for r in rs2): rs, how = rs2, 'notes(mode)'
                if all(r['peak'] < 2e-4 for r in rs):                               # nothing: maybe a drone that only plays while the transport runs
                    rs3 = run(state, [0], 3.0, True)
                    if rs3[0]['peak'] >= 2e-4 and rs3[0]['r']: rs, how = rs3 * len(REFS), 'drone'
                bad = sum(r['bad'] for r in rs)
                vecs = [r['r']['vec'] if r['r'] and r['peak'] >= 2e-4 and not r['bad'] else None for r in rs]   # a render with NaN or Infinity is not used
                if not any(v for v in vecs): how = 'silent'
                res.append(dict(key=key, how=how, vecs=vecs, bad=bad, f0=[r['r']['f0'] if r['r'] else 0 for r in rs]))
            except Exception as e:
                res.append(dict(key=key, how='error', err=str(e)[:200], vecs=None, bad=0))
        b.close()
    srv.shutdown(); return res

def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--only', default=''); ap.add_argument('--jobs', type=int, default=max(2, (os.cpu_count() or 4) // 2))
    ap.add_argument('--json', default=''); ap.add_argument('--no-embed', action='store_true'); ap.add_argument('--target', default=''); a = ap.parse_args()
    code = analysis_source(); devs = device_files(); t0 = time.time()
    entries, jobs, skipped, devlist, devidx = [], [], {'devices': {}, 'tunes': []}, [], {}
    for pack, did, tl in tune_packs():
        d = devs.get(did)
        if not d: skipped['devices'][did] = 'no device file'; continue
        if a.only and a.only not in did: continue
        if d['category'] in SKIP_CATEGORIES or d['kind'] != 'instrument' or not d['ev']:
            skipped['devices'][did] = 'drum or loop device, not a note instrument' if d['category'] in SKIP_CATEGORIES else 'no note input'; continue
        if did not in devidx: devidx[did] = len(devlist); devlist.append(dict(id=did, name=d['name'], family=FAMILY.get(did, 'other')))
        for path, n in tl:
            entries.append((devidx[did], '/'.join(path), n['name'])); jobs.append((len(entries) - 1, d['file'], n['state'], 'mode' in n['state']))
    print(f'{len(entries)} tunes of {len(devlist)} devices, {a.jobs} workers'); sys.stdout.flush()
    jobs_by = [jobs[i::a.jobs] for i in range(a.jobs)]
    with mp.Pool(a.jobs) as pool: parts = pool.map(work, [(j, code) for j in jobs_by if j])
    out = {r['key']: r for part in parts for r in part}
    D = None; rows = []; kept = []; how_count = {}
    for i, (di, path, name) in enumerate(entries):
        r = out.get(i); how = r['how'] if r else 'missing'; how_count[how] = how_count.get(how, 0) + 1
        if not r or not r['vecs'] or not any(r['vecs']):
            skipped['tunes'].append(dict(device=devlist[di]['id'], tune=(path + '/' if path else '') + name, why=how + (' ' + r.get('err', '') if r else ''))); continue
        vs = r['vecs']; D = len(next(v for v in vs if v))
        fill = []                                                              # a silent reference note takes the nearest one that sounds
        for k in range(len(REFS)):
            j = min((m for m in range(len(REFS)) if vs[m]), key=lambda m: abs(m - k)); fill.append(vs[j])
        rows.append(fill); kept.append((di, path, name, 1 if how == 'drone' else 2 if how == 'notes(mode)' else 0))   # flag: 1 drone (one pitch), 2 only plays notes with mode 'notes'
    n = len(rows)
    import numpy as np
    X = np.array(rows, dtype=np.float64)                                      # n x refs x D
    flat = X.reshape(-1, D)
    scale = np.maximum(np.percentile(np.abs(flat), 99.9, axis=0), 1e-3) / 127
    Q = np.clip(np.round(X / scale), -127, 127).astype(np.int8)
    deq = Q.astype(np.float64) * scale
    sd = np.maximum(deq.reshape(-1, D).std(axis=0), 1e-3)
    idx = dict(format='patchkamer-tune-index', formatVersion=1, analysis=1, built=datetime.date.today().isoformat(), refs=REFS, vel=REF_VEL, dur=REF_DUR, dims=D,
               scale=[float('%.5g' % v) for v in scale], sd=[float('%.5g' % v) for v in sd], devices=devlist,
               tunes=[[di, path, name, fl] for di, path, name, fl in kept], enc='hex', data=Q.tobytes().hex(),
               skipped=dict(devices=skipped['devices'], tunes=len(skipped['tunes'])))
    s = json.dumps(idx, ensure_ascii=False, separators=(',', ':'))
    print(f'rendered {n} tunes in {time.time() - t0:.0f} s; {how_count}; index {len(s) / 1e6:.2f} MB; skipped devices {skipped["devices"]}')
    for t in skipped['tunes'][:40]: print('  silent/failed:', t)
    badby = {}
    for k, r in out.items():
        if r.get('bad'): key = devlist[entries[k][0]]['id'] + ' / ' + entries[k][2]; badby[key] = r['bad']
    print('non-finite samples in renders (replaced by 0):', sum(badby.values()), 'in', len(badby), 'tunes')
    for k, v in list(badby.items())[:25]: print('  non-finite:', k, v)
    if a.only and not a.target: print('(--only without --target: nothing written)'); return
    if a.json: open(a.json, 'w', encoding='utf8').write(s); print('written', a.json)
    if not a.no_embed:
        a.target = a.target or DEVICE_FILE; t = open(a.target, encoding='utf8').read(); b0, b1 = '// ==== TUNE-INDEX BEGIN', '// ==== TUNE-INDEX END'
        i0 = t.index(b0); i0 = t.index('\n', i0) + 1; i1 = t.index(b1)
        open(a.target, 'w', encoding='utf8').write(t[:i0] + 'const INDEX = ' + s + ';\n' + t[i1:]); print('index zit nu in', a.target)

if __name__ == '__main__': main()
