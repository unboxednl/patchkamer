# AGENTS.md: Wanderer

Dit bestand is voor AI-agents die dit apparaat configureren, er componeren of er presets voor maken. Het is niet geschreven voor mensen. Het hoort bij `../../../AGENTS.md` (algemeen); lees die eerst. Hier staat wat alleen voor Wanderer geldt.

## Wat Wanderer is

Een kansmelodie-sequencer. Hij verzint een **motief** (2 tot 64 stappen) binnen een toonladder, speelt het herhaaldelijk en verandert het beetje bij beetje: kleine stapjes met af en toe een sprong, een richtingsvoorkeur, akkoordtonen op de zware tellen, octaafsprongen, wisselende lengte en accenten. Het maakt **zelf geen geluid**: het stuurt noten (`note`, `vel`, `time`, `dur`) naar de uitgang `notes`, die je met een synth verbindt. Het volgt de klok van de studio (`onStep`). Op de ingang `akkoord` kun je een akkoord of een toetsenbord aansluiten; met `follow` gebruikt Wanderer dan alleen de vastgehouden tonen als toonschaal.

| | |
|---|---|
| Bestand | `wanderer.patchkamer-device.js` (in deze map) |
| `id` | `nl.patchkamer.wanderer`. Verander die nooit: daaraan hangen presets en songs van gebruikers |
| Naam | `Wanderer` in alle talen; de poortnamen hebben een Nederlandse variant (via `i18n`: `Akkoord / toetsen`, `Noten`) |
| Soort | `utility` (categorie `sequencer`): dit apparaat krijgt dus **presets** (geen tunes) |
| Poorten | eventingang `akkoord` (Chord / keys), modulatie-ingang `mod`, eventuitgang `notes`; geen audio |
| Contract | v1.17 (apparaatversie 1.15.0) |
| Licentie apparaat | AGPL-3.0-or-later |

Dit apparaat is de nieuwe vorm van een ouder, Nederlandstalig bestand met een andere naam en id (`nl.patchkamer.dwaler`). Presets of songs uit die tijd verwijzen naar de oude id en laden hier niet in. Een oude state (met Nederlandse toonladdernamen zoals `mineur`) wordt bij het laden herkend en omgezet naar de Engelse sleutel.

## Geen tunes, wel presets

Wanderer is een `utility`, dus het krijgt **presets** en **nooit tunes** (contract §0 en §13c). Een presetpack staat in `../../../presets/wanderer.patchkamer-presets.json`; formaat volgens contract §13c, `formatVersion` 2, licentie `CC0-1.0`, `device` is `nl.patchkamer.wanderer`, elke preset is `kind: "set"`.

## De state

`getPreset()` geeft `getState()` zonder `run` (start/stop van dit apparaat). Een preset laat `run` bij het laden staan. De state is gewone JSON.

