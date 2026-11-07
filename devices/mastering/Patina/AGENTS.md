# AGENTS.md: Patina

Dit bestand is voor AI-agents die **presets voor Patina** maken of het apparaat configureren. Het is niet geschreven voor mensen. Het hoort bij `../../../AGENTS.md` (algemeen) en `../../../presets/AGENTS.md` (regels voor presetpacks, als die er is); lees die eerst. Hier staat wat alleen voor Patina geldt.

## Wat Patina is

Een subtiele harmonische saturatie (tape, buis of neutraal zacht) met ADAA-aliasreductie, laagbescherming, gaincompensatie en een parallelmix. Het apparaat hoort bij de mastering-apparaten (`devices/mastering/`): ze delen één motor (eigen stereo-DSP in een AudioWorklet, met een terugval in de pagina) en praten met de **Master Director**.

| | |
|---|---|
| Bestand | `patina.patchkamer-device.js` (in deze map) |
| `id` | `nl.patchkamer.patina`. Verander die nooit: daaraan hangen presets en songs van gebruikers |
| Naam | `Patina` in alle talen; de kaart, de besturingen, de opties, de startprofielen, de meldingen en de poortnamen zijn tweetalig (`host.lang`, `LOC` en `TXT` bovenin) |
| Soort | `effect`: dit apparaat krijgt dus **presets** (geen tunes) |
| Poorten | audio-ingang `in` (Stereo in); audio-uitgang `out` (Stereo uit); mastering-ingang `setup` (Master Director: driehoekpoort voor de gele, gestippelde mastering-kabel van de Master Director) |
| Contract | v1.12 |
| Licentie apparaat | AGPL-3.0-or-later |

Dit apparaat is de nieuwe, bijgewerkte vorm van een ouder bestand met een andere naam en id (Patina, `nl.patchkamer.mastering.sat`). Presets of songs uit die tijd verwijzen naar de oude id en laden hier niet in. Sinds 1.13.0 is de DSP bewust veranderd: Helderheid en Kleur werken hoorbaar en de vaste hoogverzwakking van de ADAA is weg (zie hieronder). De meldingen uit de DSP zijn codes die de kaart vertaalt, en de waarden van de keuze "Doelkarakter" heten Engels (`transparent`, `firm`). Het geluid is dus niet meer sample voor sample gelijk aan het oude bestand; `Mix = 0` en bypass blijven bit-gelijk aan de invoer.

## De state

`getState()` geeft de waarden hieronder plus de werkstand (`bypass`, `match`, `auto`, `amount`, `remote`, `locks`). Een **preset** (`getPreset()`) bevat alleen de klank: dezelfde velden **zonder** `bypass`, `match`, `auto`, `remote` en `locks`, want dat is werkstand en geen klank; `setPreset` laat die staan. Een getal buiten het bereik wordt afgekapt; een tekst, `NaN`, `Infinity` of een ontbrekende waarde geeft de startwaarde; een ongeldige keuze geeft de startwaarde. Onbekende velden worden genegeerd.

| Veld | Naam (nl / en) | Bereik | Start |
|---|---|---|---|
| `character` | Karakter / Character | `tape` / `tube` / `soft` | `tape` |
| `drive` | Drive / Drive | 0 … 18 dB | 3 |
| `mix` | Mix / Mix | 0 … 1 | 0.28 |
| `color` | Kleur / Color | 0 … 1 | 0.35 |
| `tone` | Helderheid / Brightness | 0 … 1 | 0.65 |
| `protect` | Laagbescherming / Low protection | 0 … 1 | 0.7 |
| `compensate` | Gaincompensatie / Gain compensation | `true` of `false` | `true` |
| `trim` | Uitgangstrim / Output trim | -12 … 6 dB | 0 |
| `amount` | Auto-/voorstelsterkte / Auto / suggestion strength | 0 … 1 | 0,7 |

Startprofielen in de kaart (keuzelijst "Startprofiel"): `Subtle`, `Tape warmth`, `Soft tube`, `Parallel character`. Ze zetten een paar waarden; ze zijn geen apart veld in de state.

## Wat Helderheid en Kleur doen (1.13.0)

Beide werken op het natte pad, vóór het mengen, en schalen dus met `mix`.

