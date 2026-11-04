# AGENTS.md: Chord Poly

Dit bestand is voor AI-agents die **tunes voor Chord Poly** maken. Het is niet geschreven voor mensen. Het hoort bij `../../../AGENTS.md` (algemeen) en `../../../tunes/AGENTS.md` (regels voor tunepacks); lees die eerst. Hier staat wat alleen voor Chord Poly geldt.

## Wat Chord Poly is

Een polyfone akkoordsynth met tot 24 stemmen tegelijk. Elke noot heeft twee oscillatoren die een beetje uit elkaar zijn gestemd (zaagtand, blok, driehoek of sinus, te kiezen voor het hele apparaat) en een blokgolf-sub een octaaf lager, door een lowpass-filter met resonantie, filter-envelope en een eigen versterker-envelope. Daarna een stereo-chorus (twee gemoduleerde vertragingen links en rechts), drive, een compressor en een begrenzer. Het **akkoordgeheugen** voegt vaste intervallen toe aan elke inkomende noot, zodat één toets een akkoord geeft; je kunt er ook eigen intervallen in zetten. Er zit **geen sequencer** in; het apparaat speelt noten van buiten. De kaart toont een scope van de uitgang.

| | |
|---|---|
| Bestand | `chord-poly.patchkamer-device.js` (in deze map) |
| `id` | `nl.patchkamer.chordpoly`. Verander die nooit: daaraan hangen tunes en songs van gebruikers |
| Naam | `Chord Poly` in alle talen; alleen de poortnaam `Notes` heeft een Nederlandse variant (via `i18n`: `Noten`) |
| Soort | `instrument`: dit apparaat krijgt dus **tunes** (geen presets) |
| Poorten | eventingang `notes` (Notes), modulatie-ingang `mod`, audio-uitgang `out` (Stereo) |
| Contract | v1.11 |
| Licentie apparaat | AGPL-3.0-or-later |

Dit apparaat is de nieuwe, bijgewerkte vorm van een ouder bestand met een andere naam en id (`nl.patchkamer.gloed`). Tunes of songs uit die tijd verwijzen naar de oude id en laden hier niet in. De state-velden zijn ongewijzigd.

## Wat je hier doet

