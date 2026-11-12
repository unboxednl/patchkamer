# AGENTS.md: Acoustic Drums

Dit bestand is voor AI-agents die **tunes voor Acoustic Drums** maken, het apparaat wijzigen of er een song mee componeren. Het is niet geschreven voor mensen. Het hoort bij `../../../AGENTS.md` (algemeen) en `../../../tunes/AGENTS.md` (regels voor tunes); lees die eerst.

## Wat Acoustic Drums is

Een gesampled akoestisch drumstel voor funk, soul en jazz. De opnames zitten **niet** in de repo en niet in Patchkamer: het apparaat haalt ze na een klik op "Kit laden" via `host.fetchFile` (contract §13i) op uit Virtuosity Drums. `getState()` bevat alleen instellingen, nooit audio. Een tune, preset of song laadt dus geen kit: zonder kit speelt het apparaat stil en toont de kaart dat.

| | |
|---|---|
| Bestand | `acoustic-drums.patchkamer-device.js` (in deze map) |
| `id` | `nl.patchkamer.acousticdrums`. Verander die nooit |
| Soort | `instrument`: dit apparaat krijgt **tunes** (geen presets) |
| Poorten | audio uit `mix`, `kick`, `snare`, `hats`, `toms`, `cymbals`, `room`; event in `trigger`; sturing in `mod`; bundel uit `multi` (de vijf groepen) |
| Contract | v1.35 (apparaatversie 1.0.0; gebruikt het optionele `host.fetchFile` van v1.30) |
| Licentie apparaat | AGPL-3.0-or-later |

## Bron, licentie en vermelding

- Opnames: Virtuosity Drums, Versilian Studios, drummer Austin McMahon. Licentie **CC0-1.0** (het `LICENSE`-bestand van de bron is op de vastgepinde commit gelezen). Repo `https://github.com/sfzinstruments/virtuosity_drums`, commit `9f04cf9a734527edfbb0a4eee1f674e45bbf71bc`.
- Vermelding (niet verplicht, wel netjes): "Virtuosity Drums, Versilian Studios, drums performed by Austin McMahon, CC0 1.0". Die staat zichtbaar op de kaart vóór de klik. De bibliotheeknaam en de drummer staan alleen in de bronvermelding, nergens in namen, ids of tunes.
- Er wordt niets gekopieerd naar de repo. Het apparaat bewaart het opgehaalde nooit in state, tune of song (§13i: een song klinkt dan alleen met een geladen kit).
- **jsDelivr weigert een deel van de bestanden** van deze grote repo (403 "Package size exceeded the configured limit of 50 MB"; gemeten: 42 van de 584 bestanden van de middenmicrofoon). Het apparaat probeert eerst het jsDelivr-adres (`BASE`) en valt bij fout `http` of `network` terug op hetzelfde bestand van dezelfde commit bij `raw.githubusercontent.com` (`RAW`). Beide staan open voor CORS. De Pad Sampler-catalogus gebruikt alleen jsDelivr; controleer daar of zijn gekozen bestanden niet tot die 42 horen.

## De sets en de download

Per artikulatie staat in `ARTS` (bovenin het bestand): map, bestandsnaamdeel, aantal round robins, de bovengrenzen van de velocity-lagen uit de SFZ-programma's van de bron, de gemiddelde bestandsgrootte per microfoon en `maxBytes` per bestand (1,3 x het grootste bestand, afgerond op 64 kB). De lagen van een set worden gelijkmatig uit het maximum gekozen. De grootte vóór de klik is een schatting uit de gemiddelde bestandsgrootte; gemeten klopt hij op ongeveer 5% (hieronder).

| Set (`set`) | Inhoud | Bestanden (mid) | Download (mid, geschat / gemeten) |
|---|---|---|---|
| `funk` Funk and soul | snare center, rimshot, crossstick, muted, halfopen, flam; hi-hat closed, pedal, half, 3/4, open, splash; ride, bell; crash; floor- en racktom; kick snon | 75 | 31 MB / 31,2 MB |
| `funklite` Funk and soul, compact | dezelfde stukken met minder lagen en round robins | 41 | 15 MB / 15,3 MB |
| `jazz` Jazz | ook snaren uit (O_*), flat ride, sizzle-crash, buzz, offcenter, kick snoff, tom muted, meer round robins | 98 | 45 MB / 45,2 MB |

