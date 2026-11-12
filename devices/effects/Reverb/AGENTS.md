# AGENTS.md: Reverb

Dit bestand is voor AI-agents die dit apparaat configureren of er presets voor maken. Het is niet geschreven voor mensen. Het hoort bij `../../../AGENTS.md` (algemeen); lees die eerst. Hier staat wat alleen voor Reverb geldt.

## Wat Reverb is

Een algoritmische galm met vijf modellen in één apparaat: **Hall** (groot, lange decay, rijk), **Plate** (helder, glad, snel dicht), **Spring** (veer: dispersieve lus met de "boing", lo-fi), **Room** (klein, intiem) en **Chamber** (tussenvorm). Alles draait in één AudioWorklet. Hall, Plate, Room en Chamber zijn een feedback-delay-network van 8 gemoduleerde lijnen met een Householder-menging, vier ingangsdiffusers, een tabel vroege reflecties en per lijn een demping in twee banden; Spring is twee lussen met een keten van 60 allpass-secties en een zachte begrenzer. Elk model heeft eigen lijnlengtes, diffusers, reflecties, modulatie en klankverschuiving. Het droge signaal gaat altijd door een eigen pad (geen latency); `mix` is gelijk-vermogen.

| | |
|---|---|
| Bestand | `reverb.patchkamer-device.js` (in deze map) |
| `id` | `nl.patchkamer.reverb`. Verander die nooit: daaraan hangen presets en songs van gebruikers |
| Naam | `Reverb` in alle talen; alleen de poortnamen `Uit` en `Out` verschillen per taal (via `i18n`) |
| Soort | `effect` (categorie `effect`): Reverb krijgt dus **presets** (geen tunes) |
| Poorten | audio-ingang `in`, audio-uitgang `out`, sturing `mod` |
| Contract | v1.28 |
| Licentie apparaat | AGPL-3.0-or-later |
| Worklet | `nl-patchkamer-reverb-1-0-1`: verhoog de versie in de naam als je de worklet wijzigt (de host onthoudt code per naam) |

## Geen tunes, wel presets

Alleen apparaten met `kind: 'instrument'` hebben tunes. Reverb is een `effect`, dus het krijgt **presets** en **nooit tunes** (contract §0 en §13c). Het pack is `../../../presets/reverb.patchkamer-presets.json` (`formatVersion` 2, licentie `CC0-1.0`, `device` is `nl.patchkamer.reverb`, elke preset is `kind: "set"`, mappen Hall, Plate, Spring, Room, Chamber en Creative). `state` van een preset is wat `getState()` teruggeeft (Reverb heeft geen `getPreset`).

## De state

| Veld | Wat | Bereik | Start | Eenheid |
|---|---|---|---|---|
| `model` | Het algoritme | `hall`, `plate`, `spring`, `room`, `chamber` | `hall` | – |
| `size` | Grootte van de ruimte: schaalt de lijnlengtes (0 = 0,5x, 0,5 = 1x, 1 = 2x); bij Spring de lengte van de veer (0,6x tot 1,7x) | 0 … 1 | 0,5 | deel |
| `decay` | Nagalmtijd RT60 bij het midden (rond 1 kHz) | 0,1 … 30 | 2,5 | s |
| `predelay` | Pre-delay (vrij); telt niet mee als `sync` aan staat | 0 … 250 | 20 | ms |
| `sync` | Pre-delay op het tempo van de host | boolean | `false` | – |
| `div` | Notenwaarde van de gesynchroniseerde pre-delay: `"32"`, `"16"`, `"8"`, `"4"`, `"2"` (1/n; tekst, geen getal); hoogstens 500 ms | tekst | `"16"` | – |
| `dampHi` | Demping hoog: de frequentie waarop de nagalmtijd de helft is | 1000 … 20000 | 6000 | Hz |
| `dampLo` | Lage decay: factor op de nagalmtijd van het laag (onder ongeveer 250 Hz) | 0,25 … 2 | 1 | factor |
| `diff` | Diffusie van de ingang; bij Spring de dispersie (de chirp) | 0 … 1 | 0,7 | deel |
| `mod` | Modulatie van de lijnlengtes tegen metaalklank; bij Spring een lichte wobbel | 0 … 1 | 0,4 | deel |
| `early` | Vroeg/laat: 0 = alleen de staart, 1 = alleen vroege reflecties; bij Spring het deel van de eerste (gedispergeerde) doorgang | 0 … 1 | 0,3 | deel |
| `hp` | Hoogdoorlaat op de ingang van de galm | 20 … 1000 | 20 | Hz |
| `lp` | Laagdoorlaat op de ingang van de galm | 1000 … 20000 | 20000 | Hz |
| `width` | Stereobreedte van de galm (0 = mono, 2 = extra breed) | 0 … 2 | 1 | deel |
| `duck` | Ducking: de galm gaat omlaag zolang de bron speelt (begint rond -36 dB, vol bij -12 dB) | 0 … 1 | 0 | deel |
| `freeze` | Houd de staart vast: de ingang gaat dicht en de lus verliest bijna niets | boolean | `false` | – |
| `mix` | Droog/nat, gelijk-vermogen | 0 … 1 | 0,3 | deel |

