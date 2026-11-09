# AGENTS.md: Chord Sequencer

Dit bestand is voor AI-agents die dit apparaat configureren of er presets voor maken. Het is niet geschreven voor mensen. Het hoort bij `../../../AGENTS.md` (algemeen); lees die eerst. Hier staat wat alleen voor Chord Sequencer geldt.

## Wat Chord Sequencer is

Een sequencer voor akkoorden en patronen met vier onafhankelijke sporen (A–D). Het maakt **zelf geen geluid**: het stuurt noten als gebeurtenissen naar vier uitgangen, die je met vier synths verbindt (spoor A naar uitgang A, enzovoort). Het volgt de klok van de studio (`onStep`). Elk spoor heeft een grondtoon, een akkoordsoort, een omkeerligging, een speelwijze (volledig akkoord, arpeggio of alleen de grondtoon), een patroon van 1 tot 16 stappen, een nootdeling, een speelkans en herhalingen per stap. Vier scènes bewaren elk een eigen set van vier sporen. Een progressie van vier getallen verschuift de grondtoon per maat; vier maten vormen de cyclus.

Het verschil met `Pulse Drums` (drumcomputer, geeft geluid): Chord Sequencer is een sequencer zonder klankbron.

| | |
|---|---|
| Bestand | `chord-sequencer.patchkamer-device.js` (in deze map) |
| `id` | `nl.patchkamer.chordsequencer`. Verander die nooit: daaraan hangen presets en songs van gebruikers |
| Naam | `Chord Sequencer` in alle talen; de poortnamen hebben een Nederlandse variant (via `i18n`: `Transpositie`, `Spoor A` … `Spoor D`) |
| Soort | `utility` (categorie `sequencer`): dit apparaat krijgt dus **presets** (geen tunes) |
| Poorten | eventingangen `transpose` (Transpose) en `live` (Live, voor een toetsenbord of andere notenbron), modulatie-ingang `mod`, eventuitgangen `a`, `b`, `c`, `d` (Track A–D); geen audio; multi-MIDI-uitgang `tracks` (Tracks: alle sporen met hun namen in één dubbele gestreepte oranje kabel, elke gebeurtenis met `track` en `ch` = spoornummer; de losse spooruitgangen blijven ongewijzigd) |
| Contract | v1.24 (apparaatversie 1.18.0) |
| Licentie apparaat | AGPL-3.0-or-later |

Dit apparaat is de nieuwe, bijgewerkte vorm van een ouder bestand met een andere naam en id (Puls Sequencer, `nl.patchkamer.puls`, stond bij de synths). Presets of songs uit die tijd verwijzen naar de oude id en laden hier niet in.

## Geen tunes, wel presets

Alleen apparaten met `kind: 'instrument'` hebben tunes. Chord Sequencer is een `utility`, dus het krijgt **presets** en **nooit tunes** (contract §0 en §13c). Maak er geen pack voor in `../../../tunes/`. Een presetpack heet `naam.patchkamer-presets.json` en staat in `../../../presets/`; formaat volgens contract §13c, `formatVersion` 2, licentie `CC0-1.0`, `device` is altijd `nl.patchkamer.chordsequencer` en elke preset is `kind: "set"`. Maak alleen presets als de opdracht dat vraagt.

## De state

`getPreset()` geeft `getState()` zonder `editTrack`, `editStep` en `record` (werkstand: welk spoor je bewerkt, of er wordt opgenomen). Een preset laat die velden bij het laden staan. De state is gewone JSON.

| Veld | Wat | Bereik | Start |
|---|---|---|---|
| `scene` | Actieve scène (0 = scène 1) | hele getallen 0 … 3 | 0 |
| `launch` | Scènewissel: `"bar"` op de volgende maat, `"now"` direct | `"bar"` of `"now"` | `"bar"` |
| `seed` | Zaad van de speelkans (dezelfde seed en state geven steeds dezelfde noten) | hele getallen 0 … 4294967295 | 18743 |
| `thru` | Live doorgeven aan het gekozen spoor. **Staat alleen in de state als het `false` is** | alleen `false` | (ontbreekt = aan) |
| `rquant` | Kwantiseren bij inspelen (naar het raster van het spoor). **Alleen in de state als `false`** | alleen `false` | (ontbreekt = aan) |
| `record` | Opnemen aan. Werkstand, **niet in een preset**; alleen in de state als `true` | alleen `true` | (ontbreekt = uit) |
| `editTrack`, `editStep` | Werkstand (niet in een preset) | 0 … 3 en 0 … 15 | 0 |
| `t0gate` … `t3gate` | Nootlengte per spoor, als deel van de nootdeling | 0,1 … 1,5 | 0,7 |
| `t0velocity` … `t3velocity` | Velocity per spoor | 0,05 … 1 | 0,8 |
| `t0transpose` … `t3transpose` | Transpositie per spoor in halve tonen (wordt afgerond bij het spelen) | −24 … 24 | 0 |
| `scenes` | Lijst van **vier teksten**: per scène een JSON-tekst met een lijst van vier sporen (zie hieronder) | elke tekst korter dan 100000 tekens | vier scènes met de standaardsporen |

