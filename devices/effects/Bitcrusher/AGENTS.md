# AGENTS.md: Bitcrusher

Dit bestand is voor AI-agents die dit apparaat configureren of er presets voor maken. Het is niet geschreven voor mensen. Het hoort bij `../../../AGENTS.md` (algemeen); lees die eerst. Hier staat wat alleen voor Bitcrusher geldt.

## Wat Bitcrusher is

Een digitale vervuiler in één AudioWorklet (stereo, één gedeelde samplekloktik voor beide kanalen). Signaalweg: ingang × `input` → (optioneel) anti-alias-filter → vasthouden op `rate` (met jitter) → ruis en dither → kwantiseren op `bits` → vasthouden of lineair tussen de samples → DC-blokkering (8 Hz) → hoogdoorlaat → laagdoorlaat → niveau → mix met het droge signaal. Aliasing is een keuze: met `aa` uit vouwt alles boven de halve samplerate terug, met `aa` aan wordt het eerst weggefilterd (vierde orde, 0,45 × samplerate). Het scherm bovenin toont een rekenmodel van de gekwantiseerde golfvorm (1 kHz bij 48 kHz) met het echte signaal er vaag doorheen.

| | |
|---|---|
| Bestand | `bitcrusher.patchkamer-device.js` (in deze map) |
| `id` | `nl.patchkamer.bitcrusher`. Verander die nooit: daaraan hangen presets en songs |
| Naam | `Bitcrusher` in alle talen; alleen de poortnamen `Uit` en `Out` verschillen per taal (via `i18n`) |
| Soort | `effect`: Bitcrusher krijgt dus **presets** (geen tunes) |
| Poorten | audio-ingang `in`, audio-uitgang `out`, sturing `mod` |
| Contract | v1.28 |
| Licentie apparaat | AGPL-3.0-or-later |
| Controle van een pack | `node devices/effects/Bitcrusher/check-preset.mjs presets/bitcrusher.patchkamer-presets.json` |
| Metingen | `node docs/tools/measure-bitcrusher.mjs` (SNR per bit, dither, aliasing, jitter, ruis, stabiliteit, rekenlast) |

## De kwantiseerstijlen (`style`)

| Waarde | Wat | Opmerking |
|---|---|---|
| `tread` | mid-tread: nul is een niveau (tweeslagcomplement: −1 … 1−stap) | bij 1 bit blijven alleen −1 en 0 over |
| `rise` | mid-rise: geen nul-niveau, symmetrisch rond 0, genormeerd op ±1 | 1 bit is een zuivere vierkante golf van ±1 |
| `floor` | afkappen (naar beneden afronden), zoals goedkope converters | gemiddeld een halve stap te laag (gelijkspanning, wordt geblokkeerd) |
| `mulaw` | µ-law-compressie (µ = 255), kwantiseren, expanderen | fijnere stappen bij zachte signalen; lagere SNR bij vol uitgestuurd |

## De state

`state` van een preset is wat `getState()` teruggeeft (Bitcrusher heeft geen `getPreset`).

| Veld | Wat | Bereik | Start | Eenheid |
|---|---|---|---|---|
| `bits` | bitdiepte; breuken mogen (2^bits niveaus) | 1 … 16 | 8 | bit |
| `rate` | doelsamplerate (op of boven de samplerate van de context: geen reductie) | 100 … 48000 (log) | 16000 | Hz |
| `style` | kwantiseerstijl | `tread`, `rise`, `floor`, `mulaw` | `tread` | – |
| `interp` | tussen de samples | `hold` (vasthouden), `linear` (één houdperiode vertraging) | `hold` | – |
| `aa` | anti-alias-voorfilter | boolean | `false` | – |
| `jitter` | onregelmatigheid van de samplekloktik (1 = ±50% van de periode) | 0 … 1 | 0 | deel |
| `input` | versterking voor het crushen | −12 … 24 | 0 | dB |
| `dither` | hoeveelheid dither (1 = standaardamplitude van de soort) | 0 … 1 (0 = uit) | 0 | deel |
| `dtype` | soort dither | `rpdf`, `tpdf`, `shaped` (TPDF met eerste-orde ruisvorming naar hoge frequenties) | `tpdf` | – |
| `noise` | witte ruis voor de kwantiseerder, amplitude = noise² × 0,1 | 0 … 1 (0 = uit) | 0 | deel |
| `hp` | hoogdoorlaat na het crushen (12 dB/okt.) | 20 … 4000 (onder 20,5 Hz uit) | 20 | Hz |
| `post` | laagdoorlaat na het crushen (boven 19,99 kHz uit) | 500 … 20000 | 20000 | Hz |
| `out` | uitgangsniveau | −24 … 12 | 0 | dB |
| `mix` | droog/nat | 0 … 1 | 1 | deel |

