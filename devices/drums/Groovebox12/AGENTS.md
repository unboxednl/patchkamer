# AGENTS.md: Groovebox 12

Dit bestand is voor AI-agents die **tunes voor Groovebox 12** maken of het apparaat configureren. Het is niet geschreven voor mensen. Het hoort bij `../../../AGENTS.md` (algemeen) en `../../../tunes/AGENTS.md` (regels voor tunes); lees die eerst. Hier staat wat alleen voor Groovebox 12 geldt.

## Wat Groovebox 12 is

Een groovebox met 12 tracks. Elke track heeft een klankmachine (7 drums en 4 synths), een eigen lengte (1 tot 16 stappen, dus polymetrie), 16 stappen met parameter locks (p-locks), trig-condities, retrigs en micro-timing, en eigen pagina's voor klank (`syn`), filter (`flt`), versterker (`amp`), LFO (`lfo`) en sends (`fx`). Er zijn 8 patronen en een ketting die bepaalt in welke volgorde ze spelen. Daarachter staan een FX-blok (overdrive en filter), een delay, een galm en een compressor. Het apparaat speelt mee met de klok van de host (Start/Stop, tempo); de klok is van de host.

| | |
|---|---|
| Bestand | `groovebox-12.patchkamer-device.js` (in deze map) |
| `id` | `nl.patchkamer.groovebox12`. Verander die nooit: daaraan hangen tunes en songs van gebruikers |
| Naam | `Groovebox 12` in alle talen; alleen de poortnamen hebben een Nederlandse variant (via `i18n`); alle tekst in de kaart staat in `TXT` (nl en en) |
| Soort | `instrument`: dit apparaat krijgt dus **tunes** (geen presets) |
| Poorten | audio-uitgang `out` (Uit / Out, de som), modulatie-ingang `mod`, bundel-uitgang `multi` (Losse uit / Separate outs: de twaalf tracks apart, na niveau en pan, vóór de sends en het FX-blok) |
| Contract | v1.11 |
| Licentie apparaat | AGPL-3.0-or-later |

Dit apparaat is de nieuwe, bijgewerkte vorm van een ouder bestand met een andere naam en id (Takt Twaalf, `nl.patchkamer.takt12`). Tunes of songs uit die tijd verwijzen naar de oude id en laden hier niet in. De bron van het oude bestand (een HTML-pagina met een bouwscript) is niet beschikbaar; dit bestand wordt rechtstreeks bewerkt.

## De state

`state` van een tune is wat `getState()` teruggeeft (Groovebox 12 heeft geen `getPreset`). De hele state is groot (ongeveer 150 KB: 8 patronen × 12 tracks × 16 stappen), maar **een tune hoeft alleen te bevatten wat afwijkt**: `setState` vult alles wat ontbreekt aan met de standaardwaarde. Laat dus patronen weg die je niet gebruikt, en laat tracks, stappen en parameters weg die standaard blijven. Een ontbrekende track krijgt de standaardtrack (de machine en naam uit de tabel hieronder); een ontbrekende stap is uit.

```
{ "v": 1,
  "G": { ... algemene instellingen ... },
  "pats": [ { "tracks": [ { "machine": "bd", "name": "Kick", "len": 16, "mute": false,
                            "steps": [ { "on": 1, "vel": 1, "note": 48, "cond": 0, "retrig": 1, "micro": 0, "lock": {} }, ... ],
                            "syn": { }, "flt": { }, "amp": { }, "lfo": { }, "fx": { } }, ... ] }, ... ] }
```

Algemeen (`G`):

