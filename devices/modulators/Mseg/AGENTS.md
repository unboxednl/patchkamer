# AGENTS.md: Multi-Segment Envelope

Dit bestand is voor AI-agents die dit apparaat configureren of er presets voor maken. Het is niet geschreven voor mensen. Het hoort bij `../../../AGENTS.md` (algemeen); lees die eerst. Hier staat wat alleen voor Multi-Segment Envelope geldt.

## Wat het is

Een modulator met één zelf getekende curve (multi-segment envelope, afgekort MSEG) over 1 tot 64 maten. De curve bestaat uit punten (`x` = plek in de curve, `y` = waarde −1 … +1) met per stuk lijn een kromming. De curve loopt **herhalend** (loop, vast aan de maat van de klok, dus altijd synchroon met het nummer) of **één keer** vanaf Start van de klok of een trigger op de eventingang. Per doelparameter van een ander apparaat kies je de diepte (−100 … +100% van het bereik van die parameter). Is de parameter snel stuurbaar (⚡), dan loopt de sturing sample-nauwkeurig via een audiosignaal, anders ongeveer 30 keer per seconde. Het apparaat maakt zelf geen geluid.

| | |
|---|---|
| Bestand | `mseg.patchkamer-device.js` (in deze map) |
| `id` | `nl.patchkamer.mseg`. Verander die nooit: daaraan hangen presets en songs van gebruikers |
| Naam | `Multi-Segment Envelope` in alle talen; de poortnamen zijn `Trigger` en `Curve` |
| Soort | `modulator` (categorie `mod`): dit apparaat krijgt dus **presets** (geen tunes) |
| Poorten | eventingang `trig` ("Trigger", start de curve in de stand één keer), sturingsuitgang `mod` ("Curve"). Geen audio |
| Contract | v1.11 |
| Licentie apparaat | AGPL-3.0-or-later |
| Presetpack | `../../../presets/mseg.patchkamer-presets.json` ("Multi-Segment Envelope Presets", 54 presets) |

## Geen tunes, wel presets

Alleen apparaten met `kind: 'instrument'` hebben tunes. Dit apparaat is een `modulator` en krijgt **presets** en **nooit tunes** (contract §0 en §13c). Een presetpack heet `mseg.patchkamer-presets.json` en staat in `../../../presets/`; formaat contract §13c, `formatVersion` 2, licentie `CC0-1.0`, `device` is `nl.patchkamer.mseg`, elke preset is `kind: "set"`.

## De state

`getState()` geeft alle velden hieronder. `getPreset()` geeft dezelfde velden **zonder `sel`**: toewijzingen horen bij de werkruimte (welke doelen er aan hangen), niet bij een preset. `state` van een preset is dus wat `getPreset()` teruggeeft. `setPreset(p)` laat de huidige toewijzingen staan.

| Veld | Wat | Bereik | Start |
|---|---|---|---|
| `pts` | De punten van de curve, van links naar rechts: lijst van `{ x, y, c }` | zie onder | de curve "Opbouw" (4 punten) |
| `len` | Lengte van de curve in maten (een maat = 4 tellen) | `1`, `2`, `4`, `8`, `16`, `32` of `64` | 16 |
| `mode` | `loop` herhaalt aan de maat van de klok; `once` loopt één keer vanaf Start of Trigger en blijft daarna op de eindwaarde staan | `loop` of `once` | `loop` |
| `snap` | Alleen voor het tekenen met de muis: raster van 1/16 (tijd) en achtsten (hoogte). Heeft geen invloed op de sturing | boolean | `true` |
| `amp` | Sterkte: schaalt de hele curve (`y × amp`) | 0 … 1 | 1 |
| `sel` | Toewijzingen: `{ doelId: { paramId: { d, s } } }` met diepte `d` (−1 … 1) en bron `s` (altijd `mseg`) | – | `{}` |

