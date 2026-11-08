# AGENTS.md: Pitch Shifter

Dit bestand is voor AI-agents die dit apparaat configureren of er presets voor maken. Het is niet geschreven voor mensen. Het hoort bij `../../../AGENTS.md` (algemeen); lees die eerst. Hier staat wat alleen voor Pitch Shifter geldt.

## Wat Pitch Shifter is

Verschuift de toonhoogte van een stereosignaal met behoud van tempo, van −24 tot +24 halve tonen plus −100 tot +100 cent. Drie motoren:

- **Percussief** (`perc`): korte korrels zonder zoeker. Heel weinig latentie (1 tot 3 ms in rust), voor drums en korte klanken. Een aanhoudende toon klinkt ruw (de korrels sluiten niet aan).
- **Korrel** (`grain`): korrels met een correlatiezoeker die de golfvormen laat aansluiten. Voor zang, bas en instrumenten. De formanten schuiven mee.
- **Vocoder** (`vocoder`): een fasevocoder met faseverankerde pieken. Heeft formantbehoud en een formantverschuiving. Meeste latentie, schoonste resultaat bij zang, pads en stemmen.

Verder: een mix met een droog signaal dat in de tijd gelijk is gemaakt, een terugkoppeling (octaaf-echo, shimmer) met een toonfilter en zachte begrenzing, en een glijtijd voor het interval.

| | |
|---|---|
| Bestand | `pitch-shifter.patchkamer-device.js` (in deze map) |
| `id` | `nl.patchkamer.pitchshifter`. Verander die nooit: daaraan hangen presets en songs van gebruikers |
| Naam | `Pitch Shifter` in alle talen; alleen de poortnamen `Uit` en `Out` verschillen per taal (via `i18n`) |
| Soort | `effect` (categorie `effect`): Pitch Shifter krijgt dus **presets** (geen tunes) |
| Poorten | audio-ingang `in`, audio-uitgang `out`, sturing `mod` |
| Contract | v1.28 |
| Licentie apparaat | AGPL-3.0-or-later |

## Geen tunes, wel presets

Alleen apparaten met `kind: 'instrument'` hebben tunes. Pitch Shifter is een `effect`, dus het krijgt **presets** en **nooit tunes** (contract §0 en §13c). Het pack staat in [`../../../presets/pitch-shifter.patchkamer-presets.json`](../../../presets/pitch-shifter.patchkamer-presets.json): `formatVersion` 2, licentie `CC0-1.0`, `device` is `nl.patchkamer.pitchshifter`, elke preset is `kind: "set"` en bevat alle velden van de state.

## De state

`state` van een preset is wat `getState()` teruggeeft.

| Veld | Wat | Bereik | Start | Eenheid |
|---|---|---|---|---|
| `mode` | Motor: `perc`, `grain`, `vocoder` | tekst | `grain` | – |
| `win` | Venster: `fast`, `normal`, `high` (grotere venster = meer latentie, betere kwaliteit bij lage tonen) | tekst | `normal` | – |
| `semi` | Interval | −24 … 24, hele getallen | 0 | halve tonen |
| `cents` | Fijn | −100 … 100 | 0 | cent |
| `formant` | Formantbehoud (alleen Vocoder) | 0 … 1 | 1 | deel |
| `fshift` | Formantverschuiving (alleen Vocoder) | −12 … 12 | 0 | halve tonen |
| `mix` | Verhouding droog/nat | 0 … 1 | 1 | deel |
| `fb` | Terugkoppeling van de natte uitgang naar de ingang | 0 … 0,9 | 0 | deel |
| `fbtone` | Laagdoorlaat in de terugkoppeling | 500 … 16000 | 6000 | Hz |
| `glide` | Glijtijd van het interval | 0 … 500 | 20 | ms |

Latentie (bij 48 kHz, gemeten met `docs/tools/measure-pitch.mjs`): Percussief 1,3 / 2,0 / 3,0 ms; Korrel 14,1 / 16,0 / 18,9 ms; Vocoder 21,3 / 42,6 / 85,3 ms (venster `fast` / `normal` / `high`). In de korrelmotoren komt er bij een interval ongeveer `venster/2 × |1 − verhouding|` bij (octaaf omhoog: + ca. 20 ms bij `normal`). De UI toont de latentie. Het droge signaal wordt op de minimale latentie gezet.

