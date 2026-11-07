#!/usr/bin/env python3
# SPDX-License-Identifier: AGPL-3.0-or-later
"""Meet hoe goed Tune Finder de juiste tune, het juiste apparaat en de juiste familie vindt (hold-out met grondwaarheid).

Een steekproef tunes wordt gerenderd met de echte apparaatcode op noten, velocity's en duren die NIET in de index zitten, in zes situaties
(schone noot, gedegradeerde opname, korte frase, akkoord, noot door een Room-apparaat, noot door een Chorus-apparaat). Elke zoekvraag wordt
geanalyseerd en gerangschikt met dezelfde code als het apparaat (TA.analyse, TA.rank uit het apparaatbestand). De groepsgewichten worden
afgesteld op een validatiesteekproef en gemeten op een aparte teststeekproef (andere tunes, andere noten).

    python3 docs/tools/eval-tune-finder.py gen    --index <index.json of apparaatbestand> --out queries.json [--test 700 --val 300 --seed 7 --jobs 12]
    python3 docs/tools/eval-tune-finder.py tune   --index <index.json of apparaatbestand> --queries queries.json      # zoekt gewichten op de validatieset
    python3 docs/tools/eval-tune-finder.py score  --index <index.json of apparaatbestand> --queries queries.json [--weights '{"spec":1,...}']
Niet beluisterd; echte opnames zijn hier niet bij."""
import argparse, base64, json, multiprocessing as mp, os, random, sys, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from tunefinder_lib import *
import numpy as np

SCEN = ['clean', 'degraded', 'phrase', 'chord', 'room', 'chorus']
ROOMS = ['Spaces/Small Room', 'Spaces/Warm Hall', 'Spaces/Bright Plate']; CHORUSES = ['Subtle/Subtle Double', 'Subtle/Classic Chorus', 'Ensemble/Wide Pad']

def preset_state(pack, path):
    j = json.load(open(f'{ROOT}/presets/{pack}.patchkamer-presets.json'))
    def walk(items, p):
        for x in items:
            if 'items' in x:
                r = walk(x['items'], p + x['folder'] + '/')
                if r: return r
            elif p + x['name'] == path: return x['state']
    return walk(j.get('tree') or j.get('presets'), '')

def make_spec(rng, scen):
    refs = set(REFS)
    def note():
        while True:
            n = rng.randint(33, 84)
            if n not in refs: return n
    base = note(); vel = round(rng.uniform(0.35, 1.0), 3); dur = round(rng.uniform(0.35, 1.3), 3)
    sp = dict(scen=scen, fx=[], deg={})
    if scen == 'phrase':
        notes = [dict(note=base + rng.choice([0, 2, 3, 5, 7]), vel=round(rng.uniform(0.4, 1), 3), t=0.1 + k * 0.45, dur=0.4) for k in range(3)]
        sp['total'] = 2.5
    elif scen == 'chord':
        notes = [dict(note=base + o, vel=vel, t=0.1, dur=1.0) for o in (0, rng.choice([3, 4]), 7)]; sp['total'] = 2.3
    else:
        notes = [dict(note=base, vel=vel, t=0.1, dur=dur)]; sp['total'] = round(0.1 + dur + 1.1, 2)
    sp['notes'] = notes; sp['seed'] = rng.randint(1, 10 ** 6)
    if scen == 'degraded': sp['deg'] = dict(gainDb=-12, noiseDb=-50, mono=True); sp['lpHz'] = 6000
    if scen == 'gain': sp['deg'] = dict(gainDb=-12)                     # single causes, for diagnosis (--scen gain,noise,lp,mono)
    if scen == 'noise': sp['deg'] = dict(noiseDb=-50)
    if scen == 'lp': sp['lpHz'] = 6000
    if scen == 'mono': sp['deg'] = dict(mono=True)
    if scen == 'room': sp['fx'] = [dict(dev='nl.patchkamer.room', st=('room', rng.choice(ROOMS)))]
    if scen == 'chorus': sp['fx'] = [dict(dev='nl.patchkamer.chorus', st=('chorus', rng.choice(CHORUSES)))]
    return sp

def gen_work(args):
    jobs, code = args
    from playwright.sync_api import sync_playwright
    srv, base = serve(); res = []
    with sync_playwright() as p:
        b, pg = open_page(p, base, code)
        for q in jobs:
            spec = dict(q['spec']); spec['transport'] = q['spec'].get('transport', False); spec['deviceUrl'] = url_of(base, q['file']); spec['state'] = q['state']
            spec['fx'] = [dict(url=url_of(base, f['file']), state=f['state']) for f in spec['fx']]
            try:
                r = render(pg, spec)
                res.append(dict(qid=q['qid'], peak=r['peak'], bad=r['bad'], r=r['r'] if r['peak'] > 2e-4 else None, tA=r['tA']))
            except Exception as e: res.append(dict(qid=q['qid'], err=str(e)[:200], r=None, peak=0, bad=0, tA=0))
        b.close()
    srv.shutdown(); return res

