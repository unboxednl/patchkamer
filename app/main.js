// SPDX-License-Identifier: AGPL-3.0-or-later
// Patchkamer desktop app: the host in its own window. The page is served from a local server on 127.0.0.1
// (a fixed port, so settings and workspaces stay in the same place), with the bundled library under /bibliotheek/.
'use strict';
const { app, BrowserWindow, session, shell, Menu, ipcMain, desktopCapturer } = require('electron');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { manifest } = require('./library');

const PROBE = process.argv.includes('--probe');
const ASIO_TEST = process.argv.some(a => a === '--asio-test' || a.startsWith('--asio-test='));
const PORT = 47318;

// Chromium: audio may start without a click; no throttling when the window is in the background.
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('disable-background-timer-throttling');
if (process.env.PK_HEADLESS) app.commandLine.appendSwitch('ozone-platform', 'headless');

const repoRoot = path.join(__dirname, '..');
// The host is a folder: patchkamer.html with, when split up, the folders js, css and i18n next to it.
const hostDir = app.isPackaged ? path.join(process.resourcesPath, 'patchkamer') : path.join(repoRoot, 'patchkamer');
const hostFile = path.join(hostDir, 'patchkamer.html');
const HOST_FOLDERS = new Set(['js', 'css', 'i18n', 'fonts', 'img']);
const bundledRoot = app.isPackaged ? path.join(process.resourcesPath, 'library') : repoRoot;
// A folder "bibliotheek" next to the exe replaces the bundled library (own devices without a new build).
const exeDir = process.env.PORTABLE_EXECUTABLE_DIR || path.dirname(process.execPath);
const overrideRoot = path.join(exeDir, 'bibliotheek');
const libRoot = fs.existsSync(overrideRoot) ? overrideRoot : bundledRoot;
const SERVED = new Set(['devices', 'presets', 'tunes']);
const TYPES = { '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json; charset=utf-8', '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8' };

function send(res, code, body, type) {
  res.writeHead(code, { 'Content-Type': type || 'text/plain; charset=utf-8', 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff',
    // cross-origin isolated: shared memory between the audio thread and a worker (native audio). "credentialless" keeps other sites loadable.
    'Cross-Origin-Opener-Policy': 'same-origin', 'Cross-Origin-Embedder-Policy': 'credentialless' });
  res.end(body);
}
// The page of the host gets one extra script (the audio of the app); the file in the repo stays as it is.
function sendHost(res) {
  fs.readFile(hostFile, 'utf8', (err, html) => {
    if (err) return send(res, 404, 'not found');
    const tag = '<script src="/__app/asio.js"></script>';
    send(res, 200, /<head[^>]*>/i.test(html) ? html.replace(/<head[^>]*>/i, m => m + tag) : tag + html, TYPES['.html']);
  });
}
function sendFile(res, file) {
  fs.readFile(file, (err, buf) => err ? send(res, 404, 'not found') : send(res, 200, buf, TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream'));
}

function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'method not allowed');
  let p;
  try { p = decodeURIComponent(new URL(req.url, 'http://x').pathname); } catch (e) { return send(res, 400, 'bad request'); }
  if (p === '/' || p === '/patchkamer.html') return sendHost(res);
  if (p === '/version.json') return sendFile(res, path.join(hostDir, 'version.json'));
  if (p === '/__app/asio.js') return sendFile(res, path.join(__dirname, 'app-asio.js'));
  { const parts = p.split('/').filter(Boolean);
    if (parts.length >= 2 && HOST_FOLDERS.has(parts[0]) && /\.(m?js|css|json|png|svg|woff2?|ico)$/i.test(p)) {
      const file = path.resolve(hostDir, ...parts);
      if (!file.startsWith(hostDir + path.sep)) return send(res, 403, 'forbidden');
      return sendFile(res, file); } }
  // the host's own stylesheets and scripts (patchkamer/css, patchkamer/js, patchkamer/i18n), loaded by patchkamer.html with relative paths
  if (/^\/(css|js|i18n)\/[a-z0-9-]+\.(css|js)$/.test(p)) return sendFile(res, path.join(path.dirname(hostFile), p));
  if (PROBE && p === '/probe.html') return sendFile(res, path.join(__dirname, 'probe.html'));
  if (p === '/bibliotheek/patchkamer.json') {
    const own = path.join(libRoot, 'patchkamer.json');
    if (libRoot === overrideRoot && fs.existsSync(own)) return sendFile(res, own);
    return send(res, 200, JSON.stringify(manifest(libRoot)), TYPES['.json']);
  }
  if (p.startsWith('/bibliotheek/')) {
    const rel = p.slice('/bibliotheek/'.length);
    const top = rel.split('/')[0];
    if (!SERVED.has(top) && !(libRoot === overrideRoot)) return send(res, 404, 'not found');
    const file = path.resolve(libRoot, rel);
    if (file !== libRoot && !file.startsWith(libRoot + path.sep)) return send(res, 403, 'forbidden');
    return sendFile(res, file);
  }
  send(res, 404, 'not found');
}


