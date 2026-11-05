# AGENTS.md: Euclidean Rhythms

Dit bestand is voor AI-agents die dit apparaat configureren, er ritmes of melodieën mee componeren, of er presets voor maken. Het is niet geschreven voor mensen. Het hoort bij `../../../AGENTS.md` (algemeen); lees die eerst. Hier staat wat alleen voor Euclidean Rhythms geldt.

## Wat Euclidean Rhythms is

Een ritmesequencer met **acht rijen**. Elke rij verdeelt een aantal **slagen** (`pulses`) zo gelijk mogelijk over een aantal **stappen** (`steps`, 1 tot 32), schuift het patroon op met een **rotatie** (`rot`) en loopt in een eigen **raster** (`div`, van 1/4 tot 1/64, ook triolen). Zo ontstaan bekende ritmes (3 over 8 is een tresillo, 5 over 8 een cinquillo, 7 over 12 een bembé-bel) en polyritmes, omdat elke rij een eigen lengte heeft. Het apparaat maakt **zelf geen geluid**: het stuurt gebeurtenissen naar één uitgang, `trigs`. Een rij stuurt een **trig** (`out` is `ch1` … `ch8`, voor een drumapparaat) of een **noot** (`out` is `noot`, voor een synth of een andere notenontvanger).

Wat een rij speelt, is volledig **gegenereerd uit getallen**; er staat geen lijst noten in de state. Je componeert dus door getallen te kiezen (steps, pulses, rot, div) en door velocity-, lengte- en kansvelden per rij in te stellen.

| | |
|---|---|
| Bestand | `euclidean-rhythms.patchkamer-device.js` (in deze map) |
| `id` | `nl.patchkamer.euclidean`. Verander die nooit: daaraan hangen presets en songs van gebruikers |
| Naam | `Euclidean Rhythms` in alle talen; poortnamen hebben een Nederlandse variant (via `i18n`) |
| Soort | `utility` (categorie `sequencer`): dit apparaat krijgt dus **presets** (geen tunes) |
| Poorten | eventingangen `reset` (Reset) en `keys` (Notes in / Noten in), eventuitgang `trigs` (Trigs / notes); geen audio, geen modulatie |
| Contract | v1.14 (apparaatversie 1.14.0) |
| Licentie apparaat | AGPL-3.0-or-later |

Dit apparaat is de nieuwe, bijgewerkte vorm van een ouder bestand met een andere naam en id (Euclides, `nl.patchkamer.euclides`). Presets of songs uit die tijd verwijzen naar de oude id en laden hier niet in. Een oude state die je zelf in dit apparaat zet (zonder de nieuwe velden) klinkt gelijk aan vroeger: alle nieuwe velden hebben als standaard het oude gedrag.

## Geen tunes, wel presets

Alleen apparaten met `kind: 'instrument'` hebben tunes. Euclidean Rhythms is een `utility`, dus het krijgt **presets** en **nooit tunes** (contract §0 en §13c). Het pack heet `euclidean-rhythms.patchkamer-presets.json` en staat in `../../../presets/`; formaat volgens contract §13c, `formatVersion` 2, licentie `CC0-1.0`, `device` is `nl.patchkamer.euclidean`, elke preset is `kind: "set"`.

## De state

`getPreset()` geeft `getState()` zonder `sel` en `run` (werkstand: gekozen rij en lopen/stop). `setPreset` laat die twee staan. De state is gewone JSON.

| Veld | Wat | Bereik | Start |
|---|---|---|---|
| `preset` | Naam van het ingebouwde voorbeeld of `Custom`. Alleen een label, het verandert niets aan het geluid | `Drum kit`, `Afro-Cuban`, `Bembe (7 over 12)`, `Polyrhythm 3·4·5·7`, `Techno`, `IDM stutter`, `Melodic (notes)`, `Custom`. Een andere waarde geeft `Drum kit`. Zet in een preset `Custom` | `Drum kit` |
| `run` | Loopt de sequencer (werkstand) | `true`/`false` | `true` |
| `sel` | Gekozen rij (0 = rij 1): de rij die een toetsenbord live bespeelt en die de onderste regelaars bewerken (werkstand) | hele getallen 0 … 7 | 0 |
| `live` | Een toetsenbord op `keys` speelt de gekozen rij live | `true`/`false` | `true` |
| `rows` | **Acht** rij-objecten (zie hieronder) | lijst van 8 | de rijen van `Drum kit` |

