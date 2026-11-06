# AGENTS.md: patchkamer/

Dit bestand is voor AI-agents. Het is niet geschreven voor mensen. Het hoort bij de algemene instructies in `../AGENTS.md`; lees die eerst.

## Wat hier staat

`patchkamer.html` is de **host**: de studio zelf, als één HTML-pagina. Ze plaatst en koppelt apparaten, draait de klok en beheert tunes, presets en songs. De host implementeert het contract in `../contract/PATCHKAMER-CONTRACT.md`. Ze ondersteunt nu contract **v1.11** (in de code: `patchkamer:'1.11'`). De host is tweetalig (Nederlands en Engels, standaard de taal van de browser) en heeft onder Instellingen een Audio-gedeelte (kwaliteit, sample rate, latency, oversampling). Het contract staat niet in de host maar op GitHub (links onder Instellingen → Contract & opstelling).

Naast de host staan `manifest.webmanifest` en `icons/` (favicon, `apple-touch-icon.png`, 192 en 512 px voor een app-icoon op een telefoon). De SVG-favicon zit als data-adres in de kop van `patchkamer.html`; de host werkt ook zonder deze bestanden.

## Voor het bouwen van een apparaat

De host is hier **alleen om in te testen**. Pas haar niet aan om een apparaat te laten werken. Past het apparaat niet in de host, dan klopt het apparaat niet met het contract.

Eerst `node ../contract/validate-instrument.mjs ../devices/<categorie>/<Naam>/<naam>.patchkamer-device.js` laten slagen (zie `../AGENTS.md`). Test daarna wat de validator niet kan zien:

1. Start een lokale webserver in de root van de repo, bijvoorbeeld `python3 -m http.server 8080`, en open `http://localhost:8080/patchkamer/patchkamer.html`. Gebruik geen `file://`: dan laadt de host geen bibliotheken.
2. Laad het apparaat: gebruik het bestandsveld voor een instrumentbestand (`.js`), of kies een map met een `patchkamer.json` (contract §16).
3. Zet het apparaat op de vloer en kijk of het doet wat de opdracht vraagt: klinkt het, bewegen de regelaars mee, springen ze terug bij een preset?
4. Test de presetronde (contract §17, laatste alinea): zet een preset, verander een knop, kies de preset opnieuw en kijk of alles terugspringt.
5. Wissel van versie als er twee `version`s zijn (contract §13): de state moet overeind blijven.
6. Wissel de taal (Instellingen → Taal, Nederlands en English; de pagina laadt opnieuw en de werkruimte blijft) en controleer dat alle tekst van het apparaat meewisselt. Een tekst die in de andere taal hetzelfde blijft terwijl hij vertaald hoort te zijn, is een fout in het apparaat.

Heb je geen browser tot je beschikking, schrijf dan in je oplevering dat de hosttest **niet is uitgevoerd**. Beweer niet dat het apparaat werkt.

## Wanneer je de host zelf wijzigt

Alleen als de opdracht dat uitdrukkelijk zegt. De host en het contract horen bij elkaar:

- Verandert het gedrag dat apparaten zien (`host`-API, poorten, state), dan verandert ook `../contract/PATCHKAMER-CONTRACT_NL.md`, `../contract/PATCHKAMER-CONTRACT_EN.md` (altijd allebei) en `../contract/validate-instrument.mjs`, **alle drie naar dezelfde nieuwe versie**, en het getal bij `patchkamer:` in de HTML.
- Zorg dat bestaande apparaten in `../devices/` nog door de validator komen.
- **Elke tekst die de host toont staat in beide talen.** In de HTML een `data-i18n`-sleutel (of `data-i18n-title`, `-ph`, `-aria`, `-html`), in de code `pkt('sleutel', …)` (meervoud: `pktp('sleutel', voorwaarde, …)`), en de tekst in de woordenboeken `I18N.nl` en `I18N.en` bovenin het bestand. Voeg nooit een tekst in maar één taal toe. De bronstaal is Nederlands; Engelse muziekvaktermen (tune, preset, latency, sample rate, oversampling) blijven in beide talen Engels, en de merknaam Patchkamer wordt nergens vertaald.
- Gebruikers hebben bewaarde werkruimtes en songs die op `id` en `version` van apparaten steunen. Breek dat niet.

## Categorie-iconen in de bibliotheekindeling

Een categorie in `patchkamer-bibliotheek.json` (`categories[]`) mag een veld `icon` hebben: een ingebouwd icoon-id (`synth`, `groove`, `sequencer`, `mod`, `effect`, `mastering`, `mix`, `tool`, `other`, `sampler`, `mic`, `speaker`, `note`, `bolt`, `star`, `folder`), een `data:image/...;base64,...`-adres (hoogstens ±200 kB) of een adres van dezelfde bron als de bibliotheek. Ontbreekt het, dan geldt een bestand `icon.svg`, `icon.png`, `icon.webp` of `icon.jpg` (die volgorde, hoofdletterongevoelig) in de map die als categorie telt (de map direct onder de bron, bijvoorbeeld `devices/synths/`), anders het ingebouwde icoon. Volgorde van winst: keuze van de gebruiker onder Indeling (en `icon` in het indelingsbestand) > `icon.*` in de map > ingebouwd. Een `icon.*` in een andere map doet niets. Afbeeldingen worden alleen als `<img>` getoond, nooit als markup. Voeg geen iconen toe aan `devices/` zonder opdracht.

## Licentie

`AGPL-3.0-or-later`. Het platform blijft open: ook een betaalde webversie deelt zijn broncode. Zie `LICENSE`.
