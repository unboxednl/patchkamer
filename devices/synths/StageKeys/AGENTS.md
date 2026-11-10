# AGENTS.md: Stage Keys

Dit bestand is voor AI-agents die **tunes voor Stage Keys** maken. Het is niet geschreven voor mensen. Het hoort bij `../../../AGENTS.md` (algemeen) en `../../../tunes/AGENTS.md` (regels voor tunepacks); lees die eerst. Hier staat wat alleen voor Stage Keys geldt.

## Wat Stage Keys is

Een polyfone toetsensynth met zeven klankmodellen, een eigen klavier en een uitgangsketen met vervorming en stereo-tremolo. Het heeft **geen sequencer en geen arpeggiator**: het speelt noten die van buiten komen (een sequencer, het Keys-apparaat, het eigen klavier) en stuurt door wat je op het eigen klavier speelt.

| | |
|---|---|
| Bestand | `stage-keys.patchkamer-device.js` (in deze map) |
| `id` | `nl.patchkamer.stagekeys`. Verander die nooit: daaraan hangen tunes en songs van gebruikers |
| Naam | `Stage Keys` in alle talen; alleen de poortnamen hebben een Engelse variant (via `i18n`) |
| Soort | `instrument`: dit apparaat krijgt dus **tunes** (geen presets) |
| Poorten | eventingang `notes` (Noten), eventuitgang `played` (Gespeeld), modulatie-ingang `mod`, audio-uitgang `out` (Uit) |
| Contract | v1.11 |
| Licentie apparaat | AGPL-3.0-or-later |

Dit apparaat is de nieuwe, bijgewerkte vorm van een ouder bestand met een andere id (`nl.unboxed.stagekeys`) en andere namen voor de klankmodellen. Tunes of songs uit die tijd verwijzen naar de oude id en de oude namen en laden hier niet in.

## Wat je hier doet

