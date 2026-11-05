# AGENTS.md: Loop Slicer

Dit bestand is voor AI-agents die **tunes voor Loop Slicer** maken. Het is niet geschreven voor mensen. Het hoort bij `../../../AGENTS.md` (algemeen) en `../../../tunes/AGENTS.md` (regels voor tunepacks); lees die eerst. Hier staat wat alleen voor Loop Slicer geldt.

## Wat Loop Slicer is

Een sampler die een loop (WAV of MP3, of de ingebouwde demo-loop) in 4, 8, 16 of 32 stukken (slices) snijdt en die slices afspeelt vanaf toetsen, trigs of een patroon van 16 stappen op de klok. Je kunt de grenzen van de slices verslepen of laten zoeken op aanzetten (transiënten), een slice omkeren, hoger of lager laten klinken, korter laten spelen en laten herhalen (retrigger). De audio wordt als PCM16 in de state bewaard, zodat een song of werkruimte met de loop teruggeladen wordt.

Er is **geen timestretch**: een slice wordt afgespeeld door de afspeelsnelheid te veranderen. Met `sync` aan past elke slice in één klokstap (of een veelvoud daarvan), en verandert de toonhoogte mee; met `sync` uit klinkt een slice op zijn eigen snelheid, verschoven met `tune`.

| | |
|---|---|
| Bestand | `loop-slicer.patchkamer-device.js` (in deze map) |
| `id` | `nl.patchkamer.loopslicer`. Verander die nooit: daaraan hangen tunes en songs van gebruikers |
| Naam | `Loop Slicer` in alle talen; de poortnamen hebben een Nederlandse variant via `i18n` (`Slice-noten / trigs`) |
| Soort | `instrument`: dit apparaat krijgt dus **tunes** (geen presets). Categorie `groove` |
| Poorten | eventingang `notes` (Slice notes / trigs), modulatie-ingang `mod`, audio-uitgang `out` (Stereo slices). Geen audio-ingang |
| Contract | v1.11 (versie van het apparaat 1.11.0) |
| Licentie apparaat | AGPL-3.0-or-later |

Dit apparaat is de nieuwe, bijgewerkte vorm van een ouder bestand met een andere naam en id (Snede, `nl.patchkamer.snede`). Songs of werkruimtes uit die tijd verwijzen naar de oude id en laden hier niet in. Het geluid is bit-identiek aan het oude bestand (zie "Wat het apparaat met een state doet"). Verschillen in de state ten opzichte van het oude bestand: het nieuwe veld `demoLoop`, de standaardwaarde van `name` is nu leeg (was de Nederlandse tekst `Geen loop geladen`; die oude waarde wordt bij het laden herkend), en de oude naam van de demo (`Eigen demo · 120 BPM / 1 maat`) wordt bij het laden vervangen door `Demo loop · 120 BPM / 1 bar`. Een bankbestand heeft nu het format `patchkamer-loopslicer-1`; het oude `patchkamer-snede-1` wordt nog gelezen. De modulatielane heet `slicer` (was `klank`).

## Wat je hier doet

