# AGENTS.md: Biotope

Dit bestand is voor AI-agents die **tunes voor Biotope** maken. Het is niet geschreven voor mensen. Het hoort bij `../../../AGENTS.md` (algemeen) en `../../../tunes/AGENTS.md` (regels voor tunepacks); lees die eerst. Hier staat wat alleen voor Biotope geldt.

## Wat Biotope is

Een procedurele omgevings- en drone-synth zonder samples: acht lagen die zelf geluiden genereren en samen een landschap vormen. De lagen zijn regen, druppels, bubbels, wind, voetstappen, haardvuur, zee en gekraak. Elke laag heeft een volume, een dichtheid (hoe actief), een kleur (hoe helder of hoog), een beweging (hoeveel variatie) en een karakter (vier tot zeven soorten). Over alles ligt een stereogalm met een breedteregeling. Er is **geen toetsenbord en geen noot**: het apparaat speelt zodra het aan staat en verandert langzaam door toeval en trage golven (windvlagen, golfslag). Er zit geen sequencer of arpeggiator in; alleen de voetstappen hebben een eigen tempo.

De winddrones (`wind` met karakter Red planet, Gas giant of Cosmic imagination) bevatten een zachte sinustoon van 42, 29 of 53 Hz met ruis eromheen; ook de diepe bubbels (Deep underwater) en het scheepsromp-gekraak (Ship's hull) zijn laag en dronerig. Daarmee maak je donkere, evoluerende vlakken. Alles klinkt anders bij elke start: de ruis is willekeurig, een tune is dus een instelling en geen vaste opname.

| | |
|---|---|
| Bestand | `biotope.patchkamer-device.js` (in deze map) |
| `id` | `nl.patchkamer.biotope`. Verander die nooit: daaraan hangen tunes en songs van gebruikers |
| Naam | `Biotope` in alle talen; alleen de poortnaam `Stereo out` heeft een Nederlandse variant (`Stereo uit`, via `i18n`) |
| Soort | `instrument`: dit apparaat krijgt dus **tunes** (geen presets) |
| Poorten | eventingang `events` (Triggers / CC), audio-uitgang `out` (stereo) |
| Contract | v1.11 |
| Licentie apparaat | AGPL-3.0-or-later |

Dit apparaat is de nieuwe, bijgewerkte vorm van een ouder bestand met een Nederlandse naam en id. Tunes of songs uit die tijd verwijzen naar de oude id en laden hier niet in.

## Wat je hier doet

Je maakt klanken (tunes) voor Biotope en zet ze als pack in `../../../tunes/`. Het apparaat zelf pas je alleen aan als de opdracht dat zegt (`version` ophogen; `id`, poort-id's en state-velden gelijk houden).

## De state

`state` van een tune is wat `getState()` teruggeeft: zeven velden op het hoogste niveau en acht lagen met vijf velden.

| Veld | Wat | Bereik | Start |
|---|---|---|---|
| `on` | Apparaat aan (uit = stil) | `true` of `false` | `true` |
| `follow` | Alleen geluid als het transport loopt (Volg start/stop) | `true` of `false` | `false` |
| `master` | Uitgangsniveau | 0 … 1 | 0,7 |
| `space` | Hoeveelheid stereogalm | 0 … 1 | 0,14 |
| `width` | Stereobreedte (0 = mono, 1 = breed) | 0 … 1 | 0,85 |
| `stepRate` | Voetstappen per minuut (alleen als `stepSync` 0 is) | 20 … 240 | 90 |
| `stepSync` | Wat de voetstappen aanstuurt | `0` (vrij tempo), `-1` (alleen triggers), `1`, `2`, `4`, `8` of `16` (elke zoveelste 1/16 van de hostklok) | 0 |
| `layers` | De acht lagen, zie hieronder | object met de sleutels `rain`, `drops`, `bubbles`, `wind`, `steps`, `fire`, `sea`, `creaks` | `rain` en `wind` aan |

Elke laag in `layers` heeft dezelfde vijf velden:

| Veld | Wat | Bereik | Start |
|---|---|---|---|
| `level` | Volume van de laag (0 = uit) | 0 … 1 | 0 (alleen `rain` 0,55 en `wind` 0,22) |
| `density` | Activiteit: hoeveel druppels, bubbels, knetters of krakingen per seconde; bij regen, wind en zee ook de zwaarte van de ruis | 0 … 1 | 0,45 |
| `tone` | Kleur: helderheid en hoogte (laag = donker en dof, hoog = helder en scherp) | 0 … 1 | 0,5 |
| `motion` | Beweging: variatie in stereo, toonhoogte en timing; bij wind de snelheid van de vlagen en de hoeveelheid vlaagwerking; bij zee de diepte van de deining | 0 … 1 | 0,5 |
| `variant` | Karakter (nummer, zie hieronder) | geheel getal, per laag een eigen bereik | 0 (alleen `rain` 1) |

De karakters, in de volgorde van het nummer (0, 1, 2, …):

| Laag | Karakters |
|---|---|
| `rain` | 0 Drizzle, 1 Soft rain, 2 Downpour, 3 On the window, 4 On a roof, 5 On leaves |
| `drops` | 0 Water drops, 1 Cave (lang, hol), 2 Dripping tap (regelmatig), 3 On metal |
| `bubbles` | 0 Water, 1 Analog bubble bath (laag, glijdend), 2 Deep underwater (zeer laag), 3 Boiling water (druk) |
| `wind` | 0 Dunes, 1 Forest, 2 Blizzard, 3 Red planet (drone 42 Hz), 4 Gas giant (drone 29 Hz, het diepst), 5 Cosmic imagination (drone 53 Hz) |
| `steps` | 0 Wood, 1 Gravel, 2 Stone, 3 Sand, 4 Snow, 5 Metal, 6 Leaves |
| `fire` | 0 Fireplace, 1 Campfire, 2 Embers (zacht), 3 Big flames (luid) |
| `sea` | 0 Calm sea, 1 Surf, 2 Pebble beach, 3 Stormy sea |
| `creaks` | 0 Branches, 1 Planks, 2 Rope, 3 Ship's hull |

`getState()` geeft precies deze velden terug. Er staat geen routing of lopende positie in de state (geen klokpositie, geen toevalsgetal); dat hoort ook niet in een tune. De namen van de lagen en karakters op de kaart zijn per taal (Nederlands en Engels); de sleutels en nummers in de state zijn altijd gelijk.

Het apparaat heeft geen eigen sequencer of patroon: de enige tijdsstructuur is `stepRate` (en `stepSync`) voor de voetstappen en de trage golven in wind en zee. Een tune zet dus nooit een patroon in de state.

Wat het apparaat met een state doet (getest):
- Getallen buiten het bereik worden afgekapt (`master: 1e9` wordt 1, `stepRate: 5` wordt 20, ook `Infinity` wordt afgekapt); een tekst, `NaN` of een ontbrekende waarde geeft de startwaarde.
- Een ongeldige `stepSync` (bijvoorbeeld 3), een `variant` buiten het bereik of een niet-geheel getal, en een `on` of `follow` die geen `true`/`false` is, geven de startwaarde.
- Een ontbrekende laag of een ontbrekend veld in een laag krijgt de startwaarde; een onbekende laag of een onbekend veld wordt genegeerd. `setState({})` geeft de standaardwaarden.
- Onbekende velden worden genegeerd. Zet er geen in.

## Een tune

Een pack heet `naam.patchkamer-tunes.json` en staat in `../../../tunes/`. Het formaat en de licentie (`CC0-1.0` voor alles in `tunes/`) staan in `../../../tunes/AGENTS.md`. Voor dit apparaat is `device` altijd `nl.patchkamer.biotope` en elke tune is `kind: "set"` met een volledige `state` als hierboven. Zet geen merknamen van bestaande apparatuur in naam of omschrijving, en verzin geen persoon bij `author`.

Een tune is hier een **soundscape of een dronevlak**, geen noot of akkoord: er is niets om op te spelen. Zet elke tune op `on: true`, `follow: false`, `stepSync: 0` en vul alle acht lagen in (ongebruikte lagen met `level: 0` en de overige velden op de startwaarde).

### Niveau

Het niveau hangt af van wat je aanzet. Hieronder het gemeten gemiddelde niveau (rms) van één laag per karakter, bij `level` 0,8, `density`, `tone` en `motion` 0,5, `space` 0,14 en `master` 1, als maat voor hoe luid een laag is ten opzichte van de andere (de pieken blijven onder 0,5):

| Laag | Karakter 0, 1, 2, … |
|---|---|
| `rain` | 0,036 · 0,050 · 0,103 · 0,033 · 0,057 · 0,051 |
| `drops` | 0,012 · 0,024 · 0,007 · 0,008 |
| `bubbles` | 0,040 · 0,039 · 0,059 · 0,054 |
| `wind` | 0,070 · 0,083 · 0,082 · 0,072 · 0,072 · 0,073 |
| `steps` | 0,026 · 0,008 · 0,017 · 0,009 · 0,009 · 0,031 · 0,008 |
| `fire` | 0,021 · 0,021 · 0,007 · 0,027 |
| `sea` | 0,045 · 0,069 · 0,069 · 0,090 |
| `creaks` | 0,011 · 0,011 · 0,015 · 0,020 |

Druppels, voetstappen, haardvuur en gekraak zijn losse gebeurtenissen en klinken dus zacht naast regen, wind en zee; geef ze een hoog `level` (0,6 tot 1) als ze de hoofdrol hebben en 0,2 tot 0,4 als ze een accent zijn. Het totale niveau is ongeveer de wortel uit de som van de kwadraten van de lagen, maal `master`. Pak een rms van circa 0,06 (piek ruim onder 0,5) als doel voor een tune, zodat alle tunes even hard staan, en stel dat af met `master`. Een tune met alleen losse gebeurtenissen (druppels, voetstappen) haalt dat niet, ook niet met `level` 1 en `master` 1: geef zo'n tune een zachte bedlaag (wind of regen op `level` 0,3 tot 0,5). Meet het in een offline render. De uitvoer wordt zacht begrensd (een soft clipper op 0,85), dus clippen kan niet, maar een stapel lagen op `level` 1 klinkt dichtgeknepen.

### Wat past bij wat

- **Dronevlak of pad:** `wind` met karakter 3, 4 of 5 op `level` 0,6 tot 0,9, `density` 0,3 tot 0,5, `tone` 0,2 tot 0,45 (laag is donker en diep), `motion` 0,5 tot 0,8. Veel `space` (0,5 tot 0,8) en `width` 1. Voeg een kleine hoeveelheid `bubbles` karakter 1 of 2 of `drops` karakter 1 toe voor leven.
- **Weer:** `rain` (kies het karakter bij de plek: dak, raam, bladeren) plus `wind` 0, 1 of 2 op een laag niveau. Zware regen: `rain` karakter 2 met `density` boven 0,8.
- **Water:** `sea` (`density` is hier ook de snelheid van de golven, `motion` de diepte van de deining), `bubbles` voor beken en onderwater, `drops` voor lekkend water.
- **Warm en knus:** `fire` karakter 0 of 2 met `density` 0,2 tot 0,5, eventueel zachte regen of gekraak van planken. Knetterig (vinylachtig): `fire` karakter 2 met `density` boven 0,7 en `tone` boven 0,5.
- **Donker en dreigend:** laag `tone` (onder 0,3), karakters 3 en 4 van wind, `creaks` karakter 3, `bubbles` karakter 2, veel `space`.
- **Ritme:** alleen `steps` met een eigen `stepRate` (60 voor een mars, 84 tot 100 voor een wandeling). De voetstappen zijn het enige in dit apparaat met een tempo; `motion` laat het tempo een beetje zweven.
- **Rustig en slaap:** lage `density` (0,2 tot 0,35), lage `motion`, weinig losse gebeurtenissen (geen `steps`, `creaks` en `fire` karakter 3), en een laag `tone`.

### Wat een tune niet moet doen

- `follow: true` zetten: zonder lopend transport hoor je dan niets. Zet ook niet `on: false`.
- `stepSync: -1` zetten (alleen triggers): de voetstappen zwijgen dan tot er een trigger binnenkomt. De waarden 1 tot 16 laten de voetstappen alleen klinken als het transport loopt. Gebruik 0.
- Alle lagen op `level` 1 met `density` 1: de stemmen raken op (er zijn er 96) en de uitvoer wordt dichtgeknepen. Kies liever drie tot vier lagen met een duidelijke rol.
- Een `stepRate` buiten 20 tot 240 of een niet-heel `variant`: het apparaat kapt af of valt terug op de start, dus de tune klinkt dan anders dan bedoeld.
- Er een bijzondere werking van `master` of `space` op bouwen: `space` boven 0,9 maakt van de laag vooral galm.

Het apparaat kan niet ontsporen: de ruisfilters zijn ongevoelig voor extreme instellingen. Een **bewaker** in de klankmotor controleert elk blok op niet-eindige of absurde waarden (bijvoorbeeld door een foutief bericht); dan zet hij filters, galm en stemmen terug en loopt het geluid door. Een bericht met een niet-eindige waarde wordt genegeerd. In het normale gebied verandert dit niets: het geluid is bit-identiek met de versie vóór de bewaker (0 afwijkende samples in 300 renders van 3 seconden, ook bij extreme instellingen).

## Sturing

De eventingang `events` (Triggers / CC) krijgt:
- `cc` met `id` gelijk aan een parametersleutel (`master`, `space`, `width`, `stepRate`, en `<laag>_level`, `<laag>_density`, `<laag>_tone`, `<laag>_motion`, bijvoorbeeld `wind_level`) en een `value` tussen 0 en 1. Dat zet het veld in de state.
- `trig` of `note` met een `lane` (`drops`, `bubbles`, `steps`, `fire`, `creaks`; zonder `lane` is het `steps`) en een `vel` (0 tot 1): speelt direct één gebeurtenis van die laag (een druppel, een stap, een knal).
- De modulatie-ingang van de host stuurt dezelfde 36 parameters (negen sporen); modulatie telt op bij de stand van de knop en komt niet in de state.

## Controleren

- Draai vanuit de root van de repo: `node contract/validate-instrument.mjs devices/synths/Biotope/biotope.patchkamer-device.js` (en met `--lang en`). Dat moet `OK` geven, zonder `let op`.
- Je kunt niet horen hoe een tune klinkt. Heb je een browser, laad dan de host (`../../../patchkamer/AGENTS.md`) en kies de tune. Heb je geen browser, schrijf dan in je oplevering dat de tune **niet beluisterd** is.
- Meet een tune met een offline render (`OfflineAudioContext`, 8 tot 12 seconden, de worklet geladen via `audioWorklet.addModule` van een Blob): geen niet-eindige samples, niet stil, rms circa 0,06.
- Alle tekst in het apparaat staat in het woordenboek `EN` bovenin het bestand (Nederlandse bron, Engels via `host.lang`). Een nieuwe tekst krijgt altijd nl én en.

## Wat je niet doet

- Verander nooit de `id`, de `kind`, de poort-id's of de namen van state-velden.
- Pas het apparaat niet aan om een tune te laten kloppen.
- Commit of push niet, tenzij de opdracht dat vraagt.

## Documentatie en songs

Dit zijn de plaatsen waar je terechtkunt voor documentatie en voor het componeren van songs met dit apparaat. Songs zijn CC-BY-4.0, tunes en presets CC0-1.0, het apparaat AGPL-3.0-or-later.

- Handleiding van Biotope: [NL](../../../docs/synths/USER-MANUAL_NL.md#biotope) · [EN](../../../docs/synths/USER-MANUAL_EN.md#biotope).
- Overzicht van de soort: [README](../README.md); handleiding van de hele soort: [NL](../../../docs/synths/USER-MANUAL_NL.md) · [EN](../../../docs/synths/USER-MANUAL_EN.md).
- Tunes (klanken, `kind: set`): [biotope-styles.patchkamer-tunes.json](../../../tunes/biotope-styles.patchkamer-tunes.json). Kies een tune als beginpunt voor de `state` van dit apparaat in de song; velden die de tune niet noemt krijgen hun standaard. Hoe tunes zijn opgebouwd: [tunes/AGENTS.md](../../../tunes/AGENTS.md).
- Overzicht van alle apparaten en hun signaalketens: [devices/AGENTS.md](../../../devices/AGENTS.md). Een song componeren: [songs/AGENTS.md](../../../songs/AGENTS.md).
- Route voor agents: [soort Synths](../AGENTS.md) → [devices/AGENTS.md](../../AGENTS.md) → [root AGENTS.md](../../../AGENTS.md). Contract: [NL](../../../contract/PATCHKAMER-CONTRACT_NL.md) · [EN](../../../contract/PATCHKAMER-CONTRACT_EN.md). Hoe tunes van dit apparaat zijn opgebouwd: [tunes/AGENTS.md](../../../tunes/AGENTS.md). <!-- agents-tree -->
- Rol in een song: atmosfeer en omgevingsgeluid (acht procedurele lagen), geen toonhoogtespel. Events op `events` (triggers/CC) sturen de lagen; audio uit `out` (stereo). Gebruik onder een song als achtergrond; de klank is niet beluisterd.