Een getal buiten het bereik wordt afgekapt; een tekst, `NaN`, `Infinity`, `null` of een ontbrekende waarde geeft de standaard. Een ontbrekende of ongeldige rij krijgt de standaardrij van `Drum kit` op die plek (en die **speelt**). Geef daarom in een preset altijd **alle acht rijen**, volledig, en zet ongebruikte rijen op `"on": false`.

### Een rij in `rows`

| Veld | Wat | Bereik | Standaard (nieuw) |
|---|---|---|---|
| `on` | Speelt de rij | `true`/`false` | zie `Drum kit` |
| `steps` | Lengte van het patroon in stappen | hele getallen 1 … 32 | 16 |
| `pulses` | Aantal slagen, zo gelijk mogelijk over de stappen verdeeld | 0 … `steps` | 0 |
| `rot` | Rotatie: het patroon schuift zoveel stappen naar rechts | 0 … `steps`−1 | 0 |
| `div` | Raster: hoeveel stappen er per zestiende noot langskomen (tekst) | `"4"` = 1/64, `"3"` = 1/32 triool, `"2"` = 1/32, `"1.5"` = 1/16 triool, `"1"` = 1/16, `"0.75"` = 1/8 triool, `"0.5"` = 1/8, `"0.25"` = 1/4; anders `"1"` | `"1"` |
| `out` | Uitvoer: een spoor-trig of een noot | `"ch1"` … `"ch8"` of `"noot"` (de Nederlandse waarde blijft; `"note"` wordt gelezen als `"noot"`) | zie `Drum kit` |
| `note` | Nootnummer (alleen bij `out: "noot"`) | 12 … 108 | 60 |
| `vel` | Basisvelocity van de slagen | 0,05 … 1 | 0,8 |
| `acc` | Aantal accenten: zoveel van de slagen klinken als accent, euclidisch over de slagen verdeeld | 0 … 32 | 0 |
| `accVel` | Velocity van een accent (absoluut) | 0,05 … 1 | 1 |
| `softVel` | Velocity van de andere slagen in een rij met accenten, als deel van `vel` | 0,05 … 1 | 0,75 |
| `ghost` | Aantal ghost notes: zoveel van de **niet-accent** slagen worden ghost notes, euclidisch verdeeld | 0 … 32 | 0 |
| `ghostVel` | Velocity van een ghost note, als deel van `vel` | 0,05 … 1 | 0,35 |
| `curve` | Verloop van de velocity over de stappen van het patroon | `"flat"`, `"up"` (crescendo), `"down"` (decrescendo), `"arch"` (zacht, hard, zacht) | `"flat"` |
| `curveAmt` | Diepte van het verloop (0 = geen) | 0 … 1 | 0 |
| `human` | Menselijke variatie: willekeurige afwijking in velocity (tot ±30%) en lengte (tot ±20%) | 0 … 1 | 0 |
| `gate` | Notenlengte als deel van één rasterstap van deze rij | 0,05 … 4 | 0,5 |
| `prob` | Kans dat een slag klinkt | 0 … 1 | 1 |
| `fill` | Fill om de N maten: `"0"` (geen), `"2"`, `"4"`, `"8"`; de fill valt in de laatste maat van elke N | een van die vier | `"0"` |
| `fillMode` | `"dubbel"` (in de fill-maat ongeveer 1,6 keer zoveel slagen) of `"ratchet"` (elke slag wordt twee korte slagen) | `"dubbel"` of `"ratchet"` | `"dubbel"` |
| `mut` | Mutatie: kans per maat dat de rotatie één stap verspringt | 0 … 1 | 0 |

De velden `accVel`, `softVel`, `ghost`, `ghostVel`, `curve`, `curveAmt`, `human` en het bereik van `gate` (vroeger tot 1) zijn nieuw. Alle waarden die vroeger geldig waren, blijven dat.

## Hoe de tijd loopt

De klok geeft elke zestiende noot (`onStep`). Elke rij telt in zijn eigen raster: een rij met `div: "1"` heeft één stap per zestiende, `"0.5"` één per achtste, `"2"` twee per zestiende, `"4"` vier per zestiende. De lengte van het patroon in zestienden is `steps / div`:

