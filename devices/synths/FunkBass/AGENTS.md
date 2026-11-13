# AGENTS.md: Funk Bass

Dit bestand is voor AI-agents die **tunes voor Funk Bass** maken, het apparaat bijwerken of een song met dit apparaat componeren. Het is niet geschreven voor mensen. Het hoort bij `../../../AGENTS.md` (algemeen) en `../../../tunes/AGENTS.md` (regels voor tunepacks); lees die eerst. Hier staat wat alleen voor Funk Bass geldt.

## Wat Funk Bass is

Een basgitaar voor soul, funk en jazz als **fysisch model** in een AudioWorklet (`FunkBassProcessor`, motor `Engine`), zonder samples. Het heeft **geen** eigen sequencer of klavier: het speelt noten die binnenkomen op de ingang `notes`. De aanslag (gedempte noot, vingers, pull, slap, pop, hammer-on, slide) volgt uit de velocity, de nootlengte en overlap tussen noten, zodat een sequencer ze kan programmeren. Het contract geeft een nootgebeurtenis alleen `note`, `vel`, `time` en `dur` (en `ch`): er zijn dus geen extra nootvelden; de keuze van de aanslag zit in die vier en in keyswitches (zie "Hoe de noten binnenkomen"). De signaalweg:

1. **Snaren:** vier (E1 28, A1 33, D2 38, G2 43) of vijf (met lage B0 23) digitale golfgeleiders, één stem per snaar. Per snaar een vertragingslijn met kubische uitlezing (Catmull-Rom), een lusfilter (eenpolig laagdoorlaat plus lusversterking) dat per noot wordt opgelost uit twee galmtijden (grondtoon en 2,2 kHz, in seconden, dus de demping hangt af van de absolute frequentie), een keten van twee allpass-trappen die per noot wordt opgelost zodat deeltoon 6 de gewenste inharmonischheid `B` krijgt (stijfheid), de toonhoogte-correctie voor de fasevertraging van al die filters (de lijnlengte wordt per noot uitgerekend; gemeten fout minder dan 0,3 cent), en een **snaar-tegen-fret**-niet-lineariteit (eenzijdige begrenzing in de lus met rammelruis; open snaren rammelen 2,6 × minder). Spanningsmodulatie (toonhoogtedip door de energie in de snaar) is optioneel.
2. **Aanslag:** de snaar krijgt een korte puls (raised cosine met een eenpolig laagdoorlaat) ingevoerd, geschaald op een vast RMS-niveau per snaarperiode, en een **plukpositie** als kamfilter `e[n] − e[n−βN]`. Vingers: brede, zachte puls (3 tot 1 ms); slap: smalle puls bij β 0,16 met een duimdreun (laagdoorlaat-ruis rond 190 Hz), kletsruis (3 kHz) en veel rammel; pop: nog smaller bij β 0,085, nasale klik (3,6 kHz) en een klokvormige piek van +8 dB op 1,5 kHz; dode noot: gedempte snaar (galmtijd 30 ms), extra stijfheid, gedempte dreun; palm mute: korte galmtijd, zachte puls; flageolet: smalle puls, zuivere snaar; plectrum: smalle puls dicht bij de brug met klik.
3. **Stemverdeling:** een nieuwe noot op dezelfde snaar dempt de vorige met een korte afname (3 ms) voordat de nieuwe aanslag begint (de motor plant dat vooruit, geen klik); noten op andere snaren klinken uit. De snaar wordt gekozen met een kostenfunctie: `pos` (0 = lage frets en open snaren, 1 = hoge frets), dezelfde handpositie als de vorige noot, en of een snaar nog bezet is. **Legato:** overlappen twee noten op dezelfde snaar, dan is er geen nieuwe aanslag: hammer-on of pull-off (toonhoogte in 4 ms, kleine tik of pluk) tot 7 halve tonen, slide (toonhoogte glijdt in `glide` ms, met glijruis) daarboven. Bij fretless is elke legato-overgang een slide.
4. **Pickups:** twee pickuppunten op de snaar als kam over de snaar (`s[n] − s[n − pN]`), brug (0,075 of 0,11 van de snaarlengte) en hals (0,215 of 0,2), te mengen met `pickMix`; single-coil (laagdoorlaat 5,2 kHz, Q 1,1) of humbucker (3,3 kHz, Q 0,8); hals- en bodyresonanties (118 en 232 Hz).
5. **Elektronica:** toonregeling Actief (bas, mid, hoog) of Passief (een toonknop), compressie, voorversterker met asymmetrische tanh met ADAA en 2× oversampling (volgt `host.audio.oversample`: `none` zet het uit), kastsimulatie en een zachte begrenzer (lineair tot 0,7, daarboven een knie naar 1): de uitgang komt nooit boven 1,0.
6. **Fretless:** geen frets, dus geen rammel; elke overgang is een slide; een zoemend bandfilter (mwah) volgt de energie van de snaar en zakt met het uitklinken.

