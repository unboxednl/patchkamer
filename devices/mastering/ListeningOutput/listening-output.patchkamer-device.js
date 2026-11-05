// SPDX-License-Identifier: AGPL-3.0-or-later
// 1.11.1 — de Nederlandse naam per taal is vervallen (namen zijn Engels). 1.11.0 — Patchkamer contract v1.11. Nieuw als Listening Output (nieuwe id, eigen map; voorheen Luisteruitgang). Tweetalig (host.lang: label en poortnaam per taal). setState kapt het volume af op 0 … 1 en zet het bij een ongeldige waarde op de
//          standaard (0,7); het volume gaat zacht naar zijn nieuwe waarde. Nieuw: getPreset/setPreset. Het geluid is ongewijzigd.
// Listening Output: een transparante luisteruitgang: de audio gaat ongewijzigd naar de uitgang van de browser, met alleen een luistervolume (de masteringketen blijft ervoor, zodat je meet wat je hoort).
const TXT = { nl: { level: 'Volume', port: 'In', name: 'Luisteruitgang' }, en: { level: 'Volume', port: 'In', name: 'Listening Output' } };
export default {
  id: 'nl.patchkamer.listeningoutput', name: 'Listening Output', version: '1.12.1', kind: 'output', category: 'mastering', ui: { width: 380, minWidth: 300 },
  ports: { audioIn: [{ id: 'in', name: 'In' }], audioOut: [], eventIn: [], eventOut: [], modIn: [], modOut: [], multiIn: [], multiOut: [] },
  create(ctx, host) {
    const TX = TXT[host && host.lang] || TXT.en, DEFAULT = 0.7;
    const input = ctx.createGain(); let level = DEFAULT, knob = null, dead = false;
    input.gain.value = level; input.connect(ctx.destination);
    const clean = v => typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : DEFAULT;
    const self = {
      inputs: { in: input }, outputs: {},
      mount(el) { knob = host.ui.knob(el, TX.level, [0, 1, .01], level, v => Math.round(v * 100) + '%', v => { level = clean(v); input.gain.setTargetAtTime(level, ctx.currentTime, .03); }); },
      getState() { return { level }; },
      setState(s) { if (dead) return; level = clean(s && s.level); input.gain.setTargetAtTime(level, ctx.currentTime, .03); if (knob) knob.set(level); },
      getPreset() { return { level }; }, setPreset(p) { self.setState(p); },
      unmount() { knob = null; },
      destroy() { if (dead) return; dead = true; knob = null; input.disconnect(); },
    };
    return self;
  },
};