| `steps` | `div` | Lengte in maten (een maat = 16 zestienden) | Gebruik |
|---|---|---|---|
| 16 | `"1"` | 1 maat | standaard drumpatroon |
| 8 | `"1"` | een halve maat | 3 over 8 als 3-3-2 over twee tellen, herhaalt twee keer per maat |
| 8 | `"0.5"` | 1 maat | tresillo/cinquillo over acht achtsten |
| 12 | `"0.75"` | 1 maat | 12/8-gevoel (bembé, 6/8, shuffle) |
| 7 | `"0.5"` | 14 zestienden (7/8) | oneven maat |
| 5 | `"0.25"` | 5 kwarten | polymeter tegen een maat van 4 |
| 32 | `"2"` | 1 maat | 1/32-rollen met een hele maat als cyclus |
| 32 | `"4"` | een halve maat | 1/64-rollen |
| 32 | `"0.5"` | 4 maten | iets dat één keer per vier maten gebeurt (crash) |

Alles loopt vanaf stap 0 van de transportstart; een stop zet de tellers terug. Een `trig` of `note` op de ingang `reset` laat alle rijen opnieuw beginnen. `fill` en `mut` tellen **hele maten van de klok** (16 zestienden), niet maten van het patroon van de rij.

### Het euclidische patroon

Slag `i` (van 0) klinkt als `(i * pulses) % steps < pulses`, daarna verschoven met `rot`. Enkele patronen met `rot: 0` (`x` is een slag):

| Patroon | Stappen | Slagen | Ziet eruit als |
|---|---|---|---|
| vier op de vloer | 16 | 4 | `x...x...x...x...` |
| tresillo | 8 | 3 | `x..x..x.` |
| cinquillo | 8 | 5 | `x.x.xx.x` |
| 4 over 9 (aksak) | 9 | 4 | `x..x.x.x.` |
| bembé-bel | 12 | 7 | `x.xx.x.xx.x.` |
| 5 over 16 | 16 | 5 | `x...x..x..x..x..` |

Een tegenmaat (backbeat) is `steps 16, pulses 2, rot 4` (stap 4 en 12). Een offbeat-hat is `16, 4, rot 2`. Een slag op alleen tel 3 is `16, 1, rot 8`.

**Meerdere rijen op één uitgang.** Rijen mogen dezelfde `out` delen; ze tellen bij elkaar op. Zo maak je patronen die niet euclidisch zijn: een tweestaps-kick op stap 0 en 10 is rij A `16, 1, rot 0` plus rij B `16, 1, rot 10`, beide `ch1`. **Laat rijen op dezelfde uitgang niet op dezelfde stap vallen**: dan klinkt de slag dubbel (bij trigs harder, bij noten tweemaal dezelfde noot). Kies een rotatie zonder botsing en controleer het (zie "Controleren").

## Velocity: sterker, zwakker, accenten, ghost notes

Per slag is de velocity (altijd binnen 0,05 … 1):

1. een **accent** (`acc`): `accVel`;
2. anders een **ghost note** (`ghost`): `vel × ghostVel`;
3. anders een gewone slag: `vel × softVel` als de rij accenten heeft (`acc > 0`), anders `vel`;
4. daarna `× verloop`: bij `curve` ongelijk aan `flat` en `curveAmt > 0` een factor `1 − curveAmt × (1 − vorm)`, met vorm = positie in het patroon (`up`), 1 − positie (`down`) of een boog (`arch`);
5. daarna (alleen bij `human > 0`) een willekeurige afwijking.

Accenten en ghost notes zijn **euclidisch verdeeld**: `acc: 4` bij 16 slagen is een accent op elke vierde slag; `ghost: 6` bij 12 overgebleven slagen is een ghost note op elke tweede. Hoe sterker het contrast (`accVel` 1, `vel` 0,6, `ghostVel` 0,35), hoe levendiger het ritme. Rijen met accenten klinken door `softVel` standaard 25% zachter dan `vel`; zet `softVel` op 1 als je dat niet wilt.

