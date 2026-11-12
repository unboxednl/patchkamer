# AGENTS.md: devices/drums/ (Drums)

Dit bestand is voor AI-agents die een apparaat, tune of preset in de soort **Drums** maken of gebruiken, of een song met zulke apparaten componeren. Het is niet geschreven voor mensen. Drumcomputers en percussie: een eigen stappenpatroon, aparte uitgangen per geluid en een ingang waarop een sequencer trigs kan sturen.

## Plaats in de boom

- Omhoog: [devices/AGENTS.md](../AGENTS.md) (alle apparaten in een song, kabelsoorten, de klok) en de [root AGENTS.md](../../AGENTS.md) (het contract en de regels voor elk nieuw apparaat).
- Omlaag: de `AGENTS.md` van elk apparaat in deze soort, in de tabel hieronder.
- Opzij: [tunes/AGENTS.md](../../tunes/AGENTS.md) (hoe tunes zijn opgebouwd en gemaakt) en [songs/AGENTS.md](../../songs/AGENTS.md) (een song componeren).
- Voor mensen: [README](README.md) en de handleiding [NL](../../docs/drums/USER-MANUAL_NL.md) · [EN](../../docs/drums/USER-MANUAL_EN.md). Die zijn niet bedoeld als instructie voor agents.

## Wat deze soort is en wat je moet weten

- `kind: 'instrument'`; meestal een eigen patroon in de `state`, uitgang `audio uit` of een `multi`-bundel met een uitgang per geluid voor de Mixer, en `event in` voor trigs.
- Een drumapparaat heeft **tunes**; bij een drumcomputer horen `parts` (de klanken) en een naam per klank voor de sequencers.
- Het contract: [NL](../../contract/PATCHKAMER-CONTRACT_NL.md) · [EN](../../contract/PATCHKAMER-CONTRACT_EN.md); de validator `contract/validate-instrument.mjs` (draai hem in gewoon, `--lang en` en `--lang nl`).

## Een nieuw apparaat in deze soort bouwen

1. Lees de [root AGENTS.md](../../AGENTS.md) helemaal en het contract. Controleer eerst dat contract en validator dezelfde versie hebben.
2. Zet het apparaat in `devices/drums/<Naam>/<naam>.patchkamer-device.js` (naam met hoofdletter, bestand in kleine letters met streepjes, zonder versienummer) met een eigen `AGENTS.md` en een `icon.svg` (zie [het icoon van een apparaat](../AGENTS.md#het-icoon-van-een-apparaat)).
3. Maak tunes en bijbehorende documentatie volgens [tunes/AGENTS.md](../../tunes/AGENTS.md).
4. Werk de documentatie bij zoals in de root `AGENTS.md` staat (README's, handleidingen, changelog, in twee talen), draai `python3 docs/tools/list-devices.py` en `python3 docs/tools/agents-tree.py --write`.

## De apparaten

Dit overzicht komt uit `devices/AGENTS.md` en wordt gegenereerd door `docs/tools/agents-tree.py --write`; verander het niet met de hand.

<!-- agents-tree:begin -->

| Apparaat | `id` | Wat het doet |
|---|---|---|
| [Acoustic Drums](AcousticDrums/AGENTS.md) | `nl.patchkamer.acousticdrums` | Een gesampled akoestisch drumstel voor funk, soul en jazz: opnames die na een klik via een link worden geladen (CC0, grootte vooraf zichtbaar), velocity-lagen met een zachte overgang, round robin, ghost notes en rimshots op de snare, een hi-hat die natuurlijk afkapt, bekkens, toms, kiesbare microfoons en losse uitgangen; patroon kopiëren en plakken als drums |
| [Click Synth](ClickSynth/AGENTS.md) | `nl.patchkamer.clicksynth` | Een percussiesynth voor kliks, tiks, bleeps, zaps, hout, glas en glitches: acht sporen met een eigen klankmotor, willekeur en polyritme; patroon kopiëren en plakken, met kans, ratchet en eigen spoorlengte; uitlijnen op spoornaam |
| [Drum Kit](DrumKit/AGENTS.md) | `nl.patchkamer.drumkit` | Een drumworkstation met tot 16 kanalen gesynthetiseerde instrumenten, vier patronen van maximaal 64 stappen, een aparte uitgang per kanaal en noten of trigs in; patroon A tot D kopiëren en plakken als drums; velocity, kans en ratchet gaan mee en de lengte blijft die van de kit |
| [Drum Machine](DrumMachine/AGENTS.md) | `nl.patchkamer.drummachine` | Een eenvoudige drumcomputer met vier geluiden (kick, snare, hat, perc) van elk 16 stappen, met tune, decay, toon, niveau en pan per geluid; patroon kopiëren en plakken (alleen aan/uit, per baan op soort uitgelijnd) |
| [Groovebox 12](Groovebox12/AGENTS.md) | `nl.patchkamer.groovebox12` | Een groovebox met 12 tracks (drum- en synthmachines), polymeter, parameter locks, trig-condities, 8 patronen met een ketting, een FX-blok, delay en galm; het bewerkte patroon met alle 12 tracks kopiëren en plakken (stappen, lengtes, kans en ratchet; tussen twee Groovebox 12's ook klank, p-locks en condities) |
| [Latin Percussion](LatinPercussion/AGENTS.md) | `nl.patchkamer.latinpercussion` | Vijftien gesynthetiseerde latin-percussieklanken (bongo's, conga's, timbales, agogo's, shakers, fluitjes) met pads, vier banken patronen en trigs in; gekozen bank kopiëren en plakken (accent blijft; uitlijnen op klanknaam) |
| [Pulse Drums](PulseDrums/AGENTS.md) | `nl.patchkamer.pulsedrums` | Een drumworkstation voor techno: gelaagde kick, FM-percussie, een eigen lengte per kanaal (polymeter, Euclid), rumble-bus en grit; patroon A tot D kopiëren en plakken als drums, met polymeter en microtiming; every, phase, fill en locks gaan alleen mee naar een ander exemplaar van Pulse Drums |

<!-- agents-tree:end -->
