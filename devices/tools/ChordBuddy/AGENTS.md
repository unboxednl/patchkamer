# AGENTS.md: Chord Buddy

Dit bestand is voor AI-agents die dit apparaat configureren, er presets voor maken of het uitbreiden. Het is niet geschreven voor mensen. Het hoort bij `../../../AGENTS.md` (algemeen); lees die eerst. Hier staat wat alleen voor Chord Buddy geldt.

## Wat Chord Buddy is

Een hulpmiddel voor mensen zonder muziektheorie om akkoorden te vinden. De gebruiker kiest een toonsoort en (optioneel) een stijl, of speelt akkoorden op een MIDI-keyboard. Chord Buddy toont de akkoorden van de toonsoort, herkent gespeelde akkoorden (omkeringen, slash-akkoorden, onvolledige akkoorden), rangschikt de mogelijke toonsoorten met een zekerheid, stelt het volgende akkoord voor (veilig / spanning / kleur), bewaart akkoorden in 16 pads, speelt de pads als set (akkoorden en bas op aparte poorten) en geeft advies over bas en stemvoering. Het geeft advies, geen oordeel: stijlen en suggesties zijn richtlijnen.

| | |
|---|---|
| Bestand | `chord-buddy.patchkamer-device.js` (in deze map) |
| `id` | `nl.patchkamer.chordbuddy`. Verander die nooit: daaraan hangen presets en songs |
| Naam | `Chord Buddy`; alleen de poortnamen hebben een Nederlandse variant (`i18n`) |
| Soort | `utility` (categorie `tool`): Chord Buddy krijgt dus **presets** (geen tunes). Een set is een preset |
| Poorten | event-ingang `in`; event-uitgangen `chords` (akkoordnoten) en `bass` (basnoten); sturing-ingang `mod` (automatisch, door `params()`); geen audio |
| Contract | v1.19 (versie 1.2.0): `host.ui.adopt` met ids, `params()` plus `modExclude`, `host.frame`, tweetalig via `host.lang` |
| Licentie apparaat | AGPL-3.0-or-later |

## Gebeurtenissen

**In** (`onEvent('in', ev)`): `note`/`noteon` (met `held: true` of zonder `dur` blijft de noot staan tot `noteoff`; met `dur` verloopt hij vanzelf), `noteoff`, `allnotesoff`/`panic`. Noten in het bereik van de pads (`padBase` .. `padBase + 15`, alleen als `padMidi` aan staat) spelen die pad en worden niet beluisterd. Een akkoord wordt herkend als alle toetsen los zijn (de som van de noten sinds de vorige keer alles los was).

**Uit** (`chords` en `bass`): `{ type: 'note', note, vel, time, dur, ch }`, `noteoff` en `allnotesoff`. Bij Stop, een gestopte transport en `destroy()` volgt `noteoff` voor elke klinkende noot en `allnotesoff` op beide poorten. De set volgt de klok (`onStep`): Start wacht op de volgende maat (bij 1 of 2 slagen per akkoord: de volgende tel) en de bas wordt per zestiende uitgezonden, niet ver vooruit, zodat Stop geen toekomstige noten achterlaat.

## De state en de preset

`getState()` bevat alles. Een **preset** (`getPreset`/`setPreset`) bevat alleen de set: `name`, `key`, `scale`, `style`, `ext`, `pads`, `beats`, `loop`, `voiceOn`, `bassOn`, `bassMode`, `voices`, `voicing`. De rest (uitgang, MIDI-instellingen, gehoorde akkoorden, gekozen akkoord, kanalen) hoort niet in een preset.

| Veld | Wat | Bereik | Start | Preset |
|---|---|---|---|---|
| `key` | Grondtoon (pitch class) | 0 … 11 | 0 | ja |
| `scale` | Schaal-id: `major`, `minor`, `harmonic`, `melodic`, `dorian`, `phrygian`, `lydian`, `mixolydian`, `locrian`, `pentMajor`, `pentMinor`, `blues`, `bluesMinor` | | `major` | ja |
| `style` | `''` (geen) of `pop`, `rock`, `folk`, `blues`, `jazz`, `classical`, `soul`, `hiphop`, `house`, `ambient` | | `''` | ja |
| `ext` | `auto` (volgens stijl), `triad`, `seventh` | | `auto` | ja |
| `pads` | 16 posities: `null` of `{ r, q, b, n }`: `r` grondtoon 0 … 11, `q` akkoordsoort-id, `b` slash-bas (pitch class of `null`), `n` MIDI-noten (1 … 8) | | alles `null` | ja |
| `beats` | Duur per akkoord in tellen | 1, 2, 4, 8, 16 | 4 | ja |
| `loop`, `voiceOn`, `bassOn` | herhalen, stemvoering bij afspelen, bas aan | boolean | `true`, `false`, `true` | ja |
| `bassMode` | `hold`, `rootFifth`, `walking`, `pulse` | | `rootFifth` | ja |
| `voices`, `voicing` | aantal stemmen 2 … 6, `close`, `open`, `drop2` | | 4, `close` | ja |
| `name` | Naam van de set (taalneutraal, hoogstens 60 tekens) | | `""` | ja |
| `pad` | Gekozen pad (0 … 15) | | 0 | nee |
| `chosen`, `heard`, `cur` | Gekozen akkoord, laatste 4 gespeelde akkoorden, laatst gespeelde noten | | leeg | nee |
| `listen`, `follow`, `padMidi`, `padBase`, `lo` | luisteren, toonsoort volgen, pads via MIDI, eerste pad (36 = C2), laagste noot voor stemvoering | | `true`, `false`, `true`, 36, 48 | nee |
| `vel`, `bassVel`, `len`, `gate`, `strum` | velocity 0,05 … 1; velocity bas 0,05 … 1; lengte in s 0,1 … 4; gate 0,1 … 1; strum in ms 0 … 60 | | 0,8; 0,85; 1,2; 0,9; 0 | nee |
| `chordOct`, `bassOct`, `chCh`, `bassCh` | octaafverschuiving −2 … 2; MIDI-kanaal 1 … 16 | | 0, 0, 1, 1 | nee |

