# AGENTS.md: Recorder

Dit bestand is voor AI-agents die dit apparaat configureren of er presets voor maken. Het is niet geschreven voor mensen. Het hoort bij `../../../AGENTS.md` (algemeen); lees die eerst. Hier staat wat alleen voor Recorder geldt.

## Wat Recorder is

Een opnemer: neemt op wat er binnenkomt (bijvoorbeeld de mix) en laat het ongewijzigd doorlopen naar de uitgang. Een uitsteekmeter en een timer tonen wat er gebeurt. Takes blijven in het geheugen tot je de pagina sluit; met "Bewaar" krijg je een audiobestand, via `host.saveFile` als de host dat biedt en anders via een gewone download. Het formaat kies je vóór het opnemen: WebM/Opus of MP4 (wat de browser ondersteunt, gecomprimeerd), WAV 16-bit, WAV 24-bit of MP3 (128, 192, 256 of 320 kbps). Voor WAV en MP3 vangt een AudioWorklet het ruwe geluid op (ca. 23 MB per minuut bij 48 kHz stereo in het geheugen); het bestand wordt pas bij "Bewaar" gemaakt, MP3 in een worker. Optioneel start en stopt de opname met Start/Stop van de klok.

| | |
|---|---|
| Bestand | `recorder.patchkamer-device.js` (in deze map) |
| `id` | `nl.patchkamer.recorder`. Verander die nooit: daaraan hangen presets en songs van gebruikers |
| Naam | `Recorder` in alle talen; alleen de poortnaam `Door` (Engels `Through`) hangt van de taal af (via `i18n`) |
| Soort | `utility`: Recorder krijgt dus **presets** (geen tunes) |
| Poorten | audio-ingang `in` (In), audio-uitgang `out` (Door / Through); geen events of sturing |
| Contract | v1.11 |
| Licentie apparaat | AGPL-3.0-or-later |

Dit apparaat is de nieuwe, bijgewerkte vorm van een ouder bestand met een andere naam en id (Opname, `nl.patchkamer.opname`). Presets of songs uit die tijd verwijzen naar de oude id en laden hier niet in. De standaardnaam van een opname is nu `Recording` (was `Opname`).

## Geen tunes, wel presets

Alleen apparaten met `kind: 'instrument'` hebben tunes. Recorder is een `utility`, dus het krijgt **presets** en **nooit tunes** (contract §0 en §13c). Maak voor Recorder geen pack in `../../../tunes/`. Een presetpack heet `naam.patchkamer-presets.json` en staat in `../../../presets/`; het formaat is dat van het contract (§13c), `formatVersion` 2, licentie `CC0-1.0`, `device` is altijd `nl.patchkamer.recorder` en elke preset is `kind: "set"`. Er zijn maar vier velden; maak alleen presets als de opdracht dat vraagt.

## De state

`state` van een preset is wat `getState()` teruggeeft (Recorder heeft geen `getPreset`).

| Veld | Wat | Bereik | Start |
|---|---|---|---|
| `name` | Naam van de opname; staat in de bestandsnaam van een bewaarde take (`<naam> take <n>.<ext>`) | tekst, hoogstens 80 tekens | `Recording` |
| `withTransport` | Opnemen met Start/Stop van de klok | boolean | `false` |
| `format` | Formaat van een nieuwe opname | `webm` (WebM/Opus, of MP4 als de browser geen webm kent), `wav16`, `wav24`, `mp3` | `webm` |
| `bitrate` | Bitrate van MP3 (alleen van belang bij `mp3`) | 128, 192, 256, 320 kbps | 192 |

Wat Recorder met een state doet (getest):
- Een `name` die geen tekst is, geeft `Recording`; een te lange naam wordt na 80 tekens afgekapt.
- Een `withTransport` die geen boolean is (bijvoorbeeld `1` of `"ja"`), geeft `false`.
- Een `format` buiten de lijst geeft `webm`. Een `bitrate` die geen getal is geeft 192; een getal wordt afgekapt op 128…320 en daarna op de dichtstbijzijnde waarde van de lijst gezet.
- Oude presets en songs zonder `format` en `bitrate` nemen op zoals voorheen (webm).
- Onbekende velden worden genegeerd. Zet er geen in. Takes en lopende opnames horen niet in de state en worden niet bewaard.

## MP3-encoder (lamejs)

Onderaan het bestand staat de constante `LAME_SRC`: lamejs 1.2.1 (LGPL-3.0, `lame.min.js` uit de npm-release) **onveranderd**. Pas die tekst niet met de hand aan; vervang hem als geheel door een andere versie of een eigen build, die een globale functie `lamejs` met `Mp3Encoder` moet opleveren. Bewerk het bestand daarom niet met een programma dat lange regels afkapt. De licentie en de reden staan in `../../../LICENSING.md`. Lamejs kan 8–48 kHz; bij een veelvoud (96 kHz) middelt Recorder terug naar 48 kHz, bij een andere samplerate meldt hij dat MP3 niet kan. WAV kan altijd.

## Controleren

- `node contract/validate-instrument.mjs devices/tools/Recorder/recorder.patchkamer-device.js --lang nl` en `--lang en`, vanuit de root. Beide moeten `OK` geven, zonder `let op`.
- Of een opname goed klinkt, kun je niet horen. Schrijf in je oplevering dat het **niet beluisterd** is. Wat je wel kunt meten: bewaar een take van een bekend signaal en lees hem terug met `ffprobe`/`ffmpeg` (formaat, samplerate, duur, decodeert) en bij WAV sample voor sample.
- Alle tekst in het apparaat staat in het woordenboek `TXT` bovenin het bestand (Nederlands en Engels). Een nieuwe tekst krijgt altijd nl én en.

## Wat je niet doet

- Verander nooit de `id`, de `kind`, de poort-id's of de namen van state-velden.
- Pas het apparaat niet aan om een preset te laten kloppen.
- Zet geen merknamen van bestaande apparatuur in naam of omschrijving, en verzin geen persoon bij `author`.
- Commit of push niet, tenzij de opdracht dat vraagt.

## Documentatie en songs

Dit zijn de plaatsen waar je terechtkunt voor documentatie en voor het componeren van songs met dit apparaat. Songs zijn CC-BY-4.0, tunes en presets CC0-1.0, het apparaat AGPL-3.0-or-later.

- Handleiding van Recorder: [NL](../../../docs/tools/USER-MANUAL_NL.md#recorder) · [EN](../../../docs/tools/USER-MANUAL_EN.md#recorder).
- Overzicht van de soort: [README](../README.md); handleiding van de hele soort: [NL](../../../docs/tools/USER-MANUAL_NL.md) · [EN](../../../docs/tools/USER-MANUAL_EN.md).
- Overzicht van alle apparaten en hun signaalketens: [devices/AGENTS.md](../../../devices/AGENTS.md). Een song componeren: [songs/AGENTS.md](../../../songs/AGENTS.md).
- Rol in een song: opnemer die het signaal ongewijzigd doorgeeft (`in` naar `out`). Zet hem op de mix om een opname te maken; hij verandert niets aan het geluid.