**De punten (`pts`).**
- Een punt is `{ x, y, c }`: `x` is de plek in de hele curve (0 = begin, 1 = einde, dus `len` maten breed), `y` de waarde (−1 … +1) en `c` de kromming van het stuk lijn dat **bij dit punt begint** en naar het volgende punt loopt (−1 … +1).
- `c` = 0 is een rechte lijn; `c` > 0 begint langzaam en versnelt (exponentieel, "traag weg, snel aan"); `c` < 0 begint snel en vlakt af (een uitloop of verval). `c` = ±0,3 is merkbaar, ±0,6 duidelijk, ±1 extreem. De kromming van het laatste punt doet niets.
- Het eerste punt staat op `x = 0`, het laatste op `x = 1`; `setState` zet dat zelf goed. Punten staan op volgorde van `x`. Er zijn minstens 2 en hoogstens 256 punten.
- **Een sprong** maak je met twee punten op **dezelfde `x`** met een andere `y` (het tweede punt geeft de waarde na de sprong). Zo bouw je een trap, een gate of een zaagtand. De sprong zelf duurt een paar milliseconden (de sturing wordt 400 keer per seconde bemonsterd).
- **Let op het einde:** op `x = 1` zelf is de waarde die van het eerste punt dat op `x = 1` staat; een sprong precies op het einde wordt dus nooit uitgevoerd (in een loop is `x = 1` ook meteen weer `x = 0`). Wil je dat een curve na een opbouw naar 0 valt, zet de sprong dan een klein stukje vóór het einde (bijvoorbeeld op `1 − 1/(len × 64)`) en laat de curve daarna op 0 eindigen.
- `x` en `y` worden bewaard met 5 en 4 decimalen, `c` met 3. Schrijf ze zo, dan komt een preset ongewijzigd terug uit `getPreset()`.

**Wat een curvewaarde doet.** De waarde (−1 … +1, na `amp`) wordt met de diepte van de toewijzing vermenigvuldigd en **opgeteld bij de knopstand** van de doelparameter, als deel van het bereik van die knop. 0 = geen verandering; de knopstand van het doel is dus de rustwaarde. Een curve die onderaan op 0 rust en omhoog gaat ("unipolair", zoals een riser, een gate of een puls) werkt met een positieve diepte; een curve die rond 0 beweegt (een sweep, ademen, een golf) loopt aan beide kanten van de knopstand. Een negatieve diepte keert de curve om.

Wat het apparaat met een state doet (getest):
- Getallen buiten het bereik worden afgekapt. Een tekst, `null`, `NaN`, `Infinity` of een ontbrekende waarde geeft de startwaarde (ook bij `len`, `amp`, `mode`, `snap`). `setState({})` geeft de startwaarden.
- Een punt met een `x` of `y` die geen eindig getal is, wordt weggelaten; een ongeldige `c` wordt 0. Blijven er minder dan 2 punten over, dan komt de startcurve. Meer dan 256 punten worden afgekapt (het laatste punt blijft).
- Een `len` die niet in de lijst staat, geeft 16. Een onbekende `mode` geeft `loop`.
- In `sel` worden alleen eindige dieptes bewaard (afgekapt op −1 … 1); een onbekende bron wordt `mseg`. Onbekende velden worden genegeerd.
- De knoppen (lengte, afspelen, sterkte, raster) volgen `setState`; `setState(getState())` en `setPreset(getPreset())` geven dezelfde state.
- Toewijzingen in `sel` werken pas als het doel is aangesloten (paarse kabel van `mod` naar de Mod-ingang): de lijst met parameters komt van dat apparaat.

Wat het apparaat doet met onzinwaarden (getest): een ongeldig tempo of tijdstip van de klok (`NaN`, `Infinity`, negatief, 0), een ontbrekend `onStep`/`onTransport`-argument, een gebeurtenis zonder geldige tijd en een curve met ongeldige punten kunnen de uitvoer niet vergiftigen: elke uitgestuurde waarde is eindig en ligt in −1 … +1.

## Wat een preset hier betekent

Een preset is een getekende curve plus lengte, afspeelstand en sterkte. De doelen en de diepte kiest de gebruiker in de toewijzingslijst; die horen niet in een preset. Goede keuzes:

- **Lengte past bij het doel.** 1 maat voor ritme (gates, plucks, ratchets, pompen, patronen); 2 of 4 maten voor sweeps, golven en ademen; 8 tot 16 maten voor opbouwen en trage sweeps; 32 en 64 maten voor ambient, drift en een opbouw over een hele sectie.
- **Eenmalig (`once`) voor wat één keer gebeurt:** opbouwen, drops, een tape stop, een fade. Laat zo'n curve op 0 (de rustwaarde) eindigen als hij daarna uit moet, of op 1 of −1 als het doel open of dicht moet blijven. Herhalend (`loop`) voor alles wat bij het ritme hoort.
- **Ritme:** een curve van één maat met trapjes, gates of een verval per stap (zaagtand met `c` < 0) levert gates, pompen, plucks en patronen; een tweede maat met een variatie maakt het levendiger. Voor een gate: `y` 0 en 1 met sprongen; voor een pomp (sidechain) een sprong naar −1 op elke tel met een verval terug naar 0.
- **Sweeps en beweging:** een lange, rustige curve met kromming (`c` ±0,3 … 0,6) en liefst een zachte top. Een zaagtand (twee punten, `loop`) is een sweep die elke 2 tot 8 maten opnieuw begint; een driehoek of een sinusachtige curve (punten op kwarten met `c` ±0,45) gaat heen en weer.
- **Ademen en swells:** langzaam omhoog (`c` > 0), korter of sneller terug, `amp` rond 0,6 … 0,8, zodat de beweging subtiel blijft.
- **Diepte gematigd:** de curve loopt altijd het volle bereik −1 … +1. Zet de sterkte (`amp`) lager als de curve bedoeld is voor een subtiele beweging, en wijs in een preset nooit zelf een grote diepte op toonhoogte toe (de toewijzing zit niet in de preset).
- **Genereren in code:** schrijf de punten met een klein script en rond af zoals boven. Controleer dat elke preset eindig en beweeglijk is en dat er geen twee op elkaar lijken (zie "Controleren").

