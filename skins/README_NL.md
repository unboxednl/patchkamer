# skins

*English version: [README.md](README.md)*

Een skin verandert hoe één apparaat er **uitziet**, zonder het apparaat of zijn geluid te veranderen. Een skin is een klein JSON-bestand met een of meer verschijningsvormen (bijvoorbeeld een compacte en een brede). Elke verschijningsvorm heeft wat CSS voor de interface van het apparaat en, als je wilt, een paar ingesloten afbeeldingen. Op de kaart van een apparaat kies je een skin en een verschijningsvorm; **Auto** wisselt vanzelf op de breedte van de kaart en de grootte van het scherm. Skins staan naast [tunes](../tunes/README_NL.md) en [presets](../presets/README_NL.md) als bibliotheekmateriaal.

Dit is versie 0.4 van het skinscontract (laag 1 en 2, release A en C), bewust klein: het bestandsformaat, de mappen en de manier waarop skins worden geladen en gewisseld liggen vast. Naast CSS kan een skin sinds 0.2 een set ontwerpkeuzes meebrengen (`design`) die op **alle apparaten** werken: poortenmodus, kleurenschema, haptiek en stijl en grootte van de hostknop (tabel hieronder). Sinds 0.3 kan een skin ook het gezicht, de maat en de kleur kiezen van de regelaars die een apparaat aanmeldt (`design.controls`, hieronder). Sinds 0.4 kan ze ook het gezicht en de maat kiezen van meters die een apparaat door de host laat tekenen (`design.meters`: balk, ledladder of een ronde VU-meter met wijzer op dezelfde plek, met instelbare lengte en breedte). Artwork, pads, panelen en een editor zijn er nog niet. De map heeft drie voorbeeldskins voor Duofone, twee voor Filter, twee voor Mixer en een apparaaticoon. Skins van 0.1 tot en met 0.3 blijven gewoon werken.

## Wat erin staat

| Map | Inhoud | Licentie |
|---|---|---|
| [`library/`](library/) | De skins, één map per apparaat-id (bijvoorbeeld `nl.patchkamer.duofone`), met een optionele `icon.*` voor het apparaat | CC0-1.0 |
| [`contract/`](contract/) | Het skinscontract ([Nederlands](contract/SKINS-CONTRACT_NL.md), [Engels](contract/SKINS-CONTRACT_EN.md)) en de validator [`validate-skin.mjs`](contract/validate-skin.mjs) | MIT |

## Zo gebruik je ze

- Laad `github.com/unboxednl/patchkamer` als bibliotheek in Patchkamer: de skins komen mee. Of download een bestand uit een map in `library/` en importeer het in het paneel **Skins**.
- Kies daarna een skin, en een verschijningsvorm, op de kaart van het apparaat.

## Bestandsformaat

Eén skin per bestand, met de naam `naam.patchkamer-skin.json`: JSON met `format` (`patchkamer-skin`), `formatVersion` (1), `skinsContract` (`0.4`, `0.3`, `0.2` of `0.1`), `id`, `device` (de exacte id van het apparaat), `name`, `version`, `author`, `license`, `description`, `created`, `icon`, `default`, een optioneel `design` en een lijst `appearances` (elk met eventueel een eigen `design`). Controleer een skin met `node contract/validate-skin.mjs bestand.patchkamer-skin.json`. Het volledige formaat staat in het [contract](contract/SKINS-CONTRACT_NL.md); regels voor agents die skins schrijven: [AGENTS.md](AGENTS.md).

## Ontwerpkeuzes (`design`)

| Optie | Waarden | Werkt op |
|---|---|---|
| `design.ports.mode` | `default`, `always`, `hover`, `strip` | poortenbalk bovenaan elk apparaat (niet bij `ui.jacks`) |
| `design.colors` | `scheme` `workspace` of `custom` met `bg`, `surface`, `text`, `muted`, `accent`, `line` (`#rgb` of `#rrggbb`) | de kaart en het hostelement van elk apparaat |
| `design.haptics` | `click`, `turn`, `slide`: `off`, `light`, `medium`, `strong` | elke kaart (alleen waar het apparaat of de browser trilt) |
| `design.knobs` | `style` `workspace`, `rotary`, `slider`; `size` `s`, `m`, `l` | alleen `host.ui.knob`-regelaars (korte vorm van `controls`) |
| `design.controls` (0.3) | een lijst regels `{ match, face, size, length, thickness, thumb, color, showValue }`; `match` is `*`, een id, `role:<rol>` of `group:<groep>`; de laatste passende regel wint | de regelaars die een apparaat aanmeldt met id, rol en groep (apparaatcontract v1.15, §12d); een skin verbergt nooit een regelaar |
| `design.meters` (0.4) | een lijst regels `{ match, face, orientation, length, width, ballistics, peakHold, clip, scale, color, segments }`; `match` is `*`, een id of `group:<groep>`; `face` is `bar`, `ledladder`, `vu` of `default`; de laatste passende regel wint | de meters die een apparaat met `host.ui.meter` door de host laat tekenen (apparaatcontract v1.18, §12e); een VU-gezicht vervangt de balk op dezelfde plek; een skin verbergt nooit een meter |

Alle sleutels zijn optioneel; een ontbrekende sleutel laat het apparaat of de werkruimte hun eigen gedrag houden. `design` van een verschijningsvorm overschrijft dat van de skin per sleutel. Zie [`library/nl.patchkamer.duofone/`](library/nl.patchkamer.duofone/) voor `example-back-panel` en `example-touch`, [`library/nl.patchkamer.filter/`](library/nl.patchkamer.filter/) voor `example-controls` en `example-sliders` (design.controls), [`library/nl.patchkamer.mixer/`](library/nl.patchkamer.mixer/) voor `example-meters` en `example-vu` (design.meters), en het [contract](contract/SKINS-CONTRACT_NL.md) (§4b) voor de details. Welke id's, rollen en groepen een apparaat aanbiedt zie je met `node contract/validate-instrument.mjs <apparaat> --controls`; een skin toets je tegen een apparaat met `node skins/contract/validate-skin.mjs <skin> --device <apparaat>`.

## Licentie

De skins in `library/` zijn CC0-1.0 (publiek domein): je mag een skin hergebruiken zonder naamsvermelding. Het contract en de validator in `contract/` zijn MIT. Zie [LICENSING.md](../LICENSING.md).