| Veld | Wat | Bereik | Start |
|---|---|---|---|
| `density` | Kans op een noot per stap (zware tellen +15%, oneven stappen −8%) | 0 … 1 | 0,65 |
| `jump` | Kans op een grote sprong (3 tot 6 treden) in plaats van een stapje | 0 … 1 | 0,15 |
| `drift` | Richting: −1 vooral omlaag, +1 vooral omhoog | −1 … 1 | 0 |
| `chord` | Kans dat een noot op een zware tel (stap 0, 4, 8, …) naar een akkoordtoon schuift | 0 … 1 | 0,6 |
| `octave` | Kans op een octaafverplaatsing van een noot | 0 … 1 | 0,05 |
| `mut` | Kans per noot om te veranderen als het motief opnieuw begint | 0 … 1 | 0,25 |
| `reps` | Zo vaak klinkt het motief gelijk voordat er iets verandert | hele getallen 1 … 8 | 2 |
| `gate` | Notenlengte als deel van het raster (1 = hele rasterstap) | 0,05 … 1,5 | 0,6 |
| `gvar` | Variatie in notenlengte | 0 … 1 | 0,3 |
| `vel` | Basis-velocity | 0,1 … 1 | 0,75 |
| `accent` | Zware tellen harder (tot +0,3 velocity) | 0 … 1 | 0,4 |
| `ghost` | Kans dat een lichte noot (niet op stap 0, 4, 8, …) een zachte spooknoot wordt (velocity ×0,45) | 0 … 1 | 0 |
| `human` | Mensachtig: willekeurige velocity (±0,25 × waarde) en lichte vertraging bij het spelen | 0 … 1 | 0 |
| `ratchet` | Kans dat een nieuwe noot een roll van 2 tot 4 noten binnen zijn stap wordt | 0 … 1 | 0 |
| `root` | Grondtoon als MIDI-nootnummer | 24 … 84 | 57 (A3) |
| `scale` | Toonladder: `minor`, `major`, `dorian`, `phrygian`, `lydian`, `mixolydian`, `harmonic minor`, `minor pentatonic`, `major pentatonic`, `blues`, `whole tone`, `japanese` | een van die twaalf | `minor` |
| `lo`, `hi` | Laagste en hoogste noot | 12 … 108; `hi` is minstens `lo + 5` | 50 / 74 |
| `div` | Raster: stappen per zestiende noot, als tekst | `"0.25"` 1/4, `"0.5"` 1/8, `"0.75"` 1/8 triool, `"1"` 1/16, `"1.5"` 1/16 triool, `"2"` 1/32, `"3"` 1/32 triool, `"4"` 1/64 | `"1"` |
| `len` | Motieflengte in stappen van het gekozen raster | hele getallen 2 … 64 | 16 |
| `contour` | Velocity-verloop over het motief: `flat`, `crescendo`, `decrescendo`, `swell` (zacht-hard-zacht), `dip` (hard-zacht-hard) | een van die vijf | `flat` |
| `follow` | Gebruik alleen de tonen die op de ingang worden vastgehouden als toonschaal | `true`/`false` | `false` |
| `lock` | Het motief verandert niet meer | `true`/`false` | `false` |
| `run` | Speelt (werkstand, niet in een preset) | `true`/`false` | `true` |
| `preset` | Naam van het gekozen karakter in de keuzelijst: `Calm line`, `Arp wanderer`, `Bass wanderer`, `Leaps`, `Pentatonic play`, `Slow song`, `Chord follower`, `Japanese garden`, of `Own` | een van die namen | `Calm line` |
| `motif` | Het motief zelf: lijst van stappen (zie hieronder); `null` laat het apparaat een motief verzinnen | lijst of `null` | `null` (wordt direct gevuld) |
| `seed` | Niet in gebruik (de willekeur is `Math.random`); wordt altijd 1 | 1 | 1 |

Getallen buiten het bereik worden afgekapt; tekst, `NaN`, `null` of een ontbrekende waarde geeft de startwaarde. Een onbekende toonladder, raster of verloop geeft de standaard.

### Het motief (`motif`)

Een lijst van `len` objecten. Een kortere lijst wordt aangevuld met verzonnen stappen, een langere afgekapt (en bij `motif: null` verzint het apparaat alles). Elke stap:

| Veld | Wat | Bereik |
|---|---|---|
| `on` | Klinkt deze stap (`false` = rust) | `true`/`false` |
| `deg` | **Toonladdertrede** ten opzichte van `root`, niet een MIDI-nootnummer: 0 = grondtoon, 1 = tweede trede, 7 = grondtoon een octaaf hoger (bij een zevennotige schaal), −1 = zevende trede eronder. Bij een vijfnotige schaal telt een octaaf 5 treden | hele getallen −40 … 60 |
| `oct` | Extra octaafverschuiving | −1, 0, 1 |
| `vel` | Velocity van deze stap | 0,05 … 1 |
| `gate` | Lengte als deel van het raster (0,5 = staccato, 1 = tot de volgende stap, 2 = overlapt de volgende noot) | 0,05 … 4 |
| `rat` | Aantal herhalingen binnen de stap (een roll): 2 op een 1/16-raster geeft 1/32-noten, 4 geeft 1/64-noten | 1 … 4 |

