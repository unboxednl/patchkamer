# AGENTS.md: Pulse Drums

Dit bestand is voor AI-agents die **tunes voor Pulse Drums** maken of het apparaat configureren. Het is niet geschreven voor mensen. Het hoort bij `../../../AGENTS.md` (algemeen) en `../../../tunes/AGENTS.md` (regels voor tunes); lees die eerst. Hier staat wat alleen voor Pulse Drums geldt. Pulse Drums is een zelfstandige uitbreiding van Drum Kit (`../DrumKit/AGENTS.md`): dezelfde 24 instrumenten, dezelfde acht klankmodellen en dezelfde kanaalregelaars, plus de onderdelen hieronder. Lees ook die tekst; hier staat alleen het verschil.

## Wat Pulse Drums is

Een drumworkstation voor techno. Tot 16 kanalen met 27 instrumenten (de 24 van Drum Kit en drie FM-instrumenten: `fmperc`, `fmmetal` en `fmhat`), vier patronen van maximaal 64 stappen, en per kanaal een eigen patroonlengte (polymetrie, met euclidische ritmes en roteren). Extra's ten opzichte van Drum Kit: FM-regelaars voor de FM-instrumenten, drie lagen voor de kick (body, sub en click), een rumble-bus met een eigen uitgang, grit over de hele mix, en per stap micro-timing, een cyclusvoorwaarde, een fill-voorwaarde en p-locks. Vijf fabrieksinstellingen onder "Techno DNA" (`Hypnotic`, `Hardgroove`, `Industrial`, `Deep dub` en `Broken`) vervangen kit en patronen.

| | |
|---|---|
| Bestand | `pulse-drums.patchkamer-device.js` (in deze map) |
| `id` | `nl.patchkamer.pulsedrums`. Verander die nooit: daaraan hangen tunes en songs van gebruikers |
| Naam | `Pulse Drums` in alle talen; alleen een poortnaam heeft een Nederlandse variant (via `i18n`); alle tekst in de kaart staat in `TXT` (nl en en) |
| Soort | `instrument`: dit apparaat krijgt dus **tunes** (geen presets) |
| Poorten | audio-uitgangen `mix` (Stereo mix), `rumble` (Rumble) en `ch1` … `ch16` (Drum 1 … 16); eventingang `trigger` (MIDI / trigs); eventuitgang `trigs` (Drum trigs); modulatie-ingang `mod`; bundel-uitgang `multi` (Losse uit / Separate outs) |
| Contract | v1.26 (apparaatversie 1.18.0) |
| Licentie apparaat | AGPL-3.0-or-later |

Dit apparaat is de nieuwe, bijgewerkte vorm van een ouder bestand met een andere naam en id (Puls Drums, `nl.patchkamer.puls-drums`). Tunes of songs uit die tijd verwijzen naar de oude id en laden hier niet in. De twee eerste klankmodellen heten nu `Deep` en `Punch` (in het oude bestand hadden ze een getal als naam).

## De state

`state` van een tune is wat `getPreset()` teruggeeft: `getState()` zonder het eigen werk met het apparaat (`presets`, `selected`, `bank`, `stepEdit`, `editVelocity`, `editProbability`, `editRatchet`). Een tune verandert die velden nooit. Een tune hoeft alleen te bevatten wat afwijkt: wat ontbreekt krijgt de standaardwaarde.

Voor de velden `kit`, `channels` (met `type`, `model`, `note`, `tune`, `decay`, `tone`, `noise`, `sweep`, `attack`, `cutoff`, `resonance`, `filter`, `drive`, `level`, `pan`, `mute`, `solo`, `mix`, `choke` en `steps`), `length`, `pattern`, `run`, `master` en `human` gelden dezelfde waarden en bereiken als bij Drum Kit. Het verschil:

| Veld | Wat | Waarden | Start |
|---|---|---|---|
| `rumble` | Hoeveelheid rumble: de kicks (`kick` en `sub`) gaan door een galm, een hoog- en laagdoorlaatfilter, verzadiging en ducking; het resultaat gaat naar de mix en naar de uitgang `rumble` | 0 … 1 | 0,14 (sinds 1.11.4; voorheen 0,18) |
| `rumbleTone` | Filterfrequentie van de rumble | 80 … 2500 Hz | 210 (sinds 1.11.4; voorheen 700) |
| `grit` | Verzadiging over de hele mix | 0 … 1 | 0 |
| `fill` | Fill aan (voor stappen met een fill-voorwaarde) | boolean | `false` |
| `length` | Lengte van het raster (de kaart biedt 16, 32 en 64) | 1 … 64 | 64 bij Techno DNA, anders 16 |

