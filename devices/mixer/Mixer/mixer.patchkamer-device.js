// SPDX-License-Identifier: AGPL-3.0-or-later
// 2.7.0 — Instelbare fadercurve (Fadercurve, 1 tot 5; standaard 3): de schuif loopt over een positie van 0 tot 1 en het niveau volgt −60 + 66 · positie^(1/curve) dB, zodat het bovenste deel van de slag meer ruimte krijgt (curve 1 is de oude lineaire schuif; 0 dB ligt bij 3 op 75%). Het niveau in de state blijft in dB, dus bestaande songs klinken hetzelfde; de regelaar die een MIDI-schuif bestuurt heeft nu het bereik 0 tot 1 en volgt dezelfde curve.
// 2.6.1 — Een VU-meter (skin) staat bovenaan de kanaalstrook, boven het kanaalnummer, in plaats van naast de fader. Het apparaat leest daarvoor het attribuut data-face van het meterelement (bar, ledladder of vu, door de host gezet) en zet de meter erheen of terug. Zonder skin, of met balken of ledladders, verandert er niets.
// 2.6.0 — Niveaumeters van kanalen, groepen en master via host.ui.meter (contract v1.18, additief): de host tekent ze, een skin kan er een VU-meter of ledlader van maken en de lengte en breedte aanpassen. Standaardgezicht, maat, dB-schaal (−60 tot +6) en val zijn gelijk aan de eigen meter van voorheen; een oudere host valt terug op die eigen meter. De 100 ms-bewaker, geluid, getState, presets en poorten ongewijzigd.
// 2.5.1 — Bij het koppelen aan MIDI heet elke regelaar van een kanaal nu 'Trim - T3', van een groep 'Send - G1' en van de master 'Fader - Master' (voorheen
//   wist de host het nummer uit de naam, dus alle kanalen heetten hetzelfde). Alleen de zichtbare naam verandert; de koppeling zelf blijft gelijk.
// 2.5.0 — Alle continue regelaars staan in params() en worden bestuurbaar via modulate(): per kanaal (lane ch1..), groep (g1..) en de master: trim, EQ, send, return, pan en fader. Effectieve waarde = knop + offset × bereik (lineair, geclampt) en gaat alleen naar de audiograaf: de zichtbare regelaar, getState en presets blijven ongewijzigd. Alles staat standaard uit (on: false). Bewust niet: mute, solo, groepstoewijzing, aantal kanalen/groepen, EQ-banden, doelniveau (keuzes, vinkjes en configuratie). Bij een ander aantal kanalen/groepen of EQ-banden meldt de Mixer host.paramsChanged. De sturingsingang 'Mod' staat in de bovenste rij naast de bundelpoorten (de Mixer tekent zijn poorten zelf).
// 2.4.1 — Bewaker tegen NaN en Infinity: één foute waarde van een apparaat ervoor liet de EQ-filters en de begrenzer voorgoed ontsporen (daarna was de hele uitvoer stil of NaN). Elke 100 ms kijkt de Mixer met de meters of er iets niet-eindigs of absurds uitkomt en vervangt dan de ontspoorde EQ-filters en de begrenzer. Normaal geluid is ongewijzigd.
// 2.4.0 — Patchkamer contract v1.11. Tweetalig (host.lang, poort- en kaartnamen per taal in i18n). setState negeert onbekende velden,
//         kapt getallen af op hun bereik en geeft ongeldige waarden de standaard; presets volgen dezelfde regels. Geluid ongewijzigd.
//         Versie 2.4.0 i.p.v. 1.11.0: een lager nummer dan 2.3.0 zou de host als ouder zien.
// 2.3.0 — Patchkamer contract v1.8: dubbelklik = beginwaarde, klik op het getal = waarde typen, en (instelbaar) draaiknop.
// v2.2.1: presets (getPreset/setPreset) bewaren alles behalve de bronkeuzes per kanaal (routing blijft staan).
// v2.2.0: bundels. "Bundel in" neemt een groene bundelkabel aan (bv. de losse uitgangen van de drumcomputer);
//         per kanaal kies je in "Bron" welk bundelkanaal daar binnenkomt. "Kanalen uit" geeft alle kanalen na
//         afmixen (na trim, EQ, fader, pan en mute/solo) als één bundel, bv. voor de multitrack-recorder.
//         Kanalen en groepen hebben een naam; die gaat mee in de bundel.
// v2.1.0: alle faders op één hoogte; EQ ook op groepen en master.
// Mixer: mengpaneel met instelbaar aantal kanalen (1–32) en groepen (0–8), per kanaal trim, 3- of 5-bands EQ,
// send/return, groepstoewijzing, pan, fader, mute/solo. Groepen en master hebben send/return.
// "Gelijk trekken" meet alle ingangen en zet de trims zo dat elke bron op hetzelfde niveau binnenkomt.
// Poorten veranderen mee met de configuratie (host.setPorts) en staan in de strips zelf (host.ui.jack).

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const MAXCH = 32, MAXGRP = 8;
const EQ3 = [{ t: 'lowshelf', f: 120, lab: 'low' }, { t: 'peaking', f: 1000, q: 0.8, lab: 'mid' }, { t: 'highshelf', f: 6000, lab: 'high' }];
const EQ5 = [{ t: 'lowshelf', f: 80, lab: 'low' }, { t: 'peaking', f: 300, q: 1, lab: 'lmid' }, { t: 'peaking', f: 1000, q: 1, lab: 'mid' }, { t: 'peaking', f: 3500, q: 1, lab: 'hmid' }, { t: 'highshelf', f: 10000, lab: 'high' }];
const chDef = () => ({ name: '', src: '', trim: 0, eq3: [0, 0, 0], eq5: [0, 0, 0, 0, 0], send: 0, ret: 0.8, grp: 0, pan: 0, lvl: -6, mute: false, solo: false });
const grpDef = () => ({ name: '', eq3: [0, 0, 0], eq5: [0, 0, 0, 0, 0], send: 0, ret: 0.8, lvl: 0, mute: false });
const mstDef = () => ({ eq3: [0, 0, 0], eq5: [0, 0, 0, 0, 0], send: 0, ret: 0.8, lvl: 0 });
const DEF = { nCh: 8, nGrp: 2, eq: 3, target: -18, auto: false, bundleAll: false, curve: 3 };
// faderkromme: de schuif loopt van 0 tot 1 (positie), het niveau is −60 + 66 · positie^(1/curve) dB; curve 1 is lineair in dB, hoger geeft meer slag aan het bovenste deel (0 dB ligt bij curve 3 op 75%)
const posToDb = (p, g) => -60 + 66 * Math.pow(Math.max(0, Math.min(1, p)), 1 / g), dbToPos = (d, g) => Math.pow(Math.max(0, Math.min(1, (d + 60) / 66)), g);