Dynamiek per spoor: geef elke rij zijn eigen `vel`. Richtwaarden voor drums: kick 0,9 … 1, snare/clap 0,8 … 0,95, closed hat 0,5 … 0,7 met accenten (`acc: 4`, `accVel` 0,8, `softVel` 0,5, `ghost` 3 … 4), open hat 0,6 … 0,8, shaker en percussie 0,3 … 0,5, ghost snares 0,25 … 0,35. Crescendo naar een break: `curve: "up"`, `curveAmt` 0,6 … 1. Een rij die achter de maat moet blijven hangen als een mens: `human` 0,15 … 0,3; houd kicks op 0 voor een strak geluid.

Velocity in de uitgang is `vel` (0 … 1) in elk gebeurtenis; een ontvangend apparaat schaalt dat zelf.

## Notenlengte (gate) en rasterkeuze

Voor `out: "noot"` is de duur van de noot in seconden `dur = (stepDur / div) × gate`, met `stepDur` de duur van een zestiende noot uit de klok (de host rekent het tempo mee). Eén rasterstap van de rij is dus `gate: 1`:

| Bedoeld | `div` | `gate` |
|---|---|---|
| staccato (kort) | elke | 0,15 … 0,3 |
| normaal | elke | 0,5 |
| legato (net aansluitend) | elke | 1 |
| lang over meerdere slagen, overlappend | elke | 1,5 … 4 |
| hele noot in een rij van zestienden | `"1"` | 4 (en `steps` zo dat de noot vrij kan klinken: één slag per 4 stappen of meer) |

Voor trigs (`out: "ch1"` …) heeft `gate` **geen effect**: een trig heeft geen lengte. Een ratchet (`fillMode: "ratchet"`) geeft twee korte slagen van 0,4 stap, ook bij noten.

Overlap: een noot met `gate` > 1 klinkt nog als de volgende slag van dezelfde rij begint. Een monofone synth breekt dan af en schuift naar de nieuwe noot (legato); een polyfone synth laat ze door elkaar klinken. Voor een mono bas houd je `gate` tot 1 … 1,7 en laat je slagen niet op dezelfde stap vallen.

**Wanneer welk raster.**

| Raster | Wanneer |
|---|---|
| `"1"` (1/16) | standaard voor drums en bas; rustige patronen |
| `"0.5"` (1/8) en `"0.25"` (1/4) | langzame lagen, tresillo over een maat, polymeters tegen de maat, ritmes in 7/8 en 9/8 |
| `"0.75"` (1/8 triool) en `"1.5"` (1/16 triool) | shuffle, 12/8, 6/8, triolen, hip-hop rollen |
| `"2"` (1/32) | hat-rollen, snare-rollen, dubbele slagen, stotter |
| `"3"` (1/32 triool) | snelle triolenrollen (trap), vallende figuren |
| `"4"` (1/64) | ratchets, grace notes (flam, drag), opbouw die in een tel versnelt; houd het kort en met `prob` of een `curve` |

Een **flam** (een zachte slag vlak vóór een harde) is twee rijen op dezelfde uitgang: rij A `steps 32, pulses 1, rot 16, div "4", vel 0,35` en rij B `steps 32, pulses 1, rot 17, div "4", vel 1`. Een **drag/roll**-opbouw is één rij `steps 32, pulses 32, div "4"` met `curve: "up"`.

Een **swing** hoort bij de klok van de studio (`host.swing`), niet bij dit apparaat; gebruik voor een shuffle liever `div: "0.75"` met 12 stappen.

## Uitvoer en gebeurtenissen

Elke slag wordt een gebeurtenis op `trigs`:

```json
{ "type": "trig", "lane": "ch1", "vel": 0.95, "time": 12.5 }
{ "type": "note", "note": 36, "vel": 0.85, "time": 12.5, "dur": 0.11 }
```

`time` is AudioContext-tijd (de host plant vooruit), `lane` is `ch1` … `ch8`, `vel` 0 … 1 (nooit 0), `note` een geheel getal 0 … 127, `dur` een eindig getal groter dan 0. Verbind `trigs` met een drumapparaat (het ontvangt `trig` met `lane`: kanaal 1 tot 8 spelen het instrument op dat kanaal) of met een synth/bas (die ontvangt `note`). Een apparaat negeert wat het niet kent: sluit je een synth aan op een preset die ook `ch`-rijen heeft, dan klinken alleen de noot-rijen.

### Indeling van de kanalen in de meegeleverde presets

