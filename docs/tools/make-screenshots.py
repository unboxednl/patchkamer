#!/usr/bin/env python3
# SPDX-License-Identifier: AGPL-3.0-or-later
"""Maakt de screenshots voor de gebruikershandleiding (docs/images/nl en docs/images/en).

Gebruik, vanuit de root van de repo:   python3 docs/tools/make-screenshots.py [nl] [en]
Zonder argumenten worden beide talen gemaakt.
Met `--also=devices/tools/Naam` (herhaalbaar) neemt de demobibliotheek ook een nog niet gecommitte apparaatmap mee,
bijvoorbeeld bij het toevoegen van een nieuw apparaat vóór de commit.

Nodig: Python 3, `pip install playwright` en `playwright install chromium`.
Het script zet zelf een webserver op de repo, bouwt een demobibliotheek van alleen de gecommitte
apparaten (git ls-files) en start de host in een headless Chromium. Alleen localhost wordt toegelaten.
"""
import os, re, shutil, subprocess, sys, tempfile, threading, functools, http.server
from playwright.sync_api import sync_playwright

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
LANGS = [a for a in sys.argv[1:] if a in ('nl', 'en')] or ['nl', 'en']
ALSO = [a[len('--also='):] for a in sys.argv[1:] if a.startswith('--also=')]
LOCALE = {'en': 'en-US', 'nl': 'nl-NL'}
PLACE = re.compile('place|plaats', re.I)

def demo_library(dest):
    files = subprocess.check_output(['git', 'ls-files', 'devices'], cwd=ROOT, text=True).split('\n')
    for extra in ALSO:
        for dp, _, fn in os.walk(os.path.join(ROOT, extra)):
            files += [os.path.relpath(os.path.join(dp, f), ROOT) for f in fn if f.endswith('.patchkamer-device.js')]
    for f in files:
        if f.endswith('.patchkamer-device.js'):
            d = os.path.join(dest, os.path.dirname(f[len('devices/'):])); os.makedirs(d, exist_ok=True)
            shutil.copy(os.path.join(ROOT, f), d)

def serve():
    handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=ROOT)
    handler.log_message = lambda *a, **k: None
    srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), handler)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv, 'http://localhost:%d' % srv.server_address[1]

def drag(pg, a, b):
    A, B = a.bounding_box(), b.bounding_box()
    pg.mouse.move(A['x'] + A['width'] / 2, A['y'] + A['height'] / 2); pg.mouse.down()
    pg.mouse.move(B['x'] + B['width'] / 2, B['y'] + B['height'] / 2, steps=20); pg.mouse.up(); pg.wait_for_timeout(300)

def main():
    tmp = tempfile.mkdtemp(); lib = os.path.join(tmp, 'library'); demo_library(lib)
    srv, base = serve()
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
            for lang in LANGS:
                out = os.path.join(ROOT, 'docs', 'images', lang); os.makedirs(out, exist_ok=True)
                shots(browser, lang, out, lib, base)
            browser.close()
    finally:
        srv.shutdown(); shutil.rmtree(tmp, ignore_errors=True)