Een getal buiten het bereik wordt afgekapt; een tekst, `NaN`, `null` of een ontbrekende waarde geeft de startwaarde. Een scène die geen geldige JSON-lijst is, geeft de standaardscène.

### Een spoor in `scenes[n]`

`scenes` is dus `["<json>", "<json>", "<json>", "<json>"]`, met in elke json een lijst `[spoorA, spoorB, spoorC, spoorD]` van objecten met deze velden:

| Veld | Wat | Waarden | Standaard (A / B / C / D) |
|---|---|---|---|
| `name` | Spoornaam; leeg = de standaardnaam in de taal van de gebruiker (Chords, Bass, Pulse, Bells) | tekst, hoogstens 40 tekens | `""` |
| `enabled` | Speelt het spoor | `true`/`false` | aan / aan / uit / uit |
| `root` | Grondtoon als MIDI-nootnummer | 24 … 96 | 48 / 36 / 60 / 72 |
| `quality` | Akkoordsoort: `major` (0,4,7), `minor` (0,3,7), `sus` (0,5,7), `minor7` (0,3,7,10), `fifth` (0,7), `single` (alleen 0) | een van die zes | `minor` / `single` / `minor` / `minor` |
| `inversion` | Omkeerligging: zoveel keer gaat de laagste noot een octaaf omhoog | 0 … 3 | 0 |
| `mode` | `chord` alle noten tegelijk, `arp` de noten om de beurt (per afgespeelde stap de volgende), `pulse` alleen de grondtoon, `notes` speelt de opgenomen of getekende noten uit `rec` (zie hieronder) | een van die vier | `chord` / `arp` / `chord` / `chord` |
| `length` | Patroonlengte in stappen; elk spoor loopt onafhankelijk | 1 … 16 | 16 / 12 / 7 / 5 |
| `division` | Nootdeling in zestiende noten: 1 = 1/16, 2 = 1/8, 4 = 1/4, 8 = 1/2 | 1, 2, 4 of 8 | 4 / 2 / 1 / 2 |
| `steps` | Zestien getallen (0 of 1): speelt deze stap. Alleen de eerste `length` tellen | lijst van 16 | A: 1 op 0, 4, 8, 12; de andere sporen allemaal 1 |
| `progression` | Vier getallen: halve tonen die bij de grondtoon opgeteld worden in maat 1, 2, 3, 4 van de cyclus | 4 × −24 … 24 | `[0,3,-2,5]` |
| `probability` | Kans dat een stap speelt | 0 … 1 | 1 |
| `ratchet` | Herhalingen per stap (de nootlengte wordt gedeeld) | 1 … 4 | 1 |
| `grid` | Raster van het spoor: 2 = 1/32, 4 = 1/64. **Alleen aanwezig als het niet 1 (= 1/16) is** | 2 of 4 | (ontbreekt = 1/16) |
| `vel` | Velocity per stap: 16 getallen die met de velocity van het spoor worden vermenigvuldigd. **Alleen aanwezig als er iets anders dan 1 in staat** | 16 × 0,05 … 1 | (ontbreekt = alles 1) |
| `len` | Lengte per stap: 16 getallen die met de gate en de nootlengte worden vermenigvuldigd. **Alleen aanwezig als er iets anders dan 1 in staat** | 16 × 0,1 … 4 | (ontbreekt = alles 1) |
| `bars` | Aantal maten van de lus bij `mode: "notes"` (alleen aanwezig als niet 1) | 1 … 4 | (ontbreekt = 1) |
| `rec` | De noten van `mode: "notes"`: lijst van `[positie, noot, velocity, lengte]`, hoogstens 256, gesorteerd op positie (alleen aanwezig als niet leeg) | zie hieronder | (ontbreekt = leeg) |

Hoe het speelt: op elke zestiende noot (`onStep`) speelt een spoor alleen als de stapteller een veelvoud van `division` is. Dan telt het spoor zijn eigen teller door (modulo `length`), kijkt of `steps[teller]` aan staat, en gooit de speelkans. De noten zijn `root + progression[maat % 4] + transpose (spoor) + transpositie van de ingang` plus de akkoordtonen, afgekapt op 0 … 127. De duur is `nootdeling × stap / ratchet × gate`. Velocity is die van het spoor. Alles loopt vanaf stap 0 van de transportstart; een stop zet de tellers en de zaadwaarde terug.

De ingang `transpose` neemt een `note` of `noteon`: nootnummer 60 (C4) is nul, daaromheen ±36 halve tonen. Een `panic` zet de transpositie terug op 0.

## Raster, timing, velocity en lengte (opslagformaat)

**Alles in de state is gewone JSON; een nieuw veld dat op zijn standaard staat, staat er niet in.** Een oude state (zonder `grid`, `vel`, `len`, `bars`, `rec`, `thru`, `rquant`) klinkt dus precies als vroeger en geeft bij `getState()` dezelfde tekst terug.

### Raster van een stappenspoor (`mode` `chord`, `arp` of `pulse`)

