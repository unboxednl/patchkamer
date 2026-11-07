// validate-instrument.mjs — Patchkamer contract v1.22
// Gebruik: node validate-instrument.mjs mijn-instrument.patchkamer-device.js [--lang nl|en] [--controls] [--clip]
// Laadt de module met een nep-AudioContext en een nep-DOM (incl. Shadow DOM), controleert het
// contract en roept create, mount, onStep (2 maten), onEvent, onTransport, getState/setState en
// destroy aan. Eindigt met één OK-regel (exit 0) of de eerste fout (exit 1).
// v1.4: snelle sturing (fast + modInput), host.modSignal, host.loadWorklet; nep-AudioWorklet.
// v1.5: bundels (ports.multiIn/multiOut, bundles, onBundle, host.bundleChanged, host.isWired).
// v1.6: presets (getPreset/setPreset) en: setState() moet de knoppen van host.ui bijwerken.
// v1.7: host.frame / host.visible (tekenklok; na destroy geen open abonnement), onPeers, host.connect/disconnect/cablesFrom;
//       waarschuwing (geen fout) bij een eigen requestAnimationFrame zonder host.frame.
// v1.9: instrumenten (parts/getPart/setPart) voor tunes per instrument: lijst, JSON, terugzetten, kruislings zetten.
// v1.10: bestandsnaam *.patchkamer-device.js; een andere naam geeft een waarschuwing (geen fout).
// v1.11: --lang nl|en (taal van de uitvoer; standaard nl); optioneel veld i18n op de definitie; host.lang en host.audio in de nep-host;
//        tweede doorloop met de andere host.lang, zodat een fout in de taaltak van het apparaat ook wordt gevonden.
// v1.13: multi-MIDI: ports.multiEventIn/multiEventOut, eventBundles, onEventBundle, host.eventBundleChanged; velden ch en cc op gebeurtenissen; host.controls en host.setControl.
// v1.15: regelaars herkenbaar voor skins: opties { id, role, group } op host.ui.knob (7e argument) en host.ui.select (6e), host.ui.adopt, host.ui.list,
//        attributen data-pk-id/-role/-group. Alleen "let op" (nooit een fout) bij een dubbel id, deels ontbrekende id's, een rol buiten de lijst,
//        een ongeldig id/groep, of een id dat per taal verschilt. --controls drukt de tabel id | rol | groep | label nl/en | bereik | gezicht af.
// v1.16 (§8): dekking van params(): elke continue regelaar (type=range, host.ui.knob, host.ui.adopt) hoort in params() te staan, met id = state-sleutel,
//        of bewust uitgesloten te zijn met `modExclude: [ids]` (of '*') op de definitie. Alleen "let op" (nooit een fout) voor: continue regelaars die niet in params() staan,
//        een instrument/effect/mixer met continue regelaars maar zonder params(), en een param-id zonder regelaar of state-sleutel. --controls krijgt de kolom "in params()".
// v1.17: klembord: optioneel clipInfo()/getClip()/setClip(clip) (alle drie of geen): formaat patchkamer-clip, setClip(getClip()) laat de state gelijk, rommel gooit niet en zet niets half. --clip toont de uitvoer.
// v1.21: instellingen opnemen en afspelen: host.watchParams, host.setParam, host.lockParams en host.paramsOf (voor sequencers); de nep-host kent ze en geeft false, de validator controleert er verder niets van.
// v1.22: pads en schermpje: host.ui.pad(parent, label, opts) -> { el, set, flash, id, destroy } (opts: id, group, role, mode momentary|toggle, on, onpress, onrelease, onchange, color #rrggbb, text, title),
//        host.ui.display(parent, label, opts) -> { el, set, get, value, items, id, destroy } (opts: id, group, role, items [[waarde, tekst]], value, onchange, kind, wrap, searchAt; el.select = het model)
//        en host.ui.steps(parent, label, arr, onchange, opts?) met opts { id, group, role, color }. Een color die geen #rrggbb is, gooit (fout). Alleen "let op" bij een dubbel pad-id,
//        ongeldige opties, een momentary pad zonder onpress en zonder onchange, een display-value buiten items. --controls toont pads (type pad), steps (type steps) en displays (select, gezicht dropdown).
// v1.20: samples (tab Samples, samplepacks) en de optionele methode loadAudio(files, info); de validator kent haar niet en weigert haar niet.
// v1.19: tags voor tunes en presets (op de packs); de validator controleert apparaten, dus hier verandert niets.
// v1.18: meters: host.ui.meter(parent, label, opts) -> { el, set, id, destroy }; de nep-host kent het (opts: id, group, source = AnalyserNode of lijst van 1-2, unit, range, kind, hold, clip,
//        orientation, length, width). Alleen "let op" bij een dubbel meter-id, ongeldige opties, kind 'rms' zonder source, een set() zonder getal, data-pk-role="meter" op een eigen element
//        en een data-pk-suffix langer dan 16 tekens; een source die geen AnalyserNode is, gooit (fout). Een meter hoort niet in params(). --controls toont meters ook (rol meter).
// v1.14: nootnamen: optioneel noteNames() op het apparaat (lijst { note, name }) en host.noteNamesChanged; host.peers geeft ze door als noteNames.
// v1.12: mastering: ports.masteringIn/masteringOut (kabeltype mastering), configureMastering, onMasteringTargets, host.mastering.
// v1.8: de tekenpoort (__pkWrap) telt als soepel tekenen; host.ui.knob accepteert een 7e argument (opties).
import { pathToFileURL, fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

// ---------- argumenten: bestand, --lang nl|en (taal van de uitvoer), --host-lang nl|en (host.lang voor het apparaat) ----------
const argv = process.argv.slice(2); let LANG = 'nl', HOSTLANG = 'nl', SUB = false, CONTROLS = false, CLIPOUT = false; const rest = [];
for (let i = 0; i < argv.length; i++) { const a = argv[i];
  if (a === '--lang') LANG = argv[++i] || ''; else if (a.startsWith('--lang=')) LANG = a.slice(7);
  else if (a === '--host-lang') HOSTLANG = argv[++i] || ''; else if (a.startsWith('--host-lang=')) HOSTLANG = a.slice(12);
  else if (a === '--sub') SUB = true; else if (a === '--controls') CONTROLS = true; else if (a === '--clip') CLIPOUT = true; else rest.push(a); }
const V = {
  nl: {
    "v.fout_prefix": "FOUT:",
    "v.i18n_object": "i18n moet een object zijn met een taalcode per sleutel (bv. { en: { name: '…' } })",
    "v.i18n_taal_object": "i18n.{0} moet een object zijn",
    "v.i18n_name": "i18n.{0}.name moet een niet-lege tekst zijn",
    "v.i18n_ports": "i18n.{0}.ports moet een object zijn (poort-id → naam)",
    "v.i18n_poort_onbekend": "i18n.{0}.ports.{1}: dit poort-id bestaat niet in ports",
    "v.i18n_poortnaam": "i18n.{0}.ports.{1} moet een niet-lege tekst zijn",
    "v.faalt_met_host_lang": "met host.lang = \"{0}\" faalt het apparaat: {1}",
    "v.ok_breedte": ", breedte {0} px",
    "v.ok_poorten": ", poorten: audio {0}→{1}, events {2}→{3}, state {4} bytes, bronnen gestart {5}",
    "v.ok_jacks": ", {0} jacks",
    "v.ok_setports": ", {0}× setPorts",
    "v.ok_gebeurtenissen": ", {0} gebeurtenissen",
    "v.ok_params_sporen": ", {0} stuurbare parameters in {1} sporen",
    "v.ok_params_spoor": ", {0} stuurbare parameters in {1} spoor",
    "v.ok_snel": ", {0} snel",
    "v.ok_modulator": ", modulator",
    "v.ok_modsignal": " (modSignal {0}×)",
    "v.ok_worklets": ", {0} worklets",
    "v.ok_worklet": ", {0} worklet",
    "v.ok_bundel_uit": ", bundel uit {0} kanalen",
    "v.ok_bundel_in": ", bundel in",
    "v.ok_mastering_uit": ", mastering uit (regie)",
    "v.ok_multievent_uit": ", multi-MIDI uit ({0} sporen)",
    "v.ok_multievent_in": ", multi-MIDI in",
    "v.host_eventbundlechanged_is_geen_multieventout": "host.eventBundleChanged(): \"{0}\" is geen multiEventOut-poort",
    "v.gebeurtenis_ch_moet_een_geheel_getal": "gebeurtenis: ch moet een geheel getal van 1 tot 16 zijn (kreeg {0})",
    "v.gebeurtenis_cc_moet_een_geheel_getal": "gebeurtenis: cc moet een geheel getal van 0 tot 127 zijn (kreeg {0})",
    "v.gebeurtenis_op_multieventout_mist_track": "gebeurtenis op multiEventOut \"{0}\" mist track (het id van een spoor uit eventBundles)",
    "v.multieventout_instance_eventbundles_ontbreekt": "multiEventOut \"{0}\": instance.eventBundles.{1} ontbreekt",
    "v.eventbundles_gooit": "eventBundles.{0} gooit: ",
    "v.eventbundles_moet_label_tracks_id": "eventBundles.{0} moet { label, tracks: [{ id, name, ch }] } geven",
    "v.eventbundles_elk_spoor_heeft_een": "eventBundles.{0}: elk spoor heeft een id (niet-lege tekst)",
    "v.eventbundles_dubbele_spoor_id": "eventBundles.{0}: dubbele spoor-id",
    "v.eventbundles_spoor_name": "eventBundles.{0}: spoor \"{1}\" heeft een name die geen tekst is",
    "v.eventbundles_spoor_ch": "eventBundles.{0}: spoor \"{1}\" heeft een ch buiten 0 tot 16",
    "v.multieventin_instance_oneventbundle_poortid_sleutel": "multiEventIn \"{0}\": instance.onEventBundle(poortId, sleutel, bundel) ontbreekt",
    "v.oneventbundle_gooit": "onEventBundle() gooit op \"{0}\": ",
    "v.onevent_gooit_op_multieventin": "onEvent() gooit op multiEventIn \"{0}\": ",
    "v.oneventbundle_null_gooit": "onEventBundle(null) gooit op \"{0}\": ",
    "v.ok_mastering_in": ", mastering in (doel)",
    "v.host_mastering_onbekende_actie": "host.mastering(): onbekende actie \"{0}\" (kies inspect, apply, analyse, accept of undo)",
    "v.host_mastering_geen_masteringout": "host.mastering(): het apparaat heeft geen masteringOut-poort",
    "v.masteringout_instance_onmasteringtargets_ontbreekt": "masteringOut: instance.onMasteringTargets(targets) ontbreekt",
    "v.onmasteringtargets_gooit": "onMasteringTargets() gooit: ",
    "v.masteringin_instance_configuremastering_ontbreekt": "masteringIn: instance.configureMastering(patch) ontbreekt",
    "v.mastering_methode_gooit": "{0}() gooit: ",
    "v.mastering_methode_object": "{0}() moet een object geven (bijvoorbeeld {ok, changed, skipped})",
    "v.getmasteringreport_niet_json": "getMasteringReport() moet JSON-serialiseerbaar zijn en mag geen AudioNodes bevatten",
    "v.ok_preset": ", eigen preset {0} bytes",
    "v.ok_instrumenten": ", {0} instrumenten voor tunes",
    "v.ok_knoppen": ", {0} host-knoppen volgen setState",
    "v.ctl_prefix": " · let op: ",
    "v.ctl_opties": "{0}: de opties van host.ui moeten een object zijn ({ id, role, group }); genegeerd",
    "v.ctl_id_vorm": "{0}: id \"{1}\" hoort 1 tot 60 tekens uit [A-Za-z0-9._-] te zijn; genegeerd",
    "v.ctl_id_dubbel": "id \"{0}\" staat bij meer dan één regelaar ({1}); een id is uniek binnen een apparaat",
    "v.ctl_id_ontbreekt": "{0} regelaar(s) zonder id terwijl andere er wel een hebben: {1}",
    "v.ctl_rol": "{0}: rol \"{1}\" staat niet in de lijst ({2}); de host behandelt hem als standaardrol",
    "v.ctl_groep": "{0}: groep \"{1}\" hoort 1 tot 60 tekens uit [A-Za-z0-9._-] te zijn; genegeerd",
    "v.ctl_adopt_element": "host.ui.adopt() kreeg geen element",
    "v.ctl_adopt_model": "{0}: dit element heeft geen model (input range/checkbox, select of button); een id zonder regelaar doet niets",
    "v.ctl_los": "{0}: id \"{1}\" staat op een element dat nergens in de kaart hangt",
    "v.ctl_id_taal": "de id's verschillen per host.lang ({0}); een id is de state-sleutel, nooit een label",
    "v.ok_regelaars": ", {0} regelaars met id",
    "v.ctl_geen": "(geen regelaars via host.ui of data-pk-*)",
    "v.ctl_titel": "Regelaars ({0}):",
    "v.ctl_kop": "id | rol | groep | label nl/en | bereik | gezicht | in params()",
    "v.ctl_zonder_id": "(zonder id)",
    "v.meter_aantal": ", {0} meters",
    "v.meter_opts": "{0}: de opties van host.ui.meter moeten een object zijn; genegeerd",
    "v.meter_optie": "{0}: meter-optie {1} is ongeldig (verwacht {2}); de host gebruikt de standaard",
    "v.meter_source": "host.ui.meter(): source moet een AnalyserNode zijn of een lijst van 1 of 2 AnalyserNodes (ctx.createAnalyser()); nodes aanmaken of verbinden doet de host niet",
    "v.meter_rms_zonder_source": "{0}: kind 'rms' werkt alleen met source; zonder source rekent het apparaat zelf en geeft set() het niveau",
    "v.meter_set": "{0}: set() verwacht een eindig getal of een lijst [l, r]; genegeerd",
    "v.meter_attr": "{0}: data-pk-role=\"meter\" op een eigen element wordt niet ondersteund; een meter heeft het gezicht van de host nodig, gebruik host.ui.meter",
    "v.meter_suffix": "{0}: data-pk-suffix hoort tekst van hoogstens 16 tekens te zijn",
    "v.pad_aantal": ", {0} pads",
    "v.display_aantal": ", {0} schermpjes",
    "v.pad_opts": "{0}: de opties van host.ui.pad moeten een object zijn; genegeerd",
    "v.pad_optie": "{0}: pad-optie {1} is ongeldig (verwacht {2}); de host gebruikt de standaard",
    "v.pad_color": "{0}: color moet een hex-kleur #rrggbb zijn (kreeg {1}); de host kan geen andere kleurvorm tekenen",
    "v.pad_geen_handler": "{0}: een pad (momentary) zonder onpress en zonder onchange doet niets; geef een van de twee",
    "v.steps_opts": "{0}: het 5e argument van host.ui.steps moet een object { id, group, role, color } zijn; genegeerd",
    "v.display_opts": "{0}: de opties van host.ui.display moeten een object zijn; genegeerd",
    "v.display_optie": "{0}: display-optie {1} is ongeldig (verwacht {2}); de host gebruikt de standaard",
    "v.display_waarde": "{0}: value \"{1}\" staat niet in items; de host kiest het eerste item",
    "v.mod_ontbreekt": "{0} continue regelaar(s) staan niet in params(): {1} (§8: neem ze op, of zet ze in modExclude als ze bewust buiten blijven)",
    "v.mod_geen_params": "{0} continue regelaar(s) maar geen params() (kind {1}): modulatoren kunnen dit apparaat niet bedienen: {2} (§8: voeg params() en modulate() toe, of zet modExclude: '*' als dat bewust is)",
    "v.mod_param_zonder": "params(): {0} id('s) zonder regelaar of state-sleutel: {1} (typefout? modulate negeert onbekende ids)",
    "v.mod_exclude_vorm": "modExclude moet een lijst met id's (tekst) zijn, of '*' (§8)",
    "v.mod_ja": "ja",
    "v.mod_nee": "nee",
    "v.mod_uit": "uitgesloten",
    "v.ctl_label_is": "label",
    "v.ok_tekent_frame": ", tekent via host.frame",
    "v.ok_tekent_poort": ", tekent via de tekenpoort",
    "v.ok_besturing": ", besturing (peers/connect)",
    "v.waarschuwing_raf": " · let op: eigen requestAnimationFrame zonder host.frame (v1.7, §12b)",
    "v.waarschuwing_naam": " · let op: bestandsnaam hoort op .patchkamer-device.js te eindigen (v1.10, §2)",
    "v.ui_jacks_is_aan_maar": "ui.jacks is aan maar er is geen enkele host.ui.jack() geplaatst",
    "v.emit_op_onbekende_eventout_poort": "emit op onbekende eventOut-poort \"{0}\"",
    "v.na_destroy_staan_er_nog": "na destroy() staan er nog {0} host.frame-abonnement(en) open; roep de opzeg-functie aan in unmount()/destroy()",
    "v.destroy_gooit_moet_idempotent_zijn": "destroy() gooit (moet idempotent zijn): ",
    "v.onpeers_gooit": "onPeers() gooit: ",
    "v.clip_horen_bij": "klembord (v1.17): {0}() ontbreekt; clipInfo, getClip en setClip horen bij elkaar",
    "v.clipinfo_gooit": "clipInfo() gooit: ",
    "v.clipinfo_ongeldig": "clipInfo() moet null of een JSON-object geven, kreeg: ",
    "v.clipinfo_state": "clipInfo() verandert de state (hij moet licht zijn en geen bijwerkingen hebben)",
    "v.clipinfo_soorten": "clipInfo(): copy en paste moeten lijsten zijn met 'notes' en/of 'drums', kreeg: ",
    "v.clipinfo_lengte": "clipInfo(): length.min, max, step en current moeten getallen zijn (1 tot 12288 tikken), kreeg: ",
    "v.getclip_gooit": "getClip() gooit: ",
    "v.getclip_json": "getClip() geeft geen JSON-object of null (of bevat AudioNodes): ",
    "v.getclip_state": "getClip() verandert de state (geen bijwerkingen)",
    "v.clip_ongeldig": "getClip() geeft geen geldige patchkamer-clip: ",
    "v.clipf_format": "format moet 'patchkamer-clip' zijn en formatVersion 1",
    "v.clipf_kind": "kind moet 'notes' of 'drums' zijn",
    "v.clipf_length": "length moet een geheel getal van 1 tot 12288 tikken zijn (12 tikken per zestiende)",
    "v.clipf_notes": "kind 'notes' heeft een lijst notes nodig (hoogstens 4096)",
    "v.clipf_note": "noot {0}: t (0 tot length-1), n (0 tot 127), len (>= 1) en vel (0,01 tot 1) moeten kloppende gehele getallen/getallen zijn",
    "v.clipf_drums": "kind 'drums' heeft een lijst lanes (hoogstens 64) en een lijst hits (hoogstens 4096) nodig",
    "v.clipf_hit": "hit {0}: t (0 tot length-1), lane (bestaande baan) en vel (0,01 tot 1) moeten kloppen",
    "v.clipf_name": "name moet tekst zijn (als hij er is)",
    "v.setclip_gooit": "setClip() gooit bij {0}: ",
    "v.setclip_resultaat": "setClip() moet { ok: true } of { ok: false, reason: tekst } geven, kreeg: {0} (bij {1})",
    "v.setclip_half": "setClip() met {0} gaf ok:false maar veranderde toch de state (zet niets half)",
    "v.setclip_state": "na setClip() met {0} is de state geen geldige JSON zonder NaN of Infinity: ",
    "v.setclip_rondreis": "setClip(getClip()) verandert de state (moet gelijk blijven)",
    "v.setclip_events": "setClip() stuurt zelf gebeurtenissen (host.emit); alleen de klok doet dat",
    "v.waarschuwing_clip_afgewezen": " · let op: setClip(getClip()) wordt door het apparaat zelf afgewezen (ok:false)",
    "v.ok_klembord": ", klembord (clipInfo/getClip/setClip)",
    "v.clip_titel": "Klembord (--clip):",
    "v.clip_geen": "(geen clipInfo/getClip/setClip)",
    "v.clip_nul": "(null)",
    "v.notenames_gooit": "noteNames() gooit: ",
    "v.notenames_ongeldig": "noteNames() moet een lijst van { note: 0..127, name: tekst } geven, kreeg: ",
    "v.een_host_frame_tekenfunctie_gooit": "een host.frame-tekenfunctie gooit: ",
    "v.onbundle_null_laat_kanaal_kanalen": "onBundle(null) laat {0} kanaal/kanalen verbonden; ontkoppel wat je verbond (node.disconnect(jouwIngang))",
    "v.onbundle_null_gooit": "onBundle({0}, null) gooit: ",
    "v.getstate_bevat_audionodes_uit_een": "getState() bevat AudioNodes uit een bundel; bewaar sleutel + kanaal-id",
    "v.onbundle_bundel_gooit": "onBundle({0}, bundel) gooit: ",
    "v.multiin_instance_onbundle_poortid_sleutel": "multiIn \"{0}\": instance.onBundle(poortId, sleutel, bundel) ontbreekt",
    "v.bundles_kanaal_heeft_geen_audionode": "bundles.{0}: kanaal {1} heeft geen AudioNode in node",
    "v.bundles_kanaal_mist_name": "bundles.{0}: kanaal {1} mist name",
    "v.bundles_dubbele_kanaal_id": "bundles.{0}: dubbele kanaal-id",
    "v.bundles_elk_kanaal_heeft_een": "bundles.{0}: elk kanaal heeft een id (string)",
    "v.bundles_moet_label_channels_id": "bundles.{0} moet {label, channels:[{id, name, node}]} geven",
    "v.bundles_gooit": "bundles.{0}() gooit: ",
    "v.multiout_instance_bundles_ontbreekt": "multiOut \"{0}\": instance.bundles.{1} ontbreekt",
    "v.setstate_gooit_ontbrekende_velden_moeten": "setState({}) gooit (ontbrekende velden moeten standaardwaarden krijgen): ",
    "v.setpreset_gooit": "setPreset({}) gooit: ",
    "v.setpreset_getpreset_herstelt_niet_dezelfde": "setPreset(getPreset()) herstelt niet dezelfde preset",
    "v.setpreset_getpreset_gooit": "setPreset(getPreset()) gooit: ",
    "v.getpreset_is_niet_json_serialiseerbaar": "getPreset() is niet JSON-serialiseerbaar: ",
    "v.getpreset_gooit": "getPreset() gooit: ",
    "v.getpreset_en_setpreset_horen_bij": "getPreset() en setPreset() horen bij elkaar: implementeer beide",
    "v.na_terugzetten_met_setpart_is": "na terugzetten met setPart is de instelling niet hetzelfde als ervoor",
    "v.setpart_verandert_ook_een_ander": "setPart verandert ook een ander instrument",
    "v.setpart_klank_van_neemt_de": "setPart('{0}', klank van '{1}') neemt de klank niet over",
    "v.setpart_kruislings_gooit": "setPart kruislings gooit: ",
    "v.setpart_id_getpart_id_verandert": "setPart(id, getPart(id)) verandert de instelling (moet gelijk blijven)",
    "v.setpart_getpart_gooit": "setPart('{0}', getPart('{1}')) gooit: ",
    "v.getpart_geeft_geen_json_object": "getPart('{0}') geeft geen JSON-object",
    "v.getpart_gooit": "getPart('{0}') gooit: ",
    "v.heeft_geen_name": " heeft geen name",
    "v.parts_instrument": "parts(): instrument ",
    "v.parts_elk_instrument_heeft_een": "parts(): elk instrument heeft een id (string)",
    "v.parts_geeft_geen_lijst_met": "parts() geeft geen lijst met instrumenten",
    "v.parts_gooit": "parts() gooit: ",
    "v.instrumenten_v1_9_ontbreekt_parts": "instrumenten (v1.9): {0}() ontbreekt; parts, getPart en setPart horen bij elkaar",
    "v.werkt_deze_knoppen_niet_bij": "{0} werkt deze knoppen niet bij: {1} — bewaar wat host.ui.knob/select teruggeeft en zet de waarde in setState (knop.set(v), select.value = v)",
    "v.setstate_getstate_herstelt_niet_dezelfde": "setState(getState()) herstelt niet dezelfde state",
    "v.setstate_getstate_gooit": "setState(getState()) gooit: ",
    "v.getstate_is_niet_json_serialiseerbaar": "getState() is niet JSON-serialiseerbaar: ",
    "v.getstate_gooit": "getState() gooit: ",
    "v.ontransport_stop_gooit": "onTransport(stop) gooit: ",
    "v.onevent_gooit_op": "onEvent({0}) gooit op {1}: ",
    "v.onstep_gooit_bij_stap": "onStep() gooit bij stap ",
    "v.ontransport_start_gooit": "onTransport(start) gooit: ",
    "v.onmodsources_gooit": "onModSources() gooit: ",
    "v.onmodtargets_gooit": "onModTargets() gooit: ",
    "v.een_modulator_implementeert_onmodtargets_targets": "een modulator implementeert onModTargets(targets)",
    "v.een_modulator_heeft_minstens_n": "een modulator heeft minstens één ports.modOut of ports.masteringOut",
    "v.modinput_moet_null_geven_voor": "modInput() moet null geven voor een onbekende of trage parameter",
    "v.modinput_onbekend_gooit": "modInput(onbekend) gooit: ",
    "v.modinput_moet_een_audionode_of": "modInput({0}) moet een AudioNode of AudioParam geven (fast:true)",
    "v.modinput_gooit": "modInput({0}) gooit: ",
    "v.parameters_met_fast_true_vragen": "parameters met fast:true vragen modInput(paramId)",
    "v.modulate_moet_onbekende_ids_negeren": "modulate() moet onbekende ids negeren en {} accepteren: ",
    "v.modulate_alles_gooit": "modulate(alles {0}) gooit: ",
    "v.params_moet_gewone_data_zijn": "params() moet gewone data zijn",
    "v.params_drift_moet_tussen_0": "params(): {0}.drift moet tussen 0 en 1 liggen",
    "v.params_heeft_min_max_nodig": "params(): {0} heeft min < max nodig",
    "v.params_elke_parameter_heeft_een": "params(): elke parameter heeft een id (string)",
    "v.params_moet_een_niet_lege": "params() moet een niet-lege lijst geven",
    "v.params_gooit": "params() gooit: ",
    "v.params_en_modulate_horen_bij": "params() en modulate() horen bij elkaar: implementeer beide",
    "v.mount_gooit": "mount() gooit: ",
    "v.outputs_ontbreekt_of_is_geen": "outputs.{0} ontbreekt of is geen AudioNode",
    "v.inputs_ontbreekt_of_is_geen": "inputs.{0} ontbreekt of is geen AudioNode",
    "v.inputs_outputs_moeten_objecten_zijn": "inputs/outputs moeten objecten zijn",
    "v.instance_ontbreekt": "instance.{0} ontbreekt",
    "v.create_gooit": "create() gooit: ",
    "v.maakt_een_eigen_audiocontext": "maakt een eigen AudioContext",
    "v.importeert_andere_modules_alles_moet": "importeert andere modules; alles moet in één bestand",
    "v.gebruikt_ctx_destination_maar_kind": "gebruikt ctx.destination maar kind is niet output",
    "v.dubbele_poort_id_in": "dubbele poort-id in {0}",
    "v.ongeldige_poort_id_in": "ongeldige poort-id in {0}",
    "v.ports_moet_een_lijst_zijn": "ports.{0} moet een lijst zijn",
    "v.ui_minwidth_moet_tussen_200": "ui.minWidth moet tussen 200 en ui.width liggen",
    "v.ui_width_moet_tussen_200": "ui.width moet tussen 200 en 6000 liggen",
    "v.version_moet_semver_zijn_x": "version moet semver zijn (x.y.z)",
    "v.id_moet_reverse_dns_zijn": "id moet reverse-DNS zijn, bv. nl.naam.instrument",
    "v.veld_ontbreekt": "veld \"{0}\" ontbreekt",
    "v.geen_default_export": "geen default export",
    "v.module_laadt_niet": "module laadt niet: ",
    "v.keuze": "keuze ",
    "v.jack_poort_bestaat_niet_in": "jack(): poort \"{0}\" ({1}) bestaat niet in de huidige poorten",
    "v.jack_richting_moet_in_of": "jack(): richting moet 'in' of 'out' zijn",
    "v.setports_outputs_bestaat_nog_niet": "setPorts(): outputs.{0} bestaat nog niet; zet eerst de AudioNode klaar",
    "v.setports_inputs_bestaat_nog_niet": "setPorts(): inputs.{0} bestaat nog niet; zet eerst de AudioNode klaar",
    "v.setports_ports_moet_een_lijst": "setPorts(): ports.{0} moet een lijst zijn",
    "v.setports_dubbele_poort_id_in": "setPorts(): dubbele poort-id in {0}",
    "v.setports_ongeldige_poort_id_in": "setPorts(): ongeldige poort-id in {0}",
    "v.setports_ports_ontbreekt": "setPorts(): ports ontbreekt",
    "v.host_connect_is_geen_eigen": "host.connect(): \"{0}\" is geen eigen {1}-uitgang",
    "v.host_frame_fps_moet_een": "host.frame(): fps moet een getal > 0 zijn",
    "v.host_frame_geef_een_functie": "host.frame(): geef een functie",
    "v.host_bundlechanged_is_geen_multiout": "host.bundleChanged(): \"{0}\" is geen multiOut-poort",
    "v.host_loadworklet_code_moet_registerprocessor": "host.loadWorklet(): code moet registerProcessor(...) bevatten",
    "v.host_loadworklet_geef_een_naam": "host.loadWorklet(): geef een naam",
    "v.host_modsignal_node_moet_een": "host.modSignal(): node moet een AudioNode zijn",
    "v.host_modulate_offset_moet_een": "host.modulate(): offset {0} moet een getal tussen -1 en 1 zijn",
    "v.host_modulate_offsets_moet_een": "host.modulate(): offsets moet een object zijn",
    "v.gebruik_node_validate_instrument_mjs": "gebruik: node validate-instrument.mjs bestand.patchkamer-device.js [--lang nl|en] [--controls] [--clip]"
  },
  en: {
    "v.fout_prefix": "ERROR:",
    "v.i18n_object": "i18n must be an object with a language code per key (e.g. { en: { name: '…' } })",
    "v.i18n_taal_object": "i18n.{0} must be an object",
    "v.i18n_name": "i18n.{0}.name must be a non-empty string",
    "v.i18n_ports": "i18n.{0}.ports must be an object (port id → name)",
    "v.i18n_poort_onbekend": "i18n.{0}.ports.{1}: this port id does not exist in ports",
    "v.i18n_poortnaam": "i18n.{0}.ports.{1} must be a non-empty string",
    "v.faalt_met_host_lang": "the device fails with host.lang = \"{0}\": {1}",
    "v.ok_breedte": ", width {0} px",
    "v.ok_poorten": ", ports: audio {0}→{1}, events {2}→{3}, state {4} bytes, sources started {5}",
    "v.ok_jacks": ", {0} jacks",
    "v.ok_setports": ", {0}× setPorts",
    "v.ok_gebeurtenissen": ", {0} events",
    "v.ok_params_sporen": ", {0} modulatable parameters in {1} lanes",
    "v.ok_params_spoor": ", {0} modulatable parameters in {1} lane",
    "v.ok_snel": ", {0} fast",
    "v.ok_modulator": ", modulator",
    "v.ok_modsignal": " (modSignal {0}×)",
    "v.ok_worklets": ", {0} worklets",
    "v.ok_worklet": ", {0} worklet",
    "v.ok_bundel_uit": ", bundle out {0} channels",
    "v.ok_bundel_in": ", bundle in",
    "v.ok_mastering_uit": ", mastering out (director)",
    "v.ok_multievent_uit": ", multi-MIDI out ({0} tracks)",
    "v.ok_multievent_in": ", multi-MIDI in",
    "v.host_eventbundlechanged_is_geen_multieventout": "host.eventBundleChanged(): \"{0}\" is not a multiEventOut port",
    "v.gebeurtenis_ch_moet_een_geheel_getal": "event: ch must be an integer from 1 to 16 (got {0})",
    "v.gebeurtenis_cc_moet_een_geheel_getal": "event: cc must be an integer from 0 to 127 (got {0})",
    "v.gebeurtenis_op_multieventout_mist_track": "event on multiEventOut \"{0}\" is missing track (the id of a track from eventBundles)",
    "v.multieventout_instance_eventbundles_ontbreekt": "multiEventOut \"{0}\": instance.eventBundles.{1} is missing",
    "v.eventbundles_gooit": "eventBundles.{0} throws: ",
    "v.eventbundles_moet_label_tracks_id": "eventBundles.{0} must return { label, tracks: [{ id, name, ch }] }",
    "v.eventbundles_elk_spoor_heeft_een": "eventBundles.{0}: every track has an id (non-empty text)",
    "v.eventbundles_dubbele_spoor_id": "eventBundles.{0}: duplicate track id",
    "v.eventbundles_spoor_name": "eventBundles.{0}: track \"{1}\" has a name that is not text",
    "v.eventbundles_spoor_ch": "eventBundles.{0}: track \"{1}\" has a ch outside 0 to 16",
    "v.multieventin_instance_oneventbundle_poortid_sleutel": "multiEventIn \"{0}\": instance.onEventBundle(portId, key, bundle) is missing",
    "v.oneventbundle_gooit": "onEventBundle() throws on \"{0}\": ",
    "v.onevent_gooit_op_multieventin": "onEvent() throws on multiEventIn \"{0}\": ",
    "v.oneventbundle_null_gooit": "onEventBundle(null) throws on \"{0}\": ",
    "v.ok_mastering_in": ", mastering in (target)",
    "v.host_mastering_onbekende_actie": "host.mastering(): unknown action \"{0}\" (choose inspect, apply, analyse, accept or undo)",
    "v.host_mastering_geen_masteringout": "host.mastering(): the device has no masteringOut port",
    "v.masteringout_instance_onmasteringtargets_ontbreekt": "masteringOut: instance.onMasteringTargets(targets) is missing",
    "v.onmasteringtargets_gooit": "onMasteringTargets() throws: ",
    "v.masteringin_instance_configuremastering_ontbreekt": "masteringIn: instance.configureMastering(patch) is missing",
    "v.mastering_methode_gooit": "{0}() throws: ",
    "v.mastering_methode_object": "{0}() must return an object (for example {ok, changed, skipped})",
    "v.getmasteringreport_niet_json": "getMasteringReport() must be JSON-serialisable and must not contain AudioNodes",
    "v.ok_preset": ", own preset {0} bytes",
    "v.ok_instrumenten": ", {0} instruments for tunes",
    "v.ok_knoppen": ", {0} host knobs follow setState",
    "v.ctl_prefix": " · warning: ",
    "v.ctl_opties": "{0}: the host.ui options must be an object ({ id, role, group }); ignored",
    "v.ctl_id_vorm": "{0}: id \"{1}\" must be 1 to 60 characters from [A-Za-z0-9._-]; ignored",
    "v.ctl_id_dubbel": "id \"{0}\" is used by more than one control ({1}); an id is unique within a device",
    "v.ctl_id_ontbreekt": "{0} control(s) without an id while others have one: {1}",
    "v.ctl_rol": "{0}: role \"{1}\" is not in the list ({2}); the host treats it as the default role",
    "v.ctl_groep": "{0}: group \"{1}\" must be 1 to 60 characters from [A-Za-z0-9._-]; ignored",
    "v.ctl_adopt_element": "host.ui.adopt() received no element",
    "v.ctl_adopt_model": "{0}: this element has no model (input range/checkbox, select or button); an id without a control does nothing",
    "v.ctl_los": "{0}: id \"{1}\" is on an element that is not attached anywhere in the card",
    "v.ctl_id_taal": "the ids differ per host.lang ({0}); an id is the state key, never a label",
    "v.ok_regelaars": ", {0} controls with an id",
    "v.ctl_geen": "(no controls via host.ui or data-pk-*)",
    "v.ctl_titel": "Controls ({0}):",
    "v.ctl_kop": "id | role | group | label nl/en | range | face | in params()",
    "v.ctl_zonder_id": "(no id)",
    "v.meter_aantal": ", {0} meters",
    "v.meter_opts": "{0}: the host.ui.meter options must be an object; ignored",
    "v.meter_optie": "{0}: meter option {1} is invalid (expected {2}); the host uses the default",
    "v.meter_source": "host.ui.meter(): source must be an AnalyserNode or a list of 1 or 2 AnalyserNodes (ctx.createAnalyser()); the host never creates or connects nodes",
    "v.meter_rms_zonder_source": "{0}: kind 'rms' only works with source; without source the device computes the level itself and passes it to set()",
    "v.meter_set": "{0}: set() expects a finite number or a list [l, r]; ignored",
    "v.meter_attr": "{0}: data-pk-role=\"meter\" on your own element is not supported; a meter needs the host's face, use host.ui.meter",
    "v.meter_suffix": "{0}: data-pk-suffix must be text of at most 16 characters",
    "v.pad_aantal": ", {0} pads",
    "v.display_aantal": ", {0} displays",
    "v.pad_opts": "{0}: the host.ui.pad options must be an object; ignored",
    "v.pad_optie": "{0}: pad option {1} is invalid (expected {2}); the host uses the default",
    "v.pad_color": "{0}: color must be a hex colour #rrggbb (got {1}); the host cannot draw any other colour form",
    "v.pad_geen_handler": "{0}: a momentary pad with neither onpress nor onchange does nothing; give one of the two",
    "v.steps_opts": "{0}: the 5th argument of host.ui.steps must be an object { id, group, role, color }; ignored",
    "v.display_opts": "{0}: the host.ui.display options must be an object; ignored",
    "v.display_optie": "{0}: display option {1} is invalid (expected {2}); the host uses the default",
    "v.display_waarde": "{0}: value \"{1}\" is not in items; the host picks the first item",
    "v.mod_ontbreekt": "{0} continuous control(s) are not in params(): {1} (§8: add them, or list them in modExclude if they are deliberately left out)",
    "v.mod_geen_params": "{0} continuous control(s) but no params() (kind {1}): modulators cannot control this device: {2} (§8: add params() and modulate(), or set modExclude: '*' if that is deliberate)",
    "v.mod_param_zonder": "params(): {0} id(s) without a control or state key: {1} (a typo? modulate ignores unknown ids)",
    "v.mod_exclude_vorm": "modExclude must be a list of ids (strings), or '*' (§8)",
    "v.mod_ja": "yes",
    "v.mod_nee": "no",
    "v.mod_uit": "excluded",
    "v.ctl_label_is": "label",
    "v.ok_tekent_frame": ", draws via host.frame",
    "v.ok_tekent_poort": ", draws via the drawing gate",
    "v.ok_besturing": ", control (peers/connect)",
    "v.waarschuwing_raf": " · warning: own requestAnimationFrame without host.frame (v1.7, §12b)",
    "v.waarschuwing_naam": " · warning: the file name should end in .patchkamer-device.js (v1.10, §2)",
    "v.ui_jacks_is_aan_maar": "ui.jacks is on but no host.ui.jack() was placed",
    "v.emit_op_onbekende_eventout_poort": "emit on unknown eventOut port \"{0}\"",
    "v.na_destroy_staan_er_nog": "after destroy() {0} host.frame subscription(s) are still open; call the cancel function in unmount()/destroy()",
    "v.destroy_gooit_moet_idempotent_zijn": "destroy() throws (must be idempotent): ",
    "v.onpeers_gooit": "onPeers() throws: ",
    "v.clip_horen_bij": "clipboard (v1.17): {0}() is missing; clipInfo, getClip and setClip belong together",
    "v.clipinfo_gooit": "clipInfo() throws: ",
    "v.clipinfo_ongeldig": "clipInfo() must return null or a JSON object, got: ",
    "v.clipinfo_state": "clipInfo() changes the state (it must be light and free of side effects)",
    "v.clipinfo_soorten": "clipInfo(): copy and paste must be lists of 'notes' and/or 'drums', got: ",
    "v.clipinfo_lengte": "clipInfo(): length.min, max, step and current must be numbers (1 to 12288 ticks), got: ",
    "v.getclip_gooit": "getClip() throws: ",
    "v.getclip_json": "getClip() does not return a JSON object or null (or contains AudioNodes): ",
    "v.getclip_state": "getClip() changes the state (no side effects)",
    "v.clip_ongeldig": "getClip() does not return a valid patchkamer-clip: ",
    "v.clipf_format": "format must be 'patchkamer-clip' and formatVersion 1",
    "v.clipf_kind": "kind must be 'notes' or 'drums'",
    "v.clipf_length": "length must be an integer from 1 to 12288 ticks (12 ticks per sixteenth)",
    "v.clipf_notes": "kind 'notes' needs a list notes (at most 4096)",
    "v.clipf_note": "note {0}: t (0 to length-1), n (0 to 127), len (>= 1) and vel (0.01 to 1) must be proper integers/numbers",
    "v.clipf_drums": "kind 'drums' needs a list lanes (at most 64) and a list hits (at most 4096)",
    "v.clipf_hit": "hit {0}: t (0 to length-1), lane (an existing lane) and vel (0.01 to 1) must be valid",
    "v.clipf_name": "name must be text (when present)",
    "v.setclip_gooit": "setClip() throws on {0}: ",
    "v.setclip_resultaat": "setClip() must return { ok: true } or { ok: false, reason: text }, got: {0} (on {1})",
    "v.setclip_half": "setClip() with {0} returned ok:false but still changed the state (set nothing halfway)",
    "v.setclip_state": "after setClip() with {0} the state is not valid JSON without NaN or Infinity: ",
    "v.setclip_rondreis": "setClip(getClip()) changes the state (it must stay the same)",
    "v.setclip_events": "setClip() sends events itself (host.emit); only the clock does that",
    "v.waarschuwing_clip_afgewezen": " · warning: the device itself rejects setClip(getClip()) (ok:false)",
    "v.ok_klembord": ", clipboard (clipInfo/getClip/setClip)",
    "v.clip_titel": "Clipboard (--clip):",
    "v.clip_geen": "(no clipInfo/getClip/setClip)",
    "v.clip_nul": "(null)",
    "v.notenames_gooit": "noteNames() throws: ",
    "v.notenames_ongeldig": "noteNames() must return a list of { note: 0..127, name: text }, got: ",
    "v.een_host_frame_tekenfunctie_gooit": "a host.frame draw function throws: ",
    "v.onbundle_null_laat_kanaal_kanalen": "onBundle(null) leaves {0} channel(s) connected; disconnect what you connected (node.disconnect(yourInput))",
    "v.onbundle_null_gooit": "onBundle({0}, null) throws: ",
    "v.getstate_bevat_audionodes_uit_een": "getState() contains AudioNodes from a bundle; store key + channel id",
    "v.onbundle_bundel_gooit": "onBundle({0}, bundle) throws: ",
    "v.multiin_instance_onbundle_poortid_sleutel": "multiIn \"{0}\": instance.onBundle(portId, key, bundle) is missing",
    "v.bundles_kanaal_heeft_geen_audionode": "bundles.{0}: channel {1} has no AudioNode in node",
    "v.bundles_kanaal_mist_name": "bundles.{0}: channel {1} is missing name",
    "v.bundles_dubbele_kanaal_id": "bundles.{0}: duplicate channel id",
    "v.bundles_elk_kanaal_heeft_een": "bundles.{0}: every channel has an id (string)",
    "v.bundles_moet_label_channels_id": "bundles.{0} must return {label, channels:[{id, name, node}]}",
    "v.bundles_gooit": "bundles.{0}() throws: ",
    "v.multiout_instance_bundles_ontbreekt": "multiOut \"{0}\": instance.bundles.{1} is missing",
    "v.setstate_gooit_ontbrekende_velden_moeten": "setState({}) throws (missing fields must get default values): ",
    "v.setpreset_gooit": "setPreset({}) throws: ",
    "v.setpreset_getpreset_herstelt_niet_dezelfde": "setPreset(getPreset()) does not restore the same preset",
    "v.setpreset_getpreset_gooit": "setPreset(getPreset()) throws: ",
    "v.getpreset_is_niet_json_serialiseerbaar": "getPreset() is not JSON-serializable: ",
    "v.getpreset_gooit": "getPreset() throws: ",
    "v.getpreset_en_setpreset_horen_bij": "getPreset() and setPreset() belong together: implement both",
    "v.na_terugzetten_met_setpart_is": "after restoring with setPart the setting is not the same as before",
    "v.setpart_verandert_ook_een_ander": "setPart also changes another instrument",
    "v.setpart_klank_van_neemt_de": "setPart('{0}', sound of '{1}') does not take over the sound",
    "v.setpart_kruislings_gooit": "setPart crosswise throws: ",
    "v.setpart_id_getpart_id_verandert": "setPart(id, getPart(id)) changes the setting (it must stay the same)",
    "v.setpart_getpart_gooit": "setPart('{0}', getPart('{1}')) throws: ",
    "v.getpart_geeft_geen_json_object": "getPart('{0}') does not return a JSON object",
    "v.getpart_gooit": "getPart('{0}') throws: ",
    "v.heeft_geen_name": " has no name",
    "v.parts_instrument": "parts(): instrument ",
    "v.parts_elk_instrument_heeft_een": "parts(): every instrument has an id (string)",
    "v.parts_geeft_geen_lijst_met": "parts() does not return a list of instruments",
    "v.parts_gooit": "parts() throws: ",
    "v.instrumenten_v1_9_ontbreekt_parts": "instruments (v1.9): {0}() is missing; parts, getPart and setPart belong together",
    "v.werkt_deze_knoppen_niet_bij": "{0} does not update these knobs: {1} — keep what host.ui.knob/select returns and set the value in setState (knob.set(v), select.value = v)",
    "v.setstate_getstate_herstelt_niet_dezelfde": "setState(getState()) does not restore the same state",
    "v.setstate_getstate_gooit": "setState(getState()) throws: ",
    "v.getstate_is_niet_json_serialiseerbaar": "getState() is not JSON-serializable: ",
    "v.getstate_gooit": "getState() throws: ",
    "v.ontransport_stop_gooit": "onTransport(stop) throws: ",
    "v.onevent_gooit_op": "onEvent({0}) throws on {1}: ",
    "v.onstep_gooit_bij_stap": "onStep() throws at step ",
    "v.ontransport_start_gooit": "onTransport(start) throws: ",
    "v.onmodsources_gooit": "onModSources() throws: ",
    "v.onmodtargets_gooit": "onModTargets() throws: ",
    "v.een_modulator_implementeert_onmodtargets_targets": "a modulator implements onModTargets(targets)",
    "v.een_modulator_heeft_minstens_n": "a modulator has at least one ports.modOut or ports.masteringOut",
    "v.modinput_moet_null_geven_voor": "modInput() must return null for an unknown or slow parameter",
    "v.modinput_onbekend_gooit": "modInput(unknown) throws: ",
    "v.modinput_moet_een_audionode_of": "modInput({0}) must return an AudioNode or AudioParam (fast:true)",
    "v.modinput_gooit": "modInput({0}) throws: ",
    "v.parameters_met_fast_true_vragen": "parameters with fast:true require modInput(paramId)",
    "v.modulate_moet_onbekende_ids_negeren": "modulate() must ignore unknown ids and accept {}: ",
    "v.modulate_alles_gooit": "modulate(all {0}) throws: ",
    "v.params_moet_gewone_data_zijn": "params() must be plain data",
    "v.params_drift_moet_tussen_0": "params(): {0}.drift must be between 0 and 1",
    "v.params_heeft_min_max_nodig": "params(): {0} needs min < max",
    "v.params_elke_parameter_heeft_een": "params(): every parameter has an id (string)",
    "v.params_moet_een_niet_lege": "params() must return a non-empty list",
    "v.params_gooit": "params() throws: ",
    "v.params_en_modulate_horen_bij": "params() and modulate() belong together: implement both",
    "v.mount_gooit": "mount() throws: ",
    "v.outputs_ontbreekt_of_is_geen": "outputs.{0} is missing or is not an AudioNode",
    "v.inputs_ontbreekt_of_is_geen": "inputs.{0} is missing or is not an AudioNode",
    "v.inputs_outputs_moeten_objecten_zijn": "inputs/outputs must be objects",
    "v.instance_ontbreekt": "instance.{0} is missing",
    "v.create_gooit": "create() throws: ",
    "v.maakt_een_eigen_audiocontext": "creates its own AudioContext",
    "v.importeert_andere_modules_alles_moet": "imports other modules; everything must be in one file",
    "v.gebruikt_ctx_destination_maar_kind": "uses ctx.destination but kind is not output",
    "v.dubbele_poort_id_in": "duplicate port id in {0}",
    "v.ongeldige_poort_id_in": "invalid port id in {0}",
    "v.ports_moet_een_lijst_zijn": "ports.{0} must be a list",
    "v.ui_minwidth_moet_tussen_200": "ui.minWidth must be between 200 and ui.width",
    "v.ui_width_moet_tussen_200": "ui.width must be between 200 and 6000",
    "v.version_moet_semver_zijn_x": "version must be semver (x.y.z)",
    "v.id_moet_reverse_dns_zijn": "id must be reverse-DNS, e.g. nl.name.instrument",
    "v.veld_ontbreekt": "field \"{0}\" is missing",
    "v.geen_default_export": "no default export",
    "v.module_laadt_niet": "module does not load: ",
    "v.keuze": "choice ",
    "v.jack_poort_bestaat_niet_in": "jack(): port \"{0}\" ({1}) does not exist in the current ports",
    "v.jack_richting_moet_in_of": "jack(): direction must be 'in' or 'out'",
    "v.setports_outputs_bestaat_nog_niet": "setPorts(): outputs.{0} does not exist yet; put the AudioNode in place first",
    "v.setports_inputs_bestaat_nog_niet": "setPorts(): inputs.{0} does not exist yet; put the AudioNode in place first",
    "v.setports_ports_moet_een_lijst": "setPorts(): ports.{0} must be a list",
    "v.setports_dubbele_poort_id_in": "setPorts(): duplicate port id in {0}",
    "v.setports_ongeldige_poort_id_in": "setPorts(): invalid port id in {0}",
    "v.setports_ports_ontbreekt": "setPorts(): ports is missing",
    "v.host_connect_is_geen_eigen": "host.connect(): \"{0}\" is not an own {1} output",
    "v.host_frame_fps_moet_een": "host.frame(): fps must be a number > 0",
    "v.host_frame_geef_een_functie": "host.frame(): pass a function",
    "v.host_bundlechanged_is_geen_multiout": "host.bundleChanged(): \"{0}\" is not a multiOut port",
    "v.host_loadworklet_code_moet_registerprocessor": "host.loadWorklet(): code must contain registerProcessor(...)",
    "v.host_loadworklet_geef_een_naam": "host.loadWorklet(): pass a name",
    "v.host_modsignal_node_moet_een": "host.modSignal(): node must be an AudioNode",
    "v.host_modulate_offset_moet_een": "host.modulate(): offset {0} must be a number between -1 and 1",
    "v.host_modulate_offsets_moet_een": "host.modulate(): offsets must be an object",
    "v.gebruik_node_validate_instrument_mjs": "usage: node validate-instrument.mjs file.patchkamer-device.js [--lang nl|en] [--controls] [--clip]"
  }
};
function vt(key, ...a) { const s = (V[LANG] && V[LANG][key]) ?? V.nl[key]; if (s == null) return '\u27e6' + key + '\u27e7'; return a.length ? s.replace(/\{(\d+)\}/g, (m, i) => String(a[+i])) : s; }
if (!['nl', 'en'].includes(LANG) || !['nl', 'en'].includes(HOSTLANG)) { console.error('--lang / --host-lang: nl | en'); process.exit(2); }
const file = rest[0];
if (!file) { console.error(vt('v.gebruik_node_validate_instrument_mjs')); process.exit(2); }
const fail = m => { console.error(vt('v.fout_prefix') + ' ' + m); process.exit(1); };

// ---------- fake Web Audio ----------
const param = () => ({ _isParam: true, value: 0, setValueAtTime(){}, linearRampToValueAtTime(){}, exponentialRampToValueAtTime(){}, setTargetAtTime(){}, cancelScheduledValues(){}, cancelAndHoldAtTime(){}, setValueCurveAtTime(){} });
let started = 0, stopped = 0;
const node = () => ({ _isNode: true, _to: new Set(), connect(n){ this._to.add(n); return n; }, disconnect(n){ if (n === undefined) this._to.clear(); else this._to.delete(n); }, start(){ started++; }, stop(){ stopped++; }, setPeriodicWave(){}, addEventListener(){}, removeEventListener(){}, onended: null,
  gain: param(), frequency: param(), Q: param(), detune: param(), pan: param(), delayTime: param(), threshold: param(), ratio: param(), knee: param(), attack: param(), release: param(), offset: param(), playbackRate: param(),
  type: '', fftSize: 2048, frequencyBinCount: 1024, smoothingTimeConstant: 0.8, oversample: 'none', curve: null, buffer: null, loop: false, loopStart: 0, loopEnd: 0, normalize: true,
  getByteTimeDomainData(){}, getByteFrequencyData(){}, getFloatTimeDomainData(){}, getFloatFrequencyData(){} });
const ctx = { currentTime: 0, sampleRate: 44100, state: 'running', destination: node(), resume: async () => {}, suspend: async () => {},
  createGain: node, createOscillator: node, createBiquadFilter: node, createDelay: node, createConvolver: node, createDynamicsCompressor: node, createAnalyser: () => Object.assign(node(), { _isAnalyser: true }), createStereoPanner: node, createWaveShaper: node, createBufferSource: node, createConstantSource: node, createChannelMerger: node, createChannelSplitter: node,
  createBuffer: (ch, len) => ({ numberOfChannels: ch, length: len, getChannelData: () => new Float32Array(Math.min(len || 1024, 1 << 16)) }),
  createMediaStreamDestination: () => Object.assign(node(), { stream: {} }), createPeriodicWave: () => ({}),
  audioWorklet: { addModule: async () => {} } };
// AudioWorkletNode: parameters als Map van AudioParams, een port die niets doet
globalThis.AudioWorkletNode = class { constructor(c, name, opts) { Object.assign(this, node()); this.port = { postMessage(){}, onmessage: null, start(){}, close(){}, addEventListener(){} }; const P = new Map(); this.parameters = { get: k => { if (!P.has(k)) P.set(k, param()); return P.get(k); }, has: () => true, forEach(){} }; } };

// ---------- regelaarsregister (v1.15): wat het apparaat via host.ui.* of data-pk-* herkenbaar maakt ----------
const ALL_EL = [];            // alle elementen die het apparaat (of de nep-host) maakt, voor de attribuutscan
let ctlBuilt = false;         // true na create()+mount(): daarna gebouwde regelaars (herbouw) tellen niet mee voor "dubbel"
const CTL = [];               // { id, role, group, label, type, min, max, face, items, via, built, el }
const CTL_ROLES = ['param', 'fader', 'toggle', 'button', 'pad', 'step', 'display', 'select', 'meter', 'jack'];
const CTL_WARN = [], CTL_SEEN = new Set();
const ctlWarn = (key, ...a) => { const t = vt(key, ...a); if (!CTL_SEEN.has(t)) { CTL_SEEN.add(t); CTL_WARN.push(t); } };
const ID_RE = /^[A-Za-z0-9._-]{1,60}$/;
const tagOf = e => String(e && e.tagName || '').toUpperCase();
const typeOf = e => { const t = tagOf(e), ty = String((e && (e.type || (e.attributes && e.attributes.type))) || '').toLowerCase();
  if (t === 'SELECT') return 'select'; if (t === 'BUTTON') return 'button'; if (t === 'INPUT') return ty === 'range' ? 'range' : ty === 'checkbox' ? 'check' : null; return null; };
const defRole = type => type === 'range' ? 'param' : type === 'check' ? 'toggle' : type === 'button' ? 'button' : 'select';
// controleert de opties { id, role, group } van een aanroep; geeft de geldige waarden terug
function ctlOpts(where, o, type) {
  const r = { id: null, role: defRole(type), group: null };
  if (o === undefined || o === null) return r;
  if (typeof o !== 'object' || Array.isArray(o)) { ctlWarn('v.ctl_opties', where); return r; }
  if (o.id !== undefined) { if (typeof o.id === 'string' && ID_RE.test(o.id)) r.id = o.id; else ctlWarn('v.ctl_id_vorm', where, String(o.id).slice(0, 40)); }
  if (o.role !== undefined) { if (CTL_ROLES.includes(o.role)) r.role = o.role; else ctlWarn('v.ctl_rol', where, String(o.role).slice(0, 40), CTL_ROLES.join(', ')); }
  if (o.group !== undefined) { if (typeof o.group === 'string' && ID_RE.test(o.group)) r.group = o.group; else ctlWarn('v.ctl_groep', where, String(o.group).slice(0, 40)); }
  return r;
}
function ctlAdd(e) { if (e.built === undefined) e.built = !ctlBuilt; if (!e.built && (e.id ? CTL.some(x => x.id === e.id) : CTL.some(x => !x.id && x.label === e.label && x.type === e.type))) return null;   // een herbouw (Mixer-achtig render()) vervangt: niet dubbel melden of tellen
  CTL.push(e); return e; }
const lbl = l => String(l == null ? '' : l);
const ctlLabelOf = e => lbl(e.attributes && e.attributes['aria-label'] || e.title || e.textContent || '');

// ---------- fake DOM (permissive: enough for real device UIs, including shadow roots) ----------
const classList = () => { const s = new Set(); return { add: (...c) => c.forEach(x => s.add(x)), remove: (...c) => c.forEach(x => s.delete(x)), toggle: (c, f) => { const on = f === undefined ? !s.has(c) : !!f; on ? s.add(c) : s.delete(c); return on; }, contains: c => s.has(c) }; };
function el(tag = 'div') {
  const ids = new Map();
  const e = {
    tagName: String(tag).toUpperCase(), nodeType: 1, children: [], childNodes: [], style: { setProperty(){}, removeProperty(){} }, dataset: {}, classList: classList(), attributes: {},
    textContent: '', innerText: '', value: '', checked: false, disabled: false, hidden: false, title: '', id: '', className: '', type: '', min: '', max: '', step: '', htmlFor: '', tabIndex: 0,
    width: 300, height: 150, clientWidth: 300, clientHeight: 150, offsetWidth: 300, offsetHeight: 150, scrollWidth: 300, scrollHeight: 150,
    parentElement: null, parentNode: null, shadowRoot: null,
    get firstChild(){ return this.children[0] || null; }, get lastChild(){ return this.children[this.children.length - 1] || null; },
    setAttribute(k, v){ this.attributes[k] = String(v); }, getAttribute(k){ return this.attributes[k] ?? null; }, removeAttribute(k){ delete this.attributes[k]; }, hasAttribute(k){ return k in this.attributes; },
    appendChild(c){ this.children.push(c); this.childNodes.push(c); if (c && typeof c === 'object') { c.parentElement = this; c.parentNode = this; } return c; },
    append(...cs){ cs.forEach(c => this.appendChild(c)); }, prepend(...cs){ cs.forEach(c => this.appendChild(c)); }, insertBefore(c){ return this.appendChild(c); }, replaceChildren(...cs){ this.children = []; cs.forEach(c => this.appendChild(c)); },
    removeChild(c){ this.children = this.children.filter(x => x !== c); this.childNodes = this.childNodes.filter(x => x !== c); return c; }, remove(){}, replaceWith(){}, cloneNode(){ return el(tag); },
    addEventListener(t, f){ (this._ls || (this._ls = [])).push([t, f]); }, removeEventListener(t, f){ if (this._ls) this._ls = this._ls.filter(x => x[0] !== t || x[1] !== f); }, dispatchEvent(){ return true; }, focus(){}, blur(){}, click(){ if (typeof this.onclick === 'function') this.onclick({ preventDefault(){}, stopPropagation(){} }); }, select(){},
    setPointerCapture(){}, releasePointerCapture(){}, scrollIntoView(){}, closest(){ return null; }, matches(){ return false; },
    querySelector(){ return el('div'); }, querySelectorAll(){ return []; }, getElementsByTagName(){ return []; }, getElementsByClassName(){ return []; },
    getElementById(id){ if (!ids.has(id)) { const x = el('div'); x.parentElement = x.parentNode = el('div'); x.id = id; ids.set(id, x); } return ids.get(id); },   // elements from markup always have a parent
    getBoundingClientRect(){ return { left: 0, top: 0, right: 300, bottom: 150, width: 300, height: 150, x: 0, y: 0 }; },
    getContext(){ return new Proxy({}, { get: (t, k) => (k in t ? t[k] : () => ({ addColorStop(){} })), set: (t, k, v) => { t[k] = v; return true; } }); },
    attachShadow(){ const r = el('#shadow-root'); this.shadowRoot = r; r.host = this; return r; },
    set innerHTML(v){ this._html = String(v); }, get innerHTML(){ return this._html || ''; },
    options: [], selectedIndex: 0, files: [], add(){},
  };
  e._built = !ctlBuilt; ALL_EL.push(e);
  return e;
}
globalThis.document = { createElement: el, createElementNS: (ns, t) => el(t), createTextNode: t => ({ nodeType: 3, textContent: t }), createDocumentFragment: () => el('#fragment'), getElementById: () => el('div'), querySelector: () => el('div'), querySelectorAll: () => [], addEventListener(){}, removeEventListener(){}, body: el('body'), documentElement: el('html') };
globalThis.window = globalThis;
globalThis.requestAnimationFrame = () => 0; globalThis.cancelAnimationFrame = () => {};
globalThis.ResizeObserver = class { observe(){} unobserve(){} disconnect(){} };
globalThis.devicePixelRatio = 1;
globalThis.getComputedStyle = () => ({ getPropertyValue: () => '' });
if (!globalThis.performance) globalThis.performance = { now: () => Date.now() };
const realSetTimeout = setTimeout; globalThis.setTimeout = (f, ms) => 0; globalThis.clearTimeout = () => {}; globalThis.setInterval = () => 0; globalThis.clearInterval = () => {};

// ---------- fake host ----------
let frames = [], peerCalls = 0, connects = 0;
const FAKE_PEERS = [{ id: 'd90', name: 'Testsynth', def: 'nl.test.synth', version: '1.0.0', kind: 'instrument', category: 'synth', eventIn: [{ id: 'notes', name: 'Noten' }], mod: true, selected: true, noteNames: [{ note: 36, name: 'Kick' }] },
  { id: 'd91', name: 'Testeffect', def: 'nl.test.fx', version: '1.0.0', kind: 'effect', category: 'effect', eventIn: [], mod: true, selected: false }];
let masteringCalls = 0, masteringBad = null, emitted = [], tempo = null, curPorts = null, jacks = 0, portChanges = 0, modSent = 0, modBad = null, sigCalls = 0, worklets = 0, bundleCalls = 0;
let METERS = 0, PADS = 0;
const HEX_RE = /^#[0-9a-fA-F]{6}$/;
const KNOBS = [];   // {label, sets} — alles wat via host.ui.knob/select gemaakt is
const PL = (P, k) => Array.isArray(P[k]) ? P[k] : [];
const host = { ctx, lang: HOSTLANG, audio: { sampleRate: 48000, quality: 'normal', oversample: '2x', latency: 'interactive' }, bpm: 120, swing: 0, emit(inst, port, ev) { emitted.push({ port, ev }); }, setTempo(b) { tempo = b; },
  modulate(inst, targetId, offsets) { modSent++; if (!offsets || typeof offsets !== 'object') modBad = vt('v.host_modulate_offsets_moet_een'); else for (const k in offsets) if (!(typeof offsets[k] === 'number' && isFinite(offsets[k]) && offsets[k] >= -1 && offsets[k] <= 1)) modBad = vt('v.host_modulate_offset_moet_een',k); },
  paramsChanged() {},
  // v1.4
  modSignal(inst, targetId, paramId, n) { sigCalls++; if (n === null) return false; if (!n || typeof n.connect !== 'function') modBad = vt('v.host_modsignal_node_moet_een'); return paramId === 'a'; },
  loadWorklet(name, code) { worklets++; if (typeof name !== 'string' || !name) modBad = vt('v.host_loadworklet_geef_een_naam'); if (typeof code !== 'string' || !/registerProcessor\s*\(/.test(code)) modBad = vt('v.host_loadworklet_code_moet_registerprocessor'); return Promise.resolve(true); },
  // v1.5
  bundleChanged(inst, port) { bundleCalls++; if (!PL(curPorts || d.ports, 'multiOut').some(p => p.id === port)) modBad = vt('v.host_bundlechanged_is_geen_multiout',port); },
  isWired() { return false; },
  // v1.12
  // v1.13
  eventBundleChanged(inst, port) { if (!PL(curPorts || d.ports, 'multiEventOut').some(p => p.id === port)) modBad = vt('v.host_eventbundlechanged_is_geen_multieventout',port); },
  controls() { return []; }, setControl() { return false; },
  // v1.21
  watchParams() { return false; }, setParam() { return false; }, lockParams() { return false; }, paramsOf() { return []; },
  // v1.14
  noteNamesChanged() {},
  mastering(inst, action, opts) { masteringCalls++; if (!['inspect', 'apply', 'analyse', 'accept', 'undo'].includes(action)) masteringBad = vt('v.host_mastering_onbekende_actie',action); if (!PL(curPorts || d.ports, 'masteringOut').length) masteringBad = vt('v.host_mastering_geen_masteringout'); return { changed: 0, results: [] }; },
  // v1.7
  frame(inst, cb, fps) { if (typeof cb !== 'function') { modBad = vt('v.host_frame_geef_een_functie'); return () => {}; } if (fps !== undefined && !(+fps > 0)) modBad = vt('v.host_frame_fps_moet_een');
    const e = { cb, off: false }; frames.push(e); return () => { e.off = true; }; },
  visible() { return true; },
  peers() { peerCalls++; return FAKE_PEERS.map(p => ({ ...p, eventIn: p.eventIn.slice() })); },
  connect(inst, from, tid, to, kind) { connects++; const k = kind === 'mod' ? 'mod' : kind === 'audio' ? 'audio' : 'event'; if (!PL(curPorts || d.ports, k + 'Out').some(p => p.id === from)) modBad = vt('v.host_connect_is_geen_eigen',from,k); return true; },
  disconnect() { return 0; },
  cablesFrom() { return []; },
  saveFile: async () => 'saved',
  stepDur: () => 0.125,
  setPorts(inst, ports) {   // contract v1.2: dynamic ports; every listed audio port must already have its AudioNode
    if (!ports || typeof ports !== 'object') fail(vt('v.setports_ports_ontbreekt'));
    for (const k of ['audioIn', 'audioOut', 'eventIn', 'eventOut']) { if (!Array.isArray(ports[k])) fail(vt('v.setports_ports_moet_een_lijst',k)); const ids = ports[k].map(p => p.id); if (ids.some(x => !/^[a-z0-9_-]+$/.test(x || ''))) fail(vt('v.setports_ongeldige_poort_id_in',k)); if (new Set(ids).size !== ids.length) fail(vt('v.setports_dubbele_poort_id_in',k)); }
    for (const k of ['modIn', 'modOut', 'multiIn', 'multiOut', 'masteringIn', 'masteringOut', 'multiEventIn', 'multiEventOut']) if (ports[k] !== undefined && !Array.isArray(ports[k])) fail(vt('v.setports_ports_moet_een_lijst',k));
    for (const p of ports.audioIn) if (!inst.inputs[p.id] || !inst.inputs[p.id]._isNode) fail(vt('v.setports_inputs_bestaat_nog_niet',p.id));
    for (const p of ports.audioOut) if (!inst.outputs[p.id] || !inst.outputs[p.id]._isNode) fail(vt('v.setports_outputs_bestaat_nog_niet',p.id));
    curPorts = ports; portChanges++; },
  ui: { jack(inst, parent, id, dir) { const P = curPorts || d.ports; const L = dir === 'out' ? [...P.audioOut, ...P.eventOut, ...PL(P, 'modOut'), ...PL(P, 'multiOut'), ...PL(P, 'masteringOut'), ...PL(P, 'multiEventOut')] : dir === 'in' ? [...P.audioIn, ...P.eventIn, ...PL(P, 'modIn'), ...PL(P, 'multiIn'), ...PL(P, 'masteringIn'), ...PL(P, 'multiEventIn'), ...(inst && typeof inst.params === 'function' ? [{ id: 'mod' }] : [])] : fail(vt('v.jack_richting_moet_in_of')); if (!L.some(p => p.id === id)) fail(vt('v.jack_poort_bestaat_niet_in',id,dir)); jacks++; const e = el('div'); e.className = 'port jack'; if (parent && parent.appendChild) parent.appendChild(e); return e; },
    knob: (parent, label, range, value, fmt, onchange, o) => { const k = { label: 'knop ' + label, sets: 0 }; KNOBS.push(k);
      const r = ctlOpts(lbl(label), o, 'range'), box = el('div'), input = el('input'); input.type = 'range'; box._pk = input._pk = true;
      if (Array.isArray(range)) { input.min = String(range[0]); input.max = String(range[1]); input.step = String(range[2]); }
      if (parent && parent.appendChild) parent.appendChild(box); box.appendChild(input);
      ctlAdd({ ...r, label: lbl(label), type: 'range', min: Array.isArray(range) ? range[0] : null, max: Array.isArray(range) ? range[1] : null, face: 'rotary', via: 'knob', el: box, inp: input, onchange });
      return { set(){ k.sets++; }, el: box, input, id: r.id || undefined }; },
    select: (parent, label, opts, val, onchange, o) => { const k = { label: vt('v.keuze') + label, sets: 0 }; KNOBS.push(k); const s = el('select'); let v = val; Object.defineProperty(s, 'value', { get: () => v, set: x => { v = x; k.sets++; } });
      s._pk = true; if (parent && parent.appendChild) parent.appendChild(s); const r = ctlOpts(lbl(label), o, 'select');
      ctlAdd({ ...r, label: lbl(label), type: 'select', min: null, max: null, face: 'select', items: Array.isArray(opts) ? opts.map(x => Array.isArray(x) ? x[0] : x) : [], via: 'select', el: s }); return s; },
    adopt(e, o) { if (!e || typeof e !== 'object') { ctlWarn('v.ctl_adopt_element'); return e; }
      const type = typeOf(e), name = lbl(o && o.label || ctlLabelOf(e)) || (tagOf(e).toLowerCase() + (e.id ? '#' + e.id : ''));
      const r = ctlOpts(name, o, type || 'range'); if (!type) ctlWarn(o && o.role === 'meter' ? 'v.meter_attr' : 'v.ctl_adopt_model', name);
      if (r.id) { e.setAttribute('data-pk-id', r.id); e.dataset.pkId = r.id; } if (r.group) { e.setAttribute('data-pk-group', r.group); e.dataset.pkGroup = r.group; }
      e.setAttribute('data-pk-role', r.role); e.dataset.pkRole = r.role; e._pk = true;
      if (type) ctlAdd({ ...r, label: name, type, min: type === 'range' && e.min !== '' ? +e.min : null, max: type === 'range' && e.max !== '' ? +e.max : null, face: type === 'range' ? 'hslider' : type, via: 'adopt', el: e });
      return e; },
    list() { return CTL.map(c => ({ id: c.id, role: c.role, group: c.group, label: c.label, type: c.type, min: c.min, max: c.max, face: c.face })); },
    // v1.18: host.ui.meter(parent, label, opts) -> { el, set, id, destroy }
    meter(parent, label, o) { const name = lbl(label) || 'meter'; METERS++;
      if (o !== undefined && o !== null && (typeof o !== 'object' || Array.isArray(o))) { ctlWarn('v.meter_opts', name); o = {}; } o = o || {};
      const bad = (k, want) => ctlWarn('v.meter_optie', name, k, want);
      let id = null, group = null;
      if (o.id !== undefined) { if (typeof o.id === 'string' && ID_RE.test(o.id)) id = o.id; else ctlWarn('v.ctl_id_vorm', name, String(o.id).slice(0, 40)); }
      if (o.group !== undefined) { if (typeof o.group === 'string' && ID_RE.test(o.group)) group = o.group; else ctlWarn('v.ctl_groep', name, String(o.group).slice(0, 40)); }
      let hasSrc = false;
      if (o.source !== undefined) { const L = Array.isArray(o.source) ? o.source : [o.source];
        if (L.length < 1 || L.length > 2 || L.some(x => !x || !x._isAnalyser)) throw new Error(vt('v.meter_source')); hasSrc = true; }
      let range = [-60, 0];
      if (o.range !== undefined) { if (Array.isArray(o.range) && o.range.length === 2 && o.range.every(x => typeof x === 'number' && isFinite(x)) && o.range[0] < o.range[1]) range = o.range.slice(); else bad('range', '[minDb, maxDb]'); }
      if (o.unit !== undefined && !['linear', 'db'].includes(o.unit)) bad('unit', "'linear' | 'db'");
      if (o.kind !== undefined) { if (!['peak', 'rms'].includes(o.kind)) bad('kind', "'peak' | 'rms'"); else if (o.kind === 'rms' && !hasSrc) ctlWarn('v.meter_rms_zonder_source', name); }
      if (o.hold !== undefined && typeof o.hold !== 'boolean') bad('hold', 'true | false');
      if (o.clip !== undefined && !(typeof o.clip === 'number' && isFinite(o.clip))) bad('clip', 'dB');
      if (o.orientation !== undefined && !['vertical', 'horizontal'].includes(o.orientation)) bad('orientation', "'vertical' | 'horizontal'");
      for (const k of ['length', 'width']) if (o[k] !== undefined && !(typeof o[k] === 'number' && isFinite(o[k]) && o[k] > 0)) bad(k, 'px > 0');
      const box = el('div'); box._pk = true; box.setAttribute('role', 'meter'); box.setAttribute('aria-label', name); if (id) { box.setAttribute('data-pk-id', id); box.dataset.pkId = id; } box.setAttribute('data-pk-role', 'meter'); box.dataset.pkRole = 'meter';
      if (parent && parent.appendChild) parent.appendChild(box);
      ctlAdd({ id, role: 'meter', group, label: name, type: 'meter', min: range[0], max: range[1], face: 'bar', via: 'meter', el: box });
      let gone = false;
      return { el: box, id: id || undefined,
        set(level) { if (gone) return; const ok = x => typeof x === 'number' && isFinite(x); if (!(ok(level) || (Array.isArray(level) && level.length >= 1 && level.length <= 2 && level.every(ok)))) ctlWarn('v.meter_set', name); },
        destroy() { gone = true; } }; },
    // v1.22: host.ui.pad(parent, label, opts) -> { el, set, flash, id, destroy }
    pad(parent, label, o) { const name = lbl(label) || 'pad'; PADS++;
      if (o !== undefined && o !== null && (typeof o !== 'object' || Array.isArray(o))) { ctlWarn('v.pad_opts', name); o = {}; } o = o || {};
      const r = ctlOpts(name, { id: o.id, role: o.role !== undefined ? o.role : 'pad', group: o.group }, 'button');
      const bad = (k, want) => ctlWarn('v.pad_optie', name, k, want);
      if (o.mode !== undefined && !['momentary', 'toggle'].includes(o.mode)) bad('mode', "'momentary' | 'toggle'");
      if (o.on !== undefined && typeof o.on !== 'boolean') bad('on', 'true | false');
      for (const k of ['onpress', 'onrelease', 'onchange']) if (o[k] !== undefined && typeof o[k] !== 'function') bad(k, 'function');
      for (const k of ['text', 'title']) if (o[k] !== undefined && typeof o[k] !== 'string') bad(k, 'text');
      if (o.color !== undefined && !(typeof o.color === 'string' && HEX_RE.test(o.color))) throw new Error(vt('v.pad_color', name, JSON.stringify(o.color).slice(0, 40)));
      const toggle = o.mode === 'toggle';
      if (!toggle && typeof o.onpress !== 'function' && typeof o.onchange !== 'function') ctlWarn('v.pad_geen_handler', name);
      const box = el('button'); box._pk = true; box.setAttribute('role', 'button'); box.setAttribute('aria-label', name); if (toggle) box.setAttribute('aria-pressed', String(!!o.on));
      if (r.id) { box.setAttribute('data-pk-id', r.id); box.dataset.pkId = r.id; } box.setAttribute('data-pk-role', r.role); box.dataset.pkRole = r.role;
      if (parent && parent.appendChild) parent.appendChild(box);
      ctlAdd({ ...r, label: name, type: 'pad', min: null, max: null, face: 'rounded', via: 'pad', el: box });
      let gone = false;
      return { el: box, id: r.id || undefined,
        set(on) { if (!gone && toggle) box.setAttribute('aria-pressed', String(!!on)); },
        flash() {},
        destroy() { gone = true; } }; },
    // v1.22: host.ui.display(parent, label, opts) -> { el, set, get, value, items, id, destroy }; het model is een verborgen <select> (el.select)
    display(parent, label, o) { const name = lbl(label) || 'display';
      if (o !== undefined && o !== null && (typeof o !== 'object' || Array.isArray(o))) { ctlWarn('v.display_opts', name); o = {}; } o = o || {};
      const r = ctlOpts(name, { id: o.id, role: o.role !== undefined ? o.role : 'select', group: o.group }, 'select');
      const bad = (k, want) => ctlWarn('v.display_optie', name, k, want);
      let items = [];
      if (o.items !== undefined) { if (Array.isArray(o.items) && o.items.every(x => Array.isArray(x) && x.length >= 2)) items = o.items.map(x => [x[0], x[1]]); else bad('items', '[[waarde, tekst], …]'); }
      if (o.kind !== undefined && !['select', 'preset'].includes(o.kind)) bad('kind', "'select' | 'preset'");
      if (o.wrap !== undefined && typeof o.wrap !== 'boolean') bad('wrap', 'true | false');
      if (o.searchAt !== undefined && !(Number.isInteger(o.searchAt) && o.searchAt >= 1)) bad('searchAt', 'integer >= 1');
      if (o.onchange !== undefined && typeof o.onchange !== 'function') bad('onchange', 'function');
      if (o.value !== undefined && items.length && !items.some(x => String(x[0]) === String(o.value))) ctlWarn('v.display_waarde', name, String(o.value).slice(0, 40));
      const k = { label: vt('v.keuze') + name, sets: 0 }; KNOBS.push(k);
      const s = el('select'); let v = o.value !== undefined ? o.value : items.length ? items[0][0] : ''; Object.defineProperty(s, 'value', { get: () => v, set: x => { v = x; k.sets++; } });
      s._pk = true; const box = el('div'); box._pk = true; box.select = s; box.appendChild(s); if (parent && parent.appendChild) parent.appendChild(box);
      ctlAdd({ ...r, label: name, type: 'select', min: null, max: null, face: 'dropdown', items: items.map(x => x[0]), via: 'display', el: s });
      let gone = false;
      return { el: box, id: r.id || undefined, set(x) { if (!gone) s.value = x; }, get() { return s.value; },
        get value() { return s.value; }, set value(x) { if (!gone) s.value = x; }, items(list) { if (Array.isArray(list)) items = list; }, destroy() { gone = true; } }; },
    // v1.22: host.ui.steps(parent, label, arr, onchange, opts?) met opts { id, group, role, color }
    steps: (parent, label, arr, onchange, o) => { const name = lbl(label) || 'steps'; let r = null;
      if (o !== undefined && o !== null) {
        if (typeof o !== 'object' || Array.isArray(o)) ctlWarn('v.steps_opts', name);
        else { r = ctlOpts(name, { id: o.id, role: o.role !== undefined ? o.role : 'step', group: o.group }, 'button');
          if (o.color !== undefined && !(typeof o.color === 'string' && HEX_RE.test(o.color))) throw new Error(vt('v.pad_color', name, JSON.stringify(o.color).slice(0, 40)));
          const box = el('div'); box._pk = true; ctlAdd({ ...r, label: name, type: 'steps', min: null, max: null, face: 'rounded', via: 'steps', el: box }); } }
      return { btns: [], paint(){}, cursor(){}, id: r && r.id || undefined }; },
    noise: () => node(), curve: () => new Float32Array(16) } };

// ---------- load + static checks ----------
const src = readFileSync(file, 'utf8');
const mod = await import(pathToFileURL(file).href).catch(e => fail(vt('v.module_laadt_niet') + e.message));
const d = mod.default; if (!d) fail(vt('v.geen_default_export'));
for (const k of ['id', 'name', 'version', 'kind', 'ports', 'create']) if (d[k] === undefined) fail(vt('v.veld_ontbreekt',k));
if (!/^[a-z0-9]+(\.[a-z0-9-]+)+$/.test(d.id)) fail(vt('v.id_moet_reverse_dns_zijn'));
if (!/^\d+\.\d+\.\d+$/.test(d.version)) fail(vt('v.version_moet_semver_zijn_x'));
if (!['instrument', 'effect', 'mixer', 'output', 'utility', 'modulator'].includes(d.kind)) fail('onbekende kind');
if (d.ui !== undefined && (typeof d.ui !== 'object' || (d.ui.width !== undefined && !(d.ui.width >= 200 && d.ui.width <= 6000)))) fail(vt('v.ui_width_moet_tussen_200'));
if (d.category !== undefined && !['synth', 'groove', 'sequencer', 'mod', 'effect', 'mix', 'tool', 'mastering'].includes(d.category)) fail('onbekende category (synth, groove, sequencer, mod, effect, mix, tool of mastering)');
if (d.ui && d.ui.minWidth !== undefined && !(d.ui.minWidth >= 200 && d.ui.minWidth <= (d.ui.width || 300))) fail(vt('v.ui_minwidth_moet_tussen_200'));
for (const k of ['modIn', 'modOut', 'multiIn', 'multiOut', 'masteringIn', 'masteringOut', 'multiEventIn', 'multiEventOut']) if (d.ports[k] === undefined) d.ports[k] = [];
for (const k of ['audioIn', 'audioOut', 'eventIn', 'eventOut', 'modIn', 'modOut', 'multiIn', 'multiOut', 'masteringIn', 'masteringOut', 'multiEventIn', 'multiEventOut']) { if (!Array.isArray(d.ports[k])) fail(vt('v.ports_moet_een_lijst_zijn',k)); const ids = d.ports[k].map(p => p.id); if (ids.some(x => !/^[a-z0-9_-]+$/.test(x || ''))) fail(vt('v.ongeldige_poort_id_in',k)); if (new Set(ids).size !== ids.length) fail(vt('v.dubbele_poort_id_in',k)); }
if (d.i18n !== undefined) {   // v1.11: optionele namen per taal
  if (!d.i18n || typeof d.i18n !== 'object' || Array.isArray(d.i18n)) fail(vt('v.i18n_object'));
  const portIds = new Set(['audioIn', 'audioOut', 'eventIn', 'eventOut', 'modIn', 'modOut', 'multiIn', 'multiOut', 'masteringIn', 'masteringOut', 'multiEventIn', 'multiEventOut'].flatMap(k => (d.ports[k] || []).map(p => p.id)));
  for (const [lang, o] of Object.entries(d.i18n)) {
    if (!o || typeof o !== 'object' || Array.isArray(o)) fail(vt('v.i18n_taal_object', lang));
    if (o.name !== undefined && (typeof o.name !== 'string' || !o.name)) fail(vt('v.i18n_name', lang));
    if (o.ports !== undefined) {
      if (!o.ports || typeof o.ports !== 'object' || Array.isArray(o.ports)) fail(vt('v.i18n_ports', lang));
      for (const [pid, v] of Object.entries(o.ports)) {
        if (!portIds.has(pid)) fail(vt('v.i18n_poort_onbekend', lang, pid));
        if (typeof v !== 'string' || !v) fail(vt('v.i18n_poortnaam', lang, pid)); } } } }
if (d.kind !== 'output' && /\.destination\b/.test(src)) fail(vt('v.gebruikt_ctx_destination_maar_kind'));
if (/\blocalStorage\b|\bsessionStorage\b|\bindexedDB\b/.test(src)) fail('gebruikt browseropslag; state hoort via getState/setState');
if (/\bfetch\s*\(|\bXMLHttpRequest\b|\bWebSocket\b/.test(src)) fail('doet netwerkverkeer');
if (/^\s*import\s/m.test(src) || /\bimport\s*\(/.test(src)) fail(vt('v.importeert_andere_modules_alles_moet'));
if (/new\s+(window\.)?(webkit)?AudioContext/.test(src)) fail(vt('v.maakt_een_eigen_audiocontext'));

// ---------- lifecycle ----------
let inst; try { inst = d.create(ctx, host); } catch (e) { fail(vt('v.create_gooit') + e.message); }
if (inst && typeof inst === 'object' && !inst._id) { inst._id = 'd1'; inst._def = d; }   // zoals de host doet
for (const k of ['mount', 'getState', 'setState', 'destroy']) if (typeof inst[k] !== 'function') fail(vt('v.instance_ontbreekt',k));
if (typeof inst.inputs !== 'object' || typeof inst.outputs !== 'object') fail(vt('v.inputs_outputs_moeten_objecten_zijn'));
for (const p of d.ports.audioIn) if (!inst.inputs[p.id] || !inst.inputs[p.id]._isNode) fail(vt('v.inputs_ontbreekt_of_is_geen',p.id));
for (const p of d.ports.audioOut) if (!inst.outputs[p.id] || !inst.outputs[p.id]._isNode) fail(vt('v.outputs_ontbreekt_of_is_geen',p.id));
let pre; try { pre = inst.getState(); JSON.stringify(pre); } catch (e) { fail('getState() vóór mount faalt: ' + e.message); }
try { inst.mount(el('div')); } catch (e) { fail(vt('v.mount_gooit') + e.message + '\n' + (e.stack || '').split('\n').slice(1, 3).join('\n')); }
const nMountKnobs = KNOBS.length;
ctlBuilt = true;
// ---------- contract v1.3: modulation ----------
let nParams = 0, nLanes = 0, nFast = 0, PARAMS = null;
if (inst.params !== undefined || inst.modulate !== undefined) {
  if (typeof inst.params !== 'function' || typeof inst.modulate !== 'function') fail(vt('v.params_en_modulate_horen_bij'));
  let P; try { P = inst.params(); } catch (e) { fail(vt('v.params_gooit') + e.message); }
  if (!Array.isArray(P) || !P.length) fail(vt('v.params_moet_een_niet_lege'));
  const seen = new Set();
  for (const p of P) { if (!p || typeof p.id !== 'string' || !p.id) fail(vt('v.params_elke_parameter_heeft_een')); if (seen.has(p.id)) fail(`params(): dubbele id ${p.id}`); seen.add(p.id);
    if (typeof p.name !== 'string') fail(`params(): ${p.id} mist name`); if (typeof p.min !== 'number' || typeof p.max !== 'number' || !(p.max > p.min)) fail(vt('v.params_heeft_min_max_nodig',p.id));
    if (p.drift !== undefined && !(p.drift >= 0 && p.drift <= 1)) fail(vt('v.params_drift_moet_tussen_0',p.id)); if (p.scale !== undefined && !['lin', 'log'].includes(p.scale)) fail(`params(): ${p.id}.scale is lin of log`); }
  try { JSON.stringify(P); } catch (e) { fail(vt('v.params_moet_gewone_data_zijn')); }
  nParams = P.length; nLanes = new Set(P.map(p => p.lane || '')).size; PARAMS = P;
  for (const v of [1, -1, 0.37]) { try { inst.modulate(Object.fromEntries(P.map(p => [p.id, v]))); } catch (e) { fail(vt('v.modulate_alles_gooit',v) + e.message); } }
  try { inst.modulate({ onbekend: 0.5 }); inst.modulate({}); } catch (e) { fail(vt('v.modulate_moet_onbekende_ids_negeren') + e.message); }
  // contract v1.4: snelle parameters
  const fast = P.filter(p => p.fast); nFast = fast.length;
  if (fast.length) { if (typeof inst.modInput !== 'function') fail(vt('v.parameters_met_fast_true_vragen'));
    for (const p of fast) { let n; try { n = inst.modInput(p.id); } catch (e) { fail(vt('v.modinput_gooit',p.id) + e.message); } if (!n || !(n._isNode || n._isParam)) fail(vt('v.modinput_moet_een_audionode_of',p.id)); }
    let u; try { u = inst.modInput('onbekend'); } catch (e) { fail(vt('v.modinput_onbekend_gooit') + e.message); } if (u != null) fail(vt('v.modinput_moet_null_geven_voor')); }
}
if (d.kind === 'modulator') {
  if (!d.ports.modOut.length && !d.ports.masteringOut.length) fail(vt('v.een_modulator_heeft_minstens_n'));
  if (d.ports.modOut.length && typeof inst.onModTargets !== 'function') fail(vt('v.een_modulator_implementeert_onmodtargets_targets'));
  inst._id = 'm1';
  const fakeT = [{ id: 'd9', name: 'Test', def: 'nl.test.x', version: '1.0.0', params: [{ id: 'a', name: 'A', lane: 'x', laneName: 'X', min: 0, max: 1, role: 'filter', drift: 0.1, on: true }, { id: 'b', name: 'B', lane: 'y', min: 20, max: 20000, scale: 'log' }] }];
  if (d.ports.modOut.length) try { inst.onModTargets([]); inst.onModTargets(fakeT); inst.onModTargets(fakeT); } catch (e) { fail(vt('v.onmodtargets_gooit') + e.message); }
  if (inst.onModSources) { try { inst.onModSources([]); } catch (e) { fail(vt('v.onmodsources_gooit') + e.message); } }
}
// contract v1.12: mastering. masteringOut (regie): onMasteringTargets; masteringIn (doel): configureMastering (en optioneel de rest).
if (d.ports.masteringOut.length) {
  if (typeof inst.onMasteringTargets !== 'function') fail(vt('v.masteringout_instance_onmasteringtargets_ontbreekt'));
  inst._id = inst._id || 'm1';
  const fakeM = [{ id: 'd9', name: 'Test', def: 'nl.test.x', version: '1.0.0' }];
  try { inst.onMasteringTargets([]); inst.onMasteringTargets(fakeM); inst.onMasteringTargets(fakeM); inst.onMasteringTargets([]); } catch (e) { fail(vt('v.onmasteringtargets_gooit') + e.message); }
}
if (d.ports.masteringIn.length) {
  if (typeof inst.configureMastering !== 'function') fail(vt('v.masteringin_instance_configuremastering_ontbreekt'));
  for (const [m, a] of [['configureMastering', [{}]], ['configureMastering', [null]], ['configureMastering', [{ onbekend: 1, x: NaN }]], ['analyseMastering', []], ['acceptMasteringProposal', []], ['getMasteringReport', []]]) {
    if (typeof inst[m] !== 'function') continue;
    let r; try { r = inst[m](...a); } catch (e) { fail(vt('v.mastering_methode_gooit',m) + e.message); }
    if (m === 'getMasteringReport') { try { JSON.stringify(r); } catch (e) { fail(vt('v.getmasteringreport_niet_json')); } if (JSON.stringify(r || {}).includes('_isNode')) fail(vt('v.getmasteringreport_niet_json')); }
    else if (r != null && typeof r !== 'object') fail(vt('v.mastering_methode_object',m));
  }
}
// contract v1.13: multi-MIDI. multiEventOut (bron): eventBundles[poort]; multiEventIn (ontvanger): onEventBundle.
let nTracks = 0;
for (const p of d.ports.multiEventOut) {
  const b = inst.eventBundles && inst.eventBundles[p.id]; if (!b) fail(vt('v.multieventout_instance_eventbundles_ontbreekt',p.id,p.id));
  let v; try { v = typeof b === 'function' ? b() : b; } catch (e) { fail(vt('v.eventbundles_gooit',p.id) + e.message); }
  if (!v || !Array.isArray(v.tracks)) fail(vt('v.eventbundles_moet_label_tracks_id',p.id));
  const ids = v.tracks.map(t => t && t.id); if (ids.some(x => typeof x !== 'string' || !x)) fail(vt('v.eventbundles_elk_spoor_heeft_een',p.id)); if (new Set(ids).size !== ids.length) fail(vt('v.eventbundles_dubbele_spoor_id',p.id));
  for (const t of v.tracks) { if (t.name !== undefined && typeof t.name !== 'string') fail(vt('v.eventbundles_spoor_name',p.id,t.id)); if (t.ch !== undefined && !(Number.isInteger(t.ch) && t.ch >= 0 && t.ch <= 16)) fail(vt('v.eventbundles_spoor_ch',p.id,t.id)); }
  nTracks += v.tracks.length;
}
for (const p of d.ports.multiEventIn) {
  if (typeof inst.onEventBundle !== 'function') fail(vt('v.multieventin_instance_oneventbundle_poortid_sleutel',p.id));
  const tr = n => Array.from({ length: n }, (_, i) => ({ id: 't' + i, name: 'Spoor ' + i, ch: i + 1 })), key = 'd9:tracks';
  const mk = t => ({ key, source: { id: 'd9', port: 'tracks', name: 'Test' }, label: 'Test', tracks: t });
  try { inst.onEventBundle(p.id, key, mk(tr(3))); inst.onEventBundle(p.id, key, mk(tr(5))); inst.onEventBundle(p.id, 'd8:tracks', { ...mk(tr(2)), key: 'd8:tracks' }); inst.onEventBundle(p.id, key, mk([])); } catch (e) { fail(vt('v.oneventbundle_gooit',p.id) + e.message); }
  if (inst.onEvent) { try { inst.onEvent(p.id, { type: 'note', note: 60, vel: 0.8, time: 1, dur: 0.1, track: 't0', ch: 1, bundle: key }); inst.onEvent(p.id, { type: 'cc', id: 'x', cc: 74, value: 0.5, time: 1, track: 't1', ch: 2, bundle: key }); } catch (e) { fail(vt('v.onevent_gooit_op_multieventin',p.id) + e.message); } }
  try { inst.onEventBundle(p.id, key, null); inst.onEventBundle(p.id, 'd8:tracks', null); } catch (e) { fail(vt('v.oneventbundle_null_gooit',p.id) + e.message); }
  let js; try { js = JSON.stringify(inst.getState()); } catch (e) { fail('getState() na onEventBundle faalt: ' + e.message); }
}
if (inst.onTransport) { try { inst.onTransport({ playing: true }); } catch (e) { fail(vt('v.ontransport_start_gooit') + e.message); } }
if (inst.onStep) for (let s = 0; s < 32; s++) { ctx.currentTime = s * 0.125; try { inst.onStep({ step: s % 16, bar: Math.floor(s / 16), time: 0.1 + s * 0.125, stepDur: 0.125, bpm: 120, swing: 0 }); } catch (e) { fail(vt('v.onstep_gooit_bij_stap') + s + ': ' + e.message); } }
if (inst.onEvent) for (const ev of [{ type: 'note', note: 60, vel: 0.8, time: 4.5, dur: 0.2 }, { type: 'note', note: 63, vel: 1, time: 4.6, dur: 0.2 }, { type: 'trig', lane: 'kick', vel: 1, time: 4.7 }, { type: 'cc', id: 'cutoff', value: 0.5, time: 4.8 }, { type: 'onbekend', time: 4.9 }])
  for (const p of (d.ports.eventIn.length ? d.ports.eventIn : [{ id: 'in' }])) { try { inst.onEvent(p.id, ev); } catch (e) { fail(vt('v.onevent_gooit_op',p.id,ev.type) + e.message); } }
if (inst.onTransport) { try { inst.onTransport({ playing: false }); } catch (e) { fail(vt('v.ontransport_stop_gooit') + e.message); } }
let st; try { st = inst.getState(); } catch (e) { fail(vt('v.getstate_gooit') + e.message); }
let json; try { json = JSON.stringify(st); } catch (e) { fail(vt('v.getstate_is_niet_json_serialiseerbaar') + e.message); }
if (json.includes('_isNode')) fail('getState() bevat AudioNodes');
try { inst.setState(JSON.parse(json)); } catch (e) { fail(vt('v.setstate_getstate_gooit') + e.message); }
let st2; try { st2 = JSON.stringify(inst.getState()); } catch (e) { fail('getState() na setState faalt: ' + e.message); }
const norm = s => s.replace(/"(driftT|gen|walk|wv|ph)":[^,}\]]+/g, '');   // drifting clocks may advance; compare the rest
if (norm(st2) !== norm(json)) fail(vt('v.setstate_getstate_herstelt_niet_dezelfde'));
// contract v1.6: knoppen volgen setState (presets en versiewissel leunen daarop)
const knobCheck = (how, fn) => { const before = KNOBS.length; KNOBS.forEach(k => { k.sets = 0; }); fn(); const fresh = KNOBS.length > before;
  const stale = KNOBS.slice(0, before).filter(k => !k.sets).map(k => k.label);
  if (!fresh && stale.length) fail(vt('v.werkt_deze_knoppen_niet_bij',how,stale.join(', '))); };
knobCheck('setState(getState())', () => inst.setState(JSON.parse(json)));
// contract v1.6: presets
let nParts = 0;
if (inst.parts !== undefined || inst.getPart !== undefined || inst.setPart !== undefined) {
  for (const k of ['parts', 'getPart', 'setPart']) if (typeof inst[k] !== 'function') fail(vt('v.instrumenten_v1_9_ontbreekt_parts',k));
  let L; try { L = inst.parts(); } catch (e) { fail(vt('v.parts_gooit') + e.message); }
  if (!Array.isArray(L) || !L.length) fail(vt('v.parts_geeft_geen_lijst_met'));
  const ids = new Set();
  for (const p of L) { if (!p || typeof p.id !== 'string' || !p.id) fail(vt('v.parts_elk_instrument_heeft_een')); if (ids.has(p.id)) fail('parts(): dubbel id ' + p.id); ids.add(p.id); if (typeof p.name !== 'string') fail(vt('v.parts_instrument') + p.id + vt('v.heeft_geen_name')); }
  const before = JSON.stringify(inst.getState());
  for (const p of L.slice(0, 24)) { let d; try { d = JSON.stringify(inst.getPart(p.id)); } catch (e) { fail(vt('v.getpart_gooit',p.id) + e.message); } if (!d || d === 'null' || d.includes('_isNode')) fail(vt('v.getpart_geeft_geen_json_object',p.id));
    try { inst.setPart(p.id, JSON.parse(d)); } catch (e) { fail(vt('v.setpart_getpart_gooit',p.id,p.id) + e.message); } }
  if (norm(JSON.stringify(inst.getState())) !== norm(before)) fail(vt('v.setpart_id_getpart_id_verandert'));
  if (L.length > 1) { const a0 = JSON.stringify(inst.getPart(L[0].id)), b0 = JSON.stringify(inst.getPart(L[1].id));
    try { inst.setPart(L[0].id, JSON.parse(b0)); } catch (e) { fail(vt('v.setpart_kruislings_gooit') + e.message); }
    if (norm(JSON.stringify(inst.getPart(L[0].id))) !== norm(b0)) fail(vt('v.setpart_klank_van_neemt_de',L[0].id,L[1].id));
    if (norm(JSON.stringify(inst.getPart(L[1].id))) !== norm(b0)) fail(vt('v.setpart_verandert_ook_een_ander'));
    inst.setPart(L[0].id, JSON.parse(a0)); if (norm(JSON.stringify(inst.getState())) !== norm(before)) fail(vt('v.na_terugzetten_met_setpart_is')); }
  nParts = L.length;
}
let presetBytes = 0;
if (inst.getPreset !== undefined || inst.setPreset !== undefined) {
  if (typeof inst.getPreset !== 'function' || typeof inst.setPreset !== 'function') fail(vt('v.getpreset_en_setpreset_horen_bij'));
  let p; try { p = inst.getPreset(); } catch (e) { fail(vt('v.getpreset_gooit') + e.message); }
  let pj; try { pj = JSON.stringify(p); } catch (e) { fail(vt('v.getpreset_is_niet_json_serialiseerbaar') + e.message); } if (pj.includes('_isNode')) fail('getPreset() bevat AudioNodes'); presetBytes = pj.length;
  knobCheck('setPreset(getPreset())', () => { try { inst.setPreset(JSON.parse(pj)); } catch (e) { fail(vt('v.setpreset_getpreset_gooit') + e.message); } });
  let p2; try { p2 = JSON.stringify(inst.getPreset()); } catch (e) { fail('getPreset() na setPreset faalt: ' + e.message); }
  if (norm(p2) !== norm(pj)) fail(vt('v.setpreset_getpreset_herstelt_niet_dezelfde'));
  try { inst.setPreset({}); } catch (e) { fail(vt('v.setpreset_gooit') + e.message); }
}
try { inst.setState({}); } catch (e) { fail(vt('v.setstate_gooit_ontbrekende_velden_moeten') + e.message); }
// contract v1.5: bundels uit
let nBundleCh = 0;
for (const p of d.ports.multiOut) {
  const b = inst.bundles && inst.bundles[p.id]; if (!b) fail(vt('v.multiout_instance_bundles_ontbreekt',p.id,p.id));
  let v; try { v = typeof b === 'function' ? b() : b; } catch (e) { fail(vt('v.bundles_gooit',p.id) + e.message); }
  if (!v || !Array.isArray(v.channels)) fail(vt('v.bundles_moet_label_channels_id',p.id));
  const ids = v.channels.map(c => c && c.id); if (ids.some(x => typeof x !== 'string' || !x)) fail(vt('v.bundles_elk_kanaal_heeft_een',p.id)); if (new Set(ids).size !== ids.length) fail(vt('v.bundles_dubbele_kanaal_id',p.id));
  for (const c of v.channels) { if (typeof c.name !== 'string') fail(vt('v.bundles_kanaal_mist_name',p.id,c.id)); if (!c.node || !c.node._isNode) fail(vt('v.bundles_kanaal_heeft_geen_audionode',p.id,c.id)); }
  nBundleCh += v.channels.length;
}
// contract v1.5: bundels in — aansluiten, wijzigen, los; daarna mag niets meer verbonden zijn
for (const p of d.ports.multiIn) {
  if (typeof inst.onBundle !== 'function') fail(vt('v.multiin_instance_onbundle_poortid_sleutel',p.id));
  const ch = n => Array.from({ length: n }, (_, i) => ({ id: 'k' + i, name: 'Kanaal ' + i, node: node() }));
  const B1 = ch(3), B2 = [...B1, ...ch(4).slice(3)], key = 'd9:uit';
  const mk = c => ({ key, source: { id: 'd9', port: 'uit', name: 'Test' }, label: 'Test', channels: c });
  try { inst.onBundle(p.id, key, mk(B1)); inst.onBundle(p.id, key, mk(B2)); inst.onBundle(p.id, 'd8:uit', { ...mk(ch(2)), key: 'd8:uit' }); } catch (e) { fail(vt('v.onbundle_bundel_gooit',p.id) + e.message); }
  let js; try { js = JSON.stringify(inst.getState()); } catch (e) { fail('getState() na onBundle faalt: ' + e.message); } if (js.includes('_isNode')) fail(vt('v.getstate_bevat_audionodes_uit_een'));
  try { inst.onBundle(p.id, key, null); inst.onBundle(p.id, 'd8:uit', null); } catch (e) { fail(vt('v.onbundle_null_gooit',p.id) + e.message); }
  const still = B2.filter(c => c.node._to.size); if (still.length) fail(vt('v.onbundle_null_laat_kanaal_kanalen',still.length));
}
// v1.7: tekenfuncties draaien, onPeers aanroepen
for (const e of frames) if (!e.off) { try { e.cb(16.7); e.cb(50); e.cb(83.3); } catch (err) { fail(vt('v.een_host_frame_tekenfunctie_gooit') + err.message); } }
if (typeof inst.onPeers === 'function') { try { inst.onPeers([]); inst.onPeers(FAKE_PEERS); } catch (e) { fail(vt('v.onpeers_gooit') + e.message); } }
// v1.14: noteNames() is optioneel; als hij er is, een lijst van { note 0..127, name } en hij gooit niet
if (typeof inst.noteNames === 'function') { let l; try { l = inst.noteNames(); } catch (e) { fail(vt('v.notenames_gooit') + e.message); } if (!Array.isArray(l) || l.some(x => !x || !Number.isFinite(x.note) || x.note < 0 || x.note > 127 || typeof x.name !== 'string' || !x.name)) fail(vt('v.notenames_ongeldig') + JSON.stringify(l).slice(0, 80)); }
// v1.17 (§13d): klembord. clipInfo/getClip/setClip: alle drie of geen; JSON; setClip(getClip()) laat de state gelijk; rommel gooit niet en zet niets half.
let clipOn = false, clipWarn = false, clipOutInfo, clipOutClip;
if (inst.clipInfo !== undefined || inst.getClip !== undefined || inst.setClip !== undefined) {
  clipOn = true;
  for (const k of ['clipInfo', 'getClip', 'setClip']) if (typeof inst[k] !== 'function') fail(vt('v.clip_horen_bij', k));
  const stateNow = () => { let x; try { x = JSON.stringify(inst.getState()); } catch (e) { fail(vt('v.getstate_gooit') + e.message); } return norm(x); };
  const short = x => { let t; try { t = JSON.stringify(x); } catch (e) { t = String(x); } return String(t).slice(0, 80); };
  const isInt = (x, lo, hi) => Number.isInteger(x) && x >= lo && x <= hi;
  const nodeless = x => !JSON.stringify(x).includes('_isNode');
  const s0 = stateNow(), e0 = emitted.length;
  // clipInfo(): licht, gooit niet, verandert niets; null of een JSON-object
  let ci; try { ci = inst.clipInfo(); ci = inst.clipInfo(); } catch (e) { fail(vt('v.clipinfo_gooit') + e.message); }
  if (ci !== null && (typeof ci !== 'object' || Array.isArray(ci))) fail(vt('v.clipinfo_ongeldig') + short(ci));
  if (ci) {
    let cj; try { cj = JSON.stringify(ci); } catch (e) { fail(vt('v.clipinfo_ongeldig') + e.message); } if (cj.includes('_isNode')) fail(vt('v.clipinfo_ongeldig') + 'AudioNode');
    for (const k of ['copy', 'paste']) if (ci[k] !== undefined && (!Array.isArray(ci[k]) || ci[k].some(x => x !== 'notes' && x !== 'drums'))) fail(vt('v.clipinfo_soorten') + short(ci[k]));
    if (ci.length !== undefined) { const L = ci.length; if (!L || typeof L !== 'object' || ['min', 'max', 'step', 'current'].some(k => L[k] !== undefined && !(Number.isFinite(L[k]) && L[k] >= 1 && L[k] <= 12288))) fail(vt('v.clipinfo_lengte') + short(L)); }
  }
  if (stateNow() !== s0) fail(vt('v.clipinfo_state'));
  // getClip(): geen bijwerkingen; null of een geldige patchkamer-clip
  const checkClip = c => {
    if (!c || typeof c !== 'object' || Array.isArray(c) || c.format !== 'patchkamer-clip' || c.formatVersion !== 1) return vt('v.clipf_format');
    if (c.kind !== 'notes' && c.kind !== 'drums') return vt('v.clipf_kind');
    if (!isInt(c.length, 1, 12288)) return vt('v.clipf_length');
    if (c.name !== undefined && typeof c.name !== 'string') return vt('v.clipf_name');
    const velOk = v => v === undefined || (typeof v === 'number' && v >= 0.01 && v <= 1);
    if (c.kind === 'notes') {
      if (!Array.isArray(c.notes) || c.notes.length > 4096) return vt('v.clipf_notes');
      for (let i = 0; i < c.notes.length; i++) { const n = c.notes[i]; if (!n || typeof n !== 'object' || !isInt(n.t, 0, c.length - 1) || !isInt(n.n, 0, 127) || !(n.len === undefined || (Number.isInteger(n.len) && n.len >= 1)) || !velOk(n.vel)) return vt('v.clipf_note', i); }
    } else {
      if (!Array.isArray(c.lanes) || c.lanes.length > 64 || !Array.isArray(c.hits) || c.hits.length > 4096) return vt('v.clipf_drums');
      for (let i = 0; i < c.hits.length; i++) { const h = c.hits[i]; if (!h || typeof h !== 'object' || !isInt(h.t, 0, c.length - 1) || !isInt(h.lane, 0, c.lanes.length - 1) || !velOk(h.vel)) return vt('v.clipf_hit', i); }
    }
    return null;
  };
  let gc, gj; try { gc = inst.getClip(); } catch (e) { fail(vt('v.getclip_gooit') + e.message); }
  if (gc !== null) {
    try { gj = JSON.stringify(gc); } catch (e) { fail(vt('v.getclip_json') + e.message); }
    if (gj === undefined || gj.includes('_isNode')) fail(vt('v.getclip_json') + short(gc));
    const bad = checkClip(JSON.parse(gj)); if (bad) fail(vt('v.clip_ongeldig') + bad);
  }
  if (stateNow() !== s0) fail(vt('v.getclip_state'));
  // setClip(getClip()): de state blijft gelijk; het resultaat is { ok, reason }
  const result = (r, what) => { if (!r || typeof r !== 'object' || typeof r.ok !== 'boolean' || (!r.ok && (typeof r.reason !== 'string' || !r.reason))) fail(vt('v.setclip_resultaat', short(r), what)); return r; };
  if (gc !== null) {
    let r; try { r = inst.setClip(JSON.parse(gj)); } catch (e) { fail(vt('v.setclip_gooit', 'getClip()') + e.message); }
    result(r, 'getClip()'); if (!r.ok) clipWarn = true;
    if (stateNow() !== s0) fail(vt('v.setclip_rondreis'));
  }
  // rommel, lege en extreme clips: gooit niet, ok:false laat de state ongemoeid, ok:true laat een bruikbare state achter
  const base = { format: 'patchkamer-clip', formatVersion: 1 };
  const many = n => Array.from({ length: n }, (_, i) => ({ t: i % 192, n: 36 + (i % 60), len: 6, vel: 0.8 }));
  const junk = [['undefined', undefined], ['null', null], ['0', 0], ['"x"', 'x'], ['[]', []], ['{}', {}], ['true', true],
    ['format only', { format: 'patchkamer-clip' }], ['formatVersion 99', { ...base, formatVersion: 99, kind: 'notes', length: 192, notes: [] }],
    ['kind "weird"', { ...base, kind: 'weird', length: 192 }], ['length 0', { ...base, kind: 'notes', length: 0, notes: [] }],
    ['length -5', { ...base, kind: 'notes', length: -5, notes: [] }], ['length 1e9', { ...base, kind: 'notes', length: 1e9, notes: many(8) }],
    ['length NaN', { ...base, kind: 'drums', length: NaN, lanes: [], hits: [] }], ['length "192"', { ...base, kind: 'notes', length: '192', notes: [] }],
    ['empty notes', { ...base, kind: 'notes', length: 192, notes: [] }], ['empty drums', { ...base, kind: 'drums', length: 192, lanes: [], hits: [] }],
    ['notes not a list', { ...base, kind: 'notes', length: 192, notes: 'x' }],
    ['junk items', { ...base, kind: 'notes', length: 192, notes: [null, 7, 'a', [], { t: 'a', n: {} }, { t: NaN, n: Infinity, len: -1, vel: 9 }] }],
    ['out of range', { ...base, kind: 'notes', length: 192, notes: [{ t: -4, n: 300, len: 99999, vel: 50 }, { t: 1e9, n: -9, len: 0, vel: -1 }] }],
    ['5000 notes', { ...base, kind: 'notes', length: 192, notes: many(5000) }], ['100000 notes', { ...base, kind: 'notes', length: 12288, notes: many(100000) }],
    ['hits without lanes', { ...base, kind: 'drums', length: 192, lanes: [], hits: [{ t: 0, lane: 3, vel: 1 }, { t: 5, lane: -1 }] }],
    ['100 lanes', { ...base, kind: 'drums', length: 192, lanes: Array.from({ length: 100 }, (_, i) => ({ id: 'l' + i, name: 'L' + i, note: 36 + (i % 40) })), hits: [{ t: 0, lane: 99, vel: 0.9 }] }],
    ['long names', { ...base, kind: 'notes', name: 'x'.repeat(100000), length: 192, notes: [{ t: 0, n: 60, len: 12, vel: 0.8 }] }],
    ['max length', { ...base, kind: 'notes', length: 12288, notes: [{ t: 12287, n: 127, len: 12288, vel: 1 }, { t: 0, n: 0, len: 1, vel: 0.01 }] }],
    ['unknown fields', { ...base, kind: 'notes', length: 192, zzz: { a: 1 }, notes: [{ t: 0, n: 60, len: 12, vel: 0.8, q: 1 }] }]];
  const finite = (x, seen = 0) => x === null || typeof x !== 'object' ? (typeof x !== 'number' || Number.isFinite(x)) : Object.values(x).every(y => finite(y));
  for (const [what, c] of junk) {
    const before = stateNow(); let r;
    try { r = inst.setClip(c); } catch (e) { fail(vt('v.setclip_gooit', what) + e.message); }
    result(r, what);
    const after = stateNow();
    if (!r.ok && after !== before) fail(vt('v.setclip_half', what));
    let sj; try { sj = inst.getState(); if (!finite(sj)) throw new Error('NaN/Infinity'); JSON.stringify(sj); } catch (e) { fail(vt('v.setclip_state', what) + e.message); }
    try { inst.setState(JSON.parse(JSON.stringify(sj))); } catch (e) { fail(vt('v.setstate_getstate_gooit') + e.message); }
  }
  if (emitted.length !== e0) fail(vt('v.setclip_events'));
  try { inst.setState(JSON.parse(json)); } catch (e) { fail(vt('v.setstate_getstate_gooit') + e.message); }
  clipOutInfo = ci; clipOutClip = gc;
}
// v1.16 (§8): dekking van params(). Welke continue regelaars (range/knop/schuif) zitten in params()? Alleen "let op", nooit een fout.
// Koppeling regelaar -> param: id (host.ui-opties of data-pk-id) > de getState-sleutel die verandert als de waarde wordt verzet > het label. Wat niet te koppelen is, blijft stil.
const MOD_DISCRETE = ['step', 'display', 'meter', 'jack', 'pad', 'button'];   // geen instelling: stapdata, uitlezing, knop
const MOD_STAT = new Map();   // element -> 'ja' | 'nee' | 'uit' | '?'
const MOD_OWN = [];           // eigen <input type=range> zonder id, alleen voor de tabel
const nrm = x => String(x == null ? '' : x).toLowerCase().replace(/[^a-z0-9]/g, '');
const flat = (o, p = '', out = {}, dp = 0) => { if (o && typeof o === 'object' && dp < 6) { for (const k of Object.keys(o)) flat(o[k], p ? p + '.' + k : k, out, dp + 1); } else out[p] = JSON.stringify(o); return out; };
const ownLabel = e => { let l = ctlLabelOf(e); if (l) return l; const par = e.parentElement; if (par && par.children) { const i = par.children.indexOf(e); for (let j = i - 1; j >= 0 && !l; j--) { const c = par.children[j]; l = c && (c.textContent || (c.children && c.children[0] && c.children[0].textContent)) || ''; } if (!l && par.textContent) l = par.textContent; } return lbl(l).trim().slice(0, 40); };
(function modDekking() {
  const raw = d.modExclude !== undefined ? d.modExclude : inst.modExclude;
  let excl = [], all = false;
  if (raw !== undefined) { if (raw === '*') all = true; else if (Array.isArray(raw) && raw.every(x => typeof x === 'string' && x)) excl = raw.map(nrm); else ctlWarn('v.mod_exclude_vorm'); }
  const isEx = toks => all || toks.some(t => t && excl.includes(nrm(t)));
  // alle regelaars die een instelling zijn
  const R = [];
  for (const c of CTL) if (c.type === 'range' && !MOD_DISCRETE.includes(c.role)) R.push({ key: c.el, id: c.id, label: c.label, min: c.min, max: c.max, e: c.inp || c.el, onchange: c.onchange });
  for (const e of ALL_EL) { if (e._pk || !e._built || typeOf(e) !== 'range') continue; const a = e.attributes || {}, ds = e.dataset || {};
    const id = a['data-pk-id'] ?? ds.pkId, role = a['data-pk-role'] ?? ds.pkRole, hasPk = id !== undefined || role !== undefined || a['data-pk-group'] !== undefined || ds.pkGroup !== undefined;
    if (role !== undefined && MOD_DISCRETE.includes(role)) continue; if (!e.parentElement && !e.parentNode) continue;
    const label = ownLabel(e); R.push({ key: e, id: typeof id === 'string' && ID_RE.test(id) ? id : null, label, min: e.min !== '' ? +e.min : null, max: e.max !== '' ? +e.max : null, e });
    if (!hasPk) MOD_OWN.push({ key: e, label, min: e.min !== '' ? +e.min : null, max: e.max !== '' ? +e.max : null }); }
  const PM = PARAMS ? PARAMS.map(p => ({ id: p.id, n: nrm(p.id), nm: nrm(p.name) })) : [];
  const strong = t => { const n = nrm(t); return n && PM.some(p => p.n === n || (n.length >= 3 && p.n.length >= 3 && (p.n.endsWith(n) || n.endsWith(p.n)))); };
  const weak = t => { const n = nrm(t); return n && PM.filter(p => p.n === n || p.nm === n).length === 1; };   // label: alleen als precies één param zo heet
  const numTok = k => { const o = [k.replace(/\.\d+(?=\.|$)/g, '')]; const parts = k.split('.'); for (const sh of [0, 1]) o.push(parts.map(x => /^\d+$/.test(x) ? String(+x + sh) : x).join('.'), parts.map(x => /^\d+$/.test(x) ? String(+x + sh) : x).join('')); return o; };
  const pat = k => k.replace(/\d+/g, '#'), patN = {}, patI = {};
  // knoppen verzetten en kijken welke state-sleutel verandert
  const savedEmit = emitted.length, savedBad = modBad;
  let base = null, baseJson = null; try { baseJson = JSON.stringify(inst.getState()); base = flat(JSON.parse(baseJson)); } catch (e) { base = null; }
  const probe = r => {
    if (!base) return [];
    const lo = typeof r.min === 'number' && isFinite(r.min) ? r.min : 0, hi = typeof r.max === 'number' && isFinite(r.max) && r.max > lo ? r.max : lo + 1;
    const st = +r.e.step > 0 ? +r.e.step : 0; let v = lo + (hi - lo) * 0.73; if (st) v = lo + Math.round((v - lo) / st) * st;
    if (Math.abs(v - (+r.e.value)) < (hi - lo) * 0.01) v = lo + (hi - lo) * 0.27;
    try {
      if (r.onchange) r.onchange(v);
      else { r.e.value = String(v); const ev = { type: 'input', target: r.e, currentTarget: r.e, preventDefault() {}, stopPropagation() {}, isTrusted: false };
        for (const t of ['input', 'change']) { for (const [ty, f] of (r.e._ls || [])) if (ty === t && typeof f === 'function') try { f.call(r.e, { ...ev, type: t }); } catch (e) {}
          const h = r.e['on' + t]; if (typeof h === 'function') try { h.call(r.e, { ...ev, type: t }); } catch (e) {} } }
    } catch (e) {}
    let after; try { after = flat(inst.getState()); } catch (e) { return []; }
    const ch = Object.keys(after).filter(k => after[k] !== base[k] && !/(^|\.)(driftT|gen|walk|wv|ph)$/.test(k));
    if (Object.keys(after).some(k => after[k] !== base[k])) try { inst.setState(JSON.parse(baseJson)); } catch (e) {}
    return ch;
  };
  const missing = []; let unresolved = 0, counted = 0;
  for (const r of R) { r.keys = probe(r); for (const k of r.keys) if (/\d/.test(k)) { patN[pat(k)] = (patN[pat(k)] || 0) + 1; (patI[pat(k)] || (patI[pat(k)] = new Set())).add(k.replace(/\D+/g, '.')); } }   // genummerde sleutels: één index (gekozen slot) of veel regelaars met hetzelfde patroon (stapdata) tellen niet
  for (const r of R) {
    const keys = r.keys, nk = keys.filter(k => !/(^|\.)\d+(\.|$)/.test(k)), nums = keys.filter(k => /(^|\.)\d+(\.|$)/.test(k) && (patN[pat(k)] || 0) <= 12 && patI[pat(k)].size >= 2);
    const toks = [r.id, ...keys, ...nums.flatMap(numTok), r.label];
    let st;
    if (isEx(toks)) st = 'uit';
    else if (strong(r.id) || nk.some(strong) || nums.some(k => numTok(k).some(strong)) || weak(r.label)) st = 'ja';
    else if (r.id || nk.length || nums.length) st = 'nee';
    else st = '?';
    MOD_STAT.set(r.key, st);
    if (st !== 'uit') counted++;
    if (st === 'nee') missing.push(r.id || nk[0] || nums[0]); if (st === '?') unresolved++;
  }
  emitted.length = savedEmit; modBad = savedBad;
  const list = a => a.slice(0, 6).join(', ') + (a.length > 6 ? ', …' : '');
  if (PARAMS) {
    if (!all && missing.length) ctlWarn('v.mod_ontbreekt', missing.length, list([...new Set(missing)]));
    // param-id zonder regelaar of state-sleutel
    const have = new Set(); const addTok = t => { const n = nrm(t); if (n) have.add(n); };
    for (const k of Object.keys(base || {})) { addTok(k); addTok(k.split('.').pop()); addTok(k.split('.').filter(x => !/^\d+$/.test(x)).pop()); if (/\d/.test(k)) numTok(k).forEach(addTok); }
    for (const c of CTL) addTok(c.id); for (const e of ALL_EL) { const a = e.attributes || {}; addTok(a['data-pk-id'] ?? (e.dataset || {}).pkId); }
    for (const r of R) { addTok(r.label); (r.keys || []).forEach(addTok); }
    const orphan = PARAMS.filter(p => { const n = nrm(p.id), nm = nrm(p.name); if (excl.includes(n)) return false; if (have.has(n) || have.has(nm) || have.has(nrm(p.id.split('.').filter(x => !/^\d+$/.test(x)).pop()))) return false;   // ook de eigenschap zonder spoor-voorvoegsel (ch6.fm -> fm)
      for (const h of have) if (h.length >= 3 && n.length >= 3 && (h.endsWith(n) || n.endsWith(h))) return false; return true; }).map(p => p.id);
    if (orphan.length && base) ctlWarn('v.mod_param_zonder', orphan.length, list(orphan));
  } else if (!all && counted > 0 && ['instrument', 'effect', 'mixer'].includes(d.kind) && !['sequencer', 'tool'].includes(d.category)) {
    const names = R.filter(r => MOD_STAT.get(r.key) !== 'uit').map(r => r.id || (r.keys && r.keys[0]) || r.label || '?');
    ctlWarn('v.mod_geen_params', counted, d.kind, list(names));
  }
})();
try { if (inst.unmount) inst.unmount(); inst.destroy(); inst.destroy(); } catch (e) { fail(vt('v.destroy_gooit_moet_idempotent_zijn') + e.message); }
const openFrames = frames.filter(e => !e.off).length; if (openFrames) fail(vt('v.na_destroy_staan_er_nog',openFrames));
// v1.15: attributen data-pk-id/-role/-group op eigen elementen (N1-pad) en de eindcontrole van het register
for (const e of ALL_EL) { const a0 = e.attributes || {}, ds0 = e.dataset || {}, sfx = a0['data-pk-suffix'] ?? ds0.pkSuffix;
  if (sfx !== undefined && !(typeof sfx === 'string' && sfx.length <= 16)) ctlWarn('v.meter_suffix', ctlLabelOf(e) || (tagOf(e).toLowerCase() + (e.id ? '#' + e.id : ''))); }
for (const e of ALL_EL) { if (e._pk) continue; const a = e.attributes || {}, ds = e.dataset || {};
  const id = a['data-pk-id'] ?? ds.pkId, role = a['data-pk-role'] ?? ds.pkRole, group = a['data-pk-group'] ?? ds.pkGroup;
  if (id === undefined && role === undefined && group === undefined) continue;
  const type = typeOf(e), name = ctlLabelOf(e) || (tagOf(e).toLowerCase() + (e.id ? '#' + e.id : '')), r = ctlOpts(name, { id, role, group }, type || 'range');
  if (!type) { ctlWarn(role === 'meter' ? 'v.meter_attr' : 'v.ctl_adopt_model', name); continue; }
  if (r.id && !e.parentElement && !e.parentNode) { ctlWarn('v.ctl_los', name, r.id); continue; }
  ctlAdd({ ...r, label: name, type, min: type === 'range' && e.min !== '' ? +e.min : null, max: type === 'range' && e.max !== '' ? +e.max : null, face: type === 'range' ? 'hslider' : type, via: 'attr', el: e, built: e._built });
}
{ // dubbele id's (alleen wat bij create()/mount() is gebouwd) en deels ontbrekende id's
  const by = new Map(); for (const c of CTL) if (c.id && c.built) (by.get(c.id) || by.set(c.id, []).get(c.id)).push(c.label);
  for (const [id, labels] of by) if (labels.length > 1) ctlWarn('v.ctl_id_dubbel', id, labels.slice(0, 4).join(', '));
  const withId = CTL.filter(c => c.id), without = CTL.filter(c => !c.id && c.via !== 'attr');
  if (withId.length && without.length) ctlWarn('v.ctl_id_ontbreekt', without.length, without.slice(0, 5).map(c => c.label || '?').join(', ') + (without.length > 5 ? ', …' : '')); }
const extWarn = !/\.patchkamer-device\.js$/i.test(file);
const rafWarn = /requestAnimationFrame\s*\(/.test(src) && !/host\.frame\b|\.frame\s*===\s*'function'|__pkWrap\(/.test(src);
for (const { port, ev } of emitted) {
  const multi = d.ports.multiEventOut.some(p => p.id === port);
  if (!multi && !d.ports.eventOut.some(p => p.id === port)) fail(vt('v.emit_op_onbekende_eventout_poort',port));
  if (ev && typeof ev === 'object') {
    if (ev.ch !== undefined && !(Number.isInteger(ev.ch) && ev.ch >= 1 && ev.ch <= 16)) fail(vt('v.gebeurtenis_ch_moet_een_geheel_getal',ev.ch));
    if (ev.cc !== undefined && !(Number.isInteger(ev.cc) && ev.cc >= 0 && ev.cc <= 127)) fail(vt('v.gebeurtenis_cc_moet_een_geheel_getal',ev.cc));
    if (multi && (typeof ev.track !== 'string' || !ev.track)) fail(vt('v.gebeurtenis_op_multieventout_mist_track',port));
  }
}
if (d.ui && d.ui.jacks && jacks === 0) fail(vt('v.ui_jacks_is_aan_maar'));
if (modBad) fail(modBad);
const nKnobs = nMountKnobs; let OTHER = null;
{
  // tweede doorloop met de andere host.lang: vangt fouten in de taaltak van het apparaat (ontbrekende teksten, crashes)
  if (!SUB) {
    const other = HOSTLANG === 'nl' ? 'en' : 'nl';
    const r = spawnSync(process.execPath, [fileURLToPath(import.meta.url), file, '--host-lang', other, '--lang', LANG, '--sub'], { encoding: 'utf8' });
    if (r.status !== 0) fail(vt('v.faalt_met_host_lang', other, ((r.stderr || r.stdout || '').trim().split('\n')[0] || '').replace(/^\S+:\s*/, '')));
    // v1.15: de regelaars uit de andere taalronde (voor de tabel en de controle dat id's niet van de taal afhangen)
    const m = /^PKCTL (.*)$/m.exec(r.stdout || ''); if (m) { try { OTHER = JSON.parse(m[1]); } catch (e) { OTHER = null; } }
    if (OTHER) { const a = CTL.filter(c => c.id && c.built).map(c => c.id).sort(), b = OTHER.filter(c => c.id && c.built).map(c => c.id).sort();
      if (a.join('\n') !== b.join('\n')) { const diff = [...new Set([...a.filter(x => !b.includes(x)), ...b.filter(x => !a.includes(x))])].slice(0, 5).join(', '); ctlWarn('v.ctl_id_taal', diff); } }
  }
  if (SUB) console.log('PKDEV ' + d.id + '\n' + 'PKCTL ' + JSON.stringify(CTL.map(c => ({ id: c.id, role: c.role, group: c.group, label: c.label, type: c.type, min: c.min, max: c.max, face: c.face, items: c.items, built: c.built }))));
  let line = `OK  ${d.name} ${d.version} (${d.id}) — kind ${d.kind}`;
  if (d.ui && d.ui.width) line += vt('v.ok_breedte', d.ui.width);
  line += vt('v.ok_poorten', d.ports.audioIn.length, d.ports.audioOut.length, d.ports.eventIn.length, d.ports.eventOut.length, json.length, started);
  if (jacks) line += vt('v.ok_jacks', jacks);
  if (portChanges) line += vt('v.ok_setports', portChanges);
  if (emitted.length) line += vt('v.ok_gebeurtenissen', emitted.length);
  if (nParams) line += nLanes > 1 ? vt('v.ok_params_sporen', nParams, nLanes) : vt('v.ok_params_spoor', nParams, nLanes);
  if (nFast) line += vt('v.ok_snel', nFast);
  if (d.kind === 'modulator') line += vt('v.ok_modulator') + (sigCalls ? vt('v.ok_modsignal', sigCalls) : '');
  if (worklets) line += worklets > 1 ? vt('v.ok_worklets', worklets) : vt('v.ok_worklet', worklets);
  if (d.ports.multiOut.length) line += vt('v.ok_bundel_uit', nBundleCh);
  if (d.ports.multiIn.length) line += vt('v.ok_bundel_in');
  if (d.ports.masteringOut.length) line += vt('v.ok_mastering_uit');
  if (d.ports.masteringIn.length) line += vt('v.ok_mastering_in');
  if (d.ports.multiEventOut.length) line += vt('v.ok_multievent_uit', nTracks);
  if (d.ports.multiEventIn.length) line += vt('v.ok_multievent_in');
  if (masteringBad) fail(masteringBad);
  if (presetBytes) line += vt('v.ok_preset', presetBytes);
  if (nParts) line += vt('v.ok_instrumenten', nParts);
  if (clipOn) line += vt('v.ok_klembord');
  if (nKnobs) line += vt('v.ok_knoppen', nKnobs);
  if (METERS) line += vt('v.meter_aantal', METERS);
  if (PADS) line += vt('v.pad_aantal', PADS);
  { const nd = CTL.filter(c => c.via === 'display').length; if (nd) line += vt('v.display_aantal', nd); }
  { const nid = CTL.filter(c => c.id).length; if (nid) line += vt('v.ok_regelaars', nid); }
  line += frames.length ? vt('v.ok_tekent_frame') : (/__pkWrap\(/.test(src) ? vt('v.ok_tekent_poort') : '');
  if (peerCalls || connects) line += vt('v.ok_besturing');
  if (rafWarn) line += vt('v.waarschuwing_raf');
  if (extWarn) line += vt('v.waarschuwing_naam');
  if (clipWarn) line += vt('v.waarschuwing_clip_afgewezen');
  for (const w of CTL_WARN) line += vt('v.ctl_prefix') + w;
  if (!SUB) console.log(line);
  if (!SUB && CLIPOUT) {   // v1.17: de uitvoer van clipInfo() en getClip()
    console.log(''); console.log(vt('v.clip_titel'));
    if (!clipOn) console.log(vt('v.clip_geen'));
    else { console.log('clipInfo(): ' + (clipOutInfo == null ? vt('v.clip_nul') : JSON.stringify(clipOutInfo)));
      console.log('getClip():  ' + (clipOutClip == null ? vt('v.clip_nul') : JSON.stringify(clipOutClip))); }
  }
  if (!SUB && CONTROLS) {   // v1.15: de tabel id | rol | groep | label nl/en | bereik | gezicht
    const mine = HOSTLANG, labs = c => { const o = OTHER && (OTHER.find(x => x.id && x.id === c.id && x.type === c.type) || (c.id ? null : OTHER.filter(x => !x.id)[CTL.filter(y => !y.id).indexOf(c)])); const a = c.label, b = o ? o.label : c.label;
      const [nl, en] = mine === 'nl' ? [a, b] : [b, a]; return nl === en ? nl : nl + ' / ' + en; };
    const range = c => c.type === 'range' || c.type === 'meter' ? (c.min != null && c.max != null ? c.min + '..' + c.max : '-') : c.type === 'select' ? ((c.items || []).join(',').replace(/^(.{37}).{4,}$/, '$1…') || '-') : '-';
    const inP = el => { const t = MOD_STAT.get(el); return t === 'ja' ? vt('v.mod_ja') : t === 'nee' ? vt('v.mod_nee') : t === 'uit' ? vt('v.mod_uit') : t === '?' ? '?' : '-'; };
    const rows = CTL.map(c => [c.id || vt('v.ctl_zonder_id'), c.role, c.group || '-', labs(c), range(c), c.face || '-', inP(c.el)]);
    for (const o of MOD_OWN) rows.push([vt('v.ctl_zonder_id'), 'param', '-', o.label || '-', o.min != null && o.max != null ? o.min + '..' + o.max : '-', 'hslider', inP(o.key)]);
    const head = vt('v.ctl_kop').split(' | ');
    console.log(''); console.log(vt('v.ctl_titel', rows.length));
    if (!rows.length) console.log(vt('v.ctl_geen'));
    else { const w = head.map((h, i) => Math.max(h.length, ...rows.map(r => String(r[i]).length)));
      const fmtRow = r => r.map((x, i) => String(x).padEnd(w[i])).join(' | ').trimEnd();
      console.log(fmtRow(head)); console.log(w.map(n => '-'.repeat(n)).join('-+-')); for (const r of rows) console.log(fmtRow(r)); }
  }
}
process.exit(0);
