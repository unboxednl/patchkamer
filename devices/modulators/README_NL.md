# modulators

*English version: [README.md](README.md)*

Apparaten die via een paarse kabel de regelaars van andere apparaten laten bewegen. Ze maken zelf geen geluid, dus ze hebben **presets** (geen tunes).

| Apparaat | Wat het doet | Map | Handleiding |
|---|---|---|---|
| **Macro** | Vier knoppen die elk een groep regelaars tegelijk bewegen, ook over apparaten heen; de knoppen kunnen ook via een CC-eventingang bewogen worden | [`Macro/`](Macro/) | [Macro](../../docs/modulators/USER-MANUAL_NL.md#macro) |
| **LFO** | Een golf op het tempo van de klok (acht vormen, ook een envelope die op een trigger start) die regelaars van andere apparaten beweegt | [`Lfo/`](Lfo/) | [LFO](../../docs/modulators/USER-MANUAL_NL.md#lfo) |
| **Multi-Segment Envelope** | Een curve die je zelf tekent over 1 tot 64 maten, herhalend of één keer, voor opbouwen, breaks en sweeps | [`Mseg/`](Mseg/) | [Multi-Segment Envelope](../../docs/modulators/USER-MANUAL_NL.md#multi-segment-envelope) |
| **Swell** | Langzame, samenhangende beweging in vier gekoppelde banen (Adem, Warmte, Ruimte, Zweving) voor pads en ambient | [`Swell/`](Swell/) | [Swell](../../docs/modulators/USER-MANUAL_NL.md#swell) |
| **Drift** | Laat aangevinkte regelaars heel langzaam rond hun knopstand zwerven; Drifts kunnen in een groep één wind delen | [`Drift/`](Drift/) | [Drift](../../docs/modulators/USER-MANUAL_NL.md#drift) |
| **Follower** | Een envelope follower: maakt van het volume, de aanslagen en de helderheid van een geluid sturing voor andere apparaten, en stuurt bij elke aanslag een trig of een noot | [`Follower/`](Follower/) | [Follower](../../docs/modulators/USER-MANUAL_NL.md#follower) |

## Meer

- [Gebruikershandleiding voor modulators](../../docs/modulators/USER-MANUAL_NL.md): hoe een modulator werkt, elke regelaar, een voorbeeld.
- Presets (allemaal in de [map presets](../../presets/)):
  - [`macro.patchkamer-presets.json`](../../presets/macro.patchkamer-presets.json): Macro Basics, 40 presets
  - [`lfo.patchkamer-presets.json`](../../presets/lfo.patchkamer-presets.json): LFO Basics, 60 presets
  - [`mseg.patchkamer-presets.json`](../../presets/mseg.patchkamer-presets.json): Multi-Segment Envelope Presets, 54 presets
  - [`swell.patchkamer-presets.json`](../../presets/swell.patchkamer-presets.json): Swell Presets, 55 presets
  - [`drift.patchkamer-presets.json`](../../presets/drift.patchkamer-presets.json): Drift Presets, 44 presets
  - [`follower.patchkamer-presets.json`](../../presets/follower.patchkamer-presets.json): Follower Basics, 14 presets
- De basis van Patchkamer: de [basishandleiding](../../docs/USER-MANUAL_NL.md).

## Licentie

AGPL-3.0-or-later. Zie [LICENSE](../LICENSE) en [LICENSING.md](../../LICENSING.md).