Wat het apparaat met een state doet (getest): getallen buiten het bereik worden afgekapt, een tekst, `null`, `NaN` of een ontbrekende waarde geeft de startwaarde, een onbekende `mode` of `win` geeft de startwaarde, onbekende velden worden genegeerd.

Bewaker (getest): de ingang wordt begrensd op ±16 en `NaN` wordt 0; per blok worden toestanden op eindigheid gecontroleerd en bij een ontsporing teruggezet. Een wissel van `mode` of `win` bouwt de motor opnieuw op met een korte dip in het volume (geen tik); in de Vocoder is het geluid daarna pas na de latentie weer te horen.

## Regels

- De motor (FFT, korrelmotor, fasevocodermotor) staat ook in Harmonizer en Pitch Correction: elk apparaat is één zelfstandig bestand. Verbeter je de motor, pas hem dan in alle drie aan en draai `node docs/tools/measure-pitch.mjs` opnieuw.
- Verander je de worklet, verhoog dan de versie in de worklet-naam (`nl-patchkamer-pitchshifter-1-0-0`): de host onthoudt code per naam.
- Formantbehoud op een zuivere toon (sinus) laat het niveau zakken (−8 dB bij +7 st, 100%): een toon heeft geen formanten. Gebruik een lagere waarde of Korrel voor zulk materiaal.
- Maak geen preset met `fb` boven 0,9.

## Controleren

- `node contract/validate-instrument.mjs devices/effects/PitchShifter/pitch-shifter.patchkamer-device.js` met `--lang nl` en `--lang en`, vanuit de root. Beide moeten `OK` geven, zonder `let op`.
- `node devices/effects/PitchShifter/check-preset.mjs presets/pitch-shifter.patchkamer-presets.json` haalt elke preset door het apparaat.
- `node docs/tools/measure-pitch.mjs shifter` meet toonhoogtefout, artefactniveau, latentie, rekenlast en robuustheid.
- Je kunt niet horen hoe een preset klinkt. Schrijf in je oplevering dat een preset **niet beluisterd** is.

## Wat je niet doet

- Verander nooit de `id`, de `kind`, de poort-id's of de namen van state-velden.
- Pas het apparaat niet aan om een preset te laten kloppen.
- Zet geen merknamen van bestaande apparatuur in naam of omschrijving, en verzin geen persoon bij `author`.
- Commit of push niet, tenzij de opdracht dat vraagt.

## Documentatie en songs

Dit zijn de plaatsen waar je terechtkunt voor documentatie en voor het componeren van songs met dit apparaat. Songs zijn CC-BY-4.0, tunes en presets CC0-1.0, het apparaat AGPL-3.0-or-later.

- Handleiding van Pitch Shifter: [NL](../../../docs/effects/USER-MANUAL_NL.md#pitch-shifter) · [EN](../../../docs/effects/USER-MANUAL_EN.md#pitch-shifter).
- Overzicht van de soort: [README](../README.md); handleiding van de hele soort: [NL](../../../docs/effects/USER-MANUAL_NL.md) · [EN](../../../docs/effects/USER-MANUAL_EN.md).
- Presets (instellingen, `kind: set`): [pitch-shifter.patchkamer-presets.json](../../../presets/pitch-shifter.patchkamer-presets.json). Kies een preset als beginpunt voor de `state` van dit apparaat in de song; velden die de preset niet noemt krijgen hun standaard.
- Overzicht van alle apparaten en hun signaalketens: [devices/AGENTS.md](../../../devices/AGENTS.md). Een song componeren: [songs/AGENTS.md](../../../songs/AGENTS.md).
- Route voor agents: [soort Effects](../AGENTS.md) → [devices/AGENTS.md](../../AGENTS.md) → [root AGENTS.md](../../../AGENTS.md). Contract: [NL](../../../contract/PATCHKAMER-CONTRACT_NL.md) · [EN](../../../contract/PATCHKAMER-CONTRACT_EN.md). Hoe presets van dit apparaat zijn opgebouwd: [presets/AGENTS.md](../../../presets/AGENTS.md). <!-- agents-tree -->
- Rol in een song: toonhoogte verschuiven als insert (drums, zang, bas) of op een send-bus voor een octaaflaag of shimmer. Audio in `in`, uit `out`.
