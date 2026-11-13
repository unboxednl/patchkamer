# AGENTS.md: Sax Studio

Dit bestand is voor AI-agents die **tunes voor Sax Studio** maken, het apparaat wijzigen of er een song mee componeren. Het is niet geschreven voor mensen. Het hoort bij `../../../AGENTS.md` (algemeen) en `../../../tunes/AGENTS.md` (regels voor tunes); lees die eerst.

## Wat Sax Studio is

Gesampelde saxofoons (sopraan, alto, tenor, bariton) voor gebruik met een sequencer: de velocity en de lengte van een noot veranderen het spel. De opnames zitten **niet** in de repo en niet in Patchkamer: het apparaat haalt ze na een klik op "Laden" via `host.fetchFile` (contract §13i) op uit MTG Solo Saxophones. `getState()` bevat alleen instellingen, nooit audio. Een tune, preset of song laadt dus niets: zonder geladen opnames speelt het apparaat stil en toont de kaart dat. Het vervangt Woodwinds (synthese) niet; dat apparaat blijft bestaan.

| | |
|---|---|
| Bestand | `sax-studio.patchkamer-device.js` (in deze map) |
| `id` | `nl.patchkamer.saxstudio`. Verander die nooit |
| Soort | `instrument`: dit apparaat krijgt **tunes** (geen presets), categorie `synth` |
| Poorten | eventingang `notes` (noten, ook `noteon`/`noteoff`, cc, `panic`), sturing in `mod`, audio uit `out` (stereo). Geen bundel, geen losse uitgangen |
| Contract | v1.35 (apparaatversie 1.0.0; gebruikt het optionele `host.fetchFile` van v1.30) |
| Licentie apparaat | AGPL-3.0-or-later |
| Skin | `../../../skins/library/nl.patchkamer.saxstudio/compact.patchkamer-skin.json` (Compact) |

## Bron, licentie en vermelding

Drie bibliotheken zijn beoordeeld (alle drie van `sfzinstruments`, licentie gelezen op de vastgepinde commit):

| Bibliotheek | Commit | Licentie | Gebruikt |
|---|---|---|---|
| MTG Solo Saxophones (sopraan, alto, tenor, bariton) | `b494d256549b3d088fdec176ce82867f8a1f58b2` | **CC-BY-4.0** (naamsvermelding verplicht) | **ja, voor alle vier** |
| Weresax (Karoryfer Lecolds, alto) | `a4d756b21d2a573aca0d840cce7e71ba5effd4c6` | CC0-1.0 | nee |
| Bear Sax (Karoryfer Lecolds, bariton) | `7abb3c652525a15dfac80e1b5dfbba9964ee568f` | CC0-1.0 | nee |

- Repo van de gebruikte bron: `https://github.com/sfzinstruments/MTG.SoloSax`. Samples van de Music Technology Group (Universitat Pompeu Fabra) via freesound.org, gesneden, gelooped, naar FLAC omgezet en in SFZ gezet door kinwie. Vermelding op de kaart en in `about`: "MTG Solo Saxophones, samples van MTG (Universitat Pompeu Fabra) via freesound.org, gelooped en in SFZ gezet door kinwie, CC BY 4.0". De bibliotheeknaam staat alleen in de bronvermelding, nergens in namen, ids of tunes.
- Er wordt niets gekopieerd naar de repo. Het apparaat bewaart het opgehaalde nooit in state, tune of song (§13i). Wat er met de opnames gebeurt: afkappen bij het eind van de lus (het deel erna wordt nooit afgespeeld), schalen en filteren; dat staat in `about`.
- **Waarom alleen MTG.** Het is de enige van de drie met alle vier de instrumenten, één formaat (24 bit, 48 kHz, mono, FLAC) met lusgrenzen in het bestand zelf, 2 velocity-lagen (3 bij de bariton), drie round robins en adem- en klepruis. Weresax is alleen alto, WAV van 44,1 kHz (ongeveer 0,66 MB per noot, ongeveer 42 MB per laag voor één microfoon en één take) en heeft twee microfoons met een overstuurde dynamische microfoon (een "honk" die nu met de drive wordt benaderd). Bear Sax is een echte bariton met opgenomen artikulaties (subtone, growl, staccato, marcato), maar 143 MB, met schaarse toewijzing, keyswitches en overvloeien op CC 1: dat vraagt een tweede aanpak in de motor. Beide zijn een logisch vervolg (zie "Open"); **subtone, growl, falloff, scoop en bite zijn dus nagebootst en niet opgenomen.**
- jsDelivr: bij de eerste meting weigerde jsDelivr 35 van de 737 samplebestanden van de bron (403, pakketgrens; zelfde gedrag als bij Acoustic Drums); bij een latere meting gaven alle 737 een 200. Het apparaat probeert eerst jsDelivr (`BASE`) en valt bij fout `http` of `network` terug op hetzelfde bestand van dezelfde commit bij `raw.githubusercontent.com` (`RAW`); alle 35 geweigerde bestanden gaven daar 200. Beide staan open voor CORS (`access-control-allow-origin: *`, gecontroleerd met `curl -sI`).

