# AGENTS.md: Pad Controller

Dit bestand is voor AI-agents die dit apparaat configureren of er presets voor maken. Het is niet geschreven voor mensen. Het hoort bij `../../../AGENTS.md` (algemeen); lees die eerst. Hier staat wat alleen voor Pad Controller geldt.

## Wat Pad Controller is

Een besturingsapparaat zonder eigen geluid voor een MIDI-controller met een raster van 8 × 5 pads, een rij knoppen en een toetsenbord. Je koppelt een apparaat aan een pad en Patchkamer legt zelf de kabels (een gebeurteniskabel van `Pad N` naar de noten- of triggeringang, en een paarse kabel van `Knoppen` naar `Mod`). Met Shift + pad kies je welk apparaat je bespeelt; de toetsen sturen noten naar dat apparaat. De pads lichten op in de kleur van de categorie van hun apparaat; het gekozen pad pulseert. De knoppen worden alleen getoond; ze sturen nog geen parameters (stap 2, nog niet gebouwd).

| | |
|---|---|
| Bestand | `pad-controller.patchkamer-device.js` (in deze map) |
| `id` | `nl.patchkamer.padcontroller`. Verander die nooit: daaraan hangen songs van gebruikers |
| Naam | `Pad Controller` in alle talen; alleen de poortnamen `MIDI (raw)` en `Buttons` hebben een Nederlandse variant (via `i18n`) |
| Soort | `utility` (categorie `tool`): Pad Controller krijgt dus **presets** (geen tunes) |
| Poorten | event-ingang `midi` (ruwe berichten), 40 event-uitgangen `pad1` … `pad40`, sturing-uitgang `knoppen`; geen audio |
| Contract | v1.11 (besturing: `host.peers`, `host.connect`, `host.disconnect`, `host.cablesFrom`) |
| Licentie apparaat | AGPL-3.0-or-later |

Dit apparaat is de nieuwe, bijgewerkte vorm van een ouder bestand met een andere naam en id. Songs uit die tijd verwijzen naar de oude id en laden hier niet in.

## De verwachte indeling van de controller

Pad Controller kent geen MIDI-controller bij naam. Het verwacht deze berichten; heeft jouw controller een andere indeling, dan werkt de koppeling niet.

| Wat | Bericht |
|---|---|
| Pad N (1 … 40, linksonder = 1, rijen omhoog) | noot-aan met nootnummer N − 1 (0 … 39) op de padpoort |
| Shift | nootnummer 98 (aan = ingedrukt, uit = losgelaten) |
| Acht knoppen | CC 48 … 55, relatief: waarde boven 64 telt als negatief (waarde − 128) |
| Overige knoppen (alleen om de poortrol te leren) | noten 64 … 71, 81 … 86, 91 en 93 |
| Toetsen (gespeeld op het bespeelde apparaat) | gewone noot-aan en noot-uit, op een andere ingang of dezelfde met de rol `toetsen` |
| Lampjes (uitgang) | noot-aan met het nootnummer van de pad; kanaal 1 = uit, kanaal 3 = vast, kanaal 10 = pulserend; de snelheid is het kleurnummer. Kleurnummers per categorie: synth 9, groove 5, sequencer 13, mod 49, effect 37, mix 45, tool 3, other 21 |

Web MIDI wordt pas gevraagd na een klik op **Verbind met MIDI** (**Connect MIDI**), zonder sysex.

## Wat de gebruiker zelf kiest

Het apparaat herkent zijn controller **niet** meer aan de naam van de MIDI-poort. De gebruiker kiest zelf:
- per MIDI-ingang een rol: `toetsen` (`keys`), `pads + knoppen` (`ctrl`) of `negeren` (`off`). Zolang er niets gekozen is, geldt `toetsen`; een ingang waarop een knop-CC of knopnoot binnenkomt (zie de tabel) wordt automatisch als `pads + knoppen` aangemerkt. Een padaanslag alleen zet de rol niet om: kies de rol dus zelf voordat je pads indrukt, anders worden ze als noten gespeeld.
- de uitgang voor de lampjes (`lampjes naar` / `LEDs to`). Standaard is dat geen: de lampjes blijven uit.

## Geen tunes, wel presets

Alleen apparaten met `kind: 'instrument'` hebben tunes. Pad Controller is een `utility`, dus het krijgt **presets** en **nooit tunes** (contract §0 en §13c). Maak hiervoor geen pack in `../../../tunes/`. Maak alleen presets als de opdracht dat uitdrukkelijk vraagt; het enige veld in een preset is `timing`, want koppelingen, rollen en poortkeuze zijn routing en horen er niet in.