def cmd_gen(a):
    global SCEN; SCEN = a.scen.split(','); ix = read_index(a.index); devs = device_files(); code = analysis_source()
    state_of = {}
    for pack, did, tl in tune_packs():
        for path, n in tl: state_of[(did, '/'.join(path), n['name'])] = n['state']
    by_dev = {}
    for i, (di, path, name, fl) in enumerate(ix['tunes']): by_dev.setdefault(di, []).append(i)
    rng = random.Random(a.seed); val, test = [], []
    for di, l in by_dev.items():
        l = l[:]; rng.shuffle(l)
        nv = max(2, round(a.val * len(l) / len(ix['tunes']))); nt = max(4, round(a.test * len(l) / len(ix['tunes'])))
        val += l[:nv]; test += l[nv:nv + nt]
    fxfile = {}
    for k, d in (('room', 'nl.patchkamer.room'), ('chorus', 'nl.patchkamer.chorus')): fxfile[d] = (devs[d]['file'], k)
    qs = []
    for split, lst in (('val', val), ('test', test)):
        for i in lst:
            di, path, name, fl = ix['tunes'][i]; did = ix['devices'][di]['id']
            for sc in SCEN:
                r2 = random.Random(f'{a.seed}-{split}-{i}-{sc}'); sp = make_spec(r2, sc)
                for f in sp['fx']: f['file'] = fxfile[f['dev']][0]; f['state'] = preset_state(fxfile[f['dev']][1], f['st'][1])
                st = dict(state_of[(did, path, name)])
                if fl == 2: st['mode'] = 'notes'                      # as in the index: a device that plays its own pattern in this tune
                if fl == 1: sp['transport'] = True; sp['notes'] = []   # a drone: it sounds while the transport runs
                qs.append(dict(qid=len(qs), split=split, tune=i, scen=sc, spec=sp, file=devs[did]['file'], state=st))
    print(len(qs), 'queries', len(val), 'val tunes', len(test), 'test tunes'); t0 = time.time()
    jobs = [qs[k::a.jobs] for k in range(a.jobs)]
    with mp.Pool(a.jobs) as pool: parts = pool.map(gen_work, [(j, code) for j in jobs if j])
    out = {r['qid']: r for p in parts for r in p}
    keep = []
    for q in qs:
        r = out[q['qid']]
        keep.append(dict(qid=q['qid'], split=q['split'], tune=q['tune'], scen=q['scen'], notes=[n['note'] for n in q['spec']['notes']], vel=[n['vel'] for n in q['spec']['notes']],
                         r=r['r'], bad=r['bad'], err=r.get('err'), tA=r['tA']))
    json.dump(keep, open(a.out, 'w'), separators=(',', ':'))
    print(f'rendered in {time.time() - t0:.0f} s; silent/failed: {sum(1 for k in keep if not k["r"])}; non-finite samples: {sum(k["bad"] for k in keep)}')

# ---------- numpy ranking (same maths as TA.distance / TA.rank) ----------
DEFW = {'voiced': dict(spec=0.49, harm=11.2, att=0, env=1.4, misc=0.7, st=0.14), 'unvoiced': dict(spec=0.5, harm=0, att=0.49, env=0.5, misc=1.96, st=0.1)}   # as TA.WEIGHTS / TA.WEIGHTS_UNV
GROUPS = [('spec', 40), ('harm', 16), ('att', 12), ('env', 5), ('misc', 6), ('st', 2)]
def load_ix(path):
    j = read_index(path); R = len(j['refs']); D = j['dims']
    Q = np.frombuffer(bytes.fromhex(j['data']) if j.get('enc') == 'hex' else base64.b64decode(j['data']), dtype=np.int8).astype(np.float32).reshape(len(j['tunes']), R, D) * np.array(j['scale'], dtype=np.float32)
    return j, Q, np.array(j['sd'], dtype=np.float32)
def qmask(q):
    if q['voiced'] >= 0.3: return None
    m = np.ones(81, dtype=np.float32); m[40:56] = 0; m[OFFMISC + 3] = 0; m[OFFMISC + 4] = 0; return m
