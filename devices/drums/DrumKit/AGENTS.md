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
| Contract | v1.17 (apparaatversie 1.15.0) |
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

## Nootnamen voor sequencers

Drum Kit heeft `noteNames()` (contract v1.14, `../../../contract/PATCHKAMER-CONTRACT_NL.md` §13b): elk kanaal met zijn instrumentnaam (bijvoorbeeld `Bass drum`, `Snare`) en zijn `note`, in de volgorde van `channels`; twee kanalen met dezelfde noot geven één regel (de eerste). Een sequencer die er met een notenkabel aan hangt, toont die klanken als rijen (Step Sequencer) of drumrijen (Pattern Tracker, Pattern Playlist) en volgt wijzigingen van kit, volgorde of noot via `host.noteNamesChanged`. Een tune die de kanalen verandert, verandert dus ook wat de sequencer toont. Je hoeft er in een tune niets voor te doen. Sinds 1.14.1 volgen daarna ook de instrumenten zonder kanaal (zie hieronder).

## Swing, live inspelen en de volledige lijst (sinds 1.14.1)

Nieuwe state-sleutels (alle standaard 0 of uit; een oude state of tune laadt en klinkt ongewijzigd):

| Veld | Wat | Waarden | Start |
|---|---|---|---|
| `patternSwing` | Extra swing per patroon A–D (index = `pattern`); lijst van 4 getallen | elk 0 … 0,5 (fractie van een zestiende) | `[0,0,0,0]` |
| `channels[n].swing` | Extra swing van één kanaal | 0 … 0,5 | 0 |
| `record` | Opname aan (werkstand: staat niet in `getPreset`, een preset laat hem staan) | boolean | `false` |

Swing: de host vertraagt de oneven zestienden al met `Host.swing`. Daar komt per kanaal `min(0,5, patternSwing[pattern] + channel.swing) × stepDur` bij; een zestiende is oneven als de hoststap (`bar × 16 + step`) oneven is. Een ratchet op een oneven stap schuift als geheel mee, humanize komt er los bij. Het apparaat heeft alleen het zestiende-raster (geen 1/32, geen triolen, geen micro-timing). Ontbrekende, niet-eindige of onmogelijke waarden worden 0 of afgekapt.

Opname: staat `record` aan en loopt de klok, dan schrijven `note` (alle kanalen met die noot) en `trig` (`lane` `chN` of een instrumentnaam) met `vel` een stap `{ v: vel, p: 1, r: 1 }` in het actieve patroon op het juiste kanaal, op het dichtstbijzijnde *geswingde* zestiende (hostswing + `patternSwing` + `swing`), bepaald uit `ev.time` (of `ctx.currentTime`) en de laatste klokstap. Een oude stap op dezelfde plek en hetzelfde kanaal wordt vervangen; andere stappen blijven staan. Omdat Drum Kit geen fijner raster kent, is kwantiseren altijd aan (er is geen vinkje). De plek is `stap mod length`. Een stap die nog niet gepland is klinkt niet dubbel. Niets wordt geschreven bij opname uit, bij stilstaande klok, een niet-eindige of nul-`vel`, of een tijd meer dan 4 s van de klok. Geen undo.

Volledige lijst: `noteNames()` geeft sinds 1.14.1 eerst de kanalen en daarna **alle overige instrumenten uit de instrumentkeuze** (alle 24 in totaal) met hun standaardnoot of de eerstvolgende vrije. Een `note` of `trig` met zo'n instrument klinkt als **gast** op een vrij kanaal (index vanaf het aantal kanalen; bij 16 kanalen is er geen vrije bus en blijft het stil), met de standaardinstellingen van het klankmodel van kanaal 1; de state verandert niet. Een gast wordt **niet opgenomen** (een stappenraster heeft alleen rijen voor kanalen en opname voegt nooit een kanaal toe).

## Klembord: patroon kopiëren en plakken (sinds 1.15.0)

De host kopieert en plakt met de knoppen Kopieer en Plak in de kaartbalk en met Ctrl/Cmd+C en Ctrl/Cmd+V (contract v1.17, §13d; formaat `patchkamer-clip`, tijd in **tikken**: 12 per zestiende, 192 per maat). `getState()`, tunes en geluid zijn niet veranderd; `modExclude` noemt nu ook `editVelocity` en `editProbability` (alleen metadata, de `let op` van de validator is weg).

