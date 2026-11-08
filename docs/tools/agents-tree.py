#!/usr/bin/env python3
# SPDX-License-Identifier: AGPL-3.0-or-later
"""De boom van AGENTS.md-bestanden: root -> mappen -> soorten -> apparaten.

    python3 docs/tools/agents-tree.py --write   # schrijft de AGENTS.md per soort (devices/<soort>/AGENTS.md) en de routeregel in elke apparaat-AGENTS.md
    python3 docs/tools/agents-tree.py --check   # controleert dat die kloppen en dat elk AGENTS.md-bestand vanaf de root bereikbaar is via links

Het overzicht van de apparaten komt uit de tabel in devices/AGENTS.md (die list-devices.py genereert). Draai eerst list-devices.py, dan dit script.
"""
import os, re, subprocess, sys

ROOT = subprocess.check_output(['git', 'rev-parse', '--show-toplevel'], text=True).strip()
os.chdir(ROOT)
MARK = '<!-- agents-tree -->'

# soort: (titel, wat, tunes/presets, regels voor wie hier bouwt)
KINDS = {
 'synths': ('Synths', 'Apparaten die uit noten geluid maken: bassen, leads, pads, akkoorden, toetsen, strijkers, blazers, snaarinstrumenten, sound design, modulair patchen, drones, texturen en zang.', 'tunes',
  ['`kind: \'instrument\'`; ingang `event in` (noten), uitgang `audio uit` (stereo), meestal `mod` voor sturing. Een synth heeft meestal geen eigen patroon: een sequencer of de toetsen sturen hem; sommige (Acid Baselines, Sub Line) hebben wel een eigen patroon of arpeggiator.',
   'Een synth heeft **tunes** (geen presets). Een tune is de volledige `state` van dit ene apparaat.',
   'Elke synth begint met `// SPDX-License-Identifier: AGPL-3.0-or-later`, is tweetalig (`host.lang`) en bewaakt zijn uitvoer tegen NaN en Infinity (zie de NaN-regels in het contract).']),
 'samplers': ('Samplers', 'Apparaten die eigen geluid spelen: pads en slices uit geladen audio (Samplebank, Loop Slicer).', 'tunes',
  ['`kind: \'instrument\'`; noten in, audio uit. Het geluid komt uit geladen audio (contract §13e, `loadAudio`).',
   'Een tune van een sampler bevat **nooit de audio zelf**, alleen de instellingen (hoe geknipt, hoe gespeeld). De audio zit in een samplepack of een bestand van de gebruiker; zie [samples/AGENTS.md](../../samples/AGENTS.md).']),
 'sequencers': ('Sequencers', 'Apparaten die zelf geen geluid maken maar noten, akkoorden en trigs sturen naar andere apparaten.', 'presets',
  ['`kind: \'utility\'`; uitgang `event uit` (een per spoor als er meer sporen zijn), geen audio. Een sequencer met een notenkabel naar een drumcomputer toont de klanken daarvan als rijen (`noteNames()`, contract v1.14).',
   'Een sequencer heeft **presets** (geen tunes). Het kopiëren en plakken van patronen loopt via het klembord van het contract (§13d, `clipInfo`, `getClip`, `setClip`).']),
 'drums': ('Drums', 'Drumcomputers en percussie: een eigen stappenpatroon, aparte uitgangen per geluid en een ingang waarop een sequencer trigs kan sturen.', 'tunes',
  ['`kind: \'instrument\'`; meestal een eigen patroon in de `state`, uitgang `audio uit` of een `multi`-bundel met een uitgang per geluid voor de Mixer, en `event in` voor trigs.',
   'Een drumapparaat heeft **tunes**; bij een drumcomputer horen `parts` (de klanken) en een naam per klank voor de sequencers.']),
 'effects': ('Effects', 'Effecten die het geluid vormen: modulatie, vervorming, ruimte, filters, ritme, stem en hele ketens.', 'presets',
  ['`audio in` naar `audio uit`; `kind: \'effect\'`. Zet ze in een song tussen een bron en de Mixer, of op een send/return van de Mixer.',
   'Een effect heeft **presets** (geen tunes). Controleer vooral gedrag bij NaN, Infinity en enorme waarden op de ingang: één foute sample vergiftigt alles erachter.']),
 'mastering': ('Mastering', 'Apparaten om een mix af te maken: toon, dynamiek, saturatie, breedte, volume en controle.', 'presets',
  ['Een keten van `in` naar `out`; Master Director zet ze allemaal tegelijk via mastering-kabels (`host.mastering`, contract v1.12). Presets, geen tunes.']),
 'mixer': ('Mixer', 'Binnenhalen, mixen, het niveau gelijk houden en afspelen: Mixer, Leveler, Speakers, Audio Input, Audio Capture en Audio Output.', 'presets',
  ['`kind: \'mixer\'` of `\'output\'`. Een song met Audio Input of Audio Capture klinkt niet bij elke luisteraar hetzelfde, want het geluid hangt af van wat is aangesloten. Presets, geen tunes.']),
 'modulators': ('Modulators', 'Apparaten die de regelaars van andere apparaten bewegen: Drift, Follower, LFO, Macro, Multi-Segment Envelope en Swell.', 'presets',
  ['`kind: \'modulator\'`; uitgang `mod uit` (kabel `mod`). De toewijzing (welke parameter, hoe diep) staat in de `state` van de modulator, niet in de kabel. Presets, geen tunes.']),
 'tools': ('Tools', 'Helpers om te spelen, op te nemen, te meten en te herkennen: toetsen, controllers, MIDI, opname, notities, scope, en de zoekers die uit audio noten, drumpatronen of een passende tune halen.', 'presets',
  ['`kind: \'utility\'`. Tools hebben **presets** voor hun instellingen, nooit voor hun resultaat of de audio.',
   'De zoekers (Bass Finder, Drum Listener, Tune Finder, Stem Splitter) analyseren audio lokaal of via een dienst en leveren hun resultaat als clip voor het klembord (contract §13d) of als een tune; ze nemen audio aan via `loadAudio` (bestand, tab Samples) en via de audio-ingang. Hun toetsscripts (`docs/tools/eval-*.py`, `check-*.mjs`) horen bij het apparaat: draai ze na een wijziging van de analyse.']),
}

