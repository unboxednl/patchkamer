// SPDX-License-Identifier: AGPL-3.0-or-later
// 1.0.0 — Pad Sampler, stap 1 (kern), Patchkamer contract v1.26. Een sampler met 4 banken van 16 pads, 4 lagen per pad (velocity, cycle, random, all),
//          drum- en keygroup-modus (zones met toetsbereik en grondtoon), AD/ADSR-envelope en filter per pad, mutegroepen, polyfonie per pad,
//          one-shot/hold, omgekeerd afspelen, een eigen audio-uitgang per pad (out1 t/m out16 naast de stereomix) en events met tijd op de audioklok.
//          Samples staan als PCM16/base64 in een samplestore (gededupliceerd op hash, hoogstens 64 MiB); de ingebouwde demo-samples zijn gesynthetiseerd
//          en staan niet in de state. De golfvormeditor, chop, Flatten en de catalogus volgen in latere stappen.

// ---------- teksten per taal (host.lang): Nederlandse bron, Engels als alternatief ----------
const TXT = {
  nl: {
    bank: 'Bank', bankName: 'Banknaam', stopAll: 'Stop alles', octDown: 'Octaaf lager', octUp: 'Octaaf hoger',
    tabPad: 'Pad', tabLayers: 'Lagen', tabZones: 'Zones', tabProgram: 'Programma',
    padName: 'Naam van het pad', clearPad: 'Wis pad', mode: 'Soort', modeDrum: 'Drum (pad)', modeKey: 'Keygroup (toetsen)', play: 'Spelen',
    pVelocity: 'Op velocity', pCycle: 'Om de beurt', pRandom: 'Willekeurig', pAll: 'Alle lagen', output: 'Uitgang', outMix: 'Stereomix', outN: 'Uitgang',
    oneShot: 'One-shot', reverse: 'Omgekeerd', envelope: 'Envelope', envShape: 'Vorm', filter: 'Filter', filterType: 'Soort filter', off: 'Uit',
    lp: 'Laagdoorlaat', hp: 'Hoogdoorlaat', bp: 'Banddoorlaat', layer: 'Laag', sample: 'Sample', none: '– geen –', loadFile: 'Bestand laden…', clearLayer: 'Wis laag',
    waveform: 'Golfvorm van het sample (alleen weergave)', loop: 'Lus', loopOn: 'Lus aan',
    layerHelp: 'Een pad heeft vier lagen. Bij Op velocity klinkt elke laag waarvan het velocity-bereik de aanslag bevat; bij Om de beurt en Willekeurig kiest het pad er één; bij Alle lagen klinken ze allemaal. Een lus werkt alleen als One-shot uit staat. De crossfade van de lus volgt in een volgende versie.',
    zoneHelp: 'Zones gelden voor een pad van het soort Keygroup: elk sample krijgt een toetsbereik en een grondtoon, en klinkt getransponeerd. Zonder zones speelt het pad zijn lagen chromatisch rond de grondtoon van elke laag.',
    zone: 'Zone', zoneAdd: 'Zone toevoegen', zoneDel: 'Zone verwijderen', zoneNotKey: 'Zet het pad op Keygroup (tabblad Pad) om zones te gebruiken.', zoneCount: '{0} zone(s).', zoneNone: 'Nog geen zones: de lagen klinken chromatisch rond hun grondtoon.',
    demoKit: 'Demo-kit herstellen', demoKitDone: 'Demo-kit teruggezet in bank A.', clearAll: 'Leeg programma', clearDone: 'Alle banken zijn leeg.',
    help: 'Pads: klik, tik of gebruik het toetsenbord (Enter of spatie; 1234, qwer, asdf, zxcv; pijltjes verplaatsen). Een bestand slepen op een pad laadt het daar. Drum-pads luisteren naar de noten vanaf Eerste pad (bank A pad 1 tot bank D pad 16); een keygroup luistert naar de toetsbereiken van zijn zones. Elke uitgang (Uitgang 1 tot 16) is los te mixen; de stereomix heeft een zachte begrenzer, de losse uitgangen niet. Bluetooth-uitvoer is traag: gebruik een kabel of een audio-interface voor lage latency.',
    dropHint: 'Geen sample: sleep een bestand hierheen of kies Bestand laden', keys: 'toetsen', empty: 'leeg', pad: 'Pad', builtin: 'ingebouwd', noSample: 'Geen sample in deze laag.',
    mem: 'Samplegeheugen: {0} van {1} MiB PCM.', voices: 'Stemmen', master: 'Master',
    memFull: 'Samplegeheugen vol: maximaal 64 MiB PCM16. Verwijder samples of kies een korter bestand.', noDecode: 'Audio-decodering is niet beschikbaar in deze omgeving.',
    fileBig: 'Bestand te groot (maximaal 50 MiB).', loading: 'Laden: {0}', decodeFail: 'Kon {0} niet decoderen. Is het een geldige WAV, FLAC, OGG of MP3?', noAudio: '{0} bevat geen audio.',
    tooLong: 'Sample langer dan 120 seconden. Kies een korter fragment.', loaded: '{0} sample(s) geladen.', dropped: '{0} sample(s) niet geladen (ongeldig of geheugen vol).',
    k: {
      level: 'Mastervolume', baseNote: 'Eerste pad (MIDI)', padVel: 'Aanslag van pads', 'pad.tune': 'Toonhoogte', 'pad.fine': 'Fijn', 'pad.level': 'Niveau', 'pad.pan': 'Panorama', 'pad.poly': 'Polyfonie', 'pad.mute': 'Mutegroep', 'pad.baseNote': 'Noot bij tikken',
      'env.attack': 'Attack', 'env.decay': 'Decay', 'env.sustain': 'Sustain', 'env.release': 'Release',
      'filt.cutoff': 'Cutoff', 'filt.res': 'Resonantie', 'filt.envAmt': 'Envelop-diepte', 'filt.velAmt': 'Velocity-diepte',
      'layer.semi': 'Halve tonen', 'layer.fine': 'Fijn', 'layer.level': 'Niveau', 'layer.pan': 'Panorama', 'layer.offset': 'Offset', 'layer.root': 'Grondtoon', 'layer.velLo': 'Velocity vanaf', 'layer.velHi': 'Velocity tot',
      'layer.start': 'Start', 'layer.end': 'Einde', 'layer.gain': 'Gain', 'layer.loopStart': 'Lus start', 'layer.loopEnd': 'Lus einde', 'layer.xfade': 'Lus crossfade',
      'zone.root': 'Grondtoon', 'zone.keyLo': 'Toets vanaf', 'zone.keyHi': 'Toets tot', 'zone.velLo': 'Velocity vanaf', 'zone.velHi': 'Velocity tot', 'zone.tune': 'Stemming', 'zone.loopStart': 'Lus start', 'zone.loopEnd': 'Lus einde',
    },
  },
  en: {
    bank: 'Bank', bankName: 'Bank name', stopAll: 'Stop all', octDown: 'Octave down', octUp: 'Octave up',
    tabPad: 'Pad', tabLayers: 'Layers', tabZones: 'Zones', tabProgram: 'Program',
    padName: 'Pad name', clearPad: 'Clear pad', mode: 'Type', modeDrum: 'Drum (pad)', modeKey: 'Keygroup (keys)', play: 'Play',
    pVelocity: 'By velocity', pCycle: 'Cycle', pRandom: 'Random', pAll: 'All layers', output: 'Output', outMix: 'Stereo mix', outN: 'Output',
    oneShot: 'One-shot', reverse: 'Reverse', envelope: 'Envelope', envShape: 'Shape', filter: 'Filter', filterType: 'Filter type', off: 'Off',
    lp: 'Low-pass', hp: 'High-pass', bp: 'Band-pass', layer: 'Layer', sample: 'Sample', none: '– none –', loadFile: 'Load file…', clearLayer: 'Clear layer',
    waveform: 'Waveform of the sample (display only)', loop: 'Loop', loopOn: 'Loop on',
    layerHelp: 'A pad has four layers. With By velocity every layer whose velocity range contains the hit sounds; Cycle and Random pick one; All layers plays them all. A loop only works when One-shot is off. The loop crossfade follows in a later version.',
    zoneHelp: 'Zones apply to a pad of the type Keygroup: each sample gets a key range and a root note and sounds transposed. Without zones the pad plays its layers chromatically around the root of each layer.',
    zone: 'Zone', zoneAdd: 'Add zone', zoneDel: 'Remove zone', zoneNotKey: 'Set the pad to Keygroup (Pad tab) to use zones.', zoneCount: '{0} zone(s).', zoneNone: 'No zones yet: the layers sound chromatically around their root.',
    demoKit: 'Restore demo kit', demoKitDone: 'Demo kit restored in bank A.', clearAll: 'Empty program', clearDone: 'All banks are empty.',
    help: 'Pads: click, tap or use the keyboard (Enter or space; 1234, qwer, asdf, zxcv; arrows move). Dragging a file onto a pad loads it there. Drum pads listen to the notes from First pad (bank A pad 1 up to bank D pad 16); a keygroup listens to the key ranges of its zones. Every output (Output 1 to 16) can be mixed separately; the stereo mix has a soft limiter, the separate outputs do not. Bluetooth output is slow: use a cable or an audio interface for low latency.',
    dropHint: 'No sample: drop a file here or choose Load file', keys: 'keys', empty: 'empty', pad: 'Pad', builtin: 'built in', noSample: 'No sample in this layer.',
    mem: 'Sample memory: {0} of {1} MiB PCM.', voices: 'Voices', master: 'Master',
    memFull: 'Sample memory full: 64 MiB PCM16 at most. Remove samples or choose a shorter file.', noDecode: 'Audio decoding is not available in this environment.',
    fileBig: 'File too large (50 MiB at most).', loading: 'Loading: {0}', decodeFail: 'Could not decode {0}. Is it a valid WAV, FLAC, OGG or MP3?', noAudio: '{0} contains no audio.',
    tooLong: 'Sample longer than 120 seconds. Choose a shorter fragment.', loaded: '{0} sample(s) loaded.', dropped: '{0} sample(s) not loaded (invalid or memory full).',
    k: {
      level: 'Master volume', baseNote: 'First pad (MIDI)', padVel: 'Pad velocity', 'pad.tune': 'Pitch', 'pad.fine': 'Fine', 'pad.level': 'Level', 'pad.pan': 'Pan', 'pad.poly': 'Polyphony', 'pad.mute': 'Mute group', 'pad.baseNote': 'Note when tapped',
      'env.attack': 'Attack', 'env.decay': 'Decay', 'env.sustain': 'Sustain', 'env.release': 'Release',
      'filt.cutoff': 'Cutoff', 'filt.res': 'Resonance', 'filt.envAmt': 'Envelope amount', 'filt.velAmt': 'Velocity amount',
      'layer.semi': 'Semitones', 'layer.fine': 'Fine', 'layer.level': 'Level', 'layer.pan': 'Pan', 'layer.offset': 'Offset', 'layer.root': 'Root note', 'layer.velLo': 'Velocity from', 'layer.velHi': 'Velocity to',
      'layer.start': 'Start', 'layer.end': 'End', 'layer.gain': 'Gain', 'layer.loopStart': 'Loop start', 'layer.loopEnd': 'Loop end', 'layer.xfade': 'Loop crossfade',
      'zone.root': 'Root note', 'zone.keyLo': 'Key from', 'zone.keyHi': 'Key to', 'zone.velLo': 'Velocity from', 'zone.velHi': 'Velocity to', 'zone.tune': 'Tuning', 'zone.loopStart': 'Loop start', 'zone.loopEnd': 'Loop end',
    },
  },
};
const CSS = `
:host{display:block;color:var(--fg);font:13px system-ui,sans-serif}
.app{container-type:inline-size;display:flex;flex-direction:column;gap:10px;padding:2px}
.row{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.main{display:grid;grid-template-columns:minmax(0,1fr);gap:12px}
@container (min-width:780px){.main{grid-template-columns:minmax(300px,380px) minmax(0,1fr)}}
.left,.right{min-width:0;display:flex;flex-direction:column;gap:8px}
.pads{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px}
.pad{display:flex;flex-direction:column;justify-content:space-between;align-items:flex-start;min-height:66px;padding:6px 7px;border-radius:8px;border:1px solid var(--line);background:var(--card-2,var(--well));color:var(--fg);font:inherit;text-align:left;cursor:pointer;touch-action:none;user-select:none;-webkit-user-select:none;overflow:hidden}
.pad span{max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.pad .pn{font-weight:600;font-size:12px}.pad .pm{font-size:12px}.pad .po{font-size:10px;color:var(--muted)}
.pad.sel{outline:2px solid var(--sel);outline-offset:-1px}
.pad.empty{opacity:.6}
.pad.hit,.pad.down{background:var(--go);color:var(--fg)}
.tabbtn,.btn{font:inherit;color:var(--field-fg,var(--fg));background:var(--field,var(--well));border:1px solid var(--line);border-radius:6px;padding:6px 10px;cursor:pointer;min-height:32px}
.tabbtn.sel,.btn.sel{background:var(--go);border-color:var(--audio)}
.tabbtn.has{border-bottom:3px solid var(--audio)}
.pad:focus-visible,.tabbtn:focus-visible,.btn:focus-visible,.key:focus-visible,.txt:focus-visible{outline:2px solid var(--sel);outline-offset:1px}
.txt{font:inherit;color:var(--field-fg,var(--fg));background:var(--field,var(--well));border:1px solid var(--line);border-radius:6px;padding:6px 8px;min-width:0;flex:1 1 140px;max-width:100%;box-sizing:border-box}
.muted{color:var(--muted)}
.voices{margin-left:auto}
.panel{display:flex;flex-direction:column;gap:8px}
.panel[hidden],.kbwrap[hidden]{display:none}
.panel h4{margin:6px 0 0;font-size:12px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em}
.panel p{margin:0;line-height:1.45}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:8px}
canvas.wave{display:block;width:100%;height:110px;background:var(--well);border:1px solid var(--line);border-radius:6px}
.keys{display:flex;gap:2px;overflow-x:auto;padding-bottom:4px;touch-action:pan-x}
.key{flex:0 0 28px;height:58px;border-radius:0 0 5px 5px;border:1px solid var(--line);background:var(--field,var(--card-2));color:var(--field-fg,var(--fg));font-size:9px;padding:0;touch-action:none;display:flex;align-items:flex-end;justify-content:center}
.key.black{background:var(--fg);color:var(--bg);height:40px}
.key.down{background:var(--go)}
.key.off{opacity:.3}
[data-pk-role="pad"]:not(.pad){width:auto!important;min-width:104px!important;height:34px!important;aspect-ratio:auto!important;padding:0 12px!important;white-space:nowrap;overflow:visible!important}
.status{min-height:1.3em;color:var(--muted)}
`;
// ---------- constanten en hulpfuncties ----------
const NBANK = 4, NPAD = 16, NLAYER = 4, MAXZONE = 16;
const MAX_PCM = 64 * 1048576;          // totaal PCM16 in de samplestore
const MAX_SEC = 120;                   // langste sample
const MAX_VOICES = 64;                 // stemmen (laagstemmen) tegelijk
const KILL_S = 0.005;                  // korte afbouw bij mutegroep of stelen
const SAMPLE_RE = /^[A-Za-z0-9_-]{1,48}$/;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const num = (v, d, a, b) => (typeof v === 'number' && Number.isFinite(v) ? clamp(v, a, b) : d);
const int = (v, d, a, b) => (typeof v === 'number' && Number.isFinite(v) ? clamp(Math.round(v), a, b) : d);
const isObj = v => !!v && typeof v === 'object' && !Array.isArray(v);
const str = (v, n) => (typeof v === 'string' ? v.slice(0, n) : '');
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const noteName = n => NOTE_NAMES[n % 12] + (Math.floor(n / 12) - 1);
const BANK_LETTER = ['A', 'B', 'C', 'D'];
const padId = (b, p) => BANK_LETTER[b].toLowerCase() + String(p + 1).padStart(2, '0');