De drumpresets gebruiken één kanaalplan; stel het drumapparaat daarop in:

| Kanaal | Rol |
|---|---|
| `ch1` | kick of lage trom |
| `ch2` | snare, clap of middentrom |
| `ch3` | gesloten hi-hat of shaker |
| `ch4` | open hi-hat of hoge trom |
| `ch5` | percussie A (rim, clave, bel) |
| `ch6` | percussie B (cowbell, woodblock) |
| `ch7` | percussie C (shaker, tamboerijn, tom; in de rollen ook hat-roll) |
| `ch8` | crash of effect |

## Klanken van de drumcomputer tonen

Hangt aan `trigs` een apparaat dat `noteNames()` heeft (contract v1.14: Drum Kit, Pulse Drums, Click Synth, Latin Percussion), dan leest dit apparaat die lijst via `host.cablesFrom(self, 'trigs')` en `host.peers` / `onPeers`. De uitgangskeuze per rij toont dan `k · naam` in plaats van `Spoor k` (de naam op plaats k van het apparaat), en de nootkeuze van de gekozen rij toont de namen achter de nootnamen (`C2 · Bass drum`). Wijzigt het apparaat kit, volgorde of noot, dan volgen de teksten direct. Alleen de teksten veranderen: `out` en `note` in de state en de gebeurtenissen blijven gelijk. `Spoor k` is het k-de kanaal van de drumcomputer; hebben twee kanalen dezelfde noot, dan telt de lijst die noot één keer en kan de naam een plaats opschuiven. Zonder kabel of zonder namen is alles als voorheen.

## Live spelen met een toetsenbord

Sluit een toetsenbord (device Keys of een andere notenbron) aan op de ingang `keys` (Notes in). Staat `live` aan, dan gaat wat je speelt **direct naar de uitgang `trigs`**, afhankelijk van de **gekozen rij** (rij-nummer aanklikken, of `sel`):

- Heeft de gekozen rij `out: "noot"`: de noot gaat door met je toetsaanslag (`vel`), met `held: true` en een `noteoff` bij het loslaten als de bron dat meestuurt; kort aangeslagen noten gaan door met hun eigen `dur`. De toonhoogte is die van je toets, niet de `note` van de rij.
- Heeft de gekozen rij `out: "ch1"` … `"ch8"`: elke aanslag wordt een trig op dat kanaal met de velocity van je toets (je speelt het drumapparaat met je vingers, elke toets op dezelfde lane).

Verbind daarvoor **geen tweede kabel** van het toetsenbord naar de synth of het drumapparaat. Is het toetsenbord toch ook rechtstreeks met het apparaat verbonden, dan hoor je het dubbel; dat is de keuze van de gebruiker. Wissel je van gekozen rij, zet je `live` uit, laad je een state of verwijder je het apparaat, dan sluit het apparaat alle hangende noten af met een `noteoff`; een `allnotesoff` of `panic` op de ingang doet hetzelfde. **Opnemen in een patroon bestaat niet**: een rij is een formule (steps, pulses, rot), geen lijst noten, dus er is geen clip om in te schrijven. Wil je ingespeelde noten bewaren, gebruik dan een clip- of patroon-sequencer.

## Componeren met dit apparaat

1. Kies de **rollen**: welke rijen drums (trigs) en welke noten. Zet ongebruikte rijen op `"on": false`.
2. Kies per rij de **verdeling**: begin met `steps 16` en 2 … 5 slagen voor een basis, `steps 8/12` voor een tresillo- of 12/8-gevoel, vreemde lengtes (5, 7, 9, 11, 13) voor een polymeter.
3. Zet **rotatie** zo dat de slagen op de gewenste stappen vallen (backbeat = rot 4 bij 2/16).
4. Geef **dynamiek**: `vel` per rij, accenten, ghost notes, `human` op hats en percussie.
5. Voeg **variatie** toe: `prob` 0,7 … 0,9 op percussie, `mut` 0,2 … 0,4 op een rij die mag dwalen, `fill` om de 4 of 8 maten.
6. Bij noten: kies `note` per rij, `gate` per rij (kort voor stabs, 1 … 1,7 voor bas, 2,5 … 4 voor akkoorden), en houd rijen die samen een akkoord vormen op dezelfde `steps`, `pulses`, `rot` en `div`.

### Voorbeeld: drums met accenten en ghost notes

