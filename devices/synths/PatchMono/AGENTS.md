# AGENTS.md: Patch Mono

Dit bestand is voor AI-agents die **tunes voor Patch Mono** maken. Het is niet geschreven voor mensen. Het hoort bij `../../../AGENTS.md` (algemeen) en `../../../tunes/AGENTS.md` (regels voor tunepacks); lees die eerst. Hier staat wat alleen voor Patch Mono geldt.

## Wat Patch Mono is

Een monofone synth (één stem, laatste/laagste/hoogste noot wint) met twee soorten opbouw, te kiezen met het veld `variant`:

- `single`: één oscillator (VCO A), één lowpass-filter (12 dB) en **één envelope** die zowel het volume als het filter stuurt (de knoppen VCA attack/decay/sustain/release).
- `dual`: twee oscillatoren (VCO A en VCO B, met interval, fijnstemming, FM van B op A, ringmodulatie en B naar het filter), een highpass-filter met eigen resonantie gevolgd door twee lowpass-filters in serie (24 dB), en een **eigen filter-envelope** (Filter attack/decay/sustain/release) naast de volume-envelope.

Daarbij horen in beide opbouwen: ruis, een LFO (zaagtand, blok of driehoek) met sample & hold, pulsbreedte-modulatie, portamento, legato, key tracking, drive, een ingang voor extern geluid (door de filters en bruikbaar als envelope-volger) en **vier interne patchroutes** die een bron (LFO, filter-EG, sample & hold, externe envelope) koppelen aan pitch, cutoff of pulsbreedte. Het apparaat heeft **geen eigen sequencer of arpeggiator**: noten komen van het toetsenbord, van een testknop of van een ander apparaat via de ingang `notes`.

| | |
|---|---|
| Bestand | `patch-mono.patchkamer-device.js` (in deze map) |
| `id` | `nl.patchkamer.patchmono`. Verander die nooit: daaraan hangen tunes en songs van gebruikers |
| Naam | `Patch Mono` in alle talen; alleen de poortnamen hebben een Nederlandse variant (via `i18n`) |
| Soort | `instrument`: dit apparaat krijgt dus **tunes** (geen presets) |
| Poorten | audio-ingang `in` (extern geluid / envelope), audio-uitgang `out` (stereo), eventingang `notes`, modulatie-ingang `mod`; geen eventuitgang |
| Contract | v1.11 |
| Licentie apparaat | AGPL-3.0-or-later |

Dit apparaat is de nieuwe, bijgewerkte vorm van een ouder bestand met een andere naam en id. Tunes of songs uit die tijd verwijzen naar de oude id en laden hier niet in. De keuzewaarden van `variant` zijn bij het omzetten hernoemd naar `single` en `dual` (de state-sleutels zelf zijn gelijk gebleven).

## Wat je hier doet

