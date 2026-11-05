# AGENTS.md: Drift

Dit bestand is voor AI-agents die dit apparaat configureren of er presets voor maken. Het is niet geschreven voor mensen. Het hoort bij `../../../AGENTS.md` (algemeen); lees die eerst. Hier staat wat alleen voor Drift geldt.

## Wat Drift is

Een modulator die parameters van aangesloten apparaten langzaam rond hun knopstand laat bewegen, zodat een instrument blijft variëren. Drift maakt geen geluid en heeft geen sequencer. Per parameter berekent het een "wind": de som van drie trage, onderling onmeetbare sinussen met periodes van 35 s tot ruim 20 minuten (bij tempo ×1), deterministisch uit een zaad. Daardoor bewegen Drifts met hetzelfde zaad en dezelfde klok exact samen, zonder berichten uit te wisselen. De uitslag is `wind × bereik van de parameter × Drift (sterkte)` en wordt ongeveer 20 keer per seconde verstuurd. De knop van het doel blijft de basis.

| | |
|---|---|
| Bestand | `drift.patchkamer-device.js` (in deze map) |
| `id` | `nl.patchkamer.drift`. Verander die nooit: daaraan hangen presets en songs van gebruikers. Het apparaat heette eerst Drift · modulator (`nl.patchkamer.driftmod`); werkruimtes of presets uit die tijd verwijzen naar de oude id en laden hier niet in |
| Naam | `Drift` in alle talen; de UI-teksten staan in het Nederlands en het Engels (woordenboek `EN` bovenin het bestand), de poortnaam `Volg` heet in het Engels `Follow` (via `i18n`) |
| Soort | `modulator` (categorie `mod`): Drift krijgt dus **presets** (geen tunes) |
| Poorten | sturingsingang `volg` ("Volg" / "Follow": een kabel van de `mod`-uitgang van een andere Drift), sturingsuitgang `mod` ("Drift"); geen audio of events |
| Contract | v1.11 |
| Licentie apparaat | AGPL-3.0-or-later |

## Geen tunes, wel presets

Alleen apparaten met `kind: 'instrument'` hebben tunes. Drift is een `modulator`, dus het krijgt **presets** en **nooit tunes** (contract §0 en §13c). Maak voor Drift geen pack in `../../../tunes/`. Een presetpack heet `drift.patchkamer-presets.json` en staat in `../../../presets/`. Formaat:

```json
{ "format": "patchkamer-presets", "formatVersion": 2, "device": "nl.patchkamer.drift", "name": "…", "author": "Freek van Gool", "license": "CC0-1.0",
  "description": "…", "tree": [ { "folder": "…", "items": [ { "name": "…", "kind": "set", "version": "1.0.0", "state": { … } } ] } ] }
```

## De state en wat in een preset hoort

Drift heeft `getPreset`/`setPreset`. Een preset bevat **alleen de wind**: hoeveel, hoe snel, hoe samenhangend en welk zaad. Hij laat de koppelingen met doelen, de groepsinstelling, de volgwijze, de bevroren sporen en de lopende klokpositie ongemoeid.

`state` van een preset is wat `getPreset()` teruggeeft:

| Veld | Wat | Bereik | Start |
|---|---|---|---|
| `clock.amount` | **Drift**: sterkte, het deel van het bereik van elke parameter (dat bereik staat per parameter in de koppeling, zie onder) | 0 … 1 | 0,6 |
| `clock.speed` | **Tempo van drift**: hoe snel de drifttijd loopt. ×1 = periodes van 35 s tot ruim 20 min; ×4 is vier keer zo snel (9 s … 5 min); ×0,25 vier keer zo langzaam | 0,25 … 32 | 1 |
| `clock.coh` | **Samenhang**: 0 = elke parameter heeft zijn eigen wind; 1 = alle parameters met dezelfde rol (alle filters, alle toonhoogtes…) bewegen samen, ook over sporen en apparaten heen | 0 … 1 | 0,35 |
| `clock.seed` | Zaad van de wind: een ander zaad is een andere, maar even trage beweging. "Nieuwe wind" kiest een willekeurig zaad | geheel getal | willekeurig (0 … 10⁹) |
| `clock.frozen` | Houdt de klok vast: de beweging staat stil op de huidige stand | boolean | `false` |
| `eigen` | **Eigen**: aandeel eigen wind bij een gevolgde of gegroepeerde Drift (mengt de eigen wind door de gedeelde); werkt alleen als de Drift in een groep zit of een master volgt | 0 … 1 | 0 |
| `ownSeed` | Zaad van de eigen wind voor `eigen` | geheel getal | willekeurig (0 … 10⁹) |

