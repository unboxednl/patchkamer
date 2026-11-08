# AGENTS.md: Stem Splitter

Dit bestand is voor AI-agents die dit apparaat configureren of er presets voor maken. Het is niet geschreven voor mensen. Het hoort bij `../../../AGENTS.md` (algemeen); lees die eerst. Hier staat wat alleen voor Stem Splitter geldt.

## Wat Stem Splitter is

Een gereedschap dat een nummer door een **dienst op internet** in stems laat splitsen (zang, drums, bas, rest, soms gitaar, piano en meer) en die stems laat spelen met de klok van de studio. Het apparaat zelf doet geen netwerkverkeer (het contract verbiedt dat en de validator weigert het): de aanroep zit in de **host**, in `patchkamer/js/stems.js` (contract v1.23, §13g, `host.stems`). Het geluid gaat dus naar internet, het kost geld per nummer en de gebruiker moet de rechten op de muziek hebben (auteursrecht). Dat staat zichtbaar op de kaart.

| | |
|---|---|
| Bestand | `stem-splitter.patchkamer-device.js` (in deze map) |
| `id` | `nl.patchkamer.stemsplitter`. Verander die nooit: daaraan hangen songs en presets van gebruikers |
| Naam | `Stem Splitter` in alle talen; alleen poortnamen hebben een Nederlandse variant (`i18n`); alle tekst staat in `TXT` (nl en en) |
| Soort | `utility` (categorie `tool`): dit apparaat krijgt dus **presets** (geen tunes). Er is nog geen presetpack |
| Poorten | audio-ingang `in` (In: alleen voor opnemen), audio-uitgangen = de stems (standaard `vocals`, `drums`, `bass`, `other`; na het splitsen het aantal dat de dienst gaf, 1 tot 12), bundeluitgang `all` (Alle stems: alle stems voor Multitrack of Mixer); geen sturing |
| Contract | v1.23 (apparaatversie 1.23.0); gebruikt `host.stems`, `host.setPorts`, `host.bundleChanged`, `loadAudio` (§13e) |
| Licentie apparaat | AGPL-3.0-or-later |
| Icoon | `icon.svg` in deze map |

## Uitzondering op de merkregel (Freek, 07-11)

Gemeten met de echte dienst (07-11, fal.ai · Mureka, model 1, een drumloop van 2,8 s): CORS staat browseraanroepen toe; het zip bevat `vocals`, `drums`, `bass`, `other`, `instrumental` (alles behalve zang, wav) plus `song.wav` en `song.mp3` (de invoer zelf, die de host weglaat); de wachtrij meldt `IN_QUEUE`, daarna `COMPLETED`; `x-fal-billable-units` was 3 (de prijs in dollars staat nergens in het antwoord). Een aanroep met een ongeldige `audio_url` komt toch in de wachtrij maar faalt met 422 en kost niets (0 eenheden).

In de **host-instellingen, de adapterlijst, de kaart (keuzelijst van diensten en modellen) en de documentatie** mogen de diensten waarmee Stem Splitter integreert bij hun naam genoemd worden (nu: fal.ai met de modellen van Mureka en Demucs). Reden: we kopiëren die diensten niet, we leveren hun omzet op. Dit geldt ALLEEN voor die namen van diensten en modellen; apparaat-id, apparaatnaam, poortnamen en alle overige tekst blijven merkvrij, en er komen geen namen van andere producten bij. De namen staan in `patchkamer/i18n/nl.js` en `en.js` (`m.st_svc_*`, `m.st_a*`, `m.st_b*`) en de adres- en eindpuntgegevens in `SERVICES` in `patchkamer/js/stems.js` (daar staan de adressen alleen waar het strikt moet). Het apparaatbestand zelf noemt geen dienst.

## Hoe het werkt

