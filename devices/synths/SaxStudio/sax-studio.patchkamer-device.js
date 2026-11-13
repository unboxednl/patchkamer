// SPDX-License-Identifier: AGPL-3.0-or-later
// 1.0.0 — Sax Studio: gesampelde saxofoons (sopraan, alto, tenor, bariton) voor sequencers (Patchkamer contract v1.35).
//         De opnames zitten NIET in de repo en niet in Patchkamer: het apparaat haalt ze na een klik op "Laden" via host.fetchFile (contract §13i) op uit
//         MTG Solo Saxophones (MTG, Universitat Pompeu Fabra, via freesound.org; gesneden, gelooped en in SFZ gezet door kinwie; CC BY 4.0).
//         Spel uit de sequencer: velocity kiest laag, kleur en artikulatie (zacht = subtone met adem, hard = bite), notelengte kiest staccato,
//         overlappende noten klinken als mono-legato (korte overgang, geen nieuwe aanzet). Growl, falloff, scoop, vertraagd vibrato, adem- en klepruis,
//         humanize, transpositie en stemming, een sectiestand met 2 tot 4 gestapelde stemmen en een lichte nabewerking (EQ, drive, kleine kamer of plaat).
//         getState bevat instellingen en nooit audio. Niet beluisterd; gemeten staat in AGENTS.md.

