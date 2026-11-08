# AGENTS.md: Pad Sampler

Dit bestand is voor AI-agents die **tunes voor Pad Sampler** maken, een song met dit apparaat componeren of het apparaat uitbreiden. Het is niet geschreven voor mensen. Het hoort bij `../../../AGENTS.md` (algemeen) en `../../../tunes/AGENTS.md` (regels voor tunepacks); lees die eerst.

## Wat Pad Sampler is

Een sampler met vier banken van elk zestien pads. Een pad heeft vier lagen (samples), een envelope, een filter, een mutegroep, polyfonie en een uitgang (stereomix of een van 16 losse uitgangen). Een pad is `drum` (één noot) of `key` (keygroup: zones met toetsbereik en grondtoon, chromatisch). Stap 1 van het ontwerp was de kern, stap 2 (sinds 1.1.0) is de golfvormeditor met sample-bewerkingen (tab Bewerken, zie hieronder); stap 3 (sinds 1.2.0) is chop, Process en Flatten/Resample (zie "Chop, Process en Flatten"); stap 4 (sinds 1.3.0) is de tab Banken met catalogus en importers (zie "Banken en catalogus"); sinds 1.4.0 werken `sends` (reverb en delay), `loop.xfade` en de Autosampler (zie "Sends, lus-crossfade en Autosampler").

| | |
|---|---|
| Bestand | `pad-sampler.patchkamer-device.js` (in deze map), icoon `icon.svg` |
| `id` | `nl.patchkamer.padsampler`. Verander die nooit |
| Soort | `instrument` (`category: 'synth'`; de bibliotheek zet hem bij Samplers): **tunes**, geen presets |
| Poorten | audio uit `mix` (Stereomix) en `out1` t/m `out16`; event in `notes`; sturing in `mod`; geen audio-ingang |
| Versie | 1.4.0 |
| Contract | v1.30 (gebouwd voor v1.26; gebruikt het optionele `host.fetchFile` van v1.30) |
| Pack | `../../../tunes/pad-sampler-demos.patchkamer-tunes.json` (15 tunes, CC0-1.0) |

## Geluid en routing

- Pad naar `output: 0` gaat naar de mix (mastervolume `level` en een zachte begrenzer erachter); `output: n` (1 t/m 16) gaat alleen naar poort `outn`, zonder mastervolume of begrenzer.
- Een slag maakt per laag een `AudioBufferSourceNode`: bron, laagniveau (velocity x `level` x `gain`), optioneel pan, optioneel filter, amp-envelope, dan per slag een release- en een afkapknoop (5 ms bij mutegroep of stelen), padbus (niveau, pan), uitgang.
- Events (`note`, `trig`, `noteoff`, `allnotesoff`, `cc` met `id` `level`) worden gepland op `ev.time` (audioklok). Een noot met `dur` eindigt na `dur` (release volgt, tenzij `oneShot`), `held: true` blijft tot `noteoff`, een noot zonder `dur` krijgt 0,25 s. Een `trig` zonder `dur` ook 0,25 s.
- **Noot naar pad:** drum-pad `i` van bank `b` luistert naar noot `baseNote + 16*b + i`. Alleen een drum-pad met een sample claimt zijn noot; een noot die niemand claimt speelt de keygroup-pads (zones: `keyLo..keyHi` en velocity; zonder zones spelen de lagen chromatisch rond hun `root`, standaard 60). `trig` lane: `pad3` of `3` (gekozen bank), `a1` t/m `d16`.
- Lagen kiezen: `velocity` = elke laag met een sample waarvan `velLo..velHi` de aanslag bevat; `all` = elke laag met een sample (bereiken genegeerd); `cycle` en `random` kiezen er één uit de kandidaten (random herhaalt nooit direct dezelfde).
- `oneShot: true` negeert noteoff en schakelt de lus uit. `layers[].offset` in ms: negatief vertraagt de laag, positief begint zo ver in het sample.
- Limieten: 64 laagstemmen tegelijk (oudste weg), polyfonie 1 tot 16 per pad (oudste weg), 120 s per sample, 64 MiB PCM16 in de samplestore.
- `params()`: `level` en per pad `a01.level`, `a01.cutoff`, `a01.tune` (a t/m d, 01 t/m 16); allemaal standaard uit. De regelaars van het paneel (`pad.*`, `env.*`, `filt.*`, `layer.*`, `zone.*`, `baseNote`, `padVel`) staan bewust niet in `params()` (`modExclude`): ze werken op het gekozen pad.

