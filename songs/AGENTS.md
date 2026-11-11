# AGENTS.md: een song componeren voor Patchkamer

Dit bestand is voor AI-agents die een **song** componeren voor Patchkamer. Het is niet geschreven voor mensen en het is het toegangspunt: met dit bestand en de bestanden waar het naar verwijst kun je zelf een song maken uit de meegeleverde apparaten, tunes en presets. Het is geen verplichting, het maakt het makkelijker. Wil je een **apparaat** bouwen, lees dan `../AGENTS.md`.

Licenties: een song is `CC-BY-4.0`, tunes en presets `CC0-1.0`, apparaten `AGPL-3.0-or-later`. Je kunt niet luisteren. Alles wat je over een song zegt, is gemeten of op papier gecontroleerd, nooit gehoord.

## Plaats in de boom

Omhoog: de [root AGENTS.md](../AGENTS.md). Omlaag, welke apparaten je kunt gebruiken: [devices/AGENTS.md](../devices/AGENTS.md) (kabels, klok, signaalketens) en de soorten [synths](../devices/synths/AGENTS.md), [samplers](../devices/samplers/AGENTS.md), [sequencers](../devices/sequencers/AGENTS.md), [drums](../devices/drums/AGENTS.md), [effects](../devices/effects/AGENTS.md), [mastering](../devices/mastering/AGENTS.md), [mixer](../devices/mixer/AGENTS.md), [modulators](../devices/modulators/AGENTS.md) en [tools](../devices/tools/AGENTS.md). Klanken en instellingen: [tunes/AGENTS.md](../tunes/AGENTS.md) en [presets/AGENTS.md](../presets/AGENTS.md); samples: [samples/AGENTS.md](../samples/AGENTS.md).

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
- De song bevat de `state` van elk apparaat, niet de tune of preset zelf. Je kopieert de state uit het pack (stap 4) en het bestand is dan zelfstandig.
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
| `sections` | `[{ "name": "1 · Sequencers", "n": 1, "color": "#e8ae61", "alpha": 0.16, "line": "solid", "fs": 32, "x": -40, "y": -80, "w": 700, "h": 520, "members": ["d1"] }]` | optioneel maar **verplicht voor een song uit deze handleiding**: canvassecties, zie [Canvassecties](#canvassecties) |
| `jumps` | `[{ "n": 6, "name": "Overzicht", "x": 900, "y": 300, "scale": 0.4 }]` | optioneel: sprongpunten (Alt+n); delen de nummers 1 tot 9 met de secties |
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

### Canvassecties

Een canvassectie is een gekleurd vlak op de werkvloer met een naam, waar apparaten bij horen. In een song staan ze in `workspace.sections`. Elke song die je maakt deelt de vloer in **vijf secties** in, in de volgorde van de [werkwijze](#de-volgorde-en-de-canvassecties):

| `n` | `name` (Engels, de titel van de song is ook Engels) | Bevat | Voorgestelde `color` |
|---|---|---|---|
| 1 | `1 · Sequencers` | sequencers, arpeggiators, Chord Buddy | `#e8ae61` |
| 2 | `2 · Instruments` | synths, samplers, drumcomputers | `#4fd1c5` |
| 3 | `3 · Modulation` | modulators | `#b794f4` |
| 4 | `4 · Effects` | effecten | `#63b3ed` |
| 5 | `5 · Mix and master` | Mixer, Master Chain, Speakers | `#f6ad55` |

- **Veld per sectie:** `name` (40 tekens), `n` (1 tot 9, uniek in de hele werkruimte; Alt+n kadert de sectie in beeld), `color` (hex `#rrggbb`), `alpha` (0 tot 0,6; gebruik 0,12 tot 0,2), `line` (`solid`, `dashed`, `dotted` of `none`), `fs` (lettergrootte van de naam, 16 tot 96; 28 tot 36), `x`, `y`, `w`, `h` (vloercoördinaten; `w` ≥ 180, `h` ≥ 110), `min` (alleen `true` als hij geminimaliseerd moet zijn), `members` (lijst met de `id`'s van de apparaten, bijvoorbeeld `["d1","d2"]`; een apparaat hoort bij hoogstens één sectie).
- **Een soort die je niet gebruikt** krijgt geen sectie; de nummers van de andere blijven staan. Gebruik dus `n` = 4 voor effecten ook als er geen modulatie is. Gebruik geen `n` voor iets anders: de nummers 1 tot 5 horen bij de secties, 6 tot 9 zijn vrij voor `jumps`.
- **Plaatsing.** De secties staan van links naar rechts in de volgorde 1 tot 5 (de signaalrichting). Binnen een sectie zet je de apparaten onder elkaar of in een raster, ruim uit elkaar. De sectie moet **alle** leden omvatten: `x` en `y` liggen 28 pixels links en ongeveer 80 pixels boven het linker- en bovenste lid (de naam hangt half buiten de bovenrand), `w` en `h` reiken tot 28 pixels voorbij het rechter- en onderste lid. De breedte van een kaart staat als "breedte … px" in de uitvoer van de validator (en in de `AGENTS.md` van het apparaat); een kaart is hoger dan hij lijkt, dus schat de hoogte ruim (een kaart met veel regelaars is al snel 400 pixels of meer). Secties mogen elkaar niet overlappen: laat 48 pixels ertussen.
- **Opslag.** De host leest `sections` en `jumps` bij het openen en zet alleen leden die in `devices` staan; een `id` die er niet is, wordt overgeslagen. Ze werken in de brede indeling; op een klein scherm (compacte indeling) zijn ze verborgen.
- **Controle.** Het script `check-song.py` kijkt niet naar secties. Controleer daarom zelf dat elk apparaat precies in één sectie staat (`members` samen = alle `devices`, geen dubbele), dat de nummers uniek zijn, en dat de coördinaten alle leden omvatten. Heb je geen scherm bekeken, schrijf dan in de oplevering dat de plaatsing niet is gezien.

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

De volgorde is vast en gaat van het muzikale naar het technische: **eerst stijl en muziektheorie, dan de sequencer, dan de klankbronnen, dan modulatie, dan effecten, en pas dan afmixen en mastering.** Zo haal je alles uit Patchkamer: elke soort apparaat heeft presets en tunes die je als beginpunt gebruikt, en elke laag bouwt op de vorige. Sla geen stap over en ga niet vooruit zonder dat de vorige klaar is; ga je terug (bijvoorbeeld omdat een akkoord niet past), loop dan de stappen daarna opnieuw langs.

### De volgorde en de canvassecties

Elke soort apparaat staat op de werkvloer in een **eigen canvassectie** (een gekleurd vlak met een naam en een nummer, zie [§2](#canvassecties)). De nummers volgen de volgorde van de stappen, zodat iemand die de song opent met Alt+1 tot en met Alt+5 van sectie naar sectie springt in de volgorde waarin hij is gebouwd.

| Stap | Wat | Canvassectie (`n`, naam) | Wat erin staat |
|---|---|---|---|
| 1 | De opdracht | geen | |
| 2 | Muziekstijl en muziektheorie | geen | alleen op papier: toonsoort, akkoorden, structuur |
| 3 | Sequencer kiezen, nummer inrichten met sequencerpresets | **1 · Sequencers** | Clip Arranger, Pattern Playlist, Chord Sequencer, Chord Buddy, andere sequencers, arpeggiators |
| 4 | Muziekdevices kiezen, tunes en presets gebruiken | **2 · Instruments** | synths, samplers, drumcomputers |
| 5 | Noten en patronen schrijven (tracks en clips) | sectie 1 en 2 | de inhoud van de sequencers |
| 6 | Modulatie bepalen | **3 · Modulation** | LFO, Macro, Drift, Swell, MSEG, Follower |
| 7 | Effecten kiezen, met presets | **4 · Effects** | effecten per kanaal en send-effecten |
| 8 | Kabels | alle | |
| 9 | Afmixen en mastering | **5 · Mix and master** | Mixer, Master Chain, Speakers |
| 10 | Canvas indelen | alle | secties, nummers, plaatsing |
| 11 | Controleren | | meetscript |
| 12 | Review voor vrijgave | | harmonie, opbouw en muziektheorie |
| 13 | Opleveren | | |

Een soort die je niet gebruikt (bijvoorbeeld geen modulatie) krijgt geen sectie; de nummers van de andere blijven staan, zodat 4 altijd effecten is.

### Stap 1. De opdracht

Haal uit de opdracht: **stijl** (of sfeer), **tempo** (of laat de stijlgids kiezen), **lengte** (in minuten of maten), **instrumenten** die verplicht of verboden zijn, **auteur** en **titel** (zie [regels](#7-regels)). Ontbreekt iets, kies het eenvoudigste dat de stijlgids toestaat en schrijf in je oplevering wat je koos.

### Stap 2. Muziekstijl en muziektheorie

Hier begint elke song, vóór je een apparaat aanraakt. Kies uit de [tabel](#6-stijlen-op-hoofdlijnen) de stijl die het dichtst bij de opdracht ligt en lees `styles/<stijl>.md` **helemaal**, daarna [MUSIC-THEORY.md](MUSIC-THEORY.md) voor de delen die je nodig hebt (nootnummers, toonladders, akkoorden, ritme, dynamiek, structuur, mixen, de vertaling naar Patchkamer-waarden in [§12](MUSIC-THEORY.md#12-omzetten-naar-patchkamer) en de [controlelijst](MUSIC-THEORY.md#13-controlelijst)). Mengt de opdracht twee stijlen (bijvoorbeeld "ambient met een beat"), lees dan beide gidsen en kies één stijl voor de ritmesectie en één voor de klankkleur.

Schrijf daarna op papier, voor je verder gaat:

- tempo (`bpm`), swing, maatsoort;
- **toonsoort en toonladder**, en de **akkoordprogressie** per sectie (met de nootnamen en de MIDI-nummers van de akkoorden);
- de **structuur**: de secties met hun lengte in maten ([§5](#5-songstructuur-en-lengtes-in-maten)) en wat er per sectie verandert (spanning opbouwen, uitlaten, break, drop);
- welke **rol** (drums, bas, akkoorden, melodie, pad, textuur) in welke sectie speelt, elk met een eigen register en taak ([MUSIC-THEORY §10](MUSIC-THEORY.md#10-arrangeren)). Houd het klein: 3 tot 6 klankbronnen is genoeg.

Een maat duurt `240 / bpm` seconden. Dit blad is de basis van het hele nummer en van de review in stap 12.

Een bekende methode als beginpunt (de klassieke hitformule voor een dansbare popsingle): een dansgroove die doorloopt, hooguit 3:30, de volgorde intro, couplet, refrein, couplet, refrein, breakdown, dubbel refrein, outro, secties in veelvouden van 4 maten, een refrein van hooguit 8 maten en tempo hooguit 135 BPM. Het apparaat [Remix](../devices/tools/Remix/AGENTS.md) heeft deze regels, vijf stijlen (tempo, toonsoort, akkoordgangen, basritme, slagwerk per sectie) en een hookgenerator als recepten; lees ze in zijn bestand als je een stijl nodig hebt. Het is een beginpunt: werk de toonsoort, de akkoorden en de structuur zelf uit op het blad.

### Stap 3. De sequencer kiezen en het nummer inrichten

Kies de sequencer die bij de vorm van het nummer past (tabel in [§5](#5-songstructuur-en-lengtes-in-maten) en [../devices/sequencers/AGENTS.md](../devices/sequencers/AGENTS.md)): bijvoorbeeld Clip Arranger voor scènes en een arrangement, Pattern Playlist of Pattern Tracker voor patronen in een volgorde, Chord Sequencer of Chord Buddy voor akkoorden. Lees zijn `AGENTS.md`.

- **Gebruik de presets van de sequencer voor de inrichting van het nummer**: het aantal en de soort sporen, de scènes of patronen, het arrangement met de lengte van de secties, de namen. Zoek in [../presets/AGENTS.md](../presets/AGENTS.md#de-packs) het pack van de sequencer en een preset in de map die bij je stijl past (voor Clip Arranger: de map van het genre in *Clip Arranger Song Starters*). Kopieer `state` letterlijk (zie stap 4 voor de werkwijze).
- **Gebruik ze niet voor de programmering van tracks en clips.** De noten, de akkoorden, de ritmes en de CC- en instellingenlijnen in de clips schrijf je zelf in stap 5, uit je toonsoort, akkoordprogressie en structuur van stap 2. Een preset is de plattegrond van het nummer, niet de muziek.
- Pas de structuur aan je blad van stap 2 aan: zet het aantal maten per sectie, de volgorde, het aantal sporen en de namen gelijk aan wat je op papier hebt.
- Zet de sequencers in canvassectie **1 · Sequencers**.

### Stap 4. De muziekdevices kiezen en hun presets gebruiken

Kies per rol een apparaat uit [../devices/AGENTS.md](../devices/AGENTS.md) (tabellen per soort met `id`, poorten en links) en de sectie "Passende devices, tunes en presets" van de stijlgids. Gebruik de **soorten die Patchkamer biedt** voor wat de rol vraagt, niet steeds dezelfde twee synths: kijk bij elke rol naar synths, samplers en drumcomputers en kies wat het beste klinkt bij de stijl. Lees van **elk gekozen apparaat** zijn `AGENTS.md` (laatste kolom van de tabel): daar staan de state, de bereiken en de valkuilen.

Kijk **voor elk device naar zijn tunes en presets** en gebruik ze:


- **Apparaten die geluid maken** (`kind: instrument`: synths, samplers, drums) hebben **tunes** in `../tunes/`. Werkwijze en tabel van de packs: [../tunes/AGENTS.md](../tunes/AGENTS.md#tunes-gebruiken-in-een-song). Handleiding: [NL](../docs/tunes/USER-MANUAL_NL.md) · [EN](../docs/tunes/USER-MANUAL_EN.md).
- **Alle andere apparaten** (sequencers, effecten, mastering, modulators, mixer) hebben **presets** in `../presets/`. Werkwijze en tabel: [../presets/AGENTS.md](../presets/AGENTS.md#een-preset-in-een-song-gebruiken). Handleiding: [NL](../docs/presets/USER-MANUAL_NL.md) · [EN](../docs/presets/USER-MANUAL_EN.md).
- Zoek in het pack een tune of preset in de map met de naam van je stijl (`tree` → `folder` → `name`) en **kopieer `state` letterlijk** naar `state` van het apparaat in de song. Laat geen sleutels weg en voeg er geen toe. Zet geen routing of kabels in de state. Laat de sleutel `preset` weg.
- Pas daarna alleen aan wat bij **deze song** hoort: het patroon of de noten, het volume (`lvl`, `level`; de naam verschilt per apparaat, zie de `AGENTS.md`) en tempo-gebonden dingen. Laat de klankvelden staan; wil je een andere klank, kies dan liever een andere tune.
- Een tune kan **ook een patroon** bevatten (drumcomputers; sommige synths): dat is het startpunt voor je song. Pas het aan in de state, volgens de `AGENTS.md` van het apparaat.
- Een tune kan een **akkoordgeheugen** hebben (bijvoorbeeld Chord Poly met `chord` anders dan `none`): stuur dan enkelvoudige noten, anders speelt het apparaat akkoorden bovenop je akkoorden.
- Er is niet voor elk apparaat een pack. Mixer en Speakers hebben er geen: schrijf hun state zelf volgens hun `AGENTS.md` (Mixer: kanalen met `lvl` in dB, `pan`, `send`; Speakers: `lvl`).
- Hulpmiddel om een tune of preset te vinden: `python3 ../docs/tools/list-devices.py` genereert de tabellen; de tabellen in de drie `AGENTS.md`-bestanden zijn de uitkomst.

Zet de apparaten in canvassectie **2 · Instruments**.

### Stap 5. De sequencerinhoud schrijven (tracks en clips)

Schrijf de noten met de velden van de gekozen sequencer. Per apparaat gelden eigen regels; lees die in zijn `AGENTS.md`. Algemeen:

- **Noot en positie.** Nootnummers zijn MIDI (60 = C4, 36 = C2). Een maat is 16 stappen op een 1/16-raster. Kies posities op papier met de rasterleesregel van [styles/README.md](styles/README.md#leesregel-voor-ritmerasters) en [MUSIC-THEORY §7](MUSIC-THEORY.md#7-ritme).
- **Toonlengte.** Kort (staccato) 0,3 tot 0,5 stap, normaal 0,5 tot 0,7, gebonden tot de volgende noot, pads de hele akkoordduur. Hoe dat in de velden heet verschilt: Step Sequencer `ln` en `gate`, Chord Sequencer `len` per stap en `t<n>gate`, Pattern Tracker `len` in rijen, Clip Arranger `len` in zestienden. Zie de sequencer-handleiding ([NL](../docs/sequencers/USER-MANUAL_NL.md#velocity-en-lengte)).
- **Velocity.** Altijd een eigen waarde per noot, tussen 0,05 en 1: accent 0,9 tot 1, normaal 0,7 tot 0,85, zacht 0,5 tot 0,6, ghost 0,25 tot 0,4. Nooit 0 voor een noot die moet klinken (bij Step Sequencer betekent `vel` 0 "automatisch"; een rust is `n` = -1). Zie [MUSIC-THEORY §8](MUSIC-THEORY.md#8-dynamiek-en-articulatie).
- **Timing.** Swing zit in de klok (`workspace.swing`); extra feel via `mt` (Step Sequencer), `DEL` (Pattern Tracker) of een kwart stap in `step` (Clip Arranger). Zet swing niet dubbel (host én sequencer). Zie [NL](../docs/sequencers/USER-MANUAL_NL.md#raster-116-132-en-164).
- **Raster.** De opslageenheid van een patroon hangt af van `res` (Step Sequencer), `rowsPerBeat` (Pattern Tracker), `grid`/`division` (Chord Sequencer) of zestienden (Clip Arranger). Verander je het raster, schrijf de stappen dan opnieuw.
- **Volledige lijsten.** Step Sequencer wil in `n`, `vel`, `ln`, `acc` en `mt` altijd 64 plaatsen. Een lijst die korter is, laat het beginpatroon van het apparaat staan.
- **Binnen het patroon.** Elke noot ligt binnen de lengte van het patroon en van de clip; een noot erbuiten wordt afgekapt of nooit gespeeld.
- **Akkoorden en bas.** Zet de bas in een eigen register (28 tot 48) onder de akkoorden (48 en hoger). Laat bas en kick elk een eigen ritme.

### Stap 6. Modulatie bepalen

Beslis nu waar het geluid moet bewegen: een filter dat opent in de opbouw, een pad dat ademt, een pan die langzaam wandelt, een bas die pompt. Gebruik de modulators (LFO, Macro, Drift, Swell, MSEG, Follower; [../devices/modulators/AGENTS.md](../devices/modulators/AGENTS.md)) en kies **een preset uit hun pack** in de map die bij de stijl of het doel past (*By Genre*, *Build-ups*, *Filter Sweeps*, enzovoort; [../presets/AGENTS.md](../presets/AGENTS.md#de-packs)). Kopieer `state` letterlijk en pas alleen de toewijzing aan (welk doel, welke parameter, hoe diep) en tempo-gebonden waarden. Modulatie ondersteunt de muziek: een beweging die op de maat van het nummer valt klinkt gewild, een willekeurige niet. Gebruik niets dat de song niet vraagt. Zet de modulators in canvassectie **3 · Modulation**; de kabels komen in stap 8.

### Stap 7. Effecten kiezen, met hun presets

Kies pas nu de effecten, nadat de klankbronnen en de modulatie vaststaan, en kies ze om een reden (ruimte, kleur, dynamiek, beweging), per kanaal of als send-effect op de Mixer. Zoek bij elk effect in [../presets/AGENTS.md](../presets/AGENTS.md#de-packs) het pack en de preset die bij je stijl en bij de bron past, kopieer `state` letterlijk en pas alleen aan wat bij deze song hoort (mix, tijd in noten van het tempo). Eén galm of delay als send voor alle kanalen is meestal beter dan een galm op elke bron. Lees van elk effect zijn `AGENTS.md` ([../devices/effects/AGENTS.md](../devices/effects/AGENTS.md)). Zet de effecten in canvassectie **4 · Effects**.

### Stap 8. Kabels

Leg één kabel per verbinding vast in `cables`. Controleer elke poort-`id` in de tabel van [../devices/AGENTS.md](../devices/AGENTS.md#de-apparaten).

1. **Noten:** sequencer-uitgang (`notes`, `a`, `track1`, …) → `notes` van de synth (`event`). Een drumcomputer met eigen patroon heeft deze kabel niet nodig.
2. **Geluid:** synth (`out`) → eventueel een effect (`in` → `out`) → Mixer (`ch1`, `ch2`, …) of direct Speakers (`in`). Drumcomputers met meer uitgangen: `out` of `mix` voor de som, of `multi` naar `multi` van de Mixer.
3. **Send en return:** Mixer `s1` → effect `in`, effect `out` → Mixer `r1`. Zo staat de galm één keer voor alle kanalen.
4. **Uitgang:** Mixer `out` → eventueel [Master Chain](../devices/mastering/MasterChain/AGENTS.md) (`in` → `out`) → Speakers `in`.
5. **Modulatie (optioneel):** modulator `mod` → doel `mod` (kind `mod`). De toewijzing staat in de state van de modulator (zie zijn `AGENTS.md`).
6. Elke notenpoort die je gebruikt heeft een klankbron; elke klankbron heeft een weg naar **Speakers**. Een ontbrekende kabel naar Speakers geeft een stille song.

### Stap 9. Afmixen en mastering

- Niveaus op hoofdlijnen: [MUSIC-THEORY §11](MUSIC-THEORY.md#11-mixen-op-hoofdlijnen). Begin met kick en bas, voeg de rest zachter toe.
- De Mixer rekent in dB (`lvl` −60 tot 6, standaard −6; master 0). Zet kanalen tussen −8 en −16 dB als je meerdere bronnen optelt; zet ze zachter als `check-song.py` een te hoge piek meldt.
- Master Chain: kies een preset uit de map `Styles` die bij je stijl past (de namen zijn genres) en zet het plafond (`ceiling`) op −3 dBTP of lager. Speakers heeft een begrenzer (drempel −3 dB) achter het volume (`lvl` standaard 0,8), maar laat je mix niet op die begrenzer rekenen.
- Meer over mastering: [NL](../docs/mastering/USER-MANUAL_NL.md) · [EN](../docs/mastering/USER-MANUAL_EN.md).
- Zet de Mixer, Master Chain en Speakers in canvassectie **5 · Mix and master**.

### Stap 10. Het canvas indelen

Zet de apparaten in de vijf secties van [de tabel hierboven](#de-volgorde-en-de-canvassecties) en schrijf `workspace.sections` volgens [§2](#canvassecties). Houd per sectie de volgorde van links naar rechts aan (sequencers, instrumenten, modulatie, effecten, mix en mastering), zodat de signaalrichting op het canvas klopt en de nummers 1 tot 5 van links naar rechts oplopen.

### Stap 11. Controleren

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

### Stap 12. Review voor vrijgave

Een song gaat pas naar de gebruiker nadat hij is **gereviewd op harmonie, opbouw en muziektheorie**. Doe dit als een aparte ronde, bij voorkeur door een andere agent die alleen het bestand en je blad van stap 2 krijgt (die kijkt zonder jouw aannames), en zo niet, dan zelf met een pauze tussen schrijven en lezen. Lees de noten uit het bestand, niet uit je geheugen. Controleer:

- **Harmonie.** Elke noot ligt in de toonladder of is een bewuste afwijking (chromatische doorgang, blue note, leadingtone). Akkoorden kloppen met de progressie van stap 2 (MIDI-nummers, inversies, stemvoering zonder grote sprongen). Bas en akkoorden botsen niet (de bas speelt de grondtoon of een akkoordtoon op de maat). Geen twee bronnen die dezelfde functie in hetzelfde register spelen. Hoogste en laagste noot per rol liggen binnen het register van de rol ([MUSIC-THEORY §10](MUSIC-THEORY.md#10-arrangeren)).
- **Opbouw.** Het aantal maten per sectie klopt met stap 2 en met het arrangement. Er verandert iets elke 8 maten (nieuwe rol, filter, fill). Er is een verloop: een intro die opbouwt, spanning en ontlading, een break of drop op een plek die het hoort, een einde dat rustig uitloopt of netjes sluit ([§5](#5-songstructuur-en-lengtes-in-maten)). Geen sectie die alleen een kopie is zonder verandering. Elke sectie heeft een doel dat je in één zin kunt zeggen.
- **Muziektheorie en ritme.** Ritme en accenten volgen de stijl (kick, backbeat, swing niet dubbel), velocity en articulatie variëren, de dynamiek loopt mee met de structuur ([MUSIC-THEORY §7, §8 en §13](MUSIC-THEORY.md#13-controlelijst)). Modulatie en effecten ondersteunen de muziek en niet andersom.
- **Techniek.** De controles van stap 11 zijn groen en elke rol is bij solo hoorbaar.

Vind je een fout, herstel hem in het bestand en herhaal stap 11 en 12. Een review die niets vindt, schrijf je ook op ("geen bevindingen" met wat je controleerde). Je kunt niet luisteren: schrijf in de oplevering dat harmonie, opbouw en theorie op papier zijn gecontroleerd en niet gehoord.

### Stap 13. Opleveren

Lever op: het pad van het bestand, de stijl en de structuur (secties met maten en de duur), tempo en toonsoort, de gebruikte apparaten en tunes/presets (naam en map), de contractversie (`patchkamer`), de uitkomst van de review van stap 12 (bevindingen en wat je herstelde), de canvassecties (nummers en namen), de uitvoer van `check-song.py` (exitcode, piek, aantal fouten en waarschuwingen) en **wat je niet hebt kunnen controleren**. Schrijf dat je niet hebt geluisterd.

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
- **Volgorde van de werkwijze.** Stijl en muziektheorie eerst, dan sequencer, instrumenten, modulatie, effecten, en als laatste mixen en mastering ([§4](#4-werkwijze-stap-voor-stap)). Gebruik bij elke soort de presets en tunes van het apparaat als beginpunt.
- **Presets zijn de plattegrond, niet de muziek.** Gebruik sequencerpresets voor de inrichting van het nummer (sporen, scènes, arrangement), maar schrijf de noten en patronen in de tracks en clips zelf.
- **Canvassecties.** Elke soort apparaat staat in zijn eigen genummerde canvassectie ([Canvassecties](#canvassecties)).
- **Geen vrijgave zonder review** op harmonie, opbouw en muziektheorie (stap 12).
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
| Clipinhoud uit een sequencerpreset overgenomen | de song klinkt als de preset en niet als jouw akkoorden en structuur | kopieer van de preset alleen sporen, scènes en arrangement; schrijf `notes`, `cc` en `auto` van de clips zelf (stap 5) |
| Apparaat in geen of twee canvassecties, of een `n` dubbel | de sectie klopt niet met de volgorde van de werkwijze | `members` samen = alle `devices`, geen dubbele `id`, elke `n` één keer |
| Review overgeslagen | akkoorden die niet in de toonladder passen, een sectie zonder verloop | stap 12: harmonie, opbouw en theorie langs, bevindingen opschrijven |
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
- [../docs/tools/check-song.py](../docs/tools/check-song.py): controleert en meet een song (zie [Stap 11](#stap-11-controleren))
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