De klok geeft de studio elke zestiende noot (`onStep`). Een stap van het patroon is `division` rasterstappen lang; de rasterstap is 1/16 (`grid` ontbreekt), 1/32 (`grid: 2`) of 1/64 (`grid: 4`). Met `grid: 2` en `division: 1` speelt het patroon dus 32ste noten, met `grid: 4` en `division: 1` 64ste noten. Een stap duurt `sd × division / grid` seconden (`sd` = duur van een zestiende). Het patroon is hoogstens 16 stappen lang (`length`), dus bij 1/64 duurt een patroon van 16 stappen maar een kwart maat: gebruik 1/32 en 1/64 voor korte rollen, trillers en versieringen, en laat de rest van het patroon rusten (nullen in `steps`) als het niet de hele maat moet vullen.
`division` blijft 1, 2, 4 of 8 rasterstappen; bij `grid: 2` is `division: 2` dus 1/16 en `division: 8` 1/8.

| Je wilt | `grid` | `division` | `length` |
|---|---|---|---|
| gewone 1/16, 1/8, 1/4 | ontbreekt | 1, 2, 4 | 1 … 16 |
| 32ste-roll van een hele halve maat | 2 | 1 | 16 |
| 64ste-flutter, één keer per kwart maat | 4 | 1 | 8 met 8 nullen erachter (bijvoorbeeld `xxxxxxxx........`) |
| versiering (grace note) vóór een tel | 2 | 1 | een kort patroon, bijvoorbeeld `x.xx` |

### Velocity en lengte per stap

`vel[j]` en `len[j]` horen bij stap `j` van het patroon. De uitgestuurde `vel` is `velocity van het spoor × vel[j]` (afgekapt op 0,01 … 1) en de uitgestuurde `dur` is `nootlengte × gate × len[j]`, waarbij de nootlengte `sd × division / grid / ratchet` is. Staat er geen `vel` of `len`, dan gelden de oude waarden.

- **Accenten:** zet de `velocity` van het spoor op 0,9 … 1 en geef de gewone stappen 0,5 … 0,8; de accenten 1.
- **Ghost notes:** 0,2 … 0,35, kort (`len` 0,3 … 0,5).
- **Crescendo/decrescendo:** een lijst die stijgt of daalt, bijvoorbeeld `0.3 + 0.7 × k / 15`.
- **Staccato:** `len` 0,3 … 0,5; **legato:** `len` 1 … 1,6 (de noot loopt dan door tot de volgende); `len` boven 1 laat noten van opeenvolgende stappen overlappen, vooral bij `division` 1.
- **Menselijk:** kleine variaties van ±0,05 … 0,15 op de velocity, niet op alle stappen even groot.
- Een velocity onder ongeveer 0,1 is nauwelijks hoorbaar op de meeste synths; vel 0 bestaat niet (de minimale waarde is 0,05 per stap).

### Spelwijze `notes`: opgenomen of getekende noten

`rec` is een lijst van `[p, n, v, l]`, gesorteerd op `p`:

| Veld | Wat | Bereik |
|---|---|---|
| `p` | Positie in de lus, in **1/64-eenheden** (de fijnste eenheid). Een zestiende is 4 eenheden, een 32ste is 2, een 64ste is 1, een kwart (tel) is 16, een maat is 64 | 0 … `bars × 64 − 1` |
| `n` | MIDI-nootnummer (60 = C4). De transpositie van het spoor en van de ingang `transpose` wordt erbij opgeteld; de progressie niet | 0 … 127 |
| `v` | Velocity | 0,01 … 1 |
| `l` | Lengte in 1/64-eenheden (minimaal 1) | 1 … `bars × 64` |

De lus is `bars` maten lang (1 … 4) en loopt vanaf maat 0 van de transport. Per zestiende speelt het spoor de noten waarvan `p` in die zestiende valt, op `p mod 4 × sd / 4` na het begin ervan. De uitgestuurde `vel` is `v × velocity van het spoor / 0,8` en `dur` is `l × sd / 4 × gate / 0,7`: met de standaardinstellingen (0,8 en 0,7) komt dus precies terug wat is opgeslagen. `division`, `length`, `steps`, `ratchet` en `probability` doen niets in deze spelwijze. Een lijst `rec` hoort bij één spoor in één scène: zet bij een compositie met 4 maten alle 4 maten in dezelfde `rec` (`bars: 4`). Noten die over het einde van de lus lopen zijn niet toegestaan (de lengte wordt afgekapt tot het einde).
Het `grid` van een `notes`-spoor bepaalt het raster van de editor en van het opnemen (en dus hoe fijn je noten kunt zetten); afspelen gebruikt altijd de opgeslagen eenheden.

## Live spelen en inspelen

