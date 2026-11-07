# Patchkamer — Instrumentcontract v1.22 voor bouwende agents

Dit document is de volledige, zelfstandige instructie om een instrument, effect, modulator of hulpapparaat te bouwen voor **Patchkamer**, een modulaire browserstudio op Web Audio. Een agent die dit document krijgt, heeft geen andere context nodig. Lever precies één bestand `naam.patchkamer-device.js` op dat aan dit contract voldoet en zonder fouten door `validate-instrument.mjs` komt.

_Dit contract staat in twee talen: `PATCHKAMER-CONTRACT_NL.md` (Nederlands, de brontekst) en `PATCHKAMER-CONTRACT_EN.md` (English). Beide hebben dezelfde versie en dezelfde inhoud; verschillen ze, dan geldt de Nederlandse tekst. De validator spreekt ook beide talen (`--lang nl|en`)._

_Deze versie is opnieuw geschreven op basis van de host-code en de bibliotheek van november 2026; ze vervangt eerdere versies van dit document. Alles uit v1.0–v1.4 blijft geldig; v1.5 t/m v1.9 zijn toevoegingen. Een apparaat dat aan een oudere versie voldoet, werkt nog steeds, maar alleen apparaten die aan v1.6 voldoen werken goed met presets, en alleen apparaten die aan v1.7 voldoen houden de studio soepel als er veel op de vloer staat. v1.8 vraagt bijna niets van een apparaat: de host maakt de regelaars beter._

| Versie | Wat erbij kwam |
|---|---|
| v1.0 | Basis: default export, poorten, klok, gebeurtenissen, state |
| v1.1–v1.3 | Kaartbreedte (`ui.width`, `ui.minWidth`) en `category` (het precieze versienummer staat niet meer vast) |
| v1.2 | Poorten die veranderen (`host.setPorts`), poorten in je eigen UI (`ui.jacks` + `host.ui.jack`) |
| v1.3 | Sturing: paarse kabels, `params()` + `modulate()`, modulatoren (`kind: 'modulator'`) met `host.modulate` |
| v1.4 | Snelle sturing (`fast: true`, `modInput`, `host.modSignal`) en AudioWorklets (`host.loadWorklet`) |
| v1.5 | Bundels: één dikke groene kabel met veel audiokanalen (`multiIn`/`multiOut`, `bundles`, `onBundle`, `host.bundleChanged`, `host.isWired`) |
| v1.6 | Presets: `setState` moet ook de knoppen bijwerken; optioneel `getPreset`/`setPreset` om routing buiten presets te houden |
| v1.7 | Soepel: tekenen via de klok van de host (`host.frame`, `host.visible`) en regels tegen haperen (§12b). Besturing voor controllers: `host.peers`, `onPeers`, `host.connect`, `host.disconnect`, `host.cablesFrom` (§13b) |
| v1.8 | Regelaars door de host: dubbelklik = beginwaarde, klik op het getal = typen, draaiknop als keuze; `host.ui.knob` krijgt een 7e argument `{ default, scale }`; `data-pk-default` / `data-pk-noreset` / `data-pk-for` voor eigen schuiven (§12a). Tekenpoort als snelle omzetting van oude tekenlussen (§12b) |
| v1.9 | Onderdelen: tunes (apparaten die geluid maken) en presets (al het andere) in bibliotheken per apparaat, met mappen en deelbare packs; songs als export van een werkruimte; een licentie (SPDX) bij elke tune, preset en song. Optioneel voor drumcomputers: instrumenten (`parts`, `getPart`, `setPart`) voor tunes per instrument (§0, §13c) |
| v1.10 | Bestandsnaam `*.patchkamer-device.js` voor apparaten (§2, §16): de host zoekt zonder manifest alleen nog naar deze bestanden, de validator waarschuwt bij een andere naam |
| v1.11 | Taal en audio: `host.lang` (`'nl'` of `'en'`) en `host.audio` (`sampleRate`, `quality`, `oversample`, `latency`) voor apparaten; optioneel `i18n` op de definitie voor namen per taal (§2, §12c). Het contract en de validator zijn tweetalig (Nederlands en Engels) |
| v1.12 | Mastering: een eigen kabelsoort (gele, gestippelde sinus) met driehoekpoorten `masteringIn`/`masteringOut`; `configureMastering` en `onMasteringTargets`; `host.mastering` voor een Master Director die de instellingen van mastering-apparaten tegelijk zet (§11b) |
| v1.13 | Multi-MIDI en regelaars: een eigen kabelsoort (dubbele gestreepte oranje kabel) met `multiEventIn`/`multiEventOut`, `eventBundles`, `onEventBundle` en `host.eventBundleChanged`; de optionele velden `ch` en `cc` op gebeurtenissen; `host.controls` en `host.setControl` om de regelaars van andere apparaten te zien en te zetten (§11c) |
| v1.14 | Nootnamen: een apparaat dat noten op namen afbeeldt (een drumcomputer) kan `noteNames()` aanbieden en `host.noteNamesChanged` aanroepen; `host.peers` geeft ze door als `noteNames`, zodat een sequencer de rijen kan benoemen (§13b) |
| v1.15 | Regelaars herkenbaar voor skins: `id`, `role` en `group` op `host.ui.knob` (in de `opties`) en `host.ui.select` (nieuw 6e argument), de attributen `data-pk-id` / `data-pk-role` / `data-pk-group`, `host.ui.adopt` voor eigen elementen en `host.ui.list` voor het register; de validator meldt een `let op` bij dubbele of ontbrekende id's en kent `--controls` (§12d). |
| v1.16 | Dekking van `params()`: elke continue regelaar hoort in `params()` (`modExclude` voor bewust uitgesloten, `on`/`drift` voor wat ongevraagd bewegen vals maakt, §8); de validator geeft een `let op` bij een regelaar die niet in `params()` staat, bij een apparaat met regelaars maar zonder `params()` en bij een param-id zonder regelaar, en `--controls` toont de kolom `in params()` |
| v1.17 | Klembord: patronen en clips kopiëren en plakken tussen apparaten. Optioneel `clipInfo()`, `getClip()`, `setClip(clip)` (alle drie of geen) en het uitwisselformaat `patchkamer-clip` (JSON, tijd in tikken); de host zet de knoppen Kopieer en Plak in de kaartbalk en vertaalt tussen apparaten; de validator controleert de drie methoden en kent `--clip` (§13d) |
| v1.18 | Meters: `host.ui.meter(parent, label, opts)` laat de host het niveau tekenen (balk, ledladder of ronde VU-meter met wijzer; lengte en breedte instelbaar door een skin), uit een of twee `AnalyserNode`s (`source`) of via `set(level)`; een meter staat in het register met rol `meter`; een apparaat zonder `host.ui.meter` op een oude host valt terug op zijn eigen tekening; het attribuut `data-pk-suffix` (tekst na het label bij MIDI-koppelen); de validator kent `host.ui.meter` en toont meters in `--controls` (§12e) |
| v1.19 | Tags voor tunes en presets: `tags` op een tune, map of pack (paden zoals `instrument/guitar/acoustic` en `style/hiphop`); de host toont ze als boom met inspringen (Tunes en Presets, Per instrument en Per stijl). Alleen de packs veranderen, apparaten niet (§13c) |
| v1.20 | Samples: samplepacks (`*.patchkamer-samples.json`, geluid als base64) met een eigen tab in de bibliotheek, en voor apparaten die audio laden de optionele methode `loadAudio(files, info)` (§13e) |
| v1.21 | Instellingen opnemen en afspelen: `host.watchParams`, `host.setParam`, `host.lockParams` en `host.paramsOf` laten een sequencer de regelaars van een ander apparaat volgen (ook wat een modulator doet), absoluut zetten en tegen modulatie vergrendelen (§13f) |
| v1.22 | Pads en schermpje: `host.ui.pad(parent, label, opts)` laat de host een drukknop tekenen (momentary of aan/uit, met `flash()` voor een raakaanduiding), `host.ui.display(parent, label, opts)` een keuzelijst die een skin als schermpje met < > en [ok] kan tonen, en `host.ui.steps` krijgt een 5e argument `{ id, group, role, color }`; eigen knoppen doen mee met `data-pk-role="pad"` of `"step"`. Pads, stappen en keuzes staan in het register (`pad`, `steps`); de validator kent de nieuwe aanroepen en meldt een kleur die geen `#rrggbb` is als fout (§12f) |

---

## 0. De onderdelen van Patchkamer

| Onderdeel | Wat het is | Bestand |
|---|---|---|
| **Patchkamer** | De studio (één HTML-pagina): apparaten plaatsen en koppelen, de klok, en het beheer van alle onderstaande onderdelen. Haar eigen instellingen (weergave, kabels, schaal) staan apart onder *Instellingen*, per computer, en zitten in geen enkel ander bestand. | `patchkamer.html` |
| **Contract** | Dit document (in twee talen) plus `validate-instrument.mjs`: hoe een apparaat eruitziet, zodat ook een AI er een kan bouwen. Hoort bij een versie van Patchkamer. | `PATCHKAMER-CONTRACT_NL.md`, `PATCHKAMER-CONTRACT_EN.md` |
| **Apparatenbibliotheek** | Apparaten in categorieën (synths, drums, effecten, mixers, sequencers, modulatie, mastering, hulpmiddelen). | `*.patchkamer-device.js`, plus `patchkamer-bibliotheek.json` voor de indeling |
| **Song** | Een export van een werkruimte: alle apparaten **met hun code**, hun instellingen en patronen, de kabels en het tempo, plus titel, maker, licentie en omschrijving. Wie hem opent, hoort hem precies zoals bedoeld en kan verder werken. (Een opname, bijv. MP3, hoort in de repository naast de song; niet in het bestand.) | `*.patchkamer-song.json` |
| **Tune** | De klank van een apparaat **dat geluid maakt** (`kind: 'instrument'`: synths, drones, drumcomputers), in een tunebibliotheek van dat apparaat. Drumcomputers kunnen ook tunes per instrument hebben. | `*.patchkamer-tunes.json` |
| **Preset** | De instelling van een apparaat **zonder eigen geluid** (`effect`, `mixer`, `output`, `utility`, `modulator`: effecten, mixers, mastering, sequencers, modulatoren, controllers), in een presetbibliotheek van dat apparaat. | `*.patchkamer-presets.json` |

Of je apparaat tunes of presets krijgt, volgt dus uit je `kind`. Werkruimte en song zijn bijna hetzelfde: de werkruimte is waar je in werkt (in je browser of als `*.patchkamer.json`), de song is de deelbare export daarvan.

---

## 1. Wat Patchkamer is

- Een webpagina (de **host**) met een **vloer** waarop apparaten als kaarten staan, verbonden met kabels.
- Zes kabelsoorten:
  - **audio** (cyaan): AudioNode → AudioNode;
  - **gebeurtenissen** (oranje): noten, trigs en CC als kleine JSON-objecten;
  - **sturing** (paars): een modulator verschuift parameters van een ander apparaat;
  - **bundel** (dik, groen): veel audiokanalen tegelijk, elk met een naam.
  - **mastering** (geel, gestippelde sinus): een Master Director zet de instellingen van mastering-apparaten (§11b).
  - **multi-MIDI** (dubbel, gestreept oranje): veel sporen met een naam in één kabel, bijvoorbeeld alle sporen van een sequencer (§11c).
- Eén gedeelde **klok** (BPM, swing). De host plant elke zestiende noot vooruit en meldt die aan elk apparaat dat dat wil weten.
- Apparaten zijn **ES-modules**. Alles wat de module nodig heeft, zit in dat ene bestand: geen imports, geen netwerk, geen externe bestanden.
- Elke kaart heeft een **presetbalk**. De host bewaart en herstelt presets met de state van het apparaat (§13).

Een apparaat beslist zelf hoe het klinkt en hoe zijn UI eruitziet. De host beslist over verbindingen, timing, opslaan, laden en presets.

---

## 2. Het bestand

Een apparaat is één ES-module met een default export, in een bestand `naam.patchkamer-device.js` (bijvoorbeeld `tremolo.patchkamer-device.js`). De inhoud is gewoon JavaScript. De dubbele extensie laat Patchkamer in een bibliotheek zonder manifest zien welke bestanden apparaten zijn en welke niet (§16); editors en Node behandelen het bestand als `.js`.

```js
export default {
  id: 'nl.jouwdomein.naam',      // uniek, reverse-DNS, kleine letters: [a-z0-9] en punten/streepjes
  name: 'Leesbare naam',         // kort; staat op de kaart en in de bibliotheek
  version: '1.0.0',              // semver x.y.z
  kind: 'effect',                // 'instrument' | 'effect' | 'mixer' | 'output' | 'utility' | 'modulator'
  category: 'effect',            // optioneel: 'synth' | 'groove' | 'sequencer' | 'mod' | 'effect' | 'mix' | 'tool' | 'mastering'
  ui: { width: 360, minWidth: 260, jacks: false },   // optioneel, zie §12
  i18n: { en: { name: 'Readable name', ports: { out: 'Out' } } },   // optioneel (v1.11): namen per taal, zie §12c
  ports: {
    audioIn:  [{ id: 'in',    name: 'In' }],
    audioOut: [{ id: 'out',   name: 'Uit' }],
    eventIn:  [{ id: 'notes', name: 'Noten' }],
    eventOut: [{ id: 'trigs', name: 'Trigs' }],
    modIn:    [],                // sturing in (zelden nodig: de host geeft automatisch 'mod', zie §8)
    modOut:   [],                // sturing uit (alleen modulatoren)
    multiIn:  [],                // bundel in (v1.5)
    multiOut: [],                // bundel uit (v1.5)
    masteringIn:  [],            // mastering in: doel van een Master Director (v1.12)
    masteringOut: [],            // mastering uit: alleen een Master Director (v1.12)
    multiEventIn:  [],           // multi-MIDI in: een ontvanger van sporen (v1.13)
    multiEventOut: [],           // multi-MIDI uit: een bron met sporen (v1.13)
  },
  create(ctx, host) { /* ... */ return instance; }
};
```

**Identiteit.** Een apparaat is uniek door `id` + `version`. Hetzelfde `id` met een andere `version` is een andere versie van hetzelfde apparaat. Beide kunnen tegelijk geladen zijn en op een kaart kun je tussen versies wisselen: de host bewaart `getState()`, maakt de nieuwe versie, roept `setState()` aan en legt de kabels opnieuw. Houd daarom poort-id's gelijk tussen versies, en laat `setState` zowel oude als nieuwe state accepteren. Nieuw gedrag betekent een nieuwe `version`; het `id` en de bestandsnaam blijven gelijk.

**`kind`** is een hint voor de bibliotheek en voor de validator, geen beperking. Alleen `kind: 'output'` mag met `ctx.destination` verbinden. Een `modulator` heeft minstens één `modOut`.

**`category`** bepaalt waar het apparaat in de bibliotheek staat. Zonder category leidt de host hem af van `kind`. `'mastering'` (v1.12) is de bibliotheekgroep voor apparaten die een mix afwerken (mastering-effecten, de Master Director, de mixcontrole en de luisteruitgang).

**`i18n`** (v1.11, optioneel) geeft de naam van het apparaat en van zijn poorten per taal: `{ en: { name: '…', ports: { in: '…' } } }`. De host past de naam toe in `host.lang` en gebruikt anders `name` en de poortnamen uit `ports`. Zie §12c.

---

## 3. Poorten

- Alle twaalf lijsten mogen leeg zijn of ontbreken. Poort-id's zijn uniek binnen hun lijst en bestaan uit `[a-z0-9_-]`.
- Elke `audioIn`-poort heeft een AudioNode in `instance.inputs`, elke `audioOut`-poort een AudioNode in `instance.outputs`, met dezelfde id.
- **Poorten die veranderen (v1.2).** `host.setPorts(this, ports)` vervangt je poortenlijst terwijl je apparaat draait, bijvoorbeeld als de gebruiker meer kanalen kiest. Zet eerst de nieuwe AudioNodes in `inputs`/`outputs` en roep dan `setPorts` aan. Kabels naar poorten die verdwijnen, haalt de host los.
- **Poorten in je eigen UI (v1.2).** Met `ui: { jacks: true }` tekent de host geen poortenrij. Je plaatst dan elke poort zelf met `host.ui.jack(this, parent, poortId, 'in' | 'out', label)`. Dat werkt voor alle zes de kabelsoorten.

---

## 4. De instance

`create(ctx, host)` krijgt de gedeelde AudioContext en de host, en geeft een object terug:

| Veld | Verplicht | Wat de host ermee doet |
|---|---|---|
| `inputs` | ja | `{ poortId: AudioNode }` voor elke `audioIn` |
| `outputs` | ja | `{ poortId: AudioNode }` voor elke `audioOut` |
| `mount(el)` | ja | Bouw je UI in dit lege element. Wordt één keer aangeroepen, ná `create`. |
| `unmount()` | nee | Stop animaties (`requestAnimationFrame`) en timers van je UI. |
| `onStep(info)` | nee | Klok: elke zestiende noot, vooruit gepland (§5). |
| `onTransport({ playing })` | nee | Start en stop van de klok. |
| `onEvent(poortId, ev)` | nee | Inkomende gebeurtenis (§6). |
| `getState()` | ja | Alles wat nodig is om het apparaat exact te herstellen, als gewone JSON. |
| `setState(s)` | ja | Zet state terug, **inclusief de knoppen in je UI** (§13). |
| `destroy()` | ja | Stop bronnen, ontkoppel nodes. Moet twee keer aangeroepen kunnen worden. |
| `params()`, `modulate(o)` | nee | Stuurbaar maken (v1.3, §8). Altijd samen. |
| `modInput(paramId)` | bij `fast` | Snelle sturing (v1.4, §9). |
| `onModTargets(t)`, `onModSources(s)` | modulator | Wie je stuurt, wie jou stuurt (§8). |
| `bundles` | bij `multiOut` | `{ poortId: () => ({ label, channels }) }` (v1.5, §11) |
| `onBundle(poortId, sleutel, bundel)` | bij `multiIn` | Bundel aangesloten, gewijzigd of los (v1.5, §11) |
| `getPreset()`, `setPreset(p)` | nee | Alleen als een preset iets niet moet bevatten (v1.6, §13). Altijd samen. |

Volgorde bij het plaatsen van een kaart: `create` → `mount` → `setState(opgeslagen)` (als er een opgeslagen state is) → kabels. Bij het laden van een werkruimte komen de kabels pas daarna, in een volgend frame.

---

## 5. Klok en timing

```js
onStep({ step, bar, time, stepDur, bpm, swing }) { ... }
```

- De host roept `onStep` aan voor **elke zestiende noot**, ruim vóór het moment zelf (vooruitkijken ongeveer 100 ms).
- `step` loopt van 0 tot 15, `bar` telt door. `time` is AudioContext-tijd; swing zit er al in verwerkt.
- Plan geluid altijd op `time`: `osc.start(time)`, `param.setValueAtTime(v, time)`. Gebruik nooit `Date.now()` of `setTimeout` voor timing.
- Lees het tempo uit `bpm` en `stepDur`. De klok is van de host. `host.setTempo(bpm)` mag alleen na een klik van de gebruiker, bijvoorbeeld bij het kiezen van een preset die een tempo voorstelt.
- Gooi geen fouten in `onStep`: die functie draait in de planner van de host.
- In `onStep` mag je ook je UI bijwerken, zoals een stapcursor.

---

## 6. Gebeurtenissen

Versturen: `host.emit(this, 'poortId', ev)`. De poort moet in `eventOut` staan. Ontvangen doe je in `onEvent(poortId, ev)`.

```js
{ type: 'note', note: 60, vel: 0.8, time, dur }    // MIDI-nootnummer, velocity 0..1, duur in seconden
{ type: 'trig', vel: 0.9, time, lane: 'kick' }     // een slag; lane zegt welke stem
{ type: 'cc', id: 'cutoff', value: 0.5, time }     // een waarde 0..1 op een naam
// Optioneel op note, trig en cc (v1.13): ch = MIDI-kanaal 1..16; op cc ook cc = controllernummer 0..127. Onbekende velden negeer je.
```

