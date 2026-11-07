# AGENTS.md: skins/

Dit bestand is voor AI-agents die **skins** maken voor Patchkamer-apparaten. Het is niet geschreven voor mensen. Het hoort bij de algemene instructies in `../AGENTS.md`; lees die eerst. Een skin bouwen is iets anders dan een apparaat bouwen: een skin raakt geen apparaatcode.

**Eerlijk vooraf:** in versie 0.6 (laag 1 en release A, C, B1 en D van laag 2) bestaat een skin uit CSS en ingesloten afbeeldingen plus een kleine set gevalideerde ontwerpkeuzes (`design`, hieronder), waaronder regels voor het gezicht van regelaars (`design.controls`) van meters (`design.meters`) voor de opmaak van secties en kaartbreedte (`design.sections`, `design.size`) en voor het gezicht van pads en schermpjes (`design.pads`, `design.display`). Het formaat, de mappen, het laden en het wisselen van verschijningsvormen liggen vast; de eisen aan echte artwork, regelaargrafiek, indeling, bouwstenen en een editor (laag 2 en 3) levert Freek later aan (zie het contract, §13). Maak dus geen ingewikkelde skins en verzin geen eisen of `design`-sleutels die er niet zijn.

## Wat een skin is

Een skin is **één JSON-bestand** dat het uiterlijk van **één apparaat** verandert: een manifest met een of meer **verschijningsvormen** (bijvoorbeeld compact en breed), elk met CSS die in de shadow root van het apparaat wordt gezet en optioneel ingesloten afbeeldingen. Een skin verandert nooit de state, het geluid of het gedrag van een apparaat, en een apparaat hoeft er niets voor te doen.

Skins zijn een nieuw soort bibliotheekmateriaal naast **tunes** (klanken van instrumenten, `../tunes/`) en **presets** (instellingen van de rest, `../presets/`). Op de kaart van een apparaat met een skin kiest de gebruiker een skin en een verschijningsvorm (Auto of een vaste); Auto wisselt vanzelf op kaartbreedte en schermklasse.

## Mappen

```
skins/
  AGENTS.md                         dit bestand
  README.md, README_NL.md
  contract/                         SKINS-CONTRACT_NL.md, SKINS-CONTRACT_EN.md, validate-skin.mjs   (MIT)
  library/<device-id>/              één map per apparaat-id, bijvoorbeeld nl.patchkamer.duofone   (CC0-1.0)
    icon.svg|png|webp|jpg           optioneel: het icoon van het apparaat
    <naam>.patchkamer-skin.json     één of meer skins voor dit apparaat
```

De mapnaam onder `library/` is **letterlijk** het `id` van het apparaat (lees het uit het apparaatbestand, `../devices/<categorie>/<Naam>/<naam>.patchkamer-device.js`). Een skin hoort bij dat `id`; een verkeerde schrijfwijze is een skin zonder apparaat.

## Het formaat in het kort

Een bestand `<naam>.patchkamer-skin.json` (kleine letters met streepjes, **geen versienummer** in de naam) met:

- `format` (`"patchkamer-skin"`), `formatVersion` (`1`), `skinsContract` (`"0.6"`; `"0.5"`, `"0.4"`, `"0.3"`, `"0.2"` of `"0.1"` als de skin geen `pads`/`display`/`sections`/`size`/`meters`/`controls`/`design` heeft);
- `id` (`<device-id>.<slug>`), `device` (het apparaat-id), `name` (Engels, 1 tot 60), `version` (semver), `author`, `license` (`CC0-1.0`), `description` (Engels, hoogstens 300), `created` (`YYYY-MM-DD`);
- `icon` (`null` of een data-adres, hoogstens 200 kB) en `default` (de `id` van de verschijningsvorm als niets in Auto past);
- `design` (optioneel, vanaf 0.2; `controls` vanaf 0.3, `meters` vanaf 0.4; `sections` en `size` vanaf 0.5; `pads` en `display` vanaf 0.6): ontwerpkeuzes voor alle verschijningsvormen;
- `appearances`: 1 tot 12 verschijningsvormen met `id`, `name`, optioneel `description`, `when` (`minWidth`, `maxWidth`, `screens` met `phone`, `compact`, `wide`), `css`, `assets` en eventueel een eigen `design` (overschrijft dat van de skin per sleutel).