Hiermee zijn alle acht rijen gegeven (rij 6 tot 8 uit); dit is de preset `Four On The Floor` uit het pack:

```json
{
  "preset": "Custom", "live": true,
  "rows": [
    {"on":true,"steps":16,"pulses":4,"rot":0,"div":"1","out":"ch1","note":60,"vel":0.95,"acc":0,"prob":1,"fill":"0","fillMode":"dubbel","mut":0,"gate":0.5,"accVel":1,"softVel":0.75,"ghost":0,"ghostVel":0.35,"curve":"flat","curveAmt":0,"human":0},
    {"on":true,"steps":16,"pulses":2,"rot":4,"div":"1","out":"ch2","note":60,"vel":0.85,"acc":0,"prob":1,"fill":"0","fillMode":"dubbel","mut":0,"gate":0.5,"accVel":1,"softVel":0.75,"ghost":0,"ghostVel":0.35,"curve":"flat","curveAmt":0,"human":0},
    {"on":true,"steps":16,"pulses":4,"rot":2,"div":"1","out":"ch4","note":60,"vel":0.65,"acc":0,"prob":1,"fill":"0","fillMode":"dubbel","mut":0,"gate":0.5,"accVel":1,"softVel":0.75,"ghost":0,"ghostVel":0.35,"curve":"flat","curveAmt":0,"human":0.15},
    {"on":true,"steps":16,"pulses":16,"rot":0,"div":"1","out":"ch3","note":60,"vel":0.6,"acc":4,"prob":1,"fill":"0","fillMode":"dubbel","mut":0,"gate":0.5,"accVel":0.85,"softVel":0.5,"ghost":0,"ghostVel":0.35,"curve":"flat","curveAmt":0,"human":0.2},
    {"on":true,"steps":16,"pulses":3,"rot":3,"div":"1","out":"ch5","note":60,"vel":0.5,"acc":0,"prob":0.8,"fill":"0","fillMode":"dubbel","mut":0,"gate":0.5,"accVel":1,"softVel":0.75,"ghost":0,"ghostVel":0.35,"curve":"flat","curveAmt":0,"human":0.2},
    {"on":false,"steps":16,"pulses":0,"rot":0,"div":"1","out":"ch8","note":60,"vel":0.8,"acc":0,"prob":1,"fill":"0","fillMode":"dubbel","mut":0,"gate":0.5,"accVel":1,"softVel":0.75,"ghost":0,"ghostVel":0.35,"curve":"flat","curveAmt":0,"human":0},
    {"on":false,"steps":16,"pulses":0,"rot":0,"div":"1","out":"ch8","note":60,"vel":0.8,"acc":0,"prob":1,"fill":"0","fillMode":"dubbel","mut":0,"gate":0.5,"accVel":1,"softVel":0.75,"ghost":0,"ghostVel":0.35,"curve":"flat","curveAmt":0,"human":0},
    {"on":false,"steps":16,"pulses":0,"rot":0,"div":"1","out":"ch8","note":60,"vel":0.8,"acc":0,"prob":1,"fill":"0","fillMode":"dubbel","mut":0,"gate":0.5,"accVel":1,"softVel":0.75,"ghost":0,"ghostVel":0.35,"curve":"flat","curveAmt":0,"human":0}
  ]
}
```

De gesloten hat is rij 4: 16 slagen over 16 stappen met `acc: 4` (accent op elke vierde, velocity 0,85), de andere hats op 0,6 × 0,5 = 0,3.

### Voorbeeld: een noot-rij (basfiguur, korte en lange noten)

Rij 1 (de rest van de acht rijen als hierboven, ongebruikt of kick):

```json
{"on":true,"steps":16,"pulses":5,"rot":0,"div":"1","out":"noot","note":36,"vel":0.85,"acc":2,"prob":1,"fill":"0","fillMode":"dubbel","mut":0,"gate":0.55,"accVel":1,"softVel":0.7,"ghost":0,"ghostVel":0.35,"curve":"flat","curveAmt":0,"human":0}
```

Vijf noten per maat (C2, MIDI 36), twee ervan als accent (velocity 1), de rest 0,85 × 0,7 = 0,6, elk 0,55 zestiende lang. Voeg een tweede rij toe met `note: 48`, `gate: 0.3`, `pulses: 3`, `rot: 5` voor korte octaafnoten ertussen.

