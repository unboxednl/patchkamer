// SPDX-License-Identifier: AGPL-3.0-or-later
// 1.15.0 — Regelaars herkenbaar voor skins (contract v1.15, additief): id, rol en groep op de host.ui.knob/select-aanroepen; een oudere host negeert ze. Geluid, state, presets, poorten en uiterlijk ongewijzigd.
// 1.11.1 — Zachte begrenzer op de uitgang: bij het niveau op 1 met de sub op 1 klipte de uitgang (een volle oscillator plus een volle sub is 2 groot vóór het filter). Tot 0,9 is het geluid bit voor bit ongewijzigd, daarboven buigt het zacht af naar 0,99.
// 1.11.0 — Nieuw als Basic Mono (nieuwe naam; de id nl.patchkamer.mono blijft gelijk, dus bestaande werkruimtes laden), eigen map, bijgewerkt naar Patchkamer contract v1.11:
//   - tweetalig (host.lang, namen per taal in i18n); de naam is in alle talen Basic Mono
//   - setState volgt §13: onbekende velden worden genegeerd, ongeldige waarden krijgen de standaard, getallen worden binnen hun bereik afgekapt
//   - dubbelklik op een knop zet hem terug op de beginwaarde
//   - bewaker: een meter kijkt om de 50 ms naar de uitvoer van het filter; wordt dat niet eindig (NaN, Infinity) of absurd groot, dan wordt het filter
//     vervangen, zodat een ontspoord filter het apparaat niet voor altijd stil kan leggen en geen NaN naar de rest van de studio stuurt
//   - noten en sturing met een niet-eindige waarde worden genegeerd of op een veilige waarde gezet
// Een eenvoudige monofone synth: een oscillator (zaag, blok of driehoek) met een sub-oscillator, een resonant lowpass-filter met envelope,
// glide en een versterker met decay. Alle knoppen zijn stuurbaar; cutoff, stemming, resonantie, sub en niveau ook sample-nauwkeurig.
// Modulatie komt bovenop de knopstand: de knop blijft de basis, een modulator laat de klank eromheen bewegen.

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const fin = (v, d) => (typeof v === 'number' && Number.isFinite(v) ? v : d);
const EN = {
  'Stemming': 'Tune', 'Reso': 'Resonance', 'Niveau': 'Level', 'Golf': 'Wave',
  'zaag': 'sawtooth', 'blok': 'square', 'driehoek': 'triangle',
};
// id, naam, min, max, stap, standaard, weergave, rol, logaritmisch, voorgesteld bereik, standaard aan
const P = [
  ['fine',  'Stemming', -100, 100, 1,     0,    v => (v > 0 ? '+' : '') + Math.round(v) + ' ct', 'pitch',  false, 0.05, true],
  ['cut',   'Cutoff',   80,   8000, 1,    800,  v => Math.round(v) + ' Hz',                    'filter', true,  0.10, true],
  ['res',   'Reso',     0.5,  24,  0.1,   8,    v => v.toFixed(1),                             'res',    false, 0.12, true],
  ['env',   'Env mod',  0,    1,   0.01,  0.6,  v => Math.round(v * 100) + '%',                'env',    false, 0.15, true],
  ['dec',   'Decay',    0.05, 2,   0.01,  0.25, v => v.toFixed(2) + ' s',                      'decay',  true,  0.12, false],
  ['sub',   'Sub',      0,    1,   0.01,  0.3,  v => Math.round(v * 100) + '%',                'sub',    false, 0.15, false],
  ['glide', 'Glide',    0,    0.3, 0.005, 0,    v => Math.round(v * 1000) + ' ms',             'glide',  false, 0.10, false],
  ['lvl',   'Niveau',   0,    1,   0.01,  0.5,  v => Math.round(v * 100) + '%',                'level',  false, 0.06, false],
];
const BY = Object.fromEntries(P.map(p => [p[0], p]));
const GRP = { fine: 'osc', sub: 'osc', cut: 'filter', res: 'filter', env: 'env', dec: 'env', glide: 'play', lvl: 'out' };   // sectie per regelaar (voor skins); de golfvorm (wave) hoort ook bij 'osc'
const WAVES = ['sawtooth', 'square', 'triangle'];
// zachte begrenzer op de uitgang: een volle oscillator plus een volle sub is samen al 2 groot, en met het niveau op 1 klipt dat. De begrenzer telt een correctie op bij het
// onveranderde signaal: tot 0,9 is de correctie precies 0 (het signaal blijft bit voor bit gelijk), daarboven buigt hij zacht af naar een plafond van 0,99.
// De curve beslaat −32 … 32 (voor en na de curve een factor 1/32 en 32, beide exact) en geeft de correctie (begrensd signaal min signaal).
const LIM_K = 0.9, LIM_C = 0.99, LIM_N = 32769, LIM_R = 32;
const limCurve = (() => { const c = new Float32Array(LIM_N);
  for (let i = 0; i < LIM_N; i++) { const x = LIM_R * (-1 + 2 * i / (LIM_N - 1)), a = Math.abs(x); const g = a <= LIM_K ? 0 : LIM_K + (LIM_C - LIM_K) * Math.tanh((a - LIM_K) / (LIM_C - LIM_K)) - a; c[i] = Math.sign(x) * g / LIM_R; }
  return c; })();