Wat Bitcrusher met een state doet (getest met `check-preset.mjs`): getallen buiten het bereik worden afgekapt; tekst, `null`, `NaN` of een ontbrekende waarde geeft de startwaarde; een onbekende `style`, `interp` of `dtype` geeft de startwaarde; onbekende velden worden genegeerd.

## Regels en vuistregels voor presets

- Een preset bevat **alle** velden.
- Lage bitdiepte en lage samplerate zijn luider en schriller dan het origineel: zet `out` een paar dB lager (meegeleverd: −2 … −6 dB bij 3 tot 5 bit).
- Voor telefoon en radio: `aa: true`, `hp` rond 300 Hz en `post` rond 3,4 kHz.
- Bij `interp: linear` loopt het natte signaal één houdperiode (bij 12 kHz op 48 kHz: 4 samples) achter op het droge: gebruik dan `mix` op 100%, anders ontstaat een kamfilter.
- Een mid-rise-quantiser geeft in stilte een vaste gelijkspanning; de DC-blokkering begint daar in rust, dus er is geen klik bij het laden.

## Bewaker (NaN en Infinity)

De ingang wordt begrensd op ±16 en NaN wordt 0. Per blok worden de klok, de filters, de DC-blokkering en de houdwaarden op eindigheid gecontroleerd; bij een ontsporing worden ze teruggezet. De uitgang wordt begrensd op ±64 (anders 0). Gemeten: 160 willekeurige en extreme instellingen en een burst van NaN, ±Infinity, ±1e9 en 1e30 geven geen enkele niet-eindige sample, en het geluid is direct daarna weer gelijk aan een run zonder burst. De worklet-naam bevat de versie (`nl-patchkamer-bitcrusher-1-0-0`): verander je de code, verhoog dan de versie in die naam.

## Tekenen

Het scherm tekent via `host.frame` (30 beelden per seconde, alleen als de kaart te zien is). Het model gebruikt dezelfde kwantiseerders als de worklet maar zonder dither, ruis en jitter.

## Controleren

- `node contract/validate-instrument.mjs devices/effects/Bitcrusher/bitcrusher.patchkamer-device.js --lang nl` en `--lang en`, vanuit de root: beide `OK`, geen `let op`.
- Je kunt niet horen hoe een preset klinkt. Heb je geen browser, schrijf dan in je oplevering dat de preset **niet beluisterd** is.
- De teksten staan in het bestand zelf (`TXT` en `MODP`). Een nieuwe tekst krijgt altijd nl én en. Labels van maximaal 10 tekens, anders kapt de kaart ze af.

## Wat je niet doet

- Verander nooit de `id`, de `kind`, de poort-id's of de namen van state-velden.
- Pas het apparaat niet aan om een preset te laten kloppen.
- Zet geen merknamen van bestaande apparatuur in naam of omschrijving, en verzin geen persoon bij `author`.
- Commit of push niet, tenzij de opdracht dat vraagt.

## Documentatie en songs

Songs zijn CC-BY-4.0, tunes en presets CC0-1.0, het apparaat AGPL-3.0-or-later.

- Handleiding van Bitcrusher: [NL](../../../docs/effects/USER-MANUAL_NL.md#bitcrusher) · [EN](../../../docs/effects/USER-MANUAL_EN.md#bitcrusher).
- Overzicht van de soort: [README](../README.md); handleiding van de hele soort: [NL](../../../docs/effects/USER-MANUAL_NL.md) · [EN](../../../docs/effects/USER-MANUAL_EN.md).
- Presets (instellingen, `kind: set`): [bitcrusher.patchkamer-presets.json](../../../presets/bitcrusher.patchkamer-presets.json). Kies een preset als beginpunt voor de `state` van dit apparaat in de song; velden die de preset niet noemt krijgen hun standaard.
- Overzicht van alle apparaten en hun signaalketens: [devices/AGENTS.md](../../../devices/AGENTS.md). Een song componeren: [songs/AGENTS.md](../../../songs/AGENTS.md).
- Route voor agents: [soort Effects](../AGENTS.md) → [devices/AGENTS.md](../../AGENTS.md) → [root AGENTS.md](../../../AGENTS.md). Contract: [NL](../../../contract/PATCHKAMER-CONTRACT_NL.md) · [EN](../../../contract/PATCHKAMER-CONTRACT_EN.md). Hoe presets van dit apparaat zijn opgebouwd: [presets/AGENTS.md](../../../presets/AGENTS.md). <!-- agents-tree -->
- Rol in een song: insert-effect op een instrument, stem of bus, of op een send voor parallelle vervuiling (`mix` onder 100%). Audio in `in`, uit `out`; tien parameters zijn stuurbaar via `mod`.
