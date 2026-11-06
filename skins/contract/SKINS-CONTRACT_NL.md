# Patchkamer — Skinscontract v0.1 voor bouwende agents

Dit document is de volledige, zelfstandige instructie om een **skin** te bouwen voor **Patchkamer**: een los bestand dat het uiterlijk van één apparaat verandert, zonder het apparaat zelf of het apparaatcontract aan te raken. Een agent die dit document krijgt, heeft geen andere context nodig. Lever een bestand `naam.patchkamer-skin.json` op dat aan dit contract voldoet en zonder fouten door `validate-skin.mjs` komt.

_Dit contract staat in twee talen: `SKINS-CONTRACT_NL.md` (Nederlands, de brontekst) en `SKINS-CONTRACT_EN.md` (English). Beide hebben dezelfde versie en dezelfde inhoud; verschillen ze, dan geldt de Nederlandse tekst. De validator spreekt ook beide talen (`--lang nl|en`)._

_Dit contract is een eigen contract naast het apparaatcontract (`../../contract/PATCHKAMER-CONTRACT_NL.md`, nu v1.14) en heeft een eigen versienummer. Een skin stelt niets van een apparaat voor: er is geen wijziging aan apparaten nodig._

| Versie | Wat erbij kwam |
|---|---|
| v0.1 | Eerste versie, bewust klein: een manifest, verschijningsvormen met CSS en ingesloten afbeeldingen, automatisch wisselen op kaartbreedte en schermklasse, een icoon per skin en per apparaat. De inhoud van een skin is een placeholder; de eisen voor artwork, regelaargrafiek en indeling volgen later (§13) |

---

## 1. Doel en reikwijdte

- Een **skin** verandert alleen het **uiterlijk** van één apparaat. Een skin raakt nooit de state, het geluid, de poorten of het gedrag van het apparaat.
- Een skin is **één bestand** met data (JSON). Het bevat geen script en geen apparaatcode. De CSS erin wordt door de host in de shadow root van het apparaat gezet.
- Een skin hoort bij **één apparaat-id** (het veld `device`). Voor een ander apparaat wordt hij bewaard maar nergens aangeboden.
- Een apparaat hoeft niets te doen om skins te kunnen krijgen. Heeft het apparaat geen open shadow root (zie §4), dan kan de host de skin niet toepassen en meldt dat; dat is geen fout van de skin of van het apparaat.
- Skins zijn een nieuw soort bibliotheekmateriaal naast tunes en presets: ze worden geladen uit bronnen (een GitHub-map, een lokale map, een adres), bekeken in een eigen paneel, gekozen per apparaat op de kaart, bewaard in de werkruimte en in de song, en kunnen op het canvas worden gedropt (§8, §9).
- Versie 0.1 is bewust klein. Het formaat is uitbreidbaar (onbekende velden worden genegeerd, §10); wat er nog niet in zit staat in §13.

---

## 2. Het bestand

Een skin is een UTF-8 JSON-bestand met één object, genaamd `naam.patchkamer-skin.json`: kleine letters met streepjes, **zonder versienummer** in de naam (de versie staat in `version`, eerdere versies in git). Het bestand is hoogstens 2 MB.

### 2a. Velden op het bovenste niveau

| Veld | Type | Bereik en regel | Standaard | Verplicht |
|---|---|---|---|---|
| `format` | tekst | altijd `"patchkamer-skin"` | | ja |
| `formatVersion` | geheel getal | nu `1` | | ja |
| `skinsContract` | tekst | `"major.minor"`, nu `"0.1"`; zie §10 | | ja |
| `id` | tekst | 3 tot 100 tekens uit `[a-z0-9.-]`; aanbevolen `<device-id>.<slug>`; uniek: dezelfde `id` is dezelfde skin | | ja |
| `device` | tekst | de `id` van het apparaat waarvoor de skin is, bijvoorbeeld `nl.patchkamer.duofone` | | ja |
| `name` | tekst | Engelse naam, 1 tot 60 tekens, merkvrij (§11) | | ja |
| `version` | tekst | semver `x.y.z` van de skin | | ja |
| `author` | tekst | maker, 1 tot 60 tekens | | ja |
| `license` | tekst | SPDX-id; in `skins/library/` altijd `CC0-1.0` (§11) | | ja |
| `description` | tekst | Engels, 1 tot 300 tekens | | ja |
| `created` | tekst | datum `YYYY-MM-DD` | | ja |
| `icon` | tekst of `null` | `null`, of een afbeelding als data-adres, hoogstens 200 kB (§6) | `null` | ja (mag `null` zijn) |
| `default` | tekst | de `id` van de verschijningsvorm die geldt als niets in `auto` past (§3) | de eerste verschijningsvorm | nee |
| `appearances` | lijst | 1 tot 12 verschijningsvormen (§2b) | | ja |

