# AGENTS.md: Filter

Dit bestand is voor AI-agents die dit apparaat configureren of er presets voor maken. Het is niet geschreven voor mensen. Het hoort bij `../../../AGENTS.md` (algemeen); lees die eerst. Hier staat wat alleen voor Filter geldt.

## Wat Filter is

Een filter met tien typen: lowpass en highpass van 12 en 24 dB, band, notch, vowel (klinkers A-E-I-O-U met drie formanten), een 4-polige ladder met verzadiging (AudioWorklet) en twee kamfilters, plus en min (AudioWorklet). Met drive vooraf, mix (nat/droog) en uitgangsniveau. De cutoff is voor alle typen snel stuurbaar (sample-nauwkeurig, via de Mod-ingang), de andere knoppen via de gewone sturing.

| | |
|---|---|
| Bestand | `filter.patchkamer-device.js` (in deze map) |
| `id` | `nl.patchkamer.filter`. Verander die nooit: daaraan hangen presets en songs van gebruikers |
| Naam | `Filter` in alle talen; alleen de poortnamen hebben een Nederlandse variant (via `i18n`) |
| Soort | `effect`: Filter krijgt dus **presets** (geen tunes) |
| Poorten | audio-ingang `in`, audio-uitgang `out`, sturing-ingang `mod` (cutoff snel); geen events |
| Stuurbaar | `cut` (snel), `res`, `drive`, `vowel`, `mix` |
| Contract | v1.11 |
| Licentie apparaat | AGPL-3.0-or-later |

## Geen tunes, wel presets

Alleen apparaten met `kind: 'instrument'` hebben tunes. Filter is een `effect`, dus het krijgt **presets** en **nooit tunes** (contract §0 en §13c). Maak voor Filter geen pack in `../../../tunes/`. Een presetpack heet `naam.patchkamer-presets.json` en staat in `../../../presets/`; het formaat is dat van het contract (§13c), `formatVersion` 2, licentie `CC0-1.0`, `device` is altijd `nl.patchkamer.filter` en elke preset is `kind: "set"`. Maak alleen presets als de opdracht dat vraagt.

## De state

`state` van een preset is wat `getState()` teruggeeft (Filter heeft geen `getPreset`).

| Veld | Wat | Bereik | Start | Eenheid |
|---|---|---|---|---|
| `type` | Filtertype: `lp12`, `lp24`, `hp12`, `hp24`, `bp`, `notch`, `vowel`, `ladder`, `combp`, `combm` | keuze | `lp24` | – |
| `cut` | Cutoff (bij `vowel` de verschuiving van de klinkers, bij de kamfilters de toonhoogte) | 20 … 20000 | 1200 | Hz |
| `res` | Resonantie | 0 … 1 | 0,3 | – |
| `drive` | Verzadiging vóór het filter | 0 … 1 | 0 | – |
| `vowel` | Klinker, 0 = A, 1 = E, 2 = I, 3 = O, 4 = U (tussenwaarden mengen); alleen bij `vowel` | 0 … 4 | 0 | – |
| `mix` | Nat/droog | 0 … 1 | 1 | – |
| `gain` | Uitgangsniveau van het natte signaal | 0 … 2 | 1 | – |

Wat Filter met een state doet (getest):
- Getallen buiten het bereik worden afgekapt; een tekst, `null`, `NaN`, `Infinity` of een ontbrekende waarde geeft de startwaarde.
- Een onbekend `type` geeft `lp24`.
- Onbekende velden worden genegeerd. Zet er geen in.

Wat Filter met een foutieve ingang doet (getest, offline en live): `NaN`, `±Infinity` en absurd grote waarden vergiftigen het apparaat niet meer. De typen `ladder`, `combp` en `combm` begrenzen de ingang op ±16 en maken `NaN` tot 0, en zetten hun toestand per blok terug als die niet eindig is. De gewone filters (de overige typen) worden in een live context om de 50 ms bewaakt: geeft de filteruitvoer `NaN` of een waarde boven 1e4, dan worden de filters vervangen en gaat het geluid binnen enkele tientallen milliseconden door. Normaal geluid is bit-identiek aan de vorige versie (alleen bij `vowel` kan de optelvolgorde van de drie formanten in de browser een afwijking van 1 float-stapje geven, dat is browsergedrag en heeft niets met de code te maken). Het droge pad (`mix` onder 1) geeft de ingang ongewijzigd door, dus een `NaN` aan de ingang is tijdens die `NaN` zelf ook aan de uitgang te zien; daarna is alles weer in orde.

## Controleren

- `node contract/validate-instrument.mjs devices/effects/Filter/filter.patchkamer-device.js --lang nl` en `--lang en`, vanuit de root. Beide moeten `OK` geven, zonder `let op`.
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

- Handleiding van Filter: [NL](../../../docs/effects/USER-MANUAL_NL.md#filter) · [EN](../../../docs/effects/USER-MANUAL_EN.md#filter).
- Overzicht van de soort: [README](../README.md); handleiding van de hele soort: [NL](../../../docs/effects/USER-MANUAL_NL.md) · [EN](../../../docs/effects/USER-MANUAL_EN.md).
- Presets (instellingen, `kind: set`): [filter.patchkamer-presets.json](../../../presets/filter.patchkamer-presets.json). Kies een preset als beginpunt voor de `state` van dit apparaat in de song; velden die de preset niet noemt krijgen hun standaard.
- Overzicht van alle apparaten en hun signaalketens: [devices/AGENTS.md](../../../devices/AGENTS.md). Een song componeren: [songs/AGENTS.md](../../../songs/AGENTS.md).
- Route voor agents: [soort Effects](../AGENTS.md) → [devices/AGENTS.md](../../AGENTS.md) → [root AGENTS.md](../../../AGENTS.md). Contract: [NL](../../../contract/PATCHKAMER-CONTRACT_NL.md) · [EN](../../../contract/PATCHKAMER-CONTRACT_EN.md). Hoe presets van dit apparaat zijn opgebouwd: [presets/AGENTS.md](../../../presets/AGENTS.md). <!-- agents-tree -->
- Rol in een song: insert-effect en sturingsdoel; de cutoff is snel te moduleren via `mod` (bijvoorbeeld met een LFO of een Mseg voor een filtersweep of een opbouw). Audio in `in`, uit `out`.
