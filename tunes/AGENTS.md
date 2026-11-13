# AGENTS.md: tunes/

Dit bestand is voor AI-agents die tunes maken voor Patchkamer-apparaten. Het is niet geschreven voor mensen. Het hoort bij de algemene instructies in `../AGENTS.md`; lees die eerst.

## Plaats in de boom

Omhoog: de [root AGENTS.md](../AGENTS.md). Omlaag, de soorten die tunes hebben: [synths](../devices/synths/AGENTS.md), [samplers](../devices/samplers/AGENTS.md) en [drums](../devices/drums/AGENTS.md); elk heeft een tabel met de `AGENTS.md` van elk apparaat, waar de velden en bereiken van zijn `state` staan. Opzij: [presets/AGENTS.md](../presets/AGENTS.md) (voor de overige apparaten), [songs/AGENTS.md](../songs/AGENTS.md) en [devices/AGENTS.md](../devices/AGENTS.md).

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
| [Acoustic Drums](../devices/drums/AcousticDrums/) | Acoustic Drums Styles | 40 | 4: Funk, Soul, Jazz, Studio | [`acoustic-drums-styles.patchkamer-tunes.json`](acoustic-drums-styles.patchkamer-tunes.json) | – |
| [Click Synth](../devices/drums/ClickSynth/) | Click Synth Styles | 40 | 17: Minimal Techno, Microhouse, Techno, Glitch, Electro, Breakbeat, Ambient, Industrial, Dub Techno, Acid, Tech Step, Liquid DnB, Dancefloor DnB, Neurofunk, Jump Up, Jungle, Halftime DnB | [`click-synth-styles.patchkamer-tunes.json`](click-synth-styles.patchkamer-tunes.json) | – |
| [Drum Kit](../devices/drums/DrumKit/) | Drum Kit Styles | 50 | 19: Techno, House, Trance, Drum & Bass, Dubstep, Hip-hop, Funk & disco, Electro, Pop, Rock, Jazz, Synthwave, Tech Step, Liquid DnB, Dancefloor DnB, Neurofunk, Jump Up, Jungle, Halftime DnB | [`drum-kit-styles.patchkamer-tunes.json`](drum-kit-styles.patchkamer-tunes.json) | – |
| [Drum Machine](../devices/drums/DrumMachine/) | Drum Machine Styles | 47 | 19: Techno, House, Trance, Drum & Bass, Dubstep, Hip-hop, Funk & disco, Electro, Pop, Rock, Jazz, Synthwave, Tech Step, Liquid DnB, Dancefloor DnB, Neurofunk, Jump Up, Jungle, Halftime DnB | [`drum-machine-styles.patchkamer-tunes.json`](drum-machine-styles.patchkamer-tunes.json) | – |
| [Groovebox 12](../devices/drums/Groovebox12/) | Groovebox 12 Styles | 51 | 19: Techno, House, Trance, Drum & Bass, Dubstep, Hip-hop, Funk & disco, Electro, Pop, Rock, Jazz, Synthwave, Tech Step, Liquid DnB, Dancefloor DnB, Neurofunk, Jump Up, Jungle, Halftime DnB | [`groovebox-12-styles.patchkamer-tunes.json`](groovebox-12-styles.patchkamer-tunes.json) | – |
| [Latin Percussion](../devices/drums/LatinPercussion/) | Latin Percussion Styles | 39 | 13: Salsa, Son, Mambo, Cha-Cha-Cha, Rumba, Bossa Nova, Samba, Merengue, Bachata, Cumbia, Reggaeton, Latin Jazz, Latin Soul | [`latin-percussion-styles.patchkamer-tunes.json`](latin-percussion-styles.patchkamer-tunes.json) | – |
| [Pulse Drums](../devices/drums/PulseDrums/) | Pulse Drums Techno | 37 | 14: Techno, Minimal, Peak Time, Hard Techno, Dub Techno, Acid, Electro, Breaks, Tech Step, Dancefloor DnB, Neurofunk, Jungle, Halftime DnB, Jump Up | [`pulse-drums-techno.patchkamer-tunes.json`](pulse-drums-techno.patchkamer-tunes.json) | – |
| [Loop Slicer](../devices/samplers/LoopSlicer/) | Loop Slicer Break Chops | 20 | 1: Amen Chops | [`loop-slicer-break-chops.patchkamer-tunes.json`](loop-slicer-break-chops.patchkamer-tunes.json) | – |
| [Loop Slicer](../devices/samplers/LoopSlicer/) | Loop Slicer Styles | 80 | 19: House, Techno, Breakbeat, Drum and Bass, Hip-hop, Trap, Funk, Dub, Cinematic, Glitch, Pitched Hits, Own Loop, Tech Step, Liquid DnB, Dancefloor DnB, Neurofunk, Jump Up, Jungle, Halftime DnB | [`loop-slicer-styles.patchkamer-tunes.json`](loop-slicer-styles.patchkamer-tunes.json) | – |
| [Pad Sampler](../devices/samplers/PadSampler/) | Pad Sampler Demos | 25 | 4: Kits, Keygroups, Drum and Bass Kits, Drum and Bass Keygroups | [`pad-sampler-demos.patchkamer-tunes.json`](pad-sampler-demos.patchkamer-tunes.json) | – |
| [Samplebank](../devices/samplers/Samplebank/) | Samplebank Styles | 88 | 24: Techno, House, Trance, Ambient, Synthwave, Hip-hop, Lo-fi, Trap, Drum & Bass, Dubstep, Electro, Pop, Chiptune, Funk & Disco, Dub, Cinematic, Tech Step, Liquid DnB, Dancefloor DnB, Neurofunk, Jump Up, Jungle, Halftime DnB, Drops and FX | [`samplebank-styles.patchkamer-tunes.json`](samplebank-styles.patchkamer-tunes.json) | – |
| [Acid Baselines](../devices/synths/AcidBaselines/) | Acid Baselines Classics | 65 | 15: Chicago Origins, Frankfurt Rolling, Minimal Acid, Squelch Anthems, Acid Techno, Acid Trance, Electro Acid, Deep Acid, AIcid, Neurofunk, Detune Stack, Liquid, Dancefloor DnB, Jump Up, Jungle | [`acid-baselines-classics.patchkamer-tunes.json`](acid-baselines-classics.patchkamer-tunes.json) | – |
| [Acid Stepper](../devices/synths/AcidStepper/) | Acid Stepper Styles | 65 | 12: Acid, Techno, House, Deep House, Electro, Trance, Breakbeat, Hip-hop, Synthwave, Dub, Industrial, Garage | [`acid-stepper-styles.patchkamer-tunes.json`](acid-stepper-styles.patchkamer-tunes.json) | – |
| [Basic Mono](../devices/synths/BasicMono/) | Basic Mono Styles | 89 | 19: Techno, House, Electro, Hip-hop, Funk, Synthwave, Dub, Pop, Chiptune, Acid, Trance, Ambient, DnB Sub, Neurofunk, Liquid, Dancefloor DnB, Jump Up, Jungle, DnB Leads | [`basic-mono-styles.patchkamer-tunes.json`](basic-mono-styles.patchkamer-tunes.json) | – |
| [Biotope](../devices/synths/Biotope/) | Biotope Styles | 95 | 15: Nature, Weather, Water, Ambient, Meditation, Sleep, Cinematic, Sci-Fi, Dark Ambient, Lo-fi, Field Recording, Interiors, Rhythmic, Neurofunk Atmospheres, Intro and Break Textures | [`biotope-styles.patchkamer-tunes.json`](biotope-styles.patchkamer-tunes.json) | – |
| [Bowed Ensemble](../devices/synths/BowedEnsemble/) | Bowed Ensemble Styles | 75 | 15: Cinematic, Ambient, Pop, Ballad, Trance, Synthwave, Film Score, Lo-fi, Neo-classical, Disco & Funk, Deep House, Liquid DnB, Dancefloor DnB, Neuro Pads, Jungle | [`bowed-ensemble-styles.patchkamer-tunes.json`](bowed-ensemble-styles.patchkamer-tunes.json) | – |
| [Brass Section](../devices/synths/BrassSection/) | Brass Section | 40 | 11: Trumpet, Trombone, Horn, Section, Stabs, Swells, Funk, Ballad, Dancefloor DnB, Liquid DnB, Jungle | [`brass-section.patchkamer-tunes.json`](brass-section.patchkamer-tunes.json) | – |
| [Brass Studio](../devices/synths/BrassStudio/) | Brass Studio Styles | 45 | 7: Trumpet, Muted Trumpet, Flugelhorn, Trombone, French Horn, Tuba, Section | [`brass-studio-styles.patchkamer-tunes.json`](brass-studio-styles.patchkamer-tunes.json) | – |
| [Celestial Mechanics](../devices/synths/CelestialMechanics/) | Celestial Mechanics Styles | 85 | 15: Space, Cinematic, Sci-Fi, Ambient, Dark Ambient, Experimental, Sound Design, Synthwave, Trance, Horror, Drone, Neurofunk Atmospheres, Dark Liquid Pads, DnB Risers and Impacts, Intro and Break Textures | [`celestial-mechanics-styles.patchkamer-tunes.json`](celestial-mechanics-styles.patchkamer-tunes.json) | – |
| [Chord Poly](../devices/synths/ChordPoly/) | Chord Poly Styles | 132 | 24: House, Deep House, Garage, Lo-fi, Ambient, Pop, Soul, Synthwave, Cinematic, Disco & Funk, Techno, Dub Techno, Trance, Progressive Trance, Big Room, Electro House, Electro, Future Bass, Hardstyle, Eurodance, Dancefloor DnB, Liquid DnB, Neuro Pads, Jungle | [`chord-poly-styles.patchkamer-tunes.json`](chord-poly-styles.patchkamer-tunes.json) | – |
| [Cinematic Synth](../devices/synths/CinematicSynth/) | Cinematic Synth Scores | 67 | 11: Dream Heist, Dark Hero, Space Voyage, Desert Epic, Ancient Battle, Quiet Tension, Impacts and Risers, Neurofunk Atmospheres, Dark Liquid Pads, DnB Risers and Impacts, Intro and Break Textures | [`cinematic-synth-scores.patchkamer-tunes.json`](cinematic-synth-scores.patchkamer-tunes.json) | – |
| [Cross Mod Mono](../devices/synths/CrossModMono/) | Cross Mod Mono Styles | 94 | 19: Techno, Acid, House, Trance, Ambient, Synthwave, Electro, Drum & Bass, Neurofunk, Detune Stack, Liquid, Dancefloor DnB, Jump Up, Jungle, DnB Leads, Dub, Hip-hop, Chiptune, Funk & Disco | [`cross-mod-mono-styles.patchkamer-tunes.json`](cross-mod-mono-styles.patchkamer-tunes.json) | – |
| [Dissonant Cluster](../devices/synths/DissonantCluster/) | Dissonant Cluster Styles | 70 | 13: Industrial, Horror & Cinematic, Dark Ambient, Techno, Experimental, Sound Design, Noise, Dubstep, Drone, Neurofunk Atmospheres, Dark Liquid Pads, DnB Risers and Impacts, Intro and Break Textures | [`dissonant-cluster-styles.patchkamer-tunes.json`](dissonant-cluster-styles.patchkamer-tunes.json) | – |
| [Drawbar Organ](../devices/synths/DrawbarOrgan/) | Drawbar Organ Styles | 88 | 10: Jazz, Soul, Funk, Gospel, Blues, Ballad, Percussive, Rotary Variations, Combo, Bass Split | [`drawbar-organ-styles.patchkamer-tunes.json`](drawbar-organ-styles.patchkamer-tunes.json) | – |
| [Drone Synth](../devices/synths/DroneSynth/) | Drone Synth Styles | 78 | 14: Drone, Ambient, Dark Ambient, Techno, Industrial, Cinematic, Meditation, Sci-Fi, Doom, Minimal, Neurofunk Atmospheres, Dark Liquid Pads, DnB Risers and Impacts, Intro and Break Textures | [`drone-synth-styles.patchkamer-tunes.json`](drone-synth-styles.patchkamer-tunes.json) | – |
| [Duofone](../devices/synths/Duofone/) | Duofone Styles | 91 | 19: Techno, House, Trance, Ambient, Drum & Bass, Neurofunk, Detune Stack, Liquid, Dancefloor DnB, Jump Up, Jungle, DnB Leads, Dubstep, Synthwave, Funk & Disco, Hip-hop, Electro, Pop, Chiptune | [`duofone-styles.patchkamer-tunes.json`](duofone-styles.patchkamer-tunes.json) | – |
| [Formant Singer](../devices/synths/FormantSinger/) | Formant Singer Styles | 76 | 16: Choir, Solo Voices, Bass Voices, Whisper and Breath, Pads and Ambient, Cinematic, Pop Leads, Robot and FX, Chant, Lullaby, Hymn, Syllable Study, Liquid DnB, Dancefloor DnB, Neuro Pads, Jungle | [`formant-singer-styles.patchkamer-tunes.json`](formant-singer-styles.patchkamer-tunes.json) | – |
| [Foundry](../devices/synths/Foundry/) | Foundry Styles | 81 | 14: Industrial, Techno, Dark Ambient, Cinematic, Sound Design, Horror, Experimental, Noise, Drone, Metal Percussion, Electro, Neurofunk Atmospheres, Tech-step Hits, DnB Risers and Impacts | [`foundry-styles.patchkamer-tunes.json`](foundry-styles.patchkamer-tunes.json) | – |
| [Four-Operator FM](../devices/synths/FourOperatorFM/) | Four-Operator FM Styles | 99 | 18: Synthwave, Electro, Pop, Chiptune, Jazz & Soul, Ambient, Cinematic, Techno & House, Drum & Bass, Neurofunk, Detune Stack, Liquid, Dancefloor DnB, Jump Up, Jungle, DnB Leads, Hip-hop & Lo-fi, Funk & Disco | [`four-operator-fm-styles.patchkamer-tunes.json`](four-operator-fm-styles.patchkamer-tunes.json) | – |
| [Funk Bass](../devices/synths/FunkBass/) | Funk Bass Styles | 26 | 9: Motown, Funk, Slap, Jazz, Disco, Soul, Dub, Rock, Basics | [`funk-bass-styles.patchkamer-tunes.json`](funk-bass-styles.patchkamer-tunes.json) | – |
| [Grain Cloud](../devices/synths/GrainCloud/) | Grain Cloud Styles | 73 | 14: Ambient, Dark Ambient, Cinematic, Meditation, Sci-Fi, Experimental, Glitch/IDM, Lo-fi, Drone, Sound Design, Neurofunk Atmospheres, Dark Liquid Pads, DnB Risers and Impacts, Intro and Break Textures | [`grain-cloud-styles.patchkamer-tunes.json`](grain-cloud-styles.patchkamer-tunes.json) | – |
| [Guitar](../devices/synths/Guitar/) | Guitar | 51 | 14: Acoustic, Nylon, 12-String, Clean, Crunch, Muted, Bass, Strum, Ambient, Funk, Rock, Liquid DnB, Dancefloor DnB, Jungle | [`guitar.patchkamer-tunes.json`](guitar.patchkamer-tunes.json) | – |
| [Karplus String](../devices/synths/KarplusString/) | Karplus String Styles | 70 | 14: Folk, Ambient, Cinematic, Pop, World, Lo-fi, Ballad, Flamenco, Jazz, Metallic, Liquid DnB, Dancefloor DnB, Neuro Pads, Jungle | [`karplus-string-styles.patchkamer-tunes.json`](karplus-string-styles.patchkamer-tunes.json) | – |
| [Ladder Mono](../devices/synths/LadderMono/) | Ladder Mono Classics | 86 | 14: Bass, Lead, Brass and Strings, Plucks and Keys, Sequences, Effects, Percussion, Neurofunk, Detune Stack, Liquid, Dancefloor DnB, Jump Up, Jungle, DnB Leads | [`ladder-mono-classics.patchkamer-tunes.json`](ladder-mono-classics.patchkamer-tunes.json) | – |
| [Layered Landscape](../devices/synths/LayeredLandscape/) | Layered Landscape Styles | 82 | 15: Ambient, Dark Ambient, Cinematic, Meditation, Sci-Fi, Nature, Space, Drone, Lo-fi, Minimal, Industrial, Neurofunk Atmospheres, Dark Liquid Pads, Intro and Break Textures, DnB Risers and Impacts | [`layered-landscape-styles.patchkamer-tunes.json`](layered-landscape-styles.patchkamer-tunes.json) | – |
| [Low Bass](../devices/synths/LowBass/) | Low Bass Styles | 92 | 19: Sub, Rolling Bass, Detuned Wide, Dub, Booming Sub, Acid, Funk, Drum & Bass, Neurofunk, Detune Stack, Liquid, Dancefloor DnB, Jump Up, Jungle, Dubstep, Garage, Trap, Synthwave, Techno & House | [`low-bass-styles.patchkamer-tunes.json`](low-bass-styles.patchkamer-tunes.json) | – |
| [Mist](../devices/synths/Mist/) | Mist Styles | 73 | 15: Ambient, Dark Ambient, Cinematic, Meditation, Sci-Fi, Experimental, Lo-fi, Drone, Sound Design, New Age, Chillout, Neurofunk Atmospheres, Dark Liquid Pads, Intro and Break Textures, DnB Risers and Impacts | [`mist-styles.patchkamer-tunes.json`](mist-styles.patchkamer-tunes.json) | – |
| [Neuro Bass](../devices/synths/NeuroBass/) | Neuro Bass Styles | 70 | 9: Neurofunk, Detune Stack, Liquid, Jump Up, Dancefloor, Sub, Dubstep and Bass Music, Techno, Stabs and Hits | [`neuro-bass-styles.patchkamer-tunes.json`](neuro-bass-styles.patchkamer-tunes.json) | – |
| [Paradox](../devices/synths/Paradox/) | Paradox Styles | 80 | 13: Drone, Ambient, Dark Ambient, Cinematic, Sci-Fi, Glitch, Industrial, Experimental, Sound Design, Noise, Neurofunk Atmospheres, Intro and Break Textures, DnB Risers and Impacts | [`paradox-styles.patchkamer-tunes.json`](paradox-styles.patchkamer-tunes.json) | – |
| [Patch Mono](../devices/synths/PatchMono/) | Patch Mono Styles | 110 | 21: Techno, Acid, Dubstep, Drum & Bass, Neurofunk, Detune Stack, Liquid, Dancefloor DnB, Jump Up, Jungle, DnB Leads, Hip-hop, Dub, Synthwave, Ambient, Electro, Funk & Disco, Trance, Chiptune, Patch Routes, External Input | [`patch-mono-styles.patchkamer-tunes.json`](patch-mono-styles.patchkamer-tunes.json) | – |
| [Patchbay Synth](../devices/synths/PatchbaySynth/) | Patchbay Synth Styles | 118 | 22: Techno, Acid, House, Synthwave, Ambient, Cinematic, Electro, Hip-hop, Dub, Funk & Disco, Trance, Chiptune, Drum & Bass, Neurofunk, Detune Stack, Liquid, Dancefloor DnB, Jump Up, Jungle, DnB Leads, Generative, FX | [`patchbay-synth-styles.patchkamer-tunes.json`](patchbay-synth-styles.patchkamer-tunes.json) | – |
| [Piano](../devices/synths/Piano/) | Piano | 55 | 14: Grand, Upright, Honky-tonk, Tine, Reed, Clavichord, Layered, Ballad, Pop, Jazz, Lo-fi, Liquid DnB, DnB Keys, Jungle | [`piano.patchkamer-tunes.json`](piano.patchkamer-tunes.json) | – |
| [Poly Chorus](../devices/synths/PolyChorus/) | Poly Chorus Styles | 83 | 16: Synthwave, Ambient, Cinematic, Pop, Trance, House, Deep House, Funk & Disco, Soul, Electro, Lo-fi, Techno, Dancefloor DnB, Liquid DnB, Neuro Pads, Jungle | [`poly-chorus-styles.patchkamer-tunes.json`](poly-chorus-styles.patchkamer-tunes.json) | – |
| [Sax Studio](../devices/synths/SaxStudio/) | Sax Studio Styles | 36 | 9: Jazz Ballad, Bebop, Soul and Funk, Smooth, Rock and Roll Honk, Subtone Ballad, Growler, Section Stabs, Clean | [`sax-studio-styles.patchkamer-tunes.json`](sax-studio-styles.patchkamer-tunes.json) | – |
| [Squelch Box](../devices/synths/SquelchBox/) | Squelch Box Styles | 31 | 8: Acid House, Acid Techno, Electro, Trance, House, Minimal, Deep Acid, Breakbeat | [`squelch-box-styles.patchkamer-tunes.json`](squelch-box-styles.patchkamer-tunes.json) | – |
| [Stage Keys](../devices/synths/StageKeys/) | Stage Keys Styles | 78 | 14: Soul, Funk, Jazz, Pop, Gospel, Rock, Disco, House, Lo-fi, Reggae, Ballad, Liquid DnB, Dancefloor DnB, Jungle | [`stage-keys-styles.patchkamer-tunes.json`](stage-keys-styles.patchkamer-tunes.json) | – |
| [Sub Line](../devices/synths/SubLine/) | Sub Line Styles | 97 | 17: Techno, House, Deep House, Acid, Electro, Synthwave, Hip-hop, Dub, Drum & Bass, Neurofunk, Phase Stack, Liquid, Dancefloor DnB, Jump Up, Jungle, DnB Leads, Trance | [`subline-styles.patchkamer-tunes.json`](subline-styles.patchkamer-tunes.json) | – |
| [Supersaw Swarm](../devices/synths/SupersawSwarm/) | Supersaw Swarm Styles | 73 | 14: Trance, Hardstyle, Progressive, Big Room, Synthwave, Pop, Future Bass, Eurodance, Ambient, Cinematic, Dancefloor DnB, Liquid DnB, Neuro DnB, Jungle | [`supersaw-swarm-styles.patchkamer-tunes.json`](supersaw-swarm-styles.patchkamer-tunes.json) | – |
| [Triple Osc Poly](../devices/synths/TripleOscPoly/) | Triple Osc Poly Styles | 84 | 16: Trance, House, Pop, Synthwave, Ambient, Cinematic, Future Bass, Funk, Disco, Electro, Techno, Lo-fi, Dancefloor DnB, Liquid DnB, Neuro Pads, Jungle | [`triple-osc-poly-styles.patchkamer-tunes.json`](triple-osc-poly-styles.patchkamer-tunes.json) | – |
| [Woodwinds](../devices/synths/Woodwinds/) | Woodwinds | 52 | 15: Flute, Clarinet, Oboe, Bassoon, Sax, Recorder, Pan Flute, Section, Ballad, Jazz, Folk, Ambient, Liquid DnB, Dancefloor DnB, Jungle | [`woodwinds.patchkamer-tunes.json`](woodwinds.patchkamer-tunes.json) | – |

Samen 50 packs met 3472 tunes.
<!-- list-devices:end tunes -->

## Wat je niet doet

- Wijzig het apparaat niet om je tune te laten kloppen. Verander nooit `id` of `kind` van een apparaat, daaraan hangen de tunes van gebruikers.
- Commit of push niet, tenzij de opdracht dat vraagt.

## Versies

Elk pack heeft een `version` op het hoogste niveau (`"version": "1.0.0"`, SemVer, contract v1.27): PATCH voor een verbeterde tune of tekst, MINOR voor nieuwe tunes, MAJOR voor verwijderde of hernoemde tunes (bewaarde songs kunnen ernaar verwijzen). Het is niet de `version` bij een losse tune: die is de apparaatversie waarvoor hij is gemaakt. Een gewijzigd pack is voor de host een wijziging: verhoog `patchkamer/version.json` en zet een regel in beide changelogs. Een nieuw pack begint op `1.0.0`. Draai `python3 docs/tools/check-versions.py`. Alle regels: [root `AGENTS.md`, Regel 2](../AGENTS.md#regel-2-elke-wijziging-krijgt-een-nieuw-versienummer-semver).
