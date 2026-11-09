// SPDX-License-Identifier: AGPL-3.0-or-later
// 1.14.0 — Titel in de UI verwijderd: de kaartbalk toont de naam.
// 1.13.0 — Patchkamer contract v1.24: klembord voor het bewerkte patroon. Nieuw: `clipInfo()`, `getClip()` en `setClip(clip)` met de soort `multi` (formaat `patchkamer-clip`, tijd in tikken van 12 per zestiende, dus 12 per stap):
//          het patroon dat je bewerkt (`curPat`) is een clip met 12 sporen. Een drumtrack is een `drums`-spoor met één baan (type en GM-nummer volgen de machine), een synthtrack een `notes`-spoor; de lengte van een track (1 tot 16 stappen) is de lengte
//          van zijn spoor (polymetrie blijft). `micro` wordt tikken (hoogstens 3), `retrig` ratchet, de condities 25%, 50% en 75% kans; p-locks, de overige condities, de klankinstellingen en alles van een track gaan alleen mee via `native` (het hele patroon): tussen
//          twee exemplaren van Groovebox 12 is plakken dus verliesvrij. Zonder `native` schrijft plakken alleen de stappen en de lengte van de toegewezen tracks (stappen, p-locks en condities van die tracks worden eerst gewist); klank en parameters blijven staan.
//          `curPat` zit niet in `getState()`; Ongedaan maken van de host zet de state terug met `setState`, dat het patroon normaal op 1 zet: `setClip` onthoudt daarom (patroon, tekst van de state ervoor) en `loadSong` houdt de patroonkeuze alleen als precies
//          die tekst terugkomt. `getState`, `setState`, het geluid, tunes en presets zijn verder gelijk aan 1.12.0. Niet beluisterd.
// 1.12.0 — Regelaars en trigpads herkenbaar voor skins (contract v1.22, additief): de 16 trigs krijgen via host.ui.adopt rol pad, groep trigs en id trig.1 tot trig.16, zodat een skin hun vorm, maat, kleur en ledje kiest (eigen .on-, .cur-, .sel-, .lock-klassen en het ledje in de knop blijven van het apparaat);
//          alle schuiven krijgen als id de sleutel van de state of params() (g.vol, g.swing, g.fxDrive, ..., en per pagina de knoppen als syn.tun, flt.cut, ...), rol param en een groep (global, fx, track, step, pattern, de pagina). Een oudere host heeft geen adopt: het apparaat blijft dan zoals het was.
//          Geluid, getState(), presets, tunes en uiterlijk zonder skin ongewijzigd.
// 1.11.2 — Alle continue regelaars bestuurbaar via params()/modulate() (stap 1 per track, stap 2 globaal), alle nieuwe standaard uit (on:false, drift 0,05 tot 0,08), de bestaande 96 ongewijzigd:
//          per track de overige continue regelaars van de pagina's SYN (machine-afhankelijk: bv. Sweep t/d, Click, Noise, Harm, Hold), FLT (Env depth, Env decay, Env attack, Key track, HP base), AMP (Attack, Hold, Decay, Overdrive, Accent, Vel→vol),
//          LFO (Speed, Depth, Fade, Phase) en FX (Delay HP, Reverb tone, Chorus, Width), plus de trackswing (tN.swing); patroonswing 1 tot 8 (p1.swing tot p8.swing); globaal Volume (g.vol), Swing (g.swing), FX drive, cutoff en reso (g.fxDrive/fxCut/fxRes),
//          Delay time en feedback (g.dlyTime/dlyFb). Modulatie komt alleen bovenop de knop en de p-locks (knop + o × bereik, log voor tune/decay/cutoff, geclampt) en is nooit state: getState, tunes en presets zijn gelijk.
//          Filter, niveau, pan en sends klinken tussen de slagen door mee; de overige klankregelaars werken (net als p-locks) vanaf de volgende slag. Zonder modulatie gelijk aan 1.11.1. Niet beluisterd.
//          Bewust weggelaten: keuzes en schakelaars (filtertype, golfvorm, LFO-bestemming/golf/modus/sync, FX-blok, akkoordtype, inversie, density), tempo (bpm), reverbgrootte (herbouwt de galmbuffer: kans op tikken), ketting (chain), stapdata en p-locks.
//          Risico: Volume, FX drive en delay-feedback bewegen via setTargetAtTime (geen sprongen), maar FX drive vervangt bij elke wijziging de vervormingscurve (zelfde pad als de eigen knop); niet beluisterd op zipper-ruis.
// 1.11.1 — Extra swing op patroonniveau (`pat.swing`) en per track (`track.swing`), 0 … 50% van een stap, naast de bestaande Swing-schuif (G.swing, 50 … 80) en de hostswing. De som van
//          patroon- en trackswing (begrensd tot 50%) vertraagt de oneven zestienden (stapnummer van de klok) met som × stap; de bestaande swing op het tracklokale stapnummer is ongewijzigd.
//          Standaard 0 = ongewijzigd (alle gebeurtenissen bit-voor-bit gelijk aan 1.11.0). Het apparaat heeft geen noten- of triggeringang (geen eventIn): live inspelen en noteNames
//          zijn er dus niet.
// 1.11.0 — Patchkamer contract v1.11. Nieuwe naam Groovebox 12 en nieuwe id nl.patchkamer.groovebox12 (voorheen Takt Twaalf, nl.patchkamer.takt12); tunes en songs uit die tijd
//          verwijzen naar de oude id. Tweetalig (host.lang; namen van het apparaat en de poorten per taal in i18n; alle teksten in TXT).
//          setState en modulate controleren alles: getallen binnen hun bereik, onbekende of ongeldige waarden op de standaard, ontbrekende sporen, stappen en
//          patronen aangevuld, dus een tune hoeft alleen te bevatten wat afwijkt. Verwijderd: de verborgen Play-knop (de klok is van de host), de lijst met songs in de browser (die kon nooit opslaan; opslaan
//          hoort bij de tunes van de host), en de belofte van sneltoetsen die er niet waren.
//          Een tracknaam wordt als tekst getoond, niet meer als HTML. Het geluid is ongewijzigd.
// 1.8.0 — Patchkamer contract v1.8: dubbelklik = beginwaarde, klik op het getal = waarde typen.
// 1.7.4 — Bundel-uitgang "Losse uit" (Separate outs): de twaalf tracks elk apart (na level en pan, vóór delay/reverb/FX-blok), met tracknaam. Kleuren volgen de
//         kleurstelling van Patchkamer. setState laadt de hele song en tekent de UI opnieuw, dus alles volgt een tune.
// 1.2.0 — Stuurbaar door een modulator (params + modulate): per track Tune, Decay, Cutoff, Reso, Level, Pan en de twee sends, bovenop knoppen en p-locks.
// Groovebox 12: groovebox met 12 tracks, 11 klankmachines (7 drums en 4 synths), 8 patronen, parameter locks, trig-condities, retrigs, micro-timing,
// polymetrie (elke track een eigen lengte), patroonketting, FX-blok met delay en galm, en twee demo-songs. De bron van dit bestand (een HTML-pagina met een
// bouwscript) is niet meer beschikbaar; dit bestand wordt rechtstreeks bewerkt.

