# AGENTS.md: Frequency Shifter

Dit bestand is voor AI-agents die dit apparaat configureren of er presets voor maken. Het is niet geschreven voor mensen. Het hoort bij `../../../AGENTS.md` (algemeen); lees die eerst. Hier staat wat alleen voor Frequency Shifter geldt.

## Wat Frequency Shifter is

Verschuift alle frequenties een vast aantal Hz omhoog of omlaag. Dat is geen toonhoogteverandering en het resultaat is niet harmonisch: van zachte zweving tot metalige vervreemding. AudioWorklet met een eigen Hilbert-filter (127 tikken, Blackman-venster), stereo (het rechterkanaal kan de andere kant op schuiven) en terugkoppeling voor spiraal-effecten. De verschuiving is snel stuurbaar (sample-nauwkeurig, via de Mod-ingang).

| | |
|---|---|
| Bestand | `frequency-shifter.patchkamer-device.js` (in deze map) |
| `id` | `nl.patchkamer.freqshift`. Verander die nooit: daaraan hangen presets en songs van gebruikers |
| Naam | `Frequency Shifter` in alle talen; alleen de poortnamen hebben een Nederlandse variant (via `i18n`) |
| Soort | `effect`: Frequency Shifter krijgt dus **presets** (geen tunes) |
| Poorten | audio-ingang `in`, audio-uitgang `out`, sturing-ingang `mod` (verschuiving snel); geen events |
| Stuurbaar | `shift` (snel), `fb`, `stereo`, `mix` |
| Contract | v1.11 |
| Licentie apparaat | AGPL-3.0-or-later |

## Geen tunes, wel presets

Alleen apparaten met `kind: 'instrument'` hebben tunes. Frequency Shifter is een `effect`, dus het krijgt **presets** en **nooit tunes** (contract §0 en §13c). Maak voor Frequency Shifter geen pack in `../../../tunes/`. Een presetpack heet `naam.patchkamer-presets.json` en staat in `../../../presets/`; het formaat is dat van het contract (§13c), `formatVersion` 2, licentie `CC0-1.0`, `device` is altijd `nl.patchkamer.freqshift` en elke preset is `kind: "set"`. Maak alleen presets als de opdracht dat vraagt.

## De state

`state` van een preset is wat `getState()` teruggeeft (Frequency Shifter heeft geen `getPreset`).

| Veld | Wat | Bereik | Start | Eenheid |
|---|---|---|---|---|
| `shift` | Verschuiving, gekromd: de verschuiving in Hz is `±shift²` × `range` | −1 … 1 | 0,05 | – |
| `range` | Bereik van de verschuiving: ±20 (zweving), ±200 of ±2000 Hz (vervreemding) | keuze: 20, 200, 2000 | 200 | Hz |
| `fb` | Terugkoppeling | 0 … 0,95 | 0 | – |
| `stereo` | Rechterkanaal de andere kant op schuiven (1 = omgekeerd) | 0 … 1 | 0 | – |
| `mix` | Nat/droog | 0 … 1 | 1 | – |

Wat Frequency Shifter met een state doet (getest):
- Getallen buiten het bereik worden afgekapt; een tekst, `null`, `NaN`, `Infinity` of een ontbrekende waarde geeft de startwaarde.
- Een `range` die geen van 20, 200 of 2000 is, geeft 200.
- Onbekende velden worden genegeerd. Zet er geen in.

Wat Frequency Shifter met een foutieve ingang doet (getest): `NaN`, `±Infinity` en absurd grote waarden vergiftigen de terugkoppeling niet meer. De worklet begrenst de ingang op ±16 en maakt `NaN` tot 0, en maakt de vertraglijn en de terugkoppeling leeg als de uitvoer niet eindig of absurd groot (boven 1e4) wordt. De vorige versie bleef na één `NaN` voor altijd stil. Normaal geluid is bit-identiek aan de vorige versie. Het droge pad (`mix` onder 1) geeft de ingang, 63 samples vertraagd, ongewijzigd door, dus een `NaN` aan de ingang is tijdens die `NaN` zelf ook aan de uitgang te zien; daarna is alles weer in orde.

## Controleren

- `node contract/validate-instrument.mjs devices/effects/FrequencyShifter/frequency-shifter.patchkamer-device.js --lang nl` en `--lang en`, vanuit de root. Beide moeten `OK` geven, zonder `let op`.
- Je kunt niet horen hoe een preset klinkt. Heb je geen browser, schrijf dan in je oplevering dat de preset **niet beluisterd** is.
- Alle tekst in het apparaat staat in het woordenboek `EN` bovenin het bestand (Engels bij de Nederlandse bron). Een nieuwe tekst krijgt altijd nl én en.

## Wat je niet doet

- Verander nooit de `id`, de `kind`, de poort-id's of de namen van state-velden.
- Pas het apparaat niet aan om een preset te laten kloppen.
- Zet geen merknamen van bestaande apparatuur in naam of omschrijving, en verzin geen persoon bij `author`.
- Verander de worklet-code niet zonder de versie in `WNAME` te verhogen: de host onthoudt code per naam.
- Commit of push niet, tenzij de opdracht dat vraagt.