## De bestanden en de download

Bestandsnamen: `<ins>_<laag>_<nn>.flac` met `ins` `sop`, `alt`, `ten` of `bar` en `laag` `p`, `f` (bariton ook `m`); `<ins>_b_<nn>.flac` is adem, `<ins>_k_<nn>.flac` klepruis. De catalogus `CAT` bovenin het bestand bevat per opname het nummer, de natuurlijke toonhoogte (MIDI, uit de `key`, `pitch_keycenter` en `tune` van de SFZ: `pitch_keycenter - tune/100`), het volume in dB uit de SFZ en de grootte in kB. De round robins van de bron zijn dezelfde opnames, een halve toon verschoven: het apparaat kiest per noot willekeurig uit de opnames binnen 1,05 halve toon, zonder directe herhaling.

Lusgrenzen staan in het FLAC-bestand zelf (een `riff`-applicatieblok met een `smpl`-chunk); `flacLoop()` leest ze uit de bytes vóór `decodeAudioData`. Ontbreken ze, dan valt het apparaat terug op 55% tot 75% van de duur. De grootte vóór de klik is een schatting uit de bestandsgroottes (de geheugenschatting is 1,7 × de download en komt gemeten 5 tot 22% te hoog uit).

| Instrument | Omvang | Bestanden | Download (gemeten) | In het geheugen (gemeten) |
|---|---|---|---|---|
| Sopraan | compact / volledig | 48 / 80 | 12 MB / 22 MB | 17 MB / 31 MB |
| Alt | compact / volledig | 48 / 80 | 12 MB / 24 MB | 20 MB / 36 MB |
| Tenor | compact / volledig | 48 / 80 | 12 MB / 23 MB | 19 MB / 35 MB |
| Bariton | compact / volledig | 67 / 114 | 11 MB / 20 MB | 16 MB / 30 MB |

Compact is de helft van de noten (om de andere opname, de hoogste en de laagste inbegrepen; de rest wordt tot een halve toon verschoven), volledig alle opnames. In beide gevallen 8 adem- en 6 klepopnames (ongeveer 0,6 MB). Er wordt één instrument tegelijk geladen; een nieuwe lading vervangt de vorige pas als hij klaar is (tijdelijk dus beide in het geheugen). `maxBytes` per bestand is 1,3 × de bekende grootte, afgerond op 64 kB.

## De state

`getState()` is gewone JSON; er is geen `getPreset`, een tune is de hele state. Ongeldige waarden worden afgekapt of vallen op de standaard terug, getallen worden op hun stap gezet, onbekende velden genegeerd; `setState` start nooit een download en zet ook alle knoppen en keuzes bij. Wat niet "werkt direct" zegt, werkt op de volgende noot.