Twee skins met dezelfde `id` zijn dezelfde skin: de nieuwere `version` wint. Samen met `device` identificeert `id` de skin.

### 2b. Een verschijningsvorm

Een **verschijningsvorm** (appearance) is één uiterlijk van de skin, bijvoorbeeld een compacte en een brede variant.

| Veld | Type | Bereik en regel | Standaard | Verplicht |
|---|---|---|---|---|
| `id` | tekst | 1 tot 40 tekens uit `[a-z0-9-]`, uniek binnen de skin | | ja |
| `name` | tekst | Engelse naam, 1 tot 40 tekens, merkvrij | | ja |
| `description` | tekst | Engels, hoogstens 300 tekens | leeg | nee |
| `when` | object | voorwaarden voor **automatisch** kiezen (§2c, §3) | geen: nooit automatisch | nee |
| `css` | tekst | CSS voor de shadow root van het apparaat, hoogstens 200 kB (§4) | leeg | nee |
| `assets` | object | naam → data-adres van een afbeelding (§5) | `{}` | nee |

### 2c. De voorwaarden `when`

Alle opgegeven voorwaarden moeten kloppen. Een veld dat ontbreekt stelt geen voorwaarde.

| Veld | Type | Bereik en regel | Standaard | Verplicht |
|---|---|---|---|---|
| `minWidth` | geheel getal | 0 tot 10000: de kaart is minstens zo breed (CSS-pixels, in vloercoördinaten, zonder zoom) | 0 | nee |
| `maxWidth` | geheel getal | 0 tot 10000: de kaart is hoogstens zo breed; `minWidth` mag niet groter zijn dan `maxWidth` | geen grens | nee |
| `screens` | lijst | een of meer van `"phone"`, `"compact"`, `"wide"` (zie §3) | alle schermklassen | nee |

---

## 3. Verschijningsvormen kiezen

Op de kaart van een apparaat met minstens één skin kiest de gebruiker een **Skin** (Standaard, of een skin) en een **Verschijning**: **Auto** of een verschijningsvorm van de gekozen skin.

Bij **Auto** kiest de host zelf, en kiest opnieuw als de breedte van de kaart of de schermklasse verandert:

1. Loop de verschijningsvormen **in de volgorde van het bestand** langs; de eerste waarvan `when` klopt, wordt gekozen. Een verschijningsvorm **zonder `when`** past nooit automatisch (alleen handmatig).
2. Past er geen, dan geldt de verschijningsvorm uit `default`.
3. Ontbreekt `default`, dan geldt de eerste verschijningsvorm.

Handmatig een verschijningsvorm kiezen zet Auto uit voor dat apparaat, tot de gebruiker terug naar Auto gaat.

De breedte is die van de apparaatkaart in vloercoördinaten, zonder zoom. De schermklassen zijn die welke de host al kent:

| Waarde | Wat |
|---|---|
| `phone` | venster smaller dan 700 px |
| `compact` | venster van 700 tot 1099 px breed |
| `wide` | venster van 1100 px of breder |

Schrijf `when` zo dat de bereiken elkaar niet overlappen en elkaar aanvullen; zet de verschijningsvorm die het vaakst past achteraan of in `default`. De validator geeft een `let op` bij voorwaarden die nooit kunnen kloppen of door een eerdere verschijningsvorm altijd worden overschaduwd (§12).

---

## 4. CSS

De `css` van de actieve verschijningsvorm wordt als stijlblad in de **shadow root van het apparaat** gezet zolang die verschijningsvorm actief is, en verdwijnt bij Standaard. De host hoort dat blok **na** de eigen stijlen van het apparaat te zetten, zodat bij gelijke specificiteit de skin wint.

**Wat mag niet** (de validator weigert het):

- geen `@import`;
- geen `url(` naar iets anders dan een `data:`-adres of `var(--skin-asset-…)` (dus ook geen relatieve adressen en geen `#fragment`);
- geen `image-set(`, geen `</style`, geen `javascript:`, `expression(`, `-moz-binding` en `behavior:`;
- hoogstens 200 kB per verschijningsvorm.

