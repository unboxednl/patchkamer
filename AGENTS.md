# AGENTS.md

Dit bestand is voor AI-agents die een **apparaat (device) voor Patchkamer** bouwen. Het is niet geschreven voor mensen. Lees het helemaal voordat je iets maakt of wijzigt.

Patchkamer is een modulaire muziekstudio in de browser op Web Audio: één webpagina (de host, `patchkamer/patchkamer.html` met `css/`, `i18n/` en `js/`) waarin apparaten worden geplaatst en gekoppeld. Een apparaat is **één `.js`-bestand** dat voldoet aan het contract.

## Waar staat wat

| Pad | Wat | Voor jou |
|---|---|---|
| `contract/PATCHKAMER-CONTRACT_NL.md` en `contract/PATCHKAMER-CONTRACT_EN.md` | Het contract in twee talen (Nederlands is de brontekst, Engels de vertaling; zelfde versie en inhoud): de volledige, zelfstandige instructie voor het bouwen van een apparaat | **Lees er één van de twee** (kies de taal van de opdracht). Je hebt geen andere bron nodig |
| `contract/validate-instrument.mjs` | De validator die controleert of je apparaat aan het contract voldoet; uitvoer in het Nederlands, of met `--lang en` in het Engels | **Draai dit** voor je oplevert |
| `patchkamer/patchkamer.html` (plus `css/`, `i18n/`, `js/`) | De host (de studio). Hierin test je wat de validator niet kan zien | Zie [patchkamer/AGENTS.md](patchkamer/AGENTS.md) |
| `devices/<categorie>/<Naam>/` | De meegeleverde apparaten: één map per apparaat binnen een categorie, bijvoorbeeld `devices/synths/Duofone/duofone.patchkamer-device.js` | **Hier zet je je apparaat neer.** Zie [devices/AGENTS.md](devices/AGENTS.md); elke soort en elk apparaat heeft een eigen `AGENTS.md` (zie de boom hieronder), lees die dan ook |
| `tunes/` | Klanken van apparaten die geluid maken (`kind: 'instrument'`) | Zie [tunes/AGENTS.md](tunes/AGENTS.md) |
| `presets/` | Instellingen van apparaten zonder eigen geluid | Zie [presets/AGENTS.md](presets/AGENTS.md); contract §13c, licentie `CC0-1.0` |
| `skins/` | Skins: het uiterlijk van één apparaat, als los bestand (contract, validator en bibliotheek) | Zie [skins/AGENTS.md](skins/AGENTS.md). Raakt geen apparaatcode |
| `songs/` | Meegeleverde songs | Zie [songs/AGENTS.md](songs/AGENTS.md) om een song te componeren; niet aanraken tenzij gevraagd |
| `docs/` | Gebruikershandleiding (`USER-MANUAL_NL.md` en `_EN.md`, voor mensen), screenshots in `docs/images/` en het script `docs/tools/make-screenshots.py` | Niet aanraken tenzij gevraagd. Een wijziging doe je altijd in beide talen |

## De boom van AGENTS.md-bestanden

Alles wat je nodig hebt om te componeren of een apparaat, tune of preset te maken, bereik je via links tussen `AGENTS.md`-bestanden. Begin hier en volg de tak die bij je opdracht past. De handleidingen in `docs/` zijn voor mensen; je hebt ze niet nodig.

