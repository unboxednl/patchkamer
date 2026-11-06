// validate-skin.mjs — Patchkamer skins contract v0.1
// Gebruik:  node validate-skin.mjs <bestand.patchkamer-skin.json | icon.svg|png|webp|jpg> [...] [--lang nl|en]
//           node validate-skin.mjs --dir <bibliotheekmap> [--lang nl|en]
// Usage:    same; --dir validates every *.patchkamer-skin.json and icon.* in a library folder (skins/library or one device folder).
// Controleert een skin (zie SKINS-CONTRACT_NL.md / _EN.md) en eindigt met één OK-regel per bestand (exit 0)
// of met alle gevonden fouten (exit 1). Waarschuwingen ("let op" / "warning") staan achter de OK-regel en geven exit 0.
// Alleen Node, geen npm-pakketten. Meldingen in beide talen (--lang nl|en, standaard nl).
// PK_SKIN_CODES=1 zet achter elke melding de code tussen blokhaken (voor tests).
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';

// ---------- argumenten ----------
const argv = process.argv.slice(2); let LANG = 'nl', DIR = null; const files = [];
for (let i = 0; i < argv.length; i++) { const a = argv[i];
  if (a === '--lang') LANG = argv[++i] || ''; else if (a.startsWith('--lang=')) LANG = a.slice(7);
  else if (a === '--dir') DIR = argv[++i] || ''; else if (a.startsWith('--dir=')) DIR = a.slice(6);
  else files.push(a); }
const CODES = process.env.PK_SKIN_CODES === '1';

