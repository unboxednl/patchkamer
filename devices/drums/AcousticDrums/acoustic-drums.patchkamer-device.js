// SPDX-License-Identifier: AGPL-3.0-or-later
// 1.1.0 — restoreFiles() (contract v1.36): na het openen van een song haalt de host de kit opnieuw op als de state `kit: true` heeft (de gebruiker had een kit geladen); dezelfde laadroutine als de knop, niets als de kit al klopt.
// 1.0.0 — Acoustic Drums: een gesampled akoestisch drumstel voor funk, soul en jazz (Patchkamer contract v1.36). De opnames komen via een link van internet
//         (host.fetchFile, alleen na een klik op "Kit laden"; nooit gekopieerd naar de repo) uit Virtuosity Drums (Versilian Studios, drummer Austin McMahon, CC0 1.0).
//         Velocity-lagen met een zachte overgang tussen aangrenzende lagen, round robin zonder directe herhaling, kleine variatie in stemming en niveau, humanize,
//         snare met automatische ghost note en rimshot, snaren aan/uit, stemming en demping, hi-hat met afkappen (geen plop), bekkens met afgrijpen, toms, kiesbare microfoons,
//         zeven audio-uitgangen, een patroon van vier stappenrijen (A tot D) en het klembord voor drums. getState bevat instellingen en nooit audio.
//         Niet beluisterd; gemeten staat in AGENTS.md.

const BASE = 'https://cdn.jsdelivr.net/gh/sfzinstruments/virtuosity_drums@9f04cf9a734527edfbb0a4eee1f674e45bbf71bc/';
// jsDelivr weigert enkele bestanden van deze grote repo (403, pakketgrens); dan valt het apparaat terug op dezelfde vastgepinde commit bij GitHub zelf
const RAW = 'https://raw.githubusercontent.com/sfzinstruments/virtuosity_drums/9f04cf9a734527edfbb0a4eee1f674e45bbf71bc/';
const SRC = { home: 'https://github.com/sfzinstruments/virtuosity_drums', author: 'Versilian Studios; drummer Austin McMahon', license: 'CC0-1.0',
  attribution: 'Virtuosity Drums, Versilian Studios, drums performed by Austin McMahon, CC0 1.0' };