Alle velden, bereiken en regels staan in het contract: [`contract/SKINS-CONTRACT_NL.md`](contract/SKINS-CONTRACT_NL.md) (of `_EN.md`). Lees het volledig voor je een skin maakt.

## Een skin maken en valideren

1. **Kies het apparaat** en lees zijn bron: welke CSS-variabelen en klassen zet het in zijn shadow root? Staat er een `AGENTS.md` in de apparaatmap, lees die dan ook. Zie ook de opmerking over stijlhaken hieronder.
2. **Maak de map** `library/<device-id>/` als die er nog niet is, en schrijf `<naam>.patchkamer-skin.json`. Neem [`library/nl.patchkamer.duofone/example-plain.patchkamer-skin.json`](library/nl.patchkamer.duofone/example-plain.patchkamer-skin.json) als uitgangspunt.
3. **Valideer** vanuit de root van de repo:
   ```
   node skins/contract/validate-skin.mjs --lang nl skins/library/<device-id>/<naam>.patchkamer-skin.json
   ```
   Het resultaat moet één `OK`-regel zijn (exit 0), **zonder `let op`**. Bij een fout (exit 1) staan alle fouten in de uitvoer: herstel en draai opnieuw. Voor de hele bibliotheek: `node skins/contract/validate-skin.mjs --dir skins/library`. Meld nooit "klaar" zolang de validator niet `OK` geeft.
4. **Test in de host** als je een browser tot je beschikking hebt (`../patchkamer/AGENTS.md`): laad de skin, kies hem op de kaart van het apparaat, en kijk of de verschijningsvormen wisselen. De validator kan niet zien of de CSS iets raakt of er goed uitziet. Heb je geen browser, schrijf dan in je oplevering dat dit **niet getest** is. Beweer niet dat het werkt.
5. **Lever op:** het pad van het bestand, de contractversie (`0.6`), de `OK`-regel van de validator en wat je niet hebt kunnen testen.

### Ontwerpkeuzes (`design`, laag 1)

Werken via de host op alle apparaten; zonder CSS en zonder dat je de apparaatbron hoeft te lezen. Alle sleutels zijn optioneel; gebruik alleen deze sleutels en waarden (de validator weigert andere waarden).

| Optie | Waarden | Werkt op |
|---|---|---|
| `design.ports.mode` | `default`, `always`, `hover`, `strip`, `bar` | poortenbalk bovenaan elk apparaat (niet bij `ui.jacks`) |
| `design.colors` | `scheme` `workspace` of `custom` met `bg`, `surface`, `text`, `muted`, `accent`, `line` (`#rgb` of `#rrggbb`) | de kaart en het hostelement van elk apparaat |
| `design.haptics` | `click`, `turn`, `slide`: `off`, `light`, `medium`, `strong` | elke kaart (alleen waar het apparaat of de browser trilt) |
| `design.knobs` | `style` `workspace`, `rotary`, `slider`; `size` `s`, `m`, `l` | alleen `host.ui.knob`-regelaars (korte vorm van `controls`) |
| `design.controls` (0.3) | lijst van hoogstens 64 regels `{ match, face, size, length, thickness, thumb, color, showValue }` | alleen regelaars die het apparaat aanmeldt (id/role/group) |
| `design.meters` (0.4) | lijst van hoogstens 64 regels `{ match, face, orientation, length, width, ballistics, peakHold, clip, scale, color, segments }` | alleen meters die het apparaat met `host.ui.meter` aanmeldt (id/group) |
| `design.sections` (0.5) | lijst van hoogstens 32 regels `{ match, frame, columns, gap, bare, labels, align }` | alleen groepen regelaars die in één eigen element zitten (id/group) |
| `design.size` (0.5) | `{ width }`: 200 tot 1600 | de kaartbreedte van een verschijningsvorm, alleen bij handmatige keuze |
| `design.pads` (0.6) | één object `{ shape, size, color, palette, colors, idle, active, led, hit, press, gap }`; `colors` hoogstens 64 sleutels | alleen pads van `host.ui.pad`, stapknoppen van `host.ui.steps` met opties en eigen knoppen met `data-pk-role="pad"`/`"step"` (id/role/group) |
| `design.display` (0.6) | één object `{ style, nav, commit, lines, width, expand, targets, color }` | keuzes van `host.ui.select`/`host.ui.display` en, met `targets`, de preset- en tunekiezer in de kaartkop |

