# AGENTS.md: Balance EQ

Dit bestand is voor AI-agents die **presets voor Balance EQ** maken of het apparaat configureren. Het is niet geschreven voor mensen. Het hoort bij `../../../AGENTS.md` (algemeen) en `../../../presets/AGENTS.md` (regels voor presetpacks, als die er is); lees die eerst. Hier staat wat alleen voor Balance EQ geldt.

## Wat Balance EQ is

Een equalizer met vijf banden (low shelf, drie bells, high shelf) en optionele dynamische banden 2 en 4. Een analyse van acht seconden doet een kleine, voorzichtige correctie als voorstel. Het apparaat hoort bij de mastering-apparaten (`devices/mastering/`): ze delen één motor (eigen stereo-DSP in een AudioWorklet, met een terugval in de pagina) en praten met de **Master Director**.

| | |
|---|---|
| Bestand | `balance-eq.patchkamer-device.js` (in deze map) |
| `id` | `nl.patchkamer.balanceeq`. Verander die nooit: daaraan hangen presets en songs van gebruikers |
| Naam | `Balance EQ` in alle talen; de kaart, de besturingen, de opties, de startprofielen, de meldingen en de poortnamen zijn tweetalig (`host.lang`, `LOC` en `TXT` bovenin) |
| Soort | `effect`: dit apparaat krijgt dus **presets** (geen tunes) |
| Poorten | audio-ingang `in` (Stereo in); audio-uitgang `out` (Stereo uit); mastering-ingang `setup` (Master Director: driehoekpoort voor de gele, gestippelde mastering-kabel van de Master Director) |
| Contract | v1.12 |
| Licentie apparaat | AGPL-3.0-or-later |

Dit apparaat is de nieuwe, bijgewerkte vorm van een ouder bestand met een andere naam en id (Balans EQ, `nl.patchkamer.mastering.eq`). Presets of songs uit die tijd verwijzen naar de oude id en laden hier niet in. De DSP is sample voor sample gelijk aan het oude bestand (bewezen met een offline render); alleen de meldingen uit de DSP zijn codes geworden die de kaart vertaalt, en de waarden van de keuze "Doelkarakter" heten nu Engels (`transparent`, `firm`).

## De state

`getState()` geeft de waarden hieronder plus de werkstand (`bypass`, `match`, `auto`, `amount`, `remote`, `locks`). Een **preset** (`getPreset()`) bevat alleen de klank: dezelfde velden **zonder** `bypass`, `match`, `auto`, `remote` en `locks`, want dat is werkstand en geen klank; `setPreset` laat die staan. Een getal buiten het bereik wordt afgekapt; een tekst, `NaN`, `Infinity` of een ontbrekende waarde geeft de startwaarde; een ongeldige keuze geeft de startwaarde. Onbekende velden worden genegeerd.

| Veld | Naam (nl / en) | Bereik | Start |
|---|---|---|---|
| `f1` | Band 1 frequentie / Band 1 frequency | 25 … 16000 Hz | 90 |
| `g1` | Band 1 gain / Band 1 gain | -12 … 12 dB | 0 |
| `q1` | Band 1 Q / Band 1 Q | 0.3 … 8 | 0.707 |
| `f2` | Band 2 frequentie / Band 2 frequency | 25 … 16000 Hz | 330 |
| `g2` | Band 2 gain / Band 2 gain | -12 … 12 dB | 0 |
| `q2` | Band 2 Q / Band 2 Q | 0.3 … 8 | 1 |
| `f3` | Band 3 frequentie / Band 3 frequency | 25 … 16000 Hz | 1000 |
| `g3` | Band 3 gain / Band 3 gain | -12 … 12 dB | 0 |
| `q3` | Band 3 Q / Band 3 Q | 0.3 … 8 | 0.8 |
| `f4` | Band 4 frequentie / Band 4 frequency | 25 … 16000 Hz | 3300 |
| `g4` | Band 4 gain / Band 4 gain | -12 … 12 dB | 0 |
| `q4` | Band 4 Q / Band 4 Q | 0.3 … 8 | 1 |
| `f5` | Band 5 frequentie / Band 5 frequency | 25 … 16000 Hz | 9500 |
| `g5` | Band 5 gain / Band 5 gain | -12 … 12 dB | 0 |
| `q5` | Band 5 Q / Band 5 Q | 0.3 … 8 | 0.707 |
| `dynamic` | Dynamische banden / Dynamic bands | `true` of `false` | `false` |
| `dynThreshold` | Dynamische threshold / Dynamic threshold | -60 … -6 dB | -30 |
| `dynamicMax` | Maximale dynamische cut / Maximum dynamic cut | 0 … 9 dB | 3 |
| `amount` | Auto-/voorstelsterkte / Auto / suggestion strength | 0 … 1 | 0,7 |

