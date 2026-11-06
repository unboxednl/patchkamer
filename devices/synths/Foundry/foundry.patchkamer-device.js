// SPDX-License-Identifier: AGPL-3.0-or-later
// 1.11.1 — Gecontroleerd op stuurbaarheid: alle continue klankregelaars stonden al in params(). Bewust niet stuurbaar: Morph A ↔ B (die schrijft de knopstanden zelf om
//   en dat is state, geen modulatie; vandaar modExclude). Geluid en instellingen ongewijzigd.
// 1.11.0 — Nieuw als Foundry (nieuwe id nl.patchkamer.foundry, eigen map), bijgewerkt naar Patchkamer contract v1.11. Het geluid is ongewijzigd:
//   - tweetalig (host.lang, namen per taal in i18n); de naam is in alle talen Foundry
//   - tekenen via host.frame (XY-vlak en scope), met ResizeObserver en een kleurcache; de eigen tekenpoort is weg
//   - setState volgt §13: onbekende velden genegeerd, ongeldige waarden op de standaard, getallen binnen het bereik afgekapt
//   - dubbelklik op een schuif zet hem terug op de beginwaarde (data-pk-default); de hele UI staat in een open shadow root
//   - de vervormers volgen host.audio.oversample (bij Normaal gelijk aan vroeger)
//   - de naam van een eigen klank in de state is Custom (de oude schrijfwijze wordt nog gelezen)
//   - bewaker tegen een vergiftigde keten: een niet-eindige of absurde waarde op de ingang (NaN, ±Infinity) bleef in de terugkoppelende
//     resonatoren en filters hangen en liet het apparaat voor altijd stil of NaN; nu blokkeert een meter de ingang zolang hij ongeldig is
//     en bouwt de keten achter de bronnen opnieuw op. Geluid in het normale gebied is ongewijzigd (bit-identiek).
//   - de terugkoppeling van de resonatoren is begrensd op 0,82 (bij Resonator-mix boven ~94%): daarboven werd de lus instabiel en groeide het
//     signaal in de resonatoren binnen seconden tot 1e19 of meer en uiteindelijk tot Infinity en NaN, waarna het apparaat voor altijd stil bleef;
//     de vervormer en de begrenzer achter de resonatoren verborgen dat. Het niveau van de resonatoren (wet) is ongewijzigd.
// Een industriële klankvormer met alleen native Web Audio: gecascadeerde FM, ringmodulatie, ruis, vier materiaalresonatoren,
// parallelle overdrive en wavefolding, een uitgangsfilter, beweging en ruimte. Mono: noten van buiten of toetsen, drone met transport,
// extern geluid als materiaal. Het XY-vlak bewerkt de basisregelaars; paarse modulatie staat apart en wordt nooit als basis bewaard.
// Twee klanken (A en B) en Morph interpoleren tussen de echte regelaars.

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const finite = (v, d, a, b) => typeof v === 'number' && Number.isFinite(v) ? clamp(v, a, b) : d;

const EN = {
  'Dronefrequentie': 'Drone frequency', 'Transpositie': 'Transpose', 'FM-intensiteit': 'FM amount', 'FM-verhouding': 'FM ratio',
  'Ringmodulatie': 'Ring modulation', 'Ringfrequentie': 'Ring frequency', 'Ruis / schuren': 'Noise / scrape', 'Extern materiaal': 'External material',
  'Resonator-mix': 'Resonator mix', 'Corpusfrequentie': 'Body frequency', 'Demping / helderheid': 'Damping / brightness', 'Ruwheid / drive': 'Roughness / drive',
  'Wavefold-mix': 'Wavefold mix', 'Uitgangsfilter': 'Output filter', 'Filterresonantie': 'Filter resonance', 'Cyclische beweging': 'Cyclic motion',
  'Bewegingssnelheid': 'Motion rate', 'Onregelmatige drift': 'Irregular drift', 'Ruimte / echo': 'Space / echo', 'Stereobreedte': 'Stereo width',
  'Opkomst': 'Attack', 'Uitklank': 'Release', 'Uitgang': 'Output',
  'Bronnen': 'Sources', 'Materiaal': 'Material', 'Beweging': 'Motion', 'Envelope / niveau': 'Envelope / level',
  'Bronnen & frequenties': 'Sources & frequencies', 'Materiaal & vervorming': 'Material & distortion', 'Beweging & ruimte': 'Motion & space', 'Envelope & niveau': 'Envelope & level',
  'Klankbeeld': 'Sound', 'Eigen sculptuur': 'Custom sculpture', 'Spel': 'Play mode', 'Metalen slag': 'Metal strike', 'Alles uit': 'All off', 'Muteer klank': 'Mutate sound',
  'X-as': 'X axis', 'Y-as': 'Y axis', 'Bewaar A': 'Save A', 'Bewaar B': 'Save B', 'Herstel A': 'Recall A', 'Herstel B': 'Recall B',
  'Staal': 'Steel', 'Glas': 'Glass', 'Beton': 'Concrete', 'Kabel / snaar': 'Cable / string', 'Bron': 'Source', 'Golfvorm': 'Waveform', 'Uit': 'Off',
  'FM, metaalresonanties, ruis, ringmodulatie en wavefolding. Begin met Start drone en sculpt met het XY-vlak.':
    'FM, metal resonances, noise, ring modulation and wavefolding. Start with Start / stop drone and sculpt with the XY pad.',
  'XY sound sculptor: pijltjestoetsen wijzigen X en Y': 'XY sound sculptor: arrow keys change X and Y',
  'Gemeten stereo-uitgang, ': 'Measured stereo output, ',
  'Modulatie actief · oranje marker = basis, paars = effectieve klank': 'Modulation active · orange marker = base, purple = effective sound',
  'Sleep in het XY-vlak. Start Drone of sluit noten aan in Noten-modus.': 'Drag in the XY pad. Start the drone, or connect notes in notes mode.',
  'Mod gereed · de knoppen blijven je basis': 'Mod ready · the knobs stay your base',
  'A/B: bewaar twee klanken en beweeg Morph. Muteer verandert de klank, niet het uitgangsniveau. In Noten-modus: keyboard of sequencer → oranje ingang. Een paarse Mod-kabel werkt ook zonder transport. Extern geluid: bron → Extern materiaal, zet de gelijknamige regelaar open en start de drone/gate.':
    'A/B: save two sounds and move Morph. Mutate changes the sound, not the output level. In notes mode: keyboard or sequencer → orange input. A purple Mod cable also works without transport. External sound: source → External material, open the knob of the same name and start the drone/gate.',
};

