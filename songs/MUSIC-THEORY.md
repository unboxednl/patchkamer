# MUSIC-THEORY.md: muziektheorie voor Patchkamer

Dit bestand is voor AI-agents die songs voor Patchkamer componeren. Het is niet geschreven voor mensen. Het hoort bij [AGENTS.md](AGENTS.md) in deze map (het toegangspunt); lees die eerst. Hier staat de theorie die je nodig hebt, vertaald naar de waarden die Patchkamer gebruikt: MIDI-nootnummers, zestiende-stappen, velocity 0 tot 1 en maten. De stijlgidsen in [styles/](styles/README.md) bouwen hierop voort.

Je kunt niet luisteren. Alles hieronder is dus bedoeld om op papier te kloppen: intervallen, nootnummers, tellen. Of iets mooi klinkt, kun je niet toetsen; houd je aan de regels en aan de patronen uit de stijlgidsen.

## Inhoud

1. [Noten en nootnummers](#1-noten-en-nootnummers)
2. [Toonladders en modi](#2-toonladders-en-modi)
3. [Akkoorden, omkeringen en voicings](#3-akkoorden-omkeringen-en-voicings)
4. [Akkoordprogressies](#4-akkoordprogressies)
5. [Functionele harmonie en cadensen](#5-functionele-harmonie-en-cadensen)
6. [Melodie](#6-melodie)
7. [Ritme](#7-ritme)
8. [Dynamiek en articulatie](#8-dynamiek-en-articulatie)
9. [Songstructuur en maatlengtes](#9-songstructuur-en-maatlengtes)
10. [Arrangeren](#10-arrangeren)
11. [Mixen op hoofdlijnen](#11-mixen-op-hoofdlijnen)
12. [Omzetten naar Patchkamer](#12-omzetten-naar-patchkamer)
13. [Controlelijst](#13-controlelijst)

## 1. Noten en nootnummers

Patchkamer gebruikt MIDI-nootnummers (0 tot 127). **60 is C4** (de middelste C); dat staat zo in de sequencer-AGENTS.md's. Een octaaf is 12 halve tonen, dus C3 = 48, C2 = 36, C5 = 72.

| Noot | C | C#/Db | D | D#/Eb | E | F | F#/Gb | G | G#/Ab | A | A#/Bb | B |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Halve tonen boven C | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 |
| Octaaf 2 (basbereik) | 36 | 37 | 38 | 39 | 40 | 41 | 42 | 43 | 44 | 45 | 46 | 47 |
| Octaaf 3 | 48 | 49 | 50 | 51 | 52 | 53 | 54 | 55 | 56 | 57 | 58 | 59 |
| Octaaf 4 | 60 | 61 | 62 | 63 | 64 | 65 | 66 | 67 | 68 | 69 | 70 | 71 |
| Octaaf 5 | 72 | 73 | 74 | 75 | 76 | 77 | 78 | 79 | 80 | 81 | 82 | 83 |

Formule: nootnummer = 12 × (octaaf + 1) + halve tonen boven C. A4 = 12 × 5 + 9 = 69. A2 = 12 × 3 + 9 = 45. E1 = 12 × 2 + 4 = 28.

**Bereiken per rol** (richtlijn, geen wet):

| Rol | Nootbereik | Opmerking |
|---|---|---|
| Sub en bas | 28 tot 55 (E1 tot G3) | Onder 36 (C2) vooral grondtonen; geen akkoorden |
| Akkoorden en pads | 48 tot 79 (C3 tot G5) | Houd de laagste noot van een akkoord boven 48, anders wordt het modderig |
| Lead en melodie | 60 tot 91 (C4 tot G6) | Een melodie van hoogstens twee octaven klinkt zingbaar |
| Arpeggio en pluck | 60 tot 84 | Vaak twee tot drie octaven van de akkoordtonen |
| Drums (nootnummer van het geluid) | 36 tot 51 | Zie [sectie 12](#12-omzetten-naar-patchkamer) |

Intervallen in halve tonen: kleine secunde 1, grote secunde 2, kleine terts 3, grote terts 4, kwart 5, tritonus 6, kwint 7, kleine sext 8, grote sext 9, kleine septiem 10, grote septiem 11, octaaf 12.

## 2. Toonladders en modi

Een toonladder is een reeks afstanden in halve tonen die samen een octaaf vullen (12). De tabel gebruikt **C** als grondtoon (60 = C4), zodat je de nootnummers direct hebt. Voor een andere grondtoon schuif je alle nummers evenveel op (naar D: +2; naar A3 als grondtoon: 57 in plaats van 60, dus −3, of +9 vanaf C3 = 48; zie de A-mineur-regel hieronder).

| Toonladder | Afstanden (halve tonen) | Noten in C (MIDI vanaf 60) | Karakter |
|---|---|---|---|
| Majeur (ionisch) | 2-2-1-2-2-2-1 | C D E F G A B = 60 62 64 65 67 69 71 | open, vrolijk, stabiel |
| Natuurlijk mineur (aeolisch) | 2-1-2-2-1-2-2 | C D Eb F G Ab Bb = 60 62 63 65 67 68 70 | donker, serieus, de standaard voor veel dansmuziek |
| Dorisch | 2-1-2-2-2-1-2 | C D Eb F G A Bb = 60 62 63 65 67 69 70 | mineur met een lichte, grote sext; funk, jazz, house |
| Frygisch | 1-2-2-2-1-2-2 | C Db Eb F G Ab Bb = 60 61 63 65 67 68 70 | donker, dreigend door de kleine secunde |
| Lydisch | 2-2-2-1-2-2-1 | C D E F# G A B = 60 62 64 66 67 69 71 | zwevend, filmisch, hoopvol |
| Mixolydisch | 2-2-1-2-2-1-2 | C D E F G A Bb = 60 62 64 65 67 69 70 | majeur met een kleine septiem; funk, blues, rock |
| Locrisch | 1-2-2-1-2-2-2 | C Db Eb F Gb Ab Bb = 60 61 63 65 66 68 70 | onstabiel (verminderde kwint); weinig gebruikt als grondtoon |
| Harmonisch mineur | 2-1-2-2-1-3-1 | C D Eb F G Ab B = 60 62 63 65 67 68 71 | mineur met leidtoon (grote septiem); spanning, dramatiek |
| Melodisch mineur (omhoog) | 2-1-2-2-2-2-1 | C D Eb F G A B = 60 62 63 65 67 69 71 | jazz, glad omhoog |
| Mineur pentatonisch | 3-2-2-3-2 | C Eb F G Bb = 60 63 65 67 70 | vijf noten, geen wrijving; riffs, leads |
| Majeur pentatonisch | 2-2-3-2-3 | C D E G A = 60 62 64 67 69 | vijf noten, open en melodieus |
| Blues | 3-2-1-1-3-2 | C Eb F Gb G Bb = 60 63 65 66 67 70 | mineur pentatonisch plus de "blue note" (tritonus) |
| Heletoon | 2-2-2-2-2-2 | C D E F# G# A# = 60 62 64 66 68 70 | zwevend, zonder grondtoon-gevoel |
| Japans (zoals Wanderer het definieert) | 1-4-2-1-4 | C Db F G Ab = 60 61 65 67 68 | vijf noten met kleine secunde |

Controle: elke rij telt op tot 12. De namen `minor`, `major`, `dorian`, `phrygian`, `lydian`, `mixolydian`, `harmonic minor`, `minor pentatonic`, `major pentatonic`, `blues`, `whole tone` en `japanese` zijn de waarden van het veld `scale` in [Wanderer](../devices/sequencers/Wanderer/AGENTS.md).

**Relatieve toonsoorten.** C majeur en A mineur gebruiken dezelfde noten (geen kruisen of mollen). A mineur (natuurlijk) met A3 = 57 als grondtoon: A B C D E F G = 57 59 60 62 64 65 67. A mineur is dus C majeur met de grondtoon een kleine terts (3 halve tonen) lager.

**Toonladdertrede.** Trede 1 is de grondtoon, trede 5 de kwint. Romeinse cijfers (I tot VII) zijn de trede waarop een akkoord staat. In Wanderer is `deg` een toonladdertrede ten opzichte van `root` (0 = grondtoon), geen nootnummer.

**Kiezen.** Eén toonsoort per song is genoeg. Wil je contrast, gebruik dan een modulatie van een kleine terts of grote secunde omhoog voor het laatste refrein (+2 of +3 halve tonen), of wissel van majeur naar de parallelle mineur (zelfde grondtoon, andere ladder).

## 3. Akkoorden, omkeringen en voicings

Een akkoord bestaat uit gestapelde tertsen. Afstanden vanaf de grondtoon in halve tonen:

| Akkoord | Afstanden | Voorbeeld op C (60) | Op C3 (48) |
|---|---|---|---|
| Majeur | 0 4 7 | 60 64 67 | 48 52 55 |
| Mineur | 0 3 7 | 60 63 67 | 48 51 55 |
| Verminderd | 0 3 6 | 60 63 66 | 48 51 54 |
| Overmatig | 0 4 8 | 60 64 68 | 48 52 56 |
| Sus2 | 0 2 7 | 60 62 67 | 48 50 55 |
| Sus4 | 0 5 7 | 60 65 67 | 48 53 55 |
| Kwintakkoord (power chord) | 0 7 | 60 67 | 48 55 |
| Majeur 7 | 0 4 7 11 | 60 64 67 71 | 48 52 55 59 |
| Dominant 7 | 0 4 7 10 | 60 64 67 70 | 48 52 55 58 |
| Mineur 7 | 0 3 7 10 | 60 63 67 70 | 48 51 55 58 |
| Halfverminderd 7 | 0 3 6 10 | 60 63 66 70 | 48 51 54 58 |
| Mineur 9 | 0 3 7 10 14 | 60 63 67 70 74 | 48 51 55 58 62 |
| Majeur 9 | 0 4 7 11 14 | 60 64 67 71 74 | 48 52 55 59 62 |
| Add9 | 0 4 7 14 | 60 64 67 74 | 48 52 55 62 |

**Akkoorden in de toonsoort** (diatonisch). In C majeur vanaf C3 = 48 (alle noten uit de ladder C D E F G A B):

| Trede | Akkoord | Noten | MIDI |
|---|---|---|---|
| I | C (maj) | C E G | 48 52 55 |
| ii | Dm | D F A | 50 53 57 |
| iii | Em | E G B | 52 55 59 |
| IV | F | F A C | 53 57 60 |
| V | G | G B D | 55 59 62 |
| vi | Am | A C E | 57 60 64 |
| vii° | Bdim | B D F | 59 62 65 |

Met vier noten: Cmaj7 = 48 52 55 59, Dm7 = 50 53 57 60, Em7 = 52 55 59 62, Fmaj7 = 53 57 60 64, G7 = 55 59 62 65, Am7 = 57 60 64 67.

**A mineur** (natuurlijk, noten A B C D E F G; grondposities rond A3 = 57):

| Trede | Akkoord | Noten | MIDI |
|---|---|---|---|
| i | Am | A C E | 57 60 64 |
| ii° | Bdim | B D F | 59 62 65 |
| III | C | C E G | 60 64 67 |
| iv | Dm | D F A | 62 65 69 |
| v | Em | E G B | 64 67 71 |
| VI | F | F A C | 65 69 72 |
| VII | G | G B D | 67 71 74 |

In een mineur-song is de dominant vaak majeur gemaakt (E = E G# B = 64 68 71, ook E7 = 64 68 71 74) uit het harmonische mineur. Daarmee krijg je een sterke cadens (sectie 5). Let op: dat G# (68) staat niet in de natuurlijke ladder.

**Omkeringen.** Verplaats de laagste noot een octaaf (12) omhoog.

| Omkering | C majeur | Naam |
|---|---|---|
| Grondligging | 60 64 67 | Grondtoon onderaan |
| 1e omkering | 64 67 72 | Terts onderaan |
| 2e omkering | 67 72 76 | Kwint onderaan |

Dit is precies wat het veld `inversion` van [Chord Sequencer](../devices/sequencers/ChordSequencer/AGENTS.md) doet: zoveel keer gaat de laagste noot een octaaf omhoog (0 tot 3).

**Voicing** is hoe je de noten verdeelt over het bereik.
- **Close voicing**: alle noten binnen een octaaf (60 64 67). Compact, voor stabs en pianoachtig werk.
- **Open voicing**: grondtoon een octaaf lager of kwint weggelaten en hoger gezet (48 55 64 = C, G, E). Voller, voor pads.
- **Voice leading**: kies bij elke akkoordwissel de omkering die de noten het minst laat verspringen. Van C (60 64 67) naar F: neem 60 65 69 (F in 2e omkering) in plaats van 65 69 72; de C blijft liggen en de andere twee gaan een stap omhoog. Dat klinkt vloeiender dan elk akkoord in grondligging.
- Houd de laagste noot van een akkoord op 48 of hoger als er ook een bas speelt; speel de bas alleen de grondtoon of kwint.
- Meer dan 4 noten tegelijk op één synth tegelijk is zelden nodig; de akkoordsynths zijn polyfoon (zie de README van de [synths](../devices/synths/README.md)).

## 4. Akkoordprogressies

Romeinse cijfers zijn toonsoortonafhankelijk. Hieronder per progressie concrete akkoorden in **C majeur** en in **A mineur**, met MIDI-noten (octaaf 3, grondposities; bij mineur de akkoorden rond A3). Elk akkoord duurt standaard één maat of twee maten.

### Majeur

| Progressie | Cijfers | In C majeur | MIDI per akkoord | Gebruik |
|---|---|---|---|---|
| Pop-vier | I V vi IV | C G Am F | 48 52 55 / 55 59 62 / 57 60 64 / 53 57 60 | pop, refreinen, trance |
| Doo-wop | I vi IV V | C Am F G | 48 52 55 / 57 60 64 / 53 57 60 / 55 59 62 | ballad, retro |
| Klassiek | I IV V I | C F G C | 48 52 55 / 53 57 60 / 55 59 62 / 48 52 55 | eenvoud, funk, rock |
| Jazz ii-V-I | ii7 V7 Imaj7 | Dm7 G7 Cmaj7 | 50 53 57 60 / 55 59 62 65 / 48 52 55 59 | jazz, soul |
| Mixolydisch | I bVII IV I | C Bb F C | 48 52 55 / 46 50 53 / 53 57 60 / 48 52 55 | funk, rock |
| Gospel-pendel | I IV | C F | 48 52 55 / 53 57 60 | house, disco (twee akkoorden) |
| Twaalfmaats blues | I I I I IV IV I I V IV I V | C7 F7 G7 | 48 52 55 58 / 53 57 60 63 / 55 59 62 65 | blues (zie [jazz-blues](styles/jazz-blues.md)) |

### Mineur

| Progressie | Cijfers | In A mineur | MIDI per akkoord | Gebruik |
|---|---|---|---|---|
| Epische mineur | i VI III VII | Am F C G | 57 60 64 / 53 57 60 / 48 52 55 / 55 59 62 | film, trance, synthwave |
| Droevig | i VII VI VII | Am G F G | 57 60 64 / 55 59 62 / 53 57 60 / 55 59 62 | techno-melodie, synthwave |
| Andalusisch | i VII VI V | Am G F E | 57 60 64 / 55 59 62 / 53 57 60 / 52 56 59 | drama, latin |
| Klassiek mineur | i iv V i | Am Dm E Am | 57 60 64 / 50 53 57 / 52 56 59 / 57 60 64 | ballad, klassiek (E met G#) |
| Pendel | i VII | Am G | 57 60 64 / 55 59 62 | techno, dub |
| Minor-vier | i iv v iv | Am Dm Em Dm | 57 60 64 / 50 53 57 / 52 55 59 / 50 53 57 | donkere dansmuziek |
| Jazz mineur | iiø7 V7 i7 | Bm7b5 E7 Am7 | 47 50 53 57 / 52 56 59 62 / 57 60 64 67 | jazz |

In deze tabel liggen de akkoorden in octaaf 3 en lager (Am = 57 60 64 enz.), wat bij mineur voor bijna elke synth goed te gebruiken is; voor een lage bas gebruik je de grondtoon twee octaven lager (A1 = 33, A2 = 45).

### Progressies met Chord Sequencer

[Chord Sequencer](../devices/sequencers/ChordSequencer/AGENTS.md) verschuift de grondtoon per maat met `progression` (vier getallen in halve tonen); de **akkoordsoort is per spoor vast**. Daarom moet je soort en progressie samen kiezen:

- `minor` met `progression: [0,-4,-9,-2]` (i, bVI, bIII, bVII vanaf Am) geeft Am, Fm, Em, Gm: alleen de eerste is hier juist. Gebruik voor de epische mineurcyclus (Am F C G) dus `fifth` of `sus` (blanco terts) zodat elk akkoord in de ladder past, óf schrijf de akkoorden met `mode: "notes"` uit.
- `minor` met `[0,5,7,5]` geeft i iv v iv: past precies in natuurlijk mineur.
- `major` met `[0,5,7,5]` geeft I IV V IV.
- Een nootnummer in `progression` is een afstand: bVII vanaf de grondtoon is −2 (of +10), IV is +5, V is +7, VI (mineur) is −4 of +8.

Voor akkoorden met wisselende soorten per maat (Am F C G) is de veiligste weg: een [Pattern Tracker](../devices/sequencers/PatternTracker/AGENTS.md), [Pattern Playlist](../devices/sequencers/PatternPlaylist/AGENTS.md) of [Clip Arranger](../devices/sequencers/ClipArranger/AGENTS.md)-spoor waarin je de akkoorden als `notes: [57,60,64]` uitschrijft, of een Step Sequencer per akkoordnoot.

## 5. Functionele harmonie en cadensen

Akkoorden hebben een functie in de toonsoort:

| Functie | Trede(n) | Rol |
|---|---|---|
| Tonica (rust) | I, vi (majeur); i, III (mineur) | thuis; hier begin en eindig je |
| Subdominant (weggaan) | IV, ii (majeur); iv, VI (mineur) | beweging, voorbereiding |
| Dominant (spanning) | V, vii° (majeur); V of v, VII (mineur) | wil terug naar tonica |

**Spanning en ontspanning.** Een song leeft van het wisselen: tonica (rust) → subdominant (weg) → dominant (spanning) → tonica (ontspanning). Dissonanten (kleine secunde, tritonus, septiemen) vragen om oplossing naar een consonant akkoord, meestal een stap lager of hoger.

**Cadensen** (afsluitingen):

| Cadens | Cijfers | In C majeur | Effect |
|---|---|---|---|
| Authentiek (vol) | V → I | G → C (55 59 62 → 48 52 55) | definitief, einde van een zin |
| Plagaal | IV → I | F → C (53 57 60 → 48 52 55) | zacht, kerkelijk; eindigt rustig |
| Halve cadens | ... → V | F → G | open einde, vraagt een vervolg (einde van een voorzin) |
| Bedrogen | V → vi | G → Am | verrassing; stelt het einde uit |
| Phrygische halve | iv6 → V (mineur) | Dm → E | dramatisch in mineur |

**Leidtoon.** De zevende trede een halve toon onder de grondtoon (B = 59 of 71 naar C) trekt naar de tonica. Dat is de reden dat de dominant in mineur vaak majeur is (E met G#).

**Spanning opbouwen zonder akkoordwissel.** Voeg een septiem of sus-akkoord toe, laat de bas doorgaan op de grondtoon (pedaalnoot, "drone"), stijg in velocity of verhoog de filterfrequentie. Dit is wat veel dansmuziek doet: de harmonie blijft liggen en de spanning zit in klank en ritme.

**Terugkerende cyclus.** Pop en dance gebruiken meestal 4 akkoorden die 1 of 2 maten per stuk duren, dus een cyclus van 4 of 8 maten. Dat past op de bouwstenen van sectie 9 (8, 16 of 32 maten).

## 6. Melodie

- **Motief.** Een korte kern van 2 tot 8 noten (1 tot 2 tellen tot een maat) met een herkenbaar ritme. Het ritme herken je meer dan de toonhoogtes.
- **Herhaling.** Herhaal het motief minstens twee keer. Herhaling maakt dat luisteraars het kennen; zonder herhaling klinkt het als willekeur.
- **Variatie.** Verander bij herhaling één ding: de laatste noot, het octaaf, de lengte, een toonhoogte een trede omhoog (sequens), of het ritme met een extra noot. Verander nooit alles tegelijk.
- **Call and response.** Een vraag (hoog of open eindigend, vaak op de kwint of terts) wordt gevolgd door een antwoord (rustig eindigend op de grondtoon). Samen vier maten: twee vraag, twee antwoord.
- **Spanningsboog.** Begin lager, stijg naar een hoogtepunt rond 2/3 van de zin, daal naar een rustpunt. Het hoogste punt komt één keer per frase.
- **Akkoordtonen op zware tellen.** Zet de grondtoon, terts of kwint van het huidige akkoord op de tellen 1 en 3 (stap 0 en 8 van een maat); toonladdertonen en doorgangsnoten op de tussentellen. Dat voorkomt wrijving met de harmonie. Wanderer doet dat via `chord`.
- **Sprongen en stappen.** Stappen (1 of 2 halve tonen) zijn zingbaar; een sprong (kwart of groter) is een accent en wordt het best gevolgd door een stap terug in de andere richting.
- **Rust.** Laat ruimte: een lead die 60 procent van de stappen speelt klinkt rustiger en professioneler dan 100 procent. Dichtheid per stijl staat in de stijlgidsen.
- **Zinslengte.** Frasen duren 2 of 4 maten; met een korte rust aan het eind krijgt de luisteraar adem.
- **Octaaf.** Een melodie die een octaaf stijgt bij het refrein klinkt als een lift.

Voorbeeld, een motief van acht stappen in A mineur pentatonisch (A3 = 57; noten 57 60 62 64 67), op een 1/16-raster, vel 0,7 tot 1:

```
stap:   0   1   2   3   4   5   6   7   8 ... 15
noot:  64   -  64  67   -  64  62   -  60  ...
vel:   0,9  .  0,6 0,8  .  0,6 0,7  .  0,8
```

Herhaal het, en laat in de tweede helft de laatste noot van 62 naar 57 (A3) dalen: dat is een variatie met een afsluiting.

## 7. Ritme

**Maat en tel.** 4/4 is de standaard: 4 tellen per maat, een tel = een kwartnoot, 16 zestiende noten per maat. Patchkamer rekent in zestienden: **stap 0 tot 15 per maat**.

| Stap | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Telling | 1 | e | en | a | 2 | e | en | a | 3 | e | en | a | 4 | e | en | a |
| Gewicht | sterk | zwak | middel | zwak | middel | zwak | middel | zwak | sterk | zwak | middel | zwak | middel | zwak | middel | zwak |

- **Downbeat** = stap 0, 4, 8, 12 (de tellen). **Offbeat** = stap 2, 6, 10, 14 (de "en", de achtsten tussen de tellen).
- **Backbeat** = tel 2 en 4 = stap 4 en 12 (snare, clap).
- Andere maatsoorten: 3/4 = 12 zestienden per maat, 6/8 = 12 zestienden (twee groepen van drie achtsten), 5/4 = 20, 7/8 = 14. Patchkamer-klok blijft in 16 zestienden per maat tellen; voor een andere maat zet je patroonlengtes op 12, 14 of 20 stappen (zie sectie 12).

**Subdivisies.** 1/4 (tel), 1/8 (twee per tel), 1/16 (vier per tel), 1/32 (acht per tel), 1/64 (zestien per tel). Triolen: 1/8-triool (drie per tel) en 1/16-triool (zes per tel). Het veld `div` van Wanderer en Euclidean Rhythms en `rate` van Scale Arpeggiator kennen die rasters.

**Swing.** De tweede zestiende van elk paar (stap 1, 3, 5, ...) komt later. Patchkamer: `swing` van de host (0 tot 0,5) schuift elke oneven zestiende, als deel van een zestiende, naar achteren. Dus 0 is recht, ongeveer 0,33 is een triool-swing (de oneven stap valt op 2/3 van het paar), 0,5 is een harde shuffle (3:1). Standaardwaarde van de host is 0,08.

| Swing | Gevoel |
|---|---|
| 0 | recht (techno, trance, chiptune) |
| 0,08 | nauwelijks hoorbaar (host-standaard) |
| 0,15 tot 0,25 | menselijk, hiphop, house, funk |
| 0,3 tot 0,35 | triool-swing, jazz, shuffle |
| 0,5 | harde shuffle |

**Syncope.** Een nadruk op een zwakke plek, of een noot op een offbeat die aanhoudt over de volgende tel. Voorbeeld `x..x..x.` (3 + 3 + 2 over acht zestienden, tresillo): slagen op stap 0, 3, 6.

**Polyritme en polymetrie.** Twee patronen met verschillende lengtes die tegelijk lopen. Een patroon van 12 stappen tegen een van 16 begint pas na 48 stappen (3 maten) weer samen. Een lengte van 5 of 7 stappen tegen 16 geeft een evoluerend patroon (de cyclus is 80 resp. 112 stappen). Gebruik het spaarzaam, op één laag.

**Euclidische ritmes.** Verdeel `p` slagen zo gelijk mogelijk over `s` stappen; volgens de formule in [Euclidean Rhythms](../devices/sequencers/EuclideanRhythms/AGENTS.md) klinkt slag `i` als `(i × p) mod s < p`:

| Slagen / stappen | Patroon (x = slag) | Voorkomen |
|---|---|---|
| 4 / 16 | `x...x...x...x...` | vier op de vloer |
| 3 / 8 | `x..x..x.` | tresillo |
| 5 / 8 | `x.x.xx.x` | cinquillo-achtig |
| 5 / 16 | `x...x..x..x..x..` | gebroken kickpatroon |
| 7 / 16 | `x..x.x.x..x.x.x.` | drukke hat |
| 9 / 16 | `x.x.x.x.xx.x.x.x` | rollende hat |
| 2 / 16 met `rot` 4 | `....x.......x...` | backbeat (stap 4 en 12) |

**Leesregel voor drumrasters in de stijlgidsen.** Een patroon van 16 tekens is één maat in 1/16:

| Teken | Betekenis | Velocity |
|---|---|---|
| `X` | sterk (accent) | 0,95 tot 1 |
| `x` | normaal | 0,7 tot 0,85 |
| `o` | zwak | 0,45 tot 0,6 |
| `g` | ghost note | 0,25 tot 0,4 |
| `.` | rust | geen noot |

## 8. Dynamiek en articulatie

**Velocity.** In Patchkamer is velocity een getal van 0 tot 1 (niet 0 tot 127). Gebruik nooit 0 voor een noot die moet klinken, en niets boven 1. Richtlijn, zoals ook de sequencer-AGENTS.md's het aanhouden:

| Aanduiding | Velocity | Gebruik |
|---|---|---|
| Accent | 0,95 tot 1 | tel 1, accenten, kickslag |
| Normaal | 0,7 tot 0,85 | hoofdnoten |
| Zacht | 0,5 tot 0,6 | tussennoten, pads onder een lead |
| Ghost note | 0,25 tot 0,45 | stille tussennoten in een snare- of basfiguur |
| Fluisterzacht | 0,05 tot 0,2 | alleen voor effecten of ambient |

**Natuurlijk ritme.** Tel 1: 1,0; tel 3: 0,85; tellen 2 en 4: 0,75; de "en": 0,7; de "e"/"a": 0,5 tot 0,6. Variatie van 0,05 tot 0,15 tussen herhalingen klinkt levender dan alles hetzelfde.

**Crescendo / decrescendo.** Stijgende (of dalende) velocities over 8 tot 16 stappen, bijvoorbeeld 0,3 → 1,0. Een snareroll op 1/32 met velocities `0,25 0,3 0,34 ... 1` is een klassieke opbouw. Veel apparaten hebben er eigen velden voor: `contour` (Wanderer), `curve` (Euclidean Rhythms), `vpat` (Scale Arpeggiator).

**Articulatie, toonlengte.**

| Woord | Lengte | Gate (deel van de rasterstap) |
|---|---|---|
| Staccato | kort | 0,2 tot 0,4 |
| Normaal | gemiddeld | 0,5 tot 0,7 |
| Legato | tot de volgende noot | 0,9 tot 1 |
| Overlappend | lopen in elkaar | 1,05 tot 1,5 (alleen op een polyfone synth of met glide) |
| Lang (pad, drone) | 1 maat of meer | 4 tot 16 stappen |

**Hoe je dat uitdrukt per sequencer.** Raadpleeg de AGENTS.md van het apparaat voor de exacte velden en bereiken; dit zijn de velden die er voor dynamiek en lengte toe doen:

| Sequencer | Velocity | Lengte | Extra |
|---|---|---|---|
| [Step Sequencer](../devices/sequencers/StepSequencer/AGENTS.md) | `vel` per stap (0 = automatisch: 0,7, of 1 bij `acc`); `humV` | `ln` in rasterstappen (0 = de globale `gate`); `gate` 0,1 tot 1 | `mt` micro-timing, `swing`, `humT` |
| [Chord Sequencer](../devices/sequencers/ChordSequencer/AGENTS.md) | `t0velocity`...`t3velocity`; `vel` per stap (16 getallen, vermenigvuldigd) | `t0gate`...; `len` per stap (16 getallen, vermenigvuldigd) | `probability`, `ratchet`, `division` |
| [Wanderer](../devices/sequencers/Wanderer/AGENTS.md) | `vel`, `accent`, `ghost`, `contour`, `human`; per motiefstap `vel` | `gate`, `gvar`; per stap `gate` | `rat` (roll), `ratchet` |
| [Scale Arpeggiator](../devices/sequencers/ScaleArpeggiator/AGENTS.md) | `velocity`, `vpat` + `plen`, `accent`, `ghost`, `human` | `gate`, `gpat` | `repeat`, `chance` |
| [Euclidean Rhythms](../devices/sequencers/EuclideanRhythms/AGENTS.md) | `vel`, `acc`, `accVel`, `softVel`, `ghost`, `ghostVel`, `curve`, `human` | `gate` | `prob`, `fill`, `mut` |
| [Pattern Tracker](../devices/sequencers/PatternTracker/AGENTS.md) en [Pattern Playlist](../devices/sequencers/PatternPlaylist/AGENTS.md) | `vel` per cel, `velocity` per spoor | `len` in rijen, `gate` per spoor, effect `CUT` | effecten `ARP`, `RAT`, `DEL`, `PRB`, `CC` |
| [Clip Arranger](../devices/sequencers/ClipArranger/AGENTS.md) | `vel` per noot, `velocity` per spoor | `len` in zestienden (vermenigvuldigbaar met 0,25), `gate` per spoor | `prob`, `ratchet`, CC-lanes |

## 9. Songstructuur en maatlengtes

Een maat duurt `240 / BPM` seconden (4/4). 128 BPM geeft 1,875 s per maat; 120 BPM geeft 2 s; 90 BPM geeft 2,67 s. Een blok van 8 maten duurt dus 15 s bij 128 BPM, 16 s bij 120 BPM.

**Bouwstenen** (maten; 8 en 16 zijn de standaard):

| Onderdeel | Doel | Typische lengte (maten) |
|---|---|---|
| Intro | begin, tempo en sfeer neerzetten; vaak alleen drums of pad | 4, 8 of 16 |
| Couplet | verhaal, rustiger, minder lagen | 8 of 16 |
| Pre-chorus / opbouw | spanning laten stijgen | 4 of 8 |
| Refrein | hoogtepunt, hook, alle lagen | 8 of 16 |
| Brug (bridge) | contrast: andere akkoorden of andere klank | 4 of 8 |
| Break / breakdown | drums en bas weg, alleen akkoorden of pad | 8 of 16 |
| Opbouw (build-up) | stijgende spanning: roll, filter open, ruis, velocity omhoog | 4, 8 of 16 |
| Drop | de ontlading na een opbouw: alles terug, bas en kick | 8 of 16 |
| Outro | afbouwen of laten uitlopen | 4, 8 of 16 |

**Vuistregel**: verander elke 8 maten iets. Na 16 of 32 maten zonder verandering raakt een luisteraar het spoor bijster.

**Voorbeeld structuren** (maten):

- Popsong (4/4, 3 minuten bij 100 BPM ≈ 72 maten): intro 4, couplet 16, refrein 16, couplet 16, refrein 16, brug 8, refrein 16, outro 4 = 96 maten, ruim 3,8 minuten; kort het in tot 72 maten door een couplet en de brug te schrappen.
- Danceplaat (4 minuten bij 126 BPM ≈ 126 maten): intro 16, opbouw 8, drop 16, break 16, opbouw 8, drop 16, outro 16 = 96 maten ≈ 3 min.
- Ambient (6 minuten bij 70 BPM ≈ 105 maten): geen secties, langzaam laag op laag, 16 maten per laag.

**Tijd in maten.** `maten × 240 / BPM` seconden. Een song van 2 tot 4 minuten is bij 120 BPM 60 tot 120 maten.

**Patroon en cyclus.** Laat de basisloop 1, 2 of 4 maten duren (de akkoordcyclus), de melodie 4 of 8, en de song wisselt secties door lagen aan en uit te zetten (sectie 10).

## 10. Arrangeren

**Lagen.** Elke rol heeft een eigen register en taak. Meer lagen tegelijk is niet beter; elke laag moet een eigen plek hebben.

| Rol | Taak | Frequentieruimte | Typisch nootbereik |
|---|---|---|---|
| Kick | puls | sub tot 100 Hz, klik rond 2 tot 4 kHz | nootnummer 36 |
| Bas | fundament | 40 tot 200 Hz | 28 tot 52 |
| Snare / clap | backbeat | 200 Hz tot 5 kHz | nootnummer 38, 39 |
| Hi-hats / percussie | puls, energie | 5 tot 15 kHz | nootnummer 42, 46, 70 |
| Akkoorden | harmonie | 200 Hz tot 3 kHz | 48 tot 72 |
| Pad | vulling, ruimte | 200 Hz tot 6 kHz | 48 tot 79 |
| Lead / melodie | hoofdstem | 500 Hz tot 6 kHz | 60 tot 91 |
| Arpeggio / pluck | beweging | 500 Hz tot 8 kHz | 60 tot 84 |
| FX (risers, impacts, ruis) | overgangen | breed | geen toonhoogte |

(De frequentiebereiken zijn richtlijnen uit de gangbare mixpraktijk; je kunt ze niet horen, dus houd rollen in aparte nootbereiken en panorama's.)

**Regels.**
- Eén ding tegelijk op de voorgrond: lead of hook, niet allebei.
- Geef de bas en de kick elk een eigen ritme: de kick op de tellen, de bas ertussen of op dezelfde plek maar met ander gewicht.
- Zet niet twee synths in hetzelfde nootbereik met hetzelfde ritme; verdeel ze (een laag, een hoog) of laat ze afwisselen.
- **Contrast.** Wissel dichtheid: een couplet met 3 lagen, een refrein met 6. Wissel register: een lage couplet-bas, een hoge refrein-lead.
- **Ademruimte.** Laat voor elke grote sectie (drop, refrein) een maat of twee stilte, een break, of dunnere lagen. Een filter dat sluit en opent doet hetzelfde. Zet FX (riser, impact) 1 tot 2 maten vóór de drop.
- **Ontwikkeling in lagen.** Begin met drums en bas, voeg per 4 of 8 maten een laag toe (hats, akkoorden, pad, lead). Haal ze in de break weer weg.
- **Repetitie en variatie.** Variëer elke vier maten iets kleins (een fill in de laatste maat, een extra noot, een andere velocity) en elke acht maten iets groters.
- **Overgangen.** Een fill (snareroll, tomfill), een riser (stijgend filter of pitch), of een korte stilte van een tel vóór de eerste tel van de nieuwe sectie.

## 11. Mixen op hoofdlijnen

Je hoort het niet, dus werk met verhoudingen. Patchkamer heeft een [Mixer](../devices/mixer/README.md) met kanalen voor niveau, pan, EQ en sends; zie de [handleiding](../docs/mixer/USER-MANUAL_NL.md).

| Rol | Relatief niveau | Pan | Ruimte (hall/delay) |
|---|---|---|---|
| Kick | hoog (referentie) | midden | geen of heel weinig |
| Bas | hoog, iets onder de kick | midden | geen |
| Snare / clap | hoog | midden of licht | kort tot middel |
| Hats / percussie | laag tot midden | licht links/rechts | weinig |
| Akkoorden | midden | breed (stereo synth) of licht | middel |
| Pad | laag | breed | veel (diep) |
| Lead | midden tot hoog | midden of licht | middel, delay |
| Arp / pluck | laag tot midden | breed | delay |
| FX | laag | breed | veel |

- **Midden**: kick, bas, snare, lead. **Breed**: pads, akkoorden, achtergrond. Houd alles onder 200 Hz in het midden (mono) zodat de bas stevig blijft.
- Laat de master niet clippen: richt op maximaal ongeveer -6 dB piek vóór een limiter en laat daarna [Master Chain](../devices/mastering/MasterChain/AGENTS.md) of [Master Director](../devices/mastering/MasterDirector/AGENTS.md) de laatste stap doen. Zie de [mastering-handleiding](../docs/mastering/USER-MANUAL_NL.md).
- **Sidechain-pompen.** [Pump](../devices/effects/Pump/AGENTS.md) laat een bron meeduiken met de kick; vaak op bas, pad of akkoorden in house, trance en techno.
- **Ruimte.** [Room](../devices/effects/Room/AGENTS.md) is delay en reverb in één. Houd de hall kort bij snelle muziek (strak) en lang bij trage muziek (ambient).
- Niveaus zijn relatief: stel eerst kick en bas in, voeg daarna elke laag toe, en zet iets zachter als het vol wordt.

## 12. Omzetten naar Patchkamer

**Klok en tempo.** De klok van de studio telt zestiende noten: stap 0 tot 15 per maat (4/4). Tempo (`bpm`) loopt van 40 tot 200 (standaard 126). Een zestiende duurt `60 / bpm / 4` seconden (bij 120 BPM 0,125 s). Swing (`swing`, 0 tot 0,5, standaard 0,08) vertraagt elke tweede zestiende. Beide staan als `bpm` en `swing` in de werkruimte van een song.

**Kies de sequencer.** Alle sequencers sturen noten naar andere apparaten; ze maken zelf geen geluid. Overzicht in het [sequencer-overzicht](../devices/sequencers/README.md) en in de [handleiding](../docs/sequencers/USER-MANUAL_NL.md) ("Welk apparaat voor welk doel").

| Je wilt | Gebruik | Waarom |
|---|---|---|
| Een basfiguur, melodie of drumtrigger in vaste stappen | [Step Sequencer](../devices/sequencers/StepSequencer/AGENTS.md) | één stem per sequencer, noot/velocity/lengte/timing per stap, tot 64 stappen |
| Akkoorden en bas in een progressie, scènes | [Chord Sequencer](../devices/sequencers/ChordSequencer/AGENTS.md) | vier sporen, vier scènes, grondtoonverschuiving per maat |
| Generatieve melodie in een toonladder | [Wanderer](../devices/sequencers/Wanderer/AGENTS.md) | motief dat zelf varieert, volgt een akkoord |
| Het akkoord van een toetsenbord of sequencer arpeggieren | [Scale Arpeggiator](../devices/sequencers/ScaleArpeggiator/AGENTS.md) | negen patronen, velocity- en lengtepatronen |
| Drumritme met euclidische verdeling, polyritme | [Euclidean Rhythms](../devices/sequencers/EuclideanRhythms/AGENTS.md) | acht rijen, accent, ghost, fills |
| Een complete song met verschillende lagen op een tijdlijn | [Pattern Playlist](../devices/sequencers/PatternPlaylist/AGENTS.md) | patronen en blokken, tot 32 sporen |
| Noten in rijen (tracker), effectkolom, volgorde van patronen | [Pattern Tracker](../devices/sequencers/PatternTracker/AGENTS.md) | `ARP`, `RAT`, `DEL`, `PRB`, `CUT`, `CC`; `order` |
| Clips, scènes en een arrangement | [Clip Arranger](../devices/sequencers/ClipArranger/AGENTS.md) | clips (patronen van 1 tot 64 maten), 1 tot 24 scènes (standaard 8), songs met een `arrangement` van secties |

Veel klankbronnen (drums en enkele synths) hebben een **eigen stappenpatroon** en spelen mee met de klok; dan heb je geen sequencer nodig voor die laag. Controleer in de AGENTS.md van het apparaat of dat zo is.

**Raster per maat.** Eén maat = 16 stappen op een 1/16-raster (Step Sequencer `res: 16, len: 16`). Twee maten = `len: 32`, vier maten = `len: 64`. Op 1/32 is een maat 32 stappen, op 1/64 64 stappen (zie de tabel in de Step Sequencer-AGENTS.md: wil je dezelfde muziek op een fijner raster, schrijf de stappen dan opnieuw). In [Pattern Tracker](../devices/sequencers/PatternTracker/AGENTS.md) is `rowsPerBeat` 4 (1/16) de standaard: een maat is 16 rijen. In [Clip Arranger](../devices/sequencers/ClipArranger/AGENTS.md) is `step` een positie in zestienden binnen de clip en `bars` het aantal maten (1 tot 64).

**Noot-in-grid-notatie.** Schrijf een maat zo, per stap het nootnummer (rust met `.`), met de velocity eronder:

```
stap:  0   1   2   3   4   5   6   7   8   9  10  11  12  13  14  15
noot: 45   .  45  48   .  45  52   .  45   .  43  45   .  48   .  52
vel:  1,0  . 0,6 0,7   . 0,9 0,7   . 0,8   . 0,6 0,7   . 0,6   . 0,7
lengte(stappen): 1  .  1   1   .  1   1   .  1   .  1   1   .  1   .  1
```

Vertaal dit naar de velden van het gekozen apparaat. Voor [Step Sequencer](../devices/sequencers/StepSequencer/AGENTS.md) zijn dat `n` (64 getallen, `-1` voor rust), `vel`, `ln` en `len`, met altijd 64 plaatsen per lijst:

```json
{ "len": 16, "res": 16, "gate": 0.5,
  "n":   [45,-1,45,48,-1,45,52,-1,45,-1,43,45,-1,48,-1,52, ... (tot 64, rest -1)],
  "vel": [1,0,0.6,0.7,0,0.9,0.7,0,0.8,0,0.6,0.7,0,0.6,0,0.7, ... (rest 0)] }
```

Een patroon van 12 stappen levert 3/4 (of 6/8) en een patroon van 7 of 5 stappen een evoluerend polyritme; zie de Step Sequencer-AGENTS.md voor `len` en `res`.

**Verbinden.** Een song is een werkruimte met apparaten en kabels. Notenkabels (soort `event`) gaan van de uitgang van een sequencer naar de notenpoort van een synth of drumcomputer; audiokabels (soort `audio`) van een synth naar een effect, de [Mixer](../devices/mixer/README.md) en tot slot [Speakers](../devices/mixer/README.md); modulatiekabels (soort `mod`) van een modulator naar een regelbare parameter. Het exacte songbestand en de werkwijze staan in [AGENTS.md](AGENTS.md); de controle doe je met het script [check-song.py](../docs/tools/check-song.py).

**Klank kiezen.** Een synth of drumcomputer krijgt zijn klank via een **tune** (de volledige instelling, [tunes/](../tunes/README.md)); sequencers, effecten en mixers krijgen **presets** ([presets/](../presets/README.md)). Gebruik de tunes en presets uit de repo (CC0-1.0) liever dan zelf waarden te verzinnen. Per stijl staan in de gids de passende packs en mappen.

**Licenties.** Songs zijn CC-BY-4.0, tunes en presets CC0-1.0, apparaten AGPL-3.0-or-later.

## 13. Controlelijst

Controleer voordat je oplevert:

1. Elk nootnummer ligt in het bereik van zijn rol (sectie 1) en in de toonladder (sectie 2), behalve bewuste wisselnoten.
2. De akkoordprogressie klopt met de akkoordsoort van het spoor (sectie 4, vooral bij Chord Sequencer).
3. Elke velocity ligt tussen 0,05 en 1; accenten op de tellen, ghost notes op de tussenplaatsen.
4. Elke lijst heeft de volledige lengte die het apparaat vraagt (Step Sequencer: 64 plaatsen).
5. Een patroon van `len` stappen past bij de gekozen `res` (een maat = 16 stappen op 1/16).
6. Elke sectie is 4, 8 of 16 maten en iets verandert elke 8 maten (sectie 9).
7. Er is een eigen plek voor elke rol (sectie 10) en een stilte of break voor de drop.
8. Alle notenpoorten zijn verbonden met een klankbron en alle klankbronnen met een uitgang.
9. Niets is verzonnen: velden bestaan in de AGENTS.md van het apparaat.