Je maakt klanken (tunes) voor Chord Poly en zet ze als pack in `../../../tunes/`. Het apparaat zelf pas je alleen aan als de opdracht dat zegt (`version` ophogen; `id`, poort-id's en state-velden gelijk houden).

## De state

`getState()` geeft alle velden hieronder (JSON: getallen en tekst). Dat is ook wat een tune als `state` bewaart. Een getal buiten het bereik wordt afgekapt; een tekst, `NaN`, `Infinity` of een ontbrekende waarde geeft de startwaarde. Bij de met "log" gemarkeerde knoppen loopt de schuif logaritmisch (de waarde in de state is gewoon de waarde in de eenheid).

### Knoppen (getallen)

| Veld | Wat het doet | Bereik | Start |
|---|---|---|---|
| `cutoff` | Cutoff van het lowpass-filter in Hz (log) | 80 … 16000 | 4200 |
| `resonance` | Resonantie van het filter (Q in dB) | 0,2 … 5 | 0,8 |
| `env` | Hoeveel de filter-envelope de cutoff opent, in octaven | 0 … 4 | 1,2 |
| `detune` | De twee oscillatoren staan zoveel cent boven en onder de noot | 0 … 35 | 12 |
| `sub` | Niveau van de blokgolf-sub, een octaaf lager | 0 … 1 | 0,18 |
| `attack` | Attack in seconden (log) | 0,002 … 4 | 0,015 |
| `decay` | Decay in seconden (log) | 0,02 … 4 | 0,5 |
| `sustain` | Sustain-niveau (stuurt ook het filter naar `env` × sustain) | 0 … 1 | 0,65 |
| `release` | Release in seconden (log) | 0,03 … 8 | 1,1 |
| `chorus` | Hoeveel chorus er bij het droge geluid komt (en de diepte ervan) | 0 … 1 | 0,45 |
| `width` | Stereobreedte: de twee chorusvertragingen worden zover naar links en rechts gepand, en elke noot krijgt een kleine eigen positie | 0 … 1 | 0,8 |
| `drive` | Vervorming (tanh) na de chorus | 0 … 1 | 0,15 |
| `transpose` | Transpositie in halve tonen (geheel getal) | −24 … 24 | 0 |
| `level` | Uitgangsniveau | 0 … 1 | 0,7 |

### Keuzes (tekst)

| Veld | Waarden | Start |
|---|---|---|
| `wave` | Golfvorm van de twee oscillatoren: `sawtooth`, `square`, `triangle` of `sine` (de sub blijft een blokgolf) | `sawtooth` |
| `chord` | Wat elke inkomende noot wordt: `none` (losse noot), `major` (0, 4, 7), `minor` (0, 3, 7), `sus` (0, 5, 7), `seventh` (0, 3, 7, 10; een mineur-septiemakkoord) of `memory` (de intervallen uit `memory`), in halve tonen boven de gespeelde noot | `none` |
| `memory` | De eigen intervallen voor `chord: "memory"`: een tekst met getallen gescheiden door komma's, bijvoorbeeld `0,4,7`. Elk getal wordt een geheel getal van −24 … 36, dubbele vallen weg, hoogstens 6 intervallen. Een tekst zonder getal geeft `0`. Een geen-tekst geeft de startwaarde | `0,4,7` |
| `preset` | De naam van de gekozen klank in de keuzelijst **Preset** op de kaart: `Warehouse Chords`, `Warm Horizon`, `Rave Stab`, `Glass Pulse`, `Soft Organ`, `Wide Lead`, `Night Pad` of `Electric Chimes`. Het is alleen een label: het zet zelf niets. **Laat het weg in een tune** (dan staat er `Warehouse Chords`) | `Warehouse Chords` |

Een andere waarde bij een keuze geeft de startwaarde. Velden die niet in een tune horen: `preset`. Er is geen routing, geen patroon van noten en geen klokstand in de state.

## Wat het apparaat met een state doet (getest)

- `setState({})` geeft alle startwaarden; `setState(getState())` geeft dezelfde state terug (JSON-rondje).
- Getallen buiten het bereik worden afgekapt (`cutoff: 1e9` wordt 16000, `sustain: 2` wordt 1); een tekst, `NaN`, `Infinity` of `null` geeft de startwaarde.
- Een ongeldige `wave`, `chord`, `memory` of `preset` geeft de startwaarde (bij `chord` is dat `none`). Onbekende velden worden genegeerd. Zet er geen in.
- De knoppen en keuzelijsten op de kaart bewegen mee met `setState` en met `cc`-events. Een `setState` laat de lopende noten kort uitklinken (35 ms) en geeft de nieuwe waarden zacht door; niet beluisterd.

## Spelen en modulatie

- Eventingang `notes`: `note` (met `dur` in seconden), `noteon`/`noteoff` (aangehouden toets), `panic` en `allnotesoff`. Een event zonder `time` wordt genegeerd (de host stuurt dat altijd mee). Een `cc` met `id` gelijk aan een knop uit de tabel en `value` 0 … 1 zet die knop lineair over zijn hele bereik (ook bij de logaritmische knoppen). Een note zonder `dur` duurt 1 s.
- Stemmen: tot 24 tegelijk; een nieuwe noot laat de oudste los (8 ms). Elke akkoordnoot telt als een stem: `seventh` of `memory` met zes intervallen nemen er 4 respectievelijk 6 per toets. Een tune met een lange `release` laat noten door elkaar lopen.
- De modulatie-ingang `mod` (paars) verschuift elke knop uit de tabel; de basiswaarden blijven staan. `transpose` en `level` staan standaard niet aan in het modulatiespoor. Het spoor heet `sound` (Klank / Sound).
- Het volume van een akkoord wordt gedeeld door de wortel van het aantal noten, zodat een akkoord niet veel harder klinkt dan een losse noot.

## Instellingen voor een goede klank

Alle waarden zijn uitgangspunten; luisteren is niet mogelijk, controleer dus op bereik en gedrag.

- **Basis (warme akkoorden):** de startwaarden: `wave` `sawtooth`, `cutoff` 4200, `env` 1,2, `detune` 12, `sub` 0,18, `chorus` 0,45, `chord` `none` (akkoorden uit de sequencer) of `minor`.
- **Stab:** `chord` `minor` of `seventh`, `cutoff` 1500 … 2000, `resonance` 1,5, `env` 2,5 … 3, `attack` 0,003, `decay` 0,2, `sustain` 0 … 0,1, `release` 0,2, `drive` 0,3 … 0,4.
- **Pad:** `cutoff` 1200 … 2500, `env` 0,4 … 0,8, `attack` 0,7 … 2, `decay` 2, `sustain` 0,7 … 0,9, `release` 3 … 5, `detune` 8 … 17, `chorus` 0,7 … 0,8.
- **Lead:** `cutoff` 6000 … 8000, `resonance` 1 … 1,2, `env` 0,4, `detune` 15 … 22, `chorus` 0,5, `attack` 0,008, `sustain` 0,8, `chord` `none`.
- **Pluck of bel:** `wave` `triangle`, `cutoff` 9000, `env` 0,3, `attack` 0,002, `decay` 1, `sustain` 0, `release` 1,5, `chorus` 0,25.
- **Orgel:** `wave` `triangle`, `sub` 0,4, `env` 0, `sustain` 1, `attack` 0,01, `release` 0,1, `chorus` 0,6.
- **Bas (niet zijn sterkste kant):** `chord` `none`, `wave` `sawtooth` of `square`, `sub` 0,6 … 0,9, `cutoff` 300 … 700, `detune` 3 … 6, `chorus` 0 … 0,1 (de chorus maakt lage tonen breed en slap), `release` 0,1 … 0,25, `transpose` −12 of een lage noot.
- **Arpeggio of sequencer:** het apparaat heeft er zelf geen. Kies korte noten: `decay` 0,15 … 0,3, `sustain` 0 … 0,3, `release` 0,15 … 0,3, `chord` `none`, `chorus` 0,3 … 0,45.
- **Eigen akkoord:** `chord` `memory` en bijvoorbeeld `memory` `0,7,12` (kwint en octaaf) of `0,3,7,10,14` (mineur 9).

## Wat een tune niet moet doen

Het apparaat kan niet ontsporen: de filters zijn begrensd, na de stemmen staat een vervormer die ook niet-eindige waarden opvangt en de uitgang heeft een begrenzer. Wel kun je een tune maken die stil of onbruikbaar is:

- `level` op 0: stil. `cutoff` onder 120 met `env` 0: erg dof.
- `chord` `memory` met een `memory` die niet is bedoeld (bijvoorbeeld `0`): één losse noot.
- Een lange `attack` (meer dan ongeveer 1,5 s) bij een tune die met korte noten wordt gespeeld: de noot is voorbij voor hij opkomt.
- `chorus` 1 met `width` 1 op een bas: de bas wordt breed en zwak.
- Een akkoord met zes intervallen (`memory`) en een lange `release`: de 24 stemmen zijn snel op en oudere noten breken af.
- `preset` in de tune zetten of velden verzinnen. Zet geen routing, patronen van noten of klokstanden in de state.

## Controleren

- Draai vanuit de root van de repo: `node contract/validate-instrument.mjs devices/synths/ChordPoly/chord-poly.patchkamer-device.js` (en met `--lang en`). Dat moet `OK` geven, zonder `let op`.
- Je kunt niet horen hoe een tune klinkt. Heb je een browser, laad dan de host (`../../../patchkamer/AGENTS.md`) en kies de tune. Heb je geen browser, schrijf dan in je oplevering dat de tune **niet beluisterd** is.
- Alle tekst in het apparaat staat in het woordenboek `EN` bovenin het bestand (Nederlandse bron, Engels via `host.lang`). Een nieuwe tekst krijgt altijd nl én en.

## Een tune

Een pack heet `naam.patchkamer-tunes.json` en staat in `../../../tunes/`. Het formaat en de licentie (`CC0-1.0` voor alles in `tunes/`) staan in `../../../tunes/AGENTS.md`. Voor dit apparaat is `device` altijd `nl.patchkamer.chordpoly` en elke tune is `kind: "set"` met een volledige `state` als hierboven, zonder `preset`. Zet geen merknamen van bestaande apparatuur in naam of omschrijving, en verzin geen persoon bij `author`.

## Wat je niet doet

- Verander nooit de `id`, de `kind`, de poort-id's of de namen van state-velden.
- Pas het apparaat niet aan om een tune te laten kloppen.
- Commit of push niet, tenzij de opdracht dat vraagt.
