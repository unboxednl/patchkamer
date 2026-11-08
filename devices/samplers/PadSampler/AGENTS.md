# AGENTS.md: Pad Sampler

Dit bestand is voor AI-agents die **tunes voor Pad Sampler** maken, een song met dit apparaat componeren of het apparaat uitbreiden. Het is niet geschreven voor mensen. Het hoort bij `../../../AGENTS.md` (algemeen) en `../../../tunes/AGENTS.md` (regels voor tunepacks); lees die eerst.

## Wat Pad Sampler is

Een sampler met vier banken van elk zestien pads. Een pad heeft vier lagen (samples), een envelope, een filter, een mutegroep, polyfonie en een uitgang (stereomix of een van 16 losse uitgangen). Een pad is `drum` (één noot) of `key` (keygroup: zones met toetsbereik en grondtoon, chromatisch). Stap 1 van het ontwerp was de kern, stap 2 (sinds 1.1.0) is de golfvormeditor met sample-bewerkingen (tab Bewerken, zie hieronder); chop, Flatten/Resample en de catalogus volgen (de state is daar al op voorbereid: `slices`, `license`, `loop.xfade`, `sends`).

| | |
|---|---|
| Bestand | `pad-sampler.patchkamer-device.js` (in deze map), icoon `icon.svg` |
| `id` | `nl.patchkamer.padsampler`. Verander die nooit |
| Soort | `instrument` (`category: 'synth'`; de bibliotheek zet hem bij Samplers): **tunes**, geen presets |
| Poorten | audio uit `mix` (Stereomix) en `out1` t/m `out16`; event in `notes`; sturing in `mod`; geen audio-ingang |
| Versie | 1.1.0 |
| Contract | v1.27 (gebouwd voor v1.26, gevalideerd tegen v1.27) |
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
| `sends` | gereserveerd voor aux-sends (geen effect in stap 1) | twee getallen 0..1 | `[0,0]` |
| `baseNote` | noot als je een keygroup-pad aanklikt | geheel 0..127 | 60 |
| `layers` | altijd vier items; een lege laag is `null` | | |
| `zones` | 0 tot 16 zones (alleen bij `key`) | | `[]` |

**Laag:** `sampleId` (`demo:...`, een id uit `samples` of leeg), `semi` (−48..48), `fine` (−100..100 ct), `level` (0..1), `pan`, `offset` (−500..500 ms), `root` (`null` of 0..127), `velLo`, `velHi` (1..127), `start`, `end` (deel van het sample, `start` 0..0,9999, `end` ≥ `start`+0,0001), `loop` `{ on, start, end, xfade }` (fracties; `xfade` heeft in stap 1 geen effect), `gain` (−24..24 dB).
**Zone:** `sampleId`, `root`, `keyLo`, `keyHi`, `velLo`, `velHi`, `tune` (halve tonen, −24..24), `loop`.
**Sample** in `samples`: `{ name, rate (3000..192000), channels (1 of 2), root, loop, slices, license{source,license,author,attribution}, data }`; `data` is PCM16 little-endian als base64 (lengte deelbaar door 4); het id is een hash van de inhoud. Samples die geen enkele laag of zone gebruikt, verdwijnen bij `setState`.

## De editor (sinds 1.1.0)

De tab **Bewerken** werkt op de gekozen laag of zone. De state krijgt **geen nieuwe velden**: een bewerking maakt een nieuw sample in `samples` (nieuw id, zelfde record) en laat de laag of zone daarheen wijzen. Een oude state laadt dus gewoon en `setState(getState())` blijft byte-gelijk.

- **Bewerkingen** (Float32-kopie, resultaat PCM16, op de selectie of, zonder selectie, op het hele sample): afsnijden, verwijderen, knippen, kopiëren, plakken (vervangt een selectie, anders op de cursor), invoegen (altijd op de cursor), stilte invoegen, selectie dempen, normaliseren (piek 0 dBFS), gain (dB, afkappen op ±1 met melding), fade in en uit (`lin`: t, `log`: log10(1+9t), `exp`: (10^t-1)/9), omkeren, DC-offset weg, mono maken (gemiddelde; het hele sample), toonhoogte (halve tonen, hersamplen met een gevensterde sinc; het stuk wordt korter of langer), bit-reductie (2 tot 15 bits: 2^bits-1 niveaus), sample-rate-reductie (vasthouden, lengte blijft), selectie als start en einde (alleen laag), selectie als lus (zet `loop.on`), loop-crossfade inbakken (de `xfade`-regelaar van de lus blijft zonder effect; de crossfade wordt in het sample gerekend, gelijk vermogen, op het stuk vlak voor het lusbegin).
- **Posities volgen mee.** Verandert de lengte, dan worden `start`, `end`, `loop.start` en `loop.end` van de laag (of zone), en `loop` en `slices` van het sample, mee verplaatst; blijft er niets over van zo'n bereik, dan wordt het 0 tot 1.
- **Klembord** staat in het apparaat (niet in de state), werkt over pads heen en wordt omgerekend naar sample rate en kanalen van het doel.
- **Ongedaan en Opnieuw** staan alleen in het geheugen: hoogstens 500 stappen en 128 MiB aan samples (de oudste vervalt); `setState` leegt ze. Het geheugen daarvoor valt buiten de 64 MiB van de state: die geldt voor wat na de bewerking in `samples` zou staan. Past dat niet, dan gebeurt de bewerking niet en komt er een melding. Een resultaat langer dan 120 s wordt geweigerd. Een bewerking zonder verschil maakt geen stap.
- **Toetsen** (focus in de tab Bewerken): X knippen, C kopiëren, V plakken, I invoegen, Delete verwijderen, Ctrl+A alles, spatie speelt de selectie (of vanaf de cursor; Shift+spatie lust), + en − zoomen, 0 alles, pijltjes en PageUp/PageDown de cursor (Shift maakt een selectie), Home en End, Escape, Ctrl+Z ongedaan, Ctrl+Shift+Z of Ctrl+Y opnieuw. In die tab spelen de letters niet de pads.
- Beluisteren loopt via de stereomix van het apparaat (mastervolume en begrenzer). Niet beluisterd: alleen gemeten met numerieke controles op het resultaat.
- Een editor-bewerking loopt in de hoofdthread (sinc-hersamplen van 120 s duurt merkbaar).

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
