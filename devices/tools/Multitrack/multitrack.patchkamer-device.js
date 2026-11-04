// SPDX-License-Identifier: AGPL-3.0-or-later
// 1.11.0 — Patchkamer contract v1.11. Tweetalig (host.lang, poortnaam per taal in i18n). Tekenen via host.frame (de tekenpoort-omzetting is weg).
//          setState volgt §13: onbekende velden weg, getallen binnen hun bereik, ongeldige waarden de standaard; een preset houdt de bronkeuzes van de sporen.
//          De standaardnaam van de sessie is nu taalneutraal (Session). De opname (worklet), de WAV- en de zip-uitvoer zijn ongewijzigd.
// 1.8.0 — Patchkamer contract v1.8: dubbelklik = beginwaarde, klik op het getal = waarde typen, en (instelbaar) draaiknop. Tekenpoort.
// 1.0.1 — Presets bewaren sporen, namen, arm en WAV-formaat, maar niet welke bron op welk spoor staat.
// 1.0.0 — Eerste versie.
// Multitrack: neemt tot 16 sporen tegelijk op, sample-gelijk, als WAV (16 of 24 bit, of 32 bit float).
// Ingang is een bundel (dikke groene kabel), bijvoorbeeld "Kanalen uit" van de Mixer of "Losse uit" van de
// drumcomputer. Nieuwe kanalen worden vanzelf op vrije sporen gezet; per spoor kies je de bron, naam en arm.
// Elke take blijft deze sessie in het geheugen; bewaar alles in één .zip (een stereo-WAV per spoor) of per spoor.
// Het geluid wordt niet veranderd en loopt niet door: dit apparaat luistert alleen mee.

