# AGENTS.md: Patchbay Synth

Dit bestand is voor AI-agents die **tunes voor Patchbay Synth** maken. Het is niet geschreven voor mensen. Het hoort bij `../../../AGENTS.md` (algemeen) en `../../../tunes/AGENTS.md` (regels voor tunepacks); lees die eerst. Hier staat wat alleen voor Patchbay Synth geldt.

## Wat Patchbay Synth is

Een halfmodulaire synth met een patchpaneel: ingangen, uitgangen en schuiven waarmee je modules koppelt. Elke ingang heeft een voorbedrade bron (de kaart toont hem klein onder de ingang, na een pijl `←`); een patchkabel in die ingang vervangt hem. Zonder kabels klinkt dus al een complete synth. In de box zitten:

- drie VCO's (1 V/octaaf; bereik Audio 10 Hz–10 kHz of LF 0,03–30 Hz; LF koppelt het klavier los). VCO-1 geeft zaag en blok, VCO-2 sinus, driehoek, zaag en puls (met pulsbreedtemodulatie), VCO-3 zaag en puls;
- een ruisgenerator (wit, roze of laagfrequent), een ringmodulator, een 4-polig laagdoorlaatfilter (24 dB/octaaf, zelfoscillerend bij veel resonantie) en een VCA met een lineaire en een exponentiële ingang;
- een ADSR- en een AR-envelope, sample & hold met een eigen klok, een envelope-volger, een voorversterker voor de audio-ingang, twee inverters (spanningsbewerkers), een lag, een elektronische schakelaar, een mixer, een panpot en een veergalm;
- een klavier (C2–C6) met laagste-toets-voorrang, portamento, instelbare toonafstand en stemming.

Er is **geen interne sequencer en geen arpeggiator**. Noten komen van de host (eventingang `notes`) of van het klavier op de kaart; de klok en de sample & hold in de box lopen vrij en volgen het tempo van de host niet.

| | |
|---|---|
| Bestand | `patchbay-synth.patchkamer-device.js` (in deze map) |
| `id` | `nl.patchkamer.patchbaysynth`. Verander die nooit: daaraan hangen tunes en songs van gebruikers |
| Naam | `Patchbay Synth` in alle talen; alleen de poortnamen hebben een Nederlandse variant (via `i18n`) |
| Soort | `instrument`: dit apparaat krijgt dus **tunes** (geen presets) |
| Poorten | audio-ingang `in` (Preamp in / Voorversterker in), audio-uitgang `out` (Out / Uit), eventingang `notes` (Notes / Noten), modulatie-ingang `mod` |
| Contract | v1.11 |
| Licentie apparaat | AGPL-3.0-or-later |

Dit apparaat is de nieuwe, bijgewerkte vorm van een ouder bestand met een andere naam en id. Tunes of songs uit die tijd verwijzen naar de oude id en laden hier niet in. De state-sleutels zijn ongewijzigd.

## Wat je hier doet

