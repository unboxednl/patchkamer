// validate-instrument.mjs — Patchkamer contract v1.13
// Gebruik: node validate-instrument.mjs mijn-instrument.patchkamer-device.js [--lang nl|en]
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
// v1.12: mastering: ports.masteringIn/masteringOut (kabeltype mastering), configureMastering, onMasteringTargets, host.mastering.
// v1.8: de tekenpoort (__pkWrap) telt als soepel tekenen; host.ui.knob accepteert een 7e argument (opties).
import { pathToFileURL, fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

// ---------- argumenten: bestand, --lang nl|en (taal van de uitvoer), --host-lang nl|en (host.lang voor het apparaat) ----------
const argv = process.argv.slice(2); let LANG = 'nl', HOSTLANG = 'nl', SUB = false; const rest = [];
for (let i = 0; i < argv.length; i++) { const a = argv[i];
  if (a === '--lang') LANG = argv[++i] || ''; else if (a.startsWith('--lang=')) LANG = a.slice(7);
  else if (a === '--host-lang') HOSTLANG = argv[++i] || ''; else if (a.startsWith('--host-lang=')) HOSTLANG = a.slice(12);
  else if (a === '--sub') SUB = true; else rest.push(a); }
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
    "v.gebruik_node_validate_instrument_mjs": "gebruik: node validate-instrument.mjs bestand.patchkamer-device.js [--lang nl|en]"
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
    "v.gebruik_node_validate_instrument_mjs": "usage: node validate-instrument.mjs file.patchkamer-device.js [--lang nl|en]"
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
  createGain: node, createOscillator: node, createBiquadFilter: node, createDelay: node, createConvolver: node, createDynamicsCompressor: node, createAnalyser: node, createStereoPanner: node, createWaveShaper: node, createBufferSource: node, createConstantSource: node, createChannelMerger: node, createChannelSplitter: node,
  createBuffer: (ch, len) => ({ numberOfChannels: ch, length: len, getChannelData: () => new Float32Array(Math.min(len || 1024, 1 << 16)) }),
  createMediaStreamDestination: () => Object.assign(node(), { stream: {} }), createPeriodicWave: () => ({}),
  audioWorklet: { addModule: async () => {} } };
// AudioWorkletNode: parameters als Map van AudioParams, een port die niets doet
globalThis.AudioWorkletNode = class { constructor(c, name, opts) { Object.assign(this, node()); this.port = { postMessage(){}, onmessage: null, start(){}, close(){}, addEventListener(){} }; const P = new Map(); this.parameters = { get: k => { if (!P.has(k)) P.set(k, param()); return P.get(k); }, has: () => true, forEach(){} }; } };

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
    addEventListener(){}, removeEventListener(){}, dispatchEvent(){ return true; }, focus(){}, blur(){}, click(){ if (typeof this.onclick === 'function') this.onclick({ preventDefault(){}, stopPropagation(){} }); }, select(){},
    setPointerCapture(){}, releasePointerCapture(){}, scrollIntoView(){}, closest(){ return null; }, matches(){ return false; },
    querySelector(){ return el('div'); }, querySelectorAll(){ return []; }, getElementsByTagName(){ return []; }, getElementsByClassName(){ return []; },
    getElementById(id){ if (!ids.has(id)) { const x = el('div'); x.parentElement = x.parentNode = el('div'); x.id = id; ids.set(id, x); } return ids.get(id); },   // elements from markup always have a parent
    getBoundingClientRect(){ return { left: 0, top: 0, right: 300, bottom: 150, width: 300, height: 150, x: 0, y: 0 }; },
    getContext(){ return new Proxy({}, { get: (t, k) => (k in t ? t[k] : () => ({ addColorStop(){} })), set: (t, k, v) => { t[k] = v; return true; } }); },
    attachShadow(){ const r = el('#shadow-root'); this.shadowRoot = r; r.host = this; return r; },
    set innerHTML(v){ this._html = String(v); }, get innerHTML(){ return this._html || ''; },
    options: [], selectedIndex: 0, files: [], add(){},
  };
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
const FAKE_PEERS = [{ id: 'd90', name: 'Testsynth', def: 'nl.test.synth', version: '1.0.0', kind: 'instrument', category: 'synth', eventIn: [{ id: 'notes', name: 'Noten' }], mod: true, selected: true },
  { id: 'd91', name: 'Testeffect', def: 'nl.test.fx', version: '1.0.0', kind: 'effect', category: 'effect', eventIn: [], mod: true, selected: false }];
