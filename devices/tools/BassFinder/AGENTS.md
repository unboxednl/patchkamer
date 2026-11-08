# AGENTS.md: Bass Finder

Dit bestand is voor AI-agents die dit apparaat onderhouden of een zusterapparaat erop baseren. Het is niet geschreven voor mensen. Het hoort bij `../../../AGENTS.md` (algemeen); lees die eerst. Hier staat wat alleen voor Bass Finder geldt.

## Wat Bass Finder is

Een gereedschap dat een **monofone baslijn** (bas, sub of synthbas; geen akkoorden, geen meerstemmige muziek) omzet in noten: toonhoogte, start, lengte en velocity. Het maakt zelf geen geluid. De bron is een audiobestand (knop **Audiobestand laden…**, of `loadAudio(files, info)` met `info = { name, bpm, bars }`, zoals de tab Samples dat doet) of een opname van enkele maten of seconden uit de audio-ingang `in` (bijvoorbeeld van Audio Capture). Het resultaat is een clip die je:

- kopieert met de knop Kopieer van de host (`clipInfo`/`getClip`, formaat `patchkamer-clip`, `kind: "notes"`, 12 tikken per zestiende, `source.scheme: "gm"`) en plakt in een notenspoor van Step Sequencer, Pattern Tracker, Chord Sequencer, Clip Arranger enzovoort;
- met de klok als noten naar een synth stuurt (eventuitgang `notes`: `{ type: 'note', note, vel, time, dur }`), bijvoorbeeld naar Low Bass of Sub Line;
- bewaart als JSON-bestand (knop **Clip bewaren**).

| | |
|---|---|
| Bestand | `bass-finder.patchkamer-device.js` (in deze map) |
| `id` | `nl.patchkamer.bass-finder`. Verander die nooit: daaraan hangen presets en songs van gebruikers |
| Naam | `Bass Finder` in alle talen; alleen poortnamen hebben een Nederlandse variant (`i18n`); alle tekst staat in `TXT` (nl en en) |
| Soort | `utility` (categorie `tool`): dit apparaat krijgt dus **presets** (geen tunes). Er is nog geen presetpack |
| Poorten | audio-ingang `in` (In), audio-uitgang `thru` (Door / Through: de ingang ongewijzigd), eventuitgang `notes` (Noten / Notes); geen sturing |
| Contract | v1.23 (apparaatversie 1.20.0); geen contractwijziging nodig |
| Licentie apparaat | AGPL-3.0-or-later |
| Icoon | `icon.svg` in deze map (lijnwerk met `currentColor`, zoals de andere tools; gevalideerd met `node skins/contract/validate-skin.mjs`) |

## Opbouw van het bestand

1. **BASS-ANALYSIS** (tussen `// ==== BASS-ANALYSIS BEGIN` en `END`, bovenaan): `const BA = (() => {...})()`, zuivere functies op `Float32Array`, zonder browser-API's; ook als `export const engine` beschikbaar voor tests (`docs/tools/eval-bass-finder.py`, `docs/tools/check-bass-finder.mjs`). Inhoud: `prepare`, `decimate`, `envelope`, `envOnsets`, `pitchPlan` (kandidaten per frame, in stukken te vullen met `run(a, b)`), `track` (Viterbi), `detectNotes`, `detect`, `estimateTempo`, `fitGrid`, `snap`, `quantize`, `analyse` (alles in één keer: `BA.analyse(kanalen, sr, opties)`) en `finish(pre, opties)` (alles na de zware toonhoogtestap).
2. Het apparaat zelf: UI (shadow DOM, pianorol op een canvas, getekend met `host.frame`), laden van een bestand, opname (worklet `nl-patchkamer-bassfinder-1-20-0`, kanalen samengeteld, blokken van 4096 frames), bewerken, sturen met de klok, klembord.

## De analyse

