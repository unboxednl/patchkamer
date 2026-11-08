#!/usr/bin/env python3
# SPDX-License-Identifier: AGPL-3.0-or-later
"""Meet hoe goed Bass Finder een baslijn opschrijft (hold-out met grondwaarheid).

Willekeurige baslijnen (tempo 80-150, 2 maten, noten van E0 tot C3, wisselende lengte, velocity en staccato/legato/glide) worden met de
ECHTE apparaatcode van basgerichte synths (Basic Mono, Ladder Mono, Low Bass, Sub Line, Acid Baselines, Acid Stepper, Cross Mod Mono) offline gerenderd
(headless Chromium, OfflineAudioContext, de tunes uit de packs), eventueel verslechterd (zachter, ruis, laagdoorlaat, mono) of door onze eigen Room/Chorus
gehaald, en daarna door de engine van Bass Finder (export `engine` van het apparaatbestand) gehaald. Gemeten:

  note-F1        een gevonden noot telt als de MIDI-toonhoogte gelijk is (afgerond, dus +-50 cent) en de start binnen 50 ms ligt
  octaaffout     start binnen 50 ms van een ware noot, toonhoogte een of twee octaven ernaast, als percentage van de ware noten
  lengtefout     mediane absolute fout van de lengte (ms) van de gevonden noten, ten opzichte van de gate-lengte
  tik-F1         met bekend tempo en raster 1/16: exact dezelfde stap (ten opzichte van de eerste noot), toonhoogte en lengte (+-1 stap)

De ware toonhoogte is de gespeelde noot plus een verschuiving die per tune wordt bepaald (twee proefnoten, laagste spectraallijn tot -14 dB), omdat sommige
tunes een transpositie of een sub-oscillator hebben. Niet beluisterd; echte opnames, echte invoerapparaten en microfoons zijn hier niet bij.

    python3 docs/tools/eval-bass-finder.py [--per-device 5 --lines 2 --seed 11 --jobs 8 --scen clean,quiet,noise,lowpass,mono,room,chorus,staccato,legato,glide --out res.json]
Vereist: Python met numpy en playwright (Chromium), Node."""
import argparse, base64, json, math, multiprocessing as mp, os, random, re, sys, time, zlib
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from tunefinder_lib import ROOT, HERE, serve, tune_packs, device_files, url_of
import numpy as np

FINDER = os.path.join(ROOT, 'devices', 'tools', 'BassFinder', 'bass-finder.patchkamer-device.js')
BASS = ['mono', 'laddermono', 'lowbass', 'subline', 'acidbaselines', 'acidstepper', 'crossmodmono']
SCEN = {   # name: (gate fraction, degradations, effect, glide)
    'clean': dict(gate=0.8), 'quiet': dict(gate=0.8, deg=dict(gainDb=-30)), 'noise': dict(gate=0.8, deg=dict(gainDb=-12, noiseDb=-45)),
    'lowpass': dict(gate=0.8, lp=500), 'mono': dict(gate=0.8, deg=dict(mono=True)), 'room': dict(gate=0.8, fx='room'), 'chorus': dict(gate=0.8, fx='chorus'),
    'staccato': dict(gate=0.4), 'legato': dict(gate=1.0), 'glide': dict(gate=1.03, glide=0.06),
}
ROOMS = ['Spaces/Small Room', 'Spaces/Warm Hall', 'Spaces/Bright Plate']; CHORUSES = ['Subtle/Subtle Double', 'Subtle/Classic Chorus', 'Ensemble/Wide Pad']
SR = 44100

def preset_state(pack, path):
    j = json.load(open(f'{ROOT}/presets/{pack}.patchkamer-presets.json'))
    def walk(items, p):
        for x in items:
            if 'items' in x:
                r = walk(x['items'], p + x['folder'] + '/')
                if r: return r
            elif p + x['name'] == path: return x['state']
    return walk(j.get('tree') or j.get('presets'), '')

