// SPDX-License-Identifier: AGPL-3.0-or-later
// 1.11.0 — Nieuw als Biotope (nieuwe id nl.patchkamer.biotope, eigen map), bijgewerkt naar Patchkamer contract v1.11:
//   - tweetalig (host.lang, namen per taal in i18n); de naam is in alle talen Biotope
//   - setState volgt §13: waarden buiten het bereik worden afgekapt, ongeldige waarden krijgen de standaard
//   - dubbelklik op een schuif zet hem terug op de beginwaarde (data-pk-default)
//   - bewaker in de klankmotor: een niet-eindige of absurde uitvoer zet filters, galm en stemmen terug in plaats van
//     het apparaat voor altijd stil te laten; een bericht met een niet-eindige waarde wordt genegeerd.
//     Geluid in het normale gebied is bit-identiek met de vorige versie.
// Een procedurele omgevings- en drone-synth met acht lagen (regen, druppels, bubbels, wind, voetstappen, haardvuur, zee,
// gekraak) en stereogalm. Geen samples of externe afhankelijkheden. Triggers en CC via de eventingang.
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const finite = (v, fallback, a = 0, b = 1) => typeof v === 'number' && !Number.isNaN(v) ? clamp(v, a, b) : fallback;
const LAYERS = [
  ['rain', 'Regen', ['Motregen', 'Zachte regen', 'Stortregen', 'Op het raam', 'Op een dak', 'Op bladeren']],
  ['drops', 'Druppels', ['Waterdruppels', 'Grot', 'Lekke kraan', 'Op metaal']],
  ['bubbles', 'Bubbels', ['Water', 'Analoog bubbelbad', 'Diep onder water', 'Kokend water']],
  ['wind', 'Wind', ['Duinen', 'Bos', 'Sneeuwstorm', 'Rode planeet', 'Gasreus', 'Kosmische verbeelding']],
  ['steps', 'Voetstappen', ['Hout', 'Grind', 'Steen', 'Zand', 'Sneeuw', 'Metaal', 'Bladeren']],
  ['fire', 'Haardvuur', ['Open haard', 'Kampvuur', 'Sintels', 'Grote vlammen']],
  ['sea', 'Zee', ['Rustige zee', 'Branding', 'Kiezelstrand', 'Stormzee']],
  ['creaks', 'Gekraak', ['Takken', 'Planken', 'Touw', 'Scheepsromp']]
];
// Engelse teksten (de bron is Nederlands; zie tx in create)
const EN = {
  'Regen': 'Rain', 'Druppels': 'Drops', 'Bubbels': 'Bubbles', 'Voetstappen': 'Footsteps', 'Haardvuur': 'Fireplace', 'Zee': 'Sea', 'Gekraak': 'Creaks',
  'Motregen': 'Drizzle', 'Zachte regen': 'Soft rain', 'Stortregen': 'Downpour', 'Op het raam': 'On the window', 'Op een dak': 'On a roof', 'Op bladeren': 'On leaves',
  'Waterdruppels': 'Water drops', 'Grot': 'Cave', 'Lekke kraan': 'Dripping tap', 'Op metaal': 'On metal',
  'Analoog bubbelbad': 'Analog bubble bath', 'Diep onder water': 'Deep underwater', 'Kokend water': 'Boiling water',
  'Duinen': 'Dunes', 'Bos': 'Forest', 'Sneeuwstorm': 'Blizzard', 'Rode planeet': 'Red planet', 'Gasreus': 'Gas giant', 'Kosmische verbeelding': 'Cosmic imagination',
  'Hout': 'Wood', 'Grind': 'Gravel', 'Steen': 'Stone', 'Zand': 'Sand', 'Sneeuw': 'Snow', 'Metaal': 'Metal', 'Bladeren': 'Leaves',
  'Open haard': 'Fireplace', 'Kampvuur': 'Campfire', 'Sintels': 'Embers', 'Grote vlammen': 'Big flames',
  'Rustige zee': 'Calm sea', 'Branding': 'Surf', 'Kiezelstrand': 'Pebble beach', 'Stormzee': 'Stormy sea',
  'Takken': 'Branches', 'Planken': 'Planks', 'Touw': 'Rope', 'Scheepsromp': "Ship's hull",
  'Motregen in het bos': 'Drizzle in the forest', 'Stortregen op het dak': 'Downpour on the roof', 'Regen tegen het raam': 'Rain against the window',
  'Bladeren in de regen': 'Leaves in the rain', 'Druppels in een grot': 'Drops in a cave', 'Wind over de duinen': 'Wind over the dunes',
  'Kosmische droom': 'Cosmic dream', 'Over houten planken': 'Over wooden planks', 'Wandelen op grind': 'Walking on gravel', 'Stenen gang': 'Stone corridor',
  'Door het zand': 'Through the sand', 'Metalen loopbrug': 'Metal catwalk', 'Herfstwandeling': 'Autumn walk', 'Bij de open haard': 'By the fireplace',
  'Kampvuur aan zee': 'Campfire by the sea', 'Branding op het strand': 'Surf on the beach', 'Storm op zee': 'Storm at sea', 'Kraken van takken': 'Creaking branches',
  'Oude planken': 'Old planks', 'Gespannen touwen': 'Taut ropes', 'In het ruim': 'In the hold',
  'Uitgang': 'Output', 'Ruimte': 'Space', 'Stereobreedte': 'Stereo width', 'Breedte': 'Width', 'Voetstappen / minuut': 'Footsteps / minute',
  'Dichtheid': 'Density', 'Kleur': 'Tone', 'Beweging': 'Motion', 'Karakter': 'Character', 'Stappen/min': 'Steps/min', 'Klok': 'Clock',
  'Vrij tempo': 'Free tempo', 'Alleen triggers': 'Triggers only', 'Elke 1/16': 'Every 1/16', 'Elke 1/8': 'Every 1/8', 'Elke 1/4': 'Every 1/4', 'Elke 1/2': 'Every 1/2', 'Elke maat': 'Every bar',
  'Initialiseren…': 'Initializing…', 'Buffer-engine (extra bediening-/triggerlatentie ≤ circa 240 ms)': 'Buffer engine (extra control/trigger latency up to about 240 ms)',
  'aan': 'on', 'stil': 'silent', 'stappen via triggers': 'steps via triggers', 'stappen volgen de hostklok': 'steps follow the host clock', 'vrije stappen': 'free steps',
  'omgeving · textuur · drone': 'ambience · texture · drone', 'Soundscape kiezen': 'Choose soundscape', 'Kies een soundscape…': 'Choose a soundscape…',
  'Alle lagen uit': 'All layers off', 'Aan': 'On', 'Volg start/stop': 'Follow start/stop',
  'Meng de acht lagen. Dichtheid = activiteit, kleur = helderheid/hoogte, beweging = variatie. Ruimte voegt stereo-galm toe.': 'Mix the eight layers. Density = activity, tone = brightness/pitch, motion = variation. Space adds stereo reverb.',
  'Vrij: stappen/min. Klok: bij lopend transport. Alleen triggers: via events van een sequencer. Dichtheid = materiaalactiviteit.': 'Free: steps/min. Clock: while the transport runs. Triggers only: via events from a sequencer. Density = material activity.'
};
function defaults() {
  const layers = {};
  LAYERS.forEach(([id]) => { layers[id] = { level: 0, density: 0.45, tone: 0.5, motion: 0.5, variant: 0 }; });
  layers.rain.level = 0.55; layers.rain.variant = 1; layers.wind.level = 0.22;
  return { on: true, follow: false, master: 0.7, space: 0.14, width: 0.85, stepRate: 90, stepSync: 0, layers };
}
const SCENES = [
  ['Zachte regen', { rain: [0.8, 1, 0.4, 0.45, 0.4], wind: [0.16, 0, 0.3, 0.45, 0.4] }, 0.08],
  ['Motregen in het bos', { rain: [0.68, 0, 0.3, 0.62, 0.3], drops: [0.28, 0, 0.18, 0.6, 0.4], wind: [0.18, 1, 0.4, 0.35, 0.6] }, 0.16],
  ['Stortregen op het dak', { rain: [0.9, 2, 0.95, 0.55, 0.8], wind: [0.4, 2, 0.75, 0.45, 0.8], drops: [0.16, 3, 0.6, 0.6, 0.7] }, 0.12],
  ['Regen tegen het raam', { rain: [0.75, 3, 0.7, 0.36, 0.55], drops: [0.36, 0, 0.38, 0.45, 0.7] }, 0.22],
  ['Bladeren in de regen', { rain: [0.76, 5, 0.6, 0.65, 0.5], wind: [0.3, 1, 0.5, 0.5, 0.7], creaks: [0.2, 0, 0.2, 0.55, 0.6] }, 0.1],
  ['Druppels in een grot', { drops: [0.9, 1, 0.28, 0.35, 0.75], wind: [0.09, 0, 0.2, 0.15, 0.3] }, 0.7],
  ['Lekke kraan', { drops: [0.85, 2, 0.36, 0.62, 0.12] }, 0.23],
  ['Analoog bubbelbad', { bubbles: [0.9, 1, 0.62, 0.45, 0.8] }, 0.35],
  ['Diep onder water', { bubbles: [0.68, 2, 0.35, 0.12, 0.7], wind: [0.24, 4, 0.22, 0.12, 0.35] }, 0.6],
  ['Kokend water', { bubbles: [0.85, 3, 0.9, 0.72, 0.6] }, 0.08],
  ['Wind over de duinen', { wind: [0.9, 0, 0.5, 0.42, 0.7] }, 0.12],
  ['Sneeuwstorm', { wind: [0.88, 2, 0.85, 0.72, 0.8], steps: [0.43, 4, 0.5, 0.48, 0.35] }, 0.12, 62],
  ['Rode planeet', { wind: [0.85, 3, 0.6, 0.25, 0.8], creaks: [0.17, 2, 0.15, 0.24, 0.8] }, 0.5],
  ['Gasreus', { wind: [0.94, 4, 0.8, 0.18, 0.85], bubbles: [0.28, 2, 0.22, 0.16, 0.65] }, 0.62],
  ['Kosmische droom', { wind: [0.77, 5, 0.45, 0.3, 0.65], bubbles: [0.27, 1, 0.18, 0.7, 0.85], drops: [0.17, 1, 0.1, 0.25, 0.9] }, 0.8],
  ['Over houten planken', { steps: [0.9, 0, 0.5, 0.45, 0.25], creaks: [0.32, 1, 0.23, 0.45, 0.5] }, 0.26, 82],
  ['Wandelen op grind', { steps: [0.9, 1, 0.55, 0.65, 0.42], wind: [0.15, 0, 0.4, 0.4, 0.5] }, 0.08, 96],
  ['Stenen gang', { steps: [0.9, 2, 0.4, 0.65, 0.18], drops: [0.1, 1, 0.12, 0.4, 0.5] }, 0.68, 78],
  ['Door het zand', { steps: [0.9, 3, 0.6, 0.35, 0.4], wind: [0.27, 0, 0.4, 0.38, 0.65] }, 0.05, 72],
  ['Metalen loopbrug', { steps: [0.85, 5, 0.3, 0.65, 0.3], creaks: [0.2, 2, 0.18, 0.58, 0.6] }, 0.5, 104],
  ['Herfstwandeling', { steps: [0.8, 6, 0.7, 0.62, 0.6], wind: [0.32, 1, 0.5, 0.4, 0.65], creaks: [0.3, 0, 0.25, 0.6, 0.55] }, 0.12, 85],
  ['Bij de open haard', { fire: [0.9, 0, 0.5, 0.48, 0.4], creaks: [0.24, 1, 0.12, 0.38, 0.4] }, 0.25],
  ['Kampvuur aan zee', { fire: [0.75, 1, 0.7, 0.6, 0.6], sea: [0.5, 0, 0.4, 0.4, 0.5], wind: [0.12, 0, 0.3, 0.35, 0.6] }, 0.09],
  ['Sintels', { fire: [0.88, 2, 0.2, 0.24, 0.3] }, 0.22],
  ['Rustige zee', { sea: [0.9, 0, 0.3, 0.42, 0.4], wind: [0.16, 0, 0.3, 0.3, 0.4] }, 0.12],
  ['Branding op het strand', { sea: [0.94, 1, 0.65, 0.6, 0.65], wind: [0.22, 0, 0.45, 0.5, 0.6] }, 0.12],
  ['Kiezelstrand', { sea: [0.88, 2, 0.6, 0.6, 0.65], drops: [0.12, 3, 0.5, 0.45, 0.8] }, 0.1],
  ['Storm op zee', { sea: [0.88, 3, 0.9, 0.48, 0.9], wind: [0.65, 2, 0.85, 0.65, 0.85], creaks: [0.23, 3, 0.4, 0.3, 0.8] }, 0.27],
  ['Kraken van takken', { creaks: [0.95, 0, 0.56, 0.62, 0.6], wind: [0.12, 1, 0.4, 0.35, 0.5] }, 0.18],
  ['Oude planken', { creaks: [0.92, 1, 0.4, 0.38, 0.65] }, 0.32],
  ['Gespannen touwen', { creaks: [0.9, 2, 0.4, 0.58, 0.75] }, 0.3],
  ['In het ruim', { creaks: [0.75, 3, 0.55, 0.3, 0.75], sea: [0.35, 1, 0.55, 0.22, 0.5], wind: [0.14, 0, 0.4, 0.15, 0.5] }, 0.65]
];
function scene(index) {
  const s = defaults(), entry = SCENES[index];
  LAYERS.forEach(([id]) => { s.layers[id].level = 0; });
  for (const id of Object.keys(entry[1])) { const [level, variant, density, tone, motion] = entry[1][id]; s.layers[id] = { level, variant, density, tone, motion }; }
  s.space = entry[2]; s.stepRate = entry[3] || 90; return s;
}
function normalize(s) {
  const d = defaults(); s = s && typeof s === 'object' ? s : {};
  for (const k of ['on', 'follow']) d[k] = typeof s[k] === 'boolean' ? s[k] : d[k];
  for (const k of ['master', 'space', 'width']) d[k] = finite(s[k], d[k]);
  d.stepRate = finite(s.stepRate, d.stepRate, 20, 240);
  d.stepSync = [-1, 0, 1, 2, 4, 8, 16].includes(s.stepSync) ? s.stepSync : 0;
  LAYERS.forEach(([id, , variants]) => {
    const p = s.layers && s.layers[id] || {};
    for (const k of ['level', 'density', 'tone', 'motion']) d.layers[id][k] = finite(p[k], d.layers[id][k]);
    d.layers[id].variant = Number.isInteger(p.variant) && p.variant >= 0 && p.variant < variants.length ? p.variant : d.layers[id].variant;
  });
  return d;
}