const FAST = { cut: 1200 * Math.log2(8000 / 80), fine: 200, res: 23.5, sub: 1, lvl: 1 };   // signaal −1..1 → eenheid van de AudioParam

export default {
  id: 'nl.patchkamer.mono',
  name: 'Basic Mono',
  version: '1.15.0',
  kind: 'instrument',
  category: 'synth',
  ui: { width: 340 },
  i18n: { nl: { ports: { out: 'Uit', notes: 'Noten' } } },
  ports: { audioIn: [], audioOut: [{ id: 'out', name: 'Out' }], eventIn: [{ id: 'notes', name: 'Notes' }], eventOut: [], modIn: [{ id: 'mod', name: 'Mod' }] },

  create(ctx, host) {
    const tx = k => (host.lang === 'nl' ? k : (EN[k] ?? k));
    const osc = ctx.createOscillator(), sub = ctx.createOscillator(), vca = ctx.createGain(), out = ctx.createGain(), subG = ctx.createGain();
    const limPre = ctx.createGain(), lim = ctx.createWaveShaper(), limPost = ctx.createGain(), limOut = ctx.createGain(); limPre.gain.value = 1 / LIM_R; lim.curve = limCurve; limPost.gain.value = LIM_R; limOut.gain.value = 1; out.connect(limOut); out.connect(limPre); limPre.connect(lim); lim.connect(limPost); limPost.connect(limOut);
    osc.type = 'sawtooth'; sub.type = 'square'; vca.gain.value = 0; subG.gain.value = 0.3; out.gain.value = 0.5;
    const mon = ctx.createAnalyser(); mon.fftSize = 256;   // meter op de uitvoer van het filter (voor de versterker)
    let f = null, baseCut = 800;
    const fastIn = {};
    const fastTargets = { cut: () => [f.detune], fine: () => [osc.detune, sub.detune], res: () => [f.Q], sub: () => [subG.gain], lvl: () => [out.gain] };
    function mkFilter() { f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = baseCut; }
    let safeUntil = 0;   // na herhaald ontsporen: de snelle sturing van cutoff en resonantie tijdelijk loskoppelen
    const isSafe = id => safeUntil > 0 && (id === 'cut' || id === 'res');
    function wire() {
      osc.connect(f); sub.connect(subG).connect(f); f.connect(vca); f.connect(mon);
      Object.keys(fastIn).forEach(id => { if (!isSafe(id)) fastTargets[id]().forEach(p => fastIn[id].connect(p)); });
    }
    mkFilter(); vca.connect(out); wire(); osc.start(); sub.start();
    const DEF = () => ({ wave: 'sawtooth', ...Object.fromEntries(P.map(p => [p[0], p[5]])) });
    const state = DEF();
    const mod = {};   // som van alle modulatoren, −1..1 per parameter (deel van het bereik)
    const eff = k => { const [, , mn, mx, , , , , log] = BY[k]; const b = state[k], o = mod[k] || 0; if (!o) return b;
      return log ? clamp(b * Math.pow(mx / mn, o), mn, mx) : clamp(b + o * (mx - mn), mn, mx); };
    let dead = false;
    const apply = () => { if (dead) return; const t = ctx.currentTime; osc.type = state.wave;
      f.Q.setTargetAtTime(eff('res'), t, 0.03); subG.gain.setTargetAtTime(eff('sub'), t, 0.03); out.gain.setTargetAtTime(eff('lvl'), t, 0.03);
      osc.detune.setTargetAtTime(eff('fine'), t, 0.05); sub.detune.setTargetAtTime(eff('fine'), t, 0.05); };
    apply();

    // bewaker: een instabiel filter (veel resonantie, snelle sturing van de cutoff) geeft Infinity en daarna NaN en herstelt nooit meer; dan vervangen we het filter
    // Houdt de oorzaak aan (een modulator die de cutoff op audiosnelheid door het hele bereik stuurt), dan ontspoort ook het nieuwe filter meteen weer:
    // bij een tweede ontsporing binnen een seconde gaat de snelle sturing van cutoff en resonantie steeds langer los (2 s, 4 s, … tot een minuut).
    const chk = new Float32Array(256); let lastTrip = -1e9, safeLen = 2;
    function rewire(reset) {
      Object.keys(fastIn).forEach(id => { try { fastIn[id].disconnect(); } catch (e) {} });
      if (reset) { try { f.disconnect(); } catch (e) {} mkFilter(); }
      wire(); apply();
    }
    function guard() {
      if (dead) return; const now = ctx.currentTime;
      if (safeUntil && now >= safeUntil) { safeUntil = 0; rewire(false); }
      mon.getFloatTimeDomainData(chk);
      for (let i = 0; i < chk.length; i++) if (!(Math.abs(chk[i]) < 100)) {   // normaal ruim onder ±40; een ontspoord filter loopt in tientallen ms naar 1e6
        if (now - lastTrip < 1) { safeLen = Math.min(safeLen * 2, 64); safeUntil = now + safeLen; } else if (now - lastTrip > 20) safeLen = 2;
        lastTrip = now; rewire(true); return;
      }
    }
    // alleen in een live context: een offline render loopt niet in wandkloktijd, daar zou een timer willekeurig midden in de render ingrijpen
    const offline = typeof OfflineAudioContext !== 'undefined' && ctx instanceof OfflineAudioContext;
    const guardT = !offline && typeof setInterval === 'function' ? setInterval(guard, 50) : null; if (guardT && guardT.unref) guardT.unref();

    const knobs = {}; let waveSel = null;
    return {
      inputs: {}, outputs: { out: limOut },
      mount(el) {
        waveSel = host.ui.select(el, tx('Golf'), [['sawtooth', tx('zaag')], ['square', tx('blok')], ['triangle', tx('driehoek')]], state.wave, v => { state.wave = WAVES.includes(v) ? v : 'sawtooth'; apply(); }, { id: 'wave', role: 'select', group: 'osc' });
        P.forEach(([k, lab, mn, mx, st, def, fmt]) => { knobs[k] = host.ui.knob(el, tx(lab), [mn, mx, st], state[k], fmt, v => { state[k] = clamp(fin(v, def), mn, mx); apply(); }, { default: def, id: k, role: 'param', group: GRP[k] }); });
      },
      onEvent(port, ev) {
        if (!ev || ev.type !== 'note' || !Number.isFinite(ev.note)) return;
        const t = Number.isFinite(ev.time) ? ev.time : ctx.currentTime, vel = clamp(fin(ev.vel, 0.8), 0, 1), fr = 440 * Math.pow(2, (ev.note - 69) / 12), glide = eff('glide'), cut = eff('cut'), dec = eff('dec');
        const dur = Number.isFinite(ev.dur) && ev.dur > 0 ? ev.dur : 0.2; baseCut = cut;
        [osc, sub].forEach((o, i) => { const fq = i ? fr / 2 : fr; o.frequency.cancelScheduledValues(t); if (glide > 0) o.frequency.setTargetAtTime(fq, t, glide / 3); else o.frequency.setValueAtTime(fq, t); });
        const peak = clamp(cut + eff('env') * 6000 * (vel > 0.9 ? 1.3 : 1), 80, 16000);
        f.frequency.cancelScheduledValues(t); f.frequency.setValueAtTime(cut, t); f.frequency.linearRampToValueAtTime(peak, t + 0.005); f.frequency.setTargetAtTime(cut, t + 0.005, dec / 3);
        vca.gain.cancelScheduledValues(t); vca.gain.setValueAtTime(0.0001, t); vca.gain.linearRampToValueAtTime(vel * 0.8, t + 0.004); vca.gain.setTargetAtTime(vel * 0.3, t + 0.004, dec); vca.gain.setTargetAtTime(0.0001, t + dur, 0.01);
      },
      onTransport({ playing }) { if (!playing) { vca.gain.cancelScheduledValues(ctx.currentTime); vca.gain.setTargetAtTime(0, ctx.currentTime, 0.02); } },
      // contract v1.3 — wat een modulator mag besturen
      params() { return P.map(([id, name, min, max, , , , role, log, drift, on]) => ({ id, name: tx(name), lane: 'synth', laneName: 'Synth', min, max, role, scale: log ? 'log' : 'lin', drift, on, fast: id in FAST })); },
      // contract v1.4 — snelle sturing: een GainNode per parameter, die het signaal omrekent en optelt bij de AudioParam
      modInput(id) { if (!(id in FAST)) return null; if (fastIn[id]) return fastIn[id]; const g = ctx.createGain(); g.gain.value = FAST[id];
        fastIn[id] = g; if (!isSafe(id)) fastTargets[id]().forEach(p => g.connect(p)); return g; },
      modulate(offsets) { for (const k in mod) delete mod[k]; for (const k in offsets || {}) if (BY[k] && Number.isFinite(offsets[k])) mod[k] = offsets[k]; apply(); },
      getState() { return { ...state }; },
      setState(s) { const d = DEF(); s = s && typeof s === 'object' ? s : {}; state.wave = WAVES.includes(s.wave) ? s.wave : d.wave;
        P.forEach(([k, , mn, mx]) => { state[k] = typeof s[k] === 'number' && Number.isFinite(s[k]) ? clamp(s[k], mn, mx) : d[k]; if (knobs[k]) knobs[k].set(state[k]); }); if (waveSel) waveSel.value = state.wave; apply(); },
      destroy() { if (dead) return; dead = true; if (guardT) clearInterval(guardT); try { osc.stop(); sub.stop(); } catch (e) {} try { mon.disconnect(); } catch (e) {} try { f.disconnect(); } catch (e) {} try { out.disconnect(); } catch (e) {} try { limPre.disconnect(); lim.disconnect(); limPost.disconnect(); limOut.disconnect(); } catch (e) {} Object.values(fastIn).forEach(g => { try { g.disconnect(); } catch (e) {} }); }
    };
  }
};