- `time` is altijd AudioContext-tijd. Plan op `time`, niet op het moment van ontvangst.
- Negeer types die je niet kent; gooi geen fout.

---

## 7. Audio

- De host verbindt jouw `outputs[x]` met de `inputs[y]` van een ander apparaat. Je verbindt nooit zelf met andere apparaten.
- Verbind nooit met `ctx.destination`, tenzij je `kind: 'output'` bent.
- Houd je uitgang rond −12 dBFS; de mixer en de uitgang doen de rest.
- Maak geen eigen AudioContext. Gebruik `ctx` uit `create`.
- Ruis: `host.ui.noise(ctx)` geeft een lussende BufferSource met witte ruis. Vervorming: `host.ui.curve(k)` geeft een WaveShaper-curve (k 0..1).

---

## 8. Sturing (v1.3)

Paarse kabels sturen parameters, geen geluid. Een modulator (LFO, MSEG, Drift…) laat de parameters van een ander apparaat rond hun knopstand bewegen.

**Bestuurbaar apparaat.** Geef `params()` en `modulate(offsets)`. De host geeft je dan automatisch een sturingsingang met id `mod`.

```js
params() {
  return [
    { id: 'cut', name: 'Cutoff', lane: 'filter', laneName: 'Filter', min: 80, max: 8000,
      role: 'filter', scale: 'log', drift: 0.10, on: true, fast: false },
  ];
},
modulate(offsets) {   // { paramId: −1..1 } — deel van het bereik, bovenop de knop
  for (const k in mod) delete mod[k];
  for (const k in offsets) if (bekend(k)) mod[k] = offsets[k];
  apply();
}
```

- `id` en `name` zijn verplicht, met `min < max`.
- `lane`/`laneName` groeperen parameters in **sporen**, bijvoorbeeld één spoor per drumgeluid.
- `scale` is `'lin'` of `'log'`. `drift` (0..1) is het voorgestelde bereik voor trage beweging. `on` zegt of de parameter standaard aan staat in een modulator.
- `role` is een vrije hint (`filter`, `pitch`, `level`, `decay`, …).
- **Effectieve waarde** = knop + modulatie:
  - lineair: `clamp(knop + o × (max − min))`;
  - logaritmisch: `clamp(knop × (max/min)^o)`.
- `modulate({})` haalt alle modulatie weg. Onbekende ids negeer je.
- Na een wijziging van je parameterlijst roep je `host.paramsChanged(this)` aan.

**Dekking: wat in `params()` hoort (v1.16).** Een modulator ziet alleen wat een apparaat in `params()` aanbiedt. Een regelaar die ontbreekt, bestaat voor Drift, LFO en MSEG niet.