// Teksten per taal (host.lang): Nederlandse bron, Engels als alternatief; onbekende taal = Engels
const TXT = {
  nl: { chs: 'Kanalen', grps: 'Groepen', master: 'Master', eq: 'EQ', bands3: '3 banden', bands5: '5 banden',
    low: 'Laag', mid: 'Mid', high: 'Hoog', lmid: 'L-mid', hmid: 'H-mid',
    match: 'Gelijk trekken', matchT: 'meet 4 seconden en zet de trim van elk kanaal zodat alle bronnen op het doelniveau binnenkomen',
    cont: 'doorlopend', contT: 'houdt de trims langzaam (max 3 dB/s) op het doelniveau', goal: 'Doel', goalA: 'doelniveau', curve: 'Fadercurve', curveA: 'fadercurve', curveT: 'Vorm van de faders: 1 is lineair in dB, hoger geeft meer slag aan het bovenste deel (ook voor een MIDI-schuif)', curveAt: n => '0 dB op ' + n + '%',
    bunIn: 'bundel in', bunOut: 'kanalen uit', bunAll: '+ groepen en mix', bunAllT: 'stuur ook de groepen en de totale mix mee in "kanalen uit"',
    chNameT: 'naam van dit kanaal', chNameA: k => `naam kanaal ${k}`, grpNameT: 'naam van deze groep', grpNameA: k => `naam groep ${k}`,
    srcA: k => `bron kanaal ${k}`, srcT: k => 'bron: een kanaal uit een bundel (groene kabel), of alleen de kabel op ' + k, cable: '— kabel', lost: '(niet verbonden)',
    jSend: 'send', jRet: 'ret', jOut: 'uit', trim: 'Trim', send: 'Send', ret: 'Return', pan: 'Pan', fader: 'fader', level: 'niveau',
    toA: k => `kanaal ${k} naar`, toM: '→ M', toMT: 'naar de master', toT: n => 'naar ' + n, mute: 'mute', solo: 'solo',
    measuring: 'meten… (4 s)', matched: n => `${n} kanaal${n > 1 ? 'en' : ''} gelijkgetrokken`, noSignal: 'geen signaal: start de klok en meet opnieuw',
    chN: n => 'Kanaal ' + n, grpN: n => 'Groep ' + n,
    pSend: n => 'Send ' + n, pRet: n => 'Return ' + n, pGSend: g => 'Groep ' + g + ' send', pGRet: g => 'Groep ' + g + ' return',
    pMSend: 'Master send', pMRet: 'Master return', pOut: 'Uit', pBunIn: 'Bundel in', pBunOut: 'Kanalen uit' },
  en: { chs: 'Channels', grps: 'Groups', master: 'Master', eq: 'EQ', bands3: '3 bands', bands5: '5 bands',
    low: 'Low', mid: 'Mid', high: 'High', lmid: 'Lo-mid', hmid: 'Hi-mid',
    match: 'Level match', matchT: 'measures for 4 seconds and sets the trim of each channel so all sources arrive at the target level',
    cont: 'continuous', contT: 'slowly (max 3 dB/s) keeps the trims at the target level', goal: 'Target', goalA: 'target level', curve: 'Fader curve', curveA: 'fader curve', curveT: 'Shape of the faders: 1 is linear in dB, higher gives more travel to the upper part (also for a MIDI fader)', curveAt: n => '0 dB at ' + n + '%',
    bunIn: 'bundle in', bunOut: 'channels out', bunAll: '+ groups and mix', bunAllT: 'also send the groups and the total mix in "channels out"',
    chNameT: 'name of this channel', chNameA: k => `name of channel ${k}`, grpNameT: 'name of this group', grpNameA: k => `name of group ${k}`,
    srcA: k => `source of channel ${k}`, srcT: k => 'source: a channel from a bundle (green cable), or just the cable on ' + k, cable: '— cable', lost: '(not connected)',
    jSend: 'send', jRet: 'ret', jOut: 'out', trim: 'Trim', send: 'Send', ret: 'Return', pan: 'Pan', fader: 'fader', level: 'level',
    toA: k => `channel ${k} to`, toM: '→ M', toMT: 'to the master', toT: n => 'to ' + n, mute: 'mute', solo: 'solo',
    measuring: 'measuring… (4 s)', matched: n => `${n} channel${n > 1 ? 's' : ''} matched`, noSignal: 'no signal: start the clock and measure again',
    chN: n => 'Channel ' + n, grpN: n => 'Group ' + n,
    pSend: n => 'Send ' + n, pRet: n => 'Return ' + n, pGSend: g => 'Group ' + g + ' send', pGRet: g => 'Group ' + g + ' return',
    pMSend: 'Master send', pMRet: 'Master return', pOut: 'Out', pBunIn: 'Bundle in', pBunOut: 'Channels out' },
};
const num = (v, a, b, d) => (typeof v === 'number' && Number.isFinite(v) ? clamp(v, a, b) : d);
const bool = (v, d) => (typeof v === 'boolean' ? v : d);
const eqs = (src, n) => Array.from({ length: n }, (_, q) => num(Array.isArray(src) ? src[q] : undefined, -15, 15, 0));
// setState (§13): onbekende velden weg, getallen binnen het bereik, ongeldig = standaard
const cleanCh = c => { c = c && typeof c === 'object' ? c : {}; return { name: typeof c.name === 'string' ? c.name.slice(0, 24) : '', src: typeof c.src === 'string' ? c.src : '', trim: num(c.trim, -24, 24, 0), eq3: eqs(c.eq3, 3), eq5: eqs(c.eq5, 5),
  send: num(c.send, 0, 1, 0), ret: num(c.ret, 0, 1, 0.8), grp: Math.round(num(c.grp, 0, MAXGRP, 0)), pan: num(c.pan, -1, 1, 0), lvl: num(c.lvl, -60, 6, -6), mute: bool(c.mute, false), solo: bool(c.solo, false) }; };
const cleanGrp = c => { c = c && typeof c === 'object' ? c : {}; return { name: typeof c.name === 'string' ? c.name.slice(0, 24) : '', eq3: eqs(c.eq3, 3), eq5: eqs(c.eq5, 5), send: num(c.send, 0, 1, 0), ret: num(c.ret, 0, 1, 0.8), lvl: num(c.lvl, -60, 6, 0), mute: bool(c.mute, false) }; };
const cleanMst = c => { c = c && typeof c === 'object' ? c : {}; return { eq3: eqs(c.eq3, 3), eq5: eqs(c.eq5, 5), send: num(c.send, 0, 1, 0), ret: num(c.ret, 0, 1, 0.8), lvl: num(c.lvl, -60, 6, 0) }; };

function portsFor(nCh, nGrp, T) {
  const audioIn = [], audioOut = [];
  for (let i = 1; i <= nCh; i++) audioIn.push({ id: 'ch' + i, name: String(i) });
  for (let i = 1; i <= nCh; i++) { audioOut.push({ id: 's' + i, name: T.pSend(i) }); audioIn.push({ id: 'r' + i, name: T.pRet(i) }); }
  for (let g = 1; g <= nGrp; g++) { audioOut.push({ id: 'gs' + g, name: T.pGSend(g) }); audioIn.push({ id: 'gr' + g, name: T.pGRet(g) }); }
  audioOut.push({ id: 'ms', name: T.pMSend }); audioIn.push({ id: 'mr', name: T.pMRet });
  audioOut.push({ id: 'out', name: T.pOut });
  return { audioIn, audioOut, eventIn: [], eventOut: [], multiIn: [{ id: 'multi', name: T.pBunIn }], multiOut: [{ id: 'post', name: T.pBunOut }] };
}
const portNames = p => Object.fromEntries([...p.audioIn, ...p.audioOut, ...p.multiIn, ...p.multiOut].map(x => [x.id, x.name]));

