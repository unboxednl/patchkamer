// validate-instrument.mjs — Patchkamer contract v1.6
// Gebruik: node validate-instrument.mjs mijn-instrument.js
// Laadt de module met een nep-AudioContext en een nep-DOM (incl. Shadow DOM), controleert het
// contract en roept create, mount, onStep (2 maten), onEvent, onTransport, getState/setState en
// destroy aan. Eindigt met één OK-regel (exit 0) of de eerste fout (exit 1).
// v1.4: snelle sturing (fast + modInput), host.modSignal, host.loadWorklet; nep-AudioWorklet.
// v1.5: bundels (ports.multiIn/multiOut, bundles, onBundle, host.bundleChanged, host.isWired).
// v1.6: presets (getPreset/setPreset) en: setState() moet de knoppen van host.ui bijwerken.
import { pathToFileURL } from 'node:url';
import { readFileSync } from 'node:fs';

const file = process.argv[2];
if (!file) { console.error('gebruik: node validate-instrument.mjs bestand.js'); process.exit(2); }
const fail = m => { console.error('FOUT:', m); process.exit(1); };

// ---------- fake Web Audio ----------
const param = () => ({ _isParam: true, value: 0, setValueAtTime(){}, linearRampToValueAtTime(){}, exponentialRampToValueAtTime(){}, setTargetAtTime(){}, cancelScheduledValues(){}, cancelAndHoldAtTime(){}, setValueCurveAtTime(){} });
let started = 0, stopped = 0;
const node = () => ({ _isNode: true, _to: new Set(), connect(n){ this._to.add(n); return n; }, disconnect(n){ if (n === undefined) this._to.clear(); else this._to.delete(n); }, start(){ started++; }, stop(){ stopped++; }, setPeriodicWave(){}, addEventListener(){}, removeEventListener(){}, onended: null,
  gain: param(), frequency: param(), Q: param(), detune: param(), pan: param(), delayTime: param(), threshold: param(), ratio: param(), knee: param(), attack: param(), release: param(), offset: param(), playbackRate: param(),
  type: '', fftSize: 2048, frequencyBinCount: 1024, smoothingTimeConstant: 0.8, oversample: 'none', curve: null, buffer: null, loop: false, loopStart: 0, loopEnd: 0, normalize: true,
  getByteTimeDomainData(){}, getByteFrequencyData(){}, getFloatTimeDomainData(){}, getFloatFrequencyData(){} });
const ctx = { currentTime: 0, sampleRate: 44100, state: 'running', destination: node(), resume: async () => {}, suspend: async () => {},
  createGain: node, createOscillator: node, createBiquadFilter: node, createDelay: node, createConvolver: node, createDynamicsCompressor: node, createAnalyser: node, createStereoPanner: node, createWaveShaper: node, createBufferSource: node, createConstantSource: node, createChannelMerger: node, createChannelSplitter: node,
  createBuffer: (ch, len) => ({ numberOfChannels: ch, length: len, getChannelData: () => new Float32Array(Math.min(len || 1024, 1 << 16)) }),
  createMediaStreamDestination: () => Object.assign(node(), { stream: {} }), createPeriodicWave: () => ({}),
  audioWorklet: { addModule: async () => {} } };
// AudioWorkletNode: parameters als Map van AudioParams, een port die niets doet
globalThis.AudioWorkletNode = class { constructor(c, name, opts) { Object.assign(this, node()); this.port = { postMessage(){}, onmessage: null, start(){}, close(){}, addEventListener(){} }; const P = new Map(); this.parameters = { get: k => { if (!P.has(k)) P.set(k, param()); return P.get(k); }, has: () => true, forEach(){} }; } };

