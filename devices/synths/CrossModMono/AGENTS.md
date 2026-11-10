# AGENTS.md: Cross Mod Mono

Dit bestand is voor AI-agents die **tunes voor Cross Mod Mono** maken. Het is niet geschreven voor mensen. Het hoort bij `../../../AGENTS.md` (algemeen) en `../../../tunes/AGENTS.md` (regels voor tunepacks); lees die eerst. Hier staat wat alleen voor Cross Mod Mono geldt.

## Wat Cross Mod Mono is

Een monofone synth (één stem tegelijk) met twee oscillatoren (A en B), hard sync, audio-rate kruismodulatie (oscillator B moduleert de toonhoogte van A en de cutoff van het filter), twee envelopes (versterker en filter), een tweepolig lowpass-filter met resonantie, een LFO, portamento en een drive vóór het filter. Er zit een eigen patroon van 32 stappen in en een arpeggiator; het speelt ook noten van het toetsenbord of een externe sequencer.

| | |
|---|---|
| Bestand | `cross-mod-mono.patchkamer-device.js` (in deze map) |
| `id` | `nl.patchkamer.crossmodmono`. Verander die nooit: daaraan hangen tunes en songs van gebruikers |
| Naam | `Cross Mod Mono` in alle talen; alleen de poortnaam `Keyboard / noten` heeft een Engelse variant (via `i18n`) |
| Soort | `instrument`: dit apparaat krijgt dus **tunes** (geen presets) |
| Poorten | eventingang `notes` (noten en `cc`-events), modulatie-ingang `mod`, audio-uitgang `out` (stereo, beide kanalen gelijk) |
| Contract | v1.11 |
| Licentie apparaat | AGPL-3.0-or-later |

Dit apparaat is de nieuwe, bijgewerkte vorm van een ouder bestand met een andere naam en id. Tunes of songs uit die tijd verwijzen naar de oude id en laden hier niet in. De state-sleutels zijn ongewijzigd.

## Wat je hier doet

