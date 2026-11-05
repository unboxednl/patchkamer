# AGENTS.md: LFO

Dit bestand is voor AI-agents die dit apparaat configureren of er presets voor maken. Het is niet geschreven voor mensen. Het hoort bij `../../../AGENTS.md` (algemeen); lees die eerst. Hier staat wat alleen voor LFO geldt.

## Wat LFO is

Een LFO (low-frequency oscillator) op het tempo van de klok: een modulator die zelf geen geluid maakt, maar parameters van andere apparaten laat bewegen. Hij heeft acht vormen (sinus, driehoek, zaag op, zaag neer, blok, sample & hold, glad toeval en zelf te tekenen stappen), een vervorming per vorm, een fasevoorsprong, een unipolaire stand en een DAHDSR-envelope die start op de Trigger-ingang. De snelheid is een klokdeling (van 8 maten tot 1/32, ook triolen en punten) of vrij in Hz. Per doelparameter van een ander apparaat kies je hoe diep (−100 … +100% van het bereik van die parameter). Is de parameter snel stuurbaar (⚡), dan loopt de sturing sample-nauwkeurig via een audiosignaal, anders ongeveer 30 keer per seconde.

| | |
|---|---|
| Bestand | `lfo.patchkamer-device.js` (in deze map) |
| `id` | `nl.patchkamer.lfo`. Verander die nooit: daaraan hangen presets en songs van gebruikers |
| Naam | `LFO` in alle talen (er is geen `i18n` nodig: naam en poortnamen zijn in nl en en gelijk) |
| Soort | `modulator` (categorie `mod`): LFO krijgt dus **presets** (geen tunes) |
| Poorten | eventingang `trig` ("Trigger"), sturingsuitgang `mod` ("LFO"). Geen audio |
| Contract | v1.11 |
| Licentie apparaat | AGPL-3.0-or-later |

## Geen tunes, wel presets

Alleen apparaten met `kind: 'instrument'` hebben tunes. LFO is een `modulator`, dus het krijgt **presets** en **nooit tunes** (contract §0 en §13c). Een presetpack heet `lfo.patchkamer-presets.json` en staat in `../../../presets/`; het formaat is dat van het contract (§13c), `formatVersion` 2, licentie `CC0-1.0`, `device` is altijd `nl.patchkamer.lfo` en elke preset is `kind: "set"`.

## De state

LFO heeft `getPreset`/`setPreset`. **De `state` van een preset is wat `getPreset()` teruggeeft: alle velden hieronder, zonder `sel`.** `getState()` geeft daarbovenop `sel` (de toewijzingen aan doelapparaten): die horen bij de werkruimte en komen **niet** in een preset, omdat ze naar apparaten in die ene werkruimte verwijzen. `setPreset` laat de bestaande toewijzingen staan.

