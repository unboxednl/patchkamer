# Patchkamer — Instrumentcontract v1.4 voor bouwende agents

_Wijzigingen in v1.4: snelle (sample-nauwkeurige) sturing met `fast: true` + `modInput(paramId)` en `host.modSignal`; eigen DSP via AudioWorklet met `host.loadWorklet(naam, code)`. Optioneel: apparaten uit v1.3 werken ongewijzigd._

_Wijzigingen in v1.3: sturing. Een nieuwe kabelsoort (`mod`, paars gestippeld) stuurt parameters in plaats van geluid. Apparaten geven hun stuurbare parameters op met `params()` en ontvangen `modulate(offsets)`; modulatoren (`kind: 'modulator'`) sturen met `host.modulate`. Volledig optioneel: apparaten uit v1.2 werken ongewijzigd._

_Wijzigingen in v1.2: poorten die tijdens het draaien veranderen (`host.setPorts`) en poorten die het apparaat zelf in zijn interface plaatst (`ui.jacks` + `host.ui.jack`)._

_Wijzigingen in v1.1: identiteit `id@version` met versiewissel, optioneel `ui.width`, Shadow DOM-advies, optioneel `host.setTempo`, strengere validator._

Dit document is de volledige, zelfstandige instructie om een instrument, effect of hulpapparaat te bouwen dat werkt in **Patchkamer**, een modulaire browserstudio op Web Audio. Een agent die dit document krijgt, heeft geen andere context nodig. Lever precies één `.js`-bestand op dat aan dit contract voldoet en door `validate-instrument.mjs` komt.

---

## 1. Wat Patchkamer is

- Een webpagina (host) met een **vloer** waarop apparaten als kaarten staan, verbonden met kabels.
- Twee kabelsoorten: **audio** (AudioNode → AudioNode) en **gebeurtenissen** (noten, trigs, CC als JSON-objecten).
- Eén gedeelde **klok** (BPM, swing). De host plant elke zestiende noot vooruit en meldt die aan elk apparaat dat het wil weten.
- Apparaten worden geladen als **ES-modules**. Alles wat de module nodig heeft, zit in dat ene bestand. Geen imports van buiten, geen netwerk, geen externe assets.

Een instrument beslist zelf hoe het klinkt en hoe zijn UI eruitziet; de host beslist over verbindingen, timing, opslaan en laden.

---

## 2. Het bestand

Eén ES-module met een default export. Minimale vorm:

```js
export default {
  id: 'nl.jouwdomein.naam',      // uniek, reverse-DNS, kleine letters, [a-z0-9.-]
  name: 'Leesbare naam',         // max ~18 tekens, wordt op de kaart getoond
  version: '1.0.0',              // semver
  kind: 'effect',                // 'instrument' | 'effect' | 'mixer' | 'output' | 'utility' | 'modulator'
  category: 'effect',           // optioneel: 'synth' | 'groove' | 'sequencer' | 'mod' | 'effect' | 'mix' | 'tool'
  ui: { width: 640, minWidth: 420 },  // optioneel: standaardbreedte 200..6000 px (standaard ~300) en kleinste zinvolle breedte
  ports: {
    audioIn:  [{ id: 'in',    name: 'In' }],
    audioOut: [{ id: 'out',   name: 'Uit' }],
    eventIn:  [{ id: 'notes', name: 'Noten' }],
    eventOut: [{ id: 'trigs', name: 'Trigs' }],
    // optioneel (v1.3): modIn / modOut — sturing, zie §7b
  },
  create(ctx, host) { /* ... */ return instance; }
};
```

### Identiteit en versies

- Een apparaat wordt uniek bepaald door **`id` + `version`** (de host gebruikt intern de sleutel `id@version`). Hetzelfde `id` met een andere `version` is een andere versie van hetzelfde apparaat; beide kunnen tegelijk geladen zijn.
- `id` verandert nooit tussen versies. Een nieuw `id` is een nieuw apparaat.
- `version` is semver (`MAJOR.MINOR.PATCH`). De host sorteert versies numeriek en zet standaard de nieuwste op de vloer.
- Dezelfde `id@version` opnieuw laden **vervangt** die versie in de bibliotheek; apparaten die al op de vloer staan houden hun code tot je ze wisselt.
- Op elke kaart kan de gebruiker van versie wisselen. De host doet dan: `getState()` van de oude versie → `destroy()` → `create()` van de nieuwe versie → `setState(oudeState)` → kabels opnieuw leggen. Kabels naar poort-id's die in de nieuwe versie niet bestaan worden losgehaald en gemeld.
- Daarom: **behoud poort-id's tussen versies** en laat `setState` zowel oudere als nieuwere state accepteren (onbekende velden negeren, ontbrekende velden standaardwaarde geven). Hernoem je een poort of verander je de betekenis van state op een niet-compatibele manier, verhoog dan `MAJOR`.
- Een opgeslagen opstelling bewaart per apparaat `def` (id) en `version`. Ontbreekt die versie bij het laden, dan gebruikt de host de nieuwste beschikbare versie van hetzelfde `id` en meldt dat.

### Categorie in de bibliotheek

`category` bepaalt onder welk kopje een apparaat in de bibliotheek staat. Kies het kopje waar een muzikant het zou zoeken:

| `category` | Kopje | Voor |
|---|---|---|
| `synth` | Synths | toonbronnen die noten spelen of een drone maken |
| `groove` | Drums & grooveboxen | drummachines en complete grooveboxen met eigen patronen |
| `sequencer` | Sequencers | apparaten die vooral noten, trigs of CC uitsturen |
| `mod` | Modulatie | modulatoren: sturen parameters van andere apparaten, maken zelf geen geluid (v1.3) |
| `effect` | Effecten | audio in, bewerkte audio uit |
| `mix` | Mixen & uitgang | mixers, sommering, de uitgang naar de luidsprekers |
| `tool` | Meten & hulpmiddelen | scopes, meters, klokhulpen, utilities |

Zonder `category` leidt de host het kopje af van `kind` (`instrument` → Synths, `effect` → Effecten, `mixer`/`output` → Mixen & uitgang, `utility` → Meten & hulpmiddelen). `kind` blijft de technische soort; `category` is alleen de plek in de bibliotheek.

Regels voor `ports`:
- Elke lijst mag leeg zijn, maar moet bestaan. Poort-id's zijn uniek binnen hun lijst, kleine letters.
- `kind` is een hint voor de bibliotheek, geen beperking. Een `instrument` heeft normaal `audioOut`, een `effect` `audioIn` + `audioOut`, een `output` alleen `audioIn`, een `utility` wat het nodig heeft.
- Poorten staan vast na laden. Dynamische poorten bestaan niet in v1.

---

## 3. De instance

`create(ctx, host)` wordt één keer aangeroepen per exemplaar op de vloer en geeft een object terug:

| Veld | Verplicht | Betekenis |
|---|---|---|
| `inputs` | ja (mag `{}`) | object: poort-id → AudioNode, één per `audioIn`-poort |
| `outputs` | ja (mag `{}`) | object: poort-id → AudioNode, één per `audioOut`-poort |
| `mount(el)` | ja | bouw de UI in dit lege element (breedte ≈ 280 px) |
| `unmount()` | nee | stop animaties; wordt aangeroepen vóór `destroy` |
| `onStep(info)` | nee | klok-callback, zie §4 |
| `onTransport({playing})` | nee | start/stop; bij stop: laat klinkende stemmen netjes uitsterven |
| `onEvent(portId, ev)` | nee | inkomende gebeurtenis, zie §5 |
| `getState()` | ja | JSON-serialiseerbaar object dat het geluid exact herstelt |
| `setState(s)` | ja | herstel uit `getState()`; ontbrekende velden → standaardwaarden, onbekende velden negeren |
| `destroy()` | ja | stop oscillators, `disconnect()` op alle eigen nodes |

De host zet zelf `instance._id` en `instance._def`; raak die niet aan, maar geef `this`/de instance door aan `host.emit`.

---

## 4. Klok en timing

```js
onStep({ step, bar, time, stepDur, bpm, swing })
```

- Wordt voor **elke zestiende noot** aangeroepen, ongeveer 100 ms vóór het moment zelf (lookahead).
- `step` = 0..15 binnen de maat, `bar` telt door vanaf 0, `time` = AudioContext-tijd waarop de stap klinkt (swing is al verwerkt), `stepDur` = duur van één stap in seconden.
- **Plan alles op `time`**: `osc.start(time)`, `param.setValueAtTime(v, time)`, `param.setTargetAtTime(v, time, tc)`. Nooit `Date.now()`, `setTimeout` of `setInterval` voor geluid. UI-feedback (cursor, led) mag wél via `setTimeout(…, (time - ctx.currentTime) * 1000)`.
- `onStep` draait in de planner: **nooit een exception laten ontsnappen**, geen zware berekeningen, geen DOM-opbouw. Maak buffers en curves vooraf in `create`.
- Wil je iets per maat doen: `if (step === 0) …`. Wil je iets per N maten: `if (step === 0 && bar % N === 0) …`.

---

## 5. Gebeurtenissen

Verzenden: `host.emit(instance, 'poortId', ev)` — alleen op poorten uit je eigen `eventOut`.
Ontvangen: `onEvent(portId, ev)` — alleen voor poorten uit je `eventIn`.

Vaste vormen (velden erbij mag, deze niet weglaten):

```js
{ type: 'note', note: 60, vel: 0.8, time, dur }   // note = MIDI-nummer, vel 0..1, dur in seconden
{ type: 'trig', lane: 'kick', vel: 0.9, time }    // lane = vrije string
{ type: 'cc',   id: 'cutoff', value: 0.5, time }  // value genormaliseerd 0..1
```

- `time` is altijd AudioContext-tijd; ontvangers plannen daarop. Onbekende `type` negeren.
- Een synth die `note` ontvangt, sluit de gate op `time + dur` (of eigen release). Een slide/legato is: twee noten waarvan de tweede begint vóór `time + dur` van de eerste; dat mag je herkennen, maar hoeft niet.
- Een apparaat dat CC uitstuurt (LFO, sequencer, macro-knop) stuurt genormaliseerd 0..1; de ontvanger schaalt naar zijn eigen bereik.

---

## 6. Audio