- `tone` (Helderheid): hoge plank bij 3,5 kHz op het natte pad, -9 dB bij 0, 0 dB (neutraal) bij 0,65 (de start), +6 dB bij 1. Op roze ruis (drive 6, mix 0,3) is het verschil tussen tone 0 en 1 ongeveer 4 dB in 6 tot 20 kHz.
- `color` (Kleur): (1) even-harmonische asymmetrie: een bias van `color` x 0,45 (tube), x 0,28 (tape) of x 0,12 (soft) in de saturatie (tweede harmonische bij 1 kHz, drive 6, -14 dB invoer: tape -36 dB bij 0,35 en -28 dB bij 1, tube -32 en -24, soft -43 en -35; bij 0 geen tweede harmonische); (2) een warmtebel bij 250 Hz op het natte pad van +10 dB (tape), +9 (tube) of +7 dB (soft) bij `color` 1. Verschil `color` 0 tegen 1 op roze ruis (drive 6, mix 0,3): 3,7 dB (tape), 3,3 dB (tube) en 2,4 dB (soft) in 150 tot 400 Hz.
- Het lineaire pad is vlak: met `mix` 1, `drive` 0, `color` 0 en `tone` 0,65 is de versterking van 1 kHz tot 20 kHz gelijk (afwijking < 0,05 dB). Voor 1.13.0 was die -2 dB bij 10 kHz, -5 dB bij 15 kHz en -12 dB bij 20 kHz, doordat de eerste-orde ADAA twee samples middelde.

## Wat het apparaat met een state doet (getest)

- `setState({})` geeft alle startwaarden; `setState(getState())` geeft dezelfde state terug.
- Getallen buiten het bereik worden afgekapt, ongeldige waarden krijgen de standaard.
- Extreme instellingen (alles op het minimum of maximum) en een burst van `NaN`, `±Infinity` en 1e9 op de ingang geven geen niet-eindige samples en het geluid komt daarna terug.
- De Master Director zet via `configureMastering` echte instellingen; een vergrendelde besturing (`locks`) wordt overgeslagen.

## Presets maken

- Een pack heet `<naam>.patchkamer-presets.json` en staat in `../../../presets/` (licentie `CC0-1.0`); `device` is `nl.patchkamer.patina`, elke preset is `kind: "set"`. Gebruik formaat 2 (`formatVersion: 2`, zie een bestaand pack in `../../../presets/`).
- Gebruik precies de sleutels hierboven, met waarden binnen het bereik. Zet **geen** `bypass`, `match`, `auto`, `remote` of `locks` in een preset.
- Geef elke preset een Engelse naam, zonder merk- of modelnamen. Mappen: `Situations` (club, festival, big room, thuis, koptelefoon, studio, radio, auto, streaming), `Styles` (muziekstijlen) en één map per situatie met veelvoorkomende combinaties.
- Het pack voor dit apparaat is gegenereerd door een eigen generator (`patina.py`: stijl × situatie, met waarden voor karakter, drive, mix, kleur, helderheid en laagbescherming) en daarna per preset in niveau gekalibreerd met `trim` (|dRms| < 1 dB op loop en roze ruis). Dit zijn eigen Patina-waarden, geen kopie van de Director-recepten; verander je het geluid van het apparaat, kalibreer `trim` dan opnieuw.

## Controleren

- `node contract/validate-instrument.mjs devices/mastering/Patina/patina.patchkamer-device.js --lang nl` en `--lang en`, vanuit de root. Beide moeten `OK` geven, zonder `let op`.
- Je kunt niet horen hoe een preset klinkt. Schrijf in je oplevering dat het **niet beluisterd** is.
- Alle tekst in het apparaat staat in `TXT` en `LOC` bovenin het bestand (Nederlands en Engels). Een nieuwe tekst krijgt altijd nl én en.

## Documentatie en songs

Dit zijn de plaatsen waar je terechtkunt voor documentatie en voor het componeren van songs met dit apparaat. Songs zijn CC-BY-4.0, tunes en presets CC0-1.0, het apparaat AGPL-3.0-or-later.

- Handleiding van Patina: [NL](../../../docs/mastering/USER-MANUAL_NL.md#patina) · [EN](../../../docs/mastering/USER-MANUAL_EN.md#patina).
- Overzicht van de soort: [README](../README.md); handleiding van de hele soort: [NL](../../../docs/mastering/USER-MANUAL_NL.md) · [EN](../../../docs/mastering/USER-MANUAL_EN.md).
- Presets (instellingen, `kind: set`): [patina.patchkamer-presets.json](../../../presets/patina.patchkamer-presets.json). Kies een preset als beginpunt voor de `state` van dit apparaat in de song; velden die de preset niet noemt krijgen hun standaard.
- Overzicht van alle apparaten en hun signaalketens: [devices/AGENTS.md](../../../devices/AGENTS.md). Een song componeren: [songs/AGENTS.md](../../../songs/AGENTS.md).
- Rol in een song: mastering, subtiele harmonische saturatie op de eindmix. Audio in `in`, uit `out`; `setup` ontvangt de mastering-kabel van de Master Director.
