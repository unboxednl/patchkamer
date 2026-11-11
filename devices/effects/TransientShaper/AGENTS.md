# AGENTS.md: Transient Shaper

Dit bestand is voor AI-agents die dit apparaat configureren of er presets voor maken. Het is niet geschreven voor mensen. Het hoort bij `../../../AGENTS.md` (algemeen); lees die eerst. Hier staat wat alleen voor Transient Shaper geldt.

## Wat Transient Shaper is

Een effect dat de aanzet (attack) en het uitklinken (sustain) van een geluid versterkt of dempt, op elk niveau. Twee volgers (snel en langzaam) meten de gelijkgerichte ingang; het verschil in dB (snel minus langzaam) is positief tijdens een aanzet en negatief tijdens het uitklinken. Dat verschil is een verhouding, dus onafhankelijk van een drempel. `attack` (−100 … +100 %) schaalt het positieve verschil tot een versterking in dB, `sustain` het negatieve. Drie tijdconstanten (`speed`), optioneel drie banden (`bands`) met eigen attack en sustain, mix, uitgangsniveau en twee meters (versterking en demping).

| | |
|---|---|
| Bestand | `transient-shaper.patchkamer-device.js` (in deze map) |
| `id` | `nl.patchkamer.transientshaper`. Verander die nooit: daaraan hangen presets en songs van gebruikers |
| Naam | `Transient Shaper` in alle talen; alleen de poortnamen `Uit` en `Out` verschillen per taal (via `i18n`) |
| Soort | `effect` (categorie `effect`): Transient Shaper krijgt dus **presets** (geen tunes) |
| Poorten | audio-ingang `in`, audio-uitgang `out`, sturing `mod`; geen events |
| Contract | v1.34 |
| Latency | 0 (geen lookahead); `latency()` meldt 0 |
| Licentie apparaat | AGPL-3.0-or-later |

## Geen tunes, wel presets

Alleen apparaten met `kind: 'instrument'` hebben tunes. Transient Shaper is een `effect`, dus het krijgt **presets** en **nooit tunes** (contract §0 en §13c). Maak voor dit apparaat geen pack in `../../../tunes/`. Het presetpack is `transient-shaper.patchkamer-presets.json` in `../../../presets/`: `formatVersion` 2, licentie `CC0-1.0`, `device` is altijd `nl.patchkamer.transientshaper`, elke preset is `kind: "set"`. Elke preset bevat **alle** velden hieronder.

## De state

`state` van een preset is wat `getState()` teruggeeft (er is geen `getPreset`).

| Veld | Wat | Bereik | Start | Eenheid |
|---|---|---|---|---|
| `attack` | Attack (één band): plus = meer aanzet, min = zachtere aanzet | −100 … 100 | 40 | % |
| `sustain` | Sustain (één band): plus = langer uitklinken, min = korter | −100 … 100 | 0 | % |
| `lowAttack`, `lowSustain` | Attack en sustain van de lage band (alleen bij `bands`) | −100 … 100 | 0 | % |
| `midAttack`, `midSustain` | Idem, middenband | −100 … 100 | 0 | % |
| `highAttack`, `highSustain` | Idem, hoge band | −100 … 100 | 0 | % |
| `xoLow` | Crossover laag/mid | 40 … 1000 (log) | 200 | Hz |
| `xoHigh` | Crossover mid/hoog | 600 … 12000 (log) | 2500 | Hz |
| `mix` | Deel van het bewerkte signaal | 0 … 1 | 1 | deel |
| `out` | Uitgangsniveau | −24 … 12 | 0 | dB |
| `speed` | Tijdconstanten: `fast` (hi-hats, percussie), `normal` (snare, breaks), `long` (kick, bas) | een van drie | `normal` | – |
| `bands` | 3 banden aan: de velden `low…`, `mid…`, `high…` gelden dan in plaats van `attack` en `sustain` | boolean | `false` | – |
| `on` | Aan, of doorlaten | boolean | `true` | – |

Definities (gemeten, zie "Controleren"):

- Tijdconstanten (63 %) per `speed`: snelle volger attack/release 0,2/4 ms (`fast`), 0,5/10 ms (`normal`), 2/30 ms (`long`); langzame volger 6/50, 15/120 en 45/300 ms. In de 3-bandstand worden alle tijden voor de lage band met 2,5 vermenigvuldigd en voor de hoge band met 0,6.
- Versterking in dB: verschil > 0: `attack` × verschil; verschil < 0: `sustain` × |verschil|. Begrensd op +18 dB en −40 dB. Onder circa −70 dBFS van de langzame volger neemt het effect lineair af (geen ruis oppompen).
- 3 banden: laag = laagdoorlaat (4e orde) op `xoLow`; het restant minus de middenband (laagdoorlaat op `xoHigh`) is de hoge band; de banden tellen weer op tot het origineel (afsplitsend, geen fase-afwijking). Detectie per band, gekoppeld over links en rechts.
- Overschakelen tussen één en drie banden loopt via een crossfade van 15 ms.
- Bij `attack` en `sustain` 0, `bands` uit, `mix` 1 en `out` 0 dB is de uitgang **bit-identiek** aan de ingang (gemeten, ook in een echte AudioWorklet). Met `bands` aan en alle banden op 0 is de afwijking −240 dB (afrondfout).
- Een grote aanzetversterking kan pieken geven; de uitgang heeft geen limiter.