| Veld | Label nl / en | Bereik | Standaard | Betekenis |
|---|---|---|---|---|
| `level` | Niveau / Level | 0 … 1,5 | 0,8 | Hoofdniveau (werkt direct) |
| `expr` | Expressie / Expression | 0 … 1 | 1 | Expressie, ook cc `expression` (werkt direct) |
| `dyn` | Dynamiek / Dynamics | 0 … 1 | 0,55 | Hoeveel de velocity het niveau bepaalt (0 = altijd even hard, 1 = 24 dB bereik) |
| `subthr` | Subtone onder / Subtone below | 0 … 0,5 | 0,3 | Onder deze velocity klinkt een noot als subtone; 0 = uit |
| `acc` | Bite vanaf / Bite from | 0,5 … 1 | 0,85 | Vanaf deze velocity klinkt een noot met bite |
| `tongue` | Bite / Bite | 0 … 1 | 0,5 | Hoeveel bite (aanzetpiek en presence in de aanzet); 0 = uit |
| `stac` | Staccato onder / Staccato below | 40 … 400 (ms) | 180 | Een noot korter dan dit (ms) is staccato |
| `legato` | Legato-gat / Legato gap | 0 … 120 (ms) | 40 | Grootste gat tussen twee noten dat toch als legato klinkt (overlap telt altijd) |
| `glide` | Overgang / Glide | 0 … 150 (ms) | 35 | Lengte van de legato-overgang |
| `snap` | Aanzet scherp / Attack snap | 0 … 1 | 0,6 | Hoeveel van de stille aanloop van de opname wordt overgeslagen (0 = natuurlijke aanzet, 1 = aanzet op de noottijd) |
| `growl` | Growl / Growl | 0 … 1 | 0 | Hoeveelheid growl (amplitudemodulatie); 0 = uit |
| `growlRate` | Growl-snelheid / Growl rate | 30 … 110 (Hz) | 62 | Snelheid van de growl |
| `fall` | Falloff / Falloff | 0 … 1 | 0 | Hoeveelheid falloff (toonhoogte zakt na het einde); 0 = uit |
| `scoop` | Scoop / Scoop | 0 … 1 | 0 | Hoeveelheid scoop (toonhoogte komt van onderen); 0 = uit |
| `vib` | Vibrato / Vibrato | 0 … 80 (cent) | 10 | Vibratodiepte (werkt direct); 0 = uit |
| `vibRate` | Vibrato-snelheid / Vibrato rate | 3 … 9 (Hz) | 5,2 | Vibratosnelheid (werkt direct) |
| `vibDelay` | Vibrato-vertraging / Vibrato delay | 0 … 1,5 (s) | 0,35 | Vertraging voor het vibrato inzet |
| `breath` | Adem / Breath | 0 … 1,5 | 0,6 | Niveau van de ademruis bij de aanzet |
| `keys` | Kleppen / Keys | 0 … 1,5 | 0,5 | Niveau van de klepruis bij het einde van een noot en bij legato |
| `human` | Humanize / Humanize | 0 … 1 | 0,3 | Kleine variatie in timing (hoogstens 6 ms), stemming (±10 cent), niveau (±1,2 dB) en laagkeuze |
| `transpose` | Transpositie / Transpose | -24 … 24 (halve tonen) | 0 | Transpositie van de noten die binnenkomen |
| `fine` | Stemming / Tuning | -100 … 100 (cent) | 0 | Stemming |
| `voices` | Stemmen / Voices | 2 … 4 (stuks) | 3 | Aantal stemmen in de sectiestand |
| `spread` | Spreiding / Spread | 0 … 40 (cent) | 12 | Verstemming tussen de stemmen |
| `width` | Breedte / Width | 0 … 1 | 0,5 | Stereospreiding van de stemmen |
| `lag` | Verschil in aanzet / Entry spread | 0 … 30 (ms) | 8 | Verschil in aanzet tussen de stemmen (hoogstens) |
| `hp` | Lage afsnijding / Low cut | 20 … 400 (Hz) | 60 | Lage afsnijding (werkt direct) |
| `body` | Lichaam / Body | -9 … 9 (dB) | 0 | Plankfilter 200 Hz (werkt direct) |
| `presence` | Aanwezigheid / Presence | -9 … 9 (dB) | 0 | Klokfilter 2,6 kHz (werkt direct) |
| `air` | Lucht / Air | -9 … 9 (dB) | 0 | Plankfilter 6,5 kHz (werkt direct) |
| `lp` | Hoge afsnijding / High cut | 2000 … 16000 (Hz) | 16000 | Hoge afsnijding (werkt direct) |
| `drive` | Drive / Drive | 0 … 1 | 0 | Zachte verzadiging (werkt direct) |
| `roomMix` | Ruimte / Room mix | 0 … 1 | 0,15 | Niveau van de ruimte (werkt direct) |