// bereiken van de regelaars: [min, max, stap, beginwaarde]; zowel de UI als de normalisatie gebruiken deze tabel
const RG = {
  padLevel: [-60, 12, 0.5, 0], padPan: [-1, 1, 0.01, 0], tune: [-24, 24, 1, 0], fine: [-100, 100, 1, 0],
  poly: [1, 16, 1, 4], mute: [0, 32, 1, 0], output: [0, 16, 1, 0], baseNoteP: [0, 127, 1, 60],
  attack: [0.0005, 5, 0.0005, 0.001], decay: [0.005, 10, 0.005, 0.2], sustain: [0, 1, 0.01, 1], release: [0.005, 10, 0.005, 0.05],
  cutoff: [20, 20000, 1, 8000], res: [0, 1, 0.01, 0.2], envAmt: [-1, 1, 0.01, 0], velAmt: [-1, 1, 0.01, 0],
  semi: [-48, 48, 1, 0], lfine: [-100, 100, 1, 0], llevel: [0, 1, 0.01, 1], lpan: [-1, 1, 0.01, 0],
  offset: [-500, 500, 1, 0], root: [0, 127, 1, 60], vel: [1, 127, 1, 1], start: [0, 0.9999, 0.0001, 0], end: [0.0001, 1, 0.0001, 1],
  gain: [-24, 24, 0.5, 0], loopS: [0, 0.9999, 0.0001, 0], loopE: [0.0001, 1, 0.0001, 1], xfade: [0, 1, 0.01, 0],
  key: [0, 127, 1, 0], ztune: [-24, 24, 0.01, 0], baseNote: [0, 63, 1, 36], level: [0, 1, 0.01, 0.8], padVel: [1, 127, 1, 100],
};

// ---------- ingebouwde demo-samples (gesynthetiseerd, CC0; staan niet in de state) ----------
// Tonale demo's lussen exact een geheel aantal perioden: TONE_N frames per periode, samplefrequentie zo dat noot 60 klopt.
const TONE_N = 128, TONE_ROOT = 60;
const TONE_RATE = Math.round(440 * Math.pow(2, (TONE_ROOT - 69) / 12) * TONE_N);
const rng = seed => { let s = seed >>> 0; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 2147483648 - 1; }; };
const DEMOS = [];
const DEMO_BY_ID = Object.create(null);
function demo(id, nl, en, rate, frames, root, loop, f) {
  const d = { id, name: { nl, en }, rate, frames, root, loop, f };
  DEMOS.push(d); DEMO_BY_ID[id] = d; return d;
}
const secs = s => Math.round(s * 44100);
function drum(id, nl, en, sec, f) {
  demo(id, nl, en, 44100, secs(sec), null, false, () => {
    const n = secs(sec), a = new Float32Array(n), st = { r: rng(id.length * 7919 + id.charCodeAt(5)), ph: 0, p1: 0, p2: 0 };
    for (let i = 0; i < n; i++) { const v = f(i / 44100, st); a[i] = v > 1 ? 1 : v < -1 ? -1 : v; }
    return a;
  });
}
const TAU = Math.PI * 2;
const hp = (st, x) => { const y = x - st.p1; st.p1 = x; return y; };   // eenvoudig hoogdoorlaat (verschil)
drum('demo:kick', 'Kick', 'Kick', 0.55, (t, s) => { s.ph += TAU * (46 + 120 * Math.exp(-t * 30)) / 44100; return Math.sin(s.ph) * Math.exp(-t * 6.5) * 0.9 + (t < 0.004 ? s.r() * 0.25 * (1 - t / 0.004) : 0); });
drum('demo:kick-soft', 'Kick zacht', 'Kick soft', 0.45, (t, s) => { s.ph += TAU * (42 + 70 * Math.exp(-t * 26)) / 44100; return Math.sin(s.ph) * Math.exp(-t * 8) * 0.5; });
drum('demo:kick-hard', 'Kick hard', 'Kick hard', 0.6, (t, s) => { s.ph += TAU * (48 + 150 * Math.exp(-t * 34)) / 44100; return Math.tanh(1.9 * Math.sin(s.ph)) * Math.exp(-t * 6) * 0.95 + (t < 0.006 ? s.r() * 0.45 * (1 - t / 0.006) : 0); });
drum('demo:snare', 'Snare', 'Snare', 0.3, (t, s) => { s.ph += TAU * 190 / 44100; return Math.sin(s.ph) * Math.exp(-t * 20) * 0.45 + hp(s, s.r()) * Math.exp(-t * 15) * 0.55; });
drum('demo:clap', 'Clap', 'Clap', 0.4, (t, s) => { const e = [0, 0.011, 0.022].reduce((q, o) => q + (t >= o ? Math.exp(-(t - o) * 220) : 0), 0) * 0.6 + (t >= 0.033 ? Math.exp(-(t - 0.033) * 28) : 0); return hp(s, s.r()) * e * 0.7; });
drum('demo:hat-closed', 'Hihat dicht', 'Hat closed', 0.09, (t, s) => hp(s, s.r()) * Math.exp(-t * 70) * 0.6);
drum('demo:hat-open', 'Hihat open', 'Hat open', 0.6, (t, s) => hp(s, s.r()) * Math.exp(-t * 8) * 0.5);
drum('demo:tom-lo', 'Tom laag', 'Tom low', 0.5, (t, s) => { s.ph += TAU * (80 + 60 * Math.exp(-t * 18)) / 44100; return Math.sin(s.ph) * Math.exp(-t * 7) * 0.8; });
drum('demo:tom-mid', 'Tom midden', 'Tom mid', 0.45, (t, s) => { s.ph += TAU * (120 + 80 * Math.exp(-t * 18)) / 44100; return Math.sin(s.ph) * Math.exp(-t * 8) * 0.8; });
drum('demo:tom-hi', 'Tom hoog', 'Tom high', 0.4, (t, s) => { s.ph += TAU * (180 + 100 * Math.exp(-t * 18)) / 44100; return Math.sin(s.ph) * Math.exp(-t * 9) * 0.8; });
drum('demo:rim', 'Rim', 'Rim', 0.07, (t, s) => (Math.sin(TAU * 1700 * t) * 0.5 + hp(s, s.r()) * 0.4) * Math.exp(-t * 90));
drum('demo:cowbell', 'Koebel', 'Cowbell', 0.4, (t) => ((Math.sin(TAU * 540 * t) > 0 ? 1 : -1) + (Math.sin(TAU * 800 * t) > 0 ? 1 : -1)) * 0.2 * Math.exp(-t * 11));
drum('demo:shaker', 'Shaker', 'Shaker', 0.16, (t, s) => hp(s, s.r()) * (t < 0.02 ? t / 0.02 : Math.exp(-(t - 0.02) * 35)) * 0.5);
drum('demo:crash', 'Crash', 'Crash', 1.6, (t, s) => hp(s, s.r()) * Math.exp(-t * 2.6) * 0.5);
drum('demo:perc', 'Conga', 'Conga', 0.35, (t, s) => { s.ph += TAU * (200 + 60 * Math.exp(-t * 35)) / 44100; return Math.sin(s.ph) * Math.exp(-t * 11) * 0.8; });
drum('demo:sub', 'Sub', 'Sub', 1.0, (t, s) => { s.ph += TAU * 42 / 44100; return Math.sin(s.ph) * Math.exp(-t * 2.5) * 0.9; });
function tone(id, nl, en, periods, loop, f) {
  const frames = TONE_N * periods;
  demo(id, nl, en, TONE_RATE, frames, TONE_ROOT, loop, () => {
    const a = new Float32Array(frames);
    for (let i = 0; i < frames; i++) a[i] = f(i % TONE_N, i / TONE_RATE);
    return a;
  });
}
const harm = (ph, k, odd) => { let s = 0; for (let h = 1; h <= k; h++) { if (odd && h % 2 === 0) continue; s += Math.sin(TAU * h * ph / TONE_N) / h; } return s; };
tone('demo:saw', 'Zaagtand', 'Saw', 64, true, i => harm(i, 60, false) * 0.5);
tone('demo:sine', 'Sinus', 'Sine', 64, true, i => Math.sin(TAU * i / TONE_N) * 0.8);
tone('demo:square', 'Blok', 'Square', 64, true, i => harm(i, 61, true) * 0.55);
tone('demo:pluck', 'Pluk', 'Pluck', 235, false, (i, t) => { let s = 0; for (let h = 1; h <= 12; h++) s += Math.sin(TAU * h * i / TONE_N) / h * Math.exp(-t * (2.5 + h * 1.2)); return s * 0.5; });
const DEMO_COUNT = DEMOS.length;

// ---------- hash (53 bit, snel, voor deduplicatie van samples) ----------
function hash53(s) {
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < s.length; i++) { const c = s.charCodeAt(i); h1 = Math.imul(h1 ^ c, 2654435761); h2 = Math.imul(h2 ^ c, 1597334677); }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}
const b64bytes = s => (s.length / 4) * 3 - (s.endsWith('==') ? 2 : s.endsWith('=') ? 1 : 0);
function b64decode(s) {
  const bin = atob(s), n = bin.length, u = new Uint8Array(n);
  for (let i = 0; i < n; i++) u[i] = bin.charCodeAt(i);
  return u;
}
function b64encode(u) {
  let out = '';
  for (let i = 0; i < u.length; i += 0x8000) out += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000));
  return btoa(out);
}

// ---------- datamodel: standaard, normalisatie, serialisatie ----------
const endOf = (v, st) => num(v, 1, Math.min(st + 0.0001, 1), 1);
const defLoop = () => ({ on: false, start: 0, end: 1, xfade: 0 });
const defLayer = () => ({ sampleId: '', semi: 0, fine: 0, level: 1, pan: 0, offset: 0, root: null, velLo: 1, velHi: 127, start: 0, end: 1, loop: defLoop(), gain: 0 });
const defZone = () => ({ sampleId: '', root: 60, keyLo: 0, keyHi: 127, velLo: 1, velHi: 127, tune: 0, loop: defLoop() });
const defPad = () => ({
  name: '', mode: 'drum', play: 'velocity', polyphony: 4, muteGroup: 0, output: 0, level: 0, pan: 0, tune: 0, fine: 0,
  env: { shape: 'adsr', attack: 0.001, decay: 0.2, sustain: 1, release: 0.05 },
  filter: { type: 'off', cutoff: 8000, res: 0.2, envAmt: 0, velAmt: 0 },
  oneShot: true, reverse: false, sends: [0, 0], baseNote: 60,
  layers: Array.from({ length: NLAYER }, defLayer), zones: [],
});
const defBank = i => ({ name: 'Bank ' + BANK_LETTER[i], pads: Array.from({ length: NPAD }, defPad) });