def make_line(rng, gate, bpm):
    """Random mono bass line of two bars: [{step, len (steps), note, vel}] with no overlap."""
    step = 15 / bpm; root = rng.randint(28, 40); degs = [0, 0, 0, 3, 5, 7, 10, 12, -12, 0, 7, 5]
    notes, s = [], 0
    while s < 32:
        if rng.random() < (0.8 if s % 4 == 0 else 0.55):
            ln = rng.choice([1, 1, 1, 2, 2, 3, 4]); ln = min(ln, 32 - s); n = root + rng.choice(degs)
            while n < 24: n += 12
            while n > 60: n -= 12
            notes.append(dict(step=s, len=ln, note=n, vel=round(rng.uniform(0.55, 1.0), 2))); s += ln
        else: s += 1
    return notes, step

def spec_of(sp, line, step, off, t0=0.0):
    return [dict(note=q['note'] - off, vel=q['vel'], t=t0 + q['step'] * step, dur=max(0.03, q['len'] * step * sp['gate'])) for q in line]

def f0_of(x, sr):
    """Fundamental of a steady note: the lowest strong spectral line (at least 20 % of the maximum, -14 dB)."""
    x = x[int(0.25 * sr):int(1.0 * sr)]; x = x * np.hanning(len(x)); n = 1 << 18
    S = np.abs(np.fft.rfft(x, n)); fr = np.fft.rfftfreq(n, 1 / sr); ok = (fr > 20) & (fr < 1500); S = np.where(ok, S, 0)
    mx = S.max()
    if mx <= 0: return None
    pk = [i for i in range(1, len(S) - 1) if S[i] >= 0.2 * mx and S[i] > S[i - 1] and S[i] >= S[i + 1]]
    return fr[pk[0]] if pk else None

def work(args):
    jobs, = args
    from playwright.sync_api import sync_playwright
    srv, base = serve(); res = []
    with sync_playwright() as p:
        b = p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required']); pg = b.new_page()
        pg.route('**/blank.html', lambda r: r.fulfill(body='<!doctype html><title>x</title>', content_type='text/html'))
        pg.goto(base + '/blank.html'); pg.add_script_tag(path=os.path.join(HERE, 'bass-finder-page.js'))
        for q in jobs:
            try:
                sp = dict(q['spec']); sp['deviceUrl'] = url_of(base, q['file']); sp['finderUrl'] = url_of(base, FINDER)
                sp['fx'] = [dict(url=url_of(base, f['file']), state=f['state']) for f in sp.get('fx', [])]
                if q['kind'] == 'probe':
                    sp['wantAudio'] = True; sp.pop('finderUrl', None)
                    r = pg.evaluate('s=>BFrender(s)', sp)
                    x = np.frombuffer(base64.b64decode(r['audio'][0]), dtype=np.float32)
                    res.append(dict(id=q['id'], peak=r['peak'], bad=r['bad'], f1=f0_of(x[int(0.1 * SR):], SR), f2=f0_of(x[int(1.6 * SR):], SR)))
                else:
                    r = pg.evaluate('s=>BFrender(s)', sp)
                    res.append(dict(id=q['id'], peak=r['peak'], bad=r['bad'], r=r.get('r'), err=r.get('err'), ms=r.get('ms'), audio=r.get('audio')))
            except Exception as e: res.append(dict(id=q['id'], error=str(e)[:200]))
        b.close()
    srv.shutdown(); return res