Keuzes (strings):

| Veld | Waarden | Standaard | Betekenis |
|---|---|---|---|
| `instrument` | `sop`, `alt`, `ten`, `bar` | `alt` | Welk instrument "Laden" haalt (de tune zegt voor welk instrument hij is) |
| `size` | `compact`, `full` | `compact` | Welke omvang "Laden" haalt |
| `mode` | `mono`, `section` | `mono` | Monofoon (met legato) of sectie (polyfoon, `voices` stemmen per noot) |
| `stack` | `unison`, `octaves`, `major`, `minor`, `fourths` | `unison` | Intervallen van de stemmen: 0 0 0 0; 0 −12 +12 −24; 0 −4 −7 −12; 0 −3 −7 −12; 0 −5 −10 −15 halve tonen |
| `growlOn`, `fallOn`, `scoopOn` | `accent`, `long`, `all` | `accent`, `long`, `accent` | Bij welke noten de techniek klinkt: velocity ≥ `acc`; noten van minstens 0,35 s die geen staccato zijn; alle noten |
| `room` | `off`, `room`, `plate`, `hall` | `room` | Soort ruimte (een gegenereerde stereo-impuls van 0,5 s, 1,3 s of 2,6 s) |

Alle regelaars hebben een `id` (= de state-sleutel), `role` `param` (knoppen) en een `group`: `kit`, `play`, `fx`, `fxsel`, `pitch`, `sect`, `sectsel`, `tone`, `tonesel`. De groepen met knoppen (`play`, `fx`, `pitch`, `sect`, `tone`) staan elk in een eigen element, zodat de skin ze kan inkaderen. `params()` bevat 31 regelaars (alles behalve `transpose` en `voices` en de keuzes: `modExclude`); `on` staat alleen aan bij klank, ruimte, vibrato, adem, klep, growl, falloff, scoop en bite. Kleine regelaars (een `Mod`-kabel) werken op de eerstvolgende noot of, bij de regelaars die "direct" werken, meteen.

## Noten en gebeurtenissen

- `note` met `note` (MIDI, klinkende toonhoogte), `vel` 0 … 1 (standaard 0,8), `time` en `dur`; `noteon` zonder `dur` blijft klinken tot `noteoff` (op dezelfde noot); `allnotesoff` en `panic` stoppen alles op de gebeurtenistijd. Andere velden (zoals `ch`) worden genegeerd. cc: `expression`, `level`, `mod` of `vibrato` (de modwiel zet `vib`) en elke numerieke regelaar op zijn naam; de waarde 0 … 1 loopt over het bereik van de regelaar.
- De opnames klinken zoals genoteerd: een alt speelt Db3 (49) tot A5 (81), een sopraan 56 tot 88, een tenor 44 tot 76, een bariton 36 tot 69. Een noot buiten dat bereik (plus 2 halve tonen speling) wordt met octaven teruggevouwen. `transpose` en `fine` werken op alles.
- `onTransport` met `playing: false` stopt alle stemmen.

## Wat het geluid doet

