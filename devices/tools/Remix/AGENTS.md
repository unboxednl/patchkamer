# AGENTS.md: Remix

Dit bestand is voor AI-agents die dit apparaat configureren, wijzigen of er presets voor maken. Het is niet geschreven voor mensen. Het hoort bij `../../../AGENTS.md` (algemeen); lees die eerst. Hier staat wat alleen voor Remix geldt.

## Wat Remix is

Een hulpapparaat dat de song van een **Clip Arranger** leest, analyseert en er een remix als **extra song** in zet, of een nieuwe song laat beginnen uit een stijl (bootstrap). Het werkt op noten en clips, **niet op audio**: het hoort niets en kan niet beoordelen hoe het klinkt. Het maakt geen geluid en heeft geen poorten.

| | |
|---|---|
| Bestand | `remix.patchkamer-device.js` (in deze map) |
| `id` | `nl.patchkamer.remix`. Verander die nooit: daaraan hangen presets en songs van gebruikers |
| Naam | `Remix` in alle talen; het apparaat heeft geen poorten, dus geen `i18n` nodig |
| Soort | `utility` (categorie `tool`): Remix krijgt dus **presets** (geen tunes) |
| Poorten | geen |
| Contract | v1.35 (nodig: `host.stateOf` en `host.setStateOf`, §13k) |
| Licentie apparaat | AGPL-3.0-or-later |

## Hoe het werkt