- Sluit een toetsenbord (het apparaat Keys of een andere notenbron) aan op de eventingang **Live**. Het **gekozen spoor** (`editTrack`; in de kaart de keuzelijst *Edit track*) geeft de noten direct door naar zijn uitgang (A–D), zodat de synth die daaraan hangt klinkt zonder tweede kabel van het toetsenbord. `thru: false` zet dat uit.
- Doorgegeven wordt `note` (met `dur`), `noteon` (aangehouden, velocity blijft), `noteoff`, `panic` en `allnotesoff`; het nootnummer wordt op 0 … 127 afgekapt, de velocity op 0,01 … 1 (ontbreekt die: 0,8). Er wordt niet getransponeerd. Bij wisselen van het gekozen spoor krijgt de oude uitgang een `noteoff` voor elke nog aangehouden noot. Is het toetsenbord óók rechtstreeks met de synth verbonden, dan klinkt de noot dubbel: dat is een keuze van de gebruiker; het apparaat stuurt zelf nooit dubbel.
- **Opnemen:** met `record: true` (knop *Record*) en de transport lopend schrijft elke live noot zich in het gekozen spoor; een spoor dat nog niet in `notes` staat wordt omgezet naar `notes` (de oude instellingen blijven in het spoor staan). De positie komt uit de laatste klokstap; een `note` met `dur` of een `noteon` met `noteoff` geeft de lengte. Met `rquant` aan (standaard) worden positie en lengte naar het raster van het spoor afgerond (lengte minimaal één rasterstap); uit: naar 1/64. Een noot op dezelfde positie en toon vervangt de vorige. Het opnemen is een werkstand en geen onderdeel van een preset.
- Een agent hoeft niet live te spelen: schrijf `rec` direct (zie de voorbeelden).

## Componeren met Chord Sequencer: gids voor agents

Er zijn drie manieren om iets te maken, vaak in één spoor gecombineerd:

1. **Akkoordspoor** (`chord`): een akkoordsoort, een grondtoon en vier progressiegetallen; één of twee regels JSON geven een hele harmonische cyclus.
2. **Patroonspoor** (`arp` of `pulse`): een ritmisch figuurtje op de akkoordtonen of de grondtoon, met `steps`, `vel` en `len`. Bas, ostinato's, arpeggio's, rollen.
3. **Notenspoor** (`notes`): een melodie, hook of basloop noot voor noot, met eigen velocity en lengte. Dit is de enige manier voor een melodie die niet uit de akkoordtonen bestaat.

### Toonsoort en akkoorden

`root` van de sporen A en B zet de toonsoort (bijvoorbeeld 48 = C3). Alle sporen gebruiken dezelfde `progression` voor een samenhangende cyclus. De akkoordsoort is **per spoor vast**, niet per maat. Kies dus soort en progressie samen:
- alleen `minor`/`minor7` met i, iv, v (`[0,5,7,5]` = i iv v iv): alle akkoorden blijven in de natuurlijke mineurtoonladder;
- alleen `major` met I, IV, V (`[0,5,7,5]`), of I bVII IV (`[0,-2,5,0]`), of I bVI bVII (`[0,8,10,0]`, filmisch);
- `fifth` of `sus` voor elke progressie, ook i VI III VII (`[0,-4,3,-2]`) of i bVII v bVII; kies deze als het akkoord mineur én majeur moet kunnen klinken;
- een arpeggio of belspoor gebruikt zijn eigen `quality`; laat die dezelfde zijn als die van het akkoordspoor, of `fifth`/`single`, anders botst hij met de progressie.
Een melodie in `notes` is niet getransponeerd door de progressie: kies de noten zelf in de toonsoort en zet ze op de akkoordtonen van de maat waarin ze vallen (de progressie wisselt per maat, `bar mod 4`).

### Ritme: waar zet je wat

- Positie van een tel: tel 1 van maat 0 is `p = 0`; elke tel 16 eenheden; "en" van een tel 8; de zestiende na een tel 4. Een 1/32-noot na een tel is 2 eenheden, 1/64 is 1.
- Lange noten (pads): akkoord op `division: 8`, `steps: [1,0]`, `len` 1 … 1,6.
- Drive (bas): `division: 2` (1/8) met `steps` allemaal 1, of op de tellen (`division: 4`).
- Synco: `division: 1` met een patroon als `x..x..x...x.x...`.
- Rolls/versieringen: `grid` 2 of 4 met `division: 1` (zie de tabel).
- Swing en humanize: naast de swing van de host heeft elk spoor een eigen `swing` (zie "Swing per spoor"); maak verder lichte verschillen met `vel`, `len`, `probability` (0,7 … 0,95) en bij `notes` met posities die 1 of 2 eenheden naast het raster liggen (zet dan `rquant` uit bij het opnemen, of schrijf `rec` direct).

### Velocity en dynamiek per rol

| Rol | Velocity van het spoor | Per stap |
|---|---|---|
| Akkoorden / pads | 0,55 … 0,75 | zacht en gelijkmatig; bij stabs 0,5 … 1 afwisselend |
| Bas | 0,8 … 0,95 | accenten 1 op de tellen, tussendoor 0,5 … 0,7, ghost notes 0,25 |
| Pulse / arp | 0,55 … 0,7 | accent op de eerste van elke vier (1), de rest 0,45 … 0,6; crescendo over een maat bij een opbouw |
| Bells / melodie | 0,55 … 0,85 | hoge noten van een melodie iets zachter, de doelnoot van een frase (de langste) het hardst |

