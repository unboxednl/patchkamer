# AGENTS.md: Balance EQ

Dit bestand is voor AI-agents die **presets voor Balance EQ** maken of het apparaat configureren. Het is niet geschreven voor mensen. Het hoort bij `../../../AGENTS.md` (algemeen) en `../../../presets/AGENTS.md` (regels voor presetpacks, als die er is); lees die eerst. Hier staat wat alleen voor Balance EQ geldt.

## Wat Balance EQ is

Een equalizer met vijf tot twaalf banden (band 1 = low shelf, band 5 = high shelf, de rest bells; standaard vijf) en optionele dynamische banden 2 en 4. De kaart toont drie secties (Frequentie, Gain, Q) met per band een verticale schuif. Een analyse van acht seconden doet een kleine, voorzichtige correctie als voorstel. Het apparaat hoort bij de mastering-apparaten (`devices/mastering/`): ze delen één motor (eigen stereo-DSP in een AudioWorklet, met een terugval in de pagina) en praten met de **Master Director**.

| | |
|---|---|
| Bestand | `balance-eq.patchkamer-device.js` (in deze map) |
| `id` | `nl.patchkamer.balanceeq`. Verander die nooit: daaraan hangen presets en songs van gebruikers |
| Naam | `Balance EQ` in alle talen; de kaart, de besturingen, de opties, de startprofielen, de meldingen en de poortnamen zijn tweetalig (`host.lang`, `LOC` en `TXT` bovenin) |
| Soort | `effect`: dit apparaat krijgt dus **presets** (geen tunes) |
| Poorten | audio-ingang `in` (Stereo in); audio-uitgang `out` (Stereo uit); mastering-ingang `setup` (Master Director: driehoekpoort voor de gele, gestippelde mastering-kabel van de Master Director) |
| Contract | v1.18 gebouwd; apparaatversie 1.14.0 |
| Licentie apparaat | AGPL-3.0-or-later |

Dit apparaat is de nieuwe, bijgewerkte vorm van een ouder bestand met een andere naam en id (Balans EQ, `nl.patchkamer.mastering.eq`). Presets of songs uit die tijd verwijzen naar de oude id en laden hier niet in. De DSP is sample voor sample gelijk aan het oude bestand (bewezen met een offline render); alleen de meldingen uit de DSP zijn codes geworden die de kaart vertaalt, en de waarden van de keuze "Doelkarakter" heten nu Engels (`transparent`, `firm`).

## De state

`getState()` geeft de waarden hieronder plus de werkstand (`bypass`, `match`, `auto`, `amount`, `remote`, `locks`, `layout`). Een **preset** (`getPreset()`) bevat de klank: dezelfde velden **zonder** `bypass`, `match`, `auto`, `remote`, `locks` en `layout`, want dat is werkstand en weergave; `setPreset` laat die staan. **`bands` hoort wel bij de klank en staat in elke preset.** Een getal buiten het bereik wordt afgekapt; een tekst, `NaN`, `Infinity` of een ontbrekende waarde geeft de startwaarde; een ongeldige keuze geeft de startwaarde. Onbekende velden worden genegeerd.

| Veld | Naam (nl / en) | Bereik | Start |
|---|---|---|---|
| `bands` | Banden / Bands | geheel getal 5 … 12 (afgerond en afgekapt) | 5 |
| `layout` | Indeling / Layout (niet in de preset) | `auto`, `side`, `stack` | `auto` |
| `f1` … `f12` | Band n frequentie / Band n frequency | 20 … 20000 Hz | 90, 330, 1000, 3300, 9500, 120, 450, 1500, 2600, 5000, 7500, 14000 |
| `g1` … `g12` | Band n gain | -18 … 18 dB | 0 |
| `q1` … `q12` | Band n Q | 0.1 … 20 | 0.707, 1, 0.8, 1, 0.707, 1, 1, 1, 1, 1, 1, 1 |
| `dynamic` | Dynamische banden / Dynamic bands | `true` of `false` | `false` |
| `dynThreshold` | Dynamische threshold / Dynamic threshold | -60 … -6 dB | -30 |
| `dynamicMax` | Maximale dynamische cut / Maximum dynamic cut | 0 … 9 dB | 3 |
| `amount` | Auto-/voorstelsterkte / Auto / suggestion strength | 0 … 1 | 0,7 |

Regels voor de banden:

