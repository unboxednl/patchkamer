// SPDX-License-Identifier: AGPL-3.0-or-later
// 1.23.1 — De host zet een wav, flac of ogg zelf om naar mp3 als de dienst alleen mp3/m4a aanneemt (voortgang 'mp3'); de kaart zegt dat; teksten voor de nieuwe foutcodes (mp3big, mp3, indecode).
// 1.23.2 — Gemeten met de echte dienst (07-11): een stem 'instrumental' (alles behalve de zang) staat standaard gedempt, omdat hij met de andere stems samen dubbel klinkt; de host laat de meegestuurde invoer ('song') weg.
// 1.23.0 — Eerste versie. Stem Splitter splitst een nummer in stems (zang, drums, bas, rest, soms meer) met een dienst op internet. Het apparaat zelf doet geen netwerkverkeer:
//          de aanroep loopt via de host (contract v1.23, host.stems), die de sleutel van de gebruiker bewaart, de wachtrij van de dienst afwacht, de zip uitpakt en de stems
//          decodeert. Invoer: een bestand (kiezen, slepen, of vanuit de tab Samples via loadAudio) of een opname uit de audio-ingang. Het aantal audio-uitgangen volgt het aantal
//          stems (host.setPorts) en er is een bundeluitgang met alle stems. De stems spelen met de klok van de host (start en stop met het transport), elk met niveau, dempen
//          en solo. Ze zijn te bewaren als WAV (16 of 24 bit, per stem of alles in een zip) en de drums kunnen naar de Drum Listener. Er start nooit iets bij het laden van een
//          song: alleen een klik op Splitsen. De state bevat alleen instellingen; de stems zelf staan er niet in.
// Stem Splitter — stems via een dienst op internet · Patchkamer contract v1.23

const WNAME = 'nl-patchkamer-stemsplitter-1-23-0';
// Opname uit de ingang: stereo in blokken van 4096 frames, alleen tijdens het opnemen
const WORKLET = `
class SSCap extends AudioWorkletProcessor {
  constructor() {
    super(); this.on = false; this.l = new Float32Array(4096); this.r = new Float32Array(4096); this.n = 0;
    this.port.onmessage = e => { const m = e.data || {}; if (m.t === 'start') { this.on = true; this.n = 0; } else if (m.t === 'stop') { this.flush(); this.on = false; } };
  }
  flush() { if (!this.n) return; const l = this.l.slice(0, this.n), r = this.r.slice(0, this.n); this.n = 0; this.port.postMessage({ t: 'pcm', l, r }, [l.buffer, r.buffer]); }
  process(inputs) {
    if (!this.on) return true;
    const i = inputs[0]; if (!i || !i.length) return true; const a = i[0], b = i[1] || i[0];
    for (let s = 0; s < a.length; s++) { this.l[this.n] = a[s]; this.r[this.n] = b[s]; if (++this.n === 4096) this.flush(); }
    return true;
  }
}
registerProcessor('${WNAME}', SSCap);`;

