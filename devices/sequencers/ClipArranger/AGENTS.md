# AGENTS.md: Clip Arranger

Dit bestand is voor AI-agents die met dit apparaat componeren of er presets voor maken. Het is niet geschreven voor mensen. Het hoort bij `../../../AGENTS.md` (algemeen); lees die eerst. Hier staat wat alleen voor Clip Arranger geldt.

## Wat Clip Arranger is

Een clip-, scène- en songsequencer met 1 tot 16 sporen (tracks). Het maakt **zelf geen geluid**: elk spoor stuurt `note`-, `trig`- en `cc`-gebeurtenissen naar zijn eigen uitgang (`track1` … `track16`), die je met een synth, drone, drumcomputer of ander apparaat verbindt. Elk spoor heeft 8 clips (patronen met noten en CC-lanes), een scène start de clips van alle sporen tegelijk, en de song speelt scènes achter elkaar in een arrangement. Op de ingang `input` (MIDI / opname) kun je een toetsenbord of andere notenbron aansluiten om live te spelen en in te spelen.

| | |
|---|---|
| Bestand | `clip-arranger.patchkamer-device.js` (in deze map) |
| `id` | `nl.patchkamer.cliparranger` (nieuw: voorheen `nl.patchkamer.regie`, de naam Regie; songs en presets uit die tijd verwijzen naar de oude id en laden hier niet in) |
| Naam | `Clip Arranger` in alle talen; de poortnamen hebben een Nederlandse variant (`MIDI / opname`) |
| Soort | `utility` (categorie `sequencer`): dit apparaat krijgt dus **presets** (geen tunes) |
| Poorten | eventingang `input`; eventuitgangen `track1` … `track16` (de statische lijst; via `host.setPorts` en `ui.jacks` toont de kaart in één horizontale rij alleen `track1` … `trackN` voor de N sporen, met alleen het nummer, en rechts altijd `tracks`; minder sporen haalt de kabels van de verdwenen uitgangen weg); geen audio, geen sturing; multi-MIDI-uitgang `tracks` (Tracks: alle sporen met hun namen in één dubbele gestreepte oranje kabel, elke gebeurtenis met `track` en `ch` = spoornummer; de losse spooruitgangen blijven ongewijzigd) |
| Contract | v1.24 (apparaatversie 1.37.0) |
| Licentie apparaat | AGPL-3.0-or-later |

Verschil met de andere sequencers: Chord Sequencer maakt akkoorden en patronen met vier sporen en scènes van vier sporen; Pattern Playlist en Pattern Tracker bouwen een song van patronen in een playlist of tracker. Clip Arranger werkt zoals een sessieweergave: een matrix van clips per spoor en per scène, plus een lineair song-arrangement erboven.

## Geen tunes, wel presets

`kind` is `utility`, dus **presets** en **nooit tunes** (contract §0 en §13c). Het presetpack staat in `../../../presets/clip-arranger.patchkamer-presets.json` (`formatVersion` 2, licentie `CC0-1.0`, `device` is `nl.patchkamer.cliparranger`, elke preset is `kind: "set"`). Het pack heet "Clip Arranger Song Starters": 58 compositiestarts per genre (zie onderaan).

## De state

`getPreset()` geeft `getState()` zonder de werkstand: `recordMode`, `selectedTrack`, `selectedClip`, `selectedSection`, `editPage`, `zoom`, `pianoBase`, `drawLength`, `drawVelocity`, `drawProbability`, `drawRatchet`, `selectedNote`, `selectedRow`, `record`, `quantize`, `recordSettings`, `ccId`, `ccShape`. Een preset laat die velden bij het laden staan. De state is gewone JSON. Een getal buiten het bereik wordt afgekapt; tekst, `NaN`, `null` of een ontbrekende waarde geeft de standaard; onbekende velden worden genegeerd. `setState({})` geeft het lege standaardproject (4 sporen, 8 scènes, een kort arrangement).

### Bovenste niveau

| Veld | Wat | Bereik | Standaard |
|---|---|---|---|
| `title` | Songtitel; leeg = "Nieuwe song" / "New song" in de taal van de gebruiker | tekst, hoogstens 64 tekens | `""` |
| `tracks` | Lijst van 1 tot 16 sporen (zie hieronder). Meer dan 16 wordt afgekapt | 1 … 16 | 4 sporen |
| `scenes` | Lijst van scènes `{name}` (sinds 1.26.0 vrij van 1 tot 24; elke scène is een rij in de matrix, dus slot `j` van elk spoor). Een lege naam volgt de plek en de taal (Intro, Groove, Variation, Break, Build-up, Main, Outro, Free, daarna Scène 9 … / Scene 9 …) | 1 … 24 | 8 lege namen |
| `arrangement` | De **actieve song**: lijst van 1 tot 64 secties `{scene, bars, repeats, clips?, cont?}`. Altijd gelijk aan `songs[activeSong].arrangement`; oudere songs hebben alleen dit veld | zie hieronder | 5 secties |
| `songs` | Sinds 1.26.0: lijst van 1 tot 16 songs `{name, arrangement}`. Alle songs delen dezelfde scènes en clips; een song is alleen de volgorde. Ontbreekt het veld, dan wordt `arrangement` de enige song | 1 … 16 songs | 1 song met het standaardarrangement |
| `activeSong` | Welke song speelt en getoond wordt (en dus wat `arrangement` is) | 0 … aantal songs − 1 | 0 |
| `mode` | `"session"`: clips en scènes lanceren; `"song"`: het arrangement afspelen | `"session"` of `"song"` | `"session"` |
| `songLoop` | Het arrangement begint opnieuw na het einde | `true`/`false` | `true` |
| `armed` | De sequencer speelt (`false` is stil) | `true`/`false` | `true` |
| `recordMode` | Opnamemodus (werkstand): `overdub` = Aanvullen, `replace` = Overschrijven (zie Live spelen en inspelen) | `overdub` of `replace` | `overdub` |
| `automation` | Wie de instellingen van het aangesloten apparaat speelt (sinds 1.21.0, hoort bij de song): `sequencer` = exact zoals opgenomen, modulatie op de regelaars met een lijn wordt genegeerd; `modulators` = de lijn is de basisstand en modulatoren sturen erbovenop | `sequencer` of `modulators` | `sequencer` |
| `recordSettings` | Werkstand (niet in een preset): bij Opname ook het draaien aan het aangesloten apparaat opnemen | `true`/`false` | `true` |

Een preset die een compositie neerzet, zet `mode` op `"song"` zodat het arrangement meteen speelt.

### Een spoor in `tracks[i]`

| Veld | Wat | Bereik | Standaard |
|---|---|---|---|
| `name` | Spoornaam; leeg = standaardnaam in de taal (spoor 1 tot 4: Drums, Bass, Keys, Atmosphere; daarna Track n) | hoogstens 24 tekens | `""` |
| `target` | Vrij label voor het doelapparaat (de kabel bepaalt de echte bestemming; het label is documentatie) | hoogstens 40 tekens | `""` |
| `type` | `notes` toetsen/melodie, `drums` drumcomputer, `drone` pad/drone | een van die drie | `notes` |
| `color` | Spoorkleur | een van `#e8ae61 #80c9af #89b6ea #bb9ee4 #e591a0 #a8cb6a #7cccd3 #e6bd85` | afhankelijk van de plaats |
| `mute`, `solo` | Dempen, solo | `true`/`false` | `false` |
| `transpose` | Transpositie in halve tonen (niet bij `drums`) | −48 … 48 | 0 |
| `velocity` | Schaal voor alle velocities van het spoor | 0 … 1 | 1 |
| `gate` | Deel van de notenlengte dat echt klinkt (`dur = len × stap × gate`) | 0,05 … 1,5 | 0,9 (drone: 1) |
| `swing` | Spoorswing (sinds 1.14.0): vertraagt de oneven zestienden van dit spoor, in zestienden | 0 … 0,5 | 0 |
| `rowSwing` | Swing per drumrij: object `{"<nootnummer van de rij>": swing}` (zie Swing), alleen waarden boven 0 worden bewaard | object, 0 … 0,5 per nootnummer 0 … 127 | `{}` |
| `drumProtocol` | `trig`: stuurt `trig` met de `lane` van de rij; `note`: stuurt `note` met het MIDI-nummer van de rij | `trig` of `note` | `trig` |
| `rows` | 16 drumrijen `{name, note, lane}` (alleen bij `drums` van belang) | 16 vaste rijen | zie hieronder |
| `clips` | De **bibliotheek** van het spoor (de clipbalk in 02): clips met noten, CC en instellingen, in een vaste volgorde die nooit door scène-acties verandert. Een sectie kan elke clip kiezen met `clips[spoor]`. Oudere bestanden hebben hier een clip per scène | 1 … 48 | 8 lege clips |
| `cells` | Sinds 1.33.0, optioneel: per scène (rij van de matrix) het nummer van de clip uit `clips` die dit spoor daar speelt, of −1 (lege cel). Ontbreekt het veld, dan speelt scène `j` clip `j`. Dezelfde clip mag in meer scènes staan (een verwijzing, geen kopie: een wijziging klinkt overal). `getState` en presets laten `cells` weg zolang het gewoon scène `j` = clip `j` is | lijst van `scenes.length` getallen, −1 … `clips.length` − 1 | ontbreekt |
| `liveClip` | Welke scène (rij) dit spoor in sessiemodus speelt; −1 = gestopt | −1 … aantal scènes − 1 | 0 |