- Band 1 is een **low shelf**, band 5 een **high shelf**, banden 2 t/m 4 en **6 t/m 12 zijn bells**. Een band is alleen **actief** als zijn nummer ≤ `bands` is (band 1 t/m 5 altijd). Een inactieve band verwerkt niets, is niet zichtbaar en niet in `params()`.
- Een inactieve band staat **altijd op zijn standaard** (f, g en q), ook als je er iets in zet: `setState`, `setPreset` en het verlagen van `bands` zetten hem terug, en een vergrendeling (`locks`) van een inactieve band vervalt. Verhoog je `bands` weer, dan begint de band op zijn standaard.
- De bereiken zijn alleen uitgebreid (was 25 … 16000 Hz, -12 … 12 dB, 0.3 … 8): elke eerdere waarde, elke bestaande preset en elk Master Director-recept blijft ongewijzigd geldig.
- **Voorstellen en Volg** (`Analyseer 8 s`, `Pas voorstel toe`, `Volg`) werken alleen voor band 1 t/m 5 (en `dynThreshold`). **Extra banden (6 t/m 12) worden nooit automatisch aangepast.**
- `locks` kan elke regelaar-sleutel bevatten, ook `f6` … `q12` (alleen bewaard zolang die band actief is). Een vergrendelde sleutel slaan Volg, voorstellen, startprofielen en de Master Director over.
- De Master Director (`configureMastering`) zet alleen `g1` … `g5`, `dynamic`, `auto`, `amount`, `match`, `bypass`; hij kan `bands` niet zetten en een patch voor een inactieve band wordt genegeerd (geen fout, niet in `changed`).
- **Modulatie** (`params()`, `modulate()`): bevat de continue regelaars van de **actieve** banden (nu 17 bij 5 banden, 26 bij 8, 38 bij 12; id = state-sleutel) en `dynThreshold`/`dynamicMax`. Verandert `bands`, dan roept het apparaat `host.paramsChanged` aan. Alles staat standaard uit in Drift. Modulatie schrijft nooit in de state. Q moduleert logaritmisch (net als frequentie). `amount`, `bands` en `layout` zijn niet stuurbaar.
- **Een oude state of preset zonder `bands`** laadt als 5 banden en klinkt bit-gelijk aan versie 1.12.2.

Startprofielen in de kaart (keuzelijst "Startprofiel"): `Neutral`, `Warmer`, `Brighter`, `Gentle dynamics`. Ze zetten een paar waarden; ze zijn geen apart veld in de state.

## De kaart

Drie secties naast elkaar (of onder elkaar als de kaart smal is, of altijd, kies **Indeling**): **Frequentie** (Hz), **Gain** (dB) en **Q**. Per band een verticale schuif met de waarde erboven en alleen het bandnummer eronder; een klik op het bandnummer vergrendelt die regelaar. De ids zijn de state-sleutels (`f1`, `g1`, `q1`, …) met rol `param` en groep `frequency`, `gain` of `q`; de vergrendelknoppen heten `locks.<sleutel>`. **Banden** (5 … 12) voegt banden toe of haalt ze weg.

- Schuif: frequentie en Q zijn logaritmisch (8000 resp. 6000 posities; de `min`/`max` die de host ziet zijn die posities), gain is lineair met stap 0,1 dB. Een schuifbeweging rondt frequentie en Q af op drie cijfers; de state kan ook exacte waarden bevatten (preset, typen via de host levert de dichtstbijzijnde stand).
- Pijltjes = kleine stap (0,1 dB; ~1 % bij frequentie en Q), Shift of Page omhoog/omlaag = grote stap (1 dB; een derde octaaf; ~50 % bij Q), Home/End = min/max, dubbelklik = beginwaarde, klik op het getal = typen (hostfuncties).
- Verticale schuif via `writing-mode: vertical-lr; direction: rtl` (Chromium 124+, Firefox 128+, Safari 17.4+ voor verticale range-inputs; getest alleen in Chromium) en `touch-action: none` zodat een veeg de pagina niet scrolt.
- Bij 12 banden en een smalle kaart (< ~400 px) scrollt een sectie horizontaal.

## Wat het apparaat met een state doet (getest)

- `setState({})` geeft alle startwaarden; `setState(getState())` geeft dezelfde state terug.
- Getallen buiten het bereik worden afgekapt, ongeldige waarden krijgen de standaard.
- Extreme instellingen (alles op het minimum of maximum) en een burst van `NaN`, `±Infinity` en 1e9 op de ingang geven geen niet-eindige samples en het geluid komt daarna terug.
- De Master Director zet via `configureMastering` echte instellingen; een vergrendelde besturing (`locks`) wordt overgeslagen.
- Met `bands: 5` is het geluid bit-gelijk aan versie 1.12.2 (differentiële test, presets en standaard, loop en roze ruis). Een extra bell (band 6 op 2 kHz, +6 dB) geeft +6,00 dB op 2 kHz; een band boven `bands` doet niets.
- De motor (de `DSP_SOURCE` in het bestand, ook als gewone code erboven) is voor dit apparaat aangepast: Q-ondergrens 0,1, tot 12 banden, een verwijderde band loopt door tot zijn gain is uitgegleden (geen klik). Houd de gewone code en de `DSP_SOURCE`-tekst gelijk; andere mastering-apparaten hebben een eigen kopie.

