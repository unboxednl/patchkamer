# Patchkamer

*English version: [README.md](README.md)*

**Patchkamer is een modulaire muziekstudio in je browser.** Zet apparaten op een vloer, verbind ze met kabels, druk op Start en maak muziek. Synths, sequencers, effecten en uitgangen zijn kleine insteekbestanden die een open contract volgen, zodat mensen en AI-agents nieuwe kunnen bouwen.

![Keys, Acid Baselines en Speakers verbonden in Patchkamer](docs/images/nl/03-patch.png)

## Wat je ermee kunt

- **Patchen als in een modulaire studio.** Sleep apparaten op de vloer en verbind ze met kabels: **audio**, **gebeurtenissen** (noten), **sturing** (modulatie) en **bundels** (veel kanalen in één kabel).
- **Spelen en sequencen.** Een klok met tempo en swing stuurt de apparaten aan. Speel live met het schermtoetsenbord, je computertoetsen of een MIDI-keyboard, of laat een ingebouwde stapsequencer voor je spelen.
- **Bewaar je klanken.** Leg de volledige instelling van elk apparaat vast als **tune** (apparaten die geluid maken) of **preset** (effecten, mixers enzovoort). Ordenen kan in bibliotheken en mappen, en je deelt ze als pakket.
- **Bewaar en deel je werk.** Bewaar een werkruimte als bestand of in je browser, of exporteer hem als **song** met alle apparaatcode, een titel, een maker en een licentie, zodat iedereen hem kan openen.
- **Apparaten laden van overal.** Uit een map op je computer, van GitHub of van een webadres.
- **Maak het van jou.** Nederlandse en Engelse interface (volgt je browser), donkere, lichte en retro uitstraling, een focusweergave, zoom en een instelling voor audiokwaliteit (sample rate, latency, oversampling).
- **Privé door ontwerp.** Eén HTML-bestand. Geen installatie, geen account, niets wordt geüpload.

## Snel starten

1. Haal deze repository binnen (**Code → Download ZIP**, of `git clone https://github.com/unboxednl/patchkamer`).
2. Open `patchkamer/patchkamer.html` in Chrome of Edge. Voor de soepelste start draai je `python3 -m http.server 8080` in de map van de repository en open je `http://localhost:8080/patchkamer/patchkamer.html`.
3. Typ in het bibliotheekvenster onder **Bronnen** `github.com/unboxednl/patchkamer` en klik op **Toevoegen**. Plaats **Keys / MIDI**, **Acid Baselines** en **Speakers**, verbind ze met kabels, druk op **Start** en speel.

De [gebruikershandleiding](docs/USER-MANUAL_NL.md) leidt je er stap voor stap doorheen, met screenshots.

## Apparaten

Apparaten zijn er in soorten. Elke soort heeft een eigen README in zijn map en een eigen gebruikershandleiding.

| Soort | Waar het voor dient | Apparaten | README | Handleiding |
|---|---|---|---|---|
| **Synths** | Geluid maken uit noten | Acid Baselines, Acid Stepper, Basic Mono, Bowed Ensemble, Chord Poly, Cross Mod Mono, Dissonant Cluster, Duofone, Four-Operator FM, Karplus String, Low Bass, Patch Mono, Patchbay Synth, Poly Chorus, Stage Keys, Sub Line, Supersaw Swarm, Triple Osc Poly | [devices/synths](devices/synths/README_NL.md) | [Synths](docs/synths/USER-MANUAL_NL.md) |
| **Sequencers** | Noten en akkoorden laten spelen op andere apparaten | Chord Sequencer | [devices/sequencers](devices/sequencers/README_NL.md) | [Sequencers](docs/sequencers/USER-MANUAL_NL.md) |
| **Drums** | Drumgeluiden en ritme | Drum Machine, Drum Kit, Groovebox 12, Pulse Drums, Latin Percussion, Click Synth | [devices/drums](devices/drums/README_NL.md) | [Drums](docs/drums/USER-MANUAL_NL.md) |
| **Effecten** | Het geluid vormgeven: modulatie, vervorming, ruimte, filters, ritme, stem, hele ketens | Chorus, Effect Chain, Filter, Flanger, Frequency Shifter, Grit, Phaser, Pump, Resonator, Room, Tremolo, Vocoder | [devices/effects](devices/effects/README_NL.md) | [Effecten](docs/effects/USER-MANUAL_NL.md) |
| **Mixer** | Mixen, het niveau gelijk houden, afspelen | Mixer, Leveler, Speakers | [devices/mixer](devices/mixer/README_NL.md) | [Mixer](docs/mixer/USER-MANUAL_NL.md) |
| **Modulatoren** | De regelaars van andere apparaten bewegen | Follower | [devices/modulators](devices/modulators/README_NL.md) | [Modulatoren](docs/modulators/USER-MANUAL_NL.md) |
| **Tools** | Spelen, opnemen, meten en notities maken | Keys / MIDI, Multitrack, Notes, Pad Controller, Recorder, Scope | [devices/tools](devices/tools/README_NL.md) | [Tools](docs/tools/USER-MANUAL_NL.md) |

