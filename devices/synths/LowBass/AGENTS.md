# AGENTS.md: Low Bass

Dit bestand is voor AI-agents die **tunes voor Low Bass** maken. Het is niet geschreven voor mensen. Het hoort bij `../../../AGENTS.md` (algemeen) en `../../../tunes/AGENTS.md` (regels voor tunepacks); lees die eerst. Hier staat wat alleen voor Low Bass geldt.

## Wat Low Bass is

Een monofone basssynth (één noot tegelijk, de laatst gespeelde noot wint) **zonder eigen sequencer of arpeggiator**: hij speelt alleen noten die binnenkomen op de ingang `notes`. Twee oscillatoren (zaagtand, blok of driehoek) die licht tegen elkaar zijn gestemd, plus een sinus-sub-oscillator een octaaf lager en optioneel FM (de tweede oscillator moduleert de toonhoogte van de eerste). Daarna een vierpolig lowpass-filter (twee biquads) met resonantie en een filter-envelope, een verzadiger (drive) en een hoogdoorlaat op 25 Hz, een ADSR-versterker, glide (portamento), legato en een compressor op de uitgang. Er zijn zeven presets in de keuzelijst; een tune zet in plaats daarvan alle knoppen zelf.

| | |
|---|---|
| Bestand | `low-bass.patchkamer-device.js` (in deze map) |
| `id` | `nl.patchkamer.lowbass`. Verander die nooit: daaraan hangen tunes en songs van gebruikers |
| Naam | `Low Bass` in alle talen; alleen de poortnamen hebben een Nederlandse variant (via `i18n`) |
| Soort | `instrument`: dit apparaat krijgt dus **tunes** (geen presets) |
| Poorten | eventingang `notes` (Notes / Noten), modulatie-ingang `mod`, audio-uitgang `out` (Bass out / Bass uit) |
| Contract | v1.11 |
| Licentie apparaat | AGPL-3.0-or-later |

Dit apparaat is de nieuwe, bijgewerkte vorm van een ouder bestand met een andere naam en id. Tunes of songs uit die tijd verwijzen naar de oude id en laden hier niet in.

## Wat je hier doet