// ---------- fake DOM (permissive: enough for real device UIs, including shadow roots) ----------
const classList = () => { const s = new Set(); return { add: (...c) => c.forEach(x => s.add(x)), remove: (...c) => c.forEach(x => s.delete(x)), toggle: (c, f) => { const on = f === undefined ? !s.has(c) : !!f; on ? s.add(c) : s.delete(c); return on; }, contains: c => s.has(c) }; };
function el(tag = 'div') {
  const ids = new Map();
  const e = {
    tagName: String(tag).toUpperCase(), nodeType: 1, children: [], childNodes: [], style: { setProperty(){}, removeProperty(){} }, dataset: {}, classList: classList(), attributes: {},
    textContent: '', innerText: '', value: '', checked: false, disabled: false, hidden: false, title: '', id: '', className: '', type: '', min: '', max: '', step: '', htmlFor: '', tabIndex: 0,
    width: 300, height: 150, clientWidth: 300, clientHeight: 150, offsetWidth: 300, offsetHeight: 150, scrollWidth: 300, scrollHeight: 150,
    parentElement: null, parentNode: null, shadowRoot: null,
    get firstChild(){ return this.children[0] || null; }, get lastChild(){ return this.children[this.children.length - 1] || null; },
    setAttribute(k, v){ this.attributes[k] = String(v); }, getAttribute(k){ return this.attributes[k] ?? null; }, removeAttribute(k){ delete this.attributes[k]; }, hasAttribute(k){ return k in this.attributes; },
    appendChild(c){ this.children.push(c); this.childNodes.push(c); if (c && typeof c === 'object') { c.parentElement = this; c.parentNode = this; } return c; },
    append(...cs){ cs.forEach(c => this.appendChild(c)); }, prepend(...cs){ cs.forEach(c => this.appendChild(c)); }, insertBefore(c){ return this.appendChild(c); }, replaceChildren(...cs){ this.children = []; cs.forEach(c => this.appendChild(c)); },
    removeChild(c){ this.children = this.children.filter(x => x !== c); this.childNodes = this.childNodes.filter(x => x !== c); return c; }, remove(){}, replaceWith(){}, cloneNode(){ return el(tag); },
    addEventListener(){}, removeEventListener(){}, dispatchEvent(){ return true; }, focus(){}, blur(){}, click(){ if (typeof this.onclick === 'function') this.onclick({ preventDefault(){}, stopPropagation(){} }); }, select(){},
    setPointerCapture(){}, releasePointerCapture(){}, scrollIntoView(){}, closest(){ return null; }, matches(){ return false; },
    querySelector(){ return el('div'); }, querySelectorAll(){ return []; }, getElementsByTagName(){ return []; }, getElementsByClassName(){ return []; },
    getElementById(id){ if (!ids.has(id)) { const x = el('div'); x.parentElement = x.parentNode = el('div'); x.id = id; ids.set(id, x); } return ids.get(id); },   // elements from markup always have a parent
    getBoundingClientRect(){ return { left: 0, top: 0, right: 300, bottom: 150, width: 300, height: 150, x: 0, y: 0 }; },
    getContext(){ return new Proxy({}, { get: (t, k) => (k in t ? t[k] : () => ({ addColorStop(){} })), set: (t, k, v) => { t[k] = v; return true; } }); },
    attachShadow(){ const r = el('#shadow-root'); this.shadowRoot = r; r.host = this; return r; },
    set innerHTML(v){ this._html = String(v); }, get innerHTML(){ return this._html || ''; },
    options: [], selectedIndex: 0, files: [], add(){},
  };
  return e;
}
globalThis.document = { createElement: el, createElementNS: (ns, t) => el(t), createTextNode: t => ({ nodeType: 3, textContent: t }), createDocumentFragment: () => el('#fragment'), getElementById: () => el('div'), querySelector: () => el('div'), querySelectorAll: () => [], addEventListener(){}, removeEventListener(){}, body: el('body'), documentElement: el('html') };
globalThis.window = globalThis;
globalThis.requestAnimationFrame = () => 0; globalThis.cancelAnimationFrame = () => {};
globalThis.ResizeObserver = class { observe(){} unobserve(){} disconnect(){} };
globalThis.devicePixelRatio = 1;
globalThis.getComputedStyle = () => ({ getPropertyValue: () => '' });
if (!globalThis.performance) globalThis.performance = { now: () => Date.now() };
const realSetTimeout = setTimeout; globalThis.setTimeout = (f, ms) => 0; globalThis.clearTimeout = () => {}; globalThis.setInterval = () => 0; globalThis.clearInterval = () => {};

