// SPDX-License-Identifier: AGPL-3.0-or-later
// 1.11.0 — Patchkamer contract v1.11. Nieuw als Clip Arranger (nieuwe id nl.patchkamer.cliparranger, eigen map in sequencers; voorheen Regie,
//   nl.patchkamer.regie). Songs en presets uit die tijd verwijzen naar de oude id en laden hier niet in. Een oude compositie klinkt gelijk:
//   dezelfde state en dezelfde klokstappen geven dezelfde gebeurtenissen.
//   - tweetalig (host.lang, poortnamen per taal in i18n); de poorten staan boven in de kaart (host-poortenrij); kleuren volgen de host
//   - live spelen: noten van de ingang gaan direct naar de uitgang van het geselecteerde spoor (met velocity en lengte); een vastgehouden
//     toets (held / noteoff) wordt netjes afgesloten, ook bij wisselen van spoor, nieuwe state of verwijderen; noteoff en allnotesoff werken
//   - velocity en lengte van ingespeelde noten worden bewaard; in de pianoroll is de lengte de breedte en de velocity de hoogte van het blokje,
//     met een velocity-strook om te bewerken
//   - raster per clip: 1/16 (standaard), 1/32 of 1/64. Stap en lengte staan in zestienden en mogen veelvouden van 0,25 zijn; live invoer
//     kwantiseert naar het raster (of naar 1/64 als kwantiseren uit staat)
//   - verbeterd: een klokstap met een niet-eindige stepDur wordt genegeerd
// Een clip-, scène- en songsequencer met tot 16 sporen. Elk spoor heeft 8 clips (noten en CC-lanes); een scène start de clips van alle sporen,
// de song speelt scènes in een arrangement. Er komt geen geluid uit dit apparaat: elk spoor stuurt note-, trig- en cc-gebeurtenissen naar zijn uitgang.
const EN = {
  'CLIPS / SCENES / SONG': 'CLIPS / SCENES / SONG', 'CLIP ARRANGER': 'CLIP ARRANGER',
  'Host transport staat stil.': 'Host transport is stopped.', 'Sequencer uit': 'Sequencer off', 'Sequencer aan': 'Sequencer on',
  'Song afgelopen': 'Song ended', 'maat {0}': 'bar {0}',
  'SONG': 'SONG', 'TRACKS': 'TRACKS', 'AFSPELEN': 'PLAYBACK', 'Clips / scènes': 'Clips / scenes', 'Song arrangement': 'Song arrangement',
  'Vanaf begin': 'From start', 'Song herhalen': 'Loop song', 'Undo': 'Undo', 'Redo': 'Redo',
  'STARTPUNT': 'TEMPLATE', 'Techno / house': 'Techno / house', 'Ambient / drone': 'Ambient / drone', 'Rock / pop': 'Rock / pop', 'Leeg project': 'Empty project',
  'Laad startpunt': 'Load template', 'Vervangt de compositie; Undo herstelt je vorige versie.': 'Replaces the composition; Undo restores your previous version.',
  'Nieuwe song': 'New song', 'Zwevende velden': 'Floating fields', 'Band schets': 'Band sketch', 'Nachtpatronen': 'Night patterns',
  'Aansluiten en bediening': 'Connecting and controls',
  'Verbind TRACK 1…16 via een eventkabel met de noten-, trigger- of CC-ingang van een apparaat. Het doelveld is je eigen label; de kabel bepaalt de echte bestemming. Audio blijft via de audio-uitgang van dat apparaat naar de mixer lopen.':
    'Connect TRACK 1…16 with an event cable to the note, trigger or CC input of a device. The target field is your own label; the cable decides the real destination. Audio keeps flowing from that device\'s audio output to the mixer.',
  'Slagwerk: Tracktype Drums, protocol Trig; verbind met MIDI / TRIG. De drumrijen verwijzen naar ch1…ch16: pas namen of notennummers aan jouw kit aan. Drone/pad: Tracktype Drone / pad; verbind met Noten / CC.':
    'Drums: track type Drums, protocol Trig; connect to MIDI / TRIG. The drum rows refer to ch1…ch16: adapt names or note numbers to your kit. Drone/pad: track type Drone / pad; connect to Notes / CC.',
  'Clipmatrix: klik op een clip om te bewerken; ▶ start bij de volgende lokale maatgrens. Een scène start alle bijbehorende clips tegelijk. Track ■ stopt alleen toekomstige events van die track. Vanaf begin zet de sequencer terug; starten en stoppen van de host bestuurt het transport.':
    'Clip matrix: click a clip to edit it; ▶ starts at the next local bar line. A scene starts all its clips together. Track ■ only stops future events of that track. From start rewinds the sequencer; starting and stopping the host controls the transport.',
  'Piano roll: klik om noten te plaatsen, sleep een noot om te verplaatsen en sleep de rechterrand voor de lengte. De breedte van een blokje is de lengte, de hoogte is de velocity; onder de roll kun je de velocity slepen. Rechtsklik verwijdert. Lengtes zijn zestienden (16 = één maat). Het raster (1/16, 1/32, 1/64) hoort bij de clip.':
    'Piano roll: click to place notes, drag a note to move it and drag the right edge for its length. The width of a block is the length, the height is the velocity; below the roll you can drag the velocity. Right-click deletes. Lengths are sixteenths (16 = one bar). The grid (1/16, 1/32, 1/64) belongs to the clip.',
  'Noten eindigen uiterlijk bij hun clip- of songsectiegrens (vermenigvuldigd met Gate). CC wordt per zestiende gestuurd. Een instrument moet deze events en parameter-id\'s ondersteunen. Reeds verstuurde noten en galmstaarten volgen het ontvangende instrument. Lange noten begrenst het apparaat op 60 seconden.':
    'Notes end at the latest at their clip or song-section boundary (multiplied by Gate). CC is sent per sixteenth. A device must support these events and parameter ids. Notes already sent and reverb tails follow the receiving device. Long notes are limited to 60 seconds.',
  'Live spelen: noten op de ingang (MIDI / opname) gaan direct naar de uitgang van het geselecteerde spoor, dus je hoeft het toetsenbord niet ook nog naar die synth te kabelen (doe je dat wel, dan klinkt het dubbel). Opname neemt de noten met hun velocity en lengte op in de geselecteerde clip, op het dichtstbijzijnde rasterpunt (of op 1/64 als kwantiseren uit staat).':
    'Live play: notes on the input (MIDI / record) go straight to the output of the selected track, so you do not need to cable the keyboard to that synth as well (if you do, it sounds double). Recording stores the notes with their velocity and length in the selected clip, at the nearest grid point (or at 1/64 when quantize is off).',
  'SCÈNE': 'SCENE', 'Patch → track': 'Patch → track', 'Track stoppen op volgende maat': 'Stop track at next bar',
  'Start scène {0}': 'Start scene {0}', 'Start track {0} clip {1}': 'Start track {0} clip {1}',
  '{0} maten · {1} noten · {2} CC-lanes': '{0} bars · {1} notes · {2} CC lanes', '{0}m · {1} events': '{0}b · {1} events',
  '01 · CLIPMATRIX': '01 · CLIP MATRIX',
  '▶ lanceert op de volgende maat · clipnaam opent de editor · M/S werkt op events · lege clips sturen geen noten': '▶ launches on the next bar · clip name opens the editor · M/S act on events · empty clips send no notes',
  '02 · TRACK {0} — {1}': '02 · TRACK {0} — {1}', 'TRACKNAAM': 'TRACK NAME', 'DOELAPPARAAT (LABEL)': 'TARGET DEVICE (LABEL)', 'TRACKTYPE': 'TRACK TYPE',
  'Toetsen / melodie': 'Keys / melody', 'Drumcomputer': 'Drum machine', 'Drone / pad / ambient': 'Drone / pad / ambient', 'KLEUR': 'COLOUR', 'Kleur {0}': 'Colour {0}',
  'TRANSPONEREN': 'TRANSPOSE', 'GATE': 'GATE', 'DRUMPROTOCOL': 'DRUM PROTOCOL', 'Trig → kanaalnaam': 'Trig → channel name', 'MIDI → notennummer': 'MIDI → note number',
  'VELOCITY SCHAAL': 'VELOCITY SCALE', 'Track auditeren': 'Audition track', 'Live opname → deze clip': 'Live record → this clip',
  'Drumrijen en kanaaltoewijzing': 'Drum rows and channel assignment', 'Trig gebruikt de lane-naam; MIDI gebruikt het notennummer. Volgorde en namen mogen afwijken van de aangesloten kit.':
    'Trig uses the lane name; MIDI uses the note number. Order and names may differ from the connected kit.',
  'RIJ {0}': 'ROW {0}', 'TRIG LANE {0}': 'TRIG LANE {0}', 'MIDI {0}': 'MIDI {0}',
  '03 · CLIP EDITOR — TRACK {0} / CLIP {1}': '03 · CLIP EDITOR — TRACK {0} / CLIP {1}', 'CLIPNAAM': 'CLIP NAME', 'CLIPLENGTE (MATEN)': 'CLIP LENGTH (BARS)',
  'ZOOM': 'ZOOM', '1 maat / 16 stappen': '1 bar / 16 steps', '2 maten / 32 stappen': '2 bars / 32 steps', '4 maten / 64 stappen': '4 bars / 64 steps',
  'PAGINA': 'PAGE', '{0} · stap {1}': '{0} · step {1}', 'OCTAAF': 'OCTAVE', 'RASTER': 'GRID', 'Kwantiseer live invoer': 'Quantize live input',
  'Kopieer clip': 'Copy clip', 'Plak clip': 'Paste clip', 'Naar volgende slot': 'To next slot', 'Wis noten': 'Clear notes',
  'NIEUWE NOOTLENGTE': 'NEW NOTE LENGTH', '1/64': '1/64', '1/32': '1/32', '1/16': '1/16', '1/8': '1/8', '1/4': '1/4', '1/2': '1/2', '1 maat': '1 bar',
  '2 maten': '2 bars', '4 maten': '4 bars', '8 maten': '8 bars', '16 maten': '16 bars', '32 maten': '32 bars', '64 maten': '64 bars',
  'NIEUWE VELOCITY': 'NEW VELOCITY', 'NIEUWE KANS': 'NEW PROBABILITY', 'NIEUWE RATCHET': 'NEW RATCHET',
  'AKKOORD GRONDTOON': 'CHORD ROOT', 'AKKOORD': 'CHORD', 'Mineur': 'Minor', 'Majeur': 'Major', 'Sus2': 'Sus2', 'Open kwinten': 'Open fifths', 'Mineur9': 'Minor 9',
  'Plaats lang akkoord': 'Place long chord', '▶ Auditie': '▶ Audition', 'Auditeer {0}': 'Audition {0}',
  '{0} · stap {1} · {2} zestienden · {3}%': '{0} · step {1} · {2} sixteenths · {3}%',
  '{0} noten · stap {1}–{2} · klik om te tekenen · sleep om te verplaatsen · rechterrand = lengte · breedte = lengte, hoogte = velocity · rechtsklik = wissen':
    '{0} notes · step {1}–{2} · click to draw · drag to move · right edge = length · width = length, height = velocity · right-click = delete',
  'VELOCITY (sleep een balkje)': 'VELOCITY (drag a bar)',
  'Selecteer een noot voor positie, lengte en velocity.': 'Select a note for position, length and velocity.',
  'NOOT START (STAP)': 'NOTE START (STEP)', 'LENGTE (ZESTIENDEN)': 'LENGTH (SIXTEENTHS)', 'MIDI NOOT': 'MIDI NOTE', 'DRUMRIJ': 'DRUM ROW',
  'NOOT VELOCITY': 'NOTE VELOCITY', 'NOOT KANS': 'NOTE PROBABILITY', 'NOOT RATCHET': 'NOTE RATCHET', 'Dupliceer noot': 'Duplicate note', 'Verwijder noot': 'Delete note',
  'CC AUTOMATISERING · klankontwikkeling': 'CC AUTOMATION · sound development', 'PARAMETER-ID': 'PARAMETER ID', 'VORM': 'SHAPE', 'Lineair': 'Linear', 'Stappen / hold': 'Steps / hold',
  'Maak / selecteer lane': 'Create / select lane', 'LANE': 'LANE',
  'Maak een lane met een parameter-id die het aangesloten apparaat begrijpt. Maximaal 8 lanes per clip.': 'Create a lane with a parameter id the connected device understands. At most 8 lanes per clip.',
  'CC tekenen {0}': 'Draw CC {0}', 'Stap {0}: {1}% · rechtsklik verwijdert': 'Step {0}: {1}% · right-click deletes',
  'Klik om punten te tekenen · rechtsklik op een punt om te verwijderen · waarden 0–100%, verstuurd op elke zestiende': 'Click to draw points · right-click a point to delete it · values 0–100%, sent on every sixteenth',
  '{0} punten · exact bewerken': '{0} points · edit exactly', 'CC STAP': 'CC STEP', 'CC WAARDE (%)': 'CC VALUE (%)', 'Verwijder CC-lane': 'Delete CC lane',
  '04 · SONG ARRANGEMENT': '04 · SONG ARRANGEMENT', '{0} maten · scènes spelen in deze volgorde · clips herhalen binnen iedere sectie': '{0} bars · scenes play in this order · clips repeat within each section',
  '{0} · {1} / {2}m': '{0} · {1} / {2}b', 'Speel vanaf sectie': 'Play from section', 'Sectie toevoegen': 'Add section', 'Scène dupliceren → volgende': 'Duplicate scene → next',
  'MATEN': 'BARS', 'HERHALINGEN': 'REPEATS', 'Scènenamen bewerken': 'Edit scene names', 'SCÈNE {0}': 'SCENE {0}',
  '05 · INSTRUMENTEN TOEWIJZEN': '05 · ASSIGN DEVICES', 'Verbind iedere trackuitgang (bovenin de kaart) met één instrumentingang. Doelapparaat is een vrij label; de eventkabel bepaalt de toewijzing. De ingang MIDI / opname gaat naar het geselecteerde spoor.':
    'Connect every track output (at the top of the card) to one device input. Target device is a free label; the event cable decides the assignment. The MIDI / record input goes to the selected track.',
  'ongebruikt': 'unused', 'Kabel → noten / trigs / CC': 'Cable → notes / trigs / CC', 'Deze uitgang blijft beschikbaar.': 'This output stays available.',
  'Sequencer: {0}': 'Sequencer: {0}', 'Invoer: {0}': 'Input: {0}', 'Clip Arranger sequencer': 'Clip Arranger sequencer',
  'Atmosfeer': 'Atmosphere', 'Bas': 'Bass', 'Variatie': 'Variation', 'Opbouw': 'Build-up', 'Hoofddeel': 'Main', 'Vrij': 'Free', 'Track {0}': 'Track {0}',
  'MIDI / opname': 'MIDI / record', 'Rock drums': 'Rock drums'
};
// Nederlandse standaardnamen uit het oude bestand: een opgeslagen naam die hier gelijk aan is, wordt een lege naam en volgt dan de taal
const OLD_TRACKS = ['Drums', 'Bas', 'Keys', 'Atmosfeer'], OLD_SCENES = ['Intro', 'Groove', 'Variatie', 'Break', 'Opbouw', 'Hoofddeel', 'Outro', 'Vrij'];
const lim = (v, a, b, d = a) => typeof v === 'number' && Number.isFinite(v) ? Math.min(b, Math.max(a, v)) : d;
const integer = (v, a, b, d = a) => Math.round(lim(v, a, b, d));
const quant = (v, a, b, d = a) => Math.min(b, Math.max(a, Math.round(lim(v, a, b, d) * 4) / 4)); // kleinste eenheid: een 1/64 = 0,25 zestiende
const clone = x => JSON.parse(JSON.stringify(x));
const text = (x, d = '', n = 40) => typeof x === 'string' ? x.slice(0, n) : d;
const COLORS = ['#e8ae61', '#80c9af', '#89b6ea', '#bb9ee4', '#e591a0', '#a8cb6a', '#7cccd3', '#e6bd85'];
const names = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
const pitch = n => names[((n % 12) + 12) % 12] + (Math.floor(n / 12) - 1);
const GRIDS = [16, 32, 64], MAXNOTES = 4096;
const drumRows = () => [['Kick', 36], ['Snare', 38], ['Clap', 39], ['Closed hat', 42], ['Open hat', 46], ['Low tom', 45], ['Mid tom', 47], ['High tom', 50], ['Rim', 37], ['Crash', 49], ['Ride', 51], ['Shaker', 70], ['Tambourine', 54], ['Conga', 64], ['Bongo', 60], ['Percussion', 75]].map(([name, note], i) => ({ name, note, lane: 'ch' + (i + 1) }));
const blankClip = (i = 0) => ({ name: 'Clip ' + (i + 1), bars: 1, grid: 16, notes: [], cc: [] });
function track(i, type = 'notes') { return { name: '', target: '', type, color: COLORS[i % 8], mute: false, solo: false, transpose: 0, velocity: 1, gate: type === 'drone' ? 1 : .9, drumProtocol: 'trig', rows: drumRows(), clips: Array.from({ length: 8 }, (_, j) => blankClip(j)), liveClip: 0 }; }
function defaults() { return { title: '', tracks: [track(0, 'drums'), track(1), track(2), track(3, 'drone')], scenes: Array.from({ length: 8 }, () => ({ name: '' })), arrangement: [{ scene: 0, bars: 4, repeats: 1 }, { scene: 1, bars: 8, repeats: 1 }, { scene: 3, bars: 4, repeats: 1 }, { scene: 5, bars: 8, repeats: 1 }, { scene: 6, bars: 4, repeats: 1 }], mode: 'session', songLoop: true, armed: true, selectedTrack: 0, selectedClip: 0, selectedSection: 0, editPage: 0, zoom: 16, pianoBase: 48, drawLength: 1, drawVelocity: .8, drawProbability: 1, drawRatchet: 1, selectedNote: -1, selectedRow: 0, record: false, quantize: true, ccId: 'cutoff', ccShape: 'linear' }; }
function note(id, step, n, len = 1, vel = .8, row = 0) { return { id, step, note: n, len, vel, prob: 1, ratchet: 1, row }; }
function cleanClip(x, i) {
  const c = blankClip(i); c.name = text(x?.name, c.name, 32); c.bars = integer(x?.bars, 1, 64, 1); c.grid = GRIDS.includes(x?.grid) ? x.grid : 16; const max = c.bars * 16;
  if (Array.isArray(x?.notes)) c.notes = x.notes.slice(0, MAXNOTES).map((n, j) => ({ id: integer(n?.id, 0, 1e8, j), step: quant(n?.step, 0, max - .25, 0), note: integer(n?.note, 0, 127, 60), len: quant(n?.len, .25, 1024, 1), vel: lim(n?.vel, .01, 1, .8), prob: lim(n?.prob, 0, 1, 1), ratchet: integer(n?.ratchet, 1, 4, 1), row: integer(n?.row, 0, 15, 0) }));
  // Nootnummers blijven stabiel na het laden, ook bij handgemaakte of oudere bestanden met dubbele nummers.
  const ids = new Set(); let next = Math.max(0, ...c.notes.map(n => n.id)) + 1; for (const n of c.notes) { if (ids.has(n.id)) n.id = next++; ids.add(n.id); }
  if (Array.isArray(x?.cc)) c.cc = x.cc.slice(0, 8).filter(a => a && typeof a.id === 'string').map(a => ({ id: a.id.slice(0, 48), shape: a.shape === 'hold' ? 'hold' : 'linear', points: Array.isArray(a.points) ? a.points.slice(0, 1024).map(p => ({ step: integer(p?.step, 0, max - 1, 0), value: lim(p?.value, 0, 1, .5) })).sort((a, b) => a.step - b.step) : [] }));
  return c;
}
function sanitize(x) {
  const d = defaults(), s = { ...d }; const oldTitle = typeof x?.title === 'string' && x.title === 'Nieuwe song'; s.title = oldTitle ? '' : text(x?.title, d.title, 64);
  s.tracks = Array.isArray(x?.tracks) && x.tracks.length ? x.tracks.slice(0, 16).map((t, i) => {
    const a = track(i, ['notes', 'drums', 'drone'].includes(t?.type) ? t.type : 'notes'); a.name = text(t?.name, '', 24); if (i < 4 && a.name === OLD_TRACKS[i] && OLD_TRACKS[i] !== ['Drums', 'Bass', 'Keys', 'Atmosphere'][i]) a.name = '';
    a.target = text(t?.target, '', 40); a.color = COLORS.includes(t?.color) ? t.color : a.color; for (const k of ['mute', 'solo']) a[k] = typeof t?.[k] === 'boolean' ? t[k] : false;
    a.transpose = integer(t?.transpose, -48, 48, 0); a.velocity = lim(t?.velocity, 0, 1, 1); a.gate = lim(t?.gate, .05, 1.5, a.gate); a.drumProtocol = t?.drumProtocol === 'note' ? 'note' : 'trig'; a.liveClip = integer(t?.liveClip, -1, 7, 0);
    a.rows = a.rows.map((r, j) => ({ name: text(t?.rows?.[j]?.name, r.name, 24), note: integer(t?.rows?.[j]?.note, 0, 127, r.note), lane: text(t?.rows?.[j]?.lane, r.lane, 32) }));
    a.clips = Array.from({ length: 8 }, (_, j) => cleanClip(t?.clips?.[j], j)); return a;
  }) : d.tracks;
  s.scenes = Array.from({ length: 8 }, (_, i) => { let n = text(x?.scenes?.[i]?.name, '', 24); if (n === OLD_SCENES[i] && n !== ['Intro', 'Groove', 'Variation', 'Break', 'Build-up', 'Main', 'Outro', 'Free'][i]) n = ''; return { name: n }; });
  s.arrangement = Array.isArray(x?.arrangement) && x.arrangement.length ? x.arrangement.slice(0, 64).map(a => ({ scene: integer(a?.scene, 0, 7, 0), bars: integer(a?.bars, 1, 64, 4), repeats: integer(a?.repeats, 1, 16, 1) })) : d.arrangement;
  s.mode = x?.mode === 'song' ? 'song' : 'session'; for (const k of ['songLoop', 'armed', 'record', 'quantize']) s[k] = typeof x?.[k] === 'boolean' ? x[k] : d[k];
  for (const [k, a, b] of [['selectedTrack', 0, s.tracks.length - 1], ['selectedClip', 0, 7], ['selectedSection', 0, s.arrangement.length - 1], ['editPage', 0, 63], ['pianoBase', 0, 104], ['drawRatchet', 1, 4], ['selectedNote', -1, 1e8], ['selectedRow', 0, 15]]) s[k] = integer(x?.[k], a, b, d[k]);
  s.drawLength = quant(x?.drawLength, .25, 1024, 1); s.zoom = [16, 32, 64].includes(x?.zoom) ? x.zoom : 16; s.drawVelocity = lim(x?.drawVelocity, .01, 1, .8); s.drawProbability = lim(x?.drawProbability, 0, 1, 1);
  s.ccId = text(x?.ccId, 'cutoff', 48); s.ccShape = x?.ccShape === 'hold' ? 'hold' : 'linear'; return s;
}
// contract v1.6: werkstand, geen compositie — een preset laat dit staan
const PRESET_SKIP = ['selectedTrack', 'selectedClip', 'selectedSection', 'editPage', 'zoom', 'pianoBase', 'drawLength', 'drawVelocity', 'drawProbability', 'drawRatchet', 'selectedNote', 'selectedRow', 'record', 'quantize', 'ccId', 'ccShape'];
const PORTS = { audioIn: [], audioOut: [], eventIn: [{ id: 'input', name: 'MIDI / record' }], eventOut: Array.from({ length: 16 }, (_, i) => ({ id: 'track' + (i + 1), name: 'Track ' + (i + 1) })) };
const CSS = `
:host{display:block}.rg{--bg:var(--card);--panel:var(--card-2,var(--card));--gold:var(--event,#e8ae61);--gold-ink:color-mix(in srgb,var(--event,#e8ae61) 62%,var(--fg));--btn:color-mix(in srgb,var(--card-2,var(--card)) 86%,var(--fg));--screen:var(--well,var(--card));--screen-2:color-mix(in srgb,var(--well,var(--card)) 88%,var(--fg));background:var(--bg);color:var(--fg);font:12px var(--mono,monospace);padding:20px;border-radius:9px;container-type:inline-size}.rg *{box-sizing:border-box}.rg h1{font:700 32px var(--disp,sans-serif);letter-spacing:5px;margin:0}.rg h2{font:600 14px var(--mono,monospace);margin:0 0 12px}.rg p{line-height:1.7}.rg .kicker{font-size:10px;letter-spacing:2px;color:var(--gold-ink)}.rg button,.rg select,.rg input{font:inherit;color:inherit}.rg button,.rg select,.rg input:not([type=checkbox]):not([type=range]){background:var(--btn);border:1px solid var(--line);border-radius:4px;padding:7px;min-height:32px}.rg button{cursor:pointer}.rg button:hover{border-color:var(--gold)}.rg button:disabled{opacity:.35;cursor:default}.rg .active{background:var(--gold);color:var(--card);border-color:var(--gold)}.rg button:focus-visible,.rg input:focus-visible,.rg select:focus-visible{outline:2px solid var(--sel,var(--fg));outline-offset:2px}.rg .row{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.rg .spread{justify-content:space-between}.rg .toolbar{display:flex;align-items:end;gap:10px;flex-wrap:wrap;margin:14px 0}.rg .section{border:1px solid var(--line);border-radius:6px;padding:14px;background:var(--panel);margin-top:14px}.rg .small{font-size:10px;color:var(--muted);line-height:1.7}.rg .accent{color:var(--gold-ink)}.rg .status{font-size:11px;color:color-mix(in srgb,var(--go,var(--fg)) 70%,var(--fg))}.rg label{display:flex;flex-direction:column;gap:5px;color:var(--muted);font-size:10px;letter-spacing:.4px}.rg label.check{flex-direction:row;align-items:center}.rg input[type=range]{accent-color:var(--gold);min-width:110px;max-width:180px}.rg output{font-size:12px;color:var(--fg)}.rg input[type=number]{width:86px}.rg input[type=text]{width:170px;max-width:100%}.rg .scroll{overflow:auto}.rg .session{display:grid;gap:5px}.rg .th{padding:8px;background:var(--btn);border-top:3px solid var(--track);border-radius:5px}.rg .th .name{font-weight:bold;width:100%;text-align:left;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}.rg .slot{display:flex;align-items:stretch;border:1px solid var(--line);border-radius:4px;background:var(--btn);min-height:45px;min-width:0}.rg .slot.selected{outline:2px solid var(--track);outline-offset:-1px}.rg .slot.running{background:color-mix(in srgb,var(--track) 22%,var(--panel))}.rg .slot.queued{border-style:dashed;border-color:var(--track)}.rg .slot .launch{padding:5px;color:var(--track);background:transparent;border:0;min-width:28px}.rg .slot .body{flex:1;text-align:left;border:0;background:transparent;padding:6px;min-width:0;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;font-size:11px}.rg .scene{display:flex;align-items:center;gap:5px}.rg .scene button{padding:5px}.rg .scene span{overflow:hidden;white-space:nowrap;font-size:11px}.rg .scene.running{color:var(--gold-ink)}.rg .scene.queued{outline:1px dashed var(--gold)}.rg .mini{font-size:10px;padding:4px;min-height:25px}.rg .badge{font-size:9px;color:var(--muted);display:block;margin-top:5px}.rg .layout{display:grid;grid-template-columns:1fr;gap:12px}.rg .gridwrap{overflow:auto;max-height:620px;border:1px solid var(--line);border-radius:4px;position:relative;background:var(--screen)}.rg .pianobody{display:flex;align-items:stretch;min-width:650px}.rg .keys{width:112px;flex:none;position:sticky;left:0;z-index:3;box-shadow:3px 0 8px #0005}.rg .key{height:24px;border-bottom:1px solid #445159;background:#34424a;display:flex;align-items:center;justify-content:space-between;font-size:10px;padding:0 7px;cursor:pointer;color:#e6e7e0}.rg .key.black{background:#1d282e;color:#c0cbd0}.rg .key.selected{color:#e8ae61}.rg .gridarea{flex:1;min-width:0;position:relative}.rg .ruler{height:25px;position:relative;background:var(--btn);border-bottom:1px solid var(--line)}.rg .ruler span{position:absolute;font-size:9px;padding-left:4px;top:5px;color:var(--muted)}.rg .noteground{position:relative;touch-action:none;background-image:linear-gradient(to bottom,transparent 23px,color-mix(in srgb,var(--fg) 14%,var(--screen)) 23px),linear-gradient(to right,color-mix(in srgb,var(--fg) 26%,var(--screen)) 1px,transparent 1px),linear-gradient(to right,color-mix(in srgb,var(--fg) 9%,var(--screen)) 1px,transparent 1px);background-size:100% 24px,calc(100% / var(--cols) * var(--beat)) 100%,calc(100% / var(--cols)) 100%;cursor:crosshair;overflow:hidden}.rg .noteblock{position:absolute;padding:0;min-height:0;height:20px;border:1px solid color-mix(in srgb,var(--fg) 30%,transparent);background:var(--track);border-radius:3px;color:#111a20;font-size:9px;text-align:left;overflow:hidden;touch-action:none;user-select:none;cursor:grab;white-space:nowrap}.rg .noteblock.chosen{outline:2px solid var(--fg);outline-offset:0}.rg .resize{position:absolute;right:0;top:0;bottom:0;width:8px;cursor:ew-resize;background:#1112}.rg .playline{position:absolute;top:0;bottom:0;width:2px;background:var(--fg);pointer-events:none;z-index:2;display:none}.rg .velstrip{position:relative;height:84px;margin-top:6px;margin-left:112px;border:1px solid var(--line);border-radius:4px;background:var(--screen);overflow:hidden;touch-action:none}.rg .velbar{position:absolute;bottom:0;min-width:4px;padding:0;min-height:0;border:0;border-radius:2px 2px 0 0;background:var(--track);opacity:.8;cursor:ns-resize;touch-action:none}.rg .velbar.chosen{opacity:1;outline:2px solid var(--fg);z-index:2}.rg .vellabel{font-size:9px;color:var(--muted);margin:6px 0 0 112px}.rg .noteinspector{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:10px;margin-top:12px}.rg .songtimeline{position:relative;padding-top:6px;display:flex;gap:3px;min-width:700px}.rg .songblock{min-width:65px;background:var(--btn);border-top:3px solid var(--gold);padding:9px;font-size:11px;cursor:pointer;overflow:hidden;white-space:nowrap}.rg .songblock.running{background:color-mix(in srgb,var(--gold) 55%,var(--card));color:var(--fg)}.rg .arrrow{display:grid;grid-template-columns:30px minmax(120px,1fr) 86px 86px auto;gap:8px;align-items:end;margin:8px 0;min-width:600px}.rg .arrrow.chosen{outline:1px solid var(--gold);outline-offset:4px}.rg .cclane{height:90px;background:var(--screen);border:1px solid var(--line);border-radius:4px;margin:8px 0;position:relative;cursor:crosshair;touch-action:none}.rg .ccpoint{position:absolute;width:9px;height:9px;border-radius:50%;background:var(--gold);transform:translate(-50%,50%);padding:0;min-height:0;border:1px solid var(--fg)}.rg .ccbar{position:absolute;bottom:0;pointer-events:none;background:color-mix(in srgb,var(--go,var(--audio)) 25%,transparent)}.rg .ports{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px}.rg .port{background:var(--screen-2);border:1px solid var(--line);border-left:3px solid var(--track);padding:8px;border-radius:4px;min-width:0}.rg .port small{display:block;color:var(--muted);font-size:10px;margin-top:5px;overflow-wrap:anywhere}.rg details{margin:12px 0}.rg summary{cursor:pointer;color:var(--gold-ink);padding:5px 0}.rg .error{color:var(--stop,var(--fg))}.rg .ccrow{display:flex;justify-content:space-between;gap:8px;align-items:center;padding:5px 0;border-bottom:1px solid var(--line)}@container(max-width:700px){.rg{padding:12px}.rg h1{font-size:27px}.rg .noteinspector{grid-template-columns:repeat(2,minmax(100px,1fr))}.rg .toolbar{gap:7px}}`;
const frameLoop = (host, inst, cb, fps) => {
  if (host && typeof host.frame === 'function') return host.frame(inst, cb, fps);
  let raf = 0, last = 0, stop = false;
  const f = t => { if (stop) return; raf = requestAnimationFrame(f); if (document.hidden || t - last < 1000 / fps - 2) return; last = t; cb(t); };
  raf = requestAnimationFrame(f); return () => { stop = true; cancelAnimationFrame(raf); };
};
export default {
  id: 'nl.patchkamer.cliparranger', name: 'Clip Arranger', version: '1.11.0', kind: 'utility', category: 'sequencer', ui: { width: 1340, minWidth: 560 }, ports: PORTS,
  i18n: { nl: { ports: Object.assign({ input: 'MIDI / opname' }, ...Array.from({ length: 16 }, (_, i) => ({ ['track' + (i + 1)]: 'Track ' + (i + 1) }))) } },
  create(ctx, host) {
    const tx = (k, ...a) => { let t = host.lang === 'nl' ? k : (EN[k] ?? k); a.forEach((v, i) => { t = t.split('{' + i + '}').join(v); }); return t; };
    const trackDefault = i => i < 4 ? tx(['Drums', 'Bas', 'Keys', 'Atmosfeer'][i]) : tx('Track {0}', i + 1);
    const sceneDefault = i => tx(OLD_SCENES[i]);
    const trackName = i => state.tracks[i].name || trackDefault(i);
    const sceneName = i => state.scenes[i].name || sceneDefault(i);
    function template(kind) {
      const s = defaults(); s.title = tx(kind === 'ambient' ? 'Zwevende velden' : kind === 'rock' ? 'Band schets' : 'Nachtpatronen'); if (kind === 'rock') s.tracks[0].name = tx('Rock drums');
      for (let sc = 0; sc < 8; sc++) {
        let id = 0; const add = (ti, step, n, len, v, row = 0) => s.tracks[ti].clips[sc].notes.push(note(id++, step, n, len, v, row)); s.tracks.forEach(t => { t.clips[sc].bars = kind === 'ambient' ? 8 : 2; t.clips[sc].name = sceneDefault(sc); });
        if (kind !== 'ambient') { for (let b = 0; b < 2; b++) { const off = b * 16; if (sc !== 3 && sc !== 6) { for (const x of (kind === 'rock' ? [0, 6, 8, 10] : [0, 4, 8, 12])) add(0, off + x, 36, 1, .9, 0); for (const x of [4, 12]) add(0, off + x, 38, 1, .8, 1); } if (sc !== 0 && sc !== 6) for (let j = 0; j < 16; j += 2) add(0, off + j, 42, 1, j % 4 ? .48 : .65, 3); if (sc === 5) for (const x of [6, 14]) add(0, off + x, 46, 1, .45, 4); for (const x of [0, 3, 6, 10]) if (sc !== 3) add(1, off + x, [36, 36, 39, 34][Math.floor(sc / 2) % 4], 2, .7); } }
        const chords = [[48, 51, 55], [44, 48, 51], [46, 50, 53], [43, 46, 50]]; const chord = chords[Math.floor(sc / 2) % 4]; chord.forEach(n => add(3, 0, n, kind === 'ambient' ? 128 : 32, .5)); if (sc !== 0) chord.forEach(n => add(2, 0, n + 12, kind === 'ambient' ? 48 : 12, .55)); if (sc === 2 || sc === 5) [0, 4, 7, 12, 16, 20, 24, 28].forEach((x, j) => add(2, x, [60, 63, 67, 70][j % 4], 2, .65));
        s.tracks[3].clips[sc].cc = [{ id: 'cutoff', shape: 'linear', points: [{ step: 0, value: .25 }, { step: kind === 'ambient' ? 96 : 24, value: .65 }] }];
      }
      if (kind === 'ambient') { s.tracks[0].mute = true; s.tracks[1].mute = true; s.arrangement = [{ scene: 0, bars: 8, repeats: 1 }, { scene: 2, bars: 8, repeats: 1 }, { scene: 3, bars: 8, repeats: 1 }, { scene: 5, bars: 8, repeats: 1 }, { scene: 6, bars: 8, repeats: 1 }]; }
      return s;
    }
    let state = template('techno'), self, root = null, stopFrame = null, dead = false, playing = false, clipboard = null, error = '', history = [], future = [];
    // Runtime playback is intentionally separate from the saved composition.
    let origin = null, lastAbs = null, elapsed = 0, seek = 0, active = [], trackOrigins = [], queueScene = null, queueClips = new Map(), pending = [], visual = null, viewRefs = {}, restart = true;
    let lastBpm = 120, lastDur = .125, lastInfo = null, songEnded = false, renderWanted = false;
    const live = new Map(); // live gespeelde noten (ingangsnoot -> {ti, out, until, held, rec})
    const currentTrack = () => state.tracks[state.selectedTrack], currentClip = () => currentTrack().clips[state.selectedClip];
    function reset() { origin = null; lastAbs = null; elapsed = 0; seek = 0; active = state.tracks.map(t => t.liveClip); trackOrigins = state.tracks.map(() => 0); queueScene = null; queueClips.clear(); pending = []; visual = null; restart = true; songEnded = false; }
    reset();
    function remember() { history.push(clone(state)); if (history.length > 40) history.shift(); future = []; }
    function change(fn, redraw = true) { remember(); fn(); if (redraw) render(); }
    function undo() { if (!history.length) return; future.push(clone(state)); releaseLive(); state = history.pop(); reset(); render(); }
    function redo() { if (!future.length) return; history.push(clone(state)); releaseLive(); state = future.pop(); reset(); render(); }
    function emit(i, ev) { if (dead || i < 0 || i >= state.tracks.length) return; host.emit(self, 'track' + (i + 1), ev); }
    function totalSteps() { return state.arrangement.reduce((sum, a) => sum + a.bars * 16 * a.repeats, 0); }
    function locate(tick) { const total = totalSteps(); if (!state.songLoop && tick >= total) return null; let at = ((tick % total) + total) % total, start = 0; for (let i = 0; i < state.arrangement.length; i++) { const a = state.arrangement[i], len = a.bars * 16 * a.repeats; if (at < start + len) return { index: i, scene: a.scene, local: (at - start) % (a.bars * 16), remaining: a.bars * 16 - (at - start) % (a.bars * 16), start, total }; start += len; } return null; }
    function sectionStart(index) { return state.arrangement.slice(0, index).reduce((n, a) => n + a.bars * 16 * a.repeats, 0); }
    function launchScene(sc) { if (state.mode !== 'session') change(() => { state.mode = 'session'; }); if (playing) { queueScene = sc; queueClips.clear(); } else { state.tracks.forEach(t => t.liveClip = sc); reset(); } render(); }
    function launchClip(ti, ci) { if (state.mode !== 'session') change(() => { state.mode = 'session'; }); if (playing) queueClips.set(ti, ci); else { state.tracks[ti].liveClip = ci; reset(); } render(); }
    function stopTrack(ti) { launchClip(ti, -1); }
    function readCC(a, step) { if (!a.points.length) return null; let left = null, right = null; for (const p of a.points) { if (p.step <= step) left = p; else { right = p; break; } } if (!left) return null; if (a.shape === 'hold' || !right || right.step === left.step) return left.value; return left.value + (right.value - left.value) * (step - left.step) / (right.step - left.step); }
    function schedule(info) {
      if (dead || !playing || !state.armed) return; if (!info || !Number.isInteger(info.step) || !Number.isInteger(info.bar) || !Number.isFinite(info.time) || !(info.stepDur > 0) || !Number.isFinite(info.stepDur)) return;
      const abs = info.bar * 16 + info.step; if (abs === lastAbs) return; lastBpm = lim(info.bpm, 10, 999, 120); lastDur = 60 / lastBpm / 4; lastInfo = { time: info.time, abs };
      if (origin === null || restart || (lastAbs !== null && abs < lastAbs)) { origin = abs; elapsed = 0; trackOrigins = state.tracks.map(() => 0); restart = false; songEnded = false; } else elapsed = abs - origin; lastAbs = abs;
      const tick = elapsed + seek; let position = null;
      if (state.mode === 'song') { position = locate(tick); if (!position) { songEnded = true; pending.push({ time: info.time, tick, clips: state.tracks.map(() => -1), local: state.tracks.map(() => -1), section: -1 }); if (pending.length > 128) pending.shift(); return; } }
      else if (elapsed % 16 === 0) {
        if (queueScene !== null) { state.tracks.forEach((t, i) => { active[i] = queueScene; t.liveClip = queueScene; trackOrigins[i] = elapsed; }); queueScene = null; renderWanted = true; }
        if (queueClips.size) { queueClips.forEach((ci, i) => { if (state.tracks[i]) { active[i] = ci; state.tracks[i].liveClip = ci; trackOrigins[i] = elapsed; } }); queueClips.clear(); renderWanted = true; }
      }
      const solo = state.tracks.some(t => t.solo), clipIds = [], locals = [];
      state.tracks.forEach((t, i) => {
        const ci = position ? position.scene : (active[i] ?? t.liveClip), c = t.clips[ci]; clipIds.push(ci); if (!c) { locals.push(-1); return; } const local = (position ? position.local : elapsed - (trackOrigins[i] || 0)) % (c.bars * 16); locals.push(local); if (t.mute || (solo && !t.solo)) return;
        for (const a of c.cc) { const v = readCC(a, local); if (v !== null) emit(i, { type: 'cc', id: a.id, value: Math.min(1, Math.max(0, v)), time: info.time }); }
        for (const n of c.notes) {
          const rel = n.step - local; if (rel < 0 || rel >= 1 || Math.random() > n.prob) continue; const vel = Math.min(1, n.vel * t.velocity); if (vel <= 0) continue; const at = info.time + rel * info.stepDur;
          if (t.type === 'drums') { const row = t.rows[n.row]; for (let r = 0; r < n.ratchet; r++) { const time = at + r * info.stepDur / n.ratchet; if (t.drumProtocol === 'trig') emit(i, { type: 'trig', lane: row.lane, vel, time }); else emit(i, { type: 'note', note: row.note, vel, time, dur: Math.max(.01, lastDur * .8 / n.ratchet) }); } }
          else { const maxSteps = (position ? Math.min(c.bars * 16 - local, position.remaining) : c.bars * 16 - local) - rel; const len = Math.min(n.len, maxSteps); emit(i, { type: 'note', note: integer(n.note + t.transpose, 0, 127, 60), vel, time: at, dur: Math.max(.01, len * lastDur * t.gate) }); }
        }
      });
      pending.push({ time: info.time, tick, clips: clipIds, local: locals, section: position?.index ?? -1 }); if (pending.length > 128) pending.shift();
    }
    function audition(n, row) { const t = currentTrack(), i = state.selectedTrack, time = ctx.currentTime; if (t.type === 'drums') { const r = t.rows[row]; emit(i, t.drumProtocol === 'trig' ? { type: 'trig', lane: r.lane, vel: state.drawVelocity, time } : { type: 'note', note: r.note, vel: state.drawVelocity, time, dur: .12 }); } else emit(i, { type: 'note', note: integer(n + t.transpose, 0, 127, 60), vel: state.drawVelocity, time, dur: Math.min(2, state.drawLength * lastDur) }); }
    function nextId(c) { return Math.max(-1, ...c.notes.map(n => n.id)) + 1; }
    function addNote(step, n, row) { const c = currentClip(); if (c.notes.length >= MAXNOTES) return; change(() => { const z = note(nextId(c), step, n, state.drawLength, state.drawVelocity, row); z.prob = state.drawProbability; z.ratchet = state.drawRatchet; c.notes.push(z); state.selectedNote = z.id; }); }
    function selected() { return currentClip().notes.find(n => n.id === state.selectedNote); }
    function copyClip() { clipboard = clone(currentClip()); }
    function pasteClip() { if (clipboard) change(() => { currentTrack().clips[state.selectedClip] = clone(clipboard); state.selectedNote = -1; }); }
    function setTrackCount(n) { releaseLive(); change(() => { while (state.tracks.length < n) state.tracks.push(track(state.tracks.length)); state.tracks.length = n; state.selectedTrack = Math.min(state.selectedTrack, n - 1); reset(); }); }
    function duplicateClip() { const ti = state.selectedTrack, from = state.selectedClip, to = (from + 1) % 8; change(() => { state.tracks[ti].clips[to] = clone(currentClip()); state.tracks[ti].clips[to].name = (state.tracks[ti].clips[to].name + ' copy').slice(0, 32); state.selectedClip = to; state.selectedNote = -1; }); }
    // ---- live spelen: noten van de ingang gaan naar het geselecteerde spoor; hangende noten sluiten we af ----
    const timeOf = ev => typeof ev.time === 'number' && Number.isFinite(ev.time) ? Math.max(ctx.currentTime, ev.time) : ctx.currentTime;
    function finishRecorded(e, offTime) {
      if (!e.rec) return; const n = e.rec.clip.notes.find(x => x.id === e.rec.id); e.rec = null; if (!n) return;
      const g = e.rec0.g, units = Math.round((offTime - e.rec0.time) / lastDur / g) * g; n.len = quant(Math.max(g, units), .25, 1024, g); renderWanted = true;
    }
    function releaseLive(ti) {
      const now = ctx.currentTime;
      for (const [k, e] of [...live]) { if (ti !== undefined && e.ti !== ti) continue; live.delete(k); if (e.held || e.until > now) emit(e.ti, { type: 'noteoff', note: e.out, vel: 0, time: now }); finishRecorded(e, now); }
    }
    function pruneLive() { const now = ctx.currentTime; for (const [k, e] of [...live]) if (!e.held && e.until < now) live.delete(k); }
    function setSelectedTrack(i) { if (i !== state.selectedTrack) releaseLive(); state.selectedTrack = i; }
    function recordPos(time) { // stap in zestienden (veelvoud van het raster) binnen de geselecteerde clip
      const ti = state.selectedTrack, c = currentClip(), L = c.bars * 16, g = state.quantize ? 16 / c.grid : .25;
      const base = state.mode === 'song' ? locate(elapsed + seek)?.local ?? 0 : elapsed - (trackOrigins[ti] || 0), x = lastInfo ? (time - lastInfo.time) / lastDur : 0, rel = Math.round((Number.isFinite(x) ? x : 0) / g) * g;
      return { c, g, step: (((base + rel) % L) + L) % L };
    }
    function onNoteIn(ev, time) {
      const t = currentTrack(), ti = state.selectedTrack; pruneLive();
      const n = integer(ev.note, 0, 127, 60), v = lim(ev.vel, 0, 1, .8), held = ev.held === true || (ev.type === 'noteon' && !(ev.dur > 0)), dur = held ? 120 : lim(ev.dur, .01, 600, .25);
      if (t.type === 'drums') {
        const row = t.rows.findIndex(r => r.note === n);
        if (row >= 0) emit(ti, t.drumProtocol === 'trig' ? { type: 'trig', lane: t.rows[row].lane, vel: v, time } : { type: 'note', note: n, vel: v, time, dur: held ? .1 : dur });
      } else {
        const out = integer(n + t.transpose, 0, 127, 60), vel = v * t.velocity;
        const prev = live.get(n); if (prev && prev.held) { live.delete(n); emit(prev.ti, { type: 'noteoff', note: prev.out, vel: 0, time }); finishRecorded(prev, time); } // dezelfde toets opnieuw terwijl hij nog vastgehouden wordt: eerst afsluiten
        if (vel > 0) { emit(ti, { type: 'note', note: out, vel, time, dur, ...(held ? { held: true } : {}) }); live.set(n, { ti, out, held, until: time + dur, rec: null, rec0: null }); }
      }
      if (state.record && playing && (t.type !== 'drums' || t.rows.some(r => r.note === n))) {
        const p = recordPos(time), c = p.c, row = Math.max(0, t.rows.findIndex(r => r.note === n)); remember();
        if (c.notes.length < MAXNOTES) {
          const len = held ? p.g : quant(Math.max(p.g, Math.round(dur / lastDur / p.g) * p.g), .25, 1024, p.g), z = note(nextId(c), quant(p.step, 0, c.bars * 16 - .25, 0), n, len, Math.max(.01, v), row); c.notes.push(z);
          const e = live.get(n); if (held && e) { e.rec = { clip: c, id: z.id }; e.rec0 = { time, g: p.g }; }
        }
        renderWanted = true;
      }
    }
    const instance = {
      inputs: {}, outputs: {},
      mount(container) { const wrap = document.createElement('div'); container.appendChild(wrap); root = wrap.attachShadow({ mode: 'open' }); render(); if (stopFrame) stopFrame(); stopFrame = frameLoop(host, self, animate, 30); },
      unmount() { if (stopFrame) { stopFrame(); stopFrame = null; } root = null; viewRefs = {}; },
      onStep(info) { try { schedule(info); } catch (e) { error = tx('Sequencer: {0}', e?.message || e); } },
      onTransport(info) { if (dead) return; const cue = seek; playing = !!info?.playing; reset(); if (playing) seek = cue; },
      onEvent(port, ev) {
        try {
          if (dead || port !== 'input' || !ev || typeof ev !== 'object') return; const type = ev.type, time = timeOf(ev), t = currentTrack();
          if (type === 'noteoff' || (type === 'noteon' && ev.vel === 0)) { const n = integer(ev.note, 0, 127, 60), e = live.get(n); if (e) { live.delete(n); emit(e.ti, { type: 'noteoff', note: e.out, vel: 0, time }); finishRecorded(e, time); } return; }
          if (type === 'allnotesoff' || type === 'panic') { releaseLive(); return; }
          if ((type === 'note' || type === 'noteon') && typeof ev.note === 'number' && ev.vel > 0) onNoteIn(ev, time);
          else if (type === 'trig') {
            const row = t.rows.findIndex(r => r.lane === ev.lane || r.name === ev.lane), v = lim(ev.vel, 0, 1, .8);
            if (t.type === 'drums' && row >= 0) {
              emit(state.selectedTrack, t.drumProtocol === 'trig' ? { type: 'trig', lane: t.rows[row].lane, vel: v, time } : { type: 'note', note: t.rows[row].note, vel: v, time, dur: .1 });
              if (state.record && playing) { const p = recordPos(time), c = p.c; remember(); if (c.notes.length < MAXNOTES) c.notes.push(note(nextId(c), quant(p.step, 0, c.bars * 16 - .25, 0), t.rows[row].note, 1, Math.max(.01, v), row)); renderWanted = true; }
            }
          } else if (type === 'cc' && typeof ev.id === 'string' && Number.isFinite(ev.value)) emit(state.selectedTrack, { type: 'cc', id: ev.id.slice(0, 48), value: lim(ev.value, 0, 1), time });
        } catch (e) { error = tx('Invoer: {0}', e?.message || e); }
      },
      // contract v1.6: preset = compositie; de werkstand (selecties, zoom, tekeninstellingen, opname) blijft staan
      getPreset() { const p = clone(state); PRESET_SKIP.forEach(k => delete p[k]); return p; },
      setPreset(p) { if (dead) return; const keep = {}; PRESET_SKIP.forEach(k => keep[k] = state[k]); self.setState({ ...(p && typeof p === 'object' ? p : {}), ...keep }); },
      getState() { return clone(state); },
      setState(s) { if (dead) return; releaseLive(); state = sanitize(s && typeof s === 'object' ? s : {}); history = []; future = []; reset(); render(); },
      destroy() { if (dead) return; releaseLive(); dead = true; playing = false; self.unmount(); pending = []; queueClips.clear(); live.clear(); history = []; future = []; clipboard = null; }
    };
    self = instance;
    // ---- UI ----
    function el(tag, parent, label, cls) { const n = document.createElement(tag); if (label !== undefined) n.textContent = label; if (cls) n.className = cls; if (parent) parent.appendChild(n); return n; }
    function btn(parent, label, fn, cls = '') { const b = el('button', parent, label, cls); b.type = 'button'; b.onclick = fn; return b; }
    function input(parent, label, value, fn, type = 'text', min, max, step) { const l = el('label', parent, label), n = el('input', l); n.type = type; n.value = String(value); n.setAttribute('aria-label', label); if (min !== undefined) n.min = min; if (max !== undefined) n.max = max; if (step !== undefined) n.step = step; n.onchange = () => fn(type === 'number' ? +n.value : n.value); return n; }
    function sel(parent, label, options, value, fn) { const l = el('label', parent, label), s = el('select', l); s.setAttribute('aria-label', label); for (const [v, txt] of options) { const o = el('option', s, txt); o.value = String(v); } s.value = String(value); s.onchange = () => fn(s.value); return s; }
    function range(parent, label, value, min, max, step, fn, fmt = v => v.toFixed(2)) { const l = el('label', parent, label), o = el('output', l, fmt(value)), r = el('input', l); r.type = 'range'; r.min = min; r.max = max; r.step = step; r.value = value; r.setAttribute('aria-label', label); r.oninput = () => o.textContent = fmt(+r.value); r.onchange = () => fn(+r.value); return r; }
    function check(parent, label, value, fn) { const l = el('label', parent, undefined, 'check'), n = el('input', l); n.type = 'checkbox'; n.checked = value; n.onchange = () => fn(n.checked); el('span', l, label); return n; }
    function selectClip(ti, ci) { setSelectedTrack(ti); state.selectedClip = ci; state.selectedNote = -1; state.editPage = 0; render(); }
    const pct = v => Math.round(v * 100) + '%';
    function render() {
      if (!root) return; root.replaceChildren(); viewRefs = { slots: [], scenes: [], song: [], playline: null, status: null }; const style = el('style', root); style.textContent = CSS; const app = el('div', root, undefined, 'rg'); app.tabIndex = 0; app.setAttribute('aria-label', tx('Clip Arranger sequencer'));
      app.onkeydown = e => { if (['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target?.tagName)) return; if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); } else if (e.key === 'Delete' || e.key === 'Backspace') { if (selected()) { e.preventDefault(); change(() => { currentClip().notes = currentClip().notes.filter(n => n.id !== state.selectedNote); state.selectedNote = -1; }); } } };
      const top = el('div', app, undefined, 'row spread'), brand = el('div', top); el('div', brand, 'PATCHKAMER · ' + tx('CLIPS / SCENES / SONG'), 'kicker'); el('h1', brand, tx('CLIP ARRANGER')); viewRefs.status = el('div', top, tx('Host transport staat stil.'), 'status');
      const tools = el('div', app, undefined, 'toolbar'); input(tools, tx('SONG'), state.title || tx('Nieuwe song'), v => change(() => state.title = v.slice(0, 64)));
      sel(tools, tx('TRACKS'), Array.from({ length: 16 }, (_, i) => [i + 1, String(i + 1)]), state.tracks.length, v => setTrackCount(+v)); sel(tools, tx('AFSPELEN'), [['session', tx('Clips / scènes')], ['song', tx('Song arrangement')]], state.mode, v => change(() => { state.mode = v; reset(); }));
      btn(tools, state.armed ? tx('Sequencer aan') : tx('Sequencer uit'), () => change(() => { state.armed = !state.armed; reset(); }), state.armed ? 'active' : ''); btn(tools, tx('Vanaf begin'), () => { reset(); render(); }); check(tools, tx('Song herhalen'), state.songLoop, v => change(() => state.songLoop = v)); btn(tools, tx('Undo'), undo).disabled = !history.length; btn(tools, tx('Redo'), redo).disabled = !future.length;
      const templateRow = el('div', app, undefined, 'row'); const templateSelect = sel(templateRow, tx('STARTPUNT'), [['techno', tx('Techno / house')], ['ambient', tx('Ambient / drone')], ['rock', tx('Rock / pop')], ['empty', tx('Leeg project')]], 'techno', () => { }); btn(templateRow, tx('Laad startpunt'), () => change(() => { releaseLive(); state = templateSelect.value === 'empty' ? defaults() : template(templateSelect.value); reset(); })); el('span', templateRow, tx('Vervangt de compositie; Undo herstelt je vorige versie.'), 'small');
      renderSession(app); renderTrack(app); renderEditor(app); renderSong(app); renderPorts(app);
      const help = el('details', app); el('summary', help, tx('Aansluiten en bediening')); const p = el('div', help, undefined, 'small');
      for (const k of ['Verbind TRACK 1…16 via een eventkabel met de noten-, trigger- of CC-ingang van een apparaat. Het doelveld is je eigen label; de kabel bepaalt de echte bestemming. Audio blijft via de audio-uitgang van dat apparaat naar de mixer lopen.', 'Slagwerk: Tracktype Drums, protocol Trig; verbind met MIDI / TRIG. De drumrijen verwijzen naar ch1…ch16: pas namen of notennummers aan jouw kit aan. Drone/pad: Tracktype Drone / pad; verbind met Noten / CC.', 'Clipmatrix: klik op een clip om te bewerken; ▶ start bij de volgende lokale maatgrens. Een scène start alle bijbehorende clips tegelijk. Track ■ stopt alleen toekomstige events van die track. Vanaf begin zet de sequencer terug; starten en stoppen van de host bestuurt het transport.', 'Piano roll: klik om noten te plaatsen, sleep een noot om te verplaatsen en sleep de rechterrand voor de lengte. De breedte van een blokje is de lengte, de hoogte is de velocity; onder de roll kun je de velocity slepen. Rechtsklik verwijdert. Lengtes zijn zestienden (16 = één maat). Het raster (1/16, 1/32, 1/64) hoort bij de clip.', 'Noten eindigen uiterlijk bij hun clip- of songsectiegrens (vermenigvuldigd met Gate). CC wordt per zestiende gestuurd. Een instrument moet deze events en parameter-id\'s ondersteunen. Reeds verstuurde noten en galmstaarten volgen het ontvangende instrument. Lange noten begrenst het apparaat op 60 seconden.', 'Live spelen: noten op de ingang (MIDI / opname) gaan direct naar de uitgang van het geselecteerde spoor, dus je hoeft het toetsenbord niet ook nog naar die synth te kabelen (doe je dat wel, dan klinkt het dubbel). Opname neemt de noten met hun velocity en lengte op in de geselecteerde clip, op het dichtstbijzijnde rasterpunt (of op 1/64 als kwantiseren uit staat).']) el('p', p, tx(k));
    }
    function renderSession(app) {
      const sec = el('section', app, undefined, 'section'); el('h2', sec, tx('01 · CLIPMATRIX')); const scroll = el('div', sec, undefined, 'scroll'), grid = el('div', scroll, undefined, 'session'); grid.style.gridTemplateColumns = `150px repeat(${state.tracks.length},minmax(138px,1fr))`; grid.style.minWidth = (150 + state.tracks.length * 143) + 'px'; el('div', grid, tx('SCÈNE'), 'small');
      state.tracks.forEach((t, i) => { const th = el('div', grid, undefined, 'th'); th.style.setProperty('--track', t.color); btn(th, `${i + 1} · ${trackName(i)}`, () => { setSelectedTrack(i); state.selectedNote = -1; render(); }, 'name'); el('span', th, t.target || tx('Patch → track') + (i + 1), 'badge'); const row = el('div', th, undefined, 'row'); btn(row, 'M', () => change(() => t.mute = !t.mute), 'mini' + (t.mute ? ' active' : '')); btn(row, 'S', () => change(() => t.solo = !t.solo), 'mini' + (t.solo ? ' active' : '')); btn(row, '■', () => stopTrack(i), 'mini').title = tx('Track stoppen op volgende maat'); });
      state.scenes.forEach((scene, ci) => {
        const sc = el('div', grid, undefined, 'scene'); btn(sc, '▶', () => launchScene(ci)).setAttribute('aria-label', tx('Start scène {0}', ci + 1)); el('span', sc, `${ci + 1} · ${sceneName(ci)}`); viewRefs.scenes.push(sc);
        state.tracks.forEach((t, ti) => { const c = t.clips[ci], slot = el('div', grid, undefined, 'slot' + (state.selectedTrack === ti && state.selectedClip === ci ? ' selected' : '')); slot.style.setProperty('--track', t.color); btn(slot, '▶', () => launchClip(ti, ci), 'launch').setAttribute('aria-label', tx('Start track {0} clip {1}', ti + 1, ci + 1)); const body = btn(slot, c.name, () => selectClip(ti, ci), 'body'); body.title = tx('{0} maten · {1} noten · {2} CC-lanes', c.bars, c.notes.length, c.cc.length); el('span', body, tx('{0}m · {1} events', c.bars, c.notes.length), 'badge'); viewRefs.slots.push({ el: slot, ti, ci }); });
      });
      el('p', sec, tx('▶ lanceert op de volgende maat · clipnaam opent de editor · M/S werkt op events · lege clips sturen geen noten'), 'small');
    }
    function renderTrack(app) {
      const t = currentTrack(), sec = el('section', app, undefined, 'section'); sec.style.setProperty('--track', t.color); el('h2', sec, tx('02 · TRACK {0} — {1}', state.selectedTrack + 1, trackName(state.selectedTrack))); const row = el('div', sec, undefined, 'toolbar');
      input(row, tx('TRACKNAAM'), trackName(state.selectedTrack), v => change(() => t.name = v === trackDefault(state.selectedTrack) ? '' : v.slice(0, 24))); input(row, tx('DOELAPPARAAT (LABEL)'), t.target, v => change(() => t.target = v.slice(0, 40)));
      sel(row, tx('TRACKTYPE'), [['notes', tx('Toetsen / melodie')], ['drums', tx('Drumcomputer')], ['drone', tx('Drone / pad / ambient')]], t.type, v => change(() => { releaseLive(); t.type = v; t.gate = v === 'drone' ? 1 : .9; state.selectedNote = -1; })); sel(row, tx('KLEUR'), COLORS.map((c, i) => [c, tx('Kleur {0}', i + 1)]), t.color, v => change(() => t.color = v));
      if (t.type !== 'drums') { input(row, tx('TRANSPONEREN'), t.transpose, v => change(() => { releaseLive(); t.transpose = integer(v, -48, 48, 0); }), 'number', -48, 48); range(row, tx('GATE'), t.gate, .05, 1.5, .05, v => change(() => t.gate = v), v => Math.round(v * 100) + '%'); } else sel(row, tx('DRUMPROTOCOL'), [['trig', tx('Trig → kanaalnaam')], ['note', tx('MIDI → notennummer')]], t.drumProtocol, v => change(() => t.drumProtocol = v));
      range(row, tx('VELOCITY SCHAAL'), t.velocity, 0, 1, .01, v => change(() => t.velocity = v), pct); btn(row, tx('Track auditeren'), () => audition(t.type === 'drone' ? 48 : 60, state.selectedRow)); check(row, tx('Live opname → deze clip'), state.record, v => change(() => state.record = v));
      if (t.type === 'drums') { const map = el('details', sec); el('summary', map, tx('Drumrijen en kanaaltoewijzing')); el('p', map, tx('Trig gebruikt de lane-naam; MIDI gebruikt het notennummer. Volgorde en namen mogen afwijken van de aangesloten kit.'), 'small'); const rows = el('div', map, undefined, 'noteinspector'); t.rows.forEach((r, i) => { const box = el('div', rows); input(box, tx('RIJ {0}', i + 1), r.name, v => change(() => r.name = v.slice(0, 24))); input(box, tx('TRIG LANE {0}', i + 1), r.lane, v => change(() => r.lane = v.slice(0, 32))); input(box, tx('MIDI {0}', i + 1), r.note, v => change(() => r.note = integer(v, 0, 127, 36)), 'number', 0, 127); }); }
    }
    function renderEditor(app) {
      const t = currentTrack(), c = currentClip(), sec = el('section', app, undefined, 'section'); sec.style.setProperty('--track', t.color); el('h2', sec, tx('03 · CLIP EDITOR — TRACK {0} / CLIP {1}', state.selectedTrack + 1, state.selectedClip + 1));
      const bar = el('div', sec, undefined, 'toolbar'); input(bar, tx('CLIPNAAM'), c.name, v => change(() => c.name = v.slice(0, 32)));
      input(bar, tx('CLIPLENGTE (MATEN)'), c.bars, v => change(() => { c.bars = integer(v, 1, 64, 1); c.notes = c.notes.filter(n => n.step < c.bars * 16); c.notes.forEach(n => { n.step = Math.min(n.step, c.bars * 16 - .25); }); c.cc.forEach(a => a.points = a.points.filter(p => p.step < c.bars * 16)); state.editPage = 0; }), 'number', 1, 64);
      sel(bar, tx('RASTER'), [[16, tx('1/16')], [32, tx('1/32')], [64, tx('1/64')]], c.grid, v => change(() => { c.grid = +v; state.drawLength = Math.max(state.drawLength, 16 / c.grid); }));
      check(bar, tx('Kwantiseer live invoer'), state.quantize, v => { state.quantize = v; });
      sel(bar, tx('ZOOM'), [[16, tx('1 maat / 16 stappen')], [32, tx('2 maten / 32 stappen')], [64, tx('4 maten / 64 stappen')]], state.zoom, v => { state.zoom = +v; state.editPage = 0; render(); });
      const pages = Math.ceil(c.bars * 16 / state.zoom); state.editPage = Math.min(state.editPage, pages - 1); sel(bar, tx('PAGINA'), Array.from({ length: pages }, (_, i) => [i, tx('{0} · stap {1}', i + 1, i * state.zoom + 1)]), state.editPage, v => { state.editPage = +v; render(); });
      if (t.type !== 'drums') sel(bar, tx('OCTAAF'), Array.from({ length: 9 }, (_, i) => [i * 12, pitch(i * 12) + ' – ' + pitch(i * 12 + 23)]), state.pianoBase, v => { state.pianoBase = +v; render(); });
      btn(bar, tx('Kopieer clip'), copyClip); btn(bar, tx('Plak clip'), pasteClip).disabled = !clipboard; btn(bar, tx('Naar volgende slot'), duplicateClip); btn(bar, tx('Wis noten'), () => change(() => { c.notes = []; state.selectedNote = -1; }));
      const draw = el('div', sec, undefined, 'toolbar'); const lens = [[.25, '1/64'], [.5, '1/32'], [1, '1/16'], [2, '1/8'], [4, '1/4'], [8, '1/2'], [16, '1 maat'], [32, '2 maten'], [64, '4 maten'], [128, '8 maten'], [256, '16 maten'], [512, '32 maten'], [1024, '64 maten']];
      sel(draw, tx('NIEUWE NOOTLENGTE'), lens.map(([v, k]) => [v, tx(k)]), state.drawLength, v => state.drawLength = +v); range(draw, tx('NIEUWE VELOCITY'), state.drawVelocity, .05, 1, .05, v => state.drawVelocity = v, pct); range(draw, tx('NIEUWE KANS'), state.drawProbability, 0, 1, .05, v => state.drawProbability = v, pct);
      if (t.type === 'drums') sel(draw, tx('NIEUWE RATCHET'), [[1, '1 ×'], [2, '2 ×'], [3, '3 ×'], [4, '4 ×']], state.drawRatchet, v => state.drawRatchet = +v);
      if (t.type === 'drone') { const ch = el('div', sec, undefined, 'toolbar'); const r = input(ch, tx('AKKOORD GRONDTOON'), 48, () => { }, 'number', 0, 115); const chord = sel(ch, tx('AKKOORD'), [[0, tx('Mineur')], [1, tx('Majeur')], [2, tx('Sus2')], [3, tx('Open kwinten')], [4, tx('Mineur9')]], 0, () => { }); btn(ch, tx('Plaats lang akkoord'), () => { const rootNote = integer(+r.value, 0, 115, 48), intervals = [[0, 3, 7], [0, 4, 7], [0, 2, 7], [0, 7, 12], [0, 3, 7, 10, 14]][+chord.value]; change(() => { for (const k of intervals) { if (c.notes.length >= MAXNOTES) break; const n = note(nextId(c), state.editPage * state.zoom, Math.min(127, rootNote + k), Math.min(state.drawLength, c.bars * 16), state.drawVelocity); c.notes.push(n); } }); }); }
      renderPiano(sec, t, c); renderVelocity(sec, t, c); renderInspector(sec, t, c); renderCC(sec, c);
    }
    function view(c) { const g = c.grid, u = 16 / g, offset = state.editPage * state.zoom, span = Math.min(state.zoom, c.bars * 16 - offset); return { g, u, offset, span, cols: Math.round(span / u) }; }
    function renderPiano(sec, t, c) {
      const { g, u, offset, span, cols } = view(c), count = t.type === 'drums' ? 16 : 24, cell = g === 16 ? 27 : g === 32 ? 17 : 11, wrap = el('div', sec, undefined, 'gridwrap'), body = el('div', wrap, undefined, 'pianobody'); body.style.minWidth = (112 + cols * cell) + 'px';
      const keys = el('div', body, undefined, 'keys'); el('div', keys, tx('▶ Auditie'), 'ruler');
      for (let r = 0; r < count; r++) { const n = state.pianoBase + 23 - r; const label = t.type === 'drums' ? t.rows[r].name : pitch(n), k = el('div', keys, label, 'key' + (t.type !== 'drums' && [1, 3, 6, 8, 10].includes(n % 12) ? ' black' : '') + (t.type === 'drums' && r === state.selectedRow ? ' selected' : '')); k.tabIndex = 0; k.setAttribute('role', 'button'); k.setAttribute('aria-label', tx('Auditeer {0}', label)); const play = () => { state.selectedRow = r; audition(n, r); }; k.onclick = play; k.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); play(); } }; }
      const area = el('div', body, undefined, 'gridarea'), ruler = el('div', area, undefined, 'ruler'); for (let j = 0; j < span; j++) { const s = el('span', ruler, j % 4 === 0 ? `${Math.floor((offset + j) / 16) + 1}.${Math.floor(j % 16 / 4) + 1}` : '·'); s.style.left = j / span * 100 + '%'; }
      const ground = el('div', area, undefined, 'noteground'); ground.style.height = count * 24 + 'px'; ground.style.setProperty('--cols', cols); ground.style.setProperty('--beat', 4 / u); const playline = el('div', ground, undefined, 'playline'); viewRefs.playline = { el: playline, offset, cols: span, length: c.bars * 16 };
      const coordinates = e => { const b = ground.getBoundingClientRect(); return { step: offset + Math.max(0, Math.min(cols - 1, Math.floor((e.clientX - b.left) / b.width * cols))) * u, row: Math.max(0, Math.min(count - 1, Math.floor((e.clientY - b.top) / b.height * count))) }; };
      ground.onclick = e => { if (e.target !== ground) return; const p = coordinates(e); addNote(p.step, t.type === 'drums' ? t.rows[p.row].note : state.pianoBase + 23 - p.row, p.row); };
      const place = (b, n) => { const rr = t.type === 'drums' ? n.row : state.pianoBase + 23 - n.note, end = n.step + (t.type === 'drums' ? u : n.len), h = Math.round(4 + 16 * n.vel); b.style.left = (Math.max(offset, n.step) - offset) / span * 100 + '%'; b.style.width = Math.max(.2 * u, Math.min(end, offset + span) - Math.max(offset, n.step)) / span * 100 + '%'; b.style.height = h + 'px'; b.style.top = rr * 24 + 22 - h + 'px'; };
      c.notes.forEach(n => {
        const r = t.type === 'drums' ? n.row : state.pianoBase + 23 - n.note; if (r < 0 || r >= count || n.step + (t.type === 'drums' ? u : n.len) <= offset || n.step >= offset + span) return;
        const b = btn(ground, t.type === 'drums' ? (n.ratchet > 1 ? `${n.ratchet}×` : '') : pitch(n.note), () => { state.selectedNote = n.id; render(); }, 'noteblock' + (state.selectedNote === n.id ? ' chosen' : '')); b.title = tx('{0} · stap {1} · {2} zestienden · {3}%', t.type === 'drums' ? t.rows[n.row].name : pitch(n.note), n.step + 1, n.len, Math.round(n.vel * 100)); b.setAttribute('aria-label', b.title); place(b, n); b.style.opacity = .55 + .45 * n.vel; el('span', b, undefined, 'resize');
        b.oncontextmenu = e => { e.preventDefault(); change(() => { c.notes = c.notes.filter(x => x !== n); state.selectedNote = -1; }); };
        b.onpointerdown = e => {
          if (e.button !== 0) return; e.stopPropagation(); e.preventDefault(); b.setPointerCapture(e.pointerId); const initial = { x: e.clientX, y: e.clientY, step: n.step, note: n.note, row: n.row, len: n.len }, rect = ground.getBoundingClientRect(), resizing = e.target?.className === 'resize'; let moved = false; state.selectedNote = n.id; remember();
          b.onpointermove = ev => {
            const dx = Math.round((ev.clientX - initial.x) / rect.width * cols), dy = Math.round((ev.clientY - initial.y) / rect.height * count); if (dx || dy) moved = true;
            if (resizing) n.len = Math.max(u, Math.min(1024, initial.len + dx * u)); else { n.step = Math.max(0, Math.min(c.bars * 16 - u, initial.step + dx * u)); if (t.type === 'drums') { n.row = Math.max(0, Math.min(15, initial.row + dy)); n.note = t.rows[n.row].note; } else n.note = Math.max(0, Math.min(127, initial.note - dy)); }
            place(b, n);
          };
          b.onpointerup = ev => { ev.preventDefault(); b.onpointermove = null; b.onpointerup = null; try { b.releasePointerCapture(ev.pointerId); } catch { } if (!moved) { history.pop(); } render(); };
          b.onpointercancel = () => { n.step = initial.step; n.note = initial.note; n.row = initial.row; n.len = initial.len; history.pop(); render(); };
        };
      });
      el('p', sec, tx('{0} noten · stap {1}–{2} · klik om te tekenen · sleep om te verplaatsen · rechterrand = lengte · breedte = lengte, hoogte = velocity · rechtsklik = wissen', c.notes.length, offset + 1, offset + span), 'small');
    }
    function renderVelocity(sec, t, c) {
      const { u, offset, span } = view(c); el('div', sec, tx('VELOCITY (sleep een balkje)'), 'vellabel'); const strip = el('div', sec, undefined, 'velstrip'); strip.style.setProperty('--track', t.color);
      for (const n of c.notes) {
        if (n.step + (t.type === 'drums' ? u : n.len) <= offset || n.step >= offset + span) continue;
        const b = el('button', strip, undefined, 'velbar' + (state.selectedNote === n.id ? ' chosen' : '')); b.type = 'button'; b.style.left = (n.step - offset) / span * 100 + '%'; b.style.width = `max(4px,${u / span * 100}%)`; b.style.height = n.vel * 100 + '%'; b.title = (t.type === 'drums' ? t.rows[n.row].name : pitch(n.note)) + ' · ' + pct(n.vel); b.setAttribute('aria-label', b.title);
        b.onpointerdown = e => {
          if (e.button !== 0) return; e.preventDefault(); e.stopPropagation(); b.setPointerCapture(e.pointerId); remember(); const rect = strip.getBoundingClientRect(); let moved = false; state.selectedNote = n.id;
          b.onpointermove = ev => { moved = true; n.vel = Math.round(lim(1 - (ev.clientY - rect.top) / rect.height, .01, 1, .8) * 100) / 100; b.style.height = n.vel * 100 + '%'; b.title = (t.type === 'drums' ? t.rows[n.row].name : pitch(n.note)) + ' · ' + pct(n.vel); };
          b.onpointerup = ev => { b.onpointermove = null; b.onpointerup = null; try { b.releasePointerCapture(ev.pointerId); } catch { } if (!moved) history.pop(); render(); };
          b.onpointercancel = () => { history.pop(); render(); };
        };
      }
    }
    function renderInspector(sec, t, c) {
      const n = selected(), box = el('div', sec, undefined, 'noteinspector'); if (!n) { el('div', box, tx('Selecteer een noot voor positie, lengte en velocity.'), 'small'); return; }
      const edit = (key, value) => change(() => n[key] = value);
      input(box, tx('NOOT START (STAP)'), n.step + 1, v => edit('step', quant(v - 1, 0, c.bars * 16 - .25, 0)), 'number', 1, c.bars * 16, .25); input(box, tx('LENGTE (ZESTIENDEN)'), n.len, v => edit('len', quant(v, .25, 1024, 1)), 'number', .25, 1024, .25);
      if (t.type !== 'drums') input(box, tx('MIDI NOOT'), n.note, v => edit('note', integer(v, 0, 127, 60)), 'number', 0, 127); else sel(box, tx('DRUMRIJ'), t.rows.map((r, i) => [i, r.name]), n.row, v => change(() => { n.row = +v; n.note = t.rows[n.row].note; }));
      range(box, tx('NOOT VELOCITY'), n.vel, .01, 1, .01, v => edit('vel', v), pct); range(box, tx('NOOT KANS'), n.prob, 0, 1, .05, v => edit('prob', v), pct); if (t.type === 'drums') sel(box, tx('NOOT RATCHET'), [[1, '1 ×'], [2, '2 ×'], [3, '3 ×'], [4, '4 ×']], n.ratchet, v => edit('ratchet', +v));
      btn(box, tx('Dupliceer noot'), () => change(() => { const z = { ...n, id: nextId(c), step: Math.min(c.bars * 16 - 16 / c.grid, n.step + n.len) }; if (c.notes.length < MAXNOTES) c.notes.push(z); state.selectedNote = z.id; })); btn(box, tx('Verwijder noot'), () => change(() => { c.notes = c.notes.filter(x => x !== n); state.selectedNote = -1; }));
    }
    function renderCC(sec, c) {
      const det = el('details', sec); det.open = true; el('summary', det, tx('CC AUTOMATISERING · klankontwikkeling')); const row = el('div', det, undefined, 'toolbar');
      const id = input(row, tx('PARAMETER-ID'), state.ccId, v => { state.ccId = v.slice(0, 48); render(); }); id.placeholder = 'cutoff / motion / ch1.cutoff';
      sel(row, tx('VORM'), [['linear', tx('Lineair')], ['hold', tx('Stappen / hold')]], state.ccShape, v => change(() => { state.ccShape = v; const a = c.cc.find(x => x.id === state.ccId); if (a) a.shape = v; }));
      btn(row, tx('Maak / selecteer lane'), () => change(() => { const name = id.value.trim().slice(0, 48); if (!name) return; state.ccId = name; if (!c.cc.some(a => a.id === name) && c.cc.length < 8) c.cc.push({ id: name, shape: state.ccShape, points: [] }); }));
      if (c.cc.length) sel(row, tx('LANE'), c.cc.map(a => [a.id, a.id]), state.ccId, v => { state.ccId = v; state.ccShape = c.cc.find(a => a.id === v).shape; render(); });
      const a = c.cc.find(a => a.id === state.ccId); if (!a) { el('p', det, tx('Maak een lane met een parameter-id die het aangesloten apparaat begrijpt. Maximaal 8 lanes per clip.'), 'small'); return; }
      const offset = state.editPage * state.zoom, cols = Math.min(state.zoom, c.bars * 16 - offset), lane = el('div', det, undefined, 'cclane'); lane.setAttribute('aria-label', tx('CC tekenen {0}', a.id));
      for (let j = 0; j < cols; j++) { const value = readCC(a, offset + j); if (value !== null) { const bar = el('div', lane, undefined, 'ccbar'); bar.style.left = j / cols * 100 + '%'; bar.style.width = 100 / cols + '%'; bar.style.height = value * 100 + '%'; } }
      const add = e => { if (e.target !== lane) return; const b = lane.getBoundingClientRect(), step = offset + Math.max(0, Math.min(cols - 1, Math.round((e.clientX - b.left) / b.width * (cols - 1)))), value = Math.round(Math.max(0, Math.min(1, 1 - (e.clientY - b.top) / b.height)) * 100) / 100; change(() => { const old = a.points.find(p => p.step === step); if (old) old.value = value; else a.points.push({ step, value }); a.points.sort((x, y) => x.step - y.step); }); }; lane.onclick = add;
      for (const p of a.points.filter(p => p.step >= offset && p.step < offset + cols)) { const b = btn(lane, '', e => e.stopPropagation(), 'ccpoint'); b.style.left = (p.step - offset + .5) / cols * 100 + '%'; b.style.bottom = p.value * 100 + '%'; b.title = tx('Stap {0}: {1}% · rechtsklik verwijdert', p.step + 1, Math.round(p.value * 100)); b.setAttribute('aria-label', b.title); b.oncontextmenu = e => { e.preventDefault(); change(() => a.points = a.points.filter(x => x !== p)); }; }
      el('p', det, tx('Klik om punten te tekenen · rechtsklik op een punt om te verwijderen · waarden 0–100%, verstuurd op elke zestiende'), 'small'); const points = el('details', det); el('summary', points, tx('{0} punten · exact bewerken', a.points.length));
      a.points.forEach(p => { const r = el('div', points, undefined, 'toolbar'); input(r, tx('CC STAP'), p.step + 1, v => change(() => { p.step = integer(v, 1, c.bars * 16, 1) - 1; a.points.sort((x, y) => x.step - y.step); }), 'number', 1, c.bars * 16); input(r, tx('CC WAARDE (%)'), Math.round(p.value * 100), v => change(() => p.value = lim(v, 0, 100, 50) / 100), 'number', 0, 100); btn(r, '×', () => change(() => a.points = a.points.filter(x => x !== p))); });
      btn(det, tx('Verwijder CC-lane'), () => change(() => c.cc = c.cc.filter(x => x !== a)));
    }
    function renderSong(app) {
      const sec = el('section', app, undefined, 'section'); el('h2', sec, tx('04 · SONG ARRANGEMENT')); el('p', sec, tx('{0} maten · scènes spelen in deze volgorde · clips herhalen binnen iedere sectie', totalSteps() / 16), 'small');
      const scroll = el('div', sec, undefined, 'scroll'), timeline = el('div', scroll, undefined, 'songtimeline');
      state.arrangement.forEach((a, i) => { const block = btn(timeline, tx('{0} · {1} / {2}m', i + 1, sceneName(a.scene), a.bars * a.repeats), () => { state.selectedSection = i; render(); }, 'songblock'); block.style.flex = String(a.bars * a.repeats); viewRefs.song.push(block); });
      const controls = el('div', sec, undefined, 'toolbar'); btn(controls, tx('Speel vanaf sectie'), () => { state.mode = 'song'; reset(); seek = sectionStart(state.selectedSection); render(); });
      btn(controls, tx('Sectie toevoegen'), () => change(() => { if (state.arrangement.length < 64) state.arrangement.push({ scene: state.selectedClip, bars: 4, repeats: 1 }); }));
      btn(controls, tx('Scène dupliceren → volgende'), () => change(() => { const from = state.selectedClip, to = (from + 1) % 8; state.tracks.forEach(t => t.clips[to] = clone(t.clips[from])); state.scenes[to].name = (sceneName(from) + ' copy').slice(0, 24); }));
      const rows = el('div', sec, undefined, 'scroll');
      state.arrangement.forEach((a, i) => {
        const r = el('div', rows, undefined, 'arrrow' + (i === state.selectedSection ? ' chosen' : '')); btn(r, String(i + 1), () => { state.selectedSection = i; render(); }, 'mini'); sel(r, tx('SCÈNE'), state.scenes.map((s, j) => [j, `${j + 1} · ${sceneName(j)}`]), a.scene, v => change(() => a.scene = +v));
        input(r, tx('MATEN'), a.bars, v => change(() => a.bars = integer(v, 1, 64, 4)), 'number', 1, 64); input(r, tx('HERHALINGEN'), a.repeats, v => change(() => a.repeats = integer(v, 1, 16, 1)), 'number', 1, 16);
        const b = el('div', r, undefined, 'row'); btn(b, '↑', () => change(() => { if (i > 0) { [state.arrangement[i - 1], state.arrangement[i]] = [a, state.arrangement[i - 1]]; state.selectedSection = i - 1; } }), 'mini'); btn(b, '↓', () => change(() => { if (i < state.arrangement.length - 1) { [state.arrangement[i + 1], state.arrangement[i]] = [a, state.arrangement[i + 1]]; state.selectedSection = i + 1; } }), 'mini'); btn(b, '×', () => change(() => { if (state.arrangement.length > 1) { state.arrangement.splice(i, 1); state.selectedSection = Math.min(state.selectedSection, state.arrangement.length - 1); } }), 'mini');
      });
      const rename = el('details', sec); el('summary', rename, tx('Scènenamen bewerken')); const boxes = el('div', rename, undefined, 'noteinspector'); state.scenes.forEach((s, i) => input(boxes, tx('SCÈNE {0}', i + 1), sceneName(i), v => change(() => s.name = v === sceneDefault(i) ? '' : v.slice(0, 24))));
    }
    function renderPorts(app) {
      const sec = el('section', app, undefined, 'section'); el('h2', sec, tx('05 · INSTRUMENTEN TOEWIJZEN')); el('p', sec, tx('Verbind iedere trackuitgang (bovenin de kaart) met één instrumentingang. Doelapparaat is een vrij label; de eventkabel bepaalt de toewijzing. De ingang MIDI / opname gaat naar het geselecteerde spoor.'), 'small'); const ports = el('div', sec, undefined, 'ports');
      for (let i = 0; i < 16; i++) { const t = state.tracks[i], box = el('div', ports, undefined, 'port'); box.style.setProperty('--track', t?.color || '#39454c'); el('div', box, `${i + 1} · ${t ? trackName(i) : tx('ongebruikt')}`); el('small', box, t ? (t.target || tx('Kabel → noten / trigs / CC')) : tx('Deze uitgang blijft beschikbaar.')); }
    }
    function animate() {
      if (!root || dead) return; while (pending.length && pending[0].time <= ctx.currentTime) visual = pending.shift(); if (renderWanted) { renderWanted = false; render(); }
      if (viewRefs.status) { viewRefs.status.textContent = error || (!playing ? tx('Host transport staat stil.') : !state.armed ? tx('Sequencer uit') : songEnded ? tx('Song afgelopen') : `${state.mode === 'song' ? 'SONG' : 'SESSION'} · ${tx('maat {0}', Math.floor((visual?.tick || 0) / 16) + 1)} · ${lastBpm.toFixed(0)} BPM`); viewRefs.status.className = error ? 'error' : 'status'; }
      viewRefs.slots?.forEach(({ el, ti, ci }) => { el.classList.toggle('running', playing && state.armed && visual?.clips[ti] === ci); el.classList.toggle('queued', queueScene === ci || queueClips.get(ti) === ci); });
      viewRefs.scenes?.forEach((el, i) => { el.classList.toggle('running', playing && state.armed && visual?.clips.length > 0 && visual.clips.every(c => c === i)); el.classList.toggle('queued', queueScene === i); });
      viewRefs.song?.forEach((el, i) => el.classList.toggle('running', playing && state.mode === 'song' && visual?.section === i));
      const p = viewRefs.playline; if (p) { const local = visual?.local[state.selectedTrack], visible = playing && state.armed && visual?.clips[state.selectedTrack] === state.selectedClip && local >= p.offset && local < p.offset + p.cols; p.el.style.display = visible ? 'block' : 'none'; if (visible) p.el.style.left = (local - p.offset) / p.cols * 100 + '%'; }
    }
    return self;
  }
};
