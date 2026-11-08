# AGENTS.md: Ladder Mono

Dit bestand is voor AI-agents die dit apparaat configureren. Het is niet geschreven voor mensen. Het hoort bij `../../../AGENTS.md` (algemeen); lees die eerst. Hier staat wat alleen voor Ladder Mono geldt.

## Wat Ladder Mono is

Een monofone analoge synth in de geest van klassieke analoge monosynths, met een eigen DSP-motor in een AudioWorklet. Geen modelnamen of merknamen in naam, id, labels of commentaar: houd dat zo.

| | |
|---|---|
| Bestand | `ladder-mono.patchkamer-device.js` (in deze map) |
| `id` | `nl.patchkamer.laddermono`. Verander die nooit: daaraan hangen tunes en songs van gebruikers |
| Soort | `instrument`; krijgt dus **tunes** (`../../../tunes/ladder-mono-classics.patchkamer-tunes.json`) en nooit presets |
| Poorten | eventingang `notes`, sturingingang `mod` (automatisch, 15 parameters), audio-uitgang `out` |
| Contract | v1.13 |
| Licentie apparaat | AGPL-3.0-or-later |

## De motor

De klasse `LadderEngine` staat in het bestand en gaat als tekst de worklet in (`LadderEngine.toString()` plus `registerProcessor`). Hij gebruikt dus niets buiten zichzelf; houd dat zo. De worklet heet `nl-patchkamer-laddermono-1-13-0`: verhoog het versienummer in de naam als je de motor verandert.

- **Oscillators:** drie, met polyBLEP voor zaagtand, blok en pulsen; driehoek en haaientand zijn eenvoudig. Harde sync van oscillator 2 op 1. Oscillator 3 kan los van het klavier lopen (`keys3`).
- **Mixer:** `tanh`-verzadiging met `drive`. Ruis is wit of roze.
- **Filter:** een vierpolig laddermodel van TPT-integratoren (vier eenpolige laagdoorlaten) met terugkoppeling `k = emphasis × 4`, opgelost in één stap (zonder vertraagde terugkoppeling), `tanh` op de ingang van de ladder, 2× oversampling door de ingang te middelen en de uitgang te middelen. Bij `emphasis` boven ongeveer 1 zingt het filter uit zichzelf op de cutoff; de `tanh` begrenst de amplitude.
- **Omhullingen:** twee ADSR's (filter en volume) met lineaire aanval en exponentiële verval en loslaten.
- **Monofoon:** een notenstapel met de laatste noot voorrang; bij `legato` starten de omhullingen alleen opnieuw als er geen noot werd vastgehouden. `glide` loopt exponentieel in halve tonen.
- **Bewaking:** de uitgang wordt per sample gecontroleerd; een niet-eindige of absurde waarde zet de filtertoestand terug (`resets`). Parameters en gebeurtenissen worden afgekapt of genegeerd.
- **Sturing:** `params()` meldt 15 parameters; `modulate` telt de uitslag erbij. De motor krijgt de effectieve waarden in een `params`-bericht. `level` gaat via een versterker buiten de worklet (`level × 2`).

## De state

Alle velden staan in `SPEC` bovenin het bestand. `normalize` kapt getallen af en geeft een ongeldige waarde de standaard. Nieuwe parameter: voeg hem toe aan `SPEC`, aan `params()` (de vertaling naar de motor) en aan `TXT.nl` en `TXT.en`.

## Wat getest is en wat niet

Motor in Node: filterhelling ongeveer 24 dB per octaaf bij hoge frequenties, zelfoscillatie op de cutoff, 60 willekeurige en extreme configuraties met ongeldige gebeurtenissen (geen niet-eindige samples, geen resets), en 0,07 ms per blok van 128 samples (budget 2,67 ms). In Chromium: de worklet laadt, alle tunes klinken en zijn gemeten. Het geluid is niet beluisterd.

## Tunes

`../../../tunes/ladder-mono-classics.patchkamer-tunes.json` (formatVersion 1, CC0-1.0, namen Engels, geen merk- of modelnamen): 58 tunes in 7 mappen. De niveaus (`level`) zijn zo gezet dat een noot een piek van ongeveer 0,8 geeft (een paar ruis- en pad-geluiden komen tot 0,57).

## Documentatie en songs

Hier vind je de omgeving van dit apparaat: de soort, de overzichten en de handleiding voor mensen.

- Route voor agents: [soort Synths](../AGENTS.md) → [devices/AGENTS.md](../../AGENTS.md) → [root AGENTS.md](../../../AGENTS.md). Contract: [NL](../../../contract/PATCHKAMER-CONTRACT_NL.md) · [EN](../../../contract/PATCHKAMER-CONTRACT_EN.md). Hoe tunes van dit apparaat zijn opgebouwd: [tunes/AGENTS.md](../../../tunes/AGENTS.md). <!-- agents-tree -->
- Handleiding van de soort (voor mensen): [NL](../../../docs/synths/USER-MANUAL_NL.md) · [EN](../../../docs/synths/USER-MANUAL_EN.md); overzicht: [README](../README.md).
- Een song componeren met dit apparaat: [songs/AGENTS.md](../../../songs/AGENTS.md).
