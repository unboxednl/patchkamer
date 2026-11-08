# AGENTS.md: Master Chain

Dit bestand is voor AI-agents die **presets voor Master Chain** maken of het apparaat configureren. Het is niet geschreven voor mensen. Het hoort bij `../../../AGENTS.md` (algemeen) en `../../../presets/AGENTS.md` (regels voor presetpacks, als die er is); lees die eerst. Hier staat wat alleen voor Master Chain geldt.

## Wat Master Chain is

Een masterketen: toonregeling (laag, midden, hoog) → buscompressie → lookahead-limiter met 4× true-peakbegrenzing. Meet LUFS-I, -M en -S, LRA en true peak; het doelniveau (LUFS-I) en het plafond zijn instelbaar. Het apparaat hoort bij de mastering-apparaten (`devices/mastering/`): ze delen één motor (eigen stereo-DSP in een AudioWorklet, met een terugval in de pagina) en praten met de **Master Director**.

| | |
|---|---|
| Bestand | `master-chain.patchkamer-device.js` (in deze map) |
| `id` | `nl.patchkamer.masterchain`. Verander die nooit: daaraan hangen presets en songs van gebruikers |
| Naam | `Master Chain` in alle talen; de kaart, de besturingen, de opties, de startprofielen, de meldingen en de poortnamen zijn tweetalig (`host.lang`, `LOC` en `TXT` bovenin) |
| Soort | `effect`: dit apparaat krijgt dus **presets** (geen tunes) |
| Poorten | audio-ingang `in` (Stereo in); audio-uitgang `out` (Stereo uit); mastering-ingang `setup` (Master Director: driehoekpoort voor de gele, gestippelde mastering-kabel van de Master Director) |
| Contract | v1.12 |
| Licentie apparaat | AGPL-3.0-or-later |

Dit apparaat is de nieuwe, bijgewerkte vorm van een ouder bestand met een andere naam en id (Eindbeeld, `nl.patchkamer.mastering.master`). Presets of songs uit die tijd verwijzen naar de oude id en laden hier niet in. De DSP is sample voor sample gelijk aan het oude bestand (bewezen met een offline render); alleen de meldingen uit de DSP zijn codes geworden die de kaart vertaalt, en de waarden van de keuze "Doelkarakter" heten nu Engels (`transparent`, `firm`).

## De state

`getState()` geeft de waarden hieronder plus de werkstand (`bypass`, `match`, `auto`, `amount`, `remote`, `locks`). Een **preset** (`getPreset()`) bevat alleen de klank: dezelfde velden **zonder** `bypass`, `match`, `auto`, `remote` en `locks`, want dat is werkstand en geen klank; `setPreset` laat die staan. Een getal buiten het bereik wordt afgekapt; een tekst, `NaN`, `Infinity` of een ontbrekende waarde geeft de startwaarde; een ongeldige keuze geeft de startwaarde. Onbekende velden worden genegeerd.

| Veld | Naam (nl / en) | Bereik | Start |
|---|---|---|---|
| `profile` | Doelkarakter / Target character | `transparent` / `warm` / `firm` / `club` | `transparent` |
| `target` | Doel LUFS-I / Target LUFS-I | -24 … -7 LUFS | -14 |
| `gain` | Gain voor limiter / Gain before limiter | -12 … 18 dB | 0 |
| `ceiling` | Maximaal TP / Maximum TP | -6 … -0.1 dBTP | -1 |
| `eq` | Toonregeling / Tone control | `true` of `false` | `true` |
| `low` | Laag / Low | -4 … 4 dB | 0 |
| `mid` | Midden / Mid | -4 … 4 dB | 0 |
| `high` | Hoog / High | -4 … 4 dB | 0 |
| `compress` | Buscompressie / Bus compression | `true` of `false` | `true` |
| `threshold` | Threshold / Threshold | -60 … 0 dB | -18 |
| `ratio` | Ratio / Ratio | 1 … 12 | 2 |
| `attack` | Attack / Attack | 0.001 … 0.1 s | 0.02 |
| `release` | Release / Release | 0.03 … 1.5 s | 0.2 |
| `knee` | Knee / Knee | 0 … 18 dB | 6 |
| `makeup` | Make-up / Make-up | -12 … 18 dB | 0 |
| `compMix` | Compressormix / Compressor mix | 0 … 1 | 1 |
| `limit` | Limiter / Limiter | `true` of `false` | `true` |
| `amount` | Auto-/voorstelsterkte / Auto / suggestion strength | 0 … 1 | 0,7 |

Startprofielen in de kaart (keuzelijst "Startprofiel"): `Transparent`, `Warm`, `Firm`, `Club`. Ze zetten een paar waarden; ze zijn geen apart veld in de state.

## Wat het apparaat met een state doet (getest)

- `setState({})` geeft alle startwaarden; `setState(getState())` geeft dezelfde state terug.
- Getallen buiten het bereik worden afgekapt, ongeldige waarden krijgen de standaard.
- Extreme instellingen (alles op het minimum of maximum) en een burst van `NaN`, `±Infinity` en 1e9 op de ingang geven geen niet-eindige samples en het geluid komt daarna terug.
- De Master Director zet via `configureMastering` echte instellingen; een vergrendelde besturing (`locks`) wordt overgeslagen.

## Wat `profile`, `target` en `ceiling` doen (getest, versie 1.13.0)