Meer microfoons (`mics`: `kickmic`, `snaremic`, `oh`, `mid`, `room`, `lofi`) tellen er hun eigen download bij op (drie microfoons mid+oh+room van `funk`: 225 bestanden, 90 MB, in het geheugen ongeveer 283 MB). Gedecodeerd kost een set ongeveer drie keer de download (funk mid: 94 MB). Elke slag gebruikt dezelfde laag en round robin op alle geladen microfoons (fasegelijk).

Niet in de sets: de doorlopende snare-roll (WAV, 3 tot 4 MB per laag), de percussie en de "epic"-programma's.

## De state

`getState()` is gewone JSON. `getPreset()` (en dus een tune) laat `patterns`, `pattern`, `length`, `run` en `swing` weg: een tune is een **voicing** en wist nooit een patroon of start de eigen sequencer.

| Veld | Wat | Bereik | Standaard |
|---|---|---|---|
| `set` | Welke set "Kit laden" haalt | `funk`, `funklite`, `jazz` | `funk` |
| `mics` | Welke microfoons "Kit laden" haalt | niet-lege lijst van `kickmic`, `snaremic`, `oh`, `mid`, `room`, `lofi` | `["mid"]` |
| `master` | Hoofdniveau | 0 … 1 | 0,8 |
| `levels.kick/snare/hats/toms/cymbals` | Niveau per groep | 0 … 1,5 | 1 |
| `micMix.<mic>.level` / `.pan` | Niveau en pan per microfoon | 0 … 1,5 en −1 … 1 | kickmic .8, snaremic .8, oh 1, mid 1, room .8, lofi .5; pan 0 |
| `snares` | Snaren aan (false = snaren uit als de set die heeft, anders valt hij terug) | boolean | `true` |
| `kickTune`, `snareTune`, `floorTune`, `rackTune` | Stemming via playbackRate | −6 … 6 halve tonen | 0 |
| `kickRing`, `snareRing`, `tomRing` | Uitklinking (1 = natuurlijk, 0 = gedempt) | 0 … 1 | 1 |
| `bleed` | Kick met snaren (snon) tegen zonder (snoff), alleen als de set beide heeft | 0 … 1 | 1 |
| `ghost` | Onder deze velocity klinkt noot 38 als ghost note (muted of halfopen); 0 = uit | 0 … 0,6 | 0,28 |
| `rim` | Vanaf deze velocity klinkt noot 38 als rimshot; 1 = uit | 0,5 … 1 | 0,93 |
| `hatFade` | Duur van de fade waarmee een gesloten hat een open hat afkapt | 0,04 … 0,2 s | 0,09 |
| `human` | Willekeurige vertraging per slag | 0 … 0,01 s | 0,002 |
| `variation` | Schaal van de willekeurige stemming (±0,6 … 3 cent) en niveau (±0,1 … 0,5 dB) | 0 … 1 | 1 |
| `swing` | Swing van de eigen sequencer | 0 … 0,5 | 0 |
| `run`, `pattern`, `length`, `patterns` | Eigen sequencer: aan, patroon A–D, lengte 1–32, 4 × 12 rijen × 32 stappen met velocity 0 … 1 | | uit, A, 16, een funkgroove in A |

Alle regelaars zijn ook stuurbaar (`params()`, 32 stuks, id = het pad in de state). Ongeldige waarden vallen op de standaard terug, getallen worden afgekapt, onbekende velden genegeerd; `setState` start nooit een download.

## Noten en lanes

General MIDI: 36 kick, 38 snare (automatisch: ghost onder `ghost`, rimshot vanaf `rim`), 37 side stick, 40 rimshot, 39 snare naast het midden, 86 ghost, 87 half gedempt, 85 stick shot, 93 buzz, 95 flam, 42 hi-hat gesloten (met CC 4 op de `trigger`-poort: ≥0,75 gesloten, ≥0,5 half, ≥0,25 driekwart, daaronder open), 44 pedaal, 46 open, 90 half, 94 driekwart, 92 splash, 49 crash, 57 sizzle, 51 ride, 53 bell, 59 flat ride, 55 flat ride als crash, 52 bekken afgrijpen (of dezelfde bekkennoot op velocity < 0,03), 41 43 45 47 48 50 toms (floor- en racktom met een andere stemming), 97 tot 102 extra tomslagen. `noteNames()` geeft de volledige lijst, zodat Clip Arranger en de andere sequencers de rijen benoemen. `trig` accepteert `chN` (de 12 stappenrijen), de Drum Kit-namen (`kick`, `snare`, `rim`, `closedhat`, `openhat`, `lowtom`, `midtom`, `hitom`, `crash`, `ride`) en de nieuwe (`ghost`, `rimshot`, `pedalhat`, `splash`).

