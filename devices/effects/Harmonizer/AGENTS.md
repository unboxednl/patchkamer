# AGENTS.md: Harmonizer

Dit bestand is voor AI-agents die dit apparaat configureren of er presets voor maken. Het is niet geschreven voor mensen. Het hoort bij `../../../AGENTS.md` (algemeen); lees die eerst. Hier staat wat alleen voor Harmonizer geldt.

## Wat Harmonizer is

Maakt tot vier extra stemmen bij een invoersignaal. Elke stem heeft een eigen interval, niveau, pan, detune en vertraging. Een interval kan vast zijn (halve tonen) of in toonladdertrappen: dan blijven de stemmen binnen een gekozen toonladder en grondtoon en volgen ze de toon van de bron. De bron is de toon van het ingangsgeluid (monofone toonhoogtedetectie) of de noten op de eventingang `notes` (bijvoorbeeld van een akkoord- of melodiespeler). De stemmen delen één analyse; de motor is een korrelmotor (snel) of een fasevocoder met formantbehoud.

| | |
|---|---|
| Bestand | `harmonizer.patchkamer-device.js` (in deze map) |
| `id` | `nl.patchkamer.harmonizer`. Verander die nooit: daaraan hangen presets en songs van gebruikers |
| Naam | `Harmonizer` in alle talen; alleen de poortnamen (`Uit`/`Out`, `Noten`/`Notes`) verschillen per taal (via `i18n`) |
| Soort | `effect` (categorie `effect`): Harmonizer krijgt dus **presets** (geen tunes) |
| Poorten | audio-ingang `in`, audio-uitgang `out`, eventingang `notes`, sturing `mod` |
| Contract | v1.28 |
| Licentie apparaat | AGPL-3.0-or-later |

## Geen tunes, wel presets

Alleen apparaten met `kind: 'instrument'` hebben tunes. Harmonizer is een `effect`, dus het krijgt **presets** en **nooit tunes** (contract §0 en §13c). Het pack staat in [`../../../presets/harmonizer.patchkamer-presets.json`](../../../presets/harmonizer.patchkamer-presets.json): `formatVersion` 2, licentie `CC0-1.0`, `device` is `nl.patchkamer.harmonizer`, elke preset is `kind: "set"` en bevat alle velden van de state.

## De state

`state` van een preset is wat `getState()` teruggeeft. De stemvelden komen vier keer voor (`on1` … `on4`, enzovoort).

| Veld | Wat | Bereik | Start | Eenheid |
|---|---|---|---|---|
| `mode` | Motor: `grain` of `vocoder` | tekst | `grain` | – |
| `win` | Venster: `fast`, `normal`, `high` | tekst | `normal` | – |
| `follow` | Wat het interval volgt: `off` (halve tonen, vast), `detect` (toonladdertrappen, toon van de ingang), `notes` (toonladdertrappen, noten op de eventingang) | tekst | `off` | – |
| `key` | Grondtoon van de toonladder (0 = C … 11 = B) | 0 … 11 | 0 | halve tonen |
| `scale` | Toonladder: `major`, `minor`, `harmonic`, `melodic`, `dorian`, `phrygian`, `lydian`, `mixolydian`, `pentmaj`, `pentmin`, `blues`, `whole` | tekst | `major` | – |
| `onN` | Stem N aan | boolean | stem 1 en 2 aan | – |
| `ivN` | Interval van stem N: halve tonen als `follow` `off` is, anders toonladdertrappen | −24 … 24, hele getallen | 4, 7, −5, 12 | st of trap |
| `lvN` | Niveau van stem N | 0 … 1 | 0,7 | deel |
| `panN` | Pan van stem N | −1 … 1 | −0,5, 0,5, −0,8, 0,8 | – |
| `dtN` | Detune van stem N | −100 … 100 | 0 | cent |
| `dlyN` | Vertraging van stem N | 0 … 100 | 0 | ms |
| `dry` | Niveau van het droge signaal | 0 … 1 | 1 | deel |
| `harm` | Niveau van alle stemmen samen | 0 … 1 | 0,8 | deel |
| `glide` | Glijtijd van de intervallen (bij een nieuwe bronnoot) | 0 … 1000 | 40 | ms |
| `formant` | Formantbehoud (alleen Vocoder) | 0 … 1 | 1 | deel |
| `hum` | Humanize: trage willekeurige afwijking van de stemmen (tot ca. ±14 cent) | 0 … 1 | 0 | deel |

Hoe de toonladdertrappen werken (getest): de bron wordt eerst naar de dichtstbijzijnde noot van de toonladder gesnapt (gelijke afstand: de hogere). Daarna telt `ivN` toonladdernoten omhoog of omlaag. De stem schuift dan het ingangsgeluid met `doel − bronnoot` halve tonen, zodat de intonatie en het vibrato van de bron behouden blijven. Een trap 0 snapt dus de stem naar de toonladder. Bij `notes` kiest de laatste noot op de eventingang de bron; een noot met een `time` in de toekomst wordt op dat moment doorgegeven.

