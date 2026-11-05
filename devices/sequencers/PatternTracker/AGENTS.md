# AGENTS.md: Pattern Tracker

Dit bestand is voor AI-agents die dit apparaat configureren of er presets voor maken. Het is niet geschreven voor mensen. Het hoort bij `../../../AGENTS.md` (algemeen); lees die eerst. Hier staat wat alleen voor Pattern Tracker geldt.

## Wat Pattern Tracker is

Een **tracker**: een patroonsequencer waarin je noten op **rijen** zet, in een tabel van tot 32 kolommen (sporen). Elke cel heeft een noot (of akkoord van hoogstens 8 noten), een velocity, een lengte en een **effectkolom** (arpeggio, retrigger, vertraging, kans, gate, CC). Patronen zijn blokken van 1 tot 1024 rijen. Een **volgorde** (`order`) speelt patronen achter elkaar, elk met een aantal herhalingen en een transpositie, en speelt daarbij **alle kanalen tegelijk**; zo bouw je een song op zoals in een klassieke module. Het apparaat maakt **zelf geen geluid**: het stuurt `note`- en `cc`-gebeurtenissen naar de uitgangen `track1` … `trackN`. Het volgt de klok van de studio (`onStep`). De ingang `input` (Live noten / CC) is voor een toetsenbord (zie "Live spelen en opnemen").

Het verschil met zijn zusterapparaat **Pattern Playlist**: dat apparaat is gemaakt voor het opbouwen per laag op een tijdlijn met blokken. Pattern Tracker is gemaakt voor het schrijven **in rijen en patronen** met de effectkolom, en voor de volgorde van complete patronen. Beide lezen dezelfde state; de weergave en de standaardmodus verschillen (hier `mode: "order"`, de tracker-weergave en "Volg afspelen" aan).

Het verschil met **Regie** (de clip/scene-sequencer): Regie bewaart per track vaste clips en scènes; Pattern Tracker kent geen clips of scènes, maar patronen met een kanaal per spoor, een volgorde met herhalingen en rij-effecten.

| | |
|---|---|
| Bestand | `pattern-tracker.patchkamer-device.js` (in deze map) |
| `id` | `nl.patchkamer.patterntracker`. Verander die nooit: daaraan hangen presets en songs van gebruikers |
| Naam | `Pattern Tracker` in alle talen; de poortnamen hebben een Nederlandse variant (via `i18n`: `Live noten / CC`, `Spoor 1` … `Spoor 8`) |
| Soort | `utility` (categorie `sequencer`): dit apparaat krijgt dus **presets** (geen tunes) |
| Poorten | eventingang `input` (Live notes / CC), eventuitgangen `track1` … `track8` (meer tot 32 via `trackCount`); geen audio, geen modulatie; multi-MIDI-uitgang `tracks` (Tracks: alle sporen met hun namen in één dubbele gestreepte oranje kabel, elke gebeurtenis met `track` en `ch` = spoornummer; de losse spooruitgangen blijven ongewijzigd) |
| Contract | v1.13 (apparaatversie 1.13.0) |
| Licentie apparaat | AGPL-3.0-or-later |

Dit apparaat is de nieuwe, bijgewerkte vorm van een ouder bestand met een andere naam en id (Regie Tracker, `nl.patchkamer.regie.tracker`). Presets of songs uit die tijd verwijzen naar de oude id en laden hier niet in; de oude compositie-export (`patchkamer-regie-duo`) kun je wel importeren.


## Geen tunes, wel presets

Alleen apparaten met `kind: 'instrument'` hebben tunes. Pattern Tracker is een `utility` (categorie `sequencer`): het krijgt **presets** en **nooit tunes**. Het presetpack staat in `../../../presets/pattern-tracker.patchkamer-presets.json` (formaat contract §13c, `formatVersion` 2, `CC0-1.0`, `device` = `nl.patchkamer.patterntracker`, elke preset `kind: "set"`). Een preset is wat `getPreset()` teruggeeft: de hele compositie **zonder** de werkstand (`view`: gekozen spoor, patroon, rij, zoom, opnameknop, live-doorgifte) en zonder `armed`.

## De state

De state is gewone JSON. Een getal buiten het bereik wordt afgekapt; een tekst, `NaN`, `null` of een ontbrekende waarde geeft de startwaarde. Onbekende velden worden genegeerd. `setState({})` geeft de lege compositie.