## Kant-en-klare klanken en instellingen

| | Wat het is | README | Handleiding |
|---|---|---|---|
| **Tunes** | Complete klanken voor apparaten die geluid maken (de synths en de drumapparaten), in packs per stijl | [tunes](tunes/README_NL.md) | [Tunes](docs/tunes/USER-MANUAL_NL.md) |
| **Presets** | Beginstanden voor apparaten zonder eigen geluid: een pack voor de meeste effecten, de Follower en de Leveler. De packs van de Effect Chain zijn complete ketens van vier tot acht effecten, elk gemaakt voor één toepassing | [presets](presets/README_NL.md) | [Presets](docs/presets/USER-MANUAL_NL.md) |

## Bouw je eigen apparaten, met of zonder AI

Een apparaat is één `.patchkamer-device.js`-bestand. Het **contract** zegt precies wat een apparaat moet doen. Het is volledig en zelfstandig, in het Nederlands en het Engels, zodat een mens of een AI-agent er alleen op basis daarvan een apparaat mee kan bouwen. Een **validator** controleert het resultaat:

```
node contract/validate-instrument.mjs devices/synths/Duofone/duofone.patchkamer-device.js
```

Wijs je AI-agent naar [AGENTS.md](AGENTS.md). Daar staat wat hij moet lezen, waar hij de bestanden neerzet en wat hij moet controleren. Het huidige contract is **v1.11**. Elke versie heeft een tag (`contract/vX.Y`).

## Wat er in deze repository staat

| Map | Inhoud | Licentie |
|---|---|---|
| `patchkamer/` | De host: de studio zelf, als één HTML-pagina | AGPL-3.0-or-later |
| `contract/` | Het contract voor apparaten (Nederlands en Engels) en de validator | MIT |
| `devices/` | De meegeleverde apparaten, in een map per soort en een map per apparaat | AGPL-3.0-or-later |
| `tunes/` | Klanken voor apparaten die geluid maken | CC0-1.0 |
| `presets/` | Instellingen voor apparaten zonder eigen geluid | CC0-1.0 |
| `songs/` | Meegeleverde songs | CC-BY-4.0 |
| `docs/` | De gebruikershandleiding, de handleidingen per soort apparaat, hun screenshots en de scripts die ze maken | AGPL-3.0 (de root-licentie) |

In [LICENSING.md](LICENSING.md) staat waarom elke keuze is gemaakt.

## Documentatie

- [Gebruikershandleiding](docs/USER-MANUAL_NL.md) ([English](docs/USER-MANUAL_EN.md)): de studio, de bibliotheek, patchen, werkruimtes, instellingen en sneltoetsen
- Handleidingen per soort apparaat en voor klanken: [synths](docs/synths/USER-MANUAL_NL.md), [sequencers](docs/sequencers/USER-MANUAL_NL.md), [drums](docs/drums/USER-MANUAL_NL.md), [effecten](docs/effects/USER-MANUAL_NL.md), [mixer](docs/mixer/USER-MANUAL_NL.md), [modulatoren](docs/modulators/USER-MANUAL_NL.md), [tools](docs/tools/USER-MANUAL_NL.md), [tunes](docs/tunes/USER-MANUAL_NL.md) en [presets](docs/presets/USER-MANUAL_NL.md) (ook in het Engels: vervang `_NL` door `_EN`)
- [Contract voor apparaten](contract/PATCHKAMER-CONTRACT_NL.md) ([English](contract/PATCHKAMER-CONTRACT_EN.md))
- [AGENTS.md](AGENTS.md): instructies voor AI-agents die apparaten bouwen

## Licentie

Elke map heeft een eigen licentie, hierboven en in [LICENSING.md](LICENSING.md) vermeld. Het `LICENSE`-bestand in de root (AGPL-3.0) geldt voor alles wat niet anders is aangegeven. Copyright 2026 Freek van Gool.

Onderdeel van derden: het apparaat Recorder maakt MP3-bestanden met [lamejs](https://github.com/zhuker/lamejs) 1.2.1 (LGPL-3.0, [licentietekst](LICENSES/LGPL-3.0-only.txt)), onveranderd opgenomen als losse tekst in `devices/tools/Recorder/recorder.patchkamer-device.js`. De rest van dat bestand is AGPL-3.0-or-later. Zie [LICENSING.md](LICENSING.md).
