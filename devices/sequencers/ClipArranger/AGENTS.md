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
| Poorten | eventingang `input`; eventuitgangen `track1` … `track16`; geen audio, geen sturing; multi-MIDI-uitgang `tracks` (Tracks: alle sporen met hun namen in één dubbele gestreepte oranje kabel, elke gebeurtenis met `track` en `ch` = spoornummer; de losse spooruitgangen blijven ongewijzigd) |
| Contract | v1.13 (apparaatversie 1.13.0) |
| Licentie apparaat | AGPL-3.0-or-later |

Verschil met de andere sequencers: Chord Sequencer maakt akkoorden en patronen met vier sporen en scènes van vier sporen; Pattern Playlist en Pattern Tracker bouwen een song van patronen in een playlist of tracker. Clip Arranger werkt zoals een sessieweergave: een matrix van clips per spoor en per scène, plus een lineair song-arrangement erboven.

## Geen tunes, wel presets

`kind` is `utility`, dus **presets** en **nooit tunes** (contract §0 en §13c). Het presetpack staat in `../../../presets/clip-arranger.patchkamer-presets.json` (`formatVersion` 2, licentie `CC0-1.0`, `device` is `nl.patchkamer.cliparranger`, elke preset is `kind: "set"`). Het pack heet "Clip Arranger Song Starters": 58 compositiestarts per genre (zie onderaan).

## De state

`getPreset()` geeft `getState()` zonder de werkstand: `selectedTrack`, `selectedClip`, `selectedSection`, `editPage`, `zoom`, `pianoBase`, `drawLength`, `drawVelocity`, `drawProbability`, `drawRatchet`, `selectedNote`, `selectedRow`, `record`, `quantize`, `ccId`, `ccShape`. Een preset laat die velden bij het laden staan. De state is gewone JSON. Een getal buiten het bereik wordt afgekapt; tekst, `NaN`, `null` of een ontbrekende waarde geeft de standaard; onbekende velden worden genegeerd. `setState({})` geeft het lege standaardproject (4 sporen, 8 scènes, een kort arrangement).

### Bovenste niveau

| Veld | Wat | Bereik | Standaard |
|---|---|---|---|
| `title` | Songtitel; leeg = "Nieuwe song" / "New song" in de taal van de gebruiker | tekst, hoogstens 64 tekens | `""` |
| `tracks` | Lijst van 1 tot 16 sporen (zie hieronder). Meer dan 16 wordt afgekapt | 1 … 16 | 4 sporen |
| `scenes` | Lijst van **8** scènes `{name}`; een lege naam volgt de taal (Intro, Groove, Variation, Break, Build-up, Main, Outro, Free) | 8 vaste plaatsen | 8 lege namen |
| `arrangement` | Lijst van 1 tot 64 secties `{scene, bars, repeats}` | zie hieronder | 5 secties |
| `mode` | `"session"`: clips en scènes lanceren; `"song"`: het arrangement afspelen | `"session"` of `"song"` | `"session"` |
| `songLoop` | Het arrangement begint opnieuw na het einde | `true`/`false` | `true` |
| `armed` | De sequencer speelt (`false` is stil) | `true`/`false` | `true` |

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
| `drumProtocol` | `trig`: stuurt `trig` met de `lane` van de rij; `note`: stuurt `note` met het MIDI-nummer van de rij | `trig` of `note` | `trig` |
| `rows` | 16 drumrijen `{name, note, lane}` (alleen bij `drums` van belang) | 16 vaste rijen | zie hieronder |
| `clips` | Lijst van **8** clips | 8 vaste plaatsen | 8 lege clips |
| `liveClip` | Welke clip in sessiemodus speelt; −1 = gestopt | −1 … 7 | 0 |

Standaard drumrijen (index 0 … 15, MIDI-nummer, lane): Kick 36 `ch1`, Snare 38 `ch2`, Clap 39 `ch3`, Closed hat 42 `ch4`, Open hat 46 `ch5`, Low tom 45 `ch6`, Mid tom 47 `ch7`, High tom 50 `ch8`, Rim 37 `ch9`, Crash 49 `ch10`, Ride 51 `ch11`, Shaker 70 `ch12`, Tambourine 54 `ch13`, Conga 64 `ch14`, Bongo 60 `ch15`, Percussion 75 `ch16`. Een noot op een drumspoor wijst met `row` (0 … 15) naar de rij; `note` hoort bij `rows[row].note` te zijn.

