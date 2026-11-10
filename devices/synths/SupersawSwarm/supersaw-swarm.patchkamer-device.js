// SPDX-License-Identifier: AGPL-3.0-or-later
// 1.14.0 — Regelaars herkenbaar voor skins (host.ui.adopt, id = state-sleutel, groep per sectie: sound, swarm, envelope, space, motion; keuzelijsten in de groep top); skin Compact erbij. Geluid, state en ids ongewijzigd.
// 1.13.0 — Uitleg naar about (menu Over Supersaw Swarm); de UI toont geen uitlegtekst meer. Geluid en state ongewijzigd.
// 1.12.0 — Titel in de UI verwijderd: de kaartbalk toont de naam. Geluid en state ongewijzigd.
// 1.11.0 — Nieuw als Supersaw Swarm (nieuwe id nl.patchkamer.supersawswarm, eigen map), bijgewerkt naar Patchkamer contract v1.11:
//   - tweetalig (host.lang, poortnamen per taal in i18n); de naam is in alle talen Supersaw Swarm
//   - setState volgt §13: onbekende velden genegeerd, ongeldige waarden op de standaard, getallen afgekapt, audioparameters zacht; de knoppen volgen setState en cc
//   - klankbeelden hebben Engelse namen (oude Nederlandse namen worden bij setState nog herkend)
//   - bewaker: een meter kijkt om de 50 ms naar de uitvoer van de stemmen en naar de eindtrap; bij NaN, Infinity of een absurde waarde worden alle stemmen
//     gestopt en de effectketen (inclusief de delay met terugkoppeling en de compressor) opnieuw opgebouwd. Geluid in het normale gebied is ongewijzigd.
/** Supersaw Swarm. Zelfstandig, geen externe bestanden.
 * Trance-supersaw: per noot een zwerm van 1–9 verstemde zaagtanden (midden + zijzagen links/rechts),
 * een octaaflaag en een sinus-sub, door een 24 dB-laagdoorlaatfilter met envelope. Daarna een vaste,
 * kamervullende keten: drive → trance-gate → pomp → stereo-chorus → ping-pongdelay (op tempo) → galm
 * (convolutie, eigen impulsrespons) → compressor → plafond.
 * Noten: {type:'note',note,vel,time,dur}; ook noteon/noteoff (aangehouden toetsen), cc (0..1 op een param-id)
 * en panic. Trance-gate en pomp lopen op de klok van de host (onStep) en staan stil als de klok stopt.
 * Mod stuurt alle klankregelaars bovenop de knoppen; Galmlengte wordt niet gestuurd (dat zou de galm
 * steeds opnieuw opbouwen).
 */
const EN = {
  'Resonantie': 'Resonance', 'Filter-envelope': 'Filter envelope', 'Zwermbreedte': 'Swarm width', 'Zijzagen': 'Side saws', 'Stereospreiding': 'Stereo spread',
  'Octaaflaag': 'Octave layer', 'Delay-herhaling': 'Delay repeats', 'Galm': 'Reverb', 'Galmlengte': 'Reverb length', 'Pomp': 'Pump', 'Transpositie': 'Transpose', 'Uitgang': 'Output',
  'Klank': 'Sound', 'Zwerm': 'Swarm', 'Ruimte': 'Space', 'Beweging & niveau': 'Motion & level',
  'Losse noten': 'Single notes', 'Mineur': 'Minor', 'Majeur': 'Major', 'Mineur 7': 'Minor 7', 'Mineur add9': 'Minor add9', 'Kwint + octaaf': 'Fifth + octave',
  'Eigen klank': 'Custom sound', 'Klankbeeld': 'Preset', 'Zagen per noot': 'Saws per note', '7 (klassiek)': '7 (classic)', '9 (maximaal)': '9 (maximum)',
  'Akkoord per toets': 'Chord per key', 'Delaytijd': 'Delay time', 'Test akkoord': 'Test chord', 'Test noot': 'Test note', 'Alles uit': 'All off',
  'dubbelklik voor standaard': 'double-click for default', 'Gate stap {0}': 'Gate step {0}',
  'Gate-patroon (16 stappen, loopt met de klok)': 'Gate pattern (16 steps, follows the clock)',
};

