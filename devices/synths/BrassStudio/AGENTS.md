# AGENTS.md: Brass Studio

Dit bestand is voor AI-agents die **tunes voor Brass Studio** maken, het apparaat bijwerken of een song met dit apparaat componeren. Het is niet geschreven voor mensen. Het hoort bij `../../../AGENTS.md` (algemeen) en `../../../tunes/AGENTS.md` (regels voor tunepacks); lees die eerst. Hier staat wat alleen voor Brass Studio geldt.

## Wat Brass Studio is

Koperblazers als **fysisch model** in een AudioWorklet (`BrassEngine`): trompet, bugel, trombone, basstrombone, hoorn en tuba, met een sectie van 1 tot 4 spelers, dempers en versieringen. Het staat naast de subtractieve **Brass Section** en **Woodwinds**, die blijven bestaan; er zijn geen vrij bruikbare opnames van koper, dus dit apparaat rekent het geluid uit. Het apparaat heeft **geen** eigen sequencer en geen galm of effect: het speelt de noten die binnenkomen op de ingang `notes`, of de knoppen Proeftoon en Proefakkoord op de kaart. Velocity en notelengte veranderen het spel (zie "Spelen"), daarom is het bedoeld voor een sequencer die `dur` meestuurt.

| | |
|---|---|
| Bestand | `brass-studio.patchkamer-device.js` (in deze map), `icon.svg` |
| `id` | `nl.patchkamer.brassstudio`. Verander die nooit: daaraan hangen tunes en songs van gebruikers |
| Naam | `Brass Studio` in alle talen; de poortnamen hebben een Nederlandse variant (`Noten`, `Stereo koper`) |
| Soort | `instrument`, categorie `synth`: dit apparaat krijgt dus **tunes** (geen presets) |
| Poorten | eventingang `notes`, modulatie-ingang `mod`, audio-uitgang `out` (stereo) |
| Worklet | `nl-patchkamer-brassstudio-1-0-0`; verhoog het versienummer in de naam bij elke wijziging van de motorcode |
| Kaartbreedte | `ui: { width: 460, minWidth: 300 }`; de UI vloeit mee (rasters met `auto-fill`) tot en met 300 px |
| Contract | v1.35 |
| Licentie apparaat | AGPL-3.0-or-later |

## Het model (voor wie de motor wijzigt)

Per stem (een speler):

1. **Mondstukdruk** `pm`: een omhullende uit velocity, notelengte en articulatie (aanzettijd, overshoot "bite", tongstoot, loslaten), met trage onregelmatigheid, vibrato-amplitude en een aanspreekbewaking (spreekt de noot niet, dan blaast de speler iets harder, tot 3 keer).
2. **Lip**: een tweede-orde massa-veersysteem (TPT-lowpass) met resonantie op `lipRatio` keer de noot (iets onder de gespeelde toonhoogte, zoals bij een lip die door de bore wordt meegenomen). Het drukverschil `pm - p` stuurt de lipopening `h = h0 + y` (afgekapt tussen 0 en een maximum).
3. **Klepstroom**: een Bernoulli-achtige wortelwet, per sample **implicit** opgelost: met `q = pm - 2 p_in` is `z = A s` met `s = (-A + sqrt(A^2 + 4q)) / 2` (voor `q < 0` het spiegelbeeld). Geen iteratie. `p_out = p_in + z`.
4. **Pijp**: twee vertragingslijnen (heen en terug) met derde-orde interpolatie; de totale lengte volgt de noot (`D = (c0 + rel) P - tauS sr`, met `rel` een tabel per halve toon per instrument, gemeten met het model zelf, en een correctie voor het ene sample vertraging van de lipterugkoppeling bij een andere samplefrequentie). Een **toonhoogtebewaking** meet de periode van de lipbeweging (nuldoorgangen) en stuurt de lengte binnen 10 % bij: dat is de speler die zijn gehoor gebruikt. Daardoor is de toonhoogte binnen een halve cent nauwkeurig zodra de noot staat.
5. **Bel**: een tweede-orde laagdoorlaat als **reflectie** (`fb` per instrument, te veranderen met Belgrootte), de reflectie is niet-inverterend (de bel en het kopstuk samen leggen de resonanties van de pijp op een harmonische reeks, zoals bij een echt koperinstrument; een open pijp zou alleen oneven harmonischen geven), met verlies per reis (`loss`, iets lager door Conus). Het deel dat doorgelaten wordt (`w - lp`) is de **straling**: een hoogdoorlaat.
6. **Kopstuk**: een piekfilter op de straling (`fmF`, `fmG`, `fmQ`; Kopstuk verandert frequentie en diepte).
7. **Brass-effect**: niet-lineaire voortplanting (de looptijd verkort met de druk van de golf, met een glijbegrenzing zodat de leeslijn nooit achteruit loopt), sterker bij hogere velocity en meer Blat; plus een kleurverloop per dynamiek (tweepolig laagdoorlaat dat zachter dichter gaat, en een hoogplank die met velocity opent). Zacht klinkt zo rond, hard krijgt bite.
8. **Ademruis en tongstoot**: ruis die in de pijp wordt gezet, evenredig met de stroom, plus een korte drukpuls bij de aanzet.