const MAXTR = 16;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const fmtT = s => { s = Math.max(0, Math.floor(s)); return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); };
const safe = t => String(t || '').replace(/[\\/:*?"<>|\u0000-\u001f]+/g, ' ').replace(/\s+/g, ' ').trim();

// ---------- AudioWorklet: vangt alle sporen in hetzelfde blok, dus sample-gelijk ----------
const WORKLET = `
class PkMultitrack extends AudioWorkletProcessor {
  constructor(o) {
    super(); this.n = o.processorOptions.n; this.blk = 8192; this.rec = false; this.pending = false; this.at = 0; this.mask = [];
    this.pk = new Float32Array(this.n); this.pkAt = 0; this.alloc();
    this.port.onmessage = e => { const d = e.data;
      if (d.cmd === 'start') { this.mask = d.mask; this.at = d.at || 0; this.pending = true; this.rec = false; this.frames = 0; this.alloc(); }
      else if (d.cmd === 'stop') { if (this.rec || this.pending) { this.flush(); this.port.postMessage({ done: true, frames: this.frames || 0 }); } this.rec = false; this.pending = false; } };
  }
  alloc() { this.L = []; this.R = []; for (let i = 0; i < this.n; i++) { this.L.push(this.mask[i] ? new Float32Array(this.blk) : null); this.R.push(this.mask[i] ? new Float32Array(this.blk) : null); } this.pos = 0; }
  flush() { if (!this.pos) return; const tr = [], L = [], R = [], tx = [];
    for (let i = 0; i < this.n; i++) if (this.L[i]) { tr.push(i); const l = this.L[i].slice(0, this.pos), r = this.R[i].slice(0, this.pos); L.push(l); R.push(r); tx.push(l.buffer, r.buffer); }
    this.port.postMessage({ chunk: { tr, L, R, len: this.pos } }, tx); this.pos = 0; }
  process(inputs) {
    const q = 128;
    for (let i = 0; i < this.n; i++) { const inp = inputs[i], l = inp && inp[0]; if (!l) continue; const r = inp[1] || l; let p = this.pk[i];
      for (let k = 0; k < l.length; k++) { const a = l[k] < 0 ? -l[k] : l[k], b = r[k] < 0 ? -r[k] : r[k]; if (a > p) p = a; if (b > p) p = b; } this.pk[i] = p; }
    this.pkAt += q; if (this.pkAt >= 2048) { this.port.postMessage({ pk: Array.from(this.pk) }); this.pk.fill(0); this.pkAt = 0; }
    let start = 0;
    if (this.pending && currentTime + q / sampleRate > this.at) { start = clamp(Math.round((this.at - currentTime) * sampleRate), 0, q); this.pending = false; this.rec = true; }
    if (!this.rec) return true;
    for (let k = start; k < q; k++) {
      for (let i = 0; i < this.n; i++) { const B = this.L[i]; if (!B) continue; const inp = inputs[i], l = inp && inp[0], r = inp && (inp[1] || inp[0]); B[this.pos] = l ? l[k] : 0; this.R[i][this.pos] = r ? r[k] : 0; }
      this.pos++; this.frames++; if (this.pos === this.blk) this.flush();
    }
    return true;
  }
}
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
registerProcessor('pk-multitrack', PkMultitrack);`;

// ---------- WAV ----------
function wavBlob(Ls, Rs, frames, sr, bits) {
  const float = bits === 32, bps = bits / 8, ch = 2, dataLen = frames * ch * bps, fact = float ? 12 : 0, hdr = 44 + fact;
  const buf = new ArrayBuffer(hdr + dataLen), v = new DataView(buf); let o = 0;
  const str = t => { for (let i = 0; i < t.length; i++) v.setUint8(o++, t.charCodeAt(i)); }, u32 = x => { v.setUint32(o, x, true); o += 4; }, u16 = x => { v.setUint16(o, x, true); o += 2; };
  str('RIFF'); u32(hdr - 8 + dataLen); str('WAVE');
  str('fmt '); u32(16); u16(float ? 3 : 1); u16(ch); u32(sr); u32(sr * ch * bps); u16(ch * bps); u16(bits);
  if (float) { str('fact'); u32(4); u32(frames); }
  str('data'); u32(dataLen);
  const k16 = 32767, k24 = 8388607;
  for (let c = 0; c < Ls.length; c++) { const L = Ls[c], R = Rs[c];
    for (let i = 0; i < L.length; i++) {
      const a = L[i], b = R[i];
      if (float) { v.setFloat32(o, a, true); v.setFloat32(o + 4, b, true); o += 8; }
      else if (bits === 16) { v.setInt16(o, Math.round(clamp(a, -1, 1) * k16), true); v.setInt16(o + 2, Math.round(clamp(b, -1, 1) * k16), true); o += 4; }
      else { const x = Math.round(clamp(a, -1, 1) * k24), y = Math.round(clamp(b, -1, 1) * k24);
        v.setUint8(o, x & 255); v.setUint8(o + 1, (x >> 8) & 255); v.setUint8(o + 2, (x >> 16) & 255);
        v.setUint8(o + 3, y & 255); v.setUint8(o + 4, (y >> 8) & 255); v.setUint8(o + 5, (y >> 16) & 255); o += 6; }
    } }
  return new Blob([buf], { type: 'audio/wav' });
}

// ---------- ZIP (opgeslagen, niet gecomprimeerd: WAV comprimeert toch slecht) ----------
let CRC = null;
function crc32(u8) { if (!CRC) { CRC = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; CRC[n] = c >>> 0; } }
  let c = 0xFFFFFFFF; for (let i = 0; i < u8.length; i++) c = CRC[(c ^ u8[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
async function zipBlob(files) {   // files: [{name, blob}]
  const parts = [], central = []; let off = 0; const enc = new TextEncoder();
  const d = new Date(), dt = ((d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1)) & 0xFFFF, dd = (((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate()) & 0xFFFF;
  for (const f of files) {
    const data = new Uint8Array(await f.blob.arrayBuffer()), name = enc.encode(f.name), crc = crc32(data);
    const lh = new DataView(new ArrayBuffer(30));
    lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint16(6, 0x0800, true); lh.setUint16(8, 0, true); lh.setUint16(10, dt, true); lh.setUint16(12, dd, true);
    lh.setUint32(14, crc, true); lh.setUint32(18, data.length, true); lh.setUint32(22, data.length, true); lh.setUint16(26, name.length, true); lh.setUint16(28, 0, true);
    parts.push(lh.buffer, name, data);
    const ch = new DataView(new ArrayBuffer(46));
    ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true); ch.setUint16(8, 0x0800, true); ch.setUint16(10, 0, true); ch.setUint16(12, dt, true); ch.setUint16(14, dd, true);
    ch.setUint32(16, crc, true); ch.setUint32(20, data.length, true); ch.setUint32(24, data.length, true); ch.setUint16(28, name.length, true); ch.setUint32(42, off, true);
    central.push(ch.buffer, name); off += 30 + name.length + data.length;
  }
  const cdLen = central.reduce((a, b) => a + (b.byteLength), 0), end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true); end.setUint16(8, files.length, true); end.setUint16(10, files.length, true); end.setUint32(12, cdLen, true); end.setUint32(16, off, true);
  return new Blob([...parts, ...central, end.buffer], { type: 'application/zip' });
}

const CSS = `
.mt{display:grid;gap:8px;font-size:11px;min-width:0}
.mt-top{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:10px;align-items:center}
.mt-rec{font-family:var(--disp);font-size:13px;letter-spacing:.08em;padding:6px 12px;min-width:118px}
.mt-rec.on{background:var(--stop);border-color:var(--stop);color:#fff}
.mt-time{font-family:var(--lcd-font,var(--mono));font-size:18px;font-variant-numeric:tabular-nums;background:var(--well);color:var(--well-fg);padding:2px 8px;border-radius:3px;text-align:right;min-width:7ch}
.mt-info{font-size:10px;color:var(--muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mt-cfg{display:flex;flex-wrap:wrap;gap:6px 14px;align-items:center;font-size:10px;color:var(--muted);letter-spacing:.06em;text-transform:uppercase}
.mt-cfg label{display:flex;gap:5px;align-items:center;cursor:pointer}
.mt-cfg input[type=number]{width:46px;background:var(--field,var(--card-2));color:var(--field-fg,var(--fg));border:1px solid var(--line);border-radius:3px;font-family:var(--mono);font-size:11px;padding:2px 4px}
.mt-cfg select{width:auto}
.mt-trs{display:grid;gap:3px}
.mt-tr{display:grid;grid-template-columns:22px 28px minmax(60px,1fr) minmax(70px,1.2fr) minmax(40px,.8fr);gap:6px;align-items:center;padding:2px 4px;border-radius:3px;background:var(--card-2);min-width:0}
.mt-tr .no{font-family:var(--disp);font-weight:700;font-size:13px;text-align:center;color:var(--muted)}
.mt-tr .arm{padding:0;width:24px;height:20px;border-radius:50%;font-size:9px;line-height:1}
.mt-tr .arm.on{background:var(--stop);border-color:var(--stop);color:#fff}
.mt-tr input.nm{min-width:0;width:100%;box-sizing:border-box;background:transparent;border:1px solid transparent;border-bottom-color:var(--line);color:var(--fg);font-family:var(--mono);font-size:11px;padding:2px 3px}
.mt-tr input.nm:focus{outline:none;border-color:var(--audio);background:var(--card)}
.mt-tr select{min-width:0;width:100%;font-size:10px}
.mt-tr select.none{color:var(--muted)} .mt-tr select.lost{color:var(--stop)}
.mt-met{height:8px;background:var(--well);border:1px solid var(--line);border-radius:2px;overflow:hidden;position:relative}
.mt-met i{position:absolute;left:0;top:0;bottom:0;width:0;background:linear-gradient(90deg,var(--audio) 0%,var(--audio) 65%,var(--go) 85%,var(--stop) 98%)}
.mt-met.clip{border-color:var(--stop)}
.mt-takes{display:grid;gap:4px}
.mt-take{display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:6px;align-items:center;border:1px solid var(--line);border-radius:3px;padding:4px 6px;background:var(--card-2)}
.mt-take details{grid-column:1/-1} .mt-take summary{font-size:10px}
.mt-take .wavs{display:flex;flex-wrap:wrap;gap:4px;margin-top:4px}
.mt-take button,.mt-takes button{font-size:10px;padding:2px 7px}
.mt-msg{font-size:10px;color:var(--muted);min-height:13px}
`;


// Teksten per taal (host.lang): Nederlandse bron, Engels als alternatief; onbekende taal = Engels
const TXT = {
  nl: { locale: 'nl-NL', rec: '● Opnemen', stop: '■ Stop', trN: n => 'Spoor ' + n,
    noRec: 'Opnemen lukt hier niet: ', noArm: 'Geen sporen gearmd (●).', took: (n, k, t) => `Take ${n}: ${k} sporen, ${t}`, nothing: 'Niets opgenomen.',
    declined: 'Niet bewaard.', saved: f => 'Bewaard: ' + f, saveFail: 'Bewaren mislukt: ', making: 'WAV-bestanden maken…',
    arm: 'opnemen op dit spoor', armA: i => `arm spoor ${i}`, nameA: i => `naam spoor ${i}`, nameT: 'naam van het spoor (wordt de bestandsnaam)', srcA: i => `bron spoor ${i}`,
    none: '— geen', lost: '(niet verbonden)', sessA: 'naam van de sessie', sessT: 'naam van de sessie (begin van de bestandsnaam)',
    info: (a, n, f, sr, mb) => `${a} van ${n} sporen gearmd · ${f} · ${sr} kHz · ± ${mb} per minuut`,
    noTakes: 'Nog geen takes. Takes blijven tot je de pagina sluit; bewaar wat je wilt houden.',
    takeRow: (n, d, k, t) => `Take ${n} · ${d} · ${k} sporen · ${t}`, zip: 'Bewaar alles (.zip)', zipT: 'een stereo-WAV per spoor in één zip',
    drop: 'take weggooien (geheugen vrijmaken)', dropA: 'take weggooien', perTr: m => `Per spoor (${m} in geheugen)`, from: 'bron: ',
    tracks: 'Sporen', wav: 'WAV', withT: 'met start/stop van de klok', autoL: 'nieuwe kanalen vanzelf toewijzen', autoT: 'een nieuwe bundel komt op de vrije sporen; zo nodig komen er sporen bij (tot 16)', armAll: 'Alles armen' },
  en: { locale: 'en-GB', rec: '● Record', stop: '■ Stop', trN: n => 'Track ' + n,
    noRec: 'Recording is not possible here: ', noArm: 'No tracks armed (●).', took: (n, k, t) => `Take ${n}: ${k} tracks, ${t}`, nothing: 'Nothing recorded.',
    declined: 'Not saved.', saved: f => 'Saved: ' + f, saveFail: 'Saving failed: ', making: 'Making WAV files…',
    arm: 'record on this track', armA: i => `arm track ${i}`, nameA: i => `name of track ${i}`, nameT: 'name of the track (becomes the file name)', srcA: i => `source of track ${i}`,
    none: '— none', lost: '(not connected)', sessA: 'name of the session', sessT: 'name of the session (start of the file name)',
    info: (a, n, f, sr, mb) => `${a} of ${n} tracks armed · ${f} · ${sr} kHz · ± ${mb} per minute`,
    noTakes: 'No takes yet. Takes stay until you close the page; save what you want to keep.',
    takeRow: (n, d, k, t) => `Take ${n} · ${d} · ${k} tracks · ${t}`, zip: 'Save all (.zip)', zipT: 'one stereo WAV per track in a single zip',
    drop: 'discard take (frees memory)', dropA: 'discard take', perTr: m => `Per track (${m} in memory)`, from: 'source: ',
    tracks: 'Tracks', wav: 'WAV', withT: 'with clock start/stop', autoL: 'assign new channels automatically', autoT: 'a new bundle goes onto the free tracks; tracks are added if needed (up to 16)', armAll: 'Arm all' },
};
const num = (v, a, b, d) => (typeof v === 'number' && Number.isFinite(v) ? clamp(v, a, b) : d);
const bool = (v, d) => (typeof v === 'boolean' ? v : d);
const str = (v, n, d) => (typeof v === 'string' ? v.slice(0, n) : d);
// terugval voor een host zonder host.frame (contract §12b)
const tekenLus = (host, inst, cb, fps) => {
  if (host && typeof host.frame === 'function') return host.frame(inst, cb, fps);
  let raf = 0, last = 0, stop = false;
  const f = t => { if (stop) return; raf = requestAnimationFrame(f); if (document.hidden || t - last < 1000 / fps - 2) return; last = t; cb(t); };
  raf = requestAnimationFrame(f); return () => { stop = true; cancelAnimationFrame(raf); };
};

export default {
  id: 'nl.patchkamer.multitrack',
  name: 'Multitrack',
  version: '1.11.0',
  kind: 'utility',
  category: 'tool',
  ui: { width: 560, minWidth: 380 },
  i18n: { en: { ports: { in: 'Bundle' } } },
  ports: { audioIn: [], audioOut: [], eventIn: [], eventOut: [], multiIn: [{ id: 'in', name: 'Bundel' }] },

  create(ctx, host) {
    const T = TXT[host && host.lang] || TXT.en;
    const trDef = () => ({ name: '', src: '', arm: true });
    const DEF = () => ({ name: 'Session', nTr: 8, bits: 24, withTransport: false, auto: true, tr: Array.from({ length: MAXTR }, trDef) });
    const S = DEF();
    const tin = Array.from({ length: MAXTR }, () => ctx.createGain());
    const srcNode = new Array(MAXTR).fill(null);
    const bundles = new Map();   // sleutel -> bundel
    let node = null, ready = null, rec = null, takes = [], nTake = 0, el = null, f = {}, stopDraw = null, dead = false, pk = new Array(MAXTR).fill(0), hold = new Array(MAXTR).fill(0), clipT = new Array(MAXTR).fill(0);
    let self;

    // ---------- worklet ----------
    function ensureNode() {
      if (ready) return ready;
      const load = host.loadWorklet ? host.loadWorklet('pk-multitrack', WORKLET)
        : ctx.audioWorklet.addModule(URL.createObjectURL(new Blob([WORKLET], { type: 'text/javascript' })));
      ready = Promise.resolve(load).then(() => {
        if (dead) return null;
        node = new AudioWorkletNode(ctx, 'pk-multitrack', { numberOfInputs: MAXTR, numberOfOutputs: 0, channelCount: 2, channelCountMode: 'explicit', channelInterpretation: 'speakers', processorOptions: { n: MAXTR } });
        node.port.onmessage = onMsg; tin.forEach((g, i) => g.connect(node, 0, i)); return node;
      });
      ready.catch(e => { ready = null; msg(T.noRec + e.message); });
      return ready;
    }
    function onMsg(e) {
      const d = e.data;
      if (d.pk) { for (let i = 0; i < MAXTR; i++) { pk[i] = Math.max(pk[i], d.pk[i]); if (d.pk[i] >= 0.999) clipT[i] = performance.now(); } return; }
      if (d.chunk && rec) { const c = d.chunk; c.tr.forEach((i, j) => { const t = rec.tracks[i]; if (t) { t.L.push(c.L[j]); t.R.push(c.R[j]); } }); rec.frames += c.len; return; }
      if (d.done && rec) finishTake(d.frames);
    }

    // ---------- bronnen ----------
    const srcOf = src => { if (!src) return null; const i = src.lastIndexOf('|'); const b = bundles.get(src.slice(0, i)); return b ? b.channels.find(c => c.id === src.slice(i + 1)) || null : null; };
    const srcLabel = src => { if (!src) return ''; const i = src.lastIndexOf('|'); const b = bundles.get(src.slice(0, i)); const c = srcOf(src); return b && c ? b.source.name + ' · ' + c.name : ''; };
    const trName = i => S.tr[i].name || (srcOf(S.tr[i].src) || {}).name || T.trN(i + 1);
    function connect(i) {
      const want = i < S.nTr ? srcOf(S.tr[i].src) : null, n = want ? want.node : null;
      if (srcNode[i] === n) return;
      if (srcNode[i]) { try { srcNode[i].disconnect(tin[i]); } catch (e) {} }
      srcNode[i] = n; if (n) { try { n.connect(tin[i]); } catch (e) { srcNode[i] = null; } }
    }
    const connectAll = () => { for (let i = 0; i < MAXTR; i++) connect(i); };
    const seen = new Map();   // sleutel -> kanaal-id's die we al zagen: alleen nieuwe kanalen worden vanzelf toegewezen
    function autoAssign(b, all) {
      const prev = all ? new Set() : (seen.get(b.key) || new Set()); seen.set(b.key, new Set(b.channels.map(c => c.id)));
      if (!S.auto) return;
      const used = new Set(S.tr.slice(0, S.nTr).map(t => t.src));
      const todo = b.channels.filter(c => !prev.has(c.id) && !used.has(b.key + '|' + c.id)); if (!todo.length) return;
      const free = []; for (let i = 0; i < S.nTr; i++) if (!S.tr[i].src) free.push(i);
      while (free.length < todo.length && S.nTr < MAXTR) { free.push(S.nTr); S.nTr++; }
      todo.forEach((c, k) => { const i = free[k]; if (i != null) S.tr[i].src = b.key + '|' + c.id; });
    }

    // ---------- opnemen ----------
    function start(at) {
      if (rec || dead) return;
      ensureNode().then(n => {
        if (!n || rec) return;
        const mask = Array.from({ length: MAXTR }, (_, i) => i < S.nTr && S.tr[i].arm);
        if (!mask.some(Boolean)) { msg(T.noArm); return; }
        rec = { t0: performance.now(), frames: 0, sr: ctx.sampleRate, tracks: mask.map((m, i) => m ? { i, name: trName(i), from: srcLabel(S.tr[i].src), L: [], R: [] } : null) };
        n.port.postMessage({ cmd: 'start', mask, at: at || ctx.currentTime + 0.02 });
        msg(''); paint();
      });
    }
    function stop() { if (rec && node) node.port.postMessage({ cmd: 'stop' }); }
    function finishTake(frames) {
      const r = rec; rec = null; if (!r) return;
      const tracks = r.tracks.filter(Boolean); frames = Math.min(frames || r.frames, ...tracks.map(t => t.L.reduce((a, b) => a + b.length, 0)));
      if (frames > 0) { nTake++; takes.unshift({ n: nTake, frames, sr: r.sr, dur: frames / r.sr, at: new Date(), tracks }); }
      paint(); msg(frames > 0 ? T.took(nTake, tracks.length, fmtT(frames / r.sr)) : T.nothing);
    }
    const bytesOf = tk => tk.frames * tk.tracks.length * 8;
    const mb = b => (b / 1048576).toFixed(b > 104857600 ? 0 : 1) + ' MB';
    const base = () => safe(S.name) || 'Session';
    const fileOf = (tk, t) => `${String(t.i + 1).padStart(2, '0')} ${safe(t.name) || T.trN(t.i + 1)}.wav`;
    async function save(filename, blob) {
      try {
        if (host && typeof host.saveFile === 'function') { const r = await host.saveFile(filename, blob); msg(r === 'declined' ? T.declined : T.saved(filename)); return; }
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000); msg(T.saved(filename));
      } catch (e) { msg(T.saveFail + e.message); }
    }
    const trackWav = (tk, t) => wavBlob(t.L, t.R, tk.frames, tk.sr, S.bits);
    async function saveZip(tk) {
      msg(T.making); await new Promise(r => setTimeout(r, 20));
      const files = tk.tracks.map(t => ({ name: fileOf(tk, t), blob: trackWav(tk, t) }));
      await save(`${base()} take ${tk.n}.zip`, await zipBlob(files));
    }

    // ---------- UI ----------
    const E = (t, cls, txt) => { const e = document.createElement(t); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
    function msg(t) { if (f.msg) f.msg.textContent = t; }
    function paintTracks() {
      if (!el) return; f.trs.innerHTML = ''; f.mets = [];
      for (let i = 0; i < S.nTr; i++) {
        const t = S.tr[i], row = E('div', 'mt-tr');
        row.appendChild(E('span', 'no', String(i + 1)));
        const arm = E('button', 'arm' + (t.arm ? ' on' : ''), '●'); arm.title = T.arm; arm.setAttribute('aria-pressed', String(t.arm)); arm.setAttribute('aria-label', T.armA(i + 1));
        arm.onclick = () => { t.arm = !t.arm; arm.classList.toggle('on', t.arm); arm.setAttribute('aria-pressed', String(t.arm)); paintInfo(); }; row.appendChild(arm);
        const nm = E('input', 'nm'); nm.type = 'text'; nm.maxLength = 32; nm.value = t.name; nm.placeholder = trName(i); nm.setAttribute('aria-label', T.nameA(i + 1)); nm.title = T.nameT;
        nm.oninput = () => { t.name = nm.value.trim(); }; row.appendChild(nm);
        const sel = E('select'); sel.setAttribute('aria-label', T.srcA(i + 1));
        const o0 = E('option', null, T.none); o0.value = ''; sel.appendChild(o0);
        bundles.forEach(b => { const g = E('optgroup'); g.label = b.source.name + (b.label && b.label !== b.source.name ? ' · ' + b.label : ''); b.channels.forEach(c => { const o = E('option', null, c.name); o.value = b.key + '|' + c.id; g.appendChild(o); }); sel.appendChild(g); });
        if (t.src && !srcOf(t.src)) { const o = E('option', null, T.lost); o.value = t.src; sel.appendChild(o); }
        sel.value = t.src; sel.className = !t.src ? 'none' : srcOf(t.src) ? '' : 'lost';
        sel.onchange = () => { t.src = sel.value; connect(i); nm.placeholder = trName(i); sel.className = !t.src ? 'none' : ''; };
        row.appendChild(sel);
        const met = E('div', 'mt-met'), bar = E('i'); met.appendChild(bar); row.appendChild(met); f.mets.push({ met, bar });
        f.trs.appendChild(row);
      }
      paintInfo();
    }
    function paintInfo() {
      if (!f.info) return; const armed = S.tr.slice(0, S.nTr).filter(t => t.arm).length;
      const perMin = armed * ctx.sampleRate * 60 * 2 * (S.bits / 8);
      f.info.textContent = T.info(armed, S.nTr, S.bits === 32 ? '32 bit float' : S.bits + ' bit', ctx.sampleRate / 1000, mb(perMin));
    }
    function paintTakes() {
      if (!el) return; f.takes.innerHTML = '';
      if (!takes.length) { f.takes.appendChild(E('div', 'mt-msg', T.noTakes)); return; }
      takes.forEach(tk => {
        const row = E('div', 'mt-take');
        row.appendChild(E('span', null, T.takeRow(tk.n, fmtT(tk.dur), tk.tracks.length, tk.at.toLocaleTimeString(T.locale, { hour: '2-digit', minute: '2-digit' }))));
        const z = E('button', null, T.zip); z.title = T.zipT; z.onclick = () => saveZip(tk); row.appendChild(z);
        const x = E('button', null, '×'); x.title = T.drop; x.setAttribute('aria-label', T.dropA); x.onclick = () => { takes = takes.filter(q => q !== tk); paintTakes(); }; row.appendChild(x);
        const det = E('details'), sum = E('summary', null, T.perTr(mb(bytesOf(tk)))), wv = E('div', 'wavs'); det.append(sum, wv);
        tk.tracks.forEach(t => { const b = E('button', null, (t.i + 1) + ' ' + t.name); b.title = t.from ? T.from + t.from : ''; b.onclick = () => save(`${base()} take ${tk.n} ${fileOf(tk, t)}`, trackWav(tk, t)); wv.appendChild(b); });
        row.appendChild(det); f.takes.appendChild(row);
      });
    }
    function paint() {
      if (!el) return; const on = !!rec;
      f.btn.textContent = on ? T.stop : T.rec; f.btn.classList.toggle('on', on);
      f.nTr.disabled = on; f.bits.disabled = on;
      paintTakes();
    }
    function loop() {
      if (dead || !el) return; const now = performance.now();
      (f.mets || []).forEach((m, i) => { const p = pk[i]; pk[i] = 0; const h = clamp((20 * Math.log10(p + 1e-9) + 60) / 60, 0, 1); hold[i] = Math.max(h, hold[i] - 0.02); m.bar.style.width = (hold[i] * 100).toFixed(1) + '%'; m.met.classList.toggle('clip', now - clipT[i] < 1500); });
      const tt = rec ? fmtT(rec.frames / ctx.sampleRate) : '00:00'; if (f.time.textContent !== tt) f.time.textContent = tt;
    }
    const stopLoop = () => { if (stopDraw) { stopDraw(); stopDraw = null; } };
    function render(root) {
      el = E('div', 'mt'); const st = E('style'); st.textContent = CSS; el.appendChild(st); root.appendChild(el);
      const top = E('div', 'mt-top');
      f.btn = E('button', 'mt-rec'); f.btn.onclick = () => (rec ? stop() : start());
      const nmw = E('div'); nmw.style.cssText = 'display:grid;gap:2px;min-width:0';
      f.name = E('input'); f.name.type = 'text'; f.name.value = S.name; f.name.maxLength = 60; f.name.setAttribute('aria-label', T.sessA); f.name.title = T.sessT;
      f.name.style.cssText = 'min-width:0;font-size:12px;padding:4px 6px'; f.name.oninput = () => { S.name = f.name.value; };
      f.info = E('div', 'mt-info'); nmw.append(f.name, f.info);
      f.time = E('div', 'mt-time', '00:00');
      top.append(f.btn, nmw, f.time); el.appendChild(top);
      const cfg = E('div', 'mt-cfg');
      { const l = E('label'); f.nTr = E('input'); f.nTr.type = 'number'; f.nTr.min = 1; f.nTr.max = MAXTR; f.nTr.value = S.nTr; f.nTr.onchange = () => { S.nTr = clamp(Math.round(+f.nTr.value) || 1, 1, MAXTR); f.nTr.value = S.nTr; connectAll(); paintTracks(); }; l.append(T.tracks, f.nTr); cfg.appendChild(l); }
      { const l = E('label'); f.bits = E('select'); [[16, '16 bit'], [24, '24 bit'], [32, '32 bit float']].forEach(([v, t]) => { const o = E('option', null, t); o.value = v; f.bits.appendChild(o); }); f.bits.value = S.bits; f.bits.onchange = () => { S.bits = +f.bits.value; paintInfo(); }; l.append(T.wav, f.bits); cfg.appendChild(l); }
      { const l = E('label'), c = E('input'); c.type = 'checkbox'; c.checked = S.withTransport; c.onchange = () => { S.withTransport = c.checked; }; f.wt = c; l.append(c, T.withT); cfg.appendChild(l); }
      { const l = E('label'), c = E('input'); c.type = 'checkbox'; c.checked = S.auto; c.onchange = () => { S.auto = c.checked; if (S.auto) { bundles.forEach(b => autoAssign(b, true)); connectAll(); paintTracks(); } }; f.auto = c; l.append(c, T.autoL); l.title = T.autoT; cfg.appendChild(l); }
      { const b = E('button', null, T.armAll); b.style.cssText = 'font-size:10px;padding:2px 7px'; b.onclick = () => { const all = S.tr.slice(0, S.nTr).every(t => t.arm); S.tr.slice(0, S.nTr).forEach(t => t.arm = !all); paintTracks(); }; cfg.appendChild(b); }
      el.appendChild(cfg);
      f.trs = E('div', 'mt-trs'); el.appendChild(f.trs);
      f.takes = E('div', 'mt-takes'); el.appendChild(f.takes);
      f.msg = E('div', 'mt-msg'); el.appendChild(f.msg);
      ['pointerdown'].forEach(t => el.addEventListener(t, e => { if (e.target.closest('input,select,button,details')) e.stopPropagation(); }));
      paintTracks(); paint(); stopLoop(); stopDraw = tekenLus(host, self, loop, 30);
    }

    self = {
      inputs: {}, outputs: {},
      mount(root) { render(root); ensureNode(); },
      unmount() { stopLoop(); el = null; f = {}; },
      onBundle(port, key, b) {
        if (b) { bundles.set(key, b); autoAssign(b); } else { bundles.delete(key); seen.delete(key); }
        connectAll(); if (el && !rec) paintTracks(); else if (el) paintInfo();
      },
      onTransport({ playing }) { if (!S.withTransport) return; if (playing) start(ctx.currentTime + 0.05); else stop(); },
      getPreset() { const s = self.getState(); s.tr.forEach(t => { delete t.src; }); return s; },
      setPreset(p) { p = p && typeof p === 'object' ? JSON.parse(JSON.stringify(p)) : {}; p.tr = Array.from({ length: MAXTR }, (_, i) => ({ ...((Array.isArray(p.tr) && p.tr[i] && typeof p.tr[i] === 'object') ? p.tr[i] : trDef()), src: S.tr[i].src })); self.setState(p); },
      getState() { return { name: S.name, nTr: S.nTr, bits: S.bits, withTransport: S.withTransport, auto: S.auto, tr: S.tr.slice(0, S.nTr).map(t => ({ ...t })) }; },
      setState(s) {
        s = s && typeof s === 'object' ? s : {}; const d = DEF();
        S.name = str(s.name, 60, d.name); S.nTr = Math.round(num(s.nTr, 1, MAXTR, d.nTr));
        S.bits = [16, 24, 32].includes(s.bits) ? s.bits : d.bits; S.withTransport = bool(s.withTransport, d.withTransport); S.auto = bool(s.auto, d.auto);
        S.tr = Array.from({ length: MAXTR }, (_, i) => { const t = Array.isArray(s.tr) && s.tr[i] && typeof s.tr[i] === 'object' ? s.tr[i] : {}; return { name: str(t.name, 32, ''), src: str(t.src, 1000, ''), arm: bool(t.arm, true) }; });
        connectAll();
        if (el) { f.name.value = S.name; f.nTr.value = S.nTr; f.bits.value = S.bits; f.wt.checked = S.withTransport; f.auto.checked = S.auto; paintTracks(); }
      },
      destroy() {
        if (dead) return; dead = true; stopLoop(); stop(); rec = null;
        for (let i = 0; i < MAXTR; i++) { if (srcNode[i]) { try { srcNode[i].disconnect(tin[i]); } catch (e) {} } try { tin[i].disconnect(); } catch (e) {} }
        if (node) { try { node.port.onmessage = null; node.port.close(); } catch (e) {} }
      },
    };
    return self;
  }
};
