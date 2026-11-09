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
import os, re, json, shutil, subprocess, sys, tempfile, threading, functools, http.server
from playwright.sync_api import sync_playwright

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
LANGS = [a for a in sys.argv[1:] if a in ('nl', 'en')] or ['nl', 'en']
ONLY_CLIP = '--only-clip' in sys.argv   # alleen de afbeeldingen van het klembord (20 en 21, plus 18 en 19 in een hoog venster)
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
        init = "localStorage.setItem('patchkamerWsAuto',JSON.stringify({dev:{on:false},pre:{on:false},tun:{on:false}}));" + ("delete window.showDirectoryPicker;" if nopicker else "") + "localStorage.setItem('patchkamerLib',JSON.stringify({x:16,y:16,w:520,h:%d,fs:14,min:false,shown:true,closed:[]}));" % libh
        if skin: init += "localStorage.setItem('patchkamer.skin','%s');" % skin
        pg.add_init_script(init); pg.goto(BASE + '/patchkamer/patchkamer.html')
        pg.add_style_tag(content='*{user-select:none!important}'); pg.wait_for_timeout(700); return pg
    def load_lib(pg):
        with pg.expect_file_chooser() as fc: pg.click('#srcAddDir')
        fc.value.set_files(LIB); pg.wait_for_timeout(1500)
        pg.evaluate("document.querySelectorAll('.cat.closed .cathead').forEach(b=>b.click())"); pg.wait_for_timeout(300)   # de host start met alle categorieën ingeklapt
    def place(pg, name):
        pg.locator('.libdev').filter(has=pg.locator('.nm', has_text=re.compile('^\\s*' + re.escape(name) + '\\s*$'))).locator('button').filter(has_text=PLACE).first.click(); pg.wait_for_timeout(500)
    def menu_click(pg, sel):   # de knoppen Werkruimte, Herschik, Instellingen, Focus enz. staan achter ☰
        pg.click('#menuBtn'); pg.wait_for_timeout(250); pg.click(sel); pg.wait_for_timeout(250)
    def lib_tab(pg, tab):   # open het bibliotheekvenster op een tab (tabs, of de keuzelijst als ze niet passen)
        if pg.evaluate("document.getElementById('libwin').hidden"): pg.click('#libToggle'); pg.wait_for_timeout(300)
        if pg.is_visible('#libTab_' + tab): pg.click('#libTab_' + tab)
        else: pg.select_option('#libSel', tab)
        pg.wait_for_timeout(300)
    def import_tunes(pg):
        lib_tab(pg, 'tunes')
        with pg.expect_file_chooser() as fc: pg.click('#prImport')
        fc.value.set_files(os.path.join(ROOT, 'tunes', 'acid-baselines-classics.patchkamer-tunes.json')); pg.wait_for_timeout(1000)
    def build_patch(pg):
        load_lib(pg)
        for n in ['Keyboard', 'Acid Baselines', 'Speakers']: place(pg, n)
        pg.click('#libToggle'); pg.wait_for_timeout(300); menu_click(pg, '#arrange'); pg.wait_for_timeout(1200)
        c = pg.locator('.card')
        drag(pg, c.nth(0).locator('[data-port="notes"][data-dir="out"]'), c.nth(1).locator('[data-port="notes"][data-dir="in"]'))
        drag(pg, c.nth(1).locator('[data-port="out"][data-dir="out"]'), c.nth(2).locator('[data-port="in"][data-dir="in"]'))
        menu_click(pg, '#arrange'); pg.wait_for_timeout(5500)   # wacht tot de melding verdwijnt
    def shadow_set(card, sel, val):
        card.evaluate("(c,a)=>{const s=[...c.querySelectorAll('*')].find(e=>e.shadowRoot).shadowRoot.querySelector(a[0]); s.value=a[1]; s.dispatchEvent(new Event('change'))}", [sel, val])
    def done(pg):
        if pg.errs: print('PAGINAFOUTEN', lang, pg.errs)
        pg.context.close()

    def clip_docs():   # plakmenu (20) en Kopieer alle sporen in het plakmenu van de Clip Arranger (21); beeld 1400 breed
        CP = re.compile('^(Kopieer|Copy)$', re.I); PL = re.compile('^(Plak|Paste)$', re.I)
        pg = newpage(w=1400, h=780, libh=700, nopicker=True); load_lib(pg)
        place(pg, 'Drum Kit'); pg.click('#libToggle'); pg.wait_for_timeout(800)
        pg.locator('.card .bar .clipbtn', has_text=CP).first.click(); pg.wait_for_timeout(400)   # Drum Kit is de bron
        pg.locator('.card .bar button', has_text='\u00d7').first.click(); pg.wait_for_timeout(500)
        pg.click('#libToggle'); pg.wait_for_timeout(300); place(pg, 'Pulse Drums'); pg.click('#libToggle'); pg.wait_for_timeout(1000)
        pg.locator('.card .bar .clipmore').first.click(); pg.wait_for_timeout(500)
        pg.locator('.clipmenu input[type=checkbox]').nth(1).check(); pg.wait_for_timeout(200)   # Pas lengte aan de clip aan
        pg.screenshot(path=OUT + '/20-paste-menu.png', clip={'x': 0, 'y': 0, 'width': 1400, 'height': 700}); done(pg)
        pg = newpage(w=1400, h=900, libh=700, nopicker=True); load_lib(pg)
        place(pg, 'Clip Arranger'); pg.click('#libToggle'); pg.wait_for_timeout(1000)
        pg.locator('.card .bar .clipmore').first.click(); pg.wait_for_timeout(500)
        pg.screenshot(path=OUT + '/21-copy-all-tracks.png', clip={'x': 0, 'y': 0, 'width': 1400, 'height': 780}); done(pg)
        for dev, name in (('Chord Buddy', '18-chord-buddy'), ('Balance EQ', '19-balance-eq')):   # de hele kaart: een hoog venster, anders knipt de vloer hem af
            pg = newpage(w=1400, h=2300, libh=700, nopicker=True); load_lib(pg); place(pg, dev); pg.click('#libToggle'); pg.wait_for_timeout(1500)
            pg.locator('.card').first.screenshot(path=OUT + '/' + name + '.png'); done(pg)
    if ONLY_CLIP: clip_docs(); print('klaar (klembord):', lang); return

    pg = newpage(); pg.screenshot(path=OUT + '/01-start.png'); done(pg)
    pg = newpage(nopicker=True); load_lib(pg); pg.screenshot(path=OUT + '/02-library.png')
    pg.click('#libCfgBtn'); pg.wait_for_timeout(400); pg.locator('#libwin').screenshot(path=OUT + '/10-library-layout.png'); done(pg)
    pg = newpage(nopicker=True); build_patch(pg); pg.screenshot(path=OUT + '/03-patch.png')
    menu_click(pg, '#wsBtn'); pg.wait_for_timeout(400); pg.locator('#wsPanel').screenshot(path=OUT + '/06-workspace.png'); pg.click('#wsPanel .close'); pg.wait_for_timeout(300)
    menu_click(pg, '#setBtn'); pg.set_viewport_size({'width': 1900, 'height': 1700}); pg.wait_for_timeout(600); pg.locator('#setPanel').screenshot(path=OUT + '/07-settings.png'); pg.set_viewport_size({'width': 1900, 'height': 1060}); pg.click('#setClose'); pg.wait_for_timeout(300)
    import_tunes(pg); pg.locator('#libwin').screenshot(path=OUT + '/09-tunes-panel.png'); done(pg)
    pg = newpage(nopicker=True); load_lib(pg); lib_tab(pg, 'samples')   # de tab Samples met het meegeleverde pack
    pg.set_input_files('#samFile', os.path.join(ROOT, 'samples', 'break-loops.patchkamer-samples.json')); pg.wait_for_timeout(1500)
    pg.evaluate("[...document.querySelectorAll('#samLibs .pritem.fold .nm')].forEach(n=>{ if(/jungle/i.test(n.textContent)) n.click(); })"); pg.wait_for_timeout(500)
    pg.locator('#libwin').screenshot(path=OUT + '/12-samples-panel.png'); done(pg)
    pg = newpage(nopicker=True); build_patch(pg)   # meerdere werkruimtes: de tabbalk met drie werkruimtes
    pg.fill('#wsName', 'Acid jam'); pg.press('#wsName', 'Enter'); pg.click('#wsTabs .add'); pg.wait_for_timeout(1200)
    pg.fill('#wsName', 'Ideas'); pg.press('#wsName', 'Enter'); pg.click('#wsTabs .add'); pg.wait_for_timeout(1200)
    pg.fill('#wsName', 'Mix check'); pg.press('#wsName', 'Enter'); pg.keyboard.press('F1'); pg.wait_for_timeout(2500)
    pg.locator('#wsTabs').screenshot(path=OUT + '/11-workspaces.png'); done(pg)
    pg = newpage(nopicker=True); build_patch(pg)
    for i in (0, 1): pg.locator('.card').nth(i).locator('button', has_text='F').first.click(); pg.wait_for_timeout(200)
    menu_click(pg, '#focusBtn'); pg.wait_for_timeout(800); pg.locator('#focusview button, .focusview button').nth(1).click(); pg.wait_for_timeout(1000)
    pg.screenshot(path=OUT + '/08-focus.png'); done(pg)
    for skin, name in (('light', '03-patch-light'), ('s1000', '03-patch-retro'), ('aurora', '03-patch-aurora'), ('paper', '03-patch-paper')):
        pg = newpage(nopicker=True, skin=skin); build_patch(pg); pg.screenshot(path=OUT + '/' + name + '.png'); done(pg)
    pg = newpage(h=1500, nopicker=True); load_lib(pg); place(pg, 'Acid Baselines'); pg.click('#libToggle'); pg.wait_for_timeout(2500)   # hoog scherm: de kaart past er helemaal op
    import_tunes(pg); pg.click('#libToggle'); pg.wait_for_timeout(300)   # het bibliotheekvenster weer dicht
    c = pg.locator('.card').first
    c.evaluate("c=>{const s=[...c.querySelectorAll('select')].find(x=>x.options.length>3&&x.options[0].value===''); s.selectedIndex=1; s.dispatchEvent(new Event('change',{bubbles:true}))}"); pg.wait_for_timeout(600)
    shadow_set(c, 'select.pat', 'Squelch'); pg.wait_for_timeout(300); c.screenshot(path=OUT + '/04-acid-baselines.png'); done(pg)
    pg = newpage(h=1500, nopicker=True); load_lib(pg); place(pg, 'Keyboard'); pg.click('#libToggle'); pg.wait_for_timeout(2500)
    pg.locator('.card').first.screenshot(path=OUT + '/05-keys.png'); done(pg)
    pg = newpage(nopicker=True); load_lib(pg); lib_tab(pg, 'skins')   # de skin-editor, geopend vanaf de tab Skins met Duofone
    pg.evaluate("(()=>{ const s=[...document.querySelectorAll('#skPanel select')].find(x=>[...x.options].some(o=>o.value==='nl.patchkamer.duofone')); s.value='nl.patchkamer.duofone'; s.dispatchEvent(new Event('change',{bubbles:true})); })()")
    pg.click('#skPanel [data-act=skEdOpen]'); pg.wait_for_timeout(2000)
    def sk_center(sel):
        pg.locator(sel).first.scroll_into_view_if_needed(); bx = pg.locator(sel).first.bounding_box(); return bx['x'] + bx['width'] / 2, bx['y'] + bx['height'] / 2
    for i, pid in enumerate(('cutoff', 'resonance')):   # sleep twee regelaars uit het origineel naar de nieuwe skin
        o = sk_center('.se-pane.orig [data-pk-id="%s"]' % pid); nb = pg.locator('.se-pane.new .se-fit').bounding_box()
        pg.mouse.move(*o); pg.mouse.down(); pg.mouse.move(nb['x'] + nb['width'] / 2, nb['y'] + (nb['height'] / 2 if i == 0 else 40), steps=15); pg.mouse.up(); pg.wait_for_timeout(500)
        if i == 0: pg.locator('.se-pane.new [data-pk-pn]').first.scroll_into_view_if_needed()
    pg.locator('#skEd .se-trow[data-key="c:*:resonance"]').click(); pg.wait_for_timeout(600); pg.screenshot(path=OUT + '/13-skin-editor.png'); done(pg)
    # skins uit skins/library op een echt apparaat: panelen, pads, schermpje en meters (14-17), daarna twee apparaten zonder skin (18-19)
    for dev, skinf, name in (('Duofone', 'nl.patchkamer.duofone/example-panels', '14-skin-panels'), ('Drum Machine', 'nl.patchkamer.drummachine/example-round-pads', '15-skin-pads'),
                             ('Drum Machine', 'nl.patchkamer.drummachine/example-preset-screen', '16-skin-display'), ('Mixer', 'nl.patchkamer.mixer/example-vu', '17-skin-meters')):
        pg = newpage(h=1500, nopicker=True); load_lib(pg); place(pg, dev); pg.click('#libToggle'); pg.wait_for_timeout(1500)
        sf = os.path.join(ROOT, 'skins', 'library', skinf + '.patchkamer-skin.json'); sid = json.load(open(sf))['id']
        menu_click(pg, '#skBtn'); pg.set_input_files('#skFile', sf); pg.wait_for_timeout(800); pg.is_visible('#skClose') and pg.click('#skClose'); pg.wait_for_timeout(300)
        pg.evaluate("sid=>{const s=document.querySelector('.sksel'); s.value=sid; s.dispatchEvent(new Event('change',{bubbles:true}))}", sid); pg.wait_for_timeout(1200)
        pg.locator('.card').first.screenshot(path=OUT + '/' + name + '.png'); done(pg)   # de keuzelijst Skin staat in het kaartmenu: zet hem direct
    clip_docs()
    print('klaar:', lang, len(os.listdir(OUT)), 'afbeeldingen')

if __name__ == '__main__':
    main()
