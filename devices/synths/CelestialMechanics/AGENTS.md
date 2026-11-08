# AGENTS.md: Celestial Mechanics

Dit bestand is voor AI-agents die **tunes voor Celestial Mechanics** maken. Het is niet geschreven voor mensen. Het hoort bij `../../../AGENTS.md` (algemeen) en `../../../tunes/AGENTS.md` (regels voor tunepacks); lees die eerst. Hier staat wat alleen voor Celestial Mechanics geldt.

## Wat Celestial Mechanics is

Een zwaartekrachtsynth: elke noot die binnenkomt wordt een planeet die om een zon draait, en de natuurkunde van het stelsel maakt het geluid. Een planeet is een sinus (met zelf-FM, "grain"). De toonhoogte is de noot, maar verschoven door het Dopplereffect (naar je toe draaien = hoger, weg = lager), en bij een zwart gat door gravitationele roodverschuiving (de toon zakt weg tot de planeet wordt opgeslokt). De positie in het stelsel bepaalt stereo en volume. Planeten die elkaar naderen moduleren elkaar (FM, metalige botsingsklanken); botsen ze, dan smelten ze samen met een klap. Vlak langs de zon scheert een planeet door de corona (een "zonnevlam" van gefilterde ruis op zijn toon). Een pulsar in de zon tikt op de klok van de host (de stappen van de transport) en geeft de banen een zwaartekrachtschok. Kometen vallen van buiten naar binnen. Achter de worklet zit een galm ("ether"), een echo met terugkoppeling ("echo uit de diepte") en een begrenzer.

Het is geen toetsenbordsynth in de gewone zin: er is **geen envelope, geen filter en geen vaste golfvorm**. De klank is dronerig, zwevend, metalig of gespannen, afhankelijk van hoe het stelsel is afgesteld. Een noot leeft zo lang als de instelling `life` zegt (zie hieronder) en het stelsel blijft doorbewegen.

| | |
|---|---|
| Bestand | `celestial-mechanics.patchkamer-device.js` (in deze map) |
| `id` | `nl.patchkamer.celestialmechanics`. Verander die nooit: daaraan hangen tunes en songs van gebruikers |
| Naam | `Celestial Mechanics` in alle talen; alleen de poortnamen `Out` en `Notes` hebben een Nederlandse variant (via `i18n`) |
| Soort | `instrument`: dit apparaat krijgt dus **tunes** (geen presets) |
| Poorten | eventingang `notes` (Notes), modulatie-ingang `mod`, audio-uitgang `out` (Out, stereo) |
| Contract | v1.11 |
| Licentie apparaat | AGPL-3.0-or-later |

Dit apparaat is de nieuwe, bijgewerkte vorm van een ouder bestand met een Nederlandse naam en id. Tunes of songs uit die tijd verwijzen naar de oude id en laden hier niet in. De waarden van `scale`, `life` en `preset` zijn nu Engels.

## Wat je hier doet

