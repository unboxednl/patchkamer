# AGENTS.md: Pitch Correction

Dit bestand is voor AI-agents die dit apparaat configureren of er presets voor maken. Het is niet geschreven voor mensen. Het hoort bij `../../../AGENTS.md` (algemeen); lees die eerst. Hier staat wat alleen voor Pitch Correction geldt.

## Wat Pitch Correction is

Monofone toonhoogtecorrectie voor een stem of een melodielijn. Het apparaat meet de toonhoogte (YIN, ca. 62 tot 1100 Hz, bereik kiesbaar), kiest de dichtstbijzijnde toegestane noot (12 schakelaars per toonhoogteklasse; grondtoon en toonladder zijn een snelkeuze) en schuift het geluid daarheen. Instelbaar: snelheid (0 ms = hard), mate, vibrato behouden, referentietoonhoogte A, een drempel en een houdtijd voor stukken zonder toon (die gaan onbewerkt door). Motor: korrel (snel, 11 tot 14 ms latentie) of fasevocoder met formantbehoud (21 tot 85 ms). Het scherm toont de gehoorde en de gecorrigeerde toonhoogte.

| | |
|---|---|
| Bestand | `pitch-correction.patchkamer-device.js` (in deze map) |
| `id` | `nl.patchkamer.pitchcorrection`. Verander die nooit: daaraan hangen presets en songs van gebruikers |
| Naam | `Pitch Correction` in alle talen; alleen de poortnamen `Uit` en `Out` verschillen per taal (via `i18n`) |
| Soort | `effect` (categorie `effect`): Pitch Correction krijgt dus **presets** (geen tunes) |
| Poorten | audio-ingang `in`, audio-uitgang `out`, sturing `mod` |
| Contract | v1.28 |
| Licentie apparaat | AGPL-3.0-or-later |

## Geen tunes, wel presets

Alleen apparaten met `kind: 'instrument'` hebben tunes. Pitch Correction is een `effect`, dus het krijgt **presets** en **nooit tunes** (contract §0 en §13c). Het pack staat in [`../../../presets/pitch-correction.patchkamer-presets.json`](../../../presets/pitch-correction.patchkamer-presets.json): `formatVersion` 2, licentie `CC0-1.0`, `device` is `nl.patchkamer.pitchcorrection`, elke preset is `kind: "set"` en bevat alle velden van de state.

## De state

`state` van een preset is wat `getState()` teruggeeft.

| Veld | Wat | Bereik | Start | Eenheid |
|---|---|---|---|---|
| `mode` | Motor: `grain` of `vocoder` | tekst | `vocoder` | – |
| `win` | Venster: `fast`, `normal`, `high` | tekst | `normal` | – |
| `range` | Bereik van de stem: `low` (62–420 Hz), `mid` (75–800 Hz), `wide` (90–1100 Hz) | tekst | `mid` | – |
| `key` | Grondtoon voor de snelkeuze (0 = C … 11 = B) | 0 … 11 | 0 | halve tonen |
| `scale` | Toonladder voor de snelkeuze: `chromatic`, `major`, `minor`, `harmonic`, `melodic`, `dorian`, `phrygian`, `lydian`, `mixolydian`, `pentmaj`, `pentmin`, `blues`, `whole`, `custom` | tekst | `major` | – |
| `notes` | Toegestane toonhoogteklassen, 12 getallen (0 of 1) vanaf C. **Dit veld bepaalt wat het apparaat doet**; `key` en `scale` zijn de snelkeuze die het veld vult | lijst van 12 | C-majeur | – |
| `speed` | Snelheid van de correctie (0 = hard; intern minimaal 3 ms) | 0 … 400 | 40 | ms |
| `amount` | Mate van de correctie | 0 … 1 | 1 | deel |
| `keep` | Vibrato behouden (0 = vlak maken, 1 = helemaal laten) | 0 … 1 | 0,5 | deel |
| `formant` | Formantbehoud (alleen Vocoder) | 0 … 1 | 1 | deel |
| `gate` | Drempel: onder dit niveau wordt geen toon gezocht | −70 … −20 | −50 | dB |
| `hold` | Houdtijd: zo lang blijft de laatste correctie staan als de toon wegvalt | 0 … 500 | 100 | ms |
| `mix` | Verhouding droog/nat | 0 … 1 | 1 | deel |
| `ref` | Referentietoonhoogte van A | 430 … 450 | 440 | Hz |

Zet `scale` op `custom` als `notes` niet bij een snelkeuze past. Maak je een preset: zet `notes` zelf (dat is wat telt) en `key` en `scale` consistent.