| Veld | Wat | Bereik | Start |
|---|---|---|---|
| `shape` | Vorm | `sin`, `tri`, `saw` (zaag op), `ramp` (zaag neer), `sqr` (blok), `sh` (sample & hold: een nieuwe willekeurige waarde per cyclus, stap), `noise` (glad toeval: tussen twee willekeurige waarden per cyclus), `steps` (zelf getekende stappen) | `sin` |
| `div` | Snelheid als klokdeling in tellen (kwartnoten) per cyclus, **als tekst** | `'32'` (8 maten), `'16'` (4 maten), `'8'` (2 maten), `'4'` (1 maat), `'2'` (1/2), `'1'` (1/4), `'0.5'` (1/8), `'0.25'` (1/16), `'0.125'` (1/32), `'0.6667'` (1/4 triool), `'0.3333'` (1/8 triool), `'0.1667'` (1/16 triool), `'1.5'` (1/4 punt), `'0.75'` (1/8 punt), `'free'` (vrij, dan geldt `hz`) | `'1'` |
| `hz` | Snelheid bij `div` = `'free'` (anders genegeerd) | 0,01 … 20 Hz | 1 |
| `deform` | Vervorming: scheeftrekken van de vorm. Sinus en driehoek: de piek schuift naar voren (−1) of achteren (+1). Zaag op en neer: de bocht (positief = lang laag en dan snel omhoog, negatief omgekeerd). Blok: pulsbreedte (0 = 50%, −1 ≈ 2%, +1 ≈ 98%). Glad toeval: hoe snel de overgang tussen twee waarden is. Andere vormen: geen effect | −1 … +1 | 0 |
| `phase` | Fasevoorsprong in een deel van een cyclus | 0 … 1 (= 0 … 360°) | 0 |
| `amp` | Sterkte: schaalt de hele uitslag | 0 … 1 | 1 |
| `uni` | Unipolair: de uitslag loopt van 0 tot `amp` in plaats van −`amp` tot +`amp` | boolean | `false` |
| `retrig` | De fase herstarten bij elke gebeurtenis op de Trigger-ingang (en bij het starten van de transport) | boolean | `false` |
| `steps` | Waarden van de getekende stappen (alleen bij `shape` = `steps`) | lijst van **16** getallen, elk −1 … +1 | `[1, 0.5, 0, -0.5, -1, -0.5, 0, 0.5, 1, 0.25, -0.25, 0.75, -0.75, 0, 0.5, -1]` |
| `nsteps` | Aantal stappen dat telt: de eerste `nsteps` waarden van `steps`, verdeeld over één cyclus | geheel getal 2 … 16 | 16 |
| `glide` | Glijden tussen stappen (aandeel van elke stap dat naar de volgende glijdt) | 0 … 1 | 0 |
| `env` | De envelope aan: de uitslag wordt vermenigvuldigd met een DAHDSR-envelope die start op de Trigger-ingang | boolean | `false` |
| `eDel` | Envelope: Delay (wachttijd) | 0 … 2 s | 0 |
| `eAtk` | Envelope: Attack | 0,001 … 4 s | 0,01 |
| `eHold` | Envelope: Hold | 0 … 2 s | 0 |
| `eDec` | Envelope: Decay | 0,001 … 4 s | 0,3 |
| `eSus` | Envelope: Sustain (niveau) | 0 … 1 | 0,6 |
| `eRel` | Envelope: Release (na het einde van de noot) | 0,001 … 6 s | 0,4 |
| `sel` | Toewijzingen: `{ doelId: { paramId: { d, s } } }` met diepte `d` (−1 … 1) en bron `s` (altijd `lfo`). **Niet in een preset.** | – | `{}` |

De waarden van `div` zijn tekst (`'0.5'`, niet `0.5`); een onbekende waarde geeft de standaard `'1'`. De sleutels en waarden zijn die van de eerste versie en blijven zo.

### Hoe de vormen zich gedragen

- Een cyclus duurt `div` tellen (bij `'free'`: 1/`hz` seconde). De LFO loopt mee met de klok (ook met stilstaande klok, op het tempo van de host); zijn fase hangt aan de maatpositie, dus twee LFO's met dezelfde deling lopen gelijk.
- Bipolair (`uni` uit) loopt de uitslag van −`amp` naar +`amp`; bij een doel dat al op zijn instelling staat, beweegt het dus om die instelling heen. Unipolair loopt van 0 naar `amp`: de parameter gaat alleen **omhoog** vanaf zijn eigen stand (met een negatieve diepte alleen omlaag).
- `sqr` met `uni` is een poort: 1 of 0. Met `deform` stel je de pulsbreedte in. `saw` met `uni` is een stijgende ramp per cyclus (0 naar `amp`); `ramp` met `uni` is een dalende ramp.
- Een **zuivere envelope** zonder LFO-golf maak je met `shape: 'steps'`, `steps` allemaal `1` (of allemaal `-1` voor een dip) en `env: true`.
- Bij `env: true` is de uitvoer **0 zolang er geen trigger is geweest**. Zo'n preset beweegt dus alleen als er noten of trigs op de Trigger-ingang komen, en de envelope loopt even lang als de noot duurt (gate). Een noot korter dan `eDel` + `eAtk` bereikt de top nooit.
- `steps`: de stappen verdelen één cyclus; met `div: '4'` en `nsteps: 16` is elke stap een 1/16. Een patroon van poortjes (aan/uit) schrijf je als `1` en `-1` met `uni: true` (1 wordt 1, −1 wordt 0, 0 wordt 0,5). Waarden voorbij `nsteps` doen niet mee, maar horen er wel in te staan (16 getallen).

## Wat een goede instelling is (voor preset-makers)