Standaard drumrijen (index 0 … 15, MIDI-nummer, lane): Kick 36 `ch1`, Snare 38 `ch2`, Clap 39 `ch3`, Closed hat 42 `ch4`, Open hat 46 `ch5`, Low tom 45 `ch6`, Mid tom 47 `ch7`, High tom 50 `ch8`, Rim 37 `ch9`, Crash 49 `ch10`, Ride 51 `ch11`, Shaker 70 `ch12`, Tambourine 54 `ch13`, Conga 64 `ch14`, Bongo 60 `ch15`, Percussion 75 `ch16`. Een noot op een drumspoor wijst met `row` (0 … 15) naar de rij; `note` hoort bij `rows[row].note` te zijn.

### Een clip in `tracks[i].clips[j]`

| Veld | Wat | Bereik | Standaard |
|---|---|---|---|
| `name` | Clipnaam | hoogstens 32 tekens | `Clip n` |
| `bars` | Lengte in maten (een maat is 16 zestienden) | 1 … 64 | 1 |
| `span` | Sinds 1.26.0, optioneel: de clip is uitgerekt over zoveel scènes, vanaf haar eigen slot. De scènes eronder moeten leeg zijn (een niet-lege plek stopt het uitrekken, het bestand wordt zo gezuiverd). Scène `k` van de uitgerekte clip speelt vanaf `k / span` van de clip, dus een clip van 16 maten met `span` 4 geeft vier scènes die elk bij een andere maat van de clip beginnen (maat 1, 5, 9 en 13). Geen `span` = 1 scène | 2 … 24 (alleen bij een niet-lege clip) | afwezig |
| `swing` | Clipswing (sinds 1.14.0), in zestienden | 0 … 0,5 | 0 |
| `grid` | **Raster van de editor** voor deze clip: `16` = 1/16, `32` = 1/32, `64` = 1/64 | 16, 32 of 64 | 16 |
| `notes` | Lijst van noten (zie hieronder), hoogstens 4096 | | `[]` |
| `cc` | Lijst van hoogstens 8 CC-lanes `{id, shape, points}` | | `[]` |
| `auto` | Lijst van hoogstens 32 instellingenlijnen `{id, points}` (sinds 1.21.0, zie hieronder) | | `[]` |

Elke clip loopt **op zijn eigen lengte** en herhaalt zichzelf. Dus een drumclip van 1 maat en een akkoordclip van 4 maten bij dezelfde scène lopen naast elkaar (het akkoordpatroon van 4 maten loopt, het drumpatroon herhaalt elke maat). Gebruik dat om notenaantallen klein te houden.

### Een noot in `clip.notes[k]`

| Veld | Wat | Bereik |
|---|---|---|
| `id` | Uniek nummer binnen de clip (dubbele worden bij het laden hernummerd) | 0 … 1e8 |
| `step` | **Beginpositie in zestienden vanaf het begin van de clip**; mag een veelvoud van 0,25 zijn | 0 … `bars × 16 − 0,25` |
| `note` | MIDI-nootnummer (bij `drums` hoort het bij de rij) | 0 … 127 |
| `len` | **Lengte in zestienden**; mag een veelvoud van 0,25 zijn | 0,25 … 1024 |
| `vel` | Velocity (aanslagsterkte) | 0,01 … 1 |
| `prob` | Speelkans per ronde | 0 … 1 |
| `ratchet` | Herhalingen binnen een zestiende (alleen bij `drums`) | 1 … 4 |
| `row` | Drumrij (alleen bij `drums`) | 0 … 15 |

### Een CC-lane in `clip.cc[k]`

`{id, shape, points}`: `id` is de parameter-id die het aangesloten apparaat begrijpt (bijvoorbeeld `cutoff`), `shape` is `linear` (tussen de punten) of `hold` (trap), `points` is een lijst `{step, value}` met `step` als heel getal van 0 tot `bars × 16 − 1` en `value` van 0 tot 1. CC wordt per zestiende gestuurd (`{type:'cc', id, value, time}`).

### Een instellingenlijn in `clip.auto[k]`

`{id, points}`: `id` is de parameter-id van de regelaar op het aangesloten apparaat (dezelfde als in zijn `params()`, §8, bijvoorbeeld `cut`; tekens `[A-Za-z0-9._-]`, 1 tot 60, uniek binnen de clip). `points` is een lijst `{step, value}`: `step` in zestienden vanaf het begin van de clip, een veelvoud van 0,25 van 0 tot `bars × 16 − 0,25`; `value` van 0 tot 1, het deel van het bereik van de regelaar (logaritmisch bij een logaritmische knop). Hoogstens 1024 punten per lijn, gesorteerd op `step`, één punt per stap (bij dubbele stappen wint de laatste). **Een waarde blijft staan tot het volgende punt (latch)**; vóór het eerste punt doet de lijn niets. Het verschil met een CC-lane: een CC-lane stuurt `cc`-gebeurtenissen naar het apparaat (dat de id zelf moet begrijpen); een instellingenlijn zet via de host (`host.setParam`) de regelaar zelf en werkt met elk apparaat dat die regelaar in `params()` heeft.

### Het arrangement

`arrangement[n] = {scene, bars, repeats}` (sinds 1.37.0 ook een optionele `color` `#rrggbb`): de scène (0 … aantal scènes − 1), de lengte van de sectie in maten (1 … 64) en het aantal herhalingen (1 … 16). **Een sectie duurt `bars × repeats` maten.** Elke clip van die scène herhaalt zichzelf binnen de sectie. Een koorclip van 4 maten in een sectie van 8 maten speelt dus twee keer; een clip van 8 maten in een sectie van 4 maten wordt na 4 maten afgebroken (alles wat doorloopt wordt bij de sectiegrens afgekapt). Zet `bars` van de sectie dus op een veelvoud van de langste clip. Noten van elk spoor stoppen uiterlijk bij het einde van hun clip of sectie.

Sinds 1.36.0 mag een sectie meer scènes hebben: het optionele veld `scenes` (lijst van 2 … 16 scènenummers; `scene` is dan het eerste). De scènes spelen na elkaar, elke scène `bars` maten, en de hele reeks herhaalt `repeats` keer: een sectie duurt `scenes.length × bars × repeats` maten. Zonder `scenes` (alle bestaande songs en presets) is alles gelijk aan voorheen. Voor het afspelen deelt `playArr()` een sectie met meer scènes op in stukken van één scène (met `_sec`); `songRes`, `secPhases` en `locate` werken op die stukken, dus een uitgerekte clip (`span`) loopt zo door de scènes van een sectie en `Doorlopen` blijft werken.

Sinds 1.25.0 mag een sectie twee optionele velden hebben (ontbreken ze, dan is het gedrag zoals hierboven): `clips` is een lijst van 16 waarden, per spoor `null` (de clip van `scene`), `-1` (dat spoor is stil in deze sectie) of `0 … aantal scènes − 1` (die clip); `cont` is een lijst van 16 booleans, per spoor `true` = **Doorlopen**. Doorlopen telt alleen als dezelfde clip ook in de vorige sectie op dat spoor speelde: de clip gaat dan verder op de plek waar hij was (over de sectiegrens heen, ook over herhalingen, en noten worden niet aan de sectiegrens afgekapt als de volgende sectie ze laat doorlopen) in plaats van opnieuw te beginnen. Zo loopt een clip van 16 maten over vier secties van 4 maten, terwijl andere sporen hun eigen clips herhalen.

## Hoe het speelt

Op elke zestiende noot (`onStep`) kijkt elk spoor in zijn clip welke noten beginnen in dat stapje. Een noot met `step` 3,25 begint in stap 3 en wordt een kwart zestiende later gespeeld (`time = tijd van de stap + 0,25 × stepDur`). De uitgang krijgt `{type:'note', note, vel, time, dur}` (nootnummer + transpositie van het spoor, afgekapt op 0 … 127; `vel = vel × spoorvelocity`; `dur = len × lengte van een zestiende × gate`, nooit korter dan 0,01 s). Een drumspoor met `drumProtocol: "trig"` stuurt `{type:'trig', lane, vel, time}` en herhaalt een noot `ratchet` keer binnen een zestiende. Een noot met `prob` onder 1 speelt met die kans (willekeurig, per ronde anders). Niet-eindige of ongeldige klokstappen (`stepDur`, `time`, `bpm`) worden genegeerd.

Scènes lanceren op de volgende maat (sessiemodus). In songmodus bepaalt het arrangement welke scène speelt.

## Swing per niveau (sinds 1.14.0)

`clip.swing`, `track.swing` en `track.rowSwing[<nootnummer>]` zijn elk een deel van een zestiende (0 … 0,5, standaard 0, UI 0 … 50 %, dubbelklik op de schuif = 0). Een noot van een **oneven zestiende** (de stap van de host, 1, 3, 5 …) wordt `min(0,5, clip + spoor + rij) × stepDur` later gespeeld, bovenop de swing van de host (die zit al in `info.time` en blijft apart werken). Noot, ratchets en 1/32-, 1/64-posities binnen die zestiende schuiven als geheel mee (de lengte blijft); even zestienden blijven staan. CC-lanes schuiven mee met clip + spoor (geen rij). De rij wordt aan het **nootnummer** van de drumrij gekoppeld, zodat de swing bij de klank blijft als de volgorde van een aangesloten apparaat wijzigt. Humanize/kans werken zoals voorheen. Met alles op 0 zijn de gebeurtenissen gelijk aan 1.13.1.