- `params()` bevat **elke continue regelaar** van het apparaat (schuif, draaiknop, `<input type="range">`, `host.ui.knob`), met `id` gelijk aan de state-sleutel (en aan het `id` uit §12d). Een apparaat dat een of meer van die regelaars heeft en geen `params()`, is niet bestuurbaar.
- **Discrete regelaars** (keuzelijst, vinkje, knop) staan er niet in: continu bewegen over een keuze klikt en bouwt buffers opnieuw op. Wie er toch een wil sturen, gebruikt `host.setControl` (§11c).
- **Bewust uitgesloten regelaars** (testnoot, basisnoot, patroonlengte, aantal stemmen, stapdata, bewerkgereedschap) staan er ook niet in. Zeg dat met `modExclude: ['testNote', 'baseNote']` op de definitie (state-sleutels of id's van regelaars); `modExclude: '*'` betekent dat het apparaat bewust niets aanbiedt. Zonder die opgave kan niemand "vergeten" van "bewust niet" onderscheiden.
- **`on` en `drift` maken aanvullen veilig.** `on` zegt of een modulator de parameter uit zichzelf laat bewegen; zonder `on` staat hij uit. Zet `on: false` (en een klein `drift`, 0,05 tot 0,10; 0 = niet bewegen) bij alles waarvan ongevraagd bewegen vals of storend klinkt: toonhoogte (`pitch`, halve tonen, fijn), masterniveau, gate, octaaf, ADSR-tijden en lengtes. Zet `on: true` bij klank waar bewegen mooi is (cutoff, resonantie, mix). Een vergeten parameter toevoegen verandert dan niets hoorbaars totdat de gebruiker hem aanzet.
- Wie hoort `params()` te hebben: `instrument`, `effect` en `mixer` met continue regelaars (behalve de categorieën `sequencer` en `tool`). `utility`, `output` en `modulator` hoeven niet; een modulator mag wel zelf bestuurbaar zijn (bijvoorbeeld LFO-snelheid).
- De validator meldt hier een `let op` (nooit een fout) bij: continue regelaars die niet in `params()` staan en niet in `modExclude`, een `instrument`, `effect` of `mixer` met continue regelaars maar zonder `params()`, en een `params()`-id zonder regelaar of state-sleutel (een typefout: `modulate` negeert onbekende ids). Zie §17.

**Modulator.** Gebruik `kind: 'modulator'` en `ports.modOut: [{ id: 'mod', name: 'Mod' }]`. Je krijgt `onModTargets(targets)` met voor elk doel `{ id, name, def, version, params }`. Die aanroep komt ook met een lege lijst, en opnieuw bij elke wijziging. Stuur met `host.modulate(this, doelId, { paramId: −1..1 })`. Optioneel krijg je `onModSources(sources)`: wie er naar jou stuurt. Een modulator mag zelf ook bestuurbaar zijn.

`host.modulate` geeft ongeveer 20 tot 30 updates per seconde: goed voor trage beweging, te grof voor een LFO op 1/16. Daarvoor is §9.

---

## 9. Snelle sturing (v1.4)

Een parameter kan **snel** zijn: de modulator levert dan een audiosignaal, sample-nauwkeurig.

**Bestuurbaar apparaat.** Zet `fast: true` in `params()` en implementeer `modInput(paramId)`. Die geeft een AudioNode of AudioParam die een signaal **−1..1** ontvangt, als deel van het bereik, net als bij `modulate`. Jij rekent het om en telt het op bij de knop:

```js
const FAST = { cut: 1200 * Math.log2(8000 / 80), lvl: 1 };   // −1..1 → cents (log) of eenheden (lin)
modInput(id) {
  if (!(id in FAST)) return null;                // null voor trage of onbekende parameters
  if (fastIn[id]) return fastIn[id];
  const g = ctx.createGain(); g.gain.value = FAST[id];
  ({ cut: [filter.detune], lvl: [out.gain] })[id].forEach(p => g.connect(p));
  return (fastIn[id] = g);
}
```

Tip: voor frequenties werkt `detune` (cents) van BiquadFilter en Oscillator goed als logaritmische optelling.

**Modulator.** Probeer eerst `host.modSignal(this, doelId, paramId, node)` met je signaal (−1..1). Dat geeft `true` als het doel die parameter snel kan sturen. Geeft het `false`, val dan voor die parameter terug op `host.modulate`. Met `node = null` maak je de verbinding los.

---

## 10. AudioWorklets (v1.4)

Eigen DSP schrijf je als AudioWorklet. De code staat als tekst in je module:

```js
const WNAME = 'nl-jouwnaam-mijnfx-1';            // uniek, met versienummer
const WORKLET = `
class P extends AudioWorkletProcessor { process(inputs, outputs) { /* ... */ return true; } }
registerProcessor('${WNAME}', P);`;
host.loadWorklet(WNAME, WORKLET).then(() => {
  node = new AudioWorkletNode(ctx, WNAME, { numberOfInputs: 1, numberOfOutputs: 1, outputChannelCount: [2] });
  // in de keten zetten
}).catch(() => { /* terugval */ });
```

- `host.loadWorklet(naam, code)` laadt elke naam één keer per AudioContext en geeft een Promise.
- Wijzig je de worklet-code, verhoog dan het versienummer in de naam: een oude registratie blijft in de AudioContext bestaan.
- Laat je apparaat ook werken zonder worklet: laat het geluid ongewijzigd doorgaan en toon een korte melding in de UI. Controleer `typeof AudioWorkletNode`.
- Een worklet zonder uitgangen (`numberOfOutputs: 0`) wordt in Chrome toch verwerkt. Dat is handig voor een opnemer of meter die niets doorgeeft.
- Noten naar een worklet stuur je met `node.port.postMessage({ note, t, dur })`. In de processor plan je ze op `currentTime`.

---

## 11. Bundels (v1.5)

Een **bundel** draagt veel audiokanalen in één kabel, elk met een id en een naam. Voorbeelden uit de bibliotheek:
- de drumcomputer stuurt elk drumgeluid apart (`Losse uit`);
- de mixer neemt bundels aan (`bundel in`) en geeft al zijn kanalen na afmixen als bundel door (`kanalen uit`);
- de multitrack neemt een bundel op, een spoor per kanaal.

**Bron.** Zet `ports.multiOut: [{ id: 'los', name: 'Losse uit' }]` en geef `bundles`:

```js
bundles: {
  los: () => ({ label: 'Losse uit', channels: [
    { id: 'kick',  name: 'Kick',  node: kickBus },     // een AudioNode per kanaal; stereo mag
    { id: 'snare', name: 'Snare', node: snareBus },
  ] }),
},
```

- Gebruik een **functie**, zodat de host altijd de actuele kanalen leest.
- Kanaal-id's zijn uniek en blijven gelijk zolang het kanaal bestaat; namen mogen veranderen.
- Verandert de lijst (aantal kanalen, namen), roep dan `host.bundleChanged(this, 'los')` aan. De host stuurt de nieuwe bundel naar iedereen die aan die poort hangt.
- De nodes in een bundel blijven van jou: verbind ze niet zelf met andere apparaten en ontkoppel ze niet omdat iemand ze gebruikt.

**Ontvanger.** Zet `ports.multiIn: [{ id: 'in', name: 'Bundel' }]` en implementeer:

```js
onBundle(poortId, sleutel, bundel) { ... }
```

- `sleutel` is uniek per kabel (vorm: `"apparaatId:poortId"` van de bron) en blijft gelijk zolang de kabel er is.
- `bundel` is `{ key, source: { id, port, name }, label, channels: [{ id, name, node }] }`.
- **Dezelfde sleutel opnieuw** betekent dat de bundel is gewijzigd. Verbind dan opnieuw wat je had gekozen.
- **`bundel === null`** betekent dat de kabel los is. Ontkoppel dan alles wat je van die bundel had verbonden: `kanaal.node.disconnect(jouwIngang)`, nooit `kanaal.node.disconnect()` zonder argument, want dat haalt ook de verbindingen van anderen los.
- Bewaar je keuze in je state als `sleutel + '|' + kanaalId`, nooit de node zelf. Na het laden van een werkruimte komt dezelfde sleutel terug en vind je je keuze terug. Is de bundel er (nog) niet, laat de keuze dan staan en toon "(niet verbonden)".
- Wil je nieuwe kanalen vanzelf toewijzen, doe dat dan alleen voor kanalen die je nog niet eerder zag. Dan overschrijf je geen keuze die de gebruiker bewust leeg liet.
- `host.isWired(this, poortId, 'in' | 'out')` zegt of een eigen poort bekabeld is. De mixer gebruikt dat om een bundel niet op een kanaal te zetten waar al een gewone kabel in zit.

---

## 11b. Mastering (v1.12)

**Mastering** is een eigen kabelsoort voor één taak: een apparaat, de **Master Director**, zet de instellingen van meerdere mastering-apparaten tegelijk. Het is geen sturing (§8): er gaan geen waarden van −1 tot 1 over de kabel, maar complete instellingen, en elk doel houdt zijn eigen vergrendelingen en toestemming. Het is ook geen audio: het signaalpad verandert niet.

- **Poorten.** `ports.masteringOut` (de regie) en `ports.masteringIn` (een doel). De host tekent ze als een **driehoekje** in plaats van een rondje, en de kabel als een **gele, gestippelde sinus**. Een mastering-uitgang past alleen op een mastering-ingang. Het blijft een gewone kabel: zichtbaar, los te maken, met een eigen kleur te kiezen, en opgeslagen in de werkruimte als `kind: 'mastering'`. Er komt niets bij in `params()` of `modInput`.
- **Doel (`masteringIn`).** Een doel heeft `configureMastering(patch)`. Ontbreekt die, dan weigert de host de kabel met een melding. Optioneel zijn `analyseMastering()`, `acceptMasteringProposal()` en `getMasteringReport()`. Elke methode geeft een object terug, bijvoorbeeld `{ ok: true, changed: ['threshold'], skipped: ['ratio'] }`:
  - `configureMastering` neemt alleen bekende velden over, begrenst getallen binnen het bereik, slaat vergrendelde velden over (`skipped`) en negeert onbekende en ongeldige waarden. Heeft de gebruiker bediening van buiten uitgezet, geef dan `{ ok: false, reason: '…', changed: [], skipped: [] }` en verander niets;
  - `getMasteringReport()` geeft JSON zonder AudioNodes (de huidige instellingen, of er een voorstel is, een paar meterwaarden).
  - Een doel mag in zijn definitie `mastering: { protocol: 1, configure: true }` zetten. Dat is een aankondiging voor mensen en bibliotheek; de host kijkt naar de poort en de methoden.
- **Regie (`masteringOut`).** Een Master Director heeft `onMasteringTargets(targets)`: een lijst `{ id, name, def, version }` van de doelen aan zijn kabels. Die aanroep komt ook met een lege lijst, en opnieuw bij elke wijziging. Hij gebruikt `kind: 'modulator'`; `masteringController: 1` in de definitie is optioneel. Hij vraagt de host iets met `host.mastering(this, actie, opties)`:

| Actie | `opties` | Wat de host doet |
|---|---|---|
| `inspect` | `targetIds` (optioneel) | Roept `getMasteringReport()` aan; het resultaat staat in `results[].report` |
| `apply` | `settings`: `{ [doelId]: patch }`, `targetIds` | Roept per doel `configureMastering(settings[doelId])` aan en bewaart de oude state om terug te zetten |
| `analyse` | `targetIds` | Roept `analyseMastering()` aan |
| `accept` | `targetIds` | Roept `acceptMasteringProposal()` aan en bewaart de oude state om terug te zetten |
| `undo` | — | Zet de laatste groepswijziging terug met `setState` (de host bewaart er per regie twintig) |

  `targetIds` beperkt de actie tot doelen aan jouw kabels; ontbreekt het, dan zijn het er allemaal. De host geeft `{ changed, results: [{ id, name, ok, reason, changed, skipped, report }] }` terug, of `{ error: 'tekst' }` in de taal van de gebruiker. `changed` telt de apparaten die iets veranderden. Bij `apply` en `accept` kijkt de host alleen naar apparaten aan jouw kabels en niet naar anderen.
- **Houd je aan de gebruiker.** Verander niets bij laden, aansluiten of het herstellen van de werkruimte; alleen na een handeling van de gebruiker. Zet in `getState` van de regie alleen wat de gebruiker koos (stijl, situatie, sterkte), geen doelen en geen kabels.

---

## 11c. Multi-MIDI en regelaars van andere apparaten (v1.13)

Drie dingen voor sequencers en controllers: twee optionele velden op gebeurtenissen, een kabel die veel sporen tegelijk draagt, en een manier om de regelaars van andere apparaten te zetten.

**De velden `ch` en `cc`.** Bij `note`, `trig` en `cc` mag `ch` staan: het MIDI-kanaal, een geheel getal van 1 tot 16. Bij `cc` mag ook `cc` staan: het MIDI-controllernummer, 0 tot 127. Een MIDI-ingang zet ze zoals de hardware ze stuurt. Een sequencer zet `ch` op de gebeurtenissen van zijn multi-MIDI-poort op het kanaal van het spoor (standaard het spoornummer). Een apparaat dat de velden niet kent, negeert ze.

**De multi-MIDI-kabel.** Een dubbele, gestreepte oranje kabel die alle sporen van een bron in één keer draagt, elk met een id en een naam.

- **Poorten.** `ports.multiEventOut` (de bron) en `ports.multiEventIn` (de ontvanger). Een multi-MIDI-uitgang past alleen op een multi-MIDI-ingang.
- **Bron.** Geef `eventBundles`: per poort een functie (of een object) met de sporen. Roep `host.eventBundleChanged(this, poortId)` aan als een naam of het aantal sporen verandert.

```js
eventBundles: {
  tracks: () => ({ label: 'Mijn sequencer', tracks: [{ id: 'a', name: 'Bas', ch: 1 }, { id: 'b', name: 'Lead', ch: 2 }] }),
},
// een noot op spoor a:
host.emit(this, 'tracks', { type: 'note', note: 36, vel: 0.9, time, dur: 0.2, track: 'a', ch: 1 });
```

  Elke gebeurtenis op een multi-MIDI-poort draagt `track`: het id uit de lijst. Je mag dezelfde gebeurtenissen ook nog op je gewone `eventOut`-poorten sturen; de multi-MIDI-kabel is een extra.
- **Ontvanger.** `onEventBundle(poortId, sleutel, bundel)` krijgt `{ key, source: { id, port, name }, label, tracks: [{ id, name, ch }] }`, en `null` als de kabel losgaat. `ch` is 0 als het spoor geen kanaal heeft. De gebeurtenissen komen in `onEvent(poortId, ev)` met `track` en `bundle` (de sleutel van de bundel).

**Regelaars van andere apparaten.** Voor controllers (§13b). De host vindt alle regelaars op de kaart van een ander apparaat, ook in open shadow roots; dat apparaat hoeft er niets voor te doen.

| Aanroep | Wat |
|---|---|
| `host.controls(this, doelId)` | Een lijst `{ key, label, type, … }`: `type` is `'range'` (met `min`, `max`, `step`, `value`, `scale`), `'select'` (met `options: [{ value, text }]`), `'check'` of `'button'`. `scale` is `'log'` voor een draaiknop van `host.ui.knob` met `{ scale: 'log' }` en anders `'lin'`. |
| `host.setControl(this, doelId, sleutel, waarde)` | Zet de regelaar. `waarde` is 0..1: een schuif of knop krijgt dat deel van zijn bereik (logaritmisch als `scale` `'log'` is), een keuzelijst de optie op die plaats, een vinkje is aan vanaf 0,5 en een knop wordt vanaf 0,5 ingedrukt. Geeft `true` als de regelaar er is. |

- De `key` heeft de vorm `type|naam#n` en blijft gelijk zolang de kaart dezelfde regelaars heeft. Bewaar sleutels in je state, maar reken erop dat ze niet meer bestaan als het doelapparaat zijn UI verandert; `setControl` geeft dan `false`. Vraag `controls` opnieuw aan bij `onPeers`.
- Je kunt jezelf niet besturen. Een onbekend apparaat of een onbekende sleutel geeft `[]` of `false`.
- De gebruiker blijft de baas: de regelaar beweegt zichtbaar mee en hij kan hem gewoon zelf verdraaien.

---

## 12. UI

- `mount(el)` krijgt een leeg element in de kaart. De kaart is standaard ongeveer 300 px breed. Met `ui: { width: 200..6000, minWidth }` krijg je een bredere kaart.
- De gebruiker kan elke kaart breder, smaller, hoger en lager maken. Laat je UI dus meevloeien: auto-fit grids, `minmax(0, 1fr)`, container queries. Bij een vaste hoogte scrolt de host je UI; de poorten blijven zichtbaar.
- **Hulpmiddelen** in `host.ui`:
  - `knob(parent, label, [min, max, stap], waarde, fmt, onchange, opties?)` → `{ set(v), el, input }`; `opties` (v1.8): `{ default: getal, scale: 'log' }`; sinds v1.15 ook `{ id, role, group }` (§12d)
  - `select(parent, label, [[waarde, tekst], …], waarde, onchange)` → een `<select>`; zet `select.value = v`; sinds v1.15 een 6e argument `{ id, role, group }` (§12d)
  - `steps(parent, label, array16, onchange, opties?)` → `{ btns, paint(), cursor(stap) }`; houdt een verwijzing naar de array; sinds v1.22 een 5e argument `{ id, group, role, color }` (§12f)
  - `jack(this, parent, poortId, dir, label)` (zie §3), `noise(ctx)`, `curve(k)`
  - `adopt(el, { id, role, group, label })` en `list(this)` (v1.15, §12d)
  - `meter(parent, label, opts)` → `{ el, set(level), id, destroy() }` (v1.18, §12e)
  - `pad(parent, label, opts)` → `{ el, set(on), flash(), id, destroy() }` en `display(parent, label, opts)` → `{ el, set(v), get(), value, items(list), id, destroy() }` (v1.22, §12f)
- **Bewaar wat `knob` en `select` teruggeven.** `setState` moet die bijwerken (§13).
- Eigen HTML mag ook. Gebruik de CSS-variabelen van de host, dan volgt je apparaat de kleurstelling (donker, licht, retro):
  - kleuren: `--bg --floor --card --card-2 --line --fg --muted`;
  - kabelkleuren: `--audio --event --mod --multi`;
  - status: `--go --stop --sel`;
  - verzonken vlakken en schermen: `--well --well-fg`;
  - invoervelden: `--field --field-fg`;
  - lettertypen: `--disp --mono --lcd-font`.

  Vaste kleuren als `#0b0d10` zien er in de lichte stand verkeerd uit.
- Een grote UI hang je aan een eigen shadow root: `const d = document.createElement('div'); el.appendChild(d); d.attachShadow({ mode: 'open' })`. Stijlen en id's blijven dan per exemplaar gescheiden. CSS-variabelen werken ook in een shadow root.
- Klikken in je UI mogen de kaart niet laten slepen: zet `e.stopPropagation()` op `pointerdown` in invoervelden die je zelf bouwt.
- Gebruik geen `alert`, `confirm` of `prompt`: die blokkeren de hele studio.

---

## 12a. Regelaars (v1.8)

De host verbetert elke `<input type="range">` op je kaart, ook in een **open** shadow root. Je hoeft er niets voor te doen:

- **Dubbelklik = beginwaarde.** De beginwaarde is de waarde die de schuif heeft direct na `mount()`, vóór de host `setState()` aanroept. Bouw je UI dus in `mount()` op met de standaardwaarden uit `create()`. Bouw je een schuif pas later (een tabblad, een pagina), zet dan `data-pk-default="waarde"` op de schuif, anders kan de host hem niet terugzetten.
- **Klik op het getal = typen.** Het getal naast een schuif (een `<output>` of een element zonder kinderen, in hetzelfde kleine groepje met precies één schuif) wordt klikbaar. De host zoekt zelf de schuifstand die dat getal oplevert, dus ook bij Hz/kHz, ms/s, dB, procent en logaritmische schalen. Voorwaarde: je werkt het getal **direct** bij in je `input`-handler. Staat het getal ergens anders, zet dan `data-pk-for="id-van-de-schuif"` op het getal.
- **Draaiknop.** Kiest de gebruiker draaiknoppen, dan toont `host.ui.knob` een draaiknop (slepen omhoog/omlaag, Shift = fijn). Met `{ scale: 'log' }` draait de knop logaritmisch; met `{ default: x }` is `x` de beginwaarde. Eigen schuiven blijven schuiven.
- Heeft een schuif een eigen dubbelklik (`ondblclick`, of `dubbelklik` in de `title`), of staat er `data-pk-noreset` op, dan blijft de host eraf.
- De host stuurt gewone `input`- en `change`-events. Een `oninput`-handler die de waarde leest, is genoeg.
- Een **gesloten** shadow root (`mode: 'closed'`) kan de host niet zien. Gebruik `mode: 'open'`.

---

## 12b. Tekenen zonder haperen (v1.7)

Alles wat je UI doet, draait op dezelfde thread als MIDI, de kabels en de klok van de host. Een apparaat dat 60 keer per seconde tekent terwijl niemand kijkt, maakt live spelen haperig. Daarom:

**De tekenklok van de host.** Teken bewegende dingen (meters, scopes, cursors, animaties) via `host.frame`:

```js
// in mount()
stopTekenen = host.frame(this, t => tekenScope(t), 30);   // hooguit 30× per seconde
// in unmount() en destroy()
if (stopTekenen) { stopTekenen(); stopTekenen = null; }
```

- `host.frame(this, cb, fps)` roept `cb(t)` aan zolang je kaart **te zien is**: niet geminimaliseerd, niet buiten het zichtbare deel van de vloer, tabblad zichtbaar (of in de focusweergave). `fps` is 1–60; gebruik 30 voor meters en scopes, 60 alleen voor vloeiende animatie.
- Het geeft een functie terug die het abonnement opzegt. Roep die aan in `unmount()` en `destroy()`. De validator controleert dat er na `destroy()` niets meer openstaat.
- `host.visible(this)` zegt of je kaart nu te zien is, handig voor werk dat je buiten de tekenlus doet.
- Werk dat **altijd** moet doorgaan (geluid, meten voor een automatische functie, sturing via `host.modulate`) hoort niet in `host.frame`: dat stopt als de kaart uit beeld is.
- Terugval voor oudere hosts zonder `host.frame`: een eigen `requestAnimationFrame`-lus die `document.hidden` respecteert en hooguit `fps` keer per seconde tekent.

```js
const tekenLus = (host, inst, cb, fps) => {
  if (host && typeof host.frame === 'function') return host.frame(inst, cb, fps);
  let raf = 0, last = 0, stop = false;
  const f = t => { if (stop) return; raf = requestAnimationFrame(f); if (document.hidden || t - last < 1000 / fps - 2) return; last = t; cb(t); };
  raf = requestAnimationFrame(f); return () => { stop = true; cancelAnimationFrame(raf); };
};
```

**Geen layout-werk per frame.** Elke frame je maat opvragen of zetten dwingt de browser de hele pagina opnieuw op te meten.
- Lees de breedte van een canvas uit een `ResizeObserver`, niet elke frame uit `clientWidth`/`getBoundingClientRect()`.
- Zet `canvas.style.height` één keer, niet elke frame. Pas `canvas.width/height` alleen aan als de maat echt veranderde.
- Vraag CSS-kleuren (`getComputedStyle(...).getPropertyValue('--audio')`) hooguit één keer per seconde op, of na het venster-event `patchkamer-skin`, en bewaar ze.
- Bewaar `canvas.getContext('2d')`; vraag het niet elke frame opnieuw.

**Teken alleen wat verandert.** Een golfvorm, raster of achtergrond die zelden verandert: teken die één keer op een eigen (niet-zichtbaar) canvas en kopieer dat elke frame met `drawImage`. Werk tekst (`textContent`) alleen bij als de waarde anders is.

**Overig.**
- Geen `setInterval` korter dan 30 ms voor de UI.
- Geen `JSON.parse(JSON.stringify(...))` of `getState()` per frame.
- Stuur vanuit een worklet hooguit 30–60 berichten per seconde naar de UI.

### Bestaand apparaat bijwerken naar v1.7

1. Zoek elke `requestAnimationFrame`-lus. Haal het opnieuw-plannen uit de tekenfunctie (`raf = requestAnimationFrame(draw)` aan het eind weg) en start de tekenfunctie in `mount()` met `host.frame(this, draw, 30)` (met de terugval hierboven).
2. Zeg het abonnement op in `unmount()` en `destroy()`.
3. Vervang maat- en kleuropvragingen per frame door een `ResizeObserver` en een kleurcache.
4. Verhoog `version`. Poort-id's, `id` en state blijven gelijk, zodat werkruimtes en presets blijven werken.
5. `node validate-instrument.mjs bestand.patchkamer-device.js` geeft `OK … tekent via host.frame`. Staat er `let op: eigen requestAnimationFrame`, dan is stap 1 nog niet klaar.

**Snelle omzetting: de tekenpoort (v1.8).** Voor een groot of oud apparaat met veel losse lussen mag je ook de standaard-tekenpoort gebruiken, in plaats van elke lus om te bouwen. Zet het blok `__pkRaf` / `__pkCaf` / `__pkWrap` bovenin het bestand (zie de bibliotheek, bijvoorbeeld `lfo`), vervang `requestAnimationFrame(` door `__pkRaf(` en `cancelAnimationFrame(` door `__pkCaf(`, en schrijf de export als `const __pkDef = { … }; export default { ...__pkWrap(__pkDef) };` (de host herkent een apparaat aan `export default {`). Een lus die vanuit een methode van het apparaat start (meestal `mount`), loopt dan op volle snelheid zolang de kaart te zien is, en verborgen ongeveer 2× per seconde. Niet gebruiken voor lussen die timing of MIDI doen: die horen niet in `requestAnimationFrame`.

---

## 12c. Taal en audiokwaliteit (v1.11)

**Taal.** `host.lang` is de taal van de gebruiker: `'nl'` of `'en'` (er kunnen later talen bijkomen). Hij staat vast zolang je apparaat bestaat. Wisselt de gebruiker van taal, dan laadt de host de studio opnieuw en maakt hij je apparaat opnieuw.

- Alle tekst die de gebruiker ziet, kies je op `host.lang`: labels, keuzelijsten, meldingen, hulpteksten en tooltips. Ken je de taal niet, gebruik dan `'en'`.
- Namen die de host zelf toont (kaarttitel, bibliotheek, poortnamen) geef je per taal in het veld `i18n` van de definitie (§2). Dat veld is statisch: het wordt gelezen vóórdat `create` draait, dus gebruik het niet voor teksten in je UI.
- Vertaal **niet**: `id`, `kind`, `category`, poort-id's en de sleutels en waarden in je `state`. Namen van presets en tunes die in je `state` staan, houd je taalneutraal. Gangbare muziekvaktermen (preset, tune, sample rate, latency, oversampling, swing) laat je in alle talen Engels.
- Houd teksten per taal bij elkaar in één tabel en kies erin op `host.lang`. De validator draait je apparaat met beide waarden van `host.lang` en meldt een fout in een van de twee takken.

```js
export default {
  id: 'nl.voorbeeld.tremolo', name: 'Tremolo', version: '1.0.0', kind: 'effect',
  ports: { audioIn: [{ id: 'in', name: 'In' }], audioOut: [{ id: 'out', name: 'Uit' }], eventIn: [], eventOut: [] },
  i18n: { en: { ports: { in: 'In', out: 'Out' } } },
  create(ctx, host) {
    const T = { nl: { rate: 'Snelheid', depth: 'Diepte' }, en: { rate: 'Rate', depth: 'Depth' } }[host.lang] || { rate: 'Rate', depth: 'Depth' };
    /* … */ return { mount(el) { host.ui.knob(el, T.rate, [0.1, 20, 0.1], 4, v => v.toFixed(1) + ' Hz', v => {}); /* … */ } };
  }
};
```

**Audiokwaliteit.** `host.audio` geeft de keuze van de gebruiker. Het is alleen lezen en staat vast zolang je apparaat bestaat (de host maakt je apparaat opnieuw als de gebruiker iets wijzigt).

| Veld | Waarden | Betekenis |
|---|---|---|
| `sampleRate` | getal (Hz) | De echte samplefrequentie van de AudioContext, gelijk aan `ctx.sampleRate` |
| `quality` | `'low'`, `'normal'`, `'high'`, `'custom'` | Het gekozen kwaliteitsniveau; `'custom'` als de gebruiker losse keuzes heeft aangepast |
| `oversample` | `'none'`, `'2x'`, `'4x'` | Hoeveel oversampling je mag gebruiken waar je aliasing veroorzaakt |
| `latency` | `'interactive'`, `'balanced'`, `'playback'` | De gekozen buffergrootte van de browser (klein = lage latency, grotere buffer = stabieler) |

- Gebruik `oversample` waar je zelf aliasing veroorzaakt, bijvoorbeeld op een `WaveShaperNode` (`shaper.oversample = host.audio.oversample`) of in eigen DSP die je intern op een hogere samplefrequentie kunt laten draaien. Doe je dat niet, dan werkt je apparaat nog steeds.
- Reken niet op een vaste samplefrequentie: lees `ctx.sampleRate`.
- Verander de kwaliteit niet zelf: de gebruiker kiest die in Instellingen. Ter informatie: *Normaal* is `interactive`, automatische samplefrequentie en `'2x'` (het gedrag van vóór v1.11); *Laag* is 44,1 kHz, `playback` en `'none'`; *Hoog* is 96 kHz, `balanced` en `'4x'`.

---

## 12d. Regelaars herkenbaar maken voor skins (v1.15)

Een skin (zie `skins/`) kan het gezicht van een regelaar kiezen (draaiknop, horizontale of verticale schuif), de maat, de lengte en de kleur. Daarvoor moet de host een regelaar **vast kunnen aanwijzen**. Zonder dat raadt hij uit het label, en dat is vertaald en verandert. Alles hieronder is **optioneel en additief**: een apparaat dat niets doet, werkt zoals voorheen, en een oudere host negeert de opties en attributen.

**De drie gegevens per regelaar**

| Gegeven | Waarden | Betekenis |
|---|---|---|
| `id` | tekst, 1 tot 60 tekens uit `[A-Za-z0-9._-]` | Vast adres van de regelaar. Gelijk aan de sleutel in `getState()` of `params()` (`cut`, `kick.tune`, `ch3.vol`), **nooit het label**. Uniek binnen het apparaat. Een id verandert niet tussen versies; een nieuw id mag, verwijderen alleen met een nieuwe apparaatversie. |
| `role` | `param`, `fader`, `toggle`, `button`, `pad`, `step`, `display`, `select`, `meter`, `jack` | De bedoeling van de regelaar. Standaard: `param` bij `host.ui.knob`, `select` bij `host.ui.select`. `fader` is een lange worp (kanaalvolume), `param` een gewone instelling. |
| `group` | tekst, 1 tot 60 tekens uit `[A-Za-z0-9._-]` | Vrije sectienaam uit de logische indeling van je UI (`osc`, `filter`, `env`). Een skin kan er op mikken (`group:filter`). |

**Drie manieren om ze te geven (gelijkwaardig)**

1. Via de bestaande aanroepen: `host.ui.knob(parent, label, [min, max, stap], waarde, fmt, onchange, { id, role, group, default, scale })` (de `opties` van v1.8 krijgen drie sleutels erbij) en `host.ui.select(parent, label, opties, waarde, onchange, { id, role, group })` (nieuw 6e argument). De terugwaarde blijft `{ set, el, input }` resp. de `<select>`; bij `knob` komt er `id` bij.
2. Met attributen op je eigen elementen: `data-pk-id`, `data-pk-role`, `data-pk-group`. Geen aanroep nodig, onschadelijk voor een oudere host.
3. Met `host.ui.adopt(el, { id, role, group, label })`: zet de attributen en meldt het element aan; geeft `el` terug. Alleen voor elementen met een **model**: `input` van het type range of checkbox, `select` of `button`. Een `div` kan niet.

```js
mount(el) {
  ui.cut = host.ui.knob(el, T.cut, [0, 1, 0.001], S.cut, v => Math.round(v * 100) + '%', v => { S.cut = v; apply(); }, { id: 'cut', role: 'param', group: 'filter' });
  ui.mode = host.ui.select(el, T.mode, [['lp', 'LP'], ['hp', 'HP']], S.mode, v => { S.mode = v; apply(); }, { id: 'mode', group: 'filter' });
  host.ui.adopt(mijnSchuif, { id: 'ch1.vol', role: 'fader', group: 'ch1', label: T.vol });   // eigen <input type="range">
}
```

**Het register.** De host houdt per apparaat bij wat er is aangemeld, ook als je UI zichzelf herbouwt (een `render()` die nieuwe elementen maakt). `host.ui.list(this)` geeft het terug als `[{ id, role, group, label, type, min, max, face }]` (`type`: `'range'`, `'select'`, `'check'` of `'button'`; `face`: het gezicht dat de regelaar nu heeft). Een skinmaker ziet hetzelfde in de tabel van `validate-instrument.mjs --controls` en in het tabblad *Regelaars* van de ontwerper.

**Regels**

- Een skin kiest alleen het **gezicht**; waarde, `onchange` en `setState` lopen ongewijzigd via je element. Een skin kan geen waarde zetten en geen regelaar verbergen.
- Gebruik alleen id's die je zelf kent als state- of parametersleutel. Een id dat per `host.lang` verschilt, is een label en dus fout.
- Geef bij een apparaat dat je migreert **alle** knoppen en keuzes een id, niet een paar: een skin die een id noemt dat ontbreekt, doet stil niets.
- Een apparaat dat zijn UI herbouwt (Mixer, Control Surface) leidt id's af uit zijn indeling (`k1.2.3`, `ch3.vol`) en geeft elke regelaar zijn rol en groep, zodat een skin op rol of groep kan mikken.
- Het geluid, de state en de presets veranderen niet door id's, rollen of groepen. Verander ze niet in dezelfde actie.
- **Een vast achtervoegsel bij MIDI-koppelen (`data-pk-suffix`).** Staan veel regelaars met hetzelfde label op de kaart (`Trim` op elk kanaal van een mixer), zet dan `data-pk-suffix="T3"` (tekst, hoogstens 16 tekens) op de regelaar of op zijn omhullende element. De host zet bij het koppelen aan MIDI het achtervoegsel na het zichtbare label (`Trim - T3`). Alleen het label verandert; het `id` (de sleutel) blijft gelijk. Een oudere host negeert het attribuut.

**Wat de validator doet.** Hij geeft alleen een `let op` (nooit een fout) bij: een id dat bij twee regelaars staat (alleen wat in `create()`/`mount()` is gebouwd; een latere herbouw telt niet dubbel), een deel van de regelaars zonder id terwijl andere er wel een hebben (helemaal geen ids = niet gemigreerd, geen melding), een rol buiten de lijst, een id of groep buiten `[A-Za-z0-9._-]{1,60}`, opties die geen object zijn, `adopt` op een element zonder model of zonder element, een `data-pk-id` op een element dat nergens in de kaart hangt, en id's die van `host.lang` afhangen. Met `--controls` drukt hij daarna de tabel `id | rol | groep | label nl/en | bereik | gezicht | in params()` af (het label uit de nl- en de en-ronde; zijn ze gelijk, dan staat het één keer; de laatste kolom zegt of een continue regelaar in `params()` staat: `ja`, `nee`, `uitgesloten`, `?` voor niet te koppelen en `-` voor een keuze, vinkje of knop).

---

## 12e. Meters (v1.18)

Een meter toont een niveau: een balk met een piekstreepje, een rij ledjes of een ronde VU-meter met een wijzer. Tekent het apparaat die zelf, dan kan een skin er niets aan veranderen. Laat daarom **de host de meter tekenen**: `host.ui.meter` maakt hem en geeft hem het gezicht en de maat die de gebruiker of de skin kiest (balk, ledladder, rond VU; lengte en breedte). Een VU-gezicht **vervangt** de balk op dezelfde plek; het komt er niet naast. Een meter leest alleen: hij verandert geen geluid, geen state en geen preset, en een skin kan hem niet verbergen, alleen anders tonen. Alles hieronder is **optioneel en additief**.

| Aanroep | Wat |
|---|---|
| `host.ui.meter(parent, label, opts)` | Maakt een meter in `parent` (ook een shadow root) en geeft `{ el, set(level), id, destroy() }`. `label` is de `aria-label` en, als het apparaat het wil, een zichtbaar label |
| `set(level)` | Alleen zonder `source`: het niveau, een getal of `[l, r]`; aan te roepen vanuit je eigen tekenklok (`host.frame`). Rommel (`NaN`, geen getal) wordt genegeerd |
| `destroy()` | Haalt de meter weg en stopt het meten; mag twee keer, en moet in `destroy()`/`unmount()` van je apparaat |
| `el` | Het element van de meter (de host zet `--pk-meter-len` en `--pk-meter-wid` in px erop, zodat je CSS de plek kan afstemmen) |

| Optie | Waarden | Betekenis |
|---|---|---|
| `id` | tekst, 1 tot 60 tekens uit `[A-Za-z0-9._-]` | Vast adres voor skins (`met.master`, `met.t1`). Een meter is geen parameter: het id staat **niet** in `params()` en hoeft niet aan een state-sleutel gelijk te zijn, maar hij verandert niet tussen versies |
| `group` | tekst, zoals bij regelaars (§12d) | Sectienaam (`meters`) waarop een skin kan mikken |
| `source` | een `AnalyserNode`, of een lijst met 1 of 2 `AnalyserNode`s (links, rechts) | De host leest ze zelf (`getFloatTimeDomainData`), alleen zolang je kaart in beeld is, op de tekenklok van de host. Hij maakt of verbindt **nooit** nodes: de analyser die je al hebt, is genoeg. Zonder `source` roep je zelf `set()` aan |
| `unit` | `'linear'` (standaard) of `'db'` | Eenheid van wat je aan `set()` geeft: amplitude 0 tot 1 en hoger, of dB |
| `range` | `[minDb, maxDb]` (standaard `[-60, 0]`; de Mixer gebruikt `[-60, 6]`) | De dB-schaal van de meter |
| `kind` | `'peak'` (standaard) of `'rms'` | Wat de host uit de analyser haalt; `'rms'` alleen met `source` (over het analysevenster) |
| `hold` | `true` (standaard) of `false` | Het piekstreepje dat langzaam valt |
| `clip` | een dB-drempel | Boven de drempel brandt een clip-lampje 1,5 s. Standaard geen lampje |
| `orientation` | `'vertical'` of `'horizontal'` | De eigen keuze van je apparaat; een skin kan hem overschrijven |
| `length`, `width` | px | De standaardmaat van de meter (lengte in de uitslagrichting, breedte als dikte). De host zet ze als `--pk-meter-len` / `--pk-meter-wid` op `el` |

**Het standaardgezicht (`bar`)** is de balk van de Mixer: een verloop van `--audio` via `--go` naar `--stop`, een piekstreepje dat met 0,4 per 66 ms valt, op een achtergrond `--well`. Zonder skin ziet een gemigreerd apparaat er hetzelfde uit en meet het hetzelfde als met zijn eigen tekening: dezelfde dB-schaal, dezelfde val. Een skin kan het gezicht, de richting, de maat, de val (ballistiek: snel, klassiek VU of langzaam), het piekstreepje, het clip-lampje, de schaal en de kleur kiezen. Voor een rond VU-gezicht heeft de meter minstens 56 × 36 px nodig; de host vergroot `el` daarvoor en je layout mag meegroeien (een kanaalstrook van een mixer wordt dan breder). Bouw je layout dus zo dat een meter groter mag worden dan zijn standaardmaat.

**De demping en val doet de host.** Geef dus het ruwe niveau door (met `source` leest de host de analyser; met `set()` geef je de gemeten piek of dB). Demp of laat niets zelf vallen: dan vertraagt het signaal twee keer en kan een skin met een andere ballistiek het niet meer herstellen.

**Twee manieren om te voeden**

1. **Met een analyser (`source`).** Heeft je apparaat al een `AnalyserNode` voor zijn meter (de meeste hebben er een), geef hem dan door. Dit is de gewone weg; je hoeft niets te tekenen.
2. **Met `set()`.** Reken je het niveau zelf uit (een gain reduction, een limiter, een interne piek), roep dan `set(level)` aan vanuit je eigen tekenklok, met `host.frame` (§12b), op hoogstens 30 beelden per seconde. Er is dan geen `source`.

```js
mount(el) {
  // 1. met een analyser: de host leest hem alleen zolang de kaart te zien is
  const an = ctx.createAnalyser(); an.fftSize = 1024; out.connect(an);      // jij maakt en verbindt de analyser, de host niet
  if (host.ui && typeof host.ui.meter === 'function') {
    ui.level = host.ui.meter(el, T.level, { id: 'met.out', group: 'meters', source: an, range: [-60, 6], clip: 0, orientation: 'vertical', length: 90, width: 8 });
  } else {
    ui.oldMeter = ownMeter(el, an);          // oude host: je eigen tekening zoals vóór v1.18 (laat die code in een eigen functie staan)
  }
  // 2. met set(): je rekent het niveau zelf uit
  if (host.ui && typeof host.ui.meter === 'function') {
    ui.gr = host.ui.meter(el, T.reduction, { id: 'met.gr', group: 'meters', unit: 'db', range: [-24, 0], hold: false, orientation: 'horizontal' });
    ui.off = host.frame(this, () => ui.gr.set(reductionDb()), 30);          // reductionDb() geeft dB, 0 of lager
  }
},
destroy() { if (ui.level) ui.level.destroy(); if (ui.gr) ui.gr.destroy(); if (ui.off) ui.off(); }
```

**Verlagen naar een oudere host.** Een host zonder v1.18 heeft geen `host.ui.meter`. Controleer daarom altijd `if (!host.ui || typeof host.ui.meter !== 'function')` en teken dan zelf, zoals je voor v1.18 deed. Laat die oude tekening in een eigen functie staan; schrap haar niet. Zo werkt hetzelfde bestand op elke host.

**Het register.** Een meter staat in `host.ui.list(this)` met `role: 'meter'`, `type: 'meter'`, `min` en `max` uit `range` en `face` = het gezicht dat hij nu heeft (`bar`, `ledladder` of `vu`). `id`, `group` en `label` zijn die van de aanroep. Het attribuutpad (`data-pk-role="meter"` op een element dat je zelf tekent) wordt **niet** ondersteund: een meter heeft het gezicht van de host nodig, dus gebruik de aanroep.

**Shadow root.** `parent` mag in een shadow root hangen (een apparaat dat met `attachShadow` bouwt). De host zet zijn meter-CSS in de wortel van `parent` (`getRootNode()`), zoals hij dat voor knoppen doet; je hoeft niets te kopiëren.

**Regels**

- Maak per meter één aanroep, in `mount()` of in je eigen `render()`; roep `destroy()` van de meter aan als je hem weghaalt of herbouwt.
- Een meter is geen regelaar: geen coverage-regel, niet in `params()`, niet in `getState()`. Het geluid, de state en de presets veranderen niet door een meter.
- Maak of verbind geen nodes voor de host. De `AnalyserNode`s die je apparaat al heeft, zijn genoeg; een nieuwe analyser in het audiopad is een wijziging van je apparaat, niet van de meter.
- Een bewaker voor een kapotte analyser (stilte of `NaN` aan een uitgang) blijft van jou; de host leest alleen.

**Wat de validator doet.** De nep-host kent `host.ui.meter`. Een `source` die geen `AnalyserNode` (of lijst van 1 of 2) is, **gooit** en is dus een fout. Een `let op` (nooit een fout) komt er bij: een meter-id dat al bij een andere regelaar staat, een ongeldig id of groep, opties die geen object zijn, een ongeldige `range`, `unit`, `kind`, `hold`, `clip`, `orientation`, `length` of `width`, `kind: 'rms'` zonder `source`, een `set()` met iets anders dan een eindig getal of `[l, r]`, `data-pk-role="meter"` op een eigen element (of `host.ui.adopt` met rol `meter`) en een `data-pk-suffix` van meer dan 16 tekens. Een `host.ui.meter` zonder `source` en zonder `set()` kan hij niet zien. De OK-regel noemt het aantal meters en `--controls` toont ze in de tabel met rol `meter`.

---

## 12f. Pads en schermpje (v1.22)

Een **pad** is een drukknop die een geluid, een stap of een stand aanraakt: een drumpad, een mute-knop, een stapknop in een patroon. Een **schermpje** is een keuzelijst zoals op een fysiek apparaat: een klein scherm met de huidige keuze en de knoppen < en >, dat je kunt vergroten. Tekent het apparaat die zelf, dan kan een skin er niets aan veranderen. Laat daarom **de host ze tekenen**: `host.ui.pad` maakt een pad, `host.ui.display` een keuze, en `host.ui.steps` krijgt opties voor een rij stapknoppen. Een skin kiest dan vorm, maat, kleur, ledje en feedback van pads en het gezicht van het schermpje (vorm van de knoppen, rond of vierkant, een eigen kleur per pad, oplichten bij een raak). Een skin **verbergt geen pad en geen keuze** en zet geen waarde; hij toont ze alleen anders. Geluid, state, presets en songs veranderen niet. Alles hieronder is **optioneel en additief**.

### Pads

| Aanroep | Wat |
|---|---|
| `host.ui.pad(parent, label, opts)` | Maakt een pad in `parent` (ook een shadow root) en geeft `{ el, set(on), flash(), id, destroy() }`. `label` is de `aria-label` (en de `title` als je geen `title` opgeeft); wil je tekst op het pad, geef dan `opts.text` |
| `set(on)` | Zet de gemarkeerde (actieve) stand van het pad, zonder `onchange` of `onpress` aan te roepen. Voor `setState` en voor een stand die het apparaat zelf bepaalt |
| `flash()` | Een korte raakaanduiding (ongeveer 120 ms) zonder dat de stand verandert: een stap die afgaat, een pad dat door MIDI wordt geraakt |
| `destroy()` | Haalt het pad weg; mag twee keer, en hoort in `destroy()`/`unmount()` van je apparaat |
| `el` | Het element van het pad (een `<button>`) |

| Optie | Waarden | Betekenis |
|---|---|---|
| `id` | tekst, 1 tot 60 tekens uit `[a-z0-9._-]` | Vast adres voor skins (`pad.kick`, `perc.3`); uniek binnen het apparaat. Gelijk aan de state-sleutel waar die er is |
| `group` | tekst, zoals bij regelaars (§12d) | Sectienaam waarop een skin kan mikken (`pads`, `kick`) |
| `role` | zoals §12d | Standaard `pad`. Een pad in een rij kan `step` zijn |
| `mode` | `'momentary'` (standaard) of `'toggle'` | Momentary: actief zolang je indrukt; toggle: elke aanraking schakelt aan of uit |
| `on` | `true`/`false` | Beginstand (actief) |
| `onpress(e)` | functie | Momentary: bij indrukken. Bij toggle niet gebruikt |
| `onrelease(e)` | functie | Bij loslaten (momentary) |
| `onchange(on)` | functie | Toggle: de nieuwe stand. Bij een momentary pad zonder `onpress` mag je `onchange` gebruiken |
| `color` | `#rrggbb` | De voorkeurskleur van het apparaat voor dit pad (per spoor of klank). Een skin kan hem gebruiken (`color: "device"`) of een eigen kleur kiezen. Iets anders dan `#rrggbb` is een fout in de validator |
| `text` | korte tekst | Tekst op het pad, bijvoorbeeld "1" |
| `title` | tekst | Tooltip |

**Gedrag dat de host regelt.** Aanwijzer (muis en aanraking: `pointerdown`, `pointerup`, `pointercancel`, met pointer capture, dus een pad blijft ingedrukt tot je loslaat, ook buiten het pad) en toetsenbord (Spatie of Enter is indrukken en loslaten; bij toggle schakelt het). Een `<button>` met `role="button"`, bij toggle ook `aria-pressed`. Het standaardgezicht is een **afgerond vierkant** in neutrale kleuren uit het thema (`--panel`, `--well`, `--accent`), actief is lichter of in `color`. Gebruik zelf **geen vaste hex-kleuren**: een pad zonder skin volgt het thema, en met een skin zijn ze van de skin.

```js
mount(el) {
  const hasPad = host.ui && typeof host.ui.pad === 'function';
  if (hasPad) {
    // momentary: een drumpad dat een noot speelt zolang je indrukt
    ui.kick = host.ui.pad(el, T.kick, { id: 'pad.kick', group: 'pads', color: '#ff5a4f', text: '1', onpress: () => trigger('kick'), onrelease: () => {} });
    // toggle: een mute-knop die in de state staat
    ui.mute = host.ui.pad(el, T.mute, { id: 'mute', group: 'pads', mode: 'toggle', on: S.mute, onchange: on => { S.mute = on; apply(); } });
  } else {
    ui.kick = ownPad(el, T.kick);               // oude host: je eigen <button> zoals vóór v1.22 (laat die code in een eigen functie staan)
    ui.mute = ownToggle(el, T.mute);
  }
},
setState(s) { /* … */ if (ui.mute.set) ui.mute.set(!!S.mute); },    // set() roept onchange niet aan
onStep(t, step) { if (hit(step)) ui.kick.flash && ui.kick.flash(); },  // flash() = raakaanduiding, de stand verandert niet
destroy() { if (ui.kick && ui.kick.destroy) ui.kick.destroy(); if (ui.mute && ui.mute.destroy) ui.mute.destroy(); }
```

### Stappen met opties

`host.ui.steps(parent, label, array, onchange, opts?)` krijgt een optioneel **5e argument** `{ id, group, role, color }`. De stapknoppen (`.st`) krijgen `data-pk-role="step"` en het `id` van de rij (`pat.kick`), `group` en `color`; ze volgen dezelfde skinregels als pads (vorm, maat, kleur, ledje) maar **houden hun gedrag en klassen** (`on`, `q`, `cur`). De terugwaarde blijft `{ btns, paint, cursor }`, plus `id`. Zonder 5e argument gebeurt er niets.

```js
S.kick.steps = host.ui.steps(el, T.kick, S.pat.kick, v => { S.pat.kick = v; }, { id: 'pat.kick', group: 'kick', role: 'step', color: '#ff5a4f' });
```

### Eigen pad-knoppen (attributen)

Heeft je apparaat zijn eigen `<button>`s voor pads (een groot raster dat je niet wilt herbouwen), zet dan `data-pk-role="pad"` (of `"step"`), `data-pk-id` en eventueel `data-pk-group` op die knoppen of roep `host.ui.adopt(button, { id, role: 'pad', group })` aan. De host zet alleen CSS-klassen en variabelen op dat element voor **vorm, kleur, ledje en maat**; je DOM, je handlers en je `.on`/`.cur`-klassen blijven van jou. De kleur komt dan van het thema of, met `color: "palette"` of `colors`, van de skin; een voorkeurskleur van het apparaat kan alleen via `host.ui.pad` of `host.ui.steps`. Dit werkt ook als je UI zichzelf herbouwt. Wil je ook een eigen kleur per knop, zet dan `data-pk-color="#rrggbb"` op de knop (de apparaatkleur voor `pads.color: device`).

### Schermpje

| Aanroep | Wat |
|---|---|
| `host.ui.display(parent, label, opts)` | Maakt een keuze in `parent` en geeft `{ el, set(v), get(), value, items(list), id, destroy() }`. Het **model** is een verborgen `<select>` (`el.select`, ook `el.querySelector('select')`) |
| `set(v)`, `get()`, `value` | De huidige waarde; `value` is een getter en setter. Zetten roept `onchange` niet aan |
| `items(list)` | Vervangt de lijst `[[waarde, tekst], …]` |
| `destroy()` | Haalt de keuze weg; mag twee keer |

| Optie | Waarden | Betekenis |
|---|---|---|
| `id`, `group`, `role` | zoals §12d | De rol is standaard `select` |
| `items` | `[[waarde, tekst], …]` | De keuzes |
| `value` | een waarde uit `items` | De beginwaarde |
| `onchange(v)` | functie | Bij een nieuwe keuze |
| `kind` | `'select'` (standaard) of `'preset'` | Alleen voor de host-kaartkop; een apparaat gebruikt `select` |
| `wrap` | `true`/`false` (standaard `false`) | Of < en > rond lopen aan het begin en einde |
| `searchAt` | geheel getal ≥ 1 (standaard 12) | Vanaf zoveel keuzes toont het vergrote paneel een zoekveld |

**Het standaardgezicht is de gewone keuzelijst** (een label en een `<select>`, zoals `host.ui.select`), dus een gemigreerd apparaat ziet er zonder skin gelijk uit. Het schermpje (LCD, OLED, zevensegment of papier, met < > en [ok], en een groter paneel als je erop klikt) komt alleen van de **skin**. Omdat het model het `<select>` blijft, werken `setState` (`select.value = v`), `host.controls` en `host.ui.list` ongewijzigd. `host.ui.select` (bestaand) kan door een skin óók het schermpje-gezicht krijgen; `host.ui.display` is er vooral voor apparaten die uit zichzelf een lijst `[waarde, tekst]` hebben. Houd het eenvoudig: bewaar wat de aanroep teruggeeft en zet de waarde in `setState`.

```js
if (host.ui && typeof host.ui.display === 'function') {
  ui.kit = host.ui.display(el, T.kit, { id: 'kit', group: 'sound', items: KITS.map(k => [k.id, k.name]), value: S.kit, wrap: true, onchange: v => { S.kit = v; load(); } });
} else {
  ui.kit = host.ui.select(el, T.kit, KITS.map(k => [k.id, k.name]), S.kit, v => { S.kit = v; load(); });   // oude host
}
setState(s) { /* … */ if (ui.kit.set) ui.kit.set(S.kit); else ui.kit.value = S.kit; }
```

### Verlagen naar een oudere host

Een host zonder v1.22 heeft geen `host.ui.pad` of `host.ui.display`, en negeert het 5e argument van `host.ui.steps`. Controleer daarom `if (!host.ui || typeof host.ui.pad !== 'function')` en bouw dan zelf een `<button>`, zoals je voor v1.22 deed; voor een keuze `if (!host.ui || typeof host.ui.display !== 'function')` → `host.ui.select`. Laat die oude code in een eigen functie staan; schrap haar niet.

### Het register

`host.ui.list(this)` geeft een pad terug met `role: 'pad'`, `type: 'pad'` en `face` = de huidige vorm (`circle`, `square`, `rounded` of `rect`); een rij stappen als één regel met `role: 'step'` en `type: 'steps'` (met het `id` van de rij); een schermpje als `type: 'select'`, `role: 'select'` en `face` = `dropdown`, `lcd`, `oled`, `segment` of `paper`. Eigen knoppen met `data-pk-role="pad"` verschijnen met rol `pad` (of `step`).

### Regels

- Maak per pad één aanroep, in `mount()` of in je eigen `render()`, en roep `destroy()` aan als je hem weghaalt of herbouwt.
- Een pad of schermpje is een **regelaar met een id**: geef alle pads een id en groep als je er één geeft. Een pad hoort niet in `params()` (het is geen instelling); wel hoort wat het schakelt in `getState()`.
- Het geluid, de state en de presets veranderen niet door een pad of schermpje. `set(on)` en `flash()` roepen `onchange` en `onpress` **niet** aan.
- Kleuren zijn altijd `#rrggbb`. De host past niets anders toe.
- Zet de klassen `on`/`cur`/`q` van eigen knoppen zelf; de host raakt ze niet aan.

**Wat de validator doet.** De nep-host kent `host.ui.pad`, `host.ui.display` en de opties van `host.ui.steps`. Een `color` die geen `#rrggbb` is (bij een pad of bij `steps`) **gooit** en is dus een fout. Een `let op` (nooit een fout) komt er bij: een pad-id dat al bij een andere regelaar staat, een ongeldig id of groep, opties die geen object zijn, een ongeldige `mode`, `on`, `onpress`, `onrelease`, `onchange`, `text` of `title`, een momentary pad zonder `onpress` en zonder `onchange`, een display met ongeldige `items`, `kind`, `wrap` of `searchAt` of een `value` die niet in `items` staat, en een 5e argument van `steps` dat geen object is. Een display telt mee bij de controle dat `setState` de keuzes bijwerkt. De OK-regel noemt het aantal pads en schermpjes en `--controls` toont ze in de tabel met rol `pad`, `step` en `select`.

---

## 13. State, versies en presets (v1.6)

**State.** `getState()` geeft alles terug wat nodig is om het geluid en het gedrag exact te herstellen: knoppen, patronen en keuzes. Het resultaat moet gewone JSON zijn, zonder AudioNodes.
- `setState(s)` krijgt dat later terug: bij laden, bij een versiewissel en bij een preset.
- Onbekende velden negeer je; ontbrekende velden krijgen een standaardwaarde. `setState({})` moet werken.
- `setState(getState())` moet exact dezelfde state opleveren.

**De knoppen volgen.** De host gebruikt `setState` ook voor presets, terwijl je UI al op het scherm staat. Werk daarom in `setState` het geluid én je UI bij:

```js
setState(s) {
  /* ... state normaliseren ... */
  apply();                                   // geluid
  ui.rate.set(S.rate);                       // knoppen van host.ui.knob
  ui.shape.value = S.shape;                  // keuzes van host.ui.select
  rows.kick.paint();                         // stappen van host.ui.steps (array in place vervangen!)
}
```

- De validator controleert dit voor alles wat je met `host.ui.knob` en `host.ui.select` maakt: na `setState(getState())` moet elk ervan bijgewerkt zijn. Een volledige herbouw van je UI in `setState` telt ook.
- Bij `host.ui.steps`: vervang de inhoud van de array met `splice`, niet de array zelf. De stappenrij houdt een verwijzing naar de oorspronkelijke array.

**`getPreset` / `setPreset`.** Hoort iets in je state níet in een preset, implementeer dan beide:
- `getPreset()` geeft een kopie van je state zonder die velden;
- `setPreset(p)` zet alleen de andere velden terug en laat de rest staan.

Gebruik het voor:
- **routing en bronkeuzes**: welk bundelkanaal op welk kanaal staat (mixer, multitrack);
- **lopende posities**: waar een trage beweging nu is (Drift · modulator bewaart zijn klokpositie niet in een preset);
- **gegevens van deze sessie**: opnames, namen van takes.

Zonder deze twee functies gebruikt de host `getState`/`setState`. Ook `setPreset(getPreset())` moet dezelfde preset opleveren, en `setPreset({})` mag niet gooien.

**Presetbestanden.** De host bewaart presets in presetbibliotheken. Je kunt die exporteren als `.patchkamer-presets.json`:

```json
{ "format": "patchkamer-presets", "formatVersion": 1, "name": "Startpresets",
  "presets": [ { "name": "Acid-bas", "device": "nl.patchkamer.mono", "version": "1.2.0", "state": { "cut": 320, "res": 16 } } ] }
```

`state` is precies wat `getPreset()` (of anders `getState()`) teruggeeft. Een preset van een oudere versie gaat gewoon naar je huidige `setState`/`setPreset`. Nog een reden om oude state te accepteren.

---

## 13b. Besturing: andere apparaten zien en kabels leggen (v1.7)

Voor controllers (zoals een MIDI-apparaat dat pads aan apparaten koppelt). Gewone instrumenten en effecten hebben dit niet nodig.

| Aanroep | Wat |
|---|---|
| `host.peers(this)` | Lijst van de andere apparaten op de vloer: `{ id, name, def, version, kind, category, eventIn:[{id,name}], mod, selected, noteNames:[{note,name}] }`. Alleen lezen. `mod` = heeft een Mod-ingang; `selected` = laatst aangeklikt. |
| `onPeers(lijst)` | Optioneel op je instance: de host roept dit aan als apparaten bijkomen, verdwijnen, geselecteerd worden of als kabels veranderen. |
| `host.connect(this, eigenUitgang, doelId, doelIngang, soort)` | Legt een gewone, zichtbare kabel van **je eigen** uitgang naar een ingang van een ander apparaat. `soort` = `'event'`, `'mod'` of `'audio'`. Geeft `true` als de kabel er ligt. |
| `host.disconnect(this, eigenUitgang?, doelId?, doelIngang?)` | Haalt kabels weg die **vanaf jouw** uitgangen vertrekken (filters zijn optioneel). Geeft het aantal. |
| `host.cablesFrom(this, eigenUitgang?)` | De kabels vanaf jouw uitgangen: `[{ port, to, toPort, kind }]`. Gebruik dit om te zien of de gebruiker een kabel heeft losgehaald. |

- Je kunt alleen vanaf je eigen uitgangen kabels leggen of weghalen; de host weigert de rest.
- De gebruiker blijft de baas: hij kan elke kabel zelf losmaken. Toon dat in je UI ("kabel los") in plaats van hem stilletjes opnieuw te leggen.
- Bewaar in je state **naar welk apparaat-id** je koppelde. De kabels zelf bewaart de werkruimte; leg ze bij het laden niet opnieuw.
- Geef `onPeers` geen zwaar werk: hij kan een paar keer per seconde komen.

**Nootnamen (v1.14).** Een apparaat waarvan de noten een naam hebben (een drumcomputer: 36 = bas drum, 38 = snare, enz.) kan dat laten zien aan sequencers.

| Aanroep | Wat |
|---|---|
| `noteNames()` | Optioneel op je instance. Geeft een lijst `[{ note: 0..127, name: 'Snare' }]` in de volgorde waarin je apparaat de klanken toont. Hoogstens 128 items, `name` hoogstens 40 tekens; ongeldige items slaat de host over. Geef alleen de klanken die op dit moment een noot hebben |
| `host.noteNamesChanged(this)` | Roep dit aan als de lijst verandert (andere kit, andere volgorde, andere noot, tune geladen). De host meldt het via `onPeers` aan de andere apparaten |
| `host.ui.knob(…, { id, role, group })`, `host.ui.select(…, { id, role, group })` | v1.15 | Regelaar herkenbaar maken voor skins (§12d) |
| `host.ui.adopt(el, { id, role, group, label })` | v1.15 | Eigen element aanmelden als regelaar; geeft `el` terug (§12d) |
| `host.ui.list(this)` | v1.15 | Het register: `[{ id, role, group, label, type, min, max, face }]` (§12d) |
| `data-pk-id`, `data-pk-role`, `data-pk-group` | v1.15 | Dezelfde gegevens als attributen op eigen elementen (§12d) |
| `host.ui.meter(parent, label, opts)` | v1.18 | Een meter laten tekenen door de host (balk, ledladder of rond VU, door een skin te kiezen); geeft `{ el, set, id, destroy }` (§12e) |
| `data-pk-suffix` | v1.18 | Tekst (hoogstens 16 tekens) die de host bij het koppelen aan MIDI na het label zet: ` - suffix` (§12d) |
| `host.ui.pad(parent, label, opts)` | v1.22 | Een pad laten tekenen door de host (momentary of toggle, `flash()`, kleur); geeft `{ el, set, flash, id, destroy }` (§12f) |
| `host.ui.display(parent, label, opts)` | v1.22 | Een keuze die een skin als schermpje kan tonen; het model is een verborgen `<select>`; geeft `{ el, set, get, value, items, id, destroy }` (§12f) |
| `host.ui.steps(…, opts)` | v1.22 | 5e argument `{ id, group, role, color }` voor een rij stapknoppen (§12f) |
| `data-pk-role="pad"` / `"step"` | v1.22 | Eigen knoppen doen mee met vorm, kleur, ledje en maat (§12f) |
| `peers[].noteNames` | In de lijst van `host.peers(this)`: de gezuiverde lijst van dat apparaat, of `[]` als het er geen heeft |

- Een sequencer of controller vindt het doel met `host.cablesFrom(this, eigenUitgang)` en zoekt het `id` op in `host.peers(this)`. Zonder kabel of zonder lijst gedraagt hij zich zoals altijd.
- `noteNames()` mag niet gooien en moet licht zijn: de host roept hem aan bij elke `peers`-aanvraag. Roep `host.noteNamesChanged` alleen aan als de lijst echt anders is (vergelijk met de vorige).

**MIDI en timing.** Gebruik je Web MIDI (alleen na een klik, zonder sysex), plan noten dan niet op "nu" maar via de tijdstempel van het bericht. Dan krijgt elke aanslag dezelfde kleine vertraging, ook als de pagina even druk is:

```js
const o = ctx.getOutputTimestamp();   // { contextTime, performanceTime }
const t = Math.max(ctx.currentTime, o.contextTime + (midiEvent.timeStamp - o.performanceTime) / 1000 + 0.012);
```

**Latency.** De host kiest de latency van de AudioContext (Laag / Gebalanceerd / Stabiel, onder Instellingen → Audio, samen met de sample rate en het kwaliteitsniveau, §12c). Maak nooit een eigen AudioContext; gebruik `ctx` uit `create`.

---

## 13c. Tunes, presets, songs, licenties en instrumenten (v1.9)

**Tunes en presets.** Voor jou als bouwer werken ze hetzelfde: de host gebruikt `getPreset`/`setPreset` (of `getState`/`setState`) zoals in §13. Een apparaat met `kind: 'instrument'` krijgt tunes, alle andere krijgen presets (§0). De host bewaart ze in bibliotheken die bij één apparaat-id horen, met mappen in mappen. Ieder exemplaar krijgt bij het laden een eigen kopie. Verander dus nooit je `id` of je `kind`: daaraan hangen de tunes en presets van je gebruikers.

**Pack**, om te delen; in een bibliotheekmap of op GitHub laadt het vanzelf mee. Een tunepack heet `naam.patchkamer-tunes.json` (`"format": "patchkamer-tunes"`, `formatVersion` 1), een presetpack `naam.patchkamer-presets.json` (`"format": "patchkamer-presets"`, `formatVersion` 2, verder hetzelfde):

```json
{ "format": "patchkamer-tunes", "formatVersion": 1, "device": "nl.jouwnaam.apparaat", "name": "Trance basics",
  "author": "…", "license": "CC-BY-4.0", "description": "…",
  "tree": [ { "folder": "Leads", "items": [ { "name": "Uplifting", "kind": "set", "version": "1.0.0", "state": { } } ] },
            { "name": "Diepe kick", "kind": "part", "part": "kick", "author": "…", "license": "LicenseRef-All-Rights-Reserved", "state": { } } ] }
```

**Tags (v1.19, optioneel).** Een tune of preset mag `tags` hebben, en een map of het hele pack ook; wat op een map of op het pack staat, geldt voor alles daaronder. De host maakt er een boom van op de tabs Tunes en Presets (**Per instrument** en **Per stijl**, met inspringen), zodat een gitaar of een jungle-klank te vinden is zonder te weten in welk apparaat hij zit. Een tag is een pad van kleine letters, cijfers en streepjes, gescheiden door `/` (hoogstens 4 niveaus, 60 tekens, 12 tags per knoop): `instrument/guitar/acoustic`, `style/hiphop`. Een ongeldige tag wordt genegeerd. De wortel is `instrument` (alleen bij tunes) of `style`; de host toont een tune bij de diepste tag van elke tak. Standaardnamen, door de host vertaald (andere namen mogen en worden met een hoofdletter getoond): instrumenten `keys`, `piano` (`acoustic`, `electric`, `toy`, `harpsichord`), `organ`, `mallet` (`vibes`, `marimba`, `bell`), `guitar` (`acoustic`, `nylon`, `steel`, `electric`), `plucked` (`harp`, `koto`, `lute`), `bass` (`sub`, `pluck`, `synth`, `acid`), `strings` (`violin`, `cello`, `ensemble`, `pizzicato`), `brass` (`trumpet`, `trombone`, `section`), `woodwind` (`flute`, `clarinet`, `oboe`, `sax`), `voice` (`choir`), `lead`, `pad`, `pluck`, `drums` (`kit`, `kick`, `snare`, `hat`, `tom`, `cymbal`), `percussion`, `fx` (`riser`, `impact`), `chords`, `texture`, `drone`; stijlen `ambient`, `dark-ambient`, `cinematic`, `film-score`, `neo-classical`, `synthwave`, `techno`, `dub-techno`, `trance`, `electro`, `house`, `deep-house`, `pop`, `lofi`, `hiphop`, `trap`, `drum-and-bass`, `jungle`, `breakbeat`, `big-room`, `acid`, `dub`, `dubstep`, `funk`, `disco`, `soul`, `jazz`, `ballad`, `rock`, `garage`, `future-bass`, `glitch`, `noise`, `minimal`, `industrial`, `chiptune`, `sci-fi`, `experimental`, `hardstyle`, `eurodance`, `folk`, `world`, `flamenco`, `metallic`, `generative`, `meditation`, `horror`, `bass-music`.

```json
{ "format": "patchkamer-tunes", "formatVersion": 1, "device": "nl.jouwnaam.string", "name": "Strings",
  "tags": ["instrument/plucked"],
  "tree": [ { "folder": "Folk", "tags": ["style/folk"], "items": [ { "name": "Open Guitar", "kind": "set", "tags": ["instrument/guitar"], "state": { } } ] } ] }
```

**Licenties.** Elke tune, preset en song heeft een veld `license` met een [SPDX](https://spdx.org/licenses/)-code, en meestal `author`. In Patchkamer kiest de maker bij het bewaren uit `CC-BY-4.0` (vrij te gebruiken met naamsvermelding) of `LicenseRef-All-Rights-Reserved` (alle rechten voorbehouden). Andere geldige SPDX-codes uit bestanden worden getoond en blijven staan. Op bibliotheekniveau is `license` de standaard voor nieuwe items. Is een tune of song gemaakt op basis van die van een ander, dan bewaart de host dat in `basedOn: { name|title, author, license }`. De host toont de licentie bij het laden of openen.

**Song** (`naam.patchkamer-song.json`), een export van een werkruimte:

```json
{ "format": "patchkamer-song", "formatVersion": 1, "title": "Nachtvlucht", "author": "…", "license": "CC-BY-4.0",
  "description": "…", "created": "2026-11-04T…", "patchkamer": "1.14",
  "workspace": { "format": "patchkamer-werkruimte", "formatVersion": 1, "defs": [ { "id": "…", "version": "…", "code": "…" } ],
                 "devices": [ ], "cables": [ ], "bpm": 126 } }
```

`workspace` is een gewone werkruimte, altijd met de code van alle apparaten (`defs[].code`), zodat de song ook werkt bij iemand die jouw bibliotheek niet heeft. Voor jou als bouwer betekent dit: wat in `getState()` staat, bepaalt of een song bij een ander precies zo klinkt.

`state` van een tune of preset (`kind: 'set'`) is precies wat `getPreset()` (of `getState()`) teruggeeft; van een instrument-tune (`kind: 'part'`) wat `getPart(id)` teruggeeft. Oude presetbestanden (`formatVersion` 1, met een lijst `presets`) blijven werken.

**Instrumenten** (optioneel, voor drumcomputers en andere apparaten met losse geluiden). Geef de instance drie methodes:

| Methode | Wat |
|---|---|
| `parts()` | `[{ id, name, type }]`: één regel per instrument. `type` is een korte soortnaam (`'kick'`, `'snare'`, `'closedhat'`…); de host zet tunes van dezelfde soort bovenaan. |
| `getPart(id)` | Een JSON-kopie van de **klank** van dat instrument: geen patroon, geen mute/solo, geen routing. |
| `setPart(id, data)` | Zet die klank op dat instrument, ook als `data` van een ander instrument komt. Werk de knoppen bij, net als `setState`. Onbekende velden negeer je. |

Regels: `setPart(id, getPart(id))` laat de instelling ongewijzigd, en `setPart(a, getPart(b))` verandert alleen instrument `a`. Heeft je apparaat de klank per patroon (zoals Takt Twaalf), dan werken `getPart`/`setPart` op het actieve patroon. Een kant-en-klare laag die dit doet via `getPreset`/`setPreset` staat in de bibliotheek (`__pkPartsWrap`, bijvoorbeeld in Slagwerk).

---

## 13d. Klembord: patronen en clips kopiëren en plakken (v1.17)

Voor apparaten met een patroon of een clip (sequencers, drumcomputers). Optioneel: zonder deze methoden doet je apparaat niet mee en verandert er niets. De host zet de knoppen **Kopieer** en **Plak** in de kaartbalk (en kent Ctrl/Cmd+C en Ctrl/Cmd+V op het gekozen apparaat) en doet al het vertalen tussen apparaten; **jouw apparaat levert en neemt alleen over**. Er zit dus geen vertaallogica in een apparaat.

| Aanroep | Wat |
|---|---|
| `clipInfo()` | Licht, gooit niet, verandert niets. Geeft `null` (nu niets te kopiëren of te plakken) of een object dat beschrijft wat het apparaat **nu** met het huidige patroon kan. Dynamisch: het antwoord hangt af van selectie en bekabeling (een toetsenspoor of een drumspoor, een aangesloten drumcomputer). De host roept hem vaak aan |
| `getClip()` | Een JSON-kopie van het huidige patroon als `patchkamer-clip` (zie onder), of `null`. Geen bijwerkingen. Een generator (euclidisch, willekeurig lopend) mag hier een momentopname van wat hij nu speelt geven |
| `setClip(clip)` | Zet het (al door de host aangepaste en gezuiverde) clipje op het huidige patroon. Geeft `{ ok: true }` of `{ ok: false, reason }` (`reason` is tekst in de taal van `host.lang`, voor de melding aan de gebruiker). Gooit nooit, zet niets half, klemt alle waarden zelf nog eens, werkt de UI bij zoals `setState` en stuurt zelf **geen** gebeurtenissen |

`clipInfo`, `getClip` en `setClip` horen bij elkaar: alle drie of geen. De validator zegt het als er een ontbreekt.

**Het formaat `patchkamer-clip` (JSON, `formatVersion` 1).** Tijd staat in gehele **tikken**: 12 tikken per zestiende, dus 192 per maat. Dat is exact voor 1/16, 1/32, 1/64 en de drie trioolrasters, zonder kommagetallen.

```json
{ "format": "patchkamer-clip", "formatVersion": 1,
  "kind": "notes",
  "name": "Bas A",
  "length": 192,
  "grid": 16,
  "source": { "device": "nl.patchkamer.seq", "name": "Step Sequencer", "version": "1.17.0", "trackType": "notes", "scheme": "gm" },
  "swing": 0,
  "notes": [ { "t": 0, "n": 45, "len": 12, "vel": 0.9, "acc": true, "prob": 1, "ratchet": 1 } ],
  "native": { "device": "nl.patchkamer.seq", "data": { } } }
```

Een clip met `kind: "drums"` heeft in plaats van `notes` twee velden:

```json
{ "format": "patchkamer-clip", "formatVersion": 1, "kind": "drums", "length": 192,
  "lanes": [ { "id": "kick", "name": "Kick", "type": "kick", "note": 36, "length": 192 } ],
  "hits":  [ { "t": 0, "lane": 0, "vel": 0.9, "acc": true, "prob": 1, "ratchet": 1 } ] }
```

| Veld | Betekenis en regels |
|---|---|
| `format`, `formatVersion` | Verplicht: `"patchkamer-clip"` en `1`. Een nieuwere `formatVersion` of een onbekende `kind` weigert de lezer; onbekende velden negeert hij |
| `kind` | `"notes"` (hoogtes, polyfoon of mono) of `"drums"` (banen met een slag). Een akkoordspoor is gewoon meerdere noten op dezelfde plek |
| `name` | Optioneel, tekst. De host toont hem met `textContent` en kapt hem op 40 tekens af |
| `length` | Verplicht: lengte van de clip in tikken, een geheel getal van 1 tot 12288 (64 maten) |
| `grid` | Optioneel: 16, 32 of 64, het rasterhint van de bron (alleen voor de editor van het doel) |
| `source` | Optioneel: wie de clip maakte (`device` = `id`, `name`, `version`, bij een spoor met type `trackType`, `scheme` is `"gm"` of `"device"`). Alleen informatie voor de melding en voor het uitlijnen van banen |
| `swing` | Optioneel: clipswing, 0 tot 0,5 zestienden; ontvangers zonder swing negeren hem |
| `notes[].t` | Starttik, een geheel getal van 0 tot `length`−1. Microtiming (verschuiving van een stap) wordt in `t` verwerkt |
| `notes[].n` | MIDI-nootnummer, een geheel getal van 0 tot 127 |
| `notes[].len` | Lengte in tikken, minimaal 1 (bij `hits` is er geen lengte) |
| `vel` | 0,01 tot 1, standaard 0,8 |
| `acc` | Optioneel, `true` als de bron een accent heeft; dan staat `vel` ook op 1. Een ontvanger met accent gebruikt `acc` of `vel` ≥ 0,9; een ontvanger zonder accent gebruikt alleen `vel` |
| `prob`, `ratchet` | Optioneel (standaard 1). Een ontvanger die ze niet kent, laat ze weg en de host meldt dat |
| `lanes` | Alleen bij `drums`: hoogstens 64 banen `{ id, name, type, note, length }`. `type` is het canonieke instrument (zoals `parts()[].type`, §13c) of leeg; `note` is het nootnummer van de baan; `length` alleen bij polymeter (de clip is dan zo lang als de langste baan) |
| `hits[]` | Alleen bij `drums`: `t` zoals bij noten, `lane` is de index in `lanes` (0 tot aantal−1), plus `vel`, `acc`, `prob`, `ratchet` |
| `native` | Optioneel: apparaat-eigen extra's `{ device, data }`. De host geeft ze alleen door aan een apparaat met dezelfde `id` (`device`); voor elk ander apparaat worden ze genegeerd. Dan is plakken tussen twee exemplaren van hetzelfde apparaat verliesvrij |

Huidige toonhoogtes worden **zoals opgeslagen** gekopieerd: de transpositie van een spoor (octaaf, `transpose`) hoort bij het spoor en niet bij het patroon.

**Grenzen.** `length` 1 tot 12288 tikken; hoogstens 4096 noten of slagen; hoogstens 64 banen; `name` hoogstens 40 tekens; het hele klembord (de JSON-tekst) hoogstens 1 MB. De host houdt die grenzen aan bij het lezen en schrijven; houd ze ook aan in `getClip` en klem ze in `setClip`.

**`clipInfo()` geeft** (alle velden behalve `copy` en `paste` optioneel):

| Veld | Betekenis |
|---|---|
| `name` | Hoe je apparaat het huidige patroon noemt ("Spoor 2 · Bas, clip 3") |
| `copy`, `paste` | Lijsten met `"notes"` en/of `"drums"`: wat je nu kunt geven (`getClip`) en wat je nu kunt ontvangen (`setClip`). Een generator zonder stappenlijst geeft `paste: []`. De soort hangt van het apparaat af (bij een spoortype dat het spoor bepaalt) en kan per moment verschillen |
| `length` | `{ min, max, step, current, shared }` in tikken: hoe lang het patroon mag zijn. `shared: true` als de lengte voor alle patronen van het apparaat geldt: de host past de clip dan aan aan de lengte van het apparaat, en wijzigt de lengte niet |
| `grid` | Lijst met rasters die het apparaat aankan (16, 32, 64) |
| `poly` | Hoeveel noten tegelijk (1 = mono) |
| `range` | `[laagste, hoogste]` MIDI-noot die het apparaat kan |
| `scheme` | `"gm"` (nootnummers volgens General MIDI) of `"device"` (eigen nummering: uitlijnen op `type` of naam, niet op nummer) |
| `vel`, `prob`, `ratchet` | Wat de velocity kan (`"continuous"`, `"accent"` of `"binary"`) en of `prob` en `ratchet` bestaan |
| `lanes` | Bij drums: `[{ id, name, type, note }]`, de banen van het doel |
| `maxEvents` | Hoeveel noten of slagen er in het patroon passen |

**Wat de host doet (kort).**

- Kopiëren legt de clip in het geheugen van de host en als JSON-tekst op het systeemklembord; plakken leest eerst het systeemklembord en valt terug op het geheugen. Eén patroon of clip per keer.
- Alleen tussen gelijksoortige apparaten: `notes` naar `notes`, `drums` naar `drums`. Bij een soortverschil doet de host niets en zegt waarom. Hij verandert **nooit** zelf het type van een spoor.
- Voor `setClip` zuivert de host de clip strikt (bereiken, aantallen, onbekende velden weg) en past hem aan het doel aan op basis van `clipInfo()`: het doel houdt zijn eigen lengte (een korte clip wordt herhaald als de lengte een veelvoud is, anders volgt stilte; een lange wordt afgekapt), noten gaan naar het dichtstbijzijnde rasterpunt, een mono-doel houdt de hardste noot, noten buiten `range` gaan per octaaf naar binnen. Drumbanen worden uitgelijnd op `native.device`, dan `type`, dan naam en alleen bij `"gm"` aan beide kanten op nootnummer; wat niet past, wordt weggelaten en gemeld. Nooit op volgorde en nooit een automatische transpositie.
- Terwijl de klok loopt, plakt de host standaard aan het begin van de volgende maat (met Annuleer); Ctrl+Shift+V plakt direct.
- Ongedaan maken doet de host met `getState()` vóór en `setState()` na het plakken. Daarom moet `getState`/`setState` exact zijn (§13); een eigen geschiedenis is niet nodig.

**Regels voor apparaten.**

1. Alle drie de methoden of geen. Alleen een apparaat met een echt patroon doet mee; stuurt je apparaat alleen akkoorden of een arpeggio zonder stappenlijst, dan mag `getClip` een momentopname geven en geeft `clipInfo().paste` een lege lijst.
2. `clipInfo()` is licht, gooit niet en verandert de state niet. Geef `null` als er nu niets is.
3. `getClip()` geeft JSON zonder AudioNodes, met een geldige `kind`, een `length` van 1 tot 12288 tikken, noten en slagen binnen het bereik en binnen de aantallen hierboven, of `null`. Het is een kopie: wat de host ermee doet, raakt jouw state niet.
4. `setClip(clip)` is de **enige** schrijver: klem en zuiver alles zelf, ook al heeft de host het al gedaan (een apparaat in een song kan een clip van elders krijgen). Onbekende velden negeren, ongeldige waarden op de standaard of de noot weglaten, nooit `NaN` of `Infinity` in de state. Bij `ok: false` blijft de state precies zoals hij was.
5. `setClip(getClip())` laat `getState()` ongewijzigd (zoals `setPart(id, getPart(id))` en `setPreset(getPreset())`).
6. `setClip` werkt de UI bij zoals `setState` (alle knoppen, stappenrijen en de pianorol) en stuurt zelf geen gebeurtenissen; alleen de klok laat geluid horen.
7. Geef bij `ok: false` altijd een `reason` in de taal van `host.lang`.
8. Een clip hoeft niet bij het huidige spoor te passen: kies liever `ok: false` met een duidelijke reden dan stil iets anders te doen.

**Veiligheid.** Het klembord is onbetrouwbare invoer: iedereen kan er tekst op zetten. De host zuivert strikt, maar jouw `setClip` vertrouwt niets: controleer elk getal, elk type en elke lengte; evalueer nooit tekst uit een clip; zet namen alleen met `textContent` (nooit `innerHTML`); lees `native` alleen als `native.device` gelijk is aan jouw `id`; en bouw geen onbegrensde lijsten (hoogstens 4096 noten of slagen, 64 banen).

---

## 13e. Samples (v1.20)

Een **sample** is een stukje geluid (een drumloop, een stab, een enkele klap) in een **samplepack**, `naam.patchkamer-samples.json`. De host toont ze op de tab **Samples** van de bibliotheek, per stijl of per pack, laat ze beluisteren en laadt ze in een apparaat dat daar geluid van maakt (de Loop Slicer, de Samplebank). Een samplepack bevat het geluid zelf, als base64, zodat het één bestand blijft dat overal werkt (GitHub, een map, loslaten op de vloer).

```json
{ "format": "patchkamer-samples", "formatVersion": 1, "name": "Jungle loops", "author": "…", "license": "CC0-1.0",
  "description": "…", "tags": ["style/jungle"],
  "tree": [ { "folder": "Rollers", "tags": ["style/drum-and-bass"],
              "items": [ { "name": "Rolling Ghost Break", "bpm": 170, "bars": 2, "tags": ["style/jungle"],
                           "author": "…", "license": "CC0-1.0",
                           "audio": { "format": "wav", "data": "<base64>" } } ] } ] }
```

| Veld | Regels |
|---|---|
| `format`, `formatVersion` | `"patchkamer-samples"` en `1`; een hoger `formatVersion` weigert de host met een melding |
| `tree` | mappen (`folder`, `items`, mag in elkaar) en samples; wat niet geldig is, wordt overgeslagen |
| `name` | hoogstens 80 tekens |
| `audio` | `format` is `wav`, `mp3`, `ogg` of `flac` (wat `decodeAudioData` van de browser leest), `data` is base64; een bestand is hoogstens 50 MiB |
| `bpm`, `bars` | optioneel: het tempo (20 tot 400) en de lengte in maten (0,25 tot 64). Een loop die naadloos herhaalt, heeft ze allebei |
| `tags` | zoals bij tunes (§13c): paden zoals `style/jungle`; op het pack, een map of het sample zelf. Samples gebruiken de wortel `style` |
| `author`, `license` | zoals bij tunes (SPDX; CC0-1.0 voor eigen samples). Samples van een ander blijven van die ander: zet de licentie van de maker erbij |

**Samples uit een opname van een ander** (een bekende break, een stuk uit een nummer) zijn auteursrechtelijk beschermd. Zet ze alleen in een pack als je de rechten hebt of de licentie het toestaat.

**Voor apparaten (optioneel).** Een apparaat dat audio kan laden, geeft de instance `loadAudio(files, info)`: `files` is een lijst `File`-objecten, zoals de gebruiker ze zou kiezen; `info` is `{ name, bpm, bars }` (alles optioneel). De methode doet hetzelfde als je eigen knop Bestand kiezen, geeft een belofte terug en meldt fouten in de kaart. De host roept hem aan als de gebruiker op → *apparaat* klikt; een apparaat zonder `loadAudio` krijgt geen sample en de host meldt dat. De Loop Slicer laadt het eerste bestand; de Samplebank laadt ze vanaf de geselecteerde pad.

---

## 13f. Instellingen opnemen en afspelen (v1.21)

Voor sequencers en controllers die de instellingen van een ander apparaat opnemen terwijl de gebruiker eraan draait (of een modulator ze beweegt) en ze later precies zo afspelen. Het doelapparaat hoeft hier niets voor te doen: de host leest en zet de regelaars zelf.

**Wat meedoet.** Alleen schuiven en draaiknoppen (`<input type="range">`, ook `host.ui.knob`) met een `id` (§12d) die ook in `params()` staan (§8), dus de regelaars waar ook Drift, LFO en MSEG op werken. Keuzelijsten, vinkjes en knoppen doen niet mee. Een waarde is altijd een getal van 0 tot 1: het deel van het bereik van de regelaar, logaritmisch bij `scale: 'log'`.

| Aanroep | Wat |
|---|---|
| `host.watchParams(this, doelId, fn)` | Meldt elke wijziging van een regelaar van het doel aan `fn(paramId, waarde, door)`. `door` is `'user'` (iemand draait of typt), `'seq'` (een andere sequencer zette hem met `setParam`) of `'mod'` (een modulator; `waarde` is dan de effectieve waarde: knopstand plus modulatie, begrensd op 0..1). Eén `fn` per aanroeper per doel; een nieuwe vervangt de oude. `fn` gelijk aan `null` stopt het volgen. Geeft `true` als het doel er is en je het niet zelf bent, anders `false`. |
| `host.setParam(this, doelId, paramId, waarde)` | Zet de regelaar zichtbaar (hij beweegt op de kaart mee), op `waarde` van 0 tot 1, afgerond op de stap van de regelaar. Geeft `true` als hij gezet is, `false` bij een onbekend doel of id, een regelaar die geen schuif is, een uitgeschakelde regelaar of een waarde die geen getal is. Een waarde buiten 0..1 wordt begrensd. Jijzelf krijgt de wijziging niet terug via `watchParams`; andere volgers krijgen `door: 'seq'`. |
| `host.lockParams(this, doelId, ids)` | Zolang het slot er is, negeert het doel de modulatie op deze `paramId`'s, ook de snelle (§9: `host.modSignal` geeft dan `false` en de modulator valt terug op `host.modulate`, dat voor deze id's ook genegeerd wordt). `ids` is een lijst; een tweede aanroep vervangt je vorige lijst; `null` of `[]` haalt je slot weg. Geeft `true` als het doel er is en je het niet zelf bent. |
| `host.paramsOf(this, doelId)` | De parameterlijst van het doel, uit zijn `params()`: `[{ id, name, lane, laneName, min, max, scale, value }]` (hoogstens 256). `value` is de knopstand van 0 tot 1, of `null` als er geen schuif of draaiknop met dit `id` is (die parameter kun je dan niet opnemen of zetten). `[]` bij een onbekend doel, jijzelf of een doel zonder `params()`. Bedoeld voor een weergave met een lijn per regelaar. |

- **Aanroepen komen van jou.** De host roept `fn` aan op de hoofddraad, vaak: een draai geeft veel meldingen per seconde, en een modulator elke keer dat hij stuurt (ongeveer 20 tot 30 keer per seconde per modulator). Dun ze uit voor je ze bewaart.
- **Snelle sturing** (§9, audio-snelheid) wordt niet gemeld. Alleen wat via `host.modulate` loopt, komt als `'mod'` binnen.
- **Opruimen.** Verdwijnt het doel of jijzelf, dan stopt het volgen en vervalt je slot. Geef een slot ook zelf vrij als je stopt met afspelen (`lockParams(this, doelId, null)`), anders blijft de modulatie uit.
- **De gebruiker blijft de baas.** Een regelaar die jij zet, kan de gebruiker gewoon verdraaien; jij ziet dat als `door: 'user'`.
- **Zachte overgang.** `setParam` springt naar de waarde. Roep het per tik aan (en stuur tussenwaarden voor een glijdende lijn); de host zet de definitieve wijziging 200 ms na de laatste aanroep vast.

Aanbevolen gedrag voor een sequencer die dit gebruikt:

1. **Opnemen als latch.** Een gemelde waarde blijft staan tot de volgende wijziging; leg de lijn per regelaar vast als punten (tijd, waarde) en laat de rest van de opname (noten, drums, akkoorden) ongemoeid.
2. **Afspelen.** Zet per tik de waarde op de lijn met `setParam`. Een gebruiker die tijdens het afspelen draait, wint tot hij loslaat of de opname het overneemt.
3. **Wie speelt de instellingen.** Laat de gebruiker per song kiezen: de sequencer speelt ze exact (zet `lockParams` op de regelaars met een lijn) of de modulatoren mogen er bovenop sturen (geen slot, de lijn is de basisstand). Een opname met modulatie erbij legt de effectieve waarde vast (`'mod'`) en past bij de exacte stand.
4. **Niets uit zichzelf.** Laden, herstellen of een song openen zet geen slot en zet geen regelaar; dat gebeurt pas als de transport loopt.

```js
// opnemen
host.watchParams(this, doelId, (id, waarde, door) => { if (opname) punten[id].push({ t: nu(), v: waarde }); });
// afspelen, exact: modulatie op deze regelaars uit
host.lockParams(this, doelId, ['cutoff', 'res']);
host.setParam(this, doelId, 'cutoff', 0.62);
// stoppen
host.lockParams(this, doelId, null); host.watchParams(this, doelId, null);
```

Een apparaat dat alleen doelwit is, doet niets: de dekking van `params()` (§8, v1.16) bepaalt welke regelaars een sequencer kan opnemen.

## 14. Host-API in één overzicht

| Aanroep | Sinds | Wat |
|---|---|---|
| `host.bpm`, `host.swing`, `host.stepDur()` | v1.0 | Huidig tempo, swing, duur van een zestiende in seconden |
| `host.emit(this, poort, ev)` | v1.0 | Gebeurtenis versturen (§6) |
| `host.setTempo(bpm)` | v1.0 | Tempo voorstellen, alleen na een klik |
| `host.ui.knob / select / steps / noise / curve` | v1.0 | UI-hulpmiddelen (§12) |
| `host.setPorts(this, ports)` | v1.2 | Poorten vervangen (§3) |
| `host.ui.jack(this, parent, poort, dir, label)` | v1.2 | Poort in je eigen UI (§3) |
| `host.modulate(this, doelId, offsets)` | v1.3 | Sturen, traag (§8) |
| `host.paramsChanged(this)` | v1.3 | Je parameterlijst is veranderd |
| `host.modSignal(this, doelId, paramId, node)` | v1.4 | Sturen, snel; `true`/`false` (§9) |
| `host.loadWorklet(naam, code)` | v1.4 | AudioWorklet laden; Promise (§10) |
| `host.saveFile(bestandsnaam, data)` | — | Een bestand aan de gebruiker geven (string of Blob); geeft `'saved'` of `'declined'` |
| `host.bundleChanged(this, poort)` | v1.5 | Je bundel is veranderd (§11) |
| `host.isWired(this, poort, dir)` | v1.5 | Is deze eigen poort bekabeld? |
| `host.ui.knob(…, opties)` | v1.8 | `{ default, scale: 'log' }`; draaiknop als de gebruiker dat kiest (§12a) |
| `data-pk-default`, `data-pk-noreset`, `data-pk-for` | v1.8 | Hints op eigen schuiven en getallen (§12a) |
| `parts()`, `getPart(id)`, `setPart(id, data)` | v1.9 | Instrumenten voor tunes per instrument, optioneel (§13c) |
| `loadAudio(files, info)` | v1.20 | Een sample uit de bibliotheek laden, zoals Bestand kiezen; optioneel (§13e) |
| `host.tunes.list / apply / save / applyPart` | v1.9 | Tunes en presets zonder UI (voor tests en controllers); `host.presets` is hetzelfde |
| `host.frame(this, cb, fps)` | v1.7 | Tekenen op de klok van de host, alleen als je kaart te zien is; geeft een opzeg-functie (§12b) |
| `host.visible(this)` | v1.7 | Is je kaart nu te zien? |
| `host.lang` | v1.11 | Taal van de gebruiker: `'nl'` of `'en'`; vast zolang je apparaat bestaat (§12c) |
| `host.audio` | v1.11 | `{ sampleRate, quality, oversample, latency }`: audiokeuze van de gebruiker, alleen lezen (§12c) |
| `host.peers(this)`, `onPeers(lijst)` | v1.7 | Andere apparaten zien (alleen lezen) (§13b) |
| `host.connect / disconnect / cablesFrom` | v1.7 | Kabels vanaf je eigen uitgangen leggen, weghalen, opvragen (§13b) |
| `host.mastering(this, actie, opties)` | v1.12 | Een Master Director stuurt de apparaten aan zijn mastering-kabels aan (§11b) |
| `host.eventBundleChanged(this, poort)` | v1.13 | De sporen van je multi-MIDI-poort zijn veranderd (§11c) |
| `host.controls(this, doelId)` | v1.13 | De regelaars op de kaart van een ander apparaat (§11c) |
| `host.setControl(this, doelId, sleutel, waarde)` | v1.13 | Zet een regelaar van een ander apparaat, waarde 0..1 (§11c) |
| `host.watchParams(this, doelId, fn)` | v1.21 | Wijzigingen van de regelaars van een ander apparaat volgen, ook die van modulatie; `fn(paramId, waarde, door)` (§13f) |
| `host.setParam(this, doelId, paramId, waarde)` | v1.21 | Zet een regelaar (uit `params()`) van een ander apparaat zichtbaar, waarde 0..1 (§13f) |
| `host.lockParams(this, doelId, ids)` | v1.21 | Modulatie op deze regelaars van een ander apparaat negeren; `null` haalt het slot weg (§13f) |
| `host.paramsOf(this, doelId)` | v1.21 | De parameterlijst van een ander apparaat met de knopstand van elke regelaar (§13f) |
| `host.noteNamesChanged(this)` | v1.14 | Je `noteNames()` is veranderd; andere apparaten horen het via `onPeers` (§13b) |
| `clipInfo()`, `getClip()`, `setClip(clip)` | v1.17 | Patronen en clips kopiëren en plakken, optioneel en alle drie samen; formaat `patchkamer-clip` (§13d) |
| `host.ui.meter(parent, label, opts)` | v1.18 | Een meter laten tekenen door de host (balk, ledladder of rond VU, door een skin te kiezen); geeft `{ el, set, id, destroy }` (§12e) |
| `data-pk-suffix` | v1.18 | Tekst (hoogstens 16 tekens) die de host bij het koppelen aan MIDI na het label zet: ` - suffix` (§12d) |
| `host.ui.pad(parent, label, opts)` | v1.22 | Een pad laten tekenen door de host (momentary of toggle, `flash()`, kleur); geeft `{ el, set, flash, id, destroy }` (§12f) |
| `host.ui.display(parent, label, opts)` | v1.22 | Een keuze die een skin als schermpje kan tonen; het model is een verborgen `<select>`; geeft `{ el, set, get, value, items, id, destroy }` (§12f) |
| `host.ui.steps(…, opts)` | v1.22 | 5e argument `{ id, group, role, color }` voor een rij stapknoppen (§12f) |
| `data-pk-role="pad"` / `"step"` | v1.22 | Eigen knoppen doen mee met vorm, kleur, ledje en maat (§12f) |

Gebruik niets anders van de host. Wat hier niet staat, kan zonder aankondiging veranderen.

---

## 15. Hygiëne

- `destroy()` stopt oscillators en bronnen, ontkoppelt je nodes (`disconnect()`), stopt timers, animaties en abonnementen op `host.frame`, en ontkoppelt bundelkanalen die je verbond. Twee keer `destroy()` mag niet gooien.
- Geen globale variabelen. Meerdere exemplaren van je apparaat moeten naast elkaar kunnen bestaan. Wil je bewust delen tussen exemplaren, zoals de groepen van Drift, doe dat dan in een variabele op moduleniveau en ruim die op.
- Geen browseropslag (`localStorage`, `sessionStorage`, `indexedDB`): state gaat via `getState`/`setState`.
- Geen netwerk (`fetch`, `XMLHttpRequest`, `WebSocket`), geen `import`, geen eigen AudioContext.
- Gooi geen fouten uit `onStep`, `onEvent`, `onBundle` of `modulate`.

---

## 16. Een bibliotheek

Een bibliotheek is een map (lokaal, op GitHub of op een webadres) met modules en een `patchkamer.json`:

```json
{
  "name": "Patchkamer-bibliotheek",
  "version": "1.0.0",
  "modules": ["instrumenten/mijn-synth.patchkamer-device.js", "effecten/mijn-effect.patchkamer-device.js"],
  "workspaces": [{ "name": "Startpunt", "path": "werkruimtes/startpunt.patchkamer.json" }],
  "presets": [{ "name": "Startpresets", "path": "presets/startpresets.patchkamer-presets.json" }]
}
```

- Patchkamer laadt alleen de modules die in `modules` staan.
- Werkruimtes (`*.patchkamer.json`) en presetbibliotheken (`*.patchkamer-presets.json`) zijn optioneel. Presetbibliotheken uit een bibliotheek zijn alleen-lezen; de gebruiker kan er een kopie van maken.
- Zonder `patchkamer.json` zoekt Patchkamer zelf naar `*.patchkamer-device.js`, `*.patchkamer.json`, `*.patchkamer-presets.json` en `*.patchkamer-tunes.json`. Andere `.js`-bestanden in de map, zoals hulpscripts, worden dan genegeerd. Modules die in `patchkamer.json` staan, mogen elke bestandsnaam hebben.
- Wijzig je een bestaand apparaat: verhoog `version` en houd `id`, poort-id's en bestandsnaam gelijk. Dan vinden bewaarde werkruimtes en presets het terug.

---

## 17. De validator

```
node validate-instrument.mjs mijn-apparaat.patchkamer-device.js
node validate-instrument.mjs mijn-apparaat.patchkamer-device.js --lang en   # uitvoer in het Engels (standaard Nederlands)
node validate-instrument.mjs mijn-apparaat.patchkamer-device.js --controls  # druk ook de tabel van regelaars, meters, pads en schermpjes af (v1.15, v1.18, v1.22)
node validate-instrument.mjs mijn-apparaat.patchkamer-device.js --clip      # toon ook de uitvoer van clipInfo() en getClip() (v1.17)
```

De validator laadt je module met een nep-AudioContext, een nep-DOM (met shadow roots) en een nep-host. Hij eindigt met één `OK`-regel (exit 0) of met de eerste fout (exit 1). Hij controleert:

1. **Bestand**: bestandsnaam `*.patchkamer-device.js` (een andere naam geeft een waarschuwing, geen fout); default export met `id` (reverse-DNS), `name`, `version` (semver), `kind`, `ports`, `create`; geldige `category` en `ui`; geen `ctx.destination` (behalve bij `output`), geen browseropslag, geen netwerk, geen imports, geen eigen AudioContext.
2. **Poorten**: alle twaalf lijsten, geldige en unieke id's, een AudioNode per audiopoort, `setPorts` met klaarstaande nodes, `jack` alleen voor bestaande poorten, `ui.jacks` alleen samen met minstens één `jack`.
3. **Levensloop**: `create` → `getState` vóór `mount` → `mount` → twee maten `onStep` → elk gebeurtenistype plus een onbekend type → `onTransport` → `getState`/`setState`-ronde → `setState({})` → twee keer `destroy`; `emit` alleen op eigen `eventOut`-poorten.
4. **Sturing (v1.3)**: `params` en `modulate` samen; geldige parameterlijst; `modulate` met +1, −1, 0,37, onbekende ids en `{}`. Een modulator heeft `modOut` (met `onModTargets`) of `masteringOut`; die krijgt eerst `[]` en daarna twee keer doelen.
5. **Snel en worklets (v1.4)**: `fast: true` vraagt `modInput(id)` met een AudioNode of AudioParam, en `null` voor onbekende ids; `host.modSignal` krijgt een echte AudioNode; `host.loadWorklet` krijgt een naam en code met `registerProcessor(...)`.
6. **Bundels (v1.5)**: elke `multiOut` heeft `bundles[id]` met kanalen (unieke id, naam, AudioNode). Elke `multiIn` heeft `onBundle`; die krijgt een bundel, dezelfde sleutel met een kanaal erbij, een tweede bundel en dan twee keer `null`. Daarna mag geen enkel kanaal nog verbonden zijn en mag er geen AudioNode in de state staan. `host.bundleChanged` alleen voor eigen `multiOut`-poorten.
7. **Presets (v1.6)**: elke knop en keuze van `host.ui.knob`/`select` wordt bijgewerkt door `setState(getState())`. `getPreset`/`setPreset` alleen samen, JSON zonder AudioNodes, `setPreset(getPreset())` geeft dezelfde preset, `setPreset({})` werkt.
8. **Soepel en besturing (v1.7)**: `host.frame` krijgt een functie; elke tekenfunctie wordt een paar keer aangeroepen en mag niet gooien; na `destroy()` staat er geen abonnement meer open. Een eigen `requestAnimationFrame` zonder `host.frame` geeft een waarschuwing in de OK-regel (geen fout). `onPeers` krijgt `[]` en een lijst met twee apparaten. `host.connect` alleen vanaf eigen uitgangen van de juiste soort.
9. **Regelaars en tekenpoort (v1.8)**: een apparaat met de tekenpoort (`__pkWrap`) geeft geen waarschuwing meer. Dubbelklik en typen kan de validator niet testen (dat doet de host met de echte UI).
10. **Instrumenten (v1.9)**: heeft de instance `parts`, dan ook `getPart` en `setPart`; elk instrument een uniek `id` en een `name`; `getPart` geeft JSON; `setPart(id, getPart(id))` laat de instelling gelijk; kruislings zetten neemt de klank over en raakt geen ander instrument.

11. **Taal en audio (v1.11)**: een optioneel `i18n` is een object met per taal een `name` en/of `ports` (poort-id → naam) van bestaande poorten; `host.lang` en `host.audio` zijn aanwezig; het hele apparaat wordt twee keer doorlopen, met `host.lang` `'nl'` en `'en'`, en een fout in een van beide takken is een fout.
12. **Mastering (v1.12)**: een apparaat met `masteringIn` heeft `configureMastering(patch)` (en optioneel `analyseMastering`, `acceptMasteringProposal`, `getMasteringReport`); die krijgen `{}`, `null` en onbekende of ongeldige velden en geven een object terug (of niets), en `getMasteringReport` geeft JSON zonder AudioNodes. Een apparaat met `masteringOut` heeft `onMasteringTargets(targets)`; die krijgt `[]`, een lijst met één doel (twee keer) en weer `[]`. De nep-host controleert `host.mastering` op een bekende actie en een bestaande `masteringOut`-poort. Een modulator heeft `modOut` of `masteringOut`.
13. **Multi-MIDI (v1.13)**: een apparaat met `multiEventOut` heeft `eventBundles[poortId]` met een lijst `tracks` (unieke tekst-id's, een `name`, een optioneel `ch` van 1 tot 16); een apparaat met `multiEventIn` heeft `onEventBundle`; die krijgt een bundel, dezelfde sleutel met een ander spoor erbij en dan `null`. Gebeurtenissen met `ch` of `cc` hebben waarden in het bereik; op een multi-MIDI-poort draagt elke gebeurtenis een `track` uit de lijst. De nep-host kent `host.eventBundleChanged`, `host.controls` en `host.setControl`.
14. **Nootnamen (v1.14)**: een apparaat met `noteNames()` geeft een lijst `{ note, name }` (noot 0 tot 127, `name` niet leeg); `noteNames()` gooit niet en `host.noteNamesChanged(this)` mag zonder fout worden aangeroepen.
15. **Regelaars voor skins (v1.15)**: de nep-host kent `host.ui.knob(…, opties)`, `host.ui.select(…, opties)`, `host.ui.adopt` en `host.ui.list`, en leest ook `data-pk-*`-attributen op eigen elementen. Alleen een `let op` (nooit een fout) bij een dubbel id, deels ontbrekende id's, een rol buiten de lijst, een ongeldig id of groep, opties die geen object zijn, `adopt` op een element zonder model, een id op een element dat nergens hangt, en id's die per `host.lang` verschillen. `--controls` drukt de tabel `id | rol | groep | label nl/en | bereik | gezicht | in params()` af (zie §12d).
16. **Dekking van `params()` (v1.16, §8)**: elke continue regelaar (`<input type="range">`, `host.ui.knob`, `host.ui.adopt`; niet de rollen `step`, `display`, `meter`, `jack`, `pad`, `button`) wordt aan `params()` gekoppeld: eerst via het `id` (opties of `data-pk-id`), dan via de `getState`-sleutel die verandert als de validator de waarde verzet en de `input`/`change`-afhandeling aanroept (genummerde sleutels als `osc.0.fine` tellen mee als ze op meerdere posities voorkomen; stapdata en een enkele gekozen positie niet), dan via een label dat aan precies één parameternaam gelijk is. Alleen een `let op` (nooit een fout) bij: continue regelaars die niet in `params()` en niet in `modExclude` staan; een `instrument`, `effect` of `mixer` (niet de categorieën `sequencer` en `tool`) met continue regelaars maar zonder `params()`; een `params()`-id zonder regelaar of state-sleutel; een `modExclude` dat geen lijst met tekst (of `'*'`) is. Wat de validator niet kan koppelen, laat hij stil (`?` in `--controls`). Regelaars die als `innerHTML` of op een canvas zijn getekend ziet hij niet.
17. **Klembord (v1.17, §13d)**: `clipInfo`, `getClip` en `setClip` alle drie of geen. `clipInfo()` geeft `null` of een JSON-object (`copy`/`paste` met `notes` en/of `drums`, getallen in `length`), gooit niet en verandert de state niet. `getClip()` geeft `null` of een geldige `patchkamer-clip` als JSON zonder AudioNodes (`format`, `formatVersion` 1, `kind` `notes` of `drums`, `length` 1 tot 12288 gehele tikken, hoogstens 4096 noten of slagen en 64 banen, `t`, `n`, `lane` en `vel` binnen het bereik) en verandert de state niet. `setClip(getClip())` laat `getState()` ongewijzigd. `setClip` krijgt rommel, lege en extreme clips (andere typen, `NaN`, lengte 0 of 1e9, 100000 noten, banen die niet bestaan) en gooit niet; het geeft altijd `{ ok, reason }` (`reason` tekst bij `ok: false`); bij `ok: false` blijft de state gelijk, bij `ok: true` is de state JSON zonder `NaN`/`Infinity` en stabiel onder `setState(getState())`; het stuurt zelf geen gebeurtenissen. Een apparaat dat zijn eigen `getClip()` weigert (`ok: false`) geeft een `let op`. Een apparaat zonder deze methoden krijgt geen melding. `--clip` toont wat `clipInfo()` en `getClip()` teruggeven.
18. **Meters (v1.18, §12e)**: de nep-host kent `host.ui.meter(parent, label, opts)` en geeft `{ el, set, id, destroy }`. Een `source` die geen `AnalyserNode` of lijst van 1 of 2 `AnalyserNode`s is, gooit en is dus een fout. Alleen een `let op` (nooit een fout) bij: een dubbel meter-id, een ongeldig id of groep, opties die geen object zijn, een ongeldige `range`/`unit`/`kind`/`hold`/`clip`/`orientation`/`length`/`width`, `kind: 'rms'` zonder `source`, een `set()` met iets anders dan een eindig getal of `[l, r]`, `data-pk-role="meter"` op een eigen element en een `data-pk-suffix` van meer dan 16 tekens. Een meter telt niet mee in de dekking van `params()`. `--controls` toont meters met rol `meter`.
19. **Instellingen opnemen (v1.21, §13f)**: de nep-host kent `host.watchParams`, `host.setParam`, `host.lockParams` en `host.paramsOf` en geeft `false` (`[]` bij `paramsOf`); de validator controleert er verder niets van (een sequencer die ze gebruikt, test je in de host).
20. **Pads en schermpje (v1.22, §12f)**: de nep-host kent `host.ui.pad(parent, label, opts)`, `host.ui.display(parent, label, opts)` en het 5e argument van `host.ui.steps`. Een `color` die geen `#rrggbb` is, gooit en is dus een fout. Alleen een `let op` (nooit een fout) bij: een dubbel pad-id, een ongeldig id of groep, opties die geen object zijn, een ongeldige `mode`/`on`/`onpress`/`onrelease`/`onchange`/`text`/`title`, een momentary pad zonder `onpress` en zonder `onchange`, een display met ongeldige `items`/`kind`/`wrap`/`searchAt` of een `value` buiten `items`, en een 5e argument van `steps` dat geen object is. Een display telt mee in de controle dat `setState` de keuzes bijwerkt; pads en stappen tellen niet mee in de dekking van `params()`. `--controls` toont ze met rol `pad`, `step` en `select`.

Wat de validator níet kan zien: of je teksten goed vertaald zijn, of het goed klinkt, of je eigen HTML-knoppen (buiten `host.ui`) meebewegen, en of je timing klopt. Test dat in Patchkamer zelf: zet een preset, verander een knop, kies de preset opnieuw en kijk of alles terugspringt.

---

## 18. Checklist voor oplevering

1. Eén bestand `naam.patchkamer-device.js`, default export, `id` reverse-DNS, `version` semver, juiste `kind` en `category`.
2. Alle audiopoorten hebben een node; geen `ctx.destination` (behalve `output`).
3. Geluid gepland op `time` uit `onStep`/`onEvent`; geen `setTimeout` voor timing.
4. `getState()` is gewone JSON en compleet; `setState({})` geeft standaardwaarden.
5. `setState()` werkt het geluid **en alle knoppen, keuzes en stappenrijen** bij.
6. Geen routing, bronkeuzes of lopende posities in een preset: zo nodig `getPreset`/`setPreset`.
7. Bundel uit: `bundles[poort]` als functie, stabiele kanaal-id's, `host.bundleChanged` bij wijziging.
8. Bundel in: keuze bewaard als `sleutel|kanaalId`, opnieuw verbinden bij dezelfde sleutel, alles ontkoppelen bij `null`.
9. Stuurbaar (optioneel): `params` + `modulate`, knop + modulatie, `modulate({})` = geen modulatie.
10. Snel (optioneel): `fast: true` alleen waar `modInput(id)` een echte ingang geeft.
11. Worklet (optioneel): unieke naam met versie, en een terugval zonder worklet.
12. UI vloeit mee met de kaartbreedte en gebruikt de CSS-variabelen van de host (geen vaste kleuren).
13. `destroy()` ruimt alles op en kan twee keer worden aangeroepen.
14. Bewegende UI via `host.frame` (met terugval), geen maat- of kleuropvragingen per frame (§12b).
15. Schuiven staan na `mount()` op hun standaardwaarde; getallen naast schuiven worden direct in de `input`-handler bijgewerkt; open shadow root (§12a).
16. Instrumenten (optioneel): `parts`/`getPart`/`setPart` samen, alleen klank in `getPart`, terugzetten laat de instelling gelijk (§13c).
17. Alle tekst voor de gebruiker kiest op `host.lang` (`'nl'` en `'en'`, anders `'en'`); namen per taal in `i18n`; `oversample` van `host.audio` gebruikt waar je zelf aliasing veroorzaakt (§12c).
18. Regelaars (v1.15, aanbevolen): elke `host.ui.knob`/`select` en elke eigen schuif heeft een `id` (= state-/parametersleutel, nooit het label), een `role` en een `group`; `node validate-instrument.mjs bestand.patchkamer-device.js --controls` toont de tabel zonder `let op` (§12d).
19. Dekking (v1.16): `params()` bevat elke continue regelaar met `id` = state-sleutel, behalve wat in `modExclude` staat (testnoot, basisnoot, lengte, stemmen, stapdata); keuzes en vinkjes horen er niet in; parameters die niet ongevraagd mogen bewegen (toonhoogte, master, gate, octaaf, tijden) hebben `on: false` (§8). `--controls` toont in de kolom `in params()` geen `nee`.
20. Klembord (v1.17, optioneel): `clipInfo`/`getClip`/`setClip` samen; `getClip()` geeft een geldige `patchkamer-clip` of `null`; `setClip` klemt alles zelf, geeft `{ ok, reason }`, zet niets half en stuurt geen gebeurtenissen; `setClip(getClip())` laat `getState()` gelijk (§13d).
21. Meters (v1.18, optioneel): wie een niveau toont, gebruikt `host.ui.meter` (met `source` voor een bestaande `AnalyserNode`, anders met `set()`), met `id` en `group`, `if (!host.ui || typeof host.ui.meter !== 'function')` als terugval op de eigen tekening, geen eigen demping, `destroy()` van de meter in `destroy()` van het apparaat, en een layout die de meter groter mag maken (§12e).
22. Pads en schermpje (v1.22, optioneel): wie een drukknop of een keuze toont, gebruikt `host.ui.pad`, `host.ui.display` of `host.ui.steps` met `{ id, group, role, color }` (kleur altijd `#rrggbb`), met `if (!host.ui || typeof host.ui.pad !== 'function')` als terugval op de eigen knop; `set()` en `flash()` roepen geen handlers aan; het model van een keuze blijft het `<select>` en `setState` zet de waarde; `destroy()` van pad en keuze in `destroy()` van het apparaat (§12f).
23. `node validate-instrument.mjs bestand.patchkamer-device.js` geeft `OK`, zonder `let op`.

---

## 19. Veelgemaakte fouten

| Fout | Gevolg | Oplossing |
|---|---|---|
| `setState` zet alleen het geluid, niet de knop | Na een preset of versiewissel staat de knop verkeerd; de eerstvolgende aanraking springt terug | Bewaar wat `host.ui.knob/select` teruggeeft en zet `.set(v)` / `.value` in `setState` |
| Nieuwe array in `setState` voor een stappenrij | De rij toont het oude patroon | `arr.splice(0, 16, ...nieuw)` en daarna `rij.paint()` |
| Lopende waarde (klok, fase, positie) in de state | Elke preset springt terug in de tijd; "gewijzigd" staat altijd aan | Laat die waarde weg in `getPreset` en zet hem in `setPreset` niet terug |
| Bronkeuze of routing in een preset | Een preset gooit kabels of bundelkeuzes om | `getPreset` zonder die velden; `setPreset` laat ze staan |
| `kanaal.node.disconnect()` zonder argument | Ook andere ontvangers van die bundel verliezen hun signaal | `kanaal.node.disconnect(jouwIngang)` |
| AudioNode in de state | Opslaan mislukt | Bewaar `sleutel|kanaalId` |
| `setTimeout` voor noten | Slordige timing, vooral bij een volle pagina | Plan op `time` met de Web Audio-klok |
| Vaste donkere kleuren in eigen CSS | Onleesbaar in de lichte stand | `var(--card)`, `var(--fg)`, `var(--well)` … |
| `bundles.x` als vast object | De host ziet geen nieuwe kanalen | Een functie die de actuele lijst geeft, plus `host.bundleChanged` |
| Oude state niet geaccepteerd | Werkruimtes en presets van een vorige versie laden niet | Onbekende velden negeren, ontbrekende standaard geven |
| Worklet-naam zonder versie | Gewijzigde worklet-code wordt niet geladen | `'nl-naam-fx-2'` bij elke wijziging |
| Eigen `requestAnimationFrame`-lus op 60 fps | Tekent ook buiten beeld en geminimaliseerd; MIDI en kabels gaan haperen | `host.frame(this, draw, 30)` (§12b) |
| `clientWidth` / `getComputedStyle` in de tekenfunctie | De browser rekent elke frame de opmaak opnieuw uit | `ResizeObserver` en een kleurcache |
| `host.frame` niet opgezegd | Een verwijderd apparaat blijft tekenen | Opzeg-functie aanroepen in `unmount()` en `destroy()` |
| UI na `mount()` opbouwen met de opgeslagen waarden | Dubbelklik zet de schuif terug naar de opgeslagen waarde in plaats van de standaard | In `mount()` de standaardwaarden tonen; `setState()` zet daarna de rest (§12a), of `data-pk-default` |
| Getal pas in een volgende frame bijwerken | Typen werkt niet: de host ziet het getal niet meebewegen | Getal direct in de `input`-handler zetten |
| Eigen dubbelklik-reset op elke schuif | Dubbel werk; de host doet het al | Weglaten, of `data-pk-noreset` als de schuif níet terug mag |
| Teksten vast in één taal | Gebruikers van de andere taal zien vreemde tekst | Kies alle teksten op `host.lang` en geef namen per taal in `i18n` (§12c) |
| Het label als `id` van een regelaar | Het label is vertaald en verandert: een skin raakt de regelaar niet meer; de validator meldt een `let op` als het per taal verschilt | `id` = de sleutel in `getState()`/`params()` (§12d) |
| Een paar regelaars met een id, de rest zonder | Een skin kan alleen de aangemelde aanwijzen; de rest blijft op de standaard | Geef alle knoppen, keuzes en schuiven een id |
| `host.ui.adopt` op een `div` of een tekening | Geen model: de host kan er geen ander gezicht op leggen | Alleen op `input` (range/checkbox), `select` of `button` |
| Een eigen meter tekenen terwijl `host.ui.meter` er is | Een skin kan het gezicht en de maat niet kiezen; de meter blijft een balk | `host.ui.meter`, met je oude tekening als terugval voor een oude host (§12e) |
| `host.ui.meter` zonder te controleren of hij bestaat | Het apparaat gooit op een oude host | `if (!host.ui || typeof host.ui.meter !== 'function')` en teken dan zelf |
| Het niveau zelf dempen vóór `set()` | Het signaal vertraagt twee keer; een skin met een andere ballistiek helpt niet meer | Geef het ruwe niveau door, de host doet de val |
| `source` laten vallen en toch een eigen analyser uitlezen in `set()` | Dubbel werk, ook buiten beeld | Geef de `AnalyserNode` als `source`; de host leest alleen als de kaart te zien is |
| Een eigen pad tekenen terwijl `host.ui.pad` er is | Een skin kan vorm, kleur en ledje niet kiezen | `host.ui.pad` (of `data-pk-role="pad"` op je eigen knop), met je oude knop als terugval voor een oude host (§12f) |
| `host.ui.pad` of `host.ui.display` zonder te controleren of ze bestaan | Het apparaat gooit op een oude host | `if (!host.ui || typeof host.ui.pad !== 'function')` en bouw dan zelf |
| Een kleur als `rgb(…)` of `#fff` aan een pad geven | De host kent alleen `#rrggbb`; de validator geeft een fout | Altijd `#rrggbb` |
| `onchange` verwachten bij `set(on)` of `flash()` | Ze roepen geen handlers aan; de state raakt niet gesynchroniseerd | Zet de state zelf in `setState` en roep `set()` aan om het gezicht bij te werken |

---

## 20. Volledige voorbeelden

Alle drie komen door de validator.

### 20a. Effect met knoppen, keuze, sturing en snelle sturing — `tremolo.patchkamer-device.js`

```js
// tremolo.patchkamer-device.js — voorbeeld-effect · Patchkamer contract v1.22
// Laat zien: audio in/uit, knoppen en een keuze die setState volgen (presets) en herkenbaar zijn voor skins (id/role/group, §12d), stuurbaar (params + modulate),
// één snelle parameter (fast + modInput), opruimen in destroy, en teksten per taal (host.lang + i18n).
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const DEF = () => ({ rate: 4, depth: 0.5, shape: 'sine' });
const MODP = [['rate', 'rate', 0.1, 20, true], ['depth', 'depth', 0, 1, false]];   // [id, tekstsleutel, min, max, log]
const TXT = {
  nl: { shape: 'Vorm', rate: 'Snelheid', depth: 'Diepte', sine: 'sinus', triangle: 'driehoek', square: 'blok' },
  en: { shape: 'Shape', rate: 'Rate', depth: 'Depth', sine: 'sine', triangle: 'triangle', square: 'square' },
};

export default {
  id: 'nl.voorbeeld.tremolo2',
  name: 'Tremolo',
  version: '2.0.0',
  kind: 'effect',
  category: 'effect',
  ports: { audioIn: [{ id: 'in', name: 'In' }], audioOut: [{ id: 'out', name: 'Uit' }], eventIn: [], eventOut: [] },
  i18n: { en: { ports: { in: 'In', out: 'Out' } } },   // namen die de host zelf toont, per taal

  create(ctx, host) {
    const T = TXT[host.lang] || TXT.en;   // teksten in je UI: kies op host.lang
    const S = DEF(), mod = {}; let dead = false;
    const inG = ctx.createGain(), out = ctx.createGain(), lfo = ctx.createOscillator(), depth = ctx.createGain(), fastDepth = ctx.createGain();
    out.gain.value = 1; lfo.connect(depth).connect(out.gain); inG.connect(out); lfo.start();
    fastDepth.gain.value = 1; fastDepth.connect(depth.gain);   // snel signaal −1..1 telt op bij de diepte
    // effectieve waarde = knop + modulatie (deel van het bereik; log-parameters in octaven)
    const E = k => { const m = MODP.find(x => x[0] === k), b = S[k], o = mod[k] || 0; if (!o) return b; return m[4] ? clamp(b * Math.pow(m[3] / m[2], o), m[2], m[3]) : clamp(b + o * (m[3] - m[2]), m[2], m[3]); };
    function apply() { if (dead) return; const t = ctx.currentTime; lfo.type = S.shape; lfo.frequency.setTargetAtTime(E('rate'), t, 0.03); depth.gain.setTargetAtTime(E('depth') * 0.5, t, 0.03); out.gain.setTargetAtTime(1 - E('depth') * 0.5, t, 0.03); }
    apply();
    const ui = {};   // bewaar wat host.ui teruggeeft: setState zet deze terug
    return {
      inputs: { in: inG }, outputs: { out },
      mount(el) {
        ui.shape = host.ui.select(el, T.shape, [['sine', T.sine], ['triangle', T.triangle], ['square', T.square]], S.shape, v => { S.shape = v; apply(); }, { id: 'shape', group: 'lfo' });
        ui.rate = host.ui.knob(el, T.rate, [0.1, 20, 0.1], S.rate, v => v.toFixed(1) + ' Hz', v => { S.rate = v; apply(); }, { id: 'rate', role: 'param', group: 'lfo' });
        ui.depth = host.ui.knob(el, T.depth, [0, 1, 0.01], S.depth, v => Math.round(v * 100) + '%', v => { S.depth = v; apply(); }, { id: 'depth', role: 'param', group: 'lfo' });
      },
      params() { return MODP.map(([id, key, min, max, log]) => ({ id, name: T[key], lane: 'trem', laneName: 'Tremolo', min, max, role: id === 'rate' ? 'rate' : 'depth', scale: log ? 'log' : 'lin', drift: 0.1, on: true, fast: id === 'depth' })); },
      modulate(o) { for (const k in mod) delete mod[k]; for (const k in o || {}) if (MODP.some(m => m[0] === k)) mod[k] = o[k]; apply(); },
      modInput(id) { return id === 'depth' ? fastDepth : null; },
      getState() { return { ...S }; },
      setState(s) {
        s = s || {}; const d = DEF();
        S.rate = typeof s.rate === 'number' ? clamp(s.rate, 0.1, 20) : d.rate;
        S.depth = typeof s.depth === 'number' ? clamp(s.depth, 0, 1) : d.depth;
        S.shape = ['sine', 'triangle', 'square'].includes(s.shape) ? s.shape : d.shape;
        apply();
        if (ui.rate) { ui.rate.set(S.rate); ui.depth.set(S.depth); ui.shape.value = S.shape; }   // knoppen volgen (v1.6)
      },
      destroy() { if (dead) return; dead = true; try { lfo.stop(); } catch (e) {} inG.disconnect(); out.disconnect(); fastDepth.disconnect(); },
    };
  }
};
```

### 20b. Instrument met klok, gebeurtenissen en een bundel-uitgang — `tweeklank.patchkamer-device.js`

```js
// tweeklank.patchkamer-device.js — voorbeeld-instrument · Patchkamer contract v1.22
// Laat zien: plannen op de klok (onStep), gebeurtenissen uitsturen (host.emit), een bundel-uitgang met elke
// stem apart (ports.multiOut + bundles), stappenpatronen die setState volgen (presets), teksten per taal.
const VOICES = ['tik', 'toon'];
const TXT = {
  nl: { tik: 'Tik', toon: 'Toon', pitch: 'Toonhoogte', lvl: 'Niveau', sep: 'Losse uit' },
  en: { tik: 'Tick', toon: 'Tone', pitch: 'Pitch', lvl: 'Level', sep: 'Separate out' },
};
const DEF = () => ({ pat: { tik: [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,1], toon: [1,0,0,0, 0,0,1,0, 0,0,0,0, 1,0,0,0] }, pitch: 220, lvl: 0.7 });

export default {
  id: 'nl.voorbeeld.tweeklank',
  name: 'Tweeklank',
  version: '1.0.0',
  kind: 'instrument',
  category: 'groove',
  modExclude: '*',   // dit voorbeeld toont de bundel, niet de sturing: bewust geen params() (§8)
  ports: { audioIn: [], audioOut: [{ id: 'out', name: 'Uit' }], eventIn: [], eventOut: [{ id: 'trigs', name: 'Trigs' }],
    multiOut: [{ id: 'los', name: 'Losse uit' }] },
  i18n: { en: { ports: { out: 'Out', los: 'Separate out' } } },

  create(ctx, host) {
    const T = TXT[host.lang] || TXT.en;
    const S = DEF(); let self, dead = false; const rows = {}, ui = {};
    const out = ctx.createGain(); out.gain.value = S.lvl;
    const bus = {}; VOICES.forEach(k => { bus[k] = ctx.createGain(); bus[k].connect(out); });   // één node per stem: die gaan in de bundel
    function hit(k, t) {
      const o = ctx.createOscillator(), g = ctx.createGain(); o.connect(g).connect(bus[k]);
      if (k === 'tik') { o.type = 'square'; o.frequency.value = 2400; g.gain.setValueAtTime(0.3, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.03); o.start(t); o.stop(t + 0.04); }
      else { o.type = 'sine'; o.frequency.setValueAtTime(S.pitch, t); g.gain.setValueAtTime(0.5, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.4); o.start(t); o.stop(t + 0.42); }
    }
    self = {
      inputs: {}, outputs: { out },
      // v1.5: de bundel. Een functie, zodat de host altijd de actuele kanalen krijgt.
      bundles: { los: () => ({ label: T.sep, channels: VOICES.map(k => ({ id: k, name: T[k], node: bus[k] })) }) },
      mount(el) {
        VOICES.forEach(k => { rows[k] = host.ui.steps(el, T[k], S.pat[k]); });
        ui.pitch = host.ui.knob(el, T.pitch, [80, 880, 1], S.pitch, v => Math.round(v) + ' Hz', v => { S.pitch = v; });
        ui.lvl = host.ui.knob(el, T.lvl, [0, 1, 0.01], S.lvl, v => Math.round(v * 100) + '%', v => { S.lvl = v; out.gain.setTargetAtTime(v, ctx.currentTime, 0.02); });
      },
      onStep({ step, time }) {
        VOICES.forEach(k => { if (S.pat[k][step]) { hit(k, time); host.emit(self, 'trigs', { type: 'trig', lane: k, vel: 1, time }); } });
        Object.values(rows).forEach(r => r.cursor(step));
      },
      onTransport({ playing }) { if (!playing) Object.values(rows).forEach(r => r.cursor(-1)); },
      getState() { return JSON.parse(JSON.stringify(S)); },
      setState(s) {
        s = s || {}; const d = DEF();
        // patronen in place vervangen: host.ui.steps houdt een verwijzing naar deze arrays
        VOICES.forEach(k => { const src = Array.isArray(s.pat && s.pat[k]) ? s.pat[k].slice(0, 16) : d.pat[k]; S.pat[k].splice(0, 16, ...src); });
        S.pitch = typeof s.pitch === 'number' ? s.pitch : d.pitch; S.lvl = typeof s.lvl === 'number' ? s.lvl : d.lvl;
        out.gain.value = S.lvl;
        Object.values(rows).forEach(r => r.paint()); if (ui.pitch) { ui.pitch.set(S.pitch); ui.lvl.set(S.lvl); }
      },
      destroy() { if (dead) return; dead = true; out.disconnect(); VOICES.forEach(k => bus[k].disconnect()); },
    };
    return self;
  }
};
```

### 20c. Ontvanger van een bundel, met keuze per uitgang en eigen preset — `bundelkeuze.patchkamer-device.js`

```js
// bundelkeuze.patchkamer-device.js — voorbeeld-ontvanger · Patchkamer contract v1.22
// Laat zien: een bundel ontvangen (ports.multiIn + onBundle), per uitgang kiezen welk bundelkanaal erop komt,
// de keuze bewaren als "sleutel|kanaal-id" zodat hij na laden terugkomt, alles ontkoppelen bij null,
// routing buiten presets houden (getPreset/setPreset), en teksten per taal.
const OUTS = ['a', 'b'];
const TXT = {
  nl: { none: '— niets', gone: '(niet verbonden)', out: 'Uit ', lvl: 'Niveau' },
  en: { none: '— nothing', gone: '(not connected)', out: 'Out ', lvl: 'Level' },
};
const DEF = () => ({ src: { a: '', b: '' }, lvl: 0.8 });

export default {
  id: 'nl.voorbeeld.bundelkeuze',
  name: 'Bundelkeuze',
  version: '1.0.0',
  kind: 'utility',
  category: 'mix',
  ports: { audioIn: [], audioOut: [{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }], eventIn: [], eventOut: [], multiIn: [{ id: 'in', name: 'Bundel' }] },
  i18n: { en: { name: 'Bundle chooser', ports: { in: 'Bundle' } } },

  create(ctx, host) {
    const T = TXT[host.lang] || TXT.en;
    const S = DEF(); let self, dead = false, root = null, lvlK = null;
    const outs = {}; OUTS.forEach(k => { outs[k] = ctx.createGain(); outs[k].gain.value = S.lvl; });
    const bundles = new Map();                  // sleutel -> bundel van de host
    const linked = { a: null, b: null };        // welk bundelkanaal (AudioNode) nu aan elke uitgang hangt
    const find = src => { if (!src) return null; const i = src.lastIndexOf('|'), b = bundles.get(src.slice(0, i)); return b ? b.channels.find(c => c.id === src.slice(i + 1)) || null : null; };
    function link(k) {                          // verbind precies wat de state vraagt, en niets anders
      const want = find(S.src[k]), n = want ? want.node : null;
      if (linked[k] === n) return;
      if (linked[k]) { try { linked[k].disconnect(outs[k]); } catch (e) {} }   // alleen ónze verbinding los
      linked[k] = n; if (n) n.connect(outs[k]);
    }
    function paint() {
      if (!root) return; root.innerHTML = '';
      OUTS.forEach(k => {
        const opts = [['', T.none]]; bundles.forEach(b => b.channels.forEach(c => opts.push([b.key + '|' + c.id, b.source.name + ' · ' + c.name])));
        if (S.src[k] && !find(S.src[k])) opts.push([S.src[k], T.gone]);
        host.ui.select(root, T.out + k.toUpperCase(), opts, S.src[k], v => { S.src[k] = v; link(k); });
      });
      lvlK = host.ui.knob(root, T.lvl, [0, 1, 0.01], S.lvl, v => Math.round(v * 100) + '%', v => { S.lvl = v; OUTS.forEach(k => outs[k].gain.setTargetAtTime(v, ctx.currentTime, 0.02)); });
    }
    self = {
      inputs: {}, outputs: outs,
      mount(el) { root = document.createElement('div'); el.appendChild(root); paint(); },
      unmount() { root = null; },
      // v1.5: bundel aangesloten, gewijzigd (zelfde sleutel, andere kanalen) of los (null)
      onBundle(port, key, b) {
        if (b) bundles.set(key, b); else bundles.delete(key);
        OUTS.forEach(k => { if (b && !S.src[k] && b.channels[OUTS.indexOf(k)]) S.src[k] = key + '|' + b.channels[OUTS.indexOf(k)].id; link(k); });   // lege uitgangen vanzelf vullen
        paint();
      },
      getState() { return JSON.parse(JSON.stringify(S)); },
      setState(s) {
        s = s || {}; const d = DEF();
        OUTS.forEach(k => { S.src[k] = typeof (s.src && s.src[k]) === 'string' ? s.src[k] : d.src[k]; link(k); });
        S.lvl = typeof s.lvl === 'number' ? s.lvl : d.lvl; OUTS.forEach(k => { outs[k].gain.value = S.lvl; });
        paint();   // bouwt de keuzes opnieuw op met de nieuwe waarden; telt als "knoppen volgen"
      },
      // v1.6: een preset bevat het niveau, niet welke kanalen je koos (dat is routing)
      getPreset() { const s = self.getState(); delete s.src; return s; },
      setPreset(p) { self.setState({ ...(p || {}), src: { ...S.src } }); },
      destroy() { if (dead) return; dead = true; OUTS.forEach(k => { if (linked[k]) { try { linked[k].disconnect(outs[k]); } catch (e) {} } outs[k].disconnect(); }); },
    };
    return self;
  }
};
```

Probeer ze samen: zet Tweeklank en Bundelkeuze op de vloer, trek een bundelkabel van **Losse uit** naar **Bundel**, en hang **A** en **B** aan twee kanalen van de mixer.

---

## 21. Opdrachtformaat

Geef een bouwopdracht aan een agent altijd in deze vorm, met dit document erbij:

```
OPDRACHT: bouw een Patchkamer-apparaat volgens PATCHKAMER-CONTRACT_NL.md v1.22.
Naam / id:        <Leesbare naam> / nl.<jouwnaam>.<apparaat>
Soort:            instrument | effect | mixer | output | utility | modulator   (category: …)
Wat het doet:     <één alinea: klank, gedrag, waarvoor>
Poorten:          audio in: …   audio uit: …   events in: …   events uit: …   bundel in: …   bundel uit: …
Bediening:        <knoppen en keuzes met bereik en eenheid>
Stuurbaar:        <welke parameters, welke snel>   (of: nee)
Presets:          <wat níet in een preset hoort, of: alles>
Kaartbreedte:     <px, of standaard>
Talen:            nl + en (via host.lang)   (of: alleen één taal)
Lever op:         één .patchkamer-device.js-bestand + de OK-regel van validate-instrument.mjs.
```