// ---------- meldingen: sleutel -> [nl, en] ----------
const M = {
  usage: ['gebruik: node validate-skin.mjs bestand.patchkamer-skin.json [--lang nl|en]  of  --dir <map>', 'usage: node validate-skin.mjs file.patchkamer-skin.json [--lang nl|en]  or  --dir <folder>'],
  fout: ['FOUT:', 'ERROR:'], letop: ['let op', 'warning'],
  unreadable: ['bestand niet te lezen: {0}', 'cannot read the file: {0}'],
  too_big: ['bestand is {0} bytes; het maximum is 2 MB (2097152 bytes)', 'the file is {0} bytes; the maximum is 2 MB (2097152 bytes)'],
  bad_json: ['geen geldige JSON: {0}', 'not valid JSON: {0}'],
  not_object: ['het bestand moet één JSON-object zijn', 'the file must be one JSON object'],
  filename: ['bestandsnaam hoort op .patchkamer-skin.json te eindigen (kleine letters met streepjes, zonder versienummer)', 'the file name should end in .patchkamer-skin.json (lowercase with hyphens, no version number)'],
  filename_form: ['bestandsnaam "{0}" hoort kleine letters met streepjes te zijn en geen versienummer te bevatten', 'file name "{0}" should be lowercase with hyphens and contain no version number'],
  format: ['format moet "patchkamer-skin" zijn', 'format must be "patchkamer-skin"'],
  formatversion: ['formatVersion moet een geheel getal van 1 of hoger zijn', 'formatVersion must be an integer of 1 or higher'],
  formatversion_new: ['formatVersion {0} is nieuwer dan deze validator (1); onbekende velden worden genegeerd', 'formatVersion {0} is newer than this validator (1); unknown fields are ignored'],
  contract_form: ['skinsContract moet tekst zijn in de vorm "major.minor" (bijvoorbeeld "0.1")', 'skinsContract must be text in the form "major.minor" (for example "0.1")'],
  contract_major: ['skinsContract {0}: deze validator kent alleen major 0; een andere major wordt door de host geweigerd', 'skinsContract {0}: this validator only knows major 0; the host rejects another major'],
  contract_minor: ['skinsContract {0} is nieuwer dan 0.1; onbekende velden worden genegeerd', 'skinsContract {0} is newer than 0.1; unknown fields are ignored'],
  id_form: ['id moet 3 tot 100 tekens zijn uit [a-z0-9.-]', 'id must be 3 to 100 characters from [a-z0-9.-]'],
  id_prefix: ['id begint niet met het apparaat-id ("{0}."); aanbevolen is <device-id>.<slug>', 'id does not start with the device id ("{0}."); <device-id>.<slug> is recommended'],
  device_form: ['device moet het apparaat-id zijn: 3 tot 100 tekens uit [a-z0-9.-], beginnend en eindigend met een letter of cijfer', 'device must be the device id: 3 to 100 characters from [a-z0-9.-], starting and ending with a letter or digit'],
  device_nodot: ['device "{0}" bevat geen punt; een apparaat-id is reverse-DNS (nl.<naam>.<apparaat>)', 'device "{0}" has no dot; a device id is reverse-DNS (nl.<name>.<device>)'],
  name: ['name moet een tekst van 1 tot 60 tekens zijn', 'name must be text of 1 to 60 characters'],
  version: ['version moet semver zijn (x.y.z)', 'version must be semver (x.y.z)'],
  author: ['author moet een niet-lege tekst van hoogstens 60 tekens zijn', 'author must be non-empty text of at most 60 characters'],
  license: ['license moet een SPDX-id zijn (bijvoorbeeld CC0-1.0)', 'license must be an SPDX id (for example CC0-1.0)'],
  license_lib: ['license is "{0}"; skins/library/ is CC0-1.0, dus een skin daar hoort CC0-1.0 te zijn', 'license is "{0}"; skins/library/ is CC0-1.0, so a skin there should be CC0-1.0'],
  description: ['description moet een tekst van 1 tot 300 tekens zijn', 'description must be text of 1 to 300 characters'],
  created: ['created moet een geldige datum zijn in de vorm YYYY-MM-DD', 'created must be a valid date in the form YYYY-MM-DD'],
  icon_type: ['icon moet null zijn of een data-adres van een afbeelding (svg+xml, png, webp of jpeg)', 'icon must be null or a data address of an image (svg+xml, png, webp or jpeg)'],
  icon_big: ['icon is {0} bytes; het maximum is 200 kB (204800 bytes)', 'icon is {0} bytes; the maximum is 200 kB (204800 bytes)'],
  icon_svg: ['icon (svg) is niet veilig: {0}', 'icon (svg) is not safe: {0}'],
  default_ref: ['default "{0}" verwijst naar geen bestaande verschijningsvorm', 'default "{0}" does not refer to an existing appearance'],
  default_type: ['default moet de id (tekst) van een verschijningsvorm zijn', 'default must be the id (text) of an appearance'],
  app_array: ['appearances moet een lijst van 1 tot 12 verschijningsvormen zijn', 'appearances must be a list of 1 to 12 appearances'],
  app_object: ['appearances[{0}] moet een object zijn', 'appearances[{0}] must be an object'],
  app_id: ['appearances[{0}].id moet 1 tot 40 tekens zijn uit [a-z0-9-]', 'appearances[{0}].id must be 1 to 40 characters from [a-z0-9-]'],
  app_id_dup: ['appearances[{0}].id "{1}" komt vaker voor; ids zijn uniek binnen de skin', 'appearances[{0}].id "{1}" occurs more than once; ids are unique within the skin'],
  app_name: ['appearances[{0}].name moet een tekst van 1 tot 40 tekens zijn', 'appearances[{0}].name must be text of 1 to 40 characters'],
  app_desc: ['appearances[{0}].description moet een tekst van hoogstens 300 tekens zijn', 'appearances[{0}].description must be text of at most 300 characters'],
  when_object: ['appearances[{0}].when moet een object zijn', 'appearances[{0}].when must be an object'],
  when_width: ['appearances[{0}].when.{1} moet een geheel getal van 0 tot 10000 zijn', 'appearances[{0}].when.{1} must be an integer from 0 to 10000'],
  when_order: ['appearances[{0}].when: minWidth ({1}) is groter dan maxWidth ({2})', 'appearances[{0}].when: minWidth ({1}) is greater than maxWidth ({2})'],
  when_screens: ['appearances[{0}].when.screens moet een lijst zijn met alleen "phone", "compact" en "wide"', 'appearances[{0}].when.screens must be a list with only "phone", "compact" and "wide"'],
  when_empty_screens: ['appearances[{0}].when.screens is leeg: deze verschijningsvorm kan nooit automatisch gekozen worden', 'appearances[{0}].when.screens is empty: this appearance can never be chosen automatically'],
  when_dup_screens: ['appearances[{0}].when.screens noemt een schermklasse dubbel', 'appearances[{0}].when.screens lists a screen class twice'],
  when_zero: ['appearances[{0}].when.maxWidth is 0: deze verschijningsvorm past alleen bij een kaart van 0 px', 'appearances[{0}].when.maxWidth is 0: this appearance only matches a card of 0 px'],
  when_all: ['appearances[{0}].when stelt geen enkele voorwaarde: hij past altijd, latere verschijningsvormen komen nooit aan de beurt', 'appearances[{0}].when sets no condition: it always matches, so later appearances are never reached'],
  when_shadow: ['appearances[{0}] ("{1}") wordt nooit automatisch gekozen: verschijningsvorm "{2}" ervoor past altijd al', 'appearances[{0}] ("{1}") is never chosen automatically: the earlier appearance "{2}" always matches first'],
  no_when_no_default: ['verschijningsvorm "{0}" heeft geen when en default ontbreekt: auto valt dan terug op de eerste verschijningsvorm, "{0}" is alleen met de hand te kiezen', 'appearance "{0}" has no when and default is missing: auto falls back to the first appearance, so "{0}" can only be chosen by hand'],
  css_type: ['appearances[{0}].css moet tekst zijn', 'appearances[{0}].css must be text'],
  css_big: ['appearances[{0}].css is {1} bytes; het maximum is 200 kB (204800 bytes)', 'appearances[{0}].css is {1} bytes; the maximum is 200 kB (204800 bytes)'],
  css_import: ['appearances[{0}].css bevat @import; dat is niet toegestaan', 'appearances[{0}].css contains @import, which is not allowed'],
  css_url: ['appearances[{0}].css: url({1}) is niet toegestaan; alleen data: of var(--skin-asset-…)', 'appearances[{0}].css: url({1}) is not allowed; only data: or var(--skin-asset-…)'],
  css_imageset: ['appearances[{0}].css bevat image-set(; gebruik url(data:…) of var(--skin-asset-…)', 'appearances[{0}].css contains image-set(; use url(data:…) or var(--skin-asset-…)'],
  css_danger: ['appearances[{0}].css bevat "{1}"; dat is niet toegestaan', 'appearances[{0}].css contains "{1}", which is not allowed'],
  css_asset_missing: ['appearances[{0}].css gebruikt --skin-asset-{1} maar assets heeft geen "{1}"', 'appearances[{0}].css uses --skin-asset-{1} but assets has no "{1}"'],
  css_asset_unused: ['appearances[{0}].assets."{1}" wordt in de css niet gebruikt', 'appearances[{0}].assets."{1}" is not used in the css'],
  assets_object: ['appearances[{0}].assets moet een object zijn (naam → data-adres)', 'appearances[{0}].assets must be an object (name → data address)'],
  asset_name: ['appearances[{0}].assets: naam "{1}" moet 1 tot 40 tekens zijn uit [a-z0-9-]', 'appearances[{0}].assets: name "{1}" must be 1 to 40 characters from [a-z0-9-]'],
  asset_type: ['appearances[{0}].assets."{1}" moet een data-adres van een afbeelding zijn (svg+xml, png, webp of jpeg)', 'appearances[{0}].assets."{1}" must be a data address of an image (svg+xml, png, webp or jpeg)'],
  asset_big: ['appearances[{0}].assets."{1}" is {2} bytes; het maximum is 200 kB (204800 bytes)', 'appearances[{0}].assets."{1}" is {2} bytes; the maximum is 200 kB (204800 bytes)'],
  asset_svg: ['appearances[{0}].assets."{1}" (svg) is niet veilig: {2}', 'appearances[{0}].assets."{1}" (svg) is not safe: {2}'],
  assets_total: ['de assets samen zijn {0} bytes; het maximum per skin is 1 MB (1048576 bytes)', 'the assets together are {0} bytes; the maximum per skin is 1 MB (1048576 bytes)'],
  unknown_field: ['onbekend veld "{0}" wordt genegeerd (typefout?)', 'unknown field "{0}" is ignored (typo?)'],
  dir_mismatch: ['device ("{0}") is niet gelijk aan de mapnaam ("{1}"); in skins/library/<device-id>/ moet de map het apparaat-id zijn', 'device ("{0}") does not equal the folder name ("{1}"); in skins/library/<device-id>/ the folder must be the device id'],
  dir_elsewhere: ['het bestand staat niet in skins/library/<device-id>/; de host vindt het daar niet vanzelf (laden of slepen werkt wel)', 'the file is not in skins/library/<device-id>/; the host will not find it there by itself (loading or dropping still works)'],
  brand: ['{0} bevat een merk- of productnaam ("{1}"); namen zijn Engels en merkvrij', '{0} contains a brand or product name ("{1}"); names are English and brand-free'],
  dutch: ['{0} bevat mogelijk Nederlandse woorden ({1}); namen en omschrijvingen zijn Engels', '{0} may contain Dutch words ({1}); names and descriptions are English'],
  icon_file_ext: ['iconbestand "{0}": toegestaan zijn icon.svg, icon.png, icon.webp en icon.jpg', 'icon file "{0}": allowed are icon.svg, icon.png, icon.webp and icon.jpg'],
  icon_file_big: ['iconbestand is {0} bytes; het maximum is 200 kB (204800 bytes)', 'the icon file is {0} bytes; the maximum is 200 kB (204800 bytes)'],
  icon_file_content: ['iconbestand is geen echt {0}-bestand (inhoud klopt niet met de extensie)', 'the icon file is not a real {0} file (the content does not match the extension)'],
  icon_file_svg: ['iconbestand (svg) is niet veilig: {0}', 'the icon file (svg) is not safe: {0}'],
  icon_viewbox: ['icon.svg heeft geen viewBox="0 0 24 24"; het apparaaticoon is 24×24 lijnwerk', 'icon.svg has no viewBox="0 0 24 24"; the device icon is 24×24 line art'],
  icon_multi: ['meer dan één icon.* in deze map ({0}); alleen één wordt gebruikt', 'more than one icon.* in this folder ({0}); only one is used'],
  dir_name: ['mapnaam "{0}" is geen geldig apparaat-id ([a-z0-9.-], 3 tot 100 tekens)', 'folder name "{0}" is not a valid device id ([a-z0-9.-], 3 to 100 characters)'],
  dir_other: ['"{0}" is geen skin of icoon en wordt genegeerd', '"{0}" is not a skin or an icon and is ignored'],
  dir_dup: ['skin-id "{0}" komt in twee bestanden voor ({1} en {2}); dezelfde id is dezelfde skin', 'skin id "{0}" occurs in two files ({1} and {2}); the same id is the same skin'],
  dir_none: ['geen skins of iconen gevonden in "{0}"', 'no skins or icons found in "{0}"'],
  dir_notdir: ['"{0}" is geen map', '"{0}" is not a folder'],
  summary: ['{0} bestand(en) gecontroleerd: {1} zonder fouten, {2} met fouten, {3} waarschuwing(en)', '{0} file(s) checked: {1} without errors, {2} with errors, {3} warning(s)'],
  ok_dev: ['device {0}', 'device {0}'],
  ok_apps: ['{0} verschijningsvormen', '{0} appearances'],
  ok_app: ['{0} verschijningsvorm', '{0} appearance'],
  ok_css: ['css {0} bytes', 'css {0} bytes'],
  ok_assets: ['{0} afbeeldingen', '{0} images'],
  ok_icon: ['met icoon', 'with icon'],
  ok_file: ['bestand {0} bytes', 'file {0} bytes'],
  ok_icon_file: ['iconbestand {0} bytes', 'icon file {0} bytes'],
};
const vt = (key, ...a) => { const e = M[key]; const s = e ? e[LANG === 'en' ? 1 : 0] : '⟦' + key + '⟧'; return s.replace(/\{(\d+)\}/g, (m, i) => String(a[+i])); };
if (!['nl', 'en'].includes(LANG)) { console.error('--lang: nl | en'); process.exit(2); }
if (!DIR && !files.length) { console.error(vt('usage')); process.exit(2); }

