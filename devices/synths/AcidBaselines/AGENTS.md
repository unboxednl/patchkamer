# AGENTS.md: Acid Baselines

Dit bestand is voor AI-agents die **tunes voor Acid Baselines** maken. Het is niet geschreven voor mensen. Het hoort bij `../../../AGENTS.md` (algemeen) en `../../../tunes/AGENTS.md` (regels voor tunepacks); lees die eerst. Hier staat wat alleen voor Acid Baselines geldt.

## Wat Acid Baselines is

Een basslijn-synth met een oscillator (zaagtand of blok) plus sub, ruis en een tweede oscillator met ringmodulatie, een tweevoudig filter (lowpass, bandpass of highpass) met resonantie en een tweede parallel filter, aparte normal- en accent-decay, soft attack, filter-FM, een vervormer met vier typen (zacht, hard, fold, asym) met Tight, Mix en Crush, en een toonfilter. Er zit een eigen 16-staps sequencer in met accent, slide en octaaf per stap, 1 tot 16 sets (maten), een keuzelijst met 16 klassieke acid-patronen (eigen werk in de stijl; een patroon komt in de maat die je bewerkt) en een lijngenerator. Het speelt ook noten van een externe sequencer.

| | |
|---|---|
| Bestand | `acid-baselines.patchkamer-device.js` (in deze map) |
| `id` | `nl.patchkamer.acidbaselines`. Verander die nooit: daaraan hangen tunes en songs van gebruikers |
| Naam | `Acid Baselines` in alle talen; alleen de poortnamen `Out` en `Notes` hebben een Nederlandse variant (via `i18n`) |
| Soort | `instrument`: dit apparaat krijgt dus **tunes** (geen presets) |
| Poorten | eventingangen `notes` (Notes) en `cc` (CC), modulatie-ingang `mod`, audio-uitgang `out` (Out) |
| Contract | v1.11 |
| Licentie apparaat | AGPL-3.0-or-later |

Dit apparaat is de nieuwe, bijgewerkte vorm van een ouder bestand met een andere naam en id. Tunes of songs uit die tijd verwijzen naar de oude id en laden hier niet in.

## Wat je hier doet