function nLoop(s) {
  s = isObj(s) ? s : {}; const st = num(s.start, 0, 0, 0.9999);
  return { on: s.on === true, start: st, end: endOf(s.end, st), xfade: num(s.xfade, 0, 0, 1) };
}
const sidOf = (v, has) => (typeof v === 'string' && has(v) ? v : '');
function nLayer(s, has) {
  s = isObj(s) ? s : {}; const st = num(s.start, 0, 0, 0.9999), vlo = int(s.velLo, 1, 1, 127);
  return {
    sampleId: sidOf(s.sampleId, has), semi: int(s.semi, 0, -48, 48), fine: num(s.fine, 0, -100, 100), level: num(s.level, 1, 0, 1),
    pan: num(s.pan, 0, -1, 1), offset: num(s.offset, 0, -500, 500), root: typeof s.root === 'number' && Number.isFinite(s.root) ? int(s.root, 60, 0, 127) : null,
    velLo: vlo, velHi: int(s.velHi, 127, vlo, 127), start: st, end: endOf(s.end, st), loop: nLoop(s.loop), gain: num(s.gain, 0, -24, 24),
  };
}
function nZone(s, has) {
  const vlo = int(s.velLo, 1, 1, 127), klo = int(s.keyLo, 0, 0, 127);
  return { sampleId: sidOf(s.sampleId, has), root: int(s.root, 60, 0, 127), keyLo: klo, keyHi: int(s.keyHi, 127, klo, 127), velLo: vlo, velHi: int(s.velHi, 127, vlo, 127), tune: num(s.tune, 0, -24, 24), loop: nLoop(s.loop) };
}
function nPad(s, has) {
  if (!isObj(s)) return defPad();
  const mode = s.mode === 'key' ? 'key' : 'drum', e = isObj(s.env) ? s.env : {}, f = isObj(s.filter) ? s.filter : {};
  const L = Array.isArray(s.layers) ? s.layers : [], Z = Array.isArray(s.zones) ? s.zones : [], sd = Array.isArray(s.sends) ? s.sends : [];
  const zones = []; for (const z of Z) { if (zones.length >= MAXZONE) break; if (isObj(z)) zones.push(nZone(z, has)); }
  return {
    name: str(s.name, 40), mode, play: ['velocity', 'cycle', 'random', 'all'].includes(s.play) ? s.play : 'velocity',
    polyphony: int(s.polyphony, 4, 1, 16), muteGroup: int(s.muteGroup, 0, 0, 32), output: int(s.output, 0, 0, 16),
    level: num(s.level, 0, -60, 12), pan: num(s.pan, 0, -1, 1), tune: num(s.tune, 0, -24, 24), fine: num(s.fine, 0, -100, 100),
    env: { shape: e.shape === 'ad' ? 'ad' : 'adsr', attack: num(e.attack, 0.001, RG.attack[0], 5), decay: num(e.decay, 0.2, RG.decay[0], 10), sustain: num(e.sustain, 1, 0, 1), release: num(e.release, 0.05, RG.release[0], 10) },
    filter: { type: ['lp', 'hp', 'bp'].includes(f.type) ? f.type : 'off', cutoff: num(f.cutoff, 8000, 20, 20000), res: num(f.res, 0.2, 0, 1), envAmt: num(f.envAmt, 0, -1, 1), velAmt: num(f.velAmt, 0, -1, 1) },
    oneShot: typeof s.oneShot === 'boolean' ? s.oneShot : mode === 'drum', reverse: s.reverse === true, sends: [num(sd[0], 0, 0, 1), num(sd[1], 0, 0, 1)],
    baseNote: int(s.baseNote, 60, 0, 127), layers: Array.from({ length: NLAYER }, (_, i) => nLayer(L[i], has)), zones,
  };
}
function nBank(s, i, has) {
  s = isObj(s) ? s : {}; const P = Array.isArray(s.pads) ? s.pads : [];
  return { name: str(s.name, 40) || defBank(i).name, pads: Array.from({ length: NPAD }, (_, k) => nPad(P[k], has)) };
}
// serialisatie: altijd nieuwe objecten (nooit een verwijzing naar de levende state), vaste sleutelvolgorde
const serLoop = l => ({ on: l.on, start: l.start, end: l.end, xfade: l.xfade });
const serLayer = l => ({ sampleId: l.sampleId, semi: l.semi, fine: l.fine, level: l.level, pan: l.pan, offset: l.offset, root: l.root, velLo: l.velLo, velHi: l.velHi, start: l.start, end: l.end, loop: serLoop(l.loop), gain: l.gain });
const serZone = z => ({ sampleId: z.sampleId, root: z.root, keyLo: z.keyLo, keyHi: z.keyHi, velLo: z.velLo, velHi: z.velHi, tune: z.tune, loop: serLoop(z.loop) });
const BLANK_LAYER = JSON.stringify(serLayer(defLayer()));
const serPadFull = p => ({
  name: p.name, mode: p.mode, play: p.play, polyphony: p.polyphony, muteGroup: p.muteGroup, output: p.output, level: p.level, pan: p.pan, tune: p.tune, fine: p.fine,
  env: { shape: p.env.shape, attack: p.env.attack, decay: p.env.decay, sustain: p.env.sustain, release: p.env.release },
  filter: { type: p.filter.type, cutoff: p.filter.cutoff, res: p.filter.res, envAmt: p.filter.envAmt, velAmt: p.filter.velAmt },
  oneShot: p.oneShot, reverse: p.reverse, sends: [p.sends[0], p.sends[1]], baseNote: p.baseNote,
  layers: p.layers.map(l => { const o = serLayer(l); return JSON.stringify(o) === BLANK_LAYER ? null : o; }), zones: p.zones.map(serZone),
});
const BLANK_PAD = JSON.stringify(serPadFull(defPad()));
const serPad = p => { const o = serPadFull(p); return JSON.stringify(o) === BLANK_PAD ? null : o; };   // een leeg pad is null

const LICENSE_KEYS = ['source', 'license', 'author', 'attribution'];
function nSample(id, r) {
  if (!SAMPLE_RE.test(id) || !isObj(r) || typeof r.data !== 'string') return null;
  const data = r.data, channels = r.channels === 2 ? 2 : 1, rate = int(r.rate, 44100, 3000, 192000);
  if (data.length === 0 || data.length % 4 !== 0 || data.length > Math.ceil(MAX_PCM * 4 / 3) + 4 || !/^[A-Za-z0-9+/]*={0,2}$/.test(data)) return null;
  const bytes = b64bytes(data);
  if (bytes % (2 * channels) !== 0 || bytes <= 0) return null;
  const frames = bytes / (2 * channels);
  if (frames / rate > MAX_SEC) return null;
  let loop = null;
  if (isObj(r.loop)) { const st = num(r.loop.start, 0, 0, 0.9999); loop = { start: st, end: endOf(r.loop.end, st) }; }
  const sl = []; if (Array.isArray(r.slices)) for (const v of r.slices) { if (sl.length >= 128) break; if (typeof v === 'number' && Number.isFinite(v)) sl.push(int(v, 0, 0, frames - 1)); }
  sl.sort((a, b) => a - b); const slices = sl.filter((v, i) => i === 0 || v !== sl[i - 1]);
  const lic = isObj(r.license) ? r.license : {}, license = {}; for (const k of LICENSE_KEYS) license[k] = str(lic[k], 200);
  return { name: str(r.name, 80), rate, channels, root: typeof r.root === 'number' && Number.isFinite(r.root) ? int(r.root, 60, 0, 127) : null, loop, slices, license, data, bytes, frames };
}
const serSample = r => ({
  name: r.name, rate: r.rate, channels: r.channels, root: r.root, loop: r.loop ? { start: r.loop.start, end: r.loop.end } : null, slices: r.slices.slice(),
  license: { source: r.license.source, license: r.license.license, author: r.license.author, attribution: r.license.attribution }, data: r.data,
});

// het standaardprogramma: bank A met de ingebouwde demo-kit (klinkt meteen)
function defaultBanks() {
  const banks = Array.from({ length: NBANK }, (_, i) => defBank(i));
  const kit = [
    ['Kick', 'demo:kick'], ['Snare', 'demo:snare'], ['Clap', 'demo:clap'], ['Rim', 'demo:rim'],
    ['Hat', 'demo:hat-closed', 1, 1], ['Open hat', 'demo:hat-open', 1, 1], ['Shaker', 'demo:shaker'], ['Crash', 'demo:crash'],
    ['Tom low', 'demo:tom-lo'], ['Tom mid', 'demo:tom-mid'], ['Tom high', 'demo:tom-hi'], ['Conga', 'demo:perc'],
    ['Cowbell', 'demo:cowbell'], ['Sub', 'demo:sub'], ['Kick soft', 'demo:kick-soft'], ['Kick hard', 'demo:kick-hard'],
  ];
  kit.forEach(([name, sid, mg, poly], i) => {
    const p = banks[0].pads[i]; p.name = name; p.layers[0].sampleId = sid; if (mg) p.muteGroup = mg; if (poly) p.polyphony = poly;
  });
  const k = banks[0].pads[0];   // pad 1: drie velocity-lagen
  k.layers[0].sampleId = 'demo:kick-soft'; k.layers[0].velLo = 1; k.layers[0].velHi = 50;
  k.layers[1].sampleId = 'demo:kick'; k.layers[1].velLo = 51; k.layers[1].velHi = 100;
  k.layers[2].sampleId = 'demo:kick-hard'; k.layers[2].velLo = 101; k.layers[2].velHi = 127;
  return banks;
}

// ---------- regelaars van het paneel: [id, bereik van de gekozen pad/laag/zone, pad naar de waarde, sleutel in RG, opmaak, schaal, groep] ----------
const fSt = v => (v > 0 ? '+' : '') + Math.round(v) + ' st';
const fSt2 = v => (v > 0 ? '+' : '') + v.toFixed(2) + ' st';
const fCt = v => (v > 0 ? '+' : '') + Math.round(v) + ' ct';
const fDb = v => (v > 0 ? '+' : '') + v.toFixed(1) + ' dB';
const fPct = v => Math.round(v * 100) + '%';
const fSPct = v => (v > 0 ? '+' : '') + Math.round(v * 100) + '%';
const fPan = v => (Math.abs(v) < 0.005 ? 'C' : (v < 0 ? 'L' : 'R') + Math.round(Math.abs(v) * 100));
const fMs = v => (Math.abs(v) < 10 && v !== Math.round(v) ? v.toFixed(1) : String(Math.round(v))) + ' ms';
const fSec = v => (v < 1 ? Math.round(v * 1000) + ' ms' : v.toFixed(2) + ' s');
const fHz = v => (v >= 1000 ? (v / 1000).toFixed(v >= 10000 ? 1 : 2) + ' kHz' : Math.round(v) + ' Hz');
const fInt = v => String(Math.round(v));
const fMute = v => (Math.round(v) ? String(Math.round(v)) : '–');
const fNote = v => noteName(Math.round(v)) + ' (' + Math.round(v) + ')';
const fFrac = v => (v * 100).toFixed(2) + '%';
const KNOBS = [
  ['level', 'prog', ['level'], 'level', fPct, 'lin', 'master'],
  ['baseNote', 'prog', ['baseNote'], 'baseNote', fNote, 'lin', 'master'],
  ['padVel', 'prog', ['padVel'], 'padVel', fInt, 'lin', 'master'],
  ['pad.tune', 'pad', ['tune'], 'tune', fSt, 'lin', 'pad'],
  ['pad.fine', 'pad', ['fine'], 'fine', fCt, 'lin', 'pad'],
  ['pad.level', 'pad', ['level'], 'padLevel', fDb, 'lin', 'pad'],
  ['pad.pan', 'pad', ['pan'], 'padPan', fPan, 'lin', 'pad'],
  ['pad.poly', 'pad', ['polyphony'], 'poly', fInt, 'lin', 'pad'],
  ['pad.mute', 'pad', ['muteGroup'], 'mute', fMute, 'lin', 'pad'],
  ['pad.baseNote', 'pad', ['baseNote'], 'baseNoteP', fNote, 'lin', 'pad'],
  ['env.attack', 'pad', ['env', 'attack'], 'attack', fSec, 'log', 'env'],
  ['env.decay', 'pad', ['env', 'decay'], 'decay', fSec, 'log', 'env'],
  ['env.sustain', 'pad', ['env', 'sustain'], 'sustain', fPct, 'lin', 'env'],
  ['env.release', 'pad', ['env', 'release'], 'release', fSec, 'log', 'env'],
  ['filt.cutoff', 'pad', ['filter', 'cutoff'], 'cutoff', fHz, 'log', 'filter'],
  ['filt.res', 'pad', ['filter', 'res'], 'res', fPct, 'lin', 'filter'],
  ['filt.envAmt', 'pad', ['filter', 'envAmt'], 'envAmt', fSPct, 'lin', 'filter'],
  ['filt.velAmt', 'pad', ['filter', 'velAmt'], 'velAmt', fSPct, 'lin', 'filter'],
  ['layer.semi', 'layer', ['semi'], 'semi', fSt, 'lin', 'layer'],
  ['layer.fine', 'layer', ['fine'], 'lfine', fCt, 'lin', 'layer'],
  ['layer.level', 'layer', ['level'], 'llevel', fPct, 'lin', 'layer'],
  ['layer.pan', 'layer', ['pan'], 'lpan', fPan, 'lin', 'layer'],
  ['layer.offset', 'layer', ['offset'], 'offset', fMs, 'lin', 'layer'],
  ['layer.root', 'layer', ['root'], 'root', fNote, 'lin', 'layer'],
  ['layer.velLo', 'layer', ['velLo'], 'vel', fInt, 'lin', 'layer'],
  ['layer.velHi', 'layer', ['velHi'], 'vel', fInt, 'lin', 'layer'],
  ['layer.start', 'layer', ['start'], 'start', fFrac, 'lin', 'layer'],
  ['layer.end', 'layer', ['end'], 'end', fFrac, 'lin', 'layer'],
  ['layer.gain', 'layer', ['gain'], 'gain', fDb, 'lin', 'layer'],
  ['layer.loopStart', 'layer', ['loop', 'start'], 'loopS', fFrac, 'lin', 'loop'],
  ['layer.loopEnd', 'layer', ['loop', 'end'], 'loopE', fFrac, 'lin', 'loop'],
  ['layer.xfade', 'layer', ['loop', 'xfade'], 'xfade', fPct, 'lin', 'loop'],
  ['zone.root', 'zone', ['root'], 'root', fNote, 'lin', 'zone'],
  ['zone.keyLo', 'zone', ['keyLo'], 'key', fNote, 'lin', 'zone'],
  ['zone.keyHi', 'zone', ['keyHi'], 'key', fNote, 'lin', 'zone'],
  ['zone.velLo', 'zone', ['velLo'], 'vel', fInt, 'lin', 'zone'],
  ['zone.velHi', 'zone', ['velHi'], 'vel', fInt, 'lin', 'zone'],
  ['zone.tune', 'zone', ['tune'], 'ztune', fSt2, 'lin', 'zone'],
  ['zone.loopStart', 'zone', ['loop', 'start'], 'loopS', fFrac, 'lin', 'loop'],
  ['zone.loopEnd', 'zone', ['loop', 'end'], 'loopE', fFrac, 'lin', 'loop'],
];
// continue regelaars die bewust niet in params() staan: de regelaars van het paneel werken op de gekozen pad, laag of zone
const UI_IDS = KNOBS.map(k => k[0]).filter(id => id !== 'level');
const KEYBOARD_ROWS = ['1234', 'qwer', 'asdf', 'zxcv'];
const PIANO_KEYS = 'awsedftgyhujkolp';   // a = C, w = C#, s = D, ...

