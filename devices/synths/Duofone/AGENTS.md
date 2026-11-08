# AGENTS.md: Duofone

Dit bestand is voor AI-agents die **tunes voor Duofone** maken. Het is niet geschreven voor mensen. Het hoort bij `../../../AGENTS.md` (algemeen) en `../../../tunes/AGENTS.md` (regels voor tunepacks); lees die eerst. Hier staat wat alleen voor Duofone geldt.

## Wat Duofone is

Een analoog klinkende synth met twee onafhankelijke toonhoogten, een gedeeld filter en een gedeelde VCA, met ringmodulatie, hard sync en sample & hold. Geïnspireerd op klassieke duofone analoge synths.

| | |
|---|---|
| Bestand | `duofone.patchkamer-device.js` (in deze map) |
| `id` | `nl.patchkamer.duofone`. Verander die nooit: daaraan hangen tunes en songs van gebruikers |
| Soort | `instrument`: Duofone krijgt dus **tunes** (geen presets) |
| Contract | v1.11 |
| Licentie apparaat | AGPL-3.0-or-later |

## Wat je hier doet

Je maakt klanken (tunes) voor Duofone en zet ze als pack in `../../../tunes/`. Het apparaat zelf pas je alleen aan als de opdracht dat zegt (zie `../../../AGENTS.md`: `version` ophogen, `id`, poort-id's en state-velden gelijk houden, valideren met `node contract/validate-instrument.mjs devices/synths/Duofone/duofone.patchkamer-device.js`).

## De tune

Een pack heet `naam.patchkamer-tunes.json` en staat in `tunes/`. Het formaat en de licentie (`CC0-1.0` voor alles in `tunes/`) staan in `../../../tunes/AGENTS.md`. Voor Duofone is `device` altijd `nl.patchkamer.duofone` en elke tune is `kind: "set"` (Duofone heeft geen `parts`). De `state` van een tune is wat `getPreset()` van het apparaat teruggeeft.

```json
{
  "format": "patchkamer-tunes",
  "formatVersion": 1,
  "device": "nl.patchkamer.duofone",
  "name": "Duofone basis",
  "author": "<naam van de maker>",
  "license": "CC0-1.0",
  "description": "<korte omschrijving>",
  "tree": [
    {
      "folder": "Leads",
      "items": [
        {
          "name": "Duo Lead",
          "kind": "set",
          "version": "1.0.0",
          "state": {
            "cutoff": 3200,
            "resonance": 0.35,
            "filterEnv": 3,
            "keytrack": 0.5,
            "attack": 0.01,
            "decay": 0.4,
            "sustain": 0.6,
            "release": 0.35,
            "pw": 0.5,
            "pwm": 0.2,
            "noise": 0,
            "lfoRate": 2,
            "vibrato": 0,
            "lfoFilter": 0,
            "drive": 0.1,
            "glide": 0.005,
            "transpose": 0,
            "level": 0.75,
            "fAttack": 0.1,
            "fDecay": 0.4,
            "fSustain": 0.15,
            "fRelease": 0.3,
            "osc1": 0.7,
            "osc2": 0.5,
            "osc2Semi": 7,
            "osc2Fine": 8,
            "fm": 0,
            "audioFilter": 0,
            "ring": 0,
            "highpass": 40,
            "sampleHold": 0,
            "shFilter": 0,
            "preset": "Duo Brass",
            "variant": "duo",
            "wave": "sawtooth",
            "wave2": "square",
            "sync": false,
            "legato": true,
            "priority": "last",
            "filterType": "24",
            "ampMode": "adsr",
            "lfoWave": "triangle"
          }
        }
      ]
    }
  ]
}
```

## Regels voor `state` (getest op het apparaat zelf)

1. **Neem alle 42 velden op**, ook die je niet wijzigt. Laat je er een weg, dan vult Duofone ze aan met de standaardwaarden **plus** de startwaarden van het basisklankbeeld `Duo Brass`. Dat geeft niet wat in de tabel hieronder als standaard staat (bijvoorbeeld `ring` wordt 0 in plaats van 0,2). Een volledige state geeft overal hetzelfde geluid.
2. Waarden buiten het bereik worden afgekapt (`cutoff: 10` wordt 30). Blijf binnen het bereik, anders is de tune niet wat je opschrijft.
3. Een getal moet een getal zijn. Een getal als tekst (`"5000"`) wordt genegeerd en valt terug op de standaard. `sync` en `legato` zijn echte booleans (`true`/`false`), geen `1`/`0`.
4. Een keuzeveld met een waarde die niet in de lijst staat, valt terug op de standaard. Gebruik alleen de waarden uit de tabel.
5. Onbekende velden worden genegeerd. Verzin er geen en neem `testNote` niet op (dat veld hoort bij het toetsenbord in de UI, niet bij de klank).
6. `preset` is de naam van het basisklankbeeld. Gebruik een van de zes namen uit de tabel; een andere naam wordt `Duo Brass`. De naam van **jouw** tune staat in `name`, niet in `preset`.

## Velden

Numerieke velden (alle verplicht in `state`):

**Oscillatoren**

| Veld | Naam | Bereik | Start | Eenheid | Schaal |
|---|---|---|---|---|---|
| `pw` | Pulsbreedte | 0.05 … 0.95 | 0.5 | – | lineair |
| `noise` | Ruis | 0 … 1 | 0 | – | lineair |
| `transpose` | Transpositie | -24 … 24 | 0 | st | lineair |
| `osc1` | VCO A | 0 … 1 | 0.7 | – | lineair |
| `osc2` | VCO B | 0 … 1 | 0.5 | – | lineair |
| `osc2Semi` | VCO B interval | -24 … 24 | 0 | st | lineair |
| `osc2Fine` | VCO B fijn | -35 … 35 | 5 | cent | lineair |
| `ring` | Ringmodulatie | 0 … 1 | 0 | – | lineair |

**Filters**

| Veld | Naam | Bereik | Start | Eenheid | Schaal |
|---|---|---|---|---|---|
| `cutoff` | Cutoff | 30 … 16000 | 2400 | Hz | logaritmisch |
| `resonance` | Resonantie | 0 … 1 | 0.25 | – | lineair |
| `filterEnv` | Filter-EG | -5 … 5 | 2.5 | – | lineair |
| `keytrack` | Key tracking | 0 … 1 | 0.5 | – | lineair |
| `fAttack` | Filter attack | 0.001 … 4 | 0.1 | s | logaritmisch |
| `fDecay` | Filter decay | 0.01 … 8 | 0.4 | s | logaritmisch |
| `fSustain` | Filter sustain | 0 … 1 | 0.15 | – | lineair |
| `fRelease` | Filter release | 0.01 … 8 | 0.3 | s | logaritmisch |
| `highpass` | High-pass | 20 … 6000 | 40 | Hz | logaritmisch |

**Versterker / envelope**

| Veld | Naam | Bereik | Start | Eenheid | Schaal |
|---|---|---|---|---|---|
| `attack` | VCA attack | 0.001 … 4 | 0.008 | s | logaritmisch |
| `decay` | VCA decay | 0.01 … 8 | 0.3 | s | logaritmisch |
| `sustain` | VCA sustain | 0 … 1 | 0.65 | – | lineair |
| `release` | VCA release | 0.01 … 8 | 0.3 | s | logaritmisch |

**Modulatie**

| Veld | Naam | Bereik | Start | Eenheid | Schaal |
|---|---|---|---|---|---|
| `pwm` | PWM-diepte | 0 … 1 | 0.2 | – | lineair |
| `lfoRate` | LFO-snelheid | 0.05 … 30 | 2 | Hz | logaritmisch |
| `vibrato` | LFO → pitch | 0 … 120 | 0 | cent | lineair |
| `lfoFilter` | LFO → filter | 0 … 1 | 0 | – | lineair |
| `glide` | Portamento | 0.001 … 1 | 0.005 | s | logaritmisch |
| `fm` | VCO B → A FM | 0 … 3 | 0 | – | lineair |
| `audioFilter` | VCO B → filter | 0 … 1 | 0 | – | lineair |
| `sampleHold` | S&H → pitch | 0 … 1 | 0 | – | lineair |
| `shFilter` | S&H → filter | 0 … 1 | 0 | – | lineair |

**Master**

| Veld | Naam | Bereik | Start | Eenheid | Schaal |
|---|---|---|---|---|---|
| `drive` | Drive | 0 … 1 | 0.1 | – | lineair |
| `level` | Uitgang | 0 … 1 | 0.75 | – | lineair |

Keuzevelden (alle verplicht in `state`):

| Veld | Toegestane waarden (in de state) | Start |
|---|---|---|
| `variant` (Variant) | `duo` = Duofoon · twee VCO's, `mono` = Mono · één VCO | `duo` |
| `wave` (Golfvorm VCO A) | `sawtooth` = Zaagtand, `square` = Puls, `triangle` = Driehoek | `sawtooth` |
| `wave2` (Golfvorm VCO B) | `sawtooth` = Zaagtand, `square` = Puls, `triangle` = Driehoek | `square` |
| `filterType` (Filtersteilheid) | `12` = 12 dB, `24` = 24 dB | `24` |
| `ampMode` (VCA-envelope) | `adsr` = ADSR, `ar` = AR | `adsr` |
| `lfoWave` (LFO-vorm) | `sawtooth` = Zaagtand, `square` = Puls, `triangle` = Driehoek | `triangle` |
| `sync` (hard sync) | `true`, `false` (echte boolean) | `false` |
| `legato` | `true`, `false` (echte boolean) | `true` |
| `priority` (toetsprioriteit) | `last`, `low`, `high` | `last` |
| `preset` (basisklankbeeld) | een van: `Duo Brass`, `Ring Factory`, `Sample Hold Lab`, `Sync Flight`, `Mono Pulse Bass`, `Duo Atmosphere` | `Duo Brass` |

## Twee varianten

- **`duo`** (duofoon, twee VCO's): de laagste ingedrukte toets stuurt VCO A en de hoogste VCO B. Filter en VCA worden gedeeld. Alle velden werken.
- **`mono`** (één VCO): één oscillator, mono, één envelope voor VCA én filter. Deze velden hebben **geen effect**: `wave2`, `filterType`, `ampMode`, `sync`, `osc2`, `osc2Semi`, `osc2Fine`, `fm`, `audioFilter`, `ring`, `fAttack`, `fDecay`, `fSustain`, `fRelease`. Zet ze in een `mono`-tune op hun startwaarde uit de tabel, zodat de tune netjes blijft. `highpass` werkt wel in beide varianten.

## Controleren

Het apparaat heeft zelf een controle: je tune moet er ongewijzigd uitkomen. Draai vanuit de root van de repo:

```
node devices/synths/Duofone/check-tune.mjs tunes/<pack>.patchkamer-tunes.json
```

Het script laadt Duofone, zet elke tune erop en meldt elk veld dat ontbreekt, onbekend is, buiten het bereik valt of door het apparaat veranderd wordt, en of `device`, `format` en `license` kloppen. Het moet eindigen op een `OK`-regel (exit 0). De waarschuwingen van Node over het moduletype zijn onschuldig.

Het script kan niet horen of de tune goed klinkt. Heb je een browser, laad dan de host (`../../../patchkamer/AGENTS.md`), kies de tune en luister of hij de bedoelde klank heeft en niet vervormt of te zacht is. Heb je geen browser, schrijf dan in je oplevering dat de tune **niet beluisterd** is.

## Wat je niet doet

- Pas `duofone.patchkamer-device.js` niet aan om een tune te laten kloppen, en verander nooit de `id`.
- Zet geen merknamen van bestaande synths in de naam, omschrijving of `author` van een tune.
- Commit of push niet, tenzij de opdracht dat vraagt.

## Documentatie en songs

Dit zijn de plaatsen waar je terechtkunt voor documentatie en voor het componeren van songs met dit apparaat. Songs zijn CC-BY-4.0, tunes en presets CC0-1.0, het apparaat AGPL-3.0-or-later.

- Handleiding van Duofone: [NL](../../../docs/synths/USER-MANUAL_NL.md#duofone) · [EN](../../../docs/synths/USER-MANUAL_EN.md#duofone).
- Overzicht van de soort: [README](../README.md); handleiding van de hele soort: [NL](../../../docs/synths/USER-MANUAL_NL.md) · [EN](../../../docs/synths/USER-MANUAL_EN.md).
- Tunes (klanken, `kind: set`): [duofone-styles.patchkamer-tunes.json](../../../tunes/duofone-styles.patchkamer-tunes.json). Kies een tune als beginpunt voor de `state` van dit apparaat in de song; velden die de tune niet noemt krijgen hun standaard. Hoe tunes zijn opgebouwd: [tunes/AGENTS.md](../../../tunes/AGENTS.md).
- Overzicht van alle apparaten en hun signaalketens: [devices/AGENTS.md](../../../devices/AGENTS.md). Een song componeren: [songs/AGENTS.md](../../../songs/AGENTS.md).
- Route voor agents: [soort Synths](../AGENTS.md) → [devices/AGENTS.md](../../AGENTS.md) → [root AGENTS.md](../../../AGENTS.md). Contract: [NL](../../../contract/PATCHKAMER-CONTRACT_NL.md) · [EN](../../../contract/PATCHKAMER-CONTRACT_EN.md). Hoe tunes van dit apparaat zijn opgebouwd: [tunes/AGENTS.md](../../../tunes/AGENTS.md). <!-- agents-tree -->
- Rol in een song: synth met twee onafhankelijke toonhoogten voor bas, lead of effecten. Noten op `notes`, audio uit `out` (stereo), `mod` voor sturing; geen eigen patroon, dus stuur hem met een sequencer.
