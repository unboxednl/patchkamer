# AGENTS.md: Acid Stepper

Dit bestand is voor AI-agents die **tunes voor Acid Stepper** maken. Het is niet geschreven voor mensen. Het hoort bij `../../../AGENTS.md` (algemeen) en `../../../tunes/AGENTS.md` (regels voor tunepacks); lees die eerst. Hier staat wat alleen voor Acid Stepper geldt.

## Wat Acid Stepper is

Een monofone acid-basssynth met een eigen **patroon van 16 stappen**. Eén oscillator (zaagtand of puls) plus een sub-oscillator (blokgolf, een octaaf lager), een vierpolig lowpass-filter (twee biquads achter elkaar) met resonantie en een filter-envelope met accent, slide (glijden tussen stappen), een vervormer (drive), een compressor en een zachte begrenzer. De interne klok van de host bepaalt tempo en swing. Het apparaat speelt ook noten van een extern keyboard of een externe sequencer (besturing `notes`). Het filter is een eigen benadering.

Het lijkt op Acid Baselines (`../AcidBaselines/`) en doet hetzelfde soort werk, maar is bewust eenvoudiger: een vast raster van 16 stappen met noten als MIDI-nummers, geen sets (maten), geen octaaf per stap, een vierpolig filter in plaats van twee filters met modulatie, en zes vaste startpatronen. Kies Acid Stepper voor een snelle, directe basslijn en Acid Baselines voor meer klankbronnen en vervormingstypen.

| | |
|---|---|
| Bestand | `acid-stepper.patchkamer-device.js` (in deze map) |
| `id` | `nl.patchkamer.acidstepper`. Verander die nooit: daaraan hangen tunes en songs van gebruikers |
| Naam | `Acid Stepper` in alle talen; alleen de poortnamen hebben een Nederlandse variant (via `i18n`) |
| Soort | `instrument`: dit apparaat krijgt dus **tunes** (geen presets) |
| Poorten | eventingang `notes` (External notes / Externe noten), modulatie-ingang `mod`, audio-uitgang `out` (Out / Uit) |
| Contract | v1.11 |
| Licentie apparaat | AGPL-3.0-or-later |

Dit apparaat is de nieuwe, bijgewerkte vorm van een ouder bestand met een andere naam en id. Tunes of songs uit die tijd verwijzen naar de oude id en laden hier niet in.

## Wat je hier doet

