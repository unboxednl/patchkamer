# AGENTS.md: Sub Line

Dit bestand is voor AI-agents die **tunes voor Sub Line** maken. Het is niet geschreven voor mensen. Het hoort bij `../../../AGENTS.md` (algemeen) en `../../../tunes/AGENTS.md` (regels voor tunepacks); lees die eerst. Hier staat wat alleen voor Sub Line geldt.

## Wat Sub Line is

Een monofone synth (één stem tegelijk) voor basloopjes en leads. Eén oscillatorbank met zaagtand, puls (met pulsbreedte en pulsbreedtemodulatie), een sub-oscillator (blokgolf, één of twee octaven lager) en ruis; daarna een lowpass-filter van twee trappen met resonantie, dat door één envelope en een LFO wordt bewogen; dan een versterker met dezelfde envelope. Verder portamento (glide), transpositie, vibrato, drive en een compressor met begrenzer op de uitgang. Er zit een eigen **patroon van 32 stappen** in en een **arpeggiator**; het speelt ook noten van een toetsenbord of externe sequencer. De filter-envelope en de versterker-envelope delen dezelfde vier regelaars (attack, decay, sustain, release).

| | |
|---|---|
| Bestand | `subline.patchkamer-device.js` (in deze map) |
| `id` | `nl.patchkamer.subline`. Verander die nooit: daaraan hangen tunes en songs van gebruikers |
| Naam | `Sub Line` in alle talen; alleen de poortnamen hebben een Nederlandse variant (via `i18n`: `Uit`, `Keyboard / noten`) |
| Soort | `instrument`: dit apparaat krijgt dus **tunes** (geen presets) |
| Poorten | eventingang `notes` (Keyboard / notes), modulatie-ingang `mod`, audio-uitgang `out` (Out); geen audio-ingang |
| Contract | v1.11 |
| Licentie apparaat | AGPL-3.0-or-later |

Dit apparaat is de nieuwe, bijgewerkte vorm van een ouder bestand met een andere naam en id. Tunes of songs uit die tijd verwijzen naar de oude id en laden hier niet in. Het geluid is bit-voor-bit gelijk gebleven.

## Wat je hier doet