def read(p): return open(p, encoding='utf-8').read()
def rel(a, b): return os.path.relpath(b, os.path.dirname(a) or '.')

def devices_table():
    t = read('devices/AGENTS.md'); out = {}
    for line in t.split('\n'):
        m = re.match(r'\| (.+?) \| `(nl\.patchkamer\.[^`]+)` \| \[`([a-z]+)/([A-Za-z0-9]+)/`\]\([^)]*\) \| (.+?) \| ', line)
        if m: out.setdefault(m.group(3), []).append((m.group(1), m.group(2), m.group(4), m.group(5)))
    return out

def category_file(k, devs):
    title, what, packs, rules = KINDS[k]; f = f'devices/{k}/AGENTS.md'
    packdoc = ('tunes/AGENTS.md', 'tunes') if packs == 'tunes' else ('presets/AGENTS.md', 'presets')
    L = [f'# AGENTS.md: devices/{k}/ ({title})', '',
         f'Dit bestand is voor AI-agents die een apparaat, tune of preset in de soort **{title}** maken of gebruiken, of een song met zulke apparaten componeren. Het is niet geschreven voor mensen. {what}', '',
         '## Plaats in de boom', '',
         f'- Omhoog: [devices/AGENTS.md]({rel(f,"devices/AGENTS.md")}) (alle apparaten in een song, kabelsoorten, de klok) en de [root AGENTS.md]({rel(f,"AGENTS.md")}) (het contract en de regels voor elk nieuw apparaat).',
         f'- Omlaag: de `AGENTS.md` van elk apparaat in deze soort, in de tabel hieronder.',
         f'- Opzij: [{packdoc[0]}]({rel(f,packdoc[0])}) (hoe {packdoc[1]} zijn opgebouwd en gemaakt) en [songs/AGENTS.md]({rel(f,"songs/AGENTS.md")}) (een song componeren).',
         f'- Voor mensen: [README](README.md) en de handleiding [NL]({rel(f,f"docs/{k}/USER-MANUAL_NL.md")}) · [EN]({rel(f,f"docs/{k}/USER-MANUAL_EN.md")}). Die zijn niet bedoeld als instructie voor agents.', '',
         '## Wat deze soort is en wat je moet weten', '']
    L += [f'- {r}' for r in rules]
    L += [f'- Het contract: [NL]({rel(f,"contract/PATCHKAMER-CONTRACT_NL.md")}) · [EN]({rel(f,"contract/PATCHKAMER-CONTRACT_EN.md")}); de validator `contract/validate-instrument.mjs` (draai hem in gewoon, `--lang en` en `--lang nl`).', '',
          '## Een nieuw apparaat in deze soort bouwen', '',
          f'1. Lees de [root AGENTS.md]({rel(f,"AGENTS.md")}) helemaal en het contract. Controleer eerst dat contract en validator dezelfde versie hebben.',
          f'2. Zet het apparaat in `devices/{k}/<Naam>/<naam>.patchkamer-device.js` (naam met hoofdletter, bestand in kleine letters met streepjes, zonder versienummer) met een eigen `AGENTS.md` en een `icon.svg` (zie [het icoon van een apparaat]({rel(f,"devices/AGENTS.md")}#het-icoon-van-een-apparaat)).',
          f'3. Maak {"tunes" if packs=="tunes" else "presets"} en bijbehorende documentatie volgens [{packdoc[0]}]({rel(f,packdoc[0])}).',
          '4. Werk de documentatie bij zoals in de root `AGENTS.md` staat (README\'s, handleidingen, changelog, in twee talen), draai `python3 docs/tools/list-devices.py` en `python3 docs/tools/agents-tree.py --write`.', '',
          '## De apparaten', '',
          'Dit overzicht komt uit `devices/AGENTS.md` en wordt gegenereerd door `docs/tools/agents-tree.py --write`; verander het niet met de hand.', '',
          '<!-- agents-tree:begin -->', '', '| Apparaat | `id` | Wat het doet |', '|---|---|---|']
    for name, i, d, desc in devs: L.append(f'| [{name}]({d}/AGENTS.md) | `{i}` | {desc} |')
    L += ['', '<!-- agents-tree:end -->', '']
    return f, '\n'.join(L)

