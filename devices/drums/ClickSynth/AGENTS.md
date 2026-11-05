# AGENTS.md: Click Synth

Dit bestand is voor AI-agents die **tunes voor Click Synth** maken of het apparaat configureren. Het is niet geschreven voor mensen. Het hoort bij `../../../AGENTS.md` (algemeen) en `../../../tunes/AGENTS.md` (regels voor tunes); lees die eerst. Hier staat wat alleen voor Click Synth geldt.

## Wat Click Synth is

Een percussiesynth voor microgeluiden: kliks, tiks, bleeps, zaps, hout, glas, metaal en glitches. Acht sporen, elk met een eigen klankmotor die je boetseert (toonhoogte, pitch-envelope, kleur, karakter, ruis, decay, drive, crush, filter, pan, niveau en willekeur: elke slag net iets anders). Alles wordt sample-nauwkeurig gesynthetiseerd in een AudioWorklet; er zijn geen samples. Een eigen sequencer speelt op de klok van de host: 16 stappen per spoor, een eigen lengte per spoor (polyritme), vier patronen (A tot D) en per stap velocity, kans, ratchet en toonsprong.

| | |
|---|---|
| Bestand | `click-synth.patchkamer-device.js` (in deze map) |
| `id` | `nl.patchkamer.clicksynth`. Verander die nooit: daaraan hangen tunes en songs van gebruikers |
| Naam | `Click Synth` in alle talen; alleen de poortnamen hebben een Nederlandse variant (via `i18n`); alle tekst in de kaart staat in `TXT` (nl en en) |
| Soort | `instrument`: dit apparaat krijgt dus **tunes** (geen presets) |
| Poorten | audio-uitgang `out` (Stereo mix), eventingang `trigger` (Trigs / noten), modulatie-ingang `mod`, bundel-uitgang `multi` (Sporen los / Separate lanes: elk spoor apart) |
| Contract | v1.11 |
| Licentie apparaat | AGPL-3.0-or-later |

Dit apparaat is de nieuwe, bijgewerkte vorm van een ouder bestand met een andere naam en id (Klikwerk, `nl.patchkamer.klikwerk`). Tunes of songs uit die tijd verwijzen naar de oude id en laden hier niet in. De namen in de state zijn nu Engels: de klankmotoren (`tick`, `noise`, `modal` en `string` heetten `tik`, `ruis`, `modaal` en `snaar`), de kits, de namen van de sporen en de standen van "Klik op een stap" (`on`, `accent`, `chance`, `ratchet`, `tone`).

## De state

`state` van een tune is wat `getState()` teruggeeft (Click Synth heeft geen `getPreset`). Een tune hoeft alleen te bevatten wat afwijkt, maar de sporen horen bij elkaar: geef alle acht de sporen mee als je er een wijzigt.

| Veld | Wat | Waarden | Start |
|---|---|---|---|
| `kit` | Naam van de geladen kit | `Micro Click`, `Wood & Glass`, `Bleep Lab`, `Insects`, `Glitch Works`, `Minimal Techno` of `Custom` | `Micro Click` |
| `pattern` | Het patroon dat de kaart toont en de klok speelt | geheel getal 0 … 3 (A … D) | 0 |
| `run` | Eigen sequencer aan (uit: alleen spelen via de ingang) | boolean | `true` |
| `sel` | Gekozen spoor | geheel getal 0 … 7 | 0 |
| `mode` | Wat een klik op een stap doet | `on`, `accent`, `chance`, `ratchet` of `tone` | `on` |
| `master` | Hoofdniveau | 0 … 1 | 0,55 |
| `lanes` | De acht sporen | lijst van 8 sporen (hieronder) | de kit `Micro Click` |

Een spoor in `lanes`:

| Veld | Wat | Waarden | Start |
|---|---|---|---|
| `name` | Naam van het spoor (Engels) | tekst, hoogstens 20 tekens | per kit |
| `engine` | Klankmotor | `tick`, `bleep`, `fm`, `noise`, `modal`, `string`, `zap` of `glitch` (hieronder) | per spoor |
| `choke` | Afknijpgroep: een slag kapt andere sporen in dezelfde groep af | geheel getal 0 … 3 (0 = geen) | 0 |
| `ftype` | Filtersoort | `lp`, `bp` of `hp` | `lp` |
| `mute`, `solo` | Dempen en solo | boolean | `false` |
| `len` | Lengte van dit spoor (polyritme) | geheel getal 1 … 16 | 16 |
| `p` | De klankparameters (hieronder) | object met die sleutels | per spoor |
| `pats` | Vier patronen van 16 stappen | lijst van 4 lijsten van 16 stappen `{ v, p, r, t }` | alles uit |

