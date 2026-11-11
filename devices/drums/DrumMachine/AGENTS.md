# AGENTS.md: Drum Machine

Dit bestand is voor AI-agents die **tunes voor Drum Machine** maken of het apparaat configureren. Het is niet geschreven voor mensen. Het hoort bij `../../../AGENTS.md` (algemeen) en `../../../tunes/AGENTS.md` (regels voor tunes); lees die eerst. Hier staat wat alleen voor Drum Machine geldt.

## Wat Drum Machine is

Een drumcomputer met vier gesynthetiseerde geluiden (kick, snare, hat en perc) en een stappenpatroon van 16 stappen per geluid. Elk geluid heeft eigen regelaars voor tune, decay, toon, niveau en pan; elk geluid is een eigen spoor, zodat een modulator ze apart kan laten bewegen. Het apparaat speelt mee met de klok van de host (Start/Stop, tempo) en heeft zelf geen noteningang.

| | |
|---|---|
| Bestand | `drum-machine.patchkamer-device.js` (in deze map) |
| `id` | `nl.patchkamer.drummachine`. Verander die nooit: daaraan hangen tunes en songs van gebruikers |
| Naam | `Drum Machine` in alle talen; alleen de poortnamen hebben een Nederlandse variant (via `i18n`) |
| Soort | `instrument`: dit apparaat krijgt dus **tunes** (geen presets) |
| Poorten | audio-uitgang `out` (Uit / Out, de som), eventuitgang `trigs` (Trigs), modulatie-ingang `mod` (Mod), bundel-uitgang `multi` (Losse uit / Separate outs: de vier geluiden apart, na niveau en pan) |
| Contract | v1.17 (apparaatversie 1.18.0) |
| Licentie apparaat | AGPL-3.0-or-later |

Dit apparaat is de nieuwe, bijgewerkte vorm van een ouder bestand met een andere naam en id (Drumcomputer, `nl.patchkamer.drums`). Tunes of songs uit die tijd verwijzen naar de oude id en laden hier niet in.

## De state

`state` van een tune is wat `getState()` teruggeeft (Drum Machine heeft geen `getPreset`): de patronen, de regelaars per geluid en het hoofdniveau.

| Veld | Wat | Waarden |
|---|---|---|
| `pat.kick`, `pat.snare`, `pat.hat`, `pat.perc` | Stappenpatroon van een geluid | lijst van 16 getallen, `0` (uit) of `1` (aan); stap 1, 5, 9 en 13 klinken harder |
| `v.<geluid>.<regelaar>` | Regelaar van een geluid (tabel hieronder) | getal binnen het bereik |
| `lvl` | Hoofdniveau van de som | 0 … 1, start 0,8 |

Regelaars per geluid (bereik, start; de eenheid staat erbij):

| | `tune` | `dec` (decay) | `tone` | `lvl` (niveau) | `pan` |
|---|---|---|---|---|---|
| `kick` | 30 … 90 Hz, 50 | 0,1 … 1,2 s, 0,45 | 0 … 1, 0,3 (klik) | 0 … 1, 0,9 | −1 … 1, 0 |
| `snare` | 120 … 400 Hz, 220 | 0,05 … 0,6 s, 0,22 | 600 … 5000 Hz, 1800 | 0 … 1, 0,8 | −1 … 1, 0 |
| `hat` | geen | 0,02 … 0,4 s, 0,06 | 3000 … 12000 Hz, 7000 | 0 … 1, 0,7 | −1 … 1, 0 |
| `perc` | 200 … 900 Hz, 420 | 0,05 … 0,8 s, 0,25 | 400 … 4000 Hz, 1200 | 0 … 1, 0,7 | −1 … 1, 0 |

De hat heeft geen `tune`; zet er geen in. Start van de patronen: kick op elke vierde stap, snare op stap 5 en 13, hat op stap 3, 7, 11 en 15, perc op stap 4 en 11.

Wat Drum Machine met een state doet (getest):
- Getallen buiten het bereik worden afgekapt; een tekst, `null`, `NaN`, `±Infinity` of een ontbrekende waarde geeft de startwaarde.
- Een patroon wordt altijd 16 stappen: alleen `1` of `true` is aan, al het andere is uit; een ontbrekend patroon geeft het startpatroon.
- Een state van de eerste versie (`tune`, `hatDec` op het hoogste niveau) wordt nog gelezen.
- Onbekende velden worden genegeerd. Zet er geen in.

Modulatie: `modulate` neemt alleen eindige getallen tussen −1 en 1 aan; al het andere wordt genegeerd. Modulatie verandert nooit de bewaarde waarden.

## Klembord: patroon kopiëren en plakken (sinds 1.17.0)