| Veld | Wat | Bereik | Start |
|---|---|---|---|
| `bpm` | Tempo (volgt de klok van de host; de twee demo-knoppen stellen het tempo van de host voor) | 20 … 300 | 124 |
| `swing` | Swing, in procenten | 50 … 80 | 54 |
| `vol` | Hoofdniveau | 0 … 1 | 0,7 |
| `fxDrive` | Overdrive van het FX-blok | 0 … 1 | 0,25 |
| `fxCut`, `fxRes` | Filter van het FX-blok | 200 … 16000 Hz, 0,3 … 12 | 9000, 1 |
| `dlyTime` | Delaytijd in kwartnoten (0,75 = 3/16, 0,5 = 1/8, 1 = 1/4, 1,5 = 3/8, 2 = 1/2) | 0,25 … 2 | 1 |
| `dlyFb` | Feedback van de delay | 0 … 0,9 | 0,45 |
| `revSize` | Galmlengte | 0,3 … 8 s | 3 |
| `chain` | Ketting van patronen: cijfers 1 tot 8, met spaties erbij, hoogstens 48 tekens (bijvoorbeeld `1 1 2 3`) | tekst | `1` |

Per patroon (`pats[n]`, n = 0 … 7, patroon 1 tot 8) 12 tracks (`tracks[0]` … `tracks[11]`). Een track:

| Veld | Wat | Waarden | Start |
|---|---|---|---|
| `machine` | Klankmachine | een sleutel uit de tabel hieronder | per track: `bd`, `sd`, `rs`, `cp`, `hh`, `hh`, `cy`, `cb`, `tone`, `chord`, `dual`, `raw` |
| `name` | Naam van de track | tekst, hoogstens 40 tekens, Engels | `Kick`, `Snare`, `Rim`, `Clap`, `HH closed`, `HH open`, `Ride`, `Cowbell`, `Tone`, `Chord`, `Bass`, `Raw` |
| `len` | Lengte van de track | geheel getal 1 … 16 | 16 |
| `mute` | Gedempt | boolean | `false` |
| `steps` | 16 stappen | lijst van stappen (hieronder) | alles uit |
| `syn`, `flt`, `amp`, `lfo`, `fx` | Parameters per pagina (tabellen hieronder) | object met sleutels uit de tabel | de startwaarden uit de tabel |

Een naam met het woord `closed` of een `dec` onder 0,15 maakt van een `hh`-track een gesloten hi-hat die een open hi-hat afkapt.

Een stap:

| Veld | Wat | Waarden | Start |
|---|---|---|---|
| `on` | Stap aan | `1` of `0` | 0 |
| `vel` | Velocity; boven 0,9 telt als accent | 0 … 1 | 0,8 |
| `note` | MIDI-noot (alleen bij synthmachines) | geheel getal 0 … 127 (de kaart biedt 24 … 96) | 48 |
| `cond` | Trig-conditie, een index in de lijst `—`, `1:2`, `2:2`, `1:4`, `2:4`, `3:4`, `4:4`, `1:8`, `5:8`, `25%`, `50%`, `75%`, `FILL`, `!FILL`, `1st`, `!1st` | geheel getal 0 … 15 | 0 (`—`, altijd) |
| `retrig` | Aantal slagen binnen de stap | geheel getal 1 … 8 (de kaart biedt 1, 2, 3, 4, 6, 8) | 1 |
| `micro` | Micro-timing, als deel van een stap | −0,25 … 0,25 (de kaart biedt −¼, −⅛, 0, ⅛, ¼) | 0 |
| `lock` | P-locks: waarden die alleen voor deze stap gelden | `{ "flt": { "cut": 900 } }`: pagina's `syn`, `flt`, `amp`, `lfo`, `fx` met sleutels uit de tabellen | `{}` |

### Machines

| Sleutel | Naam | Soort |
|---|---|---|
| `bd` | BD Hard | drum |
| `sd` | SD Classic | drum |
| `rs` | RS Hard | drum |
| `cp` | CP Classic | drum |
| `hh` | HH Metallic | drum |
| `cy` | CY Ride | drum |
| `cb` | CB Classic | drum |
| `tone` | SY Tone | synth (speelt noten) |
| `chord` | SY Chord | synth (speelt noten) |
| `dual` | SY Dual VCO | synth (speelt noten) |
| `raw` | SY Raw | synth (speelt noten) |