Akkoordsoort-id's (`q`): `maj`, `min`, `dim`, `aug`, `sus2`, `sus4`, `6`, `m6`, `7`, `maj7`, `m7`, `m7b5`, `dim7`, `mMaj7`, `add9`, `9`, `m9`, `maj9`, `7sus4`, `5` (en `maj7s5`, alleen uit schalen, niet herkend).

`setState` negeert onbekende velden, geeft ongeldige waarden de standaard en klemt getallen. Alleen `params()` ids (`vel`, `bassVel`, `len`, `gate`, `strum`) zijn stuurbaar; de rest staat in `modExclude`.

## Een set maken (preset of song)

Zet in `pads` de akkoorden in volgorde (pad 1 eerst, de rest `null`), met `n` als MIDI-noten (bijvoorbeeld `rootPosition`). Het presetpack `../../../presets/chord-buddy.patchkamer-presets.json` (30 sets) is gemaakt met de theorie uit dit bestand; de akkoorden staan als progressies in `THEORY.STYLES`.

## Opbouw van het bestand en tests

Het bestand heeft één puur JavaScript-blok `THEORY` (tussen `// <theory>` en `// </theory>`; geen host nodig) en daarna het apparaat. Alle muziektheorie zit in `THEORY`: `recognize`, `diatonic`, `detectKey` + `keyReasons`, `suggest`, `progressions`, `bassOptions` + `bassFigure`, `voiceLead`. Schalen (`SCALES`) en stijlen (`STYLES`) zijn data; een schaal toevoegen is een regel erbij (naam, intervallen, `fn` per trap, `prior`).

Test de theorie los: `node devices/tools/ChordBuddy/tests/theory.test.mjs` (355 gevallen, geen host). Daarna `node contract/validate-instrument.mjs devices/tools/ChordBuddy/chord-buddy.patchkamer-device.js --controls`.

## Vervolg (bewust niet in versie 1.0.0)

- Oosterse schalen en kwarttonen (maqam, raga) met pitchbend: de schaaldata is hier al op voorbereid (intervallen in halve tonen), maar kwarttonen vragen intervallen in cents en een pitchbend-uitgang.
- Ondersteunende melodietonen en tensions per akkoord (9/11/13) en "passende toonladder bovenop de set".
- Ritmepatroon voor de set (arpeggio's, comping-patronen).
- Akkoorden kopiëren naar Chord Sequencer of Clip Arranger (klembordformaat v1.17).
- Akkoordenschema exporteren als tekst (chord chart).
- Ear-training-modus (raad het akkoord).
- Mood-suggesties (vrolijk, triest, spannend) die stijl en schaal kiezen.
- Een slash-bas hoort bij de pad maar zit niet in de padnoten na "Pas stemvoering toe"; hij staat wel in het basadvies en de basfiguur.

## Niet beluisterd

De output is gecontroleerd op gebeurtenissen (noten, tijden, bereik, noot-uit), niet op klank. Beoordeel op gehoor of akkoorden en bas goed samenklinken.

## Documentatie en songs

Hier vind je de omgeving van dit apparaat: de soort, de overzichten en de handleiding voor mensen.

- Route voor agents: [soort Tools](../AGENTS.md) → [devices/AGENTS.md](../../AGENTS.md) → [root AGENTS.md](../../../AGENTS.md). Contract: [NL](../../../contract/PATCHKAMER-CONTRACT_NL.md) · [EN](../../../contract/PATCHKAMER-CONTRACT_EN.md). Hoe presets van dit apparaat zijn opgebouwd: [presets/AGENTS.md](../../../presets/AGENTS.md). <!-- agents-tree -->
- Handleiding van de soort (voor mensen): [NL](../../../docs/tools/USER-MANUAL_NL.md) · [EN](../../../docs/tools/USER-MANUAL_EN.md); overzicht: [README](../README.md).
- Een song componeren met dit apparaat: [songs/AGENTS.md](../../../songs/AGENTS.md).