// spec: [label, min, max, stap, standaard, eenheid, schaal, rol, rij]
const spec = {
  pitch: ['Dronefrequentie', 30, 1600, 1, 110, 'Hz', 'log', 'pitch', 'source'], tune: ['Transpositie', -24, 24, 0.1, 0, 'st', 'lin', 'pitch', 'source'],
  fm: ['FM-intensiteit', 0, 12, 0.01, 2.5, 'x', 'lin', 'color', 'source'], ratio: ['FM-verhouding', 0.125, 12, 0.005, 2.715, 'x', 'log', 'pitch', 'source'],
  ring: ['Ringmodulatie', 0, 1, 0.01, 0.35, '%', 'lin', 'color', 'source'], ringHz: ['Ringfrequentie', 0.1, 2400, 0.1, 137, 'Hz', 'log', 'pitch', 'source'],
  noise: ['Ruis / schuren', 0, 1, 0.01, 0.18, '%', 'lin', 'texture', 'source'], external: ['Extern materiaal', 0, 1, 0.01, 0, '%', 'lin', 'level', 'source'],
  metal: ['Resonator-mix', 0, 1, 0.01, 0.6, '%', 'lin', 'color', 'material'], body: ['Corpusfrequentie', 35, 1200, 1, 170, 'Hz', 'log', 'pitch', 'material'],
  damping: ['Demping / helderheid', 200, 10000, 10, 4200, 'Hz', 'log', 'filter', 'material'], drive: ['Ruwheid / drive', 0, 1, 0.01, 0.55, '%', 'lin', 'color', 'material'],
  fold: ['Wavefold-mix', 0, 1, 0.01, 0.3, '%', 'lin', 'color', 'material'], cutoff: ['Uitgangsfilter', 80, 14000, 10, 6200, 'Hz', 'log', 'filter', 'material'],
  resonance: ['Filterresonantie', 0.2, 6, 0.1, 0.8, 'Q', 'lin', 'res', 'material'], motion: ['Cyclische beweging', 0, 1, 0.01, 0.25, '%', 'lin', 'motion', 'motion'],
  rate: ['Bewegingssnelheid', 0.03, 16, 0.01, 0.23, 'Hz', 'log', 'motion', 'motion'], chaos: ['Onregelmatige drift', 0, 1, 0.01, 0.18, '%', 'lin', 'motion', 'motion'],
  space: ['Ruimte / echo', 0, 1, 0.01, 0.35, '%', 'lin', 'space', 'motion'], width: ['Stereobreedte', 0, 1, 0.01, 0.8, '%', 'lin', 'pan', 'motion'],
  attack: ['Opkomst', 0.001, 4, 0.001, 0.35, 's', 'log', 'env', 'play'], decay: ['Decay', 0.02, 6, 0.01, 0.8, 's', 'log', 'decay', 'play'],
  sustain: ['Sustain', 0, 1, 0.01, 0.8, '%', 'lin', 'env', 'play'], release: ['Uitklank', 0.02, 12, 0.01, 2, 's', 'log', 'decay', 'play'],
  level: ['Uitgang', 0, 1, 0.01, 0.65, '%', 'lin', 'level', 'play'],
};
const defaults = {
  ...Object.fromEntries(Object.entries(spec).map(([k, d]) => [k, d[4]])),
  mode: 'drone', wave: 'triangle', material: 'steel', preset: 'Steel Mill', xAxis: 'fm', yAxis: 'fold', scope: 'wave', sceneA: '', sceneB: '', morph: 0, seed: 74231,
};
const CHOICES = { mode: ['drone', 'notes'], wave: ['sine', 'triangle', 'sawtooth', 'square'], scope: ['wave', 'spectrum', 'off'] };
const materials = { steel: [1, 1.414, 2.756, 4.113], glass: [1, 2.32, 4.25, 6.63], concrete: [1, 1.125, 1.7, 2.41], cable: [1, 2, 3, 4] };
const presets = {
  'Steel Mill': {},
  'Broken Servo': { pitch: 83, fm: 5.2, ratio: 1.137, ring: 0.65, ringHz: 63, noise: 0.1, metal: 0.4, drive: 0.8, fold: 0.65, motion: 0.75, rate: 5.8, chaos: 0.55, space: 0.15 },
  'Rust Drone': { pitch: 48, fm: 1.6, ratio: 0.713, noise: 0.38, body: 93, material: 'concrete', damping: 1600, drive: 0.65, fold: 0.15, cutoff: 2300, chaos: 0.45, rate: 0.07, space: 0.6 },
  'Glass Factory': { pitch: 220, fm: 3.7, ratio: 3.141, material: 'glass', body: 380, metal: 0.9, ring: 0.7, ringHz: 419, noise: 0.03, damping: 8000, cutoff: 11000, fold: 0.65, space: 0.55 },
  'Power Grid': { pitch: 50, fm: 2, ratio: 2, ring: 0.8, ringHz: 100, noise: 0.08, drive: 0.8, fold: 0.45, material: 'cable', body: 100, motion: 0.05, chaos: 0.04, space: 0.2 },
  'Industrial Kick': { mode: 'notes', pitch: 55, fm: 0.8, ratio: 1, ring: 0.1, noise: 0.05, body: 55, metal: 0.2, drive: 0.8, fold: 0.15, cutoff: 1800, motion: 0, chaos: 0, attack: 0.001, decay: 0.2, sustain: 0, release: 0.08, space: 0.08 },
  'Scrap Metal Hits': { mode: 'notes', fm: 6.5, ratio: 5.137, ring: 0.85, ringHz: 700, noise: 0.45, metal: 0.95, body: 280, drive: 0.65, fold: 0.8, cutoff: 11000, attack: 0.001, decay: 0.4, sustain: 0.1, release: 0.7, space: 0.45 },
  'Air Raid Siren': { pitch: 180, fm: 0.6, ratio: 1.01, ring: 0.2, noise: 0.03, metal: 0.3, fold: 0.1, motion: 0.85, rate: 0.16, chaos: 0.03, space: 0.4 },
  'Subterranean': { pitch: 36, fm: 3.2, ratio: 0.5, noise: 0.2, material: 'concrete', body: 46, metal: 0.65, damping: 850, cutoff: 900, drive: 0.85, fold: 0.2, space: 0.65, chaos: 0.4 },
  'Data Corrosion': { pitch: 138, fm: 8.2, ratio: 7.731, ring: 0.95, ringHz: 1350, noise: 0.3, metal: 0.4, drive: 0.9, fold: 0.9, motion: 0.7, rate: 12, chaos: 0.8, space: 0.25 },
  'Cable Tension': { pitch: 91, fm: 2.8, ratio: 1.498, material: 'cable', body: 115, metal: 0.95, damping: 3200, drive: 0.4, fold: 0.4, ring: 0.25, chaos: 0.15, space: 0.45 },
  'Black Atmosphere': { pitch: 65, fm: 1.2, ratio: 1.732, noise: 0.55, metal: 0.75, body: 145, damping: 2300, drive: 0.3, fold: 0.25, cutoff: 2400, motion: 0.3, rate: 0.05, chaos: 0.65, space: 0.9, attack: 2.5, release: 7 },
};
const hz = n => 440 * 2 ** ((n - 69) / 12);
// terugkoppeling van de resonatoren: boven ~0,83 is de lus met zijn lowpass-filter instabiel en groeit het signaal tot Infinity (bij Resonator-mix boven ~95%)
const FB_MAX = 0.82;

