# mixer

*English version: [README.md](README.md)*

Apparaten die geluiden samenbrengen en naar buiten sturen. Ze maken zelf geen geluid, dus ze hebben **presets** (geen tunes).

| Apparaat | Wat het doet | Map | Handleiding |
|---|---|---|---|
| **Mixer** | Een mengpaneel met 1 tot 32 kanalen en 0 tot 8 groepen: trim, EQ, send en return, pan, fader, mute en solo, bundel in en uit, en een master met limiter | [`Mixer/`](Mixer/) | [Mixer](../../docs/mixer/USER-MANUAL_NL.md#mixer) |
| **Leveler** | Houdt het gemiddelde volume van een bron gelijk, met een limiter erachter | [`Leveler/`](Leveler/) | [Leveler](../../docs/mixer/USER-MANUAL_NL.md#leveler) |
| **Speakers** | De uitgang van de studio: volume, een limiter en een niveaumeter | [`Speakers/`](Speakers/) | [Speakers](../../docs/mixer/USER-MANUAL_NL.md#speakers) |
| **Audio Output** | Stuurt het geluid naar een uitgang die je kiest, zoals een audio-interface of koptelefoon: volume, mono, begrenzer, meters, kanaalpaar | [`AudioOutput/`](AudioOutput/) | [Audio Output](../../docs/mixer/USER-MANUAL_NL.md#audio-output) |
| **Audio Input** | Haalt geluid van een ingang van de computer of een audio-interface naar binnen: kanaalkeuze, mono of stereo, versterking, hoogdoorlaat, meters | [`AudioInput/`](AudioInput/) | [Audio Input](../../docs/mixer/USER-MANUAL_NL.md#audio-input) |

## Meer

- [Gebruikershandleiding voor de mixerapparaten](../../docs/mixer/USER-MANUAL_NL.md): hoe je ze aansluit, elke regelaar, voorbeelden.
- Presets: [`leveler.patchkamer-presets.json`](../../presets/leveler.patchkamer-presets.json) (11 presets) en [`audio-input.patchkamer-presets.json`](../../presets/audio-input.patchkamer-presets.json) (31 presets), [`audio-output.patchkamer-presets.json`](../../presets/audio-output.patchkamer-presets.json) (16 presets). Mixer en Speakers hebben geen presetpack. Zie ook de [map presets](../../presets/).
- De basis van Patchkamer: de [basishandleiding](../../docs/USER-MANUAL_NL.md).

## Licentie

AGPL-3.0-or-later. Zie [LICENSE](../LICENSE) en [LICENSING.md](../../LICENSING.md).
