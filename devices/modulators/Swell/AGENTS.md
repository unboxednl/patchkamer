# AGENTS.md: Swell

Dit bestand is voor AI-agents die dit apparaat configureren of er presets voor maken. Het is niet geschreven voor mensen. Het hoort bij `../../../AGENTS.md` (algemeen); lees die eerst. Hier staat wat alleen voor Swell geldt.

## Wat Swell is

Een modulator voor trage, samenhangende sfeerbeweging: een deining. Swell maakt geen geluid en heeft geen audio of events. Het berekent vier gekoppelde banen (**Breath**, **Warmth**, **Space**, **Sway**) uit één trage golf en stuurt daarmee de parameters die je aanvinkt bij een aangesloten apparaat (paarse kabel van `mod` naar de Mod-ingang van een synth of effect). Elke aangevinkte parameter kiest één baan en een bereik (−20 … +20% van het parameterbereik; negatief keert de richting om). Een sfeerprofiel (Calm, Cosy, Closeness, Euphoria) zet golflengte en verhoudingen in één keer. De golf loopt in seconden, of op de maat van de klok (`sync`), en kan alleen lopen terwijl de transportklok speelt (`follow`). De sturing wordt over ongeveer 0,3 s gladgestreken en ongeveer 25 keer per seconde verstuurd.

| | |
|---|---|
| Bestand | `swell.patchkamer-device.js` (in deze map) |
| `id` | `nl.patchkamer.swell`. Verander die nooit: daaraan hangen presets en songs van gebruikers. Het apparaat heette eerst Deining (`nl.patchkamer.deining`); werkruimtes of presets uit die tijd verwijzen naar de oude id en laden hier niet in |
| Naam | `Swell` in alle talen; de UI-teksten staan in het Nederlands en het Engels (woordenboek `EN` bovenin het bestand) |
| Soort | `modulator` (categorie `mod`): Swell krijgt dus **presets** (geen tunes) |
| Poorten | sturingsuitgang `mod` ("Swell"); geen audio, events of sturingsingang |
| Contract | v1.11 |
| Licentie apparaat | AGPL-3.0-or-later |

## Geen tunes, wel presets

Alleen apparaten met `kind: 'instrument'` hebben tunes. Swell is een `modulator`, dus het krijgt **presets** en **nooit tunes** (contract §0 en §13c). Maak voor Swell geen pack in `../../../tunes/`. Een presetpack heet `swell.patchkamer-presets.json` en staat in `../../../presets/`. Formaat:

```json
{ "format": "patchkamer-presets", "formatVersion": 2, "device": "nl.patchkamer.swell", "name": "…", "author": "Freek van Gool", "license": "CC0-1.0",
  "description": "…", "tree": [ { "folder": "…", "items": [ { "name": "…", "kind": "set", "version": "1.0.0", "state": { … } } ] } ] }
```

## De state en wat in een preset hoort

Swell heeft `getPreset`/`setPreset`. `state` van een preset is wat `getPreset()` teruggeeft: **alle velden hieronder behalve `routes`**. `getState()` geeft ook `routes` terug.

| Veld | Wat | Bereik | Start |
|---|---|---|---|
| `profile` | Gekozen sfeer: `rust` (Calm), `geborgen` (Cosy), `nabij` (Closeness) of `euforie` (Euphoria). Alleen een label: de waarden hieronder bepalen de beweging. Kiezen in de UI zet de zes waarden hieronder op het profiel | die vier | `rust` |
| `on` | Beweging aan; uit = neutraal (de doelen krijgen geen sturing) | boolean | `true` |
| `follow` | Alleen bewegen als de transportklok speelt | boolean | `false` |
| `sync` | Golflengte in tellen op de klok in plaats van seconden | boolean | `false` |
| `beats` | Golflengte bij `sync`: aantal tellen (4 = één maat in 4/4) | `4`, `8`, `16`, `32`, `64` of `128` | 32 |
| `period` | Ademgolf: golflengte van de hoofdgolf (Breath) bij `sync` uit | 4 … 120 s | 22 |
| `depth` | Hoeveelheid: schaalt alle vier de banen | 0 … 1 | 0,38 |
| `warmth` | Vaste stand van de baan Warmth: 0,5 is neutraal, hoger = positieve afwijking, lager = negatieve | 0 … 1 | 0,62 |
| `space` | Vaste stand van de baan Space, idem | 0 … 1 | 0,45 |
| `motion` | Hoeveel de banen Warmth, Space en Sway zelf nog meebewegen (en Sway als geheel) | 0 … 1 | 0,22 |
| `human` | Variatie: een tragere, onregelmatige golf over de banen zodat de beweging zich niet precies herhaalt | 0 … 1 | 0,12 |
| `routes` | **Koppelingen met doelen** (zie onder). Hoort niet in een preset | – | `{}` |

