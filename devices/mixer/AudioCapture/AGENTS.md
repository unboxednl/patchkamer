# AGENTS.md: Audio Capture

Dit bestand is voor AI-agents die dit apparaat configureren. Het is niet geschreven voor mensen. Het hoort bij `../../../AGENTS.md` (algemeen); lees die eerst. Hier staat wat alleen voor Audio Capture geldt.

## Wat Audio Capture is

Een geluidsbron die het geluid van een ander browsertabblad, een venster of (op Windows) het hele systeem de studio in haalt. De browser levert dat geluid via `navigator.mediaDevices.getDisplayMedia`: de gebruiker kiest de bron in het eigen deelvenster van de browser. De uitgang `out` past op elke audio-ingang (Recorder, samplers, effecten, Mixer, Speakers). **Er staan geen namen van programma's of merken in het bestand**; de naam van de bron komt van de browser.

| | |
|---|---|
| Bestand | `audio-capture.patchkamer-device.js` (in deze map) |
| `id` | `nl.patchkamer.audiocapture`. Verander die nooit: daaraan hangen presets en songs van gebruikers |
| Soort | `utility`; krijgt dus **presets** en nooit tunes |
| Poorten | één audio-uitgang `out` (stereo); geen ingangen |
| Contract | v1.19 |
| Licentie apparaat | AGPL-3.0-or-later |

## Hoe het werkt

Keten: `MediaStreamSource` (alleen het audiospoor) → `up` (dwingt 2 kanalen af: mono wordt stereo) → `ChannelSplitter(2)` → twee versterkers `gl` en `gr` → `ChannelMerger(2)` → hoogdoorlaat (BiquadFilter) → versterking (`trim`, met polariteit) → `out` (gedempt of niet). De meters hangen achter `trim`, vóór de demping.

- `mode` bepaalt de routing: `stereo` (kanaal 1 naar links, kanaal 2 naar rechts) of `mono` (beide kanalen samen, elk met factor 0,5, naar links en rechts).
- De browser eist een beeldspoor bij het delen. Het blijft ongebruikt (laag beeldtempo) en wordt bewust **niet** gestopt: het stoppen van het delen door de gebruiker beëindigt het beeld- en het audiospoor, en daaraan herkent het apparaat het einde (status "De capture is gestopt").
- Heeft de gekozen bron geen audiospoor (de gebruiker vinkte het delen van geluid niet aan, of het systeem kan het niet), dan stopt het apparaat en meldt het dat.
- De browserbewerking (echo, ruis, automatisch niveau) staat altijd **uit**; `restrictOwnAudio` en `systemAudio: 'include'` worden meegegeven maar door browsers die ze niet kennen genegeerd.
- Het apparaat start de bron **alleen na een klik**. `setState`, `setPreset` en het herstellen van een werkruimte starten niets.
- `mute` staat standaard **uit** en is op de kaart een knop **Dempen**. `getPreset` laat `mute` weg; `setPreset` laat het staan.
- Welke bronnen kunnen: tabgeluid in Chromium-browsers op elk systeem; systeemgeluid alleen op Windows (ook in de app, zie `app/main.js`); Firefox en Safari delen geen geluid.
- **Terugkoppeling:** wordt Patchkamer zelf of het systeemgeluid opgevangen terwijl `out` naar Speakers gaat, dan hoor je jezelf terug. Zet in een song `out` niet naar Speakers zonder dat de gebruiker daarom vraagt.

## De state

| Veld | Wat | Bereik | Start |
|---|---|---|---|
| `mode` | `stereo` of `mono` | keuze | `stereo` |
| `gain` | Versterking in dB | −24 … 36 | 0 |
| `hp` | Hoogdoorlaat in Hz; 0 = uit | 0, 40, 80, 120 | 0 |
| `invert` | Polariteit omkeren | aan/uit | uit |
| `mute` | Uitgang dempen (knop Dempen) | aan/uit | uit |

De gekozen bron staat niet in de state: een song kan nooit een bron aanzetten.

## Wat je niet kunt testen zonder echte schermdeling

De validator draait zonder bron. Test in Chromium door `navigator.mediaDevices.getDisplayMedia` te vervangen door een nepbron (een `OscillatorNode` via `createMediaStreamDestination` plus een canvas-beeldspoor): start, status, meters, einde van het delen, geweigerd, bron zonder geluid. Meld eerlijk dat een echte deelkeuze, systeemgeluid op Windows, de app en de vertraging niet zijn getest.

## Presets

Het pack `../../../presets/audio-capture.patchkamer-presets.json` (formatVersion 2, CC0-1.0, namen Engels) heeft 12 presets in drie mappen: Stereo, Mono en Cleanup. Een preset kiest nooit een bron.

## Documentatie en songs

- Handleiding van Audio Capture: [NL](../../../docs/mixer/USER-MANUAL_NL.md#audio-capture) · [EN](../../../docs/mixer/USER-MANUAL_EN.md#audio-capture).
- Overzicht van de soort: [README](../README.md); handleiding van de hele soort: [NL](../../../docs/mixer/USER-MANUAL_NL.md) · [EN](../../../docs/mixer/USER-MANUAL_EN.md).
- Presets (instellingen, `kind: set`): [audio-capture.patchkamer-presets.json](../../../presets/audio-capture.patchkamer-presets.json). Kies een preset als beginpunt voor de `state` van dit apparaat in de song; velden die de preset niet noemt krijgen hun standaard.
- Overzicht van alle apparaten en hun signaalketens: [devices/AGENTS.md](../../../devices/AGENTS.md). Een song componeren: [songs/AGENTS.md](../../../songs/AGENTS.md).
- Route voor agents: [soort Mixer](../AGENTS.md) → [devices/AGENTS.md](../../AGENTS.md) → [root AGENTS.md](../../../AGENTS.md). Contract: [NL](../../../contract/PATCHKAMER-CONTRACT_NL.md) · [EN](../../../contract/PATCHKAMER-CONTRACT_EN.md). Hoe presets van dit apparaat zijn opgebouwd: [presets/AGENTS.md](../../../presets/AGENTS.md). <!-- agents-tree -->
- Rol in een song: bron van extern geluid met één uitgang `out`. De bron kiest de gebruiker in de browser; in een song staat daardoor geen vaste bron, dus gebruik het alleen als de song om opname van buiten vraagt.
