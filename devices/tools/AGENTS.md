# AGENTS.md: devices/tools/ (Tools)

Dit bestand is voor AI-agents die een apparaat, tune of preset in de soort **Tools** maken of gebruiken, of een song met zulke apparaten componeren. Het is niet geschreven voor mensen. Helpers om te spelen, op te nemen, te meten en te herkennen: toetsen, controllers, MIDI, opname, notities, scope, en de zoekers die uit audio noten, drumpatronen of een passende tune halen.

## Plaats in de boom

- Omhoog: [devices/AGENTS.md](../AGENTS.md) (alle apparaten in een song, kabelsoorten, de klok) en de [root AGENTS.md](../../AGENTS.md) (het contract en de regels voor elk nieuw apparaat).
- Omlaag: de `AGENTS.md` van elk apparaat in deze soort, in de tabel hieronder.
- Opzij: [presets/AGENTS.md](../../presets/AGENTS.md) (hoe presets zijn opgebouwd en gemaakt) en [songs/AGENTS.md](../../songs/AGENTS.md) (een song componeren).
- Voor mensen: [README](README.md) en de handleiding [NL](../../docs/tools/USER-MANUAL_NL.md) · [EN](../../docs/tools/USER-MANUAL_EN.md). Die zijn niet bedoeld als instructie voor agents.

## Wat deze soort is en wat je moet weten

- `kind: 'utility'`. Tools hebben **presets** voor hun instellingen, nooit voor hun resultaat of de audio.
- De zoekers (Bass Finder, Drum Listener, Tune Finder, Stem Splitter) analyseren audio lokaal of via een dienst en leveren hun resultaat als clip voor het klembord (contract §13d) of als een tune; ze nemen audio aan via `loadAudio` (bestand, tab Samples) en via de audio-ingang. Hun toetsscripts (`docs/tools/eval-*.py`, `check-*.mjs`) horen bij het apparaat: draai ze na een wijziging van de analyse.
- Het contract: [NL](../../contract/PATCHKAMER-CONTRACT_NL.md) · [EN](../../contract/PATCHKAMER-CONTRACT_EN.md); de validator `contract/validate-instrument.mjs` (draai hem in gewoon, `--lang en` en `--lang nl`).

## Een nieuw apparaat in deze soort bouwen