## De state (`getState()`)

| Veld | Wat | Bereik | Start |
|---|---|---|---|
| `v` | formaat | 1 | 1 |
| `bank`, `pad`, `layer` | gekozen bank, pad en laag (bediening) | 0..3, 0..15, 0..3 | 0 |
| `baseNote` | noot van bank A pad 1 | geheel 0..63 | 36 |
| `level` | mastervolume (alleen mix) | 0..1 | 0,8 |
| `padVel` | velocity bij klikken op een pad | geheel 1..127 | 100 |
| `banks` | lijst van vier banken `{ name, pads }`; `pads` heeft 16 items; een leeg standaardpad is `null` | zie onder | demo-kit in bank A |
| `aux` | alleen als niet standaard: `{ rev: { level 0..1 (0,7), size 0..1 (0,4), damp 0..1 (0,5), out 0..16 }, dly: { level (0,7), time 0,01..1,5 s (0,3), sync `off`/`1/2`/`1/4d`/`1/4`/`1/8d`/`1/8`/`1/8t`/`1/16`, fb 0..0,95 (0,4), tone 0..1 (0,6), out 0..16 } }`; `setState` negeert wat ontbreekt | zie links | niet aanwezig |
| `samples` | object `id -> sample` (alleen geladen samples; de demo-samples staan hier niet in) | zie onder | `{}` |

**Ontbreekt `banks` (of is het geen lijst), dan geldt het standaardprogramma met de demo-kit in bank A.** Is `banks` een lijst, dan zijn ontbrekende banken en pads leeg. `setState({})` geeft dus de demo-kit; een tune die alleen bank A vult, laat de rest leeg.

**Pad** (sleutelvolgorde zoals `getState()`):

| Veld | Wat | Bereik | Start |
|---|---|---|---|
| `name` | naam | ≤ 40 tekens | leeg |
| `mode` | `drum` of `key` | | `drum` |
| `play` | `velocity`, `cycle`, `random`, `all` | | `velocity` |
| `polyphony` | stemmen per pad (1 = mono) | geheel 1..16 | 4 |
| `muteGroup` | 0 = geen | geheel 0..32 | 0 |
| `output` | 0 = mix, 1..16 = `outN` | geheel 0..16 | 0 |
| `level` | dB | −60..12 | 0 |
| `pan` | | −1..1 | 0 |
| `tune`, `fine` | halve tonen, cent | −24..24, −100..100 | 0 |
| `env` | `{ shape: 'adsr'/'ad', attack 0,0005..5, decay 0,005..10, sustain 0..1, release 0,005..10 }` (s) | | adsr, 0,001, 0,2, 1, 0,05 |
| `filter` | `{ type: 'off'/'lp'/'hp'/'bp', cutoff 20..20000 Hz, res 0..1, envAmt −1..1, velAmt −1..1 }` | | off, 8000, 0,2, 0, 0 |
| `oneShot` | negeer noteoff | boolean | `true` bij `drum`, anders `false` |
| `reverse` | omgekeerd | boolean | `false` |
| `sends` | send 1 (reverb) en send 2 (delay), lineair | twee getallen 0..1 | `[0,0]` |
| `baseNote` | noot als je een keygroup-pad aanklikt | geheel 0..127 | 60 |
| `layers` | altijd vier items; een lege laag is `null` | | |
| `zones` | 0 tot 128 zones (alleen bij `key`; sinds 1.4.0, daarvoor 16) | | `[]` |

**Laag:** `sampleId` (`demo:...`, een id uit `samples` of leeg), `semi` (−48..48), `fine` (−100..100 ct), `level` (0..1), `pan`, `offset` (−500..500 ms), `root` (`null` of 0..127), `velLo`, `velHi` (1..127), `start`, `end` (deel van het sample, `start` 0..0,9999, `end` ≥ `start`+0,0001), `loop` `{ on, start, end, xfade }` (fracties; `xfade` 0..1 = deel van de halve lus, werkt sinds 1.4.0 bij het afspelen), `gain` (−24..24 dB).
**Zone:** `sampleId`, `root`, `keyLo`, `keyHi`, `velLo`, `velHi`, `tune` (halve tonen, −24..24), `loop`.
**Sample** in `samples`: `{ name, rate (3000..192000), channels (1 of 2), root, loop, slices, [sliceEnds], license{source,license,author,attribution}, data }`; `slices` zijn beginposities in samples (oplopend, hoogstens 128), het eind van slice n is standaard het begin van n+1 (gekoppeld); `sliceEnds` bestaat alleen als een slice een eigen eind heeft (zelfde lengte als `slices`, 0 = standaard, anders een positie > begin en <= lengte); `data` is PCM16 little-endian als base64 (lengte deelbaar door 4); het id is een hash van de inhoud. Samples die geen enkele laag of zone gebruikt, verdwijnen bij `setState`.