**`bd` (BD Hard)**

| Sleutel | Naam | Bereik | Start |
|---|---|---|---|
| `tun` | Tune | 30 … 120 | 52 |
| `dec` | Decay | 0.05 … 2 | 0.5 |
| `swt` | Sweep t | 0.005 … 0.3 | 0.04 |
| `swd` | Sweep d | 1 … 8 | 3.5 |
| `clk` | Click | 0 … 1 | 0.4 |
| `noi` | Noise | 0 … 1 | 0.1 |
| `hrm` | Harm | 0 … 1 | 0.2 |
| `hld` | Hold | 0 … 0.3 | 0 |

**`sd` (SD Classic)**

| Sleutel | Naam | Bereik | Start |
|---|---|---|---|
| `tun` | Tune | 100 … 500 | 190 |
| `dec` | Decay | 0.05 … 1.5 | 0.25 |
| `snp` | Snap | 0 … 1 | 0.6 |
| `ndc` | Noise dec | 0.05 … 1 | 0.2 |
| `ton` | Tone | 500 … 6000 | 1800 |
| `det` | Detune | 0 … 1 | 0.3 |
| `bdy` | Body | 0 … 1 | 0.5 |
| `hld` | Hold | 0 … 0.3 | 0 |

**`rs` (RS Hard)**

| Sleutel | Naam | Bereik | Start |
|---|---|---|---|
| `tun` | Tune | 400 … 3000 | 1700 |
| `dec` | Decay | 0.01 … 0.3 | 0.05 |
| `clk` | Click | 0 … 1 | 0.6 |
| `ton` | Tone | 0 … 1 | 0.5 |
| `rng` | Ring | 0 … 1 | 0.3 |
| `bdy` | Body | 0 … 1 | 0.4 |
| `spr` | Spread | 0 … 1 | 0.2 |
| `hld` | Hold | 0 … 0.2 | 0 |

**`cp` (CP Classic)**

| Sleutel | Naam | Bereik | Start |
|---|---|---|---|
| `ton` | Tone | 500 … 4000 | 1400 |
| `dec` | Decay | 0.05 … 1.5 | 0.3 |
| `den` | Density | 1 … 6 | 4 |
| `spr` | Spread | 0.005 … 0.03 | 0.011 |
| `rom` | Room | 0 … 1 | 0.3 |
| `bri` | Bright | 0 … 1 | 0.5 |
| `wid` | Width | 0.3 … 3 | 1.2 |
| `hld` | Hold | 0 … 0.3 | 0 |

**`hh` (HH Metallic)**

| Sleutel | Naam | Bereik | Start |
|---|---|---|---|
| `tun` | Tune | 2000 … 12000 | 6500 |
| `dec` | Decay | 0.02 … 2 | 0.08 |
| `ton` | Tone | 0 … 1 | 0.5 |
| `met` | Metal | 0 … 1 | 0.5 |
| `noi` | Noise | 0 … 1 | 0.5 |
| `spr` | Spread | 0 … 1 | 0.3 |
| `shp` | Shape | 0 … 1 | 0.4 |
| `hld` | Hold | 0 … 0.3 | 0 |

**`cy` (CY Ride)**

| Sleutel | Naam | Bereik | Start |
|---|---|---|---|
| `tun` | Tune | 1500 … 9000 | 4000 |
| `dec` | Decay | 0.2 … 4 | 1.6 |
| `ton` | Tone | 0 … 1 | 0.5 |
| `met` | Metal | 0 … 1 | 0.6 |
| `bel` | Bell | 0 … 1 | 0.3 |
| `spr` | Spread | 0 … 1 | 0.5 |
| `shp` | Shape | 0 … 1 | 0.5 |
| `hld` | Hold | 0 … 0.5 | 0 |

**`cb` (CB Classic)**