def save_wav(a, m, jobs_by_id, path):
    import wave
    os.makedirs(os.path.dirname(path), exist_ok=True); j = json.loads(json.dumps(jobs_by_id[f"{m['qid']}-free"])); j['spec']['wantAudio'] = True; j['spec'].pop('opts', None)
    r = work(([j],))[0]
    if 'audio' not in r and not r.get('error'): pass
    x = np.frombuffer(base64.b64decode(r['audio'][0]), dtype=np.float32) if r.get('audio') else None
    if x is None: return
    w = wave.open(path, 'wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(x, -1, 1) * 32767).astype('<i2').tobytes()); w.close()

def run_pool(jobs, n):
    parts = [jobs[k::n] for k in range(n)]
    with mp.Pool(n) as pool: out = pool.map(work, [(j,) for j in parts if j])
    return {r['id']: r for p in out for r in p}

# ---------- scoring ----------
def match(truth, det, tol=0.05):
    """Greedy one-to-one match on start (+-tol s) and equal pitch. truth/det: lists of (start, midi, ...). Returns matched pairs, and the unmatched indexes."""
    pairs, used = [], set()
    for i, t in sorted(enumerate(truth), key=lambda a: a[1][0]):
        best, bd = None, 1e9
        for j, d in enumerate(det):
            if j in used or d[1] != t[1]: continue
            dd = abs(d[0] - t[0])
            if dd <= tol and dd < bd: best, bd = j, dd
        if best is not None: used.add(best); pairs.append((i, best))
    return pairs

def match_any_octave(truth, det, tol=0.05):
    used, n = set(), 0
    for i, t in sorted(enumerate(truth), key=lambda a: a[1][0]):
        best, bd = None, 1e9
        for j, d in enumerate(det):
            if j in used or (d[1] - t[1]) % 12: continue
            dd = abs(d[0] - t[0])
            if dd <= tol and dd < bd: best, bd = j, dd
        if best is not None: used.add(best); n += 1
    return n

def score(truth, det):
    anyoct = match_any_octave(truth, det)
    pairs = match(truth, det); mt = {i for i, _ in pairs}; md = {j for _, j in pairs}
    oct_err = 0; wrong = 0
    for i, t in enumerate(truth):
        if i in mt: continue
        c = [d for j, d in enumerate(det) if j not in md and abs(d[0] - t[0]) <= 0.05]
        if any(abs(d[1] - t[1]) in (12, 24) for d in c): oct_err += 1
        elif c: wrong += 1
    le = [abs((det[j][2] - det[j][0]) - (truth[i][2] - truth[i][0])) * 1000 for i, j in pairs]
    se = [(det[j][0] - truth[i][0]) * 1000 for i, j in pairs]
    return dict(tpa=anyoct, tp=len(pairs), nt=len(truth), nd=len(det), oct=oct_err, wrong=wrong, le=le, se=se)

def tick_score(line, res_notes, step):
    """Known tempo, grid 1/16: compare steps relative to the first note, pitch exact, length within one step."""
    if not res_notes or not line: return dict(tp=0, nt=len(line), nd=len(res_notes or []))
    t0 = res_notes[0]['t']; det = [((q['t'] - t0) / 12, q['n'], q['len'] / 12) for q in res_notes]; tr = [(q['step'] - line[0]['step'], q['note'], q['len']) for q in line]
    used, tp = set(), 0
    for t in tr:
        for j, d in enumerate(det):
            if j not in used and abs(d[0] - t[0]) < 1e-6 and d[1] == t[1] and abs(d[2] - t[2]) <= 1.0001: used.add(j); tp += 1; break
    return dict(tp=tp, nt=len(tr), nd=len(det))

def f1(tp, nt, nd): p = tp / nd if nd else 0; r = tp / nt if nt else 0; return 2 * p * r / (p + r) if p + r else 0

def main():
    global SR
    ap = argparse.ArgumentParser(); ap.add_argument('--per-device', type=int, default=5); ap.add_argument('--lines', type=int, default=2); ap.add_argument('--seed', type=int, default=11)
    ap.add_argument('--jobs', type=int, default=8); ap.add_argument('--scen', default=','.join(SCEN)); ap.add_argument('--out'); ap.add_argument('--sr', type=int, default=SR); ap.add_argument('--wav', help='map: bewaar de audio van de getoonde lijnen als WAV (met --show)'); ap.add_argument('--split', default='all', choices=['all', 'dev', 'test'], help='dev: de helft tunes waarop afgesteld is, test: de andere helft (op naam)'); ap.add_argument('--set', default='all', choices=['all', 'bass'], help='bass: alleen tunes met "bass" of "sub" in de naam (de bedoelde toepassing); all: alle tunes van deze synths (ook pads, leads, drones en bellen)'); ap.add_argument('--opts', default='{}', help='extra opties voor de engine (JSON), bijvoorbeeld \'{"octave":false}\''); ap.add_argument('--tunes', action='store_true', help='toon ook de F1 per tune'); ap.add_argument('--show', type=int, default=0, help='toon de N slechtste lijnen (ware en gevonden noten)')
    a = ap.parse_args(); SR = a.sr
    devs = device_files(); rng = random.Random(a.seed); scen = a.scen.split(',')
    pick = []
    for pack, did, tl in tune_packs():
        if did.split('.')[-1] not in BASS: continue
        l = tl[:]; rng.shuffle(l)
        l = [x for x in l if 'chord' not in x[1]['name'].lower() and (a.set == 'all' or re.search(r'bass|\bsub\b', x[1]['name'].lower())) and (a.split == 'all' or (zlib.crc32((did + x[1]['name']).encode()) % 2 == 0) == (a.split == 'dev'))]      # a chord is not a bass line
        for path, n in l[:a.per_device]: pick.append((did, pack, path, n))
    print(len(pick), 'tunes from', len({p[0] for p in pick}), 'devices')
    fxfile = {'room': (devs['nl.patchkamer.room']['file'], 'room'), 'chorus': (devs['nl.patchkamer.chorus']['file'], 'chorus')}
    def state_of(did, n, glide):
        st = json.loads(json.dumps(n['state']))
        if 'mode' in st: st['mode'] = 'notes'
        if glide is not None:
            if 'glide' not in st: return None
            st['glide'] = glide
        return st
    # 1. calibration (offset between the played note and the sounding pitch)
    probes = []
    for k, (did, pack, path, n) in enumerate(pick):
        st = state_of(did, n, None)
        probes.append(dict(id=k, kind='probe', file=devs[did]['file'], spec=dict(state=st, total=3.2, sr=SR, notes=[dict(note=36, vel=0.9, t=0.1, dur=1.2), dict(note=48, vel=0.9, t=1.6, dur=1.2)], fx=[])))
    t0 = time.time(); pr = run_pool(probes, a.jobs); good = []
    for k, p in enumerate(pick):
        r = pr.get(k, {})
        if r.get('error') or not r.get('f1') or not r.get('f2') or r.get('peak', 0) < 1e-3: continue
        o1 = round(12 * math.log2(r['f1'] / 440) + 69) - 36; o2 = round(12 * math.log2(r['f2'] / 440) + 69) - 48
        if o1 != o2: continue
        good.append((p, o1))
    print(len(good), 'tunes with a usable pitch of', len(pick), f'(calibration {time.time() - t0:.0f} s); offsets', sorted({o for _, o in good}))
    # 2. lines
    jobs, meta = [], {}
    for k, ((did, pack, path, n), off) in enumerate(good):
        for sc in scen:
            S = SCEN[sc]
            st = state_of(did, n, S.get('glide'))
            if st is None: continue
            for li in range(a.lines):
                r2 = random.Random(f'{a.seed}-{k}-{sc}-{li}'); bpm = r2.choice([80, 90, 100, 110, 120, 130, 140, 150]); line, step = make_line(r2, S['gate'], bpm)
                if not line: continue
                fx = []
                if S.get('fx'):
                    pth = r2.choice(ROOMS if S['fx'] == 'room' else CHORUSES); fx = [dict(file=fxfile[S['fx']][0], state=preset_state(fxfile[S['fx']][1], pth))]
                notes = spec_of(S, line, step, off); total = round(32 * step + 1.0, 2)
                qid = len(meta)
                for tag, opts in (('free', dict(sens=0.5, **json.loads(a.opts))), ('known', dict(sens=0.5, bpm=bpm, grid='16', swing=0, align='first', **json.loads(a.opts)))):
                    jid = f'{qid}-{tag}'
                    jobs.append(dict(id=jid, kind='line', file=devs[did]['file'], spec=dict(state=st, total=total, sr=SR, notes=notes, fx=fx, lpHz=S.get('lp'), deg=S.get('deg'), seed=r2.randint(1, 10 ** 6), opts=opts)))
                meta[qid] = dict(scen=sc, dev=did, tune=path[-1] if path else '', name=n['name'], line=line, step=step, off=off, S=S, bpm=bpm)
    jobs_by_id = {j['id']: j for j in jobs}
    print(len(jobs), 'renders'); t0 = time.time(); res = run_pool(jobs, a.jobs); print(f'rendered and analysed in {time.time() - t0:.0f} s')
    # 3. scoring
    acc = {}
    def add(key, s):
        d = acc.setdefault(key, dict(tp=0, tpa=0, nt=0, nd=0, oct=0, wrong=0, le=[], se=[], ttp=0, tnt=0, tnd=0, lines=0, bad=0, fail=0, ms=[], vel=[]))
        for k in ('tp', 'tpa', 'nt', 'nd', 'oct', 'wrong'): d[k] += s.get(k, 0)
        d['le'] += s.get('le', []); d['se'] += s.get('se', [])
    nonfin = 0; fails = 0; ms = []; worst = []
    for qid, m in meta.items():
        rf, rk = res.get(f'{qid}-free', {}), res.get(f'{qid}-known', {})
        if rf.get('error') or rf.get('err') or rk.get('error') or rk.get('err'): fails += 1; continue
        nonfin += rf.get('bad', 0)
        if rf.get('ms'): ms.append(rf['ms'])
        truth = [(q['step'] * m['step'], q['note'], q['step'] * m['step'] + q['len'] * m['step'] * m['S']['gate']) for q in m['line']]
        r = rf.get('r') or {}
        det = [(q['s'], q['midi'], q['e']) for q in (r.get('raw') or [])]
        s = score(truth, det)
        m['qid'] = qid
        if a.show: worst.append((s['tp'] / max(1, max(s['nt'], s['nd'])), m, truth, det, r))
        t = tick_score(m['line'], (rk.get('r') or {}).get('notes'), m['step'])
        for key in (m['scen'], 'all', 'dev:' + m['dev'].split('.')[-1]) + (('tune:' + m['dev'].split('.')[-1] + ' / ' + m['name'],) if a.tunes else ()):
            add(key, s); d = acc[key]; d['ttp'] += t['tp']; d['tnt'] += t['nt']; d['tnd'] += t['nd']; d['lines'] += 1
    hdr = f"{'situation':<10} {'lines':>5} {'notes':>6} {'F1':>6} {'prec':>6} {'rec':>6} {'oct err':>8} {'other pitch':>11} {'start med|ms|':>13} {'length med|ms|':>14} {'tick F1':>8} {'F1 any oct':>10}"
    for sc_, m, truth, det, r in sorted(worst, key=lambda w: w[0])[:a.show]:
        print(f"--- {m['dev']} / {m['name']} / {m['scen']} bpm {m['bpm']} F={sc_:.2f} offset {m['off']}")
        if a.wav: save_wav(a, m, jobs_by_id, f"{a.wav}/{m['dev'].split('.')[-1]}-{m['scen']}-{m['bpm']}-{m['qid']}.wav")
        print('  truth:', ' '.join(f"{t[0]:.2f}:{t[1]}({t[2]-t[0]:.2f})" for t in truth)); print('  found:', ' '.join(f"{d[0]:.2f}:{d[1]}({d[2]-d[0]:.2f})" for d in det))
    print(hdr)
    def row(k):
        d = acc[k]; p = d['tp'] / d['nd'] if d['nd'] else 0; r = d['tp'] / d['nt'] if d['nt'] else 0
        print(f"{k:<10} {d['lines']:>5} {d['nt']:>6} {f1(d['tp'], d['nt'], d['nd']):>6.3f} {p:>6.3f} {r:>6.3f} {100 * d['oct'] / max(1, d['nt']):>7.1f}% {100 * d['wrong'] / max(1, d['nt']):>10.1f}% "
              f"{np.median(np.abs(d['se'])) if d['se'] else 0:>13.0f} {np.median(d['le']) if d['le'] else 0:>14.0f} {f1(d['ttp'], d['tnt'], d['tnd']):>8.3f} {f1(d['tpa'], d['nt'], d['nd']):>10.3f}")
    for k in [s for s in scen if s in acc] + ['all']: row(k)
    print()
    for k in sorted(k for k in acc if k.startswith('dev:')): row(k)
    if a.tunes:
        print()
        for k in sorted((k for k in acc if k.startswith('tune:')), key=lambda k: f1(acc[k]['tp'], acc[k]['nt'], acc[k]['nd'])): row(k)
    print(f'\nnon-finite samples in renders: {nonfin}; failed lines: {fails}; analysis time median {np.median(ms) if ms else 0:.0f} ms, max {max(ms) if ms else 0:.0f} ms (32 steps)')
    if a.out: json.dump({k: {kk: vv for kk, vv in v.items() if kk not in ('le', 'se')} for k, v in acc.items()}, open(a.out, 'w'), indent=1)

if __name__ == '__main__': main()
