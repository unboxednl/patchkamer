# AGENTS.md: Tune Finder

Dit bestand is voor AI-agents die dit apparaat onderhouden of een zusterapparaat (bijvoorbeeld een Bass Finder) erop baseren. Het is niet geschreven voor mensen. Het hoort bij `../../../AGENTS.md` (algemeen); lees die eerst. Hier staat wat alleen voor Tune Finder geldt.

## Wat Tune Finder is

Een gereedschap dat een geluid (een enkele noot, een korte frase, een basloopje of een akkoord van één instrument) vergelijkt met alle tunes van de synths in de bibliotheek en de dichtstbijzijnde teruggeeft: een lijst tunes, een lijst instrumenten, en een knop **Laden** die de gekozen tune op dat instrument in de werkruimte zet. Het maakt zelf geen geluid. De bron is een audiobestand (knop **Audiobestand laden…**, of `loadAudio(files)`) of een opname uit de audio-ingang `in` (3, 5, 10 of 20 seconden, bijvoorbeeld van Audio Capture).

| | |
|---|---|
| Bestand | `tune-finder.patchkamer-device.js` (in deze map), ongeveer 1,6 MB: de index zit onderaan in het bestand |
| `id` | `nl.patchkamer.tune-finder`. Verander die nooit: daaraan hangen presets en songs van gebruikers |
| Naam | `Tune Finder` in alle talen; alleen poortnamen hebben een Nederlandse variant (`i18n`); alle tekst staat in `TXT` (nl en en) |
| Soort | `utility` (categorie `tool`): dit apparaat krijgt dus **presets** (geen tunes). Er is nog geen presetpack |
| Poorten | audio-ingang `in` (In), audio-uitgang `thru` (Door / Through: de ingang ongewijzigd); geen events, geen sturing |
| Contract | v1.22 (apparaatversie 1.20.0); geen contractwijziging nodig |
| Licentie apparaat | AGPL-3.0-or-later (de index is afgeleid van de CC0-tunes) |
| Icoon | `icon.svg` in deze map |

## Opbouw van het bestand

1. **TUNE-ANALYSIS** (tussen `// ==== TUNE-ANALYSIS BEGIN` en `END`, bovenaan): `const TA = (() => {...})()`, zuivere functies op `Float32Array`, zonder browser-API's. Dit is **het deel dat een Bass Finder of een ander apparaat kan hergebruiken** (kopieer het blok of laat het script `docs/tools/tunefinder_lib.py` (`analysis_source()`) het uit dit bestand lezen). Inhoud: `TA.analyse(chs, sr, {tick, maxSec})` (kanalen `Float32Array[]`, geeft `{ vec, f0, f0spread, voiced, stereo, dur, onsets }` of `null` bij stilte), `TA.loadIndex(json)`, `TA.rank(query, index, {weights, top, pitchPenalty})`, `TA.distance`, `TA.queryMask`, `TA.WEIGHTS`, `TA.WEIGHTS_UNV`, `TA.GROUPS` en `TA.DIMS` (de indeling van de vector).
2. Het apparaat zelf: UI (shadow DOM), laden van een bestand, opname (worklet `nl-patchkamer-tunefinder-1-20-0`, links en rechts apart in blokken van 4096 frames), zoeken, **Laden**.
3. **TUNE-INDEX** (tussen `// ==== TUNE-INDEX BEGIN` en `END`, onderaan): `const INDEX = {...}`, geschreven door `docs/tools/build-tune-index.py`. Niet met de hand aanpassen.

Een apparaat mag geen bestanden of netwerk gebruiken (contract §15, "alles wat de module nodig heeft staat in dat ene bestand"), en alleen de host kent de bibliotheek. Daarom zit de index in het apparaat zelf. Gevolg: een song met dit apparaat draagt ongeveer 1,6 MB extra mee (de code van elk apparaat zit in de song).

## De analyse (`TA.analyse`)