Je maakt klanken (tunes) voor Patchbay Synth en zet ze als pack in `../../../tunes/`. Het apparaat zelf pas je alleen aan als de opdracht dat zegt (`version` ophogen; `id`, poort-id's en state-velden gelijk houden).

## Hoe het klinkt: wat je moet weten voor je een tune maakt

- **Eenheden.** De box rekent in volt. Toonhoogte en filter volgen 1 V per octaaf. Alle regelaars van 0 tot 1 hieronder hebben een eigen karakter: de hoeveelheid van een modulatie-regelaar (de schuiven met `FM`, `PWM`, `Filter in …`, `VCA in …`) werkt **kwadratisch** (0,5 geeft 25 %), dus kleine waarden zijn zacht. Tijden (`eA`, `eD`, `eR`, `rA`, `rR`) staan logaritmisch tussen hun grenzen.
- **Frequenties.** `v1f`, `v2f`, `v3f` en `fF` (cutoff) hebben dezelfde vorm: Hz = 10 × 1000^waarde (in bereik LF: 0,03 × 1000^waarde). Een octaaf is **0,1003** in waarde. De startwaarde van de VCO's is 0,2719: dan klinkt de laagste toets (MIDI 36, C2) op 65,4 Hz. Zolang een VCO zijn `KBD`-ingang heeft (de voorbedrading), volgt hij het klavier en de noten van de host exact; `fF` is de cutoff bij noot 36, want de filter-`KBD`-ingang volgt het klavier ook. Zet je een VCO op LF (`v?r`: 1), dan ziet hij het klavier niet meer: hij wordt een vaste LFO.
- **Eén gate, twee envelopes.** `eSrc` 0: de poort komt van het klavier en de noten van de host. `eSrc` 1: de poort komt van de ingang `eg` (voorbedraad op de klok, dus de envelopes slaan aan op de interne klok en de noten bepalen alleen de toonhoogte).
- **Wat de VCA hoort (belangrijk).** De VCA-versterking is `aG` plus `al` × AR/10 plus de exponentiële ingang `ae` van de ADSR. De exponentiële ingang is **10 dB per volt**: een ADSR-sustain van 10 V is volle sterkte, 5 V is −50 dB en dus bijna stil. `eS` (sustain, ×10 V) staat daarom pas vanaf ongeveer 0,8 op een hoorbaar volhoudniveau; met `eS` onder 0,6 en `ae` als enige VCA-bron krijg je een korte aanslag die wegsterft (een pluck, soms precies wat je wilt, soms stil).
- **Zonder VCA-bron is hij stil.** Zet je `aG` op 0, `al` op 0 en `ae` op 0 (met de standaard kabels), dan geeft de VCA niets. De standaard is `aG` 0, `al` 0, `ae` 1. De klank gaat altijd langs de VCA naar de mixer (`xb`); het filter gaat naar de mixer via `xa` (standaard 0).
- **Volume.** `oL` en `oR` werken kwadratisch en schalen de uitgang; ze zijn de enige echte volumeregeling. De uitgang is hard begrensd op ±16, ruim boven wat een normale klank geeft.

## De state

`state` van een tune is wat `getState()` teruggeeft: alle regelaars plus de lijst patchkabels `cords`. Alle velden staan in elke state; een tune mag velden weglaten (die krijgen dan de standaard) maar mag er geen verzinnen: onbekende velden worden genegeerd. Een getal buiten het bereik wordt afgekapt, een tekst of `NaN` geeft de standaard, een keuze (`int`) wordt afgerond.

### Oscillatoren

| Veld | Wat | Bereik | Start |
|---|---|---|---|
| `v1r`, `v2r`, `v3r` | Bereik van VCO-1/2/3: 0 = Audio, 1 = LF (LF koppelt het klavier los) | 0 of 1 | 0 |
| `v1f`, `v2f`, `v3f` | Frequentie (grof); zie boven, 0,1003 per octaaf | 0 … 1 | 0,2719 |
| `v1t`, `v2t`, `v3t` | Fijn: −1 … 1 is ±0,23 octaaf (±276 cent) | −1 … 1 | 0 / 0,04 / −0,04 |
| `v1a`, `v1b`, `v1c` | VCO-1 frequentiemodulatie door de ingangen FM-S/H, FM-ADSR en FM-VCO-2 (hoeveelheid, kwadratisch; 1 geeft 1 octaaf per volt) | 0 … 1 | 0 |
| `v2a`, `v2b`, `v2c` | idem voor VCO-2 (S/H, ADSR, VCO-1 blok) | 0 … 1 | 0 |
| `v3a`, `v3b`, `v3c` | idem voor VCO-3 (ruis, ADSR, VCO-2 sinus) | 0 … 1 | 0 |
| `v2w`, `v3w` | Pulsbreedte van VCO-2 en VCO-3 | 0,1 … 0,9 | 0,5 |
| `v2p` | Hoeveelheid pulsbreedtemodulatie op VCO-2 (standaard door de ruis) | 0 … 1 | 0 |

### Ruis, ringmodulator en filter

| Veld | Wat | Bereik | Start |
|---|---|---|---|
| `nL` | Ruisniveau (kwadratisch; hoge waarden clippen de ruis op ±10 V) | 0 … 1 | 0,5 |
| `nC` | Ruiskleur: 0 wit, 0,5 roze, 1 laagfrequent | 0 … 1 | 0 |
| `rD` | Ringmodulator: 0 = audiokoppeling (AC), 1 = gelijkspanning (DC) | 0 of 1 | 0 |
| `fF` | Filter cutoff (zie frequenties boven) | 0 … 1 | 0,42 |
| `fT` | Cutoff fijn: ±0,5 octaaf | −1 … 1 | 0 |
| `fQ` | Resonantie; vanaf ongeveer 0,5 zelfoscillerend, 1 is maximaal | 0 … 1 | 0,18 |
| `fa`, `fb`, `fc`, `fd`, `fe` | Hoeveel van ringmodulator, VCO-1 blok, VCO-2 puls, VCO-3 zaag en ruis het filter in gaat (kwadratisch) | 0 … 1 | 0 / 0,6 / 0 / 0,6 / 0 |
| `fx` | Hoeveel de ADSR de cutoff stuurt (lineair: 0,4 geeft 4 octaaf bij 10 V) | 0 … 1 | 0,4 |
| `fy` | Hoeveel VCO-2 sinus de cutoff stuurt (lineair; standaard ingang, een kabel maakt er een andere bron van) | 0 … 1 | 0 |

### VCA

| Veld | Wat | Bereik | Start |
|---|---|---|---|
| `aG` | Beginversterking (hoorbaar zonder envelope; ook snel te moduleren) | 0 … 1 | 0 |
| `aa`, `ab` | Hoeveel filter en ringmodulator in de VCA gaat (kwadratisch) | 0 … 1 | 1 / 0 |
| `al` | Lineaire VCA-ingang (standaard AR), versterking = waarde × bron / 10 V | 0 … 1 | 0 |
| `ae` | Exponentiële VCA-ingang (standaard ADSR), 10 dB per volt, kwadratisch | 0 … 1 | 1 |

### Envelopes

| Veld | Wat | Bereik | Start |
|---|---|---|---|
| `eA`, `eD`, `eR` | ADSR attack, decay en release in seconden (logaritmisch) | 0,001 … 8 / 0,002 … 8 / 0,002 … 10 | 0,006 / 0,45 / 0,35 |
| `eS` | ADSR sustain (× 10 V) | 0 … 1 | 0,85 |
| `rA`, `rR` | AR attack en release in seconden | 0,001 … 8 / 0,002 … 10 | 0,01 / 0,5 |
| `eSrc` | Poortbron: 0 klavier en host-noten, 1 externe poort (ingang `eg`, standaard de klok) | 0 of 1 | 0 |

### Sample & hold, volger, voorversterker, spanningsbewerkers

| Veld | Wat | Bereik | Start |
|---|---|---|---|
| `sL` | Niveau van de ingang van de sample & hold (kwadratisch) | 0 … 1 | 0,7 |
| `cR` | Kloksnelheid: 0,2 × 500^waarde Hz (0,2 … 100 Hz) | 0 … 1 | 0,45 |
| `efL` | Ingangsniveau van de envelope-volger (kwadratisch) | 0 … 1 | 0,5 |
| `pG` | Voorversterker: 0 = 20 dB, 1 = 40 dB, 2 = 60 dB | 0, 1 of 2 | 0 |
| `pL` | Niveau van de voorversterker (kwadratisch) | 0 … 1 | 0,5 |
| `qa`, `qb` | Inverter 1: hoeveelheid van ingang 1 en 2 (ingang 3 en 4 gaan vol door; kwadratisch) | 0 … 1 | 0,5 |
| `qc` | Inverter 2: hoeveelheid van ingang 1 (kwadratisch) | 0 … 1 | 0,5 |
| `lT` | Lagtijd: 0,1 ms × 1000^waarde (0,1 ms … 0,1 s) | 0 … 1 | 0,4 |

### Mixer, galm en uitgang

| Veld | Wat | Bereik | Start |
|---|---|---|---|
| `xa`, `xb` | Mixer: hoeveel van het filter en van de VCA (kwadratisch) | 0 … 1 | 0 / 0,8 |
| `pP` | Pan | −1 … 1 | 0 |
| `gL`, `gR` | Galm links en rechts (kwadratisch). Zit er een kabel op de uitgang `rev`, dan gaat de galm alleen nog links via `gL` mee | 0 … 1 | 0,3 / 0,3 |
| `oL`, `oR` | Volume links en rechts (kwadratisch) | 0 … 1 | 0,8 / 0,8 |

### Klavier

| Veld | Wat | Bereik | Start |
|---|---|---|---|
| `kO` | Portamento aan | 0 of 1 | 0 |
| `kP` | Portamento-tijd: 1 ms × 500^waarde (1 ms … 0,5 s) | 0 … 1 | 0,3 |
| `kI` | Toonafstand vrij aan: 0 = precies 1 V/octaaf, 1 = afstand instelbaar | 0 of 1 | 0 |
| `kV` | Toonafstand: (1 + 7 × waarde) / 4 V per octaaf (alleen met `kI` 1) | 0 … 1 | 0,43 |
| `kU` | Stemming aan | 0 of 1 | 0 |
| `kT` | Stemming: tot +0,5 V (alleen met `kU` 1) | 0 … 1 | 0,5 |

### Patchkabels: `cords`

`cords` is een lijst paren `[uitgang, ingang]`, bijvoorbeeld `[["lag", "v1k"], ["kbd", "li"]]`. Elke ingang kan **één** kabel hebben: bij twee kabels naar dezelfde ingang blijft de laatste. Een kabel vervangt de voorbedrade bron van die ingang. Onbekende namen worden genegeerd. Een lege lijst is de ingebouwde bedrading. Een kabel op een LF-VCO-klavieringang (`v?k`) werkt gewoon; alleen de voorbedrade klavierbron wordt bij LF vervangen door 0 V.

**Uitgangen:** `zero` (0 V), `ext` (audio-ingang van de kaart, ×5 V), `kbd` (klaviersturing), `gate`, `trig`, `v1saw`, `v1sq`, `v2sin`, `v2tri`, `v2saw`, `v2pul`, `v3saw`, `v3pul`, `noise`, `ring`, `vcf`, `vca`, `adsr`, `ar`, `sh`, `clk`, `ef`, `pre`, `inv1`, `inv2`, `lag`, `mix`, `rev`, `swo`, `sw1`, `sw2`.

**Ingangen en hun voorbedrade bron:**

| Ingang | Waar | Voorbedrade bron |
|---|---|---|
| `v1k`, `v2k`, `v3k` | klavier-CV van VCO-1/2/3 | `kbd` |
| `v1a`, `v1b`, `v1c` | FM van VCO-1 | `sh`, `adsr`, `v2sin` |
| `v2a`, `v2b`, `v2c`, `v2p` | FM en PWM van VCO-2 | `sh`, `adsr`, `v1sq`, `noise` |
| `v3a`, `v3b`, `v3c` | FM van VCO-3 | `noise`, `adsr`, `v2sin` |
| `fa`, `fb`, `fc`, `fd`, `fe` | audio in het filter | `ring`, `v1sq`, `v2pul`, `v3saw`, `noise` |
| `fk`, `fx`, `fy` | cutoff-CV van het filter | `kbd`, `adsr`, `v2sin` |
| `aa`, `ab` | audio in de VCA | `vcf`, `ring` |
| `al`, `ae` | VCA lineair, VCA exponentieel | `ar`, `adsr` |
| `ra`, `rb` | ringmodulator A en B | `v1saw`, `v2sin` |
| `si`, `sc` | sample & hold: signaal en klok | `noise`, `clk` |
| `eg` | externe poort van de envelopes | `clk` |
| `ei` | envelope-volger | `pre` |
| `pi` | voorversterker | `ext` |
| `n1`, `n2`, `n3`, `n4` | inverter 1 | geen (0 V) |
| `m1`, `m2` | inverter 2 | geen (0 V) |
| `li` | lag | geen (0 V) |
| `xa`, `xb` | mixer | `vcf`, `vca` |
| `pn` | panpot | `mix` |
| `ri` | galm | `mix` |
| `wa`, `wb`, `wc` | schakelaar: A, B, klok (boven 5 V schakelt hij om) | geen, geen, `clk` |

De knoppen bovenaan de kaart (Default Patch, Fat Bass, S/H Melody, Ring Bell, Wind, Whistling Filter, Gliding Lag, Vibrato via VCO-3) zijn voorbeelden van complete klanken, ook met kabels.

`getState()` geeft alle velden hierboven als getallen plus `cords`; het is gewone JSON.

Wat het apparaat met een state doet (getest):
- Getallen buiten het bereik worden afgekapt (`fF: 7` wordt 1, `v1f: -3` wordt 0); `NaN`, een tekst of `null` geeft de standaard; een keuze (`v1r`, `rD`, `eSrc`, `pG`, `kO`, `kI`, `kU`) wordt op een geheel getal in zijn bereik gezet.
- Een ongeldige kabel (onbekende naam, geen paar, geen tekst) wordt weggelaten; bij twee kabels naar dezelfde ingang blijft de laatste.
- Onbekende velden worden genegeerd. Zet er geen in.
- `setState({})` geeft de standaard (alle waarden uit de tabellen, geen kabels).

## Een tune

Een pack heet `naam.patchkamer-tunes.json` en staat in `../../../tunes/`. Het formaat en de licentie (`CC0-1.0` voor alles in `tunes/`) staan in `../../../tunes/AGENTS.md`. Voor dit apparaat is `device` altijd `nl.patchkamer.patchbaysynth` en elke tune is `kind: "set"` met een volledige `state` als hierboven. Zet geen merknamen van bestaande apparatuur in naam of omschrijving, en verzin geen persoon bij `author`. Een tune bevat de regelaars en de kabels, geen sequencer: een patroon speel je met een sequencer van de host.

### Wat is een goede basis, bas, lead, pad, pluck en arpeggio

Alles hieronder in neutrale taal; de getallen zijn beginpunten die je zelf bijstelt.

- **Basis.** De standaard: twee zaagtanden (VCO-1 en VCO-3, `fb` en `fd` 0,6) door het filter (`fF` 0,42, `fQ` 0,18), de ADSR op het filter (`fx` 0,4) en op de VCA. VCO-2 is licht verstemd (`v2t` 0,04, `v3t` −0,04).
- **Bas.** Zet de VCO's een octaaf lager (`v?f` 0,1719), laat `fF` laag (0,3), `fQ` rond 0,35 en `fx` tot 0,55, korte attack (`eA` 0,002), een middellange decay (0,25 s) en `eS` rond 0,75. Portamento aan (`kO` 1, `kP` 0,15) geeft een glijdende bas. Houd de galm klein (`gL`, `gR` ≤ 0,1).
- **Lead.** Laat VCO-1 en VCO-3 samen klinken (`fb`, `fd` 0,6 tot 0,8), een iets openere cutoff (`fF` 0,5), `fQ` 0,3 tot 0,45 en `eS` van 0,85 of hoger. Vibrato: zet VCO-3 op LF (`v3r` 1, `v3f` rond 0,5), haal hem uit het filter (`fd` 0) en patch zijn zaag via inverter 1 naar de FM van VCO-1 (`cords`: `[["v3saw","n1"],["inv1","v1a"]]`, met `qa` rond 0,25 en `v1a` rond 0,18).
- **Pad.** Lange attack en release (`eA` 0,5 tot 2, `eR` 1 tot 3), `eS` 0,9 tot 1, meer verstemming (`v2t` 0,1, `v3t` −0,1), een zachter filter (`fF` 0,4, `fQ` 0,1) en veel galm (`gL`, `gR` 0,4 tot 0,6).
- **Pluck.** Korte decay (`eD` 0,12 tot 0,3), `eS` 0 of laag (de exponentiële VCA laat het geluid wegsterven), een flinke envelope op het filter (`fx` 0,5 tot 0,7), lage `eA` (0,001), korte `eR`. De noten blijven kort, ook als de host ze lang aanhoudt.
- **Arpeggio.** Het apparaat heeft geen eigen arpeggiator: laat de host-sequencer de noten spelen. Wil je een willekeurige melodie, patch dan de sample & hold (`v1a` rond 0,5 laat de S/H de toonhoogte van VCO-1 sturen, `eSrc` 1 laat de klok de envelope starten); de snelheid (`cR`) is vrij en loopt niet synchroon met het tempo.

### Wat een tune absoluut niet moet doen

- Alle VCA-bronnen op 0 zetten (`aG` 0, `al` 0, `ae` 0): dan blijft het apparaat voor altijd stil.
- Een tune met `eS` onder ongeveer 0,6 en geen andere VCA-bron maken zonder dat het de bedoeling is: het geluid is dan na de aanslag bijna stil.
- Het filter met volle resonantie (`fQ` 1) en een cutoff op de bovengrens met een luide, brede ruisbron combineren zonder `oL`/`oR` te verlagen: de uitgang loopt dan tegen de ±16-begrenzing en klinkt hard.
- Kabels terugkoppelend leggen (bijvoorbeeld `ring` naar `ra`, `vca` naar een eigen FM-ingang): dat is een bewuste truc en kan ontsporen. De bewaker zet een ontsporende toestand terug op nul en het geluid gaat door, maar het klinkt dan als stotteren. Gebruik het alleen als de klank dat is.
- Verwachten dat de audio-ingang (`in`) zonder kabel in de klank terechtkomt: hij komt als `ext` (±5 V) in de box en gaat standaard alleen naar de voorversterker (`pi`), waarvan de uitgang alleen de envelope-volger voedt. Pas met een kabel van `ext` of `pre` naar bijvoorbeeld `fe`, `ra` of `xa` hoor je hem.
- Velden verzinnen die niet in de tabellen staan.

## Bewaker

Een ingang met `NaN`, `Infinity` of een absurde waarde, of een kabelkring die ontspoort, vergiftigde voorheen het filter, de ringmodulator of de galm voorgoed (het apparaat bleef daarna stil en gaf `NaN` door). Nu begrenst de worklet de audio-ingang, controleert hij na elk blok de toestand op eindigheid en zet hij een ontspoorde toestand terug op nul, en gaat er nooit een niet-eindige waarde naar de uitgang. Geluid in het normale gebied is bit-identiek met de oude versie. Test extreme instellingen altijd ook met een modulator.

## Controleren

- Draai vanuit de root van de repo: `node contract/validate-instrument.mjs devices/synths/PatchbaySynth/patchbay-synth.patchkamer-device.js` (en met `--lang en`). Dat moet `OK` geven, zonder `let op`.
- Je kunt niet horen hoe een tune klinkt. Heb je een browser, laad dan de host (`../../../patchkamer/AGENTS.md`) en kies de tune. Heb je geen browser, schrijf dan in je oplevering dat de tune **niet beluisterd** is.
- Alle tekst in het apparaat staat in het woordenboek `EN` bovenin het bestand (Nederlandse bron, Engels via `host.lang`). Een nieuwe tekst krijgt altijd nl én en.

## Wat je niet doet

- Verander nooit de `id`, de `kind`, de poort-id's of de namen van state-velden.
- Pas het apparaat niet aan om een tune te laten kloppen.
- Commit of push niet, tenzij de opdracht dat vraagt.

## Documentatie en songs

Dit zijn de plaatsen waar je terechtkunt voor documentatie en voor het componeren van songs met dit apparaat. Songs zijn CC-BY-4.0, tunes en presets CC0-1.0, het apparaat AGPL-3.0-or-later.

- Handleiding van Patchbay Synth: [NL](../../../docs/synths/USER-MANUAL_NL.md#patchbay-synth) · [EN](../../../docs/synths/USER-MANUAL_EN.md#patchbay-synth).
- Overzicht van de soort: [README](../README.md); handleiding van de hele soort: [NL](../../../docs/synths/USER-MANUAL_NL.md) · [EN](../../../docs/synths/USER-MANUAL_EN.md).
- Tunes (klanken, `kind: set`): [patchbay-synth-styles.patchkamer-tunes.json](../../../tunes/patchbay-synth-styles.patchkamer-tunes.json). Kies een tune als beginpunt voor de `state` van dit apparaat in de song; velden die de tune niet noemt krijgen hun standaard. Hoe tunes zijn opgebouwd: [tunes/AGENTS.md](../../../tunes/AGENTS.md).
- Overzicht van alle apparaten en hun signaalketens: [devices/AGENTS.md](../../../devices/AGENTS.md). Een song componeren: [songs/AGENTS.md](../../../songs/AGENTS.md).
- Rol in een song: halfmodulaire synth (bas, lead, effecten) met een patchpaneel. Noten op `notes`, audio uit `out`; de audio-ingang `in` is de voorversterker.