const BASE = 'https://cdn.jsdelivr.net/gh/sfzinstruments/MTG.SoloSax@b494d256549b3d088fdec176ce82867f8a1f58b2/MTG%20Solo%20Saxophones/Samples/';
// jsDelivr weigert 35 van de 737 bestanden van deze grote repo (403, pakketgrens); dan valt het apparaat terug op dezelfde vastgepinde commit bij GitHub zelf
const RAW = 'https://raw.githubusercontent.com/sfzinstruments/MTG.SoloSax/b494d256549b3d088fdec176ce82867f8a1f58b2/MTG%20Solo%20Saxophones/Samples/';
const SRC = { home: 'https://github.com/sfzinstruments/MTG.SoloSax', license: 'CC-BY-4.0' };
// Per instrument: base = laagste noot (MIDI, klinkende toonhoogte), hi = hoogste noot; L = lagen p/m/f met [bestandsnummer, natuurlijke toonhoogte (MIDI, 2 decimalen),
// volume in dB uit de SFZ, grootte in kB]; B = adem-ruis [nummer, kB]; K = klepruis [nummer, kB]. Bestand: <ins>_<laag>_<nn>.flac, <ins>_b_<nn>.flac, <ins>_k_<nn>.flac
const CAT = {
  sop: { base: 56, hi: 88, L: { p:[[1,56.13,-1.0,354],[2,57.11,0.0,397],[3,58.13,-1.0,406],[4,59.1,-1.0,434],[5,59.98,0.0,424],[6,61.02,0.0,425],[7,62.06,0.0,325],[8,63.08,0.0,422],[9,64.06,-2.0,333],[10,65.09,0.0,446],[11,66.03,1.0,325],[12,67.07,0.0,329],[13,68.14,0.0,288],[14,69.12,0.0,284],[15,70.16,0.0,273],[16,71.08,1.0,271],[17,72.21,-2.0,319],[18,73.21,1.0,336],[19,74.18,0.5,277],[20,75.18,0.0,267],[21,76.17,0.0,266],[22,77.24,0.0,281],[23,78.17,0.0,279],[24,79.21,0.0,277],[25,80.16,0.0,331],[26,81.28,-2.0,300],[27,82.26,-1.5,310],[28,83.37,-2.0,281],[29,84.39,-2.0,266],[30,85.32,0.0,284],[31,86.34,1.0,271],[32,87.35,0.0,298],[33,88.15,-1.5,291]], f:[[1,56.13,-3.0,341],[2,57.11,-1.0,344],[3,58.12,-3.5,308],[4,59.1,-3.0,326],[5,59.96,0.0,308],[6,61.02,2.0,289],[7,62.05,0.0,420],[8,63.05,-2.0,328],[9,64.07,-1.5,423],[10,65.09,0.0,331],[11,66.03,0.0,437],[12,67.1,0.0,426],[13,68.11,0.0,421],[14,69.1,-1.0,407],[15,70.14,0.0,397],[16,71.13,3.0,367],[17,72.18,-3.0,267],[18,73.2,0.0,271],[19,74.2,0.0,341],[20,75.23,0.0,328],[21,76.14,-1.5,344],[22,77.19,-1.0,377],[23,78.15,0.0,378],[24,79.21,0.0,377],[25,80.25,0.0,327],[26,81.21,-1.5,373],[27,82.21,-1.5,357],[28,83.45,-1.0,383],[29,84.37,-2.0,401],[30,85.35,0.0,338],[31,86.41,0.0,324],[32,87.38,0.0,316],[33,88.32,0.0,305]] }, B: [[1,58],[2,59],[3,69],[4,52],[5,38],[6,108],[7,65],[8,53],[9,37],[10,55],[11,45],[12,46],[13,36],[14,30],[15,40],[16,60],[17,30],[18,48],[19,33],[20,61],[21,45],[22,32],[23,37],[24,38],[25,31],[26,47],[27,44],[28,43],[29,25],[30,36],[31,40],[32,52],[33,60],[34,61],[35,27],[36,45],[37,38],[38,53],[39,64],[40,54],[41,55],[42,23],[43,46],[44,51],[45,74],[46,66],[47,37],[48,56],[49,59],[50,56],[51,54],[52,57],[53,56],[54,51],[55,46],[56,40],[57,53],[58,39],[59,42],[60,26],[61,48],[62,44],[63,32],[64,27],[65,37],[66,39],[67,58],[68,33],[69,32],[70,44],[71,68],[72,52],[73,38],[74,51],[75,42],[76,49],[77,38],[78,51],[79,36],[80,51]], K: [[1,35],[2,27],[3,40],[4,34],[5,15],[6,17],[7,13],[8,14],[9,13],[10,17],[11,14],[12,26],[13,38],[14,44],[15,13],[16,16],[17,26],[18,20],[19,33],[20,18],[21,25],[22,12],[23,20],[24,16],[25,34],[26,23],[27,36],[28,13]] },
  alt: { base: 49, hi: 81, L: { p:[[1,49.16,-7.5,343],[2,50.05,-4.0,357],[3,50.97,-1.0,306],[4,51.93,-0.5,316],[5,52.89,0.0,328],[6,53.89,-1.0,328],[7,54.97,0.0,331],[8,55.94,0.0,341],[9,56.97,0.0,365],[10,57.98,0.0,361],[11,58.98,0.0,384],[12,60.02,0.0,393],[13,60.98,2.0,374],[14,61.94,1.0,345],[15,62.97,3.0,337],[16,63.89,1.5,346],[17,65.17,-1.5,337],[18,66.07,1.0,338],[19,67.11,0.0,336],[20,68.08,-1.0,313],[21,69.03,-1.0,321],[22,70.0,0.0,341],[23,71.04,0.0,351],[24,72.1,-1.0,382],[25,73.14,0.0,404],[26,74.12,0.0,384],[27,75.16,0.0,338],[28,76.25,0.0,360],[29,77.24,0.0,350],[30,78.22,-1.0,356],[31,79.27,0.0,362],[32,80.22,-0.5,353],[33,81.2,-1.0,346]], f:[[1,49.21,-7.0,347],[2,50.11,-3.0,424],[3,51.02,-2.0,368],[4,52.0,0.0,406],[5,52.93,0.0,337],[6,53.95,-2.0,372],[7,55.02,0.0,436],[8,56.03,0.0,400],[9,57.05,-1.5,393],[10,58.05,0.0,387],[11,59.06,0.0,349],[12,60.13,0.0,367],[13,61.11,0.0,358],[14,62.07,0.0,373],[15,63.13,2.0,355],[16,64.08,1.0,358],[17,65.25,-1.0,331],[18,66.21,1.5,376],[19,67.22,0.0,364],[20,68.21,-1.0,349],[21,69.15,-2.0,376],[22,70.17,-0.5,387],[23,71.15,0.0,418],[24,72.19,0.0,390],[25,73.23,0.0,369],[26,74.23,0.5,383],[27,75.26,1.0,352],[28,76.4,-1.0,358],[29,77.32,-2.5,375],[30,78.33,-1.0,387],[31,79.34,-1.0,403],[32,80.25,-2.5,387],[33,81.22,-4.5,360]] }, B: [[1,28],[2,71],[3,82],[4,84],[5,78],[6,74],[7,75],[8,84],[9,71],[10,75],[11,69],[12,63],[13,58],[14,61],[15,67],[16,64],[17,76],[18,52],[19,63],[20,52],[21,55],[22,54],[23,69],[24,59],[25,49],[26,58],[27,48],[28,49],[29,48],[30,49],[31,63],[32,49],[33,54],[34,51],[35,36],[36,52],[37,64],[38,81],[39,68],[40,67],[41,68],[42,59],[43,54],[44,54],[45,52],[46,51],[47,55],[48,52],[49,61],[50,56],[51,34],[52,39],[53,30],[54,25],[55,18],[56,35],[57,40],[58,25],[59,43],[60,41],[61,38],[62,39],[63,37],[64,39],[65,33],[66,27],[67,38],[68,47]], K: [[1,23],[2,29],[3,15],[4,25],[5,25],[6,25],[7,17],[8,25],[9,19],[10,29],[11,27],[12,33],[13,14],[14,21],[15,16],[16,17],[17,18],[18,15],[19,32],[20,38],[21,36],[22,13],[23,11],[24,25],[25,12],[26,24],[27,22],[28,24],[29,29],[30,22],[31,21],[32,14],[33,17],[34,19],[35,16],[36,19]] },
  ten: { base: 44, hi: 76, L: { p:[[1,44.15,-6.5,292],[2,45.13,-4.5,318],[3,46.13,-3.0,311],[4,47.16,-3.0,291],[5,48.09,0.0,280],[6,48.98,0.0,298],[7,50.07,0.0,329],[8,51.11,0.0,313],[9,52.14,0.0,306],[10,53.17,0.0,312],[11,54.13,0.0,347],[12,55.15,0.0,334],[13,56.1,0.0,339],[14,57.1,0.0,349],[15,58.17,1.0,345],[16,59.1,0.0,326],[17,60.15,0.0,326],[18,61.07,0.0,337],[19,62.15,0.0,345],[20,63.17,0.0,318],[21,64.17,0.0,322],[22,65.2,0.0,354],[23,66.18,0.0,355],[24,67.21,0.0,373],[25,68.17,0.0,408],[26,69.12,-0.5,386],[27,70.12,-2.0,364],[28,71.2,0.0,350],[29,72.15,0.0,366],[30,73.18,1.5,340],[31,74.24,3.0,321],[32,75.27,1.0,340],[33,76.36,1.0,326]], f:[[1,44.12,-5.0,350],[2,45.08,-3.0,385],[3,46.08,-2.0,370],[4,47.13,-2.0,350],[5,48.07,1.0,329],[6,48.97,-0.5,335],[7,50.07,0.0,352],[8,51.09,-1.0,376],[9,52.14,0.5,337],[10,53.2,-2.0,359],[11,54.15,-1.0,376],[12,55.15,-0.5,353],[13,56.12,0.0,344],[14,57.07,0.5,362],[15,58.19,1.0,331],[16,59.18,2.0,335],[17,60.12,0.0,321],[18,61.09,-1.0,347],[19,62.18,-2.0,350],[20,63.12,-1.0,372],[21,64.1,1.5,340],[22,65.22,0.0,331],[23,66.17,0.0,364],[24,67.23,0.0,388],[25,68.13,-0.5,369],[26,69.04,-1.0,353],[27,70.09,-1.5,361],[28,71.16,-1.0,339],[29,72.16,-2.0,349],[30,73.21,1.0,352],[31,74.29,-1.0,325],[32,75.32,0.0,340],[33,76.4,0.0,325]] }, B: [[1,31],[2,66],[3,83],[4,78],[5,72],[6,74],[7,74],[8,82],[9,57],[10,76],[11,59],[12,76],[13,62],[14,82],[15,77],[16,62],[17,71],[18,74],[19,73],[20,69],[21,67],[22,79],[23,66],[24,65],[25,71],[26,61],[27,82],[28,69],[29,75],[30,71],[31,52],[32,70],[33,25],[34,59],[35,76],[36,34],[37,69],[38,67],[39,73],[40,75],[41,70],[42,72],[43,36],[44,66],[45,69],[46,72],[47,69],[48,63],[49,67],[50,74],[51,87],[52,71],[53,64],[54,61],[55,72],[56,45],[57,75],[58,81],[59,66],[60,68],[61,74],[62,76],[63,40],[64,51]], K: [[1,29],[2,16],[3,33],[4,19],[5,19],[6,20],[7,20],[8,12],[9,30],[10,29],[11,37],[12,67],[13,36],[14,35],[15,23],[16,19],[17,20],[18,15],[19,31],[20,21],[21,49],[22,59],[23,24],[24,16],[25,26],[26,29],[27,18],[28,19],[29,19],[30,17],[31,27],[32,20],[33,15]] },
  bar: { base: 36, hi: 69, L: { p:[[2,37.09,0.0,148],[4,39.08,-1.0,258],[5,40.02,0.0,198],[6,41.05,0.0,187],[7,41.99,1.0,199],[8,43.01,0.0,198],[9,43.95,0.0,200],[10,44.89,0.0,180],[11,45.94,0.0,188],[12,46.94,0.0,195],[13,47.92,-2.0,186],[14,48.99,-2.0,186],[15,49.89,-2.0,231],[16,50.82,-2.0,194],[17,51.84,-2.0,184],[18,53.16,-2.0,202],[19,54.12,0.0,191],[20,55.18,0.0,179],[21,56.12,0.0,182],[22,57.03,-1.0,182],[23,58.12,0.0,186],[24,59.08,0.0,183],[25,60.14,0.0,169],[26,61.19,0.0,203],[27,62.16,0.0,187],[28,63.27,0.0,183],[29,64.35,0.0,170],[30,65.31,-1.5,183],[31,66.29,1.5,168],[32,67.37,-2.0,186],[33,68.24,-4.5,185],[34,69.4,0.0,189]], m:[[1,36.14,0.0,206],[2,37.11,0.0,178],[3,37.97,0.0,182],[4,39.06,-2.5,186],[5,40.04,0.0,206],[6,40.99,0.0,196],[7,41.96,2.5,188],[8,42.98,1.0,186],[9,43.87,0.0,176],[10,44.89,0.0,219],[11,45.91,1.0,209],[12,46.91,1.0,187],[13,47.9,-1.0,189],[14,48.98,0.0,178],[15,49.87,0.0,220],[16,50.86,-1.0,232],[17,51.85,0.0,207],[18,53.08,0.0,233],[19,54.07,0.0,201],[20,55.04,0.0,234],[21,56.17,0.0,178],[22,57.0,-1.0,182],[23,58.03,0.0,180],[24,59.0,0.0,169],[25,59.98,2.0,164],[26,60.95,-1.5,205],[27,62.13,0.0,210],[28,63.17,0.0,191],[29,64.24,0.0,185],[30,65.24,0.0,190],[31,66.21,-1.0,224],[32,67.3,0.0,211],[33,68.22,-2.5,194],[34,69.38,0.0,213]], f:[[1,36.07,0.0,339],[2,37.1,0.0,286],[3,37.99,0.0,288],[4,39.05,0.0,314],[5,40.0,0.0,290],[6,41.03,0.0,282],[7,41.96,0.0,283],[8,42.96,0.0,272],[9,43.95,0.0,282],[10,44.94,0.0,280],[11,45.97,0.0,291],[12,46.95,0.0,300],[13,47.91,0.0,185],[14,48.98,0.0,195],[15,49.86,0.0,183],[16,50.82,0.0,165],[17,51.83,0.0,163],[18,53.12,-2.0,180],[19,54.09,0.5,177],[20,55.05,0.0,175],[21,56.14,-1.0,174],[22,56.99,-1.0,199],[23,58.02,0.0,175],[24,59.01,0.0,158],[25,59.93,2.0,158],[26,60.97,-1.0,148],[27,62.09,0.0,148],[28,63.16,0.0,157],[29,64.22,0.0,154],[30,65.19,-1.0,160],[31,66.17,-1.0,156],[32,67.32,-1.0,154],[33,68.22,-3.5,148],[34,69.36,-1.0,147]] }, B: [[1,58],[2,61],[3,64],[4,55],[5,56],[6,54],[7,56],[8,45],[9,59],[10,40],[11,50],[12,43],[13,49],[14,33],[15,37],[16,36],[17,39],[18,56],[19,24],[20,38],[21,47],[22,58],[23,68],[24,65],[25,58],[26,55],[27,63],[28,56],[29,57],[30,44],[31,47],[32,51],[33,50],[34,41],[35,53],[36,49],[37,49],[38,54],[39,50],[40,51],[41,53],[42,44],[43,48],[44,42],[45,48],[46,36],[47,47],[48,46],[49,44],[50,31],[51,43],[52,34],[53,90],[54,51],[55,58],[56,61],[57,62],[58,59],[59,57],[60,58],[61,55],[62,52],[63,59],[64,25],[65,55],[66,47],[67,59],[68,60],[69,46],[70,52],[71,42],[72,34],[73,42],[74,51],[75,73],[76,58],[77,50],[78,46],[79,50],[80,89],[81,31],[82,77],[83,77],[84,72],[85,72],[86,72],[87,73],[88,74],[89,72],[90,77]], K: [[1,34],[2,19],[3,14],[4,18],[5,14],[6,18],[7,18],[8,22],[9,15],[10,19],[11,15],[12,44],[13,43],[14,47],[15,42],[16,37],[17,23],[18,16],[19,23],[20,12],[21,28],[22,18],[23,20],[24,17],[25,24],[26,14],[27,17],[28,15],[29,15],[30,22],[31,27],[32,44],[33,23],[34,54],[35,15],[36,35],[37,14],[38,20],[39,18],[40,16]] },
};
const INSTR = ['sop', 'alt', 'ten', 'bar'];
const NAMES = { sop: ['Sopraan', 'Soprano'], alt: ['Alt', 'Alto'], ten: ['Tenor', 'Tenor'], bar: ['Bariton', 'Baritone'] };
// parameters: [id, min, max, stap, standaard, eenheid, groep, label nl, label en, schaal, in modulator standaard aan]
const NUM = [
  ['level', 0, 1.5, .01, .8, '%', 'play', 'Niveau', 'Level', 'lin', 0],
  ['expr', 0, 1, .01, 1, '%', 'play', 'Expressie', 'Expression', 'lin', 0],
  ['dyn', 0, 1, .01, .55, '%', 'play', 'Dynamiek', 'Dynamics', 'lin', 0],
  ['subthr', 0, .5, .01, .3, 'vel', 'play', 'Subtone onder', 'Subtone below', 'lin', 0],
  ['acc', .5, 1, .01, .85, 'vel', 'play', 'Bite vanaf', 'Bite from', 'lin', 0],
  ['tongue', 0, 1, .01, .5, '%', 'play', 'Bite', 'Bite', 'lin', 1],
  ['stac', 40, 400, 1, 180, 'ms', 'play', 'Staccato onder', 'Staccato below', 'lin', 0],
  ['legato', 0, 120, 1, 40, 'ms', 'play', 'Legato-gat', 'Legato gap', 'lin', 0],
  ['glide', 0, 150, 1, 35, 'ms', 'play', 'Overgang', 'Glide', 'lin', 0],
  ['snap', 0, 1, .01, .6, '%', 'play', 'Aanzet scherp', 'Attack snap', 'lin', 0],
  ['growl', 0, 1, .01, 0, '%', 'fx', 'Growl', 'Growl', 'lin', 1],
  ['growlRate', 30, 110, 1, 62, 'Hz', 'fx', 'Growl-snelheid', 'Growl rate', 'lin', 0],
  ['fall', 0, 1, .01, 0, '%', 'fx', 'Falloff', 'Falloff', 'lin', 1],
  ['scoop', 0, 1, .01, 0, '%', 'fx', 'Scoop', 'Scoop', 'lin', 1],
  ['vib', 0, 80, 1, 10, 'ct', 'fx', 'Vibrato', 'Vibrato', 'lin', 1],
  ['vibRate', 3, 9, .1, 5.2, 'Hz', 'fx', 'Vibrato-snelheid', 'Vibrato rate', 'lin', 1],
  ['vibDelay', 0, 1.5, .01, .35, 's', 'fx', 'Vibrato-vertraging', 'Vibrato delay', 'lin', 0],
  ['breath', 0, 1.5, .01, .6, '%', 'fx', 'Adem', 'Breath', 'lin', 1],
  ['keys', 0, 1.5, .01, .5, '%', 'fx', 'Kleppen', 'Keys', 'lin', 1],
  ['human', 0, 1, .01, .3, '%', 'fx', 'Humanize', 'Humanize', 'lin', 0],
  ['transpose', -24, 24, 1, 0, 'st', 'pitch', 'Transpositie', 'Transpose', 'lin', 0],
  ['fine', -100, 100, 1, 0, 'ct', 'pitch', 'Stemming', 'Tuning', 'lin', 0],
  ['voices', 2, 4, 1, 3, 'n', 'sect', 'Stemmen', 'Voices', 'lin', 0],
  ['spread', 0, 40, 1, 12, 'ct', 'sect', 'Spreiding', 'Spread', 'lin', 0],
  ['width', 0, 1, .01, .5, '%', 'sect', 'Breedte', 'Width', 'lin', 0],
  ['lag', 0, 30, 1, 8, 'ms', 'sect', 'Verschil in aanzet', 'Entry spread', 'lin', 0],
  ['hp', 20, 400, 1, 60, 'Hz', 'tone', 'Lage afsnijding', 'Low cut', 'log', 1],
  ['body', -9, 9, .5, 0, 'dB', 'tone', 'Lichaam', 'Body', 'lin', 1],
  ['presence', -9, 9, .5, 0, 'dB', 'tone', 'Aanwezigheid', 'Presence', 'lin', 1],
  ['air', -9, 9, .5, 0, 'dB', 'tone', 'Lucht', 'Air', 'lin', 1],
  ['lp', 2000, 16000, 100, 16000, 'Hz', 'tone', 'Hoge afsnijding', 'High cut', 'log', 1],
  ['drive', 0, 1, .01, 0, '%', 'tone', 'Drive', 'Drive', 'lin', 1],
  ['roomMix', 0, 1, .01, .15, '%', 'tone', 'Ruimte', 'Room mix', 'lin', 1]
];
const NMAP = Object.fromEntries(NUM.map(p => [p[0], p]));
const SELECTS = {
  instrument: ['sop', 'alt', 'ten', 'bar'], size: ['compact', 'full'], mode: ['mono', 'section'],
  stack: ['unison', 'octaves', 'major', 'minor', 'fourths'], growlOn: ['accent', 'long', 'all'], fallOn: ['accent', 'long', 'all'], scoopOn: ['accent', 'long', 'all'],
  room: ['off', 'room', 'plate', 'hall']
};
const SEL_DEF = { instrument: 'alt', size: 'compact', mode: 'mono', stack: 'unison', growlOn: 'accent', fallOn: 'long', scoopOn: 'accent', room: 'room' };
const STACKS = { unison: [0, 0, 0, 0], octaves: [0, -12, 12, -24], major: [0, -4, -7, -12], minor: [0, -3, -7, -12], fourths: [0, -5, -10, -15] };
const SPREAD_PAT = [0, 1, -1, .5], PAN_PAT = [0, -1, 1, -.5];
const MODEX = ['instrument', 'size', 'mode', 'stack', 'growlOn', 'fallOn', 'scoopOn', 'room', 'transpose', 'voices'];
const ROOMS = { room: { len: .5, rt: .32, bright: .55 }, plate: { len: 1.3, rt: 1.0, bright: .8 }, hall: { len: 2.6, rt: 2.0, bright: .5 } };
const INST_DB = { sop: -2.3, alt: .5, ten: 1.5, bar: 2 };
const MAXV = 24, TRIMV = 1.5, BREATH_REL = .35, KEY_REL = .3;

