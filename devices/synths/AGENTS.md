# AGENTS.md: devices/synths/ (Synths)

Dit bestand is voor AI-agents die een apparaat, tune of preset in de soort **Synths** maken of gebruiken, of een song met zulke apparaten componeren. Het is niet geschreven voor mensen. Apparaten die uit noten geluid maken: bassen, leads, pads, akkoorden, toetsen, strijkers, blazers, snaarinstrumenten, sound design, modulair patchen, drones, texturen en zang.

## Plaats in de boom

- Omhoog: [devices/AGENTS.md](../AGENTS.md) (alle apparaten in een song, kabelsoorten, de klok) en de [root AGENTS.md](../../AGENTS.md) (het contract en de regels voor elk nieuw apparaat).
- Omlaag: de `AGENTS.md` van elk apparaat in deze soort, in de tabel hieronder.
- Opzij: [tunes/AGENTS.md](../../tunes/AGENTS.md) (hoe tunes zijn opgebouwd en gemaakt) en [songs/AGENTS.md](../../songs/AGENTS.md) (een song componeren).
- Voor mensen: [README](README.md) en de handleiding [NL](../../docs/synths/USER-MANUAL_NL.md) · [EN](../../docs/synths/USER-MANUAL_EN.md). Die zijn niet bedoeld als instructie voor agents.

## Wat deze soort is en wat je moet weten

- `kind: 'instrument'`; ingang `event in` (noten), uitgang `audio uit` (stereo), meestal `mod` voor sturing. Een synth heeft meestal geen eigen patroon: een sequencer of de toetsen sturen hem; sommige (Acid Baselines, Sub Line) hebben wel een eigen patroon of arpeggiator.
- Een synth heeft **tunes** (geen presets). Een tune is de volledige `state` van dit ene apparaat.
- Elke synth begint met `// SPDX-License-Identifier: AGPL-3.0-or-later`, is tweetalig (`host.lang`) en bewaakt zijn uitvoer tegen NaN en Infinity (zie de NaN-regels in het contract).
- Het contract: [NL](../../contract/PATCHKAMER-CONTRACT_NL.md) · [EN](../../contract/PATCHKAMER-CONTRACT_EN.md); de validator `contract/validate-instrument.mjs` (draai hem in gewoon, `--lang en` en `--lang nl`).

## Een nieuw apparaat in deze soort bouwen

