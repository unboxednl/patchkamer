// SPDX-License-Identifier: AGPL-3.0-or-later
// 1.15.1 — Reverb length (size) is nu ook stuurbaar (params/modulate, standaard uit in Drift). Een gemoduleerde lengte bouwt de galmimpuls opnieuw op: dat gebeurt hoogstens vier keer per seconde en in stappen van 0,1 s (niet beluisterd: de galmstaart wisselt bij elke stap). Knopwaarde, getState, presets, poorten en geluid zonder modulatie ongewijzigd. Alle continue regelaars staan nu in params(); bewust niet: het keuzemenu Delay (op tempo of vrij).
// 1.15.0 — Regelaars herkenbaar voor skins (contract v1.15, additief): id, rol en groep op de host.ui.knob/select-aanroepen; een oudere host negeert ze. Geluid, state, presets, poorten en uiterlijk ongewijzigd.
// 1.11.1 — De kaart kan niet smaller dan 280 px (minWidth): daaronder werden titel, keuzelijsten of regelaars afgekapt als een bewaarde werkruimte of het slepen de kaart smaller maakte. Geluid, state en gedrag ongewijzigd.
// 1.11.0 — Patchkamer contract v1.11. Nieuwe naam Room en nieuwe id nl.patchkamer.room (voorheen Ruimte, nl.patchkamer.ruimte); presets en songs uit die tijd verwijzen naar de oude id.
//          Tweetalig (host.lang, poortnamen per taal in i18n), setState kapt getallen af op hun bereik en negeert onbekende velden, het tempo wordt op eindigheid gecontroleerd.
//          Bewaker: een kleine worklet begrenst de ingang (±16 = +24 dB) en zet NaN op 0, en een meter controleert om de 50 ms of de delaylus of de galm niet-eindige waarden geeft en vervangt die dan.
//          Normaal geluid is bit-identiek aan de vorige versie.
// Room: delay (op tempo of vrij, met een highpass in de lus) plus galm (een korte ruisimpuls met een toonfilter).
// Zonder AudioWorklet werkt Room nog steeds; alleen de ingangsbeveiliging is dan niet actief (de meter blijft).

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
// id, naam per taal (nl, en), min, max, log, rol, bereik, aan, spoor
const MODP = [['time', 'Tijd (vrij)', 'Time (free)', 0.05, 1.5, true, 'time', 0.03, false, 'delay'], ['fb', 'Feedback', 'Feedback', 0, 0.92, false, 'feedback', 0.10, true, 'delay'], ['hp', 'Delay HP', 'Delay HP', 40, 2000, true, 'filter', 0.10, true, 'delay'], ['dsend', 'Delay mix', 'Delay mix', 0, 1, false, 'send', 0.10, false, 'delay'],
  ['tone', 'Galm toon', 'Reverb tone', 500, 16000, true, 'tone', 0.10, true, 'reverb'], ['wet', 'Galm mix', 'Reverb mix', 0, 1, false, 'send', 0.08, true, 'reverb'],
  ['size', 'Galm lengte', 'Reverb length', 0.3, 8, true, 'decay', 0.05, false, 'reverb']];
const TXT = {
  nl: { delay: 'Delay', sync: 'op tempo (3/16)', free: 'vrij', time: 'Tijd', size: 'Galm', laneDelay: 'Delay', laneReverb: 'Galm' },
  en: { delay: 'Delay', sync: 'to tempo (3/16)', free: 'free', time: 'Time', size: 'Reverb', laneDelay: 'Delay', laneReverb: 'Reverb' },
};
const SIZE = [0.3, 8];

// Ingangsbeveiliging: NaN wordt 0, alles boven ±16 (+24 dB) wordt begrensd. Een delaylus met feedback blijft anders voorgoed NaN geven.
const WNAME = 'nl-patchkamer-room-1-11-0';
const WORKLET = `
const IN_MAX = 16;
class RoomGuard extends AudioWorkletProcessor {
  process(inputs, outputs) {
    const a = inputs[0], b = outputs[0];
    for (let c = 0; c < b.length; c++) { const x = a[c]; if (!x) continue; const y = b[c];
      for (let n = 0; n < x.length; n++) { const v = x[n]; y[n] = (v > -IN_MAX && v < IN_MAX) ? v : (v !== v ? 0 : v > 0 ? IN_MAX : -IN_MAX); } }
    return true;
  }
}
registerProcessor('${WNAME}', RoomGuard);`;