OFFMISC = 40 + 16 + 12 + 5
def group_dists(qv, Q, sd, mask=None):
    """-> array (n, R, G): mean of the robust squared z per group."""
    z = (qv[None, None, :] - Q) / sd
    if mask is not None: z = z * mask
    z2 = z * z; z2 = np.where(z2 > 36, 6 * np.abs(z) - 18, z2)
    o = 0; out = []
    for g, n in GROUPS: out.append(z2[:, :, o:o + n].mean(axis=2)); o += n
    return np.stack(out, axis=2)
def pitch_pen(q, refs, lam):
    if not (q['f0'] > 0 and q['voiced'] > 0.5 and q['f0spread'] < 5 and lam): return np.zeros(len(refs))
    midi = 69 + 12 * np.log2(q['f0'] / 440); pen = []
    for r in refs: pen.append(lam * min((abs(midi + s - r) / 12) ** 2 + (0.15 if s else 0) for s in (0, -12, 12)))
    return np.array(pen)
def wvec(w, q):
    w = w[1] if qmask(q) is not None else w[0]
    return np.array([(0 if g == 'st' and not q['stereo'] else w[g]) for g, _ in GROUPS], dtype=np.float32)   # a mono query says nothing about the stereo width (as in the device)
def full_rank(q, Q, sd, flags, refs, w, lam):
    gd = group_dists(np.array(q['vec'], dtype=np.float32), Q, sd, qmask(q))
    d = (gd * wvec(w, q)).sum(axis=2) + np.where(flags[:, None] == 1, 0, pitch_pen(q, refs, lam)[None, :])
    return d.min(axis=1)

def hit_stats(order, truth, dev_of, fam_of):
    """order: tune indices best first."""
    pos = int(np.where(order == truth)[0][0]) if truth in order else 10 ** 9
    dv = dev_of[order[:10]]; td = dev_of[truth]; fm = fam_of[order[:10]]; tf = fam_of[truth]
    dpos = int(np.argmax(dv == td)) if (dv == td).any() else 10 ** 9
    fpos = int(np.argmax(fm == tf)) if (fm == tf).any() else 10 ** 9
    vals, cnt = np.unique(fm[:5], return_counts=True)
    return dict(t1=pos < 1, t5=pos < 5, t10=pos < 10, d1=dpos < 1, d5=dpos < 5, d10=dpos < 10, f1=fpos < 1, f5=fpos < 5, fmaj=vals[np.argmax(cnt)] == tf, rank=pos, d5same=float((dv[:5] == td).mean()), f5same=float((fm[:5] == tf).mean()))

def setup(a):
    j, Q, sd = load_ix(a.index); qs = json.load(open(a.queries))
    flags = np.array([t[3] for t in j['tunes']]); dev_of = np.array([t[0] for t in j['tunes']])
    famnames = sorted(set(d['family'] for d in j['devices'])); fam_of = np.array([famnames.index(j['devices'][t[0]]['family']) for t in j['tunes']])
    return j, Q, sd, qs, flags, dev_of, fam_of

def evaluate(j, Q, sd, qs, flags, dev_of, fam_of, w, lam, split):
    res = {}
    for q in qs:
        if q['split'] != split or not q['r']: continue
        d = full_rank(q['r'], Q, sd, flags, j['refs'], w, lam); order = np.argsort(d, kind='stable')
        res.setdefault(q['scen'], []).append(hit_stats(order, q['tune'], dev_of, fam_of))
    return res

def objective(res):
    rows = [r for l in res.values() for r in l]
    return np.mean([r['t5'] for r in rows]) + np.mean([r['d1'] for r in rows]) + 0.5 * np.mean([r['f1'] for r in rows]) + 0.5 * np.mean([r['t1'] for r in rows])