Je maakt klanken (tunes) voor Low Bass en zet ze als pack in `../../../tunes/`. Het apparaat zelf pas je alleen aan als de opdracht dat zegt (`version` ophogen; `id`, poort-id's en state-velden gelijk houden).

## De state

`state` van een tune is wat `getState()` teruggeeft: 18 velden, alleen knoppen en keuzes. Er is **geen patroon**: een tune is een klank, de noten komen uit de song. Een veld dat je weglaat krijgt de startwaarde.

| Veld | Wat | Bereik | Start |
|---|---|---|---|
| `cutoff` | Cutoff van het filter in Hz (lineaire schuif) | 40 … 10000 | 650 |
| `resonance` | Resonantie van het eerste filter (het tweede staat vast) | 0,2 … 7 | 1,2 |
| `sub` | Sub-oscillator (sinus, een octaaf lager) | 0 … 1 | 0,5 |
| `detune` | Zweving: de eerste oscillator staat dit aantal cent lager en de tweede evenveel hoger (samen dus tweemaal zoveel uit elkaar) | 0 … 20 | 3 |
| `drive` | Vervorming (versterking voor de verzadiger; het niveau wordt automatisch gecompenseerd) | 1 … 16 | 2 |
| `fm` | FM-diepte: hoe sterk de tweede oscillator de toonhoogte van de eerste moduleert (Hz) | 0 … 1200 | 0 |
| `env` | Filter-envelope: hoeveel octaven de cutoff bij elke noot omhoog schiet (bij een zachte aanslag de helft, bij een harde het volle bedrag) en met `decay` terugvalt | 0 … 5 | 2 |
| `glide` | Glide-tijd bij legato (s, logaritmisch) | 0,001 … 1,5 | 0,04 |
| `attack` | Attack van de versterker (s, logaritmisch) | 0,001 … 2 | 0,008 |
| `decay` | Decay van versterker en filter (s, logaritmisch) | 0,02 … 3 | 0,3 |
| `sustain` | Sustain-niveau van de versterker | 0 … 1 | 0,7 |
| `release` | Release na het einde van een noot (s, logaritmisch) | 0,01 … 6 | 0,2 |
| `accent` | Hoeveel een harde aanslag extra volume krijgt | 0 … 1 | 0,4 |
| `level` | Uitgangsniveau | 0 … 1 | 0,75 |
| `bend` | Vaste toonhoogteverschuiving in halve tonen | −12 … 12 | 0 |
| `wave` | Golfvorm van beide oscillatoren | `sawtooth`, `square` of `triangle` | `sawtooth` |
| `legato` | Legato: overlappende noten glijden (met `glide`) in plaats van opnieuw aan te slaan | `true` of `false` | `true` |
| `preset` | Naam van de preset waarvan de knoppen komen, of `Custom` zodra een knop is aangepast. Alleen een **label**; de knoppen bepalen het geluid | `Analog Bass`, `Deep Sub`, `Acid Slide`, `Square Punch`, `FM Growl`, `Rumble Bass`, `Pluck Bass` of `Custom` | `Analog Bass` |

Zet in een tune `preset` op `Custom` (of op de naam van de preset waar je klank op lijkt). Het zetten van `preset` via de state laadt de knoppen van die preset **niet**: alleen de velden in de state tellen. De oude naam `Eigen` wordt nog gelezen en wordt `Custom`.

De zeven presets (alleen wat afwijkt van de startwaarden):

| Preset | Afwijking |
|---|---|
| `Analog Bass` | geen (de startwaarden) |
| `Deep Sub` | `wave` `triangle`, `sub` 1, `cutoff` 280, `resonance` 0,7, `env` 0,5, `drive` 1,3 |
| `Acid Slide` | `cutoff` 450, `resonance` 4,5, `env` 3,5, `decay` 0,18, `glide` 0,09, `sub` 0,2, `drive` 3 |
| `Square Punch` | `wave` `square`, `cutoff` 1800, `resonance` 0,8, `env` 2,5, `attack` 0,002, `decay` 0,15, `sustain` 0,4, `sub` 0,6 |
| `FM Growl` | `fm` 650, `cutoff` 2800, `drive` 5, `sub` 0,5, `detune` 0, `env` 1,2 |
| `Rumble Bass` | `wave` `triangle`, `cutoff` 300, `drive` 6, `sub` 1, `release` 0,6, `env` 0,4 |
| `Pluck Bass` | `cutoff` 1600, `env` 2, `decay` 0,12, `sustain` 0,05, `release` 0,08, `legato` `false` |

### Hoe de noten binnenkomen

Een event op de ingang `notes` heeft `type` `note`, `noteon` of `noteoff` met een `note` (MIDI, 0 … 127), `vel` (0 … 1, standaard 0,8; 0 telt als noteoff) en `time`. `dur` (s) is de lengte van een noot; met `held: true` blijft hij klinken tot een `noteoff`. Een `panic` of `allnotesoff` zet alles uit. Een event met `type` `cc` en een `id` van een veld hierboven en een `value` van 0 … 1 zet dat veld (lineair tussen zijn grenzen) en maakt van `preset` `Custom`. De transportklok stoppen zet alles uit.

Er is geen patroon in de state en geen arpeggiator: wil een tune een figuur laten horen, dan komt die uit de sequencer in de song. Het apparaat heeft zelf geen stappen.

Legato werkt alleen zolang de vorige noot nog klinkt (overlappende noten of `held`); losse noten slaan altijd opnieuw aan. De filter-envelope slaat bij elke noot opnieuw aan, ook bij legato.

### Modulatie

Vijftien velden zijn te moduleren (spoor `bass`): alle getallen hierboven. Het veld `on` in de parameterlijst is alleen een **voorstel** voor een modulator (contract §8: "of de parameter standaard aan staat"): het schakelt niets uit. Alle vijftien zijn altijd te moduleren en te zien; een gebruiker kan elk ervan zelf aanzetten. Voorgesteld aan staan alle behalve `bend` (toonhoogte) en `level` (volume), zodat een modulator niet standaard de stemming of het volume laat bewegen. De knop blijft de basis; een modulator telt er een uitslag van −1 … 1 bij op.

### Wat een bewaker doet

Een bewaker controleert om de 50 ms de ruwe uitvoer van de twee filters (vóór de verzadiger). Een filter dat ontspoort (`Infinity`, daarna `NaN`) zou voor altijd stil blijven; de bewaker vervangt dan de filters en het geluid gaat door. In een willekeurige en extreme zoektocht (300 reeksen met alle knoppen op hun minimum of maximum, modulatie ±1, willekeurige noten en `cc`-events) bleef de ruwe filteruitvoer onder 3,1 en is dit nooit gebeurd; het is een vangnet.

Wat het apparaat met een state doet (getest):
- Getallen buiten het bereik worden afgekapt (`cutoff: 1e9` wordt 10000, `bend: -99` wordt −12); een tekst, `NaN`, `null` of een ontbrekende waarde geeft de startwaarde.
- Een ongeldige `wave`, `legato` (geen echte `true` of `false`) of `preset` geeft de startwaarde.
- `setState` met iets anders dan een object geeft alle startwaarden.
- Onbekende velden worden genegeerd. Zet er geen in.

## Een tune

Een pack heet `naam.patchkamer-tunes.json` en staat in `../../../tunes/`. Het formaat en de licentie (`CC0-1.0` voor alles in `tunes/`) staan in `../../../tunes/AGENTS.md`. Voor dit apparaat is `device` altijd `nl.patchkamer.lowbass` en elke tune is `kind: "set"` met een volledige `state` als hierboven. Zet geen merknamen van bestaande apparatuur in naam of omschrijving, en verzin geen persoon bij `author`.

### Wat werkt goed

| Soort | Instelling |
|---|---|
| Basis (bas) | de startwaarden: `sawtooth`, `cutoff` 500 … 800, `resonance` 1 … 2, `sub` 0,4 … 0,6, `detune` 2 … 5, `drive` 2 … 3, `env` 1,5 … 2,5, `decay` 0,2 … 0,4, `sustain` 0,6 … 0,8 |
| Sub-bas | `wave` `triangle` of `sawtooth`, `sub` 0,8 … 1, `cutoff` 200 … 300, `resonance` 0,5 … 1, `env` 0,3 … 0,6, `drive` 1 … 1,5, `detune` 0 … 3 |
| Acid-achtig | `cutoff` 400 … 600, `resonance` 4 … 6, `env` 3 … 4, `decay` 0,15 … 0,25, `glide` 0,08 … 0,12, `legato` `true`, `drive` 3 |
| Lead | `wave` `square` of `sawtooth`, `cutoff` 2000 … 4000, `resonance` 1 … 3, `sub` 0 … 0,2, `detune` 5 … 10, `env` 1 … 2, `sustain` 0,6 … 0,8, `legato` `true`, `glide` 0,05 … 0,15 |
| Pluck | `cutoff` 1200 … 2000, `env` 2 … 3, `decay` 0,08 … 0,15, `sustain` 0 … 0,1, `release` 0,05 … 0,1, `legato` `false` |
| Pad | niet geschikt: het apparaat is monofoon en kent geen akkoorden. Met `attack` 0,5 … 1,5, `release` 1 … 3 en `sustain` 0,8 … 1 en `legato` `true` krijg je hooguit een langzaam aanzwellende enkele noot |
| Arpeggio | het apparaat heeft er zelf geen; gebruik `legato` `false`, `attack` 0,002, `decay` 0,1 … 0,2, `sustain` 0 … 0,2 zodat elke noot kort en helder aanslaat, en laat de song de noten arpeggiëren |

### Wat een tune niet doet

- Maak geen stille tune: `level` 0 of `sustain` 0 met lange noten geeft (bijna) niets te horen.
- Zet geen patroon of stappen in de state: dit apparaat heeft ze niet.
- Zet `drive` niet op 16 en `fm` niet op 1200 samen met `cutoff` boven 8000 voor een basklank: het wordt hard en scherp (het ontspoort niet, de bewaker en de compressor vangen het op).
- Laat `cutoff` onder 100 niet samen met `env` 0 staan: dan klinkt alleen nog een dof gebrom.
- Verzin geen velden of routing: er zit geen routing in de state.

## Controleren

- Draai vanuit de root van de repo: `node contract/validate-instrument.mjs devices/synths/LowBass/low-bass.patchkamer-device.js` (en met `--lang en`). Dat moet `OK` geven, zonder `let op`.
- Je kunt niet horen hoe een tune klinkt. Heb je een browser, laad dan de host (`../../../patchkamer/AGENTS.md`) en kies de tune. Heb je geen browser, schrijf dan in je oplevering dat de tune **niet beluisterd** is.
- Alle tekst in het apparaat staat in het woordenboek `EN` bovenin het bestand (Nederlandse bron, Engels via `host.lang`). Een nieuwe tekst krijgt altijd nl én en.

## Wat je niet doet

- Verander nooit de `id`, de `kind`, de poort-id's of de namen van state-velden.
- Pas het apparaat niet aan om een tune te laten kloppen.
- Commit of push niet, tenzij de opdracht dat vraagt.

## Documentatie en songs

Dit zijn de plaatsen waar je terechtkunt voor documentatie en voor het componeren van songs met dit apparaat. Songs zijn CC-BY-4.0, tunes en presets CC0-1.0, het apparaat AGPL-3.0-or-later.

- Handleiding van Low Bass: [NL](../../../docs/synths/USER-MANUAL_NL.md#low-bass) · [EN](../../../docs/synths/USER-MANUAL_EN.md#low-bass).
- Overzicht van de soort: [README](../README.md); handleiding van de hele soort: [NL](../../../docs/synths/USER-MANUAL_NL.md) · [EN](../../../docs/synths/USER-MANUAL_EN.md).
- Tunes (klanken, `kind: set`): [low-bass-styles.patchkamer-tunes.json](../../../tunes/low-bass-styles.patchkamer-tunes.json). Kies een tune als beginpunt voor de `state` van dit apparaat in de song; velden die de tune niet noemt krijgen hun standaard. Hoe tunes zijn opgebouwd: [tunes/AGENTS.md](../../../tunes/AGENTS.md).
- Overzicht van alle apparaten en hun signaalketens: [devices/AGENTS.md](../../../devices/AGENTS.md). Een song componeren: [songs/AGENTS.md](../../../songs/AGENTS.md).
- Rol in een song: bas, monofoon (laatste noot wint) en zonder eigen sequencer of arpeggiator. Noten op `notes`, audio uit `out`. Stuur hem met een Step Sequencer.