// terugval voor een host zonder host.frame (contract §12b)
const tekenLus = (host, inst, cb, fps) => {
  if (host && typeof host.frame === 'function') return host.frame(inst, cb, fps);
  let raf = 0, last = 0, stop = false;
  const f = t => { if (stop) return; raf = requestAnimationFrame(f); if (document.hidden || t - last < 1000 / fps - 2) return; last = t; cb(t); };
  raf = requestAnimationFrame(f); return () => { stop = true; cancelAnimationFrame(raf); };
};
// zachte begrenzer voor de stereomix: tot 0,8 ongewijzigd, daarboven zacht naar 1,0 (geen vertraging)
const CEILING = (() => { const n = 2049, c = new Float32Array(n); for (let i = 0; i < n; i++) { const x = (i / (n - 1)) * 2 - 1, a = Math.abs(x); c[i] = a < 0.8 ? x : Math.sign(x) * (0.8 + 0.2 * Math.tanh((a - 0.8) / 0.2)); } return c; })();
const AUDIO_OUTS = Array.from({ length: 16 }, (_, i) => ({ id: 'out' + (i + 1), name: 'Uitgang ' + (i + 1) }));
const EN_PORTS = { mix: 'Stereo mix', notes: 'Notes / pad triggers' }; AUDIO_OUTS.forEach((o, i) => { EN_PORTS[o.id] = 'Output ' + (i + 1); });

