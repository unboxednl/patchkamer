# Patchkamer — Instrumentcontract v1.7 voor bouwende agents

Dit document is de volledige, zelfstandige instructie om een instrument, effect, modulator of hulpapparaat te bouwen voor **Patchkamer**, een modulaire browserstudio op Web Audio. Een agent die dit document krijgt, heeft geen andere context nodig. Lever precies één `.js`-bestand op dat aan dit contract voldoet en zonder fouten door `validate-instrument.mjs` komt.

_Deze versie is opnieuw geschreven op basis van de host-code en de bibliotheek van november 2026; ze vervangt eerdere versies van dit document. Alles uit v1.0–v1.4 blijft geldig; v1.5, v1.6 en v1.7 zijn toevoegingen. Een apparaat dat aan een oudere versie voldoet, werkt nog steeds, maar alleen apparaten die aan v1.6 voldoen werken goed met presets, en alleen apparaten die aan v1.7 voldoen houden de studio soepel als er veel op de vloer staat._

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

---

## 1. Wat Patchkamer is

- Een webpagina (de **host**) met een **vloer** waarop apparaten als kaarten staan, verbonden met kabels.
- Vier kabelsoorten:
  - **audio** (cyaan): AudioNode → AudioNode;
  - **gebeurtenissen** (oranje): noten, trigs en CC als kleine JSON-objecten;
  - **sturing** (paars): een modulator verschuift parameters van een ander apparaat;
  - **bundel** (dik, groen): veel audiokanalen tegelijk, elk met een naam.
- Eén gedeelde **klok** (BPM, swing). De host plant elke zestiende noot vooruit en meldt die aan elk apparaat dat dat wil weten.
- Apparaten zijn **ES-modules**. Alles wat de module nodig heeft, zit in dat ene bestand: geen imports, geen netwerk, geen externe bestanden.
- Elke kaart heeft een **presetbalk**. De host bewaart en herstelt presets met de state van het apparaat (§13).

Een apparaat beslist zelf hoe het klinkt en hoe zijn UI eruitziet. De host beslist over verbindingen, timing, opslaan, laden en presets.

---

## 2. Het bestand

Eén ES-module met een default export:

```js
export default {
  id: 'nl.jouwdomein.naam',      // uniek, reverse-DNS, kleine letters: [a-z0-9] en punten/streepjes
  name: 'Leesbare naam',         // kort; staat op de kaart en in de bibliotheek
  version: '1.0.0',              // semver x.y.z
  kind: 'effect',                // 'instrument' | 'effect' | 'mixer' | 'output' | 'utility' | 'modulator'
  category: 'effect',            // optioneel: 'synth' | 'groove' | 'sequencer' | 'mod' | 'effect' | 'mix' | 'tool'
  ui: { width: 360, minWidth: 260, jacks: false },   // optioneel, zie §12
  ports: {
    audioIn:  [{ id: 'in',    name: 'In' }],
    audioOut: [{ id: 'out',   name: 'Uit' }],
    eventIn:  [{ id: 'notes', name: 'Noten' }],
    eventOut: [{ id: 'trigs', name: 'Trigs' }],
    modIn:    [],                // sturing in (zelden nodig: de host geeft automatisch 'mod', zie §8)
    modOut:   [],                // sturing uit (alleen modulatoren)
    multiIn:  [],                // bundel in (v1.5)
    multiOut: [],                // bundel uit (v1.5)
  },
  create(ctx, host) { /* ... */ return instance; }
};
```

**Identiteit.** Een apparaat is uniek door `id` + `version`. Hetzelfde `id` met een andere `version` is een andere versie van hetzelfde apparaat. Beide kunnen tegelijk geladen zijn en op een kaart kun je tussen versies wisselen: de host bewaart `getState()`, maakt de nieuwe versie, roept `setState()` aan en legt de kabels opnieuw. Houd daarom poort-id's gelijk tussen versies, en laat `setState` zowel oude als nieuwe state accepteren. Nieuw gedrag betekent een nieuwe `version`; het `id` en de bestandsnaam blijven gelijk.