| Sleutel | Naam | Bereik | Start |
|---|---|---|---|
| `tun` | Tune | 300 … 1200 | 560 |
| `dec` | Decay | 0.05 … 1 | 0.25 |
| `rat` | Ratio | 1.1 … 2 | 1.48 |
| `ton` | Tone | 0 … 1 | 0.5 |
| `drv` | Drive | 0 … 1 | 0.3 |
| `shp` | Shape | 0 … 1 | 0.5 |
| `atk` | Attack | 0.001 … 0.1 | 0.002 |
| `hld` | Hold | 0 … 0.3 | 0 |

**`tone` (SY Tone)**

| Sleutel | Naam | Bereik | Start |
|---|---|---|---|
| `tun` | Tune | -24 … 24 | 0 |
| `wav` | Wave | 0 … 3 | 0 |
| `dec` | Decay | 0.05 … 4 | 0.4 |
| `atk` | Attack | 0.001 … 1 | 0.005 |
| `sub` | Sub | 0 … 1 | 0.3 |
| `pw` | Shape | 0 … 1 | 0.5 |
| `vib` | Vibrato | 0 … 1 | 0 |
| `gld` | Glide | 0 … 0.5 | 0 |

**`chord` (SY Chord)**

| Sleutel | Naam | Bereik | Start |
|---|---|---|---|
| `tun` | Tune | -24 … 24 | 0 |
| `typ` | Chord | 0 … 7 | 0 |
| `dec` | Decay | 0.05 … 6 | 1.2 |
| `atk` | Attack | 0.001 … 2 | 0.02 |
| `spr` | Spread | 0 … 1 | 0.3 |
| `wav` | Wave | 0 … 3 | 0 |
| `vib` | Vibrato | 0 … 1 | 0.1 |
| `inv` | Inversion | 0 … 3 | 0 |

**`dual` (SY Dual VCO)**

| Sleutel | Naam | Bereik | Start |
|---|---|---|---|
| `tun` | Tune | -24 … 24 | -12 |
| `int` | Osc2 | -24 … 24 | 7 |
| `mix` | Mix | 0 … 1 | 0.5 |
| `wv1` | Wave 1 | 0 … 3 | 0 |
| `wv2` | Wave 2 | 0 … 3 | 1 |
| `dec` | Decay | 0.05 … 4 | 0.3 |
| `atk` | Attack | 0.001 … 1 | 0.002 |
| `det` | Detune | 0 … 1 | 0.2 |

**`raw` (SY Raw)**

| Sleutel | Naam | Bereik | Start |
|---|---|---|---|
| `tun` | Tune | -24 … 24 | 0 |
| `dec` | Decay | 0.05 … 4 | 0.6 |
| `noi` | Noise | 0 … 1 | 0.3 |
| `fld` | Fold | 0 … 1 | 0.5 |
| `ton` | Tone | 0 … 1 | 0.5 |
| `fm` | FM | 0 … 1 | 0.2 |
| `pw` | Shape | 0 … 1 | 0.3 |
| `hld` | Hold | 0 … 0.5 | 0 |

### Parameters van de andere pagina's


**`flt`: filter**

| Sleutel | Naam | Bereik | Start |
|---|---|---|---|
| `typ` | Type | 0 … 2 | 0 |
| `cut` | Cutoff | 60 … 18000 | 18000 |
| `res` | Reso | 0.3 … 20 | 0.7 |
| `env` | Env depth | -1 … 1 | 0 |
| `edc` | Env decay | 0.02 … 2 | 0.2 |
| `eat` | Env attack | 0.001 … 1 | 0.001 |
| `trk` | Key track | 0 … 1 | 0 |
| `hpf` | HP base | 20 … 2000 | 20 |

**`amp`: versterker en niveau**

| Sleutel | Naam | Bereik | Start |
|---|---|---|---|
| `atk` | Attack | 0.001 … 2 | 0.001 |
| `hld` | Hold | 0 … 2 | 0 |
| `dec` | Decay | 0.02 … 6 | 1 |
| `od` | Overdrive | 0 … 1 | 0 |
| `vol` | Level | 0 … 1 | 0.8 |
| `pan` | Pan | -1 … 1 | 0 |
| `acc` | Accent | 0 … 1 | 0.5 |
| `vel` | Vel→vol | 0 … 1 | 1 |

