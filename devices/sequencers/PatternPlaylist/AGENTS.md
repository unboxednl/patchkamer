# AGENTS.md: Pattern Playlist

Dit bestand is voor AI-agents die dit apparaat configureren of er presets voor maken. Het is niet geschreven voor mensen. Het hoort bij `../../../AGENTS.md` (algemeen); lees die eerst. Hier staat wat alleen voor Pattern Playlist geldt.

## Wat Pattern Playlist is

Een patroonsequencer met een **tijdlijn (playlist)**: tot 32 sporen, tot 32 patronen en tot 2048 **blokken**. Een patroon bevat voor elk spoor een eigen kanaal met cellen (rij, noten, velocity, lengte, effect). Een blok op de tijdlijn zegt: "speel het kanaal van **dit spoor** uit **dit patroon**, vanaf rij `start`, `length` rijen lang, met een `offset` en een transpositie". Het patroon herhaalt zichzelf binnen het blok zolang het blok duurt. Het apparaat maakt **zelf geen geluid**: het stuurt `note`- en `cc`-gebeurtenissen naar de uitgangen `track1` … `trackN`, die je met synths en een drumcomputer verbindt. Het volgt de klok van de studio (`onStep`). De ingang `input` (Live noten / CC) is voor een toetsenbord (zie "Live spelen en opnemen").

Het verschil met zijn zusterapparaat **Pattern Tracker**: dat apparaat speelt in de eerste plaats een **volgorde van complete patronen** (alle kanalen tegelijk, klassieke tracker-structuur met een effectkolom). Pattern Playlist is gemaakt voor het **opbouwen per laag**: elke laag (kick, hats, bas, akkoorden, lead, pad) is een eigen patroon, en de song ontstaat doordat je blokken van die lagen op de tijdlijn legt en weer weghaalt, zoals in een producerprogramma. Beide lezen dezelfde state; de weergave en de standaardmodus verschillen (hier `mode: "playlist"`).

Het verschil met **Regie** (de clip/scene-sequencer): Regie bewaart per track vaste clips en scènes en een arrangement van scènes; Pattern Playlist heeft geen scènes of clips, maar herbruikbare patronen en een vrije tijdlijn in rijen, met per blok een eigen lengte, offset en transpositie, en polymetrische lussen (een bas van drie maten onder drums van een maat).

| | |
|---|---|
| Bestand | `pattern-playlist.patchkamer-device.js` (in deze map) |
| `id` | `nl.patchkamer.patternplaylist`. Verander die nooit: daaraan hangen presets en songs van gebruikers |
| Naam | `Pattern Playlist` in alle talen; de poortnamen hebben een Nederlandse variant (via `i18n`: `Live noten / CC`, `Spoor 1` … `Spoor 8`) |
| Soort | `utility` (categorie `sequencer`): dit apparaat krijgt dus **presets** (geen tunes) |
| Poorten | eventingang `input` (Live notes / CC), eventuitgangen `track1` … `track8` (meer tot 32 via `trackCount`); geen audio, geen modulatie; multi-MIDI-uitgang `tracks` (Tracks: alle sporen met hun namen in één dubbele gestreepte oranje kabel, elke gebeurtenis met `track` en `ch` = spoornummer; de losse spooruitgangen blijven ongewijzigd) |
| Contract | v1.24 (apparaatversie 1.16.0) |
| Licentie apparaat | AGPL-3.0-or-later |

Dit apparaat is de nieuwe, bijgewerkte vorm van een ouder bestand met een andere naam en id (Regie Playlist, `nl.patchkamer.regie.playlist`). Presets of songs uit die tijd verwijzen naar de oude id en laden hier niet in; de oude compositie-export (`patchkamer-regie-duo`) kun je wel importeren.


## Geen tunes, wel presets

Alleen apparaten met `kind: 'instrument'` hebben tunes. Pattern Playlist is een `utility` (categorie `sequencer`): het krijgt **presets** en **nooit tunes**. Het presetpack staat in `../../../presets/pattern-playlist.patchkamer-presets.json` (formaat contract §13c, `formatVersion` 2, `CC0-1.0`, `device` = `nl.patchkamer.patternplaylist`, elke preset `kind: "set"`). Een preset is wat `getPreset()` teruggeeft: de hele compositie **zonder** de werkstand (`view`: gekozen spoor, patroon, rij, zoom, opnameknop, live-doorgifte) en zonder `armed`.

## De state

De state is gewone JSON. Een getal buiten het bereik wordt afgekapt; een tekst, `NaN`, `null` of een ontbrekende waarde geeft de startwaarde. Onbekende velden worden genegeerd. `setState({})` geeft de lege compositie.

| Veld | Wat | Bereik | Start |
|---|---|---|---|
| `format`, `schema` | Vaste herkenning van een export (`"patchkamer-pattern-sequencer"`, `1`). Import accepteert ook het oude `"patchkamer-regie-duo"` | vast | vast |
| `title` | Naam van de compositie; leeg = standaardtitel in de taal van de gebruiker | tekst, hoogstens 72 tekens | `""` |
| `trackCount` | Aantal actieve sporen (uitgangen `track1` … `trackN`) | 1 … 32 | 8 |
| `tracks[]` | Eén object per spoor (er worden er minstens 8 bewaard, ook als `trackCount` lager is) | zie onder | 8 sporen |
| `mode` | Wat afspeelt: `"playlist"` (de blokken op de tijdlijn), `"order"` (de volgorde van patronen), `"pattern"` (alleen het gekozen patroon in een lus) | die drie | `"playlist"` |
| `loop` | Begin opnieuw aan het eind | `true`/`false` | `true` |
| `rowsPerBeat` | **Raster**: rijen per tel (kwartnoot). 2 = 1/8, 4 = 1/16, 8 = 1/32, 16 = 1/64 | 2, 4, 8 of 16 | 4 |
| `seed` | Zaad van de kans (`PRB`): dezelfde state geeft steeds dezelfde noten | 1 … 2147483646 | 17 |
| `patterns[]` | Patronen (hoogstens 32) | zie onder | één leeg patroon van 64 rijen |
| `playlist[]` | Blokken op de tijdlijn (hoogstens 2048) | zie onder | leeg |
| `order[]` | Volgordestappen (hoogstens 256) | zie onder | één stap met het eerste patroon |
| `armed` | Werkstand: het apparaat speelt mee met de klok (niet in een preset) | `true`/`false` | `true` |
| `view` | Werkstand (niet in een preset): `pattern`, `track`, `row`, `tab`, `record`, `quantize`, `liveThru`, `rescale`, zoom en tekeninstellingen | zie de code | |