Dynamiek tussen de scènes: de scène *breakdown* laat bas en pulse uit; de scène *lift* zet alles aan en kan de bells een octaaf hoger zetten (`root` +12).

### Voorbeelden (JSON)

Een staprij met accenten en een ghost note (spoor B, bas):
```json
{ "enabled": true, "root": 36, "quality": "single", "mode": "pulse", "length": 8, "division": 2,
  "steps": [1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0], "progression": [0,5,7,5], "probability": 1, "ratchet": 1,
  "vel": [1,0.5,0.8,0.5,0.9,0.25,0.8,0.6,1,1,1,1,1,1,1,1],
  "len": [1.2,0.5,0.9,0.5,1.2,0.3,0.9,0.7,1,1,1,1,1,1,1,1] }
```
Een 32ste-roll van acht noten (spoor C, `grid: 2`):
```json
{ "enabled": true, "root": 60, "quality": "minor", "mode": "arp", "length": 8, "division": 1,
  "steps": [1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0], "progression": [0,5,7,5], "probability": 1, "ratchet": 1,
  "grid": 2, "vel": [0.9,0.5,0.9,0.5,0.9,0.5,0.9,0.5,1,1,1,1,1,1,1,1] }
```
Een melodie van vier maten in A mineur (spoor D, `notes`; `p` is `16 × tel`, `4 × zestiende`):
```json
{ "enabled": true, "root": 72, "quality": "minor", "mode": "notes", "length": 5, "division": 2,
  "steps": [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], "progression": [0,5,7,5], "probability": 1, "ratchet": 1,
  "bars": 4,
  "rec": [[0,69,0.9,8],[8,72,0.65,4],[12,71,0.7,4],[16,76,1,16],[32,74,0.8,8],[40,72,0.6,4],[44,71,0.7,4],[48,72,0.95,16]] }
```
In `scenes` staat elke scène als **tekst**: `JSON.stringify` van een lijst van vier van zulke sporen.

### Fouten die agents niet moeten maken

- `p` buiten de lus (≥ `bars × 64`) of een noot die voorbij het einde loopt: wordt afgekapt, de bedoeling gaat verloren.
- Twee noten met dezelfde `p` en `n`: de tweede vervangt de eerste. Hangende, overlappende noten van dezelfde toon: laat de lengte voor de volgende noot van die toon eindigen.
- `vel` 0 of een negatieve waarde: de minimale waarde is 0,05 per stap en 0,01 per noot.
- Een `len` van 4 met `division` 1 en veel noten tegelijk: de ontvangende synth raakt zijn stemmen kwijt; houd lange noten bij `division` 4 of 8.
- `grid` 4 met een lang patroon: het duurt maar een kwart maat. Vul de rest van de maat niet met 1-en tenzij je een roll van een hele tel wilt.
- Alle stappen even hard laten klinken en geen `vel`: dat klinkt mechanisch; geef minstens het spoor een patroon van accenten.
- `rec` in een spoor dat niet `mode: "notes"` heeft: het wordt bewaard maar niet gespeeld.
- Het veld `record` of `editTrack` in een preset zetten.
- Een melodie schrijven zonder naar de akkoorden van de maat te kijken: een akkoord wisselt elke maat (`bar mod 4`).

### Instellen voor een goede preset

- **Akkoorden met bas:** spoor A `chord`, `minor` of `major`, `division` 4, `steps` op 0 en 8; spoor B `single` of `fifth`, `arp` of `pulse`, `division` 2, wortel een of twee octaven lager (24 … 40).
- **Arpeggio:** spoor met `mode: "arp"`, `quality: "minor7"`, `division` 1 of 2, `gate` 0,5 … 0,8; de synth moet korte noten krijgen.
- **Melodie of bellen:** `quality: "single"`, hoge `root` (72 … 84), `length` 5 of 7 tegen een andere lengte voor een patroon dat langzaam verschuift, `probability` 0,6 … 0,9.
- **Progressie:** vier verschillende getallen (bijvoorbeeld `[0,5,3,7]`) laten de akkoorden per maat wisselen; `[0,0,0,0]` houdt het gelijk.
- Zet de scènes liever allemaal vol (vier scènes, vier sporen): een ontbrekende scène krijgt de standaardsporen, en die spelen wel.
- Zet `launch: "bar"` voor een live wissel; `"now"` laat de uitgangen eerst stil vallen.

### Wat een preset niet moet doen

- `enabled` op `false` voor alle sporen of `steps` overal 0, of `probability` 0: stil.
- `length` korter dan het patroon dat je bedoelt: alleen de eerste stappen tellen.
- `ratchet` 4 met `division` 1 en hoge `gate`: de noten overlappen; vier stemmen op een uitgang kunnen dan niet genoeg hebben (de ontvangende synth breekt noten af).
- `mode: "chord"` met `minor7` naar een monofone synth: er klinkt maar één noot (niet beluisterd).
- Geen routing in de state: de kabels naar de synths horen er niet in. Geen velden verzinnen.
- Geen `editTrack` of `editStep` in een preset.

## Het presetpack

