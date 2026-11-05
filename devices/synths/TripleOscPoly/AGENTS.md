# AGENTS.md: Triple Osc Poly

Dit bestand is voor AI-agents die **tunes voor Triple Osc Poly** maken. Het is niet geschreven voor mensen. Het hoort bij `../../../AGENTS.md` (algemeen) en `../../../tunes/AGENTS.md` (regels voor tunepacks); lees die eerst. Hier staat wat alleen voor Triple Osc Poly geldt.

## Wat Triple Osc Poly is

Een meerstemmige subtractieve synth. Elke stem heeft drie oscillators (zaagtand, blok, driehoek, sinus, FM of getoonde ruis) met unison tot zeven stemmetjes per oscillator, ringmodulatie van oscillator 1 met 2, FM van oscillator 2 naar 1, een ruisbron, twee filters (serieel of parallel, zeven filtertypen) met een gedeelde filter-envelope, een vervormer (shaper) en een versterker-envelope. Een noot kan een akkoord spelen (elf akkoordtypen). Er zijn negen kant-en-klare klankstanden als knoppen op de kaart en een speelbaar klavier. Er zit geen sequencer, geen arpeggiator en geen LFO in: het speelt de noten die een externe sequencer of toetsenbord stuurt.

| | |
|---|---|
| Bestand | `triple-osc-poly.patchkamer-device.js` (in deze map) |
| `id` | `nl.patchkamer.polysynth`. Verander die nooit: daaraan hangen tunes en songs van gebruikers |
| Naam | `Triple Osc Poly` in alle talen; alleen de poortnamen hebben een Nederlandse variant (via `i18n`: `Uit`, `Noten`) |
| Soort | `instrument`: dit apparaat krijgt dus **tunes** (geen presets) |
| Poorten | eventingang `notes` (Notes), modulatie-ingang `mod`, audio-uitgang `out` (Out, stereo) |
| Contract | v1.11 |
| Licentie apparaat | AGPL-3.0-or-later |

Dit apparaat is de nieuwe, bijgewerkte vorm van een ouder bestand met een andere naam (Polysynth). De `id` is gelijk gebleven en alle state-velden ook: bestaande songs en presets laden dus gewoon.

## Wat je hier doet