## De editor (sinds 1.1.0)

De tab **Bewerken** werkt op de gekozen laag of zone. De state krijgt **geen nieuwe velden**: een bewerking maakt een nieuw sample in `samples` (nieuw id, zelfde record) en laat de laag of zone daarheen wijzen. Een oude state laadt dus gewoon en `setState(getState())` blijft byte-gelijk.

- **Bewerkingen** (Float32-kopie, resultaat PCM16, op de selectie of, zonder selectie, op het hele sample): afsnijden, verwijderen, knippen, kopiëren, plakken (vervangt een selectie, anders op de cursor), invoegen (altijd op de cursor), stilte invoegen, selectie dempen, normaliseren (piek 0 dBFS), gain (dB, afkappen op ±1 met melding), fade in en uit (`lin`: t, `log`: log10(1+9t), `exp`: (10^t-1)/9), omkeren, DC-offset weg, mono maken (gemiddelde; het hele sample), toonhoogte (halve tonen, hersamplen met een gevensterde sinc; het stuk wordt korter of langer), bit-reductie (2 tot 15 bits: 2^bits-1 niveaus), sample-rate-reductie (vasthouden, lengte blijft), selectie als start en einde (alleen laag), selectie als lus (zet `loop.on`), loop-crossfade inbakken (de `xfade`-regelaar van de lus blijft zonder effect; de crossfade wordt in het sample gerekend, gelijk vermogen, op het stuk vlak voor het lusbegin).
- **Posities volgen mee.** Verandert de lengte, dan worden `start`, `end`, `loop.start` en `loop.end` van de laag (of zone), en `loop` en `slices` van het sample, mee verplaatst; blijft er niets over van zo'n bereik, dan wordt het 0 tot 1.
- **Klembord** staat in het apparaat (niet in de state), werkt over pads heen en wordt omgerekend naar sample rate en kanalen van het doel.
- **Ongedaan en Opnieuw** staan alleen in het geheugen: hoogstens 500 stappen en 128 MiB aan samples (de oudste vervalt); `setState` leegt ze. Het geheugen daarvoor valt buiten de 64 MiB van de state: die geldt voor wat na de bewerking in `samples` zou staan. Past dat niet, dan gebeurt de bewerking niet en komt er een melding. Een resultaat langer dan 120 s wordt geweigerd. Een bewerking zonder verschil maakt geen stap.
- **Toetsen** (focus in de tab Bewerken): X knippen, C kopiëren, V plakken, I invoegen, Delete verwijderen, Ctrl+A alles, spatie speelt de selectie (of vanaf de cursor; Shift+spatie lust), + en − zoomen, 0 alles, pijltjes en PageUp/PageDown de cursor (Shift maakt een selectie), Home en End, Escape, Ctrl+Z ongedaan, Ctrl+Shift+Z of Ctrl+Y opnieuw. In die tab spelen de letters niet de pads.
- Beluisteren loopt via de stereomix van het apparaat (mastervolume en begrenzer). Niet beluisterd: alleen gemeten met numerieke controles op het resultaat.
- Een editor-bewerking loopt in de hoofdthread (sinc-hersamplen van 120 s duurt merkbaar).

## Chop, Process en Flatten (sinds 1.2.0)

De tab **Bewerken** heeft vier soorten bewerking (knoppen onder de golfvorm, alleen UI-toestand): Bewerken, Chop, Process, Flatten. Nieuw in de state is alleen het optionele `sliceEnds` per sample (zie boven); oude states laden ongewijzigd en `setState(getState())` blijft byte-gelijk.

