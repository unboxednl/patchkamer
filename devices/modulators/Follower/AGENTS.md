# AGENTS.md: Follower

Dit bestand is voor AI-agents die dit apparaat configureren of er presets voor maken. Het is niet geschreven voor mensen. Het hoort bij `../../../AGENTS.md` (algemeen); lees die eerst. Hier staat wat alleen voor Follower geldt.

## Wat Follower is

Een envelope follower: een modulator die audio omzet in sturing. Uit één audio-ingang komen drie signalen: **Niveau** (hoe luid), **Transiënt** (een tik bij elke aanslag) en **Helderheid** (hoeveel hoog er in zit). Per doelparameter van een ander apparaat kies je welk signaal en hoe diep (−100 … +100% van het bereik van die parameter). Is de parameter snel stuurbaar (⚡), dan loopt de sturing sample-nauwkeurig via een audiosignaal, anders ongeveer 30 keer per seconde. Bij elke aanslag gaat er ook een trig of noot uit via de eventuitgang, zodat een drum of synth op de maat van een ander geluid kan meespelen. Het audiosignaal zelf gaat ongewijzigd door naar de uitgang `out` (begrensd op ±16, zie onder).

| | |
|---|---|
| Bestand | `follower.patchkamer-device.js` (in deze map) |
| `id` | `nl.patchkamer.follower`. Verander die nooit: daaraan hangen presets en songs van gebruikers. Het apparaat heette eerst Volger (`nl.patchkamer.volger`); werkruimtes of presets uit die tijd verwijzen naar de oude id |
| Naam | `Follower` in alle talen; de poortnamen hebben een Engelse variant via `i18n` |
| Soort | `modulator` (categorie `mod`): Follower krijgt dus **presets** (geen tunes) |
| Poorten | audio-ingang `in` ("Luistert naar" / "Listens to"), audio-uitgang `out` ("Door" / "Through"), eventuitgang `trig` ("Aanslagen" / "Onsets"), sturingsuitgang `mod` ("Follower") |
| Contract | v1.11 |
| Licentie apparaat | AGPL-3.0-or-later |

## Geen tunes, wel presets

Alleen apparaten met `kind: 'instrument'` hebben tunes. Follower is een `modulator`, dus het krijgt **presets** en **nooit tunes** (contract §0 en §13c). Maak voor Follower geen pack in `../../../tunes/`. Een presetpack heet `naam.patchkamer-presets.json` en staat in `../../../presets/`; het formaat is dat van het contract (§13c), `formatVersion` 2, licentie `CC0-1.0`, `device` is altijd `nl.patchkamer.follower` en elke preset is `kind: "set"`. Maak alleen presets als de opdracht dat vraagt.

## De state

`state` van een preset is wat `getState()` teruggeeft (Follower heeft geen `getPreset`).

| Veld | Wat | Bereik | Start |
|---|---|---|---|
| `att` | Aanzet (Attack) van het niveau | 0,1 … 200 ms | 5 |
| `rel` | Loslaten (Release) van het niveau | 5 … 3000 ms | 150 |
| `gain` | Versterking vóór de meting | −24 … 36 dB | 0 |
| `floor` | Vloer: niveau dat 0 geeft | −90 … −10 dB | −50 |
| `range` | Bereik: aantal dB tussen 0 en 1 | 6 … 80 dB | 40 |
| `focus` | Welk deel van het spectrum | `alles`, `laag`, `midden`, `hoog` of `eigen` | `alles` |
| `freq` | Eigen frequentie (bij `focus` = `eigen`) | 40 … 16000 Hz | 1000 |
| `pol` | Uitslag | `uni` (0 … +1) of `bi` (−1 … +1) | `uni` |
| `inv` | Omgekeerd: luider = minder | boolean | `false` |
| `tsens` | Aanslag-gevoeligheid | 0 … 1 | 0,5 |
| `tdec` | Verval van het transiëntsignaal | 10 … 1000 ms | 120 |
| `hold` | Minimale afstand tussen aanslagen | 10 … 500 ms | 60 |
| `gate` | Poort: onder dit niveau geen aanslag en geen niveau | −90 … −10 dB | −60 |
| `trigOut` | Wat een aanslag stuurt | `ch1` … `ch8` (trig op spoor) of `noot` | `ch1` |
| `trigNote` | Nootnummer bij `trigOut` = `noot` | geheel getal 24 … 96 | 60 |
| `sel` | Toewijzingen: `{ doelId: { paramId: { d, s } } }` met diepte `d` (−1 … 1) en bron `s` (`niveau`, `transient` of `helder`) | – | `{}` |

De waarden van `focus` en de bron-ids in `sel` zijn Nederlandse sleutels uit de eerste versie; ze blijven zo, omdat presets en songs eraan hangen. Zet ze nooit om.

