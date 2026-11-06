# AGENTS.md: skins/

Dit bestand is voor AI-agents die **skins** maken voor Patchkamer-apparaten. Het is niet geschreven voor mensen. Het hoort bij de algemene instructies in `../AGENTS.md`; lees die eerst. Een skin bouwen is iets anders dan een apparaat bouwen: een skin raakt geen apparaatcode.

**Eerlijk vooraf:** in versie 0.1 is de **inhoud** van een skin een placeholder. Het formaat, de mappen, het laden en het wisselen van verschijningsvormen liggen vast; de eisen aan echte artwork, regelaargrafiek en indeling levert Freek later aan (zie het contract, §13). Maak dus geen ingewikkelde skins en verzin geen eisen die er niet zijn.

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

- `format` (`"patchkamer-skin"`), `formatVersion` (`1`), `skinsContract` (`"0.1"`);
- `id` (`<device-id>.<slug>`), `device` (het apparaat-id), `name` (Engels, 1 tot 60), `version` (semver), `author`, `license` (`CC0-1.0`), `description` (Engels, hoogstens 300), `created` (`YYYY-MM-DD`);
- `icon` (`null` of een data-adres, hoogstens 200 kB) en `default` (de `id` van de verschijningsvorm als niets in Auto past);
- `appearances`: 1 tot 12 verschijningsvormen met `id`, `name`, optioneel `description`, `when` (`minWidth`, `maxWidth`, `screens` met `phone`, `compact`, `wide`), `css` en `assets`.

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
5. **Lever op:** het pad van het bestand, de contractversie (`0.1`), de `OK`-regel van de validator en wat je niet hebt kunnen testen.

### Stijlhaken per apparaat

Welke klassen, ids, variabelen en `part`-namen een apparaat in zijn shadow root heeft, **verschilt per apparaat** en wordt in versie 0.1 niet door een contract vastgelegd. Gebruik alleen wat je in het apparaatbestand ziet (`:host` en CSS-variabelen werken altijd, mits het apparaat ze gebruikt). Een selector die niets raakt, is geen fout van de validator, maar je skin doet dan niets. Zie het contract, §4.

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
- [ ] `skinsContract` `"0.1"`, `format` `"patchkamer-skin"`, `formatVersion` `1`.
- [ ] Namen en omschrijving Engels en merkvrij; `license` `CC0-1.0`; `created` is een echte datum.
- [ ] Verschijningsvormen met een `when` die klopt (geen overlap die een vorm onbereikbaar maakt) en een `default`.
- [ ] CSS zonder `@import` en zonder externe `url(`; afbeeldingen in `assets`, gebruikt via `var(--skin-asset-<naam>)`.
- [ ] Alleen selectors, klassen en variabelen die je in het apparaatbestand hebt gezien.
- [ ] `node skins/contract/validate-skin.mjs --lang nl <bestand>`: één `OK`-regel, geen `let op`, en dat ook met `--lang en`.
- [ ] Een eventueel `icon.svg` voldoet aan de iconenregels hierboven en is gevalideerd.
- [ ] Geen merk- of modelnaam (de validator controleert dit); geen geheimen.
- [ ] In de oplevering staat wat je niet hebt kunnen testen.

## Documentatie

- [Skinscontract (Nederlands)](contract/SKINS-CONTRACT_NL.md) en [Skins contract (English)](contract/SKINS-CONTRACT_EN.md): het volledige formaat, de regels en de validator.
- [Validator](contract/validate-skin.mjs): `node skins/contract/validate-skin.mjs --lang nl <bestand>`.
- [Voorbeeldskin](library/nl.patchkamer.duofone/example-plain.patchkamer-skin.json) en [voorbeeldicoon](library/nl.patchkamer.duofone/icon.svg).
- [README (Engels)](README.md) en [README (Nederlands)](README_NL.md) van deze map.
- [Algemene agent-instructies voor apparaten](../AGENTS.md), [tunes](../tunes/AGENTS.md), [presets](../presets/AGENTS.md) en [songs](../songs/AGENTS.md).
- [Apparaatcontract](../contract/PATCHKAMER-CONTRACT_NL.md) ([English](../contract/PATCHKAMER-CONTRACT_EN.md)) en [licenties](../LICENSING.md).