- **Laag en niveau.** Velocity boven 100/127 kiest de forte-laag (bariton: p tot 85, m tot 106, f daarboven), eronder de zachte laag; er is bewust **geen** overvloeien tussen lagen (twee lagen van dezelfde toonhoogte tegelijk gaven bij een lange noot een zwevingsfout tot 5 dB; gemeten). Het niveau volgt `dyn` (tot 24 dB), per opname gelijkgetrokken (90% van het verschil met de mediaan van de laag, hoogstens 6 dB) en per instrument bijgesteld (`INST_DB`).
- **Subtone** (velocity onder `subthr`): donkerder (laagdoorlaat van 14 kHz naar 1,7 kHz bij velocity 0), langzamere aanzet (tot 75 ms), meer adem, 2 dB zachter en 8 cent lager. **Bite** (velocity vanaf `acc`, schaal `tongue`): aanzetpiek tot +3,5 dB (daalt in 0,09 s) en een peakfilter van 2,8 kHz tot +7 dB (daalt in 0,14 s), aanzet 4 ms. **Staccato** (`dur` < `stac`): de noot duurt 75% van `dur` en klinkt in 30 ms uit.
- **Mono-legato.** Begint een noot voordat de vorige afloopt, of binnen `legato` ms daarna (en niet staccato, en hoogstens 9 halve tonen verderop), dan vloeit de vorige stem in `glide` ms (gelijk vermogen) uit en begint de nieuwe 0,28 s verderop in de opname (dus zonder aanzet en zonder ademruis), met een klepklik. Dezelfde toon in elkaar over (overlap) is een bindboog: de vorige stem loopt gewoon door. De overgang heeft bewust geen toonhoogteglijding: tijdens het overvloeien zijn beide stemmen dan op dezelfde toon en kunnen ze elkaar uitdoven (gemeten tot −8,6 dB; zonder glijding in de metingen hieronder hoogstens −2,8 dB).
- **Growl**: amplitudemodulatie (driehoek, `growlRate`, diepte 0,25 + 0,7 × `growl`), bij lange noten loopt de diepte in 0,5 s op. **Falloff**: na het einde zakt de toonhoogte 3 tot 12 halve tonen in 0,12 tot 0,4 s terwijl het filter dichtgaat; de uitklinktijd past zich aan. **Scoop**: de noot begint 1,5 tot 4 halve tonen te laag en stijgt in 60 tot 130 ms.
- **Vibrato**: één gedeelde LFO (sinus) in cents op de `detune` van elke stem, per stem met vertraging (`vibDelay`, daarna 0,45 s oplopend); bij legato loopt het vibrato door. De mod-ingang kan diepte en snelheid sturen.
- **Adem en klep**: een willekeurige opname uit de geladen adem- en klepopnames; adem bij de aanzet (meer bij zachte noten), klik bij het einde van een noot en bij een legato-overgang (de klik van een noot die door legato doorloopt wordt geannuleerd).
- **Sectie**: per noot `voices` stemmen met de intervallen van `stack`, verstemd met `spread` cent (patroon 0, +1, −1, +0,5 keer de spreiding), over de breedte verdeeld (0, −1, +1, −0,5), met een verschil in aanzet tot `lag` ms en elk een eigen opname; niveau 1/√n per stem. Polyfoon (geen legato), hoogstens 24 klinkende stemmen (de oudste klinkt dan snel uit).
- **Aanzet**: elke opname heeft een korte stille aanloop (gemeten 2 tot 45 ms tot 10% van het niveau); `snap` slaat die over zodat de aanzet op de noottijd valt. De starttijd wordt naar boven afgerond op een grens van 128 samples.
- **Nabewerking**: laagdoorlaat/hoogdoorlaat, plankfilters (200 Hz, 6,5 kHz), een klokfilter (2,6 kHz), een zachte verzadiging (`drive`, tanh, oversampling volgens `host.audio.oversample`), een kleine ruimte (convolutie met een gegenereerde impuls; wisselen van soort laat de oude uitklinken), een zachte begrenzer (lineair tot 0,7, nooit boven 0,908).
- **Bewaker**: een niet-eindig sample in de uitgang stopt alle stemmen en bouwt het filterspoor opnieuw op (de filters zijn de enige plek waar een NaN kon blijven hangen). Geen aliasing-bron buiten de verzadiging; bronnen stoppen pas als de uitklink (`setTargetAtTime`, acht tijdconstanten) is uitgestorven.