**`kind`** is een hint voor de bibliotheek en voor de validator, geen beperking. Alleen `kind: 'output'` mag met `ctx.destination` verbinden. Een `modulator` heeft minstens één `modOut`.

**`category`** bepaalt waar het apparaat in de bibliotheek staat. Zonder category leidt de host hem af van `kind`.

---

## 3. Poorten

- Alle acht lijsten mogen leeg zijn of ontbreken. Poort-id's zijn uniek binnen hun lijst en bestaan uit `[a-z0-9_-]`.
- Elke `audioIn`-poort heeft een AudioNode in `instance.inputs`, elke `audioOut`-poort een AudioNode in `instance.outputs`, met dezelfde id.
- **Poorten die veranderen (v1.2).** `host.setPorts(this, ports)` vervangt je poortenlijst terwijl je apparaat draait, bijvoorbeeld als de gebruiker meer kanalen kiest. Zet eerst de nieuwe AudioNodes in `inputs`/`outputs` en roep dan `setPorts` aan. Kabels naar poorten die verdwijnen, haalt de host los.
- **Poorten in je eigen UI (v1.2).** Met `ui: { jacks: true }` tekent de host geen poortenrij. Je plaatst dan elke poort zelf met `host.ui.jack(this, parent, poortId, 'in' | 'out', label)`. Dat werkt voor alle vier de kabelsoorten.

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

## 12. UI

- `mount(el)` krijgt een leeg element in de kaart. De kaart is standaard ongeveer 300 px breed. Met `ui: { width: 200..6000, minWidth }` krijg je een bredere kaart.
- De gebruiker kan elke kaart breder, smaller, hoger en lager maken. Laat je UI dus meevloeien: auto-fit grids, `minmax(0, 1fr)`, container queries. Bij een vaste hoogte scrolt de host je UI; de poorten blijven zichtbaar.
- **Hulpmiddelen** in `host.ui`:
  - `knob(parent, label, [min, max, stap], waarde, fmt, onchange)` → `{ set(v) }`
  - `select(parent, label, [[waarde, tekst], …], waarde, onchange)` → een `<select>`; zet `select.value = v`
  - `steps(parent, label, array16, onchange)` → `{ paint(), cursor(stap) }`; houdt een verwijzing naar de array
  - `jack(this, parent, poortId, dir, label)` (zie §3), `noise(ctx)`, `curve(k)`
- **Bewaar wat `knob` en `select` teruggeven.** `setState` moet die bijwerken (§13).
- Eigen HTML mag ook. Gebruik de CSS-variabelen van de host, dan volgt je apparaat de kleurstelling (donker, licht, sampler):
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
5. `node validate-instrument.mjs bestand.js` geeft `OK … tekent via host.frame`. Staat er `let op: eigen requestAnimationFrame`, dan is stap 1 nog niet klaar.

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
| `host.peers(this)` | Lijst van de andere apparaten op de vloer: `{ id, name, def, version, kind, category, eventIn:[{id,name}], mod, selected }`. Alleen lezen. `mod` = heeft een Mod-ingang; `selected` = laatst aangeklikt. |
| `onPeers(lijst)` | Optioneel op je instance: de host roept dit aan als apparaten bijkomen, verdwijnen, geselecteerd worden of als kabels veranderen. |
| `host.connect(this, eigenUitgang, doelId, doelIngang, soort)` | Legt een gewone, zichtbare kabel van **je eigen** uitgang naar een ingang van een ander apparaat. `soort` = `'event'`, `'mod'` of `'audio'`. Geeft `true` als de kabel er ligt. |
| `host.disconnect(this, eigenUitgang?, doelId?, doelIngang?)` | Haalt kabels weg die **vanaf jouw** uitgangen vertrekken (filters zijn optioneel). Geeft het aantal. |
| `host.cablesFrom(this, eigenUitgang?)` | De kabels vanaf jouw uitgangen: `[{ port, to, toPort, kind }]`. Gebruik dit om te zien of de gebruiker een kabel heeft losgehaald. |