- `ceiling` (Maximaal TP): de limiter houdt de uitgangspiek op `ceiling`, gemeten met dezelfde 4×-true-peakmeting die de kaart toont (TP 4×). Tot 1.12 lag de piek 0,9 dB lager dan ingesteld. Een onafhankelijke meting met 16× oversampling kan bij scherpe transiënten tot ongeveer 0,4 dB hoger uitkomen dan de 4×-meting van de kaart; dat is eigen aan een 4×-meter.
- `profile` werkt altijd op de buscompressor (ook handmatig, zonder Volg), alleen als `compress` aan staat en `ratio` boven 1 ligt. `transparent` is exact het oude gedrag (bit-gelijk). `warm`: attack ×1,8, release ×1,6, knee +4 dB, ratio-boven-1 ×0,75 (zachter en langzamer, ongeveer 0,5 dB minder gain reduction en 0,8 dB luider dan transparent bij de beginstand). `firm`: ×0,6, ×0,7, knee -3 dB, ×1,3. `club`: ×0,45, ×0,55, knee -4 dB, ×1,5 (ongeveer 0,7 tot 1,1 dB meer gain reduction en zachter dan transparent). Dit komt bovenop de waarden van de regelaars `attack`, `release`, `knee` en `ratio`, die in de state ongewijzigd blijven. De Volg-voorstellen houden hun eigen `ratio` (club 2,2, anders 1,5) en `high` (warm -0,6); het profiel schaalt het resultaat nog eens.
- `target` (Doel LUFS-I) verandert zonder Volg het geluid niet. Het staat in de meter (regel DOEL met de afwijking in LU van het gemeten LUFS-I, anders -S of -M) en bepaalt de `gain` van het voorstel van Analyseer 8 s, en van Volg. Het handboek en de hint in de kaart zeggen dat nu.

## Presets maken

- Een pack heet `<naam>.patchkamer-presets.json` en staat in `../../../presets/` (licentie `CC0-1.0`); `device` is `nl.patchkamer.masterchain`, elke preset is `kind: "set"`. Gebruik formaat 2 (`formatVersion: 2`, zie een bestaand pack in `../../../presets/`).
- Gebruik precies de sleutels hierboven, met waarden binnen het bereik. Zet **geen** `bypass`, `match`, `auto`, `remote` of `locks` in een preset.
- Geef elke preset een Engelse naam, zonder merk- of modelnamen. Mappen: `Situations` (club, festival, big room, thuis, koptelefoon, studio, radio, auto, streaming), `Styles` (muziekstijlen) en één map per situatie met veelvoorkomende combinaties.
- Het pack heeft eigen waarden en is **niet** één-op-één de Director-recepten: `profile`, `target`, `ceiling`, `low`, `mid`, `high` en `ratio` komen uit de recepten van de Master Director (stijl × situatie); `gain`, `threshold`, `attack`, `release`, `knee`, `makeup` en `compMix` zijn per stijl en situatie met een eigen generator gezet (`mpresets/p3/master_chain.py`, buiten de repo) en daarna per preset met de motor gekalibreerd: de drempel voor een vaste gemiddelde gain reduction per stijl (de motor zelf gemeten, dus inclusief het profiel), de make-up zodat een loop van -16 dB RMS 0 tot +3 dB luider uitkomt (stevige stijlen tot +4) en de piek niet boven `ceiling` komt. Pas je het geluid van het apparaat aan (limiter, compressor, profiel), kalibreer `threshold` en `makeup` dan opnieuw. Wijzig je `profile`, `target`, `ceiling`, toon of `ratio` van een preset, houd dan Director en pack gelijk.

## Controleren

- `node contract/validate-instrument.mjs devices/mastering/MasterChain/master-chain.patchkamer-device.js --lang nl` en `--lang en`, vanuit de root. Beide moeten `OK` geven, zonder `let op`.
- Je kunt niet horen hoe een preset klinkt. Schrijf in je oplevering dat het **niet beluisterd** is.
- Alle tekst in het apparaat staat in `TXT` en `LOC` bovenin het bestand (Nederlands en Engels). Een nieuwe tekst krijgt altijd nl én en.

## Documentatie en songs

Dit zijn de plaatsen waar je terechtkunt voor documentatie en voor het componeren van songs met dit apparaat. Songs zijn CC-BY-4.0, tunes en presets CC0-1.0, het apparaat AGPL-3.0-or-later.

- Handleiding van Master Chain: [NL](../../../docs/mastering/USER-MANUAL_NL.md#master-chain) · [EN](../../../docs/mastering/USER-MANUAL_EN.md#master-chain).
- Overzicht van de soort: [README](../README.md); handleiding van de hele soort: [NL](../../../docs/mastering/USER-MANUAL_NL.md) · [EN](../../../docs/mastering/USER-MANUAL_EN.md).
- Presets (instellingen, `kind: set`): [master-chain.patchkamer-presets.json](../../../presets/master-chain.patchkamer-presets.json). Kies een preset als beginpunt voor de `state` van dit apparaat in de song; velden die de preset niet noemt krijgen hun standaard.
- Overzicht van alle apparaten en hun signaalketens: [devices/AGENTS.md](../../../devices/AGENTS.md). Een song componeren: [songs/AGENTS.md](../../../songs/AGENTS.md).
- Route voor agents: [soort Mastering](../AGENTS.md) → [devices/AGENTS.md](../../AGENTS.md) → [root AGENTS.md](../../../AGENTS.md). Contract: [NL](../../../contract/PATCHKAMER-CONTRACT_NL.md) · [EN](../../../contract/PATCHKAMER-CONTRACT_EN.md). Hoe presets van dit apparaat zijn opgebouwd: [presets/AGENTS.md](../../../presets/AGENTS.md). <!-- agents-tree -->
- Rol in een song: complete masterketen in één apparaat (toon, bus-compressie, limiter, loudness-meting). Audio in `in`, uit `out`; `setup` ontvangt de mastering-kabel van de Master Director. Zet hem tussen de Mixer-uitgang en de laatste uitgang.