| Methode | Wat |
|---|---|
| `clipInfo()` | `copy` en `paste` zijn `['drums']`; `name` is "Patroon A" tot "Patroon D"; `length` `{ min 12, max 768, step 12, current: length × 12, shared: true }` (de lengte geldt voor alle patronen, de host past de clip aan en wijzigt de lengte niet); `grid` `[16]`; `scheme` `gm`; `vel` `continuous`; `prob` en `ratchet` waar; `lanes` = één baan per kanaal (`id` `chN`, `name` van het instrument, `type` = het instrument zoals `parts()[].type`, `note`). `null` na `destroy`. |
| `getClip()` | Het actieve patroon (`state.pattern`) als `drums`-clip: per kanaal alle stappen met `v` ≥ 0,01 binnen `length` als slag (`t` = stap × 12, `vel` = `v`, `prob` = `p` als die < 1, `ratchet` = `r` als die > 1); `swing` is de patroonswing. Geen `native` nodig: het apparaat heeft niets dat het formaat niet kent. |
| `setClip(clip)` | Zet de stappen van het actieve patroon voor alle kanalen binnen `length` en laat al het andere staan (andere patronen, stappen voorbij `length`, kit, klank, swing, `length`, `selected`). Banen worden gevonden via hun `id` `chN`; een baan die niet bestaat wordt genegeerd. Een kanaal zonder slagen in de clip wordt leeg. Per stap wint de hardste slag; `acc` geeft `v` 1; `t` wordt op de dichtstbijzijnde stap gezet; `ratchet` hoogstens 4. `{ ok: false, reason }` bij een andere `kind` (alleen `drums`) of een ongeldige clip; de state blijft dan gelijk. Gooit nooit, geen `NaN`, stuurt zelf geen gebeurtenissen. |

Risico's: (1) kanalen met dezelfde noot blijven aparte banen (`noteNames()` telt ze samen, de clip niet); (2) gastinstrumenten zonder kanaal (zie hierboven) worden nooit gevuld: een baan zonder kanaal in de bron valt in de host weg en wordt gemeld; (3) een kit zonder bijvoorbeeld `conga` laat die baan vallen, omdat de host op `type`, naam en nootnummer uitlijnt en nooit op volgorde; (4) de lengte is gedeeld: een kortere clip wordt door de host herhaald als de lengte een veelvoud is, een langere afgekapt; (5) een stap met `v` onder 0,01 komt niet in de clip (kan alleen door een handgemaakte state). Plakken wist de stappen van het hele actieve patroon, ook van kanalen die niet in de clip staan.

Getest (Playwright in een echte browser, nl en en): `setClip(getClip())` laat `getState()` gelijk; kopiëren Drum Kit naar Pulse Drums en terug (kick-slagen gelijk); ongedaan herstelt de state exact; plak van notes wordt geweigerd; extreme invoer (100000 slagen, `NaN`, lengte 1e9, baan-id's die niet bestaan) geeft geen fout of `NaN`. Niet beluisterd.

## Tunes maken

- **Zet de eigen sequencer uit**: elke tune bevat `run: false`, zodat een gebruiker met zijn eigen sequencer kan beluisteren welke kit het best past. De patronen blijven in de tune staan; wie de eigen sequencer weer aanzet, hoort de groove. Laat dit veld in een nieuwe tune dus nooit weg (bij een ontbrekend veld start het apparaat zijn eigen sequencer).

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

## Documentatie en songs

Dit zijn de plaatsen waar je terechtkunt voor documentatie en voor het componeren van songs met dit apparaat. Songs zijn CC-BY-4.0, tunes en presets CC0-1.0, het apparaat AGPL-3.0-or-later.

- Handleiding van Drum Kit: [NL](../../../docs/drums/USER-MANUAL_NL.md#drum-kit) · [EN](../../../docs/drums/USER-MANUAL_EN.md#drum-kit).
- Overzicht van de soort: [README](../README.md); handleiding van de hele soort: [NL](../../../docs/drums/USER-MANUAL_NL.md) · [EN](../../../docs/drums/USER-MANUAL_EN.md).
- Tunes (klanken, `kind: set`): [drum-kit-styles.patchkamer-tunes.json](../../../tunes/drum-kit-styles.patchkamer-tunes.json). Kies een tune als beginpunt voor de `state` van dit apparaat in de song; velden die de tune niet noemt krijgen hun standaard. Hoe tunes zijn opgebouwd: [tunes/AGENTS.md](../../../tunes/AGENTS.md).
- Overzicht van alle apparaten en hun signaalketens: [devices/AGENTS.md](../../../devices/AGENTS.md). Een song componeren: [songs/AGENTS.md](../../../songs/AGENTS.md).
- Route voor agents: [soort Drums](../AGENTS.md) → [devices/AGENTS.md](../../AGENTS.md) → [root AGENTS.md](../../../AGENTS.md). Contract: [NL](../../../contract/PATCHKAMER-CONTRACT_NL.md) · [EN](../../../contract/PATCHKAMER-CONTRACT_EN.md). Hoe tunes van dit apparaat zijn opgebouwd: [tunes/AGENTS.md](../../../tunes/AGENTS.md). <!-- agents-tree -->
- Rol in een song: drums. Het apparaat speelt zelf een patroon op de klok van de studio (patronen A tot D) en kan ook getriggerd worden via `trigger`. De som komt uit `mix`, elk kanaal los uit `ch1` … `ch16`, en `trigs` stuurt de slagen door; kies voor losse kanalen via een Mixer of de bundel `multi`.
