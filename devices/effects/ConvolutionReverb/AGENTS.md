# AGENTS.md: Convolution Reverb

Dit bestand is voor AI-agents die dit apparaat configureren of er presets voor maken. Het is niet geschreven voor mensen. Het hoort bij `../../../AGENTS.md` (algemeen); lees die eerst. Hier staat wat alleen voor Convolution Reverb geldt.

## Wat Convolution Reverb is

Een convolutiegalm: het geluid wordt vermenigvuldigd met een impulsrespons (IR). Er zijn 15 ingebouwde IR's (kerk, concertzaal, studioruimte, kleine cabine, betegelde badkamer, trappenhuis, grot, tunnel, stalen plaat, veertank, metalen buis, metalen ton, gated burst, omgekeerde swell, watertank) die **bij het laden van het apparaat deterministisch worden gegenereerd** uit gezaaide ruis, decaycurves per frequentieband, vroege reflecties, flutterecho, een dispersieve veerlus en modale resonanties. Het apparaatbestand bevat dus geen audio. Een eigen IR laden kan met de knop Bestand laden of via de tab Samples (`loadAudio(files, info)`, contract §13e); die audio komt **nooit** in de state of in een preset.

Motor: twee `ConvolverNode`s (A en B) voor een kruisfade bij elke wissel van IR, een eigen normalisatie op energie (`normalize` staat uit), dan pre-delay, hoogdoorlaat, laagdoorlaat, tilt (twee shelving-filters), breedte (M/S) en een gelijk-vermogen mix. Een kleine worklet begrenst de ingang (±16, NaN wordt 0).

| | |
|---|---|
| Bestand | `convolution-reverb.patchkamer-device.js` (in deze map) |
| `id` | `nl.patchkamer.convolutionreverb`. Verander die nooit: daaraan hangen presets en songs van gebruikers |
| Naam | `Convolution Reverb` in alle talen; de namen van de ingebouwde IR's en de labels zijn per taal (`host.lang`), de poortnamen `Uit` en `Out` via `i18n` |
| Soort | `effect` (categorie `effect`): dus **presets** (geen tunes) |
| Poorten | audio-ingang `in`, audio-uitgang `out`, sturing `mod` |
| Contract | v1.28 |
| Licentie apparaat | AGPL-3.0-or-later |
| Worklet | `nl-patchkamer-convolutionreverb-1-0-0` (verhoog de versie in de naam als je de worklet wijzigt) |

## Geen tunes, wel presets

Convolution Reverb is een `effect`: **presets, nooit tunes**. Het pack is `../../../presets/convolution-reverb.patchkamer-presets.json` (`formatVersion` 2, `CC0-1.0`, `device` is `nl.patchkamer.convolutionreverb`, elke preset `kind: "set"`, mappen Rooms, Halls, Devices en Creative, minstens een preset per ingebouwde IR). `state` is wat `getState()` teruggeeft.

## De state

| Veld | Wat | Bereik | Start | Eenheid |
|---|---|---|---|---|
| `ir` | Impulsrespons: `church`, `hall`, `studio`, `booth`, `bathroom`, `stairwell`, `cave`, `tunnel`, `plate`, `spring`, `tube`, `bin`, `gated`, `reverse`, `tank`, of `user` (een zelf geladen bestand) | tekst | `hall` | – |
| `predelay` | Pre-delay voor de convolutie | 0 … 250 | 0 | ms |
| `start` | Trim: begin van de IR (alles ervoor wordt weggelaten) | 0 … 1000 | 0 | ms |
| `length` | Trim: lengte van de IR vanaf `start` (12 = alles) | 0,05 … 12 | 12 | s |
| `stretch` | Tijdschaal van de IR (hersampled: korter = korter en helderder, langer = langer en donkerder) | 0,5 … 2 | 1 | factor |
| `balance` | Vroeg/staart rond 80 ms: -1 = alleen vroege reflecties, 0 = ongewijzigd, 1 = alleen de staart | -1 … 1 | 0 | deel |
| `hp` | Hoogdoorlaat op de galm (20 Hz = uit) | 20 … 1000 | 20 | Hz |
| `lp` | Laagdoorlaat op de galm (20 kHz = uit) | 1000 … 20000 | 20000 | Hz |
| `tilt` | Helling: positief = helderder en minder laag (shelving rond 700 Hz en 2,2 kHz) | -12 … 12 | 0 | dB |
| `width` | Stereobreedte (0 = mono, 2 = extra breed) | 0 … 2 | 1 | deel |
| `mix` | Droog/nat, gelijk-vermogen | 0 … 1 | 0,3 | deel |

