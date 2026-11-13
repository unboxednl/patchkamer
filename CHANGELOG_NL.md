# Changelog

*English version: [CHANGELOG.md](CHANGELOG.md)*

Alle belangrijke wijzigingen in Patchkamer (de host en de desktop-app) per versie. Het versienummer staat in `patchkamer/version.json` en onder **Instellingen > Versie**. Oudere geschiedenis staat in het git-log.

## 0.40.0 (2026-11-13)

### Toegevoegd
- **Realtime-meter:** onder ☰ → Overig staat naast Latency nu de regel **Realtime**, en naast Start verschijnt een rood lampje als de audiodraad het niet bijhoudt. De host vergelijkt elke seconde de audioklok met de wandklok over de laatste drie seconden: 100 % is goed, eronder ontbreekt per seconde zoveel geluid en hapert het. De eerste twee seconden na Start tellen niet mee. De meter leest alleen; geluid, apparaten en songs veranderen niet. Hij meldt pas bij (bijna) vol, niet hoeveel ruimte er nog is (`AudioRenderCapacity` bestaat niet in de browsers). Handleiding (NL en EN) en AGENTS.md bijgewerkt.

## 0.39.0 (2026-11-13)

### Toegevoegd
- **Clip Arranger 1.38.0**: knop **Nieuw project** naast de projectnaam. Die begint een leeg project: één lege scène, één lege sectie in één song, lege clips en geen titel; de vier standaardsporen blijven. Met Undo haal je het oude project terug. State en presets zijn gelijk.

## 0.38.0 (2026-11-13)

### Toegevoegd
- **Sax Studio** (synths, 1.0.0): levensechte sopraan-, alto-, tenor- en baritonsaxofoons uit echte opnames (MTG Solo Saxophones, CC BY 4.0) die pas na een klik op **Laden** van internet komen en nooit in de repo worden gekopieerd. Velocity kiest subtone, normaal of bite, de notelengte kiest staccato, overlappende noten klinken als mono-legato; growl, falloff, scoop, vibrato, adem- en klepruis en een sectiestand voor funk- en soulstabs. Met het tunepack **Sax Studio Styles** (36 tunes) en de skin Compact. Gemeten, niet beluisterd.
- **Brass Studio** (synths, 1.0.0): koper als fysisch model (lipriet, pijp en bel): trompet, bugel, trombone, basstrombone, hoorn en tuba, een sectie van één tot vier spelers, dempers met wa-wa, scoop, rip, fall, doit, shake en drop, en legato. Met het tunepack **Brass Studio Styles** (45 tunes) en de skin Compact. Gemeten, niet beluisterd.
- **Funk Bass** (synths, 1.0.0): een basgitaar als fysisch model voor soul, funk en jazz, met dode noot, vingers, pull, slap en pop uit velocity en notelengte, hammer-on en slide, fretless, vlakwond of roundwound snaren, pickups en 4 of 5 snaren. Met het tunepack **Funk Bass Styles** (26 tunes), negen **Step Sequencer**-patronen (`step-sequencer-funk-bass`) en de skin Compact. Gemeten, niet beluisterd.

## 0.37.3 (2026-11-13)

### Opgelost
- **Iron Acid** (Acid Baselines Classics 1.1.1, tune 1.0.1): filter-FM van 0,2 naar 0,05. Bij 0,2 ontspoorde het filter in de offline render (152240 niet-eindige samples); de resonantie was niet de oorzaak. De bewaker van het apparaat werkt alleen live, daar gaf het een korte hapering. Nu 0 niet-eindige samples. Niet beluisterd: de felheid kan iets anders zijn.
- **Tune Finder 1.22.2**: index opnieuw gebouwd, Iron Acid heeft nu een echte vingerafdruk.

## 0.37.2 (2026-11-12)