`getState()` geeft daarnaast, en die horen **niet** in een preset:

| Veld | Wat | Bereik | Start |
|---|---|---|---|
| `clock.t` | Lopende klokpositie in drifttijd (seconden). Verandert continu | 0 … 10⁹ | 0 |
| `group` | Groep `A` … `D`: Drifts in dezelfde groep delen klok, tempo, sterkte, samenhang, zaad en bevriezen | `''`, `A`, `B`, `C`, `D` | `''` |
| `follow` | Volgwijze bij een groep of master: `gelijk` (hetzelfde), `gespiegeld` (omgekeerd), `verschoven` (240 s verschoven). Dit zijn Nederlandse sleutels uit de eerste versie en blijven zo | die drie | `gelijk` |
| `sel` | **Koppelingen met doelen**: `{ doelId: { paramId: { on, range } } }`: welke parameters van welk apparaat driften (`on`) en hoeveel, als deel van het bereik van de knop (`range`, 0 … 0,5; ±50%) | – | `{}` |
| `salt` | Nieuwe wind per spoor: `{ "doelId/spoor": geheel getal }` | – | `{}` |
| `freeze` | Bevroren sporen: `{ "doelId/spoor": drifttijd }` | – | `{}` |

**Wat dus niet in een preset hoort:** `sel` (de keuze welke parameters driften en hun bereik: die verwijst naar apparaten en parameters van de werkruimte van de gebruiker, en een parameter die niet bestaat kan niet sturen), `salt`, `freeze`, `group`, `follow`, `clock.t`. Een preset zet dus de karakteristiek van de beweging, niet de lijst met doelen. "Welke parameters" en "hoeveel per parameter" zijn dus geen preset-inhoud; die zet de gebruiker bij het koppelen (aangevinkt vanaf het voorstel van het doel: `p.on`, bereik `p.drift`). `clock.frozen` bestaat in `getPreset()`, maar een bevroren preset geeft een constante sturing; gebruik hem niet in een gewone preset.

Het zaad bepaalt welke beweging je krijgt. Geef elke preset een eigen zaad (verschillende getallen), zodat presets die verder dezelfde waarden hebben toch anders bewegen. Een ander zaad geeft een andere beweging met een andere stand op dit moment: kiezen van een preset kan de sturing dus één keer laten verspringen.

### Wat een goede instelling is

Hoe groot de uitslag werkelijk is: `wind (−0,9 … +0,9) × range × amount`. Met `range` 0,1 (een veelvoorkomend voorstel van een doel) en `amount` 0,6 is dat hoogstens ongeveer ±5% van het bereik van de parameter.

- **Subtiel leven** (`amount` 0,1 … 0,3, `speed` 0,5 … 2, `coh` 0,2 … 0,5): de luisteraar merkt na een minuut dat het klinkt als een levend instrument. Dit is de bedoelde standaard voor lopende muziek.
- **Langzame evolutie** (`speed` 0,25 … 0,6, `amount` 0,45 … 0,8): een klank die over tien tot veertig minuten verschuift; goed voor drones, pads, generatieve stukken.
- **Breed zwerven** (`amount` 0,85 … 1, `speed` 0,5 … 3): de beweging bereikt het volle bereik dat de gebruiker heeft ingesteld; kies dit alleen met een klein per-parameter-bereik, anders klinkt het onrustig.
- **Rusteloos** (`speed` 4 … 24, `amount` 0,12 … 0,5): periodes van een paar seconden tot een minuut; voor tape- en handwerkachtige beweging. Boven `speed` ~16 houd je `amount` laag (≤ 0,3).
- **Samenhang**: `coh` 0,8 … 1 laat alle filters of alle toonhoogtes samen bewegen (een ensemble dat samen ademt); `coh` 0 … 0,1 geeft elke parameter een eigen beweging (losse stemmen).
- **Per stijl**: ambient en drone: langzaam en samenhangend (`speed` 0,3 … 0,6, `coh` 0,6 … 0,7); techno en modulair: sneller en onafhankelijker (`speed` 2 … 3, `coh` 0,1 … 0,3); lo-fi en tape: `speed` ~5, `amount` ~0,3; dub: `amount` 0,7 en `speed` 1,5.
- **Groepen en volgers** (`eigen`): `eigen` 0,1 … 0,25 is bijna dezelfde beweging als de master, 0,5 … 0,8 geeft elke Drift zijn eigen karakter binnen de gedeelde wind. Zonder groep of master heeft `eigen` geen effect.

