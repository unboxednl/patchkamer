# AGENTS.md: Latin Percussion

Dit bestand is voor AI-agents die **tunes voor Latin Percussion** maken of het apparaat configureren. Het is niet geschreven voor mensen. Het hoort bij `../../../AGENTS.md` (algemeen) en `../../../tunes/AGENTS.md` (regels voor tunes); lees die eerst. Hier staat wat alleen voor Latin Percussion geldt.

## Wat Latin Percussion is

Vijftien eigen gesynthetiseerde latin-percussieklanken (bongo's, conga's, timbales, agogo's, cabasa, maracas, fluitjes, quijada en star chime) die je speelt met pads, met externe trigs of noten, of met een eigen patroon op de klok van de host. Elk klank heeft niveau, tuning, decay en pan; daarbij komen een korrel (8-bit) over de hele uitgang, choke-groepen en een hoofdniveau. Er zijn vier banken (A tot D) met elk een patroon van 15 × 16 stappen; de interne klok speelt de gekozen bank. De klank wordt gesynthetiseerd in een AudioWorklet (met een terugval in de pagina). Er zijn geen samples.

| | |
|---|---|
| Bestand | `latin-percussion.patchkamer-device.js` (in deze map) |
| `id` | `nl.patchkamer.latinpercussion`. Verander die nooit: daaraan hangen tunes en songs van gebruikers |
| Naam | `Latin Percussion` in alle talen; alleen de poortnamen hebben een Nederlandse variant (via `i18n`); alle tekst in de kaart staat in `TXT` (nl en en) |
| Soort | `instrument`: dit apparaat krijgt dus **tunes** (geen presets) |
| Poorten | audio-uitgang `out` (Stereo), eventingang `notes` (Noten / trigs), modulatie-ingang `mod` |
| Contract | v1.11 |
| Licentie apparaat | AGPL-3.0-or-later |

Dit apparaat is de nieuwe, bijgewerkte vorm van een ouder bestand met een andere naam en id. Tunes of songs uit die tijd verwijzen naar de oude id en laden hier niet in. De motor bevatte takken voor andere instrumenten; die zijn eruit.

## De pads

| n | Lane-id | Klank | Pad-id | Standaardnoot (MIDI) |
|---|---|---|---|---|
| 0 | `hibongo` | High Bongo | `pad1` | 36 |
| 1 | `lobongo` | Low Bongo | `pad2` | 37 |
| 2 | `muteconga` | Mute High Conga | `pad3` | 38 |
| 3 | `openconga` | Open High Conga | `pad4` | 39 |
| 4 | `loconga` | Low Conga | `pad5` | 40 |
| 5 | `hitimbale` | High Timbale | `pad6` | 41 |
| 6 | `lotimbale` | Low Timbale | `pad7` | 42 |
| 7 | `hiagogo` | High Agogo | `pad8` | 43 |
| 8 | `loagogo` | Low Agogo | `pad9` | 44 |
| 9 | `cabasa` | Cabasa | `pad10` | 45 |
| 10 | `maracas` | Maracas | `pad11` | 46 |
| 11 | `shortwhistle` | Short Whistle | `pad12` | 47 |
| 12 | `longwhistle` | Long Whistle | `pad13` | 48 |
| 13 | `quijada` | Quijada | `pad14` | 49 |
| 14 | `starchime` | Star Chime | `pad15` | 50 |

Een noot speelt pad `n` als de noot gelijk is aan `baseNote + n` (standaard 36 + n). Een trig `{ type: 'trig', lane: '<lane-id of pad-id>', vel }` op de poort `notes` speelt dat pad. Een `cc` met een parameter-id (hieronder) zet die parameter; `value` loopt van 0 tot 1 over het bereik.

## De state

`state` van een tune is wat `getPreset()` teruggeeft: `getState()` zonder het gekozen pad (`lane`). Een tune hoeft alleen te bevatten wat afwijkt; wat ontbreekt krijgt de standaardwaarde.

| Veld | Wat | Waarden | Start |
|---|---|---|---|
| `d<n>level` | Niveau van pad n (n = 0 … 14) | 0 … 1 | 0,65 |
| `d<n>tune` | Tuning van pad n | −12 … 12 halve tonen | 0 |
| `d<n>decay` | Uitklinktijd van pad n, als factor | 0,3 … 2 | 1 |
| `d<n>pan` | Pan van pad n | −1 … 1 | 0 |
| `grit` | 8-bit korrel over de hele uitgang | 0 … 1 | 0,6 |
| `level` | Hoofdniveau | 0 … 1 | 0,8 |
| `sequence` | Het eigen patroon speelt op de klok (anders alleen pads en externe trigs) | boolean | `true` |
| `choke` | Gedeelde choke-groepen (een nieuwe slag kapt een klank uit dezelfde groep af) | boolean | `true` |
| `bank` | Gekozen bank | geheel getal 0 … 3 (A … D) | 0 |
| `baseNote` | MIDI-noot van het eerste pad | geheel getal 0 … 112 | 36 |
| `preset` | Naam van het gekozen klankbeeld | `Latin Motor`, `Detroit Percussion`, `Metal Carnival` of `Whistle Dub` | `Latin Motor` |
| `testNote` | Testnoot | geheel getal 24 … 96 | 48 |
| `patternData` | De vier banken | lijst van 4 **tekstwaarden**: elke tekst is JSON van 15 rijen (pad 0 … 14) met 16 stappen: `0` rust, `1` slag, `2` accent | de standaardpatronen |

Let op `patternData`: elke bank is een JSON-tekst, geen lijst. Een bank die ontbreekt of niet te lezen is krijgt de standaardbank; stappen buiten 0 … 2 worden afgekapt.

Wat Latin Percussion met een state doet (getest): getallen buiten het bereik worden afgekapt; een tekst, `null`, `NaN`, `±Infinity` of een ontbrekende waarde geeft de startwaarde; `sequence` en `choke` worden alleen overgenomen als ze een boolean zijn; een onbekend `preset` geeft `Latin Motor`; onbekende velden worden genegeerd.

Modulatie: `modulate` (poort `mod`) neemt alleen eindige getallen tussen −1 en 1 aan voor bestaande parameter-id's (`d<n>level`, `d<n>tune`, `d<n>decay`, `d<n>pan`, `grit`, `level`); al het andere wordt genegeerd. Modulatie verandert nooit de bewaarde waarden.

## Tunes maken

- Een pack heet `naam.patchkamer-tunes.json` en staat in `../../../tunes/` (licentie `CC0-1.0`); `device` is `nl.patchkamer.latinpercussion`, elke tune is `kind: "set"`. Lees `../../../tunes/AGENTS.md` voor het formaat.
- Een tune is een **ritme met klank**: een patroon (in `patternData`) plus de instellingen van de pads. Gebruik de banken A tot D voor varianten (hoofdritme, variatie, fill, break); de klok speelt de bank die in `bank` staat. Geef elke tune een Engelse naam, zonder merk- of modelnamen, ook niet in de vorm "in de stijl van …".
- Gebruik precies de sleutels hierboven, met waarden binnen het bereik. Maak alleen tunes als de opdracht dat vraagt.

## Controleren

- `node contract/validate-instrument.mjs devices/drums/LatinPercussion/latin-percussion.patchkamer-device.js --lang nl` en `--lang en`, vanuit de root. Beide moeten `OK` geven, zonder `let op`.
- Je kunt niet horen hoe een tune klinkt. Schrijf in je oplevering dat het **niet beluisterd** is.
- Het geluid is bewezen gelijk aan dat van het oude bestand: de audiomotor geeft sample voor sample dezelfde uitvoer in 60 willekeurige runs (32 miljoen samples, bij 44,1, 48 en 96 kHz, met events, parameterwijzigingen en panic), en de hele keten (state, patronen, events, graaf van audioknooppunten) is identiek in 25 willekeurige configuraties (14 miljoen samples). Een geluidswijziging moet dus een bewuste keuze zijn.

## Wat je niet doet

- Verander nooit de `id`, de `kind`, de poort-id's, de parameter-id's (`d0level` enzovoort) of de namen van state-velden.
- Pas het apparaat niet aan om een tune te laten kloppen.
- Zet geen merknamen van bestaande apparatuur in naam, omschrijving of tune, en verzin geen persoon bij `author`.
- Commit of push niet, tenzij de opdracht dat vraagt.