`../../../presets/chord-sequencer.patchkamer-presets.json` heeft 80 presets in 14 mappen. De eerste 60 (elf stijlen: Pop, Ballad, Cinematic, Film Score, Ambient, Trance, Synthwave, Lo-fi, Neo-classical, Deep House, Funk & Disco) gebruiken alleen de oude velden. **Dynamics** (8) gebruikt `vel` en `len` (accenten, ghost notes, crescendo, legato en staccato), **Rolls** (6) gebruikt `grid` 2 en 4 (32ste- en 64ste-rollen, versieringen, trillers) en **Melodies** (6) gebruikt de spelwijze `notes` met uitgeschreven melodieën, basloopjes en arpeggio's van vier maten in een vaste toonsoort. Wijzig bestaande presets niet.

## Wat het apparaat met een state doet (getest)

- `setState({})` geeft alle startwaarden; `setState(getState())` geeft dezelfde state terug; `setPreset({})` geeft de startwaarden en laat `editTrack` en `editStep` staan.
- Ongeldige waarden (`NaN`, `Infinity`, tekst, `null`, ongeldige JSON in `scenes`, een lijst met rommel) geven de standaard of worden afgekapt; er komt geen uitzondering.
- De kaart bouwt zich opnieuw op bij `setState`, dus alle knoppen, keuzes en stapknoppen volgen.
- Ook bij rommel op de ingang en in `onStep` (`NaN`, `Infinity`, tekst, stapdelen) komen er alleen eindige noten van 0 … 127 uit en speelt het apparaat daarna gewoon verder (300 willekeurige runs, geen enkele fout). Oud en nieuw bestand gaven bij 400 willekeurige runs (89016 gebeurtenissen) precies dezelfde gebeurtenissen.
- Nieuwe velden: waarden buiten het bereik worden afgekapt (`grid` anders dan 2 of 4 wordt weggelaten, `vel` 0,05 … 1, `len` 0,1 … 4, `bars` 1 … 4, `rec` hoogstens 256 noten met `p` 0 … `bars × 64 − 1`, `n` 0 … 127, `v` 0,01 … 1, `l` 1 … `bars × 64`); rommel in `rec` wordt overgeslagen. Het apparaat stuurt nooit een niet-eindige waarde, een noot buiten 0 … 127, een velocity buiten 0 … 1 of een `dur` ≤ 0 uit, ook niet bij rommel op `live`, `onStep` of in de state (getest met 400 rommelregels).
- Niet beluisterd; er is geen echte synth aan gekoppeld getest.

## Swing per spoor (1.14.0)

Nieuwe sleutel in een spoor in `scenes[n]`: `swing` (0 … 0,5 van een zestiende; schuif "Swing" in de spooreditor). Zoals `grid`, `vel` en `len` staat hij **alleen in de state als hij niet 0 is**, dus een oude state geeft dezelfde `getState()`-tekst.

Regel (voor alle apparaten gelijk): `swing` is een fractie van een zestiende (0 … 0,5; de UI toont 0 … 50 %, dubbelklik op een schuif = 0). De lokale vertraging van een gebeurtenis in een **oneven zestiende** (positie in zestienden, naar beneden afgerond, is oneven) is `(som van de niveaus) × stepDur`, de som begrensd op 0,5; de swing van de host (`info.time`) blijft er los onder. Even zestienden blijven staan. Rasters van 1/8 en langzamer hebben alleen gebeurtenissen op even zestienden en schuiven dus niet. Een ontbrekend of niet-eindig veld is 0; met alles op 0 spelen state en klokstappen precies als voor versie 1.13.0. Het geldt voor stapsporen (de 1/32- en 1/64-stappen en ratchets die in een oneven zestiende vallen schuiven mee) en voor de noten van de spelwijze `notes` (positie `p`: de noot schuift als zijn zestiende, `p >> 2`, oneven is). `division` 2 of hoger (1/8 en langzamer) staat op even zestienden en schuift dus niet.

### Inspelen (1.14.0)

* Kwantiseren (`rquant`) gaat naar het dichtstbijzijnde geswingde rasterpunt van het spoor (hostswing + spoorswing); uit: 1/64. De lengte komt uit twee rasterpunten (noteon en noteoff) in plaats van seconden gedeeld door een gemiddelde stap, zodat swing de lengte niet vervormt. Loop-rand: een noot vlak voor het einde van de lus rondt af naar positie 0. Bij een zeer fijn raster met veel swing (swing groter dan een rasterstap) kunnen twee rasterpunten overlappen; dan wint het dichtstbijzijnde.
* `trig`-gebeurtenissen met een `note` op `live` worden als korte noot (0,1 s) doorgegeven en ingespeeld.

## Klembord: spoor kopiëren en plakken (sinds 1.15.0)

De host kopieert en plakt met de knoppen Kopieer en Plak in de kaartbalk en met Ctrl/Cmd+C en Ctrl/Cmd+V (contract v1.17, formaat `patchkamer-clip`; tijd in **tikken**, 12 per zestiende, 192 per maat; één 1/64-eenheid van `rec` is 3 tikken). Het "huidige patroon" is het gekozen spoor (`editTrack`) in de actieve scène. Niets hiervan verandert `getState()`, de presets of het geluid.