- `ports.mode`: `default` zoals nu, `always` poortenbalk altijd zichtbaar, `hover` poorten verschijnen bij een kabel boven het apparaat of de muis boven de strook, `bar` poorten als stipjes in de titelbalk (tussen naam en versiekeuze, balk groeit niet), `strip` een dunne strook die altijd zichtbaar is. Zie het contract, §4b, voor de schets.
- Kleuren alleen als `#rgb` of `#rrggbb`. Kies bij `scheme: "custom"` alle zes de kleuren; zorg dat `text` tegen `bg` en `surface` minstens 3:1 haalt (anders een `let op`). Per verschijningsvorm hoef je alleen de kleuren te herhalen die anders zijn.
- Haptiek en knoppen werken niet overal (geen trilling in elke browser; eigen `range`-invoeren van een apparaat blijven ongemoeid). Beloof dus niet meer in de omschrijving dan het contract zegt.
- Een skin met `design` krijgt `skinsContract` `"0.2"`; een skin met `design.controls` krijgt `"0.3"`; een skin met `design.meters` krijgt `"0.4"`; een skin met `design.sections` of `design.size` krijgt `"0.5"`; een skin met `design.pads` of `design.display` krijgt `"0.6"`. Voorbeelden: `library/nl.patchkamer.duofone/example-back-panel.patchkamer-skin.json` en `example-touch.patchkamer-skin.json`.
- **`design.controls` (0.3).** Een geordende lijst regels; de laatste passende regel wint per eigenschap, dus zet `"*"` bovenaan en bijzondere id's onderaan. `match`: `"*"`, een id (`"cut"`), `"role:<rol>"` (`param`, `fader`, `toggle`, `button`, `pad`, `step`, `display`, `select`, `meter`, `jack`) of `"group:<groep>"`. Eigenschappen: `face` (`rotary`, `hslider`, `vslider`, `default`), `size` (`xs`..`xl` of 0,6 tot 2,0), `length` (`short`, `medium`, `long` of 40 tot 400), `thickness` (2 tot 24), `thumb` (`round`, `square`, `bar`, `none`), `color` (`accent` of `#rgb`/`#rrggbb`), `showValue` (`always`, `hover`, `never`). `length`, `thickness` en `thumb` gelden alleen voor schuiven. Een skin **verbergt geen regelaars** en zet geen waarden: er is geen `face: "none"` (de validator geeft een fout).
- **`design.meters` (0.4).** Een geordende lijst regels, de laatste passende wint per eigenschap. `match`: `"*"`, een id (`"met.master"`) of `"group:<groep>"`; **geen** `role:`. Eigenschappen: `face` (`bar`, `ledladder`, `vu`, `default`), `orientation` (`auto`, `vertical`, `horizontal`; niet bij `vu`), `length` (`short`, `medium`, `long` of 24 tot 400; bij `vu` de breedte van de wijzerplaat), `width` (3 tot 48; niet bij `vu`), `ballistics` (`default`, `fast`, `vu`, `slow`), `peakHold` (`on`, `off`, `default`), `clip` (`show`, `hide`, `default`), `scale` (`show`, `hide`; alleen `vu` en `ledladder`), `color` (`accent`, `default` of `#rgb`/`#rrggbb`), `segments` (geheel 8 tot 40; alleen `ledladder`). Een `vu` **vervangt** de balk op dezelfde plek en heeft minstens 56 × 36 px nodig (de kaart groeit mee). Een skin **verbergt geen meter**: er is geen `face: "none"` (fout). Het werkt alleen op meters die het apparaat met `host.ui.meter` aanmeldt; `node contract/validate-instrument.mjs <apparaat> --controls` toont ze met rol `meter`. Voorbeelden: `library/nl.patchkamer.mixer/example-meters.patchkamer-skin.json` en `example-vu.patchkamer-skin.json`.
- **`design.sections` en `design.size` (0.5).** `sections`: een geordende lijst regels (hoogstens 32), de laatste passende wint per eigenschap. `match`: `"*"` of `"group:<groep>"` (geen id, geen `role:`; groepen uit `node contract/validate-instrument.mjs <apparaat> --controls`). Eigenschappen: `frame` (`none`, `line`, `raised`, `inset`, `floating`, `default`), `columns` (`auto` of een geheel getal 1 tot 12), `gap` (`tight`, `normal`, `wide`), `bare` (`true`/`false`: de regelaars verliezen hun eigen kader), `labels` (`default`, `above`, `below`: waarde boven, regelaar, label eronder), `align` (`start`, `center`). `size`: `{ "width": 200..1600 }`, de kaartbreedte van een verschijningsvorm; de host past hem alleen toe bij een met de hand gekozen skin of verschijningsvorm, niet bij Auto. Een "sectie" is het element dat **precies** de regelaars van één groep bevat; heeft een groep dat niet, dan wordt hij niet gestyled en meldt het Skins-paneel "n van m secties". Een skin herschikt of verbergt niets. **Beperk de hoogte zelf** met kolommen (bijvoorbeeld 3) en een passende `size.width`: oneindig naar beneden scrollen is een slechte skin. Voorbeeld: `library/nl.patchkamer.duofone/example-back-panel.patchkamer-skin.json` (Compact: 380 px, kaders om 3 kolommen kale draaiknoppen met het label eronder; Full: 920 px, verhoogde secties en schuiven).
- **`design.pads` (0.6).** Één object (geen lijst). `shape` (`circle`, `square`, `rounded`, `rect`; nooit `none`), `size` (`xs`..`xl` of 0,6 tot 2,0), `color` (`neutral`, `device`, `palette`), `palette` (2 tot 16 kleuren, alleen bij `color: "palette"`), `colors` (hoogstens 64 sleutels: een id, `role:step`/`role:pad` of `group:<groep>` naar `#rrggbb`; wint van `color`), `idle` (`neutral`, `tint`), `active` (`fill`, `border`, `glow`, `none`), `led` (`none`, `center`, `top`, `bottom`, `left`, `right`), `hit` (`flash`, `none`), `press` (`depress`, `glow`, `none`), `gap` (`tight`, `normal`, `wide`; tussen stapknoppen). Vraag de id's, rollen en groepen van pads en stappen aan het register (`--controls` toont ze met rol `pad`/`step`) en toets met `--device`. Een skin verbergt geen pad en zet geen waarde. Voorbeelden: `library/nl.patchkamer.drummachine/example-round-pads.patchkamer-skin.json` en `example-flat-pads.patchkamer-skin.json`.
- **`design.display` (0.6).** Één object. `style` (`dropdown`, `lcd`, `oled`, `segment`, `paper`; nooit `none`), `nav` (`arrows`, `arrows+ok`, `none`), `commit` (`live`, `ok`), `lines` (1 tot 3), `width` (`auto` of 80 tot 400), `expand` (`click`, `button`, `off`), `targets` (niet-lege lijst uit `select`, `preset`, `tune`), `color` (`accent`, `default` of `#rgb`/`#rrggbb`). `nav: "none"` met `expand: "off"` laat het schermpje niet te bedienen (een `let op`). `preset`/`tune` in `targets` vervangt alleen het gezicht van de keuze in de kaartkop; Bewaar, Bladeren en het onderdeel blijven. Voorbeeld: `library/nl.patchkamer.drummachine/example-preset-screen.patchkamer-skin.json`.
- **Welke id's bestaan?** Verzin ze niet. Vraag het register van het apparaat: `node contract/validate-instrument.mjs <apparaat.patchkamer-device.js> --controls` drukt de tabel `id | rol | groep | label nl/en | bereik | gezicht` af. Een apparaat zonder id's heeft nog niet meegedaan (dan werken alleen `"*"` en `role:` zinvol; of wacht tot het apparaat is bijgewerkt). Toets je skin daarna tegen het apparaat: `node skins/contract/validate-skin.mjs --lang nl <skin> --device <apparaat>` moet zonder `let op` blijven. Voorbeelden: `library/nl.patchkamer.filter/example-controls.patchkamer-skin.json` en `example-sliders.patchkamer-skin.json`.
- Welke skinkleur welke CSS-variabele in de host zet, staat in het contract (§4b) en in `../patchkamer/AGENTS.md` (sectie Skins).