Startprofielen in de kaart (keuzelijst "Startprofiel"): `Neutral`, `Warmer`, `Brighter`, `Gentle dynamics`. Ze zetten een paar waarden; ze zijn geen apart veld in de state.

## Wat het apparaat met een state doet (getest)

- `setState({})` geeft alle startwaarden; `setState(getState())` geeft dezelfde state terug.
- Getallen buiten het bereik worden afgekapt, ongeldige waarden krijgen de standaard.
- Extreme instellingen (alles op het minimum of maximum) en een burst van `NaN`, `±Infinity` en 1e9 op de ingang geven geen niet-eindige samples en het geluid komt daarna terug.
- De Master Director zet via `configureMastering` echte instellingen; een vergrendelde besturing (`locks`) wordt overgeslagen.

## Presets maken

- Een pack heet `<naam>.patchkamer-presets.json` en staat in `../../../presets/` (licentie `CC0-1.0`); `device` is `nl.patchkamer.balanceeq`, elke preset is `kind: "set"`. Gebruik formaat 2 (`formatVersion: 2`, zie een bestaand pack in `../../../presets/`).
- Gebruik precies de sleutels hierboven, met waarden binnen het bereik. Zet **geen** `bypass`, `match`, `auto`, `remote` of `locks` in een preset.
- Geef elke preset een Engelse naam, zonder merk- of modelnamen. Mappen: `Situations` (club, festival, big room, thuis, koptelefoon, studio, radio, auto, streaming), `Styles` (muziekstijlen) en één map per situatie met veelvoorkomende combinaties.
- Het pack voor dit apparaat is gegenereerd uit de recepten van de Master Director (stijl × situatie); wijzig het niet met de hand maar via de generator, anders lopen apparaat en Director uiteen.

## Controleren

- `node contract/validate-instrument.mjs devices/mastering/BalanceEQ/balance-eq.patchkamer-device.js --lang nl` en `--lang en`, vanuit de root. Beide moeten `OK` geven, zonder `let op`.
- Je kunt niet horen hoe een preset klinkt. Schrijf in je oplevering dat het **niet beluisterd** is.
- Alle tekst in het apparaat staat in `TXT` en `LOC` bovenin het bestand (Nederlands en Engels). Een nieuwe tekst krijgt altijd nl én en.

## Documentatie en songs

Dit zijn de plaatsen waar je terechtkunt voor documentatie en voor het componeren van songs met dit apparaat. Songs zijn CC-BY-4.0, tunes en presets CC0-1.0, het apparaat AGPL-3.0-or-later.

- Handleiding van Balance EQ: [NL](../../../docs/mastering/USER-MANUAL_NL.md#balance-eq) · [EN](../../../docs/mastering/USER-MANUAL_EN.md#balance-eq).
- Overzicht van de soort: [README](../README.md); handleiding van de hele soort: [NL](../../../docs/mastering/USER-MANUAL_NL.md) · [EN](../../../docs/mastering/USER-MANUAL_EN.md).
- Presets (instellingen, `kind: set`): [balance-eq.patchkamer-presets.json](../../../presets/balance-eq.patchkamer-presets.json). Kies een preset als beginpunt voor de `state` van dit apparaat in de song; velden die de preset niet noemt krijgen hun standaard.
- Overzicht van alle apparaten en hun signaalketens: [devices/AGENTS.md](../../../devices/AGENTS.md). Een song componeren: [songs/AGENTS.md](../../../songs/AGENTS.md).
- Rol in een song: mastering, toonbalans op de eindmix. Audio in `in`, uit `out`; de gele gestippelde mastering-kabel van de Master Director gaat naar `setup`. Gebruik in de masterketen na de Mixer en vóór Listening Output of Speakers.