- **Slices** zijn markeringen in het sample, geen kopieën. Maken: gelijke delen (2..64), op drempel (omhullende per ms; drempel in dB onder de piek, opnieuw scherp na terugval onder de helft, minimale tijd; flams tellen als één), op BPM en maten (stap = 60/BPM x tellen), of handmatig (marker op cursor, slepen, verwijderen). Een demo-sample wordt bij de eerste chop een eigen sample (de laag wijst er daarna naar).
- **Slices naar pads** (`slToPads`): slice n naar pad (startpad + n); het pad wordt een nieuw standaardpad (uitgang blijft) met laag 1 = hetzelfde sample, `start`/`end` van de slice, `root` uit het sample; optioneel `end` + staart. Geen kopieën van het sample.
- **Process** werkt met directe DSP op de selectie (of het hele sample) en slaat het resultaat als nieuw sample op: filter (RBJ-biquad, 12 of 24 dB/okt, optionele sweep van cutoff over de selectie), drive (tanh met mix), bitcrusher, EQ (laagshelf 200 Hz, piek 1 kHz Q 1, hoogshelf 5 kHz), compressor (gekoppeld, attack/release op de omhullende) en tempo-afstemming (hersamplen, ratio = doel-BPM / huidig BPM, 0,25..4; echte time-stretch is fase 2). Beluisteren rekent hetzelfde uit zonder iets te wijzigen.
- **Flatten** rendert met `OfflineAudioContext` (stereo, samplefrequentie van de studio): per laag dezelfde keten als een slag (laagniveau, pan, filter, envelope, tune, omkeren, lus, release na de notenlengte), daarna padniveau en -panorama; zonder uitgangskeuze, mastervolume en begrenzer. Gemeten gelijk aan de realtime slag op `out1` (verschil 1,5e-5, de 16-bit afronding). Opties: noot (bepaalt ook de zone en de root van het resultaat), velocity, staart, notenlengte (0 = langste laag, een lus telt als 2 s), mono, normaliseren, stilte afsnijden (onder -80 dB). Bestemming: nieuwe laag (eerste lege), de gekozen laag vervangen, dit pad vervangen (tune, envelope, filter, niveau en pan terug naar standaard; uitgang, mutegroep, polyfonie en soort blijven) of een ander pad. Reverb en delay worden niet ingebakken (er zijn geen insert-effecten).
- **Ongedaan** voor deze bewerkingen is een stap met `prog: true` in dezelfde geschiedenis: de JSON van de geraakte pads, de slices van de samples en de bijbehorende records. Ongedaan zet ook de gekozen bank, pad en laag terug zoals ze waren. Past het resultaat niet in 64 MiB, dan gebeurt er niets en komt er een melding.
- **Toetsen** in Chop: 1 t/m 9 beluistert slice 1..9, pijl links en rechts vorige en volgende slice, M of Enter marker op cursor, Delete haalt de gekozen marker weg.
- Niet beluisterd; wel gemeten (zie Controleren). Flatten en Process zijn niet getest met Bluetooth-uitvoer of in andere browsers dan Chromium.

## Banken en catalogus (sinds 1.3.0)

De tab **Banken** (zesde tab) laadt banken in een doelbank (A t/m D, optioneel eerst leegmaken). Alles loopt via een **plan** (pads met lagen of zones, zonder audio) en een **rapport** (`importReport()` op de instance: `ok`, `ignored`, `warn`, `stats`, `loaded`, `missing`, `notFit`, `aborted`); `runPlan` laadt de bestanden en schrijft de pads als één programmastap die ongedaan te maken is. De state krijgt **geen nieuwe verplichte velden**.