Je maakt klanken (tunes) voor Acid Stepper en zet ze als pack in `../../../tunes/`. Het apparaat zelf pas je alleen aan als de opdracht dat zegt (`version` ophogen; `id`, poort-id's en state-velden gelijk houden).

## De state

`state` van een tune is wat `getState()` teruggeeft: 21 velden, de knoppen plus het patroon. Een veld dat je weglaat krijgt de startwaarde.

| Veld | Wat | Bereik | Start |
|---|---|---|---|
| `cutoff` | Cutoff van het filter in Hz (de schuif is logaritmisch) | 70 … 10000 | 800 |
| `resonance` | Resonantie van het eerste filter | 0,4 … 9 | 4,3 |
| `env` | Envelope-intensiteit: hoeveel octaven de cutoff bij elke noot omhoog schiet en dan terugvalt | 0 … 5 | 3 |
| `decay` | Tijd waarin de cutoff terugvalt (s, logaritmisch) | 0,03 … 2 | 0,22 |
| `accent` | Accentsterkte: een stap met accent is harder en krijgt een grotere filterpiek | 0 … 1 | 0,65 |
| `glide` | Slide-tijd: hoe snel de toonhoogte glijdt bij een slide (s, logaritmisch) | 0,005 … 0,4 | 0,065 |
| `gate` | Hoe lang een noot klinkt als deel van de stap (zonder slide naar de volgende) | 0,1 … 1 | 0,6 |
| `drive` | Vervorming (versterking voor de verzadiger: 1 + 7 × drive) | 0 … 1 | 0,45 |
| `sub` | Sub-oscillator (blokgolf, een octaaf lager) | 0 … 1 | 0,12 |
| `transpose` | Transpositie in halve tonen (een kommagetal geeft tussentonen; de schuif doet hele stappen) | −24 … 24 | 0 |
| `level` | Uitgangsniveau | 0 … 1 | 0,7 |
| `wave` | Golfvorm | `sawtooth` of `square` | `sawtooth` |
| `mode` | Besturing: `sequence` speelt het eigen patroon op de klok van de host; `notes` speelt alleen noten van de ingang `notes` | `sequence` of `notes` | `sequence` |
| `division` | Nootdeling: 1 = elke zestiende stap van de host, 2 = om de andere (achtsten), 4 = kwarten | 1, 2 of 4 | 1 |
| `length` | Patroonlengte (aantal stappen dat wordt afgespeeld, daarna weer vanaf 1) | 1 … 16 (afgerond) | 16 |
| `selected` | Welke stap in de editor open staat. **Werkstand, geen klank**: laat dit weg in een tune | 0 … 15 | 0 |
| `pattern` | Naam van het gekozen startpatroon. Alleen een **label**, zie hieronder | `Warehouse Acid`, `Octave Engine`, `Dark Rubber`, `Open Skyline`, `Sparse Pulse` of `Broken Staircase` | `Warehouse Acid` |
| `notes` | Noot per stap als MIDI-nummer (36 = C2, 48 = C3) | 16 hele getallen, elk 24 … 84 | zie onder |
| `steps` | Speelt de stap? 0 = rust | 16 keer 0 of 1 | zie onder |
| `accents` | Accent op de stap | 16 keer 0 of 1 | zie onder |
| `slides` | Slide **naar** deze stap: de toonhoogte glijdt vanuit de vorige actieve stap en de gate blijft open | 16 keer 0 of 1 | zie onder |

Startlijn (Warehouse Acid): `notes` = `[36,36,48,39,36,43,46,36,36,48,43,39,36,34,43,46]`, `steps` = `[1,0,1,1,1,0,1,1,1,0,1,1,1,1,1,0]`, `accents` = `[1,0,0,0,1,0,1,0,1,0,0,0,1,0,1,0]`, `slides` = `[0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0]`.

### Het patroon in de state

- Het patroon zit in vier lijsten van 16 getallen (`notes`, `steps`, `accents`, `slides`); stap 1 is index 0. Er zijn geen sets of maten: een lijn is altijd precies 16 stappen, `length` kapt hem af.
- De host roept het apparaat voor elke zestiende stap aan. Bij `division` 1 klinkt elke stap, bij 2 elke tweede en bij 4 elke vierde (en duurt een noot dan twee of vier stappen). Het apparaat telt zelf door vanaf stap 1 en begint opnieuw bij `length`. Bij elke start of stop van de transportklok begint het weer bij stap 1.
- Een stap met `steps` = 0 is een rust en sluit de gate van de vorige noot. Een stap met `steps` = 1 speelt `notes[i]`.
- `slides[i]` = 1 betekent: glijd naar deze noot vanuit de vorige en laat de gate open, ook als de vorige noot al bijna uit was. Staat `slides` bij de **volgende** actieve stap aan, dan wordt de huidige noot niet afgesloten (een bindboog); zo maak je lange glijdende frasen. Een slide op een stap direct na een rust glijdt de toonhoogte nog wel vanuit de vorige noot, maar het volume begint opnieuw (de gate was gesloten).
- Een tune hoeft het patroon niet te zetten: laat je een lijst weg, dan krijgt elke stap de waarde van de startlijn hierboven. **Geef altijd alle vier de lijsten met 16 getallen** als de lijn bij de klank hoort. Een te korte lijst wordt per ontbrekende plek met de startlijn aangevuld (niet met nullen).
- `pattern` is alleen de naam van het patroon dat de gebruiker in de lijst koos. Het zetten van `pattern` via de state laadt dat patroon **niet** (en ook niet zijn knopstanden): alleen de vier lijsten en de knoppen in de state tellen. Een onbekende naam geeft `Warehouse Acid`. Zet `pattern` op de naam van de lijn waar je tune op lijkt, of laat hem weg.
- `mode` = `notes` maakt zelf geen geluid: het apparaat wacht dan op noten van de ingang `notes` (een sequencer in de song). Een tune die op zichzelf moet klinken, gebruikt `sequence`.

### Noten van buiten (mode `notes`)

Een event op de ingang `notes` met `type` `note` of `noteon` en een `note` (MIDI, 0 … 127) speelt die noot. Optioneel: `vel` (0 … 1, standaard 0,8; boven 0,9 telt als accent), `dur` (s), `held: true` (houden tot een `noteoff`), `legato: true` of `slide: true` (glijden naar deze noot) en `accent: true`. `noteoff` sluit de noot, `panic` of `allnotesoff` zet alles uit. In de modus `sequence` worden noten genegeerd (alleen `panic` werkt).

### Modulatie

Elf knoppen zijn te moduleren (spoor `klank`, in de interface Sound): `cutoff`, `resonance`, `env`, `decay`, `accent`, `glide`, `gate`, `drive`, `sub`, `transpose` en `level`. De knop blijft de basis; een modulator telt er een uitslag van −1 … 1 bij op.

### Wat een bewaker doet

Een bewaker controleert om de 50 ms de ruwe uitvoer van het filter (vóór de vervormer). Een filter dat ontspoort (`Infinity`, daarna `NaN`) zou voor altijd stil blijven; de bewaker vervangt dan de twee filters en het geluid gaat door. In een willekeurige en extreme zoektocht (300 reeksen met alle knoppen op hun minimum of maximum, modulatie ±1, noten, accent en slide) bleef de ruwe filteruitvoer onder 2 en is dit nooit gebeurd; het is een vangnet.

Wat het apparaat met een state doet (getest):
- Getallen buiten het bereik worden afgekapt (`cutoff: 1e9` wordt 10000, `resonance: -3` wordt 0,4); een tekst, `NaN`, `null` of een ontbrekende waarde geeft de startwaarde. `length` wordt afgerond, `selected` ook.
- Een ongeldige `wave`, `mode`, `division` of `pattern` geeft de startwaarde.
- In de vier lijsten worden elementen afgerond en afgekapt (`notes` op 24 … 84, de rest op 0 of 1); een element dat geen getal is, krijgt de startwaarde van die stap.
- `setState` met iets anders dan een object (een tekst, `null`, een getal) geeft alle startwaarden.
- Onbekende velden worden genegeerd. Zet er geen in.

## Een tune

Een pack heet `naam.patchkamer-tunes.json` en staat in `../../../tunes/`. Het formaat en de licentie (`CC0-1.0` voor alles in `tunes/`) staan in `../../../tunes/AGENTS.md`. Voor dit apparaat is `device` altijd `nl.patchkamer.acidstepper` en elke tune is `kind: "set"` met een volledige `state` als hierboven (laat `selected` weg). Zet geen merknamen van bestaande apparatuur in naam of omschrijving, en verzin geen persoon bij `author`.

Geef elke tune een eigen lijn die bij de klank past (alle vier de lijsten, 16 stappen).

### Wat werkt goed

Gebruik deze waarden als beginpunt en varieer binnen de bereiken.

| Soort | Instelling |
|---|---|
| Basis (bas) | `wave` `sawtooth`, `cutoff` 300 … 600, `resonance` 4 … 7, `env` 3 … 4,5, `decay` 0,15 … 0,3, `drive` 0,4 … 0,6, `sub` 0,2 … 0,5, `gate` 0,5 … 0,7; lijn in MIDI 29 … 48 |
| Lead | `cutoff` 1500 … 3000, `resonance` 2 … 4, `env` 1 … 2, `decay` 0,3 … 0,5, `drive` 0,1 … 0,3, `sub` 0, `glide` 0,08 … 0,15, veel `slides`; lijn in MIDI 48 … 72 |
| Pad (aanhoudend) | `gate` 1, lange bindbogen (`slides` aan op de stappen na de eerste), `cutoff` 800 … 1500, `decay` 1 … 2, `resonance` 1 … 2, `env` 1; het apparaat is monofoon, dus een pad is hier één langzaam bewegende lijn, geen akkoord |
| Pluck | `decay` 0,03 … 0,12, `env` 4 … 5, `gate` 0,15 … 0,3, `cutoff` 300 … 600, `resonance` 3 … 5, `sub` 0 … 0,1 |
| Arpeggio | `steps` allemaal 1, `notes` die een akkoord in toonhoogte op en neer lopen (bijvoorbeeld 36, 43, 48, 55), `division` 1 of 2, `gate` 0,3 … 0,5, accent op de tellen (index 0, 4, 8, 12) |

Een lijn met 16 stappen en een drietal accenten en slides klinkt het meest als acid. Zet de zwaarste noot (de grondtoon) op stap 1 en op de tellen.

### Wat een tune niet doet

- Zet `selected` niet in een tune (werkstand).
- Gebruik `mode: "notes"` alleen als de tune bedoeld is om door een sequencer in de song te worden gespeeld; anders is hij stil.
- Maak geen stille tune: `level` 0, alle `steps` 0, of `length` 1 met een rust op stap 1 geven niets te horen.
- Geef `notes` alleen hele getallen tussen 24 en 84; alles daarbuiten wordt afgekapt en klinkt dan niet zoals bedoeld.
- Je kunt het apparaat met geen enkele combinatie van waarden binnen de bereiken laten ontsporen (getest), maar `resonance` 9 met `cutoff` rond 70 en `env` 5 klinkt scherp en hard; houd het voor een basklank bescheidener.
- Verzin geen velden of routing: er zit geen routing in de state.

## Controleren

- Draai vanuit de root van de repo: `node contract/validate-instrument.mjs devices/synths/AcidStepper/acid-stepper.patchkamer-device.js` (en met `--lang en`). Dat moet `OK` geven, zonder `let op`.
- Je kunt niet horen hoe een tune klinkt. Heb je een browser, laad dan de host (`../../../patchkamer/AGENTS.md`) en kies de tune. Heb je geen browser, schrijf dan in je oplevering dat de tune **niet beluisterd** is.
- Alle tekst in het apparaat staat in het woordenboek `EN` bovenin het bestand (Nederlandse bron, Engels via `host.lang`). Een nieuwe tekst krijgt altijd nl én en.

## Wat je niet doet

- Verander nooit de `id`, de `kind`, de poort-id's of de namen van state-velden.
- Pas het apparaat niet aan om een tune te laten kloppen.
- Commit of push niet, tenzij de opdracht dat vraagt.

## Documentatie en songs

Dit zijn de plaatsen waar je terechtkunt voor documentatie en voor het componeren van songs met dit apparaat. Songs zijn CC-BY-4.0, tunes en presets CC0-1.0, het apparaat AGPL-3.0-or-later.

- Handleiding van Acid Stepper: [NL](../../../docs/synths/USER-MANUAL_NL.md#acid-stepper) · [EN](../../../docs/synths/USER-MANUAL_EN.md#acid-stepper).
- Overzicht van de soort: [README](../README.md); handleiding van de hele soort: [NL](../../../docs/synths/USER-MANUAL_NL.md) · [EN](../../../docs/synths/USER-MANUAL_EN.md).
- Tunes (klanken, `kind: set`): [acid-stepper-styles.patchkamer-tunes.json](../../../tunes/acid-stepper-styles.patchkamer-tunes.json). Kies een tune als beginpunt voor de `state` van dit apparaat in de song; velden die de tune niet noemt krijgen hun standaard. Hoe tunes zijn opgebouwd: [tunes/AGENTS.md](../../../tunes/AGENTS.md).
- Overzicht van alle apparaten en hun signaalketens: [devices/AGENTS.md](../../../devices/AGENTS.md). Een song componeren: [songs/AGENTS.md](../../../songs/AGENTS.md).
- Rol in een song: bas in acid-stijl met een eigen patroon van 16 stappen. Het speelt mee met de klok van de studio; externe noten op `notes` kunnen er ook in. Audio uit `out`. Patroon zit in de `state`, een aparte sequencer is niet nodig.