const CSS = `
.mx2{display:grid;gap:8px;font-family:var(--mono);font-size:11px;color:var(--fg)}
.mx2 button{font-family:var(--disp);font-size:11px;letter-spacing:.08em;padding:3px 7px}
.mx2-cfg{display:flex;flex-wrap:wrap;gap:8px 16px;align-items:center;padding:6px 8px;border:1px solid var(--line);border-radius:4px;background:var(--card-2)}
.mx2-cfg label{display:flex;gap:6px;align-items:center;font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted)}
.mx2-cfg input[type=number]{width:52px;background:var(--card);color:var(--fg);border:1px solid var(--line);font-family:var(--mono);font-size:12px;padding:3px 5px;border-radius:3px}
.mx2-cfg input[type=range]{width:90px}
.mx2-cfg .sep{width:1px;align-self:stretch;background:var(--line)}
.mx2-cfg .msg{font-size:10px;color:var(--audio);min-width:12ch}
.mx2-desk{display:flex;gap:8px;overflow-x:auto;padding:10px 0 6px;align-items:stretch}
.mx2-sec{display:flex;gap:3px;padding:6px 5px 8px;border:1px solid var(--line);border-radius:5px;position:relative}
.mx2-sec>.tag{position:absolute;top:-8px;left:8px;background:var(--card);padding:0 5px;font-family:var(--disp);font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:var(--muted)}
.mx2-sec.grp{background:rgba(155,140,255,.05)} .mx2-sec.mst{background:rgba(79,209,197,.05)}
.mx2-strip{width:66px;display:flex;flex-direction:column;gap:5px;padding:2px 3px;border-radius:3px}
.mx2-bottom{margin-top:auto;display:grid;gap:5px;padding-top:4px}
.mx2-strip+.mx2-strip{border-left:1px solid var(--line)}
.mx2-strip.solo{background:rgba(244,162,97,.08)}
.mx2-head{display:grid;justify-items:center;gap:4px;min-height:42px;align-content:center}
.mx2-head .lbl{font-family:var(--disp);font-size:15px;font-weight:700;letter-spacing:.04em}
.mx2-io{display:flex;justify-content:space-around;gap:2px;min-height:36px}
.mx2-io .port.jack{font-size:9px}
.mx2-m{display:grid;gap:0}
.mx2-m .l{display:flex;justify-content:space-between;gap:2px;font-size:8.5px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted)}
.mx2-m .l b{font-weight:400;color:var(--fg);font-variant-numeric:tabular-nums}
.mx2-m input[type=range]{height:14px}
.mx2-m.trim .l b{color:var(--audio)}
.mx2-eq{display:grid;gap:1px;padding:3px 0;border-top:1px dashed var(--line);border-bottom:1px dashed var(--line)}
.mx2 select{font-size:10px;padding:2px 3px;width:100%}
.mx2-vutop{display:flex;justify-content:center;padding:2px 0 4px}
.mx2-fad{display:grid;grid-template-columns:1fr 8px;gap:4px;height:130px;align-items:stretch}
.mx2-fad input[type=range]{writing-mode:vertical-lr;direction:rtl;height:130px;width:100%;margin:0}
.mx2-fad.hm{grid-template-columns:1fr auto}
.mx2-met{background:var(--well,#0b0d10);border:1px solid var(--line);border-radius:2px;position:relative;overflow:hidden}
.mx2-met i{position:absolute;left:0;right:0;bottom:0;height:0;background:linear-gradient(0deg,var(--audio) 0%,var(--audio) 60%,var(--go) 80%,var(--stop) 96%)}
.mx2-met u{position:absolute;left:0;right:0;height:2px;background:var(--fg);bottom:0;text-decoration:none}
.mx2-db{text-align:center;font-size:10px;font-variant-numeric:tabular-nums}
.mx2-ms{display:flex;gap:3px;min-height:24px} .mx2-ms button{flex:1;padding:3px 0;font-family:var(--mono);letter-spacing:0}
.mx2-ms button.m.on{background:var(--stop);border-color:var(--stop);color:#fff}
.mx2-ms button.s.on{background:var(--event);border-color:var(--event);color:#1a0d00}
.mx2 input.nm{width:100%;min-width:0;box-sizing:border-box;font-family:var(--disp);font-size:12px;font-weight:700;letter-spacing:.03em;text-align:center;padding:2px 2px;border:1px solid transparent;border-bottom-color:var(--line);background:transparent;color:var(--fg);border-radius:2px}
.mx2 input.nm:hover{border-color:var(--line)} .mx2 input.nm:focus{outline:none;border-color:var(--audio);background:var(--card-2)}
.mx2 input.nm::placeholder{color:var(--muted);font-weight:500}
.mx2 select.src{font-size:9.5px;color:var(--multi)} .mx2 select.src.none{color:var(--muted)} .mx2 select.src.lost{color:var(--stop)}
.mx2-bun{display:flex;gap:10px;align-items:center}
.mx2-bun .port.jack{font-size:9px}
`;

