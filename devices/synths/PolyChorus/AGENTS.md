# AGENTS.md: Poly Chorus

Dit bestand is voor AI-agents die **tunes voor Poly Chorus** maken. Het is niet geschreven voor mensen. Het hoort bij `../../../AGENTS.md` (algemeen) en `../../../tunes/AGENTS.md` (regels voor tunepacks); lees die eerst. Hier staat wat alleen voor Poly Chorus geldt.

## Wat Poly Chorus is

Een polyfone synth met zes stemmen en een ingebouwde stereo-chorus. Elke stem heeft een zaagtand, een puls (met pulsbreedtemodulatie) en een sub-oscillator (blokgolf, een octaaf lager), plus ruis; daarachter een tweepolig lowpass-filter met resonantie, een hoogdoorlaatfilter met vier standen, één envelope voor filter en versterker, een LFO (driehoek) voor vibrato, filter en pulsbreedte, en portamento. Alle stemmen gaan samen door de chorus (uit, I, II of I + II), een compressor en een zachte begrenzer. Er zit **geen sequencer of arpeggiator** in: het apparaat speelt de noten die het op de ingang `notes` krijgt, of de testknoppen op de kaart.

| | |
|---|---|
| Bestand | `poly-chorus.patchkamer-device.js` (in deze map) |
| `id` | `nl.patchkamer.polychorus`. Verander die nooit: daaraan hangen tunes en songs van gebruikers |
| Naam | `Poly Chorus` in alle talen; alleen de poortnamen hebben een Nederlandse variant (via `i18n`: `Uit`, `Noten`) |
| Soort | `instrument`: dit apparaat krijgt dus **tunes** (geen presets) |
| Poorten | eventingang `notes` (Notes), modulatie-ingang `mod`, audio-uitgang `out` (Out, stereo) |
| Contract | v1.11 |
| Licentie apparaat | AGPL-3.0-or-later |

Dit apparaat is de nieuwe, bijgewerkte vorm van een ouder bestand met een andere naam en id. Tunes of songs uit die tijd verwijzen naar de oude id en laden hier niet in. De oude state had twee velden (`legato`, `priority`) die bij zes stemmen niets deden; ze zijn vervallen en worden genegeerd.

## Wat je hier doet

