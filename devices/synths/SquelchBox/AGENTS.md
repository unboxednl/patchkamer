# AGENTS.md: Squelch Box

Dit bestand is voor AI-agents die **tunes voor Squelch Box** maken of het apparaat bijwerken. Het is niet geschreven voor mensen. Het hoort bij `../../../AGENTS.md` (algemeen) en `../../../tunes/AGENTS.md` (regels voor tunepacks); lees die eerst.

## Wat Squelch Box is

Een zo getrouw mogelijke acid-bassynth, geïnspireerd op klassieke acid-bassynths uit de jaren tachtig: één oscillator, een driepolig resonant diode-ladderfilter van 18 dB/oct, een filter-envelope met accentcircuit, slide met vaste glijtijd en een ingebouwde 16-staps sequencer. Eigen motor (`SquelchEngine`) in een AudioWorklet, intern op 2x of 4x oversampling (volgt `host.audio.oversample`, minimaal 2x). Mono; de uitgang geeft hetzelfde signaal op twee kanalen.

| | |
|---|---|
| Bestand | `squelch-box.patchkamer-device.js` (in deze map) |
| `id` | `nl.patchkamer.squelchbox`. Verander die nooit: daaraan hangen tunes en songs |
| Naam | `Squelch Box` in alle talen; poortnamen `Out`/`Notes` hebben een Nederlandse variant (`Uit`, `Noten`) via `i18n` |
| Soort | `instrument`: dit apparaat krijgt **tunes** |
| Poorten | eventingang `notes`, modulatie-ingang `mod`, audio-uitgang `out` |
| Contract | v1.27 (apparaatversie 1.20.0, zoals de andere recent gebouwde apparaten) |
| Worklet | `nl-patchkamer-squelchbox-1-20-0`: verhoog de versie in de naam bij elke wijziging van de motor |
| Licentie | AGPL-3.0-or-later |

Verschil met **Acid Baselines** en **Acid Stepper**: die zijn algemene bassynths met Web Audio-biquads (tweevoudig of vierpolig filter) en veel extra regelaars. Squelch Box heeft een eigen filtermodel en bewust weinig knoppen. **Let op de slide-betekenis:** bij Squelch Box staat `sl` op de stap *vanwaar* je glijdt (slide naar de volgende stap), zoals bij het origineel; bij Acid Baselines staat de vlag op de bestemmingsnoot.

## De state

`state` is wat `getState()` teruggeeft: de knoppen plus de patronen. Er is geen `getPreset`.

| Veld | Wat | Bereik | Start |
|---|---|---|---|
| `tune` | Stemming in cent | −100 … 100 | 0 |
| `cut` | Cutoff in Hz (log) | 100 … 5000 | 420 |
| `res` | Resonantie | 0 … 1 | 0,62 |
| `envmod` | Env mod (0 … 4 octaven) | 0 … 1 | 0,6 |
| `decay` | Decay van de filter-envelope in s (tijd tot 10%) | 0,2 … 2 | 0,45 |
| `accent` | Accentsterkte | 0 … 1 | 0,65 |
| `wave` | Golfvorm | `saw` of `square` | `saw` |
| `vol` | Volume | 0 … 1 | 0,7 |
| `slide` | Slide-tijd in s (tot 95%) | 0,02 … 0,3 | 0,06 |
| `gate` | Gate-lengte als deel van een stap | 0,2 … 0,95 | 0,55 |
| `drive` | Extra uitgangsdrive (uit = origineel) | 0 … 1 | 0 |
| `trans` | Transpositie in halve tonen | −12 … 12 | 0 |
| `drift` | Drift in stemming | 0 … 1 | 0,4 |
| `seqOn` | Interne sequencer aan | `true`/`false` | `true` |
| `pat` | Gekozen patroon (0 = patroon 1) | 0 … 15 | 0 |
| `patterns` | Tot 16 patronen; ontbrekende zijn leeg | zie hieronder | patroon 1 gevuld |

Een patroon: `{ len, n, oc, acc, sl, tie }` met `len` 1 … 16 en vijf arrays van 16: `n` = noot 0 … 12 vanaf C2 (0 = C2, 9 = A2, 12 = C3) of −1 voor een rust; `oc` = −1, 0 of 1 (octaaf omlaag/omhoog); `acc`, `sl`, `tie` = 0 of 1. `sl` op stap i: glijd naar stap i+1 en houd de gate (geen nieuwe aanzet), als stap i+1 een noot heeft. `tie` op stap i: de gate van stap i−1 loopt door, op de toonhoogte van stap i, zonder nieuwe aanzet. De positie is `(bar·16 + step) mod len`, dus een lengte onder 16 loopt los van de maat. `trans` bepaalt de toonsoort; zet de grondtoon van een tune daarmee.

Een tune bevat alle velden behalve eventueel een deel van `patterns`; elke tune in het meegeleverde pack heeft twee patronen (hoofdlijn en variatie).

## Wat het modelleert, benadert en niet modelleert

