# AGENTS.md: tunes/

Dit bestand is voor AI-agents die tunes maken voor Patchkamer-apparaten. Het is niet geschreven voor mensen. Het hoort bij de algemene instructies in `../AGENTS.md`; lees die eerst.

## Wat een tune is

Een tune is de **klank** van een apparaat dat geluid maakt (`kind: 'instrument'`: synths, drones, drumcomputers), bewaard als data. Apparaten zonder eigen geluid (`effect`, `mixer`, `output`, `utility`, `modulator`) krijgen **presets** en geen tunes: die horen in `../presets/`. Welke van de twee past, volgt uit de `kind` van het apparaat. De uitleg staat in het contract, §0 en §13c.

## Wat je nodig hebt

- Het apparaat zelf, in `../devices/<categorie>/<Naam>/<naam>.patchkamer-device.js`, en zijn exacte `id`. Staat er in die map een `AGENTS.md`, lees die dan ook: daar staan de velden, bereiken en een controlescript voor dat apparaat (zoals `../devices/synths/Duofone/AGENTS.md`).
- Het contract, §13c: `../contract/PATCHKAMER-CONTRACT_NL.md` (of `_EN.md`). Controleer eerst dat contract en validator dezelfde versie hebben (`../AGENTS.md`, regel 1).

## Bestand

Eén pack per bestand, in deze map: `naam.patchkamer-tunes.json`. De bestandsnaam bevat **geen versienummer**; revisies staan in de git-geschiedenis.

```json
{ "format": "patchkamer-tunes", "formatVersion": 1, "device": "nl.jouwnaam.apparaat", "name": "Trance basics",
  "author": "…", "license": "CC0-1.0", "description": "…",
  "tree": [ { "folder": "Leads", "items": [ { "name": "Uplifting", "kind": "set", "version": "1.0.0", "state": { } } ] },
            { "name": "Diepe kick", "kind": "part", "part": "kick", "author": "…", "license": "CC0-1.0", "state": { } } ] }
```

- `device` is de `id` van het apparaat, letterlijk. Een tune hangt aan die `id`; een verkeerde schrijfwijze is een tune zonder apparaat.
- `kind: 'set'`: de hele klank van het apparaat. `state` is wat `getPreset()` van het apparaat teruggeeft (of `getState()` als het geen `getPreset` heeft).
- `kind: 'part'`: de klank van één instrument binnen een drumcomputer. Alleen toegestaan als het apparaat `parts()`, `getPart(id)` en `setPart(id, data)` heeft. `state` is wat `getPart(id)` teruggeeft, en `part` is het `id` of `type` uit `parts()`.
- `folder` mag in `folder` zitten.

## Tags (contract v1.19)

Geef elke nieuwe tune `tags`, zodat hij in de bibliotheek te vinden is op instrument en stijl (tabs Tunes en Presets, **Per instrument** en **Per stijl**). Zet wat voor alles in een pack of map geldt op het **pack** of de **map** (`"tags": [...]` naast `name` of `folder`), en alleen het afwijkende op de tune zelf. Een tag is een pad in kleine letters met streepjes: `instrument/guitar/acoustic`, `style/hiphop`. Gebruik de standaardnamen uit §13c van het contract (een gitaar is `instrument/guitar`, een koperblazer `instrument/brass`, jungle `style/jungle`); een eigen naam mag, maar wordt dan niet vertaald. Een mapnaam die een stijl is (Techno, Hip-hop) krijgt de bijbehorende `style/...`-tag op de map. Controleer dat elke tag geldig is: `/^[a-z0-9]+(-[a-z0-9]+)*(\/[a-z0-9]+(-[a-z0-9]+)*){0,3}$/`.

## De `state` moet kloppen

Verzin geen velden. Lees de broncode van het apparaat: welke sleutels geeft `getPreset()`/`getState()`/`getPart()` terug, met welke bereiken en eenheden? Gebruik precies die sleutels met waarden binnen het bereik. Onbekende velden worden genegeerd en ontbrekende krijgen hun standaardwaarde. Zo'n tune klinkt dan anders dan jij bedoelde, zonder foutmelding.