### Gewijzigd
- **Tune Finder 1.22.1**: de index is opnieuw gebouwd en telt nu 2961 tunes van 38 instrumenten (met Neuro Bass, Drawbar Organ, Brass Section, Squelch Box en de uitgebreide packs). De analyse is gelijk; handleiding en AGENTS.md hebben de nieuwe aantallen.
- **Tellingen en tabellen rechtgezet:** `tunes/README` en de tunehandleiding (NL en EN) noemen nu 47 packs met 3365 tunes (36 voor synths, 4 voor samplers, 7 voor drums), met de ontbrekende rijen Neuro Bass, Squelch Box en Acoustic Drums en de aantallen en mappen van de uitgebreide packs; `presets/README` noemt 57 packs met 2345 presets, met de rij van Remix.

### Let op
- De tune **Iron Acid** (Acid Baselines Classics) geeft bij het bouwen van de index 152240 niet-eindige samples in de offline render; de tune is van vóór de uitbreiding en is niet aangepast.

## 0.37.1 (2026-11-12)

### Verbeterd
- **Reverb (1.0.2) rekent ongeveer 1,5 tot 2,5 keer minder.** De acht sinussen voor de modulatie van de vertraaglijnen worden niet meer per sample berekend maar met een rotatie die elk blok exact wordt hersteld. Gemeten in Node met de instellingen uit Iron Cathedral en Skyline Ascent: chamber ruim 2,4 keer sneller dan 1.0.0, hall en plate ongeveer 1,5 tot 1,6 keer. De uitvoer wijkt hierdoor hoogstens één Float32-stap af (1,5e-8, ofwel -156 dBFS), wat niet hoorbaar is. Niet beluisterd.

## 0.37.0 (2026-11-12)

### Toegevoegd
- **Funk-song Sunday Pocket** in `songs/funk/` (104 BPM, swing 0,12, E dorisch, 104 maten): Acoustic Drums met ghost-snares, afgekapte hi-hats en rimshots, Drawbar Organ met een rotary die per sectie van stop naar langzaam en snel gaat, bas en gitaar, Stage Keys en Brass Section, Mixer en Master Chain. De drums vragen de kit-download ("Kit laden" op Acoustic Drums, ongeveer 31 MB); zonder die kit klinkt de song zonder drums. Niet beluisterd. Sectie in `songs/styles/funk-disco.md` en rijen in beide songs-README's.

## 0.36.2 (2026-11-12)

### Verbeterd
- **Drum Kit (1.19.3): lichtere pagina.** De markering van de huidige stap op de stapknoppen werd elk beeldframe op alle knoppen van alle kanalen bijgewerkt; nu alleen nog als de stap verandert. In een meting van de hoofddraad daalde de tijd van het tekenen van Drum Kit van ongeveer 0,2 naar 0,03 s per 6 s. Geluid, state en uiterlijk zijn ongewijzigd.

## 0.36.1 (2026-11-12)

### Opgelost
- **Stutter en Transient Shaper staan nu in een subcategorie van Effecten.** Ze misten in de bibliotheekindeling en stonden daardoor los bovenaan Effecten, boven de subcategorieën. Stutter staat nu onder Tijd & ruimte, Transient Shaper onder Dynamica.

## 0.36.0 (2026-11-12)

