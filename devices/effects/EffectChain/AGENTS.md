# AGENTS.md: Effect Chain

Dit bestand is voor AI-agents die dit apparaat configureren of er presets voor maken. Het is niet geschreven voor mensen. Het hoort bij `../../../AGENTS.md` (algemeen); lees die eerst. Hier staat wat alleen voor Effect Chain geldt.

## Wat Effect Chain is

Een seriële stereo-multi-effectketen: audio gaat door 1 tot 8 slots achter elkaar. Elk slot bevat één effect uit een lijst van 33 (plus doorvoer): filter, EQ, delay, ping-pong, reverb (12 ruimtes), chorus, flanger, phaser, tremolo, auto-pan, saturatie, distortion, overdrive, limiter, compressor, stereo image, vinyl dust, frequency echo, cosmos, digital crush, auto filter, resonators, granular delay, shimmer, hybrid reverb, freeze, ring modulator, pumping, trance gate, beat stutter, tempo delay, wobble filter en multiband drive. Per slot staan een effectmix, een bypass, pijltjes om het slot te verplaatsen en de regelaars van het gekozen effect. Daarboven staan een ingang (dB), een uitgang (dB), een totale mix en een analyzer (spectrum, golfvorm, stereobeeld, meters). De ritmische effecten (pumping, trance gate, beat stutter, tempo delay, wobble) volgen de hostklok: start het transport.

| | |
|---|---|
| Bestand | `effect-chain.patchkamer-device.js` (in deze map) |
| `id` | `nl.patchkamer.effect-chain`. Verander die nooit: daaraan hangen presets en songs van gebruikers |
| Naam | `Effect Chain` in alle talen; alleen de poortnamen `Stereo in` / `Stereo out` hebben een Nederlandse variant (`Stereo uit`, via `i18n`) |
| Soort | `effect`, categorie `effect`: Effect Chain krijgt dus **presets** (geen tunes) |
| Poorten | audio-ingang `in`, audio-uitgang `out`, sturing-ingang `mod`; geen events |
| Contract | v1.11 |
| Licentie apparaat | AGPL-3.0-or-later |

Dit apparaat is de nieuwe, bijgewerkte vorm van een ouder bestand met een Nederlandse naam en id (`nl.patchkamer.schakel`). Songs of presets uit die tijd verwijzen naar de oude id en laden hier niet in.

## Geen tunes, wel presets

Alleen apparaten met `kind: 'instrument'` hebben tunes. Effect Chain is een `effect`, dus het krijgt **presets** en **nooit tunes** (contract §0 en §13c). Maak voor dit apparaat geen pack in `../../../tunes/`. Een presetpack heet `naam.patchkamer-presets.json` en staat in `../../../presets/`; het formaat is dat van het contract (§13c), `formatVersion` 2, licentie `CC0-1.0`, `device` is altijd `nl.patchkamer.effect-chain` en elke preset is `kind: "set"`. Maak alleen presets als de opdracht dat vraagt. In het apparaat zelf zitten 17 vaste ketenpresets (keuzelijst Chain); die zijn onderdeel van de code en geen presetpack.

## Presets maken: volledige ketens voor een toepassing

**Een preset voor dit apparaat is een complete keten, geen los effect.** Effect Chain bestaat om tot **8 verschillende effecten achter elkaar** te zetten, en een preset laat zien wat dat oplevert: een doordachte combinatie van effecten, met per slot een uitgewerkte configuratie, voor één duidelijke **toepassing of sfeer**.

Regels voor elke preset:

