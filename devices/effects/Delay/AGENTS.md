# AGENTS.md: Delay

Dit bestand is voor AI-agents die dit apparaat configureren of er presets voor maken. Het is niet geschreven voor mensen. Het hoort bij `../../../AGENTS.md` (algemeen); lees die eerst. Hier staat wat alleen voor Delay geldt.

## Wat Delay is

Een uitgebreid delay-effect. De delaytijd is **vrij** (1 tot 4000 ms), **gesynchroniseerd met de klok van de host** (notenwaarden van 2 maten tot 1/64, recht, met punt of triool, of een aantal zestienden zoals 3/16 of 5/16) of gebaseerd op een **eigen tempo** (tap). Links en rechts hebben elk een eigen notenwaarde of tijd plus een stereo-offset. Modi: stereo, ping-pong, mono en dual (eigen feedback per kant). In de lus zitten een hoogdoorlaat en laagdoorlaat, optioneel tape- of buisverzadiging en diffusie; verder modulatie (sinus, tape, chorus), ducking op de eigen ingang, freeze, reverse, swing van de host, en een zachte begrenzer waarmee de feedback kortstondig boven 100% mag. Alles draait in één AudioWorklet (geheugenlijnen met kubieke interpolatie).

| | |
|---|---|
| Bestand | `delay.patchkamer-device.js` (in deze map) |
| `id` | `nl.patchkamer.delay`. Verander die nooit: daaraan hangen presets en songs van gebruikers |
| Naam | `Delay` in alle talen; alleen de poortnamen `Uit` en `Out` verschillen per taal (via `i18n`) |
| Soort | `effect` (categorie `effect`): Delay krijgt dus **presets** (geen tunes) |
| Poorten | audio-ingang `in` (stereo; mono wordt naar twee kanalen gezet), audio-uitgang `out` (stereo), sturing `mod`; geen events |
| Contract | v1.28 (het apparaat gebruikt niets nieuwers dan v1.8) |
| Licentie apparaat | AGPL-3.0-or-later |
| Worklet | `nl-patchkamer-delay-1-1-1`; verhoog de versie in de naam als je de worklet-code wijzigt |

## Geen tunes, wel presets

Alleen apparaten met `kind: 'instrument'` hebben tunes. Delay is een `effect`, dus het krijgt **presets** en **nooit tunes** (contract §0 en §13c). Het pack is [`delay.patchkamer-presets.json`](../../../presets/delay.patchkamer-presets.json) (35 presets in 8 mappen: Slapback, Dub, Ping-pong, Rhythmic, Ambient, Tape, Modulated, Creative); `formatVersion` 2, licentie `CC0-1.0`, `device` is `nl.patchkamer.delay`, elke preset is `kind: "set"` en bevat alle velden van de state. Controle: `node devices/effects/Delay/check-preset.mjs presets/delay.patchkamer-presets.json` (vanuit de root).

## De state

`state` van een preset is wat `getState()` teruggeeft (Delay heeft geen `getPreset`). Onbekende velden worden genegeerd; ontbrekende of ongeldige waarden krijgen de startwaarde; getallen worden binnen hun bereik gehouden; `stepsL` en `stepsR` worden afgerond.

