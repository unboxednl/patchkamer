# AGENTS.md: Samplebank

Dit bestand is voor AI-agents die **tunes voor Samplebank** maken of het apparaat configureren. Het is niet geschreven voor mensen. Het hoort bij `../../../AGENTS.md` (algemeen) en `../../../tunes/AGENTS.md` (regels voor tunepacks); lees die eerst. Hier staat wat alleen voor Samplebank geldt.

## Wat Samplebank is

Een sampler met vier banken van elk zestien pads. Een sample (WAV of MP3, gedecodeerd door de browser) komt op een pad, wordt bewerkt (selectie, omkeren, normaliseren, fades, volume, toonhoogte) en wordt gespeeld door noten of pad-trigs, op de zestien pads vanaf een basisnoot of chromatisch met het geselecteerde sample. Daarachter staan een masterfilter (lowpass), een master-volume, een panorama en een compressor als vangnet. **Alle audio zit in de state**: elk sample staat als 16-bit PCM in base64 in de `bankData` van `getState()`. Daarom bevat een tune de samples zelf en is hij zo groot als zijn samples.

| | |
|---|---|
| Bestand | `samplebank.patchkamer-device.js` (in deze map) |
| `id` | `nl.patchkamer.samplebank`. Verander die nooit: daaraan hangen tunes en songs van gebruikers |
| Naam | `Samplebank` in alle talen |
| Soort | `instrument` (`category: 'synth'`): Samplebank krijgt dus **tunes** (geen presets) |
| Poorten | geen audio-ingang; audio-uitgang `out` (stereo); eventingang `notes` ("Notes / pad triggers", Nederlands "Noten / pad-trigs"); sturing-ingang `mod` |
| Contract | v1.11 (gevalideerd met de validator van v1.12) |
| Licentie apparaat | AGPL-3.0-or-later |

Dit apparaat is de bijgewerkte vorm van een ouder bestand (`Sampler_v1.8.0.js`) met dezelfde id, naam, poorten en state-sleutels. Banken, songs en bankbestanden (`patchkamer-samplebank-1`) van toen laden hier gewoon in.

## De tune

Een pack heet `samplebank-styles.patchkamer-tunes.json` en staat in `../../../tunes/`; licentie `CC0-1.0`, `device` is altijd `nl.patchkamer.samplebank`, elke tune is `kind: "set"` (geen `parts`). De `state` van een tune is wat `getState()` teruggeeft (Samplebank heeft geen `getPreset`).

### De state

| Veld | Wat | Bereik | Start |
|---|---|---|---|
| `bank` | Geselecteerde bank | geheel 0 … 3 | 0 |
| `pad` | Geselecteerde pad; in `keys` het sample dat chromatisch klinkt | geheel 0 … 15 | 0 |
| `baseNote` | MIDI-noot van pad 1; pad *n* hoort bij `baseNote + n − 1` | geheel 0 … 111 | 36 |
| `playMode` | `pads` = noot → pad (`noot − baseNote`), `keys` = elke noot speelt het geselecteerde sample, getransponeerd ten opzichte van zijn `root` | `pads`, `keys` | `pads` |
| `level` | Mastervolume | 0 … 1 | 0,8 |
| `cutoff` | Masterfilter (lowpass, Q 0,7) | 100 … 16000 Hz | 16000 |
| `pan` | Panorama | −1 … 1 | 0 |
| `bankData` | Lijst van **vier** strings, elk een JSON-tekst van één bank: `{"name": "...", "pads": [16 pads]}` | zie hieronder | vier lege banken |

`getState()` geeft altijd alle zeven velden plus `bankData` met vier strings. `setState` accepteert een kortere lijst: ontbrekende banken zijn leeg. Een tune mag dus alleen de gevulde banken in `bankData` zetten (de tunes in het meegeleverde pack bevatten alleen bank A, anders zou elke tune ruim 7 kB aan lege banken meedragen).

Eén pad in een bank (volgorde van de sleutels zoals `getState()` ze schrijft; gebruik deze volgorde, dan is `getState()` na `setState` letterlijk gelijk):

