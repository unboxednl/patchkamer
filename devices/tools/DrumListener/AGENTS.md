# AGENTS.md: Drum Listener

Dit bestand is voor AI-agents die dit apparaat configureren of er presets voor maken. Het is niet geschreven voor mensen. Het hoort bij `../../../AGENTS.md` (algemeen); lees die eerst. Hier staat wat alleen voor Drum Listener geldt.

## Wat Drum Listener is

Een gereedschap dat audio van een drumloop omzet in een patroon: kick, snare (met clap en rim), gesloten en open hat, toms en overige percussie op eigen banen. Het maakt zelf geen geluid. De bron is een audiobestand (knop **Audiobestand laden…**, of `loadAudio(files, info)` met `info = { name, bpm, bars }`) of een opname van enkele maten of seconden uit de audio-ingang `in` (bijvoorbeeld van Audio Capture). Het resultaat is een patroon dat je:

- kopieert met de knop Kopieer van de host (`clipInfo`/`getClip`, formaat `patchkamer-clip`, `kind: "drums"`, 12 tikken per zestiende, banen met `type` en GM-`note`) en plakt in een drumspoor van Pattern Tracker, Clip Arranger of Step Sequencer (met een drumcomputer eraan);
- met de klok naar een drumcomputer stuurt (eventuitgang `trigs`: `note` volgens General MIDI, of `trig` met `lane` = soort);
- bewaart als JSON-bestand (knop **Clip bewaren**).

| | |
|---|---|
| Bestand | `drum-listener.patchkamer-device.js` (in deze map) |
| `id` | `nl.patchkamer.drum-listener`. Verander die nooit: daaraan hangen presets en songs van gebruikers |
| Naam | `Drum Listener` in alle talen; alleen poortnamen hebben een Nederlandse variant (`i18n`); alle tekst staat in `TXT` (nl en en) |
| Soort | `utility` (categorie `tool`): dit apparaat krijgt dus **presets** (geen tunes). Er is nog geen presetpack |
| Poorten | audio-ingang `in` (In), audio-uitgang `thru` (Door / Through: de ingang ongewijzigd), eventuitgang `trigs` (Drum trigs); geen sturing |
| Contract | v1.22 (apparaatversie 1.21.0); geen contractwijziging nodig |
| Licentie apparaat | AGPL-3.0-or-later |
| Icoon | `icon.svg` in deze map |

## Hoe de analyse werkt (alles in het bestand, geen dienst op internet)

1. `prepare`: kanalen samengeteld, niet-eindige waarden en absurde pieken begrensd, trage gelijkspanningsfilter, genormaliseerd; stilte (piek < 1e-4) of korter dan 0,15 s geeft `error: 'silent'`. Een loop (`loop` of `bars` gegeven) krijgt de staart vooraan, zodat een slag op de eerste sample gezien wordt.
2. `spectrogramPlan`: 40 banden (40 Hz tot 16 kHz, logaritmisch), venster 1024 (2048 boven 50 kHz), stap 4 ms. De UI vult het in stukken van 600 frames met `setTimeout` ertussen, zodat de pagina niet vastloopt.
3. `onsets`: logaritmische positieve spectrale flux, drie detectoren (alle banen, <200 Hz, >5 kHz) met een lopende drempel; een lage-baanpiek tot 50 ms na een andere piek hoort bij die slag (trage kick).
4. `eventFeatures`: per slag 15 kenmerken (log-energie in 8 frequentiegebieden vlak na de slag boven het niveau ervoor, 4 gebieden in het midden, 2 aan het einde van de slag, 3 fluxwaarden), per bestand genormaliseerd op het 95e percentiel.
5. `labelEvents`: een klein netwerk (15 → 24 tanh → 4 sigmoïden) zegt per slag welke van kick, snare-familie, hat-familie en percussie meespelen (meerdere tegelijk mag). Daarna logistische modellen: open of gesloten hat, clap of rim of snare, tom of overig. Drempels: 0,5; snare en percussie 0,4 (`th`). De gewichten staan als `MODEL` bovenaan; ze zijn getraind op de Break Loops, op 64 gerenderde grooves met willekeurige patronen van alle tunes van Drum Kit en Pulse Drums, op tien eigen grooves, en op dezelfde loops met een bas (Low Bass) en een akkoordklank (Chord Poly) erdoor.
6. `transcribe`: tempo (`bpm` opgegeven; anders uit `bars` en de lengte; anders geschat uit de onsets met een kam op zestiende, achtste, tel, 2 tellen en maat), fase en swing (swing 0 tot 0,6 van een zestiende, alleen als het duidelijk beter past dan recht), raster `16`, `32`, triool-achtste `12`, triool-zestiende `24` (de fijnste straf is licht, dus het grofste raster dat past wint) en een velocity per slag uit de energie. Tikken zijn onbewogen (swing staat apart, in `swing`); een ontvanger zonder swing speelt recht.