const STEM_NL = { vocals: 'Zang', drums: 'Drums', bass: 'Bas', guitar: 'Gitaar', piano: 'Piano', strings: 'Strijkers', synth: 'Synth', brass: 'Koper', wind: 'Blazers', other: 'Rest', instrumental: 'Begeleiding' };
const STEM_EN = { vocals: 'Vocals', drums: 'Drums', bass: 'Bass', guitar: 'Guitar', piano: 'Piano', strings: 'Strings', synth: 'Synth', brass: 'Brass', wind: 'Wind', other: 'Other', instrumental: 'Instrumental' };
const TXT = {
  nl: {
    title: 'Stem Splitter', stemNames: STEM_NL, all: 'Alle stems', in: 'In',
    warn: 'Let op: het geluid gaat naar een dienst op internet, dat kost geld per nummer, en je moet de rechten hebben op de muziek (auteursrecht). Er gaat niets weg tot je op Splitsen klikt.',
    hint: 'Kies een nummer, een bestand of een opname uit de ingang, kies een dienst, en klik op Splitsen. De stems spelen met de klok mee, elk op een eigen uitgang.',
    choose: 'Bestand kiezen…', dropHint: 'of sleep een bestand op deze kaart', noSource: 'Nog geen nummer gekozen.', source: (n, mb) => n + ' (' + mb + ' MB)',
    rec: 'Opnemen uit ingang', recStart: 'Opnemen', recStop: 'Stop', recLen: { s10: '10 seconden', s30: '30 seconden', s60: '1 minuut', s120: '2 minuten', s180: '3 minuten' }, recLenLabel: 'Duur', recording: (s, t) => 'Opnemen… ' + s.toFixed(1) + ' / ' + t + ' s', recName: 'opname.wav',
    service: 'Dienst', model: 'Model', modelDefault: 'standaard uit de instellingen', settings: 'Instellingen…', noKey: 'Geen sleutel ingevuld: vul die in bij de instellingen.', noServices: 'Deze versie van Patchkamer kan geen stems splitsen (te oud).',
    cost: p => 'Geschatte kosten: ' + p + ' per nummer.', costUnknown: 'Prijs onbekend; zie de dienst.', accepts: l => 'Neemt aan: ' + l.join(', '),
    split: 'Splitsen', cancel: 'Annuleren',
    phase: { confirm: 'Wacht op bevestiging…', upload: 'Nummer klaarmaken…', submit: 'Naar de dienst sturen…', queue: q => 'In de wachtrij' + (q != null ? ' (plaats ' + q + ')' : '') + '…', run: 'De dienst splitst het nummer…', download: 'Stems ophalen…', unzip: 'Uitpakken…', decode: 'Decoderen…', mp3: f => 'Omzetten naar mp3… ' + Math.round((f || 0) * 100) + '%' },
    toMp3: 'Dit bestand wordt eerst naar mp3 omgezet, omdat de dienst alleen mp3 of m4a aanneemt.',
    done: n => 'Klaar: ' + n + (n === 1 ? ' stem' : ' stems') + '.', cost2: p => ' Kosten volgens de instelling: ' + p + '.',
    stems: 'Stems', level: 'Niveau', mute: 'Dempen', solo: 'Solo', bpm: 'Tempo van het nummer', bpmHint: '0 = niet aanpassen; anders loopt het nummer mee met het tempo van de studio (de toonhoogte verandert mee)', loop: 'Herhalen',
    bits: 'WAV', dlStem: 'Bewaar', dlAll: 'Alle stems bewaren (zip)', dlMidi: 'MIDI bewaren (zip)', toDrums: 'Drums → Drum Listener', clear: 'Stems wissen',
    playHint: 'De stems starten en stoppen met het transport van de studio.', sentDrums: 'Drums naar de Drum Listener gestuurd.', noDrums: 'Er is geen drumstem.', noDrumTarget: 'De Drum Listener is niet beschikbaar.',
    errOldHost: 'Deze versie van Patchkamer kan geen stems splitsen.', errDrop: 'Dit lijkt geen audiobestand.', errBig: 'Bestand te groot (hoogstens 100 MB).', errWavBig: 'Te lang voor een WAV-bestand.', errNoWorklet: 'Opnemen uit de ingang heeft AudioWorklet nodig, en dat is hier niet beschikbaar.', errNoAudio: 'Geen geluid ontvangen. Verbind een bron met de ingang.', errNoSource: 'Kies eerst een nummer.',
    err: {
      declined: 'Geannuleerd: er is niets verstuurd.', aborted: 'Geannuleerd.', timeout: 'De dienst deed er te lang over (meer dan 20 minuten). Probeer het later opnieuw.',
      nokey: 'Er is nog geen sleutel ingevuld voor deze dienst. Vul die in bij de instellingen.', config: 'De eigen dienst is niet ingevuld (basisadres, eindpunt en sleutel). Doe dat bij de instellingen.', service: 'Onbekende dienst of model.',
      format: e => 'Deze dienst neemt alleen ' + (e.accept || []).join(', ') + ' aan' + (e.found ? ' (dit bestand is ' + e.found + ')' : ' (dit bestand is geen bekende audiosoort)') + '. Sla het nummer op als mp3 (bijvoorbeeld met het apparaat Recorder) of kies een dienst die ' + (e.found || 'dit') + ' aanneemt.',
      size: e => 'Het bestand is te groot voor deze dienst (' + (e.size / 1048576).toFixed(1) + ' MB, hoogstens ' + (e.max / 1048576).toFixed(0) + ' MB). Neem een kortere versie of comprimeer het.',
      network: e => 'De dienst (' + (e.host || '?') + ') was niet te bereiken. Dat kan een netwerkprobleem zijn, of de dienst staat aanroepen vanuit de browser niet toe.',
      auth: 'De dienst weigerde de sleutel. Controleer de sleutel bij de instellingen.', credit: 'Geen tegoed bij de dienst. Vul het saldo aan.', notfound: 'De dienst kent dit eindpunt of deze taak niet.', input: 'De dienst weigerde dit bestand of dit model.', rate: 'Te veel aanvragen bij de dienst. Wacht even.', server: 'De dienst meldt een storing. Probeer het later opnieuw.', http: 'De dienst gaf een fout.',
      failed: 'De dienst meldde dat het splitsen mislukte.', response: 'Onbegrijpelijk antwoord van de dienst.', zip: e => 'De uitvoer van de dienst is geen bruikbare zip (' + (e.message || '?') + ').', mp3big: e => 'Het nummer is te lang voor deze dienst, ook als mp3 met de laagste kwaliteit (' + Math.round((e.seconds || 0) / 60 * 10) / 10 + ' minuten; hoogstens ongeveer ' + Math.floor((e.maxSeconds || 0) / 60) + ' minuten en ' + ((e.maxSeconds || 0) % 60) + ' seconden). Neem een kortere versie.', mp3: e => 'Omzetten naar mp3 mislukte' + (e.message ? ' (' + e.message + ')' : '') + '.', indecode: 'Dit bestand is niet te decoderen om naar mp3 om te zetten.', decode: e => 'Een stem was niet te decoderen' + (e.message ? ' (' + e.message + ')' : '') + '.', unsupported: 'Deze browser kan de zip niet uitpakken (DecompressionStream ontbreekt).', read: 'Het bestand was niet te lezen.', other: 'Het splitsen is mislukt.' }
  },
  en: {
    title: 'Stem Splitter', stemNames: STEM_EN, all: 'All stems', in: 'In',
    warn: 'Note: the sound goes to an online service, that costs money per track, and you need the rights to the music (copyright). Nothing leaves your computer until you click Split.',
    hint: 'Pick a track, a file or a recording from the input, choose a service, and click Split. The stems play along with the clock, each on its own output.',
    choose: 'Choose file…', dropHint: 'or drop a file on this card', noSource: 'No track chosen yet.', source: (n, mb) => n + ' (' + mb + ' MB)',
    rec: 'Record from input', recStart: 'Record', recStop: 'Stop', recLen: { s10: '10 seconds', s30: '30 seconds', s60: '1 minute', s120: '2 minutes', s180: '3 minutes' }, recLenLabel: 'Length', recording: (s, t) => 'Recording… ' + s.toFixed(1) + ' / ' + t + ' s', recName: 'recording.wav',
    service: 'Service', model: 'Model', modelDefault: 'default from the settings', settings: 'Settings…', noKey: 'No key entered: enter it in the settings.', noServices: 'This version of Patchkamer cannot split stems (too old).',
    cost: p => 'Estimated cost: ' + p + ' per track.', costUnknown: 'Price unknown; see the service.', accepts: l => 'Accepts: ' + l.join(', '),
    split: 'Split', cancel: 'Cancel',
    phase: { confirm: 'Waiting for confirmation…', upload: 'Preparing the track…', submit: 'Sending to the service…', queue: q => 'In the queue' + (q != null ? ' (place ' + q + ')' : '') + '…', run: 'The service is splitting the track…', download: 'Fetching stems…', unzip: 'Unpacking…', decode: 'Decoding…', mp3: f => 'Converting to mp3… ' + Math.round((f || 0) * 100) + '%' },
    toMp3: 'This file is first converted to mp3, because the service only accepts mp3 or m4a.',
    done: n => 'Done: ' + n + (n === 1 ? ' stem' : ' stems') + '.', cost2: p => ' Cost according to the setting: ' + p + '.',
    stems: 'Stems', level: 'Level', mute: 'Mute', solo: 'Solo', bpm: 'Tempo of the track', bpmHint: '0 = leave as is; otherwise the track follows the studio tempo (the pitch changes with it)', loop: 'Repeat',
    bits: 'WAV', dlStem: 'Save', dlAll: 'Save all stems (zip)', dlMidi: 'Save MIDI (zip)', toDrums: 'Drums → Drum Listener', clear: 'Clear stems',
    playHint: 'The stems start and stop with the studio transport.', sentDrums: 'Drums sent to the Drum Listener.', noDrums: 'There is no drum stem.', noDrumTarget: 'The Drum Listener is not available.',
    errOldHost: 'This version of Patchkamer cannot split stems.', errDrop: 'This does not look like an audio file.', errBig: 'File too large (100 MB at most).', errWavBig: 'Too long for a WAV file.', errNoWorklet: 'Recording from the input needs AudioWorklet, which is not available here.', errNoAudio: 'No sound received. Connect a source to the input.', errNoSource: 'Choose a track first.',
    err: {
      declined: 'Cancelled: nothing was sent.', aborted: 'Cancelled.', timeout: 'The service took too long (more than 20 minutes). Try again later.',
      nokey: 'No key has been entered for this service. Enter it in the settings.', config: 'The own service is not filled in (base address, endpoint and key). Do that in the settings.', service: 'Unknown service or model.',
      format: e => 'This service only accepts ' + (e.accept || []).join(', ') + (e.found ? ' (this file is ' + e.found + ')' : ' (this file is not a known audio type)') + '. Save the track as mp3 (for example with the Recorder device) or choose a service that accepts ' + (e.found || 'it') + '.',
      size: e => 'The file is too large for this service (' + (e.size / 1048576).toFixed(1) + ' MB, at most ' + (e.max / 1048576).toFixed(0) + ' MB). Use a shorter version or compress it.',
      network: e => 'The service (' + (e.host || '?') + ') could not be reached. That may be a network problem, or the service does not allow calls from the browser.',
      auth: 'The service refused the key. Check the key in the settings.', credit: 'No balance at the service. Top it up.', notfound: 'The service does not know this endpoint or job.', input: 'The service refused this file or model.', rate: 'Too many requests at the service. Wait a moment.', server: 'The service reports a fault. Try again later.', http: 'The service returned an error.',
      failed: 'The service reported that splitting failed.', response: 'Incomprehensible answer from the service.', zip: e => 'The output of the service is not a usable zip (' + (e.message || '?') + ').', mp3big: e => 'The track is too long for this service, even as mp3 at the lowest quality (' + Math.round((e.seconds || 0) / 60 * 10) / 10 + ' minutes; at most about ' + Math.floor((e.maxSeconds || 0) / 60) + ' minutes and ' + ((e.maxSeconds || 0) % 60) + ' seconds). Use a shorter version.', mp3: e => 'Converting to mp3 failed' + (e.message ? ' (' + e.message + ')' : '') + '.', indecode: 'This file could not be decoded to convert it to mp3.', decode: e => 'A stem could not be decoded' + (e.message ? ' (' + e.message + ')' : '') + '.', unsupported: 'This browser cannot unpack the zip (DecompressionStream is missing).', read: 'The file could not be read.', other: 'Splitting failed.' }
  }
};

