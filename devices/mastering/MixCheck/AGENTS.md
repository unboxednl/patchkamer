# AGENTS.md: Mix Check

Dit bestand is voor AI-agents die **presets voor Mix Check** maken of het apparaat configureren. Het is niet geschreven voor mensen. Het hoort bij `../../../AGENTS.md` (algemeen) en `../../../presets/AGENTS.md` (regels voor presetpacks, als die er is); lees die eerst. Hier staat wat alleen voor Mix Check geldt.

## Wat Mix Check is

Een controle-apparaat dat niets aan het geluid verandert behalve het luisteren: mono, links, rechts, alleen Side, een luistervolume, correlatie, loudness, pieken en een referentie (lokaal bestand of Ref-ingang) met volumematch. Het apparaat hoort bij de mastering-apparaten (`devices/mastering/`): ze delen één motor (eigen stereo-DSP in een AudioWorklet, met een terugval in de pagina) en praten met de **Master Director**.

| | |
|---|---|
| Bestand | `mix-check.patchkamer-device.js` (in deze map) |
| `id` | `nl.patchkamer.mixcheck`. Verander die nooit: daaraan hangen presets en songs van gebruikers |
| Naam | `Mix Check` in alle talen; de kaart, de besturingen, de opties, de startprofielen, de meldingen en de poortnamen zijn tweetalig (`host.lang`, `LOC` en `TXT` bovenin) |
| Soort | `utility`: dit apparaat krijgt dus **presets** (geen tunes) |
| Poorten | audio-ingang `in` (Stereo in); audio-ingang `ref` (Referentie); audio-uitgang `out` (Stereo uit); modulatie-ingang `setup` (Master Director: de paarse kabel van de Master Director) |
| Contract | v1.11 |
| Licentie apparaat | AGPL-3.0-or-later |

Dit apparaat is de nieuwe, bijgewerkte vorm van een ouder bestand met een andere naam en id (Mixcontrole, `nl.patchkamer.mastering.control`). Presets of songs uit die tijd verwijzen naar de oude id en laden hier niet in. De DSP is sample voor sample gelijk aan het oude bestand (bewezen met een offline render); alleen de meldingen uit de DSP zijn codes geworden die de kaart vertaalt, en de waarden van de keuze "Doelkarakter" heten nu Engels (`transparent`, `firm`).

## De state

`getState()` geeft de waarden hieronder plus de werkstand (`bypass`, `match`, `auto`, `amount`, `remote`, `locks`). Een **preset** (`getPreset()`) bevat alleen de klank: dezelfde velden **zonder** `bypass`, `match`, `auto`, `remote` en `locks`, want dat is werkstand en geen klank; `setPreset` laat die staan. Een getal buiten het bereik wordt afgekapt; een tekst, `NaN`, `Infinity` of een ontbrekende waarde geeft de startwaarde; een ongeldige keuze geeft de startwaarde. Onbekende velden worden genegeerd.

| Veld | Naam (nl / en) | Bereik | Start |
|---|---|---|---|
| `monitor` | Monitor / Monitor | `stereo` / `mono` / `left` / `right` / `side` | `stereo` |
| `dim` | Monitor gain / Monitor gain | -24 … 0 dB | 0 |
| `refMatch` | Referentie volumematch / Reference level match | `true` of `false` | `true` |
| `amount` | Auto-/voorstelsterkte / Auto / suggestion strength | 0 … 1 | 0,7 |

Startprofielen in de kaart (keuzelijst "Startprofiel"): `Stereo`, `Mono`, `Check quietly`. Ze zetten een paar waarden; ze zijn geen apart veld in de state.

## Wat het apparaat met een state doet (getest)

- `setState({})` geeft alle startwaarden; `setState(getState())` geeft dezelfde state terug.
- Getallen buiten het bereik worden afgekapt, ongeldige waarden krijgen de standaard.
- Extreme instellingen (alles op het minimum of maximum) en een burst van `NaN`, `±Infinity` en 1e9 op de ingang geven geen niet-eindige samples en het geluid komt daarna terug.
- De Master Director zet via `configureMastering` echte instellingen; een vergrendelde besturing (`locks`) wordt overgeslagen.

## Presets maken

- Een pack heet `<naam>.patchkamer-presets.json` en staat in `../../../presets/` (licentie `CC0-1.0`); `device` is `nl.patchkamer.mixcheck`, elke preset is `kind: "set"`. Gebruik formaat 2 (`formatVersion: 2`, zie een bestaand pack in `../../../presets/`).
- Gebruik precies de sleutels hierboven, met waarden binnen het bereik. Zet **geen** `bypass`, `match`, `auto`, `remote` of `locks` in een preset.
- Geef elke preset een Engelse naam, zonder merk- of modelnamen. Mappen: `Situations` (club, festival, big room, thuis, koptelefoon, studio, radio, auto, streaming), `Styles` (muziekstijlen) en één map per situatie met veelvoorkomende combinaties.
- Het pack voor dit apparaat is gegenereerd uit de recepten van de Master Director (stijl × situatie); wijzig het niet met de hand maar via de generator, anders lopen apparaat en Director uiteen.

## Controleren

- `node contract/validate-instrument.mjs devices/mastering/MixCheck/mix-check.patchkamer-device.js --lang nl` en `--lang en`, vanuit de root. Beide moeten `OK` geven, zonder `let op`.
- Je kunt niet horen hoe een preset klinkt. Schrijf in je oplevering dat het **niet beluisterd** is.
- Alle tekst in het apparaat staat in `TXT` en `LOC` bovenin het bestand (Nederlands en Engels). Een nieuwe tekst krijgt altijd nl én en.