## De state

`state` is wat `getState()` teruggeeft. `getPreset()` laat `clip`, `name` en `send` weg (instellingen, geen patroon en geen audio); `setPreset` laat die staan.

| Veld | Wat | Waarden | Start |
|---|---|---|---|
| `bpm` | Tempo; 0 = automatisch (uit het sample, de lengte of de onsets) | 0 of 40 … 300 | 0 |
| `bars` | Aantal maten; 0 = automatisch | 0, 1, 2, 3, 4, 6, 8, 12, 16 | 0 |
| `grid` | Raster | `auto`, 16, 32, 12, 24 | `auto` |
| `swing` | Swing; -1 = automatisch | -1 of 0 … 0,6 | -1 |
| `align` | Eerste tel: `smart` (begin van het geluid bij een loop met maten, anders zoeken), `auto` (zoek de eerste tel met kick op 1 en snare op 2 en 4), `start` | `smart`, `auto`, `start` | `smart` |
| `sens` | Gevoeligheid van de onsetdetectie | 0 … 1 | 0,5 |
| `rec` | Opnameduur | `b2`, `b4`, `b8` (maten, volgens `bpm` of de studioklok), `s5`, `s10`, `s20` (seconden) | `b4` |
| `send` | Patroon met de klok naar de drums sturen | boolean | `false` |
| `mode` | Uitvoer | `notes` (GM-noten), `trigs` (`lane` = soort) | `notes` |
| `level` | Velocity-factor bij het sturen | 0,1 … 1 | 0,9 |
| `clip` | Het patroon: `{ name, bpm, length (tikken, 12 per zestiende), grid, swing, lanes: [{ type, mute }], hits: [[tik, baan, velocity]], how, bars }` | gezuiverd bij `setState` (hoogstens 4096 slagen, 16 banen, bekende soorten) | `null` |

`setState` volgt §13: onbekende velden worden genegeerd, ongeldige waarden krijgen de standaard, een kapotte `clip` wordt `null`. De audio zelf zit nooit in de state.

## Banen en noten

`kick` 36, `snare` 38, `rim` 37, `clap` 39, `closedhat` 42, `openhat` 46, `lowtom` 41, `midtom` 47, `hitom` 50, overige percussie `conga` 63; de gebruiker kan een baan een andere soort geven (ook cowbell 56, crash 49, ride 51, shaker 70, tamb 54, bongo 60, clave 75, wood 76). Muteren kan per baan; een gemute baan staat niet in de gekopieerde clip. In het raster aanklikken voegt een slag toe of haalt hem weg (op een zestiende).

## Klembord

`clipInfo()` geeft `copy: ['drums']` en `paste: []` zodra er een patroon is (anders `null`); `setClip` geeft `{ ok: false, reason }`. `getClip()` geeft `kind: "drums"`, `length` in tikken, `grid` 16 of 32 (hint), `swing` hoogstens 0,5, `lanes` (`id`, `name`, `type`, `note`) en `hits` (`t`, `lane`, `vel`). Getest: de host leest de clip van het klembord (Kopieer in de kaart) en weigert plakken in een notenspoor met de bedoelde melding.

## Opnemen uit de ingang