- **4 tot 8 gevulde slots, en verschillend per preset.** Een keten van één, twee of drie effecten is geen preset voor dit apparaat. Binnen die grenzen **varieer je het aantal**: een pack met alleen ketens van 8 slots is een fout. Verdeel een pack van 12 tot 14 presets ongeveer zo: 1 of 2 met 4 slots (een bewust minimalistische toepassing), 3 met 5, 3 of 4 met 6, 3 met 7 en hooguit 3 met 8. Een keten krijgt zoveel slots als de toepassing nodig heeft, niet zoveel als het apparaat toestaat. `count` is het aantal gebruikte slots; de rest is `none`.
- **Verschillende effecten per slot.** Gebruik niet twee keer hetzelfde effect achter elkaar zonder reden. Combineer soorten: toon (`filter`, `eq`), vervorming (`saturation`, `overdrive`, `distortion`, `multiband`, `crush`), beweging (`chorus`, `flanger`, `phaser`, `tremolo`, `autopan`, `autofilter`, `wobble`, `ringmod`), ritme (`pump`, `trancegate`, `stutter`, `tempodelay`), ruimte (`delay`, `pingpong`, `reverb`, `cosmos`, `shimmer`, `hybrid`, `grains`, `freqecho`, `resonator`, `freeze`), karakter (`vinyl`) en dynamiek en breedte (`compressor`, `limiter`, `imager`).
- **Een doordachte volgorde** (het signaal loopt van slot 1 naar slot 8). Gebruik meestal: toon opruimen (EQ, filter) → vervorming → beweging → ritme → delay → galm → breedte → dynamiek/limiter aan het eind. Wijk er af als de toepassing dat vraagt, en weet waarom (vervorming ná een galm klinkt heel anders dan ervoor).
- **Varieer ook de opbouw, niet alleen het aantal.** Laat niet elke keten met een `eq` beginnen en met een `limiter` eindigen: dat is een gewoonte, geen regel. Een `limiter` of `compressor` aan het eind hoort er alleen bij als de keten het nodig heeft (hooguit een derde van het pack). Begin eens met een delay of een vervormer, laat een galm bewust vóór een modulatie staan (die smeert dan de staart), zet een filter vóór én ná een vervormer, of gebruik twee effecten van dezelfde soort met een reden (een korte ruimte én een lange, twee verschillende delays). Wissel de rolverdeling: sommige ketens zijn bijna alleen ruimte, andere bijna alleen vervorming en beweging, andere dynamisch en strak. Geen twee presets in een pack hebben dezelfde eerste en laatste effecten, en geen twee hebben dezelfde volgorde van soorten.
- **Elk slot heeft een eigen mix en echte instellingen.** Zet `mixes[i]` bewust (vervorming 0,6 tot 1; modulatie 0,2 tot 0,5; delay en galm 0,15 tot 0,5; een filter of EQ 1) en vul `settings[i]` met de parameters van dat effect. Laat een slot niet op zijn standaardwaarden staan als de toepassing iets anders vraagt.
- **Elke preset heeft een toepassing**, en een naam die dat beeldend zegt (Engels). Denk in sfeer en gebruik: Ambient soundscapes, een filmische (cinematic) setting, kelder-techno voor de late uurtjes, dub, lo-fi tape, een brede pad, een drumbus, glitch en sound design, een vocale ruimte, synthwave, trance. Twee presets in een pack mogen niet bijna dezelfde keten zijn.
- **Beheers het niveau.** Een keten van acht effecten kan veel harder worden dan de ingang. Gebruik `input`, `output` en `blend`, de `trim`/`makeup`-regelaars en sluit meestal af met een `limiter` of `compressor`. Houd feedback bescheiden (`delay`, `tempodelay`, `pingpong`, `freqecho`, `flanger`: liefst ≤ 0,6; `cosmos` en `shimmer` mogen hoger maar let op de piek); test met een invoer met pieken tot 1,0.
- **`preset` is een label**: zet het op `Custom` (het apparaat zet een andere naam toch terug). Zet geen namen van de ingebouwde ketenpresets (zie hieronder) in een eigen pack en kopieer ze niet: een eigen pack levert aanvullende ketens.
- **Een preset is `getPreset()`** (alle velden behalve `viewMode`). Gebruik de volledige state: `count`, `input`, `output`, `blend`, `preset`, `types`, `bypass`, `mixes` (acht waarden elk) en `settings` (acht JSON-teksten van de vorm `{"<effect>":{"<parameter>":getal}}`). Parameternamen en bereiken staan in de tabel `defs` bovenaan de code; keuzes (ruimte van de `reverb`, `mode`, `grid`, `pattern`, `division`, `chord`, `rpm`) zijn geheel getal, zie `defs` en de hulpteksten `DESC_NL`/`DESC_EN` voor wat elke waarde betekent.