const DEF_IDS = ['vocals', 'drums', 'bass', 'other'], SERVICES = ['a', 'b', 'custom'], BITS = [16, 24], RECS = { s10: 10, s30: 30, s60: 60, s120: 120, s180: 180 };
const MAX_FILE = 100 * 1024 * 1024, MAX_STEMS = 12, ID_RE = /^[a-z0-9_-]{1,24}$/;
const cl = (v, a, b) => Math.max(a, Math.min(b, v));
const num = (v, a, b, d) => typeof v === 'number' && Number.isFinite(v) ? cl(v, a, b) : d;
const pick = (v, list, d) => list.includes(v) ? v : d;
const okId = id => typeof id === 'string' && ID_RE.test(id) && id !== 'in' && id !== 'all';
const safeName = t => String(t || '').replace(/\.[A-Za-z0-9]{2,5}$/, '').replace(/[\\/:*?"<>|\u0000-\u001f]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60) || 'track';
const DEFAULTS = { service: 'a', model: '', bits: 16, rec: 's30', loop: false, bpm: 0, mix: {}, layout: DEF_IDS };

// ---------- WAV (16 of 24 bit) en zip (opgeslagen) ----------
function wavBlob(chs, sr, bits) {
  const ch = chs.length, frames = chs[0].length, bps = bits / 8, dataLen = frames * ch * bps;
  if (dataLen + 44 > 0xFFFFFFFF) return null;
  const buf = new ArrayBuffer(44 + dataLen), v = new DataView(buf); let o = 0;
  const str = t => { for (let i = 0; i < t.length; i++) v.setUint8(o++, t.charCodeAt(i)); }, u32 = x => { v.setUint32(o, x, true); o += 4; }, u16 = x => { v.setUint16(o, x, true); o += 2; };
  str('RIFF'); u32(36 + dataLen); str('WAVE'); str('fmt '); u32(16); u16(1); u16(ch); u32(sr); u32(sr * ch * bps); u16(ch * bps); u16(bits); str('data'); u32(dataLen);
  const k = bits === 16 ? 32767 : 8388607;
  for (let i = 0; i < frames; i++) for (let c = 0; c < ch; c++) {
    let s = chs[c][i]; if (!(s === s)) s = 0; s = Math.round(cl(s, -1, 1) * k);
    if (bits === 16) { v.setInt16(o, s, true); o += 2; } else { v.setUint8(o, s & 255); v.setUint8(o + 1, (s >> 8) & 255); v.setUint8(o + 2, (s >> 16) & 255); o += 3; }
  }
  return new Blob([buf], { type: 'audio/wav' });
}
const bufChannels = b => { const l = []; for (let c = 0; c < Math.min(2, b.numberOfChannels); c++) l.push(b.getChannelData(c)); return l; };
let CRC = null;
function crc32(u8) { if (!CRC) { CRC = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; CRC[n] = c >>> 0; } }
  let c = 0xFFFFFFFF; for (let i = 0; i < u8.length; i++) c = CRC[(c ^ u8[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
async function zipBlob(files) {   // files: [{name, blob}]
  const parts = [], central = []; let off = 0; const enc = new TextEncoder(), d = new Date();
  const dt = ((d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1)) & 0xFFFF, dd = (((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate()) & 0xFFFF;
  for (const f of files) {
    const data = new Uint8Array(await f.blob.arrayBuffer()), name = enc.encode(f.name), crc = crc32(data), lh = new DataView(new ArrayBuffer(30));
    lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint16(6, 0x0800, true); lh.setUint16(10, dt, true); lh.setUint16(12, dd, true);
    lh.setUint32(14, crc, true); lh.setUint32(18, data.length, true); lh.setUint32(22, data.length, true); lh.setUint16(26, name.length, true);
    parts.push(lh.buffer, name, data);
    const ch = new DataView(new ArrayBuffer(46));
    ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true); ch.setUint16(8, 0x0800, true); ch.setUint16(12, dt, true); ch.setUint16(14, dd, true);
    ch.setUint32(16, crc, true); ch.setUint32(20, data.length, true); ch.setUint32(24, data.length, true); ch.setUint16(28, name.length, true); ch.setUint32(42, off, true);
    central.push(ch.buffer, name); off += 30 + name.length + data.length;
  }
  const cdLen = central.reduce((a, b) => a + b.byteLength, 0), end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true); end.setUint16(8, files.length, true); end.setUint16(10, files.length, true); end.setUint32(12, cdLen, true); end.setUint32(16, off, true);
  return new Blob([...parts, ...central, end.buffer], { type: 'application/zip' });
}

const CSS = ':host{display:block;color:var(--fg,#e2e6ea);font:12px var(--mono,monospace)}*{box-sizing:border-box}[hidden]{display:none!important}.app{display:grid;gap:10px;padding:12px;background:var(--card,#15181d);border:1px solid var(--line,#39424e);border-radius:8px}.app.drop{border-color:var(--acc,#4fd1c5)}' +
  'h2{margin:0;font-size:16px;letter-spacing:1px}.hint{color:var(--muted,#97a1ad);line-height:1.4}.warn{color:var(--event,#f4a261);line-height:1.4;border:1px solid var(--event,#f4a261);border-radius:6px;padding:6px 8px}.row{display:flex;gap:8px;flex-wrap:wrap;align-items:flex-end}' +
  'label{display:flex;flex-direction:column;gap:3px;color:var(--muted,#97a1ad);font-size:11px}label.inl{flex-direction:row;align-items:center;gap:6px}' +
  'button,select,input{font:inherit;color:var(--field-fg,#e4edef);background:var(--field,#20252d);border:1px solid var(--line,#39424e);border-radius:5px;padding:6px 8px;max-width:100%}button{cursor:pointer}button:hover:not(:disabled){border-color:var(--acc,#4fd1c5)}button:disabled{opacity:.5;cursor:default}button.on{background:var(--acc,#4fd1c5);color:#111;border-color:var(--acc,#4fd1c5)}' +
  'input[type=number]{width:70px}input[type=checkbox]{padding:0}input[type=range]{padding:0;width:140px}.status{min-height:16px;color:var(--event,#f4a261)}.status.err{color:#ff7b72}.status.ok{color:var(--fg,#e2e6ea)}' +
  '.stems{display:grid;gap:4px}.stem{display:grid;grid-template-columns:minmax(80px,140px) auto auto auto auto;gap:8px;align-items:center}.stem b{font-weight:600}';

export default {
  id: 'nl.patchkamer.stemsplitter', name: 'Stem Splitter', version: '1.23.2', kind: 'utility', category: 'tool', ui: { width: 640, minWidth: 360 }, modExclude: '*',
  i18n: { nl: { ports: { in: 'In', vocals: 'Zang', drums: 'Drums', bass: 'Bas', other: 'Rest', all: 'Alle stems' } } },
  ports: { audioIn: [{ id: 'in', name: 'In' }], audioOut: [{ id: 'vocals', name: 'Vocals' }, { id: 'drums', name: 'Drums' }, { id: 'bass', name: 'Bass' }, { id: 'other', name: 'Other' }], eventIn: [], eventOut: [], modIn: [], modOut: [], multiIn: [], multiOut: [{ id: 'all', name: 'All stems' }] },
  create(ctx, host) {
    const T = TXT[host && host.lang] || TXT.en;
    let state = { ...DEFAULTS, mix: {}, layout: DEF_IDS.slice() }, dead = false, ui = null, shell = null, stopFrame = null, msg = '', msgKind = '';
    let source = null;              // { blob, name, size }
    let result = null;              // { stems: [{ id, buffer }], midi: Blob|null, price }
    let busy = false, ctl = null, runId = 0, sentLayout = null;
    let rec = null, node = null, pcmReady = false;
    let playing = false, active = [], done = false, endedCount = 0;
    const inG = ctx.createGain();
    const outs = new Map();         // stemId -> GainNode (de uitgang)
    const stemName = id => T.stemNames[id] || id.charAt(0).toUpperCase() + id.slice(1).replace(/[_-]+/g, ' ');
    const el = (tag, text, parent, cls) => { const e = document.createElement(tag); if (text != null) e.textContent = text; if (cls) e.className = cls; if (parent) parent.appendChild(e); return e; };
    const mixOf = id => (state.mix[id] || (state.mix[id] = { level: 1, mute: id === 'instrumental', solo: false }));   // 'instrumental' is alles behalve de zang: standaard gedempt, anders klinkt alles dubbel
    const curIds = () => state.layout.slice();
    const ensureOut = id => { let g = outs.get(id); if (!g) { g = ctx.createGain(); outs.set(id, g); } return g; };
    const self = { inputs: { in: inG }, outputs: {} };
    for (const id of DEF_IDS) { self.outputs[id] = ensureOut(id); }

    function gainFor(id) { const m = state.mix[id] || { level: 1, mute: id === 'instrumental', solo: false }, anySolo = Object.keys(state.mix).some(k => outs.has(k) && state.mix[k].solo); return m.mute || (anySolo && !m.solo) ? 0 : m.level; }
    function applyMix() { const t = ctx.currentTime; for (const [id, g] of outs) { try { g.gain.setTargetAtTime(gainFor(id), t, 0.01); } catch (e) { /* ok */ } } }
    function portsFor(ids) {
      return { audioIn: [{ id: 'in', name: T.in }], audioOut: ids.map(id => ({ id, name: stemName(id) })), eventIn: [], eventOut: [], modIn: [], modOut: [], multiIn: [], multiOut: [{ id: 'all', name: T.all }] };
    }
    // het aantal uitgangen volgt de stems: eerst de nieuwe AudioNodes in outputs, dan setPorts, dan pas de oude weg
    function applyLayout(ids) {
      const same = sentLayout && sentLayout.length === ids.length && ids.every((x, i) => x === sentLayout[i]); if (same) return;
      const old = [...outs.keys()];
      for (const id of ids) self.outputs[id] = ensureOut(id);
      state.layout = ids.slice();
      try { if (typeof host.setPorts === 'function') host.setPorts(self, portsFor(ids)); } catch (e) { /* ok */ }
      for (const id of old) if (!ids.includes(id)) { try { outs.get(id).disconnect(); } catch (e) { /* ok */ } outs.delete(id); delete self.outputs[id]; }
      sentLayout = ids.slice(); applyMix();
      try { if (typeof host.bundleChanged === 'function') host.bundleChanged(self, 'all'); } catch (e) { /* ok */ }
    }

    // ---------- bron ----------
    function setMsg(t, kind) { msg = t || ''; msgKind = kind || ''; if (ui) { ui.status.textContent = msg; ui.status.className = 'status' + (msgKind ? ' ' + msgKind : ''); } }
    function setSource(blob, name) {
      if (!(blob instanceof Blob) || !blob.size) { setMsg(T.errDrop, 'err'); return false; }
      if (blob.size > MAX_FILE) { setMsg(T.errBig, 'err'); return false; }
      source = { blob, name: String(name || blob.name || 'track').slice(0, 80), size: blob.size }; setMsg('', ''); paint(); return true;
    }
    // de host zet een wav, flac of ogg om naar mp3 als de dienst alleen mp3/m4a aanneemt (zie de bron: naam of soort van het bestand)
    const srcExt = () => { if (!source) return ''; const m = /\.(wav|flac|ogg|mp3|m4a)$/i.exec(source.name || ''), t = (source.blob.type || '').toLowerCase(); return m ? m[1].toLowerCase() : /wav/.test(t) ? 'wav' : /flac/.test(t) ? 'flac' : /ogg/.test(t) ? 'ogg' : ''; };
    const needsMp3 = sv => { const x = srcExt(); return !!x && ['wav', 'flac', 'ogg'].includes(x) && !sv.accept.includes(x) && sv.accept.includes('mp3'); };
    const looksAudio = f => /^audio\//.test(f.type) || /\.(mp3|m4a|wav|flac|ogg|aac|opus)$/i.test(f.name || '');
    function takeFile(f) { if (!f) return; if (!looksAudio(f)) { setMsg(T.errDrop, 'err'); return; } setSource(f, f.name); }

    // ---------- opname uit de ingang ----------
    const loader = host && typeof host.loadWorklet === 'function' ? host.loadWorklet(WNAME, WORKLET) : Promise.reject(new Error('no loadWorklet'));
    loader.then(() => {
      if (dead || typeof AudioWorkletNode === 'undefined') throw new Error('no AudioWorklet');
      node = new AudioWorkletNode(ctx, WNAME, { numberOfInputs: 1, numberOfOutputs: 0, channelCount: 2, channelCountMode: 'explicit' });
      node.port.onmessage = e => { const m = e.data || {}; if (!rec || m.t !== 'pcm' || !(m.l instanceof Float32Array)) return; rec.l.push(m.l); rec.r.push(m.r); rec.frames += m.l.length; if (rec.frames >= rec.target && !rec.stopping) finishRecording(); };
      inG.connect(node); pcmReady = true;
    }).catch(() => { pcmReady = false; });
    function startRecording() {
      if (rec || busy) return; if (!pcmReady || !node) { setMsg(T.errNoWorklet, 'err'); return; }
      const secs = RECS[state.rec]; rec = { l: [], r: [], frames: 0, target: Math.round(secs * ctx.sampleRate), secs, stopping: false };
      setMsg('', ''); node.port.postMessage({ t: 'start' }); paint();
    }
    function finishRecording() {
      const r = rec; if (!r || r.stopping) return; r.stopping = true; try { node.port.postMessage({ t: 'stop' }); } catch (e) { /* ok */ }
      setTimeout(() => {   // het laatste blok komt na 'stop' binnen
        if (rec !== r) return; rec = null; if (dead) return;
        const n = Math.min(r.frames, r.target), L = new Float32Array(n), R = new Float32Array(n); let o = 0;
        for (let i = 0; i < r.l.length; i++) { const k = Math.min(r.l[i].length, n - o); if (k <= 0) break; L.set(r.l[i].subarray(0, k), o); R.set(r.r[i].subarray(0, k), o); o += k; }
        let peak = 0; for (let i = 0; i < n; i++) { const a = Math.max(Math.abs(L[i]), Math.abs(R[i])); if (a > peak) peak = a; }
        if (!(peak > 1e-4)) { setMsg(T.errNoAudio, 'err'); paint(); return; }
        const b = wavBlob([L, R], ctx.sampleRate, 16); if (!b) { setMsg(T.errWavBig, 'err'); paint(); return; }
        setSource(b, T.recName);
      }, 60);
    }
    const stopRecording = () => { if (rec) finishRecording(); };

    // ---------- splitsen (alleen na een klik) ----------
    const services = () => { try { return typeof host.stems === 'function' ? (host.stems(self, 'services') || []) : []; } catch (e) { return []; } };
    function errText(e) {
      const c = e && e.code, f = T.err[c]; if (typeof f === 'function') return f(e || {}); if (typeof f === 'string') return f; return T.err.other;
    }
    async function doSplit() {
      if (busy || dead) return; if (!source) { setMsg(T.errNoSource, 'err'); return; }
      if (typeof host.stems !== 'function') { setMsg(T.errOldHost, 'err'); return; }
      stopRecording(); const my = ++runId; ctl = new AbortController(); busy = true; setMsg(T.phase.submit, ''); paint();
      try {
        const r = await host.stems(self, 'split', {
          audio: source.blob, service: state.service, model: state.model || undefined, signal: ctl.signal,
          onProgress: p => { if (my !== runId || !p) return; const f = T.phase[p.phase]; setMsg(typeof f === 'function' ? f(p.phase === 'mp3' ? p.progress : p.queue) : f || '', ''); }
        });
        if (dead || my !== runId) return;
        applyResult(r);
        const price = r && r.price != null ? r.price : null;
        setMsg(T.done(r.stems.length) + (price != null ? T.cost2(fmtMoney(price)) : ''), 'ok');
      } catch (e) { if (dead || my !== runId) return; setMsg(errText(e), e && (e.code === 'aborted' || e.code === 'declined') ? '' : 'err'); }
      finally { if (my === runId) { busy = false; ctl = null; paint(); } }
    }
    const cancelSplit = () => { if (ctl) { try { ctl.abort(); } catch (e) { /* ok */ } } };
    const fmtMoney = p => '$' + p.toFixed(2);
    // een stem uit de dienst kan in theorie NaN of Infinity bevatten (kapot bestand); een niet-eindige waarde vergiftigt alles erachter, dus wissen en begrenzen
    function sanitize(buf) { let bad = 0; for (let c = 0; c < buf.numberOfChannels; c++) { const d = buf.getChannelData(c); for (let i = 0; i < d.length; i++) { const v = d[i]; if (!(v > -16 && v < 16)) { d[i] = v === v && v !== Infinity && v !== -Infinity ? (v > 0 ? 16 : -16) : 0; bad++; } } } return bad; }
    function applyResult(r) {
      const list = (r && Array.isArray(r.stems) ? r.stems : []).filter(s => s && okId(s.id) && s.buffer && s.buffer.length > 0).slice(0, MAX_STEMS);
      if (!list.length) throw Object.assign(new Error('empty'), { code: 'zip', message: 'empty' });
      stopAll(); done = false; for (const x of list) sanitize(x.buffer);
      result = { stems: list.map(s => ({ id: s.id, buffer: s.buffer })), midi: r.midi instanceof Blob ? r.midi : null, price: r.price };
      applyLayout(list.map(s => s.id)); list.forEach(s => mixOf(s.id)); applyMix(); paint();
    }
    function clearResult() { stopAll(); result = null; done = false; setMsg('', ''); paint(); }

    // ---------- afspelen met de klok ----------
    function stopAll() {
      for (const s of active) { try { s.onended = null; s.stop(); } catch (e) { /* ok */ } try { s.disconnect(); } catch (e) { /* ok */ } }
      active = [];
    }
    const rateNow = () => state.bpm > 0 ? cl((Number.isFinite(host.bpm) ? host.bpm : 120) / state.bpm, 0.5, 2) : 1;
    function startAt(time) {
      if (!result) return; stopAll(); done = false; endedCount = 0;
      const rate = rateNow();
      for (const st of result.stems) {
        const g = outs.get(st.id); if (!g) continue;
        const s = ctx.createBufferSource(); s.buffer = st.buffer; s.loop = state.loop; s.playbackRate.value = rate; s.connect(g);
        s.onended = () => { endedCount++; if (endedCount >= active.length) { active = []; done = true; } };
        try { s.start(Number.isFinite(time) ? Math.max(time, ctx.currentTime) : ctx.currentTime); active.push(s); } catch (e) { try { s.disconnect(); } catch (x) { /* ok */ } }
      }
    }

    // ---------- bewaren en doorgeven ----------
    const baseName = () => safeName(source ? source.name : 'stems');
    async function saveStem(st) {
      const b = wavBlob(bufChannels(st.buffer), st.buffer.sampleRate, state.bits); if (!b) { setMsg(T.errWavBig, 'err'); return; }
      if (typeof host.saveFile === 'function') host.saveFile(baseName() + ' - ' + st.id + '.wav', b);
    }
    async function saveAll() {
      if (!result) return; const files = [];
      for (const st of result.stems) { const b = wavBlob(bufChannels(st.buffer), st.buffer.sampleRate, state.bits); if (!b) { setMsg(T.errWavBig, 'err'); return; } files.push({ name: baseName() + ' - ' + st.id + '.wav', blob: b }); }
      const z = await zipBlob(files); if (typeof host.saveFile === 'function') host.saveFile(baseName() + ' - stems.zip', z);
    }
    function saveMidi() { if (result && result.midi && typeof host.saveFile === 'function') host.saveFile(baseName() + ' - midi.zip', result.midi); }
    async function toDrums() {
      const st = result && result.stems.find(s => s.id === 'drums'); if (!st) { setMsg(T.noDrums, 'err'); return; }
      const b = wavBlob(bufChannels(st.buffer), st.buffer.sampleRate, 16); if (!b) { setMsg(T.errWavBig, 'err'); return; }
      let ok = false;
      try { ok = typeof host.stems === 'function' && await host.stems(self, 'send', { def: 'nl.patchkamer.drum-listener', file: new File([b], baseName() + ' - drums.wav', { type: 'audio/wav' }), info: { name: baseName() + ' - drums', bpm: state.bpm > 0 ? state.bpm : undefined } }); } catch (e) { ok = false; }
      setMsg(ok ? T.sentDrums : T.noDrumTarget, ok ? 'ok' : 'err');
    }

    // ---------- UI ----------
    function mkSelect(parent, label, items, onchange) { const l = el('label', label, parent); const s = el('select', null, l); s.setAttribute('aria-label', label); for (const [v, t] of items) { const o = el('option', t, s); o.value = String(v); } s.onchange = () => onchange(s.value); return s; }
    function paint() {
      if (!ui) return;
      const svs = services(), sv = svs.find(s => s.id === state.service);
      ui.service.textContent = ''; for (const s of svs) { const o = el('option', s.label, ui.service); o.value = s.id; } ui.service.value = state.service;
      ui.model.textContent = ''; { const o = el('option', T.modelDefault, ui.model); o.value = ''; } for (const m of (sv ? sv.models : [])) { const o = el('option', m.label + (m.price != null ? ' · ' + fmtMoney(m.price) : ''), ui.model); o.value = m.id; } ui.model.value = state.model; ui.model.parentElement.hidden = !sv || !sv.models.length;
      const mdl = sv && state.model ? sv.models.find(m => m.id === state.model) : null, price = mdl ? mdl.price : sv ? sv.price : null;
      ui.info.textContent = !svs.length ? T.noServices : (sv && !sv.configured ? T.noKey + ' ' : '') + (price != null ? T.cost(fmtMoney(price)) : T.costUnknown) + (sv ? ' ' + T.accepts(sv.accept) : '') + (sv && needsMp3(sv) ? ' ' + T.toMp3 : '');
      ui.source.textContent = source ? T.source(source.name, (source.size / 1048576).toFixed(1)) : T.noSource;
      ui.rec.textContent = rec ? T.recStop : T.recStart; ui.rec.classList.toggle('on', !!rec); ui.recLen.value = state.rec;
      ui.split.textContent = busy ? T.cancel : T.split; ui.split.disabled = !svs.length || (!busy && !source); ui.split.classList.toggle('on', busy);
      ui.bpm.value = state.bpm ? String(state.bpm) : '0'; ui.loop.checked = state.loop; ui.bits.value = String(state.bits);
      ui.stemsBox.hidden = !result; ui.stems.textContent = '';
      if (result) {
        for (const st of result.stems) {
          const m = mixOf(st.id), row = el('div', null, ui.stems, 'stem'); el('b', stemName(st.id), row);
          const lv = el('input', null, row); lv.type = 'range'; lv.min = '0'; lv.max = '1.5'; lv.step = '0.01'; lv.value = String(m.level); lv.setAttribute('aria-label', T.level + ' ' + stemName(st.id)); lv.oninput = () => { m.level = num(+lv.value, 0, 1.5, 1); applyMix(); };
          const mu = el('button', 'M', row); mu.type = 'button'; mu.title = T.mute; mu.setAttribute('aria-label', T.mute + ' ' + stemName(st.id)); mu.classList.toggle('on', m.mute); mu.onclick = () => { m.mute = !m.mute; mu.classList.toggle('on', m.mute); applyMix(); };
          const so = el('button', 'S', row); so.type = 'button'; so.title = T.solo; so.setAttribute('aria-label', T.solo + ' ' + stemName(st.id)); so.classList.toggle('on', m.solo); so.onclick = () => { m.solo = !m.solo; paint(); applyMix(); };
          const dl = el('button', T.dlStem, row); dl.type = 'button'; dl.onclick = () => saveStem(st);
        }
        ui.midi.hidden = !result.midi; ui.drums.hidden = !result.stems.some(s => s.id === 'drums');
      }
      ui.status.textContent = msg; ui.status.className = 'status' + (msgKind ? ' ' + msgKind : '');
    }
    function frame() { if (!ui || !rec) return; ui.status.textContent = T.recording(rec.frames / ctx.sampleRate, rec.secs); ui.status.className = 'status'; }

    Object.assign(self, {
      mount(root) {
        if (dead) return; self.unmount(); shell = el('div', null, root); const sh = shell.attachShadow({ mode: 'open' }); el('style', CSS, sh);
        const app = el('div', null, sh, 'app'); el('h2', T.title, app); el('div', T.warn, app, 'warn'); el('div', T.hint, app, 'hint');
        const r1 = el('div', null, app, 'row');
        const file = el('input', null, r1); file.type = 'file'; file.accept = 'audio/*,.mp3,.m4a,.wav,.flac,.ogg'; file.style.display = 'none'; file.setAttribute('aria-label', T.choose);
        const choose = el('button', T.choose, r1); choose.type = 'button'; choose.onclick = () => file.click(); file.onchange = () => { if (file.files && file.files.length) takeFile(file.files[0]); file.value = ''; };
        el('span', T.dropHint, r1, 'hint'); const srcLine = el('div', null, app, 'status'); srcLine.classList.add('ok');
        const r2 = el('div', null, app, 'row'); const recLen = mkSelect(r2, T.recLenLabel, Object.keys(RECS).map(k => [k, T.recLen[k]]), v => { state.rec = pick(v, Object.keys(RECS), 's30'); });
        const recB = el('button', T.recStart, r2); recB.type = 'button'; recB.title = T.rec; recB.setAttribute('aria-label', T.rec); recB.onclick = () => (rec ? stopRecording() : startRecording());
        const r3 = el('div', null, app, 'row');
        const service = mkSelect(r3, T.service, [], v => { state.service = pick(v, SERVICES, 'a'); state.model = ''; paint(); });
        const model = mkSelect(r3, T.model, [], v => { state.model = /^[\w.-]{0,100}$/.test(v) ? v : ''; paint(); });
        const setB = el('button', T.settings, r3); setB.type = 'button'; setB.onclick = () => { try { host.stems(self, 'settings'); } catch (e) { /* ok */ } };
        const info = el('div', null, app, 'hint');
        const r4 = el('div', null, app, 'row'); const splitB = el('button', T.split, r4); splitB.type = 'button'; splitB.onclick = () => (busy ? cancelSplit() : doSplit());
        const status = el('div', null, app, 'status');
        const stemsBox = el('div', null, app, 'stems'); el('b', T.stems, stemsBox); const stems = el('div', null, stemsBox, 'stems');
        const r5 = el('div', null, stemsBox, 'row');
        const bl = el('label', null, r5); bl.append(T.bits); const bits = el('select', null, bl); bits.setAttribute('aria-label', T.bits); for (const b of BITS) { const o = el('option', b + ' bit', bits); o.value = String(b); } bits.onchange = () => { state.bits = pick(parseInt(bits.value, 10), BITS, 16); };
        const allB = el('button', T.dlAll, r5); allB.type = 'button'; allB.onclick = () => { saveAll(); };
        const midiB = el('button', T.dlMidi, r5); midiB.type = 'button'; midiB.onclick = saveMidi;
        const drumsB = el('button', T.toDrums, r5); drumsB.type = 'button'; drumsB.onclick = () => { toDrums(); };
        const clrB = el('button', T.clear, r5); clrB.type = 'button'; clrB.onclick = clearResult;
        const r6 = el('div', null, stemsBox, 'row');
        const bpmL = el('label', T.bpm, r6); const bpm = el('input', null, bpmL); bpm.type = 'number'; bpm.min = '0'; bpm.max = '300'; bpm.step = '0.1'; bpm.title = T.bpmHint; bpm.setAttribute('aria-label', T.bpm);
        bpm.onchange = () => { const v = parseFloat(bpm.value); state.bpm = Number.isFinite(v) && v >= 20 ? cl(v, 20, 300) : 0; bpm.value = String(state.bpm); };
        const lpL = el('label', null, r6); lpL.className = 'inl'; const loop = el('input', null, lpL); loop.type = 'checkbox'; el('span', T.loop, lpL); loop.onchange = () => { state.loop = loop.checked; };
        el('div', T.playHint, stemsBox, 'hint');
        // slepen van een bestand op de kaart; de host laat een afgehandelde drop met rust
        const hasFiles = e => e.dataTransfer && Array.prototype.includes.call(e.dataTransfer.types || [], 'Files');
        app.addEventListener('dragover', e => { if (hasFiles(e)) { e.preventDefault(); app.classList.add('drop'); } });
        app.addEventListener('dragleave', () => app.classList.remove('drop'));
        app.addEventListener('drop', e => { app.classList.remove('drop'); if (!hasFiles(e)) return; e.preventDefault(); takeFile(e.dataTransfer.files && e.dataTransfer.files[0]); });
        sh.addEventListener('pointerdown', e => e.stopPropagation()); sh.addEventListener('keydown', e => e.stopPropagation()); app.addEventListener('pointerenter', () => paint());
        ui = { source: srcLine, rec: recB, recLen, service, model, info, split: splitB, status, stemsBox, stems, bits, bpm, loop, midi: midiB, drums: drumsB }; paint();
        stopFrame = host.frame(self, frame, 10);
      },
      unmount() { if (typeof stopFrame === 'function') stopFrame(); stopFrame = null; if (shell) shell.remove(); shell = ui = null; },
      onTransport(e) { playing = !!(e && e.playing); if (playing) { done = false; stopAll(); } else stopAll(); },
      onStep(info) {
        try {
          if (dead || !playing || !result || !info) return;
          if (!active.length && !done && (Math.floor(info.step) || 0) === 0) startAt(info.time);
          else if (active.length && state.bpm > 0) { const r = rateNow(), t = Number.isFinite(info.time) ? info.time : ctx.currentTime; for (const s of active) { try { s.playbackRate.setValueAtTime(r, t); } catch (e) { /* ok */ } } }
        } catch (e) { /* de planner mag niet vallen */ }
      },
      bundles: { all: () => ({ label: T.all, channels: curIds().filter(id => outs.has(id)).map(id => ({ id, name: stemName(id), node: outs.get(id) })) }) },
      loadAudio(files) { const f = files && files[0]; if (!f) return Promise.resolve(); setSource(f, f.name); return Promise.resolve(); },
      getState() { return JSON.parse(JSON.stringify(state)); },
      setState(s) {
        if (dead) return; s = s && typeof s === 'object' ? s : {};
        const mix = {}; if (s.mix && typeof s.mix === 'object') for (const k of Object.keys(s.mix).slice(0, MAX_STEMS)) { const m = s.mix[k]; if (!okId(k) || !m || typeof m !== 'object') continue; mix[k] = { level: num(m.level, 0, 1.5, 1), mute: m.mute === true, solo: m.solo === true }; }
        let layout = DEF_IDS.slice(); if (Array.isArray(s.layout)) { const l = [...new Set(s.layout.filter(okId))].slice(0, MAX_STEMS); if (l.length) layout = l; }
        if (result) layout = curIds();   // zijn er stems geladen, dan houden de uitgangen hun vorm
        state = { service: pick(s.service, SERVICES, DEFAULTS.service), model: typeof s.model === 'string' && /^[\w.-]{0,100}$/.test(s.model) ? s.model : '', bits: pick(s.bits, BITS, 16), rec: pick(s.rec, Object.keys(RECS), 's30'),
          loop: s.loop === true, bpm: num(s.bpm, 0, 300, 0) >= 20 ? num(s.bpm, 0, 300, 0) : 0, mix, layout: state.layout };
        applyLayout(layout); applyMix(); paint();
      },
      getPreset() { const p = self.getState(); delete p.layout; return p; },
      setPreset(p) { p = p && typeof p === 'object' ? p : {}; const s = self.getState(); self.setState({ ...s, ...p, layout: s.layout }); },
      destroy() {
        if (dead) return; dead = true; runId++; cancelSplit(); stopAll(); self.unmount();
        try { if (node) node.port.postMessage({ t: 'stop' }); } catch (e) { /* ok */ }
        for (const n of [inG, node, ...outs.values()]) { try { n && n.disconnect(); } catch (e) { /* ok */ } }
        rec = null; result = null; source = null;
      }
    });
    return self;
  }
};