### Per genre en rol (instellen voor een goede preset)

- **Techno, house:** kick `16, 4`; clap `16, 2, rot 4`; open hat `16, 4, rot 2`; closed hat `16, 11 … 16` met `acc: 4`, `ghost: 3`; percussie `16, 5 … 7` met `prob` 0,85 en `mut` 0,2; om de 4 maten een ratchet-fill op de clap (`fill: "4"`, `fillMode: "ratchet"`).
- **Afro, Latin:** de bel of clave als rij met 5 over 8, 7 over 12 of 5 over 16, `acc` 2 … 3 voor de nadruk, een lage trom op 3 over 8; shaker `16, 16` met `acc: 4` en `human: 0,25`; 12/8 via `steps 12, div "0.75"`.
- **Dub, reggae:** `16, 1, rot 8` voor de one drop (kick en rim op tel 3), halve noten voor de bas (`gate` 1,4), akkoorden op de offbeat met vier noot-rijen `16, 4, rot 2`, `gate` 0,3.
- **Drum & bass, breakbeat:** twee kick-rijen op één uitgang (stap 0 en stap 10), snare `16, 2, rot 4`, ghost snares als aparte rij met `vel` 0,3, hats `16, 8` of 1/32 (`steps 32, div "2"`); halftime met één snare op stap 8.
- **Polyritmes:** rijen met onderling priemgetallen of vreemde lengtes (5, 7, 11, 13) tegen een rij van 16; of `div "0.25"` met 3, 4, 5, 7 stappen voor een nested cycle die pas na een lange tijd opnieuw samenvalt.
- **Rolls, fills:** 1/32 of 1/64 met `curve: "up"`; dubbele slagen via `fill: "2"` of `"4"`; flam via twee rijen met een zachte voorslag.
- **Bas en melodie:** noot-rijen met eigen `note`; houd akkoorden gelijk in `steps/pulses/rot/div`; lange `gate` (2,5 … 4) voor pads; `prob` en `mut` laten de figuur leven.

### Wat een preset niet moet doen

- Een rij met `on: true` en `pulses: 0`, of alle rijen `on: false`: stil.
- Minder dan acht rijen of een onvolledige rij: ontbrekende rijen en velden krijgen de standaard van `Drum kit`, en die **speelt**.
- Rijen op dezelfde uitgang op dezelfde stap: dubbele slag.
- `acc` groter dan `pulses`: elke slag is dan een accent; `ghost` groter dan het aantal niet-accent slagen: elke overgebleven slag is een ghost note.
- `gate` boven 1 op een mono bas bij dichte slagen: hangende, onrustige noten.
- 1/64 (`div "4"`) of 1/32 zonder `prob`, `curve` of beperking: een constante vlaag zonder muzikale vorm.
- `fill` of `mut` op alle rijen tegelijk: de maat verandert overal en het ritme valt uit elkaar.
- Velocity 0 of een `vel` onder 0,05: wordt afgekapt; wil je stilte, zet de rij uit of de kans op 0.
- Geen routing in de state: de kabels horen er niet in. Geen velden verzinnen. Geen `sel` of `run` in een preset.

## Meegeleverd presetpack

`../../../presets/euclidean-rhythms.patchkamer-presets.json` ("Euclidean Rhythms Grooves"): 65 presets in 8 mappen: Techno (8), House (7), Afro & Latin (11), Dub & Reggae (6), Drum & Bass and Breakbeat (8), Odd Meters and Polymeters (8), Fills and Rolls (8) en Melodic (notes) (9). Alle presets gebruiken acht volledige rijen en `preset: "Custom"`.

## Wat het apparaat met een state doet (getest)