### Een spoor in `tracks[]`

| Veld | Wat | Bereik | Start |
|---|---|---|---|
| `name` | Label. Leeg = standaardnaam in de taal van de gebruiker (Drums, Bass, Chords, Lead, Texture, Percussion, Free 7, Free 8, daarna Track n). De kabel bepaalt het instrument, de naam is alleen een label | tekst, hoogstens 32 | `""` |
| `mute`, `solo` | Stil / alleen dit spoor (zodra één spoor `solo` heeft, spelen alleen solo-sporen) | `true`/`false` | `false` |
| `transpose` | Halve tonen bij elke noot van dit spoor (ook bij live noten) | −48 … 48 | 0 |
| `velocity` | Factor op de velocity van elke cel | 0 … 1 | 1 |
| `gate` | Factor op de nootlengte (legato > 0,9, staccato < 0,5) | 0,05 … 1,5 | 0,9 |

### Een patroon in `patterns[]`

| Veld | Wat | Bereik |
|---|---|---|
| `id` | Naam waar blokken en volgorde naar verwijzen; alleen letters, cijfers, `_`, `-`; dubbele id's worden uniek gemaakt | hoogstens 32 tekens |
| `name` | Zichtbare naam; leeg = "Pattern 01", "Pattern 02" ... naar positie | hoogstens 40 tekens |
| `length` | Lengte in **rijen** (in het gekozen raster) | 1 … 1024 |
| `channels` | Een lijst per spoor (index = spoornummer min 1) met **cellen**; ontbrekende kanalen worden leeg aangevuld | per kanaal hoogstens 1024 cellen |

### Een cel in een kanaal

```json
{ "row": 8, "notes": [48, 55, 60], "vel": 0.7, "len": 6, "fx": "---", "value": 0, "ccId": "cutoff" }
```

| Veld | Wat | Bereik | Start |
|---|---|---|---|
| `row` | **Positie** (timing): rij binnen het patroon, 0 = begin. Per kanaal één cel per rij; een tweede cel op dezelfde rij vervangt de eerste. Een cel met `row` ≥ `length` wordt naar de laatste rij afgekapt: **schrijf nooit buiten het patroon** | 0 … `length` − 1 | |
| `notes` | MIDI-noten (0 = C-1, 60 = C4), hoogstens 8, uniek. Alle noten van één cel delen `vel`, `len` en `fx` (akkoord). Een cel zonder noten en zonder `fx: "CC"` wordt weggelaten | 0 … 127 | |
| `vel` | **Velocity** van de cel | 0 … 1 (0 = stil; 0,01 = fluisterzacht) | 0,8 |
| `len` | **Toonlengte in rijen** (kan een breuk zijn); wordt afgekapt aan het eind van het blok of patroon | 0,125 … 256 | 1 |
| `fx` | Effectcommando (hieronder) | `"---"`, `"ARP"`, `"RAT"`, `"DEL"`, `"PRB"`, `"CUT"`, `"CC"` | `"---"` |
| `value` | Waarde van het effect (hieronder) | 0 … 255 (per effect begrensd) | 0 |
| `ccId` | Alleen bij `fx: "CC"`: de naam van de parameter die het ontvangende apparaat moet kennen | tekst, hoogstens 48 | `"cutoff"` |

Effecten (de tijd is die van de klok van de host; ze veranderen het tempo niet):

| `fx` | `value` | Wat |
|---|---|---|
| `ARP` | 0x00 … 0xFF (hoge nibble = tweede toon, lage nibble = derde toon, in halve tonen boven de noot) | speelt de noot, noot + hoge nibble, noot + lage nibble achter elkaar **binnen één rij**; `0x37` = mineur akkoord, `0x47` = majeur, `0x4A` = dominant zonder kwint. Chiptune-arpeggio: zet de rij kort (rasters 1/32 of 1/64) |
| `RAT` | 1 … 8 | speelt de cel `value` keer binnen één rij (ratchet, roll). Voor een snareroll: `RAT 4` op de laatste rijen |
| `DEL` | 0 … 90 | vertraagt de cel met dit percentage van een rij (laid-back, swing-gevoel) |
| `PRB` | 0 … 100 | kans in procenten dat de cel speelt (deterministisch via `seed`): ghost notes en generatieve hats |
| `CUT` | 1 … 100 | gate in procenten van `len` in plaats van de gate van het spoor (staccato per cel) |
| `CC` | 0 … 127 | stuurt **geen noot** maar een `cc`-gebeurtenis `{id: ccId, value: value/127}`. Een cel met `CC` mag `notes: []` hebben. Gebruik een eigen spoor voor een filtersweep: één cel per rij met oplopende `value` |

## Hoe het klinkt (tijd, lengte, velocity)