// ---- native audio (ASIO): settings, the device, and the audio from the page ----
let nativeAudio = null; try { nativeAudio = require('./asio').native; } catch (e) {}
const TEST_CLOCK = 'Test clock (no sound)';
const cfgFile = () => path.join(app.getPath('userData'), 'asio.json');
function cleanCfg(c) {
  c = c && typeof c === 'object' ? c : {};
  const n = (v, lo, hi, d) => { v = +v; return Number.isFinite(v) ? Math.min(hi, Math.max(lo, Math.round(v))) : d; };
  return { enabled: c.enabled === true, driver: String(c.driver || '').slice(0, 120), buffer: n(c.buffer, 0, 8192, 0), pair: n(c.pair, 0, 15, 0),
           targetMs: n(c.targetMs, 2, 60, 8), sampleRate: [44100, 48000, 88200, 96000].includes(+c.sampleRate) ? +c.sampleRate : 48000 };
}
function readCfg() { try { return cleanCfg(JSON.parse(fs.readFileSync(cfgFile(), 'utf8'))); } catch (e) { return cleanCfg({}); } }
function writeCfg(c) { try { fs.mkdirSync(path.dirname(cfgFile()), { recursive: true }); fs.writeFileSync(cfgFile(), JSON.stringify(c, null, 1)); } catch (e) {} }
let asioInfo = { ok: false, reason: 'off' };
function openAsio(cfg) {
  if (nativeAudio) { try { nativeAudio.close(); } catch (e) {} }
  if (!nativeAudio) return (asioInfo = { ok: false, reason: 'unavailable' });
  if (!cfg.enabled) return (asioInfo = { ok: false, reason: 'off' });
  const drivers = nativeAudio.list();
  const driver = drivers.includes(cfg.driver) ? cfg.driver : drivers.find(d => d !== TEST_CLOCK);
  if (!driver) return (asioInfo = { ok: false, reason: 'nodriver' });
  const info = nativeAudio.open({ driver, sampleRate: cfg.sampleRate, bufferSize: cfg.buffer, pair: cfg.pair, targetMs: cfg.targetMs });
  if (!info.ok) return (asioInfo = { ok: false, reason: 'open', driver, error: info.error });
  const st = nativeAudio.start();
  if (!st.ok) { nativeAudio.close(); return (asioInfo = { ok: false, reason: 'start', driver, error: st.error }); }
  return (asioInfo = info);
}
let appOrigin = '';
const trusted = e => !!(e.senderFrame && appOrigin && e.senderFrame.url.startsWith(appOrigin + '/'));
let audioPort = null, portMsgs = 0, portBad = 0, portType = '';
ipcMain.on('app:info', e => { e.returnValue = trusted(e) ? { version: app.getVersion(), packaged: app.isPackaged } : null; });
ipcMain.on('asio:open', e => { e.returnValue = trusted(e) ? openAsio(readCfg()) : { ok: false, reason: 'untrusted' }; });
ipcMain.handle('asio:list', e => (trusted(e) && nativeAudio ? nativeAudio.list() : []));
ipcMain.handle('asio:getConfig', e => (trusted(e) ? { cfg: readCfg(), info: asioInfo, built: !!(nativeAudio && nativeAudio.asioAvailable()) } : null));
ipcMain.handle('asio:setConfig', (e, c) => { if (!trusted(e)) return null; const cfg = cleanCfg(c); writeCfg(cfg); return { cfg, info: openAsio(cfg) }; });
ipcMain.handle('asio:stats', e => (trusted(e) && nativeAudio ? { info: asioInfo, stats: nativeAudio.stats(), port: { messages: portMsgs, bad: portBad, type: portType } } : null));
ipcMain.handle('asio:panel', e => (trusted(e) && nativeAudio ? nativeAudio.controlPanel() : false));
ipcMain.on('asio:port', e => {
  if (!trusted(e) || !nativeAudio || !e.ports[0]) return;
  if (audioPort) { try { audioPort.close(); } catch (err) {} }
  audioPort = e.ports[0];
  audioPort.on('message', m => {
    const d = m.data; portMsgs++; if (!d) { portBad++; return; } if (!portType) portType = Object.prototype.toString.call(d) + ' ' + (d.constructor && d.constructor.name);
    const f = d instanceof Float32Array ? d : (d.buffer instanceof ArrayBuffer ? new Float32Array(d.buffer, d.byteOffset || 0, (d.byteLength || 0) >> 2) : null);
    if (f && f.length >= 2) nativeAudio.write(f); else portBad++;
  });
  audioPort.start();
});
app.on('before-quit', () => { if (nativeAudio) { try { nativeAudio.close(); } catch (e) {} } });