- `setState({})` geeft alle startwaarden; `setState(getState())` en `setPreset(getPreset())` geven dezelfde state terug; `setPreset({})` en `setPreset(null)` geven geen uitzondering en laten `sel` en `run` staan.
- Ongeldige waarden (`NaN`, `Infinity`, tekst, `null`, ontbrekende velden, onbekende `div`/`out`/`curve`) geven de standaard of worden afgekapt; er komt geen uitzondering. De kaart (alle keuzes en regelaars) volgt `setState`.
- In 400 willekeurige runs met rommel in de state, in `onStep` (`bar`, `step`, `time`, `stepDur`: `NaN`, `Infinity`, tekst, `1e18`) en op de ingangen kwamen er alleen eindige noten van 0 … 127, `vel` in 0,05 … 1 (bij `keys` ook de velocity van de bron, groter dan 0), `dur` groter dan 0 en tijden die eindig zijn uit (158 381 gebeurtenissen, geen enkele afwijking).
- Gelijkheid met het oude apparaat (Euclides): 314 willekeurige runs (96 841 gebeurtenissen) met willekeurige oude states, tempo's, resets en transportwisselingen gaven precies dezelfde gebeurtenissen (dezelfde noot, velocity, duur, tijd, lane) als het oude bestand, met dezelfde reeks willekeurige getallen.
- Alle 65 presets: `setPreset` gevolgd door `getPreset` geeft dezelfde state, vier maten spelen eindige gebeurtenissen, niet stil, geen twee presets met dezelfde uitvoer.
- Niet beluisterd; er is geen echt drumapparaat of echte synth aan gekoppeld getest, en geen echt MIDI-toetsenbord (de live-ingang is getest met gebeurtenissen).

## Controleren

- `node contract/validate-instrument.mjs devices/sequencers/EuclideanRhythms/euclidean-rhythms.patchkamer-device.js --lang nl` en `--lang en`, vanuit de root. Beide moeten `OK` geven, zonder `let op`.
- Alle tekst in het apparaat staat in het woordenboek `EN` bovenin het bestand. Een nieuwe tekst krijgt altijd nl én en.
- Controleer een preset op botsingen: laat `onStep` vier maten lopen met `prob` op 1 en kijk of twee gebeurtenissen op dezelfde lane (of noot) en `time` vallen.

## Wat je niet doet

- Verander nooit de `id`, de `kind`, de poort-id's of de namen van state-velden. De waarden `noot`, `dubbel` en `ratchet` blijven zoals ze zijn.
- Pas het apparaat niet aan om een preset te laten kloppen.
- Zet geen merknamen van bestaande apparatuur in naam of omschrijving, en verzin geen persoon bij `author`. Noem een ritme bij zijn algemene naam (tresillo, cinquillo, bossa, dembow), niet bij een artiest of nummer.
- Commit of push niet, tenzij de opdracht dat vraagt.

## Documentatie en songs

Dit zijn de plaatsen waar je terechtkunt voor documentatie en voor het componeren van songs met dit apparaat. Songs zijn CC-BY-4.0, tunes en presets CC0-1.0, het apparaat AGPL-3.0-or-later.

- Handleiding van Euclidean Rhythms: [NL](../../../docs/sequencers/USER-MANUAL_NL.md#euclidean-rhythms) · [EN](../../../docs/sequencers/USER-MANUAL_EN.md#euclidean-rhythms).
- Overzicht van de soort: [README](../README.md); handleiding van de hele soort: [NL](../../../docs/sequencers/USER-MANUAL_NL.md) · [EN](../../../docs/sequencers/USER-MANUAL_EN.md).
- Presets (patronen en instellingen, `kind: set`): [euclidean-rhythms.patchkamer-presets.json](../../../presets/euclidean-rhythms.patchkamer-presets.json). Kies een preset als beginpunt voor de `state` van dit apparaat in de song; velden die de preset niet noemt krijgen hun standaard.
- Sequencers in het algemeen (raster, velocity, lengte, timing, accenten): [NL](../../../docs/sequencers/USER-MANUAL_NL.md#wat-de-sequencers-gemeen-hebben) · [EN](../../../docs/sequencers/USER-MANUAL_EN.md#what-the-sequencers-have-in-common). Muziektheorie vertaald naar waarden: [songs/MUSIC-THEORY.md](../../../songs/MUSIC-THEORY.md).
- Overzicht van alle apparaten en hun signaalketens: [devices/AGENTS.md](../../../devices/AGENTS.md). Een song componeren: [songs/AGENTS.md](../../../songs/AGENTS.md).
- Rol in een song: sturing, ritme (drums, percussie, ritmische figuren) uit acht rijen met `pulses`, `steps` en `rot`. De eventuitgang `trigs` gaat naar een drumcomputer of sampler; `reset` zet het patroon terug en `keys` ontvangt noten.