| Veld | Wat | Bereik | Start |
|---|---|---|---|
| `format`, `schema` | Vaste herkenning van een export (`"patchkamer-pattern-sequencer"`, `1`). Import accepteert ook het oude `"patchkamer-regie-duo"` | vast | vast |
| `title` | Naam van de compositie; leeg = standaardtitel in de taal van de gebruiker | tekst, hoogstens 72 tekens | `""` |
| `trackCount` | Aantal actieve sporen (uitgangen `track1` … `trackN`) | 1 … 32 | 8 |
| `tracks[]` | Eén object per spoor (er worden er minstens 8 bewaard, ook als `trackCount` lager is) | zie onder | 8 sporen |
| `mode` | Wat afspeelt: `"playlist"` (de blokken op de tijdlijn), `"order"` (de volgorde van patronen), `"pattern"` (alleen het gekozen patroon in een lus) | die drie | `"order"` |
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
* **Swing en humanize**: de swing van de host verschuift de rijen. Voor eigen feel gebruik je `DEL` (laid-back), kleine velocity-verschillen per cel en `PRB` op ghost notes. Variatie in `vel` tussen 0,05 en 0,15 per cel klinkt menselijker dan alles op 0,8.

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

## Controleren

```
node contract/validate-instrument.mjs devices/sequencers/PatternTracker/pattern-tracker.patchkamer-device.js --lang nl
node contract/validate-instrument.mjs devices/sequencers/PatternTracker/pattern-tracker.patchkamer-device.js --lang en
```

Een preset testen zonder host: laad het bestand als module, maak het apparaat met een host-stub (`{ lang: 'en', emit(){}, setPorts(){}, frame(){ return () => {}; } }` en een `ctx` met `currentTime`), roep `setPreset(state)` aan, vergelijk `getPreset()` met de state (elke waarde moet ongewijzigd terugkomen), zet `onTransport({ playing: true })` en roep `onStep({ step, bar, time, stepDur: 0.125, bpm: 120, swing: 0 })` voor elke zestiende noot aan terwijl je de `emit`-aanroepen telt.

## Wat je niet doet

* Geen cellen buiten het patroon (`row` ≥ `length`), geen `vel: 0` (stil; gebruik een hogere waarde of laat de cel weg), geen te lange `len` die over de patroongrens of het blok heen loopt, geen tien noten in één cel (hoogstens 8), geen dubbele cellen op dezelfde rij en hetzelfde spoor.
* Verwijs in een blok of volgorde alleen naar patronen die bestaan (`id`), en in een playlistblok alleen naar een spoor dat in `tracks` staat.
* Zet geen werkstand (`view`, `armed`) in een preset, geen apparaat of kabel (dat zijn kabels van de gebruiker), en verzin geen merk- of modelnamen in namen of teksten.
* Verander de `id` nooit: daaraan hangen presets en songs.


### Een stap in `order[]` (het hart van dit apparaat)

```json
{ "pattern": "p2", "repeats": 4, "transpose": 0 }
```

| Veld | Wat | Bereik |
|---|---|---|
| `pattern` | `id` van een bestaand patroon (een stap met een onbekend patroon verdwijnt) | |
| `repeats` | Aantal keer dat het patroon achter elkaar speelt | 1 … 32 |
| `transpose` | Halve tonen bovenop `spoor.transpose`, voor **alle** kanalen van het patroon, dus ook voor de drums: laat dit 0 bij patronen met drums en gebruik het alleen voor melodische patronen (chiptune, arpeggio-studies) | −48 … 48 |

Het afspelen in `mode: "order"`: de stappen spelen op volgorde, elke stap `repeats` × de patroonlengte; op elke rij speelt de cel van elk kanaal. De song is zo lang als de som van de stappen; daarna begint `loop` opnieuw. `mode: "pattern"` herhaalt alleen het gekozen patroon (handig om te bewerken); `mode: "playlist"` speelt de blokken van `playlist[]` (de tracker-presets laten die leeg; de knop "Volgorde → nieuwe playlist" zet de volgorde om).

## Zo componeer je in rijen

Denk als een tracker-musicus: een patroon is één "pagina" muziek, de volgorde is de song.