De uiteindelijke noot is `root + 12 × octaaf(deg) + toonladder[deg mod n] + 12 × oct`, daarna verschoven in octaven tot hij tussen `lo` en `hi` valt. Zet `lo`/`hi` dus **ruim genoeg** (minstens een octaaf): wat daarbuiten valt wordt een octaaf verplaatst. De duur is `gate × stapduur / raster` seconden; de velocity gaat daarna nog door `contour` en `human`.

### Hoe het speelt

Op elke zestiende noot (`onStep`) speelt het apparaat `div` stappen van het motief (bij `"2"` twee, bij `"4"` vier, bij `"0.5"` om de andere zestiende). Na `len` stappen begint het motief opnieuw; na `reps` herhalingen verandert elke noot met de kans `mut` (tenzij `lock`), en soms schuift het hele motief een trede. Een stop van het transport zet de teller terug. Een stap met `rat` groter dan 1 stuurt `rat` noten uit, gelijk verdeeld over de stap, met per noot 12% minder velocity; de nootlengte is dan het gedeelte van de substap (hoogstens 1).

## Componeren met Wanderer

Twee manieren:

1. **Laat het apparaat verzinnen** (`motif: null` of `len` veranderen): stel `scale`, `root`, `lo`/`hi`, `density`, `jump`, `drift`, `chord` in, en laat `mut`/`reps` de variatie bepalen. Goed voor generatieve lijnen, arps en bijlijnen. Het resultaat verschilt bij elke import.
2. **Schrijf het motief zelf** en zet `lock: true` (of `mut: 0`): een hook die steeds hetzelfde klinkt. Dit is de manier voor een herkenbaar thema, ostinato of basfiguur. Zet `preset` op `"Own"`.

### Timing en toonlengte

- **Raster per rol**: `"1"` (1/16) voor melodie en bas; `"0.5"` (1/8) voor trage lijnen en ballads; `"0.75"`/`"1.5"` voor triolen; `"2"` (1/32) voor snelle runs, schitterende arps en trillers; `"4"` (1/64) alleen voor sprays en roll-effecten. Reken `len × stapduur`: 16 stappen op 1/16 is een maat; 32 stappen op 1/32 ook; 64 stappen op 1/64 ook.
- **Toonlengte**: `gate` 0,2 … 0,4 is staccato (pluck, bas, techno), 0,5 … 0,8 normaal, 0,9 … 1 legato (stap loopt aan de volgende vast), 1,2 … 1,5 overlappend (pad-achtig; de synth moet polyfoon zijn of de noten afkappen). Per stap kan `gate` tot 4 (een lange noot over meerdere stappen heen; zet de stappen erachter op `on: false`).
- **Rolls en grace notes**: `rat: 2` of `3` op een enkele stap; `rat: 4` op een 1/16-raster geeft een 1/64-roll. Gebruik ze spaarzaam (een of twee per maat); `ratchet` in het algemeen 0,1 … 0,3, hoger voor trap-achtige stotters.
- **Swing en humanize**: swing komt van de klok van de studio, plus de eigen `swing` van dit apparaat. `human` 0,1 … 0,3 maakt het levendiger (velocity en kleine vertraging); boven 0,6 klinkt het slordig.

### Velocity en dynamiek

- **Accenten**: `accent` 0,5 … 0,8 legt de nadruk op de eerste tel van elke vier stappen; op een eigen motief zet je `vel` van de zware stappen op 0,9 … 1 en de rest op 0,5 … 0,7.
- **Ghost notes**: `ghost` 0,3 … 0,8 voor funk, dub en groove; een eigen motief krijgt stappen met `vel` 0,2 … 0,35 tussen de harde (`vel` 0,85 … 1).
- **Crescendo/decrescendo**: `contour` `crescendo` (opbouw, intro), `decrescendo` (uitklinken), `swell` (frase), `dip`. Het verloopt over het hele motief, ook bij een eigen motief.
- **Dynamiek per spoor**: Wanderer is één lijn; geef een basfiguur een hogere `vel` (0,8 … 0,95) en een bijlijn of pad een lagere (0,45 … 0,65).