def cmd_tune(a):
    j, Q, sd, qs, flags, dev_of, fam_of = setup(a)
    vq = [q for q in qs if q['split'] == 'val' and q['r']]
    # precompute group distances once per query (n,R,G) in float16-free float32; 1500 queries x 2200 x 4 x 6 x 4 B = ok
    pre = [(group_dists(np.array(q['r']['vec'], dtype=np.float32), Q, sd, qmask(q['r'])), q) for q in vq if (qmask(q['r']) is not None) == (a.subset == 'unvoiced')]
    names = [g for g, _ in GROUPS]
    def score(w, lam):
        rows = []
        for gd, q in pre:
            d = (gd * wvec((w, w), q['r'])).sum(axis=2) + np.where(flags[:, None] == 1, 0, pitch_pen(q['r'], j['refs'], lam)[None, :]); best = d.min(axis=1); order = np.argsort(best, kind='stable')
            rows.append(hit_stats(order, q['tune'], dev_of, fam_of))
        return np.mean([r['t5'] for r in rows]) + np.mean([r['d1'] for r in rows]) + 0.5 * np.mean([r['f1'] for r in rows]) + 0.5 * np.mean([r['t1'] for r in rows])
    w = json.loads(a.weights) if a.weights else DEFW[a.subset]; lam = a.pitchpen; best = score(w, lam); print('start', round(best, 4))
    for rnd in range(a.rounds):
        for g in names + ['lam']:
            for m in (0, 0.5, 0.7, 1.4, 2, 3):
                w2, l2 = dict(w), lam
                if g == 'lam': l2 = lam * m if lam * m else (0 if m == 0 else 0.25)
                else: w2[g] = w[g] * m if w[g] * m else (0 if m == 0 else 0.5 * m)
                if g != 'lam' and m == 0 and g == 'spec': continue
                s = score(w2, l2)
                if s > best + 1e-4: best, w, lam = s, w2, l2; print(' improved', g, round(best, 4), {k: round(v, 3) for k, v in w.items()}, round(lam, 3)); sys.stdout.flush()
    print('WEIGHTS', json.dumps({k: round(v, 3) for k, v in w.items()}), 'PITCHPEN', round(lam, 3), 'objective', round(best, 4))

def table(res, title):
    ks = ['t1', 't5', 't10', 'd1', 'd5', 'd10', 'f1', 'f5', 'fmaj']
    print(f'\n{title}\n| situation | n | tune top-1 | top-5 | top-10 | device top-1 | top-5 | top-10 | family top-1 | top-5 | family majority of 5 | median rank | same device in top-5 |')
    print('|---|---|---|---|---|---|---|---|---|---|---|---|---|')
    allr = []
    for sc in SCEN + [k for k in res if k not in SCEN]:
        l = res.get(sc, [])
        if not l: continue
        allr += l; print('| ' + sc + f' | {len(l)} | ' + ' | '.join('%.1f %%' % (100 * np.mean([r[k] for r in l])) for k in ks) + f' | {int(np.median([r["rank"] for r in l]))} | ' + '%.0f %%' % (100 * np.mean([r['d5same'] for r in l])) + ' |')
    print(f'| all | {len(allr)} | ' + ' | '.join('%.1f %%' % (100 * np.mean([r[k] for r in allr])) for k in ks) + f' | {int(np.median([r["rank"] for r in allr]))} | ' + '%.0f %%' % (100 * np.mean([r['d5same'] for r in allr])) + ' |')
    return allr

def cmd_score(a):
    j, Q, sd, qs, flags, dev_of, fam_of = setup(a)
    w = tuple(json.loads(a.weights)) if a.weights else (DEFW['voiced'], DEFW['unvoiced']); lam = a.pitchpen
    for split in ('test',):
        res = evaluate(j, Q, sd, qs, flags, dev_of, fam_of, w, lam, split); table(res, f'split {split}, weights {w}, pitch penalty {lam}')
    prior = np.bincount(dev_of).max() / len(dev_of); print(f'\nchance: tune top-1 {100 / len(dev_of):.2f} %, top-10 {1000 / len(dev_of):.2f} %; the biggest device has {100 * prior:.1f} % of the tunes')
    # per device (test, clean + degraded + room + chorus single notes)
    per = {}
    res = evaluate(j, Q, sd, qs, flags, dev_of, fam_of, w, lam, 'test')
    for q in qs:
        pass
    print('\nsilent/failed queries:', sum(1 for q in qs if not q['r']), 'of', len(qs))

if __name__ == '__main__':
    ap = argparse.ArgumentParser(); ap.add_argument('cmd', choices=['gen', 'tune', 'score']); ap.add_argument('--index', default=DEVICE_FILE)
    ap.add_argument('--out', default='queries.json'); ap.add_argument('--queries', default='queries.json'); ap.add_argument('--test', type=int, default=700); ap.add_argument('--val', type=int, default=300)
    ap.add_argument('--seed', type=int, default=7); ap.add_argument('--jobs', type=int, default=max(2, (os.cpu_count() or 4) - 4)); ap.add_argument('--weights', default=''); ap.add_argument('--pitchpen', type=float, default=0.42); ap.add_argument('--rounds', type=int, default=3); ap.add_argument('--scen', default=','.join(SCEN)); ap.add_argument('--subset', default='voiced', choices=['voiced', 'unvoiced'])
    a = ap.parse_args(); SCEN = a.scen.split(','); {'gen': cmd_gen, 'tune': cmd_tune, 'score': cmd_score}[a.cmd](a)
