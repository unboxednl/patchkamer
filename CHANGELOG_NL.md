# Changelog

*English version: [CHANGELOG.md](CHANGELOG.md)*

Alle belangrijke wijzigingen in Patchkamer (de host en de desktop-app) per versie. Het versienummer staat in `patchkamer/version.json` en onder **Instellingen > Versie**. Oudere geschiedenis staat in het git-log.

## 0.1.0 (nog niet uitgebracht)

### Nieuw
- **Chord Buddy** (nieuw apparaat, categorie Tools): helpt akkoorden te vinden zonder muziektheorie. Kies een toonsoort en stijl, of speel een akkoord op een MIDI-keyboard: het herkent het akkoord (omkeringen, slash-akkoorden, onvolledige akkoorden), rangschikt de mogelijke toonsoorten met hoe zeker dat is en waarom, stelt het volgende akkoord voor (veilig, spanning, kleur), bewaart akkoorden in 16 pads, speelt de pads als set (akkoorden en bas op aparte poorten) en adviseert over basloop en stemvoering. Schalen: majeur, mineur (natuurlijk, harmonisch, melodisch), de zeven modi, pentatoon en blues. Een pack van 30 startsets. Niet beluisterd.
- **Audio Capture** (nieuw apparaat, categorie Mixer): haalt het geluid van een ander browsertabblad, een venster of, op Windows, het hele systeem de studio in. Eén audio-uitgang die op elke audio-ingang past, zodat je het kunt opnemen, samplen of bewerken. Weergave, versterking, hoogdoorlaat, polariteit, dempen en meters; een pack met 12 presets. Er start niets uit zichzelf: je kiest de bron in het deelvenster van de browser. In de desktop-app deelt het het eerste scherm en, op Windows, het geluid van het hele systeem.
- **Skins: secties.** Een skin kan de regelaars van één groep (bijvoorbeeld het filter) nu een kader geven, in kolommen zetten (3 kolommen = 3×3), kaal maken (zonder eigen kader) en de naam onder de regelaar zetten, en een verschijningsvorm kan de kaartbreedte bepalen zodat Compact het hele apparaat kleiner maakt (skincontract 0.5; alleen als je de skin of verschijning zelf kiest, niet bij Auto). De mini-ontwerper heeft een deel Secties en een veld Breedte. Niets wordt verplaatst of verborgen; klank en instellingen veranderen niet.
- **Skins: meters.** Een skin kan een meter nu tonen als balk, ledbalk of ronde VU-meter met een wijzer die van links naar rechts uitslaat, op dezelfde plek en met de lengte en breedte die je kiest (skincontract 0.4, apparaatcontract v1.18). Geluid en instellingen veranderen niet.
- **Desktop-app** (Electron): Patchkamer in een eigen venster, met de meegeleverde bibliotheek (apparaten, presets, tunes) en een portable Windows-exe zonder installatie. Gebouwd door de GitHub Action *App*. Een map `bibliotheek` naast de exe vervangt de meegeleverde bibliotheek.
- **ASIO voor de app**: audio kan rechtstreeks naar een ASIO-driver voor lagere latency. Knop **ASIO** linksonder, standaard uit. Kies driver, buffer, uitgangspaar, sample rate en marge; de knop toont de geschatte vertraging. Getest met een audio-interface op ongeveer 17 ms.
- **Versienummer** onder Instellingen: de versie van Patchkamer, en in de app ook die van de app en de nieuwste uitgave op GitHub, met een downloadlink. Een link naar deze changelog.
- **Klanken vinden op instrument of stijl.** De tabs Tunes en Presets krijgen **Per instrument** en **Per stijl**: een boom met inspringen (Gitaren → Nylon, Piano's, Koper, …; Hiphop, Jungle, Techno, …) met zoeken en een knop **Laden** die de tune op een kaart zet. De meegeleverde tune- en presetpacks zijn getagd. Nieuw in het contract (v1.19): optionele `tags` op tunes, presets, mappen en packs.
- **Hiphop-songs en een mappenboom in de tab Songs.** Vier hiphop-songs in verschillende substijlen (boom bap, trap, lo-fi, G-funk) in `songs/hip-hop`, op papier en met metingen gecontroleerd maar niet beluisterd. De tab Songs toont demo-songs in submappen onder een eigen kop met inspringen.
- **Tab Samples en breakloops.** Een nieuwe bibliotheektab voor samplepacks (`.patchkamer-samples.json`, contract v1.20): blader per stijl of per pack, beluister met ▶ en laad een sample in de Loop Slicer of de Samplebank (beide krijgen een optionele `loadAudio`, versie 1.20.0). Het eerste pack, **Break Loops**, heeft veertien drumloops van twee maten (breakbeat, jungle, drum and bass, boom bap) gerenderd uit onze eigen drumapparaten; de Loop Slicer krijgt tien **Break Chops**-tunes. Gemeten, niet beluisterd.
- **Jungle-, breakbeat- en drum-and-bass-songs.** Drie songs die een break uit het pack Break Loops via de Loop Slicer spelen: `songs/jungle`, `songs/breakbeat`, `songs/drum-and-bass`. Gemeten, niet beluisterd.

### Opgelost
- MIDI verbindt nu in de app.
- Het ASIO-paneel is leesbaar in de lichte en retro-uitstraling.
- In de app verschijnt de melding "andere versie op GitHub" niet meer ten onrechte.