Voorbeeldketens als uitgangspunt (kernwaarden; werk ze uit, meet ze en verbeter ze). Let op de **verschillende aantallen slots** en de verschillende opbouw: dat is bedoeld. Dit zijn voorbeelden van de aanpak, geen limiet.

| Naam | Slots | Toepassing | In volgorde, met kernwaarden |
|---|---|---|---|
| Basement Techno, 4 AM | 7 | Duitse kelder-techno voor de late uurtjes: donker, gruizig, een betonnen ruimte met strakke bas | `filter` hoogdoorlaat ~70 Hz · `saturation` drive 10 · `pump` 1/4, diepte 0,7 · `tempodelay` 3/16, donker, feedback 0,5 · `reverb` grote donkere ruimte, mix 0,3 · `multiband` · `eq` midden −3, hoog −4 |
| Drifting Soundscape | 6 | Ambient soundscape: langzaam bewegende klankwolken zonder ritme | `chorus` 0,15 Hz · `grains` +7 st · `shimmer` +12 st, uitklank 0,9 · `cosmos` feedback 0,92 · `autopan` 0,06 Hz · `imager` breedte 1,6 |
| Cinematic Dread | 8 | Filmische spanning: donkere resonantie, enorme ruimte, langzame zweving | `saturation` · `resonator` mineur akkoord · `ringmod` 90 Hz, diepte 0,2 · `freqecho` −4 Hz · `phaser` 0,05 Hz · `reverb` grootste ruimte · `imager` · `limiter` |
| Dub Chamber | 6 | Dub: tapesaturatie, rollende echo's, een stuiterende kamer | `saturation` · `tempodelay` gepunteerd · `pingpong` · `autofilter` langzaam · `reverb` kleine kamer · `compressor` |
| Lo-Fi Tape Memory | 5 | Lo-fi: oud cassettegevoel met stof en wow/flutter | `crush` 12 bit · `vinyl` slijtage 0,5 · `filter` laagdoorlaat 5,5 kHz · `chorus` ondiep · `reverb` kleine ruimte, mix 0,2 |
| Acid Bus | 6 | Bus voor een acid-bassynth: schreeuwende vervorming met beweging | `distortion` drive 14 · `wobble` · `phaser` · `tempodelay` 3/16 · `pingpong` · `eq` |
| Neon Nights | 5 | Synthwave: brede chorus, warme overdrive, gepunteerde echo's, glanzende galm | `chorus` breed · `overdrive` drive 8 · `tempodelay` gepunteerd · `shimmer` · `reverb` |
| Trance Ascent | 7 | Trance: gate, stijgende filter, echo's, brede galm | `trancegate` · `autofilter` · `pump` · `tempodelay` · `shimmer` · `reverb` · `imager` |
| Glitch Lab | 6 | Glitch en sound design: stotteren, bitcrush, frequentie-echo's | `stutter` · `crush` · `freqecho` · `grains` · `wobble` · `pingpong` |
| Industrial Warehouse | 8 | Industriële, extreme klank: harde vervorming in een enorme ruimte | `eq` · `overdrive` · `distortion` · `multiband` · `ringmod` · `freqecho` · `reverb` zeer groot · `limiter` |
| Dream Voice | 7 | Vocale ruimte: gladgestreken stem met glans | `compressor` · `eq` · `chorus` ondiep · `pingpong` · `reverb` plate · `shimmer` zacht · `imager` |
| Psychedelic Trip | 6 | Psychedelisch: kolkende beweging en echo's | `phaser` · `flanger` · `tremolo` · `freqecho` · `cosmos` · `autopan` |
| Drum Bus Glue | 5 | Drumbus: plakken, aandikken, ruimte | `compressor` · `saturation` · `multiband` · `hybrid` korte ruimte · `limiter` |
| Tape Slapback | 4 | Minimalistisch: een korte, warme slapback op een gitaar of zang | `saturation` · `pingpong` korte tijd · `filter` laagdoorlaat · `reverb` kleine kamer |