### Een clip in `tracks[i].clips[j]`

| Veld | Wat | Bereik | Standaard |
|---|---|---|---|
| `name` | Clipnaam | hoogstens 32 tekens | `Clip n` |
| `bars` | Lengte in maten (een maat is 16 zestienden) | 1 … 64 | 1 |
| `grid` | **Raster van de editor** voor deze clip: `16` = 1/16, `32` = 1/32, `64` = 1/64 | 16, 32 of 64 | 16 |
| `notes` | Lijst van noten (zie hieronder), hoogstens 4096 | | `[]` |
| `cc` | Lijst van hoogstens 8 CC-lanes `{id, shape, points}` | | `[]` |

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

### Het arrangement

`arrangement[n] = {scene, bars, repeats}`: de scène (0 … 7), de lengte van de sectie in maten (1 … 64) en het aantal herhalingen (1 … 16). **Een sectie duurt `bars × repeats` maten.** Elke clip van die scène herhaalt zichzelf binnen de sectie. Een koorclip van 4 maten in een sectie van 8 maten speelt dus twee keer; een clip van 8 maten in een sectie van 4 maten wordt na 4 maten afgebroken (alles wat doorloopt wordt bij de sectiegrens afgekapt). Zet `bars` van de sectie dus op een veelvoud van de langste clip. Noten van elk spoor stoppen uiterlijk bij het einde van hun clip of sectie.

## Hoe het speelt

Op elke zestiende noot (`onStep`) kijkt elk spoor in zijn clip welke noten beginnen in dat stapje. Een noot met `step` 3,25 begint in stap 3 en wordt een kwart zestiende later gespeeld (`time = tijd van de stap + 0,25 × stepDur`). De uitgang krijgt `{type:'note', note, vel, time, dur}` (nootnummer + transpositie van het spoor, afgekapt op 0 … 127; `vel = vel × spoorvelocity`; `dur = len × lengte van een zestiende × gate`, nooit korter dan 0,01 s). Een drumspoor met `drumProtocol: "trig"` stuurt `{type:'trig', lane, vel, time}` en herhaalt een noot `ratchet` keer binnen een zestiende. Een noot met `prob` onder 1 speelt met die kans (willekeurig, per ronde anders). Niet-eindige of ongeldige klokstappen (`stepDur`, `time`, `bpm`) worden genegeerd.

Scènes lanceren op de volgende maat (sessiemodus). In songmodus bepaalt het arrangement welke scène speelt.

## Live spelen en inspelen (ingang `input`)

- Sluit een toetsenbord (device Keys of een andere notenbron) op `input` aan. De noten gaan **direct door naar de uitgang van het geselecteerde spoor** (met velocity en toonlengte), zodat je de synth op dat spoor kunt bespelen zonder een tweede kabel van het toetsenbord. Is het toetsenbord ook direct met die synth verbonden, dan klinkt het dubbel: dat is jouw keuze.
- Een vastgehouden toets (`held: true` met `noteoff`, zoals Keys in de stand "Toets vasthouden") wordt doorgegeven en afgesloten met een `noteoff` op dezelfde uitgang. Wisselt het geselecteerde spoor, of komt er een nieuwe state, of wordt het apparaat verwijderd, dan krijgt het oude spoor een `noteoff` voor elke nog klinkende toets. `allnotesoff` en `panic` sluiten alles af. Een tweede aanslag van dezelfde nog vastgehouden toets sluit de eerste eerst af.
- Op een drumspoor worden noten naar de drumrij met dat nootnummer gestuurd, en `trig` naar de rij met die `lane` (of die naam). Noten zonder rij worden niet doorgegeven.
- **Opname**: staat `record` aan en loopt de transport, dan schrijft elke inkomende noot een nootobject in de **geselecteerde clip van het geselecteerde spoor**, op de juiste plek. `vel` is de velocity van de aanslag, `len` de duur (van noteon tot noteoff, of `dur` van het event), op de rasterstap afgerond en minstens één rasterstap. Het raster is dat van de clip (`grid`). `quantize` (standaard aan) rondt de beginpositie af op dat raster; uit rondt af op 1/64. Dit zijn werkstanden die in een preset niet worden opgeslagen.

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
3. Maak scènes (maximaal 8) met `name` voor elke rol in de vorm (Intro, Verse, Chorus, Build, Drop, Break, Bridge, Outro).
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
- Swing/humanize: swing zit in de host-klok; humanize doe je met kleine verschuivingen van 0,25 in `step` en kleine verschillen in `vel`.

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
- **`scene` buiten 0 … 7** in het arrangement: wordt afgekapt.
- **Een lege `arrangement`**: valt terug op het standaardarrangement. Zet er altijd minstens één sectie in.
- **Routing, selecties of opname in de preset**: de kabels horen niet in de state; `selectedTrack`, `record` en dergelijke zijn werkstand en horen niet in een preset.
- **Merknamen** in spoor-, clip-, scène- of presetnamen of in `target`.

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

