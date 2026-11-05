# AGENTS.md: presets/

Dit bestand is voor AI-agents die presets **maken** voor Patchkamer-apparaten, en voor agents die presets **gebruiken** in een song. Het is niet geschreven voor mensen. Het hoort bij de algemene instructies in `../AGENTS.md`; lees die eerst. Songs: begin bij `../songs/AGENTS.md`; de apparaten staan in `../devices/AGENTS.md`.

## Wat een preset is

Een preset is de instelling van een apparaat **zonder eigen geluid**: `kind` `effect`, `mixer`, `output`, `utility` of `modulator` (effecten, mastering, mixer, sequencers, modulators, tools). Apparaten die geluid maken (`kind: 'instrument'`) krijgen **tunes**, die staan in `../tunes/` (zie `../tunes/AGENTS.md`). Contract: `../contract/PATCHKAMER-CONTRACT_NL.md` §0 en §13c. Handleiding voor mensen: [Presets: gebruikershandleiding](../docs/presets/USER-MANUAL_NL.md) (Engels: `../docs/presets/USER-MANUAL_EN.md`).

Licentie van alles in deze map: **`CC0-1.0`** (zie `LICENSE` en `../LICENSING.md`). Songs die presets gebruiken zijn `CC-BY-4.0`; de apparaten `AGPL-3.0-or-later`.

## Het formaat

Eén pack per bestand, in deze map: `naam.patchkamer-presets.json`, zonder versienummer in de naam (revisies staan in git). `formatVersion` is **2** (formatVersion 1, met een platte lijst `presets`, blijft werken maar maak je niet meer).

```json
{ "format": "patchkamer-presets", "formatVersion": 2, "device": "nl.patchkamer.lfo", "name": "LFO Basics",
  "author": "…", "license": "CC0-1.0", "description": "…",
  "tree": [ { "folder": "Vibrato & Tremolo", "items": [
      { "name": "Gentle Vibrato", "kind": "set", "version": "1.0.0", "state": { } } ] } ] }
```

- `device` is de `id` van het apparaat, letterlijk (zie de tabel hieronder en `../devices/AGENTS.md`).
- `tree` is een boom van mappen (`folder` met `items`) en presets. Alle meegeleverde packs hebben mappen op één niveau; mappen in mappen mogen.
- Elke preset heeft `name`, `kind` en `state`; de meegeleverde presets hebben ook `version` (`"1.0.0"`). Elke meegeleverde preset is `kind: 'set'`. (`kind: 'part'` is voor een los instrument binnen een drumcomputer en hoort bij tunes.)

## Regels

1. **`state` is wat `getPreset()` van het apparaat teruggeeft**, of `getState()` als het geen `getPreset` heeft (contract §13). Lees de `AGENTS.md` in de map van het apparaat (`../devices/<soort>/<Naam>/AGENTS.md`): daar staan de sleutels, bereiken en wat er niet in hoort. Verzin geen velden; onbekende velden worden genegeerd, ontbrekende krijgen hun standaardwaarde, en je preset klinkt dan anders dan je bedoelde, zonder foutmelding.
2. **Geen routing en geen sessiegegevens.** Bronkeuzes (bijvoorbeeld `src` per kanaal in de Mixer), toewijzingen aan andere apparaten (bij LFO `sel`), lopende posities, opnames en AudioNodes horen niet in een preset. Een apparaat met `getPreset` laat die velden zelf weg; neem ze dus niet uit een `getState()` over.
3. **Licentie `CC0-1.0`** op het pack en op elk item dat een eigen `license` krijgt. Maak geen preset op basis van werk met een andere licentie, tenzij die ook CC0 of publiek domein is; noteer anders `basedOn: { name, author, license }` en meld het.
4. **Engelse namen** voor packs, mappen en presets (en voor de beschrijving van het pack). Alleen teksten in de interface zijn per taal.
5. **Geen merknamen of productnamen** van bestaande instrumenten, artiesten, labels of nummers, nergens in het bestand. Genres en muziektermen mogen.
6. Zet je eigen naam in `author`; verzin geen persoon.
7. Wijzig het apparaat niet om een preset te laten kloppen, en verander nooit de `id` of `kind` van een apparaat: daaraan hangen de presets en songs van gebruikers.