let masteringCalls = 0, masteringBad = null, emitted = [], tempo = null, curPorts = null, jacks = 0, portChanges = 0, modSent = 0, modBad = null, sigCalls = 0, worklets = 0, bundleCalls = 0;
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
    knob: (parent, label) => { const k = { label: 'knop ' + label, sets: 0 }; KNOBS.push(k); return { set(){ k.sets++; }, el: el('div'), input: el('input') }; },
    select: (parent, label, opts, val) => { const k = { label: vt('v.keuze') + label, sets: 0 }; KNOBS.push(k); const s = el('select'); let v = val; Object.defineProperty(s, 'value', { get: () => v, set: x => { v = x; k.sets++; } }); return s; }, steps: () => ({ btns: [], paint(){}, cursor(){} }), noise: () => node(), curve: () => new Float32Array(16) } };

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
// ---------- contract v1.3: modulation ----------
let nParams = 0, nLanes = 0, nFast = 0;
if (inst.params !== undefined || inst.modulate !== undefined) {
  if (typeof inst.params !== 'function' || typeof inst.modulate !== 'function') fail(vt('v.params_en_modulate_horen_bij'));
  let P; try { P = inst.params(); } catch (e) { fail(vt('v.params_gooit') + e.message); }
  if (!Array.isArray(P) || !P.length) fail(vt('v.params_moet_een_niet_lege'));
  const seen = new Set();
  for (const p of P) { if (!p || typeof p.id !== 'string' || !p.id) fail(vt('v.params_elke_parameter_heeft_een')); if (seen.has(p.id)) fail(`params(): dubbele id ${p.id}`); seen.add(p.id);
    if (typeof p.name !== 'string') fail(`params(): ${p.id} mist name`); if (typeof p.min !== 'number' || typeof p.max !== 'number' || !(p.max > p.min)) fail(vt('v.params_heeft_min_max_nodig',p.id));
    if (p.drift !== undefined && !(p.drift >= 0 && p.drift <= 1)) fail(vt('v.params_drift_moet_tussen_0',p.id)); if (p.scale !== undefined && !['lin', 'log'].includes(p.scale)) fail(`params(): ${p.id}.scale is lin of log`); }
  try { JSON.stringify(P); } catch (e) { fail(vt('v.params_moet_gewone_data_zijn')); }
  nParams = P.length; nLanes = new Set(P.map(p => p.lane || '')).size;
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
try { if (inst.unmount) inst.unmount(); inst.destroy(); inst.destroy(); } catch (e) { fail(vt('v.destroy_gooit_moet_idempotent_zijn') + e.message); }
const openFrames = frames.filter(e => !e.off).length; if (openFrames) fail(vt('v.na_destroy_staan_er_nog',openFrames));
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
const nKnobs = nMountKnobs;
{
  // tweede doorloop met de andere host.lang: vangt fouten in de taaltak van het apparaat (ontbrekende teksten, crashes)
  if (!SUB) {
    const other = HOSTLANG === 'nl' ? 'en' : 'nl';
    const r = spawnSync(process.execPath, [fileURLToPath(import.meta.url), file, '--host-lang', other, '--lang', LANG, '--sub'], { encoding: 'utf8' });
    if (r.status !== 0) fail(vt('v.faalt_met_host_lang', other, ((r.stderr || r.stdout || '').trim().split('\n')[0] || '').replace(/^\S+:\s*/, '')));
  }
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
  if (nKnobs) line += vt('v.ok_knoppen', nKnobs);
  line += frames.length ? vt('v.ok_tekent_frame') : (/__pkWrap\(/.test(src) ? vt('v.ok_tekent_poort') : '');
  if (peerCalls || connects) line += vt('v.ok_besturing');
  if (rafWarn) line += vt('v.waarschuwing_raf');
  if (extWarn) line += vt('v.waarschuwing_naam');
  if (!SUB) console.log(line);
}
process.exit(0);
