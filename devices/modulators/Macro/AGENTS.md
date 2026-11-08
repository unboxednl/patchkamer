# AGENTS.md: Macro

Dit bestand is voor AI-agents die dit apparaat configureren of er presets voor maken. Het is niet geschreven voor mensen. Het hoort bij `../../../AGENTS.md` (algemeen); lees die eerst. Hier staat wat alleen voor Macro geldt.

## Wat Macro is

Een modulator met vier knoppen (M1 … M4). Elke knop draait een groep parameters tegelijk, ook van verschillende apparaten. Per parameter van een aangesloten doel kies je welke knop hem stuurt (M1 … M4) en hoe ver (diepte −100 … +100% van het bereik van die parameter). Is de parameter snel stuurbaar (⚡), dan loopt de sturing sample-nauwkeurig via een audiosignaal, anders ongeveer 30 keer per seconde. Een knop is unipolair (0 … 1) of bipolair (de knopstand 50% is de middenstand: eronder negatief, erboven positief, −1 … +1). De vier knoppen zijn ook van buiten te bedienen via de eventingang `cc`. Macro maakt zelf geen geluid.

| | |
|---|---|
| Bestand | `macro.patchkamer-device.js` (in deze map) |
| `id` | `nl.patchkamer.macro`. Verander die nooit: daaraan hangen presets en songs van gebruikers |
| Naam | `Macro` in alle talen; de poortnamen hebben een Engelse variant via `i18n` (ze zijn in beide talen gelijk) |
| Soort | `modulator` (categorie `mod`): Macro krijgt dus **presets** (geen tunes) |
| Poorten | eventingang `cc` ("CC"), sturingsuitgang `mod` ("Macro"); geen audio |
| Contract | v1.11 |
| Licentie apparaat | AGPL-3.0-or-later |

## Geen tunes, wel presets

Alleen apparaten met `kind: 'instrument'` hebben tunes. Macro is een `modulator`, dus het krijgt **presets** en **nooit tunes** (contract §0 en §13c). Maak voor Macro geen pack in `../../../tunes/`. Een presetpack heet `macro.patchkamer-presets.json` en staat in `../../../presets/`; het formaat is dat van het contract (§13c), `formatVersion` 2, licentie `CC0-1.0`, `device` is altijd `nl.patchkamer.macro` en elke preset is `kind: "set"`.

## De state en wat in een preset hoort

`getState()` geeft vijf velden; `getPreset()` geeft er vier (zonder `sel`). De `state` van een preset is wat `getPreset()` teruggeeft.

| Veld | Wat | Bereik | Start | In preset |
|---|---|---|---|---|
| `v` | Knopstanden van M1 … M4: lijst van 4 getallen | elk 0 … 1 | `[0,0,0,0]` | ja |
| `names` | Namen van de knoppen (alleen een label in de UI): lijst van 4 teksten | elk maximaal 24 tekens | `["Macro 1","Macro 2","Macro 3","Macro 4"]` | ja |
| `bip` | Bipolair per knop: lijst van 4 booleans | `true` of `false` | `[false,false,false,false]` | ja |
| `glide` | Glijtijd van de knopstand naar de uitgang (alle vier) | 0 … 2 seconde | 0,05 | ja |
| `sel` | Toewijzingen: `{ doelId: { paramId: { d, s } } }` met diepte `d` (−1 … 1) en bron `s` (`m1` … `m4`) | – | `{}` | **nee** |

De uitgestuurde waarde van knop *i* is `v[i]` (unipolair, 0 … 1) of `v[i] * 2 − 1` (bipolair, −1 … 1), vermenigvuldigd met de diepte `d` van de toewijzing.

### Toewijzingen (`sel`) horen niet in een preset

`sel` verwijst met `doelId` en `paramId` naar apparaten en parameters in één werkruimte. Die zijn niet portabel: een andere werkruimte heeft andere doelen, en een preset met een route naar een apparaat dat er niet is, doet niets of stuurt de verkeerde parameter. Macro heeft daarom `getPreset`/`setPreset`: `getPreset()` laat `sel` weg en `setPreset(p)` laat de toewijzingen van het exemplaar staan. Zet dus **nooit** `sel` in een preset en maak geen preset met routes. Een preset bevat alleen: de knopstanden (`v`), de namen (`names`), welke knoppen bipolair zijn (`bip`) en de glijtijd (`glide`). De gebruiker kiest zelf welke parameters elke knop stuurt; de namen in een preset zijn de aanwijzing waarvoor de knop bedoeld is (bijvoorbeeld "Cutoff", "Space").

### CC-nummers

Macro bewaart geen CC-nummers. De eventingang `cc` accepteert `{ type: 'cc', id: 'm1' … 'm4', value: 0 … 1 }` (de id mag ook `macro 1` … `macro 4` zijn, hoofdletters maken niet uit). De waarde is het nieuwe niveau van de knop (0 … 1, daarbuiten afgekapt) en volgt dezelfde glijtijd. Er is dus niets om in een preset op te slaan.