export default {
  id: 'nl.patchkamer.room', name: 'Room', version: '1.15.1', category: 'effect', kind: 'effect',
  i18n: { en: { ports: { in: 'In', out: 'Out' } } },
  ui: { width: 300, minWidth: 280 },
  ports: { audioIn: [{ id: 'in', name: 'In' }], audioOut: [{ id: 'out', name: 'Uit' }], eventIn: [], eventOut: [], modIn: [{ id: 'mod', name: 'Mod' }] },
  create(ctx, host) {
    const nl = !!host && host.lang === 'nl', T = nl ? TXT.nl : TXT.en, NI = nl ? 1 : 2;
    const input = ctx.createGain(), inG = ctx.createGain(), out = ctx.createGain(), dry = ctx.createGain(), dsend = ctx.createGain(), rtone = ctx.createBiquadFilter(), wet = ctx.createGain();
    let dly = ctx.createDelay(2), fb = ctx.createGain(), dlp = ctx.createBiquadFilter(), dhp = ctx.createBiquadFilter(), conv = ctx.createConvolver(), reverbBuf = null;
    const probeLoop = ctx.createAnalyser(), probeRev = ctx.createAnalyser(); probeLoop.fftSize = probeRev.fftSize = 4096;
    dlp.type = 'lowpass'; dlp.frequency.value = 3000; dhp.type = 'highpass'; rtone.type = 'lowpass';
    input.connect(inG); inG.connect(dry).connect(out); inG.connect(dsend).connect(dly).connect(dhp).connect(dlp).connect(fb).connect(dly); dlp.connect(out); dlp.connect(probeLoop); inG.connect(conv).connect(rtone).connect(wet).connect(out); rtone.connect(probeRev);
    const state = { time: 0.375, fb: 0.4, dsend: 0.3, size: 3, wet: 0.3, sync: true, hp: 200, tone: 6000 };
    const defaults = { ...state }; let dead = false;
    function impulse(sec) { const len = Math.floor(ctx.sampleRate * sec), b = ctx.createBuffer(2, len, ctx.sampleRate); for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); let lp = 0; for (let i = 0; i < len; i++) { const w = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.4); lp += 0.4 * (w - lp); d[i] = lp; } } return b; }
    const mod = {}, E = k => { const m = MODP.find(x => x[0] === k), b = state[k], o = mod[k] || 0; if (!o) return b; return m[5] ? clamp(b * Math.pow(m[4] / m[3], o), m[3], m[4]) : clamp(b + o * (m[4] - m[3]), m[3], m[4]); };
    let fbScale = 1;   // bewaker: vermindert de feedback tijdelijk als de delaylus oploopt (zie watch)
    const bpm = +(host && host.bpm);
    let lastStepDur = 60 / (Number.isFinite(bpm) && bpm > 0 ? bpm : 120) / 4, lastSize = 0;
    const apply = () => { const t = ctx.currentTime, r = 0.04, w = E('wet'); fb.gain.setTargetAtTime(E('fb') * fbScale, t, r); dsend.gain.setTargetAtTime(E('dsend'), t, r); wet.gain.setTargetAtTime(w * 1.2, t, r); dry.gain.setTargetAtTime(1 - w * 0.4, t, r); dhp.frequency.setTargetAtTime(E('hp'), t, r); rtone.frequency.setTargetAtTime(E('tone'), t, r); dly.delayTime.setTargetAtTime(state.sync ? Math.min(1.9, lastStepDur * 3) : E('time'), t, 0.08); };
    let revAt = -1e9, revPend = false;
    const clock = () => (typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now());
    // throttle: alleen voor een gemoduleerde lengte (vanuit modulate/watch); de knop en setState bouwen direct, zoals voorheen
    const mkRev = throttle => {
      const sz = mod.size ? Math.round(E('size') * 10) / 10 : state.size;
      if (Math.abs(lastSize - sz) > 0.05) {
        if (throttle && clock() - revAt < 250) { revPend = true; return; }
        reverbBuf = impulse(sz); conv.buffer = reverbBuf; lastSize = sz; revAt = clock();
      }
      revPend = false;
    };
    mkRev(); apply();
    // bewaker 1: de ingangsbeveiliging (worklet); zonder AudioWorklet blijft de ingang direct verbonden
    let guard = null;
    if (host && typeof host.loadWorklet === 'function') host.loadWorklet(WNAME, WORKLET).then(() => {
      if (dead || typeof AudioWorkletNode === 'undefined') return;
      const g = new AudioWorkletNode(ctx, WNAME); guard = g; input.disconnect(inG); input.connect(g).connect(inG);
    }).catch(() => {});
    // bewaker 2: een ontspoorde delaylus of galm (NaN, Infinity, absurd groot) wordt vervangen door een nieuwe met dezelfde instellingen
    function replaceLoop() {
      try { dsend.disconnect(); dly.disconnect(); dhp.disconnect(); dlp.disconnect(); fb.disconnect(); } catch { }
      dly = ctx.createDelay(2); fb = ctx.createGain(); dlp = ctx.createBiquadFilter(); dhp = ctx.createBiquadFilter(); dlp.type = 'lowpass'; dlp.frequency.value = 3000; dhp.type = 'highpass';
      dsend.connect(dly).connect(dhp).connect(dlp).connect(fb).connect(dly); dlp.connect(out); dlp.connect(probeLoop); apply();
    }
    function replaceReverb() {
      try { inG.disconnect(conv); conv.disconnect(); } catch { }
      conv = ctx.createConvolver(); if (reverbBuf) conv.buffer = reverbBuf; inG.connect(conv).connect(rtone);
    }
    const buf = new Float32Array(4096);
    // peak van de laatste ~85 ms; Infinity als er iets niet-eindigs of absurds (>1e4) in zit
    const peak = p => { p.getFloatTimeDomainData(buf); let m = 0; for (let i = 0; i < buf.length; i++) { const v = buf[i]; if (!(v > -1e4 && v < 1e4)) return Infinity; const a = v < 0 ? -v : v; if (a > m) m = a; } return m; };
    const watch = () => {
      if (dead) return;
      const pl = peak(probeLoop);
      if (pl === Infinity) { fbScale = 1; replaceLoop(); }
      else if (pl > 6) { fbScale = Math.max(0.3, fbScale * 0.85); apply(); }     // de delaylus loopt op (de lusversterking kan boven 1 komen): feedback tijdelijk omlaag
      else if (pl < 1.5 && fbScale < 1) { fbScale = Math.min(1, fbScale + 0.02); apply(); }
      if (peak(probeRev) === Infinity) replaceReverb();
      if (revPend) mkRev(true);
    };
    const timer = typeof OfflineAudioContext !== 'undefined' && ctx instanceof OfflineAudioContext ? 0 : setInterval(watch, 50);
    const ui = {};
    return {
      inputs: { in: input }, outputs: { out },
      mount(el) {
        el.addEventListener('pointerdown', e => e.stopPropagation());
        ui.sync = host.ui.select(el, T.delay, [['sync', T.sync], ['free', T.free]], state.sync ? 'sync' : 'free', v => { state.sync = v === 'sync'; apply(); }, { id: 'sync', group: 'delay' });
        ui.time = host.ui.knob(el, T.time, [0.05, 1.5, 0.005], state.time, v => v.toFixed(3) + ' s', v => { state.time = v; apply(); }, { default: defaults.time, id: 'time', group: 'delay' });
        ui.fb = host.ui.knob(el, MODP[1][NI], [0, 0.92, 0.01], state.fb, v => Math.round(v * 100) + '%', v => { state.fb = v; apply(); }, { default: defaults.fb, id: 'fb', group: 'delay' });
        ui.hp = host.ui.knob(el, MODP[2][NI], [40, 2000, 10], state.hp, v => Math.round(v) + ' Hz', v => { state.hp = v; apply(); }, { default: defaults.hp, id: 'hp', group: 'delay' });
        ui.dsend = host.ui.knob(el, MODP[3][NI], [0, 1, 0.01], state.dsend, v => Math.round(v * 100) + '%', v => { state.dsend = v; apply(); }, { default: defaults.dsend, id: 'dsend', group: 'delay' });
        ui.size = host.ui.knob(el, T.size, [0.3, 8, 0.1], state.size, v => v.toFixed(1) + ' s', v => { state.size = v; mkRev(); }, { default: defaults.size, id: 'size', group: 'reverb' });
        ui.tone = host.ui.knob(el, MODP[4][NI], [500, 16000, 50], state.tone, v => Math.round(v) + ' Hz', v => { state.tone = v; apply(); }, { default: defaults.tone, id: 'tone', group: 'reverb' });
        ui.wet = host.ui.knob(el, MODP[5][NI], [0, 1, 0.01], state.wet, v => Math.round(v * 100) + '%', v => { state.wet = v; apply(); }, { default: defaults.wet, id: 'wet', group: 'mix' });
      },
      onStep(info) { if (!info) return; const { stepDur, time } = info; if (!Number.isFinite(stepDur) || stepDur <= 0 || !Number.isFinite(time)) return; lastStepDur = stepDur; if (state.sync) dly.delayTime.setTargetAtTime(Math.min(1.9, stepDur * 3), time, 0.05); },
      params() { return MODP.map(m => ({ id: m[0], name: m[NI], lane: m[9], laneName: m[9] === 'delay' ? T.laneDelay : T.laneReverb, min: m[3], max: m[4], role: m[6], scale: m[5] ? 'log' : 'lin', drift: m[7], on: m[8] })); },
      modulate(o) { for (const k in mod) delete mod[k]; for (const k in o || {}) if (MODP.some(x => x[0] === k) && typeof o[k] === 'number' && Number.isFinite(o[k])) mod[k] = clamp(o[k], -1, 1); apply(); mkRev(!!timer); },
      getState() { return { ...state }; },
      setState(s) {
        s = s && typeof s === 'object' ? s : {};
        for (const k of Object.keys(defaults)) {
          if (k === 'sync') { state.sync = typeof s.sync === 'boolean' ? s.sync : defaults.sync; continue; }
          const m = MODP.find(p => p[0] === k), range = m ? [m[3], m[4]] : SIZE;
          state[k] = typeof s[k] === 'number' && Number.isFinite(s[k]) ? clamp(s[k], range[0], range[1]) : defaults[k];
        }
        mkRev(); apply();
        for (const k of Object.keys(ui)) { if (k === 'sync') ui.sync.value = state.sync ? 'sync' : 'free'; else ui[k].set(state[k]); }
      },
      destroy() { if (dead) return; dead = true; if (timer) clearInterval(timer); [input, inG, out, dry, dly, fb, dlp, dhp, dsend, conv, rtone, wet, probeLoop, probeRev, guard].forEach(n => { try { if (n) n.disconnect(); } catch { } }); }
    };
  }
};
