#!/usr/bin/env python3
# SPDX-License-Identifier: AGPL-3.0-or-later
"""Rendert een melodie van Formant Singer offline in Chromium en schrijft die als singer.f32 (mono, 48 kHz, float32).

Dit is testmateriaal voor docs/tools/measure-pitch.mjs (Pitch Shifter, Harmonizer en Pitch Correction).

Gebruik, vanuit de root van de repo:
    python3 docs/tools/render-singer-material.py <uitvoermap>
    node docs/tools/measure-pitch.mjs all --material <uitvoermap>

De melodie bestaat uit acht noten van 1,5 s vanaf 0,2 s: 57 60 64 62 55 67 48 72 (MIDI). Nodig: Python 3, `pip install playwright`
en `playwright install chromium`. De opname is niet beluisterd.
"""
import base64, os, subprocess, sys, time
from playwright.sync_api import sync_playwright

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
out_dir = sys.argv[1] if len(sys.argv) > 1 else '.'
os.makedirs(out_dir, exist_ok=True)
srv = subprocess.Popen(['python3', '-m', 'http.server', '8765', '--directory', ROOT], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(1)
try:
    with sync_playwright() as p:
        b = p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required']); pg = b.new_page()
        pg.route('**/*', lambda r: r.continue_() if 'localhost' in r.request.url else r.abort())
        pg.goto('http://localhost:8765/patchkamer/patchkamer.html')
        res = pg.evaluate('''async () => {
          const mod = await import('/devices/synths/FormantSinger/formant-singer.patchkamer-device.js');
          const sr = 48000, secs = 14, ctx = new OfflineAudioContext(2, sr * secs, sr);
          const chain = () => new Proxy(function () {}, { get: (t, k) => k === 'then' ? undefined : chain(), apply: () => chain(), set: () => true });
          const host = new Proxy({ lang: 'en', bpm: 120, swing: 0, audio: { sampleRate: 48000, quality: 'normal', oversample: '2x', latency: 'balanced' }, frame: () => () => {}, visible: () => false },
            { get: (t, k) => k in t ? t[k] : chain() });
          const inst = mod.default.create(ctx, host); inst.outputs.out.connect(ctx.destination);
          const notes = [[57, 1.5], [60, 1.5], [64, 1.5], [62, 1.5], [55, 1.5], [67, 1.5], [48, 1.5], [72, 1.5]];
          let t = 0.2; for (const [n, d] of notes) { inst.onEvent('notes', { type: 'note', note: n, vel: 0.8, time: t, dur: d * 0.9 }); t += d; }
          const buf = await ctx.startRendering(), L = buf.getChannelData(0), R = buf.getChannelData(1), m = new Float32Array(L.length);
          for (let i = 0; i < L.length; i++) m[i] = 0.5 * (L[i] + R[i]);
          let s = ''; const u8 = new Uint8Array(m.buffer); for (let i = 0; i < u8.length; i += 8192) s += String.fromCharCode.apply(null, u8.subarray(i, i + 8192)); return btoa(s);
        }''')
        path = os.path.join(out_dir, 'singer.f32'); open(path, 'wb').write(base64.b64decode(res)); b.close()
    print('geschreven', path, os.path.getsize(path), 'bytes')
finally:
    srv.terminate()
