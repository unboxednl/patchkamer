// SPDX-License-Identifier: AGPL-3.0-or-later
// Gives the page a small, fixed set of calls for the native audio (ASIO). Nothing else of Node is exposed.
'use strict';
const { contextBridge, ipcRenderer } = require('electron');

// Synchronous on purpose: the page must know before its first script runs whether the audio goes through ASIO.
let info = { ok: false, reason: 'unavailable' };
try { info = ipcRenderer.sendSync('asio:open') || info; } catch (e) {}

contextBridge.exposeInMainWorld('pkNative', {
  asio: {
    info,
    list: () => ipcRenderer.invoke('asio:list'),
    getConfig: () => ipcRenderer.invoke('asio:getConfig'),
    setConfig: cfg => ipcRenderer.invoke('asio:setConfig', cfg),
    stats: () => ipcRenderer.invoke('asio:stats'),
    panel: () => ipcRenderer.invoke('asio:panel'),
  },
});

// The audio itself goes over a MessageChannel straight to the main process; the page asks for its end of it.
window.addEventListener('message', e => {
  if (e.origin !== location.origin || !e.data || e.data.pkAsio !== 'want') return;
  const ch = new MessageChannel();
  ipcRenderer.postMessage('asio:port', null, [ch.port2]);
  window.postMessage({ pkAsio: 'port' }, '*', [ch.port1]);
});