Zorg dat elke preset de eisen hierboven haalt (zie ook "Controleren") en wat je niet hebt beluisterd, meld je als **niet beluisterd**.

## De state

`state` is wat `getState()` teruggeeft. `getPreset()` is dezelfde state zonder `viewMode` (de keuze van de analyzer hoort bij de sessie, niet bij een preset).

| Veld | Wat | Bereik | Start |
|---|---|---|---|
| `count` | Aantal zichtbare slots | 1 … 8 (geheel) | 4 |
| `input` | Ingang | −12 … 12 dB, stap 0,5 | 0 |
| `output` | Uitgang | −12 … 12 dB, stap 0,5 | 0 |
| `blend` | Totale mix (0 = droog) | 0 … 1, stap 0,01 | 1 |
| `preset` | Naam van de gekozen ketenpreset, of `Custom` | zie hieronder | `Ambient Space` |
| `types` | Effect per slot, 8 waarden | een sleutel uit de lijst hieronder, anders de standaard van dat slot | slots 1-3: `chorus`, `delay`, `reverb`; de rest `none` |
| `bypass` | Slot overgeslagen, 8 waarden | boolean | `false` |
| `mixes` | Effectmix per slot, 8 waarden | 0 … 1, stap 0,01 | 0,4 (0,3, 0,25, 0,35 voor de eerste drie) |
| `settings` | Per slot een JSON-tekst `{"<effect>":{"<parameter>":getal}}` met de regelaars van elk effect dat dat slot ooit had; onbekende effecten en parameters worden genegeerd, waarden worden afgekapt op het bereik van de parameter | tekst, korter dan 16000 tekens | de standaardwaarden van het effect |
| `viewMode` | Analyzer | `spectrum`, `bars`, `spectrogram`, `wave`, `stereo`, `levels`, `off` | `spectrum` |

Effectsleutels voor `types`: `none`, `filter`, `eq`, `delay`, `pingpong`, `reverb`, `chorus`, `flanger`, `phaser`, `tremolo`, `autopan`, `saturation`, `distortion`, `overdrive`, `limiter`, `imager`, `vinyl`, `freqecho`, `cosmos`, `crush`, `autofilter`, `resonator`, `grains`, `shimmer`, `hybrid`, `freeze`, `ringmod`, `pump`, `trancegate`, `stutter`, `tempodelay`, `wobble`, `multiband`, `compressor`. De parameters per effect (sleutel, bereik, standaard) staan bovenaan de code in de tabel `defs`.

Namen van ketenpresets in `preset`: `Ambient Space`, `Bright Sky`, `Deep Mist`, `Warm Tape`, `Slow Waves`, `Cosmic Sea`, `Forgotten Record`, `Psychedelic Echo`, `Digital Dreams`, `Crystal Garden`, `Endless Cloud`, `EDM · Wide Lead`, `Techno · Rumble`, `Trance · Gate`, `EDM · Glitch Break`, `Techno · Wobble Bass`, `Empty Chain`, `Custom`. De oude Nederlandse namen uit een bewaarde state (`Ambient ruimte`, `Heldere hemel`, `Eigen`, …) worden herkend en vertaald. De waarde `preset` is alleen een label: het kiezen van een naam in een state zet de slots niet; dat doen `types`, `settings` en de rest.