- **Catalogus** = de constante `CATALOG` in het apparaat (contract §2: één bestand, geen externe bestanden; `bankCatalog()` geeft een kopie). Per bank: `id`, `name`/`desc` (nl, en), `status` (`green` of `yellow`; **nooit rood**), `license` (`spdx`, `text`, `url`, `checked`), `author`, `attribution`, `credit` (vermelding verplicht), `src` (`name`, `home`, `pin` = commit, `base` = jsDelivr-adres op die commit), `format`, `bytes`, `n`, en `pads` (drumpads met lagen `f`, `lo`, `hi`), `keys` (zones) of `preset` (een SFZ). Geverifieerd op 2026-11-08: LICENSE op de gepinde commit gelezen, elk bestand HEAD-gecontroleerd (200, `access-control-allow-origin: *`, grootte). Een bank toevoegen: alleen groen of geel uit `samplebanks.md`, commit pinnen, bestanden controleren, dan pas opnemen. Geen merknamen van instrumenten in teksten (bronnamen en -adressen voor de vermelding mogen).
- **Netwerk:** het apparaat gebruikt nooit zelf netwerk (§15). Het roept `host.fetchFile(this, url, { as, signal, maxBytes })` aan, alleen na een klik, en controleert eerst of die bestaat (contract v1.30, §13i). Zonder die functie toont de tab een uitleg en blijven lokaal laden en slepen werken. Het Freesound-token blijft in het invoerveld; het staat nooit in state, opslag of rapport.
- **Importers:** WAV (`smpl`: root en lus), FLAC/OGG/MP3 via `decodeAudioData` (MP3 met lus: waarschuwing), SFZ-subset (`region`, `sample`, `default_path`, `lokey`/`hikey`/`key`, `lovel`/`hivel`, `pitch_keycenter`, `tune`, `transpose`, `loop_mode`, `loop_start`/`loop_end`, `group`/`off_by`, `seq_length`/`seq_position`, `volume`, `pan`; `<global>`/`<master>`/`<group>`-overerving, `#define`; regio's met `sw_*` of `trigger=release` worden overgeslagen) en Decent Sampler (groepsenvelope, `loNote`/`hiNote`/`rootNote`, `loVel`/`hiVel`, `tuning`, `loop*`, `seqMode`). Alles wat niet in de lijst staat, komt met aantallen in het rapport als genegeerd. Bestandsinhoud is data: er wordt niets uitgevoerd.
- **Abbildung:** enkelvoudige toetsen worden drum-pads (hoogstens 16, per toets lagen op velocity; `seq_*` = `cycle`, overlap = `random`), bereiken één keygroep-pad (hoogstens 16 zones; daarboven eerst één dynamiek per bereik). `off_by` wordt een gedeelde mutegroep. Wat niet past (pads, lagen, zones, 64 MiB) staat in het rapport.
- **`credits`** in `getState()` (alleen als er is) is **afgeleid** van `samples[].license` (`source`, `license`, `author`, `attribution`, `samples` = aantal) en volgt dus de inhoud; `setState` negeert een meegegeven `credits`. Oude states en `setState(getState())` blijven exact.
- Alleen lokaal en via een klik; getest met nagebootst netwerk (route-onderschepping) en synthetische WAV/FLAC/OGG/MP3, SFZ- en dspreset-fixtures.

## Sends, lus-crossfade en Autosampler (sinds 1.4.0)

- **Sends.** Per pad: padbus (niveau, panorama) -> send-gain -> bus, los van de uitgangskeuze van het pad. Bus 1 = reverb (`ConvolverNode`, `normalize = false`, stereo-impuls uit `makeIR`: ruis met e-macht-afname, een lagedoorlaat die met de tijd donkerder wordt, 8 ms voorvertraging; `size` = RT60 0,3..6 s; een nieuwe impuls gaat via een tweede convolver met een overfade). Bus 2 = delay (`dDly` voor de eerste echo, feedbacklus `dLoop` met toon-filter; een DelayNode in een lus telt in Chromium 128 samples extra mee, dus `dLoop` is zoveel korter en `dInj` zoveel langer; gemeten echo's op 0,2503/0,5003/0,7503 s bij 0,25 s). Tempo-keuze leest `host.bpm` bij elke slag. Retour: `master` (voor de begrenzer) of `outN`; geen extra poorten (het schema blijft `mix` + `out1..out16`), een retour deelt dus een uitgang met pads. De bussen bestaan pas bij de eerste send > 0 (lui). Niet in `params()`. Flatten, Autosampler en Process bakken de sends niet in.
- **Lus-crossfade.** `loopXfadeLen(xf, ls, le) = min(round(xf * (le-ls)/2), ls, floor((le-ls)/2))`; de bewerking Loop-crossfade inbakken gebruikt dezelfde `loopXfadeApply`. Bij het afspelen (en in `offlineVoice`) komt een voorgebakken buffer tot het lus-eind (+2 samples) uit `loopBuf` (cache per sample, omgekeerd, lus en lengte; hoogstens 256 MiB; leeg bij `gcStore`/`setState`); `warm()` bakt ze alvast. Zonder materiaal voor het lusbegin (`ls` = 0) of bij one-shot geen effect.
- **Autosampler.** `autosample(o, preview)`: bronpad als keygroep (`autoSource`), per noot (stap, root midden of onder) en velocity-laag (gelijk verdeeld) `renderPadSrcs(..., ampV = 1)`: de aanslag stuurt laagkeuze en filter, de amplitude blijft 1 (de zone krijgt hem bij het spelen). Doelpad: keygroep, `oneShot: true`, polyfonie 8, uitgang en mutegroep van het oude doelpad blijven, `baseNote` = root van de middelste zone; sample-dedupe via `recId`; `trimTail` met 5 ms marge; één `progRun`-stap. Grenzen: 128 zones (`ZONE_CAP`), 64 MiB (schatting vooraf), 120 s. Importers gebruiken nog `MAXZONE` = 16.
- Getest (scratchpad ps5): aux (reverb-staart, grootte, demping, retourniveau, uitgangen, delay-timing en -sync, state), xfade (gelijk aan numpy-referentie binnen 6e-8, sprong bij de lus-overgang 0,32 -> 0,012), Autosampler (zone = bronpad binnen 1,2e-5 na 3 ms aanzet, dedupe, grenzen, stop, undo/redo).

## Ingebouwde demo-samples (geen audio in de state)

`demo:kick`, `demo:kick-soft`, `demo:kick-hard`, `demo:snare`, `demo:clap`, `demo:hat-closed`, `demo:hat-open`, `demo:tom-lo`, `demo:tom-mid`, `demo:tom-hi`, `demo:rim`, `demo:cowbell`, `demo:shaker`, `demo:crash`, `demo:perc`, `demo:sub` (drums, 44100 Hz, mono) en de tonen `demo:saw`, `demo:sine`, `demo:square` (lussen over een geheel aantal perioden, root 60, sample rate 33488 Hz; zet `loop: { on: true, start: 0, end: 1 }`, `oneShot: false`) en `demo:pluck` (een aanslag, root 60). Een tune met alleen demo-samples bevat dus geen audio.

## Een tune maken

- Pack `pad-sampler-demos.patchkamer-tunes.json` in `../../../tunes/`, `device` is `nl.patchkamer.padsampler`, elke tune `kind: "set"`, `state` = wat `getState()` teruggeeft (maak hem door het apparaat een gewenste (deel)state te laten normaliseren en `getState()` te nemen, niet met de hand).
- Een tune die zijn eigen samples meebrengt, zet ze in `samples` (klein houden: mono, lage sample rate; alles in `tunes/` is CC0-1.0, dus alleen eigen of vrije klanken, geen merk- of modelnamen).
- Laat een keygroup op pad 1 van bank A staan (`bank: 0`, `pad: 0`) en zet `oneShot: false`, `polyphony: 16`; een drumkit hoort op bank A vanaf pad 1 (noot 36).
- Piek van een slag rond 0,5; losse uitgangen hebben geen begrenzer.

## Controleren

- `node contract/validate-instrument.mjs devices/samplers/PadSampler/pad-sampler.patchkamer-device.js` in gewoon, `--lang nl` en `--lang en`: `OK`, zonder `let op`.
- Niet beluisterd: alleen gemeten (offline renders: energie per uitgang, velocity-lagen, cycle, mutegroep, frequentie van een keygroup, filter, envelope, polyfonie; voor de editor het resultaat van elke bewerking, ongedaan/opnieuw, selecteren met muis en aanraking).

## Wat je niet doet

- Verander nooit `id`, `kind`, poort-id's of state-sleutels; verhoog `version`.
- Zet geen merknamen van bestaande apparatuur in naam, teksten of tunes.
- Pas het apparaat niet aan om een tune te laten kloppen.

## Documentatie

[Handleiding NL](../../../docs/samplers/USER-MANUAL_NL.md#pad-sampler) · [EN](../../../docs/samplers/USER-MANUAL_EN.md#pad-sampler) · [README van de soort](../README_NL.md) · [soort Samplers](../AGENTS.md) · [devices/AGENTS.md](../../AGENTS.md) · [root](../../../AGENTS.md) · [tunes/AGENTS.md](../../../tunes/AGENTS.md)

## Documentatie en songs

Hier vind je de omgeving van dit apparaat: de soort, de overzichten en de handleiding voor mensen.

- Route voor agents: [soort Samplers](../AGENTS.md) → [devices/AGENTS.md](../../AGENTS.md) → [root AGENTS.md](../../../AGENTS.md). Contract: [NL](../../../contract/PATCHKAMER-CONTRACT_NL.md) · [EN](../../../contract/PATCHKAMER-CONTRACT_EN.md). Hoe tunes van dit apparaat zijn opgebouwd: [tunes/AGENTS.md](../../../tunes/AGENTS.md). <!-- agents-tree -->
- Handleiding van de soort (voor mensen): [NL](../../../docs/samplers/USER-MANUAL_NL.md) · [EN](../../../docs/samplers/USER-MANUAL_EN.md); overzicht: [README](../README.md).
- Een song componeren met dit apparaat: [songs/AGENTS.md](../../../songs/AGENTS.md).
