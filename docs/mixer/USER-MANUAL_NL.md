# Mixer: gebruikershandleiding

*English version: [USER-MANUAL_EN.md](USER-MANUAL_EN.md)*

Deze pagina beschrijft de apparaten die je geluiden samenbrengen en naar buiten sturen: **Mixer**, **Leveler** en **Speakers**. De basis (Patchkamer openen, een bibliotheek laden, kabels trekken) staat in de [basishandleiding](../USER-MANUAL_NL.md). De map met de apparaten is beschreven in [devices/mixer](../../devices/mixer/README_NL.md).

## Inhoud

1. [Wat deze apparaten doen](#wat-deze-apparaten-doen)
2. [Welk apparaat voor welk doel](#welk-apparaat-voor-welk-doel)
3. [Mixer](#mixer)
4. [Leveler](#leveler)
5. [Speakers](#speakers)
6. [Als het niet werkt](#als-het-niet-werkt)

## Wat deze apparaten doen

De meeste patches eindigen op dezelfde manier: meerdere geluidmakers (synths, een drumcomputer, effecten) gaan in een **Mixer**, de Mixer gaat door een **Leveler** als je een gelijkmatig volume wilt, en de laatste kabel gaat in **Speakers**. Speakers is het uitgangsapparaat dat geluid afspeelt op je computer: zonder uitgang hoor je niets.

```
synths, drums …  →  Mixer  →  Leveler (optioneel)  →  Speakers
```

Alle kabels hier zijn groenblauwe audiokabels. De Mixer heeft ook een groene **bundel**kabel (veel kanalen in één kabel), die hieronder wordt uitgelegd.

**Presets.** Deze drie apparaten maken zelf geen geluid, dus ze hebben **presets** en geen tunes. Zie [Presets](../presets/USER-MANUAL_NL.md) voor het gebruiken en delen ervan.

## Welk apparaat voor welk doel

| Ik wil… | Gebruik |
|---|---|
| De balans instellen tussen meerdere geluiden, ze pannen, een kanaal dempen of solo zetten | [Mixer](#mixer) |
| Een deel van een geluid naar een effect sturen, zoals Room, en terughalen | [Mixer](#mixer) (**Send** en **Return**) |
| Geluiden in groepen zetten, bijvoorbeeld alle drums, en met één fader regelen | [Mixer](#mixer) (groepen) |
| Veel bronnen in één keer op hetzelfde volume brengen | [Mixer](#mixer) (**Gelijk trekken**) |
| Een bron die langzaam harder en zachter wordt op een gelijk volume houden | [Leveler](#leveler) |
| Het resultaat horen en het eindvolume instellen | [Speakers](#speakers) |

## Mixer

### Waar het voor dient

Een mengpaneel met 1 tot 32 kanalen en 0 tot 8 groepen, en een master. Elk kanaal heeft trim, een EQ, send en return, pan, een fader en knoppen voor mute en solo. Groepen en de master hebben ook een EQ, send, return en een fader. Achter de master zit een begrenzer (limiter).

![De kaart van Mixer](../images/nl/mixer/mixer.png)

### De regelaars

Dubbelklik op een schuif om terug te gaan naar de beginwaarde. Klik op het getal om een waarde te typen.

**Bovenbalk**

| Regelaar | Wat hij doet |
|---|---|
| **KANALEN** | Hoeveel kanalen er zijn, 1 tot 32 (begin: 8). De poorten op de kaart verschijnen en verdwijnen mee. |
| **GROEPEN** | Hoeveel groepen er zijn, 0 tot 8 (begin: 2). |
| **EQ** | **3 banden** of **5 banden** voor alle kanalen, groepen en de master. |
| **GELIJK TREKKEN** | Meet 4 seconden en zet de **TRIM** van elk kanaal zo dat alle bronnen op het **DOEL**-niveau binnenkomen. Er moet geluid binnenkomen, dus druk eerst op **Start**. Is er geen signaal, dan meldt de Mixer dat. |
| **DOORLOPEND** | Houdt de trims langzaam op het doelniveau (hoogstens 3 dB per seconde). |
| **DOEL** | Het niveau waar **GELIJK TREKKEN** naartoe werkt, −30 tot −6 dB (begin: −18). |
| **BUNDEL IN**, **KANALEN UIT** | De twee bundelpoorten (zie hieronder). |
| **+ GROEPEN EN MIX** | Voegt de groepen en de totale mix toe aan de bundel **KANALEN UIT**. |

**Een kanaal** (van boven naar beneden)

| Regelaar | Wat hij doet |
|---|---|
| Nummer (**1**, **2**, …) | De audio-ingang van het kanaal. |
| Naamveld | Typ een naam voor het kanaal. De naam gaat mee in de bundel. Hoogstens 24 tekens. |
| Bronlijst | Toont **— kabel** (gebruik de kabel op de ingang), of laat je een kanaal kiezen uit een bundel die op **BUNDEL IN** binnenkomt. |
| **SEND**, **RET** (ronde poorten) | De send-uitgang en de return-ingang van het kanaal. |
| **TRIM** | Ingangsversterking, −24 tot +24 dB (0). |
| **LAAG**, **MID**, **HOOG** | EQ-versterking, −15 tot +15 dB (0). Met 3 banden: een lage shelf op 120 Hz, een piek op 1 kHz en een hoge shelf op 6 kHz. Met 5 banden zijn het **LAAG**, **L-MID**, **MID**, **H-MID** en **HOOG**, op 80 Hz, 300 Hz, 1 kHz, 3,5 kHz en 10 kHz (shelf voor de laagste en de hoogste). |
| **SEND** | Hoeveel van het kanaal naar de send-uitgang gaat, 0 tot 100% (0%). |
| **RETURN** | Hoeveel van het geluid op de return-ingang erbij komt, 0 tot 100% (80%). |
| **→ M** | Waar het kanaal heen gaat: naar de master (**→ M**) of naar een groep. |
| **PAN** | Links (−1) tot rechts (+1), midden is **C**. |
| Fader en meter | Het kanaalvolume, −60 tot +6 dB (−6). De balk ernaast is een niveaumeter. |
| **M**, **S** | Mute en solo. Staat bij een kanaal solo aan, dan zijn de kanalen zonder solo stil. |

**Groepen** hebben een naam, send- en returnpoorten, een EQ, **SEND**, **RETURN**, een fader (bij het begin 0 dB) en **M**. De **Master** heeft de uitgangspoort **UIT**, send- en returnpoorten, een EQ, **SEND**, **RETURN** en een fader. Achter de master zit een limiter.

### Hoe het signaal loopt

Elk kanaal loopt ingang → **TRIM** → EQ → fader → **PAN** → mute → groep of master. De **SEND**-uitgang neemt zijn geluid na de fader, pan en mute. De **RETURN**-ingang komt erbij achter de fader en mute van hetzelfde kanaal, dus een kanaal dempen dempt niet wat via zijn return terugkomt.

### Poorten

| Poort | Soort | Gebruik |
|---|---|---|
| **1**, **2**, … | audio in | Het geluid van een apparaat. |
| **RET** onder een kanaal (**Return 1**, …) | audio in | Geluid dat terugkomt van een effect. |
| **SEND** onder een kanaal (**Send 1**, …) | audio uit | Geluid dat naar een effect gaat. |
| **Groep 1 send**, **Groep 1 return**, **Master send**, **Master return** | audio uit en in | Hetzelfde, voor een groep en voor de master. |
| **Uit** | audio uit | De mix. Sluit aan op **Speakers**. |
| **BUNDEL IN** | bundel in (groen) | Een bundel met veel kanalen, bijvoorbeeld de losse uitgangen van een drumcomputer. Kies per kanaal welk bundelkanaal daar binnenkomt, in de bronlijst onder de naam. |
| **KANALEN UIT** | bundel uit (groen) | Alle kanalen na het mixen, als één bundel, bijvoorbeeld naar een recorder. |

### Een voorbeeld

1. Plaats **Duofone**, **Acid Baselines**, **Mixer**, **Room** en **Speakers**.
2. Verbind **Stereo** van Duofone met ingang **1** en **Uit** van Acid Baselines met ingang **2** van de Mixer.
3. Verbind **Uit** van de Mixer met **In** op Speakers.
4. Druk op **Start**. Trek **PAN** van kanaal 1 een beetje naar links en van kanaal 2 een beetje naar rechts.
5. Voor galm: verbind de **SEND**-poort van kanaal 1 met **In** op Room, en **Uit** van Room met de **RET**-poort van kanaal 1. Zet **SEND** op kanaal 1 op ongeveer 30%.
6. Druk op **S** bij kanaal 2 om alleen de bas te horen, en nog een keer om beide te horen.

### Presets

De Mixer heeft presets: een preset bewaart de instellingen van het paneel, maar niet de bronkeuzes van de kanalen. Er hoort geen presetpack bij de Mixer. Gebruik **Bewaar** op de kaart om eigen instellingen te bewaren, en zie [Presets](../presets/USER-MANUAL_NL.md) voor importeren en delen.

### Tips en beperkingen

- Kabels naar een kanaal dat je weghaalt (een lager getal bij **KANALEN**) verdwijnen mee.
- Een oudere Mixerinstelling (versie 1, zonder groepen) wordt omgezet als je hem laadt.
- Een uitbarsting van niet-getallen of enorme waarden van een ander apparaat wordt opgevangen: elke 100 ms vervangt de Mixer een EQ of limiter die is ontspoord en het geluid komt terug.

## Leveler

### Waar het voor dient

Leveler houdt het gemiddelde volume van een bron gelijk. Hij meet het niveau over een instelbare tijd en draait het volume langzaam omhoog of omlaag naar een doelniveau, binnen een bereik dat je kiest. Erachter zit een limiter die korte pieken vangt. Gebruik hem voor bronnen die langzaam harder en zachter worden, bijvoorbeeld als een modulator ze beweegt, of op de hele mix vóór **Speakers**.

![De kaart van Leveler](../images/nl/mixer/leveler.png)

### De regelaars

| Regelaar | Wat hij doet | Bereik (begin) |
|---|---|---|
| **STAND** | **Regelen** of **Doorlaten** (het geluid gaat ongewijzigd door) | Regelen |
| **DOELNIVEAU** | Het niveau waar hij naartoe werkt | −36 tot −6 dB (−18) |
| **REACTIETIJD** | Hoe snel het volume omhoog gaat. Omlaag gaat het drie keer sneller. | 0,2 tot 20 s (3) |
| **MEETTIJD** | De tijd waarover hij meet | 0,1 tot 3 s (0,8) |
| **BEREIK ±** | Het meeste dat hij het volume omhoog of omlaag mag draaien | 0 tot 24 dB (12) |
| **STILTEDREMPEL** | Onder dit niveau blijft het volume staan, zodat galmstaarten en pauzes niet worden opgeblazen | −80 tot −30 dB (−55) |
| **PLAFOND** | De grens van de limiter erachter | −12 tot 0 dB (−1) |

Twee knoppen: **Huidig niveau = doel** zet het doelniveau op wat er nu binnenkomt, en **Regeling op 0** zet de correctie terug op 0.

De meter toont **IN**, **UIT** en **REGEL** (de correctie in dB), met een lampje voor de limiter (**limiter rust** als hij niet werkt).

### Poorten

| Poort | Soort | Gebruik |
|---|---|---|
| **In** | audio in | Het geluid dat gelijk moet blijven. |
| **Uit** | audio uit | Het gelijkmatige geluid. |

### Een voorbeeld

1. Plaats **Acid Baselines**, **Leveler** en **Speakers**.
2. Verbind **Uit** van Acid Baselines met **In** op Leveler, en **Uit** van Leveler met **In** op Speakers.
3. Druk op **Start**. Kies de preset **Sources › Bass Control**.
4. Kijk naar de meter **REGEL**: die toont hoeveel dB de Leveler erbij doet of weghaalt. Verander **Cutoff** of **Niveau** op de synth en zie de meter langzaam meebewegen.

### Presets

Leveler heeft het pack **Leveler Basics**: 11 presets in drie mappen, **Sources** (Gentle Leveling, Drift Tamer, Pad Smoother, Bass Control, Lead Steady, Quiet Rescue), **Mix** (Mix Bus Safety, Slow Ride, Fast Catch, Loud and Tight) en **Utility** (Meter Only). Het bestand is [`presets/leveler.patchkamer-presets.json`](../../presets/leveler.patchkamer-presets.json). Laad het vanuit een bibliotheek (zie de basishandleiding) of met het menu **Presets ▾** → **Importeren…**, en kies daarna een preset in de lijst op de kaart.

### Tips en beperkingen

- De limiter kijkt 5 ms vooruit, dus het geluid wordt 5 ms vertraagd.
- Ondersteunt je browser geen AudioWorklet, dan laat Leveler het geluid ongewijzigd door en meldt dat op de kaart.
- Zeer hoge waarden of niet-getallen van een ander apparaat worden aan de ingang begrensd, zodat één foute waarde niet in het apparaat blijft hangen.

## Speakers

### Waar het voor dient

Speakers is de uitgang van de studio: het geluid gaat naar de luidsprekers of de koptelefoon van je computer, via een limiter, met een meter. Er is één regelaar: het volume.

![De kaart van Speakers](../images/nl/mixer/speakers.png)

### De regelaars

| Regelaar | Wat hij doet | Bereik (begin) |
|---|---|---|
| **Volume** | Het volume | 0 tot 100% (80%) |

Onder de schuif zit een kleine balk die het niveau toont dat naar buiten gaat. Achter het volume zit een limiter (drempel −3 dB, verhouding 12:1), zodat een heel hoog volume niet clipt.

### Poorten

| Poort | Soort | Gebruik |
|---|---|---|
| **In** | audio in | Sluit de Mixer, een Leveler, een Recorder of een synth aan. |

### Een voorbeeld

Verbind **Uit** van de Mixer met **In** op Speakers. Begin met **Volume** op 80% en zet het volume van je computer laag, en draai het dan op.

### Presets

Speakers heeft de presetbalk zoals elk apparaat, maar er hoort geen presetpack bij: er is maar één instelling, en die is een persoonlijke keuze.

### Tips en beperkingen

- Speakers heeft een ingang en geen uitgang. Het volume beweegt zacht mee als je het verandert of een preset laadt.
- Een volume boven 100% is niet mogelijk.

## Als het niet werkt

- **Ik hoor niets.** Druk op **Start**, of klik één keer ergens in Patchkamer: browsers houden audio tegen tot je dat doet. Controleer of er een groenblauwe kabel loopt van je geluidmakers naar een Mixerkanaal, van **Uit** van de Mixer naar **Speakers**, en of **Volume** op Speakers en op je computer hoog genoeg staat.
- **Eén kanaal is stil.** Kijk naar **M** en **S**: staat bij een kanaal **S** aan, dan zijn alle andere kanalen stil. Controleer ook de fader (−60 dB is uit) en of het kanaal naar **→ M** gaat of naar een groep die niet gedempt is.
- **GELIJK TREKKEN meldt dat er geen signaal is.** Druk op **Start** zodat de bronnen spelen, en meet opnieuw.
- **Ik hoor de galm of het effect niet.** Controleer of **SEND** boven 0% staat, of de uitgang van het effect naar de **RET**-poort van hetzelfde kanaal gaat en of **RETURN** niet op 0% staat.
- **Een bundelkanaal komt niet binnen.** Controleer of de groene kabel op **BUNDEL IN** zit en of je in de bronlijst van het kanaal een kanaal hebt gekozen.
- **Gekraak.** Open Instellingen → Audio en kies een grotere latency, of een lagere kwaliteit. Zie de [basishandleiding](../USER-MANUAL_NL.md#13-problemen-oplossen).
