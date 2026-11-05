# AGENTS.md: Mist

Dit bestand is voor AI-agents die **tunes voor Mist** maken. Het is niet geschreven voor mensen. Het hoort bij `../../../AGENTS.md` (algemeen) en `../../../tunes/AGENTS.md` (regels voor tunepacks); lees die eerst. Hier staat wat alleen voor Mist geldt.

## Wat Mist is

Een drone- en ambient-synth die meeloopt met de transport van de host. Acht oscillators (om en om sinus en driehoek, licht tegen elkaar verstemd) vormen een stilstaand akkoord (de drone) dat door een poort (gate) langzaam in- en uitfadet. Daaronder ligt een bruine ruis die als wind door een bandfilter gaat. Alles loopt door een toonfilter (lowpass met een trage LFO), een hoogdoorlaatfilter van 35 Hz, een galm van 6 seconden, twee stereo-echo's met terugkoppeling, een compressor en een zachte begrenzer (plafond 0,8). Een trage LFO beweegt het stereobeeld.

Zolang de transport loopt en de stand **Drone + noten** (`mode: "drone"`) aan staat, speelt Mist ook zelf: de akkoorden wisselen elke `evolve` maten (acht akkoorden in een vaste toonsoort, majeur of mineur naar het gekozen akkoord) en er klinkt een automatische melodie van sinus-met-driehoek-tonen, geklokt op de stappen van de transport. Daarnaast speelt het externe noten (`note`, `trig`, `cc`) van elke sequencer of keyboard, tot twaalf tegelijk.

Het verschil met `BowedEnsemble` (`../BowedEnsemble/`, een strijkersensemble dat alleen ontvangen noten speelt) en `ChordPoly`: Mist heeft **geen toetsenbordgedrag als hoofdzaak**. Het is een stilstaande, evoluerende klankvloer met eigen akkoordgang en melodie, bedoeld als bed onder een song.

| | |
|---|---|
| Bestand | `mist.patchkamer-device.js` (in deze map) |
| `id` | `nl.patchkamer.mist`. Verander die nooit: daaraan hangen tunes en songs van gebruikers |
| Naam | `Mist` in alle talen; de poortnamen hebben een Nederlandse variant (via `i18n`: `Stereo uit`, `Noten / CC`) |
| Soort | `instrument`: dit apparaat krijgt dus **tunes** (geen presets) |
| Poorten | eventingang `notes` (Notes / CC), modulatie-ingang `mod`, audio-uitgang `out` (Stereo out, stereo) |
| Contract | v1.11 |
| Licentie apparaat | AGPL-3.0-or-later |

Dit apparaat is de nieuwe, bijgewerkte vorm van een ouder bestand met een andere naam en id (Nevel, `nl.patchkamer.nevel`). Tunes of songs uit die tijd verwijzen naar de oude id en laden hier niet in. De state-sleutels zijn ongewijzigd; de namen van de klanken in de keuzelijst zijn Engels geworden (zie `preset` hieronder).

## Wat je hier doet

