# AGENTS.md: Karplus String

Dit bestand is voor AI-agents die **tunes voor Karplus String** maken. Het is niet geschreven voor mensen. Het hoort bij `../../../AGENTS.md` (algemeen) en `../../../tunes/AGENTS.md` (regels voor tunepacks); lees die eerst. Hier staat wat alleen voor Karplus String geldt.

## Wat Karplus String is

Een fysisch snaarmodel (Karplus-Strong) met acht stemmen, als AudioWorklet. Elke noot is een snaar: een korte ruisstoot (plukken) of een doorgaande ruis zolang de noot klinkt (strijken) gaat in een vertragingslus met demping, stijfheid en galmtijd. Het heeft een eigen klavier van twee octaven en zes snelle instellingen bovenaan de kaart. Het heeft **geen sequencer en geen arpeggiator**: het speelt noten die van buiten komen. Het is geen strijkensemble: één snaar per noot, geen koor van stemmen.

| | |
|---|---|
| Bestand | `karplus-string.patchkamer-device.js` (in deze map) |
| `id` | `nl.patchkamer.string`. Verander die nooit: daaraan hangen tunes en songs van gebruikers. De id is korter dan de naam; dat is bewust zo gelaten |
| Naam | `Karplus String` in alle talen; alleen de poortnamen hebben een Engelse variant (via `i18n`) |
| Soort | `instrument`: dit apparaat krijgt dus **tunes** (geen presets) |
| Poorten | eventingang `notes` (Noten), modulatie-ingang `mod`, audio-uitgang `out` (Uit); geen eventuitgang |
| Contract | v1.11 |
| Licentie apparaat | AGPL-3.0-or-later |

Het is de bijgewerkte vorm van een ouder bestand met de naam String (zelfde id). Een tune of song uit die tijd laadt hier gewoon in.

## Wat je hier doet

