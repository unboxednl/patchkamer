# AGENTS.md

Dit bestand is voor AI-agents die een **apparaat (device) voor Patchkamer** bouwen. Het is niet geschreven voor mensen. Lees het helemaal voordat je iets maakt of wijzigt.

Patchkamer is een modulaire muziekstudio in de browser op Web Audio: één HTML-pagina (de host) waarin apparaten worden geplaatst en gekoppeld. Een apparaat is **één `.js`-bestand** dat voldoet aan het contract.

## Waar staat wat

| Pad | Wat | Voor jou |
|---|---|---|
| `contract/PATCHKAMER-CONTRACT_NL.md` en `contract/PATCHKAMER-CONTRACT_EN.md` | Het contract in twee talen (Nederlands is de brontekst, Engels de vertaling; zelfde versie en inhoud): de volledige, zelfstandige instructie voor het bouwen van een apparaat | **Lees er één van de twee** (kies de taal van de opdracht). Je hebt geen andere bron nodig |
| `contract/validate-instrument.mjs` | De validator die controleert of je apparaat aan het contract voldoet; uitvoer in het Nederlands, of met `--lang en` in het Engels | **Draai dit** voor je oplevert |
| `patchkamer/patchkamer.html` | De host (de studio). Hierin test je wat de validator niet kan zien | Zie `patchkamer/AGENTS.md` |
| `devices/<categorie>/<Naam>/` | De meegeleverde apparaten: één map per apparaat binnen een categorie, bijvoorbeeld `devices/synths/Duofone/duofone.patchkamer-device.js` | **Hier zet je je apparaat neer.** Heeft het apparaat een eigen `AGENTS.md`, lees die dan ook |
| `tunes/` | Klanken van apparaten die geluid maken (`kind: 'instrument'`) | Zie `tunes/AGENTS.md` |
| `presets/` | Instellingen van apparaten zonder eigen geluid | Contract §13c, licentie `CC0-1.0` |
| `songs/` | Meegeleverde songs | Niet aanraken tenzij gevraagd |
| `docs/` | Gebruikershandleiding (`USER-MANUAL_NL.md` en `_EN.md`, voor mensen), screenshots in `docs/images/` en het script `docs/tools/make-screenshots.py` | Niet aanraken tenzij gevraagd. Een wijziging doe je altijd in beide talen |

## Regel 1: contract en validator hebben dezelfde versie

Het contract en de validator horen bij elkaar. Controleer dit **voor je begint**:

```
head -1 contract/PATCHKAMER-CONTRACT_NL.md contract/PATCHKAMER-CONTRACT_EN.md contract/validate-instrument.mjs
```

Alle drie de regels moeten dezelfde versie noemen (nu v1.14: "Instrumentcontract v1.14", "Instrument contract v1.14" en "Patchkamer contract v1.14"). Het getal bij `patchkamer:` in `patchkamer/patchkamer.html` hoort daar ook mee gelijk te zijn.

- Noemen ze verschillende versies, **stop dan** en meld dat. Gok niet welke goed is en meng nooit een contract van de ene met een validator van de andere versie.
- Heb je bewust een oudere versie nodig, haal dan **beide** uit dezelfde tag: `git show contract/v1.8:contract/PATCHKAMER-CONTRACT.md` en `git show contract/v1.8:contract/validate-instrument.mjs` (tot en met v1.10 was er één contractbestand zonder taalachtervoegsel; vanaf v1.11 zijn het `_NL.md` en `_EN.md`). Zet ze buiten de repo (bijvoorbeeld in je tijdelijke map), niet in `contract/`.
- Bouw standaard voor de versie die in de repo staat.
- Noem in je oplevering de versie waarvoor je gebouwd hebt.

## Werkwijze