Klembord (§13d): `clipInfo`, `getClip` en `setClip` zoals Drum Kit (`kind: 'drums'`, 12 banen `chN`, tikken van 12 per zestiende, `scheme: gm`), zonder kans en ratchet. Getest: `setClip(getClip())` laat de clip gelijk; ongeldige invoer wordt geweigerd, 100000 slagen met `NaN` geeft geen fout.

## Wat het geluid doet

- Velocity-lagen: elke laag heeft een middelpunt; tussen twee lagen een gelijk-vermogen-overgang waarvan het niveau een rechte lijn (in dB) volgt. Bij het laden wordt het niveau van de eerste 150 ms per laag gemeten: round robins van één laag worden gelijkgezet (hoogstens 2 dB) en een laag die zachter is dan die eronder wordt opgetrokken (hoogstens 3,5 dB).
- Round robin zonder directe herhaling; ±3 cent en ±0,5 dB willekeur (schaalbaar met `variation`, nooit nul); een slag heeft nooit exact dezelfde stemming als de vorige van hetzelfde stuk.
- Starttijd wordt naar boven afgerond op een grens van 128 samples (`quantumStart`).
- Afkappen en demping gebruiken `cancelAndHoldAtTime` (terugval: de analytische waarde van de demping) en een korte exponentiële fade; bronnen stoppen pas als de fade is uitgestorven.
- Alle uitgangen lopen door een zachte begrenzer (lineair tot 0,7, nooit boven 0,908), en een bewaker op de mix stopt alle stemmen als er een niet-eindig sample opduikt. Er is geen filter of terugkoppeling in het apparaat, dus een NaN kan niet blijven hangen.

## Gemeten (Playwright, headless Chromium, OfflineAudioContext, echte opnames via de link-route, 48 kHz)

- Download: 31,2 / 15,3 / 45,2 MB (funk, funklite, jazz; mid) tegen schattingen van 31 / 15 / 45 MB; `maxBytes` per bestand 0,25 tot 2,4 MB; de som van de gemelde bytes klopt met de som van de bestanden; annuleren (32 verzoeken gestart, vorige kit blijft), uitval van alle verzoeken en een host zonder `fetchFile` geven de goede tekst in nl en en. `fetchFile` wordt niet aangeroepen door `create`, `mount`, `setState`, `setPreset`, `onStep`, `onEvent`, `onTransport` en `unmount` (0 aanroepen; ook de validator meldt niets).
- Aanzet op 135 BPM (6 slagen, vaste willekeur, elke slag apart gerenderd): afwijking t.o.v. de eerste slag 2e-5 … 2,6e-4 en spreiding van max |diff| in de eerste 20 ms 1,001 voor snare, kick, hi-hat, crash en tom. Zonder `quantumStart`: afwijking 4e-3 … 5,7e-2 en spreiding tot 1,94 (hi-hat 1,68, crash 1,94).
- Velocity-lagen (RMS eerste 150 ms, 21 stappen, variatie 0): bereik 30 tot 40 dB; kleine dalingen van gemiddeld 0,1 tot 1,5 dB tussen aangrenzende stappen komen nog voor (de echte opnames zijn zelf niet monotoon); kick en toms in de test 0 tot 3 dalingen, grootste 1,4 dB.
- Afkappen: open hat afgekapt door gesloten of pedaal: max |diff| rond het afkapmoment 0,023 tegen 0,029 voor de natuurlijke golf ervoor, sprong naar de eerdere waarde 0,0019, rest na 350 ms exact 0; bekken afgrijpen (noot 52 of lage velocity): 0,050 tegen 0,087, rest na 250 ms 0.
- Round robin en variatie: opeenvolgende slagen verschillen altijd (genormaliseerde max-afwijking minimaal 0,099 bij de snare, 0,66 kick, > 1,1 hat/ride/crash).
- Stilte zonder trigger en zonder kit: max 0,0. Piek na alle noten tegelijk op velocity 1: 0,908; extreme instellingen (alle regelaars op maximum, 3 microfoons met pan −1/+1, 50 willekeurige slagen): eindig, piek 0,908.
- NaN/Infinity: een salvo van `NaN`, ±`Infinity`, 1e30, tekst, `null` en `{}` als noot, velocity, tijd, lane en CC, en modulatie met 1e9, −Infinity en NaN: geen fout, daarna klinkt alles weer en is de uitvoer eindig. Extreme `setState`: afgekapt of op de standaard.
- Automatiek: noot 38 op een zachte velocity is sample-voor-sample gelijk aan noot 86 op de omgerekende velocity, en op een harde aan noot 40; snaren uit, kick-bleed, pedaal op CC 4, tomstemming en `snareRing` veranderen het geluid (snaren uit: max verschil 0,56; ring 0 geeft een staart van 0 tegen 3,7e-4).
- Echte host: laden via `#devFile`-bibliotheek, kaartbreedte 980, poortrij bovenaan (ook bij vaste kaarthoogte), geen paginafouten in nl en en, kit geladen via de link-route met de jsDelivr-403's afgevangen door de terugval.
- Validator: `OK` zonder `let op`, gewoon, `--lang en` en `--lang nl`.