const TXT = {
  nl: {
    kit: 'Opnames', inst: 'Instrument', size: 'Omvang', sizes: { compact: 'Compact', full: 'Volledig' }, load: 'Laden', cancel: 'Annuleren', clear: 'Wissen',
    noKit: 'Geen opnames geladen: het apparaat zwijgt. Kies een instrument en klik op Laden. Een tune of song laadt zelf niets.',
    est: (n, mb, dec) => n + ' bestanden, ongeveer ' + mb + ' MB download en ' + dec + ' MB in het geheugen. De bestanden komen van internet (GitHub, via jsDelivr).',
    loading: (d, n, mb, tot) => 'Laden: ' + d + ' van ' + n + ' bestanden, ' + mb + ' van ongeveer ' + tot + ' MB',
    loaded: (i, n, mb, dec) => 'Geladen: ' + i + ', ' + n + ' bestanden, ' + mb + ' MB gedownload, ' + dec + ' MB in het geheugen.',
    partial: (ok, bad, why) => ok + ' bestanden geladen, ' + bad + ' mislukt (' + why + '). Het apparaat speelt met wat er is.',
    failAll: why => 'Laden mislukt: ' + why, aborted: 'Laden geannuleerd.', cleared: 'Opnames gewist.', oldHost: 'Deze versie van Patchkamer kan geen bestanden van internet ophalen (host.fetchFile ontbreekt).',
    mismatch: (a, b) => 'Deze instelling is voor ' + a + '; er is ' + b + ' geladen. Klik op Laden voor ' + a + '.',
    errUrl: 'het adres is niet toegestaan', errAborted: 'geannuleerd', errNetwork: 'geen verbinding of de server staat dit niet toe', errHttp: s => 'de server antwoordde met fout ' + s, errSize: 'bestand groter dan verwacht',
    errResponse: 'ongeldig antwoord', errDecode: 'het bestand kon niet worden gedecodeerd', errOther: 'onbekende fout', audioErr: 'Audiofout: ',
    credit: 'Bron', attr: 'MTG Solo Saxophones, samples van MTG (Universitat Pompeu Fabra) via freesound.org, gelooped en in SFZ gezet door kinwie, CC BY 4.0', srcLink: 'MTG Solo Saxophones op GitHub',
    play: 'Spel', fx: 'Effecten', pitch: 'Stem', sect: 'Sectie', tone: 'Klank', room: 'Ruimtesoort', roomOpts: { off: 'Uit', room: 'Kamer', plate: 'Plaat', hall: 'Zaal' },
    mode: 'Spelwijze', modes: { mono: 'Monofoon', section: 'Sectie' }, stack: 'Stapeling', stacks: { unison: 'Unisono', octaves: 'Octaven', major: 'Majeur', minor: 'Mineur', fourths: 'Kwarten' },
    growlOn: 'Growl bij', fallOn: 'Falloff bij', scoopOn: 'Scoop bij', ons: { accent: 'Accenten', long: 'Lange noten', all: 'Alle noten' },
    audition: 'Beluisteren', audVel: 'Velocity', audLen: 'Lengte', soft: 'Zacht', mid: 'Normaal', hard: 'Hard', lenS: 'Kort', lenM: 'Middel', lenL: 'Lang', lenX: 'Zeer lang',
    none: 'Nog geen noot gespeeld', arts: { sub: 'subtone', norm: 'normaal', bite: 'bite', stac: 'staccato', leg: 'legato', growl: 'growl', fall: 'falloff', scoop: 'scoop' },
    noteWord: 'noot', velWord: 'velocity'
  },
  en: {
    kit: 'Recordings', inst: 'Instrument', size: 'Size', sizes: { compact: 'Compact', full: 'Full' }, load: 'Load', cancel: 'Cancel', clear: 'Clear',
    noKit: 'No recordings loaded: the device is silent. Choose an instrument and click Load. A tune or song loads nothing by itself.',
    est: (n, mb, dec) => n + ' files, about ' + mb + ' MB download and ' + dec + ' MB in memory. The files come from the internet (GitHub, through jsDelivr).',
    loading: (d, n, mb, tot) => 'Loading: ' + d + ' of ' + n + ' files, ' + mb + ' of about ' + tot + ' MB',
    loaded: (i, n, mb, dec) => 'Loaded: ' + i + ', ' + n + ' files, ' + mb + ' MB downloaded, ' + dec + ' MB in memory.',
    partial: (ok, bad, why) => ok + ' files loaded, ' + bad + ' failed (' + why + '). The device plays with what is there.',
    failAll: why => 'Loading failed: ' + why, aborted: 'Loading cancelled.', cleared: 'Recordings cleared.', oldHost: 'This version of Patchkamer cannot fetch files from the internet (host.fetchFile is missing).',
    mismatch: (a, b) => 'This setting is made for ' + a + '; ' + b + ' is loaded. Click Load for ' + a + '.',
    errUrl: 'the address is not allowed', errAborted: 'cancelled', errNetwork: 'no connection or the server does not allow it', errHttp: s => 'the server answered with error ' + s, errSize: 'file larger than expected',
    errResponse: 'invalid response', errDecode: 'the file could not be decoded', errOther: 'unknown error', audioErr: 'Audio error: ',
    credit: 'Source', attr: 'MTG Solo Saxophones, samples by MTG (Universitat Pompeu Fabra) via freesound.org, looped and programmed in SFZ by kinwie, CC BY 4.0', srcLink: 'MTG Solo Saxophones on GitHub',
    play: 'Playing', fx: 'Effects', pitch: 'Pitch', sect: 'Section', tone: 'Tone', room: 'Room type', roomOpts: { off: 'Off', room: 'Room', plate: 'Plate', hall: 'Hall' },
    mode: 'Play mode', modes: { mono: 'Monophonic', section: 'Section' }, stack: 'Stacking', stacks: { unison: 'Unison', octaves: 'Octaves', major: 'Major', minor: 'Minor', fourths: 'Fourths' },
    growlOn: 'Growl on', fallOn: 'Falloff on', scoopOn: 'Scoop on', ons: { accent: 'Accents', long: 'Long notes', all: 'All notes' },
    audition: 'Audition', audVel: 'Velocity', audLen: 'Length', soft: 'Soft', mid: 'Normal', hard: 'Hard', lenS: 'Short', lenM: 'Medium', lenL: 'Long', lenX: 'Very long',
    none: 'No note played yet', arts: { sub: 'subtone', norm: 'normal', bite: 'bite', stac: 'staccato', leg: 'legato', growl: 'growl', fall: 'falloff', scoop: 'scoop' },
    noteWord: 'note', velWord: 'velocity'
  }
};
const ABOUT = {
  nl: 'Levensechte saxofoons voor sequencers: sopraan, alto, tenor en bariton, gesampled en gelooped. Het spel volgt wat de sequencer stuurt.\n\n' +
    'Velocity bepaalt laag, kleur en artikulatie: zachte noten klinken als subtone (donkerder, langzamere aanzet, meer adem), gewone noten normaal en harde noten met bite (scherpe aanzet, extra aanwezigheid in de aanzet). De notelengte kiest staccato (korte noten, korte uitloop). Een noot die begint voordat de vorige afloopt, of met een heel klein gat, klinkt als mono-legato: de vorige noot glijdt kort over naar de nieuwe, zonder nieuwe aanzet en zonder adem. Daarnaast zijn er growl, falloff en scoop (per type noot te kiezen), vibrato met vertraging, snelheid en diepte (de mod-ingang kan het sturen), adem- en klepruis, humanize (kleine variatie in timing, toon en niveau), transpositie en stemming, en een sectiestand met 2 tot 4 gestapelde stemmen (unisono, octaven, majeur, mineur, kwarten) met spreiding in stemming, breedte en aanzet voor funk- en soulstabs. De nabewerking is licht: lage afsnijding, drie EQ-banden, hoge afsnijding, drive en een kleine kamer, plaat of zaal.\n\n' +
    'Growl, falloff, scoop, subtone en bite zijn nagebootst met bewerking van de opnames (modulatie, glijden, filters, ruis); er zijn geen opnames van die speeltechnieken zelf. Een noot buiten het bereik van het instrument wordt met een octaaf verschoven. De stand van de bedieningen werkt op de volgende noot, behalve niveau, expressie, vibrato en klank: die werken direct.\n\n' +
    'De opnames zitten niet in Patchkamer en niet in de repo. Kies een instrument en een omvang (compact: om de andere noot, met halve tonen verschoven; volledig: alle noten) en klik op Laden: de bestanden worden dan via een link van internet opgehaald (GitHub, via jsDelivr). De grootte staat vooraf in beeld en je kunt annuleren. Een tune, preset of song laadt geen opnames; zonder geladen opnames is het apparaat stil. Er wordt één instrument tegelijk geladen.\n\n' +
    'Bron en licentie: MTG Solo Saxophones, samples van de Music Technology Group (Universitat Pompeu Fabra) via freesound.org, gesneden, gelooped en in SFZ gezet door kinwie, licentie CC BY 4.0 (naamsvermelding). Repo https://github.com/sfzinstruments/MTG.SoloSax, vastgepinde commit b494d256549b3d088fdec176ce82867f8a1f58b2. Voor gebruik hier zijn de bestanden afgekapt (tot het eind van de lus), geschaald en gefilterd.',
  en: 'Lifelike saxophones for sequencers: soprano, alto, tenor and baritone, sampled and looped. The playing follows what the sequencer sends.\n\n' +
    'Velocity chooses layer, colour and articulation: soft notes sound as subtone (darker, slower attack, more breath), normal notes normal and hard notes with bite (sharp attack, extra presence in the attack). Note length chooses staccato (short notes, short release). A note that starts before the previous one ends, or after a very small gap, sounds as mono-legato: the previous note glides briefly into the new one, with no new attack and no breath. There are also growl, falloff and scoop (selectable per type of note), vibrato with delay, rate and depth (the mod input can drive it), breath and key noise, humanize (small variation in timing, pitch and level), transpose and tuning, and a section mode with 2 to 4 stacked voices (unison, octaves, major, minor, fourths) with spread in tuning, width and entry for funk and soul stabs. The post-processing is light: low cut, three EQ bands, high cut, drive and a small room, plate or hall.\n\n' +
    'Growl, falloff, scoop, subtone and bite are imitated by processing the recordings (modulation, glides, filters, noise); there are no recordings of those techniques themselves. A note outside the instrument range is moved by an octave. A control change applies to the next note, except level, expression, vibrato and tone: those apply at once.\n\n' +
    'The recordings are not inside Patchkamer and not in the repo. Choose an instrument and a size (compact: every other note, shifted by a semitone; full: all notes) and click Load: the files are then fetched through a link on the internet (GitHub, via jsDelivr). The size is shown beforehand and you can cancel. A tune, preset or song loads no recordings; without loaded recordings the device is silent. One instrument is loaded at a time.\n\n' +
    'Source and licence: MTG Solo Saxophones, samples from the Music Technology Group (Universitat Pompeu Fabra) via freesound.org, trimmed, looped and programmed into SFZ by kinwie, licence CC BY 4.0 (attribution). Repo https://github.com/sfzinstruments/MTG.SoloSax, pinned commit b494d256549b3d088fdec176ce82867f8a1f58b2. For use here the files are cut (only up to the end of the loop), scaled and filtered.'
};