* Een rij duurt `4 / rowsPerBeat` zestiende noten van de hostklok. Bij 120 BPM en `rowsPerBeat: 4` is een rij 0,125 s; bij 8 is een rij 0,0625 s; bij 16 is een rij 0,03125 s. Een maat (4/4) is `4 × rowsPerBeat` rijen: 8, 16, 32 of 64.
* De uitgaande gebeurtenis is `{ "type": "note", "note", "vel", "time", "dur" }` met `vel` = `cel.vel × spoor.velocity` (altijd 0…1; een velocity van 0 wordt niet uitgestuurd) en `dur` in seconden = `len × rijduur × gate` (de gate van het spoor, of de `CUT`-waarde), nooit langer dan tot het eind van het blok of patroon en minstens 1 ms. `time` is de AudioContext-tijd waarop de host de rij plant. Noten buiten 0…127 worden begrensd. Er zijn nooit niet-eindige waarden in de uitvoer.
* **Overlappende noten**: noten van verschillende cellen mogen elkaar overlappen (`len` groter dan de afstand tot de volgende cel). Op een monofone synth knipt de volgende noot de vorige af; dat is legato. Op een polyfone synth klinken ze samen: laat een lange akkoordnoot niet doorlopen in de volgende maat tenzij je dat wilt.
* **Eén cel per rij per spoor, één velocity per cel**: noten in dezelfde cel delen velocity en lengte. Wil je een akkoord met een zachte ondertoon en een harde bovenstem, of twee noten met verschillende lengte op dezelfde rij, gebruik dan twee sporen (twee kabels naar dezelfde synth) of zet de noten een rij uit elkaar.
* **Het raster is de opslageenheid**: noten en lengtes staan in rijen van het gekozen raster. Zet `rowsPerBeat` **in dezelfde state** als je rijen schrijft; verander je alleen `rowsPerBeat` via `setState`, dan klinkt dezelfde inhoud sneller of langzamer (in de UI doet de optie "Verschaal bij rasterwissel" de omrekening wel: rijen, lengtes, blokstarts en patroonlengtes worden vermenigvuldigd).
  * 1/16 (`4`): standaard, alles wat je als stappen denkt.
  * 1/32 (`8`): hi-hat-rijen in dubbele snelheid, grace notes (een zachte noot één rij vóór een hoofdnoot), snelle arpeggio's, flams.
  * 1/64 (`16`): rolls, glitch en micro-timing; een noot van één rij is dan 1/64. Een patroon van 4 maten is 256 rijen.
  * 1/8 (`2`): trage, spaarzame lijnen (ambient, pads).
* **Swing en humanize**: de swing van de host verschuift de rijen; extra swing per patroon, spoor en drumrij staat in "Swing per niveau". Voor eigen feel gebruik je `DEL` (laid-back), kleine velocity-verschillen per cel en `PRB` op ghost notes. Variatie in `vel` tussen 0,05 en 0,15 per cel klinkt menselijker dan alles op 0,8.

### Dynamiek per rol (richtlijnen voor `vel`)

| Rol | Accent | Normaal | Ghost / zacht | `len` / gate |
|---|---|---|---|---|
| Kick | 0,95 – 1,0 (tel 1) | 0,8 – 0,9 | 0,3 (ghost-kick vóór een slag) | 0,5 rij, gate maakt weinig uit |
| Snare / clap | 0,9 – 1,0 (tel 2 en 4) | 0,6 – 0,8 | 0,25 – 0,35 (ghost note) | 0,5 rij; roll met `RAT` |
| Hi-hat | 0,8 (open hat 0,7) | 0,55 – 0,7 | 0,3 – 0,4 | 0,25 – 0,5 rij; open hat 1,5 rij |
| Bas | 0,85 – 0,95 (grondtoon op de maat) | 0,7 – 0,8 | 0,4 (doorgangsnoot) | legato: tot de volgende noot; staccato: 0,5 rij |
| Akkoorden | 0,75 – 0,85 | 0,6 – 0,7 | 0,4 – 0,5 | staccato 0,5 – 1 rij (house), legato = tot de volgende akkoordcel |
| Lead | 0,8 – 0,9 (kernnoten) | 0,6 – 0,75 | 0,5 (versiering) | 1 – 4 rijen, de laatste noot van een frase langer |
| Pad | 0,45 – 0,55 | | | hele maat of langer, `gate` van het spoor 1,0 |

Crescendo: laat de velocity per herhaling 0,05 – 0,1 stijgen. Decrescendo en intro: dezelfde patronen met een lagere `velocity` op het spoor, of een tweede patroon met zachtere cellen.

### Een snelle voorbeeld-cellenreeks (basloop, een maat in A, 1/16)

```json
[
 { "row": 0,  "notes": [33], "vel": 0.92, "len": 3,   "fx": "---", "value": 0, "ccId": "cutoff" },
 { "row": 6,  "notes": [33], "vel": 0.72, "len": 1.5, "fx": "---", "value": 0, "ccId": "cutoff" },
 { "row": 10, "notes": [40], "vel": 0.8,  "len": 2,   "fx": "---", "value": 0, "ccId": "cutoff" },
 { "row": 14, "notes": [31], "vel": 0.45, "len": 0.5, "fx": "---", "value": 0, "ccId": "cutoff" }
]
```

## Live spelen en opnemen

* **Ingang** `input` (Live noten / CC): sluit er een toetsenbord (Keys of een andere notenbron) op aan. Het apparaat stuurt de live noten **direct door naar de uitgang van het gekozen spoor** (het spoor dat je in de editor, de tracker of door op een blok te klikken hebt gekozen), met de velocity van de toets (× `spoor.velocity`), de transpositie van dat spoor, en de toonlengte van de bron (`dur`). Je hoeft het toetsenbord niet ook naar de synth te kabelen; doe je dat toch, dan hoor je de noot dubbel (jouw keuze, het apparaat dubbelt niets zelf). Zet "Live doorgeven naar gekozen spoor" uit om niets door te geven.
* Noten met `held: true` (toets ingedrukt houden) worden samen met hun `noteoff` doorgestuurd naar het spoor waar de noot begon. Wissel je van gekozen spoor of stuur je `allnotesoff`/`panic`, dan sluit het apparaat de hangende noten af (`noteoff`, of `allnotesoff` bij een paniek). `cc`-gebeurtenissen op de ingang gaan ook naar het gekozen spoor.
* **Opnemen**: zet "Opnemen" aan en start de klok. Elke live noot wordt geschreven in het **gekozen patroon op het gekozen spoor** op de rij die op dat moment speelt: in de modus `pattern` is dat het gekozen patroon, in `order` het patroon van de huidige volgordestap, in `playlist` het blok op dat spoor (zonder blok het gekozen patroon). "Kwantiseer naar raster" aan zet de noot op de **dichtstbijzijnde** rij, uit op de rij waarin de noot begon. De velocity is die van de toets; de lengte is van noteon tot noteoff, afgerond op rijen, minstens één rij (een noot zonder noteoff gebruikt `dur`). Noten op dezelfde rij komen in één cel (maximaal 8, de hardste velocity en de langste lengte blijven). Een cel met `fx: "CC"` wordt niet overschreven. Eén opnameronde is één stap voor Ongedaan. Het afspelen pakt de nieuwe noten bij de volgende ronde op.
* Een preset bewaart de opname-instellingen niet (ze horen bij `view`); een geladen state begint altijd met de opnameknop uit.

