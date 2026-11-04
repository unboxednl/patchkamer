# AGENTS.md: Supersaw Swarm

Dit bestand is voor AI-agents die **tunes voor Supersaw Swarm** maken. Het is niet geschreven voor mensen. Het hoort bij `../../../AGENTS.md` (algemeen) en `../../../tunes/AGENTS.md` (regels voor tunepacks); lees die eerst. Hier staat wat alleen voor Supersaw Swarm geldt.

## Wat Supersaw Swarm is

Een polyfone trance-supersaw. Elke noot is een zwerm van 1, 3, 5, 7 of 9 verstemde zaagtanden (één in het midden en zijzagen links en rechts), plus een octaaflaag van twee zagen een octaaf hoger en een sinus-sub een octaaf lager. Elke noot gaat door twee lowpass-filters achter elkaar (het eerste met resonantie) met een filter-envelope en een eigen versterker-envelope. Daarna loopt alles door een vaste keten: drive, een trance-gate (16 stappen), een pomp (sidechain-effect), een stereo-chorus, een ping-pongdelay op tempo, een galm (convolutie met een eigen impulsrespons), een compressor en een begrenzer. Er zit **geen sequencer** in; het apparaat speelt noten van buiten. Het kan akkoorden maken van elke inkomende noot.

| | |
|---|---|
| Bestand | `supersaw-swarm.patchkamer-device.js` (in deze map) |
| `id` | `nl.patchkamer.supersawswarm`. Verander die nooit: daaraan hangen tunes en songs van gebruikers |
| Naam | `Supersaw Swarm` in alle talen; alleen de poortnaam `Notes` heeft een Nederlandse variant (via `i18n`: `Noten`) |
| Soort | `instrument`: dit apparaat krijgt dus **tunes** (geen presets) |
| Poorten | eventingang `notes` (Notes), modulatie-ingang `mod`, audio-uitgang `out` (Stereo) |
| Contract | v1.11 |
| Licentie apparaat | AGPL-3.0-or-later |

Dit apparaat is de nieuwe, bijgewerkte vorm van een ouder bestand met een andere naam en id (`nl.patchkamer.zwerm`). Tunes of songs uit die tijd verwijzen naar de oude id en laden hier niet in. De namen van de ingebouwde klankbeelden zijn Engels geworden; de oude Nederlandse namen worden bij `setState` nog herkend. Het veld `preset` kreeg daarmee de waarde `Custom` in plaats van `Eigen`.

## Wat je hier doet

