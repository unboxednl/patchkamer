# AGENTS.md: Resonator

Dit bestand is voor AI-agents die dit apparaat configureren of er presets voor maken. Het is niet geschreven voor mensen. Het hoort bij `../../../AGENTS.md` (algemeen); lees die eerst. Hier staat wat alleen voor Resonator geldt.

## Wat Resonator is

Een bank van vier gestemde resonatoren (terugkoppelende kamfilters met demping in de lus) als AudioWorklet. Je stemt ze op een grondtoon met een akkoord (unisono, octaven, kwinten, groot, klein, sus4, klein 7, kwarten, cluster) en laat de grondtoon desgewenst binnenkomende noten volgen. Maakt van ritme of ruis een zingende, gestemde klank.

| | |
|---|---|
| Bestand | `resonator.patchkamer-device.js` (in deze map) |
| `id` | `nl.patchkamer.resonator`. Verander die nooit: daaraan hangen presets en songs van gebruikers |
| Naam | `Resonator` in alle talen; alleen de poortnamen hebben een Nederlandse variant (via `i18n`) |
| Soort | `effect`: Resonator krijgt dus **presets** (geen tunes) |
| Poorten | audio-ingang `in`, audio-uitgang `out`, event-ingang `notes` (noten, alleen gebruikt als `follow` aan staat), sturing-ingang `mod` |
| Stuurbaar | `decay`, `damp`, `detune`, `tune`, `mix` |
| Contract | v1.11 |
| Licentie apparaat | AGPL-3.0-or-later |

## Geen tunes, wel presets

Alleen apparaten met `kind: 'instrument'` hebben tunes. Resonator is een `effect`, dus het krijgt **presets** en **nooit tunes** (contract §0 en §13c). Maak voor Resonator geen pack in `../../../tunes/`. Een presetpack heet `naam.patchkamer-presets.json` en staat in `../../../presets/`; het formaat is dat van het contract (§13c), `formatVersion` 2, licentie `CC0-1.0`, `device` is altijd `nl.patchkamer.resonator` en elke preset is `kind: "set"`. Maak alleen presets als de opdracht dat vraagt.

## De state

`getPreset()` geeft de state zonder `noteRoot`: de lopende grondtoon (door binnenkomende noten gezet) hoort niet in een preset. `getState()` heeft hem wel, zodat een werkruimte exact terugkomt.

| Veld | Wat | Bereik | Start | Eenheid |
|---|---|---|---|---|
| `root` | Grondtoon (MIDI-nootnummer) | 24 … 84 | 45 (A2) | – |
| `chord` | Akkoord: `uni`, `oct`, `fifth`, `maj`, `min`, `sus`, `min7`, `fourth`, `cluster` | keuze | `min` | – |
| `decay` | Galmtijd | 0,05 … 8 | 1,5 | s |
| `damp` | Demping in de lus | 0 … 1 | 0,35 | – |
| `detune` | Ontstemming van de vier resonatoren onderling | 0 … 50 | 6 | cent |
| `tune` | Stemming van het geheel | −12 … 12 | 0 | halve tonen |
| `mix` | Nat/droog | 0 … 1 | 0,5 | – |
| `gain` | Uitgangsniveau van het natte signaal | 0 … 2 | 1 | – |
| `follow` | De grondtoon volgt binnenkomende noten | boolean | `false` | – |
| `noteRoot` | Lopende grondtoon (alleen in `getState`, niet in een preset) | 12 … 108 | = `root` | MIDI-nootnummer |

Wat Resonator met een state doet (getest):
- Getallen buiten het bereik worden afgekapt; een tekst, `null`, `NaN`, `Infinity` of een ontbrekende waarde geeft de startwaarde.
- Een onbekend `chord` geeft `min`; een `follow` die geen boolean is geeft `false`.
- Onbekende velden worden genegeerd. Zet er geen in.

Wat Resonator met een foutieve ingang doet (getest): `NaN`, `±Infinity` en absurd grote waarden vergiftigen de geheugens niet meer. De worklet begrenst de ingang op ±16 en maakt `NaN` tot 0, en maakt de geheugens leeg als de toestand niet eindig of absurd groot wordt. De vorige versie bleef na één `NaN` voor altijd stil. Normaal geluid is bit-identiek aan de vorige versie. Het droge pad (`mix` onder 1) geeft de ingang ongewijzigd door, dus een `NaN` aan de ingang is tijdens die `NaN` zelf ook aan de uitgang te zien; daarna is alles weer in orde.

## Controleren

- `node contract/validate-instrument.mjs devices/effects/Resonator/resonator.patchkamer-device.js --lang nl` en `--lang en`, vanuit de root. Beide moeten `OK` geven, zonder `let op`.
- Je kunt niet horen hoe een preset klinkt. Heb je geen browser, schrijf dan in je oplevering dat de preset **niet beluisterd** is.
- Alle tekst in het apparaat staat in het woordenboek `EN` bovenin het bestand (Engels bij de Nederlandse bron). Een nieuwe tekst krijgt altijd nl én en.

## Wat je niet doet

- Verander nooit de `id`, de `kind`, de poort-id's of de namen van state-velden.
- Pas het apparaat niet aan om een preset te laten kloppen.
- Zet geen merknamen van bestaande apparatuur in naam of omschrijving, en verzin geen persoon bij `author`.
- Verander de worklet-code niet zonder de versie in `WNAME` te verhogen: de host onthoudt code per naam.
- Commit of push niet, tenzij de opdracht dat vraagt.

## Documentatie en songs

Dit zijn de plaatsen waar je terechtkunt voor documentatie en voor het componeren van songs met dit apparaat. Songs zijn CC-BY-4.0, tunes en presets CC0-1.0, het apparaat AGPL-3.0-or-later.

- Handleiding van Resonator: [NL](../../../docs/effects/USER-MANUAL_NL.md#resonator) · [EN](../../../docs/effects/USER-MANUAL_EN.md#resonator).
- Overzicht van de soort: [README](../README.md); handleiding van de hele soort: [NL](../../../docs/effects/USER-MANUAL_NL.md) · [EN](../../../docs/effects/USER-MANUAL_EN.md).
- Presets (instellingen, `kind: set`): [resonator.patchkamer-presets.json](../../../presets/resonator.patchkamer-presets.json). Kies een preset als beginpunt voor de `state` van dit apparaat in de song; velden die de preset niet noemt krijgen hun standaard.
- Overzicht van alle apparaten en hun signaalketens: [devices/AGENTS.md](../../../devices/AGENTS.md). Een song componeren: [songs/AGENTS.md](../../../songs/AGENTS.md).
- Route voor agents: [soort Effects](../AGENTS.md) → [devices/AGENTS.md](../../AGENTS.md) → [root AGENTS.md](../../../AGENTS.md). Contract: [NL](../../../contract/PATCHKAMER-CONTRACT_NL.md) · [EN](../../../contract/PATCHKAMER-CONTRACT_EN.md). Hoe presets van dit apparaat zijn opgebouwd: [presets/AGENTS.md](../../../presets/AGENTS.md). <!-- agents-tree -->
- Rol in een song: insert-effect dat een bron op een grondtoon of akkoord laat resoneren. Audio in `in`, uit `out`; met `follow` aan volgt het de noten op de eventingang `notes`, dus laat het dezelfde noten horen als de synth.