Je maakt klanken (tunes) voor Celestial Mechanics en zet ze als pack in `../../../tunes/`. Het apparaat zelf pas je alleen aan als de opdracht dat zegt (`version` ophogen; `id`, poort-id's en state-velden gelijk houden).

## De state

`state` van een tune is wat `getState()` teruggeeft: 18 velden, allemaal gewoon JSON. Er is geen patroon of sequencer: het apparaat speelt de noten die binnenkomen.

| Veld | Wat | Bereik | Start |
|---|---|---|---|
| `gravity` | Zwaartekracht van de zon. Hoog = snelle, krappe banen en snelle Doppler-wisselingen; laag = langzame, brede banen en rustig zwevende tonen. Logaritmisch | 0,5 … 30 | 6 |
| `orbit` | Baanmaat: hoe groot de banen zijn. Laag = planeten dicht bij de zon (meer Doppler en meer zonnevlam), hoog = ver weg (zachter) | 0,4 … 1,8 | 1 |
| `ecc` | Excentriciteit: hoe ovaal de banen zijn. Hoog = planeten scheren dichtbij de zon en vliegen ver weg (grote toonbuigingen, vlammen) | 0 … 1 | 0,3 |
| `time` | Tijd: de snelheid van het hele stelsel. Hoog = alles gaat sneller (hogere vibrato en Doppler-snelheid); laag = ijskoud langzaam. Logaritmisch | 0,05 … 4 | 1 |
| `hole` | Zwart gat in de zon. 0 = gewone zon. Omhoog: de toon zakt weg, de banen krimpen en planeten worden opgeslokt (toon valt naar beneden en het geluid verdwijnt) | 0 … 1 | 0 |
| `light` | Lichtsnelheid. Laag = de Doppler-buiging is enorm (jankende sirenes); hoog = nauwelijks Doppler. Logaritmisch | 0,6 … 40 | 6 |
| `couple` | Wisselwerking tussen planeten: zwaartekracht tussen de planeten en FM tussen hun tonen. Hoog = metalige, bellende klanken, botsingen en chaos; 0 = elke planeet los | 0 … 1 | 0,45 |
| `grain` | Korrel: zelf-FM van elke planeet. 0 = zuivere sinus, hoog = ruwer, rijker, glas tot gruis | 0 … 1 | 0,35 |
| `flare` | Zonnevlammen: hoeveel ruis een planeet meeneemt als hij langs de zon scheert, en hoe dichtbij dat gebeurt | 0 … 1 | 0,5 |
| `pulsar` | Pulsar: tikken op de klok van de host (op elke vierde stap, bij meer dan 0,66 ook op elke tweede stap) die de zwaartekracht even versterken. Werkt alleen als de transport loopt | 0 … 1 | 0 |
| `comets` | Kometen: hoe vaak er vanzelf een komeet binnenvalt (een hoge fluittoon). 0 = geen | 0 … 1 | 0 |
| `ether` | Ether: de galm (5,5 s lange, zwevende staart). Hoog = ruimte en nagalm | 0 … 1 | 0,45 |
| `echo` | Echo uit de diepte: een terugkoppelende echo (lowpass 2,6 kHz, highpass 180 Hz) met een vertraging van zes stappen van de klok | 0 … 1 | 0,25 |
| `level` | Uitgang: niveau van de planeten voor de zachte begrenzing | 0 … 1 | 0,8 |
| `scale` | Toonladder voor planeten die je met de muis in het scherm slingert en voor de Oerknal-knop. Een binnenkomende noot wordt **niet** aangepast: die speelt precies zijn eigen toonhoogte | `minorPentatonic`, `chromatic`, `wholeTone`, `lydian` of `harmonics` | `minorPentatonic` |
| `life` | Levensduur van een noot als planeet: `short` = hooguit twee seconden of zolang de noot duurt (meteoren); `long` = minstens vier seconden, ook als de noot korter is (manen); `forever` = tot het zwarte gat hem opslokt, of tot een stilte | `short`, `long` of `forever` | `long` |
| `root` | Grondtoon (MIDI-nootnummer) voor de geslingerde planeten en de Oerknal | 24 … 72 (geheel getal) | 45 |
| `preset` | Naam van het gekozen "heelal" in het keuzemenu (alleen een label) | `Solar System`, `Glass Spheres`, `Black Hole`, `Pulsar Dance`, `Comet Shower`, `Chaos Nebula`, `Space Whales` of `Custom` | `Solar System` |

Alle getallen worden bij `setState` binnen het bereik afgekapt; een tekst, `null`, `NaN` of ontbrekende waarde geeft de startwaarde. Een onbekende `scale`, `life` of `preset` geeft de startwaarde. Onbekende velden worden genegeerd. Een tune hoeft niet elk veld te zetten, maar zet ze liever allemaal zodat de klank niet afhangt van wat er daarvoor stond. Zet `preset` op `Custom` (de knoppen wijken af van een vast heelal) of op de naam waarvan je de waarden hebt overgenomen.

De zeven heelallen (`preset`) als startpunt; `{}` = alleen de startwaarden hierboven:

| Heelal | Afwijkend van de start |
|---|---|
| `Solar System` | niets |
| `Glass Spheres` | gravity 3, ecc 0,05, couple 0,15, grain 0, flare 0,2, ether 0,7, echo 0,35, light 30, scale lydian, life forever |
| `Black Hole` | gravity 9, hole 0,55, ecc 0,45, couple 0,6, grain 0,5, flare 0,8, ether 0,55, life forever, light 3 |
| `Pulsar Dance` | gravity 8, pulsar 0,75, ecc 0,5, couple 0,5, grain 0,55, flare 0,3, ether 0,3, echo 0,4, time 1,4 |
| `Comet Shower` | gravity 5, comets 0,7, couple 0,35, light 2,5, ether 0,6, echo 0,45, scale wholeTone |
| `Chaos Nebula` | gravity 14, couple 1, ecc 0,9, grain 0,85, flare 0,9, light 1,2, time 2,2, ether 0,4, scale chromatic, life forever |
| `Space Whales` | gravity 1,2, time 0,25, orbit 1,5, ecc 0,7, couple 0,8, grain 0,15, light 0,9, ether 0,85, echo 0,6, root 33, life forever |

Wat in de state hoort en wat niet: alles in de tabel hoort in een tune. Er is geen routing- of testnootveld. De noten komen van buiten (toetsenbord, sequencer, een tune-voorbeeld in de host).

Niet in `getState()` en dus niet in een tune: de planeten zelf (positie, snelheid), lopende kometen en wat er op het scherm staat.

## Hoe het apparaat reageert op noten en de transport

- Een noot (`type: 'note'`, `note`, `vel`, `dur`, `time`) maakt een planeet. De **toonhoogte is de noot**, de **sterkte volgt `vel`**. De planeet start op een baan waarvan de grootte uit de noot volgt (lage noot = ver weg, hoge noot = dicht bij de zon) maal `orbit`. Het begin van de baan (hoek) en de uitwijking zijn willekeurig maar vast gezaaid (dezelfde noten in dezelfde volgorde geven hetzelfde stelsel).
- Er kunnen maximaal 14 planeten tegelijk bestaan; een nieuwe verjaagt de oudste de ruimte in.
- Een noot-uit (`noteoff`) laat de bijbehorende planeet meteen weggaan (de planeet wordt uit het stelsel geduwd en vervaagt in een fractie van een seconde), ook bij `life: forever`. Zonder noot-uit (alleen `dur`) geldt `life`: bij `forever` blijft de planeet bestaan.
- Er is geen aanslag: een noot komt binnen met een zachte opkomst van ongeveer 0,1 s en klinkt vanaf dat moment. Gebruik geen kortere noten dan nodig voor ritme; het apparaat is geen percussiesynth.
- `onTransport` met stilstand laat bij `life` ongelijk `forever` alle planeten verdwijnen; bij `forever` blijven ze.
- Het tempo (stapduur van de host) bepaalt de echotijd (zes stappen) en de pulsar. Zonder transport doet de pulsar niets en blijft de echo op 0,375 s.
- De sturing: `cc` op een parameter-id (zoals `hole`) met waarde 0 … 1; 14 parameters zijn stuurbaar via de modulator-ingang `mod` (alle velden van `gravity` tot `level`; `level` staat standaard uit).

## Wat een goede tune is

- Het geluid hangt vooral af van **drie dingen**: `gravity` × `time` (hoe snel de banen draaien en dus hoe snel de toon zweeft), `light` (hoe diep de Doppler buigt) en `couple` met `grain` (hoe metaalachtig of glasachtig). Begin daar.
- **Pad / drone**: `life: forever`, `couple` 0,1 … 0,4, `grain` 0 … 0,4, `light` 15 … 40 (weinig Doppler), `ether` 0,6 … 0,9, `gravity` 1 … 4, `time` 0,2 … 0,7. Eén of twee lange noten volstaan; speel akkoorden met ruime intervallen.
- **Belachtig / mallet**: `couple` 0,5 … 0,9, `grain` 0,3 … 0,6, `light` 6 … 20, `life: short`, `ether` 0,4 … 0,7. De wisselwerking geeft elke noot een metalen mengtoon.
- **Sirene / sweep / impact**: `light` 0,6 … 2,5, `gravity` 8 … 20, `ecc` 0,6 … 0,9; of een zwart gat (`hole` 0,4 … 0,8) waarin de toon wegvalt. Kort `life` en veel `ether`.
- **Rommel en gruis**: `couple` hoog, `grain` hoog, `flare` hoog, `time` 2 … 4.
- **Puls**: `pulsar` 0,5 … 1, `echo` 0,3 … 0,6 en een transport die loopt; dan klopt het stelsel op de maat.
- Hou `level` rond 0,8 … 0,95 (de planeten vormen samen meestal rond RMS 0,02 … 0,15, de uitgang is begrensd). Veel gelijktijdige noten zijn harder dan een enkele; meer dan zes planeten tegelijk is zelden nodig.
- Elke tune moet muzikaal gevoelig zijn voor welke noten er komen: een lage noot (24 … 40) is bas-achtig en ver weg, een hoge noot is dicht bij de zon en rijker aan Doppler en vlam.

## Wat een tune niet doet

- Geen `hole` boven 0,9 samen met `life: short`: de planeten worden opgeslokt en je hoort bijna niets.
- Geen `time` 4 met `gravity` 30 en `ecc` 1: de banen worden chaotisch en de toon is ruis zonder toonhoogte.
- Geen `level` boven 1 of veel planeten met `couple` 1 en `grain` 1 voor een rustige klank: dat klinkt als storing.
- Geen `pulsar` > 0 als de tune zonder transport klinkt moet: het doet dan niets.
- Geen velden verzinnen buiten deze tabel. Zet er geen `grid`, `parts` of patroon in.

Het apparaat heeft een eigen bewaker in de worklet: berichten met niet-eindige getallen worden genegeerd, een planeet met een niet-eindige toestand wordt weggehaald en een niet-eindig uitgangsmonster wordt 0, zodat één foutieve waarde de galm en de echo niet voor altijd vergiftigt. Binnen het normale gebied is het geluid ongewijzigd (bit-identiek met het oude bestand voor de worklet-uitvoer).

Wat het apparaat met een state doet (getest):
- Getallen buiten het bereik worden afgekapt (`gravity: 1e9` wordt 30); een tekst, `null`, `NaN` of ontbrekende waarde geeft de startwaarde.
- Een ongeldige `scale`, `life` of `preset` geeft de startwaarde; `root` wordt afgerond.
- Onbekende velden worden genegeerd. Zet er geen in.

## Het bestaande pack

`../../../tunes/celestial-mechanics-styles.patchkamer-tunes.json` heeft 74 tunes in elf stijlen (Space, Cinematic, Sci-Fi, Ambient, Dark Ambient, Experimental, Sound Design, Synthwave, Trance, Horror, Drone). Elke tune zet alle 18 velden, met `preset: "Custom"`, en is per tune op een niveau gebracht (grootste RMS over twee seconden tussen 0,05 en 0,13, piek onder 0,5). Een tune met `pulsar` > 0 klinkt pas met een lopende transport. Het pack heeft geen sequencer-tunes: het apparaat heeft geen patroon.

## Controleren

- `node contract/validate-instrument.mjs devices/synths/CelestialMechanics/celestial-mechanics.patchkamer-device.js --lang nl` en `--lang en`, vanuit de root. Beide moeten `OK` geven, zonder `let op`.
- Je kunt niet horen hoe een tune klinkt. Render offline (stap voor stap met `OfflineAudioContext.suspend`, de worklet moet geladen zijn voor je begint) en meet piek, RMS en niet-eindige samples. Heb je geen browser, schrijf dan in je oplevering dat de tune **niet beluisterd** is.

## Wat je niet doet

- Verander nooit de `id`, de `kind`, de poort-id's of de namen van state-velden.
- Pas het apparaat niet aan om een tune te laten kloppen.
- Zet geen merknamen van bestaande apparatuur in naam of omschrijving, en verzin geen persoon bij `author`.
- Commit of push niet, tenzij de opdracht dat vraagt.

## Documentatie en songs

Dit zijn de plaatsen waar je terechtkunt voor documentatie en voor het componeren van songs met dit apparaat. Songs zijn CC-BY-4.0, tunes en presets CC0-1.0, het apparaat AGPL-3.0-or-later.

- Handleiding van Celestial Mechanics: [NL](../../../docs/synths/USER-MANUAL_NL.md#celestial-mechanics) · [EN](../../../docs/synths/USER-MANUAL_EN.md#celestial-mechanics).
- Overzicht van de soort: [README](../README.md); handleiding van de hele soort: [NL](../../../docs/synths/USER-MANUAL_NL.md) · [EN](../../../docs/synths/USER-MANUAL_EN.md).
- Tunes (klanken, `kind: set`): [celestial-mechanics-styles.patchkamer-tunes.json](../../../tunes/celestial-mechanics-styles.patchkamer-tunes.json). Kies een tune als beginpunt voor de `state` van dit apparaat in de song; velden die de tune niet noemt krijgen hun standaard. Hoe tunes zijn opgebouwd: [tunes/AGENTS.md](../../../tunes/AGENTS.md).
- Overzicht van alle apparaten en hun signaalketens: [devices/AGENTS.md](../../../devices/AGENTS.md). Een song componeren: [songs/AGENTS.md](../../../songs/AGENTS.md).
- Route voor agents: [soort Synths](../AGENTS.md) → [devices/AGENTS.md](../../AGENTS.md) → [root AGENTS.md](../../../AGENTS.md). Contract: [NL](../../../contract/PATCHKAMER-CONTRACT_NL.md) · [EN](../../../contract/PATCHKAMER-CONTRACT_EN.md). Hoe tunes van dit apparaat zijn opgebouwd: [tunes/AGENTS.md](../../../tunes/AGENTS.md). <!-- agents-tree -->
- Rol in een song: experimentele, zwaartekracht-gestuurde synth (elke noot is een planeet), voor sfeer en ambient. Noten op `notes`, audio uit `out` (stereo). De toonhoogte is de noot, maar het Dopplereffect van de baan verschuift hem; een agent kan niet luisteren, dus controleer dat in de app.