const isObj = x => x && typeof x === 'object' && !Array.isArray(x);
const fin = (v, d) => (typeof v === 'number' && Number.isFinite(v) ? v : d);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const mbOf = b => (b / 1048576).toFixed(b < 10485760 ? 1 : 0);
const NOTE = ['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'];
const noteName = m => NOTE[((Math.round(m) % 12) + 12) % 12] + (Math.floor(Math.round(m) / 12) - 1);
const smooth = x => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };
// n bestanden gelijkmatig gekozen uit een lijst
const pickN = (list, k) => { const n = list.length, o = []; for (let j = 0; j < Math.min(k, n); j++) { const x = list[Math.min(n - 1, Math.floor((j + .5) * n / Math.min(k, n)))]; if (!o.includes(x)) o.push(x); } return o; };
const nn = i => (i < 10 ? '0' : '') + i;
// de bestanden van een instrument en omvang: { kind, i, nat, vol, kb }
function fileList(inst, size) {
  const C = CAT[inst], out = [];
  for (const lay of Object.keys(C.L)) {
    const s = C.L[lay].slice().sort((a, b) => a[1] - b[1]);
    s.forEach((x, k) => { if (size === 'full' || k % 2 === 0 || k === s.length - 1) out.push({ kind: lay, i: x[0], nat: x[1], vol: x[2], kb: x[3] }); });
  }
  for (const x of pickN(C.B, 8)) out.push({ kind: 'b', i: x[0], nat: 0, vol: 0, kb: x[1] });
  for (const x of pickN(C.K, 6)) out.push({ kind: 'k', i: x[0], nat: 0, vol: 0, kb: x[1] });
  return out;
}
const fileName = (inst, f) => inst + '_' + f.kind + '_' + nn(f.i) + '.flac';
const estimate = (inst, size) => { const L = fileList(inst, size); let b = 0; for (const f of L) b += f.kb * 1024; return { files: L.length, bytes: b, dec: b * 1.7 }; };
// lusgrenzen uit het FLAC-bestand zelf (een 'riff'-applicatieblok met een smpl-chunk): { rate, ls, le } in samples, of null
function flacLoop(ab) {
  try {
    const d = new DataView(ab); if (ab.byteLength < 42 || d.getUint32(0) !== 0x664c6143) return null;
    let i = 4, rate = 0, loop = null;
    for (let n = 0; n < 64 && i + 4 <= ab.byteLength; n++) {
      const h = d.getUint8(i), last = h >> 7, typ = h & 127, len = (d.getUint8(i + 1) << 16) | (d.getUint8(i + 2) << 8) | d.getUint8(i + 3), b = i + 4;
      if (b + len > ab.byteLength) break;
      if (typ === 0 && len >= 18) rate = (d.getUint8(b + 10) << 12) | (d.getUint8(b + 11) << 4) | (d.getUint8(b + 12) >> 4);
      if (typ === 2 && len >= 60 && d.getUint32(b) === 0x72696666 && d.getUint32(b + 4) === 0x736d706c && d.getUint32(b + 40, true) >= 1) loop = { ls: d.getUint32(b + 56, true), le: d.getUint32(b + 60, true) };
      i = b + len; if (last) break;
    }
    return rate && loop && loop.le > loop.ls ? { rate, ls: loop.ls, le: loop.le } : null;
  } catch (e) { return null; }
}
// stille, deterministische ruimte-impuls (stereo)
function makeIR(ctx, type) {
  const R = ROOMS[type], sr = ctx.sampleRate, n = Math.max(64, Math.floor(R.len * sr)), buf = ctx.createBuffer(2, n, sr);
  let seed = type === 'room' ? 1234567 : type === 'plate' ? 7654321 : 5555555;
  const rnd = () => { seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; return ((seed >>> 0) / 4294967296) * 2 - 1; };
  for (let c = 0; c < 2; c++) {
    const d = buf.getChannelData(c); let lp = 0;
    for (let i = 0; i < n; i++) {
      const t = i / sr, a = Math.exp(-6.9 * t / R.rt), k = .08 + R.bright * Math.exp(-3 * t / R.rt) * .9;
      lp += (rnd() - lp) * Math.min(1, k); d[i] = lp * a * (i < 40 ? i / 40 : 1);
    }
  }
  return buf;
}
const LIMIT_CURVE = (() => { const a = new Float32Array(4097); for (let i = 0; i < a.length; i++) { const x = i / 2048 - 1, ax = Math.abs(x); a[i] = ax <= .7 ? x : Math.sign(x) * (.7 + .25 * Math.tanh((ax - .7) / .25)); } return a; })();
const SAT_CURVE = (() => { const a = new Float32Array(2049); for (let i = 0; i < a.length; i++) { const x = i / 1024 - 1; a[i] = Math.tanh(2.6 * x) / Math.tanh(2.6); } return a; })();
const UPC = (() => { const n = 64, a = new Float32Array(n), b = new Float32Array(n); for (let i = 0; i < n; i++) { const x = i / (n - 1) * Math.PI / 2; a[i] = Math.sin(x); b[i] = Math.cos(x); } return [a, b]; })();

const CSS = `
:host{display:block}
.sx{container-type:inline-size;display:grid;gap:10px;min-width:0;color:var(--fg,#dce1e8);font:11px/1.4 var(--mono,ui-monospace,Menlo,monospace);
  --ln:var(--line,#2a3039);--c2:var(--card-2,#1e232c);--mu:var(--muted,#7d8794);--ev:var(--event,#f4a261);--au:var(--audio,#4fd1c5)}
.sx *{box-sizing:border-box}
button,select{font:500 11px/1 var(--disp,system-ui,sans-serif);letter-spacing:.06em;background:var(--c2);color:inherit;border:1px solid var(--ln);border-radius:3px;padding:6px 8px;cursor:pointer;min-width:0;min-height:28px}
select{background:var(--field,var(--c2));color:var(--field-fg,inherit);max-width:100%}
button:hover{border-color:var(--au)}
button:disabled{opacity:.45;cursor:default}
button:focus-visible,select:focus-visible{outline:1px solid var(--au);outline-offset:2px}
button.on{background:var(--ev);border-color:var(--ev);color:#160e05}
.sec{display:grid;gap:8px;align-content:start;padding:8px;border:1px solid var(--ln);border-radius:6px;min-width:0}
.sec h4{margin:0;font:600 10px/1.2 var(--disp,system-ui,sans-serif);letter-spacing:.14em;text-transform:uppercase;color:var(--mu)}
.row{display:flex;flex-wrap:wrap;align-items:center;gap:6px 8px;min-width:0}
.fld{display:grid;gap:3px;min-width:0}
.fld>span{font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:var(--mu)}
.kg{display:grid;grid-template-columns:repeat(auto-fit,minmax(96px,1fr));gap:8px 8px;align-items:start;min-width:0}
.kg .k{min-width:0}.kg .k input[type=range]{width:100%;min-width:0;max-width:100%}.kg .k label{overflow-wrap:anywhere}
.note{font-size:10px;color:var(--mu);overflow-wrap:anywhere}
.warn{font-size:10px;color:var(--ev);overflow-wrap:anywhere}
.err{font-size:10px;color:#e5736b;overflow-wrap:anywhere}
progress{width:100%;height:8px}
a{color:var(--au)}
[hidden]{display:none!important}
.pads{display:flex;flex-wrap:wrap;gap:4px}
.pads button{min-width:44px;padding:6px 6px}
.last{font-size:11px;color:var(--au);min-height:1.4em}
@media (prefers-reduced-motion:reduce){*{transition:none!important}}`;

