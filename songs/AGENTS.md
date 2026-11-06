# AGENTS.md: een song componeren voor Patchkamer

Dit bestand is voor AI-agents die een **song** componeren voor Patchkamer. Het is niet geschreven voor mensen en het is het toegangspunt: met dit bestand en de bestanden waar het naar verwijst kun je zelf een song maken uit de meegeleverde apparaten, tunes en presets. Het is geen verplichting, het maakt het makkelijker. Wil je een **apparaat** bouwen, lees dan `../AGENTS.md`.

Licenties: een song is `CC-BY-4.0`, tunes en presets `CC0-1.0`, apparaten `AGPL-3.0-or-later`. Je kunt niet luisteren. Alles wat je over een song zegt, is gemeten of op papier gecontroleerd, nooit gehoord.

## Inhoud

1. [Wat een song is](#1-wat-een-song-is)
2. [Het bestandsformaat](#2-het-bestandsformaat)
3. [Een minimaal voorbeeld](#3-een-minimaal-voorbeeld)
4. [Werkwijze, stap voor stap](#4-werkwijze-stap-voor-stap)
5. [Songstructuur en lengtes in maten](#5-songstructuur-en-lengtes-in-maten)
6. [Stijlen op hoofdlijnen](#6-stijlen-op-hoofdlijnen)
7. [Regels](#7-regels)
8. [Veelgemaakte fouten en hun controle](#8-veelgemaakte-fouten-en-hun-controle)
9. [Opdrachtsjabloon voor gebruikers](#9-opdrachtsjabloon-voor-gebruikers)
10. [Links](#10-links)

## 1. Wat een song is

Een song is **een bestand** `<titel>.patchkamer-song.json` met een werkruimte erin: de apparaten op de vloer, hun instellingen (`state`), de kabels ertussen, het tempo en de swing. Het is geen audio. Als iemand het opent en op **Start** drukt, spelen de sequencers en drumcomputers hun noten en patronen mee met de klok van de studio.

- Je maakt een song dus door een **JSON-bestand te schrijven**. Je hoeft de host niet te bedienen.
- De song bevat de `state` van elk apparaat, niet de tune of preset zelf. Je kopieert de state uit het pack (stap 5) en het bestand is dan zelfstandig.
- Voorbeelden die in dit formaat zijn gebouwd en gemeten: [example-house](example-house.patchkamer-song.json), [example-ambient](example-ambient.patchkamer-song.json) en [example-hip-hop](example-hip-hop.patchkamer-song.json).
- De apparaten moeten bij de gebruiker in de bibliotheek staan (de meegeleverde bibliotheek van deze repo is genoeg). De voorbeelden hebben `defs: []`: ze bevatten geen apparaatcode. Zoekt de host een apparaat dat niet in de bibliotheek staat, dan meldt hij het als ontbrekend. Een export uit de host ("Exporteer als song…") bevat wel alle apparaatcode.

## 2. Het bestandsformaat

Gecontroleerd in `../patchkamer/patchkamer.html` (`songExportDialog`, `workspaceState`, `patchState`, `openWorkspace`, `loadPatch`) en met het controlescript.

Bovenste niveau:

| Veld | Wat | Regels |
|---|---|---|
| `format` | altijd `"patchkamer-song"` | verplicht |
| `formatVersion` | altijd `1` | |
| `title` | titel, **Engels** | de host kapt af op 80 tekens |
| `author` | maker | 60 tekens; zie [regels](#7-regels) |
| `license` | `"CC-BY-4.0"` | 64 tekens |
| `description` | korte omschrijving | de host kapt af op 400 tekens |
| `created` | ISO-tijd, bijvoorbeeld `"2026-11-05T00:00:00.000Z"` | |
| `patchkamer` | contractversie waarvoor je bouwde, nu `"1.13"` | controleer met `head -1 ../contract/PATCHKAMER-CONTRACT_NL.md` |
| `basedOn` | optioneel: `{ title, author, license }` van het werk waarop je voortbouwt | alleen als dat waar is |
| `workspace` | de werkruimte (hieronder) | verplicht, met een lijst `devices` |

`workspace`:

| Veld | Wat | Regels |
|---|---|---|
| `format` | `"patchkamer-werkruimte"` | |
| `formatVersion` | `1` | |
| `name` | naam van de werkruimte, gelijk aan de titel | de host gebruikt de `title` van de song |
| `defs`, `sources` | `[]` | geen eigen apparaatcode |
| `bpm` | tempo | 40 tot 200, standaard 126 |
| `swing` | swing van de klok | 0 tot 0,5, standaard 0,08 |
| `view` | `{ "x": 0, "y": 0, "scale": 1 }` | alleen de weergave |
| `views` | `[{ "name": "Drums", "x": 0, "y": 0, "scale": 1 }]` | optioneel: camerastanden, hoogstens 30; `x`, `y` is het midden van de uitsnede, `scale` relatief aan de schermschaal |
| `layouts` | `{ "compact": { "<id>": { "x": 0, "y": 0, "w": null, "h": null, "mini": false } } }` | optioneel: compacte indeling voor kleine schermen; de gewone velden van `devices` blijven de brede indeling |
| `devices` | lijst van apparaten | zie hieronder |
| `cables` | lijst van kabels | zie hieronder |

Een apparaat in `devices`: `{ "id": "d1", "def": "<apparaat-id>", "version": "<versie>", "x": 0, "y": 0, "state": { … } }`.

- `id` is de naam van dit exemplaar (`d1`, `d2`, …); de kabels verwijzen ernaar. Kies ze uniek.
- `def` is de `id` uit de tabel in [../devices/AGENTS.md](../devices/AGENTS.md) (bijvoorbeeld `nl.patchkamer.speakers`). `version` is de versie in het apparaatbestand in `../devices/`; staat er een andere versie dan in de bibliotheek, dan gebruikt de host de nieuwste en meldt dat. Lees de versie uit het bestand: `grep -m1 "version:" ../devices/<soort>/<Naam>/<naam>.patchkamer-device.js`.
- `x`, `y` is de plek op de vloer in pixels. Een kaart is ongeveer 300 breed; zet de apparaten van links naar rechts in signaalrichting, ruim uit elkaar (bijvoorbeeld 330 per kolom).
- `w`, `h` (grootte) en `preset` zijn optioneel. **Laat `preset` weg**: de sleutels (`lid`, `pid`) maakt de host zelf bij het importeren van een pack en ze verschillen per browser.
- `state` is wat `getState()` van het apparaat teruggeeft. Ontbrekende velden krijgen hun standaard, onbekende worden genegeerd, getallen buiten het bereik worden afgekapt. Verzin geen sleutels.

Een kabel: `{ "from": { "id": "d1", "port": "notes" }, "to": { "id": "d2", "port": "notes" }, "kind": "event" }`.

| `kind` | Wat | Past op |
|---|---|---|
| `audio` | geluid | een audio-uitgang op een audio-ingang |
| `event` | noten, trigs en controllerwaarden met tijd | een event-uitgang (sequencer, keyboard) op een event-ingang (synth, drumcomputer) |
| `mod` | sturing van regelaars (modulators) | `mod uit` op `mod` van het doel |
| `multi` | bundel van audiokanalen met namen | bundel uit (drumcomputer) op bundel in (Mixer) |
| `multievent` | gebeurtenissen van veel sporen in één kabel | sequencer-`tracks` |
| `mastering` | instellingen van mastering-apparaten | alleen Master Director |

`port` is de poort-`id` uit de tabel in [../devices/AGENTS.md](../devices/AGENTS.md), geen weergavenaam. Een uitgang van een soort past alleen op een ingang van dezelfde soort. De host controleert alleen bij `audio`-kabels of de poort bestaat; een `event`-, `mod`- of bundelkabel naar een poort die niet bestaat legt hij gewoon aan, en dan gebeurt er niets. `check-song.py` controleert dat wel.

**De klok.** De song start niet vanzelf: sequencers, drumcomputers met een eigen patroon en arpeggiators spelen alleen zolang de klok loopt. Wie de song opent, drukt op **Start**. Details: [../devices/AGENTS.md](../devices/AGENTS.md#de-klok).

## 3. Een minimaal voorbeeld

De kleinste song die geluid geeft: Step Sequencer, Basic Mono, Speakers. Het is met `../docs/tools/check-song.py` geladen en gemeten (3 apparaten, 2 kabels, piek -3,0 dBFS, geen NaN; niet beluisterd). De lijsten `n` en `vel` hebben de vereiste **64 plaatsen**.

```json
{
 "format": "patchkamer-song",
 "formatVersion": 1,
 "title": "Minimal Bass",
 "author": "Your Name",
 "license": "CC-BY-4.0",
 "description": "The smallest song that makes sound: a step sequencer plays a one-bar bass line on a mono synth.",
 "created": "2026-11-05T00:00:00.000Z",
 "patchkamer": "1.13",
 "workspace": {
  "format": "patchkamer-werkruimte",
  "formatVersion": 1,
  "name": "Minimal Bass",
  "defs": [],
  "sources": [],
  "bpm": 120,
  "swing": 0.08,
  "view": { "x": 0, "y": 0, "scale": 1 },
  "devices": [
   { "id": "d1", "def": "nl.patchkamer.seq", "version": "1.11.0", "x": 0, "y": 0,
     "state": { "len": 16, "res": 16, "gate": 0.5,
       "n":   [45,-1,45,48,-1,45,52,-1,45,-1,43,45,-1,48,-1,52,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
       "vel": [0.95,0,0.6,0.7,0,0.85,0.7,0,0.8,0,0.6,0.7,0,0.6,0,0.7,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0] } },
   { "id": "d2", "def": "nl.patchkamer.mono", "version": "1.11.1", "x": 340, "y": 0,
     "state": { "wave": "sawtooth", "fine": 0, "cut": 200, "res": 3, "env": 0.3, "dec": 0.3, "sub": 0.4, "glide": 0.02, "lvl": 0.59 } },
   { "id": "d3", "def": "nl.patchkamer.speakers", "version": "1.11.0", "x": 680, "y": 0,
     "state": { "lvl": 0.8 } }
  ],
  "cables": [
   { "from": { "id": "d1", "port": "notes" }, "to": { "id": "d2", "port": "notes" }, "kind": "event" },
   { "from": { "id": "d2", "port": "out" }, "to": { "id": "d3", "port": "in" }, "kind": "audio" }
  ]
 }
}
```

De `state` van Basic Mono is de tune `Dusty Bass` uit [basic-mono-styles](../tunes/basic-mono-styles.patchkamer-tunes.json) (map `Hip-hop`), letterlijk gekopieerd. De lijsten `ln`, `acc` en `mt` van de sequencer ontbreken hier en krijgen hun standaard; omdat elke noot een eigen `vel` heeft, doet `acc` niets en zijn alle noten even lang (`gate`). Een song van een agent geeft ze gewoon alle drie met 64 plaatsen. Een groter voorbeeld met mixer, mastering, effecten en structuur: de drie voorbeeldsongs hierboven.

## 4. Werkwijze, stap voor stap

### Stap 1. De opdracht

Haal uit de opdracht: **stijl** (of sfeer), **tempo** (of laat de stijlgids kiezen), **lengte** (in minuten of maten), **instrumenten** die verplicht of verboden zijn, **auteur** en **titel** (zie [regels](#7-regels)). Ontbreekt iets, kies het eenvoudigste dat de stijlgids toestaat en schrijf in je oplevering wat je koos.

### Stap 2. Stijl kiezen en lezen

Kies uit de [tabel](#6-stijlen-op-hoofdlijnen) de stijl die het dichtst bij de opdracht ligt en lees `styles/<stijl>.md` **helemaal**, daarna [MUSIC-THEORY.md](MUSIC-THEORY.md) voor de delen die je nodig hebt (nootnummers, toonladders, akkoorden, ritme, dynamiek, structuur, mixen, de vertaling naar Patchkamer-waarden in [§12](MUSIC-THEORY.md#12-omzetten-naar-patchkamer) en de [controlelijst](MUSIC-THEORY.md#13-controlelijst)). Mengt de opdracht twee stijlen (bijvoorbeeld "ambient met een beat"), lees dan beide gidsen en kies één stijl voor de ritmesectie en één voor de klankkleur.

### Stap 3. Structuur en tempo kiezen

Schrijf eerst op papier: tempo (`bpm`), swing, toonsoort en akkoordprogressie, de secties met hun lengte in maten, en welke rol in welke sectie speelt. Een maat duurt `240 / bpm` seconden. Zie [§5](#5-songstructuur-en-lengtes-in-maten). Houd het klein: 3 tot 6 klankbronnen is genoeg; elke rol heeft een eigen register en taak ([MUSIC-THEORY §10](MUSIC-THEORY.md#10-arrangeren)).

### Stap 4. Devices kiezen

Kies per rol een apparaat uit [../devices/AGENTS.md](../devices/AGENTS.md) (tabellen per soort met `id`, poorten en links) en de sectie "Passende devices, tunes en presets" van de stijlgids. Lees daarna van **elk gekozen apparaat** zijn `AGENTS.md` (staat in de laatste kolom van de tabel): daar staan de state, de bereiken en de valkuilen. Kies de signaalketen in [../devices/AGENTS.md](../devices/AGENTS.md#typische-signaalketens).

Eenvoudige keuzehulp:

| Rol | Klankbron | Noten komen van |
|---|---|---|
| Drums | een drumcomputer met een eigen patroon: [Drum Machine](../devices/drums/DrumMachine/AGENTS.md), [Drum Kit](../devices/drums/DrumKit/AGENTS.md), [Groovebox 12](../devices/drums/Groovebox12/AGENTS.md), [Pulse Drums](../devices/drums/PulseDrums/AGENTS.md), [Latin Percussion](../devices/drums/LatinPercussion/AGENTS.md) | het patroon in de state van de drumcomputer zelf; geen sequencer nodig |
| Bas | [Low Bass](../devices/synths/LowBass/AGENTS.md), [Basic Mono](../devices/synths/BasicMono/AGENTS.md), [Sub Line](../devices/synths/SubLine/AGENTS.md), [Acid Stepper](../devices/synths/AcidStepper/AGENTS.md) | een sequencer (hieronder), of het eigen patroon van de synth (Sub Line, Acid Stepper) |
| Akkoorden, pads | [Chord Poly](../devices/synths/ChordPoly/AGENTS.md), [Poly Chorus](../devices/synths/PolyChorus/AGENTS.md), [Stage Keys](../devices/synths/StageKeys/AGENTS.md), [Bowed Ensemble](../devices/synths/BowedEnsemble/AGENTS.md), [Triple Osc Poly](../devices/synths/TripleOscPoly/AGENTS.md) | Chord Sequencer, Pattern Tracker, Clip Arranger of Step Sequencer |
| Melodie, lead | de synths hierboven of [Four-Operator FM](../devices/synths/FourOperatorFM/AGENTS.md), [Supersaw Swarm](../devices/synths/SupersawSwarm/AGENTS.md) | Step Sequencer, Wanderer of een song-sequencer |
| Drones, texturen | [Drone Synth](../devices/synths/DroneSynth/AGENTS.md), [Mist](../devices/synths/Mist/AGENTS.md), [Layered Landscape](../devices/synths/LayeredLandscape/AGENTS.md), [Biotope](../devices/synths/Biotope/AGENTS.md) | Clip Arranger, een lange noot, of hun eigen patroon |
| Ruimte, kleur | [Room](../devices/effects/Room/AGENTS.md), [Chorus](../devices/effects/Chorus/AGENTS.md), [Filter](../devices/effects/Filter/AGENTS.md), [Pump](../devices/effects/Pump/AGENTS.md), [Grit](../devices/effects/Grit/AGENTS.md) | audio |
| Mix en uitgang | [Mixer](../devices/mixer/Mixer/AGENTS.md), [Master Chain](../devices/mastering/MasterChain/AGENTS.md), [Speakers](../devices/mixer/Speakers/AGENTS.md) | audio |

Sequencers (noten en trigs, maken zelf geen geluid). Per sequencer: zijn `AGENTS.md` en de sequencer-handleiding voor toonlengte, timing, velocity en raster:

| Sequencer | Voor | `AGENTS.md` | Handleiding |
|---|---|---|---|
| Step Sequencer | één lijn van 1 tot 64 stappen: bas, motief, drumtrigger | [AGENTS.md](../devices/sequencers/StepSequencer/AGENTS.md) | [NL](../docs/sequencers/USER-MANUAL_NL.md#step-sequencer) · [EN](../docs/sequencers/USER-MANUAL_EN.md#step-sequencer) |
| Chord Sequencer | akkoorden, bas en arpeggio in vier sporen, scènes | [AGENTS.md](../devices/sequencers/ChordSequencer/AGENTS.md) | [NL](../docs/sequencers/USER-MANUAL_NL.md#chord-sequencer) · [EN](../docs/sequencers/USER-MANUAL_EN.md#chord-sequencer) |
| Scale Arpeggiator | een akkoord of toetsenbord arpeggieren | [AGENTS.md](../devices/sequencers/ScaleArpeggiator/AGENTS.md) | [NL](../docs/sequencers/USER-MANUAL_NL.md#scale-arpeggiator) · [EN](../docs/sequencers/USER-MANUAL_EN.md#scale-arpeggiator) |
| Wanderer | generatieve melodie in een toonladder | [AGENTS.md](../devices/sequencers/Wanderer/AGENTS.md) | [NL](../docs/sequencers/USER-MANUAL_NL.md#wanderer) · [EN](../docs/sequencers/USER-MANUAL_EN.md#wanderer) |
| Euclidean Rhythms | ritme en polyritme, drumtrigs | [AGENTS.md](../devices/sequencers/EuclideanRhythms/AGENTS.md) | [NL](../docs/sequencers/USER-MANUAL_NL.md#euclidean-rhythms) · [EN](../docs/sequencers/USER-MANUAL_EN.md#euclidean-rhythms) |
| Pattern Tracker | noten in rijen met effectkolom en een **volgorde** van patronen (songstructuur) | [AGENTS.md](../devices/sequencers/PatternTracker/AGENTS.md) | [NL](../docs/sequencers/USER-MANUAL_NL.md#pattern-tracker) · [EN](../docs/sequencers/USER-MANUAL_EN.md#pattern-tracker) |
| Pattern Playlist | patronen als blokken op een tijdlijn per laag (songstructuur) | [AGENTS.md](../devices/sequencers/PatternPlaylist/AGENTS.md) | [NL](../docs/sequencers/USER-MANUAL_NL.md#pattern-playlist) · [EN](../docs/sequencers/USER-MANUAL_EN.md#pattern-playlist) |
| Clip Arranger | clips, scènes en een **arrangement** (songstructuur) | [AGENTS.md](../devices/sequencers/ClipArranger/AGENTS.md) | [NL](../docs/sequencers/USER-MANUAL_NL.md#clip-arranger) · [EN](../docs/sequencers/USER-MANUAL_EN.md#clip-arranger) |

Gemeenschappelijk voor alle sequencers (raster 1/16, 1/32 en 1/64, velocity, nootlengte, timing, accenten): [NL](../docs/sequencers/USER-MANUAL_NL.md#wat-de-sequencers-gemeen-hebben) · [EN](../docs/sequencers/USER-MANUAL_EN.md#what-the-sequencers-have-in-common).

### Stap 5. Tunes en presets kiezen en kopiëren

- **Apparaten die geluid maken** (`kind: instrument`: synths, samplers, drums) hebben **tunes** in `../tunes/`. Werkwijze en tabel van de packs: [../tunes/AGENTS.md](../tunes/AGENTS.md#tunes-gebruiken-in-een-song). Handleiding: [NL](../docs/tunes/USER-MANUAL_NL.md) · [EN](../docs/tunes/USER-MANUAL_EN.md).
- **Alle andere apparaten** (sequencers, effecten, mastering, modulators, mixer) hebben **presets** in `../presets/`. Werkwijze en tabel: [../presets/AGENTS.md](../presets/AGENTS.md#een-preset-in-een-song-gebruiken). Handleiding: [NL](../docs/presets/USER-MANUAL_NL.md) · [EN](../docs/presets/USER-MANUAL_EN.md).
- Zoek in het pack een tune of preset in de map met de naam van je stijl (`tree` → `folder` → `name`) en **kopieer `state` letterlijk** naar `state` van het apparaat in de song. Laat geen sleutels weg en voeg er geen toe. Zet geen routing of kabels in de state. Laat de sleutel `preset` weg.
- Pas daarna alleen aan wat bij **deze song** hoort: het patroon of de noten, het volume (`lvl`, `level`; de naam verschilt per apparaat, zie de `AGENTS.md`) en tempo-gebonden dingen. Laat de klankvelden staan; wil je een andere klank, kies dan liever een andere tune.
- Een tune kan **ook een patroon** bevatten (drumcomputers; sommige synths): dat is het startpunt voor je song. Pas het aan in de state, volgens de `AGENTS.md` van het apparaat.
- Een tune kan een **akkoordgeheugen** hebben (bijvoorbeeld Chord Poly met `chord` anders dan `none`): stuur dan enkelvoudige noten, anders speelt het apparaat akkoorden bovenop je akkoorden.
- Er is niet voor elk apparaat een pack. Mixer en Speakers hebben er geen: schrijf hun state zelf volgens hun `AGENTS.md` (Mixer: kanalen met `lvl` in dB, `pan`, `send`; Speakers: `lvl`).
- Hulpmiddel om een tune of preset te vinden: `python3 ../docs/tools/list-devices.py` genereert de tabellen; de tabellen in de drie `AGENTS.md`-bestanden zijn de uitkomst.

### Stap 6. De sequencerinhoud schrijven

Schrijf de noten met de velden van de gekozen sequencer. Per apparaat gelden eigen regels; lees die in zijn `AGENTS.md`. Algemeen:

- **Noot en positie.** Nootnummers zijn MIDI (60 = C4, 36 = C2). Een maat is 16 stappen op een 1/16-raster. Kies posities op papier met de rasterleesregel van [styles/README.md](styles/README.md#leesregel-voor-ritmerasters) en [MUSIC-THEORY §7](MUSIC-THEORY.md#7-ritme).
- **Toonlengte.** Kort (staccato) 0,3 tot 0,5 stap, normaal 0,5 tot 0,7, gebonden tot de volgende noot, pads de hele akkoordduur. Hoe dat in de velden heet verschilt: Step Sequencer `ln` en `gate`, Chord Sequencer `len` per stap en `t<n>gate`, Pattern Tracker `len` in rijen, Clip Arranger `len` in zestienden. Zie de sequencer-handleiding ([NL](../docs/sequencers/USER-MANUAL_NL.md#velocity-en-lengte)).
- **Velocity.** Altijd een eigen waarde per noot, tussen 0,05 en 1: accent 0,9 tot 1, normaal 0,7 tot 0,85, zacht 0,5 tot 0,6, ghost 0,25 tot 0,4. Nooit 0 voor een noot die moet klinken (bij Step Sequencer betekent `vel` 0 "automatisch"; een rust is `n` = -1). Zie [MUSIC-THEORY §8](MUSIC-THEORY.md#8-dynamiek-en-articulatie).
- **Timing.** Swing zit in de klok (`workspace.swing`); extra feel via `mt` (Step Sequencer), `DEL` (Pattern Tracker) of een kwart stap in `step` (Clip Arranger). Zet swing niet dubbel (host én sequencer). Zie [NL](../docs/sequencers/USER-MANUAL_NL.md#raster-116-132-en-164).
- **Raster.** De opslageenheid van een patroon hangt af van `res` (Step Sequencer), `rowsPerBeat` (Pattern Tracker), `grid`/`division` (Chord Sequencer) of zestienden (Clip Arranger). Verander je het raster, schrijf de stappen dan opnieuw.
- **Volledige lijsten.** Step Sequencer wil in `n`, `vel`, `ln`, `acc` en `mt` altijd 64 plaatsen. Een lijst die korter is, laat het beginpatroon van het apparaat staan.
- **Binnen het patroon.** Elke noot ligt binnen de lengte van het patroon en van de clip; een noot erbuiten wordt afgekapt of nooit gespeeld.
- **Akkoorden en bas.** Zet de bas in een eigen register (28 tot 48) onder de akkoorden (48 en hoger). Laat bas en kick elk een eigen ritme.

### Stap 7. Kabels

Leg één kabel per verbinding vast in `cables`. Controleer elke poort-`id` in de tabel van [../devices/AGENTS.md](../devices/AGENTS.md#de-apparaten).

1. **Noten:** sequencer-uitgang (`notes`, `a`, `track1`, …) → `notes` van de synth (`event`). Een drumcomputer met eigen patroon heeft deze kabel niet nodig.
2. **Geluid:** synth (`out`) → eventueel een effect (`in` → `out`) → Mixer (`ch1`, `ch2`, …) of direct Speakers (`in`). Drumcomputers met meer uitgangen: `out` of `mix` voor de som, of `multi` naar `multi` van de Mixer.
3. **Send en return:** Mixer `s1` → effect `in`, effect `out` → Mixer `r1`. Zo staat de galm één keer voor alle kanalen.
4. **Uitgang:** Mixer `out` → eventueel [Master Chain](../devices/mastering/MasterChain/AGENTS.md) (`in` → `out`) → Speakers `in`.
5. **Modulatie (optioneel):** modulator `mod` → doel `mod` (kind `mod`). De toewijzing staat in de state van de modulator (zie zijn `AGENTS.md`).
6. Elke notenpoort die je gebruikt heeft een klankbron; elke klankbron heeft een weg naar **Speakers**. Een ontbrekende kabel naar Speakers geeft een stille song.

### Stap 8. Mixer en mastering

- Niveaus op hoofdlijnen: [MUSIC-THEORY §11](MUSIC-THEORY.md#11-mixen-op-hoofdlijnen). Begin met kick en bas, voeg de rest zachter toe.
- De Mixer rekent in dB (`lvl` −60 tot 6, standaard −6; master 0). Zet kanalen tussen −8 en −16 dB als je meerdere bronnen optelt; zet ze zachter als `check-song.py` een te hoge piek meldt.
- Master Chain: kies een preset uit de map `Styles` die bij je stijl past (de namen zijn genres) en zet het plafond (`ceiling`) op −3 dBTP of lager. Speakers heeft een begrenzer (drempel −3 dB) achter het volume (`lvl` standaard 0,8), maar laat je mix niet op die begrenzer rekenen.
- Meer over mastering: [NL](../docs/mastering/USER-MANUAL_NL.md) · [EN](../docs/mastering/USER-MANUAL_EN.md).

### Stap 9. Controleren

Vanuit de root van de repo:

```
python3 docs/tools/check-song.py songs/<bestand>.patchkamer-song.json --seconds 20
```

Het script laadt de host in een headless Chromium (Playwright), de apparaten uit `devices/`, opent de song, controleert apparaten, kabels en poorten, drukt op Start, meet het geluid dat de luidsprekers ingaat (piek en rms per seconde, aantal niet-eindige samples) en eindigt met exitcode 0 (in orde) of 1 (fout). Gebruik: [../docs/tools/check-song.py](../docs/tools/check-song.py) (bovenin het bestand). Nodig: Python 3, `pip install playwright`, `playwright install chromium` en Node.

Eis voor een oplevering:

- Exitcode 0, geen `FOUT`, geen `NaN/Infinity`, geen `CLIPPING`.
- Piek tussen −24 en −1 dBFS over de hele meting (een piek lager dan −24 is te zacht om te beoordelen, hoger dan −1 laat geen ruimte). Stel `--seconds` zo in dat de **laatste sectie** erin valt (de duur van de song is `maten × 240 / bpm` seconden); anders meet je niet wat later komt, en een rol die pas na N seconden begint, valt buiten de meting.
- De eerste seconden van de meting zijn vaak stil: de audio start dan nog. Het script waarschuwt alleen voor stilte **na** het eerste geluid.
- Check elk kanaal apart: maak een kopie van de song met `"solo": true` bij één Mixer-kanaal en draai het script met genoeg seconden. Zo zie je een stille bron, die in de som niet opvalt.
- Daarnaast: lees [MUSIC-THEORY §13](MUSIC-THEORY.md#13-controlelijst) langs en de **Aanvullende werkafspraken** onderaan de stijlgids.

Het script zegt niets over of het goed klinkt.

### Stap 10. Opleveren

Lever op: het pad van het bestand, de stijl en de structuur (secties met maten en de duur), tempo en toonsoort, de gebruikte apparaten en tunes/presets (naam en map), de contractversie (`patchkamer`), de uitvoer van `check-song.py` (exitcode, piek, aantal fouten en waarschuwingen) en **wat je niet hebt kunnen controleren**. Schrijf dat je niet hebt geluisterd.

## 5. Songstructuur en lengtes in maten

Een maat duurt `240 / bpm` seconden (4/4); 8 maten bij 124 BPM zijn 15,5 s. Typische secties zijn 4, 8 of 16 maten en iets verandert elke 8 maten ([MUSIC-THEORY §9](MUSIC-THEORY.md#9-songstructuur-en-maatlengtes)). Hoe je structuur uitdrukt hangt af van de sequencer. Kies **één** manier voor je song:

| Manier | Wanneer | Hoe |
|---|---|---|
| **Clip Arranger**: scènes, clips, arrangement | songs met duidelijke secties en meerdere rollen | `tracks[i].clips[j]` voor scène `j`; `arrangement`: lijst van `{ scene, bars, repeats }` (een sectie duurt `bars × repeats` maten); `mode: "song"`. Een clip loopt op zijn eigen lengte (`bars`) en herhaalt binnen de sectie: zet de `bars` van de sectie op een veelvoud van de langste clip. Zie [ClipArranger/AGENTS.md](../devices/sequencers/ClipArranger/AGENTS.md); [example-ambient](example-ambient.patchkamer-song.json) gebruikt dit |
| **Pattern Tracker**: patronen en een volgorde | songs met een vaste opbouw (intro, couplet, refrein) en rij-effecten | `patterns[]` met `length` in rijen (bij `rowsPerBeat` 4 is een maat 16 rijen), `order[]` van `{ pattern, repeats, transpose }`; `mode: "order"`. Zie [PatternTracker/AGENTS.md](../devices/sequencers/PatternTracker/AGENTS.md); [example-hip-hop](example-hip-hop.patchkamer-song.json) gebruikt dit |
| **Pattern Playlist**: blokken per laag op een tijdlijn | lagen die elk eigen blokken hebben (dance, opbouw en drop) | blokken in `playlist[]`; zie [PatternPlaylist/AGENTS.md](../devices/sequencers/PatternPlaylist/AGENTS.md) |
| **Meerdere patronen naast elkaar** | een loop zonder secties (clubtrack in één lus, ambient zonder verloop) | elke sequencer loopt zijn eigen patroon (Step Sequencer `len` 16, 32 of 64; Chord Sequencer een cyclus van vier maten via `progression`). De structuur zit in de lengte van de lus. [example-house](example-house.patchkamer-song.json) is zo gebouwd |

Let op bij structuur:

- **Eén lus is geen song.** Een lus van 4 maten die eindeloos herhaalt is een goed voorbeeld voor het formaat, maar voor een echte song kies je een van de eerste drie manieren. Een drumcomputer met een eigen patroon speelt altijd door: de drums staan dan in elke sectie. Laat je ze in een sectie weg, gebruik dan een sequencer die drumtrigs stuurt (Pattern Tracker of Clip Arranger met een `drums`-spoor naar de `trigger`-ingang van Drum Kit of Pulse Drums).
- **Chord Sequencer**: de vier scènes wisselt de gebruiker (of `scene` in de state); er is geen automatische volgorde. Voor structuur dus een van de sequencers uit de tabel.
- **Lengte.** Een song van 2 tot 4 minuten is bij 120 BPM 60 tot 120 maten. Voorbeelden van opbouw in maten: [MUSIC-THEORY §9](MUSIC-THEORY.md#9-songstructuur-en-maatlengtes) en de tabel "Arrangement en songstructuur" in elke stijlgids.
- **Overgangen.** Een fill in de laatste maat, een riser 1 tot 2 maten voor een drop, of een tel stilte. Haal in een break lagen weg in plaats van er iets bij te zetten.
- **Een song loopt.** De meeste sequencers beginnen na het einde opnieuw (`loop`, `songLoop`). Laat de laatste sectie dus een rustig einde hebben, of laat de song bewust terugvloeien naar het begin.

## 6. Stijlen op hoofdlijnen

Overzicht en leesregel voor de rasters: [styles/README.md](styles/README.md). Tempo's zijn richtlijnen; de host accepteert 40 tot 200 BPM. Elke gids heeft dezelfde kopjes: Kenmerken; Tempo en maatsoort; Toonsoort en harmonie; Ritme; Bas; Akkoorden en pads; Melodie en lead; Arrangement en songstructuur; Dynamiek en nuances; Passende devices, tunes en presets; Minimale startconfiguratie.

| Stijl | BPM | Waar het om draait | Gids |
|---|---|---|---|
| Techno | 124 tot 140 | vier op de vloer, offbeat-hats, weinig harmonie; beweging via filter en lagen die in- en uitgaan | [techno.md](styles/techno.md) |
| House | 118 tot 130 | swingende hats (kick recht), zevende-akkoordstabs, gesyncopeerde bas, lichte pomp | [house.md](styles/house.md) |
| Deep house | 110 tot 124 | warm, m7/m9, lange noten, ronde sub | [deep-house.md](styles/deep-house.md) |
| Trance | 128 tot 140 | opbouw en break, rollende bas, supersaw-akkoorden, euforische mineurprogressie | [trance.md](styles/trance.md) |
| Drum and bass | 170 tot 178 | gebroken beat, snare op 2 en 4, zware sub; maat is kort (±1,4 s), structuur in blokken van 8 en 16 | [drum-and-bass.md](styles/drum-and-bass.md) |
| Dubstep | 138 tot 142 | half-time (snare op tel 3), wobble-bas, ruimte en stilte voor de drop | [dubstep.md](styles/dubstep.md) |
| Breakbeat | 120 tot 140 | gesyncopeerde breaks, ghost-snares, funky bas | [breakbeat.md](styles/breakbeat.md) |
| Electro | 110 tot 135 | robotachtig, gesyncopeerde kick, korte bleeps, koude pads | [electro.md](styles/electro.md) |
| Synthwave | 80 tot 120 | gated snare, pulserende achtstenbas, brede pads, arpeggio's, mineur | [synthwave.md](styles/synthwave.md) |
| Ambient | 50 tot 90 | lange pads en drones, weinig of geen ritme, lydisch of pentatonisch; 1 akkoord per 4 tot 8 maten, swing 0 | [ambient.md](styles/ambient.md) |
| Dark ambient | 40 tot 70 | lage drones, dissonante clusters, frygisch of locrisch, veel stilte | [dark-ambient.md](styles/dark-ambient.md) |
| Cinematic | 60 tot 130 | strijkers, ostinato, grote crescendi, impacts, pedaalbas | [cinematic.md](styles/cinematic.md) |
| Lo-fi | 70 tot 90 | stoffig, jazz-akkoorden, swing, zachte drums, korte lussen | [lo-fi.md](styles/lo-fi.md) |
| Hiphop | 70 tot 100 | boom bap, ghost-snares, swing 0,2, sub-bas, ruimte voor een vocal | [hip-hop.md](styles/hip-hop.md) |
| Trap | 130 tot 170 | half-time, hat-rolls en triolen (1/32 of 1/64), lange glijdende sub | [trap.md](styles/trap.md) |
| Funk en disco | 95 tot 126 | ghost notes, korte stabs, octaafbas (disco), vier op de vloer (disco) | [funk-disco.md](styles/funk-disco.md) |
| Pop | 90 tot 130 | couplet-refrein-brug, vier akkoorden, hook, duidelijk contrast | [pop.md](styles/pop.md) |
| Ballad | 55 tot 85 | piano en strijkers, lange crescendi, melodie voorop | [ballad.md](styles/ballad.md) |
| Reggae en dub | 65 tot 85 (steppers 120 tot 140) | offbeat-skank, one drop, melodieuze bas, echo en hall | [reggae-dub.md](styles/reggae-dub.md) |
| Jazz en blues | 70 tot 200 | swing of shuffle, walking bass, 7e-akkoorden, twaalfmaats blues, ii-V-I | [jazz-blues.md](styles/jazz-blues.md) |
| Neoklassiek | 50 tot 100 | piano-arpeggio's, strijkers, brede dynamiek, geen drums | [neo-classical.md](styles/neo-classical.md) |
| Chiptune | 100 tot 180 | blokgolf en driehoek, snelle arpeggio's, ruisdrums, geen galm | [chiptune.md](styles/chiptune.md) |
| Afrobeat en latin | 85 tot 220 (afrobeat 100 tot 125) | kernritme en bel, gelaagde percussie, vamp, syncope, 12/8 of 4/4 | [afrobeat-latin.md](styles/afrobeat-latin.md) |
| Industrial | 100 tot 150 | hard, mechanisch, distortion, metaalpercussie, dissonant | [industrial.md](styles/industrial.md) |
| Garage en 2-step | 128 tot 140 | kick op stap 0 en 10, shufflende hats, ronde sub, jazzachtige stabs | [garage-2step.md](styles/garage-2step.md) |

Nuances die over stijlen heen gelden:

- **Dansstijlen** (techno, house, trance, garage, electro): de kick is de klok en blijft recht; swing zit op de hats. Verander elke 8 maten iets, en laat in een break de kick en bas weg.
- **Gebroken en half-time stijlen** (drum and bass, dubstep, trap, hiphop): de plaats van de snare (tel 2 en 4, of tel 3) en de hats (1/16, 1/32 of 1/64) bepalen de stijl. Zie het raster van de drumcomputer in de gids.
- **Ruimtestijlen** (ambient, dark ambient, neoklassiek, cinematic): weinig ritme, lange noten (`gate` en `len` bij het akkoord), langzame verandering, veel galm via een send. Gebruik een song-sequencer voor de structuur en een lange galm (Room).
- **Song-stijlen** (pop, ballad, jazz en blues, funk en disco): een vaste vorm (couplet, refrein, brug of twaalf maten) en een akkoordprogressie die de vorm draagt. Gebruik Pattern Tracker of Clip Arranger.
- **Wereldritmes** (afrobeat en latin, reggae en dub): het kernpatroon (kernritme, bel, one drop) bepaalt alles. Gebruik Latin Percussion of Euclidean Rhythms en lees de gids over de plaats van de slagen.
- **Retro en geluidsstijlen** (chiptune, synthwave, industrial): de klankkeuze is de stijl. Kies de tunes uit de map van de stijl in het pack.

## 7. Regels

- **Namen zijn Engels.** Titel, namen in de werkruimte en omschrijving zijn Engels. Dit bestand en de rest van de documentatie zijn Nederlands.
- **Geen merk-, product-, artiest-, label-, game-, nummer- of samplenamen** in titel, omschrijving, `author` en nergens in het bestand, ook niet als "in de stijl van" of "geïnspireerd door". Genres en muziektermen (techno, house, ambient, ii-V-I) mogen wel.
- **Licentie.** Zet `"license": "CC-BY-4.0"`. Songs zijn CC-BY-4.0, tunes en presets die je gebruikt zijn CC0-1.0, apparaten AGPL-3.0-or-later; een song die ze gebruikt blijft CC-BY-4.0. Zie [../LICENSING.md](../LICENSING.md).
- **Auteur.** Vul `author` in zoals de opdracht zegt. **Verzin geen persoon.** Noemt de opdracht geen auteur, laat dan `"author": ""` staan en meld dat in je oplevering. Gebruik geen naam van een bestaande artiest. De voorbeelden hebben `Patchkamer examples`.
- **Niets beluisterd claimen.** Je kunt niet luisteren. Zeg nooit dat iets goed klinkt, warm, strak of bruikbaar is. Zeg wat je gemeten hebt (exitcode, niveaus) en wat je op papier hebt gecontroleerd. Schrijf in de `description` van een voorbeeld of testsong dat het niet is beluisterd.
- **Niets verzinnen.** Gebruik alleen apparaten, poorten en state-sleutels die in de tabellen en de `AGENTS.md` van het apparaat staan. Kopieer tunes en presets uit de packs.
- **Geen geheimen.** Zet geen sleutels, wachtwoorden of persoonlijke gegevens in de song, ook niet in `description`.
- **Werk binnen de repo.** Lees en schrijf alleen binnen de repo en haal geen gegevens van buiten op. Het controlescript blokkeert alle verzoeken buiten `localhost`. Schrijf het songbestand in `songs/`, tenzij de opdracht een andere plek noemt, en pas geen bestanden aan buiten wat de opdracht noemt (geen apparaat, tune, preset of contract).
- **Commit of push niet**, tenzij de opdracht dat vraagt.
- **Voorbeelden zijn voorbeelden.** Wijzig de voorbeeldsongs in `songs/example-*.patchkamer-song.json` niet, tenzij gevraagd; maak een nieuw bestand.

## 8. Veelgemaakte fouten en hun controle

| Fout | Wat er gebeurt | Controle |
|---|---|---|
| Noten buiten het patroon | de noot wordt afgekapt of nooit gespeeld (Step Sequencer: alleen stappen onder `len`; Pattern Tracker: `row` onder `length`; Clip Arranger: `step` onder `bars × 16`; Chord Sequencer: `p` onder `bars × 64`) | tel de posities per patroon; `check-song.py` vindt dit niet, het meet alleen of er geluid is |
| Lijst korter dan 64 bij Step Sequencer | het beginpatroon blijft staan en klinkt mee | tel `n`, `vel`, `ln`, `acc`, `mt`: 64 plaatsen |
| Ontbrekende kabel naar Speakers | stille song | `check-song.py` meldt stilte (piek onder −80 dBFS) of hoort geen enkele kabel; kijk of elke klankbron via een keten bij `Speakers` `in` uitkomt |
| Kabel naar een poort die niet bestaat | gebeurt niets (alleen audio wordt gecontroleerd) | `check-song.py` controleert elke poort; kijk ook in de tabel van [../devices/AGENTS.md](../devices/AGENTS.md#de-apparaten) |
| Een klok die niet loopt | niets speelt | de gebruiker drukt op Start; `check-song.py` doet dat zelf |
| Stille song | geen noten, geen patroon, een noot te zacht, klok niet gestart of een klankbron zonder weg naar de uitgang | `check-song.py`; solo per Mixer-kanaal met een grotere `--seconds` |
| Een sectie die buiten de meting valt | het script meldt geen geluid van een rol die pas later begint | `--seconds` ≥ de starttijd van de laatste sectie plus een paar maten |
| Te harde niveaus | clipping, of de begrenzer maakt het plat | `check-song.py`: piek boven −1 dBFS of `CLIPPING`; zet Mixer-kanalen zachter en het Master Chain-plafond op −3 of lager |
| Te zacht | niet te beoordelen, het gaat verloren in de mix | piek lager dan −24 dBFS: zet kanalen harder |
| State-sleutels verzinnen of weglaten | het apparaat negeert onbekende sleutels en zet ontbrekende op de standaard; de klank is dan anders dan je bedoelde, zonder foutmelding | kopieer de state van een tune of preset; lees de `AGENTS.md` van het apparaat; vergelijk de sleutels met die van de tune |
| `preset`-sleutel met verzonnen `lid` en `pid` | de host toont "bibliotheek niet geladen" | laat `preset` weg |
| Akkoordgeheugen en akkoordsequencer samen | akkoorden bovenop akkoorden, een brij | gebruik `mode: "pulse"` of `quality: "single"` bij een synth met `chord` anders dan `none` |
| Mixer-`src` of bundelkabel | bronkeuze hoort niet in een preset; zonder `src` komt er geen bundelkanaal binnen | gebruik `audio`-kabels naar `ch1` … of zet `src` volgens [Mixer/AGENTS.md](../devices/mixer/Mixer/AGENTS.md) |
| Swing dubbel | te losse timing | alleen `workspace.swing`, `swing` van de sequencer op 0 |
| Dezelfde `id` voor twee apparaten | de tweede verdringt de eerste | `d1`, `d2`, …, uniek |
| Mono-synth met overlappende noten | noten knippen elkaar af | laat de lengte eindigen voor de volgende noot, of gebruik een polyfone synth |
| Geen verandering over 16 maten of meer | de song raakt het spoor bijster | verander elke 8 maten iets ([MUSIC-THEORY §10](MUSIC-THEORY.md#10-arrangeren)) |
| Een merk-, artiest- of nummernaam | in strijd met de regels | zoek je bestand door: `grep -n -i -E "<namen die je gebruikte>" songs/<bestand>` en lees titel en omschrijving na |

## 9. Opdrachtsjabloon voor gebruikers

Kopieer dit, vul de velden in en geef het aan een agent samen met de URL van dit bestand (`songs/AGENTS.md` op GitHub). Wat je niet invult kiest de agent zelf en meldt hij.

```
Componeer een song voor Patchkamer. Lees eerst songs/AGENTS.md en volg de werkwijze daarin.

Stijl:            <bijvoorbeeld deep house, ambient, lo-fi, jazz-blues>
Sfeer:            <bijvoorbeeld warm en ruimtelijk, donker, speels>
Tempo:            <bijvoorbeeld 122 BPM, of: kies zelf passend bij de stijl>
Toonsoort:        <bijvoorbeeld A mineur, of: kies zelf>
Lengte:           <bijvoorbeeld ongeveer 3 minuten, of 64 maten>
Structuur:        <bijvoorbeeld intro, opbouw, drop, break, drop, outro, of: kies zelf>
Instrumenten:     <bijvoorbeeld Drum Machine, Low Bass, Chord Poly, of: kies zelf; en wat niet gebruikt mag worden>
Titel:            <Engelse titel, zonder merk-, artiest- of nummernamen>
Auteur:           <naam in het bestand, of: laat leeg>
Licentie:         CC-BY-4.0
Bestand:          songs/<naam>.patchkamer-song.json
Lever op:         het bestand, de uitvoer van docs/tools/check-song.py (exitcode 0, piek tussen -24 en -1 dBFS) en wat je niet hebt kunnen controleren.
Let op:           je kunt niet luisteren; zeg niet dat het goed klinkt. Commit of push niet.
```

## 10. Links

Dit bestand is het toegangspunt. De rest:

**Songs**
- [MUSIC-THEORY.md](MUSIC-THEORY.md): muziektheorie vertaald naar Patchkamer-waarden (nootnummers, toonladders, akkoorden, ritme, dynamiek, structuur, mixen, omzetten, controlelijst)
- [styles/README.md](styles/README.md): overzicht en leesregel; de 25 stijlgidsen staan in de [tabel hierboven](#6-stijlen-op-hoofdlijnen)
- Voorbeelden: [example-house](example-house.patchkamer-song.json), [example-ambient](example-ambient.patchkamer-song.json), [example-hip-hop](example-hip-hop.patchkamer-song.json)
- [README.md](README.md) · [README_NL.md](README_NL.md): wat in `songs/` staat en de licentie; [LICENSE](LICENSE)

**Apparaten, tunes, presets**
- [../devices/AGENTS.md](../devices/AGENTS.md): catalogus van alle apparaten (`id`, poorten, kabelsoorten, signaalketens, links naar de `AGENTS.md` en handleiding van elk apparaat)
- [../tunes/AGENTS.md](../tunes/AGENTS.md): tunes (klanken voor instrumenten), met [Tunes gebruiken in een song](../tunes/AGENTS.md#tunes-gebruiken-in-een-song); overzicht [../tunes/README_NL.md](../tunes/README_NL.md)
- [../presets/AGENTS.md](../presets/AGENTS.md): presets (instellingen voor de rest), met [Een preset in een song gebruiken](../presets/AGENTS.md#een-preset-in-een-song-gebruiken); overzicht [../presets/README_NL.md](../presets/README_NL.md)
- Overzichten per soort: [synths](../devices/synths/README.md), [samplers](../devices/samplers/README.md), [drums](../devices/drums/README.md), [sequencers](../devices/sequencers/README.md), [modulators](../devices/modulators/README.md), [effects](../devices/effects/README.md), [mastering](../devices/mastering/README.md), [mixer](../devices/mixer/README.md), [tools](../devices/tools/README.md)

**Gereedschap**
- [../docs/tools/check-song.py](../docs/tools/check-song.py): controleert en meet een song (zie [Stap 9](#stap-9-controleren))
- [../docs/tools/list-devices.py](../docs/tools/list-devices.py): genereert de tabellen in de `AGENTS.md`-bestanden

**Contract en algemeen**
- [../AGENTS.md](../AGENTS.md): een apparaat bouwen; [../contract/PATCHKAMER-CONTRACT_NL.md](../contract/PATCHKAMER-CONTRACT_NL.md) en [../contract/PATCHKAMER-CONTRACT_EN.md](../contract/PATCHKAMER-CONTRACT_EN.md) (huidige versie 1.13, zie [§13c](../contract/PATCHKAMER-CONTRACT_NL.md#13c-tunes-presets-songs-licenties-en-instrumenten-v19)); [../LICENSING.md](../LICENSING.md)

**Handleidingen (Nederlands · Engels)**
- Algemeen: [NL](../docs/USER-MANUAL_NL.md) · [EN](../docs/USER-MANUAL_EN.md); bewaren en delen van songs: [NL](../docs/USER-MANUAL_NL.md#8-bewaren-openen-en-delen) · [EN](../docs/USER-MANUAL_EN.md#8-save-open-and-share)
- Synths: [NL](../docs/synths/USER-MANUAL_NL.md) · [EN](../docs/synths/USER-MANUAL_EN.md)
- Samplers: [NL](../docs/samplers/USER-MANUAL_NL.md) · [EN](../docs/samplers/USER-MANUAL_EN.md)
- Drums: [NL](../docs/drums/USER-MANUAL_NL.md) · [EN](../docs/drums/USER-MANUAL_EN.md)
- Sequencers: [NL](../docs/sequencers/USER-MANUAL_NL.md) · [EN](../docs/sequencers/USER-MANUAL_EN.md)
- Modulators: [NL](../docs/modulators/USER-MANUAL_NL.md) · [EN](../docs/modulators/USER-MANUAL_EN.md)
- Effects: [NL](../docs/effects/USER-MANUAL_NL.md) · [EN](../docs/effects/USER-MANUAL_EN.md)
- Mastering: [NL](../docs/mastering/USER-MANUAL_NL.md) · [EN](../docs/mastering/USER-MANUAL_EN.md)
- Mixer: [NL](../docs/mixer/USER-MANUAL_NL.md) · [EN](../docs/mixer/USER-MANUAL_EN.md)
- Tools: [NL](../docs/tools/USER-MANUAL_NL.md) · [EN](../docs/tools/USER-MANUAL_EN.md)
- Tunes: [NL](../docs/tunes/USER-MANUAL_NL.md) · [EN](../docs/tunes/USER-MANUAL_EN.md)
- Presets: [NL](../docs/presets/USER-MANUAL_NL.md) · [EN](../docs/presets/USER-MANUAL_EN.md)
