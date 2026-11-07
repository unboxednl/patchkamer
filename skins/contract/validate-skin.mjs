// validate-skin.mjs — Patchkamer skins contract v0.4
// Gebruik:  node validate-skin.mjs <bestand.patchkamer-skin.json | icon.svg|png|webp|jpg> [...] [--lang nl|en]
//           node validate-skin.mjs --dir <bibliotheekmap> [--lang nl|en]
//           node validate-skin.mjs <skin> --device <apparaat.patchkamer-device.js>   (0.3: id's, rollen en groepen in design.controls, 0.4: id's en groepen in design.meters, tegen het register van het apparaat; onbekend = let op)
// Usage:    same; --dir validates every *.patchkamer-skin.json and icon.* in a library folder (skins/library or one device folder).
// Controleert een skin (zie SKINS-CONTRACT_NL.md / _EN.md) en eindigt met één OK-regel per bestand (exit 0)
// of met alle gevonden fouten (exit 1). Waarschuwingen ("let op" / "warning") staan achter de OK-regel en geven exit 0.
// Alleen Node, geen npm-pakketten. Meldingen in beide talen (--lang nl|en, standaard nl).
// PK_SKIN_CODES=1 zet achter elke melding de code tussen blokhaken (voor tests).
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { basename, dirname, join, resolve } from 'node:path';

