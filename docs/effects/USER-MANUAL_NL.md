# Gebruikershandleiding effecten

*English version: [USER-MANUAL_EN.md](USER-MANUAL_EN.md)*

Effecten nemen geluid op, veranderen het en sturen het door. Deze handleiding beschrijft de twaalf effecten in [`devices/effects/`](../../devices/effects/README_NL.md): Chorus, Effect Chain, Filter, Flanger, Frequency Shifter, Grit, Phaser, Pump, Resonator, Room, Tremolo en Vocoder. Voor het starten van Patchkamer, het laden van een bibliotheek en het trekken van kabels: zie de [basishandleiding](../USER-MANUAL_NL.md).

## Inhoud

1. [Welk effect voor welk doel](#welk-effect-voor-welk-doel)
2. [Effecten gebruiken](#effecten-gebruiken)
3. [De volgorde van effecten in een keten](#de-volgorde-van-effecten-in-een-keten)
4. [Chorus](#chorus)
5. [Effect Chain](#effect-chain)
6. [Filter](#filter)
7. [Flanger](#flanger)
8. [Frequency Shifter](#frequency-shifter)
9. [Grit](#grit)
10. [Phaser](#phaser)
11. [Pump](#pump)
12. [Resonator](#resonator)
13. [Room](#room)
14. [Tremolo](#tremolo)
15. [Vocoder](#vocoder)
16. [Als het niet werkt](#als-het-niet-werkt)

## Welk effect voor welk doel

| Ik wil… | Gebruik | Waarom |
|---|---|---|
| Een geluid dikker of breder maken (beweging) | [Chorus](#chorus), [Flanger](#flanger), [Phaser](#phaser) | Drie effecten met een langzaam bewegende zweep (LFO). Chorus heeft een Ensemble-stand met drie stemmen. |
| Het volume laten pulseren | [Tremolo](#tremolo) | Snelheid en diepte, meer niet. |
| Een geluid onharmonisch of metalig maken | [Frequency Shifter](#frequency-shifter) | Verschuift alle frequenties een vast aantal Hz. Dat is geen toonhoogteverandering. |
| Vervormen en donkerder maken | [Grit](#grit) | Drive in een resonant laagdoorlaatfilter, met een LFO op de cutoff. |
| Echo en galm toevoegen | [Room](#room) | Eén effect met een delay en een galm naast elkaar. |
| Een geluid laten naklinken op een akkoord | [Resonator](#resonator) | Vier gestemde resonatoren, afgestemd op een grondtoon en een akkoord. |
| Bas of pads onder de kick laten wijken | [Pump](#pump) | Sidechain, trigger of de klok van de studio. |
| De klank vormen, een band weghalen of benadrukken | [Filter](#filter) | Tien filtertypen, van laagdoorlaat tot klinkers en kamfilters. |
| Een stem laten praten door een synth | [Vocoder](#vocoder) | 16 banden; de stem opent ze op een draaggolf. |
| Een hele keten bouwen (ambient, cinematic, techno, dub, lo-fi…) | [Effect Chain](#effect-chain) | Tot 8 effecten achter elkaar uit een lijst van 33, met kant-en-klare ketens als presets. |

## Effecten gebruiken

- Een effect heeft een audio-ingang (**In**) en een audio-uitgang (**Uit**). Zet het tussen de geluidsbron en het volgende apparaat: bijvoorbeeld Duofone → effect → Mixer of Speakers. Voor de andere manieren om een apparaat aan te sluiten: zie de [basishandleiding](../USER-MANUAL_NL.md) (onderdeel 4 en 5).
- De paarse **Mod**-poort neemt een modulator aan. Die kan de knoppen van het effect bewegen terwijl het speelt. De knop blijft de basiswaarde; de modulator beweegt eromheen.
- Effecten zijn apparaten **zonder eigen geluid**, dus ze hebben **presets** en geen tunes. Kies er een in de balk bovenaan de kaart, blader met ◀ ▶ en bewaar je eigen met **Bewaar**. Zie [Presets](../../presets/README_NL.md) voor de pakketten en het importeren: de tab **Presets** van de bibliotheek → **Importeren…**.
- Dubbelklik op een schuif om terug te gaan naar de beginwaarde.
- Een **Mix**-knop mengt het originele (droge) en het bewerkte (natte) geluid. Op 0% hoor je alleen het origineel.
- Effecten die zwiepen (Chorus, Flanger, Phaser) draaien vrij in Hz of volgen het tempo van de studio (**Tempo**). Start de klok met **Start** om beweging op tempo te horen.

## De volgorde van effecten in een keten

De volgorde telt, want elk effect werkt op wat het vorige maakte. Een gebruikelijke volgorde is:

1. Eerst **klank opruimen**: een filter of equalizer die haalt weg wat je niet nodig hebt.
2. **Vervorming** (Grit, of de vervormingseffecten in Effect Chain).
3. **Beweging**: Chorus, Flanger, Phaser, Tremolo.
4. **Ritme**: Pump of een gate.
5. **Echo** en daarna **galm**, zodat de echo's ook een ruimte krijgen.
6. **Breedte** en **dynamiek** (compressor, limiter) aan het eind.

Dit is een beginpunt, geen regel. Vervorming na een galm klinkt anders dan ervoor; probeer beide. Zet een **limiter** als laatste, want een keten met veel effecten kan harder worden dan zijn ingang. Effect Chain volgt deze volgorde in de meeste van zijn presets (zie [Effect Chain](#effect-chain)).

Voor een paar losse effecten verbind je ze in serie met kabels (**Uit** van effect 1 naar **In** van effect 2). Voor meer dan drie of vier doet [Effect Chain](#effect-chain) het in één kaart.

## Chorus

**Waar het voor dient.** Chorus verdubbelt een geluid met kleine, langzaam bewegende vertragingen. Het geluid wordt breder en minder statisch. Er zijn twee soorten: **Chorus (2 stemmen)** en **Ensemble (3 stemmen)**, waarbij elke stem een trage en een snelle beweging heeft.

![De Chorus-kaart](../images/nl/effects/chorus.png)

**De regelaars.**

- **Soort:** *Ensemble (3 stemmen)* of *Chorus (2 stemmen)*.
- **Tempo:** *vrij* (de knop **Snelheid** bepaalt) of een nootlengte: 4 maten, 1 maat, 1/2, 1/4 of 1/8 per beweging.
- **Snelheid** (0,03 tot 8 Hz) is het tempo van de beweging; alleen in gebruik als **Tempo** op *vrij* staat.
- **Diepte** is de grootte van de beweging.
- **Vertraging** (3 tot 30 ms) is de basisvertraging van de stemmen.
- **Breedte** bepaalt hoe ver de stemmen over links en rechts verdeeld zijn. Op 0% zitten alle stemmen in het midden.
- **Toon** (800 tot 16000 Hz) is een laagdoorlaatfilter op het bewerkte geluid.
- **Mix** mengt origineel en effect.

**Poorten.** **In**, **Uit**, **Mod** (zes parameters: Snelheid, Diepte, Vertraging, Breedte, Toon en Mix).

**Voorbeeld.** Duofone → Chorus → Speakers. Kies de soort *Chorus (2 stemmen)*, **Snelheid** 0,4 Hz, **Diepte** 25%, **Vertraging** 14 ms, **Mix** 35%: een lichte verdubbeling. Kies voor een pad *Ensemble (3 stemmen)* en een hogere **Breedte**.

**Presets.** Pakket **Chorus Basics** (12 presets) in [`presets/chorus.patchkamer-presets.json`](../../presets/chorus.patchkamer-presets.json), in de mappen **Subtle** (Subtle Double, Classic Chorus, Thick Mono), **Ensemble** (String Section, Wide Pad, Dark Choir), **Movement** (Bar Shimmer, Slow Wash, Eighth Pulse), **Extreme** (Seasick, Tape Warble, Lo-fi Swarm). Laad het met de tab **Presets** van de bibliotheek → **Importeren…** (of via een bibliotheek die het bevat) en kies dan een preset in de balk bovenaan de kaart, of blader met ◀ ▶.

**Tips.** Met **Breedte** op 0% zit elke stem in het midden; gebruik dat als het geluid mono moet blijven. Het toonfilter heeft een bewaker: komt er een foutieve waarde (`NaN` of oneindig) op de ingang, dan wordt het filter binnen een fractie van een seconde vervangen en komt het geluid terug.

## Effect Chain

**Waar het voor dient.** Effect Chain zet tot **8 effecten** achter elkaar in één kaart. Elk van de 8 **slots** bevat één effect dat je kiest uit een lijst van **33**, met een eigen mix, een bypass en eigen regelaars. Over de hele keten staan een ingangsniveau, een uitgangsniveau, een totale mix en een **analyzer**. Hij is gemaakt voor hele ketens: ambient, cinematic, techno, dub, lo-fi, glitch en meer.

![De Effect Chain-kaart](../images/nl/effects/effect-chain.png)

### De kaart instellen

Bovenaan de kaart:

- **Keten** is een lijst met 17 ingebouwde ketens (bijvoorbeeld *Ambient Space*, *Warm Tape*, *Techno · Rumble*; de laatste is *Empty Chain*). Een keuze vult de slots. Wijzig je iets, dan wordt de naam *Eigen keten*. Deze ingebouwde ketens horen bij het apparaat. De presets in de balk bovenaan de kaart (zie "Presets" hieronder) staan los daarvan: dat zijn complete ketens voor één toepassing.
- **Aantal** (1 tot 8) bepaalt hoeveel slots je ziet. Verborgen slots houden hun effect en instellingen.
- **Ingang** en **Uitgang** (beide −12 tot +12 dB) stellen het niveau in de keten in en eruit in. **Totale mix** (0 tot 100%) mengt de hele keten met het originele geluid.
- **Weergave** kiest wat de analyzer toont (zie hieronder).

Daaronder zie je de slots van links naar rechts (het geluid loopt **IN → 1 → 2 → … → UIT**). Schuif opzij voor alle slots.

### Een slot instellen

Elk slot is een kolom:

- **Effect aan** / **Bypass aan** is een knop. Met **Bypass aan** geeft het slot het geluid ongewijzigd door.
- **←** en **→** verplaatsen het slot één plek in de keten. Bij verplaatsen of een ander effect kiezen verdwijnt de staart van dat effect (een echo of galm die nog naklonk).
- **Effect** kiest het effect. **Doorvoer** laat het slot leeg. Kies je later weer terug, dan onthoudt het effect de instellingen die het in dit slot had.
- Een klein plaatje laat zien wat het effect doet: een filtercurve, de vorm van een galm, de echo-taps, het ritme van een gate of de golfvorm van de uitgang.
- **Effectmix** mengt het geluid vóór het slot (droog) en het effect (nat). Gebruikelijke beginwaarden: vervorming 60 tot 100%, beweging 20 tot 50%, echo en galm 15 tot 50%, filter of EQ 100%. Kies je **Limiter · peak**, dan gaat de slotmix naar 100%.
- Onder **Parameters** staan de regelaars van het gekozen effect. Een lijst is een keuze (een ruimte, een patroon, een nootlengte); een schuif is een waarde.

### De 33 effecten

**Klank en dynamiek**

| Effect | Wat het doet |
|---|---|
| Filter | Laagdoorlaat, hoogdoorlaat of banddoorlaat met **Frequentie**, **Resonantie** en een typekeuze. |
| EQ · drie banden | **Laag**, **Midden** en **Hoog** (elk ±12 dB) met een **Middenfrequentie** van 150 tot 6000 Hz. |
| Compressor | **Drempel**, **Verhouding**, **Attack**, **Release** en **Make-up**. |
| Limiter · peak | Een sample-peak-limiter met 5 ms lookahead. **Plafond**, **Herstel** en **Ingangsboost**. Zet hem als laatste. |
| Stereo Beeld | Mid/side-breedte (0 tot 2×). **Mono → stereo** voegt decorrelatie toe (met **Decorrelatie** als vertragingstijd); controleer het resultaat ook in mono. |

**Vervorming en karakter**

| Effect | Wat het doet |
|---|---|
| Warme saturatie | Zachte saturatie met **Drive** (0 tot 24 dB), **Helderheid** en **Compensatie**. |
| Distortion | Hardere vervorming met **Drive** tot 36 dB, **Helderheid** en **Uitgang**. |
| Overdrive | **Drive**, **Helderheid**, **Asymmetrie** en **Uitgang**. |
| Multiband Drive | Een aparte **Laag-drive**, **Midden-drive** en **Hoog-drive**. Het is geen mastering-crossover. |
| Digitale Gruis | Echte bitreductie (2 tot 16 bits) en sample-hold (400 tot 48000 Hz), met **Drive**, **Glitch / jitter** en **Rate-modulatie**. |
| Vinylstof | Gesynthetiseerde **Slijtage**, **Wow / flutter**, **Ruis** en **Tikjes**, met een **Toerental** van 33⅓, 45 of 78 RPM. |

**Beweging**

| Effect | Wat het doet |
|---|---|
| Chorus | **Snelheid**, **Diepte** en **Stereobreedte**. |
| Flanger | **Snelheid**, **Diepte** en **Feedback** (−75% tot +75%). |
| Phaser | **Snelheid**, **Diepte** en **Middenfrequentie**. |
| Tremolo | **Snelheid** en **Diepte**. |
| Auto-pan | Beweegt het geluid tussen links en rechts met **Snelheid** en **Breedte**. |
| Auto Filter | Een LFO beweegt een filter rond de **Basisfrequentie**: **Resonantie**, **Beweging** (snelheid), **LFO-diepte** (in octaven) en het **Filtertype**. |
| Ringmodulator | **Draagfrequentie** (0,1 tot 2000 Hz) en **Diepte**. |

**Ritme** (deze volgen de klok van de studio; start het transport met **Start**)

| Effect | Wat het doet |
|---|---|
| Pumping / Duck | Laat het volume op het tempo wijken, zonder kick-ingang. **Puls** (1/16 tot 1 maat), **Ducking-diepte** en **Herstelcurve**. Zet de effectmix op 100%. |
| Trance Gate | Een volumepatroon van 16 stappen. **Patroon** (*Offbeat*, *Syncopen*, *Tresillo*, *Broken*), **Diepte** en **Gate-lengte**. Mix 100% voor volledige gates. |
| Beat Stutter | Neemt per maat het laatste fragment over en herhaalt het tijdelijk. **Herhaalfragment**, **Herhalen per maat** en **Richting** (vooruit of achteruit). De eerste maat vult de buffer. |
| Tempo Delay | Een echo in notenwaarden (1/16 tot 1 maat, ook gepunteerd), met **Feedback** en **Helderheid**. Volgt het tempo van Patchkamer. |
| Wobble Filter | Een filter dat op het tempo beweegt: **Filtercyclus**, **Basisfrequentie**, **Beweging** (octaven) en **Resonantie**. |

**Echo en ruimte**

| Effect | Wat het doet |
|---|---|
| Stereo delay | **Tijd** (0,03 tot 2 s), **Feedback** en **Echohelderheid**. |
| Pingpong echo | Een echo die tussen links en rechts springt: **Tijd per kant**, **Feedback**, **Echohelderheid** en **Stereobreedte**. |
| Frequentie Echo | Verschuift de boventonen bij elke echo een aantal Hz (geen verschuiving in halve tonen): **Verschuiving**, **Echotijd**, **Feedback** en **Helderheid**. |
| Reverb / Galm | Een galm met 12 ruimtes: *Kamer*, *Hal*, *Hemel*, *Studio*, *Badkamer*, *Houten zaal*, *Plate*, *Kerk*, *Kathedraal*, *Grot*, *Tunnel* en *Bevroren wolk* (de kaart toont de lengte in seconden). Verder **Voorvertraging** en **Galmhelderheid**. De lengtes zijn synthetisch, niet gemeten. |
| Hybride Reverb | Een parallelle mix van een gekozen ruimte en een algoritmische staart (**Algoritmisch aandeel**, **Algoritmische ruimte**, **Algoritmische staart**). |
| Shimmer Reverb | Een granulaire octaafverschuiving (**Transpositie**, **Korrelgrootte**) gevolgd door een diffuse staart (**Ruimte**, **Uitklank**). |
| Kosmos · ambient | Acht gemoduleerde delaylijnen met diffusie voor lange, dichte staarten: **Vertraging**, **Staart / feedback**, **Diffusie**, **Modulatie**, **Helderheid** en **Breedte**. |
| Granular Delay | Overlappende korrels met **Transpositie** (−12 tot +24 st), **Korrelgrootte**, **Vertraging**, **Verspreiding** en **Feedback**. |
| Freeze / Klankwolk | Neemt de afgelopen audio op. Kies **Bevroren** nadat er geluid binnenkomt. Dit is een granulaire tijdlus, geen spectrale freeze. **Opnamelengte** en **Afspeelsnelheid**. |
| Harmonische Resonators | Vijf op akkoord gestemde comb-resonators kleuren het inkomende geluid: **Grondtoon (MIDI)**, **Akkoord** (*Open / majeur*, *Mineur 9*, *Sus*, *Majeur 9*), **Uitklank**, **Helderheid** en **Breedte**. |

### De Mod-ingang

De paarse **Mod**-poort kan de hoofdregelaars (**Ingang**, **Uitgang**, **Totale mix**) bewegen en, voor elk slot dat in gebruik is, de **Effectmix** en de schuiven van het effect. Elk heeft een vaste naam per slotpositie (slot 1, slot 2, …), dus een modulator blijft bij de positie, niet bij het effect dat er staat. Keuzes (ruimtes, patronen, nootlengtes, freeze, akkoord, filtertype, toerental, richting) worden niet gemoduleerd. Modulatie wordt niet in een preset bewaard.

### De analyzer

**Weergave** kiest wat er wordt getoond voor de uitgang van de hele keten:

- **Spectrum · lijn** en **Spectrum · balken** tonen de frequenties van 30 Hz tot 20 kHz.
- **Spectrogram** toont frequenties in de tijd (hoog bovenaan, tijd naar rechts).
- **Golfvorm** toont de golfvorm.
- **Stereobeeld** toont links tegen rechts, met de correlatie ernaast.
- **Niveaumeters** tonen piek (boven) en RMS (onder).
- **Uit / minder CPU** zet de analyzer en de kleine plaatjes van de slots uit.

Onder het beeld staan de **Piek** en de **RMS** van de uitgang in dBFS.

### Presets: complete ketens

Pakket **Effect Chain Basics** (14 presets) in [`presets/effect-chain.patchkamer-presets.json`](../../presets/effect-chain.patchkamer-presets.json), in de mappen **Atmosphere** (Drifting Soundscape, Cinematic Dread, Psychedelic Trip, Dream Voice), **Studio** (Tape Slapback, Lo-Fi Tape Memory, Drum Bus Glue, Dub Chamber), **Club** (Basement Techno, Squelch Bus, Neon Nights, Trance Ascent), **Sound Design** (Glitch Lab, Industrial Warehouse). Laad het met de tab **Presets** van de bibliotheek → **Importeren…** (of via een bibliotheek die het bevat) en kies dan een preset in de balk bovenaan de kaart, of blader met ◀ ▶.

Elke preset is een hele keten, geen los effect. Ze zijn opgebouwd in de volgorde uit het onderdeel "De volgorde van effecten in een keten": klank, vervorming, beweging, ritme, echo, galm, breedte en een limiter. De tabel noemt de effecten in volgorde van de slots, met de **Effectmix** tussen haakjes.

| Preset | Toepassing | Slots in volgorde |
|---|---|---|
| **Drifting Soundscape** (Atmosphere) | Ambient: langzaam bewegende klankwolken zonder ritme | Granular Delay (0,4) › Shimmer Reverb (0,4) › Kosmos · ambient (0,5) › Chorus (0,5) › Auto-pan (0,5) › Stereo Beeld (1) |
| **Cinematic Dread** (Atmosphere) | Filmisch: donkere resonantie, een enorme ruimte, langzame beweging | Warme saturatie (0,4) › Harmonische Resonators (0,5) › Ringmodulator (0,2) › Frequentie Echo (0,4) › Phaser (0,3) › Reverb / Galm (0,5) › Stereo Beeld (1) › Limiter · peak (1) |
| **Psychedelic Trip** (Atmosphere) | Psychedelisch: kolkende beweging en echo's | Phaser (0,6) › Flanger (0,4) › Tremolo (0,4) › Frequentie Echo (0,35) › Kosmos · ambient (0,35) › Auto-pan (0,5) |
| **Dream Voice** (Atmosphere) | Een vocale ruimte: gladgestreken stem met glans | Compressor (1) › EQ · drie banden (1) › Chorus (0,2) › Pingpong echo (0,2) › Reverb / Galm (0,25) › Shimmer Reverb (0,15) › Stereo Beeld (1) |
| **Tape Slapback** (Studio) | Minimalistisch: een korte, warme slapback-echo voor gitaar of zang | Warme saturatie (0,5) › Pingpong echo (0,3) › Filter (1) › Reverb / Galm (0,18) |
| **Lo-Fi Tape Memory** (Studio) | Lo-fi: een oud cassettegevoel met stof, wow en flutter | Digitale Gruis (0,4) › Vinylstof (1) › Filter (1) › Chorus (0,25) › Reverb / Galm (0,2) |
| **Drum Bus Glue** (Studio) | Een drumbus: plakken, aandikken, wat ruimte | Compressor (1) › Warme saturatie (0,5) › Multiband Drive (0,4) › Hybride Reverb (0,12) › Limiter · peak (1) |
| **Dub Chamber** (Studio) | Dub: tape-achtige saturatie, rollende echo's, een stuiterende kamer | Warme saturatie (0,6) › Tempo Delay (0,45) › Pingpong echo (0,3) › Auto Filter (0,6) › Reverb / Galm (0,25) › Compressor (1) |
| **Basement Techno** (Club) | Techno: donker en gruizig, strakke bas, een grote betonnen ruimte | Filter (1) › Warme saturatie (0,6) › Pumping / Duck (1) › Tempo Delay (0,25) › Reverb / Galm (0,3) › Multiband Drive (0,5) › EQ · drie banden (1) |
| **Squelch Bus** (Club) | Een bus voor een acid-bas: schreeuwende vervorming met beweging | Distortion (0,9) › Filter (1) › Wobble Filter (1) › Phaser (0,35) › Tempo Delay (0,2) › EQ · drie banden (1) |
| **Neon Nights** (Club) | Synthwave: brede chorus, overdrive, gepunteerde echo's, een glanzende galm | Chorus (0,5) › Overdrive (0,5) › Tempo Delay (0,3) › Shimmer Reverb (0,2) › Reverb / Galm (0,3) |
| **Trance Ascent** (Club) | Trance: gate, stijgend filter, echo's, een brede galm | Trance Gate (0,9) › Auto Filter (0,8) › Pumping / Duck (1) › Tempo Delay (0,3) › Shimmer Reverb (0,2) › Reverb / Galm (0,3) › Stereo Beeld (1) |
| **Glitch Lab** (Sound Design) | Glitch en sound design: stotteren, bitcrush, frequentie-echo's | Beat Stutter (1) › Digitale Gruis (0,5) › Frequentie Echo (0,35) › Pingpong echo (0,25) |
| **Industrial Warehouse** (Sound Design) | Industrieel: harde vervorming in een enorme ruimte | EQ · drie banden (1) › Overdrive (1) › Distortion (0,8) › Multiband Drive (0,6) › Ringmodulator (0,3) › Reverb / Galm (0,4) › Frequentie Echo (0,35) › Limiter · peak (1) |

*Dit pakket kan nog wijzigen; de tabel hierboven geeft weer wat er in het bestand stond toen deze handleiding werd geschreven.* De instellingen van elk slot (tijd, feedback, drive enzovoort) zitten in de preset zelf; laad hem en bekijk de kaarten.

### Tips en beperkingen

- Veel effecten (die met eigen geluidsverwerking) draaien in de hoofdthread van je browser via een ScriptProcessor, met een korte extra vertraging. Gebruik op een trage computer minder van die slots.
- Ritme-effecten hebben de klok nodig: druk op **Start**.
- Een keten met veel effecten kan harder worden dan de ingang. Gebruik **Ingang**, **Uitgang**, **Totale mix** en de make-up- en uitgangsregelaars, en sluit de keten af met een **Limiter · peak** (alle mixen op 100%, **Uitgang** op 0 dB).
- Galm en echo klinken door als de klok stopt.
- Een bewaker kijkt elke 50 ms naar de uitgang van elk slot. Geeft een slot iets terug dat geen getal is (of absurd hard), dan wordt dat slot opnieuw opgebouwd en is de staart van dat effect weg; daarna gaat het geluid door.

## Filter

**Waar het voor dient.** Een filter haalt frequenties weg of benadrukt ze. Dit filter heeft tien typen, een drive vóór het filter, een mix en een uitgangsniveau.

![De Filter-kaart](../images/nl/effects/filter.png)

**De regelaars.**

- **Type:** *LP 12 dB*, *LP 24 dB* (laagdoorlaat), *HP 12 dB*, *HP 24 dB* (hoogdoorlaat), *Band*, *Notch*, *Vocaal (klinkers)*, *Ladder 24 dB (worklet)*, *Kam + (worklet)* en *Kam − (worklet)*. *Vocaal* geeft je de klinkers A, E, I, O en U met drie formanten. De *Ladder* en de twee kamfilters hebben AudioWorklet nodig; de kaart meldt dat onder de regelaars.
- **Cutoff** (20 tot 20000 Hz) is waar het filter werkt. Bij *Vocaal* verschuift hij de klinkers; bij de kamfilters bepaalt hij de toonhoogte.
- **Resonantie** benadrukt het gebied rond de cutoff.
- **Drive** vervormt vóór het filter.
- **Klinker** (A tot U, ertussen mengen de klinkers) werkt alleen bij *Vocaal*.
- **Mix** mengt origineel en gefilterd geluid.
- **Niveau** (0 tot 200%) is het uitgangsniveau van het gefilterde geluid.

**Poorten.** **In**, **Uit**, **Mod**. De modulator beweegt **Cutoff** sample voor sample (snel), en ook **Resonantie**, **Drive**, **Klinker** en **Mix**.

**Voorbeeld.** Duofone → Filter → Speakers. Kies *LP 24 dB*, **Cutoff** 1200 Hz, **Resonantie** 30%. Sluit een modulator aan op **Mod** om het filter te openen en te sluiten.

**Presets.** Pakket **Filter Basics** (14 presets) in [`presets/filter.patchkamer-presets.json`](../../presets/filter.patchkamer-presets.json), in de mappen **Basics** (Soft Lowpass, Warm Lowpass, Tight Highpass, Telephone, Notch Scoop), **Movement** (Wah Stop, Vowel Choir, Talking Mouth, Comb Pipe, Hollow Comb), **Aggressive** (Ladder Squelch, Screaming Resonance, Fuzz Wall, Razor Comb). Laad het met de tab **Presets** van de bibliotheek → **Importeren…** (of via een bibliotheek die het bevat) en kies dan een preset in de balk bovenaan de kaart, of blader met ◀ ▶.

**Tips.** Zonder AudioWorklet in je browser geven de drie worklet-typen het geluid ongewijzigd door en meldt de kaart dat. Een foutieve waarde op de ingang vergiftigt het filter niet meer: de ladder en de kamfilters begrenzen hem, de andere typen worden bewaakt en vervangen.

## Flanger

**Waar het voor dient.** Een flanger mengt een geluid met een zeer korte, bewegende vertraging. Met feedback maakt hij een zwiepende, holle beweging.

![De Flanger-kaart](../images/nl/effects/flanger.png)

**De regelaars.**

- **Tempo:** *vrij* of een nootlengte (8 maten tot 1/4).
- **Golf:** *Sinus* of *Driehoek*, de vorm van de beweging.
- **Snelheid** (0,02 tot 10 Hz); alleen in gebruik als **Tempo** op *vrij* staat.
- **Diepte** is de grootte van de beweging.
- **Manual** (0,2 tot 12 ms) is de basisvertraging: de plek waar omheen de zwiep beweegt.
- **Feedback** (−97% tot +97%) voert de uitgang terug naar de ingang. Negatieve waarden geven een ander karakter.
- **Stereo** is het faseverschil tussen links en rechts (0° tot 180°).
- **Mix** mengt origineel en effect.

**Poorten.** **In**, **Uit**, **Mod** (zes parameters; **Manual** is snel).

**Voorbeeld.** Duofone → Flanger → Speakers. **Snelheid** 0,15 Hz, **Diepte** 70%, **Manual** 2,5 ms, **Feedback** 60%, **Mix** 50%: een langzame zwiep.

**Presets.** Pakket **Flanger Basics** (12 presets) in [`presets/flanger.patchkamer-presets.json`](../../presets/flanger.patchkamer-presets.json), in de mappen **Classic** (Gentle Flange, Jet Sweep, Slow Tide, Metal Sweep), **Subtle** (Stereo Shimmer, Soft Doubler), **Tempo** (Bar Sweep, Two-Bar Rise), **Extreme** (Metallic Scream, Laser Drop, Comb Drone, Wild Wobble). Laad het met de tab **Presets** van de bibliotheek → **Importeren…** (of via een bibliotheek die het bevat) en kies dan een preset in de balk bovenaan de kaart, of blader met ◀ ▶.

**Tips.** Zonder AudioWorklet geeft de flanger het geluid ongewijzigd door en meldt dat onder de regelaars.

## Frequency Shifter

**Waar het voor dient.** Een frequency shifter verschuift alle frequenties een vast aantal Hz. Dat is geen toonhoogteverandering: de boventonen raken hun onderlinge verhouding kwijt en het resultaat is niet harmonisch. Kleine verschuivingen geven een langzame zweving; grote verschuivingen een metalige, vervreemdende klank.

![De Frequency Shifter-kaart](../images/nl/effects/frequency-shifter.png)

**De regelaars.**

- **Bereik:** *±20 Hz (zweving)*, *±200 Hz* of *±2000 Hz (vervreemding)*. Dat is de grootste verschuiving die de knop **Shift** haalt.
- **Shift** verschuift de frequenties. De knop is gekromd: kleine waarden bij het midden maken kleine stappen. De kaart toont de verschuiving in Hz.
- **Feedback** (0 tot 95%) voert het resultaat terug naar de ingang. Dat maakt spiraaleffecten.
- **Stereo** schuift het rechterkanaal de andere kant op. Boven 50% meldt de kaart *rechts omgekeerd*.
- **Mix** mengt origineel en effect.

**Poorten.** **In**, **Uit**, **Mod** (**Shift** is snel, sample voor sample).

**Voorbeeld.** Duofone → Frequency Shifter → Speakers. **Bereik** ±20 Hz, **Shift** een kleine positieve waarde, **Mix** 50%: een langzame zweving. Met **Bereik** ±2000 Hz en wat **Feedback** wordt het geluid onharmonisch.

**Presets.** Pakket **Frequency Shifter Basics** (13 presets) in [`presets/frequency-shifter.patchkamer-presets.json`](../../presets/frequency-shifter.patchkamer-presets.json), in de mappen **Subtle** (Gentle Shift, Slow Beat, Stereo Drift, Thick Detune), **Inharmonic** (Metal Shimmer, Bell Warp, Robot Voice, Broken Radio, Alien Down), **Feedback** (Rising Spiral, Falling Spiral, Barber Chaos, Endless Fall). Laad het met de tab **Presets** van de bibliotheek → **Importeren…** (of via een bibliotheek die het bevat) en kies dan een preset in de balk bovenaan de kaart, of blader met ◀ ▶.

**Tips.** Zonder AudioWorklet geeft het apparaat het geluid ongewijzigd door en meldt dat. Het droge signaal wordt 63 samples vertraagd, zodat het gelijk loopt met het bewerkte.

## Grit

**Waar het voor dient.** Grit vervormt een geluid en stuurt het door een resonant laagdoorlaatfilter, met een LFO op de cutoff. Het maakt een bron ruwer en donkerder.

![De Grit-kaart](../images/nl/effects/grit.png)

**De regelaars.**

- **Drive** is hoeveel de ingang wordt vervormd.
- **Cutoff** (100 tot 16000 Hz) is de knik van het laagdoorlaatfilter.
- **Reso** (0,3 tot 18) is de resonantie van het filter.
- **LFO** (0,02 tot 8 Hz) is de snelheid van de beweging op de cutoff.
- **Diepte** is de grootte van die beweging. Op 0% blijft de cutoff stilstaan.
- **Niveau** is het uitgangsniveau.

Grit heeft geen **Mix**-knop: het hele signaal gaat door de vervorming en het filter.

**Poorten.** **In**, **Uit**, **CC** (een eventingang die de cutoff instelt: `{type:"cc", id:"cutoff", value:0..1}` loopt van 100 tot 16000 Hz) en **Mod** (alle zes de regelaars).

**Voorbeeld.** Een bassynth → Grit → Speakers. **Drive** 60%, **Cutoff** 1200 Hz, **Reso** 6; zet **LFO** op 2 Hz en **Diepte** op 30% voor een wobble.

**Presets.** Pakket **Grit Basics** (12 presets) in [`presets/grit.patchkamer-presets.json`](../../presets/grit.patchkamer-presets.json), in de mappen **Warm** (Warm Edge, Dull Blanket, Fuzz Bass), **Motion** (Slow Sweep, Wah Pulse, Underwater, Helicopter), **Extreme** (Bright Razor, Acid Bite, Screamer, Siren, Meltdown). Laad het met de tab **Presets** van de bibliotheek → **Importeren…** (of via een bibliotheek die het bevat) en kies dan een preset in de balk bovenaan de kaart, of blader met ◀ ▶.

**Tips.** Een kleine bewaker begrenst de ingang op +24 dB en vervangt een filter dat is ontspoord. Grit werkt ook zonder AudioWorklet; alleen de ingangsbewaker ontbreekt dan.

## Phaser

**Waar het voor dient.** Een phaser laat een reeks inkepingen met een langzame beweging door het geluid zwiepen. Het geeft een wervelend, voorbijtrekkend karakter.

![De Phaser-kaart](../images/nl/effects/phaser.png)

**De regelaars.**

- **Trappen:** 4, 6, 8 of 12. Meer trappen geven meer inkepingen.
- **Tempo:** *vrij* of een nootlengte (8 maten tot 1/8).
- **Snelheid** (0,02 tot 10 Hz); alleen in gebruik als **Tempo** op *vrij* staat.
- **Diepte** wordt in octaven getoond: hoe ver de zwiep rond **Midden** beweegt.
- **Midden** (100 tot 6000 Hz) is het midden van de zwiep.
- **Feedback** (−95% tot +95%) voert de uitgang terug; negatieve waarden hebben een ander karakter.
- **Stereo** is het faseverschil tussen links en rechts (0° tot 180°).
- **Mix** mengt origineel en effect.

**Poorten.** **In**, **Uit**, **Mod** (zes parameters).

**Voorbeeld.** Duofone → Phaser → Speakers. **Trappen** 6, **Snelheid** 0,25 Hz, **Diepte** 70%, **Midden** 800 Hz, **Feedback** 50%, **Mix** 50%.

**Presets.** Pakket **Phaser Basics** (11 presets) in [`presets/phaser.patchkamer-presets.json`](../../presets/phaser.patchkamer-presets.json), in de mappen **Classic** (Soft Phase, Slow Sweep, Swirl, Hollow Notch), **Tempo** (Bar Phase, Long Rise, Stereo Drift), **Extreme** (Rocket, Warp Drive, Wobble Robot, Wide Vortex). Laad het met de tab **Presets** van de bibliotheek → **Importeren…** (of via een bibliotheek die het bevat) en kies dan een preset in de balk bovenaan de kaart, of blader met ◀ ▶.

**Tips.** De kaart herinnert eraan dat **Stereo** het faseverschil tussen links en rechts instelt. Een bewaker bouwt de filterketens opnieuw op als een foutieve waarde de terugkoppeling zou vergiftigen; in normaal gebruik blijft het geluid gelijk.

## Pump

**Waar het voor dient.** Pump zet het volume van een bron op de tel omlaag, zodat bas en pads plaatsmaken voor de kick. Dat kan op drie manieren: **Sidechain** luistert naar een tweede audio-ingang (zoals een kick), **Trigger** reageert op trigs of noten en **Klok** duikt vanzelf op het tempo, zonder kabel. Verwar het niet met het effect **Pumping / Duck** in [Effect Chain](#effect-chain): dat is een los, eenvoudiger effect van dat apparaat.

![De Pump-kaart](../images/nl/effects/pump.png)

**De regelaars.**

Bovenaan:

- **Preset** is een lijst met beginstanden in het apparaat zelf (*Classic pump*, *Low end only*, *Kick as sidechain*, *Soft breathing*, *Gated (1/16)*, *Trigger from sequencer*, *Parallel (subtle)*). Hij wordt *Custom* zodra je iets wijzigt. Dit is niet dezelfde lijst als de presets in de balk bovenaan de kaart.
- **Bron:** *Sidechain (audio)*, *Trigger (events)* of *Klok (vanzelf)*.
- **Klok: elke:** 1/16, 1/8, 1/4 (elke tel), 1/2 of hele maat. Alleen in gebruik bij *Klok*.
- **Wat duikt:** *Het hele signaal*, *Alleen het laag* of *Alleen het hoog*.
- **Sidechain luistert naar:** *Laag (kick)*, *Alles* of *Hoog (hats)*. Alleen in gebruik bij *Sidechain*.
- **Aan** / **Uit (doorlaten)**, **Release volgt tempo**, **Luister naar sidechain** (hoor wat de detector hoort, om het luisterfilter in te stellen) en **Test duik** (één duik om de instelling te proberen).
- Een meter toont de demping in de tijd, met het getal in dB naast de knoppen.

**Duik:** **Diepte** (hoe ver het signaal omlaag gaat), **Release** (20 tot 1500 ms, hoe snel het terugkomt), **Attack** (0,1 tot 60 ms), **Hold** (0 tot 300 ms; Trigger en Klok) en **Curve** (0 = recht terug, 1 = laat en snel terug, strak pompen).

**Sidechain-detector** (alleen bij *Sidechain*): **Drempel** (−60 tot 0 dB), **Ratio** (1 tot 20) en **Luisterfilter** (40 tot 8000 Hz).

**Klank:** **Kantelpunt** (40 tot 1000 Hz, de grens tussen laag en hoog; alleen als *Wat duikt* niet *Het hele signaal* is), **Mix** (parallel: het deel van het geduikte signaal), **Make-up** (0 tot 12 dB) en **Release op tempo** (het deel van de afstand tot de volgende slag, als **Release volgt tempo** aan staat).

De kaart verbergt de regelaars die niet bij de gekozen bron horen.

**Poorten.** **In**, **Sidechain** (audio), **Uit**, **Trigger** (events: trig, noot) en **Mod**.

**Voorbeeld.** Zet Pump achter een bassynth. Kies **Bron** *Klok (vanzelf)*, **Klok: elke** *1/4 (elke tel)* en zet **Release volgt tempo** aan; start de klok: de bas duikt op elke tel, zonder kabels. Voor een sidechain trek je de kick (bijvoorbeeld een losse drumuitgang) naar **Sidechain** en kies je **Bron** *Sidechain (audio)*.

**Presets.** Pakket **Pump Basics** (13 presets) in [`presets/pump.patchkamer-presets.json`](../../presets/pump.patchkamer-presets.json), in de mappen **Clock** (Gentle Pulse, Four on the Floor, Eighth Chop, Sixteenth Gate, Half Time Slam, Bar Breath), **Sidechain** (Kick Duck, Vocal Space, Hat Tickle), **Split and Mix** (Low Duck, Top Duck, Parallel Pump, Note Duck). Laad het met de tab **Presets** van de bibliotheek → **Importeren…** (of via een bibliotheek die het bevat) en kies dan een preset in de balk bovenaan de kaart, of blader met ◀ ▶.

**Tips.** Met **Wat duikt** op *Alleen het laag* blijft de bovenkant van een pad staan terwijl de bas wijkt voor de kick. De worklet begrenst zijn ingangen op +24 dB en heeft AudioWorklet nodig; zonder gaat het geluid ongewijzigd door en meldt de kaart dat.

## Resonator

**Waar het voor dient.** De resonator maakt van een ritme of ruis een zingende, gestemde klank. Hij heeft een bank van vier resonatoren die je stemt op een grondtoon en een akkoord.

![De Resonator-kaart](../images/nl/effects/resonator.png)

**De regelaars.**

- **Grondtoon** (een noot van 24 tot 84, de kaart toont de naam) en **Akkoord**: *Unisono*, *Octaven*, *Kwinten*, *Groot*, *Klein*, *Sus4*, *Klein 7*, *Kwarten* of *Cluster*.
- **Galmtijd** (0,05 tot 8 s) is hoe lang de resonatoren naklinken.
- **Demping** haalt het hoog uit het naklinken.
- **Ontstemming** (0 tot 50 cent) zet de vier resonatoren een klein stukje uit elkaar.
- **Stemming** (−12 tot +12 halve tonen) verschuift de hele bank.
- **Mix** mengt origineel en effect. **Niveau** (0 tot 200%) is het uitgangsniveau.
- **Noten:** *negeren* of *grondtoon volgt de noten*. Bij de tweede keuze stellen noten die op de poort **Noten** binnenkomen de grondtoon in.

**Poorten.** **In**, **Noten** (events), **Uit**, **Mod**.

**Voorbeeld.** Een drumcomputer → Resonator → Speakers. **Akkoord** *Klein*, **Galmtijd** 0,6 s, **Mix** 20%: een gestemde tint op de drums. Wil je dat een keyboard de toonhoogte bepaalt: sluit Keys aan op **Noten** en kies *grondtoon volgt de noten*.

**Presets.** Pakket **Resonator Basics** (13 presets) in [`presets/resonator.patchkamer-presets.json`](../../presets/resonator.patchkamer-presets.json), in de mappen **Subtle** (Subtle Tint, Drum Tuner, Sub Ring, Marimba Hit), **Chords** (Minor Haze, Major Shine, Sus Cloud, Jazz Seven, Open Fourths, Note Follower), **Extreme** (Metal Drone, Endless Bells, Scream Pipes). Laad het met de tab **Presets** van de bibliotheek → **Importeren…** (of via een bibliotheek die het bevat) en kies dan een preset in de balk bovenaan de kaart, of blader met ◀ ▶.

**Tips.** Resonator heeft AudioWorklet nodig; zonder gaat het geluid ongewijzigd door en meldt de kaart dat. Het apparaat bewaart bij een preset ook de laatst gespeelde grondtoon (in `noteRoot`).

## Room

**Waar het voor dient.** Room zet een delay en een galm in één effect. De delay en de galm nemen allebei de ingang; ze voeden elkaar niet.

![De Room-kaart](../images/nl/effects/room.png)

**De regelaars.**

- **Delay:** *op tempo (3/16)* of *vrij*. Bij de eerste is de echotijd drie zestiende stappen van de klok van de studio.
- **Tijd** (0,05 tot 1,5 s) is de echotijd, alleen bij *vrij*.
- **Feedback** (0 tot 92%) is hoe lang de echo's herhalen.
- **Delay HP** (40 tot 2000 Hz) is een hoogdoorlaatfilter in de echo's, zodat ze niet dof worden.
- **Delay mix** is hoeveel echo je hoort.
- **Galm** (0,3 tot 8 s) is de lengte van de galm.
- **Galm toon** (500 tot 16000 Hz) is een laagdoorlaatfilter op de galm.
- **Galm mix** is hoeveel galm je hoort.

**Poorten.** **In**, **Uit**, **Mod** (zes parameters, in twee sporen: delay en galm).

**Voorbeeld.** Duofone → Room → Speakers. Laat **Delay** op *op tempo (3/16)*, **Feedback** 35%, **Delay mix** 25%, **Galm** 3 s en **Galm mix** 25%.

**Presets.** Pakket **Room Basics** (12 presets) in [`presets/room.patchkamer-presets.json`](../../presets/room.patchkamer-presets.json), in de mappen **Spaces** (Small Room, Warm Hall, Bright Plate, Cathedral), **Delays** (Dotted Echo, Slapback, Long Ping, Dub Echo), **Space FX** (Endless Wash, Dark Void, Bright Cloud, Metal Tunnel). Laad het met de tab **Presets** van de bibliotheek → **Importeren…** (of via een bibliotheek die het bevat) en kies dan een preset in de balk bovenaan de kaart, of blader met ◀ ▶.

**Tips.** De galmstaart wordt uit ruis gemaakt als je **Galm** wijzigt, dus hij verschilt telkens een beetje. De pakketten houden **Feedback** onder 75%. Een bewaker verlaagt de feedback even als de echolus gaat oplopen, en bouwt de lus opnieuw op bij een foutieve waarde.

## Tremolo

**Waar het voor dient.** Tremolo laat het volume in een vaste snelheid op en neer gaan. Er zijn twee knoppen.

![De Tremolo-kaart](../images/nl/effects/tremolo.png)

**De regelaars.**

- **Snelheid** (0,1 tot 20 Hz) is het tempo.
- **Diepte** (0 tot 100%) is hoe ver het volume omlaag gaat. Op 100% wordt het geluid onderaan elke beweging helemaal stil.

**Poorten.** **In**, **Uit**, **Mod** (**Snelheid** en **Diepte**).

**Voorbeeld.** Een pad → Tremolo → Speakers. **Snelheid** 6 Hz, **Diepte** 15% is een lichte glinstering; **Snelheid** 4 Hz, **Diepte** 50% een duidelijke puls.

**Presets.** Pakket **Tremolo Basics** (13 presets) in [`presets/tremolo.patchkamer-presets.json`](../../presets/tremolo.patchkamer-presets.json), in de mappen **Classic** (Subtle Shimmer, Gentle Pulse, Vintage Amp, Deep Throb), **Slow** (Slow Swell, Tidal, Deep Breath), **Rhythmic** (Slow Pump, Eighth Chop, Sixteenth Gate), **Extreme** (Helicopter, Ring Buzz, Seasick Wobble). Laad het met de tab **Presets** van de bibliotheek → **Importeren…** (of via een bibliotheek die het bevat) en kies dan een preset in de balk bovenaan de kaart, of blader met ◀ ▶.

**Tips.** Tremolo verandert alleen het volume. Er is geen tempo-instelling: de snelheid is altijd in Hz.

## Vocoder

**Waar het voor dient.** De Vocoder laat een stem (of een ander geluid) een synth bespelen. De stem opent 16 frequentiebanden op een **draaggolf**: de ingebouwde synth (zaagtand, puls of driehoek, bespeeld met noten), ruis, of een externe synth op de tweede audio-ingang. Het resultaat is de klassieke pratende synth.

![De Vocoder-kaart](../images/nl/effects/vocoder.png)

**De regelaars.**

Bovenaan:

- **Klankbeeld** is een lijst met beginstanden in het apparaat zelf (*Warm Robot*, *Whisper Choir*, *Hard Machine*, *Ghost Choir*, *Subtle Voice*, *External Synth*). Dit is niet dezelfde lijst als de presets in de balk bovenaan de kaart.
- **Interne golfvorm:** *Zaagtand*, *Puls* of *Driehoek*.
- **Draagakkoord aan** speelt een vast akkoord (C, G, C, E♭) op de ingebouwde synth; **Draagakkoord uit** stopt het.
- Een scope toont de golfvorm van de uitgang.

Schuiven: **Stemgevoeligheid** (hoe sterk de stem de banden opent), **Envelope-reactie** (5 tot 80 Hz, hoe snel de banden de stem volgen), **Formantverschuiving** (±12 halve tonen), **Helderheid**, **Lucht / ruis** (ruis in de draaggolf), **Interne draaggolf**, **Externe draaggolf**, **Droge stem** (de originele stem erbij gemengd), **Vocoder** (het niveau van het gevocodeerde geluid), **Synth-uitklank** (0,02 tot 3 s) en **Uitgang**.

**Poorten.** **Stem / spraak** (audio: de stem), **Externe draaggolf** (audio: een externe synth), **Noten draaggolf** (events: noten voor de ingebouwde synth), **Vocoder** (audio-uitgang) en **Mod**.

**Voorbeeld.** Sluit een geluidsbron met spraak aan op **Stem / spraak**, een keyboard (Keys) op **Noten draaggolf** en **Vocoder** op de mixer. Speel noten: de ingebouwde synth spreekt in het ritme van de stem. Voor een externe synth: sluit zijn audio aan op **Externe draaggolf**, zet **Externe draaggolf** op 100% en **Interne draaggolf** op 0%.

**Presets.** Pakket **Vocoder Basics** (14 presets) in [`presets/vocoder.patchkamer-presets.json`](../../presets/vocoder.patchkamer-presets.json), in de mappen **Voices** (Classic Robot, Warm Pad Voice, Soft Choir, Voice Doubler), **Textures** (Whisper, Breathy Pad, Ghost Choir, Deep Giant), **Extreme** (Steel Machine, Tiny Alien, Screamer, Gate Chatter), **External** (External Clean, External Edge). Laad het met de tab **Presets** van de bibliotheek → **Importeren…** (of via een bibliotheek die het bevat) en kies dan een preset in de balk bovenaan de kaart, of blader met ◀ ▶.

**Tips.** Zonder signaal op de stem-ingang blijft de vocoder stil. De Vocoder vraagt zelf geen microfoontoegang; gebruik een ander apparaat of een sample als bron. Alle 16 banden draaien op standaard Web Audio-nodes (geen worklet). Een bewaker vervangt de banden als een foutieve waarde (`NaN` of oneindig), vooral op de externe draaggolf, ze zou vergiftigen.

## Als het niet werkt

- **Ik hoor niets.** Controleer de kabels: audio van de bron naar **In** (bij Vocoder naar **Stem / spraak**) en van **Uit** naar de Mixer of Speakers. Druk op **Start**, of klik ergens in Patchkamer: browsers pauzeren audio tot je iets doet. Zie ook onderdeel 13 van de [basishandleiding](../USER-MANUAL_NL.md).
- **Het effect doet niets.** Controleer **Mix** (op 0% hoor je alleen het origineel), het slot in Effect Chain (**Bypass aan**, of **Doorvoer**, of **Effectmix** op 0%) en **Diepte** (op 0% beweegt een zwiepend effect niet).
- **Het effect geeft het geluid ongewijzigd door.** Flanger, Frequency Shifter, Pump, Resonator en drie filtertypen (ladder en de twee kamfilters) hebben AudioWorklet nodig. Heeft je browser dat niet, dan meldt de kaart het. Gebruik een actuele Chrome of Edge.
- **Beweging op tempo staat stil.** Druk op **Start**: de tempokeuzes volgen de klok van de studio. Pump op *Klok* en de ritme-effecten in Effect Chain hebben hem ook nodig.
- **Pump duikt niet.** *Sidechain* heeft een signaal nodig op de poort **Sidechain** (en het moet de **Drempel** halen); *Trigger* heeft trigs of noten nodig op **Trigger**; *Klok* heeft een lopende klok nodig.
- **Resonator volgt de noten niet.** Kies *grondtoon volgt de noten* bij **Noten** en sluit noten aan op **Noten**.
- **Krakende of haperende audio.** Effect Chain draait veel effecten in de hoofdthread: gebruik minder slots, of zet de analyzer op *Uit / minder CPU*. Zie ook Instellingen → Audio in de [basishandleiding](../USER-MANUAL_NL.md).
- **Een knop beweegt niet mee met de modulator.** De knop is de basiswaarde. Controleer de (paarse) kabel naar **Mod** en of de modulator een spoor voor dit effect heeft. Keuzes (lijsten) worden niet gemoduleerd.
