# Synths: gebruikershandleiding

*English version: [USER-MANUAL_EN.md](USER-MANUAL_EN.md)*

Synths zijn de apparaten die uit noten geluid maken. Deze pagina beschrijft de twee synths die bij Patchkamer horen: **Duofone** en **Acid Baselines**. De basis (Patchkamer openen, een bibliotheek laden, kabels trekken) staat in de [basishandleiding](../USER-MANUAL_NL.md). De map met de apparaten is beschreven in [devices/synths](../../devices/synths/README_NL.md).

## Inhoud

1. [Wat synths doen](#wat-synths-doen)
2. [Welke synth voor welk doel](#welke-synth-voor-welk-doel)
3. [Duofone](#duofone)
4. [Acid Baselines](#acid-baselines)
5. [Als het niet werkt](#als-het-niet-werkt)

## Wat synths doen

Een synth heeft geen audio-ingang. Hij ontvangt **noten** (oranje kabels) en geeft **geluid** (een groenblauwe audiokabel). Beide synths hier hebben ook een paarse **Mod**-ingang: een modulator kan hun regelaars laten bewegen terwijl je speelt (zie [Modulators](../modulators/USER-MANUAL_NL.md)).

Een gewone patch heeft drie stappen, van links naar rechts:

1. Een bron van noten: **Keys / MIDI** (een toetsenbord dat zelf geen geluid maakt), of de ingebouwde sequencer van de synth.
2. De synth.
3. Waar het geluid heen gaat: direct naar **Speakers**, of eerst via een kanaal van een **Mixer** en een effect.

Druk op **Start** om de klok te laten lopen. Zonder klok speelt de sequencer van Acid Baselines niet. De testknoppen van Duofone en noten van Keys werken wel zonder.

Beide synths hebben **tunes**: een tune is de volledige instelling van één synth. Zie [Tunes](../tunes/USER-MANUAL_NL.md) voor het gebruiken en delen ervan.

## Welke synth voor welk doel

| Ik wil… | Gebruik |
|---|---|
| Lijnen, akkoorden of leads spelen vanaf een toetsenbord, met twee toonhoogten die kunnen verschillen | [Duofone](#duofone) |
| Klanken maken met ringmodulatie, hard sync of sample & hold | [Duofone](#duofone) |
| Een basloop die vanzelf speelt, met accent en slide per stap | [Acid Baselines](#acid-baselines) |
| Een bas vormen met meerdere soorten vervorming en een tweede filter | [Acid Baselines](#acid-baselines) |
| De bassynth bespelen vanaf je eigen toetsenbord of een andere sequencer | [Acid Baselines](#acid-baselines) (zet **intern aan** uit) |

## Duofone

### Waar het voor dient

Duofone is een synth met twee oscillatoren die twee verschillende toonhoogten tegelijk kunnen spelen (**duofoon**). De twee oscillatoren delen één filter en één versterker. Er zit ringmodulatie, hard sync, sample & hold en een eigen testtoetsenbord in. Het is geïnspireerd op klassieke duofone analoge synths. Hij speelt één stem tegelijk: van de toetsen die je ingedrukt houdt, hoor je alleen de laagste en de hoogste. Het is dus geen akkoordensynth.

![De kaart van Duofone](../images/nl/synths/duofone.png)

### De regelaars

Dubbelklik op een schuif om terug te gaan naar de beginwaarde. Klik op het getal om een waarde te typen.

**Bovenste rij (keuzes)**

| Regelaar | Wat hij doet |
|---|---|
| **Klankbeeld** | Kiest een van zes beginklanken: Duo Brass, Ring Factory, Sample Hold Lab, Sync Flight, Mono Pulse Bass en Duo Atmosphere. Hij zet veel regelaars tegelijk. Daarna kun je alles aanpassen. |
| **Modelstand** | **Duofoon · twee VCO's** of **Mono · één VCO**. In de monostand is er één oscillator en één envelope voor filter en versterker, en een deel van de regelaars verdwijnt van de kaart. |
| **VCO A**, **VCO B** | De golfvorm van elke oscillator: Zaagtand, Puls of Driehoek. (In de monostand zie je alleen **VCO A**.) |
| **Low-pass** | De steilheid van het filter: 12 dB of 24 dB (alleen in de duofone stand). |
| **VCA envelope** | **ADSR** of **AR** (alleen in de duofone stand). |
| **LFO-vorm** | De vorm van de langzame oscillator (LFO): Zaagtand, Puls of Driehoek. |
| **Hard sync** | **Aan** of **Uit**. Staat hij aan, dan start de fase van VCO B opnieuw telkens als VCO A een cyclus afmaakt (alleen in de duofone stand). |
| **Legato** | **Aan** of **Uit**. Staat hij aan, dan start een noot die je speelt terwijl een andere toets nog ingedrukt is de envelopes niet opnieuw. |

**Testnoot.** **Testnoot MIDI** kiest een nootnummer (24 tot 96, begint op 48). **Speel noot** speelt hem één keer, **Houd noot** houdt hem vast tot je nog een keer drukt, **Test akkoord** speelt drie noten samen (de gekozen noot, een kleine terts en een kwint hoger; Duofone speelt dan de laagste en de hoogste) en **Alles uit** stopt alles. Zo probeer je een klank zonder toetsenbord.

**Filters** (het filter en zijn envelope)

| Regelaar | Wat hij doet | Bereik |
|---|---|---|
| **Cutoff** | Waar het filter gaat afsnijden | 30 tot 16000 Hz (2400) |
| **Resonantie** | Nadruk rond de cutoff | 0 tot 1 (0,25) |
| **Filter-EG** | Hoever de filter-envelope de cutoff beweegt | −5 tot 5 (2,5) |
| **Key tracking** | Hoeveel de cutoff de toonhoogte volgt | 0 tot 1 (0,5) |
| **Filter attack**, **Filter decay**, **Filter sustain**, **Filter release** | De filter-envelope | 0,001 tot 4 s, 0,01 tot 8 s, 0 tot 1, 0,01 tot 8 s |
| **High-pass** | Snijdt lage frequenties weg | 20 tot 6000 Hz (40) |

**Versterker / envelope**: **VCA attack**, **VCA decay**, **VCA sustain** en **VCA release** vormen het volume van elke noot. Attack 0,001 tot 4 s, decay 0,01 tot 8 s, sustain 0 tot 1, release 0,01 tot 8 s.

**Oscillatoren**

| Regelaar | Wat hij doet | Bereik |
|---|---|---|
| **Pulsbreedte** | Breedte van de pulsgolf | 0,05 tot 0,95 (0,5) |
| **Ruis** | Hoeveelheid ruis | 0 tot 1 |
| **Transpositie** | Zet alles hoger of lager | −24 tot 24 halve tonen |
| **VCO A**, **VCO B** | Het niveau van elke oscillator | 0 tot 1 (0,7 en 0,5) |
| **VCO B interval** | Afstand tussen VCO B en zijn noot | −24 tot 24 halve tonen |
| **VCO B fijn** | Kleine detune van VCO B | −35 tot 35 cent |
| **Ringmodulatie** | Mix van de ringmodulatie van beide oscillatoren | 0 tot 1 |

**Modulatie**

| Regelaar | Wat hij doet | Bereik |
|---|---|---|
| **PWM-diepte** | Hoeveel de pulsbreedte beweegt | 0 tot 1 |
| **LFO-snelheid** | Snelheid van de LFO | 0,05 tot 30 Hz |
| **LFO → pitch** | LFO op de toonhoogte (vibrato) | 0 tot 120 cent |
| **LFO → filter** | LFO op de cutoff | 0 tot 1 |
| **Portamento** | Glijtijd tussen noten | 0,001 tot 1 s |
| **VCO B → A FM** | VCO B moduleert de frequentie van VCO A | 0 tot 3 |
| **VCO B → filter** | VCO B moduleert de cutoff | 0 tot 1 |
| **S&H → pitch**, **S&H → filter** | Een willekeurige waarde in stapjes (sample & hold) op de toonhoogte of de cutoff | 0 tot 1 |

**Master**: **Drive** (0 tot 1) voegt vervorming toe, **Uitgang** (0 tot 1) stelt het niveau in. Onderaan de kaart zie je een kleine scope.

In de monostand zijn de regelaars voor de tweede oscillator (niveau **VCO B**, **VCO B interval**, **VCO B fijn**, **VCO B → A FM**, **VCO B → filter**, **Ringmodulatie**), de filter-envelope en **High-pass** verborgen.

![De kaart van Duofone in de monostand](../images/nl/synths/duofone-mono.png)

### Poorten

| Poort | Soort | Gebruik |
|---|---|---|
| **Keyboard / noten** | noten in (oranje) | Sluit **Keys / MIDI** of een sequencer aan. In de duofone stand speelt de laagste toets die je vasthoudt VCO A en de hoogste VCO B. |
| **Mod** | modulatie in (paars) | Een modulator kan de regelaars bewegen. De knopwaarden blijven zoals je ze zette. |
| **Stereo** | audio uit (groenblauw) | Sluit aan op **Speakers** of een **Mixer**-kanaal. |

### Een voorbeeld

1. Plaats **Keys / MIDI**, **Duofone** en **Speakers**.
2. Verbind de oranje notenuitgang van Keys met **Keyboard / noten** op Duofone, en **Stereo** met **In** op Speakers.
3. Druk op **Start**, kies de tune **Trance › Supersaw Lead** (of laat het klankbeeld staan) en speel twee toetsen tegelijk.
4. Zet **VCO B interval** op 7 halve tonen en **VCO B fijn** op 8 cent, en draai **Cutoff** op en neer terwijl je speelt.

Geen toetsenbord? Gebruik dan **Houd noot** of **Test akkoord** op de kaart.

### Tunes

Duofone heeft het pack **Duofone Styles**: 60 tunes in 12 mappen (Techno, House, Trance, Ambient, Drum & Bass, Dubstep, Synthwave, Funk & Disco, Hip-hop, Electro, Pop, Chiptune), vijf per map. Het bestand is [`tunes/duofone-styles.patchkamer-tunes.json`](../../tunes/duofone-styles.patchkamer-tunes.json). Laad het vanuit een bibliotheek (zie de basishandleiding) of met het menu **Tunes ▾** → **Importeren…**, en kies daarna een tune in de lijst op de kaart. Een paar namen: **Dark Stab**, **Supersaw Lead**, **Reese Bass** en **Neon Lead** (twee oscillatoren), en **Rolling Bass**, **Wobble Bass** en **Pulse Lead** (monostand). Een tune zet ook **Modelstand**.

### Tips en beperkingen

- **Klankbeeld** vervangt veel regelaars tegelijk. Kies het eerst en pas daarna aan. Als je een tune kiest, toont **Klankbeeld** de beginklank waar de tune op gebaseerd is.
- De monostand speelt één noot tegelijk. De duofone stand speelt twee toonhoogten tegelijk (de laagste en de hoogste toets die je vasthoudt).
- Ondersteunt je browser geen AudioWorklet, dan meldt de kaart dat de audiomotor niet beschikbaar is.

## Acid Baselines

### Waar het voor dient

Acid Baselines is een bassynth met een eigen 16-staps sequencer. Je tekent een baslijn op een raster, zet accent en slide op de stappen die je wilt, en vormt de klank met zes secties regelaars. Hij speelt mee met de klok en kan ook noten spelen die je vanaf een toetsenbord of een andere sequencer stuurt.

![De kaart van Acid Baselines](../images/nl/synths/acid-baselines.png)

### De regelaars

Dubbelklik op een schuif om terug te gaan naar de beginwaarde. Klik op het getal om een waarde te typen. De zes secties volgen de weg die het geluid door het apparaat aflegt.

**Oscillator**

| Regelaar | Wat hij doet | Bereik (begin) |
|---|---|---|
| **Golfvorm** | Zaagtand of Blok | Zaagtand |
| **Octaaf** | Verschuift de hele synth | −1, 0, +1 (0) |
| **Stemming** | Fijnstemming | −100 tot +100 ct (0) |
| **Sub** | Een blokgolf een octaaf lager | 0 tot 100% (0%) |
| **Ruis** | Ruis | 0 tot 100% (0%) |
| **Osc 2** | Tweede oscillator met dezelfde golfvorm | 0 tot 100% (0%) |
| **Detune 2** | Detune van Osc 2 | −100 tot +100 ct (0) |
| **Ring** | Ringmodulatie van de twee oscillatoren | 0 tot 100% (0%) |

**Filter**

| Regelaar | Wat hij doet | Bereik (begin) |
|---|---|---|
| **Filtertype** | Lowpass, Bandpass of Highpass | Lowpass |
| **Cutoff** | Waar het filter afsnijdt | 80 tot 5000 Hz (520) |
| **Resonantie** | Nadruk rond de cutoff | 0,5 tot 28 (14) |
| **Env mod** | Hoever elke noot het filter opent | 0 tot 100% (65%) |
| **Filter FM** | Frequentiemodulatie van het filter | 0 tot 100% (0%) |
| **Filter 2** | Niveau van een tweede bandpassfilter in parallel | 0 tot 100% (0%) |
| **F2 octaaf** | Verschuift Filter 2 ten opzichte van de cutoff | −2 tot +3 octaven (0) |

**Envelope**

| Regelaar | Wat hij doet | Bereik (begin) |
|---|---|---|
| **Accent** | Hoeveel harder een stap met accent klinkt en hoeveel meer hij het filter opent | 0 tot 100% (70%) |
| **Normal decay** | Decay van een gewone noot | 0,03 tot 3 s (0,30) |
| **Accent decay** | Decay van een noot met accent | 0,03 tot 1 s (0,12) |
| **Soft attack** | Attack van elke noot | 1 tot 300 ms (3) |
| **VCA decay** | Decay van het volume | 0,1 tot 4 s (2,00) |

**Slide**: **Slide tijd** is de glijtijd op stappen met slide, 0,02 tot 0,6 s (0,09).

**Distortion**

| Regelaar | Wat hij doet | Bereik (begin) |
|---|---|---|
| **Type** | Zacht, Hard, Fold of Asym (vier vormen van vervorming) | Zacht |
| **Overdrive** | Hoeveelheid vervorming | 0 tot 100% (35%) |
| **Tight** | Filtert lage frequenties weg vóór de vervorming | uit tot 600 Hz (uit) |
| **Mix** | Vervormd geluid tegenover schoon geluid | 0 tot 100% (100%) |
| **Crush** | Bitdiepte na de vervorming | 2 tot 16 bits (uit = 16) |
| **Toonfilter** | Een lowpassfilter na de vervorming | 500 tot 12000 Hz (7000) |

**Output**: **Niveau** stelt het volume in, 0 tot 100% (60%).

Alles vanaf **Sub** (Sub, Ruis, Osc 2, Detune 2, Ring, Filtertype, Filter 2, F2 octaaf, Type, Tight, Mix, Crush) staat bij het begin uit of neutraal, dus oudere tunes klinken zoals vroeger.

**De sequencer**

- **Raster.** Klik op een vakje om een noot op die stap te zetten; klik nog een keer om hem weg te halen. De rijen lopen van C2 tot C3, één rij per halve toon. Een set heeft 16 stappen.
- **Rij Accent.** Een stap met accent klinkt harder en opent het filter meer (zie **Accent**).
- **Rij Slide.** Een stap met slide glijdt vanaf de noot van de vorige stap. Dezelfde noot met slide is een bindboog: de noot blijft doorklinken.
- **Rij Octaaf.** Elke stap heeft een eigen keuze, +2 tot −2 octaven, bovenop de regelaar **Octaaf**.
- **Sets.** De lijst **SETS** kiest 1, 2, 4, 8 of 16 sets van 16 stappen. De genummerde knoppen boven het raster kiezen welke set je bewerkt. De set die speelt is gemarkeerd.
- **intern aan.** Staat **intern aan** aan, dan speelt de sequencer mee met de klok. Zet hem uit om alleen noten te spelen die op de poort **Noten** binnenkomen.
- **Patroon kiezen…** zet een van 16 patronen in de set die je bewerkt: 01 Rolling, 02 Squelch, 03 Pump, 04 Climb, 05 Stab, 06 Bounce, 07 Hypno, 08 Chase, 09 Walk, 10 Drop, 11 Wobble, 12 Slide run, 13 Offbeat, 14 Octave jump, 15 Minor run, 16 Closing.
- **Nieuwe lijn** vult de set met een willekeurige lijn.
- **Transponeer +** en **Transponeer −** zetten alle noten van de set twee halve tonen omhoog of omlaag. Een noot die voorbij het raster zou gaan, komt aan de andere kant weer in beeld.
- **Kopieer maat naar alle** kopieert de set die je bewerkt naar alle 16 sets.
- **Leeg** maakt de set leeg.

### Poorten

| Poort | Soort | Gebruik |
|---|---|---|
| **Noten** | noten in (oranje) | Noten van **Keys / MIDI** of een andere sequencer. Een noot met velocity boven 0,9 telt als accent. Overlappende noten glijden (slide). |
| **CC** | noten in (oranje) | Control changes met een waarde van 0 tot 1 voor `cutoff`, `res`, `env`, `drive` en `level`. Andere id's worden genegeerd. |
| **Mod** | modulatie in (paars) | Een modulator kan 14 regelaars bewegen: **Stemming**, **Cutoff**, **Resonantie**, **Env mod**, **Normal decay**, **Accent**, **Accent decay**, **Soft attack**, **Slide tijd**, **Filter FM**, **Overdrive**, **Toonfilter**, **VCA decay** en **Niveau**. |
| **Uit** | audio uit (groenblauw) | Sluit aan op **Speakers** of een **Mixer**-kanaal. |

### Een voorbeeld

1. Plaats **Acid Baselines** en **Speakers**. Verbind **Uit** met **In** op Speakers.
2. Druk op **Start**. De beginlijn speelt meteen.
3. Zet **SETS** op **1 × 16** en kies dan **Patroon kiezen… › 02 · Squelch**.
4. Zet **Resonantie** op ongeveer 20, **Env mod** op 80% en draai **Cutoff** langzaam omlaag terwijl het speelt.
5. Zet **Distortion › Type** op **Fold** en verhoog **Overdrive** tot je het goed vindt. Gebruik **Tight** om de laagste noten helder te houden.
6. Wil je hem vanaf een toetsenbord spelen: zet **intern aan** uit, plaats **Keys / MIDI** en verbind de noten met **Noten**.

### Tunes

Acid Baselines heeft het pack **Acid Baselines Classics**: 49 tunes in negen mappen (Chicago Origins, Frankfurt Rolling, Minimal Acid, Squelch Anthems, Acid Techno, Acid Trance, Electro Acid, Deep Acid en AIcid). Het bestand is [`tunes/acid-baselines-classics.patchkamer-tunes.json`](../../tunes/acid-baselines-classics.patchkamer-tunes.json). Elke tune heeft een eigen baslijn. De map **AIcid** gebruikt de nieuwste regelaars (de extra oscillatoren, filtertypen en vervormingen). Een paar namen: **Warehouse Squelch**, **Rolling Thunder**, **Hard Drive**, **Sunrise Acid**, **Neural Squelch**.

Laad het pack vanuit een bibliotheek of met het menu **Tunes ▾** → **Importeren…**, en kies daarna een tune in de lijst op de kaart.

### Tips en beperkingen

- **Resonantie**, **Filter FM** en een cutoff die een modulator omlaag draait kunnen een filter instabiel maken. Een ingebouwde bewaker controleert dit elke 50 ms en vervangt de filters, zodat het geluid vanzelf terugkomt.
- Een noot wordt ongeveer 62% van een stap vastgehouden, tenzij de volgende stap slide heeft: dan houdt hij aan tot de volgende noot.
- De noten in het raster lopen van C2 tot C3. Gebruik **Octaaf**, de octaafrij per stap of een tune om daarbuiten te komen.

## Als het niet werkt

- **Geen geluid.** Controleer of er audio loopt van de synth naar **Speakers** (groenblauwe kabel), of je op **Start** hebt gedrukt en of het volume op Speakers hoog genoeg staat. Klik één keer ergens in Patchkamer: browsers houden audio tegen tot je dat doet.
- **Acid Baselines is stil.** Controleer of **intern aan** aanstaat en de set noten heeft, of dat er noten binnenkomen op **Noten**. Kijk naar **Niveau** en **Cutoff**: een heel lage cutoff met een lage **Env mod** klinkt heel zacht.
- **Duofone reageert niet op een toetsenbord.** Sluit de oranje kabel aan op **Keyboard / noten** (niet op **Mod**). Gebruik voor een MIDI-toetsenbord **Connect MIDI** op Keys; zie de [basishandleiding](../USER-MANUAL_NL.md#13-problemen-oplossen).
- **Gekraak.** Open Instellingen → Audio en kies een grotere latency, of een lagere kwaliteit.
