# AGENTS.md: Flanger

Dit bestand is voor AI-agents die dit apparaat configureren of er presets voor maken. Het is niet geschreven voor mensen. Het hoort bij `../../../AGENTS.md` (algemeen); lees die eerst. Hier staat wat alleen voor Flanger geldt.

## Wat Flanger is

Een stereo flanger als AudioWorklet: een korte vertraging (0,2 tot 12 ms) met fractionele interpolatie, terugkoppeling tot ±97% zonder de minimale lusvertraging van gewone Web Audio-nodes, een LFO (sinus of driehoek) die vrij (Hz) of op het tempo van de studio loopt, en een stereo faseverschil. Stuurbaar via de modulatie-ingang; de knop Manual is ook sample-nauwkeurig te sturen (snelle sturing). Zonder AudioWorklet laat Flanger het geluid ongewijzigd door en meldt dat in de UI.

| | |
|---|---|
| Bestand | `flanger.patchkamer-device.js` (in deze map) |
| `id` | `nl.patchkamer.flanger`. Verander die nooit: daaraan hangen presets en songs van gebruikers |
| Naam | `Flanger` in alle talen; alleen de poortnamen hebben een Nederlandse variant (via `i18n`) |
| Soort | `effect`: Flanger krijgt dus **presets** (geen tunes) |
| Poorten | audio-ingang `in`, audio-uitgang `out`, modulatie-ingang `mod` (zes stuurbare parameters in het spoor `flanger`, waarvan `manual` snel); geen events |
| Contract | v1.11 |
| Licentie apparaat | AGPL-3.0-or-later |

## Geen tunes, wel presets

Alleen apparaten met `kind: 'instrument'` hebben tunes. Flanger is een `effect`, dus het krijgt **presets** en **nooit tunes** (contract §0 en §13c). Maak voor Flanger geen pack in `../../../tunes/`. Een presetpack heet `naam.patchkamer-presets.json` en staat in `../../../presets/`; het formaat is dat van het contract (§13c), `formatVersion` 2, licentie `CC0-1.0`, `device` is altijd `nl.patchkamer.flanger` en elke preset is `kind: "set"`. Maak alleen presets als de opdracht dat vraagt.

## De state

`state` van een preset is wat `getState()` teruggeeft (Flanger heeft geen `getPreset`).

| Veld | Wat | Bereik | Start | Eenheid |
|---|---|---|---|---|
| `shape` | Golfvorm van de LFO | 0 (sinus) of 1 (driehoek) | 0 | – |
| `sync` | LFO vrij of op tempo; de waarde is het aantal tellen per LFO-periode | `free`, `32` (8 maten), `16`, `8`, `4` (1 maat), `2`, `1` | `free` | – |
| `rate` | LFO-snelheid (alleen bij `sync: "free"`) | 0,02 … 10 | 0,15 | Hz |
| `depth` | Diepte van de LFO | 0 … 1 | 0,7 | – |
| `manual` | Basisvertraging | 0,2 … 12 | 2,5 | ms |
| `fb` | Terugkoppeling | −0,97 … 0,97 | 0,6 | – |
| `stereo` | Faseverschil tussen links en rechts (1 = 180°) | 0 … 1 | 0,25 | – |
| `mix` | Mengverhouding droog/nat | 0 … 1 | 0,5 | – |

Wat Flanger met een state doet (getest):
- Getallen buiten het bereik worden afgekapt (`manual: 1e9` wordt 12); een tekst, `null`, `NaN`, `±Infinity` of een ontbrekende waarde geeft de startwaarde.
- `shape` wordt 0 of 1 (boven 0,5 is het 1, net als in de worklet). Een ongeldige `sync` geeft de startwaarde.
- Onbekende velden worden genegeerd. Zet er geen in.
- De knoppen en keuzes op de kaart bewegen mee met `setState`.