## Gemeten (Playwright, headless Chromium, OfflineAudioContext, echte opnames, 48 kHz)

De test laadt de echte bestanden (via de `fetchFile`-route van de host, in de offline test via een eigen `fetch` met een lokale cache van dezelfde adressen), speelt noten en meet de uitvoer. Alles is **niet beluisterd**.

- Laden: compact en volledig voor alle vier de instrumenten zonder fouten; `fetchFile` wordt niet aangeroepen door `create`, `mount`, `setState`, `onStep`, `onEvent` en `unmount` (0 aanroepen vóór de klik; ook de validator meldt niets). Annuleren (vorige kit blijft spelen, piek −11,7 dB na annuleren), alle verzoeken 500, deels 404, een host zonder `fetchFile`: de goede tekst in nl en en. De jsDelivr-403's (35 bij de eerste meting) worden door de terugval afgevangen. De opnames laden ook zonder cache over het echte netwerk (sopraan en bariton, elk in ongeveer 1 s met een warme CDN).
- Toonhoogte (autocorrelatie, alle noten van het bereik, velocity 0,7, 0,35 tot 0,85 s na de aanzet): gemiddelde afwijking van gelijkzwevend A = 440 Hz compact / volledig: sopraan 3,7 / 4,0 cent (hoogstens 9,5), alt 3,4 / 3,2 (8,5 / 9,2), tenor 1,9 / 2,3 (5,5 / 7,4), bariton 1,6 / 1,6 (5,0 / 7,0). De afwijking is bij sopraan en alt overwegend te hoog (te sharp, ongeveer 3 cent gemiddeld; bron of meetmethode, niet uitgezocht).
- Niveau (RMS 0,35 tot 0,85 s, velocity 0,7): sopraan −18,4 tot −15,7 dB, alt −17,3 tot −16,6, tenor −18,8 tot −18,2, bariton −19,8 tot −19,1 (spreiding over de noten hoogstens 2,7 dB); piek hoogstens −4,9 dB. Over de velocity (alt, noot F♯4, 10 stappen van 0,03 tot 1): −27,4 tot −13,1 dB RMS, stijgend zonder dalingen; aanzettijd van 10% naar 90% 68 ms (zacht) naar 46 ms (hard).
- Lus: bij een noot van 10 s blijft de omhullende binnen 0,1 dB (−16,8 dB, tien vensters van 0,1 s) en is er geen amplitudesprong of piek te zien (grootste verschil tussen twee opeenvolgende samples 0,077 tegen p99,9 0,035 van die noot; de grootste verschillen komen elke 0,36 s op dezelfde plek terug, dus het is de golfvorm en geen klik, maar ik heb niet de afzonderlijke lusgrens van de gebruikte opname uitgelezen). De lusgrenzen van de bron zijn goed: gemiddeld 0,24 dB verschil tussen begin en eind van de lus, hoogstens 1,2 dB (20 opnames gemeten). Een noot langer dan ongeveer 3 s (alt) loopt in de lus van 70 tot 170 ms: een kleine herhaling is te verwachten.
- Legato: de omhullende (20 ms) valt bij 13 intervallen (−4 … +9 halve tonen) per instrument hoogstens 1,7 (sopraan), 2,8 (alt, bij een interval van −1), 0,6 (tenor) en 0,9 dB (bariton) terug; losse noten (gat 0,2 s) vallen weg; een noot met een gat van 20 ms klinkt als legato (−0,5 dB).
- Staccato: noten van 0,05 tot 0,15 s zijn vanaf 150 ms na het einde stil (−240 dB). Geen sprong aan het einde van een noot (grootste verschil tussen twee samples in 3 ms rond het einde ten opzichte van de golf ervoor: 0,52 tot 1,2 bij normaal, staccato, falloff, subtone, growl en sectie).
- Growl: modulatie op 60,5 Hz met diepte 0,5 (RMS-omhullende) bij `growl` 1 en `growlRate` 62; zonder growl geen piek. Falloff (`fall` 1, noot van 0,8 s): −85, −269, −451 cent op 10, 70 en 130 ms na het einde. Scoop (`scoop` 1): −286, −180, −17 cent op 10, 50 en 100 ms na de aanzet. Vibrato (`vib` 40, `vibRate` 5,5, `vibDelay` 0,3): 7 cent top-top vlak na de aanzet, 56 na 0,5 s, 77 na 1,5 s (verwacht 80) bij 5,4 Hz; `modulate({ vib: 0.5 })` geeft 77,7 cent top-top bij `vib` 0.
- Sectie (drie stemmen, majeur, noot C5): pieken op 524, 419 en 349 Hz (C5, A♭4, F4); niveau gelijk aan de monofone noot (−14,9 tegen −14,8 dB RMS), piek 4,4 tot 5 dB hoger.
- Humanize (`human` 1, acht keer dezelfde noot): aanzet 21 tot 29 ms, niveau ±1 dB, toonhoogte −5,5 tot +12 cent. `snap` (tijd tot 50% van het niveau, noten van alt): 40 / 41 / 34 ms bij 0, 45 / 32 / 26 bij 0,6 en 42 / 20 / 19 bij 1 (laag / midden / hoog).
- NaN en Infinity: zes testrondes met willekeurige en extreme instellingen (alle regelaars op minimum of maximum, 160 noten met willekeurige noot, velocity, lengte, transpositie 24, alle stapelingen en ruimtes, een salvo van `NaN`, ±`Infinity`, 1e30, tekst, `null` en `{}` als noot, velocity, tijd en cc, modulatie met ±1, 1e9 en `NaN`): geen fout, uitvoer eindig, piek hoogstens −0,8 dBFS (de begrenzer), `setState(getState())` gelijk. De state is 509 bytes.
- Echte host (laden via de bibliotheek, `Plaatsen`): kaartbreedte 760, 480, 412, 360 en 320 px zonder dat een element buiten de kaart steekt (nl en en), geen horizontale schuifbalk op 412 px, geen paginafouten, de tunekiezer toont de 36 tunes, de skin Compact (400 px) werkt, een pad speelt een noot en toont de artikulatie. De tekst heeft geen Nederlandse woorden in de Engelse UI.
- Validator: `OK` zonder `let op`, gewoon, `--lang en` en `--controls`.

