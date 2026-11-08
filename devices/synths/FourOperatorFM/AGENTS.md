# AGENTS.md: Four-Operator FM

Dit bestand is voor AI-agents die **tunes voor Four-Operator FM** maken. Het is niet geschreven voor mensen. Het hoort bij `../../../AGENTS.md` (algemeen) en `../../../tunes/AGENTS.md` (regels voor tunepacks); lees die eerst. Hier staat wat alleen voor Four-Operator FM geldt.

## Wat Four-Operator FM is

Een FM-synth met vier sinus-operators en acht stemmen. Elke operator heeft een eigen frequentieverhouding (ratio), een niveau, een fijnafstemming in cent en een eigen envelope (attack, decay, sustain, release). Acht algoritmes bepalen welke operators elkaar moduleren (frequentiemodulatie) en welke je hoort (carriers). Operator 4 heeft feedback. Daarbij komen een LFO met vibrato en tremolo, een transpositie en een uitgangsniveau. Het apparaat heeft geen eigen sequencer of arpeggiator: het speelt de noten die het binnenkrijgt (van een toetsenbord of een sequencer) en heeft knoppen om een testnoot of testakkoord te spelen.

| | |
|---|---|
| Bestand | `four-operator-fm.patchkamer-device.js` (in deze map) |
| `id` | `nl.patchkamer.fouroperatorfm`. Verander die nooit: daaraan hangen tunes en songs van gebruikers |
| Naam | `Four-Operator FM` in alle talen; alleen de poortnamen `Stereo` en `Keyboard / notes` hebben een Nederlandse variant (via `i18n`) |
| Soort | `instrument`: dit apparaat krijgt dus **tunes** (geen presets) |
| Poorten | eventingang `notes` (Keyboard / notes), modulatie-ingang `mod`, audio-uitgang `out` (Stereo) |
| Contract | v1.11 |
| Licentie apparaat | AGPL-3.0-or-later |

Dit apparaat is de nieuwe, bijgewerkte vorm van een ouder bestand met een andere naam en id. Tunes of songs uit die tijd verwijzen naar de oude id en laden hier niet in. De state-sleutels zijn ongewijzigd.

## Wat je hier doet