1. `prepare`: kanalen samengeteld, niet-eindige waarden (NaN, ±Infinity) en waarden boven 1e6 worden 0, trage gelijkspanningsfilter (15 Hz), begrenzing op 8 keer het 99,5e percentiel (een paar absurde pieken beslissen het niveau niet), genormaliseerd. Stilte (piek < 1e-5) of korter dan 0,1 s geeft `error: 'silent'`; hoogstens 90 s (`truncated`).
2. `decimate`: laagdoorlaat (gevensterde sinc) en terugbrengen tot ongeveer 5 kHz (8, 22,05, 44,1, 48 en 96 kHz getest).
3. `pitchPlan`: per 5 ms een venster van 40 ms met het genormaliseerde verschil van het signaal met zichzelf (YIN: cumulatief gemiddelde genormaliseerd, parabolische verfijning) voor perioden van 27 tot 500 Hz; per frame hoogstens vijf kandidaten (lokale minima onder 0,7), het niveau van het frame en een gewicht (een venster waarin het begin of het einde van een klank valt, zegt weinig).
4. `track`: een **Viterbi-pad** over de kandidaten en "stemloos". De kosten per frame zijn 3 × de afwijking van de kandidaat (× het gewicht); een overgang tussen kandidaten kost 4 × het aantal octaven (hoogstens 6), van of naar stemloos 0,35. Daarom volgt de toonhoogte een lijn met continuïteit (octaaffouten, losse uitschieters en ruis in de uitklinkende staart worden gladgestreken), en komt een echte octaafsprong tussen twee noten via een stemloos frame. Een frame onder `ref × 10^(-(20+24 × gevoeligheid)/20)` (ref = 95e percentiel van het framenivieau) is stil.
5. `detectNotes`: stemhebbende stukken (gaten van hoogstens twee frames met een gelijke toonhoogte worden overbrugd), per stuk gesneden op **toonhoogtesprongen met hysterese** (een afwijking van meer dan 0,7 halve toon van de lopende toonhoogte die minstens drie frames stabiel wordt; glijdende overgangen blijven één overgang en de nieuwe noot begint bij het vertrek) en op **aanzetten in de omhullende** (RMS over 30 ms, een stijging van minstens 6 dB binnen 30 ms). Spookstukjes van een half bedekt venster (een kort stuk een, twee octaven of een twaalfde boven het einde van de vorige noot, of vlak voor de echte start) worden verwijderd; een stuk waarvan het gemiddelde verschil (conf) te groot is (geen periodiciteit: de staart van een galm, ruis) valt af. De start wordt verfijnd met de aanzet van de omhullende, het einde is het einde van het stemhebbende stuk, de volgende noot, of het moment waarop de omhullende 14 dB onder zijn piek komt. Stille spoken (meer dan 18 + 30 × gevoeligheid dB onder de luide noten) vallen af, stukken die op dezelfde toonhoogte aansluiten zonder dip in de omhullende worden samengevoegd. **Stemming**: de cirkelgemiddelde van het fractionele deel van de toonhoogtes (gewogen met de lengte) wordt gebruikt als de noten consistent naast A440 liggen (R > 0,6 en minstens 0,05 halve toon); de toonhoogte wordt dan afgerond op halve tonen. De velocity komt uit de piek van de omhullende ten opzichte van de luide noten (0,9 × amplitude, 0,15 tot 1).
6. `quantize`: tempo (`bpm` opgegeven; anders uit `bars` en de lengte; anders geschat uit de aanzetten met een kam op zestiende, achtste, tel, 2 tellen en maat), per raster de beste fase (en bij 1/16 de swing, 0 tot 0,5, alleen als hij duidelijk beter past dan recht), raster **`8`**, **`16`**, **`16t`** (triool 1/16), of **`off`** (op een tik, 1/12 zestiende, nauwkeurig); bij `auto` wint het grofste raster dat past (met een lichte straf voor fijnere). Start en einde gaan apart op het raster, de lengte is minstens een rastereenheid; de noten zijn monofoon (een noot eindigt waar de volgende begint, een gat korter dan een halve eenheid wordt dichtgetrokken). Tikken zijn onbewogen: de swing staat apart in de clip (`swing`); een ontvanger zonder swing speelt recht. `align`: `first` (de eerste noot op een maat), `start` (het begin van de audio is de eerste tel), `smart` (`start` bij een loop met bekende maten, anders `first`). Met `bars` bekend (opname in maten, of een sample met maten) wordt de clip een loop van die lengte (noten voorbij het einde vouwen terug); anders is de lengte het aantal maten dat de noten beslaan (1 tot 64).

## De state

`state` is wat `getState()` teruggeeft. `getPreset()` laat `clip`, `name` en `send` weg (instellingen, geen noten en geen audio); `setPreset` laat die staan.