Je maakt klanken (tunes) voor Poly Chorus en zet ze als pack in `../../../tunes/`. Het apparaat zelf pas je alleen aan als de opdracht dat zegt (`version` ophogen; `id`, poort-id's en state-velden gelijk houden).

## De state

`getState()` geeft alle velden hieronder. `getPreset()` geeft hetzelfde **zonder `testNote`**; dat is wat een tune als `state` bewaart. De state is gewone JSON: getallen en tekst, geen lijsten, geen patronen.

### Knoppen (getallen)

Een getal buiten het bereik wordt afgekapt; een tekst, `NaN`, `Infinity` of een ontbrekende waarde geeft de startwaarde. Bij de met "log" gemarkeerde knoppen loopt de schuif logaritmisch (de waarde in de state is gewoon de waarde in de eenheid).

| Veld | Wat het doet | Bereik | Start |
|---|---|---|---|
| `saw` | Niveau van de zaagtand | 0 … 1 | 0,8 |
| `pulse` | Niveau van de puls | 0 … 1 | 0,35 |
| `sub` | Niveau van de sub-oscillator (blokgolf, een octaaf lager) | 0 … 1 | 0,3 |
| `noise` | Ruis | 0 … 1 | 0 |
| `pw` | Pulsbreedte (0,5 = vierkant) | 0,05 … 0,95 | 0,5 |
| `pwm` | Diepte van de pulsbreedtemodulatie door de LFO | 0 … 1 | 0,2 |
| `transpose` | Transpositie in halve tonen | −24 … 24 | 0 |
| `cutoff` | Cutoff van het lowpass-filter in Hz (log) | 30 … 16000 | 2400 |
| `resonance` | Resonantie | 0 … 1 | 0,25 |
| `filterEnv` | Hoeveel de envelope de cutoff beweegt, in octaven (negatief = omgekeerd) | −5 … 5 | 2 |
| `keytrack` | Hoeveel de cutoff met de toonhoogte meegaat (1 = een octaaf per octaaf) | 0 … 1 | 0,5 |
| `drive` | Vervorming vóór het filter | 0 … 1 | 0,1 |
| `attack` | Attack in seconden (log) | 0,001 … 4 | 0,008 |
| `decay` | Decay in seconden (log) | 0,01 … 8 | 0,3 |
| `sustain` | Sustain-niveau | 0 … 1 | 0,65 |
| `release` | Release in seconden (log) | 0,01 … 8 | 0,3 |
| `lfoRate` | Snelheid van de LFO in Hz (log) | 0,05 … 30 | 2 |
| `vibrato` | LFO naar toonhoogte, in cent | 0 … 120 | 0 |
| `lfoFilter` | LFO naar cutoff (tot drie octaven) | 0 … 1 | 0 |
| `glide` | Portamento in seconden (log); 0,001 is praktisch uit | 0,001 … 1 | 0,005 |
| `chorusMix` | Hoeveel chorus er bij het droge geluid komt | 0 … 1 | 0,65 |
| `width` | Stereobreedte van de chorus (0 = beide kanten gelijk) | 0 … 1 | 1 |
| `level` | Uitgangsniveau | 0 … 1 | 0,75 |

Let op: **de vier envelope-knoppen sturen twee dingen tegelijk**: de versterker (volume van elke stem) en, via `filterEnv`, het filter. Een lange `attack` laat dus ook het filter langzaam opengaan, en een lage `sustain` sluit het filter weer.

### Keuzes (tekst of getal)

| Veld | Waarden | Start |
|---|---|---|
| `hpf` | Hoogdoorlaat: `0` = diep (20 Hz), `1` = 80 Hz, `2` = 180 Hz, `3` = dun (400 Hz). Een getal, geen tekst | `0` |
| `chorusMode` | `0` = uit, `1` = I (langzaam, 0,48 Hz), `2` = II (sneller, 0,9 Hz), `3` = I + II (langzaam en dieper). Een getal | `1` |
| `vcaMode` | `"env"`: de versterker volgt de envelope. `"gate"`: de versterker staat vast op een snelle attack (3 ms), volle sustain en korte release (30 ms); de envelope-knoppen sturen dan alleen nog het filter | `"env"` |

Een andere waarde geeft de startwaarde.

### Overige velden

| Veld | Wat | Bereik | Start |
|---|---|---|---|
| `testNote` | Noot van de testknoppen op de kaart (MIDI). Werkstand, **hoort niet in een tune**: `getPreset()` laat hem weg | 24 … 96 | 48 |
| `preset` | De naam van de gekozen klank in de keuzelijst **Sound** op de kaart (`Warm Poly`, `Rave Chords`, `Silk Strings`, `Deep Sub`, `PWM Cloud`, `Slow Brass`, `Muted Pluck`, `Wide Organ`). Het is alleen een label: het zet zelf niets. **Laat het weg in een tune** (dan staat er `Warm Poly`) | een van die acht | `Warm Poly` |

Velden die niet in een tune horen: `testNote` en `preset`. Er is geen routing, geen patroon en geen klokstand in de state.

## Wat het apparaat met een state doet (getest)

- `setState({})` geeft alle startwaarden; `setState(getState())` en `setPreset(getPreset())` geven dezelfde state terug; `setPreset({})` geeft de startwaarden en laat `testNote` staan.
- Getallen buiten het bereik worden afgekapt (`cutoff: 1e9` wordt 16000, `sustain: 2` wordt 1, `transpose: 99` wordt 24); een tekst, `NaN` of `Infinity` geeft de startwaarde.
- Een ongeldige `hpf`, `chorusMode`, `vcaMode` of `preset` geeft de startwaarde. Onbekende velden worden genegeerd. Zet er geen in.
- De knoppen en keuzelijsten op de kaart bewegen mee met `setState`; knoppen en volume gaan zacht over (de motor loopt naar de nieuwe waarden toe; niet beluisterd).

## Spelen en modulatie

- Eventingang `notes`: `note` (met `dur`, of `noteon`/`noteoff`), `panic` en `allnotesoff`. Een `cc` met `id` gelijk aan een knop uit de tabel en `value` 0 … 1 zet die knop lineair over zijn hele bereik (ook bij de logaritmische knoppen).
- Zes stemmen: een zevende noot neemt de oudste stem over die al loslaat (of anders de eerste). Een tune met lange `release` en veel noten laat dus noten afbreken.
- De modulatie-ingang `mod` (paars) verschuift elke knop uit de tabel behalve de keuzes en `testNote`; de basiswaarden blijven staan. De sporen: Filters, Versterker / envelope, Oscillatoren, Modulatie, Master.

## Instellingen voor een goede klank

Alle waarden zijn uitgangspunten; luister is niet mogelijk, controleer dus op bereik en gedrag.

- **Basis (gebalanceerd):** de startwaarden: `saw` 0,8, `pulse` 0,35, `sub` 0,3, `cutoff` 2400, `filterEnv` 2, `chorusMode` 1.
- **Bas:** `saw` 0,3, `pulse` 0, `sub` 0,9, `cutoff` 300 … 700, `filterEnv` 1 … 2, `release` 0,1 … 0,25, `chorusMode` 0 (de chorus maakt lage tonen breed en slap), `hpf` 0, `transpose` −12 of een lage testnoot.
- **Lead:** `saw` 0,8, `pulse` 0,3, `sub` 0, `cutoff` 2500 … 5000, `resonance` 0,3, `filterEnv` 1,5, `glide` 0,04 … 0,12, `vibrato` 15 … 30 met `lfoRate` 5 … 6, `chorusMode` 1, `chorusMix` 0,35 … 0,5.
- **Pad:** `saw` 0 … 0,3, `pulse` 0,7 … 0,9, `pwm` 0,5 … 0,8 met `lfoRate` 0,2 … 0,5, `attack` 0,6 … 1,5, `release` 1,5 … 3, `sustain` 0,8 … 1, `cutoff` 1500 … 2500, `chorusMode` 2 of 3, `chorusMix` 0,6 … 0,8.
- **Pluck:** `sustain` 0, `decay` 0,15 … 0,4, `release` 0,1 … 0,3, `attack` 0,001 … 0,005, `filterEnv` 2,5 … 3,5, `cutoff` 600 … 1200, `resonance` 0,3 … 0,45.
- **Akkoorden:** `saw` 0,6 … 0,8, `sub` 0 … 0,2, `cutoff` 1800 … 2500, `decay` 0,2 … 0,5, `sustain` 0,2 … 0,5, `chorusMode` 1 of 3. Spelen er tien noten tegelijk, dan breken er stemmen af (zes stemmen).
- **Arpeggio of sequencer:** het apparaat heeft er zelf geen. Kies korte noten: `decay` 0,15 … 0,3, `sustain` 0 … 0,3, `release` 0,05 … 0,2, `glide` op 0,001 en `chorusMix` rond 0,4. Een lange `release` laat noten door elkaar lopen.

## Wat een tune niet moet doen

Het apparaat kan niet ontsporen: het filter is begrensd, de uitgang heeft een begrenzer, en een stem of toestand met een niet-eindige waarde wordt vanzelf weggehaald (zie hieronder). Wel kun je een tune maken die stil of onbruikbaar is:

- `level` op 0, of `saw`, `pulse`, `sub` en `noise` alle vier op 0: stil.
- `cutoff` onder ongeveer 100 met `filterEnv` 0 of negatief: erg dof, bijna alleen sub en bas hoorbaar (niet beluisterd).
- `vcaMode: "gate"` met de verwachting dat `attack`, `decay` en `release` de versterker vormen: dat doen ze dan niet (alleen het filter).
- Een lange `attack` (meer dan ongeveer 2 s) bij een tune die met korte noten wordt gespeeld: de noot is voorbij voor hij opkomt.
- `chorusMix` 1 met `width` 1 op een bas: de bas wordt breed en zwak. Gebruik `chorusMode` 0.
- Geen `preset` of `testNote` in de tune zetten, en geen velden verzinnen.

## Bewaker

De motor weigert niet-eindige getallen en noten en haalt een stem weg die een niet-eindige of absurde waarde (boven ±100) geeft; de uitgangstrap (gelijkspanningsfilter) herstelt zichzelf bij een niet-eindige of absurde waarde en begint met een schone toestand. Voorheen kon één `NaN` de uitgang voor altijd stil zetten. In het normale gebied is het geluid bit-identiek aan het oude bestand.

## Een tune

Een pack heet `naam.patchkamer-tunes.json` en staat in `../../../tunes/`. Het formaat en de licentie (`CC0-1.0` voor alles in `tunes/`) staan in `../../../tunes/AGENTS.md`. Voor dit apparaat is `device` altijd `nl.patchkamer.polychorus` en elke tune is `kind: "set"` met een `state` als hierboven (zonder `testNote` en `preset`). Zet geen merknamen van bestaande apparatuur in naam of omschrijving, en verzin geen persoon bij `author`.

```json
{ "name": "Pad Warm", "kind": "set", "version": "1.0.0",
  "state": { "saw": 0.2, "pulse": 0.85, "sub": 0.2, "pw": 0.5, "pwm": 0.7, "noise": 0, "transpose": 0,
             "cutoff": 2000, "resonance": 0.2, "filterEnv": 1, "keytrack": 0.5, "drive": 0.05,
             "attack": 1, "decay": 1, "sustain": 0.9, "release": 2.2,
             "lfoRate": 0.3, "vibrato": 0, "lfoFilter": 0, "glide": 0.001,
             "chorusMode": 3, "chorusMix": 0.7, "width": 1, "hpf": 1, "vcaMode": "env", "level": 0.7 } }
```

Alle velden van een tune hoeven er niet in te staan: een ontbrekend veld krijgt de startwaarde. Zet ze liever allemaal, dan klinkt de tune hetzelfde als de startwaarden ooit veranderen.

## Controleren

- Draai vanuit de root van de repo: `node contract/validate-instrument.mjs devices/synths/PolyChorus/poly-chorus.patchkamer-device.js` (en met `--lang en`). Dat moet `OK` geven, zonder `let op`.
- Je kunt niet horen hoe een tune klinkt. Heb je een browser, laad dan de host (`../../../patchkamer/AGENTS.md`) en kies de tune. Heb je geen browser, schrijf dan in je oplevering dat de tune **niet beluisterd** is.
- Alle tekst in het apparaat staat in het woordenboek `EN` bovenin het bestand (Nederlandse bron, Engels via `host.lang`). Een nieuwe tekst krijgt altijd nl én en.
- Het apparaat laadt zijn motor als AudioWorklet; zonder worklet maakt het geen geluid en meldt dat in de kaart.

## Wat je niet doet

- Verander nooit de `id`, de `kind`, de poort-id's of de namen van state-velden.
- Pas het apparaat niet aan om een tune te laten kloppen.
- Commit of push niet, tenzij de opdracht dat vraagt.

## Documentatie en songs

Dit zijn de plaatsen waar je terechtkunt voor documentatie en voor het componeren van songs met dit apparaat. Songs zijn CC-BY-4.0, tunes en presets CC0-1.0, het apparaat AGPL-3.0-or-later.

- Handleiding van Poly Chorus: [NL](../../../docs/synths/USER-MANUAL_NL.md#poly-chorus) · [EN](../../../docs/synths/USER-MANUAL_EN.md#poly-chorus).
- Overzicht van de soort: [README](../README.md); handleiding van de hele soort: [NL](../../../docs/synths/USER-MANUAL_NL.md) · [EN](../../../docs/synths/USER-MANUAL_EN.md).
- Tunes (klanken, `kind: set`): [poly-chorus-styles.patchkamer-tunes.json](../../../tunes/poly-chorus-styles.patchkamer-tunes.json). Kies een tune als beginpunt voor de `state` van dit apparaat in de song; velden die de tune niet noemt krijgen hun standaard. Hoe tunes zijn opgebouwd: [tunes/AGENTS.md](../../../tunes/AGENTS.md).
- Overzicht van alle apparaten en hun signaalketens: [devices/AGENTS.md](../../../devices/AGENTS.md). Een song componeren: [songs/AGENTS.md](../../../songs/AGENTS.md).
- Rol in een song: polyfone synth met zes stemmen en stereo-chorus, geschikt voor pads en akkoorden. Noten op `notes`, audio uit `out` (stereo).