const MICIDS = ['kickmic', 'snaremic', 'oh', 'mid', 'room', 'lofi'];
const GROUPS = ['kick', 'snare', 'hats', 'toms', 'cymbals'];
// [map, bestandsnaamdeel, nummer van round robin (0 = geen), bovengrenzen van de velocity-lagen (1..127), gemiddelde grootte per bestand in kB per microfoon, maxBytes, 1 = geen laagnummer]
const ARTS={K_on:['kick','snon',4,[31,63,95,127],[97,94,217,252,246,133],393216,0],K_off:['kick','snoff',4,[31,63,95,127],[98,92,216,253,245,134],524288,0],S_c:['snare','center',0,[3,7,10,14,17,21,24,27,31,34,38,41,45,48,52,55,59,63,66,70,73,77,80,84,87,91,95,98,102,105,109,112,116,119,123,127],[81,85,190,216,214,112],393216,0],S_oc:['snare','offcenter',0,[3,7,10,14,17,21,24,27,31,34,38,41,45,48,52,55,59,63,66,70,73,77,80,84,87,91,95,98,102,105,109,112,116,119,123,127],[94,101,223,252,251,132],393216,0],S_rim:['snare','rimshot',0,[10,21,32,42,53,63,74,85,95,106,117,127],[109,122,263,288,290,149],524288,0],S_x:['snare','crossstick',0,[7,15,23,31,39,47,55,63,71,79,87,95,103,111,119,127],[112,113,264,306,299,161],458752,0],S_mu:['snare','muted',0,[7,15,23,31,39,47,55,63,71,79,87,95,103,111,119,127],[54,54,126,143,142,74],262144,0],S_ho:['snare','halfopen',0,[7,15,23,31,39,47,55,63,71,79,87,95,103,111,119,127],[61,62,143,162,162,84],262144,0],S_fl:['snare','flam',0,[10,21,32,42,53,63,74,85,95,106,117,127],[99,103,234,266,263,139],458752,0],S_bz:['snare','buzz',0,[10,21,32,42,53,63,74,85,95,106,117,127],[110,119,266,294,296,152],458752,0],S_ss:['snare','stickshot2',0,[7,15,23,31,39,47,55,63,71,79,87,95,103,111,119,127],[60,60,140,161,160,85],262144,0],O_c:['snareoff','center',0,[10,21,32,42,53,63,74,85,95,106,117,127],[77,79,181,208,204,109],393216,0],O_oc:['snareoff','offcenter',0,[10,21,32,42,53,63,74,85,95,106,117,127],[84,89,198,227,222,119],393216,0],O_x:['snareoff','crossstick',0,[12,25,37,50,63,75,88,101,113,127],[76,78,180,207,203,109],327680,0],O_mu:['snareoff','muted',0,[10,21,32,42,53,63,74,85,95,106,117,127],[58,58,136,157,154,83],262144,0],O_ho:['snareoff','halfopen',0,[10,21,32,42,53,63,74,85,95,106,117,127],[67,68,156,182,178,96],327680,0],O_fl:['snareoff','flam',0,[10,21,32,42,53,63,74,85,95,106,117,127],[67,70,157,180,177,94],327680,0],O_bz:['snareoff','buzz',0,[10,21,32,42,53,63,74,85,95,106,117,127],[82,90,198,220,218,115],393216,0],O_ss:['snareoff','stickshot2',0,[10,21,32,42,53,63,74,85,95,106,117,127],[57,57,133,153,152,80],262144,0],H_cl:['hh','closed',4,[31,63,95,127],[35,36,83,94,96,47],196608,0],H_pd:['hh','pedal',4,[42,85,127],[91,92,213,245,243,128],393216,0],H_ho:['hh','half',4,[31,63,95,127],[100,112,249,266,272,136],458752,0],H_34:['hh','34',4,[31,63,95,127],[347,394,877,940,959,485],1441792,0],H_op:['hh','open',3,[31,63,95,127],[420,447,1017,1138,1120,601],2097152,0],H_sp:['hh','splash',4,[127],[218,249,556,595,608,306],917504,1],R_r:['ride','ride',4,[42,85,127],[366,364,904,1021,1022,518],1703936,0],R_b:['ride','bell',3,[42,85,127],[291,289,722,811,813,409],1507328,0],C_c:['crash','crash',4,[42,85,127],[571,578,1369,1544,1521,806],2424832,0],C_z:['crash','sizzle',4,[42,85,127],[510,521,1251,1397,1400,701],2228224,0],F_r:['flatride','ride',4,[42,85,127],[435,475,1163,1196,1288,626],2162688,0],F_c:['flatride','crash',0,[31,63,95,127],[831,903,2205,2251,2412,1169],3342336,0],T_c:['ltom','center',0,[7,15,23,31,39,47,55,63,71,79,87,95,103,111,119,127],[168,165,387,449,434,236],786432,0],T_oc:['ltom','offcenter',0,[10,21,32,42,53,63,74,85,95,106,117,127],[189,187,438,510,493,267],851968,0],T_rim:['ltom','rimshot',0,[12,25,37,50,63,75,88,101,113,127],[168,166,388,449,436,235],786432,0],T_x:['ltom','crossstick',0,[12,25,37,50,63,75,88,101,113,127],[105,104,245,286,279,151],458752,0],T_mu:['ltom','muted',0,[7,15,23,31,39,47,55,63,71,79,87,95,103,111,119,127],[90,88,206,240,235,126],393216,0],T_ho:['ltom','halfopen',0,[7,15,23,31,39,47,55,63,71,79,87,95,103,111,119,127],[94,92,217,253,246,133],458752,0],U_c:['htom','center',0,[7,15,23,31,39,47,55,63,71,79,87,95,103,111,119,127],[87,89,205,236,230,123],393216,0],U_oc:['htom','offcenter',0,[7,15,23,31,39,47,55,63,71,79,87,95,103,111,119,127],[107,110,251,290,282,152],524288,0]};
// [aantal lagen, aantal round robins] per artikulatie; de lagen worden gelijkmatig over het bereik gekozen
const SETS = {
  funk: { mics: ['mid'], want: { K_on: [3, 2], S_c: [8, 1], S_rim: [4, 1], S_x: [4, 1], S_mu: [5, 1], S_ho: [3, 1], S_fl: [3, 1], H_cl: [4, 2], H_pd: [3, 2], H_ho: [3, 1], H_34: [2, 1], H_op: [3, 1], H_sp: [1, 1], R_r: [3, 2], R_b: [2, 1], C_c: [3, 1], T_c: [4, 1], U_c: [4, 1] } },
  funklite: { mics: ['mid'], want: { K_on: [2, 2], S_c: [5, 1], S_rim: [2, 1], S_x: [2, 1], S_mu: [3, 1], S_ho: [2, 1], H_cl: [3, 2], H_pd: [2, 1], H_ho: [2, 1], H_op: [2, 1], R_r: [2, 1], R_b: [1, 1], C_c: [2, 1], T_c: [3, 1], U_c: [3, 1] } },
  jazz: { mics: ['mid'], want: { K_on: [3, 2], K_off: [2, 1], S_c: [6, 1], S_oc: [2, 1], S_x: [4, 1], S_mu: [4, 1], S_ho: [3, 1], S_fl: [3, 1], S_bz: [3, 1], O_c: [5, 1], O_x: [3, 1], O_mu: [3, 1], H_cl: [4, 2], H_pd: [3, 2], H_ho: [2, 1], H_op: [3, 1], H_sp: [1, 1], R_r: [3, 3], R_b: [3, 1], F_r: [3, 2], C_c: [3, 1], C_z: [2, 1], T_c: [4, 1], T_mu: [3, 1], U_c: [4, 1] } }
};
// klanken: [id, MIDI-noot, uitgangsgroep, Nederlandse naam, Engelse naam]
const SND = [
  ['kick', 36, 'kick', 'Kick', 'Kick'], ['snare', 38, 'snare', 'Snare (automatisch)', 'Snare (auto)'], ['sidestick', 37, 'snare', 'Side stick', 'Side stick'], ['rimshot', 40, 'snare', 'Rimshot', 'Rimshot'],
  ['offcenter', 39, 'snare', 'Snare naast het midden', 'Snare off-centre'], ['ghost', 86, 'snare', 'Ghost note (gedempt)', 'Ghost note (muted)'], ['halfopen', 87, 'snare', 'Snare half gedempt', 'Snare half-muted'],
  ['stickshot', 85, 'snare', 'Stick shot', 'Stick shot'], ['buzz', 93, 'snare', 'Buzz', 'Buzz'], ['flam', 95, 'snare', 'Flam', 'Flam'],
  ['hatclosed', 42, 'hats', 'Hi-hat gesloten', 'Hi-hat closed'], ['hatpedal', 44, 'hats', 'Hi-hat pedaal', 'Hi-hat pedal'], ['hatopen', 46, 'hats', 'Hi-hat open', 'Hi-hat open'],
  ['hathalf', 90, 'hats', 'Hi-hat half open', 'Hi-hat half open'], ['hat34', 94, 'hats', 'Hi-hat driekwart open', 'Hi-hat 3/4 open'], ['hatsplash', 92, 'hats', 'Hi-hat splash', 'Hi-hat splash'],
  ['crash', 49, 'cymbals', 'Crash', 'Crash'], ['sizzle', 57, 'cymbals', 'Crash met sizzle', 'Crash with sizzle'], ['ride', 51, 'cymbals', 'Ride', 'Ride'], ['bell', 53, 'cymbals', 'Ride bell', 'Ride bell'],
  ['flatride', 59, 'cymbals', 'Flat ride', 'Flat ride'], ['flatcrash', 55, 'cymbals', 'Flat ride als crash', 'Flat ride as crash'], ['choke', 52, 'cymbals', 'Bekken afgrijpen', 'Cymbal choke'],
  ['tom41', 41, 'toms', 'Floor tom', 'Floor tom'], ['tom43', 43, 'toms', 'Floor tom hoog', 'Floor tom, high'], ['tom45', 45, 'toms', 'Low tom', 'Low tom'], ['tom47', 47, 'toms', 'Mid tom', 'Mid tom'],
  ['tom48', 48, 'toms', 'High-mid tom', 'High-mid tom'], ['tom50', 50, 'toms', 'High tom', 'High tom'],
  ['floorrim', 98, 'toms', 'Floor tom rimshot', 'Floor tom rimshot'], ['floorstick', 99, 'toms', 'Floor tom side stick', 'Floor tom side stick'], ['floormute', 100, 'toms', 'Floor tom gedempt', 'Floor tom muted'],
  ['floorhalf', 101, 'toms', 'Floor tom half gedempt', 'Floor tom half-muted'], ['flooroff', 97, 'toms', 'Floor tom naast het midden', 'Floor tom off-centre'], ['rackoff', 102, 'toms', 'High-mid tom naast het midden', 'High-mid tom off-centre']
];
const SBYID = Object.fromEntries(SND.map(s => [s[0], s]));
const SBYNOTE = new Map(SND.map(s => [s[1], s[0]]));
// stappenrijen van het patroon: [lane-id van de host, klank, type zoals in Drum Kit]
const LANES = [['kick', 'kick'], ['snare', 'snare'], ['rim', 'sidestick'], ['ghost', 'ghost'], ['closedhat', 'hatclosed'], ['pedalhat', 'hatpedal'], ['openhat', 'hatopen'], ['ride', 'ride'], ['crash', 'crash'], ['lowtom', 'tom45'], ['midtom', 'tom47'], ['hitom', 'tom50']];
const TRIGLANE = { kick: 'kick', snare: 'snare', rim: 'sidestick', closedhat: 'hatclosed', openhat: 'hatopen', pedalhat: 'hatpedal', ghost: 'ghost', rimshot: 'rimshot', crash: 'crash', ride: 'ride', lowtom: 'tom45', midtom: 'tom47', hitom: 'tom50', splash: 'hatsplash' };
const CHOKEFAM = { crash: 'crash', sizzle: 'crash', ride: 'ride', bell: 'ride', flatride: 'flat', flatcrash: 'flat' };
const HATKEY = { closed: 'H_cl', pedal: 'H_pd', half: 'H_ho', t34: 'H_34', open: 'H_op', splash: 'H_sp' };
const HATFALL = { H_cl: ['H_pd'], H_pd: ['H_cl'], H_ho: ['H_34', 'H_op'], H_34: ['H_ho', 'H_op'], H_op: ['H_34', 'H_ho'], H_sp: ['H_op', 'H_34', 'H_ho'] };
// instelbare waarden: [id, min, max, stap, soort, rol, spoor, Nederlandse naam, Engelse naam, standaard, drift, aan]
const PARAMS = [
  ['master', 0, 1, .01, 'pct', 'level', 'mix', 'Master', 'Master', .8, .005, 0],
  ['levels.kick', 0, 1.5, .01, 'pct', 'level', 'mix', 'Kick', 'Kick', 1, .01, 0], ['levels.snare', 0, 1.5, .01, 'pct', 'level', 'mix', 'Snare', 'Snare', 1, .01, 0],
  ['levels.hats', 0, 1.5, .01, 'pct', 'level', 'mix', 'Hi-hats', 'Hi-hats', 1, .01, 0], ['levels.toms', 0, 1.5, .01, 'pct', 'level', 'mix', 'Toms', 'Toms', 1, .01, 0],
  ['levels.cymbals', 0, 1.5, .01, 'pct', 'level', 'mix', 'Bekkens', 'Cymbals', 1, .01, 0],
  ['kickTune', -6, 6, .1, 'st', 'pitch', 'kick', 'Kick stemming', 'Kick tuning', 0, .02, 0], ['kickRing', 0, 1, .01, 'pct', 'decay', 'kick', 'Kick uitklinking', 'Kick ring', 1, .05, 0],
  ['bleed', 0, 1, .01, 'pct', 'mix', 'kick', 'Snaarbleed', 'Snare bleed', 1, .05, 0],
  ['snareTune', -6, 6, .1, 'st', 'pitch', 'snare', 'Snare stemming', 'Snare tuning', 0, .02, 0], ['snareRing', 0, 1, .01, 'pct', 'decay', 'snare', 'Snare uitklinking', 'Snare ring', 1, .05, 0],
  ['ghost', 0, .6, .01, 'pct', 'dynamics', 'snare', 'Ghost-drempel', 'Ghost threshold', .28, .02, 0], ['rim', .5, 1, .01, 'pct', 'dynamics', 'snare', 'Rimshot-drempel', 'Rimshot threshold', .93, .02, 0],
  ['floorTune', -6, 6, .1, 'st', 'pitch', 'toms', 'Floor tom stemming', 'Floor tom tuning', 0, .02, 0], ['rackTune', -6, 6, .1, 'st', 'pitch', 'toms', 'Rack tom stemming', 'Rack tom tuning', 0, .02, 0],
  ['tomRing', 0, 1, .01, 'pct', 'decay', 'toms', 'Tom uitklinking', 'Tom ring', 1, .05, 0],
  ['hatFade', .04, .2, .005, 'ms', 'decay', 'hats', 'Hi-hat afkaptijd', 'Hi-hat choke time', .09, .02, 0],
  ['human', 0, .01, .0005, 'ms', 'humanize', 'feel', 'Humanize', 'Humanize', .002, .05, 0], ['variation', 0, 1, .01, 'pct', 'humanize', 'feel', 'Variatie', 'Variation', 1, .05, 0],
  ['swing', 0, .5, .01, 'pct', 'swing', 'feel', 'Swing', 'Swing', 0, .05, 0]
];
MICIDS.forEach((m, i) => {
  PARAMS.push(['micMix.' + m + '.level', 0, 1.5, .01, 'pct', 'level', 'mic.' + m, 'Niveau', 'Level', [.8, .8, 1, 1, .8, .5][i], .01, 0]);
  PARAMS.push(['micMix.' + m + '.pan', -1, 1, .01, 'pan', 'pan', 'mic.' + m, 'Pan', 'Pan', 0, .02, 0]);
});
const PMAP = Object.fromEntries(PARAMS.map(p => [p[0], p]));
const PRESET_SKIP = ['patterns', 'pattern', 'length', 'run', 'swing', 'kit'];
const TXT = {
  nl: {
    kit: 'Kit', setLabel: 'Set', micsLabel: 'Microfoons (kiezen wat je laadt)', load: 'Kit laden', cancel: 'Annuleren', clear: 'Kit wissen',
    sets: { funk: 'Funk en soul', funklite: 'Funk en soul, compact', jazz: 'Jazz' },
    setDesc: {
      funk: 'Snare met ghost notes, rimshot, side stick, flam; hi-hat gesloten, pedaal, half, driekwart, open en splash; ride met bell, crash, twee toms en kick.',
      funklite: 'Dezelfde stukken met minder velocity-lagen en round robins: sneller geladen en lichter in het geheugen.',
      jazz: 'Ook snaren uit, flat ride, sizzle-crash, buzz en een kick zonder snaarresonantie, met meer round robins op ride en hi-hat.'
    },
    mics: { kickmic: 'Kick-microfoon', snaremic: 'Snare-microfoon', oh: 'Overheads', mid: 'Midden (het hele stel)', room: 'Room', lofi: 'Lo-fi' },
    est: (n, mb) => `Download: ${n} bestanden, ongeveer ${mb} MB`, srcLine: 'Opnames: Virtuosity Drums (Versilian Studios), drummer Austin McMahon. Licentie CC0 1.0. Vastgepinde versie, opgehaald via een link van jsDelivr; niets wordt in Patchkamer of de repo bewaard.',
    srcLink: 'Bron en licentie', attrib: 'Vermelding', credit: 'Vermelding (niet verplicht, wel netjes)',
    noKit: 'Geen kit geladen: het apparaat speelt stil. Kies een set en klik op Kit laden.', tuneHint: 'Een tune, preset of song bevat instellingen en geen opnames: klik zelf op Kit laden.',
    loading: (a, b, mb, tot) => `Laden: ${a} van ${b} bestanden, ${mb} MB van ongeveer ${tot} MB`, loaded: (n, mb, dec) => `Geladen: ${n} bestanden, ${mb} MB (in het geheugen ongeveer ${dec} MB)`,
    partial: (n, f, c) => `Geladen met ${f} ontbrekende bestanden (${c}); de rest speelt.`, failAll: c => `Laden mislukt: ${c}. De vorige kit blijft staan.`, aborted: 'Geannuleerd: de vorige kit blijft staan.', cleared: 'Kit gewist.',
    errUrl: 'het adres is niet toegestaan', errAborted: 'geannuleerd', errNetwork: 'geen verbinding of de server staat de aanroep niet toe', errHttp: s => `de server gaf een fout (${s})`, errSize: 'een bestand is groter dan verwacht', errResponse: 'ongeldig antwoord', errDecode: 'een bestand kon niet worden gelezen', errOther: 'onbekende fout',
    oldHost: 'Deze host kan geen bestanden van internet ophalen (contract v1.30). Werk Patchkamer bij.',
    play: 'Spelen', pattern: 'Patroon', len: 'Lengte', steps: 'stappen', run: 'Eigen sequencer', on: 'Aan', off: 'Uit', swing: 'Swing', clearPat: 'Wissen', stepHint: 'Klik: uit, zacht, middel, hard.',
    audition: 'Beluisteren', audVel: 'Velocity', soft: 'Zacht', mid: 'Middel', hard: 'Hard', grp: { kick: 'Kick', snare: 'Snare', hats: 'Hi-hats', toms: 'Toms', cymbals: 'Bekkens' },
    sound: 'Klank', mix: 'Mix', micMix: 'Microfoons', loadedMic: 'geladen', notLoaded: 'niet geladen', laneGroup: { mix: 'Mix', kick: 'Kick', snare: 'Snare', toms: 'Toms', hats: 'Hi-hats', feel: 'Gevoel' },
    snares: 'Snaren', snaresOn: 'Aan', snaresOff: 'Uit', snaresOffMissing: 'Uit (set bevat geen snaren-uit-opnames)',
    patName: p => 'Patroon ' + p, gone: 'Het apparaat is verwijderd.', bad: 'Geen geldige clip.', kind: 'Dit apparaat neemt alleen drums.', ports: 'Uitgangen',
    status: 'Status', audioErr: 'Audio: '
  },
  en: {
    kit: 'Kit', setLabel: 'Set', micsLabel: 'Microphones (choose what to load)', load: 'Load kit', cancel: 'Cancel', clear: 'Clear kit',
    sets: { funk: 'Funk and soul', funklite: 'Funk and soul, compact', jazz: 'Jazz' },
    setDesc: {
      funk: 'Snare with ghost notes, rimshot, side stick and flam; hi-hat closed, pedal, half, three-quarter, open and splash; ride with bell, crash, two toms and kick.',
      funklite: 'The same pieces with fewer velocity layers and round robins: loads faster and takes less memory.',
      jazz: 'Also snares off, flat ride, sizzle crash, buzz and a kick without snare resonance, with more round robins on ride and hi-hat.'
    },
    mics: { kickmic: 'Kick mic', snaremic: 'Snare mic', oh: 'Overheads', mid: 'Mid (the whole kit)', room: 'Room', lofi: 'Lo-fi' },
    est: (n, mb) => `Download: ${n} files, about ${mb} MB`, srcLine: 'Recordings: Virtuosity Drums (Versilian Studios), drummer Austin McMahon. Licence CC0 1.0. Pinned version, fetched through a jsDelivr link; nothing is stored in Patchkamer or the repo.',
    srcLink: 'Source and licence', attrib: 'Credit', credit: 'Credit (not required, but polite)',
    noKit: 'No kit loaded: the device is silent. Choose a set and click Load kit.', tuneHint: 'A tune, preset or song holds settings and no recordings: click Load kit yourself.',
    loading: (a, b, mb, tot) => `Loading: ${a} of ${b} files, ${mb} MB of about ${tot} MB`, loaded: (n, mb, dec) => `Loaded: ${n} files, ${mb} MB (about ${dec} MB in memory)`,
    partial: (n, f, c) => `Loaded with ${f} missing files (${c}); the rest plays.`, failAll: c => `Loading failed: ${c}. The previous kit is kept.`, aborted: 'Cancelled: the previous kit is kept.', cleared: 'Kit cleared.',
    errUrl: 'the address is not allowed', errAborted: 'cancelled', errNetwork: 'no connection, or the server does not allow the request', errHttp: s => `the server returned an error (${s})`, errSize: 'a file is larger than expected', errResponse: 'invalid response', errDecode: 'a file could not be read', errOther: 'unknown error',
    oldHost: 'This host cannot fetch files from the internet (contract v1.30). Update Patchkamer.',
    play: 'Play', pattern: 'Pattern', len: 'Length', steps: 'steps', run: 'Own sequencer', on: 'On', off: 'Off', swing: 'Swing', clearPat: 'Clear', stepHint: 'Click: off, soft, medium, hard.',
    audition: 'Audition', audVel: 'Velocity', soft: 'Soft', mid: 'Medium', hard: 'Hard', grp: { kick: 'Kick', snare: 'Snare', hats: 'Hi-hats', toms: 'Toms', cymbals: 'Cymbals' },
    sound: 'Sound', mix: 'Mix', micMix: 'Microphones', loadedMic: 'loaded', notLoaded: 'not loaded', laneGroup: { mix: 'Mix', kick: 'Kick', snare: 'Snare', toms: 'Toms', hats: 'Hi-hats', feel: 'Feel' },
    snares: 'Snares', snaresOn: 'On', snaresOff: 'Off', snaresOffMissing: 'Off (this set has no snares-off recordings)',
    patName: p => 'Pattern ' + p, gone: 'The device has been removed.', bad: 'Not a valid clip.', kind: 'This device only takes drums.', ports: 'Outputs',
    status: 'Status', audioErr: 'Audio: '
  }
};
const ABOUT = {
  nl: 'Een gesampled akoestisch drumstel voor funk, soul en jazz.\n\nDe opnames zitten niet in Patchkamer. Kies een set en microfoons en klik op Kit laden: de bestanden worden dan via een link opgehaald (Virtuosity Drums, Versilian Studios, drummer Austin McMahon, CC0 1.0). De grootte staat vooraf in beeld en je kunt annuleren. Een tune, preset of song laadt geen opnames; zonder kit speelt het apparaat stil.\n\nElke slag kiest zijn velocity-laag met een zachte overgang naar de naastliggende laag, een round robin die nooit direct herhaalt, en een kleine variatie in stemming en niveau. De snare speelt zachte slagen als ghost note en harde als rimshot (drempels instelbaar) en kent snaren aan en uit, stemming en demping. De hi-hat kapt open klanken af met een korte fade; bekkens ringen uit en worden afgegrepen met noot 52 of met dezelfde noot op een heel lage velocity. Hi-hat-pedaal (CC 4) kiest bij noot 42 gesloten, half, driekwart of open.\n\nNoten (General MIDI): 36 kick, 38 snare (automatisch), 37 side stick, 40 rimshot, 39 snare naast het midden, 86 ghost, 87 half gedempt, 85 stick shot, 93 buzz, 95 flam, 42 hi-hat gesloten, 44 pedaal, 46 open, 90 half, 94 driekwart, 92 splash, 49 crash, 57 sizzle, 51 ride, 53 bell, 59 flat ride, 55 flat ride als crash, 52 afgrijpen, 41 43 45 47 48 50 toms, 97 tot 102 extra tom-slagen.\n\nUitgangen: stereomix, kick, snare, hi-hats, toms, bekkens en de room-microfoon, plus een bundel. Alle uitgangen zijn tegelijk actief.',
  en: 'A sampled acoustic drum kit for funk, soul and jazz.\n\nThe recordings are not inside Patchkamer. Choose a set and microphones and click Load kit: the files are then fetched through a link (Virtuosity Drums, Versilian Studios, drummer Austin McMahon, CC0 1.0). The size is shown beforehand and you can cancel. A tune, preset or song loads no recordings; without a kit the device is silent.\n\nEvery hit picks its velocity layer with a smooth blend into the neighbouring layer, a round robin that never repeats directly, and a small variation in tuning and level. The snare plays soft hits as ghost notes and hard hits as rimshots (thresholds adjustable) and has snares on and off, tuning and damping. The hi-hat cuts open sounds with a short fade; cymbals ring out and are grabbed with note 52 or with the same note at a very low velocity. The hi-hat pedal (CC 4) makes note 42 closed, half, three-quarter or open.\n\nNotes (General MIDI): 36 kick, 38 snare (automatic), 37 side stick, 40 rimshot, 39 snare off-centre, 86 ghost, 87 half-muted, 85 stick shot, 93 buzz, 95 flam, 42 hi-hat closed, 44 pedal, 46 open, 90 half, 94 three-quarter, 92 splash, 49 crash, 57 sizzle, 51 ride, 53 bell, 59 flat ride, 55 flat ride as crash, 52 choke, 41 43 45 47 48 50 toms, 97 to 102 extra tom hits.\n\nOutputs: stereo mix, kick, snare, hi-hats, toms, cymbals and the room microphone, plus a bundle. All outputs are active at the same time.'
};
const tekenLus = (host, inst, cb, fps) => {
  if (host && typeof host.frame === 'function') return host.frame(inst, cb, fps);
  let raf = 0, last = 0, stop = false;
  const f = t => { if (stop) return; raf = requestAnimationFrame(f); if (document.hidden || t - last < 1000 / fps - 2) return; last = t; cb(t); };
  raf = requestAnimationFrame(f); return () => { stop = true; cancelAnimationFrame(raf); };
};
const isObj = x => x && typeof x === 'object' && !Array.isArray(x);
const num = (v, a, b, d) => (typeof v === 'number' && Number.isFinite(v) ? Math.min(b, Math.max(a, v)) : d);
const copy = x => JSON.parse(JSON.stringify(x));
const getPath = (o, p) => p.split('.').reduce((a, k) => (a == null ? undefined : a[k]), o);
const setPath = (o, p, v) => { const ks = p.split('.'), l = ks.pop(); ks.reduce((a, k) => a[k], o)[l] = v; };
// bestanden van een set: [{ key, mic, vl, rr }]; de lagen en round robins worden gelijkmatig gekozen
const pickN = (n, w) => { w = Math.min(Math.max(1, w), n); const o = []; for (let j = 0; j < w; j++) { const i = Math.min(n, Math.max(1, Math.round((j + .5) * n / w + .5 - 1e-9))); if (!o.includes(i)) o.push(i); } return o; };
function fileList(setId, mics) {
  const out = [], S = SETS[setId];
  for (const key of Object.keys(S.want)) {
    const A = ARTS[key], nl = A[3].length, [wl, wr] = S.want[key], vls = pickN(nl, wl), rrs = A[2] ? pickN(A[2], wr) : [0];
    for (const mic of mics) for (const vl of vls) for (const rr of rrs) out.push({ key, mic, vl, rr });
  }
  return out;
}
function urlOf(f, base = BASE) {
  const A = ARTS[f.key], g = A[0], a = A[1];
  return base + 'Samples/' + f.mic + '/' + g + '/' + f.mic + '_' + g + '_' + a + (A[6] ? '' : '_vl' + f.vl) + (A[2] ? '_rr' + f.rr : '') + '.flac';
}
const estimate = (setId, mics) => { const L = fileList(setId, mics); let b = 0; for (const f of L) b += ARTS[f.key][4][MICIDS.indexOf(f.mic)] * 1024; return { files: L.length, bytes: b }; };
const mbOf = b => (b / 1048576).toFixed(b < 10485760 ? 1 : 0);
// zachte begrenzer: lineair tot 0,7, daarna asymptotisch naar hoogstens 0,908 (ook voor ingangen groter dan 1)
const LIMIT_CURVE = (() => { const a = new Float32Array(4097); for (let i = 0; i < a.length; i++) { const x = i / 2048 - 1, ax = Math.abs(x); a[i] = ax <= .7 ? x : Math.sign(x) * (.7 + .25 * Math.tanh((ax - .7) / .25)); } return a; })();
const PORTS = { audioIn: [], audioOut: [{ id: 'mix', name: 'Stereo mix' }, { id: 'kick', name: 'Kick' }, { id: 'snare', name: 'Snare' }, { id: 'hats', name: 'Hi-hats' }, { id: 'toms', name: 'Toms' }, { id: 'cymbals', name: 'Bekkens' }, { id: 'room', name: 'Room-microfoon' }],
  eventIn: [{ id: 'trigger', name: 'MIDI / trigs' }], eventOut: [], modIn: [{ id: 'mod', name: 'Mod' }], modOut: [], multiOut: [{ id: 'multi', name: 'Losse uit (bundel)' }] };