## Presets maken

- Een pack heet `<naam>.patchkamer-presets.json` en staat in `../../../presets/` (licentie `CC0-1.0`); `device` is `nl.patchkamer.balanceeq`, elke preset is `kind: "set"`. Gebruik formaat 2 (`formatVersion: 2`, zie een bestaand pack in `../../../presets/`).
- Gebruik precies de sleutels hierboven, met waarden binnen het bereik. Zet **geen** `bypass`, `match`, `auto`, `remote`, `locks` of `layout` in een preset.
- **Zet `bands` in elke preset** (5 … 12) en geef voor alle actieve banden f, g en q. Een preset met `bands: 8` heeft dus `f1`…`f8`, `g1`…`g8`, `q1`…`q8`; laat de sleutels van banden boven `bands` weg (of zet ze op de standaard): ze komen toch op de standaard. Ontbreekt `bands`, dan wordt het 5 (bestaande presets blijven zo kloppen). Een preset met een ander aantal banden dan de kaart toont, zet het aantal van de preset.
- Een preset met meer banden maken: begin met een 5-bandspreset, zet `bands` op het gewenste aantal en vul f, g en q van de extra banden in (bells; frequenties liefst oplopend). Bijvoorbeeld `"bands": 8, "f6": 2000, "g6": 6, "q6": 1.5`.
- Geef elke preset een Engelse naam, zonder merk- of modelnamen. Mappen: `Situations` (club, festival, big room, thuis, koptelefoon, studio, radio, auto, streaming), `Styles` (muziekstijlen) en één map per situatie met veelvoorkomende combinaties.
- Het pack voor dit apparaat is gegenereerd uit de recepten van de Master Director (stijl × situatie); wijzig het niet met de hand maar via de generator, anders lopen apparaat en Director uiteen. De presets in dat pack hebben (nog) geen `bands`; ze laden als 5 banden.

## Controleren

- `node contract/validate-instrument.mjs devices/mastering/BalanceEQ/balance-eq.patchkamer-device.js --lang nl` en `--lang en`, vanuit de root. Beide moeten `OK` geven, zonder `let op`; met `--controls` zie je de ids, rollen en groepen (`frequency`, `gain`, `q`).
- Je kunt niet horen hoe een preset klinkt. Schrijf in je oplevering dat het **niet beluisterd** is.
- Alle tekst in het apparaat staat in `TXT` en `LOC` bovenin het bestand (Nederlands en Engels). Een nieuwe tekst krijgt altijd nl én en.

## Documentatie en songs

Dit zijn de plaatsen waar je terechtkunt voor documentatie en voor het componeren van songs met dit apparaat. Songs zijn CC-BY-4.0, tunes en presets CC0-1.0, het apparaat AGPL-3.0-or-later.

- Handleiding van Balance EQ: [NL](../../../docs/mastering/USER-MANUAL_NL.md#balance-eq) · [EN](../../../docs/mastering/USER-MANUAL_EN.md#balance-eq).
- Overzicht van de soort: [README](../README.md); handleiding van de hele soort: [NL](../../../docs/mastering/USER-MANUAL_NL.md) · [EN](../../../docs/mastering/USER-MANUAL_EN.md).
- Presets (instellingen, `kind: set`): [balance-eq.patchkamer-presets.json](../../../presets/balance-eq.patchkamer-presets.json). Kies een preset als beginpunt voor de `state` van dit apparaat in de song; velden die de preset niet noemt krijgen hun standaard.
- Overzicht van alle apparaten en hun signaalketens: [devices/AGENTS.md](../../../devices/AGENTS.md). Een song componeren: [songs/AGENTS.md](../../../songs/AGENTS.md).
- Route voor agents: [soort Mastering](../AGENTS.md) → [devices/AGENTS.md](../../AGENTS.md) → [root AGENTS.md](../../../AGENTS.md). Contract: [NL](../../../contract/PATCHKAMER-CONTRACT_NL.md) · [EN](../../../contract/PATCHKAMER-CONTRACT_EN.md). Hoe presets van dit apparaat zijn opgebouwd: [presets/AGENTS.md](../../../presets/AGENTS.md). <!-- agents-tree -->
- Rol in een song: mastering, toonbalans op de eindmix. Audio in `in`, uit `out`; de gele gestippelde mastering-kabel van de Master Director gaat naar `setup`. Gebruik in de masterketen na de Mixer en vóór Listening Output of Speakers.