Je maakt klanken (tunes) voor Loop Slicer en zet ze als pack in `../../../tunes/`. Het apparaat zelf pas je alleen aan als de opdracht dat zegt (`version` ophogen; `id`, poort-id's en state-velden gelijk houden).

## Audio in een tune: de demo-loop

Een tune mag **geen audio bevatten**: de loop is een bestand van de gebruiker (tot 16 MiB PCM16 in de state) en hoort niet in een publiek pack. Een tune bewaart daarom alleen hoe er geslicet en gespeeld wordt. Daarvoor heeft Loop Slicer twee dingen:

- **`getPreset()` / `setPreset()`** laten de geladen audio met rust. `getPreset()` geeft de state zonder `pcm`, `sampleRate`, `channels`, `name`, `selected` en `editStep`; `setPreset(p)` zet alleen de overige velden en laat de loop van de gebruiker staan. De host gebruikt deze twee voor tunes. Een tune verandert dus nooit de loop van de gebruiker (behalve met `demoLoop`, zie hieronder).
- **`demoLoop`** (boolean): met `true` laadt het apparaat de ingebouwde demo-loop (2 seconden, 120 BPM, één maat, gesynthetiseerd bij het laden; hij staat niet als audio in de state). Zo klinkt een tune direct, zonder dat er iets geladen hoeft te zijn. Een tune met `demoLoop: true` **vervangt** de geladen loop door de demo-loop. Een tune met `demoLoop: false` laat de geladen loop staan en klinkt **alleen met een geladen loop** (stil als er niets geladen is).

Zet in een tune dus `demoLoop: true` voor een tune die direct moet klinken, en `demoLoop: false` voor een tune die op elke loop moet werken ("Own Loop"-tunes: hoe er geslicet en afgespeeld wordt). Vermeld in de omschrijving van het pack welke tunes alleen met een eigen loop klinken.

### De demo-loop en zijn slices

Met de standaard 16 gelijke slices (elk 125 ms, één zestiende bij 120 BPM; nummering vanaf 0 zoals in de state; in de kaart is dat slice 1 t/m 16):

| Slice (0-gebaseerd) | Inhoud |
|---|---|
| 0 en 8 | kick + hihat |
| 4 en 12 | kick + snare + hihat |
| 2, 6, 10, 14 | alleen hihat |
| 1, 5, 9, 13 | korte uitklank van kick/snare, zacht |
| 3, 7, 11, 15 | bijna stilte |

Bij 8 gelijke slices (250 ms): 0 kick, 1 hihat, 2 kick + snare, 3 hihat, 4 kick, 5 hihat, 6 kick + snare, 7 hihat. Bij 4 slices (500 ms): elke slice een halve maat met een kick (de tweede en vierde ook met een snare) en twee hihats. Bij 32 slices (62,5 ms): slice 0, 8, 16 en 24 zijn de aanzet van kick/snare, de slices ertussen de uitklank, 4, 12, 20 en 28 alleen een hihat. De hihat staat op elke achtste noot, de kick op elke tel, de snare op tel 2 en 4. De demo is zacht (hihat 0,16, snare 0,28, kick 0,7 van de volle schaal): met `level` 1 is de piek na de begrenzer ongeveer 0,35 tot 0,6.

Een tune met `demoLoop: true` en eigen `cuts` moet die grenzen op deze loop afstemmen (fracties van 0 tot 1; 0,125 is 250 ms).

## De state

`getState()` geeft de 22 velden hieronder (gewone JSON, geen AudioNodes): getallen, tekst, booleans en een lijst van 16. Een tune bewaart `getPreset()`: 16 van die velden (alles behalve `pcm`, `sampleRate`, `channels`, `name`, `selected`, `editStep`). Een getal wordt in het bereik afgekapt; een tekst, `NaN`, `Infinity`, `null` of een ontbrekende waarde geeft de startwaarde.

### Klank en niveau

| Veld | Wat het doet | Bereik | Start |
|---|---|---|---|
| `level` | Uitgangsniveau | 0 … 1 | 0,8 |
| `cutoff` | Laagdoorlaatfilter over alles (logaritmisch), Q vast op 0,7 | 100 … 18000 Hz | 16000 |
| `tune` | Transpositie in halve tonen (hele getallen op de kaart, de state kapt alleen af); met `sync` uit verandert de toon en dus de duur, met `sync` aan ook | −24 … 24 | 0 |
| `gate` | Hoeveel van de slice klinkt (aandeel van de duur): onder 1 korter, met een korte uitklank | 0,1 … 1 | 0,95 |
| `pan` | Panorama, −1 links, 1 rechts | −1 … 1 | 0 |

### Slices en afspelen

| Veld | Wat het doet | Bereik | Start |
|---|---|---|---|
| `demoLoop` | De ingebouwde demo-loop gebruiken (zie boven). Is er `pcm`, dan wint `pcm` en wordt het `false` | `true` of `false` | `false` |
| `cuts` | De grenzen van de slices: een tekst met getallen gescheiden door komma's, oplopend, beginnend op 0 en eindigend op 1, 3 tot 33 getallen (dus 2 tot 32 slices), elk stap minstens 0,00001. Een ongeldige tekst geeft de 16 gelijke slices. Een tune gebruikt 4, 8, 16 of 32 gelijke slices of een eigen lijst | tekst | 16 gelijke |
| `baseNote` | MIDI-noot die slice 0 speelt; slice `i` hoort bij noot `baseNote + i` | 0 … 95 | 36 |
| `sync` | `true`: een slice past in één klokstap × `division` (÷ `retrigger`); `false`: een slice klinkt op zijn eigen snelheid | `true` of `false` | `true` |
| `reverse` | Slices achterstevoren spelen | `true` of `false` | `false` |
| `sequence` | Het patroon op de klok afspelen (zie "Spelen") | `true` of `false` | `false` |
| `division` | Nootlengte van het patroon in zestienden: 1 = elke zestiende, 2 = achtsten, 4 = kwarten. Bij `sync` is dit ook de tijd waarin een slice past | 1, 2 of 4 | 1 |
| `retrigger` | Hoe vaak een patroonstap herhaald wordt binnen zijn nootlengte (de slice wordt telkens korter en bij `sync` sneller afgespeeld) | 1, 2 of 4 | 1 |
| `random` | Het patroon kiest bij elke stap een willekeurige slice (rusten in het patroon blijven rusten) | `true` of `false` | `false` |
| `seed` | Beginwaarde van de willekeur: dezelfde `seed` geeft elke keer hetzelfde ritme, ook na een transportstop | 0 … 4294967295 | 9137 |
| `pattern` | 16 getallen: de slice per stap, `-1` is een rust. Een getal kleiner dan −1 wordt −1, groter dan het aantal slices min 1 wordt dat maximum. Ongeldige waarden geven `stap mod aantal` | 16 × (−1 … aantal−1) | 0 … 15 |

### Velden die niet in een tune horen

`pcm` (de audio als base64 PCM16), `sampleRate`, `channels` en `name` horen bij de geladen loop. `selected` (de gekozen slice) en `editStep` (de gekozen patroonstap) zijn de stand van de kaart. Ze staan niet in `getPreset()`; zet ze ook niet in een tune.

## Spelen

- **Eventingang `notes`**: `note` en `noteon` (noot `baseNote + i` speelt slice `i`; noten buiten het bereik klinken niet; velocity telt lineair mee; `noteoff` doet niets: een slice speelt zijn duur uit, ook bij een lange toets), `trig` met `lane` `slice3` of `3` (slice 3, tellend vanaf 1) en `panic`/`allnotesoff`. Zonder tijd (`time`) in de gebeurtenis negeert het apparaat hem.
- **Patroon**: met `sequence` aan speelt elke klokstap (`onStep`) de volgende stap van `pattern`, na `division` stappen. Het patroon begint opnieuw bij elke start van het transport. Het apparaat klinkt dus pas met een draaiend transport (of een andere bron van stappen).
- **Duur van een slice** met `sync` aan: één stap × `division` ÷ `retrigger`, vermenigvuldigd met `gate` (dus bij 120 BPM en `division` 1: 125 ms; bij 4: 500 ms). Slices die van nature korter of langer zijn, worden versneld of vertraagd (de afspeelsnelheid wordt begrensd op 0,01 … 128). Met 8 slices en `division` 1 klinkt elke slice dus een octaaf hoger en dubbel zo snel; met 16 slices en `division` 2 een octaaf lager en half zo snel. Wil je de slices op hun eigen toon horen, kies dan het aantal slices en de `division` zo dat een slice precies in één nootlengte past (16 slices bij `division` 1, 8 slices bij `division` 2, 4 slices bij `division` 4), of zet `sync` uit.
- **Stemmen**: maximaal 32 tegelijk; daarboven wordt een nieuwe slice overgeslagen. Een stem eindigt met een korte uitklank van 4 ms.
- **Modulatie**: de ingang `mod` verschuift vijf waarden: `level`, `cutoff` (logaritmisch), `tune`, `gate` en `pan`. Eén spoor: Loop Slicer. `level` en `tune` staan standaard niet aan voor modulatie.

## Instellingen voor een goede klank

Alle waarden zijn uitgangspunten; luisteren is niet mogelijk, controleer dus op bereik, niveau en gedrag. Gemeten (offline render, 4,5 s, demo-loop, host-achtig gepland): met `level` 1 geeft elke tune in het meegeleverde pack een piek tussen 0,34 en 0,58 en een rms tussen 0,02 en 0,12. De demo-loop is dus zacht; `level` 1 is voor hem de gewone stand.

- **Beat uit de demo (house, techno, hip-hop):** 16 gelijke slices, `sync` aan, `division` 1, `sequence` aan. Kick op stap 1, 5, 9, 13 met slice 0 of 8, snare op stap 5 en 13 met slice 4 en 12 (die bevatten ook de kick), hihats met slice 2, 6, 10 of 14 en rusten ertussen. `gate` 0,5 … 0,9.
- **Breakbeat en drum & bass:** hetzelfde, maar omgezet: kick en snare op onverwachte plekken, ghost-tails (slice 1, 5, 9, 13) tussen de slagen, `retrigger` 2 voor rollen, `reverse` aan voor een omgekeerde variant.
- **Stutter en glitch:** `retrigger` 4 op een kick- of snare-slice; `random` aan met 32 slices voor splinters; eigen `cuts` met korte stukken; `gate` 0,15 … 0,5.
- **Gespeelde slagen (vanaf toetsen):** `sequence` uit, `sync` uit, `tune` −24 … −7 voor een lage kick of een impact, +7 … +17 voor tikken en hihats, `gate` 1 voor een volle uitklank. Elke toets is een andere slice; de toonhoogte hangt dus niet van de toets af maar van `tune`.
- **Ruimte en gewicht:** `cutoff` 1500 … 5000 geeft een dofe, stoffige klank, 14000 … 18000 een heldere. `pan` ±0,1 … 0,2 geeft een lichte uitwijking.
- **Een tune voor elke loop (`demoLoop: false`):** kies stand en patroon die op elke loop werken: gelijke slices, geen slice-nummers die een gewone loop niet heeft (4, 8, 16 of 32 gelijke slices zijn veilig), `pattern` op `0 … 15` of met rusten, en geen `cuts` die op de demo-loop zijn afgestemd.

## Wat een tune niet moet doen

- Geen `pcm`, `sampleRate`, `channels` of `name` in een tune, ook al staan ze in `getState()`.
- `demoLoop: false` voor een tune die direct moet klinken: stil zonder geladen loop.
- `demoLoop: true` voor een tune die de loop van de gebruiker moet laten staan: de loop wordt vervangen.
- `sequence` aan zonder dat het patroon iets speelt (alleen rusten): stil.
- `level` of `gate` 0: stil (`gate` begint bij 0,1).
- Slice-nummers in `pattern` die het aantal slices overschrijden: ze worden afgekapt op de laatste slice en klinken dus niet zoals bedoeld.
- Een `pattern` met overal hetzelfde nummer en `random` uit: een eentonige herhaling.
- Meer dan 32 stemmen vragen: een `retrigger` 4 met `division` 4 en `gate` 1 en slices van een lange loop; de rest wordt overgeslagen.
- Geen velden verzinnen: een onbekend veld wordt genegeerd.

## Wat het apparaat met een state doet (getest)

- `setState({})` geeft alle startwaarden; `setState(getState())` en `setPreset(getPreset())` geven dezelfde state terug.
- Getallen buiten het bereik worden afgekapt; een tekst, `NaN`, `Infinity`, `null` of een ontbrekende waarde geeft de startwaarde; onbekende velden worden genegeerd.
- `setPreset({})`, `setPreset(null)` en `setPreset('tekst')` gooien niet en laten de geladen audio staan. `setPreset({ demoLoop: true })` laadt de demo-loop.
- Een kapotte of te grote PCM-reeks (geen geldige base64, een oneven aantal bytes, meer dan 16 MiB, meer dan 120 s) geeft een melding in de kaart en een lege loop, geen fout.
- De knoppen en keuzelijsten op de kaart bewegen mee met `setState` en `setPreset`.
- Geluid: bit-identiek aan het oude bestand (zelfde audiograaf: zelfde aanroepen met dezelfde argumenten, ook voor de demo-loop; sample voor sample gelijk waar de browser reproduceerbaar rendert, zie het rapport). De begrenzer achter de compressor volgt `host.audio.oversample` (bij de standaardkwaliteit `2x`, zoals het oude bestand).

## Een tune

Een pack heet `naam.patchkamer-tunes.json` en staat in `../../../tunes/`. Het formaat en de licentie (`CC0-1.0` voor alles in `tunes/`) staan in `../../../tunes/AGENTS.md`. Voor dit apparaat is `device` altijd `nl.patchkamer.loopslicer` en elke tune is `kind: "set"` met een `state` als hierboven (de 16 velden van `getPreset()`). Geen merknamen in naam of omschrijving; verzin geen persoon bij `author`.

```json
{ "name": "Four on the Floor", "kind": "set", "version": "1.0.0",
  "state": { "level": 1, "cutoff": 16000, "tune": 0, "gate": 0.8, "pan": 0, "demoLoop": true,
             "cuts": "0,0.0625,0.125,0.1875,0.25,0.3125,0.375,0.4375,0.5,0.5625,0.625,0.6875,0.75,0.8125,0.875,0.9375,1",
             "baseNote": 36, "sync": true, "reverse": false, "sequence": true, "division": 1, "retrigger": 1, "random": false, "seed": 9137,
             "pattern": [0, -1, 2, -1, 4, -1, 2, -1, 0, -1, 2, -1, 12, -1, 2, -1] } }
```

Zet alle 16 velden erin: dan klinkt de tune hetzelfde als de startwaarden ooit veranderen.

## Controleren

- Draai vanuit de root van de repo: `node contract/validate-instrument.mjs devices/samplers/LoopSlicer/loop-slicer.patchkamer-device.js` (en met `--lang en`). Dat moet `OK` geven, zonder `let op`.
- Je kunt niet horen hoe een tune klinkt. Render offline (`OfflineAudioContext`, `suspend` om stap voor stap te plannen zoals de host), tel niet-eindige samples en meet piek en rms; heb je een browser, laad dan de host (`../../../patchkamer/AGENTS.md`) en kies de tune. Heb je geen browser, schrijf dan in je oplevering dat de tune **niet beluisterd** is.
- Een offline render met overlappende stemmen is niet altijd bit-identiek van run tot run: de browser telt de stemmen in wisselende volgorde op (verschillen rond 1e-6). Vergelijk dus op piek en rms, niet sample voor sample.
- Alle tekst in het apparaat staat in het woordenboek `EN` bovenin het bestand (Nederlandse bron, Engels via `host.lang`). Een nieuwe tekst krijgt altijd nl én en.

## Wat je niet doet

- Verander nooit de `id`, de `kind`, de poort-id's of de namen van state-velden.
- Pas het apparaat niet aan om een tune te laten kloppen.
- Commit of push niet, tenzij de opdracht dat vraagt.

## Documentatie en songs

Dit zijn de plaatsen waar je terechtkunt voor documentatie en voor het componeren van songs met dit apparaat. Songs zijn CC-BY-4.0, tunes en presets CC0-1.0, het apparaat AGPL-3.0-or-later.

- Handleiding van Loop Slicer: [NL](../../../docs/samplers/USER-MANUAL_NL.md#loop-slicer) · [EN](../../../docs/samplers/USER-MANUAL_EN.md#loop-slicer).
- Overzicht van de soort: [README](../README.md); handleiding van de hele soort: [NL](../../../docs/samplers/USER-MANUAL_NL.md) · [EN](../../../docs/samplers/USER-MANUAL_EN.md).
- Tunes (klanken, `kind: set`): [loop-slicer-styles.patchkamer-tunes.json](../../../tunes/loop-slicer-styles.patchkamer-tunes.json). Kies een tune als beginpunt voor de `state` van dit apparaat in de song; velden die de tune niet noemt krijgen hun standaard. Hoe tunes zijn opgebouwd: [tunes/AGENTS.md](../../../tunes/AGENTS.md).
- Overzicht van alle apparaten en hun signaalketens: [devices/AGENTS.md](../../../devices/AGENTS.md). Een song componeren: [songs/AGENTS.md](../../../songs/AGENTS.md).
- Rol in een song: loop-afspeler in plakken (4, 8, 16 of 32 slices) voor ritme en breaks. Noten of trigs op `notes` spelen de slices, of gebruik het eigen patroon van 16 stappen op de klok; audio uit `out`. De loop zelf (WAV/MP3) laad je in de app: een song kan dat bestand niet meebrengen, dus houd je aan de ingebouwde demo-loop of benoem de afhankelijkheid.