Je maakt klanken (tunes) voor Patch Mono en zet ze als pack in `../../../tunes/`. Het apparaat zelf pas je alleen aan als de opdracht dat zegt (`version` ophogen; `id`, poort-id's en state-velden gelijk houden).

## De state

`state` van een tune is wat `getState()` teruggeeft (alle velden hieronder). Een tune hoeft niet alles te zetten: een ontbrekend veld krijgt de startwaarde. `getPreset()` geeft dezelfde state zonder `testNote`; een tune bevat `testNote` dus niet (hij mag er wel in staan, hij wordt dan genegeerd bij het kiezen van de tune).

### Knoppen (getallen)

Alle getallen buiten het bereik worden afgekapt; een tekst, `null`, `NaN` of `Infinity` geeft de startwaarde. Een logaritmische schuif voelt gelijkmatig in tijd of toonhoogte (Hz, seconden).

| Veld | Wat | Bereik | Start | Eenheid | Bij `single` |
|---|---|---|---|---|---|
| `cutoff` | Cutoff van het lowpass-filter | 30 … 16000 (log) | 1300 | Hz | werkt |
| `resonance` | Resonantie van het lowpass-filter (1 = zeer scherpe piek) | 0 … 1 | 0,55 | – | werkt |
| `filterEnv` | Hoeveel de filter-envelope de cutoff omhoog (of bij negatief omlaag) duwt, in octaven | −5 … 5 | 3 | oct | werkt |
| `keytrack` | Cutoff volgt de toonhoogte (0,5 = halverwege; 1 = volledig) | 0 … 1 | 0,5 | – | werkt |
| `attack` | Volume attack (bij `single` ook filter) | 0,001 … 4 (log) | 0,008 | s | werkt |
| `decay` | Volume decay (bij `single` ook filter) | 0,01 … 8 (log) | 0,3 | s | werkt |
| `sustain` | Volume sustain (bij `single` ook filter) | 0 … 1 | 0,65 | – | werkt |
| `release` | Volume release (bij `single` ook filter) | 0,01 … 8 (log) | 0,3 | s | werkt |
| `pw` | Pulsbreedte van de blokgolf (alleen hoorbaar bij golfvorm `square`) | 0,05 … 0,95 | 0,5 | – | werkt |
| `pwm` | Diepte van de LFO op de pulsbreedte | 0 … 1 | 0,2 | – | werkt |
| `noise` | Ruis in de mix | 0 … 1 | 0 | – | werkt |
| `lfoRate` | Snelheid van de LFO (en van sample & hold) | 0,05 … 30 (log) | 2 | Hz | werkt |
| `vibrato` | LFO op de toonhoogte | 0 … 120 | 0 | cent | werkt |
| `lfoFilter` | LFO op de cutoff | 0 … 1 | 0 | – | werkt |
| `drive` | Verzadiging vóór de filters | 0 … 1 | 0,1 | – | werkt |
| `glide` | Portamento: tijd waarin de toonhoogte naar de nieuwe noot glijdt | 0,001 … 1 (log) | 0,005 | s | werkt |
| `transpose` | Transpositie van het hele apparaat | −24 … 24 | 0 | halve tonen | werkt |
| `level` | Uitgangsniveau | 0 … 1 | 0,75 | – | werkt |
| `fAttack` | Filter attack | 0,001 … 4 (log) | 0,005 | s | geen effect |
| `fDecay` | Filter decay | 0,01 … 8 (log) | 0,4 | s | geen effect |
| `fSustain` | Filter sustain | 0 … 1 | 0,15 | – | geen effect |
| `fRelease` | Filter release | 0,01 … 8 (log) | 0,3 | s | geen effect |
| `osc1` | Niveau van VCO A | 0 … 1 | 0,7 | – | werkt |
| `osc2` | Niveau van VCO B | 0 … 1 | 0,5 | – | geen effect |
| `osc2Semi` | VCO B interval ten opzichte van A | −24 … 24 | 0 | halve tonen | geen effect |
| `osc2Fine` | VCO B fijnstemming | −35 … 35 | 5 | cent | geen effect |
| `fm` | VCO B moduleert de frequentie van VCO A | 0 … 3 | 0 | – | geen effect |
| `audioFilter` | VCO B moduleert de cutoff | 0 … 1 | 0 | – | geen effect |
| `highpass` | Cutoff van het highpass-filter | 20 … 8000 (log) | 80 | Hz | geen effect |
| `hpRes` | Resonantie van het highpass-filter | 0 … 1 | 0,2 | – | geen effect |
| `ring` | Ringmodulatie A × B in de mix | 0 … 1 | 0 | – | geen effect |
| `external` | Niveau van het externe geluid in de mix (gaat door de filters; het volume volgt de noot) | 0 … 1 | 0 | – | werkt |
| `testNote` | Noot van de testknoppen in de kaart (werkstand, geen klank) | 24 … 96 (geheel) | 48 | MIDI | – |

### Keuzes (tekst of boolean)

| Veld | Wat | Waarden | Start |
|---|---|---|---|
| `variant` | Opbouw | `single` (1 VCO, lowpass) of `dual` (2 VCO, highpass + lowpass) | `single` |
| `wave` | Golfvorm van VCO A | `sawtooth`, `square`, `triangle` of `noise` | `sawtooth` |
| `wave2` | Golfvorm van VCO B (alleen `dual`) | `sawtooth`, `square` of `triangle` | `square` |
| `lfoWave` | Golfvorm van de LFO | `sawtooth`, `square` of `triangle` | `triangle` |
| `legato` | Legato: een nieuwe noot terwijl een andere nog klinkt start de envelopes niet opnieuw | `true` of `false` | `true` |
| `priority` | Welke noot klinkt als er meer toetsen tegelijk ingedrukt zijn | `last`, `low` of `high` | `last` |
| `preset` | Naam van het laatst gekozen klankbeeld in de keuzelijst "Klankbeeld"/"Sound" (alleen een label; kiezen zet de bijbehorende waarden) | `Raw Mono`, `Screaming Dual`, `External Sculpt`, `Rubber Cable` of `Industrial Air` | `Raw Mono` |
| `routes` | De vier patchroutes, zie hieronder | JSON-tekst (of een lijst van vier objecten, die wordt omgezet) | vier uitgeschakelde routes |

Een ongeldige keuze (andere tekst, getal, `null`) geeft de startwaarde.

### De vier patchroutes (`routes`)

`routes` is een **tekst met JSON**: een lijst van precies vier objecten `{ "source": …, "dest": …, "amount": … }`. `getState()` geeft het altijd zo (als tekst); `setState` accepteert ook een echte lijst. Ontbrekende of ongeldige routes worden een uitgeschakelde route.

| Veld | Waarden | Betekenis |
|---|---|---|
| `source` | `off`, `lfo`, `env`, `sh`, `external` | `off` = route uit; `lfo` = LFO (−1 … 1); `env` = de filter-envelope (0 … 1; bij `single` dezelfde als de volume-envelope); `sh` = sample & hold (een nieuwe willekeurige waarde per LFO-periode); `external` = niveau van het externe geluid (volger) |
| `dest` | `pitch`, `cutoff`, `pw` | `pitch` = ±24 halve tonen bij amount 1; `cutoff` = ±5 octaven bij amount 1; `pw` = pulsbreedte ±0,4 |
| `amount` | −1 … 1 | Sterkte, negatief draait om. Standaard 0 |

Voorbeeld van een route die de LFO op de cutoff zet: `[{"source":"lfo","dest":"cutoff","amount":0.3},{"source":"off","dest":"cutoff","amount":0},{"source":"off","dest":"cutoff","amount":0},{"source":"off","dest":"cutoff","amount":0}]` (als tekst in `routes`).

Het apparaat heeft **geen patroon, geen sequencer en geen arpeggiator** in de state: een tune bevat alleen de klank. Een patroon speel je met een ander apparaat dat noten naar de ingang `notes` stuurt.

### Wat `getState()` geeft

Alle velden uit de tabellen hierboven, dus de 33 getallen (met `testNote`) en de acht keuzevelden (`variant`, `wave`, `wave2`, `lfoWave`, `legato`, `priority`, `preset`, `routes`); verder niets. `getPreset()` is hetzelfde zonder `testNote`.

### Wat niet in een tune hoort

- `testNote` (werkstand, geen klank).
- Routing of kabels: niet in de state.
- `preset` hoeft niet gezet te worden; laat hem op de standaard of op de naam van het klankbeeld waar de tune op lijkt.
- Velden die bij `single` geen effect hebben (zie tabel) hoeven er niet in te staan; ze veranderen het geluid niet.

## Wat het apparaat met een state doet (getest)

- Getallen buiten het bereik worden afgekapt (`cutoff: 1e9` wordt 16000, `level: -5` wordt 0). Een tekst, `null`, `NaN` of `Infinity` geeft de startwaarde.
- `setState({})` geeft de startwaarden. `null`, een tekst of een lijst als hele state geeft ook de startwaarden.
- Onbekende velden worden genegeerd. Zet er geen in.
- `getState()` → `setState()` en `getPreset()` → `setPreset()` geven dezelfde klank; `setPreset` laat `testNote` staan.
- Alle knoppen en keuzes in de kaart volgen een nieuwe state. Bij de opbouw `single` staan de bedieningen die dan geen effect hebben (de tweede oscillator, het highpass-filter, de aparte filter-envelope, ring, FM) niet op de kaart.

## Bewaker (NaN en Infinity)

Een `NaN` of `Infinity` van een ander apparaat op de audio-ingang (extern geluid) legde de oude versie voorgoed stil (gemeten: na een korte burst van `Infinity`, `1e30` of `1e9` bleef het geluid weg). De motor begrenst het externe geluid nu op ±16 en controleert per blok of zijn toestand (filters, envelopes, fasen, de LFO, de envelope-volger) nog eindig is; zo niet, dan wordt de toestand teruggezet en gaat het geluid door. Parameterberichten en events met een niet-eindig getal worden genegeerd. In het normale gebied is het geluid bit-identiek aan de oude versie (gemeten in een offline render). De filters zelf begrenzen hun interne toestand, dus een hoge resonantie met veel drive kan ze niet laten ontsporen.

## Een tune maken

Een pack heet `naam.patchkamer-tunes.json` en staat in `../../../tunes/`. Het formaat en de licentie (`CC0-1.0` voor alles in `tunes/`) staan in `../../../tunes/AGENTS.md`. Voor dit apparaat is `device` altijd `nl.patchkamer.patchmono` en elke tune is `kind: "set"` met een `state` als hierboven. Zet geen merknamen van bestaande apparatuur in naam of omschrijving, en verzin geen persoon bij `author`.

Neutrale richtlijnen (niet beluisterd; controleer ze in een host):

- **Basis / bas:** `variant: "single"`, `wave: "sawtooth"` of `square`, lage `cutoff` (300 … 1200 Hz), `resonance` 0,4 … 0,7, `filterEnv` 2 … 4, korte `decay` (0,15 … 0,4 s), `sustain` rond 0,3 … 0,6, `glide` 0,02 … 0,1 s voor een glijdende bas, `drive` 0,2 … 0,5. Zet `transpose` op −12 voor extra diepte.
- **Lead:** `dual` met `osc2Semi` 7 of 12, `osc2Fine` 5 … 15 cent, `wave` `sawtooth`, `legato: true`, `glide` 0,03 … 0,15 s, `vibrato` 5 … 20 cent met een langzame `lfoRate` (4 … 6 Hz), `cutoff` 2000 … 5000 Hz, `resonance` 0,3 … 0,6.
- **Pad:** `attack` 0,5 … 2 s, `release` 1 … 3 s, `sustain` 0,7 … 1, `dual` met `osc2Fine` 10 … 20 cent, `pwm` 0,5 met `wave: "square"` en `lfoRate` 0,3 … 1 Hz, `filterEnv` laag (0 … 1). Een monofone synth speelt geen akkoorden; een pad is hier een langzaam evoluerende enkele lijn.
- **Pluck:** `attack` 0,001 … 0,005 s, `decay` 0,1 … 0,3 s, `sustain` 0 … 0,1, `release` 0,1 … 0,3 s, `filterEnv` 3 … 5, `cutoff` 400 … 1200 Hz.
- **Arpeggio:** het apparaat heeft er geen; de tune bepaalt alleen de klank. Kies een korte, strakke envelope (attack ≤ 0,01 s, release ≤ 0,3 s), `legato: false` voor een duidelijke aanslag per noot en weinig `glide` (≤ 0,01 s). Het arpeggio zelf komt van een ander apparaat.
- **Extern geluid (vocoder-achtig of door de filters sturen):** `variant: "dual"`, `external` 1, `osc1` 0, `osc2` 0, zet de bron (bijvoorbeeld een drumloop of akkoorden) op de audio-ingang `in` en speel noten: de noot opent het volume, het filter en de cutoff-envelope bewerken het externe geluid. Een route met bron `external` laat het niveau van het externe geluid de cutoff of toonhoogte sturen.

### Wat een tune absoluut niet moet doen

- Niets laten klinken kan per ongeluk: `level` 0, of `sustain` 0 met een korte `decay` voor een lange noot, of `osc1`, `osc2`, `noise` en `external` allemaal 0 (dan is er niets om te horen). Controleer dat er minstens één bron open staat.
- `external` boven 0 zonder dat er iets op de ingang `in` komt, maakt geen geluid; gebruik het alleen voor een klank die bedoeld is voor een externe bron.
- Geen extreme combinaties van `drive` 1, `resonance` 1 en `filterEnv` 5 voor een gewone klank: dat is zeer scherp en hard. Het apparaat ontspoort er niet van (de uitvoer is begrensd), maar de klank is geen tune meer.
- Geen routes met een `amount` van ±1 op `pitch` voor een muzikale klank, tenzij de bron `lfo` heet en je wilt dat het wiebelt: ±24 halve tonen is een enorme sprong.
- Zet geen velden in die hier niet staan, en geen `routes` die geen tekst met een lijst van vier objecten of een echte lijst zijn.

## Controleren

- Draai vanuit de root van de repo: `node contract/validate-instrument.mjs devices/synths/PatchMono/patch-mono.patchkamer-device.js` en met `--lang en`. Dat moet `OK` geven, zonder `let op`.
- Je kunt niet horen hoe een tune klinkt. Heb je een browser, laad dan de host (`../../../patchkamer/AGENTS.md`) en kies de tune. Heb je geen browser, schrijf dan in je oplevering dat de tune **niet beluisterd** is.
- Alle tekst in het apparaat staat in het woordenboek `EN` bovenin het bestand (Nederlandse bron, Engels via `host.lang`). Een nieuwe tekst krijgt altijd nl én en.

## Wat je niet doet

- Verander nooit de `id`, de `kind`, de poort-id's of de namen van state-velden.
- Pas het apparaat niet aan om een tune te laten kloppen.
- Zet geen merknamen van bestaande apparatuur in naam of omschrijving.
- Commit of push niet, tenzij de opdracht dat vraagt.

## Documentatie en songs

Dit zijn de plaatsen waar je terechtkunt voor documentatie en voor het componeren van songs met dit apparaat. Songs zijn CC-BY-4.0, tunes en presets CC0-1.0, het apparaat AGPL-3.0-or-later.

- Handleiding van Patch Mono: [NL](../../../docs/synths/USER-MANUAL_NL.md#patch-mono) · [EN](../../../docs/synths/USER-MANUAL_EN.md#patch-mono).
- Overzicht van de soort: [README](../README.md); handleiding van de hele soort: [NL](../../../docs/synths/USER-MANUAL_NL.md) · [EN](../../../docs/synths/USER-MANUAL_EN.md).
- Tunes (klanken, `kind: set`): [patch-mono-styles.patchkamer-tunes.json](../../../tunes/patch-mono-styles.patchkamer-tunes.json). Kies een tune als beginpunt voor de `state` van dit apparaat in de song; velden die de tune niet noemt krijgen hun standaard. Hoe tunes zijn opgebouwd: [tunes/AGENTS.md](../../../tunes/AGENTS.md).
- Overzicht van alle apparaten en hun signaalketens: [devices/AGENTS.md](../../../devices/AGENTS.md). Een song componeren: [songs/AGENTS.md](../../../songs/AGENTS.md).
- Rol in een song: monofone synth (bas of lead) met twee soorten opbouw, gekozen met `variant`. Noten op `notes`, audio uit `out` (stereo); audio-ingang `in` voor extern geluid.
