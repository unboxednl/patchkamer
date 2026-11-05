# AGENTS.md: Stereo Space

Dit bestand is voor AI-agents die **presets voor Stereo Space** maken of het apparaat configureren. Het is niet geschreven voor mensen. Het hoort bij `../../../AGENTS.md` (algemeen) en `../../../presets/AGENTS.md` (regels voor presetpacks, als die er is); lees die eerst. Hier staat wat alleen voor Stereo Space geldt.

## Wat Stereo Space is

Echte twee-kanaals diffusie met vroege reflecties, microvertragingen, beweging, centraal laag en bewaking van de extra breedte. Voor een bredere, omhullende master. Het apparaat hoort bij de mastering-apparaten (`devices/mastering/`): ze delen één motor (eigen stereo-DSP in een AudioWorklet, met een terugval in de pagina) en praten met de **Master Director**.

| | |
|---|---|
| Bestand | `stereo-space.patchkamer-device.js` (in deze map) |
| `id` | `nl.patchkamer.stereospace`. Verander die nooit: daaraan hangen presets en songs van gebruikers |
| Naam | `Stereo Space` in alle talen; de kaart, de besturingen, de opties, de startprofielen, de meldingen en de poortnamen zijn tweetalig (`host.lang`, `LOC` en `TXT` bovenin) |
| Soort | `effect`: dit apparaat krijgt dus **presets** (geen tunes) |
| Poorten | audio-ingang `in` (Stereo in); audio-uitgang `out` (Stereo uit); modulatie-ingang `setup` (Master Director: de paarse kabel van de Master Director) |
| Contract | v1.11 |
| Licentie apparaat | AGPL-3.0-or-later |

Dit apparaat is de nieuwe, bijgewerkte vorm van een ouder bestand met een andere naam en id (Omhulling, `nl.patchkamer.mastering.space`). Presets of songs uit die tijd verwijzen naar de oude id en laden hier niet in. De DSP is sample voor sample gelijk aan het oude bestand (bewezen met een offline render); alleen de meldingen uit de DSP zijn codes geworden die de kaart vertaalt, en de waarden van de keuze "Doelkarakter" heten nu Engels (`transparent`, `firm`).

## De state

`getState()` geeft de waarden hieronder plus de werkstand (`bypass`, `match`, `auto`, `amount`, `remote`, `locks`). Een **preset** (`getPreset()`) bevat alleen de klank: dezelfde velden **zonder** `bypass`, `match`, `auto`, `remote` en `locks`, want dat is werkstand en geen klank; `setPreset` laat die staan. Een getal buiten het bereik wordt afgekapt; een tekst, `NaN`, `Infinity` of een ontbrekende waarde geeft de startwaarde; een ongeldige keuze geeft de startwaarde. Onbekende velden worden genegeerd.

| Veld | Naam (nl / en) | Bereik | Start |
|---|---|---|---|
| `width` | Breedte / Width | 0.5 … 2.2 | 1.35 |
| `depth` | Diepte / Depth | 0 … 1 | 0.4 |
| `fullness` | Volheid / Fullness | 0 … 0.8 | 0.3 |
| `motion` | Beweging / Motion | 0 … 1 | 0.15 |
| `mix` | Mix / Mix | 0 … 1 | 0.25 |
| `bass` | Laaggrens / Bass limit | 60 … 350 Hz | 140 |
| `monoBass` | Laag centraal / Centered bass | `true` of `false` | `true` |
| `guard` | Breedtebewaking / Width guard | `true` of `false` | `true` |
| `amount` | Auto-/voorstelsterkte / Auto / suggestion strength | 0 … 1 | 0,7 |

Startprofielen in de kaart (keuzelijst "Startprofiel"): `Intimate room`, `Wide studio`, `Enveloping cloud`, `Subtle master`. Ze zetten een paar waarden; ze zijn geen apart veld in de state.

## Wat het apparaat met een state doet (getest)

- `setState({})` geeft alle startwaarden; `setState(getState())` geeft dezelfde state terug.
- Getallen buiten het bereik worden afgekapt, ongeldige waarden krijgen de standaard.
- Extreme instellingen (alles op het minimum of maximum) en een burst van `NaN`, `±Infinity` en 1e9 op de ingang geven geen niet-eindige samples en het geluid komt daarna terug.
- De Master Director zet via `configureMastering` echte instellingen; een vergrendelde besturing (`locks`) wordt overgeslagen.

## Presets maken

- Een pack heet `<naam>.patchkamer-presets.json` en staat in `../../../presets/` (licentie `CC0-1.0`); `device` is `nl.patchkamer.stereospace`, elke preset is `kind: "set"`. Gebruik formaat 2 (`formatVersion: 2`, zie een bestaand pack in `../../../presets/`).
- Gebruik precies de sleutels hierboven, met waarden binnen het bereik. Zet **geen** `bypass`, `match`, `auto`, `remote` of `locks` in een preset.
- Geef elke preset een Engelse naam, zonder merk- of modelnamen. Mappen: `Situations` (club, festival, big room, thuis, koptelefoon, studio, radio, auto, streaming), `Styles` (muziekstijlen) en één map per situatie met veelvoorkomende combinaties.
- Het pack voor dit apparaat is gegenereerd uit de recepten van de Master Director (stijl × situatie); wijzig het niet met de hand maar via de generator, anders lopen apparaat en Director uiteen.

## Controleren

- `node contract/validate-instrument.mjs devices/mastering/StereoSpace/stereo-space.patchkamer-device.js --lang nl` en `--lang en`, vanuit de root. Beide moeten `OK` geven, zonder `let op`.
- Je kunt niet horen hoe een preset klinkt. Schrijf in je oplevering dat het **niet beluisterd** is.
- Alle tekst in het apparaat staat in `TXT` en `LOC` bovenin het bestand (Nederlands en Engels). Een nieuwe tekst krijgt altijd nl én en.