1. Lees de [root AGENTS.md](../../AGENTS.md) helemaal en het contract. Controleer eerst dat contract en validator dezelfde versie hebben.
2. Zet het apparaat in `devices/synths/<Naam>/<naam>.patchkamer-device.js` (naam met hoofdletter, bestand in kleine letters met streepjes, zonder versienummer) met een eigen `AGENTS.md` en een `icon.svg` (zie [het icoon van een apparaat](../AGENTS.md#het-icoon-van-een-apparaat)).
3. Maak tunes en bijbehorende documentatie volgens [tunes/AGENTS.md](../../tunes/AGENTS.md).
4. Werk de documentatie bij zoals in de root `AGENTS.md` staat (README's, handleidingen, changelog, in twee talen), draai `python3 docs/tools/list-devices.py` en `python3 docs/tools/agents-tree.py --write`.

## De apparaten

Dit overzicht komt uit `devices/AGENTS.md` en wordt gegenereerd door `docs/tools/agents-tree.py --write`; verander het niet met de hand.

<!-- agents-tree:begin -->

| Apparaat | `id` | Wat het doet |
|---|---|---|
| [Acid Baselines](AcidBaselines/AGENTS.md) | `nl.patchkamer.acidbaselines` | Een bassynth met een 16-staps sequencer (accent, slide en octaaf per stap), 16 patronen, een tweede filter en vier soorten vervorming |
| [Acid Stepper](AcidStepper/AGENTS.md) | `nl.patchkamer.acidstepper` | Een eenvoudiger acid-bassynth met een eigen patroon van 16 stappen, accent, slide, drive en een vierpolig filter |
| [Basic Mono](BasicMono/AGENTS.md) | `nl.patchkamer.mono` | De eenvoudigste monosynth: één oscillator, een sub, een resonant filter, glide en negen knoppen |
| [Biotope](Biotope/AGENTS.md) | `nl.patchkamer.biotope` | Een synth voor omgevingen zonder samples: acht lagen (regen, druppels, bubbels, wind, voetstappen, haardvuur, zee, gekraak) die een soundscape vormen |
| [Bowed Ensemble](BowedEnsemble/AGENTS.md) | `nl.patchkamer.bowedensemble` | Een polyfoon strijkersensemble met 16 stemmen, strijkstokruis, ensemble-chorus en concertgalm |
| [Brass Section](BrassSection/AGENTS.md) | `nl.patchkamer.brass-section` | Een polyfoon koperinstrument met 1 tot 4 spelers per noot: een filter dat openzwelt (de blat), aanzetglijding, ademruis, vibrato met vertraging en een demper |
| [Celestial Mechanics](CelestialMechanics/AGENTS.md) | `nl.patchkamer.celestialmechanics` | Een zwaartekrachtsynth: elke noot wordt een planeet om een zon; Doppler, een zwart gat, een pulsar en kometen vormen de klank |
| [Chord Poly](ChordPoly/AGENTS.md) | `nl.patchkamer.chordpoly` | Een polyfone akkoordsynth (24 stemmen) die van elke noot een akkoord maakt, met chorus en drive |
| [Cinematic Synth](CinematicSynth/AGENTS.md) | `nl.patchkamer.cinematicsynth` | Een polyfone filmsynth: braams, pads, drones en een pulsmotor voor ostinati en arpeggio's, met echo en een grote galm |
| [Cross Mod Mono](CrossModMono/AGENTS.md) | `nl.patchkamer.crossmodmono` | Een monosynth met twee oscillatoren, hard sync, kruismodulatie op audiosnelheid, een patroon van 32 stappen en een arpeggiator |
| [Dissonant Cluster](DissonantCluster/AGENTS.md) | `nl.patchkamer.dissonantcluster` | Een polyfone synth die alleen dissonant klinkt: elke noot wordt een cluster van 2 tot 6 stemmen |
| [Drawbar Organ](DrawbarOrgan/AGENTS.md) | `nl.patchkamer.drawbarorgan` | Een orgel met trekkers, geïnspireerd op klassieke tonewheel-orgels: twee manualen met negen trekkers en basvoeten, toetscontact met aanzetklik, percussie, vibrato en chorus, een rotary-luidspreker, voorversterker en veerhall, plus een compact combo-orgelmodel |
| [Drone Synth](DroneSynth/AGENTS.md) | `nl.patchkamer.drone` | Een doorlopende drone met een sub, een tweede laag, ruis, een filter met LFO, delay, galm, willekeurige gebeurtenissen en een grondtoon-sequencer van 16 stappen |
| [Duofone](Duofone/AGENTS.md) | `nl.patchkamer.duofone` | Een synth met twee oscillatoren die twee toonhoogten tegelijk spelen, ringmodulatie, hard sync en sample & hold |
| [Formant Singer](FormantSinger/AGENTS.md) | `nl.patchkamer.formantsinger` | Een synth die een tekst zingt: elke noot zingt de volgende lettergreep, met zes stemtypen, een koor van maximaal acht zangers, vibrato en een manier om klanken direct te schrijven |
| [Foundry](Foundry/AGENTS.md) | `nl.patchkamer.foundry` | Een mono industriële klankvormer: FM, ringmodulatie, vier metalen resonatoren, overdrive en wavefolder, met een drone- en een notenstand |
| [Four-Operator FM](FourOperatorFM/AGENTS.md) | `nl.patchkamer.fouroperatorfm` | Een FM-synth met vier operators, acht algoritmes en acht stemmen |
| [Grain Cloud](GrainCloud/AGENTS.md) | `nl.patchkamer.graincloud` | Een granulaire synth en een granulair effect: een ingebouwde klank als synth, of live audio van de ingang als effect |
| [Guitar](Guitar/AGENTS.md) | `nl.patchkamer.guitar` | Een geplukte-snarenfamilie met eigen motor: staalsnarig, nylon, clean en overdrive elektrisch, gedempt, 12-snarig en basgitaar, met één stem per snaar, een strum-hulp, hammer-ons en buiging |
| [Karplus String](KarplusString/AGENTS.md) | `nl.patchkamer.string` | Een model van geplukte en gestreken snaren met acht stemmen en een eigen klavier van twee octaven |
| [Ladder Mono](LadderMono/AGENTS.md) | `nl.patchkamer.laddermono` | Een monofone analoge synth met drie oscillators, een 24 dB-laddermodel-filter dat zelf zingt, twee omhullingen, glide en een LFO |
| [Layered Landscape](LayeredLandscape/AGENTS.md) | `nl.patchkamer.layeredlandscape` | Een ambient-instrument met vier lagen (drone, pad, sfeer, ruistextuur) met een stereo-ruimte, een master-effect en patronen per laag |
| [Low Bass](LowBass/AGENTS.md) | `nl.patchkamer.lowbass` | Een mono bassynth zonder sequencer: twee oscillatoren, een sinus-sub, optioneel FM, drive en legato |
| [Mist](Mist/AGENTS.md) | `nl.patchkamer.mist` | Een drone- en ambient-synth die de klok volgt: een stilstaand akkoord met eigen akkoordgang en melodie, wind, galm en echo's |
| [Neuro Bass](NeuroBass/AGENTS.md) | `nl.patchkamer.neurobass` | Een mono bas voor drum & bass en bass music: een detune-stack van twee oscillatoren, een sub, FM en ringmodulatie, drie vervormtrappen, een vocaal formantfilter met een Morph-macro, een resonant filter en een LFO op tempo |
| [Paradox](Paradox/AGENTS.md) | `nl.patchkamer.paradox` | Een experimentele synth die zelf meebeweegt: chaos, een cellulaire automaat, een wavefolder en een granulair geheugen; bespeelbaar, drone of organisme |
| [Patch Mono](PatchMono/AGENTS.md) | `nl.patchkamer.patchmono` | Een monosynth in twee opbouwen (één of twee oscillatoren) met een audio-ingang en vier interne patchroutes |
| [Patchbay Synth](PatchbaySynth/AGENTS.md) | `nl.patchkamer.patchbaysynth` | Een halfmodulaire synth met een patchpaneel: drie VCO's, ringmodulator, filter, envelopes, sample & hold en kabels |
| [Piano](Piano/AGENTS.md) | `nl.patchkamer.piano` | Een pianofamilie met eigen motor: vleugel, pianino, honky-tonk, tine- en riet-e-piano en clavichord, met onharmonische deeltonen, verstemde snaren, hamergeluid, sustainpedaal en klankbord |
| [Poly Chorus](PolyChorus/AGENTS.md) | `nl.patchkamer.polychorus` | Een zesstemmige polyfone synth met zaagtand, puls, sub, ruis en een ingebouwde stereo-chorus |
| [Squelch Box](SquelchBox/AGENTS.md) | `nl.patchkamer.squelchbox` | Een getrouwe acid-bassynth, geïnspireerd op klassieke acid-bassmachines: één oscillator, een resonant diode-ladderfilter van 18 dB/oct, accent-sweep, slide en een sequencer van 16 stappen met tie |
| [Stage Keys](StageKeys/AGENTS.md) | `nl.patchkamer.stagekeys` | Een polyfone toetsensynth met zeven klankmodellen (tine- en reed-piano, orgels, vibrafoon, bas), drive en stereo-tremolo |
| [Sub Line](SubLine/AGENTS.md) | `nl.patchkamer.subline` | Een monosynth voor baslijnen en leads met een patroon van 32 stappen, een arpeggiator en een suboscillator |
| [Supersaw Swarm](SupersawSwarm/AGENTS.md) | `nl.patchkamer.supersawswarm` | Een polyfone supersaw: tot negen verstemde zagen per noot, chorus, ping-pongdelay, galm, trance-gate en pomp |
| [Triple Osc Poly](TripleOscPoly/AGENTS.md) | `nl.patchkamer.polysynth` | Een polyfone synth met drie oscillatoren (unison tot 7 stemmetjes), twee filters, een shaper en akkoorden |
| [Woodwinds](Woodwinds/AGENTS.md) | `nl.patchkamer.woodwinds` | Een houtblazersfamilie met eigen motor: dwarsfluit, klarinet, hobo, fagot, alt- en tenorsaxofoon, blokfluit en panfluit, met 1 tot 3 spelers per noot, afgestemd luchtruis, aanzettik, overblazen, vibrato met vertraging, legato-glijding, en beet en grom voor het riet |

<!-- agents-tree:end -->
