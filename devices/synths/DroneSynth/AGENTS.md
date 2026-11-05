# AGENTS.md: Drone Synth

Dit bestand is voor AI-agents die **tunes voor Drone Synth** maken. Het is niet geschreven voor mensen. Het hoort bij `../../../AGENTS.md` (algemeen) en `../../../tunes/AGENTS.md` (regels voor tunepacks); lees die eerst. Hier staat wat alleen voor Drone Synth geldt.

## Wat Drone Synth is

Een drone- en ambient-synth. De klank bestaat uit een eerste drone-laag (drie ontstemde oscillators plus een sinus-suboscillator een octaaf lager), een optionele tweede drone-laag op een instelbaar interval, gekleurde ruis door een bandfilter, een resonant lowpass-filter met een trage LFO, een vervormer, een delay met feedback en een galm. Daarbij komen willekeurige gebeurtenissen (sirene, metaalslag, radiostatic, hartslag) en een eigen 16-staps grondtoon-sequencer met 1 tot 16 sets (maten). Het apparaat speelt geen akkoorden of losse noten met een envelope: het is één doorlopende klank waarvan de **grondtoon** verandert (door de sequencer, de knop Grondtoon of inkomende noten).

| | |
|---|---|
| Bestand | `drone-synth.patchkamer-device.js` (in deze map) |
| `id` | `nl.patchkamer.drone`. Verander die nooit: daaraan hangen tunes en songs van gebruikers |
| Naam | `Drone Synth` in alle talen; alleen de poortnamen `Out` en `Notes` hebben een Nederlandse variant (via `i18n`) |
| Soort | `instrument`: dit apparaat krijgt dus **tunes** (geen presets) |
| Poorten | eventingangen `notes` (Notes) en `cc` (CC), modulatie-ingang `mod`, audio-uitgang `out` (Out; stereo door de galm) |
| Contract | v1.11 |
| Licentie apparaat | AGPL-3.0-or-later |

De `id` is dezelfde als die van het oudere bestand `drone_v1.8.0.js`; wat toen is bewaard (werkruimtes, songs) laadt hier gewoon in.

## Wat je hier doet

