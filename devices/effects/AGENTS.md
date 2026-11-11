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
| [Bitcrusher](Bitcrusher/AGENTS.md) | `nl.patchkamer.bitcrusher` | Verlaagt bitdiepte en samplerate, met vier kwantiseerstijlen, dither, ruis, een optioneel anti-alias-filter en een golfvormscherm. |
| [Chorus](Chorus/AGENTS.md) | `nl.patchkamer.chorus` | Verdubbelt een geluid met kleine bewegende vertragingen; twee stemmen of drie (ensemble). |
| [Compressor](Compressor/AGENTS.md) | `nl.patchkamer.compressor` | Compressor met drempel, ratio tot oneindig, zachte knee, attack en release (ook automatisch), make-up, peak- of RMS-detectie, lookahead, sidechain-filter en externe sidechain, parallelle mix, mid/side, een reductiemeter en een overdrachtscurve. |
| [Convolution Reverb](ConvolutionReverb/AGENTS.md) | `nl.patchkamer.convolutionreverb` | Een convolutiegalm met 15 ingebouwde impulsresponsies en je eigen bestanden. |
| [De-esser](DeEsser/AGENTS.md) | `nl.patchkamer.deesser` | Dempt scherpe s-klanken in een stem: detectieband van 3 tot 10 kHz, drempel, ratio, maximale reductie, split-band of wideband, meeluisteren met de band, mix en een reductiemeter. |
| [Delay](Delay/AGENTS.md) | `nl.patchkamer.delay` | Een uitgebreid delay: vrije tijd in ms, sync met de klok van de host (1/64 tot 2 maten, recht, punt, triool, x/16), eigen tempo (tap), stereo, ping-pong, mono en dual, met filters, verzadiging, diffusie, modulatie, ducking, freeze en reverse. |
| [Distortion](Distortion/AGENTS.md) | `nl.patchkamer.distortion` | Acht vervormingssoorten van zachte clip tot fuzz en wavefolder, met oversampling, toonregelaars en een parallelle mix. |
| [Effect Chain](EffectChain/AGENTS.md) | `nl.patchkamer.effect-chain` | Tot 8 effecten achter elkaar, gekozen uit 33, met een analyzer. |
| [Filter](Filter/AGENTS.md) | `nl.patchkamer.filter` | Tien filtertypen, van laagdoorlaat tot klinkers en kamfilters. |
| [Flanger](Flanger/AGENTS.md) | `nl.patchkamer.flanger` | Een zwiepende flanger met feedback, vrij of op het tempo. |
| [Frequency Shifter](FrequencyShifter/AGENTS.md) | `nl.patchkamer.freqshift` | Verschuift alle frequenties een vast aantal Hz. |
| [Gate](Gate/AGENTS.md) | `nl.patchkamer.gate` | Noise gate, expander en ducker in één: drempel, ratio, attack, hold, release, range, hysterese, sidechain-filters en meeluisteren, externe sidechain, lookahead en een meter die toont hoe open de poort is. |
| [Grit](Grit/AGENTS.md) | `nl.patchkamer.grit` | Vervorming in een resonant laagdoorlaatfilter met een LFO. |
| [Harmonizer](Harmonizer/AGENTS.md) | `nl.patchkamer.harmonizer` | Tot vier extra stemmen op vaste intervallen of binnen een toonladder, die de toonhoogte van de ingang of de noten op de eventingang volgen, met niveau, pan, detune en vertraging per stem. |
| [Phaser](Phaser/AGENTS.md) | `nl.patchkamer.phaser` | Een phaser met 4 tot 12 trappen, vrij of op het tempo. |
| [Pitch Correction](PitchCorrection/AGENTS.md) | `nl.patchkamer.pitchcorrection` | Monofone toonhoogtecorrectie: meet de toonhoogte van een stem of lijn en schuift die naar de dichtstbijzijnde toegestane noot van een toonladder, met snelheid, mate, vibratobehoud en een scherm met de gehoorde en gecorrigeerde noot. |
| [Pitch Shifter](PitchShifter/AGENTS.md) | `nl.patchkamer.pitchshifter` | Verschuift de toonhoogte van −24 tot +24 halve tonen plus cents met behoud van tempo, met een percussieve korrelmotor, een korrelmotor voor stemmen en een vocoder met formantbesturing, plus terugkoppeling voor shimmer en octaaf-echo's. |
| [Pump](Pump/AGENTS.md) | `nl.patchkamer.pump` | Laat een bron op de tel wijken: sidechain, trigger of klok. |
| [Resonator](Resonator/AGENTS.md) | `nl.patchkamer.resonator` | Vier resonatoren gestemd op een grondtoon en een akkoord. |
| [Reverb](Reverb/AGENTS.md) | `nl.patchkamer.reverb` | Een algoritmische galm met vijf modellen: Hall, Plate, Spring, Room en Chamber. |
| [Room](Room/AGENTS.md) | `nl.patchkamer.room` | Een delay en een galm in één effect. |
| [Stutter](Stutter/AGENTS.md) | `nl.patchkamer.stutter` | Beat repeat, gate en roll op het tempo: herhaalt de laatste stappen op 1/4 tot 1/32 (ook triolen), met gate-patronen, pitch-ramps, decay, opbouw, tape stop en reverse; start met een knop, events of aan het eind van de maat. |
| [Transient Shaper](TransientShaper/AGENTS.md) | `nl.patchkamer.transientshaper` | Versterkt of dempt de aanzet en het uitklinken van een geluid op elk niveau, met drie tijdinstellingen, een optionele driebandsmodus, mix en meters voor de versterking. |
| [Tremolo](Tremolo/AGENTS.md) | `nl.patchkamer.tremolo` | Laat het volume op en neer gaan. |
| [Vocoder](Vocoder/AGENTS.md) | `nl.patchkamer.vocoder` | Een vocoder met 16 banden: een stem bespeelt een synth. |

<!-- agents-tree:end -->