| Veld | Wat | Bereik of keuzes | Start | Eenheid |
|---|---|---|---|---|
| `timing` | Tijdbron: klok van de host, eigen tempo (tap) of vrij | `sync`, `tap`, `free` | `sync` | – |
| `bpm` | Eigen tempo (alleen bij `tap`) | 30 … 300 | 120 | BPM |
| `linked` | Rechts gebruikt de notenwaarde of tijd van links | boolean | `true` | – |
| `mode` | Modus | `stereo`, `pingpong`, `mono`, `dual` | `stereo` | – |
| `swing` | Deel van de swing van de host dat op de echo's wordt toegepast (alleen `sync`, alleen bij een oneven aantal zestienden) | 0 … 1 | 0 | deel |
| `spread` | Stereo-offset: wordt bij de tijd van rechts opgeteld | −100 … 100 | 0 | ms |
| `divL`, `divR` | Notenwaarde links, rechts | `2bar`, `1bar`, `1/2`, `1/4`, `1/8`, `1/16`, `1/32`, `1/64`, `steps` | `1/8` | – |
| `feelL`, `feelR` | Soort | `straight`, `dotted`, `triplet` | `dotted` (L), `straight` (R) | – |
| `stepsL`, `stepsR` | Aantal zestienden bij `divL`/`divR` = `steps` | 1 … 32 (geheel) | 3 | zestienden |
| `msL`, `msR` | Vrije tijd links, rechts (alleen bij `timing` = `free`; rechts alleen als `linked` uit staat) | 1 … 4000 (log) | 375 | ms |
| `fb` | Feedback (links; bij niet-dual ook rechts) | 0 … 1,2 | 0,35 | deel |
| `fbR` | Feedback rechts, alleen bij `dual` | 0 … 1,2 | 0,35 | deel |
| `xfeed` | Kruisfeedback (stereo en dual) | 0 … 1 | 0 | deel |
| `freeze` | Houdt de echo vast: ingang uit de lus, feedback 100% | boolean | `false` | – |
| `reverse` | Omgekeerde echo, in blokken van de delaytijd | boolean | `false` | – |
| `hp` | Hoogdoorlaat in de lus (2e orde) | 20 … 2000 (log) | 120 | Hz |
| `lp` | Laagdoorlaat in de lus (2e orde) | 500 … 20000 (log) | 6000 | Hz |
| `sat` | Verzadiging in de lus | `off`, `tape`, `tube` | `off` | – |
| `drive` | Hoeveel verzadiging | 0 … 1 | 0,3 | deel |
| `diffusion` | Smeert de echo's (twee allpass-trappen in de lus) | 0 … 1 | 0 | deel |
| `modType` | Soort modulatie van de delaytijd | `sine`, `tape`, `chorus` | `sine` | – |
| `modRate` | Snelheid | 0,05 … 10 (log) | 0,8 | Hz |
| `modDepth` | Diepte (hoogstens 10 ms of 40% van de tijd) | 0 … 1 | 0 | deel |
| `duck` | Ducking: echo zachter terwijl de ingang speelt | 0 … 1 | 0 | deel |
| `duckThr` | Drempel van de ducking | −60 … −6 | −30 | dB |
| `duckRel` | Release van de ducking | 50 … 1500 (log) | 300 | ms |
| `glide` | Wat er bij een tijdwissel gebeurt: kruisfade (20 ms, geen toonhoogtegleed) of tape (de tijd glijdt, de echo's veranderen van toonhoogte) | `fade`, `tape` | `fade` | – |
| `glideTime` | Glijtijd bij `tape` (tijdconstante) | 20 … 2000 (log) | 250 | ms |
| `mix` | Dry/wet: onder 50% blijft het droge signaal vol en komt de echo erbij; boven 50% gaat het droge signaal omlaag; bij 100% is er geen droog signaal | 0 … 1 | 0,3 | deel |
| `level` | Uitgangsniveau | −24 … 12 | 0 | dB |

Stuurbaar (`params()`, spoor `delay`): `swing`, `spread`, `msL`, `msR`, `fb`, `fbR`, `xfeed`, `hp`, `lp`, `drive`, `diffusion`, `modRate`, `modDepth`, `duck`, `duckRel`, `mix`, `level`. Bewust niet stuurbaar (`modExclude`): `stepsL`, `stepsR`, `bpm`, `glideTime`, `duckThr`; de keuzemenu's en vinkjes ook niet.

## Hoe de tijd tot stand komt

- `sync`: tijd = aantal zestienden × `stepDur` van de host (60 / BPM / 4). `2bar` = 32, `1bar` = 16, `1/2` = 8, `1/4` = 4, `1/8` = 2, `1/16` = 1, `1/32` = 0,5, `1/64` = 0,25 zestienden; `dotted` × 1,5, `triplet` × 2/3. Het tempo komt uit `onStep` (alleen tijdens afspelen) **en** uit een timer van 40 ms die `host.bpm` en `host.swing` leest, zodat een tempowissel ook werkt als de klok stilstaat.
- `tap`: idem, met `bpm` van het apparaat. De knop **Tap** zet `bpm` uit het gemiddelde van de laatste tikken (hoogstens 2 s tussen twee tikken) en kiest `tap`.
- `free`: `msL` (en `msR` als `linked` uit staat). In deze stand tellen notenwaarden niet.
- Rechts = links + `spread` als `linked` aan staat, anders de eigen waarde van rechts + `spread`.
- Maximum 8 s per lijn; een langere tijd (bijvoorbeeld 2 maten bij 40 BPM = 12 s) wordt gehalveerd (de kaart meldt dat).
- Swing: bij een **oneven** aantal zestienden (1/16, 3/16, 5/16, …) is de eerste echo `n + sw` zestienden en de tweede `n − sw` (`sw` = `swing` × swing van de host, hoogstens 0,45 n), zodat de echo's op het geswingde raster blijven. Bij een even aantal verandert er niets. De swing werkt voor bronnen die op even zestienden beginnen.
- De kaart toont de huidige tijd links en rechts in ms en de notenwaarde (via `host.frame`).

## Wat het apparaat in de worklet doet

- Per kant twee lijnen na elkaar (aanvoer 1 → lijn 2 → terug naar lijn 1); daardoor kan swing de echo's om en om korter en langer maken, en elke echo gaat precies één keer door de filters. Ping-pong gebruikt de lijnen links 1 en rechts 2 als één ring, met de ingang als mono-som.
- Een tijdwissel: bij `fade` een kruisfade van 20 ms naar de nieuwe tijd (zonder toonhoogtegleed; een volgende wissel wacht tot de fade klaar is); bij `tape` een gladde overgang met tijdconstante `glideTime`, waarbij de toonhoogte van de echo's bewust meeglijdt. Gebruik `tape` als je de tijd moduleert (Drift, LFO).
- De begrenzer zit **alleen in het terugvoerpad** (knie 0,6, plafond 1,0): echo's tot 0 dBFS blijven ongewijzigd, bij feedback boven 100% loopt het niveau op tot het plafond. De wet-uitgang wordt bij 1,0 zacht begrensd tot 1,4 (+3 dBFS).
- Bewaker: de ingang wordt begrensd op ±16 (+24 dB) en NaN wordt 0; parameterberichten worden alleen eindig geaccepteerd; per blok worden de filter- en omhullendetoestanden gecontroleerd en bij een ontsporing worden de lijnen geleegd. Het eerste bericht met de state na het laden zet de niveaus direct (geen fade vanuit stilte).
- Een moduswissel dempt de echo's 15 ms (zachte demping) om een tik te voorkomen. Een wissel van `sat` schakelt hard om.
- **Slaapstand (1.1.1):** is de ingang stil (alle samples onder 1e-9, ongeveer -180 dBFS), is alles wat de laatste tijd in de vier lijnen is geschreven kleiner dan 1e-9 gedurende de langste leesafstand plus marge (huidige en doeltijden, modulatiebereik, bij reverse de hele lijn), en zijn de filter- en allpassgeheugens (`Seg.settled`) uitgeklonken, dan slaat `process()` het lezen, filteren en schrijven over: nullen schrijven (zoals de lus zou doen), de tijdstappen (`adv`, `revAdv`), de zachte niveaus en de modulatiefase laten doorlopen en nul als natte uitvoer geven; het droge pad blijft gewoon. Elk blok met ingang boven de drempel wekt hem in dat blok. Hij slaapt niet bij feedback boven 0,98 (een lus met versterking boven 1 laat een rest onder de drempel aangroeien; de oude code gaat dan vanzelf oscilleren) en niet zolang er in freeze iets in de lijnen staat. Bij zachte feedback (bijvoorbeeld 0,4) slaapt hij ongeveer 7 s na een impuls. `process()` geeft altijd `true`: `return false` gaf in Chromium geen meetbaar voordeel. De limiter-melding naar de kaart gaat alleen nog bij verandering (het apparaat onthoudt de laatste waarde).
- Zonder AudioWorklet gaat het geluid ongewijzigd door en meldt de kaart dat.

## Skins

Het apparaat is herkenbaar voor skins (`design.controls` met `face: rotary`): schuiven en keuzelijsten dragen `data-pk-id` (de state-sleutel) en sinds 1.1.0 ook `data-pk-group` (`s_time`, `s_left`, `s_right`, `s_fb`, `s_tone`, `s_motion`, `s_duck` of `s_out`). De meegeleverde skin `Compact` staat in `../../../skins/library/nl.patchkamer.delay/` (draaiknoppen met de naam eronder, de acht secties in vier rijen; ongeveer 480 x 403 tegenover 700 x 901). Wijzig je de volgorde van `SECTIONS` of de opbouw van `.disp`, `h3` of `.grid`, controleer dan die skin: hij plaatst de koppen en kaders met `nth-child` en geeft de keuzelijsten een vaste breedte per `data-pk-id`.

## Controleren

- `node contract/validate-instrument.mjs devices/effects/Delay/delay.patchkamer-device.js` plus `--lang nl` en `--lang en`, vanuit de root. Alle drie moeten `OK` geven, zonder `let op`.
- `node --no-warnings docs/tools/measure-delay.mjs [sectie ...]`: metingen in Node met de echte worklet-code (delaytijd tegen ingesteld, sync bij tempo's en soorten, tempowissel, swing, feedbackverloop, filters, stabiliteit, NaN-burst, modi, reverse, tikken, alle presets, rekenlast). Eindigt met `alle controles OK`.
- `node --no-warnings devices/effects/Delay/check-preset.mjs presets/delay.patchkamer-presets.json`.
- Vergelijk je een wijziging in de worklet met de vorige versie, doe dat dan sample voor sample (honderd+ willekeurige en extreme configuraties, bursts met stilte ertussen, NaN/Infinity): zonder slaapstand (`SLEEP_IN = 0`) hoort de uitvoer bit-identiek te zijn, met slaapstand mag alleen de uitgeklonken staart (onder -120 dBFS) verschillen.
- Je kunt niet horen hoe een preset klinkt. Schrijf in je oplevering dat het **niet beluisterd** is.
- De teksten staan in het bestand zelf (`NL` en `EN`). Een nieuwe tekst krijgt altijd nl én en.

## Wat je niet doet

- Verander nooit de `id`, de `kind`, de poort-id's of de namen van state-velden.
- Pas het apparaat niet aan om een preset te laten kloppen.
- Maak geen preset met `freeze: true`: een apparaat dat bij het laden geen ingang doorlaat, klinkt stil. Zet een preset met `fb` boven 1 alleen in een map met een duidelijke naam (zoals Endless Smear en Runaway Feedback); die loopt op tot de begrenzer.
- Zet geen merknamen van bestaande apparatuur in naam of omschrijving, en verzin geen persoon bij `author`.
- Commit of push niet, tenzij de opdracht dat vraagt.

## Documentatie en songs

Dit zijn de plaatsen waar je terechtkunt voor documentatie en voor het componeren van songs met dit apparaat. Songs zijn CC-BY-4.0, tunes en presets CC0-1.0, het apparaat AGPL-3.0-or-later.

- Handleiding van Delay: [NL](../../../docs/effects/USER-MANUAL_NL.md#delay) · [EN](../../../docs/effects/USER-MANUAL_EN.md#delay).
- Overzicht van de soort: [README](../README.md); handleiding van de hele soort: [NL](../../../docs/effects/USER-MANUAL_NL.md) · [EN](../../../docs/effects/USER-MANUAL_EN.md).
- Presets (instellingen, `kind: set`): [delay.patchkamer-presets.json](../../../presets/delay.patchkamer-presets.json). Kies een preset als beginpunt voor de `state` van dit apparaat in de song; velden die de preset niet noemt krijgen hun standaard.
- Overzicht van alle apparaten en hun signaalketens: [devices/AGENTS.md](../../../devices/AGENTS.md). Een song componeren: [songs/AGENTS.md](../../../songs/AGENTS.md).
- Route voor agents: [soort Effects](../AGENTS.md) → [devices/AGENTS.md](../../AGENTS.md) → [root AGENTS.md](../../../AGENTS.md). Contract: [NL](../../../contract/PATCHKAMER-CONTRACT_NL.md) · [EN](../../../contract/PATCHKAMER-CONTRACT_EN.md). Hoe presets van dit apparaat zijn opgebouwd: [presets/AGENTS.md](../../../presets/AGENTS.md). <!-- agents-tree -->
- Rol in een song: delay op een bron als insert of op een send-bus van de Mixer (zet dan `mix` op 100%: er blijft geen droog signaal). Audio in `in`, uit `out`; sync-tijden volgen het tempo van de studio. Een dotted-eighth (`divL: 1/8`, `feelL: dotted`) of een 1/4 met `fb` 0,4 tot 0,6 past bij bijna elk tempo.