Wat Follower met een state doet (getest):
- Getallen buiten het bereik worden afgekapt; een tekst, `null`, `NaN`, `Infinity` of een ontbrekende waarde geeft de startwaarde. `setState({})` geeft de startwaarden en lege toewijzingen.
- Een keuze of boolean met een ongeldige waarde geeft de startwaarde. In `sel` worden alleen eindige dieptes bewaard (afgekapt op −1 … 1); een onbekende bron wordt `niveau`.
- Onbekende velden worden genegeerd. Zet er geen in.
- De knoppen volgen `setState`; `setState(getState())` geeft dezelfde state.
- Toewijzingen in `sel` werken pas als het doelapparaat is aangesloten (paarse kabel van `mod` naar de Mod-ingang): de lijst met parameters komt van dat apparaat.

Wat Follower met zijn ingang doet (getest): `NaN`, `±Infinity` en absurd grote waarden (boven ±16) worden begrensd, zodat één foutieve waarde van een apparaat ervoor de volgers niet voorgoed vergiftigt; een bewaker zet een ontspoorde toestand per blok terug, en de worklet accepteert alleen eindige parameters. Normaal geluid, de drie stuursignalen en de aanslagen blijven bit-identiek aan de oude versie.

## Skins

De regelaars zijn sinds 1.13.0 via `host.ui.adopt` herkenbaar voor skins: `id` is de state-sleutel (`focus`, `freq`, `gain`, `att`, `rel`, `floor`, `range`, `pol`, `inv`, `tsens`, `tdec`, `hold`, `gate`, `trigOut` en `trigNote`), `role` is `param` (knoppen) of `select` (keuzelijsten) en `group` is `det` (detectie) en `hit` (aanslagen). `trigNote` staat in `modExclude` (geheel getal, bewust niet stuurbaar). De diepteschuiven van de toewijzingslijst hebben geen id. Een skin kan zo de schuiven als draaiknop tonen (`design.controls` met `face: rotary`). De meegeleverde skin `Compact` staat in `../../../skins/library/nl.patchkamer.follower/` (draaiknoppen met naam en waarde eronder, weinig kaders, geen uitlegtekst, kaartbreedte 480 px); de CSS erin werkt in de shadow root van het apparaat. De `id`'s, rollen en groepen horen bij de vaste interface: hernoem ze niet (een skin die erop mikt valt dan stil terug).

## Controleren

- `node contract/validate-instrument.mjs devices/modulators/Follower/follower.patchkamer-device.js --lang nl` en `--lang en`, vanuit de root. Beide moeten `OK` geven, zonder `let op`.
- Je kunt niet horen hoe een preset klinkt of hoe de sturing aanvoelt. Heb je geen browser, schrijf dan in je oplevering dat de preset **niet beluisterd** is.
- Alle tekst in het apparaat staat in het woordenboek `EN` bovenin het bestand (Nederlandse tekst als sleutel, Engelse als waarde). Een nieuwe tekst krijgt altijd nl én en.
- Zonder AudioWorklet gaat het geluid door maar stuurt Follower niets; de UI meldt dat.

## Wat je niet doet

- Verander nooit de `id`, de `kind`, de poort-id's of de namen en waarden van state-velden.
- Pas het apparaat niet aan om een preset te laten kloppen.
- Zet geen merknamen van bestaande apparatuur in naam of omschrijving, en verzin geen persoon bij `author`.
- Commit of push niet, tenzij de opdracht dat vraagt.

## Documentatie en songs

Dit zijn de plaatsen waar je terechtkunt voor documentatie en voor het componeren van songs met dit apparaat. Songs zijn CC-BY-4.0, tunes en presets CC0-1.0, het apparaat AGPL-3.0-or-later.

- Handleiding van Follower: [NL](../../../docs/modulators/USER-MANUAL_NL.md#follower) · [EN](../../../docs/modulators/USER-MANUAL_EN.md#follower).
- Overzicht van de soort: [README](../README.md); handleiding van de hele soort: [NL](../../../docs/modulators/USER-MANUAL_NL.md) · [EN](../../../docs/modulators/USER-MANUAL_EN.md).
- Presets (instellingen, `kind: set`): [follower.patchkamer-presets.json](../../../presets/follower.patchkamer-presets.json). Kies een preset als beginpunt voor de `state` van dit apparaat in de song; velden die de preset niet noemt krijgen hun standaard.
- Overzicht van alle apparaten en hun signaalketens: [devices/AGENTS.md](../../../devices/AGENTS.md). Een song componeren: [songs/AGENTS.md](../../../songs/AGENTS.md).
- Route voor agents: [soort Modulators](../AGENTS.md) → [devices/AGENTS.md](../../AGENTS.md) → [root AGENTS.md](../../../AGENTS.md). Contract: [NL](../../../contract/PATCHKAMER-CONTRACT_NL.md) · [EN](../../../contract/PATCHKAMER-CONTRACT_EN.md). Hoe presets van dit apparaat zijn opgebouwd: [presets/AGENTS.md](../../../presets/AGENTS.md). <!-- agents-tree -->
- Rol in een song: sturing uit audio (niveau, transiënt, helderheid). Audio in `in` (luistert), audio door via `out`, `trig` stuurt aanslagen door als events en `mod` is de stuuruitgang naar de parameters van andere apparaten.
