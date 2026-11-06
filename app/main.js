// SPDX-License-Identifier: AGPL-3.0-or-later
// Patchkamer desktop app: the host in its own window. The page is served from a local server on 127.0.0.1
// (a fixed port, so settings and workspaces stay in the same place), with the bundled library under /bibliotheek/.
'use strict';
const { app, BrowserWindow, session, shell, Menu } = require('electron');
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
  res.writeHead(code, { 'Content-Type': type || 'text/plain; charset=utf-8', 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff' });
  res.end(body);
}
function sendFile(res, file) {
  fs.readFile(file, (err, buf) => err ? send(res, 404, 'not found') : send(res, 200, buf, TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream'));
}

function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'method not allowed');
  let p;
  try { p = decodeURIComponent(new URL(req.url, 'http://x').pathname); } catch (e) { return send(res, 400, 'bad request'); }
  if (p === '/' || p === '/patchkamer.html') return sendFile(res, hostFile);
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
  const origin = 'http://127.0.0.1:' + port;
  // Only what the host needs: MIDI (no sysex), audio input, fullscreen. The rest is refused.
  const ok = new Set(['midi', 'media', 'fullscreen', 'clipboard-sanitized-write', 'audioCapture']);
  session.defaultSession.setPermissionRequestHandler((wc, perm, cb, details) => cb(ok.has(perm) && !(perm === 'midi' && details && details.midiSysex)));
  session.defaultSession.setPermissionCheckHandler((wc, perm) => ok.has(perm));
  Menu.setApplicationMenu(null);
  const win = new BrowserWindow({
    width: 1440, height: 900, minWidth: 900, minHeight: 600, title: 'Patchkamer', show: !PROBE, backgroundColor: '#14161a',
    autoHideMenuBar: true,
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true, backgroundThrottling: false },
  });
  locked(win, origin);
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