**Niet beluisterd.** Niet getest: een echte uitgang met echte latency, ASIO, het netwerk van een gebruiker (de test serveert de bestanden van schijf, met jsDelivr-403's nagebootst), geheugen op een zwakke machine (funk met drie microfoons is ongeveer 283 MB gedecodeerd), Safari en Firefox (FLAC via `decodeAudioData`).

## Tunes maken

- Pack: `../../../tunes/acoustic-drums-styles.patchkamer-tunes.json` (licentie `CC0-1.0`, `device` `nl.patchkamer.acousticdrums`, `kind: set`, 40 voicings in de mappen Funk, Soul, Jazz en Studio). Een tune zegt voor welke set en microfoons hij is gemaakt; die laad je eerst zelf.
- Gebruik alleen de sleutels uit de tabel hierboven en nooit `patterns`, `run`, `pattern`, `length` of `swing`. Engelse namen, geen merk- of modelnamen van instrumenten en geen artiesten.

## Wat je niet doet

- Verander nooit de `id`, de poort-id's of de state-sleutels. Kopieer geen opnames naar de repo en haal nooit iets op buiten een klik.
- Zet geen andere bron in de sets zonder de licentie op een vastgepinde versie te lezen.
- Commit of push niet, tenzij de opdracht dat vraagt.

## Documentatie en songs

- Handleiding van Acoustic Drums: [NL](../../../docs/drums/USER-MANUAL_NL.md#acoustic-drums) · [EN](../../../docs/drums/USER-MANUAL_EN.md#acoustic-drums).
- Overzicht van de soort: [README](../README.md); handleiding van de hele soort: [NL](../../../docs/drums/USER-MANUAL_NL.md) · [EN](../../../docs/drums/USER-MANUAL_EN.md).
- Tunes (voicings, `kind: set`): [acoustic-drums-styles.patchkamer-tunes.json](../../../tunes/acoustic-drums-styles.patchkamer-tunes.json). Hoe tunes zijn opgebouwd: [tunes/AGENTS.md](../../../tunes/AGENTS.md).
- Overzicht van alle apparaten en hun signaalketens: [devices/AGENTS.md](../../../devices/AGENTS.md). Een song componeren: [songs/AGENTS.md](../../../songs/AGENTS.md).
- Route voor agents: [soort Drums](../AGENTS.md) → [devices/AGENTS.md](../../AGENTS.md) → [root AGENTS.md](../../../AGENTS.md). Contract: [NL](../../../contract/PATCHKAMER-CONTRACT_NL.md) · [EN](../../../contract/PATCHKAMER-CONTRACT_EN.md). Hoe tunes van dit apparaat zijn opgebouwd: [tunes/AGENTS.md](../../../tunes/AGENTS.md). <!-- agents-tree -->
- Rol in een song: drums. Een sequencer (Clip Arranger, Step Sequencer, Pattern Tracker) stuurt noten naar `trigger`; de som komt uit `mix`, de groepen los uit `kick` … `cymbals` en `room`. Een song die dit apparaat gebruikt, klinkt pas na een klik op "Kit laden".