1. **Kies het raster** (`rowsPerBeat`) en de patroonlengte: bij 1/16 is een maat 16 rijen; **64 rijen = 4 maten** is de standaardpagina (rijnummers in hexadecimaal: `00` – `3F`). Een akkoordenreeks van vier akkoorden van een maat past dus in één patroon; een 12-maats blues is een patroon van 192 rijen; een walsmaat is 12 rijen (`rowsPerBeat: 4`, 3 tellen).
2. **Schrijf per patroon alle kanalen**: kolom 1 kick, 2 snare, 3 hats, 4 bas, 5 akkoorden of arp, 6 lead, 7 pad, 8 percussie of een CC-spoor. Gebruik per drumstem een eigen spoor zodat iedere stem zijn eigen velocity heeft.
3. **Maak een handvol patronen** (3 tot 6) en bouw de song met de volgorde: bijvoorbeeld `Intro ×1`, `Verse ×2`, `Break ×1`, `Chorus ×2`, `Verse ×1`, `Chorus ×2`. Hergebruik patronen door ze te herhalen; maak een tweede variant van een patroon (A, B) voor de afwisseling.
4. **Fills**: laat de laatste maat van een patroon afwijken met een snare-roll (`RAT 4` op de laatste twee rijen), extra kicks en open hats. Zet de fill in het patroon zelf (rijen 48 – 63 van 64), niet in een apart patroon van één maat.
5. **Gebruik de effectkolom**:
   * `ARP` met `value 0x37` of `0x47` op één kort aangeslagen noot per rij geeft chiptune-akkoorden zonder dat je akkoorden hoeft uit te schrijven; gebruik rasters 1/32 of 1/64 en een rij per noot.
   * `RAT` voor snareroll en hat-roll; `PRB 60` op ghost notes en extra hats voor een levende groove; `DEL 10 – 30` op de offbeats voor een lui gevoel; `CUT 40 – 60` voor staccato bas.
   * `CC` op een eigen kanaal (spoor 8, naam `Filter`): één cel per 1 tot 4 rijen met `value` omhoog (opbouw) of omlaag (breakdown) en `ccId` zoals de synth hem kent (meestal `cutoff`). Zet dan geen percussie op dat spoor.
6. **Dynamiek binnen een patroon**: accent op de maat (kick 0,95, bas 0,9), tel 2 en 4 van de snare 0,85 – 0,95, ghost notes 0,25 – 0,35 met `PRB`, hats 0,55 – 0,7 met één accent per tel. Geef elk refreinpatroon 0,05 – 0,1 meer velocity dan het couplet.
7. **Transpositie in de volgorde**: gebruik `order[].transpose` alleen voor patronen zonder drums; voor een toonsoortwissel bij een popsong schrijf je liever het patroon opnieuw in de nieuwe toonsoort.

### Veelgebruikte structuren (patronen van 4 maten tenzij anders)

| Stijl | Opbouw (patroon × herhalingen) |
|---|---|
| Chiptune / game-loop | Intro ×1, Verse ×2, Hook ×2, Verse ×1, Hook ×2; bas in 1/16, `ARP`-akkoorden, kort lead-motief |
| Eurodance / italo | Intro ×1, Verse ×2, Break ×1, Chorus ×2, Verse ×1, Chorus ×2 |
| Techno / EBM / goa | Intro ×2, Groove ×2, Peak ×3, Groove ×1, Peak ×2; weinig akkoorden, `CC`-filtersweep |
| 12-bar blues | één patroon van 12 maten (192 rijen), dom7-akkoorden `I7 I7 I7 I7 IV7 IV7 I7 I7 V7 IV7 I7 V7`, 3 tot 4 herhalingen met steeds meer lead |
| Jazz AABA (32 maten) | A-patroon (8 maten: `ii7 V7 IM7 vi7 ii7 V7 IM7 IM7`) ×2, bridge (8 maten) ×1, A ×1 |
| Pop / rock | Intro ×1, Verse ×2, Pre ×1, Chorus ×2, Verse ×1, Pre ×1, Chorus ×2 |
| Wals (3/4) | patroon van 4 × 12 rijen; bas op 1, akkoord op 2 en 3 |
| Latin (bossa, samba, salsa) | clave in het snare-kanaal (rim), tumbao-bas (grondtoon en kwint, benadering van de volgende grondtoon), akkoorden op de offbeats |
| Reggae / ska | one drop (kick en rim op tel 3) of upstroke (akkoord op elke offbeat), bas legato |
| Canon / barok | patroon met een akkoordenreeks van 8 maten en melodielijnen die in elke volgordestap een extra stem krijgen |

