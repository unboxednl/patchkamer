# AGENTS.md: MIDI Hub

Dit bestand is voor AI-agents die dit apparaat configureren. Het is niet geschreven voor mensen. Het hoort bij `../../../AGENTS.md` (algemeen); lees die eerst. Hier staat wat alleen voor de MIDI Hub geldt.

## Wat de MIDI Hub is

Een controller tussen MIDI-bronnen en de apparaten in de werkruimte (contract v1.13, §11c). Hij doet drie dingen: (1) de apparaten van de werkruimte zien (`onPeers`) en toevoegen aan zijn actieve apparaten; (2) per apparaat de noten routeren: van het keyboard (poort `in`, met een kanaalfilter) of van een spoor van een sequencer (multi-MIDI-poort `tracks`, met de spoornaam uit `onEventBundle`); (3) elke regelaar op de kaart van een apparaat koppelen aan een knop, schuif, pad of toets (`host.controls` en `host.setControl`), met Leer.

| | |
|---|---|
| Bestand | `midi-hub.patchkamer-device.js` (in deze map) |
| `id` | `nl.patchkamer.midihub`. Verander die nooit: daaraan hangen presets en songs van gebruikers |
| Soort | `utility`; krijgt dus **presets** en nooit tunes |
| Poorten | eventingang `in` (MIDI in), multi-MIDI-ingang `tracks` (Tracks in), en per actief apparaat met een eventingang een eventuitgang `o_<apparaat-id>` (→ naam); geen audio |
| Contract | v1.13 |
| Licentie apparaat | AGPL-3.0-or-later |

## Hoe het werkt

- **Uitgangen.** `syncPorts` zet met `host.setPorts` een eventuitgang per apparaat met een eventingang. De kabel legt de hub met `host.connect` (soort `event`) bij een handeling van de gebruiker (toevoegen, `+ bron`, Opnieuw verbinden); bij het herstellen van een werkruimte legt de host de kabels zelf terug. De hub zet zijn poorten bij `setState` en nog eens bij de eerste `onPeers`, omdat `host.setPorts` pas werkt als de host het apparaat kent.
- **Noten.** Gebeurtenissen op `in`: bij elk doel met een route `Keyboard` (`ch` 0 = alle kanalen) gaan ze door naar de uitgang van dat doel, behalve een `cc` die door een koppeling van dat doel is opgepakt. Gebeurtenissen op `tracks` gaan naar de doelen met een route naar die bundel en dat spoor (`ev.bundle` en `ev.track`).
- **Koppelingen.** Een bron is `cc` (met `ev.cc`), `note`, `bend`, `pressure` of `name` (een cc met alleen een naam). De waarde is 0..1 (cc: `value`, noot: `vel`), omgekeerd en geschaald met `min`/`max`, en gaat via `host.setControl` naar de regelaar. Een vinkje volgt de waarde (aan vanaf 0,5), of wisselt bij `toggle`; een knop wordt bij het stijgen door 0,5 ingedrukt. De regelaar wordt gevonden op sleutel, en anders op dezelfde naam zonder letterverschil (`resolve`), zodat een preset op elk apparaat met een regelaar `Cutoff` werkt.
- **Leer.** Een rij met `src: null` of de knop Leer wacht op de eerstvolgende `cc`, `note` of pitch bend op `in` en neemt die (met zijn kanaal) over.
- **Presets.** `getPreset` geeft `{ maps: { <apparaat-def>: rijen } }`; `setPreset` zet bij elk doel de rijen van zijn `def` of anders van `'*'`. Bronnen en kabels staan niet in een preset. De bibliotheek per apparaatsoort (`library[def][naam] = rijen`) staat in de state van de hub, niet in een preset.
- **Niets uit zichzelf.** Bij laden, aansluiten en herstellen verandert de hub niets aan andere apparaten; hij reageert alleen op binnenkomende gebeurtenissen en op klikken.

## De state

| Veld | Wat |
|---|---|
| `targets[]` | `{ id, def, name, port, linked, routes[], maps[] }`: het apparaat-id (zoals de host het geeft), de definitie, de naam, zijn eventingang, of de hub de kabel legde, de noteroutes en de koppelingen |
| `targets[].routes[]` | `{ src: 'in' \| 'tr', ch: 0…16, key, track }` |
| `targets[].maps[]` | `{ src: { k: 'cc' \| 'note' \| 'bend' \| 'pressure' \| 'name', n, id, ch } \| null, ctl, label, min, max, inv, toggle }` |
| `library` | `{ <apparaat-def>: { <naam>: rijen } }` |

## Wat je niet kunt testen zonder hardware

Web MIDI en echte keyboards zijn niet getest. Test met een testapparaat dat `cc`-, noot- en `ch`-gebeurtenissen stuurt (zie het testscript in de scratchpad van de sessie), en met de sequencers die de multi-MIDI-poort hebben.

## Presets

Het pack `../../../presets/midi-hub.patchkamer-presets.json` (formatVersion 2, CC0-1.0, namen Engels) heeft 15 presets in vier mappen: Sound Controllers, Wheels and Pedals, Effects en Utility. Elke preset gebruikt de sleutel `'*'`: hij geldt voor elk apparaat in de hub en zoekt de regelaars op hun naam.

## Documentatie en songs

Dit zijn de plaatsen waar je terechtkunt voor documentatie en voor het componeren van songs met dit apparaat. Songs zijn CC-BY-4.0, tunes en presets CC0-1.0, het apparaat AGPL-3.0-or-later.

- Handleiding van MIDI Hub: [NL](../../../docs/tools/USER-MANUAL_NL.md#midi-hub) · [EN](../../../docs/tools/USER-MANUAL_EN.md#midi-hub).
- Overzicht van de soort: [README](../README.md); handleiding van de hele soort: [NL](../../../docs/tools/USER-MANUAL_NL.md) · [EN](../../../docs/tools/USER-MANUAL_EN.md).
- Presets (instellingen, `kind: set`): [midi-hub.patchkamer-presets.json](../../../presets/midi-hub.patchkamer-presets.json). Kies een preset als beginpunt voor de `state` van dit apparaat in de song; velden die de preset niet noemt krijgen hun standaard.
- Overzicht van alle apparaten en hun signaalketens: [devices/AGENTS.md](../../../devices/AGENTS.md). Een song componeren: [songs/AGENTS.md](../../../songs/AGENTS.md).
- Rol in een song: koppelt MIDI-bronnen (`in`, `tracks`) aan de apparaten van de werkruimte; per apparaat met een eventingang komt er een eventuitgang `o_<apparaat-id>`. Vooral nuttig bij live MIDI; in een song met vaste kabels zelden nodig.