// Teksten per taal (host.lang): Nederlandse bron, Engels als alternatief; onbekende taal = Engels
const TXT = {
  nl: { lockTitle: 'Parameter locks: kies een stap en draai', length: 'Lengte', note: 'Noot', off: 'uit', on: 'aan', patSong: 'Patronen &amp; song', chain: 'Ketting', copy: 'Kopieer →', clearTrigs: 'Wis trigs', random: 'Willekeurig',
    chainNote: 'Ketting = patroonnummers op volgorde, bv. <code>1 1 2 3</code>.', fxSends: 'FX-blok &amp; sends', reverb: 'Galm', fxBlock: 'FX-blok', songs: 'Songs', demoNight: 'Demo: Nachtstad', demoBasic: 'Demo: Basis',
    name: 'Naam', exportSum: 'Exporteren / importeren als tekst', toText: 'Naar tekst', copyText: 'Kopieer', import: 'Importeer',
    stepAria: n => `stap ${n}`, lenWord: 'lengte', lockStep: n => `P-lock stap ${n}: knoppen gelden alleen voor deze stap (dubbelklik = lock wissen)`, lockPick: 'P-lock: kies een stap', stepSel: n => `stap ${n} geselecteerd`,
    patSwing: 'Pat. swing', trkSwing: 'Trackswing', swingTitle: 'extra swing op de oneven zestienden, bovenop Swing en de swing van de host (dubbelklik: 0)',
    importFail: 'Kon deze tekst niet lezen als song.', clipPat: 'Patroon', clipBad: 'Geen geldige clip.', clipKind: 'De soort past niet: dit apparaat neemt een patroon met sporen (multi).', clipNoTrack: 'Geen enkel spoor van de clip past op een track van dit patroon.', clipGone: 'Het apparaat is nog niet geladen of verwijderd.', multi: 'Losse uit', songNight: 'Nachtstad', songBasic: 'Basis' },
  en: { lockTitle: 'Parameter locks: pick a step and turn a knob', length: 'Length', note: 'Note', off: 'off', on: 'on', patSong: 'Patterns &amp; song', chain: 'Chain', copy: 'Copy →', clearTrigs: 'Clear trigs', random: 'Random',
    chainNote: 'Chain = pattern numbers in order, e.g. <code>1 1 2 3</code>.', fxSends: 'FX block &amp; sends', reverb: 'Reverb', fxBlock: 'FX block', songs: 'Songs', demoNight: 'Demo: Night City', demoBasic: 'Demo: Basic',
    name: 'Name', exportSum: 'Export / import as text', toText: 'To text', copyText: 'Copy', import: 'Import',
    stepAria: n => `step ${n}`, lenWord: 'length', lockStep: n => `P-lock step ${n}: knobs only apply to this step (double-click = clear lock)`, lockPick: 'P-lock: pick a step', stepSel: n => `step ${n} selected`,
    patSwing: 'Pat. swing', trkSwing: 'Track swing', swingTitle: 'extra swing on the odd sixteenths, on top of Swing and the host swing (double-click: 0)',
    importFail: 'Could not read this text as a song.', clipPat: 'Pattern', clipBad: 'Not a valid clip.', clipKind: 'The kind does not fit: this device takes a pattern with tracks (multi).', clipNoTrack: 'No track of the clip fits a track of this pattern.', clipGone: 'The device is not loaded yet or was removed.', multi: 'Separate outs', songNight: 'Night City', songBasic: 'Basic' },
};
const __CSS = `
/* Layout: one hardware face. Header strip, then a three-column deck — track column, work surface (display · knobs · trig keys · step options), side column (patterns · FX · songs). Dark, single committed look. */
:host{
  /* kleurstelling van Patchkamer (contract v1.6); de waarde na de komma is de oude donkere kleur, voor als de host-variabele ontbreekt */
  --t-bg:var(--bg,#0b0d10); --t-body:var(--card,#13161b); --t-panel:var(--card-2,#191d23); --t-panel-2:color-mix(in srgb,var(--card-2,#191d23) 86%,var(--fg,#dde1e6));
  --t-line:var(--line,#2c333d); --t-fg:var(--fg,#dde1e6); --t-muted:var(--muted,#7c8694); --t-screen:var(--well,#07090b); --t-stepq:var(--step-q,#262c35);
  --t-accent:#ff7a1a; --t-accent-2:#38c6e0; --t-lock:#e85cff; --t-green:var(--go,#5ad17a); --t-red:var(--stop,#e2443a);
  --t-disp:'Chakra Petch',system-ui,sans-serif; --t-mono:'JetBrains Mono',ui-monospace,Menlo,monospace;
}
*{box-sizing:border-box}
.__body{color:var(--t-fg);font-family:var(--t-mono);font-size:12px;line-height:1.4;background:var(--t-bg)}
.device{max-width:1240px;margin:0 auto;background:var(--t-body);border:1px solid var(--t-line);border-radius:10px;padding:12px;display:grid;gap:10px;
  grid-template-columns:168px minmax(0,1fr) 292px;grid-template-areas:"hdr hdr hdr" "trk disp side" "trk knobs side" "trk trigs side" "trk step side";grid-template-rows:auto auto auto 1fr auto}
@container dev (max-width:1020px){.device{grid-template-columns:168px minmax(0,1fr);grid-template-areas:"hdr hdr" "trk disp" "trk knobs" "trk trigs" "trk step" "side side"}}
@container dev (max-width:700px){.device{grid-template-columns:minmax(0,1fr);grid-template-areas:"hdr" "trk" "disp" "knobs" "trigs" "step" "side";padding:10px}}
header{grid-area:hdr;display:flex;flex-wrap:wrap;gap:8px 16px;align-items:center;padding:2px 4px 8px;border-bottom:1px solid var(--t-line)}
.transport{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
button{font-family:var(--t-disp);font-size:11px;letter-spacing:.1em;text-transform:uppercase;background:var(--t-panel-2);color:var(--t-fg);border:1px solid var(--t-line);padding:6px 10px;cursor:pointer;border-radius:3px;line-height:1.2}
button:hover{border-color:var(--t-accent-2)}
button:focus-visible{outline:1px solid var(--t-accent-2);outline-offset:2px}
button.go{background:var(--t-green);border-color:var(--t-green);color:#06130a;font-weight:600;min-width:84px;padding:7px 10px}
button.go.on{background:var(--t-red);border-color:var(--t-red);color:#fff}
button.fill{min-width:64px;padding:7px 10px} button.fill.on{background:var(--t-accent);border-color:var(--t-accent);color:#1a0d00}
.tp{display:flex;align-items:center;gap:6px;color:var(--t-muted);font-size:10px;text-transform:uppercase;letter-spacing:.1em}
.tp input[type=number]{width:58px;background:var(--t-panel-2);color:var(--t-fg);border:1px solid var(--t-line);font-family:var(--t-mono);padding:4px 6px;font-size:12px;border-radius:3px;font-variant-numeric:tabular-nums}
.tp input[type=range]{width:84px}
.tp output{color:var(--t-fg);font-variant-numeric:tabular-nums;min-width:2ch}
input[type=range]{appearance:none;height:18px;background:transparent;margin:0;cursor:pointer;width:100%;min-width:0}
input[type=range]::-webkit-slider-runnable-track{height:4px;background:var(--t-line);border-radius:2px}
input[type=range]::-moz-range-track{height:4px;background:var(--t-line);border-radius:2px}
input[type=range]::-webkit-slider-thumb{appearance:none;width:13px;height:13px;margin-top:-4.5px;border-radius:50%;background:var(--t-panel);border:2px solid var(--t-accent-2)}
input[type=range]::-moz-range-thumb{width:11px;height:11px;border-radius:50%;background:var(--t-panel);border:2px solid var(--t-accent-2)}
input[type=range].locked::-webkit-slider-thumb{border-color:var(--t-lock)} input[type=range].locked::-moz-range-thumb{border-color:var(--t-lock)}
input[type=range]:focus-visible{outline:1px solid var(--t-accent-2);outline-offset:2px}
select,input[type=text]{background:var(--t-panel-2);color:var(--t-fg);border:1px solid var(--t-line);font-family:var(--t-mono);font-size:11px;padding:4px 6px;border-radius:3px;min-width:0}
.panel{background:var(--t-panel);border:1px solid var(--t-line);border-radius:5px;padding:9px 11px;display:grid;gap:7px;min-width:0;align-content:start}
.panel h2{margin:0;font-family:var(--t-disp);font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:var(--t-muted);font-weight:600}
/* track column */
.tracks{grid-area:trk;display:grid;gap:4px;align-content:start;grid-auto-rows:min-content}
@container dev (max-width:700px){.tracks{grid-template-columns:repeat(auto-fill,minmax(140px,1fr))}}
.trk{display:grid;grid-template-columns:20px 1fr 22px;align-items:center;gap:5px;background:var(--t-panel);border:1px solid var(--t-line);border-radius:4px;padding:4px 6px;cursor:pointer;min-height:38px}
.trk .num{font-size:9px;color:var(--t-muted);font-variant-numeric:tabular-nums}
.trk .nm{font-family:var(--t-disp);font-size:11px;letter-spacing:.06em;text-transform:uppercase;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.1}
.trk .nm small{display:block;font-family:var(--t-mono);font-size:9px;color:var(--t-muted);letter-spacing:.02em;text-transform:none;margin-top:2px}
.trk.sel{border-color:var(--t-accent);background:color-mix(in srgb,var(--t-accent) 12%,var(--t-panel))}
.trk.hit{box-shadow:inset 3px 0 0 var(--t-accent)}
.trk button.m{padding:2px 0;font-size:9px;letter-spacing:0;width:22px}
.trk button.m.on{background:var(--t-red);border-color:var(--t-red);color:#fff}
.trk.muted .nm{opacity:.5}
/* work surface */
.display{grid-area:disp;background:var(--t-screen);border:1px solid var(--t-line);border-radius:5px;padding:9px 12px;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:4px 14px;align-items:center}
/* displaytekst: cyaan, gemengd met de schermtekstkleur van de host, zodat hij ook op een licht of LCD-groen scherm leesbaar blijft */
.display .big{font-family:var(--t-disp);font-size:18px;letter-spacing:.1em;text-transform:uppercase;color:color-mix(in srgb,var(--t-accent-2) 50%,var(--well-fg,#38c6e0));white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.display .sub{color:var(--t-muted);font-size:10px;letter-spacing:.08em;text-transform:uppercase}
.display .lockinfo{grid-column:1/-1;color:var(--t-lock);font-size:10px;letter-spacing:.06em;text-transform:uppercase;min-height:13px}
.display .machine{display:flex;gap:8px;align-items:center;flex-wrap:wrap;justify-content:end}
.display .pages{grid-column:1/-1;display:flex;gap:4px;flex-wrap:wrap;padding-top:6px;border-top:1px solid var(--t-line)}
.pages button{flex:1;min-width:52px;padding:5px 6px}
.pages button.on{background:var(--t-accent-2);border-color:var(--t-accent-2);color:#04161b;font-weight:600}
.pages button.lk{flex:0 0 auto;min-width:70px} .pages button.lk.on{background:var(--t-lock);border-color:var(--t-lock);color:#1a0520}
.knobs{grid-area:knobs;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px 14px;background:var(--t-panel);border:1px solid var(--t-line);border-radius:5px;padding:10px 12px}
@container dev (max-width:560px){.knobs{grid-template-columns:repeat(2,minmax(0,1fr))}}
.knob{display:grid;gap:2px;min-width:0}
.knob .lab{display:flex;justify-content:space-between;gap:6px;font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:var(--t-muted);white-space:nowrap;overflow:hidden}
.knob .lab output{color:var(--t-fg);font-variant-numeric:tabular-nums;letter-spacing:0;text-transform:none;overflow:hidden;text-overflow:ellipsis}
.knob.locked .lab{color:var(--t-lock)}
.trigs{grid-area:trigs;display:grid;grid-template-columns:repeat(16,minmax(0,1fr));gap:5px;align-self:end}
@container dev (max-width:560px){.trigs{grid-template-columns:repeat(8,minmax(0,1fr))}}
.trig{aspect-ratio:1/1.2;border:1px solid var(--t-line);background:var(--t-panel-2);border-radius:3px;cursor:pointer;position:relative;padding:0 0 4px;display:grid;align-content:end;justify-items:center;gap:3px;min-width:0}
.trig .n{font-size:9px;color:var(--t-muted);font-variant-numeric:tabular-nums}
.trig .led{width:60%;height:5px;border-radius:2px;background:var(--t-line)}
.trig.q{background:var(--t-stepq)}
.trig.on .led{background:var(--t-accent);box-shadow:0 0 6px var(--t-accent)}
.trig.on.soft .led{background:#9a4a0e;box-shadow:none}
.trig.lock .led{background:var(--t-lock);box-shadow:0 0 6px var(--t-lock)}
.trig.cur{box-shadow:inset 0 0 0 2px var(--t-fg)}
.trig.sel{border-color:var(--t-lock);border-width:2px}
.trig.dead{opacity:.3}
.trig .flag{position:absolute;top:3px;left:0;right:0;text-align:center;font-size:8px;color:var(--t-accent-2);letter-spacing:0;white-space:nowrap;overflow:hidden}
.stepbar{grid-area:step;display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:6px 12px;background:var(--t-panel);border:1px solid var(--t-line);border-radius:5px;padding:8px 12px;align-items:center}
@container dev (max-width:900px){.stepbar{grid-template-columns:repeat(3,minmax(0,1fr))}}
@container dev (max-width:560px){.stepbar{grid-template-columns:repeat(2,minmax(0,1fr))}}
.stepbar .f{display:grid;grid-template-columns:auto minmax(0,1fr);gap:6px;align-items:center;font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:var(--t-muted);min-width:0}
.stepbar .f output{font-variant-numeric:tabular-nums;color:var(--t-fg);text-align:right}
.stepbar .f.three{grid-template-columns:auto minmax(0,1fr) 28px}
.stepbar select{width:100%}
/* side column */
.side{grid-area:side;display:grid;gap:10px;align-content:start;min-width:0}
.row{display:grid;grid-template-columns:78px minmax(0,1fr) 46px;gap:8px;align-items:center}
.row label{font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:var(--t-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.row output{text-align:right;font-variant-numeric:tabular-nums;font-size:11px}
.row.wide{grid-template-columns:78px minmax(0,1fr)}
.pats{display:flex;gap:4px;flex-wrap:wrap}
.pats button{min-width:30px;padding:5px 0;font-family:var(--t-mono);letter-spacing:0;flex:1}
.pats.actions button{flex:1 1 auto;padding:5px 6px;font-family:var(--t-disp);letter-spacing:.06em;font-size:10px}
.pats button.edit{border-color:var(--t-accent);color:var(--t-accent)} .pats button.play{background:color-mix(in srgb,var(--t-accent) 18%,var(--t-panel-2))}
.chain{letter-spacing:.2em;text-transform:uppercase;width:100%}
.note{color:var(--t-muted);font-size:10px;line-height:1.45}
.songrow{display:flex;gap:6px} .songrow input{flex:1;min-width:80px}
.songs{display:grid;gap:4px;max-height:132px;overflow:auto}
.song{display:flex;gap:6px;align-items:center;border:1px solid var(--t-line);padding:3px 6px;border-radius:3px;flex-wrap:wrap}
.song .nm{flex:1;min-width:70px;font-size:11px} .song .dt{color:var(--t-muted);font-size:9px}
.song button{font-size:9px;padding:3px 6px}
textarea{width:100%;background:var(--t-panel-2);color:var(--t-fg);border:1px solid var(--t-line);font-family:var(--t-mono);font-size:10px;padding:6px;resize:vertical;border-radius:3px}
details summary{cursor:pointer;color:var(--t-muted);font-size:10px}
details[open] summary{margin-bottom:6px}
kbd{border:1px solid var(--t-line);border-radius:3px;padding:0 4px;font-size:9px}
@media (prefers-reduced-motion:reduce){*{transition:none!important}}

:host{display:block}
.__body{container-type:inline-size;container-name:dev}
#play,.tp:has(#bpm){display:none}
.songrow,#songList{display:none}
.device{max-width:none}
`;
const __HTML = T => `<div class="device">
  <header>
    <div class="transport">
      <button class="fill" id="fill">Fill</button>
      <span class="tp">BPM <input type="number" id="bpm" min="40" max="200" value="124"></span>
      <span class="tp">Swing <input type="range" id="swing" min="50" max="80" value="54"><output id="swingOut">54</output></span>
      <span class="tp">Vol <input type="range" id="vol" min="0" max="1" step="0.01" value="0.7"></span>
    </div>
  </header>

  <div class="tracks" id="tracks"></div>

  <div class="display">
    <div><div class="big" id="dTrack">T1 · Kick</div><div class="sub" id="dPage">SYN · machine: BD Hard</div></div>
    <div class="machine"><label class="sub" for="machine">Machine</label><select id="machine"></select></div>
    <div class="lockinfo" id="dLock"></div>
    <div class="pages" id="pages">
      <button data-page="syn" class="on">SYN</button><button data-page="flt">FLT</button><button data-page="amp">AMP</button><button data-page="lfo">LFO</button><button data-page="fx">FX</button>
      <button class="lk" id="lockMode" title="${T.lockTitle}">P-lock</button>
    </div>
  </div>
  <div class="knobs" id="knobs"></div>
  <div class="trigs" id="trigs"></div>
  <div class="stepbar" id="stepbar">
    <div class="f three"><span>${T.length}</span><input type="range" id="tlen" min="1" max="16" value="16"><output id="tlenOut">16</output></div>
    <div class="f"><span>${T.note}</span><select id="snote"></select></div>
    <div class="f"><span>Cond.</span><select id="scond"></select></div>
    <div class="f"><span>Retrig</span><select id="sretrig"><option value="1">${T.off}</option><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="6">6</option><option value="8">8</option></select></div>
    <div class="f three"><span>Vel.</span><input type="range" id="svel" min="0.1" max="1" step="0.01" value="0.8"><output id="svelOut">80</output></div>
    <div class="f"><span>Micro</span><select id="smicro"><option value="-0.25">−¼</option><option value="-0.125">−⅛</option><option value="0" selected>0</option><option value="0.125">+⅛</option><option value="0.25">+¼</option></select></div>
    <div class="f three" style="grid-column:span 2;grid-template-columns:auto minmax(0,1fr) 38px"><span>${T.trkSwing}</span><input type="range" id="trkSwing" min="0" max="0.5" step="0.005" value="0" title="${T.swingTitle}"><output id="trkSwingOut">0%</output></div>
  </div>

  <div class="side">
    <div class="panel">
      <h2>${T.patSong}</h2>
      <div class="pats" id="pats"></div>
      <div class="row"><label for="patSwing" title="${T.swingTitle}">${T.patSwing}</label><input type="range" id="patSwing" min="0" max="0.5" step="0.005" value="0" title="${T.swingTitle}"><output id="patSwingOut">0%</output></div>
      <div class="row wide"><label for="chain">${T.chain}</label><input type="text" id="chain" class="chain" value="1" maxlength="48"></div>
      <div class="pats actions"><button id="patCopy">${T.copy}</button><button id="patClear">${T.clearTrigs}</button><button id="patRnd">${T.random}</button></div>
      <div class="note">${T.chainNote}</div>
    </div>
    <div class="panel">
      <h2>${T.fxSends}</h2>
      <div class="row"><label for="fxDrive">Overdrive</label><input type="range" id="fxDrive" min="0" max="1" step="0.01" value="0.25"><output>25%</output></div>
      <div class="row"><label for="fxCut">Filter</label><input type="range" id="fxCut" min="200" max="16000" step="10" value="9000"><output>9000 Hz</output></div>
      <div class="row"><label for="fxRes">Reso</label><input type="range" id="fxRes" min="0.3" max="12" step="0.1" value="1"><output>1.0</output></div>
      <div class="row"><label for="dlyTime">Delay</label><select id="dlyTime"><option value="0.75">3/16</option><option value="0.5">1/8</option><option value="1" selected>1/4</option><option value="1.5">3/8</option><option value="2">1/2</option></select><output></output></div>
      <div class="row"><label for="dlyFb">Feedback</label><input type="range" id="dlyFb" min="0" max="0.9" step="0.01" value="0.45"><output>45%</output></div>
      <div class="row"><label for="revSize">${T.reverb}</label><input type="range" id="revSize" min="0.3" max="8" step="0.1" value="3"><output>3.0 s</output></div>
    </div>
    <div class="panel">
      <h2>${T.songs}</h2>
      <div class="pats actions"><button id="demoNacht">${T.demoNight}</button><button id="demoBasis">${T.demoBasic}</button></div>
      <div class="songrow"><input type="text" id="songName" placeholder="${T.name}" maxlength="40"></div>
      <details><summary>${T.exportSum}</summary>
        <textarea id="songText" rows="3" spellcheck="false"></textarea>
        <div class="pats actions"><button id="songExport">${T.toText}</button><button id="songCopy">${T.copyText}</button><button id="songImport">${T.import}</button></div>
      </details>
    </div>
  </div>
</div>`;

