# AGENTS.md: Distortion

Dit bestand is voor AI-agents die dit apparaat configureren of er presets voor maken. Het is niet geschreven voor mensen. Het hoort bij `../../../AGENTS.md` (algemeen); lees die eerst. Hier staat wat alleen voor Distortion geldt.

## Wat Distortion is

Een vervormer met acht karakters, in één AudioWorklet (stereo, één gedeelde envelope voor gate en touch). Signaalweg: ingang → gate → tight (hoogdoorlaat) → tilt → drive en bias → vervorming (met 1x, 2x of 4x oversampling) → DC-blokkering (8 Hz) → tone (laagdoorlaat) → presence → niveau → mix met het droge signaal. Het droge signaal wordt met de vertraging van de oversampling gelijkgetrokken, dus parallelle verzadiging (mix onder 100%) geeft geen kamfilter.

| | |
|---|---|
| Bestand | `distortion.patchkamer-device.js` (in deze map) |
| `id` | `nl.patchkamer.distortion`. Verander die nooit: daaraan hangen presets en songs |
| Naam | `Distortion` in alle talen; alleen de poortnamen `Uit` en `Out` verschillen per taal (via `i18n`) |
| Soort | `effect`: Distortion krijgt dus **presets** (geen tunes) |
| Poorten | audio-ingang `in`, audio-uitgang `out`, sturing `mod` |
| Contract | v1.28 (`latency()` sinds 1.1.0: v1.34) |
| Licentie apparaat | AGPL-3.0-or-later |
| Controle van een pack | `node devices/effects/Distortion/check-preset.mjs presets/distortion.patchkamer-presets.json` |
| Metingen | `node docs/tools/measure-distortion.mjs` (harmonischen, aliasing, niveau, DC, stabiliteit, rekenlast) |

## De karakters (`type`)

| Waarde | Karakter | Meetbaar |
|---|---|---|
| `soft` | tanh: gladde knik, vooral oneven harmonischen | even/oneven praktisch nul bij bias 0 |
| `hard` | harde begrenzing op ±1 | de meeste hoge harmonischen |
| `tube` | asymmetrisch (positieve helft 1, negatieve helft 0,625): ook even harmonischen | H2 −22,6 dB bij 3 kHz, drive +20 dB |
| `tape` | kubieke zachte klip, plus een lage bult van +3 dB bij 110 Hz | zacht, weinig hoge harmonischen |
| `diode` | symmetrische diodeklipper (numeriek opgelost, groeit logaritmisch na de knik) | laagste aliasing van de acht |
| `fuzz` | twee trappen met een kleine interne bias: spuw, geklipt, gaat met de gate mooi dicht | H2 −54 dB, H3 −11,6 dB |
| `fold` | sinusvouwer: bij hogere drive vouwt de golf om | grondtoon kan verdwijnen; aliast het sterkst |
| `rect` | gelijkrichter (|x| met verzadiging): octaaf-omhoog | vrijwel geen grondtoon; gebruik lage drive of mix |

## De state

`state` van een preset is wat `getState()` teruggeeft (Distortion heeft geen `getPreset`).

| Veld | Wat | Bereik | Start | Eenheid |
|---|---|---|---|---|
| `type` | karakter | `soft`, `hard`, `tube`, `tape`, `diode`, `fuzz`, `fold`, `rect` | `soft` | – |
| `drive` | versterking voor de vervorming | 0 … 1 (0 tot +40 dB; `fuzz` begint 12 dB lager) | 0,4 | deel |
| `bias` | asymmetrie (gelijkspanning voor de vervorming; de statische offset wordt gecorrigeerd) | −1 … 1 | 0 | deel |
| `lowcut` | tight: hoogdoorlaat voor de vervorming (12 dB/okt.) | 20 … 1000 (onder 20,5 Hz uit) | 20 | Hz |
| `tilt` | voor-toonkleur: positief = lichter, ±9 dB (laag vs. hoog rond 1 kHz) | −1 … 1 | 0 | deel |
| `gate` | drempel van een poort voor de vervorming (0 = uit; −80 … −30 dB) | 0 … 1 | 0 | deel |
| `touch` | gevoeligheid: positief = harder spelen geeft meer drive, negatief omgekeerd (±12 dB) | −1 … 1 | 0 | deel |
| `tone` | laagdoorlaat na de vervorming (boven 19,99 kHz uit) | 500 … 20000 | 20000 | Hz |
| `presence` | hoge plank op 4 kHz, ±9 dB | −1 … 1 | 0 | deel |
| `out` | uitgangsniveau | −24 … 12 | 0 | dB |
| `mix` | droog/nat, parallelle verzadiging | 0 … 1 | 1 | deel |
| `os` | oversampling | 1, 2 of 4 | uit de hostkwaliteit (standaard 2) | – |
| `auto` | automatische niveaucorrectie: brengt een sinus van −12 dBFS na de vervorming op zijn oorspronkelijke RMS terug (begrensd op −24 … +12 dB) | boolean | `true` | – |

Wat Distortion met een state doet (getest met `check-preset.mjs`): getallen buiten het bereik worden afgekapt; tekst, `null`, `NaN` of een ontbrekende waarde geeft de startwaarde; een onbekende `type` of `os` geeft de startwaarde; onbekende velden worden genegeerd.

## Regels en vuistregels voor presets