Je maakt klanken (tunes) voor Karplus String en zet ze als pack in `../../../tunes/`. Het apparaat zelf pas je alleen aan als de opdracht dat zegt (`version` ophogen; `id`, poort-id's en state-velden gelijk houden).

## De state

`state` van een tune is wat `getState()` teruggeeft: tien velden, allemaal getallen.

| Veld | Wat het doet | Bereik | Start |
|---|---|---|---|
| `decay` | Galmtijd in seconden: hoe lang een noot uitklinkt zolang hij vastgehouden wordt (60 dB) | 0,1 … 20 | 3 |
| `damp` | Demping in de lus (een laagdoorlaat die elke ronde de hoge tonen afneemt): 0 = geen demping (helder, lang), 1 = veel demping (dof, kort) | 0 … 1 | 0,4 |
| `bright` | Helderheid van de aanslag: 0 = dof (veel laagdoorlaat op de ruisstoot), 1 = scherp | 0 … 1 | 0,6 |
| `pos` | Plukpositie als deel van de snaarlengte: dicht bij 0 = bij de brug (scherp, nasaal), 0,5 = in het midden (hol, even boventonen weg) | 0,02 … 0,5 | 0,15 |
| `bow` | Strijken: 0 = plukken, hoger = doorgaande aanslag zolang de noot klinkt (strijkstok); 1 is sterk | 0 … 1 | 0 |
| `stiff` | Stijfheid (dispersie): 0 = ideale snaar, hoger = boventonen komen te hoog (metaalachtig, klok) | 0 … 1 | 0 |
| `tune` | Stemming in cent, voor alle noten | −100 … 100 | 0 |
| `spread` | Stereo-spreiding: elke noot krijgt een willekeurige plek; 0 = midden, 1 = breed | 0 … 1 | 0,5 |
| `lvl` | Niveau | 0 … 1 | 0,7 |
| `oct` | Octaafverschuiving van binnenkomende noten en van het eigen klavier | −2, −1, 0, 1 of 2 | 0 |

Zet alle tien de velden in een tune, zodat de tune niet afhangt van wat er daarvoor op het apparaat stond. Een patroon of sequencer zit niet in de state: een tune is alleen een klank.

De snelle instellingen bovenaan de kaart (Guitar, Harp, Koto, Bowed, Metal, Muted; in het Nederlands Gitaar, Harp, Koto, Strijkstok, Metaal, Dof) zetten alleen `decay`, `damp`, `bright`, `pos`, `bow` en `stiff`. Ze zijn een goed startpunt:

| Naam | `decay` | `damp` | `bright` | `pos` | `bow` | `stiff` |
|---|---|---|---|---|---|---|
| Guitar | 3 | 0,4 | 0,6 | 0,15 | 0 | 0 |
| Harp | 6 | 0,25 | 0,45 | 0,4 | 0 | 0,05 |
| Koto | 2 | 0,55 | 0,85 | 0,07 | 0 | 0,35 |
| Bowed | 4 | 0,5 | 0,4 | 0,12 | 0,65 | 0 |
| Metal | 9 | 0,1 | 0,9 | 0,3 | 0 | 0,8 |
| Muted | 1 | 0,85 | 0,25 | 0,25 | 0 | 0 |

### Wat het apparaat met noten doet

- Maximaal **acht stemmen**; een negende noot neemt de stem die het langst klinkt over.
- Een nootgebeurtenis heeft `note` (MIDI), `vel` (0,05 … 1; standaard 0,8), `time` en `dur` (standaard 0,3 s). `note` krijgt `oct` × 12 erbij en wordt begrensd op 0 … 135. Gebeurtenissen met een niet-eindig `note`, `vel`, `time` of `dur` worden genegeerd of krijgen de standaard.
- Een noot klinkt `dur` seconden. **Daarna klinkt hij hooguit 0,25 s uit**, ook als `decay` groter is: `decay` bepaalt dus de ring zolang de noot vastgehouden wordt. Wil je een lange, uitklinkende snaar, geef de noot dan een lange `dur`.
- Plukken (`bow` 0): de aanslag is één ruisstoot van de lengte van de snaar, sterker bij hogere `vel`. Strijken (`bow` > 0): ruis blijft de lus voeden zolang de noot klinkt; `bow` stuurt hoe sterk.
- De toonhoogte is zuiver zolang de snaar in de lus past: noten onder ongeveer MIDI 5 (rond 12 Hz bij 48 kHz) worden niet meer zuiver. Houd noten boven MIDI 24 (C1).
- Bij Stop klinken alle stemmen kort uit en worden noten die al vooruit zijn gepland maar nog niet zijn begonnen, weggegooid.
- De modulatie-ingang `mod` kan acht parameters sturen (lane Karplus String): `decay`, `damp`, `bright`, `pos`, `bow`, `stiff`, `tune` en `lvl`. Sturing komt bovenop de knop en blijft binnen het bereik. `spread` en `oct` zijn niet te sturen. Plukpositie en galmtijd werken per nieuwe noot; de overige veranderen direct.

Wat het apparaat met een state doet (getest):
- Getallen buiten het bereik worden afgekapt (`decay: 1e9` wordt 20); een tekst, `null`, `NaN` of een ontbrekende waarde geeft de startwaarde.
- Een `oct` buiten −2 … 2 of niet geheel geeft 0.
- Onbekende velden worden genegeerd. Zet er geen in.
- `setState({})` geeft de startwaarden; `setState(getState())` geeft dezelfde state terug; de knoppen en de keuze Octaaf volgen.

Een bewaker in de worklet controleert elke stem: wordt de uitvoer niet eindig (`NaN`, `Infinity`) of absurd groot (≥ 100), dan wordt die stem gewist, zodat de rest blijft klinken en er nooit een `NaN` naar de studio gaat. Berichten met een niet-eindige waarde worden genegeerd. In het normale gebied verandert het geluid hierdoor niet.

## Goede instellingen per soort klank

| Soort | Advies |
|---|---|
| Basis | De startwaarden (zie hierboven): `decay` 3, `damp` 0,4, `bright` 0,6, `pos` 0,15. Een gewone getokkelde snaar. |
| Bas | Lage noten (MIDI 28 … 48, laat de sequencer ze sturen of zet `oct` −1 of −2), `decay` 1 … 3, `damp` 0,5 … 0,7, `bright` 0,3 … 0,5, `pos` 0,1 … 0,2, `stiff` 0. |
| Lead | Doorgaande, gestreken noten: `bow` 0,5 … 0,8, `decay` 3 … 6, `damp` 0,4 … 0,6, `bright` 0,3 … 0,5, `spread` 0,2. Met korte noten (`dur`) klinkt het meer als een toot dan als een lead. |
| Pad | `bow` 0,4 … 0,7 met lange noten (`dur` 2 s of meer), `decay` 6 … 12, `damp` 0,3 … 0,5, `bright` 0,3 … 0,5, `spread` 0,7 … 1. Er is geen langzame aanzwel: de snaar begint direct. Het apparaat is acht-stemmig; gebruik hooguit vier tot zes noten tegelijk. |
| Pluck | `bow` 0, `decay` 0,5 … 1,5, `damp` 0,5 … 0,7, `bright` 0,6 … 0,9, `pos` 0,07 … 0,2. Korte noten (`dur` 0,1 … 0,3 s). |
| Arpeggio | Het apparaat heeft **geen eigen arpeggiator**. Een tune hoort geen patroon te bevatten: de arpeggio komt van een sequencer die noten stuurt. Pluckklanken (hierboven) met `dur` van 0,1 tot 0,25 s klinken kort en ritmisch; zet `spread` 0,3 … 0,6. |

## Wat een tune niet moet doen

- Geen velden die hier niet staan, en geen `oct` buiten −2 … 2.
- Geen `lvl` 1 met veel stemmen tegelijk: bij extreme instellingen (alle knoppen op hun uiterste, acht stemmen) is een piek tot ongeveer 1,7 gemeten, en boven 1 clipt het verderop in de keten.
- Met `bow` boven 0 klinkt een noot zolang hij vastgehouden wordt: geef gestreken noten dus een `dur` die past, en vermijd `decay` 20 met `bow` 1 (de ruis voedt de lus voortdurend; niet apart op toonhoogte of niveau beoordeeld).
- Reken niet op meer dan acht gelijktijdige noten, op noten onder MIDI 24, of op een lange uitklink na het einde van de noot (hooguit 0,25 s).

## Skins

Alle regelaars komen uit `host.ui.knob` en `host.ui.select` met `id`, `role` en `group` (`string`, `excite`, `pitch`, `out`). De meegeleverde skin `Compact` staat in `../../../skins/library/nl.patchkamer.string/`: draaiknoppen met de naam eronder, in twee panelen (`design.layout`), ongeveer 480 x 344 punten tegenover 520 x 385. De kaart kan niet smaller dan ongeveer 482 punten (de kaartkop). Het apparaat bouwt zijn regelaars in het vlak van de kaart (geen shadow root), dus de skin kan geen eigen CSS toepassen en gebruikt alleen `design`. Verander je de ids of groepen, controleer dan die skin.

## Controleren

- Draai vanuit de root van de repo: `node contract/validate-instrument.mjs devices/synths/KarplusString/karplus-string.patchkamer-device.js` (en met `--lang en`). Dat moet `OK` geven, zonder `let op`.
- Je kunt niet horen hoe een tune klinkt. Heb je een browser, laad dan de host (`../../../patchkamer/AGENTS.md`) en kies de tune. Heb je geen browser, schrijf dan in je oplevering dat de tune **niet beluisterd** is.
- Alle tekst in het apparaat staat in het woordenboek `EN` bovenin het bestand (Nederlandse bron, Engels via `host.lang`). Een nieuwe tekst krijgt altijd nl én en.
- De worklet heet `nl-patchkamer-karplusstring-1-11-0`; verhoog die naam bij elke wijziging van de worklet-code, anders laadt de host de oude code.

## Wat je niet doet

- Verander nooit de `id`, de `kind`, de poort-id's of de namen van state-velden.
- Pas het apparaat niet aan om een tune te laten kloppen.
- Zet geen merknamen van bestaande apparatuur in naam of omschrijving, en verzin geen persoon bij `author`.
- Commit of push niet, tenzij de opdracht dat vraagt.

## Documentatie en songs

Dit zijn de plaatsen waar je terechtkunt voor documentatie en voor het componeren van songs met dit apparaat. Songs zijn CC-BY-4.0, tunes en presets CC0-1.0, het apparaat AGPL-3.0-or-later.

- Handleiding van Karplus String: [NL](../../../docs/synths/USER-MANUAL_NL.md#karplus-string) · [EN](../../../docs/synths/USER-MANUAL_EN.md#karplus-string).
- Overzicht van de soort: [README](../README.md); handleiding van de hele soort: [NL](../../../docs/synths/USER-MANUAL_NL.md) · [EN](../../../docs/synths/USER-MANUAL_EN.md).
- Tunes (klanken, `kind: set`): [karplus-string-styles.patchkamer-tunes.json](../../../tunes/karplus-string-styles.patchkamer-tunes.json). Kies een tune als beginpunt voor de `state` van dit apparaat in de song; velden die de tune niet noemt krijgen hun standaard. Hoe tunes zijn opgebouwd: [tunes/AGENTS.md](../../../tunes/AGENTS.md).
- Overzicht van alle apparaten en hun signaalketens: [devices/AGENTS.md](../../../devices/AGENTS.md). Een song componeren: [songs/AGENTS.md](../../../songs/AGENTS.md).
- Route voor agents: [soort Synths](../AGENTS.md) → [devices/AGENTS.md](../../AGENTS.md) → [root AGENTS.md](../../../AGENTS.md). Contract: [NL](../../../contract/PATCHKAMER-CONTRACT_NL.md) · [EN](../../../contract/PATCHKAMER-CONTRACT_EN.md). Hoe tunes van dit apparaat zijn opgebouwd: [tunes/AGENTS.md](../../../tunes/AGENTS.md). <!-- agents-tree -->
- Rol in een song: plukkende of gestreken snaar (acht stemmen), geschikt voor melodie en arpeggio. Noten op `notes`, audio uit `out`.
