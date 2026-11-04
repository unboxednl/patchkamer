# AGENTS.md: Room

Dit bestand is voor AI-agents die dit apparaat configureren of er presets voor maken. Het is niet geschreven voor mensen. Het hoort bij `../../../AGENTS.md` (algemeen); lees die eerst. Hier staat wat alleen voor Room geldt.

## Wat Room is

Delay en galm in één apparaat. Het delay loopt op het tempo van de host (3/16) of op een vrije tijd, met een highpass in de feedbacklus. De galm is een korte ruisimpuls (0,3 … 8 s) met een toonfilter. Beide hebben een eigen mix; het droge signaal gaat altijd door.

| | |
|---|---|
| Bestand | `room.patchkamer-device.js` (in deze map) |
| `id` | `nl.patchkamer.room`. Verander die nooit: daaraan hangen presets en songs van gebruikers |
| Naam | `Room` in alle talen; alleen de poortnamen `Uit` en `Out` verschillen per taal (via `i18n`) |
| Soort | `effect` (categorie `effect`): Room krijgt dus **presets** (geen tunes) |
| Poorten | audio-ingang `in`, audio-uitgang `out`, sturing `mod` |
| Contract | v1.11 |
| Licentie apparaat | AGPL-3.0-or-later |

Dit apparaat is de nieuwe, bijgewerkte vorm van een ouder bestand met een andere naam en id (`nl.patchkamer.ruimte`, naam "Ruimte"). Presets of songs uit die tijd verwijzen naar de oude id en laden hier niet in.

## Geen tunes, wel presets

Alleen apparaten met `kind: 'instrument'` hebben tunes. Room is een `effect`, dus het krijgt **presets** en **nooit tunes** (contract §0 en §13c). Maak voor Room geen pack in `../../../tunes/`. Een presetpack heet `naam.patchkamer-presets.json` en staat in `../../../presets/`; het formaat is dat van het contract (§13c), `formatVersion` 2, licentie `CC0-1.0`, `device` is altijd `nl.patchkamer.room` en elke preset is `kind: "set"`. Maak alleen presets als de opdracht dat vraagt.

## De state

`state` van een preset is wat `getState()` teruggeeft (Room heeft geen `getPreset`).

| Veld | Wat | Bereik | Start | Eenheid |
|---|---|---|---|---|
| `sync` | Delay op het tempo van de host (3/16), of vrij | boolean | `true` | – |
| `time` | Vrije delaytijd (alleen als `sync` uit staat) | 0,05 … 1,5 | 0,375 | s |
| `fb` | Feedback van het delay | 0 … 0,92 | 0,4 | deel |
| `hp` | Highpass in de delaylus | 40 … 2000 | 200 | Hz |
| `dsend` | Delay mix | 0 … 1 | 0,3 | deel |
| `size` | Lengte van de galm | 0,3 … 8 | 3 | s |
| `tone` | Toon (laagdoorlaat) van de galm | 500 … 16000 | 6000 | Hz |
| `wet` | Galm mix | 0 … 1 | 0,3 | deel |

Let op: met de standaard filters in de lus (laagdoorlaat 3000 Hz, highpass `hp`) kan de lusversterking boven 1 komen bij `fb` boven ongeveer 0,8 (berekend uit de filtercoëfficiënten: het kritieke punt is 0,80 bij `hp` 200 Hz en 0,64 bij `hp` 2000 Hz). Dan loopt het delay rond 2 kHz langzaam op. Room vangt dat in een echte (realtime) context op: een meter verlaagt de feedback tijdelijk als de lus boven +15 dB piekt en vervangt de lus als hij niet-eindig wordt. Maak geen preset met `fb` boven 0,8 zonder dit te weten.

Wat Room met zijn ingang doet (getest): `NaN`, `±Infinity` en absurd grote waarden (boven ±16, +24 dB) worden begrensd door een kleine worklet voor de ingang, zodat één foutieve waarde van een apparaat ervoor de delaylus en de galm niet voorgoed vergiftigt. Daarnaast controleert een meter om de 50 ms de delaylus en de galm op niet-eindige of absurde waarden en vervangt die dan. Zonder AudioWorklet werkt alleen die meter. In een `OfflineAudioContext` staat de meter uit.

Wat Room met een state doet (getest):
- Getallen buiten het bereik worden afgekapt; een tekst, `null`, `NaN` of een ontbrekende waarde geeft de startwaarde. `sync` die geen boolean is, geeft de startwaarde.
- Onbekende velden worden genegeerd. Zet er geen in.
- Een nieuwe `size` bouwt de galmimpuls opnieuw op (met ruis): twee keer dezelfde state geeft dus niet precies dezelfde galmstaart.

## Controleren

- `node contract/validate-instrument.mjs devices/effects/Room/room.patchkamer-device.js --lang nl` en `--lang en`, vanuit de root. Beide moeten `OK` geven, zonder `let op`.
- Je kunt niet horen hoe een preset klinkt. Heb je geen browser, schrijf dan in je oplevering dat de preset **niet beluisterd** is.
- De teksten staan in het bestand zelf (namen per taal in `MODP`, de overige in `TXT`). Een nieuwe tekst krijgt altijd nl én en.
- De worklet-naam bevat de versie (`nl-patchkamer-room-1-11-0`): de host onthoudt code per naam. Verander je de worklet, verhoog dan de versie in die naam.

## Wat je niet doet

- Verander nooit de `id`, de `kind`, de poort-id's of de namen van state-velden.
- Pas het apparaat niet aan om een preset te laten kloppen.
- Zet geen merknamen van bestaande apparatuur in naam of omschrijving, en verzin geen persoon bij `author`.
- Commit of push niet, tenzij de opdracht dat vraagt.
