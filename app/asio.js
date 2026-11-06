// SPDX-License-Identifier: AGPL-3.0-or-later
// Loads the native audio addon. Without it (not built, other platform) the app still runs on the audio of Chromium.
'use strict';
let native = null, loadError = null;
try { native = require('./build/Release/patchkamer_asio.node'); } catch (e) { loadError = e.message; }
module.exports = { native, loadError, available: !!native };