Je maakt klanken (tunes) voor Mist en zet ze als pack in `../../../tunes/`. Het apparaat zelf pas je alleen aan als de opdracht dat zegt (`version` ophogen; `id`, poort-id's en state-velden gelijk houden).

## De state

`getState()` geeft de 17 velden hieronder (getallen en tekst, gewone JSON: geen lijsten, geen patroon, geen routing). Er is **geen** `getPreset`: een tune bewaart de hele state. Een getal wordt op de stap van het veld afgerond en in het bereik afgekapt; een tekst, `NaN`, `Infinity`, `null` of een ontbrekende waarde geeft de startwaarde.

### Harmonie en spel

| Veld | Wat het doet | Waarden / bereik | Stap | Start |
|---|---|---|---|---|
| `root` | Grondtoon van de drone en de automatische melodie, als MIDI-nootnummer (48 = C3). Een externe noot die je speelt, verandert hierdoor niet | 24 … 84 | 1 | 48 |
| `chord` | Akkoordtype van het eerste akkoord van de reeks (elke achtste periode keert het terug): `open` (grondtoon, kwint, octaaf, kwint boven het octaaf), `minor` (mineur 7), `major` (majeur 7), `suspended` (sus), `add9`, `minor9`, `major9`, `sixth` (majeur 6). `minor` en `minor9` geven ook mineur akkoorden in de rest van de reeks, alle andere majeur | acht keuzes | | `open` |
| `mode` | `drone`: stilstaand akkoord plus automatische akkoordgang en melodie zolang de transport loopt. `notes`: de drone is stil en er klinken alleen de noten die je op `notes` stuurt | `drone` of `notes` | | `drone` |
| `evolve` | Na hoeveel maten het akkoord wisselt (alleen met transport en `mode: "drone"`) | 1 … 16 | 1 | 4 |
| `melody` | Niveau van de automatische melodie (0 = geen) | 0 … 1 | 0,01 | 0,65 |
| `density` | Hoe vaak de melodie een toon speelt: onder 0,2 elke 32 stappen, tot 0,45 elke 16, tot 0,75 elke 8, daarboven elke 4 stappen. 0 = geen toon | 0 … 1 | 0,01 | 0,35 |

### Klank

| Veld | Wat het doet | Bereik | Stap | Start |
|---|---|---|---|---|
| `cutoff` | Helderheid: lowpass-cutoff van het toonfilter, in Hz. Een trage LFO beweegt hem met `cutoff × 0,45 × motion` | 150 … 8000 | 10 | 1800 |
| `warmth` | Warmte: de driehoek-oscillators (de oneven) worden luider, de sinussen blijven gelijk | 0 … 1 | 0,01 | 0,65 |
| `detune` | Zweving: de oscillators staan om en om zoveel cent boven en onder de toon | 0 … 14 | 0,1 | 5 |
| `air` | Wind: hoeveel bruine ruis door een bandfilter bij de drone komt | 0 … 1 | 0,01 | 0,22 |
| `motion` | Beweging: snelheid en diepte van de LFO's (filter, wind, stereobeeld) | 0 … 1 | 0,01 | 0,45 |
| `attack` | Opkomst in seconden: hoe lang de drone en elke noot erover doen om op te komen (de drone gebruikt een derde ervan als tijdconstante) | 0,2 … 12 | 0,1 | 4 |
| `release` | Uitklank in seconden na een noot of na het stoppen van de transport | 1 … 24 | 0,1 | 9 |

### Ruimte en niveau

| Veld | Wat het doet | Bereik | Stap | Start |
|---|---|---|---|---|
| `space` | Galm: hoeveel van de 6 s lange galm erbij komt (en het droge geluid gaat iets omlaag) | 0 … 1 | 0,01 | 0,65 |
| `echo` | Echo: niveau en terugkoppeling van de twee stereo-echo's (0,57 s en 0,79 s) | 0 … 0,75 | 0,01 | 0,3 |
| `level` | Uitgangsniveau | 0 … 1 | 0,01 | 0,65 |

### Het veld `preset`

| Veld | Wat | Waarden | Start |
|---|---|---|---|
| `preset` | De naam van de gekozen klank in de keuzelijst **Soundscape** op de kaart. Het is alleen een label: het zet zelf niets. De kaart zet het op `Custom` zodra een knop verandert | `Mist`, `Deep Space`, `Tides`, `Twilight`, `Morning Light`, `Velvet Sky`, `Starfield`, `Quiet Piano`, `Moon Water`, `Warm Memory`, `Floating Islands`, `Northern Lights`, `Cathedral`, `Breathing Room`, `Custom` | `Mist` |

Een ongeldige waarde geeft de startwaarde. De oude Nederlandse namen worden bij het laden herkend (`Eigen` wordt `Custom`, `Diepe ruimte` wordt `Deep Space` enzovoort). **Zet in een tune `"preset": "Custom"`**: laat je het veld weg, dan staat de keuzelijst op `Mist` terwijl de klank anders is. Zet er nooit een van de andere namen in, want dat is een belofte die niet klopt. De keuzelijst zet de bijbehorende waarden wel echt in de state; je kunt de klankwaarden van de ingebouwde klanken dus als uitgangspunt gebruiken door ze op de kaart te kiezen en `getState()` te lezen.

Velden die niet in een tune horen: er zijn er geen. Er is geen routing, geen patroon en geen klokstand in de state. De knop **Start drone** op de kaart (laat de drone zonder transport klinken) en de klokstand van de transport horen niet bij de state.

## Wat het apparaat met een state doet (getest)

- `setState({})` geeft alle startwaarden; `setState(getState())` geeft dezelfde state terug.
- Getallen buiten het bereik worden afgekapt (`cutoff: 1e9` wordt 8000, `echo: 5` wordt 0,75); een tekst, `NaN`, `Infinity`, `null` of een ontbrekende waarde geeft de startwaarde. Een onbekend `chord` of `mode` geeft de startwaarde. Onbekende velden worden genegeerd. Zet er geen in.
- De knoppen en de keuzelijsten op de kaart bewegen mee met `setState`; alle audioparameters gaan zacht over (niet beluisterd).

## Spelen, transport en modulatie

- **De drone klinkt alleen als de transport loopt** (of als iemand op de kaart op Start drone klikt) en `mode` gelijk is aan `drone`. Een tune in `drone` is dus stil in een song waarvan de transport stilstaat. Stopt de transport, dan sterft alles uit in `release` seconden.
- Eventingang `notes`: `note` (met `time`, `note`, `vel`, `dur`; zonder `dur` klinkt de noot 4 seconden), `trig` (een toon uit het huidige akkoord, vier seconden) en `cc` (`id` gelijk aan een veld uit de tabellen, `value` 0 … 1 zet dat veld over zijn bereik en zet `preset` op `Custom`). Er zijn maximaal twaalf noten tegelijk, ook de automatische melodie telt mee; de dertiende wordt genegeerd (geen stemovername: bestaande noten blijven uitklinken).
- De nootklank is een sinus plus een driehoek 0,2 % hoger, met een lineaire opkomst (`attack`, hoogstens 80 % van de nootlengte) en een exponentiële uitklank (`release`); velocity is lineair. Een externe noot wordt niet getransponeerd door `root`.
- De modulatie-ingang `mod` (paars) verschuift dertien knoppen (alles behalve `evolve`, `mode`, `chord` en `preset`); de basiswaarden blijven staan. Eén spoor: Mist. Logaritmisch bewegen `cutoff`, `attack` en `release`. Een modulatie-uitschieter (±1) verplaatst een waarde over het hele bereik.
- De melodie en de akkoordgang zijn vast en herhalen zich: er zit geen toeval in (zelfde tune, zelfde transport, zelfde geluid).

## Instellingen voor een goede klank

Alle waarden zijn uitgangspunten; luisteren is niet mogelijk, controleer dus op bereik, niveau en gedrag. Het uitgangsniveau van de startwaarden is rustig (zie "Niveau" hieronder).

- **Basis (zwevende vloer):** de startwaarden.
- **Pad of akkoordbed:** `attack` 5 … 10, `release` 12 … 20, `cutoff` 1800 … 3500, `space` 0,7 … 0,9, `warmth` 0,6 … 0,9, `melody` 0,3 … 0,6, `density` 0,1 … 0,3.
- **Droneklank (pedaal):** `melody` 0, `density` 0,1, `root` 28 … 40, `cutoff` 700 … 1600, `warmth` 0,8 … 1, `space` 0,5, `echo` 0,1 … 0,2, `attack` 6, `level` rond 0,8 (lage tonen zijn zacht).
- **Bas of donkere vloer:** `root` 29 … 36, `cutoff` 500 … 1000, `warmth` 0,9 … 1, `level` 0,75 … 0,85.
- **Lead of belletjes (melodie):** `mode: "notes"` met `attack` 0,2 … 0,4, `release` 5 … 12, `cutoff` 3500 … 5000, `warmth` 0,2 … 0,35, `melody` 1: de externe noten klinken dan als zachte klokken. Of `mode: "drone"` met `melody` 0,8 … 1, `density` 0,5 … 0,8 voor een melodie die zichzelf speelt.
- **Pluck of stab:** past niet bij dit apparaat; de kortste noot heeft `attack` 0,2 s en een uitklank van minstens 1 s (`release` ≥ 1).
- **Arpeggio of sequencer:** Mist heeft er zelf geen. Stuur noten met `dur` en laat `release` korter dan de afstand tussen de noten blijven als het niet moet vervagen.
- **Textuur (wind, ruis):** `air` 0,6 … 1 met `motion` 0,7 … 1 en `melody` laag; `level` rond 0,7 omdat de ruis hard aankomt.
- **Echo of galm als hoofdzaak:** `echo` 0,6 … 0,75 met `mode: "notes"`, of `space` 0,9 … 1 met een lange `release` (20 …).

### Niveau

Het uitgangsniveau van een tune hangt vooral af van `level`, `warmth`, `air` en `cutoff`. De begrenzer zorgt dat de piek nooit boven ongeveer 0,8 komt; het gaat dus om de loudness (rms). Gemeten in een offline render van 12 s (drone met transport, of bij `mode: "notes"` vier noten van vier seconden): bij `level` 0,55 … 0,85 komt de rms van het stationaire deel (4 … 12 s) van de pack-tunes tussen ongeveer 0,09 en 0,17 uit en de piek onder 0,6. Een donkere vloer (lage `root`, lage `cutoff`, `warmth` 1) is het luidst, hoge heldere klanken met weinig `warmth` het zachtst; stel `level` dan bij.

## Wat een tune niet moet doen

Het apparaat kan in normaal gebruik niet ontsporen (zie Bewaker), maar je kunt een tune maken die stil of onbruikbaar is:

- `level` 0: stil. `mode: "drone"` in een song zonder transport: stil tot de transport loopt.
- `mode: "notes"` voor een tune die je zonder noten wilt laten klinken: stil tot er noten komen.
- `melody` 0 of `density` 0 zonder dat de drone iets doet: weinig beweging. Dat is bedoeld bij een pedaal, maar ongewenst bij een melodie-tune.
- `attack` 12 met korte noten (een stap): de noot is voorbij voor hij opkomt (de opkomst wordt wel afgekapt op 80 % van de nootlengte, maar blijft traag).
- `release` 24 met veel noten: twaalf stemmen raken op en nieuwe noten worden genegeerd. Houd bij een drukke melodie `release` onder ongeveer 14.
- `cutoff` onder 300 met `warmth` 0: bijna niets te horen.
- `echo` 0,75 samen met `space` 1: alles loopt in elkaar; bij een lage drone is dat dof.
- Geen velden verzinnen en geen `preset` anders dan `Custom`.

## Bewaker

In normaal gebruik geeft Mist nooit een niet-eindig getal. Toch houden de filters, de echo's (met terugkoppeling), de galm en de compressor voor altijd een niet-eindige waarde vast als er één binnenkomt. Daarom controleert een bewaker elke 50 ms de ruwe som van de stemmen en de uitgang van de compressor (vóór de begrenzer die zo'n fout verbergt). Is een waarde niet eindig of boven ±100 (normaal ruim onder 2), dan worden het toonfilter, het hoogdoorlaatfilter, de echo's, de galm en de compressor vervangen door nieuwe en gaat het geluid door. De bewaker draait niet in een offline render.