## Drumsporen volgen het aangesloten apparaat

Hangt de uitgang `trackN` van een drumspoor aan een apparaat met `noteNames()` (contract v1.14: Drum Kit, Pulse Drums, Click Synth, Latin Percussion), dan toont de rol van dat spoor de hele lijst klanken van dat apparaat onder elkaar (hoogstens 64 rijen), met hun naam, nootnummer en kanaal (`lane` `ch1`, `ch2`, …, in de volgorde van het apparaat); het veld voor de rijtoewijzing verdwijnt dan. Een eigen lane-naam (niet `chN`) blijft staan. De opgeslagen `rows` in de state veranderen niet. Wijzigt de kit of de volgorde, dan schuiven de noten in de clips van dat spoor mee naar de rij van hun nootnummer (`row` wordt bijgewerkt); een nootnummer dat het apparaat niet kent, houdt zijn rij. Hebben twee kanalen van het apparaat dezelfde noot, dan telt de lijst die noot één keer en kan een kanaal een plaats opschuiven. Zonder kabel of zonder namen is alles als voorheen. Sinds 1.14.0 stuurt zo'n spoor zijn rijen altijd als `note` met het nootnummer uit de lijst (ook als `drumProtocol` `trig` is): `trig` met `lane` `chN` raakt een gastinstrument zonder kanaal niet, en klopt niet meer als twee kanalen een noot delen. De lijst mag 64 rijen hebben (Pulse Drums: 27); de rol scrolt (hoogstens 620 pixels hoog). Een noot met een rij buiten de lijst klinkt niet, maar breekt de stap niet meer af.

## Live spelen en inspelen (ingang `input`)

- **Pads kiezen een spoor of starten een scène** (sinds 1.13.1, state `pads`): `pads.track = { on, base }` laat de noten `base` … `base + aantal sporen − 1` het spoor `noot − base` (0 = spoor 1) kiezen in plaats van te klinken; `pads.scene = { on, base }` laat de noten `base` … `base + 7` scène 1 … 8 starten (op de eerstvolgende maat als de klok loopt, zoals de scèneknop). Standaard staan beide uit (`on: false`, `base` 36 en 44, de twee padbanken van een MPK mini), dus bestaande songs klinken gelijk. Het spoorbereik gaat voor als de bereiken overlappen; een noot erbuiten gaat gewoon naar het geselecteerde spoor. `pads` hoort bij de hardware: het zit in `getState()` maar niet in `getPreset()`, en een preset laat het staan. De noot-off van een pad doet niets. Zo schakel je met één toetsenbord en een MIDI Hub (route **Keyboard**) tussen de apparaten achter de sporen.