Extra velden per kanaal (naast die van Drum Kit):

| Veld | Wat | Waarden | Start |
|---|---|---|---|
| `seqLength` | Patroonlengte van dit kanaal (polymetrie) | geheel getal 1 … 64 | 16 |
| `fm`, `ratio` | FM-diepte en FM-verhouding (alleen bij `fmperc`, `fmmetal` en `fmhat`) | 0 … 8 en 0,25 … 12 | 1,5 en 2,7 |
| `body`, `sub`, `click` | De drie lagen van een kick (alleen bij `kick` en `sub`) | 0 … 1 | 0,85, 0,18 en 0,2 |

Een stap in `steps[patroon][n]` (4 patronen van 64 stappen) heeft `v` (velocity, 0 = geen slag), `p` (kans), `r` (ratchet 1 … 4) en bovendien:

| Veld | Wat | Waarden | Start |
|---|---|---|---|
| `micro` | Micro-timing, als deel van een stap | −0,4 … 0,4 | 0 |
| `every`, `phase` | Cyclusvoorwaarde: de stap speelt in cyclus `phase` van elke `every` cycli (een cyclus is een keer rondgaan van het kanaal) | geheel getal 1 … 8 en 1 … 8 | 1 en 1 |
| `fill` | Fill-voorwaarde: 0 altijd, 1 alleen met fill, 2 alleen zonder fill | 0, 1 of 2 | 0 |
| `locks` | P-locks: waarden die alleen voor deze slag gelden | object met sleutels uit `tune`, `decay`, `tone`, `cutoff`, `resonance`, `drive` en (alleen bij FM) `fm`, binnen het bereik van het kanaalveld | `{}` |

Stappen laat je weg of zet je op `null`; `{ "v": 0.9 }` volstaat (de rest krijgt de standaard).

Wat Pulse Drums met een state doet (getest): getallen buiten het bereik worden afgekapt; een tekst, `null`, `NaN`, `±Infinity` of een ontbrekende waarde geeft de startwaarde; een onbekend `type` geeft `kick`, een onbekend `model` geeft `Deep`; meer dan 16 kanalen worden afgekapt; onbekende velden worden genegeerd.

## Triggers en modulatie

- `onEvent` op `trigger`: `{ type: 'trig', lane: 'ch3' of een instrumentnaam, vel }`, `{ type: 'note', note, vel }` en `{ type: 'cc', id: 'ch2.cutoff', value }` met `cutoff`, `resonance`, `level`, `pan`, `drive` of `tune`, of `id: 'master'`. Zie Drum Kit.
- `modulate` (poort `mod`) neemt alleen eindige getallen tussen −1 en 1 aan en alleen voor bestaande spoor-id's. Naast `ch1.tune`, `ch1.decay` enzovoort (ook `fm`, `ratio`, `body`, `sub` en `click` waar die bij het instrument horen) zijn er globale sporen: `master`, `rumble`, `rumbleTone` en `grit`. Modulatie verandert nooit de bewaarde waarden.

## Nootnamen voor sequencers

Pulse Drums heeft `noteNames()` (contract v1.14, `../../../contract/PATCHKAMER-CONTRACT_NL.md` §13b): elk kanaal met zijn instrumentnaam en zijn `note`, in de volgorde van `channels`; twee kanalen met dezelfde noot geven één regel (de eerste). Een sequencer die er met een notenkabel aan hangt, toont die klanken als rijen (Step Sequencer) of drumrijen (Pattern Tracker, Pattern Playlist) en volgt wijzigingen van kit, volgorde of noot via `host.noteNamesChanged`. Een tune die de kanalen verandert, verandert dus ook wat de sequencer toont. Je hoeft er in een tune niets voor te doen. Sinds 1.14.1 volgen daarna **alle instrumenten uit de instrumentkeuze** die (nog) geen kanaal hebben, met hun standaardnoot (of de eerstvolgende vrije). Een noot of `trig` met de naam van zo'n instrument klinkt als **gast** op een vrij kanaal (index vanaf het aantal kanalen; bij 16 kanalen is er geen vrije bus en blijft het stil), met de standaardinstellingen van het klankmodel van kanaal 1. Zo kan een sequencer de hele lijst bespelen zonder dat je eerst kanalen toevoegt; de state verandert niet.