1. `prepare`: kanalen (hoogstens twee) naar midden (M) en zijkant (S); niet-eindige waarden (NaN, ±Infinity) worden 0, waarden boven 1e6 ook; trage gelijkspanningsfilter (20 Hz); piek en een begrenzing op 12 keer het 99,5e percentiel; genormaliseerd. Stilte (piek < 1e-5) of korter dan 80 ms geeft `null`. Langer dan `maxSec` (20 s): het luidste venster van 20 s.
2. Toonhoogte: genormaliseerde autocorrelatie (`pitchFrames`) op een teruggebracht signaal (±11 kHz), per frame van 23 ms, bereik 27 Hz tot 1 kHz; `f0` is de gewogen mediaan van de heldere frames, `voiced` het aandeel van de energie in heldere frames, `f0spread` de spreiding in halve tonen.
3. Frames van 4096 (8192 boven 70 kHz) met stap een kwart: logspectrum in 40 banden (50 Hz tot 14 kHz), zonder het gemiddelde niveau, met een ondergrens 45 dB onder de sterkste band (en een ruisvloer per band uit de stilste frames) zodat een opname met ruis of een laagdoorlaat op een schone lijkt; de harmonische opbouw (16 harmonischen, in dB ten opzichte van elkaar, per frame op de toonhoogte van dat frame, ondergrens 45 dB); verhouding harmonischen/rest, vlakheid 1 tot 8 kHz, zwaartepunt en verloop daarvan; aanzet (log tijd tussen 10 % en 90 % van de piek), niveau 40, 100, 200 en 350 ms na de piek (hoogstens 24 dB onder de piek), spectrum van de eerste 20 ms; stereobreedte en correlatie.
4. De vector heeft 81 getallen (`TA.GROUPS`: `spec` 40, `harm` 16, `att` 12, `env` 5, `misc` 6, `st` 2).
5. `TA.rank`: afstand = som over groepen van gewicht × gemiddelde (afgekapte) kwadratische afwijking per dimensie, gedeeld door de spreiding van die dimensie in de index (`sd`), minimaal over de vier referentienoten van de tune, plus een kleine straf voor een referentienoot ver van de gevonden toonhoogte (met octaafmarge voor een sub-oscillator). Bij een zoekgeluid zonder heldere toonhoogte (`voiced < 0,3`, een akkoord) doet het harmonische deel en de dimensies `voiced` en harmonischen/rest niet mee (`TA.queryMask`, `TA.WEIGHTS_UNV`). Een mono-geluid laat de stereogroep weg. Tunes met `flag 1` (drones: één toonhoogte) krijgen geen toonhoogtestraf.
6. De gewichten (`TA.WEIGHTS`, `TA.WEIGHTS_UNV`, `PITCHPEN`) zijn afgesteld op een validatiesteekproef (`docs/tools/eval-tune-finder.py tune`), niet op de teststeekproef.

## De index

- Per tune van elk instrument dat noten speelt (alle tunes van de synths; de drumcomputers en de Loop Slicer zijn **niet** opgenomen: dat is het terrein van Drum Listener) renderde `docs/tools/build-tune-index.py` offline met de echte apparaatcode (headless Chromium, `OfflineAudioContext`, de worklets doen mee) vier noten (C2, C3, C4 en C5, velocity 0,8, 0,9 s, 2,2 s geluid) en analyseerde ze met dezelfde `TA.analyse` uit dit bestand. De vectoren zijn per dimensie op een byte afgerond (`scale`) en als hexadecimale tekst opgeslagen (base64 geeft toevallige lettergroepen die op productnamen lijken en de merkencontrole van de repo laten aanslaan): 2211 tunes × 4 noten × 81 dimensies, het hele bestand ongeveer 1,6 MB.
- Sommige tunes spelen alleen met `mode: 'notes'` (een eigen sequencer; Acid Stepper 45 tunes, Foundry 19, Sub Line 26, Cross Mod Mono 16: samen 106, `flag 2`); twee tunes van Layered Landscape zijn een drone die alleen klinkt als het transport loopt (`flag 1`, één toonhoogte, in alle vier de slots).
- **Niet in de index** (stil bij een render): 7 tunes van Grain Cloud en 3 van Patch Mono die extern geluid op de ingang nodig hebben, en de zeven drum- en loopapparaten. De lijst staat in het veld `skipped` van de index.
- Opnieuw maken (na een nieuwe tune, een nieuw pack of een nieuw apparaat), vanuit de root: `python3 docs/tools/build-tune-index.py` (Python, Node, Playwright met Chromium; ongeveer 6 minuten met 14 processen). Verander je de analyse, verhoog dan `TA.VERSION` (dan weigert `loadIndex` een oude index) en maak de index opnieuw. Het script schrijft de index tussen de markeringen onderaan dit bestand; `--json x.json` schrijft hem ook als los bestand.
- Een render met NaN of Infinity wordt niet gebruikt (dat slot neemt de naaste referentienoot over). Gezien: Acid Baselines, tune "Iron Acid", geeft in een offline render op een van de referentienoten NaN/Infinity (152240 samples); in de evaluatie ook bij "Frankfurt Night" en "Machine Pulse". De bewaker van dat apparaat is een timer in de pagina en kan in een snelle offline render niet ingrijpen; in een echte browser is dit niet getest.