- Je kunt alleen vanaf je eigen uitgangen kabels leggen of weghalen; de host weigert de rest.
- De gebruiker blijft de baas: hij kan elke kabel zelf losmaken. Toon dat in je UI ("kabel los") in plaats van hem stilletjes opnieuw te leggen.
- Bewaar in je state **naar welk apparaat-id** je koppelde. De kabels zelf bewaart de werkruimte; leg ze bij het laden niet opnieuw.
- Geef `onPeers` geen zwaar werk: hij kan een paar keer per seconde komen.

**MIDI en timing.** Gebruik je Web MIDI (alleen na een klik, zonder sysex), plan noten dan niet op "nu" maar via de tijdstempel van het bericht. Dan krijgt elke aanslag dezelfde kleine vertraging, ook als de pagina even druk is:

```js
const o = ctx.getOutputTimestamp();   // { contextTime, performanceTime }
const t = Math.max(ctx.currentTime, o.contextTime + (midiEvent.timeStamp - o.performanceTime) / 1000 + 0.012);
```

**Latency.** De host kiest de latency van de AudioContext (Laag / Gebalanceerd / Stabiel, in de kopbalk). Maak nooit een eigen AudioContext; gebruik `ctx` uit `create`.

---

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
| `host.frame(this, cb, fps)` | v1.7 | Tekenen op de klok van de host, alleen als je kaart te zien is; geeft een opzeg-functie (§12b) |
| `host.visible(this)` | v1.7 | Is je kaart nu te zien? |
| `host.peers(this)`, `onPeers(lijst)` | v1.7 | Andere apparaten zien (alleen lezen) (§13b) |
| `host.connect / disconnect / cablesFrom` | v1.7 | Kabels vanaf je eigen uitgangen leggen, weghalen, opvragen (§13b) |

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
  "modules": ["instrumenten/mijn-synth.js", "effecten/mijn-effect.js"],
  "workspaces": [{ "name": "Startpunt", "path": "werkruimtes/startpunt.patchkamer.json" }],
  "presets": [{ "name": "Startpresets", "path": "presets/startpresets.patchkamer-presets.json" }]
}
```

- Patchkamer laadt alleen de modules die in `modules` staan.
- Werkruimtes (`*.patchkamer.json`) en presetbibliotheken (`*.patchkamer-presets.json`) zijn optioneel. Presetbibliotheken uit een bibliotheek zijn alleen-lezen; de gebruiker kan er een kopie van maken.
- Zonder `patchkamer.json` zoekt Patchkamer zelf naar `.js`-modules, `*.patchkamer.json` en `*.patchkamer-presets.json`.
- Wijzig je een bestaand apparaat: verhoog `version` en houd `id`, poort-id's en bestandsnaam gelijk. Dan vinden bewaarde werkruimtes en presets het terug.

---

## 17. De validator

```
node validate-instrument.mjs mijn-apparaat.js
```

De validator laadt je module met een nep-AudioContext, een nep-DOM (met shadow roots) en een nep-host. Hij eindigt met één `OK`-regel (exit 0) of met de eerste fout (exit 1). Hij controleert:

1. **Bestand**: default export met `id` (reverse-DNS), `name`, `version` (semver), `kind`, `ports`, `create`; geldige `category` en `ui`; geen `ctx.destination` (behalve bij `output`), geen browseropslag, geen netwerk, geen imports, geen eigen AudioContext.
2. **Poorten**: alle acht lijsten, geldige en unieke id's, een AudioNode per audiopoort, `setPorts` met klaarstaande nodes, `jack` alleen voor bestaande poorten, `ui.jacks` alleen samen met minstens één `jack`.
3. **Levensloop**: `create` → `getState` vóór `mount` → `mount` → twee maten `onStep` → elk gebeurtenistype plus een onbekend type → `onTransport` → `getState`/`setState`-ronde → `setState({})` → twee keer `destroy`; `emit` alleen op eigen `eventOut`-poorten.
4. **Sturing (v1.3)**: `params` en `modulate` samen; geldige parameterlijst; `modulate` met +1, −1, 0,37, onbekende ids en `{}`. Een modulator heeft `modOut` en `onModTargets`; die krijgt eerst `[]` en daarna twee keer doelen.
5. **Snel en worklets (v1.4)**: `fast: true` vraagt `modInput(id)` met een AudioNode of AudioParam, en `null` voor onbekende ids; `host.modSignal` krijgt een echte AudioNode; `host.loadWorklet` krijgt een naam en code met `registerProcessor(...)`.
6. **Bundels (v1.5)**: elke `multiOut` heeft `bundles[id]` met kanalen (unieke id, naam, AudioNode). Elke `multiIn` heeft `onBundle`; die krijgt een bundel, dezelfde sleutel met een kanaal erbij, een tweede bundel en dan twee keer `null`. Daarna mag geen enkel kanaal nog verbonden zijn en mag er geen AudioNode in de state staan. `host.bundleChanged` alleen voor eigen `multiOut`-poorten.
7. **Presets (v1.6)**: elke knop en keuze van `host.ui.knob`/`select` wordt bijgewerkt door `setState(getState())`. `getPreset`/`setPreset` alleen samen, JSON zonder AudioNodes, `setPreset(getPreset())` geeft dezelfde preset, `setPreset({})` werkt.
8. **Soepel en besturing (v1.7)**: `host.frame` krijgt een functie; elke tekenfunctie wordt een paar keer aangeroepen en mag niet gooien; na `destroy()` staat er geen abonnement meer open. Een eigen `requestAnimationFrame` zonder `host.frame` geeft een waarschuwing in de OK-regel (geen fout). `onPeers` krijgt `[]` en een lijst met twee apparaten. `host.connect` alleen vanaf eigen uitgangen van de juiste soort.

Wat de validator níet kan zien: of het goed klinkt, of je eigen HTML-knoppen (buiten `host.ui`) meebewegen, en of je timing klopt. Test dat in Patchkamer zelf: zet een preset, verander een knop, kies de preset opnieuw en kijk of alles terugspringt.

---

## 18. Checklist voor oplevering

1. Eén bestand, default export, `id` reverse-DNS, `version` semver, juiste `kind` en `category`.
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
15. `node validate-instrument.mjs bestand.js` geeft `OK`, zonder `let op`.

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

---

## 20. Volledige voorbeelden

Alle drie komen door de validator. Ze staan ook als losse bestanden in `bouwen/voorbeelden/`.

### 20a. Effect met knoppen, keuze, sturing en snelle sturing — `tremolo.js`

```js
// tremolo.js — voorbeeld-effect · Patchkamer contract v1.6
// Laat zien: audio in/uit, knoppen en een keuze die setState volgen (presets), stuurbaar (params + modulate),
// één snelle parameter (fast + modInput), opruimen in destroy.
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const DEF = () => ({ rate: 4, depth: 0.5, shape: 'sine' });
const MODP = [['rate', 'Snelheid', 0.1, 20, true], ['depth', 'Diepte', 0, 1, false]];