Daarna de **bus**: demper (Straight, Cup, Harmon, Plunger, Emmer: gestapelde TPT-filters, Harmon en Plunger met Wa-wa), lichte kleurregeling (Helderheid), gelijkspanningsfilter (8 Hz), een zachte begrenzer (`x (27 + x^2) / (27 + 9 x^2)`) en een anti-denormaalinjectie van 1e-18. Stemmen: 16 tegelijk (20 plaatsen, de laatste vier voor stemmen die in 3 ms wegvallen als ze worden overgenomen). Met 4 spelers per noot zijn dat vier noten.

Waarom afgeweken van een kale lip-riet met kopstuk en cilinder: een kale cilinder met inverterende bel geeft een oneven harmonische reeks en een wankele lock op de gespeelde noot; met een niet-inverterende reflectie en de tabel voor de lengte staat elke noot binnen het bereik vast op toonhoogte, en de pijp versterkt alle harmonischen. De tweemassa-lip is niet gebouwd (de ene massa met resonantie volgt de noot en geeft de gewenste dynamiek).

## Bereik

Elk instrument heeft een bereik (klinkende MIDI-noten); een noot buiten `lo - 4 .. hi + 4` wordt met hele octaven verschoven (zoals een speler zou doen), tot hij erbinnen valt.

| Instrument | `inst` | `lo` | `hi` | bij gemeten vergrendeling |
|---|---|---|---|---|
| Trompet | 0 | 52 (E3) | 84 (C6) | 48 .. 88 |
| Bugel | 1 | 52 | 80 | 48 .. 84 |
| Trombone | 2 | 40 | 74 | 36 .. 78 |
| Basstrombone | 3 | 34 | 67 | 30 .. 71 |
| Hoorn | 4 | 41 | 70 | 37 .. 74 |
| Tuba | 5 | 28 | 60 | 24 .. 64 |

Een speler in de sectie met `mix` 1 of 2 speelt een deel een octaaf lager op een trombone.

## De state

`getState()` geeft alle velden hieronder (27 getallen, gewone JSON: geen lijsten, geen patroon, geen routing). Er is **geen** `getPreset`: een tune bewaart de hele state. Een waarde wordt op de stap van het veld afgerond en in het bereik afgekapt; een tekst, `NaN`, `Infinity`, `null` of een ontbrekende waarde geeft de startwaarde. Onbekende velden worden genegeerd.

### Keuzes (gehele getallen)