Latentie (bij 48 kHz, gemeten): Korrel 36 ms (venster `normal`), Vocoder 21 / 43 / 85 ms (`fast` / `normal` / `high`). De stemmen en het droge signaal worden in de tijd gelijk gehouden. De UI toont de latentie.

Wat het apparaat met een state doet (getest): getallen buiten het bereik worden afgekapt, tekst, `null`, `NaN` of een ontbrekende waarde geeft de startwaarde, onbekende velden worden genegeerd, een onbekende `mode`, `win`, `follow` of `scale` geeft de startwaarde.

Bewaker (getest): ingang begrensd op ±16, `NaN` wordt 0, toestanden per blok op eindigheid gecontroleerd en bij ontsporing teruggezet.

## Regels

- De motor staat ook in Pitch Shifter en Pitch Correction: elk apparaat is één zelfstandig bestand. Verbeter je de motor, pas hem in alle drie aan en draai `node docs/tools/measure-pitch.mjs` opnieuw.
- Verander je de worklet, verhoog dan de versie in de worklet-naam (`nl-patchkamer-harmonizer-1-0-0`).
- De bron moet monofoon zijn voor `detect`: bij akkoorden of ruis is de bron onbetrouwbaar. Gebruik dan `notes` of `off`.
- Vier stemmen met de Vocoder kosten ongeveer 7 % van een audioblok gemiddeld (spitsen tot 36 %); de korrelmotor met vier stemmen kost meer in spitsen (zie `docs/tools/measure-pitch.mjs harmonizer`).

## Controleren

- `node contract/validate-instrument.mjs devices/effects/Harmonizer/harmonizer.patchkamer-device.js` met `--lang nl` en `--lang en`, vanuit de root. Beide moeten `OK` geven, zonder `let op`.
- `node devices/effects/Harmonizer/check-preset.mjs presets/harmonizer.patchkamer-presets.json` haalt elke preset door het apparaat.
- `node docs/tools/measure-pitch.mjs harmonizer` meet toonhoogtefout per stem, de toonladderkeuze, de tijdsuitlijning, de rekenlast en de robuustheid.
- Je kunt niet horen hoe een preset klinkt. Schrijf in je oplevering dat een preset **niet beluisterd** is.

## Wat je niet doet

- Verander nooit de `id`, de `kind`, de poort-id's of de namen van state-velden.
- Pas het apparaat niet aan om een preset te laten kloppen.
- Zet geen merknamen van bestaande apparatuur in naam of omschrijving, en verzin geen persoon bij `author`.
- Commit of push niet, tenzij de opdracht dat vraagt.

## Documentatie en songs

Dit zijn de plaatsen waar je terechtkunt voor documentatie en voor het componeren van songs met dit apparaat. Songs zijn CC-BY-4.0, tunes en presets CC0-1.0, het apparaat AGPL-3.0-or-later.

- Handleiding van Harmonizer: [NL](../../../docs/effects/USER-MANUAL_NL.md#harmonizer) · [EN](../../../docs/effects/USER-MANUAL_EN.md#harmonizer).
- Overzicht van de soort: [README](../README.md); handleiding van de hele soort: [NL](../../../docs/effects/USER-MANUAL_NL.md) · [EN](../../../docs/effects/USER-MANUAL_EN.md).
- Presets (instellingen, `kind: set`): [harmonizer.patchkamer-presets.json](../../../presets/harmonizer.patchkamer-presets.json). Kies een preset als beginpunt voor de `state` van dit apparaat in de song; velden die de preset niet noemt krijgen hun standaard.
- Overzicht van alle apparaten en hun signaalketens: [devices/AGENTS.md](../../../devices/AGENTS.md). Een song componeren: [songs/AGENTS.md](../../../songs/AGENTS.md).
- Route voor agents: [soort Effects](../AGENTS.md) → [devices/AGENTS.md](../../AGENTS.md) → [root AGENTS.md](../../../AGENTS.md). Contract: [NL](../../../contract/PATCHKAMER-CONTRACT_NL.md) · [EN](../../../contract/PATCHKAMER-CONTRACT_EN.md). Hoe presets van dit apparaat zijn opgebouwd: [presets/AGENTS.md](../../../presets/AGENTS.md). <!-- agents-tree -->
- Rol in een song: harmoniestemmen bij een zanglijn of melodie als insert; audio in `in`, uit `out`. Voor stemmen binnen de toonladder: verbind een melodiebron met de eventingang `notes` en zet `follow` op `notes`, of laat de toon van de ingang volgen met `detect`.
