#!/usr/bin/env python3
# SPDX-License-Identifier: AGPL-3.0-or-later
"""Controleert een Patchkamer-song in de echte host (headless Chromium) en meet het geluid.

Gebruik, vanuit de root van de repo:
    python3 docs/tools/check-song.py <song.patchkamer-song.json> [--lang nl|en] [--seconds N]

Wat het doet:
1. Start een lokale webserver op de repo en laadt de host (patchkamer/patchkamer.html). Verzoeken buiten localhost worden
   geblokkeerd. Het automatisch laden van apparaten, presets en tunes (Instellingen) wordt uitgezet via localStorage
   `patchkamerWsAuto`.
2. Laadt de apparaten die de song nodig heeft uit devices/ (het bestand met dezelfde `id`), één voor één via #devFile.
3. Opent de song zoals een gebruiker: via de bestandskiezer van Bestand openen (#wsFileInput, openWorkspace in de host).
4. Controleert: elk apparaat uit de song staat op de vloer, elke kabel uit de song ligt er, elke poort van een
   gebeurtenis-, sturings-, bundel- of mastering-kabel bestaat in het apparaat (de host legt zo'n kabel naar een
   onbekende poort zonder klacht aan), geen paginafouten, geen foutmeldingen van de host.
5. Drukt Start (#play) in, wacht N seconden (standaard 8) en meet wat er het audiopad van de AudioContext in gaat:
   een hook op AudioNode.prototype.connect hangt alles wat op ctx.destination uitkomt ook aan een meter (links en rechts).
   Per seconde komen piek en rms (in dBFS) en het aantal niet-eindige samples (NaN of Infinity) in het rapport.
6. Rapporteert helder en eindigt met exitcode 0 (alles in orde) of 1 (er is een fout).

Fout (exitcode 1): apparaat of kabel mist, paginafout of hostfout, NaN/Infinity in de uitvoer, geen AudioContext,
volledige stilte (piek onder -80 dBFS in de hele meting) of een piek boven 1.0 (clipping). Waarschuwing (exitcode 0):
losse seconden stilte, een apparaatversie die niet gelijk is aan die in devices/, een apparaat dat alleen met de
meegeleverde code in de song laadt.

Beperkingen: dit is een meting, geen luistertest. Het zegt niets over of het goed klinkt. Een song die pas na N seconden
begint (bijvoorbeeld na een lange intro), geeft stilte als N te klein is: kies dan een grotere --seconds.
Nodig: Python 3, `pip install playwright` en `playwright install chromium`, en Node (alleen om de apparaat-id's te lezen).
"""
import argparse, functools, glob, http.server, json, math, os, subprocess, sys, threading
from playwright.sync_api import sync_playwright

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
LOCALE = {'en': 'en-US', 'nl': 'nl-NL'}
SUFFIX = '.patchkamer-device.js'
SILENCE_DB, CLIP = -80.0, 1.0

ID_NODE = r"""
import {pathToFileURL} from 'url';
const out = {};
for (const f of process.argv.slice(1)) { const d = (await import(pathToFileURL(f).href)).default; out[f] = {id: d.id, version: d.version, ports: Object.fromEntries(Object.entries(d.ports || {}).map(([k, l]) => [k, (l || []).map(x => x.id)]))}; }
console.log(JSON.stringify(out));
"""

INIT = r"""
try { localStorage.setItem('patchkamerWsAuto', JSON.stringify({dev:{on:false},pre:{on:false},tun:{on:false}})); } catch (e) {}
window.__pk = { ctxs: [], buckets: {}, statuses: [] };
(() => {
  const orig = AudioNode.prototype.connect;
  const taps = new WeakMap();
  const tapFor = ctx => {
    let t = taps.get(ctx);
    if (!t) {
      const sp = ctx.createChannelSplitter(2), a = [0, 1].map(() => { const n = ctx.createAnalyser(); n.fftSize = 1024; return n; });
      a.forEach((n, i) => sp.connect(n, i));
      t = { sp, a, buf: [new Float32Array(1024), new Float32Array(1024)] }; taps.set(ctx, t); window.__pk.ctxs.push(ctx);
      setInterval(() => {
        if (ctx.state !== 'running') return;
        const sec = Math.floor(ctx.currentTime), b = window.__pk.buckets[sec] || (window.__pk.buckets[sec] = { peak: 0, sq: 0, n: 0, bad: 0 });
        for (let c = 0; c < 2; c++) {
          t.a[c].getFloatTimeDomainData(t.buf[c]);
          for (const v of t.buf[c]) { if (!Number.isFinite(v)) { b.bad++; continue; } const m = Math.abs(v); if (m > b.peak) b.peak = m; b.sq += v * v; b.n++; }
        }
      }, 15);
    }
    return t;
  };
  AudioNode.prototype.connect = function (dest, ...rest) {
    const r = orig.call(this, dest, ...rest);
    try { if (typeof AudioDestinationNode !== 'undefined' && dest instanceof AudioDestinationNode) orig.call(this, tapFor(this.context).sp); } catch (e) {}
    return r;
  };
  document.addEventListener('DOMContentLoaded', () => {
    const el = document.getElementById('devStatus'); if (!el) return;
    new MutationObserver(() => { const t = el.textContent.trim(); if (t) window.__pk.statuses.push({ text: t, err: el.classList.contains('err') }); }).observe(el, { childList: true, characterData: true, subtree: true });
  });
})();
"""