Elke preset heeft 3 tot 7 sporen met een rol, een toonsoort en akkoordprogressie (in de songtitel staan toonsoort en tempo), tot 8 scènes met een arrangement in de gebruikelijke vorm, en in elke clip een eerste bruikbare invulling: drums, basfiguur, akkoordritme, pad, arp en melodie met afwisselende velocity (accenten, ghost notes, crescendo's) en lengtes van staccato tot legato. 1/32 en 1/64 komen voor bij rolls, flams, strums en laid-back timing. Bij jazz en blues staat "swing on" in de titel: zet de swing van de host aan; de noten zelf staan recht op het raster. Alle presets spelen in songmodus. De tracks hangen aan geen apparaat; het `target`-label in elk spoor zegt welk soort apparaat erbij hoort (tabel hierboven).

## Wat het apparaat met een state doet (getest)

- `setState({})` geeft de standaardstate; `setState(getState())` geeft dezelfde state terug; `setPreset(getPreset())` geeft dezelfde preset; `setPreset({})` geeft de standaardstate en laat de werkstand staan.
- Ongeldige waarden (`NaN`, `Infinity`, tekst, `null`, een lijst met rommel) geven de standaard of worden afgekapt; geen uitzonderingen. Ook bij rommel op de ingang en in `onStep` komen er alleen eindige noten van 0 … 127 met `vel` 0 … 1 en `dur` > 0 uit.
- De kaart bouwt zich opnieuw op bij `setState`, dus alle velden en knoppen volgen.
- Een oude compositie klinkt gelijk aan die van het oude bestand: bij 150 willekeurige instellingen en klokreeksen (69.572 gebeurtenissen) en 150 live-invoerreeksen met opname (33.642 gebeurtenissen) 0 verschil.
- Alle 58 presets: geldige JSON, unieke Engelse namen, `setPreset`→`getPreset` gelijk, een hele song afgespeeld (alle gebeurtenissen eindig en binnen bereik), import in de host (nl en en).
- Niet beluisterd; er is geen echte synth of drumcomputer aan gekoppeld getest, en geen echt MIDI-toetsenbord.

## Controleren

- `node contract/validate-instrument.mjs devices/sequencers/ClipArranger/clip-arranger.patchkamer-device.js --lang nl` en `--lang en`, vanuit de root. Beide moeten `OK` geven, zonder `let op`.
- Alle tekst in het apparaat staat in het woordenboek `EN` bovenin het bestand. Een nieuwe tekst krijgt altijd nl én en.

## Wat je niet doet

- Verander nooit de `id`, de `kind`, de poort-id's of de namen van state-velden.
- Pas het apparaat niet aan om een preset te laten kloppen.
- Zet geen merknamen van bestaande apparatuur in naam, spoornamen, scènenamen, presetnamen of omschrijving, en verzin geen persoon bij `author`.
- Commit of push niet, tenzij de opdracht dat vraagt.