Parameters in `p` (`pitch`, `ptime`, `decay` en `cut` werken logaritmisch bij modulatie):

| Sleutel | Wat | Bereik | Standaard bij een nieuw spoor |
|---|---|---|---|
| `pitch` | Toonhoogte | 20 … 12000 Hz | 400 |
| `penv` | Pitch-envelope (hoeveel de toon begint boven of onder `pitch`) | −48 … 48 halve tonen | 0 |
| `ptime` | Duur van de pitch-envelope | 0,001 … 0,5 s | 0,02 |
| `decay` | Uitklinktijd | 0,004 … 3 s | 0,12 |
| `color` | Kleur (betekenis per klankmotor, zie hieronder) | 0 … 1 | 0,3 |
| `shape` | Karakter (betekenis per klankmotor) | 0 … 1 | 0,5 |
| `noise` | Ruis toevoegen | 0 … 1 | 0 |
| `drive` | Verzadiging | 0 … 1 | 0 |
| `crush` | Bit-reductie en samplerate-reductie | 0 … 1 | 0 |
| `cut` | Filterfrequentie | 30 … 20000 Hz | 20000 |
| `res` | Resonantie van het filter | 0 … 1 | 0 |
| `pan` | Pan | −1 … 1 | 0 |
| `level` | Niveau | 0 … 1 | 0,8 |
| `vari` | Willekeur: elke slag net anders (toonhoogte, decay, kleur, karakter, pan en velocity) | 0 … 1 | 0,1 |

Een stap in `pats[patroon][n]`: `v` velocity (0 = geen slag; 0,45 zacht, 0,75 gewoon, 1 accent), `p` kans (0 … 1), `r` ratchet (1 … 4 slagen) en `t` toonsprong in halve tonen (−24 … 24).

Klankmotoren, met wat `color` en `shape` doen:

| `engine` | Wat | `color` | `shape` |
|---|---|---|---|
| `tick` | Impuls door een resonator | ruis in de klik | resonantie |
| `bleep` | Oscillator | sinus → blok → zaag | octaaf-FM |
| `fm` | FM-metaal | verhouding van de modulator | FM-diepte |
| `noise` | Ruis door een bandfilter | wit → donker | smalheid van het filter |
| `modal` | Modaal: hout → glas → metaal → vel | materiaal | hoge delen sterven sneller |
| `string` | Snaar (plukken) | helderheid | vervorming |
| `zap` | Laser | sinus → blok | fold |
| `glitch` | Stotter | stottersnelheid | boventonen |

Wat Click Synth met een state doet (getest): getallen buiten het bereik worden afgekapt; een tekst, `null`, `NaN`, `±Infinity` of een ontbrekende waarde geeft de startwaarde; een onbekende `engine` of `ftype` geeft de waarde van het spoor in `Micro Click`; er zijn altijd acht sporen, vier patronen en 16 stappen; onbekende velden worden genegeerd.

## Triggers en modulatie

- `onEvent` op `trigger`: `{ type: 'trig', lane: 'ch3' (elke tekst die op een cijfer eindigt telt), vel }` slaat dat spoor aan; een noot 36 … 43 of 60 … 67 slaat spoor 1 … 8 aan; `{ type: 'cc', id: 'l2.cut', value }` zet de parameter (`value` loopt van 0 tot 1 over het bereik); `panic` en `allnotesoff` kappen alle klanken af.
- `modulate` (poort `mod`) neemt alleen eindige getallen tussen −1 en 1 aan voor spoor-id's `l1.pitch` … `l8.vari`; al het andere wordt genegeerd. Modulatie verandert nooit de bewaarde waarden.

## Nootnamen voor sequencers

