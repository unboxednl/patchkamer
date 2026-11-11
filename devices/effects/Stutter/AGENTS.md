# AGENTS.md: Stutter

Dit bestand is voor AI-agents die dit apparaat configureren of er presets voor maken. Het is niet geschreven voor mensen. Het hoort bij `../../../AGENTS.md` (algemeen); lees die eerst. Hier staat wat alleen voor Stutter geldt.

## Wat Stutter is

Beat-repeat, gate en roll op het tempo van de host. De worklet schrijft de ingang continu in een ringbuffer (6 s). Bij het starten wordt het laatste stuk (herhalingslengte × `steps`, hoogstens 4,5 s) bevroren en herhaald, zolang een bron actief is. Drie soorten (`mode`): **repeat** (beat repeat met gate-patroon, gate-lengte, pitch per herhaling, decay per herhaling, richting en opbouw naar een kortere herhaling), **tapestop** (leest vanaf het startmoment uit de ringbuffer met een afnemende snelheid) en **reverse** (het laatste stuk achteruit, aanzwellend). Starten kan met de knop, met trigs, noten en CC op de eventingang `trig`, of automatisch aan het eind van de maat (`auto`). Aan de randen van elke herhaling en bij het in- en uitschakelen zitten korte fades (geen klik).

| | |
|---|---|
| Bestand | `stutter.patchkamer-device.js` (in deze map) |
| `id` | `nl.patchkamer.stutter`. Verander die nooit: daaraan hangen presets en songs van gebruikers |
| Naam | `Stutter` in alle talen; alleen de poortnamen `Uit` en `Out` verschillen per taal (via `i18n`) |
| Soort | `effect` (categorie `effect`): Stutter krijgt dus **presets** (geen tunes) |
| Poorten | audio-ingang `in`, audio-uitgang `out`, eventingang `trig`, sturing `mod`; geen eventuitgang |
| Contract | v1.34 |
| Latency | 0; `latency()` meldt 0 |
| Licentie apparaat | AGPL-3.0-or-later |

## Geen tunes, wel presets

Alleen apparaten met `kind: 'instrument'` hebben tunes. Stutter is een `effect`, dus het krijgt **presets** en **nooit tunes** (contract §0 en §13c). Maak voor dit apparaat geen pack in `../../../tunes/`. Het presetpack is `stutter.patchkamer-presets.json` in `../../../presets/`: `formatVersion` 2, licentie `CC0-1.0`, `device` is altijd `nl.patchkamer.stutter`, elke preset is `kind: "set"`. Elke preset bevat **alle** velden hieronder.

## De state

`state` van een preset is wat `getState()` teruggeeft (er is geen `getPreset`). Of de knop of een bron nu actief is, hoort niet in de state en dus niet in een preset.