- Sluit een toetsenbord (device Keys of een andere notenbron) op `input` aan. De noten gaan **direct door naar de uitgang van het geselecteerde spoor** (met velocity en toonlengte), zodat je de synth op dat spoor kunt bespelen zonder een tweede kabel van het toetsenbord. Is het toetsenbord ook direct met die synth verbonden, dan klinkt het dubbel: dat is jouw keuze.
- Een vastgehouden toets (`held: true` met `noteoff`, zoals Keys in de stand "Toets vasthouden") wordt doorgegeven en afgesloten met een `noteoff` op dezelfde uitgang. Wisselt het geselecteerde spoor, of komt er een nieuwe state, of wordt het apparaat verwijderd, dan krijgt het oude spoor een `noteoff` voor elke nog klinkende toets. `allnotesoff` en `panic` sluiten alles af. Een tweede aanslag van dezelfde nog vastgehouden toets sluit de eerste eerst af.
- Op een drumspoor worden noten naar de drumrij met dat nootnummer gestuurd, en `trig` naar de rij met die `lane` (of die naam). Noten zonder rij worden niet doorgegeven.
- **Opname**: staat `record` aan (checkbox *Live opname* of de knop **● Opname**), loopt de transport en staat `armed` aan, dan schrijft elke inkomende `note`/`noteon`/`trig` een nootobject in de **geselecteerde clip van het geselecteerde spoor**. `vel` is de velocity van de aanslag, `len` de duur (van noteon tot noteoff, of `dur`), op het raster afgerond en minstens één rasterstap. Het raster is dat van de clip (`grid`); `quantize` (standaard aan) zet de noot op het dichtstbijzijnde rasterpunt, uit op 1/64. Sinds 1.14.0 is dat het dichtstbijzijnde **geswingde** rasterpunt (host-swing + clip + spoor + rij, zoals hierboven), zodat een noot niet naar een buurstap springt. Het kwantiseren loopt rond de loop-rand (een noot net voor het eind van de clip komt op stap 0). Een nieuwe noot op dezelfde plek en rij (drums) of hetzelfde nootnummer vervangt de oude. Er wordt niets geschreven bij opname uit, transport stil, sequencer uit, niet-eindige noot/velocity, of een aanslag meer dan een zestiende van een geplande stap. Elke opgenomen noot is een Undo-stap.
- **Opnamemodus** (`recordMode`, keuze *Opname*): **Aanvullen** (standaard) laat bestaande noten staan. **Overschrijven** wist de noten van de clip één keer, bij de eerste ingespeelde noot van een opnamerun, en vult daarna aan (meerdere rondes). Een run begint opnieuw bij opname aan/uit, een transportwissel, Undo/Redo en `setState`; wisselt de geselecteerde clip, dan wist de eerste noot in de nieuwe clip die clip. Er wordt dus niets gewist zolang je niets speelt, en Undo herstelt de oude clip.
- **Clipbalk** (1.23.0, alleen de kaart; geen state, geen API): bovenin de clip-editor knoppen voor de clipsloten (een per scène) van het gekozen spoor (het spoor kies je in 02 of in de matrix; sinds 1.24.0 staat de spoorkeuze niet meer in 03), `‹ ›`, *Nieuwe clip* (eerste lege slot), *Dupliceer* (naar het eerstvolgende lege slot) en *Verwijder clip* (leeg slot `Clip n`, één Ongedaan-stap). Een clip is leeg als `notes`, `cc` en `auto` leeg zijn. Een sectie van het arrangement kiezen zet `selectedClip` op haar scène. Een song maakt dus geen clip "aan": er zijn altijd 8 sloten per spoor.
- **Matrix en editor (1.24.0, alleen de kaart; geen state, geen API):** de matrix toont in de kop de songsectie en maat of de sessiemaat, en per spelende clip een lijn (`pending` krijgt daarvoor `secLocal`); clips verslepen verplaatst (Ctrl kopieert) en kan alleen naar een spoor van dezelfde soort (drums of toetsen/drone); `✎` hernoemt een spoor; `focusNotes()` zet `pianoBase` bij elke andere clip of spoor op de noten; `05 · Instrumenten toewijzen` bestaat niet meer.
- **Songbalk (1.25.0; kleine state-uitbreiding, zie Het arrangement):** sectie 04 is vervallen. Boven de clipmatrix in 01 staat een songbalk (secties als blokken, breedte naar `bars × repeats`, een lijn die meeloopt via `secPos` in de visuele wachtrij), daaronder de instellingen van de gekozen sectie en in de matrix de rij *Sectie* (per spoor `clips[spoor]` en `cont[spoor]`). `locate(tick)` geeft per spoor de beginstand (`secPhases`) en of de clip doorloopt; `schedule` gebruikt dat voor de positie in de clip. `cleanSection` normaliseert een sectie (oudere songs zonder de velden werken ongewijzigd).
- **Scènes, songs en uitrekken (1.26.0; state-uitbreiding: `songs`, `activeSong`, `scenes` van 1 tot 24, clip-veld `span`):** het aantal scènes is vrij. In de matrix heeft elke scène **✎** (hernoemen; ook dubbelklik op de naam), **+** (lege scène invoegen na deze), **2×** (scène dupliceren, alle sporen) en **×** (haalt de scène uit de secties van alle songs; sinds 1.31.0 blijven de rij en haar clips staan, een song houdt minstens één sectie); **+ Scène** voegt er achteraan een toe en **Verwijder lege scènes** haalt scènes weg die leeg zijn en in geen enkele song voorkomen. Scènes zijn te slepen: op een andere scène (ordenen), op een songblok (die sectie krijgt die scène) of op **+** in de songbalk (nieuwe sectie achteraan). Een scène die in de actieve song niet voorkomt is gedimd; de tooltip toont in welke songs hij zit. Boven de songbalk staat een songkeuze met **Nieuwe song**, **Dupliceer song** (een remix begint als kopie) en **Verwijder song**. `arrangement` blijft de actieve song, zodat bestaande songs, presets en agents ongewijzigd werken; `syncSongs()` schrijft hem terug naar `songs[activeSong]` voor `getState()`/`getPreset()`. Een clip uitrekken: sleep de greep onderaan de clip omlaag over lege scènes (of het veld **Over scènes** in de clip-editor); het afspelen volgt `resolve(spoor, plek)`: een gedekte plek speelt de clip van de plek erboven vanaf deel `k` (`partOff`), in sessie- en in songmodus, met of zonder **Doorlopen**. Het afspelen van bestaande songs en de 58 presets is bit-voor-bit gelijk aan 1.25.0 (gemeten: dezelfde gebeurtenissen en tijden in song- en sessiemodus). Geen contractwijziging.
- **Secties en clips bewerken (1.29.0, alleen de kaart; geen state, geen API):** rechtermuisknop (contextmenu in de kaart, `openMenu`) op een sectieblok: Kopieer, Knip, Plak (na deze), Dupliceer, Verwijder; op een clip: Kopieer, Knip, Plak, Naar volgende slot, Verwijder. Sneltoetsen Ctrl+C/X/V, Delete en Ctrl+Z gelden voor het deel waar je het laatst klikte (`area`: `song` of `matrix`; een document-listener, omdat de weergave bij elke wijziging opnieuw wordt opgebouwd en de focus verdwijnt). Het klembord van een clip onthoudt de soort (`drums` of niet): plakken kan alleen op een spoor van dezelfde soort. Secties zijn te slepen (`dragSection`; de helft van het blok bepaalt voor of na); verschuiven (slepen of ← →, `moveSec`) zet daarna ook de scènerijen van de matrix in songvolgorde (`followSong` via `rebuildScenes`: de scènes van de song nemen de plekken in die ze al hadden, andere rijen blijven staan, de klok loopt door). Elk sectieblok toont per spoor een vakje met het clipnummer (rand = `clips[spoor]` wijkt af van de scène, streep = `cont`). Clip-editor: **Kopieer pagina** en **Plak pagina** (`pageClip`): de noten, CC-punten en instellingslijnen van de gekozen pagina (de stappen van `zoom`, `editPage`) worden naar een andere pagina gekopieerd, in dezelfde clip of in een andere van dezelfde soort; de doelpagina wordt eerst geleegd en de pagina moet in de doelclip bestaan. De statusregel staat in de poortenrij; de rij Startpunt is vervallen (`template()` bepaalt alleen nog het beginproject). State, presets en afspelen zijn gelijk aan 1.28.0.
- **Uitgerekte clip volgt de secties, ongedaan maken per deel (1.31.0, alleen afspelen en kaart; geen state, geen API):** `songRes(upto)` bepaalt per sectie en spoor welke clip speelt en vanaf waar (`off`, `end`): een clip met `span` > 1 loopt in de song door in de volgende secties zolang de scène van die sectie op dat spoor leeg is (geen eigen clip, niet door `resolve` gedekt) en het einde van de clip nog niet is bereikt; het vervolg begint waar de vorige sectie eindigde (`end`), dus de lengte van elke sectie bepaalt hoeveel maten de clip speelt, en de secties hoeven niet direct onder elkaar te staan. `clips[spoor]` (een eigen clip of −1) gaat voor. `locate` geeft `res` en zet `carry` ook voor het vervolg (noten worden niet aan de sectiegrens afgekapt). Sessiemodus en songs zonder uitgerekte clip zijn bit-voor-bit gelijk. Ongedaan maken per deel: `remember()` onthoudt bij elk snapshot het deel (`song`, `matrix` of `clip`; de weergave zet `scope` via een opvanger op pointer-, toets- en wijzigingsgebeurtenissen: songbalk, rest van de kaart, sectie 03); `scopedUndo(deel)` neemt het laatste snapshot van dat deel, berekent het verschil met het volgende (`diffState`, zonder weergavevelden als `selectedClip`), zet alleen dat verschil terug in de huidige state en in de latere snapshots, en bewaart het verschil voor `scopedRedo`. Undo en Redo staan als knoppen in de songbalk, bij de matrix en in de clip-editor; Ctrl+Z werkt voor het deel waar je het laatst klikte. De Undo/Redo in de bovenste balk (`undo`, `redo`) blijven alles in volgorde terugdraaien. Maximaal 60 stappen.
- **Clips als bibliotheek, scènes als verwijzingen (1.33.0; state: optioneel spoorveld `cells`):** `t.clips` is de bibliotheek (1 … 48, `MAXSLOTS`); `t.cells[scène]` is het nummer van de clip of −1. `cellOf(spoor, rij)` geeft de clip, `resolve(spoor, rij)` wat die rij speelt (de eigen clip, of een deel van een uitgerekte clip erboven: `span` staat op de clip), `secRes(sectie, spoor)` wat een sectie speelt (een eigen keuze `clips[spoor]` uit de bibliotheek, anders de cel van de scène van de sectie). `rebuildScenes(order)` schuift alleen rijen en `cells` (en secties); de clips zelf blijven op hun plek, dus de nummers in 03 veranderen nooit door een scène te verwijderen, toe te voegen of te verplaatsen. Een gedupliceerde scène (2×) krijgt eigen kopieën van de clips (in vrije bibliotheekslots). `libFree` zoekt een leeg slot dat nergens in gebruik is (`usedLib`: cellen en sectiekeuzes) of een nieuw slot achteraan; `addLibClip` voegt een clip toe (leeg of kopie) en zet hem eventueel in een cel. Acties in de matrix: Haal uit scène (`removeFromScene`, Delete: de cel wordt −1, de clip blijft), Verwijder clip helemaal (`deleteLib`: slot leeg, cellen en sectiekeuzes die ernaar wezen vervallen), Hergebruik clip / in volgende lege scène / in alle lege scènes (`assignCell`, `linkAllEmpty`), Maak eigen kopie (`ownCopy`), Nieuwe clip hier (klik op een lege cel, `newClipAt`). Slepen: scène naar scène verplaatst de verwijzing (Ctrl: eigen kopie, Alt: dezelfde clip in beide scènes, ander spoor: kopie); een clip uit de clipbalk naar een cel slepen zet hem erin (`moveClip(..., lib)`). Klembord: plakken maakt een nieuwe clip in de bibliotheek en zet hem in de cel. Laden (`sanitize`): zonder `cells` is scène `j` = clip `j`; een koppeling `ref` uit 1.31/1.32 wordt een verwijzing en sectiekeuzes naar zo'n slot wijzen naar de clip zelf. De voormalige 1.32-opzet (scènes en bibliotheek in één lijst, clips die bij het verwijderen van een scène achteraan verschuiven) is vervallen.
- **Keuzelijst per cel (1.34.0, alleen de kaart; geen state):** elke cel (niet bij een gedekt deel van een uitgerekte clip) heeft een `select.cellsel` met `— geen clip —` (−1, `removeFromScene`), de clips van de bibliotheek die inhoud hebben of in gebruik zijn (`assignCell`; dezelfde clip mag in meer cellen) en `+ Nieuwe clip` (`newClipAt`). Een lege cel maakt dus niets vanzelf aan; de keuzelijst ligt over de hele lege cel.
- **Meer scènes per sectie, geen Sectie-rij meer, kop met scène (1.36.0; state: optioneel sectieveld `scenes`):** de rij Sectie onder de spoorkoppen is vervallen (`renderSectionRow` weg; de velden `clips` en `cont` van een sectie blijven bij het afspelen gelden). De instellingen van de gekozen sectie hebben `SCÈNES`: chips met ‹ › × en een keuzelijst `+ scène` (`setSecScenes`); een scène op een sectieblok slepen vervangt, met Ctrl of Shift voegt toe. `secScenes`, `secSteps`, `playArr`, `segOf` zijn de hulpfuncties; `locate` geeft `secIdx`, `uPos` en `uLen` voor de lijn die door het sectieblok loopt. In 01 staan geen clipknoppen meer (die staan in 02: Kopieer, Knip, Plak, Nieuwe clip, Dupliceer, Verwijder clip). De kop van de clip-editor toont `TRACK n / SCÈNE r, s / CLIP m` (de scènes waarin de gekozen clip staat).
- **Kleuren met een kleurkiezer (1.37.0; state: optionele velden `scenes[].color` en `arrangement[].color`, `tracks[].color` mag elke `#rrggbb` zijn):** `colorInput` is een `<input type=color>` (geen lijst meer). Spoor: onder het potlood in de spoorkop; scène: het potlood bij de scène opent `openScenePanel` (kleurkiezer en Geen kleur; de scène toont een stipje `scdot`); sectie: `KLEUR` in de instellingen van de gekozen sectie (rand van het blok in de songbalk, `--sec`). Ongeldige kleuren vallen weg (spoor: standaardkleur van de plek; scène en sectie: geen kleur). Klik op de scènenaam hernoemt (`renameScene`). De vakjes met clipnummers in de sectieblokken zijn vervallen. Is een sectie gekozen, dan krijgen de scènes (rijen) van die sectie een verticale lijn links (`.scene.insel::before`) en rechts (`.slot.insel-r::after`) in de sectiekleur (standaard goud); de oude gouden rand `insong` is vervallen. Presets en bestaande songs hebben geen van deze velden en zijn gelijk.
- **Sectie 02 Track is opgegaan in de spoorkop (1.35.0, alleen de kaart; geen state):** de kaart heeft nog twee secties, 01 (song en clipmatrix) en 02 (clip-editor, voorheen 03). In de kop van elk spoor in de matrix: de naam en het label (`t.target`) zijn knoppen die met `inlineEdit` op de plek een invoerveld worden (Enter bewaart, Escape laat staan), het tracktype is een keuzelijst (`select.tytype`), daarnaast M, S, ■ en het potlood (✎). Het potlood opent `openPanel(spoor)` (`.trackpanel`, onder de kop; `panelTrack` blijft over een `render()` heen open en sluit via `closeMenu`): kleur, transponeren en gate (niet bij drums), drumprotocol, swing spoor, rij en swing rij en de drumrijen (bij drums), velocity schaal en Track auditeren. De spoorkeuze-knoppen (`SPOOR 1 2 3 4`) zijn vervallen: een spoor kies je door in zijn kop te klikken of een cel te kiezen. `Live opname → deze clip` (`state.record`) staat in de kaartbalk van de clip-editor.
- **Speel deze clip** (knoppen *▶ Speel deze clip* en *■ Stop clip* in de clip-editor; ook `playClip()`/`stopClip()` op het apparaat): alleen de geselecteerde clip van het geselecteerde spoor loopt, op zijn eigen lengte, los van scènes en song; andere sporen zijn stil en mute/solo gelden dan niet. Hij start op de volgende maatgrens, of meteen op de eerste stap als de klok stilstaat. Staat de klok van de pagina stil, dan start het apparaat zijn **eigen klok** (`ownStart`, een lookahead-lus op `ctx.currentTime` met `host.bpm` en `host.swing`, alleen na een klik of pad); dezelfde eigen klok draait bij ▶ van een scène of clip. Start de pagina zijn klok, dan stopt de eigen klok in `onTransport` en neemt de pagina over; de knop *■ Stop* en `setState` stoppen hem ook. Tijdens een los lopende clip volgt de editorpagina de lijn; kies je een andere clip of spoor, dan volgt de weergave dat op de volgende maatgrens. Stop, een scène of clip lanceren, of het wisselen van Afspelen (Clips / scènes, Song) of `setState` zet de gewone weergave terug. Het is een losse werkstand en staat niet in de state. Samen met Opname loopt de opname rond (loop-opname) in de clip die speelt.