| Veld | Waarden | Start |
|---|---|---|
| `inst` | 0 trompet, 1 bugel, 2 trombone, 3 basstrombone, 4 hoorn, 5 tuba | 0 |
| `mute` | 0 open, 1 straight, 2 cup, 3 harmon, 4 plunger, 5 emmer | 0 |
| `players` | 1 .. 4 spelers per noot (met 4 spelers is er ruimte voor 4 noten tegelijk) | 1 |
| `mix` | 0 alle spelers hetzelfde instrument, 1 de laatste speler een trombone een octaaf lager (vanaf 2 spelers), 2 octaafdubbel (2 spelers: de tweede een octaaf lager; vanaf 3: de laatste twee trombones een octaaf lager) | 0 |
| `legato` | 0 uit, 1 auto: een noot die begint terwijl de vorige nog klinkt (of hoogstens 45 ms uit is) en de enige sprekende is, wordt gebonden: dezelfde stem schuift in 30 ms naar de nieuwe toon, zonder tongstoot; het vibrato loopt door | 1 |
| `orn` | 0 geen, 1 scoop, 2 rip, 3 fall, 4 doit, 5 shake, 6 drop | 0 |

### Speler en toon

| Veld | Wat het doet | Bereik | Stap | Start |
|---|---|---|---|---|
| `tongue` | Tongstoot: hardheid van de aanzet (korte aanzettijd, bite, ruisstoot); werkt samen met velocity | 0 … 1 | 0,01 | 0,5 |
| `blat` | Blat: sterkte van het brass-effect en de bite; onder 0,55 wordt het afgeremd, bij 0 blijft een rest zodat lage noten nog spreken | 0 … 1 | 0,01 | 0,55 |
| `bright` | Helderheid: kleurregeling op de bus en de afsnijding van de dynamiekfilter (`-1` donkerder, `+1` helderder) | -1 … 1 | 0,01 | 0 |
| `breath` | Adem: ademruis in de pijp | 0 … 1 | 0,01 | 0,25 |
| `lip` | Lipspanning: verschuift de lipresonantie ten opzichte van de noot (±1,7 %) | -1 … 1 | 0,01 | 0 |

### Instrument en kopstuk

| Veld | Wat het doet | Bereik | Stap | Start |
|---|---|---|---|---|
| `bell` | Belgrootte: de afsnijding van de bel (±19 %) | -1 … 1 | 0,01 | 0 |
| `bore` | Conus: de pijp wordt conischer (iets meer verlies, zachter) | 0 … 1 | 0,01 | 0,3 |
| `cup` | Kopstuk: diepte en frequentie van de kopstukresonantie en iets van de lipdemping | 0 … 1 | 0,01 | 0,5 |

### Vibrato

| Veld | Wat het doet | Bereik | Stap | Start |
|---|---|---|---|---|
| `vibrato` | Diepte (1 = 35 cent bij een trompet, zachter bij hoorn, bugel en tuba) | 0 … 1 | 0,01 | 0,3 |
| `vibRate` | Snelheid in Hz | 3 … 8 | 0,1 | 5,2 |
| `vibDelay` | Vertraging voor het vibrato inzet (dan 0,5 s inzwellen), seconden | 0 … 1,5 | 0,05 | 0,35 |

### Spel, demper, sectie en niveau

| Veld | Wat het doet | Bereik | Stap | Start |
|---|---|---|---|---|
| `ornAmt` | Versieringsmaat: diepte en tijd van de versiering | 0 … 1 | 0,01 | 0,5 |
| `wah` | Wa-wa: stand van de hand of steel (Harmon: frequentie van de nasale piek, 0,5 is ongeveer 1,8 kHz; Plunger: afsnijding van een resonant laagdoorlaatfilter) | 0 … 1 | 0,01 | 0,5 |
| `wahRate` | Wa-wa snelheid in Hz: 0 is met de hand, daarboven beweegt `wah` automatisch | 0 … 8 | 0,1 | 0 |
| `wahDepth` | Diepte van die automatische beweging | 0 … 1 | 0,01 | 0,8 |
| `spread` | Verstemming tussen de spelers (cent) | 0 … 40 | 0,5 | 8 |
| `human` | Timing-menselijkheid: willekeurige vertraging van de inzet per speler (ms) | 0 … 30 | 0,5 | 6 |
| `width` | Stereobreedte van de spelers | 0 … 1 | 0,01 | 0,6 |
| `transpose` | Transpositie in halve tonen (op het nootnummer, in het apparaat; geldt voor nieuwe noten) | -24 … 24 | 1 | 0 |
| `tune` | Stemming (cent) | -50 … 50 | 0,5 | 0 |
| `level` | Uitgangsniveau | 0 … 1 | 0,01 | 0,8 |