- **Diepte zit niet in de preset.** Hoe diep de LFO een parameter stuurt kiest de gebruiker per toewijzing; `amp` is een tweede, algemene sterkte. Houd `amp` bij presets die op toonhoogte bedoeld zijn laag (0,2 … 0,35): met de diepte op ±100% van een toonhoogtebereik klinkt alles vals.
- **Vibrato**: sinus, vrij, 4 … 7 Hz, `amp` 0,2 … 0,35. Een vertraagd vibrato gebruikt de envelope (`eDel` 0,3 … 0,6, lange `eAtk`, `eSus` 1) en vraagt dus een noot die lang genoeg duurt.
- **Tremolo**: sinus of driehoek, `uni`, 4 … 9 Hz (vrij) of op 1/8 of 1/16; bij een blok klinkt het hakkelig.
- **Filtersweeps**: langzaam (`'8'`, `'16'`, `'32'`), `uni`, zaag op/neer voor een opbouw of val, sinus of driehoek voor een ademend filter.
- **Panning**: langzame sinus of driehoek (`'8'`, `'4'`), bipolair, `amp` 0,8 … 1; een blok op `'1'` is ping-pong.
- **Wobble**: driehoek of sinus op `'1'`, `'0.5'`, triolen of `'2'` (half time), bipolair, `amp` 0,8 … 1.
- **Ritmische poorten**: blok met `uni` op `'0.5'`, `'0.25'`, triolen of punten, of een stappenpatroon. Voor een sidechain-gevoel: zaag op met `uni`, `'1'`, een positieve `deform` en een negatieve diepte op het volume (of positieve op een filter).
- **Generatief**: `sh` en `noise` op `'0.25'` … `'4'`; `amp` 0,5 … 0,8.
- **Ambient**: heel langzaam (`'16'`, `'32'`, of vrij 0,01 … 0,05 Hz), `amp` 0,4 … 0,6.
- **Klokdelingen per stijl**: kwartnoot-pompen voor house, 1/16 voor techno en trance, half time (`'2'`) voor dubstep, tripletten voor hiphop, 3-3-2 stappen voor drum and bass.

## Wat LFO met een state doet (getest)

- Getallen buiten het bereik worden afgekapt; een tekst, `null`, `NaN`, `Infinity` of een ontbrekende waarde geeft de startwaarde. `setState({})` geeft de startwaarden en lege toewijzingen.
- Een onbekende `shape` of `div` geeft `sin` of `'1'`. Een stappenlijst die geen lijst is, geeft de standaardlijst; een ongeldig element in de lijst geeft de standaardwaarde op die plek; elementen worden afgekapt op −1 … 1.
- Onbekende velden worden genegeerd. Zet er geen in.
- De knoppen, keuzes, vinkjes en de getekende golf volgen `setState`; `setState(getState())` en `setPreset(getPreset())` geven dezelfde state.
- Toewijzingen in `sel` werken pas als het doelapparaat is aangesloten (paarse kabel van `mod` naar de Mod-ingang): de lijst met parameters komt van dat apparaat.

Wat LFO met zijn ingangen doet (getest): de uitvoer is **altijd eindig** en ligt in −1 … +1. Een ongeldig tempo, een `NaN`- of `Infinity`-tijd, een ongeldige stap of maat van de klok, of een trigger met een ongeldige tijd of duur wordt genegeerd of door een veilige waarde vervangen. De moduleerwaarden en de snelle sturing zijn gelijk aan de oude versie.

## Controleren

- `node contract/validate-instrument.mjs devices/modulators/Lfo/lfo.patchkamer-device.js --lang nl` en `--lang en`, vanuit de root. Beide moeten `OK` geven, zonder `let op`.
- Je kunt niet horen hoe een preset klinkt of hoe de sturing aanvoelt. Schrijf in je oplevering dat een preset **niet beluisterd** is.
- Alle tekst in het apparaat staat in het woordenboek `EN` bovenin het bestand (Nederlandse tekst als sleutel, Engelse als waarde). Een nieuwe tekst krijgt altijd nl én en.
- De gedeelde code (Modkit: klok, toewijzingen, snelle route) heeft elke modulator als eigen kopie; een wijziging daar hoort in elk apparaat apart.

## Wat je niet doet

- Verander nooit de `id`, de `kind`, de poort-id's of de namen en waarden van state-velden.
- Pas het apparaat niet aan om een preset te laten kloppen.
- Zet geen `sel` in een preset en geen routes naar apparaten die niet bestaan.
- Zet geen merknamen van bestaande apparatuur of software in naam, preset of omschrijving, en verzin geen persoon bij `author`.
- Commit of push niet, tenzij de opdracht dat vraagt.
