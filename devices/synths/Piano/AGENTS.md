# AGENTS.md: Piano

Dit bestand is voor AI-agents die **tunes voor Piano** maken of het apparaat bijwerken. Het is niet geschreven voor mensen. Het hoort bij `../../../AGENTS.md` (algemeen) en `../../../tunes/AGENTS.md` (regels voor tunepacks); lees die eerst. Hier staat wat alleen voor Piano geldt.

## Wat Piano is

De akoestische pianofamilie met een eigen motor (`PianoEngine`) in een AudioWorklet. Zes **typen**, te kiezen met `type`: `grand` (vleugel), `upright` (pianino), `honky` (honky-tonk, verstemd), `tine` (e-piano met zachte klokachtige tongen en tremolo), `reed` (e-piano met blaf en drive) en `clav` (clavichord: getokkeld en percussief). De motor is **modale synthese**: elke noot is een bank van gedempte trillers (draaiende oscillatoren met eigen uitklank), zonder samples en zonder tabellen per noot.

- **Deeltonen** voor `grand`, `upright`, `honky` en `clav`: tot 32 deeltonen, met snaarstijfheid (`f_n = n·f0·√(1 + B·n²)`, `B` hangt van de toonhoogte af) en een kleine uitrekking van de stemming (bassen iets te laag, hoge noten iets te hoog; beide meegeschaald door `inharm`). Het aanslagpunt (`strike`) zet een kam in het spectrum (`|sin(π·n·strike)|`); een hamerrolloff (`tone`, `velBright` en de aanslag) bepaalt hoeveel hoge deeltonen er zijn. `tine` en `reed` hebben eigen deeltoontabellen: `tine` heeft een grondtoon met zachte 2e en 3e harmonische plus twee korte, klokachtige tonen (verhouding 6,27 en 17,55) die met de aanslag sterker worden; `reed` heeft harmonischen met een sterke 2e en 3e en een hamerrolloff die met de aanslag sterk meegaat (de blaf), plus `drive`.
- **Snaren:** 1 tot 3 licht verstemde snaren per noot (vleugel en pianino: 1 snaar onder noot 33, 2 tot 53, daarna 3; honky-tonk: minstens 2; clavichord: 2 vanaf noot 40; e-piano's: 2 als `detune` boven 0,3 staat). De eerste zes deeltonen krijgen alle snaren, de hogere één; dat geeft de zweving.
- **Uitklank:** per deelton twee afnemende delen (snel en lang; `after` zet het aandeel van de lange staart). De duur hangt van de toonhoogte af (lage noten tot ~20 s, hoge noten onder een seconde) en hogere deeltonen sterven sneller. `decay` is een factor op die duur.
- **Hamergeluid:** een korte gefilterde ruisstoot die met `hammer`, de aanslag en het type meegaat.
- **Loslaten en pedaal:** bij een note-off (of het einde van `dur`) dempt een demper de deeltonen in `release` seconden, hoge deeltonen sneller. Staat het sustainpedaal in, dan blijft de noot klinken (met zijn natuurlijke uitklank) tot het pedaal omhoog gaat.
- **Klankbord:** vijf parallelle resonanties (rond 90, 170, 275, 450 en 820 Hz, schaalbaar met `bodyTune` en het type: een pianino heeft een grotere kast) op de stereosom (`body`).
- **Stereo:** elke noot staat naar toonhoogte in het beeld (`width`), de snaren van één noot een klein stukje uit elkaar.
- **Elektrisch:** tremolo met auto-pan (`tremolo`, `tremRate`) en een zachte verzadiger (`drive`) op de som, daarna een gelijkspanningsfilter en een zachte begrenzer.

Er zit **geen sequencer en geen effect** (galm, chorus) in: het apparaat speelt alleen de noten van de ingang `notes`, of de knoppen Test note en Test chord op de kaart.

### Verschil met Stage Keys

Stage Keys (`../StageKeys/`) is de toetsensynth voor elektrische en orgel-klanken (zeven modellen met een vaste uitklinktijd per model, eigen klavier, `played`-uitgang). Piano is de **akoestische pianofamilie**: vleugel, pianino en honky-tonk met echte deeltonen, snaarstijfheid, verstemde snaren, hamerpunt, uitklank die van de toonhoogte afhangt, sustainpedaal en klankbord. De tine- en riet-e-piano's in Piano zijn varianten van die motor met pianogedrag (pedaal, demper); wil je orgels, vibrafoon of een synthbas, of een eigen klavier met doorgifte, gebruik dan Stage Keys. Verwijs in een tune voor Piano nooit naar Stage Keys; de twee delen geen state.

| | |
|---|---|
| Bestand | `piano.patchkamer-device.js` (in deze map) |
| `id` | `nl.patchkamer.piano`. Verander die nooit: daaraan hangen tunes en songs van gebruikers |
| Naam | `Piano` in alle talen; de poortnamen hebben een Nederlandse variant (`Keyboard / noten`, `Stereo piano`) |
| Soort | `instrument`: dit apparaat krijgt dus **tunes** (geen presets) |
| Poorten | eventingang `notes` (Keyboard / notes), modulatie-ingang `mod`, audio-uitgang `out` (Stereo piano, stereo) |
| Worklet | `nl-patchkamer-piano-1-20-0`; verhoog het versienummer in de naam bij elke wijziging van de motorcode |
| Contract | v1.20 |
| Licentie apparaat | AGPL-3.0-or-later |

## De state

`getState()` geeft alle velden hieronder (19 getallen, `type` en `preset`; gewone JSON: geen lijsten, geen patroon, geen routing). Er is **geen** `getPreset`: een tune bewaart de hele state. Een waarde wordt op de stap van het veld afgerond en in het bereik afgekapt; een tekst, `NaN`, `Infinity`, `null` of een ontbrekende waarde geeft de startwaarde. Onbekende velden worden genegeerd. Het sustainpedaal is **geen** state.

### Toon en snaren

| Veld | Wat het doet | Bereik | Stap | Start |
|---|---|---|---|---|
| `tone` | Helderheid: hamerhardheid, dus hoeveel hoge deeltonen er zijn (3 octaven rolloff over het bereik) | 0 … 1 | 0,01 | 0,5 |
| `velBright` | Aanslagkleur: hoeveel een hardere aanslag helderder klinkt | 0 … 1 | 0,01 | 0,6 |
| `strike` | Aanslagpunt als deel van de snaarlengte; zet kammen in het spectrum | 0,04 … 0,4 | 0,005 | 0,125 |
| `inharm` | Snaarstijfheid en stemmingsuitrekking, als factor (0 = zuiver harmonisch, 1 = normaal, 2 = dubbel); werkt het sterkst bij `upright` en `honky`, nauwelijks bij `tine`/`reed` | 0 … 2 | 0,01 | 1 |
| `detune` | Verstemming tussen de snaren van een noot, cent (honky-tonk: 10 … 22) | 0 … 25 | 0,5 | 3 |
| `hammer` | Hamergeluid | 0 … 1 | 0,01 | 0,4 |

### Uitklank en klankbord

| Veld | Wat het doet | Bereik | Stap | Start |
|---|---|---|---|---|
| `decay` | Klankduur: factor op de uitklank (log) | 0,2 … 4 | 0,01 | 1 |
| `after` | Naklank: aandeel van de lange staart na de snelle uitklank | 0 … 1 | 0,01 | 0,5 |
| `release` | Dempertijd bij loslaten (60 dB over deze tijd, log) | 0,03 … 2 | 0,01 | 0,25 |
| `body` | Klankbord: hoeveel kastresonantie bij de som komt | 0 … 1 | 0,01 | 0,4 |
| `bodyTune` | Kastafstemming: factor op de resonantiefrequenties (log) | 0,5 … 2 | 0,01 | 1 |

### Elektrisch

| Veld | Wat het doet | Bereik | Stap | Start |
|---|---|---|---|---|
| `tremolo` | Tremolodiepte met auto-pan (links en rechts in tegenfase) | 0 … 1 | 0,01 | 0 |
| `tremRate` | Tremolosnelheid, Hz (log) | 0,5 … 9 | 0,1 | 4,5 |
| `drive` | Verzadiging (de blaf van `reed`) | 0 … 1 | 0,01 | 0 |

### Spel en niveau

| Veld | Wat het doet | Bereik | Stap | Start |
|---|---|---|---|---|
| `width` | Stereobreedte van de noten over het klavier | 0 … 1 | 0,01 | 0,6 |
| `velocity` | Hoeveel de aanslag het niveau bepaalt (0 = elke noot even hard) | 0 … 1 | 0,01 | 0,8 |
| `tune` | Stemming, cent | −100 … 100 | 1 | 0 |
| `transpose` | Transpositie in halve tonen, door de kaart op het nootnummer toegepast (hele getallen; geldt voor nieuwe noten) | −24 … 24 | 1 | 0 |
| `level` | Uitgangsniveau | 0 … 1 | 0,01 | 0,8 |

### De velden `type` en `preset`

`type` is een tekst: `grand`, `upright`, `honky`, `tine`, `reed` of `clav`. Een ongeldige waarde geeft `grand`. `preset` is de naam van de gekozen klank in de keuzelijst **Sound**: `Concert Grand`, `Studio Upright`, `Honky-tonk`, `Tine Piano`, `Reed Piano`, `Clavichord`, `Soft Felt Piano`, `Bright Pop Grand` of `Custom`. Het is alleen een label; de keuzelijst zet de bijbehorende waarden en het type wel echt in de state. De kaart zet het op `Custom` zodra een knop of het type verandert. **Zet in een tune `"preset": "Custom"`** en zet `type` altijd. Een ongeldige waarde van `preset` geeft `Concert Grand`.

## Spelen en modulatie

- Eventingang `notes`: `note` (met `dur`), `noteon` en `noteoff` (aangehouden toetsen), `cc` en `panic`/`allnotesoff`. Een `note` zonder `dur` en zonder `noteoff` klinkt door tot er een `panic` komt of de transport stopt: **een sequencer moet altijd `dur` meesturen**. Een `cc` met `id` gelijk aan een veld uit de tabellen (behalve `type` en `preset`) en `value` 0 … 1 zet dat veld lineair over zijn bereik en zet `preset` op `Custom`.
- **Sustainpedaal:** `{ type: 'cc', id: 'pedal' | 'sustain', value }` of een `cc` met `cc: 64`; een `value` van 0,5 of hoger is pedaal in. Het contract kent geen eigen pedaalgebeurtenis; dit is een afspraak van dit apparaat (het Keys-apparaat stuurt `pedal` mee bij een MIDI-pedaal). Een noot die wordt losgelaten terwijl het pedaal in staat, blijft klinken tot het pedaal omhoog gaat en wordt dan gedempt. De knop **Pedal** op de kaart doet hetzelfde. Een transportstop of `panic` zet het pedaal uit en laat alles in 0,15 s uitklinken.
- Stemmen: 40, één per noot. Zijn er 32 klinkende, dan wordt de zachtste uitklinkende (anders de zachtste) kort gedempt (15 ms); dezelfde noot opnieuw aanslaan dempt de vorige van die toonhoogte in 30 ms. Een oscillator die onhoorbaar wordt, wordt weggehaald, dus lange nagalmende noten kosten steeds minder rekentijd.
- Alle knoppen behalve `transpose` zijn stuurbaar via de paarse `mod`-ingang (één spoor: Piano); `type` en `preset` bewegen niet mee. Een modulatie werkt op de lopende regelaars (klankbord, tremolo, drive, stemming, niveau, breedte, kastafstemming, dempertijd bij het loslaten); waarden die per noot worden vastgelegd (`tone`, `velBright`, `strike`, `inharm`, `detune`, `decay`, `after`, `hammer`, `velocity`, `width`, `tune`) gelden voor de volgende noot.
- Parameters die lopend meegaan, gaan in de motor zacht over (tijdconstante ongeveer 40 ms): geen klikken bij een tune- of presetwissel (niet beluisterd).

## Instellingen voor een goede klank

Alle waarden zijn uitgangspunten; luisteren is niet mogelijk, controleer dus op bereik en gedrag.

- **Vleugel:** `type: grand`, `tone` 0,35 … 0,75, `inharm` 1, `detune` 3 … 4, `decay` 1 … 1,8, `body` 0,3 … 0,5, `hammer` 0,4. Zachte klank: lage `tone`, `velBright` 0,3.
- **Pianino:** `type: upright`, `tone` 0,25 … 0,55, `inharm` 1,1 … 1,4, `body` 0,55 … 0,6, `hammer` 0,5 … 0,6, `decay` 0,7 … 0,9.
- **Honky-tonk:** `type: honky`, `detune` 10 … 22, `tone` 0,6 … 0,7, optioneel `tune` −8 voor een kroegpiano.
- **Tine-e-piano:** `type: tine`, `inharm` 0, `detune` 1,5, `tremolo` 0,3 … 0,6 (`tremRate` 2,5 … 5,5), `decay` 1,3 … 2, `body` 0,2.
- **Riet-e-piano:** `type: reed`, `inharm` 0,05, `drive` 0,3 … 0,85, `velBright` 0,9 voor blaf bij hard spelen, `tremolo` 0,15 … 0,5.
- **Clavichord:** `type: clav`, `strike` 0,1 … 0,2, `decay` 0,8 … 1,1, `after` 0,15, `release` 0,08, `bodyTune` 1,2 … 1,4.
- **Voor laagjes onder een pad:** `hammer` 0 … 0,1, `tone` 0,3, `decay` 2 … 2,5, `velocity` 0,4, `level` 0,7.

## Wat een tune niet moet doen

- `level` op 0: stil. `tone` 0 met `velBright` 0: bijna alleen de grondtoon (niet beluisterd).
- `decay` 4 met `after` 1 en veel gelijktijdige noten: de stemmen zijn snel op en nieuwe noten nemen oude over.
- `drive` 1 met `velBright` 1 en `tone` 1 op `reed`: hard en schel (niet beluisterd).
- `inharm` 2 op `upright` met hoge noten: duidelijk vals (de boventonen lopen ver uit het harmonische).
- Geen velden verzinnen, geen `preset` anders dan `Custom`, en altijd `type` zetten.

## Bewaker

De motor accepteert alleen eindige berichten (een niet-eindige waarde in een nootbericht of parameterbericht wordt genegeerd of afgekapt, een nootlengte wordt begrensd), en de wachtrij is begrensd (2048). Elke oscillator van elke stem wordt per blok op eindigheid en grootte gecontroleerd en verwijderd als hij niet klopt; de ruisstoot en de uitgang worden gecontroleerd; de mix wordt op ±50 begrensd (NaN wordt 0) voordat hij de resonanties in gaat, de toestanden van de resonanties en het gelijkspanningsfilter worden per blok gecontroleerd en op 0 gezet als ze niet eindig of absurd zijn, en de uitgang is een zachte begrenzer. `process` vangt fouten op en geeft dan stilte. De draaiende oscillatoren worden per blok bijgewerkt zodat de amplitude niet wegloopt.

Getest (zie hieronder in "Controleren"): 80 renders van zes seconden met willekeurige en extreme instellingen (alle knoppen op minimum of maximum, soms `NaN`, `Infinity`, 1e9, 1e30, tekst, `null`), alle noten 0 … 127, vreemde velocity en duur, pedaalgebeurtenissen en een stoot niet-eindige parameterberichten, plus voor elk type alle 128 noten bij velocity 0,01 en 1 met extreme instellingen: 48,4 miljoen samples, 0 niet-eindig, hoogste uitvoerwaarde 1,0 (de begrenzer). Met opzettelijk vergiftigde oscillatoren, ruisfilter, resonanties, gelijkspanningsfilter en tremolofase (NaN en Infinity) is de uitvoer meteen weer eindig en klinkt een volgende noot gewoon.

## Een tune

Een pack heet `naam.patchkamer-tunes.json` en staat in `../../../tunes/`. Het formaat en de licentie (`CC0-1.0` voor alles in `tunes/`) staan in `../../../tunes/AGENTS.md`. Voor dit apparaat is `device` altijd `nl.patchkamer.piano` en elke tune is `kind: "set"` met een `state` als hierboven. Zet geen merknamen van bestaande apparatuur in naam of omschrijving (ook niet bij e-piano's: gebruik "tine" en "reed"), en verzin geen persoon bij `author`. Zet liever alle velden erin.

```json
{ "name": "Suitcase Tremolo", "kind": "set", "version": "1.0.0",
  "state": { "type": "tine", "tone": 0.5, "velBright": 0.6, "strike": 0.125, "inharm": 0, "detune": 1.5, "decay": 1.3, "after": 0.6, "release": 0.3,
             "hammer": 0.35, "body": 0.2, "bodyTune": 1, "tremolo": 0.6, "tremRate": 5.5, "drive": 0, "width": 1, "velocity": 0.8,
             "tune": 0, "transpose": 0, "level": 0.8, "preset": "Custom" } }
```

Het pack `../../../tunes/piano.patchkamer-tunes.json` heeft 43 tunes in 11 mappen (Grand 5, Upright 4, Honky-tonk 4, Tine 5, Reed 5, Clavichord 4, Layered 3, Ballad 4, Pop 3, Jazz 3, Lo-fi 3), met `tags` (`instrument/piano`, `instrument/piano/grand`, `.../upright`, `.../honky-tonk`, `.../electric`, `.../clavichord`, `style/ballad`, `style/pop`, `style/jazz`, `style/lofi`).

## Controleren

- Vanuit de root van de repo: `node contract/validate-instrument.mjs devices/synths/Piano/piano.patchkamer-device.js` (en met `--lang en` en `--lang nl`). Dat moet `OK` geven, zonder `let op`.
- Motor in Node benchmarken en op niet-eindige waarden testen: laad het apparaat met een nep-`AudioContext`, vang de workletcode op via `host.loadWorklet` en haal `PianoEngine` eruit; gebruik `engine.enqueue(...)` (`note`, `off`, `pedal`, `params`) en `engine.render(L, R, 128, t)`. Gemeten (Node, blokken van 128 samples bij 48 kHz, budget 2,67 ms): één noot gemiddeld 1,2 … 2,6% van het budget (p99 ≤ 10%); een akkoord van zes noten gemiddeld 1,3 … 2,9%, p99 ≤ 5,7%, maximum ≤ 17%; met het pedaal ingedrukt en 40 noten achter elkaar gemiddeld 4 … 10%, p99 ≤ 14%, maximum ≤ 22%; een tiennotenakkoord herhaald met pedaal gemiddeld 4,7%, p99 12,6%, maximum 30%. (Het allereerste blok van een run kan door het opwarmen van de JIT hoger zijn.)
- Klikken: bij een losse noot, dezelfde noot opnieuw, pedaal omhoog, transportstop en 60 noten achter elkaar (afkappen) is het tweede verschil van de uitvoer buiten de nootaanzetten niet groter dan 1,8 keer de omgeving. De aanzet zelf is een knik in de helling (de deeltonen beginnen bij nul, als een snelle hamer); dat is bedoeld.
- Je kunt niet horen hoe een tune klinkt. Heb je een browser, laad dan de host (`../../../patchkamer/AGENTS.md`) en kies de tune. Heb je geen browser, schrijf dan in je oplevering dat de tune **niet beluisterd** is. De klank van dit apparaat is nog niet beluisterd.
- Alle tekst in het apparaat staat in het woordenboek `EN` bovenin het bestand (Nederlandse bron, Engels via `host.lang`). Een nieuwe tekst krijgt altijd nl én en.

## Wat je niet doet

- Verander nooit de `id`, de `kind`, de poort-id's of de namen van state-velden.
- Pas het apparaat niet aan om een tune te laten kloppen.
- Commit of push niet, tenzij de opdracht dat vraagt.

## Documentatie en songs

- Handleiding van Piano: [NL](../../../docs/synths/USER-MANUAL_NL.md#piano) · [EN](../../../docs/synths/USER-MANUAL_EN.md#piano).
- Overzicht van de soort: [README](../README.md); handleiding van de hele soort: [NL](../../../docs/synths/USER-MANUAL_NL.md) · [EN](../../../docs/synths/USER-MANUAL_EN.md).
- Tunes (klanken, `kind: set`): [piano.patchkamer-tunes.json](../../../tunes/piano.patchkamer-tunes.json). Hoe tunes zijn opgebouwd: [tunes/AGENTS.md](../../../tunes/AGENTS.md).
- Overzicht van alle apparaten en hun signaalketens: [devices/AGENTS.md](../../../devices/AGENTS.md). Een song componeren: [songs/AGENTS.md](../../../songs/AGENTS.md).
- Route voor agents: [soort Synths](../AGENTS.md) → [devices/AGENTS.md](../../AGENTS.md) → [root AGENTS.md](../../../AGENTS.md). Contract: [NL](../../../contract/PATCHKAMER-CONTRACT_NL.md) · [EN](../../../contract/PATCHKAMER-CONTRACT_EN.md). Hoe tunes van dit apparaat zijn opgebouwd: [tunes/AGENTS.md](../../../tunes/AGENTS.md). <!-- agents-tree -->
- Rol in een song: akoestische en elektrische piano (40 stemmen) voor akkoorden, begeleiding en melodie. Noten op `notes`, audio uit `out` (stereo). Stuur hem met een sequencer die `dur` meestuurt; een pedaal kan als `cc` `pedal` mee. Er zit geen galm in, zet er een effect achter.
