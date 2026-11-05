# Patchkamer gebruikershandleiding

*English version: [USER-MANUAL_EN.md](USER-MANUAL_EN.md)*

Patchkamer is een modulaire muziekstudio die in je browser draait. Je plaatst apparaten (synths, sequencers, effecten, uitgangen) op een vloer, verbindt ze met kabels, drukt op Start en maakt muziek. Deze handleiding is voor mensen die het willen gebruiken. Wil je zelf apparaten bouwen, ga dan naar [Eigen apparaten maken](#12-eigen-apparaten-maken).

![Patchkamer met een keyboard, een bassynth en speakers verbonden](images/nl/03-patch.png)

## Inhoud

1. [Wat je nodig hebt](#1-wat-je-nodig-hebt)
2. [Patchkamer openen](#2-patchkamer-openen)
3. [Een rondleiding door de studio](#3-een-rondleiding-door-de-studio)
4. [Een bibliotheek laden](#4-een-bibliotheek-laden)
5. [Je eerste patch](#5-je-eerste-patch)
6. [De apparaten](#6-de-apparaten)
7. [Tunes en presets](#7-tunes-en-presets)
8. [Bewaren, openen en delen](#8-bewaren-openen-en-delen)
9. [Je weg vinden op de vloer](#9-je-weg-vinden-op-de-vloer)
10. [Instellingen](#10-instellingen)
11. [Sneltoetsen](#11-sneltoetsen)
12. [Eigen apparaten maken](#12-eigen-apparaten-maken)
13. [Problemen oplossen](#13-problemen-oplossen)
14. [Licenties](#14-licenties)

## 1. Wat je nodig hebt

- Een computer met een moderne browser. **Chrome of Edge** geeft de beste ervaring: die kunnen een map op je computer onthouden en hebben Web MIDI voor een MIDI-keyboard. Andere moderne browsers werken voor de basis.
- Een koptelefoon of speakers.
- Optioneel: een MIDI-keyboard.

Je hoeft niets te installeren, er is geen account en er wordt niets geüpload. Alles draait op je eigen computer. Patchkamer gaat alleen online als jij zegt dat het apparaten van GitHub of van een webadres moet halen.

## 2. Patchkamer openen

Patchkamer is één HTML-bestand.

1. Haal deze repository binnen: kies op GitHub **Code → Download ZIP** en pak het uit, of draai `git clone https://github.com/unboxednl/patchkamer`.
2. Open `patchkamer/patchkamer.html` in je browser.

De soepelste start krijg je als je de map vanaf je eigen computer aanbiedt in plaats van op het bestand te dubbelklikken. Doe dit in een terminal, in de map die je hebt uitgepakt:

```
python3 -m http.server 8080
```

Open daarna `http://localhost:8080/patchkamer/patchkamer.html`. Via `localhost` geven Chrome en Edge je de echte mapkiezer (onderdeel 4).

Patchkamer volgt de taal van je browser: Nederlands of Engels. Je wijzigt dat onder Instellingen (onderdeel 10).

## 3. Een rondleiding door de studio

![De lege studio](images/nl/01-start.png)

| Onderdeel | Wat het doet |
|---|---|
| **Start** | Start en stopt de klok. Apparaten met een sequencer spelen mee. |
| **BPM**, **Swing** | Tempo (40–200) en swing van de klok. |
| **Werkruimte** | Bewaar, open en exporteer je opstelling (onderdeel 8). |
| **Tunes**, **Presets** | De bibliotheken met klanken en instellingen (onderdeel 7). |
| **Instellingen** | Taal, audiokwaliteit, weergave en meer (onderdeel 10). |
| **Herschik** | Zet je apparaten netjes op volgorde, van links naar rechts. |
| **Focus** | Toont de apparaten die je met **F** hebt gemarkeerd naast elkaar (onderdeel 9). |
| **Leeg** | Maakt de vloer leeg (klik twee keer om te bevestigen). |
| **Bibliotheek** | Toont of verbergt het bibliotheekvenster. |
| **Latency** | De vertraging tussen het berekenen van een geluid en het horen ervan, zoals je browser die meldt. |
| **Kleur** | Donker, licht of retro (onderdeel 10). |
| De naam bovenaan | De naam van je werkruimte. Klik erop om hem te wijzigen. |
| Tabs **F1**, **F2**… | De balk onder de bovenbalk bevat je werkruimtes. Klik op een tab of druk op **F1** t/m **F10** om te wisselen; **+** voegt er een toe en **×** sluit er een (hoofdstuk 8). |

Het grote vlak is de **vloer**. Daar staan je apparaten. Het venster links is de **bibliotheek**, de lijst met apparaten die je kunt plaatsen. Rechtsonder zie je de zoomknoppen.

## 4. Een bibliotheek laden

Patchkamer heeft zelf geen apparaten. Een **bibliotheek** is een verzameling apparaten. Deze repository bevat er een in de map `devices`. In het bibliotheekvenster voeg je onder **Bronnen** een of meer bronnen toe. Er zijn drie soorten:

| Bron | Hoe |
|---|---|
| **GitHub** | Typ `github.com/unboxednl/patchkamer` in het adresveld en klik op **Toevoegen**. De apparaten en de tunepakketten komen direct van GitHub. Dit is de makkelijkste start. |
| **Map** | Klik op **Lokale map kiezen…** en kies de map met apparaten (bijvoorbeeld de map `devices` van deze repository). |
| **Webadres** | Plak het adres van één `.patchkamer-device.js`-bestand, of van een lijst `patchkamer.json`, en klik op **Toevoegen**. |

![De bibliotheek met apparaten, klaar om te plaatsen](images/nl/02-library.png)

Een apparaat is een bestand dat eindigt op `.patchkamer-device.js`. Bronnen worden onthouden, dus de volgende keer laden ze vanzelf.

**Het kan ook vanzelf.** Onder **Instellingen → Nieuwe werkruimte** kan Patchkamer de apparatenbibliotheek, de presets en de tunes van GitHub laden zodra je met een lege werkruimte begint. De drie adressen kun je daar wijzigen (hoofdstuk 10). Elk adres wordt een eigen bron in de lijst, met een knop **Scannen**.

**Een map kiezen.** Op `localhost` of via https onthouden Chrome en Edge de map en ziet Patchkamer nieuwe apparaten als je terugkomt in het venster. In andere gevallen maakt de browser een eenmalige momentopname van de map en zegt de vraag iets als "7 bestanden uploaden". Er wordt niets geüpload, en het getal telt elk bestand in de map, niet alleen apparaten. Patchkamer leest alleen de bestanden die eindigen op `.patchkamer-device.js` en toont daarna het echte aantal apparaten. Bij een momentopname vraagt **Scannen** je de map opnieuw te kiezen om nieuwe bestanden te zien.

**Categorieën.** Apparaten staan per categorie. Klik op een categorienaam om hem in te klappen. De knop **Indeling** opent een paneel waar je eigen categorieën toevoegt, hernoemt en verwijdert, en de indeling bewaart of laadt.

![Indeling van de bibliotheek](images/nl/10-library-layout.png)

## 5. Je eerste patch

Je laat een keyboard een bassynth bespelen via je speakers.

1. Klik in de bibliotheek op **Plaatsen** bij **Keys / MIDI**, bij **Acid Baselines** en bij **Speakers**. Elk apparaat komt midden in je beeld. Wat in de weg staat, schuift opzij. Je kunt een apparaat ook van de bibliotheek naar de vloer slepen.
2. Klik op **Herschik** om ze netjes op een rij te zetten.
3. Verbind ze met kabels. Druk op een poort (het kleine rondje op een kaart) en sleep naar een passende poort op een andere kaart, en laat los:
   - van **Noten / CC** op Keys naar **Noten** op Acid Baselines;
   - van **Uit** op Acid Baselines naar **In** op Speakers.
4. Klik nog eens op **Herschik**, zodat de kabels van links naar rechts lopen.
5. Druk op **Start**. De sequencer in Acid Baselines gaat spelen. Klik op de pianotoetsen op Keys, of druk op de toetsen **A W S E D F T G Y H U J K O L P** van je computertoetsenbord.

![Keys, Acid Baselines en Speakers verbonden met kabels](images/nl/03-patch.png)

**Kabels.** De kleur van een kabel laat zien wat erover gaat: **audio** (blauwgroen), **gebeurtenissen** zoals noten (oranje), **sturing** (paars), **mastering** (een gele, gestippelde golf, tussen de driehoekpoorten van de Master Director en de mastering-apparaten), **multi-MIDI** (een dubbele gestreepte oranje kabel met alle sporen van een sequencer, voor de MIDI Hub) en **bundels** (dik, groen: veel kanalen in één kabel). Een kabel verbindt alleen poorten van dezelfde soort. Druk op **Esc** tijdens het slepen om te annuleren. Klik op een kabel om hem te verwijderen.

**Een kabel omhangen.** Sleep een kabel aan één kant naar een andere passende poort. De kant die het dichtst bij je greep zit, komt los en de andere kant blijft zitten. Laat je los op een passende poort, dan hangt de kabel daar. Laat je ergens anders los, of druk je op **Esc**, dan gaat de kabel terug naar waar hij was. De oude kabel blijft aangesloten tot je loslaat, dus het geluid blijft doorspelen.

**Een apparaat op een kabel leggen.** Sleep een apparaat uit de bibliotheek, of een apparaat dat nog geen kabels heeft, op een kabel. De kabel licht op en als je loslaat splitst hij: het apparaat zit tussen de twee uiteinden. Dat werkt voor apparaten die zowel een ingang als een uitgang hebben van die soort kabel (audio of noten), zoals de effecten. Licht een kabel niet op, dan past het apparaat er niet in.

**Volume.** Gebruik de schuif op Speakers. Die heeft een begrenzer, maar zet het volume in het begin bescheiden.

## 6. De apparaten

Apparaten zijn er in soorten. Elke soort heeft een eigen README en een eigen gebruikershandleiding, met per apparaat een sectie: waar het voor dient, de regelaars, de poorten, een voorbeeldpatch en de presets of tunes die erbij horen. Een patch loopt meestal van links naar rechts: **tools** en **drums** sturen noten, **synths** maken het geluid, **effecten** geven het vorm, de **mixer** voegt het samen en **Speakers** speelt het af. De knop **Herschik** zet je apparaten in die volgorde.

| Soort | Waar het voor dient | Apparaten | Handleiding |
|---|---|---|---|
| **Synths** | Geluid maken uit noten | Acid Baselines, Acid Stepper, Basic Mono, Biotope, Bowed Ensemble, Celestial Mechanics, Chord Poly, Cinematic Synth, Cross Mod Mono, Dissonant Cluster, Drone Synth, Duofone, Foundry, Four-Operator FM, Grain Cloud, Karplus String, Layered Landscape, Low Bass, Mist, Paradox, Patch Mono, Patchbay Synth, Poly Chorus, Stage Keys, Sub Line, Supersaw Swarm, Triple Osc Poly | [Handleiding synths](synths/USER-MANUAL_NL.md) · [README](../devices/synths/README_NL.md) |
| **Samplers** | Eigen geluiden spelen: pads en slices uit geladen audio | Samplebank, Loop Slicer | [Handleiding samplers](samplers/USER-MANUAL_NL.md) · [README](../devices/samplers/README_NL.md) |
| **Sequencers** | Noten en akkoorden laten spelen op andere apparaten | Chord Sequencer, Clip Arranger, Euclidean Rhythms, Pattern Playlist, Pattern Tracker, Scale Arpeggiator, Step Sequencer, Wanderer | [Handleiding sequencers](sequencers/USER-MANUAL_NL.md) · [README](../devices/sequencers/README_NL.md) |
| **Drums** | Drumgeluiden en ritme | Drum Machine, Drum Kit, Groovebox 12, Pulse Drums, Latin Percussion, Click Synth | [Handleiding drums](drums/USER-MANUAL_NL.md) · [README](../devices/drums/README_NL.md) |
| **Effecten** | Het geluid vormgeven: modulatie, vervorming, ruimte, filters, ritme, stem, ketens | Chorus, Effect Chain, Filter, Flanger, Frequency Shifter, Grit, Phaser, Pump, Resonator, Room, Tremolo, Vocoder | [Handleiding effecten](effects/USER-MANUAL_NL.md) · [README](../devices/effects/README_NL.md) |
| **Mastering** | Een mix afmaken: toon, dynamiek, saturatie, breedte, volume en controle | Balance EQ, Multiband Balance, Bus Compressor, Patina, Stereo Space, Master Chain, Mix Check, Master Director, Listening Output | [Handleiding mastering](mastering/USER-MANUAL_NL.md) · [README](../devices/mastering/README_NL.md) |
| **Mixer** | Binnenhalen, mixen, het niveau gelijk houden, afspelen | Mixer, Leveler, Speakers, Audio Input, Audio Output | [Handleiding mixer](mixer/USER-MANUAL_NL.md) · [README](../devices/mixer/README_NL.md) |
| **Modulatoren** | De regelaars van andere apparaten bewegen | Drift, Follower, LFO, Macro, Multi-Segment Envelope, Swell | [Handleiding modulatoren](modulators/USER-MANUAL_NL.md) · [README](../devices/modulators/README_NL.md) |
| **Tools** | Spelen, opnemen, meten en notities maken | Keys / MIDI, Metronome, MIDI Hub, Multitrack, Notes, Pad Controller, Recorder, Scope | [Handleiding tools](tools/USER-MANUAL_NL.md) · [README](../devices/tools/README_NL.md) |

**AI-chat (ingebouwd).** Naast de soorten hierboven heeft de bibliotheek één apparaat dat bij Patchkamer zelf hoort: **AI Chat**, onder *Meten & hulpmiddelen*. Plaats het en vraag in je eigen woorden om een device, een tunepack, een presetpack of een song. Het heeft een aanbieder, een API-sleutel en een model nodig onder **Instellingen → AI-assistent**; de aanbieder rekent het gebruik aan jou aan. De AI leest de documentatie van deze repository op GitHub zelf (de AGENTS.md-bestanden, het contract, de stijlgidsen) en geeft alles als **voorstel**: **Toevoegen** zet een device in de bibliotheek en op de vloer, of een tune- of presetpack in je bibliotheken, en **Openen** opent een song in een nieuwe werkruimte-tab. Zonder jouw klik wordt niets toegevoegd. Lees de code van een device voor je het toevoegt: een device is niet afgeschermd van de pagina, en de controle op de kaart waarschuwt alleen voor netwerk, opslag en eval. Het gesprek blijft staan als je van werkruimte wisselt; **Nieuw gesprek** begint opnieuw. Niet getest met echte aanbieders of sleutels: de werking met alle drie de formaten is getest met nagebootste antwoorden. De AI kan niet luisteren: vertel wat je hoort.

Hun kant-en-klare klanken en instellingen hebben eigen handleidingen: [Tunes](tunes/USER-MANUAL_NL.md) voor apparaten die geluid maken en [Presets](presets/USER-MANUAL_NL.md) voor de rest (zie ook onderdeel 7).

## 7. Tunes en presets

Een **tune** is een volledige instelling van één apparaat dat geluid maakt: alle knoppen, patronen en keuzes. Een **preset** is hetzelfde voor een apparaat zonder eigen geluid, zoals een effect of een mixer. Geen van beide bevat kabels.

Op elke kaart zie je een balk met ◀ ▶-knoppen en een lijst. Kies een tune of preset uit de lijst, of blader met de pijlen. **Bewaar** legt de huidige instelling vast in een bibliotheek, met jouw naam als maker en een licentie (CC-BY-4.0 of alle rechten voorbehouden). Een tune met een naam in *cursief* is veranderd sinds je hem laadde.

![Tunebibliotheken](images/nl/09-tunes-panel.png)

De knop **Alles laden** bovenaan het Tunes- en Presets-paneel laadt alle tunepacks, of alle presetpacks, van het adres dat je instelt onder **Instellingen → Nieuwe werkruimte** (standaard de mappen `tunes` en `presets` van deze repository op GitHub). Alles onder die map wordt ingelezen.

De menu's **Tunes** en **Presets** beheren je bibliotheken: maak een nieuwe, zet tunes in mappen, importeer een pakket (`.patchkamer-tunes.json` of `.patchkamer-presets.json`) en exporteer er een om te delen. Pakketten in een bibliotheek die je van GitHub of uit een map laadt, verschijnen vanzelf. De packs die bij deze repository horen, staan in de [handleiding tunes](tunes/USER-MANUAL_NL.md) en de [handleiding presets](presets/USER-MANUAL_NL.md).

Het hele verhaal, met de lijst van de meegeleverde packs en hoe je een eigen pack maakt, staat in de [handleiding presets](presets/USER-MANUAL_NL.md) en de [handleiding tunes](tunes/USER-MANUAL_NL.md).

## 8. Bewaren, openen en delen

![Het menu Werkruimte](images/nl/06-workspace.png)

Je **werkruimte** is de hele opstelling: apparaten met hun instellingen en patronen, kabels, tempo en naam.

- **Opslaan als bestand** downloadt je werkruimte als bestand. **Bestand openen…** laadt er een weer.
- Zet een vinkje bij **Code van alle externe instrumenten meenemen** als je een bestand wilt dat ook opent zonder toegang tot de bronnen waar de apparaten vandaan kwamen.
- **In deze browser** bewaart een kopie in je browser, zodat je later op dezelfde computer verder kunt.
- **Exporteer als song…** maakt een deelbaar bestand (`.patchkamer-song.json`) met alle apparaatcode, een titel, de maker en een licentie. Iemand anders kan het openen zonder bibliotheek.
- **Nieuwe lege werkruimte** begint opnieuw.

**Meer dan één werkruimte.** De tabbalk onder de bovenbalk bevat maximaal tien werkruimtes. Klik op een tab, of druk op **F1** t/m **F10**, om te wisselen. **+** voegt een nieuwe lege werkruimte toe; **×** sluit er een (Patchkamer vraagt eerst als er apparaten in staan, en de laatste kun je niet sluiten: gebruik **Leeg**). Elke werkruimte heeft eigen apparaten, kabels, tempo en naam, en alles in dit hoofdstuk werkt op de werkruimte waarin je zit. Bij het wisselen stopt de klok en start je hem zelf weer. Een nieuwe werkruimte laadt wat je koos onder **Instellingen → Nieuwe werkruimte**. Patchkamer bewaart je werkruimtes in je browser en opent ze de volgende keer weer.

![De tabbalk met drie werkruimtes](images/nl/11-workspaces.png)

## 9. Je weg vinden op de vloer

- **Verplaatsen:** sleep de vloer om te schuiven. **Ctrl + scroll** zoomt tussen 10% en 250%. Met de knoppen rechtsonder zoom je uit, zoom je in, zie je alles (**Alles**) en ga je terug naar het begin (⌂).
- **Kaarten:** sleep een kaart aan de titelbalk. Sleep een rand of hoek om het formaat te wijzigen, en dubbelklik op een rand voor de standaardmaat. **–** maakt van een kaart een klein icoon en **⤢** zet hem terug. **×** verwijdert hem. Met de versielijst schakel je naar een andere versie van een apparaat.
- **Herschik** zet je apparaten op volgorde van links naar rechts: bronnen, instrumenten, effecten, mixer, uitgang. **Ctrl+Z** maakt het ongedaan.
- **Focusweergave:** druk op **F** op de titelbalk van een kaart om hem te markeren en klik dan op **Focus**. De gemarkeerde apparaten staan naast elkaar, onder elkaar of in een raster, zonder dat ze op de vloer verschuiven. **Terug naar canvas** brengt je terug.

![Focusweergave](images/nl/08-focus.png)

## 10. Instellingen

![Het paneel Instellingen](images/nl/07-settings.png)

- **Taal:** automatisch (je browser), Nederlands of English. Patchkamer laadt opnieuw en behoudt je werkruimte.
- **Audio:** kies kwaliteit **Laag**, **Normaal** of **Hoog**, of stel **sample rate**, **latency** en **oversampling** zelf in. Hogere kwaliteit vraagt meer van je computer. Een wijziging laadt Patchkamer opnieuw en behoudt je werkruimte. Hoor je geknetter, kies dan een grotere latencybuffer (*Gebalanceerd* of *Stabiel*).
- **Nieuwe werkruimte:** vink aan wat Patchkamer laadt als je met een lege werkruimte begint: **Apparatenbibliotheek laden**, **Presets laden**, **Tunes laden**. Onder elk vinkje staat het adres, standaard de mappen `devices`, `presets` en `tunes` van `github.com/unboxednl/patchkamer`. Alles onder de map wordt ingelezen. **Standaardadressen herstellen** zet de drie terug. De knop **Alles laden** in het Tunes- en Presets-paneel gebruikt dezelfde adressen. Alleen GitHub-adressen werken hier; een webadres of lokale map voeg je als bron toe in de bibliotheek.
- **AI-assistent:** kies een aanbieder (**Anthropic**, **OpenAI** of een **eigen adres** voor elke OpenAI-compatibele dienst, zoals je eigen proxy, OpenRouter of een lokaal model), plak je **API-sleutel** en kies een **model** (**Modellen ophalen** vult de lijst). De sleutel staat alleen in deze browser (localStorage) en gaat alleen naar de aanbieder die je koos. Daaronder kun je instellen uit welke GitHub-repository de AI zijn documentatie leest, of **Eigen agent-instructies gebruiken** aanvinken en je eigen tekst schrijven: de AI gebruikt die dan in plaats van de GitHub-documentatie. **Sleutels wissen** haalt alle sleutels weg. Zie *AI Chat* in hoofdstuk 6.
- **Weergave:** de stijl van de kabels, hun dekking, de schaal van de hele interface, schuif of draaiknop voor de knoppen van de host, en de tekstgrootte van menu's en bibliotheek.
- **Kleur** (rechtsboven): donker, licht of retro.

![De kleurstellingen licht en retro](images/nl/03-patch-light.png)

![Retro](images/nl/03-patch-retro.png)

- **Browsergeheugen:** Patchkamer onthoudt je instellingen, bibliotheekindeling, bronnen, werkruimte en je eigen tunes en presets in je browser. **Browsergeheugen wissen…** wist dat allemaal en begint opnieuw. Bestanden op je computer en op GitHub blijven staan.

## 11. Sneltoetsen

| Toetsen | Wat het doet |
|---|---|
| **Spatie** | Start of stop |
| **F1** t/m **F10** | Wisselen naar werkruimte 1 t/m 10 (tabbalk) |
| **Alt+F** | Focusweergave openen of sluiten |
| **Alt+B** | Bibliotheek tonen of verbergen |
| **+** / **−** / **0** | Inzoomen / uitzoomen / zoom herstellen |
| **Ctrl + scroll** | De vloer zoomen |
| **Delete** | Het geselecteerde apparaat verwijderen |
| **Ctrl+Z** | Herschik ongedaan maken |
| **Esc** | Een kabel die je sleept annuleren, of een paneel sluiten |
| Dubbelklik op een schuif | Terug naar de beginwaarde |
| Klik op het getal naast een schuif | Een waarde typen en op Enter drukken |
| **A W S E D F T G Y H U J K O L P** | Noten spelen op Keys (als het toetsenbord focus heeft) |

De lettertoetsen A–P zijn van Keys, daarom gebruiken de sneltoetsen van de host Alt.

## 12. Eigen apparaten maken

Een apparaat is één `.patchkamer-device.js`-bestand dat het **contract** volgt: een volledige, zelfstandige beschrijving van wat een apparaat moet doen. Het contract bestaat in het Nederlands ([PATCHKAMER-CONTRACT_NL.md](../contract/PATCHKAMER-CONTRACT_NL.md)) en het Engels ([PATCHKAMER-CONTRACT_EN.md](../contract/PATCHKAMER-CONTRACT_EN.md)). Een validator controleert je apparaat:

```
node contract/validate-instrument.mjs devices/synths/Duofone/duofone.patchkamer-device.js
```

Patchkamer is gemaakt om net zo goed door AI-agents als door mensen te worden gebouwd. Wijs je agent naar [AGENTS.md](../AGENTS.md): daar staat wat hij moet lezen, waar hij dingen neerzet en wat hij moet controleren. Onder **Instellingen → Contract & opstelling** vind je ook een sjabloon dat je kunt kopiëren.

## 13. Problemen oplossen

**Ik hoor niets.**
- Druk op **Start**, of klik ergens in Patchkamer. Browsers pauzeren audio tot je met de pagina werkt, en ook na slaapstand of als je de audio-uitgang wisselt. Patchkamer meldt dan "Het geluid staat uit" en hervat zelf bij je volgende klik of toetsaanslag.
- Controleer de kabels: audio moet van het apparaat dat geluid maakt naar **Speakers** lopen. Noten moeten van Keys (of een sequencer) naar het instrument lopen.
- Controleer het volume op Speakers en op je computer.

**De bibliotheek is leeg of mijn nieuwe apparaat ontbreekt.**
- Voeg een bron toe (onderdeel 4).
- Bij een map die Patchkamer niet kan onthouden, klik je op **Scannen** en kies je de map opnieuw. Alleen bestanden die eindigen op `.patchkamer-device.js` tellen mee.

**Mijn MIDI-keyboard wordt niet gevonden.** Gebruik Chrome of Edge, klik op **MIDI verbinden** op Keys en geef toegang. Kies het keyboard onder **MIDI-ingang**.

**Geknetter of haperingen.** Open Instellingen → Audio en kies *Gebalanceerde* of *Stabiele* latency, of zet de kwaliteit op *Laag*.

**De mapvraag zegt "7 bestanden uploaden".** Zie onderdeel 4: er wordt niets geüpload en het getal telt alle bestanden in de map.

**Alles ziet er raar of vastgelopen uit.** Instellingen → **Browsergeheugen wissen…** begint Patchkamer opnieuw.

## 14. Licenties

Elke map heeft een eigen licentie: de host en de apparaten zijn AGPL-3.0-or-later, het contract is MIT, tunes en presets zijn CC0-1.0 en de songs zijn CC-BY-4.0. Zie [LICENSING.md](../LICENSING.md).
