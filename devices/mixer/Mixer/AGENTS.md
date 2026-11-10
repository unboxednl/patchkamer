# AGENTS.md: Mixer

Dit bestand is voor AI-agents die dit apparaat configureren of er presets voor maken. Het is niet geschreven voor mensen. Het hoort bij `../../../AGENTS.md` (algemeen); lees die eerst. Hier staat wat alleen voor Mixer geldt.

## Wat Mixer is

Een mengpaneel met een instelbaar aantal kanalen (1 tot 32) en groepen (0 tot 8). Per kanaal: trim, 3- of 5-bands EQ, send en return, groepstoewijzing, pan, fader, mute en solo. Groepen en master hebben EQ, send/return en een fader. Achter de master zit een begrenzer. "Level match" meet alle ingangen en zet de trims zo dat elke bron op hetzelfde niveau binnenkomt. Een bundelingang (`multi`) neemt een groene bundelkabel aan (bijvoorbeeld de losse uitgangen van een drumcomputer); per kanaal kies je welk bundelkanaal daar binnenkomt. De bundeluitgang (`post`) geeft alle kanalen na het mixen als één bundel.

| | |
|---|---|
| Bestand | `mixer.patchkamer-device.js` (in deze map) |
| `id` | `nl.patchkamer.mixer`. Verander die nooit: daaraan hangen presets en songs van gebruikers |
| Naam | `Mixer` in alle talen; de poortnamen hebben een Nederlandse variant (via `i18n`) |
| Soort | `mixer`: Mixer krijgt dus **presets** (geen tunes) |
| Poorten | veranderen mee met het aantal kanalen en groepen: audio-ingangen `ch1…`, `r1…` (return), `gr1…`, `mr`; audio-uitgangen `s1…` (send), `gs1…`, `ms`, `out`; bundel in `multi`, bundel uit `post` |
| Contract | v1.11 |
| Licentie apparaat | AGPL-3.0-or-later |

Dit apparaat is de nieuwe, bijgewerkte vorm van een ouder bestand (versie 2.3.0, bestandsnaam met versienummer). De versie loopt door op 2.x omdat de host een lager nummer als ouder zou zien.

## Geen tunes, wel presets

Alleen apparaten met `kind: 'instrument'` hebben tunes. Mixer is een `mixer`, dus het krijgt **presets** en **nooit tunes** (contract §0 en §13c). Maak voor Mixer geen pack in `../../../tunes/`. Een presetpack heet `naam.patchkamer-presets.json` en staat in `../../../presets/`; `formatVersion` 2, licentie `CC0-1.0`, `device` is altijd `nl.patchkamer.mixer`, elke preset is `kind: "set"`. Maak alleen presets als de opdracht dat vraagt.

## De state

`getPreset()` geeft de state **zonder** `src` per kanaal (de bronkeuzes uit een bundel zijn routing en horen niet in een preset); `setPreset` laat de bronkeuzes staan. Zet in een preset dus geen `src`.

Bovenste niveau:

| Veld | Wat | Bereik | Start |
|---|---|---|---|
| `v` | Staatsversie | altijd `2` | 2 |
| `nCh` | Aantal kanalen | 1 … 32 (geheel getal) | 8 |
| `nGrp` | Aantal groepen | 0 … 8 (geheel getal) | 2 |
| `eq` | EQ-banden | `3` of `5` | 3 |
| `target` | Doelniveau voor level match (dB) | −30 … −6 | −18 |
| `auto` | Doorlopend gelijktrekken | boolean | `false` |
| `curve` | Fadercurve: de schuif loopt over positie 0…1, niveau = −60 + 66 · positie^(1/curve) dB (1 = lineair in dB; 3 = 0 dB op 75%). Het niveau per kanaal (`lvl`) blijft in dB, dus de curve verandert alleen waar de schuif staat | 1 … 5 | 3 |
| `bundleAll` | Groepen en mix ook in de bundeluitgang | boolean | `false` |
| `ch` | Lijst met `nCh` kanalen | zie onder | – |
| `grp` | Lijst met `nGrp` groepen | zie onder | – |
| `master` | De master | zie onder | – |

Kanaal (`ch[i]`):

| Veld | Wat | Bereik | Start |
|---|---|---|---|
| `name` | Naam (gaat mee in de bundel) | tekst, hoogstens 24 tekens | leeg |
| `src` | Bronkeuze uit een bundel (`sleutel\|kanaal-id`); niet in presets | tekst | leeg |
| `trim` | Ingangsversterking (dB) | −24 … 24 | 0 |
| `eq3` | EQ laag, mid, hoog (dB), gebruikt als `eq` 3 is | 3 getallen, −15 … 15 | 0, 0, 0 |
| `eq5` | EQ laag, laag-mid, mid, hoog-mid, hoog (dB), gebruikt als `eq` 5 is | 5 getallen, −15 … 15 | 0 |
| `send` | Send | 0 … 1 | 0 |
| `ret` | Return | 0 … 1 | 0,8 |
| `grp` | Groepstoewijzing (0 = master; een groep die niet bestaat gaat naar de master) | geheel getal 0 … 8 | 0 |
| `pan` | Pan (−1 links, 1 rechts) | −1 … 1 | 0 |
| `lvl` | Fader (dB; −60 is uit) | −60 … 6 | −6 |
| `mute`, `solo` | Mute en solo | boolean | `false` |

Groep (`grp[g]`): `name`, `eq3`, `eq5`, `send`, `ret` en `mute` zoals bij een kanaal, en `lvl` (−60 … 6, start 0). Master: `eq3`, `eq5`, `send`, `ret`, `lvl` (start 0).