Elke preset heeft de volledige state van `getPreset()`, binnen het bereik, zonder afkappen. Een preset moet bij een aangesloten doel een eindige, niet-constante sturing geven, met `amount` boven 0 en `frozen` uit (getest: 44 presets, ook in een groep, zie het pack). Zet geen preset op `amount` 0.

## Wat Drift met een state doet (getest)

- Getallen buiten het bereik worden afgekapt; een tekst, `null`, `NaN`, `Infinity` of een ontbrekende waarde geeft de startwaarde (een zaad dat geen geheel getal is, geeft een nieuw willekeurig zaad). `setState({})` geeft de startwaarden en geen koppelingen.
- `follow` met een onbekende waarde geeft `gelijk`; `group` met een onbekende waarde geeft geen groep; in `sel` worden alleen objecten bewaard, met `range` afgekapt op 0 … 0,5; `salt` bewaart alleen gehele getallen; `freeze` alleen eindige getallen (afgekapt op 0 … 10⁹).
- Onbekende velden worden genegeerd. Zet er geen in.
- De knoppen volgen `setState`; `setState(getState())` en `setPreset(getPreset())` geven dezelfde state. `setPreset` behoudt de lopende positie, de koppelingen, de groep en de volgwijze.
- Een Drift die een master volgt (kabel naar `volg`), neemt de klok en wind van die master over; zijn eigen knoppen voor sterkte, tempo en samenhang staan dan vast. Een Drift in een groep deelt die instellingen met de andere leden: een preset op één lid verandert dus de hele groep.
- Koppelingen werken pas als het doelapparaat is aangesloten: de lijst met parameters komt van dat apparaat.
- Elke uitgestuurde waarde is eindig en ligt tussen −1 en +1 (een niet-eindige waarde wordt 0). De beweging in het normale gebied is bit-identiek aan de oude versie (met een nepdoel en een nepklok vergeleken).

## Controleren

- `node contract/validate-instrument.mjs devices/modulators/Drift/drift.patchkamer-device.js --lang nl` en `--lang en`, vanuit de root. Beide moeten `OK` geven, zonder `let op`.
- Je kunt niet horen wat een preset met een doel doet, en de beweging is zo traag dat luisteren weinig zegt. Meet de sturing met een nepdoel (`onModTargets` met parameters met `on: true` en `drift`), een nepklok (`ctx.currentTime` in grote stappen) en lees wat `host.modulate` krijgt. Schrijf in je oplevering dat de preset **niet beluisterd** is.
- Alle tekst in het apparaat staat in het woordenboek `EN` bovenin het bestand (Nederlandse tekst als sleutel, Engelse als waarde). Een nieuwe tekst krijgt altijd nl én en.

## Wat je niet doet

- Verander nooit de `id`, de `kind`, de poort-id's (`volg`, `mod`) of de namen en waarden van state-velden (`gelijk`, `gespiegeld`, `verschoven` blijven zo).
- Zet geen `sel`, `salt`, `freeze`, `group`, `follow` of `clock.t` in een preset.
- Pas het apparaat niet aan om een preset te laten kloppen.
- Zet geen merknamen van bestaande apparatuur of software in naam of omschrijving, en verzin geen persoon bij `author`.
- Commit of push niet, tenzij de opdracht dat vraagt.

## Documentatie en songs

Dit zijn de plaatsen waar je terechtkunt voor documentatie en voor het componeren van songs met dit apparaat. Songs zijn CC-BY-4.0, tunes en presets CC0-1.0, het apparaat AGPL-3.0-or-later.

- Handleiding van Drift: [NL](../../../docs/modulators/USER-MANUAL_NL.md#drift) · [EN](../../../docs/modulators/USER-MANUAL_EN.md#drift).
- Overzicht van de soort: [README](../README.md); handleiding van de hele soort: [NL](../../../docs/modulators/USER-MANUAL_NL.md) · [EN](../../../docs/modulators/USER-MANUAL_EN.md).
- Presets (instellingen, `kind: set`): [drift.patchkamer-presets.json](../../../presets/drift.patchkamer-presets.json). Kies een preset als beginpunt voor de `state` van dit apparaat in de song; velden die de preset niet noemt krijgen hun standaard.
- Overzicht van alle apparaten en hun signaalketens: [devices/AGENTS.md](../../../devices/AGENTS.md). Een song componeren: [songs/AGENTS.md](../../../songs/AGENTS.md).
- Rol in een song: sturing, langzame afwijking rond de knopstand van parameters zodat een instrument blijft variëren. Uitgang `mod` naar de `mod`-ingang van het doel; `volg` laat twee Drifts samen bewegen. Maakt geen geluid.