| Veld | Wat | Bereik | Start | Eenheid |
|---|---|---|---|---|
| `mode` | Soort: `repeat`, `tapestop`, `reverse` | een van drie | `repeat` | – |
| `rate` | Herhalingslengte: `4`, `4t`, `8`, `8t`, `16`, `16t`, `32`, `32t` (1/4 tot 1/32; `t` = triool) | een van acht | `8` | – |
| `rateTo` | Opbouw: loopt van `rate` stap voor stap (telkens een nootwaarde korter) naar deze lengte; `off` = geen opbouw. Alleen bij `steps` 1 en een kortere lengte dan `rate` | acht lengtes of `off` | `off` | – |
| `reps` | Herhalingen per trap van de opbouw | 1, 2, 3, 4, 6, 8 | 2 | – |
| `steps` | Lus: aantal herhalingslengtes dat samen de lus vormt | 1, 2, 4, 8 | 1 | – |
| `pattern` | Gate-patroon over opeenvolgende herhalingen: `all` (x x x x), `half` (x . x .), `off` (. x . x), `gallop` (x . x x), `skip` (x x x .), `sync` (x . . x), `tres` (x . . x . . x .), `broken` (x x . x . x x .) | een van acht | `all` | – |
| `dir` | Richting (bij `repeat`): `fwd`, `rev`, `alt` (wisselend per herhaling van de lus) | een van drie | `fwd` | – |
| `gate` | Gate-lengte: deel van elke herhaling dat open is | 0,05 … 1 | 1 | deel |
| `ramp` | Pitch per herhaling van de lus (stijgend of dalend; totaal begrensd op ×0,25 … ×4) | −3 … 3 | 0 | halve tonen |
| `decay` | Hoeveel zachter elke volgende herhaling van de lus wordt | 0 … 12 | 0 | dB |
| `stop` | Tape stop: tijd tot stilstand | 50 … 3000 (log) | 600 | ms |
| `curve` | Tape stop: snelheid = (1 − t/stop)^curve | 0,5 … 4 (log) | 1,5 | – |
| `swell` | Reverse: het niveau groeit binnen de lus van (1 − swell) naar 1, kwadratisch | 0 … 1 | 0,7 | deel |
| `mix` | Tijdens het stotteren: deel van het herhaalde signaal | 0 … 1 | 1 | deel |
| `out` | Uitgangsniveau | −24 … 12 | 0 | dB |
| `len` | Lengte van een trig in stappen van een zestiende (een noot gebruikt zijn eigen `dur`) | 1 … 64 (geheel) | 4 | stappen |
| `auto` | Automatisch starten: `off`, `step2` (laatste 2 zestienden van de maat), `beat` (laatste tel), `half` (laatste halve maat), `bar4` (de laatste maat van vier) | een van vijf | `off` | – |
| `quant` | De knop begint op de eerstvolgende zestiende van de klok (alleen als de klok loopt) | boolean | `false` | – |
| `latch` | De knop schakelt aan en uit in plaats van ingedrukt houden | boolean | `false` | – |

Definities (gemeten, zie "Controleren"):

- Herhalingslengte in zestiende stappen van de klok (stapduur = 60 / bpm / 4): 1/4 = 4, 1/8 = 2, 1/16 = 1, 1/32 = 0,5; triolen × 2/3.
- Het opgenomen stuk eindigt op het sample waarop de bron start (bij een start op een blokgrens kan dat een sample eerder zijn). Bij `rateTo` wordt de lengte van `rate` bevroren; latere, kortere trappen lezen vanaf het begin van dat stuk.
- Elke herhaling heeft aan het begin een fade-in en aan het eind een fade-out van 1 ms; ligt een open herhaling direct naast een open herhaling (en is `gate` 1), dan is er geen fade ertussen. In- en uitschakelen: 1,5 ms in, 6 ms uit (crossfade met de ingang). Gate-lengte, pitch en decay veranderen per herhaling.
- Pitch (`ramp`) leest de bevroren lus met een andere snelheid; is die hoger dan 1, dan is de herhaling eerder klaar en volgt stilte tot de volgende. Gemeten: ramp 3 halve tonen geeft 400, 476, 568, 672 Hz bij een sinus van 400 Hz.
- Tape stop: gemeten frequentie van 440 Hz naar 0 Hz in 500 ms; het laatste deel (15 %) fade uit. Na het loslaten komt de ingang terug via de crossfade.
- Zonder actieve bron is de uitgang **bit-identiek** aan de ingang bij `out` 0 dB (ook in een echte AudioWorklet).
- Eventingang `trig`: `trig` en `note` starten op `time` en stoppen na `len` stappen (trig) of de `dur` van de noot; `cc` met waarde ≥ 0,5 start, lager stopt. Meerdere bronnen (knop, events, `auto`) tellen als "een of meer actief".
- Het bevriezen kopieert hooguit 4,5 s uit de ringbuffer in één blok (gemeten: 53 % van het blokbudget van 2,67 ms bij het grootste venster; gewone vensters zijn kleiner).

Wat het apparaat met zijn ingang doet (getest): `NaN`, `±Infinity` en absurd grote waarden (1e9, 1e30) worden begrensd (boven ±16, +24 dB), ook in de ringbuffer; daarna komt het geluid terug. De worklet accepteert alleen eindige parameters en zet een ontspoorde toestand per blok terug. 60 extreme runs (alle soorten, snelle triggers) gaven geen niet-eindige samples.