| Je wilt | Ga naar | Daarna |
|---|---|---|
| Een **apparaat** bouwen of wijzigen | [devices/AGENTS.md](devices/AGENTS.md) | de soort ([synths](devices/synths/AGENTS.md), [samplers](devices/samplers/AGENTS.md), [sequencers](devices/sequencers/AGENTS.md), [drums](devices/drums/AGENTS.md), [effects](devices/effects/AGENTS.md), [mastering](devices/mastering/AGENTS.md), [mixer](devices/mixer/AGENTS.md), [modulators](devices/modulators/AGENTS.md), [tools](devices/tools/AGENTS.md)), dan de `AGENTS.md` van het apparaat |
| **Tunes** maken (klanken van synths, samplers en drums) | [tunes/AGENTS.md](tunes/AGENTS.md) | de `AGENTS.md` van het apparaat waarvoor je maakt |
| **Presets** maken (effecten, sequencers, mixer, modulatoren, mastering, tools) | [presets/AGENTS.md](presets/AGENTS.md) | de `AGENTS.md` van het apparaat |
| Een **song componeren** | [songs/AGENTS.md](songs/AGENTS.md) | [devices/AGENTS.md](devices/AGENTS.md) voor kabels, klok en signaalketens, en de soort van elk apparaat dat je gebruikt |
| Een **samplepack** maken | [samples/AGENTS.md](samples/AGENTS.md) | contract §13e |
| Een **skin** maken (het uiterlijk van één apparaat) | [skins/AGENTS.md](skins/AGENTS.md) | het skincontract |
| De **host** wijzigen of testen | [patchkamer/AGENTS.md](patchkamer/AGENTS.md) | |

Elk bestand in de boom verwijst omhoog naar zijn bovenliggende `AGENTS.md` en omlaag naar de bestanden eronder. Na een wijziging in de boom draai je `python3 docs/tools/agents-tree.py --check`: dat meldt elk `AGENTS.md` dat vanaf deze root niet bereikbaar is, en elk overzicht per soort dat verouderd is (herstel met `--write`).

## Regel 1: contract en validator hebben dezelfde versie

Het contract en de validator horen bij elkaar. Controleer dit **voor je begint**:

```
head -1 contract/PATCHKAMER-CONTRACT_NL.md contract/PATCHKAMER-CONTRACT_EN.md contract/validate-instrument.mjs
```

Alle drie de regels moeten dezelfde versie noemen (nu v1.27: "Instrumentcontract v1.27", "Instrument contract v1.27" en "Patchkamer contract v1.27"). Het getal bij `patchkamer:` in `patchkamer/js/songs.js` hoort daar ook mee gelijk te zijn.

- Noemen ze verschillende versies, **stop dan** en meld dat. Gok niet welke goed is en meng nooit een contract van de ene met een validator van de andere versie.
- Heb je bewust een oudere versie nodig, haal dan **beide** uit dezelfde tag: `git show contract/v1.8:contract/PATCHKAMER-CONTRACT.md` en `git show contract/v1.8:contract/validate-instrument.mjs` (tot en met v1.10 was er één contractbestand zonder taalachtervoegsel; vanaf v1.11 zijn het `_NL.md` en `_EN.md`). Zet ze buiten de repo (bijvoorbeeld in je tijdelijke map), niet in `contract/`.
- Bouw standaard voor de versie die in de repo staat.
- Noem in je oplevering de versie waarvoor je gebouwd hebt.

## Regel 2: elke wijziging krijgt een nieuw versienummer (SemVer)