Je maakt klanken (tunes) voor Acid Baselines en zet ze als pack in `../../../tunes/`. Het apparaat zelf pas je alleen aan als de opdracht dat zegt (`version` ophogen; `id`, poort-id's en state-velden gelijk houden).

## De state

`state` van een tune is wat `getState()` teruggeeft: de knoppen plus het hele sequencerraster.

| Veld | Wat | Bereik | Start |
|---|---|---|---|
| `wave` | Golfvorm | `sawtooth` of `square` | `sawtooth` |
| `oct` | Octaaf (hele apparaat) | −1, 0 of 1 | 0 |
| `fine` | Stemming in cent | −100 … 100 | 0 |
| `cut` | Cutoff in Hz | 80 … 5000 | 520 |
| `res` | Resonantie | 0,5 … 28 | 14 |
| `env` | Env mod | 0 … 1 | 0,65 |
| `ndec` | Normal decay (s) | 0,03 … 3 | 0,3 |
| `adec` | Accent decay (s) | 0,03 … 1 | 0,12 |
| `acc` | Accentsterkte | 0 … 1 | 0,7 |
| `soft` | Soft attack (s) | 0,001 … 0,3 | 0,003 |
| `slide` | Slide-tijd (s) | 0,02 … 0,6 | 0,09 |
| `fm` | Filter-FM | 0 … 1 | 0 |
| `drive` | Overdrive | 0 … 1 | 0,35 |
| `muf` | Toonfilter in Hz | 500 … 12000 | 7000 |
| `vca` | VCA decay (s) | 0,1 … 4 | 2 |
| `lvl` | Niveau | 0 … 1 | 0,6 |
| `sub` | Sub-oscillator (blokgolf, een octaaf lager) | 0 … 1 | 0 |
| `noise` | Ruis | 0 … 1 | 0 |
| `osc2` | Tweede oscillator (zelfde golfvorm) | 0 … 1 | 0 |
| `det2` | Detune van osc 2 in cent | −100 … 100 | 0 |
| `ring` | Ringmodulatie osc × osc 2 | 0 … 1 | 0 |
| `ftype` | Filtertype van filter 1 | `lowpass`, `bandpass` of `highpass` | `lowpass` |
| `p2` | Filter 2 (parallelle bandpass, +12 dB bij 1) | 0 … 1 | 0 |
| `p2o` | Octaafverschuiving van filter 2 ten opzichte van de cutoff | −2 … 3 | 0 |
| `dtype` | Vervormingstype | `soft`, `hard`, `fold` of `asym` | `soft` |
| `tight` | Hoogdoorlaat vóór de vervorming in Hz (0 = uit) | 0 … 600 | 0 |
| `mix` | Nat (vervormd) tegenover droog | 0 … 1 | 1 |
| `crush` | Bitdiepte na de vervorming (16 = uit) | 2 … 16 | 16 |
| `seqOn` | Interne sequencer aan | `true` of `false` | `true` |
| `bars` | Aantal sets | 1, 2, 4, 8 of 16 | 2 |
| `grid` | Raster: 16 sets | lijst van sets | twee startlijnen |

Elke set in `grid` heeft vier lijsten van 16 stappen: `n` (noot: −1 = rust, 0 … 12 = C2 … C3 in halve tonen), `acc` (accent, 0 of 1), `sl` (slide, 0 of 1) en `oc` (octaaf per stap, −2 … 2).

De knoppen staan op de kaart in zes secties (Oscillator, Filter, Envelope, Slide, Distortion, Output). Alle velden vanaf `sub` zijn nieuw en staan standaard uit: een tune zonder die velden klinkt als vroeger, ook al staan ze er niet in. Een tune hoeft ze dus alleen te zetten als de klank er gebruik van maakt.

Een bewaker controleert om de 50 ms de ruwe uitvoer van de filterketen (voor de vervorming). Bij veel resonantie, filter-FM en een omlaag gemoduleerde cutoff kan een filter instabiel worden (`Infinity`, daarna `NaN`); de bewaker vervangt dan de filters, zodat het apparaat niet voor altijd stil blijft en geen `NaN` doorgeeft. Test extreme instellingen altijd ook met een modulator.

Wat het apparaat met een state doet (getest):
- Getallen buiten het bereik worden afgekapt (`cut: 1e9` wordt 5000); een tekst of ontbrekende waarde geeft de startwaarde.
- Een ongeldige `wave`, `bars`, `oct` of `seqOn` geeft de startwaarde.
- In `grid` worden noten buiten 0 … 12 afgekapt, accent en slide tot 0 of 1, en octaaf tot −2 … 2. Een ontbrekende set is leeg.
- Onbekende velden worden genegeerd. Zet er geen in.

## Een tune

Een pack heet `naam.patchkamer-tunes.json` en staat in `../../../tunes/`. Het formaat en de licentie (`CC0-1.0` voor alles in `tunes/`) staan in `../../../tunes/AGENTS.md`. Voor dit apparaat is `device` altijd `nl.patchkamer.acidbaselines` en elke tune is `kind: "set"` met een volledige `state` als hierboven. Zet geen merknamen van bestaande apparatuur in naam of omschrijving, en verzin geen persoon bij `author`.

Geef elke tune een eigen `grid` met een lijn die bij de klank past. Is de lijn niet het punt, laat `grid` dan weg: het apparaat gebruikt dan de twee startlijnen.

## Controleren

- Draai vanuit de root van de repo: `node contract/validate-instrument.mjs devices/synths/AcidBaselines/acid-baselines.patchkamer-device.js` (en met `--lang en`). Dat moet `OK` geven, zonder `let op`.
- Je kunt niet horen hoe een tune klinkt. Heb je een browser, laad dan de host (`../../../patchkamer/AGENTS.md`) en kies de tune. Heb je geen browser, schrijf dan in je oplevering dat de tune **niet beluisterd** is.
- Alle tekst in het apparaat staat in het woordenboek `EN` bovenin het bestand (Nederlandse bron, Engels via `host.lang`). Een nieuwe tekst krijgt altijd nl én en.

## Wat je niet doet

- Verander nooit de `id`, de `kind`, de poort-id's of de namen van state-velden.
- Pas het apparaat niet aan om een tune te laten kloppen.
- Commit of push niet, tenzij de opdracht dat vraagt.

## Documentatie en songs

Dit zijn de plaatsen waar je terechtkunt voor documentatie en voor het componeren van songs met dit apparaat. Songs zijn CC-BY-4.0, tunes en presets CC0-1.0, het apparaat AGPL-3.0-or-later.

- Handleiding van Acid Baselines: [NL](../../../docs/synths/USER-MANUAL_NL.md#acid-baselines) · [EN](../../../docs/synths/USER-MANUAL_EN.md#acid-baselines).
- Overzicht van de soort: [README](../README.md); handleiding van de hele soort: [NL](../../../docs/synths/USER-MANUAL_NL.md) · [EN](../../../docs/synths/USER-MANUAL_EN.md).
- Tunes (klanken, `kind: set`): [acid-baselines-classics.patchkamer-tunes.json](../../../tunes/acid-baselines-classics.patchkamer-tunes.json). Kies een tune als beginpunt voor de `state` van dit apparaat in de song; velden die de tune niet noemt krijgen hun standaard. Hoe tunes zijn opgebouwd: [tunes/AGENTS.md](../../../tunes/AGENTS.md).
- Overzicht van alle apparaten en hun signaalketens: [devices/AGENTS.md](../../../devices/AGENTS.md). Een song componeren: [songs/AGENTS.md](../../../songs/AGENTS.md).
- Route voor agents: [soort Synths](../AGENTS.md) → [devices/AGENTS.md](../../AGENTS.md) → [root AGENTS.md](../../../AGENTS.md). Contract: [NL](../../../contract/PATCHKAMER-CONTRACT_NL.md) · [EN](../../../contract/PATCHKAMER-CONTRACT_EN.md). Hoe tunes van dit apparaat zijn opgebouwd: [tunes/AGENTS.md](../../../tunes/AGENTS.md). <!-- agents-tree -->
- Rol in een song: bas (en lead) in acid-stijl. Noten en `cc` gaan naar de eventingangen `notes` en `cc`; audio uit `out`. Het apparaat heeft geen eigen patroon, dus zet er een sequencer voor.