De host kopieert en plakt het patroon met de knoppen Kopieer en Plak in de kaartbalk en met Ctrl/Cmd+C en Ctrl/Cmd+V (contract v1.17, formaat `patchkamer-clip` kind `drums`; tijd in **tikken**, 12 per zestiende, 192 per maat). Het apparaat levert en neemt alleen over: `clipInfo()` (licht, gooit nooit, `null` na `destroy`), `getClip()` en `setClip(clip)` (geeft `{ ok, reason }`, gooit nooit, zet niets half, klemt alles zelf, stuurt geen gebeurtenissen). `getState()`, presets, tunes, geluid en poorten zijn niet veranderd; `setClip(getClip())` laat `getState()` gelijk. Het klembord is onbetrouwbare invoer: `setClip` leest alleen getallen en tekst en evalueert niets.

- **Wat is het patroon**: de vier banen kick, snare, hat en perc van 16 stappen (192 tikken). `clipInfo()`: `copy` en `paste` `['drums']`, `length` vast 192 (`min` = `max` = `step` = 192, `shared` onwaar), `grid` `[16]`, `scheme` `device`, `vel` **`binary`**, `prob` en `ratchet` onwaar, `lanes` met `id` `kick`/`snare`/`hat`/`perc` en `type` `kick`/`snare`/`closedhat`/`perc`, `note` -1 (het apparaat heeft geen nootnummers).
- **Risico: alleen aan/uit.** Een stap is 0 of 1. Bij plakken vervalt velocity, accent, kans en ratchet (de host meldt kans en ratchet). `getClip()` geeft de velocity zoals het apparaat die speelt: 1 op de tellen (stap 0, 4, 8, 12), anders 0,75.
- **Risico: banen die niet passen.** De host lijnt uit op `type` en naam, dus een clip uit een GM-kit vult kick, snare en hat (`closedhat`) en perc alleen als de bron een baan `perc` heeft; clap, toms, ride enzovoort worden **weggelaten en gemeld**, nooit samengevoegd in perc. Een baan van het apparaat waar de clip geen slagen voor heeft, wordt **leeg**: plakken vervangt het hele patroon.
- **`setClip`**: kind moet `drums` zijn, anders `ok: false` met reden. Banen van de clip gaan op `id` (`kick`, `snare`, `hat`, `perc`), anders op `type` (hat = `closedhat`) naar de eigen baan; slagen op een tik worden stap `round(t/12)`; stappen voorbij 15 vallen weg. Swing, geluid en de rest van de state blijven.
- Getest in een browser: rondreis en `getState` gelijk, GM-clip met cowbell (cowbell gemeld), noten geweigerd, 100000 slagen, `NaN`, lengte 1e9, ongeldige banen, Ongedaan maken, nl en en. Niet beluisterd.

## Swing (1.11.1)

Naast de swing van de host (die zit al in de tijd van elke stap) heeft Drum Machine extra swing: een fractie van een zestiende-stap, 0 … 0,5 (de UI toont 0 … 50 %, dubbelklik = 0).

| Veld | Wat | Waarden |
|---|---|---|
| `swing` | swing van het patroon (er is één patroon) | 0 … 0,5, start 0 |
| `laneSwing.<geluid>` | swing van één geluid (`kick`, `snare`, `hat`, `perc`) | 0 … 0,5, start 0 |

Optelregel: de extra vertraging van een oneven zestiende (stap 2, 4, 6, … in de tellingen van de UI, `step` 1, 3, 5, … van de klok) = `min(0,5; swing + laneSwing[geluid]) × stapduur`, bovenop de hostswing; de slag en de `trigs`-gebeurtenis krijgen dezelfde tijd. Even stappen blijven staan. Ongeldige of ontbrekende waarden geven 0 (boven 0,5 wordt het 0,5); een oude state klinkt gelijk. Het patroon is altijd 16 stappen op een zestienden-raster; er zijn geen sub-zestiende rijen.

## Geen noten- of triggeringang

Drum Machine heeft geen eventingang (alleen de eventuitgang `trigs`) en dus ook geen `noteNames`: er is niets om live in te spelen (geen opname of kwantiseren) en geen noot die een sequencer kan benoemen. Een sequencer kan de vier geluiden alleen via de patronen van dit apparaat laten klinken, of via een ander apparaat met een eigen sequencer.

## Tunes maken

- Een pack heet `naam.patchkamer-tunes.json` en staat in `../../../tunes/` (licentie `CC0-1.0`); `device` is `nl.patchkamer.drummachine`, elke tune is `kind: "set"`. Lees `../../../tunes/AGENTS.md` voor het formaat.
- Een tune is een **groove**: patronen plus klank. Geef elke tune een Engelse naam, zonder merk- of modelnamen, ook niet in de vorm "in de stijl van …".
- Gebruik precies de sleutels hierboven, met waarden binnen het bereik. Maak alleen tunes als de opdracht dat vraagt.