export default {
  id: 'nl.patchkamer.supersawswarm', name: 'Supersaw Swarm', version: '1.14.0', kind: 'instrument', category: 'synth',
  ui: { width: 820, minWidth: 360 },
  about: { nl: 'Tot negen verstemde zaagtanden per noot, met octaaflaag, sub en een ingebouwde ruimte. Sluit een keyboard of sequencer aan op Noten en stuur de stereo-uitgang naar een mixer.\n\nTrance-gate en Pomp werken alleen als de klok loopt (Start). Akkoord per toets maakt van elke noot een akkoord; kies Losse noten als je akkoorden uit de sequencer stuurt. Galmlengte bouwt de galm opnieuw op; die wordt niet door Mod gestuurd.', en: 'Up to nine detuned sawtooth waves per note, with an octave layer, sub and a built-in space. Connect a keyboard or sequencer to Notes and send the stereo output to a mixer.\n\nTrance gate and Pump only work while the clock runs (Start). Chord per key turns every note into a chord; choose Single notes if you send chords from the sequencer. Reverb length rebuilds the reverb; Mod does not control it.' },
  ports: { audioIn: [], audioOut: [{ id: 'out', name: 'Stereo' }], eventIn: [{ id: 'notes', name: 'Notes' }], eventOut: [], modIn: [{ id: 'mod', name: 'Mod' }], modOut: [] },
  i18n: { nl: { ports: { notes: 'Noten' } } },
  create(ctx, host) {
    const tx = (k, ...a) => { let t = host.lang === 'nl' ? k : (EN[k] ?? k); a.forEach((v, i) => { t = t.replace('{' + i + '}', v); }); return t; };
    const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
    const finite = (x, d, a, b) => typeof x === 'number' && Number.isFinite(x) ? clamp(x, a, b) : d;
    const hz = n => 440 * 2 ** ((n - 69) / 12);
    let dead = false, mod = {}, state, eff = {}, stepDur = 0.125, playing = false, irSize = 0, irTimer = null;
    const nodes = new Set(), sources = new Set();
    const own = n => (nodes.add(n), n);
    const gain = v => { const n = own(ctx.createGain()); n.gain.value = v; return n; };
    const biquad = (type, f, q = 0.707) => { const n = own(ctx.createBiquadFilter()); n.type = type; n.frequency.value = Math.min(ctx.sampleRate * 0.45, f); n.Q.value = q; return n; };
    const smooth = (p, v, t = ctx.currentTime, tc = 0.03) => { try { p.setTargetAtTime(v, t, tc); } catch {} };
    const stopSource = (n, t = ctx.currentTime) => { try { n.stop(t); } catch {} };

    // ---------- parameters ----------
    const spec = {
      cutoff: { name: 'Filter', min: 120, max: 18000, scale: 'log', unit: 'Hz', role: 'filter', g: 0 },
      resonance: { name: 'Resonantie', min: 0.3, max: 8, unit: 'Q', role: 'res', g: 0 },
      env: { name: 'Filter-envelope', min: 0, max: 5, unit: 'oct', g: 0 },
      drive: { name: 'Drive', min: 0, max: 1, unit: '%', g: 0 },
      detune: { name: 'Zwermbreedte', min: 0, max: 60, unit: 'cent', g: 1 },
      mix: { name: 'Zijzagen', min: 0, max: 1, unit: '%', g: 1 },
      spread: { name: 'Stereospreiding', min: 0, max: 1, unit: '%', role: 'pan', g: 1 },
      octave: { name: 'Octaaflaag', min: 0, max: 1, unit: '%', g: 1 },
      sub: { name: 'Sub', min: 0, max: 1, unit: '%', role: 'sub', g: 1 },
      attack: { name: 'Attack', min: 0.001, max: 5, scale: 'log', unit: 's', role: 'env', g: 2 },
      decay: { name: 'Decay', min: 0.02, max: 5, scale: 'log', unit: 's', role: 'decay', g: 2 },
      sustain: { name: 'Sustain', min: 0, max: 1, unit: '%', role: 'env', g: 2 },
      release: { name: 'Release', min: 0.02, max: 10, scale: 'log', unit: 's', role: 'decay', g: 2 },
      chorus: { name: 'Chorus', min: 0, max: 1, unit: '%', g: 3 },
      delay: { name: 'Delay', min: 0, max: 1, unit: '%', g: 3 },
      feedback: { name: 'Delay-herhaling', min: 0, max: 0.9, unit: '%', g: 3 },
      hall: { name: 'Galm', min: 0, max: 1, unit: '%', g: 3 },
      size: { name: 'Galmlengte', min: 0.6, max: 10, scale: 'log', unit: 's', g: 3, nomod: true },
      gate: { name: 'Trance-gate', min: 0, max: 1, unit: '%', g: 4 },
      pump: { name: 'Pomp', min: 0, max: 1, unit: '%', g: 4 },
      transpose: { name: 'Transpositie', min: -24, max: 24, step: 1, unit: 'st', role: 'pitch', g: 4 },
      level: { name: 'Uitgang', min: 0, max: 1, unit: '%', role: 'level', g: 4 },
    };
    const GROUPS = ['Klank', 'Zwerm', 'Envelope', 'Ruimte', 'Beweging & niveau'];
    const CHORDS = { none: [0], minor: [0, 3, 7], major: [0, 4, 7], sus2: [0, 2, 7], sus4: [0, 5, 7], min7: [0, 3, 7, 10], minadd9: [0, 3, 7, 14], oct5: [0, 7, 12] };
    const CHORD_NAMES = [['none', 'Losse noten'], ['minor', 'Mineur'], ['major', 'Majeur'], ['sus2', 'Sus2'], ['sus4', 'Sus4'], ['min7', 'Mineur 7'], ['minadd9', 'Mineur add9'], ['oct5', 'Kwint + octaaf']];
    const DIVS = { '1/16': 1, '1/8': 2, '3/16': 3, '1/4': 4, '3/8': 6 };
    const defaults = { cutoff: 6500, resonance: 1, env: 0.8, drive: 0.15, detune: 28, mix: 0.75, spread: 0.9, octave: 0.35, sub: 0.15,
      attack: 0.005, decay: 0.4, sustain: 0.85, release: 0.45, chorus: 0.3, delay: 0.28, feedback: 0.38, hall: 0.35, size: 3.5,
      gate: 0, pump: 0, transpose: 0, level: 0.75, unison: 7, chord: 'none', div: '3/16', pattern: '1011011010110110', preset: 'Anthem Lead' };
    const LEGACY = { 'Eigen': 'Custom', 'Hemelpad': 'Heaven Pad', 'Zaalakkoorden': 'Hall Chords', 'Pluk-cascade': 'Pluck Cascade', 'Gated koor': 'Gated Choir', 'Pompende akkoorden': 'Pumping Chords', 'Arp-lead': 'Arp Lead' };
    const presets = {
      'Anthem Lead': {},
      'Heaven Pad': { cutoff: 3200, resonance: 0.7, env: 0.3, detune: 35, mix: 0.85, spread: 1, octave: 0.45, sub: 0.1, attack: 1.4, decay: 2, sustain: 0.9, release: 4.5, chorus: 0.6, delay: 0.15, feedback: 0.3, hall: 0.6, size: 7, unison: 9 },
      'Hall Chords': { chord: 'minor', cutoff: 2800, resonance: 1.4, env: 2.2, attack: 0.003, decay: 0.35, sustain: 0.25, release: 0.5, delay: 0.22, hall: 0.4, size: 4 },
      'Pluck Cascade': { cutoff: 1500, resonance: 2, env: 3.2, attack: 0.001, decay: 0.22, sustain: 0, release: 0.3, detune: 18, mix: 0.6, octave: 0.2, unison: 5, delay: 0.45, feedback: 0.55, hall: 0.35, div: '3/16' },
      'Gated Choir': { chord: 'min7', cutoff: 4200, env: 0.4, detune: 32, mix: 0.85, spread: 1, attack: 0.02, decay: 1, sustain: 0.9, release: 1.5, chorus: 0.5, delay: 0.12, hall: 0.45, size: 5, gate: 0.9, pattern: '1011011010110110', unison: 9 },
      'Pumping Chords': { chord: 'minor', cutoff: 3600, env: 0.9, attack: 0.01, decay: 0.6, sustain: 0.8, release: 0.4, pump: 0.75, delay: 0.18, hall: 0.3 },
      'Arp Lead': { cutoff: 4500, resonance: 1.6, env: 1.5, attack: 0.002, decay: 0.18, sustain: 0.35, release: 0.25, detune: 22, octave: 0.25, delay: 0.35, feedback: 0.45, hall: 0.3, unison: 7 },
    };
    function resolve() { const e = { ...state }; for (const [id, d] of Object.entries(spec)) { const x = d.nomod ? 0 : (mod[id] || 0); e[id] = clamp(d.scale === 'log' ? state[id] * (d.max / d.min) ** x : state[id] + x * (d.max - d.min), d.min, d.max); } eff = e; return e; }
    function normalize(raw) {
      const s = raw && typeof raw === 'object' ? raw : {}, next = { ...defaults };
      for (const [id, d] of Object.entries(spec)) next[id] = finite(s[id], defaults[id], d.min, d.max);
      next.transpose = Math.round(next.transpose);
      next.unison = [1, 3, 5, 7, 9].includes(s.unison) ? s.unison : defaults.unison;
      next.chord = Object.hasOwn(CHORDS, s.chord) ? s.chord : defaults.chord;
      next.div = Object.hasOwn(DIVS, s.div) ? s.div : defaults.div;
      next.pattern = typeof s.pattern === 'string' && /^[01]{16}$/.test(s.pattern) ? s.pattern : defaults.pattern;
      { const pr = typeof s.preset === 'string' && Object.hasOwn(LEGACY, s.preset) ? LEGACY[s.preset] : s.preset; next.preset = pr === 'Custom' || (typeof pr === 'string' && Object.hasOwn(presets, pr)) ? pr : defaults.preset; }
      return next;
    }
    state = normalize({}); resolve();

    // ---------- vaste keten ----------
    // bus en ceil blijven altijd staan; alles ertussen (de staart) wordt door buildTail gebouwd en kan bij een ontsporing opnieuw worden opgebouwd
    const bus = gain(1), ceil = own(ctx.createWaveShaper());
    let lowcut, pre, shaper, post, gateG, pumpG, dry, chorusWet, sum, delaySend, hallSend, master, volume, comp, chorus, mono, dL, dR, fb, dHp, dLp, merge, dRet, preDelay, conv, hallRet, hallHp;
    let tailNodes = null;
    const monBus = own(ctx.createAnalyser()), monOut = own(ctx.createAnalyser()); monBus.fftSize = monOut.fftSize = 256; bus.connect(monBus);
    const cc = new Float32Array(2049); for (let i = 0; i < cc.length; i++) cc[i] = 0.93 * Math.tanh((i / (cc.length - 1) * 2 - 1) / 0.93); ceil.curve = cc; ceil.oversample = '2x';
    const out = ceil;
    function buildTail() {
      if (tailNodes) { try { bus.disconnect(lowcut); } catch {} for (const n of tailNodes) { stopSource(n); try { n.disconnect(); } catch {} nodes.delete(n); sources.delete(n); } }
      const n0 = new Set(nodes), s0 = new Set(sources);
      lowcut = biquad('highpass', 28); pre = gain(1); shaper = own(ctx.createWaveShaper()); post = gain(1);
      gateG = gain(1); pumpG = gain(1); dry = gain(1); chorusWet = gain(0); sum = gain(1);
      delaySend = gain(0); hallSend = gain(0); master = gain(1); volume = gain(0.75); comp = own(ctx.createDynamicsCompressor());
      const curve = new Float32Array(2049); for (let i = 0; i < curve.length; i++) { const x = i / (curve.length - 1) * 2 - 1; curve[i] = Math.tanh(x * 1.6) / Math.tanh(1.6); } shaper.curve = curve; shaper.oversample = '2x';
      comp.threshold.value = -14; comp.ratio.value = 3; comp.knee.value = 10; comp.attack.value = 0.01; comp.release.value = 0.2;
      bus.connect(lowcut).connect(pre).connect(shaper).connect(post).connect(gateG).connect(pumpG);
      pumpG.connect(dry).connect(sum); chorusWet.connect(sum);
      // stereo-chorus: drie gemoduleerde vertragingen, hard links, rechts en midden
      chorus = [];
      for (let i = 0; i < 3; i++) { const d = own(ctx.createDelay(0.1)), lfo = own(ctx.createOscillator()), depth = gain(0.002), pan = own(ctx.createStereoPanner());
        d.delayTime.value = 0.012 + i * 0.006; lfo.frequency.value = 0.21 + i * 0.13; lfo.connect(depth).connect(d.delayTime); pan.pan.value = [-1, 1, 0][i];
        pumpG.connect(d).connect(pan).connect(chorusWet); sources.add(lfo); lfo.start(); chorus.push({ d, depth }); }
      sum.connect(master); sum.connect(delaySend); sum.connect(hallSend);
      // ping-pongdelay op tempo
      mono = gain(1); mono.channelCount = 1; mono.channelCountMode = 'explicit'; mono.channelInterpretation = 'speakers';
      dL = own(ctx.createDelay(4)); dR = own(ctx.createDelay(4)); fb = gain(0.38); dHp = biquad('highpass', 320); dLp = biquad('lowpass', 5200); merge = own(ctx.createChannelMerger(2)); dRet = gain(1);
      delaySend.connect(mono).connect(dHp).connect(dLp).connect(dL); dL.connect(dR); dR.connect(fb).connect(dL);
      dL.connect(merge, 0, 0); dR.connect(merge, 0, 1); merge.connect(dRet).connect(master); dRet.connect(hallSend);
      // galm: convolutie met eigen impulsrespons
      preDelay = own(ctx.createDelay(0.2)); conv = own(ctx.createConvolver()); hallRet = gain(1); hallHp = biquad('highpass', 180);
      preDelay.delayTime.value = 0.025; hallSend.connect(hallHp).connect(preDelay).connect(conv).connect(hallRet).connect(master);
      master.connect(volume).connect(comp).connect(ceil); comp.connect(monOut);
      tailNodes = [...nodes].filter(n => !n0.has(n)).concat([...sources].filter(n => !s0.has(n)));
      buildIR(state.size);
    }
    function buildIR(seconds) {
      const sr = ctx.sampleRate, len = Math.max(1, Math.round(sr * seconds)), buf = ctx.createBuffer(2, len, sr);
      for (let c = 0; c < 2; c++) { const a = buf.getChannelData(c); let lp = 0, seed = 1234 + c * 999;
        for (let i = 0; i < len; i++) { seed = (seed * 16807) % 2147483647; const n = seed / 1073741823.5 - 1, t = i / len;
          const k = 0.12 + 0.8 * t; lp += (n - lp) * (1 - k);                // later in de staart: donkerder
          const early = i < sr * 0.08 ? 1.6 : 1; a[i] = lp * early * Math.pow(1 - t, 2.2) * Math.exp(-3 * t); } }
      conv.normalize = true; conv.buffer = buf; irSize = seconds;
    }
    buildTail();
    function scheduleIR() { if (Math.abs(state.size - irSize) < 0.05) return; if (irTimer) clearTimeout(irTimer); irTimer = setTimeout(() => { irTimer = null; if (!dead) buildIR(state.size); }, 180); }
    // bewaker: een ontspoord filter geeft Infinity en daarna NaN, en een delay met terugkoppeling of een compressor houdt NaN voor altijd vast.
    // We kijken naar de stemmen (voor de vervormer, die een ontsporing anders verbergt; normaal ruim onder 100) en naar de eindtrap; bij NaN, Infinity of een absurde waarde
    // stoppen we alle stemmen en bouwen we de staart opnieuw op.
    const chk = new Float32Array(256);
    const bad = an => { an.getFloatTimeDomainData(chk); for (let i = 0; i < chk.length; i++) if (!(Math.abs(chk[i]) < 100)) return true; return false; };
    function guard() { if (dead) return; if (bad(monBus) || bad(monOut)) recover(); }
    function recover() { for (const v of [...voices]) { for (const o of v.osc) stopSource(o); cleanup(v); } buildTail(); apply(); }
    // alleen in een live context: een offline render loopt niet in wandkloktijd, daar zou een timer willekeurig midden in de render ingrijpen
    const offline = typeof OfflineAudioContext !== 'undefined' && ctx instanceof OfflineAudioContext;
    const guardT = !offline && typeof setInterval === 'function' ? setInterval(guard, 50) : null; if (guardT && guardT.unref) guardT.unref();
    function scheduleIR() { if (Math.abs(state.size - irSize) < 0.05) return; if (irTimer) clearTimeout(irTimer); irTimer = setTimeout(() => { irTimer = null; if (!dead) buildIR(state.size); }, 180); }

    // ---------- stemmen ----------
    const voices = new Set();
    const MAXNOTES = 14;
    function level(v, t) { const age = t - v.t; if (age < 0) return 0; if (Number.isFinite(v.off) && t >= v.off) return v.offValue * Math.max(0, 1 - (t - v.off) / v.rel); if (age < v.a) return v.peak * age / v.a; if (age < v.a + v.d) return v.peak * (1 - (1 - v.s) * (age - v.a) / v.d); return v.peak * v.s; }
    function release(v, t, seconds = eff.release) { if (v.ended || t >= v.end) return; const val = level(v, t); v.amp.gain.cancelScheduledValues(t); v.amp.gain.setValueAtTime(val, t); v.amp.gain.linearRampToValueAtTime(0, t + seconds); v.off = t; v.offValue = val; v.rel = seconds; v.end = t + seconds; for (const o of v.osc) stopSource(o, t + seconds + 0.02); }
    function cleanup(v) { if (v.ended) return; v.ended = true; voices.delete(v); for (const n of v.owned) { try { n.disconnect(); } catch {} nodes.delete(n); sources.delete(n); } }
    const offsets = n => Array.from({ length: n }, (_, i) => n === 1 ? 0 : i / (n - 1) * 2 - 1);
    function voiceMix(v, t) {
      const n = v.n, side = n > 1 ? eff.mix * 1.25 / Math.sqrt(n - 1) : 0, center = 0.62 * (1 - 0.45 * eff.mix), sp = eff.spread;
      smooth(v.cG.gain, center, t); smooth(v.lG.gain, side, t); smooth(v.rG.gain, side, t);
      smooth(v.lToL.gain, (1 + sp) / 2, t); smooth(v.lToR.gain, (1 - sp) / 2, t); smooth(v.rToR.gain, (1 + sp) / 2, t); smooth(v.rToL.gain, (1 - sp) / 2, t);
      smooth(v.octG.gain, eff.octave * 0.42, t); smooth(v.subG.gain, eff.sub * 0.55, t);
      v.osc.forEach((o, i) => { if (v.det[i] !== undefined) smooth(o.detune, eff.transpose * 100 + v.det[i] * eff.detune, t); });
    }
    function voiceFilter(v, t) { const age = Math.max(0, t - v.t), base = eff.cutoff, top = Math.min(ctx.sampleRate * 0.45, base * 2 ** eff.env), sus = Math.min(ctx.sampleRate * 0.45, base * 2 ** (eff.env * v.s));
      for (const f of [v.f1, v.f2]) { f.frequency.cancelScheduledValues(t); if (age < v.a + v.d && !Number.isFinite(v.off)) { f.frequency.setValueAtTime(age < v.a ? base : top, t); if (age < v.a) f.frequency.exponentialRampToValueAtTime(top, v.t + v.a); f.frequency.exponentialRampToValueAtTime(Math.max(20, sus), v.t + v.a + v.d); } else smooth(f.frequency, sus, t); }
      smooth(v.f1.Q, eff.resonance, t); }
    function playSingle(note, vel, t, dur, root) {
      if (dead) return;
      for (const v of [...voices]) if (v.end < ctx.currentTime - 0.05) cleanup(v);
      const live = [...voices].filter(v => v.end > t + 0.01).sort((a, b) => a.t - b.t);
      if (live.length >= MAXNOTES) release(live[0], Math.max(ctx.currentTime, t), 0.01);
      if (voices.size >= MAXNOTES + 8) { const old = [...voices].sort((a, b) => a.end - b.end)[0]; for (const o of old.osc) stopSource(o); cleanup(old); }
      const n = state.unison, xs = offsets(n), f0 = hz(note), owned = [], O = x => (owned.push(x), own(x)), G = v => { const g = O(ctx.createGain()); g.gain.value = v; return g; };
      const cG = G(0), lG = G(0), rG = G(0), octG = G(0), subG = G(0), lToL = G(0), lToR = G(0), rToL = G(0), rToR = G(0), m = O(ctx.createChannelMerger(2));
      const f1 = O(ctx.createBiquadFilter()), f2 = O(ctx.createBiquadFilter()), amp = G(0);
      f1.type = f2.type = 'lowpass'; f1.frequency.value = f2.frequency.value = eff.cutoff; f2.Q.value = 0.6;
      lG.connect(lToL).connect(m, 0, 0); lG.connect(lToR).connect(m, 0, 1); rG.connect(rToR).connect(m, 0, 1); rG.connect(rToL).connect(m, 0, 0);
      cG.connect(m, 0, 0); cG.connect(m, 0, 1); octG.connect(lToL); octG.connect(rToR); subG.connect(m, 0, 0); subG.connect(m, 0, 1);
      m.connect(f1).connect(f2).connect(amp).connect(bus);
      const osc = [], det = [];
      const mk = (freq, to, d, type = 'sawtooth') => { const o = O(ctx.createOscillator()); o.type = type; o.frequency.value = freq; det.push(d); o.detune.value = eff.transpose * 100 + (d ?? 0) * eff.detune; o.connect(to);
        const ph = d === undefined ? 0 : Math.random() / freq; sources.add(o); o.start(t + ph); osc.push(o); return o; };
      xs.forEach(x => { const d = x * (0.55 + 0.45 * Math.abs(x)); mk(f0, x === 0 ? cG : x < 0 ? lG : rG, d); });
      mk(f0 * 2, octG, -0.35); mk(f0 * 2, octG, 0.35);   // octaaflaag: twee zagen, licht verstemd
      const so = O(ctx.createOscillator()); so.type = 'sine'; so.frequency.value = f0 / 2; so.detune.value = eff.transpose * 100; so.connect(subG); sources.add(so); so.start(t); osc.push(so);
      const v = { n, osc, det, cG, lG, rG, octG, subG, lToL, lToR, rToL, rToR, f1, f2, amp, root, t, a: eff.attack, d: eff.decay, s: eff.sustain, peak: 0.1 * (0.35 + 0.65 * vel), end: Infinity, off: NaN, owned, ended: false };
      voices.add(v); so.onended = () => cleanup(v);
      { const nn = v.n, side = nn > 1 ? eff.mix * 1.25 / Math.sqrt(nn - 1) : 0, sp = eff.spread; cG.gain.value = 0.62 * (1 - 0.45 * eff.mix); lG.gain.value = rG.gain.value = side;
        lToL.gain.value = rToR.gain.value = (1 + sp) / 2; lToR.gain.value = rToL.gain.value = (1 - sp) / 2; octG.gain.value = eff.octave * 0.42; subG.gain.value = eff.sub * 0.55; }
      amp.gain.setValueAtTime(0, t); amp.gain.linearRampToValueAtTime(v.peak, t + v.a); amp.gain.linearRampToValueAtTime(v.peak * v.s, t + v.a + v.d);
      f1.Q.value = eff.resonance; voiceFilter(v, t);
      if (Number.isFinite(dur)) release(v, t + Math.max(0.005, dur));
    }
    function play(note, vel, t, dur) { const iv = CHORDS[state.chord] || [0]; for (const i of iv) if (note + i >= 0 && note + i <= 127) playSingle(note + i, vel / Math.sqrt(iv.length) * (iv.length > 1 ? 1.25 : 1), t, dur, note); }
    function panic(t = ctx.currentTime) { for (const v of voices) release(v, t, 0.04); }

    // ---------- toepassen ----------
    function delayTime() { return clamp(stepDur * DIVS[state.div], 0.02, 3.9); }
    function apply() {
      const old = eff; resolve(); const t = ctx.currentTime;
      smooth(pre.gain, 1 + eff.drive * 3); smooth(post.gain, 1 / (1 + eff.drive * 1.6)); smooth(volume.gain, eff.level * 1.1);
      smooth(dry.gain, 1 - eff.chorus * 0.3); smooth(chorusWet.gain, eff.chorus * 0.75); for (const c of chorus) smooth(c.depth.gain, 0.0004 + eff.chorus * 0.0032);
      smooth(delaySend.gain, eff.delay * 0.7); smooth(fb.gain, eff.feedback); const dt = delayTime(); smooth(dL.delayTime, dt, t, 0.05); smooth(dR.delayTime, dt, t, 0.05);
      smooth(hallSend.gain, eff.hall * 0.9); smooth(hallRet.gain, 0.9);
      if (!playing || eff.gate === 0) smooth(gateG.gain, 1); if (!playing || eff.pump === 0) smooth(pumpG.gain, 1);
      for (const v of voices) { if (v.end <= t) continue; voiceMix(v, t); if (old.cutoff !== eff.cutoff || old.env !== eff.env || old.resonance !== eff.resonance) voiceFilter(v, t); }
      scheduleIR();
    }

    // ---------- UI ----------
    let root = null, ui = {}, cursorCells = [];
    const fmt = (d, v) => d.unit === '%' ? Math.round(v * 100) + '%' : d.unit === 's' ? (v < 0.1 ? Math.round(v * 1000) + ' ms' : v.toFixed(2) + ' s') : d.unit === 'Hz' ? (v >= 1000 ? (v / 1000).toFixed(1) + ' kHz' : Math.round(v) + ' Hz') : d.unit === 'st' ? (v > 0 ? '+' : '') + Math.round(v) + ' st' : v.toFixed(d.unit === 'cent' ? 0 : 1) + ' ' + d.unit;
    const toSlider = (d, v) => d.scale === 'log' ? Math.log(v / d.min) / Math.log(d.max / d.min) : (v - d.min) / (d.max - d.min);
    const fromSlider = (d, x) => { const v = d.scale === 'log' ? d.min * (d.max / d.min) ** x : d.min + x * (d.max - d.min); return d.step ? Math.round(v / d.step) * d.step : v; };
    const CSS = `:host{display:block;color:var(--fg,#dfe8ea);font:13px system-ui,sans-serif;--z-acc:#7fd6ff;--z-ink:color-mix(in srgb,var(--z-acc) 55%,var(--fg,#dfe8ea))}
.app{container-type:inline-size;background:var(--card,#141c24);border-radius:10px;padding:14px;box-sizing:border-box}

.top{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px;margin-bottom:6px}
.sel{display:flex;flex-direction:column;gap:4px;font-size:10px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted,#9fb2ba)}
select,button{font:inherit;font-size:12px;color:var(--field-fg,#e4edef);background:var(--field,#1f2c36);border:1px solid var(--line,#3b4d58);border-radius:5px;padding:6px 8px;box-sizing:border-box;max-width:100%;text-transform:none;letter-spacing:0}
button{cursor:pointer} button:hover{border-color:var(--z-acc)} .acts{display:flex;gap:6px;flex-wrap:wrap;margin:8px 0}
h3{font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--muted,#9fb2ba);font-weight:600;margin:14px 0 6px;padding-top:9px;border-top:1px solid var(--line,#33434d)}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:8px 14px}
.c{display:flex;flex-direction:column;gap:3px;min-width:0}
.c .lab{display:flex;justify-content:space-between;gap:6px;font-size:10px;letter-spacing:.05em;text-transform:uppercase;color:var(--muted,#9fb2ba)}
.c .lab span:first-child{white-space:nowrap;overflow:hidden;text-overflow:ellipsis} .c output{font-size:11px;color:var(--fg,#dfe8ea);white-space:nowrap;font-variant-numeric:tabular-nums;text-transform:none}
input[type=range]{width:100%;height:24px;margin:0;cursor:pointer;accent-color:var(--z-acc)}
.gate{display:grid;grid-template-columns:repeat(16,minmax(0,1fr));gap:3px;margin-top:4px}
.gate button{padding:0;height:24px;border-radius:3px;background:var(--well,#0c1419)} .gate button.on{background:var(--z-acc);border-color:var(--z-acc)}
.gate button:nth-child(4n+1){border-left-width:2px} .gate button.cur{outline:2px solid var(--go,#6be3a0);outline-offset:-2px}
`;
    function el(parent, tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; parent.appendChild(e); return e; }
    // meldt een regelaar aan bij de host (host.ui.adopt), zodat een skin hem als draaiknop kan tonen; id = state-sleutel
    const adopt = (e, id, role, group, label) => { if (host.ui && typeof host.ui.adopt === 'function') { try { host.ui.adopt(e, { id, role, group, label }); } catch (err) { /* oud contract */ } } };
    const GKEYS = ['sound', 'swarm', 'envelope', 'space', 'motion'];
    function selectBox(parent, label, opts, value, change, key) { const box = el(parent, 'label', 'sel'); el(box, 'span', '', label); const s = el(box, 'select'); for (const [v, t] of opts) { const o = el(s, 'option', '', t); o.value = String(v); } s.value = String(value); s.onchange = () => change(s.value); s.addEventListener('pointerdown', e => e.stopPropagation()); if (key) adopt(s, key, 'select', 'top', label); return s; }
    function mount(host_el) {
      unmount(); const wrap = document.createElement('div'); host_el.appendChild(wrap); const sh = wrap.attachShadow ? wrap.attachShadow({ mode: 'open' }) : wrap; root = host_el;
      el(sh, 'style').textContent = CSS; const app = el(sh, 'div', 'app');
      const top = el(app, 'div', 'top');
      ui.preset = selectBox(top, tx('Klankbeeld'), Object.keys(presets).map(k => [k, k]).concat([['Custom', tx('Eigen klank')]]), state.preset, v => { if (Object.hasOwn(presets, v)) self.setState({ ...defaults, ...presets[v], preset: v }); }, 'preset');
      ui.unison = selectBox(top, tx('Zagen per noot'), [[1, '1'], [3, '3'], [5, '5'], [7, tx('7 (klassiek)')], [9, tx('9 (maximaal)')]], state.unison, v => { state.unison = +v; state.preset = 'Custom'; paint(); }, 'unison');
      ui.chord = selectBox(top, tx('Akkoord per toets'), CHORD_NAMES.map(([v, n]) => [v, tx(n)]), state.chord, v => { state.chord = v; state.preset = 'Custom'; paint(); }, 'chord');
      ui.div = selectBox(top, tx('Delaytijd'), Object.keys(DIVS).map(k => [k, k]), state.div, v => { state.div = v; state.preset = 'Custom'; apply(); paint(); }, 'div');
      const acts = el(app, 'div', 'acts');
      const b1 = el(acts, 'button', '', tx('Test akkoord')); b1.type = 'button'; b1.onclick = () => { const t = ctx.currentTime + 0.03; for (const n of [57, 60, 64, 69]) playSingle(n, 0.85, t, 1.6, n); };
      const b2 = el(acts, 'button', '', tx('Test noot')); b2.type = 'button'; b2.onclick = () => play(57, 0.85, ctx.currentTime + 0.03, 0.9);
      const b3 = el(acts, 'button', '', tx('Alles uit')); b3.type = 'button'; b3.onclick = () => panic();
      ui.k = {};
      GROUPS.forEach((gname, gi) => { el(app, 'h3', '', tx(gname)); const g = el(app, 'div', 'grid');
        for (const [id, d] of Object.entries(spec)) { if (d.g !== gi) continue; const c = el(g, 'div', 'c'); const lab = el(c, 'div', 'lab'); el(lab, 'span', '', tx(d.name)).title = tx(d.name); const o = el(lab, 'output');
          const inp = el(c, 'input'); inp.type = 'range'; inp.min = '0'; inp.max = '1'; inp.step = d.step ? String(d.step / (d.max - d.min)) : '0.001'; inp.setAttribute('aria-label', tx(d.name)); inp.title = tx(d.name) + ' — ' + tx('dubbelklik voor standaard');
          inp.addEventListener('pointerdown', e => e.stopPropagation()); inp.dataset.pkDefault = String(toSlider(d, defaults[id])); adopt(inp, id, 'param', GKEYS[gi], tx(d.name));
          inp.oninput = () => { state[id] = fromSlider(d, +inp.value); state.preset = 'Custom'; o.textContent = fmt(d, state[id]); apply(); if (ui.preset) ui.preset.value = 'Custom'; };
          inp.ondblclick = () => { state[id] = defaults[id]; state.preset = 'Custom'; apply(); paint(); };
          ui.k[id] = { set(v) { inp.value = String(toSlider(d, v)); o.textContent = fmt(d, v); } }; }
        if (gi === 4) { const gl = el(g, 'div', 'c'); gl.style.gridColumn = '1 / -1'; const lab = el(gl, 'div', 'lab'); el(lab, 'span', '', tx('Gate-patroon (16 stappen, loopt met de klok)')); const row = el(gl, 'div', 'gate'); cursorCells = [];
          for (let i = 0; i < 16; i++) { const b = el(row, 'button'); b.type = 'button'; b.setAttribute('aria-label', tx('Gate stap {0}', i + 1)); b.addEventListener('pointerdown', e => e.stopPropagation());
            b.onclick = () => { const p = state.pattern.split(''); p[i] = p[i] === '1' ? '0' : '1'; state.pattern = p.join(''); state.preset = 'Custom'; paint(); }; cursorCells.push(b); } }
      });
      paint();
    }
    function paint() { if (!root) return; for (const [id, k] of Object.entries(ui.k || {})) k.set(state[id]); if (ui.preset) ui.preset.value = state.preset; if (ui.unison) ui.unison.value = String(state.unison); if (ui.chord) ui.chord.value = state.chord; if (ui.div) ui.div.value = state.div;
      cursorCells.forEach((b, i) => b.classList.toggle('on', state.pattern[i] === '1')); }
    function unmount() { if (root) root.innerHTML = ''; root = null; ui = {}; cursorCells = []; }
    let lastCur = -1;

    // ---------- instance ----------
    const self = {
      inputs: {}, outputs: { out },
      mount, unmount,
      onStep(info) { try { if (dead || !info) return; playing = true; const t = finite(info.time, ctx.currentTime, 0, 1e9), sd = Number.isFinite(info.stepDur) && info.stepDur > 0 ? info.stepDur : stepDur;
          if (Math.abs(sd - stepDur) > 1e-4) { stepDur = sd; const dt = delayTime(); smooth(dL.delayTime, dt, t, 0.05); smooth(dR.delayTime, dt, t, 0.05); }
          const step = ((info.step | 0) % 16 + 16) % 16;
          if (eff.gate > 0) { const on = state.pattern[step] === '1', g = gateG.gain; g.cancelScheduledValues(t); g.setTargetAtTime(on ? 1 : 1 - eff.gate, t, 0.004); if (on) g.setTargetAtTime(1 - eff.gate * 0.35, t + sd * 0.55, sd * 0.25); }
          if (eff.pump > 0 && step % 4 === 0) { const p = pumpG.gain; p.cancelScheduledValues(t); p.setTargetAtTime(1 - eff.pump * 0.85, t, 0.003); p.setTargetAtTime(1, t + 0.02, sd * 1.1); }
          if (cursorCells.length) { if (lastCur >= 0 && cursorCells[lastCur]) cursorCells[lastCur].classList.remove('cur'); cursorCells[step]?.classList.add('cur'); lastCur = step; }
        } catch {} },
      onTransport(info) { try { playing = !!info?.playing; if (!playing) { panic(); smooth(gateG.gain, 1); smooth(pumpG.gain, 1); if (lastCur >= 0) cursorCells[lastCur]?.classList.remove('cur'); lastCur = -1; } } catch {} },
      onEvent(port, e) { try { if (dead || port !== 'notes' || !e) return; const t = Math.max(ctx.currentTime, finite(e.time, ctx.currentTime, 0, 1e9)), type = String(e.type || '').toLowerCase().replace(/[_-]/g, '');
          if (type === 'panic' || type === 'allnotesoff') panic(t);
          else if ((type === 'noteoff' || ((type === 'note' || type === 'noteon') && e.vel === 0)) && Number.isFinite(e.note)) { for (const v of voices) if (v.root === Math.round(e.note)) release(v, t); }
          else if ((type === 'note' || type === 'noteon') && Number.isFinite(e.note)) play(Math.round(clamp(e.note, 0, 127)), finite(e.vel, 0.8, 0, 1), t, e.held === true || (type === 'noteon' && !Number.isFinite(e.dur)) ? undefined : Number.isFinite(e.dur) ? clamp(e.dur, 0.005, 120) : 0.5);
          else if (type === 'cc' && Object.hasOwn(spec, e.id) && Number.isFinite(e.value)) { const d = spec[e.id]; state[e.id] = d.min + clamp(e.value, 0, 1) * (d.max - d.min); state.preset = 'Custom'; apply(); paint(); }
        } catch {} },
      params() { return Object.entries(spec).map(([id, d]) => ({ id, name: tx(d.name), lane: 'swarm', laneName: tx('Zwerm'), min: d.min, max: d.max, scale: d.scale || 'lin', role: d.role || 'color', drift: 0.015, on: !d.nomod && d.role !== 'level' && d.role !== 'pitch' })); },
      modulate(o) { try { if (dead) return; mod = {}; if (o && typeof o === 'object' && !Array.isArray(o)) for (const id of Object.keys(spec)) if (!spec[id].nomod && typeof o[id] === 'number' && Number.isFinite(o[id])) mod[id] = clamp(o[id], -1, 1); apply(); } catch {} },
      getState() { return { ...state }; },
      setState(raw) { if (dead) return; state = normalize(raw); apply(); paint(); },
      destroy() { if (dead) return; dead = true; if (irTimer) clearTimeout(irTimer); if (guardT) clearInterval(guardT); unmount(); for (const v of [...voices]) cleanup(v); for (const n of sources) stopSource(n); for (const n of nodes) try { n.disconnect(); } catch {} sources.clear(); nodes.clear(); },
    };
    apply();
    return self;
  },
};