1. Invoer, drie wegen: een bestand kiezen of slepen op de kaart; vanuit de tab Samples via `loadAudio(files, info)` (knop → Stem Splitter); een opname uit de ingang `in` (kies een duur, **Opnemen**, **Stop**; de opname wordt een 16-bit stereo-WAV in het geheugen).
2. Dienst en model kiezen (state `service`: `a`, `b` of `custom`; `model` leeg = het model uit de instellingen). De sleutels staan in de **instellingen van de host** (Instellingen, onder de AI-assistent; `localStorage`, sleutel `patchkamerStems`), nooit in de state, een preset of een song.
3. **Splitsen** (alleen op een klik): `host.stems(this, 'split', { audio, service, model, signal, onProgress })`. De host controleert het formaat aan de bytes en de grootte (neemt de dienst alleen mp3/m4a aan en is de invoer wav, flac of ogg, dan zet de host de invoer zelf om naar mp3 met lamejs uit `patchkamer/vendor/lame.min.js`, in een worker: 192 kbps en stapsgewijs 160/128/96/64 tot het onder de grens van de dienst blijft; te lang geeft foutcode `mp3big`; voortgang `phase: 'mp3'` met `progress` 0 tot 1; het apparaat toont dat en de kaart zegt het vooraf; een mp3/m4a die past gaat ongewijzigd door; foutcodes `mp3big`, `mp3`, `indecode` hebben tekst in het apparaat), vraagt de eerste keer per sessie (per dienst en model) om bevestiging met de geschatte kosten en een auteursrechtwaarschuwing, doet de aanroep (indienen, status pollen, resultaat), pakt de zip uit of haalt de losse bestanden op en decodeert de stems. **Annuleren** breekt af via `signal`. `setState`, `setPreset`, `mount` en `onStep` starten nooit een aanroep.
4. Resultaat: het apparaat zet de nieuwe AudioNodes in `outputs`, roept `host.setPorts` aan met een uitgang per stem (namen uit de stemnaam, nl en en) plus `all`, en `host.bundleChanged`. Kabels naar uitgangen die verdwijnen haalt de host los.
5. Afspelen: met `onTransport` en `onStep`. Zodra het transport loopt start elke stem op stap 0 van een maat (`info.time`, dus sample-gelijk), elk door een eigen `GainNode` (niveau 0 tot 1,5, dempen, solo). Stoppen van het transport stopt alles. Geen tempo-aanpassing, behalve als `bpm` (tempo van het nummer) is ingevuld: dan loopt het mee met het studiotempo (`playbackRate`, de toonhoogte verandert). `loop` herhaalt het bestand.
6. Bewaren: WAV 16 of 24 bit per stem of alle stems in een zip; MIDI-zip als de dienst die gaf; **Drums → Drum Listener** geeft de drumstem (16-bit WAV) via `host.stems(this, 'send', …)` aan een Drum Listener (het geselecteerde exemplaar, een bestaand of een nieuw); **Bas → Bass Finder** doet hetzelfde met de basstem (16-bit WAV, `def` `nl.patchkamer.bass-finder`).

## De state

`state` is wat `getState()` teruggeeft. De stems en buffers staan er nooit in.

| Veld | Wat | Waarden | Start |
|---|---|---|---|
| `service` | Dienst | `a`, `b`, `custom` | `a` |
| `model` | Model van de dienst; leeg = het model uit de instellingen | tekst `[\w.-]`, hoogstens 100 tekens | `''` |
| `bits` | Diepte van de WAV-uitvoer | 16, 24 | 16 |
| `rec` | Opnameduur | `s10`, `s30`, `s60`, `s120`, `s180` | `s30` |
| `loop` | Herhalen | boolean | `false` |
| `bpm` | Tempo van het nummer (0 = niet aanpassen) | 0 of 20 … 300 | 0 |
| `mix` | Per stemnaam `{ level 0..1,5, mute, solo }` | hoogstens 12 stemnamen `[a-z0-9_-]` | `{}` |
| `layout` | De stemnamen van de uitgangen, zodat kabels in een song bewaard blijven | hoogstens 12 stemnamen | `['vocals','drums','bass','other']` |

`getPreset()` laat `layout` weg (routing hoort niet in een preset); `setPreset` laat de uitgangen staan. `setState` volgt §13: onbekende velden worden genegeerd, ongeldige waarden krijgen de standaard. Is er een resultaat geladen, dan houden de uitgangen hun vorm.

## Wat je niet moet doen

- Geen netwerkverkeer in dit apparaat (ook niet in commentaar de woorden die de validator zoekt): alles loopt via `host.stems`.
- Geen sleutels, buffers of resultaten in de state, een preset of een song.
- Geen aanroep zonder klik, ook niet bij het laden van een song of werkruimte.
- Het `id` niet wijzigen; poort-id's `in` en `all` niet als stemnaam gebruiken.
- Geen merknamen in het apparaatbestand; de uitzondering hierboven geldt alleen voor de namen van de diensten in host-instellingen, kaart-keuzelijst en documentatie.

## Getest en niet getest

Getest in Chromium met een nepdienst (zie het eindrapport van de bouw): zip met 2, 4 en 6 stems, variabel aantal uitgangen, bundel, afspelen met de klok (offline render, sample-gelijk), mute en solo, WAV-header en -lengte (16 en 24 bit), zip-uitpakken en kapotte, te grote en onveilige zips, fouten (401, 402, 429, 422, netwerk, geannuleerd, time-out), sleutel alleen naar de eigen dienst. Mp3-omzetting (host, Chromium, nepdienst): wav/stereo/mono 44,1 en 48 kHz, 96 kHz en 88,2 kHz (naar 48 kHz), 22,05 kHz, 37,8 kHz (naar 44,1 kHz), 4 minuten onder 10 MB, bitrate zakt bij 7 en 10 minuten, weigering bij 22 minuten op 11,025 kHz, annuleren tijdens het coderen, NaN/Infinity in de bron, mp3 ongewijzigd, Demucs zonder omzetting, terugval zonder worker. **Niet getest:** de klank van de omgezette mp3 (niet beluisterd), de echte diensten (CORS vanuit de browser, echte zip-inhoud en bestandsnamen, doorlooptijd, prijs), luisteren, de Windows-app. Of de diensten data-URI's als invoer en directe browseraanroepen toestaan, is niet bevestigd.