### Toegevoegd
- **Acoustic Drums** (drums, 1.0.0): een gesampled akoestisch drumstel voor funk, soul en jazz met echte snares, hi-hats en bekkens. De opnames (een vrij gelicentieerde jazzkit, CC0) worden na een klik via een link geladen en nooit in de repo gekopieerd; bron, licentie en downloadgrootte staan vóór de klik op de kaart (sets Funk and soul, Funk and soul compact en Jazz, 15 tot 45 MB per microfoon). Velocity-lagen met overgang, round robin, automatische ghost notes en rimshots, side stick, flam, buzz, snaren aan/uit, stemming en demping, hi-hat met closed, pedal, half, open en splash en afkappen zonder plop, ride met bell, crash, toms, microfoonmix, losse uitgangen en dezelfde clip- en lane-koppeling als Drum Kit. Pack `acoustic-drums-styles` met 40 voicings. Niet beluisterd.
- **Drawbar Organ** (synths, 1.0.0): een trekkerorgel met een gedeelde bank van 91 tonewheel-generatoren (gelijkzwevend, met octaafterugvouwen en overspraak), twee manualen en basvoeten met splitpunten, toetsklik, percussie, vibrato en chorus, een roterende speaker (stop, langzaam, snel met aanloop, Doppler en twee microfoons), voorversterker met veerhall en een tweede klankmodel Combo. Pack `drawbar-organ-styles` met 88 tunes (jazz, soul, funk, gospel, blues, ballad, percussief, rotary, combo en bassplit). Niet beluisterd.

## 0.35.6 (2026-11-12)

### Verbeterd
- **Reverb (1.0.1), Transient Shaper (1.0.1) en Pump (1.14.2) rekenen minder.** Toestanden staan nu in lokale variabelen, constanten worden per blok bepaald en bij een uitgeschakeld onderdeel (bijvoorbeeld Early op 0 in Reverb) vervalt het rekenwerk. In een rekentest met de instellingen uit Iron Cathedral en Skyline Ascent: Reverb 1,1 tot 1,5 keer sneller, Transient Shaper ongeveer 1,7 keer, Pump 1,0 tot 1,1 keer in dat geval (tot 3,5 keer in andere instellingen). De uitvoer is sample voor sample identiek (hash over alle uitvoerbits, op meerdere invoeren).
- Delay en Distortion zijn onderzocht en niet gewijzigd: elke variant die dezelfde uitvoer geeft was niet sneller.
- Niet beluisterd; de snelheden zijn gemeten in Node op een drukke machine.

## 0.35.5 (2026-11-12)

### Verbeterd
- **Mastering-apparaten rekenen veel minder.** Master Chain (1.17.1) was in een druk stuk het duurste apparaat (in Iron Cathedral gaf weglaten +0,25 op de verhouding audiotijd/wandtijd). Per sample werden machten, e-machten en nieuwe arrays berekend; die zijn nu gecachet of weggehaald, de true-peakmeting gebruikt een lus zonder modulo, en filter- en omhullingstoestanden die na stilte in denormale getallen (rond 1e-310, waar de processor tot vijf keer trager rekent) bleven hangen, worden nu op nul gezet. Dezelfde wijzigingen zijn doorgevoerd in **Balance EQ 1.15.1**, **Bus Compressor 1.15.1**, **Multiband Balance 1.15.1** (ongeveer 40 % sneller), **Patina 1.17.1**, **Stereo Space 1.15.1** en **Mix Check 1.15.1**.
- Het geluid en de gemelde LUFS-, LRA- en true-peakwaarden zijn bit-identiek in twee testinstellingen met 10 s muziek (uitvoer en meterberichten gehasht). Alleen in stilte, bij waarden onder 1e-30 (onder -600 dBFS), is de uitvoer niet bit-identiek (grootste afwijking 2,3e-29). Dat is niet hoorbaar en alleen gemeten.
- De rekentijd per blok van Master Chain daalt in een Node-test van mediaan 125 naar 60 microseconden. In de echte host (Chromium) kreeg Iron Cathedral een betere verhouding audiotijd/wandtijd (0,70 naar ongeveer 0,8 op een zwaar belaste machine). Niet beluisterd.

## 0.35.4 (2026-11-12)