**Modelleert** (met de gemeten waarden uit de oplevering):
- Zaagtand en een uit de zaagtand afgeleide blokgolf (pulsbreedte 50% plus een hellend dak), polyBLEP-bandbegrensd, intern 2x/4x oversampling met een Kaiser-decimatiefilter.
- Filter: vier TPT-trappen (zero-delay-feedback) met rationale tanh-verzadiging per trap; uitgang na trap 3 (18 dB/oct), terugkoppeling vanaf trap 4 door een hoogdoorlaat van 150 Hz. Gemeten helling 17,9 dB/oct (4 → 8 kHz bij cutoff 1 kHz), resonantiepiek op de cutoff, zelfoscillatie bij resonantie ≥ 0,9 boven ca. 2 kHz en bij 1,0 boven ca. 700 Hz; het laag neemt af met resonantie (zie de oplevering).
- Cutoff via een exponentiële converter (octaven), zonder toetsvolging.
- Envelopes: filter-envelope met snelle aanzet (ca. 3 ms) en exponentiële decay (knop = tijd tot 10%, 0,2 … 2 s); bij een accent altijd een vaste decay van 0,2 s. Accent: extra filter-sweep, harder, en een condensator (laadt 35% per accent, ontlaadt met τ = 0,6 s) waardoor opeenvolgende accenten hoger openen. VCA: aanzet ca. 3 ms, lange staart (τ = 1,8 s), release ca. 10 ms (τ).
- Slide: exponentiële glijding in toonhoogte (constante tijd, 60 ms tot 95%), legato: de envelopes starten niet opnieuw. Tie: gate blijft hoog, toonhoogte springt.
- Kleine drift in stemming; DC-filter; zachte begrenzer op de uitgang.

**Benadert** (uit publiek beschreven analyses, niet gemeten aan hardware):
- De exacte vorm van de golven (de kromming van de zaagtand, de helling en de pulsbreedte van de blokgolf, het niveau van de blokgolf ten opzichte van de zaagtand).
- De interactie tussen de filtertrappen: de vier trappen zijn gelijk; het echte ladderfilter heeft belading tussen de trappen. Het resonantiebereik, de terugkoppelingshoogdoorlaat en de verzadigingsmaat zijn gekozen, niet gemeten.
- Alle tijdconstanten (envelope-aanzet, VCA-decay, accentcondensator, release) en de accenthoogte.

**Niet gemodelleerd:** temperatuur- en componentspreiding per exemplaar, ruis, voedingsspanningsdalingen, de kleine klik van het schakelen, de pitch-afhankelijke pulsbreedte, de sequencer-quirks van de oorspronkelijke machine (bijvoorbeeld de tikfout bij tie-slide), polyfonie, stereo.

## Meetscripts en controles

Draai na elke wijziging `node contract/validate-instrument.mjs devices/synths/SquelchBox/squelch-box.patchkamer-device.js` (ook met `--lang en` en `--lang nl`). Voor een tunepack draai je `node devices/synths/SquelchBox/check-tune.mjs tunes/<pack>.patchkamer-tunes.json`: die haalt elke tune door `setState()` en `getState()` en meldt een ontbrekend of onbekend veld, een waarde die het apparaat verandert (bijvoorbeeld buiten het bereik) en een fout in `format`, `device`, `kind` of de licentie. De patronenlijst vult het apparaat aan tot 16 plekken; de tunecheck eist dat de ontbrekende plekken leeg zijn. Dat controleert de state, niet het geluid: of de motor bij elke tune alleen eindige samples geeft, test je apart (laad `WORKLET` met een nep-`host.loadWorklet` en render `SquelchEngine` in blokken van 128). Een geluidswijziging is niet beluisterd tenzij de oplevering dat zegt.

## Skins

Alle regelaars staan via `host.ui.knob`, `host.ui.select` en `host.ui.steps` met `id` en `group` (`sound` incl. de golfvorm, `out`, `extra`, `seq`) in het register; een skin kan de knoppen als draaiknop tonen en per groep een kader geven. Het apparaat tekent in het vlak van de kaart zelf (geen shadow root), dus een skin kan er geen eigen CSS in kwijt. Sinds 1.23.0 staan de blokken Klank, Uitgang en Extra's daarom in `div.sq-blk` binnen `div.sq-blks`, en heeft het apparaat een paar CSS-regels die alleen gelden als de host `data-pk-sec` op een knoppenblok zet (kleine-letter labels, strakke koppen, lage scope, lage stappenrijen, strakke knoppenrijen). Zonder skin is de kaart ongewijzigd. De meegeleverde skin `Compact` staat in `../../../skins/library/nl.patchkamer.squelchbox/` (ongeveer 480 x 703 punten tegenover 900 x 1071). Wijzig je de opbouw van `.sq-blks`, `.sq-grid` of `.sq-seq`, controleer dan die skin.

## Documentatie en songs

- Handleiding van Squelch Box: [NL](../../../docs/synths/USER-MANUAL_NL.md#squelch-box) · [EN](../../../docs/synths/USER-MANUAL_EN.md#squelch-box).
- Overzicht van de soort: [README](../README.md); handleiding van de hele soort: [NL](../../../docs/synths/USER-MANUAL_NL.md) · [EN](../../../docs/synths/USER-MANUAL_EN.md).
- Tunes (klanken, `kind: set`, met eigen patronen): [squelch-box-styles.patchkamer-tunes.json](../../../tunes/squelch-box-styles.patchkamer-tunes.json). Hoe tunes zijn opgebouwd: [tunes/AGENTS.md](../../../tunes/AGENTS.md).
- Overzicht van alle apparaten en hun signaalketens: [devices/AGENTS.md](../../../devices/AGENTS.md). Een song componeren: [songs/AGENTS.md](../../../songs/AGENTS.md).
- Route voor agents: [soort Synths](../AGENTS.md) → [devices/AGENTS.md](../../AGENTS.md) → [root AGENTS.md](../../../AGENTS.md). Contract: [NL](../../../contract/PATCHKAMER-CONTRACT_NL.md) · [EN](../../../contract/PATCHKAMER-CONTRACT_EN.md). Hoe tunes van dit apparaat zijn opgebouwd: [tunes/AGENTS.md](../../../tunes/AGENTS.md). <!-- agents-tree -->
- Rol in een song: een acid-baslijn die vanzelf speelt (zet de klok aan), of noten van een externe sequencer op `notes` met `vel` > 0,85 voor accent. Audio uit `out` (mono op twee kanalen).