function listen() {
  return new Promise((resolve, reject) => {
    const s = http.createServer(handler);
    s.once('error', e => {
      if (e.code !== 'EADDRINUSE') return reject(e);
      const s2 = http.createServer(handler); // port taken: random port (settings are then stored under another address)
      s2.listen(0, '127.0.0.1', () => resolve({ server: s2, port: s2.address().port, fixed: false }));
    });
    s.listen(PORT, '127.0.0.1', () => resolve({ server: s, port: PORT, fixed: true }));
  });
}

function locked(win, origin) {
  win.webContents.setWindowOpenHandler(({ url }) => { if (/^https?:/i.test(url)) shell.openExternal(url); return { action: 'deny' }; });
  win.webContents.on('will-navigate', (e, url) => { if (!url.startsWith(origin)) { e.preventDefault(); if (/^https?:/i.test(url)) shell.openExternal(url); } });
}

app.whenReady().then(async () => {
  if (ASIO_TEST) {
    // no window: test the native audio, write the result next to the exe (or in the current folder) and quit
    let out; try { out = await require('./asio-test').run(process.argv); } catch (e) { out = { error: String(e && e.stack || e) }; }
    const json = JSON.stringify(out, null, 1); console.log(json);
    try { fs.writeFileSync(path.join(app.isPackaged ? exeDir : process.cwd(), 'patchkamer-asio.json'), json); } catch (err) {}
    app.exit(0); return;
  }
  const { port, fixed } = await listen();
  const origin = 'http://127.0.0.1:' + port; appOrigin = origin;
  // Only what the host needs: MIDI, audio input, fullscreen. The rest is refused. (Electron asks for 'midiSysex' on every MIDI request, even when the page passes sysex:false, so refusing it would block MIDI altogether.)
  const ok = new Set(['midi', 'midiSysex', 'media', 'fullscreen', 'clipboard-sanitized-write', 'audioCapture', 'display-capture']);
  session.defaultSession.setPermissionRequestHandler((wc, perm, cb, details) => cb(ok.has(perm)));
  session.defaultSession.setPermissionCheckHandler((wc, perm) => ok.has(perm));
  // Audio Capture asks the page for screen sharing to get sound (getDisplayMedia). Only our own page may ask. There is no picker: the first screen
  // is shared (the picture is never used) and, on Windows only (Electron 33), the sound of the whole system as loopback. Elsewhere there is no sound
  // to share and the device says so.
  session.defaultSession.setDisplayMediaRequestHandler(async (request, callback) => {
    try {
      if (!request.securityOrigin || !request.securityOrigin.startsWith(origin)) { callback({}); return; }
      const sources = await desktopCapturer.getSources({ types: ['screen'], thumbnailSize: { width: 0, height: 0 } });
      if (!sources.length) { callback({}); return; }
      const grant = { video: sources[0] };
      if (process.platform === 'win32' && request.audioRequested) grant.audio = 'loopback';
      callback(grant);
    } catch (err) { callback({}); }
  });
  Menu.setApplicationMenu(null);
  const win = new BrowserWindow({
    width: 1440, height: 900, minWidth: 900, minHeight: 600, title: 'Patchkamer', show: !PROBE, backgroundColor: '#14161a',
    autoHideMenuBar: true,
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true, backgroundThrottling: false },
  });
  locked(win, origin);
  win.setTitle('Patchkamer ' + app.getVersion()); win.on('page-title-updated', e => e.preventDefault());
  if (PROBE) {
    win.webContents.on('console-message', (e, level, msg) => {
      const text = typeof msg === 'string' ? msg : (e && e.message) || '';
      if (text.startsWith('PROBE ')) {
        const json = text.slice(6); console.log(json);
        // A packaged exe has no console: also write the result next to the exe (or in the current folder).
        const dir = app.isPackaged ? exeDir : process.cwd();
        try { fs.writeFileSync(path.join(dir, 'patchkamer-probe.json'), json); } catch (err) {}
        app.exit(0);
      }
    });
    setTimeout(() => { console.log(JSON.stringify({ error: 'timeout' })); app.exit(1); }, 30000);
    await win.loadURL(origin + '/probe.html');
    return;
  }
  if (!fixed) console.warn('Port ' + PORT + ' in use; using ' + port + '. Settings are stored per address.');
  win.loadURL(origin + '/');
});
app.on('window-all-closed', () => app.quit());