export default {
  id: 'nl.patchkamer.foundry', name: 'Foundry', version: '1.11.1', modExclude: ['morph'], kind: 'instrument', category: 'synth',
  ui: { width: 920, minWidth: 380 },
  ports: {
    audioIn: [{ id: 'in', name: 'External material' }], audioOut: [{ id: 'out', name: 'Stereo sculpture' }],
    eventIn: [{ id: 'notes', name: 'Keyboard / notes' }], eventOut: [], modIn: [{ id: 'mod', name: 'Mod' }], modOut: [],
  },
  i18n: { nl: { ports: { in: 'Extern materiaal', out: 'Stereo sculptuur', notes: 'Keyboard / noten' } } },
  create(ctx, host) {
    const tx = (k, ...a) => { let t = host.lang === 'nl' ? k : (EN[k] ?? k); a.forEach((v, i) => { t = t.replace('{' + i + '}', v); }); return t; };
    const OS = (host.audio && host.audio.oversample) || '2x';
    let mountHost = null, panel = null, uiHandles = {};
    let state = { ...defaults }, effective = {}, mod = {}, dead = false, playing = false, manual = false, muted = false, held = [], currentNote = null, envelope = null, timeline = [];
    let sceneA = null, sceneB = null, xy = null, scopeCanvas = null, status = null, xyDown = false;

    // ---------- audiograaf ----------
    const nodes = [], sources = [];
    const own = n => (nodes.push(n), n);
    let bodyNodes = [];
    const bown = n => (bodyNodes.push(n), n);
    const mkG = (v, reg) => { const n = reg(ctx.createGain()); n.gain.value = v; return n; };
    const g = v => mkG(v, own), bg = v => mkG(v, bown);
    const mkF = (type, freq, q, reg) => { const n = reg(ctx.createBiquadFilter()); n.type = type; n.frequency.value = freq; n.Q.value = q; return n; };
    const f = (type, freq, q = 0.7) => mkF(type, freq, q, own), bf = (type, freq, q = 0.7) => mkF(type, freq, q, bown);
    const target = (p, v, t = ctx.currentTime, tc = 0.035) => p.setTargetAtTime(v, t, tc);
    const start = n => { sources.push(n); n.start(); return n; };
    let randomSeed = 91279;
    const random = () => { randomSeed = (Math.imul(randomSeed, 1664525) + 1013904223) | 0; return (randomSeed >>> 0) / 2147483648 - 1; };
    const noiseBuffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * 4), ctx.sampleRate);
    { const a = noiseBuffer.getChannelData(0); for (let i = 0; i < a.length; i++) a[i] = random(); }
    // de galm-impulsrespons wordt één keer gemaakt (en blijft bij een herbouw van de keten gelijk)
    const ir = ctx.createBuffer(2, Math.ceil(ctx.sampleRate * 5), ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = ir.getChannelData(ch); let smooth = 0;
      for (let i = 0; i < data.length; i++) { smooth = smooth * 0.45 + random() * 0.55; data[i] = smooth * Math.min(1, i / (ctx.sampleRate * 0.009)) * Math.exp(-i / (ctx.sampleRate * 0.95)) * 0.5; }
    }
    const curves = { over: new Float32Array(4097), fold: new Float32Array(8193), ceiling: new Float32Array(4097) };
    for (let i = 0; i < curves.over.length; i++) { const x = i / (curves.over.length - 1) * 2 - 1; curves.over[i] = Math.tanh(x * 3) / Math.tanh(3); curves.ceiling[i] = 0.85 * Math.tanh(x / 0.85); }
    for (let i = 0; i < curves.fold.length; i++) curves.fold[i] = Math.sin((i / (curves.fold.length - 1) * 2 - 1) * 16);

    // bronnen (blijven bestaan): FM-keten, ringmodulatie, ruis, extern materiaal
    const input = g(1), ext = g(0), a = own(ctx.createOscillator()), b = own(ctx.createOscillator()), c = own(ctx.createOscillator());
    const fm1 = g(600), fm2 = g(140), tone = g(0.32), ring = own(ctx.createOscillator()), ringDepth = g(0.35), ringGain = g(0.65);
    const noise = own(ctx.createBufferSource()), noiseFilter = f('bandpass', 3500, 0.5), noiseGain = g(0.04), sourceMix = g(1);
    a.type = 'triangle'; b.type = c.type = 'sine'; ring.type = 'sine'; a.frequency.value = 110; b.frequency.value = 300; c.frequency.value = 420; ring.frequency.value = 137;
    c.connect(fm2).connect(b.frequency); b.connect(fm1).connect(a.frequency); a.connect(tone).connect(ringGain).connect(sourceMix);
    ring.connect(ringDepth).connect(ringGain.gain);
    noise.buffer = noiseBuffer; noise.loop = true; noise.connect(noiseFilter).connect(noiseGain).connect(sourceMix);
    input.connect(ext).connect(sourceMix);
    // beweging (de modulatie van het uitgangsfilter wordt bij elke herbouw opnieuw gekoppeld)
    const motion = own(ctx.createOscillator()), motionPitch = g(100), motionFilter = g(80), driftNoise = own(ctx.createBufferSource()), driftFilter = f('lowpass', 3, 0.5), driftDepth = g(100);
    motion.frequency.value = 0.23; motion.connect(motionPitch).connect(a.detune); motionPitch.connect(ring.detune);
    driftNoise.buffer = noiseBuffer; driftNoise.loop = true; driftNoise.playbackRate.value = 0.015; driftNoise.connect(driftFilter).connect(driftDepth).connect(b.detune);
    motion.connect(motionFilter);
    // vaste uitgang en meters
    const bus = g(1), analyser = own(ctx.createAnalyser()); analyser.fftSize = 1024; bus.connect(analyser);
    for (const n of [a, b, c, ring, noise, motion, driftNoise]) start(n);

    // de keten achter de bronnen (resonatoren, vervorming, filter, ruimte, compressor): alles met terugkoppeling of geheugen
    let materialDry, materialSum, resonators, overPre, overMix, foldPre, foldMix, lp, amp, dry, roomMix, echoes, volume;
    const monMat = own(ctx.createAnalyser()); monMat.fftSize = 2048;
    function buildBody() {
      bodyNodes = [];
      materialDry = bg(0.7); materialSum = bg(1); resonators = [];
      sourceMix.connect(materialDry).connect(materialSum);
      for (let i = 0; i < 4; i++) {
        const delay = bown(ctx.createDelay(0.1)), damp = bf('lowpass', 4200, 0.6), feedback = bg(0.6), wet = bg(0.06), pan = bown(ctx.createStereoPanner());
        sourceMix.connect(delay); delay.connect(damp); damp.connect(feedback).connect(delay); damp.connect(wet).connect(pan).connect(materialSum);
        resonators.push({ delay, damp, feedback, wet, pan, i });
      }
      overPre = bg(3); const over = bown(ctx.createWaveShaper()); overMix = bg(0.7); foldPre = bg(0.3); const folder = bown(ctx.createWaveShaper()); foldMix = bg(0.3);
      const character = bg(1), hp = bf('highpass', 28); lp = bf('lowpass', 6200, 0.8); amp = bg(0); dry = bg(0.9);
      const room = bown(ctx.createConvolver()); roomMix = bg(0.25); const compressor = bown(ctx.createDynamicsCompressor()); volume = bg(0.65); const out = bown(ctx.createWaveShaper());
      over.curve = curves.over; folder.curve = curves.fold; out.curve = curves.ceiling; over.oversample = folder.oversample = out.oversample = OS;
      materialSum.connect(overPre).connect(over).connect(overMix).connect(character);
      materialSum.connect(foldPre).connect(folder).connect(foldMix).connect(character);
      character.connect(hp).connect(lp).connect(amp); amp.connect(dry).connect(compressor); amp.connect(room).connect(roomMix).connect(compressor);
      room.buffer = ir;
      echoes = [];
      for (let i = 0; i < 2; i++) {
        const d = bown(ctx.createDelay(1.5)), low = bf('lowpass', 4000), feedback = bg(0.3), wet = bg(0.1), p = bown(ctx.createStereoPanner());
        d.delayTime.value = i ? 0.473 : 0.317; amp.connect(d); d.connect(low).connect(feedback).connect(d); low.connect(p).connect(wet).connect(compressor); echoes.push({ feedback, wet, p, i });
      }
      compressor.threshold.value = -12; compressor.knee.value = 12; compressor.ratio.value = 6; compressor.attack.value = 0.004; compressor.release.value = 0.25;
      compressor.connect(volume).connect(out); out.connect(bus);
      materialSum.connect(monMat);
      motionFilter.connect(lp.detune);
    }
    buildBody();

    // bewaker: een NaN of Infinity op de ingang (ook bij Extern materiaal op 0, want 0 × Infinity is NaN) of een absurd grote waarde blijft in
    // de terugkoppelende resonatoren, echo's en filters hangen en herstelt nooit meer. We blokkeren de ingang zolang hij ongeldig is en bouwen de
    // keten achter de bronnen opnieuw op als de meter achter de bronnen een ongeldige waarde ziet. Normaal geluid blijft ongewijzigd.
    const monIn = own(ctx.createAnalyser()); monIn.fftSize = 2048; input.connect(monIn);
    const chkIn = new Float32Array(2048), chkMat = new Float32Array(2048);
    let inBlocked = false, cleanTicks = 0, rebuilt = 0;
    const bad = arr => { for (let i = 0; i < arr.length; i++) if (!(Math.abs(arr[i]) < 100)) return true; return false; };
    function rebuildBody() {
      for (const n of bodyNodes) { try { n.disconnect(); } catch (e) {} }
      try { sourceMix.disconnect(); } catch (e) {}
      try { motionFilter.disconnect(); } catch (e) {}
      try { monMat.disconnect(); } catch (e) {}
      buildBody(); rebuilt++;
      apply(ctx.currentTime, true, true); restoreAmp();
    }
    function restoreAmp() {
      const t = ctx.currentTime, e = envelope; if (!e) return;
      amp.gain.setValueAtTime(ampAt(t), t);
      if (Number.isFinite(e.off)) { if (e.off + e.release > t) amp.gain.linearRampToValueAtTime(0, e.off + e.release); }
      else amp.gain.linearRampToValueAtTime(e.peak * e.sustain, t + 0.05);
    }
    function guard() {
      if (dead) return;
      monIn.getFloatTimeDomainData(chkIn);
      if (bad(chkIn)) { cleanTicks = 0; if (!inBlocked) { inBlocked = true; try { input.disconnect(ext); } catch (e) {} } }
      else if (inBlocked && ++cleanTicks >= 4) { inBlocked = false; try { input.connect(ext); } catch (e) {} }
      monMat.getFloatTimeDomainData(chkMat);
      if (bad(chkMat)) rebuildBody();
    }
    // alleen in een live context: een offline render loopt niet in wandkloktijd, daar zou een timer willekeurig midden in de render ingrijpen
    const offline = typeof OfflineAudioContext !== 'undefined' && ctx instanceof OfflineAudioContext;
    const guardT = !offline && typeof setInterval === 'function' ? setInterval(guard, 50) : null; if (guardT && guardT.unref) guardT.unref();

    // ---------- klank ----------
    function resolve() { const result = { ...state }; for (const [id, d] of Object.entries(spec)) { const offset = mod[id] || 0; result[id] = clamp(d[6] === 'log' ? state[id] * (d[2] / d[1]) ** offset : state[id] + offset * (d[2] - d[1]), d[1], d[2]); } return result; }
    function droneActive() { return state.mode === 'drone' && (playing || manual) && !muted; }
    function pitchAt(t) { let note = null; for (const event of timeline) { if (event.time > t) break; note = event.note; } return state.mode === 'notes' && note !== null ? hz(note) : effective.pitch; }
    function frequencyAt(t, freq) {
      target(a.frequency, freq, t, 0.012); target(b.frequency, Math.min(12000, freq * effective.ratio), t, 0.012);
      target(c.frequency, Math.min(14000, freq * effective.ratio * (1.17 + effective.metal * 0.73)), t, 0.012);
      target(fm1.gain, Math.min(12000, freq * effective.fm * effective.ratio), t); target(fm2.gain, Math.min(5000, freq * effective.fm * effective.chaos * 0.7), t);
    }
    function planPitch() { const now = ctx.currentTime; for (const n of [a.frequency, b.frequency, c.frequency, fm1.gain, fm2.gain]) n.cancelScheduledValues(now); frequencyAt(now, pitchAt(now)); for (const event of timeline) if (event.time > now) frequencyAt(event.time, hz(event.note)); }
    function apply(t = ctx.currentTime, force = false, keepAmp = false) {
      if (dead) return;
      const old = effective; effective = resolve(); const changed = (...ids) => force || ids.some(id => old[id] !== effective[id]);
      if (changed('wave')) a.type = state.wave;
      if (changed('pitch', 'ratio', 'fm', 'chaos', 'metal', 'mode')) planPitch();
      if (changed('tune')) for (const o of [a, b, c]) target(o.detune, effective.tune * 100, t);
      if (changed('ring')) { target(ringGain.gain, 1 - effective.ring, t); target(ringDepth.gain, effective.ring, t); }
      if (changed('ringHz')) target(ring.frequency, effective.ringHz, t);
      if (changed('noise')) target(noiseGain.gain, effective.noise * 0.28, t);
      if (changed('external')) target(ext.gain, effective.external, t);
      if (changed('metal', 'body', 'damping', 'width', 'material')) {
        const ratios = materials[state.material], fb = 0.18 + effective.metal * 0.68, fbSafe = Math.min(fb, FB_MAX); target(materialDry.gain, 1 - effective.metal * 0.5, t);
        for (const r of resonators) {
          target(r.delay.delayTime, 1 / (effective.body * ratios[r.i]), t); target(r.damp.frequency, Math.min(ctx.sampleRate * 0.45, effective.damping), t);
          target(r.feedback.gain, fbSafe, t); target(r.wet.gain, effective.metal * 0.24 * Math.sqrt(1 - fb * fb), t); target(r.pan.pan, (r.i / 3 * 2 - 1) * effective.width, t);
        }
      }
      if (changed('drive')) { target(overPre.gain, 1 + effective.drive * 12, t); target(foldPre.gain, (1 + effective.drive * 15) / 16, t); }
      if (changed('fold')) { target(overMix.gain, 1 - effective.fold, t); target(foldMix.gain, effective.fold, t); }
      if (changed('cutoff')) target(lp.frequency, Math.min(ctx.sampleRate * 0.45, effective.cutoff), t);
      if (changed('resonance')) target(lp.Q, effective.resonance, t);
      if (changed('motion')) { target(motionPitch.gain, effective.motion * 1000, t); target(motionFilter.gain, effective.motion * 1400, t); }
      if (changed('rate')) target(motion.frequency, effective.rate, t);
      if (changed('chaos')) target(driftDepth.gain, effective.chaos * 1800, t);
      if (changed('space', 'width')) {
        target(dry.gain, 1 - effective.space * 0.3, t); target(roomMix.gain, effective.space * 0.75, t);
        for (const echo of echoes) { target(echo.feedback.gain, 0.12 + effective.space * 0.43, t); target(echo.wet.gain, effective.space * 0.28, t); target(echo.p.pan, (echo.i ? 1 : -1) * effective.width, t); }
      }
      if (changed('level')) target(volume.gain, effective.level, t);
      if (!keepAmp && (force || old.mode !== effective.mode)) { if (droneActive()) droneOn(); else releaseAmp(ctx.currentTime, Math.min(effective.release, 0.25)); }
    }
    function ampAt(t) {
      if (!envelope || t < envelope.time) return 0; const e = envelope;
      if (Number.isFinite(e.off) && t >= e.off) return Math.max(0, e.offLevel * (1 - (t - e.off) / e.release));
      const age = t - e.time; if (age < e.attack) return e.peak * age / e.attack; if (age < e.attack + e.decay) return e.peak * (1 - (1 - e.sustain) * (age - e.attack) / e.decay);
      return e.peak * e.sustain;
    }
    function releaseAmp(t, seconds = effective.release) {
      const level = ampAt(t); amp.gain.cancelScheduledValues(t); amp.gain.setValueAtTime(level, t); amp.gain.linearRampToValueAtTime(0, t + seconds);
      if (envelope) { envelope.off = t; envelope.offLevel = level; envelope.release = seconds; }
    }
    function droneOn() {
      const t = ctx.currentTime, envelopeLevel = ampAt(t); amp.gain.cancelScheduledValues(t); amp.gain.setValueAtTime(envelopeLevel, t); amp.gain.linearRampToValueAtTime(0.28, t + effective.attack);
      envelope = { time: t, attack: effective.attack, decay: 0.01, sustain: 1, peak: 0.28 };
    }
    function play(note, vel, t, duration) {
      if (vel <= 0) { off(note, t); return; }
      held = held.filter(n => n.note !== note && n.end > t); held.push({ note, vel, time: t, end: Number.isFinite(duration) ? t + duration : Infinity }); currentNote = note;
      const past = timeline.filter(n => n.time < ctx.currentTime).at(-1); timeline = timeline.filter(n => n.time >= ctx.currentTime); if (past) timeline.unshift(past);
      timeline.push({ note, time: t }); timeline.sort((x, y) => x.time - y.time); if (timeline.length > 128) timeline = timeline.slice(-128);
      frequencyAt(t, hz(note)); amp.gain.cancelScheduledValues(t); amp.gain.setValueAtTime(0, t);
      envelope = { time: t, attack: effective.attack, decay: effective.decay, sustain: effective.sustain, peak: 0.3 * vel };
      amp.gain.linearRampToValueAtTime(envelope.peak, t + effective.attack); amp.gain.linearRampToValueAtTime(envelope.peak * effective.sustain, t + effective.attack + effective.decay);
      if (Number.isFinite(duration)) releaseAmp(t + duration);
    }
    function off(note, t) {
      held = held.filter(n => n.note !== note && n.end > t); if (note !== currentNote) return;
      const next = held.filter(n => n.time <= t).at(-1);
      if (next) play(next.note, next.vel, t, Number.isFinite(next.end) ? next.end - t : undefined); else { releaseAmp(t); currentNote = null; }
    }
    function stop() { manual = false; muted = true; held = []; currentNote = null; timeline = []; releaseAmp(ctx.currentTime, 0.08); }
    function baseSnapshot() { return Object.fromEntries(Object.keys(spec).map(id => [id, state[id]])); }
    function decodeScene(raw) {
      if (typeof raw !== 'string' || raw.length > 12000) return null;
      try { const object = JSON.parse(raw), result = {}; if (!object || typeof object !== 'object') return null; for (const [id, d] of Object.entries(spec)) result[id] = finite(object[id], d[4], d[1], d[2]); return result; } catch (e) { return null; }
    }
    const modText = () => Object.values(mod).some(v => v !== 0) ? tx('Modulatie actief · oranje marker = basis, paars = effectieve klank') : null;
    let dirty = true;
    function updateUI() {
      for (const id in uiHandles) if (id in state) uiHandles[id].set(state[id]);
      if (status) status.textContent = modText() || tx('Sleep in het XY-vlak. Start Drone of sluit noten aan in Noten-modus.');
      dirty = true;
    }
    function change(id, value) { const d = spec[id]; if (!d || !Number.isFinite(value)) return; state[id] = Number(clamp(value, d[1], d[2]).toFixed(6)); state.preset = 'Custom'; apply(); updateUI(); }
    function mutate() {
      let gen = state.seed >>> 0; const next = () => { gen = (Math.imul(gen, 1664525) + 1013904223) >>> 0; return gen / 4294967296; };
      for (const id of ['fm', 'ratio', 'ring', 'ringHz', 'noise', 'metal', 'body', 'damping', 'drive', 'fold', 'cutoff', 'motion', 'rate', 'chaos', 'space']) { const d = spec[id], v = next(); state[id] = Number((d[6] === 'log' ? d[1] * (d[2] / d[1]) ** v : d[1] + v * (d[2] - d[1])).toFixed(6)); }
      state.seed = gen; state.preset = 'Custom'; apply(); updateUI();
    }
    function morph(value) {
      state.morph = value; if (!sceneA || !sceneB) return;
      for (const [id, d] of Object.entries(spec)) state[id] = Number((d[6] === 'log' ? sceneA[id] * (sceneB[id] / sceneA[id]) ** value : sceneA[id] + (sceneB[id] - sceneA[id]) * value).toFixed(6));
      state.preset = 'Custom'; apply(); updateUI();
    }
    const axisOptions = () => Object.entries(spec).filter(([id]) => !['level', 'external', 'attack', 'decay', 'sustain', 'release'].includes(id)).map(([id, d]) => [id, tx(d[0])]);
    const axisIds = () => axisOptions().map(([k]) => k);
    function fraction(id, v) { const d = spec[id]; return clamp(d[6] === 'log' ? Math.log(v / d[1]) / Math.log(d[2] / d[1]) : (v - d[1]) / (d[2] - d[1]), 0, 1); }
    function setXY(event) {
      const rect = xy.getBoundingClientRect(), x = clamp((event.clientX - rect.left) / rect.width, 0, 1), y = 1 - clamp((event.clientY - rect.top) / rect.height, 0, 1);
      for (const [id, v] of [[state.xAxis, x], [state.yAxis, y]]) { const d = spec[id]; state[id] = Number((d[6] === 'log' ? d[1] * (d[2] / d[1]) ** v : d[1] + v * (d[2] - d[1])).toFixed(6)); }
      state.preset = 'Custom'; apply(); updateUI();
    }

    // ---------- UI ----------
    const add = (parent, tag, text, css) => { const el = document.createElement(tag); if (text !== undefined) el.textContent = text; if (css) el.style.cssText = css; parent.appendChild(el); return el; };
    const CSS = `:host{display:block;color:var(--fg);font:13px system-ui,sans-serif;--x-acc:#ffb36e;--x-acc2:#e8c991;--x-ink:color-mix(in srgb,var(--x-acc) 60%,var(--fg));--x-ink2:color-mix(in srgb,var(--x-acc2) 60%,var(--fg))}
.app{container-type:inline-size;background:var(--card);border-radius:10px;padding:14px;box-sizing:border-box}
h2{margin:0 0 5px;font-size:20px;letter-spacing:1px;color:var(--x-ink)}p{line-height:1.5;color:var(--muted);margin:8px 0}
.row{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:8px 0}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px}
.control{display:flex;flex-direction:column;gap:5px;padding:8px;border:1px solid var(--line);border-radius:7px;min-width:0}.control span{font-size:11px;color:var(--muted)}
button,select,input{font:inherit;color:var(--field-fg);background:var(--field);border:1px solid var(--line);border-radius:5px;padding:7px;max-width:100%;box-sizing:border-box}
button{cursor:pointer;touch-action:none}button:focus-visible,input:focus-visible,select:focus-visible,canvas:focus-visible{outline:2px solid var(--x-acc)}
input[type=range]{width:100%;padding:0;accent-color:var(--x-acc)}output{font:12px monospace;color:var(--x-ink2)}
canvas{display:block;width:100%;background:var(--well);border:1px solid var(--line);border-radius:6px;touch-action:none}
h3{font-size:13px;color:var(--x-ink2);margin:14px 0 8px}label{min-width:0}`;
    function clearUI() { if (mountHost) mountHost.innerHTML = ''; mountHost = null; panel = null; uiHandles = {}; }
    const row = parent => { const el = add(parent, 'div'); el.className = 'row'; return el; };
    const grid = parent => { const el = add(parent, 'div'); el.className = 'grid'; return el; };
    const button = (parent, label, fn) => { const bt = add(parent, 'button', label); bt.type = 'button'; bt.onclick = fn; return bt; };
    function select(parent, label, options, value, change) {
      const box = add(parent, 'label'); box.className = 'control'; add(box, 'span', label); const el = add(box, 'select');
      for (const [v, text] of options) { const o = add(el, 'option', text); o.value = String(v); }
      el.value = String(value); el.onchange = () => change(el.value); return el;
    }
    function knob(parent, id, label, bounds, value, dflt, onchange, format) {
      const box = add(parent, 'label'); box.className = 'control'; add(box, 'span', label); const out = add(box, 'output', format(value)), input = add(box, 'input');
      input.type = 'range'; [input.min, input.max, input.step] = bounds.map(String); input.value = String(value); input.setAttribute('data-pk-default', String(dflt));
      input.oninput = () => { const n = Number(input.value); out.textContent = format(n); onchange(n); };
      uiHandles[id] = { set(v) { input.value = String(v); out.textContent = format(v); } }; return input;
    }
    // tekenen: maat uit een ResizeObserver, kleuren in een cache, alles via host.frame
    let views = [], ro = null, stopFrame = null, palC = null, palT = 0;
    function fit(v) {
      const w = Math.max(260, Math.min(1200, v.c.clientWidth || 600)), dpr = Math.min(4, Math.max(1, Number(globalThis.devicePixelRatio) || 1));
      if (v.w !== w || v.dpr !== dpr) { v.w = w; v.dpr = dpr; v.c.width = Math.round(w * dpr); v.c.height = Math.round(v.h * dpr); v.g = v.c.getContext('2d'); if (v.g) v.g.setTransform(dpr, 0, 0, dpr, 0, 0); dirty = true; }
    }
    function makeView(canvas, h) { const v = { c: canvas, h, w: 0, dpr: 0, g: null }; canvas.style.height = h + 'px'; views.push(v); fit(v); if (ro) ro.observe(canvas); return v; }
    function pal() {
      const now = performance.now(); if (palC && now - palT < 1000) return palC; palT = now;
      const cs = panel ? getComputedStyle(panel) : null, v = (n, d) => (cs && cs.getPropertyValue(n).trim()) || d;
      palC = { well: v('--well', '#0b171d'), wellFg: v('--well-fg', '#c7dbe0'), line: v('--line', '#39434c'), mod: v('--mod', '#c9a0ff'), acc: v('--x-acc', '#ffb36e') }; dirty = true; return palC;
    }
    const onSkin = () => { palC = null; };
    const waveData = new Float32Array(1024), freqData = new Uint8Array(512);
    let xyView = null, scopeView = null;
    function draw() {
      if (dead || !panel) return;
      if (xyView && xyView.g && dirty) {
        const { g, w, h } = xyView, P = pal(); dirty = false;
        g.fillStyle = P.well; g.fillRect(0, 0, w, h); g.strokeStyle = P.line; g.lineWidth = 1;
        for (let j = 1; j < 5; j++) { g.beginPath(); g.moveTo(w * j / 5, 0); g.lineTo(w * j / 5, h); g.moveTo(0, h * j / 5); g.lineTo(w, h * j / 5); g.stroke(); }
        g.fillStyle = P.wellFg; g.font = '12px system-ui'; g.fillText('X · ' + tx(spec[state.xAxis][0]), 10, h - 10); g.fillText('Y · ' + tx(spec[state.yAxis][0]), 10, 18);
        for (const [values, color, radius] of [[effective, P.mod, 8], [state, P.acc, 5]]) {
          g.beginPath(); g.arc(fraction(state.xAxis, values[state.xAxis]) * w, (1 - fraction(state.yAxis, values[state.yAxis])) * h, radius, 0, Math.PI * 2); g.strokeStyle = color; g.lineWidth = 2; g.stroke();
        }
      }
      if (scopeView && scopeView.g) {
        const { g, w, h } = scopeView, P = pal();
        g.fillStyle = P.well; g.fillRect(0, 0, w, h); g.strokeStyle = P.wellFg; g.lineWidth = 1; g.beginPath();
        if (state.scope === 'spectrum') {
          analyser.getByteFrequencyData(freqData);
          for (let i = 0; i < 256; i++) {
            const freq = 30 * (Math.min(20000, ctx.sampleRate * 0.45) / 30) ** (i / 255), bin = Math.min(511, Math.round(freq / (ctx.sampleRate / 1024))), x = i / 255 * w, y = h - 2 - freqData[bin] / 255 * (h - 4);
            if (i === 0) g.moveTo(x, y); else g.lineTo(x, y);
          }
        } else {
          analyser.getFloatTimeDomainData(waveData);
          for (let i = 0; i < waveData.length; i++) { const x = i / (waveData.length - 1) * w, y = h / 2 - clamp(waveData[i], -1, 1) * h * 0.45; if (i === 0) g.moveTo(x, y); else g.lineTo(x, y); }
        }
        g.stroke();
      }
    }
    function stopDrawing() {
      if (stopFrame) { stopFrame(); stopFrame = null; }
      if (ro) { ro.disconnect(); ro = null; }
      if (typeof window !== 'undefined' && window.removeEventListener) window.removeEventListener('patchkamer-skin', onSkin);
      views = []; xyView = scopeView = null;
    }
    function unmount() { stopDrawing(); xy = null; scopeCanvas = null; status = null; xyDown = false; clearUI(); }
    function render(el) {
      unmount(); mountHost = el; const wrap = add(el, 'div'); const shadow = wrap.attachShadow ? wrap.attachShadow({ mode: 'open' }) : wrap;
      add(shadow, 'style', CSS); panel = add(shadow, 'div'); panel.className = 'app'; add(panel, 'h2', 'FOUNDRY · industrial sound sculptor');
      add(panel, 'p', tx('FM, metaalresonanties, ruis, ringmodulatie en wavefolding. Begin met Start drone en sculpt met het XY-vlak.')); uiHandles = {};
      if (typeof ResizeObserver !== 'undefined') ro = new ResizeObserver(() => { for (const v of views) fit(v); });
      const top = row(panel);
      select(top, tx('Klankbeeld'), Object.keys(presets).map(k => [k, k]).concat([['Custom', tx('Eigen sculptuur')]]), state.preset, v => {
        if (Object.hasOwn(presets, v)) { const snapshots = { sceneA: state.sceneA, sceneB: state.sceneB }; self.setState({ ...defaults, ...presets[v], ...snapshots, preset: v }); }
      });
      select(top, tx('Spel'), [['drone', 'Drone / transport'], ['notes', 'Keyboard / sequencer']], state.mode, v => { stop(); state.mode = v; muted = false; apply(); render(el); });
      button(top, 'Start / stop drone', () => { if (droneActive()) stop(); else { state.mode = 'drone'; manual = true; muted = false; apply(); droneOn(); } render(el); });
      button(top, tx('Metalen slag'), () => { state.mode = 'notes'; manual = false; muted = false; apply(); play(48, 0.9, ctx.currentTime, 0.25); render(el); });
      button(top, tx('Alles uit'), stop); button(top, tx('Muteer klank'), mutate);
      const axis = row(panel); select(axis, tx('X-as'), axisOptions(), state.xAxis, v => { state.xAxis = v; dirty = true; }); select(axis, tx('Y-as'), axisOptions(), state.yAxis, v => { state.yAxis = v; dirty = true; });
      xy = add(panel, 'canvas'); xy.tabIndex = 0; xy.setAttribute('role', 'application'); xy.setAttribute('aria-label', tx('XY sound sculptor: pijltjestoetsen wijzigen X en Y'));
      xy.onpointerdown = e => { e.preventDefault(); e.stopPropagation(); xyDown = true; xy.setPointerCapture?.(e.pointerId); setXY(e); };
      xy.onpointermove = e => { if (xyDown) setXY(e); };
      xy.onpointerup = xy.onpointercancel = () => { xyDown = false; };
      xy.onkeydown = e => {
        if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.code)) return; e.preventDefault();
        const id = e.code === 'ArrowLeft' || e.code === 'ArrowRight' ? state.xAxis : state.yAxis, d = spec[id], sign = e.code === 'ArrowLeft' || e.code === 'ArrowDown' ? -1 : 1;
        change(id, d[6] === 'log' ? state[id] * (d[2] / d[1]) ** (sign * 0.01) : state[id] + sign * (d[2] - d[1]) * 0.01);
      };
      const snapshots = row(panel);
      button(snapshots, tx('Bewaar A'), () => { sceneA = baseSnapshot(); state.sceneA = JSON.stringify(sceneA); updateUI(); });
      button(snapshots, tx('Bewaar B'), () => { sceneB = baseSnapshot(); state.sceneB = JSON.stringify(sceneB); updateUI(); });
      button(snapshots, tx('Herstel A'), () => { if (sceneA) { Object.assign(state, sceneA); state.morph = 0; state.preset = 'Custom'; apply(); updateUI(); } });
      button(snapshots, tx('Herstel B'), () => { if (sceneB) { Object.assign(state, sceneB); state.morph = 1; state.preset = 'Custom'; apply(); updateUI(); } });
      knob(snapshots, 'morph', 'Morph A ↔ B', [0, 1, 0.01], state.morph, 0, morph, v => Math.round(v * 100) + '%');
      const toneRow = row(panel);
      select(toneRow, tx('Materiaal'), [['steel', tx('Staal')], ['glass', tx('Glas')], ['concrete', tx('Beton')], ['cable', tx('Kabel / snaar')]], state.material, v => { state.material = v; state.preset = 'Custom'; apply(); });
      select(toneRow, tx('Bron'), [['sine', 'Sine'], ['triangle', 'Triangle'], ['sawtooth', 'Saw'], ['square', 'Square']], state.wave, v => { state.wave = v; state.preset = 'Custom'; apply(); });
      select(toneRow, 'Scope', [['wave', tx('Golfvorm')], ['spectrum', 'Spectrum'], ['off', tx('Uit')]], state.scope, v => { state.scope = v; render(el); });
      if (state.scope !== 'off') { scopeCanvas = add(panel, 'canvas'); scopeCanvas.setAttribute('aria-label', tx('Gemeten stereo-uitgang, ') + state.scope); }
      const titles = { source: 'Bronnen & frequenties', material: 'Materiaal & vervorming', motion: 'Beweging & ruimte', play: 'Envelope & niveau' };
      for (const lane of ['source', 'material', 'motion', 'play']) {
        add(panel, 'h3', tx(titles[lane])); const box = grid(panel);
        for (const [id, d] of Object.entries(spec)) if (d[8] === lane) knob(box, id, tx(d[0]), [d[1], d[2], d[3]], state[id], d[4], v => change(id, v), v => d[5] === '%' ? Math.round(v * 100) + '%' : d[5] === 'Hz' ? v.toFixed(v < 20 ? 2 : 0) + ' Hz' : v.toFixed(d[5] === 's' ? 3 : 2) + ' ' + d[5]);
      }
      status = add(panel, 'p'); add(panel, 'p', tx('A/B: bewaar twee klanken en beweeg Morph. Muteer verandert de klank, niet het uitgangsniveau. In Noten-modus: keyboard of sequencer → oranje ingang. Een paarse Mod-kabel werkt ook zonder transport. Extern geluid: bron → Extern materiaal, zet de gelijknamige regelaar open en start de drone/gate.'));
      updateUI();
      if (xy) xyView = makeView(xy, 220); if (scopeCanvas) scopeView = makeView(scopeCanvas, 72);
      if (typeof window !== 'undefined' && window.addEventListener) window.addEventListener('patchkamer-skin', onSkin);
      if (typeof host.frame === 'function') stopFrame = host.frame(self, draw, 30);
    }

    const self = {
      inputs: { in: input }, outputs: { out: bus }, mount: render, unmount,
      onEvent(port, e) {
        try {
          if (dead || port !== 'notes' || !e || !Number.isFinite(e.time)) return;
          const t = Math.max(ctx.currentTime, e.time), type = String(e.type).toLowerCase().replace(/[_-]/g, '');
          if (type === 'panic' || type === 'allnotesoff') { stop(); return; }
          if (type === 'cc' && Object.hasOwn(spec, e.id) && Number.isFinite(e.value)) { const d = spec[e.id]; state[e.id] = d[1] + clamp(e.value, 0, 1) * (d[2] - d[1]); state.preset = 'Custom'; apply(t); updateUI(); return; }
          if (state.mode !== 'notes') return;
          if (['note', 'noteon', 'noteoff'].includes(type) && Number.isFinite(e.note)) {
            const note = clamp(e.note, 0, 127);
            if (type === 'noteoff' || e.vel === 0) off(note, t);
            else play(note, finite(e.vel, 0.8, 0, 1), t, e.held === true ? undefined : Number.isFinite(e.dur) ? clamp(e.dur, 0.005, 120) : undefined);
          }
        } catch (err) {}
      },
      onTransport(info) {
        if (dead) return; playing = !!(info && info.playing); manual = false; muted = false;
        if (playing && state.mode === 'drone') droneOn(); else { held = []; currentNote = null; timeline = []; releaseAmp(ctx.currentTime); }
      },
      params() {
        const names = { source: 'Bronnen', material: 'Materiaal', motion: 'Beweging', play: 'Envelope / niveau' };
        return Object.entries(spec).map(([id, d]) => ({ id, name: tx(d[0]), lane: d[8], laneName: tx(names[d[8]]), min: d[1], max: d[2], scale: d[6], role: d[7], drift: ['pitch', 'level', 'res'].includes(d[7]) ? 0.008 : 0.02, on: !['pitch', 'level', 'res', 'env', 'decay'].includes(d[7]) }));
      },
      modulate(o) {
        if (dead) return; mod = {};
        if (o && typeof o === 'object' && !Array.isArray(o)) for (const id in spec) if (typeof o[id] === 'number' && Number.isFinite(o[id])) mod[id] = clamp(o[id], -1, 1);
        apply(); if (status) status.textContent = modText() || tx('Mod gereed · de knoppen blijven je basis'); dirty = true;
      },
      getState() { return { ...state }; },
      getPreset() { const p = { ...state }; delete p.scope; return p; },
      setPreset(p) { self.setState({ ...(p && typeof p === 'object' ? p : {}), scope: state.scope }); },
      setState(raw) {
        if (dead) return;
        const s = raw && typeof raw === 'object' ? raw : {}, next = { ...defaults};
        for (const [id, d] of Object.entries(spec)) next[id] = finite(s[id], d[4], d[1], d[2]);
        for (const [id, options] of Object.entries({ ...CHOICES, material: Object.keys(materials) })) if (options.includes(s[id])) next[id] = s[id];
        for (const id of ['xAxis', 'yAxis']) if (axisIds().includes(s[id])) next[id] = s[id];
        next.morph = finite(s.morph, 0, 0, 1); next.seed = Math.round(finite(s.seed, 74231, 0, 4294967295));
        if (s.preset === 'Custom' || s.preset === 'Eigen') next.preset = 'Custom'; else if (typeof s.preset === 'string' && Object.hasOwn(presets, s.preset)) next.preset = s.preset;
        sceneA = decodeScene(s.sceneA); sceneB = decodeScene(s.sceneB); next.sceneA = sceneA ? JSON.stringify(sceneA) : ''; next.sceneB = sceneB ? JSON.stringify(sceneB) : '';
        state = next; held = []; currentNote = null; timeline = []; apply(ctx.currentTime, true); updateUI(); if (mountHost) render(mountHost);
      },
      destroy() {
        if (dead) return; dead = true; if (guardT) clearInterval(guardT); unmount();
        for (const n of sources) { try { n.stop(); } catch (e) {} }
        for (const n of nodes.concat(bodyNodes)) { try { n.disconnect(); } catch (e) {} }
        held = []; timeline = [];
      },
    };
    apply(ctx.currentTime, true);
    return self;
  },
};
