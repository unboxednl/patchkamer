# AGENTS.md: tunes/

Dit bestand is voor AI-agents die tunes maken voor Patchkamer-apparaten. Het is niet geschreven voor mensen. Het hoort bij de algemene instructies in `../AGENTS.md`; lees die eerst.

## Wat een tune is

Een tune is de **klank** van een apparaat dat geluid maakt (`kind: 'instrument'`: synths, drones, drumcomputers), bewaard als data. Apparaten zonder eigen geluid (`effect`, `mixer`, `output`, `utility`, `modulator`) krijgen **presets** en geen tunes: die horen in `../presets/`. Welke van de twee past, volgt uit de `kind` van het apparaat. De uitleg staat in het contract, §0 en §13c.

## Wat je nodig hebt

- Het apparaat zelf, in `../devices/<naam>.js`, en zijn exacte `id`.
- Het contract, §13c: `../contract/PATCHKAMER-CONTRACT.md`. Controleer eerst dat contract en validator dezelfde versie hebben (`../AGENTS.md`, regel 1).

## Bestand

Eén pack per bestand, in deze map: `naam.patchkamer-tunes.json`. De bestandsnaam bevat **geen versienummer**; revisies staan in de git-geschiedenis.

```json
{ "format": "patchkamer-tunes", "formatVersion": 1, "device": "nl.jouwnaam.apparaat", "name": "Trance basics",
  "author": "…", "license": "CC0-1.0", "description": "…",
  "tree": [ { "folder": "Leads", "items": [ { "name": "Uplifting", "kind": "set", "version": "1.0.0", "state": { } } ] },
            { "name": "Diepe kick", "kind": "part", "part": "kick", "author": "…", "license": "CC0-1.0", "state": { } } ] }
```

- `device` is de `id` van het apparaat, letterlijk. Een tune hangt aan die `id`; een verkeerde schrijfwijze is een tune zonder apparaat.
- `kind: 'set'`: de hele klank van het apparaat. `state` is wat `getPreset()` van het apparaat teruggeeft (of `getState()` als het geen `getPreset` heeft).
- `kind: 'part'`: de klank van één instrument binnen een drumcomputer. Alleen toegestaan als het apparaat `parts()`, `getPart(id)` en `setPart(id, data)` heeft. `state` is wat `getPart(id)` teruggeeft, en `part` is het `id` of `type` uit `parts()`.
- `folder` mag in `folder` zitten.

## De `state` moet kloppen

Verzin geen velden. Lees de broncode van het apparaat: welke sleutels geeft `getPreset()`/`getState()`/`getPart()` terug, met welke bereiken en eenheden? Gebruik precies die sleutels met waarden binnen het bereik. Onbekende velden worden genegeerd en ontbrekende krijgen hun standaardwaarde. Zo'n tune klinkt dan anders dan jij bedoelde, zonder foutmelding.

Zet er geen routing, bronkeuzes, lopende posities (klok, fase), AudioNodes of patronen in. Dat hoort niet bij de klank (contract §13, §19).

## Licentie: altijd `CC0-1.0`

Alles in deze map is `CC0-1.0` (publiek domein), zie `LICENSE` en `../LICENSING.md`. Zet daarom `"license": "CC0-1.0"` op het pack **en** op elk item dat een eigen `license` krijgt. Het contract noemt `CC-BY-4.0` en `LicenseRef-All-Rights-Reserved` als keuzes in de studio; die gelden **niet** voor deze map.

- Maak geen tune op basis van werk met een andere licentie, tenzij die ook CC0 of publiek domein is. Doe je dat toch met toestemming of een geschikte licentie, noteer het dan in `basedOn: { name, author, license }` en meld het.
- Zet je eigen naam in `author`. Weet je die niet, laat de opdracht het zeggen. Verzin geen persoon.

## Controleren

Er is geen aparte validator voor tunes. Controleer zelf:

1. Het bestand is geldige JSON: `node -e "JSON.parse(require('fs').readFileSync(process.argv[1],'utf8'))" tunes/<bestand>`.
2. `format` en `formatVersion` kloppen (`"patchkamer-tunes"`, `1`), `device` bestaat in `../devices/`, en dat apparaat heeft `kind: 'instrument'`.
3. Elke sleutel in elke `state` komt voor in de state van dat apparaat.
4. Elk item heeft `name` en `kind`; elk `part`-item heeft een `part` dat het apparaat kent.
5. Lukt het, laad het pack dan in de host (`../patchkamer/AGENTS.md`) en kies de tunes. Heb je geen browser, schrijf dan in je oplevering dat de hosttest **niet is uitgevoerd**.

Lever op: het pad, het `device`-id, de contractversie en wat je niet hebt kunnen testen.

## Wat je niet doet

- Wijzig het apparaat niet om je tune te laten kloppen. Verander nooit `id` of `kind` van een apparaat, daaraan hangen de tunes van gebruikers.
- Commit of push niet, tenzij de opdracht dat vraagt.