export default {
  id: 'nl.patchkamer.mixer',
  name: 'Mixer',
  version: '2.7.0',
  kind: 'mixer',
  modExclude: ['target'],   // doelniveau van 'gelijk trekken': geen audioregelaar maar een meetinstelling
  category: 'mix',
  ui: { width: 960, minWidth: 360, jacks: true },
  i18n: { en: { name: 'Mixer', ports: portNames(portsFor(DEF.nCh, DEF.nGrp, TXT.en)) } },
  ports: portsFor(DEF.nCh, DEF.nGrp, TXT.nl),
  create(ctx, host) {
    const T = TXT[host && host.lang] || TXT.en;
    const S = { ...DEF, ch: Array.from({ length: MAXCH }, chDef), grp: Array.from({ length: MAXGRP }, grpDef), master: mstDef() };
    const inputs = {}, outputs = {};
    const buf = new Float32Array(2048);
    const db = v => Math.pow(10, v / 20), fgain = v => (v <= -59.5 ? 0 : db(v));
    let self, root = null, raf = 0, ui = null, measure = null, msg = '';

    // ---------- master ----------
    const M = { eq: [] }, mPost = ctx.createGain();
    const mSum = ctx.createGain(), mFader = ctx.createGain(), mSend = ctx.createGain(), mRetIn = ctx.createGain(), mRet = ctx.createGain(), out = ctx.createGain(), mMeter = ctx.createAnalyser();
    const mkLim = () => { const l = ctx.createDynamicsCompressor(); l.threshold.value = -3; l.ratio.value = 10; l.knee.value = 2; l.attack.value = 0.003; l.release.value = 0.15; return l; };
    let lim = mkLim(); mMeter.fftSize = 1024;
    mPost.connect(mFader); mPost.connect(mSend); mRetIn.connect(mRet).connect(mFader); mFader.connect(lim).connect(out); out.connect(mMeter);

    // ---------- groups and channels ----------
    const groups = [], chans = [];
    function makeGroup() {
      const n = { sum: ctx.createGain(), eq: [], post: ctx.createGain(), fader: ctx.createGain(), mute: ctx.createGain(), send: ctx.createGain(), retIn: ctx.createGain(), ret: ctx.createGain(), meter: ctx.createAnalyser(), tap: ctx.createGain() };
      n.meter.fftSize = 1024; n.post.connect(n.fader); n.post.connect(n.send); n.retIn.connect(n.ret).connect(n.fader); n.fader.connect(n.mute).connect(mSum); n.mute.connect(n.meter); n.mute.connect(n.tap);
      buildEq(n, n.sum, n.post); return n;
    }
    function makeChannel() {
      const n = { in: ctx.createGain(), inMeter: ctx.createAnalyser(), trim: ctx.createGain(), eq: [], fader: ctx.createGain(), pan: ctx.createStereoPanner(), mute: ctx.createGain(), send: ctx.createGain(), retIn: ctx.createGain(), ret: ctx.createGain(), meter: ctx.createAnalyser(), tap: ctx.createGain(), dest: null, ema: null, srcNode: null };
      n.inMeter.fftSize = 2048; n.meter.fftSize = 1024;
      n.in.connect(n.inMeter); n.in.connect(n.trim); n.fader.connect(n.pan).connect(n.mute); n.mute.connect(n.send); n.mute.connect(n.meter); n.mute.connect(n.tap); n.retIn.connect(n.ret);
      buildEq(n, n.trim, n.fader); return n;
    }
    // EQ chain between two nodes; `from` feeds only this chain, so it can be rewired freely (3 <-> 5 bands)
    function buildEq(n, from, to) {
      try { from.disconnect(); } catch (e) {} n.eq.forEach(f => { try { f.disconnect(); } catch (e) {} });
      n.eq = (S.eq === 5 ? EQ5 : EQ3).map(b => { const f = ctx.createBiquadFilter(); f.type = b.t; f.frequency.value = b.f; if (b.q) f.Q.value = b.q; return f; });
      let prev = from; n.eq.forEach(f => { prev.connect(f); prev = f; }); prev.connect(to);
    }
    function rebuildAllEq() { chans.forEach(n => buildEq(n, n.trim, n.fader)); groups.forEach(n => buildEq(n, n.sum, n.post)); buildEq(M, mSum, mPost); }
    const kill = nodes => nodes.forEach(x => { try { x.disconnect(); } catch (e) {} });
    function destOf(i) { const g = S.ch[i].grp; return g > 0 && g <= groups.length ? groups[g - 1].sum : mSum; }
    function route(i) { const n = chans[i], d = destOf(i); if (n.dest === d) return; if (n.dest) { try { n.mute.disconnect(n.dest); } catch (e) {} try { n.ret.disconnect(n.dest); } catch (e) {} } n.mute.connect(d); n.ret.connect(d); n.dest = d; }
    // ---------- bundels (contract v1.5) ----------
    const bundlesIn = new Map();   // sleutel -> bundel (van de host)
    const srcOf = src => { if (!src) return null; const i = src.lastIndexOf('|'); const b = bundlesIn.get(src.slice(0, i)); return b ? b.channels.find(c => c.id === src.slice(i + 1)) || null : null; };
    function connectSrc(i) {
      const n = chans[i]; if (!n) return; const want = srcOf(S.ch[i].src); const node = want ? want.node : null;
      if (n.srcNode === node) return;
      if (n.srcNode) { try { n.srcNode.disconnect(n.in); } catch (e) {} }
      n.srcNode = node; if (node) { try { node.connect(n.in); } catch (e) { n.srcNode = null; } }
    }
    const chName = i => S.ch[i].name || (srcOf(S.ch[i].src) || {}).name || T.chN(i + 1);
    const grpName = g => S.grp[g].name || T.grpN(g + 1);
    function postBundle() {
      const channels = chans.map((n, i) => ({ id: 'ch' + (i + 1), name: chName(i), node: n.tap }));
      if (S.bundleAll) { groups.forEach((n, g) => channels.push({ id: 'g' + (g + 1), name: grpName(g), node: n.tap })); channels.push({ id: 'mix', name: 'Mix', node: out }); }
      return { label: T.chs, channels };
    }
    let bundleT = 0;
    const announce = () => { clearTimeout(bundleT); bundleT = setTimeout(() => { if (host.bundleChanged) host.bundleChanged(self, 'post'); }, 120); };
    // nieuwe bundel: kanalen die nog nergens staan op lege kanalen zetten (geen bron, geen kabel); zo nodig kanalen bijmaken
    const seen = new Map();   // sleutel -> kanaal-id's die we al eens zagen (alleen nieuwe kanalen worden vanzelf toegewezen)
    function autoAssign(b) {
      const prev = seen.get(b.key) || new Set(); seen.set(b.key, new Set(b.channels.map(c => c.id)));
      const used = new Set(S.ch.slice(0, S.nCh).map(c => c.src));
      const todo = b.channels.filter(c => !prev.has(c.id) && !used.has(b.key + '|' + c.id)); if (!todo.length) return false;
      const wired = i => host.isWired ? host.isWired(self, 'ch' + (i + 1), 'in') : false;
      let free = []; for (let i = 0; i < S.nCh; i++) if (!S.ch[i].src && !wired(i)) free.push(i);
      if (free.length < todo.length && S.nCh < MAXCH) { const add = Math.min(MAXCH - S.nCh, todo.length - free.length); const from = S.nCh; configure(S.nCh + add, S.nGrp, true); for (let i = from; i < S.nCh; i++) free.push(i); }
      todo.forEach((c, k) => { const i = free[k]; if (i == null) return; S.ch[i].src = b.key + '|' + c.id; });
      return true;
    }
    function syncIO() {
      Object.keys(inputs).forEach(k => delete inputs[k]); Object.keys(outputs).forEach(k => delete outputs[k]);
      chans.forEach((n, i) => { inputs['ch' + (i + 1)] = n.in; inputs['r' + (i + 1)] = n.retIn; outputs['s' + (i + 1)] = n.send; });
      groups.forEach((n, g) => { inputs['gr' + (g + 1)] = n.retIn; outputs['gs' + (g + 1)] = n.send; });
      inputs.mr = mRetIn; outputs.ms = mSend; outputs.out = out;
    }
    function configure(nCh, nGrp, notify) {
      nCh = clamp(Math.round(+nCh) || 1, 1, MAXCH); nGrp = clamp(Math.round(+nGrp) || 0, 0, MAXGRP);
      while (groups.length < nGrp) groups.push(makeGroup());
      while (chans.length < nCh) chans.push(makeChannel());
      S.nCh = nCh; S.nGrp = nGrp; syncIO();
      if (notify && host.setPorts) host.setPorts(self, portsFor(nCh, nGrp, T));   // host removes cables to ports that disappear
      while (chans.length > nCh) { const n = chans.pop(); if (n.srcNode) { try { n.srcNode.disconnect(n.in); } catch (e) {} } kill([n.in, n.trim, ...n.eq, n.fader, n.pan, n.mute, n.send, n.retIn, n.ret, n.tap]); }
      while (groups.length > nGrp) { const n = groups.pop(); kill([n.sum, ...n.eq, n.post, n.fader, n.mute, n.send, n.retIn, n.ret, n.tap]); }
      syncIO();
      chans.forEach((n, i) => { if (n.dest && !groups.some(g => g.sum === n.dest) && n.dest !== mSum) n.dest = null; route(i); connectSrc(i); });
      applyAll(); announce(); paramsChanged();
      if (root) render();
    }
    // ---------- sturing (contract §8): effectieve waarde = knop + offset × bereik, alleen naar de graaf ----------
    const mod = {};   // id -> offset (-1..1)
    const E = (id, base, mn, mx) => { const o = mod[id]; return o ? clamp(base + o * (mx - mn), mn, mx) : base; };
    let pdefs = null;
    const eqLab = b => T[b.lab];
    function paramDefs() {
      if (pdefs) return pdefs;
      const out = [], bands = S.eq === 5 ? EQ5 : EQ3, arr = S.eq === 5 ? 'eq5' : 'eq3';
      const add = (lane, laneName, pre, who, key, label, mn, mx, role, drift) => out.push({ id: pre + '.' + key, name: who + ' ' + label, lane, laneName, min: mn, max: mx, role, scale: 'lin', drift, on: false });
      const strip = (lane, laneName, pre, who, withTrimPan) => {
        if (withTrimPan) add(lane, laneName, pre, who, 'trim', T.trim, -24, 24, 'level', 0.05);
        bands.forEach((b, q) => add(lane, laneName, pre, who, arr + '.' + q, eqLab(b), -15, 15, 'color', 0.1));
        add(lane, laneName, pre, who, 'send', T.send, 0, 1, 'level', 0.1);
        add(lane, laneName, pre, who, 'ret', T.ret, 0, 1, 'level', 0.1);
        if (withTrimPan) add(lane, laneName, pre, who, 'pan', T.pan, -1, 1, 'pan', 0.1);
        add(lane, laneName, pre, who, 'lvl', T.fader, -60, 6, 'level', 0.05);
      };
      for (let i = 1; i <= S.nCh; i++) strip('ch' + i, T.chN(i), 'ch' + i, T.chN(i), true);
      for (let g = 1; g <= S.nGrp; g++) strip('g' + g, T.grpN(g), 'g' + g, T.grpN(g), false);
      strip('master', T.master, 'master', T.master, false);
      return (pdefs = out);
    }
    function paramsChanged() { pdefs = null; { const known = new Set(paramDefs().map(d => d.id)); for (const k in mod) if (!known.has(k)) delete mod[k]; } if (self && host && typeof host.paramsChanged === 'function') host.paramsChanged(self); }
    function applyAll() {
      const t = ctx.currentTime, r = 0.02, anySolo = S.ch.slice(0, S.nCh).some(c => c.solo);
      const eqk = S.eq === 5 ? 'eq5' : 'eq3';
      chans.forEach((n, i) => {
        const c = S.ch[i], eq = c[eqk], p = 'ch' + (i + 1) + '.';
        n.trim.gain.setTargetAtTime(db(E(p + 'trim', c.trim, -24, 24)), t, r); n.eq.forEach((f, k) => f.gain.setTargetAtTime(E(p + eqk + '.' + k, eq[k] || 0, -15, 15), t, r));
        n.fader.gain.setTargetAtTime(fgain(E(p + 'lvl', c.lvl, -60, 6)), t, r); n.pan.pan.setTargetAtTime(E(p + 'pan', c.pan, -1, 1), t, r);
        n.mute.gain.setTargetAtTime(c.mute || (anySolo && !c.solo) ? 0 : 1, t, r);
        n.send.gain.setTargetAtTime(E(p + 'send', c.send, 0, 1), t, r); n.ret.gain.setTargetAtTime(E(p + 'ret', c.ret, 0, 1), t, r);
      });
      groups.forEach((n, g) => { const c = S.grp[g], p = 'g' + (g + 1) + '.'; n.eq.forEach((f, k) => f.gain.setTargetAtTime(E(p + eqk + '.' + k, c[eqk][k] || 0, -15, 15), t, r)); n.fader.gain.setTargetAtTime(fgain(E(p + 'lvl', c.lvl, -60, 6)), t, r); n.mute.gain.setTargetAtTime(c.mute ? 0 : 1, t, r); n.send.gain.setTargetAtTime(E(p + 'send', c.send, 0, 1), t, r); n.ret.gain.setTargetAtTime(E(p + 'ret', c.ret, 0, 1), t, r); });
      const m = S.master;
      M.eq.forEach((f, k) => f.gain.setTargetAtTime(E('master.' + eqk + '.' + k, m[eqk][k] || 0, -15, 15), t, r)); mFader.gain.setTargetAtTime(fgain(E('master.lvl', m.lvl, -60, 6)), t, r); mSend.gain.setTargetAtTime(E('master.send', m.send, 0, 1), t, r); mRet.gain.setTargetAtTime(E('master.ret', m.ret, 0, 1), t, r);
    }
    buildEq(M, mSum, mPost);
    configure(DEF.nCh, DEF.nGrp, false);
    // bewaker tegen NaN en Infinity: biquad-filters en de compressor houden een toestand die een niet-eindige waarde nooit meer kwijtraakt.
    // Elke 100 ms kijken de meters of er iets niet-eindigs of absurds uitkomt; zo ja, dan vervangen we de ontspoorde filters (de instellingen blijven).
    const badAn = an => { an.getFloatTimeDomainData(buf); const n = an.fftSize; for (let i = 0; i < n; i++) { const x = buf[i]; if (!(x > -1e6 && x < 1e6)) return true; } return false; };
    function guard() {
      let fixed = false;
      chans.forEach(n => { if (badAn(n.meter)) { buildEq(n, n.trim, n.fader); fixed = true; } });
      groups.forEach(n => { if (badAn(n.meter)) { buildEq(n, n.sum, n.post); fixed = true; } });
      if (badAn(mMeter)) { buildEq(M, mSum, mPost); try { mFader.disconnect(lim); } catch (e) {} try { lim.disconnect(); } catch (e) {} lim = mkLim(); mFader.connect(lim).connect(out); fixed = true; }
      if (fixed) applyAll();
    }
    const guardT = setInterval(guard, 100);

    // ---------- levels: meters and "gelijk trekken" ----------
    function rmsDb(an) { an.getFloatTimeDomainData(buf); let s = 0; const n = an.fftSize; for (let i = 0; i < n; i++) s += buf[i] * buf[i]; return 10 * Math.log10(s / n + 1e-12); }
    function peak(an) { an.getFloatTimeDomainData(buf); let p = 0; const n = an.fftSize; for (let i = 0; i < n; i++) { const a = Math.abs(buf[i]); if (a > p) p = a; } return p; }
    function startMeasure() { measure = { until: performance.now() + 4000, sum: chans.map(() => 0), cnt: chans.map(() => 0) }; msg = T.measuring; paintMsg(); }
    function finishMeasure() {
      let set = 0;
      chans.forEach((n, i) => { if (measure.cnt[i] > 10) { const lvl = 10 * Math.log10(measure.sum[i] / measure.cnt[i]); S.ch[i].trim = Math.round(clamp(S.target - lvl, -24, 24) * 2) / 2; set++; } });
      measure = null; msg = set ? T.matched(set) : T.noSignal; applyAll(); refresh(); paintMsg();
    }
    let lastT = performance.now(), ctrlT = 0;
    // 2.2.2: meters via de tekenklok van de host (alleen in beeld, 30×/s); automatisch gelijktrekken en meten lopen
    // op een rustige timer door als de mixer niet te zien is
    function startLoops() { stopLoops(); if (host && typeof host.frame === 'function' && self && self._id) raf = host.frame(self, () => tick(true), 30);
      else { let last = 0; const f = t => { rafId = requestAnimationFrame(f); if (document.hidden || t - last < 31) return; last = t; tick(true); }; rafId = requestAnimationFrame(f); raf = () => cancelAnimationFrame(rafId); }
      ctrlT = setInterval(() => { if ((measure || S.auto) && !(host && typeof host.visible === 'function' && self && host.visible(self))) tick(false); }, 50); }
    function stopLoops() { if (typeof raf === 'function') raf(); raf = 0; if (ctrlT) clearInterval(ctrlT); ctrlT = 0; }
    let rafId = 0;
    function tick(draw) {
      const now = performance.now(), dt = Math.min(0.1, (now - lastT) / 1000); lastT = now;
      chans.forEach((n, i) => {
        if (measure || S.auto) {
          const l = rmsDb(n.inMeter);
          if (l > -60) {
            if (measure && i < measure.sum.length) { measure.sum[i] += Math.pow(10, l / 10); measure.cnt[i]++; }
            if (S.auto) { n.ema = n.ema == null ? l : n.ema + (l - n.ema) * Math.min(1, dt / 3); const want = clamp(S.target - n.ema, -24, 24), c = S.ch[i]; const step = clamp(want - c.trim, -3 * dt, 3 * dt); if (Math.abs(step) > 0.001) { c.trim = Math.round((c.trim + step) * 10) / 10; n.trim.gain.setTargetAtTime(db(E('ch' + (i + 1) + '.trim', c.trim, -24, 24)), ctx.currentTime, 0.1); } }
          }
        }
      });
      if (measure && now > measure.until) finishMeasure();
      if (draw !== false && ui) {
        ui.meters.forEach(m => { const p = peak(m.an), h = clamp((20 * Math.log10(p + 1e-9) + 60) / 66, 0, 1); m.hold = Math.max(h, (m.hold || 0) - dt * 0.4); m.bar.style.height = (h * 100).toFixed(1) + '%'; m.pk.style.bottom = (m.hold * 100).toFixed(1) + '%'; });
        if (S.auto) ui.trims.forEach(t => t());
      }
    }

    // ---------- UI ----------
    const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
    const fmtDb = v => (v <= -59.5 ? '−∞' : (v > 0 ? '+' : '') + (+v).toFixed(1));
    const pct = v => Math.round(v * 100) + '%';
    function mini(parent, label, [mn, mx, st], get, set, fmt, reset, cls) {
      const w = el('div', 'mx2-m' + (cls ? ' ' + cls : '')), l = el('div', 'l'), b = el('b', null, fmt(get())), i = el('input');
      l.append(el('span', null, label), b); i.type = 'range'; i.min = mn; i.max = mx; i.step = st; i.value = get(); i.setAttribute('aria-label', label);
      i.oninput = () => { set(+i.value); b.textContent = fmt(+i.value); applyAll(); };
      i.ondblclick = () => { set(reset); i.value = reset; b.textContent = fmt(reset); applyAll(); };
      w.append(l, i); parent.appendChild(w);
      const r = () => { i.value = get(); b.textContent = fmt(get()); }; ui.refreshers.push(r); return r;
    }
    // elke regelaar van een strook krijgt het spoor erbij ('Trim - T3'): zo zie je bij het koppelen aan MIDI welk kanaal het is
    const tagCtl = (strip, tag) => strip.querySelectorAll('input[type=range],select,button').forEach(x => { x.dataset.pkSuffix = tag; });
    // niveaumeter: de host tekent hem (host.ui.meter, v1.18) en leest de analyser zelf; zonder host.ui.meter de eigen tekening
    let hostMeters = [];
    const hasHostMeter = () => !!(host && host.ui && typeof host.ui.meter === 'function');
    // een skin kan de meter breder maken (VU-meter): de strook groeit mee, zonder skin blijft ze 66 px (master 76 px)
    function growStrip(f, hm) {
      if (typeof ResizeObserver !== 'function' || !hm.el) return;
      const ro = new ResizeObserver(() => { const s = f.closest('.mx2-strip'); if (!s) return; if (!s.dataset.w0) s.dataset.w0 = parseFloat(s.style.width) || 66; const w = Math.ceil(hm.el.getBoundingClientRect().width); if (w) s.style.width = Math.max(+s.dataset.w0, w + (hm.el.parentNode === f ? 34 : 10)) + 'px'; });
      ro.observe(hm.el); const d0 = hm.destroy; hm.destroy = () => { ro.disconnect(); return d0.call(hm); };
    }
    // een VU-meter staat bovenaan de strook (boven de kop), alle andere gezichten naast de fader; data-face zet de host op het meterelement
    function watchFace(f, hm) {
      if (typeof MutationObserver !== 'function' || !hm.el) return;
      const place = () => {
        const s = f.closest('.mx2-strip'); if (!s) return; let top = s.querySelector(':scope > .mx2-vutop');
        if (hm.el.dataset.face === 'vu') { if (!top) { top = el('div', 'mx2-vutop'); s.insertBefore(top, s.firstChild); } if (hm.el.parentNode !== top) top.appendChild(hm.el); }
        else { if (hm.el.parentNode !== f) f.appendChild(hm.el); if (top && !top.firstChild) top.remove(); }
      };
      const mo = new MutationObserver(place); mo.observe(hm.el, { attributes: true, attributeFilter: ['data-face'] });
      const d0 = hm.destroy; hm.destroy = () => { mo.disconnect(); return d0.call(hm); };
      Promise.resolve().then(place);
    }
    function fader(parent, get, set, an, mid) {
      const f = el('div', 'mx2-fad'), i = el('input');
      let met, bar, pk, hm = null;
      if (hasHostMeter() && mid) { try { hm = host.ui.meter(f, T.level + ' ' + mid.slice(4).toUpperCase(), { id: mid, group: 'meters', source: an, kind: 'peak', unit: 'linear', range: [-60, 6], hold: true, orientation: 'vertical', length: 130, width: 8 }); } catch (e) { hm = null; } }
      if (hm) { f.classList.add('hm'); hostMeters.push(hm); growStrip(f, hm); watchFace(f, hm); } else { met = el('div', 'mx2-met'); bar = el('i'); pk = el('u'); }
      i.type = 'range'; i.min = 0; i.max = 1; i.step = 0.001; i.value = dbToPos(get(), S.curve); i.setAttribute('aria-label', T.fader);
      const v = el('div', 'mx2-db', fmtDb(get()));
      const fromPos = () => { const p = +i.value; let d = p <= 0.0005 ? -60 : Math.round(posToDb(p, S.curve) * 10) / 10; if (Math.abs(d) < 0.3) d = 0; return d; };
      i.oninput = () => { const d = fromPos(); set(d); v.textContent = fmtDb(d); applyAll(); };
      i.ondblclick = () => { set(0); i.value = dbToPos(0, S.curve); v.textContent = fmtDb(0); applyAll(); };
      if (hm) { f.insertBefore(i, f.firstChild); parent.append(f, v); } else { met.append(bar, pk); f.append(i, met); parent.append(f, v); ui.meters.push({ an, bar, pk, hold: 0 }); }
      ui.refreshers.push(() => { i.value = dbToPos(get(), S.curve); v.textContent = fmtDb(get()); });
    }
    function jack(parent, id, dir, label, big) { if (!host.ui || !host.ui.jack) return; const j = host.ui.jack(self, parent, id, dir, label); if (big) j.classList.add('big'); return j; }
    function eqBlock(s, c) { const eqb = el('div', 'mx2-eq'); s.appendChild(eqb); const arr = S.eq === 5 ? 'eq5' : 'eq3'; (S.eq === 5 ? EQ5 : EQ3).forEach((b, q) => mini(eqb, T[b.lab], [-15, 15, 0.5], () => c[arr][q], v => c[arr][q] = v, fmtDb, 0)); }
    function paintMsg() { if (ui && ui.msg) ui.msg.textContent = msg; }
    function refresh() { if (ui) ui.refreshers.forEach(r => r()); }

    function render() {
      if (!root) return; root.innerHTML = ''; hostMeters.forEach(m => { try { m.destroy(); } catch (e) {} }); hostMeters = []; ui = { refreshers: [], meters: [], trims: [], msg: null };
      const st = el('style'); st.textContent = CSS; root.appendChild(st);
      const app = el('div', 'mx2'); root.appendChild(app);
      // configuration row
      const cfg = el('div', 'mx2-cfg'); app.appendChild(cfg);
      const numIn = (label, v, mn, mx, on) => { const l = el('label'), i = el('input'); i.type = 'number'; i.min = mn; i.max = mx; i.value = v; i.onchange = () => on(+i.value); l.append(label, i); cfg.appendChild(l); };
      numIn(T.chs, S.nCh, 1, MAXCH, v => configure(v, S.nGrp, true));
      numIn(T.grps, S.nGrp, 0, MAXGRP, v => configure(S.nCh, v, true));
      { const l = el('label'), s = el('select'); [[3, T.bands3], [5, T.bands5]].forEach(([v, t]) => { const o = el('option', null, t); o.value = v; s.appendChild(o); }); s.value = S.eq; s.style.width = 'auto';
        s.onchange = () => { S.eq = +s.value; rebuildAllEq(); applyAll(); paramsChanged(); render(); }; l.append(T.eq, s); cfg.appendChild(l); }
      cfg.appendChild(el('span', 'sep'));
      { const b = el('button', null, T.match); b.title = T.matchT; b.onclick = startMeasure; cfg.appendChild(b); }
      { const l = el('label'), c = el('input'); c.type = 'checkbox'; c.checked = S.auto; c.onchange = () => { S.auto = c.checked; chans.forEach(n => n.ema = null); }; l.append(c, T.cont); l.title = T.contT; cfg.appendChild(l); }
      { const l = el('label'), i = el('input'), o = el('b', null, S.target + ' dB'); i.type = 'range'; i.min = -30; i.max = -6; i.step = 1; i.value = S.target; i.setAttribute('aria-label', T.goalA);
        i.oninput = () => { S.target = +i.value; o.textContent = S.target + ' dB'; }; o.style.fontWeight = '400'; o.style.color = 'var(--fg)'; l.append(T.goal, i, o); cfg.appendChild(l); }
      { const l = el('label'), i = el('input'), o = el('b', null, T.curveAt(Math.round(dbToPos(0, S.curve) * 100))); i.type = 'range'; i.min = 1; i.max = 5; i.step = 0.1; i.value = S.curve; i.setAttribute('aria-label', T.curveA); l.title = T.curveT;
        i.oninput = () => { S.curve = +i.value; o.textContent = T.curveAt(Math.round(dbToPos(0, S.curve) * 100)); refresh(); }; o.style.fontWeight = '400'; o.style.color = 'var(--fg)'; l.append(T.curve, i, o); cfg.appendChild(l); }
      ui.msg = el('span', 'msg', msg); cfg.appendChild(ui.msg);
      cfg.appendChild(el('span', 'sep'));
      { const b = el('div', 'mx2-bun'); jack(b, 'multi', 'in', T.bunIn); jack(b, 'post', 'out', T.bunOut); jack(b, 'mod', 'in', 'Mod'); cfg.appendChild(b);
        const l = el('label'), c = el('input'); c.type = 'checkbox'; c.checked = S.bundleAll; c.onchange = () => { S.bundleAll = c.checked; announce(); }; l.append(c, T.bunAll); l.title = T.bunAllT; cfg.appendChild(l); }
      // desk: channels | groups | master
      const desk = el('div', 'mx2-desk'); app.appendChild(desk);
      const secCh = el('div', 'mx2-sec ch'); secCh.appendChild(el('span', 'tag', T.chs)); desk.appendChild(secCh);
      chans.forEach((n, i) => {
        const c = S.ch[i], k = i + 1, s = el('div', 'mx2-strip' + (c.solo ? ' solo' : '')); secCh.appendChild(s);
        const head = el('div', 'mx2-head'); jack(head, 'ch' + k, 'in', String(k), true); s.appendChild(head);
        { const nm = el('input', 'nm'); nm.type = 'text'; nm.maxLength = 24; nm.value = c.name; nm.placeholder = chName(i); nm.title = T.chNameT; nm.setAttribute('aria-label', T.chNameA(k));
          nm.oninput = () => { c.name = nm.value.trim(); announce(); }; nm.addEventListener('pointerdown', e => e.stopPropagation()); s.appendChild(nm);
          ui.refreshers.push(() => { if (document.activeElement !== nm) nm.value = c.name; nm.placeholder = (srcOf(c.src) || {}).name || T.chN(k); }); }
        { const sel = el('select', 'src'); sel.setAttribute('aria-label', T.srcA(k)); sel.title = T.srcT(k);
          const fill = () => { sel.innerHTML = ''; const o0 = el('option', null, T.cable); o0.value = ''; sel.appendChild(o0);
            bundlesIn.forEach(b => { const g = el('optgroup'); g.label = b.source.name + (b.label && b.label !== b.source.name ? ' · ' + b.label : ''); b.channels.forEach(ch => { const o = el('option', null, ch.name); o.value = b.key + '|' + ch.id; g.appendChild(o); }); sel.appendChild(g); });
            if (c.src && !srcOf(c.src)) { const o = el('option', null, T.lost); o.value = c.src; sel.appendChild(o); }
            sel.value = c.src; sel.className = 'src' + (!c.src ? ' none' : srcOf(c.src) ? '' : ' lost'); };
          fill(); sel.onchange = () => { c.src = sel.value; connectSrc(i); sel.className = 'src' + (!c.src ? ' none' : ''); refresh(); announce(); }; s.appendChild(sel); ui.refreshers.push(fill); }
        const io = el('div', 'mx2-io'); jack(io, 's' + k, 'out', T.jSend); jack(io, 'r' + k, 'in', T.jRet); s.appendChild(io);
        ui.trims.push(mini(s, T.trim, [-24, 24, 0.5], () => c.trim, v => c.trim = v, fmtDb, 0, 'trim'));
        eqBlock(s, c);
        mini(s, T.send, [0, 1, 0.01], () => c.send, v => c.send = v, pct, 0);
        mini(s, T.ret, [0, 1, 0.01], () => c.ret, v => c.ret = v, pct, 0.8);
        const g = el('select'); g.setAttribute('aria-label', T.toA(k)); { const o = el('option', null, T.toM); o.value = 0; o.title = T.toMT; g.appendChild(o); }
        for (let q = 1; q <= S.nGrp; q++) { const o = el('option', null, '→ ' + (S.grp[q - 1].name || 'G' + q)); o.value = q; o.title = T.toT(grpName(q - 1)); g.appendChild(o); }
        g.value = c.grp <= S.nGrp ? c.grp : 0; g.onchange = () => { c.grp = +g.value; route(i); }; s.appendChild(g); ui.refreshers.push(() => { [...g.options].forEach(o => { const q = +o.value; if (q) { o.textContent = '→ ' + (S.grp[q - 1].name || 'G' + q); o.title = T.toT(grpName(q - 1)); } }); g.value = c.grp <= S.nGrp ? c.grp : 0; });
        mini(s, T.pan, [-1, 1, 0.01], () => c.pan, v => c.pan = v, v => Math.abs(v) < 0.02 ? 'C' : (v < 0 ? 'L' : 'R') + Math.round(Math.abs(v) * 100), 0);
        const bot = el('div', 'mx2-bottom'); s.appendChild(bot); fader(bot, () => c.lvl, v => c.lvl = v, n.meter, 'met.t' + k);
        const ms = el('div', 'mx2-ms'), bm = el('button', 'm', 'M'), bs = el('button', 's', 'S'); bm.title = T.mute; bs.title = T.solo;
        bm.onclick = () => { c.mute = !c.mute; bm.classList.toggle('on', c.mute); applyAll(); }; bs.onclick = () => { c.solo = !c.solo; bs.classList.toggle('on', c.solo); s.classList.toggle('solo', c.solo); applyAll(); };
        ui.refreshers.push(() => { bm.classList.toggle('on', c.mute); bs.classList.toggle('on', c.solo); s.classList.toggle('solo', c.solo); });
        ms.append(bm, bs); bot.appendChild(ms);
        tagCtl(s, 'T' + k);
      });
      if (S.nGrp) {
        const secG = el('div', 'mx2-sec grp'); secG.appendChild(el('span', 'tag', T.grps)); desk.appendChild(secG);
        groups.forEach((n, gi) => {
          const c = S.grp[gi], k = gi + 1, s = el('div', 'mx2-strip'); secG.appendChild(s);
          const head = el('div', 'mx2-head'); head.appendChild(el('span', 'lbl', 'G' + k)); s.appendChild(head);
          { const nm = el('input', 'nm'); nm.type = 'text'; nm.maxLength = 24; nm.value = c.name; nm.placeholder = T.grpN(k); nm.title = T.grpNameT; nm.setAttribute('aria-label', T.grpNameA(k));
            nm.oninput = () => { c.name = nm.value.trim(); refresh(); announce(); }; nm.addEventListener('pointerdown', e => e.stopPropagation()); s.appendChild(nm); }
          const io = el('div', 'mx2-io'); jack(io, 'gs' + k, 'out', T.jSend); jack(io, 'gr' + k, 'in', T.jRet); s.appendChild(io);
          eqBlock(s, c);
          mini(s, T.send, [0, 1, 0.01], () => c.send, v => c.send = v, pct, 0);
          mini(s, T.ret, [0, 1, 0.01], () => c.ret, v => c.ret = v, pct, 0.8);
          const bot = el('div', 'mx2-bottom'); s.appendChild(bot); fader(bot, () => c.lvl, v => c.lvl = v, n.meter, 'met.g' + k);
          const ms = el('div', 'mx2-ms'), bm = el('button', 'm', 'M'); bm.title = T.mute; bm.onclick = () => { c.mute = !c.mute; bm.classList.toggle('on', c.mute); applyAll(); };
          ui.refreshers.push(() => bm.classList.toggle('on', c.mute)); ms.appendChild(bm); bot.appendChild(ms);
          tagCtl(s, 'G' + k);
        });
      }
      const secM = el('div', 'mx2-sec mst'); secM.appendChild(el('span', 'tag', T.master)); desk.appendChild(secM);
      { const c = S.master, s = el('div', 'mx2-strip'); s.style.width = '76px'; secM.appendChild(s);
        const head = el('div', 'mx2-head'); jack(head, 'out', 'out', T.jOut, true); s.appendChild(head);
        const io = el('div', 'mx2-io'); jack(io, 'ms', 'out', T.jSend); jack(io, 'mr', 'in', T.jRet); s.appendChild(io);
        eqBlock(s, c);
        mini(s, T.send, [0, 1, 0.01], () => c.send, v => c.send = v, pct, 0);
        mini(s, T.ret, [0, 1, 0.01], () => c.ret, v => c.ret = v, pct, 0.8);
        const bot = el('div', 'mx2-bottom'); s.appendChild(bot); fader(bot, () => c.lvl, v => c.lvl = v, mMeter, 'met.master'); bot.appendChild(el('div', 'mx2-ms')); tagCtl(s, T.master); }
    }

    self = {
      inputs, outputs,
      bundles: { post: postBundle },
      onBundle(port, key, b) {
        if (port !== 'multi') return;
        if (b) { bundlesIn.set(key, b); autoAssign(b); } else { bundlesIn.delete(key); seen.delete(key); }
        chans.forEach((n, i) => connectSrc(i)); refresh(); announce();
      },
      params() { return paramDefs().map(d => ({ ...d })); },
      modulate(offsets) {
        const known = new Set(paramDefs().map(d => d.id)), next = {};
        for (const k in offsets || {}) { const o = offsets[k]; if (known.has(k) && typeof o === 'number' && Number.isFinite(o) && o) next[k] = clamp(o, -1, 1); }
        const same = Object.keys(next).length === Object.keys(mod).length && Object.keys(next).every(k => mod[k] === next[k]);
        if (same) return;
        for (const k in mod) delete mod[k]; Object.assign(mod, next); applyAll();
      },
      mount(e) { root = el('div'); e.appendChild(root); render(); lastT = performance.now(); startLoops(); },
      unmount() { stopLoops(); hostMeters.forEach(m => { try { m.destroy(); } catch (e) {} }); hostMeters = []; root = null; ui = null; },
      getPreset() { const s = self.getState(); s.ch.forEach(c => { delete c.src; }); return s; },
      setPreset(p) { p = p && typeof p === 'object' ? JSON.parse(JSON.stringify(p)) : {}; p.ch = Array.from({ length: MAXCH }, (_, i) => ({ ...((Array.isArray(p.ch) && p.ch[i] && typeof p.ch[i] === 'object') ? p.ch[i] : chDef()), src: S.ch[i].src })); self.setState(p); },
      getState() {
        return { v: 2, nCh: S.nCh, nGrp: S.nGrp, eq: S.eq, target: S.target, auto: S.auto, bundleAll: S.bundleAll, curve: S.curve,
          ch: S.ch.slice(0, S.nCh).map(c => ({ ...c, eq3: c.eq3.slice(), eq5: c.eq5.slice() })), grp: S.grp.slice(0, S.nGrp).map(c => ({ ...c, eq3: c.eq3.slice(), eq5: c.eq5.slice() })), master: { ...S.master, eq3: S.master.eq3.slice(), eq5: S.master.eq5.slice() } };
      },
      setState(s) {
        s = s && typeof s === 'object' ? s : {};
        if (s.v !== 2 && Array.isArray(s.ch) && s.nCh === undefined) {   // state of mixer 1.x: linear levels, no groups
          const toDb = g => (typeof g === 'number' && g > 0 ? Math.round(20 * Math.log10(g) * 2) / 2 : -60);
          s = { nCh: Math.max(4, s.ch.length), nGrp: 0, ch: s.ch.map(c => { c = c || {}; return { lvl: toDb(c.lvl ?? 0.8), pan: c.pan ?? 0, mute: !!c.mute, solo: !!c.solo }; }), master: { lvl: toDb(s.master ?? 1) } };
        }
        const eqWas = S.eq;
        S.eq = s.eq === 5 ? 5 : 3; S.target = num(s.target, -30, -6, DEF.target); S.auto = bool(s.auto, DEF.auto); S.bundleAll = bool(s.bundleAll, DEF.bundleAll); S.curve = num(s.curve, 1, 5, DEF.curve);
        S.ch = Array.from({ length: MAXCH }, (_, i) => cleanCh(Array.isArray(s.ch) ? s.ch[i] : null));
        S.grp = Array.from({ length: MAXGRP }, (_, i) => cleanGrp(Array.isArray(s.grp) ? s.grp[i] : null));
        S.master = cleanMst(s.master);
        if (eqWas !== S.eq) rebuildAllEq();
        configure(Math.round(num(s.nCh, 1, MAXCH, DEF.nCh)), Math.round(num(s.nGrp, 0, MAXGRP, DEF.nGrp)), true);
        chans.forEach((n, i) => { route(i); connectSrc(i); });
        applyAll(); announce(); if (root) render();
      },
      destroy() {
        stopLoops(); hostMeters.forEach(m => { try { m.destroy(); } catch (e) {} }); hostMeters = []; clearTimeout(bundleT); clearInterval(guardT);
        chans.forEach(n => { if (n.srcNode) { try { n.srcNode.disconnect(n.in); } catch (e) {} n.srcNode = null; } kill([n.in, n.trim, ...n.eq, n.fader, n.pan, n.mute, n.send, n.retIn, n.ret, n.tap]); });
        groups.forEach(n => kill([n.sum, ...n.eq, n.post, n.fader, n.mute, n.send, n.retIn, n.ret, n.tap]));
        kill([mSum, ...M.eq, mPost, mFader, mSend, mRetIn, mRet, lim, out]);
      },
    };
    return self;
  },
};
