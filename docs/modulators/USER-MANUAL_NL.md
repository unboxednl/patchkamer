# Modulators: gebruikershandleiding

*English version: [USER-MANUAL_EN.md](USER-MANUAL_EN.md)*

Een modulator is een apparaat dat de regelaars van een ander apparaat laat bewegen terwijl je speelt. Deze pagina legt uit hoe dat werkt en beschrijft de ene modulator die bij Patchkamer hoort: **Follower**. De basis (Patchkamer openen, een bibliotheek laden, kabels trekken) staat in de [basishandleiding](../USER-MANUAL_NL.md). De map met het apparaat is beschreven in [devices/modulators](../../devices/modulators/README_NL.md).

## Inhoud

1. [Hoe een modulator werkt](#hoe-een-modulator-werkt)
2. [Welke modulator voor welk doel](#welke-modulator-voor-welk-doel)
3. [Follower](#follower)
4. [Als het niet werkt](#als-het-niet-werkt)

## Hoe een modulator werkt

Een modulator maakt geen geluid. Hij maakt **sturing**: een waarde die in de tijd omhoog en omlaag gaat. Je gebruikt hem om een regelaar van een ander apparaat te laten bewegen, zoals de cutoff van een synth, zonder dat je zelf aan de regelaar draait.

Dat gaat in drie stappen:

1. **Trek een paarse kabel** van de modulatie-uitgang van de modulator naar de **Mod**-ingang van het apparaat dat je wilt laten bewegen. Paarse kabels voeren modulatie. Apparaten met regelaars die kunnen bewegen hebben een **Mod**-ingang.
2. **Kies wat beweegt.** De kaart van de modulator toont nu de regelaars van het andere apparaat, onder een kop met de naam ervan. Per regelaar kies je hoeveel hij beweegt (de **diepte**) en, als de modulator meer dan één signaal heeft, welk signaal hij volgt.
3. **Speel.** De knop op het andere apparaat blijft staan waar jij hem zette. De modulator beweegt het geluid rond die waarde. Haal je de kabel weg of zet je de diepte op 0, dan staat de regelaar weer op zijn knopwaarde.

De diepte is een deel van het bereik van de regelaar. Bij **+50%** kan de modulator een regelaar ongeveer de helft van zijn bereik omhoog bewegen. Bij **−50%** beweegt hij hem omlaag. Je kunt een modulator op meer dan één apparaat aansluiten, met voor elk eigen toewijzingen.

Een regelaar met het teken **⚡** is *snel*: de modulator stuurt hem met een audiosignaal, sample voor sample. Andere regelaars worden ongeveer 30 keer per seconde bijgewerkt, wat prima is voor langzame bewegingen.

Modulators hebben **presets** (ze maken geen geluid, dus geen tunes). Een preset bewaart de instellingen van de modulator zelf. De toewijzingen van de regelaars horen niet bij een preset. Zie [Presets](../presets/USER-MANUAL_NL.md) voor het gebruiken en delen ervan.

## Welke modulator voor welk doel

| Ik wil… | Gebruik |
|---|---|
| Het volume van het ene geluid een regelaar van een ander apparaat laten bewegen | [Follower](#follower) |
| De klappen van een geluid een drum of een noot op een ander apparaat laten spelen | [Follower](#follower) (poort **Aanslagen**) |
| Een regelaar bewegen met hoeveel hoge frequenties een geluid heeft | [Follower](#follower) (**Helderheid**) |

## Follower

### Waar het voor dient

Follower luistert naar een geluid en maakt er sturing van. Uit één audio-ingang maakt hij drie signalen:

- **Niveau**: hoe luid het geluid is.
- **Transiënt**: een korte piek bij elke klap (aanslag).
- **Helderheid**: hoeveel hoge frequenties er in het geluid zitten.

Voor elke regelaar die je op een ander apparaat laat bewegen, kies je welk van de drie signalen hij volgt en hoe diep. Bij elke aanslag stuurt Follower ook een trig of een noot uit zijn poort **Aanslagen**, zodat een drum of een synth kan meespelen met een ander geluid. Het geluid zelf gaat ongewijzigd door.

![De kaart van Follower](../images/nl/modulators/follower.png)

### De regelaars

Dubbelklik op een schuif om terug te gaan naar de beginwaarde. Klik op het getal om een waarde te typen. De kaart toont een klein beeld met de drie signalen (**Niveau**, **Transiënt** en **Helderheid**) zolang er geluid binnenkomt.

**Het niveausignaal**

| Regelaar | Wat hij doet | Bereik (begin) |
|---|---|---|
| **FOCUS** | Naar welk deel van het geluid hij luistert: **Alles**, **Laag (kick, bas)**, **Midden (snare, stem)**, **Hoog (hats)** of **Eigen frequentie** | Alles |
| **EIGEN FREQUENTIE** | De frequentie waar hij naar luistert als **FOCUS** op **Eigen frequentie** staat | 40 tot 16000 Hz (1000) |
| **VERSTERKING** | Versterkt het geluid vóór het gemeten wordt | −24 tot +36 dB (0) |
| **AANZET** | Hoe snel het niveausignaal omhoog gaat | 0,1 tot 200 ms (5) |
| **LOSLATEN** | Hoe snel het niveausignaal omlaag komt | 5 tot 3000 ms (150) |
| **VLOER** | Het niveau dat 0 geeft | −90 tot −10 dB (−50) |
| **BEREIK** | Het aantal dB tussen 0 en 1 | 6 tot 80 dB (40) |
| **UITSLAG** | **0 … +1 (alleen omhoog)** of **−1 … +1 (rond het midden)** | 0 … +1 |
| **RICHTING** | **Luider = meer** of **Luider = minder (omgekeerd)** | Luider = meer |

**De aanslagen**

| Regelaar | Wat hij doet | Bereik (begin) |
|---|---|---|
| **AANSLAG-GEVOELIGHEID** | Hoe makkelijk een aanslag wordt opgemerkt | 0 tot 100% (50%) |
| **TRANSIËNT-VERVAL** | Hoe lang het signaal **Transiënt** na een aanslag nodig heeft om te zakken | 10 tot 1000 ms (120) |
| **MINIMALE AFSTAND** | De kortste tijd tussen twee aanslagen | 10 tot 500 ms (60) |
| **POORT** | Onder dit niveau zijn er geen aanslagen en geen niveau | −90 tot −10 dB (−60) |
| **AANSLAGEN STUREN** | Wat een aanslag stuurt: **Trig spoor 1** tot **Trig spoor 8**, of **Noot** | Trig spoor 1 |
| **NOOT** | Het nootnummer dat verstuurd wordt als **AANSLAGEN STUREN** op **Noot** staat | 24 tot 96, getoond als nootnaam (C4) |

**De toewijzingen.** Onder de regelaars zie je wat de modulator beweegt. Zolang er geen kabel is aangesloten staat er dat er nog niets is aangesloten. Loopt er een paarse kabel naar een ander apparaat, dan toont de kaart een kop met de naam van dat apparaat, bijvoorbeeld **→ Acid Baselines**, en daaronder de regelaars van dat apparaat in groepen. Per regelaar zie je:

- een **bron**-lijst (**Niveau**, **Transiënt** of **Helderheid**),
- een **diepte**-schuif van −100% tot +100% (dubbelklik voor 0),
- een teken **⚡** als de regelaar snel is.

Een zoekveld (**zoek parameter**) en het vinkje **alleen actief** helpen je een regelaar te vinden. Een groep toont hoeveel regelaars actief zijn.

### Poorten

| Poort | Soort | Gebruik |
|---|---|---|
| **Luistert naar** | audio in (groenblauw) | Het geluid waar hij naar luistert, bijvoorbeeld een drumcomputer. |
| **Door** | audio uit (groenblauw) | Hetzelfde geluid, ongewijzigd. Sluit het aan op je mixer zodat je het blijft horen. |
| **Aanslagen** | events uit (oranje) | Een trig of een noot bij elke aanslag. Sluit aan op een drumcomputer of een synth. |
| **Follower** | modulatie uit (paars) | De stuursignalen. Sluit aan op de **Mod**-ingang van het apparaat dat je wilt laten bewegen. |

### Een voorbeeld: een bas die de drums volgt

1. Plaats een **Drum Machine**, **Follower**, **Acid Baselines**, een **Mixer** en **Speakers**.
2. Verbind **Uit** van de Drum Machine met **Luistert naar** op Follower, en **Door** van Follower met ingang **1** van de Mixer.
3. Verbind **Uit** van Acid Baselines met ingang **2** van de Mixer, en **Uit** van de Mixer met **In** op Speakers.
4. Trek een paarse kabel van **Follower** (op de Follower-kaart) naar **Mod** op Acid Baselines.
5. Kies op de Follower-kaart de preset **Level › Bass Follower**. Die luistert naar het lage deel van de drums.
6. Druk op **Start**. Open onder **→ Acid Baselines** de groep **Bas**, zoek de regelaar **Niveau**, laat de bron op **Niveau** staan en zet de diepte op **−50%**: hoe luider het lage deel van de drums, hoe zachter de bas, en tussen de klappen komt hij terug.
7. Probeer een andere regelaar: **Cutoff** op **+40%** opent het filter van de bas bij elke drumklap.

Een tweede voorbeeld: een synth speelt mee met een ander geluid. Kies de preset **Onsets › Note Follower**, verbind **Aanslagen** met **Noten** op Acid Baselines en zet **intern aan** uit op Acid Baselines. Elke aanslag die binnenkomt op **Luistert naar** speelt nu de noot die je bij **NOOT** hebt ingesteld op de synth. Staat **AANSLAGEN STUREN** op **Trig spoor 1** tot **Trig spoor 8**, dan stuurt Follower een trig voor dat spoor in plaats van een noot.

### Presets

Follower heeft het pack **Follower Basics**: 14 presets in drie mappen. **Level** (Smooth Envelope, Slow Swell, Bass Follower, Voice Follower, Hat Follower, Kick Ducker), **Onsets** (Kick Trigger, Snare Trigger, Hat Trigger, Note Follower) en **Extreme** (Centered Wobble, Gate Slammer, Hair Trigger, Tuned Band Follower). Het bestand is [`presets/follower.patchkamer-presets.json`](../../presets/follower.patchkamer-presets.json). Laad het vanuit een bibliotheek (zie de basishandleiding) of met het menu **Presets ▾** → **Importeren…**, en kies daarna een preset in de lijst op de kaart. **Kick Ducker** gebruikt **Luider = minder (omgekeerd)**. Een preset bevat geen toewijzingen: die kies je zelf.

### Tips en beperkingen

- De toewijzingen werken pas als het andere apparaat met een paarse kabel is aangesloten: de lijst met regelaars komt van dat apparaat.
- Ondersteunt je browser geen AudioWorklet, dan gaat het geluid wel door maar stuurt Follower niets. De kaart meldt dat.
- Zeer hoge waarden of niet-getallen van een ander apparaat worden aan de ingang begrensd, zodat één foute waarde niet in Follower blijft hangen.
- **RICHTING** en **UITSLAG** veranderen het signaal voordat de diepte wordt toegepast.

## Als het niet werkt

- **Er beweegt niets.** Controleer of er geluid binnenkomt op **Luistert naar** (het beeld toont de drie signalen), of de paarse kabel loopt van **Follower** naar **Mod** op het andere apparaat, en of er bij minstens één regelaar een diepte ongelijk aan 0 staat. Druk op **Start** zodat het geluid speelt.
- **De lijst met regelaars is leeg.** De kaart meldt "Nog niets aangesloten" tot er een paarse kabel is aangesloten. Controleer of de kabel eindigt op een **Mod**-ingang.
- **Ik hoor het geluid niet meer.** Follower laat geluid door via zijn poort **Door**: sluit die poort aan op de mixer of de speakers, niet **Luistert naar**.
- **De aanslagen worden niet opgemerkt.** Verhoog **AANSLAG-GEVOELIGHEID**, verlaag **POORT**, of kies een andere **FOCUS**. Verlaag **MINIMALE AFSTAND** voor snelle aanslagen.
- **Helemaal geen geluid of gekraak.** Zie de [basishandleiding](../USER-MANUAL_NL.md#13-problemen-oplossen).