Wat een preset niet doet: toewijzingen opslaan (`sel`), een tempo bepalen (de curve volgt de klok van de host) of iets starten (in `once` start de gebruiker met Start of een trigger).

## Controleren

- `node contract/validate-instrument.mjs devices/modulators/Mseg/mseg.patchkamer-device.js --lang nl` en `--lang en`, vanuit de root. Beide moeten `OK` geven, zonder `let op`.
- Presetpack: elke preset via `setPreset(state)` en `getPreset()` terug laten komen met dezelfde waarden; daarna met een testdoel en een lopende klok de hele cyclus (`len` maten) bemonsteren: alle waarden eindig, in −1 … +1 en niet constant. Je kunt niet horen of zien hoe een preset op een echt doel uitpakt; schrijf in je oplevering dat het **niet beluisterd** is.
- Alle tekst in het apparaat staat in het woordenboek `EN` bovenin het bestand (Nederlandse tekst als sleutel, Engelse als waarde). Een nieuwe tekst krijgt altijd nl én en.
- Het apparaat stuurt via een timer (30 keer per seconde) en een ConstantSource; de sturing loopt dus ook als de kaart uit beeld is. Alleen het tekenen gaat via `host.frame`.

## Wat je niet doet

- Verander nooit de `id`, de `kind`, de poort-id's of de namen en waarden van state-velden.
- Pas het apparaat niet aan om een preset te laten kloppen.
- Zet geen merknamen van bestaande apparatuur of software in naam of omschrijving, en verzin geen persoon bij `author`.
- Zet geen `sel` in een preset en geen toewijzingen aan doelen die er niet zijn.
- Commit of push niet, tenzij de opdracht dat vraagt.

## Documentatie en songs

Dit zijn de plaatsen waar je terechtkunt voor documentatie en voor het componeren van songs met dit apparaat. Songs zijn CC-BY-4.0, tunes en presets CC0-1.0, het apparaat AGPL-3.0-or-later.

- Handleiding van Multi-Segment Envelope: [NL](../../../docs/modulators/USER-MANUAL_NL.md#multi-segment-envelope) · [EN](../../../docs/modulators/USER-MANUAL_EN.md#multi-segment-envelope).
- Overzicht van de soort: [README](../README.md); handleiding van de hele soort: [NL](../../../docs/modulators/USER-MANUAL_NL.md) · [EN](../../../docs/modulators/USER-MANUAL_EN.md).
- Presets (instellingen, `kind: set`): [mseg.patchkamer-presets.json](../../../presets/mseg.patchkamer-presets.json). Kies een preset als beginpunt voor de `state` van dit apparaat in de song; velden die de preset niet noemt krijgen hun standaard.
- Overzicht van alle apparaten en hun signaalketens: [devices/AGENTS.md](../../../devices/AGENTS.md). Een song componeren: [songs/AGENTS.md](../../../songs/AGENTS.md).
- Route voor agents: [soort Modulators](../AGENTS.md) → [devices/AGENTS.md](../../AGENTS.md) → [root AGENTS.md](../../../AGENTS.md). Contract: [NL](../../../contract/PATCHKAMER-CONTRACT_NL.md) · [EN](../../../contract/PATCHKAMER-CONTRACT_EN.md). Hoe presets van dit apparaat zijn opgebouwd: [presets/AGENTS.md](../../../presets/AGENTS.md). <!-- agents-tree -->
- Rol in een song: sturing, een getekende curve over 1 tot 64 maten (opbouw, sweep, drop). Uitgang `mod` naar het doel; `mode` is `loop` (herhaalt aan de maat van de klok) of `once` (loopt één keer vanaf Start of een trigger op de eventingang `trig`). Maakt geen geluid.