Stuurbare parameters (Mod-ingang): `input`, `output`, `blend`, en per bezet slot `slotN.mix` en `slotN.<effect>.<parameter>`. Keuzes (ruimte, patroon, deling, freeze, akkoord, type filter, toerental, richting) worden niet gemoduleerd. Modulatie zit niet in de state.

Wat Effect Chain met een state doet (getest):
- Getallen buiten het bereik worden afgekapt; een tekst, `null`, `NaN` of een ontbrekende waarde geeft de startwaarde. `setState({})` geeft de startketen.
- Een onbekend effect, een onbekende ketenpreset of een kapotte `settings`-tekst geeft de standaard van dat veld. Onbekende velden worden genegeerd. Zet er geen in.
- `setState(getState())` en `setPreset(getPreset())` geven dezelfde state terug; alle regelaars en keuzes volgen (de hele UI wordt opnieuw opgebouwd).

## Wat het apparaat met een ontspoord signaal doet (getest)

- De eigen DSP (ScriptProcessor, per effect) begrenst zijn ingang op ±64: `NaN` wordt 0, `±Infinity` en absurd grote waarden worden begrensd, en een ontspoorde toestand wordt teruggezet. Normaal geluid blijft bit-identiek aan de oude versie.
- Voor de ingebouwde Web Audio-filters en delaylussen (een `NaN` of `Infinity` daarin blijft er voor altijd in zitten) kijkt een bewaker om de ~50 ms naar de uitgang van elk slot en naar de hoofduitgang. Zie hij een niet-eindige waarde of een sample boven ±100, dan bouwt hij dat slot opnieuw op (de staart van dat effect is dan weg) en vervangt hij de beveiligingscompressor. In een `OfflineAudioContext` draait de bewaker niet.
- Een burst van `NaN`, `±Infinity`, 1e30 en 1e9 op de ingang laat het geluid daarna terugkomen.
- Effect `resonator`: de laagdoorlaat in de feedbacklus van elke resonator heeft Q = −3,0103 dB (geen resonantiepiek). Met de vorige waarde (+0,7 dB) was de lusversterking boven 1, groeide het geluid exponentieel (ook zonder ingang) en sloeg het binnen enkele seconden door naar `NaN`. Dit is de enige bewuste klankwijziging ten opzichte van de oude versie; hij klinkt nu rustiger en loopt uit volgens `decay`.
- Eén foutieve waarde bij `delay` en `tempodelay` met veel feedback en een hoge helderheid kan langzaam blijven aanzwellen (lusversterking rond 1,00 tot 1,04 bij de hoek van de laagdoorlaat); de bewaker vangt dat op als het ontspoort.

## Controleren

- `node contract/validate-instrument.mjs devices/effects/EffectChain/effect-chain.patchkamer-device.js --lang nl` en `--lang en`, vanuit de root. Beide moeten `OK` geven, zonder `let op`.
- Je kunt niet horen hoe een keten klinkt. Heb je geen browser, schrijf dan in je oplevering dat een preset **niet beluisterd** is.
- Alle tekst in het apparaat staat in het woordenboek `EN` bovenin het bestand (Nederlandse bron als sleutel, Engels als waarde) en in `DESC_NL`/`DESC_EN` (hulpteksten per effect). Een nieuwe tekst krijgt altijd nl én en.
- De effecten die een eigen DSP gebruiken, draaien op `ScriptProcessor` (hoofdthread, 1024 samples, extra vertraging). Gebruik op een trage machine weinig van die slots.

## Wat je niet doet

- Verander nooit de `id`, de `kind`, de poort-id's of de namen van state-velden en effectsleutels.
- Pas het apparaat niet aan om een preset te laten kloppen.
- Zet geen merknamen van bestaande apparatuur in naam, omschrijving of tekst.
- Commit of push niet, tenzij de opdracht dat vraagt.
