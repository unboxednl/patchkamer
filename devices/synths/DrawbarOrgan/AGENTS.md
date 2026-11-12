# AGENTS.md: Drawbar Organ

Dit bestand is voor AI-agents die **tunes voor Drawbar Organ** maken, het apparaat bijwerken of een song met dit apparaat componeren. Het is niet geschreven voor mensen. Het hoort bij `../../../AGENTS.md` (algemeen) en `../../../tunes/AGENTS.md` (regels voor tunepacks); lees die eerst. Hier staat wat alleen voor Drawbar Organ geldt.

## Wat Drawbar Organ is

Een orgel met trekkers, geïnspireerd op klassieke tonewheel-orgels, voor funk, soul, jazz, gospel en blues (geen elektronische muziek). Eén motor als AudioWorklet (`OrganEngine`), polyfoon zonder stemmenlimiet: een orgel speelt alle toetsen tegelijk. Het heeft **geen** eigen sequencer of klavier: het speelt noten die binnenkomen op de ingang `notes`. De signaalweg:

1. **Generatorbank:** 91 generatoren (toonhoogte `24 + w` met `w` = 0 … 90, dus 32,7 Hz tot 5,9 kHz), altijd actief. Tonewheel: een sinus met een zweempje 2e en 3e harmonische en kleine afwijkingen per toonklasse (zie "Gemeten"). Combo: een blokgolf en een smalle puls (PolyBLEP), te mengen met `reed`.
2. **Toetscontacten:** elke toets heeft negen contacten (Upper, Lower) of twee (basvoeten) die elk de generator van zijn eigen interval tappen: 16′ = −12, 5⅓′ = +7, 8′ = 0, 4′ = +12, 2⅔′ = +19, 2′ = +24, 1⅗′ = +28, 1⅓′ = +31, 1′ = +36 halve tonen, **gelijkzwevend** (dus niet zuiver) en teruggevouwen met octaven als de generator boven nummer 90 uitkomt (of eronder). De contacten sluiten niet tegelijk (`clickSpread`), met een aanzettijd van 8 ms (`click` 0) tot 0,03 ms (`click` 1) en een loslaattijd van 12 ms tot 0,05 ms (`relClick`).
3. **Trekkers:** elke trekker is een bus; stand 0 … 8 = −3 dB per stap (8 = 0 dB, 1 = −21 dB, 0 = uit). Percussie is een extra bus op Upper (2e of 3e harmonische) met een gedeelde enveloppe; met percussie aan zwijgt trekker 9 (1′) op Upper.
4. **Lekkage** (`leak`): overspraak tussen naburige generatoren (tot −40 dB) en veertien vaste "spookgeneratoren" op alle bussen (zacht, klinkt ook zonder toetsen als alle trekkers uit staan).
5. **Vibrato en chorus** op Upper en Lower (niet op de basvoeten): een vertragingslijn met een scanner van `vibRate` Hz, V1 … V3 (alleen het gemoduleerde signaal) en C1 … C3 (de helft droog, de helft gemoduleerd), per manual aan of uit.
6. **Akkoordcompensatie** (traag, 40 ms aanval, 150 ms herstel): `(1 + 0,8 × (noten − 1))^−0,45`, zodat één noot en een akkoord ongeveer even luid zijn.
7. **Voorversterker:** asymmetrische tanh met ADAA, daarbovenop 2× oversampling (of 4×, of uit) volgens `host.audio.oversample`, gelijkspanningsfilter, bas en hoog (plankfilters op 180 Hz en 3,2 kHz, ±10 dB) en een **veerhall** (twee veren met 30 allpass-trappen in een terugkoppellus, T60 ongeveer 1 s).
8. **Rotary:** crossover op 800 Hz (Linkwitz-Riley), een hoorn en een trommel met elk twee microfoons (Doppler, amplitudemodulatie, bij de hoorn ook een hoogverlies als hij wegwijst), micafstand, rotorgeluid bij toerenwisseling en bypass.
9. **Uitgang:** volume (`3,2 × vol²`) en een zachte begrenzer (lineair tot 0,7, daarboven een knie naar 1): de uitgang komt nooit boven 1,0.

