# AGENTS.md: Control Surface

Dit bestand is voor AI-agents die dit apparaat configureren. Het is niet geschreven voor mensen. Het hoort bij `../../../AGENTS.md` (algemeen); lees die eerst. Hier staat wat alleen voor de Control Surface geldt.

## Wat de Control Surface is

Een paneel voor een MIDI-controller met draaiknoppen, schuiven, pads en knoppen, zonder klavier. Het toont de controller en beweegt mee met de hardware, en stuurt elk element door als `cc`-gebeurtenis met `id` (het slot), `slot` (de naam), `cc` en `ch`. Geen merknamen of modelnamen van controllers in naam, id of teksten van het apparaat. Uitzondering: de presets in de map `Controllers` van het pack mogen de naam van de controller dragen (zie Presets).

| | |
|---|---|
| Bestand | `control-surface.patchkamer-device.js` (in deze map) |
| `id` | `nl.patchkamer.controlsurface`. Verander die nooit: daaraan hangen presets en songs van gebruikers |
| Soort | `utility`; krijgt dus **presets** (`../../../presets/control-surface.patchkamer-presets.json`) en nooit tunes |
| Poorten | één eventuitgang `out` (CC out); geen ingangen |
| Contract | v1.13 |
| Licentie apparaat | AGPL-3.0-or-later |

## De indeling

`sections` is een lijst van ten hoogste 8 secties `{ type: 'knob' | 'fader' | 'pad' | 'button', rows: 1…8, cols: 1…16, band: 0…7 }`, samen ten hoogste 256 elementen (`normSections`). Secties in dezelfde `band` staan naast elkaar, banden staan onder elkaar. Een element heeft het id `<k|f|p|b><sectie>.<rij>.<kolom>` (sectienummer vanaf 1). Het id hangt dus af van de plaats van de sectie: een sectie verwijderen hernummert de secties erna en daarmee hun toewijzingen. De standaardnaam is `Knob 2.3` (of `Knob A 2.3` als er meer dan één sectie van die soort is; bij één rij alleen het kolomnummer).

## Toewijzen en doorsturen

- `assign[id] = { kind: 'cc' | 'note', n, ch, name }`. Leer neemt het eerstvolgende CC- of note-on-bericht op de gekozen ingang over (en haalt dezelfde bron bij een ander element weg). Leer alles loopt de elementen in volgorde langs en blijft aan tot je stopt.
- Een binnenkomend bericht met een toewijzing beweegt het element en gaat door als `{ type: 'cc', id: <slot-id>, slot: <naam>, value: 0…1, cc?, ch? }`. Zonder toewijzing gaat het door als `{ id: 'cc<n>', cc, ch, value }` (of `note<n>` voor een noot), zodat de MIDI Hub het toch kan koppelen. Noten van pads en knoppen komen als `cc`-waarde 0 of 1 (pads: de velocity).
- Het apparaat opent MIDI alleen na een klik (`MIDI verbinden`) en zonder sysex; het kan de lampjes van een controller dus niet sturen.
- Met de muis: een knop of schuif is te slepen, pads en knoppen reageren op een klik (kort ingedrukt). Dat stuurt dezelfde gebeurtenissen.

## De state

| Veld | Wat |
|---|---|
| `sections` | zie hierboven; standaard 3 rijen van 8 draaiknoppen, 1 rij van 8 schuiven, 2 rijen van 8 knoppen |
| `input` | `deviceId` van de MIDI-ingang, of `all` |
| `channel` | 0 = alle kanalen, 1…16 |
| `assign` | de toewijzingen per element-id |

`getPreset` geeft `sections`, `channel` en, als er toewijzingen zijn, `assign`; `setPreset` zet de indeling en de toewijzingen uit de preset (heeft de preset er geen, dan worden ze gewist, want ze horen bij de oude vorm) en laat `input` staan. Zo is een preset indeling plus MIDI-mapping (sinds 1.14.0).

## Wat getest is en wat niet

Met een nep-Web MIDI in Chromium (twee nep-ingangen): verbinden, ingang kiezen, Leer alles, een element een naam geven, het paneel dat meebeweegt, doorsturen naar de MIDI Hub (die de naam van het element toont) en een CC die de cutoff van een testapparaat beweegt; een bericht op een niet gekozen ingang wordt genegeerd. Echte controllers en Web MIDI in een echte browser zijn niet getest.

## Presets

`../../../presets/control-surface.patchkamer-presets.json` (formatVersion 2, CC0-1.0, namen Engels) heeft 28 presets in vijf mappen: Controllers, Strips, Faders, Knobs en Pads.

- **Strips, Faders, Knobs, Pads:** alleen een vorm (`sections` en `channel`), zonder merknamen; noem de vorm.
- **Controllers:** indeling plus `assign` voor bestaande MIDI-controllers; de presetnaam noemt het model (uitzondering op de merkregel, zie `CLAUDE.md`). Pad-elementen tellen vanaf de bovenste rij, dus de pad linksonder van een 8×8-raster is `p<sectie>.8.1`. Een toewijzing komt er alleen in als het nummer uit openbare documentatie komt; **getest met echte hardware is niets**, behalve dat de preset laadt en het juiste aantal toewijzingen zet. Kloppen de nummers niet met een ander model of een andere stand van de controller, dan corrigeert de gebruiker dat met Leer en bewaart hij een eigen preset.
  - `Traktor Kontrol F1`: alleen indeling. De nummers bepaalt de gebruiker zelf in de Controller Editor van de fabrikant (de F1 is een HID-apparaat dat daarmee MIDI gaat sturen).
  - `Ableton Push 2 and 3`: pads noot 36 + 8·(rij van onder) + kolom (36 … 99), acht draaiknoppen CC 71 … 78 (relatief), gebruikersmodus.
  - `Akai APC mini`: pads noot 0 … 63 (linksonder 0), schuiven CC 48 … 56. `Akai APC mini MK2`: idem plus de onderste rij knoppen noot 100 … 107.
  - `Novation Launchpad Mini MK3 Programmer Mode`: pad = 11 + 10·(rij van onder) + kolom, bovenste knoppen CC 91 … 98, rechterknoppen CC 89 … 19.
  - `Novation Launch Control XL User Template 1`: draaiknoppen CC 13 … 20, 29 … 36, 49 … 56, schuiven CC 77 … 84.
  - `Akai MPK mini MK3`: acht draaiknoppen CC 70 … 77; de pads staan niet vast en blijven onbewaard (Leer).
  - `Generic 8 Knobs Sound Controllers CC 70-77`: de geluidsregelaars uit de MIDI-specificatie.
- Wil je een controller toevoegen: bouw de indeling uit secties, leer of vul de toewijzingen, bewaar het als preset en zet hem in de map `Controllers`. Zonder bron voor de nummers: alleen de indeling.