### Verbeterd
- **Lichtere apparaten voor de processor.** Dezelfde oorzaak als bij Celestial Mechanics (0.35.3): objecten met velden die pas later werden toegevoegd, waardoor de browser de rekenlus niet kon versnellen. Per apparaat is de uitvoer vergeleken met de vorige versie en is die sample voor sample identiek (met een vaste ruisbron), behalve waar hieronder anders staat.
  - **Click Synth 1.19.1:** ongeveer 3,5 keer sneller in de rekenlus.
  - **Layered Landscape 1.14.1:** 1,6 tot 2,6 keer sneller (parameternamen worden niet meer elk blok opnieuw opgebouwd).
  - **Latin Percussion 1.18.1:** 1,3 tot 1,5 keer sneller.
  - **Poly Chorus 1.13.1:** 25 tot 34 % sneller (de instellingen staan niet meer in een woordenboek-object).
  - **Grain Cloud 1.14.1** en **Four-Operator FM 1.14.1:** kleine winst (tot ongeveer 12 % en 4 tot 9 %).
  - Woodwinds, Piano en Paradox zijn nagelopen en niet gewijzigd: daar was niets te winnen.
- **Cinematic Synth 1.17.1: tweede stemgrens.** Losgelaten noten die nog uitklonken telden niet mee voor de limiet van 10 stemmen, waardoor bij heel snel spelen meer dan 150 stemmen tegelijk klonken en de audioklok achterliep (gemeten verhouding 0,29, nu 1,0). Er geldt nu ook een grens van 32 klinkende stemmen: eerst wordt een uitklinkende stem afgekapt (30 ms uitfade), anders de oudste. Bij normaal spelen verandert er niets; alleen boven 32 gelijktijdig klinkende stemmen wordt een uitklinkende staart eerder afgekapt. Dit is een gedragsverandering die niet is beluisterd.
- Niet beluisterd; de snelheden zijn gemeten in Node op een drukke machine.

## 0.35.3 (2026-11-12)

### Verbeterd
- **Celestial Mechanics (1.14.1) vraagt veel minder van de processor.** In een druk stuk met veel planeten nam dit apparaat van alle apparaten het meeste van de audiodraad (gemeten ca. 52 %). De planeten kregen hun velden pas gaandeweg, waardoor de browser de rekenlus niet kon versnellen; nu hebben ze vanaf het begin dezelfde velden. Daarnaast worden er geen nieuwe arrays per audioblok meer gemaakt, is er een sinus per planeet per sample minder en wordt de panning per blok berekend. In een rekentest met 14 planeten was het ruim twee tot vier keer sneller, met exact dezelfde uitvoer (zelfde samples als 1.14.0). Niet beluisterd; wel gemeten dat het geluid niet verandert.

## 0.35.2 (2026-11-12)

### Opgelost
- **Pulse Drums-tunes: kicks klinken niet meer als een bongo.** In het pack *Pulse Drums Techno* (1.1.1) hadden 24 van de 37 tunes een kick die te hoog of te kort was: een grondtoon boven 80 Hz of een uitklinktijd onder 0,1 s (vooral de nieuwere drum & bass-tunes met een `tune` rond -6 tot +4, en de korte kicks van onder meer Hypnotic, Squelch, Half-Time en Miami). Per tune is alleen de `tune` en de `decay` van de kick aangepast (de rest van de state is ongewijzigd), gemeten in de echte host: de grondtoon ligt nu tussen ca. 37 en 76 Hz, zakkend naar ca. 32 tot 59 Hz, en de uitklinktijd is langer (-12 dB na 0,09 tot 0,2 s). Niet beluisterd.

## 0.35.1 (2026-11-12)

### Opgelost
- **Clip Arranger (1.37.2): de matrix houdt zijn scrollpositie vast.** Een scène lager in de lijst afspelen springt niet meer terug naar de bovenste scène. De matrix scrolt de scène die speelt nu ook in beeld als die buiten beeld valt.

## 0.35.0 (2026-11-12)