### Per rol

| Rol | Instelling |
|---|---|
| Lead / hook | `scale` `minor` of `dorian`, `lo`/`hi` een octaaf of twee boven `root`, `density` 0,6 … 0,8, `jump` 0,15 … 0,25, `chord` 0,6 … 0,8, `gate` 0,5 … 0,8, `lock` na het vinden van een goede |
| Bas | `root` 28 … 40, `lo` 28, `hi` 52, `density` 0,5 … 0,9, `jump` laag, `chord` 0,8 … 0,9, `gate` 0,3 … 0,8, `accent` 0,6 … 0,8 |
| Arp | `density` 1, `jump` 0 … 0,05, `chord` 0,9, `gate` 0,3 … 0,5, `len` 8 of 16, `reps` 4 … 8, `mut` laag |
| Ambient | `div` `"0.5"` of `"0.25"`, `density` 0,3 … 0,6, `gate` 1,2 … 1,5, `vel` 0,45 … 0,6, `human` 0,2 … 0,4, grote `jump`, `japanese` of `whole tone` of `lydian` |
| Akkoord volgen | `follow: true`; speel een akkoord op de ingang; zonder akkoord speelt hij de gewone toonladder |

Gebruikelijke structuren: een hook van 8 of 16 stappen, `reps` 4 tot 8, dan verandering (`mut` 0,2 … 0,4); een A-frase van 4 maten en een licht veranderde B-frase door `lock` uit te zetten; een bas die een maat of twee loopt (`len` 16 op 1/16, `reps` 4).

### Voorbeeld: een eigen hook (acht stappen, accenten en lengtes)

```json
{ "root": 57, "scale": "minor", "lo": 57, "hi": 88, "div": "1", "len": 8, "lock": true, "mut": 0, "reps": 8, "preset": "Own", "contour": "flat",
  "motif": [
    {"on":true,"deg":0,"oct":0,"vel":1.0,"gate":0.5,"rat":1},
    {"on":false,"deg":0,"oct":0,"vel":0.6,"gate":0.5,"rat":1},
    {"on":true,"deg":2,"oct":0,"vel":0.5,"gate":0.3,"rat":1},
    {"on":true,"deg":4,"oct":0,"vel":0.7,"gate":0.3,"rat":2},
    {"on":true,"deg":7,"oct":0,"vel":0.9,"gate":1.5,"rat":1},
    {"on":false,"deg":0,"oct":0,"vel":0.6,"gate":0.5,"rat":1},
    {"on":true,"deg":4,"oct":0,"vel":0.45,"gate":0.3,"rat":1},
    {"on":true,"deg":2,"oct":0,"vel":0.6,"gate":0.5,"rat":1} ] }
```

## Instellen voor een goede preset

- Geef elke preset een eigen, herkenbaar doel: toonladder, rol (lead/bas/arp/ambient), raster en dynamiek verschillen.
- Neem een kant-en-klaar `motif` mee (zeker bij `lock`), zodat de preset steeds gelijk klinkt en een `setPreset` → `getPreset` rondje dezelfde state geeft. Rond velocity en lengte af op twee decimalen.
- Houd `lo`/`hi` bij de rol: bas 24 … 55, lead 55 … 90, glans 70 … 100.
- Gebruik alle drie dynamiekmiddelen (`vel`/`accent`, `ghost`, `contour`) in de presets waar ze bij passen, niet overal.

### Wat een preset niet moet doen

- `density` 0, of een eigen motief met overal `on: false`: stil.
- `hi` minder dan een octaaf boven `lo`: noten schuiven rond.
- `gate` 1,5 met een snel raster en veel noten: hangende, overlappende noten bij een monofone synth.
- `ratchet` hoog met `div` `"2"` of `"4"`: zeer veel noten per seconde.
- `vel` 0 in `motif`: de minimumwaarde is 0,05.
- Geen routing in de state: de kabels horen er niet in. Geen `run` in een preset. Geen veld verzinnen.
- Noten staan niet als MIDI-nummer in `motif` maar als toonladdertrede (`deg`).