**`lfo`**

| Sleutel | Naam | Bereik | Start |
|---|---|---|---|
| `spd` | Speed | 0.05 … 20 | 2 |
| `dep` | Depth | 0 … 1 | 0 |
| `dst` | Dest | 0 … 3 | 0 |
| `wav` | Wave | 0 … 3 | 0 |
| `fad` | Fade | 0 … 2 | 0 |
| `mod` | Mode | 0 … 1 | 0 |
| `ph` | Phase | 0 … 1 | 0 |
| `mul` | Sync | 0 … 1 | 0 |

**`fx`: sends en FX-blok**

| Sleutel | Naam | Bereik | Start |
|---|---|---|---|
| `dly` | Delay send | 0 … 1 | 0 |
| `rev` | Reverb send | 0 … 1 | 0.15 |
| `blk` | FX-blok | 0 … 1 | 0 |
| `dlw` | Delay HP | 40 … 4000 | 200 |
| `rvt` | Reverb tone | 200 … 12000 | 5000 |
| `cho` | Chorus | 0 … 1 | 0 |
| `wid` | Width | 0 … 1 | 0.5 |

Wat Groovebox 12 met een state doet (getest):
- Getallen buiten het bereik worden afgekapt; een tekst, `null`, `NaN`, `±Infinity` of een ontbrekende waarde geeft de startwaarde. Een onbekende machine geeft de standaardmachine van die track, een onbekende `cond` of `retrig` wordt afgekapt binnen de lijst.
- Er zijn altijd 8 patronen en 12 tracks met 16 stappen; wat ontbreekt wordt aangevuld.
- Onbekende velden, ook in `lock`, worden genegeerd. Zet er geen in.
- `setState` zonder `pats` laat de patronen staan en past alleen `G` toe.

Modulatie: `modulate` (poort `mod`) neemt alleen eindige getallen tussen −1 en 1 aan; al het andere wordt genegeerd. Per track zijn acht parameters stuurbaar (spoor-id `t<n>.syn.tun`, `.syn.dec`, `.flt.cut`, `.flt.res`, `.amp.vol`, `.amp.pan`, `.fx.dly`, `.fx.rev`). Modulatie verandert nooit de bewaarde waarden.

## Swing (1.11.1)

Groovebox 12 had al één eigen schuif **Swing** (`G.swing`, 50 … 80, start 54; de klok zelf is van de host, het apparaat rekent die swing op het tracklokale stapnummer `stap % 2` en telt hem op bij de hostswing in `info.time`). Dat is ongewijzigd. Erbij kwamen twee velden voor extra swing, in dezelfde eenheid als de hostschuif (een fractie van een zestiende-stap, 0 … 0,5; de UI toont 0 … 50 %, dubbelklik = 0):

| Veld | Wat | Waarden |
|---|---|---|
| `pats[i].swing` | swing van patroon *i* (het patroon dat de klok speelt) | 0 … 0,5, start 0 |
| `pats[i].tracks[j].swing` | swing van track *j* in dat patroon | 0 … 0,5, start 0 |

Optelregel: de extra vertraging van een oneven zestiende = `min(0,5; pat.swing + track.swing) × stapduur`, bovenop `G.swing` en de hostswing. Oneven = het stapnummer van de klok (`info.step`, bij ontbreken de positie sinds de start), dus bij een track met een eigen lengte (polymetrie) telt de klokstap; `G.swing` blijft op de plaats in de track werken. Alle retrigs van die stap schuiven als geheel mee (met de micro-timing erbij). Ongeldige of ontbrekende waarden geven 0 (boven 0,5 wordt het 0,5); een oude song of tune zonder deze velden klinkt gelijk. De velden staan in `getState().pats` en dus in een tune.