## Swing en live inspelen (sinds 1.14.2)

Nieuwe state-sleutels (alle standaard 0 of uit; een oude state of tune laadt en klinkt ongewijzigd):

| Veld | Wat | Waarden | Start |
|---|---|---|---|
| `patternSwing` | Extra swing per patroon A–D (index = `pattern`); lijst van 4 getallen | elk 0 … 0,5 (fractie van een zestiende) | `[0,0,0,0]` |
| `channels[n].swing` | Extra swing van één kanaal | 0 … 0,5 | 0 |
| `record` | Opname aan (werkstand: staat niet in `getPreset`, een preset laat hem staan) | boolean | `false` |
| `quantize` | Kwantiseren bij opname (werkstand, idem) | boolean | `true` |

Swing: de host vertraagt de oneven zestienden al met `Host.swing`. Daar komt per kanaal `min(0,5, patternSwing[pattern] + channel.swing) × stepDur` bij. Een zestiende is oneven als de hoststap (`bar × 16 + step`) oneven is, ook bij een kanaal met een eigen `seqLength` (polymetrie): het raster van de klok bepaalt, niet de plek in het kanaalpatroon. Een ratchet op een oneven stap schuift als geheel mee (met zijn eigen offset erbinnen); `micro` en humanize komen er los bij. Het apparaat heeft alleen het zestiende-raster (ratchets zijn delen van een stap), dus er is geen aparte regel voor 1/32 of triolen. Een ontbrekend, niet-eindig of buiten bereik veld wordt 0 of afgekapt.

Opname: staat `record` aan en loopt de klok (er is dan een `onStep` binnengekomen), dan schrijven `note` (alle kanalen met die noot) en `trig` (`lane` is `chN` of een instrumentnaam) met `vel` een stap in het **actieve patroon** op het juiste kanaal. De positie is het dichtstbijzijnde *geswingde* rasterpunt van dat kanaal (hostswing + `patternSwing` + `swing`), bepaald uit `ev.time` (of `ctx.currentTime`) en de laatste klokstap. De stap is `{ v: vel, p: 1, r: 1, micro, every: 1, phase: 1, fill: 0, locks: {} }`: een oude stap op dezelfde plek en hetzelfde kanaal wordt vervangen (overdub: andere stappen blijven staan; "Wis pattern" wist). Met `quantize` aan is `micro` 0; uit, dan komt de afwijking van het rasterpunt in `micro` (−0,4 … 0,4, afgerond op 0,01). De kanaallengte (`seqLength`) bepaalt de plek (`stap mod seqLength`). Een stap die nog niet door de klok is gepland klinkt niet dubbel (de live gespeelde noot telt). Niets wordt geschreven bij opname uit, bij stilstaande klok, bij een niet-eindige `vel`, `vel` ≤ 0 of een tijd meer dan 4 s van de klok. Geen undo.

**Gastinstrumenten**: een instrument zonder kanaal (uit de instrumentkeuze, zie Nootnamen) klinkt wel als gast maar wordt **niet opgenomen**: een stappenraster heeft alleen rijen voor kanalen en opname voegt nooit zelf een kanaal toe (dat zou kit, bundel en uitgangen veranderen). Wil je het opnemen, voeg dan eerst een kanaal met dat instrument toe.

Bij ingespeelde noten rond een zwaar geswingde stap is de tolerantie kleiner: tussen een oneven en de volgende even stap ligt dan minder dan een stap; bij 50 % extra swing (en hostswing 8 %) ligt het grensvlak op ±0,21 stap (26 ms bij 120 BPM).

## Klembord: patroon kopiëren en plakken (sinds 1.16.0)

