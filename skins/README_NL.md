# skins

*English version: [README.md](README.md)*

Een skin verandert hoe één apparaat er **uitziet**, zonder het apparaat of zijn geluid te veranderen. Een skin is een klein JSON-bestand met een of meer verschijningsvormen (bijvoorbeeld een compacte en een brede). Elke verschijningsvorm heeft wat CSS voor de interface van het apparaat en, als je wilt, een paar ingesloten afbeeldingen. Op de kaart van een apparaat kies je een skin en een verschijningsvorm; **Auto** wisselt vanzelf op de breedte van de kaart en de grootte van het scherm. Skins staan naast [tunes](../tunes/README_NL.md) en [presets](../presets/README_NL.md) als bibliotheekmateriaal.

Dit is versie 0.8 van het skinscontract (laag 1 en 2, release A, C, B1, D en B2), bewust klein: het bestandsformaat, de mappen en de manier waarop skins worden geladen en gewisseld liggen vast. Naast CSS kan een skin sinds 0.2 een set ontwerpkeuzes meebrengen (`design`) die op **alle apparaten** werken: poortenmodus, kleurenschema, haptiek en stijl en grootte van de hostknop (tabel hieronder). Sinds 0.3 kan een skin ook het gezicht, de maat en de kleur kiezen van de regelaars die een apparaat aanmeldt (`design.controls`, hieronder). Sinds 0.4 kan ze ook het gezicht en de maat kiezen van meters die een apparaat door de host laat tekenen (`design.meters`: balk, ledladder of een ronde VU-meter met wijzer op dezelfde plek, met instelbare lengte en breedte). Sinds 0.5 kan ze ook de groepen regelaars van een apparaat als secties opmaken (`design.sections`: kader, kolommen, tussenruimte, kale regelaars, label eronder) en een verschijningsvorm een kaartbreedte geven (`design.size`). Sinds 0.6 kan ze ook vorm, maat, kleur en feedback van pads en stappen kiezen (`design.pads`) en keuzelijsten als schermpje tonen met < > en [ok] (`design.display`). Sinds 0.7 kan ze ook de regelaars van een apparaat in panelen en een volgorde zetten (`design.layout`: stroom, panelen met items op id, rol of groep, kader, kolommen, inklapbaar; er wordt nooit iets verborgen, wat niet genoemd wordt komt in een restpaneel). Artwork en een editor zijn er nog niet. De map heeft vier voorbeeldskins voor Duofone, drie voor Filter, twee voor Mixer, drie voor Drum Machine en een apparaaticoon. Skins van 0.1 tot en met 0.6 blijven gewoon werken.

**De skin-editor.** Je hoeft een skin niet met de hand te schrijven: in Patchkamer (tab Skins, knop *Skin-editor*) kun je een skin ontwerpen met een live voorbeeld op een echte kaart van het apparaat, en opslaan of exporteren als `*.patchkamer-skin.json`. De editor schrijft bestaande skins (skinscontract 0.7 of lager), dus de formaten hieronder blijven gelden. Een geëxporteerde skin bevat `author`, `license` (standaard `CC0-1.0`), `description` en `icon` zodra je die invult; de validator eist ze voor de bibliotheek.

## Wat erin staat

| Map | Inhoud | Licentie |
|---|---|---|
| [`library/`](library/) | De skins, één map per apparaat-id (bijvoorbeeld `nl.patchkamer.duofone`), met een optionele `icon.*` voor het apparaat | CC0-1.0 |
| [`contract/`](contract/) | Het skinscontract ([Nederlands](contract/SKINS-CONTRACT_NL.md), [Engels](contract/SKINS-CONTRACT_EN.md)) en de validator [`validate-skin.mjs`](contract/validate-skin.mjs) | MIT |

## Zo gebruik je ze

- Laad `github.com/unboxednl/patchkamer` als bibliotheek in Patchkamer: de skins komen mee. Of download een bestand uit een map in `library/` en importeer het in het paneel **Skins**.
- Kies daarna een skin, en een verschijningsvorm, op de kaart van het apparaat.

## Bestandsformaat

Eén skin per bestand, met de naam `naam.patchkamer-skin.json`: JSON met `format` (`patchkamer-skin`), `formatVersion` (1), `skinsContract` (`0.8`, `0.7`, `0.6`, `0.5`, `0.4`, `0.3`, `0.2` of `0.1`), `id`, `device` (de exacte id van het apparaat), `name`, `version`, `author`, `license`, `description`, `created`, `icon`, `default`, een optioneel `design` en een lijst `appearances` (elk met eventueel een eigen `design`). Controleer een skin met `node contract/validate-skin.mjs bestand.patchkamer-skin.json`. Het volledige formaat staat in het [contract](contract/SKINS-CONTRACT_NL.md); regels voor agents die skins schrijven: [AGENTS.md](AGENTS.md).

## Ontwerpkeuzes (`design`)