def route_bullet(f, k):
    title = KINDS[k][0]; packs = KINDS[k][2]; pk = 'tunes/AGENTS.md' if packs == 'tunes' else 'presets/AGENTS.md'
    return (f'- Route voor agents: [soort {title}]({rel(f,f"devices/{k}/AGENTS.md")}) → [devices/AGENTS.md]({rel(f,"devices/AGENTS.md")}) → [root AGENTS.md]({rel(f,"AGENTS.md")}). '
            f'Contract: [NL]({rel(f,"contract/PATCHKAMER-CONTRACT_NL.md")}) · [EN]({rel(f,"contract/PATCHKAMER-CONTRACT_EN.md")}). Hoe {packs} van dit apparaat zijn opgebouwd: [{pk}]({rel(f,pk)}). {MARK}')

def device_files():
    return sorted(p for p in subprocess.check_output(['git', 'ls-files', '--cached', '--others', '--exclude-standard', 'devices'], text=True).split('\n') if re.match(r'devices/[a-z]+/[A-Za-z0-9]+/AGENTS\.md$', p))

def patched_device(f):
    k = f.split('/')[1]; t = read(f); b = route_bullet(f, k)
    lines = t.rstrip('\n').split('\n')
    lines = [l for l in lines if MARK not in l]
    for i, l in enumerate(lines):
        if l.startswith('- Overzicht van alle apparaten'): lines.insert(i + 1, b); return '\n'.join(lines) + '\n'
    for i, l in enumerate(lines):
        if l.startswith('- Handleiding van de soort (voor mensen)'): lines.insert(i, b); return '\n'.join(lines) + '\n'
    if '## Documentatie en songs' in lines:
        i = lines.index('## Documentatie en songs'); lines.insert(i + 2 if lines[i + 1] == '' else i + 1, b); return '\n'.join(lines) + '\n'
    name = lines[0].replace('# AGENTS.md:', '').strip()
    extra = ['', '## Documentatie en songs', '', f'Hier vind je de omgeving van dit apparaat: de soort, de overzichten en de handleiding voor mensen.', '', b,
             f'- Handleiding van de soort (voor mensen): [NL]({rel(f,f"docs/{k}/USER-MANUAL_NL.md")}) · [EN]({rel(f,f"docs/{k}/USER-MANUAL_EN.md")}); overzicht: [README]({rel(f,f"devices/{k}/README.md")}).',
             f'- Een song componeren met dit apparaat: [songs/AGENTS.md]({rel(f,"songs/AGENTS.md")}).']
    return '\n'.join(lines + extra) + '\n'

def reachable():
    seen = set(); todo = ['AGENTS.md']
    while todo:
        f = todo.pop()
        if f in seen or not os.path.exists(f): continue
        seen.add(f)
        for l in re.findall(r'\]\(([^)#\s]+)(?:#[^)\s]*)?\)', read(f)):
            if l.startswith('http') or not l.endswith('AGENTS.md'): continue
            todo.append(os.path.normpath(os.path.join(os.path.dirname(f), l)))
    return seen

def main():
    mode = sys.argv[1] if len(sys.argv) > 1 else '--check'
    tab = devices_table(); bad = 0
    want = {}
    for k in KINDS:
        f, t = category_file(k, tab.get(k, [])); want[f] = t
    for f in device_files(): want[f] = patched_device(f)
    for f, t in want.items():
        cur = read(f) if os.path.exists(f) else None
        if cur != t:
            if mode == '--write': open(f, 'w', encoding='utf-8').write(t); print('geschreven', f)
            else: print('verouderd:', f); bad += 1
    allag = [p for p in subprocess.check_output(['git', 'ls-files', '--cached', '--others', '--exclude-standard'], text=True).split('\n') if p.endswith('AGENTS.md') and os.path.exists(p)]
    r = reachable(); miss = [p for p in allag if p not in r]
    for p in miss: print('niet bereikbaar vanaf de root:', p)
    if mode == '--check' and (bad or miss): sys.exit(1)
    if mode == '--write' and miss: sys.exit(1)
    print(f'{len(allag)} AGENTS.md-bestanden, {len(r)} bereikbaar vanaf de root')
main()
