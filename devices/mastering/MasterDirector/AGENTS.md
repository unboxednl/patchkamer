# AGENTS.md: Master Director

Dit bestand is voor AI-agents die **presets voor Master Director** maken of het apparaat configureren. Het is niet geschreven voor mensen. Het hoort bij `../../../AGENTS.md` (algemeen); lees dat eerst. Hier staat wat alleen voor Master Director geldt.

## Wat Master Director is

Een modulator-achtig bedieningsapparaat voor de hele masteringketen. Je kiest een **muziekstijl** (32, van transparant tot hardstyle) en een **situatie** (club, festival, big room, thuis, koptelefoon, studio, radio, auto, streaming); uit stijl × situatie × sterkte volgt een recept per apparaat (Bus Compressor, Balance EQ, Multiband Balance, Patina, Stereo Space en Master Chain) dat als echte instellingen in de aangesloten apparaten wordt gezet. Mix Check blijft ongemoeid. De Director heeft geen audio; zijn paarse uitgang `setup` gaat naar de Master Director-ingang van de apparaten.

| | |
|---|---|
| Bestand | `master-director.patchkamer-device.js` (in deze map) |
| `id` | `nl.patchkamer.masterdirector`. Verander die nooit |
| Soort | `modulator` met `masteringController: 1`; krijgt dus **presets** |
| Poorten | modulatie-uitgang `setup` (Style / setup) |
| Contract | v1.11 |

Voorganger: Masterregie (`nl.patchkamer.mastering.director`, acht stijlen, geen situaties). De host moet het Master Director-protocol bieden (`host.mastering`, versie 1) om de apparaten daadwerkelijk in te stellen; zonder dat meldt de kaart "Hostuitbreiding vereist" en verandert er niets. **Controleer dat vóór je beweert dat een preset werkt.**

## De state

| Veld | Wat | Waarden | Start |
|---|---|---|---|
| `style` | De muziekstijl | `transparent`, `warm`, `techno`, `hard-techno`, `deep-house`, `house`, `progressive`, `trance`, `psytrance`, `electro`, `synthwave`, `edm`, `hardstyle`, `drum-and-bass`, `dubstep`, `breakbeat`, `hip-hop`, `trap`, `rnb`, `pop`, `rock`, `metal`, `indie`, `latin`, `funk-disco`, `reggae-dub`, `lofi`, `acoustic`, `jazz`, `classical`, `soundtrack`, `ambient` | `transparent` |
| `situation` | De situatie | `streaming`, `club`, `festival`, `bigroom`, `home`, `headphones`, `studio`, `radio`, `car` | `streaming` |
| `strength` | Sterkte van het recept | 0 … 1 | 0,8 |
| `direct` | Meteen toepassen bij een keuze | `true`/`false` | `true` |
| `follow` | De apparaten daarna slim laten volgen (`auto`) | `true`/`false` | `false` |
| `sameChain` | Dubbele EQ/compressie vermijden als meerdere apparaten aanwezig zijn | `true`/`false` | `true` |

Een preset (`getPreset()`) bevat dezelfde velden zonder `excluded` (de lijst van uitgesloten apparaten is werkstand). Ongeldige waarden geven de startwaarde; onbekende velden worden genegeerd.

## Het recept

De formules staan in `recipe()` in het bestand en zijn gelijk aan die van de presetgenerator (40 896 waarden vergeleken, geen verschil). De presetpacks van de andere mastering-apparaten komen uit dezelfde recepten.

## Controleren

- `node contract/validate-instrument.mjs devices/mastering/MasterDirector/master-director.patchkamer-device.js --lang nl` en `--lang en`. Beide `OK`.
- Niet beluisterd; de Director heeft geen eigen geluid.