Je maakt klanken (tunes) voor Cross Mod Mono en zet ze als pack in `../../../tunes/`. Het apparaat zelf pas je alleen aan als de opdracht dat zegt (`version` ophogen; `id`, poort-id's en state-velden gelijk houden).

## De state

`state` van een tune is wat `getPreset()` teruggeeft: `getState()` zonder `testNote` en `selected` (dat zijn werkstanden van de kaart, geen klank). Elk veld hieronder staat dus in een tune. Ontbrekende velden krijgen hun startwaarde; onbekende velden worden genegeerd.

### Klank

| Veld | Wat | Bereik | Start |
|---|---|---|---|
| `wave` | Golfvorm van oscillator A | `sawtooth` (zaagtand) of `square` (puls) | `sawtooth` |
| `wave2` | Golfvorm van oscillator B | `sawtooth`, `square` of `triangle` | `sawtooth` |
| `osc1` | Niveau van A in de mix | 0 … 1 | 0,7 |
| `osc2` | Niveau van B in de mix | 0 … 1 | 0,5 |
| `osc2Semi` | Interval van B ten opzichte van de noot, in halve tonen (hele getallen) | −24 … 24 | 0 |
| `osc2Fine` | Fijnstemming van B in cent (detune) | −35 … 35 | 5 |
| `oscBLow` | B wordt een langzame modulator: een vaste frequentie van `0,5 × 2^(osc2Semi/12)` Hz (0,125 … 2 Hz), los van de gespeelde noot | `true`/`false` | `false` |
| `sync` | Hard sync: B begint opnieuw bij elke cyclus van A | `true`/`false` | `false` |
| `fm` | Kruismodulatie B → A: B verschuift de toonhoogte van A, `fm` keer de frequentie van A (1 = ±1 maal de toonhoogte). Boven 1 kan de toonhoogte van A tijdelijk bijna stilvallen | 0 … 3 | 0 |
| `audioFilter` | B → filter: B stuurt de cutoff, ±4 octaven bij 1 | 0 … 1 | 0 |
| `pw` | Pulsbreedte (werkt alleen op een `square`-golf, A en B) | 0,05 … 0,95 | 0,5 |
| `noise` | Ruis in de mix | 0 … 1 | 0 |
| `transpose` | Transpositie van het hele apparaat in halve tonen (hele getallen) | −24 … 24 | 0 |
| `glide` | Portamento: tijd van de glijding tussen noten (s, logaritmisch) | 0,001 … 1 | 0,005 |
| `legato` | Bij overlappende noten start de envelope niet opnieuw | `true`/`false` | `true` |
| `priority` | Welke toets klinkt als er meer zijn ingedrukt | `last` (laatste), `low` (laagste), `high` (hoogste) | `last` |
| `drive` | Verzadiging vóór het filter | 0 … 1 | 0,1 |
| `level` | Uitgangsniveau | 0 … 1 | 0,75 |

### Filter en envelopes

| Veld | Wat | Bereik | Start |
|---|---|---|---|
| `cutoff` | Cutoff in Hz (logaritmisch) | 30 … 16000 | 1200 |
| `resonance` | Resonantie van het filter | 0 … 1 | 0,25 |
| `filterEnv` | Hoeveel de filter-envelope de cutoff beweegt, in octaven (negatief = omlaag) | −5 … 5 | 3 |
| `keytrack` | Cutoff volgt de toonhoogte (1 = één octaaf per octaaf, rond noot 60) | 0 … 1 | 0,5 |
| `fAttack`, `fDecay`, `fSustain`, `fRelease` | Filter-envelope (tijden in s, logaritmisch; sustain 0 … 1) | 0,001 … 4; 0,01 … 8; 0 … 1; 0,01 … 8 | 0,005; 0,25; 0,15; 0,3 |
| `attack`, `decay`, `sustain`, `release` | Versterker-envelope (zelfde indeling) | 0,001 … 4; 0,01 … 8; 0 … 1; 0,01 … 8 | 0,008; 0,3; 0,65; 0,3 |

### LFO

| Veld | Wat | Bereik | Start |
|---|---|---|---|
| `lfoWave` | Vorm | `sawtooth`, `square` of `triangle` | `triangle` |
| `lfoRate` | Snelheid in Hz (logaritmisch) | 0,05 … 30 | 2 |
| `vibrato` | LFO → toonhoogte, in cent | 0 … 120 | 0 |
| `lfoFilter` | LFO → cutoff, ±3 octaven bij 1 | 0 … 1 | 0 |
| `pwm` | LFO → pulsbreedte (hoorbaar bij een `square`-golf) | 0 … 1 | 0,2 |

### Sequencer en arpeggiator

| Veld | Wat | Bereik | Start |
|---|---|---|---|
| `mode` | `notes`: speelt noten die binnenkomen (toetsenbord of externe sequencer). `sequence`: speelt het eigen patroon op de klok en negeert binnenkomende noten. `arp`: speelt de ingedrukte noten als arpeggio op de klok | `notes`, `sequence`, `arp` | `notes` |
| `division` | Hoeveel zestiende noten per notenplek: 1 = elke zestiende, 2 = achtste noten, 4 = kwartnoten | 1, 2 of 4 | 1 |
| `length` | Aantal plekken dat het patroon (of de arp-teller) doorloopt | 1 … 32 | 16 |
| `gate` | Lengte van elke noot als deel van de plek (0,1 = kort en staccato, 1 = tot de volgende noot) | 0,1 … 1 | 0,65 |
| `arpDirection` | Richting van de arpeggio, over de ingedrukte noten van laag naar hoog | `up` of `down` | `up` |
| `seqNotes` | Lijst van altijd 32 nootnummers (MIDI, 24 … 96, hele getallen); alleen de eerste `length` klinken | 32 × 24 … 96 | zie hieronder |
| `seqOn` | Lijst van altijd 32 getallen: `1` = noot, `0` = rust | 32 × 0 of 1 | zie hieronder |
| `preset` | Naam van de klank in de keuzelijst "Sound" (alleen een label, zie hieronder) | een van de zes namen hieronder | `Twin Saw Bass` |

De standaard `seqNotes` is `[36,36,48,43,39,36,46,43,36,48,39,43,34,36,43,46]` twee keer achter elkaar (32 waarden); de standaard `seqOn` is `[1,0,1,1,1,0,1,1,1,0,1,1,1,1,1,0]` twee keer achter elkaar.

Hoe het patroon werkt (getest):
- De stap `i` van het patroon is de teller van de klok modulo `length`. De teller begint bij 0 als de klok start (de host geeft dat door) en telt alleen de zestiende noten waarop `step` deelbaar is door `division`. Een noot duurt `division × stapduur × gate` seconden en heeft vaste velocity 0,85.
- `seqNotes[i]` is een absoluut nootnummer (MIDI, 60 = middelste C); `transpose` komt daar nog bij. `seqOn[i] = 0` is een rust. Waarden voorbij `length` worden bewaard maar niet gespeeld.
- In `arp` is stap `i` hetzelfde, maar de noot is `gesorteerde ingedrukte noten[i % aantal]` (bij `down` van boven af). Kies dus een `length` die een veelvoud is van het aantal noten dat je verwacht (12 past bij 1, 2, 3 en 4 noten; 16 bij 1, 2, 4 en 8), anders wordt het patroon scheef bij het doorlopen.
- Een tune in `sequence` of `arp` klinkt alleen als de klok loopt; in `arp` bovendien alleen als er noten ingedrukt zijn. Zet `mode` op `notes` tenzij de tune bedoeld is als zelfspelende lijn, en geef zo'n tune dan een eigen `seqNotes`/`seqOn`.

Klanknamen voor `preset` (taalneutraal, alleen een label in de keuzelijst; het zetten van `preset` via de state verandert de klank niet): `Twin Saw Bass`, `Sync Blade`, `Cross Mod Metal`, `Low B Motion`, `Detroit Pluck`, `Long Unison Lead`. Kiest een gebruiker een van die namen in de keuzelijst, dan krijgt hij de bijbehorende instellingen (en blijven modus, patroon en nootprioriteit staan). Een tune zet `preset` op de dichtstbijzijnde naam of laat het veld weg (dan staat er `Twin Saw Bass`).

### Niet in een tune

`testNote` en `selected` komen niet uit `getPreset()` en horen niet in een tune. Er is geen routing in de state. De Mod-ingang (paarse kabel) kan 29 parameters sturen in vijf sporen (Filter, Amplifier / envelope, Oscillators, Modulation, Master); die sturing hoort niet in een tune.

## Wat het apparaat met een state doet (getest)

- Getallen buiten het bereik worden afgekapt (`cutoff: 1e9` wordt 16000, `length: 1e9` wordt 32); een tekst, `null`, `NaN`, `Infinity` of een ontbrekende waarde geeft de startwaarde.
- Een ongeldige keuze (`wave`, `wave2`, `lfoWave`, `priority`, `mode`, `arpDirection`, `division`, `preset`) of een waarde die geen boolean is (`legato`, `sync`, `oscBLow`) geeft de startwaarde.
- `seqNotes` en `seqOn` worden altijd 32 lang: ontbrekende of ongeldige plekken krijgen de standaardwaarde, noten worden afgekapt op 24 … 96, `seqOn` op 0 of 1.
- `selected` wordt afgekapt op de lengte van het patroon.
- Onbekende velden worden genegeerd. Zet er geen in.
- `setState({})` geeft de startwaarden; `setState(getState())` geeft dezelfde state terug.

## Een goede basis, en per soort

Niet beluisterd: dit zijn aanwijzingen uit de werking van de motor, geen oordeel over hoe iets klinkt. Luister altijd zelf.

- **Basis**: zet de standaardwaarden en verander alleen wat de klank nodig heeft. De uitvoer wordt begrensd rond 0,9, dus een te hoog niveau verzadigt, het apparaat raakt er niet van van slag.
- **Bas**: lage `cutoff` (300 … 900), `resonance` 0,3 … 0,5, `filterEnv` 2 … 4 met korte `fDecay` (0,15 … 0,3) en lage `fSustain`, korte `attack` (0,003 … 0,01), `transpose` −12 of lage noten in het patroon, `osc2Fine` 5 … 12 voor wat breedte, `drive` 0,1 … 0,3.
- **Lead**: `cutoff` 3000 … 8000, `legato` aan, `glide` 0,05 … 0,12, `osc2Fine` 8 … 14, `vibrato` 10 … 30 cent met `lfoRate` 5 … 6, `release` 0,3 … 0,8.
- **Pad**: `attack` 0,4 … 1,5 en `release` 1,5 … 3, `sustain` rond 0,8, trage filter-envelope (`fAttack` 0,5 … 1,5, `filterEnv` 1 … 2), `wave` `square` met `pwm` 0,4 … 0,6 en een trage `lfoRate` (0,2 … 0,5), `osc2Fine` 10 … 20. Het apparaat is monofoon: een akkoord kan alleen als arpeggio.
- **Pluck**: `sustain` 0, `decay` 0,15 … 0,4, `fSustain` 0, `fDecay` 0,1 … 0,25, `filterEnv` 3 … 4,5, `cutoff` 600 … 1500, `release` 0,1 … 0,3.
- **Kruismodulatie en sync**: `sync` aan met `osc2Semi` 12 … 24 en een `filterEnv` of `lfoFilter` geeft het bekende sync-geluid dat met de cutoff beweegt; `fm` 0,3 … 1,2 met `osc2Semi` 7 of 12 geeft metaalachtige klanken; `oscBLow` met `osc2` 0 en `fm` 0,1 … 0,3 en `audioFilter` 0,3 … 0,6 geeft een langzame, onregelmatige beweging.
- **Arpeggio**: `mode` `arp`, `division` 1 of 2, `gate` 0,3 … 0,6, korte `decay` en `release`, `length` 12 of 16.

## Wat een tune niet moet doen

- Geen stille klank: `osc1`, `osc2` en `noise` alle drie 0, of `level` 0, of een `cutoff` onder ongeveer 100 zonder `filterEnv` en `keytrack` die hem omhoog halen. Ook `sustain` 0 met een lange noot valt stil (dat is bij een pluck de bedoeling, bij een bas niet).
- Geen `mode` `sequence` of `arp` zonder bedoeling: zonder klok (en bij `arp` zonder ingedrukte noten) hoort de gebruiker niets en denkt dat het apparaat stuk is.
- Geen `fm` boven 1,5 bij een lage noot en lage `cutoff` tegelijk, tenzij de tune juist bedoeld is als ruwe, onstabiele klank.
- Geen waarden buiten het bereik of velden die hier niet staan.

## Bewaker

De motor laat geen niet-eindige waarde (`NaN`, `Infinity`) door: parameters worden alleen eindig geaccepteerd, de uitvoer wordt begrensd en een stem met een ontspoorde toestand begint opnieuw, zodat het apparaat niet voor altijd stil blijft. Getest met willekeurige en extreme instellingen (alle regelaars op hun minimum of maximum) en met modulatie op ±1: er kwam geen niet-eindige sample uit. Het geluid in het normale gebied is bit-identiek gebleven.

## Een tune

Een pack heet `naam.patchkamer-tunes.json` en staat in `../../../tunes/`. Het formaat en de licentie (`CC0-1.0` voor alles in `tunes/`) staan in `../../../tunes/AGENTS.md`. Voor dit apparaat is `device` altijd `nl.patchkamer.crossmodmono` en elke tune is `kind: "set"` met een `state` als hierboven. Zet geen merknamen van bestaande apparatuur in naam of omschrijving, en verzin geen persoon bij `author`. Voor een tune die een eigen lijn speelt, zet je `mode`, `division`, `length`, `seqNotes` en `seqOn` in de state (zie hierboven); `tunes/AGENTS.md` zegt dat patronen niet bij de klank horen, maar voor deze zelfspelende tunes zijn ze de bedoeling.

## Skins

Alle schuiven en keuzelijsten zijn sinds 1.13.0 via `host.ui.adopt` herkenbaar voor skins: `id` is de state-sleutel (`cutoff`, `wave`, `mode`, enzovoort), `role` is `param` of `select` (ook de aan/uit-keuzes `legato`, `sync` en `oscBLow`), `group` is het spoor (`filter`, `amp`, `source`, `motion`, `master`) of `setup`, `play`, `seq`. Elk spoor zit in een eigen `div.grp` met `data-g` en `data-t` (korte titel); zonder skin is dat `display:contents`, dus het uiterlijk is ongewijzigd. `length` (Lengte) is bewust geen aangemelde regelaar: een nieuwe lengte bouwt de hele UI opnieuw op, en dat verbreekt een sleepgebaar op een draaiknop. De meegeleverde skin `Compact` staat in `../../../skins/library/nl.patchkamer.crossmodmono/` (draaiknoppen met waarde en naam eronder, per spoor een kader, een rooster van 8 stappen per rij; ongeveer 480 x 510 punten, 480 x 605 met het eigen patroon, tegenover 920 x 1370). De skin leunt op `.app`, `.row` (op volgorde: setup, test, besturing), `.pads`, `.grp` en `.control`: wijzig je die, controleer dan de skin.

## Controleren

- Draai vanuit de root van de repo: `node contract/validate-instrument.mjs devices/synths/CrossModMono/cross-mod-mono.patchkamer-device.js` (en met `--lang en`). Dat moet `OK` geven, zonder `let op`.
- Je kunt niet horen hoe een tune klinkt. Heb je een browser, laad dan de host (`../../../patchkamer/AGENTS.md`) en kies de tune. Heb je geen browser, schrijf dan in je oplevering dat de tune **niet beluisterd** is.
- Alle tekst in het apparaat staat in het woordenboek `EN` bovenin het bestand (Nederlandse bron, Engels via `host.lang`). Een nieuwe tekst krijgt altijd nl én en.

## Wat je niet doet

- Verander nooit de `id`, de `kind`, de poort-id's of de namen van state-velden.
- Pas het apparaat niet aan om een tune te laten kloppen.
- Commit of push niet, tenzij de opdracht dat vraagt.

## Documentatie en songs

Dit zijn de plaatsen waar je terechtkunt voor documentatie en voor het componeren van songs met dit apparaat. Songs zijn CC-BY-4.0, tunes en presets CC0-1.0, het apparaat AGPL-3.0-or-later.

- Handleiding van Cross Mod Mono: [NL](../../../docs/synths/USER-MANUAL_NL.md#cross-mod-mono) · [EN](../../../docs/synths/USER-MANUAL_EN.md#cross-mod-mono).
- Overzicht van de soort: [README](../README.md); handleiding van de hele soort: [NL](../../../docs/synths/USER-MANUAL_NL.md) · [EN](../../../docs/synths/USER-MANUAL_EN.md).
- Tunes (klanken, `kind: set`): [cross-mod-mono-styles.patchkamer-tunes.json](../../../tunes/cross-mod-mono-styles.patchkamer-tunes.json). Kies een tune als beginpunt voor de `state` van dit apparaat in de song; velden die de tune niet noemt krijgen hun standaard. Hoe tunes zijn opgebouwd: [tunes/AGENTS.md](../../../tunes/AGENTS.md).
- Overzicht van alle apparaten en hun signaalketens: [devices/AGENTS.md](../../../devices/AGENTS.md). Een song componeren: [songs/AGENTS.md](../../../songs/AGENTS.md).
- Route voor agents: [soort Synths](../AGENTS.md) → [devices/AGENTS.md](../../AGENTS.md) → [root AGENTS.md](../../../AGENTS.md). Contract: [NL](../../../contract/PATCHKAMER-CONTRACT_NL.md) · [EN](../../../contract/PATCHKAMER-CONTRACT_EN.md). Hoe tunes van dit apparaat zijn opgebouwd: [tunes/AGENTS.md](../../../tunes/AGENTS.md). <!-- agents-tree -->
- Rol in een song: monofone synth met kruismodulatie, geschikt voor bas of lead. Noten en `cc`-events op `notes`, audio uit `out` (stereo). Geen eigen patroon.