Je maakt klanken (tunes) voor Four-Operator FM en zet ze als pack in `../../../tunes/`. Het apparaat zelf pas je alleen aan als de opdracht dat zegt (`version` ophogen; `id`, poort-id's en state-velden gelijk houden).

## Hoe de klank ontstaat

- Elke operator is een sinus. Operator `n` wordt gemoduleerd door de operators die het algoritme aanwijst: hun uitvoer (niveau × envelope) telt mee als faseverschuiving, ruwweg 6 radialen bij niveau 1. Hoe hoger het niveau van een modulator (en hoe langer zijn envelope blijft staan), hoe helderder en schraler de klank.
- De ratio is de frequentie van de operator ten opzichte van de noot. Hele getallen geven harmonische klanken (1, 2, 3, 4…); gebroken getallen (1,41; 3,5; 7; 14) geven klokken, metaal en glas. De fijnafstemming (−12 … 12 cent) laat een operator iets zweven.
- De carriers (de operators die je hoort) worden opgeteld en gedeeld door de wortel van hun aantal. Een carrier met sustain 0 en een korte decay klinkt als een tik of aanslag; sustain 1 houdt de toon vast zolang de toets ingedrukt is.
- De acht algoritmes (operators genummerd 1 tot 4; `a → b` betekent: a moduleert b):
  1. 4 → 3 → 2 → 1; hoorbaar: 1. Eén lange keten, de rijkste klank.
  2. 3 en 4 → 2 → 1; hoorbaar: 1.
  3. 4 → 3 en 2 beide → 1; hoorbaar: 1.
  4. 4 → 2 en 3 beide → 1; hoorbaar: 1.
  5. 2 → 1 en 4 → 3; hoorbaar: 1 en 3. Twee paren, goed voor tines, pianoachtige en akkoordklanken.
  6. 4 → 1, 4 → 2 en 4 → 3; hoorbaar: 1, 2 en 3. Eén modulator voor drie carriers (klokken, glas).
  7. 4 → 3; hoorbaar: 1, 2 en 3. Twee gewone sinussen plus een gemoduleerd paar (pads, orgels met kleur).
  8. Geen modulatie; hoorbaar: alle vier. Puur additief (orgel); de feedback van operator 4 voegt wat ruwheid toe.
- Operator 4 heeft feedback (`feedback`, 0 … 7). Bij 0 is het een zuivere sinus, bij 2 tot 3 een zaagachtige toon, bij 6 tot 7 ruis. Feedback werkt via het algoritme door in alle operators die operator 4 moduleren.
- Envelope: attack is een lineaire stijging; decay zakt in `d` seconden naar het sustainniveau; sustain houdt dat vast; release klinkt na het loslaten uit. De tijden zijn in seconden (attack 0,001 … 4; decay en release 0,02 … 8).
- Acht stemmen. Bij de negende noot vervangt het apparaat eerst een stem die al is losgelaten, anders de oudste.

## De state

`state` van een tune is wat `getPreset()` teruggeeft: alle velden hieronder behalve `testNote` en `operator` (dat is een werkstand van de kaart). `getState()` geeft ook die twee.

Per operator `n` (1 tot 4) zijn er zeven velden. Het voorvoegsel is `o1` … `o4`. De standaardwaarden verschillen per operator (zie de kolommen).

| Veld | Wat | Bereik | Start op OP 1 / 2 / 3 / 4 |
|---|---|---|---|
| `oNratio` | Frequentieverhouding t.o.v. de noot (logaritmisch) | 0,5 … 16 | 1 / 1 / 1 / 1 |
| `oNlevel` | Niveau van de operator; voor een modulator is dit de modulatiediepte, voor een carrier het volume | 0 … 1 | 0,85 / 0,8 / 0,55 / 0,3 |
| `oNdetune` | Fijnafstemming in cent | −12 … 12 | 0 / 0 / 0 / 0 |
| `oNa` | Attack in seconden (logaritmisch) | 0,001 … 4 | 0,005 voor alle vier |
| `oNd` | Decay in seconden (logaritmisch) | 0,02 … 8 | 0,5 / 0,16 / 0,3 / 0,2 |
| `oNs` | Sustainniveau | 0 … 1 | 0 / 0,1 / 0,1 / 0 |
| `oNr` | Release in seconden (logaritmisch) | 0,02 … 8 | 0,25 voor alle vier |

De algemene velden:

| Veld | Wat | Bereik | Start |
|---|---|---|---|
| `algorithm` | Algoritme (zie hierboven) | geheel getal 1 … 8 | 1 |
| `feedback` | Feedback van operator 4 | 0 … 7 | 2 |
| `lfoRate` | LFO-snelheid in Hz (driehoeksgolf, logaritmisch) | 0,05 … 20 | 4 |
| `vibrato` | Vibrato-diepte in cent | 0 … 80 | 0 |
| `tremolo` | Tremolo-diepte (volume volgt de LFO) | 0 … 1 | 0 |
| `transpose` | Transpositie in halve tonen | −24 … 24 | 0 |
| `level` | Uitgangsniveau | 0 … 1 | 0,8 |
| `preset` | Naam van het klankbeeld waarmee de kaart begon; alleen een label, het heeft geen invloed op het geluid | een van `Rubber Bass`, `Digital Tines`, `Hollow Organ`, `Metal Bells`, `Stab Chord`, `Glass Marimba`, `Breathing Pad`, `Wire Pluck`; anders `Rubber Bass` | `Rubber Bass` |
| `testNote` | MIDI-noot van de testknoppen. Hoort niet in een tune | 24 … 96 | 48 |
| `operator` | Welke operator de kaart toont. Hoort niet in een tune | 0 … 3 | 0 |

In totaal 28 operatorvelden, 6 algemene numerieke velden plus `algorithm` en `preset`. De volledige `state` van een tune bevat alle 28 + 6 + `algorithm` (en eventueel `preset`); zet ze allemaal, dan klinkt de tune precies zoals bedoeld en hangt hij niet af van wat de kaart toevallig had.

De velden `oNratio`, `oNdetune`, `transpose` en `vibrato` zijn toonhoogte; `oNlevel` en `level` zijn volume. Een modulator (een bron op de Mod-ingang) kan alle numerieke velden sturen; de `state` slaat die sturing niet op.

Wat het apparaat met een state doet (getest):
- Getallen buiten het bereik worden afgekapt (`feedback: 99` wordt 7); een tekst, `NaN`, `null` of ontbrekende waarde geeft de startwaarde.
- Een ongeldig `algorithm` (buiten 1 … 8, of geen getal) of een onbekende `preset` geeft de startwaarde. `algorithm` mag ook als tekst `"3"` binnenkomen.
- `operator` en `testNote` worden afgerond en afgekapt.
- Onbekende velden worden genegeerd. Zet er geen in. `setState({})` geeft de standaardwaarden.
- Een `getPreset()` laat `testNote` en `operator` weg; `setPreset()` laat die twee op de kaart staan.

## Goede instellingen per soort klank

Neutrale richtlijnen; luister (of laat Freek luisteren) voordat je ze als goed bestempelt.

- **Basis voor een bas**: algoritme 1 of 2, OP 1 ratio 1, OP 2 ratio 1 of 2 met niveau 0,6 tot 0,9 en korte decay (0,1 tot 0,3 s, sustain 0 tot 0,1), feedback 1 tot 3, `transpose` −12. Houd de release kort (0,1 tot 0,3 s).
- **Lead**: algoritme 1, 4 of 5; sustain van de carrier 0,7 tot 1; een modulator met ratio 1, 2 of 3 en niveau 0,4 tot 0,7 en een langzame decay; vibrato 8 tot 25 cent op `lfoRate` 4 tot 6 Hz; attack 0,005 tot 0,03 s.
- **Pad**: algoritme 5, 7 of 8; attacks van 0,6 tot 1,5 s en releases van 1,5 tot 4 s op de carriers; sustain 0,7 tot 1; kleine fijnafstemming (±3 tot ±8 cent) op de tweede carrier voor beweging; `tremolo` 0,1 tot 0,3 op een lage `lfoRate` (0,1 tot 0,4); feedback 0 tot 1.
- **Pluck**: algoritme 1, 3 of 6; sustain 0 op alle operators, decay 0,15 tot 0,6 s, release 0,1 tot 0,4 s; een modulator met een hoge ratio (3 tot 7) en een kortere decay dan de carrier geeft de tik aan het begin.
- **Klok, glas, metaal**: algoritme 6 of 5; modulator-ratio's die niet geheel zijn (3,5; 7; 3,14; 6,28; 14); feedback 3 tot 5; lange decays (1,5 tot 3 s) met sustain 0.
- **Elektrische piano of tines**: algoritme 5, tweede paar met ratio 14 en een zeer korte decay (0,05 tot 0,2 s) voor de aanslag; carriers met ratio 1.
- **Orgel**: algoritme 8, alle sustains op 1, ratio's 1, 2, 3, 4 (of 0,5, 1, 2, 3) met dalende niveaus en feedback 0.
- **Arpeggio of snel spel**: korte release (≤ 0,3 s) en een decay die binnen de nootlengte uitklinkt. Met sustain 0 hoef je niets te beperken. Er zijn acht stemmen; lange releases bij snelle noten laten stemmen overlappen en de oudste valt weg.
- Zet de som van de carrierniveaus niet boven ongeveer 1: het apparaat deelt al door de wortel van het aantal carriers, en een begrenzer (ceiling) en compressor zitten achter de uitgang. `level` rond 0,6 tot 0,8 is gebruikelijk.

## Een tune

Een pack heet `naam.patchkamer-tunes.json` en staat in `../../../tunes/`. Het formaat en de licentie (`CC0-1.0` voor alles in `tunes/`) staan in `../../../tunes/AGENTS.md`. Voor dit apparaat is `device` altijd `nl.patchkamer.fouroperatorfm` en elke tune is `kind: "set"` met een volledige `state` als hierboven. Het apparaat heeft geen eigen sequencer of patroon in de state: een tune bevat dus alleen een klank. Wil een tune een melodie laten horen, dan hoort die in een song, niet in de tune. Zet geen merknamen van bestaande apparatuur in naam of omschrijving, en verzin geen persoon bij `author`.

Laat `testNote` en `operator` weg uit een tune. Zet geen routing erin (het apparaat heeft er geen).

## Wat een tune niet moet doen

- Geen waarden buiten het bereik (ze worden afgekapt, en de tune klinkt dan anders dan bedoeld).
- Geen onbekende velden of oude namen van een ander apparaat.
- Geen klank die alleen door sturing via de Mod-ingang klinkt: de state slaat die niet op.
- Geen lange releases (> 4 s) of attacks (> 2 s) op een klank die snel gespeeld wordt.
- Een klank met alle carrierniveaus op 0 of alle sustains op 0 én een decay van 0,02 klinkt bijna niets; dat is geen storing maar geeft wel een stille tune.

Het apparaat kan niet ontsporen: de operators zijn begrensde sinussen, en ook feedback 7 met een modulatiediepte van 1 blijft eindig. Een bewaker in de motor zet de stemmen en het gelijkspanningsfilter terug als er toch een niet-eindige waarde in de uitvoer zou komen, zodat het apparaat niet voor altijd stil kan vallen.

## Controleren

- Draai vanuit de root van de repo: `node contract/validate-instrument.mjs devices/synths/FourOperatorFM/four-operator-fm.patchkamer-device.js` (en met `--lang en`). Dat moet `OK` geven, zonder `let op`.
- Je kunt niet horen hoe een tune klinkt. Heb je een browser, laad dan de host (`../../../patchkamer/AGENTS.md`) en kies de tune. Heb je geen browser, schrijf dan in je oplevering dat de tune **niet beluisterd** is.
- Alle tekst in het apparaat staat in het woordenboek `EN` bovenin het bestand (Nederlandse bron, Engels via `host.lang`). Een nieuwe tekst krijgt altijd nl én en.

## Wat je niet doet

- Verander nooit de `id`, de `kind`, de poort-id's of de namen van state-velden.
- Pas het apparaat niet aan om een tune te laten kloppen.
- Commit of push niet, tenzij de opdracht dat vraagt.

## Documentatie en songs

Dit zijn de plaatsen waar je terechtkunt voor documentatie en voor het componeren van songs met dit apparaat. Songs zijn CC-BY-4.0, tunes en presets CC0-1.0, het apparaat AGPL-3.0-or-later.

- Handleiding van Four-Operator FM: [NL](../../../docs/synths/USER-MANUAL_NL.md#four-operator-fm) · [EN](../../../docs/synths/USER-MANUAL_EN.md#four-operator-fm).
- Overzicht van de soort: [README](../README.md); handleiding van de hele soort: [NL](../../../docs/synths/USER-MANUAL_NL.md) · [EN](../../../docs/synths/USER-MANUAL_EN.md).
- Tunes (klanken, `kind: set`): [four-operator-fm-styles.patchkamer-tunes.json](../../../tunes/four-operator-fm-styles.patchkamer-tunes.json). Kies een tune als beginpunt voor de `state` van dit apparaat in de song; velden die de tune niet noemt krijgen hun standaard. Hoe tunes zijn opgebouwd: [tunes/AGENTS.md](../../../tunes/AGENTS.md).
- Overzicht van alle apparaten en hun signaalketens: [devices/AGENTS.md](../../../devices/AGENTS.md). Een song componeren: [songs/AGENTS.md](../../../songs/AGENTS.md).
- Route voor agents: [soort Synths](../AGENTS.md) → [devices/AGENTS.md](../../AGENTS.md) → [root AGENTS.md](../../../AGENTS.md). Contract: [NL](../../../contract/PATCHKAMER-CONTRACT_NL.md) · [EN](../../../contract/PATCHKAMER-CONTRACT_EN.md). Hoe tunes van dit apparaat zijn opgebouwd: [tunes/AGENTS.md](../../../tunes/AGENTS.md). <!-- agents-tree -->
- Rol in een song: FM-synth met acht stemmen voor leads, bellen en bassen. Noten op `notes`, audio uit `out` (stereo).
