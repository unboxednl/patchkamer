# AGENTS.md: Bowed Ensemble

Dit bestand is voor AI-agents die **tunes voor Bowed Ensemble** maken. Het is niet geschreven voor mensen. Het hoort bij `../../../AGENTS.md` (algemeen) en `../../../tunes/AGENTS.md` (regels voor tunepacks); lees die eerst. Hier staat wat alleen voor Bowed Ensemble geldt.

## Wat Bowed Ensemble is

Een polyfoon strijkersensemble met zestien vaste stemmen. Elke stem heeft vier oscillators (drie zaagtanden en een driehoek, licht tegen elkaar verstemd), ruis die een strijkstok (of lucht) nabootst, een lowpass-filter met resonantie en een eigen envelope (ADSR) en stereopositie. Alle stemmen gaan samen door een hoogdoorlaatfilter, twee klankfilters (corpus en aanwezigheid), een chorus met drie tappen (het ensemble-effect), een galm van 5,5 seconden (de concertzaal), een compressor, een volumeregeling met expressie, balans en een zachte begrenzer. Een LFO geeft vibrato en een tweede, trage LFO geeft organische toonhoogtedrift. Er zit **geen sequencer of arpeggiator** in: het apparaat speelt alleen de noten die het op de ingang `notes` krijgt, of de knop Test chord op de kaart.

Het verschil met het apparaat `KarplusString` (in `../KarplusString/`): dat is een fysisch snaarmodel (plukken of strijken van één snaar, per noot gesimuleerd). Bowed Ensemble is een **sectie**: veel gedetuneerde zagen door filter, chorus en zaalgalm, bedoeld voor akkoorden, pads en lange lijnen.

| | |
|---|---|
| Bestand | `bowed-ensemble.patchkamer-device.js` (in deze map) |
| `id` | `nl.patchkamer.bowedensemble`. Verander die nooit: daaraan hangen tunes en songs van gebruikers |
| Naam | `Bowed Ensemble` in alle talen; de poortnamen hebben een Nederlandse variant (via `i18n`: `Keyboard / noten`, `Stereo strijkers`) |
| Soort | `instrument`: dit apparaat krijgt dus **tunes** (geen presets) |
| Poorten | eventingang `notes` (Keyboard / notes), modulatie-ingang `mod`, audio-uitgang `out` (Stereo strings, stereo) |
| Contract | v1.11 |
| Licentie apparaat | AGPL-3.0-or-later |

Dit apparaat is de nieuwe, bijgewerkte vorm van een ouder bestand met een andere naam en id (Strijk Ensemble, `nl.patchkamer.strijk`). Tunes of songs uit die tijd verwijzen naar de oude id en laden hier niet in. De state-sleutels zijn ongewijzigd; de namen van de klanken in de keuzelijst zijn Engels geworden (zie `preset` hieronder).

## Wat je hier doet

