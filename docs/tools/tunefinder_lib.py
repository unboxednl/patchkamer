# SPDX-License-Identifier: AGPL-3.0-or-later
"""Gedeelde onderdelen van build-tune-index.py en eval-tune-finder.py: een headless Chromium die apparaten rendert met de echte
apparaatcode (OfflineAudioContext) en het geluid analyseert met het analysegedeelte uit het apparaatbestand van Tune Finder."""
import functools, glob, http.server, json, os, re, threading
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
HERE = os.path.dirname(os.path.abspath(__file__))
DEVICE_FILE = os.path.join(ROOT, 'devices', 'tools', 'TuneFinder', 'tune-finder.patchkamer-device.js')
REFS = [36, 48, 60, 72]            # reference notes of the index (C2, C3, C4, C5)
REF_VEL, REF_DUR, REF_TOTAL = 0.8, 0.9, 2.2

# family per device id (documented in devices/tools/TuneFinder/AGENTS.md); anything else that sounds gets 'other'
FAMILY = {}
for fam, ids in {
    'bass': ['mono', 'laddermono', 'lowbass', 'subline', 'acidbaselines', 'acidstepper', 'duofone', 'crossmodmono', 'patchmono'],
    'keys-plucked': ['piano', 'stagekeys', 'guitar', 'string'],
    'orchestral-voice': ['brass-section', 'woodwinds', 'bowedensemble', 'formantsinger'],
    'poly-lead-pad': ['polysynth', 'polychorus', 'chordpoly', 'supersawswarm', 'patchbaysynth', 'fouroperatorfm', 'paradox'],
    'texture-drone': ['drone', 'foundry', 'biotope', 'celestialmechanics', 'cinematicsynth', 'dissonantcluster', 'graincloud', 'layeredlandscape', 'mist'],
    'sample': ['samplebank'],
}.items():
    for i in ids: FAMILY['nl.patchkamer.' + i] = fam
SKIP_CATEGORIES = {'groove'}       # drum machines and loop devices: Drum Listener's domain, they do not play notes as an instrument

def analysis_source(path=None):
    """The text between the TUNE-ANALYSIS markers of the device file (or of the file given)."""
    t = open(path or os.environ.get('TF_ANALYSIS') or DEVICE_FILE, encoding='utf8').read()
    a, b = t.index('// ==== TUNE-ANALYSIS BEGIN'), t.index('// ==== TUNE-ANALYSIS END')
    return t[a:b]

class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a, **k): pass

def serve():
    srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(Q, directory=ROOT))
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv, 'http://localhost:%d' % srv.server_address[1]

def open_page(p, base, code):
    b = p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required']); pg = b.new_page()
    pg.route('**/blank.html', lambda r: r.fulfill(body='<!doctype html><title>x</title>', content_type='text/html'))
    pg.goto(base + '/blank.html'); pg.add_script_tag(path=os.path.join(HERE, 'tune-finder-page.js'))
    pg.evaluate('c=>TFinit(c)', code); return b, pg

def tune_packs():
    for f in sorted(glob.glob(ROOT + '/tunes/*.patchkamer-tunes.json')):
        d = json.load(open(f, encoding='utf8')); out = []
        def walk(items, path):
            for n in items:
                if 'items' in n: walk(n['items'], path + [n['folder']])
                elif n.get('kind', 'set') == 'set' and isinstance(n.get('state'), dict): out.append((path, n))
        walk(d['tree'], [])
        yield os.path.basename(f), d['device'], out

def device_files():
    """{device id: (file, name, category, kind, eventPort)} read with Node from the definitions (no host needed)."""
    import subprocess
    js = '''const fs=require("fs");const files=process.argv.slice(1);(async()=>{const out={};for(const f of files){try{const m=await import("file://"+f);const d=m.default;if(d&&d.id)out[d.id]={file:f,name:d.name,kind:d.kind,category:d.category,ev:((d.ports||{}).eventIn||[]).map(p=>p.id)}}catch(e){}}console.log(JSON.stringify(out))})()'''
    files = sorted(glob.glob(ROOT + '/devices/**/*.patchkamer-device.js', recursive=True))
    r = subprocess.run(['node', '-e', js] + files, capture_output=True, text=True, check=True)
    return json.loads(r.stdout)

def url_of(base, f): return base + f[len(ROOT):]

def render(pg, spec):
    return pg.evaluate('s=>TFrender(s)', spec)

def read_index(path):
    """The index as a dict: a .json file, or the TUNE-INDEX block of a device file."""
    t = open(path, encoding='utf8').read()
    if path.endswith('.json'): return json.loads(t)
    i0 = t.index('const INDEX = ', t.index('// ==== TUNE-INDEX BEGIN')) + len('const INDEX = '); i1 = t.index(';\n// ==== TUNE-INDEX END')
    return json.loads(t[i0:i1])
