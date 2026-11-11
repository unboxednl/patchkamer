#!/usr/bin/env python3
# SPDX-License-Identifier: AGPL-3.0-or-later
"""Maakt de schermafbeelding van Remix met een resultaat voor de handleiding (docs/images/<taal>/tools/remix-result.png).

De kaart zonder resultaat (remix.png) komt van docs/tools/make-device-screenshots.py --device remix.
Dit script plaatst een Clip Arranger met de preset "Deep House Chords" (pack Clip Arranger Song Starters) en Remix, kiest het recept Hit version,
klikt Make remix zoals een gebruiker en maakt een opname van de kaart van Remix.

    python3 docs/tools/make-remix-result.py [--lang nl|en]
Nodig: Python 3, playwright en Chromium."""
import argparse, functools, http.server, os, re, threading
from playwright.sync_api import sync_playwright

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
PLACE = re.compile('place|plaats', re.I)
LOCALE = {'en': 'en-US', 'nl': 'nl-NL'}
PRESET = 'Deep House Chords'

def serve():
    h = functools.partial(http.server.SimpleHTTPRequestHandler, directory=ROOT); h.func.log_message = lambda *a, **k: None
    srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), h); threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv, 'http://localhost:%d' % srv.server_address[1]

def place(pg, name, path):
    pg.set_input_files('#devFile', ROOT + path); pg.wait_for_timeout(500)
    pg.evaluate("document.querySelectorAll('.cat.closed .cathead').forEach(b=>b.click())"); pg.wait_for_timeout(250)
    pg.locator('.libdev').filter(has_text=name).first.locator('button').filter(has_text=PLACE).first.click(); pg.wait_for_timeout(1800)

def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--lang', choices=['nl', 'en']); a = ap.parse_args(); srv, base = serve()
    with sync_playwright() as p:
        b = p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
        for lang in ([a.lang] if a.lang else ['nl', 'en']):
            pg = b.new_context(viewport={'width': 1900, 'height': 1500}, locale=LOCALE[lang]).new_page(); pg.set_default_timeout(8000)
            pg.route('**/*', lambda r: r.continue_() if r.request.url.startswith('http://localhost') else r.abort())
            pg.goto(base + '/patchkamer/patchkamer.html'); pg.add_style_tag(content='*{user-select:none!important}'); pg.wait_for_timeout(1000); pg.mouse.click(950, 700)
            place(pg, 'Clip Arranger', '/devices/sequencers/ClipArranger/clip-arranger.patchkamer-device.js')
            pg.set_input_files('#prFile', ROOT + '/presets/clip-arranger.patchkamer-presets.json'); pg.wait_for_timeout(800)
            pg.evaluate("""n=>{const c=[...document.querySelectorAll('.card')].find(c=>/CLIP ARR/i.test(c.querySelector('.nm').textContent)); for(const s of c.querySelectorAll('select')){ const o=[...s.options].find(o=>o.text.trim()===n); if(o){ s.value=o.value; s.dispatchEvent(new Event('change',{bubbles:true})); return true; } } return false;}""", PRESET)
            pg.wait_for_timeout(600)
            place(pg, 'Remix', '/devices/tools/Remix/remix.patchkamer-device.js')
            card = pg.locator('.card').filter(has_text=re.compile(r'^\s*REMIX', re.I)).first
            card.get_by_role('button', name='Maak remix' if lang == 'nl' else 'Make remix', exact=True).click(); pg.wait_for_timeout(1000)
            out = os.path.join(ROOT, 'docs', 'images', lang, 'tools', 'remix-result.png'); card.screenshot(path=out); print(lang, out)
    srv.shutdown()

if __name__ == '__main__':
    main()
