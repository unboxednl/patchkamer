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
| Contract | v1.17 (apparaatversie 1.15.0) |
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

## Klembord: bank kopiëren en plakken (sinds 1.15.0)

De host kopieert en plakt het patroon met de knoppen Kopieer en Plak in de kaartbalk en met Ctrl/Cmd+C en Ctrl/Cmd+V (contract v1.17, formaat `patchkamer-clip` kind `drums`; tijd in **tikken**, 12 per zestiende, 192 per maat). Het apparaat levert en neemt alleen over: `clipInfo()` (licht, gooit nooit, `null` na `destroy`), `getClip()` en `setClip(clip)` (geeft `{ ok, reason }`, gooit nooit, zet niets half, klemt alles zelf, stuurt geen gebeurtenissen). `getState()`, presets, tunes, geluid en poorten zijn niet veranderd; `setClip(getClip())` laat `getState()` gelijk. Het klembord is onbetrouwbare invoer: `setClip` leest alleen getallen en tekst en evalueert niets.

- **Wat is het patroon**: de gekozen bank (A tot D, `state.bank`): 15 klanken van 16 stappen, vast 192 tikken. `clipInfo()`: `copy` en `paste` `['drums']`, `length` vast 192, `grid` `[16]`, `scheme` **`device`**, `vel` `accent`, `prob` en `ratchet` onwaar, `lanes` `p0` tot `p14` met de klanknaam (Engels, zoals `noteNames`), `type` leeg en `note` = `baseNote` + 0 tot 14.
- **Risico: geen GM.** De nootnummers zijn `baseNote` + n (standaard 36 = High Bongo), geen General MIDI. De banen hebben bewust geen `type`; de host kan dus alleen op **naam** uitlijnen (en op positie bij een clip uit dit apparaat). Een clip uit een gewone drumkit past daardoor bijna nergens op: de host meldt `niet geplaatst: …` of weigert helemaal als niets past. Dat is bedoeld (geen kick op een bongo).
- **Waarden 0, 1 en 2.** `getClip()`: waarde 1 wordt een slag met `vel` 0,68 (zoals het apparaat speelt), waarde 2 een slag met `acc: true` en `vel` 1. `setClip`: `acc` of `vel` vanaf 0,85 wordt 2, anders 1; kans en ratchet kent het apparaat niet (de host laat ze weg en meldt het).
- **`patternData` is tekst-JSON** (per bank een string). `setClip` bouwt een nieuwe 15 × 16-tabel van getallen 0 tot 2, schrijft die met `JSON.stringify` in de gekozen bank en parst of evalueert nooit tekst uit de clip. Alleen die ene bank verandert; de andere banen, `bank`, `lane`, swing, klanken en besturing blijven. Het getal na het plakken is altijd 0, 1 of 2, ook bij rommel in de clip. `getClip` leest de bank robuust (ongeldige tekst telt als leeg).
- **`setClip`**: kind moet `drums` zijn; banen gaan op `id` `p<n>` met dezelfde naam, anders op naam (hoofdletter- en tekenonafhankelijk); op nootnummer of volgorde nooit. Slagen op tik `t` worden stap `round(t/12)`; stap 16 en hoger valt weg.
- Getest in een browser: rondreis en `getState` gelijk, naamclip (High Bongo accent, Maracas), GM-clip geweigerd met melding, noten geweigerd, 100000 slagen, `NaN`, lengte 1e9, ongeldige banen, Ongedaan maken, nl en en. Niet beluisterd.

## Nootnamen voor sequencers

Latin Percussion heeft `noteNames()` (contract v1.14, `../../../contract/PATCHKAMER-CONTRACT_NL.md` §13b): de vijftien klanken (`High Bongo` … `Star Chime`) op `baseNote` + 0 tot 14. Een sequencer die er met een notenkabel aan hangt, toont die klanken als rijen (Step Sequencer) of drumrijen (Pattern Tracker, Pattern Playlist) en volgt wijzigingen van kit, volgorde of noot via `host.noteNamesChanged`. Een tune die de kanalen verandert, verandert dus ook wat de sequencer toont. Je hoeft er in een tune niets voor te doen. Latin Percussion heeft geen instrumentkeuze (de vijftien klanken zijn vast), dus de lijst is al volledig en er is geen gastinstrument.

## Swing per bank en per klank (1.14.1)

Naast de swing van de host (die zit al in de tijd van elke stap) kent Latin Percussion extra swing, in dezelfde eenheid als de hostschuif: een fractie van een zestiende-stap, 0 … 0,5 (de UI toont 0 … 50 %, dubbelklik = 0). Alleen in de modus "Eigen patroon op interne klok" (`sequence: true`) klinkt het.