### Rasters per stijl

* 1/16 (`4`): bijna alles.
* 1/32 (`8`): jungle en breakbeat-chops, chiptune-arpeggio's, IDM-stutters (een maat is 32 rijen, snare op rij 8 en 24).
* 1/64 (`16`): glitch en micro-rolls (een maat is 64 rijen; houd de patronen kort).
* 1/8 (`2`): ambient en pads.

## Het presetpack

`../../../presets/pattern-tracker.patchkamer-presets.json`, packnaam "Pattern Tracker Modules", 34 presets in vier mappen. Elke preset is een module in de ordermodus (`mode: "order"`): 2 tot 5 patronen (Intro, Verse, Break, Chorus, Fill in de laatste maat) en een volgorde met herhalingen. De rollen van de sporen zijn in elke preset gelijk:

| Spoor | Rol | Aansluiten op |
|---|---|---|
| 1 Kick | kick (noot 36) | drumcomputer (GM-nootnummers) |
| 2 Snare | snare 38, clap 39, rim 37 | drumcomputer |
| 3 Hats | gesloten hat 42, open hat 46 | drumcomputer |
| 4 Bass | basnoten (MIDI 24 – 48) | bassynth, mono |
| 5 Chords | akkoordstoten, of kort aangeslagen noten met `ARP` | polyfone synth |
| 6 Lead | melodie (MIDI 60 – 96) | leadsynth |
| 7 Pad | pad (hele akkoorden, lange noten) of arpeggio | polyfone synth |
| 8 Perc | percussie, of een `CC`-spoor (`Filter`) in de presets die dat zeggen | drumcomputer, of de filter-ingang van een synth |

De drumsporen 1, 2, 3 en 8 hoor je het best op dezelfde drumcomputer (controleer of de host meerdere kabels naar één ingang accepteert; anders zet je de drumnoten van een preset op één spoor).

| Map | Presets |
|---|---|
| Module Classics | Chiptune Hero Loop, Chip Boss Battle, Demoscene Arp Anthem, Acid Squelch Rows, Eurodance Tracker Pop, Hardcore Gabber Stomp, Jungle Chop Rows, Glitch Micro Rows 1/64, Italo Disco Bounce, Trance Gate Rows, Techno Tool Rows, EBM Industrial March |
| Songwriting Forms | Twelve-Bar Blues, Jazz AABA Standard, Pop Verse Chorus Rows, Rock Riff Verse and Chorus, Waltz in Three, Folk Fingerpick Ballad, Canon Entries Sketch, Baroque Circle Sequence |
| World and Latin | Bossa Nova Rows, Samba Batucada Rows, Salsa Montuno Rows, Roots Reggae Rows, Ska Upstroke Rows, Tango Marcato Rows, Dancehall Riddim Rows |
| Electronic Rows | Synthpop Rows, Ambient Evolver Rows, IDM Stutter Rows, Goa Rolling Bass Rows, Drum Break Study, Dorian Arp Study, Probability Groove Machine |

Bijzondere presets: `Glitch Micro Rows 1/64` gebruikt het 1/64-raster; `Chiptune Hero Loop`, `Chip Boss Battle`, `Demoscene Arp Anthem` en `Jungle Chop Rows` het 1/32-raster; `Acid Squelch Rows`, `Trance Gate Rows`, `Goa Rolling Bass Rows` en `Ambient Evolver Rows` hebben een `CC`-spoor (`cutoff`); `Waltz in Three` is een 3/4-patroon van 12 rijen per maat (de maatstreep van de host is 4/4); `Twelve-Bar Blues` is een patroon van 192 rijen; `Probability Groove Machine` en `IDM Stutter Rows` gebruiken `PRB`, `RAT` en `DEL` zwaar.

Een nieuwe preset maken: bouw de state met bovenstaande velden, zet hem door `setPreset` en `getPreset` (zodat alle velden volledig en genormaliseerd zijn), controleer dat elke waarde ongewijzigd terugkomt en dat de noten binnen 0 – 127 en de velocity binnen 0 – 1 blijven, en voeg hem toe in een bestaande map van het pack. Namen zijn Engels en uniek binnen het pack.