1. Lees de [root AGENTS.md](../../AGENTS.md) helemaal en het contract. Controleer eerst dat contract en validator dezelfde versie hebben.
2. Zet het apparaat in `devices/tools/<Naam>/<naam>.patchkamer-device.js` (naam met hoofdletter, bestand in kleine letters met streepjes, zonder versienummer) met een eigen `AGENTS.md` en een `icon.svg` (zie [het icoon van een apparaat](../AGENTS.md#het-icoon-van-een-apparaat)).
3. Maak presets en bijbehorende documentatie volgens [presets/AGENTS.md](../../presets/AGENTS.md).
4. Werk de documentatie bij zoals in de root `AGENTS.md` staat (README's, handleidingen, changelog, in twee talen), draai `python3 docs/tools/list-devices.py` en `python3 docs/tools/agents-tree.py --write`.

## De apparaten

Dit overzicht komt uit `devices/AGENTS.md` en wordt gegenereerd door `docs/tools/agents-tree.py --write`; verander het niet met de hand.

<!-- agents-tree:begin -->

| Apparaat | `id` | Wat het doet |
|---|---|---|
| [Bass Finder](BassFinder/AGENTS.md) | `nl.patchkamer.bass-finder` | Luistert naar een monofone baslijn (een bestand, een sample uit de bibliotheek of een opname uit de ingang) en schrijft de noten op: toonhoogte, start, lengte en velocity, op een raster van 1/8, 1/16 of triool 1/16 of vrij; je kunt de noten corrigeren, met de klok van de studio op een synth spelen, of als clip **Kopiëren** en in een sequencer **Plakken** |
| [Chord Buddy](ChordBuddy/AGENTS.md) | `nl.patchkamer.chordbuddy` | Helpt akkoorden te vinden zonder muziektheorie: kies een toonsoort en stijl of speel een akkoord op een MIDI-keyboard, krijg akkoord-, toonsoort- en vervolgsuggesties, bewaar akkoorden in 16 pads, speel de pads als set met een aparte bas en krijg advies over bas en stemvoering |
| [Control Surface](ControlSurface/AGENTS.md) | `nl.patchkamer.controlsurface` | *Teruggetrokken, vervangen door de MIDI Controller en het Keyboard.* Toont een MIDI-controller met knoppen, schuiven, pads en drukknoppen als paneel met een indeling die je uit secties bouwt; stuurt wat je doet door als CC |
| [Drum Listener](DrumListener/AGENTS.md) | `nl.patchkamer.drum-listener` | Luistert naar een drumloop (een audiobestand, een sample uit de bibliotheek of een opname uit de ingang) en schrijft het patroon op: kick, snare, hats, toms en percussie op eigen banen; speelt het naar een drumcomputer of kopieert het naar een sequencer |
| [Keyboard](Keyboard/AGENTS.md) | `nl.patchkamer.keyboard` | Een klavier met instelbaar aantal toetsen (25 tot 88) dat noten naar andere apparaten stuurt: schermtoetsen, computertoetsen, pitch bend, modulatie, sustain |
| [Keys / MIDI](Keys/AGENTS.md) | `nl.patchkamer.keys` | *Teruggetrokken, vervangen door de MIDI Controller en het Keyboard.* Een keyboard (scherm, computertoetsen of MIDI) dat noten naar andere apparaten stuurt |
| [Metronome](Metronome/AGENTS.md) | `nl.patchkamer.klik` | Een tik op elke maat, tel, achtste of zestiende van de klok van de studio; dezelfde slagen gaan als trigs naar buiten |
| [MIDI Controller](MidiController/AGENTS.md) | `nl.patchkamer.midicontroller` | Al je MIDI-controllers en -keyboards tegelijk: kies welk apparaat je bedient, schakel met een knop tussen apparaten, koppel snel (indeling, voorstel, snel koppelen), bewaar koppelingen als presets |
| [MIDI Hub](MidiHub/AGENTS.md) | `nl.patchkamer.midihub` | *Teruggetrokken, vervangen door de MIDI Controller en het Keyboard.* Verbindt MIDI-bronnen en sequencersporen met apparaten en zet elke regelaar van een apparaat op een knop, schuif of pad van je MIDI-apparaat; bewaart koppelingen per apparaat |
| [Multitrack](Multitrack/AGENTS.md) | `nl.patchkamer.multitrack` | Neemt tot 16 sporen op uit een bundel, een WAV per spoor |
| [Notes](Notes/AGENTS.md) | `nl.patchkamer.notes` | Een notitieblok met toonsoort, tempo, delen en een takenlijst; geen geluid, geen poorten |
| [Pad Controller](PadController/AGENTS.md) | `nl.patchkamer.padcontroller` | *Teruggetrokken, vervangen door de MIDI Controller en het Keyboard.* Koppelt apparaten aan een raster van 40 pads (8 × 5) op een MIDI-controller; je kiest zelf de MIDI-ingang en de uitgang voor de lampjes |
| [Recorder](Recorder/AGENTS.md) | `nl.patchkamer.recorder` | Neemt op wat er binnenkomt en geeft het ongewijzigd door; bewaart WAV, MP3 of WebM/MP4 |
| [Scope](Scope/AGENTS.md) | `nl.patchkamer.scope` | Toont het geluid (spectrum, golfvorm, spectrogram, stereobeeld, peak/RMS); geeft het ongewijzigd door |
| [Stem Splitter](StemSplitter/AGENTS.md) | `nl.patchkamer.stemsplitter` | Splitst een nummer in stems (zang, drums, bas, rest) met een dienst op internet, wat geld kost per nummer en de rechten op de muziek vraagt; een bestand, een sample uit de bibliotheek of een opname uit de ingang gaat erin, een uitgang per stem en een bundel komen eruit, met de klok van de studio gespeeld; bewaart de stems als WAV en geeft de drums aan de Drum Listener |
| [Tune Finder](TuneFinder/AGENTS.md) | `nl.patchkamer.tune-finder` | Luistert naar een geluid (een noot, een korte frase, een basloopje of een akkoord van één instrument, uit een bestand of een opname) en zoekt de synth en tune uit de bibliotheek die er het dichtst bij komt, gerangschikt op klankkleur, harmonischen, aanzet en verloop; **Laden** zet de gekozen tune op die synth in de werkruimte |

<!-- agents-tree:end -->