### Toegevoegd
- **Zes nieuwe songs voor dancegenres**, elk met een Clip Arranger voor de structuur: **Concrete Meridian** (techno, 130 BPM, 4:26), **Late Train Home** (house, 124 BPM, 4:23), **Skyline Ascent** (trance, 138 BPM, 5:48), **Skyline Ignition** (EDM, 128 BPM, 4:15), **Slow Horizon** (progressive, 126 BPM, 7:07) en **Golden Hour Lights** (top 40 pop, 102 BPM, 3:08), in `songs/techno/`, `house/`, `trance/`, `edm/`, `progressive/` en `pop/`. De top 40 song is gestart met **Remix** (recept Nieuwe song, stijl Pop, hitscore 100 van 100) en daarna uitgewerkt. De kicks van Pulse Drums staan lager en langer (model Deep, tune -16 tot -17, decay 0,8, sweep 0,65: grondtoon ca. 63 Hz zakkend naar ca. 45 Hz, staart ca. 0,35 s), omdat een hoge, korte kick als een bongo klinkt. Elk spoor en elk drumkanaal krijgt noten van de sequencer. Gecontroleerd met `check-song.py` en metingen per apparaat; bij vier songs is de hele lengte niet in een doorloop gemeten (de machine was overbelast, de rest is in testkopieen gemeten). **Niet beluisterd.**

## 0.34.2 (2026-11-12)

### Opgelost
- **Plop bij een choke** in Drum Kit (1.19.1) en Pulse Drums (1.20.2): als een gesloten hat een open hat afkapte, sprong de uitklinkende envelope terug naar zijn piek. De release houdt nu de huidige waarde vast (`cancelAndHoldAtTime`). Niet beluisterd.
- **Drum Kit 1.19.2 en Drum Machine 1.18.1**: dezelfde fix als Pulse Drums 1.20.1. De start van een slag wordt naar boven afgerond op een grens van 128 samples, zodat elke slag gelijk klinkt bij 135 BPM. Gemeten in een offline render (135 BPM, aanzet van de eerste 20 ms): de kick van Drum Kit had een cyclus van drie (0,057 / 0,042 / 0,045) en is nu gelijk (0,044 / 0,043 / 0,043); de snare van Drum Machine had 0,099 / 0,117 / 0,089 en is nu gelijk (0,106). Click Synth en Latin Percussion starten in een worklet, sample-nauwkeurig, en hebben dit niet. Niet beluisterd.
- **Pump 1.14.1**: een duck-moment binnen een halve sample van het blokeinde ging verloren (ongeveer 0,4% van de events); de positie wordt nu begrensd op het laatste sample van het blok.

## 0.34.1 (2026-11-12)

### Opgelost
- **Hip-hopsongs: alle drumkanalen klinken nu.** In Boom Bap, G-Funk, Lo-Fi en Trap hadden rim, shaker, cowbell, woodblock en sub 808 een eigen patroon in de Drum Kit, maar de Drum Kit staat op `run: false` en de Pattern Tracker stuurde hun noten niet, dus ze bleven stil. Elk ontbrekend instrument heeft nu een eigen spoor in de Pattern Tracker (**Rim**, **Shaker**, **Cowbell**, **Wood**, **Sub**) met een kabel naar `trigger`, met dezelfde hits als het patroon in de kit, in de secties waar de kick speelt. Gemeten in de host over de hele song: elk kanaal geeft geluid. Niet beluisterd.
- **songs/AGENTS.md:** stap 8 en de lijst met valkuilen: loop elk spoor en elk drumkanaal langs, want een kanaal dat de sequencer nooit aanstuurt blijft stil zonder foutmelding.

## 0.34.0 (2026-11-11)