function __ctxProxy(ctx, live) {
  // Same AudioContext, but every source node is remembered so destroy() can stop it.
  const C = { get currentTime() { return ctx.currentTime; }, get sampleRate() { return ctx.sampleRate; }, get state() { return ctx.state; }, resume: () => ctx.resume() };
  ['createGain', 'createBiquadFilter', 'createDelay', 'createConvolver', 'createDynamicsCompressor', 'createAnalyser', 'createStereoPanner', 'createWaveShaper', 'createBuffer', 'createChannelMerger', 'createChannelSplitter'].forEach(m => { if (ctx[m]) C[m] = (...a) => ctx[m](...a); });
  ['createOscillator', 'createBufferSource', 'createConstantSource'].forEach(m => { if (ctx[m]) C[m] = (...a) => { const n = ctx[m](...a); live.add(n); if (n.addEventListener) n.addEventListener('ended', () => live.delete(n)); return n; }; });
  return C;
}

export default {
  id: 'nl.patchkamer.groovebox12',
  name: 'Groovebox 12',
  version: '1.14.0',
  kind: 'instrument',
  category: 'groove',
  ui: { width: 1262 },
  i18n: { en: { ports: { out: 'Out', multi: 'Separate outs' } } },
  ports: { audioIn: [], audioOut: [{ id: 'out', name: 'Uit' }], eventIn: [], eventOut: [], modIn: [{ id: 'mod', name: 'Mod' }], multiOut: [{ id: 'multi', name: 'Losse uit' }] },
  create(ctx0, host) {
    const TX = TXT[host && host.lang] || TXT.en;
    const live = new Set(), ctx = __ctxProxy(ctx0, live), OUT = ctx0.createGain();
    // Uitgangsniveau: gemeten met de standaardsong stond de piek op +3 dBFS (boven volle schaal); met deze trim op ongeveer −3 dBFS. De losse uitgangen (bundel) staan vóór deze trim.
    OUT.gain.value = 0.5;
    let api = null, pending = null;
    function __init(ROOT) {

const $=id=>ROOT.getElementById(id);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
// contract v1.22: regelaars en pads herkenbaar voor skins (alleen data-pk-*-attributen; een oudere host heeft geen adopt)
const adopt=(e,o)=>{ try{ if(e&&host&&host.ui&&typeof host.ui.adopt==='function') host.ui.adopt(e,o); }catch(x){ /* oudere host */ } return e; };
[['swing','g.swing','global','Swing'],['vol','g.vol','global','Vol'],['fxDrive','g.fxDrive','fx','Overdrive'],['fxCut','g.fxCut','fx','Filter'],['fxRes','g.fxRes','fx','Reso'],['dlyTime','g.dlyTime','fx','Delay'],['dlyFb','g.dlyFb','fx','Feedback'],['revSize','g.revSize','fx','Reverb'],['tlen','track.len','track',''],['trkSwing','track.swing','track',''],['patSwing','pattern.swing','pattern',''],['svel','step.vel','step','Vel.']].forEach(([el,id,group,label])=>{ const e=$(el); if(e&&e.type==='range') adopt(e,{id,role:'param',group,label:label||undefined}); else if(e&&e.tagName==='SELECT') adopt(e,{id,role:'select',group,label:label||undefined}); });
const STEPS=16, NT=12, NPAT=8;
const NOTE_NAMES=['C','C♯','D','E♭','E','F','F♯','G','A♭','A','B♭','B'];
const nname=m=>NOTE_NAMES[m%12]+(Math.floor(m/12)-1);
const mtof=m=>440*Math.pow(2,(m-69)/12);

// ---------- machines: each has 8 SYN params ----------
// param: [key, label, min, max, default, fmt]
const pct=v=>`${Math.round(v*100)}`, hz=v=>`${Math.round(v)}Hz`, sec=v=>`${(+v).toFixed(2)}s`, st=v=>`${v>0?'+':''}${Math.round(v)}`;
const MACH={
  bd:{name:'BD Hard',  syn:[['tun','Tune',30,120,52,hz],['dec','Decay',0.05,2,0.5,sec],['swt','Sweep t',0.005,0.3,0.04,sec],['swd','Sweep d',1,8,3.5,v=>`×${(+v).toFixed(1)}`],['clk','Click',0,1,0.4,pct],['noi','Noise',0,1,0.1,pct],['hrm','Harm',0,1,0.2,pct],['hld','Hold',0,0.3,0,sec]]},
  sd:{name:'SD Classic',syn:[['tun','Tune',100,500,190,hz],['dec','Decay',0.05,1.5,0.25,sec],['snp','Snap',0,1,0.6,pct],['ndc','Noise dec',0.05,1,0.2,sec],['ton','Tone',500,6000,1800,hz],['det','Detune',0,1,0.3,pct],['bdy','Body',0,1,0.5,pct],['hld','Hold',0,0.3,0,sec]]},
  rs:{name:'RS Hard',  syn:[['tun','Tune',400,3000,1700,hz],['dec','Decay',0.01,0.3,0.05,sec],['clk','Click',0,1,0.6,pct],['ton','Tone',0,1,0.5,pct],['rng','Ring',0,1,0.3,pct],['bdy','Body',0,1,0.4,pct],['spr','Spread',0,1,0.2,pct],['hld','Hold',0,0.2,0,sec]]},
  cp:{name:'CP Classic',syn:[['ton','Tone',500,4000,1400,hz],['dec','Decay',0.05,1.5,0.3,sec],['den','Density',1,6,4,v=>`${Math.round(v)}`],['spr','Spread',0.005,0.03,0.011,v=>`${Math.round(v*1000)}ms`],['rom','Room',0,1,0.3,pct],['bri','Bright',0,1,0.5,pct],['wid','Width',0.3,3,1.2,v=>(+v).toFixed(1)],['hld','Hold',0,0.3,0,sec]]},
  hh:{name:'HH Metallic',syn:[['tun','Tune',2000,12000,6500,hz],['dec','Decay',0.02,2,0.08,sec],['ton','Tone',0,1,0.5,pct],['met','Metal',0,1,0.5,pct],['noi','Noise',0,1,0.5,pct],['spr','Spread',0,1,0.3,pct],['shp','Shape',0,1,0.4,pct],['hld','Hold',0,0.3,0,sec]]},
  cy:{name:'CY Ride',  syn:[['tun','Tune',1500,9000,4000,hz],['dec','Decay',0.2,4,1.6,sec],['ton','Tone',0,1,0.5,pct],['met','Metal',0,1,0.6,pct],['bel','Bell',0,1,0.3,pct],['spr','Spread',0,1,0.5,pct],['shp','Shape',0,1,0.5,pct],['hld','Hold',0,0.5,0,sec]]},
  cb:{name:'CB Classic',syn:[['tun','Tune',300,1200,560,hz],['dec','Decay',0.05,1,0.25,sec],['rat','Ratio',1.1,2,1.48,v=>(+v).toFixed(2)],['ton','Tone',0,1,0.5,pct],['drv','Drive',0,1,0.3,pct],['shp','Shape',0,1,0.5,pct],['atk','Attack',0.001,0.1,0.002,sec],['hld','Hold',0,0.3,0,sec]]},
  tone:{name:'SY Tone',synth:true,syn:[['tun','Tune',-24,24,0,st],['wav','Wave',0,3,0,v=>['saw','sqr','tri','sin'][Math.round(v)]],['dec','Decay',0.05,4,0.4,sec],['atk','Attack',0.001,1,0.005,sec],['sub','Sub',0,1,0.3,pct],['pw','Shape',0,1,0.5,pct],['vib','Vibrato',0,1,0,pct],['gld','Glide',0,0.5,0,sec]]},
  chord:{name:'SY Chord',synth:true,syn:[['tun','Tune',-24,24,0,st],['typ','Chord',0,7,0,v=>['maj','min','maj7','min7','sus2','sus4','dim','5th'][Math.round(v)]],['dec','Decay',0.05,6,1.2,sec],['atk','Attack',0.001,2,0.02,sec],['spr','Spread',0,1,0.3,pct],['wav','Wave',0,3,0,v=>['saw','sqr','tri','sin'][Math.round(v)]],['vib','Vibrato',0,1,0.1,pct],['inv','Inversion',0,3,0,v=>`${Math.round(v)}`]]},
  dual:{name:'SY Dual VCO',synth:true,syn:[['tun','Tune',-24,24,-12,st],['int','Osc2',-24,24,7,st],['mix','Mix',0,1,0.5,pct],['wv1','Wave 1',0,3,0,v=>['saw','sqr','tri','sin'][Math.round(v)]],['wv2','Wave 2',0,3,1,v=>['saw','sqr','tri','sin'][Math.round(v)]],['dec','Decay',0.05,4,0.3,sec],['atk','Attack',0.001,1,0.002,sec],['det','Detune',0,1,0.2,pct]]},
  raw:{name:'SY Raw',synth:true,syn:[['tun','Tune',-24,24,0,st],['dec','Decay',0.05,4,0.6,sec],['noi','Noise',0,1,0.3,pct],['fld','Fold',0,1,0.5,pct],['ton','Tone',0,1,0.5,pct],['fm','FM',0,1,0.2,pct],['pw','Shape',0,1,0.3,pct],['hld','Hold',0,0.5,0,sec]]},
};
const PAGES={
  flt:[['typ','Type',0,2,0,v=>['LP','HP','BP'][Math.round(v)]],['cut','Cutoff',60,18000,18000,hz],['res','Reso',0.3,20,0.7,v=>(+v).toFixed(1)],['env','Env depth',-1,1,0,v=>`${Math.round(v*100)}`],['edc','Env decay',0.02,2,0.2,sec],['eat','Env attack',0.001,1,0.001,sec],['trk','Key track',0,1,0,pct],['hpf','HP base',20,2000,20,hz]],
  amp:[['atk','Attack',0.001,2,0.001,sec],['hld','Hold',0,2,0,sec],['dec','Decay',0.02,6,1,sec],['od','Overdrive',0,1,0,pct],['vol','Level',0,1,0.8,pct],['pan','Pan',-1,1,0,v=>Math.abs(v)<0.03?'C':(v<0?`L${Math.round(-v*100)}`:`R${Math.round(v*100)}`)],['acc','Accent',0,1,0.5,pct],['vel','Vel→vol',0,1,1,pct]],
  lfo:[['spd','Speed',0.05,20,2,v=>`${(+v).toFixed(2)}Hz`],['dep','Depth',0,1,0,pct],['dst','Dest',0,3,0,v=>['cut','pitch','pan','vol'][Math.round(v)]],['wav','Wave',0,3,0,v=>['sin','tri','sqr','rnd'][Math.round(v)]],['fad','Fade',0,2,0,sec],['mod','Mode',0,1,0,v=>['free','trig'][Math.round(v)]],['ph','Phase',0,1,0,pct],['mul','Sync',0,1,0,v=>['Hz','bpm'][Math.round(v)]]],
  fx:[['dly','Delay send',0,1,0,pct],['rev','Reverb send',0,1,0.15,pct],['blk',TX.fxBlock,0,1,0,v=>[TX.off,TX.on][Math.round(v)]],['dlw','Delay HP',40,4000,200,hz],['rvt','Reverb tone',200,12000,5000,hz],['cho','Chorus',0,1,0,pct],['wid','Width',0,1,0.5,pct],['_','—',0,1,0,()=>'']]
};
const CONDS=['—','1:2','2:2','1:4','2:4','3:4','4:4','1:8','5:8','25%','50%','75%','FILL','!FILL','1st','!1st'];
const DEFAULT_MACH=['bd','sd','rs','cp','hh','hh','cy','cb','tone','chord','dual','raw'];
const DEFAULT_NAMES=['Kick','Snare','Rim','Clap','HH closed','HH open','Ride','Cowbell','Tone','Chord','Bass','Raw'];

function defaults(page,mach){const src=page==='syn'?MACH[mach].syn:PAGES[page]; const o={}; src.forEach(([k,,,,d])=>o[k]=d); return o;}
function newStep(){return {on:0,vel:0.8,note:48,cond:0,retrig:1,micro:0,lock:{}};}
function newTrack(i){
  const m=DEFAULT_MACH[i], t={machine:m,name:DEFAULT_NAMES[i],len:16,mute:false,swing:0,steps:Array.from({length:STEPS},newStep),
    syn:defaults('syn',m),flt:defaults('flt'),amp:defaults('amp'),lfo:defaults('lfo'),fx:defaults('fx')};
  if(i===5){t.syn.dec=0.5;} if(i===8){t.amp.dec=0.3;t.flt.cut=1200;t.flt.env=0.6;t.flt.res=6;} if(i===9){t.fx.rev=0.5;t.flt.cut=3000;} if(i===10){t.flt.cut=600;t.flt.env=0.5;t.flt.res=4;t.amp.dec=0.4;} if(i===11){t.flt.cut=4000;t.amp.dec=0.4;}
  return t;
}
function newPattern(){return {tracks:Array.from({length:NT},(_,i)=>newTrack(i)),bpm:null,swing:0};}
let pats=Array.from({length:NPAT},newPattern), curPat=0, playPat=-1, curTrack=0, page='syn', lockMode=false, selStep=-1;
const G={bpm:124,swing:54,vol:0.7,fxDrive:0.25,fxCut:9000,fxRes:1,dlyTime:1,dlyFb:0.45,revSize:3,chain:'1'};
const P=()=>pats[curPat], T=()=>P().tracks[curTrack], PP=()=>pats[playPat>=0?playPat:curPat];  // PP = the pattern the clock is playing

// ---------- controle van state (contract §13): alles binnen het bereik, ongeldig = standaard, ontbrekend wordt aangevuld ----------
const num=(v,a,b,d)=>typeof v==='number'&&Number.isFinite(v)?clamp(v,a,b):d;
const int=(v,a,b,d)=>Math.round(num(v,a,b,d));
const PAGE_KEYS=['syn','flt','amp','lfo','fx'];
const specList=(pg,mach)=>pg==='syn'?MACH[mach].syn:PAGES[pg];
const GSPEC={bpm:[20,300],swing:[50,80],vol:[0,1],fxDrive:[0,1],fxCut:[200,16000],fxRes:[0.3,12],dlyTime:[0.25,2],dlyFb:[0,0.9],revSize:[0.3,8]};
function cleanParams(pg,mach,src){const out={}; specList(pg,mach).forEach(([k,,mn,mx,d])=>{out[k]=num(src&&src[k],mn,mx,d);}); return out;}
function cleanStep(x,mach){const s=newStep(); if(!x||typeof x!=='object') return s;
  s.on=x.on===1||x.on===true?1:0; s.vel=num(x.vel,0,1,0.8); s.note=int(x.note,0,127,48); s.cond=int(x.cond,0,CONDS.length-1,0); s.retrig=int(x.retrig,1,8,1); s.micro=num(x.micro,-0.5,0.5,0);
  if(x.lock&&typeof x.lock==='object') PAGE_KEYS.forEach(pg=>{const l=x.lock[pg]; if(l&&typeof l==='object'){const o={}; specList(pg,mach).forEach(([k,,mn,mx])=>{if(k!=='_'&&typeof l[k]==='number'&&Number.isFinite(l[k])) o[k]=clamp(l[k],mn,mx);}); if(Object.keys(o).length) s.lock[pg]=o;}});
  return s;}
function cleanTrack(x,i){const d=newTrack(i); if(!x||typeof x!=='object') return d;
  const m=typeof x.machine==='string'&&Object.prototype.hasOwnProperty.call(MACH,x.machine)?x.machine:d.machine;
  return {machine:m,name:typeof x.name==='string'?x.name.slice(0,40):d.name,len:int(x.len,1,STEPS,STEPS),mute:x.mute===true,swing:num(x.swing,0,0.5,0),
    steps:Array.from({length:STEPS},(_,k)=>cleanStep(Array.isArray(x.steps)?x.steps[k]:null,m)),
    syn:cleanParams('syn',m,x.syn),flt:cleanParams('flt',m,x.flt),amp:cleanParams('amp',m,x.amp),lfo:cleanParams('lfo',m,x.lfo),fx:cleanParams('fx',m,x.fx)};}
function cleanPattern(p){return {tracks:Array.from({length:NT},(_,i)=>cleanTrack(p&&Array.isArray(p.tracks)?p.tracks[i]:null,i)),bpm:null,swing:num(p&&p.swing,0,0.5,0)};}
function cleanG(g){if(!g||typeof g!=='object') return; for(const k in GSPEC) if(typeof g[k]==='number'&&Number.isFinite(g[k])) G[k]=clamp(g[k],GSPEC[k][0],GSPEC[k][1]); if(typeof g.chain==='string') G.chain=g.chain.replace(/[^1-8 ]/g,'').slice(0,48);}

// ---------- built-in demo songs ----------
function demoBasis(){
  const ps=Array.from({length:NPAT},newPattern), tr=ps[0].tracks; const set=(ti,arr,vel)=>arr.forEach(st=>{tr[ti].steps[st].on=1; if(vel) tr[ti].steps[st].vel=vel;});
  set(0,[0,4,8,12],1); set(1,[4,12]); set(3,[4,12],0.6); set(4,[0,2,4,6,8,10,12,14],0.7); set(5,[2,6,10,14],0.5); tr[5].steps[14].cond=9;
  set(2,[3,7,11,15],0.5); tr[2].steps[15].retrig=3; tr[2].steps[7].cond=11; set(7,[10],0.5); tr[7].steps[10].cond=1; tr[7].len=12;
  set(10,[0,3,6,10,12,14]); [36,36,43,36,39,41].forEach((n,i)=>tr[10].steps[[0,3,6,10,12,14][i]].note=n); tr[10].steps[6].lock={flt:{cut:2400}};
  set(9,[0],0.7); tr[9].steps[0].note=48; set(8,[2,6,9,13],0.6); [60,63,67,70].forEach((n,i)=>tr[8].steps[[2,6,9,13][i]].note=n); tr[8].len=14; tr[8].fx.dly=0.4;
  set(11,[8],0.7); tr[11].steps[8].cond=5; tr[11].steps[8].note=36;
  ps[1]=JSON.parse(JSON.stringify(ps[0])); ps[1].tracks[0].steps[14].on=1; ps[1].tracks[0].steps[14].vel=0.5;
  return {G:{bpm:124,swing:54,vol:0.7,fxDrive:0.25,fxCut:9000,fxRes:1,dlyTime:1,dlyFb:0.45,revSize:3,chain:'1 1 1 2'},pats:ps};
}
// "Night City": deep techno in D minor with cinematic pads, a horn motif and brass hits.
function demoNight(){
  const ps=Array.from({length:NPAT},newPattern);
  const CHORD=[62,58,65,60], CTYPE=[1,0,0,0], BASS=[38,34,41,36], ARP=[[62,65,69,74],[58,62,65,70],[65,69,72,77],[60,64,67,72]];
  const HORN=[[[0,62,0.7]],[[0,65,0.7]],[[0,69,0.7],[12,67,0.55]],[[0,64,0.7],[10,62,0.5]]];
  const setup=tr=>{
    const cfg=(i,name,machine,syn,flt,amp,lfo,fx)=>{const t=tr[i]; t.name=name; t.machine=machine; t.syn={...defaults('syn',machine),...syn}; Object.assign(t.flt,flt); Object.assign(t.amp,amp); Object.assign(t.lfo,lfo||{}); Object.assign(t.fx,fx||{});};
    cfg(0,'Kick','bd',{tun:48,dec:0.55,swt:0.035,swd:4,clk:0.5,noi:0.05,hrm:0.25},{},{dec:0.6,od:0.15,vol:0.95},{},{rev:0.05});
    cfg(1,'Snare','sd',{tun:180,dec:0.3,snp:0.7,ndc:0.35,ton:1500},{},{vol:0.6},{},{rev:0.5,dly:0.2});
    cfg(2,'Rim','rs',{},{},{vol:0.5,pan:0.3},{},{dly:0.35,rev:0.2});
    cfg(3,'Clap','cp',{dec:0.5,rom:0.5},{},{vol:0.55,pan:-0.2},{},{rev:0.55});
    cfg(4,'HH closed','hh',{tun:7000,dec:0.06,met:0.4,noi:0.6},{},{vol:0.55,pan:0.25},{},{dly:0.15});
    cfg(5,'HH open','hh',{tun:6000,dec:0.45,met:0.5,noi:0.5},{},{vol:0.45,pan:-0.3},{},{rev:0.3});
    cfg(6,'Horn','dual',{tun:0,int:12,mix:0.5,wv1:0,wv2:0,det:0.35,dec:2.2,atk:0.25},{cut:900,res:2,env:0.35,edc:1.5,eat:0.3},{atk:0.3,dec:2.5,vol:0.55},{dst:0,spd:0.3,dep:0.2},{rev:0.6,dly:0.3});
    cfg(7,'Perc','cb',{tun:330,rat:1.33,dec:0.12,drv:0.5,ton:0.3},{},{vol:0.35,pan:0.45},{},{dly:0.3});
    cfg(8,'Arp','tone',{wav:0,dec:0.22,atk:0.002,sub:0.2,pw:0.3},{cut:1800,res:6,env:0.5,edc:0.18},{dec:0.25,vol:0.5,pan:-0.15},{dst:0,spd:0.1,dep:0.25},{dly:0.45,rev:0.35});
    cfg(9,'Pad','chord',{wav:0,dec:5,atk:1.2,spr:0.5,vib:0.15},{cut:1400,res:1.5,env:0.2,edc:2},{atk:1.5,hld:0.5,dec:4,vol:0.5},{dst:0,spd:0.15,dep:0.3},{rev:0.7,dly:0.25});
    cfg(10,'Bas','dual',{tun:0,int:0,mix:0.4,wv1:0,wv2:1,det:0.15,dec:0.3,atk:0.002},{cut:420,res:6,env:0.55,edc:0.14},{dec:0.3,vol:0.85,od:0.2},{},{blk:1});
    cfg(11,'Blast','raw',{tun:0,dec:2.5,noi:0.15,fld:0.7,ton:0.45,fm:0.25,pw:0.6,hld:0.4},{cut:700,res:3,env:0.45,edc:1.6,eat:0.15},{atk:0.05,hld:0.3,dec:3,vol:0.7},{},{rev:0.6,dly:0.2});
  };
  const on=(t,st,vel,extra)=>{const s=t.steps[st]; s.on=1; s.vel=vel; if(extra) Object.assign(s,extra); return s;};
  ps.forEach((pat,i)=>{
    const tr=pat.tracks; setup(tr);
    const c=[0,1,0,1,2,3,0,1][i], intro=i<2, climax=i>=6;
    // pad: one chord per bar
    tr[9].syn.typ=CTYPE[c]; on(tr[9],0,intro?0.6:0.75,{note:CHORD[c]});
    // bass
    const bassSteps=intro?[2,6,10,14]:[2,3,6,7,10,11,14,15];
    bassSteps.forEach((st,k)=>{const s=on(tr[10],st,intro?0.5:(st%4===2?0.9:0.55),{note:BASS[c]}); if(intro) s.lock={flt:{cut:240}}; if(!intro&&st===14) s.lock={flt:{cut:900}}; if(!intro&&st===15) s.lock={flt:{cut:1400},amp:{vol:0.7}};});
    // drums
    if(!intro){
      [0,4,8,12].forEach(st=>on(tr[0],st,1)); if(climax) on(tr[0],14,0.5,{cond:9});
      [4,12].forEach(st=>on(tr[3],st,0.6));
      for(let st=0;st<16;st++){ if(st%4===3) continue; on(tr[4],st,st%4===2?0.85:0.4); }
      [2,6,10,14].forEach(st=>on(tr[5],st,0.55));
      on(tr[2],7,0.4,{cond:10,retrig:2}); on(tr[2],11,0.4,{cond:1}); on(tr[2],15,0.35,{cond:9,retrig:3});
      [5,13].forEach(st=>on(tr[7],st,0.45,{cond:5}));
      if(i===5) on(tr[1],12,0.65,{cond:6,lock:{syn:{ndc:0.8}}});
    } else {
      [2,6,10,14].forEach(st=>on(tr[4],st,0.3)); on(tr[2],7,0.35,{cond:10}); on(tr[2],15,0.3,{cond:9});
    }
    // horn motif (not in intro); an octave up in the climax via p-lock
    if(!intro) HORN[c].forEach(([st,note,vel])=>{const s=on(tr[6],st,climax?vel+0.15:vel,{note}); if(climax) s.lock={syn:{tun:12}};});
    // arpeggio in climax
    if(climax) for(let st=0;st<16;st++) on(tr[8],st,st%2?0.5:0.75,{note:ARP[c][st%4]+(st>=8?12:0)});
    // brass hits on the downbeat of D-minor bars
    if(c===0&&(i===0||i===2||i===6)) on(tr[11],0,intro?0.55:0.75,{note:38,cond:i===2?1:0});
    tr[2].len=16; tr[7].len=i>=2?12:16;
  });
  return {G:{bpm:122,swing:53,vol:0.7,fxDrive:0.35,fxCut:7000,fxRes:1.5,dlyTime:0.75,dlyFb:0.5,revSize:5,chain:'1212 3456 3456 7856 3456 1212'},pats:ps};
}
{const d=demoNight(); Object.assign(G,d.G); pats=d.pats;}

// ---------- audio ----------
let A=null, running=false, fillOn=false;
function mkNoise(){const len=ctx.sampleRate*2,b=ctx.createBuffer(1,len,ctx.sampleRate),d=b.getChannelData(0);for(let i=0;i<len;i++)d[i]=Math.random()*2-1;const s=ctx.createBufferSource();s.buffer=b;s.loop=true;return s;}
let noiseBuf=null; function noiseSrc(){if(!noiseBuf){const len=ctx.sampleRate*2;noiseBuf=ctx.createBuffer(1,len,ctx.sampleRate);const d=noiseBuf.getChannelData(0);for(let i=0;i<len;i++)d[i]=Math.random()*2-1;} const s=ctx.createBufferSource(); s.buffer=noiseBuf; s.loop=true; s.loopStart=Math.random(); return s;}
function mkImpulse(sec,tone){const len=Math.floor(ctx.sampleRate*sec),b=ctx.createBuffer(2,len,ctx.sampleRate);for(let c=0;c<2;c++){const d=b.getChannelData(c);let lp=0;const k=Math.min(1,tone/12000);for(let i=0;i<len;i++){const w=(Math.random()*2-1)*Math.pow(1-i/len,2.5);lp+=k*(w-lp);d[i]=lp;}}return b;}
function curve(k){const n=1024,c=new Float32Array(n),a=k*40;for(let i=0;i<n;i++){const x=i*2/n-1;c[i]=a>0?((1+a)*x)/(1+a*Math.abs(x)):x;}return c;}
function foldCurve(k){const n=2048,c=new Float32Array(n),g=1+k*6;for(let i=0;i<n;i++){let x=(i*2/n-1)*g;x=Math.sin(x*Math.PI/2);c[i]=x;}return c;}
const WAVES=['sawtooth','square','triangle','sine'];

function build(){
  const t=ctx.currentTime; A={};
  A.master=ctx.createGain(); A.master.gain.value=G.vol; A.comp=ctx.createDynamicsCompressor(); A.comp.threshold.value=-14; A.comp.ratio.value=4; A.comp.release.value=0.15;
  A.master.connect(A.comp).connect(OUT);
  // analog-style FX block: drive -> LP
  A.fxIn=ctx.createGain(); A.fxDrv=ctx.createWaveShaper(); A.fxDrv.oversample='2x'; A.fxLp=ctx.createBiquadFilter(); A.fxLp.type='lowpass';
  A.fxIn.connect(A.fxDrv).connect(A.fxLp).connect(A.master);
  // delay
  A.dly=ctx.createDelay(3); A.dlyFb=ctx.createGain(); A.dlyHp=ctx.createBiquadFilter(); A.dlyHp.type='highpass'; A.dlyHp.frequency.value=200; A.dlyLp=ctx.createBiquadFilter(); A.dlyLp.type='lowpass'; A.dlyLp.frequency.value=5000;
  A.dlyIn=ctx.createGain(); A.dlyIn.connect(A.dlyHp).connect(A.dly).connect(A.dlyLp).connect(A.dlyFb).connect(A.dly); A.dlyLp.connect(A.master);
  // reverb
  A.rev=ctx.createConvolver(); A.revIn=ctx.createGain(); A.revIn.connect(A.rev).connect(A.master); A.revTone=5000;
  // track strips
  A.tr=Array.from({length:NT},()=>{
    const s={};
    s.in=ctx.createGain();
    s.flt=ctx.createBiquadFilter(); s.hp=ctx.createBiquadFilter(); s.hp.type='highpass'; s.hp.frequency.value=20;
    s.od=ctx.createWaveShaper(); s.od.oversample='2x'; s.od.curve=null;
    s.lfoVol=ctx.createGain(); s.lfoVol.gain.value=1;
    s.vol=ctx.createGain(); s.pan=ctx.createStereoPanner();
    s.in.connect(s.hp).connect(s.flt).connect(s.od).connect(s.lfoVol).connect(s.vol).connect(s.pan);
    s.toMaster=ctx.createGain(); s.toFx=ctx.createGain(); s.toFx.gain.value=0; s.pan.connect(s.toMaster).connect(A.master); s.pan.connect(s.toFx).connect(A.fxIn);
    s.dly=ctx.createGain(); s.rev=ctx.createGain(); s.pan.connect(s.dly).connect(A.dlyIn); s.pan.connect(s.rev).connect(A.revIn);
    // LFO
    s.lfo=ctx.createOscillator(); s.lfo.start(t); s.lfoG=ctx.createGain(); s.lfoG.gain.value=0; s.lfo.connect(s.lfoG);
    s.lfoDst=-1; s.lfoFade=ctx.createGain(); s.lfoFade.gain.value=1;
    s.pitchMod=ctx.createGain(); s.pitchMod.gain.value=0; // fan-out target for synth osc detune
    s.lastFreq=110;
    return s;
  });
  applyGlobal(); for(let i=0;i<NT;i++) applyTrack(i);
}
const GM={}, MODX={};   // modulatie op de globale regelaars ('vol' …) en op de swing-regelaars ('t1.swing', 'patSwing.1'): −1..1
const GLOG={fxCut:true};
const gv=k=>{ const o=GM[k]; if(!o) return G[k]; const [mn,mx]=GSPEC[k]; return GLOG[k]?clamp(G[k]*Math.pow(mx/mn,o),mn,mx):clamp(G[k]+o*(mx-mn),mn,mx); };
const swv=(id,b)=>{ const o=MODX[id]; return o?clamp(b+o*0.5,0,0.5):b; };
function applyGlobal(){
  if(!A) return; const t=ctx.currentTime, r=0.03;
  A.master.gain.setTargetAtTime(gv('vol'),t,r);
  A.fxDrv.curve=curve(gv('fxDrive')); A.fxLp.frequency.setTargetAtTime(gv('fxCut'),t,r); A.fxLp.Q.setTargetAtTime(gv('fxRes'),t,r);
  A.dly.delayTime.setTargetAtTime(Math.min(2.9,60/G.bpm*gv('dlyTime')),t,r); A.dlyFb.gain.setTargetAtTime(gv('dlyFb'),t,r);
  if(Math.abs((A.revSize||0)-G.revSize)>0.05){A.rev.buffer=mkImpulse(G.revSize,A.revTone); A.revSize=G.revSize;}
}
function applyTrack(i,fromStep){
  if(!A) return; const t=ctx.currentTime, r=0.02, tr=PP().tracks[i], s=A.tr[i], p=fromStep||mergedParams(tr,null,i);
  const F=p.flt, M=p.amp, L=p.lfo, X=p.fx;
  s.flt.type=['lowpass','highpass','bandpass'][Math.round(F.typ)];
  if(!s.envBusy){s.flt.frequency.setTargetAtTime(F.cut,t,r);} s.flt.Q.setTargetAtTime(F.res,t,r);
  s.hp.frequency.setTargetAtTime(F.hpf,t,r);
  s.od.curve=M.od>0?curve(M.od):null;
  s.vol.gain.setTargetAtTime(tr.mute?0:M.vol,t,r); s.pan.pan.setTargetAtTime(M.pan,t,r);
  s.toMaster.gain.setTargetAtTime(X.blk>0.5?0:1,t,r); s.toFx.gain.setTargetAtTime(X.blk>0.5?1:0,t,r);
  s.dly.gain.setTargetAtTime(X.dly*0.8,t,r); s.rev.gain.setTargetAtTime(X.rev*0.9,t,r);
  A.dlyHp.frequency.setTargetAtTime(X.dlw,t,r);
  // LFO routing
  s.lfo.type=['sine','triangle','square','sawtooth'][Math.round(L.wav)];
  s.lfo.frequency.setTargetAtTime(L.mul>0.5?G.bpm/60*L.spd/4:L.spd,t,r);
  const dst=Math.round(L.dst);
  if(dst!==s.lfoDst){try{s.lfoG.disconnect()}catch(e){} s.lfoVol.gain.setTargetAtTime(1,t,r); s.pan.pan.setTargetAtTime(M.pan,t,r);
    if(dst===0) s.lfoG.connect(s.flt.frequency); else if(dst===1) s.lfoG.connect(s.pitchMod); else if(dst===2) s.lfoG.connect(s.pan.pan); else s.lfoG.connect(s.lfoVol.gain); s.lfoDst=dst;}
  const depth=[F.cut*0.9,1200,1,0.9][dst]*L.dep; s.lfoG.gain.setTargetAtTime(depth,t,r);
  s.pitchMod.gain.value=1;
}
// ---------- sturing (contract v1.3): per track acht parameters, bovenop knoppen en p-locks ----------
// [pagina, sleutel, naam, rol, voorgesteld bereik, standaard aan]
const MODK=[['syn','tun','Tune','pitch',0.03,true],['syn','dec','Decay','decay',0.12,true],['flt','cut','Cutoff','filter',0.08,true],['flt','res','Reso','res',0.10,false],
  ['amp','vol','Level','level',0.06,false],['amp','pan','Pan','pan',0.12,false],['fx','dly','Delay send','send',0.10,false],['fx','rev','Reverb send','send',0.10,false]];
const MODT=Array.from({length:NT},()=>({}));   // track -> {'flt.cut': -1..1}
const specOf=(pg,key,mach)=>{ const L=pg==='syn'?MACH[mach].syn:PAGES[pg]; return L&&L.find(x=>x[0]===key); };
const isLog=(pg,key,sp)=>(pg==='syn'&&key==='dec')||(pg==='flt'&&key==='cut')||(pg==='syn'&&key==='tun'&&sp[2]>0);   // tune in Hz (drums) logaritmisch, in halve tonen (synths) lineair
function modApplyTo(out,i,mach){ const m=MODT[i]; for(const k in m){ const [pg,key]=k.split('.'); const sp=specOf(pg,key,mach); if(!sp||!(key in out[pg])) continue; const mn=sp[2], mx=sp[3], o=m[k];
  out[pg][key]=isLog(pg,key,sp)?clamp(out[pg][key]*Math.pow(mx/mn,o),mn,mx):clamp(out[pg][key]+o*(mx-mn),mn,mx); } }
function mergedParams(tr,step,i){   // track params with this step's p-locks applied, then modulation
  const out={syn:{...tr.syn},flt:{...tr.flt},amp:{...tr.amp},lfo:{...tr.lfo},fx:{...tr.fx}};
  if(step&&step.lock) Object.keys(step.lock).forEach(pg=>Object.assign(out[pg],step.lock[pg]));
  if(i!==undefined) modApplyTo(out,i,tr.machine);
  return out;
}
// lichte update tussen de slagen door: alleen wat continu klinkt (filter, niveau, pan, sends)
function applyTrackMod(i){ if(!A) return; const t=ctx.currentTime, r=0.05, tr=PP().tracks[i], s=A.tr[i], p=mergedParams(tr,null,i), F=p.flt, M=p.amp, X=p.fx;
  if(!s.envBusy) s.flt.frequency.setTargetAtTime(F.cut,t,r); s.flt.Q.setTargetAtTime(F.res,t,r);
  s.vol.gain.setTargetAtTime(tr.mute?0:M.vol,t,r); s.pan.pan.setTargetAtTime(M.pan,t,r); s.dly.gain.setTargetAtTime(X.dly*0.8,t,r); s.rev.gain.setTargetAtTime(X.rev*0.9,t,r); }
const DISC=['typ','wav','dst','wv1','wv2','inv','mod','mul','blk','den','_'];   // keuzes en schakelaars: bewust niet bestuurbaar
const PGNAME={syn:'Synth',flt:'Filter',amp:'Amp',lfo:'LFO',fx:'FX'};
const ROLE={tun:'pitch',dec:'decay',cut:'filter',res:'res',vol:'level',pan:'pan',dly:'send',rev:'send',hld:'env',atk:'attack',eat:'attack',edc:'decay',env:'env',od:'drive',acc:'accent',vel:'level',spd:'rate',dep:'depth',fad:'env',ph:'phase',trk:'param',hpf:'filter',dlw:'filter',rvt:'filter',cho:'mix',wid:'param'};
const GLOB=[['vol','Level','level'],['swing','Swing','swing'],['fxDrive','FX drive','drive'],['fxCut','FX cutoff','filter'],['fxRes','FX reso','res'],['dlyTime','Delay time','time'],['dlyFb','Delay feedback','level']];
function modParams(){ const L=[]; P().tracks.forEach((tr,i)=>{ MODK.forEach(([pg,key,name,role,drift,on])=>{ const sp=specOf(pg,key,tr.machine); if(!sp) return;
    L.push({id:`t${i+1}.${pg}.${key}`,name,lane:'t'+(i+1),laneName:`${i+1} · ${tr.name}`,min:sp[2],max:sp[3],role,scale:isLog(pg,key,sp)?'log':'lin',drift,on}); });
  ['syn','flt','amp','lfo','fx'].forEach(pg=>{ specList(pg,tr.machine).forEach(sp=>{ const key=sp[0]; if(DISC.includes(key)||MODK.some(m=>m[0]===pg&&m[1]===key)) return;
    L.push({id:`t${i+1}.${pg}.${key}`,name:sp[1],lane:`t${i+1}.${pg}`,laneName:`${i+1} · ${tr.name} · ${PGNAME[pg]}`,min:sp[2],max:sp[3],role:ROLE[key]||'param',scale:isLog(pg,key,sp)?'log':'lin',drift:0.05,on:false}); }); });
  L.push({id:`t${i+1}.swing`,name:TX.trkSwing,lane:`t${i+1}.swing`,laneName:`${i+1} · ${tr.name} · Swing`,min:0,max:0.5,role:'swing',scale:'lin',drift:0.05,on:false}); });
  for(let p=1;p<=NPAT;p++) L.push({id:`p${p}.swing`,name:TX.patSwing+' '+p,lane:'swing',laneName:'Swing',min:0,max:0.5,role:'swing',scale:'lin',drift:0.05,on:false});
  GLOB.forEach(([k,name,role])=>L.push({id:'g.'+k,name,lane:'global',laneName:'Global',min:GSPEC[k][0],max:GSPEC[k][1],role,scale:GLOG[k]?'log':'lin',drift:0.05,on:false}));
  return L; }
function modulateAll(o){ const was=MODT.map(m=>Object.keys(m).length>0), wasG=Object.keys(GM).length>0; MODT.forEach(m=>{ for(const k in m) delete m[k]; }); for(const k in GM) delete GM[k]; for(const k in MODX) delete MODX[k];
  for(const id in o||{}){ if(typeof o[id]!=='number'||!Number.isFinite(o[id])) continue; const v=clamp(o[id],-1,1);
    let mm=/^t(\d+)\.(syn|flt|amp|lfo|fx)\.(\w+)$/.exec(id); if(mm){ const i=+mm[1]-1; if(i>=0&&i<NT) MODT[i][mm[2]+'.'+mm[3]]=v; continue; }
    mm=/^g\.(\w+)$/.exec(id); if(mm){ if(GLOB.some(g=>g[0]===mm[1])) GM[mm[1]]=v; continue; }
    mm=/^t(\d+)\.swing$/.exec(id); if(mm){ const i=+mm[1]-1; if(i>=0&&i<NT) MODX[id]=v; continue; }
    mm=/^p(\d+)\.swing$/.exec(id); if(mm){ const p=+mm[1]; if(p>=1&&p<=NPAT) MODX[id]=v; } }
  for(let i=0;i<NT;i++) if(was[i]||Object.keys(MODT[i]).length) applyTrackMod(i);
  if(wasG||Object.keys(GM).length) applyGlobal(); }
let modSig='';
function notifyParams(){ const sig=P().tracks.map(tr=>tr.machine+':'+tr.name).join('|'); if(sig===modSig) return; const first=!modSig; modSig=sig; try{ host.bundleChanged&&host.bundleChanged(INST,'multi'); }catch(e){} if(!first){ try{ host.paramsChanged&&host.paramsChanged(INST); }catch(e){} } }

// ---------- voices ----------
function env(param,t,lvl,atk,hold,dec,floor){param.cancelScheduledValues(t); param.setValueAtTime(floor||0.0001,t); param.linearRampToValueAtTime(lvl,t+atk); param.setValueAtTime(lvl,t+atk+hold); param.setTargetAtTime(floor||0.0001,t+atk+hold,dec/4);}
function trig(pat,i,t,step,vel){
  const tr=pat.tracks[i], s=A.tr[i], p=mergedParams(tr,step,i), S=p.syn, M=p.amp, F=p.flt, m=tr.machine, out=s.in;
  const acc=vel>0.9?1+M.acc*0.6:1, v=(1-M.vel*(1-vel))*acc;
  if(fillOn&&vel>0.9) {}
  // filter envelope (per trig, with attack)
  if(F.env!==0){const base=F.cut*(F.trk>0?Math.pow(mtof(step?step.note:48)/130.81,F.trk*0.5):1), peak=clamp(base*Math.pow(2,F.env*5),40,18000);
    s.flt.frequency.cancelScheduledValues(t); s.flt.frequency.setValueAtTime(base,t); s.flt.frequency.linearRampToValueAtTime(peak,t+F.eat); s.flt.frequency.setTargetAtTime(base,t+F.eat,F.edc/4); s.envBusy=true; setTimeout(()=>s.envBusy=false,(t-ctx.currentTime+F.eat+F.edc)*1000);}
  if(p.lfo.mod>0.5&&p.lfo.dep>0){s.lfoFade.gain.cancelScheduledValues(t);}
  const ampG=ctx.createGain(); ampG.connect(out); const dur=M.atk+M.hld+M.dec*1.2+0.1;
  const end=t+Math.min(dur,8);
  if(m==='bd'){
    const o=ctx.createOscillator(), g=ctx.createGain(); o.type=S.hrm>0.5?'triangle':'sine';
    o.frequency.setValueAtTime(S.tun*S.swd,t); o.frequency.exponentialRampToValueAtTime(S.tun,t+S.swt);
    env(g.gain,t,v*1.1,0.001,S.hld,S.dec); o.connect(g).connect(ampG); o.start(t); o.stop(t+S.hld+S.dec*1.5+0.05);
    if(S.hrm>0){const sh=ctx.createWaveShaper(); sh.curve=curve(S.hrm*0.8); g.disconnect(); g.connect(sh).connect(ampG);}
    if(S.clk>0){const c=ctx.createOscillator(), cg=ctx.createGain(); c.type='square'; c.frequency.setValueAtTime(900+S.clk*2500,t); c.frequency.exponentialRampToValueAtTime(80,t+0.02); cg.gain.setValueAtTime(v*S.clk*0.8,t); cg.gain.exponentialRampToValueAtTime(0.0001,t+0.025); c.connect(cg).connect(ampG); c.start(t); c.stop(t+0.04);}
    if(S.noi>0){const n=noiseSrc(), ng=ctx.createGain(), bp=ctx.createBiquadFilter(); bp.type='bandpass'; bp.frequency.value=1800; bp.Q.value=0.8; ng.gain.setValueAtTime(v*S.noi*0.6,t); ng.gain.exponentialRampToValueAtTime(0.0001,t+0.06+S.dec*0.3); n.connect(bp).connect(ng).connect(ampG); n.start(t); n.stop(t+0.4+S.dec*0.3);}
  } else if(m==='sd'){
    [1,1+S.det*0.6].forEach((r,k)=>{const o=ctx.createOscillator(), g=ctx.createGain(); o.type='triangle'; o.frequency.setValueAtTime(S.tun*r*1.3,t); o.frequency.exponentialRampToValueAtTime(S.tun*r,t+0.04);
      env(g.gain,t,v*S.bdy*(k?0.5:0.9),0.001,S.hld,S.dec); o.connect(g).connect(ampG); o.start(t); o.stop(t+S.hld+S.dec*1.5+0.05);});
    const n=noiseSrc(), ng=ctx.createGain(), bp=ctx.createBiquadFilter(); bp.type='bandpass'; bp.frequency.value=S.ton; bp.Q.value=0.8;
    env(ng.gain,t,v*S.snp*1.2,0.001,S.hld,S.ndc); n.connect(bp).connect(ng).connect(ampG); n.start(t); n.stop(t+S.hld+S.ndc*1.5+0.05);
  } else if(m==='rs'){
    const o=ctx.createOscillator(), g=ctx.createGain(), bp=ctx.createBiquadFilter(); o.type='square'; o.frequency.value=S.tun; bp.type='bandpass'; bp.frequency.value=S.tun*(0.6+S.ton); bp.Q.value=2+S.rng*10;
    env(g.gain,t,v*0.9,0.0005,S.hld,S.dec); o.connect(bp).connect(g).connect(ampG); o.start(t); o.stop(t+S.hld+S.dec*2+0.05);
    const c=ctx.createOscillator(), cg=ctx.createGain(); c.type='sine'; c.frequency.setValueAtTime(S.tun*0.55*(1+S.spr),t); c.frequency.exponentialRampToValueAtTime(S.tun*0.25,t+0.02); cg.gain.setValueAtTime(v*S.bdy*0.8,t); cg.gain.exponentialRampToValueAtTime(0.0001,t+0.03+S.bdy*0.05); c.connect(cg).connect(ampG); c.start(t); c.stop(t+0.1);
    if(S.clk>0){const n=noiseSrc(), ng=ctx.createGain(), hp=ctx.createBiquadFilter(); hp.type='highpass'; hp.frequency.value=3000; ng.gain.setValueAtTime(v*S.clk*0.5,t); ng.gain.exponentialRampToValueAtTime(0.0001,t+0.012); n.connect(hp).connect(ng).connect(ampG); n.start(t); n.stop(t+0.03);}
  } else if(m==='cp'){
    const bp=ctx.createBiquadFilter(); bp.type='bandpass'; bp.frequency.value=S.ton; bp.Q.value=S.wid; const hp=ctx.createBiquadFilter(); hp.type='highpass'; hp.frequency.value=400+S.bri*1500; bp.connect(hp).connect(ampG);
    const cnt=Math.round(S.den); for(let k=0;k<=cnt;k++){const d=k*S.spr, last=k===cnt, n=noiseSrc(), g=ctx.createGain(); g.gain.setValueAtTime(v*(last?0.8:1),t+d); g.gain.exponentialRampToValueAtTime(0.0001,t+d+(last?S.dec*(0.4+S.rom):S.spr*0.9)); n.connect(g).connect(bp); n.start(t+d); n.stop(t+d+(last?S.dec*1.5:S.spr)+0.05);}
  } else if(m==='hh'||m==='cy'){
    const g=ctx.createGain(); env(g.gain,t,v*0.5,0.0005,S.hld,S.dec); const hp=ctx.createBiquadFilter(); hp.type='highpass'; hp.frequency.value=S.tun*(0.5+S.ton); const pk=ctx.createBiquadFilter(); pk.type='peaking'; pk.frequency.value=S.tun*1.5; pk.Q.value=2; pk.gain.value=S.shp*10; hp.connect(pk).connect(g).connect(ampG);
    const ratios=[1,1.34,1.68,2.19,2.77,3.43]; ratios.forEach((r,k)=>{const o=ctx.createOscillator(); o.type='square'; o.frequency.value=S.tun*0.12*r*(1+(k%2?S.spr:-S.spr)*0.1); const og=ctx.createGain(); og.gain.value=S.met*0.25; if(m==='cy'&&S.bel>0&&k<2){og.gain.value+=S.bel*0.4;} o.connect(og).connect(hp); o.start(t); o.stop(t+S.hld+S.dec*2+0.1);});
    const n=noiseSrc(), ng=ctx.createGain(); ng.gain.value=(m==='hh'?S.noi:S.ton)*0.9; n.connect(ng).connect(hp); n.start(t); n.stop(t+S.hld+S.dec*2+0.1);
    if(m==='hh'){if(tr.name.toLowerCase().includes('closed')||S.dec<0.15){A.tr.forEach((o2,j)=>{const t2=pat.tracks[j]; if(j!==i&&t2.machine==='hh'&&o2.openG){o2.openG.gain.cancelScheduledValues(t); o2.openG.gain.setTargetAtTime(0.0001,t,0.01);}});} else s.openG=g;}
  } else if(m==='cb'){
    const g=ctx.createGain(); env(g.gain,t,v*0.7,S.atk,S.hld,S.dec); const bp=ctx.createBiquadFilter(); bp.type='bandpass'; bp.frequency.value=S.tun*(1.2+S.ton); bp.Q.value=1.5; const sh=ctx.createWaveShaper(); sh.curve=curve(S.drv); bp.connect(sh).connect(g).connect(ampG);
    [1,S.rat].forEach(r=>{const o=ctx.createOscillator(); o.type=S.shp>0.5?'square':'triangle'; o.frequency.value=S.tun*r; const og=ctx.createGain(); og.gain.value=0.5; o.connect(og).connect(bp); o.start(t); o.stop(t+S.atk+S.hld+S.dec*2+0.1);});
  } else if(m==='tone'||m==='dual'||m==='raw'||m==='chord'){
    const note=step?step.note:48, f=mtof(note+S.tun), g=ctx.createGain(); g.connect(ampG);
    const atk=S.atk||0.002, dec=S.dec, hold=S.hld||0; env(g.gain,t,v*0.5,atk,hold,dec);
    const stopAt=t+atk+hold+dec*1.5+0.1;
    const mk=(freq,type,gain,det)=>{const o=ctx.createOscillator(); o.type=type; const vib=S.vib||0; if(S.gld>0&&s.lastFreq){o.frequency.setValueAtTime(s.lastFreq*freq/f,t); o.frequency.setTargetAtTime(freq,t,S.gld/3);} else o.frequency.setValueAtTime(freq,t);
      if(det) o.detune.value=det; s.pitchMod.connect(o.detune); const og=ctx.createGain(); og.gain.value=gain; o.connect(og).connect(g); o.start(t); o.stop(stopAt); return o;};
    if(m==='tone'){mk(f,WAVES[Math.round(S.wav)],0.6); if(S.pw>0) mk(f,WAVES[Math.round(S.wav)],0.4,S.pw*30); if(S.sub>0) mk(f/2,'sine',S.sub*0.8);}
    else if(m==='dual'){mk(f,WAVES[Math.round(S.wv1)],1-S.mix*0.7,-S.det*12); mk(f*Math.pow(2,S.int/12),WAVES[Math.round(S.wv2)],0.3+S.mix*0.7,S.det*12);}
    else if(m==='raw'){const sh=ctx.createWaveShaper(); sh.curve=foldCurve(S.fld); const lp=ctx.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=800+S.ton*9000; g.disconnect(); g.connect(sh).connect(lp).connect(ampG);
      const o=mk(f,S.pw>0.5?'square':'sawtooth',0.7); if(S.fm>0){const mo=ctx.createOscillator(); mo.frequency.value=f*2.01; const mg=ctx.createGain(); mg.gain.value=S.fm*f*3; mo.connect(mg).connect(o.frequency); mo.start(t); mo.stop(stopAt);} if(S.noi>0){const n=noiseSrc(), ng=ctx.createGain(); ng.gain.value=S.noi*0.5; n.connect(ng).connect(g); n.start(t); n.stop(stopAt);}}
    else { // chord
      const types=[[0,4,7],[0,3,7],[0,4,7,11],[0,3,7,10],[0,2,7],[0,5,7],[0,3,6],[0,7,12]]; let iv=types[Math.round(S.typ)].slice(); for(let k=0;k<Math.round(S.inv);k++){iv.push(iv.shift()+12);}
      iv.forEach((semi,k)=>{mk(f*Math.pow(2,semi/12),WAVES[Math.round(S.wav)],0.35/Math.sqrt(iv.length)*1.6,(k%2?1:-1)*S.spr*15);});
    }
    s.lastFreq=f;
  }
  // amp envelope
  env(ampG.gain,t,1,M.atk,M.hld,M.dec,0.0001);
  setTimeout(()=>{try{ampG.disconnect()}catch(e){}},Math.max(0,(end-ctx.currentTime)*1000)+6000);
  // front-panel LED
  const el=trackEls[i]; setTimeout(()=>{el.classList.add('hit'); setTimeout(()=>el.classList.remove('hit'),90);},Math.max(0,(t-ctx.currentTime)*1000));
}

// ---------- sequencer ----------
let pos=0, nextT=0, timer=null, uiCur=-1, loopCount=new Array(NT).fill(0), lastStep=new Array(NT).fill(-1);
const stepDur=()=>60/G.bpm/4;
function chainSeq(){const c=String(G.chain).replace(/[^1-8]/g,''); return c.length?c.split('').map(x=>+x-1):[0];}
function condOK(c,loop,first){
  switch(CONDS[c]){case '—':return true;case '1:2':return loop%2===0;case '2:2':return loop%2===1;case '1:4':return loop%4===0;case '2:4':return loop%4===1;case '3:4':return loop%4===2;case '4:4':return loop%4===3;case '1:8':return loop%8===0;case '5:8':return loop%8===4;
    case '25%':return Math.random()<0.25;case '50%':return Math.random()<0.5;case '75%':return Math.random()<0.75;case 'FILL':return fillOn;case '!FILL':return !fillOn;case '1st':return first;case '!1st':return !first;} return true;
}
function tick(info){
  if(!A) return;
  if(Number.isFinite(info.bpm)&&info.bpm>=20&&info.bpm<=300&&Math.abs(G.bpm-info.bpm)>0.01){G.bpm=info.bpm; $('bpm').value=G.bpm; applyGlobal(); for(let k=0;k<NT;k++) applyTrack(k);}
  if(!running){running=true; pos=0; playPat=-1;}
  nextT=info.time;
  {
    const cs=chainSeq(), bar=Math.floor(pos/STEPS), pIdx=cs[bar%cs.length];
    if(pIdx!==playPat){playPat=pIdx; for(let k=0;k<NT;k++) applyTrack(k); paintPats();}
    const pat=pats[pIdx], sw=(gv('swing')-50)/50*0.66, oddPos=(Number.isInteger(info.step)?info.step:pos)%2===1;
    pat.tracks.forEach((tr,i)=>{
      const st=pos%tr.len; const loop=Math.floor(pos/tr.len), first=pos<tr.len;
      const step=tr.steps[st]; if(!step.on||tr.mute) return;
      if(!condOK(step.cond,loop,first)) return;
      let t=nextT+(st%2?stepDur()*sw:0)+step.micro*stepDur()+(oddPos?Math.min(0.5,swv('p'+(pIdx+1)+'.swing',pat.swing||0)+swv('t'+(i+1)+'.swing',tr.swing||0))*stepDur():0);
      const n=step.retrig; for(let k=0;k<n;k++) trig(pat,i,t+k*stepDur()/n,step,step.vel*(k?0.75:1));
    });
    const curPos=pos; setTimeout(()=>{uiCur=curPos; paintTrigsCursor();},Math.max(0,(nextT-ctx.currentTime)*1000));
    pos++; nextT+=stepDur(); if(pos>=STEPS*8*64) pos=0;
  
  }
}
function stop(){running=false; clearTimeout(timer); playPat=-1; for(let k=0;k<NT;k++) applyTrack(k); uiCur=-1; paintTrigsCursor(); paintPats();}
const fillBtn=$('fill'); const setFill=v=>{fillOn=v; fillBtn.classList.toggle('on',v);};
fillBtn.addEventListener('pointerdown',()=>setFill(true)); fillBtn.addEventListener('pointerup',()=>setFill(false)); fillBtn.addEventListener('pointerleave',()=>setFill(false));

// ---------- UI: tracks ----------
const trackEls=[];
const tracksEl=$('tracks');
for(let i=0;i<NT;i++){
  const d=document.createElement('div'); d.className='trk'; d.tabIndex=0; d.setAttribute('role','button');
  d.innerHTML=`<span class="num">T${i+1}</span><span class="nm"></span>`; const m=document.createElement('button'); m.className='m'; m.textContent='M'; m.title='Mute';
  m.onclick=e=>{e.stopPropagation(); const tr=P().tracks[i]; tr.mute=!tr.mute; applyTrack(i); paintTracks();};
  d.appendChild(m); d.onclick=()=>selectTrack(i); d.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){selectTrack(i);e.preventDefault();}};
  tracksEl.appendChild(d); trackEls.push(d);
}
function paintTracks(){notifyParams(); P().tracks.forEach((tr,i)=>{const d=trackEls[i]; {const nm=d.querySelector('.nm'); nm.textContent=tr.name; const sm=document.createElement('small'); sm.textContent=MACH[tr.machine].name; nm.appendChild(sm);} d.classList.toggle('sel',i===curTrack); d.classList.toggle('muted',tr.mute); d.querySelector('.m').classList.toggle('on',tr.mute);});}
function selectTrack(i){curTrack=i; selStep=-1; paintAll();}

// machine select
const machSel=$('machine'); Object.keys(MACH).forEach(k=>{const o=document.createElement('option'); o.value=k; o.textContent=MACH[k].name; machSel.appendChild(o);});
machSel.onchange=()=>{const tr=T(); tr.machine=machSel.value; tr.syn=defaults('syn',tr.machine); tr.steps.forEach(s=>{if(s.lock.syn) delete s.lock.syn;}); if(MACH[tr.machine].synth&&tr.name===DEFAULT_NAMES[curTrack]&&!MACH[DEFAULT_MACH[curTrack]].synth) tr.name=MACH[tr.machine].name.replace('SY ',''); paintAll(); applyTrack(curTrack);};

// pages
$('pages').querySelectorAll('button[data-page]').forEach(b=>b.onclick=()=>{page=b.dataset.page; paintPages(); paintKnobs();});
$('lockMode').onclick=()=>{lockMode=!lockMode; if(!lockMode) selStep=-1; paintPages(); paintTrigs(); paintKnobs(); paintDisplay();};
function paintPages(){$('pages').querySelectorAll('button[data-page]').forEach(b=>b.classList.toggle('on',b.dataset.page===page)); $('lockMode').classList.toggle('on',lockMode);}

// knobs
const knobsEl=$('knobs');
function paintKnobs(){
  const tr=T(), defs=page==='syn'?MACH[tr.machine].syn:PAGES[page], step=selStep>=0?tr.steps[selStep]:null;
  knobsEl.innerHTML='';
  defs.forEach(([k,lab,mn,mx,def,fmt])=>{
    if(k==='_') return;
    const locked=step&&step.lock[page]&&(k in step.lock[page]); const val=locked?step.lock[page][k]:tr[page][k];
    const w=document.createElement('div'); w.className='knob'+(locked?' locked':''); const l=document.createElement('div'); l.className='lab'; const sp=document.createElement('span'); sp.textContent=lab+(locked?' ●':''); const o=document.createElement('output'); o.textContent=fmt(val); l.append(sp,o);
    const inp=document.createElement('input'); inp.type='range'; inp.min=mn; inp.max=mx; inp.step=(mx-mn)>50?1:((mx-mn)>5?0.1:0.001); if(['typ','wav','dst','wv1','wv2','inv','mod','mul','blk','den'].includes(k)) inp.step=1; inp.value=val; inp.id=`k_${page}_${k}`; inp.setAttribute('aria-label',lab); adopt(inp,{id:`${page}.${k}`,role:'param',group:page,label:lab}); if(locked) inp.classList.add('locked');
    inp.oninput=()=>{const nv=+inp.value; o.textContent=fmt(nv);
      if(lockMode&&step){step.lock[page]=step.lock[page]||{}; step.lock[page][k]=nv; w.classList.add('locked'); inp.classList.add('locked'); sp.textContent=lab+' ●'; paintTrigs();}
      else {tr[page][k]=nv; applyTrack(curTrack);}
      if(page==='syn'&&k==='dec'&&tr.machine==='hh') paintTracks();};
    inp.ondblclick=()=>{if(step&&step.lock[page]&&(k in step.lock[page])){delete step.lock[page][k]; if(!Object.keys(step.lock[page]).length) delete step.lock[page]; paintKnobs(); paintTrigs();} else {tr[page][k]=def; applyTrack(curTrack); paintKnobs();}};
    w.append(l,inp); knobsEl.appendChild(w);
  });
}

// trigs
const trigEls=[]; const trigsEl=$('trigs');
for(let s=0;s<STEPS;s++){const b=document.createElement('button'); b.className='trig'+(s%4===0?' q':''); b.innerHTML=`<span class="flag"></span><span class="led"></span><span class="n">${s+1}</span>`; b.setAttribute('aria-label',TX.stepAria(s+1)); adopt(b,{id:'trig.'+(s+1),role:'pad',group:'trigs',label:TX.stepAria(s+1)});
  b.onclick=()=>{const tr=T(), st=tr.steps[s];
    if(lockMode){selStep=(selStep===s)?-1:s; if(selStep>=0&&!st.on) st.on=1;}
    else {st.on^=1; selStep=st.on?s:-1;}
    paintTrigs(); paintKnobs(); paintStepbar(); paintDisplay();};
  trigsEl.appendChild(b); trigEls.push(b);}
function paintTrigs(){const tr=T(); tr.steps.forEach((st,s)=>{const b=trigEls[s]; b.classList.toggle('on',!!st.on); b.classList.toggle('soft',st.vel<0.6); b.classList.toggle('lock',!!st.on&&Object.keys(st.lock).length>0); b.classList.toggle('sel',s===selStep); b.classList.toggle('dead',s>=tr.len);
  const fl=[]; if(st.cond) fl.push(CONDS[st.cond]); if(st.retrig>1) fl.push('×'+st.retrig); if(st.micro) fl.push(st.micro>0?'▸':'◂'); b.querySelector('.flag').textContent=fl.join(' ');});}
function paintTrigsCursor(){const tr=T(); const cur=uiCur<0?-1:(uiCur%tr.len); trigEls.forEach((b,s)=>b.classList.toggle('cur',s===cur));}

// step bar
const snote=$('snote'); for(let m=24;m<=96;m++){const o=document.createElement('option'); o.value=m; o.textContent=nname(m); snote.appendChild(o);}
const scond=$('scond'); CONDS.forEach((c,i)=>{const o=document.createElement('option'); o.value=i; o.textContent=c; scond.appendChild(o);});
function curStep(){return selStep>=0?T().steps[selStep]:null;}
const pctS=v=>Math.round(v*100)+'%';
$('patSwing').oninput=()=>{const v=clamp(+$('patSwing').value,0,0.5); P().swing=v; $('patSwingOut').textContent=pctS(v);};
$('patSwing').ondblclick=()=>{P().swing=0; paintStepbar();};
$('trkSwing').oninput=()=>{const v=clamp(+$('trkSwing').value,0,0.5); T().swing=v; $('trkSwingOut').textContent=pctS(v);};
$('trkSwing').ondblclick=()=>{T().swing=0; paintStepbar();};
$('tlen').oninput=()=>{T().len=+$('tlen').value; $('tlenOut').textContent=T().len; paintTrigs();};
snote.onchange=()=>{const st=curStep(); if(st) st.note=+snote.value;};
scond.onchange=()=>{const st=curStep(); if(st){st.cond=+scond.value; paintTrigs();}};
$('sretrig').onchange=()=>{const st=curStep(); if(st){st.retrig=+$('sretrig').value; paintTrigs();}};
$('smicro').onchange=()=>{const st=curStep(); if(st){st.micro=+$('smicro').value; paintTrigs();}};
$('svel').oninput=()=>{const st=curStep(); $('svelOut').textContent=Math.round($('svel').value*100); if(st){st.vel=+$('svel').value; paintTrigs();}};
function paintStepbar(){const tr=T(), st=curStep(), has=!!st; $('tlen').value=tr.len; $('tlenOut').textContent=tr.len; $('trkSwing').value=tr.swing; $('trkSwingOut').textContent=pctS(tr.swing); $('patSwing').value=P().swing; $('patSwingOut').textContent=pctS(P().swing);
  ['snote','scond','sretrig','smicro','svel'].forEach(id=>$(id).disabled=!has);
  snote.parentElement.hidden=!MACH[tr.machine].synth;
  if(has){snote.value=st.note; scond.value=st.cond; $('sretrig').value=st.retrig; $('smicro').value=st.micro; $('svel').value=st.vel; $('svelOut').textContent=Math.round(st.vel*100);}}
function paintDisplay(){const tr=T(); $('dTrack').textContent=`T${curTrack+1} · ${tr.name}`; $('dPage').textContent=`${page.toUpperCase()} · ${MACH[tr.machine].name} · ${TX.lenWord} ${tr.len}`; machSel.value=tr.machine;
  $('dLock').textContent=lockMode?(selStep>=0?TX.lockStep(selStep+1):TX.lockPick):(selStep>=0?TX.stepSel(selStep+1):'');}

// patterns
const patsEl=$('pats'), patBtns=[];
for(let i=0;i<NPAT;i++){const b=document.createElement('button'); b.textContent=i+1; b.onclick=()=>{curPat=i; selStep=-1; paintAll(); for(let k=0;k<NT;k++) applyTrack(k);}; patsEl.appendChild(b); patBtns.push(b);}
function paintPats(){patBtns.forEach((b,i)=>{b.classList.toggle('edit',i===curPat); b.classList.toggle('play',i===playPat);});}
$('chain').addEventListener('input',()=>{G.chain=$('chain').value;});
$('patCopy').onclick=()=>{const nx=(curPat+1)%NPAT; pats[nx]=JSON.parse(JSON.stringify(pats[curPat])); curPat=nx; paintAll();};
$('patClear').onclick=()=>{P().tracks.forEach(tr=>tr.steps.forEach(s=>{s.on=0; s.lock={}; s.cond=0; s.retrig=1;})); selStep=-1; paintAll();};
$('patRnd').onclick=()=>{const dens=[0.25,0.15,0.2,0.1,0.5,0.15,0.1,0.1,0.3,0.1,0.35,0.1]; P().tracks.forEach((tr,i)=>tr.steps.forEach((s,k)=>{s.on=(i===0&&k===0)||Math.random()<dens[i]?1:0; s.vel=0.5+Math.random()*0.5; if(MACH[tr.machine].synth&&s.on) s.note=36+[0,3,5,7,10,12,15][Math.floor(Math.random()*7)]+(i===9?12:0);})); paintAll();};

// globals
[['bpm',v=>G.bpm=+v],['swing',v=>{G.swing=+v;$('swingOut').textContent=v;}],['vol',v=>G.vol=+v],['fxDrive',v=>G.fxDrive=+v],['fxCut',v=>G.fxCut=+v],['fxRes',v=>G.fxRes=+v],['dlyTime',v=>G.dlyTime=+v],['dlyFb',v=>G.dlyFb=+v],['revSize',v=>G.revSize=+v]].forEach(([id,f])=>{
  const el=$(id); el.addEventListener('input',()=>{f(el.value); const o=el.parentElement.querySelector('output'); if(o&&el.tagName!=='SELECT'&&id!=='swing'&&id!=='vol'&&id!=='bpm') o.textContent=fmtG(id,el.value); applyGlobal();});});
function fmtG(id,v){return id==='fxDrive'||id==='dlyFb'?`${Math.round(v*100)}%`:id==='fxCut'?`${v} Hz`:id==='fxRes'?(+v).toFixed(1):id==='revSize'?`${(+v).toFixed(1)} s`:v;}
function paintGlobals(){$('bpm').value=G.bpm; $('swing').value=G.swing; $('swingOut').textContent=G.swing; $('vol').value=G.vol; $('fxDrive').value=G.fxDrive; $('fxCut').value=G.fxCut; $('fxRes').value=G.fxRes; $('dlyTime').value=G.dlyTime; $('dlyFb').value=G.dlyFb; $('revSize').value=G.revSize; $('chain').value=G.chain;
  ['fxDrive','fxCut','fxRes','dlyFb','revSize'].forEach(id=>{$(id).parentElement.querySelector('output').textContent=fmtG(id,$(id).value);});}

function paintAll(){paintTracks(); paintPages(); paintKnobs(); paintTrigs(); paintTrigsCursor(); paintStepbar(); paintDisplay(); paintPats();}


// ---------- songs ----------
const songState=()=>({v:1,G:{...G},pats});
let clipBack=null;   // klembord: (patroon, state-tekst vóór de laatste plak), zodat Ongedaan maken van de host de patroonkeuze behoudt
function loadSong(st){const keep=clipBack&&clipBack.json===JSON.stringify(st)?clipBack.pat:0; clipBack=null; cleanG(st.G); if(Array.isArray(st.pats)) pats=Array.from({length:NPAT},(_,i)=>st.pats[i]?cleanPattern(st.pats[i]):newPattern()); curPat=keep; selStep=-1; paintGlobals(); paintAll(); applyGlobal(); for(let k=0;k<NT;k++) applyTrack(k);}
$('songExport').onclick=()=>{$('songText').value=JSON.stringify({name:$('songName').value.trim()||'Song',t:Date.now(),s:songState()});};
$('songCopy').onclick=()=>{const ta=$('songText'); if(!ta.value) $('songExport').onclick(); navigator.clipboard.writeText(ta.value).catch(()=>{ta.focus(); ta.select();});};
$('songImport').onclick=()=>{try{const j=JSON.parse($('songText').value); if(!j.s||!j.s.pats) throw 0; loadSong(j.s); if(j.name) $('songName').value=j.name; $('songText').value='';}catch(e){$('songText').value=TX.importFail+'\n\n'+$('songText').value;}};
$('demoNacht').onclick=()=>{loadSong(demoNight()); $('songName').value=TX.songNight; host.setTempo&&host.setTempo(G.bpm);};
$('demoBasis').onclick=()=>{loadSong(demoBasis()); $('songName').value=TX.songBasic; host.setTempo&&host.setTempo(G.bpm);};
// ---------- klembord (contract v1.24, §13d): het bewerkte patroon (curPat) als clip van de soort 'multi' ----------
// 12 sporen = 12 tracks. Tijd in tikken: 12 per zestiende, dus een stap is 12 tikken en een track van len stappen is len × 12 tikken lang (polymetrie blijft).
// Drumtrack = `drums`-spoor met één baan (type en GM-nummer van de machine), synthtrack = `notes`-spoor. `native` (het hele patroon, mét klank) alleen voor Groovebox 12 zelf.
const CLIP_ID='nl.patchkamer.groovebox12', CLIP_VER='1.13.0', CT=12;
const CLIP_TYPE={bd:'kick',sd:'snare',rs:'rim',cp:'clap',cy:'ride',cb:'cowbell'}, CLIP_NOTE={bd:36,sd:38,rs:37,cp:39,cy:51,cb:56};
const clipSynth=tr=>!!MACH[tr.machine].synth, clipClosed=tr=>/closed/i.test(tr.name)||tr.syn.dec<0.15;
let clipGone=false;
function clipLane(tr,i){ const hh=tr.machine==='hh'; return {id:'t'+(i+1),name:String(tr.name).slice(0,40),type:hh?(clipClosed(tr)?'closedhat':'openhat'):(CLIP_TYPE[tr.machine]||''),note:hh?(clipClosed(tr)?42:46):(CLIP_NOTE[tr.machine]!==undefined?CLIP_NOTE[tr.machine]:-1)}; }
// de gebeurtenissen van een track in tikken; stappen achter de tracklengte klinken niet en blijven in native
function clipEvents(tr){ const L=tr.len*CT, syn=clipSynth(tr), out=[];
  for(let k=0;k<tr.len;k++){ const st=tr.steps[k]; if(!st.on) continue;
    const t=clamp(Math.round(k*CT+st.micro*CT),0,L-1), acc=st.vel>0.9, e={t,vel:acc?1:Math.max(0.01,Math.min(1,st.vel))}; if(acc) e.acc=true;
    const pr=st.cond===9?0.25:st.cond===10?0.5:st.cond===11?0.75:1; if(pr<1) e.prob=pr; if(st.retrig>1) e.ratchet=st.retrig;
    if(syn){ e.n=st.note; e.len=Math.max(1,Math.min(CT,L-t)); } else e.lane=0;
    out.push(e); }
  return out.sort((a,b)=>a.t-b.t); }
function clipTrack(tr,i){ const syn=clipSynth(tr), L=tr.len*CT, ev=clipEvents(tr);
  const c={format:'patchkamer-clip',formatVersion:1,kind:syn?'notes':'drums',name:String(tr.name).slice(0,40),length:L,grid:ev.some(e=>e.t%CT)?64:16,source:{device:CLIP_ID,name:'Groovebox 12',version:CLIP_VER,scheme:'gm'}};
  if(syn) c.notes=ev; else { c.lanes=[clipLane(tr,i)]; c.hits=ev; }
  return c; }
const clipPatName=()=>(TX.clipPat+' '+(curPat+1)).slice(0,40);
function clipInfo(){ try{ if(clipGone) return null; const P0=P();
  return {name:clipPatName(),copy:['multi'],paste:['multi'],length:{min:CT,max:STEPS*CT,step:CT,current:Math.max(...P0.tracks.map(t=>t.len))*CT,shared:false},grid:[16,32,64],poly:1,range:[0,127],scheme:'gm',vel:'continuous',prob:true,ratchet:true,maxEvents:STEPS,
    tracks:P0.tracks.map((tr,i)=>{ const syn=clipSynth(tr), o={id:'t'+(i+1),name:String(tr.name).slice(0,40),kind:syn?'notes':'drums',role:tr.machine,length:{min:CT,max:STEPS*CT,step:CT,current:tr.len*CT,shared:false}}; if(!syn) o.lanes=[clipLane(tr,i)]; return o; })};
} catch(e){ return null; } }
function getClip(){ try{ if(clipGone) return null; const P0=P(), tracks=P0.tracks.map((tr,i)=>({slot:i,name:String(tr.name).slice(0,40),kind:clipSynth(tr)?'notes':'drums',role:tr.machine,clip:clipTrack(tr,i)}));
  return JSON.parse(JSON.stringify({format:'patchkamer-clip',formatVersion:1,kind:'multi',name:clipPatName(),length:Math.max(...tracks.map(t=>t.clip.length)),grid:tracks.some(t=>t.clip.grid===64)?64:16,source:{device:CLIP_ID,name:'Groovebox 12',version:CLIP_VER,scheme:'gm'},tracks,native:{device:CLIP_ID,data:{pattern:P0}}}));
} catch(e){ return null; } }
// een spoorclip uit onbetrouwbare invoer als genormaliseerde gebeurtenissen (zelfde vorm als clipEvents, voor de vergelijking met native)
function clipParse(tc,syn){ const L=int(tc.length,1,12288,CT), isn=x=>typeof x==='number'&&Number.isFinite(x), src=syn?tc.notes:tc.hits, out=[]; let bad=0;
  if(!Array.isArray(src)) return {L,out,bad:0};
  for(const x of src.slice(0,4096)){ if(!x||typeof x!=='object'||!isn(x.t)||x.t<0||x.t>=L){ bad++; continue; }
    if(syn){ if(!isn(x.n)){ bad++; continue; } } else if(x.lane!==0){ bad++; continue; }
    const acc=x.acc===true, e={t:Math.round(x.t),vel:acc?1:num(x.vel,0.01,1,0.8),prob:num(x.prob,0,1,1),ratchet:int(x.ratchet,1,8,1)}; if(syn) e.n=int(x.n,0,127,48); out.push(e); }
  bad+=Math.max(0,(src.length)-4096); return {L,out,bad}; }
const clipPrint=(L,ev)=>JSON.stringify([L,ev.map(e=>[e.t,e.n===undefined?0:e.n,Math.round(e.vel*1e6),Math.round((e.prob===undefined?1:e.prob)*1e6),e.ratchet===undefined?1:e.ratchet]).sort((a,b)=>a[0]-b[0]||a[1]-b[1]||a[2]-b[2]||a[3]-b[3]||a[4]-b[4])]);
function setClip(clip){ try{
  if(clipGone) return {ok:false,reason:TX.clipGone};
  if(!clip||typeof clip!=='object'||Array.isArray(clip)||clip.format!=='patchkamer-clip'||(clip.formatVersion!==undefined&&clip.formatVersion!==1)) return {ok:false,reason:TX.clipBad};
  if(clip.kind!=='multi') return {ok:false,reason:TX.clipKind};
  const entries=new Map();
  for(const x of (Array.isArray(clip.tracks)?clip.tracks.slice(0,64):[])){ if(!x||typeof x!=='object'||!Number.isInteger(x.slot)||x.slot<0||x.slot>=NT) continue; const tc=x.clip;
    if(!tc||typeof tc!=='object'||Array.isArray(tc)||tc.format!=='patchkamer-clip'||(tc.kind!=='notes'&&tc.kind!=='drums')||typeof tc.length!=='number'||!Number.isFinite(tc.length)||tc.length<1) continue; entries.set(x.slot,tc); }
  if(!entries.size) return {ok:false,reason:TX.clipBad};
  const before=JSON.stringify(songState()), cur=P();
  let np=null, dropped=0;
  // een clip van Groovebox 12 zelf, niet aangepast: het hele patroon komt exact terug (klank, p-locks, condities)
  const nd=clip.native&&typeof clip.native==='object'&&clip.native.device===CLIP_ID&&clip.native.data&&typeof clip.native.data==='object'?clip.native.data.pattern:null;
  if(nd&&typeof nd==='object'){ const cand=cleanPattern(nd); let all=entries.size===NT;
    for(let i=0;all&&i<NT;i++){ const tc=entries.get(i), tr=cand.tracks[i], syn=clipSynth(tr); if(!tc||tc.kind!==(syn?'notes':'drums')){ all=false; break; }
      const p=clipParse(tc,syn); if(p.bad||clipPrint(p.L,p.out)!==clipPrint(tr.len*CT,clipEvents(tr).map(e=>({...e,vel:e.vel,prob:e.prob===undefined?1:e.prob,ratchet:e.ratchet===undefined?1:e.ratchet})))) all=false; }
    if(all) np=cand; }
  if(!np){ np=JSON.parse(JSON.stringify(cur)); let used=0;
    entries.forEach((tc,slot)=>{ const tr=np.tracks[slot], syn=clipSynth(tr); if(tc.kind!==(syn?'notes':'drums')) { dropped++; return; }
      const p=clipParse(tc,syn), n=clamp(Math.ceil(p.L/CT),1,STEPS); dropped+=p.bad; used++;
      tr.len=n; tr.steps=Array.from({length:STEPS},newStep);
      for(const e of p.out){ if(e.t>=n*CT){ dropped++; continue; } const k=Math.min(n-1,Math.round(e.t/CT)), o=tr.steps[k];
        if(o.on){ dropped++; if(e.vel<=o.vel) continue; }
        const micro=clamp(Math.round((e.t-k*CT)/CT*8)/8,-0.25,0.25), cond=e.prob<1?(e.prob<0.375?9:e.prob<0.625?10:11):0;
        tr.steps[k]={on:1,vel:e.vel,note:syn?e.n:48,cond,retrig:e.ratchet,micro,lock:{}}; } });
    if(!used) return {ok:false,reason:TX.clipNoTrack}; np=cleanPattern(np); }
  if(JSON.stringify(np)===JSON.stringify(cur)) return {ok:true,...(dropped?{dropped}:{})};
  clipBack={pat:curPat,json:before}; pats[curPat]=np; selStep=-1; paintAll(); for(let k=0;k<NT;k++) applyTrack(k);
  return {ok:true,...(dropped?{dropped}:{})};
} catch(e){ return {ok:false,reason:TX.clipBad}; } }
paintGlobals(); paintAll(); $('songName').value=TX.songNight;
build(); for(let k=0;k<NT;k++) applyTrack(k);
return {
  tick,
  transport(p){ if(p){running=true; pos=0; playPat=-1;} else stop(); },
  params:modParams, modulate:modulateAll,
  // contract v1.5: elke track apart, na level en pan (s.pan), vóór de sends en het FX-blok
  bundle(){ return {label:TX.multi, channels:A?A.tr.map((s,i)=>({id:'t'+(i+1), name:`${i+1} · ${P().tracks[i].name}`, node:s.pan})):[]}; },
  clipInfo, getClip, setClip,
  getState(){ return JSON.parse(JSON.stringify(songState())); },
  setState(s){ if(s&&typeof s==='object') loadSong(JSON.parse(JSON.stringify(s))); },
  destroy(){ running=false; clipGone=true; },
};

    }
    let pendingMod = null;
    const INST = {
      inputs: {}, outputs: { out: OUT },
      bundles: { multi: () => (api ? api.bundle() : { label: TX.multi, channels: [] }) },
      mount(el) {
        const wrap = document.createElement('div'); el.appendChild(wrap);
        const sh = wrap.attachShadow({ mode: 'open' });
        sh.innerHTML = '<style>' + __CSS + '</style><div class="__body">' + __HTML(TX) + '</div>';
        api = __init(sh);
        if (pending) { api.setState(pending); pending = null; }
        if (pendingMod) { api.modulate(pendingMod); pendingMod = null; }
        try { host.bundleChanged && host.bundleChanged(INST, 'multi'); } catch (e) {}
      },
      onStep(info) { if (api) try { api.tick(info); } catch (e) { console.warn('Groovebox 12', e); } },
      onTransport({ playing }) { if (api) try { api.transport(playing); } catch (e) { console.warn('Groovebox 12', e); } },
      // contract v1.3 — twaalf sporen, één per track
      params() { return api ? api.params() : []; },
      modulate(o) { if (api) { try { api.modulate(o); } catch (e) { console.warn('Groovebox 12', e); } } else pendingMod = o; },
      // klembord (contract v1.24): het bewerkte patroon met zijn 12 tracks (kind multi)
      clipInfo() { return api ? api.clipInfo() : null; },
      getClip() { return api ? api.getClip() : null; },
      setClip(c) { return api ? api.setClip(c) : { ok: false, reason: TX.clipGone }; },
      getState() { return api ? api.getState() : (pending || {}); },
      setState(s) { if (api) api.setState(s); else pending = s; },
      destroy() {
        if (api) { try { api.destroy(); } catch (e) {} api = null; }
        live.forEach(n => { try { n.stop(); } catch (e) {} }); live.clear();
        try { OUT.disconnect(); } catch (e) {}
      },
    };
    return INST;
  },
};