// Dezelfde DSP-kern draait in de worklet en in de buffer-terugval.
// PRNG, filters, stemmen en galmstaarten leven per instance; geen gedeelde samplelussen.
class BiotopeEngine {
  constructor(sr, seed = 318771) {
    this.sr = sr; this.seed = seed >>> 0 || 1; this.time = 0; this.tick = 0; this.events = []; this.dead = false;
    this.target = null; this.wake = new Uint8Array(8); this.level = new Float64Array(8); this.smooth = 1 - Math.exp(-1 / (sr * 0.12));
    this.settings = Array.from({ length: 8 }, () => ({ density: .45, tone: .5, motion: .5, variant: 0 }));
    this.filters = Array.from({ length: 8 }, () => new Float64Array(6));
    this.voices = Array.from({ length: 96 }, () => ({ remaining: 0 }));
    this.c = new Float64Array(16); this.phase = new Float64Array(8); this.stepLeft = 0; this.foot = 0; this.dripLeft = .4;
    this.swell = .5; this.gust = .5; this.swellSlow = .5; this.gustSlow = .5;
    this.texture = { rainWeight: .55, rainRumble: .3, windLow: 0, windForest: 0, windDrone: 0, windHz: 42, fireWeight: 1, seaWeight: .6, seaRumble: 1.1 }; this.space = 0; this.width = .85; this.prevIn = [0, 0]; this.prevOut = [0, 0];
    this.combs = Array.from({ length: 8 }, (_, i) => ({ data: new Float32Array(Math.round(sr * ([.0297, .0371, .0411, .0437][i % 4] + (i > 3 ? .0019 : 0)))), pos: 0, low: 0 }));
    this.allpass = Array.from({ length: 4 }, (_, i) => ({ data: new Float32Array(Math.round(sr * (i % 2 ? .0017 : .005) + (i > 1 ? 17 : 0))), pos: 0 }));
  }
  random() { let x = this.seed; x ^= x << 13; x ^= x >>> 17; x ^= x << 5; this.seed = x >>> 0; return this.seed / 4294967296; }
  noise() { return this.random() * 2 - 1; }
  // Een bericht met een niet-eindige waarde wordt genegeerd.
  valid(s) {
    if (!s || !Array.isArray(s.layers) || s.layers.length !== 8) return false;
    if (![s.space, s.width, s.stepRate].every(Number.isFinite)) return false;
    return s.layers.every(p => p && [p.level, p.density, p.tone, p.motion, p.variant].every(Number.isFinite));
  }
  // Bewaker: zet alle toestand terug (filters, galm, stemmen, fasen) als de uitvoer niet eindig of absurd is.
  recover() {
    for (const f of this.filters) f.fill(0);
    for (const v of this.voices) v.remaining = 0;
    for (const c of this.combs) { c.data.fill(0); c.pos = 0; c.low = 0; }
    for (const a of this.allpass) { a.data.fill(0); a.pos = 0; }
    this.c.fill(0); this.phase.fill(0); this.level.fill(0); this.prevIn.fill(0); this.prevOut.fill(0);
    this.swell = this.gust = this.swellSlow = this.gustSlow = .5; this.stepLeft = 0; this.dripLeft = .4; this.space = 0; this.width = .85;
    this.texture = { rainWeight: .55, rainRumble: .3, windLow: 0, windForest: 0, windDrone: 0, windHz: 42, fireWeight: 1, seaWeight: .6, seaRumble: 1.1 };
    this.settings.forEach(p => { p.density = .45; p.tone = .5; p.motion = .5; p.variant = 0; });
  }
  set(s) { if (!this.valid(s)) return; for (let j = 0; j < 8; j++) if (s.layers[j].level > .0001 && (!this.target || this.target.layers[j].level <= .0001)) this.wake[j] = 1; this.target = s; }
  event(e) { if (Number.isFinite(e.time) && this.events.length < 256) { this.events.push(e); this.events.sort((a, b) => a.time - b.time); } }
  spawn(layer, kind, f, seconds, amp, pan, noise, glide = 1, delay = 0) {
    let voice = null;
    for (const v of this.voices) if (v.remaining <= 0) { voice = v; break; }
    if (!voice) return; // Bij extreme dichtheid geen spelende stem afkappen.
    const duration = Math.max(16, Math.round(seconds * this.sr));
    Object.assign(voice, { layer, kind, f, duration, remaining: duration, amp, phase: 0, low: 0,
      noise, glide: Math.pow(glide, 1 / duration), delay: Math.round(delay * this.sr),
      cut: Math.min(.85, (kind === 2 ? .12 : .28) + f / this.sr),
      left: Math.cos((pan + 1) * Math.PI / 4), right: Math.sin((pan + 1) * Math.PI / 4) });
  }
  droplet(layer = 1, force = 1) {
    const p = this.settings[layer], v = p.variant, r = this.random();
    const f = (layer === 0 ? [1700, 1700, 1300, 1050, 2600, 3100][v] : v === 1 ? 420 : v === 3 ? 2000 : 1000) * (.5 + p.tone * 1.7) * (.65 + r * .8);
    this.spawn(layer, 0, f, v === 1 ? .3 : .055 + p.motion * .12, (.12 + r * .16) * force, this.noise() * p.motion, layer === 0 ? [0.2, 0.15, 0.3, 0.2, 0.65, 0.85][v] : v === 3 ? .5 : .08, .48);
  }
  bubble(force = 1) {
    const p = this.settings[2], r = this.random(), deep = p.variant === 2, analog = p.variant === 1;
    this.spawn(2, 1, (deep ? 48 : analog ? 110 : 220) * (.5 + p.tone * 2.5) * (.6 + r),
      (deep ? .35 : .08) + p.motion * .18, (.18 + r * .22) * force, this.noise() * .8, .025, analog ? 4.5 : 2.2);
  }
  footstep(force = 1) {
    const p = this.settings[4], material = p.variant, side = (this.foot++ % 2 ? .28 : -.28) * (.25 + p.motion);
    const freqs = [115, 72, 165, 60, 95, 270, 80], noise = [.2, .94, .3, .85, .9, .22, .96][material];
    const duration = [.19, .23, .13, .25, .29, .3, .28][material];
    this.spawn(4, 2, freqs[material] * (.65 + p.tone), duration, (.44 + .28 * p.density) * force, side, noise, .62);
    this.spawn(4, 2, freqs[material] * 1.7, duration * .7, (.08 + .24 * p.density) * force, side, noise, .72, .085);
    if ([1, 3, 4, 6].includes(material)) for (let i = 0; i < 3 + Math.floor(p.density * 6); i++)
      this.spawn(4, 3, 800 + this.random() * (700 + 3800 * p.tone), .018 + this.random() * .065,
        .055 * force, side + this.noise() * .15, .9, .8, this.random() * duration);
    if (material === 0 || material === 5) this.spawn(4, 0, (material === 5 ? 950 : 310) * (.6 + p.tone), .24, .07 * force, side, .05, .94, .013);
  }
  crack(layer = 5, force = 1) {
    const p = this.settings[layer], r = this.random();
    if (layer === 5) force *= p.variant === 2 ? .45 : p.variant === 3 ? 1.2 : 1;
    this.spawn(layer, 3, (300 + r * 2800) * (.3 + p.tone), .012 + r * .09 * (.3 + p.motion), (.1 + r * .4) * force, this.noise() * (.1 + .8 * p.motion), .8, .7);
  }
  creak(force = 1) {
    const p = this.settings[7], rope = p.variant === 2, branch = p.variant === 0, hull = p.variant === 3;
    this.spawn(7, 4, (rope ? 650 : hull ? 60 : 130) * (.55 + p.tone * 2) * (.65 + this.random() * .7),
      (branch ? .25 : .7) + p.motion * (hull ? 3.5 : 1.5), .25 * force, this.noise() * .7, rope ? .22 : .5, .5 + this.random() * 1.3);
    if (branch) for (let i = 0; i < 3; i++) this.spawn(7, 3, 600 + this.random() * 1400, .025 + this.random() * .06, .18 * force, this.noise() * .7, .9, .6, .03 + i * .08);
  }
  control() {
    const dt = 64 / this.sr, s = this.target, blend = 1 - Math.exp(-dt / .16);
    for (let j = 0; j < 8; j++) {
      const p = this.settings[j], target = s.layers[j];
      p.density += (target.density - p.density) * blend; p.tone += (target.tone - p.tone) * blend; p.motion += (target.motion - p.motion) * blend;
      p.variant = target.variant;
      const colorFactor = j === 3 ? [1, 1.25, 1.8, .35, .2, .5][p.variant] : j === 0 ? [1.2, 1, 1, .48, .85, 1.5][p.variant] : 1;
      const coefficient = 1 - Math.exp(-2 * Math.PI * (120 + p.tone * p.tone * 12000) * colorFactor / this.sr);
      const lowCoefficient = 1 - Math.exp(-2 * Math.PI * (25 + p.tone * 190) / this.sr);
      this.c[j * 2] += (coefficient - this.c[j * 2]) * blend; this.c[j * 2 + 1] += (lowCoefficient - this.c[j * 2 + 1]) * blend;
    }
    const rain = this.settings[0].variant, w = this.settings[3].variant, fire = this.settings[5].variant, seaKind = this.settings[6].variant;
    const texture = { rainWeight: [.36, .55, 1.1, .48, .72, .48][rain], rainRumble: rain === 2 ? 1.4 : .3, windLow: w >= 3 ? 1 : 0, windForest: w === 1 ? 1 : 0, windDrone: w >= 3 ? 1 : 0, windHz: w === 5 ? 53 : w === 4 ? 29 : 42, fireWeight: fire === 2 ? .25 : fire === 3 ? 1.4 : 1, seaWeight: seaKind === 0 ? .6 : 1, seaRumble: seaKind === 3 ? 3.4 : 1.1 };
    for (const k of Object.keys(texture)) this.texture[k] += (texture[k] - this.texture[k]) * blend;
    this.space += (s.space - this.space) * .02; this.width += (s.width - this.width) * .02;
    const wind = this.settings[3], sea = this.settings[6];
    this.phase[0] += dt * (.025 + wind.motion * .15); this.phase[1] += dt * (.02 + sea.density * .13);
    this.gust = .5 + .28 * Math.sin(this.phase[0] * 6.283) + .18 * Math.sin(this.phase[0] * 10.731 + 1.3);
    this.swell = .5 + .35 * Math.sin(this.phase[1] * 6.283) + .13 * Math.sin(this.phase[1] * 8.54 + .7);
    if (this.wake[1]) this.droplet(); if (this.wake[2]) this.bubble(); if (this.wake[5]) this.crack(); if (this.wake[7]) this.creak(); this.wake.fill(0);
    if (s.layers[0].level > .0001 && this.random() < (.5 + 42 * this.settings[0].density ** 2) * dt) this.droplet(0, this.settings[0].variant < 2 ? .45 : .85);
    if (s.layers[1].level > .0001) {
      const p = this.settings[1];
      if (p.variant === 2) { this.dripLeft -= dt; if (this.dripLeft <= 0) { this.droplet(); this.dripLeft += 2.4 / (.3 + p.density * 5) * (1 + this.noise() * p.motion * .08); } }
      else if (this.random() < (.18 + p.density ** 2 * 13) * dt) this.droplet();
    }
    if (s.layers[2].level > .0001 && this.random() < (.5 + this.settings[2].density ** 2 * (this.settings[2].variant === 3 ? 65 : 23)) * dt) this.bubble();
    if (s.layers[4].level > .0001 && !s.stepSync) {
      this.stepLeft -= dt;
      if (this.stepLeft <= 0) { this.footstep(.8 + .2 * this.random()); this.stepLeft += 60 / s.stepRate * (1 + this.noise() * this.settings[4].motion * .13); }
    }
    if (s.layers[5].level > .0001 && this.random() < (.6 + this.settings[5].density ** 2 * 24) * dt) this.crack();
    if (s.layers[7].level > .0001 && this.random() < (.07 + this.settings[7].density ** 2 * 3) * dt) this.creak();
    if (s.layers[6].level > .0001 && this.settings[6].variant === 2 && this.random() < this.swell * sea.density * 28 * dt) this.crack(6, .22);
  }
  render(left, right, startTime) {
    if (!this.target || this.dead) { left.fill(0); right.fill(0); return; }
    let s = this.target; const sr = this.sr;
    for (let i = 0; i < left.length; i++) {
      const t = startTime + i / sr;
      while (this.events.length && this.events[0].time <= t) {
        const ev = this.events.shift();
        if (ev.kind === 'state') { this.set(ev.state); s = this.target; }
        else if (ev.layer === 4) this.footstep(ev.vel); else if (ev.layer === 1) this.droplet(1, ev.vel); else if (ev.layer === 2) this.bubble(ev.vel); else if (ev.layer === 5) this.crack(5, ev.vel); else if (ev.layer === 7) this.creak(ev.vel);
      }
      if (!(this.tick++ % 64)) this.control();
      this.gustSlow += (this.gust - this.gustSlow) * .002; this.swellSlow += (this.swell - this.swellSlow) * .002;
      const texture = this.texture, gust = this.gustSlow, swell = this.swellSlow;
      let l = 0, r = 0;
      for (let j = 0; j < 8; j++) {
        this.level[j] += (s.layers[j].level - this.level[j]) * this.smooth;
        if (this.level[j] < 1e-6 || (j === 1 || j === 2 || j === 4 || j === 7)) continue;
        const p = this.settings[j], f = this.filters[j], coefficient = this.c[j * 2], lowCoefficient = this.c[j * 2 + 1];
        for (let ch = 0; ch < 2; ch++) {
          const n = this.noise(), q = ch * 3;
          f[q] += coefficient * (n - f[q]); f[q + 1] += lowCoefficient * (n - f[q + 1]); f[q + 2] += .0015 * (n - f[q + 2]);
          let v = 0;
          if (j === 0) { // Regen: continue ruisbodem + losse aanslagen.
            v = ((f[q] - f[q + 1]) * .5 + f[q + 1] * texture.rainRumble) * texture.rainWeight * (.3 + p.density) * (1 + .17 * p.motion * gust);
          } else if (j === 3) {
            const natural = (f[q] - f[q + 1]) * .4 + f[q + 1] * 1.8;
            const alien = f[q + 1] * 2.5 + f[q + 2] * 3;
            v = (natural * (1 - texture.windLow) + alien * texture.windLow) * (.22 + gust * (.3 + p.motion)) * (.6 + p.density);
            v += (f[q] - f[q + 1]) * .12 * gust * texture.windForest;
            this.phase[2 + ch] += texture.windHz * (ch ? 1.006 : 1) / sr; if (this.phase[2 + ch] > 1) this.phase[2 + ch] -= 1;
            v += .07 * Math.sin(6.283185307179586 * this.phase[2 + ch]) * (.3 + gust) * texture.windDrone;
          } else if (j === 5) {
            v = (f[q + 1] * 1.2 + (f[q] - f[q + 1]) * .08) * (.15 + p.density * .4) * texture.fireWeight * (.7 + gust * .3);
          } else if (j === 6) {
            const wave = .12 + swell * swell * (.4 + p.motion * .9);
            v = ((f[q] - f[q + 1]) * (.28 + swell * .5) + f[q + 1] * texture.seaRumble) * wave * (.65 + p.density) * texture.seaWeight;
          }
          if (ch) r += v * this.level[j]; else l += v * this.level[j];
        }
      }
      for (const v of this.voices) {
        if (v.remaining <= 0) continue;
        if (v.delay > 0) { v.delay--; continue; }
        const progress = 1 - v.remaining / v.duration;
        const env = Math.min(1, progress * (v.kind === 4 ? 12 : 55)) * (1 - progress) ** (v.kind === 4 ? 1.6 : 3);
        const n = this.noise(); v.low += v.cut * (n - v.low);
        v.phase += 6.283185307179586 * v.f / sr; if (v.phase > 6.283185307179586) v.phase -= 6.283185307179586;
        const tonal = Math.sin(v.phase);
        let sound;
        if (v.kind === 3) sound = (n - v.low) * .8 + tonal * .12;
        else if (v.kind === 4) sound = (tonal + .3 * Math.sin(v.phase * 3)) * (.5 + .5 * Math.sin(progress * 90 + Math.sin(progress * 17))) * (1 - v.noise) + v.low * v.noise;
        else sound = tonal * (1 - v.noise) + (v.kind === 2 ? v.low : n - v.low) * v.noise;
        const sample = sound * env * v.amp * this.level[v.layer];
        l += sample * v.left; r += sample * v.right; v.f *= v.glide; v.remaining--;
      }
      let wetL = 0, wetR = 0;
      for (let j = 0; j < 8; j++) {
        const c = this.combs[j], out = c.data[c.pos]; c.low += .27 * (out - c.low);
        c.data[c.pos] = (j < 4 ? l : r) * .25 + c.low * .79;
        c.pos++; if (c.pos === c.data.length) c.pos = 0;
        if (j < 4) wetL += out; else wetR += out;
      }
      for (let j = 0; j < 4; j++) {
        const ap = this.allpass[j], x = j < 2 ? wetL : wetR, delayed = ap.data[ap.pos], y = delayed - x * .5;
        ap.data[ap.pos] = x + delayed * .5; ap.pos++; if (ap.pos === ap.data.length) ap.pos = 0;
        if (j < 2) wetL = y; else wetR = y;
      }
      l = l * (1 - .4 * this.space) + wetL * this.space * .6;
      r = r * (1 - .4 * this.space) + wetR * this.space * .6;
      const mid = (l + r) * .5, side = (l - r) * this.width;
      l = mid + side; r = mid - side;
      let dl = l - this.prevIn[0] + .9975 * this.prevOut[0], dr = r - this.prevIn[1] + .9975 * this.prevOut[1];
      if (!(Math.abs(dl) < 1e6 && Math.abs(dr) < 1e6)) { this.recover(); l = r = dl = dr = 0; }
      this.prevIn[0] = l; this.prevIn[1] = r; this.prevOut[0] = dl; this.prevOut[1] = dr;
      left[i] = .85 * dl / (1 + Math.abs(dl)); right[i] = .85 * dr / (1 + Math.abs(dr));
    }
    this.time = startTime + left.length / sr;
  }
}