1. **Lezen.** `host.stateOf(this, id)` geeft een kopie van de state van de gekozen Clip Arranger (een peer met `def` `nl.patchkamer.cliparranger`). De formaten staan in [de AGENTS.md van Clip Arranger](../../sequencers/ClipArranger/AGENTS.md#de-state): sporen met een bibliotheek `clips`, scènes als rijen (`cells`), songs als volgorde van secties (`arrangement`), `activeSong`.
2. **Analyseren** (`REMIX.analyze`): per spoor een rol (drums, bas, akkoorden, melodie) uit de naam, de soort, het register en de gelijktijdigheid; de toonsoort met de Krumhansl-Schmuckler-profielen (gewogen op duur en velocity, en op hoe vaak een clip in de song terugkomt); akkoorden per maat door sjabloonherkenning (drie- en vierklanken) met de bas als wortelbonus en een Romeins cijfer in de toonsoort; de energie per sectie en daaruit de rol van elke sectie (intro, couplet, refrein, breakdown, opbouw, outro; scènenamen als Intro, Verse, Chorus, Break gaan voor); de hook als de clip die in de meeste refreinen terugkomt, met een melodische voorkeur; en de hitkenmerken.
3. **Hitkenmerken** (twee profielen). *pop*: duur ≤ 3:30 (de klassieke hitformule voor een dansbare popsingle), eerste refrein ≤ 50 s (een veelgenoemde richtlijn voor popproductie), intro ≤ 20 s, secties een veelvoud van 4 maten, een breakdown tussen de refreinen, een laatste refrein dat dubbel zo lang is, een outro, een hook die terugkomt, akkoorden in de toonladder, tempo ≤ 135 BPM. *club*: duur ≤ 7:00, eerste drop ≤ 2:00, intro ≤ 45 s, secties van 8 maten. Elke bevinding is `ok` (`true`), niet ok (`false`) of neutraal (`null`); de score telt alleen `true` en `false`.
4. **Bouwen** (`REMIX.build`): een kopie van het project krijgt nieuwe **scènes** (rijen die per spoor naar een bestaande of nieuwe clip wijzen), hoogstens een paar nieuwe **clips** en een nieuwe **song** in `songs`. De bron en alle bestaande clips blijven ongewijzigd. De recepten:
   - `hit`: intro (het refrein zonder de hook), couplet, refrein, couplet, refrein, breakdown, dubbel refrein, outro. Past de duur niet in 3:30, dan worden de coupletten en het laatste refrein ingekort.
   - `radio`: dezelfde volgorde met een kortere intro en kortere coupletten, zodat het refrein eerder komt.
   - `club`: DJ-intro met alleen een kick (nieuwe clip), groove, couplet, opbouw (nieuwe clip met een rol), drop, breakdown zonder drums en bas, opbouw, drop, outro, DJ-uitloop; secties van 8, 16 of 32 maten. Nieuwe drumclips volgen de rijen van het drumspoor op nootnummer (36 kick, 38 snare, 39 clap, 42 gesloten hat, 46 open hat, 49 crash).
   - `flip`: het tempo van de song naar een nieuw tempo. Ligt het nieuwe tempo ongeveer een factor 2 hoger of lager, dan worden **alle gebruikte clips ×2 of ÷2 geschaald** (dezelfde bewerking als de knoppen × 2 en ÷ 2 van Clip Arranger) en de secties ×2 of ÷2 in maten, zodat het bij het nieuwe tempo even lang klinkt. Anders blijft alles gelijk en past alleen het tempo. Halveren is verliesgevend voor noten die niet op een halve zestiende vallen; het aantal wordt gemeld.
   - `new`: een nieuwe song uit een stijl (`house`, `pop`, `hiphop`, `disco`, `synthwave`) met toonsoort, akkoordgang per couplet en refrein (trappen van de toonladder), een basritme, een akkoordritme met **stemvoering** (de kleinste beweging van de stemmen), slagwerk per sectie (intro en outro licht, couplet de stijl, refrein plus open hat, crash op maat 1 en een fill op maat 4) en een **hook** van vier maten uit een seed: de eerste noot van elke maat is een akkoordtoon, de beweging gaat voornamelijk met secondes en terts, de hook blijft binnen anderhalf octaaf en eindigt op de grondtoon. Een leeg project (alle clips leeg) krijgt vier sporen Drums, Bass, Chords en Lead; een project met inhoud houdt zijn sporen en krijgt de song erbij (rollen op volgorde van de bestaande sporen).
5. **Schrijven.** `host.setStateOf(this, id, state)` doet `setState` van de Clip Arranger, die zelf zuivert. Dat mag alleen kort na een klik; de knop **Maak remix** is die klik. Remix bewaart de gelezen state in het geheugen voor **Herstel** (niet in `getState`, dus niet in de werkruimte), zet het tempo van de studio terug als het dat zelf had gezet, en laat de gebruiker de remix zien (`host.show`).

De motor (`REMIX`) staat tussen de engine-markeringen bovenin het bestand en is puur: geen host, geen DOM. Zo test je hem zonder browser.

## De state en de preset

`getState()` bevat deze velden. Een preset (`getPreset`/`setPreset`) bevat alles behalve `target` en `song`: de gekozen Clip Arranger en de gekozen bronsong horen bij deze werkruimte.

| Veld | Wat | Bereik | Start | In preset |
|---|---|---|---|---|
| `target` | `id` van de gekozen Clip Arranger op de vloer (leeg = de eerste) | tekst, hoogstens 80 tekens | leeg | nee |
| `recipe` | `hit`, `radio`, `club`, `flip` of `new` | een van die vijf | `hit` | ja |
| `song` | Welke song van de Clip Arranger de bron is | 0 … 15 | 0 | nee |
| `targetBpm` | Nieuw tempo voor `flip` | 40 … 200 | 128 | ja |
| `style` | Stijl voor `new` | `house`, `pop`, `hiphop`, `disco`, `synthwave` | `house` | ja |
| `tonic` | Grondtoon voor `new`, 0 = C … 11 = B; −1 = volgens de stijl | −1 … 11 | −1 | ja |
| `mode` | Toonaard voor `new` | `auto`, `major`, `minor` | `auto` | ja |
| `seed` | Seed voor de hook en de stemvoering van `new`; dezelfde seed geeft dezelfde song | 0 … 999999 | 1 | ja |
| `drums` | Slagwerk bij `hit` en `radio`: `keep` (van de bron) of `club` (vier op de vloer) | `keep`, `club` | `keep` | ja |
| `applyTempo` | Het tempo van de studio meezetten bij `flip` en `new` | aan/uit | aan | ja |

`setState` negeert onbekende velden, geeft een ongeldige of ontbrekende waarde de standaard en klemt getallen binnen het bereik.

## Geen tunes, wel presets

`kind` is `utility`, dus **presets** en **nooit tunes** (contract §0 en §13c). Het pack staat in `../../../presets/remix.patchkamer-presets.json` (`formatVersion` 2, `CC0-1.0`, `device` is `nl.patchkamer.remix`) en heet "Remix Recipes": 21 presets in vier mappen (Hit edits, Club, Tempo flips, New songs). Een preset kiest nooit een Clip Arranger of een bronsong.

## Controleren

- `node contract/validate-instrument.mjs devices/tools/Remix/remix.patchkamer-device.js` in gewoon, met `--lang nl` en `--lang en`: `OK`, zonder `let op`.
- `node devices/tools/Remix/tests/engine.test.mjs`: de motor met een bronsong in A mineur (toonsoort, rollen, akkoorden, hook, secties), de recepten (geldigheid van de state, bron ongewijzigd, gouden volgorde, duur, tempo-rondreis ×2 en ÷2), alle vijf stijlen (alle noten in de toonladder, akkoorden diatonisch, hook eindigt op de grondtoon, bas begint in de wortel, stemvoering, hitscore ≥ 90, zelfde seed = zelfde song) en de grenzen (24 scènes, 48 clips, 16 songs, rommelinvoer).
- In de host (zie `../../../patchkamer/AGENTS.md`): plaats een Clip Arranger, importeer `presets/clip-arranger.patchkamer-presets.json` en kies een preset, plaats Remix, kies een recept en klik **Maak remix**: de nieuwe song staat in de songkeuze van de Clip Arranger en **Herstel** haalt hem weg. Het script `docs/tools/make-remix-result.py` doet dit voor de screenshot.
- **Niet beluisterd.** Of een remix goed klinkt, kan alleen een mens beoordelen. Remix meet structuur, toonsoort en akkoorden, niet geluid. Een hoge hitscore is geen oordeel over de muziek.

## Wat je niet doet

- Verander nooit de `id`, de `kind` of de namen van state-velden.
- Schrijf nooit bij `create`, `mount`, `setState`, `setPreset` of een timer, alleen na een klik (contract §13k).
- Schrijf nooit alles blind terug: Remix begint bij de gelezen state en laat velden die het niet kent staan.
- Pas het apparaat niet aan om een preset te laten kloppen. Zet geen merknamen van bestaande apparatuur in naam, omschrijving of presetnamen, en verzin geen persoon bij `author`.
- Zeg niet dat een remix goed klinkt: Remix kan niet luisteren.
- Commit of push niet, tenzij de opdracht dat vraagt.

## Documentatie en songs

Dit zijn de plaatsen waar je terechtkunt voor documentatie en voor het componeren van songs met dit apparaat. Songs zijn CC-BY-4.0, tunes en presets CC0-1.0, het apparaat AGPL-3.0-or-later.

- Handleiding van Remix: [NL](../../../docs/tools/USER-MANUAL_NL.md#remix) · [EN](../../../docs/tools/USER-MANUAL_EN.md#remix).
- Overzicht van de soort: [README](../README.md); handleiding van de hele soort: [NL](../../../docs/tools/USER-MANUAL_NL.md) · [EN](../../../docs/tools/USER-MANUAL_EN.md).
- Presets (instellingen, `kind: set`): [remix.patchkamer-presets.json](../../../presets/remix.patchkamer-presets.json). Kies een preset als beginpunt voor de `state` van dit apparaat in de song; velden die de preset niet noemt krijgen hun standaard.
- Overzicht van alle apparaten en hun signaalketens: [devices/AGENTS.md](../../../devices/AGENTS.md). Een song componeren: [songs/AGENTS.md](../../../songs/AGENTS.md).
- Route voor agents: [soort Tools](../AGENTS.md) → [devices/AGENTS.md](../../AGENTS.md) → [root AGENTS.md](../../../AGENTS.md). Contract: [NL](../../../contract/PATCHKAMER-CONTRACT_NL.md) · [EN](../../../contract/PATCHKAMER-CONTRACT_EN.md). Hoe presets van dit apparaat zijn opgebouwd: [presets/AGENTS.md](../../../presets/AGENTS.md). <!-- agents-tree -->
- Rol in een song: hulpapparaat op de vloer zonder poorten; een song componeren hoeft het niet. De stijlen en recepten erin (tempo, toonsoort, akkoordgangen, basritme, slagwerk per sectie, structuur) zijn wel een bruikbaar beginpunt voor stap 2 en 3 van [songs/AGENTS.md](../../../songs/AGENTS.md#stap-2-muziekstijl-en-muziektheorie).
