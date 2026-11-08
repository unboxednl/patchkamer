# AGENTS.md: Audio Input

Dit bestand is voor AI-agents die dit apparaat configureren. Het is niet geschreven voor mensen. Het hoort bij `../../../AGENTS.md` (algemeen); lees die eerst. Hier staat wat alleen voor Audio Input geldt.

## Wat Audio Input is

Een geluidsbron die geluid van een ingang van de computer in de studio haalt: de standaardingang van de geluidskaart of een audio-interface die het besturingssysteem aanbiedt. De browser levert de lijst met ingangen (`navigator.mediaDevices.enumerateDevices`) en het geluid (`getUserMedia`). **Er staan geen namen van interfaces of merken in het bestand**; de namen komen van het systeem en horen dat te blijven.

| | |
|---|---|
| Bestand | `audio-input.patchkamer-device.js` (in deze map) |
| `id` | `nl.patchkamer.audioinput`. Verander die nooit: daaraan hangen presets en songs van gebruikers |
| Soort | `utility`; krijgt dus **presets** en nooit tunes |
| Poorten | één audio-uitgang `out` (stereo); geen ingangen |
| Contract | v1.12 |
| Licentie apparaat | AGPL-3.0-or-later |

## Hoe het werkt

Keten: `MediaStreamSource` → `ChannelSplitter` (zoveel kanalen als de ingang geeft, ten hoogste 32) → twee versterkers `gl` en `gr` → `ChannelMerger(2)` → hoogdoorlaat (BiquadFilter) → versterking (`trim`, met polariteit) → `out` (gedempt of niet). De meters hangen achter `trim`, vóór de demping.

- `mode` bepaalt de routing: `stereo` (kanaal `ch` naar links, `ch+1` naar rechts), `mono` (kanaal `ch` naar beide), `sum` (kanalen `ch` en `ch+1` samen, elk met factor 0,5, naar beide).
- `capture` is `stereo` (vraagt 2 kanalen) of `all` (vraagt er 32, de browser geeft wat de ingang heeft). Het aantal kanalen dat echt binnenkomt staat in `track.getSettings().channelCount`.
- De browserbewerking (echo, ruis, automatisch niveau) staat standaard **uit**. `processing: true` zet alle drie aan.
- Het apparaat start de ingang **alleen na een klik**. `setState`, `setPreset` en het herstellen van een werkruimte starten niets; ze herstarten alleen een ingang die al liep, als de ingang, `capture` of `processing` veranderen.
- `mute` staat standaard **uit** en is op de kaart een knop **Dempen** (licht op als hij aan staat); een microfoon bij luidsprekers kan rondzingen, dus de kaart waarschuwt voor een koptelefoon. `getPreset` laat `device`, `deviceLabel` en `mute` weg; `setPreset` laat ze staan.

## De state

| Veld | Wat | Bereik | Start |
|---|---|---|---|
| `device` | `deviceId` van de gekozen ingang; leeg = standaardingang | tekst | `''` |
| `deviceLabel` | Naam om te tonen als de ingang (nog) niet in de lijst staat | tekst | `''` |
| `mode` | `stereo`, `mono` of `sum` | keuze | `stereo` |
| `ch` | Eerste kanaal (1-gebaseerd) | 1 … 32 | 1 |
| `capture` | `stereo` of `all` | keuze | `stereo` |
| `gain` | Versterking in dB | −24 … 36 | 0 |
| `hp` | Hoogdoorlaat in Hz; 0 = uit | 0, 40, 80, 120 | 0 |
| `invert` | Polariteit omkeren | aan/uit | uit |
| `mute` | Uitgang dempen (knop Dempen) | aan/uit | uit |
| `processing` | Browserbewerking | aan/uit | uit |

## Wat je niet kunt testen zonder hardware

De validator en de testomgeving gebruiken geen echte ingang. Test met Chromium en de vlaggen `--use-fake-device-for-media-stream --use-fake-ui-for-media-stream` (een nepmicrofoon met piepjes): start, lijst met ingangen, meter, kanaalkeuze en stoppen. Meld eerlijk dat echte interfaces, meer dan twee kanalen en de vertraging niet zijn getest.

## Presets

Het pack `../../../presets/audio-input.patchkamer-presets.json` (formatVersion 2, CC0-1.0, namen Engels) heeft 31 presets in vijf mappen: Line Level, Voice, Instruments, Interface Channels en Utility. Voeg geen namen van interfaces of merken toe.

## Documentatie en songs

Dit zijn de plaatsen waar je terechtkunt voor documentatie en voor het componeren van songs met dit apparaat. Songs zijn CC-BY-4.0, tunes en presets CC0-1.0, het apparaat AGPL-3.0-or-later.

- Handleiding van Audio Input: [NL](../../../docs/mixer/USER-MANUAL_NL.md#audio-input) · [EN](../../../docs/mixer/USER-MANUAL_EN.md#audio-input).
- Overzicht van de soort: [README](../README.md); handleiding van de hele soort: [NL](../../../docs/mixer/USER-MANUAL_NL.md) · [EN](../../../docs/mixer/USER-MANUAL_EN.md).
- Presets (instellingen, `kind: set`): [audio-input.patchkamer-presets.json](../../../presets/audio-input.patchkamer-presets.json). Kies een preset als beginpunt voor de `state` van dit apparaat in de song; velden die de preset niet noemt krijgen hun standaard.
- Overzicht van alle apparaten en hun signaalketens: [devices/AGENTS.md](../../../devices/AGENTS.md). Een song componeren: [songs/AGENTS.md](../../../songs/AGENTS.md).
- Route voor agents: [soort Mixer](../AGENTS.md) → [devices/AGENTS.md](../../AGENTS.md) → [root AGENTS.md](../../../AGENTS.md). Contract: [NL](../../../contract/PATCHKAMER-CONTRACT_NL.md) · [EN](../../../contract/PATCHKAMER-CONTRACT_EN.md). Hoe presets van dit apparaat zijn opgebouwd: [presets/AGENTS.md](../../../presets/AGENTS.md). <!-- agents-tree -->
- Rol in een song: bron van externe audio (geluidskaart of audio-interface) met één uitgang `out`. De ingang kiest de browser/gebruiker; in een song staat daardoor geen vaste ingang, dus gebruik het alleen als de song om opname van buiten vraagt.