// ---------- fake host ----------
let emitted = [], tempo = null, curPorts = null, jacks = 0, portChanges = 0, modSent = 0, modBad = null, sigCalls = 0, worklets = 0, bundleCalls = 0;
const KNOBS = [];   // {label, sets} — alles wat via host.ui.knob/select gemaakt is
const PL = (P, k) => Array.isArray(P[k]) ? P[k] : [];
const host = { ctx, bpm: 120, swing: 0, emit(inst, port, ev) { emitted.push({ port, ev }); }, setTempo(b) { tempo = b; },
  modulate(inst, targetId, offsets) { modSent++; if (!offsets || typeof offsets !== 'object') modBad = 'host.modulate(): offsets moet een object zijn'; else for (const k in offsets) if (!(typeof offsets[k] === 'number' && isFinite(offsets[k]) && offsets[k] >= -1 && offsets[k] <= 1)) modBad = `host.modulate(): offset ${k} moet een getal tussen -1 en 1 zijn`; },
  paramsChanged() {},
  // v1.4
  modSignal(inst, targetId, paramId, n) { sigCalls++; if (n === null) return false; if (!n || typeof n.connect !== 'function') modBad = 'host.modSignal(): node moet een AudioNode zijn'; return paramId === 'a'; },
  loadWorklet(name, code) { worklets++; if (typeof name !== 'string' || !name) modBad = 'host.loadWorklet(): geef een naam'; if (typeof code !== 'string' || !/registerProcessor\s*\(/.test(code)) modBad = 'host.loadWorklet(): code moet registerProcessor(...) bevatten'; return Promise.resolve(true); },
  // v1.5
  bundleChanged(inst, port) { bundleCalls++; if (!PL(curPorts || d.ports, 'multiOut').some(p => p.id === port)) modBad = `host.bundleChanged(): "${port}" is geen multiOut-poort`; },
  isWired() { return false; },
  saveFile: async () => 'saved',
  stepDur: () => 0.125,
  setPorts(inst, ports) {   // contract v1.2: dynamic ports; every listed audio port must already have its AudioNode
    if (!ports || typeof ports !== 'object') fail('setPorts(): ports ontbreekt');
    for (const k of ['audioIn', 'audioOut', 'eventIn', 'eventOut']) { if (!Array.isArray(ports[k])) fail(`setPorts(): ports.${k} moet een lijst zijn`); const ids = ports[k].map(p => p.id); if (ids.some(x => !/^[a-z0-9_-]+$/.test(x || ''))) fail(`setPorts(): ongeldige poort-id in ${k}`); if (new Set(ids).size !== ids.length) fail(`setPorts(): dubbele poort-id in ${k}`); }
    for (const k of ['modIn', 'modOut', 'multiIn', 'multiOut']) if (ports[k] !== undefined && !Array.isArray(ports[k])) fail(`setPorts(): ports.${k} moet een lijst zijn`);
    for (const p of ports.audioIn) if (!inst.inputs[p.id] || !inst.inputs[p.id]._isNode) fail(`setPorts(): inputs.${p.id} bestaat nog niet; zet eerst de AudioNode klaar`);
    for (const p of ports.audioOut) if (!inst.outputs[p.id] || !inst.outputs[p.id]._isNode) fail(`setPorts(): outputs.${p.id} bestaat nog niet; zet eerst de AudioNode klaar`);
    curPorts = ports; portChanges++; },
  ui: { jack(inst, parent, id, dir) { const P = curPorts || d.ports; const L = dir === 'out' ? [...P.audioOut, ...P.eventOut, ...PL(P, 'modOut'), ...PL(P, 'multiOut')] : dir === 'in' ? [...P.audioIn, ...P.eventIn, ...PL(P, 'modIn'), ...PL(P, 'multiIn'), ...(inst && typeof inst.params === 'function' ? [{ id: 'mod' }] : [])] : fail(`jack(): richting moet 'in' of 'out' zijn`); if (!L.some(p => p.id === id)) fail(`jack(): poort "${id}" (${dir}) bestaat niet in de huidige poorten`); jacks++; const e = el('div'); e.className = 'port jack'; if (parent && parent.appendChild) parent.appendChild(e); return e; },
    knob: (parent, label) => { const k = { label: 'knop ' + label, sets: 0 }; KNOBS.push(k); return { set(){ k.sets++; } }; },
    select: (parent, label, opts, val) => { const k = { label: 'keuze ' + label, sets: 0 }; KNOBS.push(k); const s = el('select'); let v = val; Object.defineProperty(s, 'value', { get: () => v, set: x => { v = x; k.sets++; } }); return s; }, steps: () => ({ btns: [], paint(){}, cursor(){} }), noise: () => node(), curve: () => new Float32Array(16) } };

// ---------- load + static checks ----------
const src = readFileSync(file, 'utf8');
const mod = await import(pathToFileURL(file).href).catch(e => fail('module laadt niet: ' + e.message));
const d = mod.default; if (!d) fail('geen default export');
for (const k of ['id', 'name', 'version', 'kind', 'ports', 'create']) if (d[k] === undefined) fail(`veld "${k}" ontbreekt`);
if (!/^[a-z0-9]+(\.[a-z0-9-]+)+$/.test(d.id)) fail('id moet reverse-DNS zijn, bv. nl.naam.instrument');
if (!/^\d+\.\d+\.\d+$/.test(d.version)) fail('version moet semver zijn (x.y.z)');
if (!['instrument', 'effect', 'mixer', 'output', 'utility', 'modulator'].includes(d.kind)) fail('onbekende kind');
if (d.ui !== undefined && (typeof d.ui !== 'object' || (d.ui.width !== undefined && !(d.ui.width >= 200 && d.ui.width <= 6000)))) fail('ui.width moet tussen 200 en 6000 liggen');
if (d.category !== undefined && !['synth', 'groove', 'sequencer', 'mod', 'effect', 'mix', 'tool'].includes(d.category)) fail('onbekende category (synth, groove, sequencer, mod, effect, mix of tool)');
if (d.ui && d.ui.minWidth !== undefined && !(d.ui.minWidth >= 200 && d.ui.minWidth <= (d.ui.width || 300))) fail('ui.minWidth moet tussen 200 en ui.width liggen');
for (const k of ['modIn', 'modOut', 'multiIn', 'multiOut']) if (d.ports[k] === undefined) d.ports[k] = [];
for (const k of ['audioIn', 'audioOut', 'eventIn', 'eventOut', 'modIn', 'modOut', 'multiIn', 'multiOut']) { if (!Array.isArray(d.ports[k])) fail(`ports.${k} moet een lijst zijn`); const ids = d.ports[k].map(p => p.id); if (ids.some(x => !/^[a-z0-9_-]+$/.test(x || ''))) fail(`ongeldige poort-id in ${k}`); if (new Set(ids).size !== ids.length) fail(`dubbele poort-id in ${k}`); }
if (d.kind !== 'output' && /\.destination\b/.test(src)) fail('gebruikt ctx.destination maar kind is niet output');
if (/\blocalStorage\b|\bsessionStorage\b|\bindexedDB\b/.test(src)) fail('gebruikt browseropslag; state hoort via getState/setState');
if (/\bfetch\s*\(|\bXMLHttpRequest\b|\bWebSocket\b/.test(src)) fail('doet netwerkverkeer');
if (/^\s*import\s/m.test(src) || /\bimport\s*\(/.test(src)) fail('importeert andere modules; alles moet in één bestand');
if (/new\s+(window\.)?(webkit)?AudioContext/.test(src)) fail('maakt een eigen AudioContext');

// ---------- lifecycle ----------
let inst; try { inst = d.create(ctx, host); } catch (e) { fail('create() gooit: ' + e.message); }
for (const k of ['mount', 'getState', 'setState', 'destroy']) if (typeof inst[k] !== 'function') fail(`instance.${k} ontbreekt`);
if (typeof inst.inputs !== 'object' || typeof inst.outputs !== 'object') fail('inputs/outputs moeten objecten zijn');
for (const p of d.ports.audioIn) if (!inst.inputs[p.id] || !inst.inputs[p.id]._isNode) fail(`inputs.${p.id} ontbreekt of is geen AudioNode`);
for (const p of d.ports.audioOut) if (!inst.outputs[p.id] || !inst.outputs[p.id]._isNode) fail(`outputs.${p.id} ontbreekt of is geen AudioNode`);
let pre; try { pre = inst.getState(); JSON.stringify(pre); } catch (e) { fail('getState() vóór mount faalt: ' + e.message); }
try { inst.mount(el('div')); } catch (e) { fail('mount() gooit: ' + e.message + '\n' + (e.stack || '').split('\n').slice(1, 3).join('\n')); }
const nMountKnobs = KNOBS.length;
// ---------- contract v1.3: modulation ----------
let nParams = 0, nLanes = 0, nFast = 0;
if (inst.params !== undefined || inst.modulate !== undefined) {
  if (typeof inst.params !== 'function' || typeof inst.modulate !== 'function') fail('params() en modulate() horen bij elkaar: implementeer beide');
  let P; try { P = inst.params(); } catch (e) { fail('params() gooit: ' + e.message); }
  if (!Array.isArray(P) || !P.length) fail('params() moet een niet-lege lijst geven');
  const seen = new Set();
  for (const p of P) { if (!p || typeof p.id !== 'string' || !p.id) fail('params(): elke parameter heeft een id (string)'); if (seen.has(p.id)) fail(`params(): dubbele id ${p.id}`); seen.add(p.id);
    if (typeof p.name !== 'string') fail(`params(): ${p.id} mist name`); if (typeof p.min !== 'number' || typeof p.max !== 'number' || !(p.max > p.min)) fail(`params(): ${p.id} heeft min < max nodig`);
    if (p.drift !== undefined && !(p.drift >= 0 && p.drift <= 1)) fail(`params(): ${p.id}.drift moet tussen 0 en 1 liggen`); if (p.scale !== undefined && !['lin', 'log'].includes(p.scale)) fail(`params(): ${p.id}.scale is lin of log`); }
  try { JSON.stringify(P); } catch (e) { fail('params() moet gewone data zijn'); }
  nParams = P.length; nLanes = new Set(P.map(p => p.lane || '')).size;
  for (const v of [1, -1, 0.37]) { try { inst.modulate(Object.fromEntries(P.map(p => [p.id, v]))); } catch (e) { fail(`modulate(alles ${v}) gooit: ` + e.message); } }
  try { inst.modulate({ onbekend: 0.5 }); inst.modulate({}); } catch (e) { fail('modulate() moet onbekende ids negeren en {} accepteren: ' + e.message); }
  // contract v1.4: snelle parameters
  const fast = P.filter(p => p.fast); nFast = fast.length;
  if (fast.length) { if (typeof inst.modInput !== 'function') fail('parameters met fast:true vragen modInput(paramId)');
    for (const p of fast) { let n; try { n = inst.modInput(p.id); } catch (e) { fail(`modInput(${p.id}) gooit: ` + e.message); } if (!n || !(n._isNode || n._isParam)) fail(`modInput(${p.id}) moet een AudioNode of AudioParam geven (fast:true)`); }
    let u; try { u = inst.modInput('onbekend'); } catch (e) { fail('modInput(onbekend) gooit: ' + e.message); } if (u != null) fail('modInput() moet null geven voor een onbekende of trage parameter'); }
}
if (d.kind === 'modulator') {
  if (!d.ports.modOut.length) fail('een modulator heeft minstens één ports.modOut');
  if (typeof inst.onModTargets !== 'function') fail('een modulator implementeert onModTargets(targets)');
  inst._id = 'm1';
  const fakeT = [{ id: 'd9', name: 'Test', def: 'nl.test.x', version: '1.0.0', params: [{ id: 'a', name: 'A', lane: 'x', laneName: 'X', min: 0, max: 1, role: 'filter', drift: 0.1, on: true }, { id: 'b', name: 'B', lane: 'y', min: 20, max: 20000, scale: 'log' }] }];
  try { inst.onModTargets([]); inst.onModTargets(fakeT); inst.onModTargets(fakeT); } catch (e) { fail('onModTargets() gooit: ' + e.message); }
  if (inst.onModSources) { try { inst.onModSources([]); } catch (e) { fail('onModSources() gooit: ' + e.message); } }
}
if (inst.onTransport) { try { inst.onTransport({ playing: true }); } catch (e) { fail('onTransport(start) gooit: ' + e.message); } }
if (inst.onStep) for (let s = 0; s < 32; s++) { ctx.currentTime = s * 0.125; try { inst.onStep({ step: s % 16, bar: Math.floor(s / 16), time: 0.1 + s * 0.125, stepDur: 0.125, bpm: 120, swing: 0 }); } catch (e) { fail('onStep() gooit bij stap ' + s + ': ' + e.message); } }
if (inst.onEvent) for (const ev of [{ type: 'note', note: 60, vel: 0.8, time: 4.5, dur: 0.2 }, { type: 'note', note: 63, vel: 1, time: 4.6, dur: 0.2 }, { type: 'trig', lane: 'kick', vel: 1, time: 4.7 }, { type: 'cc', id: 'cutoff', value: 0.5, time: 4.8 }, { type: 'onbekend', time: 4.9 }])
  for (const p of (d.ports.eventIn.length ? d.ports.eventIn : [{ id: 'in' }])) { try { inst.onEvent(p.id, ev); } catch (e) { fail(`onEvent(${p.id}) gooit op ${ev.type}: ` + e.message); } }
if (inst.onTransport) { try { inst.onTransport({ playing: false }); } catch (e) { fail('onTransport(stop) gooit: ' + e.message); } }
let st; try { st = inst.getState(); } catch (e) { fail('getState() gooit: ' + e.message); }
let json; try { json = JSON.stringify(st); } catch (e) { fail('getState() is niet JSON-serialiseerbaar: ' + e.message); }
if (json.includes('_isNode')) fail('getState() bevat AudioNodes');
try { inst.setState(JSON.parse(json)); } catch (e) { fail('setState(getState()) gooit: ' + e.message); }
let st2; try { st2 = JSON.stringify(inst.getState()); } catch (e) { fail('getState() na setState faalt: ' + e.message); }
const norm = s => s.replace(/"(driftT|gen|walk|wv|ph)":[^,}\]]+/g, '');   // drifting clocks may advance; compare the rest
if (norm(st2) !== norm(json)) fail('setState(getState()) herstelt niet dezelfde state');
// contract v1.6: knoppen volgen setState (presets en versiewissel leunen daarop)
const knobCheck = (how, fn) => { const before = KNOBS.length; KNOBS.forEach(k => { k.sets = 0; }); fn(); const fresh = KNOBS.length > before;
  const stale = KNOBS.slice(0, before).filter(k => !k.sets).map(k => k.label);
  if (!fresh && stale.length) fail(`${how} werkt deze knoppen niet bij: ${stale.join(', ')} — bewaar wat host.ui.knob/select teruggeeft en zet de waarde in setState (knop.set(v), select.value = v)`); };
knobCheck('setState(getState())', () => inst.setState(JSON.parse(json)));
// contract v1.6: presets
let presetBytes = 0;
if (inst.getPreset !== undefined || inst.setPreset !== undefined) {
  if (typeof inst.getPreset !== 'function' || typeof inst.setPreset !== 'function') fail('getPreset() en setPreset() horen bij elkaar: implementeer beide');
  let p; try { p = inst.getPreset(); } catch (e) { fail('getPreset() gooit: ' + e.message); }
  let pj; try { pj = JSON.stringify(p); } catch (e) { fail('getPreset() is niet JSON-serialiseerbaar: ' + e.message); } if (pj.includes('_isNode')) fail('getPreset() bevat AudioNodes'); presetBytes = pj.length;
  knobCheck('setPreset(getPreset())', () => { try { inst.setPreset(JSON.parse(pj)); } catch (e) { fail('setPreset(getPreset()) gooit: ' + e.message); } });
  let p2; try { p2 = JSON.stringify(inst.getPreset()); } catch (e) { fail('getPreset() na setPreset faalt: ' + e.message); }
  if (norm(p2) !== norm(pj)) fail('setPreset(getPreset()) herstelt niet dezelfde preset');
  try { inst.setPreset({}); } catch (e) { fail('setPreset({}) gooit: ' + e.message); }
}
try { inst.setState({}); } catch (e) { fail('setState({}) gooit (ontbrekende velden moeten standaardwaarden krijgen): ' + e.message); }
// contract v1.5: bundels uit
let nBundleCh = 0;
for (const p of d.ports.multiOut) {
  const b = inst.bundles && inst.bundles[p.id]; if (!b) fail(`multiOut "${p.id}": instance.bundles.${p.id} ontbreekt`);
  let v; try { v = typeof b === 'function' ? b() : b; } catch (e) { fail(`bundles.${p.id}() gooit: ` + e.message); }
  if (!v || !Array.isArray(v.channels)) fail(`bundles.${p.id} moet {label, channels:[{id, name, node}]} geven`);
  const ids = v.channels.map(c => c && c.id); if (ids.some(x => typeof x !== 'string' || !x)) fail(`bundles.${p.id}: elk kanaal heeft een id (string)`); if (new Set(ids).size !== ids.length) fail(`bundles.${p.id}: dubbele kanaal-id`);
  for (const c of v.channels) { if (typeof c.name !== 'string') fail(`bundles.${p.id}: kanaal ${c.id} mist name`); if (!c.node || !c.node._isNode) fail(`bundles.${p.id}: kanaal ${c.id} heeft geen AudioNode in node`); }
  nBundleCh += v.channels.length;
}
// contract v1.5: bundels in — aansluiten, wijzigen, los; daarna mag niets meer verbonden zijn
for (const p of d.ports.multiIn) {
  if (typeof inst.onBundle !== 'function') fail(`multiIn "${p.id}": instance.onBundle(poortId, sleutel, bundel) ontbreekt`);
  const ch = n => Array.from({ length: n }, (_, i) => ({ id: 'k' + i, name: 'Kanaal ' + i, node: node() }));
  const B1 = ch(3), B2 = [...B1, ...ch(4).slice(3)], key = 'd9:uit';
  const mk = c => ({ key, source: { id: 'd9', port: 'uit', name: 'Test' }, label: 'Test', channels: c });
  try { inst.onBundle(p.id, key, mk(B1)); inst.onBundle(p.id, key, mk(B2)); inst.onBundle(p.id, 'd8:uit', { ...mk(ch(2)), key: 'd8:uit' }); } catch (e) { fail(`onBundle(${p.id}, bundel) gooit: ` + e.message); }
  let js; try { js = JSON.stringify(inst.getState()); } catch (e) { fail('getState() na onBundle faalt: ' + e.message); } if (js.includes('_isNode')) fail('getState() bevat AudioNodes uit een bundel; bewaar sleutel + kanaal-id');
  try { inst.onBundle(p.id, key, null); inst.onBundle(p.id, 'd8:uit', null); } catch (e) { fail(`onBundle(${p.id}, null) gooit: ` + e.message); }
  const still = B2.filter(c => c.node._to.size); if (still.length) fail(`onBundle(null) laat ${still.length} kanaal/kanalen verbonden; ontkoppel wat je verbond (node.disconnect(jouwIngang))`);
}
try { if (inst.unmount) inst.unmount(); inst.destroy(); inst.destroy(); } catch (e) { fail('destroy() gooit (moet idempotent zijn): ' + e.message); }
for (const port of emitted.map(x => x.port)) if (!d.ports.eventOut.some(p => p.id === port)) fail(`emit op onbekende eventOut-poort "${port}"`);
if (d.ui && d.ui.jacks && jacks === 0) fail('ui.jacks is aan maar er is geen enkele host.ui.jack() geplaatst');
if (modBad) fail(modBad);
const nKnobs = nMountKnobs;
console.log(`OK  ${d.name} ${d.version} (${d.id}) — kind ${d.kind}${d.ui && d.ui.width ? ', breedte ' + d.ui.width + ' px' : ''}, poorten: audio ${d.ports.audioIn.length}→${d.ports.audioOut.length}, events ${d.ports.eventIn.length}→${d.ports.eventOut.length}, state ${json.length} bytes, bronnen gestart ${started}${jacks ? ', ' + jacks + ' jacks' : ''}${portChanges ? ', ' + portChanges + '× setPorts' : ''}${emitted.length ? ', ' + emitted.length + ' gebeurtenissen' : ''}${nParams ? `, ${nParams} stuurbare parameters in ${nLanes} spo${nLanes > 1 ? 'ren' : 'or'}` : ''}${nFast ? `, ${nFast} snel` : ''}${d.kind === 'modulator' ? ', modulator' + (sigCalls ? ` (modSignal ${sigCalls}×)` : '') : ''}${worklets ? `, ${worklets} worklet${worklets > 1 ? 's' : ''}` : ''}${d.ports.multiOut.length ? `, bundel uit ${nBundleCh} kanalen` : ''}${d.ports.multiIn.length ? ', bundel in' : ''}${presetBytes ? `, eigen preset ${presetBytes} bytes` : ''}${nKnobs ? `, ${nKnobs} host-knoppen volgen setState` : ''}`);
process.exit(0);