// ---------- argumenten ----------
const argv = process.argv.slice(2); let LANG = 'nl', DIR = null, DEVICE = null; const files = [];
for (let i = 0; i < argv.length; i++) { const a = argv[i];
  if (a === '--lang') LANG = argv[++i] || ''; else if (a.startsWith('--lang=')) LANG = a.slice(7);
  else if (a === '--dir') DIR = argv[++i] || ''; else if (a.startsWith('--dir=')) DIR = a.slice(6);
  else if (a === '--device') DEVICE = argv[++i] || ''; else if (a.startsWith('--device=')) DEVICE = a.slice(9);
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
  contract_minor: ['skinsContract {0} is nieuwer dan 0.4; onbekende velden worden genegeerd', 'skinsContract {0} is newer than 0.4; unknown fields are ignored'],
  controls_list: ['{0} moet een lijst regels zijn', '{0} must be a list of rules'],
  controls_max: ['{0} heeft {1} regels; het maximum is {2} (de rest wordt genegeerd)', '{0} has {1} rules; the maximum is {2} (the rest is ignored)'],
  controls_rule: ['{0} moet een object zijn', '{0} must be an object'],
  controls_match: ['{0}.match moet "*", "role:<rol>", "group:<groep>" of een id zijn (1 tot 60 tekens uit [A-Za-z0-9._-])', '{0}.match must be "*", "role:<role>", "group:<group>" or an id (1 to 60 characters from [A-Za-z0-9._-])'],
  controls_role: ['{0}.match: rol "{1}" staat niet in de lijst ({2}); de host negeert de regel', '{0}.match: role "{1}" is not in the list ({2}); the host ignores the rule'],
  controls_none: ['{0}.face: "none" bestaat niet; een skin verbergt geen regelaars (kies rotary, hslider, vslider of default)', '{0}.face: "none" does not exist; a skin does not hide controls (choose rotary, hslider, vslider or default)'],
  controls_enum_num: ['{0} moet een van {1} zijn of een getal van {2} tot {3}', '{0} must be one of {1} or a number from {2} to {3}'],
  controls_num: ['{0} moet een getal van {1} tot {2} zijn', '{0} must be a number from {1} to {2}'],
  controls_colour: ['{0} moet "accent" of een kleur #rgb of #rrggbb zijn', '{0} must be "accent" or a colour #rgb or #rrggbb'],
  controls_empty: ['{0} heeft naast match geen enkele eigenschap; de regel doet niets', '{0} has no property besides match; the rule does nothing'],
  controls_slider_only: ['{0}: length, thickness en thumb gelden alleen voor schuifregelaars, niet bij face "rotary"', '{0}: length, thickness and thumb only apply to sliders, not with face "rotary"'],
  controls_contract: ['design.controls hoort bij skinsContract 0.3; een host met 0.2 of lager negeert het', 'design.controls belongs to skinsContract 0.3; a host on 0.2 or lower ignores it'],
  dev_unreadable: ['--device: het apparaat is niet te laden of faalt in de validator: {0}', '--device: the device cannot be loaded or fails the validator: {0}'],
  dev_other: ['--device is "{0}" maar de skin is voor "{1}"; de regels zijn niet getoetst', '--device is "{0}" but the skin is for "{1}"; the rules were not checked'],
  dev_no_ids: ['het apparaat meldt geen id\'s of groepen aan (nog niet gemigreerd); regels op een id of groep doen niets', 'the device registers no ids or groups (not migrated yet); rules on an id or group do nothing'],
  dev_unknown_id: ['{0}.match: id "{1}" staat niet in het register van het apparaat; de host negeert de regel', '{0}.match: id "{1}" is not in the device\'s register; the host ignores the rule'],
  dev_unknown_group: ['{0}.match: groep "{1}" staat niet in het register van het apparaat', '{0}.match: group "{1}" is not in the device\'s register'],
  dev_unknown_role: ['{0}.match: het apparaat heeft geen regelaar met rol "{1}"', '{0}.match: the device has no control with role "{1}"'],
  ok_controls: ['{0} regelaarregels', '{0} control rules'],
  meters_list: ['{0} moet een lijst regels zijn', '{0} must be a list of rules'],
  meters_max: ['{0} heeft {1} regels; het maximum is {2} (de rest wordt genegeerd)', '{0} has {1} rules; the maximum is {2} (the rest is ignored)'],
  meters_rule: ['{0} moet een object zijn', '{0} must be an object'],
  meters_match: ['{0}.match moet "*", "group:<groep>" of een id zijn (1 tot 60 tekens uit [A-Za-z0-9._-]); "role:" bestaat hier niet, want elke meter heeft rol meter', '{0}.match must be "*", "group:<group>" or an id (1 to 60 characters from [A-Za-z0-9._-]); "role:" does not exist here, every meter has role meter'],
  meters_enum_num: ['{0} moet een van {1} zijn of een getal van {2} tot {3}', '{0} must be one of {1} or a number from {2} to {3}'],
  meters_num: ['{0} moet een getal van {1} tot {2} zijn', '{0} must be a number from {1} to {2}'],
  meters_int: ['{0} moet een geheel getal van {1} tot {2} zijn', '{0} must be a whole number from {1} to {2}'],
  meters_colour: ['{0} moet "accent", "default" of een kleur #rgb of #rrggbb zijn', '{0} must be "accent", "default" or a colour #rgb or #rrggbb'],
  meters_none: ['{0}: een skin verbergt geen meter (er is geen face "none"); kies bar, ledladder, vu of default', '{0}: a skin does not hide a meter (there is no face "none"); choose bar, ledladder, vu or default'],
  meters_empty: ['{0} heeft naast match geen enkele eigenschap; de regel doet niets', '{0} has no property besides match; the rule does nothing'],
  meters_vu_width: ['{0}: width geldt voor bar en ledladder en wordt bij face "vu" genegeerd (de hoogte volgt uit length)', '{0}: width applies to bar and ledladder and is ignored with face "vu" (the height follows from length)'],
  meters_vu_orientation: ['{0}: orientation geldt voor bar en ledladder; een vu-schaal is altijd horizontaal', '{0}: orientation applies to bar and ledladder; a vu scale is always horizontal'],
  meters_scale_bar: ['{0}: scale geldt alleen voor vu en ledladder, niet bij face "bar"', '{0}: scale only applies to vu and ledladder, not with face "bar"'],
  meters_segments_face: ['{0}: segments geldt alleen voor face "ledladder"', '{0}: segments only applies to face "ledladder"'],
  meters_contract: ['design.meters hoort bij skinsContract 0.4; een host met 0.3 of lager negeert het', 'design.meters belongs to skinsContract 0.4; a host on 0.3 or lower ignores it'],
  dev_no_meters: ['het apparaat meldt geen meters aan (geen host.ui.meter); regels in design.meters doen niets', 'the device registers no meters (no host.ui.meter); rules in design.meters do nothing'],
  dev_unknown_meter: ['{0}.match: meter-id "{1}" staat niet in het register van het apparaat; de host negeert de regel', '{0}.match: meter id "{1}" is not in the device\'s register; the host ignores the rule'],
  dev_unknown_meter_group: ['{0}.match: groep "{1}" heeft geen meter in het register van het apparaat', '{0}.match: group "{1}" has no meter in the device\'s register'],
  ok_meters: ['{0} meterregels', '{0} meter rules'],
  design_object: ['{0} moet een object zijn', '{0} must be an object'],
  design_enum: ['{0} moet een van {1} zijn', '{0} must be one of {1}'],
  design_colour: ['{0} moet een kleur #rgb of #rrggbb zijn', '{0} must be a colour #rgb or #rrggbb'],
  design_custom_unused: ['{0}.colors.custom wordt niet gebruikt: scheme is niet "custom"', '{0}.colors.custom is not used: scheme is not "custom"'],
  design_custom_missing: ['{0}.colors: scheme "custom" mist {1}; die vallen terug op de werkruimtekleur', '{0}.colors: scheme "custom" lacks {1}; they fall back to the workspace colour'],
  design_contrast: ['{0}.colors: contrast tussen text en {1} is {2}:1; onder 3:1 is slecht leesbaar', '{0}.colors: contrast between text and {1} is {2}:1; below 3:1 is hard to read'],
  design_contract: ['design hoort bij skinsContract 0.2; een host met 0.1 negeert het', 'design belongs to skinsContract 0.2; a host on 0.1 ignores it'],
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
  ok_design: ['met design', 'with design'],
  ok_file: ['bestand {0} bytes', 'file {0} bytes'],
  ok_icon_file: ['iconbestand {0} bytes', 'icon file {0} bytes'],
};
const vt = (key, ...a) => { const e = M[key]; const s = e ? e[LANG === 'en' ? 1 : 0] : '⟦' + key + '⟧'; return s.replace(/\{(\d+)\}/g, (m, i) => String(a[+i])); };
if (!['nl', 'en'].includes(LANG)) { console.error('--lang: nl | en'); process.exit(2); }
if (!DIR && !files.length) { console.error(vt('usage')); process.exit(2); }

