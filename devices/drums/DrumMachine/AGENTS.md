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
| Contract | v1.11 |
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

## Tunes maken

- Een pack heet `naam.patchkamer-tunes.json` en staat in `../../../tunes/` (licentie `CC0-1.0`); `device` is `nl.patchkamer.drummachine`, elke tune is `kind: "set"`. Lees `../../../tunes/AGENTS.md` voor het formaat.
- Een tune is een **groove**: patronen plus klank. Geef elke tune een Engelse naam, zonder merk- of modelnamen, ook niet in de vorm "in de stijl van …".
- Gebruik precies de sleutels hierboven, met waarden binnen het bereik. Maak alleen tunes als de opdracht dat vraagt.

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