export default {
  id: 'nl.patchkamer.saxstudio', name: 'Sax Studio', version: '1.0.0', kind: 'instrument', category: 'synth',
  ui: { width: 760, minWidth: 320 },
  about: { nl: ABOUT.nl, en: ABOUT.en },
  modExclude: MODEX,
  ports: { audioIn: [], audioOut: [{ id: 'out', name: 'Stereo saxofoon' }], eventIn: [{ id: 'notes', name: 'Noten' }], eventOut: [], modIn: [{ id: 'mod', name: 'Mod' }], modOut: [] },
  i18n: { en: { ports: { out: 'Stereo saxophone', notes: 'Notes' } } },
  create(ctx, host) {
    const lang = host && host.lang === 'nl' ? 'nl' : 'en', T = TXT[lang];
    const defaults = {}; for (const p of NUM) defaults[p[0]] = p[4]; Object.assign(defaults, SEL_DEF);
    let state = { ...defaults }, eff = { ...defaults }, mod = {}, dead = false, root = null, self = null, stopFrame = null, error = '', guardTimer = null;
    const owned = new Set(), voices = new Set(), held = new Map(), ui = { knobs: {}, sels: {} };
    let kit = null, job = null, status = '', statusErr = false, cur = null, lastArt = null, lastGuard = -1;
    const own = n => (owned.add(n), n), gain = () => own(ctx.createGain());
    const quantumStart = x => Math.ceil(x * ctx.sampleRate / 128 - 1e-6) * 128 / ctx.sampleRate;
    const lbl = p => (lang === 'nl' ? p[7] : p[8]);

    // ---- ingangswaarden en state ----
    function resolve() {
      const r = { ...state };
      for (const p of NUM) { const o = mod[p[0]] || 0; const raw = p[9] === 'log' ? state[p[0]] * Math.pow(p[2] / p[1], o) : state[p[0]] + o * (p[2] - p[1]); r[p[0]] = clamp(fin(raw, p[4]), p[1], p[2]); }
      return r;
    }
    // ---- grafiek ----
    const bus = gain(), lvl = gain(), expG = gain(), fin_ = gain(), wetSum = gain(), outN = gain();
    outN.channelCount = 2; outN.channelCountMode = 'explicit'; outN.channelInterpretation = 'speakers';
    const lim = own(ctx.createWaveShaper()); lim.curve = LIMIT_CURVE;
    const guardAna = own(ctx.createAnalyser()); guardAna.fftSize = 2048;
    const os = host && host.audio && host.audio.oversample === 'none' ? 'none' : host && host.audio && host.audio.oversample === '4x' ? '4x' : '2x';
    const sat = own(ctx.createWaveShaper()); sat.curve = SAT_CURVE; sat.oversample = os;
    const dryG = gain(), satG = gain();
    let hpF, lowS, pk, hiS, lpF;
    function buildChain() {
      [hpF, lowS, pk, hiS, lpF].forEach(n => { if (n) { try { n.disconnect(); } catch (e) { /* los */ } owned.delete(n); } });
      try { bus.disconnect(); } catch (e) { /* los */ }
      hpF = own(ctx.createBiquadFilter()); hpF.type = 'highpass'; hpF.Q.value = .6;
      lowS = own(ctx.createBiquadFilter()); lowS.type = 'lowshelf'; lowS.frequency.value = 200;
      pk = own(ctx.createBiquadFilter()); pk.type = 'peaking'; pk.frequency.value = 2600; pk.Q.value = .8;
      hiS = own(ctx.createBiquadFilter()); hiS.type = 'highshelf'; hiS.frequency.value = 6500;
      lpF = own(ctx.createBiquadFilter()); lpF.type = 'lowpass'; lpF.Q.value = .5;
      bus.connect(hpF); hpF.connect(lowS); lowS.connect(pk); pk.connect(hiS); hiS.connect(lpF);
      lpF.connect(dryG); lpF.connect(sat); sat.connect(satG);
      applyNow();
    }
    dryG.connect(expG); satG.connect(expG); expG.connect(lvl);
    lvl.connect(fin_); wetSum.connect(fin_); fin_.connect(lim); lim.connect(outN); lim.connect(guardAna);
    let conv = null, convG = null;
    function setRoom(type, mix, now) {
      const want = type === 'off' ? null : type;
      if (!want) { if (conv) { const c = conv, g = convG; g.gain.setTargetAtTime(0, now, .03); conv = convG = null; setTimeout(() => { try { c.disconnect(); g.disconnect(); } catch (e) { /* */ } owned.delete(c); owned.delete(g); }, 400); } return; }
      if (conv && conv.__type === want) { convG.gain.setTargetAtTime(mix * .55, now, .03); return; }
      const old = conv, oldG = convG;
      conv = own(ctx.createConvolver()); conv.__type = want; conv.buffer = makeIR(ctx, want); convG = gain(); convG.gain.value = 0;
      lvl.connect(conv); conv.connect(convG); convG.connect(wetSum); convG.gain.setTargetAtTime(mix * .55, now, .05);
      if (old) { oldG.gain.setTargetAtTime(0, now, .03); setTimeout(() => { try { old.disconnect(); oldG.disconnect(); lvl.disconnect(old); } catch (e) { /* */ } owned.delete(old); owned.delete(oldG); }, 500); }
    }
    // vibrato: één gedeelde LFO in cents; elke stem leest hem via een eigen poort met vertraging
    const vibLfo = own(ctx.createOscillator()); vibLfo.type = 'sine'; vibLfo.frequency.value = 5.2;
    const vibAmp = gain(); vibAmp.gain.value = 10; vibLfo.connect(vibAmp);
    function applyNow() {
      if (dead) return; eff = resolve(); const now = ctx.currentTime, e = eff, S = (p, v, tc = .03) => p.setTargetAtTime(v, now, tc);
      S(hpF.frequency, e.hp); S(lowS.gain, e.body); S(pk.gain, e.presence); S(hiS.gain, e.air); S(lpF.frequency, e.lp);
      S(dryG.gain, 1 - e.drive * .75); S(satG.gain, e.drive * .55);
      S(expG.gain, Math.pow(e.expr, 1.6)); S(lvl.gain, e.level * 2.2);
      S(vibAmp.gain, e.vib); S(vibLfo.frequency, e.vibRate, .1);
      setRoom(state.room, e.roomMix, now);
    }
    const apply = () => { try { applyNow(); } catch (e) { error = T.audioErr + (e && e.message || String(e)); } };
    buildChain();
    try { vibLfo.start(); } catch (e) { /* al gestart */ }

    // ---- bewaker: één niet-eindig sample stopt alles en bouwt het filterspoor opnieuw op ----
    function guard(force) {
      const now = ctx.currentTime; if (!force && now - lastGuard < .1 && lastGuard >= 0) return; lastGuard = now;
      try {
        const b = new Float32Array(guardAna.fftSize); guardAna.getFloatTimeDomainData(b);
        for (let i = 0; i < b.length; i++) if (!Number.isFinite(b[i])) { error = T.audioErr + 'NaN'; stopAll(.02); buildChain(); return; }
      } catch (e) { /* */ }
    }

    // ---- stemmen ----
    function disposeVoice(v) { try { vibAmp.disconnect(v.vg); } catch (e) { /* */ } v.nodes.forEach(n => { try { n.disconnect(); } catch (e) { /* */ } owned.delete(n); }); voices.delete(v); if (cur && cur.v === v) cur = null; }
    // laat een stem lopen tot tijd T en laat hem dan uitklinken; fall = 0..1 pitch-val
    function endVoice(v, T, rel, fall) {
      if (v.ended && !(T < v.endT)) return; v.ended = true; v.endT = T;
      try {
        if (fall > 0.01) rel = Math.max(rel, (.12 + .28 * fall) * .9);
        const tau = Math.max(.004, rel / 5);
        v.env.gain.cancelScheduledValues(T); v.env.gain.setTargetAtTime(0, T, tau);
        if (fall > 0.01) {
          const ft = .12 + .28 * fall, cents = 300 + 900 * fall;
          v.srcs.forEach((s, k) => { s.detune.cancelScheduledValues(T); s.detune.setValueAtTime(v.cents[k], T); s.detune.linearRampToValueAtTime(v.cents[k] - cents, T + ft); });
          if (v.lp) { v.lp.frequency.cancelScheduledValues(T); v.lp.frequency.setValueAtTime(v.lpHz, T); v.lp.frequency.exponentialRampToValueAtTime(900, T + ft); }
        }
        v.stopT = T + Math.max(rel * 1.8, fall > 0.01 ? .12 + .28 * fall + .05 : 0) + .02;
        v.srcs.forEach(s => { try { s.stop(v.stopT); } catch (e) { /* */ } });
        if (v.gosc) { try { v.gosc.stop(v.stopT); } catch (e) { /* */ } }
      } catch (e) { /* */ }
    }
    function stopAll(secs = .12, at) {
      const t = Number.isFinite(at) ? Math.max(ctx.currentTime, at) : ctx.currentTime; held.clear(); cur = null;
      voices.forEach(v => { try { v.env.gain.cancelScheduledValues(t); v.env.gain.setTargetAtTime(0, t, secs / 5); v.ended = true; v.srcs.forEach(s => { try { s.stop(t + secs * 1.8 + .02); } catch (e) { /* */ } }); if (v.gosc) { try { v.gosc.stop(t + secs * 1.8 + .02); } catch (e) { /* */ } } } catch (e) { /* */ } });
    }
    // kies een opname voor een noot in een laag; round robin zonder directe herhaling
    function pickSample(arr, note) {
      let cand = arr.filter(s => Math.abs(note - s.nat) <= 1.05);
      if (!cand.length) { let b = null; for (const s of arr) if (!b || Math.abs(note - s.nat) < Math.abs(note - b.nat)) b = s; cand = b ? [b] : []; }
      if (cand.length > 1) { const rest = cand.filter(s => s !== arr.last); if (rest.length) cand = rest; }
      const s = cand[Math.floor(Math.random() * cand.length) % cand.length]; arr.last = s; return s;
    }
    // gewichten per laag (gelijk vermogen) uit velocity
    function layerWeights(names, v) {
      // één laag per noot, gekozen op de grenzen van de bron (velocity 100/101 bij twee lagen, 85/86 en 106/107 bij drie): twee lagen met gelijke toonhoogte
      // tegelijk laten klinken geeft bij een lange noot een zwevende zwevingsfout (gemeten tot 5 dB), dus geen overvloeien
      const bs = names.length === 2 ? [.787] : names.length === 3 ? [.669, .835] : []; let k = 0;
      while (k < bs.length && v > bs[k]) k++;
      return { [names[Math.min(k, names.length - 1)]]: 1 };
    }
    const foldNote = (n, inst) => { const lo = CAT[inst].base, hi = CAT[inst].hi; let k = 0; while (n < lo - 2 && k++ < 8) n += 12; while (n > hi + 2 && k++ < 16) n -= 12; return n; };
    const should = (on, accent, long) => on === 'all' || (on === 'accent' && accent) || (on === 'long' && long);

    // één stem op één toonhoogte
    function spawn(P) {
      const e = eff, t = P.t, names = Object.keys(kit.layers).sort((a, b) => 'pmf'.indexOf(a) - 'pmf'.indexOf(b)), W = layerWeights(names, P.vel + (Math.random() - .5) * e.human * .05);
      const v = { t, note: P.note, srcs: [], cents: [], nodes: [], env: null, xf: null, vg: null, lp: null, lpHz: 18000, gosc: null, ended: false, endT: Infinity, stopT: Infinity, pending: 0, endClick: null };
      const mix = gain(), env = gain(), xf = gain(), pan = own(ctx.createStereoPanner()), vg = gain();
      v.env = env; v.xf = xf; v.vg = vg; v.nodes.push(mix, env, xf, pan, vg);
      let tail = xf; mix.connect(env); env.connect(xf);
      const lpHz = P.sub > 0 ? Math.exp(Math.log(14000) * (1 - P.sub) + Math.log(1700) * P.sub) : 18000;
      if (P.sub > .02 || P.fall > .02) { const lp = own(ctx.createBiquadFilter()); lp.type = 'lowpass'; lp.Q.value = .5; lp.frequency.value = lpHz; tail.connect(lp); tail = lp; v.lp = lp; v.lpHz = lpHz; v.nodes.push(lp); }
      if (P.bite > .02) { const pkv = own(ctx.createBiquadFilter()); pkv.type = 'peaking'; pkv.frequency.value = 2800; pkv.Q.value = .9; pkv.gain.setValueAtTime(7 * P.bite, t); pkv.gain.setTargetAtTime(0, t + .015, .14); tail.connect(pkv); tail = pkv; v.nodes.push(pkv); }
      if (P.growl > .02) {
        const gm = gain(), ga = gain(), go = own(ctx.createOscillator()), depth = .25 + .7 * P.growl;
        gm.gain.value = 1 - depth / 2; ga.gain.setValueAtTime(P.growlSwell ? depth * .15 : depth / 2, t); if (P.growlSwell) ga.gain.linearRampToValueAtTime(depth / 2, t + .5);
        go.type = 'triangle'; go.frequency.value = clamp(e.growlRate * (1 + (Math.random() - .5) * .08), 20, 140); go.connect(ga); ga.connect(gm.gain); tail.connect(gm); tail = gm; go.start(t); v.gosc = go; v.nodes.push(gm, ga, go);
      }
      tail.connect(pan); pan.pan.value = clamp(fin(P.pan, 0), -1, 1); pan.connect(bus);
      vg.gain.setValueAtTime(0, t); const vd = Math.max(0, e.vibDelay * (1 + (Math.random() - .5) * .6 * e.human)); if (P.legato) { vg.gain.setValueAtTime(1, t); } else { vg.gain.setValueAtTime(0, t + vd); vg.gain.linearRampToValueAtTime(1, t + vd + .45); }
      vibAmp.connect(vg);
      const velDb = -(1 - Math.pow(P.vel, .85)) * e.dyn * 24 - P.sub * 2 + (Math.random() - .5) * 2 * e.human * 1.2;
      const amp = Math.pow(10, (velDb + INST_DB[kit.inst]) / 20) * P.level;
      let started = 0;
      for (const L of names) {
        const w = W[L]; if (!(w > .01)) continue; const arr = kit.layers[L]; if (!arr.length) continue;
        const s = pickSample(arr, P.note); if (!s || !s.buf) continue;
        const src = own(ctx.createBufferSource()), g = gain(); src.buffer = s.buf; src.loop = true; src.loopStart = s.ls; src.loopEnd = s.le;
        const cents = (P.note - s.nat) * 100 + P.cents - P.sub * 8; v.cents.push(cents);
        g.gain.value = w * amp * Math.pow(10, s.vol / 20);
        src.connect(g); g.connect(mix); vg.connect(src.detune);
        let c0 = cents; if (!P.legato && P.scoop > .01) c0 = cents - (150 + 250 * P.scoop);
        src.detune.setValueAtTime(c0, t);
        if (!P.legato && P.scoop > .01) src.detune.linearRampToValueAtTime(cents, t + .06 + .07 * P.scoop);
        const off = P.legato ? Math.min(Math.max(P.legato.off, s.on + .12), Math.max(0, s.ls - .2)) : Math.min(e.snap * s.on, Math.max(0, s.ls - .2));
        src.start(t, off); v.srcs.push(src); v.nodes.push(g, src); v.pending++; started++;
        src.onended = () => { if (--v.pending <= 0) disposeVoice(v); };
      }
      if (!started) { disposeVoice(v); return null; }
      // omhullende
      const att = P.legato ? 0 : Math.max(.004, .005 + P.sub * .07 + P.scoop * .02 - P.bite * .002);
      if (P.legato) { env.gain.setValueAtTime(0, t); env.gain.setValueCurveAtTime(UPC[0], t, P.legato.xf); }
      else { env.gain.setValueAtTime(0, t); env.gain.linearRampToValueAtTime(1 + P.bite * .5, t + att); if (P.bite > .02) env.gain.setTargetAtTime(1, t + att, .09); }
      voices.add(v);
      const act = []; voices.forEach(o => { if (o !== v && o.t <= t && !(o.stopT <= t) && !(o.ended && o.endT <= t)) act.push(o); });
      while (act.length >= MAXV) { const old = act.shift(); endVoice(old, t, .03, 0); }
      return v;
    }
    function noise(kind, t, g, pan) {
      const arr = kit && (kind === 'b' ? kit.breath : kit.clicks); if (!arr || !arr.length || !(g > 0.001)) return null;
      const s = arr[Math.floor(Math.random() * arr.length) % arr.length], src = own(ctx.createBufferSource()), gg = gain(), pn = own(ctx.createStereoPanner());
      src.buffer = s.buf; gg.gain.value = g * s.g; pn.pan.value = clamp(fin(pan, 0), -1, 1); src.connect(gg); gg.connect(pn); pn.connect(bus);
      src.start(t); src.onended = () => { try { src.disconnect(); gg.disconnect(); pn.disconnect(); } catch (e) { /* */ } owned.delete(src); owned.delete(gg); owned.delete(pn); };
      return () => { try { src.stop(0); } catch (e) { /* */ } };
    }

    // ---- noten ----
    function noteOn(note, vel, time, dur) {
      try {
        if (dead || !kit || !Number.isFinite(note)) return;
        guard(); const e = eff; vel = clamp(fin(vel, .8), 0, 1); if (vel <= 0) return;
        const hum = e.human, tt = Math.max(ctx.currentTime, fin(time, ctx.currentTime)) + Math.random() * hum * .006, t = quantumStart(Math.min(tt, ctx.currentTime + 3600));
        const inst = kit.inst, base = note + e.transpose, sub = e.subthr > .01 ? clamp((e.subthr - vel) / e.subthr, 0, 1) : 0;
        const bite = e.tongue > 0 ? clamp((vel - e.acc) / Math.max(.02, 1 - e.acc), 0, 1) * e.tongue : 0, hasDur = Number.isFinite(dur) && dur > 0;
        const stac = hasDur && dur * 1000 < e.stac, long = !hasDur || dur >= .35, accent = vel >= e.acc;
        const growl = e.growl > .02 && should(state.growlOn, accent, long && !stac) ? e.growl : 0, fall = e.fall > .02 && should(state.fallOn, accent, long && !stac) ? e.fall : 0;
        const scoop = e.scoop > .02 && should(state.scoopOn, accent, long && !stac) ? e.scoop : 0;
        const cents = e.fine + (Math.random() - .5) * 2 * hum * 10;
        const arts = []; if (sub > .15) arts.push('sub'); else if (bite > .02 || accent) arts.push('bite'); else arts.push('norm'); if (stac) arts.push('stac');
        const gate = stac ? Math.max(.02, dur * .75) : dur, rel = stac ? .03 : .08 + sub * .05, endAt = hasDur ? t + gate : Infinity;
        const vs = []; let tied = false;
        if (e.mode === 'section') {
          const n = Math.round(clamp(e.voices, 2, 4)), offs = STACKS[state.stack] || STACKS.unison, lv = 1 / Math.sqrt(n);
          for (let k = 0; k < n; k++) {
            const nk = foldNote(base + offs[k], inst), lagS = k * e.lag / 1000 * (.4 + Math.random() * .6), tk = quantumStart(t + lagS);
            const v = spawn({ note: nk, vel, t: tk, sub, bite: k === 0 ? bite : bite * .6, growl, scoop, level: lv * TRIMV, cents: cents + e.spread * SPREAD_PAT[k] * (.8 + Math.random() * .4), pan: PAN_PAT[k] * e.width, legato: null, growlSwell: false, fall });
            if (v) { vs.push(v); if (hasDur) endVoice(v, tk + gate, rel, fall); }
          }
          if (kit.breath && vs.length) noise('b', t, e.breath * BREATH_REL * (.5 + .9 * sub) * (.4 + .6 * vel), 0);
        } else {
          const nn1 = foldNote(base, inst); let legato = null, prevEnd = cur ? cur.endT : NaN;
          if (cur && cur.v && voices.has(cur.v)) {
            const gap = t - prevEnd, overlap = t < prevEnd || prevEnd === Infinity, leap = Math.abs(nn1 - cur.note), pv = cur.v;
            if ((overlap || (gap <= e.legato / 1000 && !stac)) && leap <= 9 && t > pv.t + .02) {
              const c0 = Math.min(t, pv.endT);
              try {
                if (leap < .5) {
                  // dezelfde toon in elkaar over: de vorige noot loopt gewoon door tot het nieuwe einde (geen tweede stem, geen nieuwe aanzet)
                  pv.env.gain.cancelScheduledValues(c0); if (pv.lp) pv.lp.frequency.cancelScheduledValues(c0); pv.srcs.forEach((s, k) => { s.detune.cancelScheduledValues(c0); s.detune.setValueAtTime(pv.cents[k], c0); });
                  pv.ended = false; pv.endT = Infinity; pv.stopT = Infinity; if (pv.endClick) { pv.endClick(); pv.endClick = null; }
                  if (hasDur) { endVoice(pv, endAt, rel, fall); const h = noise('k', endAt + .004, e.keys * KEY_REL * (.35 + .4 * vel), 0); pv.endClick = h; }
                  cur.endT = endAt; tied = true; arts.push('leg');
                } else {
                  // mono-legato: de vorige stem vloeit in korte tijd uit, de nieuwe begint zonder aanzet (andere toonhoogte, dus geen faseprobleem)
                  const xfd = clamp(e.glide / 1000, .015, .15);
                  legato = { cents: 0, xf: xfd, off: .28 }; arts.push('leg'); pv.ended = true; pv.endT = t + xfd;
                  if (c0 < t) { pv.env.gain.cancelScheduledValues(c0); if (pv.lp) pv.lp.frequency.cancelScheduledValues(c0); }
                  pv.xf.gain.cancelScheduledValues(t); pv.xf.gain.setValueAtTime(1, t); pv.xf.gain.setValueCurveAtTime(UPC[1], t, xfd);
                  pv.env.gain.cancelScheduledValues(t + xfd);
                  pv.srcs.forEach((s, k) => { s.detune.cancelScheduledValues(c0); s.detune.setValueAtTime(pv.cents[k], t); try { s.stop(t + xfd + .03); } catch (e2) { /* */ } });
                  if (pv.gosc) { try { pv.gosc.stop(t + xfd + .03); } catch (e2) { /* */ } }
                  if (pv.endClick) { pv.endClick(); pv.endClick = null; }
                  pv.stopT = t + xfd + .03;
                }
              } catch (e2) { /* */ }
            } else if (overlap) { endVoice(pv, t, .03, 0); }
          }
          if (!tied) {
          const v = spawn({ note: nn1, vel, t, sub, bite: legato ? 0 : bite, growl, scoop: legato ? 0 : scoop, level: TRIMV, cents, pan: 0, legato, growlSwell: growl > 0 && long, fall });
          if (v) {
            vs.push(v); if (hasDur) endVoice(v, endAt, rel, fall); cur = { v, note: nn1, endT: endAt, t };
            if (!legato) noise('b', t, e.breath * BREATH_REL * (.5 + .9 * sub) * (.4 + .6 * vel), 0); else noise('k', t, e.keys * KEY_REL * (.5 + .5 * vel), 0);
          }
          }
        }
        if (hasDur && vs.length) { const h = noise('k', endAt + .004, e.keys * KEY_REL * (.35 + .4 * vel) * (stac ? .7 : 1), 0); vs.forEach(v => { v.endClick = h; }); }
        if (!hasDur && (vs.length || tied) && cur && cur.v) { const l = held.get(note) || []; (tied ? [cur.v] : vs).forEach(v => { if (!l.includes(v)) l.push(v); }); held.set(note, l); }
        if (growl > 0) arts.push('growl'); if (fall > 0) arts.push('fall'); if (scoop > 0) arts.push('scoop');
        lastArt = { note: base, vel, arts, at: ctx.currentTime };
      } catch (err) { error = T.audioErr + (err && err.message || String(err)); }
    }
    function noteOff(note, time) {
      try {
        const t = Math.max(ctx.currentTime, fin(time, ctx.currentTime)); const l = held.get(note); if (!l) return; held.delete(note);
        const e = eff; l.forEach(v => { endVoice(v, t, .08, e.fall > .02 && should(state.fallOn, false, true) ? e.fall : 0); if (cur && cur.v === v) cur.endT = t; });
        if (kit && kit.clicks) noise('k', t + .004, e.keys * KEY_REL * .45, 0);
      } catch (err) { /* */ }
    }

    // ---- opnames laden (alleen na een klik) ----
    const canNet = () => typeof host.fetchFile === 'function';
    const errText = e => { const c = e && e.code; return c === 'url' ? T.errUrl : c === 'aborted' ? T.errAborted : c === 'network' ? T.errNetwork : c === 'http' ? T.errHttp(e.status) : c === 'size' ? T.errSize : c === 'response' ? T.errResponse : c === 'decode' ? T.errDecode : T.errOther; };
    function rms(d, a, b) { a = Math.max(0, a | 0); b = Math.min(d.length, b | 0); if (b <= a) return 0; let s = 0; for (let i = a; i < b; i++) s += d[i] * d[i]; return Math.sqrt(s / (b - a)); }
    // een noot-opname: kap af bij het eind van de lus, meet de aanzet
    function makeSample(f, buf, lp) {
      const sr = buf.sampleRate; let ls, le;
      if (lp) { ls = lp.ls / lp.rate; le = lp.le / lp.rate; } else { ls = buf.duration * .55; le = buf.duration * .75; }
      le = Math.min(le, buf.duration - .005); if (!(le - ls > .02) || ls < .05) { ls = buf.duration * .55; le = buf.duration * .75; }
      const n = Math.min(buf.length, Math.ceil(le * sr) + 2); let b = buf;
      if (n < buf.length) { b = ctx.createBuffer(buf.numberOfChannels, n, sr); for (let c = 0; c < buf.numberOfChannels; c++) b.copyToChannel(buf.getChannelData(c).subarray(0, n), c); }
      const d = b.getChannelData(0), sus = rms(d, Math.min(.25, ls * .3) * sr, Math.min(1, ls) * sr), w = Math.max(8, Math.round(sr * .003)); let on = 0;
      if (sus > 1e-5) for (let i = 0; i + w < Math.min(d.length, sr); i += Math.round(w / 2)) { if (rms(d, i, i + w) > .1 * sus) { on = Math.max(0, i / sr - .002); break; } }
      return { nat: f.nat, vol: f.vol, buf: b, ls, le: Math.min(le, b.duration - .001), on, sus, loop: !!lp };
    }
    // het niveau per opname gelijktrekken binnen elke laag (90% van het verschil, hoogstens 6 dB); het verschil tussen de lagen blijft
    function normalise(lib) {
      for (const k of Object.keys(lib.layers)) {
        const L = lib.layers[k]; L.forEach(s => { s.adj = s.sus * Math.pow(10, s.vol / 20); });
        const all = L.map(s => s.adj).filter(x => x > 1e-5).sort((x, y) => x - y); if (!all.length) continue; const M = all[Math.floor(all.length / 2)];
        L.forEach(s => { if (s.adj > 1e-5) s.vol += clamp(.9 * 20 * Math.log10(M / s.adj), -6, 6); });
      }
    }
    async function loadKit() {
      if (job || dead) return;
      if (!canNet()) { status = T.oldHost; statusErr = true; paintKit(); return; }
      const inst = state.instrument, size = state.size, files = fileList(inst, size), est = estimate(inst, size);
      const J = job = { ctl: new AbortController(), done: 0, total: files.length, bytes: 0, live: new Array(files.length).fill(0), est: est.bytes, fail: [], paintAt: 0 };
      status = ''; statusErr = false; error = ''; paintKit();
      const lib = { inst, size, layers: {}, breath: [], clicks: [], bytes: 0, dec: 0, files: 0, noLoop: 0 }; let next = 0, ok = 0, dec = 0;
      const work = async () => {
        while (!J.ctl.signal.aborted) {
          const i = next++; if (i >= files.length) return; const f = files[i];
          try {
            const o = { as: 'arraybuffer', maxBytes: Math.ceil(f.kb * 1024 * 1.3 / 65536) * 65536, signal: J.ctl.signal, onProgress: r => { J.live[i] = r; paintLoad(); } };
            const name = fileName(inst, f); let ab;
            try { ab = await host.fetchFile(self, BASE + name, o); } catch (e0) { if (!e0 || (e0.code !== 'http' && e0.code !== 'network')) throw e0; J.live[i] = 0; ab = await host.fetchFile(self, RAW + name, o); }
            J.live[i] = 0; J.bytes += ab.byteLength;
            const lp = f.kind === 'b' || f.kind === 'k' ? null : flacLoop(ab);
            let buf; try { buf = await ctx.decodeAudioData(ab); } catch (e2) { throw Object.assign(new Error('decode'), { code: 'decode' }); }
            if (J.ctl.signal.aborted) return;
            if (f.kind === 'b' || f.kind === 'k') {
              const r = rms(buf.getChannelData(0), 0, buf.length); (f.kind === 'b' ? lib.breath : lib.clicks).push({ buf, g: r > 1e-5 ? clamp(.09 / r, .2, 8) : 1 }); dec += buf.length * 4;
            } else { const s = makeSample(f, buf, lp); (lib.layers[f.kind] || (lib.layers[f.kind] = [])).push(s); if (!lp) lib.noLoop++; dec += s.buf.length * 4; }
            ok++;
          } catch (e) { if (e && e.code === 'aborted') return; J.live[i] = 0; J.fail.push(e); }
          J.done++; paintLoad();
        }
      };
      try { await Promise.all([work(), work(), work(), work()]); } catch (e) { /* */ }
      if (dead) return;
      job = null;
      if (J.ctl.signal.aborted) { status = T.aborted; statusErr = false; paintKit(); return; }
      for (const k of Object.keys(lib.layers)) lib.layers[k].sort((a, b) => a.nat - b.nat);
      if (!ok || !Object.keys(lib.layers).length) { status = T.failAll(J.fail.length ? errText(J.fail[0]) : T.errOther); statusErr = true; paintKit(); return; }
      normalise(lib); stopAll(.05); lib.bytes = J.bytes; lib.dec = dec; lib.files = ok; kit = lib;
      status = J.fail.length ? T.partial(ok, J.fail.length, errText(J.fail[0])) : T.loaded(NAMES[inst][lang === 'nl' ? 0 : 1], ok, mbOf(J.bytes), mbOf(dec)); statusErr = J.fail.length > 0;
      paintKit(); paintAud();
    }
    function cancelLoad() { if (job) job.ctl.abort(); }
    function clearKit() { if (job) return; stopAll(.05); kit = null; status = T.cleared; statusErr = false; paintKit(); }

    // ---- UI ----
    const adopt = (el, id, role, group, label) => { if (host.ui && typeof host.ui.adopt === 'function') { try { host.ui.adopt(el, { id, role, group, label }); } catch (e) { /* oud contract */ } } };
    const mk = (tag, cls, parent, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt !== undefined) e.textContent = txt; if (parent) parent.appendChild(e); return e; };
    const fmtOf = (p, v) => {
      const u = p[5];
      if (u === '%') return Math.round(v * 100) + '%'; if (u === 'ms') return Math.round(v) + ' ms'; if (u === 'Hz') return (p[3] < 1 ? v.toFixed(1) : Math.round(v)) + ' Hz';
      if (u === 'ct') return (v > 0 ? '+' : '') + Math.round(v) + ' ct'; if (u === 'st') return (v > 0 ? '+' : '') + Math.round(v) + ' st'; if (u === 'dB') return (v > 0 ? '+' : '') + v.toFixed(1) + ' dB';
      if (u === 's') return v.toFixed(2) + ' s'; if (u === 'vel') return 'vel ' + Math.round(v * 127); return String(Math.round(v));
    };
    const norm = (p, v) => Number(clamp(Math.round(fin(v, p[4]) / p[3]) * p[3], p[1], p[2]).toFixed(6));
    function knob(parent, id) {
      const p = NMAP[id], opt = { default: p[4], id, role: 'param', group: p[6] }; if (p[9] === 'log') opt.scale = 'log';
      ui.knobs[id] = host.ui.knob(parent, lbl(p), [p[1], p[2], p[3]], state[id], v => fmtOf(p, v), v => { state[id] = norm(p, v); apply(); }, opt);
    }
    function select(parent, id, label, group, items, after) {
      const s = host.ui.select(parent, label, items, state[id], v => { if (SELECTS[id].includes(v)) { state[id] = v; apply(); if (after) after(); } }, { id, group });
      ui.sels[id] = s; return s;
    }
    function paintLoad() {
      if (!job || !root || !ui.prog) return; const now = Date.now(); if (now - job.paintAt < 120 && job.done < job.total) return; job.paintAt = now;
      let b = job.bytes; for (const x of job.live) b += x;
      ui.prog.max = Math.max(1, job.est); ui.prog.value = Math.min(b, job.est);
      ui.stat.textContent = T.loading(job.done, job.total, mbOf(b), mbOf(job.est)); ui.stat.className = 'note';
    }
    function paintKit() {
      if (!root || !ui.stat) return;
      const est = estimate(state.instrument, state.size), busy = !!job, nm = i => NAMES[i][lang === 'nl' ? 0 : 1];
      ui.est.textContent = T.est(est.files, mbOf(est.bytes), mbOf(est.dec));
      ui.load.disabled = busy; ui.cancel.hidden = !busy; ui.clear.disabled = busy || !kit; ui.prog.hidden = !busy;
      if (ui.sels.instrument) ui.sels.instrument.disabled = busy; if (ui.sels.size) ui.sels.size.disabled = busy;
      ui.banner.hidden = !!kit || busy; ui.banner.textContent = T.noKit;
      ui.mis.hidden = !(kit && kit.inst !== state.instrument); if (kit) ui.mis.textContent = T.mismatch(nm(state.instrument), nm(kit.inst));
      if (busy) paintLoad(); else { ui.stat.textContent = error || status || (kit ? T.loaded(nm(kit.inst), kit.files, mbOf(kit.bytes), mbOf(kit.dec)) : ''); ui.stat.className = statusErr || error ? 'err' : 'note'; }
    }
    let audVel = .6, audLen = .4;
    function paintAud() {
      if (!root || !ui.aud) return; const inst = (kit && kit.inst) || state.instrument, r = CAT[inst].base + 12;
      ui.aud.replaceChildren(); [0, 2, 4, 5, 7, 9, 11, 12].forEach(x => { const b = mk('button', '', ui.aud, noteName(r + x)); b.type = 'button'; b.onclick = () => { try { if (!dead) noteOn(r + x - eff.transpose, audVel, ctx.currentTime + .02, audLen); } catch (e) { /* */ } }; });
    }
    function render() {
      if (!root) return; root.replaceChildren(); ui.knobs = {}; ui.sels = {};
      const st = document.createElement('style'); st.textContent = CSS; root.appendChild(st);
      const app = mk('div', 'sx', root), nm = i => NAMES[i][lang === 'nl' ? 0 : 1];
      // opnames
      const ks = mk('div', 'sec', app); mk('h4', '', ks, T.kit);
      const r1 = mk('div', 'row', ks);
      select(r1, 'instrument', T.inst, 'kit', INSTR.map(i => [i, nm(i)]), () => { paintKit(); paintAud(); });
      select(r1, 'size', T.size, 'kit', SELECTS.size.map(s => [s, T.sizes[s]]), () => paintKit());
      const r2 = mk('div', 'row', ks);
      ui.load = mk('button', 'on', r2, T.load); ui.load.type = 'button'; ui.load.onclick = () => { loadKit(); }; adopt(ui.load, 'load', 'button', 'kit', T.load);
      ui.cancel = mk('button', '', r2, T.cancel); ui.cancel.type = 'button'; ui.cancel.onclick = cancelLoad; adopt(ui.cancel, 'cancel', 'button', 'kit', T.cancel);
      ui.clear = mk('button', '', r2, T.clear); ui.clear.type = 'button'; ui.clear.onclick = clearKit; adopt(ui.clear, 'clear', 'button', 'kit', T.clear);
      ui.prog = mk('progress', '', ks); ui.prog.value = 0;
      ui.stat = mk('div', 'note', ks, ''); ui.est = mk('div', 'note', ks, ''); ui.banner = mk('div', 'warn', ks, T.noKit); ui.mis = mk('div', 'warn', ks, '');
      const src = mk('div', 'note', ks, T.credit + ': ' + T.attr + '. '), a = mk('a', '', src, T.srcLink); a.href = SRC.home; a.target = '_blank'; a.rel = 'noopener noreferrer';
      // spel
      const sec = (title, cls) => { const s = mk('div', 'sec', app); mk('h4', '', s, title); return s; };
      const ps = sec(T.play), pk1 = mk('div', 'kg', ps);
      NUM.filter(p => p[6] === 'play').forEach(p => knob(pk1, p[0]));
      // effecten
      const fs = sec(T.fx), fr = mk('div', 'row', fs);
      select(fr, 'growlOn', T.growlOn, 'fxsel', SELECTS.growlOn.map(k => [k, T.ons[k]])); select(fr, 'fallOn', T.fallOn, 'fxsel', SELECTS.fallOn.map(k => [k, T.ons[k]])); select(fr, 'scoopOn', T.scoopOn, 'fxsel', SELECTS.scoopOn.map(k => [k, T.ons[k]]));
      const fk = mk('div', 'kg', fs); NUM.filter(p => p[6] === 'fx').forEach(p => knob(fk, p[0]));
      // stem
      const ss = sec(T.pitch), sk = mk('div', 'kg', ss); NUM.filter(p => p[6] === 'pitch').forEach(p => knob(sk, p[0]));
      // sectie
      const cs = sec(T.sect), cr = mk('div', 'row', cs);
      select(cr, 'mode', T.mode, 'sectsel', SELECTS.mode.map(k => [k, T.modes[k]])); select(cr, 'stack', T.stack, 'sectsel', SELECTS.stack.map(k => [k, T.stacks[k]]));
      const ck = mk('div', 'kg', cs); NUM.filter(p => p[6] === 'sect').forEach(p => knob(ck, p[0]));
      // klank
      const ts = sec(T.tone), tr = mk('div', 'row', ts);
      select(tr, 'room', T.room, 'tonesel', SELECTS.room.map(k => [k, T.roomOpts[k]]));
      const tk = mk('div', 'kg', ts); NUM.filter(p => p[6] === 'tone').forEach(p => knob(tk, p[0]));
      // beluisteren
      const as = sec(T.audition), ar = mk('div', 'row', as);
      const nsel = (label, items, val, fn) => { const f = mk('label', 'fld', ar); mk('span', '', f, label); const s = mk('select', '', f); items.forEach(([v, n]) => { const o = mk('option', '', s, n); o.value = String(v); }); s.value = String(val); s.onchange = () => fn(+s.value); return s; };
      nsel(T.audVel, [[.22, T.soft], [.6, T.mid], [.95, T.hard]], audVel, v => { audVel = v; });
      nsel(T.audLen, [[.12, T.lenS], [.4, T.lenM], [1, T.lenL], [3, T.lenX]], audLen, v => { audLen = v; });
      ui.aud = mk('div', 'pads', as); ui.last = mk('div', 'last', as, T.none); paintAud();
      paintKit();
    }
    const artText = a => a ? noteName(a.note) + ' · ' + T.velWord + ' ' + Math.round(a.vel * 127) + ' · ' + a.arts.map(k => T.arts[k]).join(' + ') : T.none;
    function draw() { if (!ui.last || !lastArt) return; const t = artText(lastArt); if (ui.last.textContent !== t) ui.last.textContent = t; }

    // ---- instance ----
    self = {
      inputs: {}, outputs: { out: outN },
      mount(el) {
        if (root) self.unmount();
        const wrap = document.createElement('div'); el.appendChild(wrap);
        root = typeof wrap.attachShadow === 'function' ? wrap.attachShadow({ mode: 'open' }) : wrap;
        render();
        if (host && typeof host.frame === 'function') stopFrame = host.frame(self, draw, 12);
      },
      unmount() {
        if (stopFrame) { stopFrame(); stopFrame = null; }
        if (root && root.host) { const w = root.host; if (w.parentNode) w.parentNode.removeChild(w); } else if (root && root.parentNode) root.innerHTML = '';
        root = null; ui.knobs = {}; ui.sels = {}; ui.prog = ui.stat = ui.est = ui.banner = ui.mis = ui.load = ui.cancel = ui.clear = ui.aud = ui.last = null;
      },
      onTransport(info) { if (!dead && !(info && info.playing)) stopAll(.06); },
      onEvent(port, ev) {
        try {
          if (dead || port !== 'notes' || !ev || typeof ev !== 'object') return;
          const type = String(ev.type).toLowerCase().replace(/[_-]/g, ''), time = Number.isFinite(ev.time) ? ev.time : ctx.currentTime;
          if (['note', 'noteon', 'noteoff'].includes(type) && Number.isFinite(ev.note)) {
            const n = clamp(Math.round(ev.note), 0, 127);
            if (type === 'noteoff' || ev.off === true || (type === 'noteon' && ev.vel === 0)) { noteOff(n, time); return; }
            noteOn(n, Number.isFinite(ev.vel) ? clamp(ev.vel, 0, 1) : .8, time, type === 'noteon' || ev.held === true ? undefined : Number.isFinite(ev.dur) ? clamp(ev.dur, .005, 600) : undefined);
          } else if (type === 'cc' && Number.isFinite(ev.value)) {
            const id = String(ev.id || ''), v = clamp(ev.value, 0, 1), alias = { expression: 'expr', modwheel: 'vib', mod: 'vib', vibrato: 'vib', volume: 'level' }[id] || id;
            if (Object.hasOwn(NMAP, alias) && !MODEX.includes(alias)) { const p = NMAP[alias]; state[alias] = norm(p, p[1] + v * (p[2] - p[1])); if (ui.knobs[alias]) ui.knobs[alias].set(state[alias]); apply(); }
          } else if (type === 'panic' || type === 'allnotesoff') stopAll(.05, time);
        } catch (e) { /* nooit de planner laten struikelen */ }
      },
      params() {
        const lanes = { play: ['Spel', 'Playing'], fx: ['Effecten', 'Effects'], pitch: ['Stem', 'Pitch'], sect: ['Sectie', 'Section'], tone: ['Klank', 'Tone'] };
        return NUM.filter(p => !MODEX.includes(p[0])).map(p => ({ id: p[0], name: lbl(p), lane: p[6], laneName: lanes[p[6]][lang === 'nl' ? 0 : 1], min: p[1], max: p[2], scale: p[9], drift: p[10] ? .08 : .04, on: p[10] === 1, role: p[6] === 'tone' ? 'filter' : p[6] === 'pitch' ? 'pitch' : 'level' }));
      },
      modulate(offsets) {
        if (dead) return; const next = {};
        if (isObj(offsets)) for (const p of NUM) { if (MODEX.includes(p[0])) continue; const v = offsets[p[0]]; if (typeof v === 'number' && Number.isFinite(v)) next[p[0]] = clamp(v, -1, 1); }
        mod = next; apply();
      },
      getState() { return { ...state }; },
      setState(raw) {
        if (dead) return; const s = isObj(raw) ? raw : {}, next = { ...defaults };
        for (const p of NUM) if (typeof s[p[0]] === 'number' && Number.isFinite(s[p[0]])) next[p[0]] = norm(p, s[p[0]]);
        for (const k of Object.keys(SELECTS)) if (typeof s[k] === 'string' && SELECTS[k].includes(s[k])) next[k] = s[k];
        state = next; apply();
        for (const id of Object.keys(ui.knobs)) if (ui.knobs[id] && ui.knobs[id].set) ui.knobs[id].set(state[id]);
        for (const id of Object.keys(ui.sels)) if (ui.sels[id] && Object.hasOwn(state, id)) ui.sels[id].value = state[id];
        paintKit(); paintAud();
      },
      destroy() {
        if (dead) return; dead = true; if (job) job.ctl.abort();
        if (guardTimer) { clearInterval(guardTimer); guardTimer = null; }
        if (stopFrame) { stopFrame(); stopFrame = null; }
        try { voices.forEach(v => { v.srcs.forEach(s => { try { s.stop(); } catch (e) { /* */ } }); if (v.gosc) { try { v.gosc.stop(); } catch (e) { /* */ } } }); } catch (e) { /* */ }
        voices.clear(); held.clear(); cur = null; kit = null; root = null;
        try { vibLfo.stop(); } catch (e) { /* */ }
        owned.forEach(n => { try { n.disconnect(); } catch (e) { /* */ } }); owned.clear();
        [bus, lvl, expG, fin_, wetSum, outN, dryG, satG].forEach(n => { try { n.disconnect(); } catch (e) { /* */ } });
        conv = convG = null;
      }
    };
    guardTimer = typeof setInterval === 'function' ? setInterval(() => { if (!dead) guard(true); }, 500) : null;
    apply();
    return self;
  }
};
