# AGENTS.md: devices/modulators/ (Modulators)

Dit bestand is voor AI-agents die een apparaat, tune of preset in de soort **Modulators** maken of gebruiken, of een song met zulke apparaten componeren. Het is niet geschreven voor mensen. Apparaten die de regelaars van andere apparaten bewegen: Drift, Follower, LFO, Macro, Multi-Segment Envelope en Swell.

## Plaats in de boom

- Omhoog: [devices/AGENTS.md](../AGENTS.md) (alle apparaten in een song, kabelsoorten, de klok) en de [root AGENTS.md](../../AGENTS.md) (het contract en de regels voor elk nieuw apparaat).
- Omlaag: de `AGENTS.md` van elk apparaat in deze soort, in de tabel hieronder.
- Opzij: [presets/AGENTS.md](../../presets/AGENTS.md) (hoe presets zijn opgebouwd en gemaakt) en [songs/AGENTS.md](../../songs/AGENTS.md) (een song componeren).
- Voor mensen: [README](README.md) en de handleiding [NL](../../docs/modulators/USER-MANUAL_NL.md) · [EN](../../docs/modulators/USER-MANUAL_EN.md). Die zijn niet bedoeld als instructie voor agents.

## Wat deze soort is en wat je moet weten

- `kind: 'modulator'`; uitgang `mod uit` (kabel `mod`). De toewijzing (welke parameter, hoe diep) staat in de `state` van de modulator, niet in de kabel. Presets, geen tunes.
- Het contract: [NL](../../contract/PATCHKAMER-CONTRACT_NL.md) · [EN](../../contract/PATCHKAMER-CONTRACT_EN.md); de validator `contract/validate-instrument.mjs` (draai hem in gewoon, `--lang en` en `--lang nl`).

## Een nieuw apparaat in deze soort bouwen

1. Lees de [root AGENTS.md](../../AGENTS.md) helemaal en het contract. Controleer eerst dat contract en validator dezelfde versie hebben.
2. Zet het apparaat in `devices/modulators/<Naam>/<naam>.patchkamer-device.js` (naam met hoofdletter, bestand in kleine letters met streepjes, zonder versienummer) met een eigen `AGENTS.md` en een `icon.svg` (zie [het icoon van een apparaat](../AGENTS.md#het-icoon-van-een-apparaat)).
3. Maak presets en bijbehorende documentatie volgens [presets/AGENTS.md](../../presets/AGENTS.md).
4. Werk de documentatie bij zoals in de root `AGENTS.md` staat (README's, handleidingen, changelog, in twee talen), draai `python3 docs/tools/list-devices.py` en `python3 docs/tools/agents-tree.py --write`.

## De apparaten

Dit overzicht komt uit `devices/AGENTS.md` en wordt gegenereerd door `docs/tools/agents-tree.py --write`; verander het niet met de hand.

<!-- agents-tree:begin -->

| Apparaat | `id` | Wat het doet |
|---|---|---|
| [Drift](Drift/AGENTS.md) | `nl.patchkamer.drift` | Laat aangevinkte regelaars heel langzaam rond hun knopstand zwerven; Drifts kunnen in een groep één wind delen |
| [Follower](Follower/AGENTS.md) | `nl.patchkamer.follower` | Een envelope follower: maakt van het volume, de aanslagen en de helderheid van een geluid sturing voor andere apparaten, en stuurt bij elke aanslag een trig of een noot |
| [LFO](Lfo/AGENTS.md) | `nl.patchkamer.lfo` | Een golf op het tempo van de klok (acht vormen, ook een envelope die op een trigger start) die regelaars van andere apparaten beweegt |
| [Macro](Macro/AGENTS.md) | `nl.patchkamer.macro` | Vier knoppen die elk een groep regelaars tegelijk bewegen, ook over apparaten heen; de knoppen kunnen ook via een CC-eventingang bewogen worden |
| [Multi-Segment Envelope](Mseg/AGENTS.md) | `nl.patchkamer.mseg` | Een curve die je zelf tekent over 1 tot 64 maten, herhalend of één keer, voor opbouwen, breaks en sweeps |
| [Swell](Swell/AGENTS.md) | `nl.patchkamer.swell` | Langzame, samenhangende beweging in vier gekoppelde banen (Adem, Warmte, Ruimte, Zweving) voor pads en ambient |

<!-- agents-tree:end -->