Het apparaat heeft **één mono-uitgang** (geen aparte DI- en ampuitgang; de kastsimulatie is een regelaar `cab`).

| | |
|---|---|
| Bestand | `funk-bass.patchkamer-device.js` (in deze map) |
| `id` | `nl.patchkamer.funkbass`. Verander die nooit: daaraan hangen tunes en songs van gebruikers |
| Naam | `Funk Bass` in alle talen; alleen de poortnamen en de labels hebben een Nederlandse variant |
| Soort | `instrument` (categorie `synth`): dit apparaat krijgt dus **tunes** (geen presets) |
| Poorten | eventingang `notes` (Keyboard / notes, Keyboard / noten), modulatie-ingang `mod`, audio-uitgang `out` (Bass out, Bas uit; mono) |
| Contract | v1.35 |
| Versie | 1.0.0 |
| Worklet | `nl-patchkamer-funkbass-1-0-0` (verhoog het versienummer in de naam bij elke wijziging van de motorcode) |
| Licentie apparaat | AGPL-3.0-or-later |

## Wat je hier doet

Je maakt klanken (tunes) voor Funk Bass en zet ze als pack in `../../../tunes/`; het meegeleverde pack is `funk-bass-styles.patchkamer-tunes.json`. Het apparaat zelf pas je alleen aan als de opdracht dat zegt (`version` ophogen; `id`, poort-id's en state-velden gelijk houden).

## Hoe de noten binnenkomen

Een event op de ingang `notes` heeft `type` `note`, `noteon` of `noteoff` met een `note` (MIDI), `vel` (0 … 1; 0 telt als noteoff), `time` en bij `note` ook `dur` (s). `noteon` of een `note` zonder `dur` klinkt tot een `noteoff` (en dooft na hoogstens 20 s). Een `panic`, `allnotesoff` of het stoppen van de klok zet alles uit. Een noot onder 12 is een **keyswitch** (zie hieronder), geen geluid; noten van 12 tot 100 klinken (onder E1 of B0 ook, als gedetuneerde laagste snaar; boven fret 24 op de G-snaar ook).

### De aanslag: velocity-zones

Standaard (`technique` Vingers, en met de drempels uit de state):

| Velocity (0 … 1; ×127 = MIDI) | Aanslag |
|---|---|
| onder `ghostVel` (0,2, MIDI 25) | **dode noot** (ghost note): gedempte snaar, bijna toonloos, korte dreun |
| of nootlengte korter dan `ghostDur` (0,04 s) bij velocity onder 0,7 | idem |
| van `ghostVel` tot `slapVel` (0,8) | **vingers**: zacht en rond; boven ongeveer 0,6 van het bereik langzaam naar **pull**: plukpositie dichter bij de brug, smallere puls, helderder, de snaar rammelt tegen de frets (het statusregeltje op de kaart zegt "Pull" vanaf het midden van die overgang) |
| vanaf `slapVel` (0,8, MIDI 102) | **slap**: duim tegen de snaar, scherpe aanzet, veel hoge deeltonen, dreun en klets, korte galmtijd |
| vanaf `popVel` (0,94, MIDI 119) | **pop**: snaar wordt weggetrokken en klapt tegen de frets, nasaal, kort |
| `mute` boven 0,5 | vingeraanslag wordt **palm mute** |
| `technique` Plectrum | elke noot boven `ghostVel` is een plectrumaanslag; slap en pop bestaan dan niet |

`slapVel` en `popVel` boven 1 (in de kaart "Uit") zetten slap en pop uit; zo speelt een sequencer met accenten op velocity 1 in een Motown- of jazzklank geen pops. Staat `autoPop` aan (standaard), dan is een noot die precies een octaaf (12 halve tonen) boven een slap komt, binnen 0,3 s en met velocity vanaf `slapVel`, een **pop** (het octaaf-slap-patroon).

**Keyswitches** (alleen met `keyswitch` aan, standaard aan): speel een toets van 0 t/m 11 (C-1 t/m B-1) en alle volgende noten krijgen die aanslag, tot de volgende keyswitch: 0 automatisch (velocity-zones), 1 vinger, 2 pull, 3 slap, 4 pop, 5 dode noot, 6 palm mute, 7 flageolet (hoge, zuivere, korte deeltoon), 8 plectrum. Dezelfde keuze maak je met een event `cc` met `id` `art` en `value` 0 … 1 (afgerond op achtsten: 0 tot 8). De keyswitch hoort bij de noten die erna komen (de motor verwerkt berichten in volgorde).

**Legato:** noten op dezelfde snaar die overlappen (de nootlengte van de eerste reikt voorbij de start van de volgende, dus in een Step Sequencer `ln` groter dan de afstand) zijn een hammer-on (omhoog) of pull-off (omlaag) tot 7 halve tonen en een slide daarboven; `legato` kiest `auto`, `hammer` (alles tot 7 halve tonen hammer, daarboven slide), `slide` (alles slide) of `off` (overlap geeft een nieuwe aanslag). Een slide duurt `glide` ms.

### Snaarkeuze

`pos` 0 kiest de snaar met de laagste fret (open snaren winnen); `pos` 1 kiest de dikste snaar waar de noot nog op past (hoge frets, jazz). Daarbij telt de afstand tot de vorige handpositie. Wie een noot twee keer op dezelfde snaar wil horen (met demping van de vorige), laat ze niet overlappen. Een noot die op één snaar nog klinkt wordt gemeden, tenzij legato.

## De state

`state` van een tune is wat `getState()` teruggeeft: 29 getallen, 6 keuzes en 3 schakelaars. Er is **geen patroon**: een tune is een klank, de noten komen uit de song. Een veld dat je weglaat krijgt de startwaarde; zet in een tune liever alle velden (het meegeleverde pack doet dat). `setState` snapt getallen op hun stap en kapt ze af op het bereik; een ongeldige keuze geeft de startwaarde.

### Getallen

Alle getalvelden behalve `transpose` zijn te moduleren (sporen: Snaar, Spel, Pickups, Versterker); de knop is de basis, een modulator telt `uitslag × (max − min)` bij (logaritmische velden: `knop × (max/min)^uitslag`).

| Veld | Wat | Bereik | Start | Schaal | Modulator aan (drift) |
|---|---|---|---|---|---|
| `sustain` | Uitklank: vermenigvuldigt beide galmtijden van de snaar (grondtoon en 2,2 kHz) | 0.3 … 2.5 | 1 | log | uit (0.05) |
| `bright` | Snaarhelderheid: galmtijd van de hoge deeltonen (0,4 × tot 2 ×); nieuwe snaren zijn helder, oude dof | 0 … 1 | 0.5 | lin | aan (0.06) |
| `stiff` | Stijfheid: inharmonischheid B van de snaar (1 = ongeveer 3,5·10⁻⁴ bij roundwound, 2,2·10⁻⁴ bij vlakwond; 0 = zuivere harmonischen) | 0 … 2 | 1 | lin | uit (0.05) |
| `buzz` | Rammel: hoe dicht de snaar bij de fret ligt (0 = hoge snaarafstand, 1 = laag en rammelend); werkt bij harde aanslagen (pull, slap, pop, plectrum) | 0 … 1 | 0.4 | lin | uit (0.06) |
| `tm` | Spanning: toonhoogtedip na een harde aanslag (spanningsmodulatie van de snaar) | 0 … 1 | 0.5 | lin | uit (0.05) |
| `deadspot` | Dode plek: hoeveel sustain een noot rond 118 Hz verliest door een halsresonantie | 0 … 1 | 0.3 | lin | uit (0.05) |
| `ghostVel` | Velocity onder deze waarde is een dode noot (ghost note) | 0 … 0.4 | 0.2 | lin | uit (0.02) |
| `slapVel` | Velocity vanaf deze waarde is een slap; boven 1 (afgebeeld als "Uit") is slap uitgeschakeld | 0.5 … 1.05 | 0.8 | lin | uit (0.02) |
| `popVel` | Velocity vanaf deze waarde is een pop (niet lager dan Slap vanaf); boven 1 is pop uitgeschakeld | 0.6 … 1.05 | 0.94 | lin | uit (0.02) |
| `ghostDur` | Een noot korter dan dit (en met velocity onder 0,7) is een dode noot | 0 … 0.12 | 0.04 | lin | uit (0.02) |
| `pluckPos` | Plukpositie over de snaar, gemeten vanaf de brug (kamfilter in de aanzet; articulaties veranderen hem) | 0.05 … 0.45 | 0.2 | lin | uit (0.03) |
| `touch` | Aanslaggevoeligheid: 0 = bijna elke vingeraanslag even hard, 1 = ongeveer 20 dB bereik | 0 … 1 | 0.6 | lin | uit (0.03) |
| `pos` | Snaarkeuze: 0 = open snaren en lage frets (funk), 1 = dikke snaren en hoge frets (jazz) | 0 … 1 | 0.35 | lin | uit (0.02) |
| `glide` | Glijtijd van een slide (hammer-on en pull-off duren 4 ms) | 10 … 600 | 90 | log | uit (0.03) |
| `rel` | Dempen: hoe snel een noot dooft als de nootlengte voorbij is (open snaren 1,8 × zo lang) | 8 … 400 | 70 | log | uit (0.05) |
| `mute` | Dempvlak (palm mute of schuim): verkort de galmtijden; boven 0,5 worden vingeraanslagen palm-mute | 0 … 1 | 0 | lin | uit (0.04) |
| `noise` | Speelgeluid: vingers, fretruis bij loslaten en glijruis | 0 … 1 | 0.5 | lin | aan (0.06) |
| `human` | Mensvariatie: kleine afwijkingen in toonhoogte (tot ±3,5 ct), niveau (±1,6 dB), plukpositie en kleur; samen met round-robin (om en om een iets andere aanslag) | 0 … 1 | 0.35 | lin | aan (0.06) |
| `tune` | Stemming van het hele instrument | -50 … 50 | 0 | lin | uit (0.03) |
| `transpose` | Transpositie in halve tonen (niet stuurbaar) | -12 … 12 | 0 | lin | uit (0) |
| `pickMix` | Mix van brugpickup (0) en halspickup (1) | 0 … 1 | 0.55 | lin | aan (0.08) |
| `body` | Hals en body: twee resonanties (118 en 232 Hz) | 0 … 1 | 0.4 | lin | aan (0.06) |
| `mwah` | Mwah van de fretless-modus (zoemend filter dat met het uitklinken zakt) | 0 … 1 | 0.5 | lin | aan (0.08) |
| `bass` | Bas: lage plank op 90 Hz, ±12 dB (alleen bij toonregeling Actief) | -1 … 1 | 0 | lin | aan (0.06) |
| `mid` | Mid: klok op 480 Hz, ±9 dB (alleen Actief) | -1 … 1 | 0 | lin | aan (0.06) |
| `treble` | Hoog: hoge plank op 3,2 kHz, ±12 dB (Actief); bij Passief de toonknop (500 Hz tot 9 kHz laagdoorlaat) | -1 … 1 | 0 | lin | aan (0.06) |
| `drive` | Drive van de voorversterker (ADAA-tanh met oversampling) | 0 … 1 | 0.12 | lin | aan (0.06) |
| `comp` | Compressie: verhouding 1 tot 6 met make-up | 0 … 1 | 0.25 | lin | aan (0.05) |
| `cab` | Kast: mix van een kastsimulatie (hoogdoorlaat 48 Hz, laagdoorlaat 4,2 en 5,6 kHz, +4 dB op 95 Hz) | 0 … 1 | 0 | lin | aan (0.05) |
| `vol` | Volume (3,4 × vol²) met zachte begrenzer | 0 … 1 | 0.7 | lin | uit (0.02) |

### Keuzes en schakelaars

| Veld | Wat | Waarden | Start |
|---|---|---|---|
| `strings` | Aantal snaren | `4`, `5` (lage B) | `4` |
| `wound` | Snaartype | `round` (roundwound: galmtijd 7 s en 0,8 s), `flat` (vlakwond: 4,2 s en 0,16 s, lagere inharmonischheid) | `round` |
| `pickup` | Pickuptype | `single`, `hum` | `single` |
| `tech` | Techniek | `fingers`, `pick` | `fingers` |
| `legato` | Hammer-on en slide | `off`, `hammer`, `slide`, `auto` | `auto` |
| `eq` | Toonregeling | `active`, `passive` | `active` |
| `fretless` | Fretless (geen rammel, alles slide, mwah) | `true`/`false` | `false` |
| `autoPop` | Octaaf na slap is pop | `true`/`false` | `true` |
| `keyswitch` | Toetsen 0 t/m 11 zijn keyswitches | `true`/`false` | `true` |

## Gemeten (niet beluisterd)

Alles hieronder is gemeten met de echte worklet-code van het apparaat: in Node met een nep-`AudioWorkletProcessor` (blokken van 128, 48 kHz) en in headless Chromium met de echte apparaatcode in een `OfflineAudioContext` (zoals `docs/tools/worklet-harness.mjs` en `docs/tools/tune-finder-page.js`; de meetscripts staan buiten de repo). Ik kon geen geluid horen; wat hieronder over klank staat, zijn spectra en omhullenden.

- **Toonhoogte:** noot 23 … 67 (B0 tot G4, stap 2, `human` 0, 5 snaren, vel 0,6, FFT van 1,2 s): fout 0,10 … 0,27 cent; noten tot 96 (2093 Hz) 0,0 … 0,1 cent. Met `human` > 0 komt er per noot een willekeurige afwijking bij tot ±3,5 cent.
- **Inharmonischheid** (vel 0,7, `stiff` 1, roundwound): `B` gemeten uit deeltonen 4 … 10: 3,4·10⁻⁴ (E1), 3,1·10⁻⁴ (A1), 3,8·10⁻⁴ (E2) en 5,5·10⁻⁴ (E3, de oplosser is daar beperkt omdat de allpass-keten niet meer dan 42 % van de lijn mag innemen); deeltoon 10 ligt +23 … +37 cent boven de harmonische. Met `stiff` 0 liggen alle deeltonen binnen 1 cent.
- **Aanslagen** (noot F2 = 87,3 Hz, `human` 0, 150 ms na de aanslag; gemeten in Chromium): dode noot −29,6 dBFS rms, zwaartepunt 424 Hz, toonhoogtesterkte (genormeerde autocorrelatie) 0,17; vingers vel 0,45 / 0,65: −20,9 / −17,6 dBFS, zwaartepunt 312 / 389 Hz, energie boven 2 kHz −63 / −58 dB ten opzichte van het totaal, toonhoogtesterkte 0,85; pull (vel 0,78): −16,6 dBFS, 489 Hz, −49 dB boven 2 kHz; slap (0,86): −16,1 dBFS, 1048 Hz, −23 dB boven 2 kHz, toonhoogtesterkte 0,71; pop (0,97): −15,5 dBFS, 1308 Hz, −17 dB boven 2 kHz, 0,70. Slap en pop zijn dus 2,7 en 3,4 × zo helder (zwaartepunt) als een vingeraanslag van vel 0,65 en 35 tot 41 dB sterker boven 2 kHz. Aanzettijd tot 90 % van de piek (1 ms-vensters): vingers 2 … 5 ms, pull 0 … 14 ms, slap en pop 0 … 1 ms.
- **Uitklinktijd** (vel 0,65, 10 s noot, van 0,1 s na de aanslag tot −20 / −40 dB): roundwound open E1 2,6 / 4,95 s, A1 2,4 / 4,65 s, D2 2,3 / 4,35 s, G2 2,05 / 4,0 s, B0 2,4 / 4,7 s, fret 12 op de E-snaar (E2) 1,9 / 3,7 s, noot 64 1,2 / 2,3 s; vlakwond E1 1,25 / 2,65 s, A1 1,3 / 2,55 s, G2 1,15 / 2,25 s; slap op A1 0,94 / 1,96 s, pop 0,66 / 1,28 s, dode noot 0,08 / 0,14 s.
- **Aliasing:** energie tussen de harmonischen (afstand tot een harmonische groter dan 0,3 × f0, tot 18 kHz) ten opzichte van de harmonischen, `stiff` 0 en `noise` 0: vingers −83 dB (noot 60) tot −105 dB (noot 88); slap met `buzz` 1 −73 / −81 / −83 / −89 dB; pop met `buzz` 1 en `drive` 1 −72 / −83 / −89 / −93 dB (noten 60, 72, 79, 88); een referentie op 192 kHz geeft hetzelfde binnen 3 dB (op −83 … −112 dB tot 7,6 dB).
- **Geen kliks:** voor het begin van een nieuwe noot op dezelfde snaar zakt de vorige in 3 ms weg: de grootste sprong tussen twee samples in die 6 ms is 0,015 (gewone beweging: 0,015); rond een nootlengte-einde 0,011 (ervoor 0,015). Overgangen van legato en slide zijn continu (de lusparameters lopen mee).
- **Denormalen:** na 120 s stilte met alle effecten aan blijft de rekentijd per blok vlak (1 … 4 µs); de bus wordt na 1,1 s stilte overgeslagen en gewist, en de staten van de filters worden per blok onder 1e-25 op 0 gezet.
- **Rekentijd** (blokken van 128 samples, budget 2,67 ms): in Node over 90 s met 5 snaren en willekeurige zestiende noten (nootlengte 50 … 450 ms), cab 0,6, drive 0,3, comp 0,5: gemiddeld 38 µs (1,4 %), p50 36 µs, p99 61 µs (2,3 %), p99,9 140 µs (5,2 %), maximum 334 µs (12,5 %, gewone systeemruis); een korte koude meting van 4 s met dichte noten gaf gemiddeld 79 … 143 µs (3 … 5 %) en een maximum tot 1,2 ms door het opwarmen van de JIT; een noot starten kost 15 … 35 µs. Vijf snaren continu aan: 1,6 % gemiddeld (maximum 14 %); stil (geen noten): 1 … 4 µs. In Chromium (OfflineAudioContext, 60 s met 560 noten op 5 snaren): 2,2 % van real-time, met alle zware instellingen 2,1 %. In een echte browser in realtime niet gemeten.
- **NaN en Infinity:** 120 reeksen van 6 s (44,1, 48 en 96 kHz) met willekeurige en extreme instellingen (alle getallen op minimum, maximum of ertussen, alle keuzes, nootnummers 0 … 127, velocity of lengte NaN, Infinity en 1e30, tijden NaN, keyswitches, `stop`, berichten met niet-eindige parameters) gaven 45,1 miljoen samples met 0 niet-eindige samples en een piek van hoogstens 1,000. In Chromium met extreme instellingen (vol, drive, comp, cab, bas, mid en hoog op maximum, buzz 1, vel 1): 0 niet-eindige samples, piek 0,89.
- **Echte host:** Step Sequencer (patroon met dode noten, vingers, slaps en pops) → Funk Bass → Speakers in headless Chromium met een echte `AudioContext`: het statusregeltje volgde de noten (Slap, Pop, Dood, Vinger met snaar en fret), 7,3 s opname zonder niet-eindige samples en zonder console- of paginafouten. Zonder paginafouten: plaatsen, tunes laden (6 van 26 gekozen, alle knoppen, keuzes en schakelaars volgen de tune), taalwissel nl/en, 412 px breed (de host schaalt de kaart van 460 px dan naar 0,73) zonder scrollbalk, en de skin Compact.

### Wat een bewaker doet

De motor accepteert alleen eindige parameters (afgekapt op hun bereik) en eindige gebeurtenissen: een nootnummer, velocity of tijd die niet eindig is, wordt genegeerd (een lengte die niet eindig of niet positief is maakt van de noot een gehouden noot); de wachtrij heeft 96 plaatsen (een volle rij laat de noot vallen). Per blok worden de toestanden van elke snaar (lusfilters, allpass, omhullende, demper, ruisfilters, mwah, aanslagfilter) en van de bus (alle filters, ADAA, oversampling, compressor) op eindigheid gecontroleerd en teruggezet; een snaar die stil is (omhullende onder 1e-12) wordt gewist; de uitgang heeft een zachte begrenzer en een uitgangssample dat niet eindig is wordt 0. Geen allocaties in het proces (alle buffers, opdrachtvakken en het statusbericht zijn vooraf gemaakt; alleen `postMessage` zelf klonen het bericht, hoogstens 20 per seconde en alleen als de kaart open staat). De bewaker draait in de worklet zelf (geen timer, geen extra `AudioNode`s).

## Een tune

Een pack heet `naam.patchkamer-tunes.json` en staat in `../../../tunes/`. Het formaat en de licentie (`CC0-1.0` voor alles in `tunes/`) staan in `../../../tunes/AGENTS.md`. Voor dit apparaat is `device` altijd `nl.patchkamer.funkbass` en elke tune is `kind: "set"` met een volledige `state` als hierboven. Zet geen merknamen van bestaande apparatuur, artiesten of nummers in naam of omschrijving en verzin geen persoon bij `author`.

Het meegeleverde pack `funk-bass-styles.patchkamer-tunes.json` heeft 26 tunes in negen mappen: Motown (3), Funk (4), Slap (4), Jazz (4), Disco (2), Soul (3), Dub (2), Rock (2) en Basics (2). Het niveau is gelijkgetrokken: de rms van een referentielick (zeven noten 40, 43, 45, 47, 40, 52, 45 met 0,3 s tussenruimte, nootlengte 0,22 s, velocity 0,7 of, bij een tune met `slapVel` onder 0,76, `slapVel` + 0,06; `human` 0; gemeten van 0,1 tot 2,2 s) ligt op −18,0 dBFS (21 van de 26 tussen −18,2 en −17,9; vijf tunes met veel dreun of pops, Motown Foam Mute, Slap Funk, Thumb And Pop Staccato, Reggae Roots en Octave Pop Funk, liggen op −18,7 … −20,2 omdat hun piek anders boven 0,93 komt); `vol` ligt tussen 0,56 en 0,78. Meet je nieuwe tunes op dezelfde manier en pas `vol` aan (het niveau volgt `vol²`).

### Wat werkt goed

| Soort | Instelling |
|---|---|
| Motown | `wound` `flat`, `eq` `passive` met `treble` −0,3, `pickMix` 0,9, `mute` 0,4 … 0,8, `slapVel` en `popVel` 1,05 (uit), `rel` 45 … 90, `bright` 0,3 |
| Funk (vingers) | `pickMix` 0,3 … 0,45, `ghostVel` 0,26 … 0,3, `rel` 28 … 50, `mute` 0,15 … 0,3, `comp` 0,45 … 0,55, `pos` 0,2 … 0,25, `pluckPos` 0,13 … 0,17 |
| Slap | `slapVel` 0,62 … 0,74, `popVel` 0,88 … 0,93, `bass` +0,3 … +0,6, `mid` −0,2 … −0,8, `treble` +0,2 … +0,7, `buzz` 0,5 … 0,6, `comp` 0,5 … 0,65, `pickMix` 0,2 … 0,4 |
| Jazz | `wound` `flat`, `eq` `passive`, `treble` −0,4 … −0,7, `pickMix` 0,85 … 1, `pos` 0,7 … 0,8, `rel` 110 … 160, `sustain` 0,9 … 1,4; fretless: `fretless` aan, `mwah` 0,75, `legato` `slide`, `glide` 120 |
| Disco | `popVel` 0,94, `slapVel` 1,05, `mute` 0,25, `comp` 0,6, `bass` +0,2, `treble` +0,3; of `tech` `pick` |
| Soul | `pickup` `hum`, `pickMix` 0,7 … 0,8, `sustain` 1,8 … 2, `drive` 0,22 … 0,3, `body` 0,7 |
| Dub | `wound` `flat`, `eq` `passive`, `treble` −0,8 … −0,95, `mute` 0,5 … 0,6, `sustain` 0,9 … 1,6, `rel` 120 … 200 |
| Rock | `tech` `pick`, `pickup` `hum`, `drive` 0,35 … 0,75, `cab` 0,8 bij de versterkervariant |

### Wat een tune niet doet

- Maak geen stille tune: `vol` 0 geeft niets te horen.
- Zet `slapVel` en `popVel` op 1,05 voor een klank waarin accenten op velocity 1 geen slap of pop mogen worden; laat ze staan voor een slap-tune of een sequencer met velocity-zones.
- Houd `ghostVel` boven de zachtste vingervelocity die je sequencer gebruikt: een tune met `ghostVel` 0,3 maakt van elke noot onder MIDI 38 een dode noot.
- Zet geen routing of keyswitches in de state; keyswitches komen uit de noten.
- Verzin geen velden.

## Patronen voor de Step Sequencer

Tunes bevatten geen patronen. Patronen die de aanslagen laten horen staan als presets van Step Sequencer in `../../../presets/step-sequencer-funk-bass.patchkamer-presets.json` (negen patronen: Funk Sixteenths With Ghost Notes, Slap And Pop Octaves, Staccato Funk Pops, Motown Eighths With Hammer-On, Walking Jazz Two Bars, Disco Octave Pulse, Neo-Soul Slow Groove With Slide, Reggae Roots One Drop en Fusion Slide Line, met voorgestelde tempo's in de omschrijving van het pack). De velocities liggen binnen de standaardzones: dode noot 0,12 … 0,15, vingers 0,55 … 0,78, slap 0,86 … 0,9, pop 0,96 … 0,98; een overlap (`ln` groter dan de afstand tot de volgende noot) geeft hammer-on of slide. Een song is een export van een werkruimte; zie `../../../songs/AGENTS.md`.

## Skins

Alle knoppen en keuzes zijn herkenbaar voor skins: `id` is de state-sleutel, `role` is `param` (knoppen), `select` (keuzelijsten), `toggle` (schakelaars) of `button` (de proefknoppen `try.dead`, `try.finger`, `try.pull`, `try.slap`, `try.pop`, `try.octave`, `try.hammer`, `try.slide` en `try.off`); `group` is `string` (Snaar), `play` (Spel), `pickup` (Pickups), `amp` (Versterker), `sound` (de zes keuzelijsten), `mode` (de drie schakelaars) of `try`. De skin `skins/library/nl.patchkamer.funkbass/compact.patchkamer-skin.json` (Compact, 400 px) zet de knoppen als draaiknoppen in zes kolommen en de keuzes in twee kolommen. Wijzig je de opbouw of de groepen, controleer dan de skin.

## Controleren

- Draai vanuit de root van de repo: `node contract/validate-instrument.mjs devices/synths/FunkBass/funk-bass.patchkamer-device.js` (en met `--lang en`). Dat moet `OK` geven, zonder `let op` (nu: 29 stuurbare parameters in 4 sporen, 1 worklet, 36 host-knoppen volgen `setState`, 48 regelaars met id).
- Je kunt niet horen hoe een tune klinkt. Heb je een browser, laad dan de host (`../../../patchkamer/AGENTS.md`) en kies de tune. Een apparaat zonder kabel naar Speakers of een mixer laat zijn worklet niet draaien (Chromium verwerkt een knoop zonder verbinding naar de uitgang niet): leg een kabel voor je test.
- Alle tekst in het apparaat staat in het woordenboek `EN` bovenin het bestand (Nederlandse bron, Engels via `host.lang`). Een nieuwe tekst krijgt altijd nl én en.
- De merkencheck uit de root `AGENTS.md` moet leeg zijn: let op de naam van de worklet-klasse, van je tunes en van de beschrijving.
- De motorcode staat als tekst in het apparaatbestand (`WORKLET`); wijzig je haar, verhoog dan `version` en het getal in `WNAME`.

## Wat je niet doet

- Verander nooit de `id`, de `kind`, de poort-id's of de namen van state-velden.
- Pas het apparaat niet aan om een tune te laten kloppen.
- Commit of push niet, tenzij de opdracht dat vraagt.

## Documentatie en songs

- Handleiding van Funk Bass: zie het hoofdstuk Funk Bass in `../../../docs/synths/USER-MANUAL_NL.md`.
- Overzicht van de soort: [README](../README.md).
- Tunes (klanken, `kind: set`): [funk-bass-styles.patchkamer-tunes.json](../../../tunes/funk-bass-styles.patchkamer-tunes.json). Kies een tune als beginpunt voor de `state` van dit apparaat in de song; velden die de tune niet noemt krijgen hun standaard. Hoe tunes zijn opgebouwd: [tunes/AGENTS.md](../../../tunes/AGENTS.md).
- Overzicht van alle apparaten en hun signaalketens: [devices/AGENTS.md](../../../devices/AGENTS.md). Een song componeren: [songs/AGENTS.md](../../../songs/AGENTS.md).
- Route voor agents: [soort Synths](../AGENTS.md) → [devices/AGENTS.md](../../AGENTS.md) → [root AGENTS.md](../../../AGENTS.md). Contract: [NL](../../../contract/PATCHKAMER-CONTRACT_NL.md) · [EN](../../../contract/PATCHKAMER-CONTRACT_EN.md). Hoe tunes van dit apparaat zijn opgebouwd: [tunes/AGENTS.md](../../../tunes/AGENTS.md). <!-- agents-tree -->
- Rol in een song: de basgitaar van soul, funk en jazz. Noten op `notes`, audio uit `out` (mono). Stuur hem met een Step Sequencer (een baslijn per patroon, met velocity en nootlengte voor de aanslag) of met Keys; zet er een drumcomputer naast en laat de basslag samenvallen met de kick. Geen aparte DI-uitgang.
