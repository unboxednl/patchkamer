# AGENTS.md: Neuro Bass

Dit bestand is voor AI-agents die **tunes voor Neuro Bass** maken of een song met dit apparaat componeren. Het is niet geschreven voor mensen. Het hoort bij `../../../AGENTS.md` (algemeen) en `../../../tunes/AGENTS.md` (regels voor tunepacks); lees die eerst. Hier staat wat alleen voor Neuro Bass geldt.

## Wat Neuro Bass is

Een monofone bas voor drum & bass en bass music (één noot tegelijk, de laatste noot wint) **zonder eigen sequencer of arpeggiator**: hij speelt alleen noten die binnenkomen op de ingang `notes`. De signaalweg:

1. **Oscillatoren:** twee oscillatoren met elk twee stemmen (een detune-stack) en een sinus-sub. Oscillator 2 kan oscillator 1 in toonhoogte moduleren (FM) en ringmoduleren.
2. **Crossover** (Linkwitz-Riley, 4e orde, `xover`): het laag en de sub blijven **schoon en mono**; alleen de hoge band gaat door de rest van de keten. Na de vervorming volgt nog een hoogdoorlaat op dezelfde frequentie, zodat de lage band alleen uit de schone bronnen bestaat.
3. **Drie vervormtrappen** (`shape1` … `shape3`: fold, clip, soft, asym, rectify, bit) met een hoeveelheid per trap.
4. **Formantfilter:** drie parallelle banddoorlaten op de formanten van klinker A naar klinker B; `morph` zet de plek ertussen (de macro), `lfoMorph` laat hem bewegen.
5. **Hoofdfilter** (lowpass 24 dB, lowpass 12 dB of bandpass) met resonantie en een filter-envelope, daarna het volume van de hoge band (wobble).
6. **Versterker:** ADSR, daarna een compressor en een zachte begrenzer (lineair tot −4,4 dB, daarboven een knie naar 1), zodat de uitgang nooit boven 0 dBFS komt.

De LFO is een lus van één periode die bij een noot opnieuw begint (`lfoSync` `note` of `sync`) of vrij loopt. Op tempo volgt hij `host.bpm` (120 als de klok niet draait). Er is geen worklet: alleen standaard Web Audio-nodes.

| | |
|---|---|
| Bestand | `neuro-bass.patchkamer-device.js` (in deze map) |
| `id` | `nl.patchkamer.neurobass`. Verander die nooit: daaraan hangen tunes en songs van gebruikers |
| Naam | `Neuro Bass` in alle talen; alleen de poortnamen en de labels hebben een Nederlandse variant |
| Soort | `instrument`: dit apparaat krijgt dus **tunes** (geen presets) |
| Poorten | eventingang `notes` (Notes / Noten), modulatie-ingang `mod`, audio-uitgang `out` (Bass out / Bas uit, mono) |
| Contract | v1.34 |
| Versie | 1.0.0 |
| Licentie apparaat | AGPL-3.0-or-later |

## Wat je hier doet