def shots(browser, lang, OUT, LIB, BASE):
    def newpage(w=1900, h=1060, libh=900, skin=None, nopicker=False):
        pg = browser.new_context(viewport={'width': w, 'height': h}, locale=LOCALE[lang]).new_page(); pg.errs = []
        pg.on('pageerror', lambda e: pg.errs.append(str(e)))
        pg.route('**/*', lambda r: r.continue_() if r.request.url.startswith('http://localhost') else r.abort())
        init = "localStorage.setItem('patchkamerWsAuto',JSON.stringify({dev:{on:false},pre:{on:false},tun:{on:false}}));" + ("delete window.showDirectoryPicker;" if nopicker else "") + "localStorage.setItem('patchkamerLib',JSON.stringify({x:16,y:16,w:340,h:%d,fs:14,min:false,shown:true,closed:[]}));" % libh
        if skin: init += "localStorage.setItem('patchkamer.skin','%s');" % skin
        pg.add_init_script(init); pg.goto(BASE + '/patchkamer/patchkamer.html')
        pg.add_style_tag(content='*{user-select:none!important}'); pg.wait_for_timeout(700); return pg
    def load_lib(pg):
        with pg.expect_file_chooser() as fc: pg.click('#srcAddDir')
        fc.value.set_files(LIB); pg.wait_for_timeout(1500)
    def place(pg, name):
        pg.locator('.libdev').filter(has=pg.locator('.nm', has_text=re.compile('^\\s*' + re.escape(name) + '\\s*$'))).locator('button').filter(has_text=PLACE).first.click(); pg.wait_for_timeout(500)
    def import_tunes(pg):
        pg.click('#prBtn'); pg.wait_for_timeout(300)
        with pg.expect_file_chooser() as fc: pg.click('#prImport')
        fc.value.set_files(os.path.join(ROOT, 'tunes', 'acid-baselines-classics.patchkamer-tunes.json')); pg.wait_for_timeout(1000)
    def build_patch(pg):
        load_lib(pg)
        for n in ['Keys / MIDI', 'Acid Baselines', 'Speakers']: place(pg, n)
        pg.click('#libToggle'); pg.wait_for_timeout(300); pg.click('#arrange'); pg.wait_for_timeout(1200)
        c = pg.locator('.card')
        drag(pg, c.nth(0).locator('[data-port="notes"][data-dir="out"]'), c.nth(1).locator('[data-port="notes"][data-dir="in"]'))
        drag(pg, c.nth(1).locator('[data-port="out"][data-dir="out"]'), c.nth(2).locator('[data-port="in"][data-dir="in"]'))
        pg.click('#arrange'); pg.wait_for_timeout(5500)   # wacht tot de melding verdwijnt
    def shadow_set(card, sel, val):
        card.evaluate("(c,a)=>{const s=[...c.querySelectorAll('*')].find(e=>e.shadowRoot).shadowRoot.querySelector(a[0]); s.value=a[1]; s.dispatchEvent(new Event('change'))}", [sel, val])
    def done(pg):
        if pg.errs: print('PAGINAFOUTEN', lang, pg.errs)
        pg.context.close()

    pg = newpage(); pg.screenshot(path=OUT + '/01-start.png'); done(pg)
    pg = newpage(nopicker=True); load_lib(pg); pg.screenshot(path=OUT + '/02-library.png')
    pg.click('#libCfgBtn'); pg.wait_for_timeout(400); pg.locator('#libwin').screenshot(path=OUT + '/10-library-layout.png'); done(pg)
    pg = newpage(nopicker=True); build_patch(pg); pg.screenshot(path=OUT + '/03-patch.png')
    pg.click('#wsBtn'); pg.wait_for_timeout(400); pg.locator('#wsPanel').screenshot(path=OUT + '/06-workspace.png'); pg.click('#wsPanel .close'); pg.wait_for_timeout(300)
    pg.click('#setBtn'); pg.wait_for_timeout(400); pg.locator('#setPanel').screenshot(path=OUT + '/07-settings.png'); pg.click('#setClose'); pg.wait_for_timeout(300)
    import_tunes(pg); pg.locator('#prPanel').screenshot(path=OUT + '/09-tunes-panel.png'); done(pg)
    pg = newpage(nopicker=True); build_patch(pg)   # meerdere werkruimtes: de tabbalk met drie werkruimtes
    pg.fill('#wsName', 'Acid jam'); pg.press('#wsName', 'Enter'); pg.click('#wsTabs .add'); pg.wait_for_timeout(1200)
    pg.fill('#wsName', 'Ideas'); pg.press('#wsName', 'Enter'); pg.click('#wsTabs .add'); pg.wait_for_timeout(1200)
    pg.fill('#wsName', 'Mix check'); pg.press('#wsName', 'Enter'); pg.keyboard.press('F1'); pg.wait_for_timeout(2500)
    pg.locator('#wsTabs').screenshot(path=OUT + '/11-workspaces.png'); done(pg)
    pg = newpage(nopicker=True); build_patch(pg)
    for i in (0, 1): pg.locator('.card').nth(i).locator('button', has_text='F').first.click(); pg.wait_for_timeout(200)
    pg.click('#focusBtn'); pg.wait_for_timeout(800); pg.locator('#focusview button, .focusview button').nth(1).click(); pg.wait_for_timeout(1000)
    pg.screenshot(path=OUT + '/08-focus.png'); done(pg)
    for skin, name in (('light', '03-patch-light'), ('s1000', '03-patch-retro')):
        pg = newpage(nopicker=True, skin=skin); build_patch(pg); pg.screenshot(path=OUT + '/' + name + '.png'); done(pg)
    pg = newpage(h=1500, nopicker=True); load_lib(pg); place(pg, 'Acid Baselines'); pg.click('#libToggle'); pg.wait_for_timeout(2500)   # hoog scherm: de kaart past er helemaal op
    import_tunes(pg); pg.click('#prPanel .close'); pg.wait_for_timeout(300)
    c = pg.locator('.card').first
    c.evaluate("c=>{const s=[...c.querySelectorAll('select')].find(x=>x.options.length>3&&x.options[0].value===''); s.selectedIndex=1; s.dispatchEvent(new Event('change',{bubbles:true}))}"); pg.wait_for_timeout(600)
    shadow_set(c, 'select.pat', 'Squelch'); pg.wait_for_timeout(300); c.screenshot(path=OUT + '/04-acid-baselines.png'); done(pg)
    pg = newpage(h=1500, nopicker=True); load_lib(pg); place(pg, 'Keys / MIDI'); pg.click('#libToggle'); pg.wait_for_timeout(2500)
    pg.locator('.card').first.screenshot(path=OUT + '/05-keys.png'); done(pg)
    print('klaar:', lang, len(os.listdir(OUT)), 'afbeeldingen')

if __name__ == '__main__':
    main()