`routes`: `{ doelId: { paramId: { on, lane, amount } } }` met `lane` één van `breath`, `warmth`, `space`, `sway` (de sleutels zijn Engels en blijven zo) en `amount` −0,2 … 0,2. `doelId` is een id van een apparaat in de werkruimte van een gebruiker (bijvoorbeeld `d1`), `paramId` komt van het doelapparaat. Daarom zet je `routes` nooit in een preset: de preset zou naar een apparaat of parameter verwijzen die er niet is. Bij het kiezen van een preset blijven de koppelingen van de gebruiker staan (`setPreset` laat `routes` ongemoeid). Een doel dat wordt aangesloten krijgt voorzichtige voorstellen op basis van het parameter-id: `cutoff` (Warmth, −3,5%), `tone`/`color`/`brightness` (Warmth, −6,5%), `wet`/`space`/`dsend`/`chorusmix`/`ensemble` (Space, +4%), `expression` (Breath, +5,5%), `lvl`/`level` (Breath, +1,2%), `pan` (Sway, +2,5%); alle andere parameters staan uit.

### Hoe de banen zich gedragen (voor het kiezen van waarden)

- **Breath** is de hoofdgolf met golflengte `period` (of `beats`), licht vervormd; `human` mengt er een trage zwerving in.
- **Warmth** en **Space** zijn elk een vaste stand (`warmth`/`space` min 0,5, maal 1,15) plus een eigen golf (Warmth ongeveer 3 keer, Space ongeveer 1,6 keer zo langzaam als Breath) waarvan de grootte met `motion` meegroeit, en een deel van de `human`-zwerving. Staat `warmth` op 0,5 dan beweegt de baan alleen rond nul.
- **Sway** is een snellere, zachte golf (periode ongeveer 1,4 × korter dan `period`) die helemaal met `motion` schaalt: `motion` 0 geeft een stille baan.
- Alle banen worden met `depth` vermenigvuldigd en afgekapt op −1 … +1; daarna met het bereik van de koppeling (maximaal 0,2).
- Een totale uitslag van een parameter is dus klein: bij `depth` 0,5 en een koppeling van 4% beweegt de parameter ongeveer ±2% van zijn bereik.

### Wat een goede instelling is

- **Ambient, pads, drones**: `period` 30 … 110 s, `depth` 0,25 … 0,5, `motion` 0,1 … 0,35, `human` 0,15 … 0,5. Echt langzaam is hier het karakter; ga niet onder 20 s.
- **Warm en dichtbij** (strijkers, keys, stem): `period` 10 … 28 s, `warmth` 0,7 … 0,85 (de filters gaan langzaam dicht en open), `space` 0,2 … 0,4.
- **Open en euforisch**: `period` 5 … 20 s, `space` 0,6 … 0,9, `motion` 0,4 … 0,8.
- **Op tempo** (`sync` en `follow` aan): kies `beats` bij het stuk: 16 (vier maten) voor een frase, 32 … 128 voor een lange opbouw. `period` wordt dan niet gebruikt. Zet `follow` aan als de beweging bij Stop moet blijven staan.
- **Subtiel**: `depth` 0,1 … 0,25. Dit is de bedoelde standaard voor lopende muziek: de luisteraar hoort verandering, geen effect.
- **Groot en expressief** (opbouw, filmisch): `depth` 0,7 … 1, een lange `period` (30 … 60 s) voor opbouw of een korte (6 … 12 s) voor een rollende golf. Combineer dit met een klein koppelingsbereik van de gebruiker.
- **Generatief**: `human` 0,6 … 1 en `motion` 0,5 … 0,9 maken de beweging onvoorspelbaar; houd `period` hoog (70 … 110 s).