Wat het apparaat met zijn ingang doet (getest): `NaN`, `±Infinity` en absurd grote waarden (1e9, 1e30) worden begrensd (boven ±16, +24 dB). De worklet accepteert alleen eindige parameters en zet een ontspoorde toestand per blok terug. Normaal geluid blijft bit-identiek.

Wat het apparaat met een state doet (getest):
- Getallen buiten het bereik worden afgekapt; een tekst, `null`, `NaN`, `±Infinity` of een ontbrekende waarde geeft de startwaarde.
- Een keuzeveld met een onbekende waarde geeft de startwaarde; booleans die geen boolean zijn, geven de startwaarde.
- Onbekende velden worden genegeerd. Zet er geen in.
- Alle gewijzigde waarden lopen in de worklet door een zachte overgang (15 ms); de crossoverfrequenties volgen per blok.

## Controleren

- `node contract/validate-instrument.mjs devices/effects/TransientShaper/transient-shaper.patchkamer-device.js --lang nl` en `--lang en`, vanuit de root. Beide moeten `OK` geven, zonder `let op`.
- Je kunt niet horen hoe een preset klinkt. Heb je geen browser, schrijf dan in je oplevering dat de preset **niet beluisterd** is.
- Alle tekst in het apparaat staat in de woordenboeken `NL` en `EN` bovenin het bestand. Een nieuwe tekst krijgt altijd nl én en.
- De worklet-naam bevat de versie (`nl-patchkamer-transientshaper-1-0-0`): de host onthoudt code per naam. Verander je de worklet, verhoog dan de versie in die naam.
- Meten: laad het apparaat met een nep-`AudioContext`, haal de worklet-code op via `host.loadWorklet` en draai blokken van 128 samples (zie `../../../docs/tools/worklet-harness.mjs` voor het patroon).

## Wat je niet doet

- Verander nooit de `id`, de `kind`, de poort-id's of de namen van state-velden.
- Pas het apparaat niet aan om een preset te laten kloppen.
- Zet geen merknamen van bestaande apparatuur in naam of omschrijving, en verzin geen persoon bij `author`.
- Commit of push niet, tenzij de opdracht dat vraagt.

## Documentatie en songs

Dit zijn de plaatsen waar je terechtkunt voor documentatie en voor het componeren van songs met dit apparaat. Songs zijn CC-BY-4.0, tunes en presets CC0-1.0, het apparaat AGPL-3.0-or-later.

- Handleiding van Transient Shaper: [NL](../../../docs/effects/USER-MANUAL_NL.md#transient-shaper) · [EN](../../../docs/effects/USER-MANUAL_EN.md#transient-shaper).
- Overzicht van de soort: [README](../README.md); handleiding van de hele soort: [NL](../../../docs/effects/USER-MANUAL_NL.md) · [EN](../../../docs/effects/USER-MANUAL_EN.md).
- Presets (instellingen, `kind: set`): [transient-shaper.patchkamer-presets.json](../../../presets/transient-shaper.patchkamer-presets.json). Kies een preset als beginpunt voor de `state` van dit apparaat in de song; velden die de preset niet noemt krijgen hun standaard.
- Overzicht van alle apparaten en hun signaalketens: [devices/AGENTS.md](../../../devices/AGENTS.md). Een song componeren: [songs/AGENTS.md](../../../songs/AGENTS.md).
- Route voor agents: [soort Effects](../AGENTS.md) → [devices/AGENTS.md](../../AGENTS.md) → [root AGENTS.md](../../../AGENTS.md). Contract: [NL](../../../contract/PATCHKAMER-CONTRACT_NL.md) · [EN](../../../contract/PATCHKAMER-CONTRACT_EN.md). Hoe presets van dit apparaat zijn opgebouwd: [presets/AGENTS.md](../../../presets/AGENTS.md). <!-- agents-tree -->
- Rol in een song: aanzet en uitklink van drums en bas bijstellen (audio in `in`, uit `out`), bijvoorbeeld op een break of snare vóór de Mixer, of op een bas. Zet een limiter of de uitgang lager na een grote aanzetversterking.
