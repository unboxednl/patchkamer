#!/usr/bin/env python3
# SPDX-License-Identifier: AGPL-3.0-or-later
"""Maakt de schermafbeelding van Bass Finder met een resultaat voor de handleiding (docs/images/<taal>/tools/bass-finder-result.png).

De kaart zonder resultaat (bass-finder.png) komt van docs/tools/make-device-screenshots.py --device bass-finder.
Dit script rendert eerst een baslijn van twee maten (E mineur, 110 BPM) offline met de echte code van Basic Mono (tune "Clean Bass"), zet die in Bass Finder
zoals een gebruiker (bestandskiezer) en maakt een opname van de kaart.

    python3 docs/tools/make-bass-finder-result.py [--lang nl|en]
Nodig: Python 3 met numpy, playwright en Chromium."""
import argparse, base64, json, os, re, sys, tempfile, wave
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from tunefinder_lib import ROOT, HERE, serve, tune_packs, device_files, url_of
import numpy as np
from playwright.sync_api import sync_playwright

DEVICE, TUNE, BPM = 'nl.patchkamer.mono', 'Clean Bass', 110
LINE = [(0, 2, 40), (3, 1, 40), (4, 2, 43), (6, 2, 40), (8, 3, 45), (11, 1, 43), (12, 2, 40), (14, 1, 47), (15, 1, 45), (16, 2, 40), (18, 2, 52), (20, 1, 40), (22, 2, 43), (24, 4, 38), (28, 2, 40), (30, 2, 45)]
PLACE = re.compile('place|plaats', re.I)

def render_wav(base, pg, path):
    devs = device_files(); st = None
    for pack, did, tl in tune_packs():
        if did == DEVICE:
            for p, n in tl:
                if n['name'] == TUNE: st = json.loads(json.dumps(n['state']))
    step = 15 / BPM
    notes = [dict(note=n, vel=0.9 if k % 3 else 1.0, t=0.1 + s * step, dur=l * step * 0.85) for k, (s, l, n) in enumerate(LINE)]
    r = pg.evaluate('s=>BFrender(s)', dict(deviceUrl=url_of(base, devs[DEVICE]['file']), state=st, notes=notes, total=32 * step + 1.2, sr=44100, wantAudio=True, fx=[]))
    x = np.frombuffer(base64.b64decode(r['audio'][0]), dtype=np.float32); x = x / max(1e-9, np.abs(x).max()) * 0.8
    w = wave.open(path, 'wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(44100); w.writeframes((x * 32767).astype('<i2').tobytes()); w.close()

def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--lang', choices=['nl', 'en']); a = ap.parse_args(); srv, base = serve(); tmp = tempfile.mkdtemp()
    try:
        with sync_playwright() as p:
            b = p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
            pg0 = b.new_page(); pg0.route('**/blank.html', lambda r: r.fulfill(body='<!doctype html><title>x</title>', content_type='text/html'))
            pg0.goto(base + '/blank.html'); pg0.add_script_tag(path=os.path.join(HERE, 'bass-finder-page.js')); wav = os.path.join(tmp, 'bass line.wav'); render_wav(base, pg0, wav)
            for lang in ([a.lang] if a.lang else ['nl', 'en']):
                ctx = b.new_context(viewport={'width': 1500, 'height': 1300}, locale={'nl': 'nl-NL', 'en': 'en-US'}[lang]); pg = ctx.new_page(); errs = []
                pg.on('pageerror', lambda e: errs.append(str(e)))
                pg.route('**/*', lambda r: r.continue_() if r.request.url.startswith('http://localhost') else r.abort())
                pg.goto(base + '/patchkamer/patchkamer.html'); pg.add_style_tag(content='*{user-select:none!important}'); pg.wait_for_timeout(600)
                pg.set_input_files('#devFile', os.path.join(ROOT, 'devices', 'tools', 'BassFinder', 'bass-finder.patchkamer-device.js')); pg.wait_for_timeout(500)
                pg.evaluate("document.querySelectorAll('.cat.closed .cathead').forEach(b=>b.click())"); pg.wait_for_timeout(300)
                pg.locator('.libdev').filter(has_not=pg.locator('.nm', has_text='AI Chat')).locator('button').filter(has_text=PLACE).first.click(); pg.wait_for_timeout(700)
                pg.click('#libToggle'); pg.wait_for_timeout(800)
                pg.locator('.card input[type=file]').first.set_input_files(wav); pg.wait_for_timeout(2500)
                pg.locator('.card').first.screenshot(path=os.path.join(ROOT, 'docs', 'images', lang, 'tools', 'bass-finder-result.png'))
                print(lang, 'ok', 'PAGINAFOUTEN ' + str(errs) if errs else '')
                ctx.close()
            b.close()
    finally:
        srv.shutdown()

if __name__ == '__main__':
    main()