Daarbuiten is gewone CSS toegestaan, ook `@media`, `@container` en `@keyframes`. Een skin kan het gedrag van een apparaat niet veranderen, en CSS bereikt niets buiten de shadow root van het apparaat.

**Hoe selectors in de shadow root werken.** Het stijlblad staat binnen de shadow root, niet in het hoofddocument. Daarom:

- `:host` is het element dat de shadow root draagt (het hostelement van het apparaat), en `:host(.klasse)` of `:host([attribuut])` selecteert het alleen in een bepaalde toestand. Hier zetten de apparaten meestal hun eigen CSS-variabelen en de buitenste opmaak.
- Gewone selectors (`.klasse`, `knop`, `#id`) raken alleen elementen **binnen** die shadow root, dus alleen de UI van dat ene apparaat.
- CSS-variabelen (`--naam`) lopen door de grens van de shadow root heen. Een skin kan dus een variabele van het apparaat, of van de host (zoals `--fg`, `--line` en `--muted`), een andere waarde geven op `:host`, mits het apparaat die variabele gebruikt.
- `::part(naam)` werkt alleen op onderdelen van een **ingebedde** shadow root die zelf een `part` heeft. Dat hangt af van het apparaat.
- Wat een apparaat precies aanbiedt, **verschilt per apparaat** en is in dit contract bewust **per apparaat vast te stellen**: welke klassen, ids, variabelen en `part`-namen er zijn staat in de bron van dat apparaat (en later in de beschrijving van het apparaat, §13). **Verzin geen klassen of variabelen.** Gebruik alleen wat je in het apparaatbestand ziet; een selector die niets raakt, is geen fout, maar doet ook niets.
- Een apparaat zonder open shadow root (zonder `attachShadow`, of met een gesloten) kan de host niet van een skin voorzien. Dat is een melding, geen fout.

---

## 5. Afbeeldingen in een skin (`assets`)

Een afbeelding komt in `assets` als data-adres. De host zet elke afbeelding als CSS-eigenschap `--skin-asset-<naam>: url("data:…")` op het hostelement van het apparaat, zodat de CSS ze kan gebruiken:

```css
:host { background: var(--skin-asset-face) center / cover no-repeat; }
```

- `naam`: 1 tot 40 tekens uit `[a-z0-9-]`.
- Toegestane typen: `data:image/svg+xml`, `data:image/png;base64,…`, `data:image/webp;base64,…`, `data:image/jpeg;base64,…`. Een SVG (ook ingesloten) mag geen script, geen `foreignObject` en geen externe verwijzing bevatten.
- Hoogstens 200 kB per afbeelding en 1 MB samen in de hele skin.
- De CSS verwijst naar een afbeelding met `var(--skin-asset-<naam>)` (of `url(data:…)` direct). Een `--skin-asset-<naam>` in de CSS zonder bijbehorend `assets`-item is een fout; een `assets`-item dat de CSS niet gebruikt, is een `let op`.

---

## 6. Iconen

Er zijn twee soorten iconen, en een **apparaat** krijgt zijn icoon uit zes plekken. Wat wint, van hoog naar laag:

| Prioriteit | Bron |
|---|---|
| 1 | het `icon` van de **actieve skin** van dat apparaat op die kaart (als de skin er een heeft) |
| 2 | het door de gebruiker gekozen icoon voor dat apparaat (bestaat nog niet; niet bouwen) |
| 3 | `icon.*` in de **apparaatmap** van de apparatenbibliotheek (`devices/<categorie>/<Naam>/`) |
| 4 | `icon.*` in `skins/library/<device-id>/` |
| 5 | het icoon van de **categorie** van het apparaat (gebruikerskeuze, indelingsbestand, `icon.*` in de categoriemap, ingebouwd) |
| 6 | het neutrale standaardicoon |