Gedrag van `setState` (getest): getallen buiten het bereik worden afgekapt; een tekst, `null`, `NaN` of een ontbrekende waarde geeft de startwaarde; een onbekend `model` of `div` geeft de startwaarde; `sync` en `freeze` die geen boolean zijn, geven de startwaarde; onbekende velden worden genegeerd. De parameters worden in de worklet zacht gevolgd (afstemmingen glijden, een model wisselt met een kruisfade van 80 ms).

Alle continue regelaars staan in `params()` (stuurbaar via de Mod-poort); bewust niet: `model`, `sync`, `div` en `freeze` (keuzes).

## Wat je moet weten bij het maken van presets

- Een gewone insert: `mix` 0,15 tot 0,4. Op een send-bus: `mix` 1 en de bron droog laten.
- Een preset met `freeze: true` laat de ingang dichtstaan: de staart die er op dat moment is, blijft hangen. Laad je zo'n preset op een stil apparaat, dan hoor je niets tot er nieuw geluid is geweest en daarna freeze is aangezet.
- `decay` boven 15 s met `mod` 0 en `diff` laag klinkt snel metalig; gebruik dan `diff` boven 0,8.
- Hall `size` 1 met `decay` 11 s is de grens van wat nuttig is; meer lijnlengte maakt de dichtheid niet beter.

## Skins

De regelaars zijn via `host.ui.knob` en `host.ui.select` herkenbaar voor skins (`id` is de state-sleutel, `role` is `param` of `select`, groepen `space`, `tone`, `input` en `output`). De meegeleverde skin `Compact` staat in `../../../skins/library/nl.patchkamer.reverb/`: de vier keuzelijsten in één rij en dertien draaiknoppen in vijf kolommen; ongeveer 340 x 521 tegenover 360 x 366 punten. De skin gebruikt alleen `design.controls`, `design.layout` en `design.size`; het apparaat zelf is er niet voor aangepast. Hernoem je een id of groep, controleer dan die skin.

## Controleren

- `node contract/validate-instrument.mjs devices/effects/Reverb/reverb.patchkamer-device.js --lang nl` en `--lang en`, vanuit de root. Beide moeten `OK` geven, zonder `let op`.
- `node devices/effects/Reverb/check-preset.mjs` haalt elke preset door `setState` en `getState` en meldt ontbrekende of onbekende velden en gewijzigde waarden.
- `node docs/tools/measure-reverb.mjs` meet RT60 per model en band, echodichtheid, kleuring, stereo-decorrelatie, latency, rekenlast, stabiliteit (NaN/Infinity/1e30, freeze) en de modelwissel. Je kunt niet horen hoe een preset klinkt: schrijf in je oplevering dat de klank **niet beluisterd** is.
- De worklet-code wordt in dat script uit het apparaat zelf geladen: een wijziging in de DSP komt dus vanzelf in de meting.

## Wat je niet doet

- Verander nooit de `id`, de `kind`, de poort-id's of de namen van state-velden.
- Pas het apparaat niet aan om een preset te laten kloppen.
- Zet geen merknamen van bestaande apparatuur in naam of omschrijving, en verzin geen persoon bij `author`.
- Zet geen modelnamen of verwijzingen naar andere instrumenten in code, labels of commentaar.
- Commit of push niet, tenzij de opdracht dat vraagt.

## Documentatie en songs

Dit zijn de plaatsen waar je terechtkunt voor documentatie en voor het componeren van songs met dit apparaat. Songs zijn CC-BY-4.0, tunes en presets CC0-1.0, het apparaat AGPL-3.0-or-later.

- Handleiding van Reverb: [NL](../../../docs/effects/USER-MANUAL_NL.md#reverb) · [EN](../../../docs/effects/USER-MANUAL_EN.md#reverb).
- Overzicht van de soort: [README](../README.md); handleiding van de hele soort: [NL](../../../docs/effects/USER-MANUAL_NL.md) · [EN](../../../docs/effects/USER-MANUAL_EN.md).
- Presets (instellingen, `kind: set`): [reverb.patchkamer-presets.json](../../../presets/reverb.patchkamer-presets.json). Kies een preset als beginpunt voor de `state` van dit apparaat in de song; velden die de preset niet noemt krijgen hun standaard.
- Overzicht van alle apparaten en hun signaalketens: [devices/AGENTS.md](../../../devices/AGENTS.md). Een song componeren: [songs/AGENTS.md](../../../songs/AGENTS.md).
- Route voor agents: [soort Effects](../AGENTS.md) → [devices/AGENTS.md](../../AGENTS.md) → [root AGENTS.md](../../../AGENTS.md). Contract: [NL](../../../contract/PATCHKAMER-CONTRACT_NL.md) · [EN](../../../contract/PATCHKAMER-CONTRACT_EN.md). Hoe presets van dit apparaat zijn opgebouwd: [presets/AGENTS.md](../../../presets/AGENTS.md). <!-- agents-tree -->
- Rol in een song: galm als insert of op een send-bus. Audio in `in`, uit `out`; geen latency op het droge pad. Het model en de decay bepalen de ruimte, `mix` de hoeveelheid.