Sinds 08-11 (Freek) gaat **elke wijziging** met een versienummer mee. We gebruiken [SemVer](https://semver.org/lang/nl/) (`MAJOR.MINOR.PATCH`) voor vijf soorten dingen. Eén plek per soort, en `docs/tools/check-versions.py` controleert dat alles klopt (draai hem vóór je oplevert; GitHub draait hem bij elke push):

| Wat | Waar staat de versie | Wanneer verhoog je |
|---|---|---|
| **Patchkamer (de host)** | `patchkamer/version.json` (`version`, daarnaast `contract` en `skinsContract`); de app-versie volgt (`node app/sync-version.js`) | **Elke wijziging die een gebruiker merkt of die de host verandert.** PATCH: een fout hersteld, een tekst, iets kleins. MINOR: een nieuwe functie of een duidelijke gedragsverandering, en elke contractwijziging. MAJOR: pas vanaf 1.0.0 voor wat bestaande werkruimtes, songs of apparaten breekt; zolang we onder 1.0.0 zitten telt een breuk als MINOR met "let op" in de changelog. |
| **Apparaatcontract** | kop van `contract/PATCHKAMER-CONTRACT_NL.md` en `_EN.md`, `contract/validate-instrument.mjs`, `patchkamer:'…'` in `patchkamer/js/songs.js` en `contract` in `patchkamer/version.json` (alle gelijk, zie Regel 1) | MINOR voor iets nieuws dat apparaten mogen of moeten (`x.y`, dus v1.27 is 1.27.0); MAJOR voor een breuk. Een verduidelijking zonder nieuw gedrag hoeft geen nieuw nummer, maar de host krijgt dan wel een PATCH. **Een contractwijziging verhoogt altijd ook de host (minstens MINOR)** en krijgt een regel in de versietabel. |
| **Skins** | per skin `version` in het bestand; het formaat `skinsContract` in `skins/contract/` (kop NL, EN en `validate-skin.mjs`, en `skinsContract` in `patchkamer/version.json`) | Skin: PATCH voor een kleurtje of tekst, MINOR voor nieuwe regels of een nieuwe verschijning, MAJOR voor een ander uiterlijk dat bestaande keuzes breekt. Skinscontract: zoals het apparaatcontract (`0.x`). |
| **Presets en tunes** (en samples) | per pack `version` op het hoogste niveau van het bestand (contract v1.27) | PATCH voor een verbeterde instelling of tekst, MINOR voor nieuwe presets, tunes of samples, MAJOR voor verwijderd of hernoemd (bewaarde songs kunnen ernaar verwijzen). De `version` bij een los preset of tune is de **apparaatversie** waarvoor hij is gemaakt, niet de packversie. |
| **Apparaten** | `version` in het apparaatbestand (zie Regel 1 en "Een bestaand apparaat wijzigen") | Zoals SemVer; `id`, poort-id's en state-velden blijven gelijk. |

Hoe je het doet, bij een commit die iets wijzigt:

1. **Haal eerst op, kies dan het nummer.** Doe `git pull --rebase --autostash` **vóór** je het nummer kiest, bepaal de soort (PATCH, MINOR of MAJOR) en verhoog **ten opzichte van het hoogste nummer dat je ziet**: dat van `origin/main` (`git show origin/main:patchkamer/version.json`), maar ook een hoger nummer dat een andere agent nog niet heeft gepusht. Kijk daarvoor in je werkmap: `git diff patchkamer/version.json` en het bovenste kopje van de changelogs (staat daar een versie boven `version.json`, of een `version.json` die hoger is dan in HEAD, dan is een ander bezig: tel daarbovenop, of vraag hem welk nummer hij neemt). Twee commits met hetzelfde nummer, of een `version.json` die achterloopt op het bovenste changelogkopje, mag niet (zo ging 0.2.4 fout: de bump van de ander was nog niet gepusht). Na de commit: `python3 docs/tools/check-versions.py` op wat je commit; dat moet `OK` geven.
2. **Zet de wijziging in de changelog onder het nieuwe nummer**: `CHANGELOG.md` én `CHANGELOG_NL.md`, met een kopje `## x.y.z (JJJJ-MM-DD)`, dezelfde inhoud in beide talen. Het bovenste kopje is altijd het nummer in `version.json`.
3. **Verhoog ook de versie van wat je wijzigde** buiten de host: een skin, een pack, een apparaat. Een wijziging in een pack of skin is voor de host zelf een PATCH of MINOR (nieuwe skin of pack = MINOR).
4. **Draai** `python3 docs/tools/check-versions.py`. Het moet `OK` geven. Een tag `vX.Y.Z` (die de App-workflow een Release laat bouwen) zet alleen Freek of ik na zijn akkoord; zie `CLAUDE.md`. De versie staat ook op GitHub in de README (badges), de changelog en de controle (Actions).
5. Raak je gedeelde bestanden (changelog, `version.json`) terwijl een andere agent ook bezig is: stage alleen je eigen regels en los een conflict op door **het hoogste nummer te nemen en daarbovenop te tellen**.

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
