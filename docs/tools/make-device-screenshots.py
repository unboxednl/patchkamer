#!/usr/bin/env python3
# SPDX-License-Identifier: AGPL-3.0-or-later
"""Maakt een schermafbeelding van de kaart van elk apparaat, voor de handleidingen per soort apparaat.

Gebruik, vanuit de root van de repo:
    python3 docs/tools/make-device-screenshots.py [--lang nl|en] [--area effects] [--device chorus]

Zonder opties: alle apparaten, beide talen. De opnames komen in docs/images/<taal>/<soort>/<apparaat>.png, waarbij
<soort> de map onder devices/ is (synths, effects, drums, mixer, modulators, tools) en <apparaat> de bestandsnaam van
het apparaat zonder .patchkamer-device.js.

Bestaat er een pack met dezelfde naam in presets/ (of tunes/), dan wordt dat geïmporteerd en de eerste preset (tune)
gekozen, zodat de kaart er in gebruik uitziet. Nodig: Python 3, `pip install playwright` en `playwright install chromium`.
"""
import argparse, functools, glob, http.server, os, re, sys, threading
from playwright.sync_api import sync_playwright

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
LOCALE = {'en': 'en-US', 'nl': 'nl-NL'}
PLACE = re.compile('place|plaats', re.I)
SUFFIX = '.patchkamer-device.js'

def devices(area=None, only=None):
    found = []
    for f in sorted(glob.glob(os.path.join(ROOT, 'devices', '*', '*', '*' + SUFFIX))):
        parts = os.path.relpath(f, os.path.join(ROOT, 'devices')).split(os.sep)
        slug = parts[2][:-len(SUFFIX)]
        if (area and parts[0] != area) or (only and slug != only): continue
        if re.search(r"status:\s*['\"]retired", open(f, encoding='utf-8').read()): continue   # een teruggetrokken apparaat staat niet in de bibliotheek en is dus niet te plaatsen
        found.append((parts[0], slug, f))
    return found

def serve():
    handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=ROOT)
    handler.log_message = lambda *a, **k: None
    srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), handler)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv, 'http://localhost:%d' % srv.server_address[1]

def pack_for(slug):
    # een pack met dezelfde naam (presets/chorus...), of een tunepack dat met de naam begint (tunes/duofone-styles...)
    for d, ext in (('presets', '.patchkamer-presets.json'), ('tunes', '.patchkamer-tunes.json')):
        p = os.path.join(ROOT, d, slug + ext)
        if os.path.exists(p): return d, p
        hits = sorted(glob.glob(os.path.join(ROOT, d, slug + '-*' + ext)))
        if hits and d == 'tunes': return d, hits[0]
    return None, None

def shoot(browser, base, lang, area, slug, path, out):
    ctx = browser.new_context(viewport={'width': 1900, 'height': 1500}, locale=LOCALE[lang]); pg = ctx.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.route('**/*', lambda r: r.continue_() if r.request.url.startswith('http://localhost') else r.abort())
    pg.goto(base + '/patchkamer/patchkamer.html'); pg.add_style_tag(content='*{user-select:none!important}'); pg.wait_for_timeout(600)
    pg.set_input_files('#devFile', path); pg.wait_for_timeout(500)
    pg.evaluate("document.querySelectorAll('.cat.closed .cathead').forEach(b=>b.click())"); pg.wait_for_timeout(300)   # de host start met alle categorieën ingeklapt
    pg.locator('.libdev').filter(has_not=pg.locator('.nm', has_text='AI Chat')).locator('button').filter(has_text=PLACE).first.click()   # de bibliotheek heeft zelf al het apparaat AI Chat: dat niet; pg.wait_for_timeout(700)
    pg.click('#libToggle'); pg.wait_for_timeout(1200)
    kind, pack = pack_for(slug)
    if pack:
        btn = '#psBtn' if kind == 'presets' else '#prBtn'
        pg.click('#menuBtn'); pg.wait_for_timeout(250); pg.click(btn); pg.wait_for_timeout(300)   # de knoppen Tunes en Presets staan in het ☰-menu en openen de bibliotheek op die tab
        with pg.expect_file_chooser() as fc: pg.click('#prImport')
        fc.value.set_files(pack); pg.wait_for_timeout(1000)
        pg.click('#libToggle'); pg.wait_for_timeout(300)   # het bibliotheekvenster weer dicht
        pg.evaluate("""()=>{const c=document.querySelector('.card'); const s=[...c.querySelectorAll('select')].find(x=>x.options.length>3&&x.options[0].value===''); if(s){ s.selectedIndex=1; s.dispatchEvent(new Event('change',{bubbles:true})); }}""")
        pg.wait_for_timeout(700)
    # een hoge kaart (Duofone, Effect Chain) past niet op het scherm: maak het scherm hoog genoeg
    h = pg.evaluate("document.querySelector('.card').getBoundingClientRect().height")
    if h > 1300:
        pg.set_viewport_size({'width': 1900, 'height': int(h) + 260}); pg.wait_for_timeout(900)
    os.makedirs(os.path.dirname(out), exist_ok=True)
    pg.locator('.card').first.screenshot(path=out)
    if errs: print('PAGINAFOUTEN', lang, slug, errs)
    ctx.close()

def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--lang', choices=['nl', 'en']); ap.add_argument('--area'); ap.add_argument('--device')
    a = ap.parse_args(); langs = [a.lang] if a.lang else ['nl', 'en']; todo = devices(a.area, a.device)
    if not todo: sys.exit('geen apparaten gevonden')
    srv, base = serve()
    try:
        with sync_playwright() as p:
            b = p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
            for lang in langs:
                for area, slug, path in todo:
                    shoot(b, base, lang, area, slug, path, os.path.join(ROOT, 'docs', 'images', lang, area, slug + '.png'))
                    print(lang, area, slug)
            b.close()
    finally:
        srv.shutdown()

if __name__ == '__main__':
    main()
