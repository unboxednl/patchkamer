# AGENTS.md: Speakers

Dit bestand is voor AI-agents die dit apparaat configureren. Het is niet geschreven voor mensen. Het hoort bij `../../../AGENTS.md` (algemeen); lees die eerst. Hier staat wat alleen voor Speakers geldt.

## Wat Speakers is

De uitgang van de studio: het geluid gaat naar de luidsprekers van de computer, via een begrenzer en met een uitsteekmeter. Er is één regelaar: het volume.

| | |
|---|---|
| Bestand | `speakers.patchkamer-device.js` (in deze map) |
| `id` | `nl.patchkamer.speakers`. Verander die nooit: daaraan hangen presets en songs van gebruikers |
| Soort | `output` |
| Poorten | één audio-ingang (`in`); geen uitgangen |
| Contract | v1.11 |
| Licentie apparaat | AGPL-3.0-or-later |

## Geen tunes, wel presets

Alleen apparaten met `kind: 'instrument'` hebben tunes. Speakers is een `output`, dus het krijgt **presets** en **nooit tunes** (contract §0 en §13c). Maak voor Speakers dus geen pack in `../../../tunes/`.

Eerlijk gezegd is een presetbibliotheek hier bijna overbodig: er is één instelling en die is een persoonlijke voorkeur. Maak alleen presets voor Speakers als de opdracht dat uitdrukkelijk vraagt.

## De state

Er is één veld.

| Veld | Wat | Bereik | Start |
|---|---|---|---|
| `lvl` | Volume | 0 … 1 (een getal) | 0,8 |

Wat Speakers met een state doet (getest):
- `lvl` buiten het bereik wordt afgekapt (5 wordt 1, −2 wordt 0). Een veel te hoog volume is dus niet mogelijk.
- `lvl` als tekst (`"0.3"`) of een ontbrekende `lvl` geeft de startwaarde 0,8.
- Onbekende velden worden genegeerd en komen niet in de state terecht. Zet er geen in.

Het volume gaat zacht over (geen knak als een preset tijdens het spelen wordt gekozen). Achter het volume staat een begrenzer (drempel −3 dB, verhouding 12:1): hard klinkt het niet harder dan dat, maar zet `lvl` voor een preset toch niet boven 0,9.

## Een preset

Een pack heet `naam.patchkamer-presets.json` en staat in `../../../presets/`. Het formaat is dat van het contract (§13c); alles in `presets/` heeft licentie `CC0-1.0`. Voor Speakers is `device` altijd `nl.patchkamer.speakers`, elke preset is `kind: "set"` en `state` bevat alleen `lvl`.

```json
{
  "format": "patchkamer-presets",
  "formatVersion": 2,
  "device": "nl.patchkamer.speakers",
  "name": "Speakers volumes",
  "author": "<naam van de maker>",
  "license": "CC0-1.0",
  "description": "<korte omschrijving>",
  "tree": [
    { "name": "Zacht", "kind": "set", "version": "1.0.0", "state": { "lvl": 0.5 } },
    { "name": "Normaal", "kind": "set", "version": "1.0.0", "state": { "lvl": 0.8 } }
  ]
}
```

Zet geen merknamen van bestaande apparatuur in naam of omschrijving, en verzin geen persoon bij `author`.

## Controleren

Er is geen controlescript voor presets. Draai vanuit de root van de repo (vervang het pad):

```
node -e "const p=JSON.parse(require('fs').readFileSync(process.argv[1],'utf8')); const items=[]; const w=l=>(l||[]).forEach(x=>x.folder?w(x.items):items.push(x)); w(p.tree); const bad=[]; if(p.device!=='nl.patchkamer.speakers')bad.push('device'); if(p.format!=='patchkamer-presets'||p.formatVersion!==2)bad.push('format/formatVersion'); if(p.license!=='CC0-1.0')bad.push('license'); if(!items.length)bad.push('geen presets'); for(const i of items){ if(i.kind!=='set')bad.push(i.name+': kind'); const l=i.state&&i.state.lvl; if(typeof l!=='number'||l<0||l>1)bad.push(i.name+': lvl moet een getal van 0 tot 1 zijn'); if(Object.keys(i.state||{}).join()!=='lvl')bad.push(i.name+': state heeft alleen lvl'); } console.log(bad.length?'FOUT: '+bad.join('; '):'OK '+items.length+' preset(s)'); process.exit(bad.length?1:0)" presets/<pack>.patchkamer-presets.json
```

Dit moet eindigen op een `OK`-regel (exit 0). Het kan niet horen hoe het klinkt. Heb je een browser, laad dan de host (`../../../patchkamer/AGENTS.md`) en kies de preset. Heb je geen browser, schrijf dan in je oplevering dat de preset **niet getest** is in de host.

## Wat je niet doet

- Pas `speakers.patchkamer-device.js` niet aan om een preset te laten kloppen, en verander nooit de `id` of de `kind`.
- Commit of push niet, tenzij de opdracht dat vraagt.
