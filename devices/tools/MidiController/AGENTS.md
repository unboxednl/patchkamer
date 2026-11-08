# AGENTS.md: MIDI Controller

Dit bestand is voor AI-agents die dit apparaat configureren. Het is niet geschreven voor mensen. Het hoort bij `../../../AGENTS.md` (algemeen); lees die eerst. Hier staat wat alleen voor MIDI Controller geldt.

## Wat MIDI Controller is

Eén apparaat voor alle MIDI-controllers en -keyboards. Het opent alle aangesloten MIDI-ingangen tegelijk, kent per Patchkamer-apparaat zijn eigen koppelingen en bestuurt steeds het **actieve** apparaat. Een knop op een controller (de **schakelknop** van een apparaat) kiest een ander apparaat; dezelfde draaiknoppen werken dan op de koppelingen van dat apparaat. Optioneel zet het gekozen apparaat midden in beeld (`host.show`). Het vervangt MIDI Hub, Control Surface, Pad Controller en Keys / MIDI (die zijn `retired`).

| | |
|---|---|
| Bestand | `midi-controller.patchkamer-device.js` (in deze map) |
| `id` | `nl.patchkamer.midicontroller`. Verander die nooit: daaraan hangen presets en songs van gebruikers |
| Soort | `utility` (categorie `tool`); krijgt dus **presets** en nooit tunes |
| Poorten | geen vaste poorten; per toegevoegd apparaat met een eventingang één eventuitgang `o_<apparaat-id>` (noten van het keyboard naar het actieve apparaat), gezet met `host.setPorts` en gekoppeld met `host.connect` |
| Contract | v1.29 (`host.show` en `host.ai`, beide optioneel gebruikt) |
| Licentie apparaat | AGPL-3.0-or-later |

## Hoe het werkt

- **MIDI.** Web MIDI opent alleen na een klik (`MIDI verbinden`), zonder sysex (dus geen lampjes op de controller). Alle ingangen gaan tegelijk open; `onstatechange` bindt nieuwe ingangen. Berichten: noot aan/uit, CC, pitch bend, kanaaldruk. Een bron is `{ k: 'cc'|'note'|'bend'|'pressure', n, ch }` (`ch` 0 = alle kanalen); de koppeling kijkt niet naar de ingang, zodat een preset op elk apparaat werkt.
- **Apparaten.** `onPeers` geeft de apparaten van de werkruimte; de gebruiker voegt er één toe (`targets[]`: `id`, `def`, `name`, `port`, `sw`, `maps[]`). Het eerste toegevoegde apparaat is actief. `activate(id)` laat de noten van het vorige los (`allnotesoff`), kiest het nieuwe via `host.show(this, id, { select: true, center: state.center })` en leest zijn regelaars (`host.controls`) opnieuw.
- **Schakelknop.** `sw` is de bron (noot aan of CC ≥ 0,5, op de opgaande flank) die dat apparaat actief maakt. Een schakelknop wordt nooit als koppeling of noot doorgegeven. Dit is de tweede actie: kiezen en (optie `center`) centreren.
- **Koppelingen.** Alleen de koppelingen van het **actieve** apparaat reageren (`maps[]`: `src`, `ctl` (de `key` van `host.controls`), `label`, `min`, `max`, `inv`, `toggle`). De waarde gaat via `host.setControl`; een vinkje volgt of wisselt (`toggle`), een knop reageert op de flank. Een `ctl` die niet meer bestaat wordt op dezelfde naam zonder volgnummer gezocht.
- **Snel koppelen.**
  - `Leer indeling` (`surface[]`: bron + `kind` `knob`, `button` of `pad`): de gebruiker raakt elk element één keer aan; een CC met meer dan twee verschillende waarden is een knop of schuif, anders een knop (`button`), een noot is een `pad`.
  - De indeling (`surface`) wordt als rijen getoond: opeenvolgende CC's of noten (hoogstens 8). Per rij kies je draaiknoppen, schuiven, knoppen of pads (`kind`: `knob`, `fader`, `button`, `pad`). Na `Leer indeling` is bij twee of meer CC-rijen van minstens 4 de rij met de hoogste nummers een rij schuiven (gok; wijzigbaar). Een noterij is standaard pads en kun je op knoppen zetten.
  - `Kalibreer bereik`: tijdens dit leren onthoudt het apparaat per schuif of draaiknop (CC) het laagste en hoogste geziene bereik in `surface` (`lo`, `hi`, 0…127). Is het bereik smaller dan 0…127 (minstens 4 breed), dan wordt het bij het ontvangen naar 0…1 geschaald. Zonder kalibratie geen schaling (een korte aanraking bij `Leer indeling` telt niet mee). De rij toont het bereik; × wist het.
  - `AI-voorstel` (alleen zichtbaar als `host.ai` bestaat): na een klik en een bevestiging van de gebruiker (eerste keer per apparaat) gaat een vraag naar de AI-aanbieder uit Instellingen met de regelaars van het actieve apparaat (index, naam, type, bereik) en de rijen van de indeling (bronindex, naam). De AI antwoordt met JSON `{"maps":[{"s":bron,"c":regelaar,"inv":false}]}`. Elk paar wordt gecontroleerd (bestaande index, bron en regelaar nog vrij, draaiknop of schuif alleen op een bereikregelaar, knop alleen op een vinkje of knop, nooit een pad) en daarna toegevoegd; `AI ongedaan` haalt ze met één klik weg. Er gaat geen geluid mee.
  - `Voorstel`: heeft het apparaat kanaalstroken (regelaars met een achtervoegsel ` - T1`, zoals de Mixer), dan is kolom i van de controller strook i en rij r de r-de regelaar van de strook (schuiven op de fader, draaiknoppen op pan, send, hoog, mid, laag, trim, return; knoppen op mute en solo). Anders krijgen de schuiven de niveauregelaars en de draaiknoppen de rest in de volgorde van het apparaat, en de knoppen de vinkjes en knoppen. Pads worden nooit gekoppeld (die spelen noten).
  - `Snel koppelen`: elke nieuwe knop die de gebruiker aanraakt, krijgt de volgende vrije regelaar.
  - `Leer` per rij en `Leer knop` per apparaat zetten één bron.