Je maakt klanken (tunes) voor Drone Synth en zet ze als pack in `../../../tunes/`. Het apparaat zelf pas je alleen aan als de opdracht dat zegt (`version` ophogen; `id`, poort-id's en state-velden gelijk houden).

## Hoe het klinkt (en wanneer)

- **Wanneer klinkt het?** De uitgang is gesloten tot de transport van de host loopt, of tot `hold` aan staat (de knop Bij stop: "blijft klinken"). Een tune die direct hoorbaar moet zijn zonder dat je op Play drukt, zet daarom `hold: true`. Gebeurtenissen (`evt`) en de sequencer lopen alleen met de transport mee.
- **Niveau.** `lvl` is de laatste versterker en schaalt het hele geluid lineair. Een ruime, volle klank (alle lagen aan) piekt met `lvl: 0.7` ruim boven 1; zet het niveau per tune zo dat de piek onder 1 blijft en het gemiddelde niveau gelijk is aan dat van andere tunes.
- **Lagen.** Laag 1 (`wave`, `detune`, `sub`, `dlevel`) is de basis. Laag 2 (`dbOn`) staat op `freq × 2^(dbInt/12)` en kan een kwint, octaaf, kleine secunde (dissonant) enz. zijn. Ruis (`noiseOn`) loopt door het bandfilter `nfreq`/`nq` en daarna door het hoofdfilter. Alle lagen gaan door het hoofdfilter (`cut`, `res`) en de vervormer (`drive`).
- **Beweging** komt van: de filter-LFO (`lrate`, `ldepth`), de langzame toonwobbel (`pitchmod`, een zachte vibrato van 0,07 Hz), de onderlinge ontstemming (`detune`, geeft zweving), de delay en de galm, en gebeurtenissen.

## De state

`state` van een tune is wat `getState()` teruggeeft: alle knoppen plus de sequencerraster `dgrid`. Geef in een tune **alle** velden mee.

| Veld | Wat | Bereik | Start |
|---|---|---|---|
| `freq` | Grondtoon in Hz (laag 1; de sequencer en inkomende noten zetten dit ook) | 20 … 220 | 55 |
| `fine` | Stemming in cent (alle lagen) | −100 … 100 | 0 |
| `wave` | Golfvorm laag 1 | `sawtooth`, `square`, `triangle` of `sine` | `sawtooth` |
| `detune` | Ontstemming van de drie oscillators in cent (−detune, 0, +detune) | 0 … 60 | 9 |
| `sub` | Sinus-suboscillator een octaaf lager | 0 … 1 | 0,5 |
| `dlevel` | Niveau van laag 1 (zonder sub) | 0 … 1 | 0,6 |
| `droneOn` | Laag 1 en sub aan | `true` of `false` | `true` |
| `dbOn` | Laag 2 aan | `true` of `false` | `false` |
| `dbWave` | Golfvorm laag 2 | zoals `wave` | `triangle` |
| `dbInt` | Interval van laag 2 in halve tonen (7 = kwint, 12 = octaaf, 1 = dissonant) | −24 … 24 | 7 |
| `dbDet` | Ontstemming van laag 2 in cent (twee oscillators, −/+) | 0 … 60 | 12 |
| `dbLvl` | Niveau van laag 2 | 0 … 1 | 0,4 |
| `noiseOn` | Ruis aan | `true` of `false` | `true` |
| `ntype` | Kleur van de ruis | `brown`, `pink` of `white` | `brown` |
| `nfreq` | Middenfrequentie van het ruisbandfilter in Hz | 60 … 8000 | 400 |
| `nq` | Resonantie van het ruisbandfilter (hoog = smalle band, als een fluit) | 0,3 … 18 | 2 |
| `nlevel` | Niveau van de ruis | 0 … 1 | 0,25 |
| `cut` | Hoofdfilter (lowpass) in Hz | 80 … 12000 | 900 |
| `res` | Resonantie van het hoofdfilter | 0,3 … 20 | 4 |
| `lrate` | Snelheid van de filter-LFO in Hz | 0,02 … 8 | 0,12 |
| `ldepth` | Diepte van de filter-LFO in Hz (gaat nooit onder het filter van 60 Hz uit) | 0 … 4000 | 600 |
| `pitchmod` | Toonwobbel in cent (vibrato van 0,07 Hz op laag 1) | 0 … 80 | 4 |
| `drive` | Vervorming (0 = schoon) | 0 … 1 | 0,2 |
| `dtime` | Delaytijd in seconden | 0,05 … 1,5 | 0,42 |
| `dfb` | Delay-feedback | 0 … 0,95 | 0,45 |
| `rsize` | Galmlengte in seconden | 0,5 … 10 | 5 |
| `rmix` | Galm (nat) tegenover droog | 0 … 1 | 0,55 |
| `evt` | Gebeurtenis die af en toe vuurt (alleen met de transport) | `none`, `siren`, `impact`, `static` of `pulse` | `none` |
| `erate` | Gemiddeld interval van de gebeurtenis in seconden (±40%) | 1 … 30 | 8 |
| `elevel` | Niveau van de gebeurtenis | 0 … 1 | 0,5 |
| `seqOn` | Interne sequencer aan | `true` of `false` | `false` |
| `dbars` | Aantal sets (maten) dat de sequencer afspeelt | 1, 2, 4, 8 of 16 | 4 |
| `glide` | Glijtijd tussen noten van de sequencer (en inkomende noten) | 0 … 1 | 0,08 |
| `gate` | Gate van de sequencer op laag 1: 0 = laag 1 klinkt doorlopend | 0 … 1 | 0 |
| `lvl` | Niveau van het hele apparaat | 0 … 1 | 0,7 |
| `hold` | Blijft klinken als de transport stil staat | `true` of `false` | `false` |
| `dgrid` | Sequencerraster: 16 sets | lijst van 16 sets van 16 getallen | alles −1 |

De knoppen staan op de kaart in blokken: Drone, Drone B, Noise, Filter & LFO, Space & decay (Distortion, Delay, Reverb), Output (Level, On stop), Events en Play (de acht noten om de grondtoon direct te zetten), en onderaan de Root sequencer. Zes voorinstellingen bovenaan zijn alleen knoppen (ze zetten velden, ze zijn geen state).

### De sequencer en `dgrid`

- `dgrid` is een lijst van **16 sets**; elke set is een lijst van **16 stappen** (zestiende noten). Een stap is een geheel getal:
  - `-1` = geen nieuwe noot: de vorige toonhoogte blijft staan;
  - `0 … 7` = de grondtoon wordt een van deze acht vaste noten: `0` A1 (55 Hz), `1` C2 (65,4), `2` D2 (73,4), `3` E♭2 (77,8), `4` F2 (87,3), `5` G2 (98), `6` A2 (110), `7` B♭2 (116,5).
- De sequencer speelt de eerste `dbars` sets achter elkaar en herhaalt ze, **alleen als `seqOn` aan staat en de transport loopt**. De overige sets doen niet mee; zet ze op `-1`. Een patroon met één noot per set (bijvoorbeeld alleen stap 0) geeft een langzame grondtoon-wandeling; een noot op elke stap geeft een rollende bas.
- De overgang tussen twee noten duurt ongeveer `glide / 3` seconden (tijdconstante): `0` is een harde sprong, `0,5` en hoger is een duidelijke glijbeweging.
- **Gate** werkt alleen op laag 1: bij `gate > 0` gaat die laag open op een stap met een noot en sluit hij op een lege stap naar `1 − gate` van zijn niveau (snel, ongeveer 30 ms). Zo maak je pulserende of gespeelde ritmes. Laag 2, de sub en de ruis worden niet gepulseerd en klinken door. Wil je een echt gepulseerde bas, zet dan `sub`, `dbOn` en `nlevel` laag of uit.
- Een patroon kan alleen de acht vaste noten gebruiken. De toonsoort volgt de grondtoon: de noten vormen A, C, D, E♭, F, G, A, B♭ (een mineur-achtige reeks met een verlaagde kwint). Lagere of andere grondtonen maak je met de losse knop `freq` voor een **vlakke drone zonder patroon**.
- Een tune met patroon zet `seqOn: true`, een `dbars` dat past bij het aantal gevulde sets en `dgrid` met die sets; een tune zonder patroon zet `seqOn: false` en een `dgrid` met alleen `-1`.
- Het tempo komt van de host. Beschrijf dus nooit een tempo in de naam; patronen horen bij zestienden.

### Wat getState geeft

`getState()` geeft alle velden uit de tabel (37 velden) en `dgrid`; het zijn dezelfde sleutels als bij het oude bestand. `freq` is de laatste grondtoon (die de sequencer of een inkomende noot heeft gezet); zet in een tune de grondtoon waarmee je de klank bedoelt.

Niet in een tune: routing, kabels, de testnoten (Play-knoppen), de actuele bar of een lopende positie.

## Wat het apparaat met een state doet (getest)

- Getallen buiten het bereik worden afgekapt (`cut: 1e9` wordt 12000, `res: -5` wordt 0,3); een tekst, `NaN`, `Infinity` of een ontbrekende waarde geeft de startwaarde.
- Een ongeldige keuze (`wave`, `dbWave`, `ntype`, `evt`, `dbars`) of een niet-boolean voor `droneOn`, `dbOn`, `noiseOn`, `seqOn`, `hold` geeft de startwaarde.
- In `dgrid` wordt elke stap afgerond en afgekapt op −1 … 7; een ongeldige stap, een ontbrekende of ongeldige set is leeg (−1).
- Onbekende velden worden genegeerd. Zet er geen in. `setState({})` geeft alle startwaarden.
- Een bewaker controleert om de 50 ms de ruwe uitvoer van het hoofdfilter en van de delay-lus. Wordt die niet-eindig of absurd groot (≥ 100), dan worden het filter, de delay en de galm vervangen, zodat het apparaat niet voor altijd stil blijft en geen `NaN` doorgeeft.

## Goede basis en rollen

Een drone-synth heeft geen basis/lead/pluck in de gewone zin; denk in deze rollen:

- **Vlakke drone** (pad, vloer): `seqOn: false`, `hold: true`. Laag 1 met `detune` 8–25 voor zweving, `sub` 0,5–1, een lage `cut` (400–1500) met een trage LFO (`lrate` 0,03–0,15) en een lange galm (`rsize` 6–10, `rmix` 0,5–0,8).
- **Zware bas** (rumble, doom): `freq` 30–55, `wave` `square` of `sawtooth`, `sub` 0,7–1, `cut` 250–600, `drive` 0,4–1, weinig galm in de lage band.
- **Textuur** (ruis, lucht): `ntype` `pink` of `white`, `nfreq` 500–5000, `nq` 1–10, `nlevel` 0,3–0,6 en een zacht laag 1 (`dlevel` 0–0,3).
- **Pulserende bas / stab** (patroon met `gate`): `gate` 0,5–1, een patroon met noten op de gewenste stappen, `sub: 0` of laag, `dbOn: false`, `res` 3–12 voor een sappige filterbeweging.
- **Ostinato / arp** (patroon): één noot per stap of per twee stappen, `glide` 0–0,1, `gate` 0,4–0,8, een delay (`dtime` 0,2–0,4, `dfb` 0,4–0,6).
- **Gebeurtenissen** (`evt`): zet er een als de klank dat nodig heeft (sirene voor alarm, metaalslag voor industrieel, hartslag voor onheil); hij vuurt alleen met de transport en geeft pieken, dus houd `elevel` bescheiden (≤ 0,6) en het totale niveau onder 1.

## Een tune

Een pack heet `naam.patchkamer-tunes.json` en staat in `../../../tunes/`. Het formaat en de licentie (`CC0-1.0` voor alles in `tunes/`) staan in `../../../tunes/AGENTS.md`. Voor dit apparaat is `device` altijd `nl.patchkamer.drone` en elke tune is `kind: "set"` met een volledige `state` als hierboven. Zet geen merknamen van bestaande apparatuur in naam of omschrijving, en verzin geen persoon bij `author`.

## Wat een tune absoluut niet moet doen

- Geen waarden buiten het bereik of onbekende velden.
- Geen `res` 20 samen met `nq` 18, een zeer lage `cut` (80) en `ldepth` 4000 terwijl de modulator alles omhoog duwt: dat is het gebied waar het filter kan ontsporen (de bewaker vangt het op, maar de tune klinkt dan onderbroken).
- Geen `dfb` boven 0,9 samen met een korte `dtime` en veel `rmix`: de delay-lus loopt dan hard.
- Niet alles tegelijk op vol: `dlevel`, `sub`, `dbLvl`, `nlevel` en `lvl` samen kunnen ver boven 1 pieken. Meet het niveau (offline render) en zet `lvl` zo dat de piek onder 1 blijft.
- Geen tune die stil is (`droneOn: false` zonder andere bron, of `lvl: 0`) en geen tune die alleen met de transport klinkt zonder dat dat de bedoeling is (vergeet `hold` niet).
- Geen `gate` op een tune zonder patroon (`gate` werkt alleen bij `seqOn` en een noot per stap).

## Controleren

- Draai vanuit de root van de repo: `node contract/validate-instrument.mjs devices/synths/DroneSynth/drone-synth.patchkamer-device.js` (en met `--lang en`). Dat moet `OK` geven, zonder `let op`.
- Je kunt niet horen hoe een tune klinkt. Render offline (`OfflineAudioContext`, plan de stappen stap voor stap met `suspend`) en meet piek, gemiddeld niveau en niet-eindige samples; heb je een browser, laad dan de host (`../../../patchkamer/AGENTS.md`) en kies de tune. Heb je geen browser, schrijf dan in je oplevering dat de tune **niet beluisterd** is.
- Alle tekst in het apparaat staat in het woordenboek `EN` bovenin het bestand (Nederlandse bron, Engels via `host.lang`). Een nieuwe tekst krijgt altijd nl én en.

## Wat je niet doet

- Verander nooit de `id`, de `kind`, de poort-id's of de namen van state-velden.
- Pas het apparaat niet aan om een tune te laten kloppen.
- Commit of push niet, tenzij de opdracht dat vraagt.

## Documentatie en songs

Dit zijn de plaatsen waar je terechtkunt voor documentatie en voor het componeren van songs met dit apparaat. Songs zijn CC-BY-4.0, tunes en presets CC0-1.0, het apparaat AGPL-3.0-or-later.

- Handleiding van Drone Synth: [NL](../../../docs/synths/USER-MANUAL_NL.md#drone-synth) · [EN](../../../docs/synths/USER-MANUAL_EN.md#drone-synth).
- Overzicht van de soort: [README](../README.md); handleiding van de hele soort: [NL](../../../docs/synths/USER-MANUAL_NL.md) · [EN](../../../docs/synths/USER-MANUAL_EN.md).
- Tunes (klanken, `kind: set`): [drone-synth-styles.patchkamer-tunes.json](../../../tunes/drone-synth-styles.patchkamer-tunes.json). Kies een tune als beginpunt voor de `state` van dit apparaat in de song; velden die de tune niet noemt krijgen hun standaard. Hoe tunes zijn opgebouwd: [tunes/AGENTS.md](../../../tunes/AGENTS.md).
- Overzicht van alle apparaten en hun signaalketens: [devices/AGENTS.md](../../../devices/AGENTS.md). Een song componeren: [songs/AGENTS.md](../../../songs/AGENTS.md).
- Rol in een song: drone en ambient-vloer. Noten op `notes` en `cc` op `cc`, audio uit `out` (stereo door de galm). Eén of enkele lange noten volstaan; geen eigen patroon.