## Spelen

- Eventingang `notes`: `note` (met `dur`), `noteon` en `noteoff` (aangehouden toetsen), `cc` en `panic`/`allnotesoff`. Een `note` zonder `dur` en zonder `noteoff` klinkt door tot er een `panic` komt of de transport stopt: **een sequencer moet altijd `dur` meesturen**. Een `cc` met `id` gelijk aan een veld uit de tabellen en `value` 0 … 1 zet dat veld lineair over zijn bereik (`transpose` niet). Een transportstop laat alle noten in 30 ms uitklinken.
- **Velocity**: zacht (laag) is rond en donker (de aanzet is langzamer, het laagdoorlaatfilter dicht), hard heeft bite en blat. Het niveau gaat mee: tussen velocity 0,1 en 1 zit ongeveer 25 dB, de spectrale zwaartepunt stijgt met een factor 1,6 tot 4 (gemeten, zie onder).
- **Notelengte**: korter dan 0,2 s is gestoten (kortere aanzet, kortere uitklank); een noot duurt minimaal `0,035 s + 5 / f` zodat lage noten nog tot spreken komen. Lang is gebonden met de natuurlijke uitklank. De tongstoot hoort alleen bij een nieuwe aanzet, niet bij een gebonden noot.
- **Versieringen** (`orn`): scoop en rip beginnen onder de noot; fall, doit en drop beginnen **waar de noot eindigt** (de uitklank wordt dan langer en de toon glijdt), dus stuur noten met een lengte; shake is een brede lipvibrato van ongeveer 6,6 Hz. `ornAmt` zet diepte en tijd.
- Stemmen: 16 (plus vier voor wegvallende). Zijn er niet genoeg vrije, dan wordt eerst de zachtste uitklinkende stem overgenomen, daarna de oudste; die valt in 3 ms weg (geen klik).
- Alle knoppen behalve de keuzes en `transpose` zijn stuurbaar via de paarse `mod`-ingang (zeven sporen: Instrument, Speler, Vibrato, Spel, Demper, Sectie, Niveau). Waarden die per noot worden vastgelegd (pijplengte, `tongue`, `blat` voor de aanzet, `spread`, `human`) gelden voor de volgende noot; `wah`, `bright`, `level`, `vibrato` en de dempers werken meteen. Parameters gaan in de motor zacht over (ongeveer 30 ms).

## Bewaker

De motor accepteert alleen eindige berichten (een niet-eindige waarde in een nootbericht of parameterbericht wordt genegeerd of afgekapt), en de wachtrij is begrensd (2048). Per blok wordt de toestand van elke stem (lipfilter, belfilter, gelijkspanningsfilter, druk, leeslijn) op eindigheid gecontroleerd; een stem met een niet-eindige toestand wordt gewist (`reset`), een niet-eindige busstand op 0 gezet. De druk in de pijp is begrensd op ±8, de uitgang loopt door de zachte begrenzer en `process` vangt fouten op en geeft dan stilte. Denormalen: toestanden zijn Float64 en op de bus wordt een alternerende 1e-18 opgeteld; een stem wordt hergebruikt met een schone `reset`.

## Gemeten

Alles gemeten in Chromium (Playwright, `OfflineAudioContext` met de echte worklet) en in Node met dezelfde motorcode; **niet beluisterd**.