## Een tune

Een pack heet `naam.patchkamer-tunes.json` en staat in `../../../tunes/`. Het formaat en de licentie (`CC0-1.0` voor alles in `tunes/`) staan in `../../../tunes/AGENTS.md`. Voor dit apparaat is `device` altijd `nl.patchkamer.mist` en elke tune is `kind: "set"` met een `state` als hierboven. Zet geen merknamen van bestaande apparatuur in naam of omschrijving, en verzin geen persoon bij `author`.

```json
{ "name": "Slow Horizon", "kind": "set", "version": "1.0.0",
  "state": { "root": 48, "chord": "add9", "mode": "drone", "level": 0.65, "cutoff": 2400, "air": 0.15, "motion": 0.4, "space": 0.75,
             "echo": 0.4, "attack": 6, "release": 12, "evolve": 4, "melody": 0.5, "density": 0.25, "warmth": 0.7, "detune": 5, "preset": "Custom" } }
```

Zet liever alle velden erin: dan klinkt de tune hetzelfde als de startwaarden ooit veranderen.

## Controleren

- Draai vanuit de root van de repo: `node contract/validate-instrument.mjs devices/synths/Mist/mist.patchkamer-device.js` (en met `--lang en`). Dat moet `OK` geven, zonder `let op`.
- Je kunt niet horen hoe een tune klinkt. Heb je een browser, laad dan de host (`../../../patchkamer/AGENTS.md`) en kies de tune. Heb je geen browser, schrijf dan in je oplevering dat de tune **niet beluisterd** is.
- Een offline render moet de transport starten (`onTransport({playing:true})`) en de stappen vooruitplannen met `OfflineAudioContext.suspend` (`onStep({bar, step, time, stepDur})`); anders klinkt de drone niet of komt de melodie niet.
- Alle tekst in het apparaat staat in het woordenboek `EN` bovenin het bestand (Nederlandse bron, Engels via `host.lang`). Een nieuwe tekst krijgt altijd nl én en.
- De kaart gebruikt de regelaars van de host (`host.ui.knob`); dubbelklik op een regelaar zet hem terug op de beginwaarde.