## Laden van de gekozen tune

Zonder contractwijziging: de knop **Laden** zoekt met `host.peers(this)` het instrument met dezelfde `def` in de werkruimte (het geselecteerde, anders het eerste), zoekt de tune met `host.tunes.list(deviceId)` op naam en map, en zet hem met `host.tunes.apply({ _id: peer.id }, lid, pid)`. Staat het instrument niet in de werkruimte, dan zegt de kaart welk apparaat je moet plaatsen. Let op: `host.tunes.apply(inst, …)` is in het contract (§14) alleen genoemd "voor tests en controllers"; dat het ook met de `id` van een ander exemplaar werkt, volgt uit de huidige host (`PK.presetApply(inst._id, …)`) en staat niet in het contract. Een host die dat verandert, laat **Laden** een melding geven ("zoek de tune in de tab Tunes") in plaats van te falen. Voorstel voor het contract (niet doorgevoerd): `host.tunes.apply` met een `peers`-id als doel documenteren, en een manier om een apparaat toe te voegen aan de werkruimte.

## De state

`state` is wat `getState()` teruggeeft; `getPreset()` is gelijk. De audio, het zoekresultaat en de index zitten nooit in de state.

| Veld | Wat | Waarden | Start |
|---|---|---|---|
| `rec` | Opnameduur | `s3`, `s5`, `s10`, `s20` (seconden) | `s5` |
| `filter` | Zoeken in een familie van instrumenten | `all`, `bass`, `keys-plucked`, `orchestral-voice`, `poly-lead-pad`, `texture-drone`, `sample` | `all` |

`setState` volgt §13: onbekende velden genegeerd, ongeldige waarden op de standaard. De families staan in `docs/tools/tunefinder_lib.py` (`FAMILY`) en in de index (`devices[].family`): bas en mono (Basic Mono, Ladder Mono, Low Bass, Sub Line, Acid Baselines, Acid Stepper, Duofone, Cross Mod Mono, Patch Mono), toetsen en getokkeld (Piano, Stage Keys, Guitar, Karplus String), blazers, strijkers en stem (Brass Section, Woodwinds, Bowed Ensemble, Formant Singer), poly, lead en pad (Triple Osc Poly, Poly Chorus, Chord Poly, Supersaw Swarm, Patchbay Synth, Four-Operator FM, Paradox), textuur en drone (Drone Synth, Foundry, Biotope, Celestial Mechanics, Cinematic Synth, Dissonant Cluster, Grain Cloud, Layered Landscape, Mist), samples (Samplebank). Een nieuw apparaat zonder familie krijgt `other` in de index (en kan dan niet gefilterd worden): voeg het toe aan `FAMILY` en, als je er een filter voor wilt, aan `FILTERS` en `TXT.families`.

## Meetresultaten (gemeten, niet beluisterd)

Methode (`docs/tools/eval-tune-finder.py`): 701 tunes voor de test en 300 andere voor het afstellen van de gewichten, gelijkmatig over alle 34 instrumenten. Elke tune is met de echte apparaatcode opnieuw gerenderd op een noot (33 tot 84, niet een van de referentienoten), velocity (0,35 tot 1) en duur (0,35 tot 1,3 s) die **niet** in de index zitten, in zes situaties: schone noot; opname (-12 dB, ruis van -50 dBFS, laagdoorlaat 6 kHz, mono); frase van drie noten; akkoord van drie noten; noot door Room (preset Small Room, Warm Hall of Bright Plate van ons eigen effect); noot door Chorus (Subtle Double, Classic Chorus of Wide Pad). De zoekvraag is geanalyseerd en gerangschikt met dezelfde code als het apparaat (de rangschikking in het apparaat en in het Python-script komen overeen: bovenste drie in 209 van 209 steekproefjes gelijk). Treffer = de juiste tune (of een tune van het juiste apparaat, of van de juiste familie) staat bij de eerste 1, 5 of 10. Kans bij raden: 0,05 % (tune, eerste), 1/34 = 2,9 % (apparaat; het grootste apparaat heeft 5,4 % van de tunes).