Click Synth heeft `noteNames()` (contract v1.14, `../../../contract/PATCHKAMER-CONTRACT_NL.md` §13b): de acht sporen met hun `name` op de noten 36 tot 43 (spoor 1 = 36). Een sequencer die er met een notenkabel aan hangt, toont die klanken als rijen (Step Sequencer) of drumrijen (Pattern Tracker, Pattern Playlist) en volgt wijzigingen van kit, volgorde of noot via `host.noteNamesChanged`. Een tune die de kanalen verandert, verandert dus ook wat de sequencer toont. Je hoeft er in een tune niets voor te doen.

## Tunes maken

- **Zet de eigen sequencer uit**: elke tune bevat `run: false`, zodat een gebruiker met zijn eigen sequencer kan beluisteren welke kit het best past. De patronen blijven in de tune staan; wie de eigen sequencer weer aanzet, hoort de groove. Laat dit veld in een nieuwe tune dus nooit weg (bij een ontbrekend veld start het apparaat zijn eigen sequencer).

- Een pack heet `naam.patchkamer-tunes.json` en staat in `../../../tunes/` (licentie `CC0-1.0`); `device` is `nl.patchkamer.clicksynth`, elke tune is `kind: "set"`. Lees `../../../tunes/AGENTS.md` voor het formaat.
- Een tune is een **kit**: acht sporen met klank en ritme. Zet `kit` op `Custom` voor een eigen kit. Geef elke tune en elk spoor een Engelse naam, zonder merk- of modelnamen, ook niet in de vorm "in de stijl van …".
- Gebruik precies de sleutels hierboven, met waarden binnen het bereik. Maak alleen tunes als de opdracht dat vraagt.

## Controleren

- `node contract/validate-instrument.mjs devices/drums/ClickSynth/click-synth.patchkamer-device.js --lang nl` en `--lang en`, vanuit de root. Beide moeten `OK` geven, zonder `let op`.
- Je kunt niet horen hoe een tune klinkt. Schrijf in je oplevering dat het **niet beluisterd** is.
- De audiomotor is bewezen gelijk aan die van het oude bestand: sample voor sample dezelfde uitvoer in 40 willekeurige runs (104 miljoen samples, met alle acht motoren, filters, choke-groepen en panic), en de hele keten (state, patronen, events en alle berichten naar de worklet) is identiek in 30 willekeurige configuraties. Een zoektocht met alle parameters op hun uiterste (498 miljoen samples) gaf geen enkel niet-eindig sample.

## Wat je niet doet

- Verander nooit de `id`, de `kind`, de poort-id's, de spoor-id's (`l1.pitch` enzovoort) of de namen van state-velden.
- Pas het apparaat niet aan om een tune te laten kloppen.
- Zet geen merknamen van bestaande apparatuur in naam, omschrijving of tune, en verzin geen persoon bij `author`.
- Commit of push niet, tenzij de opdracht dat vraagt.

## Documentatie en songs

Dit zijn de plaatsen waar je terechtkunt voor documentatie en voor het componeren van songs met dit apparaat. Songs zijn CC-BY-4.0, tunes en presets CC0-1.0, het apparaat AGPL-3.0-or-later.

- Handleiding van Click Synth: [NL](../../../docs/drums/USER-MANUAL_NL.md#click-synth) · [EN](../../../docs/drums/USER-MANUAL_EN.md#click-synth).
- Overzicht van de soort: [README](../README.md); handleiding van de hele soort: [NL](../../../docs/drums/USER-MANUAL_NL.md) · [EN](../../../docs/drums/USER-MANUAL_EN.md).
- Tunes (klanken, `kind: set`): [click-synth-styles.patchkamer-tunes.json](../../../tunes/click-synth-styles.patchkamer-tunes.json). Kies een tune als beginpunt voor de `state` van dit apparaat in de song; velden die de tune niet noemt krijgen hun standaard. Hoe tunes zijn opgebouwd: [tunes/AGENTS.md](../../../tunes/AGENTS.md).
- Overzicht van alle apparaten en hun signaalketens: [devices/AGENTS.md](../../../devices/AGENTS.md). Een song componeren: [songs/AGENTS.md](../../../songs/AGENTS.md).
- Rol in een song: percussie met microgeluiden (kliks, tiks, bleeps). Triggers of noten gaan naar de eventingang `trigger`; het apparaat heeft ook een eigen sequencer op de klok. Audio komt uit `out` (stereo mix) of per spoor via de bundel `multi`.