| | |
|---|---|
| Bestand | `drawbar-organ.patchkamer-device.js` (in deze map) |
| `id` | `nl.patchkamer.drawbarorgan`. Verander die nooit: daaraan hangen tunes en songs van gebruikers |
| Naam | `Drawbar Organ` in alle talen; alleen de poortnamen en de labels hebben een Nederlandse variant |
| Soort | `instrument`: dit apparaat krijgt dus **tunes** (geen presets) |
| Poorten | eventingang `notes` (Keyboard / notes, Keyboard / noten), modulatie-ingang `mod`, audio-uitgang `out` (Stereo organ, Stereo orgel). Geen aparte droge uitgang |
| Contract | v1.35 |
| Versie | 1.0.0 |
| Worklet | `nl-patchkamer-drawbarorgan-1-0-0` (verhoog het versienummer in de naam bij elke wijziging van de motorcode) |
| Licentie apparaat | AGPL-3.0-or-later |

## Wat je hier doet

Je maakt klanken (tunes) voor Drawbar Organ en zet ze als pack in `../../../tunes/`. Het apparaat zelf pas je alleen aan als de opdracht dat zegt (`version` ophogen; `id`, poort-id's en state-velden gelijk houden).

## De state

`state` van een tune is wat `getState()` teruggeeft: 57 velden. Er is **geen patroon**: een tune is een klank, de noten komen uit de song. Een veld dat je weglaat krijgt de startwaarde; zet in een tune liever alle velden (het meegeleverde pack doet dat).

### Trekkers

Gehele getallen 0 … 8 (een ander getal wordt afgerond en afgekapt). `up0` … `up8` is Upper, `lo0` … `lo8` Lower, in de volgorde 16′, 5⅓′, 8′, 4′, 2⅔′, 2′, 1⅗′, 1⅓′, 1′; `pd0` (16′) en `pd1` (8′) zijn de basvoeten. De bekende registratiecijfers lees je dus rechtstreeks: `888000000` = `up0` … `up8` = 8, 8, 8, 0, 0, 0, 0, 0, 0. Start: Upper `888000000`, Lower `008000000`, basvoeten `8` en `0`. Bij Combo doen de trekkers van Upper en Lower niets (wel die van de basvoeten).

### Getallen

| Veld | Wat | Bereik | Start | Schaal | Modulator aan (drift) |
|---|---|---|---|---|---|
| `vol` | Volume van het hele apparaat | 0 … 1 | 0,5 | lineair | uit (0,02) |
| `drive` | Verzadiging van de voorversterker | 0 … 1 | 0,25 | lineair | aan (0,08) |
| `bass` | Plankfilter op 180 Hz (±10 dB) | −1 … 1 | 0 | lineair | aan (0,06) |
| `treble` | Plankfilter op 3,2 kHz (±10 dB) | −1 … 1 | 0 | lineair | aan (0,06) |
| `reverb` | Hoeveelheid veerhall | 0 … 1 | 0,2 | lineair | aan (0,06) |
| `click` | Aanzetklik: 0 = 8 ms zacht aanzetten, 1 = 0,03 ms | 0 … 1 | 0,45 | lineair | uit (0,04) |
| `clickSpread` | Spreiding van de negen contacten in tijd (0 … 3,5 ms) | 0 … 1 | 0,5 | lineair | uit (0,03) |
| `relClick` | Loslaatklik: 0 = 12 ms, 1 = 0,05 ms | 0 … 1 | 0,2 | lineair | uit (0,03) |
| `leak` | Lekkage (overspraak en spookgeneratoren) | 0 … 1 | 0,3 | lineair | uit (0,04) |
| `touch` | Aanslag: 0 = elke toets even hard, 1 = niveau volgt de velocity | 0 … 1 | 0 | lineair | uit (0,02) |
| `vibRate` | Scannersnelheid (Hz) | 5 … 8,5 | 6,8 | lineair | uit (0,03) |
| `vibAmt` | Diepte van vibrato en chorus (1 = standaard) | 0 … 1,5 | 1 | lineair | aan (0,1) |
| `rotSpd` | Rotary-snelheid: 0 = stop, 0,5 = langzaam, 1 = snel (de motor loopt er geleidelijk naartoe) | 0 … 1 | 0,5 | lineair | uit (0,1) |
| `rotMic` | Micafstand: 0 = dichtbij (diepe modulatie), 1 = ver (meer ruimte) | 0 … 1 | 0,4 | lineair | aan (0,08) |
| `rotSpread` | Stereo-spreiding van de twee microfoons (0 … 162 graden) | 0 … 1 | 0,75 | lineair | aan (0,08) |
| `rotBal` | Balans hoorn (−1) en trommel (+1) | −1 … 1 | 0 | lineair | aan (0,08) |
| `reed` | Alleen Combo: 0 = blokgolf, 1 = smalle puls | 0 … 1 | 0,5 | lineair | aan (0,1) |

Alle 37 getalvelden (inclusief de 20 trekkers, die `on: false` en drift 0,02 hebben) zijn te moduleren (spoor per groep: Upper, Lower, basvoeten, versterker, toetscontact, vibrato, rotary, Combo). De knop blijft de basis; een modulator telt er een uitslag van −1 … 1 × (max − min) bij op (een trekker beweegt dus ±8 stappen, ook tussen de stappen in).

### Keuzes en schakelaars

| Veld | Wat | Waarden | Start |
|---|---|---|---|
| `model` | Klankmodel | `tonewheel`, `combo` | `tonewheel` |
| `vib` | Soort vibrato of chorus | `v1`, `v2`, `v3`, `c1`, `c2`, `c3` | `c3` |
| `vibUp`, `vibLo` | Vibrato of chorus op Upper, op Lower | `true`/`false` | `true`, `false` |
| `perc` | Percussie aan (alleen Tonewheel en Upper) | `true`/`false` | `false` |
| `percHarm` | Harmonische van de percussie | `"2"` (4′, +12) of `"3"` (2⅔′, +19) | `"2"` |
| `percFast` | Snelle of langzame uitklank (−20 dB na 140 of 430 ms) | `true`/`false` | `true` |
| `percSoft` | Zachte percussie (ongeveer −6 dB) | `true`/`false` | `false` |
| `percSingle` | Enkele trigger: alleen de eerste toets van een legato-frase | `true`/`false` | `true` |
| `rotOn` | Rotary aan; `false` is bypass | `true`/`false` | `true` |
| `cf16`, `cf8`, `cf4`, `cf223`, `cf2`, `cfmix` | Combo-voetschakelaars 16′, 8′, 4′, 2⅔′, 2′, IV mixtuur (2′, 1⅓′, 1′, 4/5′) | `true`/`false` | `false`, `true`, `true`, `false`, `false`, `false` |
| `route` | Verdeling van de noten | `split` (splitpunten), `channel` (MIDI-kanaal) | `split` |
| `split`, `bassSplit`, `rotKey` | Splitpunt Upper/Lower (noten eronder spelen Lower), splitpunt basvoeten (noten eronder spelen de basvoeten), toets die de rotary wisselt (−1 = uit) | gehele MIDI-nummers 0 … 127 (`rotKey` −1 … 127); 0 = uit | 0, 0, −1 |

Verdeling: in `split` gaat een noot onder `bassSplit` naar de basvoeten, anders onder `split` naar Lower, anders naar Upper (beide 0 = alles Upper). In `channel` gaat MIDI-kanaal 2 naar Lower, 3 naar de basvoeten en al het andere (ook geen kanaal) naar Upper. `split`, `bassSplit` en `rotKey` zijn bewust niet stuurbaar (`modExclude`).

Wat het apparaat met een state doet (getest met de validator): getallen buiten het bereik worden afgekapt, een tekst, `NaN`, `null` of een ontbrekende waarde geeft de startwaarde, een ongeldige keuze geeft de startwaarde, `setState` met iets anders dan een object geeft alle startwaarden en onbekende velden worden genegeerd. Wijzigingen lopen zacht (de trekkerniveaus in ongeveer 6 ms, volume, drive, toon, hall, rotary-instellingen en riet in ongeveer 30 ms).

### Hoe de noten binnenkomen

Een event op de ingang `notes` heeft `type` `note`, `noteon` of `noteoff` met een `note` (MIDI, 0 … 127), `ch` (1 … 16, optioneel), `vel` (0 … 1; 0 telt als noteoff; zonder `touch` doet velocity niets) en `time`. `dur` (s) is de lengte van een noot; `noteon` of `held: true` blijft klinken tot een `noteoff`. Een `note` zonder `dur` klinkt ook tot een `noteoff` (zoals bij Piano). Een `panic`, `allnotesoff` of het stoppen van de klok zet alles uit. Dezelfde toets opnieuw aanslaan terwijl hij nog klinkt, telt niet als een nieuwe aanslag (geen percussie, geen klik). Een event met `type` `cc` en een `value` van 0 … 1:

| `id` | Wat |
|---|---|
| `rotary` | 0 … 0,25 stop, tot 0,75 langzaam, daarboven snel (te schakelen met een voetschakelaar of een sequencer) |
| `perc`, `vibrato`, `model` | vanaf 0,5 aan (`vibrato` op Upper); `model` vanaf 0,5 Combo |
| elk getalveld hierboven | zet dat veld over zijn bereik (een trekker wordt afgerond op een stap): `up0` … `pd1`, `drive`, `reverb`, `vol` enzovoort |

De noot `rotKey` (als die is ingesteld) klinkt niet maar wisselt de rotary tussen langzaam en snel.

## Gemeten (niet beluisterd)

Alles hieronder is offline gemeten met de echte worklet-code van het apparaat (een testharnas met een nep-`AudioContext` en een nep-`AudioWorkletNode` die berichten rechtstreeks aan de motor geeft, zoals `docs/tools/worklet-harness.mjs`; de meetscripts staan buiten de repo), 48 kHz, en niet beluisterd. Ik kon geen geluid horen.

- **Trekkers en toonklassen:** elke trekker apart op noot 48 (C3, 130,81 Hz): de gemeten frequentie wijkt 0,01 … 0,05 cent af van de generator; het gelijkzwevende interval is 1,1 … 1,9 cent van de zuivere harmonische af, behalve 1⅗′ (14,0 cent hoger dan de zuivere vijfde harmonische). De afwijkingen per toonklasse van de generatoren zijn klein (−1,07 … +0,36 cent, gemodelleerd met tandwielverhoudingen van 19 tot 86 tanden, niet van een bepaald orgel overgenomen). Terugvouwen: noot 96 met 1′ (pitch 132) klinkt op pitch 108 (4183,4 Hz), noot 30 met 16′ (pitch 18) op pitch 30 (46,25 Hz).
- **Trekkerstappen:** 8 … 1 geven −2,99 / −5,98 / −8,98 / −11,98 / −14,97 / −17,97 / −20,97 dB.
- **Percussie:** −20 dB na ongeveer 140 ms (snel, 2e), 130 ms (snel, 3e), 430 ms (langzaam, 2e) en 530 ms (langzaam, 3e); zacht is 5,4 … 7,4 dB zachter (ontwerp: 6,9 dB). Enkele trigger: de tweede toets van een legato-frase heeft 13 dB minder 2e harmonische dan bij uitgeschakelde enkele trigger. Trekker 1′ bij percussie: −146 dB (gedempt).
- **Vibrato:** scanner 6,81 Hz; toonhoogte ±5,7 cent (V1), ±11,3 (V2), ±18,4 (V3); chorus ±2,8 cent (C1) en ±9,2 (C3), met de helft droog.
- **Rotary:** AM-snelheid van de hoorn 6,84 Hz snel (doel 6,8) en van de trommel 5,86 Hz (doel 5,9); AM-diepte 18 dB (hoorn) en 10 dB (trommel) bij `rotMic` 0,4; Doppler hoorn ±53 cent snel en ±6 cent langzaam, trommel ±19 … 21 cent snel en ±2,4 cent langzaam. Aanloop tot 90 %: hoorn 1,6 s omhoog en 3,7 s omlaag, trommel 5,1 s omhoog en 8,8 s omlaag. Rotorgeluid: −126 dB zonder toerenwisseling, −43 dB (rms) en −27 dB (piek) tijdens een wissel van langzaam naar snel. Via de toets `rotKey`, via cc `rotary` en via een modulator op `rotSpd` zijn alle drie getest.
- **Toetscontact:** de negen contacten sluiten bij spreiding 1 op 0,14 / 0,53 / 1,00 / 1,30 / 1,78 / 2,15 / 2,42 / 2,94 / 3,20 ms; bij spreiding 0 allemaal tegelijk. De klik boven 6 kHz ten opzichte van de toonpiek (registratie 888000000): −57 dB (`click` 0,25), −47 (0,45), −35 (0,7), −18 (1); bij één trekker (008000000) −13 dB bij `click` 1. Loslaatklik bij `relClick` 0,2: −60 dB; bij 0,6 −43 dB; bij 1 −23 dB. Over de 88 tunes: mediaan −33 dB aanzet en −38 dB loslaten (Tonewheel, referentieakkoord); de Combo-tunes meten hoger omdat een blokgolf zelf hoge delen heeft.
- **Hall:** T60 ongeveer 1,05 s; natte rms ten opzichte van droge rms bij een aangehouden akkoord: −6,1 dB (`reverb` 1) en −20,1 dB (0,2).
- **Aliasing van de voorversterker:** een sinus van 0,5 door de verzadiging met winst 12, aliasenergie ten opzichte van het totaal: bij 2093 Hz naïeve tanh −33,6 dB, ADAA −39,8 dB, 2× + ADAA −51,9 dB; bij 3951 Hz −19,9 / −26,9 / −40,1 dB. 4× geeft niets extra. Vertraging van de oversampling: 11 samples (0,23 ms) bij 2×, 16 samples (0,33 ms) bij 4×.
- **Combo:** blokgolven (derde harmonische −9,0 … −10,2 dB, geen even harmonischen) met PolyBLEP; aliasenergie ten opzichte van het totaal: −48 dB (131 Hz), −42 dB (523 Hz), −36 dB (2093 Hz) en −32 dB (4186 Hz, 2′ op een hoge noot); met `reed` 1 (puls) −34 dB bij 2093 Hz. Een blokgolf heeft zelf veel hoge delen: boven 6 kHz meet een Combo-tune −21 … −35 dBFS stationair, dus de "klik boven 6 kHz" is bij Combo geen zuivere klikmaat (aanzet en loslaten liggen 0 … 4 dB bij het stationaire niveau).
- **Echte browser:** `python3 docs/tools/build-tune-index.py --only drawbarorgan` rendert alle 88 tunes met de echte worklet in headless Chromium (OfflineAudioContext): 0 niet-eindige samples, geen tune overgeslagen. In de host (headless Chromium met een echte `AudioContext`, kabel naar Speakers) draait de worklet: de rotor haalt 0,8 Hz (langzaam) en na 3,5 s 6,8 Hz (hoorn) en 4,8 Hz (trommel, nog onderweg), zonder paginafouten.
- **Niveau:** één noot tegenover twaalf noten op registratie 888 000 000 (drive 0,25, vol 0,7): −15,0 / −10,7 dBFS rms (verschil 4,3 dB; zonder akkoordcompensatie zou het ongeveer 10 dB zijn). Drive verandert het niveau met hoogstens ongeveer 3 dB (de verzadiging wordt gecompenseerd). Een akkoord van vijf noten op de standaardstate: −17,4 dBFS rms.
- **Rekentijd** (Node, blokken van 128 samples, budget 2,67 ms): 888000000 met één noot en rotary bypass gemiddeld 2,6 %, p99 3,6 %, max 13,7 %; stil met alles aan 5,6 % / 10,7 % / 21,3 %; 12 noten op 888888888 met rotary snel, vibrato, hall, lekkage en percussie 6,1 % / 9,0 % / 16,2 %; 61 toetsen op Upper plus 61 op Lower plus 25 basvoeten tegelijk 13,9 % / 20,8 % / 27,8 %; Combo met 12 noten 6,9 % / 10,7 % / 19,5 %. In een echte browser niet gemeten (wel: de echte worklet draait in Chromium en de rotor haalt 0,8 Hz langzaam en 6,8 Hz snel).
- **NaN en Infinity:** 150 reeksen met willekeurige en extreme instellingen (alle knoppen op hun minimum of maximum, modulatie ±1 en NaN, alle noten 0 … 127, korte en lange noten, kanaalstand en splitpunten, velocity NaN of Infinity, tijden NaN, Infinity en −1e12, wisselen van model en rotary tijdens het spelen) gaven 126,7 miljoen samples met 0 niet-eindige samples en een piek van hoogstens 1,000. Berichten met NaN, Infinity en 1e30 aan de motor: 0 niet-eindige samples. Met bewust beschadigde interne toestanden (filters, vertragingslijn, rotor, generator) herstelt de bewaker de uitvoer binnen een blok. Na een `panic` en twee seconden klinkt er in 0 van de 150 reeksen nog iets boven 0,2 (de lekkage zelf is bedoeld zacht en klinkt ook zonder toetsen, zie boven).

### Wat een bewaker doet

De motor accepteert alleen eindige parameters (afgekapt op hun bereik) en eindige gebeurtenissen; een nootnummer, velocity, tijd of duur die niet eindig is, wordt genegeerd of op de standaard gezet. Per blok worden de toestanden (gelijkspanningsfilter, ADAA-geheugen, plankfilters, crossover, veren, vertragingslijnen, rotor en generatoren) op eindigheid gecontroleerd en teruggezet; de invoer van de voorversterker wordt begrensd, de uitgang heeft een zachte begrenzer en een uitgangssample dat niet eindig is wordt 0. De bewaker draait in de worklet zelf (geen timer, geen extra `AudioNode`s).

## Een tune

Een pack heet `naam.patchkamer-tunes.json` en staat in `../../../tunes/`. Het formaat en de licentie (`CC0-1.0` voor alles in `tunes/`) staan in `../../../tunes/AGENTS.md`. Voor dit apparaat is `device` altijd `nl.patchkamer.drawbarorgan` en elke tune is `kind: "set"` met een volledige `state` als hierboven. Zet geen merknamen van bestaande apparatuur in naam of omschrijving, noem geen artiesten of bekende titels en verzin geen persoon bij `author`.

Het meegeleverde pack `drawbar-organ-styles.patchkamer-tunes.json` heeft 88 tunes in tien mappen: Jazz (10), Soul (10), Funk (10), Gospel (8), Blues (8), Ballad (8), Percussive (8), Rotary Variations (8), Combo (10) en Bass Split (8). Het niveau van elke tune is gelijkgetrokken: het rms-niveau van een referentieakkoord (vijf noten 50, 57, 62, 65, 69, velocity 0,8, 1,6 s, gemeten van 0,55 tot 1,5 s; bij een tune met splitpunten acht noten 36, 43, 52, 55, 59, 64, 67, 71, bij kanaalstand dezelfde verdeeld over de kanalen) ligt op −18,0 dBFS (alle 88 tussen −18,3 en −17,8), `vol` ligt tussen 0,38 en 0,98, en een worstcase-akkoord (13 noten over alle zones, velocity 1) komt niet boven 0,914. Meet je nieuwe tunes op dezelfde manier en pas `vol` aan (het niveau volgt `vol²`).

### Wat werkt goed

| Soort | Instelling |
|---|---|
| Jazz | `888000000`, percussie 3e harmonische snel normaal, chorus C3, rotary langzaam of snel, `drive` 0,3 … 0,5; of `808800000` zonder percussie en `reverb` 0,3 |
| Soul | `808000000`, `808800000`, `888400000`, chorus C1 … C3, rotary langzaam, `reverb` 0,25 … 0,4, `drive` 0,15 … 0,4 |
| Funk | `008800000` of `888000000` met percussie 3e (of 2e zacht), `click` 0,6 … 0,75, `relClick` 0,3 … 0,45, rotary snel of bypass, `reverb` 0,05 … 0,15 |
| Gospel | `888888888` of `888880000`, chorus C3, rotary langzaam of snel, `drive` 0,5 … 0,6, `reverb` 0,2 … 0,4 |
| Blues | `drive` 0,6 … 0,95, `leak` 0,4 … 0,7, `click` 0,5 … 0,8, `treble` −0,3 … 0 |
| Ballad | `006400000`, `008800000`, `808000000`, `drive` 0,05 … 0,15, `reverb` 0,4 … 0,5, rotary langzaam, `click` 0,15 … 0,25 |
| Combo | `model` `combo` met `cf8` en `cf4` (en `cf2` of `cfmix`), `reed` 0,5 … 1 voor een scherpere klank, `reed` 0 … 0,25 voor een fluit; geen percussie |
| Bass Split | `bassSplit` 45 … 52, `split` 57 … 62, basvoeten `80` of `88`, Lower `008000000` of `008800000`, `vibLo` aan voor een bredere linkerhand; of `route` `channel` en kanalen 1, 2 en 3 |

### Wat een tune niet doet

- Maak geen stille tune: `vol` 0 of alle trekkers 0 geeft (bijna) niets te horen. Een tune met `split` of `bassSplit` heeft ook noten in die zones nodig; met beide op 0 klinkt alleen Upper.
- Zet percussie alleen in een Tonewheel-tune (bij Combo doet `perc` niets); de 1′-trekker van Upper klinkt dan niet.
- Verwacht van `vel` niets zonder `touch`; zet `touch` niet hoog in een tune voor een sequencer waarvan de velocity vast is.
- Zet geen routing of toetsen in de state, behalve de bewuste velden `route`, `split`, `bassSplit` en `rotKey`.
- Verzin geen velden.

## Skins

Alle knoppen, trekkers, keuzelijsten en schakelaars zijn via `host.ui.adopt` herkenbaar voor skins: `id` is de state-sleutel (trekkers `up0` … `pd1`), `role` is `param` (trekkers en knoppen), `select` (keuzelijsten) of `toggle` (schakelaars en de rotary- en modelknoppen met id `rot.<naam>` en `model.<naam>`), `group` is `upper`, `lower`, `pedal`, `model`, `combo`, `percussion`, `vibrato`, `rotary`, `contact`, `amp` of `keyboard`. Het klavier-gedeelte heeft geen toetsen; de trekkers zijn `<input type="range">` met `writing-mode: vertical-lr`, dus de stand 0 staat bovenaan. Wijzig je de opbouw, controleer dan de skins.

## Controleren

- Draai vanuit de root van de repo: `node contract/validate-instrument.mjs devices/synths/DrawbarOrgan/drawbar-organ.patchkamer-device.js` (en met `--lang en`). Dat moet `OK` geven, zonder `let op` (nu: 37 stuurbare parameters in 8 sporen, 1 worklet, 61 regelaars met id).
- Je kunt niet horen hoe een tune klinkt. Heb je een browser, laad dan de host (`../../../patchkamer/AGENTS.md`) en kies de tune. Heb je geen browser, schrijf dan in je oplevering dat de tune **niet beluisterd** is. Een apparaat zonder kabel naar Speakers of een mixer laat zijn worklet niet draaien (Chromium verwerkt een knoop zonder verbinding naar de uitgang niet): leg een kabel voor je de rotor of de uitgang test.
- Alle tekst in het apparaat staat in het woordenboek `EN` bovenin het bestand (Nederlandse bron, Engels via `host.lang`). Een nieuwe tekst krijgt altijd nl én en.
- De merkencheck uit `../../../CLAUDE.md` (of de root `AGENTS.md`) moet leeg zijn: let op de naam van de worklet-klasse en van je tunes.

## Wat je niet doet

- Verander nooit de `id`, de `kind`, de poort-id's of de namen van state-velden.
- Pas het apparaat niet aan om een tune te laten kloppen.
- Commit of push niet, tenzij de opdracht dat vraagt.

## Documentatie en songs

Dit zijn de plaatsen waar je terechtkunt voor documentatie en voor het componeren van songs met dit apparaat. Songs zijn CC-BY-4.0, tunes en presets CC0-1.0, het apparaat AGPL-3.0-or-later.

- Handleiding van Drawbar Organ: [NL](../../../docs/synths/USER-MANUAL_NL.md#drawbar-organ) · [EN](../../../docs/synths/USER-MANUAL_EN.md#drawbar-organ).
- Overzicht van de soort: [README](../README.md); handleiding van de hele soort: [NL](../../../docs/synths/USER-MANUAL_NL.md) · [EN](../../../docs/synths/USER-MANUAL_EN.md).
- Tunes (klanken, `kind: set`): [drawbar-organ-styles.patchkamer-tunes.json](../../../tunes/drawbar-organ-styles.patchkamer-tunes.json). Kies een tune als beginpunt voor de `state` van dit apparaat in de song; velden die de tune niet noemt krijgen hun standaard. Hoe tunes zijn opgebouwd: [tunes/AGENTS.md](../../../tunes/AGENTS.md).
- Overzicht van alle apparaten en hun signaalketens: [devices/AGENTS.md](../../../devices/AGENTS.md). Een song componeren: [songs/AGENTS.md](../../../songs/AGENTS.md).
- Route voor agents: [soort Synths](../AGENTS.md) → [devices/AGENTS.md](../../AGENTS.md) → [root AGENTS.md](../../../AGENTS.md). Contract: [NL](../../../contract/PATCHKAMER-CONTRACT_NL.md) · [EN](../../../contract/PATCHKAMER-CONTRACT_EN.md). Hoe tunes van dit apparaat zijn opgebouwd: [tunes/AGENTS.md](../../../tunes/AGENTS.md). <!-- agents-tree -->
- Rol in een song: toetsen en akkoorden (organ chords, riffs, leads) voor funk, soul, jazz, gospel en blues, polyfoon zonder stemmenlimiet en zonder eigen sequencer. Noten op `notes` (Upper, of Lower en basvoeten via splitpunten of MIDI-kanaal 2 en 3), audio uit `out` (stereo). Stuur hem met een Chord Sequencer, een Step Sequencer of Keys; zet de rotary met `rotSpd` of een cc `rotary` op een andere snelheid midden in een song (de trommel doet er ongeveer 5 s over).