| Situatie | n | tune 1 | tune 5 | tune 10 | apparaat 1 | apparaat 5 | apparaat 10 | familie 1 | familie 5 | zelfde apparaat in de eerste 5 |
|---|---|---|---|---|---|---|---|---|---|---|
| schone noot | 694 | 52,7 % | 71,6 % | 76,9 % | 85,6 % | 93,1 % | 95,7 % | 91,6 % | 97,7 % | 57 % |
| opname (gain, ruis, laagdoorlaat, mono) | 693 | 20,8 % | 35,2 % | 40,3 % | 42,0 % | 60,0 % | 67,1 % | 58,3 % | 83,4 % | 30 % |
| frase (3 noten) | 696 | 43,8 % | 63,6 % | 70,8 % | 69,3 % | 84,1 % | 89,2 % | 81,9 % | 93,7 % | 48 % |
| akkoord (3 noten) | 697 | 35,7 % | 48,8 % | 54,5 % | 59,3 % | 70,0 % | 76,0 % | 69,7 % | 82,1 % | 40 % |
| door Room | 697 | 44,6 % | 68,1 % | 75,2 % | 77,5 % | 90,8 % | 94,0 % | 84,8 % | 94,4 % | 55 % |
| door Chorus | 697 | 30,7 % | 50,1 % | 59,7 % | 57,1 % | 77,8 % | 84,9 % | 68,9 % | 88,7 % | 44 % |
| alles | 4174 | 38,1 % | 56,3 % | 62,9 % | 65,1 % | 79,3 % | 84,5 % | 75,9 % | 90,0 % | 46 % |

Enkelvoudige verstoringen (200 tunes elk): -12 dB alleen 53,5 % / 82,2 % (tune 1 / apparaat 1); ruis alleen 36,6 % / 62,9 %; laagdoorlaat 6 kHz alleen 52,0 % / 77,2 %; mono alleen 54,0 % / 81,7 %. Dus de dip bij "opname" komt vooral van de ruis (-50 dBFS wit, een lage signaal-ruisverhouding bij uitklinkende klanken) en daarna van de laagdoorlaat.

Hoe het per apparaat gaat (schone noot en Room, apparaat 1): Biotope, Celestial Mechanics, Grain Cloud, Paradox, Drone Synth en Patchbay Synth 93 tot 100 %; Piano, Chord Poly, Stage Keys, Triple Osc Poly 85 tot 89 %; de meeste mono-synths 79 tot 84 %; zwakst Guitar (54 %), Cross Mod Mono (60 %), Supersaw Swarm (63 %), Bowed Ensemble (67 %). De tune zelf vinden lukt slecht bij apparaten met veel bijna gelijke tunes (Mist 15 % bij de eerste vijf, Formant Singer 31 %, Acid Baselines 25 %, Guitar 31 %): dat zijn echte buren, geen fout. Meest voorkomende verwisselingen: Supersaw Swarm met Chord Poly, Cross Mod Mono met Sub Line, Bowed Ensemble met Brass Section en Ladder Mono. Tijd: analyse van 5 s ongeveer 100 tot 240 ms (op een drukke machine), rangschikken ongeveer 5 tot 15 ms, index decoderen 15 ms; langere audio wordt tot de luidste 20 s teruggebracht (ongeveer 0,3 tot 0,5 s).

**Niet getest:** echte opnames (een mens op een echt instrument, een sample van een plaat, een microfoon): alle zoekvragen komen uit dezelfde apparaatcode als de index, dus het domein klopt te mooi. Niets is beluisterd. Meerstemmige muziek met meer instrumenten, vocalen en drums erdoor zijn niet getest (dat is het werk van een stemsplitser). Een echte AudioWorklet-opname uit de ingang in de browser is niet getest (alleen het laden van bestanden).

## Wat je niet moet doen

- Geen tunes maken (het is een `utility`), en het `id` niet wijzigen.
- Geen netwerkverkeer en geen bestanden in dit apparaat (contract §15): de analyse en de index zitten erin.
- Het analysegedeelte niet wijzigen zonder `TA.VERSION` te verhogen, de index opnieuw te maken en opnieuw te meten (`eval-tune-finder.py gen`, `tune`, `score`; meld de getallen). Stel de gewichten af op de validatiesteekproef en meet op de test.
- De audio niet in de state of in een preset zetten.
- Een Bass Finder is een eigen apparaat met een eigen (kleinere) index: hergebruik `TA`, maak de index met `build-tune-index.py` (`--only <deel van de id> --target <apparaatbestand>` schrijft een index van een deel van de apparaten in een ander apparaatbestand met dezelfde markeringen; zonder `--target` gaat het naar Tune Finder).