Je maakt klanken (tunes) voor Neuro Bass en zet ze als pack in `../../../tunes/`. Het apparaat zelf pas je alleen aan als de opdracht dat zegt (`version` ophogen; `id`, poort-id's en state-velden gelijk houden).

## De state

`state` van een tune is wat `getState()` teruggeeft: 43 velden, alleen knoppen en keuzes. Er is **geen patroon**: een tune is een klank, de noten komen uit de song. Een veld dat je weglaat krijgt de startwaarde; zet in een tune liever alle velden.

### Getallen

| Veld | Wat | Bereik | Start |
|---|---|---|---|
| `detune` | Spreiding van de twee stemmen van elke oscillator, in cent (de ene staat dit lager, de andere hoger, geschaald met `unison`) (lineair) | 0 … 60 | 12 |
| `unison` | Sterkte van de tweede stem per oscillator en hoe ver de stemmen uit elkaar staan (0 = één stem) (lineair) | 0 … 1 | 0.8 |
| `mix2` | Niveau van oscillator 2 (lineair) | 0 … 1 | 0.6 |
| `pitch2` | Toonhoogte van oscillator 2 in halve tonen (lineair) | -24 … 24 | 0 |
| `fm` | FM-index: oscillator 2 moduleert de toonhoogte van oscillator 1 (volgt de noot) (lineair) | 0 … 8 | 0 |
| `ring` | Ringmodulatie van oscillator 1 met oscillator 2 (alleen de hoge band) (lineair) | 0 … 1 | 0 |
| `sub` | Niveau van de schone sinus-sub (lineair) | 0 … 1 | 0.6 |
| `xover` | Crossover (Hz): onder deze frequentie blijft het geluid schoon en mono, alleen erboven wordt vervormd (logaritmisch) | 40 … 300 | 100 |
| `amt1` | Hoeveelheid van trap 1 (de Morph-macro telt er tot 0,25 bij op) (lineair) | 0 … 1 | 0.5 |
| `amt2` | Hoeveelheid van trap 2 (lineair) | 0 … 1 | 0.3 |
| `amt3` | Hoeveelheid van trap 3 (lineair) | 0 … 1 | 0 |
| `morph` | Positie tussen `vowelA` en `vowelB` (macro) (lineair) | 0 … 1 | 0.3 |
| `formant` | Hoeveel van het formantfilter te horen is (lineair) | 0 … 1 | 0.6 |
| `fq` | Scherpte (Q) van de formanten (logaritmisch) | 1 … 20 | 5 |
| `cutoff` | Cutoff van het hoofdfilter (Hz) (logaritmisch) | 60 … 16000 | 3000 |
| `resonance` | Resonantie van het hoofdfilter (lineair) | 0 … 1 | 0.2 |
| `fenv` | Filter-envelope in octaven (valt terug met `decay`; velocity en accent versterken) (lineair) | 0 … 5 | 1 |
| `lfoRate` | LFO-snelheid in Hz (bij `lfoSync` `free` en `note`) (logaritmisch) | 0.05 … 30 | 2 |
| `lfoMorph` | Diepte van de LFO op de formantpositie (lineair) | 0 … 1 | 0 |
| `lfoCut` | Diepte van de LFO op de cutoff (tot ±3 octaven) (lineair) | 0 … 1 | 0 |
| `lfoDrive` | Diepte van de LFO op trap 2 (lineair) | 0 … 1 | 0 |
| `lfoWob` | Diepte van de LFO op het volume van de hoge band (1 = tot stil) (lineair) | 0 … 1 | 0 |
| `attack` | Attack (s) (logaritmisch) | 0.001 … 2 | 0.004 |
| `decay` | Decay van versterker en filter (s) (logaritmisch) | 0.02 … 3 | 0.4 |
| `sustain` | Sustain (lineair) | 0 … 1 | 0.8 |
| `release` | Release (s) (logaritmisch) | 0.01 … 4 | 0.15 |
| `glide` | Glide-tijd bij legato (s) (logaritmisch) | 0.001 … 1.5 | 0.04 |
| `accent` | Extra volume en filter-envelope bij een harde aanslag (lineair) | 0 … 1 | 0.4 |
| `level` | Uitgangsniveau (lineair) | 0 … 1 | 0.5 |
| `bend` | Vaste toonhoogteverschuiving in halve tonen (lineair) | -12 … 12 | 0 |

### Keuzes

| Veld | Wat | Waarden | Start |
|---|---|---|---|
| `wave1` | Golfvorm van oscillator 1 | `sawtooth`, `square`, `pulse`, `triangle`, `sine` | `sawtooth` |
| `wave2` | Golfvorm van oscillator 2 | idem | `sawtooth` |
| `subOct` | Sub-octaaf: 0 = op de grondtoon, -1 = een octaaf lager | `0` of `-1` | `0` |
| `shape1` | Soort van vervormtrap 1 | `off`, `fold`, `clip`, `soft`, `asym`, `rectify`, `bit` | `fold` |
| `shape2` | Soort van trap 2 | idem | `clip` |
| `shape3` | Soort van trap 3 | idem | `off` |
| `vowelA` | Klinker A van het formantfilter | `oo`, `oh`, `ah`, `eh`, `ee`, `ue` | `oo` |
| `vowelB` | Klinker B | idem | `ee` |
| `ftype` | Soort hoofdfilter | `lp24`, `lp12`, `bp` | `lp24` |
| `lfoShape` | Vorm van de LFO | `sine`, `triangle`, `square`, `saw`, `ramp`, `steps` | `sine` |
| `lfoSync` | LFO vrij (`free`), per noot herstart op vaste snelheid (`note`) of op tempo (`sync`, herstart per noot) | `free`, `note`, `sync` | `free` |
| `lfoDiv` | LFO-maat bij `sync` | `1/1`, `1/2`, `1/2T`, `1/4`, `1/4T`, `1/8`, `1/8T`, `1/16`, `1/16T`, `1/32` | `1/8` |
| `legato` | Legato: overlappende noten glijden (met `glide`) | `true` of `false` | `true` |

Wat het apparaat met een state doet (getest): getallen buiten het bereik worden afgekapt, een tekst, `NaN`, `null` of een ontbrekende waarde geeft de startwaarde, een ongeldige keuze geeft de startwaarde, `setState` met iets anders dan een object geeft alle startwaarden en onbekende velden worden genegeerd. Wijzigingen worden zacht doorgevoerd (`setTargetAtTime`).

### Hoe de noten binnenkomen

Een event op de ingang `notes` heeft `type` `note`, `noteon` of `noteoff` met een `note` (MIDI, 0 … 127), `vel` (0 … 1, standaard 0,8; 0 telt als noteoff) en `time`. `dur` (s) is de lengte van een noot; met `held: true` blijft hij klinken tot een `noteoff`. Een `panic` of `allnotesoff` zet alles uit. Een event met `type` `cc`, een `id` van een getalveld hierboven en een `value` van 0 … 1 zet dat veld. Het tempo voor `lfoSync` `sync` komt uit `host.bpm` en `onStep`.

### Modulatie

Alle 30 getalvelden zijn te moduleren (spoor `neuro`). `on` in de parameterlijst is alleen een **voorstel** voor een modulator: aan staan klankvelden (detune, unison, fm, ring, drives, morph, formant, formant Q, cutoff, resonantie en de vier LFO-dieptes); uit staan toonhoogte (`pitch2`, `bend`), tijden, niveaus (`sub`, `level`, `accent`, `sustain`), `xover`, `fenv`, `lfoRate` en `glide`. De knop blijft de basis; een modulator telt er een uitslag van −1 … 1 bij op.

### Wat een bewaker doet

Een bewaker controleert om de 50 ms de uitvoer van de filterketen. Een filter dat ontspoort (`Infinity`, daarna `NaN`) zou voor altijd stil blijven; de bewaker vervangt dan de formantfilters en het hoofdfilter. De bronnen en vervormers zijn begrensd, de uitgang heeft een compressor en een zachte begrenzer. Getest: een zoektocht met 120 willekeurige en extreme reeksen (alle knoppen op hun minimum of maximum, modulatie ±1, noten 24 … 60, korte en lange noten, velocity 0,01 … 1) gaf 0 niet-eindige samples en een piek van hoogstens 1,0; alle 70 tunes met extreme modulatie ook 0.

## Een tune

Een pack heet `naam.patchkamer-tunes.json` en staat in `../../../tunes/`. Het formaat en de licentie (`CC0-1.0` voor alles in `tunes/`) staan in `../../../tunes/AGENTS.md`. Voor dit apparaat is `device` altijd `nl.patchkamer.neurobass` en elke tune is `kind: "set"` met een volledige `state` als hierboven. Zet geen merknamen van bestaande apparatuur in naam of omschrijving, noem geen artiesten en verzin geen persoon bij `author`.

Het meegeleverde pack `neuro-bass-styles.patchkamer-tunes.json` heeft 70 tunes in negen mappen (Neurofunk, Detune Stack, Liquid, Jump Up, Dancefloor, Sub, Dubstep and Bass Music, Techno, Stabs and Hits). Het niveau van elke tune is gelijkgetrokken: het RMS-niveau van de eerste 200 ms van elke noot (vier noten, 33, 36, 38 en 41, velocity 0,9) ligt op −17,3 dBFS, ongeveer 1 dB onder de mediaan van de Low Bass-tunes (−16,3 dB op dezelfde meting). Meet je nieuwe tunes op dezelfde manier en pas `level` aan.

### Wat werkt goed

| Soort | Instelling |
|---|---|
| Neurofunk | `detune` 10 … 20, `unison` 0,7 … 1, twee of drie trappen (`fold`, `clip`, `bit`), `formant` 0,5 … 1, `fq` 6 … 12, `lfoMorph` 0,5 … 1 met `lfoSync` `sync` en `lfoDiv` `1/8` of `1/4`, `cutoff` 2000 … 4000, `sub` 0,5 |
| Detune Stack | geen of één zachte trap (`soft`), `formant` 0, `detune` 12 … 40, `unison` 1, `cutoff` 700 … 2200, lange `sustain` |
| Liquid | `sub` 0,7 … 1, `xover` 100 … 130, één zachte trap, `cutoff` 500 … 1100, `detune` 3 … 10, `glide` 0,06 … 0,18 |
| Jump Up / dubstep wobble | `lfoWob` 0,6 … 1 en `lfoCut` 0,4 … 0,9 op `lfoDiv` `1/8`, `1/8T` of `1/4`, `sub` 0,35 … 0,5 (de sub wobbelt niet mee), `sustain` 1 |
| Sub | alle trappen `off`, `mix2` 0, `unison` 0, `detune` 0, `sub` 1, `cutoff` 120 … 200 |
| Stab of hit | `legato` `false`, `decay` 0,1 … 0,35, `sustain` 0 … 0,2, `fenv` 2 … 4 |

### Wat een tune niet doet

- Maak geen stille tune: `level` 0 of `sustain` 0 met lange noten geeft (bijna) niets te horen.
- Zet geen patroon of stappen in de state: dit apparaat heeft ze niet.
- Verwacht van de sub geen vervorming: alles onder `xover` is schoon. Wil je een basnoot met veel vervorming in de grondtoon, zet dan `xover` laag (40 … 60 Hz).
- Zet `lfoSync` `sync` niet in een tune voor een vaste snelheid zonder klok: het tempo komt van de klok (120 als hij stilstaat).
- Verzin geen velden of routing: er zit geen routing in de state.

## Skins

Alle knoppen en keuzelijsten zijn via `host.ui.adopt` herkenbaar voor skins: `id` is de state-sleutel, `role` is `param` (knoppen) of `select` (keuzelijsten) en `group` is `osc`, `shape`, `formant`, `filter`, `lfo` of `amp`. Elke sectie is een `section.sec` met `data-group`. Wijzig je de opbouw, controleer dan de skins.

## Controleren

- Draai vanuit de root van de repo: `node contract/validate-instrument.mjs devices/synths/NeuroBass/neuro-bass.patchkamer-device.js` (en met `--lang en`). Dat moet `OK` geven, zonder `let op`.
- Je kunt niet horen hoe een tune klinkt. Heb je een browser, laad dan de host (`../../../patchkamer/AGENTS.md`) en kies de tune. Heb je geen browser, schrijf dan in je oplevering dat de tune **niet beluisterd** is.
- Alle tekst in het apparaat staat in het woordenboek `EN` bovenin het bestand (Nederlandse bron, Engels via `host.lang`). Een nieuwe tekst krijgt altijd nl én en.

## Wat je niet doet

- Verander nooit de `id`, de `kind`, de poort-id's of de namen van state-velden.
- Pas het apparaat niet aan om een tune te laten kloppen.
- Commit of push niet, tenzij de opdracht dat vraagt.

## Documentatie en songs

Dit zijn de plaatsen waar je terechtkunt voor documentatie en voor het componeren van songs met dit apparaat. Songs zijn CC-BY-4.0, tunes en presets CC0-1.0, het apparaat AGPL-3.0-or-later.

- Handleiding van Neuro Bass: [NL](../../../docs/synths/USER-MANUAL_NL.md#neuro-bass) · [EN](../../../docs/synths/USER-MANUAL_EN.md#neuro-bass).
- Overzicht van de soort: [README](../README.md); handleiding van de hele soort: [NL](../../../docs/synths/USER-MANUAL_NL.md) · [EN](../../../docs/synths/USER-MANUAL_EN.md).
- Tunes (klanken, `kind: set`): [neuro-bass-styles.patchkamer-tunes.json](../../../tunes/neuro-bass-styles.patchkamer-tunes.json). Kies een tune als beginpunt voor de `state` van dit apparaat in de song; velden die de tune niet noemt krijgen hun standaard. Hoe tunes zijn opgebouwd: [tunes/AGENTS.md](../../../tunes/AGENTS.md).
- Overzicht van alle apparaten en hun signaalketens: [devices/AGENTS.md](../../../devices/AGENTS.md). Een song componeren: [songs/AGENTS.md](../../../songs/AGENTS.md).
- Route voor agents: [soort Synths](../AGENTS.md) → [devices/AGENTS.md](../../AGENTS.md) → [root AGENTS.md](../../../AGENTS.md). Contract: [NL](../../../contract/PATCHKAMER-CONTRACT_NL.md) · [EN](../../../contract/PATCHKAMER-CONTRACT_EN.md). Hoe tunes van dit apparaat zijn opgebouwd: [tunes/AGENTS.md](../../../tunes/AGENTS.md). <!-- agents-tree -->
- Rol in een song: bas voor drum & bass en bass music, monofoon (laatste noot wint) en zonder eigen sequencer of arpeggiator. Noten op `notes`, audio uit `out`. Stuur hem met een Step Sequencer; een tune met `lfoSync` `sync` volgt het tempo van de klok.