// ---------- hulpfuncties ----------
const MAX_FILE = 2 * 1024 * 1024, MAX_ICON = 200 * 1024, MAX_CSS = 200 * 1024, MAX_ASSET = 200 * 1024, MAX_ASSETS = 1024 * 1024;
const SCREENS = ['phone', 'compact', 'wide'];
const KNOWN_TOP = new Set(['format', 'formatVersion', 'skinsContract', 'id', 'device', 'name', 'version', 'author', 'license', 'description', 'created', 'icon', 'default', 'appearances']);
const KNOWN_APP = new Set(['id', 'name', 'description', 'when', 'css', 'assets']);
const KNOWN_WHEN = new Set(['minWidth', 'maxWidth', 'screens']);
// de lijst met merk- en modelnamen staat in rot13, zodat de namen zelf niet in de repo staan
const rot13 = t => t.replace(/[a-z]/gi, c => String.fromCharCode((c <= 'Z' ? 90 : 122) >= (c = c.charCodeAt(0) + 13) ? c : c - 26));
const BRAND_RE = new RegExp(rot13('nec[ _-]?[0-9]|bqlffrl|nkkr|zbbt|xbet|ebynaq|lnznun|frdhragvny|boreurvz|whab|zvavzbbt|cebcurg|whcvgre|zf-?20|fu-?101|ceb-?bar|qk-?7'), 'i');
const DUTCH = ['de', 'het', 'een', 'voor', 'met', 'van', 'niet', 'geen', 'maar', 'naar', 'wordt', 'deze', 'ook', 'kleur', 'kleuren', 'knop', 'knoppen', 'regelaar', 'regelaars', 'apparaat', 'apparaten', 'geluid', 'standaard', 'gewoon', 'normaal', 'uiterlijk', 'donker', 'licht', 'zwart', 'wit', 'rood', 'groen', 'blauw', 'geel', 'oranje', 'paars', 'grijs', 'bruin', 'roze', 'eenvoudig', 'helder', 'nacht', 'groot', 'klein', 'vloer', 'schuif', 'voorbeeld', 'verschijning', 'kaart', 'hout', 'staal', 'koper', 'zilver', 'goud', 'ouderwets', 'rustig', 'strak'];
const IMG_RE = /^data:image\/(svg\+xml|png|webp|jpeg)(;[A-Za-z0-9=._+-]+)*,/;
const isInt = v => Number.isInteger(v);
const isStr = v => typeof v === 'string';
function dataInfo(s) { // { type, base64, body } of null
  if (!isStr(s)) return null; const m = IMG_RE.exec(s); if (!m) return null;
  const head = s.slice(0, s.indexOf(',')); const base64 = /;base64$/i.test(head);
  if (m[1] !== 'svg+xml' && !base64) return null; // raster images only as base64
  if (base64 && !/^[A-Za-z0-9+/=\s]*$/.test(s.slice(s.indexOf(',') + 1))) return null;
  return { type: m[1], base64, body: s.slice(s.indexOf(',') + 1) };
}
function svgText(info) { try { return info.base64 ? Buffer.from(info.body, 'base64').toString('utf8') : decodeURIComponent(info.body); } catch { return null; } }
// geeft een korte beschrijving van wat niet veilig is, of null
function svgProblem(t) {
  if (t == null) return 'not decodable';
  if (/<\s*script/i.test(t)) return '<script>';
  if (/<\s*foreignObject/i.test(t)) return '<foreignObject>';
  if (/<\s*(iframe|object|embed|audio|video)/i.test(t)) return 'embedded content';
  if (/<!\s*ENTITY/i.test(t)) return '<!ENTITY>';
  if (/\son[a-z]+\s*=/i.test(t)) return 'event handler attribute';
  if (/javascript\s*:/i.test(t)) return 'javascript:';
  if (/@import/i.test(t)) return '@import';
  for (const m of t.matchAll(/(?:xlink:)?href\s*=\s*(["'])(.*?)\1/gi)) if (!m[2].startsWith('#') && !/^data:image\/(png|webp|jpeg)/i.test(m[2])) return 'href ' + m[2].slice(0, 30);
  for (const m of t.matchAll(/url\(\s*(["']?)([^)"']*)\1\s*\)/gi)) if (!m[2].startsWith('#')) return 'url(' + m[2].slice(0, 30) + ')';
  return null;
}
function unescapeCss(s) { return s.replace(/\\([0-9a-fA-F]{1,6})\s?/g, (m, h) => { const c = parseInt(h, 16); return c > 0 && c < 0x110000 ? String.fromCodePoint(c) : ''; }).replace(/\\(.)/gs, '$1'); }
function dutchHits(text) { const words = String(text).toLowerCase().match(/[a-zà-ÿ]+/g) || []; return [...new Set(words.filter(w => DUTCH.includes(w)))]; }

// ---------- één skin ----------
function validateSkin(path, ctx = {}) {
  const errs = [], warns = []; // elk: [code, tekst]
  const E = (k, ...a) => errs.push([k, vt(k, ...a)]), W = (k, ...a) => warns.push([k, vt(k, ...a)]);
  let raw; try { raw = readFileSync(path); } catch (e) { E('unreadable', e.message); return { errs, warns }; }
  const size = raw.length; if (size > MAX_FILE) E('too_big', size);
  const fname = basename(path);
  if (!/\.patchkamer-skin\.json$/i.test(fname)) W('filename');
  else if (!/^[a-z0-9]+(-[a-z0-9]+)*\.patchkamer-skin\.json$/.test(fname) || /(^|-)v\d+(\.\d+)*(-|\.patchkamer)|(^|-)\d+\.\d+(\.\d+)?(-|\.patchkamer)/.test(fname)) W('filename_form', fname);
  let s; try { s = JSON.parse(raw.toString('utf8').replace(/^﻿/, '')); } catch (e) { E('bad_json', e.message); return { errs, warns }; }
  if (!s || typeof s !== 'object' || Array.isArray(s)) { E('not_object'); return { errs, warns }; }
  for (const k of Object.keys(s)) if (!KNOWN_TOP.has(k)) W('unknown_field', k);
  if (s.format !== 'patchkamer-skin') E('format');
  if (!isInt(s.formatVersion) || s.formatVersion < 1) E('formatversion'); else if (s.formatVersion > 1) W('formatversion_new', s.formatVersion);
  if (!isStr(s.skinsContract) || !/^\d+\.\d+$/.test(s.skinsContract)) E('contract_form');
  else { const [maj, min] = s.skinsContract.split('.').map(Number); if (maj !== 0) E('contract_major', s.skinsContract); else if (min > 1) W('contract_minor', s.skinsContract); }
  const idOk = v => isStr(v) && /^[a-z0-9.-]{3,100}$/.test(v);
  if (!idOk(s.id)) E('id_form');
  const devOk = isStr(s.device) && /^[a-z0-9][a-z0-9.-]{1,98}[a-z0-9]$/.test(s.device);
  if (!devOk) E('device_form'); else if (!s.device.includes('.')) W('device_nodot', s.device);
  if (idOk(s.id) && devOk && !s.id.startsWith(s.device + '.')) W('id_prefix', s.device);
  if (!isStr(s.name) || !s.name.trim() || [...s.name].length > 60) E('name');
  if (!isStr(s.version) || !/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(-[0-9A-Za-z-]+(\.[0-9A-Za-z-]+)*)?(\+[0-9A-Za-z-]+(\.[0-9A-Za-z-]+)*)?$/.test(s.version)) E('version');
  if (!isStr(s.author) || !s.author.trim() || [...s.author].length > 60) E('author');
  if (!isStr(s.license) || !/^(LicenseRef-[A-Za-z0-9.-]+|[A-Za-z0-9][A-Za-z0-9.+-]*)( (AND|OR|WITH) (LicenseRef-[A-Za-z0-9.-]+|[A-Za-z0-9][A-Za-z0-9.+-]*))*$/.test(s.license)) E('license');
  else if ((ctx.inLibrary || basename(dirname(dirname(resolve(path)))) === 'library') && s.license !== 'CC0-1.0') W('license_lib', s.license);
  if (!isStr(s.description) || !s.description.trim() || [...s.description].length > 300) E('description');
  if (!isStr(s.created) || !/^\d{4}-\d{2}-\d{2}$/.test(s.created) || (() => { const [y, m, d] = s.created.split('-').map(Number); const t = new Date(Date.UTC(y, m - 1, d)); return t.getUTCFullYear() !== y || t.getUTCMonth() !== m - 1 || t.getUTCDate() !== d; })()) E('created');
  // icon
  let hasIcon = false;
  if (s.icon !== null && s.icon !== undefined) {
    if (!isStr(s.icon)) E('icon_type');
    else { const info = dataInfo(s.icon); if (!info) E('icon_type');
      else { hasIcon = true; const n = Buffer.byteLength(s.icon); if (n > MAX_ICON) E('icon_big', n);
        if (info.type === 'svg+xml') { const p = svgProblem(svgText(info)); if (p) E('icon_svg', p); } } }
  } else if (s.icon === undefined) E('icon_type');
  // appearances
  const apps = Array.isArray(s.appearances) ? s.appearances : null;
  if (!apps || apps.length < 1 || apps.length > 12) E('app_array');
  const seen = new Set(), ids = []; let assetTotal = 0, cssTotal = 0, nAssets = 0;
  const ranges = []; // voor 'nooit gekozen'
  (apps || []).forEach((a, i) => {
    if (!a || typeof a !== 'object' || Array.isArray(a)) { E('app_object', i); ranges.push(null); return; }
    for (const k of Object.keys(a)) if (!KNOWN_APP.has(k)) W('unknown_field', `appearances[${i}].${k}`);
    if (!isStr(a.id) || !/^[a-z0-9-]{1,40}$/.test(a.id)) E('app_id', i); else if (seen.has(a.id)) E('app_id_dup', i, a.id); else seen.add(a.id);
    ids.push(isStr(a.id) ? a.id : null);
    if (!isStr(a.name) || !a.name.trim() || [...a.name].length > 40) E('app_name', i);
    if (a.description !== undefined && (!isStr(a.description) || [...a.description].length > 300)) E('app_desc', i);
    // when
    let rng = null;
    if (a.when !== undefined) {
      if (!a.when || typeof a.when !== 'object' || Array.isArray(a.when)) E('when_object', i);
      else { const w = a.when; let ok = true;
        for (const k of Object.keys(w)) if (!KNOWN_WHEN.has(k)) W('unknown_field', `appearances[${i}].when.${k}`);
        for (const k of ['minWidth', 'maxWidth']) if (w[k] !== undefined && (!isInt(w[k]) || w[k] < 0 || w[k] > 10000)) { E('when_width', i, k); ok = false; }
        if (ok && w.minWidth !== undefined && w.maxWidth !== undefined && w.minWidth > w.maxWidth) { E('when_order', i, w.minWidth, w.maxWidth); ok = false; }
        let scr = null;
        if (w.screens !== undefined) {
          if (!Array.isArray(w.screens) || w.screens.some(x => !SCREENS.includes(x))) { E('when_screens', i); ok = false; }
          else if (!w.screens.length) { W('when_empty_screens', i); ok = false; }
          else { if (new Set(w.screens).size !== w.screens.length) W('when_dup_screens', i); scr = new Set(w.screens); } }
        if (ok) { if (w.maxWidth === 0) W('when_zero', i);
          if (w.minWidth === undefined && w.maxWidth === undefined && scr === null) W('when_all', i);
          rng = { min: w.minWidth ?? 0, max: w.maxWidth ?? Infinity, scr }; } }
    }
    ranges.push(a.when === undefined ? null : rng);
    // css
    const css = a.css === undefined ? '' : a.css;
    if (!isStr(css)) E('css_type', i);
    else { const n = Buffer.byteLength(css); cssTotal += n; if (n > MAX_CSS) E('css_big', i, n);
      const plain = unescapeCss(css.replace(/\/\*[\s\S]*?\*\//g, ''));
      if (/@import/i.test(css) || /@import/i.test(plain)) E('css_import', i);
      for (const m of plain.matchAll(/url\(\s*(["']?)\s*([^)"']*)/gi)) { const u = m[2].trim();
        if (!(/^data:/i.test(u) || /^var\(\s*--skin-asset-[a-z0-9-]+\s*\)?/i.test(u))) E('css_url', i, u.slice(0, 40)); }
      if (/(^|[^a-z-])(-webkit-)?image-set\s*\(/i.test(plain)) E('css_imageset', i);
      for (const bad of ['</style', 'javascript:', 'expression(', '-moz-binding', 'behavior:']) if (plain.toLowerCase().includes(bad)) E('css_danger', i, bad);
    }
    // assets
    const assets = a.assets === undefined ? {} : a.assets; const used = new Set();
    if (isStr(css)) for (const m of css.matchAll(/--skin-asset-([a-z0-9-]+)/g)) used.add(m[1]);
    if (!assets || typeof assets !== 'object' || Array.isArray(assets)) E('assets_object', i);
    else for (const [name, v] of Object.entries(assets)) { nAssets++;
      if (!/^[a-z0-9-]{1,40}$/.test(name)) E('asset_name', i, name);
      const info = dataInfo(v); if (!info) { E('asset_type', i, name); continue; }
      const n = Buffer.byteLength(v); assetTotal += n; if (n > MAX_ASSET) E('asset_big', i, name, n);
      if (info.type === 'svg+xml') { const p = svgProblem(svgText(info)); if (p) E('asset_svg', i, name, p); }
      if (!used.has(name)) W('css_asset_unused', i, name); }
    for (const u of used) if (!(assets && typeof assets === 'object' && Object.prototype.hasOwnProperty.call(assets, u))) E('css_asset_missing', i, u);
  });
  if (assetTotal > MAX_ASSETS) E('assets_total', assetTotal);
  // default
  if (s.default !== undefined) { if (!isStr(s.default)) E('default_type'); else if (!ids.includes(s.default)) E('default_ref', s.default); }
  else (apps || []).forEach(a => { if (a && typeof a === 'object' && a.when === undefined && isStr(a.id)) W('no_when_no_default', a.id); });
  // nooit gekozen (verborgen achter een eerdere verschijningsvorm)
  for (let j = 1; j < ranges.length; j++) { const L = ranges[j]; if (!L) continue;
    for (let i = 0; i < j; i++) { const Ea = ranges[i]; if (!Ea) continue;
      if (L.min >= Ea.min && L.max <= Ea.max && (Ea.scr === null || (L.scr !== null && [...L.scr].every(x => Ea.scr.has(x))))) { W('when_shadow', j, ids[j], ids[i]); break; } } }
  // namen
  const nameFields = [['name', s.name], ['description', s.description], ['id', s.id]];
  (apps || []).forEach((a, i) => { if (a && typeof a === 'object') { nameFields.push([`appearances[${i}].name`, a.name], [`appearances[${i}].description`, a.description], [`appearances[${i}].id`, a.id]); } });
  nameFields.push(['file name', fname.replace(/\.patchkamer-skin\.json$/i, '')]);
  for (const [lbl, v] of nameFields) if (isStr(v)) { const m = BRAND_RE.exec(v); if (m) E('brand', lbl, m[0]); }
  for (const [lbl, v] of nameFields.slice(0, 2).concat(nameFields.filter(f => /appearances\[\d+\]\.(name|description)$/.test(f[0])))) if (isStr(v)) { const h = dutchHits(v); if (h.length) W('dutch', lbl, h.join(', ')); }
  // map
  const dir = dirname(resolve(path)), parent = basename(dir), grand = basename(dirname(dir));
  if (grand === 'library') { if (devOk && parent !== s.device) E('dir_mismatch', s.device, parent); }
  else if (!ctx.skipDirWarn) W('dir_elsewhere');
  const n = (apps || []).length;
  const info = [vt('ok_dev', s.device), vt(n === 1 ? 'ok_app' : 'ok_apps', n), vt('ok_css', cssTotal), vt('ok_assets', nAssets)];
  if (hasIcon) info.push(vt('ok_icon')); info.push(vt('ok_file', size));
  return { errs, warns, line: `${isStr(s.name) ? s.name : '?'} ${isStr(s.version) ? s.version : '?'} (${isStr(s.id) ? s.id : '?'}) — ${info.join(', ')}`, id: s.id, device: s.device };
}

// ---------- een iconbestand ----------
function validateIconFile(path) {
  const errs = [], warns = []; const E = (k, ...a) => errs.push([k, vt(k, ...a)]), W = (k, ...a) => warns.push([k, vt(k, ...a)]);
  let raw; try { raw = readFileSync(path); } catch (e) { E('unreadable', e.message); return { errs, warns }; }
  const m = /^icon\.(svg|png|webp|jpg)$/.exec(basename(path)); if (!m) { E('icon_file_ext', basename(path)); return { errs, warns }; }
  const ext = m[1]; if (raw.length > MAX_ICON) E('icon_file_big', raw.length);
  let ok;
  if (ext === 'png') ok = raw.length > 8 && raw.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  else if (ext === 'jpg') ok = raw.length > 3 && raw[0] === 0xff && raw[1] === 0xd8 && raw[2] === 0xff;
  else if (ext === 'webp') ok = raw.length > 12 && raw.subarray(0, 4).toString('latin1') === 'RIFF' && raw.subarray(8, 12).toString('latin1') === 'WEBP';
  else { const t = raw.toString('utf8'); ok = /<svg[\s>]/i.test(t) && /^\s*(<\?xml[^>]*\?>\s*)?(<!--[\s\S]*?-->\s*)*<svg/i.test(t);
    if (ok) { const p = svgProblem(t); if (p) E('icon_file_svg', p); if (!/viewBox\s*=\s*["']\s*0\s+0\s+24\s+24\s*["']/.test(t)) W('icon_viewbox'); } }
  if (!ok) E('icon_file_content', ext);
  return { errs, warns, line: vt('ok_icon_file', raw.length) };
}

// ---------- uitvoer ----------
let nFiles = 0, nOk = 0, nBad = 0, nWarn = 0;
const fmt = ([k, t]) => t + (CODES ? ` [${k}]` : '');
function report(path, r, label) {
  nFiles++; nWarn += r.warns.length;
  if (r.errs.length) { nBad++; for (const e of r.errs) console.error(`${vt('fout')} ${label}: ${fmt(e)}`); for (const w of r.warns) console.error(`${vt('letop')} ${label}: ${fmt(w)}`); return; }
  nOk++;
  console.log(`OK  ${label !== path || DIR ? label + ' — ' : ''}${r.line}` + r.warns.map(w => ` · ${vt('letop')}: ${fmt(w)}`).join(''));
}
function validateOne(p, label, ctx) { report(p, /^icon\.[a-z]+$/i.test(basename(p)) ? validateIconFile(p) : validateSkin(p, ctx), label); }

if (DIR) {
  const root = resolve(DIR); let st; try { st = statSync(root); } catch (e) { console.error(`${vt('fout')} ${vt('unreadable', e.message)}`); process.exit(1); }
  if (!st.isDirectory()) { console.error(`${vt('fout')} ${vt('dir_notdir', DIR)}`); process.exit(1); }
  const walk = (d, depth) => { const out = []; for (const e of readdirSync(d, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    if (e.name.startsWith('.')) continue; const p = join(d, e.name);
    if (e.isDirectory()) { if (depth < 3) out.push(...walk(p, depth + 1)); } else out.push(p); } return out; };
  const all = walk(root, 0), skinIds = new Map(); const iconsByDir = new Map(); let n = 0;
  for (const p of all) { const b = basename(p), rel = p.slice(root.length + 1) || b, dir = dirname(p), inLib = basename(dirname(dir)) === 'library';
    if (/\.patchkamer-skin\.json$/i.test(b)) { n++;
      const r = validateSkin(p, { inLibrary: inLib, skipDirWarn: false });
      if (r.id) { const k = r.id; if (skinIds.has(k)) r.warns.push(['dir_dup', vt('dir_dup', k, skinIds.get(k), rel)]); else skinIds.set(k, rel); }
      report(p, r, rel); }
    else if (/^icon\.[a-z0-9]+$/i.test(b)) { n++; validateOne(p, rel); (iconsByDir.get(dir) || iconsByDir.set(dir, []).get(dir)).push(b); }
    else if (/\.json$/i.test(b) || /^(readme|license)/i.test(b)) { /* stil */ }
    else if (inLib || root.includes('/library')) console.log(`${vt('letop')}: ${vt('dir_other', rel)}`); }
  for (const [dir, list] of iconsByDir) if (list.length > 1) { nWarn++; console.log(`${vt('letop')}: ${basename(dir)}: ${vt('icon_multi', list.join(', '))}`); }
  // mapnamen direct onder library/
  if (basename(root) === 'library') for (const e of readdirSync(root, { withFileTypes: true })) if (e.isDirectory() && !e.name.startsWith('.') && !/^[a-z0-9][a-z0-9.-]{1,98}[a-z0-9]$/.test(e.name)) { nFiles++; nBad++; console.error(`${vt('fout')} ${e.name}: ${vt('dir_name', e.name)}`); }
  if (!n) { console.error(`${vt('fout')} ${vt('dir_none', DIR)}`); process.exit(1); }
  console.log(vt('summary', nFiles, nOk, nBad, nWarn));
} else {
  for (const f of files) validateOne(f, f, {});
}
process.exit(nBad ? 1 : 0);