export default {
  id: 'nl.voorbeeld.tremolo2',
  name: 'Tremolo',
  version: '2.0.0',
  kind: 'effect',
  category: 'effect',
  ports: { audioIn: [{ id: 'in', name: 'In' }], audioOut: [{ id: 'out', name: 'Uit' }], eventIn: [], eventOut: [] },

  create(ctx, host) {
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
        ui.shape = host.ui.select(el, 'Vorm', [['sine', 'sinus'], ['triangle', 'driehoek'], ['square', 'blok']], S.shape, v => { S.shape = v; apply(); });
        ui.rate = host.ui.knob(el, 'Snelheid', [0.1, 20, 0.1], S.rate, v => v.toFixed(1) + ' Hz', v => { S.rate = v; apply(); });
        ui.depth = host.ui.knob(el, 'Diepte', [0, 1, 0.01], S.depth, v => Math.round(v * 100) + '%', v => { S.depth = v; apply(); });
      },
      params() { return MODP.map(([id, name, min, max, log]) => ({ id, name, lane: 'trem', laneName: 'Tremolo', min, max, role: id === 'rate' ? 'rate' : 'depth', scale: log ? 'log' : 'lin', drift: 0.1, on: true, fast: id === 'depth' })); },
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

### 20b. Instrument met klok, gebeurtenissen en een bundel-uitgang — `tweeklank.js`

```js
// tweeklank.js — voorbeeld-instrument · Patchkamer contract v1.6
// Laat zien: plannen op de klok (onStep), gebeurtenissen uitsturen (host.emit), een bundel-uitgang met elke
// stem apart (ports.multiOut + bundles), stappenpatronen die setState volgen (presets).
const VOICES = [['tik', 'Tik'], ['toon', 'Toon']];
const DEF = () => ({ pat: { tik: [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,1], toon: [1,0,0,0, 0,0,1,0, 0,0,0,0, 1,0,0,0] }, pitch: 220, lvl: 0.7 });

export default {
  id: 'nl.voorbeeld.tweeklank',
  name: 'Tweeklank',
  version: '1.0.0',
  kind: 'instrument',
  category: 'groove',
  ports: { audioIn: [], audioOut: [{ id: 'out', name: 'Uit' }], eventIn: [], eventOut: [{ id: 'trigs', name: 'Trigs' }],
    multiOut: [{ id: 'los', name: 'Losse uit' }] },

  create(ctx, host) {
    const S = DEF(); let self, dead = false; const rows = {}, ui = {};
    const out = ctx.createGain(); out.gain.value = S.lvl;
    const bus = {}; VOICES.forEach(([k]) => { bus[k] = ctx.createGain(); bus[k].connect(out); });   // één node per stem: die gaan in de bundel
    function hit(k, t) {
      const o = ctx.createOscillator(), g = ctx.createGain(); o.connect(g).connect(bus[k]);
      if (k === 'tik') { o.type = 'square'; o.frequency.value = 2400; g.gain.setValueAtTime(0.3, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.03); o.start(t); o.stop(t + 0.04); }
      else { o.type = 'sine'; o.frequency.setValueAtTime(S.pitch, t); g.gain.setValueAtTime(0.5, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.4); o.start(t); o.stop(t + 0.42); }
    }
    self = {
      inputs: {}, outputs: { out },
      // v1.5: de bundel. Een functie, zodat de host altijd de actuele kanalen krijgt.
      bundles: { los: () => ({ label: 'Losse uit', channels: VOICES.map(([k, name]) => ({ id: k, name, node: bus[k] })) }) },
      mount(el) {
        VOICES.forEach(([k, name]) => { rows[k] = host.ui.steps(el, name, S.pat[k]); });
        ui.pitch = host.ui.knob(el, 'Toonhoogte', [80, 880, 1], S.pitch, v => Math.round(v) + ' Hz', v => { S.pitch = v; });
        ui.lvl = host.ui.knob(el, 'Niveau', [0, 1, 0.01], S.lvl, v => Math.round(v * 100) + '%', v => { S.lvl = v; out.gain.setTargetAtTime(v, ctx.currentTime, 0.02); });
      },
      onStep({ step, time }) {
        VOICES.forEach(([k]) => { if (S.pat[k][step]) { hit(k, time); host.emit(self, 'trigs', { type: 'trig', lane: k, vel: 1, time }); } });
        Object.values(rows).forEach(r => r.cursor(step));
      },
      onTransport({ playing }) { if (!playing) Object.values(rows).forEach(r => r.cursor(-1)); },
      getState() { return JSON.parse(JSON.stringify(S)); },
      setState(s) {
        s = s || {}; const d = DEF();
        // patronen in place vervangen: host.ui.steps houdt een verwijzing naar deze arrays
        VOICES.forEach(([k]) => { const src = Array.isArray(s.pat && s.pat[k]) ? s.pat[k].slice(0, 16) : d.pat[k]; S.pat[k].splice(0, 16, ...src); });
        S.pitch = typeof s.pitch === 'number' ? s.pitch : d.pitch; S.lvl = typeof s.lvl === 'number' ? s.lvl : d.lvl;
        out.gain.value = S.lvl;
        Object.values(rows).forEach(r => r.paint()); if (ui.pitch) { ui.pitch.set(S.pitch); ui.lvl.set(S.lvl); }
      },
      destroy() { if (dead) return; dead = true; out.disconnect(); VOICES.forEach(([k]) => bus[k].disconnect()); },
    };
    return self;
  }
};
```

### 20c. Ontvanger van een bundel, met keuze per uitgang en eigen preset — `bundelkeuze.js`

```js
// bundelkeuze.js — voorbeeld-ontvanger · Patchkamer contract v1.6
// Laat zien: een bundel ontvangen (ports.multiIn + onBundle), per uitgang kiezen welk bundelkanaal erop komt,
// de keuze bewaren als "sleutel|kanaal-id" zodat hij na laden terugkomt, alles ontkoppelen bij null,
// en routing buiten presets houden (getPreset/setPreset).
const OUTS = ['a', 'b'];
const DEF = () => ({ src: { a: '', b: '' }, lvl: 0.8 });

export default {
  id: 'nl.voorbeeld.bundelkeuze',
  name: 'Bundelkeuze',
  version: '1.0.0',
  kind: 'utility',
  category: 'mix',
  ports: { audioIn: [], audioOut: [{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }], eventIn: [], eventOut: [], multiIn: [{ id: 'in', name: 'Bundel' }] },

  create(ctx, host) {
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
        const opts = [['', '— niets']]; bundles.forEach(b => b.channels.forEach(c => opts.push([b.key + '|' + c.id, b.source.name + ' · ' + c.name])));
        if (S.src[k] && !find(S.src[k])) opts.push([S.src[k], '(niet verbonden)']);
        host.ui.select(root, 'Uit ' + k.toUpperCase(), opts, S.src[k], v => { S.src[k] = v; link(k); });
      });
      lvlK = host.ui.knob(root, 'Niveau', [0, 1, 0.01], S.lvl, v => Math.round(v * 100) + '%', v => { S.lvl = v; OUTS.forEach(k => outs[k].gain.setTargetAtTime(v, ctx.currentTime, 0.02)); });
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
OPDRACHT: bouw een Patchkamer-apparaat volgens PATCHKAMER-CONTRACT.md v1.7.
Naam / id:        <Leesbare naam> / nl.<jouwnaam>.<apparaat>
Soort:            instrument | effect | mixer | output | utility | modulator   (category: …)
Wat het doet:     <één alinea: klank, gedrag, waarvoor>
Poorten:          audio in: …   audio uit: …   events in: …   events uit: …   bundel in: …   bundel uit: …
Bediening:        <knoppen en keuzes met bereik en eenheid>
Stuurbaar:        <welke parameters, welke snel>   (of: nee)
Presets:          <wat níet in een preset hoort, of: alles>
Kaartbreedte:     <px, of standaard>
Lever op:         één .js-bestand + de OK-regel van validate-instrument.mjs.
```