### Toegevoegd
- **Drie drum & bass-songs** in `songs/drum-and-bass/`, elk in een eigen smaak: **Stadium Daybreak** (dancefloor, 174 BPM, A mineur: supersaw-hook, vocal chops, gesplitste sub en mid-bas), **Amber Hours** (minimaal liquid, 172 BPM, A dorisch: elektrische-piano-akkoorden, bassgitaar, fluit, strijkers, vinyltextuur) en **Iron Cathedral** (neurofunk, 174 BPM, E frygisch: morphende Neuro Bass, droge strakke drums, drone en cluster, stutter-fills). Ze gebruiken de nieuwe Neuro Bass, Transient Shaper en Stutter en de nieuwe DnB-tunes. `check-song` geeft exitcode 0 voor alle drie; de twee zwaardere songs zitten in de drops op het plafond van de Master Chain en de outro van Iron Cathedral is niet gemeten. Niet beluisterd. De stijlgids `songs/styles/drum-and-bass.md` noemt de drie smaken en de nieuwe packs.

## 0.33.0 (2026-11-11)

### Toegevoegd
- **Drum & bass: drie nieuwe apparaten en veel nieuwe klanken.** **Neuro Bass (1.0.0, Synths)**: een mono bas met twee oscillatoren, FM en ringmodulatie, een schone mono sub onder een instelbare crossover (alleen de hoge band wordt vervormd), drie waveshaper-trappen, een formantfilter met een Morph-macro, een LFO op tempo en een begrenzer; 70 tunes (Neurofunk, Detune Stack, Liquid, Jump Up, Dancefloor, Sub, Dubstep and Bass Music, Techno, Stabs and Hits). **Transient Shaper (1.0.0, Effects)**: attack en sustain omhoog of omlaag, onafhankelijk van het niveau, optioneel drie banden, geen latency; 35 presets. **Stutter (1.0.0, Effects)**: beat repeat op het tempo (1/4 tot 1/32, triolen), gate-patroon, pitch-ramp, decay, tape stop en reverse; 34 presets.
- **Nieuwe drum & bass-tunes in 41 bestaande packs (ongeveer 620 tunes):** bassynths (Neurofunk, Detune Stack, Liquid, Dancefloor DnB, Jump Up, Jungle, DnB Leads), leads, keys, pads, strijkers en zang (Liquid DnB, Dancefloor DnB, Neuro Pads), donkere texturen, risers en impacts, en drumkits met patronen (Tech Step, Liquid, Dancefloor, Neurofunk, Jump Up, Jungle, Halftime, Amen Chops). Packs gaan naar 1.1.0. Niveaus zijn per apparaat gemeten en gelijkgetrokken. Niet beluisterd.

## 0.32.0 (2026-11-11)

### Toegevoegd
- **Remix (1.0.0), een nieuw apparaat in Tools.** Remix leest de song van een Clip Arranger, analyseert toonsoort, akkoorden, secties en hook, en zet een remix als **extra song** in dezelfde Clip Arranger; de eerste song blijft staan en **Herstel** haalt de remix weg. Recepten: **Hit-versie** en **Radio edit** (intro, couplet, refrein, couplet, refrein, breakdown, dubbel refrein, outro, hooguit 3:30, naar een klassieke hitformule), **Club mix** (DJ-intro met alleen een kick, opbouw, drops, breakdown, DJ-uitloop), **Tempo flip** (clips en secties ×2 of ÷2 bij een tempo dat ongeveer een factor 2 verschilt, bijvoorbeeld 68 naar 138 BPM) en **Nieuwe song** uit een stijl (House, Pop, Hip-hop, Disco, Synthwave) met toonsoort, akkoordgang, bas, slagwerk en een hook uit een seed, voor het bootstrappen van een song. De analyse toont toonsoort, akkoorden met Romeinse cijfers, secties, hook en een hitscore met controles (duur, eerste refrein, secties van 4 maten, breakdown, outro, akkoorden in de toonladder). Remix werkt op noten en clips en kan niet luisteren: **niet beluisterd**. Pack **Remix Recipes** met 21 presets, handleiding en screenshots in beide talen.
- **Contract v1.35, §13k: de state van een ander apparaat lezen en schrijven.** `host.stateOf(this, doelId)` geeft een kopie van de state van een ander apparaat, `host.setStateOf(this, doelId, state)` zet een state via `setState` van dat apparaat, alleen kort na een klik van de gebruiker. Optioneel; bestaande apparaten blijven werken. Validator, tests en beide contracttalen zijn bijgewerkt.