### Stijlhaken per apparaat

Welke klassen, ids, variabelen en `part`-namen een apparaat in zijn shadow root heeft, **verschilt per apparaat** en wordt in versie 0.6 niet door een contract vastgelegd (voor regelaars, meters, pads en schermpjes wel: id, rol en groep, zie `design.controls`, `design.meters`, `design.pads` en `design.display`). Gebruik alleen wat je in het apparaatbestand ziet (`:host` en CSS-variabelen werken altijd, mits het apparaat ze gebruikt). Een selector die niets raakt, is geen fout van de validator, maar je skin doet dan niets. Zie het contract, §4.

## Namen en taal

- `name`, `description`, de `id`'s, de verschijningsnamen, de bestandsnaam en de mapnaam zijn **Engels en merkvrij**. Geen merknamen of productnamen van bestaande instrumenten, ook niet in commentaar. Een omschrijving als "geïnspireerd op klassieke analoge synths" mag.
- De validator geeft een **fout** bij een merk- of modelnaam uit de lijst van het project en een `let op` bij Nederlandse woorden in namen en omschrijvingen. Lees je namen daarna zelf nog eens na.
- Een skin is niet per taal: één Engelse naam, één Engelse omschrijving.

## Iconen

- Een apparaat kan een icoon hebben: `icon.svg`, `icon.png`, `icon.webp` of `icon.jpg` in `library/<device-id>/` (of in de apparaatmap zelf, zie `../devices/AGENTS.md`). Een skin kan zijn eigen icoon meebrengen in het veld `icon`.
- Een `icon.svg` is een **eigen, eenvoudig** icoon: `viewBox="0 0 24 24"`, lijnwerk met `stroke="currentColor"`, afgeronde einden en hoeken, in de stijl van de categorie-iconen. **Geen script**, geen `<foreignObject>`, geen gebeurtenis-attributen, geen externe verwijzing, **merkvrij**, hoogstens 200 kB.
- Valideer een icoon met `node skins/contract/validate-skin.mjs skins/library/<device-id>/icon.svg`.
- Welk icoon een apparaat uiteindelijk krijgt, bepaalt de host in een vaste volgorde: contract §6.