## Niet beluisterd en niet gemeten

- **Niet beluisterd.** Of het levensecht klinkt, of de adem- en klepruis het goede niveau heeft (de constanten `BREATH_REL` en `KEY_REL` zijn geschat, niet gemeten), of de growl er als growl uitziet, of de falloff en scoop muzikaal zijn en of de overgang bij legato goed klinkt.
- Niet getest: een echte uitgang met echte latency (de planner schept een lookahead van ongeveer 100 ms), ASIO, Safari en Firefox (FLAC via `decodeAudioData`; in Chromium gemeten), het netwerk van een gebruiker (de test op het echte netwerk was kort en met een warme CDN), geheugen op een zwakke machine (volledig is 30 tot 36 MB gedecodeerd; tijdens een vervanging dubbel), het CPU-gebruik bij veel stemmen (24 stemmen is de grens; niet gemeten), en de geladen opnames na een lange sessie.
- Weresax en Bear Sax zijn niet gebruikt (zie "Bron").

## Tunes maken

- Pack: `../../../tunes/sax-studio-styles.patchkamer-tunes.json` (licentie `CC0-1.0`, `device` `nl.patchkamer.saxstudio`, `kind: set`, 36 tunes in de mappen Jazz Ballad, Bebop, Soul and Funk, Smooth, Rock and Roll Honk, Subtone Ballad, Growler, Section Stabs en Clean, elk met een tune per instrument). Een tune zegt met `instrument` voor welk instrument hij is gemaakt; die laad je eerst zelf.
- Een tune noemt alleen wat afwijkt van de standaard (de rest komt van `setState`) en altijd `instrument`. Gebruik alleen de sleutels uit de tabellen hierboven. Engelse namen ("Alto Jazz Ballad"), geen merknamen van instrumenten en geen artiesten. Tags: `instrument/woodwind/sax` op pack en tune, `style/…` op de map.
- Tunes voor deze motor werken met de verhoudingen van de velocity: een tune voor zachte, doorlopende lijnen (Subtone Ballad) rekent erop dat de sequencer velocity onder ongeveer 0,5 stuurt; Bebop en Soul and Funk laten de velocity en de notelengte het spel kiezen.