Je maakt klanken (tunes) voor Stage Keys en zet ze als pack in `../../../tunes/`. Het apparaat zelf pas je alleen aan als de opdracht dat zegt (`version` ophogen; `id`, poort-id's en state-velden gelijk houden).

## De state

`state` van een tune is wat `getState()` teruggeeft, zonder `kbBase` (zie onder). De host bewaart een tune met `getPreset()`; dat is `getState()` zonder `kbBase`.

| Veld | Wat | Bereik | Start |
|---|---|---|---|
| `inst` | Klankmodel (zie de tabel hieronder) | `tine`, `reed`, `combpluck`, `organ`, `combo`, `vibes` of `bass` | `tine` |
| `tone` | Toon: de betekenis hangt van het model af (zie de tabel) | 0 … 1 | 0,55 |
| `drive` | Vervorming na de stemmen (zacht, symmetrisch) | 0 … 1 | 0,1 |
| `tremRate` | Snelheid van de stereo-tremolo in Hz (de twee kanalen lopen in tegenfase) | 0,5 … 12 | 4,5 |
| `tremDepth` | Diepte van de tremolo | 0 … 1 | 0 |
| `tune` | Stemming in cent | −50 … 50 | 0 |
| `rotaryFast` | Rotary-snelheid, alleen bij `organ`: `false` = traag (0,7 Hz), `true` = snel (6,6 Hz) | `true` of `false` | `false` |
| `oct` | Octaafverschuiving van binnenkomende noten (niet van het klavier) | −2, −1, 0, 1 of 2 | 0 |
| `lvl` | Niveau | 0 … 1 | 0,4 |
| `kbBase` | Laagste toets van het klavier op de kaart (alleen weergave) | 24 … 96 | 48 |

`kbBase` hoort **niet** in een tune: het is de scrollstand van het klavier. Laat het weg; het apparaat houdt dan de huidige stand.

### De zeven klankmodellen

Elk model is een eigen stem (toonopbouw), met een vaste uitklinktijd na het loslaten (release) en een vaste aanslag. `tone` doet per model iets anders; het label op de kaart wisselt mee.

| `inst` | Naam op de kaart | Wat het is | Wat `tone` doet | Uitklinken na loslaten |
|---|---|---|---|---|
| `tine` | Tine Piano | elektrische piano met een zachte, belachtige toon | Bark: aanslaghardheid en bijtende boventonen (0 = zacht, 1 = scherp) | 0,25 s |
| `reed` | Reed Piano | elektrische piano met een rietachtige, grommende toon | Reed growl: hoe sterk de grom en het rietgeluid zijn | 0,18 s |
| `combpluck` | Kampluk (Comb Pluck) | kort tokkelend, funky geluid uit twee zaagtanden met een kamfilter | Pickup: helderheid en kamfilter (0 = dof, 1 = helder en scherp) | 0,06 s |
| `organ` | Drawbar-orgel (Drawbar Organ) | orgel met negen sinussen (drawbars), percussie en rotary | Drawbars: 0 = alleen de laagste drawbars, 0,5 = meer, 1 = alle negen | 0,05 s |
| `combo` | Combo-orgel (Combo Organ) | orgel met blok- en zaagtandstemmen en vibrato | Flute → Reed: 0 = zacht en fluitachtig, 1 = scherp en rietachtig | 0,03 s |
| `vibes` | Vibrafoon (Vibraphone) | metalen staven met een mallet-aanslag | Mallet: hardheid van de mallet (0 = zacht, 1 = hard met veel boventonen) | 0,5 s |
| `bass` | Synth-bas (Synth Bass) | twee zaagtanden plus sub met een lowpass-filter | Filter: openheid en resonantie van het filter | 0,12 s |

De `tone` van een tune wordt bij elke nieuwe noot gelezen: verandert hij tijdens een klinkende noot, dan geldt dat vanaf de volgende noot.

### Wat het apparaat met noten doet

- Polyfoon, **maximaal 24 stemmen**; daarboven wordt de oudste stem afgekapt.
- **Eén stem per toonhoogte**: dezelfde noot opnieuw aanslaan kapt de vorige van die toonhoogte kort af.
- Een nootgebeurtenis heeft `note` (MIDI, 12 … 120 na `oct` en afronden), `vel` (0,05 … 1; standaard 0,8), `time` en `dur` (standaard 0,3 s). Een gebeurtenis met `vel: 0` of `off: true` is een noot-uit. Met `dur` 0 of lager houdt de noot aan tot een noot-uit of Stop.
- Gebeurtenissen met een niet-eindig `note`, `vel`, `time` of `dur` worden genegeerd of krijgen de standaard; een `time` verder dan 30 s vooruit wordt 30 s.
- CC-gebeurtenissen (`type: 'cc'`, `id`, `value` van 0 tot 1): `tone`, `cutoff`, `timbre`, `bark`, `drawbars` (alle: Toon), `drive`, `tremolo` of `trem`, `tremrate` of `rate`, `tune`, `level`, `volume` of `lvl`, `rotary` (≥ 0,5 = snel), `sustain` of `pedal` (≥ 0,5 = pedaal in) en `model` of `inst` (kiest een model; 0 … 1 loopt over de zeven modellen). Een CC zet de knop, zoals een fader.
- Bij Stop klinken alle noten uit.
- De uitgang `played` stuurt wat op het eigen klavier wordt gespeeld door (met `dur` = hoe lang de toets was ingedrukt).
- De modulatie-ingang `mod` kan zes parameters sturen (lane Stage Keys): `tone`, `drive`, `trem` (diepte), `tremrate`, `tune` en `lvl`. Sturing komt bovenop de knop en blijft binnen het bereik.

### Hoe een tune eruit hoort te zien

Een tune is `kind: "set"` met een `state` met de negen velden `inst`, `tone`, `drive`, `tremRate`, `tremDepth`, `tune`, `rotaryFast`, `oct`, `lvl` (zonder `kbBase`). Zet alle velden, zodat de tune niet afhangt van wat er daarvoor op het apparaat stond.

Wat het apparaat met een state doet (getest):
- Getallen buiten het bereik worden afgekapt (`tremRate: 1e9` wordt 12); een tekst, `null`, `NaN` of een ontbrekende waarde geeft de startwaarde.
- Een onbekende `inst` geeft `tine`; een `oct` buiten −2 … 2 geeft 0; een `rotaryFast` die geen boolean is geeft `false`.
- Onbekende velden worden genegeerd. Zet er geen in. Namen uit oudere versies van dit apparaat (voor de rotary-snelheid en de `inst`-waarden) bestaan niet meer.
- `setState({})` geeft de startwaarden; `setState(getState())` geeft dezelfde state terug.

## Goede instellingen per soort klank

Stage Keys heeft geen envelope, filter-envelope of arpeggiator: de omhulling zit in de modellen. Een tune verschilt dus van de andere door `inst`, `tone`, `drive`, tremolo en `oct`.

| Soort | Advies |
|---|---|
| Basis | De startwaarden: `inst` `tine`, `tone` 0,55, `drive` 0,1, `lvl` 0,4. Dat klinkt als een gewone elektrische piano. |
| Piano / akkoorden | `tine` of `reed`, `tone` 0,4 … 0,7, `drive` 0,1 … 0,3, `tremDepth` 0,3 … 0,6 en `tremRate` 4 … 6 voor een stereo-tremolo. `lvl` 0,3 … 0,4 zodat akkoorden niet clippen. |
| Bas | `bass` met `tone` 0,2 … 0,5 en `drive` 0,1 … 0,3, of `combpluck` met `tone` 0,3 voor een tokkelende bas. Laat de sequencer lage noten sturen (C1 … C3); `oct` −1 of −2 verlaagt noten die van buiten komen. |
| Lead | `combo` met `tone` 0,5 … 0,8 of `bass` met `tone` 0,7 en een hoger `lvl`; geen tremolo, `drive` 0,2 … 0,4. Het apparaat is polyfoon: een lead is een enkelvoudige melodie met lange noten. |
| Pad | Een echt zwevende pad kan het apparaat niet maken (er is geen langzame aanzwel). De dichtstbijzijnde klank: `organ` met `tone` 0,6 … 1 en `rotaryFast` `false`, of `combo` met `tone` 0,1 … 0,3, met lange noten (`dur`) of de sustainpedaal-CC en `tremDepth` 0,2 … 0,4 met `tremRate` 0,5 … 1. |
| Pluck | `combpluck` met `tone` 0,4 … 0,7, `vibes` met `tone` 0,5 … 0,8 of `tine` met `tone` 0,8 en korte noten. |
| Orgel | `organ`, `tone` 0 … 1 (drawbars), `rotaryFast` `true` voor een lopend orgel, `drive` 0,2 … 0,5. |
| Arpeggio | Het apparaat heeft **geen eigen arpeggiator**. Een tune hoort geen patroon te bevatten: de arpeggio komt van een sequencer die noten stuurt. Kies voor korte, ritmische noten een model met een korte release: `combpluck` (0,06 s), `bass` (0,12 s) of `vibes` (0,5 s, laat dan ruimte tussen de noten). |

Een tune hoeft geen patroon te bevatten. Wil je er toch een demonstratie bij maken, doe dat in een song met een sequencer, niet in de state van Stage Keys.

## Wat een tune niet moet doen

- Geen `kbBase` in de state en geen velden die hier niet staan.
- Geen `lvl` boven 0,6 samen met vol bezette akkoorden: bij extreme instellingen (`lvl` 1, `drive` 1, veel stemmen) zijn pieken tot ongeveer 2,0 gemeten, en dat clipt verderop in de keten.
- Geen `drive` boven ongeveer 0,6 als de uitgang naar een effect gaat dat gelijkspanning doorgeeft: de vervormer geeft bij hoge `drive` een kleine gelijkspanning, ook als er niets klinkt (gemeten: zie "Controleren").
- Reken niet op meer dan 24 gelijktijdige noten of op twee noten van dezelfde toonhoogte tegelijk.
- Verwacht geen doorklinkende noot na Stop: Stop klinkt alles uit.

## Skins

De zes schuiven (`tone`, `drive`, `tremDepth`, `tremRate`, `tune`, `lvl`) zijn sinds 1.13.0 via `host.ui.adopt` herkenbaar voor skins (`role` param, `group` sound; `id` is de state-sleutel). Een skin kan ze zo als draaiknop tonen (`design.controls` met `face: rotary`). De meegeleverde skin `Compact` staat in `../../../skins/library/nl.patchkamer.stagekeys/` (zes draaiknoppen in één kader, ongeveer 480 x 271 punten tegenover 560 x 347). Wijzig je de opbouw van `.ctrls` of `.ctl`, controleer dan die skin.

## Controleren

- Draai vanuit de root van de repo: `node contract/validate-instrument.mjs devices/synths/StageKeys/stage-keys.patchkamer-device.js` (en met `--lang en`). Dat moet `OK` geven, zonder `let op`.
- Je kunt niet horen hoe een tune klinkt. Heb je een browser, laad dan de host (`../../../patchkamer/AGENTS.md`) en kies de tune. Heb je geen browser, schrijf dan in je oplevering dat de tune **niet beluisterd** is.
- Alle tekst in het apparaat staat in het woordenboek `EN` bovenin `create` (Nederlandse bron, Engels via `host.lang`). Een nieuwe tekst krijgt altijd nl én en.
- In de stemmen zit geen terugkoppeling of instabiel filter; bij een zoektocht met willekeurige en extreme instellingen (en gebeurtenissen met `NaN`, `Infinity` en absurde waarden) kwam geen enkele niet-eindige sample voor.

## Wat je niet doet

- Verander nooit de `id`, de `kind`, de poort-id's of de namen van state-velden.
- Pas het apparaat niet aan om een tune te laten kloppen.
- Zet geen merknamen van bestaande apparatuur in naam of omschrijving, en verzin geen persoon bij `author`.
- Commit of push niet, tenzij de opdracht dat vraagt.

## Documentatie en songs

Dit zijn de plaatsen waar je terechtkunt voor documentatie en voor het componeren van songs met dit apparaat. Songs zijn CC-BY-4.0, tunes en presets CC0-1.0, het apparaat AGPL-3.0-or-later.

- Handleiding van Stage Keys: [NL](../../../docs/synths/USER-MANUAL_NL.md#stage-keys) · [EN](../../../docs/synths/USER-MANUAL_EN.md#stage-keys).
- Overzicht van de soort: [README](../README.md); handleiding van de hele soort: [NL](../../../docs/synths/USER-MANUAL_NL.md) · [EN](../../../docs/synths/USER-MANUAL_EN.md).
- Tunes (klanken, `kind: set`): [stage-keys-styles.patchkamer-tunes.json](../../../tunes/stage-keys-styles.patchkamer-tunes.json). Kies een tune als beginpunt voor de `state` van dit apparaat in de song; velden die de tune niet noemt krijgen hun standaard. Hoe tunes zijn opgebouwd: [tunes/AGENTS.md](../../../tunes/AGENTS.md).
- Overzicht van alle apparaten en hun signaalketens: [devices/AGENTS.md](../../../devices/AGENTS.md). Een song componeren: [songs/AGENTS.md](../../../songs/AGENTS.md).
- Route voor agents: [soort Synths](../AGENTS.md) → [devices/AGENTS.md](../../AGENTS.md) → [root AGENTS.md](../../../AGENTS.md). Contract: [NL](../../../contract/PATCHKAMER-CONTRACT_NL.md) · [EN](../../../contract/PATCHKAMER-CONTRACT_EN.md). Hoe tunes van dit apparaat zijn opgebouwd: [tunes/AGENTS.md](../../../tunes/AGENTS.md). <!-- agents-tree -->
- Rol in een song: toetsen (zeven klankmodellen) voor akkoorden en comping. Noten op `notes`, audio uit `out`; zonder eigen sequencer of arpeggiator. De eventuitgang `played` geeft door wat gespeeld is.
