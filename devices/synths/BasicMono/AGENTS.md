# AGENTS.md: Basic Mono

Dit bestand is voor AI-agents die **tunes voor Basic Mono** maken. Het is niet geschreven voor mensen. Het hoort bij `../../../AGENTS.md` (algemeen) en `../../../tunes/AGENTS.md` (regels voor tunepacks); lees die eerst. Hier staat wat alleen voor Basic Mono geldt.

## Wat Basic Mono is

Een eenvoudige monofone synth: één oscillator (zaagtand, blok of driehoek) met een sub-oscillator (blokgolf, een octaaf lager), een resonant lowpass-filter met een eigen envelope, glide en een versterker met een decay. Er zit geen sequencer, geen arpeggiator en geen LFO in. Het speelt de noten die een externe sequencer of toetsenbord stuurt, steeds één stem tegelijk (een nieuwe noot neemt de vorige over). Alle knoppen kunnen door een modulator worden gestuurd.

| | |
|---|---|
| Bestand | `basic-mono.patchkamer-device.js` (in deze map) |
| `id` | `nl.patchkamer.mono`. Verander die nooit: daaraan hangen tunes en songs van gebruikers |
| Naam | `Basic Mono` in alle talen; alleen de poortnamen hebben een Nederlandse variant (via `i18n`: `Uit`, `Noten`) |
| Soort | `instrument`: dit apparaat krijgt dus **tunes** (geen presets) |
| Poorten | eventingang `notes` (Notes), modulatie-ingang `mod`, audio-uitgang `out` (Out, mono) |
| Contract | v1.11 |
| Licentie apparaat | AGPL-3.0-or-later |

Dit apparaat is de nieuwe, bijgewerkte vorm van een ouder bestand met een andere naam (Monosynth). De `id` is gelijk gebleven en alle state-velden ook: bestaande songs en presets laden dus gewoon.

## Wat je hier doet