| Veld | Wat | Waarden | Start |
|---|---|---|---|
| `bpm` | Tempo; 0 = automatisch (uit het sample, de lengte of de aanzetten) | 0 of 40 … 300 | 0 |
| `bars` | Aantal maten; 0 = automatisch | 0, 1, 2, 3, 4, 6, 8, 12, 16 | 0 |
| `grid` | Raster | `auto`, `8`, `16`, `16t`, `off` | `auto` |
| `swing` | Swing; -1 = automatisch | -1 of 0 … 0,6 | -1 |
| `align` | Eerste tel | `smart`, `first`, `start` | `smart` |
| `sens` | Gevoeligheid (drempels voor stil, spoken en periodiciteit) | 0 … 1 | 0,5 |
| `rec` | Opnameduur | `b2`, `b4`, `b8` (maten, volgens `bpm` of de studioklok; tempo en maten zijn dan bekend), `s5`, `s10`, `s20` (seconden) | `b4` |
| `send` | Noten met de klok naar de eventuitgang sturen | boolean | `false` |
| `level` | Velocity-factor bij het sturen | 0,1 … 1 | 0,9 |
| `clip` | De noten: `{ name, bpm, length (tikken, 12 per zestiende), grid, swing, notes: [[tik, MIDI-noot, lengte in tikken, velocity]], how, bars, tuning }` | gezuiverd bij `setState` (hoogstens 4096 noten, één noot per starttik) | `null` |

`setState` volgt §13: onbekende velden worden genegeerd, ongeldige waarden krijgen de standaard, een kapotte `clip` wordt `null`. De audio zelf zit nooit in de state.

## Bewerken

Pianorol op een canvas; klik kiest een noot, slepen verplaatst (tijd op het raster, toonhoogte per halve toon), de rechterrand verandert de lengte, een dubbelklik op een lege plek voegt een noot toe. Knoppen en toetsen (Delete, pijlen, Shift = octaaf, `[` en `]`) doen hetzelfde: wissen, eerder, later, halve toon omhoog of omlaag, octaaf omhoog of omlaag (`8va`, `8vb`), korter, langer. Een noot op de starttik van een andere vervangt die. De dunne omtrekken zijn de gevonden noten van vóór het kwantiseren (`result.raw`); ze verdwijnen niet bij het bewerken. **Opnieuw analyseren** (en elke wijziging van tempo, maten, raster, swing of eerste tel) maakt de bewerkingen ongedaan.

## Klembord en sturen

`clipInfo()` geeft `copy: ['notes']`, `paste: []`, `poly: 1`, `scheme: 'gm'` zodra er noten zijn (anders `null`); `getClip()` geeft `kind: "notes"`, `length` in tikken, `grid` 16 of 32 (hint), `swing` hoogstens 0,5 en `notes` (`t`, `n`, `len`, `vel`); `setClip` geeft `{ ok: false, reason }` (er valt niets te plakken). Getest in de host (headless Chromium): Kopieer in de kaart zet de clip op het klembord en Plakken in een Step Sequencer geeft hetzelfde patroon (16 noten, 32 stappen). **Sturen** (`onStep`): noten op de stap waarin hun tik valt, met `time` binnen de stap, `dur` = lengte × 0,97 en `vel` × `level`; de swing van de clip wordt zelf gespeeld als de studio geen swing heeft.

## Opnemen uit de ingang

AudioWorklet `nl-patchkamer-bassfinder-1-20-0` (kanalen samengeteld, blokken van 4096 frames, alleen tijdens het opnemen). Wijzig je de worklet-code, verhoog dan het versienummer in de naam. De opname is hoogstens 90 s. Bij `b2`, `b4`, `b8` zijn tempo (`state.bpm` of het studiotempo) en maten bekend: de analyse gebruikt ze als opgegeven en maakt een loop. Een opname begint willekeurig in de maat: laat `align` op `smart`/`first` staan en verschuif zo nodig met ◀/▶ (een zestiende). Niet getest in een echte browser met een echte ingang (alleen het laden van bestanden).

## Meetresultaten (gemeten, niet beluisterd)

Methode (`docs/tools/eval-bass-finder.py`, `--split test --set bass`): willekeurige baslijnen van twee maten (tempo 80 tot 150, noten E0 tot C3 met octaafsprongen, lengtes van een tot vier stappen, velocity 0,55 tot 1) zijn met de echte apparaatcode (OfflineAudioContext, tunes uit de packs) gerenderd op Basic Mono, Ladder Mono, Low Bass, Sub Line, Acid Baselines, Acid Stepper en Cross Mod Mono. Afgesteld is op de ene helft van de tunes (`--split dev`, op naam), gemeten op de andere (`--split test`): 55 tunes met "bass" of "sub" in de naam (de bedoelde toepassing), twee lijnen per tune en situatie, 1098 lijnen en 13656 noten in totaal; tunes met "chord" in de naam zijn weggelaten (een akkoord is geen baslijn). De ware toonhoogte is de gespeelde noot plus een verschuiving die per tune met twee proefnoten wordt bepaald (de laagste spectraallijn die minstens 20 % van de sterkste is: sommige tunes hebben een transpositie of een sub-oscillator; de uitkomst hangt dus van die afspraak af). Een noot telt als de MIDI-toonhoogte gelijk is (afgerond, dus ±50 cent) en de start binnen 50 ms ligt (precisie, recall en F1 per noot). Octaaffout: een gemiste noot waarvan de start klopt en de toonhoogte een of twee octaven ernaast ligt, in procenten van de ware noten. Tik-F1: met bekend tempo, raster 1/16 en `first`, dezelfde stap (ten opzichte van de eerste noot), dezelfde toonhoogte en de lengte binnen een stap.