// ---------- hulpfuncties ----------
const MAX_FILE = 2 * 1024 * 1024, MAX_ICON = 200 * 1024, MAX_CSS = 200 * 1024, MAX_ASSET = 200 * 1024, MAX_ASSETS = 1024 * 1024;
const SCREENS = ['phone', 'compact', 'wide'];
const KNOWN_TOP = new Set(['format', 'formatVersion', 'skinsContract', 'id', 'device', 'name', 'version', 'author', 'license', 'description', 'created', 'icon', 'default', 'appearances', 'design']);
const KNOWN_APP = new Set(['id', 'name', 'description', 'when', 'css', 'assets', 'design']);
const KNOWN_WHEN = new Set(['minWidth', 'maxWidth', 'screens']);
// de lijst met merk- en modelnamen staat in rot13, zodat de namen zelf niet in de repo staan
const rot13 = t => t.replace(/[a-z]/gi, c => String.fromCharCode((c <= 'Z' ? 90 : 122) >= (c = c.charCodeAt(0) + 13) ? c : c - 26));
const BRAND_RE = new RegExp(rot13('nec[ _-]?[0-9]|bqlffrl|nkkr|zbbt|xbet|ebynaq|lnznun|frdhragvny|boreurvz|whab|zvavzbbt|cebcurg|whcvgre|zf-?20|fu-?101|ceb-?bar|qk-?7'), 'i');
const DUTCH = ['de', 'het', 'een', 'voor', 'met', 'van', 'niet', 'geen', 'maar', 'naar', 'wordt', 'deze', 'ook', 'kleur', 'kleuren', 'knop', 'knoppen', 'regelaar', 'regelaars', 'apparaat', 'apparaten', 'geluid', 'standaard', 'gewoon', 'normaal', 'uiterlijk', 'donker', 'licht', 'zwart', 'wit', 'rood', 'groen', 'blauw', 'geel', 'oranje', 'paars', 'grijs', 'bruin', 'roze', 'eenvoudig', 'helder', 'nacht', 'groot', 'klein', 'vloer', 'schuif', 'voorbeeld', 'verschijning', 'kaart', 'hout', 'staal', 'koper', 'zilver', 'goud', 'ouderwets', 'rustig', 'strak'];
const IMG_RE = /^data:image\/(svg\+xml|png|webp|jpeg)(;[A-Za-z0-9=._+-]+)*,/;
const PORT_MODES = ['default', 'always', 'hover', 'strip', 'bar'], HAPTIC_LEVELS = ['off', 'light', 'medium', 'strong'];
const KNOB_STYLES = ['workspace', 'rotary', 'slider'], KNOB_SIZES = ['s', 'm', 'l'], COLOUR_SCHEMES = ['workspace', 'custom'];
const COLOUR_KEYS = ['bg', 'surface', 'text', 'muted', 'accent', 'line'], HAPTIC_KEYS = ['click', 'turn', 'slide'];
const CTL_ROLES = ['param', 'fader', 'toggle', 'button', 'pad', 'step', 'display', 'select', 'meter', 'jack'];
const CTL_FACE = ['rotary', 'hslider', 'vslider', 'default'], CTL_SIZE = ['xs', 's', 'm', 'l', 'xl'], CTL_LENGTH = ['short', 'medium', 'long'], CTL_THUMB = ['round', 'square', 'bar', 'none'], CTL_SHOW = ['always', 'hover', 'never'], CTL_MAX = 64;
const MET_FACE = ['bar', 'ledladder', 'vu', 'default'], MET_ORI = ['auto', 'vertical', 'horizontal'], MET_LEN = ['short', 'medium', 'long'], MET_BAL = ['default', 'fast', 'vu', 'slow'], MET_ONOFF = ['on', 'off', 'default'], MET_CLIP = ['show', 'hide', 'default'], MET_SCALE = ['show', 'hide'];
const MET_KEYS = ['match', 'face', 'orientation', 'length', 'width', 'ballistics', 'peakHold', 'clip', 'scale', 'color', 'segments'];
const CTL_KEYS = ['match', 'face', 'size', 'length', 'thickness', 'thumb', 'color', 'showValue'];
const KNOWN_DESIGN = { ports: ['mode'], colors: ['scheme', 'custom'], haptics: HAPTIC_KEYS, knobs: ['style', 'size'] };
const isObj = v => v !== null && typeof v === 'object' && !Array.isArray(v);
const normColour = v => { if (typeof v !== 'string') return null; const m = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.exec(v); if (!m) return null; let h = m[1].toLowerCase(); if (h.length === 3) h = [...h].map(c => c + c).join(''); return '#' + h; };
const lum = hex => { const c = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(x => x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
const contrast = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
// Controleert de vorm van één design-object (streng: fouten bij verkeerde waarden, let op bij onbekende sleutels).
// Geeft de geldige, genormaliseerde delen terug (voor samenvoegen en contrastcontrole).
function checkControls(list, path, E, W, C) {
  if (!Array.isArray(list)) { E('controls_list', path); return; }
  if (list.length > CTL_MAX) E('controls_max', path, list.length, CTL_MAX);
  list.slice(0, CTL_MAX).forEach((r, i) => { const P = `${path}[${i}]`;
    if (!isObj(r)) { E('controls_rule', P); return; }
    for (const k of Object.keys(r)) if (!CTL_KEYS.includes(k)) W('unknown_field', `${P}.${k}`);
    const enm = (k, list2) => { if (r[k] === undefined) return false; if (list2.includes(r[k])) return true; E('design_enum', `${P}.${k}`, list2.map(x => '"' + x + '"').join(', ')); return false; };
    const numOrEnum = (k, list2, a, b) => { if (r[k] === undefined) return false; if (list2.includes(r[k]) || (typeof r[k] === 'number' && Number.isFinite(r[k]) && r[k] >= a && r[k] <= b)) return true; E('controls_enum_num', `${P}.${k}`, list2.map(x => '"' + x + '"').join(', '), a, b); return false; };
    const m = r.match; let matchOk = false;
    if (typeof m !== 'string' || !/^(\*|role:[a-z]{1,16}|group:[A-Za-z0-9._-]{1,60}|[A-Za-z0-9._-]{1,60})$/.test(m)) E('controls_match', P);
    else { matchOk = true; if (m.startsWith('role:') && !CTL_ROLES.includes(m.slice(5))) W('controls_role', P, m.slice(5), CTL_ROLES.join(', ')); }
    let n = 0;
    if (r.face === 'none') E('controls_none', P); else if (enm('face', CTL_FACE)) n++;
    if (numOrEnum('size', CTL_SIZE, 0.6, 2)) n++;
    if (numOrEnum('length', CTL_LENGTH, 40, 400)) n++;
    if (r.thickness !== undefined) { if (typeof r.thickness === 'number' && Number.isFinite(r.thickness) && r.thickness >= 2 && r.thickness <= 24) n++; else E('controls_num', `${P}.thickness`, 2, 24); }
    if (enm('thumb', CTL_THUMB)) n++;
    if (r.color !== undefined) { if (r.color === 'accent' || normColour(r.color)) n++; else E('controls_colour', `${P}.color`); }
    if (enm('showValue', CTL_SHOW)) n++;
    if (matchOk && n === 0 && !CTL_KEYS.slice(1).some(k => r[k] !== undefined)) W('controls_empty', P);
    if (r.face === 'rotary' && (r.length !== undefined || r.thickness !== undefined || r.thumb !== undefined)) W('controls_slider_only', P);
    if (matchOk && C) C.push({ p: P, match: m, face: r.face }); });
}
// design.meters (0.4): geordende lijst regels, de laatste passende regel wint per eigenschap. Streng: fouten bij verkeerde waarden.
function checkMeters(list, path, E, W, C) {
  if (!Array.isArray(list)) { E('meters_list', path); return; }
  if (list.length > CTL_MAX) E('meters_max', path, list.length, CTL_MAX);
  list.slice(0, CTL_MAX).forEach((r, i) => { const P = `${path}[${i}]`;
    if (!isObj(r)) { E('meters_rule', P); return; }
    for (const k of Object.keys(r)) if (!MET_KEYS.includes(k)) W('unknown_field', `${P}.${k}`);
    const enm = (k, list2) => { if (r[k] === undefined) return false; if (list2.includes(r[k])) return true; E('design_enum', `${P}.${k}`, list2.map(x => '"' + x + '"').join(', ')); return false; };
    const m = r.match; let matchOk = false;
    if (typeof m !== 'string' || !/^(\*|group:[A-Za-z0-9._-]{1,60}|[A-Za-z0-9._-]{1,60})$/.test(m)) E('meters_match', P); else matchOk = true;
    let n = 0;
    if (r.face === 'none') E('meters_none', P); else if (enm('face', MET_FACE)) n++;
    if (enm('orientation', MET_ORI)) n++;
    if (r.length !== undefined) { if (MET_LEN.includes(r.length) || (typeof r.length === 'number' && Number.isFinite(r.length) && r.length >= 24 && r.length <= 400)) n++; else E('meters_enum_num', `${P}.length`, MET_LEN.map(x => '"' + x + '"').join(', '), 24, 400); }
    if (r.width !== undefined) { if (typeof r.width === 'number' && Number.isFinite(r.width) && r.width >= 3 && r.width <= 48) n++; else E('meters_num', `${P}.width`, 3, 48); }
    if (enm('ballistics', MET_BAL)) n++;
    if (enm('peakHold', MET_ONOFF)) n++;
    if (enm('clip', MET_CLIP)) n++;
    if (enm('scale', MET_SCALE)) n++;
    if (r.color !== undefined) { if (r.color === 'accent' || r.color === 'default' || normColour(r.color)) n++; else E('meters_colour', `${P}.color`); }
    if (r.segments !== undefined) { if (Number.isInteger(r.segments) && r.segments >= 8 && r.segments <= 40) n++; else E('meters_int', `${P}.segments`, 8, 40); }
    if (matchOk && n === 0 && !MET_KEYS.slice(1).some(k => r[k] !== undefined)) W('meters_empty', P);
    if (r.face === 'vu' && r.width !== undefined) W('meters_vu_width', P);
    if (r.face === 'vu' && r.orientation !== undefined && r.orientation !== 'auto') W('meters_vu_orientation', P);
    if (r.face === 'bar' && r.scale !== undefined) W('meters_scale_bar', P);
    if (r.segments !== undefined && r.face !== undefined && r.face !== 'ledladder' && r.face !== 'default') W('meters_segments_face', P);
    if (matchOk && C) C.push({ p: P, match: m, face: r.face, kind: 'meters' }); });
}
function checkDesignShape(d, path, E, W, C) {
  const out = {};
  if (!isObj(d)) { E('design_object', path); return out; }
  for (const k of Object.keys(d)) if (!(k in KNOWN_DESIGN) && k !== 'controls' && k !== 'meters') W('unknown_field', `${path}.${k}`);
  if (d.meters !== undefined) { out.meters = Array.isArray(d.meters) ? d.meters.slice(0, CTL_MAX).filter(isObj) : []; checkMeters(d.meters, `${path}.meters`, E, W, C); }
  if (d.controls !== undefined) { out.controls = Array.isArray(d.controls) ? d.controls.slice(0, CTL_MAX).filter(isObj) : []; checkControls(d.controls, `${path}.controls`, E, W, C); }
  for (const sec of Object.keys(KNOWN_DESIGN)) { if (d[sec] === undefined) continue; const sp = `${path}.${sec}`;
    if (!isObj(d[sec])) { E('design_object', sp); continue; }
    for (const k of Object.keys(d[sec])) if (!KNOWN_DESIGN[sec].includes(k)) W('unknown_field', `${sp}.${k}`);
    const o = out[sec] = {}, src = d[sec];
    const en = (k, list) => { if (src[k] === undefined) return; if (list.includes(src[k])) o[k] = src[k]; else E('design_enum', `${sp}.${k}`, list.map(x => '"' + x + '"').join(', ')); };
    if (sec === 'ports') en('mode', PORT_MODES);
    else if (sec === 'haptics') HAPTIC_KEYS.forEach(k => en(k, HAPTIC_LEVELS));
    else if (sec === 'knobs') { en('style', KNOB_STYLES); en('size', KNOB_SIZES); }
    else { en('scheme', COLOUR_SCHEMES);
      if (src.custom !== undefined) { if (!isObj(src.custom)) E('design_object', `${sp}.custom`);
        else { o.custom = {}; for (const k of Object.keys(src.custom)) { if (!COLOUR_KEYS.includes(k)) { W('unknown_field', `${sp}.custom.${k}`); continue; }
          const c = normColour(src.custom[k]); if (c) o.custom[k] = c; else E('design_colour', `${sp}.custom.${k}`); } } } }
  }
  return out;
}
const mergeDesign = (a, b) => { const r = {}; if (a?.meters?.length || b?.meters?.length) r.meters = [...(a?.meters || []), ...(b?.meters || [])]; if (a?.controls?.length || b?.controls?.length) r.controls = [...(a?.controls || []), ...(b?.controls || [])]; for (const sec of Object.keys(KNOWN_DESIGN)) { if (a?.[sec] || b?.[sec]) { r[sec] = { ...(a?.[sec] || {}), ...(b?.[sec] || {}) }; if (sec === 'colors' && (a?.[sec]?.custom || b?.[sec]?.custom)) r[sec].custom = { ...(a?.[sec]?.custom || {}), ...(b?.[sec]?.custom || {}) }; } } return r; };
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

// ---------- het register van een apparaat (voor --device): draait validate-instrument.mjs --sub ----------
function loadDevice(path) {
  const V = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'contract', 'validate-instrument.mjs');
  const r = spawnSync(process.execPath, [V, path, '--sub'], { encoding: 'utf8' });
  if (r.status !== 0) return { error: ((r.stderr || r.stdout || '').trim().split('\n')[0] || 'exit ' + r.status) };
  const id = /^PKDEV (.*)$/m.exec(r.stdout || ''), c = /^PKCTL (.*)$/m.exec(r.stdout || '');
  if (!id || !c) return { error: 'validate-instrument.mjs gaf geen register (te oude versie?)' };
  try { return { id: id[1], list: JSON.parse(c[1]) }; } catch (e) { return { error: e.message }; }
}
function checkAgainstDevice(s, rules, dev, W) {
  if (dev.error) { W('dev_unreadable', dev.error); return; }
  if (s.device !== dev.id) { W('dev_other', dev.id, s.device); return; }
  const CL = dev.list.filter(c => c.role !== 'meter' && c.type !== 'meter'), ML = dev.list.filter(c => c.role === 'meter' || c.type === 'meter');
  const ids = new Set(CL.filter(c => c.id).map(c => c.id)), groups = new Set(CL.filter(c => c.group).map(c => c.group)), roles = new Set(CL.map(c => c.role));
  const mids = new Set(ML.filter(c => c.id).map(c => c.id)), mgroups = new Set(ML.filter(c => c.group).map(c => c.group));
  const cr = rules.filter(r => r.kind !== 'meters'), mr = rules.filter(r => r.kind === 'meters');
  if (!ids.size && !groups.size && cr.some(r => !r.match.startsWith('role:') && r.match !== '*')) W('dev_no_ids');
  if (!ML.length && mr.length) W('dev_no_meters');
  const seen = new Set();
  for (const r of cr) { const m = r.match; if (m === '*') continue;
    const key = r.p; if (seen.has(key)) continue; seen.add(key);
    if (m.startsWith('role:')) { if (CTL_ROLES.includes(m.slice(5)) && !roles.has(m.slice(5))) W('dev_unknown_role', r.p, m.slice(5)); }
    else if (m.startsWith('group:')) { if ((ids.size || groups.size) && !groups.has(m.slice(6))) W('dev_unknown_group', r.p, m.slice(6)); }
    else if ((ids.size || groups.size) && !ids.has(m)) W('dev_unknown_id', r.p, m); }
  if (ML.length) for (const r of mr) { const m = r.match; if (m === '*') continue;
    if (m.startsWith('group:')) { if (!mgroups.has(m.slice(6))) W('dev_unknown_meter_group', r.p, m.slice(6)); }
    else if (!mids.has(m)) W('dev_unknown_meter', r.p, m); }
}

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
  else { const [maj, min] = s.skinsContract.split('.').map(Number); if (maj !== 0) E('contract_major', s.skinsContract); else if (min > 4) W('contract_minor', s.skinsContract); }
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
  // design (laag 1, contract 0.2)
  const CR = [];   // regels uit design.controls (voor --device)
  const skinDesign = s.design === undefined ? null : checkDesignShape(s.design, 'design', E, W, CR);
  let hasDesign = s.design !== undefined;
  // appearances
  const apps = Array.isArray(s.appearances) ? s.appearances : null;
  if (!apps || apps.length < 1 || apps.length > 12) E('app_array');
  const seen = new Set(), ids = []; let assetTotal = 0, cssTotal = 0, nAssets = 0;
  const ranges = []; // voor 'nooit gekozen'
  const appDesigns = [];
  (apps || []).forEach((a, i) => {
    if (!a || typeof a !== 'object' || Array.isArray(a)) { E('app_object', i); ranges.push(null); return; }
    for (const k of Object.keys(a)) if (!KNOWN_APP.has(k)) W('unknown_field', `appearances[${i}].${k}`);
    if (!isStr(a.id) || !/^[a-z0-9-]{1,40}$/.test(a.id)) E('app_id', i); else if (seen.has(a.id)) E('app_id_dup', i, a.id); else seen.add(a.id);
    ids.push(isStr(a.id) ? a.id : null);
    if (!isStr(a.name) || !a.name.trim() || [...a.name].length > 40) E('app_name', i);
    if (a.description !== undefined && (!isStr(a.description) || [...a.description].length > 300)) E('app_desc', i);
    if (a.design !== undefined) { hasDesign = true; appDesigns[i] = checkDesignShape(a.design, `appearances[${i}].design`, E, W, CR); }
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
  // design: samengevoegd per verschijningsvorm (skin-niveau, daarover de verschijning per sleutel)
  if (hasDesign && /^0\.1$/.test(String(s.skinsContract))) W('design_contract');
  const nCtl = (skinDesign?.controls?.length || 0) + appDesigns.reduce((a, x) => a + (x?.controls?.length || 0), 0);
  if (nCtl && /^0\.[012]$/.test(String(s.skinsContract))) W('controls_contract');
  const nMet = (skinDesign?.meters?.length || 0) + appDesigns.reduce((a, x) => a + (x?.meters?.length || 0), 0);
  if (nMet && /^0\.[0123]$/.test(String(s.skinsContract))) W('meters_contract');
  if (ctx.device && CR.length) checkAgainstDevice(s, CR, ctx.device, W);
  const seenMsg = new Set();
  const once = (k, ...a) => { const t = vt(k, ...a); if (!seenMsg.has(t)) { seenMsg.add(t); warns.push([k, t]); } };
  (apps || []).forEach((a, i) => { if (!skinDesign && !appDesigns[i]) return;
    const d = mergeDesign(skinDesign, appDesigns[i]), lbl = appDesigns[i] ? `appearances[${i}].design` : 'design', cs = d.colors || {};
    if (cs.scheme === 'custom') {
      const have = cs.custom || {}, miss = COLOUR_KEYS.filter(k => !have[k]); if (miss.length) once('design_custom_missing', lbl, miss.join(', '));
      for (const other of ['bg', 'surface']) if (have.text && have[other]) { const c = contrast(have.text, have[other]); if (c < 3) once('design_contrast', lbl, other, c.toFixed(1)); }
    } else if (cs.custom && Object.keys(cs.custom).length) once('design_custom_unused', lbl); });
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
  if (hasIcon) info.push(vt('ok_icon')); if (hasDesign) info.push(vt('ok_design')); if (nCtl) info.push(vt('ok_controls', nCtl)); if (nMet) info.push(vt('ok_meters', nMet)); info.push(vt('ok_file', size));
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
const DEV = DEVICE ? loadDevice(DEVICE) : null;
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
      const r = validateSkin(p, { inLibrary: inLib, skipDirWarn: false, device: DEV });
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
  for (const f of files) validateOne(f, f, { device: DEV });
}
process.exit(nBad ? 1 : 0);