Wat het apparaat met een state doet (getest):
- Getallen buiten het bereik worden afgekapt; een tekst, `null`, `NaN`, `±Infinity` of een ontbrekende waarde geeft de startwaarde. `len` wordt afgerond.
- Een keuzeveld met een onbekende waarde geeft de startwaarde; `reps` en `steps` moeten een getal uit de lijst zijn. Booleans die geen boolean zijn, geven de startwaarde.
- Onbekende velden worden genegeerd. Zet er geen in.
- `mix` en `out` lopen in de worklet door een zachte overgang (15 ms), de gate-envelope door 0,2 ms; de overige velden gelden vanaf de volgende herhaling of de volgende start.

## Controleren

- `node contract/validate-instrument.mjs devices/effects/Stutter/stutter.patchkamer-device.js --lang nl` en `--lang en`, vanuit de root. Beide moeten `OK` geven, zonder `let op`.
- Je kunt niet horen hoe een preset klinkt. Heb je geen browser, schrijf dan in je oplevering dat de preset **niet beluisterd** is.
- Alle tekst in het apparaat staat in de woordenboeken `NL` en `EN` bovenin het bestand. Een nieuwe tekst krijgt altijd nl én en.
- De worklet-naam bevat de versie (`nl-patchkamer-stutter-1-0-0`): de host onthoudt code per naam. Verander je de worklet, verhoog dan de versie in die naam.
- Meten: laad het apparaat met een nep-`AudioContext`, haal de worklet-code op via `host.loadWorklet` en draai blokken van 128 samples; stuur `{ type: 'src', k: 'ui', v: true, t: <seconden> }` om te starten (zie `../../../docs/tools/worklet-harness.mjs` voor het patroon). Zet `currentTime` als globale waarde.

## Wat je niet doet

- Verander nooit de `id`, de `kind`, de poort-id's of de namen van state-velden.
- Pas het apparaat niet aan om een preset te laten kloppen.
- Zet geen merknamen van bestaande apparatuur in naam of omschrijving, en verzin geen persoon bij `author`.
- Commit of push niet, tenzij de opdracht dat vraagt.

## Documentatie en songs

Dit zijn de plaatsen waar je terechtkunt voor documentatie en voor het componeren van songs met dit apparaat. Songs zijn CC-BY-4.0, tunes en presets CC0-1.0, het apparaat AGPL-3.0-or-later.

- Handleiding van Stutter: [NL](../../../docs/effects/USER-MANUAL_NL.md#stutter) · [EN](../../../docs/effects/USER-MANUAL_EN.md#stutter).
- Overzicht van de soort: [README](../README.md); handleiding van de hele soort: [NL](../../../docs/effects/USER-MANUAL_NL.md) · [EN](../../../docs/effects/USER-MANUAL_EN.md).
- Presets (instellingen, `kind: set`): [stutter.patchkamer-presets.json](../../../presets/stutter.patchkamer-presets.json). Kies een preset als beginpunt voor de `state` van dit apparaat in de song; velden die de preset niet noemt krijgen hun standaard.
- Overzicht van alle apparaten en hun signaalketens: [devices/AGENTS.md](../../../devices/AGENTS.md). Een song componeren: [songs/AGENTS.md](../../../songs/AGENTS.md).
- Route voor agents: [soort Effects](../AGENTS.md) → [devices/AGENTS.md](../../AGENTS.md) → [root AGENTS.md](../../../AGENTS.md). Contract: [NL](../../../contract/PATCHKAMER-CONTRACT_NL.md) · [EN](../../../contract/PATCHKAMER-CONTRACT_EN.md). Hoe presets van dit apparaat zijn opgebouwd: [presets/AGENTS.md](../../../presets/AGENTS.md). <!-- agents-tree -->
- Rol in een song: rolls, build-ups, tape-stop drops en gates op een drumbus, break of bas (audio in `in`, uit `out`). Koppel een sequencer-uitgang met trigs of noten aan de ingang `trig` om de roll op bepaalde stappen te starten (een noot duurt zo lang als zijn `dur`), of zet `auto` voor een vulling aan het eind van de maat.