Wat Flanger met zijn ingang doet (getest): de worklet begrenst de ingang op ±16 (+24 dB) en maakt `NaN` tot 0, begrenst een niet-eindige stuurwaarde van Manual, en leegt zijn vertraglijn als er toch iets niet-eindigs in de uitvoer komt. Voorheen bleef de terugkoppeling na één `NaN` voorgoed `NaN` geven. De vertraglijn is groot genoeg voor de langste vertraging bij elke samplefrequentie (bij 96 kHz las de vorige versie bij veel Manual en diepte de verkeerde plek in de lijn). Normaal geluid is bit-identiek aan de vorige versie bij 44,1 en 48 kHz.

## Skins

Flanger gebruikt `host.ui.knob` en `host.ui.select` met `id` en `group`, maar heeft geen eigen shadow root: een skin kan hier alleen `design` gebruiken (draaiknoppen en `layout`-panelen), geen eigen CSS. De meegeleverde skin `Compact` staat in `../../../skins/library/nl.patchkamer.flanger/`. Kaart 300 x 280 tegenover 300 x 325.

## Controleren

- `node contract/validate-instrument.mjs devices/effects/Flanger/flanger.patchkamer-device.js --lang nl` en `--lang en`, vanuit de root. Beide moeten `OK` geven, zonder `let op`.
- Je kunt niet horen hoe een preset klinkt. Heb je geen browser, schrijf dan in je oplevering dat de preset **niet beluisterd** is.
- Alle tekst in het apparaat staat in het woordenboek `EN` bovenin het bestand (Nederlandse tekst als sleutel, Engels als waarde). Een nieuwe tekst krijgt altijd nl én en.
- Verandert de worklet-code, verhoog dan het versienummer in `WNAME` (de host onthoudt code per naam).

## Wat je niet doet

- Verander nooit de `id`, de `kind`, de poort-id's of de namen van state-velden.
- Pas het apparaat niet aan om een preset te laten kloppen.
- Zet geen merknamen van bestaande apparatuur in naam of omschrijving, en verzin geen persoon bij `author`.
- Commit of push niet, tenzij de opdracht dat vraagt.

## Documentatie en songs

Dit zijn de plaatsen waar je terechtkunt voor documentatie en voor het componeren van songs met dit apparaat. Songs zijn CC-BY-4.0, tunes en presets CC0-1.0, het apparaat AGPL-3.0-or-later.

- Handleiding van Flanger: [NL](../../../docs/effects/USER-MANUAL_NL.md#flanger) · [EN](../../../docs/effects/USER-MANUAL_EN.md#flanger).
- Overzicht van de soort: [README](../README.md); handleiding van de hele soort: [NL](../../../docs/effects/USER-MANUAL_NL.md) · [EN](../../../docs/effects/USER-MANUAL_EN.md).
- Presets (instellingen, `kind: set`): [flanger.patchkamer-presets.json](../../../presets/flanger.patchkamer-presets.json). Kies een preset als beginpunt voor de `state` van dit apparaat in de song; velden die de preset niet noemt krijgen hun standaard.
- Overzicht van alle apparaten en hun signaalketens: [devices/AGENTS.md](../../../devices/AGENTS.md). Een song componeren: [songs/AGENTS.md](../../../songs/AGENTS.md).
- Route voor agents: [soort Effects](../AGENTS.md) → [devices/AGENTS.md](../../AGENTS.md) → [root AGENTS.md](../../../AGENTS.md). Contract: [NL](../../../contract/PATCHKAMER-CONTRACT_NL.md) · [EN](../../../contract/PATCHKAMER-CONTRACT_EN.md). Hoe presets van dit apparaat zijn opgebouwd: [presets/AGENTS.md](../../../presets/AGENTS.md). <!-- agents-tree -->
- Rol in een song: insert-effect voor beweging en kleuring. Audio in `in`, uit `out`; zes parameters zijn stuurbaar via `mod`.