Gedrag van `setState` (getest): bereik afgekapt, een tekst/`null`/`NaN`/ontbrekende waarde geeft de startwaarde, een onbekende `ir` geeft `hall`, onbekende velden worden genegeerd. `ir: 'user'` zonder geladen bestand klinkt als Concertzaal en toont een melding; de state blijft `user`. De audio van een eigen IR hoort **niet** in een preset: maak presets alleen met ingebouwde IR's.

Een wissel van `ir`, `start`, `length`, `stretch` of `balance` bouwt een nieuwe buffer en kruisfade (60 ms), hoogstens ongeveer drie keer per seconde (debounce); bij modulatie van die vier gebeurt hetzelfde. Een eigen IR is hoogstens 12 s; langer wordt afgekapt.

## Controleren

- `node contract/validate-instrument.mjs devices/effects/ConvolutionReverb/convolution-reverb.patchkamer-device.js --lang nl` en `--lang en`: `OK`, zonder `let op`.
- `node devices/effects/ConvolutionReverb/check-preset.mjs` voor het presetpack.
- `python3 docs/tools/measure-convolution-reverb.py` (Playwright en Chromium) meet per IR de energie, RT60 per band, echodichtheid en stereo-decorrelatie, de werking van elke regelaar, latency (0 samples), rekenlast (ook de langste IR), stabiliteit (bursts van NaN/Infinity/1e30) en de kruisfade. De klank is **niet beluisterd**.

## Wat je niet doet

- Verander nooit de `id`, de `kind`, de poort-id's of de namen van state-velden, en geen id's van de ingebouwde IR's (daaraan hangen presets).
- Zet geen audio van een eigen bestand in een preset of in de state.
- Zet geen merknamen van bestaande apparatuur of ruimtes in namen of omschrijvingen. De IR's zijn synthetisch en benaderen een type ruimte of apparaat; het zijn geen opnamen of nabootsingen van een bestaand exemplaar.
- Commit of push niet, tenzij de opdracht dat vraagt.

## Documentatie en songs

Dit zijn de plaatsen waar je terechtkunt voor documentatie en voor het componeren van songs met dit apparaat. Songs zijn CC-BY-4.0, tunes en presets CC0-1.0, het apparaat AGPL-3.0-or-later.

- Handleiding van Convolution Reverb: [NL](../../../docs/effects/USER-MANUAL_NL.md#convolution-reverb) · [EN](../../../docs/effects/USER-MANUAL_EN.md#convolution-reverb).
- Overzicht van de soort: [README](../README.md); handleiding van de hele soort: [NL](../../../docs/effects/USER-MANUAL_NL.md) · [EN](../../../docs/effects/USER-MANUAL_EN.md).
- Presets (instellingen, `kind: set`): [convolution-reverb.patchkamer-presets.json](../../../presets/convolution-reverb.patchkamer-presets.json). Kies een preset als beginpunt voor de `state` van dit apparaat in de song; velden die de preset niet noemt krijgen hun standaard.
- Overzicht van alle apparaten en hun signaalketens: [devices/AGENTS.md](../../../devices/AGENTS.md). Een song componeren: [songs/AGENTS.md](../../../songs/AGENTS.md).
- Route voor agents: [soort Effects](../AGENTS.md) → [devices/AGENTS.md](../../AGENTS.md) → [root AGENTS.md](../../../AGENTS.md). Contract: [NL](../../../contract/PATCHKAMER-CONTRACT_NL.md) · [EN](../../../contract/PATCHKAMER-CONTRACT_EN.md). Hoe presets van dit apparaat zijn opgebouwd: [presets/AGENTS.md](../../../presets/AGENTS.md). <!-- agents-tree -->
- Rol in een song: galm van een ruimte of apparaat als insert of op een send-bus. Audio in `in`, uit `out`; geen latency. De IR en `mix` bepalen de ruimte en de hoeveelheid.

Kaartbreedte (1.0.1): `ui.width` 520, `minWidth` 490. De titelbalk (naam, poorten, versiekeuze en knoppen) is 474 px breed; bij 460 px rekte hij de kaart uit zijn voegen en werd de waardekolom afgekapt. De waardekolom van de knoppen is 84 px. Geen `latency()`: een galm die het droge deel niet vertraagt, meldt geen vertraging (contract §13j).
