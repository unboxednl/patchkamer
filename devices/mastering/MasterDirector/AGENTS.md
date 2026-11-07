# AGENTS.md: Master Director

Dit bestand is voor AI-agents die **presets voor Master Director** maken of het apparaat configureren. Het is niet geschreven voor mensen. Het hoort bij `../../../AGENTS.md` (algemeen); lees dat eerst. Hier staat wat alleen voor Master Director geldt.

## Wat Master Director is

Een bedieningsapparaat voor de hele masteringketen. Je kiest een **muziekstijl** (32, van transparant tot hardstyle) en een **situatie** (club, festival, big room, thuis, koptelefoon, studio, radio, auto, streaming); uit stijl × situatie × sterkte volgt een recept per apparaat (Bus Compressor, Balance EQ, Multiband Balance, Patina, Stereo Space en Master Chain) dat als echte instellingen in de aangesloten apparaten wordt gezet. Mix Check blijft ongemoeid. De Director heeft geen audio; zijn mastering-uitgang `setup` (gele, gestippelde kabel) gaat naar de Master Director-ingang van de apparaten. De Director gebruikt `host.mastering` (contract v1.12, §11b).

| | |
|---|---|
| Bestand | `master-director.patchkamer-device.js` (in deze map) |
| `id` | `nl.patchkamer.masterdirector`. Verander die nooit |
| Soort | `modulator` met `masteringController: 1`; krijgt dus **presets** |
| Poorten | mastering-uitgang `setup` (Style / setup; driehoekpoort, gele gestippelde kabel) |
| Contract | v1.12 |

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

**Een preset laden stelt de keten ook in (sinds 1.12.3).** `setPreset` (de gebruikersactie *preset laden*) zet de state en voert daarna dezelfde opdracht uit als de knop *Stel keten in* (`host.mastering` `apply`): alleen als `direct` in de geladen preset `true` is, alleen voor de geselecteerde apparaten aan de gele `setup`-kabel (Mix Check blijft ongemoeid), met `strength`, `follow` en `sameChain` uit de preset, en niets als er geen doelen zijn. `setState` (werkruimte of song laden, undo) stelt de keten **niet** in. **Host (sinds 07-11):** bij elke `host.mastering` `apply` (knop, keuze of `setPreset`) kijkt de host (`presetFollowMastering` in `js/tunes.js`, aangeroepen vanuit `host-api.js`) of `style`, `situation` en `strength` van de Director precies die van een preset uit zijn eigen pack zijn. Zo ja, dan laadt elk doel in `targetIds` (Mix Check niet, uitgesloten niet) de preset met dezelfde mapnaam en naam uit de bibliotheek van dat apparaat, zodat die in het presetvak staat en de waarden die van de preset zijn; een doel zonder gelijknamige preset krijgt het recept. Zo niet (andere combinatie of sterkte), dan gaat `configureMastering` met het recept zoals voorheen. De waarden van recept en device-presets verschillen sterk (gemeten: Balance EQ `g1` 0,18 tegen 1,8 na Club). Een `apply` overschrijft de instellingen van de aangesloten apparaten (terug te draaien met *Vorige groepswijziging terug*; na undo kan het presetvak de oude naam met een sterretje tonen).

## Het recept

De formules staan in `recipe()` in het bestand. Ze zijn een grover model dan de presetpacks van de andere mastering-apparaten: die zijn per preset afgestemd (gemeten 07-11: bijna elke waarde verschilt, bijvoorbeeld Patina-drive tot 13,5 dB). Daarom gebruikt de host de packs zodra de keuze een Director-preset is (zie hierboven); het recept is de terugval voor alle andere keuzes en sterktes.

## Controleren

- `node contract/validate-instrument.mjs devices/mastering/MasterDirector/master-director.patchkamer-device.js --lang nl` en `--lang en`. Beide `OK`.
- Niet beluisterd; de Director heeft geen eigen geluid.

## Documentatie en songs

Dit zijn de plaatsen waar je terechtkunt voor documentatie en voor het componeren van songs met dit apparaat. Songs zijn CC-BY-4.0, tunes en presets CC0-1.0, het apparaat AGPL-3.0-or-later.

- Handleiding van Master Director: [NL](../../../docs/mastering/USER-MANUAL_NL.md#master-director) · [EN](../../../docs/mastering/USER-MANUAL_EN.md#master-director).
- Overzicht van de soort: [README](../README.md); handleiding van de hele soort: [NL](../../../docs/mastering/USER-MANUAL_NL.md) · [EN](../../../docs/mastering/USER-MANUAL_EN.md).
- Presets (instellingen, `kind: set`): [master-director.patchkamer-presets.json](../../../presets/master-director.patchkamer-presets.json). Kies een preset als beginpunt voor de `state` van dit apparaat in de song; velden die de preset niet noemt krijgen hun standaard.
- Overzicht van alle apparaten en hun signaalketens: [devices/AGENTS.md](../../../devices/AGENTS.md). Een song componeren: [songs/AGENTS.md](../../../songs/AGENTS.md).
- Rol in een song: sturing van de hele masteringketen (kies een stijl en situatie). Het heeft alleen de mastering-uitgang `setup`, die met de gele gestippelde kabel naar de `setup`-poorten van de mastering-apparaten gaat. Het maakt geen geluid en zit niet in de audioketen.