- De host verbindt `outputs[x]` van het ene apparaat met `inputs[y]` van het andere via `connect`/`disconnect`. Eén AudioNode per poort; een AudioNode mag voor meerdere poorten dienen (bijvoorbeeld een Analyser als in én uit).
- **Nooit** zelf `ctx.destination` aansluiten, tenzij `kind === 'output'`. Een `output` moet dan zelf een limiter zetten.
- Houd je uitgang rond **−12 dBFS** bij normale instellingen; de mixer en de uitgang doen de rest. Interne luide trappen (vervorming, resonantie) compenseer je zelf.
- Alle nodes komen uit de meegegeven `ctx`. Maak geen eigen AudioContext.
- Oscillators die blijven lopen (drones, LFO's) start je in `create` en stop je in `destroy`. Eenmalige stemmen (drumslagen) stop je met `node.stop(time + duur)`.

---

## 7. UI

`mount(el)` krijgt een leeg `<div>` in de kaart. De kaart groeit mee in hoogte; houd het compact. Heb je meer ruimte nodig, zet dan `ui: { width }` in de definitie (200–6000 px).

**Ruimte boven compactheid.** De vloer is onbegrensd en zoomt van 10% tot 250%. Ontwerp een apparaat dus op de breedte waarop het het best leesbaar en bespeelbaar is, niet zo smal mogelijk. Is het apparaat afgeleid van een bestaand instrument of pagina, neem dan diens ontwerpbreedte over (`max-width` van de inhoud plus ~22 px kaartrand). Vouw niets standaard in om hoogte te sparen; inklappen mag als keuze van de gebruiker.

**De gebruiker bepaalt de maat.** Elke kaart heeft greepjes op de rechterrand (breedte), de onderrand (hoogte) en de hoek (beide); dubbelklik zet de standaardmaat terug. De host bewaart de maat per exemplaar in de opstelling en houdt hem vast bij een versiewissel. Voor jouw apparaat betekent dat:

- `ui.width` is alleen de **standaard**breedte. Je UI moet ook smaller en breder goed werken: gebruik `repeat(auto-fit, minmax(…))`-grids en container queries, geen vaste pixelbreedtes voor het geheel.
- Zet `ui.minWidth` als je layout onder een bepaalde breedte onbruikbaar wordt; de host laat de kaart dan niet smaller worden.
- Geeft de gebruiker de kaart een vaste hoogte, dan scrolt de host je UI binnen de kaart; de poorten blijven zichtbaar. Zelf `height` of `overflow` op je buitenste element zetten is niet nodig.

**Reageer op de kaartbreedte, niet op het venster.** `@media (max-width: …)` kijkt naar het browservenster; binnen een kaart is dat zinloos. Gebruik in je shadow root `container-type: inline-size` op je buitenste element en `@container (max-width: …)` voor je breekpunten.

**Grote of eigen-gestileerde interfaces: gebruik Shadow DOM.** Hang een shadow root aan een eigen div en bouw daarin:

```js
mount(el) {
  const wrap = document.createElement('div'); el.appendChild(wrap);
  const root = wrap.attachShadow({ mode: 'open' });
  root.innerHTML = '<style>' + CSS + '</style><div class="app">…</div>';
  root.getElementById('mijn-knop').onclick = …;   // id's zijn per exemplaar uniek binnen de shadow root
}
```

Zo lekken je stijlen niet naar de host of andere apparaten, en kunnen twee exemplaren dezelfde id's gebruiken. Gebruik in je CSS `:host { … }` in plaats van `:root`. Lettertypen: de host laadt Barlow Condensed, Fira Code, Oswald, IBM Plex Mono, Chakra Petch, JetBrains Mono, Syne en DM Mono; geef altijd een terugvalstapel op. `host.ui.*` werkt alleen buiten de shadow root (de host-CSS komt daar niet in). Hulpmiddelen op `host.ui`:

```js
host.ui.knob(el, 'Label', [min, max, step], waarde, fmtFn, onChangeFn)   // -> { set(v) }
host.ui.select(el, 'Label', [[value, tekst], ...], waarde, onChangeFn)   // -> <select>
host.ui.steps(el, 'Label', array16, onChangeFn)                          // -> { btns, paint(), cursor(step) }
host.ui.noise(ctx)        // AudioBufferSourceNode met witte ruis, loop aan, nog niet gestart
host.ui.curve(k)          // Float32Array vervormingscurve, k = 0..1, voor WaveShaperNode.curve
```

Eigen HTML mag ook. Beschikbare CSS-klassen uit de host: `.k` (knoppenrij), `.grid16` + `.st` (stapknoppen), `.rowlab`, `.meter`, `.note`. Gebruik geen globale CSS en geen `id`-attributen die kunnen botsen; prefix eigen id's met je module-id.

Gebruikersacties in de UI werken je `state` bij **en** passen het geluid direct toe (met `setTargetAtTime(v, ctx.currentTime, 0.02)` tegen klikken). `setState` moet dezelfde route nemen en ook de UI bijwerken.

---

### Tempo voorstellen (optioneel)

De klok is van de host. Lees het tempo uit `onStep` (`bpm`, `stepDur`) en nooit uit een eigen knop. Een preset mag na een **klik van de gebruiker** zijn tempo voorstellen met `host.setTempo && host.setTempo(134)`; roep dit nooit aan vanuit `create`, `mount`, `setState` of `onStep`.

### Poorten die veranderen (v1.2)

Sommige apparaten hebben een instelbaar aantal poorten, zoals een mixer met een instelbaar aantal kanalen. `ports` in de definitie is dan de **beginsituatie**. Verander je de configuratie, dan meld je de nieuwe lijst met:

```js
host.setPorts(this, { audioIn: [...], audioOut: [...], eventIn: [...], eventOut: [...] });
```

Volgorde:

1. Maak de AudioNodes voor nieuwe poorten aan en zet ze in `inputs`/`outputs`.
2. Roep `host.setPorts` aan. De host haalt kabels naar verdwenen poorten los (en meldt dat) terwijl de oude nodes nog bestaan.
3. Ruim daarna de nodes van verdwenen poorten op en haal ze uit `inputs`/`outputs`.

Houd de id's van poorten die blijven bestaan gelijk; hun kabels blijven dan liggen. Roep `setPorts` niet aan vanuit `create` (de host kent je dan nog niet); doe het vanuit `setState` of een actie van de gebruiker. De configuratie hoort in je state, zodat een geladen opstelling eerst de juiste poorten krijgt en daarna de kabels.

### Poorten in je eigen layout (v1.2)

Standaard tekent de host al je poorten in één rij bovenaan de kaart. Wil je ze op een eigen plek, bijvoorbeeld bovenaan elk mixerkanaal, zet dan `ui: { jacks: true }` en plaats **elke** poort zelf:

```js
const el = host.ui.jack(this, parent, 'ch1', 'in', '1');   // instance, ouder-element, poort-id, 'in'|'out', label
```

- De host maakt het element en regelt alles: kabels slepen, oplichten, kabels tekenen. Jij bepaalt alleen waar het staat.
- Jacks moeten in de **gewone DOM** van je kaart staan, niet in een shadow root; anders kan de host ze niet vinden. Gebruik voor je eigen stijlen dan een uniek klasse-prefix (bijvoorbeeld `.mx2-…`) in een `<style>` binnen je element.
- Bouw je je interface opnieuw op (bijvoorbeeld na `setPorts`), maak dan ook de jacks opnieuw aan. Scrollt een deel van je interface, dan tekent de host de kabels zelf bij.
- De validator controleert dat elke jack bij een bestaande poort hoort en dat er minstens één geplaatst is als `ui.jacks` aan staat.

Voorbeeld: `mixer2.js` (Mixer 2.1.0) doet beide.

## 7b. Sturing: parameters laten bewegen (v1.3)

Naast audio (cyaan) en gebeurtenissen (oranje) kent Patchkamer **sturing** (paars, gestippeld). Een sturingskabel draagt geen geluid en geen noten, maar een continue afwijking op parameters van een ander apparaat. Een modulator is geen sequencer: hij speelt niets, hij laat bestaande klank bewegen.

### Bestuurbaar worden (instrument of effect)

Implementeer twee functies op je instance. De host geeft je dan automatisch een sturingsingang `mod` (je mag die ook zelf opgeven als `ports.modIn: [{ id: 'mod', name: 'Mod' }]`).

```js
params() {          // wat een modulator mag besturen; gewone data, mag veranderen (meld dat met host.paramsChanged(this))
  return [
    { id: 'cut',  name: 'Cutoff', lane: 'synth', laneName: 'Synth', min: 80, max: 8000, scale: 'log', role: 'filter', drift: 0.10, on: true },
    { id: 'kick.tune', name: 'Tune', lane: 'kick', laneName: 'Kick', min: 30, max: 90, scale: 'log', role: 'pitch', drift: 0.04, on: true },
  ];
},
modulate(offsets) {  // { paramId: -1..1 } — vervangt de vorige set; ontbrekende ids = 0
  for (const k in mod) delete mod[k]; Object.assign(mod, offsets);
  apply();          // pas continue waarden direct toe; waarden die per noot gelden lees je bij de volgende noot
}
```

| Veld | Betekenis |
|---|---|
| `id` | uniek binnen het apparaat, stabiel tussen versies (de selectie in een modulator wordt erop bewaard) |
| `name` | korte naam in de modulator |
| `lane`, `laneName` | spoor: parameters met dezelfde `lane` worden samen getoond (een synth heeft er één, een drumcomputer één per drumgeluid) |
| `min`, `max` | bereik van de knop |
| `scale` | `'lin'` of `'log'`: hoe jij de afwijking toepast (log voor frequenties en tijden) |
| `role` | soort parameter: `pitch`, `filter`, `res`, `env`, `decay`, `level`, `pan`, `sub`, `glide`, of eigen; modulatoren laten gelijke rollen samen bewegen |
| `drift` | voorgesteld maximaal bereik als deel van `max − min` (0..1); een goede startwaarde ligt onder de hoorbaarheidsgrens |
| `on` | standaard aangevinkt in een modulator |

**Wat een offset betekent.** `−1..1` is een deel van het bereik van de parameter, bovenop de knopstand. Effectieve waarde: lineair `clamp(basis + offset × (max − min))`, logaritmisch `clamp(basis × (max/min)^offset)`. De knop blijft dus de basis; laat de knop zelf niet meebewegen. De host telt alle modulatoren die op je apparaat zijn aangesloten op en begrenst de som op `−1..1`; jij krijgt altijd één totaal. Bij het loskoppelen krijg je een set zonder die bijdrage (vaak `{}`): keer dan terug naar de knopstand.

### Een modulator bouwen

```js
kind: 'modulator', category: 'mod',
ports: { audioIn: [], audioOut: [], eventIn: [], eventOut: [], modIn: [], modOut: [{ id: 'mod', name: 'Drift' }] },
create(ctx, host) {
  let targets = [];
  const timer = setInterval(() => targets.forEach(T => host.modulate(self, T.id, { [T.params[0].id]: Math.sin(ctx.currentTime) * 0.05 })), 50);
  const self = {
    inputs: {}, outputs: {},
    onModTargets(list) { targets = list.filter(T => T.params.length); /* herteken je UI */ },
    onModSources(list) { /* optioneel: wie stuurt jou aan (list[i].port = jouw ingang) */ },
    // mount, getState, setState …
    destroy() { clearInterval(timer); }
  };
  return self;
}
```

- `onModTargets(targets)` komt bij elke wijziging in de bekabeling of in de parameters van een doel: `[{ id, name, def, version, params }]`.
- `host.modulate(this, targetId, offsets)` werkt alleen zolang er een sturingskabel van jou naar dat doel loopt. Stuur ongeveer 20–30× per seconde; meer heeft geen zin.
- Een modulator mag ook een sturingsingang hebben (bijvoorbeeld `volg`) om met andere modulatoren samen te werken; `onModSources` vertelt wie er op welke ingang zit.
- Modulatie loopt los van de transportknop: een modulator blijft bewegen, ook als de klok stilstaat. Plan dus niets op `onStep`.

Voorbeelden: `instrumenten/monosynth.js` (één spoor), `instrumenten/drumcomputer.js` (vier sporen), `modulatie/drift-modulator.js` (groepen en volgen).

## 7c. Snelle sturing (v1.4)

`host.modulate` werkt op ongeveer 20–30 updates per seconde: goed voor trage beweging (Drift), te grof voor een LFO op 1/16. Daarom kan een parameter **snel** zijn: de modulator levert dan een audiosignaal, sample-nauwkeurig.

**Bestuurbaar apparaat.** Markeer de parameter met `fast: true` in `params()` en implementeer `modInput(paramId)`. Die geeft een AudioNode (of AudioParam) die een signaal **−1..1** ontvangt, als deel van het bereik, net als bij `modulate`. Jij rekent het om en telt het op bij de knop:

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

Tip: voor frequenties werkt `detune` (cents) van BiquadFilter en Oscillator perfect als logaritmische optelling. Zet ook de trage offsets voor deze parameters via een ConstantSource op dezelfde bus. Dan klinken Drift (traag) en LFO (snel) samen continu, ook tussen noten door.

**Modulator.** Maak je signaal (bijvoorbeeld een ConstantSource waarop je stukjes curve vooruit plant), en verbind per toewijzing een GainNode (de diepte):

```js
const ok = host.modSignal(this, targetId, paramId, gainNode);   // true: verbonden; false: doel biedt het niet
// false → stuur deze parameter via host.modulate; null als node maakt de verbinding los
```

De host verbreekt de verbinding zelf als de kabel of een apparaat verdwijnt. Roep `modSignal` opnieuw aan in elke `onModTargets`, want na een versiewissel is het doel nieuw.

## 7d. Eigen DSP met AudioWorklet (v1.4)

Voor wat Web Audio-nodes niet kunnen (ladderfilter met terugkoppeling, korte vertraging in een lus, Hilbert-filter, Karplus-Strong):

```js
const NAME = 'jouwnaam-mijnfilter-1';           // uniek, met versienummer: een naam kan maar één keer geregistreerd worden
const CODE = `class P extends AudioWorkletProcessor { process(inputs, outputs, params) { … return true; } }
registerProcessor('${NAME}', P);`;
host.loadWorklet(NAME, CODE)
  .then(() => { node = new AudioWorkletNode(ctx, NAME, { numberOfInputs: 1, numberOfOutputs: 1, outputChannelCount: [2] }); input.connect(node).connect(out); })
  .catch(() => { /* toon een melding en laat het geluid onbewerkt door */ });
```

- De host laadt de code als blob en valt terug op een data-URL. Daardoor werkt het ook vanuit een los HTML-bestand (`file://`).
- Laat je apparaat werken zonder worklet: bypass en een korte melding in de UI. Controleer `typeof AudioWorkletNode`.
- Wijzig je de worklet-code, verhoog dan het versienummer in de naam. Een oude registratie blijft in de AudioContext bestaan.
- Noten naar een worklet stuur je met `node.port.postMessage({ note, t, dur })` en plan je in de processor op `currentTime`.

Voorbeelden: `effecten/flanger.js`, `effecten/filter.js`, `effecten/resonator.js`, `effecten/freqshift.js`, `instrumenten/string.js`.

## 8. State

- `getState()` geeft een plat JSON-object (getallen, strings, booleans, arrays daarvan). Geen AudioNodes, functies of DOM.
- Maak kopieën van arrays (`arr.slice()`), zodat de host je state veilig kan opslaan.
- `setState` kan vóór of ná `mount` worden aangeroepen; beide moeten werken.
- Bij een nieuwe `version` met gewijzigde state: lees oude velden met een standaardwaarde (`s.cut ?? 800`). Versienummer in state is niet nodig; de host bewaart `version` van de module.

---

## 9. Hygiëne en veiligheid

- Geen netwerk, geen `fetch`, geen `import`, geen `eval`, geen `localStorage`/`sessionStorage`/`indexedDB`, geen eigen `AudioContext`. De host regelt opslag en geluid.
- Geen `document.addEventListener` of `window.addEventListener` voor toetsen; sneltoetsen zijn van de host. Luister alleen op je eigen elementen.
- Lussen met `requestAnimationFrame` stop je in `unmount`/`destroy`.
- Geen globale variabelen; alles leeft binnen `create` (closure).
- Meerdere exemplaren van hetzelfde instrument moeten onafhankelijk naast elkaar kunnen staan. Gedeelde buffers (bijvoorbeeld ruis) mag je cachen op de module, nooit op `window`.
- Fouten in `mount`/`setState` mogen een melding geven via `throw` (de host toont ze); fouten in `onStep`/`onEvent` vang je zelf af.
- `destroy()` is idempotent (twee keer aanroepen mag).

---

## 10. Checklist vóór oplevering

1. Bestand is één ES-module met `export default { … }`.
2. `id` uniek en reverse-DNS; `name`, `version`, `kind`, `ports` aanwezig.
3. Voor elke `audioIn`-poort een `inputs[id]`, voor elke `audioOut`-poort een `outputs[id]`.
4. `mount`, `getState`, `setState`, `destroy` aanwezig.
5. Alles wat klinkt, wordt gepland op `time` uit `onStep`/`onEvent`.
6. Geen `ctx.destination` (tenzij `kind: 'output'`).
7. `setState(getState())` levert hetzelfde geluid en dezelfde UI.
8. `setState(getState())` levert byte-voor-byte dezelfde state (de validator controleert dit).
9. Bij een nieuwe versie van een bestaand apparaat: zelfde `id`, hogere `version`, poort-id's behouden, `setState` accepteert de state van de vorige versie.
10b. Snel (optioneel): `fast: true` alleen waar `modInput(id)` een echte ingang geeft; worklet-naam uniek met versie, en een terugval zonder worklet.
10. Bestuurbaar (optioneel): `params()` en `modulate()` allebei aanwezig, ids stabiel, `modulate({})` zet alles terug naar de knopstand.
11. `node validate-instrument.mjs jouw-bestand.js` geeft `OK`.

---

## 11. Volledig voorbeeld: effect

```js
// tremolo.js — Patchkamer contract v1
export default {
  id: 'nl.voorbeeld.tremolo',
  name: 'Tremolo',
  version: '1.0.0',
  kind: 'effect',
  ports: { audioIn: [{ id: 'in', name: 'In' }], audioOut: [{ id: 'out', name: 'Uit' }], eventIn: [], eventOut: [] },
  create(ctx, host) {
    const inG = ctx.createGain(), outG = ctx.createGain();
    const lfo = ctx.createOscillator(), depth = ctx.createGain();
    lfo.frequency.value = 4; depth.gain.value = 0.5;
    lfo.connect(depth).connect(outG.gain); lfo.start();
    inG.connect(outG);
    const state = { rate: 4, depth: 0.5 };
    let ui = {};
    const apply = () => { lfo.frequency.setTargetAtTime(state.rate, ctx.currentTime, 0.02); depth.gain.setTargetAtTime(state.depth, ctx.currentTime, 0.02); };
    return {
      inputs: { in: inG }, outputs: { out: outG },
      mount(el) {
        ui.rate  = host.ui.knob(el, 'Snelheid', [0.1, 20, 0.1], state.rate,  v => v.toFixed(1) + ' Hz',       v => { state.rate = v;  apply(); });
        ui.depth = host.ui.knob(el, 'Diepte',   [0, 1, 0.01],   state.depth, v => Math.round(v * 100) + '%', v => { state.depth = v; apply(); });
      },
      getState() { return { ...state }; },
      setState(s) { Object.assign(state, { rate: s.rate ?? 4, depth: s.depth ?? 0.5 }); apply(); ui.rate && ui.rate.set(state.rate); ui.depth && ui.depth.set(state.depth); },
      destroy() { try { lfo.stop(); } catch (e) {} inG.disconnect(); outG.disconnect(); }
    };
  }
};
```

## 12. Volledig voorbeeld: instrument met klok en gebeurtenissen

```js
// klik.js — metronoom die ook trigs uitstuurt
export default {
  id: 'nl.voorbeeld.klik',
  name: 'Klik',
  version: '1.0.0',
  kind: 'instrument',
  ports: { audioIn: [], audioOut: [{ id: 'out', name: 'Uit' }], eventIn: [], eventOut: [{ id: 'trigs', name: 'Trigs' }] },
  create(ctx, host) {
    const out = ctx.createGain(); out.gain.value = 0.5;
    const state = { div: 4, lvl: 0.5 };            // div = elke hoeveel stappen
    let self, cursor;
    function tick(time, accent) {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.frequency.value = accent ? 1600 : 1000;
      g.gain.setValueAtTime(0.6, time); g.gain.exponentialRampToValueAtTime(0.0001, time + 0.05);
      o.connect(g).connect(out); o.start(time); o.stop(time + 0.06);
    }
    self = {
      inputs: {}, outputs: { out },
      mount(el) {
        host.ui.select(el, 'Elke', [[16, 'maat'], [4, 'tel'], [2, '8e'], [1, '16e']], state.div, v => state.div = +v);
        host.ui.knob(el, 'Niveau', [0, 1, 0.01], state.lvl, v => Math.round(v * 100) + '%', v => { state.lvl = v; out.gain.setTargetAtTime(v, ctx.currentTime, 0.02); });
        cursor = host.ui.steps(el, 'Stap', new Array(16).fill(0));
      },
      onStep({ step, time }) {
        if (step % state.div === 0) { const acc = step === 0; tick(time, acc); host.emit(self, 'trigs', { type: 'trig', lane: 'klik', vel: acc ? 1 : 0.7, time }); }
        cursor && cursor.cursor(step);
      },
      onTransport({ playing }) { if (!playing && cursor) cursor.cursor(-1); },
      getState() { return { ...state }; },
      setState(s) { Object.assign(state, { div: s.div ?? 4, lvl: s.lvl ?? 0.5 }); out.gain.value = state.lvl; },
      destroy() { out.disconnect(); }
    };
    return self;
  }
};
```

## 13. Volledig voorbeeld: ontvanger van noten (synthskelet)

```js
onEvent(port, ev) {
  if (ev.type !== 'note') return;
  const t = ev.time, f = 440 * Math.pow(2, (ev.note - 69) / 12);
  osc.frequency.setValueAtTime(f, t);
  vca.gain.cancelScheduledValues(t);
  vca.gain.setValueAtTime(0.0001, t);
  vca.gain.linearRampToValueAtTime(ev.vel * 0.8, t + 0.004);     // attack
  vca.gain.setTargetAtTime(ev.vel * 0.3, t + 0.004, 0.2);         // decay naar sustain
  vca.gain.setTargetAtTime(0.0001, t + (ev.dur || 0.2), 0.01);    // release op gate-einde
}
```

---

## 14. Veelgemaakte fouten

| Fout | Gevolg | Oplossing |
|---|---|---|
| geluid plannen op `ctx.currentTime` in `onStep` | alles klinkt ~100 ms te vroeg en jittert | gebruik `time` uit de callback |
| `outputs` ontbreekt of poort-id klopt niet met `ports` | kabel kan niet worden gelegd | id's in `ports` en `outputs`/`inputs` identiek houden |
| oscillator niet gestopt in `destroy` | CPU en geluid lopen door na verwijderen | `osc.stop()` in `destroy`, in try/catch |
| state bevat de array zelf | host-opslag en instrument delen hetzelfde object | `slice()` / spread in `getState` |
| `setState` vergeet de UI | knoppen tonen oude waarden na laden | bewaar `host.ui.knob`-handles en roep `set(v)` aan |
| exception in `onStep` | hele klok hapert | try/catch binnen `onStep` |
| rechtstreeks `ctx.destination` | dubbel geluid, geen mixerbesturing | alleen via `outputs` |

---

## 15. Validator

`validate-instrument.mjs` wordt naast dit document meegeleverd. Draai `node validate-instrument.mjs mijn-instrument.js`. Hij laadt de module met een nep-AudioContext en een nep-DOM (met Shadow DOM) en controleert, in deze volgorde:

1. **Statisch**: default export; `id` reverse-DNS; `version` semver; `kind` geldig; `ui.width` 200–6000; poort-id's geldig en uniek; geen `ctx.destination` (tenzij `output`), geen browseropslag, geen netwerk, geen `import`, geen eigen `AudioContext`.
2. **Levenscyclus**: `create` → `getState` vóór `mount` → `mount` → `onTransport(start)` → 32 × `onStep` → `onEvent` met note, legato-note, trig, cc en een onbekend type op elke `eventIn`-poort → `onTransport(stop)`.
2c. **Snel en worklets (v1.4)**: parameters met `fast: true` vragen `modInput(id)` die een AudioNode of AudioParam geeft (en `null` voor onbekende ids); modulatoren krijgen `onModTargets([])` en een tweede keer de doelen; `host.modSignal` krijgt een echte AudioNode; `host.loadWorklet` krijgt een naam en code met `registerProcessor(...)`.
2b. **Sturing (v1.3)**: `params()` en `modulate()` samen aanwezig; elke parameter met unieke `id`, `name`, `min < max`, geldige `scale`/`drift`; `modulate` met alles op 1, −1 en 0,37, met onbekende ids en met `{}`. Bij `kind: 'modulator'`: minstens één `modOut`, `onModTargets` met een nepdoel, en `host.modulate` alleen met getallen tussen −1 en 1.
3. **State**: JSON-serialiseerbaar, geen AudioNodes, en `setState(getState())` geeft dezelfde state terug; `setState({})` moet werken.
4. **Opruimen**: `unmount`, dan tweemaal `destroy`; `emit` alleen op gedeclareerde `eventOut`-poorten.

Uitvoer: één regel `OK  Naam versie (id) — …` met exitcode 0, of `FOUT: …` met de eerste fout en exitcode 1. Geschikt om in een agentloop te lezen.

## Bibliotheken en werkruimtes

### Een bibliotheek publiceren
Patchkamer heeft zelf **geen** apparaten; alles komt uit **bronnen**: een GitHub-repo (of een map daarin), een webadres, of een map op de computer. Een bibliotheek is gewoon een map met modules volgens dit contract.

```
mijn-patchkamer-bieb/
  patchkamer.json        (optioneel)
  echo.js
  synths/wolk.js
```

- Zonder `patchkamer.json` laadt Patchkamer elk `.js`/`.mjs`-bestand in de map en de submappen (tot drie niveaus diep). `node_modules`, `test(s)`, `*.test.js` en de validator worden overgeslagen, net als bestanden die geen `export default { … create(…) }` bevatten.
- Met `patchkamer.json` bepaal je het zelf: `{ "name": "Mijn bieb", "modules": ["echo.js", "synths/wolk.js"], "workspaces": [{ "name": "Startpunt", "path": "werkruimtes/startpunt.patchkamer.json" }] }`. `workspaces` (optioneel) zijn startwerkruimtes die in het werkruimtepaneel onder *Uit je bibliotheken* verschijnen; zonder manifest telt elk `*.patchkamer.json`-bestand als werkruimte. Gebruik bestandsnamen zonder spaties. Paden zijn relatief aan het manifest. Voor een gewone webserver (geen GitHub) is het manifest nodig, omdat een webserver geen maplijst geeft.
- Een GitHub-bron haalt de bestanden op via `raw.githubusercontent.com`; de repo moet openbaar zijn.

### Bestanden aan de gebruiker geven (optioneel)
`host.saveFile(bestandsnaam, data)` (data: tekst of Blob) laat de gebruiker een bestand bewaren, ook binnen de gepubliceerde weergave, en geeft `'saved'` of `'declined'`. Controleer eerst of de functie bestaat. Voorbeeld: `hulpmiddelen/opname.js`.

### Wat een werkruimte bewaart
Een werkruimtebestand (`Naam.patchkamer.json`) bevat de naam van de compositie, tempo, swing, beeld, alle apparaten met positie, grootte en `getState()`, de kabels, en per extern instrument **waar het vandaan komt**: `{ id, version, src: { kind, url | path, label } }`. Bij het openen haalt Patchkamer elk ontbrekend instrument van die plek. Code gaat alleen mee voor instrumenten zonder vaste plek (los bestand, geplakte code), of als de gebruiker dat aanvinkt.

Gevolgen voor bouwers:
- Houd **bestandsnaam en pad stabiel**: een werkruimte zoekt op die plek.
- Houd **`id` en poort-id's stabiel** en verhoog `version` bij elke wijziging. Staat er bij het openen een andere versie op de bron, dan gebruikt Patchkamer die en meldt dat. `setState` moet dus de state van eerdere versies accepteren (zie §8).
- Wil je dat oude werkruimtes exact de oude versie krijgen, zet de nieuwe versie dan in een **nieuw bestand** (`echo-1.1.0.js`) en laat het oude staan.

## Bestaande apparaten als referentie

Alle apparaten staan in de map **patchkamer-bibliotheek** (paden hieronder relatief daaraan).


| Apparaat | id | Laat zien |
|---|---|---|
| Tremolo 1.1.0 | `nl.voorbeeld.tremolo` | kleinste effect: audio in/uit, twee knoppen; kleinste bestuurbare apparaat |
| Klik | `nl.voorbeeld.klik` | klok-gestuurd, stuurt trig-gebeurtenissen |
| Drone Synth 1.2.0 | `nl.patchkamer.drone` | bestuurbaar in vijf sporen met een aparte lichte `applyMod()` die toonhoogte en sequencer-gate met rust laat; Shadow DOM met tabbladen, noten- en CC-ingang, stil bij stop |
| Acid 303 · Devil Fish 1.3.0 | `nl.patchkamer.acid303` | eigen sequencer én externe noten, slide via overlappende noten; bestuurbaar groot apparaat in Shadow DOM: `params()` + `modulate()` naast CC-ingang en knoppen |
| Takt Twaalf 1.2.0 | `nl.patchkamer.takt12` | bestuurbaar per track bovenop p-locks; meldt `host.paramsChanged` als een machine of naam verandert; volledige groovebox als module, `host.setTempo` op demoknoppen |
| Drift | `nl.patchkamer.drift` | groot apparaat, state inclusief driftgeneratoren voor exact herstel |
| Monosynth 1.1.0 | `nl.patchkamer.mono` | bestuurbaar: `params()` + `modulate()`, één spoor, log-schaal voor cutoff en decay |
| Drumcomputer 1.1.0 | `nl.patchkamer.drums` | bestuurbaar met een spoor per drumgeluid, leest de state van 1.0.0 |
| Opname | `nl.patchkamer.opname` | audio door, `MediaRecorder` op een `MediaStreamDestination`, `host.saveFile` |
| Notities | `nl.patchkamer.notities` | apparaat zonder poorten of geluid; alleen state |
| Polysynth | `nl.patchkamer.polysynth` | meerstemmig met stemmenbeheer; snelle bussen per parameter die met elke stem verbonden worden |
| String | `nl.patchkamer.string` | instrument als AudioWorklet; noten via `port.postMessage` |
| LFO, MSEG, Macro | `nl.patchkamer.lfo` · `.mseg` · `.macro` | modulatoren met `host.modSignal` (snel) en `host.modulate` (terugval); tempo via `onStep` |
| Filter, Flanger, Resonator, Frequency Shifter | `nl.patchkamer.filter` · `.flanger` · `.resonator` · `.freqshift` | `host.loadWorklet`, terugval zonder worklet, snelle ingang op een worklet-parameter |
| Chorus, Phaser | `nl.patchkamer.chorus` · `.phaser` | effecten met gewone nodes, LFO op tempo |
| Drift · modulator | `nl.patchkamer.driftmod` | `kind: 'modulator'`: `onModTargets`, `host.modulate`, groepen en volgen via `onModSources` |
| Mixer 2.1.0 | `nl.patchkamer.mixer` | `host.setPorts` bij een ander aantal kanalen/groepen, `ui.jacks` met poorten in de strips, leest de state van 1.x en 2.0 |

## 16. Opdrachtformaat voor een bouwende agent

Geef een agent dit document plus een opdracht in deze vorm:

```
Bouw een Patchkamer-instrument volgens contract v1.
Naam: <naam>            id: nl.<domein>.<naam>     versie: <x.y.z>  (nieuwe versie van bestaand id? noem de vorige versie en wat er verandert)
Soort: <instrument|effect|mixer|output|utility>
Poorten: audio in <n>, audio uit <n>, events in <lijst>, events uit <lijst>
Klank/gedrag: <één alinea>
Bedieningselementen: <lijst van knoppen met bereik en standaardwaarde>
Reageert op klok: <ja/nee, wat per stap/maat>
Reageert op gebeurtenissen: <welke types, wat ze doen>
Lever: één .js-bestand; draai de validator en toon de OK-regel.
```

De agent levert het bestand, de validator-uitvoer en drie regels uitleg: wat het doet, hoe je het aansluit, en wat de knoppen betekenen.
