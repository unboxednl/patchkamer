# AGENTS.md: Cinematic Synth

Dit bestand is voor AI-agents die dit apparaat configureren. Het is niet geschreven voor mensen. Het hoort bij `../../../AGENTS.md` (algemeen); lees die eerst. Hier staat wat alleen voor de Cinematic Synth geldt.

## Wat de Cinematic Synth is

Een polyfone synth voor filmische klank (braams, pads, drones, ostinati, impacts), met een pulsmotor die de klok van de studio volgt. Geen samples: alles is Web Audio met eigen nodes.

| | |
|---|---|
| Bestand | `cinematic-synth.patchkamer-device.js` (in deze map) |
| `id` | `nl.patchkamer.cinematicsynth`. Verander die nooit: daaraan hangen tunes en songs van gebruikers |
| Soort | `instrument`; krijgt dus **tunes** (`../../../tunes/cinematic-synth-scores.patchkamer-tunes.json`) en nooit presets |
| Poorten | eventingang `notes`, sturingingang `mod` (automatisch, 18 parameters), audio-uitgang `out` |
| Contract | v1.13 |
| Licentie apparaat | AGPL-3.0-or-later |

## Opbouw

- **Stem** (`noteOn`): hoofdlaag met `unison` (1 tot 5) oscillators met ontstemming en stereospreiding, tweede laag (`layerWave`, `layerOct`, `layerMix`, tot 3 oscillators), sub-sinus, ruis; laagdoorlaatfilter met aanzwelling (`envAmt` in octaven, `fAttack`, `fDecay`, `fSustain`, `keytrack`); versterkingsomhulling (`attack` tot 12 s, `release` tot 15 s) die vooraf wordt ingepland bij een noot met een duur en bij een aangehouden noot (`held`, `noteon`) pas bij `noteoff` wordt afgesloten (de waarde op dat moment is `envAt`, analytisch, zonder `cancelAndHoldAtTime`); een pitchdaling of -stijging (`bend`, `bendTime`) via een `ConstantSourceNode`. Ten hoogste 10 stemmen (`MAXV`); de oudste wordt in 30 ms afgekapt.
- **Achter de stemmen:** vervorming (`WaveShaper`, curve uit `drive`), laag- en hoogplank (`weight`, `air`), ensemble-chorus (3 gemoduleerde vertragingen), pingpongecho, galm (`ConvolverNode` met een zelf gebouwde impuls van 0,5 tot 9 s; na een wijziging van `reverbSize` of `reverbDamp` wordt de impuls 120 ms later vervangen, met een korte demping), een zachte compressor en `level`.
- **Pulsmotor:** bij `pulse` ≠ `off` gaan binnenkomende noten (en aangehouden toetsen) in een akkoordverzameling (`chord`) in plaats van te klinken; `onStep` plant de pulsen (`rate`, `gate`, `octaves`, `accent`) op de klok. Patronen: `eighths`, `sixteenths` (grondtoon), `arpUp`, `arpDown`, `arpUpDown`, `arpRandom`, `organRun`, `chordHits`. Bij Stop (`onTransport`) laat de synth alle stemmen uitklinken en wist de verzameling.
- **Sturing en CC:** `params()` meldt 18 parameters; `modulate` telt de uitslag erbij (cutoff via een gedeelde `ConstantSource` op `filter.detune`). Een `cc`-gebeurtenis met een parameter-id (of `expression`, `vibrato`) zet die parameter.

## De state

Alle velden staan in `SPEC` bovenin het bestand (type, bereik, standaard). `normalize` kapt getallen af en geeft een ongeldige waarde de standaard. Nieuwe parameters: voeg ze toe aan `SPEC` (UI, state en tunes volgen), en geef ze een label in `TXT.nl` en `TXT.en`.

## Wat getest is en wat niet

Offline renders in Chromium (`OfflineAudioContext`): 56 tunes, 30 willekeurige en extreme instellingen met sturing ±1 en ongeldige gebeurtenissen (geen niet-eindige samples, nooit stil). Het geluid is niet beluisterd, en de pulsmotor is alleen getest met onStep-aanroepen die vooraf zijn ingepland. Meet het niveau opnieuw na een wijziging aan de keten.

## Tunes

`../../../tunes/cinematic-synth-scores.patchkamer-tunes.json` (formatVersion 1, CC0-1.0, namen Engels, geen titels van films of namen van personen): 56 tunes in 7 sets. De niveaus (`level`) zijn zo gezet dat een akkoord of een slag een piek van ongeveer 0,8 geeft.

## Documentatie en songs

Hier vind je de omgeving van dit apparaat: de soort, de overzichten en de handleiding voor mensen.

- Route voor agents: [soort Synths](../AGENTS.md) → [devices/AGENTS.md](../../AGENTS.md) → [root AGENTS.md](../../../AGENTS.md). Contract: [NL](../../../contract/PATCHKAMER-CONTRACT_NL.md) · [EN](../../../contract/PATCHKAMER-CONTRACT_EN.md). Hoe tunes van dit apparaat zijn opgebouwd: [tunes/AGENTS.md](../../../tunes/AGENTS.md). <!-- agents-tree -->
- Handleiding van de soort (voor mensen): [NL](../../../docs/synths/USER-MANUAL_NL.md) · [EN](../../../docs/synths/USER-MANUAL_EN.md); overzicht: [README](../README.md).
- Een song componeren met dit apparaat: [songs/AGENTS.md](../../../songs/AGENTS.md).