Je maakt klanken (tunes) voor Sub Line en zet ze als pack in `../../../tunes/`. Het apparaat zelf pas je alleen aan als de opdracht dat zegt (`version` ophogen; `id`, poort-id's en state-velden gelijk houden).

## De state

`getState()` geeft precies deze velden (de tabellen hieronder, samen met `gate`); `getPreset()` geeft dezelfde zonder `testNote` en `selected`. De state van een tune (`kind: "set"`) is wat `getPreset()` teruggeeft. Alle getallen buiten het bereik worden afgekapt; een ontbrekende of ongeldige waarde geeft de startwaarde.

### Klank

| Veld | Wat | Bereik | Start | Eenheid |
|---|---|---|---|---|
| `cutoff` | Cutoff van het filter (basis, vóór envelope, LFO en key tracking) | 30 … 16000 (log) | 900 | Hz |
| `resonance` | Resonantie van het filter | 0 … 1 | 0,25 | – |
| `filterEnv` | Hoeveel de envelope de cutoff beweegt, in octaven bij volle envelope; negatief sluit het filter | −5 … 5 | 3 | oct |
| `keytrack` | Key tracking: 1 = de cutoff volgt de toonhoogte; de noot C4 (MIDI 60) is het nulpunt | 0 … 1 | 0,5 | – |
| `attack` | Attack van de envelope (filter én versterker) | 0,001 … 4 (log) | 0,008 | s |
| `decay` | Decay | 0,01 … 8 (log) | 0,22 | s |
| `sustain` | Sustain (niveau na de decay) | 0 … 1 | 0,25 | – |
| `release` | Release na het loslaten van de noot | 0,01 … 8 (log) | 0,3 | s |
| `pw` | Pulsbreedte van de puls | 0,05 … 0,95 | 0,5 | – |
| `pwm` | Diepte waarmee de LFO de pulsbreedte beweegt | 0 … 1 | 0,2 | – |
| `noise` | Hoeveelheid ruis in de bron | 0 … 1 | 0 | – |
| `saw` | Niveau zaagtand | 0 … 1 | 0,8 | – |
| `pulse` | Niveau puls | 0 … 1 | 0,35 | – |
| `sub` | Niveau sub-oscillator (blokgolf) | 0 … 1 | 0,3 | – |
| `subOctave` | Hoe ver de sub onder de noot zit | `2` (een octaaf lager) of `4` (twee octaven lager) | 2 | – |
| `lfoRate` | Snelheid van de LFO (driehoek) | 0,05 … 30 (log) | 2 | Hz |
| `vibrato` | LFO naar toonhoogte | 0 … 120 | 0 | cent |
| `lfoFilter` | LFO naar cutoff (volle stand = ±3 octaven) | 0 … 1 | 0 | – |
| `glide` | Portamento-tijd tussen noten | 0,001 … 1 (log) | 0,005 | s |
| `transpose` | Transpositie van de hele synth | −24 … 24 | 0 | halve tonen |
| `drive` | Verzadiging vóór het filter | 0 … 1 | 0,1 | – |
| `level` | Uitgangsniveau | 0 … 1 | 0,75 | – |
| `legato` | Bij overlappende noten (een noot begint voor de vorige is losgelaten) de envelope niet opnieuw starten, alleen glijden | `true` of `false` | `true` | – |
| `priority` | Welke toets klinkt bij meerdere ingedrukte toetsen | `last` (laatste), `low` (laagste), `high` (hoogste) | `last` | – |
| `preset` | Naam van de laatst gekozen klank uit de keuzelijst Klank (alleen een label: zetten via de state verandert de regelaars niet) | `Rubber Bass`, `Square Runner`, `Soft Triangle Feel`, `Squelch`, `Bright Sequence`, `Noise Percussion` | `Rubber Bass` | – |

### Besturing en patroon

| Veld | Wat | Bereik | Start |
|---|---|---|---|
| `mode` | Wie de noten bepaalt | `notes` = alleen noten die binnenkomen (toetsenbord of externe sequencer); `sequence` = het eigen patroon; `arp` = arpeggiator over de binnenkomende noten | `notes` |
| `division` | Hoe vaak een stap valt: 1 = elke zestiende, 2 = elke achtste, 4 = elke kwart | 1, 2 of 4 | 1 |
| `length` | Aantal stappen van het patroon dat meedoet | 1 … 32 | 16 |
| `gate` | Notenlengte van patroon en arp, als deel van de staplengte (0,5 = staccato, 1 = aansluitend); de knop heet Sequencer gate | 0,1 … 1 | 0,65 |
| `arpDirection` | Richting van de arpeggiator | `up` (omhoog) of `down` (omlaag) | `up` |
| `seqNotes` | De noot per stap, 32 getallen | MIDI-nootnummers 24 … 96 (36 = C2, 48 = C3, 60 = C4) | zie hieronder |
| `seqOn` | Of de stap een noot speelt, 32 getallen | `0` = rust, `1` = noot | zie hieronder |
| `selected` | De stap die in de editor staat (werkstand) | 0 … 31 | 0 |
| `testNote` | De testnoot van de knoppen (werkstand) | 24 … 96 | 48 |

Startpatroon: `seqNotes` = `[36,36,48,43,39,36,46,43,36,48,39,43,34,36,43,46]` twee keer achter elkaar (32 waarden); `seqOn` = `[1,0,1,1,1,0,1,1,1,0,1,1,1,1,1,0]` twee keer achter elkaar.

**Hoe een patroon is opgeslagen.** Stap `i` (0 = eerste) speelt `seqNotes[i]` als `seqOn[i]` 1 is. Alleen de eerste `length` stappen doen mee; de rest blijft bewaard maar klinkt niet. Beide lijsten hebben altijd 32 waarden (kortere lijsten worden aangevuld met de startwaarden, dus geef altijd 32). Een stap heeft geen accent, slide of octaafkeuze: één noot, vaste velocity (0,85), lengte = staplengte × `division` × `gate`. De teller loopt vanaf de start van de transport en springt na `length` terug naar stap 0. Is `mode` `sequence`, dan negeert het apparaat binnenkomende noten.

**Een patroon in een tune.** Zet `mode: "sequence"`, `length`, `division`, `seqNotes` (32 waarden) en `seqOn` (32 waarden). Kies de noten rond MIDI 24 … 60 voor een bas en 55 … 84 voor een lead; houd `seqNotes` binnen 24 … 96. Laat je het patroon weg, dan klinkt de tune op het startpatroon als `mode` `sequence` is, en speelt hij niets zelf als `mode` `notes` is. Zet `testNote` en `selected` **niet** in een tune.

**Arpeggiator.** In `arp` speelt het apparaat de noten die op dat moment ingedrukt zijn (of binnenkomen) om de beurt, van laag naar hoog (`up`) of van hoog naar laag (`down`), één per stap volgens `division`. De noten moeten van een ander apparaat komen; zonder invoer blijft het stil.

## Wat het apparaat met een state doet (getest)

- Getallen buiten het bereik worden afgekapt (`cutoff: 1e9` wordt 16000); een tekst, `null`, `NaN`, `Infinity` of een ontbrekende waarde geeft de startwaarde.
- Een ongeldige `mode`, `arpDirection`, `priority`, `subOctave`, `division`, `legato` of `preset` geeft de startwaarde.
- `seqNotes` en `seqOn` worden per waarde afgekapt (noot 24 … 96, aan/uit 0 … 1); een lijst die geen lijst is, geeft het startpatroon.
- Onbekende velden worden genegeerd. Zet er geen in.
- Het kiezen van een klank in de UI zet alleen de klankregelaars; patroon, besturing en testnoot blijven staan.

## Een tune

Een pack heet `naam.patchkamer-tunes.json` en staat in `../../../tunes/`. Het formaat en de licentie (`CC0-1.0` voor alles in `tunes/`) staan in `../../../tunes/AGENTS.md`. Voor dit apparaat is `device` altijd `nl.patchkamer.subline` en elke tune is `kind: "set"` met een volledige `state` als hierboven. Zet geen merknamen van bestaande apparatuur in naam of omschrijving, en verzin geen persoon bij `author`.

Een tune bevat de klank en, waar het bij de klank hoort, het patroon. Er is geen routing in de state; sturing van buiten (de paarse `mod`-ingang) hoort niet in een tune.

### Goede uitgangspunten (neutraal)

- **Bas:** `saw` 0,8, `pulse` 0,2 … 0,4, `sub` 0,5 … 0,8, `subOctave` 2, `cutoff` 300 … 900, `filterEnv` 2 … 4, `decay` 0,15 … 0,3, `sustain` 0 … 0,3, `release` 0,1 … 0,3, `resonance` 0,2 … 0,6, `drive` 0,1 … 0,4, `glide` 0,005 (kort) of 0,05 … 0,15 voor glijden. Een bas speelt het best tussen MIDI 24 en 48.
- **Lead:** `saw` 0,6 … 1, `pulse` 0,3 … 0,6, `sub` 0 … 0,2, `cutoff` 1500 … 5000, `filterEnv` 1 … 2, `sustain` 0,5 … 0,8, `release` 0,2 … 0,6, `glide` 0,03 … 0,12, `legato` aan; `vibrato` 10 … 30 cent met `lfoRate` 5 … 6 Hz voor beweging.
- **Pad (brede, trage klank):** `pulse` 0,6 … 0,9, `pwm` 0,5 … 0,9 met `lfoRate` 0,3 … 1 Hz, `attack` 0,4 … 1,5, `sustain` 0,7 … 1, `release` 1 … 3, `cutoff` 800 … 2500, `filterEnv` 0 … 1, `sub` 0,2. Het is een monosynth: een pad speelt dus één lange noot tegelijk.
- **Pluck:** `attack` 0,001 … 0,005, `decay` 0,08 … 0,25, `sustain` 0, `release` 0,05 … 0,2, `filterEnv` 2,5 … 4, `cutoff` 600 … 1500, `resonance` 0,3 … 0,6.
- **Arpeggio:** `mode` `arp`, `division` 1 of 2, `gate` 0,4 … 0,7, korte decay (0,1 … 0,25) en `sustain` 0 … 0,3 zodat elke noot afzonderlijk klinkt; `legato` uit zodat elke stap de envelope opnieuw start. Het apparaat speelt in `arp` alleen noten van een ander apparaat; zet in een tune een patroon liever in `sequence`.
- **Percussie uit ruis:** `saw` 0, `pulse` 0, `sub` 0, `noise` 0,7 … 1, `cutoff` 3000 … 9000, `decay` 0,05 … 0,12, `sustain` 0.

## Wat een tune absoluut niet moet doen

- **Stil vallen:** `level` 0; `saw`, `pulse`, `sub` en `noise` alle vier op 0; alle `seqOn` op 0 in `sequence`; `mode` `arp` of `notes` zonder dat er iets noten speelt; `cutoff` op 30 met `filterEnv` ≤ 0 en weinig key tracking (het filter is dan dicht); `sustain` 0 met `decay` 0,01 en een laag `gate` (de noten zijn dan te kort om te horen).
- **Te hard of te scherp:** `resonance` 1 met `drive` 1 en een lage cutoff klinkt schel en hard; houd `level` dan lager (≤ 0,6). Een uitgang boven 0,8 met veel drive wordt door de begrenzer vervormd.
- **`mode`/`division`/`length` onbedoeld laten staan:** een tune zonder `mode` krijgt `notes`; wil je een patroon horen, zet dan `mode: "sequence"` expliciet.
- Het apparaat zelf kan niet ontsporen: de motor herstelt zichzelf bij een niet-eindige waarde. Dat is een vangnet, geen reden om extreme waarden te kiezen.

## Controleren

- Draai vanuit de root van de repo: `node contract/validate-instrument.mjs devices/synths/SubLine/subline.patchkamer-device.js` (en met `--lang en`). Dat moet `OK` geven, zonder `let op`.
- Je kunt niet horen hoe een tune klinkt. Heb je een browser, laad dan de host (`../../../patchkamer/AGENTS.md`) en kies de tune. Heb je geen browser, schrijf dan in je oplevering dat de tune **niet beluisterd** is.
- Alle tekst in het apparaat staat in het woordenboek `EN` bovenin het bestand (Nederlandse bron, Engels via `host.lang`). Een nieuwe tekst krijgt altijd nl én en.

## Wat je niet doet

- Verander nooit de `id`, de `kind`, de poort-id's of de namen van state-velden.
- Pas het apparaat niet aan om een tune te laten kloppen.
- Commit of push niet, tenzij de opdracht dat vraagt.