## Licentie

Alles in `library/` is `CC0-1.0` (publiek domein): zet `"license": "CC0-1.0"` op elke skin. `contract/` is `MIT`. Dit bestand en de README's volgen de root-licentie. Zie `../LICENSING.md`.

## Wat je niet doet

- Pas **geen apparaatcode** aan, en ook niet `../contract/`, de host (`../patchkamer/`) of de validator om je skin te laten slagen. Past je skin niet, pas dan je skin aan. Denk je dat het contract of de validator een fout bevat, meld dat dan apart.
- Geen externe verwijzingen: geen `@import`, geen `url(` naar een adres buiten het bestand (alleen `data:` of `var(--skin-asset-…)`), geen netwerk, geen scripts.
- Geen **verzonnen apparaatklassen**, -variabelen of `part`-namen. Wat je niet in het apparaatbestand ziet, bestaat niet.
- Geen merknamen of Nederlandse namen. Geen versienummer in de bestandsnaam.
- Geen kopieën van skins van anderen onder een andere licentie dan `CC0-1.0`.
- Geen geheimen, sleutels of persoonlijke gegevens in een bestand.
- Commit of push niet, tenzij de opdracht dat vraagt.

## Controlelijst voor je oplevert

- [ ] Bestand `<naam>.patchkamer-skin.json` in `library/<device-id>/`, mapnaam gelijk aan `device`.
- [ ] `skinsContract` `"0.6"` (of `"0.5"`/`"0.4"`/`"0.3"`/`"0.2"`/`"0.1"` zonder `pads`/`display`/`sections`/`size`/`meters`/`controls`/`design`), `format` `"patchkamer-skin"`, `formatVersion` `1`.
- [ ] Namen en omschrijving Engels en merkvrij; `license` `CC0-1.0`; `created` is een echte datum.
- [ ] Verschijningsvormen met een `when` die klopt (geen overlap die een vorm onbereikbaar maakt) en een `default`.
- [ ] Een eventueel `design.controls` heeft hoogstens 64 regels, mikt alleen op id's, rollen en groepen uit het register van het apparaat (`--device` zonder `let op`) en verbergt niets.
- [ ] Een eventueel `design.meters` heeft hoogstens 64 regels, mikt alleen op meter-id's en groepen uit het register van het apparaat (`--device` zonder `let op`), gebruikt geen `role:`, geeft een `vu` geen `width` of `orientation` en verbergt niets.
- [ ] Een eventueel `design.sections` heeft hoogstens 32 regels, mikt alleen op `"*"` of op groepen uit het register van het apparaat (`--device` zonder `let op`) en beperkt de hoogte met kolommen; een eventueel `design.size.width` ligt tussen 200 en 1600.
- [ ] Een eventueel `design.pads` is één object, kiest nooit `shape: "none"`, heeft `palette` alleen bij `color: "palette"` en mikt met `colors` alleen op pads, stappen en groepen uit het register van het apparaat (`--device` zonder `let op`); een eventueel `design.display` kiest nooit `style: "none"` en laat het schermpje bedienbaar.
- [ ] Een eventueel `design` gebruikt alleen sleutels en waarden uit de tabel hierboven; kleuren zijn `#rgb` of `#rrggbb`.
- [ ] CSS zonder `@import` en zonder externe `url(`; afbeeldingen in `assets`, gebruikt via `var(--skin-asset-<naam>)`.
- [ ] Alleen selectors, klassen en variabelen die je in het apparaatbestand hebt gezien.
- [ ] `node skins/contract/validate-skin.mjs --lang nl <bestand>`: één `OK`-regel, geen `let op`, en dat ook met `--lang en`.
- [ ] Een eventueel `icon.svg` voldoet aan de iconenregels hierboven en is gevalideerd.
- [ ] Geen merk- of modelnaam (de validator controleert dit); geen geheimen.
- [ ] In de oplevering staat wat je niet hebt kunnen testen.

