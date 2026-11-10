# AGENTS.md: Audio Output

Dit bestand is voor AI-agents die dit apparaat configureren. Het is niet geschreven voor mensen. Het hoort bij `../../../AGENTS.md` (algemeen); lees die eerst. Hier staat wat alleen voor Audio Output geldt.

## Wat Audio Output is

Een uitgang naast Speakers waarvoor de gebruiker zelf een uitgang van de computer kiest: de standaarduitgang of een audio-interface die het besturingssysteem aanbiedt. De browser levert de lijst (`navigator.mediaDevices.enumerateDevices`, soort `audiooutput`) en de keuze (`selectAudioOutput` waar die bestaat). **Er staan geen namen van interfaces of merken in het bestand**; de namen komen van het systeem.

| | |
|---|---|
| Bestand | `audio-output.patchkamer-device.js` (in deze map) |
| `id` | `nl.patchkamer.audiooutput`. Verander die nooit: daaraan hangen presets en songs van gebruikers |
| Soort | `output`; krijgt dus **presets** en nooit tunes |
| Poorten | één audio-ingang `in`; geen uitgangen |
| Contract | v1.12 |
| Licentie apparaat | AGPL-3.0-or-later |

## Hoe het werkt

Keten: `input` → toegangspoort `entry` → `ChannelSplitter` → kruismatrix (`gLL`, `gLR`, `gRL`, `gRR`: stereo of mono) → `ChannelMerger` → `trim` (volume) → begrenzer (DynamicsCompressor, drempel −1 dB, ratio 20) → `clipper` (WaveShaper, harde grens op ±1) → `sink`. De meters hangen achter `clipper`.

- **Standaarduitgang:** `sink` → `ctx.destination`. Heeft `ctx.destination.maxChannelCount` meer dan twee kanalen, dan kan `pair` (1…) het stereopaar kiezen; het apparaat zet dan `destination.channelCount` en `channelInterpretation = 'discrete'` en zet ze bij vertrek terug (`resetDestination`).
- **Gekozen uitgang (`device` is een `deviceId`):** `sink` → `MediaStreamDestination` → `Audio`-element met `setSinkId(device)` en `play()`. Dat is stereo. Lukt het niet, dan gaat het geluid naar de standaarduitgang en meldt de kaart de reden (`NotFoundError`, `NotAllowedError`, autoplay).
- **Bewaking (NaN en Infinity):** een `AnalyserNode` op de ingang (`tapIn`) en een achter de begrenzer (`tapOut`). Is de ingang niet eindig (of groter dan 1e6), dan wordt `entry` losgekoppeld tot hij weer eindig is; is de uitgang niet eindig, dan wordt de begrenzer vervangen. De controle loopt in de tekenklok `host.frame` (30 keer per seconde). Meet dit opnieuw na elke wijziging aan de keten, met een lus die NaN, ±Infinity en 1e30 bevat.
- `getPreset` laat `device`, `deviceLabel` en `mute` weg; `setPreset` laat ze staan.

## De state

| Veld | Wat | Bereik | Start |
|---|---|---|---|
| `device` | `deviceId` van de gekozen uitgang; leeg = standaarduitgang | tekst | `''` |
| `deviceLabel` | Naam om te tonen als de uitgang (nog) niet in de lijst staat | tekst | `''` |
| `level` | Volume in dB | −60 … 6 | −6 |
| `mono` | Links en rechts samen naar beide kanalen | aan/uit | uit |
| `limiter` | Begrenzer aan | aan/uit | aan |
| `mute` | Dempen | aan/uit | uit |
| `pair` | Stereopaar op de standaarduitgang (1 = kanalen 1+2) | 1 … 16 | 1 |

## Wat je niet kunt testen zonder hardware

Echte uitgangen, meer dan twee kanalen en vertraging kunnen in Chromium zonder geluidskaart niet worden gemeten. Test de keten met een echte `AudioContext` in Chromium (meters, de NaN-lus, `setState`) en meld eerlijk wat niet is getest. De kanaalpaarkeuze is alleen met een apparaat met meer dan twee uitgangskanalen te proberen.

## Skins

De knop (`gain` of `level`) is al via `host.ui.knob` met `id`, `role` en `group` aangemeld; de keuzelijsten en vinkjes zijn eigen elementen in de shadow root en worden alleen met CSS aangepast. De meegeleverde skin `Compact` staat in `../../../skins/library/nl.patchkamer.audiooutput/` (draaiknop in plaats van schuif; uitgang, paar en schakelaars staan in compacte rijen, het volume is een draaiknop met de naam eronder; de statusregel blijft; ongeveer 380 x 202 tegenover 380 x 297 punten). De CSS leunt op de volgorde van de kinderen van `.app` (`.row`, `.gain`, `.meter`, `.status`): wijzig je die volgorde, controleer dan die skin.

## Presets

Het pack `../../../presets/audio-output.patchkamer-presets.json` (formatVersion 2, CC0-1.0, namen Engels) heeft 16 presets in vier mappen: Main Out, Headphones, Interface Pairs en Checks. Voeg geen namen van interfaces of merken toe.

## Documentatie en songs

Dit zijn de plaatsen waar je terechtkunt voor documentatie en voor het componeren van songs met dit apparaat. Songs zijn CC-BY-4.0, tunes en presets CC0-1.0, het apparaat AGPL-3.0-or-later.

- Handleiding van Audio Output: [NL](../../../docs/mixer/USER-MANUAL_NL.md#audio-output) · [EN](../../../docs/mixer/USER-MANUAL_EN.md#audio-output).
- Overzicht van de soort: [README](../README.md); handleiding van de hele soort: [NL](../../../docs/mixer/USER-MANUAL_NL.md) · [EN](../../../docs/mixer/USER-MANUAL_EN.md).
- Presets (instellingen, `kind: set`): [audio-output.patchkamer-presets.json](../../../presets/audio-output.patchkamer-presets.json). Kies een preset als beginpunt voor de `state` van dit apparaat in de song; velden die de preset niet noemt krijgen hun standaard.
- Overzicht van alle apparaten en hun signaalketens: [devices/AGENTS.md](../../../devices/AGENTS.md). Een song componeren: [songs/AGENTS.md](../../../songs/AGENTS.md).
- Route voor agents: [soort Mixer](../AGENTS.md) → [devices/AGENTS.md](../../AGENTS.md) → [root AGENTS.md](../../../AGENTS.md). Contract: [NL](../../../contract/PATCHKAMER-CONTRACT_NL.md) · [EN](../../../contract/PATCHKAMER-CONTRACT_EN.md). Hoe presets van dit apparaat zijn opgebouwd: [presets/AGENTS.md](../../../presets/AGENTS.md). <!-- agents-tree -->
- Rol in een song: extra uitgang naast Speakers naar een door de gebruiker gekozen uitgang van de computer. Audio in `in`; geen uitgangen. Een song heeft normaal Speakers of Listening Output als eindpunt.