## Geen noten- of triggeringang

Groovebox 12 heeft geen eventingang en dus geen `noteNames`: er is geen live inspelen (opname of kwantiseren) en geen noot waarmee een sequencer de tracks kan benoemen. Het apparaat heeft wel een eigen stappenraster (16 stappen per track, 8 patronen), maar de stappen zijn alleen via de UI en de state te vullen.

## Tunes maken

- Een pack heet `naam.patchkamer-tunes.json` en staat in `../../../tunes/` (licentie `CC0-1.0`); `device` is `nl.patchkamer.groovebox12`, elke tune is `kind: "set"`. Lees `../../../tunes/AGENTS.md` voor het formaat.
- Een tune is een **kit met groove**: de machines en klankinstellingen van de tracks plus de patronen. Houd hem klein (zie hierboven). Geef elke tune en elke track een Engelse naam, zonder merk- of modelnamen, ook niet in de vorm "in de stijl van …".
- Gebruik precies de sleutels hierboven, met waarden binnen het bereik. Maak alleen tunes als de opdracht dat vraagt.

## Controleren

- `node contract/validate-instrument.mjs devices/drums/Groovebox12/groovebox-12.patchkamer-device.js --lang nl` en `--lang en`, vanuit de root. Beide moeten `OK` geven, zonder `let op`.
- Je kunt niet horen hoe een tune klinkt. Schrijf in je oplevering dat het **niet beluisterd** is.
- Het geluid is bewezen gelijk aan dat van het oude bestand: elke aanroep naar de audiograaf (knooppunten, tijden, waarden) is identiek in 25 willekeurige songs (ongeveer 820.000 aanroepen), en `getState`, `params()` en de bundel zijn gelijk. Een geluidswijziging moet dus een bewuste keuze zijn.
- De kaart heeft geen Play-knop en geen zichtbaar BPM-veld: de klok en het tempo zijn van de host.

## Wat je niet doet

- Verander nooit de `id`, de `kind`, de poort-id's, de spoor-id's (`t1.syn.tun` enzovoort) of de namen van state-velden.
- Pas het apparaat niet aan om een tune te laten kloppen.
- Zet geen merknamen van bestaande apparatuur in naam, omschrijving of tune, en verzin geen persoon bij `author`.
- Commit of push niet, tenzij de opdracht dat vraagt.

## Documentatie en songs

Dit zijn de plaatsen waar je terechtkunt voor documentatie en voor het componeren van songs met dit apparaat. Songs zijn CC-BY-4.0, tunes en presets CC0-1.0, het apparaat AGPL-3.0-or-later.

- Handleiding van Groovebox 12: [NL](../../../docs/drums/USER-MANUAL_NL.md#groovebox-12) · [EN](../../../docs/drums/USER-MANUAL_EN.md#groovebox-12).
- Overzicht van de soort: [README](../README.md); handleiding van de hele soort: [NL](../../../docs/drums/USER-MANUAL_NL.md) · [EN](../../../docs/drums/USER-MANUAL_EN.md).
- Tunes (klanken, `kind: set`): [groovebox-12-styles.patchkamer-tunes.json](../../../tunes/groovebox-12-styles.patchkamer-tunes.json). Kies een tune als beginpunt voor de `state` van dit apparaat in de song; velden die de tune niet noemt krijgen hun standaard. Hoe tunes zijn opgebouwd: [tunes/AGENTS.md](../../../tunes/AGENTS.md).
- Overzicht van alle apparaten en hun signaalketens: [devices/AGENTS.md](../../../devices/AGENTS.md). Een song componeren: [songs/AGENTS.md](../../../songs/AGENTS.md).
- Rol in een song: drums en synthlijnen in één apparaat (12 tracks, elk met eigen lengte voor polymetrie). Het speelt zelf op de klok; er is geen noteningang, alleen `mod`. Audio komt uit `out` (de som, met het FX-blok) of per track uit de bundel `multi`.