## Live toetsenbord

Wanderer heeft geen sporen of clips: het toetsenbord is hier de **akkoordbron** zelf (ingang `akkoord`, met `follow`), niet iets dat wordt doorgestuurd of opgenomen. Er wordt dus geen toetsenbord naar een synth doorgegeven en niets ingespeeld. Wil je het toetsenbord direct een synth laten bespelen, verbind dan het toetsenbord ook met de synth (je eigen keuze; het apparaat stuurt het niet dubbel).

## Wat het apparaat met een state doet (getest)

- `setState({})` geeft alle startwaarden; `setState(getState())` en `setPreset(getPreset())` geven dezelfde state terug.
- Ongeldige waarden (`NaN`, `Infinity`, tekst, `null`, `{}`, `[]`, extreme getallen, rommel in `motif`) geven de standaard of worden afgekapt; geen uitzondering.
- Alle uitgestuurde gebeurtenissen zijn eindig met `note` 0 … 127, `vel` 0 … 1, `dur` > 0 (400 willekeurige runs met rommel op ingang en klok, ruim 57000 gebeurtenissen, geen enkele overtreding).
- Met een ongewijzigde (oude) state en dezelfde willekeur geeft het apparaat dezelfde gebeurtenissen als het oude bestand: 400 willekeurige runs, 11640 gebeurtenissen, 0 verschillen. Nieuwe velden gebruiken alleen willekeur als ze aan staan.
- Niet beluisterd; geen echte synth of toetsenbord aangesloten getest.

## Swing (1.14.0)

Nieuwe sleutel `swing` (0 … 0,5 van een zestiende, standaard 0, schuif "Swing" bij Voordracht; niet te moduleren, zodat de lijst stuurbare parameters gelijk blijft; altijd in de state).

Regel (voor alle apparaten gelijk): `swing` is een fractie van een zestiende (0 … 0,5; de UI toont 0 … 50 %, dubbelklik op een schuif = 0). De lokale vertraging van een gebeurtenis in een **oneven zestiende** (positie in zestienden, naar beneden afgerond, is oneven) is `(som van de niveaus) × stepDur`, de som begrensd op 0,5; de swing van de host (`info.time`) blijft er los onder. Even zestienden blijven staan. Rasters van 1/8 en langzamer hebben alleen gebeurtenissen op even zestienden en schuiven dus niet. Een ontbrekend of niet-eindig veld is 0; met alles op 0 spelen state en klokstappen precies als voor versie 1.11.0. Een noot (en elke noot van een ratchet) valt in een oneven zestiende als `floor(stap / raster)` oneven is; bij raster 1/8 en 1/4 schuift niets. Er wordt geen extra willekeur gebruikt, dus dezelfde reeks willekeurige getallen geeft met swing 0 dezelfde noten als voorheen. Opnemen/kwantiseren is niet van toepassing: dit apparaat is een generator.

## Klembord: alleen kopiëren (sinds 1.15.0)

De host kopieert met de knop Kopieer in de kaartbalk en met Ctrl/Cmd+C (contract v1.17, formaat `patchkamer-clip`, tijd in **tikken**, 12 per zestiende). Wanderer is een generator: het motief bestaat uit toonladdertrappen (`deg`, `oct`) die bij het spelen met `root`, de toonladder en het bereik naar MIDI worden omgezet, en het verandert zelf. Terugrekenen van een clip naar trappen is niet eenduidig, dus `paste` is altijd `[]` en Plak wordt grijs. Niets hiervan verandert `getState()`, de presets of het geluid.

| Methode | Wat |
|---|---|
| `clipInfo()` | `copy` is `['notes']`, `paste` is `[]`; `length` = motieflengte × stapduur in tikken (`12 / div` per stap). Zonder motief: `copy` leeg. |
| `getClip()` | Het huidige motief als `notes`: elke stap die aan staat wordt de MIDI-noot die hij nu zou spelen (met `Volg akkoord` aan: op de nu vastgehouden toonhoogten), `vel` met het verloop (`contour`), `len` = `gate` × stapduur, een ratchet als aparte noten met aflopende velocity. `swing` is de knop. Humanize en willekeurige ratchets zitten er niet in. |
| `setClip(clip)` | Geeft altijd `{ ok: false, reason }`, behalve voor de eigen momentopname (`native.device` = dit `id`): dan `{ ok: true }` zonder wijziging. |