Je maakt klanken (tunes) voor Triple Osc Poly en zet ze als pack in `../../../tunes/`. Het apparaat zelf pas je alleen aan als de opdracht dat zegt (`version` ophogen; `id`, poort-id's en state-velden gelijk houden).

## De state

`getState()` geeft alle velden hieronder; dat is ook wat een tune als `state` bewaart. De state is gewone JSON: getallen, tekst en waar/onwaar, met drie geneste lijsten/objecten (`osc`, `f1`/`f2`, `shp`). Er zijn geen patronen, geen sequencer en geen werkstand: de **hele state hoort in een tune**. Een tune hoeft niet alle velden te noemen: ontbrekende velden (ook ontbrekende velden binnen `osc[i]`, `f1`, `f2`, `shp`) krijgen de startwaarde. Noem je `osc`, geef dan een lijst van drie objecten; een object mag leeg zijn (`{}`), dan blijft die oscillator zoals in de startstand.

### Oscillators: `osc` (lijst van drie objecten)

Elk object heeft deze velden. De startwaarden verschillen per oscillator (kolommen 1, 2 en 3).

| Veld | Wat het doet | Bereik | Start 1 / 2 / 3 |
|---|---|---|---|
| `on` | Oscillator aan | `true` of `false` | `true` / `true` / `true` |
| `type` | Golfvorm: `saw` (zaagtand), `sqr` (blok), `tri` (driehoek), `sine` (sinus), `fm` (sinus-FM, zie `fmr` en `fmi`), `noise` (bandfilter-ruis op de toonhoogte van de noot) | `saw`, `sqr`, `tri`, `sine`, `fm`, `noise` | `saw` / `sqr` / `sine` |
| `oct` | Octaaf, geheel getal | −3 … 2 | 0 / 0 / −1 |
| `semi` | Halve tonen | −12 … 12 | 0 / 0 / 0 |
| `fine` | Fijnstemming in cent | −50 … 50 | 0 / 7 / 0 |
| `lvl` | Niveau van deze oscillator | 0 … 1 | 0,7 / 0,5 / 0,4 |
| `uni` | Unison: aantal stemmetjes per noot, geheel getal. Het niveau wordt automatisch gedeeld door de wortel van dit aantal | 1 … 7 | 1 / 1 / 1 |
| `det` | Unison-spreiding: het verst uit elkaar liggende stemmetjes zijn zoveel cent van elkaar af (±`det`). Alleen hoorbaar bij `uni` boven 1 | 0 … 60 | 12 / 12 / 12 |
| `spread` | Stereobreedte van de unison-stemmetjes (0 = allemaal in het midden, 1 = helemaal links en rechts). Alleen hoorbaar bij `uni` boven 1 | 0 … 1 | 0,5 / 0,5 / 0,5 |
| `fmr` | FM-verhouding: frequentie van de modulator ten opzichte van de draaggolf. Alleen bij `type` `fm` | 0,25 … 12 | 2 / 2 / 2 |
| `fmi` | FM-index: modulatiediepte. 0 = zuivere sinus. Alleen bij `type` `fm` | 0 … 12 | 2 / 2 / 2 |

`oct`, `semi`, `fine` en `tune` (hieronder) tellen op. `type` `noise` is erg zacht: een oscillator die alleen ruis speelt blijft rond een piek van 0,01 … 0,02 (gemeten, `lvl` 0,8); zet `lvl` hoog, gebruik `uni` voor meer ruis, of gebruik het veld `noise` hieronder voor een bredere ruisbron.

### Menging en vervorming

| Veld | Wat het doet | Bereik | Start |
|---|---|---|---|
| `noise` | Witte ruis, vóór de filters bijgemengd | 0 … 1 | 0 |
| `ring` | Ringmodulatie van oscillator 1 × oscillator 2 (alleen de eerste unison-stem van elk), bijgemengd. Werkt alleen als beide oscillators aan staan | 0 … 1 | 0 |
| `fm21` | Oscillator 2 moduleert de frequentie van oscillator 1 (FM-diepte, evenredig met de toonhoogte). Werkt alleen als beide aan staan | 0 … 1 | 0 |
| `shp.type` | Vervormer (shaper): `off`, `soft` (zacht), `hard` (hard afkappen), `fold` (vouwen), `asym` (asymmetrisch) | `off`, `soft`, `hard`, `fold`, `asym` | `soft` |
| `shp.drive` | Hoeveel vervorming. De vervormer zit na filter 1 (en vóór filter 2 bij serieel), of na de som van de twee filters bij parallel | 0 … 1 | 0,15 |

De oversampling van de shaper volgt de audiokwaliteit van de gebruiker (`host.audio.oversample`).

### Filters: `f1` en `f2`

Elk filter heeft dezelfde velden. Filter 2 staat standaard uit.

| Veld | Wat het doet | Bereik | Start f1 / f2 |
|---|---|---|---|
| `type` | `lp12` (lowpass, 12 dB), `lp24` (lowpass, 24 dB: twee filters achter elkaar), `hp12`, `hp24` (highpass), `bp` (bandpass), `notch`, `peak` (piek van +12 dB bij de cutoff) | `lp12`, `lp24`, `hp12`, `hp24`, `bp`, `notch`, `peak` | `lp24` / `hp12` |
| `cut` | Basis-cutoff in Hz | 40 … 20000 | 2400 / 60 |
| `res` | Resonantie. Bij `lp24` en `hp24` staat de resonantie alleen op het tweede filter. De Q van het filter in dB: hoog = scherp, 20 is ongeveer 10 keer versterking bij de cutoff | 0,3 … 20 | 1,2 / 0,7 |
| `env` | Diepte van de filter-envelope in **zeven octaven per 1,0**: de cutoff beweegt bij elke noot van `cut` naar `cut × 2^(7 × env)` (negatief = omlaag). Begrensd op 20 … 20000 Hz | −1 … 1 | 0,35 / 0 |
| `kt` | Toonvolgen: hoeveel de cutoff met de toonhoogte meegaat ten opzichte van C4 (1 = een octaaf per octaaf, 0 = niet) | 0 … 1 | 0,5 / 0 |

Overig voor de filters (bovenste niveau):

| Veld | Wat het doet | Bereik | Start |
|---|---|---|---|
| `f2on` | Filter 2 aan | `true` of `false` | `false` |
| `route` | `serial`: oscillators → filter 1 → vervormer → filter 2. `parallel`: oscillators naar beide filters, de uitkomsten opgeteld en daarna de vervormer. Alleen van belang als `f2on` aan staat | `serial` of `parallel` | `serial` |

### Envelopes

De filter-envelope (`fa`, `fd`, `fs`, `fr`) is gedeeld door beide filters; `f1.env` en `f2.env` bepalen hoeveel elk filter hem volgt. De versterker-envelope (`aa`, `ad`, `as`, `ar`) vormt het volume van elke stem. Attack gaat lineair; decay en release zijn exponentieel (de tijd is ongeveer de tijd tot hij praktisch klaar is).

| Veld | Wat het doet | Bereik | Start |
|---|---|---|---|
| `fa` | Filter-envelope attack in seconden | 0,001 … 8 | 0,01 |
| `fd` | Filter-envelope decay in seconden | 0,01 … 8 | 0,5 |
| `fs` | Filter-envelope sustain (het deel van de diepte dat blijft staan; 0 = terug naar `cut`, 1 = blijft op de piek) | 0 … 1 | 0,3 |
| `fr` | Filter-envelope release in seconden | 0,01 … 10 | 0,6 |
| `aa` | Versterker attack in seconden | 0,001 … 8 | 0,01 |
| `ad` | Versterker decay in seconden | 0,01 … 8 | 0,4 |
| `as` | Versterker sustain-niveau | 0 … 1 | 0,75 |
| `ar` | Versterker release in seconden | 0,01 … 10 | 0,6 |
| `vel` | Aanslaggevoeligheid: 0 = elke noot even hard, 1 = de volume volgt de velocity volledig | 0 … 1 | 0,5 |

Een noot met een `dur` begint zijn release na `dur`. Een noot zonder `dur` krijgt 0,25 s. Een stem klinkt nog ongeveer `1,6 × ar` na de release door voor hij weg is.

**Korte noten (sinds versie 1.11.1):** is een noot korter dan de versterker-attack `aa`, dan begint de release vanaf het volume dat de attack op dat moment heeft bereikt. Een korte noot klinkt dus zachter (met `aa` 0,5 gaf `dur` 0,1 een piek van 0,03, `dur` 0,3 een piek van 0,09, `dur` 0,45 een piek van 0,13 en `dur` 0,55 of meer de volle 0,15), maar is nooit meer stil. In versie 1.11.0 was zo'n noot volledig stil. Hetzelfde geldt voor de filter-envelope: een noot korter dan `fa` laat het filter nog gedeeltelijk openen. Noten die langer duren dan hun attack klinken precies als voorheen. Een lange `aa` blijft toch ongeschikt voor tunes die met korte noten worden gespeeld, omdat de noot dan zacht blijft: houd `aa` kort (onder 0,05 s) voor alles wat korte noten krijgt.

### Stemmen en uitgang

| Veld | Wat het doet | Bereik | Start |
|---|---|---|---|
| `poly` | Maximum aantal stemmen dat tegelijk klinkt, geheel getal. Elke akkoordnoot telt als een stem. Is het maximum bereikt, dan neemt een nieuwe noot de oudste stem over | 1 … 12 | 8 |
| `chord` | Akkoord uit één noot: `''` (één noot), `maj` (groot), `min` (klein), `sus2`, `sus4`, `min7`, `maj7`, `dom7`, `min9`, `fifth` (kwint), `oct` (octaaf). Elke gespeelde noot wordt de grondtoon; het volume wordt gedeeld door de wortel van het aantal akkoordnoten | zie links | `''` |
| `spread` | Ligging van het akkoord: `0` dicht, `1` open (de tweede noot een octaaf omhoog, bij drie of meer noten), `2` open met een extra bas (een octaaf onder de grondtoon erbij). Geheel getal. (In de UI heet dit veld Voicing.) | 0 … 2 | 0 |
| `tune` | Stemming van de hele synth in cent | −100 … 100 | 0 |
| `lvl` | Uitgangsniveau | 0 … 1 | 0,6 |
| `pan` | Plaats in het stereobeeld: −1 links, 1 rechts | −1 … 1 | 0 |

Let op: het veld `spread` op het bovenste niveau (de ligging van het akkoord) is iets anders dan `osc[i].spread` (de stereobreedte van de unison-stemmetjes).

Akkoordintervallen (in halve tonen boven de grondtoon): `maj` 0 4 7; `min` 0 3 7; `sus2` 0 2 7; `sus4` 0 5 7; `min7` 0 3 7 10; `maj7` 0 4 7 11; `dom7` 0 4 7 10; `min9` 0 3 7 10 14; `fifth` 0 7; `oct` 0 12.

### Velden in `getState()`

`getState()` geeft: `osc` (lijst van drie objecten met alle velden hierboven), `noise`, `ring`, `fm21`, `f1`, `f2`, `f2on`, `route`, `shp`, `fa`, `fd`, `fs`, `fr`, `aa`, `ad`, `as`, `ar`, `vel`, `poly`, `chord`, `spread`, `tune`, `lvl`, `pan`. Niets anders. Er zijn geen velden die uit een tune moeten blijven; de klankstand-knoppen op de kaart zijn geen state (zij zetten alleen de velden hierboven).

## Wat het apparaat met een state doet (getest)

- `setState({})`, `setState(null)` en een tekst of getal geven alle startwaarden; `setState(getState())` geeft dezelfde state terug (ook na elk van de negen klankstanden).
- Getallen buiten het bereik worden afgekapt (`f1.cut: 1e9` wordt 20000, `osc[0].oct: 99` wordt 2, `poly: 0,2` wordt 1, `fd: 1e9` wordt 8); een tekst, `NaN`, `Infinity` of een ontbrekende waarde geeft de startwaarde. Geheel-getalvelden (`oct`, `uni`, `poly`, `spread`) worden naar nul afgerond.
- Een ongeldige `type`, `chord`, `shp.type` of `route` geeft de startwaarde. Onbekende velden (op elk niveau) worden genegeerd en komen niet terug in `getState()`. Zet er geen in.
- De knoppen, keuzelijsten en aan/uit-vakjes op de kaart bewegen mee met `setState`.
- Geluid is gelijk aan de oudere versie (Polysynth 1.8.0), met één bewuste uitzondering sinds 1.11.1 (korte noten, zie bij de envelopes): de volledige reeks Web Audio-aanroepen (nodes, verbindingen, parameterwaarden en automatie) is voor noten die langer duren dan hun attack identiek bij 60 willekeurige instellingen en nootreeksen (versie 1.11.1 tegen 1.11.0), en de negen klankstanden geven dezelfde state. De state-sleutels zijn ongewijzigd. De klankstanden heten nu Engels (zie hieronder).

## Spelen en modulatie

- Eventingang `notes`: een gebeurtenis `{ type: 'note', note, vel, time, dur }` (MIDI-nootnummer, velocity 0 … 1, starttijd in seconden van de audioklok, duur in seconden). Het nootnummer wordt begrensd op 0 … 127. Zonder `vel` is het 0,8, zonder `dur` 0,25 s. Een niet-eindige `time`, `vel` of `dur` wordt vervangen door een veilige waarde, een niet-eindig nootnummer wordt genegeerd. Andere typen (CC, noteon/noteoff) doet het apparaat niets mee. Aangehouden noten ontstaan alleen door het klavier op de kaart.
- De modulatie-ingang `mod` verschuift 21 parameters: `tune`, `o1lvl`, `o2lvl`, `o3lvl` (niveaus van de oscillators), `udet` (unison-spreiding: 1,0 is de ingestelde spreiding, tot drie keer erboven), `noise`, `ring`, `fm21`, `cut1`, `res1`, `env1`, `cut2`, `env2`, `drive`, `fa`, `fd`, `aa`, `ad`, `ar`, `lvl`, `pan`. Spoor-indeling: Oscillators, Filter 1, Filter 2, Shaper, Envelopes, Output. Alleen `tune`, `cut1`, `res1`, `cut2`, `lvl` en `pan` kunnen sample-nauwkeurig (snel) gestuurd worden. De andere werken **alleen bij het begin van een nieuwe noot**: een modulator die langzaam beweegt, verandert dus pas de volgende noot, niet de noot die nu klinkt.

## De negen klankstanden op de kaart (startpunten voor een tune)

Elke klankstand is de startstand met deze verschillen. Alles wat niet genoemd is, staat op de startwaarde.

| Naam | Verschillen |
|---|---|
| Init | geen: de startwaarden |
| Warm Pad | osc 1: `uni` 5, `det` 18, `spread` 0,8; osc 2: `saw`, `oct` −1, `uni` 3, `det` 10, `lvl` 0,5; osc 3 uit; `f1` `lp24` 900 Hz, `res` 1, `env` 0,3, `kt` 0,4; `fa` 1,2, `fd` 2, `fs` 0,5, `fr` 2,5; `aa` 1,4, `ad` 1, `as` 0,9, `ar` 3; `chord` `min7` |
| Strings | osc 1: `uni` 7, `det` 22, `spread` 1; osc 2: `saw`, `oct` 1, `uni` 3, `det` 15, `lvl` 0,25; osc 3 uit; `f1` `lp12` 3200 Hz, `res` 0,8, `env` 0,15, `kt` 0,6; `aa` 0,6, `ad` 1, `as` 0,85, `ar` 1,6; `shp` uit |
| FM Keys | osc 1: `fm`, `fmr` 1, `fmi` 3; osc 2: `fm`, `fmr` 3,5, `fmi` 1,2, `lvl` 0,3; osc 3: `sine`, `oct` −1, `lvl` 0,3; `f1` `lp12` 6000 Hz, `res` 0,7, `env` 0,2; `aa` 0,003, `ad` 1,2, `as` 0,2, `ar` 0,8; `chord` `maj7` |
| Pluck | osc 1: `sqr`, `lvl` 0,6; osc 2: `saw`, `fine` −9, `lvl` 0,5; osc 3 uit; `f1` `lp24` 400 Hz, `res` 3, `env` 0,75, `kt` 0,7; `fa` 0,002, `fd` 0,25, `fs` 0, `fr` 0,3; `aa` 0,002, `ad` 0,35, `as` 0, `ar` 0,3 |
| Supersaw | osc 1: `uni` 7, `det` 30, `spread` 1; osc 2: `uni` 7, `det` 25, `oct` −1, `lvl` 0,45, `spread` 1; osc 3 uit; `f1` `lp24` 5000 Hz, `res` 1, `env` 0,2, `kt` 0,3; `shp` `soft` 0,3; `ad` 0,5, `as` 0,8, `ar` 0,5 |
| Deep Bass | osc 1: `saw`, `oct` −2, `lvl` 0,6; osc 2: `sqr`, `oct` −2, `fine` 5, `lvl` 0,5; osc 3: `sine`, `oct` −3, `lvl` 0,6; `f1` `lp24` 220 Hz, `res` 2,5, `env` 0,5, `kt` 0,2; `fa` 0,003, `fd` 0,3, `fs` 0,2, `fr` 0,2; `aa` 0,003, `ad` 0,5, `as` 0,8, `ar` 0,15; `shp` `asym` 0,35; `poly` 1 |
| Glass | osc 1: `fm`, `fmr` 3,01, `fmi` 4, `lvl` 0,5; osc 2: `fm`, `fmr` 7, `fmi` 1, `oct` 1, `lvl` 0,25; osc 3 uit; `f1` `lp12` 9000 Hz, `res` 0,7, `env` 0, `kt` 0; `aa` 0,002, `ad` 2,5, `as` 0, `ar` 2,5; `ring` 0,1; `shp` uit |
| Noise Field | osc 1: `noise`, `lvl` 0,8, `uni` 3, `det` 25; osc 2: `noise`, `oct` 1, `lvl` 0,4; osc 3: `sine`, `oct` −1, `lvl` 0,2; `f1` `bp` 1200 Hz, `res` 2, `env` 0,2, `kt` 0,8; `aa` 2, `ad` 2, `as` 0,9, `ar` 4; `chord` `sus2` |

Alle namen zijn Engels en taalneutraal; zij staan niet in de state.

### Gemeten niveaus

Piek van de linkerzijde, offline, 48 kHz, velocity 0,8, `lvl` 0,6:

| Situatie | Piek |
|---|---|
| één noot (C3), de klankstanden (Noise Field: onder 0,01) | 0,10 … 0,30 |
| vier noten tegelijk (C3 E3 G3 B3), de klankstanden (Deep Bass heeft `poly` 1 en geeft dus 0,13) | 0,13 … 0,60 |
| alle drie de oscillators `uni` 7, `chord` `min9`, zes noten, `poly` 12, velocity 1 | ongeveer 0,59 |
| `lvl` 1, drie noten, velocity 1 | ongeveer 0,75 |

Het niveau per stem wordt automatisch gedeeld door de wortel van `uni` en van het aantal akkoordnoten; de volumeverschillen tussen klankstanden zijn daardoor klein. Houd `lvl` onder 0,8 bij veel noten, en onder 0,6 bij een lange release met snelle noten. Zware instellingen (`uni` 7 op alle drie de oscillators, een akkoord van vijf noten, `poly` 12) maken veel stemmen (elke noot telt `uni` × oscillators × akkoordnoten oscillators); dat belast de processor. In een offline render kostte zo'n instelling ongeveer 1,8 s voor 3 s geluid; kies in een tune niet standaard het maximum.

## Instellingen voor een goede klank

Alle waarden zijn uitgangspunten; luisteren is niet mogelijk, controleer dus op bereik en gedrag.

- **Basis (gebalanceerd):** de startwaarden (Init).
- **Bas:** `poly` 1 of 2; oscillators `saw` en `sqr` twee octaven omlaag (`oct` −2) plus een sinus nog een octaaf lager; `f1` `lp24`, `cut` 200 … 500, `res` 1,5 … 4, `env` 0,3 … 0,6, `kt` 0,2; korte `aa` (0,002 … 0,005), `ar` 0,1 … 0,2; `shp` `asym` of `soft` met `drive` 0,2 … 0,4; `uni` 1, geen akkoord. Spelen op MIDI-noten 24 … 48.
- **Lead:** `poly` 1 … 4, `saw` + `sqr` met `fine` 5 … 9 verschil, `uni` 3 … 5 met `det` 8 … 15, `f1` `lp24` `cut` 2500 … 5000, `res` 1,5 … 3, `env` 0,3 … 0,5; `aa` 0,005, `as` 0,8; geen akkoord. Voor glide is er geen knop: dit apparaat heeft geen glide.
- **Pad:** klankstand Warm Pad of Strings als basis: `uni` 5 … 7 met `det` 18 … 25 en `spread` 0,8 … 1, `aa` 0,6 … 1,5, `as` 0,85 … 1, `ar` 1,5 … 3, `f1` `lp12` of `lp24` `cut` 900 … 3200, `chord` `min7` of `maj7`, `poly` 8 … 12 (een akkoord van vier noten telt vier stemmen).
- **Pluck:** `as` 0, `fs` 0, `ad` 0,25 … 0,4, `ar` 0,2 … 0,4, `aa` 0,002, `f1` `cut` 400 … 900, `env` 0,6 … 0,8, `res` 2 … 4, `kt` 0,6 … 0,7, `fd` 0,2 … 0,3.
- **Akkoorden:** `chord` `maj`, `min`, `min7`, `maj7` of `sus2`, `spread` 1 (open) voor een voller geluid, `poly` 8 of hoger. Elke noot die een sequencer stuurt wordt de grondtoon van het akkoord.
- **Arpeggio of sequencer:** het apparaat heeft er zelf geen. Kies korte noten: `ad` 0,15 … 0,3, `as` 0 … 0,3, `ar` 0,05 … 0,2, geen akkoord, `uni` 1 … 3. Een lange `ar` laat noten door elkaar lopen en vult de stemmen.
- **FM-klanken (keys, bel, glas):** `type` `fm` met `fmr` een geheel getal (1, 2, 3) voor een harmonische klank of een niet-geheel getal (3,01; 3,5; 7) voor een belachtige klank; `fmi` 1 … 4; korte `aa` en een `as` rond 0 of 0,2 voor een aanslag die uitsterft.

## Wat een tune niet moet doen

Het apparaat kan niet voor altijd stilvallen of `NaN` geven (zie hieronder), maar je kunt wel een tune maken die onbruikbaar klinkt:

- `lvl` 0, of alle drie de oscillators `on: false`, of alle `lvl` 0: stil.
- Een oscillator met `type` `noise` als enige bron: bijna onhoorbaar (zie hierboven).
- Een `aa` die langer is dan de noten die erop gespeeld worden: de noot klinkt dan maar voor een deel van zijn attack en dus zacht (zie bij de envelopes). Een `aa` van meer dan ongeveer 0,5 s hoort alleen bij lange noten of het klavier.
- `fm21` of `ring` hoger dan 0 terwijl oscillator 1 of 2 uit staat: geen effect.
- `chord` met vijf noten (`min9`) en `uni` 7 en `poly` 12: te zwaar voor de processor.
- `f1.res` 20 met `lp24` en een cutoff dicht bij de toonhoogte, op een geluid met sterke boventonen: schreeuwt en wordt hard. Kies `lvl` lager.
- `f2on` aan met `route` `serial` en twee smalle `bp`-filters: bijna stil.
- Noten verwachten die blijven klinken zonder `dur`: een noot zonder `dur` duurt 0,25 s.
- Geen velden verzinnen, geen routing of patroon in de tune zetten, geen merknamen van bestaande apparatuur in naam of omschrijving.

## Bewaker

Een meter kijkt om de 50 ms naar de ruwe uitvoer van de filters van alle stemmen, vóór de vervormer (die een ontsporing anders verbergt). Wordt die niet eindig (`NaN`, `Infinity`) of absurd groot (boven ±1000; in normaal gebruik gemeten tot ongeveer 110), dan worden alle stemmen direct stilgezet, zodat één ontspoord filter geen `NaN` naar de rest van de studio blijft sturen en het apparaat niet voor altijd stil blijft. Bij een tweede ontsporing binnen een seconde krijgen nieuwe stemmen een tijdje geen snelle sturing van cutoff en resonantie (2 s, daarna steeds langer tot een minuut), zodat een modulator die de oorzaak is niet steeds opnieuw stemmen laat ontsporen. In een offline render staat de meter uit. Test extreme instellingen altijd ook met een modulator (zeker een snelle modulatie van cutoff of resonantie).

## Een tune

Een pack heet `naam.patchkamer-tunes.json` en staat in `../../../tunes/`. Het formaat en de licentie (`CC0-1.0` voor alles in `tunes/`) staan in `../../../tunes/AGENTS.md`. Voor dit apparaat is `device` altijd `nl.patchkamer.polysynth` en elke tune is `kind: "set"` met een `state` als hierboven. Zet geen merknamen van bestaande apparatuur in naam of omschrijving, en verzin geen persoon bij `author`.

## Controleren

- Draai vanuit de root van de repo: `node contract/validate-instrument.mjs devices/synths/TripleOscPoly/triple-osc-poly.patchkamer-device.js` (en met `--lang en`). Dat moet `OK` geven, zonder `let op`.
- Je kunt niet horen hoe een tune klinkt. Heb je een browser, laad dan de host (`../../../patchkamer/AGENTS.md`) en kies de tune. Heb je geen browser, schrijf dan in je oplevering dat de tune **niet beluisterd** is.
- Alle tekst in het apparaat staat in het woordenboek `EN` bovenin het bestand (Nederlandse bron, Engels via `host.lang`). Een nieuwe tekst krijgt altijd nl én en.

## Wat je niet doet

- Verander nooit de `id`, de `kind`, de poort-id's of de namen van state-velden.
- Pas het apparaat niet aan om een tune te laten kloppen.
- Commit of push niet, tenzij de opdracht dat vraagt.

## Documentatie en songs

Dit zijn de plaatsen waar je terechtkunt voor documentatie en voor het componeren van songs met dit apparaat. Songs zijn CC-BY-4.0, tunes en presets CC0-1.0, het apparaat AGPL-3.0-or-later.

- Handleiding van Triple Osc Poly: [NL](../../../docs/synths/USER-MANUAL_NL.md#triple-osc-poly) · [EN](../../../docs/synths/USER-MANUAL_EN.md#triple-osc-poly).
- Overzicht van de soort: [README](../README.md); handleiding van de hele soort: [NL](../../../docs/synths/USER-MANUAL_NL.md) · [EN](../../../docs/synths/USER-MANUAL_EN.md).
- Tunes (klanken, `kind: set`): [triple-osc-poly-styles.patchkamer-tunes.json](../../../tunes/triple-osc-poly-styles.patchkamer-tunes.json). Kies een tune als beginpunt voor de `state` van dit apparaat in de song; velden die de tune niet noemt krijgen hun standaard. Hoe tunes zijn opgebouwd: [tunes/AGENTS.md](../../../tunes/AGENTS.md).
- Overzicht van alle apparaten en hun signaalketens: [devices/AGENTS.md](../../../devices/AGENTS.md). Een song componeren: [songs/AGENTS.md](../../../songs/AGENTS.md).
- Rol in een song: meerstemmige subtractieve synth voor leads, pads en akkoorden. Noten op `notes`, audio uit `out` (stereo).