const CSS = `.ad{--accent:#e0a350;color:var(--fg,#e8e9df);background:var(--card,#14191c);padding:14px;border-radius:10px;font:13px var(--mono,'IBM Plex Mono',monospace);container-type:inline-size}.ad *{box-sizing:border-box}.ad button,.ad select{font:inherit;color:inherit;background:var(--card-2,#1e2529);border:1px solid var(--line,#364148);border-radius:5px;padding:6px 8px;min-height:30px;cursor:pointer}.ad button:hover{border-color:var(--accent)}.ad button.active{background:var(--accent);color:#14191c;border-color:var(--accent)}.ad button:disabled{opacity:.45;cursor:default}.ad .ad-sec{border:1px solid var(--line,#364148);background:var(--card-2,#1e2529);border-radius:7px;padding:11px;margin:10px 0}.ad .ad-cap{font-size:10px;letter-spacing:2px;color:var(--muted,#9aa9ad);margin-bottom:8px;text-transform:uppercase}.ad .ad-row{display:flex;gap:8px;align-items:end;flex-wrap:wrap;margin:6px 0}.ad label{display:flex;flex-direction:column;gap:4px;font-size:10px;color:var(--muted,#9aa9ad)}.ad label.ad-chk{flex-direction:row;align-items:center;gap:6px;font-size:12px;color:var(--fg,#e8e9df)}.ad output{color:var(--fg,#e8e9df);font-size:12px}.ad input[type=range]{width:100%;accent-color:var(--accent);margin:2px 0}.ad .ad-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px}.ad .ad-note{color:var(--muted,#9aa9ad);font-size:11px;line-height:1.4}.ad .ad-warn{color:var(--accent);font-size:12px;margin:6px 0}.ad .ad-err{color:var(--stop,#ff9386);font-size:12px}.ad progress{width:100%;height:10px;accent-color:var(--accent)}.ad .ad-lane{display:grid;gap:3px;align-items:center;margin:3px 0}.ad .ad-lane .ad-nm{overflow:hidden;white-space:nowrap;text-overflow:ellipsis;text-align:left;font-size:11px}.ad .ad-step{min-height:24px;padding:0;border-radius:3px;background:var(--well,#273036)}.ad .ad-step.ad-q{border-left:2px solid var(--muted,#9aa9ad)}.ad .ad-step.ad-l1{background:#7a5a2c}.ad .ad-step.ad-l2{background:#b9822f}.ad .ad-step.ad-l3{background:var(--accent)}.ad .ad-step.ad-now{outline:2px solid var(--fg,#e8e9df);outline-offset:1px}.ad .ad-pads{display:flex;flex-wrap:wrap;gap:5px}.ad .ad-pads button{font-size:11px}.ad .ad-pads small{color:var(--muted,#9aa9ad);margin-left:4px}.ad .ad-mic{display:grid;grid-template-columns:minmax(90px,1fr) 2fr 2fr;gap:8px;align-items:center;margin:4px 0}`;

