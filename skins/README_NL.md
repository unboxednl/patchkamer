# skins

*English version: [README.md](README.md)*

Een skin verandert hoe één apparaat er **uitziet**, zonder het apparaat of zijn geluid te veranderen. Een skin is een klein JSON-bestand met een of meer verschijningsvormen (bijvoorbeeld een compacte en een brede). Elke verschijningsvorm heeft wat CSS voor de interface van het apparaat en, als je wilt, een paar ingesloten afbeeldingen. Op de kaart van een apparaat kies je een skin en een verschijningsvorm; **Auto** wisselt vanzelf op de breedte van de kaart en de grootte van het scherm. Skins staan naast [tunes](../tunes/README_NL.md) en [presets](../presets/README_NL.md) als bibliotheekmateriaal.

Dit is versie 0.2 van het skinscontract (laag 1), bewust klein: het bestandsformaat, de mappen en de manier waarop skins worden geladen en gewisseld liggen vast. Naast CSS kan een skin sinds 0.2 een set ontwerpkeuzes meebrengen (`design`) die op **alle apparaten** werken: poortenmodus, kleurenschema, haptiek en stijl en grootte van de hostknop (tabel hieronder). Artwork, regelaargrafiek, indelingen en een editor (laag 2 en 3) zijn er nog niet. De map heeft drie voorbeeldskins voor Duofone en een apparaaticoon. Skins van 0.1 blijven gewoon werken.

## Wat erin staat

| Map | Inhoud | Licentie |
|---|---|---|
| [`library/`](library/) | De skins, één map per apparaat-id (bijvoorbeeld `nl.patchkamer.duofone`), met een optionele `icon.*` voor het apparaat | CC0-1.0 |
| [`contract/`](contract/) | Het skinscontract ([Nederlands](contract/SKINS-CONTRACT_NL.md), [Engels](contract/SKINS-CONTRACT_EN.md)) en de validator [`validate-skin.mjs`](contract/validate-skin.mjs) | MIT |

## Zo gebruik je ze

- Laad `github.com/unboxednl/patchkamer` als bibliotheek in Patchkamer: de skins komen mee. Of download een bestand uit een map in `library/` en importeer het in het paneel **Skins**.
- Kies daarna een skin, en een verschijningsvorm, op de kaart van het apparaat.

## Bestandsformaat

Eén skin per bestand, met de naam `naam.patchkamer-skin.json`: JSON met `format` (`patchkamer-skin`), `formatVersion` (1), `skinsContract` (`0.2`, of `0.1`), `id`, `device` (de exacte id van het apparaat), `name`, `version`, `author`, `license`, `description`, `created`, `icon`, `default`, een optioneel `design` en een lijst `appearances` (elk met eventueel een eigen `design`). Controleer een skin met `node contract/validate-skin.mjs bestand.patchkamer-skin.json`. Het volledige formaat staat in het [contract](contract/SKINS-CONTRACT_NL.md); regels voor agents die skins schrijven: [AGENTS.md](AGENTS.md).

## Ontwerpkeuzes (`design`)

| Optie | Waarden | Werkt op |
|---|---|---|
| `design.ports.mode` | `default`, `always`, `hover`, `strip` | poortenbalk bovenaan elk apparaat (niet bij `ui.jacks`) |
| `design.colors` | `scheme` `workspace` of `custom` met `bg`, `surface`, `text`, `muted`, `accent`, `line` (`#rgb` of `#rrggbb`) | de kaart en het hostelement van elk apparaat |
| `design.haptics` | `click`, `turn`, `slide`: `off`, `light`, `medium`, `strong` | elke kaart (alleen waar het apparaat of de browser trilt) |
| `design.knobs` | `style` `workspace`, `rotary`, `slider`; `size` `s`, `m`, `l` | alleen `host.ui.knob`-regelaars |

Alle sleutels zijn optioneel; een ontbrekende sleutel laat het apparaat of de werkruimte hun eigen gedrag houden. `design` van een verschijningsvorm overschrijft dat van de skin per sleutel. Zie [`library/nl.patchkamer.duofone/`](library/nl.patchkamer.duofone/) voor `example-back-panel` en `example-touch`, en het [contract](contract/SKINS-CONTRACT_NL.md) (§4b) voor de details.

## Licentie

De skins in `library/` zijn CC0-1.0 (publiek domein): je mag een skin hergebruiken zonder naamsvermelding. Het contract en de validator in `contract/` zijn MIT. Zie [LICENSING.md](../LICENSING.md).