| Optie | Waarden | Werkt op |
|---|---|---|
| `design.ports.mode` | `default`, `always`, `hover`, `strip` | poortenbalk bovenaan elk apparaat (niet bij `ui.jacks`) |
| `design.colors` | `scheme` `workspace` of `custom` met `bg`, `surface`, `text`, `muted`, `accent`, `line` (`#rgb` of `#rrggbb`) | de kaart en het hostelement van elk apparaat |
| `design.haptics` | `click`, `turn`, `slide`: `off`, `light`, `medium`, `strong` | elke kaart (alleen waar het apparaat of de browser trilt) |
| `design.knobs` | `style` `workspace`, `rotary`, `slider`; `size` `s`, `m`, `l` | alleen `host.ui.knob`-regelaars (korte vorm van `controls`) |
| `design.controls` (0.3) | een lijst regels `{ match, face, size, length, thickness, thumb, color, activeColor, showValue }`; `match` is `*`, een id, `role:<rol>` of `group:<groep>`; de laatste passende regel wint | de regelaars die een apparaat aanmeldt met id, rol en groep (apparaatcontract v1.15, §12d); een skin verbergt nooit een regelaar |
| `design.meters` (0.4) | een lijst regels `{ match, face, orientation, length, width, ballistics, peakHold, clip, scale, color, segments }`; `match` is `*`, een id of `group:<groep>`; `face` is `bar`, `ledladder`, `vu` of `default`; de laatste passende regel wint | de meters die een apparaat met `host.ui.meter` door de host laat tekenen (apparaatcontract v1.18, §12e); een VU-gezicht vervangt de balk op dezelfde plek; een skin verbergt nooit een meter |
| `design.sections` (0.5) | een lijst van hoogstens 32 regels `{ match, frame, columns, gap, bare, labels, align }`; `match` is `*` of `group:<groep>`; de laatste passende regel wint | groepen regelaars die in één eigen element zitten; een sectie die niet te vinden is, wordt overgeslagen en het Skins-paneel meldt "n van m secties"; een skin verbergt of verplaatst nooit iets |
| `design.size` (0.5) | `{ width }`, 200 tot 1600 px | de kaartbreedte van een verschijningsvorm, alleen toegepast als de skin of verschijningsvorm met de hand wordt gekozen (niet bij Auto) |
| `design.pads` (0.6) | één object `{ shape, size, color, palette, colors, idle, active, led, hit, press, gap, rules }`; `rules` (0.8) is een lijst regels per pad `{ match, kind, color, activeColor, led }` met `kind` `toggle`, `pad` of `velocity`; `shape` is `circle`, `square`, `rounded` of `rect`; `colors` geeft een kleur per pad (id, `role:step` of `group:<groep>`) | de pads die een apparaat door de host laat tekenen met `host.ui.pad`, stapknoppen van `host.ui.steps` met opties en eigen knoppen met `data-pk-role="pad"`/`"step"` (apparaatcontract v1.22, §12f); een skin verbergt nooit een pad |
| `design.display` (0.6) | één object `{ style, nav, commit, lines, width, expand, targets, color }`; `style` is `dropdown`, `lcd`, `oled`, `segment` of `paper` | keuzelijsten als schermpje met < > en [ok] en een vergroot paneel bij een klik; met `targets` ook de preset- en tunekiezer in de kaartkop; een skin verbergt nooit de keuze |
| `design.layout` (0.7) | één object `{ flow, panels }`; `flow` is `rows`, `columns` of `auto`; hoogstens 16 panelen met `id`, `items` (een id, `role:<rol>`, `group:<groep>` of `*`), `title`, `style`, `dir`, `cols`, `gap`, `bare`, `labels`, `align`, `width`, `collapsible`, `collapsed` | alle regelaars die een apparaat aanmeldt (id/role/group); ze worden verplaatst, nooit verborgen; wat niet genoemd wordt komt in een restpaneel; apparaten met een eigen indeling (Control Surface) worden overgeslagen |

Alle sleutels zijn optioneel; een ontbrekende sleutel laat het apparaat of de werkruimte hun eigen gedrag houden. `design` van een verschijningsvorm overschrijft dat van de skin per sleutel. Zie [`library/nl.patchkamer.duofone/`](library/nl.patchkamer.duofone/) voor `example-back-panel`, `example-touch` en `example-panels` (design.layout), [`library/nl.patchkamer.filter/`](library/nl.patchkamer.filter/) voor `example-controls`, `example-sliders` (design.controls) en `example-panels` (design.layout), [`library/nl.patchkamer.mixer/`](library/nl.patchkamer.mixer/) voor `example-meters` en `example-vu` (design.meters), en het [contract](contract/SKINS-CONTRACT_NL.md) (§4b) voor de details. Welke id's, rollen en groepen een apparaat aanbiedt zie je met `node contract/validate-instrument.mjs <apparaat> --controls`; een skin toets je tegen een apparaat met `node skins/contract/validate-skin.mjs <skin> --device <apparaat>`.

## Licentie

De skins in `library/` zijn CC0-1.0 (publiek domein): je mag een skin hergebruiken zonder naamsvermelding. Het contract en de validator in `contract/` zijn MIT. Zie [LICENSING.md](../LICENSING.md).