## Instellingen opnemen en afspelen (sinds 1.21.0, contract v1.21 §13f)

- **Doel.** De lijnen van een spoor gelden voor de apparaten waar zijn uitgang `trackN` aan hangt (`host.cablesFrom`); de weergave toont de regelaars van het eerste doel (`host.paramsOf`, alleen regelaars die een schuif of draaiknop zijn), `setParam` gaat naar alle doelen.
- **Afspelen.** Bij elke zestiende zoekt elk spoor (niet gedempt) in zijn lopende clip de punten die in die zestiende vallen en plant ze op hun eigen moment met `host.setParam(self, doel, id, value)` (via `setTimeout`, op de klok van de host berekend). Wat stopt (transport, `setState`) annuleert de geplande wijzigingen. Het werkt voor clip, scène, sessie, song en Speel deze clip, op dezelfde plek als de CC-lanes.
- **Wie speelt.** Met `automation: 'sequencer'`, de klok lopend, `armed` en niet tijdens het opnemen van instellingen zet het apparaat `host.lockParams` op alle id's die in een clip van dat spoor een lijn met punten hebben (voor alle doelen van het spoor); modulatie op die regelaars wordt dan genegeerd. Met `modulators` komt er geen slot. Het slot vervalt bij stoppen, bij `destroy` en als het doel verdwijnt.
- **Opnemen (latch).** Met `record`, `recordSettings`, `armed` en een lopende klok volgt het apparaat (`host.watchParams`) de doelen van het gekozen spoor. Een melding wordt op de positie van dat moment (kwartzestiende, `recordPos` met raster 0,25, onafhankelijk van `quantize`) een punt in de gekozen clip van het gekozen spoor. Een gelijke waarde als het vorige punt (verschil onder 0,002) geeft geen nieuw punt. Tijdens het opnemen staat er geen slot, zodat modulatie wordt opgenomen (`by: 'mod'` is de effectieve waarde). Bij `recordMode: 'replace'` wordt een lijn bij haar eerste punt in een opnameronde leeggemaakt. De eerste opgenomen wijziging van een ronde maakt één Undo-stap. Noten, drums, CC-lanes en andere lijnen blijven ongemoeid.
- **Niets uit zichzelf.** Laden, `setState`, `setPreset` en een song openen zetten geen slot (dat gebeurt pas als de klok loopt) en nemen niets op. `getPreset` bevat `automation` en de lijnen (ze horen bij de compositie), niet `recordSettings`.
- **Klembord.** `getClip` neemt de lijnen mee in `native`; `setClip` met een eigen clip zet ze terug en laat de lijnen van de clip anders staan, zoals de CC-lanes.
- **Niet gemeld:** snelle modulatie (contract §9, audiosnelheid) en regelaars zonder schuif of draaiknop (keuzelijsten, vinkjes, knoppen) doen niet mee.

## Raster en opslag

De state bewaart **altijd zestienden**: `step` en `len` zijn getallen in zestienden en mogen veelvouden van 0,25 zijn (een 1/64 = 0,25 zestiende). `grid` van de clip bepaalt alleen waarop de editor en de live opname afronden; het verandert de reeds opgeslagen noten niet. Oude clips zonder `grid` zijn 1/16 en klinken gelijk als vroeger.

| Wat | `step` of `len` in zestienden |
|---|---|
| 1/16 | 1 |
| 1/32 | 0,5 |
| 1/64 | 0,25 |
| 1/8 | 2 |
| 1/4 (een tel) | 4 |
| halve noot | 8 |
| hele noot / een maat | 16 |
| twee maten | 32 |

Posities binnen een maat: tel 1 op 0, tel 2 op 4, tel 3 op 8, tel 4 op 12; de "en" van elke tel op 2, 6, 10, 14; de zestienden ertussen op 1, 3, 5 … 15.

## Componeren met Clip Arranger (voor agents)

### Werkwijze

1. Kies een toonsoort, een tempo en een vorm (zie "Vormen" hieronder). Het tempo staat niet in de state: zet het in `title` en laat de gebruiker het op de transport instellen.
2. Maak de sporen met een rol (`drums`, `bass`, `chords`, `pad`, `arp`, `lead`, `perc`, `fx`) en een `target`-label.
3. Maak scènes (maximaal 24, de standaard is 8) met `name` voor elke rol in de vorm (Intro, Verse, Chorus, Build, Drop, Break, Bridge, Outro).
4. Zet in elke clip van elk spoor de noten. Een clip mag lang (de akkoordloop van 4 of 8 maten) of kort (een drumpatroon van 1 maat) zijn; laat een spoor dat in een scène niet speelt gewoon een lege clip houden (`notes: []`).
5. Zet het arrangement: secties met `scene`, `bars` (de echte lengte) en `repeats`.
6. Zet `mode: "song"`.
7. Controleer met `setState(...)` en `getState()` dat niets is afgekapt (zie "Fouten").

### Velocity (sterk en zwak, accenten, ghost notes, dynamiek)

- `vel` loopt van 0,01 tot 1. Reken met: ghost note 0,2 … 0,35; zacht 0,4 … 0,55; normaal 0,6 … 0,8; accent 0,85 … 1.
- Geef elke slag een eigen waarde in plaats van overal 0,8. Voorbeeld hi-hat in zestienden: tel 0,6; de zestienden ertussen 0,3. Backbeat (snare) 0,9 … 1 op 4 en 12, ghost snares 0,25 op bijvoorbeeld 7, 9 en 15.
- Crescendo: laat `vel` stijgen over de noten (0,3 → 1,0 in een snare roll of een build). Decrescendo: laat hem dalen. Dynamiek per spoor: `tracks[i].velocity` schaalt het hele spoor (bijvoorbeeld 0,6 voor een pad onder een leadsynth).
- Menselijke variatie: ±5% (bijvoorbeeld 0,78, 0,82, 0,75, 0,8) in plaats van vaste waarden; accent op de eerste tel van een maat.
- Een velocity van 0 bestaat niet: `vel` wordt minstens 0,01. Wil je geen noot, laat hem weg.

### Lengte en positie

- Korte staccato: `len` 0,5 … 1 (1/32 … 1/16). Normaal: 1 … 2. Legato: `len` gelijk aan de afstand tot de volgende noot, of iets langer als het ontvangende instrument noten laat overlappen. Een pad of drone: `len` gelijk aan een akkoordduur (16, 32, 64 zestienden).
- Zet noten die samen als akkoord klinken op **dezelfde `step`** met dezelfde `len`. Voor een gitaarstrum: zet elke volgende snaar 0,25 zestiende later (`step` 0, 0,25, 0,5, 0,75).
- Overlap noten op een monofone synth niet (zie "Fouten"). Op een polyfone synth mogen ze overlappen.
- `gate` van het spoor verkort alles gelijkmatig; zet het op 1 voor pads en legato, 0,5 … 0,7 voor tokkelen.

### Rasterkeuze

- **1/16** (`grid` 16, standaard): ritmes van pop tot house; ook shuffle en swing (zet swing op de host).
- **1/32** (`grid` 32, `step` met `.5`): snelle arpeggio's, snare roll in de laatste tel, flams, grace notes (een korte noot 0,5 zestiende vóór de hoofdnoot).
- **1/64** (`grid` 64, `step` met `.25`): hi-hat rolls in trap en dubstep, ratchets zonder `ratchet`, strums, en laid-back timing (een snare of akkoord 0,25 zestiende te laat, typisch voor lo-fi en neo-soul).
- Zet `grid` op de fijnste rastereenheid die in die clip voorkomt, zodat de editor het goed toont.
- Swing/humanize: naast de host-swing kun je `swing` per clip, spoor en drumrij zetten (zie Swing per niveau); humanize doe je met kleine verschuivingen van 0,25 in `step` en kleine verschillen in `vel`.