Wat Mixer met een state doet (getest):
- Getallen buiten het bereik worden afgekapt; een tekst, `null`, `NaN` of een ontbrekende waarde geeft de startwaarde. Een lijst die korter is dan `nCh` of `nGrp` wordt aangevuld met standaardkanalen.
- Een boolean die geen boolean is en een `eq` die niet 3 of 5 is geven de standaard. `v` wordt bij het zetten genegeerd; `getState` geeft altijd `2`.
- Onbekende velden worden genegeerd en komen niet in de state terecht. Zet er geen in.
- Een niet-eindige of absurde waarde (`NaN`, `±Infinity`, 1e9 en groter) die van een apparaat ervoor binnenkomt, laat de EQ-filters en de begrenzer niet meer voorgoed ontsporen: elke 100 ms vervangt de Mixer een ontspoord filter (de instellingen blijven) en het geluid komt terug. Getest met een burst van `NaN`, `±Infinity`, 1e9 en 1e30; normaal geluid is ongewijzigd.
- Een state van de oude Mixer 1.x (lineaire niveaus, geen groepen) wordt nog omgezet.

## Skins

Mixer bouwt zijn eigen `<input type="range">`, `<select>` en strook-DOM zonder shadow root. Sinds 2.8.0 melden de regelaars zich aan met `host.ui.adopt`: id = het id uit `params()` (`ch1.trim`, `ch1.eq3.0`, `ch1.send`, `ch1.ret`, `ch1.pan`, `ch1.lvl`, `g1.*`, `master.*`; rol `param`, de fader `fader`), `ch1.grp` en `ch1.src` (rol `select`), plus `eq`, `target` en `curve` in de configuratierij; groep = de strook (`ch1`, `g1`, `master`). Het apparaat zet zelf een korte stijl (`SKINCSS`) die alleen werkt als de host een draaiknop (`.kn`) naast een mini-regelaar zet. De meegeleverde skin `Compact` staat in `../../../skins/library/nl.patchkamer.mixer/` (draaiknoppen met naam en waarde eronder, smalle stroken, lagere fader en meters; 600 x 696 punten tegenover 960 x 756 bij 8 kanalen en 2 groepen). Wijzig je de klassen `mx2-*`, controleer dan die skin. De validator geeft sinds 2.8.0 een `let op` voor kanalen 9 tot 32 die niet in `params()` staan: dat komt doordat hij de UI met 32 kanalen bouwt terwijl `params()` bij 8 kanalen is opgevraagd; het is geen fout in het apparaat.

## Controleren

- `node contract/validate-instrument.mjs devices/mixer/Mixer/mixer.patchkamer-device.js --lang nl` en `--lang en`, vanuit de root. Beide moeten `OK` geven, zonder `let op`.
- Je kunt niet horen hoe een preset klinkt. Heb je geen browser, schrijf dan in je oplevering dat de preset **niet beluisterd** is.
- Alle tekst in het apparaat staat in het woordenboek `TXT` bovenin het bestand (Nederlands en Engels). Een nieuwe tekst krijgt altijd nl én en.

## Wat je niet doet

- Verander nooit de `id`, de `kind`, de poort-id's of de namen van state-velden.
- Pas het apparaat niet aan om een preset te laten kloppen.
- Zet geen merknamen van bestaande apparatuur in naam of omschrijving, en verzin geen persoon bij `author`.
- Commit of push niet, tenzij de opdracht dat vraagt.

## Documentatie en songs

Dit zijn de plaatsen waar je terechtkunt voor documentatie en voor het componeren van songs met dit apparaat. Songs zijn CC-BY-4.0, tunes en presets CC0-1.0, het apparaat AGPL-3.0-or-later.

- Handleiding van Mixer: [NL](../../../docs/mixer/USER-MANUAL_NL.md#mixer) · [EN](../../../docs/mixer/USER-MANUAL_EN.md#mixer).
- Overzicht van de soort: [README](../README.md); handleiding van de hele soort: [NL](../../../docs/mixer/USER-MANUAL_NL.md) · [EN](../../../docs/mixer/USER-MANUAL_EN.md).
- Overzicht van alle apparaten en hun signaalketens: [devices/AGENTS.md](../../../devices/AGENTS.md). Een song componeren: [songs/AGENTS.md](../../../songs/AGENTS.md).
- Route voor agents: [soort Mixer](../AGENTS.md) → [devices/AGENTS.md](../../AGENTS.md) → [root AGENTS.md](../../../AGENTS.md). Contract: [NL](../../../contract/PATCHKAMER-CONTRACT_NL.md) · [EN](../../../contract/PATCHKAMER-CONTRACT_EN.md). Hoe presets van dit apparaat zijn opgebouwd: [presets/AGENTS.md](../../../presets/AGENTS.md). <!-- agents-tree -->
- Rol in een song: hart van de song: alle stemmen komen hier samen (kanalen `ch1…`, returns `r1…`, groepen, master `out`). Zet per kanaal trim, EQ, pan, fader en sends; verbind de losse bron-uitgangen met de kanalen en `out` met de masterketen of een uitgang. De poorten veranderen mee met het aantal kanalen (`nCh`) en groepen (`nGrp`), dus zet die in de `state` vóór je kabels legt.


## Namen bij het koppelen aan MIDI

Elke regelaar van een kanaal, groep of de master draagt `data-pk-suffix` (`T3`, `G1`, `Master`, gezet in `tagCtl`). De host toont daardoor `Trim - T3` in de lijst van regelaars bij een MIDI-koppeling. Alleen het label verandert; de sleutel blijft gelijk.