## Wat je niet doet

- Verander nooit de `id`, de state-sleutels of de poort-id's. Kopieer geen opnames naar de repo en haal nooit iets op buiten een klik.
- Zet geen andere bron in de catalogus zonder de licentie op een vastgepinde versie te lezen (en de vermelding op de kaart en in `about` mee te nemen).
- Commit of push niet, tenzij de opdracht dat vraagt.

## Open

- Bear Sax als bron voor opgenomen subtone, growl, staccato en marcato van de bariton, en Weresax voor een honk-alt, vragen een tweede laadpad (andere formaten en toewijzing).
- De ademruis en klepruis zijn niet op gehoor ingesteld.

## Documentatie en songs

- Handleiding van Sax Studio: [NL](../../../docs/synths/USER-MANUAL_NL.md#sax-studio) · [EN](../../../docs/synths/USER-MANUAL_EN.md#sax-studio) (nog toe te voegen door de hoofdsessie).
- Overzicht van de soort: [README](../README.md); handleiding van de hele soort: [NL](../../../docs/synths/USER-MANUAL_NL.md) · [EN](../../../docs/synths/USER-MANUAL_EN.md).
- Tunes (klanken, `kind: set`): [sax-studio-styles.patchkamer-tunes.json](../../../tunes/sax-studio-styles.patchkamer-tunes.json). Kies een tune als beginpunt voor de `state` van dit apparaat in de song; velden die de tune niet noemt krijgen hun standaard. Hoe tunes zijn opgebouwd: [tunes/AGENTS.md](../../../tunes/AGENTS.md).
- Overzicht van alle apparaten en hun signaalketens: [devices/AGENTS.md](../../../devices/AGENTS.md). Een song componeren: [songs/AGENTS.md](../../../songs/AGENTS.md).
- Route voor agents: [soort Synths](../AGENTS.md) → [devices/AGENTS.md](../../AGENTS.md) → [root AGENTS.md](../../../AGENTS.md). Contract: [NL](../../../contract/PATCHKAMER-CONTRACT_NL.md) · [EN](../../../contract/PATCHKAMER-CONTRACT_EN.md). Hoe tunes van dit apparaat zijn opgebouwd: [tunes/AGENTS.md](../../../tunes/AGENTS.md). <!-- agents-tree -->
- Rol in een song: een blazer (solo, melodielijn, tegenmelodie of sectiestab) voor jazz, soul, funk, rock en roll en ballades. Noten op `notes`, audio uit `out` (stereo). Stuur hem met een Step Sequencer, een Pattern Tracker of een Clip Arranger met velocity per noot: zacht (onder ongeveer 0,3) is subtone met adem, hard (vanaf ongeveer 0,85) heeft bite, korte noten (onder 180 ms) zijn staccato en een noot die over de volgende heen loopt, bindt. Een song die dit apparaat gebruikt, klinkt pas na een klik op "Laden".