### Per rol

- **Drums**: kick op 0 (en 4, 8, 12 bij four-on-the-floor), snare of clap op 4 en 12 (backbeat) of op 8 (half-time), hi-hat in achtsten (0, 2, 4 …) of zestienden met accent op de tel. Open hat op de "en" (2, 6, 10, 14) voor house. Fill: de laatste tel van een maat (12 … 15.75) met snare of toms, crescendo, daarna een crash op 0 van de volgende sectie.
- **Bas**: wortel op de tel van het akkoord (octaaf 24 … 48, MIDI 28 … 48 bij een bas), korte noten (len 1 … 2) voor drive, lange (8 … 16) voor sub; kwint of octaaf als versiering; een chromatische nootje (−1) vlak voor de volgende akkoordwortel.
- **Akkoorden**: noten van het akkoord op dezelfde `step`, in een register rond MIDI 55 … 68, met zo weinig mogelijk beweging van akkoord naar akkoord (voice leading). Ritme: hele maat (len 16), offbeat stabs (positie 2, 6, 10, 14, len 1), pianostabs (0, 3, 6, 10, 13).
- **Pad**: lange noten (len = akkoordlengte) met een lage velocity (0,35 … 0,6) in een breed register.
- **Arp**: een akkoord als reeks enkelvoudige noten van 1/16 of 1/8 (vel afwisselend 0,85 op de tel en 0,55 ertussen); `gate` 0,5 … 0,8.
- **Lead / melodie**: eigen motief van 1 … 4 maten, sterke tonen (akkoordtonen) op de tellen, doorgangsnoten ertussen; eindig een frase op de grondtoon of kwint; ruimte (rusten) zodat het ademt.
- **FX**: een lange drone of impact; sturing via een CC-lane (bijvoorbeeld `cutoff`) die oploopt over een build en terugvalt in een break.

### Vormen (gebruikelijke structuren)