- **Pads.** Een pad (`kind: 'pad'`) zonder koppeling speelt een noot op het actieve apparaat: een pad dat een noot stuurt speelt die noot, een pad dat een CC stuurt (de gebruiker zet de rij op `pads`) speelt noot 36 + zijn volgnummer. Met `padVel` > 0 is de velocity vast. Bij elke invoer toont `Laatste invoer` de route (koppeling, noot naar apparaat, geen nootingang). De nootingang van een doel is de ingang met id `notes`, `trigger`, `midi` of `in`, anders de eerste; hij wordt bij `onPeers` opnieuw gekozen als hij ontbreekt.
- **Noten.** Met `notes` aan gaan noten (en pitch bend, kanaaldruk en CC's die geen koppeling zijn) van elke ingang naar het actieve apparaat, als `note` met `held: true` en `noteoff` (zoals Keys deed), `cc` `bend`, `pressure`, `vibrato`, `pedal` of `ccN`.
- **Niets uit zichzelf.** Laden, aansluiten en herstellen veranderen niets aan andere apparaten; het apparaat reageert alleen op MIDI en klikken. `host.show` wordt alleen door een schakelknop of een klik aangeroepen.

## De state

| Veld | Wat | Bereik | Start |
|---|---|---|---|
| `targets` | de apparaten met hun schakelknop en koppelingen (hoogstens 24, elk hoogstens 128 koppelingen) | lijst | leeg |
| `active` | id van het actieve apparaat | tekst | eerste toegevoegde |
| `surface` | de geleerde indeling van de controller (hoogstens 256 elementen) | lijst | leeg |
| `center` | het gekozen apparaat midden in beeld zetten | aan/uit | aan |
| `notes` | noten van een keyboard naar het actieve apparaat | aan/uit | aan |
| `padVel` | vaste velocity voor pads die niet op aanslag reageren; 0 = die van de controller | 0 … 127 | 0 |

`setState` negeert onbekende velden, geeft ongeldige waarden de standaard en bindt de kabels opnieuw; kabels en MIDI-toegang staan niet in de state.

## Een preset

`getPreset()` geeft `{ maps: { <apparaat-def>: rijen }, switches: { <apparaat-def>: bron }, surface, center, notes }`; `setPreset` zet bij elk toegevoegd apparaat de rijen en de schakelknop van zijn `def` (of van `'*'`), en vervangt de indeling als die erin staat. Apparaten, kabels en de MIDI-toegang staan niet in een preset. Een preset heet bijvoorbeeld `Acht knoppen > Acid Baselines`. Een pack staat in `../../../presets/` (`midi-controller.patchkamer-presets.json`, `formatVersion` 2, licentie `CC0-1.0`, `device` `nl.patchkamer.midicontroller`, elke preset `kind: "set"`, `version` van het pack `1.0.0`). Geen merknamen van bestaande apparatuur in naam of omschrijving.

## Controleren

- `node contract/validate-instrument.mjs devices/tools/MidiController/midi-controller.patchkamer-device.js` (en met `--lang en`) moet `OK` geven, zonder `let op`.
- Getest met een nagebootste Web MIDI in Chromium: twee ingangen, apparaten toevoegen, schakelknoppen leren, indeling leren, Voorstel, een CC die een regelaar beweegt, schakelen naar een ander apparaat (gekozen en gecentreerd). **Niet getest:** echte MIDI-hardware, een controller die zelf lampjes verwacht (geen sysex), Snel koppelen met hardware, het doorsturen van noten naar een echte synth, en touch.
- Alle tekst staat in `TXT` bovenin het bestand (nl en en); een nieuwe tekst krijgt altijd beide.

## Wat je niet doet

- Verander nooit de `id` of de `kind`, en verwijder geen state-velden: oude werkruimtes en presets hangen eraan.
- Geen merknamen van controllers in naam, id of teksten (uitzondering: de controllerpresets in het pack van Control Surface).
- Geen sysex en geen MIDI-toegang zonder klik.
- Commit of push niet, tenzij de opdracht dat vraagt.

## Documentatie en songs

- Handleiding: [NL](../../../docs/tools/USER-MANUAL_NL.md#midi-controller) · [EN](../../../docs/tools/USER-MANUAL_EN.md#midi-controller).
- Overzicht van de soort: [README](../README.md); handleiding van de hele soort: [NL](../../../docs/tools/USER-MANUAL_NL.md) · [EN](../../../docs/tools/USER-MANUAL_EN.md).
- Overzicht van alle apparaten: [devices/AGENTS.md](../../../devices/AGENTS.md). Een song componeren: [songs/AGENTS.md](../../../songs/AGENTS.md).
- Route voor agents: [soort Tools](../AGENTS.md) → [devices/AGENTS.md](../../AGENTS.md) → [root AGENTS.md](../../../AGENTS.md). Contract: [NL](../../../contract/PATCHKAMER-CONTRACT_NL.md) · [EN](../../../contract/PATCHKAMER-CONTRACT_EN.md). Hoe presets van dit apparaat zijn opgebouwd: [presets/AGENTS.md](../../../presets/AGENTS.md). <!-- agents-tree -->