### Gewijzigd
- **Songinstructies:** stap 2 noemt een klassieke hitformule en verwijst naar de stijlen en recepten van Remix; de AGENTS.md van Clip Arranger beschrijft hoe een ander apparaat de song mag lezen en schrijven.

## 0.31.0 (2026-11-11)

### Toegevoegd
- **AI Chat kan devices op je vloer aanpassen.** Vraag bijvoorbeeld om de hoge tonen helderder te maken of de mastering te corrigeren: de AI bekijkt de werkruimte en de regelaars van de devices, leest in de repository wat ze doen en stelt wijzigingen voor met de oude en nieuwe waarde. **Pas toe** zet ze, **Maak ongedaan** zet ze terug. Zonder jouw klik verandert er niets.

## 0.30.25 (2026-11-11)

### Hersteld
- **Pulse Drums (1.20.1): elke slag klinkt gelijk, ook bij 135 BPM.** Bij een tempo waarop een tel niet in een heel aantal renderblokken van 128 samples past (135 BPM: 166,67 blokken), tikte elke derde bassdrum harder dan de andere twee, omdat de ruis van de klik anders klinkt als de start midden in een blok valt. De start van elke slag wordt nu naar boven afgerond op een blokgrens (hooguit 2,7 ms later, nooit eerder dan gepland). Gemeten in een echte browser met de tune Squelch: de scherpste sprong per slag was 0,31, 0,19 en 0,13 voor de drie plekken en is nu 0,27 voor alle drie. Niet beluisterd. Drum Kit, Click Synth, Latin Percussion en Drum Machine gebruiken dezelfde opbouw en zijn niet aangepast.

## 0.30.24 (2026-11-11)

### Gewijzigd
- **Clip Arranger (1.37.1):** minder ruimte tussen de poortenrij en de regel met Project, en de verticale lijn in de kleur van de sectie staat verder naar links, los van de afspeelknoppen van de scènes.

## 0.30.23 (2026-11-11)

### Gewijzigd
- **Clip Arranger (1.37.0): kleuren met een kleurkiezer.** Spoor, scène en sectie krijgen een kleur via een kleurkiezer in plaats van een lijst met nummers (het potlood bij het spoor en bij de scène; Kleur in de sectie-instellingen). Klik op de naam van een scène om hem te hernoemen. Kies je een sectie, dan staat links en rechts van haar scènes een verticale lijn in de kleur van de sectie. De vakjes met clipnummers in de sectieblokken zijn weg.

## 0.30.22 (2026-11-11)

### Gewijzigd
- **Clip Arranger (1.36.0): meer scènes in één sectie.** Bij Scènes in de sectie-instellingen voeg je met + scène scènes toe (en wissel je de volgorde); ze spelen na elkaar, elk Maten lang, en de reeks herhaalt Herhalingen keer. Een clip die over twee scènes is uitgerekt, speelt zo door de hele sectie. Songs en presets zonder dit veld klinken gelijk.
- **De rij Sectie onder de tracks is weg** en de clipknoppen in 01 zijn weg (ze staan in 02; Knip clip is erbij gekomen). De kop van 02 toont nu TRACK / SCÈNE / CLIP van de gekozen clip. In plaats van het vierkantje wordt + nu overal als gewone + getoond.

## 0.30.21 (2026-11-11)

### Gewijzigd
- **Clip Arranger (1.35.0): sectie 02 (Track) zit nu in de spoorkop.** Klik op de naam of het label van een spoor om het aan te passen, het tracktype is een keuzelijst in de kop, en kleur, transponeren, gate, swing, velocity en Track auditeren (bij drums ook protocol, swing rij en de drumrijen) staan onder het potlood. Live opname → deze clip staat nu in de clip-editor, die sectie 02 is geworden.