AudioWorklet `nl-patchkamer-drumlistener-1-20-0` (kanalen samengeteld, blokken van 4096 frames, alleen tijdens het opnemen). Wijzig je de worklet-code, verhoog dan het versienummer in de naam. De opname is hoogstens 90 s. Bij `b2`, `b4`, `b8` met een ingevuld tempo is het aantal maten bekend en begint de analyse bij de eerste klank; anders wordt het tempo uit de audio geschat. Een opname uit een lopende loop begint willekeurig in de maat: laat `align` op `smart`/`auto` staan en verschuif zo nodig met ◀/▶ (een zestiende).

## Meetresultaten (gemeten, niet beluisterd)

Methode: slagen binnen ±30 ms van de ware slag (de instelling van de render: Drum Kit 1.14.2 en Pulse Drums 1.14.3, per slag de planningstijd); tikken exact gelijk aan de ware stap. Banen in families: kick; snare, clap en rim; hats (gesloten, open, shaker, ride, metaal); percussie (toms, conga, bongo, overig).

| Meting | kick F1 | snare/clap/rim F1 | hats F1 | percussie F1 |
|---|---|---|---|---|
| 14 Break Loops, elk apart weggelaten uit de training | 0,99 | 0,61 (precisie 0,78, recall 0,50) | 0,86 | 0,35 |
| 10 eigen grooves, niet in de training | 1,00 | 0,37 | 0,87 | 0,37 |
| 5 van die grooves, met bas en akkoordklank erdoor | 0,91 | 0,14 | 0,63 | 0 |
| Pulse Drums-loops, getraind op alleen Drum Kit | 0,90 | 0,34 | 0,79 | 0,39 |

Verder: stap en raster (bij opgegeven tempo) 100 % van de gevonden slagen op de juiste stap in de Break Loops, 99 % in de eigen grooves, 59 % met bas en akkoord erdoor; tempo blind (zonder tempo en maten) 12 van 14 Break Loops en 8 van 10 grooves goed binnen 1 %, de rest een octaaf te snel (88 gelezen als 176: gebruik ÷2); swing binnen 0,03 van de ware swing bij 12 van 14 Break Loops en 9 van 10 grooves (met opgegeven tempo). Analyse van twee maten: ongeveer 30 ms (hoogstens 90 ms), 90 s audio ongeveer 0,5 s (de spectrogramstap loopt in stukken). Zwak: open hat (recall 0,14 tot 0,18), rim (0,05 tot 0,08), clap en toms (te weinig voorbeelden), spookslagen van de snare onder hats, percussie in het algemeen, velocity van kick en hats (rangcorrelatie 0,16 en 0,31; bij de snare 0,74), en alles met een bas of akkoordklank erdoor. Echte opnames zijn niet getest.

## Wat je niet moet doen

- Geen tunes maken (het is een `utility`), en het `id` niet wijzigen.
- Geen netwerkverkeer in dit apparaat: de analyse draait lokaal.
- De audio niet in de state of in een preset zetten.
- Verander je `MODEL`, meet dan opnieuw op loops die niet in de training zaten (zie de tabel) en meld de getallen.

## Documentatie en songs

Hier vind je de omgeving van dit apparaat: de soort, de overzichten en de handleiding voor mensen.

- Route voor agents: [soort Tools](../AGENTS.md) → [devices/AGENTS.md](../../AGENTS.md) → [root AGENTS.md](../../../AGENTS.md). Contract: [NL](../../../contract/PATCHKAMER-CONTRACT_NL.md) · [EN](../../../contract/PATCHKAMER-CONTRACT_EN.md). Hoe presets van dit apparaat zijn opgebouwd: [presets/AGENTS.md](../../../presets/AGENTS.md). <!-- agents-tree -->
- Handleiding van de soort (voor mensen): [NL](../../../docs/tools/USER-MANUAL_NL.md) · [EN](../../../docs/tools/USER-MANUAL_EN.md); overzicht: [README](../README.md).
- Een song componeren met dit apparaat: [songs/AGENTS.md](../../../songs/AGENTS.md).