## Controleren

Er is geen aparte validator voor presets. Controleer zelf:

1. Geldige JSON: `node -e "JSON.parse(require('fs').readFileSync(process.argv[1],'utf8'))" presets/<bestand>`.
2. `format` is `"patchkamer-presets"`, `formatVersion` is `2`, `device` bestaat in `../devices/` en dat apparaat heeft **niet** `kind: 'instrument'`.
3. Elke sleutel in elke `state` komt voor in de state van dat apparaat (lees de `AGENTS.md` van het apparaat), binnen het bereik.
4. Laad het pack in de host: open `../patchkamer/patchkamer.html` via een lokale webserver, plaats het apparaat, kies **Presets → Importeren** en kies de presets. Zie `../patchkamer/AGENTS.md` en voor een scriptvoorbeeld `../docs/tools/make-device-screenshots.py`. Heb je geen browser, schrijf dan in je oplevering dat de hosttest niet is uitgevoerd.
5. Draai na het toevoegen van een pack `python3 docs/tools/list-devices.py --check`: de tabel hieronder en die in `../devices/AGENTS.md` moeten kloppen (zie de opdracht onderaan).

## Een preset in een song gebruiken

Een song bevat de **state** van elk apparaat; het presetbestand zelf reist niet mee. Dus:

1. Zoek het pack van het apparaat in de tabel hieronder en kies een preset (`tree`, `folder`, `name`).
2. Kopieer `state` van die preset naar `state` van het apparaat in `workspace.devices` van de song. Voor een apparaat met `getPreset` ontbreken dan de routing- en sessievelden; de host vult ze met hun standaardwaarde. Wil je die wel (bijvoorbeeld de toewijzingen `sel` van een LFO, of `src` in de Mixer), voeg ze dan zelf toe volgens de `AGENTS.md` van het apparaat, met `id`'s van apparaten en parameters die echt in de song staan.
3. Pas daarna alleen aan wat bij deze song hoort (bijvoorbeeld de snelheid van een LFO, een patroon in een sequencer, of het volume).
4. Een apparaat in de song heeft ook de optionele sleutel `preset`: `{ lid, pid, name }`. Dat is alleen een aanwijzing voor de host welke preset je als uitgangspunt gebruikte: `lid` is de id van de bibliotheek en `pid` die van de preset, `name` de naam die de kaart toont. De host maakt `lid` en `pid` zelf bij het importeren van een pack (willekeurige waarden die per browser verschillen), dus je kunt ze niet vooraf weten en een andere gebruiker heeft ze niet. **Laat `preset` daarom weg.** De host schrijft het zelf alleen als de preset ongewijzigd is, en toont de naam met "bibliotheek niet geladen" als hij hem niet vindt.
5. Controleer de song met `python3 docs/tools/check-song.py <song>`.

Presets van sequencers bevatten het patroon en de instellingen, maar niet de werkstand van de kaart (zoals het gekozen spoor en de zoom). Een preset van Clip Arranger is een songstarter met sporen, scènes en een arrangement; die hoef je dus niet opnieuw te schrijven, maar je moet de uitgangen (`track1`, …) zelf aan instrumenten koppelen.

## De packs

De tabel wordt gegenereerd uit de pack-bestanden; verander hem niet met de hand. Opnieuw genereren (vanuit de root van de repo):

```
python3 docs/tools/list-devices.py
```