def serve():
    class Quiet(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a, **k): pass
    handler = functools.partial(Quiet, directory=ROOT)
    srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), handler)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv, 'http://localhost:%d' % srv.server_address[1]

PORTS = {}

def local_devices():
    files = sorted(glob.glob(os.path.join(ROOT, 'devices', '*', '*', '*' + SUFFIX)))
    r = subprocess.run(['node', '--input-type=module', '-e', ID_NODE] + files, capture_output=True, text=True, env=dict(os.environ, NODE_NO_WARNINGS='1'))
    if r.returncode: sys.exit('Node kon de apparaten niet lezen:\n' + r.stderr)
    out = {}
    for f, d in json.loads(r.stdout).items():
        out.setdefault(d['id'], []).append((d['version'], f)); PORTS[d['id']] = d['ports']
    return out

def db(x):
    return -200.0 if x <= 0 else 20 * math.log10(x)

def main():
    ap = argparse.ArgumentParser(); ap.add_argument('song'); ap.add_argument('--lang', choices=['nl', 'en'], default='nl'); ap.add_argument('--seconds', type=float, default=8)
    a = ap.parse_args()
    errors, warnings = [], []
    try: song = json.load(open(a.song, encoding='utf-8'))
    except Exception as e: sys.exit('FOUT: de song is geen leesbare JSON: %s' % e)
    ws = song.get('workspace') if song.get('format') == 'patchkamer-song' else song
    if not isinstance(ws, dict) or not isinstance(ws.get('devices'), list):
        sys.exit('FOUT: geen song of werkruimte (format "patchkamer-song" met workspace.devices ontbreekt)')
    want_dev, want_cab = ws['devices'], ws.get('cables') or []
    print('Song: %s · %s · %s · %d apparaten, %d kabels, %s bpm' % (song.get('title') or ws.get('name') or '(zonder titel)', song.get('author') or '-', song.get('license') or '-', len(want_dev), len(want_cab), ws.get('bpm')))
    local = local_devices(); embedded = {d.get('id'): d for d in ws.get('defs') or []}
    needed = []
    for d in want_dev:
        hits = local.get(d['def'])
        if not hits:
            (warnings if d['def'] in embedded and embedded[d['def']].get('code') else errors).append('apparaat %s staat niet in devices/%s' % (d['def'], '' if d['def'] not in embedded else ' (de song bevat wel eigen code)'))
            continue
        ver, f = sorted(hits, reverse=True)[0]
        if d.get('version') and d['version'] != ver: warnings.append('%s: de song gebruikt versie %s, devices/ heeft %s' % (d['def'], d['version'], ver))
        if f not in needed: needed.append(f)
    # poorten: de host controleert alleen audiokabels; een gebeurtenis-, sturings- of bundelkabel naar een poort die
    # niet bestaat legt hij gewoon aan en er gebeurt dan niets. Daarom controleren we ze hier tegen de definitie.
    by_id = {d['id']: d['def'] for d in want_dev}
    for c in want_cab:
        k = c.get('kind')
        if k not in ('audio', 'event', 'mod', 'multi', 'mastering', 'multievent'): errors.append('kabel met onbekende soort %r' % k); continue
        for end, suf in (('from', 'Out'), ('to', 'In')):
            dev = by_id.get(c[end]['id'])
            if dev is None: errors.append('kabel verwijst naar apparaat %s dat niet in de song staat' % c[end]['id']); continue
            if dev not in PORTS or k == 'audio' or (k == 'mod' and c[end]['port'] == 'mod' and end == 'to'): continue
            if c[end]['port'] not in PORTS[dev].get(k + suf, []):
                errors.append('kabel %s: %s heeft geen %s-poort %r (%s)' % (k, dev, 'uit' if end == 'from' else 'in', c[end]['port'], ', '.join(PORTS[dev].get(k + suf, [])) or 'geen'))
    srv, base = serve()
    try:
        with sync_playwright() as p:
            b = p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
            ctx = b.new_context(viewport={'width': 1900, 'height': 1200}, locale=LOCALE[a.lang]); pg = ctx.new_page()
            page_errs = []
            pg.on('pageerror', lambda e: page_errs.append(str(e)))
            pg.on('console', lambda m: page_errs.append('console.error: ' + m.text) if m.type == 'error' and 'Failed to load resource' not in m.text else None)
            blocked = []
            pg.route('**/*', lambda r: r.continue_() if r.request.url.startswith('http://localhost') else (blocked.append(r.request.url), r.abort())[1])
            pg.add_init_script(INIT)
            pg.goto(base + '/patchkamer/patchkamer.html'); pg.wait_for_timeout(800)
            for f in needed:
                pg.set_input_files('#devFile', f); pg.wait_for_timeout(150)
            pg.wait_for_timeout(300)
            pg.set_input_files('#wsFileInput', os.path.abspath(a.song)); pg.wait_for_timeout(2500)
            pg.evaluate("document.querySelectorAll('.pkmodal button[data-a]:last-child').forEach(b=>b.click())"); pg.wait_for_timeout(300)
            # wat staat er nu op de vloer? Dezelfde export als de knop Exporteren in het werkruimtepaneel
            got = json.loads(pg.evaluate("document.getElementById('exportPatch').click(), document.getElementById('patchText').value") or '{}')
            gdev, gcab = got.get('devices') or [], got.get('cables') or []
            have = {d['id']: d for d in gdev}
            for d in want_dev:
                if d['id'] not in have: errors.append('apparaat %s (%s) staat niet op de vloer' % (d['id'], d['def']))
            key = lambda c: (c['from']['id'], c['from']['port'], c['to']['id'], c['to']['port'])
            have_c = {key(c) for c in gcab}
            for c in want_cab:
                if key(c) not in have_c: errors.append('kabel %s.%s -> %s.%s (%s) is niet aangelegd' % (c['from']['id'], c['from']['port'], c['to']['id'], c['to']['port'], c.get('kind')))
            print('Op de vloer: %d van %d apparaten, %d van %d kabels' % (len(gdev), len(want_dev), len(gcab), len(want_cab)))
            for s in pg.evaluate("window.__pk.statuses"):
                if s['err']: errors.append('melding van de host: ' + s['text'])
            print('Klok starten, %g seconden meten...' % a.seconds)
            pg.click('#play'); pg.wait_for_timeout(int(a.seconds * 1000))
            running = pg.evaluate("window.__pk.ctxs.map(c=>c.state)")
            buckets = pg.evaluate("window.__pk.buckets")
            for s in pg.evaluate("window.__pk.statuses"):
                if s['err'] and ('melding van de host: ' + s['text']) not in errors: errors.append('melding van de host: ' + s['text'])
            try: pg.click('#play')
            except Exception: pass
            b.close()
    finally:
        srv.shutdown()
    for e in page_errs: errors.append('paginafout: ' + e)
    for u in blocked:
        if 'fonts.g' not in u: warnings.append('verzoek buiten localhost geblokkeerd: ' + u)
    # geluid
    if not running: errors.append('er is geen AudioContext gemaakt (geen apparaat dat naar de luidsprekers gaat?)')
    elif 'running' not in running: errors.append('de AudioContext draait niet (staat: %s)' % ', '.join(running))
    secs = sorted(buckets, key=int)
    print('\nUitgangsniveau (links en rechts samen, voor de luidsprekers):')
    print('  sec    piek dBFS    rms dBFS   niet-eindig')
    peak_all, bad_all, quiet = 0.0, 0, []
    for s in secs:
        v = buckets[s]; rms = math.sqrt(v['sq'] / v['n']) if v['n'] else 0
        peak_all = max(peak_all, v['peak']); bad_all += v['bad']
        flag = ''
        if v['bad']: flag = '  NaN/Infinity'
        elif v['peak'] > CLIP: flag = '  CLIPPING'
        elif db(v['peak']) < SILENCE_DB: flag = '  stilte'; quiet.append(int(s))
        print('  %3s  %9.1f  %10.1f  %10d%s' % (s, db(v['peak']), db(rms), v['bad'], flag))
    if secs:
        if bad_all: errors.append('%d niet-eindige samples (NaN of Infinity) in de uitvoer' % bad_all)
        if peak_all > CLIP: errors.append('piek %.2f boven 1.0 (clipping)' % peak_all)
        if db(peak_all) < SILENCE_DB: errors.append('stilte: de hele meting lag de piek onder %.0f dBFS (klok gestart, maar geen geluid; staan er noten, een patroon en een kabel naar de luidsprekers?)' % SILENCE_DB)
        else:
            first = next(int(s) for s in secs if db(buckets[s]['peak']) >= SILENCE_DB)
            later = [q for q in quiet if q > first]
            if later: warnings.append('stille seconden na het eerste geluid: %s' % ', '.join(map(str, later)))
    elif running and 'running' in running: errors.append('er zijn geen audiomonsters gemeten')
    print()
    for w in warnings: print('WAARSCHUWING:', w)
    for e in errors: print('FOUT:', e)
    if errors:
        print('\nResultaat: NIET IN ORDE (%d fouten)' % len(errors)); sys.exit(1)
    print('Resultaat: in orde (gemeten, niet beluisterd; piek %.1f dBFS)' % db(peak_all)); sys.exit(0)

if __name__ == '__main__':
    main()