Sinds 1.15.0 staat `modExclude: ['reps']` in de definitie (Herhaal eerst is een geheel getal en bewust niet stuurbaar; de validator meldde dat voorheen als let op). Geen invloed op de state.

**Risico's.** Momentopname van de stand van dat moment: het motief muteert verder, de kopie niet. Een motief dat een ander bereik of een andere toonladder heeft op het moment van plakken, blijft zoals gekopieerd (het zijn gewone noten). Humanize en toevalsratchets kunnen niet vooraf bekeken worden.

## Controleren

- `node contract/validate-instrument.mjs devices/sequencers/Wanderer/wanderer.patchkamer-device.js --lang nl` en `--lang en`, vanuit de root. Beide moeten `OK` geven, zonder `let op`.
- Alle tekst staat in het woordenboek `EN` bovenin het bestand. Een nieuwe tekst krijgt altijd nl én en.

## Wat je niet doet

- Verander nooit de `id`, de `kind`, de poort-id's (`akkoord`, `notes`, `mod`) of de namen van state-velden.
- Pas het apparaat niet aan om een preset te laten kloppen.
- Zet geen merknamen van bestaande apparatuur in naam of omschrijving, en verzin geen persoon bij `author`.
- Commit of push niet, tenzij de opdracht dat vraagt.

## Documentatie en songs

Dit zijn de plaatsen waar je terechtkunt voor documentatie en voor het componeren van songs met dit apparaat. Songs zijn CC-BY-4.0, tunes en presets CC0-1.0, het apparaat AGPL-3.0-or-later.

- Handleiding van Wanderer: [NL](../../../docs/sequencers/USER-MANUAL_NL.md#wanderer) · [EN](../../../docs/sequencers/USER-MANUAL_EN.md#wanderer).
- Overzicht van de soort: [README](../README.md); handleiding van de hele soort: [NL](../../../docs/sequencers/USER-MANUAL_NL.md) · [EN](../../../docs/sequencers/USER-MANUAL_EN.md).
- Presets (patronen en instellingen, `kind: set`): [wanderer.patchkamer-presets.json](../../../presets/wanderer.patchkamer-presets.json). Kies een preset als beginpunt voor de `state` van dit apparaat in de song; velden die de preset niet noemt krijgen hun standaard.
- Sequencers in het algemeen (raster, velocity, lengte, timing, accenten): [NL](../../../docs/sequencers/USER-MANUAL_NL.md#wat-de-sequencers-gemeen-hebben) · [EN](../../../docs/sequencers/USER-MANUAL_EN.md#what-the-sequencers-have-in-common). Muziektheorie vertaald naar waarden: [songs/MUSIC-THEORY.md](../../../songs/MUSIC-THEORY.md).
- Overzicht van alle apparaten en hun signaalketens: [devices/AGENTS.md](../../../devices/AGENTS.md). Een song componeren: [songs/AGENTS.md](../../../songs/AGENTS.md).
- Route voor agents: [soort Sequencers](../AGENTS.md) → [devices/AGENTS.md](../../AGENTS.md) → [root AGENTS.md](../../../AGENTS.md). Contract: [NL](../../../contract/PATCHKAMER-CONTRACT_NL.md) · [EN](../../../contract/PATCHKAMER-CONTRACT_EN.md). Hoe presets van dit apparaat zijn opgebouwd: [presets/AGENTS.md](../../../presets/AGENTS.md). <!-- agents-tree -->
- Rol in een song: sturing, kansmelodie in een toonladder die langzaam verandert (lead, bovenstem). Eventingang `akkoord` volgt een akkoord uit bijvoorbeeld een Chord Sequencer, eventuitgang `notes` gaat naar een synth.