Hij werkt ook `devices/AGENTS.md` en `tunes/AGENTS.md` bij. De mappen zijn de mappen op het hoogste niveau van het pack. Overzicht en handleiding: [presets/README_NL.md](README_NL.md), [docs/presets/USER-MANUAL_NL.md](../docs/presets/USER-MANUAL_NL.md#de-packs-die-met-patchkamer-meekomen).

<!-- list-devices:begin presets -->
| Apparaat | Pack | Presets | Mappen op het hoogste niveau | Bestand | formatVersion |
|---|---|---|---|---|---|
| [Chorus](../devices/effects/Chorus/) | Chorus Basics | 12 | 4: Subtle, Ensemble, Movement, Extreme | [`chorus.patchkamer-presets.json`](chorus.patchkamer-presets.json) | 2 |
| [Effect Chain](../devices/effects/EffectChain/) | Effect Chain Basics | 14 | 4: Atmosphere, Studio, Club, Sound Design | [`effect-chain.patchkamer-presets.json`](effect-chain.patchkamer-presets.json) | 2 |
| [Filter](../devices/effects/Filter/) | Filter Basics | 14 | 3: Basics, Movement, Aggressive | [`filter.patchkamer-presets.json`](filter.patchkamer-presets.json) | 2 |
| [Flanger](../devices/effects/Flanger/) | Flanger Basics | 12 | 4: Classic, Subtle, Tempo, Extreme | [`flanger.patchkamer-presets.json`](flanger.patchkamer-presets.json) | 2 |
| [Frequency Shifter](../devices/effects/FrequencyShifter/) | Frequency Shifter Basics | 13 | 3: Subtle, Inharmonic, Feedback | [`frequency-shifter.patchkamer-presets.json`](frequency-shifter.patchkamer-presets.json) | 2 |
| [Grit](../devices/effects/Grit/) | Grit Basics | 12 | 3: Warm, Motion, Extreme | [`grit.patchkamer-presets.json`](grit.patchkamer-presets.json) | 2 |
| [Phaser](../devices/effects/Phaser/) | Phaser Basics | 11 | 3: Classic, Tempo, Extreme | [`phaser.patchkamer-presets.json`](phaser.patchkamer-presets.json) | 2 |
| [Pump](../devices/effects/Pump/) | Pump Basics | 13 | 3: Clock, Sidechain, Split and Mix | [`pump.patchkamer-presets.json`](pump.patchkamer-presets.json) | 2 |
| [Resonator](../devices/effects/Resonator/) | Resonator Basics | 13 | 3: Subtle, Chords, Extreme | [`resonator.patchkamer-presets.json`](resonator.patchkamer-presets.json) | 2 |
| [Room](../devices/effects/Room/) | Room Basics | 12 | 3: Spaces, Delays, Space FX | [`room.patchkamer-presets.json`](room.patchkamer-presets.json) | 2 |
| [Tremolo](../devices/effects/Tremolo/) | Tremolo Basics | 13 | 4: Classic, Slow, Rhythmic, Extreme | [`tremolo.patchkamer-presets.json`](tremolo.patchkamer-presets.json) | 2 |
| [Vocoder](../devices/effects/Vocoder/) | Vocoder Basics | 14 | 4: Voices, Textures, Extreme, External | [`vocoder.patchkamer-presets.json`](vocoder.patchkamer-presets.json) | 2 |
| [Balance EQ](../devices/mastering/BalanceEQ/) | Balance EQ Situations and Styles | 128 | 10: Situations, Styles, Club, Festival, Big Room, Home / Hi-Fi, Headphones, Studio / Reference, Radio / Broadcast, Car | [`balance-eq.patchkamer-presets.json`](balance-eq.patchkamer-presets.json) | 2 |
| [Bus Compressor](../devices/mastering/BusCompressor/) | Bus Compressor Situations and Styles | 128 | 10: Situations, Styles, Club, Festival, Big Room, Home / Hi-Fi, Headphones, Studio / Reference, Radio / Broadcast, Car | [`bus-compressor.patchkamer-presets.json`](bus-compressor.patchkamer-presets.json) | 2 |
| [Listening Output](../devices/mastering/ListeningOutput/) | Listening Output Levels | 5 | 1: Levels | [`listening-output.patchkamer-presets.json`](listening-output.patchkamer-presets.json) | 2 |
| [Master Chain](../devices/mastering/MasterChain/) | Master Chain Situations and Styles | 128 | 10: Situations, Styles, Club, Festival, Big Room, Home / Hi-Fi, Headphones, Studio / Reference, Radio / Broadcast, Car | [`master-chain.patchkamer-presets.json`](master-chain.patchkamer-presets.json) | 2 |
| [Master Director](../devices/mastering/MasterDirector/) | Master Director Situations and Styles | 128 | 10: Situations, Styles, Club, Festival, Big Room, Home / Hi-Fi, Headphones, Studio / Reference, Radio / Broadcast, Car | [`master-director.patchkamer-presets.json`](master-director.patchkamer-presets.json) | 2 |
| [Mix Check](../devices/mastering/MixCheck/) | Mix Check Monitoring | 18 | 2: Monitoring, Situations | [`mix-check.patchkamer-presets.json`](mix-check.patchkamer-presets.json) | 2 |
| [Multiband Balance](../devices/mastering/MultibandBalance/) | Multiband Balance Situations and Styles | 128 | 10: Situations, Styles, Club, Festival, Big Room, Home / Hi-Fi, Headphones, Studio / Reference, Radio / Broadcast, Car | [`multiband-balance.patchkamer-presets.json`](multiband-balance.patchkamer-presets.json) | 2 |
| [Patina](../devices/mastering/Patina/) | Patina Situations and Styles | 128 | 10: Situations, Styles, Club, Festival, Big Room, Home / Hi-Fi, Headphones, Studio / Reference, Radio / Broadcast, Car | [`patina.patchkamer-presets.json`](patina.patchkamer-presets.json) | 2 |
| [Stereo Space](../devices/mastering/StereoSpace/) | Stereo Space Situations and Styles | 128 | 10: Situations, Styles, Club, Festival, Big Room, Home / Hi-Fi, Headphones, Studio / Reference, Radio / Broadcast, Car | [`stereo-space.patchkamer-presets.json`](stereo-space.patchkamer-presets.json) | 2 |
| [Audio Input](../devices/mixer/AudioInput/) | Audio Input Basics | 31 | 5: Line Level, Voice, Instruments, Interface Channels, Utility | [`audio-input.patchkamer-presets.json`](audio-input.patchkamer-presets.json) | 2 |
| [Audio Output](../devices/mixer/AudioOutput/) | Audio Output Basics | 16 | 4: Main Out, Headphones, Interface Pairs, Checks | [`audio-output.patchkamer-presets.json`](audio-output.patchkamer-presets.json) | 2 |
| [Leveler](../devices/mixer/Leveler/) | Leveler Basics | 11 | 3: Sources, Mix, Utility | [`leveler.patchkamer-presets.json`](leveler.patchkamer-presets.json) | 2 |
| [Drift](../devices/modulators/Drift/) | Drift Presets | 44 | 7: Subtle Life, Slow Evolution, Wide Wander, Restless, Together & Apart, Per Style, Group Ensembles | [`drift.patchkamer-presets.json`](drift.patchkamer-presets.json) | 2 |
| [Follower](../devices/modulators/Follower/) | Follower Basics | 14 | 3: Level, Onsets, Extreme | [`follower.patchkamer-presets.json`](follower.patchkamer-presets.json) | 2 |
| [LFO](../devices/modulators/Lfo/) | LFO Basics | 60 | 10: Vibrato & Tremolo, Pan & Space, Filter Sweeps, Wobble, Rhythmic Gates, Step Patterns, Generative, Slow & Ambient, Trigger Envelopes, By Genre | [`lfo.patchkamer-presets.json`](lfo.patchkamer-presets.json) | 2 |
| [Macro](../devices/modulators/Macro/) | Macro Basics | 40 | 5: Performance Sets, Pairs, Build-ups, Styles, Sound Design | [`macro.patchkamer-presets.json`](macro.patchkamer-presets.json) | 2 |
| [Multi-Segment Envelope](../devices/modulators/Mseg/) | Multi-Segment Envelope Presets | 54 | 9: Build-ups, Drops & Breaks, Filter Sweeps, Steps, Breathing & Swells, Gates & Ratchets, Pumps & Plucks, Generative & Ambient, By Style | [`mseg.patchkamer-presets.json`](mseg.patchkamer-presets.json) | 2 |
| [Swell](../devices/modulators/Swell/) | Swell Presets | 55 | 8: Pads & Atmospheres, Warm & Close, Bright & Open, Tempo Synced, Subtle & Natural, Big & Expressive, Generative & Evolving, By Application | [`swell.patchkamer-presets.json`](swell.patchkamer-presets.json) | 2 |
| [Chord Sequencer](../devices/sequencers/ChordSequencer/) | Chord Sequencer Styles | 80 | 14: Pop, Ballad, Cinematic, Film Score, Ambient, Trance, Synthwave, Lo-fi, Neo-classical, Deep House, Funk & Disco, Dynamics, Rolls, Melodies | [`chord-sequencer.patchkamer-presets.json`](chord-sequencer.patchkamer-presets.json) | 2 |
| [Clip Arranger](../devices/sequencers/ClipArranger/) | Clip Arranger Song Starters | 58 | 10: Pop & Rock, Electronic Dance, Bass Music, Hip-Hop & Chill, Funk, Soul & Disco, Jazz & Blues, Reggae & World, Ambient & Cinematic, Classical & Neo-Classical, Retro & Game | [`clip-arranger.patchkamer-presets.json`](clip-arranger.patchkamer-presets.json) | 2 |
| [Euclidean Rhythms](../devices/sequencers/EuclideanRhythms/) | Euclidean Rhythms Grooves | 65 | 8: Techno, House, Afro & Latin, Dub & Reggae, Drum & Bass and Breakbeat, Odd Meters and Polymeters, Fills and Rolls, Melodic (notes) | [`euclidean-rhythms.patchkamer-presets.json`](euclidean-rhythms.patchkamer-presets.json) | 2 |
| [Pattern Playlist](../devices/sequencers/PatternPlaylist/) | Pattern Playlist Arrangements | 35 | 5: Dance Floor, Bass Music, Hip-hop and Soul, Song Forms, Ambient and Cinematic | [`pattern-playlist.patchkamer-presets.json`](pattern-playlist.patchkamer-presets.json) | 2 |
| [Pattern Tracker](../devices/sequencers/PatternTracker/) | Pattern Tracker Modules | 34 | 4: Module Classics, Songwriting Forms, World and Latin, Electronic Rows | [`pattern-tracker.patchkamer-presets.json`](pattern-tracker.patchkamer-presets.json) | 2 |
| [Scale Arpeggiator](../devices/sequencers/ScaleArpeggiator/) | Scale Arpeggiator Patterns | 59 | 10: Classic Patterns, Trance and Dance, House and Disco, Synthwave and Retro, Ambient and Cinematic, Funk and Jazz, Fine Grids and Rolls, Dynamics, Generative, Live Playing | [`scale-arpeggiator.patchkamer-presets.json`](scale-arpeggiator.patchkamer-presets.json) | 2 |
| [Step Sequencer](../devices/sequencers/StepSequencer/) | Step Sequencer Patterns | 70 | 6: Bass Lines, Arpeggios, Drum Triggers, Melodic Hooks, Long Notes & Pads, Polymeter & Feel | [`step-sequencer.patchkamer-presets.json`](step-sequencer.patchkamer-presets.json) | 2 |
| [Wanderer](../devices/sequencers/Wanderer/) | Wanderer Melodies | 60 | 9: Lead Lines, Basslines, Arps and Plucks, Ambient and Slow, Genre Starters, Dynamics, Rolls and Ratchets, Follow Chord, Evolving | [`wanderer.patchkamer-presets.json`](wanderer.patchkamer-presets.json) | 2 |
| [Metronome](../devices/tools/Metronome/) | Metronome Basics | 9 | 3: Practice, Subdivisions, Loud | [`metronome.patchkamer-presets.json`](metronome.patchkamer-presets.json) | 2 |
| [MIDI Hub](../devices/tools/MidiHub/) | MIDI Hub Basics | 15 | 4: Sound Controllers, Wheels and Pedals, Effects, Utility | [`midi-hub.patchkamer-presets.json`](midi-hub.patchkamer-presets.json) | 2 |

Samen 40 packs met 1882 presets.
<!-- list-devices:end presets -->

## Wat je niet doet

- Geen tunes in deze map en geen presets in `../tunes/`.
- Geen geheimen of persoonlijke gegevens in een bestand.
- Commit of push niet, tenzij de opdracht dat vraagt.
