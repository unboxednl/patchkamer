# AGENTS.md: Drum Kit

Dit bestand is voor AI-agents die **tunes voor Drum Kit** maken of het apparaat configureren. Het is niet geschreven voor mensen. Het hoort bij `../../../AGENTS.md` (algemeen) en `../../../tunes/AGENTS.md` (regels voor tunes); lees die eerst. Hier staat wat alleen voor Drum Kit geldt.

## Wat Drum Kit is

Een drumkit met tot 16 kanalen. Elk kanaal is één gesynthetiseerd instrument (24 soorten, van bass drum tot industrial metal) met een klankmodel (8 soorten), een filter met drive, niveau en pan, en een eigen stappenpatroon. Er zijn vier patronen (A tot D) van maximaal 64 stappen, met per stap een velocity, een kans en een ratchet (1 tot 4 slagen). Het apparaat speelt mee met de klok van de host en kan ook getriggerd worden met noten of triggers van een ander apparaat. Alles wordt lokaal gesynthetiseerd; er zijn geen samples.

| | |
|---|---|
| Bestand | `drum-kit.patchkamer-device.js` (in deze map) |
| `id` | `nl.patchkamer.drumkit`. Verander die nooit: daaraan hangen tunes en songs van gebruikers |
| Naam | `Drum Kit` in alle talen; alleen een poortnaam heeft een Nederlandse variant (via `i18n`); alle tekst in de kaart staat in `TXT` (nl en en) |
| Soort | `instrument`: dit apparaat krijgt dus **tunes** (geen presets) |
| Poorten | audio-uitgangen `mix` (Stereo mix) en `ch1` … `ch16` (Drum 1 … 16); eventingang `trigger` (MIDI / trigs); eventuitgang `trigs` (Drum trigs); modulatie-ingang `mod`; bundel-uitgang `multi` (Losse uit / Separate outs: alle actieve kanalen, met de naam van het instrument) |
| Contract | v1.11 |
| Licentie apparaat | AGPL-3.0-or-later |

Dit apparaat is de nieuwe, bijgewerkte vorm van een ouder bestand met een andere naam en id (Slagwerk, `nl.patchkamer.slagwerk`). Tunes of songs uit die tijd verwijzen naar de oude id en laden hier niet in. De twee eerste klankmodellen heten nu `Deep` en `Punch` (in het oude bestand hadden ze een getal als naam); een oude state met die getallen is dus ook niet te lezen.

## De state

`state` van een tune is wat `getPreset()` teruggeeft: `getState()` zonder het eigen werk met het apparaat (`presets`, `selected`, `bank`, `editVelocity`, `editProbability`, `editRatchet`). Een tune verandert die velden dus nooit; `setPreset` laat ze staan.

| Veld | Wat | Waarden | Start |
|---|---|---|---|
| `kit` | Naam van de geladen kit | tekst, hoogstens 40 tekens: een fabriekskit (`Deep`, `Punch`, `Rock`, `Pop`, `Jazz`, `Funk`, `Lo-fi`, `Industrial`) of `Custom` | `Punch` |
| `channels` | De kanalen, 1 tot 16 | lijst van kanaalobjecten (hieronder) | de 11 kanalen van `Punch` |
| `length` | Lengte van de patronen | 1 … 64 (de kaart biedt 16, 32 en 64) | 16 |
| `pattern` | Actief patroon | 0 … 3 (A … D) | 0 |
| `run` | Sequencer aan | boolean | `true` |
| `master` | Hoofdniveau | 0 … 1 | 0,72 |
| `human` | Humanize (willekeurige timing) | 0 … 0,025 s | 0 |

Een kanaalobject:

| Veld | Wat | Waarden | Start |
|---|---|---|---|
| `type` | Instrument | een van `kick`, `snare`, `clap`, `closedhat`, `openhat`, `lowtom`, `midtom`, `hitom`, `rim`, `cowbell`, `crash`, `ride`, `shaker`, `tamb`, `conga`, `bongo`, `clave`, `wood`, `brush`, `brushswirl`, `clapdigital`, `zap`, `metal`, `sub` | `kick` |
| `model` | Klankmodel | `Deep`, `Punch`, `Rock`, `Pop`, `Jazz`, `Funk`, `Lo-fi`, `Industrial` | `Deep` |
| `note` | MIDI-noot voor dit kanaal | geheel getal 0 … 127 | per instrument (General MIDI) |
| `tune` | Stemming | −24 … 24 halve tonen | 0 |
| `decay` | Uitklinktijd | 0,02 … 4 s | per instrument en model |
| `tone` | Toon of helderheid | 0 … 1 | per instrument |
| `noise` | Ruis of textuur | 0 … 1 | per instrument en model |
| `sweep` | Toonhoogte-envelope | 0 … 1 | 0,65 bij kick, anders 0,25 |
| `attack` | Aanzet | 0,001 … 0,15 s | 0,001 |
| `cutoff` | Filterfrequentie | 30 … 20000 Hz | 18000 (Lo-fi: 4600) |
| `resonance` | Resonantie (Q) | 0,1 … 12 | 0,7 |
| `filter` | Filtersoort | `lowpass`, `highpass`, `bandpass`, `notch` | `lowpass` |
| `drive` | Verzadiging | 0 … 1 | 0 (Lo-fi 0,22, Industrial 0,55) |
| `level`, `pan` | Niveau en pan | 0 … 1 en −1 … 1 | 0,7 en 0 |
| `mute`, `solo`, `mix` | Dempen, solo, naar de stereomix | boolean | `false`, `false`, `true` |
| `choke` | Choke-groep (een nieuwe slag kapt de vorige uit dezelfde groep af) | 0 … 4 (0 = geen) | 1 bij hats, anders 0 |
| `steps` | Vier patronen van 64 stappen | lijst van 4 lijsten van 64 stappen `{ v, p, r }`: velocity 0 … 1 (0 = geen slag), kans 0 … 1, ratchet 1 … 4 | alles `{ v: 0, p: 1, r: 1 }` |

Het veld `type` bepaalt welke regelaars de kaart toont (bijvoorbeeld `sweep` alleen bij kick, tom, zap en metal); de state bevat ze altijd allemaal.

Wat Drum Kit met een state doet (getest):
- Getallen buiten het bereik worden afgekapt; een tekst, `null`, `NaN`, `±Infinity` of een ontbrekende waarde geeft de startwaarde. Een onbekend `type` geeft `kick`, een onbekend `model` geeft `Deep`, een onbekend `filter` geeft `lowpass`.
- Meer dan 16 kanalen worden afgekapt; zonder kanalen krijg je de kit `Punch`.
- Onbekende velden worden genegeerd. Zet er geen in.

## Triggers en modulatie

- `onEvent` op `trigger`: `{ type: 'trig', lane: 'ch3' of een instrumentnaam (kick, snare, …), vel }` slaat dat kanaal aan; `{ type: 'note', note, vel }` slaat elk kanaal aan waarvan `note` gelijk is; `{ type: 'cc', id: 'ch2.cutoff', value }` met `cutoff`, `resonance`, `level`, `pan`, `drive` of `tune`, of `id: 'master'`, zet een waarde (0 … 1 over het bereik).
- `modulate` (poort `mod`) neemt alleen eindige getallen tussen −1 en 1 aan en alleen voor spoor-id's die bestaan (`ch1.tune`, `ch1.decay`, … en `master`); al het andere wordt genegeerd. Modulatie verandert nooit de bewaarde waarden. Het aantal sporen hangt af van de kanalen en hun instrumenten.

## Tunes maken

- Een pack heet `naam.patchkamer-tunes.json` en staat in `../../../tunes/` (licentie `CC0-1.0`); `device` is `nl.patchkamer.drumkit`, elke tune is `kind: "set"`. Lees `../../../tunes/AGENTS.md` voor het formaat.
- Een tune is een **kit met groove**. Houd hem klein: elk kanaal heeft 4 × 64 stappen, dus laat patronen die je niet gebruikt leeg en houd het aantal kanalen laag. Geef elke tune een Engelse naam, zonder merk- of modelnamen, ook niet in de vorm "in de stijl van …".
- Gebruik precies de sleutels hierboven, met waarden binnen het bereik. Maak alleen tunes als de opdracht dat vraagt.

## Controleren

- `node contract/validate-instrument.mjs devices/drums/DrumKit/drum-kit.patchkamer-device.js --lang nl` en `--lang en`, vanuit de root. Beide moeten `OK` geven, zonder `let op`.
- Je kunt niet horen hoe een tune klinkt. Schrijf in je oplevering dat het **niet beluisterd** is.
- Het geluid is bewezen gelijk aan dat van het oude bestand: elke aanroep naar de audiograaf (knooppunten, tijden, waarden) is identiek in 60 willekeurige kits, met vaste willekeur voor kans en humanize. Een geluidswijziging moet dus een bewuste keuze zijn.

## Wat je niet doet

- Verander nooit de `id`, de `kind`, de poort-id's, de spoor-id's (`ch1.tune` enzovoort) of de namen van state-velden.
- Pas het apparaat niet aan om een tune te laten kloppen.
- Zet geen merknamen van bestaande apparatuur in naam, omschrijving of tune, en verzin geen persoon bij `author`.
- Commit of push niet, tenzij de opdracht dat vraagt.