- **Toonhoogte** (autocorrelatie met parabolische verfijning over 0,8 s, 1,0 tot 1,8 s na de inzet, velocity 0,25, 0,6 en 1,0, elke halve toon van `lo - 4` tot `hi + 4`): trompet, bugel, trombone en basstrombone binnen 0,4 cent (testharnas: berichten via suspend/resume afgeleverd, anders raakt een OfflineAudioContext ze kwijt); hoorn binnen 0,7 cent; tuba binnen 0,3 cent van noot 30 af, de laagste noten (24 tot 29, 33 tot 46 Hz) staan na 1 s nog tot 17 cent te laag omdat de lip zo langzaam aanspreekt (na ongeveer 1,5 s binnen een halve cent). Bij 44,1 en 96 kHz binnen 0,2 cent op de gemeten noten.
- **Dynamiek**: spectrale zwaartepunt (Hz, hele spectrum) bij velocity 0,1 / 0,6 / 1,0: trompet noot 68 (415 Hz) 760 / 1320 / 1925; noot 55 480 / 1365 / 1880; bugel noot 66 606 / 771 / 893; trombone noot 57 417 / 669 / 1073; hoorn noot 55 ongeveer 330 / 480 / 640; tuba noot 44 ongeveer 183 / 256 / 301. Het niveau stijgt tussen velocity 0,1 en 1,0 met ongeveer 23 tot 25 dB bij trompet, 16 tot 20 dB bij bugel, trombone, basstrombone en hoorn en 12 tot 15 dB bij tuba. Het zwaartepunt stijgt overal monotoon met velocity (factor 1,4 tot 3,9).
- **Aanzet**: tijd tot 90 % van de piek: trompet middenregister 60 tot 80 ms, hoge noten 30 tot 40 ms; trombone noot 57 110 tot 150 ms; lage noten (trombone noot 43, tuba) 250 tot 400 ms. De aanzet van lage noten is langzaam omdat de lip een paar tientallen cycli nodig heeft (voor tuba bij pianissimo meer dan een halve seconde).
- **CPU**: Node (V8), blokken van 128 samples bij 48 kHz (budget 2,67 ms): 8 stemmen gemiddeld 2,1 % van het blok, p99 2,5 %, maximum 0,2 ms (7,5 %); 16 stemmen (4 spelers x 4 noten) met Harmon en wa-wa gemiddeld 4 tot 5,5 %, p99 6 tot 9 %. Chromium (offline render van 4 s, inclusief overhead van de graaf): 8 stemmen 3,6 tot 4,5 % van de tijd, 16 stemmen 6,8 % (schommelt met de belasting van de machine).
- **Stabiliteit**: alle noten 0 … 127 met velocity 0,0001, 0,5 en 1 voor alle zes instrumenten, 40 willekeurige staten (de helft op de uiterste waarden) met stormen van 30 tot 150 noten (velocity `NaN`, 5 of -3, duur 0,001 tot 1e9 of `NaN`, noten buiten bereik) en willekeurige modulatie: 0 niet-eindige samples, piek hoogstens 1,0. Een hele serie met 16 gelijktijdige stemmen bij velocity 0,9 blijft onder de 1,0 piek door de begrenzer.
- **Niveau**: elke noot is in de gewenste klasse met een winst per instrument en per octaaf (`outG`, `outS`): bij velocity 0,8 is de rms ongeveer -24 dBFS over het bereik (een trompet op velocity 1,0 piekt bij 0,25 tot 0,45); een akkoord van 8 noten bij velocity 0,9 piekt bij 0,8 tot 0,9.
- **Klik bij het einde**: het uiteinde loopt via de uitklank van de pijp (en de sluitende lip) en geen sprong in de toestanden; bij korte noten loopt de natuurlijke uitklank door na de lengte van de noot. Gemeten: het grootste tweede verschil in de staart is hoogstens 1,4 maal dat in de noot zelf (alle instrumenten, velocity 0,2 tot 1, duur 0,3 tot 1,2 s, open en Harmon, met en zonder fall).

## Wat niet getest of onzeker is