- **Het `icon`-veld van een skin** is `null` of een afbeelding als data-adres (`data:image/svg+xml…`, `data:image/png;base64,…`, `…/webp;base64,…`, `…/jpeg;base64,…`), hoogstens 200 kB.
- **Een iconbestand** is `icon.svg`, `icon.png`, `icon.webp` of `icon.jpg` in de apparaatmap of in `skins/library/<device-id>/`. Een map heeft hoogstens één `icon.*`.
- **Een eigen apparaaticoon** wordt getoond zoals het is (niet omgekleurd), in hetzelfde vakje als het categorie-icoon. Een apparaat zonder eigen icoon toont het categorie-icoon in de categoriekleur.
- **Stijl** voor een `icon.svg`: een eigen, eenvoudig icoon met `viewBox="0 0 24 24"`, lijnwerk met `stroke="currentColor"`, `stroke-linecap="round"` en `stroke-linejoin="round"`, in de stijl van de categorie-iconen. Merkvrij: geen logo's en geen afbeeldingen van bestaande producten.
- **Veiligheid:** een icoon wordt alleen als afbeelding getoond (`<img>`/data-adres), nooit als inline markup. Een SVG bevat dus geen `<script>`, geen `<foreignObject>`, geen gebeurtenis-attributen (`onload=` en dergelijke), geen `href` of `url(` naar iets buiten het bestand en geen `@import`. Een icoon komt alleen van dezelfde bron als de bibliotheek.
- **Grootte:** hoogstens 200 kB.

---

## 7. Mappen en bestandsnamen

```
skins/
  AGENTS.md                         voor agents die skins bouwen
  README.md, README_NL.md
  contract/
    SKINS-CONTRACT_NL.md            dit contract (brontekst)
    SKINS-CONTRACT_EN.md
    validate-skin.mjs               de validator
  library/
    <device-id>/                    één map per uniek apparaat-id, bijvoorbeeld nl.patchkamer.duofone
      icon.svg|png|webp|jpg         optioneel: het icoon van het apparaat
      <naam>.patchkamer-skin.json   één of meer skins voor dit apparaat
```

| Regel | Wat |
|---|---|
| Mapnaam | In `skins/library/<device-id>/` is de mapnaam gelijk aan het veld `device` van de skins erin. De validator geeft een **fout** bij een verschil |
| Elders | Staat een skin buiten `skins/library/<device-id>/`, dan geeft de validator een `let op`: de host vindt hem niet vanzelf (laden, slepen en importeren werken wel) |
| Bestandsnaam | `<naam>.patchkamer-skin.json`, kleine letters met streepjes, zonder versienummer |
| Iconen | `icon.svg`, `icon.png`, `icon.webp` of `icon.jpg`, hoogstens één per map |

---

## 8. Bibliotheek en laden

- De host vindt skins in een bron (GitHub-map, lokale map of adres) als `skins/library/<device-id>/*.patchkamer-skin.json`, en daarbij ook de `icon.*` in die mappen. De standaardbron is de map `skins/library` van `github.com/unboxednl/patchkamer`.
- Skins verschijnen in een eigen paneel (**Skins**) naast Tunes en Presets, per apparaat. Een skin kan ook worden **gedropt** op het canvas of **geïmporteerd**: `*.patchkamer-skin.json`, of JSON met `format: "patchkamer-skin"`.
- Een skin voor een ander apparaat-id wordt bewaard maar nergens aangeboden.
- Een skin met een onbekende major van `skinsContract` wordt geweigerd, met een melding.
- Ongeldige velden geven een melding met de bestandsnaam; de rest van de bibliotheek wordt gewoon geladen.
- Op de kaart verschijnen de keuzelijsten **Skin** en **Verschijning** alleen als er voor het apparaat-id minstens één skin is.
- Een skin verandert nooit de state, het geluid of het gedrag van het apparaat.

---

## 9. Bewaren in werkruimte en song

- Per apparaat bewaart een werkruimte of song een optioneel veld `skin: { id, appearance }`. `appearance` is `"auto"` of de `id` van een verschijningsvorm.
- De skins die in gebruik zijn, worden **ingesloten** in de export van de werkruimte of song, als lijst `skins: [ … ]` (hoogstens 20, elk hoogstens 2 MB), zodat een song zonder de bibliotheek hetzelfde uiterlijk behoudt.
- Een oude werkruimte of song zonder `skin` of `skins` laadt ongewijzigd.
- Een song die een skin gebruikt, is nog steeds een gewone song: het geluid en de apparaatstate zijn hetzelfde met of zonder skin.

---

## 10. Versies

Dit contract heeft een versie `major.minor` (nu **0.1**), vastgelegd in het veld `skinsContract` van elke skin.

| Verschil met de versie van de host | Wat de host doet |
|---|---|
| Dezelfde major, dezelfde of lagere minor | laadt de skin |
| Dezelfde major, hogere minor | laadt de skin en **negeert onbekende velden** |
| Andere major | weigert de skin met een melding |