## Swing per niveau (1.14.1)

Nieuwe state-sleutels (alle standaard 0 / leeg; ongeldig → standaard; zichtbaar in `getState`/`getPreset`):

| Sleutel | Niveau | Bereik | Start |
|---|---|---|---|
| `patterns[].swing` | patroon (schuif "SWING PATROON (%)" bij de patroonbank) | 0 … 0,5 | 0 |
| `tracks[].swing` | spoor (schuif "SWING (%)" in de sporeninstellingen) | 0 … 0,5 | 0 |
| `tracks[].lanes` | drumrij: object `{ "<nootnummer>": swing }` (schuif per rij in de drumeditor); alleen waarden > 0 blijven staan, sleutels 0 … 127, hoogstens 256 | per waarde 0 … 0,5 | `{}` |

Regel (voor alle apparaten gelijk): `swing` is een fractie van een zestiende (0 … 0,5; de UI toont 0 … 50 %, dubbelklik op een schuif = 0). De lokale vertraging van een gebeurtenis in een **oneven zestiende** (positie in zestienden, naar beneden afgerond, is oneven) is `(som van de niveaus) × stepDur`, de som begrensd op 0,5; de swing van de host (`info.time`) blijft er los onder. Even zestienden blijven staan. Rasters van 1/8 en langzamer hebben alleen gebeurtenissen op even zestienden en schuiven dus niet. Een ontbrekend of niet-eindig veld is 0; met alles op 0 spelen state en klokstappen precies als voor versie 1.14.0. De som is patroon + spoor + drumrij (de drumrij hoort bij de ongetransponeerde nootwaarde in de cel). Alle gebeurtenissen van een rij die in een oneven zestiende vallen schuiven mee, ook een `RAT`-slag, een `ARP`-noot of `DEL`-vertraging in een oneven zestiende, een rij van een 1/32- of 1/64-raster en een `cc`; `dur` verschuift niet apart (de noot schuift als geheel). Bij `rowsPerBeat: 2` (1/8) staan rijen alleen op even zestienden.

### Inspelen (1.14.1)

* Kwantiseren gaat naar het dichtstbijzijnde **geswingde** rasterpunt van het doelspoor, de gespeelde noot (drumrij) en het patroon: een rij in een oneven zestiende ligt `(hostswing + patroon + spoor + drumrij) × stepDur` later. Uit: de rij waarin de noot begon (de laatste rij die al begonnen was). Het raster is `rowsPerBeat` (1/8, 1/16, 1/32, 1/64; geen triolen). Heel fijne rasters met veel swing (swing groter dan één rij) kunnen twee rasterpunten laten overlappen; dan wint het dichtstbijzijnde punt.
* Een noot ver (meer dan twee zestienden) buiten de ingeplande rijen wordt niet geschreven. Opname uit, transport stil of een ongeldige noot/velocity schrijft niets; een ongeldige tijd telt als "nu".
* Een noot op dezelfde plek vervangt de noot in de cel (velocity en lengte van de nieuwe), andere noten in de cel blijven. Lengtes worden in nominale rijen gemeten (voorheen in de swing-vervormde rij, waardoor een noot van 8 stappen op een even rij 7 of 9 rijen kon worden).
* `trig`-gebeurtenissen op `input` worden ingespeeld: met een `note` als die noot, met `lane: "chN"` als de N-de klank van de drumcomputer aan het gekozen spoor (volgorde van `noteNames`).
* De drum-editor toont alle klanken van de drumcomputer (voorheen hoogstens 32 rijen; een lijst van 27 namen werd getest).

## Klembord: kanaal kopiëren en plakken (sinds 1.15.0)