Zet er geen routing, bronkeuzes, lopende posities (klok, fase), AudioNodes of patronen in. Dat hoort niet bij de klank (contract §13, §19).

**Drumcomputers met een eigen sequencer.** Een tune voor Drum Kit, Pulse Drums of Click Synth bevat `run: false`, een tune voor Latin Percussion `sequence: false`: het laden van een tune start de eigen sequencer van het apparaat niet, zodat de gebruiker met zijn eigen sequencer kan beluisteren welke kit past. De patronen blijven in de tune staan (gebruik je ze niet, laat ze dan leeg). Bij een ontbrekend veld zet het apparaat zijn eigen sequencer wél aan.

## Licentie: altijd `CC0-1.0`

Alles in deze map is `CC0-1.0` (publiek domein), zie `LICENSE` en `../LICENSING.md`. Zet daarom `"license": "CC0-1.0"` op het pack **en** op elk item dat een eigen `license` krijgt. Het contract noemt `CC-BY-4.0` en `LicenseRef-All-Rights-Reserved` als keuzes in de studio; die gelden **niet** voor deze map.

- Maak geen tune op basis van werk met een andere licentie, tenzij die ook CC0 of publiek domein is. Doe je dat toch met toestemming of een geschikte licentie, noteer het dan in `basedOn: { name, author, license }` en meld het.
- Zet je eigen naam in `author`. Weet je die niet, laat de opdracht het zeggen. Verzin geen persoon.

## Controleren

Er is geen aparte validator voor tunes. Controleer zelf:

1. Het bestand is geldige JSON: `node -e "JSON.parse(require('fs').readFileSync(process.argv[1],'utf8'))" tunes/<bestand>`.
2. `format` en `formatVersion` kloppen (`"patchkamer-tunes"`, `1`), `device` bestaat in `../devices/`, en dat apparaat heeft `kind: 'instrument'`.
3. Elke sleutel in elke `state` komt voor in de state van dat apparaat.
4. Elk item heeft `name` en `kind`; elk `part`-item heeft een `part` dat het apparaat kent.
5. Lukt het, laad het pack dan in de host (`../patchkamer/AGENTS.md`) en kies de tunes. Heb je geen browser, schrijf dan in je oplevering dat de hosttest **niet is uitgevoerd**.

Lever op: het pad, het `device`-id, de contractversie en wat je niet hebt kunnen testen.

## Tunes gebruiken in een song

Een song bevat de **state** van elk apparaat; het tunebestand zelf reist niet mee. Songs (`CC-BY-4.0`) beginnen bij `../songs/AGENTS.md`; de apparaten staan in `../devices/AGENTS.md`.