## De state en de preset

| Veld | Wat | Bereik | Start | In preset |
|---|---|---|---|---|
| `slots` | Per pad (sleutel `"1"` … `"40"`) het gekoppelde apparaat: `{ target, port }` met `target` het apparaat-id en `port` de gebruikte ingang | object | `{}` | nee |
| `active` | Het pad dat je bespeelt (0 = geen) | geheel getal 0 … 40 | 0 | nee |
| `outName` | Naam van de MIDI-uitgang voor de lampjes (leeg = geen) | tekst | `""` | nee |
| `roles` | Rol per MIDI-ingang, op naam: `keys`, `ctrl` of `off` | object | `{}` | nee |
| `timing` | `strak` (vaste vertraging van 12 ms vanaf de tijdstempel van het bericht) of `direct` (zo snel mogelijk) | `strak` of `direct` | `strak` | ja |

Wat Pad Controller met een state doet (getest):
- Onbekende velden worden genegeerd; een ongeldige waarde geeft de standaard. Een `active` buiten 0 … 40 wordt afgekapt, een niet-numerieke `active` geeft 0.
- Alleen padsleutels die een geheel getal 1 … 40 zijn en waarvan `target` een tekst is, blijven staan; een ongeldige `port` wordt een lege tekst. Een rol die geen `keys`, `ctrl` of `off` is, vervalt.
- `setState` legt geen kabels: de werkruimte bewaart de kabels zelf. Staat een kabel er niet (meer), dan toont het pad "kabel los".
- `setPreset({})` verandert niets; een preset raakt koppelingen, rollen, `outName` en het gekozen pad niet aan.

## Controleren

- `node contract/validate-instrument.mjs devices/tools/PadController/pad-controller.patchkamer-device.js --lang nl` en `--lang en`, vanuit de root. Beide moeten `OK` geven, zonder `let op`.
- De validator en de tests kunnen geen echte MIDI-hardware gebruiken. Het apparaat is getest met nep-MIDI-berichten (een stub voor `navigator.requestMIDIAccess`); schrijf in je oplevering dat het **niet met een echte controller** is getest.
- De UI is gewone DOM (geen shadow root), omdat de pad-aansluitingen (`host.ui.jack`) in de kaart zelf moeten staan. Alle tekst staat in het woordenboek `EN` bovenin het bestand (Nederlandse bron, Engels via `host.lang`). Een nieuwe tekst krijgt altijd nl én en.
- Het apparaat tekent niet zelf per frame; er is geen `requestAnimationFrame`. Houd dat zo.

## Wat je niet doet

- Verander nooit de `id`, de `kind`, de poort-id's (`midi`, `pad1` … `pad40`, `knoppen`) of de namen van state-velden.
- Zet geen merknamen of modelnamen van bestaande apparatuur in naam, omschrijving, commentaar of tekst, ook niet in een regel die een MIDI-poort aan zijn naam herkent.
- Leg geen kabels buiten de koppeling om en laat het apparaat nooit kabels van anderen losmaken: alleen eigen uitgangen.
- Commit of push niet, tenzij de opdracht dat vraagt.

## Documentatie en songs

Dit zijn de plaatsen waar je terechtkunt voor documentatie en voor het componeren van songs met dit apparaat. Songs zijn CC-BY-4.0, tunes en presets CC0-1.0, het apparaat AGPL-3.0-or-later.

- Handleiding van Pad Controller: [NL](../../../docs/tools/USER-MANUAL_NL.md#pad-controller) · [EN](../../../docs/tools/USER-MANUAL_EN.md#pad-controller).
- Overzicht van de soort: [README](../README.md); handleiding van de hele soort: [NL](../../../docs/tools/USER-MANUAL_NL.md) · [EN](../../../docs/tools/USER-MANUAL_EN.md).
- Overzicht van alle apparaten en hun signaalketens: [devices/AGENTS.md](../../../devices/AGENTS.md). Een song componeren: [songs/AGENTS.md](../../../songs/AGENTS.md).
- Rol in een song: besturing met een MIDI-pad-controller (8 × 5 pads, knoppen, toetsenbord); legt zelf kabels naar gekoppelde apparaten (events `pad1` … `pad40`, sturing `knoppen`). Voor live spelen; in een song met vaste kabels zelden nodig.