## Wat je niet doet

- Verander nooit de `id`, de `kind`, de poort-id's of de namen van state-velden.
- Pas het apparaat niet aan om een tune te laten kloppen.
- Commit of push niet, tenzij de opdracht dat vraagt.

## Documentatie en songs

Dit zijn de plaatsen waar je terechtkunt voor documentatie en voor het componeren van songs met dit apparaat. Songs zijn CC-BY-4.0, tunes en presets CC0-1.0, het apparaat AGPL-3.0-or-later.

- Handleiding van Mist: [NL](../../../docs/synths/USER-MANUAL_NL.md#mist) · [EN](../../../docs/synths/USER-MANUAL_EN.md#mist).
- Overzicht van de soort: [README](../README.md); handleiding van de hele soort: [NL](../../../docs/synths/USER-MANUAL_NL.md) · [EN](../../../docs/synths/USER-MANUAL_EN.md).
- Tunes (klanken, `kind: set`): [mist-styles.patchkamer-tunes.json](../../../tunes/mist-styles.patchkamer-tunes.json). Kies een tune als beginpunt voor de `state` van dit apparaat in de song; velden die de tune niet noemt krijgen hun standaard. Hoe tunes zijn opgebouwd: [tunes/AGENTS.md](../../../tunes/AGENTS.md).
- Overzicht van alle apparaten en hun signaalketens: [devices/AGENTS.md](../../../devices/AGENTS.md). Een song componeren: [songs/AGENTS.md](../../../songs/AGENTS.md).
- Rol in een song: drone en ambient-akkoord dat meeloopt met de transport van de studio. Noten en CC op `notes`, audio uit `out` (stereo). Past als onderlaag voor ambient, cinematic en intro's.