const __pkDef = {
  id: 'nl.patchkamer.acousticdrums', name: 'Acoustic Drums', version: '1.1.0', kind: 'instrument', category: 'groove',
  about: { nl: ABOUT.nl, en: ABOUT.en }, modExclude: [], ui: { width: 980, minWidth: 480 }, ports: PORTS,
  i18n: { en: { ports: { mix: 'Stereo mix', cymbals: 'Cymbals', room: 'Room mic', multi: 'Separate outs (bundle)' } } },
  create(ctx, host) {
    const T = TXT[host && host.lang] || TXT.en, nm = i => (host && host.lang === 'nl' ? SND[i][3] : SND[i][4]);
    const SI = Object.fromEntries(SND.map((s, i) => [s[0], i]));
    let dead = false, root = null, self, stopDraw = null, playing = false, lastStep = -1, error = '', mod = Object.create(null), pedalPos = null, audVel = .65;
    const owned = new Set(), voices = new Set(), last = Object.create(null);
    const own = n => (owned.add(n), n), gain = () => own(ctx.createGain());
    const quantumStart = x => Math.ceil(x * ctx.sampleRate / 128 - 1e-6) * 128 / ctx.sampleRate;
    // ---- state ----
    function defaults() {
      const s = { set: 'funk', mics: ['mid'], kit: false, master: .8, levels: {}, micMix: {}, snares: true, run: false, pattern: 0, length: 16, patterns: [] };
      for (const p of PARAMS) { const ks = p[0].split('.'); if (ks.length === 1) s[p[0]] = p[9]; else { s[ks[0]] = s[ks[0]] || {}; let o = s[ks[0]]; for (let i = 1; i < ks.length - 1; i++) o = o[ks[i]] = o[ks[i]] || {}; o[ks[ks.length - 1]] = p[9]; } }
      for (let p = 0; p < 4; p++) s.patterns.push(LANES.map(() => new Array(32).fill(0)));
      const A = s.patterns[0], put = (lane, st, v) => st.forEach(k => { A[lane][k] = v; });
      put(0, [0, 3, 6, 10], 1); put(1, [4, 12], 1); put(3, [2, 7, 9, 14], .3); put(4, [0, 2, 4, 6, 8, 10, 12, 14], .65); put(4, [1, 3, 5, 7, 9, 11, 13, 15], .3); put(6, [14], 1);
      return s;
    }
    let state = defaults();
    const eff = id => { const p = PMAP[id], base = getPath(state, id), o = mod[id]; return o ? Math.min(p[2], Math.max(p[1], base + o * (p[2] - p[1]))) : base; };
    function clean(s) {
      const d = defaults(), o = isObj(s) ? s : {}, st = defaults();
      st.set = typeof o.set === 'string' && Object.hasOwn(SETS, o.set) ? o.set : d.set;
      const m = Array.isArray(o.mics) ? MICIDS.filter(x => o.mics.includes(x)) : []; st.mics = m.length ? m : d.mics; st.kit = typeof o.kit === 'boolean' ? o.kit : d.kit;
      for (const p of PARAMS) setPath(st, p[0], num(getPath(o, p[0]), p[1], p[2], p[9]));
      st.snares = typeof o.snares === 'boolean' ? o.snares : d.snares;
      st.run = typeof o.run === 'boolean' ? o.run : d.run;
      st.pattern = Math.round(num(o.pattern, 0, 3, 0)); st.length = Math.round(num(o.length, 1, 32, 16));
      const P = Array.isArray(o.patterns) ? o.patterns : null;
      st.patterns = Array.from({ length: 4 }, (_, p) => LANES.map((_, l) => Array.from({ length: 32 }, (_, k) => { const v = P && Array.isArray(P[p]) && Array.isArray(P[p][l]) ? P[p][l][k] : (P ? 0 : d.patterns[p][l][k]); return typeof v === 'number' && Number.isFinite(v) ? Math.round(Math.min(1, Math.max(0, v)) * 100) / 100 : 0; })));
      return st;
    }
    // ---- audiograaf ----
    const mixSum = gain(), master = gain(), mixShaper = own(ctx.createWaveShaper()), mixOut = gain(), roomSum = gain(), roomShaper = own(ctx.createWaveShaper()), roomOut = gain();
    mixShaper.curve = LIMIT_CURVE; roomShaper.curve = LIMIT_CURVE; mixShaper.oversample = 'none'; roomShaper.oversample = 'none';
    mixSum.connect(master).connect(mixShaper).connect(mixOut); roomSum.connect(roomShaper).connect(roomOut);
    const guardAna = own(ctx.createAnalyser()); guardAna.fftSize = 256; mixOut.connect(guardAna);
    const outputs = { mix: mixOut, room: roomOut }, grpOut = {}, grpDirect = {}, micIn = {}, micPan = {};
    for (const g of GROUPS) {
      grpOut[g] = gain(); grpOut[g].connect(mixSum);
      const sh = own(ctx.createWaveShaper()), o = gain(); sh.curve = LIMIT_CURVE; sh.oversample = 'none'; grpOut[g].connect(sh).connect(o); outputs[g] = o; grpDirect[g] = o;
    }
    for (const m of MICIDS) { micIn[m] = {}; micPan[m] = {}; for (const g of GROUPS) { const lv = gain(), pn = own(ctx.createStereoPanner()); lv.connect(pn).connect(grpOut[g]); if (m === 'room') pn.connect(roomSum); micIn[m][g] = lv; micPan[m][g] = pn; } }
    function apply() {
      if (dead) return; const now = ctx.currentTime;
      master.gain.setTargetAtTime(eff('master'), now, .02);
      for (const g of GROUPS) grpOut[g].gain.setTargetAtTime(eff('levels.' + g), now, .02);
      for (const m of MICIDS) for (const g of GROUPS) { micIn[m][g].gain.setTargetAtTime(eff('micMix.' + m + '.level'), now, .02); micPan[m][g].pan.setTargetAtTime(eff('micMix.' + m + '.pan'), now, .02); }
    }
    // ---- kit ----
    let kit = null, job = null, status = '', statusErr = false;
    const has = k => !!(kit && k && kit.lib[k] && kit.lib[k].layers.length);
    const first = (...ks) => ks.find(has);
    // ---- stemmen ----
    function endVoice(v) { v.envs.forEach(e => { try { e.disconnect(); } catch (e2) { /* */ } owned.delete(e); }); voices.delete(v); }
    function fade(v, t, secs) {
      try {
        secs = Math.max(.02, secs);
        for (const e of v.envs) {
          const g = e.gain;
          if (typeof g.cancelAndHoldAtTime === 'function') g.cancelAndHoldAtTime(t);
          else { const val = v.ring && t > v.ring.t0 ? Math.exp(-(t - v.ring.t0) / v.ring.tau) : 1; g.cancelScheduledValues(t); g.setValueAtTime(val, t); }
          g.setTargetAtTime(0, t, secs / 5);
        }
        v.srcs.forEach(s => { try { s.stop(t + secs * 1.6); } catch (e) { /* */ } });
      } catch (e) { /* */ }
    }
    const stopAll = (secs = .12) => voices.forEach(v => fade(v, ctx.currentTime, secs));
    let lastGuard = -1;
    function guard() {
      const now = ctx.currentTime; if (now - lastGuard < .1 && lastGuard >= 0) return; lastGuard = now;
      const b = new Float32Array(guardAna.fftSize); guardAna.getFloatTimeDomainData(b);
      for (let i = 0; i < b.length; i++) if (!Number.isFinite(b[i])) { error = T.audioErr + 'NaN'; stopAll(.02); return; }
    }
    function pickLayers(e, v) {
      const L = e.layers, n = L.length; if (!n) return null;
      if (v <= L[0].c || n === 1) return [[L[0], Math.min(1.2, Math.max(.1, Math.pow(v / L[0].c, .9)))]];
      if (v >= L[n - 1].c) return [[L[n - 1], Math.min(1.25, 1 + (v - L[n - 1].c) * .6)]];
      let i = 0; while (i < n - 2 && v >= L[i + 1].c) i++;
      const w = (v - L[i].c) / (L[i + 1].c - L[i].c);
      const a = Math.cos(w * Math.PI / 2), b = Math.sin(w * Math.PI / 2);
      // het niveau volgt een rechte lijn (in dB) tussen de twee lagen, zodat de overgang nooit zachter wordt dan de zachtste laag
      let k = 1; if (L[i].lev > 0 && L[i + 1].lev > 0) { const tgt = Math.pow(L[i].lev, 1 - w) * Math.pow(L[i + 1].lev, w), act = Math.sqrt(a * a * L[i].lev * L[i].lev + b * b * L[i + 1].lev * L[i + 1].lev); k = Math.min(1.3, Math.max(.7, tgt / act)); }
      return [[L[i], a * k], [L[i + 1], b * k]];
    }
    const snareKey = art => {
      const ON = { c: 'S_c', oc: 'S_oc', rim: 'S_rim', x: 'S_x', mu: 'S_mu', ho: 'S_ho', fl: 'S_fl', bz: 'S_bz', ss: 'S_ss' }, OFF = { c: 'O_c', oc: 'O_oc', x: 'O_x', mu: 'O_mu', ho: 'O_ho', fl: 'O_fl', bz: 'O_bz', ss: 'O_ss' };
      if (art === 'rim') return state.snares ? first('S_rim', 'O_c', 'S_c') : first('O_c', 'S_rim');
      return state.snares ? first(ON[art], OFF[art]) : first(OFF[art], ON[art]);
    };
    // welk geluid hoort bij een noot en velocity: groep, lijst met artikulaties en de rest
    function planFor(id, vel) {
      const P = { grp: SBYID[id][2], plans: [], st: 0, ring: null, cls: null }, add = (key, vv, g = 1) => { if (key) P.plans.push({ key, vv: Math.min(1, Math.max(.02, vv)), g }); };
      const hatKey = k => first(k, ...(HATFALL[k] || []));
      switch (id) {
        case 'kick': {
          const on = has('K_on'), off = has('K_off'); let a = state.snares ? eff('bleed') : 0; if (!off) a = 1; if (!on) a = 0;
          if (on && a > 0) add('K_on', vel, Math.sqrt(a)); if (off && a < 1) add('K_off', vel, Math.sqrt(1 - a)); P.st = eff('kickTune'); P.ring = 'kickRing'; break;
        }
        case 'snare': {
          const g = eff('ghost'), r = eff('rim');
          if (g > 0 && vel < g) { const a = Math.random() < .5 ? ['mu', 'ho'] : ['ho', 'mu']; const k = first(snareKey(a[0]), snareKey(a[1]), snareKey('c')); add(k, k === snareKey('c') ? vel : vel / g * .85 + .05); }
          else if (r < 1 && vel >= r) add(snareKey('rim'), .55 + .45 * (vel - r) / Math.max(.001, 1 - r)); else add(snareKey('c'), vel);
          P.st = eff('snareTune'); P.ring = 'snareRing'; break;
        }
        case 'rimshot': add(snareKey('rim'), vel); P.st = eff('snareTune'); P.ring = 'snareRing'; break;
        case 'sidestick': add(snareKey('x'), vel); P.st = eff('snareTune'); P.ring = 'snareRing'; break;
        case 'offcenter': add(snareKey('oc') || snareKey('c'), vel); P.st = eff('snareTune'); P.ring = 'snareRing'; break;
        case 'ghost': add(first(snareKey('mu'), snareKey('c')), vel); P.st = eff('snareTune'); P.ring = 'snareRing'; break;
        case 'halfopen': add(first(snareKey('ho'), snareKey('mu'), snareKey('c')), vel); P.st = eff('snareTune'); P.ring = 'snareRing'; break;
        case 'stickshot': add(first(snareKey('ss'), snareKey('c')), vel); P.st = eff('snareTune'); P.ring = 'snareRing'; break;
        case 'buzz': add(first(snareKey('bz'), snareKey('c')), vel); P.st = eff('snareTune'); P.ring = 'snareRing'; break;
        case 'flam': add(first(snareKey('fl'), snareKey('c')), vel); P.st = eff('snareTune'); P.ring = 'snareRing'; break;
        case 'hatclosed': {
          let k = 'H_cl'; if (pedalPos != null) k = pedalPos >= .75 ? 'H_cl' : pedalPos >= .5 ? 'H_ho' : pedalPos >= .25 ? 'H_34' : 'H_op';
          const key = hatKey(k); add(key, vel); P.cls = key === 'H_cl' || key === 'H_pd' ? 'hatclosed' : 'hatopen'; break;
        }
        case 'hatpedal': { const key = hatKey('H_pd'); add(key, key === 'H_pd' ? vel : vel * .5); P.cls = 'hatclosed'; break; }
        case 'hatopen': add(hatKey('H_op'), vel); P.cls = 'hatopen'; break;
        case 'hathalf': add(hatKey('H_ho'), vel); P.cls = 'hatopen'; break;
        case 'hat34': add(hatKey('H_34'), vel); P.cls = 'hatopen'; break;
        case 'hatsplash': add(hatKey('H_sp'), vel); P.cls = 'hatopen'; break;
        case 'crash': add(first('C_c', 'F_c'), vel); P.cls = 'crash'; break;
        case 'sizzle': add(first('C_z', 'C_c'), vel); P.cls = 'crash'; break;
        case 'ride': add(first('R_r', 'F_r'), vel); P.cls = 'ride'; break;
        case 'bell': add(first('R_b', 'R_r'), vel); P.cls = 'ride'; break;
        case 'flatride': add(first('F_r', 'R_r'), vel); P.cls = 'flat'; break;
        case 'flatcrash': add(first('F_c', 'C_c'), vel); P.cls = 'flat'; break;
        case 'tom41': add(first('T_c'), vel); P.st = -2 + eff('floorTune'); P.ring = 'tomRing'; break;
        case 'tom43': add(first('T_c'), vel); P.st = eff('floorTune'); P.ring = 'tomRing'; break;
        case 'tom45': add(first('T_c'), vel); P.st = 3 + eff('floorTune'); P.ring = 'tomRing'; break;
        case 'tom47': add(first('U_c', 'T_c'), vel); P.st = -3 + eff('rackTune'); P.ring = 'tomRing'; break;
        case 'tom48': add(first('U_c', 'T_c'), vel); P.st = eff('rackTune'); P.ring = 'tomRing'; break;
        case 'tom50': add(first('U_c', 'T_c'), vel); P.st = 3 + eff('rackTune'); P.ring = 'tomRing'; break;
        case 'floorrim': add(first('T_rim', 'T_c'), vel); P.st = eff('floorTune'); P.ring = 'tomRing'; break;
        case 'floorstick': add(first('T_x', 'T_c'), vel); P.st = eff('floorTune'); P.ring = 'tomRing'; break;
        case 'floormute': add(first('T_mu', 'T_c'), vel); P.st = eff('floorTune'); P.ring = 'tomRing'; break;
        case 'floorhalf': add(first('T_ho', 'T_c'), vel); P.st = eff('floorTune'); P.ring = 'tomRing'; break;
        case 'flooroff': add(first('T_oc', 'T_c'), vel); P.st = eff('floorTune'); P.ring = 'tomRing'; break;
        case 'rackoff': add(first('U_oc', 'U_c', 'T_c'), vel); P.st = eff('rackTune'); P.ring = 'tomRing'; break;
        default: break;
      }
      return P;
    }
    function chokeFamily(fam, t, secs) { voices.forEach(o => { if (o.t <= t && (fam === 'all' ? ['crash', 'ride', 'flat'].includes(o.cls) : o.cls === fam)) fade(o, t, secs); }); }
    function play(id, vel, time) {
      try {
        if (dead || !kit || !Object.hasOwn(SBYID, id) || !(typeof vel === 'number' && vel > 0)) return;
        vel = Math.min(1, vel);
        const human = eff('human'), tt = Math.max(ctx.currentTime, Number.isFinite(time) ? time : ctx.currentTime) + Math.random() * human, t = quantumStart(tt);
        guard();
        if (id === 'choke') { chokeFamily('all', t, .07); return; }
        if (CHOKEFAM[id] && vel < .03) { chokeFamily(CHOKEFAM[id], t, .07); return; }
        const P = planFor(id, vel); if (!P.plans.length) return;
        const fadeSecs = eff('hatFade');
        if (P.cls === 'hatclosed') voices.forEach(o => { if (o.cls === 'hatopen' && o.t <= t) fade(o, t, fadeSecs); });
        else if (P.cls === 'hatopen') voices.forEach(o => { if (o.cls === 'hatopen' && o.t < t) fade(o, t, fadeSecs * 1.3); });
        const v = { t, cls: P.cls, grp: P.grp, envs: [], srcs: [], ring: null, pending: 0 }, envOf = Object.create(null), vr = eff('variation');
        const ringV = P.ring ? eff(P.ring) : 1, damp = ringV < .99, tau = .02 * Math.pow(60, ringV), hold = .015;
        if (damp) v.ring = { t0: t + hold, tau };
        for (const pl of P.plans) {
          const e = kit.lib[pl.key]; if (!e) continue;
          const lastK = last[pl.key] || (last[pl.key] = { idx: -1, cents: 0, db: 0 });
          const pick = pickLayers(e, Math.min(1, Math.max(0, pl.vv + (Math.random() - .5) * .04 * (.3 + .7 * vr)))); if (!pick) continue;
          const rrs = pick[0][0].rrs; let idx = 0;
          if (rrs.length > 1) { idx = Math.floor(Math.random() * (rrs.length - 1)); if (idx >= lastK.idx && lastK.idx >= 0) idx++; if (idx >= rrs.length) idx = 0; }
          lastK.idx = idx;
          let cents = (Math.random() * 2 - 1) * (.6 + 2.4 * vr), db = (Math.random() * 2 - 1) * (.1 + .4 * vr);
          if (Math.abs(cents - lastK.cents) < .25) cents = lastK.cents + (cents >= lastK.cents ? .3 : -.3);
          lastK.cents = cents; lastK.db = db;
          const rate = Math.min(4, Math.max(.25, Math.pow(2, (P.st + cents / 100) / 12)));
          for (const [L, w] of pick) {
            const R = L.rrs[Math.min(idx, L.rrs.length - 1)]; if (!R) continue;
            for (const m of Object.keys(R.bufs)) {
              const buf = R.bufs[m]; let env = envOf[m];
              if (!env) { env = envOf[m] = gain(); env.connect(micIn[m][P.grp]); v.envs.push(env); if (damp) { env.gain.setValueAtTime(1, t); env.gain.setTargetAtTime(0, t + hold, tau); } }
              const src = own(ctx.createBufferSource()), g = gain(); src.buffer = buf; src.playbackRate.value = rate;
              g.gain.value = Math.min(2, w * pl.g * (L.g || 1) * (R.g || 1) * Math.pow(10, db / 20)); src.connect(g).connect(env);
              const len = buf.duration / rate; src.start(t); src.stop(t + (damp ? Math.min(len, hold + tau * 9) : len) + .03);
              v.srcs.push(src); v.pending++;
              src.onended = () => { try { src.disconnect(); g.disconnect(); } catch (e2) { /* */ } owned.delete(src); owned.delete(g); if (--v.pending <= 0) endVoice(v); };
            }
          }
        }
        if (!v.srcs.length) { endVoice(v); return; }
        voices.add(v);
        while (voices.size > 96) { const old = voices.values().next().value; fade(old, t, .03); voices.delete(old); }
      } catch (e) { error = T.audioErr + (e && e.message || String(e)); }
    }
    const playNote = (note, vel, time) => { const id = SBYNOTE.get(Math.round(note)); if (id) play(id, vel, time); };
    // Per laag het niveau van de eerste 150 ms (alle microfoons samen): round robins van een laag worden gelijk gezet (hoogstens 2 dB) en een laag die zachter is dan de laag eronder wordt opgetrokken (hoogstens 3,5 dB), zodat een hogere velocity nooit zachter klinkt.
    function energy(buf) { const n = Math.min(buf.length, Math.round(buf.sampleRate * .15)); let e = 0; for (let c = 0; c < buf.numberOfChannels; c++) { const d = buf.getChannelData(c); for (let i = 0; i < n; i++) e += d[i] * d[i]; } return e; }
    function normalise(lib) {
      for (const k of Object.keys(lib)) {
        let prev = 0;
        for (const L of lib[k].layers) {
          for (const R of L.rrs) { R.e = 1e-12; for (const m of Object.keys(R.bufs)) R.e += energy(R.bufs[m]); }
          L.e = L.rrs.reduce((a, R) => a + R.e, 0) / L.rrs.length;
          for (const R of L.rrs) R.g = Math.min(1.26, Math.max(.79, Math.sqrt(L.e / R.e)));
          const lev = Math.sqrt(L.e), target = Math.max(lev, prev * 1.02); L.g = Math.min(1.5, target / lev); prev = L.lev = lev * L.g;
        }
      }
    }
    // ---- kit laden (alleen na een klik) ----
    const canNet = () => typeof host.fetchFile === 'function';
    const errText = e => { const c = e && e.code; return c === 'url' ? T.errUrl : c === 'aborted' ? T.errAborted : c === 'network' ? T.errNetwork : c === 'http' ? T.errHttp(e.status) : c === 'size' ? T.errSize : c === 'response' ? T.errResponse : c === 'decode' ? T.errDecode : T.errOther; };
    async function loadKit() {
      if (job || dead) return;
      if (!canNet()) { status = T.oldHost; statusErr = true; paintKit(); return; }
      const setId = state.set, mics = state.mics.slice(), files = fileList(setId, mics), est = estimate(setId, mics);
      const J = job = { ctl: new AbortController(), done: 0, total: files.length, bytes: 0, live: new Array(files.length).fill(0), est: est.bytes, fail: [], paintAt: 0 };
      status = ''; statusErr = false; paintKit();
      const lib = Object.create(null); let dec = 0, ok = 0, next = 0;
      const store = (f, buf) => {
        const A = ARTS[f.key], e = lib[f.key] || (lib[f.key] = { layers: [] });
        let L = e.layers.find(x => x.vl === f.vl);
        if (!L) { const hi = A[3][f.vl - 1], lo = f.vl > 1 ? A[3][f.vl - 2] + 1 : 0; L = { vl: f.vl, c: (lo + hi) / 2 / 127, rrs: [] }; e.layers.push(L); }
        let R = L.rrs.find(x => x.rr === f.rr); if (!R) { R = { rr: f.rr, bufs: Object.create(null) }; L.rrs.push(R); }
        R.bufs[f.mic] = buf;
      };
      const work = async () => {
        while (!J.ctl.signal.aborted) {
          const i = next++; if (i >= files.length) return; const f = files[i];
          try {
            const o = { as: 'arraybuffer', maxBytes: ARTS[f.key][5], signal: J.ctl.signal, onProgress: r => { J.live[i] = r; paintLoad(); } };
            let ab; try { ab = await host.fetchFile(self, urlOf(f), o); } catch (e0) { if (!e0 || (e0.code !== 'http' && e0.code !== 'network')) throw e0; J.live[i] = 0; ab = await host.fetchFile(self, urlOf(f, RAW), o); }
            J.live[i] = 0; J.bytes += ab.byteLength;
            let buf; try { buf = await ctx.decodeAudioData(ab); } catch (e2) { throw Object.assign(new Error('decode'), { code: 'decode' }); }
            if (J.ctl.signal.aborted) return;
            store(f, buf); dec += buf.length * buf.numberOfChannels * 4; ok++;
          } catch (e) { if (e && e.code === 'aborted') return; J.live[i] = 0; J.fail.push(e); }
          J.done++; paintLoad();
        }
      };
      try { await Promise.all([work(), work(), work(), work()]); } catch (e) { /* */ }
      if (dead) return;
      job = null;
      if (J.ctl.signal.aborted) { status = T.aborted; statusErr = false; paintKit(); return; }
      if (!ok) { status = T.failAll(J.fail.length ? errText(J.fail[0]) : T.errOther); statusErr = true; paintKit(); return; }
      for (const k of Object.keys(lib)) { lib[k].layers.sort((a, b) => a.c - b.c); lib[k].layers.forEach(L => L.rrs.sort((a, b) => a.rr - b.rr)); }
      normalise(lib); stopAll(.05); for (const k of Object.keys(last)) delete last[k];
      kit = { lib, setId, mics, files: ok, bytes: J.bytes, dec }; state.kit = true;
      status = J.fail.length ? T.partial(ok, J.fail.length, errText(J.fail[0])) : T.loaded(ok, mbOf(J.bytes), mbOf(dec)); statusErr = J.fail.length > 0;
      paintKit();
    }
    // v1.36: door de host aangeroepen na het openen van een song; alleen als de state een kit wil (kit: true) en die er nog niet (of een andere) is
    async function restoreFiles() {
      try {
        if (dead || job || !state.kit || !canNet()) return;
        if (kit && kit.setId === state.set && kit.mics.length === state.mics.length && state.mics.every(m => kit.mics.includes(m))) return;
        await loadKit();
      } catch (e) { status = errText(e); statusErr = true; try { paintKit(); } catch (e2) { /* */ } }
    }
    function cancelLoad() { if (job) job.ctl.abort(); }
    function clearKit() { if (job) return; stopAll(.05); kit = null; state.kit = false; status = T.cleared; statusErr = false; paintKit(); }
    // ---- UI ----
    let ui = {};
    const pname = p => (host && host.lang === 'nl' ? p[7] : p[8]);
    const fmtOf = (p, v) => p[4] === 'st' ? (v > 0 ? '+' : '') + v.toFixed(1) + ' st' : p[4] === 'ms' ? Math.round(v * 1000) + ' ms' : p[4] === 'pan' ? (Math.abs(v) < .005 ? 'C' : Math.round(Math.abs(v) * 100) + (v < 0 ? ' L' : ' R')) : Math.round(v * 100) + ' %';
    function node(tag, parent, text, cls) { const n = document.createElement(tag); if (text !== undefined) n.textContent = text; if (cls) n.className = cls; if (parent) parent.appendChild(n); return n; }
    function button(parent, text, fn, cls) { const b = node('button', parent, text, cls); b.type = 'button'; b.onclick = fn; return b; }
    function select(parent, label, options, value, fn) { const l = node('label', parent, undefined), c = node('span', l, label), s = node('select', l); options.forEach(([v, n]) => { const o = node('option', s, n); o.value = String(v); }); s.value = String(value); s.onchange = () => fn(s.value); return s; }
    function slider(parent, id) {
      const p = PMAP[id], l = node('label', parent), cap = node('span', l, pname(p) + ' '), o = node('output', cap, fmtOf(p, getPath(state, id))), r = node('input', l);
      r.type = 'range'; r.min = p[1]; r.max = p[2]; r.step = p[3]; r.value = getPath(state, id);
      r.oninput = () => { const v = num(+r.value, p[1], p[2], p[9]); setPath(state, id, v); o.textContent = fmtOf(p, v); apply(); };
      r.dataset.pkDefault = String(p[9]);
      if (host.ui && typeof host.ui.adopt === 'function') { try { host.ui.adopt(r, { id, role: 'param', group: p[6].startsWith('mic.') ? 'mix' : p[6], label: pname(p) }); } catch (e) { /* oudere host */ } }
      return r;
    }
    function paintLoad() {
      if (!job || !root || !ui.prog) return; const now = Date.now(); if (now - job.paintAt < 120 && job.done < job.total) return; job.paintAt = now;
      let b = job.bytes; for (const x of job.live) b += x;
      ui.prog.max = Math.max(1, job.est); ui.prog.value = Math.min(b, job.est);
      ui.stat.textContent = T.loading(job.done, job.total, mbOf(b), mbOf(job.est)); ui.stat.className = 'ad-note';
    }
    function paintKit() {
      if (!root || !ui.stat) return;
      const est = estimate(state.set, state.mics), busy = !!job;
      ui.est.textContent = T.est(est.files, mbOf(est.bytes));
      ui.load.disabled = busy; ui.cancel.hidden = !busy; ui.clear.disabled = busy || !kit; ui.prog.hidden = !busy;
      ui.set.disabled = busy; ui.micBoxes.forEach(c => { c.disabled = busy; });
      ui.banner.hidden = !!kit;
      MICIDS.forEach((m, i) => { if (ui.micTags[i]) ui.micTags[i].textContent = kit ? (kit.mics.includes(m) ? T.loadedMic : T.notLoaded) : ''; if (ui.mixTags[i]) ui.mixTags[i].textContent = kit ? (kit.mics.includes(m) ? T.loadedMic : T.notLoaded) : T.notLoaded; });
      if (busy) paintLoad(); else { ui.stat.textContent = status || (kit ? T.loaded(kit.files, mbOf(kit.bytes), mbOf(kit.dec)) : ''); ui.stat.className = statusErr ? 'ad-err' : 'ad-note'; }
      if (ui.snaresOff) ui.snaresOff.textContent = kit && !(has('O_c') || has('O_x') || has('O_mu')) ? T.snaresOffMissing : T.snaresOff;
    }
    const LEVELS = [0, .3, .65, 1], nextLevel = v => { let i = 0; for (let k = 0; k < LEVELS.length; k++) if (Math.abs(LEVELS[k] - v) < Math.abs(LEVELS[i] - v)) i = k; return LEVELS[(i + 1) % LEVELS.length]; };
    const lvlCls = v => (v >= .9 ? 'ad-l3' : v >= .5 ? 'ad-l2' : v > 0 ? 'ad-l1' : '');
    function render() {
      if (!root) return; root.replaceChildren(); ui = { micTags: [], mixTags: [], cells: [], micBoxes: [] };
      const st = node('style', root); st.textContent = CSS; const app = node('div', root, undefined, 'ad');
      // kit
      const ks = node('div', app, undefined, 'ad-sec'); node('div', ks, T.kit, 'ad-cap');
      const r1 = node('div', ks, undefined, 'ad-row');
      ui.set = select(r1, T.setLabel, Object.keys(SETS).map(k => [k, T.sets[k]]), state.set, v => { state.set = v; state.mics = state.mics.length ? state.mics : SETS[v].mics.slice(); desc.textContent = T.setDesc[v]; paintKit(); });
      const ml = node('div', ks, undefined, 'ad-row'); node('span', ml, T.micsLabel, 'ad-note');
      MICIDS.forEach((m, i) => { const l = node('label', ml, undefined, 'ad-chk'), c = node('input', l); c.type = 'checkbox'; c.checked = state.mics.includes(m); node('span', l, T.mics[m]); ui.micTags[i] = node('small', l, '', 'ad-note'); c.onchange = () => { const cur = MICIDS.filter(x => x === m ? c.checked : state.mics.includes(x)); if (!cur.length) { c.checked = true; return; } state.mics = cur; paintKit(); }; ui.micBoxes.push(c); });
      const desc = node('div', ks, T.setDesc[state.set], 'ad-note'); ui.est = node('div', ks, '', 'ad-warn');
      const src = node('div', ks, T.srcLine + ' ', 'ad-note'), a = node('a', src, T.srcLink); a.href = SRC.home; a.target = '_blank'; a.rel = 'noopener noreferrer'; node('div', ks, T.credit + ': ' + SRC.attribution, 'ad-note');
      const br = node('div', ks, undefined, 'ad-row'); ui.load = button(br, T.load, () => { loadKit(); }, 'active'); ui.cancel = button(br, T.cancel, cancelLoad); ui.clear = button(br, T.clear, clearKit);
      ui.prog = node('progress', ks); ui.prog.value = 0; ui.stat = node('div', ks, '', 'ad-note'); ui.banner = node('div', ks, T.noKit + ' ' + T.tuneHint, 'ad-warn');
      // spelen
      const ps = node('div', app, undefined, 'ad-sec'); node('div', ps, T.play, 'ad-cap');
      const pr = node('div', ps, undefined, 'ad-row'); node('span', pr, T.pattern, 'ad-note');
      ['A', 'B', 'C', 'D'].forEach((x, i) => button(pr, x, () => { state.pattern = i; render(); }, state.pattern === i ? 'active' : ''));
      select(pr, T.len, [8, 16, 24, 32].concat([1, 2, 3, 4, 5, 6, 7, 9, 10, 11, 12, 13, 14, 15, 17, 18, 19, 20, 21, 22, 23, 25, 26, 27, 28, 29, 30, 31].filter(x => x === state.length)).sort((p, q) => p - q).map(x => [x, x + ' ' + T.steps]), state.length, v => { state.length = +v; render(); });
      button(pr, T.run + ': ' + (state.run ? T.on : T.off), () => { state.run = !state.run; if (!state.run) stopAll(.15); render(); }, state.run ? 'active' : '');
      slider(pr, 'swing'); button(pr, T.clearPat, () => { state.patterns[state.pattern] = LANES.map(() => new Array(32).fill(0)); render(); });
      node('div', ps, T.stepHint, 'ad-note');
      const tbl = node('div', ps);
      LANES.forEach((ln, i) => {
        const row = node('div', tbl, undefined, 'ad-lane'); row.style.gridTemplateColumns = `110px repeat(${state.length},minmax(14px,1fr))`;
        const lb = button(row, nm(SI[ln[1]]), () => audition(ln[1]), 'ad-nm'); const cells = [];
        for (let k = 0; k < state.length; k++) {
          const v = state.patterns[state.pattern][i][k], b = button(row, '', () => { const w = nextLevel(state.patterns[state.pattern][i][k]); state.patterns[state.pattern][i][k] = w; b.className = 'ad-step' + (k % 4 === 0 ? ' ad-q' : '') + (lvlCls(w) ? ' ' + lvlCls(w) : ''); if (w > 0) playNote(SND[SI[ln[1]]][1], w, ctx.currentTime); }, 'ad-step' + (k % 4 === 0 ? ' ad-q' : '') + (lvlCls(v) ? ' ' + lvlCls(v) : ''));
          b.setAttribute('aria-label', nm(SI[ln[1]]) + ' ' + (k + 1)); cells.push(b);
        }
        ui.cells.push(cells);
      });
      // beluisteren
      const as = node('div', app, undefined, 'ad-sec'); node('div', as, T.audition, 'ad-cap');
      const ar = node('div', as, undefined, 'ad-row'); select(ar, T.audVel, [[.25, T.soft], [.65, T.mid], [1, T.hard]], audVel, v => { audVel = +v; });
      GROUPS.forEach(g => { node('div', as, T.grp[g], 'ad-note'); const pads = node('div', as, undefined, 'ad-pads'); SND.forEach((s, i) => { if (s[2] === g) { const b = button(pads, nm(i), () => audition(s[0])); node('small', b, String(s[1])); } }); });
      // klank
      const ss = node('div', app, undefined, 'ad-sec'); node('div', ss, T.sound, 'ad-cap');
      const sg = node('div', ss, undefined, 'ad-grid');
      for (const lane of ['kick', 'snare', 'toms', 'hats', 'feel']) {
        const box = node('div', sg); node('div', box, T.laneGroup[lane], 'ad-note');
        if (lane === 'snare') { const sel = select(box, T.snares, [[1, T.snaresOn], [0, T.snaresOff]], state.snares ? 1 : 0, v => { state.snares = v === '1'; }); ui.snaresOff = sel.options[1]; }
        PARAMS.filter(p => p[6] === lane && p[0] !== 'swing').forEach(p => slider(box, p[0]));
      }
      // mix
      const ms = node('div', app, undefined, 'ad-sec'); node('div', ms, T.mix, 'ad-cap');
      const mg = node('div', ms, undefined, 'ad-grid'); slider(mg, 'master'); GROUPS.forEach(g => slider(mg, 'levels.' + g));
      node('div', ms, T.micMix, 'ad-cap');
      MICIDS.forEach((m, i) => { const row = node('div', ms, undefined, 'ad-mic'), nmx = node('div', row, T.mics[m]); ui.mixTags[i] = node('small', nmx, '', 'ad-note'); nmx.append(' '); slider(row, 'micMix.' + m + '.level'); slider(row, 'micMix.' + m + '.pan'); });
      paintKit();
    }
    function audition(id) { try { if (dead) return; playNote(SBYID[id][1], audVel, ctx.currentTime); } catch (e) { /* */ } }
    // ---- klok en patroon ----
    const pending = [];
    function onStep(info) {
      try {
        if (dead || !info) return; const { step, bar, time, stepDur } = info, abs = bar * 16 + step;
        if (!Number.isFinite(abs) || !Number.isFinite(time)) return;
        const idx = ((abs % state.length) + state.length) % state.length, odd = ((abs % 2) + 2) % 2 === 1;
        pending.push({ step: idx, time }); if (pending.length > 128) pending.shift();
        if (!state.run) return;
        const at = odd && Number.isFinite(stepDur) ? time + eff('swing') * stepDur : time;
        LANES.forEach((ln, i) => { const v = state.patterns[state.pattern][i][idx]; if (v > 0) playNote(SBYID[ln[1]][1], v, at); });
      } catch (e) { error = T.audioErr + (e && e.message || String(e)); }
    }
    function animate() {
      if (dead || !root) return; const now = ctx.currentTime;
      while (pending.length && pending[0].time <= now) lastStep = pending.shift().step;
      ui.cells.forEach(cs => cs.forEach((b, k) => b.classList.toggle('ad-now', playing && state.run && k === lastStep)));
    }
    // ---- klembord (contract §13d) ----
    const clipLanes = () => LANES.map((ln, i) => ({ id: 'ch' + (i + 1), name: nm(SI[ln[1]]).slice(0, 40), type: ln[0], note: SBYID[ln[1]][1] }));
    const clipName = () => T.patName('ABCD'[state.pattern] || 'A');
    function clipInfo() { try { if (dead) return null; return { name: clipName(), copy: ['drums'], paste: ['drums'], length: { min: 12, max: 384, step: 12, current: state.length * 12, shared: true, settable: true }, grid: [16], poly: 12, range: [0, 127], scheme: 'gm', vel: 'continuous', prob: false, ratchet: false, lanes: clipLanes(), maxEvents: LANES.length * 32 }; } catch (e) { return null; } }
    function getClip() {
      try {
        if (dead) return null; const L = state.length, hits = [];
        LANES.forEach((ln, i) => { const st = state.patterns[state.pattern][i]; for (let k = 0; k < L; k++) if (st[k] >= .01) hits.push({ t: k * 12, lane: i, vel: Math.min(1, st[k]) }); });
        const clip = { format: 'patchkamer-clip', formatVersion: 1, kind: 'drums', name: clipName(), length: L * 12, grid: 16, source: { device: __pkDef.id, name: 'Acoustic Drums', version: __pkDef.version, scheme: 'gm' }, lanes: clipLanes(), hits };
        if (state.swing > 0) clip.swing = state.swing; return copy(clip);
      } catch (e) { return null; }
    }
    function setClip(clip) {
      try {
        if (dead) return { ok: false, reason: T.gone };
        if (!isObj(clip) || clip.format !== 'patchkamer-clip' || (clip.formatVersion !== undefined && clip.formatVersion !== 1)) return { ok: false, reason: T.bad };
        if (clip.kind !== 'drums') return { ok: false, reason: T.kind };
        if (typeof clip.length !== 'number' || !Number.isFinite(clip.length)) return { ok: false, reason: T.bad };
        const newLen = Math.round(num(clip.length, 12, 384, state.length * 12) / 12);
        const lanes = Array.isArray(clip.lanes) ? clip.lanes.slice(0, 64) : [], src = Array.isArray(clip.hits) ? clip.hits.slice(0, 4096) : [];
        const map = lanes.map(l => { const m = l && typeof l.id === 'string' ? /^ch(\d+)$/.exec(l.id) : null; const i = m ? +m[1] - 1 : -1; return i >= 0 && i < LANES.length ? i : -1; });
        const next = LANES.map(() => new Array(32).fill(0));
        for (const h of src) {
          if (!isObj(h) || typeof h.t !== 'number' || !Number.isFinite(h.t) || !Number.isInteger(h.lane) || h.lane < 0 || h.lane >= map.length) continue;
          const i = map[h.lane]; if (i < 0) continue; const k = Math.round(num(h.t, 0, 1e9, 0) / 12); if (k >= newLen) continue;
          const v = h.acc === true ? 1 : Math.round(num(h.vel, .01, 1, .8) * 100) / 100; if (next[i][k] >= v) continue; next[i][k] = v;
        }
        state.length = newLen; state.patterns[state.pattern] = next; render(); return { ok: true };
      } catch (e) { return { ok: false, reason: T.bad }; }
    }
    // ---- parameters voor sturing ----
    const laneName = l => (l.startsWith('mic.') ? T.mics[l.slice(4)] : T.laneGroup[l] || T.grp[l] || l);
    const PLIST = PARAMS.map(p => ({ id: p[0], name: pname(p), lane: p[6], laneName: laneName(p[6]), min: p[1], max: p[2], scale: 'lin', role: p[5], drift: p[10], on: !!p[11] }));
    self = {
      inputs: {}, outputs,
      bundles: { multi: () => ({ label: host && host.lang === 'nl' ? 'Losse uit' : 'Separate outs', channels: GROUPS.map(g => ({ id: g, name: T.grp[g], node: grpDirect[g] })) }) },
      getPreset() { const s = copy(state); PRESET_SKIP.forEach(k => delete s[k]); return s; },
      setPreset(p) { const keep = {}; PRESET_SKIP.forEach(k => { keep[k] = copy(state[k]); }); state = clean({ ...(isObj(p) ? p : {}), ...keep }); apply(); render(); },
      params() { return PLIST.map(p => ({ ...p })); },
      modulate(offsets) { if (dead) return; const next = Object.create(null); if (isObj(offsets)) for (const p of PLIST) { const v = offsets[p.id]; if (typeof v === 'number' && Number.isFinite(v)) next[p.id] = Math.min(1, Math.max(-1, v)); } mod = next; apply(); },
      mount(container) { const wrap = document.createElement('div'); container.appendChild(wrap); root = wrap; render(); if (stopDraw) { stopDraw(); stopDraw = null; } stopDraw = tekenLus(host, self, animate, 20); },
      unmount() { if (stopDraw) { stopDraw(); stopDraw = null; } root = null; ui = {}; },
      onStep, onTransport({ playing: p }) { playing = !!p; if (!playing) { stopAll(.15); pending.length = 0; lastStep = -1; } },
      onEvent(port, ev) {
        try {
          if (dead || port !== 'trigger' || !isObj(ev)) return; const t = Number.isFinite(ev.time) ? ev.time : ctx.currentTime;
          if (ev.type === 'note') { if (typeof ev.vel === 'number' && Number.isFinite(ev.vel) && ev.vel > 0 && Number.isFinite(ev.note)) playNote(ev.note, ev.vel, t); }
          else if (ev.type === 'trig') {
            const vel = ev.vel === undefined ? 1 : ev.vel; if (typeof vel !== 'number' || !Number.isFinite(vel)) return;
            const m = typeof ev.lane === 'string' ? /^ch(\d+)$/.exec(ev.lane) : null, id = m ? (LANES[+m[1] - 1] || [])[1] : (typeof ev.lane === 'string' && Object.hasOwn(TRIGLANE, ev.lane) ? TRIGLANE[ev.lane] : (typeof ev.lane === 'string' && Object.hasOwn(SBYID, ev.lane) ? ev.lane : null));
            if (id) play(id, vel, t);
          } else if (ev.type === 'cc' && (ev.cc === 4 || ev.id === 'pedal') && typeof ev.value === 'number' && Number.isFinite(ev.value)) pedalPos = Math.min(1, Math.max(0, ev.value));
        } catch (e) { error = T.audioErr + (e && e.message || String(e)); }
      },
      clipInfo, getClip, setClip, noteNames() { return SND.map((s, i) => ({ note: s[1], name: nm(i) })); },
      restoreFiles,
      getState() { return copy(state); },
      setState(s) { state = clean(s); apply(); if (root) render(); },
      destroy() { if (dead) return; if (job) job.ctl.abort(); dead = true; if (stopDraw) { stopDraw(); stopDraw = null; } root = null; voices.forEach(v => v.srcs.forEach(s => { try { s.stop(); } catch (e) { /* */ } })); voices.clear(); owned.forEach(n => { try { n.disconnect(); } catch (e) { /* */ } }); owned.clear(); kit = null; }
    };
    apply();
    return self;
  }
};
export default __pkDef;