| Situatie | lijnen | noten | F1 | precisie | recall | octaaffout | start (mediaan, ms) | lengte (mediaan, ms) | tik-F1 | F1 elk octaaf |
|---|---|---|---|---|---|---|---|---|---|---|
| schoon | 110 | 1380 | 0,948 | 0,954 | 0,941 | 0,0 % | 10 | 34 | 0,904 | 0,948 |
| zacht (-30 dB) | 110 | 1342 | 0,945 | 0,948 | 0,942 | 0,3 % | 10 | 34 | 0,897 | 0,948 |
| ruis (-12 dB, ruis -45 dBFS) | 110 | 1380 | 0,938 | 0,931 | 0,945 | 0,5 % | 10 | 32 | 0,909 | 0,943 |
| laagdoorlaat 500 Hz | 110 | 1388 | 0,945 | 0,949 | 0,942 | 0,1 % | 10 | 33 | 0,910 | 0,947 |
| mono | 110 | 1349 | 0,949 | 0,952 | 0,945 | 0,2 % | 10 | 34 | 0,912 | 0,951 |
| door Room (Small Room, Warm Hall of Bright Plate) | 110 | 1362 | 0,795 | 0,718 | 0,891 | 3,5 % | 10 | 35 | 0,775 | 0,826 |
| door Chorus (Subtle Double, Classic Chorus of Wide Pad) | 110 | 1382 | 0,923 | 0,928 | 0,919 | 1,1 % | 10 | 36 | 0,870 | 0,934 |
| staccato (gate 40 %) | 110 | 1391 | 0,961 | 0,975 | 0,948 | 0,3 % | 9 | 39 | 0,776 | 0,964 |
| legato (gate 100 %) | 110 | 1346 | 0,918 | 0,952 | 0,886 | 0,1 % | 10 | 30 | 0,836 | 0,920 |
| glide (60 ms, overlappende noten) | 108 | 1336 | 0,886 | 0,922 | 0,852 | 0,0 % | 10 | 35 | 0,787 | 0,886 |
| alles | 1098 | 13656 | 0,920 | 0,918 | 0,921 | 0,6 % | 10 | 35 | 0,857 | 0,926 |

Per apparaat (alles): Acid Baselines 0,954, Ladder Mono 0,950, Acid Stepper 0,942, Basic Mono 0,938, Sub Line 0,932, Low Bass 0,896, Cross Mod Mono 0,882. Zwakste tunes: Cross Mod Mono "Growl Bass" 0,56 (een grommende klank met een frequentiemodulatie die bijna geen periodiciteit heeft: de toonhoogte wordt vaak een andere noot), Low Bass "Gliding Sub", "Pure Sub", "Warm Sub Layer" 0,84 tot 0,85 (de lengte: lange uitklinking, zie onder). De lengte is de lengte van het geluid, niet van de gate: een tune met een lange release geeft een mediane lengtefout van 100 tot 170 ms (Low Bass 101 ms), de meeste synths 20 tot 45 ms. Tempo en raster zijn met de studioklok niet getest als "blind"; de tik-F1 hierboven gaat uit van het opgegeven tempo.

**Alle tunes van deze synths** (`--set all`, ook pads, leads, drones, bellen en akkoordachtige klanken; 192 tunes, 1318 lijnen, 16486 noten, zes situaties): F1 0,81 (schoon 0,83, staccato 0,88, legato 0,81, glide 0,78, Room 0,73, Chorus 0,83, ruis 0,83); octaaffout 6,4 % (F1 als het octaaf niet telt 0,87). De octaaffouten komen van klanken met een sub-oscillator of een zwakke grondtoon, waar de grondtoon een afspraak is, en van klanken met twee oscillators op een kwint of octaaf (die klinken als een eigen, lagere toonhoogte).