De host kopieert en plakt met de knoppen Kopieer en Plak in de kaartbalk en met Ctrl/Cmd+C en Ctrl/Cmd+V (contract v1.17, §13d; formaat `patchkamer-clip`, tijd in **tikken**: 12 per zestiende, 192 per maat). `getState()`, tunes en geluid zijn niet veranderd.

| Methode | Wat |
|---|---|
| `clipInfo()` | `copy` en `paste` zijn `['drums']`; `name` is "Patroon A" tot "Patroon D"; `length` `{ min 12, max 768, step 12, current: langste seqLength × 12, shared: true, settable: true }` (de baanlengtes blijven van het apparaat, tenzij de gebruiker "Pas lengte aan de clip aan" kiest: dan zet `setClip` bij een andere `clip.length` de `seqLength` van alle kanalen op die lengte en vervalt de polymeter, sinds 1.17.0); `grid` `[16]`; `scheme` `gm`; `vel` `continuous`; `prob` en `ratchet` waar; `lanes` = één baan per kanaal (`id` `chN`, `type`, `note`). `null` na `destroy`. |
| `getClip()` | Het actieve patroon als `drums`-clip. Polymeter: `length` is de langste baan en `lanes[].length` is `seqLength × 12` van elke baan die korter is (de host maakt er bij een doel met één lengte een gemeenste veelvoud van). Per stap met `v` ≥ 0,01 binnen `seqLength` een slag: `t` = stap × 12 + `micro` × 12 (afgerond, binnen de baan), `vel` = `v`, `prob` = `p` als < 1, `ratchet` = `r` als > 1. **Every, phase, fill en locks** (en de exacte `micro`, en stappen met alleen die extra's) staan alleen in `native` `{ device: 'nl.patchkamer.pulsedrums', data: { pattern, ex } }`, met sleutel `kanaal:stap`. |
| `setClip(clip)` | Zet de stappen van het actieve patroon binnen de `seqLength` van elk kanaal en laat al het andere staan (andere patronen, stappen voorbij `seqLength`, `seqLength` zelf zolang `clip.length` gelijk is aan de huidige lengte, klank, kit, swing, `length`). Banen worden gevonden via hun `id` `chN`. Per stap wint de hardste slag; `t` gaat naar de dichtstbijzijnde stap en de rest wordt `micro` (hoogstens ± 0,4); `ratchet` hoogstens 4. Een slag voorbij `seqLength` telt als `dropped`. `native` wordt alleen gelezen als `native.device` gelijk is aan het `id` én `native.data.pattern` het actieve patroon is: dan komen every, phase, fill, locks en exacte `micro` terug bij slagen waarvan `t` ongewijzigd is, en blijven stappen met alleen extra's staan. Voor elk ander apparaat gaan every, phase, fill en locks verloren (stappen worden gewone stappen). `{ ok: false, reason }` bij een andere `kind` of een ongeldige clip; de state blijft dan gelijk. |

Risico's: (1) polymeter naar een doel met één lengte wordt door de host herhaald tot het kleinste gemene veelvoud en daarna afgekapt (de standaardkit "Hypnotic" heeft banen van 15 en 11 stappen en geeft een clip van meerdere tientallen maten); (2) naar een apparaat zonder `micro` wordt de microtiming op een stap afgerond; (3) plakken in Pulse Drums wist de stappen van het hele actieve patroon binnen `seqLength`, ook van kanalen die niet in de clip staan, en zet every, phase, fill en locks terug op de standaard; (4) gastinstrumenten zonder kanaal worden nooit gevuld; (5) kanalen met dezelfde noot blijven aparte banen; (6) een micro-verschuiving naar vóór stap 0 wordt op `t` 0 gezet (de exacte waarde staat in `native`).

Getest (Playwright in een echte browser, nl en en): `setClip(getClip())` laat `getState()` gelijk, ook met polymeter (12, 20 en 16 stappen) en met every/phase/fill/locks/micro (die komen na het wissen via `native` exact terug); kopiëren naar Drum Kit en Clip Arranger en terug; ongedaan; geweigerd bij notes; extreme invoer zonder fout of `NaN`. Niet beluisterd.

## Tunes maken

- **Zet de eigen sequencer uit**: elke tune bevat `run: false`, zodat een gebruiker met zijn eigen sequencer kan beluisteren welke kit het best past. De patronen blijven in de tune staan; wie de eigen sequencer weer aanzet, hoort de groove. Laat dit veld in een nieuwe tune dus nooit weg (bij een ontbrekend veld start het apparaat zijn eigen sequencer).

- Een pack heet `naam.patchkamer-tunes.json` en staat in `../../../tunes/` (licentie `CC0-1.0`); `device` is `nl.patchkamer.pulsedrums`, elke tune is `kind: "set"`. Lees `../../../tunes/AGENTS.md` voor het formaat.
- Een tune is een **kit met groove**: instrumenten, klankmodellen en een patroon. Houd hem klein: laat patronen die je niet gebruikt leeg en houd het aantal kanalen laag. Geef elke tune een Engelse naam, zonder merk- of modelnamen, ook niet in de vorm "in de stijl van …".
- Gebruik precies de sleutels hierboven, met waarden binnen het bereik. Maak alleen tunes als de opdracht dat vraagt.

## Controleren

- `node contract/validate-instrument.mjs devices/drums/PulseDrums/pulse-drums.patchkamer-device.js --lang nl` en `--lang en`, vanuit de root. Beide moeten `OK` geven, zonder `let op`.
- Je kunt niet horen hoe een tune klinkt. Schrijf in je oplevering dat het **niet beluisterd** is.
- Het geluid is bewezen gelijk aan dat van het oude bestand: elke aanroep naar de audiograaf (knooppunten, tijden, waarden) is identiek in 40 willekeurige kits (ongeveer 390.000 aanroepen), met vaste willekeur voor kans en humanize, en `getState`, `params()` en de bundel zijn gelijk. Een geluidswijziging moet dus een bewuste keuze zijn.

## Wat je niet doet

- Verander nooit de `id`, de `kind`, de poort-id's, de spoor-id's (`ch1.tune` enzovoort) of de namen van state-velden.
- Pas het apparaat niet aan om een tune te laten kloppen.
- Zet geen merknamen van bestaande apparatuur in naam, omschrijving of tune, en verzin geen persoon bij `author`.
- Commit of push niet, tenzij de opdracht dat vraagt.

## Documentatie en songs

Dit zijn de plaatsen waar je terechtkunt voor documentatie en voor het componeren van songs met dit apparaat. Songs zijn CC-BY-4.0, tunes en presets CC0-1.0, het apparaat AGPL-3.0-or-later.

- Handleiding van Pulse Drums: [NL](../../../docs/drums/USER-MANUAL_NL.md#pulse-drums) · [EN](../../../docs/drums/USER-MANUAL_EN.md#pulse-drums).
- Overzicht van de soort: [README](../README.md); handleiding van de hele soort: [NL](../../../docs/drums/USER-MANUAL_NL.md) · [EN](../../../docs/drums/USER-MANUAL_EN.md).
- Tunes (klanken, `kind: set`): [pulse-drums-techno.patchkamer-tunes.json](../../../tunes/pulse-drums-techno.patchkamer-tunes.json). Kies een tune als beginpunt voor de `state` van dit apparaat in de song; velden die de tune niet noemt krijgen hun standaard. Hoe tunes zijn opgebouwd: [tunes/AGENTS.md](../../../tunes/AGENTS.md).
- Overzicht van alle apparaten en hun signaalketens: [devices/AGENTS.md](../../../devices/AGENTS.md). Een song componeren: [songs/AGENTS.md](../../../songs/AGENTS.md).
- Route voor agents: [soort Drums](../AGENTS.md) → [devices/AGENTS.md](../../AGENTS.md) → [root AGENTS.md](../../../AGENTS.md). Contract: [NL](../../../contract/PATCHKAMER-CONTRACT_NL.md) · [EN](../../../contract/PATCHKAMER-CONTRACT_EN.md). Hoe tunes van dit apparaat zijn opgebouwd: [tunes/AGENTS.md](../../../tunes/AGENTS.md). <!-- agents-tree -->
- Rol in een song: drums, gebouwd voor techno. Het speelt zelf patronen A tot D op de klok (per kanaal een eigen lengte voor polymetrie) en kan via `trigger` getriggerd worden. De som komt uit `mix`; `rumble` en `ch1` … `ch16` zijn aparte audio-uitgangen; `trigs` stuurt de slagen door.
