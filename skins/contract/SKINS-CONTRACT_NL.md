# Patchkamer — Skinscontract v0.9 voor bouwende agents

Dit document is de volledige, zelfstandige instructie om een **skin** te bouwen voor **Patchkamer**: een los bestand dat het uiterlijk van één apparaat verandert, zonder het apparaat zelf of het apparaatcontract aan te raken. Een agent die dit document krijgt, heeft geen andere context nodig. Lever een bestand `naam.patchkamer-skin.json` op dat aan dit contract voldoet en zonder fouten door `validate-skin.mjs` komt.

_Dit contract staat in twee talen: `SKINS-CONTRACT_NL.md` (Nederlands, de brontekst) en `SKINS-CONTRACT_EN.md` (English). Beide hebben dezelfde versie en dezelfde inhoud; verschillen ze, dan geldt de Nederlandse tekst. De validator spreekt ook beide talen (`--lang nl|en`)._

_Dit contract is een eigen contract naast het apparaatcontract (`../../contract/PATCHKAMER-CONTRACT_NL.md`, nu v1.24) en heeft een eigen versienummer. Een skin stelt niets van een apparaat voor: er is geen wijziging aan apparaten nodig._

| Versie | Wat erbij kwam |
|---|---|
| v0.1 | Eerste versie, bewust klein: een manifest, verschijningsvormen met CSS en ingesloten afbeeldingen, automatisch wisselen op kaartbreedte en schermklasse, een icoon per skin en per apparaat. De inhoud van een skin is een placeholder; de eisen voor artwork, regelaargrafiek en indeling volgen later (§13) |
| v0.2 | Laag 1: het veld `design` met ontwerpkeuzes die op alle apparaten werken (poortenmodus, kleurenschema, haptiek, stijl en grootte van de hostknop), op skinniveau en per verschijningsvorm (§4b). Skins van 0.1 blijven ongewijzigd werken |
| v0.3 | Laag 2, release A "id's en rollen": `design.controls`, een geordende lijst regels die per id, rol of groep het gezicht (draaiknop, horizontale of verticale schuif), de maat, de lengte, de dikte, de duim, de kleur en de waardeweergave van regelaars kiest (§4b). Hoort bij apparaatcontract v1.15. Skins van 0.1 en 0.2 blijven ongewijzigd werken |
| v0.4 | Laag 2, release C "meters": `design.meters`, een geordende lijst regels die per id, groep of overal het gezicht van een meter kiest (balk, ledladder of rond VU met wijzer die een balk vervangt, nooit ernaast), de richting, de lengte en de breedte, de ballistiek (val), het piekstreepje, het clip-lampje, de schaal, de kleur en het aantal ledjes (§4b). Hoort bij apparaatcontract v1.18 (`host.ui.meter`). Skins van 0.1 tot en met 0.3 blijven ongewijzigd werken |
| v0.5 | Laag 2, release B1 "secties": `design.sections`, een geordende lijst regels die per groep of overal een kader (lijn, verhoogd, inzet, zwevend), kolommen, tussenruimte, "kaal" (de regelaars verliezen hun eigen kader), de plaats van het label (boven, onder met de waarde erboven) en de uitlijning kiest, en `design.size`, de kaartbreedte die bij een verschijningsvorm hoort (§4b). Geen apparaatwijziging nodig: een groep wordt een sectie als de apparaat-DOM dat toelaat. Skins van 0.1 tot en met 0.4 blijven ongewijzigd werken |
| v0.6 | Laag 2, release D "pads en schermpje": `design.pads` (vorm cirkel, vierkant, afgerond of rechthoek; maat; kleur per pad, per palet of van het apparaat; rust neutraal of getint; actief als vlak, rand, gloed of niets; een ledje in het midden, boven, onder, links of rechts; klik- en raakfeedback; tussenruimte tussen stapknoppen) en `design.display` (het schermpje: LCD, OLED, zevensegment of papier in plaats van een keuzelijst, met < > en [ok], vergroten door erop te klikken) (§4b). Hoort bij apparaatcontract v1.22 (`host.ui.pad`, `host.ui.display`, `host.ui.steps` met opties). Skins van 0.1 tot en met 0.5 blijven ongewijzigd werken |
| v0.7 | Laag 2, release B2 "panelen en volgorde": `design.layout`, waarmee een skin de regelaars van een apparaat in **panelen** zet en in een **volgorde** (`flow` rows/columns/auto; per paneel `id`, `title`, `items` met id, `role:<rol>`, `group:<groep>` of `*`, `style`, `dir`, `cols`, `gap`, `bare`, `labels`, `align`, `width`, `collapsible`, `collapsed`) (§4b). Een skin herschikt alleen en verbergt nooit iets: wat niet genoemd wordt komt in een restpaneel. Geen apparaatwijziging; apparaatcontract blijft v1.22 (de id's en groepen die een apparaat al publiceert zijn nu ook de adressen voor panelen). Skins van 0.1 tot en met 0.6 blijven ongewijzigd werken |
| v0.8 | Gezichten met type en gebruikskleur: `activeColor` bij `design.controls` (de kleur van wijzer, gevuld deel of duim terwijl je de regelaar gebruikt, naast `color` voor de rust) en `design.pads.rules`, een lijst regels per pad (id, `role:<rol>` of `group:<groep>`) met `kind` (`toggle` blijft aan tot je weer drukt, `pad` klinkt zolang je drukt, `velocity` zoals `pad` maar de host meet de aanslag), `color` (kleur in rust), `activeColor` (kleur als het pad aan staat of ingedrukt is) en `led` (§4b). Een skin die `kind` kiest, verandert voor het eerst wat een knop **doet** en niet alleen hoe hij eruitziet; dat geldt alleen voor pads die de host tekent (`host.ui.pad`). Apparaatcontract v1.32: `onpress(e, velocity)` en `onchange(on, velocity)` krijgen een tweede argument (1 tot 127). Skins van 0.1 tot en met 0.7 blijven ongewijzigd werken |
| v0.9 | Elementen en decor: `design.elements`, een lijst regels die één element van de kaart aanwijst met een korte sleutel (`target`, vanaf de wortel) en een veilige lijst eigenschappen opmaakt (kleuren, rand, afronding, ruimte, letter, dekking, schaduw), en `design.decor`, een lijst toegevoegde labels, blokken en lijnen naast of in een element (§4b). Zo kan een skin ook de koppen, blokken en knoppen opmaken die een apparaat zelf tekent, en er onderdelen bijzetten; verbergen of verplaatsen kan niet. Skins van 0.1 tot en met 0.8 blijven ongewijzigd werken |

---

## 1. Doel en reikwijdte

- Een **skin** verandert alleen het **uiterlijk** van één apparaat. Een skin raakt nooit de state, het geluid, de poorten of het gedrag van het apparaat.
- Een skin is **één bestand** met data (JSON). Het bevat geen script en geen apparaatcode. De CSS erin wordt door de host in de shadow root van het apparaat gezet.
- Een skin hoort bij **één apparaat-id** (het veld `device`). Voor een ander apparaat wordt hij bewaard maar nergens aangeboden.
- Een apparaat hoeft niets te doen om skins te kunnen krijgen. Heeft het apparaat geen open shadow root (zie §4), dan kan de host de skin niet toepassen en meldt dat; dat is geen fout van de skin of van het apparaat.
- Skins zijn een nieuw soort bibliotheekmateriaal naast tunes en presets: ze worden geladen uit bronnen (een GitHub-map, een lokale map, een adres), bekeken in een eigen paneel, gekozen per apparaat op de kaart, bewaard in de werkruimte en in de song, en kunnen op het canvas worden gedropt (§8, §9).
- Versie 0.9 blijft bewust klein: CSS plus een kleine set ontwerpkeuzes (`design`, §4b), waaronder het gezicht van regelaars (`controls`), van meters (`meters`), de opmaak van secties (`sections`, `size`) het gezicht van pads (`pads`) en schermpjes (`display`) en de indeling in panelen (`layout`) en de opmaak en aanvulling van de elementen van de kaart (`elements`, `decor`). Het formaat is uitbreidbaar (onbekende velden worden genegeerd, §10); wat er nog niet in zit staat in §13.

---

## 2. Het bestand

Een skin is een UTF-8 JSON-bestand met één object, genaamd `naam.patchkamer-skin.json`: kleine letters met streepjes, **zonder versienummer** in de naam (de versie staat in `version`, eerdere versies in git). Het bestand is hoogstens 2 MB.

### 2a. Velden op het bovenste niveau

| Veld | Type | Bereik en regel | Standaard | Verplicht |
|---|---|---|---|---|
| `format` | tekst | altijd `"patchkamer-skin"` | | ja |
| `formatVersion` | geheel getal | nu `1` | | ja |
| `skinsContract` | tekst | `"major.minor"`, nu `"0.9"` (`"0.1"` tot en met `"0.8"` blijven geldig); zie §10 | | ja |
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
| `design` | object | ontwerpkeuzes voor alle verschijningsvormen (§4b); sinds 0.2 | geen | nee |
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
| `design` | object | ontwerpkeuzes voor alleen deze verschijningsvorm; overschrijft het `design` van de skin per sleutel (§4b) | geen | nee |

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

## 4b. Ontwerpkeuzes (`design`, vanaf 0.2; `controls` vanaf 0.3; `meters` vanaf 0.4; `sections` en `size` vanaf 0.5; `pads` en `display` vanaf 0.6; `layout` vanaf 0.7)

Naast CSS kan een skin vanaf versie 0.2 een set **gevalideerde ontwerpkeuzes** meebrengen in het veld `design`. Anders dan CSS werken die keuzes op **alle apparaten** via de host, zonder dat een apparaat iets hoeft te doen (met de beperkingen hieronder). `design` staat op skinniveau (de standaard voor alle verschijningsvormen) en mag per verschijningsvorm worden overschreven met `appearances[].design`.

```json
"design": {
  "ports":   { "mode": "default|always|hover|strip|bar" },
  "colors":  { "scheme": "workspace|custom",
               "custom": { "bg": "#rrggbb", "surface": "#rrggbb", "text": "#rrggbb", "muted": "#rrggbb", "accent": "#rrggbb", "line": "#rrggbb" } },
  "haptics": { "click": "off|light|medium|strong", "turn": "off|light|medium|strong", "slide": "off|light|medium|strong" },
  "knobs":   { "style": "workspace|rotary|slider", "size": "s|m|l" },
  "controls": [ { "match": "*|<id>|role:<rol>|group:<groep>", "face": "rotary|hslider|vslider|default", "size": "xs…xl|0.6..2", "length": "short|medium|long|40..400", "thickness": 2, "thumb": "round|square|bar|none", "color": "accent|#rrggbb", "showValue": "always|hover|never" } ],
  "meters": [ { "match": "*|<id>|group:<groep>", "face": "bar|ledladder|vu|default", "orientation": "auto|vertical|horizontal", "length": "short|medium|long|24..400", "width": 8, "ballistics": "default|fast|vu|slow", "peakHold": "on|off|default", "clip": "show|hide|default", "scale": "show|hide", "color": "accent|default|#rrggbb", "segments": 20 } ],
  "sections": [ { "match": "*|group:<groep>", "frame": "none|line|raised|inset|floating|default", "columns": "auto|1..12", "gap": "tight|normal|wide", "bare": false, "labels": "default|above|below", "align": "start|center" } ],
  "pads":    { "shape": "circle|square|rounded|rect", "size": "xs…xl|0.6..2", "color": "neutral|device|palette", "palette": ["#rrggbb", "…"], "colors": { "<id>|role:step|group:<groep>": "#rrggbb" }, "idle": "neutral|tint", "active": "fill|border|glow|none", "led": "none|center|top|bottom|left|right", "hit": "flash|none", "press": "depress|glow|none", "gap": "tight|normal|wide" },
  "display": { "style": "dropdown|lcd|oled|segment|paper", "nav": "arrows|arrows+ok|none", "commit": "live|ok", "lines": 1, "width": "auto|80..400", "expand": "click|button|off", "targets": ["select", "preset", "tune"], "color": "accent|default|#rrggbb" },
  "layout":  { "flow": "auto|rows|columns",
               "panels": [ { "id": "osc", "title": "text|{nl,en}", "titlePos": "top|left|hidden", "items": ["<id>", "role:<rol>", "group:<groep>", "*"], "style": "raised|inset|line|floating|plain", "dir": "row|column|grid", "cols": "auto|1..16", "gap": "tight|normal|wide", "bare": false, "labels": "default|above|below", "align": "start|center", "width": "auto|full|half|third", "collapsible": false, "collapsed": false } ] },
  "size":    { "width": 380 }
}
```

### Overzicht en samenvoegen

- **Alle sleutels zijn optioneel.** Een ontbrekende sleutel betekent: het gedrag van het apparaat zelf of van de werkruimte (de waarde `default`, `workspace` of `off` hieronder). Een skin zonder `design` (ook elke skin van 0.1) gedraagt zich exact zoals voorheen.
- **Samenvoegen:** de host neemt het `design` van de skin en legt daar het `design` van de gekozen verschijningsvorm overheen, **per sleutel** (en in `colors.custom` per kleur). Een verschijningsvorm hoeft dus alleen te herhalen wat anders is.
- **Soepel in de host, streng in de validator:** de host negeert een ongeldige waarde of onbekende sleutel (die ene sleutel valt terug op het standaardgedrag) en meldt het; de validator geeft bij een ongeldige waarde een **fout** en bij een onbekende sleutel een `let op`. Onbekende sleutels en secties horen bij latere versies (§13) en worden genegeerd.
- **Standaard wist alles:** kiest de gebruiker op de kaart Standaard (geen skin), dan zijn kaart, apparaat en kabels exact zoals zonder skin.
- `design` hoort bij `skinsContract` `"0.2"` (`controls` bij `"0.3"`, `meters` bij `"0.4"`, `sections` en `size` bij `"0.5"`, `pads` en `display` bij `"0.6"`, `layout` bij `"0.7"`, `activeColor` en `pads.rules` bij `"0.8"`, `elements` en `decor` bij `"0.9"`). In een bestand met `"0.1"` negeert een 0.1-host het; de validator geeft daar een `let op`, en ook voor `controls` in een 0.2-bestand, voor `meters` in een 0.3-bestand en voor `sections` of `size` in een 0.4-bestand of lager en voor `pads` of `display` in een 0.5-bestand of lager en voor `layout` in een 0.6-bestand of lager.

### Poortenmodus (`ports.mode`)

De kabelpoorten staan bovenaan het apparaat, als de achterkant van een apparaat. De modus bepaalt wanneer ze zichtbaar zijn:

| Waarde | Wat |
|---|---|
| `default` | zoals nu: het gedrag van de host blijft ongewijzigd |
| `always` | de poortenbalk is altijd zichtbaar bovenaan het apparaat (zoals bij het mengpaneel) |
| `hover` | de poorten zijn verborgen; ze verschijnen bovenaan zodra je met een kabel (tijdens slepen) over het apparaat gaat, of met de muis over de poortenstrook bovenaan |
| `strip` | een dunne poortenstrook bovenaan is altijd zichtbaar; de muis (met of zonder kabel) over die strook of over het apparaat toont alle poorten |
| `bar` | de poorten staan altijd zichtbaar als kleine stipjes in de titelbalk, tussen de naam van het apparaat en de versiekeuze; de balk wordt niet groter (de naam krimpt als er te weinig ruimte is) en kabels hangen aan de stipjes |

```
 default / always              hover or strip, closed         hover or strip, open
+-------------------------+   +-------------------------+   +-------------------------+
| [in] [in] [out] [mod]   |   |=========== strip ======|   | [in] [in] [out] [mod]   |
+-------------------------+   +-------------------------+   +-------------------------+
|                         |   |                         |   |                         |
|       device UI         |   |       device UI         |   |       device UI         |
|                         |   |                         |   |                         |
+-------------------------+   +-------------------------+   +-------------------------+
 (default: zoals eerder;        (hover: geen strook, poorten   (een kabel boven het apparaat
  always: balk blijft staan)     verborgen tot nodig)           of de muis boven de strook)
```

- **Touch** (geen hover): `hover` en `strip` openen en sluiten door te tikken op de strook, en tonen de poorten ook tijdens het slepen van een kabel over het apparaat.
- **Kabels blijven kloppen:** een verborgen poort tekent zijn kabel naar de strook (geen kabels die in het niets eindigen), en koppelen op een verborgen poort door een kabel over het apparaat te slepen kan: de poorten klappen open zodra de kabel erboven komt. Dit geldt voor alle soorten poorten (audio, midi, mod, mastering, event en de andere).
- **Uitzondering:** een apparaat dat zijn poorten in de eigen UI tekent (`ui.jacks: true`) houdt de modus `default`; het Skins-paneel meldt dat.

### Kleurenschema (`colors`)

| Sleutel | Waarden | Standaard |
|---|---|---|
| `scheme` | `workspace`: de kleuren van de werkruimte; `custom`: de kleuren uit `custom` | `workspace` |
| `custom` | object met de zes kleuren hieronder | geen |

Elke kleur is `#rgb` of `#rrggbb` (hoofdletters mogen; de host maakt er zes kleine cijfers van). Andere schrijfwijzen (`rgb()`, namen, acht cijfers) worden geweigerd.

| Kleur | Betekenis |
|---|---|
| `bg` | achtergrond van de kaart en het apparaat |
| `surface` | vlakken op de achtergrond (panelen, titelbalk, poortenbalk) |
| `text` | gewone tekst |
| `muted` | bijzaken, labels en uitgeschakelde tekst |
| `accent` | de accentkleur (actieve onderdelen, markeringen) |
| `line` | randen en scheidingslijnen |

- **De host past de kleuren toe als CSS-variabelen** op het hostelement van het apparaat en op de kaart zelf (titelbalk, poortenbalk), **niet** op de werkruimte. Het effect op een apparaat hangt ervan af of het apparaat die variabelen gebruikt; wat de host echt zet, staat hieronder.
- Mist een kleur bij `scheme: "custom"`, dan valt die terug op de werkruimtekleur (het paneel meldt dat; de skin wordt niet geweigerd).
- **Contrast:** de validator rekent het contrast van `text` tegen `bg` en tegen `surface` uit (WCAG-verhouding); onder 3:1 geeft hij een `let op`. Het is geen weigering.

**Welke skinkleur welke variabele zet** (alleen bij `scheme:"custom"` en alleen voor ingevulde kleuren; als inline stijl op de kaart en op het apparaat zelf, dat erft door in de shadow root):

| Skinkleur | Op de kaart | Op het apparaat |
|---|---|---|
| `bg` | `--card` | `--card`, `--floor`, `--bg`, `--panel` |
| `bg` (afgeleid) | `--well`, `color-scheme` | idem |
| `surface` | `--card-2`, `--bar`, `--field` | idem, plus `--panel-2` |
| `surface` (afgeleid) | `--step-q` | idem |
| `text` | `--fg`, `--bar-fg`, `--field-fg`, `--well-fg` | idem |
| `muted` | `--muted` | `--muted` |
| `accent` | `--sel`, `--accent` | idem, plus `--audio` |
| `line` | `--line` | `--line` |

Een apparaat dat eigen variabelen of vaste kleuren gebruikt, volgt alleen wat in deze tabel staat. `--audio` wordt alleen op het apparaat gezet, zodat poorten en kabels hun kleur per soort houden.

### Haptiek (`haptics`)

| Sleutel | Wanneer de host trilt |
|---|---|
| `click` | bij knoppen en pads (`button`, `[role=button]`, en een druk op andere klikbare onderdelen in de kaart) |
| `turn` | bij het draaien aan een draaiknop van de host (`host.ui.knob`), per stap |
| `slide` | bij het schuiven aan een `range`-invoer, per stap |

Waarden: `off` (geen), `light` (8 ms), `medium` (15 ms), `strong` (30 ms); standaard `off`.

- De host gebruikt `navigator.vibrate` (één korte puls). Hij trilt **niet** als het apparaat dat niet ondersteunt (bijvoorbeeld Safari op iPhone), als de gebruiker `prefers-reduced-motion` heeft, of als de pagina op de achtergrond staat.
- **Begrenzing:** hoogstens één puls per 40 ms per kaart; bij `turn` en `slide` per stap (niet per pixel) en hoogstens 25 pulsen per seconde.
- De host luistert op de kaart (de events zijn `composed`), dus ook bij onderdelen in open shadow roots van het apparaat.
- Haptiek verandert het geluid en de state niet.

### Draaiknoppen (`knobs`)

| Sleutel | Waarden | Standaard |
|---|---|---|
| `style` | `workspace`: de globale instelling van de werkruimte; `rotary`: draaiknoppen; `slider`: schuifregelaars | `workspace` |
| `size` | `s`, `m`, `l`: de host-knop op ongeveer 0,8, 1 en 1,3 maal de normale grootte | `m` |

Dit werkt **alleen op wat via `host.ui.knob` is gebouwd**. Sinds 0.3 is dit de korte vorm van een `controls`-regel (zie hieronder); voor eigen `range`-invoeren van een apparaat zijn `controls` het middel, mits het apparaat ze aanmeldt. Het Skins-paneel meldt dat eerlijk: "werkt op apparaten die de hostknop gebruiken", met het aantal apparaten dat dat doet.

### Regelaars (`controls`, vanaf 0.3)

Met `design.controls` kiest een skin het **gezicht, de maat en de kleur van regelaars**: draaiknoppen in plaats van schuiven (of andersom), verticale of horizontale schuiven, lengte, dikte, duim en of de waarde te zien is. Het is een **geordende lijst regels**; elke regel heeft een `match` en een of meer eigenschappen.

```json
"design": {
  "controls": [
    { "match": "*",            "face": "rotary", "size": "m" },
    { "match": "role:fader",   "face": "vslider", "length": "long", "thumb": "bar" },
    { "match": "group:filter", "color": "#ffb000" },
    { "match": "cut",          "size": "xl", "showValue": "always" }
  ]
}
```

| Sleutel | Waarden | Betekenis |
|---|---|---|
| `match` (verplicht) | `"*"`, een id (`"cut"`), `"role:<rol>"` of `"group:<groep>"` | Welke regelaars de regel raakt. Id's, rollen en groepen publiceert het apparaat (apparaatcontract §12d). Een id is 1 tot 60 tekens uit `[A-Za-z0-9._-]`; rollen: `param`, `fader`, `toggle`, `button`, `pad`, `step`, `display`, `select`, `meter`, `jack`. |
| `face` | `rotary`, `hslider`, `vslider`, `default` | Het gezicht: draaiknop, horizontale schuif, verticale schuif, of wat het apparaat zelf vroeg (`default`). Een skin kan het model (waarde, events) niet raken, alleen hoe de regelaar eruitziet. |
| `size` | `xs`, `s`, `m`, `l`, `xl`, of een getal 0,6 tot 2,0 | Schaal ten opzichte van de normale grootte. |
| `length` | `short`, `medium`, `long`, of een getal 40 tot 400 (px) | Lengte van een schuif. |
| `thickness` | getal 2 tot 24 (px) | Dikte van het spoor van een schuif. |
| `thumb` | `round`, `square`, `bar`, `none` | De duim (het grijpstuk) van een schuif. |
| `color` | `"accent"` of `#rgb` / `#rrggbb` | Kleur van de wijzer, het gevulde deel of de duim, in rust. |
| `activeColor` | `#rgb` / `#rrggbb` | Kleur van dezelfde onderdelen terwijl je de regelaar gebruikt (muis of aanraking ingedrukt; bij een draaiknop ook met het toetsenbord). Zonder `activeColor` blijft de kleur gelijk (0.8). |
| `showValue` | `always`, `hover`, `never` | Of het getal naast de regelaar zichtbaar is. |

- **Volgorde:** de regels worden op volgorde toegepast; per eigenschap wint de **laatste passende regel**. Zet dus de algemene regels (`"*"`) bovenaan en de bijzondere (`"cut"`) onderaan.
- **Samenvoegen:** de regels van het `design` van de gekozen verschijningsvorm komen **achter** die van de skin, en winnen dus. Het maximum is **64 regels** per lijst; wat erboven komt, wordt genegeerd (de validator geeft een fout).
- **Korte vorm:** `knobs.style` en `knobs.size` (0.2) blijven werken en zijn gelijk aan een regel `{ "match": "role:param", "face": …, "size": … }` die vóór alle `controls`-regels staat; een `controls`-regel wint dus altijd.
- **Een skin verbergt nooit een regelaar.** Er is geen `face: "none"` en geen sleutel om iets weg te laten. De validator geeft daar een fout voor, de host negeert het.
- **Bereik:** de regels werken alleen op regelaars die het apparaat aanmeldt: wat via `host.ui.knob` is gebouwd en elementen die het apparaat met `host.ui.adopt` of `data-pk-*` heeft aangemeld (apparaatcontract §12d). Apparaten die niets aanmelden, blijven ongemoeid; het Skins-paneel meldt "n van m regelaars" zodat je ziet hoeveel er meedoen. `length`, `thickness` en `thumb` raken alleen schuiven; bij `face: "rotary"` doen ze niets (de validator geeft een `let op`).
- **Onbekende id's:** een `match` met een id, rol of groep die het apparaat niet heeft, wordt door de host stil genegeerd. De validator ziet dat niet zonder het apparaat (`let op` bij een rol die niet in de lijst staat); met `--device` wel (zie §12).
- **Standaard:** zonder skin, of zonder `controls`, is het apparaat exact zoals het was.
- **Toegankelijkheid** blijft: een ander gezicht houdt toetsenbord, aanraking, dubbelklik (beginwaarde) en typen werkend. Een skin kan dat niet uitzetten.

### Meters (`meters`, vanaf 0.4)

Met `design.meters` kiest een skin het **gezicht en de maat van meters**: een balk, een rij ledjes of een ronde VU-meter met een wijzer die van links naar rechts uitslaat, en hoe lang, hoe breed en hoe snel hij reageert. Een **VU-gezicht vervangt de balk op dezelfde plek**; het komt er niet naast. Net als bij `controls` is het een **geordende lijst regels** met een `match` en een of meer eigenschappen. Het werkt alleen op meters die het apparaat door de host laat tekenen met `host.ui.meter` (apparaatcontract §12e); een meter die een apparaat zelf tekent, blijft zoals hij was.

```json
"design": {
  "meters": [
    { "match": "*",            "face": "ledladder", "segments": 16, "ballistics": "fast" },
    { "match": "group:meters", "orientation": "vertical", "length": "long", "width": 8 },
    { "match": "met.master",   "face": "vu", "length": 180, "scale": "show", "color": "accent" }
  ]
}
```

| Sleutel | Waarden | Betekenis |
|---|---|---|
| `match` (verplicht) | `"*"`, een id (`"met.master"`) of `"group:<groep>"` | Welke meters de regel raakt. Id's en groepen publiceert het apparaat (apparaatcontract §12e). Er is geen `role:`; elke meter heeft rol `meter`. Een id is 1 tot 60 tekens uit `[A-Za-z0-9._-]`. |
| `face` | `bar`, `ledladder`, `vu`, `default` | Het gezicht: balk (de gewone look van het apparaat), een rij losse ledjes (groen, geel, rood volgens dezelfde drempels als de balk), een halve ronde schaal met een wijzer (`vu`; rood vanaf 3 dB onder het maximum; bij twee kanalen twee wijzers in een verschillende tint op één schaal), of wat het apparaat zelf vroeg (`default`). |
| `orientation` | `auto`, `vertical`, `horizontal` | De richting van een balk of ledladder; `auto` is de keuze van het apparaat. Een `vu` negeert het, want zijn schaal is altijd horizontaal. |
| `length` | `short`, `medium`, `long`, of een getal 24 tot 400 (px) | De lengte in de uitslagrichting: de hoogte bij `vertical`, de breedte bij `horizontal`; bij `vu` de breedte van de wijzerplaat (de hoogte is dan 0,6 keer de lengte). |
| `width` | getal 3 tot 48 (px) | De dikte van een balk of ledladder. Bij `vu` genegeerd (de validator geeft een `let op`). |
| `ballistics` | `default`, `fast`, `vu`, `slow` | Hoe de uitslag valt: `default` is het apparaat, `fast` springt direct omhoog en valt met ongeveer 24 dB per seconde (de huidige Mixer-look), `vu` is een klassieke VU (300 ms integratie, rustige aanloop en terugval), `slow` springt direct omhoog en valt met ongeveer 6 dB per seconde. Bij gezicht `vu` zonder opgegeven waarde is dat `vu`, anders `default`. De host rekent dit op één plek uit; het geluid verandert niet. |
| `peakHold` | `on`, `off`, `default` | Het piekstreepje dat langzaam valt. |
| `clip` | `show`, `hide`, `default` | Het clip-lampje. Het blijft alleen zichtbaar als het apparaat een clip-drempel heeft gezet, of als de skin `show` kiest (de drempel is dan het maximum van de schaal). |
| `scale` | `show`, `hide` | Streepjes en dB-cijfers. Alleen bij `vu` en `ledladder`; standaard is de schaal bij `vu` te zien en bij `bar` niet. |
| `color` | `"accent"`, `"default"` of `#rgb` / `#rrggbb` | Kleur van het gewone deel van de meter. De drempels voor geel en rood blijven. |
| `segments` | geheel getal 8 tot 40 | Het aantal ledjes van een `ledladder` (standaard 20). |

- **Volgorde en samenvoegen** zijn als bij `controls`: de **laatste passende regel wint per eigenschap**; de regels van de verschijningsvorm komen achter die van de skin; hoogstens **64 regels** per lijst (de validator geeft een fout bij meer).
- **Een skin verbergt of zet nooit iets.** Er is geen `face: "none"` en geen sleutel om een meter weg te laten; een skin raakt ook geen waarde. De validator geeft er een fout voor, de host negeert het.
- **Standaard:** zonder skin, of zonder `meters`, is het gezicht en de maat die van het apparaat zelf.
- **Ruimte:** een `vu` heeft minstens 56 × 36 px nodig. De host vergroot daarvoor het element van de meter, en de layout van het apparaat groeit mee (een kanaalstrook van de Mixer wordt dan breder). Het Skins-paneel meldt dat. Kies bij een mixer met veel kanalen liever `ledladder` of een korte `bar` als de kaart te breed wordt.
- **Onbekende id's:** een `match` met een id of groep die het apparaat niet heeft, wordt door de host stil genegeerd. De validator ziet dat niet zonder het apparaat; met `--device` wel, als `let op` (zie §12). Het Skins-paneel meldt "n van m meters".
- **Toegankelijkheid:** elk gezicht blijft een `role="meter"` met waarde, minimum, maximum en label voor schermlezers.

### Secties (`sections`, vanaf 0.5) en kaartbreedte (`size`)

Met `design.sections` geeft een skin de **groepen regelaars van een apparaat een eigen opmaak**: een kader om bijvoorbeeld het filter, de regelaars dichter bij elkaar zonder eigen kader, een vast aantal kolommen (3 kolommen is 3 × 3 bij negen regelaars) en het label onder de regelaar. Net als bij `controls` en `meters` is het een **geordende lijst regels**; de laatste passende regel wint per eigenschap. Met `design.size` hoort bij een verschijningsvorm een **kaartbreedte**, zodat "Compact" het hele apparaat kleiner maakt.

```json
"design": {
  "size": { "width": 380 },
  "sections": [
    { "match": "*",           "frame": "line", "columns": 3, "gap": "tight", "bare": true, "labels": "below" },
    { "match": "group:setup", "columns": 2 }
  ]
}
```

| Sleutel | Waarden | Betekenis |
|---|---|---|
| `match` (verplicht) | `"*"` of `"group:<groep>"` | Welke secties de regel raakt: alle, of de sectie van één groep uit het register van het apparaat (`node contract/validate-instrument.mjs <apparaat> --controls`). Geen id en geen `role:`: een sectie is een groep. De groepsnaam is 1 tot 60 tekens uit `[A-Za-z0-9._-]`. |
| `frame` | `none`, `line`, `raised`, `inset`, `floating`, `default` | Het kader om de sectie. `line`: dunne rand in de lijnkleur (`--line`) met afgeronde hoeken. `raised`: iets lichtere vlakkleur met schaduw. `inset`: donkerder put met binnenschaduw. `floating`: zweeft, met een ruime schaduw en een kleine marge. `none`: geen kader. `default`: geen ingreep, het apparaat houdt zijn eigen opmaak. De kleuren komen uit de actieve kleuren van de skin of de werkruimte. |
| `columns` | `auto` of een geheel getal 1 tot 12 | Het aantal kolommen. `auto` vult de breedte, met een kolombreedte die de regelaar volgt; een getal geeft vaste kolommen. Het element van de sectie wordt dan een raster; knoppen en andere elementen in de sectie doen als cel mee. |
| `gap` | `tight`, `normal`, `wide` | De tussenruimte tussen de cellen (ongeveer 2 tot 4 px bij `tight`); de binnenmarge van het kader volgt dit. |
| `bare` | `true`, `false` | `true`: de regelaars in de sectie verliezen hun **eigen** kader, achtergrond, schaduw en grote binnenmarge. Alleen de eigen vlakstijl van het apparaat wordt uitgezet, de regelaar zelf blijft. |
| `labels` | `default`, `above`, `below` | De plaats van het label. `below`: per regelaar staat de waarde bovenaan, dan de regelaar, dan het label, gecentreerd (voorbeeld: "2400 Hz", knop, "Cutoff"). `above` zet het label boven de regelaar. `default`: het apparaat. |
| `align` | `start`, `center` | De uitlijning van regelaars in hun cel. Standaard `start`, bij `labels: "below"` `center`. |
| `size.width` | getal 200 tot 1600 (px) | De kaartbreedte die bij de verschijningsvorm hoort (zie hieronder). |

**Wat is een sectie.** Een sectie is het element dat **precies de regelaars van één groep** bevat. De host zoekt het laagste gemeenschappelijke voorouder-element van alle regelaars van het register met die groep (ook door open shadow roots heen) en accepteert het alleen als alle regelaars daarin dezelfde groep hebben. De regel wordt dan niet toegepast, en het Skins-paneel meldt eerlijk "n van m secties toegepast", als:

- een groep geen eigen element heeft, of het element ook regelaars van een **andere** groep bevat (het apparaat zet twee groepen door elkaar);
- de groep onbekend is bij het apparaat (de host negeert de regel; de validator geeft met `--device` een `let op`);
- het apparaat zijn regelaars niet aanmeldt (geen id's en groepen, apparaatcontract §12d), of de DOM van een apparaat niet te herkennen is (dan blijft het label staan waar het stond en telt de sectie wel mee in de statistiek).

Wat niet een regelaar is (knoppen, koppen, andere tekst) in het element van de sectie blijft zoals het is; alleen bij `columns` doet het als cel mee. Voor `labels` en `bare` herkent de host het label van een regelaar bij `host.ui.knob` en bij geadopteerde elementen (`host.ui.adopt`).

**Wat een skin hier wel en niet kan.**

- De host zet alleen CSS en attributen op bestaande elementen. Er wordt **niets herschikt of verplaatst** in de DOM, en een skin **verbergt niets** en zet geen waarden.
- **Standaard** (geen skin, of geen `sections` of `size`) is alles exact zoals het was. Kiest de gebruiker Standaard, dan is de opmaak weer precies terug.
- Hoogstens **32 regels** per lijst; de regels van de verschijningsvorm komen achter die van de skin. De validator geeft een fout bij meer, en bij een waarde buiten de lijst of het bereik. Een `match` met een onbekende groep negeert de host; de validator geeft met `--device` een `let op`.
- **Scrollen.** Veel regelaars onder elkaar geven een hoge kaart waar je ver doorheen scrolt. Richtlijn: **een skin beperkt de hoogte zelf** door kolommen te kiezen (bijvoorbeeld 3) en een passende `size.width`. Een skin voegt geen eigen scroll-container toe; dat kan ook niet.

**Kaartbreedte (`size.width`).** `size` is de kaartbreedte in pixels die bij een verschijningsvorm hoort (200 tot 1600). De host past die **alleen** toe wanneer de gebruiker de verschijningsvorm of de skin **met de hand** kiest; niet bij Auto (dat wisselt op breedte, en zou anders blijven wisselen) en niet opnieuw bij elke sync. Daarna kan de gebruiker de kaart gewoon weer groter of kleiner maken. Zo maakt een verschijningsvorm "Compact" het hele apparaat kleiner. Een `size` op skinniveau geldt voor elke verschijningsvorm die er zelf geen heeft.

### Pads (`pads`, vanaf 0.6)

Met `design.pads` kiest een skin **vorm, maat, kleur en feedback van pads**: de drukknoppen die een apparaat met `host.ui.pad` laat tekenen (apparaatcontract §12f), de stapknoppen van `host.ui.steps` met opties en eigen pad-knoppen die het apparaat met `data-pk-role="pad"` of `"step"` aanmeldt. Anders dan `controls` en `meters` is `pads` **één object** (geen lijst regels); een eigen kleur per pad staat in `colors`. Het werkt alleen op pads die het apparaat zo aanmeldt; een pad die een apparaat helemaal zelf tekent, blijft zoals hij was.

```json
"design": {
  "pads": {
    "shape": "circle", "size": "m", "color": "device", "idle": "tint", "active": "fill", "led": "center", "hit": "flash", "press": "depress", "gap": "normal",
    "colors": { "pat.kick": "#ff5a4f", "role:step": "#8899aa", "group:hat": "#3ddcff" }
  }
}
```

| Sleutel | Waarden | Betekenis |
|---|---|---|
| `shape` | `circle`, `square`, `rounded`, `rect` | De vorm: rond, vierkant, afgerond vierkant (het standaardgezicht) of een liggende rechthoek van 3 : 2. Er is geen `none`: een skin verbergt geen pad. |
| `size` | `xs`, `s`, `m`, `l`, `xl`, of een getal 0,6 tot 2,0 | De maat ten opzichte van de standaardmaat van het apparaat. Bij stapknoppen (`.st`) vermenigvuldigt het hun huidige afmeting. |
| `color` | `neutral`, `device`, `palette` | Waar de kleur van een pad vandaan komt: `neutral` is één kleur uit het thema voor alle pads, `device` de kleur die het apparaat per pad opgaf (bijvoorbeeld per klank), `palette` de kleuren uit `palette`, cyclisch over de pads. Een pad zonder kleur van het apparaat valt terug op het thema. |
| `palette` | lijst van 2 tot 16 kleuren `#rgb` / `#rrggbb` | Het palet voor `color: "palette"`. De validator geeft een `let op` als `color` iets anders is. |
| `colors` | object `{ "<sleutel>": "#rrggbb" }`, hoogstens 64 sleutels | Een eigen kleur per pad; wint van `color` en `palette`. De sleutel is een id (`"pat.kick"`), `"role:<rol>"` (`"role:step"`) of `"group:<groep>"`. Een id of groep van het apparaat komt uit het register (`node contract/validate-instrument.mjs <apparaat> --controls`). |
| `idle` | `neutral`, `tint` | De rustkleur: `neutral` laat een pad in rust neutraal en laat hem bij actief oplichten in de eigen kleur; `tint` kleurt hem in rust al licht in de eigen kleur. |
| `active` | `fill`, `border`, `glow`, `none` | Hoe een actief pad (aan, of de stap staat aan) eruitziet: `fill` een vlak in de felle kleur, `border` een rand in de felle kleur op een donker vlak, `glow` een gloed eromheen, `none` geen verschil (alleen het ledje, als dat is gekozen). |
| `led` | `none`, `center`, `top`, `bottom`, `left`, `right` | Een ledje in het pad dat brandt bij actief, in de eigen kleur. |
| `hit` | `flash`, `none` | Feedback als het apparaat een pad laat oplichten zonder dat zijn stand verandert (`flash()`, een stap die afgaat, de afspeelcursor). |
| `press` | `depress`, `glow`, `none` | Feedback tijdens het indrukken: het pad zakt in, gloeit of niets. Alleen visueel. |
| `gap` | `tight`, `normal`, `wide` | De ruimte tussen de stapknoppen van `host.ui.steps`. |

**Per pad (`rules`, vanaf 0.8).** Naast de instellingen voor alle pads kan `rules` een lijst regels bevatten (hoogstens 64): per regel een `match` (`"*"`, een id, `"role:<rol>"` of `"group:<groep>"`) met een of meer van deze eigenschappen. De laatste passende regel wint per eigenschap; regels van de verschijningsvorm komen na die van de skin.

```json
"pads": { "rules": [
  { "match": "group:drums", "kind": "velocity", "color": "#2a3a4a", "activeColor": "#ff5a4f" },
  { "match": "pad.mute",    "kind": "toggle",   "led": "top" }
] }
```

| Sleutel | Waarden | Betekenis |
|---|---|---|
| `kind` | `toggle`, `pad`, `velocity` | Het type: `toggle` is aan/uit (klikt vast en blijft aan tot je weer drukt), `pad` klinkt zolang je drukt, zonder velocity, `velocity` is een pad waarbij de host de aanslag meet en meegeeft. Zonder `kind` doet het pad wat het apparaat vraagt. |
| `color` | `#rgb` / `#rrggbb` | De kleur in rust: het pad is licht in deze kleur getint. |
| `activeColor` | `#rgb` / `#rrggbb` | De kleur als het pad aan staat of wordt ingedrukt (de vulling, rand, gloed en het ledje). Zonder `activeColor` is het `color`. |
| `led` | `none`, `center`, `top`, `bottom`, `left`, `right` | Het ledje van dit pad (wint van `led` in de rest van `pads`). |

- **`kind` verandert gedrag, de enige plek waar een skin dat doet.** Het werkt alleen op pads die de host tekent met `host.ui.pad`; een pad dat het apparaat zelf tekent (ook met `data-pk-role="pad"`) en stapknoppen krijgen de kleuren maar houden hun gedrag. Het apparaat merkt het via zijn eigen aanroepen (device contract §12f): een `toggle` op een pad dat het apparaat als indrukken kent, roept `onpress` aan bij aanzetten en `onrelease` bij uitzetten; `pad` of `velocity` op een aan/uit-pad roept `onchange(true)` aan bij indrukken en `onchange(false)` bij loslaten. Haalt de skin het type weg terwijl een pad vastzit, dan laat de host het los.
- **Velocity** is een getal van 1 tot 127 als tweede argument van `onpress(e, velocity)` en `onchange(on, velocity)`: de aanraakdruk bij touch of pen als het scherm die meet, anders de plek van de klik in het pad (boven zacht, onder hard); het toetsenbord en `toggle` en `pad` geven 100. Een apparaat dat het argument negeert, klinkt gelijk.
- **Een skin verbergt of schakelt geen pad uit.** `kind` kiest alleen hoe je het pad bedient.

- **Samenvoegen:** `design.pads` wordt per sleutel samengevoegd (de verschijningsvorm over de skin), en `colors` per entry.
- **Standaard** (geen skin, of geen `pads`): de DOM, klassen en het uiterlijk van het apparaat zelf, ook bij stapknoppen en eigen pad-knoppen. Een nieuw pad van `host.ui.pad` heeft dan het neutrale standaardgezicht uit het thema.
- **De host zet alleen CSS-klassen, `data-pk-*` en de variabelen `--pk-pad-color` en `--pk-pad-size`** op het element. De klassen `on`, `cur` en `q` van het apparaat blijven van het apparaat. Een skin zet geen waarde en schakelt niets.
- **Een skin verbergt geen pad.** Er is geen `shape: "none"`; de validator geeft er een fout voor.
- **Contrast:** kies kleuren die tegen het kleurenschema te zien zijn; het Skins-paneel controleert eigen kleuren met de kleurkiezer van de ontwerper.
- **Onbekende id's:** een sleutel in `colors` die het apparaat niet heeft, negeert de host; de validator geeft met `--device` een `let op` (ook voor een id die geen pad of stap is).

### Schermpje (`display`, vanaf 0.6)

Met `design.display` kiest een skin het **gezicht van een keuzelijst**: in plaats van een uitklaplijst een klein schermpje zoals op fysieke apparaten, met de huidige keuze en de knoppen < en > (en [ok]), en een groter paneel als je erop klikt. Het werkt op keuzes die het apparaat met `host.ui.select` of `host.ui.display` laat tekenen (apparaatcontract §12f) en, als `targets` het noemt, op de preset- en tunekiezer in de kaartkop. Het **model** blijft de keuzelijst zelf: waarde, `onchange`, `setState`, presets en songs veranderen niet. Net als `pads` is `display` **één object**.

```json
"design": {
  "display": { "style": "lcd", "nav": "arrows+ok", "commit": "ok", "lines": 3, "width": 220, "expand": "click", "targets": ["select", "preset"], "color": "accent" }
}
```

| Sleutel | Waarden | Betekenis |
|---|---|---|
| `style` | `dropdown`, `lcd`, `oled`, `segment`, `paper` | Het gezicht: `dropdown` is de gewone keuzelijst van het apparaat (de standaard), `lcd` een groen-grijs lcd met donkere tekst, `oled` lichte tekst op zwart, `segment` zevensegmentcijfers en grote letters, `paper` donkere tekst op een lichte strook. Er is geen `none`: een skin verbergt de keuze niet. |
| `nav` | `arrows`, `arrows+ok`, `none` | De bediening naast het scherm: `arrows` zijn < en > (standaard), `arrows+ok` voegt een [ok]-knop toe, `none` laat alleen het scherm; een klik erop opent het paneel. |
| `commit` | `live`, `ok` | `live` zet de keuze direct bij < en > (standaard), `ok` pas bij [ok] in het paneel. |
| `lines` | geheel getal 1 tot 3 | Het aantal regels op het scherm: de huidige keuze, bij 2 en 3 ook de vorige en de volgende. |
| `width` | `auto` of een getal 80 tot 400 (px) | De breedte van het scherm. |
| `expand` | `click`, `button`, `off` | Hoe het grotere paneel opent: bij een klik op het scherm (standaard), met een eigen knop, of niet. Met `nav: "none"` en `expand: "off"` valt er niets te bedienen; de validator geeft een `let op` en de host houdt het toch bedienbaar. |
| `targets` | lijst met `select`, `preset`, `tune` (niet leeg, zonder dubbelen) | Waar het schermpje geldt: `select` voor keuzelijsten van het apparaat (standaard), `preset` voor de presetkiezer en `tune` voor de tunekiezer in de kaartkop. Noemt een skin `preset` of `tune` niet, dan blijft de kaartkop de gewone keuzelijst. |
| `color` | `"accent"`, `"default"` of `#rgb` / `#rrggbb` | De kleur van de tekst of het lcd-licht; `default` is de eigen schermkleur van de stijl. |

- **Vergroten.** Een klik opent een zwevend paneel met de lijst, een zoekveld (vanaf 12 keuzes, of het aantal dat het apparaat bij `searchAt` opgaf), grote < en >, [ok] en [annuleren]. Escape sluit en geeft de focus terug; pijltjes en Enter werken. De breedte is hoogstens 32 rem (of de breedte min 2 rem), de hoogte hoogstens 70 % van het scherm of 28 rem; op een telefoon vult het bijna het hele scherm, op een computer nooit.
- **Toegankelijkheid:** het scherm is een `combobox` met zichtbare, benoemde < en >-knoppen; toetsenbord en schermlezer werken zoals bij de gewone keuzelijst.
- **De kaartkop.** Voor `preset` en `tune` vervangt de skin alleen het gezicht van de keuzelijst en de knoppen vorige en volgende; Bewaar, Bladeren en het onderdeel (`ppart`, `ptune`) blijven werken zoals ze deden. Zonder skin of zonder `targets: ["preset"]` is de kaartkop identiek aan nu.
- **Samenvoegen:** per sleutel, de verschijningsvorm over de skin. **Standaard** (geen skin, of geen `display`, of `style: "dropdown"`) is het huidige uiterlijk.
- **Haptiek:** < en > en een keuze geven de haptiek `click` van de skin (`haptics.click`).
- **Een skin verbergt de keuze niet en zet geen waarde.**

### Panelen (`layout`, vanaf 0.7)

Met `design.layout` zet een skin de regelaars van een apparaat in **panelen** en bepaalt zij de **volgorde**: de oscillatoren in een verhoogd paneel, de prestatieregelaars en de meter in een rij, de rest in een kaal restpaneel. Dit is het enige onderdeel van `design` dat regelaars **verplaatst** (in de DOM, niet alleen in CSS); `sections` (0.5) stylen een groep die al een eigen element heeft en verplaatsen niets.

```json
"design": {
  "layout": {
    "flow": "auto",
    "panels": [
      { "id": "osc",  "title": { "nl": "Oscillator", "en": "Oscillator" }, "items": ["group:osc"], "style": "raised", "cols": 4 },
      { "id": "perf", "items": ["cut", "res", "role:meter"], "style": "line", "dir": "row" },
      { "id": "rest", "items": ["*"], "style": "plain" }
    ]
  }
}
```

| Sleutel | Waarden | Betekenis |
|---|---|---|
| `flow` | `rows`, `columns`, `auto` (standaard) | Hoe de panelen op de kaart staan. `rows`: onder elkaar. `columns`: naast elkaar, met terugloop op kaartbreedte. `auto`: naast elkaar zolang ze in de kaartbreedte passen, anders eronder; `width` van het paneel stuurt. |
| `panels` | lijst van hoogstens 16 panelen | De panelen in de volgorde waarin ze op de kaart komen. Een lege lijst of een ontbrekende sleutel laat het apparaat zoals het is. |
| `panels[].id` (verplicht) | 1 tot 40 tekens uit `[a-z0-9._-]`, uniek in de lijst | Het adres van het paneel (ook de sleutel van de ingeklapte stand). Een dubbel id is een fout. |
| `panels[].items` (verplicht) | lijst van hoogstens 64 teksten | Wat in het paneel komt, in deze volgorde: een regelaar-`id` (`"cut"`), `"role:<rol>"` (rol uit de lijst van `controls`), `"group:<groep>"` of `"*"` (alles wat nog niet is ondergebracht). Bij een `role:`- of `group:`-item geldt de volgorde van het apparaat. |
| `panels[].title` | tekst van 1 tot 60 tekens, of een object `{ "nl": …, "en": … }` | De kop van het paneel. Zonder titel geen kop. De host kiest de taal van de werkruimte en valt terug op de andere taal. |
| `panels[].titlePos` | `top` (standaard), `left`, `hidden` | De plaats van de kop. |
| `panels[].style` | `raised`, `inset`, `line`, `floating`, `plain` | Het kader, dezelfde vormen als `sections.frame` (`plain` is geen kader). De kleuren komen uit de actieve kleuren van de skin of de werkruimte. |
| `panels[].dir` | `row`, `column`, `grid` (standaard) | De richting van de regelaars in het paneel. |
| `panels[].cols` | `auto` of een geheel getal 1 tot 16 | Het aantal kolommen bij `dir: "grid"`. |
| `panels[].gap` | `tight`, `normal`, `wide` | De tussenruimte. |
| `panels[].bare` | `true`, `false` | De regelaars verliezen hun eigen kader (zoals `sections.bare`). |
| `panels[].labels` | `default`, `above`, `below` | De plaats van het label (zoals `sections.labels`). |
| `panels[].align` | `start`, `center` | De uitlijning van regelaars in hun cel. |
| `panels[].width` | `auto`, `full`, `half`, `third` | De breedte van het paneel binnen de rij van de stroom. |
| `panels[].collapsible` | `true`, `false` | Het paneel is inklapbaar via de kop. Ingeklapt wordt het paneel alleen **in beeld** verkleind: de regelaars blijven bestaan en bestuurbaar (`host.controls`, `setState`). De ingeklapte stand is een voorkeur van de gebruiker in de browser, per apparaat en paneel, en geen state of preset. |
| `panels[].collapsed` | `true`, `false` | De beginstand van een inklapbaar paneel. |

**Regels.**

- **Een skin verbergt niets en zet geen waarden.** Een regelaar komt in hoogstens **één** paneel; de **eerste passende** wint (dus een id kan in een eerder paneel staan dan zijn groep). Wat nergens past, komt vanzelf in een restpaneel. Staat `"*"` er niet, dan voegt de host zelf achteraan een restpaneel toe (`id: "rest"`, `style: plain`, titel "Overige"/"Other"). Er wordt nooit iets weggelaten.
- **Soepel in de host, streng in de validator.** Een onbekend id, een onbekende groep of rol, of een ongeldige waarde wordt door de host stil genegeerd (het item of het paneel valt terug); de validator geeft een **fout** bij een ongeldige vorm of een waarde buiten het bereik, en met `--device` een `let op` voor een id, groep of rol die het apparaat niet publiceert.
- **Samenvoegen.** `layout` wordt per sleutel samengevoegd: `appearances[].design.layout.panels` vervangt dan de hele lijst panelen van de skin, `flow` vervangt `flow`. Zo kan een verschijningsvorm een eigen indeling krijgen (compact tegenover breed). Een skin zonder `layout`, of met een leeg `layout`, geeft exact het gedrag van het apparaat.
- **Verplaatsen, niet vervangen.** De host verplaatst de bestaande regelaar-eenheden (label, invoer en waarde samen) naar het paneel; ze blijven dezelfde elementen met dezelfde `id`'s, handlers en `host.controls`. Zonder skin, na Standaard kiezen of na het wisselen van verschijningsvorm staat alles weer op de oorspronkelijke plek en in de oorspronkelijke volgorde.
- **Apparaten met een eigen indeling.** Een apparaat dat zijn indeling zelf bepaalt (Control Surface, apparaten met functionele secties van hemzelf) wordt niet herschikt; het Skins-paneel meldt dat. Voor de overige gedragingen (apparaten die hun UI herbouwen, kaarten in mini-weergave) geldt wat het Skins-paneel van de host meldt: "n van m regelaars in panelen, k in rest".
- **`layout` en `sections`.** Een paneel is een container van de host. `sections` (0.5) werken binnen een paneel op een groep alleen als de groep in het paneel nog een eigen element vormt; anders past de host `bare`, `labels` en `cols` van het paneel zelf toe. Kies liever het een of het ander per groep.
- **Scrollen.** Een lange rij panelen onder elkaar maakt een hoge kaart. Beperk de hoogte met `flow: "columns"` of `"auto"`, `width` en `collapsible`; de host meldt het aantal panelen.
- **Ids en groepen zijn contract.** Een skin mikt op de id's, rollen en groepen die een apparaat publiceert (apparaatcontract §12d). Een apparaat dat een id of groep hernoemt of verwijdert, breekt panelen die daarop mikken; de regelaar valt dan in het restpaneel en gaat dus niet verloren.
- Meters (`host.ui.meter`), pads en schermpjes tellen als regelaars en kunnen in panelen staan.

### Elementen en decor (`elements`, `decor`, vanaf 0.9)

De kaart van een apparaat is meer dan wat het apparaat bij de host aanmeldt (`host.ui.*`): koppen, blokken, knoppen en schermpjes tekent het apparaat zelf. Vanaf 0.9 kan een skin zulke **elementen** opmaken en **onderdelen toevoegen**, zonder CSS te schrijven. Beide lijsten staan in `design`, op skinniveau en per verschijningsvorm; bij samenvoegen komen de regels van de skin eerst en die van de verschijningsvorm erna (bij `elements` wint de laatste, bij `decor` wint de verschijningsvorm per `id`). Werkt alleen waar de host de kaart kan bereiken: in een open shadow root of in het vlak van het apparaat zelf.

**Een element aanwijzen (`target`).** Een sleutel is een korte selector vanaf de kinderen van de **wortel**: delen gescheiden door `" > "`, elk deel een tag (kleine letters), hoogstens twee klassen (`.sec`), eventueel `:nth-of-type(n)` en eventueel `[data-pk-id="id"]`, bijvoorbeeld `div.app > h3:nth-of-type(1)` of `div.k[data-pk-id="cutoff"] > label`. Hoogstens 14 delen en 400 tekens; geen komma, accolade, aanhalingsteken of ander teken. `root` (0 tot en met 7, standaard 0) kiest de wortel: de open shadow roots van het apparaat in de volgorde waarin de host ze vindt, of bij een apparaat zonder shadow root het vlak `.ui` zelf. De editor maakt de sleutels voor je; wijzigt een apparaat zijn opbouw, dan vindt de host een element niet meer en negeert de regel (de validator met `--device` kan dat niet controleren, de editor meldt het).

**`design.elements`** (hoogstens 128): een lijst van `{ target, root?, style }`. `style` kent alleen veilige eigenschappen; elke waarde wordt gecontroleerd en pas dan tot CSS gemaakt.

| `style` | Waarde | Betekenis |
|---|---|---|
| `background` | `#rgb` / `#rrggbb` | Achtergrondkleur |
| `color` | `#rgb` / `#rrggbb` | Tekstkleur |
| `borderColor` | `#rgb` / `#rrggbb` | Randkleur (zonder `borderStyle` wordt de rand doorgetrokken) |
| `borderWidth` | geheel getal 0 tot 8 | Randdikte in px |
| `borderStyle` | `none`, `solid`, `dashed`, `dotted` | Randstijl |
| `radius` | geheel getal 0 tot 48 | Afronding in px |
| `padding` | geheel getal 0 tot 40 | Ruimte binnen in px |
| `fontSize` | geheel getal 8 tot 48 | Lettergrootte in px |
| `fontWeight` | `400`, `500`, `600`, `700` | Letterdikte |
| `letterSpacing` | getal 0 tot 0,4 | Ruimte tussen letters in em |
| `textTransform` | `none`, `uppercase`, `lowercase`, `capitalize` | Hoofdletters |
| `opacity` | getal 0,2 tot 1 | Dekking |
| `shadow` | `none`, `soft`, `strong`, `glow` | Schaduw |

Een skin kan hiermee **niets verbergen, verplaatsen of vergroten** en geen gedrag veranderen: er is geen eigenschap voor `display`, `position`, `width` of `height`.

**`design.decor`** (hoogstens 32): onderdelen die de skin toevoegt, in de volgorde van de lijst. Elk onderdeel is `{ id, type, target, root?, place, text?, style? }`:

| Veld | Waarde | Betekenis |
|---|---|---|
| `id` | `[a-z0-9-]`, 1 tot 24 tekens | Naam; uniek (een dubbele `id` wordt genegeerd) |
| `type` | `label`, `box`, `line` | Een tekst, een blok (kader met vulling) of een lijn |
| `target` | sleutel of `""` | Het element waarbij het onderdeel hoort; leeg = het begin of einde van de wortel |
| `place` | `before`, `after`, `start`, `end` | Vóór of na het element, of erin aan het begin of einde (standaard `after`; zonder `target` alleen `start` of `end`) |
| `text` | tekst tot 120 tekens, of `{ "nl": "...", "en": "..." }` | Alleen bij `label` en `box`; de host kiest de taal van de gebruiker |
| `style` | dezelfde eigenschappen als `elements`, plus `align` (`left`, `center`, `right`) en `height` (geheel getal 1 tot 200, niet bij `label`) | Opmaak |

Een toegevoegd onderdeel is gewone tekst of een leeg blok: het kan niet worden bediend, bevat geen script en verandert niets aan het apparaat. De host zet het na elke wijziging van het scherm van het apparaat opnieuw op zijn plaats. Een onderdeel waarvan het `target` niet te vinden is, verschijnt niet.

### Wat "werkt op alle apparaten" betekent

| Onderdeel | Bereik in laag 1 |
|---|---|
| `ports.mode` | alle apparaten met een door de host getekende poortenbalk; niet bij `ui.jacks: true` (blijft `default`) |
| `colors` | alle apparaten voor de kaart (titelbalk, poortenbalk) en voor het hostelement; de UI binnen een apparaat volgt alleen waar het de variabelen gebruikt |
| `haptics` | alle apparaten met een open shadow root of gewone UI in de kaart; niet te zien in een gesloten shadow root |
| `knobs` | alleen wat via `host.ui.knob` is gebouwd |
| `controls` | alleen regelaars die het apparaat aanmeldt (`host.ui.knob`, `host.ui.adopt`, `data-pk-*`; apparaatcontract §12d); de rest blijft ongemoeid |
| `meters` | alleen meters die het apparaat met `host.ui.meter` laat tekenen (apparaatcontract §12e); de rest blijft ongemoeid |
| `sections` | alleen groepen waarvan de regelaars in één eigen element zitten (zie "Wat is een sectie" hierboven); de rest wordt niet gestyled |
| `size` | de kaartbreedte, alleen bij een met de hand gekozen verschijningsvorm of skin |
| `layout` | alleen regelaars die het apparaat aanmeldt (id/role/group); ze worden verplaatst, niet vervangen; apparaten met een eigen indeling (Control Surface) worden overgeslagen |

Nog **niet beschikbaar** (laag 3, §13): artwork voor frontplaten en een volwaardige editor. `design` verandert niets aan de bouw van een apparaat.

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

Dit contract heeft een versie `major.minor` (nu **0.9**), vastgelegd in het veld `skinsContract` van elke skin.

| Verschil met de versie van de host | Wat de host doet |
|---|---|
| Dezelfde major, dezelfde of lagere minor | laadt de skin |
| Dezelfde major, hogere minor | laadt de skin en **negeert onbekende velden** |
| Andere major | weigert de skin met een melding |

- Een nieuwe **minor** voegt alleen dingen toe (nieuwe velden, nieuwe waarden die oude hosts mogen negeren). Een wijziging die oude skins breekt, verhoogt de **major**.
- Onbekende velden, ook in een verschijningsvorm of in `when`, **worden genegeerd** en niet geweigerd. De validator meldt ze met een `let op` om typefouten te vangen.
- `formatVersion` (nu `1`) is de versie van de bestandsopbouw zelf; `skinsContract` is de versie van dit contract.
- Houd `id` en `device` gelijk bij een nieuwe versie van een skin en verhoog `version`: de nieuwere `version` wint.
- Dit contract, de validator (`validate-skin.mjs`) en de host horen bij dezelfde versie. De eerste regels van `SKINS-CONTRACT_NL.md`, `SKINS-CONTRACT_EN.md` en `validate-skin.mjs` noemen elk "v0.8".

**Wijzigingen van 0.1 naar 0.2:**

| Onderdeel | 0.1 | 0.2 |
|---|---|---|
| `skinsContract` | `"0.1"` | `"0.2"`; `"0.1"` blijft geldig |
| Veld `design` (skin en verschijningsvorm) | bestaat niet | nieuw, optioneel (§4b) |
| Poortenmodus | alleen het gedrag van de host | `ports.mode`: `default`, `always`, `hover`, `strip`, `bar` |
| Kleuren | alleen via CSS-variabelen in de skin | `colors`: schema `workspace` of `custom` met zes kleuren |
| Haptiek | geen | `haptics`: `click`, `turn`, `slide` |
| Hostknop | geen | `knobs`: `style` en `size` |
| Validator | geen controle op `design` | controleert `design` (strenger dan de host) en heeft testgevallen |
| Bestaande 0.1-skins | | blijven ongewijzigd werken |

**Wijzigingen van 0.2 naar 0.3:**

| Onderdeel | 0.2 | 0.3 |
|---|---|---|
| `skinsContract` | `"0.2"` | `"0.3"`; `"0.1"` en `"0.2"` blijven geldig |
| `design.controls` | bestaat niet | nieuw, optioneel: geordende lijst regels `{ match, face, size, length, thickness, thumb, color, showValue }` (§4b) |
| Regelaars aanwijzen | alleen via het label (fragiel) | via `id`, `role:<rol>` en `group:<groep>` die het apparaat publiceert (apparaatcontract v1.15, §12d) |
| `knobs.style` / `knobs.size` | stijl en grootte van de hostknop | blijven werken als korte vorm van een `controls`-regel op `role:param` |
| Validator | controleert `design` | controleert ook `controls` (vorm, bereiken, `face: "none"` is een fout, `let op` bij onbekende rol of een eigenschap die niet past) en kent `--device <apparaat>` voor id's, rollen en groepen |
| Bestaande 0.1- en 0.2-skins | | blijven ongewijzigd werken |

**Wijzigingen van 0.3 naar 0.4:**

| Onderdeel | 0.3 | 0.4 |
|---|---|---|
| `skinsContract` | `"0.3"` | `"0.4"`; `"0.1"`, `"0.2"` en `"0.3"` blijven geldig |
| `design.meters` | bestaat niet | nieuw, optioneel: geordende lijst regels `{ match, face, orientation, length, width, ballistics, peakHold, clip, scale, color, segments }` (§4b) |
| Meters aanwijzen | niet mogelijk | via `id` of `group:<groep>` die het apparaat met `host.ui.meter` publiceert (apparaatcontract v1.18, §12e); `role:` bestaat hier niet |
| Gezichten van een meter | alleen wat het apparaat tekent | `bar`, `ledladder` en `vu` (rond, met wijzer; vervangt de balk op dezelfde plek) |
| Validator | controleert `design` en `controls` | controleert ook `meters` (vorm, bereiken, `face: "none"` is een fout, `let op` bij een eigenschap die niet past bij het gezicht) en kent in `--device` de meters van het apparaat |
| Bestaande skins van 0.1 tot en met 0.3 | | blijven ongewijzigd werken |

**Wijzigingen van 0.4 naar 0.5:**

| Onderdeel | 0.4 | 0.5 |
|---|---|---|
| `skinsContract` | `"0.4"` | `"0.5"`; `"0.1"` tot en met `"0.4"` blijven geldig |
| `design.sections` | bestaat niet | nieuw, optioneel: geordende lijst regels (hoogstens 32) `{ match, frame, columns, gap, bare, labels, align }` (§4b) |
| `design.size` | bestaat niet | nieuw, optioneel: `{ width }` (200 tot 1600 px), de kaartbreedte bij een verschijningsvorm; alleen toegepast bij een met de hand gekozen skin of verschijningsvorm |
| Secties aanwijzen | niet mogelijk | via `"*"` of `"group:<groep>"` uit het register van het apparaat; de host styled een sectie alleen als er één element is met precies de regelaars van die groep |
| Apparaatwijziging | | geen; apparaatcontract blijft v1.18 |
| Validator | controleert `design`, `controls` en `meters` | controleert ook `sections` (vorm, bereiken, hoogstens 32 regels, `match` anders dan `group:` of `*` is een fout) en `size.width` (buiten 200 tot 1600 is een fout), geeft een `let op` voor `sections` of `size` in een bestand onder 0.5 en, met `--device`, voor een onbekende groep |
| Bestaande skins van 0.1 tot en met 0.4 | | blijven ongewijzigd werken |

**Wijzigingen van 0.5 naar 0.6:**

| Onderdeel | 0.5 | 0.6 |
|---|---|---|
| `skinsContract` | `"0.5"` | `"0.6"`; `"0.1"` tot en met `"0.5"` blijven geldig |
| `design.pads` | bestaat niet | nieuw, optioneel: één object `{ shape, size, color, palette, colors, idle, active, led, hit, press, gap }` (§4b); `colors` geeft een eigen kleur per pad (hoogstens 64 sleutels) |
| `design.display` | bestaat niet | nieuw, optioneel: één object `{ style, nav, commit, lines, width, expand, targets, color }` (§4b): een schermpje met < > en [ok] in plaats van een keuzelijst, met een vergroot paneel |
| Pads en stappen aanwijzen | niet mogelijk | pads van `host.ui.pad`, stapknoppen van `host.ui.steps` met opties en eigen knoppen met `data-pk-role="pad"` of `"step"`; per pad via `colors` (id, `role:<rol>` of `group:<groep>`) |
| Apparaatwijziging | | apparaatcontract v1.22 (`host.ui.pad`, `host.ui.display`, `host.ui.steps` met een 5e argument); een apparaat dat niets doet, blijft werken en krijgt geen pad- of schermpjegezicht |
| Validator | controleert `design`, `controls`, `meters` en `sections` | controleert ook `pads` (waarden, palet van 2 tot 16 kleuren, `colors` met hoogstens 64 sleutels, `shape: "none"` is een fout) en `display` (waarden, `style: "none"` is een fout), geeft een `let op` voor `pads` of `display` in een bestand onder 0.6 en, met `--device`, voor onbekende id's, groepen en rollen in `pads.colors` |
| Bestaande skins van 0.1 tot en met 0.5 | | blijven ongewijzigd werken |

**Wijzigingen van 0.6 naar 0.7:**

| Onderdeel | 0.6 | 0.7 |
|---|---|---|
| `skinsContract` | `"0.6"` | `"0.7"`; `"0.1"` tot en met `"0.6"` blijven geldig |
| `design.layout` | bestaat niet | nieuw, optioneel: `{ flow, panels }` met hoogstens 16 panelen van elk hoogstens 64 items (§4b) |
| Regelaars herschikken | niet mogelijk | de skin zet regelaars in panelen en bepaalt de volgorde; wat niet genoemd wordt komt in een restpaneel, er wordt nooit iets verborgen |
| Regelaars aanwijzen | | via id, `role:<rol>`, `group:<groep>` of `*`, de gegevens die een apparaat al publiceert |
| Apparaatwijziging | | geen; apparaatcontract blijft v1.22 |
| Validator | controleert `design` tot en met `pads` en `display` | controleert ook `layout` (vorm, bereiken, hoogstens 16 panelen en 64 items, een dubbel paneel-id of een ongeldig item is een fout) en geeft een `let op` voor een item dat in twee panelen staat, een lege paneellijst, `collapsible` zonder kop, `layout` in een bestand onder 0.7 en, met `--device`, voor onbekende id's, groepen en rollen in `items` |
| Bestaande skins van 0.1 tot en met 0.6 | | blijven ongewijzigd werken |

**Wijzigingen van 0.7 naar 0.8:**

| Onderdeel | 0.7 | 0.8 |
|---|---|---|
| `skinsContract` | `"0.7"` | `"0.8"`; `"0.1"` tot en met `"0.7"` blijven geldig |
| `controls[].activeColor` | bestaat niet | nieuw, optioneel: kleur terwijl je de regelaar gebruikt (§4b) |
| `design.pads.rules` | bestaat niet | nieuw, optioneel: lijst van hoogstens 64 regels per pad met `kind`, `color`, `activeColor`, `led` (§4b) |
| Gedrag door een skin | nooit | alleen `kind` bij pads van `host.ui.pad`: aan/uit, pad of pad met velocity |
| Apparaatwijziging | | apparaatcontract v1.32: tweede argument `velocity` bij `onpress` en `onchange` |
| Validator | controleert `design` tot en met `layout` | controleert ook `activeColor` en `pads.rules` (vorm, `kind`, kleuren, `led`; een ongeldige waarde is een fout) en geeft een `let op` voor een regel met alleen een `match`, een onbekende sleutel en beide nieuwe velden in een bestand onder 0.8 |
| Bestaande skins van 0.1 tot en met 0.7 | | blijven ongewijzigd werken |

**Wijzigingen van 0.8 naar 0.9:**

| Onderdeel | 0.8 | 0.9 |
|---|---|---|
| `skinsContract` | `"0.8"` | `"0.9"`; `"0.1"` tot en met `"0.8"` blijven geldig |
| `design.elements` | bestaat niet | nieuw, optioneel: hoogstens 128 regels `{ target, root?, style }` met veilige eigenschappen (§4b) |
| `design.decor` | bestaat niet | nieuw, optioneel: hoogstens 32 toegevoegde `label`, `box` of `line` met `place`, `text` en `style` (§4b) |
| Gedrag door een skin | alleen `kind` bij pads | ongewijzigd: elementen en decor veranderen alleen het uiterlijk, nooit gedrag, volgorde van bediening of zichtbaarheid |
| Editor | opmaak per regelaar, meter, pad, schermpje en groep | ook de opbouw van de kaart: elementen kiezen in een boom of door te klikken in het voorbeeld, opmaken en onderdelen toevoegen |
| Validator | controleert `design` tot en met `activeColor` en `pads.rules` | controleert ook `elements` en `decor` (sleutel, wortel, eigenschappen binnen hun grenzen, `id`, `type`, `place`, `text`; een ongeldige waarde is een fout) en geeft een `let op` voor een `elements`-regel zonder eigenschap en voor elementen of decor in een bestand lager dan 0.9 |
| Bestaande skins van 0.1 tot en met 0.8 | | blijven ongewijzigd werken |

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
node skins/contract/validate-skin.mjs [--lang nl|en] <bestand> --device <apparaat.patchkamer-device.js>
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
| `design` (skin of verschijningsvorm) of een sectie daarin is geen object; een waarde buiten de lijst (`ports.mode`, `colors.scheme`, `haptics.*`, `knobs.style`, `knobs.size`); een kleur die geen `#rgb` of `#rrggbb` is | fout |
| Een onbekende sleutel in `design` of in een sectie ervan | let op |
| `scheme: "custom"` met ontbrekende kleuren (na samenvoegen met de verschijningsvorm); `colors.custom` terwijl `scheme` niet `custom` is | let op |
| Contrast tussen `text` en `bg` of `surface` onder 3:1 | let op |
| `design` in een bestand met `skinsContract` `"0.1"` | let op |
| `design.controls`: een regel met een verkeerde vorm (geen object, `match` ontbreekt of heeft een ongeldige vorm), een waarde buiten het bereik (`face`, `size`, `length`, `thickness`, `thumb`, `color`, `showValue`), `face: "none"`, de lijst is geen lijst of heeft meer dan 64 regels | fout |
| `design.controls`: een rol in `match` die niet in de lijst staat; een regel zonder eigenschap naast `match`; `length`, `thickness` of `thumb` bij `face: "rotary"`; een onbekende sleutel in een regel; `controls` in een bestand met `skinsContract` `"0.2"` of `"0.1"` | let op |
| Met `--device <apparaat>`: een id, groep of rol in `match` die het apparaat niet publiceert; een apparaat zonder id's terwijl regels op id of groep mikken; een apparaat dat niet laadt; een skin voor een ander apparaat | let op |
| `design.meters`: een regel met een verkeerde vorm (geen object, `match` ontbreekt, heeft een ongeldige vorm of begint met `role:`), een waarde buiten het bereik (`face`, `orientation`, `length`, `width`, `ballistics`, `peakHold`, `clip`, `scale`, `color`, `segments`), `face: "none"`, de lijst is geen lijst of heeft meer dan 64 regels | fout |
| `design.meters`: een regel zonder eigenschap naast `match`; `width` bij `face: "vu"`; `orientation` anders dan `auto` bij `face: "vu"`; `scale` bij `face: "bar"`; `segments` bij een ander gezicht dan `ledladder`; een onbekende sleutel in een regel; `meters` in een bestand met `skinsContract` `"0.3"` of lager | let op |
| Met `--device <apparaat>`: een meter-id of groep in `design.meters` die het apparaat niet publiceert; meterregels voor een apparaat zonder meters (geen `host.ui.meter`); een regelaar-id in een meterregel en andersom | let op |
| `design.sections`: een regel met een verkeerde vorm (geen object, `match` ontbreekt of is iets anders dan `"*"` of `"group:<groep>"`), een waarde buiten het bereik (`frame`, `columns`, `gap`, `bare`, `labels`, `align`), de lijst is geen lijst of heeft meer dan 32 regels | fout |
| `design.size`: geen object, of `width` geen getal van 200 tot 1600 | fout |
| `design.sections`: een regel zonder eigenschap naast `match`; een onbekende sleutel in een regel; `design.size` zonder `width`; `sections` of `size` in een bestand met `skinsContract` `"0.4"` of lager | let op |
| Met `--device <apparaat>`: een groep in `design.sections` die het apparaat niet publiceert (elke groep uit het register telt, ook van meters) | let op |
| `design.pads`: geen object (ook een lijst), een waarde buiten de lijst of het bereik (`shape`, `size`, `color`, `idle`, `active`, `led`, `hit`, `press`, `gap`), `shape: "none"`, een `palette` die geen lijst van 2 tot 16 kleuren is, `colors` dat geen object is, meer dan 64 sleutels in `colors` of een waarde die geen kleur is | fout |
| `design.pads`: een leeg object; een onbekende sleutel; een sleutel in `colors` met een ongeldige vorm of een `role:` anders dan `pad` of `step`; `palette` terwijl `color` niet `palette` is; `color: "palette"` zonder `palette`; `pads` of `display` in een bestand met `skinsContract` `"0.5"` of lager | let op |
| `design.display`: geen object, een waarde buiten de lijst of het bereik (`style`, `nav`, `commit`, `lines`, `width`, `expand`, `targets`, `color`), `style: "none"`, `targets` leeg, met dubbelen of met een onbekende naam | fout |
| `design.display`: een leeg object; een onbekende sleutel; `nav: "none"` met `expand: "off"`; `nav`, `commit`, `lines`, `width`, `expand` of `color` bij `style: "dropdown"`; `targets` met `preset` of `tune` bij `style: "dropdown"` | let op |
| Met `--device <apparaat>`: een id, groep of rol in `pads.colors` die het apparaat niet als pad of stap publiceert; `pads` voor een apparaat zonder pads of stappen; `display` met `select` in `targets` voor een apparaat zonder keuzelijst | let op |
| `design.layout`: geen object, `flow` buiten de lijst, `panels` geen lijst of meer dan 16 panelen, een paneel zonder object of zonder geldig `id` (`[a-z0-9._-]`, 1 tot 40) of met een dubbel `id`, `items` ontbreekt, geen lijst of meer dan 64 items, een item dat niet `"*"`, `"role:<rol>"` (rol uit de lijst), `"group:<groep>"` of een id is, een `title` buiten 1 tot 60 tekens of een object zonder `nl`/`en`, een waarde buiten de lijst (`titlePos`, `style`, `dir`, `gap`, `labels`, `align`, `width`), `cols` buiten `auto` of 1 tot 16, `bare`/`collapsible`/`collapsed` geen boolean | fout |
| `design.layout`: een item dat in twee panelen of tweemaal in een paneel staat; `"*"` in meer dan een paneel; een leeg `layout` of lege paneellijst; een paneel zonder items; `titlePos` zonder `title`; `collapsible` zonder kop (of met `titlePos: "hidden"`); `collapsed` zonder `collapsible`; een onbekende sleutel; `layout` in een bestand met `skinsContract` `"0.6"` of lager. Een ontbrekende `"*"` is **geen** melding: de host voegt een restpaneel toe | let op |
| Met `--device <apparaat>`: een id, groep of rol in `layout.panels[].items` die het apparaat niet publiceert (elke regelaar en meter uit het register telt) | let op |

**Controleren tegen een apparaat (`--device`).** Met `--device <apparaat.patchkamer-device.js>` laadt de validator het apparaat (via `contract/validate-instrument.mjs`, dat het register van id's, rollen en groepen kent) en geeft een `let op` voor elke `match` die niets raakt: een onbekend id, een onbekende groep, een rol die het apparaat niet heeft. Voor `design.meters` kijkt hij alleen naar de meters van het apparaat (rol `meter`) en meldt een onbekend meter-id, een groep zonder meter en een apparaat zonder meters. Het is altijd een `let op` en nooit een fout, want een nieuwere apparaatversie kan een id later toevoegen. Een tabel van wat een apparaat aanmeldt krijg je met `node contract/validate-instrument.mjs <apparaat> --controls`.

```
node skins/contract/validate-skin.mjs skins/library/nl.patchkamer.filter/example-controls.patchkamer-skin.json --device devices/effects/Filter/filter.patchkamer-device.js
```

De validator controleert `design` strenger dan de host: de host negeert wat hij niet snapt, de validator weigert het. De testgevallen staan in `skins/contract/test-validate-skin.mjs` (`node skins/contract/test-validate-skin.mjs`; grenzen, kleuren, contrast, onbekende sleutels, beide talen). Skins van 0.1 blijven `OK`.

De validator kan niet zien of de CSS er goed uitziet of een selector iets raakt, en ook niet of een apparaat zijn poorten in de eigen UI tekent of de hostknop gebruikt. Test dat in de host als je een browser hebt; heb je die niet, schrijf dan in je oplevering dat het **niet getest** is.

---

## 13. Wat nog niet in versie 0.9 zit

Versie 0.1 legt het formaat en de weg naar de gebruiker vast; versie 0.2 (laag 1) voegt de ontwerpkeuzes toe die op alle apparaten werken (§4b); versie 0.3 (laag 2, release A "id's en rollen") voegt `design.controls` toe: gezicht, maat en kleur van regelaars die het apparaat aanmeldt; versie 0.4 (laag 2, release C "meters") voegt `design.meters` toe: gezicht (balk, ledladder, rond VU), richting, lengte, breedte, ballistiek, schaal en kleur van meters die het apparaat door de host laat tekenen; versie 0.5 (laag 2, release B1 "secties") voegt `design.sections` en `design.size` toe: kader, kolommen, tussenruimte, kaal, labelplaats en uitlijning van de groepen regelaars van een apparaat, en een kaartbreedte per verschijningsvorm; versie 0.6 (laag 2, release D "pads en schermpje") voegt `design.pads` en `design.display` toe: vorm, maat, kleur en feedback van pads en stappen, en een schermpje in plaats van een keuzelijst; versie 0.7 (laag 2, release B2 "panelen en volgorde") voegt `design.layout` toe: de regelaars van een apparaat in panelen zetten en in een volgorde, zonder iets te verbergen. Daarbuiten is de inhoud van een skin nog een **placeholder**: CSS en afbeeldingen zonder verdere eisen. Bewust later, in een volgende versie, in deze volgorde:

- artwork voor frontplaten, met de posities van de regelaars erop;
- een contract per apparaat voor stijlhaken: welke klassen, variabelen en `part`-namen een apparaat vastlegt en stabiel houdt (nu is dat per apparaat vast te stellen, §4).

Freek levert de eisen daarvoor nog aan. Verzin tot die tijd niets: bouw een skin met alleen wat in dit contract staat.

**Vooruitblik (nog niet beschikbaar).** Laag 2 brengt verder bouwstenen en indeling: een skin kan dan ook de opbouw van een apparaat bepalen, niet alleen kleur en gedrag van de host. Laag 3 is een editor waarin je een skin samenstelt. Beide ontbreken nu (op `design.controls`, `design.meters`, `design.sections`, `design.size`, `design.pads`, `design.display` en `design.layout` na); `design` blijft daarvoor uitbreidbaar (nieuwe secties naast `ports`, `colors`, `haptics`, `knobs` en `controls`), en de ontwerper in het Skins-paneel is een eerste stap. Schrijf er niets voor.

---

## 14. Een minimaal voorbeeld

Dit is `skins/library/nl.patchkamer.duofone/example-plain.patchkamer-skin.json`: twee verschijningsvormen die alleen een dunne rand om het apparaat zetten en de accentkleur van Duofone veranderen. Het is een skin van 0.1 en blijft geldig. Voorbeelden van laag 1 met `design`: `example-back-panel.patchkamer-skin.json` (poortenstrook, donker kleurenschema en twee echt verschillende verschijningsvormen: een kleine Compact met kaders om 3 kolommen draaiknoppen en een brede Full met verhoogde secties en schuiven; gebruikt `design.sections` en `design.size`) en `example-touch.patchkamer-skin.json` (`hover`, haptiek en grote knoppen) in dezelfde map. Voorbeelden van panelen (0.7): `skins/library/nl.patchkamer.duofone/example-panels.patchkamer-skin.json` (een compacte indeling met inklapbare panelen onder elkaar en een brede indeling met panelen naast elkaar) en `skins/library/nl.patchkamer.filter/example-panels.patchkamer-skin.json`.

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
- `skinsContract` is `"0.8"` (of `"0.7"`/`"0.6"`/`"0.5"`/`"0.4"`/`"0.3"`/`"0.2"`/`"0.1"` als de skin geen `layout`/`pads`/`display`/`sections`/`size`/`meters`/`controls`/`design` heeft), `format` is `"patchkamer-skin"`, `formatVersion` is `1`.
- `id`, `name`, `description` en de verschijningsnamen zijn Engels en merkvrij; `license` is `CC0-1.0`.
- Een eventueel `design` bevat alleen sleutels uit §4b met geldige waarden; kleuren zijn `#rgb` of `#rrggbb`.
- Een eventueel `design.controls` heeft hoogstens 64 regels, mikt alleen op id's, rollen en groepen die het apparaat publiceert (`node skins/contract/validate-skin.mjs <skin> --device <apparaat>` zonder `let op`) en verbergt niets.
- Een eventueel `design.meters` heeft hoogstens 64 regels, mikt alleen op meter-id's en groepen die het apparaat publiceert (`--device` zonder `let op`), gebruikt geen `role:`, geeft geen `width` of `orientation` aan een `vu` en verbergt niets.
- Een eventueel `design.sections` heeft hoogstens 32 regels, een `match` van `"*"` of `"group:<groep>"` met een groep die het apparaat publiceert (`--device` zonder `let op`) en beperkt de hoogte van de kaart door kolommen te kiezen; een eventueel `design.size.width` ligt tussen 200 en 1600.
- Een eventueel `design.pads` is één object (geen lijst), kiest een `shape` uit de lijst (nooit `none`), heeft een `palette` van 2 tot 16 kleuren alleen bij `color: "palette"`, hoogstens 64 sleutels in `colors` die alleen mikken op pads, stappen en groepen die het apparaat publiceert (`--device` zonder `let op`); een eventueel `design.display` kiest een `style` uit de lijst (nooit `none`), laat het schermpje bedienbaar (niet `nav: "none"` met `expand: "off"`) en noemt `preset` of `tune` in `targets` alleen bij een schermstijl.
- De CSS bevat geen `@import` en geen externe `url(`; afbeeldingen staan in `assets` en worden met `var(--skin-asset-<naam>)` gebruikt.
- Er staan alleen selectors, klassen en variabelen in die je in het apparaatbestand hebt gezien.
- `node skins/contract/validate-skin.mjs <bestand>` geeft één `OK`-regel zonder `let op`.
- Een eventueel `icon.svg` is 24×24 lijnwerk zonder script of externe verwijzing en hoogstens 200 kB.
- Er staan geen geheimen of persoonlijke gegevens in.
- Je hebt in je oplevering gemeld wat je niet hebt kunnen testen (bijvoorbeeld hoe de skin in de host eruitziet).