## 0.30.20 (2026-11-11)

### Gewijzigd
- **Clip Arranger (1.34.0): een clip aan een scène toekennen met een keuzelijst.** Elke cel in de matrix heeft een keuzelijst (▾; een lege cel toont kies clip ▾) met de clips van de bibliotheek, geen clip, of een nieuwe clip. Dezelfde clip mag in zoveel scènes als je wilt. Een lege cel maakt niet meer vanzelf een clip aan.

## 0.30.19 (2026-11-11)

### Gewijzigd
- **Clip Arranger (1.33.0): de clips zijn echt een bibliotheek per spoor, los van de scènes.** In 03 blijven de clips in een vaste volgorde met vaste nummers staan; een scène is alleen een rij die per spoor naar een clip wijst. Een scène verwijderen, toevoegen, dupliceren of verplaatsen verandert de bibliotheek niet meer (in 0.30.18 schoven de clips daarbij naar achteren). Een lege cel toont + (klik maakt een nieuwe clip). Haal uit scène laat de clip in 03 staan, Verwijder clip helemaal gooit hem weg. Dezelfde clip kan in meer scènes staan (verwijzing, ↻); een clip uit de clipbalk naar een cel slepen zet hem erin. Oude songs en presets (ook de 58 meegeleverde) klinken en laden gelijk.

## 0.30.18 (2026-11-11)

### Gewijzigd
- **Clip Arranger (1.32.0): de clips zijn een bibliotheek per spoor, los van de scènes.** Een clip uit een scène halen (rechtermuisknop of Delete: Haal uit scène) laat hem in de clipbalk (03) staan; Verwijder clip helemaal gooit hem echt weg. De × bij een scène verwijdert de rij weer echt (niet meer grijs) en haar clips blijven in de bibliotheek. Een nieuwe scène (+) heeft lege cellen; zet er een clip in via Hergebruik clip of door hem uit de clipbalk naar de cel te slepen. De bibliotheek begint met 8 clips en groeit tot 48. Oude songs en presets klinken gelijk. Dit herstelt de × van 0.30.17, die een scène alleen grijs maakte.

## 0.30.17 (2026-11-11)

### Toegevoegd
- **Clip Arranger (1.31.0): een uitgerekte clip volgt de secties van de song.** Een clip van 16 maten die je over twee scènes hebt uitgerekt, speelt in songmodus sectie 1 en daarna sectie 2, ook als die tweede sectie niet de scène direct eronder gebruikt, zolang de sectie op dat spoor geen eigen clip heeft. De clip gaat verder waar de vorige sectie ophield, dus de lengte van de secties bepaalt hoeveel maten elke sectie speelt. Andere sporen spelen gewoon hun eigen clips per sectie. Voorheen speelde zo'n clip na de eerste sectie niet door. De songbalk toont het vervolg.
- **Undo en Redo per deel.** In de songbalk, bij de clipmatrix en in de clip-editor staan eigen Undo- en Redo-knoppen; ze maken alleen de laatste wijziging in dat deel ongedaan, wijzigingen in andere delen blijven staan. Ctrl+Z en Ctrl+Shift+Z werken voor het deel waar je het laatst klikte. De Undo en Redo bovenin blijven alles in volgorde terugdraaien.
- **Een clip hergebruiken.** Rechtermuisknop op een clip: Hergebruik in volgende lege scène of in alle lege scènes (of Alt + slepen naar een ander slot van hetzelfde spoor). Het slot is een koppeling, geen kopie: een wijziging in de clip klinkt in elke scène die hem hergebruikt. Maak eigen kopie maakt het weer los.
- **De × bij een scène verwijdert geen clips meer.** Hij haalt de scène alleen uit de secties van de songs; de rij met haar clips blijft staan. **Verwijder lege scènes** ruimt echt op.

## 0.30.16