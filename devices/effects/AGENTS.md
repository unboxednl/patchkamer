# AGENTS.md: devices/effects/ (Effects)

Dit bestand is voor AI-agents die een apparaat, tune of preset in de soort **Effects** maken of gebruiken, of een song met zulke apparaten componeren. Het is niet geschreven voor mensen. Effecten die het geluid vormen: modulatie, vervorming, ruimte, filters, ritme, stem en hele ketens.

## Plaats in de boom

- Omhoog: [devices/AGENTS.md](../AGENTS.md) (alle apparaten in een song, kabelsoorten, de klok) en de [root AGENTS.md](../../AGENTS.md) (het contract en de regels voor elk nieuw apparaat).
- Omlaag: de `AGENTS.md` van elk apparaat in deze soort, in de tabel hieronder.
- Opzij: [presets/AGENTS.md](../../presets/AGENTS.md) (hoe presets zijn opgebouwd en gemaakt) en [songs/AGENTS.md](../../songs/AGENTS.md) (een song componeren).
- Voor mensen: [README](README.md) en de handleiding [NL](../../docs/effects/USER-MANUAL_NL.md) · [EN](../../docs/effects/USER-MANUAL_EN.md). Die zijn niet bedoeld als instructie voor agents.

## Wat deze soort is en wat je moet weten

- `audio in` naar `audio uit`; `kind: 'effect'`. Zet ze in een song tussen een bron en de Mixer, of op een send/return van de Mixer.
- Een effect heeft **presets** (geen tunes). Controleer vooral gedrag bij NaN, Infinity en enorme waarden op de ingang: één foute sample vergiftigt alles erachter.
- Het contract: [NL](../../contract/PATCHKAMER-CONTRACT_NL.md) · [EN](../../contract/PATCHKAMER-CONTRACT_EN.md); de validator `contract/validate-instrument.mjs` (draai hem in gewoon, `--lang en` en `--lang nl`).

## Een nieuw apparaat in deze soort bouwen

1. Lees de [root AGENTS.md](../../AGENTS.md) helemaal en het contract. Controleer eerst dat contract en validator dezelfde versie hebben.
2. Zet het apparaat in `devices/effects/<Naam>/<naam>.patchkamer-device.js` (naam met hoofdletter, bestand in kleine letters met streepjes, zonder versienummer) met een eigen `AGENTS.md` en een `icon.svg` (zie [het icoon van een apparaat](../AGENTS.md#het-icoon-van-een-apparaat)).
3. Maak presets en bijbehorende documentatie volgens [presets/AGENTS.md](../../presets/AGENTS.md).
4. Werk de documentatie bij zoals in de root `AGENTS.md` staat (README's, handleidingen, changelog, in twee talen), draai `python3 docs/tools/list-devices.py` en `python3 docs/tools/agents-tree.py --write`.

## De apparaten

Dit overzicht komt uit `devices/AGENTS.md` en wordt gegenereerd door `docs/tools/agents-tree.py --write`; verander het niet met de hand.

<!-- agents-tree:begin -->

| Apparaat | `id` | Wat het doet |
|---|---|---|
| [Chorus](Chorus/AGENTS.md) | `nl.patchkamer.chorus` | Verdubbelt een geluid met kleine bewegende vertragingen; twee stemmen of drie (ensemble). |
| [Effect Chain](EffectChain/AGENTS.md) | `nl.patchkamer.effect-chain` | Tot 8 effecten achter elkaar, gekozen uit 33, met een analyzer. |
| [Filter](Filter/AGENTS.md) | `nl.patchkamer.filter` | Tien filtertypen, van laagdoorlaat tot klinkers en kamfilters. |
| [Flanger](Flanger/AGENTS.md) | `nl.patchkamer.flanger` | Een zwiepende flanger met feedback, vrij of op het tempo. |
| [Frequency Shifter](FrequencyShifter/AGENTS.md) | `nl.patchkamer.freqshift` | Verschuift alle frequenties een vast aantal Hz. |
| [Grit](Grit/AGENTS.md) | `nl.patchkamer.grit` | Vervorming in een resonant laagdoorlaatfilter met een LFO. |
| [Phaser](Phaser/AGENTS.md) | `nl.patchkamer.phaser` | Een phaser met 4 tot 12 trappen, vrij of op het tempo. |
| [Pump](Pump/AGENTS.md) | `nl.patchkamer.pump` | Laat een bron op de tel wijken: sidechain, trigger of klok. |
| [Resonator](Resonator/AGENTS.md) | `nl.patchkamer.resonator` | Vier resonatoren gestemd op een grondtoon en een akkoord. |
| [Room](Room/AGENTS.md) | `nl.patchkamer.room` | Een delay en een galm in één effect. |
| [Tremolo](Tremolo/AGENTS.md) | `nl.patchkamer.tremolo` | Laat het volume op en neer gaan. |
| [Vocoder](Vocoder/AGENTS.md) | `nl.patchkamer.vocoder` | Een vocoder met 16 banden: een stem bespeelt een synth. |

<!-- agents-tree:end -->