- Een nieuwe **minor** voegt alleen dingen toe (nieuwe velden, nieuwe waarden die oude hosts mogen negeren). Een wijziging die oude skins breekt, verhoogt de **major**.
- Onbekende velden, ook in een verschijningsvorm of in `when`, **worden genegeerd** en niet geweigerd. De validator meldt ze met een `let op` om typefouten te vangen.
- `formatVersion` (nu `1`) is de versie van de bestandsopbouw zelf; `skinsContract` is de versie van dit contract.
- Houd `id` en `device` gelijk bij een nieuwe versie van een skin en verhoog `version`: de nieuwere `version` wint.
- Dit contract, de validator (`validate-skin.mjs`) en de host horen bij dezelfde versie. De eerste regels van `SKINS-CONTRACT_NL.md`, `SKINS-CONTRACT_EN.md` en `validate-skin.mjs` noemen elk "v0.1".

---

## 11. Namen, taal en licentie

- **Namen zijn Engels en merkvrij**: `name`, `description`, de `id`'s, de verschijningsnamen, de bestandsnaam, de mapnaam en de commentaren. Geen merknamen of productnamen van bestaande instrumenten. Een omschrijving als "geïnspireerd op klassieke analoge synths" mag. De validator geeft een fout bij een merknaam uit de lijst van het project en een `let op` bij Nederlandse woorden in `name` en `description`.
- Een skin is **niet** per taal: er is één Engelse naam en één Engelse omschrijving. De host vertaalt de namen niet.
- **Licentie:** alles in `skins/library/` is `CC0-1.0` (publiek domein); zet `"license": "CC0-1.0"` op elke skin. `skins/contract/` is `MIT`, net als het apparaatcontract. `skins/AGENTS.md` en de README's volgen de root-licentie. Zie `../../LICENSING.md`.
- Zet geen geheimen, sleutels of persoonlijke gegevens in een skin.

---

## 12. De validator

```
node skins/contract/validate-skin.mjs [--lang nl|en] <bestand.patchkamer-skin.json>
node skins/contract/validate-skin.mjs [--lang nl|en] --dir <bibliotheekmap>
```

- Alleen Node, geen pakketten. `--lang` kiest de taal van de meldingen (standaard `nl`).
- Een skin die slaagt, geeft één regel `OK …`, gevolgd door eventuele waarschuwingen (`· let op: …`, met `--lang en`: `· warning: …`), en exitcode 0.
- Bij fouten staat elke fout op een eigen regel (`FOUT: …`, met `--lang en`: `ERROR: …`) en is de exitcode 1. (Anders dan de validator van het apparaatcontract meldt deze **alle** fouten, niet alleen de eerste.)
- Je kunt ook een `icon.svg|png|webp|jpg` meegeven: dan wordt het iconbestand gecontroleerd.
- Met `--dir` worden alle `*.patchkamer-skin.json` en `icon.*` in de map (en de mappen eronder) gecontroleerd, met een samenvatting.

Wat de validator controleert:

| Controle | Resultaat |
|---|---|
| Bestand groter dan 2 MB, geen geldige JSON, geen object | fout |
| `format`, `formatVersion`, `skinsContract` (major 0, vorm `major.minor`) | fout |
| `id`, `device`, `name`, `version`, `author`, `license`, `description`, `created` (vorm en lengte) | fout |
| `icon`: `null` of toegestaan data-adres, hoogstens 200 kB, geen onveilige SVG | fout |
| `default` verwijst naar een bestaande verschijningsvorm | fout |
| `appearances`: 1 tot 12, unieke `id`, `name` | fout |
| `when`: `minWidth`/`maxWidth` 0 tot 10000 en `minWidth` niet groter dan `maxWidth`; `screens` alleen `phone`, `compact`, `wide` | fout |
| `css`: tekst, hoogstens 200 kB, geen `@import`, geen `url(` naar iets anders dan `data:` of `var(--skin-asset-…)`, geen `image-set(` | fout |
| `assets`: namen `[a-z0-9-]`, toegestane data-adressen, hoogstens 200 kB per stuk en 1 MB samen | fout |
| De CSS gebruikt `--skin-asset-<naam>` zonder bijbehorend `assets`-item | fout |
| Merknaam in `name`, `description`, `id`, verschijningsnamen of bestandsnaam | fout |
| `device` is niet gelijk aan de mapnaam in `skins/library/<device-id>/` | fout |
| Bestandsnaam niet `*.patchkamer-skin.json` of met een versienummer erin | let op |
| Skin staat niet in `skins/library/<device-id>/` | let op |
| `license` is niet `CC0-1.0` in `skins/library/` | let op |
| `id` begint niet met het `device` | let op |
| Nederlandse woorden in `name`, `description` of verschijningsnamen | let op |
| `when` die nooit kan kloppen (`screens` leeg, `maxWidth` 0), `when` zonder voorwaarden, of een verschijningsvorm die achter een eerdere altijd onbereikbaar is | let op |
| Een verschijningsvorm zonder `when` terwijl `default` ontbreekt (alleen met de hand te kiezen) | let op |
| Een `assets`-item dat de CSS niet gebruikt; een onbekend veld | let op |
| Twee skins met dezelfde `id` in één bibliotheek, meer dan één `icon.*` in een map, een iconbestand zonder `viewBox="0 0 24 24"` (alleen met `--dir` of bij een icoon) | let op |
| Iconbestand: toegestane extensie, inhoud klopt met de extensie, hoogstens 200 kB, SVG zonder script of externe verwijzing | fout |