const WNAME = 'nl-patchkamer-biotope-1-11-0';
const WORKLET = `${BiotopeEngine.toString()}
class BiotopeProcessor extends AudioWorkletProcessor {
  constructor() { super(); this.engine = new BiotopeEngine(sampleRate, Math.floor(Math.random()*2147483647)+1); this.alive = true;
    this.port.onmessage = ({data}) => { if(data.type==='state') this.engine.set(data.state); else if(data.type==='event') this.engine.event(data.event); else if(data.type==='stop') { this.alive=false; this.engine.dead=true; } }; }
  process(inputs, outputs) { const out=outputs[0]; if(out && out[0]) this.engine.render(out[0], out[1]||out[0], currentTime); return this.alive; }
}
registerProcessor('${WNAME}', BiotopeProcessor);`;

export default {
  id: 'nl.patchkamer.biotope', name: 'Biotope', version: '1.11.0', kind: 'instrument', category: 'synth',
  ui: { width: 760, minWidth: 300 },
  ports: { audioIn: [], audioOut: [{ id: 'out', name: 'Stereo out' }], eventIn: [{ id: 'events', name: 'Triggers / CC' }], eventOut: [], modIn: [], modOut: [], multiIn: [], multiOut: [] },
  i18n: { nl: { ports: { out: 'Stereo uit' } } },
  create(ctx, host) {
    const tx = (k, ...a) => { let t = host.lang === 'nl' ? k : (EN[k] ?? k); a.forEach((v, i) => { t = t.replace('{' + i + '}', v); }); return t; };
    let state = defaults(), dead = false, worklet = null, fallback = null, timer = null, nextTime = 0, transported = false;
    let container = null, status = null, sceneSelect = null, controls = [], engineLabel = 'Initialiseren…';
    let offsets = {}, effective, controllerGeneration = 0;
    const pending = [], sources = new Set();
    const out = ctx.createGain(); out.gain.value = 0;
    const paramList = [
      { id: 'master', name: tx('Uitgang'), min: 0, max: 1, lane: 'global', laneName: 'Biotope', role: 'level' },
      { id: 'space', name: tx('Ruimte'), min: 0, max: 1, lane: 'global', laneName: 'Biotope', role: 'depth' },
      { id: 'width', name: tx('Stereobreedte'), min: 0, max: 1, lane: 'global', laneName: 'Biotope', role: 'depth' },
      { id: 'stepRate', name: tx('Voetstappen / minuut'), min: 20, max: 240, lane: 'steps', laneName: tx('Voetstappen'), role: 'rate' }
    ];
    LAYERS.forEach(([id, name]) => ['level', 'density', 'tone', 'motion'].forEach(k => paramList.push({ id: id + '_' + k, name: tx(({ level: 'Volume', density: 'Dichtheid', tone: 'Kleur', motion: 'Beweging' })[k]), min: 0, max: 1, lane: id, laneName: tx(name), role: k === 'level' ? 'level' : k === 'tone' ? 'tone' : k === 'density' ? 'rate' : 'depth' })));
    function updateStatus() { if (status) status.textContent = tx(engineLabel) + ' · ' + tx(state.on && (!state.follow || transported) ? 'aan' : 'stil') + ' · ' + tx(state.stepSync === -1 ? 'stappen via triggers' : state.stepSync > 0 ? 'stappen volgen de hostklok' : 'vrije stappen'); }
    function syncUI() {
      controls.forEach(c => { const v = c.layer ? state.layers[c.layer][c.key] : state[c.key]; if (c.type === 'check') c.el.checked = v; else c.el.value = String(v); if (c.value) c.value.textContent = c.format(v); });
      updateStatus();
      if (sceneSelect) sceneSelect.value = '';
    }
    function apply(atTime = ctx.currentTime) {
      if (dead) return;
      const layers = LAYERS.map(([id]) => { const p = { ...state.layers[id] }; for (const k of ['level', 'density', 'tone', 'motion']) p[k] = clamp(p[k] + (offsets[id + '_' + k] || 0), 0, 1); return p; });
      effective = { layers, space: clamp(state.space + (offsets.space || 0), 0, 1), width: clamp(state.width + (offsets.width || 0), 0, 1), stepRate: clamp(state.stepRate + (offsets.stepRate || 0) * 220, 20, 240), stepSync: state.stepSync };
      const gain = state.on && (!state.follow || transported) ? clamp(state.master + (offsets.master || 0), 0, 1) : 0;
      const time = Number.isFinite(atTime) ? Math.max(ctx.currentTime, atTime) : ctx.currentTime;
      out.gain.setTargetAtTime(gain, time, .08);
      if (time > ctx.currentTime) {
        const event = { kind: 'state', state: effective, time };
        if (worklet) worklet.port.postMessage({ type: 'event', event }); else if (fallback) fallback.event(event); else if (pending.length < 256) pending.push(event);
      } else {
        if (worklet) worklet.port.postMessage({ type: 'state', state: effective });
        if (fallback) fallback.set(effective);
      }
      updateStatus();
    }
    function sendEvent(layer, vel, time) {
      if (dead || !Number.isFinite(time)) return;
      const event = { layer, vel: clamp(vel, 0, 1), time: Math.max(ctx.currentTime, time) };
      if (worklet) worklet.port.postMessage({ type: 'event', event }); else if (fallback) fallback.event(event); else if (pending.length < 256) pending.push(event);
    }
    // Terugval voor oudere hosts: dezelfde DSP in aaneengesloten audiobuffers.
    // setInterval houdt alleen de voorraad gevuld; alle starttijden gebruiken de audioklok.
    function pump() {
      if (dead || !fallback || ctx.state === 'closed') return;
      if (ctx.state === 'suspended') return;
      const now = ctx.currentTime, frames = Math.round(ctx.sampleRate * .08), duration = frames / ctx.sampleRate;
      if (nextTime < now) nextTime = now + .015;
      let count = 0;
      while (nextTime < now + .16 && count++ < 4) {
        const buffer = ctx.createBuffer(2, frames, ctx.sampleRate);
        fallback.render(buffer.getChannelData(0), buffer.getChannelData(1), nextTime);
        const source = ctx.createBufferSource(); source.buffer = buffer; source.connect(out); sources.add(source);
        source.onended = () => { sources.delete(source); source.disconnect(); };
        source.start(nextTime); source.stop(nextTime + duration); nextTime += duration;
      }
    }
    function startFallback() {
      if (dead) return;
      fallback = new BiotopeEngine(ctx.sampleRate, Math.floor(Math.random() * 2147483647) + 1); fallback.set(effective);
      pending.splice(0).forEach(e => fallback.event(e));
      engineLabel = 'Buffer-engine (extra bediening-/triggerlatentie ≤ circa 240 ms)'; updateStatus();
      nextTime = ctx.currentTime + .02; pump(); timer = setInterval(pump, 35);
    }
    apply();
    const generation = ++controllerGeneration;
    if (typeof host.loadWorklet === 'function' && typeof AudioWorkletNode === 'function') {
      Promise.resolve().then(() => host.loadWorklet(WNAME, WORKLET)).then(loaded => {
        if (dead || generation !== controllerGeneration) return;
        if (loaded === false) { startFallback(); return; }
        try {
          worklet = new AudioWorkletNode(ctx, WNAME, { numberOfInputs: 0, numberOfOutputs: 1, outputChannelCount: [2] });
          worklet.connect(out); worklet.port.postMessage({ type: 'state', state: effective });
          pending.splice(0).forEach(event => worklet.port.postMessage({ type: 'event', event }));
          worklet.onprocessorerror = () => { if (dead || !worklet) return; worklet.onprocessorerror = null; worklet.disconnect(); worklet.port.close(); worklet = null; startFallback(); };
          engineLabel = 'AudioWorklet-engine'; updateStatus();
        } catch (_) { if (worklet) { worklet.disconnect(); worklet.port.close(); worklet = null; } startFallback(); }
      }).catch(() => { if (!dead) startFallback(); });
    } else startFallback();
    function unmount() { if (container) container.remove(); container = status = sceneSelect = null; controls = []; }
    return {
      inputs: {}, outputs: { out },
      mount(el) {
        if (dead) return; unmount(); container = document.createElement('div'); el.appendChild(container);
        const shadow = container.attachShadow({ mode: 'open' });
        const style = document.createElement('style'); style.textContent = `
          :host{display:block;min-width:0;color:var(--fg);font:12px var(--mono,monospace)}
          *{box-sizing:border-box} .head,.bar{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
          .head{padding:8px 0}.title{font:700 18px var(--disp, sans-serif);letter-spacing:.08em}
          .hint{color:var(--muted);font-size:11px;line-height:1.5}.layers{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,280px),1fr));gap:8px;margin:10px 0}
          .layer{min-width:0;border:1px solid var(--line);border-radius:6px;background:var(--card-2);padding:10px}
          .layer h3{font:700 14px var(--disp,sans-serif);margin:0 0 8px}.global{padding:10px;border:1px solid var(--line);border-radius:6px;background:var(--well)}
          label.row{display:grid;grid-template-columns:88px minmax(40px,1fr) 43px;gap:7px;align-items:center;margin:6px 0}
          label.choice{display:flex;gap:7px;align-items:center;flex-wrap:wrap;margin:5px 0} select{min-width:0;max-width:100%;flex:1}
          select,button{color:var(--field-fg,var(--fg));background:var(--field,var(--well));border:1px solid var(--line);border-radius:4px;font:inherit;padding:4px}
          button{cursor:pointer}input[type=range]{width:100%;min-width:0;accent-color:var(--audio)} input[type=checkbox]{accent-color:var(--audio)}
          output{text-align:right;color:var(--audio);font-size:11px}.status{color:var(--muted);font-size:10px;margin-top:8px;overflow-wrap:anywhere}
        `; shadow.appendChild(style);
        function make(tag, text, parent, className) { const e = document.createElement(tag); if (text) e.textContent = text; if (className) e.className = className; if (parent) parent.appendChild(e); return e; }
        function change(layer, key, value) { if (layer) state.layers[layer][key] = value; else state[key] = value; apply(); syncUI(); }
        function slider(parent, layer, key, title, min = 0, max = 1, step = .01, format = v => Math.round(v * 100) + '%') {
          const dflt = layer ? defaults().layers[layer][key] : defaults()[key];
          const label = make('label', null, parent, 'row'); make('span', tx(title), label);
          const input = make('input', null, label); input.type = 'range'; input.min = min; input.max = max; input.step = step; input.value = String(dflt); input.dataset.pkDefault = String(dflt);
          input.setAttribute('aria-label', (layer ? tx(LAYERS.find(x => x[0] === layer)[1]) + ' ' : '') + tx(title));
          const value = make('output', null, label); input.oninput = () => change(layer, key, Number(input.value));
          input.addEventListener('pointerdown', e => e.stopPropagation()); controls.push({ el: input, type: 'range', layer, key, value, format });
        }
        function select(parent, layer, key, title, options) {
          const label = make('label', null, parent, 'choice'); make('span', tx(title), label); const input = make('select', null, label);
          options.forEach(([v, name]) => { const o = make('option', tx(name), input); o.value = String(v); });
          input.onchange = () => change(layer, key, Number(input.value)); input.addEventListener('pointerdown', e => e.stopPropagation());
          controls.push({ el: input, type: 'select', layer, key }); return input;
        }
        function check(parent, key, title) {
          const label = make('label', null, parent, 'choice'), input = make('input', null, label); input.type = 'checkbox'; make('span', tx(title), label);
          input.onchange = () => change(null, key, input.checked); input.addEventListener('pointerdown', e => e.stopPropagation()); controls.push({ el: input, type: 'check', key });
        }
        const header = make('div', null, shadow, 'head'); make('span', 'BIOTOPE', header, 'title'); make('span', tx('omgeving · textuur · drone'), header, 'hint');
        const bar = make('div', null, shadow, 'bar'); sceneSelect = make('select', null, bar); sceneSelect.setAttribute('aria-label', tx('Soundscape kiezen'));
        const empty = make('option', tx('Kies een soundscape…'), sceneSelect); empty.value = '';
        SCENES.forEach((entry, i) => { const option = make('option', tx(entry[0]), sceneSelect); option.value = String(i); });
        sceneSelect.onchange = () => { if (sceneSelect.value !== '') { state = scene(Number(sceneSelect.value)); apply(); syncUI(); } };
        sceneSelect.addEventListener('pointerdown', e => e.stopPropagation());
        const silence = make('button', tx('Alle lagen uit'), bar); silence.type = 'button'; silence.onclick = () => { LAYERS.forEach(([id]) => { state.layers[id].level = 0; }); apply(); syncUI(); };
        check(bar, 'on', 'Aan'); check(bar, 'follow', 'Volg start/stop');
        make('div', tx('Meng de acht lagen. Dichtheid = activiteit, kleur = helderheid/hoogte, beweging = variatie. Ruimte voegt stereo-galm toe.'), shadow, 'hint');
        const global = make('div', null, shadow, 'global'); slider(global, null, 'master', 'Uitgang'); slider(global, null, 'space', 'Ruimte'); slider(global, null, 'width', 'Breedte');
        const grid = make('div', null, shadow, 'layers');
        LAYERS.forEach(([id, name, variants]) => {
          const card = make('section', null, grid, 'layer'); make('h3', tx(name), card);
          select(card, id, 'variant', 'Karakter', variants.map((name, i) => [i, name]));
          slider(card, id, 'level', 'Volume'); slider(card, id, 'density', 'Dichtheid'); slider(card, id, 'tone', 'Kleur'); slider(card, id, 'motion', 'Beweging');
          if (id === 'steps') { slider(card, null, 'stepRate', 'Stappen/min', 20, 240, 1, v => Math.round(v));
            select(card, null, 'stepSync', 'Klok', [[0, 'Vrij tempo'], [-1, 'Alleen triggers'], [1, 'Elke 1/16'], [2, 'Elke 1/8'], [4, 'Elke 1/4'], [8, 'Elke 1/2'], [16, 'Elke maat']]);
            make('div', tx('Vrij: stappen/min. Klok: bij lopend transport. Alleen triggers: via events van een sequencer. Dichtheid = materiaalactiviteit.'), card, 'hint'); }
        });
        status = make('div', null, shadow, 'status'); syncUI();
      },
      unmount,
      getState() { return JSON.parse(JSON.stringify(state)); },
      setState(s) { state = normalize(s); apply(); syncUI(); },
      params() { return paramList.map(p => ({ ...p, scale: 'lin', drift: .15, on: true, fast: false })); },
      modulate(o) { offsets = {}; for (const p of paramList) { const v = o && o[p.id]; if (typeof v === 'number' && Number.isFinite(v)) offsets[p.id] = clamp(v, -1, 1); } apply(); },
      onStep(info) {
        if (dead || !info || !Number.isFinite(info.time)) return;
        if (!transported) { transported = true; apply(); }
        if (state.stepSync > 0 && Number.isInteger(info.step) && info.step % state.stepSync === 0 && effective.layers[4].level > 0) sendEvent(4, .9, info.time);
      },
      onTransport(info) { if (dead) return; transported = !!(info && info.playing); apply(); },
      onEvent(port, ev) {
        if (dead || port !== 'events' || !ev) return;
        if (ev.type === 'cc' && typeof ev.id === 'string' && typeof ev.value === 'number' && Number.isFinite(ev.value)) {
          const p = paramList.find(p => p.id === ev.id); if (!p) return;
          const value = p.min + clamp(ev.value, 0, 1) * (p.max - p.min);
          const split = ev.id.lastIndexOf('_');
          if (split > 0) state.layers[ev.id.slice(0, split)][ev.id.slice(split + 1)] = value; else state[ev.id] = value;
          apply(ev.time); syncUI(); return;
        }
        if (ev.type !== 'trig' && ev.type !== 'note') return;
        const layer = { drops: 1, bubbles: 2, steps: 4, fire: 5, creaks: 7 }[ev.lane || 'steps'];
        if (layer === undefined) return;
        sendEvent(layer, finite(ev.vel, .8), Number.isFinite(ev.time) ? ev.time : ctx.currentTime);
      },
      destroy() {
        if (dead) return; dead = true; controllerGeneration++; unmount(); if (timer !== null) clearInterval(timer); timer = null;
        if (worklet) { worklet.onprocessorerror = null; worklet.port.postMessage({ type: 'stop' }); worklet.port.close(); worklet.disconnect(); worklet = null; }
        sources.forEach(source => { source.onended = null; try { source.stop(); } catch (_) {} source.disconnect(); }); sources.clear();
        if (fallback) { fallback.dead = true; fallback.events = []; } fallback = null; pending.length = 0; out.disconnect();
      }
    };
  }
};
