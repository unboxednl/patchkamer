# AGENTS.md: Metronome

Dit bestand is voor AI-agents die dit apparaat configureren of er presets voor maken. Het is niet geschreven voor mensen. Het hoort bij `../../../AGENTS.md` (algemeen); lees die eerst. Hier staat wat alleen voor Metronome geldt.

## Wat Metronome is

Een metronoom: een korte tik op elke maat, tel, achtste of zestiende van de klok van de studio. Dezelfde slagen gaan als `trig`-gebeurtenissen (lane `klik`) naar de uitgang `Trigs`, zodat je er een drumcomputer of sampler mee kunt laten meespelen. De tik zelf (sinus, 1000 Hz, op de eerste stap van de maat 1600 Hz en luider) komt uit de audio-uitgang. Het verschil met `Click Synth` (de drumcomputer in `devices/drums`): Metronome speelt alleen een vaste tik en is een hulpmiddel, Click Synth is een klankbron met patronen.

| | |
|---|---|
| Bestand | `metronome.patchkamer-device.js` (in deze map) |
| `id` | `nl.patchkamer.klik`. Bewust gelijk aan de naam waaronder het apparaat eerst heette (`nl.voorbeeld.klik` was het oude voorbeeld-id; `klik` is Nederlands maar blijft als id op verzoek van Freek). Verander die nooit: daaraan hangen presets en songs |
| Naam | `Metronome` in alle talen; de poortnaam `Out` heet in het Nederlands `Uit` (via `i18n`) |
| Soort | `utility` (categorie `tool`): dit apparaat krijgt dus **presets** en nooit tunes (contract §0 en §13c). Het had eerst `kind: 'instrument'`; daarom hangen er geen oude tunes aan |
| Poorten | audio-uitgang `out`, eventuitgang `trigs`; geen ingangen |
| Contract | v1.11 |
| Licentie apparaat | AGPL-3.0-or-later |

## De state

`getState()` is de preset (geen `getPreset`).

| Veld | Wat | Bereik | Start |
|---|---|---|---|
| `div` | Elke hoeveel zestiende noten een tik klinkt: 16 = maat, 4 = tel, 2 = achtste, 1 = zestiende | 16, 4, 2 of 1 | 4 |
| `lvl` | Niveau van de audio-uitgang | 0 … 1 | 0,5 |

Een andere waarde, `NaN`, tekst of `null` geeft de startwaarde (`div`) of wordt afgekapt (`lvl`). `setState({})` geeft de startwaarden. De kaart volgt: de keuze en de schuif bewegen mee.

## Wat het uitstuurt

Bij elke zestiende noot waarvan het stapnummer (0 … 15 in de maat) een veelvoud van `div` is: een tik op `time` en `{ type: 'trig', lane: 'klik', vel, time }` met `vel` 1 op stap 0 (maatbegin, ook als `div` 16 is) en 0,7 op de andere. Alleen een eindige `time` en een geheel stapnummer worden verwerkt; anders gebeurt er niets.

## Presets

Een preset is `{ "div": 4, "lvl": 0.5 }`. Zinvolle presets: een zachte maattik om bij te spelen, kwarten als oefenklik, achtsten of zestienden voor trage tempo's, en een luide klik voor een podium. Geen `div` anders dan 16, 4, 2, 1. Het pack staat in `../../../presets/metronome.patchkamer-presets.json`.

## Wat het apparaat met een state doet (getest)

- Oud en nieuw bestand gaven bij 120 willekeurige instellingen en twee maten klok dezelfde audio (0 afwijkende samples in de offline render) en dezelfde gebeurtenissen (1330 stuks).
- Bewust anders dan het oude bestand: ongeldige `div`/`lvl` in `setState` vallen terug op de standaard of worden afgekapt (het oude bestand nam alles over), en `onStep` negeert niet-eindige tijden.
- Niet beluisterd.

## Controleren

- `node contract/validate-instrument.mjs devices/tools/Metronome/metronome.patchkamer-device.js --lang nl` en `--lang en`, vanuit de root: beide `OK`, zonder `let op`.

## Wat je niet doet

- Verander nooit de `id`, de `kind` of de poort-id's. Zet geen merknamen in naam of omschrijving.
- Geen tunes. Commit of push niet, tenzij de opdracht dat vraagt.