| Methode | Wat |
|---|---|
| `clipInfo()` | `copy` en `paste` zijn altijd `['notes']`; `length` 192 tot 768 in stappen van 192 (1 tot 4 maten, `current` = `bars` × 192, `shared` onwaar); `grid` `[16, 32, 64]`; `range` 0 tot 127; `scheme` `gm`; `vel` `continuous`; `prob` en `ratchet` onwaar; `maxEvents` 256. `name` is "Spoor A · naam". |
| `getClip()` | Spoorspelwijze `notes`: de opgenomen noten (`rec`) als `notes` (`t` = positie × 3, `len` = lengte × 3), `length` = `bars` × 192, `grid` van het spoor, `swing` van het spoor. Elke andere spelwijze (`chord`, `arp`, `pulse`) wordt **gerenderd**: één cyclus van **vier maten** met de progressie per maat, de stappen, `division`, `ratchet`, `vel`/`len` per stap, de gate en velocity van het spoor, en `prob` als de speelkans onder 1 ligt. Dat is een momentopname: wijzigt het spoor later, dan blijft de kopie staan. De spoortranspositie en de swing zitten er niet in (die horen bij het spoor). |
| `setClip(clip)` | Alleen `notes`. Zet het gekozen spoor op spelwijze `notes`, met `rec`, `bars` (de lengte omhoog afgerond op hele maten, 1 tot 4) en het raster. Alle andere spooginstellingen (akkoord, progressie, naam, swing, `enabled`, gate, velocity) blijven staan; de akkoordinstellingen klinken alleen niet meer zolang het spoor op `notes` staat. Geeft `{ ok: true }` (met `dropped` als er noten wegvielen) of `{ ok: false, reason }`. |

Wat `setClip` doet: noten met `t` buiten de lengte vallen weg, `t` en `len` worden naar 1/64-eenheden afgerond (3 tikken), `n` 0 tot 127, `vel` 0,01 tot 1, en een noot op dezelfde plek en toon als een andere laat de hardste staan. Hoogstens 256 noten (de rest telt als `dropped`, zoals de grens van `rec`). Het raster blijft dat van het spoor als alles erop past, anders het raster van de clip, anders het fijnste dat nodig is. Geen `native`: de clip is verliesvrij zonder.

**Risico's.**

- Een gerenderd akkoord- of arpeggiospoor wordt na plakken een gewoon notenspoor: de **voortgang per maat** is dan vastgelegd tot vier maten en de speelkans (`prob`) valt weg (dit apparaat heeft geen kans per noot in `notes`). Een patroonlengte van 7 of 5 stappen krijgt in de momentopname zijn vier maten uitgespeeld, dus er is geen eindeloze polymeter meer.
- De gate en velocity van het bronspoor zitten **in** de noten (velocity en lengte zoals ze klinken); een notenspoor schaalt die bij het spelen nog met de gate en velocity van zijn eigen spoor (standaard 0,7 en 0,8, dan neutraal).
- Kopiëren van het spoor en terugplakken in hetzelfde, niet-`notes`-spoor doet bewust niets (`ok: true`, state gelijk): anders zou `setClip(getClip())` de spelwijze veranderen. Plak je dezelfde kopie in een ander spoor, dan wordt dat een notenspoor.
- Een clip van meer dan vier maten wordt door de host afgekapt (dit apparaat neemt hoogstens 4 maten). Swing en `humanize` van de clip worden genegeerd; de swing van het spoor blijft.
- `setState` stuurt sinds 1.15.0 alleen nog `allnotesoff` als de klok loopt of er live noten vastgehouden worden (bij stilstand deed de transportstop dat al). Anders telt de validator die gebeurtenis bij `setClip` als een eigen gebeurtenis.

Getest: de rondreis `setClip(getClip())` laat `getState()` gelijk voor alle vier de sporen (akkoord, arpeggio, pulse) en voor een notenspoor van 3 maten op 1/32; ongeldige en extreme clips (`NaN`, lengte 1e9, 5000 noten, verkeerde soort, `null`) geven geen fout en laten de state intact; spoor C ⇄ Step Sequencer en Wanderer → Chord Sequencer in de echte host (nl en en), ongedaan maken zet de state exact terug. Oud (1.14.0) en nieuw geven dezelfde gebeurtenissen en `getState` in drie testtoestanden (96 klokstappen).


## Klembord: de hele scène kopiëren en plakken (sinds 1.16.0, contract v1.24)

Naast de spoorclip geeft het apparaat de actieve scène (vier sporen A tot D) als één clip van de soort `multi` (contract §13d). De host kopieert hem met **Shift-klik** op Kopieer of met **Kopieer alle sporen** in het plakmenu; gewoon Kopieer en Ctrl+C pakken het gekozen spoor, zoals voorheen.

