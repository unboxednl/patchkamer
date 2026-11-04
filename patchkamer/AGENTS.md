# AGENTS.md: patchkamer/

Dit bestand is voor AI-agents. Het is niet geschreven voor mensen. Het hoort bij de algemene instructies in `../AGENTS.md`; lees die eerst.

## Wat hier staat

`patchkamer.html` is de **host**: de studio zelf, als één HTML-pagina. Ze plaatst en koppelt apparaten, draait de klok en beheert tunes, presets en songs. De host implementeert het contract in `../contract/PATCHKAMER-CONTRACT.md`. Ze ondersteunt nu contract **v1.10** (in de code: `patchkamer:'1.10'`).

## Voor het bouwen van een apparaat

De host is hier **alleen om in te testen**. Pas haar niet aan om een apparaat te laten werken. Past het apparaat niet in de host, dan klopt het apparaat niet met het contract.

Eerst `node ../contract/validate-instrument.mjs ../devices/<categorie>/<Naam>/<naam>.patchkamer-device.js` laten slagen (zie `../AGENTS.md`). Test daarna wat de validator niet kan zien:

1. Start een lokale webserver in de root van de repo, bijvoorbeeld `python3 -m http.server 8080`, en open `http://localhost:8080/patchkamer/patchkamer.html`. Gebruik geen `file://`: dan laadt de host geen bibliotheken.
2. Laad het apparaat: gebruik het bestandsveld voor een instrumentbestand (`.js`), of kies een map met een `patchkamer.json` (contract §16).
3. Zet het apparaat op de vloer en kijk of het doet wat de opdracht vraagt: klinkt het, bewegen de regelaars mee, springen ze terug bij een preset?
4. Test de presetronde (contract §17, laatste alinea): zet een preset, verander een knop, kies de preset opnieuw en kijk of alles terugspringt.
5. Wissel van versie als er twee `version`s zijn (contract §13): de state moet overeind blijven.

Heb je geen browser tot je beschikking, schrijf dan in je oplevering dat de hosttest **niet is uitgevoerd**. Beweer niet dat het apparaat werkt.

## Wanneer je de host zelf wijzigt

Alleen als de opdracht dat uitdrukkelijk zegt. De host en het contract horen bij elkaar:

- Verandert het gedrag dat apparaten zien (`host`-API, poorten, state), dan verandert ook `../contract/PATCHKAMER-CONTRACT.md` en `../contract/validate-instrument.mjs`, **alle drie naar dezelfde nieuwe versie**, en het getal bij `patchkamer:` in de HTML.
- Zorg dat bestaande apparaten in `../devices/` nog door de validator komen.
- Gebruikers hebben bewaarde werkruimtes en songs die op `id` en `version` van apparaten steunen. Breek dat niet.

## Licentie

`AGPL-3.0-or-later`. Het platform blijft open: ook een betaalde webversie deelt zijn broncode. Zie `LICENSE`.