De validator kan niet zien of de CSS er goed uitziet of een selector iets raakt. Test dat in de host als je een browser hebt; heb je die niet, schrijf dan in je oplevering dat het **niet getest** is.

---

## 13. Wat nog niet in versie 0.1 zit

Versie 0.1 legt het formaat en de weg naar de gebruiker vast. De inhoud van een skin is een **placeholder**: CSS en afbeeldingen zonder verdere eisen. Bewust later, in een volgende versie:

- artwork voor frontplaten, met de posities van de regelaars erop;
- een grafiek voor regelaars (draaiknoppen, schuiven), eventueel met sprites;
- andere indelingen van een apparaat (een andere plaatsing van onderdelen);
- een contract per apparaat voor stijlhaken: welke klassen, variabelen en `part`-namen een apparaat vastlegt en stabiel houdt (nu is dat per apparaat vast te stellen, §4).

Freek levert de eisen daarvoor nog aan. Verzin tot die tijd niets: bouw een skin met alleen wat in dit contract staat.

---

## 14. Een minimaal voorbeeld

Dit is `skins/library/nl.patchkamer.duofone/example-plain.patchkamer-skin.json`: twee verschijningsvormen die alleen een dunne rand om het apparaat zetten en de accentkleur van Duofone veranderen.

```json
{
  "format": "patchkamer-skin",
  "formatVersion": 1,
  "skinsContract": "0.1",
  "id": "nl.patchkamer.duofone.example-plain",
  "device": "nl.patchkamer.duofone",
  "name": "Example plain",
  "version": "1.0.0",
  "author": "Freek van Gool",
  "license": "CC0-1.0",
  "description": "A minimal example skin: a thin outline around the device, with one appearance for narrow cards and one for wide cards. It shows the file format only.",
  "created": "2026-11-06",
  "icon": null,
  "default": "normal",
  "appearances": [
    {
      "id": "compact",
      "name": "Compact",
      "description": "For narrow cards.",
      "when": { "maxWidth": 420 },
      "css": ":host{outline:2px solid #4fd1b8;outline-offset:-2px}",
      "assets": {}
    },
    {
      "id": "normal",
      "name": "Normal",
      "description": "For wide cards.",
      "when": { "minWidth": 421 },
      "css": ":host{outline:2px solid #4fd1b8;outline-offset:-2px;--x-acc:#4fd1b8}",
      "assets": {}
    }
  ]
}
```

---

## 15. Checklist voor oplevering

- Het bestand heet `<naam>.patchkamer-skin.json` (zonder versienummer) en staat in `skins/library/<device-id>/`, met die map gelijk aan `device`.
- `skinsContract` is `"0.1"`, `format` is `"patchkamer-skin"`, `formatVersion` is `1`.
- `id`, `name`, `description` en de verschijningsnamen zijn Engels en merkvrij; `license` is `CC0-1.0`.
- De CSS bevat geen `@import` en geen externe `url(`; afbeeldingen staan in `assets` en worden met `var(--skin-asset-<naam>)` gebruikt.
- Er staan alleen selectors, klassen en variabelen in die je in het apparaatbestand hebt gezien.
- `node skins/contract/validate-skin.mjs <bestand>` geeft één `OK`-regel zonder `let op`.
- Een eventueel `icon.svg` is 24×24 lijnwerk zonder script of externe verwijzing en hoogstens 200 kB.
- Er staan geen geheimen of persoonlijke gegevens in.
- Je hebt in je oplevering gemeld wat je niet hebt kunnen testen (bijvoorbeeld hoe de skin in de host eruitziet).