export default {
  id: 'nl.patchkamer.padsampler',
  name: 'Pad Sampler',
  version: '1.0.0',
  kind: 'instrument',
  category: 'synth',
  ui: { width: 700, minWidth: 340 },
  modExclude: UI_IDS,
  ports: {
    audioIn: [],
    audioOut: [{ id: 'mix', name: 'Stereomix' }, ...AUDIO_OUTS],
    eventIn: [{ id: 'notes', name: 'Noten / pad-trigs' }],
    eventOut: [],
    modIn: [{ id: 'mod', name: 'Mod' }],
    modOut: [],
  },
  i18n: { en: { ports: EN_PORTS } },

  create(ctx, host) {
    const lang = host.lang === 'nl' ? 'nl' : 'en', T = TXT[lang];
    let dead = false, token = 0, root = null, ui = null, warmTimer = 0, stopFrame = null, notesSig = '', selfRef = null;
    const prog = { bank: 0, pad: 0, layer: 0, baseNote: 36, level: 0.8, padVel: 100, banks: defaultBanks() };
    const store = new Map();                 // sampleId -> record (PCM16 base64)
    const bufs = new Map();                  // sampleId -> { fwd, rev, peaks }
    const nodes = new Set();                 // alle AudioNodes die dit apparaat verbindt (voor destroy)
    const own = n => { nodes.add(n); return n; };
    let mod = Object.create(null);

    // ---------- uitgangen ----------
    const master = own(ctx.createGain()), shaper = own(ctx.createWaveShaper()), mixOut = own(ctx.createGain());
    shaper.curve = CEILING; try { shaper.oversample = host.audio && host.audio.oversample === '4x' ? '4x' : host.audio && host.audio.oversample === '2x' ? '2x' : 'none'; } catch (e) { /* oud */ }
    master.connect(shaper); shaper.connect(mixOut); master.gain.value = prog.level;
    const outputs = { mix: mixOut }, outNodes = [];
    for (let i = 0; i < 16; i++) { const g = own(ctx.createGain()); outputs['out' + (i + 1)] = g; outNodes.push(g); }

    // ---------- pad-bussen (lui gemaakt) ----------
    const prt = new Array(NBANK * NPAD).fill(null), rr = new Int32Array(NBANK * NPAD), lastPick = new Int8Array(NBANK * NPAD).fill(-1);
    const hitAt = new Float64Array(NBANK * NPAD);
    const padOf = i => prog.banks[i >> 4].pads[i & 15];
    const mkey = (i, k) => padId(i >> 4, i & 15) + '.' + k;
    const effTune = i => clamp(padOf(i).tune + (mod[mkey(i, 'tune')] || 0) * 48, -24, 24);
    const effCut = i => clamp(padOf(i).filter.cutoff * Math.pow(1000, mod[mkey(i, 'cutoff')] || 0), 20, Math.min(20000, ctx.sampleRate * 0.45));
    const effLevel = i => Math.pow(10, clamp(padOf(i).level + (mod[mkey(i, 'level')] || 0) * 72, -60, 12) / 20);
    function route(i) {
      const r = prt[i]; if (!r) return;
      const o = padOf(i).output, dest = o > 0 ? outNodes[o - 1] : master;
      if (r.dest !== dest) { if (r.dest) { try { r.pan.disconnect(r.dest); } catch (e) { /* al los */ } } r.pan.connect(dest); r.dest = dest; }
    }
    function padRt(i) {
      let r = prt[i];
      if (!r) {
        r = prt[i] = { gain: own(ctx.createGain()), pan: own(ctx.createStereoPanner()), dest: null };
        r.gain.gain.value = effLevel(i); r.pan.pan.value = padOf(i).pan; r.gain.connect(r.pan); route(i);
      }
      return r;
    }
    function applyMaster() { master.gain.setTargetAtTime(clamp(prog.level + (mod.level || 0), 0, 1), ctx.currentTime, 0.01); }

    // ---------- samples: buffers, peaks ----------
    function sampleInfo(id) {
      if (typeof id !== 'string' || !id) return null;
      const d = DEMO_BY_ID[id];
      if (d) return { id, name: d.name[lang] || d.name.en, rate: d.rate, channels: 1, frames: d.frames, root: d.root, loop: d.loop ? { start: 0, end: 1 } : null, demo: true, bytes: 0 };
      const r = store.get(id); return r ? { id, name: r.name, rate: r.rate, channels: r.channels, frames: r.frames, root: r.root, loop: r.loop, demo: false, bytes: r.bytes, license: r.license } : null;
    }
    function build(id) {
      try {
        const d = DEMO_BY_ID[id];
        if (d) { const b = ctx.createBuffer(1, d.frames, d.rate), a = b.getChannelData(0), src = d.f(), n = Math.min(a.length, src.length); for (let i = 0; i < n; i++) a[i] = src[i]; return b; }
        const r = store.get(id); if (!r) return null;
        const u = b64decode(r.data), dv = new DataView(u.buffer, u.byteOffset, u.byteLength), b = ctx.createBuffer(r.channels, r.frames, r.rate);
        for (let ch = 0; ch < r.channels; ch++) { const a = b.getChannelData(ch), n = Math.min(a.length, r.frames); for (let i = 0; i < n; i++) a[i] = dv.getInt16((i * r.channels + ch) * 2, true) / 32768; }
        return b;
      } catch (e) { return null; }
    }
    function reversed(b) {
      const r = ctx.createBuffer(b.numberOfChannels, b.length, b.sampleRate);
      for (let ch = 0; ch < b.numberOfChannels; ch++) { const s = b.getChannelData(ch), a = r.getChannelData(ch), n = Math.min(a.length, s.length); for (let i = 0; i < n; i++) a[i] = s[n - 1 - i]; }
      return r;
    }
    function bufferFor(id, rev) {
      let c = bufs.get(id); if (!c) { c = { fwd: null, rev: null, peaks: null }; bufs.set(id, c); }
      if (!c.fwd) c.fwd = build(id);
      if (!c.fwd) return null;
      if (!rev) return c.fwd;
      if (!c.rev) c.rev = reversed(c.fwd);
      return c.rev;
    }
    function peaksOf(id, cols) {
      const b = bufferFor(id, false); if (!b) return null;
      const c = bufs.get(id); if (c.peaks && c.peaks.length === cols * 2) return c.peaks;
      const a = b.getChannelData(0), n = Math.min(a.length, b.length), pk = new Float32Array(cols * 2);
      for (let k = 0; k < cols; k++) {
        const s = Math.floor(k * n / cols), e = Math.max(s + 1, Math.floor((k + 1) * n / cols)), step = Math.max(1, Math.floor((e - s) / 48));
        let lo = 0, hi = 0; for (let i = s; i < e && i < n; i += step) { const v = a[i]; if (v < lo) lo = v; if (v > hi) hi = v; }
        pk[k * 2] = lo; pk[k * 2 + 1] = hi;
      }
      c.peaks = pk; return pk;
    }
    const hasSample = id => !!DEMO_BY_ID[id] || store.has(id);
    const storeBytes = () => { let t = 0; for (const r of store.values()) t += r.bytes; return t; };
    function gcStore() {
      const used = new Set();
      for (const bk of prog.banks) for (const p of bk.pads) { for (const l of p.layers) if (l.sampleId) used.add(l.sampleId); for (const z of p.zones) if (z.sampleId) used.add(z.sampleId); }
      for (const id of [...store.keys()]) if (!used.has(id)) { store.delete(id); bufs.delete(id); }
      for (const id of [...bufs.keys()]) if (!DEMO_BY_ID[id] && !store.has(id)) bufs.delete(id);
    }
    function warm() {
      if (warmTimer) { clearTimeout(warmTimer); warmTimer = 0; }
      const ids = []; const seen = new Set();
      for (const bk of prog.banks) for (const p of bk.pads) for (const l of p.layers) if (l.sampleId && !seen.has(l.sampleId)) { seen.add(l.sampleId); ids.push(l.sampleId); }
      const my = token; let k = 0;
      const step = () => { warmTimer = 0; if (dead || my !== token || k >= ids.length) return; bufferFor(ids[k++], false); warmTimer = setTimeout(step, 0); };
      if (ids.length) warmTimer = setTimeout(step, 0);
    }

    // ---------- stemmen ----------
    const trigs = new Set(); let voiceCount = 0, trigSeq = 0;
    function stopSrc(v, at) { if (v.stopAt === undefined || at < v.stopAt) { try { v.source.stop(at); v.stopAt = at; } catch (e) { /* al gestopt */ } } }
    function endVoice(trg, v) {
      if (v.ended) return; v.ended = true; voiceCount--; trg.alive--;
      v.source.onended = null;
      for (const n of [v.source, v.lg, v.pn, v.bq, v.eg]) if (n) { try { n.disconnect(); } catch (e) { /* los */ } nodes.delete(n); }
      if (trg.alive <= 0) { for (const n of [trg.rel, trg.kill]) { try { n.disconnect(); } catch (e) { /* los */ } nodes.delete(n); } trigs.delete(trg); }
    }
    function killTrig(trg, t) {
      if (trg.killed) return; trg.killed = true;
      trg.kill.gain.setValueAtTime(1, t); trg.kill.gain.linearRampToValueAtTime(0, t + KILL_S);
      for (const v of trg.voices) stopSrc(v, t + KILL_S + 0.02);
    }
    function releaseTrig(trg, t) {
      if (trg.released || trg.killed || trg.oneShot) return; trg.released = true;
      trg.rel.gain.setValueAtTime(1, t); trg.rel.gain.linearRampToValueAtTime(0, t + trg.relTime);
      for (const v of trg.voices) stopSrc(v, t + trg.relTime + 0.03);
    }
    function panicAt(t) { for (const x of [...trigs]) killTrig(x, t); }
    function noteOffAt(n, t) { for (const x of trigs) if (x.note === n && x.held && !x.released && x.t0 <= t + 1e-6) releaseTrig(x, t); }

    function layerSrc(l, cents) { return { sid: l.sampleId, cents, level: l.level, pan: l.pan, offsetMs: l.offset, start: l.start, end: l.end, loop: l.loop, gain: l.gain }; }
    function pickSources(pad, i, v127, note) {
      const c = [], all = pad.play === 'all';
      if (pad.mode === 'drum') {
        for (const l of pad.layers) if (l.sampleId && (all || (v127 >= l.velLo && v127 <= l.velHi))) c.push(layerSrc(l, l.semi * 100 + l.fine));
      } else {
        const n = note == null ? pad.baseNote : note;
        if (pad.zones.length) {
          for (const z of pad.zones) if (z.sampleId && n >= z.keyLo && n <= z.keyHi && (all || (v127 >= z.velLo && v127 <= z.velHi)))
            c.push({ sid: z.sampleId, cents: (n - z.root) * 100 + z.tune * 100, level: 1, pan: 0, offsetMs: 0, start: 0, end: 1, loop: z.loop, gain: 0 });
        } else {
          for (const l of pad.layers) if (l.sampleId && (all || (v127 >= l.velLo && v127 <= l.velHi))) c.push(layerSrc(l, (n - (l.root == null ? 60 : l.root)) * 100 + l.semi * 100 + l.fine));
        }
      }
      if (c.length < 2 || pad.play === 'velocity' || pad.play === 'all') return c;
      if (pad.play === 'cycle') return [c[rr[i]++ % c.length]];
      let k = Math.floor(Math.random() * c.length);
      if (k === lastPick[i]) k = (k + 1 + Math.floor(Math.random() * (c.length - 1))) % c.length;
      lastPick[i] = k; return [c[k]];
    }

    function voice(trg, pad, i, src, t, v01) {
      const buf = bufferFor(src.sid, pad.reverse); if (!buf) return null;
      const D = buf.duration || (buf.length / buf.sampleRate), e = pad.env, f = pad.filter;
      let s0 = src.start, s1 = src.end, l0 = src.loop.start, l1 = src.loop.end;
      if (pad.reverse) { const a = s0, b = l0; s0 = 1 - s1; s1 = 1 - a; l0 = 1 - l1; l1 = 1 - b; }
      let startSec = s0 * D + Math.max(0, src.offsetMs) / 1000;
      const tStart = t + Math.max(0, -src.offsetMs) / 1000, endSec = s1 * D;
      const looped = src.loop.on && !trg.oneShot && (l1 - l0) * D >= 0.002;
      const base = src.cents + pad.fine, cents = base + effTune(i) * 100, rate = Math.pow(2, cents / 1200);
      if (looped) { if (startSec >= l1 * D) startSec = l0 * D; } else if (endSec - startSec < 0.0003) return null;
      const source = own(ctx.createBufferSource()); source.buffer = buf;
      try { source.detune.value = cents; } catch (err) { source.playbackRate.value = rate; }
      const lg = own(ctx.createGain()); lg.gain.value = v01 * src.level * Math.pow(10, src.gain / 20);
      const v = { source, lg, pn: null, bq: null, eg: null, ended: false, base, stopAt: undefined };
      let tail = lg; source.connect(lg);
      if (Math.abs(src.pan) > 0.001) { v.pn = own(ctx.createStereoPanner()); v.pn.pan.value = src.pan; tail.connect(v.pn); tail = v.pn; }
      const A = Math.max(e.attack, 0.0005), Dc = Math.max(e.decay, 0.005);
      if (f.type !== 'off') {
        const bq = v.bq = own(ctx.createBiquadFilter());
        bq.type = f.type === 'lp' ? 'lowpass' : f.type === 'hp' ? 'highpass' : 'bandpass';
        bq.frequency.value = effCut(i); bq.Q.value = f.type === 'bp' ? 0.5 + f.res * 12 : f.res * 20;
        const vd = f.velAmt * (v01 - 1) * 4800;
        bq.detune.setValueAtTime(vd, tStart);
        if (f.envAmt !== 0) { const sus = e.shape === 'ad' ? 0 : e.sustain; bq.detune.linearRampToValueAtTime(vd + f.envAmt * 6000, tStart + A); bq.detune.linearRampToValueAtTime(vd + f.envAmt * 6000 * sus, tStart + A + Dc); }
        tail.connect(bq); tail = bq;
      }
      const eg = v.eg = own(ctx.createGain());
      eg.gain.setValueAtTime(0, tStart); eg.gain.linearRampToValueAtTime(1, tStart + A);
      let stopAt = Infinity;
      if (e.shape === 'ad') { eg.gain.exponentialRampToValueAtTime(0.0001, tStart + A + Dc); stopAt = tStart + A + Dc + 0.02; }
      else if (e.sustain < 0.999) eg.gain.exponentialRampToValueAtTime(Math.max(e.sustain, 0.0001), tStart + A + Dc);
      tail.connect(eg); eg.connect(trg.rel);
      if (looped) { source.loop = true; source.loopStart = l0 * D; source.loopEnd = l1 * D; source.start(tStart, startSec); }
      else {
        const dur = endSec - startSec, real = dur / rate; source.start(tStart, startSec, dur);
        if (real > 0.008) { lg.gain.setValueAtTime(v01 * src.level * Math.pow(10, src.gain / 20), tStart + real - 0.003); lg.gain.linearRampToValueAtTime(0, tStart + real); }
      }
      if (stopAt < Infinity) { try { source.stop(stopAt); v.stopAt = stopAt; } catch (err) { /* ok */ } }
      source.onended = () => endVoice(trg, v);
      trg.voices.push(v); trg.alive++; voiceCount++;
      return v;
    }

    // het hart: een pad afspelen op tijd t (audioklok)
    function trigger(i, t, vel, note, dur, held) {
      if (dead || i < 0 || i >= NBANK * NPAD) return null;
      const pad = padOf(i), v01 = clamp(vel, 0, 1), v127 = clamp(Math.round(v01 * 127), 1, 127);
      const srcs = pickSources(pad, i, v127, note); if (!srcs.length) return null;
      const mine = [...trigs].filter(x => x.i === i && !x.killed);
      while (mine.length >= pad.polyphony) killTrig(mine.shift(), t);
      if (pad.muteGroup > 0) for (const x of trigs) if (x.i !== i && x.group === pad.muteGroup && !x.killed) killTrig(x, t);
      const liveVoices = () => { let n = 0; for (const x of trigs) if (!x.killed) n += x.alive; return n; };
      while (liveVoices() + srcs.length > MAX_VOICES) { let old = null; for (const x of trigs) if (!x.killed && (!old || x.id < old.id)) old = x; if (!old) break; killTrig(old, t); }
      const rt = padRt(i), trg = { id: ++trigSeq, i, group: pad.muteGroup, t0: t, note: note == null ? -1 : note, held: !!held, oneShot: pad.oneShot, relTime: pad.env.release, released: false, killed: false, alive: 0, voices: [], rel: own(ctx.createGain()), kill: own(ctx.createGain()) };
      trg.rel.connect(trg.kill); trg.kill.connect(rt.gain);
      trigs.add(trg);
      for (const s of srcs) { try { voice(trg, pad, i, s, t, v01); } catch (e) { /* een kapotte laag mag de rest niet stoppen */ } }
      if (!trg.voices.length) { for (const n of [trg.rel, trg.kill]) { try { n.disconnect(); } catch (e) { /* los */ } nodes.delete(n); } trigs.delete(trg); return null; }
      hitAt[i] = performance.now();
      if (!held && Number.isFinite(dur)) releaseTrig(trg, t + Math.max(0, dur));
      return trg;
    }

    const padNote = (b, p) => prog.baseNote + b * NPAD + p;
    const hasSound = pad => pad.layers.some(l => l.sampleId) || (pad.mode === 'key' && pad.zones.some(z => z.sampleId));
    function playNote(n, vel, t, dur, held) {
      let claimed = false;
      for (let b = 0; b < NBANK; b++) for (let p = 0; p < NPAD; p++) { const pad = prog.banks[b].pads[p]; if (pad.mode === 'drum' && padNote(b, p) === n && hasSound(pad)) { claimed = true; trigger(b * NPAD + p, t, vel, n, dur, held); } }
      if (!claimed) for (let b = 0; b < NBANK; b++) for (let p = 0; p < NPAD; p++) { const pad = prog.banks[b].pads[p]; if (pad.mode === 'key' && hasSound(pad)) trigger(b * NPAD + p, t, vel, n, dur, held); }
    }
    function laneToPad(lane) {
      const s = String(lane == null ? '' : lane).trim().toLowerCase(); let m;
      if ((m = /^(?:pad)?(\d{1,2})$/.exec(s))) { const p = +m[1] - 1; return p >= 0 && p < NPAD ? prog.bank * NPAD + p : -1; }
      if ((m = /^([a-d])(\d{1,2})$/.exec(s))) { const p = +m[2] - 1; return p >= 0 && p < NPAD ? (m[1].charCodeAt(0) - 97) * NPAD + p : -1; }
      return -1;
    }

    // ---------- wijzigingen aan een pad die direct hoorbaar zijn ----------
    function padLive(i) {
      const r = prt[i], now = ctx.currentTime; if (!r) return;
      r.gain.gain.setTargetAtTime(effLevel(i), now, 0.01); r.pan.pan.setTargetAtTime(padOf(i).pan, now, 0.01); route(i);
      for (const x of trigs) if (x.i === i) for (const v of x.voices) {
        if (v.ended) continue;
        try { v.source.detune.setTargetAtTime(v.base + effTune(i) * 100, now, 0.01); if (v.bq) v.bq.frequency.setTargetAtTime(effCut(i), now, 0.01); } catch (e) { /* ok */ }
      }
    }
    function allLive() { applyMaster(); for (let i = 0; i < prt.length; i++) if (prt[i]) padLive(i); }

    // ---------- noten-namen voor sequencers (contract v1.14) ----------
    function noteList() {
      const out = [];
      for (let b = 0; b < NBANK; b++) for (let p = 0; p < NPAD; p++) {
        const pad = prog.banks[b].pads[p], n = padNote(b, p);
        if (pad.mode === 'drum' && hasSound(pad) && n <= 127 && out.length < 128) out.push({ note: n, name: (pad.name || (sampleInfo(pad.layers.find(l => l.sampleId).sampleId) || {}).name || T.pad + ' ' + padId(b, p).toUpperCase()).slice(0, 40) });
      }
      return out;
    }
    function notesNotify() { const sig = JSON.stringify(noteList()); if (sig === notesSig) return; notesSig = sig; if (selfRef && typeof host.noteNamesChanged === 'function') { try { host.noteNamesChanged(selfRef); } catch (e) { /* ok */ } } }

    // ---------- samples laden ----------
    function readSmpl(ab) {   // WAV: root en lus uit het smpl-blok
      try {
        const dv = new DataView(ab); if (dv.byteLength < 44 || dv.getUint32(0, false) !== 0x52494646 || dv.getUint32(8, false) !== 0x57415645) return null;
        let pos = 12, block = 0, dataLen = 0, smpl = null;
        while (pos + 8 <= dv.byteLength) {
          const id = dv.getUint32(pos, false), len = dv.getUint32(pos + 4, true), body = pos + 8;
          if (id === 0x666d7420 && body + 16 <= dv.byteLength) block = dv.getUint16(body + 12, true);
          else if (id === 0x64617461) dataLen = Math.min(len, dv.byteLength - body);
          else if (id === 0x736d706c && body + 36 <= dv.byteLength) smpl = body;
          pos = body + len + (len & 1);
        }
        if (smpl === null) return null;
        const unity = dv.getUint32(smpl + 12, true), nl = dv.getUint32(smpl + 28, true), frames = block > 0 ? dataLen / block : 0;
        const out = { root: unity > 0 && unity <= 127 ? unity : null, loop: null };
        if (nl > 0 && frames > 0 && smpl + 36 + 24 <= dv.byteLength) {
          const ls = dv.getUint32(smpl + 36 + 8, true), le = dv.getUint32(smpl + 36 + 12, true) + 1;
          if (le > ls && le <= frames) out.loop = { start: ls / frames, end: le / frames };
        }
        return out;
      } catch (e) { return null; }
    }
    function toRecord(audio, name, meta) {
      const channels = Math.min(2, audio.numberOfChannels), frames = audio.length, rate = Math.round(audio.sampleRate);
      const u = new Uint8Array(frames * channels * 2), dv = new DataView(u.buffer);
      for (let ch = 0; ch < channels; ch++) { const a = audio.getChannelData(ch); for (let i = 0; i < frames; i++) { const x = Number.isFinite(a[i]) ? clamp(a[i], -1, 1) : 0; dv.setInt16((i * channels + ch) * 2, Math.round(x * (x < 0 ? 32768 : 32767)), true); } }
      const data = b64encode(u);
      return { name: str(name, 80), rate, channels, root: meta && meta.root != null ? meta.root : null, loop: meta && meta.loop ? { start: meta.loop.start, end: meta.loop.end } : null, slices: [], license: { source: '', license: '', author: '', attribution: '' }, data, bytes: u.length, frames };
    }
    function addRecord(rec) {   // dedupliceren op hash van de PCM; geeft het id of gooit een melding
      const id = 's' + hash53(rec.data).toString(36) + '-' + rec.frames.toString(36) + '-' + rec.rate.toString(36) + rec.channels;
      if (store.has(id)) return id;
      if (storeBytes() + rec.bytes > MAX_PCM) throw new Error(T.memFull);
      store.set(id, rec); return id;
    }
    function assignSample(i, layerIdx, id, name) {
      const pad = padOf(i), info = sampleInfo(id), l = pad.layers[layerIdx];
      l.sampleId = id; l.start = 0; l.end = 1; l.root = info && info.root != null ? info.root : l.root;
      l.loop = info && info.loop ? { on: pad.mode === 'key', start: info.loop.start, end: info.loop.end, xfade: 0 } : defLoop();
      if (!pad.name && name) pad.name = str(name, 40);
    }
    async function loadFiles(files) {
      const my = ++token; let loaded = 0, firstErr = '';
      try {
        if (typeof ctx.decodeAudioData !== 'function') throw new Error(T.noDecode);
        const list = Array.from(files || []).slice(0, NPAD);
        for (let k = 0; k < list.length; k++) {
          const f = list[k];
          try {
            if (dead || my !== token) return;
            if (f.size > 50 * 1048576) throw new Error(T.fileBig);
            say(T.loading.replace('{0}', f.name));
            const ab = await f.arrayBuffer(); if (dead || my !== token) return;
            const meta = readSmpl(ab);
            let audio; try { audio = await ctx.decodeAudioData(ab.slice(0)); } catch (e) { throw new Error(T.decodeFail.replace('{0}', f.name)); }
            if (dead || my !== token) return;
            if (!audio || !(audio.length > 0)) throw new Error(T.noAudio.replace('{0}', f.name));
            if (audio.length / audio.sampleRate > MAX_SEC) throw new Error(T.tooLong);
            const name = String(f.name || 'sample').replace(/\.[^.]+$/, ''), id = addRecord(toRecord(audio, name, meta));
            const target = k === 0 ? prog.bank * NPAD + prog.pad : Math.min(NBANK * NPAD - 1, prog.bank * NPAD + prog.pad + k);
            if (padOf(target).mode === 'drum' || k === 0) assignSample(target, k === 0 ? prog.layer : 0, id, name);
            loaded++;
          } catch (e) { if (!firstErr) firstErr = e && e.message ? e.message : String(e); }
        }
        gcStore(); if (ui) ui.refreshAll(); notesNotify();
        say(firstErr ? firstErr : T.loaded.replace('{0}', loaded));
      } catch (e) { say(e && e.message ? e.message : String(e)); }
    }
    const say = msg => { if (ui) ui.say(msg); };

    // ---------- UI ----------
    const downs = new Map();
    let selZone = 0, kbBase = 48, tab = 'pad';
    const curI = () => prog.bank * NPAD + prog.pad;
    const curPad = () => padOf(curI());
    const curLayer = () => curPad().layers[prog.layer];
    const curZone = () => curPad().zones[selZone] || null;
    const fillSelect = (sel, opts, val) => {
      sel.textContent = '';
      for (const [v, t] of opts) { const o = document.createElement('option'); o.value = String(v); o.textContent = t; sel.appendChild(o); }
      sel.value = String(val);
    };
    const sampleOpts = () => [['', T.none], ...DEMOS.map(d => [d.id, '• ' + (d.name[lang] || d.name.en)]), ...[...store].map(([id, r]) => [id, (r.name || id) + ' (' + (r.frames / r.rate).toFixed(2) + ' s)'])];

    function padDown(i, key, note) {
      if (dead) return;
      selectPad(i >> 4, i & 15);
      const pad = padOf(i), n = pad.mode === 'key' ? (note == null ? pad.baseNote : note) : padNote(i >> 4, i & 15);
      const trg = trigger(i, ctx.currentTime, prog.padVel / 127, n, null, true);
      if (trg) downs.set(key, trg);
    }
    function padUp(key) { const trg = downs.get(key); if (trg) { releaseTrig(trg, ctx.currentTime); downs.delete(key); } }
    function selectPad(b, p, quiet) {
      if (prog.bank === b && prog.pad === p) return;
      prog.bank = b; prog.pad = p; selZone = 0; if (ui) ui.refreshAll();
    }

    function buildUI(el) {
      const ctl = [], handles = [], listeners = [];
      let col = null, statusEl = null, cv = null, cvCtx = null, infoEl = null, memEl = null, voicesEl = null, lastVoices = -1, ro = null;
      const wrap = document.createElement('div'); el.appendChild(wrap);
      const sh = typeof wrap.attachShadow === 'function' ? wrap.attachShadow({ mode: 'open' }) : wrap;
      const st = document.createElement('style'); st.textContent = CSS; sh.appendChild(st);
      const H = (tag, cls, parent, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; parent.appendChild(e); return e; };
      const on = (target, type, fn, opts) => { target.addEventListener(type, fn, opts); listeners.push([target, type, fn, opts]); };
      const app = H('div', 'app', sh);
      app.setAttribute('role', 'group'); app.setAttribute('aria-label', 'Pad Sampler');

      // --- bovenste regel: banken, naam, stemmen
      const top = H('div', 'row top', app);
      const bankBtns = BANK_LETTER.map((L, b) => {
        const bt = H('button', 'tabbtn', top, L); bt.type = 'button'; bt.setAttribute('aria-label', T.bank + ' ' + L);
        on(bt, 'click', () => { prog.bank = b; selZone = 0; refreshAll(); }); return bt;
      });
      const bankName = H('input', 'txt', top); bankName.type = 'text'; bankName.maxLength = 40; bankName.setAttribute('aria-label', T.bankName);
      on(bankName, 'change', () => { prog.banks[prog.bank].name = str(bankName.value, 40) || defBank(prog.bank).name; bankName.value = prog.banks[prog.bank].name; });
      on(bankName, 'pointerdown', e => e.stopPropagation());
      voicesEl = H('span', 'muted voices', top, '');
      const stopBtn = H('button', 'btn', top, T.stopAll); stopBtn.type = 'button';
      on(stopBtn, 'click', () => panicAt(ctx.currentTime));

      const main = H('div', 'main', app), left = H('div', 'left', main), right = H('div', 'right', main);

      // --- de pads
      const gridEl = H('div', 'pads', left), padEls = [];
      for (let p = 0; p < NPAD; p++) {
        const b = H('button', 'pad', gridEl); b.type = 'button';
        b.setAttribute('data-pk-role', 'pad'); b.setAttribute('data-pk-id', 'pad' + String(p + 1).padStart(2, '0')); b.setAttribute('data-pk-group', 'pads');
        const n1 = H('span', 'pn', b), n2 = H('span', 'pm', b), n3 = H('span', 'po', b);
        padEls.push({ b, n1, n2, n3, hit: false });
        const key = pid => 'p' + p + ':' + pid;
        on(b, 'pointerdown', e => { if (e.button > 0) return; e.preventDefault(); try { b.focus({ preventScroll: true }); } catch (err) { /* ok */ } try { b.setPointerCapture(e.pointerId); } catch (err) { /* ok */ } padDown(prog.bank * NPAD + p, key(e.pointerId)); b.classList.add('down'); });
        const up = e => { padUp(key(e.pointerId)); b.classList.remove('down'); };
        on(b, 'pointerup', up); on(b, 'pointercancel', up); on(b, 'lostpointercapture', up);
        on(b, 'contextmenu', e => e.preventDefault());
        on(b, 'keydown', e => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (!e.repeat) { padDown(prog.bank * NPAD + p, key('kb')); b.classList.add('down'); } return; }
          const d = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -4, ArrowDown: 4 }[e.key];
          if (d) { e.preventDefault(); const q = p + d; if (q >= 0 && q < NPAD) { padEls[q].b.focus(); selectPad(prog.bank, q); } }
        });
        on(b, 'keyup', e => { if (e.key === 'Enter' || e.key === ' ') { padUp(key('kb')); b.classList.remove('down'); } });
        on(b, 'dragover', e => e.preventDefault());
        on(b, 'drop', e => { e.preventDefault(); selectPad(prog.bank, p); if (e.dataTransfer && e.dataTransfer.files) loadFiles(e.dataTransfer.files); });
      }
      const padInfo = H('div', 'muted padinfo', left);

      // --- toetsen voor een keygroup
      const kbWrap = H('div', 'kbwrap', left), kbRow = H('div', 'row', kbWrap), keysEl = H('div', 'keys', kbWrap), keyEls = [];
      const octDown = H('button', 'btn', kbRow, '−'); octDown.type = 'button'; octDown.setAttribute('aria-label', T.octDown);
      const octUp = H('button', 'btn', kbRow, '+'); octUp.type = 'button'; octUp.setAttribute('aria-label', T.octUp);
      const octLbl = H('span', 'muted', kbRow, '');
      on(octDown, 'click', () => { kbBase = clamp(kbBase - 12, 0, 96); paintKeys(); });
      on(octUp, 'click', () => { kbBase = clamp(kbBase + 12, 0, 96); paintKeys(); });
      for (let k = 0; k < 25; k++) {
        const kb = H('button', 'key', keysEl); kb.type = 'button'; keyEls.push(kb);
        const noteOf = () => clamp(kbBase + k, 0, 127), key = pid => 'k' + k + ':' + pid;
        on(kb, 'pointerdown', e => { if (e.button > 0) return; e.preventDefault(); try { kb.setPointerCapture(e.pointerId); } catch (err) { /* ok */ } padDown(curI(), key(e.pointerId), noteOf()); kb.classList.add('down'); });
        const up = e => { padUp(key(e.pointerId)); kb.classList.remove('down'); };
        on(kb, 'pointerup', up); on(kb, 'pointercancel', up); on(kb, 'lostpointercapture', up);
        on(kb, 'keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (!e.repeat) { padDown(curI(), key('kb'), noteOf()); kb.classList.add('down'); } } });
        on(kb, 'keyup', e => { if (e.key === 'Enter' || e.key === ' ') { padUp(key('kb')); kb.classList.remove('down'); } });
      }
      function paintKeys() {
        const key = curPad().mode === 'key'; kbWrap.hidden = !key; if (!key) return;
        octLbl.textContent = noteName(clamp(kbBase, 0, 127)) + ' – ' + noteName(clamp(kbBase + 24, 0, 127));
        keyEls.forEach((kb, k) => { const n = kbBase + k; kb.textContent = NOTE_NAMES[n % 12].length === 1 ? (n % 12 === 0 ? noteName(n) : '') : ''; kb.className = 'key' + (NOTE_NAMES[n % 12].length === 2 ? ' black' : '') + (n > 127 ? ' off' : ''); kb.setAttribute('aria-label', noteName(clamp(n, 0, 127))); });
      }

      // --- tabs en panelen
      const tabs = H('div', 'row tabs', right), panels = {};
      const TABS = [['pad', T.tabPad], ['layer', T.tabLayers], ['zone', T.tabZones], ['prog', T.tabProgram]];
      const tabBtns = TABS.map(([id, label]) => {
        const bt = H('button', 'tabbtn', tabs, label); bt.type = 'button'; bt.setAttribute('role', 'tab');
        on(bt, 'click', () => showTab(id)); panels[id] = H('div', 'panel', right); return bt;
      });
      function showTab(id) {
        tab = id; TABS.forEach(([t], k) => { panels[t].hidden = t !== id; tabBtns[k].classList.toggle('sel', t === id); tabBtns[k].setAttribute('aria-selected', t === id ? 'true' : 'false'); });
        if (id === 'layer' || id === 'zone') drawWave();
      }

      // --- helpers voor regelaars
      const scopeObj = sc => (sc === 'prog' ? prog : sc === 'pad' ? curPad() : sc === 'layer' ? curLayer() : curZone());
      const getV = k => { const o = scopeObj(k[1]); if (!o) return RG[k[3]][3]; let v = o; for (const p of k[2]) v = v[p]; return v == null ? RG[k[3]][3] : v; };
      function constrain(id) {
        const l = curLayer(), z = curZone(), E = 0.0001;
        if (id === 'layer.start') l.start = Math.min(l.start, l.end - E);
        else if (id === 'layer.end') l.end = Math.max(l.end, l.start + E);
        else if (id === 'layer.velLo') { if (l.velLo > l.velHi) l.velHi = l.velLo; }
        else if (id === 'layer.velHi') { if (l.velHi < l.velLo) l.velLo = l.velHi; }
        else if (id === 'layer.loopStart') l.loop.start = Math.min(l.loop.start, l.loop.end - E);
        else if (id === 'layer.loopEnd') l.loop.end = Math.max(l.loop.end, l.loop.start + E);
        else if (z && id === 'zone.keyLo') { if (z.keyLo > z.keyHi) z.keyHi = z.keyLo; }
        else if (z && id === 'zone.keyHi') { if (z.keyHi < z.keyLo) z.keyLo = z.keyHi; }
        else if (z && id === 'zone.velLo') { if (z.velLo > z.velHi) z.velHi = z.velLo; }
        else if (z && id === 'zone.velHi') { if (z.velHi < z.velLo) z.velLo = z.velHi; }
        else if (z && id === 'zone.loopStart') z.loop.start = Math.min(z.loop.start, z.loop.end - E);
        else if (z && id === 'zone.loopEnd') z.loop.end = Math.max(z.loop.end, z.loop.start + E);
      }
      function after(id, sc) {
        if (sc === 'pad') padLive(curI());
        if (id === 'level') applyMaster();
        if (sc === 'layer' || sc === 'zone') { drawWave(); fillZones(); }
        if (id === 'baseNote' || id === 'pad.baseNote') { paintPads(); notesNotify(); }
        if (id === 'pad.mute') paintPads();
        if (id === 'pad.poly') { /* geldt vanaf de volgende aanslag */ }
      }
      function knob(parent, k) {
        const [id, sc, , rk, fmt, scale, group] = k, r = RG[rk];
        const c = host.ui.knob(parent, T.k[id] || id, [r[0], r[1], r[2]], getV(k), fmt, v => {
          const o = scopeObj(sc); if (!o) return;
          let x = r[2] >= 1 ? Math.round(v) : v; x = clamp(x, r[0], r[1]);
          let t = o; const p = k[2]; for (let q = 0; q < p.length - 1; q++) t = t[p[q]]; t[p[p.length - 1]] = x;
          constrain(id); refreshCtl(); after(id, sc);
        }, { id, role: 'param', group, default: r[3], scale });
        ctl.push(() => c.set(getV(k))); return c;
      }
      const KN = Object.fromEntries(KNOBS.map(k => [k[0], k]));
      const knobs = (parent, ids) => { const g = H('div', 'grid', parent); ids.forEach(id => knob(g, KN[id])); return g; };
      function selectBox(parent, id, group, label, opts, getter, setter) {
        const s = host.ui.select(parent, label, opts, getter(), v => setter(v), { id, group });
        ctl.push(() => { s.value = String(getter()); }); return s;
      }
      function toggle(parent, id, group, text, getter, setter) {
        let h;
        if (host.ui && typeof host.ui.pad === 'function') {
          h = host.ui.pad(parent, text, { id, group, mode: 'toggle', on: !!getter(), text, onchange: v => setter(!!v) }); handles.push(h);
          ctl.push(() => h.set(!!getter()));
        } else {
          const b = H('button', 'btn', parent, text); b.type = 'button'; let v = !!getter(); b.setAttribute('aria-pressed', String(v)); b.classList.toggle('sel', v);
          on(b, 'click', () => { v = !v; b.setAttribute('aria-pressed', String(v)); b.classList.toggle('sel', v); setter(v); });
          ctl.push(() => { v = !!getter(); b.setAttribute('aria-pressed', String(v)); b.classList.toggle('sel', v); });
        }
      }
      const button = (parent, text, fn, cls) => { const b = H('button', cls || 'btn', parent, text); b.type = 'button'; on(b, 'click', fn); return b; };

      // --- paneel Pad
      {
        const P = panels.pad, r1 = H('div', 'row', P);
        const nameIn = H('input', 'txt', r1); nameIn.type = 'text'; nameIn.maxLength = 40; nameIn.placeholder = T.padName; nameIn.setAttribute('aria-label', T.padName);
        on(nameIn, 'change', () => { curPad().name = str(nameIn.value, 40); paintPads(); notesNotify(); });
        on(nameIn, 'pointerdown', e => e.stopPropagation());
        ctl.push(() => { nameIn.value = curPad().name; });
        button(r1, T.clearPad, () => { prog.banks[prog.bank].pads[prog.pad] = defPad(); gcStore(); refreshAll(); notesNotify(); });
        const g1 = H('div', 'grid', P);
        selectBox(g1, 'pad.mode', 'pad', T.mode, [['drum', T.modeDrum], ['key', T.modeKey]], () => curPad().mode, v => { const p = curPad(); p.mode = v === 'key' ? 'key' : 'drum'; p.oneShot = p.mode === 'drum'; if (p.mode === 'key' && p.polyphony === 4) p.polyphony = 16; refreshAll(); notesNotify(); });
        selectBox(g1, 'pad.play', 'pad', T.play, [['velocity', T.pVelocity], ['cycle', T.pCycle], ['random', T.pRandom], ['all', T.pAll]], () => curPad().play, v => { curPad().play = v; });
        selectBox(g1, 'pad.output', 'pad', T.output, [['0', T.outMix], ...Array.from({ length: 16 }, (_, i) => [String(i + 1), T.outN + ' ' + (i + 1)])], () => String(curPad().output), v => { curPad().output = int(+v, 0, 0, 16); padLive(curI()); paintPads(); });
        const g2 = H('div', 'row', P);
        toggle(g2, 'pad.oneshot', 'pad', T.oneShot, () => curPad().oneShot, v => { curPad().oneShot = v; });
        toggle(g2, 'pad.reverse', 'pad', T.reverse, () => curPad().reverse, v => { curPad().reverse = v; });
        knobs(P, ['pad.tune', 'pad.fine', 'pad.level', 'pad.pan', 'pad.poly', 'pad.mute', 'pad.baseNote']);
        H('h4', null, P, T.envelope);
        selectBox(P, 'env.shape', 'env', T.envShape, [['adsr', 'ADSR'], ['ad', 'AD']], () => curPad().env.shape, v => { curPad().env.shape = v === 'ad' ? 'ad' : 'adsr'; });
        knobs(P, ['env.attack', 'env.decay', 'env.sustain', 'env.release']);
        H('h4', null, P, T.filter);
        selectBox(P, 'filt.type', 'filter', T.filterType, [['off', T.off], ['lp', T.lp], ['hp', T.hp], ['bp', T.bp]], () => curPad().filter.type, v => { curPad().filter.type = ['lp', 'hp', 'bp'].includes(v) ? v : 'off'; });
        knobs(P, ['filt.cutoff', 'filt.res', 'filt.envAmt', 'filt.velAmt']);
      }

      // --- paneel Lagen
      let layerSel = null, layerBtns = [], zoneSel = null, zoneInfo = null, zoneBox = null;
      {
        const P = panels.layer, r1 = H('div', 'row', P);
        layerBtns = Array.from({ length: NLAYER }, (_, i) => { const b = H('button', 'tabbtn', r1, T.layer + ' ' + (i + 1)); b.type = 'button'; on(b, 'click', () => { prog.layer = i; refreshAll(); }); return b; });
        const r2 = H('div', 'row', P);
        layerSel = host.ui.select(r2, T.sample, sampleOpts(), curLayer().sampleId, v => { assignSample(curI(), prog.layer, v, ''); if (v === '') curLayer().root = null; gcStore(); refreshAll(); notesNotify(); }, { id: 'layer.sample', group: 'layer' });
        const fileIn = H('input', 'file', r2); fileIn.type = 'file'; fileIn.accept = '.wav,.flac,.ogg,.mp3,audio/*'; fileIn.multiple = true; fileIn.hidden = true; fileIn.setAttribute('aria-label', T.loadFile);
        on(fileIn, 'change', () => { if (fileIn.files && fileIn.files.length) loadFiles(fileIn.files); fileIn.value = ''; });
        button(r2, T.loadFile, () => fileIn.click());
        button(r2, T.clearLayer, () => { curPad().layers[prog.layer] = defLayer(); gcStore(); refreshAll(); notesNotify(); });
        cv = H('canvas', 'wave', P); cv.setAttribute('role', 'img'); cv.setAttribute('aria-label', T.waveform); cvCtx = typeof cv.getContext === 'function' ? cv.getContext('2d') : null;
        on(cv, 'dragover', e => e.preventDefault()); on(cv, 'drop', e => { e.preventDefault(); if (e.dataTransfer && e.dataTransfer.files) loadFiles(e.dataTransfer.files); });
        infoEl = H('div', 'muted', P, '');
        knobs(P, ['layer.semi', 'layer.fine', 'layer.level', 'layer.pan', 'layer.offset', 'layer.root', 'layer.velLo', 'layer.velHi', 'layer.start', 'layer.end', 'layer.gain']);
        H('h4', null, P, T.loop);
        toggle(P, 'layer.loopon', 'loop', T.loopOn, () => curLayer().loop.on, v => { curLayer().loop.on = v; drawWave(); });
        knobs(P, ['layer.loopStart', 'layer.loopEnd', 'layer.xfade']);
        H('p', 'muted', P, T.layerHelp);
      }

      // --- paneel Zones
      {
        const P = panels.zone;
        H('p', 'muted', P, T.zoneHelp);
        const r1 = H('div', 'row', P);
        zoneSel = host.ui.select(r1, T.zone, [['0', '–']], '0', v => { selZone = int(+v, 0, 0, MAXZONE - 1); refreshAll(); }, { id: 'zone.select', group: 'zone' });
        button(r1, T.zoneAdd, () => {
          const p = curPad(); if (p.zones.length >= MAXZONE) return;
          const last = p.zones[p.zones.length - 1], l = curLayer();
          const z = defZone(); z.sampleId = l.sampleId; z.root = l.root == null ? 60 : l.root; if (last && last.keyHi < 127) { z.keyLo = last.keyHi + 1; z.keyHi = 127; }
          p.zones.push(z); selZone = p.zones.length - 1; refreshAll(); notesNotify();
        });
        button(r1, T.zoneDel, () => { const p = curPad(); if (!p.zones.length) return; p.zones.splice(selZone, 1); selZone = clamp(selZone, 0, Math.max(0, p.zones.length - 1)); gcStore(); refreshAll(); notesNotify(); });
        zoneInfo = H('p', 'muted', P, '');
        zoneBox = H('div', null, P);
        const zs = host.ui.select(zoneBox, T.sample, sampleOpts(), '', v => { const z = curZone(); if (!z) return; z.sampleId = v; const inf = sampleInfo(v); if (inf && inf.root != null) z.root = inf.root; gcStore(); refreshAll(); }, { id: 'zone.sample', group: 'zone' });
        ctl.push(() => { const z = curZone(); fillSelect(zs, sampleOpts(), z ? z.sampleId : ''); });
        knobs(zoneBox, ['zone.root', 'zone.keyLo', 'zone.keyHi', 'zone.velLo', 'zone.velHi', 'zone.tune']);
        toggle(zoneBox, 'zone.loopon', 'loop', T.loopOn, () => { const z = curZone(); return z ? z.loop.on : false; }, v => { const z = curZone(); if (z) z.loop.on = v; drawWave(); });
        knobs(zoneBox, ['zone.loopStart', 'zone.loopEnd']);
      }

      // --- paneel Programma
      {
        const P = panels.prog;
        knobs(P, ['level', 'baseNote', 'padVel']);
        const r = H('div', 'row', P);
        button(r, T.demoKit, () => { token++; panicAt(ctx.currentTime); prog.banks = defaultBanks(); store.clear(); bufs.clear(); selZone = 0; gcStore(); refreshAll(); notesNotify(); say(T.demoKitDone); });
        button(r, T.clearAll, () => { token++; panicAt(ctx.currentTime); prog.banks = Array.from({ length: NBANK }, (_, i) => defBank(i)); store.clear(); bufs.clear(); selZone = 0; refreshAll(); notesNotify(); say(T.clearDone); });
        memEl = H('p', 'muted', P, '');
        H('p', 'muted', P, T.help);
      }
      statusEl = H('div', 'status', app); statusEl.setAttribute('role', 'status'); statusEl.setAttribute('aria-live', 'polite');

      // --- tekenen
      function colors() {
        if (!col) { const cs = typeof getComputedStyle === 'function' ? getComputedStyle(cv) : null, v = (n, d) => (cs && cs.getPropertyValue(n).trim()) || d; col = { bg: v('--well', '#101418'), fg: v('--well-fg', '#8a97a0'), au: v('--audio', '#4ec9d4'), ev: v('--event', '#f0a040') }; }
        return col;
      }
      function waveSource() {
        if (tab === 'zone') { const z = curZone(); return z ? { id: z.sampleId, start: 0, end: 1, loop: z.loop } : { id: '', start: 0, end: 1, loop: null }; }
        const l = curLayer(); return { id: l.sampleId, start: l.start, end: l.end, loop: l.loop };
      }
      function drawWave() {
        if (!cv || !cvCtx) return;
        const cssW = Math.max(120, Math.round(cv.clientWidth || 600)), dpr = Math.min(2, Math.max(1, Number(globalThis.devicePixelRatio) || 1)), w = Math.round(cssW * dpr), h = Math.round(110 * dpr), k = colors();
        if (cv.width !== w) cv.width = w; if (cv.height !== h) cv.height = h;
        const g = cvCtx; g.setTransform(dpr, 0, 0, dpr, 0, 0); g.fillStyle = k.bg; g.fillRect(0, 0, cssW, 110);
        const s = waveSource(), info = sampleInfo(s.id);
        if (!info) { g.fillStyle = k.fg; g.font = '13px system-ui'; g.fillText(T.dropHint, 12, 58); return; }
        const pk = peaksOf(s.id, cssW); if (!pk) return;
        g.globalAlpha = 0.25; g.fillStyle = k.au; g.fillRect(s.start * cssW, 0, (s.end - s.start) * cssW, 110); g.globalAlpha = 1;
        g.strokeStyle = k.au; g.beginPath();
        for (let x = 0; x < cssW; x++) { const lo = pk[x * 2], hi = pk[x * 2 + 1]; g.moveTo(x + 0.5, 55 - hi * 52); g.lineTo(x + 0.5, 55 - lo * 52 - 0.5); }
        g.stroke();
        g.strokeStyle = k.ev;
        const line = x => { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 110); g.stroke(); };
        line(s.start * cssW); line(s.end * cssW - 1);
        if (s.loop && s.loop.on) { g.setLineDash([4, 3]); line(s.loop.start * cssW); line(s.loop.end * cssW - 1); g.setLineDash([]); }
      }

      // --- verversen
      function paintPads() {
        const bank = prog.banks[prog.bank];
        for (let p = 0; p < NPAD; p++) {
          const pad = bank.pads[p], e = padEls[p], info = pad.layers.map(l => l.sampleId).find(Boolean) || (pad.zones[0] && pad.zones[0].sampleId) || '';
          const nm = pad.name || (info && (sampleInfo(info) || {}).name) || '';
          e.n1.textContent = String(p + 1).padStart(2, '0') + (pad.mode === 'key' ? ' ♪' : ''); e.n2.textContent = nm;
          e.n3.textContent = (pad.mode === 'drum' ? noteName(Math.min(127, padNote(prog.bank, p))) : T.keys) + (pad.output ? ' · ' + T.outN + ' ' + pad.output : '');
          e.b.classList.toggle('sel', p === prog.pad); e.b.classList.toggle('empty', !hasSound(pad));
          e.b.setAttribute('aria-label', T.pad + ' ' + BANK_LETTER[prog.bank] + (p + 1) + (nm ? ', ' + nm : '') + (hasSound(pad) ? '' : ', ' + T.empty));
          e.b.setAttribute('aria-pressed', p === prog.pad ? 'true' : 'false');
        }
        bankBtns.forEach((bt, b) => { bt.classList.toggle('sel', b === prog.bank); bt.setAttribute('aria-pressed', b === prog.bank ? 'true' : 'false'); });
        bankName.value = prog.banks[prog.bank].name;
        const pad = curPad(); padInfo.textContent = BANK_LETTER[prog.bank] + (prog.pad + 1) + (pad.mode === 'drum' ? ' · MIDI ' + padNote(prog.bank, prog.pad) : ' · ' + T.modeKey);
      }
      function fillZones() {
        const p = curPad(); selZone = clamp(selZone, 0, Math.max(0, p.zones.length - 1));
        fillSelect(zoneSel, p.zones.length ? p.zones.map((z, i) => [String(i), (i + 1) + ' · ' + noteName(z.keyLo) + '–' + noteName(z.keyHi) + ' · ' + ((sampleInfo(z.sampleId) || {}).name || T.none)]) : [['0', '–']], String(selZone));
        zoneBox.hidden = !p.zones.length;
        zoneInfo.textContent = p.mode !== 'key' ? T.zoneNotKey : (p.zones.length ? T.zoneCount.replace('{0}', p.zones.length) : T.zoneNone);
      }
      function refreshCtl() { for (const f of ctl) { try { f(); } catch (e) { /* een regelaar mag de rest niet stoppen */ } } }
      function refreshAll() {
        paintPads(); paintKeys();
        fillSelect(layerSel, sampleOpts(), curLayer().sampleId); fillZones();
        layerBtns.forEach((b, i) => { b.classList.toggle('sel', i === prog.layer); b.classList.toggle('has', !!curPad().layers[i].sampleId); b.setAttribute('aria-pressed', i === prog.layer ? 'true' : 'false'); });
        refreshCtl();
        const inf = sampleInfo(curLayer().sampleId);
        infoEl.textContent = inf ? inf.name + ' · ' + inf.rate + ' Hz · ' + (inf.channels === 2 ? 'stereo' : 'mono') + ' · ' + (inf.frames / inf.rate).toFixed(2) + ' s' + (inf.root != null ? ' · root ' + noteName(inf.root) : '') + (inf.loop ? ' · loop' : '') + (inf.demo ? ' · ' + T.builtin : '') : T.noSample;
        memEl.textContent = T.mem.replace('{0}', (storeBytes() / 1048576).toFixed(1)).replace('{1}', MAX_PCM / 1048576);
        drawWave(); showTab(tab);
      }
      // de klok van de host: treffers laten oplichten en het aantal stemmen tonen
      function tick() {
        const now = performance.now();
        for (let p = 0; p < NPAD; p++) { const hit = now - hitAt[prog.bank * NPAD + p] < 140; if (hit !== padEls[p].hit) { padEls[p].hit = hit; padEls[p].b.classList.toggle('hit', hit); } }
        if (voiceCount !== lastVoices) { lastVoices = voiceCount; voicesEl.textContent = T.voices + ': ' + voiceCount + '/' + MAX_VOICES; }
      }
      // toetsenbord van de computer: pads (drum) of een pianorij (keygroup)
      const heldKeys = new Set();
      on(app, 'keydown', e => {
        const t = e.target && e.target.tagName; if (t === 'INPUT' || t === 'SELECT' || t === 'TEXTAREA' || e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
        const k = String(e.key).toLowerCase();
        if (curPad().mode === 'key') { const n = PIANO_KEYS.indexOf(k); if (n >= 0 && !heldKeys.has(k)) { heldKeys.add(k); padDown(curI(), 'h:' + k, clamp(kbBase + 12 + n, 0, 127)); e.preventDefault(); } return; }
        for (let r = 0; r < 4; r++) { const c = KEYBOARD_ROWS[r].indexOf(k); if (c >= 0 && !heldKeys.has(k)) { heldKeys.add(k); padDown(prog.bank * NPAD + r * 4 + c, 'h:' + k); padEls[r * 4 + c].b.classList.add('down'); e.preventDefault(); } }
      });
      on(app, 'keyup', e => {
        const k = String(e.key).toLowerCase(); if (!heldKeys.has(k)) return; heldKeys.delete(k); padUp('h:' + k);
        for (const pe of padEls) pe.b.classList.remove('down');
      });
      const skinFn = () => { col = null; drawWave(); };
      if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') on(window, 'patchkamer-skin', skinFn);
      if (typeof ResizeObserver === 'function') { ro = new ResizeObserver(() => { if (tab === 'layer' || tab === 'zone') drawWave(); }); try { ro.observe(cv); } catch (e) { /* ok */ } }
      stopFrame = tekenLus(host, selfRef, tick, 30);

      ui = {
        refreshAll, refreshCtl, say(m) { if (statusEl) statusEl.textContent = m || ''; }, drawWave,
        destroy() {
          if (stopFrame) { stopFrame(); stopFrame = null; }
          if (ro) { try { ro.disconnect(); } catch (e) { /* ok */ } ro = null; }
          for (const [t, ty, fn, o] of listeners) { try { t.removeEventListener(ty, fn, o); } catch (e) { /* ok */ } } listeners.length = 0;
          for (const h of handles) { try { h.destroy && h.destroy(); } catch (e) { /* ok */ } } handles.length = 0;
          for (const t of downs.values()) releaseTrig(t, ctx.currentTime); downs.clear();
          try { if (typeof wrap.remove === 'function') wrap.remove(); } catch (e) { /* ok */ }
        },
      };
      showTab(tab); refreshAll();
    }

    // ---------- parameters voor sturing (mod) ----------
    const PARAMS = (() => {
      const L = [{ id: 'level', name: T.k.level, lane: 'master', laneName: T.master, min: 0, max: 1, scale: 'lin', role: 'level', drift: 0.03, on: false }];
      for (let b = 0; b < NBANK; b++) for (let p = 0; p < NPAD; p++) {
        const id = padId(b, p), ln = T.pad + ' ' + BANK_LETTER[b] + (p + 1);
        L.push({ id: id + '.level', name: T.k['pad.level'], lane: id, laneName: ln, min: -60, max: 12, scale: 'lin', role: 'level', drift: 0.04, on: false });
        L.push({ id: id + '.cutoff', name: T.k['filt.cutoff'], lane: id, laneName: ln, min: 20, max: 20000, scale: 'log', role: 'filter', drift: 0.05, on: false });
        L.push({ id: id + '.tune', name: T.k['pad.tune'], lane: id, laneName: ln, min: -24, max: 24, scale: 'lin', role: 'pitch', drift: 0, on: false });
      }
      return L;
    })();
    const MODIDS = new Set(PARAMS.map(q => q.id));

    const self = {
      inputs: {}, outputs,
      mount(el) { if (dead || !el) return; if (ui) ui.destroy(); ui = null; buildUI(el); },
      unmount() { if (ui) { ui.destroy(); ui = null; } },
      onTransport(info) { if (info && info.playing === false) { const t = ctx.currentTime; for (const x of [...trigs]) releaseTrig(x, t); } },
      onEvent(port, ev) {
        try {
          if (dead || port !== 'notes' || !isObj(ev)) return;
          const t = Math.max(ctx.currentTime, Number.isFinite(ev.time) ? ev.time : ctx.currentTime), type = String(ev.type).toLowerCase().replace(/[_-]/g, '');
          if (type === 'allnotesoff' || type === 'panic') { panicAt(t); return; }
          const isNote = type === 'note' || type === 'noteon';
          if (type === 'noteoff' || (isNote && ev.vel === 0)) { if (Number.isFinite(ev.note)) noteOffAt(clamp(Math.round(ev.note), 0, 127), t); return; }
          if (isNote) {
            if (!Number.isFinite(ev.note)) return;
            const held = ev.held === true, dur = held ? null : (Number.isFinite(ev.dur) ? Math.max(0, ev.dur) : 0.25);
            playNote(clamp(Math.round(ev.note), 0, 127), num(ev.vel, 0.8, 0, 1), t, dur, held);
          } else if (type === 'trig') {
            const i = laneToPad(ev.lane), vel = num(ev.vel, 1, 0, 1); if (i < 0 || vel <= 0) return;
            const pad = padOf(i); trigger(i, t, vel, pad.mode === 'key' ? pad.baseNote : padNote(i >> 4, i & 15), Number.isFinite(ev.dur) ? Math.max(0, ev.dur) : 0.25, false);
          } else if (type === 'cc' && (ev.id === 'level' || ev.id === 'volume') && Number.isFinite(ev.value)) {
            prog.level = clamp(ev.value, 0, 1); applyMaster(); if (ui) ui.refreshCtl();
          }
        } catch (e) { /* een event mag de planner nooit breken */ }
      },
      params() { return PARAMS.map(q => ({ ...q })); },
      modulate(o) {
        if (dead) return; const n = Object.create(null);
        if (isObj(o)) for (const k of Object.keys(o)) if (MODIDS.has(k) && typeof o[k] === 'number' && Number.isFinite(o[k])) n[k] = clamp(o[k], -1, 1);
        mod = n; allLive();
      },
      noteNames() { try { return noteList(); } catch (e) { return []; } },
      async loadAudio(files) { await loadFiles(files); },
      getState() {
        const samples = {}; for (const [id, r] of store) samples[id] = serSample(r);
        return {
          v: 1, bank: prog.bank, pad: prog.pad, layer: prog.layer, baseNote: prog.baseNote, level: prog.level, padVel: prog.padVel,
          banks: prog.banks.map(bk => ({ name: bk.name, pads: bk.pads.map(serPad) })), samples,
        };
      },
      setState(raw) {
        if (dead) return;
        const s = isObj(raw) ? raw : {};
        panicAt(ctx.currentTime); token++;
        const next = new Map(); let total = 0, dropped = 0, n = 0;
        if (isObj(s.samples)) for (const id of Object.keys(s.samples)) {
          if (++n > 4096) { dropped++; break; }
          const rec = nSample(id, s.samples[id]);
          if (!rec || total + rec.bytes > MAX_PCM) { dropped++; continue; }
          next.set(id, rec); total += rec.bytes;
        }
        const has = id => !!DEMO_BY_ID[id] || next.has(id);
        prog.banks = Array.isArray(s.banks) ? Array.from({ length: NBANK }, (_, i) => nBank(s.banks[i], i, has)) : defaultBanks();
        prog.bank = int(s.bank, 0, 0, NBANK - 1); prog.pad = int(s.pad, 0, 0, NPAD - 1); prog.layer = int(s.layer, 0, 0, NLAYER - 1);
        prog.baseNote = int(s.baseNote, 36, 0, 63); prog.level = num(s.level, 0.8, 0, 1); prog.padVel = int(s.padVel, 100, 1, 127);
        store.clear(); for (const [k, v] of next) store.set(k, v);
        gcStore(); rr.fill(0); lastPick.fill(-1); selZone = 0;
        allLive(); notesNotify(); warm();
        if (ui) ui.refreshAll();
        if (dropped) say(T.dropped.replace('{0}', dropped));
      },
      destroy() {
        if (dead) return; dead = true; token++;
        if (warmTimer) { clearTimeout(warmTimer); warmTimer = 0; }
        if (ui) { ui.destroy(); ui = null; }
        for (const x of [...trigs]) for (const v of x.voices) { try { v.source.onended = null; v.source.stop(); } catch (e) { /* al gestopt */ } }
        trigs.clear();
        for (const n of nodes) { try { n.disconnect(); } catch (e) { /* los */ } }
        nodes.clear(); bufs.clear(); store.clear();
      },
    };
    selfRef = self;
    return self;
  },
};