Je maakt klanken (tunes) voor Basic Mono en zet ze als pack in `../../../tunes/`. Het apparaat zelf pas je alleen aan als de opdracht dat zegt (`version` ophogen; `id`, poort-id's en state-velden gelijk houden).

## De state

`getState()` geeft precies de negen velden hieronder en niets anders; dat is ook wat een tune als `state` bewaart. De state is gewone JSON: getallen en één tekst. Er zijn geen lijsten, geen patronen en geen sequencer. Er is geen routing en geen werkstand in de state: **alle negen velden horen in een tune**. Een tune hoeft niet alle velden te noemen; ontbrekende velden krijgen de startwaarde.

| Veld | Wat het doet | Bereik | Start |
|---|---|---|---|
| `wave` | Golfvorm van de hoofdoscillator: `sawtooth` (zaagtand, vol en helder), `square` (blok, hol en rond), `triangle` (driehoek, zacht en dun) | `sawtooth`, `square` of `triangle` | `sawtooth` |
| `fine` | Stemming van oscillator en sub samen, in cent | −100 … 100 | 0 |
| `cut` | Basis-cutoff van het lowpass-filter in Hz. Dit is de rust-stand; de envelope duwt de cutoff bij elke noot omhoog en laat hem terugzakken | 80 … 8000 | 800 |
| `res` | Resonantie van het filter. Het getal is de Q in dB (24 is ongeveer 16 keer versterking bij de cutoff). Hoog = scherp, fluitend, bij de laagste cutoffs bijna zingend | 0,5 … 24 | 8 |
| `env` | Envelope-diepte: hoeveel de cutoff bij het begin van een noot omhoog schiet. De piek ligt op `cut + env × 6000` Hz (bij een velocity boven 0,9 is dat 30% meer), begrensd op 80 … 16000 Hz | 0 … 1 | 0,6 |
| `dec` | Decay in seconden. Bepaalt hoe snel de cutoff terugzakt naar `cut` (tijdconstante `dec / 3`) én hoe snel het volume van de aanslag naar het sustain-niveau zakt (tijdconstante `dec`) | 0,05 … 2 | 0,25 |
| `sub` | Niveau van de sub-oscillator (blokgolf, een octaaf lager) | 0 … 1 | 0,3 |
| `glide` | Glide (portamento) in seconden: de toonhoogte glijdt naar de nieuwe noot met tijdconstante `glide / 3`. 0 = uit | 0 … 0,3 | 0 |
| `lvl` | Uitgangsniveau | 0 … 1 | 0,5 |

Hoe een noot klinkt: het volume stijgt in 4 ms naar `0,8 × velocity`, zakt dan naar een sustain-niveau van `0,3 × velocity` (tijdconstante `dec`) en blijft daar tot het einde van de noot (`dur`); daarna sterft het in ongeveer 10 ms weg. De sustain staat dus vast op 30% van de aanslag; er is geen sustain-knop. Een lange `dec` laat een aangehouden noot daarom bijna als een orgel klinken (volume blijft hoog), een korte `dec` geeft een korte plok.

Meerdere noten tegelijk kunnen niet: het apparaat is monofoon. Noten die elkaar overlappen, kappen elkaar af: de nieuwste wint.

Een kleine bijzonderheid: het sub-signaal loopt mee met `fine` en met glide, en gaat net als de hoofdoscillator door het filter. `sub` 1 bij hoge `res` kan dus hard worden (zie het niveau hieronder).

### Gemeten niveaus en de begrenzer

Piek van één noot (C2, velocity 0,8, 0,4 s) bij 48 kHz, gemeten in een offline render:

| Instelling | Piek |
|---|---|
| startwaarden | ongeveer 0,59 |
| `lvl` 1, `sub` 1, `res` 8 | 0,99 (zonder begrenzer 1,43 tot 2,0 afhankelijk van de velocity: **klipte**) |
| `cut` 80, `res` 24, `lvl` 1, `sub` 1, `wave` `square`, velocity 1 | 0,99 (zonder begrenzer 3,2) |
| `lvl` 0 | ongeveer 0,01 (praktisch stil) |

Waar de overschrijding vandaan kwam: een volle oscillator (±1) en een volle sub (±1) zijn samen al 2 groot vóór het filter; de resonantie voegt daar tot ongeveer een kwart aan toe, de versterker brengt het terug naar 0,8 × velocity, en het niveau `lvl` 1 laat het ongewijzigd door.

Sinds versie 1.11.1 staat er een zachte begrenzer op de uitgang. Tot een niveau van 0,9 verandert hij niets (het signaal blijft bit voor bit gelijk aan versie 1.11.0); daarboven buigt hij zacht af naar een plafond van 0,99. Een tune klipt dus niet meer, maar `lvl` 1 met `sub` 1 klinkt dan wel samengedrukt (vervormd) in plaats van hard. Houd `lvl` toch onder 0,6, en onder 0,4 als `sub` en `res` allebei hoog staan: dan blijft het geluid helemaal onder de begrenzer.

## Wat het apparaat met een state doet (getest)

- `setState({})` geeft alle startwaarden; `setState(getState())` geeft dezelfde state terug; `setState(null)` of een tekst geeft de startwaarden.
- Getallen buiten het bereik worden afgekapt (`cut: 1e9` wordt 8000, `sub: -5` wordt 0); een tekst, `NaN`, `Infinity` of een ontbrekende waarde geeft de startwaarde (`res: "x"` wordt 8).
- Een ongeldige `wave` geeft `sawtooth`. Onbekende velden worden genegeerd. Zet er geen in.
- De knoppen en de golfkeuze op de kaart bewegen mee met `setState`; knoppen gaan zacht over (niet beluisterd).
- Geluid is bit-identiek aan de oudere versie (Monosynth 1.8.0) in een offline render met 160 willekeurige instellingen, nootreeksen en modulatie. Versie 1.11.1 (met begrenzer) is bit-identiek aan 1.11.0 voor elke render die onder 0,9 blijft (65 willekeurige renders en alle 65 tunes uit `basic-mono-styles`: 0 afwijkende samples); alleen wat boven 0,9 komt verandert. De state-sleutels zijn ongewijzigd.

## Spelen en modulatie

- Eventingang `notes`: een gebeurtenis `{ type: 'note', note, vel, time, dur }` (MIDI-nootnummer, velocity 0 … 1, starttijd in seconden van de audioklok, duur in seconden). Zonder `dur` is de noot 0,2 s; een niet-eindige waarde voor `time`, `vel` of `dur` wordt vervangen door een veilige waarde, een niet-eindig nootnummer wordt genegeerd. Andere typen (CC, noteon/noteoff) doet het apparaat niets mee.
- De modulatie-ingang `mod` verschuift elke knop uit de tabel behalve `wave`; de basiswaarden blijven staan. Er is één spoor (Synth). Cutoff, stemming, resonantie, sub en niveau zijn ook sample-nauwkeurig (snel) te sturen.

## Instellingen voor een goede klank

Alle waarden zijn uitgangspunten; luisteren is niet mogelijk, controleer dus op bereik en gedrag. De niveaus hierboven zijn gemeten.

- **Basis (gebalanceerd):** de startwaarden.
- **Bas:** `wave` `sawtooth`, `cut` 150 … 350, `res` 4 … 8, `env` 0,4 … 0,7, `dec` 0,2 … 0,4, `sub` 0,5 … 0,8, `glide` 0 … 0,05, `lvl` 0,4 … 0,5 (let op: `sub` en `res` samen maken het luid). Spelen op MIDI-noten 28 … 48.
- **Lead:** `wave` `square` of `sawtooth`, `cut` 1200 … 2500, `res` 6 … 12, `env` 0,3 … 0,5, `dec` 0,4 … 1, `sub` 0 … 0,2, `glide` 0,04 … 0,12, `lvl` 0,4 … 0,5.
- **Pluck:** `cut` 400 … 900, `res` 8 … 14, `env` 0,8 … 1, `dec` 0,1 … 0,2, `sub` 0, `glide` 0. De korte `dec` maakt de plok; houd de noten kort.
- **Pad:** het apparaat is monofoon en heeft geen langzame attack; een pad is er niet echt mee te maken. Maak liever een drone: `wave` `triangle` of `square`, `sub` 0,5 … 0,8, `cut` 300 … 600, `env` 0,1 … 0,3, `dec` 1,5 … 2 en lange noten.
- **Arpeggio of sequencer:** het apparaat heeft er zelf geen. Kies korte noten: `dec` 0,1 … 0,3, `glide` 0 en een matige `res`. Een tune voor een externe sequencer schrijft alleen de klank; het patroon hoort er niet in.

## Wat een tune niet moet doen

Het apparaat kan niet voor altijd stilvallen of `NaN` geven (zie hieronder), maar je kunt wel een tune maken die onbruikbaar klinkt:

- `lvl` 0: stil.
- `res` 24 met `cut` onder 150 en `sub` 1: erg hard en schreeuwend; de begrenzer houdt het onder 0,99 maar het wordt samengedrukt. Kies `lvl` onder 0,4.
- `env` 1 met `dec` 2: de cutoff zakt zo langzaam terug dat elke noot dezelfde fluitende sweep krijgt.
- Meer dan één noot tegelijk verwachten. Het apparaat is monofoon.
- Geen velden verzinnen, en geen routing, patroon of positie in de tune zetten.
- Geen merknamen van bestaande apparatuur in naam of omschrijving.

## Bewaker

Een meter kijkt om de 50 ms naar de uitvoer van het filter (voor de versterker). Wordt die niet eindig (`NaN`, `Infinity`) of absurd groot (boven ±100; normaal blijft hij onder ±40, gemeten tot ongeveer 17), dan wordt het filter vervangen en gaat het geluid door. Een resonant filter dat op audiosnelheid door zijn hele cutoffbereik wordt gestuurd, kan ontsporen; voorheen bleef het apparaat daarna voor altijd stil en stuurde het `NaN` naar de rest van de studio. Bij een tweede ontsporing binnen een seconde wordt de snelle sturing van cutoff en resonantie tijdelijk losgekoppeld (2 s, daarna steeds langer tot een minuut) zodat een modulator die de oorzaak is niet steeds opnieuw het filter laat ontsporen. In een offline render staat de meter uit. Test extreme instellingen altijd ook met een modulator.

## Een tune

Een pack heet `naam.patchkamer-tunes.json` en staat in `../../../tunes/`. Het formaat en de licentie (`CC0-1.0` voor alles in `tunes/`) staan in `../../../tunes/AGENTS.md`. Voor dit apparaat is `device` altijd `nl.patchkamer.mono` en elke tune is `kind: "set"` met een `state` als hierboven. Zet geen merknamen van bestaande apparatuur in naam of omschrijving, en verzin geen persoon bij `author`.

## Controleren

- Draai vanuit de root van de repo: `node contract/validate-instrument.mjs devices/synths/BasicMono/basic-mono.patchkamer-device.js` (en met `--lang en`). Dat moet `OK` geven, zonder `let op`.
- Je kunt niet horen hoe een tune klinkt. Heb je een browser, laad dan de host (`../../../patchkamer/AGENTS.md`) en kies de tune. Heb je geen browser, schrijf dan in je oplevering dat de tune **niet beluisterd** is.
- Alle tekst in het apparaat staat in het woordenboek `EN` bovenin het bestand (Nederlandse bron, Engels via `host.lang`). Een nieuwe tekst krijgt altijd nl én en.

## Wat je niet doet

- Verander nooit de `id`, de `kind`, de poort-id's of de namen van state-velden.
- Pas het apparaat niet aan om een tune te laten kloppen.
- Commit of push niet, tenzij de opdracht dat vraagt.

## Documentatie en songs

Dit zijn de plaatsen waar je terechtkunt voor documentatie en voor het componeren van songs met dit apparaat. Songs zijn CC-BY-4.0, tunes en presets CC0-1.0, het apparaat AGPL-3.0-or-later.

- Handleiding van Basic Mono: [NL](../../../docs/synths/USER-MANUAL_NL.md#basic-mono) · [EN](../../../docs/synths/USER-MANUAL_EN.md#basic-mono).
- Overzicht van de soort: [README](../README.md); handleiding van de hele soort: [NL](../../../docs/synths/USER-MANUAL_NL.md) · [EN](../../../docs/synths/USER-MANUAL_EN.md).
- Tunes (klanken, `kind: set`): [basic-mono-styles.patchkamer-tunes.json](../../../tunes/basic-mono-styles.patchkamer-tunes.json). Kies een tune als beginpunt voor de `state` van dit apparaat in de song; velden die de tune niet noemt krijgen hun standaard. Hoe tunes zijn opgebouwd: [tunes/AGENTS.md](../../../tunes/AGENTS.md).
- Overzicht van alle apparaten en hun signaalketens: [devices/AGENTS.md](../../../devices/AGENTS.md). Een song componeren: [songs/AGENTS.md](../../../songs/AGENTS.md).
- Rol in een song: eenvoudige monofone synth voor bas of lead. Noten op `notes`, audio uit `out` (mono). Geen eigen patroon: stuur hem met een sequencer.