De host kopieert en plakt met de knoppen Kopieer en Plak in de kaartbalk en met Ctrl/Cmd+C en Ctrl/Cmd+V (contract v1.17, formaat `patchkamer-clip`, formatVersion 1; tijd in **tikken**, 12 per zestiende). Het apparaat levert drie methoden; ze veranderen niets aan `getState()`, de presets of het geluid. Dezelfde code staat in Pattern Playlist en in Pattern Tracker (beide `id`'s zijn de `native.device` van de eigen clips; een clip van het ene apparaat komt dus ook in het andere verliesvrij terug als de host hem niet aanpast).

**Wat "het huidige patroon" is.** Het **kanaal** (één spoor) van het gekozen patroon: `view.pattern` en `view.track`, dus precies wat de patroon-editor toont. Staat de editor op `piano`, dan is het een `notes`-clip; staat hij op `drums` (`view.editor`), dan een `drums`-clip. Een tracker-volgorde, de playlist, andere kanalen en andere patronen horen er niet bij (een heel patroon met alle kanalen is `kind: multi`, een latere stap).

| Methode | Wat |
|---|---|
| `clipInfo()` | Licht en dynamisch, gooit nooit, `null` na `destroy`. `copy` en `paste` zijn `['notes']` of `['drums']` (naar `view.editor`). `length`: `step` en `min` = één rij in tikken (`48 / rowsPerBeat`: 24, 12, 6 of 3), `max` = 1024 rijen maar hoogstens 12288, `current` = patroonlengte in tikken (hoogstens 12288) en **`shared: true`** (de lengte hoort bij het hele patroon, dus bij alle kanalen; de host herhaalt of kapt de clip). `grid`: `[16]` bij 4 rijen per tel, `[32]` bij 8, `[64]` bij 16 en `[]` bij 2 (1/8 is geen klembordraster; het apparaat rondt zelf af). `poly` 8, `range` `[0, 127]`, `vel` `continuous`, `prob` en `ratchet` waar, `maxEvents` 4096, `scheme` `device` bij drums met een aangesloten drumcomputer, anders `gm`. Bij drums: `lanes` = de rijen van de drum-editor (`drumRows()`, dus de klanken van de aangesloten drumcomputer in zijn volgorde, anders de zes GM-rijen met `type` kick, snare, clap, closedhat, openhat, rim). |
| `getClip()` | Het kanaal als `patchkamer-clip` of `null`. Elke noot van een cel wordt een gebeurtenis op `t` = `row` × tikken per rij met `len` = celllengte × tikken per rij (hoogstens tot het einde), `vel` van de cel (vanaf 0,01) en `acc` bij velocity 1. Effect `PRB` wordt `prob` (waarde / 100), `RAT` (waarde 2 tot 8) wordt `ratchet`, `DEL` verschuift `t` met waarde % van een rij. `ARP`, `CUT` en `CC` bestaan niet in het formaat (CC-cellen zonder noot zijn geen noten). De transpositie van het spoor, de spoorvelocity en de gate horen bij het spoor en gaan niet mee. Bij drums: `hits` op de banen (de rijen van de editor plus eventueel noten in het kanaal die de drumcomputer niet kent, als extra baan met de naam van de noot). Een cel met meerdere drumnoten wordt meerdere slagen op dezelfde `t`. `swing` is de patroonswing, `grid` volgt `rowsPerBeat`. `native` = `{ rpb, length (rijen), cells }`: het hele kanaal met alle effecten voor een verliesvrije terugkeer. Hoogstens 4096 gebeurtenissen (de rest valt weg, ook bij 8 noten in 1024 rijen). |
| `setClip(clip)` | Vervangt **alleen de cellen van dit kanaal**. Blijft staan: patroonlengte (gedeeld), `rowsPerBeat`, patroonnaam en -swing, de andere kanalen, de spoorinstellingen (mute, solo, transpositie, velocity, gate, swing, drumrij-swing), playlist, volgorde, `view` en de opname. Geeft `{ ok: true }` (met `dropped` als er gebeurtenissen wegvielen) of `{ ok: false, reason }` in de taal van de host; gooit nooit, zet niets half, stuurt zelf niets. Een clip die het kanaal niet verandert, doet niets (geen Ongedaan-stap, geen hertekenen). Anders gaat de wijziging als één stap in de eigen Ongedaan-geschiedenis van het apparaat (naast de momentopname van de host). |

Wat `setClip` doet:

1. **Controle.** `format` is `patchkamer-clip`, `formatVersion` ontbreekt of is 1, `kind` past bij de editor nu (anders `ok: false` met de reden; het apparaat schakelt de editor nooit zelf om), `length` is een getal. Alles wordt geklemd (lengte 1 tot 12288, hoogstens 4096 gebeurtenissen, `t` binnen de lengte, `n` 0 tot 127, `vel` 0,01 tot 1, `prob` 0 tot 1, `ratchet` 1 tot 16). Onzin (`NaN`, geen getal, een baan die niet bestaat, een baan zonder geldige `note`) valt weg; onbekende velden worden genegeerd.
2. **Rijen.** Elke gebeurtenis gaat naar de dichtstbijzijnde rij (`round(t / tikken per rij)`); rijen voorbij het einde van het patroon vallen weg (de patroonlengte blijft). Gebeurtenissen op dezelfde rij vormen **één cel**: hoogstens 8 noten (de rest telt als weggelaten), dezelfde noot twee keer = de hardste. Een cel heeft één velocity, één lengte en één effect. Dat betekent: **noten op dezelfde rij delen de velocity** (de hardste), de lengte is de langste, en bij een raster dat fijner is dan het jouwe (1/32 naar 1/16) vallen noten samen tot een akkoord. De host kiest het raster van het doel en meldt de verschuiving.
3. **Effecten.** Heeft een cel `ratchet` > 1, dan wordt het `RAT` (2 tot 8); anders `prob` < 1 wordt `PRB` (waarde 0 tot 100); hebben beide, dan wint `RAT` en telt de kans als weggelaten. `ARP`, `CUT`, `CC` en `DEL` ontstaan nooit uit een vreemde clip.
4. **Drums.** De noot van een slag is de `note` van de baan; de host heeft de banen al op de rijen van dit apparaat uitgelijnd (op type, naam of GM-nummer; wat niet past, is weggelaten en gemeld). Drumcellen krijgen lengte 0,5 rij, zoals in de editor.
5. **Eigen clip.** Hoort `native.device` bij een Tracker of Playlist, is `rpb` gelijk aan `rowsPerBeat` en komt de clip nog overeen met de gebeurtenissen van het gezuiverde `native.cells` (zelfde tijden, noten, lengtes, velocity, kans, ratchet), dan komt het kanaal **exact** terug, mét `ARP`, `CUT`, `CC`-cellen, `DEL` en cellen voorbij de clip. Is de clip door de host of de gebruiker aangepast (ander raster, afgekapt, herhaald, geschaald), dan geldt stap 1 tot en met 4.
6. **Zuivering.** Het resultaat gaat door dezelfde `clean` als `setState`, dus alle cellen zijn geldig en `getState` blijft JSON zonder `NaN`.

**Risico's en keuzes.**

- Een tracker-cel is een rij met een akkoord, geen losse noten; velocity en lengte per noot gaan bij het plakken verloren (zie stap 2). Dat is de reden dat een rondreis via een ander apparaat (zonder `native`) niet altijd gelijk is.
- De patroonlengte verandert nooit door plakken. Wil je een langere clip, maak dan eerst het patroon langer (Patroonlengte); anders wordt de clip afgekapt (en gemeld) of herhaald als het een veelvoud is.
- Bij `rowsPerBeat` 2 (1/8) is het raster van het doel gelijk aan 24 tikken en staat in `grid` niets; het apparaat rondt dan zelf op rijen af. Een patroon van meer dan 512 rijen bij 1/8 past niet in 12288 tikken: `getClip` kapt af (de rest staat wel in `native`), de rondreis blijft stabiel.
- Een kanaal dat piano en drums mengt wordt in de editor-soort gelezen: in de drum-editor alleen de noten van de banen, in de pianorol alle noten.
- Het apparaat heeft zijn eigen Ongedaan-geschiedenis; de host maakt bovendien een momentopname met `getState()` voor Ongedaan maken in de toast.

Getest (nep-host in een echte browser, nl en en, beide apparaten): rondreis `setClip(getClip())` laat `getState()` gelijk bij `rowsPerBeat` 2, 4, 8 en 16 en bij 1024 rijen; de rondreis zonder `native` houdt rijen, akkoorden, kans en ratchet; `native` herstelt `ARP`, `CC` en `DEL` exact; de soortweigering werkt in beide richtingen; rommel (`NaN`, `Infinity`, lengte 0 en 1e9, 100000 noten of slagen, banen die niet bestaan, tekst waar een getal hoort, `null`) geeft nooit een fout en nooit `NaN` in de state; `getState` en `getPreset` zijn gelijk aan versie 1.14.1. In de echte host: kopiëren uit de Tracker en plakken in de Playlist, Ongedaan met Ctrl+Z en de weigering bij verkeerde soort. Niet beluisterd.

## Klembord: het hele patroon kopiëren en plakken (sinds 1.16.0, contract v1.24)

Naast de kanaalclip hierboven geeft het apparaat het hele gekozen patroon als één clip van de soort `multi` (zie het contract, §13d). De host kopieert hem met **Shift-klik** op Kopieer of met **Kopieer alle sporen** in het plakmenu; gewoon Kopieer en Ctrl+C blijven het kanaal pakken. Bestaande aanroepen veranderen niet.

- **`clipInfo()`** meldt nu `copy` en `paste` als `[soort, 'multi']` en het veld `tracks`: één item per kanaal (`S.trackCount`, 1 tot 32) met `id` `t<n>`, `name`, `kind` (`drums` als er via `nameMaps` klanknamen van een aangesloten drumapparaat zijn, anders `notes`) en de gewone velden van het kanaal (gedeelde lengte, raster, `poly` 8, `lanes` bij drums). Zonder `multi`-aanroep is het antwoord voor het gekozen kanaal gelijk aan 1.15.0.
- **`getClip({ kind: 'multi' })`** geeft per kanaal een spoor `{ slot, name, kind, clip }`; elke spoorclip is de kanaalclip zoals hierboven, met de cellen van dat kanaal in zijn eigen `native` (dus ook `ARP`, `CC`, `DEL`). `length` is de patroonlengte in tikken. `getClip()` zonder argument is de kanaalclip, ongewijzigd.
- **`setClip(multi)`** zet per toegewezen spoor (`slot` 0 tot `trackCount − 1`) de cellen van dat kanaal, in één geschiedenisstap. Een spoor van een andere soort dan het kanaal nu neemt wordt overgeslagen en telt als `dropped`, tenzij het zijn eigen cellen (`native`) meebrengt; dan komen die exact terug (ook als het kanaal nog geen klanknamen heeft). Patroonlengte, `rowsPerBeat`, spoorinstellingen en niet toegewezen kanalen blijven. Geen enkel kanaal toegepast: `ok: false`. De rondreis `setClip(getClip({ kind: 'multi' }))` laat `getState()` gelijk.
- Het enkelvoudige pad (kanaal) is verplaatst naar kleine functies (`clipOne`, `clipBuildCells`, `clipCommit`) zonder gedragsverandering; `getState`, presets en geluid zijn gelijk aan 1.15.0 (byte voor byte vergeleken).

**Risico's.** Een patroon van 32 kanalen met veel cellen kan boven de 1 MB van het klembord uitkomen door de `native`-cellen; de host laat dan alle `native` weg (Tracker ↔ Playlist is dan niet meer verliesvrij). Welke kanalen `drums` zijn hangt van de bekabeling af; koppel je later een drumcomputer aan, dan verandert de toewijzing van een volgende plak.

## Controleren

```
node contract/validate-instrument.mjs devices/sequencers/PatternPlaylist/pattern-playlist.patchkamer-device.js --lang nl
node contract/validate-instrument.mjs devices/sequencers/PatternPlaylist/pattern-playlist.patchkamer-device.js --lang en
```

Een preset testen zonder host: laad het bestand als module, maak het apparaat met een host-stub (`{ lang: 'en', emit(){}, setPorts(){}, frame(){ return () => {}; } }` en een `ctx` met `currentTime`), roep `setPreset(state)` aan, vergelijk `getPreset()` met de state (elke waarde moet ongewijzigd terugkomen), zet `onTransport({ playing: true })` en roep `onStep({ step, bar, time, stepDur: 0.125, bpm: 120, swing: 0 })` voor elke zestiende noot aan terwijl je de `emit`-aanroepen telt.

## Wat je niet doet

* Geen cellen buiten het patroon (`row` ≥ `length`), geen `vel: 0` (stil; gebruik een hogere waarde of laat de cel weg), geen te lange `len` die over de patroongrens of het blok heen loopt, geen tien noten in één cel (hoogstens 8), geen dubbele cellen op dezelfde rij en hetzelfde spoor.
* Verwijs in een blok of volgorde alleen naar patronen die bestaan (`id`), en in een playlistblok alleen naar een spoor dat in `tracks` staat.
* Zet geen werkstand (`view`, `armed`) in een preset, geen apparaat of kabel (dat zijn kabels van de gebruiker), en verzin geen merk- of modelnamen in namen of teksten.
* Verander de `id` nooit: daaraan hangen presets en songs.


### Een blok in `playlist[]` (het hart van dit apparaat)

```json
{ "pattern": "p3", "track": 3, "start": 64, "length": 128, "offset": 0, "transpose": 0 }
```

| Veld | Wat | Bereik |
|---|---|---|
| `pattern` | `id` van een bestaand patroon (een blok met een onbekend patroon verdwijnt) | |
| `track` | Spoor waarop het blok staat (0 = spoor 1). Het blok speelt **alleen het kanaal van dit spoor** uit het patroon | 0 … aantal sporen − 1 |
| `start` | Eerste rij op de tijdlijn (in rijen van het raster, 0 = begin) | 0 … 65535 |
| `length` | Lengte van het blok in rijen; is het patroon korter, dan **herhaalt** het zich binnen het blok | 1 … 4096 |
| `offset` | Rij in het patroon waar het blok begint (om een patroon te laten "fasen") | 0 … 1023 |
| `transpose` | Halve tonen bovenop `spoor.transpose`; **laat dit 0 op drumsporen** | −48 … 48 |

Het afspelen: op tijdlijnrij `r` speelt elk blok met `start ≤ r < start + length` de cel op rij `(r − start + offset) mod patroonlengte` in het kanaal van zijn spoor. Twee blokken op hetzelfde spoor die overlappen spelen allebei (dubbele noten): leg ze achter elkaar. De song is zo lang als het laatste blokeinde; daarna begint `loop` opnieuw. Blokken op een spoor dat `trackCount` overschrijdt, spelen niet.

## Zo componeer je met Pattern Playlist

Denk als een producer die een arrangement legt:

1. **Kies het raster** (`rowsPerBeat`) en reken in maten: bij `4` is een maat 16 rijen, bij `8` 32.
2. **Maak per laag een patroon**: één patroon per bouwsteen, met alleen cellen in het kanaal van het spoor waarvoor het bedoeld is. Naamgeving die werkt: `Kick A`, `Kick B (fill)`, `Hats A`, `Bass A`, `Chords A`, `Lead hook`, `Pad`. Hou het aantal patronen onder 32; hergebruik varianten (A, B, zachte versie).
   * Drumlagen zijn kort (1 of 2 maten) en worden door het blok herhaald; harmonische lagen (bas, akkoorden, pad, lead) beslaan de hele akkoordenreeks (bijvoorbeeld 4 akkoorden × 1 maat = 64 rijen bij 1/16).
3. **Leg blokken per sectie**: schrijf de secties uit in maten (zie hieronder) en zet per laag één blok van de lengte van de sectie (`length` = maten × rijen per maat). Een laag laat je **binnenkomen** door zijn blok later te laten starten, en **weggaan** door het eerder te laten eindigen.
4. **Fills en overgangen**: zet in de laatste maat van een sectie een tweede, korter blok (met `Kick B` of `Snare fill`) en laat het hoofdblok één maat eerder eindigen. Een stilte vóór de drop (alleen pad) is een sectie zonder drumblokken.
5. **Dynamiek op sectieniveau**: maak van elke laag een zachte variant (zelfde noten, `vel` × 0,7) voor intro en break en een luide (× 1,1, begrensd op 1) voor de laatste refrein of drop. Het spoor-veld `velocity` schaalt een hele laag tegelijk.
6. **Toonsoortwissel**: een `transpose` van +2 of +3 op de blokken van bas, akkoorden en lead in het laatste refrein is een key lift; de drumblokken blijven 0.
7. **Polymetrie en faseren**: laat blokken met verschillend lange patronen (3, 4, 5 maten) tegelijk lopen en herstart ze niet per sectie; één lang blok per laag. Met `offset` verschuif je een lus tegen de rest.

### Veelgebruikte structuren (maten per sectie)

| Genre | Opbouw |
|---|---|
| House / techno | intro 8 (kick, hats) – build 8 (+ perc, bas) – drop 16 (alles) – break 8 (pad, akkoorden) – drop 2 16 (+ lead) – outro 8 |
| Trance | intro 16 – build 16 – break 16 (pad, arp) – build 8 – drop 32 – break 16 – drop 2 32 – outro 16 |
| Pop / verse-chorus | intro 4 – couplet 8 – pre-chorus 4 – refrein 8 – couplet 8 – pre 4 – refrein 8 – bridge 8 – laatste refrein 8 (+2 halve tonen) – outro 4 |
| Drum & bass, dubstep | intro 8 – build 8 – drop 16 – break 8 – drop 2 16 – outro 8 (halve-tijd of 1/32-raster) |
| Hip-hop / lo-fi | intro 4 – beat 8 – melodie 16 – break 8 – beat 16 – outro 8 |
| Ambient / film | lagen die één voor één binnenkomen (pad, arp, melodie), zeer langzame akkoorden (twee tot vier maten per akkoord), geen drums of alleen perc |
| Reggae / dub | groove 8 – couplet 16 – dub-drop 8 (alleen kick, bas, akkoorden) – couplet 16 – outro 8 |

### Rasters per genre

* 1/16 (`4`): de meeste dance, pop, rock, hip-hop.
* 1/32 (`8`): drum & bass en jungle (een maat is 32 rijen, kick op rij 0 en 24, snare op rij 8 en 24 voor halve-tijdfeel), trap-hats met rolls (hats in 1/32, rolls als `RAT` of drie rijen in een rij).
* 1/64 (`16`): glitch, micro-rolls; gebruik het alleen voor korte patronen (kick, hats) omdat een maat 64 rijen is.

## Het presetpack

`../../../presets/pattern-playlist.patchkamer-presets.json`, packnaam "Pattern Playlist Arrangements", 35 presets in vijf mappen. Elke preset is een volledig arrangement in de playlistmodus (`mode: "playlist"`): patronen per laag (`Kick A`, `Hats B`, `Bass A`, `Chords A`, `Lead A`, `Pad A`, …) en de blokken van de secties, 40 tot 150 maten lang. De track-rollen zijn in elke preset gelijk, zodat je presets kunt vergelijken en lagen kunt omwisselen:

| Spoor | Rol | Aansluiten op |
|---|---|---|
| 1 Kick | kick (noot 36) | drumcomputer (GM-nootnummers) |
| 2 Snare | snare 38, clap 39, rim 37 | drumcomputer |
| 3 Hats | gesloten hat 42, open hat 46 | drumcomputer |
| 4 Bass | basnoten (MIDI 24 – 48) | bassynth, mono |
| 5 Chords | akkoordstoten (MIDI 48 – 80) | polyfone synth |
| 6 Lead | melodie (MIDI 60 – 96) | leadsynth |
| 7 Pad / arp | pad (hele akkoorden, lange noten) of arpeggio | polyfone synth |
| 8 Perc | percussie (toms, conga, shaker, crash, ride) of niet gebruikt | drumcomputer |

De drumsporen 1, 2, 3 en 8 hoor je het best op dezelfde drumcomputer: verbind elke spoor-uitgang met de ingang van die drumcomputer (controleer of de host meerdere kabels naar één ingang accepteert; anders zet je de drumnoten van een preset op één spoor). Alle presets zijn voorbeelden van **structuur**: vervang de noten en de toonsoort naar wens.

| Map | Presets |
|---|---|
| Dance Floor | Main Floor House, Deep House Late Night, Tech House Roller, Peak Time Techno, Uplifting Trance Journey, Eurodance Anthem, Disco Strut, UK Garage Skip, Electro Pulse, Progressive Slow Burn, Afrobeats Groove, Funk Workout, Dembow Reggaeton Heat |
| Bass Music | Liquid Drum and Bass, Jungle Breakbeat Roller, Dubstep Half-Time, Trap Hat Rolls, Future Bass Drops, Breakbeat Funk Cut |
| Hip-hop and Soul | Boom Bap Cipher, Lo-fi Rainy Window, Neo-Soul Pocket, Slow Jam R and B, Downtempo Chillout |
| Song Forms | Indie Pop Verse-Chorus, Rock Band Anthem, Power Ballad Build, Synthwave Night Drive, Loop Jam Starter |
| Ambient and Cinematic | Ambient Drift Evolving, Film Score Tension Cue, Minimal Polymeter Loops, Phasing Pulses, Dub Reggae One Drop, Trailer Rise and Hit |

Bijzondere presets: `Minimal Polymeter Loops` en `Phasing Pulses` leggen één lang blok per laag met patronen van 3, 4, 5 en 7 maten die tegen elkaar draaien (geen sectiegrenzen); `Liquid Drum and Bass`, `Jungle Breakbeat Roller`, `Trap Hat Rolls` en `Breakbeat Funk Cut` gebruiken het 1/32-raster; `Trailer Rise and Hit` en `Film Score Tension Cue` bouwen een cue zonder 4/4-groove.

Een nieuwe preset maken: bouw de state met bovenstaande velden, zet hem door `setPreset` en `getPreset` (zodat alle velden volledig en genormaliseerd zijn), controleer dat elke waarde ongewijzigd terugkomt en dat de noten binnen 0 – 127 en de velocity binnen 0 – 1 blijven, en voeg hem toe in een bestaande map van het pack. Namen zijn Engels en uniek binnen het pack.

## Een drumcomputer aan een spoor

Hangt er aan de uitgang van een spoor (`track1` …) een apparaat met `noteNames()` (Drum Kit, Pulse Drums, Click Synth, Latin Percussion; contract v1.14), dan toont de drum-editor (`view.editor: "drums"`) de klanken van dat apparaat als rijen, in zijn volgorde, met zijn noten. Bij een nieuwe koppeling schakelt de editor eenmalig van `piano` naar `drums`. De pianorol en de celtitels noemen de klanknamen. Zonder lijst staan er de zes vaste GM-rijen (36 kick, 38 snare, 39 clap, 42 gesloten hihat, 46 open hihat, 37 rim). In de state verandert niets: de cellen houden gewone nootnummers.

## Documentatie en songs

Dit zijn de plaatsen waar je terechtkunt voor documentatie en voor het componeren van songs met dit apparaat. Songs zijn CC-BY-4.0, tunes en presets CC0-1.0, het apparaat AGPL-3.0-or-later.

- Handleiding van Pattern Playlist: [NL](../../../docs/sequencers/USER-MANUAL_NL.md#pattern-playlist) · [EN](../../../docs/sequencers/USER-MANUAL_EN.md#pattern-playlist).
- Overzicht van de soort: [README](../README.md); handleiding van de hele soort: [NL](../../../docs/sequencers/USER-MANUAL_NL.md) · [EN](../../../docs/sequencers/USER-MANUAL_EN.md).
- Presets (patronen en instellingen, `kind: set`): [pattern-playlist.patchkamer-presets.json](../../../presets/pattern-playlist.patchkamer-presets.json). Kies een preset als beginpunt voor de `state` van dit apparaat in de song; velden die de preset niet noemt krijgen hun standaard.
- Sequencers in het algemeen (raster, velocity, lengte, timing, accenten): [NL](../../../docs/sequencers/USER-MANUAL_NL.md#wat-de-sequencers-gemeen-hebben) · [EN](../../../docs/sequencers/USER-MANUAL_EN.md#what-the-sequencers-have-in-common). Muziektheorie vertaald naar waarden: [songs/MUSIC-THEORY.md](../../../songs/MUSIC-THEORY.md).
- Overzicht van alle apparaten en hun signaalketens: [devices/AGENTS.md](../../../devices/AGENTS.md). Een song componeren: [songs/AGENTS.md](../../../songs/AGENTS.md).
- Rol in een song: sturing en songstructuur: patronen op een tijdlijn met tot 32 sporen. Elk spoor `track1` … `track8` (meer via `trackCount`, tot 32) gaat naar een eigen synth of drumcomputer, of gebruik de bundeluitgang `tracks`. De ingang `input` neemt live noten en CC op.