## Documentatie

- [Skinscontract (Nederlands)](contract/SKINS-CONTRACT_NL.md) en [Skins contract (English)](contract/SKINS-CONTRACT_EN.md): het volledige formaat, de regels en de validator.
- [Validator](contract/validate-skin.mjs): `node skins/contract/validate-skin.mjs --lang nl <bestand>`; testgevallen: `node skins/contract/test-validate-skin.mjs`.
- Voorbeeldskins: [plain (0.1)](library/nl.patchkamer.duofone/example-plain.patchkamer-skin.json), [back panel](library/nl.patchkamer.duofone/example-back-panel.patchkamer-skin.json) en [touch](library/nl.patchkamer.duofone/example-touch.patchkamer-skin.json) (laag 1), [controls](library/nl.patchkamer.filter/example-controls.patchkamer-skin.json) en [sliders](library/nl.patchkamer.filter/example-sliders.patchkamer-skin.json) (laag 2, Filter), [meters](library/nl.patchkamer.mixer/example-meters.patchkamer-skin.json) en [vu](library/nl.patchkamer.mixer/example-vu.patchkamer-skin.json) (laag 2, Mixer), en het [voorbeeldicoon](library/nl.patchkamer.duofone/icon.svg).
- [README (Engels)](README.md) en [README (Nederlands)](README_NL.md) van deze map.
- [Algemene agent-instructies voor apparaten](../AGENTS.md), [tunes](../tunes/AGENTS.md), [presets](../presets/AGENTS.md) en [songs](../songs/AGENTS.md).
- [Apparaatcontract](../contract/PATCHKAMER-CONTRACT_NL.md) ([English](../contract/PATCHKAMER-CONTRACT_EN.md)) en [licenties](../LICENSING.md).