1. Zoek het pack van het apparaat in de tabel hieronder en kies een tune (`tree`, `folder`, `name`). Tunes zijn gegroepeerd in stijlmappen; de mapnaam zegt voor welke stijl de klank bedoeld is. Wil je een bepaalde stijl, kies dan een tune uit de map met die naam.
2. Kopieer `state` van die tune (`kind: 'set'`) naar `state` van het apparaat in `workspace.devices` van de song: `{ "id": "d2", "def": "<device-id>", "version": "…", "x": …, "y": …, "state": { …de state van de tune… } }`. De `version` is de versie van het apparaat uit `../devices/` (niet die van de tune). Zo is de song zelfstandig: hij klinkt bij iedereen hetzelfde, ook zonder de tunebibliotheek.
3. Pas daarna **alleen song-specifieke dingen** aan: het patroon of de noten die dit stuk speelt, `transpose` of de toonsoort, en het volume (`lvl`, `level` of hoe het veld in dat apparaat heet; zie de `AGENTS.md` van het apparaat). Laat de klankvelden (oscillatoren, filter, enveloppen, effecten) staan, tenzij je bewust een andere klank wilt; kies dan liever een andere tune.
4. Verzin geen sleutels en laat geen sleutels weg uit de gekopieerde state: de tune is de bekende goede state. Zet er **geen** routing, kabels of AudioNodes in; kabels staan in `workspace.cables`.
5. Let op dat een tune soms **ook een patroon** bevat. Dat geldt voor de drumapparaten (een drumtune is een hele machine, klank en patroon; bijvoorbeeld `pat` bij Drum Machine) en voor synths met een eigen patroon of baslijn (bijvoorbeeld de sleutels `pattern`, `notes`, `steps`, `accents`, `slides` bij Acid Stepper). Dat patroon is dan het startpunt voor jouw song; vervang het door je eigen patroon. De handleiding van het apparaat zegt welke velden dat zijn. Tunes voor Samplebank bevatten hun eigen kleine gegenereerde geluiden (`bankData`) en vervangen dus de banken. Een Loop Slicer-tune bevat nooit de audio van een loop.
6. Een tune begint niet uit zichzelf te spelen: je hebt een klok (Start) en noten of een eigen patroon nodig. Zie `../devices/AGENTS.md`, sectie "De klok".
7. Een tune heeft `kind: 'set'` (hele klank) of `kind: 'part'` (één instrument van een drumcomputer). `part`-tunes kopieer je niet naar de state van het apparaat; ze worden met `setPart` gezet. De meegeleverde packs hebben alleen `set`-tunes, dus voor een song kopieer je altijd een `set`.
8. De optionele sleutel `preset` (`{ lid, pid, name }`) bij een apparaat in de song laat je weg: `lid` en `pid` maakt de host zelf bij het importeren van een pack, en ze verschillen per browser.
9. Controleer de song met `python3 docs/tools/check-song.py <song>` (laadt hem in de host en meet het uitgangsniveau; niet beluisterd).

Samplers en drums: de eisen aan een tune staan in de handleiding van het soort. Documentatie bij tunes:

- Alle tunes, hoe je ze kiest en bewaart: [Tunes: gebruikershandleiding](../docs/tunes/USER-MANUAL_NL.md) (Engels: `../docs/tunes/USER-MANUAL_EN.md`), met [Wat een tune bevat](../docs/tunes/USER-MANUAL_NL.md#wat-een-tune-bevat).
- Synths: [../docs/synths/USER-MANUAL_NL.md](../docs/synths/USER-MANUAL_NL.md).
- Samplers: [../docs/samplers/USER-MANUAL_NL.md](../docs/samplers/USER-MANUAL_NL.md).
- Drums: [../docs/drums/USER-MANUAL_NL.md](../docs/drums/USER-MANUAL_NL.md).

## De packs

De tabel wordt gegenereerd uit de pack-bestanden; verander hem niet met de hand. Opnieuw genereren (vanuit de root van de repo):

```
python3 docs/tools/list-devices.py
```

Hij werkt ook `devices/AGENTS.md` en `presets/AGENTS.md` bij. De stijlmappen zijn de mappen op het hoogste niveau van het pack. Overzicht: [tunes/README_NL.md](README_NL.md).

<!-- list-devices:begin tunes -->
| Apparaat | Pack | Tunes | Stijlmappen (hoogste niveau) | Bestand | Losse instrumenten (`part`) |
|---|---|---|---|---|---|
| [Click Synth](../devices/drums/ClickSynth/) | Click Synth Styles | 30 | 10: Minimal Techno, Microhouse, Techno, Glitch, Electro, Breakbeat, Ambient, Industrial, Dub Techno, Acid | [`click-synth-styles.patchkamer-tunes.json`](click-synth-styles.patchkamer-tunes.json) | – |
| [Drum Kit](../devices/drums/DrumKit/) | Drum Kit Styles | 38 | 12: Techno, House, Trance, Drum & Bass, Dubstep, Hip-hop, Funk & disco, Electro, Pop, Rock, Jazz, Synthwave | [`drum-kit-styles.patchkamer-tunes.json`](drum-kit-styles.patchkamer-tunes.json) | – |
| [Drum Machine](../devices/drums/DrumMachine/) | Drum Machine Styles | 36 | 12: Techno, House, Trance, Drum & Bass, Dubstep, Hip-hop, Funk & disco, Electro, Pop, Rock, Jazz, Synthwave | [`drum-machine-styles.patchkamer-tunes.json`](drum-machine-styles.patchkamer-tunes.json) | – |
| [Groovebox 12](../devices/drums/Groovebox12/) | Groovebox 12 Styles | 38 | 12: Techno, House, Trance, Drum & Bass, Dubstep, Hip-hop, Funk & disco, Electro, Pop, Rock, Jazz, Synthwave | [`groovebox-12-styles.patchkamer-tunes.json`](groovebox-12-styles.patchkamer-tunes.json) | – |
| [Latin Percussion](../devices/drums/LatinPercussion/) | Latin Percussion Styles | 39 | 13: Salsa, Son, Mambo, Cha-Cha-Cha, Rumba, Bossa Nova, Samba, Merengue, Bachata, Cumbia, Reggaeton, Latin Jazz, Latin Soul | [`latin-percussion-styles.patchkamer-tunes.json`](latin-percussion-styles.patchkamer-tunes.json) | – |
| [Pulse Drums](../devices/drums/PulseDrums/) | Pulse Drums Techno | 26 | 8: Techno, Minimal, Peak Time, Hard Techno, Dub Techno, Acid, Electro, Breaks | [`pulse-drums-techno.patchkamer-tunes.json`](pulse-drums-techno.patchkamer-tunes.json) | – |
| [Loop Slicer](../devices/samplers/LoopSlicer/) | Loop Slicer Break Chops | 10 | 0: geen (alles op het hoogste niveau) | [`loop-slicer-break-chops.patchkamer-tunes.json`](loop-slicer-break-chops.patchkamer-tunes.json) | – |
| [Loop Slicer](../devices/samplers/LoopSlicer/) | Loop Slicer Styles | 69 | 12: House, Techno, Breakbeat, Drum and Bass, Hip-hop, Trap, Funk, Dub, Cinematic, Glitch, Pitched Hits, Own Loop | [`loop-slicer-styles.patchkamer-tunes.json`](loop-slicer-styles.patchkamer-tunes.json) | – |
| [Samplebank](../devices/samplers/Samplebank/) | Samplebank Styles | 79 | 16: Techno, House, Trance, Ambient, Synthwave, Hip-hop, Lo-fi, Trap, Drum & Bass, Dubstep, Electro, Pop, Chiptune, Funk & Disco, Dub, Cinematic | [`samplebank-styles.patchkamer-tunes.json`](samplebank-styles.patchkamer-tunes.json) | – |
| [Acid Baselines](../devices/synths/AcidBaselines/) | Acid Baselines Classics | 49 | 9: Chicago Origins, Frankfurt Rolling, Minimal Acid, Squelch Anthems, Acid Techno, Acid Trance, Electro Acid, Deep Acid, AIcid | [`acid-baselines-classics.patchkamer-tunes.json`](acid-baselines-classics.patchkamer-tunes.json) | – |
| [Acid Stepper](../devices/synths/AcidStepper/) | Acid Stepper Styles | 65 | 12: Acid, Techno, House, Deep House, Electro, Trance, Breakbeat, Hip-hop, Synthwave, Dub, Industrial, Garage | [`acid-stepper-styles.patchkamer-tunes.json`](acid-stepper-styles.patchkamer-tunes.json) | – |
| [Basic Mono](../devices/synths/BasicMono/) | Basic Mono Styles | 65 | 12: Techno, House, Electro, Hip-hop, Funk, Synthwave, Dub, Pop, Chiptune, Acid, Trance, Ambient | [`basic-mono-styles.patchkamer-tunes.json`](basic-mono-styles.patchkamer-tunes.json) | – |
| [Biotope](../devices/synths/Biotope/) | Biotope Styles | 86 | 13: Nature, Weather, Water, Ambient, Meditation, Sleep, Cinematic, Sci-Fi, Dark Ambient, Lo-fi, Field Recording, Interiors, Rhythmic | [`biotope-styles.patchkamer-tunes.json`](biotope-styles.patchkamer-tunes.json) | – |
| [Bowed Ensemble](../devices/synths/BowedEnsemble/) | Bowed Ensemble Styles | 65 | 11: Cinematic, Ambient, Pop, Ballad, Trance, Synthwave, Film Score, Lo-fi, Neo-classical, Disco & Funk, Deep House | [`bowed-ensemble-styles.patchkamer-tunes.json`](bowed-ensemble-styles.patchkamer-tunes.json) | – |
| [Brass Section](../devices/synths/BrassSection/) | Brass Section | 32 | 8: Trumpet, Trombone, Horn, Section, Stabs, Swells, Funk, Ballad | [`brass-section.patchkamer-tunes.json`](brass-section.patchkamer-tunes.json) | – |
| [Celestial Mechanics](../devices/synths/CelestialMechanics/) | Celestial Mechanics Styles | 74 | 11: Space, Cinematic, Sci-Fi, Ambient, Dark Ambient, Experimental, Sound Design, Synthwave, Trance, Horror, Drone | [`celestial-mechanics-styles.patchkamer-tunes.json`](celestial-mechanics-styles.patchkamer-tunes.json) | – |
| [Chord Poly](../devices/synths/ChordPoly/) | Chord Poly Styles | 120 | 20: House, Deep House, Garage, Lo-fi, Ambient, Pop, Soul, Synthwave, Cinematic, Disco & Funk, Techno, Dub Techno, Trance, Progressive Trance, Big Room, Electro House, Electro, Future Bass, Hardstyle, Eurodance | [`chord-poly-styles.patchkamer-tunes.json`](chord-poly-styles.patchkamer-tunes.json) | – |
| [Cinematic Synth](../devices/synths/CinematicSynth/) | Cinematic Synth Scores | 56 | 7: Dream Heist, Dark Hero, Space Voyage, Desert Epic, Ancient Battle, Quiet Tension, Impacts and Risers | [`cinematic-synth-scores.patchkamer-tunes.json`](cinematic-synth-scores.patchkamer-tunes.json) | – |
| [Cross Mod Mono](../devices/synths/CrossModMono/) | Cross Mod Mono Styles | 63 | 12: Techno, Acid, House, Trance, Ambient, Synthwave, Electro, Drum & Bass, Dub, Hip-hop, Chiptune, Funk & Disco | [`cross-mod-mono-styles.patchkamer-tunes.json`](cross-mod-mono-styles.patchkamer-tunes.json) | – |
| [Dissonant Cluster](../devices/synths/DissonantCluster/) | Dissonant Cluster Styles | 60 | 9: Industrial, Horror & Cinematic, Dark Ambient, Techno, Experimental, Sound Design, Noise, Dubstep, Drone | [`dissonant-cluster-styles.patchkamer-tunes.json`](dissonant-cluster-styles.patchkamer-tunes.json) | – |
| [Drone Synth](../devices/synths/DroneSynth/) | Drone Synth Styles | 66 | 10: Drone, Ambient, Dark Ambient, Techno, Industrial, Cinematic, Meditation, Sci-Fi, Doom, Minimal | [`drone-synth-styles.patchkamer-tunes.json`](drone-synth-styles.patchkamer-tunes.json) | – |
| [Duofone](../devices/synths/Duofone/) | Duofone Styles | 60 | 12: Techno, House, Trance, Ambient, Drum & Bass, Dubstep, Synthwave, Funk & Disco, Hip-hop, Electro, Pop, Chiptune | [`duofone-styles.patchkamer-tunes.json`](duofone-styles.patchkamer-tunes.json) | – |
| [Formant Singer](../devices/synths/FormantSinger/) | Formant Singer Styles | 66 | 12: Choir, Solo Voices, Bass Voices, Whisper and Breath, Pads and Ambient, Cinematic, Pop Leads, Robot and FX, Chant, Lullaby, Hymn, Syllable Study | [`formant-singer-styles.patchkamer-tunes.json`](formant-singer-styles.patchkamer-tunes.json) | – |
| [Foundry](../devices/synths/Foundry/) | Foundry Styles | 69 | 11: Industrial, Techno, Dark Ambient, Cinematic, Sound Design, Horror, Experimental, Noise, Drone, Metal Percussion, Electro | [`foundry-styles.patchkamer-tunes.json`](foundry-styles.patchkamer-tunes.json) | – |
| [Four-Operator FM](../devices/synths/FourOperatorFM/) | Four-Operator FM Styles | 67 | 11: Synthwave, Electro, Pop, Chiptune, Jazz & Soul, Ambient, Cinematic, Techno & House, Drum & Bass, Hip-hop & Lo-fi, Funk & Disco | [`four-operator-fm-styles.patchkamer-tunes.json`](four-operator-fm-styles.patchkamer-tunes.json) | – |
| [Grain Cloud](../devices/synths/GrainCloud/) | Grain Cloud Styles | 61 | 10: Ambient, Dark Ambient, Cinematic, Meditation, Sci-Fi, Experimental, Glitch/IDM, Lo-fi, Drone, Sound Design | [`grain-cloud-styles.patchkamer-tunes.json`](grain-cloud-styles.patchkamer-tunes.json) | – |
| [Guitar](../devices/synths/Guitar/) | Guitar | 40 | 11: Acoustic, Nylon, 12-String, Clean, Crunch, Muted, Bass, Strum, Ambient, Funk, Rock | [`guitar.patchkamer-tunes.json`](guitar.patchkamer-tunes.json) | – |
| [Karplus String](../devices/synths/KarplusString/) | Karplus String Styles | 60 | 10: Folk, Ambient, Cinematic, Pop, World, Lo-fi, Ballad, Flamenco, Jazz, Metallic | [`karplus-string-styles.patchkamer-tunes.json`](karplus-string-styles.patchkamer-tunes.json) | – |
| [Ladder Mono](../devices/synths/LadderMono/) | Ladder Mono Classics | 58 | 7: Bass, Lead, Brass and Strings, Plucks and Keys, Sequences, Effects, Percussion | [`ladder-mono-classics.patchkamer-tunes.json`](ladder-mono-classics.patchkamer-tunes.json) | – |
| [Layered Landscape](../devices/synths/LayeredLandscape/) | Layered Landscape Styles | 71 | 11: Ambient, Dark Ambient, Cinematic, Meditation, Sci-Fi, Nature, Space, Drone, Lo-fi, Minimal, Industrial | [`layered-landscape-styles.patchkamer-tunes.json`](layered-landscape-styles.patchkamer-tunes.json) | – |
| [Low Bass](../devices/synths/LowBass/) | Low Bass Styles | 64 | 13: Sub, Rolling Bass, Detuned Wide, Dub, Booming Sub, Acid, Funk, Drum & Bass, Dubstep, Garage, Trap, Synthwave, Techno & House | [`low-bass-styles.patchkamer-tunes.json`](low-bass-styles.patchkamer-tunes.json) | – |
| [Mist](../devices/synths/Mist/) | Mist Styles | 62 | 11: Ambient, Dark Ambient, Cinematic, Meditation, Sci-Fi, Experimental, Lo-fi, Drone, Sound Design, New Age, Chillout | [`mist-styles.patchkamer-tunes.json`](mist-styles.patchkamer-tunes.json) | – |
| [Paradox](../devices/synths/Paradox/) | Paradox Styles | 70 | 10: Drone, Ambient, Dark Ambient, Cinematic, Sci-Fi, Glitch, Industrial, Experimental, Sound Design, Noise | [`paradox-styles.patchkamer-tunes.json`](paradox-styles.patchkamer-tunes.json) | – |
| [Patch Mono](../devices/synths/PatchMono/) | Patch Mono Styles | 79 | 14: Techno, Acid, Dubstep, Drum & Bass, Hip-hop, Dub, Synthwave, Ambient, Electro, Funk & Disco, Trance, Chiptune, Patch Routes, External Input | [`patch-mono-styles.patchkamer-tunes.json`](patch-mono-styles.patchkamer-tunes.json) | – |
| [Patchbay Synth](../devices/synths/PatchbaySynth/) | Patchbay Synth Styles | 89 | 15: Techno, Acid, House, Synthwave, Ambient, Cinematic, Electro, Hip-hop, Dub, Funk & Disco, Trance, Chiptune, Drum & Bass, Generative, FX | [`patchbay-synth-styles.patchkamer-tunes.json`](patchbay-synth-styles.patchkamer-tunes.json) | – |
| [Piano](../devices/synths/Piano/) | Piano | 43 | 11: Grand, Upright, Honky-tonk, Tine, Reed, Clavichord, Layered, Ballad, Pop, Jazz, Lo-fi | [`piano.patchkamer-tunes.json`](piano.patchkamer-tunes.json) | – |
| [Poly Chorus](../devices/synths/PolyChorus/) | Poly Chorus Styles | 72 | 12: Synthwave, Ambient, Cinematic, Pop, Trance, House, Deep House, Funk & Disco, Soul, Electro, Lo-fi, Techno | [`poly-chorus-styles.patchkamer-tunes.json`](poly-chorus-styles.patchkamer-tunes.json) | – |
| [Stage Keys](../devices/synths/StageKeys/) | Stage Keys Styles | 66 | 11: Soul, Funk, Jazz, Pop, Gospel, Rock, Disco, House, Lo-fi, Reggae, Ballad | [`stage-keys-styles.patchkamer-tunes.json`](stage-keys-styles.patchkamer-tunes.json) | – |
| [Sub Line](../devices/synths/SubLine/) | Sub Line Styles | 68 | 10: Techno, House, Deep House, Acid, Electro, Synthwave, Hip-hop, Dub, Drum & Bass, Trance | [`subline-styles.patchkamer-tunes.json`](subline-styles.patchkamer-tunes.json) | – |
| [Supersaw Swarm](../devices/synths/SupersawSwarm/) | Supersaw Swarm Styles | 61 | 10: Trance, Hardstyle, Progressive, Big Room, Synthwave, Pop, Future Bass, Eurodance, Ambient, Cinematic | [`supersaw-swarm-styles.patchkamer-tunes.json`](supersaw-swarm-styles.patchkamer-tunes.json) | – |
| [Triple Osc Poly](../devices/synths/TripleOscPoly/) | Triple Osc Poly Styles | 73 | 12: Trance, House, Pop, Synthwave, Ambient, Cinematic, Future Bass, Funk, Disco, Electro, Techno, Lo-fi | [`triple-osc-poly-styles.patchkamer-tunes.json`](triple-osc-poly-styles.patchkamer-tunes.json) | – |
| [Woodwinds](../devices/synths/Woodwinds/) | Woodwinds | 42 | 12: Flute, Clarinet, Oboe, Bassoon, Sax, Recorder, Pan Flute, Section, Ballad, Jazz, Folk, Ambient | [`woodwinds.patchkamer-tunes.json`](woodwinds.patchkamer-tunes.json) | – |

Samen 42 packs met 2507 tunes.
<!-- list-devices:end tunes -->

## Wat je niet doet

- Wijzig het apparaat niet om je tune te laten kloppen. Verander nooit `id` of `kind` van een apparaat, daaraan hangen de tunes van gebruikers.
- Commit of push niet, tenzij de opdracht dat vraagt.