- **`clipInfo()`**: `copy` en `paste` zijn `['notes', 'multi']`; nieuw is `tracks`: vier items `{ id: 'a'..'d', name, kind: 'notes', length, grid, range, scheme, vel, prob: false, ratchet: false, maxEvents: 256 }`, met de lengte van elk spoor zelf (`bars` × 192).
- **`getClip({ kind: 'multi' })`**: vier sporen `{ slot, name, kind: 'notes', role: spelwijze, clip }`; elke spoorclip is wat `getClip()` voor dat spoor zou geven (akkoord-, arpeggio- en pulssporen als momentopname van vier maten, notensporen als hun `rec`). `native` bovenaan = de vier sporen van de scène zoals ze zijn (`cleanTrack`), alleen voor Chord Sequencer zelf.
- **`setClip(multi)`**: elk toegewezen spoor (`slot` 0 tot 3) krijgt `setClip`-gedrag van één spoor (spelwijze `notes`, `rec`, `bars`, raster); niet toegewezen sporen blijven. Een clip van Chord Sequencer zelf die niet is aangepast (alle vier de sporen, noten en lengtes gelijk aan wat `native` opwekt) zet de vier sporen **exact** terug, dus ook de akkoorden, arpeggio's en alle instellingen: een scène naar een andere scène kopiëren verliest niets. Anders wordt elk spoor een notenspoor. Eén keer opnieuw tekenen; geen enkel spoor toegepast: `ok: false`.
- Het gedrag van de spoorclip is verplaatst naar `clipToTrack` (werkt op een kopie van het spoor en geeft het nieuwe spoor terug) zonder gedragsverandering; `getState`, presets en geluid zijn gelijk aan 1.15.0 (byte voor byte vergeleken).

**Risico's.** Plakken op een scène met `native` vervangt ook de spoornamen, `enabled`, gate/velocity per stap enzovoort van die vier sporen: dat is bedoeld (scène kopiëren) maar een andere schaal dan een enkel spoor. De transpositie en gate/velocity van de spoorinstellingen (`t<n>gate` enzovoort in de state, buiten de scène) blijven staan.

## Controleren

- `node contract/validate-instrument.mjs devices/sequencers/ChordSequencer/chord-sequencer.patchkamer-device.js --lang nl` en `--lang en`, vanuit de root. Beide moeten `OK` geven, zonder `let op`.
- Alle tekst in het apparaat staat in het woordenboek `EN` bovenin het bestand. Een nieuwe tekst krijgt altijd nl én en.

## Wat je niet doet

- Verander nooit de `id`, de `kind`, de poort-id's of de namen van state-velden.
- Pas het apparaat niet aan om een preset te laten kloppen.
- Zet geen merknamen van bestaande apparatuur in naam of omschrijving, en verzin geen persoon bij `author`.
- Commit of push niet, tenzij de opdracht dat vraagt.

## Documentatie en songs

Dit zijn de plaatsen waar je terechtkunt voor documentatie en voor het componeren van songs met dit apparaat. Songs zijn CC-BY-4.0, tunes en presets CC0-1.0, het apparaat AGPL-3.0-or-later.

- Handleiding van Chord Sequencer: [NL](../../../docs/sequencers/USER-MANUAL_NL.md#chord-sequencer) · [EN](../../../docs/sequencers/USER-MANUAL_EN.md#chord-sequencer).
- Overzicht van de soort: [README](../README.md); handleiding van de hele soort: [NL](../../../docs/sequencers/USER-MANUAL_NL.md) · [EN](../../../docs/sequencers/USER-MANUAL_EN.md).
- Presets (patronen en instellingen, `kind: set`): [chord-sequencer.patchkamer-presets.json](../../../presets/chord-sequencer.patchkamer-presets.json). Kies een preset als beginpunt voor de `state` van dit apparaat in de song; velden die de preset niet noemt krijgen hun standaard.
- Sequencers in het algemeen (raster, velocity, lengte, timing, accenten): [NL](../../../docs/sequencers/USER-MANUAL_NL.md#wat-de-sequencers-gemeen-hebben) · [EN](../../../docs/sequencers/USER-MANUAL_EN.md#what-the-sequencers-have-in-common). Muziektheorie vertaald naar waarden: [songs/MUSIC-THEORY.md](../../../songs/MUSIC-THEORY.md).
- Overzicht van alle apparaten en hun signaalketens: [devices/AGENTS.md](../../../devices/AGENTS.md). Een song componeren: [songs/AGENTS.md](../../../songs/AGENTS.md).
- Route voor agents: [soort Sequencers](../AGENTS.md) → [devices/AGENTS.md](../../AGENTS.md) → [root AGENTS.md](../../../AGENTS.md). Contract: [NL](../../../contract/PATCHKAMER-CONTRACT_NL.md) · [EN](../../../contract/PATCHKAMER-CONTRACT_EN.md). Hoe presets van dit apparaat zijn opgebouwd: [presets/AGENTS.md](../../../presets/AGENTS.md). <!-- agents-tree -->
- Rol in een song: sturing van akkoorden en patronen op vier sporen A–D. Verbind elke eventuitgang `a`, `b`, `c`, `d` met de `notes` van een eigen synth (bijvoorbeeld akkoorden, bas, arpeggio, melodie), of gebruik de bundeluitgang `tracks`. Een toetsenbord kan via `live`, een transpositie via `transpose`.
