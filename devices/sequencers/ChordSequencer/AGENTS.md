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
| Poorten | eventingang `transpose` (Transpose), modulatie-ingang `mod`, eventuitgangen `a`, `b`, `c`, `d` (Track A–D); geen audio |
| Contract | v1.11 |
| Licentie apparaat | AGPL-3.0-or-later |

Dit apparaat is de nieuwe, bijgewerkte vorm van een ouder bestand met een andere naam en id (Puls Sequencer, `nl.patchkamer.puls`, stond bij de synths). Presets of songs uit die tijd verwijzen naar de oude id en laden hier niet in.

## Geen tunes, wel presets

Alleen apparaten met `kind: 'instrument'` hebben tunes. Chord Sequencer is een `utility`, dus het krijgt **presets** en **nooit tunes** (contract §0 en §13c). Maak er geen pack voor in `../../../tunes/`. Een presetpack heet `naam.patchkamer-presets.json` en staat in `../../../presets/`; formaat volgens contract §13c, `formatVersion` 2, licentie `CC0-1.0`, `device` is altijd `nl.patchkamer.chordsequencer` en elke preset is `kind: "set"`. Maak alleen presets als de opdracht dat vraagt.

## De state

`getPreset()` geeft `getState()` zonder `editTrack` en `editStep` (werkstand: welk spoor je bewerkt). Een preset laat die velden bij het laden staan. De state is gewone JSON.

| Veld | Wat | Bereik | Start |
|---|---|---|---|
| `scene` | Actieve scène (0 = scène 1) | hele getallen 0 … 3 | 0 |
| `launch` | Scènewissel: `"bar"` op de volgende maat, `"now"` direct | `"bar"` of `"now"` | `"bar"` |
| `seed` | Zaad van de speelkans (dezelfde seed en state geven steeds dezelfde noten) | hele getallen 0 … 4294967295 | 18743 |
| `editTrack`, `editStep` | Werkstand (niet in een preset) | 0 … 3 en 0 … 15 | 0 |
| `t0gate` … `t3gate` | Nootlengte per spoor, als deel van de nootdeling | 0,1 … 1,5 | 0,7 |
| `t0velocity` … `t3velocity` | Velocity per spoor | 0,05 … 1 | 0,8 |
| `t0transpose` … `t3transpose` | Transpositie per spoor in halve tonen (wordt afgerond bij het spelen) | −24 … 24 | 0 |
| `scenes` | Lijst van **vier teksten**: per scène een JSON-tekst met een lijst van vier sporen (zie hieronder) | elke tekst korter dan 30000 tekens | vier scènes met de standaardsporen |

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
| `mode` | `chord` alle noten tegelijk, `arp` de noten om de beurt (per afgespeelde stap de volgende), `pulse` alleen de grondtoon | een van die drie | `chord` / `arp` / `chord` / `chord` |
| `length` | Patroonlengte in stappen; elk spoor loopt onafhankelijk | 1 … 16 | 16 / 12 / 7 / 5 |
| `division` | Nootdeling in zestiende noten: 1 = 1/16, 2 = 1/8, 4 = 1/4, 8 = 1/2 | 1, 2, 4 of 8 | 4 / 2 / 1 / 2 |
| `steps` | Zestien getallen (0 of 1): speelt deze stap. Alleen de eerste `length` tellen | lijst van 16 | A: 1 op 0, 4, 8, 12; de andere sporen allemaal 1 |
| `progression` | Vier getallen: halve tonen die bij de grondtoon opgeteld worden in maat 1, 2, 3, 4 van de cyclus | 4 × −24 … 24 | `[0,3,-2,5]` |
| `probability` | Kans dat een stap speelt | 0 … 1 | 1 |
| `ratchet` | Herhalingen per stap (de nootlengte wordt gedeeld) | 1 … 4 | 1 |

Hoe het speelt: op elke zestiende noot (`onStep`) speelt een spoor alleen als de stapteller een veelvoud van `division` is. Dan telt het spoor zijn eigen teller door (modulo `length`), kijkt of `steps[teller]` aan staat, en gooit de speelkans. De noten zijn `root + progression[maat % 4] + transpose (spoor) + transpositie van de ingang` plus de akkoordtonen, afgekapt op 0 … 127. De duur is `nootdeling × stap / ratchet × gate`. Velocity is die van het spoor. Alles loopt vanaf stap 0 van de transportstart; een stop zet de tellers en de zaadwaarde terug.

De ingang `transpose` neemt een `note` of `noteon`: nootnummer 60 (C4) is nul, daaromheen ±36 halve tonen. Een `panic` zet de transpositie terug op 0.

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

## Wat het apparaat met een state doet (getest)

- `setState({})` geeft alle startwaarden; `setState(getState())` geeft dezelfde state terug; `setPreset({})` geeft de startwaarden en laat `editTrack` en `editStep` staan.
- Ongeldige waarden (`NaN`, `Infinity`, tekst, `null`, ongeldige JSON in `scenes`, een lijst met rommel) geven de standaard of worden afgekapt; er komt geen uitzondering.
- De kaart bouwt zich opnieuw op bij `setState`, dus alle knoppen, keuzes en stapknoppen volgen.
- Ook bij rommel op de ingang en in `onStep` (`NaN`, `Infinity`, tekst, stapdelen) komen er alleen eindige noten van 0 … 127 uit en speelt het apparaat daarna gewoon verder (300 willekeurige runs, geen enkele fout). Oud en nieuw bestand gaven bij 400 willekeurige runs (89016 gebeurtenissen) precies dezelfde gebeurtenissen.
- Niet beluisterd; er is geen echte synth aan gekoppeld getest.

## Controleren

- `node contract/validate-instrument.mjs devices/sequencers/ChordSequencer/chord-sequencer.patchkamer-device.js --lang nl` en `--lang en`, vanuit de root. Beide moeten `OK` geven, zonder `let op`.
- Alle tekst in het apparaat staat in het woordenboek `EN` bovenin het bestand. Een nieuwe tekst krijgt altijd nl én en.

## Wat je niet doet

- Verander nooit de `id`, de `kind`, de poort-id's of de namen van state-velden.
- Pas het apparaat niet aan om een preset te laten kloppen.
- Zet geen merknamen van bestaande apparatuur in naam of omschrijving, en verzin geen persoon bij `author`.
- Commit of push niet, tenzij de opdracht dat vraagt.