Je maakt klanken (tunes) voor Bowed Ensemble en zet ze als pack in `../../../tunes/`. Het apparaat zelf pas je alleen aan als de opdracht dat zegt (`version` ophogen; `id`, poort-id's en state-velden gelijk houden).

## De state

`getState()` geeft alle velden hieronder (21 getallen en tekst, gewone JSON: geen lijsten, geen patroon, geen routing). Er is **geen** `getPreset`: een tune bewaart de hele state. Een waarde wordt op de stap van het veld afgerond en in het bereik afgekapt; een tekst, `NaN`, `Infinity`, `null` of een ontbrekende waarde geeft de startwaarde.

### Klank en articulatie

| Veld | Wat het doet | Bereik | Stap | Start |
|---|---|---|---|---|
| `cutoff` | Helderheid: cutoff van het lowpass-filter van elke stem, in Hz. Hoge noten krijgen automatisch iets meer cutoff (een halve octaaf per vier octaven) | 200 … 14000 | 10 | 4200 |
| `resonance` | Resonantie (Q in dB) van dat filter | 0,2 … 3 | 0,1 | 0,7 |
| `body` | Corpus: laag-midden (330 Hz) wordt voller, de driehoek wordt luider en de zaagtanden iets zachter | 0 … 1 | 0,01 | 0,55 |
| `bow` | Hoeveel strijkstok- of luchtruis er onder de toon zit (bandfilter rond 3,8 kHz) | 0 … 1 | 0,01 | 0,14 |
| `attack` | Opkomst: tijd tot het volle niveau, lineair, in seconden | 0,005 … 5 | 0,005 | 0,32 |
| `decay` | Tijd van het volle niveau naar het sustain-niveau, in seconden | 0,03 … 4 | 0,01 | 0,8 |
| `sustain` | Sustain-niveau (deel van het piekniveau) | 0 … 1 | 0,01 | 0,82 |
| `release` | Uitklank na het loslaten van de noot, lineair, in seconden | 0,05 … 12 | 0,05 | 1,8 |
| `velocity` | Hoeveel de aanslagsterkte het niveau bepaalt (0 = elke noot even hard, 1 = volledig) | 0 … 1 | 0,01 | 0,7 |

### Ensemble en ruimte

| Veld | Wat het doet | Bereik | Stap | Start |
|---|---|---|---|---|
| `detune` | Ensemblezweving: de vier oscillators van een stem staan zoveel cent uit elkaar | 0 … 20 | 0,1 | 6 |
| `vibrato` | Diepte van het vibrato (1 = 20 cent) | 0 … 1 | 0,01 | 0,2 |
| `rate` | Snelheid van het vibrato in Hz | 3 … 8 | 0,1 | 5,1 |
| `human` | Organische drift: trage toonhoogteafwijking per stem (1 = 3,5 cent) | 0 … 1 | 0,01 | 0,35 |
| `ensemble` | Hoeveel van de drie-tapschorus erbij komt (0 = uit) | 0 … 1 | 0,01 | 0,5 |
| `width` | Stereobreedte van de stemmen en van de chorus (0 = alles in het midden) | 0 … 1 | 0,01 | 0,8 |
| `space` | Concertgalm: hoeveel van de 5,5 s lange galm erbij komt | 0 … 1 | 0,01 | 0,3 |
| `pan` | Balans van de hele uitgang (−1 links, 1 rechts) | −1 … 1 | 0,01 | 0 |

### Spel en niveau

| Veld | Wat het doet | Bereik | Stap | Start |
|---|---|---|---|---|
| `transpose` | Transpositie in halve tonen (hele getallen) | −24 … 24 | 1 | 0 |
| `expression` | Expressie: een tweede volumeregelaar achter de compressor (voor zwellen; ook via `cc`) | 0 … 1 | 0,01 | 0,9 |
| `level` | Uitgangsniveau | 0 … 1 | 0,01 | 0,8 |

### Het veld `preset`

| Veld | Wat | Waarden | Start |
|---|---|---|---|
| `preset` | De naam van de gekozen klank in de keuzelijst **Ensemble** op de kaart. Het is alleen een label: het zet zelf niets. De kaart zet het op `Custom` zodra een knop verandert | `Chamber Ensemble`, `Cinematic Strings`, `Velvet Strings`, `Vintage String Machine`, `Disco Strings`, `Slow Bloom`, `Spiccato`, `Pizzicato`, `Dark Cellos`, `Glass Strings`, `Wide Legato`, `String Lead`, `Custom` | `Chamber Ensemble` |

Een ongeldige waarde geeft de startwaarde. De oude Nederlandse namen `Eigen`, `Fluwelen Strijkers` en `Donkere Celli` worden bij het laden herkend (ze worden `Custom`, `Velvet Strings` en `Dark Cellos`). **Zet in een tune `"preset": "Custom"`**: laat je het veld weg, dan staat de keuzelijst op `Chamber Ensemble` terwijl de klank anders is. Zet er nooit een van de andere namen in, want dat is een belofte die niet klopt. De keuzelijst zet de bijbehorende waarden wel echt in de state; je kunt de klankwaarden van de ingebouwde klanken dus als uitgangspunt gebruiken door ze op de kaart te kiezen en `getState()` te lezen.

Velden die niet in een tune horen: er zijn er geen. Wel: er is geen routing, geen patroon en geen klokstand in de state.

## Wat het apparaat met een state doet (getest)

- `setState({})` geeft alle startwaarden; `setState(getState())` geeft dezelfde state terug.
- Getallen buiten het bereik worden afgekapt (`cutoff: 1e9` wordt 14000, `detune: 1e9` wordt 20, `expression: -5` wordt 0); een tekst, `NaN`, `Infinity`, `null` of een ontbrekende waarde geeft de startwaarde. Onbekende velden worden genegeerd. Zet er geen in.
- De knoppen en de keuzelijst op de kaart bewegen mee met `setState`; alle audioparameters gaan zacht over (niet beluisterd).

## Spelen en modulatie

- Eventingang `notes`: `note` (met `dur`), `noteon` en `noteoff` (aangehouden toetsen), `cc` en `panic`/`allnotesoff`. Een `note` zonder `dur` en zonder `noteoff` klinkt door tot er een `panic` komt of de transport stopt: **een sequencer moet altijd `dur` meesturen**. Een `cc` met `id` gelijk aan een veld uit de tabellen en `value` 0 … 1 zet dat veld lineair over zijn bereik (ook bij de logaritmische) en zet `preset` op `Custom`. Een transportstop laat alle noten uitklinken (korter dan 0,35 s).
- Zestien stemmen: een zeventiende noot neemt de stem over die het eerst klaar is (of anders de oudste). Een tune met lange `release` en veel noten laat dus noten afbreken. Elke noot is een eigen stem, ook dezelfde noot opnieuw.
- Velocity telt mee volgens `velocity`. De stemmen staan vast verdeeld over zeven stereoposities.
- De modulatie-ingang `mod` (paars) verschuift elke knop uit de tabellen behalve `preset`; de basiswaarden blijven staan. Eén spoor: Strings. Hij verschuift niet-lineair bij de met log gemarkeerde waarden (`cutoff`, `rate`, `attack`, `decay`, `release`).

## Instellingen voor een goede klank

Alle waarden zijn uitgangspunten; luisteren is niet mogelijk, controleer dus op bereik en gedrag.

- **Basis (kamerensemble):** de startwaarden.
- **Bas of celli:** `transpose` −12 (of speel lage noten), `cutoff` 1800 … 2600, `body` 0,8 … 0,9, `bow` 0,15 … 0,2, `attack` 0,15 … 0,25, `release` 1,5 … 2, `detune` 4 … 5, `ensemble` 0,2 … 0,3, `space` 0,3.
- **Lead (solo-viool):** `cutoff` 6500 … 7500, `resonance` 1 … 1,2, `body` 0,4, `attack` 0,02 … 0,05, `release` 0,3 … 0,5, `detune` 3, `ensemble` 0,3, `vibrato` 0,4, `width` 0,35. Speel niet te veel noten tegelijk.
- **Pad:** `attack` 0,8 … 3, `decay` 1 … 1,5, `sustain` 0,9 … 1, `release` 3 … 7, `cutoff` 2500 … 4000, `body` 0,7 … 0,9, `ensemble` 0,65 … 0,8, `space` 0,5 … 0,75, `width` 1, `human` 0,4 … 0,5. Een lange `attack` heeft lange noten nodig.
- **Pluck (pizzicato):** `attack` 0,005, `decay` 0,2 … 0,25, `sustain` 0, `release` 0,2, `body` 0,85, `bow` 0 … 0,02, `vibrato` 0 … 0,02, `ensemble` 0,15, `cutoff` 5000.
- **Staccato (spiccato):** `attack` 0,01, `decay` 0,18, `sustain` 0,18, `release` 0,15, `bow` 0,5, `cutoff` 7500, `ensemble` 0,2.
- **Arpeggio of sequencer:** het apparaat heeft er zelf geen. Kies korte noten: `attack` 0,005 … 0,03, `decay` 0,2 … 0,4, `sustain` 0 … 0,3, `release` 0,15 … 0,4, `space` rond 0,2. Een lange `release` of `space` laat de noten door elkaar lopen.
- **Akkoorden:** `body` 0,6, `ensemble` 0,5 … 0,7, `width` 0,8 … 1. Zestien stemmen zijn genoeg voor vier akkoorden van drie of vier noten.

## Wat een tune niet moet doen

Het apparaat kan in normaal gebruik niet ontsporen (zie Bewaker), maar je kunt een tune maken die stil of onbruikbaar is:

- `level` of `expression` op 0: stil. `sustain` 0 met een lange `decay`: de noot sterft vanzelf, ook als je hem aanhoudt.
- `cutoff` onder ongeveer 400 met `body` 1: erg dof, bijna niets te horen (niet beluisterd).
- Een `attack` langer dan de nootlengte (bijvoorbeeld 3 s bij noten van een stap): de noot is voorbij voor hij opkomt.
- `release` 12 met veel noten: de stemmen raken op en noten breken af.
- `ensemble` 1 samen met `space` 1: alles loopt in elkaar; bij een bas is dat dof en breed.
- `resonance` 3 met een lage `cutoff` en veel tegelijk spelende stemmen: een scherpe, zingende piek.
- Geen velden verzinnen en geen `preset` anders dan `Custom`.

## Bewaker

In normaal gebruik geeft Bowed Ensemble nooit een niet-eindig getal: met honderden noten, extreme noot-, velocity- en duurwaarden (ook `NaN` en `Infinity`), alle knoppen op hun uiterste en modulatie van ±1 kwam in zestig renders van zes seconden geen enkel niet-eindig sample voor, in het oude en in het nieuwe bestand. Een `NaN` of `Infinity` kan dus alleen ontstaan door een fout buiten dit apparaat in de keten van de browser. Toch houden de filters (de stemfilters, de drie filters achter de stemmen, de galm en de compressor) voor altijd een niet-eindige waarde vast, en dan was het apparaat in het oude bestand voorgoed stil of bleef het op volle sterkte hangen. Daarom controleert een bewaker elke 50 ms de ruwe som van de stemmen en de uitgang van de compressor (voor de vervormer die zo'n fout verbergt). Is een waarde niet eindig of boven ±100 (normaal ruim onder 2), dan worden die filters, de galm en de compressor vervangen door nieuwe. De bewaker draait niet in een offline render. Getest met een stoot van `NaN`, `Infinity` of `1e30` (2 ms) in een stemfilter: het oude bestand bleef daarna voorgoed `NaN` geven (of op volle sterkte hangen bij `1e30`), het nieuwe is binnen ongeveer een tiende seconde weer stil of speelt gewoon verder en klinkt bij een nieuw akkoord weer normaal. Normaal geluid blijft gelijk (zie hieronder).

## Een tune

Een pack heet `naam.patchkamer-tunes.json` en staat in `../../../tunes/`. Het formaat en de licentie (`CC0-1.0` voor alles in `tunes/`) staan in `../../../tunes/AGENTS.md`. Voor dit apparaat is `device` altijd `nl.patchkamer.bowedensemble` en elke tune is `kind: "set"` met een `state` als hierboven. Zet geen merknamen van bestaande apparatuur in naam of omschrijving, en verzin geen persoon bij `author`.

```json
{ "name": "Slow Pad", "kind": "set", "version": "1.0.0",
  "state": { "cutoff": 3200, "resonance": 0.7, "body": 0.7, "bow": 0.08, "attack": 2.5, "decay": 1.5, "sustain": 1, "release": 6, "velocity": 0.5,
             "detune": 7, "vibrato": 0.15, "rate": 5.1, "human": 0.5, "ensemble": 0.75, "width": 1, "space": 0.65, "pan": 0,
             "transpose": 0, "expression": 0.9, "level": 0.75, "preset": "Custom" } }
```

Zet liever alle velden erin: dan klinkt de tune hetzelfde als de startwaarden ooit veranderen.

## Controleren

- Draai vanuit de root van de repo: `node contract/validate-instrument.mjs devices/synths/BowedEnsemble/bowed-ensemble.patchkamer-device.js` (en met `--lang en`). Dat moet `OK` geven, zonder `let op`.
- Je kunt niet horen hoe een tune klinkt. Heb je een browser, laad dan de host (`../../../patchkamer/AGENTS.md`) en kies de tune. Heb je geen browser, schrijf dan in je oplevering dat de tune **niet beluisterd** is.
- Alle tekst in het apparaat staat in het woordenboek `EN` bovenin het bestand (Nederlandse bron, Engels via `host.lang`). Een nieuwe tekst krijgt altijd nl én en.
- De kaart gebruikt de regelaars van de host (`host.ui.knob`); dubbelklik op een regelaar zet hem terug op de beginwaarde.

## Wat je niet doet

- Verander nooit de `id`, de `kind`, de poort-id's of de namen van state-velden.
- Pas het apparaat niet aan om een tune te laten kloppen.
- Commit of push niet, tenzij de opdracht dat vraagt.