| Genre | Vorm in maten | Opmerking |
|---|---|---|
| Pop / rock | Intro 4, Verse 8, Pre-chorus 4, Chorus 8, Verse 8, Pre 4, Chorus 8, Bridge 8, Chorus 16, Outro 4 | verse-chorus; akkoorden I–V–vi–IV |
| Techno / house / trance | Intro 16, Build 8, Drop 32, Break 16, Build 8, Drop 32, Outro 16 | blokken van 4 of 8 maten; break zonder kick |
| Drum & bass | Intro 16, Drop 32, Break 16, Drop 32, Outro 16 | 174 BPM, kick 0 en 10, snare 4 en 12 |
| Hip-hop / lo-fi | Intro 4, Verse 16, Hook 8, Verse 16, Hook 8, Bridge 8, Hook 16 | lus van 4 maten |
| Funk / disco / soul | Intro 4, Groove 16, Chorus 8, Breakdown 4, Chorus 16 | |
| 12-bar blues | 12 maten: I I I I IV IV I I V IV I V | head, solo, turnaround |
| Jazz AABA | A 8, A 8, B (brug) 8, A 8 | rhythm changes; 32 maten |
| Reggae / dub | Verse 16, Chorus 8; dub: wissel de sporen in en uit | one drop: kick en rim op 8 |
| Ambient / film | langzame secties van 8 … 16 maten, geen vaste lus | CC-lanes voor het verloop |
| Klassiek: sonate | Expositie (thema 1 in I, thema 2 in V, herhaald), doorwerking, reprise (beide thema's in I), coda | |
| Klassiek: rondo | A B A C A (coda) | |

### Een clip invullen: voorbeeld

Een spoor-clip met een kick op elke tel (velocity met accent), een closed hat met ghost-noten op 1/32 en een ratchet-roll, een maat lang:

```json
{
  "name": "Verse", "bars": 1, "grid": 32,
  "notes": [
    {"id":0,"step":0,"note":36,"len":1,"vel":1,"prob":1,"ratchet":1,"row":0},
    {"id":1,"step":4,"note":36,"len":1,"vel":0.9,"prob":1,"ratchet":1,"row":0},
    {"id":2,"step":4,"note":38,"len":1,"vel":0.95,"prob":1,"ratchet":1,"row":1},
    {"id":3,"step":0,"note":42,"len":1,"vel":0.6,"prob":1,"ratchet":1,"row":3},
    {"id":4,"step":1.5,"note":42,"len":0.5,"vel":0.3,"prob":1,"ratchet":1,"row":3},
    {"id":5,"step":2,"note":42,"len":1,"vel":0.6,"prob":1,"ratchet":1,"row":3},
    {"id":6,"step":15,"note":38,"len":0.5,"vel":0.4,"prob":1,"ratchet":1,"row":1},
    {"id":7,"step":15.5,"note":38,"len":0.5,"vel":0.7,"prob":1,"ratchet":1,"row":1}
  ],
  "cc": []
}
```

Een basfiguur op een akkoord (Am: A1 = MIDI 33) met korte accenten en een lange sub:

```json
[
  {"id":0,"step":0,"note":33,"len":3,"vel":1,"prob":1,"ratchet":1,"row":0},
  {"id":1,"step":4,"note":33,"len":1,"vel":0.7,"prob":1,"ratchet":1,"row":0},
  {"id":2,"step":6,"note":45,"len":1,"vel":0.75,"prob":1,"ratchet":1,"row":0},
  {"id":3,"step":8,"note":40,"len":4,"vel":0.9,"prob":1,"ratchet":1,"row":0}
]
```

Een akkoord met een zachte strum van 1/64 (C-majeur: 48, 55, 60, 64):

```json
[
  {"id":0,"step":0,"note":48,"len":8,"vel":0.85,"prob":1,"ratchet":1,"row":0},
  {"id":1,"step":0.25,"note":55,"len":7.75,"vel":0.8,"prob":1,"ratchet":1,"row":0},
  {"id":2,"step":0.5,"note":60,"len":7.5,"vel":0.78,"prob":1,"ratchet":1,"row":0},
  {"id":3,"step":0.75,"note":64,"len":7.25,"vel":0.72,"prob":1,"ratchet":1,"row":0}
]
```

Een arrangement van een dance-nummer (scène 0 Intro, 1 Build, 2 Drop, 3 Break):

```json
"arrangement": [
  {"scene":0,"bars":16,"repeats":1}, {"scene":1,"bars":8,"repeats":1},
  {"scene":2,"bars":32,"repeats":1}, {"scene":3,"bars":16,"repeats":1},
  {"scene":1,"bars":8,"repeats":1},  {"scene":2,"bars":32,"repeats":1}
]
```

### Instellen voor een goede preset

- Zet bij elk spoor `target` op het soort apparaat dat je erop aansluit (zie hieronder); de kabel zit niet in de state.
- Houd clips kort: een drumclip van 1 maat, een akkoordclip van 4 maten, een melodie van 4 of 8 maten. De secties in het arrangement herhalen ze.
- Zet in elke scène alleen de sporen die meespelen; laat de andere clips leeg. Een `arp` of `lead` die er in de break nog net bij is, laat de overgang rustig lopen.
- Geef elke preset een eigen karakter: toonsoort, ritme, dynamiek en arrangement verschillen. Zet in `title` het tempo (en "swing on" als het genre dat nodig heeft).
- Geef noten lengtes en velocities die bij de rol passen (zie hierboven), geen vaste 1 en 0,8.

### Welk apparaat op welk spoor

| Rol | Spoortype | Sluit aan op |
|---|---|---|
| Drums, Percussion | `drums` | drumcomputer of drumkit (trig-ingang of MIDI-ingang; stel `drumProtocol` en de rijen op de kit af) |
| Bass | `notes` | bassynth (monofoon is genoeg) |
| Chords | `notes` | polyfone synth, piano of gitaar (polyfoon nodig voor akkoorden) |
| Pad | `drone` | pad-, string- of dronesynth |
| Arp | `notes` | arpeggiosynth of pluck |
| Lead | `notes` | leadsynth |
| FX | `drone` | drone- of effectsynth |

### Fouten die agents niet moeten maken

- **Noten buiten de clip**: `step` moet kleiner zijn dan `bars × 16`. Een noot met `step` ≥ de cliplengte wordt bij het laden op de laatste plek gezet. Een `len` die verder reikt dan de clip wordt bij het spelen afgekapt (de noot klinkt tot het clipeinde).
- **Hangende, overlappende noten**: twee noten van dezelfde toonhoogte die elkaar overlappen (op een monofone of drone-synth) klinken niet zoals bedoeld. Laat `len` ten hoogste tot de volgende noot van die toon lopen.
- **`vel` 0**: bestaat niet (minimum 0,01). **`vel` boven 1**: wordt afgekapt.
- **Te lange `len`** (bijvoorbeeld 64 zestienden op een korte clip van 4 stappen): wordt afgekapt bij het clipeinde, maar zet het zo niet neer. De hoogste toegestane `len` is 1024 (64 maten).
- **`step` of `len` die geen veelvoud van 0,25 is** (bijvoorbeeld 0,3): wordt bij het laden op 0,25 afgerond.
- **Meer dan 4096 noten** in een clip, meer dan 8 CC-lanes, meer dan 16 sporen of 64 secties: wordt afgekapt.
- **`row` bij een melodiespoor** of `note` zonder bijbehorende `row` bij `drums`: het drumspoor speelt de rij `row`, niet `note`.
- **`scene` buiten 0 … aantal scènes − 1** in het arrangement: wordt afgekapt.
- **Een lege `arrangement`**: valt terug op het standaardarrangement. Zet er altijd minstens één sectie in.
- **Routing, selecties of opname in de preset**: de kabels horen niet in de state; `selectedTrack`, `record` en dergelijke zijn werkstand en horen niet in een preset.
- **Merknamen** in spoor-, clip-, scène- of presetnamen of in `target`.

## Klembord: een clip kopiëren en plakken (sinds 1.17.0)

De host kopieert en plakt de gekozen clip van het gekozen spoor met de knoppen Kopieer en Plak in de kaartbalk en met Ctrl/Cmd+C en Ctrl/Cmd+V. Het apparaat doet daar drie dingen voor (contract v1.17, formaat `patchkamer-clip`, formatVersion 1; tijd in **tikken**, 12 per zestiende, dus 192 per maat; de stap van een noot in de state is in zestienden, dus tikken = stap × 12). Ze veranderen niets aan `getState()`, de presets of het geluid. Los van de eigen knoppen Kopieer clip en Plak clip, die binnen dit apparaat blijven werken.

**Het tracktype bepaalt de soort.** Een spoor van het type `notes` of `drone` kopieert en plakt `notes`; een spoor van het type `drums` kopieert en plakt `drums`. Een clip van de andere soort wordt geweigerd (`{ ok: false, reason }`); het apparaat verandert het tracktype nooit.

| Methode | Wat |
|---|---|
| `clipInfo()` | Licht, gooit nooit, verandert niets, `null` na `destroy`. `name` is "spoornaam · clipnaam", `copy` en `paste` zijn `['notes']` of `['drums']`, `length` is `min` 192, `max` 12288, `step` 192 (hele maten), `current` de lengte van de clip, `shared` onwaar. Verder `grid` `[16, 32, 64]`, `poly` 128, `range` `[0, 127]`, `vel` `continuous`, `prob` en `ratchet` waar, `maxEvents` 4096. Bij `drums` ook `lanes`: de rijen van het spoor uit `rowsOf` (dus de klanken van een aangesloten apparaat met `noteNames()`, anders de opgeslagen `rows`), met `id` `r<positie>`, `name`, `note` en `type` (alleen voor de standaardrijen: `kick`, `snare`, `clap`, `closedhat`, `openhat`, `lowtom`, `midtom`, `hitom`, `rim`, `crash`, `ride`, `shaker`, `tamb`, `conga`, `bongo`). `scheme` is `gm` voor de standaardrijen en voor toetsen, anders `device`. |
| `getClip()` | De clip als `patchkamer-clip` of `null`. `notes`: `t`, `n`, `len`, `vel` en (alleen als ze niet 1 zijn) `prob` en `ratchet`. `drums`: `lanes` zoals hierboven en `hits` met `t`, `lane` (de rij), `vel`, `prob`, `ratchet`. `length` is `bars` × 192, `grid` het raster van de clip, `swing` de clipswing (alleen als hij boven 0 is), `source.trackType` het tracktype. Noten voorbij het einde van de clip en noten van een rij die niet meer bestaat, worden niet meegegeven; een noot over het einde wordt ingekort. `native` bevat noten, CC-lanes, raster en swing voor een verliesvrije terugkeer. |
| `setClip(clip)` | Vervangt de noten van de gekozen clip en zet `bars`, `grid` en `swing`. Naam, CC-lanes (hun punten worden binnen de nieuwe lengte gehouden), de overige clips en sporen en de rest van de compositie blijven staan. Geeft `{ ok: true }` (met `dropped` als er noten weggelaten zijn) of `{ ok: false, reason }` in de taal van de host. Gooit nooit en zet niets half: bij een weigering blijft de state gelijk. Stuurt zelf geen gebeurtenissen. |

Wat `setClip` doet:

1. **Controle.** Formaat `patchkamer-clip` (formatVersion ontbreekt of is 1), `kind` past bij het tracktype, `length` is een getal. Daarna wordt alles geklemd: `length` 1 tot 12288 tikken, `bars` = `length` omhoog afgerond op hele maten (1 tot 64), `t` binnen de clip, `n` 0 tot 127, `len` 3 tikken (een 1/64) tot 12288, `vel` 0,01 tot 1, `prob` 0 tot 1, `ratchet` 1 tot 4, het raster 16, 32 of 64 (anders blijft het raster van de clip). Hoogstens **4096** noten (de rest telt als weggelaten). Onzin (`NaN`, geen getal, onbekende velden, een baan of rij die niet bestaat) valt weg of wordt genegeerd. De stappen komen op veelvouden van 0,25 zestiende (3 tikken); een tijd daartussen gaat naar het dichtstbijzijnde punt (de host doet dat al).
2. **Drumbanen.** Een slag (`hit.lane`) gaat naar de rij van dit spoor waarvan `id` (`r<positie>`) en `note` kloppen met de baan; de host heeft de banen al op de rijen van dit spoor uitgelijnd. Alleen bij standaardrijen en een GM-bron valt het apparaat terug op het nootnummer, daarna op de naam; wat nergens op past, wordt weggelaten. De `note` van de noot is die van de rij, `len` is 1.
3. **Noot-nummers.** De `id`'s van de nieuwe noten worden opnieuw uitgedeeld als 0, 1, 2, … in de volgorde van de clip; de gekozen noot (`selectedNote`) wordt gewist.
4. **Eigen clip.** Hoort `native.device` bij dit apparaat en komt de clip nog overeen met de noten in `native` (zelfde tijden, noten of rijen, lengtes, velocity, kans, ratchet en dezelfde lengte), dan komen noten (met hun `id`'s), **CC-lanes**, raster en swing exact terug. Is de clip aangepast, dan geldt stap 1 tot en met 3 en blijven de CC-lanes van het doel staan.
5. **Undo.** Een plak die iets verandert, roept eerst `remember()` aan: de knop Undo, Redo en Ctrl+Z (op de kaart) herstellen de vorige clip. Een clip die niets verandert, doet niets (ook geen geschiedenisregel).
6. **Weergave.** De kaart wordt opnieuw opgebouwd, zoals na `setState`. De afspeellus loopt door; de nieuwe noten klinken vanaf de volgende stap.

Getest met een nep-host in Node en in een echte browser (Chromium, de apparaatbestanden direct geladen): de rondreis `setClip(getClip())` laat `getState()` gelijk (2880 gevallen: drie tracktypen, drie van de acht clips, 120 willekeurige states, met en zonder klanklijst aan een drumspoor, ook via JSON-tekst), zonder `native` blijven noten en lengte gelijk; extreme en ongeldige clips (`NaN`, lengtes tot 1e9, 100000 noten, onbekende velden, verkeerde soort, onzin-banen) geven geen fout en laten de state intact of binnen het bereik; 100000 noten geven er 4096; Undo, Redo en Ctrl+Z herstellen; kopiëren van en naar Step Sequencer behoudt noten en lengte voor zover het formaat het toelaat (CC-lanes alleen binnen dit apparaat). Niet beluisterd.

## Klembord: de hele scène kopiëren en plakken (sinds 1.22.0, contract v1.24)

Naast de clip van het gekozen spoor geeft het apparaat de **scène** als één clip van de soort `multi` (contract §13d): de gekozen clip (`selectedClip`, een kolom van de matrix) van **elk** spoor. De host kopieert hem met **Shift-klik** op Kopieer of met **Kopieer alle sporen** in het plakmenu; Kopieer en Ctrl+C pakken de clip van het gekozen spoor, zoals voorheen.

- **`clipInfo()`**: `copy` en `paste` zijn `[soort, 'multi']`; nieuw is `tracks`: een item per spoor `{ id: 't<n>', name, kind, role: tracktype, length, grid, scheme, lanes (drums), … }`, met de soort uit het tracktype (toetsen en drone `notes`, drums `drums`) en de clip van dat spoor op de plaats `selectedClip`.
- **`getClip({ kind: 'multi' })`**: per spoor `{ slot, name, kind, role, clip }`, met als `clip` precies wat `getClip()` voor dat spoor zou geven (inclusief eigen `native`: noten, CC-lanes en auto-lijnen). `getClip()` zonder argument is ongewijzigd.
- **`setClip(multi)`**: elk toegewezen spoor (`slot` 0 tot aantal sporen − 1) krijgt zijn clip op de plaats `selectedClip`, met dezelfde regels als bij één clip (naam, CC-lanes en auto-lijnen blijven, tenzij `native` ze exact terugbrengt; het tracktype verandert nooit). **Eén** `remember()` voor de hele scène, dus één Undo-stap. Een spoor van een andere soort dan de clip of een spoor zonder clip op die plaats wordt overgeslagen en telt als `dropped`; geen enkel spoor toegepast: `ok: false`. De rondreis `setClip(getClip({ kind: 'multi' }))` laat `getState()` gelijk.
- Het gedrag van één clip is verplaatst naar `clipBuild(t, ci, cur, clip)` en `clipOne(t, c)` zonder gedragsverandering; `getState`, presets en geluid zijn gelijk aan 1.21.0 (byte voor byte vergeleken).

**Risico's.** Plak je een scène van een ander apparaat, dan vervangt elke toegewezen clip de noten van de gekozen kolom; sporen zonder bron (meer sporen dan de clip heeft) en drumsporen die geen enkele baan kunnen plaatsen, blijven ongemoeid en staan in de melding.

## Het presetpack

`../../../presets/clip-arranger.patchkamer-presets.json` bevat 58 presets in 10 mappen, elk een **startconfiguratie voor een compositie** gebaseerd op de muziektheorie van het genre:

- **Pop & Rock** (7): Pop Verse-Chorus, Minor Pop Anthem, Indie Rock Strum, Rock Anthem Power Chords, Punk Rock Three Chords, Pop Ballad Piano, Power Ballad Build
- **Electronic Dance** (13): Techno Peak-Time, Minimal Techno Groove, Melodic Techno Journey, Acid Techno Squelch, Deep House Chords, Classic House Piano, Tech House Groove, Progressive House Rise, Uplifting Trance Anthem, Psytrance Rolling Bass, Eurodance Hook, Electro Funk Machine, Breakbeat Rave
- **Bass Music** (7): Liquid Drum and Bass, Neurofunk Dark Roller, Jungle Break Roller, Dubstep Half-Time, UK Garage 2-Step, Trap Hats and Sub Bass, Future Bass Drop
- **Hip-Hop & Chill** (4): Boom Bap Classic, Lo-fi Late Night, G-Funk Whistle, Slow Jam Evening
- **Funk, Soul & Disco** (4): Funk Groove E9, Disco Strings, Neo-Soul Extended, Sixties Soul Pop
- **Jazz & Blues** (5): Twelve-Bar Blues Shuffle, Jazz Blues in F, Rhythm Changes AABA, Bossa Nova Walk, Jazz Ballad ii-V-I
- **Reggae & World** (4): Reggae One Drop, Roots Dub Echoes, Reggaeton Dembow, Afrobeat Groove
- **Ambient & Cinematic** (5): Ambient Drift, Dark Drone Evolution, Film Score Cue, Epic Trailer Hits, Ambient Pulse
- **Classical & Neo-Classical** (4): Neo-Classical Piano Etude, Sonata Form Allegro, Rondo Refrain ABACA, Baroque Ground Bass
- **Retro & Game** (5): Synthwave Night Drive, Chiptune Adventure, Italo Disco Cruise, 80s Synth Pop, Chiptune Boss Battle

Elke preset heeft 3 tot 7 sporen met een rol, een toonsoort en akkoordprogressie (in de songtitel staan toonsoort en tempo), tot 8 scènes met een arrangement (`songs` en `activeSong` ontbreken: elke preset is één song) in de gebruikelijke vorm, en in elke clip een eerste bruikbare invulling: drums, basfiguur, akkoordritme, pad, arp en melodie met afwisselende velocity (accenten, ghost notes, crescendo's) en lengtes van staccato tot legato. 1/32 en 1/64 komen voor bij rolls, flams, strums en laid-back timing. Bij jazz en blues staat "swing on" in de titel: zet de swing van de host aan; de noten zelf staan recht op het raster. Alle presets spelen in songmodus. De tracks hangen aan geen apparaat; het `target`-label in elk spoor zegt welk soort apparaat erbij hoort (tabel hierboven).

## Wat het apparaat met een state doet (getest)

- `setState({})` geeft de standaardstate; `setState(getState())` geeft dezelfde state terug; `setPreset(getPreset())` geeft dezelfde preset; `setPreset({})` geeft de standaardstate en laat de werkstand staan.
- Ongeldige waarden (`NaN`, `Infinity`, tekst, `null`, een lijst met rommel) geven de standaard of worden afgekapt; geen uitzonderingen. Ook bij rommel op de ingang en in `onStep` komen er alleen eindige noten van 0 … 127 met `vel` 0 … 1 en `dur` > 0 uit.
- De kaart bouwt zich opnieuw op bij `setState`, dus alle velden en knoppen volgen.
- Een oude compositie klinkt gelijk aan die van het oude bestand: bij 150 willekeurige instellingen en klokreeksen (69.572 gebeurtenissen) en 150 live-invoerreeksen met opname (33.642 gebeurtenissen) 0 verschil.
- Alle 58 presets: geldige JSON, unieke Engelse namen, `setPreset`→`getPreset` gelijk, een hele song afgespeeld (alle gebeurtenissen eindig en binnen bereik), import in de host (nl en en).
- 1.14.0: met alle nieuwe velden op hun standaard gaven oud en nieuw bij 120 willekeurige states (6 maten klok, 1 tot 6 sporen; 73.954 gebeurtenissen) 0 verschillen, en live doorgeven (noot, trig, noteoff, cc) was gelijk. Swing per niveau, kwantiseren naar het geswingde raster (jitter ± 30 ms; bij clip + spoor samen 0,5 liggen buurpunten dichter dan de jitter, daar zijn missers inherent), loop-opname in Speel deze clip met Aanvullen en Overschrijven, 40 klanken van een drumcomputer en de echte host (nl en en, geen paginafouten) zijn getest.
- 1.17.0: met de drie nieuwe methoden gaven oud (1.14.0) en nieuw bij 60 willekeurige en ongeldige states (klok, preset, ingespeelde noten, ook met een klanklijst aan een drumspoor, in nl en en) exact dezelfde gebeurtenissen en `getState` (0 afwijkingen).
- 1.21.0: een song zonder lijnen geeft exact dezelfde gebeurtenissen en state als 1.17.0 (58 presets, 12 maten klok, 42.246 gebeurtenissen, 0 verschillen; de nieuwe velden `auto`, `automation` en `recordSettings` niet meegeteld). Getest met een nep-host in Node (opschonen, afspelen, gedempt spoor, stoppen, sloten, opnemen met latch en dunnen, overschrijven, klembord) en in de echte host in Chromium met Basic Mono (nl en en, geen paginafouten): afspelen zet de knop op 0,1 en 0,9 volgens de lijn en opnemen schrijft de lijn voor Resonance met de waarden 0,25 en 0,75 terwijl de noot en de bestaande lijn blijven staan. Modulatie opnemen en het slot zijn alleen op hostniveau getest (Tremolo met een testmodulator), niet met een echte Drift.
- Niet beluisterd; er is geen echte synth of drumcomputer aan gekoppeld getest, en geen echt MIDI-toetsenbord.

## Controleren

- `node contract/validate-instrument.mjs devices/sequencers/ClipArranger/clip-arranger.patchkamer-device.js --lang nl` en `--lang en`, vanuit de root. Beide moeten `OK` geven, zonder `let op`.
- Alle tekst in het apparaat staat in het woordenboek `EN` bovenin het bestand. Een nieuwe tekst krijgt altijd nl én en.

## Wat je niet doet

- Verander nooit de `id`, de `kind`, de poort-id's of de namen van state-velden.
- Pas het apparaat niet aan om een preset te laten kloppen.
- Zet geen merknamen van bestaande apparatuur in naam, spoornamen, scènenamen, presetnamen of omschrijving, en verzin geen persoon bij `author`.
- Commit of push niet, tenzij de opdracht dat vraagt.

## Documentatie en songs

Dit zijn de plaatsen waar je terechtkunt voor documentatie en voor het componeren van songs met dit apparaat. Songs zijn CC-BY-4.0, tunes en presets CC0-1.0, het apparaat AGPL-3.0-or-later.

- Handleiding van Clip Arranger: [NL](../../../docs/sequencers/USER-MANUAL_NL.md#clip-arranger) · [EN](../../../docs/sequencers/USER-MANUAL_EN.md#clip-arranger).
- Overzicht van de soort: [README](../README.md); handleiding van de hele soort: [NL](../../../docs/sequencers/USER-MANUAL_NL.md) · [EN](../../../docs/sequencers/USER-MANUAL_EN.md).
- Presets (patronen en instellingen, `kind: set`): [clip-arranger.patchkamer-presets.json](../../../presets/clip-arranger.patchkamer-presets.json). Kies een preset als beginpunt voor de `state` van dit apparaat in de song; velden die de preset niet noemt krijgen hun standaard.
- Sequencers in het algemeen (raster, velocity, lengte, timing, accenten): [NL](../../../docs/sequencers/USER-MANUAL_NL.md#wat-de-sequencers-gemeen-hebben) · [EN](../../../docs/sequencers/USER-MANUAL_EN.md#what-the-sequencers-have-in-common). Muziektheorie vertaald naar waarden: [songs/MUSIC-THEORY.md](../../../songs/MUSIC-THEORY.md).
- Overzicht van alle apparaten en hun signaalketens: [devices/AGENTS.md](../../../devices/AGENTS.md). Een song componeren: [songs/AGENTS.md](../../../songs/AGENTS.md).
- Route voor agents: [soort Sequencers](../AGENTS.md) → [devices/AGENTS.md](../../AGENTS.md) → [root AGENTS.md](../../../AGENTS.md). Contract: [NL](../../../contract/PATCHKAMER-CONTRACT_NL.md) · [EN](../../../contract/PATCHKAMER-CONTRACT_EN.md). Hoe presets van dit apparaat zijn opgebouwd: [presets/AGENTS.md](../../../presets/AGENTS.md). <!-- agents-tree -->
- Rol in een song: sturing en songstructuur: clips, scènes en een songtijdlijn voor 1 tot 16 sporen. Elk spoor `track1` … `track16` gaat met een gebeurteniskabel naar een eigen synth of drumcomputer; de bundeluitgang `tracks` stuurt alle sporen in één kabel. Hiermee leg je intro, opbouw, break en drop vast.