Een preset hoort een **herkenbare beweging** te geven, geen vaste waarde: gebruik dus ook voor Warmth en Space bewust verschillende standen, en laat de presets onderling merkbaar verschillen in `period`, `depth` en `motion`. Elke preset heeft de volledige state (zonder `routes`), binnen het bereik, zonder afkappen. Een preset moet bij een aangesloten doel een eindige, niet-constante sturing geven (getest: 55 presets, zie het pack).

## Wat Swell met een state doet (getest)

- Getallen buiten het bereik worden afgekapt; een tekst, `null`, `NaN`, `Infinity` of een ontbrekende waarde geeft de startwaarde. `setState({})` geeft de startwaarden en geen koppelingen.
- `profile` met een onbekende waarde geeft `rust`; `beats` die niet in de lijst staat geeft 32; een booleaanse waarde die geen boolean is geeft de standaard.
- In `routes` worden alleen objecten bewaard; een onbekende `lane` wordt `breath`, een niet-eindige `amount` wordt 0 en wordt afgekapt op −0,2 … 0,2.
- Onbekende velden worden genegeerd. Zet er geen in.
- De knoppen volgen `setState`; `setState(getState())` en `setPreset(getPreset())` geven dezelfde state.
- Koppelingen werken pas als het doelapparaat is aangesloten: de lijst met parameters komt van dat apparaat.
- Elke uitgestuurde waarde is eindig en ligt tussen −1 en +1: een niet-eindige waarde wordt 0, het tempo van de klok wordt begrensd op 1 … 1000 BPM, en een ontspoorde fase wordt teruggezet. De beweging in het normale gebied is bit-identiek aan de oude versie (met een nepdoel en een nepklok vergeleken, zie het rapport van de omzetting).

## Controleren

- `node contract/validate-instrument.mjs devices/modulators/Swell/swell.patchkamer-device.js --lang nl` en `--lang en`, vanuit de root. Beide moeten `OK` geven, zonder `let op`.
- Je kunt niet horen wat een preset met een doel doet. Heb je geen browser, schrijf dan in je oplevering dat de preset **niet beluisterd** is. Meet wel de sturing: sluit een nepdoel aan (`onModTargets` met een lijst parameters), speel de klok met `ctx.currentTime` en lees wat `host.modulate` krijgt.
- Alle tekst in het apparaat staat in het woordenboek `EN` bovenin het bestand (Nederlandse tekst als sleutel, Engelse als waarde). Een nieuwe tekst krijgt altijd nl én en.

## Wat je niet doet

- Verander nooit de `id`, de `kind`, de poort-id's of de namen en waarden van state-velden (`rust`, `geborgen`, `nabij`, `euforie` en de lane-sleutels blijven zo).
- Zet geen `routes` in een preset.
- Pas het apparaat niet aan om een preset te laten kloppen.
- Zet geen merknamen van bestaande apparatuur of software in naam of omschrijving, en verzin geen persoon bij `author`.
- Commit of push niet, tenzij de opdracht dat vraagt.

## Documentatie en songs

Dit zijn de plaatsen waar je terechtkunt voor documentatie en voor het componeren van songs met dit apparaat. Songs zijn CC-BY-4.0, tunes en presets CC0-1.0, het apparaat AGPL-3.0-or-later.

- Handleiding van Swell: [NL](../../../docs/modulators/USER-MANUAL_NL.md#swell) · [EN](../../../docs/modulators/USER-MANUAL_EN.md#swell).
- Overzicht van de soort: [README](../README.md); handleiding van de hele soort: [NL](../../../docs/modulators/USER-MANUAL_NL.md) · [EN](../../../docs/modulators/USER-MANUAL_EN.md).
- Presets (instellingen, `kind: set`): [swell.patchkamer-presets.json](../../../presets/swell.patchkamer-presets.json). Kies een preset als beginpunt voor de `state` van dit apparaat in de song; velden die de preset niet noemt krijgen hun standaard.
- Overzicht van alle apparaten en hun signaalketens: [devices/AGENTS.md](../../../devices/AGENTS.md). Een song componeren: [songs/AGENTS.md](../../../songs/AGENTS.md).
- Rol in een song: sturing, trage samenhangende sfeerbeweging (vier gekoppelde banen: Breath, Warmth, Space, Sway) uit één trage golf. Uitgang `mod` naar de doelen; maakt geen geluid en heeft geen audio of events.