1. **Lees het contract** (`contract/PATCHKAMER-CONTRACT_NL.md` of `_EN.md`) volledig. Let vooral op §21 (opdrachtformaat), §18 (checklist), §19 (veelgemaakte fouten) en de voorbeelden in §20. Een opdracht komt in de vorm van §21; ontbreekt iets in de opdracht dat je nodig hebt, kies dan het eenvoudigste dat het contract toestaat en meld dat.
2. **Schrijf één bestand** in een eigen map in `devices/`:
   - de map is `devices/<categorie>/<Naam>/`, met de naam met een hoofdletter (`devices/effects/Tremolo/`). Kies een bestaande categorie; bestaat de juiste niet, meld dat dan in plaats van er een te verzinnen. In die map staat het apparaat en, als dat nuttig is, een eigen `AGENTS.md` (zie `devices/synths/Duofone/`);
   - één JavaScript-module (ES-module) met een default export, zonder `import`, zonder netwerk, zonder browseropslag, zonder eigen `AudioContext` (de validator weigert dat);
   - bestandsnaam `<naam>.patchkamer-device.js`, met de naam in kleine letters met streepjes, afgeleid van de naam van het apparaat, **zonder versienummer** (`tremolo.patchkamer-device.js`, niet `tremolo-v2.patchkamer-device.js`). Op de eindgedeelte `.patchkamer-device.js` herkent Patchkamer een apparaat; hulpscripts in dezelfde map krijgen die naam niet. De versie staat in het veld `version` (semver). Eerdere versies staan in de git-geschiedenis, niet in losse bestanden;
   - alle tekst voor de gebruiker kiest op `host.lang` (`'nl'` en `'en'`, andere talen vallen terug op `'en'`); namen van het apparaat en van poorten per taal in `i18n`; gebruik `host.audio.oversample` waar je zelf aliasing veroorzaakt (contract §12c). Engelse muziekvaktermen (preset, tune, sample rate, latency, oversampling, swing, mixer) vertaal je niet;
   - zet geen merknamen of productnamen van bestaande instrumenten in `name`, bestandsnaam, `id`, teksten of commentaar. Een korte omschrijving als "geïnspireerd op klassieke analoge synths" mag;
   - `id` in reverse-DNS (`nl.<naam>.<apparaat>`), uniek en voor altijd gelijk;
   - eerste regel: `// SPDX-License-Identifier: AGPL-3.0-or-later`.
3. **Valideer** vanuit de root van de repo:
   ```
   node contract/validate-instrument.mjs devices/<categorie>/<Naam>/<naam>.patchkamer-device.js
   ```
   Het resultaat moet één `OK`-regel zijn (exit 0), **zonder waarschuwing** (`let op`, met `--lang en`: `warning`). De validator draait je apparaat met `host.lang` `'nl'` én `'en'` en meldt een fout in een van beide takken. Bij een fout (exit 1) staat de eerste fout in de uitvoer: herstel en draai opnieuw. Meld nooit "klaar" zolang de validator niet `OK` geeft.
4. **Loop de checklist** uit §18 langs. De validator kan niet zien of het goed klinkt, of eigen HTML-knoppen meebewegen, of je timing klopt. Test dat in de host als je een browser tot je beschikking hebt (`patchkamer/AGENTS.md`). Heb je die niet, schrijf dan in je oplevering dat dit **niet getest** is. Beweer niet dat het werkt.
5. **Lever op:** het pad van het bestand, de contractversie, de `OK`-regel van de validator en wat je niet hebt kunnen testen.

## Een bestaand apparaat wijzigen

Verhoog `version` (semver) en houd `id`, poort-id's en bestandsnaam **gelijk**. Daaraan hangen bewaarde werkruimtes, songs, tunes en presets van gebruikers (contract §13 en §16). Hernoem je een poort of verander je de betekenis van de state op een niet-compatibele manier, verhoog dan `MAJOR`. Verander nooit de `kind` van een bestaand apparaat.

## Licentie

Alles in `devices/` is `AGPL-3.0-or-later`. Een apparaat dat de opdrachtgever in zijn eigen bron publiceert, valt buiten deze repo en heeft zijn eigen licentie. Neem geen code over die onder een andere licentie staat zonder dat de opdracht dat zegt en de licentie het toelaat. Zie `LICENSING.md`.

## Wat je niet doet

- Pas `contract/`, de validator of `patchkamer/patchkamer.html` **niet** aan om je apparaat te laten slagen. Past je apparaat niet in het contract, pas dan je apparaat aan. Denk je dat het contract of de validator een fout bevat, meld dat dan apart en wijzig het niet stilletjes.
- Maak geen kopieën met een versienummer in de naam.
- Commit of push niet, tenzij de opdracht dat vraagt.
- Zet geen geheimen, sleutels of persoonlijke gegevens in een bestand.