## Skins

De schuiven van de geluidentabel (id `<geluid>.<param>`, groep = het geluid), de knoppen voor niveau en swing (`lvl`, `swing`, `laneSwing.<geluid>`) en de stapknoppen (`pat.<geluid>`, rol `step`) zijn via `host.ui` herkenbaar voor skins. Sinds 1.18.0 heeft de geluidentabel de klasse `dm-tab` en staan de niveau- en swingknoppen in een omhulsel `dm-sw` (`display: contents`, dus zonder skin ongewijzigd); het apparaat heeft CSS die alleen werkt als de host draaiknoppen (`.kn`, `data-pk-face`) heeft geplaatst. De meegeleverde skin `Compact` staat in `../../../skins/library/nl.patchkamer.drummachine/` (draaiknoppen met de naam eronder, de zes knoppen in een rij, hogere stappen). De kaartkop (naam, klembordknoppen) is bij deze naam ongeveer 660 breed; de skin vraagt daarom 660. Wijzig je `dm-tab` of `dm-sw`, controleer dan die skin.

## Controleren

- `node contract/validate-instrument.mjs devices/drums/DrumMachine/drum-machine.patchkamer-device.js --lang nl` en `--lang en`, vanuit de root. Beide moeten `OK` geven, zonder `let op`.
- Je kunt niet horen hoe een tune klinkt. Schrijf in je oplevering dat het **niet beluisterd** is.
- Alle tekst in het apparaat staat in het woordenboek `TXT` bovenin het bestand (Nederlands en Engels). Een nieuwe tekst krijgt altijd nl én en.
- Het geluid is bewezen gelijk aan dat van het oude bestand: elke aanroep naar de audiograaf (knooppunten, tijden, waarden) is identiek in 200 willekeurige configuraties. Een geluidswijziging moet dus een bewuste keuze zijn.

## Wat je niet doet

- Verander nooit de `id`, de `kind`, de poort-id's, de spoor-id's (`kick.tune` enzovoort) of de namen van state-velden.
- Pas het apparaat niet aan om een tune te laten kloppen.
- Zet geen merknamen van bestaande apparatuur in naam, omschrijving of tune, en verzin geen persoon bij `author`.
- Commit of push niet, tenzij de opdracht dat vraagt.

## Documentatie en songs

Dit zijn de plaatsen waar je terechtkunt voor documentatie en voor het componeren van songs met dit apparaat. Songs zijn CC-BY-4.0, tunes en presets CC0-1.0, het apparaat AGPL-3.0-or-later.

- Handleiding van Drum Machine: [NL](../../../docs/drums/USER-MANUAL_NL.md#drum-machine) · [EN](../../../docs/drums/USER-MANUAL_EN.md#drum-machine).
- Overzicht van de soort: [README](../README.md); handleiding van de hele soort: [NL](../../../docs/drums/USER-MANUAL_NL.md) · [EN](../../../docs/drums/USER-MANUAL_EN.md).
- Tunes (klanken, `kind: set`): [drum-machine-styles.patchkamer-tunes.json](../../../tunes/drum-machine-styles.patchkamer-tunes.json). Kies een tune als beginpunt voor de `state` van dit apparaat in de song; velden die de tune niet noemt krijgen hun standaard. Hoe tunes zijn opgebouwd: [tunes/AGENTS.md](../../../tunes/AGENTS.md).
- Overzicht van alle apparaten en hun signaalketens: [devices/AGENTS.md](../../../devices/AGENTS.md). Een song componeren: [songs/AGENTS.md](../../../songs/AGENTS.md).
- Route voor agents: [soort Drums](../AGENTS.md) → [devices/AGENTS.md](../../AGENTS.md) → [root AGENTS.md](../../../AGENTS.md). Contract: [NL](../../../contract/PATCHKAMER-CONTRACT_NL.md) · [EN](../../../contract/PATCHKAMER-CONTRACT_EN.md). Hoe tunes van dit apparaat zijn opgebouwd: [tunes/AGENTS.md](../../../tunes/AGENTS.md). <!-- agents-tree -->
- Rol in een song: drums (kick, snare, hat, perc). Het apparaat heeft geen noteningang en speelt zijn eigen patroon van 16 stappen mee met de klok; zet dus het patroon in de `state`, niet in een sequencer. De som komt uit `out`, de vier geluiden los uit de bundel `multi`; `trigs` stuurt de slagen door.