- **De klank is nooit beluisterd.** Alle keuzes (bel, kopstuk, dempers, vibrato, brass-effect, bite) zijn gebaseerd op metingen van het spectrum en op de bekende eigenschappen van koper, niet op het gehoor. Beoordeel bij de eerste keer luisteren vooral: de ruisstoot bij de aanzet (`burstE` in `start`), de hardheid van de bite (`BITE` en `tb`), de dempers Harmon en Plunger, het brass-effect bij `blat` 1.
- Lage noten van trombone, basstrombone, hoorn en tuba spreken langzaam aan bij pianissimo; de aanspreekbewaking helpt, maar een tuba op velocity 0,2 bloeit over een halve seconde op en kan daarbij boven het gewenste niveau uitkomen.
- Extreme knopstanden kunnen op de uiterste noten een andere resonantie van de pijp kiezen (een sprong in toonhoogte): Belgrootte op +1 bij de hoogste noot van bugel en hoorn, Lipspanning en Blat 0 bij de laagste noten. De knoppen zijn bewust beperkt (Belgrootte ±19 %, Lipspanning ±1,7 %), maar niet elke combinatie is bewezen. 19 van de 504 geteste combinaties (instrument, knop op een uiterste waarde, laag/midden/hoog, twee velocity's) liepen buiten 8 cent of 0,85 correlatie; ze zijn bijna allemaal een traag aanspreken van de laagste tubanoot (binnen een halve seconde bij de meting nog niet gesetteld).
- De pijp heeft geen oversampling (`host.audio.oversample` wordt niet gebruikt): het niet-lineaire deel (klepstroom en voortplanting) kan aliasen. Gemeten: de energie tussen de harmonischen is bij 48 kHz 4 tot 8 dB hoger dan bij een render op 96 kHz (verschil boven de harmonischen 16 tot 22 dB bij 48 kHz, 19 tot 29 dB bij 96 kHz); ademruis is een groot deel daarvan.
- De demperfilters (Straight, Cup, Harmon, Plunger, Emmer) zijn schattingen met gewone filters, niet gemeten aan echte dempers. Dempers veranderen de pijp zelf niet.
- Bij een heel snelle reeks noten op dezelfde toonhoogte met `legato` 1 en overlap wordt gebonden (de tongstoot valt weg); wie elke noot geaccentueerd wil, zet `legato` op 0 of laat de noten niet overlappen.

## Een tune

Een pack heet `naam.patchkamer-tunes.json` en staat in `../../../tunes/`. Het formaat en de licentie (`CC0-1.0` voor alles in `tunes/`) staan in `../../../tunes/AGENTS.md`. Voor dit apparaat is `device` altijd `nl.patchkamer.brassstudio` en elke tune is `kind: "set"` met een `state` als hierboven. Zet geen merknamen van bestaande apparatuur in naam of omschrijving, en verzin geen persoon bij `author`. Zet alle velden erin: een tune zonder een veld geeft dat veld zijn startwaarde (ook `inst`, `mute`, `players`, `mix`, `legato` en `orn`).

```json
{ "name": "Soul Stabs", "kind": "set", "version": "1.0.0", "tags": ["style/soul", "style/funk"],
  "state": { "tongue": 0.95, "blat": 0.9, "bright": 0.3, "breath": 0.25, "lip": 0, "bell": 0, "bore": 0.3, "cup": 0.5,
             "wah": 0.5, "wahRate": 0, "wahDepth": 0.8, "vibrato": 0, "vibRate": 5.2, "vibDelay": 0.35, "ornAmt": 0.5,
             "spread": 8, "human": 4, "width": 0.7, "transpose": 0, "tune": 0, "level": 0.8,
             "inst": 0, "mute": 0, "players": 3, "mix": 1, "legato": 0, "orn": 0 } }
```

Het pack `../../../tunes/brass-studio-styles.patchkamer-tunes.json` heeft 45 tunes in 7 mappen (Trumpet, Muted Trumpet, Flugelhorn, Trombone, French Horn, Tuba, Section), met `tags` (`instrument/brass/trumpet`, `.../trombone`, `.../section` en eigen `.../flugelhorn`, `.../horn`, `.../tuba`; stijlen `style/jazz`, `ballad`, `soul`, `funk`, `world`, `folk` en eigen `latin`, `ska`, `new-orleans`, `fanfare`). De tunes bevatten **nooit** een patroon of noten: het geluid zit in de speler, de noten komen van de sequencer.

## Controleren

- Vanuit de root van de repo: `node contract/validate-instrument.mjs devices/synths/BrassStudio/brass-studio.patchkamer-device.js` (en met `--lang en` en `--controls`). Dat moet `OK` geven, zonder `let op`.
- Motor in Node benchmarken en op niet-eindige waarden testen: laad het apparaat, haal de workletcode uit de constante `WORKLET` (de motor staat tussen `const INST = ...` en `registerProcessor`), maak een `BrassEngine(48000)` en gebruik `engine.setParams({...})`, `engine.enqueue({ type: 'on', t, id, note, vel, dur })` en `engine.render(L, R, 128, t0)`.
- Het pack: JSON geldig, `device` is `nl.patchkamer.brassstudio`, elke sleutel in elke `state` komt voor in `getState()`, elke tag past op `/^[a-z0-9]+(-[a-z0-9]+)*(\/[a-z0-9]+(-[a-z0-9]+)*){0,3}$/`, en `setState(state)` geeft dezelfde waarden terug.
- Je kunt niet horen hoe een tune klinkt. Heb je een browser, laad dan de host (`../../../patchkamer/AGENTS.md`) en kies de tune. Heb je geen browser, schrijf dan in je oplevering dat de tune **niet beluisterd** is.
- Alle tekst in het apparaat staat in het woordenboek `EN` bovenin het bestand (Nederlandse bron, Engels via `host.lang`). Een nieuwe tekst krijgt altijd nl én en; de uitleg staat in `about`, niet op de kaart.

## Wat je niet doet

- Verander nooit de `id`, de `kind`, de poort-id's of de namen van state-velden.
- Pas het apparaat niet aan om een tune te laten kloppen.
- Verander de motor niet zonder het worklet-versienummer te verhogen, en genereer de tabellen `rel`, `outG` en `outS` in `INST` opnieuw als je de fysische parameters (`fb`, `loss`, `lipQ`, `lipRatio`, `kappa`, `h0`, `g`, `beta`) wijzigt: de lengte van de pijp is ermee afgeregeld.
- Commit of push niet, tenzij de opdracht dat vraagt.

## Documentatie en songs

- Handleiding van de soort: [NL](../../../docs/synths/USER-MANUAL_NL.md) · [EN](../../../docs/synths/USER-MANUAL_EN.md) (Brass Studio staat er nog niet in; de hoofdsessie voegt dat toe).
- Overzicht van de soort: [README](../README.md).
- Tunes (klanken, `kind: set`): [brass-studio-styles.patchkamer-tunes.json](../../../tunes/brass-studio-styles.patchkamer-tunes.json). Hoe tunes zijn opgebouwd: [tunes/AGENTS.md](../../../tunes/AGENTS.md).
- Overzicht van alle apparaten en hun signaalketens: [devices/AGENTS.md](../../../devices/AGENTS.md). Een song componeren: [songs/AGENTS.md](../../../songs/AGENTS.md).
- Route voor agents: [soort Synths](../AGENTS.md) → [devices/AGENTS.md](../../AGENTS.md) → [root AGENTS.md](../../../AGENTS.md). Contract: [NL](../../../contract/PATCHKAMER-CONTRACT_NL.md) · [EN](../../../contract/PATCHKAMER-CONTRACT_EN.md). Hoe tunes van dit apparaat zijn opgebouwd: [tunes/AGENTS.md](../../../tunes/AGENTS.md). <!-- agents-tree -->
- Rol in een song: koperblazers met een sectie van 1 tot 4 spelers, solo's, stabs, falls, rips en swells. Noten op `notes`, audio uit `out` (stereo). Stuur hem met een sequencer die `dur` meestuurt; er zit geen galm in, zet er een effect achter. Voor een volle sectie: `players` 3 of 4 en `mix` 1.

## Skins

De UI staat in een open shadow root met de basisstijlen van het apparaat erbij. Alle knoppen en keuzes komen via `host.ui.knob` en `host.ui.select` met `id` (state-sleutel) en `group` (`horn`, `player`, `vibrato`, `play`, `mute`, `section`, `out`); elke groep heeft precies één `.sec`-blok dat de regelaars **direct** bevat (zo kan een skin de secties herschikken). De meegeleverde skin `Compact` staat in `../../../skins/library/nl.patchkamer.brassstudio/` (400 punten breed en ongeveer 600 hoog tegenover 460 x 745). Wijzig je de opbouw (`.bst`, `.sec`, de kopjes), controleer dan die skin.
