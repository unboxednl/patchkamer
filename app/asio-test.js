// SPDX-License-Identifier: AGPL-3.0-or-later
// `--asio-test[=name]`: lists the ASIO drivers, opens one, plays a soft 440 Hz tone for 2.5 seconds through it and
// reports buffer size, latencies and whether the buffer ran dry. Options: --buffer=<frames> --target=<ms> --pair=<n>.
'use strict';
const { native, loadError } = require('./asio');

const sleep = ms => new Promise(r => setTimeout(r, ms));
const arg = (argv, key) => { const a = argv.find(x => x === '--' + key || x.startsWith('--' + key + '=')); return a ? (a.includes('=') ? a.slice(a.indexOf('=') + 1) : '') : null; };

async function play(driver, o, seconds) {
  const res = { driver };
  const info = native.open({ driver, sampleRate: 48000, bufferSize: o.buffer, pair: o.pair, targetMs: o.target });
  res.open = info;
  if (!info.ok) return res;
  const sr = info.sampleRate, st = native.start();
  res.start = st;
  if (!st.ok) { native.close(); return res; }
  const blk = 256, buf = new Float32Array(blk * 2); let ph = 0, sent = 0;
  const t0 = Date.now(), total = seconds * sr;
  while (Date.now() - t0 < seconds * 1000 + 200) {
    const want = Math.min(total, Math.floor((Date.now() - t0) / 1000 * sr) + 1024);
    while (sent < want) {
      for (let i = 0; i < blk; i++) {
        const t = (sent + i) / sr, env = Math.min(1, t / 0.05, (seconds - t) / 0.05);
        const s = 0.2 * Math.max(0, env) * Math.sin(ph); ph += 2 * Math.PI * 440 / sr; buf[2 * i] = buf[2 * i + 1] = s;
      }
      sent += native.write(buf);
    }
    await sleep(3);
  }
  await sleep(150);
  const s = native.stats();
  res.stats = s;
  // what we add on top of the buffers of the driver: the margin of the ring buffer
  res.ringMs = +(s.target / sr * 1000).toFixed(2);
  res.driverOutputMs = +((info.outputLatency || 0) / sr * 1000).toFixed(2);
  res.bufferMs = +(info.bufferSize / sr * 1000).toFixed(2);
  res.totalFromRingMs = +(res.ringMs + res.driverOutputMs).toFixed(2);
  native.stop(); native.close();
  return res;
}

async function run(argv) {
  const out = { native: !!native, loadError, asioBuilt: native ? native.asioAvailable() : false };
  if (!native) return out;
  out.drivers = native.list();
  const o = { buffer: +(arg(argv, 'buffer') || 0), target: +(arg(argv, 'target') || 8), pair: +(arg(argv, 'pair') || 0) };
  out.options = o;
  const want = (arg(argv, 'asio-test') || '').toLowerCase();
  const real = out.drivers.filter(d => d !== 'Test clock (no sound)');
  // the drivers to try: the one that matches the name, or all of them in turn until one opens (a driver of a device that is not connected fails)
  const tryList = want ? real.filter(d => d.toLowerCase().includes(want)) : real;
  out.runs = []; out.failed = [];
  for (const d of tryList) {
    const r = await play(d, o, 2.5);
    if (r.open && r.open.ok && (!r.start || r.start.ok)) { out.runs.push(r); break; }
    out.failed.push({ driver: d, open: r.open, start: r.start });
  }
  if (!out.runs.length) out.note = !real.length ? 'no ASIO driver found' : want && !tryList.length ? 'no driver matches ' + want : 'no driver could be opened';
  out.runs.push(await play('Test clock (no sound)', o, 1.5));   // the software side without a sound card, for comparison
  return out;
}
module.exports = { run };
