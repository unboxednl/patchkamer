# AGENTS.md: Foundry

Dit bestand is voor AI-agents die **tunes voor Foundry** maken. Het is niet geschreven voor mensen. Het hoort bij `../../../AGENTS.md` (algemeen) en `../../../tunes/AGENTS.md` (regels voor tunepacks); lees die eerst. Hier staat wat alleen voor Foundry geldt.

## Wat Foundry is

Een industriële klankvormer, mono, met alleen native Web Audio. De klank loopt in vaste volgorde: een FM-keten van drie sinus/driehoek-oscillatoren (de golfvorm van de hoofdoscillator kies je), een ringmodulator, ruis en optioneel extern geluid; dan vier resonatoren (een soort metalen "corpus" van terugkoppelende vertragingen) in vier materialen (staal, glas, beton, kabel/snaar); dan twee parallelle vervormers (overdrive en wavefolder) met een mix; een uitgangsfilter (lowpass met resonantie); een envelope; en tot slot ruimte (galm en twee echo's), een compressor en een zacht plafond. Daarnaast een trage cyclische beweging (LFO op toonhoogte, filter en ringmodulator) en een onregelmatige drift. Er is geen eigen sequencer of arpeggiator.

Foundry werkt in twee manieren (`mode`): **drone** (klinkt zolang het transport loopt of de knop "Start / stop drone" aan staat, op de toonhoogte `pitch`) en **notes** (speelt noten van het toetsenbord of een sequencer, monofoon: een nieuwe noot neemt de vorige over, legato bij overlappende noten).

| | |
|---|---|
| Bestand | `foundry.patchkamer-device.js` (in deze map) |
| `id` | `nl.patchkamer.foundry`. Verander die nooit: daaraan hangen tunes en songs van gebruikers |
| Naam | `Foundry` in alle talen; alleen de poortnamen hebben een Nederlandse variant (via `i18n`) |
| Soort | `instrument`: dit apparaat krijgt dus **tunes** (geen presets) |
| Poorten | audio-ingang `in` (extern materiaal), audio-uitgang `out` (stereo), eventingang `notes`, modulatie-ingang `mod` |
| Contract | v1.11 |
| Licentie apparaat | AGPL-3.0-or-later |

Dit apparaat is de nieuwe, bijgewerkte vorm van een ouder bestand met een andere naam en id. Tunes of songs uit die tijd verwijzen naar de oude id en laden hier niet in. De state-sleutels zijn gelijk gebleven; alleen de naam van een eigen klank in `preset` is nu `Custom` (de oude schrijfwijze `Eigen` wordt nog gelezen en omgezet).

## De state

`state` van een tune is wat `getState()` teruggeeft: alle regelaars, de keuzes en de twee bewaarde klanken. Alle velden hieronder mogen in een tune staan; zet ze allemaal, dan klopt de tune. Bereiken worden afgekapt, onbekende velden genegeerd.

### Regelaars (getallen)

| Veld | Wat het doet | Bereik | Start | Schaal |
|---|---|---|---|---|
| `pitch` | Dronefrequentie in Hz; ook de basis waarvan de FM-keten start in de drone | 30 … 1600 | 110 | log |
| `tune` | Transpositie in halve tonen (alle drie de oscillatoren) | −24 … 24 | 0 | lineair |
| `fm` | FM-intensiteit: hoe sterk de tweede oscillator de eerste moduleert | 0 … 12 | 2,5 | lineair |
| `ratio` | FM-verhouding: frequentie van de modulator ten opzichte van de toonhoogte. Hele getallen (1, 2, 3) klinken harmonisch, andere (2,715; 5,137) metallisch en onharmonisch | 0,125 … 12 | 2,715 | log |
| `ring` | Ringmodulatie: mix van de ringmodulator in de bron (0 = alleen de FM-toon) | 0 … 1 | 0,35 | lineair |
| `ringHz` | Frequentie van de ringmodulator in Hz | 0,1 … 2400 | 137 | log |
| `noise` | Ruis (bandpass om 3,5 kHz) bij de bron: schuren, lucht | 0 … 1 | 0,18 | lineair |
| `external` | Hoeveel van het audiosignaal op de ingang `in` meeklinkt als materiaal | 0 … 1 | 0 | lineair |
| `metal` | Resonator-mix: hoeveel van de vier metalen resonatoren erbij komt en hoe lang ze naklinken. Hoog = belachtig, ringend | 0 … 1 | 0,6 | lineair |
| `body` | Corpusfrequentie in Hz: de grondtoon van de resonatoren (minimum in de praktijk rond 375 Hz, zie de noot hieronder) | 35 … 1200 | 170 | log |
| `damping` | Demping/helderheid: lowpass in de resonatoren in Hz. Laag = dof, hoog = glasachtig | 200 … 10000 | 4200 | log |
| `drive` | Ruwheid: hoe hard het signaal in de overdrive en de wavefolder gaat | 0 … 1 | 0,55 | lineair |
| `fold` | Mix tussen overdrive (0) en wavefolder (1); het geluid is de som van beide paden | 0 … 1 | 0,3 | lineair |
| `cutoff` | Uitgangsfilter (lowpass) in Hz | 80 … 14000 | 6200 | log |
| `resonance` | Resonantie van het uitgangsfilter (Q in dB) | 0,2 … 6 | 0,8 | lineair |
| `motion` | Cyclische beweging: diepte van de trage LFO op toonhoogte, filter en ringmodulator | 0 … 1 | 0,25 | lineair |
| `rate` | Snelheid van die LFO in Hz | 0,03 … 16 | 0,23 | log |
| `chaos` | Onregelmatige drift in de FM-keten (ook een tweede FM-laag), 0 = stabiel | 0 … 1 | 0,18 | lineair |
| `space` | Ruimte: galm en twee echo's (0,317 s en 0,473 s) naar links en rechts | 0 … 1 | 0,35 | lineair |
| `width` | Stereobreedte van resonatoren en echo's | 0 … 1 | 0,8 | lineair |
| `attack` | Opkomst van de envelope in s (in drone-modus: inzwellen) | 0,001 … 4 | 0,35 | log |
| `decay` | Decay in s (alleen noten) | 0,02 … 6 | 0,8 | log |
| `sustain` | Sustainniveau (alleen noten) | 0 … 1 | 0,8 | lineair |
| `release` | Uitklank in s | 0,02 … 12 | 2 | log |
| `level` | Uitgangsniveau | 0 … 1 | 0,65 | lineair |

Let op: de resonatoren staan in een terugkoppelende lus. Volgens de Web Audio-specificatie duurt een vertraging in zo'n lus minstens één blok van 128 samples; de hoogste gestemde corpusfrequentie is daarom ongeveer 375 Hz (bij 48 kHz). Gebruik `body` dus vooral als kleur, niet als gestemde toon (niet beluisterd).

De terugkoppeling van de resonatoren is `0,18 + 0,68 × metal`, maar wordt begrensd op 0,82. Dat betekent dat `metal` boven ongeveer 0,94 niet langer klinkt als meer naklank: de naklanktijd groeit dan niet verder. Zonder die grens werd de lus bij `metal` boven ongeveer 0,95 instabiel (het signaal in de resonatoren groeide in seconden tot 1e19 en meer). Gebruik in een tune gerust `metal` tot 0,9; boven 0,94 is er geen extra effect op de naklank.

### Keuzes

| Veld | Waarden | Wat |
|---|---|---|
| `mode` | `drone`, `notes` | Drone met transport of noten. Standaard `drone` |
| `wave` | `sine`, `triangle`, `sawtooth`, `square` | Golfvorm van de hoofdoscillator (de FM-ontvanger). Standaard `triangle` |
| `material` | `steel`, `glass`, `concrete`, `cable` | Verhoudingen van de vier resonatoren: staal (inharmonisch, 1; 1,41; 2,76; 4,11), glas (hoog, 1; 2,32; 4,25; 6,63), beton (dicht bij elkaar, 1; 1,125; 1,7; 2,41), kabel/snaar (harmonisch 1-2-3-4). Standaard `steel` |
| `scope` | `wave`, `spectrum`, `off` | Alleen weergave. Zit niet in `getPreset`; zet hem niet in een tune |
| `xAxis`, `yAxis` | een van de regelaars hierboven, behalve `level`, `external`, `attack`, `decay`, `sustain`, `release` | Wat het XY-vlak bedient. Alleen weergave; laat op `fm` en `fold` |
| `preset` | `Steel Mill`, `Broken Servo`, `Rust Drone`, `Glass Factory`, `Power Grid`, `Industrial Kick`, `Scrap Metal Hits`, `Air Raid Siren`, `Subterranean`, `Data Corrosion`, `Cable Tension`, `Black Atmosphere` of `Custom` | Alleen de naam van de laatst gekozen basisklank, voor de keuzelijst. Geen effect op het geluid. Zet `Custom` in een tune |
| `seed` | geheel getal 0 … 4294967295 | Zaad van de knop "Mutate sound". Geen effect op het geluid; laat op 74231 |

### Scènes A/B

| Veld | Wat |
|---|---|
| `sceneA`, `sceneB` | Een tekst met een JSON-object met alle 25 regelaars (zoals bovenstaande tabel). Leeg (`""`) = niet bewaard. Ongeldige tekst wordt leeg |
| `morph` | 0 … 1: stand van de Morph-schuif tussen A en B. Zonder twee scènes doet Morph niets |

`getState()` geeft elk veld uit deze drie tabellen: 25 regelaars, `mode`, `wave`, `material`, `preset`, `xAxis`, `yAxis`, `scope`, `sceneA`, `sceneB`, `morph`, `seed` (36 velden); `getPreset()` geeft er dezelfde zonder `scope`.

Wat een tune doet met deze velden: de tunes in `foundry-styles.patchkamer-tunes.json` bevatten wat `getPreset()` teruggeeft (alles behalve `scope`, dat alleen weergave is): de 25 regelaars, `mode`, `wave`, `material`, `preset` (altijd `Custom`), `xAxis` en `yAxis` (op de standaard `fm` en `fold`), `sceneA`, `sceneB`, `morph` (leeg en 0) en `seed` (74231). Zet `scope` er niet in. Er is geen routing, bronkeuze of lopende positie in de state. `sceneA`/`sceneB` kun je gebruiken om een tune met een morph te maken (zet beide scènes volledig en `morph` ergens tussen 0 en 1; de regelaars in dezelfde state zijn dan de geïnterpoleerde waarden, dus zet die zelf op de juiste waarde), maar het is niet nodig: laat ze leeg tenzij de tune er om draait.

### Sequencer en arpeggiator

Foundry heeft er geen. Een tune hoeft dus geen patroon mee te nemen. In notes-modus speelt hij noten van een externe sequencer of toetsenbord; de tune zorgt voor de klank en een passende `mode`.

### Wat het apparaat met een state doet (getest)

- Getallen buiten het bereik worden afgekapt (`cutoff: 1e9` wordt 14000); een tekst, `null` of `NaN` geeft de startwaarde.
- Een ongeldige `mode`, `wave`, `material`, `scope`, `xAxis` of `yAxis` geeft de startwaarde; een ongeldige `preset` ook.
- `sceneA`/`sceneB` met ongeldige JSON worden leeg; ontbrekende velden in een scène krijgen hun startwaarde.
- Onbekende velden worden genegeerd. Zet er geen in.

## Een bewaker tegen een vergiftigde keten

De resonatoren en echo's zijn terugkoppelende lussen met filters. Een `NaN` of `Infinity` op de audio-ingang (ook bij `external: 0`, want 0 × Infinity is NaN) zou ze voor altijd vergiftigen. Een meter (om de 50 ms) blokkeert daarom de ingang zolang die ongeldig of absurd groot is (≥ 100) en bouwt de keten achter de bronnen opnieuw op als daar een ongeldige waarde staat. Instellingen binnen de bereiken ontsporen de keten zelf niet (gemeten: 80 willekeurige extreme instellingen met ruis op de ingang en modulatie ±1; de ruwe uitvoer van de resonatoren bleef onder 1,7); de bewaker is er voor wat van buiten komt. Een deel van de samples kan tot ongeveer 50 ms na zo'n storing nog niet-eindig zijn, voordat de meter ingrijpt. Een tune hoeft hier niets aan te doen.

## Een tune maken

Een pack heet `naam.patchkamer-tunes.json` en staat in `../../../tunes/`. Het formaat en de licentie (`CC0-1.0`) staan in `../../../tunes/AGENTS.md`. Voor dit apparaat is `device` altijd `nl.patchkamer.foundry` en elke tune is `kind: "set"` met een volledige `state`.

Richtlijnen per rol (neutrale taal):

- **Drone/texture:** `mode: "drone"`, `attack` 1,5 tot 4 s, `release` 4 tot 12 s, `space` 0,5 tot 0,9, `motion` 0,2 tot 0,6 en een lage `rate` (0,05 tot 0,3), `chaos` 0,3 tot 0,7. Lage `pitch` (36 tot 80 Hz) voor donker, hoger voor sirenes. Een drone klinkt pas als het transport loopt of de knop "Start / stop drone" aan staat: voor een toetsenbord moet een tune op `mode: "notes"` staan.
- **Bas:** `mode: "notes"`, `wave: "sine"` of `triangle`, lage `ratio` (1 of 2 voor harmonisch, 0,5 voor sub), `fm` 0,5 tot 3, `body` 55 tot 120, `cutoff` 800 tot 2500, `attack` 0,001 tot 0,01, `sustain` 0,6 tot 1, `release` 0,1 tot 0,5, `space` laag (≤ 0,15), `motion: 0`, `chaos` ≤ 0,1.
- **Kick en percussie:** `mode: "notes"`, `sustain: 0`, `attack: 0,001`, `decay` 0,1 tot 0,6, `release` 0,05 tot 0,8; `ring` en `noise` hoog voor metalen slag, `metal` en `body` bepalen de klankkleur van de naklank.
- **Lead:** `mode: "notes"`, `sawtooth` of `square`, `fm` 1 tot 5, `ratio` 1, 2 of 3 (harmonisch) voor een zangerige lead, `cutoff` 3000 tot 9000, `attack` ≤ 0,02, `release` 0,3 tot 1, matige `space`.
- **Pad:** `mode: "notes"`, `attack` 0,8 tot 2,5, `sustain` 0,8 tot 1, `release` 2 tot 6, `metal` 0,3 tot 0,6, `space` 0,5 tot 0,9, `motion` 0,2 tot 0,5.
- **Pluck en stab:** `mode: "notes"`, `sustain` 0 tot 0,1, `decay` 0,2 tot 0,8, `metal` hoog, `attack` 0,001.
- **FX en sirenes:** hoge `motion` met `rate` 0,1 tot 16, hoge `ring`, `chaos`, `fm`; een siren heeft een `rate` onder 0,5 en `motion` boven 0,7.

Niveau: `level` bepaalt het eindniveau; houd tunes onderling vergelijkbaar. Meet de piek in een offline render en stel `level` zo in dat de piek rond 0,5 tot 0,9 blijft; de uitgang heeft een zacht plafond (0,85) en een compressor, dus clippen kan niet hard, maar een te hoog niveau klinkt samengedrukt.

Wat een tune niet doet:
- Geen instelling kiezen waarbij hij stil valt: `level: 0`, of `ring: 1` samen met een heel lage `ringHz` (de toon wordt dan weggeregeld; niet gemeten). Controleer elke tune met een offline render op stilte.
- Geen `mode: "drone"` voor een tune die je met toetsen wilt bespelen.
- Geen `external` boven 0 tenzij je weet dat er een bron aan de ingang hangt (anders geen effect, maar het gaat ten koste van ruimte in de mix).
- Geen merknamen in naam of omschrijving, en verzin geen persoon bij `author`.

## Controleren

- Draai vanuit de root van de repo: `node contract/validate-instrument.mjs devices/synths/Foundry/foundry.patchkamer-device.js` (en met `--lang en`). Dat moet `OK` geven, zonder `let op`.
- Je kunt niet horen hoe een tune klinkt. Heb je een browser, laad dan de host (`../../../patchkamer/AGENTS.md`) en kies de tune. Heb je geen browser, schrijf dan in je oplevering dat de tune **niet beluisterd** is.
- Alle tekst in het apparaat staat in het woordenboek `EN` bovenin het bestand (Nederlandse bron, Engels via `host.lang`). Een nieuwe tekst krijgt altijd nl én en.

## Wat je niet doet

- Verander nooit de `id`, de `kind`, de poort-id's of de namen van state-velden.
- Pas het apparaat niet aan om een tune te laten kloppen.
- Commit of push niet, tenzij de opdracht dat vraagt.

## Documentatie en songs

Dit zijn de plaatsen waar je terechtkunt voor documentatie en voor het componeren van songs met dit apparaat. Songs zijn CC-BY-4.0, tunes en presets CC0-1.0, het apparaat AGPL-3.0-or-later.

- Handleiding van Foundry: [NL](../../../docs/synths/USER-MANUAL_NL.md#foundry) · [EN](../../../docs/synths/USER-MANUAL_EN.md#foundry).
- Overzicht van de soort: [README](../README.md); handleiding van de hele soort: [NL](../../../docs/synths/USER-MANUAL_NL.md) · [EN](../../../docs/synths/USER-MANUAL_EN.md).
- Tunes (klanken, `kind: set`): [foundry-styles.patchkamer-tunes.json](../../../tunes/foundry-styles.patchkamer-tunes.json). Kies een tune als beginpunt voor de `state` van dit apparaat in de song; velden die de tune niet noemt krijgen hun standaard. Hoe tunes zijn opgebouwd: [tunes/AGENTS.md](../../../tunes/AGENTS.md).
- Overzicht van alle apparaten en hun signaalketens: [devices/AGENTS.md](../../../devices/AGENTS.md). Een song componeren: [songs/AGENTS.md](../../../songs/AGENTS.md).
- Route voor agents: [soort Synths](../AGENTS.md) → [devices/AGENTS.md](../../AGENTS.md) → [root AGENTS.md](../../../AGENTS.md). Contract: [NL](../../../contract/PATCHKAMER-CONTRACT_NL.md) · [EN](../../../contract/PATCHKAMER-CONTRACT_EN.md). Hoe tunes van dit apparaat zijn opgebouwd: [tunes/AGENTS.md](../../../tunes/AGENTS.md). <!-- agents-tree -->
- Rol in een song: industriële klankvormer (mono) voor bas, lead of effectgeluid. Noten op `notes`, audio uit `out`; de audio-ingang `in` verwerkt extern materiaal.