Andere bemonsteringsfrequenties (de synths zelf gerenderd op die frequentie; bas-set, test, 55 lijnen per situatie; schoon / ruis / staccato; F1): 8 kHz 0,945 / 0,926 / 0,970 (de start ligt dan mediaan 22 ms ernaast), 22,05 kHz 0,938 / 0,936 / 0,966 (12 ms), 48 kHz 0,935 / 0,953 / 0,976 (10 ms), 96 kHz 0,947 / 0,946 / 0,969 (8 ms); 44,1 kHz staat in de tabel. De analyse brengt het geluid terug tot ongeveer 5 kHz, dus de toonhoogte hangt er nauwelijks van af.

Robuustheid (`node docs/tools/check-bass-finder.mjs`, 861 controles): stilte, vrijwel stilte (1e-7), gelijkspanning, witte ruis, te korte invoer (50 ms, één sample, leeg), clipping (×30, met gelijkspanning), NaN en ±Infinity verspreid door de invoer, alles NaN of Infinity, een piek van 1e9, een sinus buiten het bereik (10 kHz, 20 Hz, 700 Hz), kanalen van verschillende lengte, `undefined` in de kanalen, `null`, bemonsteringsfrequentie 0, NaN, 1 en 1e9, 120 s invoer (wordt 90 s), opties buiten het bereik (`bpm`, `bars`, `grid`, `swing`, `sens`, `align`, `tuning`), en synthetische lijnen op 8, 11,025, 22,05, 44,1, 48 en 96 kHz (7 tot 8 van 8 noten): geen enkele throw, geen enkele niet-eindige of buiten het bereik liggende uitvoer. Tijd: 4 s geluid ongeveer 150 ms (hoogstens 470 ms op een drukke machine), 90 s ongeveer 0,6 s (in de pagina in stukken van 800 frames met `setTimeout` ertussen, zodat de pagina niet vastloopt).

**Niet getest:** echte opnames (een mens op een echte basgitaar, een microfoon, een sample van een plaat, een DI-signaal): alle meetlijnen komen uit de synths van Patchkamer zelf, dus het domein klopt te mooi (geen aanslagruis, geen speelfouten, geen kamerruis, geen brom). Niets is beluisterd. Echte invoerapparaten en een echte AudioWorklet-opname uit de ingang in de browser zijn niet getest (alleen het laden van bestanden en het klembord, in headless Chromium). Meerstemmige muziek, akkoorden, drums en zang erdoor zijn niet getest en zullen slecht gaan (splits eerst met een stemsplitser). Zeer langzame aanzetten (een pad-achtige bas) worden te laat gehoord (de start ligt dan meer dan 50 ms na de ware start).

## Aanbevelingen voor de host (niet doorgevoerd, de host is hier niet gewijzigd)

- De tab Samples heeft knoppen `→ apparaat` voor een vaste lijst (`TARGETS` in `patchkamer/js/samples.js`: Loop Slicer, Samplebank, Drum Listener, Stem Splitter). `['nl.patchkamer.bass-finder', 'Bass Finder']` erbij laat een sample met een baslijn direct in Bass Finder laden (het apparaat heeft `loadAudio` al). Idem voor Tune Finder, dat er ook niet in staat.
- Na het splitsen van een nummer kan de Stem Splitter de **bas**stem aan Bass Finder geven zoals hij de drums aan de Drum Listener geeft (`patchkamer/js/stems.js`, zoek op `loadAudio`).

## Wat je niet moet doen

- Geen tunes maken (het is een `utility`), en het `id` niet wijzigen.
- Geen netwerkverkeer in dit apparaat: de analyse draait lokaal.
- De audio niet in de state of in een preset zetten.
- Het analysegedeelte niet wijzigen zonder opnieuw te meten (`eval-bass-finder.py`, op de teststeekproef; stel drempels alleen af op `--split dev`) en `check-bass-finder.mjs` te draaien; meld de getallen.
- Geen modelnamen of merknamen in naam, teksten of commentaar.

## Documentatie en songs

Hier vind je de omgeving van dit apparaat: de soort, de overzichten en de handleiding voor mensen.

- Route voor agents: [soort Tools](../AGENTS.md) → [devices/AGENTS.md](../../AGENTS.md) → [root AGENTS.md](../../../AGENTS.md). Contract: [NL](../../../contract/PATCHKAMER-CONTRACT_NL.md) · [EN](../../../contract/PATCHKAMER-CONTRACT_EN.md). Hoe presets van dit apparaat zijn opgebouwd: [presets/AGENTS.md](../../../presets/AGENTS.md). <!-- agents-tree -->
- Handleiding van de soort (voor mensen): [NL](../../../docs/tools/USER-MANUAL_NL.md) · [EN](../../../docs/tools/USER-MANUAL_EN.md); overzicht: [README](../README.md).
- Een song componeren met dit apparaat: [songs/AGENTS.md](../../../songs/AGENTS.md).