Beperkingen (getest en eerlijk): het apparaat is **monofoon**: akkoorden, meerdere stemmen of sterk inharmonische klanken worden niet goed gevolgd. Medeklinkers, adem en ruis zijn niet te meten en gaan onbewerkt door. De detectie heeft ca. 20 ms venster en de korrelmotor heeft artefacten bij grote verschuivingen; de fasevocoder klinkt gladder maar heeft meer latentie. Bij snelheid 0 en een veranderende toon klinkt de correctie robotachtig; dat is het bedoelde effect.

Latentie (bij 48 kHz, gemeten): Korrel 11,1 / 12,0 / 14,0 ms, Vocoder 21,3 / 42,6 / 85,3 ms (`fast` / `normal` / `high`). De UI toont de latentie.

Wat het apparaat met een state doet (getest): getallen buiten het bereik worden afgekapt, tekst, `null`, `NaN` of een ontbrekende waarde geeft de startwaarde, een `notes` die geen lijst van 12 is geeft de standaard, onbekende velden worden genegeerd.

Bewaker (getest): ingang begrensd op ±16, `NaN` wordt 0, toestanden per blok op eindigheid gecontroleerd en bij ontsporing teruggezet.

## Regels

- De motor en de detectie staan ook in Pitch Shifter en Harmonizer: elk apparaat is één zelfstandig bestand. Verbeter je de motor, pas hem in alle drie aan en draai `node docs/tools/measure-pitch.mjs` opnieuw.
- Verander je de worklet, verhoog dan de versie in de worklet-naam (`nl-patchkamer-pitchcorrection-1-0-0`).
- Het scherm tekent via `host.frame`, nooit via een eigen `requestAnimationFrame`.

## Controleren

- `node contract/validate-instrument.mjs devices/effects/PitchCorrection/pitch-correction.patchkamer-device.js` met `--lang nl` en `--lang en`, vanuit de root. Beide moeten `OK` geven, zonder `let op`.
- `node devices/effects/PitchCorrection/check-preset.mjs presets/pitch-correction.patchkamer-presets.json` haalt elke preset door het apparaat.
- `node docs/tools/measure-pitch.mjs correction` meet de detectienauwkeurigheid (ook met ruis en vibrato), de correctie, de toonladderkeuze, de snelheid, het vibratobehoud, de latentie, de rekenlast en de robuustheid.
- Je kunt niet horen hoe een preset klinkt. Schrijf in je oplevering dat een preset **niet beluisterd** is.

## Wat je niet doet

- Verander nooit de `id`, de `kind`, de poort-id's of de namen van state-velden.
- Pas het apparaat niet aan om een preset te laten kloppen.
- Zet geen merknamen van bestaande apparatuur in naam of omschrijving, en verzin geen persoon bij `author`.
- Commit of push niet, tenzij de opdracht dat vraagt.

## Documentatie en songs

Dit zijn de plaatsen waar je terechtkunt voor documentatie en voor het componeren van songs met dit apparaat. Songs zijn CC-BY-4.0, tunes en presets CC0-1.0, het apparaat AGPL-3.0-or-later.

- Handleiding van Pitch Correction: [NL](../../../docs/effects/USER-MANUAL_NL.md#pitch-correction) · [EN](../../../docs/effects/USER-MANUAL_EN.md#pitch-correction).
- Overzicht van de soort: [README](../README.md); handleiding van de hele soort: [NL](../../../docs/effects/USER-MANUAL_NL.md) · [EN](../../../docs/effects/USER-MANUAL_EN.md).
- Presets (instellingen, `kind: set`): [pitch-correction.patchkamer-presets.json](../../../presets/pitch-correction.patchkamer-presets.json). Kies een preset als beginpunt voor de `state` van dit apparaat in de song; velden die de preset niet noemt krijgen hun standaard.
- Overzicht van alle apparaten en hun signaalketens: [devices/AGENTS.md](../../../devices/AGENTS.md). Een song componeren: [songs/AGENTS.md](../../../songs/AGENTS.md).
- Route voor agents: [soort Effects](../AGENTS.md) → [devices/AGENTS.md](../../AGENTS.md) → [root AGENTS.md](../../../AGENTS.md). Contract: [NL](../../../contract/PATCHKAMER-CONTRACT_NL.md) · [EN](../../../contract/PATCHKAMER-CONTRACT_EN.md). Hoe presets van dit apparaat zijn opgebouwd: [presets/AGENTS.md](../../../presets/AGENTS.md). <!-- agents-tree -->
- Rol in een song: als insert op een zangspoor of een solo-instrument; audio in `in`, uit `out`. Zet de toonladder op de toonaard van de song.