| Sleutel | Wat | Waarden |
|---|---|---|
| `bankSwing` | swing per bank A, B, C, D (lijst van 4 getallen; de bank van `bank` speelt) | 0 … 0,5 per getal, start `[0,0,0,0]` |
| `laneSwing` | swing per klank (lijst van 15 getallen, in de volgorde van de pads) | 0 … 0,5 per getal, start allemaal 0 |
| `quantize` | opname kwantiseert naar de dichtstbijzijnde stap (zie hieronder) | `true`/`false`, start `true` |

- Optelregel: de extra vertraging van een oneven zestiende (stapnummer 1, 3, 5, … van de klok) = `min(0,5; bankSwing[bank] + laneSwing[klank]) × stapduur`, bovenop de hostswing. Even stappen blijven staan.
- Ontbrekende of ongeldige waarden (ook `NaN`, tekst, negatief of boven 0,5) geven 0, resp. 0,5; een oude state zonder deze sleutels klinkt gelijk. Een klank uit de lijst (`preset`) kiezen zet alles op de waarden van die preset op zijn standaard, dus ook de swing op 0 (de preset kent geen swing); `getPreset`/`setPreset` nemen de nieuwe sleutels wel mee.

## Live inspelen (1.14.1)

De ingang `notes` speelt klanken altijd zoals voorheen. Staat de knop **Opname** aan (alleen in de UI, niet in de state, bij het laden uit) en loopt de klok, dan schrijft elke trig (`lane` = klanknaam of `padN`) en elke noot (`baseNote` + 0 … 14) met `vel > 0` ook een stap in de **gekozen bank** (`bank`) op de juiste klank: `vel` ≥ 0,85 wordt een accent (waarde 2), lager een gewone slag (1); een bestaande stap op die plek wordt vervangen, de rest blijft staan; geen undo. De stap volgt uit de laatste stap van de klok en de tijd van de gebeurtenis, met de swing van de host en de extra swing van die klank meegerekend. `quantize` aan: de dichtstbijzijnde (geswingde) stap; uit: de stap die op dat moment klinkt. Het patroon heeft alleen 16 stappen per klank: geen keuze 1/32 of triolen. Klok stil, opname uit, onbekende klank, `noteoff`, `vel` 0 of een gebeurtenis meer dan 4 s van de klokstap: er wordt niets geschreven.

## Tunes maken

- **Zet de eigen sequencer uit**: elke tune bevat `sequence: false`, zodat een gebruiker met zijn eigen sequencer kan beluisteren welke kit het best past. De patronen blijven in de tune staan; wie de eigen sequencer weer aanzet, hoort de groove. Laat dit veld in een nieuwe tune dus nooit weg (bij een ontbrekend veld start het apparaat zijn eigen sequencer).

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

## Documentatie en songs

Dit zijn de plaatsen waar je terechtkunt voor documentatie en voor het componeren van songs met dit apparaat. Songs zijn CC-BY-4.0, tunes en presets CC0-1.0, het apparaat AGPL-3.0-or-later.

- Handleiding van Latin Percussion: [NL](../../../docs/drums/USER-MANUAL_NL.md#latin-percussion) · [EN](../../../docs/drums/USER-MANUAL_EN.md#latin-percussion).
- Overzicht van de soort: [README](../README.md); handleiding van de hele soort: [NL](../../../docs/drums/USER-MANUAL_NL.md) · [EN](../../../docs/drums/USER-MANUAL_EN.md).
- Tunes (klanken, `kind: set`): [latin-percussion-styles.patchkamer-tunes.json](../../../tunes/latin-percussion-styles.patchkamer-tunes.json). Kies een tune als beginpunt voor de `state` van dit apparaat in de song; velden die de tune niet noemt krijgen hun standaard. Hoe tunes zijn opgebouwd: [tunes/AGENTS.md](../../../tunes/AGENTS.md).
- Overzicht van alle apparaten en hun signaalketens: [devices/AGENTS.md](../../../devices/AGENTS.md). Een song componeren: [songs/AGENTS.md](../../../songs/AGENTS.md).
- Rol in een song: percussie. Noten op de eventingang `notes` spelen pad `n` als de noot gelijk is aan `baseNote` + n (standaard 36 + n), of een trig met `lane`; het apparaat heeft ook een eigen patroon op de klok. Audio komt uit `out` (stereo).