| Veld | Wat | Bereik | Start |
|---|---|---|---|
| `name` | Naam | tekst, ≤ 80 tekens | leeg |
| `data` | PCM16 little-endian als base64; leeg = geen sample | tekst, geldige base64, lengte deelbaar door 4 | leeg |
| `rate` | Samplefrequentie van `data` | geheel 8000 … 96000 Hz | 44100 |
| `channels` | Kanalen (bij 2: afwisselend links en rechts) | 1 of 2 | 1 |
| `start`, `end` | Selectie als deel van het sample | `start` 0 … 0,9999; `end` `start`+0,0001 … 1 | 0 en 1 |
| `reverse` | Omgekeerd afspelen | boolean | `false` |
| `gain` | Samplevolume | −24 … 24 dB | 0 |
| `tune` | Transpositie | −24 … 24 halve tonen | 0 |
| `fadeIn`, `fadeOut` | Aan- en uitfade | 0 … 2 s | 0,003 en 0,01 |
| `mode` | `shot` speelt het sample uit (noteoff doet niets), `gate` stopt bij noteoff of na `dur`, `loop` herhaalt tot noteoff of `dur` | `shot`, `gate`, `loop` | `shot` |
| `root` | MIDI-noot waarbij het sample op zijn eigen toonhoogte klinkt (alleen in `keys`) | geheel 0 … 127 | 60 |

Een pad met een ongeldige `data` (geen base64, onvolledige frames, langer dan 120 s) wordt stil leeg gezet. Getallen buiten het bereik worden afgekapt, onbekende velden genegeerd.

Samplebank heeft geen routing of lopende positie in zijn state, dus er is niets om weg te laten. `bank` en `pad` horen wel bij een tune: ze bepalen welk sample in `keys` klinkt.

### Limieten (behouden)

120 s per sample, 32 MiB PCM16 over alle vier banken, 50 MiB per invoerbestand, 32 stemmen tegelijk. Een tune blijft veel kleiner: zie hieronder.

### Hoe een tune klinkt zonder eigen sample

Samplebank heeft geen ingebouwde bron. Een tune moet daarom zijn eigen, kleine, gesynthetiseerde samples meebrengen. Het pack `samplebank-styles` doet dat met twee soorten:

- **Kit** (`playMode: "pads"`, `baseNote: 36`): 7 tot 9 slagwerkgeluiden op pad 1, 2, 3 … (kick, snare, clap, hats, toms, percussie, effecten), allemaal `shot`; open hats `gate`. Samples van 0,05 tot 0,6 s bij 8000–14000 Hz, mono, 1,5 tot 9 kB per sample in base64.
- **Instrument** (`playMode: "keys"`, `pad: 0`): één klank op pad 1, chromatisch speelbaar. Twee bouwwijzen:
  - **Lus** (`mode: "loop"` of `"gate"`): een stuk dat precies een **geheel aantal perioden** van de toon bevat, zodat de lus naadloos sluit. Kies het aantal frames als `N × W` met `W` perioden van `N` frames en zet `rate = round(f_root × N)` (≥ 8000), waarbij `f_root` de frequentie van de noot `root` is. Een akkoord of een uitgesmeerde (detune-)klank maak je met meerdere lagen met een geheel aantal perioden per venster (bijvoorbeeld 48 perioden voor de grondtoon, 57 voor een kleine terts, 72 voor de kwint). Zo klinkt de lus ook bij andere noten zuiver. Frames per sample: 1000 tot 6000.
  - **Eenmalig** (`mode: "shot"`): een kort aanslaggeluid met eigen uitklinking (pluk, toets, bel) op toonhoogte `root`, 0,3 tot 0,7 s bij 8000–11025 Hz.

Een korte vaste samplefrequentie betekent dat de klank bij hoge noten helderder oogt dan hij is en bij lage noten dof; vul `root` daarom in op de noot waarbij je hem het meest speelt (48 voor een pad, 36 voor een sub, 60 voor een lead).

De uitgang gaat door een compressor (drempel −6 dB, verhouding 8) en elke stem krijgt `vel × 10^(gain/20) × 0,7`. Stel `gain` per pad zo in dat de niveaus van alle tunes gelijk zijn: een enkele noot of treffer piekt rond 0,3 tot 0,5, een akkoord van drie noten blijft onder 0,9.

### Wat een goede basis is