Je maakt klanken (tunes) voor Supersaw Swarm en zet ze als pack in `../../../tunes/`. Het apparaat zelf pas je alleen aan als de opdracht dat zegt (`version` ophogen; `id`, poort-id's en state-velden gelijk houden).

## De state

`getState()` geeft alle velden hieronder (JSON: getallen en tekst, geen lijsten, geen patronen van noten). `getState()` is ook wat een tune als `state` bewaart. Een getal buiten het bereik wordt afgekapt; een tekst, `NaN`, `Infinity` of een ontbrekende waarde geeft de startwaarde. Bij de met "log" gemarkeerde knoppen loopt de schuif logaritmisch (de waarde in de state is gewoon de waarde in de eenheid).

### Knoppen (getallen)

| Veld | Wat het doet | Bereik | Start |
|---|---|---|---|
| `cutoff` | Cutoff van beide lowpass-filters in Hz (log) | 120 … 18000 | 6500 |
| `resonance` | Resonantie van het eerste filter (Q in dB) | 0,3 … 8 | 1 |
| `env` | Hoeveel de filter-envelope de cutoff opent, in octaven | 0 … 5 | 0,8 |
| `drive` | Vervorming (tanh) vóór de rest van de keten | 0 … 1 | 0,15 |
| `detune` | Breedte van de zwerm: de uiterste zagen staan zoveel cent van het midden | 0 … 60 | 28 |
| `mix` | Zijzagen tegenover de middenzaag (0 = alleen midden) | 0 … 1 | 0,75 |
| `spread` | Stereospreiding van de zijzagen (0 = mono) | 0 … 1 | 0,9 |
| `octave` | Niveau van de octaaflaag (twee zagen een octaaf hoger) | 0 … 1 | 0,35 |
| `sub` | Niveau van de sinus-sub, een octaaf lager | 0 … 1 | 0,15 |
| `attack` | Attack in seconden (log) | 0,001 … 5 | 0,005 |
| `decay` | Decay in seconden (log) | 0,02 … 5 | 0,4 |
| `sustain` | Sustain-niveau (stuurt ook het filter naar `env` × sustain) | 0 … 1 | 0,85 |
| `release` | Release in seconden (log) | 0,02 … 10 | 0,45 |
| `chorus` | Hoeveel stereo-chorus er bij komt (drie gemoduleerde vertragingen) | 0 … 1 | 0,3 |
| `delay` | Niveau van de ping-pongdelay | 0 … 1 | 0,28 |
| `feedback` | Herhalingen van de delay | 0 … 0,9 | 0,38 |
| `hall` | Niveau van de galm | 0 … 1 | 0,35 |
| `size` | Lengte van de galm in seconden (log). Wijzigen bouwt de galm opnieuw op, na ongeveer 0,2 s | 0,6 … 10 | 3,5 |
| `gate` | Diepte van de trance-gate (0 = uit). Werkt alleen met een lopende klok | 0 … 1 | 0 |
| `pump` | Diepte van de pomp (0 = uit). Werkt alleen met een lopende klok | 0 … 1 | 0 |
| `transpose` | Transpositie in halve tonen (geheel getal; een kommagetal wordt afgerond) | −24 … 24 | 0 |
| `level` | Uitgangsniveau | 0 … 1 | 0,75 |

### Keuzes (tekst of getal)

| Veld | Waarden | Start |
|---|---|---|
| `unison` | Aantal zagen in de zwerm per noot: `1`, `3`, `5`, `7` of `9`. Een getal, geen tekst | `7` |
| `chord` | Wat elke inkomende noot wordt: `none` (losse noot), `minor` (0, 3, 7), `major` (0, 4, 7), `sus2` (0, 2, 7), `sus4` (0, 5, 7), `min7` (0, 3, 7, 10), `minadd9` (0, 3, 7, 14), `oct5` (0, 7, 12), in halve tonen boven de gespeelde noot | `none` |
| `div` | Delaytijd als veelvoud van een zestiende: `1/16`, `1/8`, `3/16`, `1/4` of `3/8`. De delay loopt op het tempo van de klok | `3/16` |
| `pattern` | Het gate-patroon: een tekst van precies 16 tekens `0` en `1`, één per zestiende. `1` = open, `0` = dicht (tot de diepte `gate`). Een andere tekst geeft de startwaarde | `1011011010110110` |

Een andere waarde bij een keuze geeft de startwaarde.

### Overige velden

| Veld | Wat | Waarden | Start |
|---|---|---|---|
| `preset` | De naam van de gekozen klank in de keuzelijst **Preset** op de kaart: `Anthem Lead`, `Heaven Pad`, `Hall Chords`, `Pluck Cascade`, `Gated Choir`, `Pumping Chords`, `Arp Lead` of `Custom`. Het is alleen een label: het zet zelf niets. **Zet in een tune `Custom`** (of laat het weg) | zie links | `Anthem Lead` |

Velden die niet in een tune horen: er zijn er geen behalve `preset` (laat het label op `Custom`). Er is geen routing, geen patroon van noten en geen klokstand in de state. Wel hoort `pattern` (alleen het gate-patroon) bij de klank.

## Wat het apparaat met een state doet (getest)

- `setState({})` geeft alle startwaarden; `setState(getState())` geeft dezelfde state terug (JSON-rondje).
- Getallen buiten het bereik worden afgekapt (`cutoff: 1e9` wordt 18000, `transpose: -99` wordt −24); een tekst, `NaN`, `Infinity` of `null` geeft de startwaarde.
- Een ongeldige `unison`, `chord`, `div`, `pattern` of `preset` geeft de startwaarde. Onbekende velden worden genegeerd. Zet er geen in.
- De knoppen, keuzelijsten en gate-stappen op de kaart bewegen mee met `setState` en met `cc`-events.
- Een `setState` geeft een zachte overgang op de lopende noten (de motor loopt naar de nieuwe waarden toe; niet beluisterd).

## Spelen en modulatie

- Eventingang `notes`: `note` (met `dur` in seconden), `noteon`/`noteoff` (aangehouden toets), `panic` en `allnotesoff`. Een `cc` met `id` gelijk aan een knop uit de tabel en `value` 0 … 1 zet die knop lineair over zijn hele bereik (ook bij de logaritmische knoppen); `size` is hierin ook te sturen. Een note zonder `dur` duurt 0,5 s.
- De klok: `gate` en `pump` bewegen alleen mee met de stap-meldingen van de host (`onStep`) en staan stil als de klok niet loopt. Ze doen dan niets, ook als ze op 1 staan. De delaytijd gebruikt het tempo van de klok; zonder klok staat die op een zestiende bij 120 bpm.
- Pomp: op elke vierde zestiende (elke tel) zakt het volume naar `1 − 0,85 × pump` en komt daarna weer omhoog.
- Stemmen: maximaal 14 noten tegelijk; een nieuwe noot laat de oudste los (10 ms). Een akkoord telt voor elke noot ervan. Een noot met `unison` 9 gebruikt twaalf oscillatoren, dus veel akkoordnoten met negen zagen is zwaar voor de processor.
- De modulatie-ingang `mod` (paars) verschuift elke knop uit de tabel behalve `size`, de keuzes en `preset`; de basiswaarden blijven staan. `transpose` en `level` staan standaard uit voor modulatie. Het ene spoor heet `swarm` (Zwerm / Swarm).

## Instellingen voor een goede klank

Alle waarden zijn uitgangspunten; luisteren is niet mogelijk, controleer dus op bereik en gedrag.

- **Basis (de klassieke supersaw):** de startwaarden: `unison` 7, `detune` 28, `mix` 0,75, `cutoff` 6500, `env` 0,8, `sustain` 0,85, `chorus` 0,3, `delay` 0,28, `hall` 0,35.
- **Lead:** `unison` 7 of 9, `detune` 20 … 32, `cutoff` 4500 … 8000, `resonance` 1 … 1,6, `env` 0,5 … 1,5, `attack` 0,002 … 0,01, `sustain` 0,8 … 0,9, `delay` 0,25 … 0,4 met `feedback` 0,4 … 0,5, `hall` 0,3.
- **Pad:** `unison` 9, `detune` 32 … 38, `mix` 0,85, `spread` 1, `cutoff` 2500 … 3500, `env` 0,2 … 0,4, `attack` 1 … 1,6, `decay` 2, `sustain` 0,9, `release` 4 … 5, `chorus` 0,5 … 0,6, `hall` 0,6, `size` 6 … 7. Een lange `release` laat noten door elkaar lopen en telt mee in de 14 noten.
- **Pluck:** `unison` 5, `detune` 15 … 20, `cutoff` 1200 … 2000, `resonance` 1,5 … 2, `env` 2,5 … 3,5, `attack` 0,001, `decay` 0,15 … 0,3, `sustain` 0, `release` 0,2 … 0,3, `delay` 0,4 … 0,5, `feedback` 0,5, `div` `3/16`.
- **Akkoorden (stab):** `chord` `minor` of `min7`, `unison` 5 … 7, `cutoff` 2500 … 3500, `env` 1,5 … 2,5, `decay` 0,3 … 0,5, `sustain` 0,2 … 0,3, `release` 0,4 … 0,5. Speelt de sequencer zelf akkoorden, zet dan `chord` op `none`.
- **Bas (niet zijn sterkste kant):** `unison` 1 of 3, `mix` 0 … 0,3, `detune` 5 … 10, `sub` 0,5 … 0,8, `octave` 0, `cutoff` 400 … 900, `chorus` 0, `delay` 0, `hall` 0 … 0,1, `transpose` −12 of een lage noot. De chorus en galm maken lage tonen breed en slap.
- **Arpeggio of sequencer:** het apparaat heeft er zelf geen. Kies korte noten: `decay` 0,15 … 0,25, `sustain` 0 … 0,35, `release` 0,2 … 0,3, `unison` 5 … 7, `delay` 0,35 en `div` die bij het patroon past.
- **Trance-gate:** `gate` 0,8 … 1, `pattern` een ritme met gaten, `chord` `min7` of `minor`, `sustain` 0,9, `attack` 0,02, `release` 1 … 1,5. Zet erbij dat de klank alleen gated klinkt als de klok loopt.
- **Pompende akkoorden:** `pump` 0,6 … 0,8, `chord` `minor`, `release` 0,4, `sustain` 0,8.

## Wat een tune niet moet doen

Het apparaat heeft een bewaker (zie hieronder) en geen instelling kan het stil of ongeldig laten vallen. Wel kun je een tune maken die stil of onbruikbaar is:

- `level` op 0: stil. `cutoff` onder 150 met `env` 0: erg dof.
- `gate` of `pump` hoog zetten en verwachten dat het werkt zonder klok: het doet dan niets (zie hierboven).
- `unison` 9 met `chord` `min7` en een lange `release`: veel oscillatoren tegelijk (zwaar) en noten die elkaar verdringen (14 noten).
- `attack` langer dan ongeveer 1,5 s bij een tune die met korte noten wordt gespeeld: de noot is voorbij voor hij opkomt.
- `feedback` 0,9 met `delay` 1 en `hall` 1: een lange, dichte staart die alles dichtsmeert (de compressor en begrenzer houden hem wel binnen het bereik).
- `size` wijzigen midden in een tune: de galm wordt dan opnieuw opgebouwd (korte onderbreking van de galm).
- Geen routing, patronen van noten of klokstanden in de state zetten, en geen velden verzinnen.

## Bewaker

Een meter kijkt om de 50 ms naar de uitvoer van de stemmen (vóór de vervormer, die een ontsporing anders zou verbergen) en naar de uitvoer van de eindtrap. Bij `NaN`, `Infinity` of een waarde boven ±100 stopt de bewaker alle stemmen en bouwt de hele effectketen opnieuw op (hoogdoorlaat, delay met terugkoppeling, galm, compressor). Voorheen bleef één `NaN` in het laagfilter of de delay voor altijd hangen, waarna de uitgang stil bleef of `NaN` aan de rest van de studio doorgaf. In een offline render staat de meter uit. In het normale gebied verandert hij niets aan het geluid.

## Controleren

- Draai vanuit de root van de repo: `node contract/validate-instrument.mjs devices/synths/SupersawSwarm/supersaw-swarm.patchkamer-device.js` (en met `--lang en`). Dat moet `OK` geven, zonder `let op`.
- Je kunt niet horen hoe een tune klinkt. Heb je een browser, laad dan de host (`../../../patchkamer/AGENTS.md`) en kies de tune. Heb je geen browser, schrijf dan in je oplevering dat de tune **niet beluisterd** is.
- Alle tekst in het apparaat staat in het woordenboek `EN` bovenin het bestand (Nederlandse bron, Engels via `host.lang`). Een nieuwe tekst krijgt altijd nl én en.

## Een tune

Een pack heet `naam.patchkamer-tunes.json` en staat in `../../../tunes/`. Het formaat en de licentie (`CC0-1.0` voor alles in `tunes/`) staan in `../../../tunes/AGENTS.md`. Voor dit apparaat is `device` altijd `nl.patchkamer.supersawswarm` en elke tune is `kind: "set"` met een volledige `state` als hierboven. Zet geen merknamen van bestaande apparatuur in naam of omschrijving, en verzin geen persoon bij `author`.

## Wat je niet doet

- Verander nooit de `id`, de `kind`, de poort-id's of de namen van state-velden.
- Pas het apparaat niet aan om een tune te laten kloppen.
- Commit of push niet, tenzij de opdracht dat vraagt.