- Een preset bevat **alle** velden. Gebruik `os: 4` voor `fuzz`, `fold` en `rect` en voor drive boven 80%; `os: 1` alleen bewust (lo-fi).
- Met `auto: true` blijft het niveau binnen enkele dB van de ingang (gemeten: −3,6 … +1,7 dB bij de meegeleverde presets, behalve waar `lowcut` of `tone` de testtoon wegfilteren). Zet `auto` uit voor een bewust luider resultaat.
- Voor bas en kick: lage `lowcut` en `mix` onder 100%. Voor drums parallel: `mix` 25 … 40%. `rect` met `mix` < 60% geeft een octaaf erbij zonder het origineel te verliezen.
- Een DC-blokkering van 8 Hz staat altijd aan; `bias` geeft dus nooit een blijvende gelijkspanning.
- Vertraging (latency) van de oversampling: 0 / 24 / 32 samples voor 1x / 2x / 4x. Het droge deel loopt mee. Sinds 1.1.0 meldt het apparaat dit met `latency()` (seconden, contract v1.34; 0 zonder worklet) en toont de host het.
- DC-blokkering: hoogdoorlaat van 8 Hz (tijdconstante 20 ms) na de vervorming en het terugbrengen naar het basistempo. In rust is de DC van de uitgang onder 1e-9 voor alle acht soorten met bias +60% (`node docs/tools/test-distortion-dc.mjs`). Bij een wissel van soort wordt de blokkering (sinds 1.1.1) meteen op de verwachte DC van de nieuwe soort gezet; de bult van de eerste 20 ms zakte bij soft naar rect van 0,72 naar 0,008. Een abrupt einde van een signaal met veel asymmetrie laat nog een uitloper van 20 ms van de blokkering horen: dat is eigen aan een DC-blokkering en niet gewijzigd.

## Bewaker (NaN en Infinity)

De ingang wordt begrensd op ±16 en NaN wordt 0. Per blok worden envelope, filters, DC-blokkering en de oversamplingfilters op eindigheid gecontroleerd; bij een ontsporing worden ze teruggezet. De uitgang wordt begrensd op ±64 (anders 0). Gemeten: 160 willekeurige en extreme instellingen en een burst van NaN, ±Infinity, ±1e9 en 1e30 geven geen enkele niet-eindige sample, en het geluid is direct daarna weer gelijk aan een run zonder burst. De worklet-naam bevat de versie (`nl-patchkamer-distortion-1-1-1`): verander je de code, verhoog dan de versie in die naam.

## Skins

Distortion gebruikt `host.ui.knob` en `host.ui.select` met `id` en `group`, maar heeft geen eigen shadow root: een skin kan hier alleen `design` gebruiken (draaiknoppen en `layout`-panelen), geen eigen CSS. De meegeleverde skin `Compact` staat in `../../../skins/library/nl.patchkamer.distortion/`. Kaart 400 x 348 tegenover 340 x 424; de skin is bewust 400 breed omdat de kaartkop (latentie-aanduiding, versiekeuze, knoppen) zo'n 380 px nodig heeft en bij 340 wordt afgekapt.

## Controleren

- `node contract/validate-instrument.mjs devices/effects/Distortion/distortion.patchkamer-device.js --lang nl` en `--lang en`, vanuit de root: beide `OK`, geen `let op`.
- Je kunt niet horen hoe een preset klinkt. Heb je geen browser, schrijf dan in je oplevering dat de preset **niet beluisterd** is.
- De teksten staan in het bestand zelf (`TXT` en `MODP`). Een nieuwe tekst krijgt altijd nl én en. Labels van maximaal 10 tekens, anders kapt de kaart ze af.

## Wat je niet doet

- Verander nooit de `id`, de `kind`, de poort-id's of de namen van state-velden.
- Pas het apparaat niet aan om een preset te laten kloppen.
- Zet geen merknamen van bestaande apparatuur in naam of omschrijving, en verzin geen persoon bij `author`.
- Commit of push niet, tenzij de opdracht dat vraagt.

## Documentatie en songs

Songs zijn CC-BY-4.0, tunes en presets CC0-1.0, het apparaat AGPL-3.0-or-later.

- Handleiding van Distortion: [NL](../../../docs/effects/USER-MANUAL_NL.md#distortion) · [EN](../../../docs/effects/USER-MANUAL_EN.md#distortion).
- Overzicht van de soort: [README](../README.md); handleiding van de hele soort: [NL](../../../docs/effects/USER-MANUAL_NL.md) · [EN](../../../docs/effects/USER-MANUAL_EN.md).
- Presets (instellingen, `kind: set`): [distortion.patchkamer-presets.json](../../../presets/distortion.patchkamer-presets.json). Kies een preset als beginpunt voor de `state` van dit apparaat in de song; velden die de preset niet noemt krijgen hun standaard.
- Overzicht van alle apparaten en hun signaalketens: [devices/AGENTS.md](../../../devices/AGENTS.md). Een song componeren: [songs/AGENTS.md](../../../songs/AGENTS.md).
- Route voor agents: [soort Effects](../AGENTS.md) → [devices/AGENTS.md](../../AGENTS.md) → [root AGENTS.md](../../../AGENTS.md). Contract: [NL](../../../contract/PATCHKAMER-CONTRACT_NL.md) · [EN](../../../contract/PATCHKAMER-CONTRACT_EN.md). Hoe presets van dit apparaat zijn opgebouwd: [presets/AGENTS.md](../../../presets/AGENTS.md). <!-- agents-tree -->
- Rol in een song: insert-effect op een instrument of bus, of op een send voor parallelle verzadiging (`mix` onder 100%). Audio in `in`, uit `out`; tien parameters zijn stuurbaar via `mod`.