- **Bas**: lus met `mode: "loop"`, `root` 36 of 48, `fadeOut` 0,05–0,1, `cutoff` 1000–5000 Hz. Een sinus-sub heeft een korte lus (8 perioden) nodig; een zaagtand of puls met een lagere `cutoff` klinkt dikker.
- **Lead**: lus `loop`, `root` 60, `cutoff` 8000–16000 Hz, fade-in kort (0,003–0,01).
- **Pad / akkoord**: lus `gate` of `loop` met een lange `fadeIn` (0,15–1,5 s) en `fadeOut` (0,3–2 s) voor trage aanzwellingen; `level` 0,7. Alleen noten met een `dur` krijgen de `fadeOut`; bij een vastgehouden noot en noteoff stopt de stem in ongeveer 4 ms.
- **Pluk / stab / toetsen**: `shot` met een aanslag die zelf uitklinkt, `cutoff` 5000–15000 Hz.
- **Kit**: elk geluid piekt (enkel, `vel` 0,9) rond 0,5; hats en shakers 4 tot 6 dB zachter, rim en effecten 3 dB. Houd een kit tot 9 pads en zet `cutoff` rond 6000 Hz voor een lo-fi kit en 15000–16000 Hz voor een heldere kit.

### Wat een tune niet moet doen

- Geen sample langer dan nodig: een tunepack boven ongeveer 1,5 MB is te zwaar om te laden en te delen. Mono, 8000–14000 Hz, tail afknippen waar het sample onder 0,4 % van zijn piek komt.
- Geen `data` die niet-eindige of ongeldige waarden bevat (er bestaat in PCM16 geen NaN, maar een gebroken base64 maakt het pad stil), geen `rate` buiten 8000–96000, geen `channels` anders dan 1 of 2.
- Geen lus die niet op een geheel aantal perioden eindigt (dan hoor je een tik of een toon die wegdrijft).
- Geen `mode: "loop"` bij een `pads`-kit zonder dat je weet wanneer hij stopt: een lus zonder `dur` en zonder noteoff klinkt door tot er een `allnotesoff` komt.
- Geen merk- of modelnamen in een tune, bank of padnaam, en geen samples uit andermans werk: alles in `tunes/` is `CC0-1.0`.

## Wat Samplebank met zijn ingangen doet (getest)

- Een noot met een niet-eindige waarde of een ongeldige duur (negatief, `NaN`, `Infinity`) maakt geen halve stem meer aan: nootnummers worden begrensd tot 0–127 en een negatieve duur telt als 0. De oude versie liet bij `NaN`-noten (in `keys`) of een zeer grote noot een afspeelbron zonder `start` en zonder opruimen achter.
- Een samplebuffer van de browser-decoder met een niet-eindige waarde wordt 0; een leeg of niet te decoderen bestand geeft een duidelijke melding en laat de bank ongemoeid.
- `setState` kapt af en geeft de standaard bij ongeldige waarden. Is het totale geheugen over de limiet, dan blijven de eerste pads gevuld en worden de rest leeg gezet; `setState` gooit niet.
- Bij gewone, geldige ingangen is het geluid bit-identiek aan de oude versie (offline render van oud en nieuw bij 400 willekeurige banken en nootreeksen met maximaal twee gelijktijdige stemmen: 0 afwijkende samples; bij drie of meer stemmen verschilt zelfs dezelfde code van run tot run, omdat de browser de som van drie of meer ingangen in wisselende volgorde optelt).

## Controleren

- `node contract/validate-instrument.mjs devices/samplers/Samplebank/samplebank.patchkamer-device.js --lang nl` en `--lang en`, vanuit de root. Beide moeten `OK` geven, zonder `let op`.
- Pack controleren: geldige JSON; `device` is `nl.patchkamer.samplebank`; elke `state` heeft de velden uit de tabel, `bankData` is een lijst van strings die elk als JSON te lezen zijn; `setState(state)` en daarna `getState()` geeft voor de gevulde banken dezelfde string terug (geen afgekapte of verdwenen velden).
- Niet beluisterd: je kunt niet horen hoe een tune klinkt; meld dat (offline gemeten zijn alleen piek, rms, stilte en niet-eindige waarden).
- Alle tekst in het apparaat staat in het woordenboek `EN` bovenin het bestand (Nederlands is de bron, Engels via `host.lang`). Een nieuwe tekst krijgt altijd nl én en.

## Wat je niet doet

- Verander nooit de `id`, de `kind`, de poort-id's of de namen van state-velden.
- Pas het apparaat niet aan om een tune te laten kloppen.
- Zet geen merknamen van bestaande apparatuur in naam of omschrijving, en verzin geen persoon bij `author`.
- Commit of push niet, tenzij de opdracht dat vraagt.
