#!/usr/bin/env python3
# SPDX-License-Identifier: AGPL-3.0-or-later
"""Meet Convolution Reverb in Chromium (echte ConvolverNode en AudioWorklet, OfflineAudioContext).

Gebruik, vanuit de root van de repo:
    python3 docs/tools/measure-convolution-reverb.py [ir] [controls] [latency] [cpu] [stable]
Zonder argument: alle metingen. Nodig: Python 3, `pip install playwright` en `playwright install chromium`.
De metingen staan in docs/tools/measure-convolution-reverb-page.mjs. Er wordt niets beluisterd.
"""
import functools, http.server, os, sys, threading
from playwright.sync_api import sync_playwright
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=ROOT); handler.log_message = lambda *a, **k: None
srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), handler); threading.Thread(target=srv.serve_forever, daemon=True).start()
base = 'http://localhost:%d' % srv.server_address[1]
with sync_playwright() as p:
    b = p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required']); pg = b.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto(base + '/docs/tools/measure-page.html' if False else base + '/patchkamer/patchkamer.html'); pg.wait_for_timeout(500)
    pg.set_default_timeout(600000)
    print(pg.evaluate("async (w) => (await import('/docs/tools/measure-convolution-reverb-page.mjs')).measure(w)", sys.argv[1:]))
    if errs: print('PAGINAFOUTEN', errs)
    b.close()
srv.shutdown()