Wat Macro met een state doet (getest):
- Getallen buiten het bereik worden afgekapt (`v` op 0 … 1, `glide` op 0 … 2); een tekst, `null`, `NaN`, `Infinity`, een ontbrekende waarde of een lijst van de verkeerde vorm geeft de startwaarde. Een naam wordt op 24 tekens afgekapt. `setState({})` geeft de startwaarden en lege toewijzingen.
- Een boolean in `bip` met een ongeldige waarde geeft `false`. In `sel` worden alleen eindige dieptes bewaard (afgekapt op −1 … 1); een onbekende bron wordt `m1`.
- Onbekende velden worden genegeerd. Zet er geen in.
- De knoppen, namen, de bipolair-vakjes en de glijtijd volgen `setState`; `setState(getState())` en `setPreset(getPreset())` geven dezelfde state.
- Een CC-gebeurtenis met een waarde die geen eindig getal is (tekst, `NaN`, `Infinity`, `null`) wordt genegeerd.
- Alles wat Macro uitstuurt is eindig en ligt tussen −1 en 1.
- Toewijzingen werken pas als het doelapparaat is aangesloten (paarse kabel van `mod` naar de Mod-ingang): de lijst met parameters komt van dat apparaat.

## Goede instellingen voor presets

Macro heeft geen eigen ritme of beweging; wat een preset bepaalt is de beginstand, de bipolariteit, de naam en de glijtijd. Wat goed werkt:
- **Namen** die zeggen waarvoor de knop bedoeld is en passen bij het soort opstelling: Intensity, Brightness, Space, Movement; Cutoff, Resonance; Wet, Dry; Build, Tension; per muziekstijl een eigen set.
- **Beginstand**: een knop die iets opbouwt (een build-up, een riser) begint op 0. Een knop die een basisniveau stelt (een mixbalans, een filter) begint op een gebruikbare stand (0,4 … 0,8). Een bipolaire knop begint in het midden (0,5 = geen verschuiving), tenzij de opstelling bewust een kant op wil.
- **Bipolair** voor wat naar twee kanten kan: een filter dat open of dicht gaat, droog/nat, een pan- of tilt-regeling, een pitchverloop. **Unipolair** voor wat alleen "meer" is: een send, een hoeveelheid, een riser.
- **Glijtijd**: 0,005 … 0,03 voor snel en directe knoppen (live spelen, drops), 0,05 … 0,15 als standaardgevoel, 0,3 … 1 voor zachte overgangen (ambient, lo-fi), tot 2 voor een trage riser of build-up. Met 0 springt de uitgang bijna meteen (alleen een zeer korte afronding van 5 ms).

## Wat een preset niet moet doen

- Geen `sel` en geen routes naar doelen (ze zijn niet portabel en staan niet in `getPreset()`).
- Geen namen langer dan 24 tekens, geen Nederlandse of merkgebonden namen; Engelse, korte namen.
- Geen bijna-dubbelen: twee presets met alleen een ander naampje zijn geen twee presets.
- Geen knoppen op 1 (of bipolair op 0 of 1) als beginstand, tenzij de opstelling dat bewust wil; een knop die al vol staat laat geen ruimte om te draaien.

## Controleren

- `node contract/validate-instrument.mjs devices/modulators/Macro/macro.patchkamer-device.js --lang nl` en `--lang en`, vanuit de root. Beide moeten `OK` geven, zonder `let op`.
- Je kunt niet horen hoe een preset klinkt of hoe de sturing aanvoelt. Heb je geen browser, schrijf dan in je oplevering dat de preset **niet beluisterd** is.
- Alle tekst in het apparaat staat in het woordenboek `EN` bovenin het bestand (Nederlandse tekst als sleutel, Engelse als waarde). Een nieuwe tekst krijgt altijd nl én en.

## Wat je niet doet

- Verander nooit de `id`, de `kind`, de poort-id's of de namen en waarden van state-velden.
- Zet geen toewijzingen (`sel`) in een preset.
- Zet geen merknamen van bestaande apparatuur of software in naam, omschrijving of commentaar, en verzin geen persoon bij `author`.
- Commit of push niet, tenzij de opdracht dat vraagt.

## Documentatie en songs

Dit zijn de plaatsen waar je terechtkunt voor documentatie en voor het componeren van songs met dit apparaat. Songs zijn CC-BY-4.0, tunes en presets CC0-1.0, het apparaat AGPL-3.0-or-later.

- Handleiding van Macro: [NL](../../../docs/modulators/USER-MANUAL_NL.md#macro) · [EN](../../../docs/modulators/USER-MANUAL_EN.md#macro).
- Overzicht van de soort: [README](../README.md); handleiding van de hele soort: [NL](../../../docs/modulators/USER-MANUAL_NL.md) · [EN](../../../docs/modulators/USER-MANUAL_EN.md).
- Presets (instellingen, `kind: set`): [macro.patchkamer-presets.json](../../../presets/macro.patchkamer-presets.json). Kies een preset als beginpunt voor de `state` van dit apparaat in de song; velden die de preset niet noemt krijgen hun standaard.
- Overzicht van alle apparaten en hun signaalketens: [devices/AGENTS.md](../../../devices/AGENTS.md). Een song componeren: [songs/AGENTS.md](../../../songs/AGENTS.md).
- Route voor agents: [soort Modulators](../AGENTS.md) → [devices/AGENTS.md](../../AGENTS.md) → [root AGENTS.md](../../../AGENTS.md). Contract: [NL](../../../contract/PATCHKAMER-CONTRACT_NL.md) · [EN](../../../contract/PATCHKAMER-CONTRACT_EN.md). Hoe presets van dit apparaat zijn opgebouwd: [presets/AGENTS.md](../../../presets/AGENTS.md). <!-- agents-tree -->
- Rol in een song: sturing, vier knoppen (M1 … M4) die elk een groep parameters van verschillende apparaten tegelijk draaien; handig voor een opbouw of break met één beweging. Uitgang `mod` naar de doelen; de eventingang `cc` accepteert `{ type: 'cc', id: 'm1' … 'm4', value: 0 … 1 }`.
