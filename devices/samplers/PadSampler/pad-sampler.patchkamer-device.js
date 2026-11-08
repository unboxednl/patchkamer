// SPDX-License-Identifier: AGPL-3.0-or-later
// 1.3.0 — Pad Sampler, stap 4 (banken en catalogus), Patchkamer contract v1.27 (gevalideerd tegen v1.28). Nieuw: tab Banken met een catalogus van gratis banken (alleen bronnen waarvan de licentie is gelezen; elk bestand vastgepind op een
//          versie van de bron; licentie, auteur en vereiste vermelding altijd zichtbaar), lokaal laden (bestanden of map), een webadres en Freesound met het eigen token van de gebruiker. Importers voor WAV (root en lus uit het
//          smpl-blok), FLAC, OGG en MP3 (met waarschuwing voor lussen), een SFZ-subset en Decent Sampler (.dspreset), met een importrapport van wat is overgenomen en wat genegeerd. Een bank laden is een stap die ongedaan te maken is.
//          Netwerk doet het apparaat niet zelf (contract §15): het vraagt het aan de host (host.fetchFile, alleen na een klik). State: optioneel `credits` (afgeleid van de licentiegegevens van de samples die er echt in zitten);
//          oude states laden ongewijzigd en setState(getState()) blijft exact.
// 1.2.0 — Pad Sampler, stap 3 (chop, Flatten/Resample en Process), Patchkamer contract v1.27. Nieuw in de tab Bewerken: de soorten Chop (slices maken met gelijke delen, op drempel, handmatig of op BPM en maten;
//          markers op de golfvorm slepen met muis en aanraking, beluisteren per slice, slices naar pads zonder kopieën van het sample), Process (filter, drive, bitcrusher, EQ, compressor en
//          tempo-afstemming als echte bewerking van het sample, met beluisteren) en Flatten (een pad of de selectie met OfflineAudioContext naar een nieuw sample). Programma-stappen
//          (pads en slices) zijn ongedaan te maken in dezelfde geschiedenis. State: optioneel `sliceEnds` per sample (eigen eindposities van slices); oude states laden ongewijzigd.
// 1.1.0 — Pad Sampler, stap 2 (golfvormeditor en sample-bewerkingen), Patchkamer contract v1.27. Nieuw: tab Bewerken met een golfvormeditor (zoomen, scrollen, selectie
//          met handvatten, snappen op nuldoorgang, afspeelkop, selectie of lus beluisteren, scrubben), bewerkingen op een Float32-kopie met PCM16-resultaat (afsnijden,
//          verwijderen, knippen, kopiëren, plakken, invoegen, stilte, normaliseren, gain, fades, omkeren, DC weg, mono, toonhoogte, bit- en sample-rate-reductie,
//          start/einde en lus uit een selectie, loop-crossfade inbakken) en ongedaan/opnieuw (alleen in het geheugen, niet in de state).
// 1.0.0 — Pad Sampler, stap 1 (kern), Patchkamer contract v1.26. Een sampler met 4 banken van 16 pads, 4 lagen per pad (velocity, cycle, random, all),
//          drum- en keygroup-modus (zones met toetsbereik en grondtoon), AD/ADSR-envelope en filter per pad, mutegroepen, polyfonie per pad,
//          one-shot/hold, omgekeerd afspelen, een eigen audio-uitgang per pad (out1 t/m out16 naast de stereomix) en events met tijd op de audioklok.
//          Samples staan als PCM16/base64 in een samplestore (gededupliceerd op hash, hoogstens 64 MiB); de ingebouwde demo-samples zijn gesynthetiseerd
//          en staan niet in de state. De golfvormeditor, chop, Flatten en de catalogus volgen in latere stappen (de editor staat sinds 1.1.0 in de tab Bewerken).

// ---------- teksten per taal (host.lang): Nederlandse bron, Engels als alternatief ----------
const TXT = {
  nl: {
    bank: 'Bank', bankName: 'Banknaam', stopAll: 'Stop alles', octDown: 'Octaaf lager', octUp: 'Octaaf hoger',
    tabPad: 'Pad', tabLayers: 'Lagen', tabZones: 'Zones', tabEdit: 'Bewerken', tabProgram: 'Programma', tabBanks: 'Banken',
    padName: 'Naam van het pad', clearPad: 'Wis pad', mode: 'Soort', modeDrum: 'Drum (pad)', modeKey: 'Keygroup (toetsen)', play: 'Spelen',
    pVelocity: 'Op velocity', pCycle: 'Om de beurt', pRandom: 'Willekeurig', pAll: 'Alle lagen', output: 'Uitgang', outMix: 'Stereomix', outN: 'Uitgang',
    oneShot: 'One-shot', reverse: 'Omgekeerd', envelope: 'Envelope', envShape: 'Vorm', filter: 'Filter', filterType: 'Soort filter', off: 'Uit',
    lp: 'Laagdoorlaat', hp: 'Hoogdoorlaat', bp: 'Banddoorlaat', layer: 'Laag', sample: 'Sample', none: '– geen –', loadFile: 'Bestand laden…', clearLayer: 'Wis laag',
    waveform: 'Golfvorm van het sample (alleen weergave)', loop: 'Lus', loopOn: 'Lus aan',
    layerHelp: 'Een pad heeft vier lagen. Bij Op velocity klinkt elke laag waarvan het velocity-bereik de aanslag bevat; bij Om de beurt en Willekeurig kiest het pad er één; bij Alle lagen klinken ze allemaal. Een lus werkt alleen als One-shot uit staat. De crossfade van de lus volgt in een volgende versie.',
    zoneHelp: 'Zones gelden voor een pad van het soort Keygroup: elk sample krijgt een toetsbereik en een grondtoon, en klinkt getransponeerd. Zonder zones speelt het pad zijn lagen chromatisch rond de grondtoon van elke laag.',
    zone: 'Zone', zoneAdd: 'Zone toevoegen', zoneDel: 'Zone verwijderen', zoneNotKey: 'Zet het pad op Keygroup (tabblad Pad) om zones te gebruiken.', zoneCount: '{0} zone(s).', zoneNone: 'Nog geen zones: de lagen klinken chromatisch rond hun grondtoon.',
    demoKit: 'Demo-kit herstellen', demoKitDone: 'Demo-kit teruggezet in bank A.', clearAll: 'Leeg programma', clearDone: 'Alle banken zijn leeg.',
    help: 'Pads: klik, tik of gebruik het toetsenbord (Enter of spatie; 1234, qwer, asdf, zxcv; pijltjes verplaatsen). Een bestand slepen op een pad laadt het daar. Drum-pads luisteren naar de noten vanaf Eerste pad (bank A pad 1 tot bank D pad 16); een keygroup luistert naar de toetsbereiken van zijn zones. Elke uitgang (Uitgang 1 tot 16) is los te mixen; de stereomix heeft een zachte begrenzer, de losse uitgangen niet. Bluetooth-uitvoer is traag: gebruik een kabel of een audio-interface voor lage latency.',
    dropHint: 'Geen sample: sleep een bestand hierheen of kies Bestand laden', keys: 'toetsen', empty: 'leeg', pad: 'Pad', builtin: 'ingebouwd', noSample: 'Geen sample in deze laag.',
    mem: 'Samplegeheugen: {0} van {1} MiB PCM.', voices: 'Stemmen', master: 'Master',
    memFull: 'Samplegeheugen vol: maximaal 64 MiB PCM16. Verwijder samples of kies een korter bestand.', noDecode: 'Audio-decodering is niet beschikbaar in deze omgeving.',
    fileBig: 'Bestand te groot (maximaal 50 MiB).', loading: 'Laden: {0}', decodeFail: 'Kon {0} niet decoderen. Is het een geldige WAV, FLAC, OGG of MP3?', noAudio: '{0} bevat geen audio.',
    tooLong: 'Sample langer dan 120 seconden. Kies een korter fragment.', loaded: '{0} sample(s) geladen.', dropped: '{0} sample(s) niet geladen (ongeldig of geheugen vol).',
    e: {
      title: 'Golfvormeditor', target: 'Bewerk', layerN: 'Laag {0}', zoneN: 'Zone {0}', needSample: 'Kies of laad eerst een sample (tab Lagen) om te bewerken.',
      canvas: 'Golfvormeditor. Sleep om te selecteren, scrollwiel om te zoomen. Pijltjes verplaatsen de cursor, Shift+pijltjes maken een selectie, plus en min zoomen, spatie speelt af.',
      play: 'Selectie afspelen', loop: 'Lus afspelen', stop: 'Stop', zoomIn: 'Inzoomen', zoomOut: 'Uitzoomen', zoomAll: 'Alles', zoomSel: 'Naar selectie', scroll: 'Scrollen door het sample',
      snap: 'Snap op nuldoorgang', chans: 'Kanalen', chLR: 'L en R boven elkaar', chSum: 'Som',
      selStart: 'Start', selEnd: 'Einde', cursor: 'Cursor', frames: 'samples', noSel: 'geen selectie', sel: 'Selectie: {0} samples ({1})', total: 'Hele sample: {0} samples ({1})',
      peaks: 'Piek {0} dB · RMS {1} dB', chL: 'L', chR: 'R', chM: 'M',
      grpEdit: 'Bewerken', grpClip: 'Klembord', grpLevel: 'Niveau en fades', grpSound: 'Klank', grpLoop: 'Start, einde en lus', grpUndo: 'Geschiedenis',
      undo: 'Ongedaan', redo: 'Opnieuw', selAll: 'Alles selecteren', trim: 'Afsnijden', del: 'Verwijderen', cut: 'Knippen', copy: 'Kopiëren', paste: 'Plakken', insert: 'Invoegen',
      silence: 'Stilte invoegen', silenceMs: 'Stilte (ms)', mute: 'Selectie dempen',
      normalize: 'Normaliseren', gain: 'Gain (dB)', gainDo: 'Gain toepassen', fadeIn: 'Fade in', fadeOut: 'Fade uit', fadeShape: 'Vorm van de fade', fLin: 'Lineair', fLog: 'Logaritmisch', fExp: 'Exponentieel',
      reverse: 'Omkeren', dc: 'DC-offset weg', mono: 'Mono maken', pitch: 'Halve tonen', pitchDo: 'Toonhoogte wijzigen', bits: 'Bits', bitDo: 'Bit-reductie', rate: 'Sample rate (Hz)', rateDo: 'Sample-rate-reductie',
      toStartEnd: 'Selectie als start en einde', toLoop: 'Selectie als lus', xfade: 'Crossfade (ms)', xfadeDo: 'Loop-crossfade toepassen',
      done: '{0}: klaar.', undone: 'Ongedaan gemaakt: {0}.', redone: 'Opnieuw gedaan: {0}.', noUndo: 'Niets om ongedaan te maken.', noRedo: 'Niets om opnieuw te doen.', gone: 'Die plek bestaat niet meer; stap overgeslagen.',
      needSel: 'Selecteer eerst een stuk van het sample.', clipEmpty: 'Het klembord is leeg.', emptyResult: 'Dat laat niets over van het sample.', silent: 'Het stuk is stil; er valt niets te normaliseren.',
      clipped: '{0} sample(s) afgekapt op 0 dBFS.', monoAlready: 'Het sample is al mono.', nothing: 'Niets te doen.', copied: 'Gekopieerd: {0} samples.', needLoop: 'Zet eerst een lus (Selectie als lus).',
      noRoom: 'Er is te weinig ruimte vóór het lusbegin voor deze crossfade.', needLayer: 'Start en einde bestaan alleen voor een laag, niet voor een zone.', badValue: 'Dat getal kan niet.',
      kbd: 'Toetsen: X knippen · C kopiëren · V plakken · I invoegen · Delete verwijderen · Ctrl+A alles · spatie afspelen (Shift+spatie lus) · plus en min zoomen · pijltjes cursor (Shift: selectie) · Ctrl+Z ongedaan · Ctrl+Shift+Z of Ctrl+Y opnieuw. Alles werkt op een kopie; het resultaat wordt een nieuw sample van 16 bit.',
      hist: 'Ongedaan: {0} stappen, opnieuw: {1}.', marker: 'Markering verplaatsen',
      mEdit: 'Bewerken', mChop: 'Chop', mProc: 'Process', mFlat: 'Flatten', modes: 'Soort bewerking',
      grpChop: 'Chop: slices maken', chopEq: 'Gelijke delen', chopParts: 'Aantal delen', chopThr: 'Op drempel', thrDb: 'Drempel (dB onder de piek)', minMs: 'Minimale tijd (ms)',
      chopBpm: 'Op BPM en maten', bpm: 'BPM', perUnit: 'Eén slice per', uBar: 'maat (4 tellen)', uBeat: 'tel', uEighth: 'achtste', uSixteenth: 'zestiende', beats: 'Tellen in het sample',
      bpmFromBeats: 'BPM uit tellen', half: '/2', double: '×2', slAdd: 'Marker op cursor', slDel: 'Marker verwijderen', slClear: 'Alle markers wissen', link: 'Eind van een slice gekoppeld aan het begin van de volgende',
      slSelect: 'Slice als selectie', slNone: 'Nog geen slices. Maak ze met een van de knoppen hierboven.', slInfo: 'Slice {0} van {1}: {2} tot {3} ({4} samples)', slN: 'Slice {0}', slPlay: 'Slice {0} beluisteren',
      chopDone: 'Chop: {0} slices.', slFull: 'Meer dan 128 slices kan niet.', slExists: 'Daar staat al een marker.', slNoSel: 'Kies eerst een slice.',
      kbdChop: 'Chop: 1 t/m 9 beluistert slice 1 t/m 9 · pijl links en rechts vorige en volgende slice · M of Enter zet een marker op de cursor · Delete haalt de gekozen marker weg. Sleep een nummer onderin de golfvorm om een marker te verplaatsen.',
      grpPads: 'Slices naar pads', spBank: 'Eerste pad: bank', spPad: 'pad', spMode: 'Bestaande pads', spReplace: 'Vervangen', spEmpty: 'Alleen lege pads vullen', spTailOn: 'Staart toevoegen', spTailMs: 'Staart (ms, advies 100)', spGo: 'Slices naar pads',
      spDone: '{0} slices op pads gezet ({1} overgeslagen, {2} pasten niet).', spLabel: 'Slices naar pads', spNeed: 'Maak eerst slices.',
      grpProc: 'Process: als sample opslaan', procOp: 'Bewerking', fxFilter: 'Filter', fxDrive: 'Drive', fxCrush: 'Bitcrusher', fxEq: 'EQ met drie banden', fxComp: 'Compressor', fxTempo: 'Tempo-afstemming',
      fType: 'Soort', fCut: 'Cutoff (Hz)', fQ: 'Resonantie (Q)', fSlope: 'Helling', fSweep: 'Sweep over de selectie', fCutEnd: 'Cutoff aan het eind (Hz)', sl12: '12 dB per octaaf', sl24: '24 dB per octaaf',
      drDb: 'Drive (dB)', drMix: 'Mix (%)', crBits: 'Bits', crHz: 'Sample rate (Hz)', eqLow: 'Laag (dB, 200 Hz)', eqMid: 'Midden (dB, 1 kHz)', eqHigh: 'Hoog (dB, 5 kHz)',
      cpThr: 'Drempel (dB)', cpRatio: 'Ratio', cpAtk: 'Attack (ms)', cpRel: 'Release (ms)', cpMk: 'Make-up (dB)', tmTarget: 'Doel-BPM', tmNow: 'Huidig tempo: {0} BPM', tmSt: 'Hersamplen: de toonhoogte verandert mee ({0} halve tonen); echte time-stretch volgt later.',
      procPrev: 'Beluisteren', procApply: 'Toepassen', procHelp: 'Werkt op de selectie, of op het hele sample als er geen selectie is. Het resultaat wordt echt in het sample opgeslagen (geen effect-apparaat) en is ongedaan te maken.',
      fxNames: { filter: 'Filter', drive: 'Drive', crush: 'Bitcrusher', eq: 'EQ', comp: 'Compressor', tempo: 'Tempo-afstemming' },
      grpFlat: 'Flatten en resample', flSrc: 'Bron', flSrcPad: 'Gekozen pad (alle lagen, envelope, filter, tune)', flSrcSel: 'Selectie van de editor', flNote: 'Noot', flVel: 'Velocity', flTail: 'Staart (s)', flHold: 'Notenlengte (s, 0 = automatisch)',
      flCh: 'Kanalen', flStereo: 'Stereo', flMono: 'Mono', flNorm: 'Normaliseren', flTrim: 'Stilte aan het eind afsnijden', flDest: 'Resultaat', dNew: 'Nieuwe laag in dit pad', dLayer: 'Vervang de gekozen laag', dReplace: 'Vervang dit pad (instellingen terug naar standaard)', dOther: 'Op een ander pad',
      flBank: 'Bank', flPadN: 'Pad', flWarn: 'Let op: Pad Sampler heeft nog geen insert-effecten. Wat je hoort komt uit de lagen, de envelope, het filter, de tune en het niveau en panorama van het pad. Reverb en delay van andere apparaten worden niet ingebakken. Filter, drive, bitcrusher, EQ en compressor kun je met Process wel als sample opslaan.',
      flGo: 'Flatten', flPrev: 'Beluisteren', flBusy: 'Bezig met renderen…', flNoSound: 'Dit pad heeft bij deze noot en velocity geen geluid.', flNoRoom: 'Alle vier de lagen van dit pad zijn bezet; kies een andere bestemming.', noOffline: 'Offline renderen is niet beschikbaar in deze omgeving.',
      flChanged: 'Het sample is veranderd tijdens het renderen; er is niets toegepast.', flName: 'Flatten {0}', flSelName: 'Selectie {0}', flDone: 'Flatten: {0} s, {1} Hz.', flOverlong: 'Het resultaat zou langer zijn dan 120 seconden.',
    },
    bk: {
      intro: 'Laad een bank met geluiden: uit de catalogus (gratis banken, vastgepind op een versie), van bestanden of een map op je computer, of van een webadres. Licentie en vermelding staan altijd bij de bank; wat je laadt komt onder Vermeldingen en gaat mee in de song. Niets wordt van internet gehaald voordat je zelf op Laden drukt.',
      noNet: 'Deze Patchkamer kan geen bestanden van internet halen voor een apparaat. Download de bestanden van de bron (knop Bron openen) en kies ze onder Lokaal.',
      target: 'Doelbank', clearFirst: 'Bank eerst leegmaken', licHeader: 'Gegevens voor je eigen bestanden', licHelp: 'Optioneel: wordt bij de samples bewaard als herkomst en in Vermeldingen getoond. Bij de catalogus staan ze al.', lfAuthor: 'Auteur', lfLicense: 'Licentie (bijvoorbeeld CC-BY-4.0)', lfAttr: 'Vermelding',
      catalog: 'Catalogus', catHelp: 'Alleen banken waarvan de licentie is gelezen. Elk bestand komt van een vastgepinde versie van de bron. Groen: vrij te gebruiken. Geel: lees de waarschuwing.',
      license: 'Licentie', author: 'Auteur', credit: 'Vermelding', creditReq: 'Vermelding verplicht', creditNo: 'Geen vermelding verplicht (wel netjes)', size: 'Grootte', format: 'Formaat', files: 'bestanden', source: 'Bron', pinned: 'Vastgepind op', checked: 'Gecontroleerd',
      openSrc: 'Bron openen', load: 'Laden', cancel: 'Annuleren', accept: 'Ik begrijp dit en accepteer het risico', green: 'Vrij', yellow: 'Let op', loadBank: 'Laad {0}', openOf: 'Bron openen: {0}',
      local: 'Lokaal', localHelp: 'Kies audiobestanden (WAV, FLAC, OGG, MP3), een SFZ- of Decent Sampler-programma met zijn samples, of een hele map. Een programma met samples gaat in de doelbank; losse audio gaat op het gekozen pad.', chooseFiles: 'Bestanden kiezen…', chooseDir: 'Map kiezen…',
      urlTitle: 'Webadres', urlHelp: 'Een https-adres van een audiobestand, een .sfz of een .dspreset (de samples worden op dezelfde plek gezocht). De server moet toegang vanuit de browser toestaan (CORS).', urlLabel: 'Webadres (https)', urlGo: 'Laden van webadres', badUrl: 'Geen geldig https-adres.',
      fsTitle: 'Freesound', fsHelp: 'Zoek geluiden met je eigen Freesound-token (aan te vragen op freesound.org). Je token blijft alleen in dit venster en wordt nooit in de song bewaard. Alleen CC0 en CC-BY worden getoond; van een geluid wordt het voorbeeld (lossy ogg of mp3) geladen, niet het origineel.', fsToken: 'Eigen token', fsQuery: 'Zoekterm', fsGo: 'Zoeken', fsNeed: 'Vul een zoekterm en je token in.', fsAuth: 'Freesound weigerde het token.', fsNone: 'Geen geschikte resultaten.', fsLoad: 'Laden in gekozen laag', fsOf: '{0} door {1}, {2}, {3} s',
      progress: 'Voortgang', jobLine: '{0}: {1} van {2}', done: 'Klaar.',
      reportTitle: 'Importrapport', rOk: 'Overgenomen', rIgn: 'Genegeerd', rWarn: 'Let op', rNone: 'Nog niets geladen.', rEmpty: '–',
      creditsTitle: 'Vermeldingen', creditsHelp: 'De licenties en vermeldingen van de samples in dit programma. Ze gaan mee in de song.', creditsNone: 'Geen vermeldingen: er zijn geen samples met een licentie geladen.', copy: 'Kopieer als tekst', copied: 'Gekopieerd.', samplesN: '{0} sample(s)',
      undoLabel: 'Bank laden: {0}', busy: 'Er loopt al een import.', errNetwork: 'Geen verbinding, of de server staat toegang vanuit de browser niet toe.', errHttp: 'De server antwoordde met fout {0}.', errSize: 'Het bestand is te groot.', errAudio: 'Dit is geen audio, SFZ of Decent Sampler-bestand.',
      r: {
        regions: '{0} regio(\'s) gevonden, {1} overgenomen.', pads: '{0} drum-pad(s) en {1} zone(s) in een keygroup-pad.', layers: '{0} laag/lagen; {1} pad(s) met velocity-lagen, {2} met afwisselende opnamen (om de beurt), {3} met willekeurige keuze.',
        roots: 'Grondtoon uit het bestand overgenomen bij {0} regio(\'s); stemming bij {1}.', loops: '{0} lus(sen) overgenomen.', panvol: 'Volume overgenomen bij {0} laag/lagen, balans bij {1}.', mute: '{0} pad(s) in een mutegroep (uit group en off_by).', samples: '{0} sample(s) geladen ({1} MiB PCM16).',
      },
      i: { item: '{0}: in {1} regio(\'s)', more: '… en nog {0} andere opcodes', header: 'Onderdeel {0} ({1}×)' },
      s: { keyswitch: '{0} regio(\'s) met een toetsschakelaar (sw_*) overgeslagen', release: '{0} regio(\'s) die bij het loslaten klinken (release) overgeslagen', range: '{0} regio(\'s) met een ongeldig bereik overgeslagen', nosample: '{0} regio(\'s) zonder sample overgeslagen', pads: '{0} regio(\'s) pasten niet in 16 pads', layers: '{0} regio(\'s) pasten niet in vier lagen per pad', zones: '{0} zone(s) pasten niet in 16 zones', other: '{0} overgeslagen' },
      w: {
        thin: 'Er waren meer dan 16 zones: per toetsbereik is één dynamiek gebleven ({0} zone(s) minder).', mute: 'off_by is overgenomen als gedeelde mutegroep: groepen die elkaar afkappen delen één nummer, ook als het in het origineel maar één kant op ging.',
        missing: '{0} bestand(en) niet gevonden of niet te laden: {1}', decode: '{0} bestand(en) niet te decoderen: {1}', notFit: '{0} sample(s) pasten niet in het samplegeheugen (maximaal {1} MiB) en zijn niet geladen.',
        lost: '{0} pad(s) en {1} laag/lagen/zone(s) zijn niet gemaakt omdat hun samples ontbreken of er geen vrij pad was.', mp3Loop: 'MP3 is niet geschikt voor lussen: een mp3 heeft een beginvertraging en het lusgat is niet nauwkeurig tot op het sample ({0}×). Gebruik liever WAV of FLAC.',
        loopFmt: 'Lusposities zijn alleen omgerekend voor WAV; bij {0} sample(s) in een ander formaat loopt de lus over het hele sample.', rootDef: 'Bij {0} zone(s) ontbrak een grondtoon; 60 (C4) is gebruikt.', aborted: 'Geannuleerd: er is niets veranderd.',
        badXml: 'Dit is geen geldig Decent Sampler-bestand.', noRegions: 'Er is geen bruikbare regio in dit bestand.', presetBig: 'Het programmabestand is te groot (maximaal 5 MiB).', morePresets: '{0} ander(e) programma(\'s) in de keuze zijn niet geladen; kies ze één voor één.',
        fsLossy: 'Een Freesound-voorbeeld is lossy gecodeerd (geen origineel).',
      },
    },
    k: {
      level: 'Mastervolume', baseNote: 'Eerste pad (MIDI)', padVel: 'Aanslag van pads', 'pad.tune': 'Toonhoogte', 'pad.fine': 'Fijn', 'pad.level': 'Niveau', 'pad.pan': 'Panorama', 'pad.poly': 'Polyfonie', 'pad.mute': 'Mutegroep', 'pad.baseNote': 'Noot bij tikken',
      'env.attack': 'Attack', 'env.decay': 'Decay', 'env.sustain': 'Sustain', 'env.release': 'Release',
      'filt.cutoff': 'Cutoff', 'filt.res': 'Resonantie', 'filt.envAmt': 'Envelop-diepte', 'filt.velAmt': 'Velocity-diepte',
      'layer.semi': 'Halve tonen', 'layer.fine': 'Fijn', 'layer.level': 'Niveau', 'layer.pan': 'Panorama', 'layer.offset': 'Offset', 'layer.root': 'Grondtoon', 'layer.velLo': 'Velocity vanaf', 'layer.velHi': 'Velocity tot',
      'layer.start': 'Start', 'layer.end': 'Einde', 'layer.gain': 'Gain', 'layer.loopStart': 'Lus start', 'layer.loopEnd': 'Lus einde', 'layer.xfade': 'Lus crossfade',
      'zone.root': 'Grondtoon', 'zone.keyLo': 'Toets vanaf', 'zone.keyHi': 'Toets tot', 'zone.velLo': 'Velocity vanaf', 'zone.velHi': 'Velocity tot', 'zone.tune': 'Stemming', 'zone.loopStart': 'Lus start', 'zone.loopEnd': 'Lus einde',
    },
  },
  en: {
    bank: 'Bank', bankName: 'Bank name', stopAll: 'Stop all', octDown: 'Octave down', octUp: 'Octave up',
    tabPad: 'Pad', tabLayers: 'Layers', tabZones: 'Zones', tabEdit: 'Edit', tabProgram: 'Program', tabBanks: 'Banks',
    padName: 'Pad name', clearPad: 'Clear pad', mode: 'Type', modeDrum: 'Drum (pad)', modeKey: 'Keygroup (keys)', play: 'Play',
    pVelocity: 'By velocity', pCycle: 'Cycle', pRandom: 'Random', pAll: 'All layers', output: 'Output', outMix: 'Stereo mix', outN: 'Output',
    oneShot: 'One-shot', reverse: 'Reverse', envelope: 'Envelope', envShape: 'Shape', filter: 'Filter', filterType: 'Filter type', off: 'Off',
    lp: 'Low-pass', hp: 'High-pass', bp: 'Band-pass', layer: 'Layer', sample: 'Sample', none: '– none –', loadFile: 'Load file…', clearLayer: 'Clear layer',
    waveform: 'Waveform of the sample (display only)', loop: 'Loop', loopOn: 'Loop on',
    layerHelp: 'A pad has four layers. With By velocity every layer whose velocity range contains the hit sounds; Cycle and Random pick one; All layers plays them all. A loop only works when One-shot is off. The loop crossfade follows in a later version.',
    zoneHelp: 'Zones apply to a pad of the type Keygroup: each sample gets a key range and a root note and sounds transposed. Without zones the pad plays its layers chromatically around the root of each layer.',
    zone: 'Zone', zoneAdd: 'Add zone', zoneDel: 'Remove zone', zoneNotKey: 'Set the pad to Keygroup (Pad tab) to use zones.', zoneCount: '{0} zone(s).', zoneNone: 'No zones yet: the layers sound chromatically around their root.',
    demoKit: 'Restore demo kit', demoKitDone: 'Demo kit restored in bank A.', clearAll: 'Empty program', clearDone: 'All banks are empty.',
    help: 'Pads: click, tap or use the keyboard (Enter or space; 1234, qwer, asdf, zxcv; arrows move). Dragging a file onto a pad loads it there. Drum pads listen to the notes from First pad (bank A pad 1 up to bank D pad 16); a keygroup listens to the key ranges of its zones. Every output (Output 1 to 16) can be mixed separately; the stereo mix has a soft limiter, the separate outputs do not. Bluetooth output is slow: use a cable or an audio interface for low latency.',
    dropHint: 'No sample: drop a file here or choose Load file', keys: 'keys', empty: 'empty', pad: 'Pad', builtin: 'built in', noSample: 'No sample in this layer.',
    mem: 'Sample memory: {0} of {1} MiB PCM.', voices: 'Voices', master: 'Master',
    memFull: 'Sample memory full: 64 MiB PCM16 at most. Remove samples or choose a shorter file.', noDecode: 'Audio decoding is not available in this environment.',
    fileBig: 'File too large (50 MiB at most).', loading: 'Loading: {0}', decodeFail: 'Could not decode {0}. Is it a valid WAV, FLAC, OGG or MP3?', noAudio: '{0} contains no audio.',
    tooLong: 'Sample longer than 120 seconds. Choose a shorter fragment.', loaded: '{0} sample(s) loaded.', dropped: '{0} sample(s) not loaded (invalid or memory full).',
    e: {
      title: 'Waveform editor', target: 'Edit', layerN: 'Layer {0}', zoneN: 'Zone {0}', needSample: 'Choose or load a sample first (Layers tab) to edit it.',
      canvas: 'Waveform editor. Drag to select, mouse wheel to zoom. Arrow keys move the cursor, Shift+arrows select, plus and minus zoom, space plays.',
      play: 'Play selection', loop: 'Play loop', stop: 'Stop', zoomIn: 'Zoom in', zoomOut: 'Zoom out', zoomAll: 'All', zoomSel: 'To selection', scroll: 'Scroll through the sample',
      snap: 'Snap to zero crossing', chans: 'Channels', chLR: 'L and R stacked', chSum: 'Sum',
      selStart: 'Start', selEnd: 'End', cursor: 'Cursor', frames: 'samples', noSel: 'no selection', sel: 'Selection: {0} samples ({1})', total: 'Whole sample: {0} samples ({1})',
      peaks: 'Peak {0} dB · RMS {1} dB', chL: 'L', chR: 'R', chM: 'M',
      grpEdit: 'Edit', grpClip: 'Clipboard', grpLevel: 'Level and fades', grpSound: 'Sound', grpLoop: 'Start, end and loop', grpUndo: 'History',
      undo: 'Undo', redo: 'Redo', selAll: 'Select all', trim: 'Trim', del: 'Delete', cut: 'Cut', copy: 'Copy', paste: 'Paste', insert: 'Insert',
      silence: 'Insert silence', silenceMs: 'Silence (ms)', mute: 'Silence selection',
      normalize: 'Normalize', gain: 'Gain (dB)', gainDo: 'Apply gain', fadeIn: 'Fade in', fadeOut: 'Fade out', fadeShape: 'Fade shape', fLin: 'Linear', fLog: 'Logarithmic', fExp: 'Exponential',
      reverse: 'Reverse', dc: 'Remove DC offset', mono: 'Make mono', pitch: 'Semitones', pitchDo: 'Change pitch', bits: 'Bits', bitDo: 'Bit reduction', rate: 'Sample rate (Hz)', rateDo: 'Sample-rate reduction',
      toStartEnd: 'Selection as start and end', toLoop: 'Selection as loop', xfade: 'Crossfade (ms)', xfadeDo: 'Apply loop crossfade',
      done: '{0}: done.', undone: 'Undone: {0}.', redone: 'Redone: {0}.', noUndo: 'Nothing to undo.', noRedo: 'Nothing to redo.', gone: 'That place no longer exists; step skipped.',
      needSel: 'Select a part of the sample first.', clipEmpty: 'The clipboard is empty.', emptyResult: 'That would leave nothing of the sample.', silent: 'The part is silent; nothing to normalize.',
      clipped: '{0} sample(s) clipped at 0 dBFS.', monoAlready: 'The sample is already mono.', nothing: 'Nothing to do.', copied: 'Copied: {0} samples.', needLoop: 'Set a loop first (Selection as loop).',
      noRoom: 'There is too little room before the loop start for this crossfade.', needLayer: 'Start and end exist for a layer only, not for a zone.', badValue: 'That number is not possible.',
      kbd: 'Keys: X cut · C copy · V paste · I insert · Delete delete · Ctrl+A select all · space plays (Shift+space loops) · plus and minus zoom · arrows move the cursor (Shift: select) · Ctrl+Z undo · Ctrl+Shift+Z or Ctrl+Y redo. Everything works on a copy; the result becomes a new 16-bit sample.',
      hist: 'Undo: {0} steps, redo: {1}.', marker: 'Move marker',
      mEdit: 'Edit', mChop: 'Chop', mProc: 'Process', mFlat: 'Flatten', modes: 'Kind of edit',
      grpChop: 'Chop: make slices', chopEq: 'Equal parts', chopParts: 'Number of parts', chopThr: 'By threshold', thrDb: 'Threshold (dB below peak)', minMs: 'Minimum time (ms)',
      chopBpm: 'By BPM and bars', bpm: 'BPM', perUnit: 'One slice per', uBar: 'bar (4 beats)', uBeat: 'beat', uEighth: 'eighth', uSixteenth: 'sixteenth', beats: 'Beats in the sample',
      bpmFromBeats: 'BPM from beats', half: '/2', double: '×2', slAdd: 'Marker at cursor', slDel: 'Delete marker', slClear: 'Clear all markers', link: 'End of a slice linked to the start of the next',
      slSelect: 'Slice as selection', slNone: 'No slices yet. Make them with one of the buttons above.', slInfo: 'Slice {0} of {1}: {2} to {3} ({4} samples)', slN: 'Slice {0}', slPlay: 'Play slice {0}',
      chopDone: 'Chop: {0} slices.', slFull: 'More than 128 slices is not possible.', slExists: 'There is already a marker there.', slNoSel: 'Choose a slice first.',
      kbdChop: 'Chop: 1 to 9 plays slice 1 to 9 · left and right arrow previous and next slice · M or Enter puts a marker at the cursor · Delete removes the chosen marker. Drag a number at the bottom of the waveform to move a marker.',
      grpPads: 'Slices to pads', spBank: 'First pad: bank', spPad: 'pad', spMode: 'Existing pads', spReplace: 'Replace', spEmpty: 'Fill empty pads only', spTailOn: 'Add a tail', spTailMs: 'Tail (ms, advice 100)', spGo: 'Slices to pads',
      spDone: '{0} slices put on pads ({1} skipped, {2} did not fit).', spLabel: 'Slices to pads', spNeed: 'Make slices first.',
      grpProc: 'Process: save as sample', procOp: 'Edit', fxFilter: 'Filter', fxDrive: 'Drive', fxCrush: 'Bitcrusher', fxEq: 'Three-band EQ', fxComp: 'Compressor', fxTempo: 'Tempo match',
      fType: 'Type', fCut: 'Cutoff (Hz)', fQ: 'Resonance (Q)', fSlope: 'Slope', fSweep: 'Sweep over the selection', fCutEnd: 'Cutoff at the end (Hz)', sl12: '12 dB per octave', sl24: '24 dB per octave',
      drDb: 'Drive (dB)', drMix: 'Mix (%)', crBits: 'Bits', crHz: 'Sample rate (Hz)', eqLow: 'Low (dB, 200 Hz)', eqMid: 'Mid (dB, 1 kHz)', eqHigh: 'High (dB, 5 kHz)',
      cpThr: 'Threshold (dB)', cpRatio: 'Ratio', cpAtk: 'Attack (ms)', cpRel: 'Release (ms)', cpMk: 'Make-up (dB)', tmTarget: 'Target BPM', tmNow: 'Current tempo: {0} BPM', tmSt: 'Resampling: the pitch changes with it ({0} semitones); real time-stretch follows later.',
      procPrev: 'Listen', procApply: 'Apply', procHelp: 'Works on the selection, or on the whole sample when there is no selection. The result is really saved in the sample (not an effect device) and can be undone.',
      fxNames: { filter: 'Filter', drive: 'Drive', crush: 'Bitcrusher', eq: 'EQ', comp: 'Compressor', tempo: 'Tempo match' },
      grpFlat: 'Flatten and resample', flSrc: 'Source', flSrcPad: 'Chosen pad (all layers, envelope, filter, tune)', flSrcSel: 'Selection of the editor', flNote: 'Note', flVel: 'Velocity', flTail: 'Tail (s)', flHold: 'Note length (s, 0 = automatic)',
      flCh: 'Channels', flStereo: 'Stereo', flMono: 'Mono', flNorm: 'Normalize', flTrim: 'Trim silence at the end', flDest: 'Result', dNew: 'New layer in this pad', dLayer: 'Replace the chosen layer', dReplace: 'Replace this pad (settings back to default)', dOther: 'On another pad',
      flBank: 'Bank', flPadN: 'Pad', flWarn: 'Note: Pad Sampler has no insert effects yet. What you hear comes from the layers, the envelope, the filter, the tune and the level and pan of the pad. Reverb and delay of other devices are not baked in. You can save filter, drive, bitcrusher, EQ and compressor as a sample with Process.',
      flGo: 'Flatten', flPrev: 'Listen', flBusy: 'Rendering…', flNoSound: 'This pad makes no sound at this note and velocity.', flNoRoom: 'All four layers of this pad are in use; choose another destination.', noOffline: 'Offline rendering is not available in this environment.',
      flChanged: 'The sample changed while rendering; nothing was applied.', flName: 'Flatten {0}', flSelName: 'Selection {0}', flDone: 'Flatten: {0} s, {1} Hz.', flOverlong: 'The result would be longer than 120 seconds.',
    },
    bk: {
      intro: 'Load a bank of sounds: from the catalogue (free banks, pinned to a version), from files or a folder on your computer, or from a web address. The licence and credit always show with the bank; what you load appears under Credits and travels with the song. Nothing is fetched from the internet until you press Load yourself.',
      noNet: 'This Patchkamer cannot fetch files from the internet for a device. Download the files from the source (button Open source) and choose them under Local.',
      target: 'Target bank', clearFirst: 'Empty the bank first', licHeader: 'Details for your own files', licHelp: 'Optional: stored with the samples as their origin and shown under Credits. Catalogue banks already have them.', lfAuthor: 'Author', lfLicense: 'Licence (for example CC-BY-4.0)', lfAttr: 'Credit',
      catalog: 'Catalogue', catHelp: 'Only banks whose licence has been read. Every file comes from a pinned version of the source. Green: free to use. Yellow: read the warning.',
      license: 'Licence', author: 'Author', credit: 'Credit', creditReq: 'Credit required', creditNo: 'No credit required (but polite)', size: 'Size', format: 'Format', files: 'files', source: 'Source', pinned: 'Pinned at', checked: 'Checked',
      openSrc: 'Open source', load: 'Load', cancel: 'Cancel', accept: 'I understand this and accept the risk', green: 'Free', yellow: 'Caution', loadBank: 'Load {0}', openOf: 'Open source: {0}',
      local: 'Local', localHelp: 'Choose audio files (WAV, FLAC, OGG, MP3), an SFZ or Decent Sampler program with its samples, or a whole folder. A program with samples goes into the target bank; plain audio goes on the selected pad.', chooseFiles: 'Choose files…', chooseDir: 'Choose folder…',
      urlTitle: 'Web address', urlHelp: 'An https address of an audio file, a .sfz or a .dspreset (the samples are looked up in the same place). The server must allow access from the browser (CORS).', urlLabel: 'Web address (https)', urlGo: 'Load from web address', badUrl: 'Not a valid https address.',
      fsTitle: 'Freesound', fsHelp: 'Search sounds with your own Freesound token (request one at freesound.org). Your token stays in this window only and is never saved in the song. Only CC0 and CC-BY results are shown; a sound loads its preview (lossy ogg or mp3), not the original.', fsToken: 'Your token', fsQuery: 'Search term', fsGo: 'Search', fsNeed: 'Enter a search term and your token.', fsAuth: 'Freesound rejected the token.', fsNone: 'No suitable results.', fsLoad: 'Load into selected layer', fsOf: '{0} by {1}, {2}, {3} s',
      progress: 'Progress', jobLine: '{0}: {1} of {2}', done: 'Done.',
      reportTitle: 'Import report', rOk: 'Imported', rIgn: 'Ignored', rWarn: 'Note', rNone: 'Nothing loaded yet.', rEmpty: '–',
      creditsTitle: 'Credits', creditsHelp: 'The licences and credits of the samples in this program. They travel with the song.', creditsNone: 'No credits: no samples with a licence are loaded.', copy: 'Copy as text', copied: 'Copied.', samplesN: '{0} sample(s)',
      undoLabel: 'Load bank: {0}', busy: 'An import is already running.', errNetwork: 'No connection, or the server does not allow access from the browser.', errHttp: 'The server answered with error {0}.', errSize: 'The file is too large.', errAudio: 'This is not an audio, SFZ or Decent Sampler file.',
      r: {
        regions: '{0} region(s) found, {1} imported.', pads: '{0} drum pad(s) and {1} zone(s) in a keygroup pad.', layers: '{0} layer(s); {1} pad(s) with velocity layers, {2} with alternating takes (cycle), {3} with random choice.',
        roots: 'Root note taken from the file for {0} region(s); tuning for {1}.', loops: '{0} loop(s) imported.', panvol: 'Volume imported for {0} layer(s), pan for {1}.', mute: '{0} pad(s) in a mute group (from group and off_by).', samples: '{0} sample(s) loaded ({1} MiB PCM16).',
      },
      i: { item: '{0}: in {1} region(s)', more: '… and {0} more opcodes', header: 'Section {0} ({1}×)' },
      s: { keyswitch: '{0} region(s) with a key switch (sw_*) skipped', release: '{0} release-triggered region(s) skipped', range: '{0} region(s) with an invalid range skipped', nosample: '{0} region(s) without a sample skipped', pads: '{0} region(s) did not fit in 16 pads', layers: '{0} region(s) did not fit in four layers per pad', zones: '{0} zone(s) did not fit in 16 zones', other: '{0} skipped' },
      w: {
        thin: 'There were more than 16 zones: one dynamic per key range was kept ({0} fewer zone(s)).', mute: 'off_by was imported as a shared mute group: groups that cut each other off share one number, even when the original only worked one way.',
        missing: '{0} file(s) not found or not loadable: {1}', decode: '{0} file(s) could not be decoded: {1}', notFit: '{0} sample(s) did not fit in the sample memory (maximum {1} MiB) and were not loaded.',
        lost: '{0} pad(s) and {1} layer(s)/zone(s) were not created because their samples are missing or there was no free pad.', mp3Loop: 'MP3 is not suited to loops: an mp3 has a start delay and the loop point is not sample accurate ({0}×). Prefer WAV or FLAC.',
        loopFmt: 'Loop positions are only converted for WAV; for {0} sample(s) in another format the loop spans the whole sample.', rootDef: '{0} zone(s) had no root note; 60 (C4) was used.', aborted: 'Cancelled: nothing was changed.',
        badXml: 'This is not a valid Decent Sampler file.', noRegions: 'There is no usable region in this file.', presetBig: 'The program file is too large (maximum 5 MiB).', morePresets: '{0} other program(s) in the selection were not loaded; choose them one at a time.',
        fsLossy: 'A Freesound preview is lossy encoded (not the original).',
      },
    },
    k: {
      level: 'Master volume', baseNote: 'First pad (MIDI)', padVel: 'Pad velocity', 'pad.tune': 'Pitch', 'pad.fine': 'Fine', 'pad.level': 'Level', 'pad.pan': 'Pan', 'pad.poly': 'Polyphony', 'pad.mute': 'Mute group', 'pad.baseNote': 'Note when tapped',
      'env.attack': 'Attack', 'env.decay': 'Decay', 'env.sustain': 'Sustain', 'env.release': 'Release',
      'filt.cutoff': 'Cutoff', 'filt.res': 'Resonance', 'filt.envAmt': 'Envelope amount', 'filt.velAmt': 'Velocity amount',
      'layer.semi': 'Semitones', 'layer.fine': 'Fine', 'layer.level': 'Level', 'layer.pan': 'Pan', 'layer.offset': 'Offset', 'layer.root': 'Root note', 'layer.velLo': 'Velocity from', 'layer.velHi': 'Velocity to',
      'layer.start': 'Start', 'layer.end': 'End', 'layer.gain': 'Gain', 'layer.loopStart': 'Loop start', 'layer.loopEnd': 'Loop end', 'layer.xfade': 'Loop crossfade',
      'zone.root': 'Root note', 'zone.keyLo': 'Key from', 'zone.keyHi': 'Key to', 'zone.velLo': 'Velocity from', 'zone.velHi': 'Velocity to', 'zone.tune': 'Tuning', 'zone.loopStart': 'Loop start', 'zone.loopEnd': 'Loop end',
    },
  },
};
const CSS = `
:host{display:block;color:var(--fg);font:13px system-ui,sans-serif}
.app{container-type:inline-size;display:flex;flex-direction:column;gap:10px;padding:2px}
.row{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.main{display:grid;grid-template-columns:minmax(0,1fr);gap:12px}
@container (min-width:780px){.main{grid-template-columns:minmax(300px,380px) minmax(0,1fr)}}
.left,.right{min-width:0;display:flex;flex-direction:column;gap:8px}
.pads{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px}
.pad{display:flex;flex-direction:column;justify-content:space-between;align-items:flex-start;min-height:66px;padding:6px 7px;border-radius:8px;border:1px solid var(--line);background:var(--card-2,var(--well));color:var(--fg);font:inherit;text-align:left;cursor:pointer;touch-action:none;user-select:none;-webkit-user-select:none;overflow:hidden}
.pad span{max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.pad .pn{font-weight:600;font-size:12px}.pad .pm{font-size:12px}.pad .po{font-size:10px;color:var(--muted)}
.pad.sel{outline:2px solid var(--sel);outline-offset:-1px}
.pad.empty{opacity:.6}
.pad.hit,.pad.down{background:var(--go);color:var(--fg)}
.tabbtn,.btn{font:inherit;color:var(--field-fg,var(--fg));background:var(--field,var(--well));border:1px solid var(--line);border-radius:6px;padding:6px 10px;cursor:pointer;min-height:32px}
.tabbtn.sel,.btn.sel{background:var(--go);border-color:var(--audio)}
.tabbtn.has{border-bottom:3px solid var(--audio)}
.pad:focus-visible,.tabbtn:focus-visible,.btn:focus-visible,.key:focus-visible,.txt:focus-visible{outline:2px solid var(--sel);outline-offset:1px}
.txt{font:inherit;color:var(--field-fg,var(--fg));background:var(--field,var(--well));border:1px solid var(--line);border-radius:6px;padding:6px 8px;min-width:0;flex:1 1 140px;max-width:100%;box-sizing:border-box}
.muted{color:var(--muted)}
.voices{margin-left:auto}
.panel{display:flex;flex-direction:column;gap:8px}
.panel[hidden],.kbwrap[hidden]{display:none}
.panel h4{margin:6px 0 0;font-size:12px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em}
.panel p{margin:0;line-height:1.45}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:8px}
canvas.wave{display:block;width:100%;height:110px;background:var(--well);border:1px solid var(--line);border-radius:6px}
.keys{display:flex;gap:2px;overflow-x:auto;padding-bottom:4px;touch-action:pan-x}
.key{flex:0 0 28px;height:58px;border-radius:0 0 5px 5px;border:1px solid var(--line);background:var(--field,var(--card-2));color:var(--field-fg,var(--fg));font-size:9px;padding:0;touch-action:none;display:flex;align-items:flex-end;justify-content:center}
.key.black{background:var(--fg);color:var(--bg);height:40px}
.key.down{background:var(--go)}
.key.off{opacity:.3}
[data-pk-role="pad"]:not(.pad){width:auto!important;min-width:104px!important;height:34px!important;aspect-ratio:auto!important;padding:0 12px!important;white-space:nowrap;overflow:visible!important}
.status{min-height:1.3em;color:var(--muted)}
.edit{gap:10px}
.edit .row{gap:6px}
.edit .btn,.edit .tabbtn{min-height:40px;min-width:40px}
@media (pointer:coarse){.edit .btn,.edit .tabbtn{min-height:46px;min-width:46px}.edit .num{min-height:42px}}
.edit canvas.ed{display:block;width:100%;height:230px;background:var(--well);border:1px solid var(--line);border-radius:6px;touch-action:none;cursor:text;user-select:none;-webkit-user-select:none}
.edit canvas.ed:focus-visible{outline:2px solid var(--sel);outline-offset:1px}
.edit input[type=range]{width:100%;min-height:28px;accent-color:var(--audio)}
.edit .num{font:inherit;color:var(--field-fg,var(--fg));background:var(--field,var(--well));border:1px solid var(--line);border-radius:6px;padding:6px 6px;width:7em;box-sizing:border-box;min-height:36px}
.edit .num:focus-visible,.edit select:focus-visible{outline:2px solid var(--sel);outline-offset:1px}
.edit label.f{display:flex;align-items:center;gap:6px;color:var(--muted)}
.edit .grp{display:flex;flex-direction:column;gap:6px;padding:8px;border:1px solid var(--line);border-radius:8px}
.edit .grp h4{margin:0}
.edit .btn:disabled{opacity:.4;cursor:default}
.edit .info{color:var(--muted);line-height:1.4}
.edit [hidden]{display:none!important}
.edit .modes{gap:6px}
.edit .slchip{min-width:40px;padding:6px 8px}
@media (pointer:coarse){.edit .slchip{min-width:46px}}
.edit .slchip.sel{background:var(--go);border-color:var(--audio)}
.edit .chips{gap:4px}
.edit .warn{color:var(--muted);line-height:1.4}
.edit select{font:inherit;color:var(--field-fg,var(--fg));background:var(--field,var(--well));border:1px solid var(--line);border-radius:6px;padding:6px;min-height:36px;max-width:100%}
.banks{gap:10px}
.banks *{min-width:0;overflow-wrap:anywhere}
.banks .btn,.banks select,.banks .txt,.banks input[type=url],.banks input[type=password],.banks input[type=search]{min-height:46px;box-sizing:border-box}
.banks .btn.lnk{display:inline-flex;align-items:center;text-decoration:none}
.banks .btn:disabled{opacity:.4;cursor:default}
.banks label.f{display:flex;align-items:center;gap:8px;min-height:46px;color:var(--muted)}
.banks input[type=checkbox]{width:24px;height:24px;flex:none}
.banks select{font:inherit;color:var(--field-fg,var(--fg));background:var(--field,var(--well));border:1px solid var(--line);border-radius:6px;padding:6px}
.banks .bgrp{display:flex;flex-direction:column;gap:6px;padding:8px;border:1px solid var(--line);border-radius:8px}
.banks .bgrp h4{margin:0}
.banks .bgrp .txt{flex:none;width:100%}
.banks .bcard{display:flex;flex-direction:column;gap:6px;padding:8px 10px;border:1px solid var(--line);border-left-width:6px;border-radius:8px}
.banks .bcard.green{border-left-color:#2e9e5b}.banks .bcard.yellow{border-left-color:#d9a400}
.banks .bhead{display:flex;flex-wrap:wrap;gap:6px;align-items:center;justify-content:space-between}
.banks .chip{font-size:11px;padding:2px 8px;border-radius:99px;border:1px solid var(--line)}
.banks .chip.green{border-color:#2e9e5b}.banks .chip.yellow{border-color:#d9a400}
.banks .meta{display:grid;grid-template-columns:max-content minmax(0,1fr);gap:2px 10px;margin:0}
.banks .meta dt{color:var(--muted)}.banks .meta dd{margin:0}
@container (max-width:520px){.banks .meta{grid-template-columns:minmax(0,1fr)}.banks .meta dd{margin-bottom:4px}}
.banks .warnbox{padding:8px;border:1px solid #d9a400;border-radius:8px;line-height:1.4;margin:0}
.banks .report ul,.banks .credits,.banks .fslist{margin:4px 0;padding-left:18px}
.banks .fslist li{display:flex;flex-wrap:wrap;gap:6px;align-items:center;padding:4px 0}
.banks .hide,.banks [hidden]{display:none!important}
.banks progress{width:100%;height:14px}
.banks h5{margin:8px 0 0;font-size:12px}
`;
// ---------- constanten en hulpfuncties ----------
const NBANK = 4, NPAD = 16, NLAYER = 4, MAXZONE = 16;
const MAX_PCM = 64 * 1048576;          // totaal PCM16 in de samplestore
const MAX_SEC = 120;                   // langste sample
const MAX_VOICES = 64;                 // stemmen (laagstemmen) tegelijk
const UNDO_BYTES = 128 * 1048576;     // geheugen voor ongedaan/opnieuw (apart van de 64 MiB van de state)
const UNDO_MAX = 500;                  // hoogstens zoveel stappen
const KILL_S = 0.005;                  // korte afbouw bij mutegroep of stelen
const SAMPLE_RE = /^[A-Za-z0-9_-]{1,48}$/;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const num = (v, d, a, b) => (typeof v === 'number' && Number.isFinite(v) ? clamp(v, a, b) : d);
const int = (v, d, a, b) => (typeof v === 'number' && Number.isFinite(v) ? clamp(Math.round(v), a, b) : d);
const isObj = v => !!v && typeof v === 'object' && !Array.isArray(v);
const str = (v, n) => (typeof v === 'string' ? v.slice(0, n) : '');
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const noteName = n => NOTE_NAMES[n % 12] + (Math.floor(n / 12) - 1);
const BANK_LETTER = ['A', 'B', 'C', 'D'];
const padId = (b, p) => BANK_LETTER[b].toLowerCase() + String(p + 1).padStart(2, '0');

// bereiken van de regelaars: [min, max, stap, beginwaarde]; zowel de UI als de normalisatie gebruiken deze tabel
const RG = {
  padLevel: [-60, 12, 0.5, 0], padPan: [-1, 1, 0.01, 0], tune: [-24, 24, 1, 0], fine: [-100, 100, 1, 0],
  poly: [1, 16, 1, 4], mute: [0, 32, 1, 0], output: [0, 16, 1, 0], baseNoteP: [0, 127, 1, 60],
  attack: [0.0005, 5, 0.0005, 0.001], decay: [0.005, 10, 0.005, 0.2], sustain: [0, 1, 0.01, 1], release: [0.005, 10, 0.005, 0.05],
  cutoff: [20, 20000, 1, 8000], res: [0, 1, 0.01, 0.2], envAmt: [-1, 1, 0.01, 0], velAmt: [-1, 1, 0.01, 0],
  semi: [-48, 48, 1, 0], lfine: [-100, 100, 1, 0], llevel: [0, 1, 0.01, 1], lpan: [-1, 1, 0.01, 0],
  offset: [-500, 500, 1, 0], root: [0, 127, 1, 60], vel: [1, 127, 1, 1], start: [0, 0.9999, 0.0001, 0], end: [0.0001, 1, 0.0001, 1],
  gain: [-24, 24, 0.5, 0], loopS: [0, 0.9999, 0.0001, 0], loopE: [0.0001, 1, 0.0001, 1], xfade: [0, 1, 0.01, 0],
  key: [0, 127, 1, 0], ztune: [-24, 24, 0.01, 0], baseNote: [0, 63, 1, 36], level: [0, 1, 0.01, 0.8], padVel: [1, 127, 1, 100],
};

// ---------- ingebouwde demo-samples (gesynthetiseerd, CC0; staan niet in de state) ----------
// Tonale demo's lussen exact een geheel aantal perioden: TONE_N frames per periode, samplefrequentie zo dat noot 60 klopt.
const TONE_N = 128, TONE_ROOT = 60;
const TONE_RATE = Math.round(440 * Math.pow(2, (TONE_ROOT - 69) / 12) * TONE_N);
const rng = seed => { let s = seed >>> 0; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 2147483648 - 1; }; };
const DEMOS = [];
const DEMO_BY_ID = Object.create(null);
function demo(id, nl, en, rate, frames, root, loop, f) {
  const d = { id, name: { nl, en }, rate, frames, root, loop, f };
  DEMOS.push(d); DEMO_BY_ID[id] = d; return d;
}
const secs = s => Math.round(s * 44100);
function drum(id, nl, en, sec, f) {
  demo(id, nl, en, 44100, secs(sec), null, false, () => {
    const n = secs(sec), a = new Float32Array(n), st = { r: rng(id.length * 7919 + id.charCodeAt(5)), ph: 0, p1: 0, p2: 0 };
    for (let i = 0; i < n; i++) { const v = f(i / 44100, st); a[i] = v > 1 ? 1 : v < -1 ? -1 : v; }
    return a;
  });
}
const TAU = Math.PI * 2;
const hp = (st, x) => { const y = x - st.p1; st.p1 = x; return y; };   // eenvoudig hoogdoorlaat (verschil)
drum('demo:kick', 'Kick', 'Kick', 0.55, (t, s) => { s.ph += TAU * (46 + 120 * Math.exp(-t * 30)) / 44100; return Math.sin(s.ph) * Math.exp(-t * 6.5) * 0.9 + (t < 0.004 ? s.r() * 0.25 * (1 - t / 0.004) : 0); });
drum('demo:kick-soft', 'Kick zacht', 'Kick soft', 0.45, (t, s) => { s.ph += TAU * (42 + 70 * Math.exp(-t * 26)) / 44100; return Math.sin(s.ph) * Math.exp(-t * 8) * 0.5; });
drum('demo:kick-hard', 'Kick hard', 'Kick hard', 0.6, (t, s) => { s.ph += TAU * (48 + 150 * Math.exp(-t * 34)) / 44100; return Math.tanh(1.9 * Math.sin(s.ph)) * Math.exp(-t * 6) * 0.95 + (t < 0.006 ? s.r() * 0.45 * (1 - t / 0.006) : 0); });
drum('demo:snare', 'Snare', 'Snare', 0.3, (t, s) => { s.ph += TAU * 190 / 44100; return Math.sin(s.ph) * Math.exp(-t * 20) * 0.45 + hp(s, s.r()) * Math.exp(-t * 15) * 0.55; });
drum('demo:clap', 'Clap', 'Clap', 0.4, (t, s) => { const e = [0, 0.011, 0.022].reduce((q, o) => q + (t >= o ? Math.exp(-(t - o) * 220) : 0), 0) * 0.6 + (t >= 0.033 ? Math.exp(-(t - 0.033) * 28) : 0); return hp(s, s.r()) * e * 0.7; });
drum('demo:hat-closed', 'Hihat dicht', 'Hat closed', 0.09, (t, s) => hp(s, s.r()) * Math.exp(-t * 70) * 0.6);
drum('demo:hat-open', 'Hihat open', 'Hat open', 0.6, (t, s) => hp(s, s.r()) * Math.exp(-t * 8) * 0.5);
drum('demo:tom-lo', 'Tom laag', 'Tom low', 0.5, (t, s) => { s.ph += TAU * (80 + 60 * Math.exp(-t * 18)) / 44100; return Math.sin(s.ph) * Math.exp(-t * 7) * 0.8; });
drum('demo:tom-mid', 'Tom midden', 'Tom mid', 0.45, (t, s) => { s.ph += TAU * (120 + 80 * Math.exp(-t * 18)) / 44100; return Math.sin(s.ph) * Math.exp(-t * 8) * 0.8; });
drum('demo:tom-hi', 'Tom hoog', 'Tom high', 0.4, (t, s) => { s.ph += TAU * (180 + 100 * Math.exp(-t * 18)) / 44100; return Math.sin(s.ph) * Math.exp(-t * 9) * 0.8; });
drum('demo:rim', 'Rim', 'Rim', 0.07, (t, s) => (Math.sin(TAU * 1700 * t) * 0.5 + hp(s, s.r()) * 0.4) * Math.exp(-t * 90));
drum('demo:cowbell', 'Koebel', 'Cowbell', 0.4, (t) => ((Math.sin(TAU * 540 * t) > 0 ? 1 : -1) + (Math.sin(TAU * 800 * t) > 0 ? 1 : -1)) * 0.2 * Math.exp(-t * 11));
drum('demo:shaker', 'Shaker', 'Shaker', 0.16, (t, s) => hp(s, s.r()) * (t < 0.02 ? t / 0.02 : Math.exp(-(t - 0.02) * 35)) * 0.5);
drum('demo:crash', 'Crash', 'Crash', 1.6, (t, s) => hp(s, s.r()) * Math.exp(-t * 2.6) * 0.5);
drum('demo:perc', 'Conga', 'Conga', 0.35, (t, s) => { s.ph += TAU * (200 + 60 * Math.exp(-t * 35)) / 44100; return Math.sin(s.ph) * Math.exp(-t * 11) * 0.8; });
drum('demo:sub', 'Sub', 'Sub', 1.0, (t, s) => { s.ph += TAU * 42 / 44100; return Math.sin(s.ph) * Math.exp(-t * 2.5) * 0.9; });
function tone(id, nl, en, periods, loop, f) {
  const frames = TONE_N * periods;
  demo(id, nl, en, TONE_RATE, frames, TONE_ROOT, loop, () => {
    const a = new Float32Array(frames);
    for (let i = 0; i < frames; i++) a[i] = f(i % TONE_N, i / TONE_RATE);
    return a;
  });
}
const harm = (ph, k, odd) => { let s = 0; for (let h = 1; h <= k; h++) { if (odd && h % 2 === 0) continue; s += Math.sin(TAU * h * ph / TONE_N) / h; } return s; };
tone('demo:saw', 'Zaagtand', 'Saw', 64, true, i => harm(i, 60, false) * 0.5);
tone('demo:sine', 'Sinus', 'Sine', 64, true, i => Math.sin(TAU * i / TONE_N) * 0.8);
tone('demo:square', 'Blok', 'Square', 64, true, i => harm(i, 61, true) * 0.55);
tone('demo:pluck', 'Pluk', 'Pluck', 235, false, (i, t) => { let s = 0; for (let h = 1; h <= 12; h++) s += Math.sin(TAU * h * i / TONE_N) / h * Math.exp(-t * (2.5 + h * 1.2)); return s * 0.5; });
const DEMO_COUNT = DEMOS.length;

// ---------- hash (53 bit, snel, voor deduplicatie van samples) ----------
function hash53(s) {
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < s.length; i++) { const c = s.charCodeAt(i); h1 = Math.imul(h1 ^ c, 2654435761); h2 = Math.imul(h2 ^ c, 1597334677); }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}
const b64bytes = s => (s.length / 4) * 3 - (s.endsWith('==') ? 2 : s.endsWith('=') ? 1 : 0);
function b64decode(s) {
  const bin = atob(s), n = bin.length, u = new Uint8Array(n);
  for (let i = 0; i < n; i++) u[i] = bin.charCodeAt(i);
  return u;
}
function b64encode(u) {
  let out = '';
  for (let i = 0; i < u.length; i += 0x8000) out += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000));
  return btoa(out);
}

// ---------- editor: bewerkingen op Float32-kopieën (zuiver; werken op lijsten kanalen, geven nieuwe arrays) ----------
const FADE_SHAPES = { lin: t => t, log: t => Math.log10(1 + 9 * t), exp: t => (Math.pow(10, t) - 1) / 9 };   // t 0..1 -> versterking 0..1
const dB2g = db => Math.pow(10, db / 20);
const g2dB = g => (g > 1e-9 ? 20 * Math.log10(g) : -Infinity);
const fDbV = v => (Number.isFinite(v) ? v.toFixed(1) : '−∞');
const sliceCh = (ch, a, b) => ch.map(c => c.slice(a, b));
function joinCh(parts, channels) {   // parts: lijst van kanaallijsten
  let n = 0; for (const p of parts) n += p[0].length;
  return Array.from({ length: channels }, (_, c) => { const o = new Float32Array(n); let k = 0; for (const p of parts) { o.set(p[c], k); k += p[c].length; } return o; });
}
// gevensterde sinc-kern (Blackman), 12 nullen aan elke kant, in een tabel met 256 stappen per eenheid
const SINC_R = 12, SINC_RES = 256;
const SINC_TAB = (() => {
  const n = SINC_R * SINC_RES + 2, t = new Float32Array(n);
  for (let i = 0; i < n; i++) { const x = i / SINC_RES, a = x / SINC_R; if (a >= 1) continue; const sc = x < 1e-9 ? 1 : Math.sin(Math.PI * x) / (Math.PI * x); t[i] = sc * (0.42 + 0.5 * Math.cos(Math.PI * a) + 0.08 * Math.cos(2 * Math.PI * a)); }
  return t;
})();
function resample(src, ratio) {   // ratio = bronstappen per uitvoersample (2^(st/12) voor een toonhoogtestap omhoog); omhoog bandbegrensd
  const n = src.length, m = Math.max(1, Math.floor(n / ratio)), out = new Float32Array(m), fc = ratio > 1 ? 1 / ratio : 1, half = Math.ceil(SINC_R / fc), top = SINC_R * SINC_RES;
  for (let j = 0; j < m; j++) {
    const pos = j * ratio, i0 = Math.floor(pos), fr = pos - i0; let acc = 0, ws = 0;
    for (let k = -half + 1; k <= half; k++) {
      const x = Math.abs((k - fr) * fc) * SINC_RES; if (x >= top) continue;
      const xi = Math.floor(x), w = SINC_TAB[xi] + (SINC_TAB[xi + 1] - SINC_TAB[xi]) * (x - xi);
      let q = i0 + k; q = q < 0 ? 0 : q >= n ? n - 1 : q; acc += src[q] * w; ws += w;
    }
    out[j] = ws > 1e-9 ? acc / ws : 0;
  }
  return out;
}
function convertClip(clip, rate, channels) {   // klembord naar het formaat van het doel-sample
  let ch = clip.ch;
  if (ch.length !== channels) {
    if (channels === 1) { const o = new Float32Array(ch[0].length); for (let i = 0; i < o.length; i++) o[i] = (ch[0][i] + ch[1][i]) / 2; ch = [o]; }
    else ch = [ch[0], ch[0]];
  }
  if (Math.round(clip.rate) !== Math.round(rate)) ch = ch.map(c => resample(c, clip.rate / rate));
  return ch;
}
const rangePeak = (ch, a, b) => { let m = 0; for (const c of ch) for (let i = a; i < b; i++) { const v = Math.abs(c[i]); if (v > m) m = v; } return m; };
const rangeRms = (c, a, b) => { let s = 0; for (let i = a; i < b; i++) s += c[i] * c[i]; return Math.sqrt(s / Math.max(1, b - a)); };
function zeroSnap(ch, f, W) {   // dichtstbijzijnde nuldoorgang van het gemiddelde van de kanalen binnen W samples; anders f zelf
  const n = ch[0].length, v = i => { let s = 0; for (const c of ch) s += c[i]; return s / ch.length; };
  f = clamp(Math.round(f), 0, n); if (n < 2) return f;
  const at = i => clamp(i, 0, n - 1), cross = i => { const a = v(at(i)), b = v(at(i + 1)); return a === 0 || (a < 0) !== (b < 0); };
  for (let d = 0; d <= W; d++) {
    for (const i of d === 0 ? [f] : [f - d, f + d]) {
      if (i < 0 || i >= n - 1 + 1) continue;
      if (cross(i)) return Math.abs(v(at(i))) <= Math.abs(v(at(i + 1))) ? at(i) : at(i + 1);
    }
  }
  return f;
}

// ---------- chop: slices uit een signaal (zuiver) ----------
const MAX_SLICES = 128;
function detectOnsets(ch, rate, thrDb, minMs) {   // aanslagen: de omhullende (pieken per milliseconde) gaat boven een drempel t.o.v. de piek; opnieuw scherp na terugval onder de helft
  const n = ch[0].length, hop = Math.max(1, Math.round(rate * 0.001)), nb = Math.ceil(n / hop), env = new Float32Array(nb); let pk = 0;
  for (let b = 0; b < nb; b++) { let m = 0; const e = Math.min(n, (b + 1) * hop); for (const c of ch) for (let i = b * hop; i < e; i++) { const v = c[i] < 0 ? -c[i] : c[i]; if (v > m) m = v; } env[b] = m; if (m > pk) pk = m; }
  if (pk < 1e-5) return [];
  const T = pk * Math.pow(10, thrDb / 20), minB = Math.max(1, Math.round(minMs)), out = []; let armed = true, last = -1e9;
  for (let b = 0; b < nb; b++) {
    if (!armed) { if (env[b] < T * 0.5) armed = true; continue; }
    if (env[b] >= T && b - last >= minB) {
      let s = b; const lim = Math.max(0, b - 15); while (s > lim && env[s - 1] < env[s] * 0.8) s--;
      let f = s * hop; const lvl = env[b] * 0.15, end = Math.min(n, (b + 1) * hop);
      search: for (let i = f; i < end; i++) for (const c of ch) if (Math.abs(c[i]) >= lvl) { f = i; break search; }
      out.push(f); armed = false; last = b;
    }
  }
  return out;
}
function mapSlices(slices, ends, map, M) {   // posities door een lengteverandering heen; begin en (optioneel) eind blijven bij elkaar
  const pairs = [];
  for (let k = 0; k < slices.length; k++) {
    const s = clamp(Math.round(map(slices[k])), 0, M - 1), e0 = ends && ends[k] > 0 ? clamp(Math.round(map(ends[k])), 0, M) : 0;
    pairs.push([s, e0 > s ? e0 : 0]);
  }
  return pairsOut(pairs);
}
function pairsOut(pairs) {   // sorteren, dubbelen weg, hoogstens MAX_SLICES; ends alleen als er een eigen eind is
  pairs.sort((a, b) => a[0] - b[0]); const o = [];
  for (const p of pairs) if (!o.length || o[o.length - 1][0] !== p[0]) o.push(p);
  const cut = o.slice(0, MAX_SLICES);
  return { slices: cut.map(p => p[0]), ends: cut.some(p => p[1] > 0) ? cut.map(p => p[1]) : [] };
}
function sliceRanges(slices, ends, N) {   // [begin, eind) per slice; het eind van slice n is standaard het begin van n+1
  return slices.map((s, i) => { let e = ends && ends[i] > s ? ends[i] : (i + 1 < slices.length ? slices[i + 1] : N); e = clamp(e, s + 1, N); return [s, e]; });
}

// ---------- process: directe DSP op Float32-kanalen (zuiver) ----------
function biquadCoef(type, f, q, gDb, sr) {   // RBJ-formules; geeft [b0,b1,b2,a1,a2] genormeerd op a0
  const w = 2 * Math.PI * clamp(f, 10, sr * 0.45) / sr, cw = Math.cos(w), sw = Math.sin(w), A = Math.pow(10, gDb / 40);
  let b0, b1, b2, a0, a1, a2; const al = sw / (2 * Math.max(0.05, q)), sq = 2 * Math.sqrt(A) * (sw / 2) * Math.SQRT2;
  if (type === 'lp') { b0 = (1 - cw) / 2; b1 = 1 - cw; b2 = b0; a0 = 1 + al; a1 = -2 * cw; a2 = 1 - al; }
  else if (type === 'hp') { b0 = (1 + cw) / 2; b1 = -(1 + cw); b2 = b0; a0 = 1 + al; a1 = -2 * cw; a2 = 1 - al; }
  else if (type === 'bp') { b0 = al; b1 = 0; b2 = -al; a0 = 1 + al; a1 = -2 * cw; a2 = 1 - al; }
  else if (type === 'peak') { b0 = 1 + al * A; b1 = -2 * cw; b2 = 1 - al * A; a0 = 1 + al / A; a1 = -2 * cw; a2 = 1 - al / A; }
  else if (type === 'ls') { b0 = A * ((A + 1) - (A - 1) * cw + sq); b1 = 2 * A * ((A - 1) - (A + 1) * cw); b2 = A * ((A + 1) - (A - 1) * cw - sq); a0 = (A + 1) + (A - 1) * cw + sq; a1 = -2 * ((A - 1) + (A + 1) * cw); a2 = (A + 1) + (A - 1) * cw - sq; }
  else { b0 = A * ((A + 1) + (A - 1) * cw + sq); b1 = -2 * A * ((A - 1) + (A + 1) * cw); b2 = A * ((A + 1) + (A - 1) * cw - sq); a0 = (A + 1) - (A - 1) * cw + sq; a1 = 2 * ((A - 1) - (A + 1) * cw); a2 = (A + 1) - (A - 1) * cw - sq; }   // 'hs'
  return [b0 / a0, b1 / a0, b2 / a0, a1 / a0, a2 / a0];
}
function biquadRun(x, sr, type, f0, f1, q, gDb, passes) {   // cutoff mag exponentieel van f0 naar f1 lopen (sweep); elke 32 samples nieuwe coëfficiënten
  const n = x.length, out = Float32Array.from(x);
  for (let p = 0; p < passes; p++) {
    let x1 = 0, x2 = 0, y1 = 0, y2 = 0, c = null;
    for (let i = 0; i < n; i++) {
      if (c === null || (f0 !== f1 && (i & 31) === 0)) c = biquadCoef(type, f0 === f1 ? f0 : f0 * Math.pow(f1 / f0, i / Math.max(1, n - 1)), q, gDb, sr);
      const xv = out[i], yv = c[0] * xv + c[1] * x1 + c[2] * x2 - c[3] * y1 - c[4] * y2;
      x2 = x1; x1 = xv; y2 = y1; y1 = Number.isFinite(yv) ? yv : 0; out[i] = y1;
    }
  }
  return out;
}
function compress(seg, sr, p) {   // feed-forward, stereo gekoppeld; omhullende met attack en release, gain reduction volgens drempel en ratio
  const n = seg[0].length, atk = Math.exp(-1 / Math.max(1, p.atk / 1000 * sr)), rel = Math.exp(-1 / Math.max(1, p.rel / 1000 * sr)), out = seg.map(() => new Float32Array(n)); let env = 0;
  for (let i = 0; i < n; i++) {
    let m = 0; for (const c of seg) { const v = Math.abs(c[i]); if (v > m) m = v; }
    env = m > env ? m + atk * (env - m) : m + rel * (env - m);
    const lev = 20 * Math.log10(Math.max(env, 1e-9)), over = lev - p.thr, gr = over > 0 ? over * (1 - 1 / p.ratio) : 0, g = Math.pow(10, (p.makeup - gr) / 20);
    for (let k = 0; k < seg.length; k++) out[k][i] = seg[k][i] * g;
  }
  return out;
}
function crushSeg(x, sr, bits, hz) {   // bitdiepte en sample-rate-reductie (vasthouden), zoals de bewerkingen Bit-reductie en Sample-rate-reductie
  const n = x.length, out = new Float32Array(n), m = Math.pow(2, bits - 1) - 1, f = hz < sr ? sr / hz : 1;
  for (let i = 0; i < n; i++) { const v = x[Math.min(n - 1, Math.round(Math.floor(i / f) * f))]; out[i] = bits >= 16 ? v : Math.round(clamp(v, -1, 1) * m) / m; }
  return out;
}
function procSeg(fx, p, seg, sr) {   // seg: lijst kanalen van de selectie; geeft nieuwe kanalen (zelfde lengte)
  if (fx === 'filter') return seg.map(x => biquadRun(x, sr, p.type, p.f0, p.sweep ? p.f1 : p.f0, p.q, 0, p.slope === 24 ? 2 : 1));
  if (fx === 'drive') { const g = dB2g(p.db), mix = p.mix / 100; return seg.map(x => x.map(v => (1 - mix) * v + mix * Math.tanh(g * v))); }
  if (fx === 'crush') return seg.map(x => crushSeg(x, sr, p.bits, p.hz));
  if (fx === 'eq') return seg.map(x => { let y = x; if (p.low) y = biquadRun(y, sr, 'ls', 200, 200, 0.7071, p.low, 1); if (p.mid) y = biquadRun(y, sr, 'peak', 1000, 1000, 1, p.mid, 1); if (p.high) y = biquadRun(y, sr, 'hs', 5000, 5000, 0.7071, p.high, 1); return y === x ? Float32Array.from(x) : y; });
  if (fx === 'comp') return compress(seg, sr, p);
  return null;
}

// ---------- datamodel: standaard, normalisatie, serialisatie ----------
const endOf = (v, st) => num(v, 1, Math.min(st + 0.0001, 1), 1);
const defLoop = () => ({ on: false, start: 0, end: 1, xfade: 0 });
const defLayer = () => ({ sampleId: '', semi: 0, fine: 0, level: 1, pan: 0, offset: 0, root: null, velLo: 1, velHi: 127, start: 0, end: 1, loop: defLoop(), gain: 0 });
const defZone = () => ({ sampleId: '', root: 60, keyLo: 0, keyHi: 127, velLo: 1, velHi: 127, tune: 0, loop: defLoop() });
const defPad = () => ({
  name: '', mode: 'drum', play: 'velocity', polyphony: 4, muteGroup: 0, output: 0, level: 0, pan: 0, tune: 0, fine: 0,
  env: { shape: 'adsr', attack: 0.001, decay: 0.2, sustain: 1, release: 0.05 },
  filter: { type: 'off', cutoff: 8000, res: 0.2, envAmt: 0, velAmt: 0 },
  oneShot: true, reverse: false, sends: [0, 0], baseNote: 60,
  layers: Array.from({ length: NLAYER }, defLayer), zones: [],
});
const defBank = i => ({ name: 'Bank ' + BANK_LETTER[i], pads: Array.from({ length: NPAD }, defPad) });

function nLoop(s) {
  s = isObj(s) ? s : {}; const st = num(s.start, 0, 0, 0.9999);
  return { on: s.on === true, start: st, end: endOf(s.end, st), xfade: num(s.xfade, 0, 0, 1) };
}
const sidOf = (v, has) => (typeof v === 'string' && has(v) ? v : '');
function nLayer(s, has) {
  s = isObj(s) ? s : {}; const st = num(s.start, 0, 0, 0.9999), vlo = int(s.velLo, 1, 1, 127);
  return {
    sampleId: sidOf(s.sampleId, has), semi: int(s.semi, 0, -48, 48), fine: num(s.fine, 0, -100, 100), level: num(s.level, 1, 0, 1),
    pan: num(s.pan, 0, -1, 1), offset: num(s.offset, 0, -500, 500), root: typeof s.root === 'number' && Number.isFinite(s.root) ? int(s.root, 60, 0, 127) : null,
    velLo: vlo, velHi: int(s.velHi, 127, vlo, 127), start: st, end: endOf(s.end, st), loop: nLoop(s.loop), gain: num(s.gain, 0, -24, 24),
  };
}
function nZone(s, has) {
  const vlo = int(s.velLo, 1, 1, 127), klo = int(s.keyLo, 0, 0, 127);
  return { sampleId: sidOf(s.sampleId, has), root: int(s.root, 60, 0, 127), keyLo: klo, keyHi: int(s.keyHi, 127, klo, 127), velLo: vlo, velHi: int(s.velHi, 127, vlo, 127), tune: num(s.tune, 0, -24, 24), loop: nLoop(s.loop) };
}
function nPad(s, has) {
  if (!isObj(s)) return defPad();
  const mode = s.mode === 'key' ? 'key' : 'drum', e = isObj(s.env) ? s.env : {}, f = isObj(s.filter) ? s.filter : {};
  const L = Array.isArray(s.layers) ? s.layers : [], Z = Array.isArray(s.zones) ? s.zones : [], sd = Array.isArray(s.sends) ? s.sends : [];
  const zones = []; for (const z of Z) { if (zones.length >= MAXZONE) break; if (isObj(z)) zones.push(nZone(z, has)); }
  return {
    name: str(s.name, 40), mode, play: ['velocity', 'cycle', 'random', 'all'].includes(s.play) ? s.play : 'velocity',
    polyphony: int(s.polyphony, 4, 1, 16), muteGroup: int(s.muteGroup, 0, 0, 32), output: int(s.output, 0, 0, 16),
    level: num(s.level, 0, -60, 12), pan: num(s.pan, 0, -1, 1), tune: num(s.tune, 0, -24, 24), fine: num(s.fine, 0, -100, 100),
    env: { shape: e.shape === 'ad' ? 'ad' : 'adsr', attack: num(e.attack, 0.001, RG.attack[0], 5), decay: num(e.decay, 0.2, RG.decay[0], 10), sustain: num(e.sustain, 1, 0, 1), release: num(e.release, 0.05, RG.release[0], 10) },
    filter: { type: ['lp', 'hp', 'bp'].includes(f.type) ? f.type : 'off', cutoff: num(f.cutoff, 8000, 20, 20000), res: num(f.res, 0.2, 0, 1), envAmt: num(f.envAmt, 0, -1, 1), velAmt: num(f.velAmt, 0, -1, 1) },
    oneShot: typeof s.oneShot === 'boolean' ? s.oneShot : mode === 'drum', reverse: s.reverse === true, sends: [num(sd[0], 0, 0, 1), num(sd[1], 0, 0, 1)],
    baseNote: int(s.baseNote, 60, 0, 127), layers: Array.from({ length: NLAYER }, (_, i) => nLayer(L[i], has)), zones,
  };
}
function nBank(s, i, has) {
  s = isObj(s) ? s : {}; const P = Array.isArray(s.pads) ? s.pads : [];
  return { name: str(s.name, 40) || defBank(i).name, pads: Array.from({ length: NPAD }, (_, k) => nPad(P[k], has)) };
}
// serialisatie: altijd nieuwe objecten (nooit een verwijzing naar de levende state), vaste sleutelvolgorde
const serLoop = l => ({ on: l.on, start: l.start, end: l.end, xfade: l.xfade });
const serLayer = l => ({ sampleId: l.sampleId, semi: l.semi, fine: l.fine, level: l.level, pan: l.pan, offset: l.offset, root: l.root, velLo: l.velLo, velHi: l.velHi, start: l.start, end: l.end, loop: serLoop(l.loop), gain: l.gain });
const serZone = z => ({ sampleId: z.sampleId, root: z.root, keyLo: z.keyLo, keyHi: z.keyHi, velLo: z.velLo, velHi: z.velHi, tune: z.tune, loop: serLoop(z.loop) });
const BLANK_LAYER = JSON.stringify(serLayer(defLayer()));
const serPadFull = p => ({
  name: p.name, mode: p.mode, play: p.play, polyphony: p.polyphony, muteGroup: p.muteGroup, output: p.output, level: p.level, pan: p.pan, tune: p.tune, fine: p.fine,
  env: { shape: p.env.shape, attack: p.env.attack, decay: p.env.decay, sustain: p.env.sustain, release: p.env.release },
  filter: { type: p.filter.type, cutoff: p.filter.cutoff, res: p.filter.res, envAmt: p.filter.envAmt, velAmt: p.filter.velAmt },
  oneShot: p.oneShot, reverse: p.reverse, sends: [p.sends[0], p.sends[1]], baseNote: p.baseNote,
  layers: p.layers.map(l => { const o = serLayer(l); return JSON.stringify(o) === BLANK_LAYER ? null : o; }), zones: p.zones.map(serZone),
});
const BLANK_PAD = JSON.stringify(serPadFull(defPad()));
const serPad = p => { const o = serPadFull(p); return JSON.stringify(o) === BLANK_PAD ? null : o; };   // een leeg pad is null

const LICENSE_KEYS = ['source', 'license', 'author', 'attribution'];
function nSample(id, r) {
  if (!SAMPLE_RE.test(id) || !isObj(r) || typeof r.data !== 'string') return null;
  const data = r.data, channels = r.channels === 2 ? 2 : 1, rate = int(r.rate, 44100, 3000, 192000);
  if (data.length === 0 || data.length % 4 !== 0 || data.length > Math.ceil(MAX_PCM * 4 / 3) + 4 || !/^[A-Za-z0-9+/]*={0,2}$/.test(data)) return null;
  const bytes = b64bytes(data);
  if (bytes % (2 * channels) !== 0 || bytes <= 0) return null;
  const frames = bytes / (2 * channels);
  if (frames / rate > MAX_SEC) return null;
  let loop = null;
  if (isObj(r.loop)) { const st = num(r.loop.start, 0, 0, 0.9999); loop = { start: st, end: endOf(r.loop.end, st) }; }
  const pr = [], se = Array.isArray(r.sliceEnds) ? r.sliceEnds : [];
  if (Array.isArray(r.slices)) for (let k = 0; k < r.slices.length; k++) { const v = r.slices[k]; if (pr.length >= MAX_SLICES) break; if (typeof v === 'number' && Number.isFinite(v)) { const s0 = int(v, 0, 0, frames - 1), e0 = typeof se[k] === 'number' && Number.isFinite(se[k]) ? int(se[k], 0, 0, frames) : 0; pr.push([s0, e0 > s0 ? e0 : 0]); } }
  const { slices, ends: sliceEnds } = pairsOut(pr);
  const lic = isObj(r.license) ? r.license : {}, license = {}; for (const k of LICENSE_KEYS) license[k] = str(lic[k], 200);
  return { name: str(r.name, 80), rate, channels, root: typeof r.root === 'number' && Number.isFinite(r.root) ? int(r.root, 60, 0, 127) : null, loop, slices, sliceEnds, license, data, bytes, frames };
}
const serSample = r => ({
  name: r.name, rate: r.rate, channels: r.channels, root: r.root, loop: r.loop ? { start: r.loop.start, end: r.loop.end } : null, slices: r.slices.slice(),
  ...(r.sliceEnds && r.sliceEnds.some(v => v > 0) ? { sliceEnds: r.sliceEnds.slice() } : {}),
  license: { source: r.license.source, license: r.license.license, author: r.license.author, attribution: r.license.attribution }, data: r.data,
});

// het standaardprogramma: bank A met de ingebouwde demo-kit (klinkt meteen)
function defaultBanks() {
  const banks = Array.from({ length: NBANK }, (_, i) => defBank(i));
  const kit = [
    ['Kick', 'demo:kick'], ['Snare', 'demo:snare'], ['Clap', 'demo:clap'], ['Rim', 'demo:rim'],
    ['Hat', 'demo:hat-closed', 1, 1], ['Open hat', 'demo:hat-open', 1, 1], ['Shaker', 'demo:shaker'], ['Crash', 'demo:crash'],
    ['Tom low', 'demo:tom-lo'], ['Tom mid', 'demo:tom-mid'], ['Tom high', 'demo:tom-hi'], ['Conga', 'demo:perc'],
    ['Cowbell', 'demo:cowbell'], ['Sub', 'demo:sub'], ['Kick soft', 'demo:kick-soft'], ['Kick hard', 'demo:kick-hard'],
  ];
  kit.forEach(([name, sid, mg, poly], i) => {
    const p = banks[0].pads[i]; p.name = name; p.layers[0].sampleId = sid; if (mg) p.muteGroup = mg; if (poly) p.polyphony = poly;
  });
  const k = banks[0].pads[0];   // pad 1: drie velocity-lagen
  k.layers[0].sampleId = 'demo:kick-soft'; k.layers[0].velLo = 1; k.layers[0].velHi = 50;
  k.layers[1].sampleId = 'demo:kick'; k.layers[1].velLo = 51; k.layers[1].velHi = 100;
  k.layers[2].sampleId = 'demo:kick-hard'; k.layers[2].velLo = 101; k.layers[2].velHi = 127;
  return banks;
}

// ---------- regelaars van het paneel: [id, bereik van de gekozen pad/laag/zone, pad naar de waarde, sleutel in RG, opmaak, schaal, groep] ----------
const fSt = v => (v > 0 ? '+' : '') + Math.round(v) + ' st';
const fSt2 = v => (v > 0 ? '+' : '') + v.toFixed(2) + ' st';
const fCt = v => (v > 0 ? '+' : '') + Math.round(v) + ' ct';
const fDb = v => (v > 0 ? '+' : '') + v.toFixed(1) + ' dB';
const fPct = v => Math.round(v * 100) + '%';
const fSPct = v => (v > 0 ? '+' : '') + Math.round(v * 100) + '%';
const fPan = v => (Math.abs(v) < 0.005 ? 'C' : (v < 0 ? 'L' : 'R') + Math.round(Math.abs(v) * 100));
const fMs = v => (Math.abs(v) < 10 && v !== Math.round(v) ? v.toFixed(1) : String(Math.round(v))) + ' ms';
const fSec = v => (v < 1 ? Math.round(v * 1000) + ' ms' : v.toFixed(2) + ' s');
const fHz = v => (v >= 1000 ? (v / 1000).toFixed(v >= 10000 ? 1 : 2) + ' kHz' : Math.round(v) + ' Hz');
const fInt = v => String(Math.round(v));
const fMute = v => (Math.round(v) ? String(Math.round(v)) : '–');
const fNote = v => noteName(Math.round(v)) + ' (' + Math.round(v) + ')';
const fFrac = v => (v * 100).toFixed(2) + '%';
const KNOBS = [
  ['level', 'prog', ['level'], 'level', fPct, 'lin', 'master'],
  ['baseNote', 'prog', ['baseNote'], 'baseNote', fNote, 'lin', 'master'],
  ['padVel', 'prog', ['padVel'], 'padVel', fInt, 'lin', 'master'],
  ['pad.tune', 'pad', ['tune'], 'tune', fSt, 'lin', 'pad'],
  ['pad.fine', 'pad', ['fine'], 'fine', fCt, 'lin', 'pad'],
  ['pad.level', 'pad', ['level'], 'padLevel', fDb, 'lin', 'pad'],
  ['pad.pan', 'pad', ['pan'], 'padPan', fPan, 'lin', 'pad'],
  ['pad.poly', 'pad', ['polyphony'], 'poly', fInt, 'lin', 'pad'],
  ['pad.mute', 'pad', ['muteGroup'], 'mute', fMute, 'lin', 'pad'],
  ['pad.baseNote', 'pad', ['baseNote'], 'baseNoteP', fNote, 'lin', 'pad'],
  ['env.attack', 'pad', ['env', 'attack'], 'attack', fSec, 'log', 'env'],
  ['env.decay', 'pad', ['env', 'decay'], 'decay', fSec, 'log', 'env'],
  ['env.sustain', 'pad', ['env', 'sustain'], 'sustain', fPct, 'lin', 'env'],
  ['env.release', 'pad', ['env', 'release'], 'release', fSec, 'log', 'env'],
  ['filt.cutoff', 'pad', ['filter', 'cutoff'], 'cutoff', fHz, 'log', 'filter'],
  ['filt.res', 'pad', ['filter', 'res'], 'res', fPct, 'lin', 'filter'],
  ['filt.envAmt', 'pad', ['filter', 'envAmt'], 'envAmt', fSPct, 'lin', 'filter'],
  ['filt.velAmt', 'pad', ['filter', 'velAmt'], 'velAmt', fSPct, 'lin', 'filter'],
  ['layer.semi', 'layer', ['semi'], 'semi', fSt, 'lin', 'layer'],
  ['layer.fine', 'layer', ['fine'], 'lfine', fCt, 'lin', 'layer'],
  ['layer.level', 'layer', ['level'], 'llevel', fPct, 'lin', 'layer'],
  ['layer.pan', 'layer', ['pan'], 'lpan', fPan, 'lin', 'layer'],
  ['layer.offset', 'layer', ['offset'], 'offset', fMs, 'lin', 'layer'],
  ['layer.root', 'layer', ['root'], 'root', fNote, 'lin', 'layer'],
  ['layer.velLo', 'layer', ['velLo'], 'vel', fInt, 'lin', 'layer'],
  ['layer.velHi', 'layer', ['velHi'], 'vel', fInt, 'lin', 'layer'],
  ['layer.start', 'layer', ['start'], 'start', fFrac, 'lin', 'layer'],
  ['layer.end', 'layer', ['end'], 'end', fFrac, 'lin', 'layer'],
  ['layer.gain', 'layer', ['gain'], 'gain', fDb, 'lin', 'layer'],
  ['layer.loopStart', 'layer', ['loop', 'start'], 'loopS', fFrac, 'lin', 'loop'],
  ['layer.loopEnd', 'layer', ['loop', 'end'], 'loopE', fFrac, 'lin', 'loop'],
  ['layer.xfade', 'layer', ['loop', 'xfade'], 'xfade', fPct, 'lin', 'loop'],
  ['zone.root', 'zone', ['root'], 'root', fNote, 'lin', 'zone'],
  ['zone.keyLo', 'zone', ['keyLo'], 'key', fNote, 'lin', 'zone'],
  ['zone.keyHi', 'zone', ['keyHi'], 'key', fNote, 'lin', 'zone'],
  ['zone.velLo', 'zone', ['velLo'], 'vel', fInt, 'lin', 'zone'],
  ['zone.velHi', 'zone', ['velHi'], 'vel', fInt, 'lin', 'zone'],
  ['zone.tune', 'zone', ['tune'], 'ztune', fSt2, 'lin', 'zone'],
  ['zone.loopStart', 'zone', ['loop', 'start'], 'loopS', fFrac, 'lin', 'loop'],
  ['zone.loopEnd', 'zone', ['loop', 'end'], 'loopE', fFrac, 'lin', 'loop'],
];
// continue regelaars die bewust niet in params() staan: de regelaars van het paneel werken op de gekozen pad, laag of zone
const UI_IDS = KNOBS.map(k => k[0]).filter(id => id !== 'level');
const KEYBOARD_ROWS = ['1234', 'qwer', 'asdf', 'zxcv'];
const PIANO_KEYS = 'awsedftgyhujkolp';   // a = C, w = C#, s = D, ...

// terugval voor een host zonder host.frame (contract §12b)
const tekenLus = (host, inst, cb, fps) => {
  if (host && typeof host.frame === 'function') return host.frame(inst, cb, fps);
  let raf = 0, last = 0, stop = false;
  const f = t => { if (stop) return; raf = requestAnimationFrame(f); if (document.hidden || t - last < 1000 / fps - 2) return; last = t; cb(t); };
  raf = requestAnimationFrame(f); return () => { stop = true; cancelAnimationFrame(raf); };
};
// zachte begrenzer voor de stereomix: tot 0,8 ongewijzigd, daarboven zacht naar 1,0 (geen vertraging)
const CEILING = (() => { const n = 2049, c = new Float32Array(n); for (let i = 0; i < n; i++) { const x = (i / (n - 1)) * 2 - 1, a = Math.abs(x); c[i] = a < 0.8 ? x : Math.sign(x) * (0.8 + 0.2 * Math.tanh((a - 0.8) / 0.2)); } return c; })();
const AUDIO_OUTS = Array.from({ length: 16 }, (_, i) => ({ id: 'out' + (i + 1), name: 'Uitgang ' + (i + 1) }));
const EN_PORTS = { mix: 'Stereo mix', notes: 'Notes / pad triggers' }; AUDIO_OUTS.forEach((o, i) => { EN_PORTS[o.id] = 'Output ' + (i + 1); });

const CATALOG = [
  {"id":"vcsl-conga","name":{"nl":"VCSL conga, quinto en tumba","en":"VCSL conga, quinto and tumba"},"desc":{"nl":"Zes pads met open slagen en slaps in 2 tot 4 velocity-lagen.","en":"Six pads with open tones and slaps in 2 to 4 velocity layers."},"status":"green","kind":"pads","license":{"spdx":"CC0-1.0","text":"CC0 1.0 Universal (publiek domein)","url":"https://creativecommons.org/publicdomain/zero/1.0/","checked":{"nl":"LICENSE op de vastgepinde commit gelezen (CC0 1.0 Universal) en README: \"no royalties, no credit, no special terms\"","en":"LICENSE read at the pinned commit (CC0 1.0 Universal) and README: \"no royalties, no credit, no special terms\""}},"author":"Versilian Studios LLC","credit":false,"attribution":"Versilian Community Sample Library (VCSL), Versilian Studios LLC, CC0 1.0","src":{"name":"Versilian Community Sample Library","home":"https://github.com/sgossner/VCSL","pin":"c1ea7bcc3c7309650ab0da9d15c9cd1fbc4a4c7e","base":"https://cdn.jsdelivr.net/gh/sgossner/VCSL@c1ea7bcc3c7309650ab0da9d15c9cd1fbc4a4c7e/"},"format":"wav","pads":[{"name":"Conga open","layers":[{"f":"Membranophones/Struck Membranophones/Conga/Conga_HitN_v1_rr1_Sum.wav","lo":1,"hi":42},{"f":"Membranophones/Struck Membranophones/Conga/Conga_HitN_v2_rr1_Sum.wav","lo":43,"hi":85},{"f":"Membranophones/Struck Membranophones/Conga/Conga_HitN_v3_rr1_Sum.wav","lo":86,"hi":127}]},{"name":"Conga slap","layers":[{"f":"Membranophones/Struck Membranophones/Conga/Conga_HitFM_v1_rr1_Sum.wav","lo":1,"hi":64},{"f":"Membranophones/Struck Membranophones/Conga/Conga_HitFM_v2_rr1_Sum.wav","lo":65,"hi":127}]},{"name":"Quinto open","layers":[{"f":"Membranophones/Struck Membranophones/Conga/Quinto_HitN_v1_rr1_Sum.wav","lo":1,"hi":42},{"f":"Membranophones/Struck Membranophones/Conga/Quinto_HitN_v2_rr1_Sum.wav","lo":43,"hi":85},{"f":"Membranophones/Struck Membranophones/Conga/Quinto_HitN_v3_rr1_Sum.wav","lo":86,"hi":127}]},{"name":"Quinto slap","layers":[{"f":"Membranophones/Struck Membranophones/Conga/Quinto_HitFM1_v1_rr1_Sum.wav","lo":1,"hi":64},{"f":"Membranophones/Struck Membranophones/Conga/Quinto_HitFM1_v2_rr1_Sum.wav","lo":65,"hi":127}]},{"name":"Tumba open","layers":[{"f":"Membranophones/Struck Membranophones/Conga/Tumba_HitN_v1_rr1_Sum.wav","lo":1,"hi":32},{"f":"Membranophones/Struck Membranophones/Conga/Tumba_HitN_v2_rr1_Sum.wav","lo":33,"hi":64},{"f":"Membranophones/Struck Membranophones/Conga/Tumba_HitN_v3_rr1_Sum.wav","lo":65,"hi":95},{"f":"Membranophones/Struck Membranophones/Conga/Tumba_HitN_v4_rr1_Sum.wav","lo":96,"hi":127}]},{"name":"Tumba slap","layers":[{"f":"Membranophones/Struck Membranophones/Conga/Tumba_HitFM_v2_rr1_Sum.wav","lo":1,"hi":42},{"f":"Membranophones/Struck Membranophones/Conga/Tumba_HitFM_v3_rr1_Sum.wav","lo":43,"hi":85},{"f":"Membranophones/Struck Membranophones/Conga/Tumba_HitFM_v4_rr1_Sum.wav","lo":86,"hi":127}]}],"bytes":2484680,"n":17},
  {"id":"vcsl-darbuka","name":{"nl":"VCSL darbuka","en":"VCSL darbuka"},"desc":{"nl":"Vijf darbuka-slagen, elk met twee dynamieken en twee afwisselende opnamen (om de beurt).","en":"Five darbuka hits, each with two dynamics and two alternating takes (cycle)."},"status":"green","kind":"pads","license":{"spdx":"CC0-1.0","text":"CC0 1.0 Universal (publiek domein)","url":"https://creativecommons.org/publicdomain/zero/1.0/","checked":{"nl":"LICENSE op de vastgepinde commit gelezen (CC0 1.0 Universal) en README: \"no royalties, no credit, no special terms\"","en":"LICENSE read at the pinned commit (CC0 1.0 Universal) and README: \"no royalties, no credit, no special terms\""}},"author":"Versilian Studios LLC","credit":false,"attribution":"Versilian Community Sample Library (VCSL), Versilian Studios LLC, CC0 1.0","src":{"name":"Versilian Community Sample Library","home":"https://github.com/sgossner/VCSL","pin":"c1ea7bcc3c7309650ab0da9d15c9cd1fbc4a4c7e","base":"https://cdn.jsdelivr.net/gh/sgossner/VCSL@c1ea7bcc3c7309650ab0da9d15c9cd1fbc4a4c7e/"},"format":"wav","pads":[{"name":"Darbuka 1","play":"cycle","layers":[{"f":"Membranophones/Struck Membranophones/Darbuka/Darbuka_1_hit_vl1_rr1.wav","lo":1,"hi":63},{"f":"Membranophones/Struck Membranophones/Darbuka/Darbuka_1_hit_vl1_rr2.wav","lo":1,"hi":63},{"f":"Membranophones/Struck Membranophones/Darbuka/Darbuka_1_hit_vl2_rr1.wav","lo":64,"hi":127},{"f":"Membranophones/Struck Membranophones/Darbuka/Darbuka_1_hit_vl2_rr2.wav","lo":64,"hi":127}]},{"name":"Darbuka 2","play":"cycle","layers":[{"f":"Membranophones/Struck Membranophones/Darbuka/Darbuka_2_hit_vl1_rr1.wav","lo":1,"hi":63},{"f":"Membranophones/Struck Membranophones/Darbuka/Darbuka_2_hit_vl1_rr2.wav","lo":1,"hi":63},{"f":"Membranophones/Struck Membranophones/Darbuka/Darbuka_2_hit_vl2_rr1.wav","lo":64,"hi":127},{"f":"Membranophones/Struck Membranophones/Darbuka/Darbuka_2_hit_vl2_rr2.wav","lo":64,"hi":127}]},{"name":"Darbuka 3","play":"cycle","layers":[{"f":"Membranophones/Struck Membranophones/Darbuka/Darbuka_3_hit_vl1_rr1.wav","lo":1,"hi":63},{"f":"Membranophones/Struck Membranophones/Darbuka/Darbuka_3_hit_vl1_rr2.wav","lo":1,"hi":63},{"f":"Membranophones/Struck Membranophones/Darbuka/Darbuka_3_hit_vl2_rr1.wav","lo":64,"hi":127},{"f":"Membranophones/Struck Membranophones/Darbuka/Darbuka_3_hit_vl2_rr2.wav","lo":64,"hi":127}]},{"name":"Darbuka 4","play":"cycle","layers":[{"f":"Membranophones/Struck Membranophones/Darbuka/Darbuka_4_hit_vl1_rr1.wav","lo":1,"hi":63},{"f":"Membranophones/Struck Membranophones/Darbuka/Darbuka_4_hit_vl1_rr2.wav","lo":1,"hi":63},{"f":"Membranophones/Struck Membranophones/Darbuka/Darbuka_4_hit_vl2_rr1.wav","lo":64,"hi":127},{"f":"Membranophones/Struck Membranophones/Darbuka/Darbuka_4_hit_vl2_rr2.wav","lo":64,"hi":127}]},{"name":"Darbuka 5","play":"cycle","layers":[{"f":"Membranophones/Struck Membranophones/Darbuka/Darbuka_5_hit_vl1_rr1.wav","lo":1,"hi":63},{"f":"Membranophones/Struck Membranophones/Darbuka/Darbuka_5_hit_vl1_rr2.wav","lo":1,"hi":63},{"f":"Membranophones/Struck Membranophones/Darbuka/Darbuka_5_hit_vl2_rr1.wav","lo":64,"hi":127},{"f":"Membranophones/Struck Membranophones/Darbuka/Darbuka_5_hit_vl2_rr2.wav","lo":64,"hi":127}]}],"bytes":2512276,"n":20},
  {"id":"vcsl-cowbells","name":{"nl":"VCSL koebellen","en":"VCSL cowbells"},"desc":{"nl":"Twee koebellen in vijf spelwijzen (open, gedempt, normaal, dubbel) met twee of drie dynamieken.","en":"Two cowbells in several articulations (hit, muted, normal, double) with two or three dynamics."},"status":"green","kind":"pads","license":{"spdx":"CC0-1.0","text":"CC0 1.0 Universal (publiek domein)","url":"https://creativecommons.org/publicdomain/zero/1.0/","checked":{"nl":"LICENSE op de vastgepinde commit gelezen (CC0 1.0 Universal) en README: \"no royalties, no credit, no special terms\"","en":"LICENSE read at the pinned commit (CC0 1.0 Universal) and README: \"no royalties, no credit, no special terms\""}},"author":"Versilian Studios LLC","credit":false,"attribution":"Versilian Community Sample Library (VCSL), Versilian Studios LLC, CC0 1.0","src":{"name":"Versilian Community Sample Library","home":"https://github.com/sgossner/VCSL","pin":"c1ea7bcc3c7309650ab0da9d15c9cd1fbc4a4c7e","base":"https://cdn.jsdelivr.net/gh/sgossner/VCSL@c1ea7bcc3c7309650ab0da9d15c9cd1fbc4a4c7e/"},"format":"wav","pads":[{"name":"Cowbell 1 hit","layers":[{"f":"Idiophones/Struck Idiophones/Cowbells/Cowbell1_Hit_v2_rr1_Mid.wav","lo":1,"hi":42},{"f":"Idiophones/Struck Idiophones/Cowbells/Cowbell1_Hit_v3_rr1_Mid.wav","lo":43,"hi":85},{"f":"Idiophones/Struck Idiophones/Cowbells/Cowbell1_Hit_v4_rr1_Mid.wav","lo":86,"hi":127}]},{"name":"Cowbell 1 muted","layers":[{"f":"Idiophones/Struck Idiophones/Cowbells/Cowbell1_Muted_v2_rr1_Mid.wav","lo":1,"hi":64},{"f":"Idiophones/Struck Idiophones/Cowbells/Cowbell1_Muted_v3_rr1_Mid.wav","lo":65,"hi":127}]},{"name":"Cowbell 1 normal","layers":[{"f":"Idiophones/Struck Idiophones/Cowbells/Cowbell1_Normal_v2_rr1_Mid.wav","lo":1,"hi":64},{"f":"Idiophones/Struck Idiophones/Cowbells/Cowbell1_Normal_v3_rr1_Mid.wav","lo":65,"hi":127}]},{"name":"Cowbell 2 double","layers":[{"f":"Idiophones/Struck Idiophones/Cowbells/Cowbell2_Double_v2_rr1_Mid.wav","lo":1,"hi":64},{"f":"Idiophones/Struck Idiophones/Cowbells/Cowbell2_Double_v3_rr1_Mid.wav","lo":65,"hi":127}]},{"name":"Cowbell 2 muted","layers":[{"f":"Idiophones/Struck Idiophones/Cowbells/Cowbell2_Muted_v2_rr1_Mid.wav","lo":1,"hi":64},{"f":"Idiophones/Struck Idiophones/Cowbells/Cowbell2_Muted_v3_rr1_Mid.wav","lo":65,"hi":127}]},{"name":"Cowbell 2 normal","layers":[{"f":"Idiophones/Struck Idiophones/Cowbells/Cowbell2_Normal_v2_rr1_Mid.wav","lo":1,"hi":64},{"f":"Idiophones/Struck Idiophones/Cowbells/Cowbell2_Normal_v3_rr1_Mid.wav","lo":65,"hi":127}]}],"bytes":2737192,"n":13},
  {"id":"vcsl-glockenspiel","name":{"nl":"VCSL glockenspiel (toetsen)","en":"VCSL glockenspiel (keys)"},"desc":{"nl":"Eén keygroup-pad: vijf grondtonen in drie dynamieken (15 zones), speelbaar over het hele toetsenbord.","en":"One keygroup pad: five root notes in three dynamics (15 zones), playable across the keyboard."},"status":"green","kind":"keys","license":{"spdx":"CC0-1.0","text":"CC0 1.0 Universal (publiek domein)","url":"https://creativecommons.org/publicdomain/zero/1.0/","checked":{"nl":"LICENSE op de vastgepinde commit gelezen (CC0 1.0 Universal) en README: \"no royalties, no credit, no special terms\"","en":"LICENSE read at the pinned commit (CC0 1.0 Universal) and README: \"no royalties, no credit, no special terms\""}},"author":"Versilian Studios LLC","credit":false,"attribution":"Versilian Community Sample Library (VCSL), Versilian Studios LLC, CC0 1.0","src":{"name":"Versilian Community Sample Library","home":"https://github.com/sgossner/VCSL","pin":"c1ea7bcc3c7309650ab0da9d15c9cd1fbc4a4c7e","base":"https://cdn.jsdelivr.net/gh/sgossner/VCSL@c1ea7bcc3c7309650ab0da9d15c9cd1fbc4a4c7e/"},"format":"wav","bytes":14828754,"keys":{"name":"Glockenspiel","zones":[{"f":"Idiophones/Struck Idiophones/Glockenspiel/glock_soft_G4_01.wav","root":67,"lo":0,"hi":69,"vlo":1,"vhi":50},{"f":"Idiophones/Struck Idiophones/Glockenspiel/glock_soft_C5_02.wav","root":72,"lo":70,"hi":75,"vlo":1,"vhi":50},{"f":"Idiophones/Struck Idiophones/Glockenspiel/glock_soft_G5_01.wav","root":79,"lo":76,"hi":81,"vlo":1,"vhi":50},{"f":"Idiophones/Struck Idiophones/Glockenspiel/glock_soft_C6_01.wav","root":84,"lo":82,"hi":90,"vlo":1,"vhi":50},{"f":"Idiophones/Struck Idiophones/Glockenspiel/glock_soft_C7_03.wav","root":96,"lo":91,"hi":127,"vlo":1,"vhi":50},{"f":"Idiophones/Struck Idiophones/Glockenspiel/glock_medium_G4_01.wav","root":67,"lo":0,"hi":69,"vlo":51,"vhi":95},{"f":"Idiophones/Struck Idiophones/Glockenspiel/glock_medium_C5_01.wav","root":72,"lo":70,"hi":75,"vlo":51,"vhi":95},{"f":"Idiophones/Struck Idiophones/Glockenspiel/glock_medium_G5_01.wav","root":79,"lo":76,"hi":81,"vlo":51,"vhi":95},{"f":"Idiophones/Struck Idiophones/Glockenspiel/glock_medium_C6_01.wav","root":84,"lo":82,"hi":90,"vlo":51,"vhi":95},{"f":"Idiophones/Struck Idiophones/Glockenspiel/glock_medium_C7_01.wav","root":96,"lo":91,"hi":127,"vlo":51,"vhi":95},{"f":"Idiophones/Struck Idiophones/Glockenspiel/glock_loud_G4_01.wav","root":67,"lo":0,"hi":69,"vlo":96,"vhi":127},{"f":"Idiophones/Struck Idiophones/Glockenspiel/glock_loud_C5_01.wav","root":72,"lo":70,"hi":75,"vlo":96,"vhi":127},{"f":"Idiophones/Struck Idiophones/Glockenspiel/glock_loud_G5_01.wav","root":79,"lo":76,"hi":81,"vlo":96,"vhi":127},{"f":"Idiophones/Struck Idiophones/Glockenspiel/glock_loud_C6_01.wav","root":84,"lo":82,"hi":90,"vlo":96,"vhi":127},{"f":"Idiophones/Struck Idiophones/Glockenspiel/glock_loud_C7_01.wav","root":96,"lo":91,"hi":127,"vlo":96,"vhi":127}]},"n":15},
  {"id":"virtuosity-drums-mid","name":{"nl":"Virtuosity Drums, uitgekleed (midden-microfoon)","en":"Virtuosity Drums, cut down (mid mic)"},"desc":{"nl":"Jazzdrumstel uit een clubopname: kick, snare, gesloten en open hi-hat, twee toms en een crash. Eén microfoon, 4 velocity-lagen per pad (een uitsnede uit de 1,49 GB-bank).","en":"Jazz drum kit from a live-style recording: kick, snare, closed and open hi-hat, two toms and a crash. One mic, 4 velocity layers per pad (a cut-down of the 1.49 GB bank)."},"status":"green","kind":"pads","license":{"spdx":"CC0-1.0","text":"CC0 1.0 Universal (publiek domein)","url":"https://creativecommons.org/publicdomain/zero/1.0/","checked":{"nl":"LICENSE op de vastgepinde commit gelezen (CC0 1.0 Universal)","en":"LICENSE read at the pinned commit (CC0 1.0 Universal)"}},"author":"Versilian Studios; drummer Austin McMahon","credit":false,"attribution":"Virtuosity Drums, Versilian Studios, drums performed by Austin McMahon, CC0 1.0","src":{"name":"Virtuosity Drums","home":"https://github.com/sfzinstruments/virtuosity_drums","pin":"9f04cf9a734527edfbb0a4eee1f674e45bbf71bc","base":"https://cdn.jsdelivr.net/gh/sfzinstruments/virtuosity_drums@9f04cf9a734527edfbb0a4eee1f674e45bbf71bc/"},"format":"flac","pads":[{"name":"Kick","layers":[{"f":"Samples/mid/kick/mid_kick_snoff_vl1_rr1.flac","lo":1,"hi":32},{"f":"Samples/mid/kick/mid_kick_snoff_vl2_rr1.flac","lo":33,"hi":64},{"f":"Samples/mid/kick/mid_kick_snoff_vl3_rr1.flac","lo":65,"hi":95},{"f":"Samples/mid/kick/mid_kick_snoff_vl4_rr1.flac","lo":96,"hi":127}]},{"name":"Snare","layers":[{"f":"Samples/mid/snare/mid_snare_center_vl4.flac","lo":1,"hi":32},{"f":"Samples/mid/snare/mid_snare_center_vl12.flac","lo":33,"hi":64},{"f":"Samples/mid/snare/mid_snare_center_vl22.flac","lo":65,"hi":95},{"f":"Samples/mid/snare/mid_snare_center_vl32.flac","lo":96,"hi":127}]},{"name":"Hat closed","layers":[{"f":"Samples/mid/hh/mid_hh_closed_vl1_rr1.flac","lo":1,"hi":32},{"f":"Samples/mid/hh/mid_hh_closed_vl2_rr1.flac","lo":33,"hi":64},{"f":"Samples/mid/hh/mid_hh_closed_vl3_rr1.flac","lo":65,"hi":95},{"f":"Samples/mid/hh/mid_hh_closed_vl4_rr1.flac","lo":96,"hi":127}],"mute":1},{"name":"Hat open","layers":[{"f":"Samples/mid/hh/mid_hh_open_vl1_rr1.flac","lo":1,"hi":32},{"f":"Samples/mid/hh/mid_hh_open_vl2_rr1.flac","lo":33,"hi":64},{"f":"Samples/mid/hh/mid_hh_open_vl3_rr1.flac","lo":65,"hi":95},{"f":"Samples/mid/hh/mid_hh_open_vl4_rr1.flac","lo":96,"hi":127}],"mute":1},{"name":"Tom high","layers":[{"f":"Samples/mid/htom/mid_htom_center_vl4.flac","lo":1,"hi":32},{"f":"Samples/mid/htom/mid_htom_center_vl8.flac","lo":33,"hi":64},{"f":"Samples/mid/htom/mid_htom_center_vl12.flac","lo":65,"hi":95},{"f":"Samples/mid/htom/mid_htom_center_vl16.flac","lo":96,"hi":127}]},{"name":"Tom low","layers":[{"f":"Samples/mid/ltom/mid_ltom_center_vl2.flac","lo":1,"hi":32},{"f":"Samples/mid/ltom/mid_ltom_center_vl6.flac","lo":33,"hi":64},{"f":"Samples/mid/ltom/mid_ltom_center_vl10.flac","lo":65,"hi":95},{"f":"Samples/mid/ltom/mid_ltom_center_vl14.flac","lo":96,"hi":127}]},{"name":"Crash","layers":[{"f":"Samples/mid/crash/mid_crash_crash_vl1_rr1.flac","lo":1,"hi":127}]}],"bytes":11248641,"n":25},
  {"id":"cowsynth-lonely-pad","name":{"nl":"Cowsynth Lonely Pad (SFZ)","en":"Cowsynth Lonely Pad (SFZ)"},"desc":{"nl":"Een SFZ-programma van een gesamplede doedelzak als synth-oscillator: acht zones over het toetsenbord. Laadt via de SFZ-importer.","en":"An SFZ program of sampled bagpipes used as a synth oscillator: eight zones across the keyboard. Loads through the SFZ importer."},"status":"green","kind":"preset","license":{"spdx":"CC0-1.0","text":"CC0 1.0 Universal (publiek domein)","url":"https://creativecommons.org/publicdomain/zero/1.0/","checked":{"nl":"LICENSE op de vastgepinde commit gelezen (CC0 1.0 Universal); de readme zegt \"Royalty-free for all commercial and non-commercial use\"","en":"LICENSE read at the pinned commit (CC0 1.0 Universal); the readme says \"Royalty-free for all commercial and non-commercial use\""}},"author":"Karoryfer Lecolds","credit":false,"attribution":"Cowsynth by Karoryfer Samples (Karoryfer Lecolds), CC0 1.0","src":{"name":"Karoryfer Cowsynth","home":"https://github.com/sfzinstruments/karoryfer.cowsynth","pin":"5a5b5afc2dabbe54cf9d75ab64711ce01862b42c","base":"https://cdn.jsdelivr.net/gh/sfzinstruments/karoryfer.cowsynth@5a5b5afc2dabbe54cf9d75ab64711ce01862b42c/"},"format":"sfz","preset":{"f":"cowsynth_lonely_pad.sfz","fmt":"sfz"},"bytes":6618947,"n":9},
  {"id":"drumcomputer-fischer","name":{"nl":"Klassieke ritmemachine (Fischer)","en":"Classic drum machine (Fischer)"},"desc":{"nl":"16 geluiden van een klassieke ritmemachine, gesampled door Michael Fischer (Technopolis), 1994.","en":"16 sounds from a classic drum machine, sampled by Michael Fischer (Technopolis), 1994."},"status":"yellow","warn":{"nl":"Let op: de CC0-verklaring is door een derde (TidalCycles) op de bestanden gezet, niet door de maker; de rechten van de fabrikant op de klank zelf zijn een grijs gebied. Alleen laden als je dat risico accepteert.","en":"Note: the CC0 statement was put on the files by a third party (TidalCycles), not by the author; the manufacturer's rights in the sound itself are a grey area. Only load if you accept that risk."},"kind":"pads","license":{"spdx":"CC0-1.0","text":"CC0 1.0 (verklaring door een derde)","url":"https://creativecommons.org/publicdomain/zero/1.0/","checked":{"nl":"LICENSE (CC0 1.0) en _soundmeta/*.json (\"license\": \"cc0\", \"(c) Michael Fischer / Technopolis\") op de vastgepinde commit gelezen","en":"LICENSE (CC0 1.0) and _soundmeta/*.json (\"license\": \"cc0\", \"(c) Michael Fischer / Technopolis\") read at the pinned commit"}},"author":"Michael Fischer / Technopolis (CC0-verklaring door TidalCycles)","credit":false,"attribution":"Drum machine samples (c) Michael Fischer / Technopolis, via TidalCycles (Fischer sample set), CC0 1.0","src":{"name":"TidalCycles (Fischer sample set)","home":"https://github.com/tidalcycles/sounds-tr808-fischer","pin":"85fbecf1bec32553395625ea659e2a56dfd7c0e1","base":"https://cdn.jsdelivr.net/gh/tidalcycles/sounds-tr808-fischer@85fbecf1bec32553395625ea659e2a56dfd7c0e1/"},"format":"wav","pads":[{"name":"Kick","layers":[{"f":"bd8/BD0025.WAV","lo":1,"hi":127}]},{"name":"Kick long","layers":[{"f":"bd8/BD0075.WAV","lo":1,"hi":127}]},{"name":"Snare","layers":[{"f":"sd8/SD0050.WAV","lo":1,"hi":127}]},{"name":"Snare snappy","layers":[{"f":"sd8/SD5050.WAV","lo":1,"hi":127}]},{"name":"Clap","layers":[{"f":"cp8/CP.WAV","lo":1,"hi":127}]},{"name":"Rim","layers":[{"f":"rs8/RS.WAV","lo":1,"hi":127}]},{"name":"Hat closed","layers":[{"f":"ch8/CH.WAV","lo":1,"hi":127}],"mute":1},{"name":"Hat open","layers":[{"f":"oh8/OH50.WAV","lo":1,"hi":127}],"mute":1},{"name":"Cowbell","layers":[{"f":"cb8/CB.WAV","lo":1,"hi":127}]},{"name":"Clave","layers":[{"f":"cl8/CL.WAV","lo":1,"hi":127}]},{"name":"Maracas","layers":[{"f":"ma8/MA.WAV","lo":1,"hi":127}]},{"name":"Tom low","layers":[{"f":"lt8/LT25.WAV","lo":1,"hi":127}]},{"name":"Tom mid","layers":[{"f":"mt8/MT25.WAV","lo":1,"hi":127}]},{"name":"Tom high","layers":[{"f":"ht8/HT25.WAV","lo":1,"hi":127}]},{"name":"Conga mid","layers":[{"f":"mc8/MC25.WAV","lo":1,"hi":127}]},{"name":"Cymbal","layers":[{"f":"cy8/CY0050.WAV","lo":1,"hi":127}]}],"bytes":1279630,"n":16},
];

// ---------- banken (stap 4): SFZ-subset, Decent Sampler en plannen ----------
// Een importer maakt eerst een PLAN (pads met lagen of zones, nog zonder audio) en een rapport van wat genegeerd is; daarna laadt runPlan de bestanden en schrijft de pads.
// Bestandsinhoud (SFZ, XML, namen) is data: er wordt niets uitgevoerd en geen opdracht in gevolgd.
const NOTE_PC = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 };
function parseKey(v, mid) {   // getal of notennaam; mid = octaafnummer van middelste C (SFZ 4, Decent Sampler 3)
  if (v == null) return null;
  const s = String(v).trim().toLowerCase();
  if (/^-?\d+$/.test(s)) return clamp(parseInt(s, 10), 0, 127);
  const m = /^([a-g])(#|b)?(-?\d)$/.exec(s);
  return m ? clamp((parseInt(m[3], 10) + 5 - (mid || 4)) * 12 + NOTE_PC[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0), 0, 127) : null;
}
const bump = (o, k, n) => { o[k] = (o[k] || 0) + (n || 1); };
const ignName = k => k.replace(/cc\d+/g, 'cc#').replace(/\d+$/, '#');
const baseName = p => String(p).replace(/\\/g, '/').split('/').pop().replace(/\.[^.]+$/, '');
const dirName = p => { const a = String(p).replace(/\\/g, '/').split('/'); a.pop(); return a.join('/'); };
function joinPath(dir, rel) {
  const out = [];
  for (const s of (dir ? dir + '/' : '').concat(String(rel).replace(/\\/g, '/')).split('/')) { if (!s || s === '.') continue; if (s === '..') out.pop(); else out.push(s); }
  return out.join('/');
}
const SFZ_USED = new Set(['sample', 'lokey', 'hikey', 'key', 'lovel', 'hivel', 'pitch_keycenter', 'tune', 'transpose', 'loop_mode', 'loopmode', 'loop_start', 'loopstart', 'loop_end', 'loopend',
  'group', 'off_by', 'offby', 'seq_length', 'seq_position', 'volume', 'pan', 'trigger', 'default_path']);
function sfzOps(seg) {
  const ops = Object.create(null), re = /([A-Za-z_][A-Za-z0-9_$]*)=/g, hit = [];
  let m; while ((m = re.exec(seg))) hit.push([m[1], m.index, re.lastIndex]);
  hit.forEach(([k, , e], i) => { ops[k.toLowerCase()] = seg.slice(e, i + 1 < hit.length ? hit[i + 1][1] : seg.length).trim(); });
  return ops;
}
const numOp = v => { const n = parseFloat(v); return Number.isFinite(n) ? n : null; };
function parseSfz(text) {
  const out = { regions: [], ignored: Object.create(null), headers: Object.create(null), skipped: Object.create(null), found: 0 };
  let t = String(text).replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/[^\n]*/g, '$1');
  const vars = {};
  t = t.replace(/^[ \t]*#define[ \t]+(\$\w+)[ \t]+(.+)$/gm, (_, k, v) => { vars[k] = v.trim(); return ''; });
  t = t.replace(/^[ \t]*#include[^\n]*$/gm, () => { bump(out.headers, '#include'); return ''; });
  for (const k of Object.keys(vars).sort((a, b) => b.length - a.length)) t = t.split(k).join(vars[k]);
  const hre = /<(\w+)>/g, marks = []; let m;
  while ((m = hre.exec(t))) marks.push([m[1].toLowerCase(), m.index, hre.lastIndex]);
  let glob = {}, master = {}, group = {}, defPath = '';
  marks.forEach(([name, , e], i) => {
    const ops = sfzOps(t.slice(e, i + 1 < marks.length ? marks[i + 1][1] : t.length));
    if (name === 'control') { if (ops.default_path) defPath = ops.default_path.replace(/\\/g, '/'); for (const k of Object.keys(ops)) if (k !== 'default_path') bump(out.ignored, ignName(k)); return; }
    if (name === 'global') { glob = ops; master = {}; group = {}; return; }
    if (name === 'master') { master = ops; group = {}; return; }
    if (name === 'group') { group = ops; return; }
    if (name !== 'region') { bump(out.headers, '<' + name + '>'); return; }
    out.found++;
    const o = Object.assign({}, glob, master, group, ops);
    if (!o.sample) { bump(out.skipped, 'nosample'); return; }
    for (const k of Object.keys(o)) if (!SFZ_USED.has(k) && !/^sw_(last|previous|down|up)$/.test(k)) bump(out.ignored, ignName(k));
    if (o.sw_last != null || o.sw_previous != null || o.sw_down != null || o.sw_up != null) { bump(out.skipped, 'keyswitch'); return; }
    const trig = String(o.trigger || 'attack').toLowerCase();
    if (trig === 'release' || trig === 'release_key') { bump(out.skipped, 'release'); return; }
    let lo = 0, hi = 127, root = null;
    if (o.key != null) { const k = parseKey(o.key, 4); if (k != null) { lo = hi = root = k; } }
    if (o.lokey != null) { const k = parseKey(o.lokey, 4); if (k != null) lo = k; }
    if (o.hikey != null) { const k = parseKey(o.hikey, 4); if (k != null) hi = k; }
    if (o.pitch_keycenter != null) { const k = parseKey(o.pitch_keycenter, 4); if (k != null) root = k; }
    const vlo = clamp(Math.round(numOp(o.lovel) == null ? 1 : numOp(o.lovel)), 1, 127), vhi = clamp(Math.round(numOp(o.hivel) == null ? 127 : numOp(o.hivel)), 1, 127);
    if (hi < lo || vhi < vlo) { bump(out.skipped, 'range'); return; }
    const lm = String(o.loop_mode || o.loopmode || '').toLowerCase();
    out.regions.push({
      path: (defPath + o.sample).replace(/\\/g, '/'), lo, hi, vlo, vhi, root, tune: (numOp(o.transpose) || 0) + (numOp(o.tune) || 0) / 100,
      vol: numOp(o.volume) || 0, pan: clamp((numOp(o.pan) || 0) / 100, -1, 1),
      loop: lm === 'loop_continuous' || lm === 'loop_sustain' ? 'on' : lm === 'no_loop' ? 'off' : lm === 'one_shot' ? 'one' : 'auto',
      ls: numOp(o.loop_start != null ? o.loop_start : o.loopstart), le: numOp(o.loop_end != null ? o.loop_end : o.loopend),
      group: int(numOp(o.group) == null ? 0 : numOp(o.group), 0, 0, 100000), offBy: int(numOp(o.off_by != null ? o.off_by : o.offby) == null ? 0 : numOp(o.off_by != null ? o.off_by : o.offby), 0, 0, 100000),
      seqLen: int(numOp(o.seq_length) == null ? 1 : numOp(o.seq_length), 1, 1, 64), seqPos: int(numOp(o.seq_position) == null ? 1 : numOp(o.seq_position), 1, 1, 64), random: false,
    });
  });
  return out;
}
function parseDs(text) {   // Decent Sampler (.dspreset): XML
  const out = { regions: [], ignored: Object.create(null), headers: Object.create(null), skipped: Object.create(null), found: 0, env: null, error: '' };
  let doc;
  try { doc = new DOMParser().parseFromString(String(text), 'application/xml'); } catch (e) { out.error = 'xml'; return out; }
  const rootEl = doc && doc.documentElement;
  if (!rootEl || rootEl.nodeName !== 'DecentSampler' || doc.getElementsByTagName('parsererror').length) { out.error = 'xml'; return out; }
  const kids = Array.from(rootEl.children);
  for (const k of kids) if (k.nodeName !== 'groups') bump(out.headers, '<' + k.nodeName + '>');
  const GA = new Set(['loNote', 'hiNote', 'rootNote', 'loVel', 'hiVel', 'tuning', 'pan', 'loopEnabled', 'loopStart', 'loopEnd', 'seqMode', 'seqLength', 'trigger', 'attack', 'decay', 'sustain', 'release']);
  const SA = new Set(['path', 'loNote', 'hiNote', 'rootNote', 'loVel', 'hiVel', 'tuning', 'pan', 'loopEnabled', 'loopStart', 'loopEnd', 'seqPosition', 'trigger']);
  const gnum = (a, n) => { const v = a[n]; return v == null || v === '' ? null : numOp(v); };
  for (const gs of kids.filter(k => k.nodeName === 'groups')) {
    const gsa = {}; for (const k of Array.from(gs.attributes)) { if (['attack', 'decay', 'sustain', 'release'].includes(k.name)) gsa[k.name] = k.value; else bump(out.ignored, 'groups@' + k.name); }
    for (const g of Array.from(gs.children).filter(k => k.nodeName === 'group')) {
      const ga = Object.assign({}, gsa); for (const a of Array.from(g.attributes)) { ga[a.name] = a.value; if (!GA.has(a.name)) bump(out.ignored, 'group@' + a.name); }
      for (const c of Array.from(g.children)) if (c.nodeName !== 'sample') bump(out.headers, '<' + c.nodeName + '>');
      if (!out.env && ['attack', 'decay', 'sustain', 'release'].some(n => ga[n] != null)) out.env = { attack: numOp(ga.attack), decay: numOp(ga.decay), sustain: numOp(ga.sustain), release: numOp(ga.release) };
      for (const s of Array.from(g.children).filter(k => k.nodeName === 'sample')) {
        out.found++;
        const sa = Object.assign({}, ga); for (const a of Array.from(s.attributes)) { sa[a.name] = a.value; if (!SA.has(a.name)) bump(out.ignored, 'sample@' + a.name); }
        if (!sa.path) { bump(out.skipped, 'nosample'); continue; }
        const trig = String(sa.trigger || 'attack').toLowerCase();
        if (trig === 'release') { bump(out.skipped, 'release'); continue; }
        const key = (n, d) => { const k2 = parseKey(sa[n], 3); return k2 == null ? d : k2; };
        let lo = key('loNote', 0), hi = key('hiNote', 127); const root = sa.rootNote != null ? parseKey(sa.rootNote, 3) : null;
        const vlo = clamp(Math.round(gnum(sa, 'loVel') == null ? 1 : gnum(sa, 'loVel')), 1, 127), vhi = clamp(Math.round(gnum(sa, 'hiVel') == null ? 127 : gnum(sa, 'hiVel')), 1, 127);
        if (hi < lo || vhi < vlo) { bump(out.skipped, 'range'); continue; }
        const mode = String(sa.seqMode || 'always').toLowerCase();
        out.regions.push({
          path: String(sa.path).replace(/\\/g, '/'), lo, hi, vlo, vhi, root, tune: gnum(sa, 'tuning') || 0, vol: 0, pan: clamp((gnum(sa, 'pan') || 0) / 100, -1, 1),
          loop: String(sa.loopEnabled).toLowerCase() === 'true' ? 'on' : 'auto', ls: gnum(sa, 'loopStart'), le: gnum(sa, 'loopEnd'), group: 0, offBy: 0,
          seqLen: mode === 'round_robin' ? int(gnum(sa, 'seqLength') == null ? 2 : gnum(sa, 'seqLength'), 2, 1, 64) : 1, seqPos: int(gnum(sa, 'seqPosition') == null ? 1 : gnum(sa, 'seqPosition'), 1, 1, 64), random: mode === 'random',
        });
      }
    }
  }
  return out;
}
function muteIds(regs) {   // off_by: groepen die elkaar afkappen worden een gedeelde mutegroep (1..32)
  const par = new Map(), find = x => { while (par.get(x) !== x) { par.set(x, par.get(par.get(x))); x = par.get(x); } return x; };
  const add = x => { if (!par.has(x)) par.set(x, x); };
  let any = false;
  for (const r of regs) if (r.group > 0 && r.offBy > 0) { add(r.group); add(r.offBy); par.set(find(r.group), find(r.offBy)); any = true; }
  const ids = new Map(); let n = 0;
  return { any, of(g) { if (!(g > 0) || !par.has(g)) return 0; const f = find(g); if (!ids.has(f)) ids.set(f, ++n); return Math.min(32, ids.get(f)); } };
}
// plan = { pads: [{ name, mode, play, mute, one, env, layers: [{ f, lo, hi, semi, fine, gain, pan, loop }], zones: [{ f, root, lo, hi, vlo, vhi, tune, loop }] }], stats, skipped }
// loop = { m: 'on' | 'off' | 'one' | 'auto', ls, le } (posities in samples van het bronbestand)
function planRegions(regs, preset, env) {
  const st = { regions: regs.length, drumPads: 0, zones: 0, layers: 0, vel: 0, rr: 0, rand: 0, mute: 0, loops: 0, roots: 0, tuned: 0, pans: 0, vols: 0, thinned: 0 }, sk = Object.create(null);
  const mutes = muteIds(regs), notes = [];
  const mkLoop = r => ({ m: r.loop, ls: r.ls, le: r.le });
  const single = regs.filter(r => r.lo === r.hi), ranged = regs.filter(r => r.lo !== r.hi), keys = [...new Set(single.map(r => r.lo))].sort((a, b) => a - b);
  const manyKeys = keys.length > NPAD && single.every(r => r.root == null || r.root === r.lo);
  const asDrums = manyKeys ? [] : single, asZones = manyKeys ? regs.slice() : ranged;
  const pads = [];
  const dkeys = [...new Set(asDrums.map(r => r.lo))].sort((a, b) => a - b);
  for (const k of dkeys) {
    if (pads.length >= NPAD) { bump(sk, 'pads', asDrums.filter(r => r.lo === k).length); continue; }
    let rs = asDrums.filter(r => r.lo === k).sort((a, b) => a.vlo - b.vlo || a.seqPos - b.seqPos);
    if (rs.length > NLAYER) { bump(sk, 'layers', rs.length - NLAYER); rs = rs.slice(0, NLAYER); }
    const seq = rs.some(r => r.seqLen > 1), rnd = rs.some(r => r.random);
    let overlap = false; for (let i = 0; i < rs.length; i++) for (let j = i + 1; j < rs.length; j++) if (rs[i].vlo <= rs[j].vhi && rs[j].vlo <= rs[i].vhi) overlap = true;
    const play = rnd ? 'random' : seq ? 'cycle' : overlap ? 'random' : 'velocity';
    if (play === 'cycle') st.rr++; else if (play === 'random') st.rand++; else if (rs.length > 1) st.vel++;
    const mute = mutes.of(rs[0].group); if (mute) st.mute++;
    const looped = rs.some(r => r.loop === 'on');
    pads.push({
      name: baseName(rs[0].path).slice(0, 40), mode: 'drum', play, mute, one: !looped, env: env || null,
      layers: rs.map(r => { if (r.root != null) st.roots++; if (r.tune) st.tuned++; if (r.pan) st.pans++; if (r.vol) st.vols++; if (r.loop === 'on') st.loops++; const sm = Math.round(clamp(r.tune, -48, 48)); return { f: r.path, lo: r.vlo, hi: r.vhi, semi: sm, fine: clamp(Math.round((r.tune - sm) * 100), -100, 100), gain: clamp(r.vol, -24, 24), pan: r.pan, loop: mkLoop(r) }; }),
      zones: [],
    });
    st.drumPads++; st.layers += rs.length;
  }
  if (asZones.length) {
    let zs = asZones.slice().sort((a, b) => a.lo - b.lo || a.vlo - b.vlo);
    if (zs.length > MAXZONE) {   // eerst één dynamiek per toetsbereik houden (de dichtst bij velocity 100)
      const by = new Map(); for (const r of zs) { const k = r.lo + '-' + r.hi; const c = by.get(k); if (!c || Math.abs((r.vlo + r.vhi) / 2 - 100) < Math.abs((c.vlo + c.vhi) / 2 - 100)) by.set(k, r); }
      const thin = [...by.values()].map(r => Object.assign({}, r, { vlo: 1, vhi: 127 })).sort((a, b) => a.lo - b.lo);
      if (thin.length < zs.length) { st.thinned = zs.length - thin.length; notes.push('thin'); zs = thin; }
    }
    if (zs.length > MAXZONE) { bump(sk, 'zones', zs.length - MAXZONE); zs = zs.slice(0, MAXZONE); }
    if (pads.length >= NPAD) { bump(sk, 'pads', zs.length); } else {
      if (new Set(zs.map(r => r.seqPos)).size > 1 && zs.some(r => r.seqLen > 1)) { st.rr++; }
      zs.forEach(r => { if (r.root != null) st.roots++; if (r.tune) st.tuned++; if (r.loop === 'on') st.loops++; if (r.vol) st.vols++; if (r.pan) st.pans++; });
      st.zones = zs.length;
      pads.push({
        name: String(preset || 'Keygroup').slice(0, 40), mode: 'key', play: 'velocity', mute: mutes.of(zs[0].group), one: false, env: env || null, layers: [],
        zones: zs.map(r => ({ f: r.path, root: r.root, lo: r.lo, hi: r.hi, vlo: r.vlo, vhi: r.vhi, tune: clamp(r.tune, -24, 24), loop: mkLoop(r) })),
      });
    }
  }
  if (mutes.any) notes.push('mute');
  return { pads, stats: st, skipped: sk, notes };
}
function planCatalog(b) {
  const lp = { m: 'auto', ls: null, le: null };
  if (b.kind === 'keys') {
    const k = b.keys;
    return { pads: [{ name: k.name, mode: 'key', play: 'velocity', mute: 0, one: false, env: null, layers: [], zones: k.zones.map(z => ({ f: z.f, root: z.root, lo: z.lo, hi: z.hi, vlo: z.vlo, vhi: z.vhi, tune: 0, loop: lp })) }],
      stats: { regions: k.zones.length, drumPads: 0, zones: k.zones.length, layers: 0, vel: 0, rr: 0, rand: 0, mute: 0, loops: 0, roots: k.zones.length, tuned: 0, pans: 0, vols: 0, thinned: 0 }, skipped: Object.create(null), notes: [] };
  }
  const pads = b.pads.slice(0, NPAD).map(p => ({ name: p.name, mode: 'drum', play: p.play || 'velocity', mute: p.mute || 0, one: true, env: null, layers: p.layers.map(l => ({ f: l.f, lo: l.lo, hi: l.hi, semi: 0, fine: 0, gain: 0, pan: 0, loop: lp })), zones: [] }));
  let n = 0; for (const p of pads) n += p.layers.length;
  return { pads, stats: { regions: n, drumPads: pads.length, zones: 0, layers: n, vel: pads.filter(p => p.layers.length > 1 && p.play === 'velocity').length, rr: pads.filter(p => p.play === 'cycle').length, rand: 0, mute: pads.filter(p => p.mute).length, loops: 0, roots: 0, tuned: 0, pans: 0, vols: 0, thinned: 0 }, skipped: Object.create(null), notes: [] };
}
const isMp3 = ab => { const u = new Uint8Array(ab, 0, Math.min(4, ab.byteLength)); return (u[0] === 0x49 && u[1] === 0x44 && u[2] === 0x33) || (u[0] === 0xff && (u[1] & 0xe0) === 0xe0); };
function wavHead(ab) {   // samplefrequentie en aantal frames van een WAV, of null
  try {
    const dv = new DataView(ab); if (dv.byteLength < 44 || dv.getUint32(0, false) !== 0x52494646 || dv.getUint32(8, false) !== 0x57415645) return null;
    let pos = 12, block = 0, rate = 0, len = 0;
    while (pos + 8 <= dv.byteLength) {
      const id = dv.getUint32(pos, false), l = dv.getUint32(pos + 4, true), body = pos + 8;
      if (id === 0x666d7420 && body + 16 <= dv.byteLength) { rate = dv.getUint32(body + 4, true); block = dv.getUint16(body + 12, true); } else if (id === 0x64617461) len = Math.min(l, dv.byteLength - body);
      pos = body + l + (l & 1);
    }
    return block > 0 && rate > 0 ? { rate, frames: len / block } : null;
  } catch (e) { return null; }
}
const encPath = p => String(p).split('/').map(encodeURIComponent).join('/');
const licOfUrl = u => {   // Freesound: licentie-adres naar SPDX; alleen CC0 en CC-BY zijn toegestaan
  const s = String(u || '');
  if (/creativecommons\.org\/publicdomain\/zero\/1\.0/.test(s)) return 'CC0-1.0';
  const m = /creativecommons\.org\/licenses\/by\/(\d\.\d)\/?$/.exec(s);
  return m ? 'CC-BY-' + m[1] : '';
};
function creditsOf(store) {   // vermeldingen volgen de samples die er echt in zitten (nooit een lijst die kan liegen)
  const m = new Map();
  for (const r of store.values()) {
    const L = r.license; if (!L || !(L.license || L.attribution || L.author || L.source)) continue;
    const k = [L.source, L.license, L.author, L.attribution].join('\u0001'), c = m.get(k) || { source: L.source, license: L.license, author: L.author, attribution: L.attribution, samples: 0 };
    c.samples++; m.set(k, c);
  }
  return [...m.values()].sort((a, b) => (a.attribution + a.source < b.attribution + b.source ? -1 : a.attribution + a.source > b.attribution + b.source ? 1 : 0));
}

export default {
  id: 'nl.patchkamer.padsampler',
  name: 'Pad Sampler',
  version: '1.3.0',
  kind: 'instrument',
  category: 'synth',
  ui: { width: 700, minWidth: 340 },
  modExclude: UI_IDS,
  ports: {
    audioIn: [],
    audioOut: [{ id: 'mix', name: 'Stereomix' }, ...AUDIO_OUTS],
    eventIn: [{ id: 'notes', name: 'Noten / pad-trigs' }],
    eventOut: [],
    modIn: [{ id: 'mod', name: 'Mod' }],
    modOut: [],
  },
  i18n: { en: { ports: EN_PORTS } },

  create(ctx, host) {
    const lang = host.lang === 'nl' ? 'nl' : 'en', T = TXT[lang];
    let dead = false, token = 0, root = null, ui = null, warmTimer = 0, stopFrame = null, notesSig = '', selfRef = null;
    const prog = { bank: 0, pad: 0, layer: 0, baseNote: 36, level: 0.8, padVel: 100, banks: defaultBanks() };
    const store = new Map();                 // sampleId -> record (PCM16 base64)
    const bufs = new Map();                  // sampleId -> { fwd, rev, peaks }
    const nodes = new Set();                 // alle AudioNodes die dit apparaat verbindt (voor destroy)
    const own = n => { nodes.add(n); return n; };
    let mod = Object.create(null);

    // ---------- uitgangen ----------
    const master = own(ctx.createGain()), shaper = own(ctx.createWaveShaper()), mixOut = own(ctx.createGain());
    shaper.curve = CEILING; try { shaper.oversample = host.audio && host.audio.oversample === '4x' ? '4x' : host.audio && host.audio.oversample === '2x' ? '2x' : 'none'; } catch (e) { /* oud */ }
    master.connect(shaper); shaper.connect(mixOut); master.gain.value = prog.level;
    const outputs = { mix: mixOut }, outNodes = [];
    for (let i = 0; i < 16; i++) { const g = own(ctx.createGain()); outputs['out' + (i + 1)] = g; outNodes.push(g); }

    // ---------- pad-bussen (lui gemaakt) ----------
    const prt = new Array(NBANK * NPAD).fill(null), rr = new Int32Array(NBANK * NPAD), lastPick = new Int8Array(NBANK * NPAD).fill(-1);
    const hitAt = new Float64Array(NBANK * NPAD);
    const padOf = i => prog.banks[i >> 4].pads[i & 15];
    const mkey = (i, k) => padId(i >> 4, i & 15) + '.' + k;
    const effTune = i => clamp(padOf(i).tune + (mod[mkey(i, 'tune')] || 0) * 48, -24, 24);
    const effCut = i => clamp(padOf(i).filter.cutoff * Math.pow(1000, mod[mkey(i, 'cutoff')] || 0), 20, Math.min(20000, ctx.sampleRate * 0.45));
    const effLevel = i => Math.pow(10, clamp(padOf(i).level + (mod[mkey(i, 'level')] || 0) * 72, -60, 12) / 20);
    function route(i) {
      const r = prt[i]; if (!r) return;
      const o = padOf(i).output, dest = o > 0 ? outNodes[o - 1] : master;
      if (r.dest !== dest) { if (r.dest) { try { r.pan.disconnect(r.dest); } catch (e) { /* al los */ } } r.pan.connect(dest); r.dest = dest; }
    }
    function padRt(i) {
      let r = prt[i];
      if (!r) {
        r = prt[i] = { gain: own(ctx.createGain()), pan: own(ctx.createStereoPanner()), dest: null };
        r.gain.gain.value = effLevel(i); r.pan.pan.value = padOf(i).pan; r.gain.connect(r.pan); route(i);
      }
      return r;
    }
    function applyMaster() { master.gain.setTargetAtTime(clamp(prog.level + (mod.level || 0), 0, 1), ctx.currentTime, 0.01); }

    // ---------- samples: buffers, peaks ----------
    function sampleInfo(id) {
      if (typeof id !== 'string' || !id) return null;
      const d = DEMO_BY_ID[id];
      if (d) return { id, name: d.name[lang] || d.name.en, rate: d.rate, channels: 1, frames: d.frames, root: d.root, loop: d.loop ? { start: 0, end: 1 } : null, demo: true, bytes: 0 };
      const r = store.get(id); return r ? { id, name: r.name, rate: r.rate, channels: r.channels, frames: r.frames, root: r.root, loop: r.loop, demo: false, bytes: r.bytes, license: r.license } : null;
    }
    function build(id) {
      try {
        const d = DEMO_BY_ID[id];
        if (d) { const b = ctx.createBuffer(1, d.frames, d.rate), a = b.getChannelData(0), src = d.f(), n = Math.min(a.length, src.length); for (let i = 0; i < n; i++) a[i] = src[i]; return b; }
        const r = store.get(id); if (!r) return null;
        const u = b64decode(r.data), dv = new DataView(u.buffer, u.byteOffset, u.byteLength), b = ctx.createBuffer(r.channels, r.frames, r.rate);
        for (let ch = 0; ch < r.channels; ch++) { const a = b.getChannelData(ch), n = Math.min(a.length, r.frames); for (let i = 0; i < n; i++) a[i] = dv.getInt16((i * r.channels + ch) * 2, true) / 32768; }
        return b;
      } catch (e) { return null; }
    }
    function reversed(b) {
      const r = ctx.createBuffer(b.numberOfChannels, b.length, b.sampleRate);
      for (let ch = 0; ch < b.numberOfChannels; ch++) { const s = b.getChannelData(ch), a = r.getChannelData(ch), n = Math.min(a.length, s.length); for (let i = 0; i < n; i++) a[i] = s[n - 1 - i]; }
      return r;
    }
    function bufferFor(id, rev) {
      let c = bufs.get(id); if (!c) { c = { fwd: null, rev: null, peaks: null }; bufs.set(id, c); }
      if (!c.fwd) c.fwd = build(id);
      if (!c.fwd) return null;
      if (!rev) return c.fwd;
      if (!c.rev) c.rev = reversed(c.fwd);
      return c.rev;
    }
    function peaksOf(id, cols) {
      const b = bufferFor(id, false); if (!b) return null;
      const c = bufs.get(id); if (c.peaks && c.peaks.length === cols * 2) return c.peaks;
      const a = b.getChannelData(0), n = Math.min(a.length, b.length), pk = new Float32Array(cols * 2);
      for (let k = 0; k < cols; k++) {
        const s = Math.floor(k * n / cols), e = Math.max(s + 1, Math.floor((k + 1) * n / cols)), step = Math.max(1, Math.floor((e - s) / 48));
        let lo = 0, hi = 0; for (let i = s; i < e && i < n; i += step) { const v = a[i]; if (v < lo) lo = v; if (v > hi) hi = v; }
        pk[k * 2] = lo; pk[k * 2 + 1] = hi;
      }
      c.peaks = pk; return pk;
    }
    const hasSample = id => !!DEMO_BY_ID[id] || store.has(id);
    const storeBytes = () => { let t = 0; for (const r of store.values()) t += r.bytes; return t; };
    function usedIds() {
      const used = new Set();
      for (const bk of prog.banks) for (const p of bk.pads) { for (const l of p.layers) if (l.sampleId) used.add(l.sampleId); for (const z of p.zones) if (z.sampleId) used.add(z.sampleId); }
      return used;
    }
    function liveBytes() { let t = 0; for (const id of usedIds()) { const r = store.get(id); if (r) t += r.bytes; } return t; }   // wat de state straks bevat
    function gcStore() {
      const used = usedIds();
      for (const id of [...store.keys()]) if (!used.has(id)) { store.delete(id); bufs.delete(id); }
      for (const id of [...bufs.keys()]) if (!DEMO_BY_ID[id] && !store.has(id)) bufs.delete(id);
    }
    function warm() {
      if (warmTimer) { clearTimeout(warmTimer); warmTimer = 0; }
      const ids = []; const seen = new Set();
      for (const bk of prog.banks) for (const p of bk.pads) for (const l of p.layers) if (l.sampleId && !seen.has(l.sampleId)) { seen.add(l.sampleId); ids.push(l.sampleId); }
      const my = token; let k = 0;
      const step = () => { warmTimer = 0; if (dead || my !== token || k >= ids.length) return; bufferFor(ids[k++], false); warmTimer = setTimeout(step, 0); };
      if (ids.length) warmTimer = setTimeout(step, 0);
    }

    // ---------- stemmen ----------
    const trigs = new Set(); let voiceCount = 0, trigSeq = 0;
    function stopSrc(v, at) { if (v.stopAt === undefined || at < v.stopAt) { try { v.source.stop(at); v.stopAt = at; } catch (e) { /* al gestopt */ } } }
    function endVoice(trg, v) {
      if (v.ended) return; v.ended = true; voiceCount--; trg.alive--;
      v.source.onended = null;
      for (const n of [v.source, v.lg, v.pn, v.bq, v.eg]) if (n) { try { n.disconnect(); } catch (e) { /* los */ } nodes.delete(n); }
      if (trg.alive <= 0) { for (const n of [trg.rel, trg.kill]) { try { n.disconnect(); } catch (e) { /* los */ } nodes.delete(n); } trigs.delete(trg); }
    }
    function killTrig(trg, t) {
      if (trg.killed) return; trg.killed = true;
      trg.kill.gain.setValueAtTime(1, t); trg.kill.gain.linearRampToValueAtTime(0, t + KILL_S);
      for (const v of trg.voices) stopSrc(v, t + KILL_S + 0.02);
    }
    function releaseTrig(trg, t) {
      if (trg.released || trg.killed || trg.oneShot) return; trg.released = true;
      trg.rel.gain.setValueAtTime(1, t); trg.rel.gain.linearRampToValueAtTime(0, t + trg.relTime);
      for (const v of trg.voices) stopSrc(v, t + trg.relTime + 0.03);
    }
    function panicAt(t) { for (const x of [...trigs]) killTrig(x, t); }
    function noteOffAt(n, t) { for (const x of trigs) if (x.note === n && x.held && !x.released && x.t0 <= t + 1e-6) releaseTrig(x, t); }

    function layerSrc(l, cents) { return { sid: l.sampleId, cents, level: l.level, pan: l.pan, offsetMs: l.offset, start: l.start, end: l.end, loop: l.loop, gain: l.gain }; }
    function pickSources(pad, i, v127, note) {
      const c = [], all = pad.play === 'all';
      if (pad.mode === 'drum') {
        for (const l of pad.layers) if (l.sampleId && (all || (v127 >= l.velLo && v127 <= l.velHi))) c.push(layerSrc(l, l.semi * 100 + l.fine));
      } else {
        const n = note == null ? pad.baseNote : note;
        if (pad.zones.length) {
          for (const z of pad.zones) if (z.sampleId && n >= z.keyLo && n <= z.keyHi && (all || (v127 >= z.velLo && v127 <= z.velHi)))
            c.push({ sid: z.sampleId, cents: (n - z.root) * 100 + z.tune * 100, level: 1, pan: 0, offsetMs: 0, start: 0, end: 1, loop: z.loop, gain: 0 });
        } else {
          for (const l of pad.layers) if (l.sampleId && (all || (v127 >= l.velLo && v127 <= l.velHi))) c.push(layerSrc(l, (n - (l.root == null ? 60 : l.root)) * 100 + l.semi * 100 + l.fine));
        }
      }
      if (c.length < 2 || pad.play === 'velocity' || pad.play === 'all') return c;
      if (pad.play === 'cycle') return [c[rr[i]++ % c.length]];
      let k = Math.floor(Math.random() * c.length);
      if (k === lastPick[i]) k = (k + 1 + Math.floor(Math.random() * (c.length - 1))) % c.length;
      lastPick[i] = k; return [c[k]];
    }

    function voice(trg, pad, i, src, t, v01) {
      const buf = bufferFor(src.sid, pad.reverse); if (!buf) return null;
      const D = buf.duration || (buf.length / buf.sampleRate), e = pad.env, f = pad.filter;
      let s0 = src.start, s1 = src.end, l0 = src.loop.start, l1 = src.loop.end;
      if (pad.reverse) { const a = s0, b = l0; s0 = 1 - s1; s1 = 1 - a; l0 = 1 - l1; l1 = 1 - b; }
      let startSec = s0 * D + Math.max(0, src.offsetMs) / 1000;
      const tStart = t + Math.max(0, -src.offsetMs) / 1000, endSec = s1 * D;
      const looped = src.loop.on && !trg.oneShot && (l1 - l0) * D >= 0.002;
      const base = src.cents + pad.fine, cents = base + effTune(i) * 100, rate = Math.pow(2, cents / 1200);
      if (looped) { if (startSec >= l1 * D) startSec = l0 * D; } else if (endSec - startSec < 0.0003) return null;
      const source = own(ctx.createBufferSource()); source.buffer = buf;
      try { source.detune.value = cents; } catch (err) { source.playbackRate.value = rate; }
      const lg = own(ctx.createGain()); lg.gain.value = v01 * src.level * Math.pow(10, src.gain / 20);
      const v = { source, lg, pn: null, bq: null, eg: null, ended: false, base, stopAt: undefined };
      let tail = lg; source.connect(lg);
      if (Math.abs(src.pan) > 0.001) { v.pn = own(ctx.createStereoPanner()); v.pn.pan.value = src.pan; tail.connect(v.pn); tail = v.pn; }
      const A = Math.max(e.attack, 0.0005), Dc = Math.max(e.decay, 0.005);
      if (f.type !== 'off') {
        const bq = v.bq = own(ctx.createBiquadFilter());
        bq.type = f.type === 'lp' ? 'lowpass' : f.type === 'hp' ? 'highpass' : 'bandpass';
        bq.frequency.value = effCut(i); bq.Q.value = f.type === 'bp' ? 0.5 + f.res * 12 : f.res * 20;
        const vd = f.velAmt * (v01 - 1) * 4800;
        bq.detune.setValueAtTime(vd, tStart);
        if (f.envAmt !== 0) { const sus = e.shape === 'ad' ? 0 : e.sustain; bq.detune.linearRampToValueAtTime(vd + f.envAmt * 6000, tStart + A); bq.detune.linearRampToValueAtTime(vd + f.envAmt * 6000 * sus, tStart + A + Dc); }
        tail.connect(bq); tail = bq;
      }
      const eg = v.eg = own(ctx.createGain());
      eg.gain.setValueAtTime(0, tStart); eg.gain.linearRampToValueAtTime(1, tStart + A);
      let stopAt = Infinity;
      if (e.shape === 'ad') { eg.gain.exponentialRampToValueAtTime(0.0001, tStart + A + Dc); stopAt = tStart + A + Dc + 0.02; }
      else if (e.sustain < 0.999) eg.gain.exponentialRampToValueAtTime(Math.max(e.sustain, 0.0001), tStart + A + Dc);
      tail.connect(eg); eg.connect(trg.rel);
      if (looped) { source.loop = true; source.loopStart = l0 * D; source.loopEnd = l1 * D; source.start(tStart, startSec); }
      else {
        const dur = endSec - startSec, real = dur / rate; source.start(tStart, startSec, dur);
        if (real > 0.008) { lg.gain.setValueAtTime(v01 * src.level * Math.pow(10, src.gain / 20), tStart + real - 0.003); lg.gain.linearRampToValueAtTime(0, tStart + real); }
      }
      if (stopAt < Infinity) { try { source.stop(stopAt); v.stopAt = stopAt; } catch (err) { /* ok */ } }
      source.onended = () => endVoice(trg, v);
      trg.voices.push(v); trg.alive++; voiceCount++;
      return v;
    }

    // het hart: een pad afspelen op tijd t (audioklok)
    function trigger(i, t, vel, note, dur, held) {
      if (dead || i < 0 || i >= NBANK * NPAD) return null;
      const pad = padOf(i), v01 = clamp(vel, 0, 1), v127 = clamp(Math.round(v01 * 127), 1, 127);
      const srcs = pickSources(pad, i, v127, note); if (!srcs.length) return null;
      const mine = [...trigs].filter(x => x.i === i && !x.killed);
      while (mine.length >= pad.polyphony) killTrig(mine.shift(), t);
      if (pad.muteGroup > 0) for (const x of trigs) if (x.i !== i && x.group === pad.muteGroup && !x.killed) killTrig(x, t);
      const liveVoices = () => { let n = 0; for (const x of trigs) if (!x.killed) n += x.alive; return n; };
      while (liveVoices() + srcs.length > MAX_VOICES) { let old = null; for (const x of trigs) if (!x.killed && (!old || x.id < old.id)) old = x; if (!old) break; killTrig(old, t); }
      const rt = padRt(i), trg = { id: ++trigSeq, i, group: pad.muteGroup, t0: t, note: note == null ? -1 : note, held: !!held, oneShot: pad.oneShot, relTime: pad.env.release, released: false, killed: false, alive: 0, voices: [], rel: own(ctx.createGain()), kill: own(ctx.createGain()) };
      trg.rel.connect(trg.kill); trg.kill.connect(rt.gain);
      trigs.add(trg);
      for (const s of srcs) { try { voice(trg, pad, i, s, t, v01); } catch (e) { /* een kapotte laag mag de rest niet stoppen */ } }
      if (!trg.voices.length) { for (const n of [trg.rel, trg.kill]) { try { n.disconnect(); } catch (e) { /* los */ } nodes.delete(n); } trigs.delete(trg); return null; }
      hitAt[i] = performance.now();
      if (!held && Number.isFinite(dur)) releaseTrig(trg, t + Math.max(0, dur));
      return trg;
    }

    const padNote = (b, p) => prog.baseNote + b * NPAD + p;
    const hasSound = pad => pad.layers.some(l => l.sampleId) || (pad.mode === 'key' && pad.zones.some(z => z.sampleId));
    function playNote(n, vel, t, dur, held) {
      let claimed = false;
      for (let b = 0; b < NBANK; b++) for (let p = 0; p < NPAD; p++) { const pad = prog.banks[b].pads[p]; if (pad.mode === 'drum' && padNote(b, p) === n && hasSound(pad)) { claimed = true; trigger(b * NPAD + p, t, vel, n, dur, held); } }
      if (!claimed) for (let b = 0; b < NBANK; b++) for (let p = 0; p < NPAD; p++) { const pad = prog.banks[b].pads[p]; if (pad.mode === 'key' && hasSound(pad)) trigger(b * NPAD + p, t, vel, n, dur, held); }
    }
    function laneToPad(lane) {
      const s = String(lane == null ? '' : lane).trim().toLowerCase(); let m;
      if ((m = /^(?:pad)?(\d{1,2})$/.exec(s))) { const p = +m[1] - 1; return p >= 0 && p < NPAD ? prog.bank * NPAD + p : -1; }
      if ((m = /^([a-d])(\d{1,2})$/.exec(s))) { const p = +m[2] - 1; return p >= 0 && p < NPAD ? (m[1].charCodeAt(0) - 97) * NPAD + p : -1; }
      return -1;
    }

    // ---------- wijzigingen aan een pad die direct hoorbaar zijn ----------
    function padLive(i) {
      const r = prt[i], now = ctx.currentTime; if (!r) return;
      r.gain.gain.setTargetAtTime(effLevel(i), now, 0.01); r.pan.pan.setTargetAtTime(padOf(i).pan, now, 0.01); route(i);
      for (const x of trigs) if (x.i === i) for (const v of x.voices) {
        if (v.ended) continue;
        try { v.source.detune.setTargetAtTime(v.base + effTune(i) * 100, now, 0.01); if (v.bq) v.bq.frequency.setTargetAtTime(effCut(i), now, 0.01); } catch (e) { /* ok */ }
      }
    }
    function allLive() { applyMaster(); for (let i = 0; i < prt.length; i++) if (prt[i]) padLive(i); }

    // ---------- noten-namen voor sequencers (contract v1.14) ----------
    function noteList() {
      const out = [];
      for (let b = 0; b < NBANK; b++) for (let p = 0; p < NPAD; p++) {
        const pad = prog.banks[b].pads[p], n = padNote(b, p);
        if (pad.mode === 'drum' && hasSound(pad) && n <= 127 && out.length < 128) out.push({ note: n, name: (pad.name || (sampleInfo(pad.layers.find(l => l.sampleId).sampleId) || {}).name || T.pad + ' ' + padId(b, p).toUpperCase()).slice(0, 40) });
      }
      return out;
    }
    function notesNotify() { const sig = JSON.stringify(noteList()); if (sig === notesSig) return; notesSig = sig; if (selfRef && typeof host.noteNamesChanged === 'function') { try { host.noteNamesChanged(selfRef); } catch (e) { /* ok */ } } }

    // ---------- samples laden ----------
    function readSmpl(ab) {   // WAV: root en lus uit het smpl-blok
      try {
        const dv = new DataView(ab); if (dv.byteLength < 44 || dv.getUint32(0, false) !== 0x52494646 || dv.getUint32(8, false) !== 0x57415645) return null;
        let pos = 12, block = 0, dataLen = 0, smpl = null;
        while (pos + 8 <= dv.byteLength) {
          const id = dv.getUint32(pos, false), len = dv.getUint32(pos + 4, true), body = pos + 8;
          if (id === 0x666d7420 && body + 16 <= dv.byteLength) block = dv.getUint16(body + 12, true);
          else if (id === 0x64617461) dataLen = Math.min(len, dv.byteLength - body);
          else if (id === 0x736d706c && body + 36 <= dv.byteLength) smpl = body;
          pos = body + len + (len & 1);
        }
        if (smpl === null) return null;
        const unity = dv.getUint32(smpl + 12, true), nl = dv.getUint32(smpl + 28, true), frames = block > 0 ? dataLen / block : 0;
        const out = { root: unity > 0 && unity <= 127 ? unity : null, loop: null };
        if (nl > 0 && frames > 0 && smpl + 36 + 24 <= dv.byteLength) {
          const ls = dv.getUint32(smpl + 36 + 8, true), le = dv.getUint32(smpl + 36 + 12, true) + 1;
          if (le > ls && le <= frames) out.loop = { start: ls / frames, end: le / frames };
        }
        return out;
      } catch (e) { return null; }
    }
    function toRecord(audio, name, meta) {
      const channels = Math.min(2, audio.numberOfChannels), frames = audio.length, rate = Math.round(audio.sampleRate);
      const u = new Uint8Array(frames * channels * 2), dv = new DataView(u.buffer);
      for (let ch = 0; ch < channels; ch++) { const a = audio.getChannelData(ch); for (let i = 0; i < frames; i++) { const x = Number.isFinite(a[i]) ? clamp(a[i], -1, 1) : 0; dv.setInt16((i * channels + ch) * 2, Math.round(x * (x < 0 ? 32768 : 32767)), true); } }
      const data = b64encode(u);
      return { name: str(name, 80), rate, channels, root: meta && meta.root != null ? meta.root : null, loop: meta && meta.loop ? { start: meta.loop.start, end: meta.loop.end } : null, slices: [], sliceEnds: [], license: { source: '', license: '', author: '', attribution: '' }, data, bytes: u.length, frames };
    }
    const recId = rec => 's' + hash53(rec.data).toString(36) + '-' + rec.frames.toString(36) + '-' + rec.rate.toString(36) + rec.channels;
    function addRecord(rec) {   // dedupliceren op hash van de PCM; geeft het id of gooit een melding
      const id = recId(rec);
      if (store.has(id)) return id;
      if (storeBytes() + rec.bytes > MAX_PCM) throw new Error(T.memFull);
      store.set(id, rec); return id;
    }
    function assignSample(i, layerIdx, id, name) {
      const pad = padOf(i), info = sampleInfo(id), l = pad.layers[layerIdx];
      l.sampleId = id; l.start = 0; l.end = 1; l.root = info && info.root != null ? info.root : l.root;
      l.loop = info && info.loop ? { on: pad.mode === 'key', start: info.loop.start, end: info.loop.end, xfade: 0 } : defLoop();
      if (!pad.name && name) pad.name = str(name, 40);
    }
    async function loadFiles(files, lic) {
      const arr0 = Array.from(files || []);
      if (arr0.some(f => /\.(sfz|dspreset)$/i.test(f.name))) { await importFromFiles(arr0, {}); return; }
      const my = ++token; let loaded = 0, firstErr = '', mp3n = 0;
      try {
        if (typeof ctx.decodeAudioData !== 'function') throw new Error(T.noDecode);
        const list = Array.from(files || []).slice(0, NPAD);
        for (let k = 0; k < list.length; k++) {
          const f = list[k];
          try {
            if (dead || my !== token) return;
            if (f.size > 50 * 1048576) throw new Error(T.fileBig);
            say(T.loading.replace('{0}', f.name));
            const ab = await f.arrayBuffer(); if (dead || my !== token) return;
            const meta = readSmpl(ab); if (isMp3(ab)) mp3n++;
            let audio; try { audio = await ctx.decodeAudioData(ab.slice(0)); } catch (e) { throw new Error(T.decodeFail.replace('{0}', f.name)); }
            if (dead || my !== token) return;
            if (!audio || !(audio.length > 0)) throw new Error(T.noAudio.replace('{0}', f.name));
            if (audio.length / audio.sampleRate > MAX_SEC) throw new Error(T.tooLong);
            const name = String(f.name || 'sample').replace(/\.[^.]+$/, ''), rec0 = toRecord(audio, name, meta); if (lic) rec0.license = lic; const id = addRecord(rec0);
            const target = k === 0 ? prog.bank * NPAD + prog.pad : Math.min(NBANK * NPAD - 1, prog.bank * NPAD + prog.pad + k);
            if (padOf(target).mode === 'drum' || k === 0) assignSample(target, k === 0 ? prog.layer : 0, id, name);
            loaded++;
          } catch (e) { if (!firstErr) firstErr = e && e.message ? e.message : String(e); }
        }
        gcStore(); if (ui) ui.refreshAll(); notesNotify();
        say((firstErr ? firstErr : T.loaded.replace('{0}', loaded)) + (mp3n && (curPad().mode === 'key' || curLayer().loop.on) ? ' ' + fillT(B.w.mp3Loop, mp3n) : ''));
        bkUi('credits');
      } catch (e) { say(e && e.message ? e.message : String(e)); }
    }
    const say = msg => { if (ui) ui.say(msg); };

    // ---------- banken: bronnen, importeren, rapport (stap 4) ----------
    // Netwerk doet het apparaat niet zelf (contract §15): bestanden van internet vraagt het aan de host (host.fetchFile, alleen na een klik van de gebruiker).
    const B = T.bk;
    let lastReport = null, job = null;
    const canNet = () => typeof host.fetchFile === 'function';
    const netGet = (url, o) => host.fetchFile(selfRef, url, o);
    const abortErr = () => Object.assign(new Error('aborted'), { code: 'aborted' });
    const bkUi = (m, ...a) => { if (ui && ui.bk && ui.bk[m]) { try { ui.bk[m](...a); } catch (e) { /* de UI mag een import niet breken */ } } };
    const fmtMiB = n => (n / 1048576).toFixed(1);
    function newReport(title, src) { return { title, src, ok: [], ignored: [], warn: [], stats: null, loaded: 0, bytes: 0, missing: [], failed: [], notFit: 0, mp3Loops: 0, loopFmt: 0, rootDef: 0, aborted: false, error: '' }; }
    function stageSample(key, ab, lic) {
      const head = wavHead(ab), meta = readSmpl(ab), mp3 = isMp3(ab), name = baseName(key);
      return ctx.decodeAudioData(ab.slice(0)).then(audio => {
        if (!audio || !(audio.length > 0)) throw new Error(fillT(T.noAudio, name));
        if (audio.length / audio.sampleRate > MAX_SEC) throw new Error(T.tooLong);
        const rec = toRecord(audio, name, meta); rec.license = lic;
        return { rec, id: recId(rec), meta, head, mp3 };
      }, () => { throw Object.assign(new Error(fillT(T.decodeFail, name)), { code: 'decode' }); });
    }
    function loopFor(lp, s, keyMode, rep) {
      const rec = s.rec, frames = s.head ? s.head.frames : 0;
      const on = lp.m === 'on' || (lp.m === 'auto' && keyMode && !!rec.loop);
      if (!on) return defLoop();
      if (s.mp3) rep.mp3Loops++;
      if (lp.ls != null && lp.le != null && lp.le >= lp.ls) {
        if (frames > 0) return { on: true, start: clamp(lp.ls / frames, 0, 0.9999), end: clamp((lp.le + 1) / frames, 0.0001, 1), xfade: 0 };
        rep.loopFmt++; return { on: true, start: 0, end: 1, xfade: 0 };
      }
      return rec.loop ? { on: true, start: rec.loop.start, end: rec.loop.end, xfade: 0 } : { on: true, start: 0, end: 1, xfade: 0 };
    }
    // Laadt de bestanden van een plan (resolve(sleutel, signal) geeft een ArrayBuffer) en schrijft de pads in een bank, als één stap die ongedaan te maken is.
    async function runPlan(plan, resolve, o) {
      const rep = o.rep, sig = o.sig, uniq = [], seen = new Set();
      for (const p of plan.pads) { for (const l of p.layers) if (!seen.has(l.f)) { seen.add(l.f); uniq.push(l.f); } for (const z of p.zones) if (!seen.has(z.f)) { seen.add(z.f); uniq.push(z.f); } }
      const idxs = Array.from({ length: NPAD }, (_, k) => o.bank * NPAD + k), inBank = new Set(idxs), keep = new Set();
      for (let i = 0; i < NBANK * NPAD; i++) { if (o.clear && inBank.has(i)) continue; const p = padOf(i); for (const l of p.layers) if (l.sampleId) keep.add(l.sampleId); for (const z of p.zones) if (z.sampleId) keep.add(z.sampleId); }
      let budget = MAX_PCM; for (const id of keep) { const r = store.get(id); if (r) budget -= r.bytes; }
      const staged = new Map(), ids = new Set(); let used = 0, stop = false;
      for (let i = 0; i < uniq.length; i++) {
        if (sig.aborted || dead) throw abortErr();
        o.progress(i, uniq.length, uniq[i]);
        if (stop) { rep.notFit++; continue; }
        try {
          const ab = await resolve(uniq[i], sig); if (sig.aborted || dead) throw abortErr();
          const s = await stageSample(uniq[i], ab, o.lic); if (sig.aborted || dead) throw abortErr();
          const cost = keep.has(s.id) || ids.has(s.id) ? 0 : s.rec.bytes;
          if (used + cost > budget) { stop = true; rep.notFit++; continue; }
          ids.add(s.id); used += cost; staged.set(uniq[i], s);
        } catch (e) {
          if (e && e.code === 'aborted') throw e;
          if (e && e.code === 'decode') rep.failed.push(baseName(uniq[i])); else rep.missing.push(baseName(uniq[i]));
        }
      }
      o.progress(uniq.length, uniq.length, '');
      if (!staged.size) return false;
      if (sig.aborted || dead) throw abortErr();
      const layersLost = { n: 0 }, padsLost = { n: 0 };
      let ok;
      try {
        ok = progRun(fillT(B.undoLabel, o.title), idxs, () => {
          if (o.clear) for (const i of idxs) prog.banks[o.bank].pads[i & 15] = defPad();
          for (const s of staged.values()) { const id = addRecord(s.rec); const ex = store.get(id); if (ex && !ex.license.license && !ex.license.attribution && s.rec.license.license) ex.license = s.rec.license; s.id = id; }
          const free = idxs.filter(i => !hasSound(padOf(i)));
          let w = 0;
          for (const p of plan.pads) {
            const obj = { name: p.name, mode: p.mode, play: p.play, polyphony: p.mode === 'key' ? 16 : 4, muteGroup: p.mute, oneShot: p.one, layers: [], zones: [] };
            if (p.env) obj.env = { shape: 'adsr', attack: p.env.attack, decay: p.env.decay, sustain: p.env.sustain, release: p.env.release };
            for (const l of p.layers) { const s = staged.get(l.f); if (!s) { layersLost.n++; continue; } obj.layers.push({ sampleId: s.id, semi: l.semi, fine: l.fine, level: 1, pan: l.pan, offset: 0, root: null, velLo: l.lo, velHi: l.hi, start: 0, end: 1, loop: loopFor(l.loop, s, false, rep), gain: l.gain }); }
            for (const z of p.zones) {
              const s = staged.get(z.f); if (!s) { layersLost.n++; continue; }
              let root = z.root; if (root == null) { if (s.rec.root != null) root = s.rec.root; else { root = 60; rep.rootDef++; } }
              obj.zones.push({ sampleId: s.id, root, keyLo: z.lo, keyHi: z.hi, velLo: z.vlo, velHi: z.vhi, tune: z.tune, loop: loopFor(z.loop, s, true, rep) });
            }
            if (!obj.layers.length && !obj.zones.length) { padsLost.n++; continue; }
            if (p.mode === 'key') obj.baseNote = obj.zones[Math.floor(obj.zones.length / 2)].root;
            if (w >= free.length) { padsLost.n++; continue; }
            const i = free[w++]; prog.banks[o.bank].pads[i & 15] = nPad(obj, hasSample); if (prt[i]) padLive(i);
          }
          if (o.clear && o.name) prog.banks[o.bank].name = str(o.name, 40) || prog.banks[o.bank].name;
          prog.bank = o.bank; prog.pad = 0; prog.layer = 0; selZone = 0;
          return w > 0;
        }, true);
      } catch (e) { rep.notFit += staged.size; staged.clear(); gcStore(); ok = false; }
      rep.loaded = ok ? staged.size : 0; rep.bytes = 0;
      if (ok) { const sid = new Set(); for (const s of staged.values()) sid.add(s.id); for (const id of sid) { const r = store.get(id); if (r) rep.bytes += r.bytes; } }
      rep.layersLost = layersLost.n; rep.padsLost = padsLost.n;
      return ok;
    }
    function finishReport(rep, parsed, plan) {
      const st = plan ? plan.stats : null; rep.stats = st;
      const f = fillT, R = B.r;
      if (st) {
        rep.ok.push(f(R.regions, st.regions, plan.pads.reduce((n, p) => n + p.layers.length + p.zones.length, 0)));
        rep.ok.push(f(R.pads, st.drumPads, st.zones));
        if (st.drumPads) rep.ok.push(f(R.layers, st.layers, st.vel, st.rr, st.rand));
        if (st.roots || st.tuned) rep.ok.push(f(R.roots, st.roots, st.tuned));
        if (st.loops) rep.ok.push(f(R.loops, st.loops));
        if (st.pans || st.vols) rep.ok.push(f(R.panvol, st.vols, st.pans));
        if (st.mute) rep.ok.push(f(R.mute, st.mute));
      }
      if (rep.loaded) rep.ok.push(f(R.samples, rep.loaded, fmtMiB(rep.bytes)));
      if (parsed) {
        const ig = Object.entries(parsed.ignored).sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1)), hd = Object.entries(parsed.headers).sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1));
        for (const [k, n] of ig.slice(0, 24)) rep.ignored.push(f(B.i.item, k, n));
        if (ig.length > 24) rep.ignored.push(f(B.i.more, ig.length - 24));
        for (const [k, n] of hd) rep.ignored.push(f(B.i.header, k, n));
        for (const [k, n] of Object.entries(parsed.skipped)) rep.ignored.push(f(B.s[k] || B.s.other, n));
      }
      if (plan) {
        for (const [k, n] of Object.entries(plan.skipped)) rep.ignored.push(f(B.s[k] || B.s.other, n));
        if (plan.notes.includes('thin')) rep.warn.push(f(B.w.thin, st.thinned));
        if (plan.notes.includes('mute')) rep.warn.push(B.w.mute);
      }
      if (rep.missing.length) rep.warn.push(f(B.w.missing, rep.missing.length, rep.missing.slice(0, 6).join(', ') + (rep.missing.length > 6 ? ' …' : '')));
      if (rep.failed.length) rep.warn.push(f(B.w.decode, rep.failed.length, rep.failed.slice(0, 6).join(', ') + (rep.failed.length > 6 ? ' …' : '')));
      if (rep.notFit) rep.warn.push(f(B.w.notFit, rep.notFit, MAX_PCM / 1048576));
      if (rep.padsLost || rep.layersLost) rep.warn.push(f(B.w.lost, rep.padsLost || 0, rep.layersLost || 0));
      if (rep.mp3Loops) rep.warn.push(f(B.w.mp3Loop, rep.mp3Loops));
      if (rep.loopFmt) rep.warn.push(f(B.w.loopFmt, rep.loopFmt));
      if (rep.rootDef) rep.warn.push(f(B.w.rootDef, rep.rootDef));
      if (rep.aborted) rep.warn.push(B.w.aborted);
      if (rep.error) rep.warn.push(rep.error);
      lastReport = rep; bkUi('report', rep); bkUi('credits');
    }
    async function runJob(label, fn) {
      if (job) { say(B.busy); return false; }
      job = { ctl: new AbortController(), label, done: 0, total: 0, name: '' }; bkUi('job');
      const my = job, o = { sig: my.ctl.signal, progress: (i, n, name) => { my.done = i; my.total = n; my.name = name; bkUi('job'); } };
      try { return await fn(o); } finally { if (job === my) job = null; bkUi('job'); }
    }
    function cancelJob() { if (job) job.ctl.abort(); }
    // --- resolvers
    function localResolver(files, presetPath) {
      const idx = new Map(), byName = new Map();
      for (const f of files) { const p = String(f.webkitRelativePath || f.name).replace(/\\/g, '/').toLowerCase(); idx.set(p, f); const b = p.split('/').pop(); byName.set(b, byName.has(b) ? null : f); }
      const dir = dirName(presetPath);
      return async rel => {
        const want = joinPath(dir, rel).toLowerCase();
        let f = idx.get(want);
        if (!f) for (const [k, v] of idx) if (k.endsWith('/' + want) || want.endsWith('/' + k)) { f = v; break; }
        if (!f) f = byName.get(want.split('/').pop());
        if (!f) throw new Error('missing');
        if (f.size > 50 * 1048576) throw new Error(T.fileBig);
        return f.arrayBuffer();
      };
    }
    function urlResolver(baseUrl) { return async (rel, sig) => netGet(new URL(encPath(rel), baseUrl).href, { as: 'arraybuffer', signal: sig, maxBytes: 50 * 1048576 }); }
    function licOf(src, fields) {
      return { source: str(src, 200), license: str(fields.license, 200), author: str(fields.author, 200), attribution: str(fields.attribution, 200) };
    }
    async function importPresetText(fmt, text, presetName, resolve, o) {
      const rep = o.rep; rep.fmt = fmt;
      const parsed = fmt === 'ds' ? parseDs(text) : parseSfz(text);
      if (parsed.error) { rep.error = B.w.badXml; finishReport(rep, parsed, null); return false; }
      if (!parsed.regions.length) { rep.error = B.w.noRegions; finishReport(rep, parsed, null); return false; }
      const env = parsed.env ? parsed.env : null;
      const plan = planRegions(parsed.regions, presetName, env);
      let ok = false;
      try { ok = await runPlan(plan, resolve, o); } catch (e) { if (e && e.code === 'aborted') rep.aborted = true; else rep.error = String(e && e.message || e); }
      finishReport(rep, parsed, plan);
      return ok;
    }
    // --- ingangen: lokale bestanden, webadres, catalogus, Freesound
    async function importFromFiles(arr, o0) {
      const presets = arr.filter(f => /\.(sfz|dspreset)$/i.test(f.name)).sort((a, b) => (a.webkitRelativePath || a.name) < (b.webkitRelativePath || b.name) ? -1 : 1);
      const pf = presets[0], fmt = /\.dspreset$/i.test(pf.name) ? 'ds' : 'sfz', name = baseName(pf.name);
      return runJob(name, async o => {
        const rep = newReport(name, 'local'); o.rep = rep; o.bank = o0.bank == null ? prog.bank : o0.bank; o.clear = o0.clear !== false; o.title = name; o.name = name; o.lic = licOf('', o0.lic || {});
        if (presets.length > 1) rep.warn.push(fillT(B.w.morePresets, presets.length - 1));
        if (pf.size > 5 * 1048576) { rep.error = B.w.presetBig; finishReport(rep, null, null); return false; }
        const text = await pf.text();
        return importPresetText(fmt, text, name, localResolver(arr, pf.webkitRelativePath || pf.name), o);
      });
    }
    async function importFromUrl(url, o0) {
      let u; try { u = new URL(String(url).trim()); } catch (e) { say(B.badUrl); return false; }
      if (u.protocol !== 'https:' || u.username || u.password) { say(B.badUrl); return false; }
      if (!canNet()) { say(B.noNet); return false; }
      const name = baseName(decodeURIComponent(u.pathname) || 'url') || u.hostname;
      return runJob(name, async o => {
        const rep = newReport(name, u.href); o.rep = rep; o.bank = o0.bank == null ? prog.bank : o0.bank; o.clear = o0.clear !== false; o.title = name; o.name = name; o.lic = licOf(u.href, o0.lic || {});
        try {
          o.progress(0, 1, name);
          const ab = await netGet(u.href, { as: 'arraybuffer', signal: o.sig, maxBytes: 50 * 1048576 });
          const h = new Uint8Array(ab, 0, Math.min(16, ab.byteLength)), txt = () => new TextDecoder('utf-8').decode(ab);
          const bin = isMp3(ab) || !!wavHead(ab) || (h[0] === 0x66 && h[1] === 0x4c && h[2] === 0x61 && h[3] === 0x43) || (h[0] === 0x4f && h[1] === 0x67 && h[2] === 0x67 && h[3] === 0x53);
          if (!bin) {
            const t = txt();
            if (/\.dspreset$/i.test(u.pathname) || /<DecentSampler/.test(t.slice(0, 2000))) return await importPresetText('ds', t, name, urlResolver(u.href), o);
            if (/\.sfz$/i.test(u.pathname) || /<region>|<group>|<global>/.test(t.slice(0, 4000))) return await importPresetText('sfz', t, name, urlResolver(u.href), o);
            throw Object.assign(new Error('audio'), { code: 'audio' });
          }
          // gewoon audio: één sample in het gekozen pad
          const s = await stageSample(u.pathname, ab, o.lic); rep.stats = null;
          const id = addRecord(s.rec); assignSample(curI(), prog.layer, id, s.rec.name); gcStore(); if (ui) ui.refreshAll(); notesNotify();
          rep.loaded = 1; rep.bytes = s.rec.bytes; rep.ok.push(fillT(B.r.samples, 1, fmtMiB(s.rec.bytes))); if (s.mp3 && curPad().mode === 'key') rep.warn.push(fillT(B.w.mp3Loop, 1));
          lastReport = rep; bkUi('report', rep); bkUi('credits'); return true;
        } catch (e) {
          const rep2 = o.rep; if (e && e.code === 'aborted') rep2.aborted = true; else rep2.error = netMsg(e);
          finishReport(rep2, null, null); return false;
        }
      });
    }
    function netMsg(e) {
      const c = e && e.code;
      if (c === 'nonet') return B.noNet;
      if (c === 'network') return B.errNetwork;
      if (c === 'http') return fillT(B.errHttp, e.status || '?');
      if (c === 'size') return B.errSize;
      if (c === 'url') return B.badUrl;
      if (c === 'audio') return B.errAudio;
      return String(e && e.message || e);
    }
    async function loadCatalogBank(id, o0) {
      const b = CATALOG.find(x => x.id === id);
      if (!b) return false;
      if (b.status !== 'green' && b.status !== 'yellow') return false;
      if (!canNet()) { say(B.noNet); return false; }
      const name = b.name[lang] || b.name.en;
      return runJob(name, async o => {
        const rep = newReport(name, b.src.home); o.rep = rep; o.bank = o0.bank == null ? prog.bank : o0.bank; o.clear = o0.clear !== false; o.title = name; o.name = name;
        o.lic = { source: str(b.src.home, 200), license: str(b.license.spdx, 200), author: str(b.author, 200), attribution: str(b.attribution, 200) };
        const resolve = async (f, sig) => netGet(new URL(encPath(f), b.src.base).href, { as: 'arraybuffer', signal: sig, maxBytes: 50 * 1048576 });
        try {
          if (b.kind === 'preset') {
            o.progress(0, 1, b.preset.f);
            const ab = await netGet(new URL(encPath(b.preset.f), b.src.base).href, { as: 'arraybuffer', signal: o.sig, maxBytes: 5 * 1048576 });
            const text = new TextDecoder('utf-8').decode(ab);
            return await importPresetText(b.preset.fmt, text, name, resolve, o);
          }
          const plan = planCatalog(b);
          let ok = false;
          try { ok = await runPlan(plan, resolve, o); } catch (e) { if (e && e.code === 'aborted') rep.aborted = true; else rep.error = netMsg(e); }
          finishReport(rep, null, plan); return ok;
        } catch (e) {
          if (e && e.code === 'aborted') o.rep.aborted = true; else o.rep.error = netMsg(e);
          finishReport(o.rep, null, null); return false;
        }
      });
    }
    // Freesound: eigen token van de gebruiker, alleen zoeken en een voorbeeld (mp3) laden van geluiden met CC0 of CC-BY; het token blijft alleen in het geheugen
    async function fsSearch(query, token) {
      if (!canNet()) { say(B.noNet); return []; }
      query = String(query || '').trim().slice(0, 100); token = String(token || '').trim();
      if (!query || !/^[A-Za-z0-9]{10,64}$/.test(token)) { say(B.fsNeed); return []; }
      const url = 'https://freesound.org/apiv2/search/text/?query=' + encodeURIComponent(query) + '&page_size=15&fields=id,name,username,license,duration,previews&filter=' + encodeURIComponent('license:("Creative Commons 0" OR "Attribution")') + '&token=' + encodeURIComponent(token);
      const r = await runJob('Freesound', async o => {
        try { o.progress(0, 1, 'Freesound'); return await netGet(url, { as: 'json', signal: o.sig, maxBytes: 2 * 1048576 }); } catch (e) { say(e && e.code === 'aborted' ? B.w.aborted : (e && e.code === 'http' && (e.status === 401 || e.status === 403) ? B.fsAuth : netMsg(e))); return null; }
      });
      const list = r && Array.isArray(r.results) ? r.results : [];
      return list.filter(x => x && Number.isFinite(x.id) && licOfUrl(x.license) && x.previews && (x.previews['preview-hq-mp3'] || x.previews['preview-hq-ogg']) && x.duration <= MAX_SEC)
        .map(x => ({ id: x.id, name: str(x.name, 80), user: str(x.username, 60), license: licOfUrl(x.license), duration: x.duration, url: x.previews['preview-hq-ogg'] || x.previews['preview-hq-mp3'] }));
    }
    async function fsLoad(item) {
      if (!canNet()) { say(B.noNet); return false; }
      if (!item || !/^https:\/\/([a-z0-9-]+\.)?freesound\.org\//.test(String(item.url))) return false;
      return runJob(item.name, async o => {
        const rep = newReport(item.name, 'https://freesound.org/s/' + item.id + '/'); o.rep = rep;
        try {
          o.progress(0, 1, item.name);
          const ab = await netGet(item.url, { as: 'arraybuffer', signal: o.sig, maxBytes: 20 * 1048576 });
          const lic = { source: 'https://freesound.org/s/' + item.id + '/', license: item.license, author: str(item.user, 200), attribution: str('"' + item.name + '" by ' + item.user + ', freesound.org/s/' + item.id + ', ' + item.license, 200) };
          const s = await stageSample('freesound-' + item.id + '.' + (isMp3(ab) ? 'mp3' : 'ogg'), ab, lic);
          s.rec.name = str(item.name, 80);
          const id = addRecord(s.rec); assignSample(curI(), prog.layer, id, item.name); gcStore(); if (ui) ui.refreshAll(); notesNotify();
          rep.loaded = 1; rep.bytes = s.rec.bytes; rep.ok.push(fillT(B.r.samples, 1, fmtMiB(s.rec.bytes))); rep.warn.push(B.w.fsLossy);
          if (s.mp3 && curPad().mode === 'key') rep.warn.push(fillT(B.w.mp3Loop, 1));
          lastReport = rep; bkUi('report', rep); bkUi('credits'); return true;
        } catch (e) { if (e && e.code === 'aborted') rep.aborted = true; else rep.error = e && e.code === 'decode' ? e.message : netMsg(e); finishReport(rep, null, null); return false; }
      });
    }

    // ---------- editor: model, bewerkingen, ongedaan/opnieuw ----------
    // De editor werkt op de laag (of zone) die gekozen is. Een bewerking leest het sample als Float32, maakt een nieuwe kopie, slaat die als PCM16 op onder een nieuw id
    // en laat de laag daarheen wijzen. Ongedaan/opnieuw zit alleen in het geheugen (niet in getState): de oude en nieuwe samples blijven daarvoor bewaard, apart van de 64 MiB.
    const E = T.e;
    const ed = { sel: null, cur: 0, anchor: 0, v0: 0, vn: 0, full: true, W: 600, clip: null, undo: [], redo: [], pool: new Map(), snap: true, lanes: 'lr', xf: 20, useZone: false, key: '', dec: null, dirty: true, play: null, lastGrain: -1, ver: 0 };
    const uiEd = (m, ...a) => { if (ui && ui.ed && ui.ed[m]) ui.ed[m](...a); };
    const fillT = (t, ...v) => t.replace(/\{(\d)\}/g, (_, i) => v[+i]);
    function edTarget() {
      const pad = prog.banks[prog.bank].pads[prog.pad];
      if (ed.useZone && pad.zones[selZone]) return { kind: 'z', obj: pad.zones[selZone], loc: { b: prog.bank, p: prog.pad, z: selZone } };
      return { kind: 'l', obj: pad.layers[prog.layer], loc: { b: prog.bank, p: prog.pad, l: prog.layer } };
    }
    function locTarget(loc) {
      const pad = prog.banks[loc.b] && prog.banks[loc.b].pads[loc.p]; if (!pad) return null;
      if (loc.z != null) return pad.zones[loc.z] ? { kind: 'z', obj: pad.zones[loc.z], loc } : null;
      return { kind: 'l', obj: pad.layers[loc.l], loc };
    }
    const edKey = t => t.loc.b + '.' + t.loc.p + '.' + t.kind + (t.kind === 'l' ? t.loc.l : t.loc.z) + ':' + t.obj.sampleId;
    function decodeRec(r) {
      const u = b64decode(r.data), dv = new DataView(u.buffer, u.byteOffset, u.byteLength), ch = Array.from({ length: r.channels }, () => new Float32Array(r.frames));
      for (let c = 0; c < r.channels; c++) { const a = ch[c]; for (let i = 0; i < r.frames; i++) a[i] = dv.getInt16((i * r.channels + c) * 2, true) / 32768; }
      return ch;
    }
    function edData() {   // het gekozen sample als Float32-kanalen (uit de cache)
      const t = edTarget(), id = t && t.obj.sampleId; if (!id) return null;
      if (ed.dec && ed.dec.id === id) return ed.dec;
      const info = sampleInfo(id); if (!info) return null;
      const d = DEMO_BY_ID[id], ch = d ? [Float32Array.from(d.f())] : decodeRec(store.get(id));
      ed.dec = { id, ch, rate: info.rate, channels: ch.length, frames: ch[0].length, name: info.name, demo: !!d };
      return ed.dec;
    }
    function packRec(ch, rate, name, meta) {   // Float32 -> PCM16 (symmetrisch, dus 16 bit -> Float32 -> 16 bit blijft exact)
      const channels = ch.length, frames = ch[0].length, u = new Uint8Array(frames * channels * 2), dv = new DataView(u.buffer);
      for (let c = 0; c < channels; c++) { const a = ch[c]; for (let i = 0; i < frames; i++) { const x = a[i]; let v = Number.isFinite(x) ? Math.round(clamp(x, -1, 1) * 32768) : 0; if (v > 32767) v = 32767; dv.setInt16((i * channels + c) * 2, v, true); } }
      const lic = meta.license || {}, license = {}; for (const k of LICENSE_KEYS) license[k] = str(lic[k], 200);
      return { name: str(name, 80), rate, channels, root: meta.root == null ? null : meta.root, loop: meta.loop || null, slices: meta.slices || [], sliceEnds: meta.ends || [], license, data: b64encode(u), bytes: u.length, frames };
    }
    const minVn = () => Math.max(8, Math.floor(ed.W / 12));
    function clampView(N) { const lo = Math.min(N, minVn()); ed.vn = clamp(ed.vn, lo, N); ed.v0 = clamp(ed.v0, 0, N - ed.vn); if (ed.vn >= N) { ed.full = true; ed.v0 = 0; } }
    function edSync() {   // na een wisseling van pad/laag/sample: de weergave opnieuw beginnen
      const t = edTarget(), k = t ? edKey(t) : '';
      if (k !== ed.key) { ed.key = k; ed.sel = null; ed.cur = 0; ed.full = true; ed.v0 = 0; ed.vn = 0; edStop(); }
      const D = edData();
      if (D) {
        if (ed.full || ed.vn <= 0) { ed.full = true; ed.v0 = 0; ed.vn = D.frames; }
        clampView(D.frames); ed.cur = clamp(Math.round(ed.cur), 0, D.frames);
        if (ed.sel) { const a = clamp(ed.sel[0], 0, D.frames), b = clamp(ed.sel[1], 0, D.frames); ed.sel = b - a >= 1 ? [a, b] : null; }
      } else { ed.sel = null; ed.vn = 0; }
      ed.dirty = true;
    }
    function edZoomBy(f, anchor) {
      const D = edData(); if (!D) return;
      if (anchor == null) anchor = ed.v0 + ed.vn / 2;
      const nvn = clamp(ed.vn * f, Math.min(D.frames, minVn()), D.frames), rel = ed.vn > 0 ? (anchor - ed.v0) / ed.vn : 0.5;
      ed.v0 = anchor - rel * nvn; ed.vn = nvn; ed.full = false; clampView(D.frames); ed.dirty = true; uiEd('view');
    }
    function edZoomTo(a, b) {
      const D = edData(); if (!D) return; const pad = Math.max(1, (b - a) * 0.05);
      ed.v0 = a - pad; ed.vn = (b - a) + 2 * pad; ed.full = false; clampView(D.frames); ed.dirty = true; uiEd('view');
    }
    function edReveal(f) {   // houd een positie in beeld
      const D = edData(); if (!D) return; if (f < ed.v0) ed.v0 = f; else if (f > ed.v0 + ed.vn) ed.v0 = f - ed.vn; clampView(D.frames); ed.dirty = true; uiEd('view');
    }
    function edSnap(f) {
      const D = edData(); if (!D) return Math.round(f);
      return ed.snap ? zeroSnap(D.ch, f, Math.max(32, Math.min(Math.ceil(D.rate * 0.02), Math.ceil(ed.vn / ed.W * 16)))) : clamp(Math.round(f), 0, D.frames);
    }
    // ongedaan/opnieuw: een stap onthoudt de velden die een bewerking raakt, plus de oude en nieuwe samplerecords
    const snapOf = t => ({ id: t.obj.sampleId, on: t.obj.loop.on, ls: t.obj.loop.start, le: t.obj.loop.end, st: t.kind === 'l' ? t.obj.start : 0, en: t.kind === 'l' ? t.obj.end : 1, rec: store.get(t.obj.sampleId) || null, sel: ed.sel ? ed.sel.slice() : null, cur: ed.cur });
    function setFields(t, s) { const o = t.obj; o.sampleId = s.id; o.loop.on = s.on; o.loop.start = s.ls; o.loop.end = s.le; if (t.kind === 'l') { o.start = s.st; o.end = s.en; } }
    const poolRef = (rec, d) => { if (!rec) return; const n = (ed.pool.get(rec) || 0) + d; if (n > 0) ed.pool.set(rec, n); else ed.pool.delete(rec); };
    const poolBytes = () => { let t = 0; for (const r of ed.pool.keys()) t += r.bytes; return t; };
    const entRecs = en => (en.prog ? en.recs.map(x => x[1]) : [en.b.rec, en.a.rec]);
    const dropEntry = en => { for (const r of entRecs(en)) poolRef(r, -1); };
    function pushUndo(en) {
      for (const x of ed.redo) dropEntry(x); ed.redo.length = 0;
      ed.undo.push(en); for (const r of entRecs(en)) poolRef(r, 1);
      while (ed.undo.length > UNDO_MAX || (poolBytes() > UNDO_BYTES && ed.undo.length > 1)) dropEntry(ed.undo.shift());
    }
    function clearHistory() { ed.undo.length = 0; ed.redo.length = 0; ed.pool.clear(); }
    function edAfter() { edStop(); ed.dec = null; gcStore(); warm(); notesNotify(); if (ui) ui.refreshAll(); ed.dirty = true; }
    function edStep(undo) {
      const from = undo ? ed.undo : ed.redo, to = undo ? ed.redo : ed.undo;
      if (!from.length) { say(undo ? E.noUndo : E.noRedo); return; }
      if (from[from.length - 1].prog) {   // programma-stap: pads en/of slices
        const en = from[from.length - 1], side = undo ? 'b' : 'a', other = undo ? 'a' : 'b';
        progApply(en, side);
        if (liveBytes() > MAX_PCM) { progApply(en, other); gcStore(); say(T.memFull); return; }
        from.pop(); to.push(en); prog.bank = en.at[0]; prog.pad = en.at[1]; prog.layer = en.at[2]; ed.dec = null;
        edAfter(); say(fillT(undo ? E.undone : E.redone, en.label)); return;
      }
      const en = from[from.length - 1], t = locTarget(en.loc);
      if (!t) { dropEntry(from.pop()); say(E.gone); return; }
      const s = undo ? en.b : en.a, prev = snapOf(t), added = !!(s.rec && !store.has(s.id));
      if (added) store.set(s.id, s.rec);
      setFields(t, s);
      if (liveBytes() > MAX_PCM) { setFields(t, prev); if (added) store.delete(s.id); say(T.memFull); return; }
      from.pop(); to.push(en);
      prog.bank = en.loc.b; prog.pad = en.loc.p; if (en.loc.z != null) { ed.useZone = true; selZone = en.loc.z; } else { ed.useZone = false; prog.layer = en.loc.l; }
      ed.key = edKey(t); ed.sel = s.sel ? s.sel.slice() : null; ed.cur = s.cur; ed.dec = null;
      const D = edData(); if (D) { ed.full = true; ed.v0 = 0; ed.vn = D.frames; clampView(D.frames); }
      edAfter(); say(fillT(undo ? E.undone : E.redone, en.label));
    }
    // een bewerking vastleggen: res = { ch, rate }, o = { fr: positie-afbeelding (oude frame -> nieuwe), sel, cur }
    function edCommit(label, res, o) {
      const t = edTarget(), D = edData(); if (!t || !D) return false;
      const N = D.frames, M = res.ch[0].length, fr = o && o.fr;
      if (M < 1) { say(E.emptyResult); return false; }
      if (M / res.rate > MAX_SEC) { say(T.tooLong); return false; }
      const oldId = t.obj.sampleId, oldRec = store.get(oldId) || null, info = sampleInfo(oldId), before = snapOf(t), map = fr || (f => f);
      const meta = { root: info ? info.root : null, license: oldRec ? oldRec.license : null, loop: null, slices: [] };
      if (oldRec && oldRec.loop) { const ls = clamp(map(oldRec.loop.start * N) / M, 0, 0.9999), le = clamp(map(oldRec.loop.end * N) / M, 0, 1); if (le - ls >= 0.0002) meta.loop = { start: ls, end: le }; }
      if (oldRec) { const ms = mapSlices(oldRec.slices, oldRec.sliceEnds, map, M); meta.slices = ms.slices; meta.ends = ms.ends; }
      const rec = packRec(res.ch, res.rate, info ? info.name : '', meta), id = recId(rec), had = store.has(id);
      if (!had) store.set(id, rec);
      const fields = { id, on: t.obj.loop.on, ls: t.obj.loop.start, le: t.obj.loop.end, st: t.kind === 'l' ? t.obj.start : 0, en: t.kind === 'l' ? t.obj.end : 1 };
      if (M !== N || fr) {   // lengte of posities veranderd: start, einde en lus volgen de bewerking
        const rf = x => clamp(map(x * N) / M, 0, 1);
        if (t.kind === 'l') { let a = rf(fields.st), b = rf(fields.en); if (!(b - a >= 0.0002)) { a = 0; b = 1; } fields.st = clamp(a, 0, 0.9999); fields.en = clamp(b, fields.st + 0.0001, 1); }
        let a = rf(fields.ls), b = rf(fields.le); if (!(b - a >= 0.0002)) { a = 0; b = 1; } fields.ls = clamp(a, 0, 0.9999); fields.le = clamp(b, fields.ls + 0.0001, 1);
      }
      if (id === oldId && fields.on === before.on && fields.ls === before.ls && fields.le === before.le && fields.st === before.st && fields.en === before.en) {   // geen verschil: geen stap in de geschiedenis
        if (o && o.sel !== undefined) ed.sel = o.sel ? o.sel.slice() : null; if (o && o.cur != null) ed.cur = o.cur; ed.dirty = true; uiEd('refresh'); say(E.nothing); return false;
      }
      setFields(t, fields);
      if (liveBytes() > MAX_PCM) { setFields(t, before); if (!had) store.delete(id); say(T.memFull); return false; }
      ed.sel = o && o.sel !== undefined ? (o.sel ? o.sel.slice() : null) : ed.sel; ed.cur = o && o.cur != null ? o.cur : ed.cur;
      ed.key = edKey(t); ed.dec = null;
      pushUndo({ label, loc: t.loc, b: before, a: snapOf(t) });
      if (ed.full || M !== N) { ed.full = true; ed.v0 = 0; ed.vn = M; }
      edAfter(); uiEd('view'); say(fillT(E.done, label));
      return true;
    }
    function edMark(label, mutate) {   // een wijziging van alleen start, einde of lus (het sample zelf blijft)
      const t = edTarget(); if (!t || !t.obj.sampleId) return false;
      const before = snapOf(t); mutate(t); const after = snapOf(t);
      if (JSON.stringify([before.on, before.ls, before.le, before.st, before.en]) === JSON.stringify([after.on, after.ls, after.le, after.st, after.en])) return false;
      pushUndo({ label, loc: t.loc, b: before, a: after }); ed.dirty = true; if (ui) ui.refreshAll(); say(fillT(E.done, label)); return true;
    }
    function edOp(op, arg) {
      try { edRun(op, arg); } catch (err) { say(err && err.message ? err.message : String(err)); }
    }
    function edRun(op, arg) {
      const t = edTarget(), D = edData(); if (!t || !D) { say(E.needSample); return; }
      const N = D.frames, rate = D.rate, ch = D.ch, hasSel = !!ed.sel, a = hasSel ? ed.sel[0] : 0, b = hasSel ? ed.sel[1] : N, L = E[{ gain: 'gainDo', pitch: 'pitchDo', bits: 'bitDo', rate: 'rateDo', xfade: 'xfadeDo' }[op] || op] || op;
      const needSel = () => { if (!hasSel) { say(E.needSel); return true; } return false; };
      const same = (nc, extra) => edCommit(L, { ch: nc, rate }, extra || {});   // lengte blijft gelijk
      const edit = fn => { const nc = ch.map(c => c.slice()); fn(nc); return nc; };
      switch (op) {
        case 'trim': { if (needSel()) return; if (a === 0 && b === N) { say(E.nothing); return; } const M = b - a; edCommit(L, { ch: sliceCh(ch, a, b), rate }, { fr: f => clamp(f - a, 0, M), sel: [0, M], cur: 0 }); return; }
        case 'cut': case 'del': {
          if (needSel()) return;
          if (op === 'cut') ed.clip = { ch: sliceCh(ch, a, b), rate, channels: D.channels };
          if (b - a >= N) { say(E.emptyResult); return; }
          const w = b - a; edCommit(L, { ch: joinCh([sliceCh(ch, 0, a), sliceCh(ch, b, N)], D.channels), rate }, { fr: f => (f <= a ? f : f >= b ? f - w : a), sel: null, cur: a }); return;
        }
        case 'copy': { ed.clip = { ch: sliceCh(ch, a, b), rate, channels: D.channels }; say(fillT(E.copied, b - a)); uiEd('refresh'); return; }
        case 'paste': case 'insert': {
          if (!ed.clip) { say(E.clipEmpty); return; }
          const c = convertClip(ed.clip, rate, D.channels), len = c[0].length, at = op === 'paste' && hasSel ? a : clamp(ed.cur, 0, N), end = op === 'paste' && hasSel ? b : at;
          edCommit(L, { ch: joinCh([sliceCh(ch, 0, at), c, sliceCh(ch, end, N)], D.channels), rate }, { fr: f => (f <= at ? f : f >= end ? f + len - (end - at) : at), sel: [at, at + len], cur: at }); return;
        }
        case 'silence': {
          const ms = num(arg, NaN, 1, 60000); if (!Number.isFinite(ms)) { say(E.badValue); return; }
          const len = Math.max(1, Math.round(ms / 1000 * rate)), at = clamp(ed.cur, 0, N), z = Array.from({ length: D.channels }, () => new Float32Array(len));
          edCommit(L, { ch: joinCh([sliceCh(ch, 0, at), z, sliceCh(ch, at, N)], D.channels), rate }, { fr: f => (f <= at ? f : f + len), sel: [at, at + len], cur: at }); return;
        }
        case 'mute': { if (needSel()) return; same(edit(nc => { for (const c of nc) c.fill(0, a, b); })); return; }
        case 'normalize': {
          const pk = rangePeak(ch, a, b); if (pk < 1e-6) { say(E.silent); return; }
          const g = 1 / pk; same(edit(nc => { for (const c of nc) for (let i = a; i < b; i++) c[i] = clamp(c[i] * g, -1, 1); })); return;
        }
        case 'gain': {
          const db = num(arg, NaN, -96, 48); if (!Number.isFinite(db)) { say(E.badValue); return; }
          const g = dB2g(db); let clipped = 0;
          const nc = edit(nc2 => { for (const c of nc2) for (let i = a; i < b; i++) { const v = c[i] * g; if (v > 1 || v < -1) clipped++; c[i] = clamp(v, -1, 1); } });
          if (same(nc) && clipped) say(fillT(E.clipped, clipped)); return;
        }
        case 'fadeIn': case 'fadeOut': {
          const sh = FADE_SHAPES[arg] || FADE_SHAPES.lin, n = b - a; if (n < 2) { say(E.nothing); return; }
          same(edit(nc => { for (const c of nc) for (let i = 0; i < n; i++) { const t2 = i / (n - 1); c[a + i] *= sh(op === 'fadeIn' ? t2 : 1 - t2); } })); return;
        }
        case 'reverse': { same(edit(nc => { for (const c of nc) { const seg = c.slice(a, b); for (let i = 0; i < seg.length; i++) c[a + i] = seg[seg.length - 1 - i]; } })); return; }
        case 'dc': {
          same(edit(nc => { for (const c of nc) { let m = 0; for (let i = a; i < b; i++) m += c[i]; m /= Math.max(1, b - a); for (let i = a; i < b; i++) c[i] = clamp(c[i] - m, -1, 1); } })); return;
        }
        case 'mono': {
          if (D.channels === 1) { say(E.monoAlready); return; }
          const m = new Float32Array(N); for (let i = 0; i < N; i++) { let s2 = 0; for (const c of ch) s2 += c[i]; m[i] = s2 / ch.length; }
          same([m]); return;
        }
        case 'pitch': {
          const st = num(arg, NaN, -48, 48); if (!Number.isFinite(st)) { say(E.badValue); return; } if (st === 0) { say(E.nothing); return; }
          const ratio = Math.pow(2, st / 12), seg = sliceCh(ch, a, b).map(c => resample(c, ratio)), m = seg[0].length;
          edCommit(L, { ch: joinCh([sliceCh(ch, 0, a), seg, sliceCh(ch, b, N)], D.channels), rate }, { fr: f => (f <= a ? f : f >= b ? f - (b - a) + m : a + (f - a) / ratio), sel: hasSel ? [a, a + m] : null }); return;
        }
        case 'bits': {
          const bits = int(arg, NaN, 2, 15); if (!Number.isFinite(bits)) { say(E.badValue); return; }
          const m = Math.pow(2, bits - 1) - 1; same(edit(nc => { for (const c of nc) for (let i = a; i < b; i++) c[i] = Math.round(clamp(c[i], -1, 1) * m) / m; })); return;
        }
        case 'rate': {
          const hz = num(arg, NaN, 100, rate); if (!Number.isFinite(hz)) { say(E.badValue); return; }
          const f = rate / hz; same(edit(nc => { for (let k = 0; k < nc.length; k++) { const src = ch[k]; for (let i = a; i < b; i++) nc[k][i] = src[Math.min(N - 1, a + Math.round(Math.floor((i - a) / f) * f))]; } })); return;
        }
        case 'toStartEnd': {
          if (needSel()) return; if (t.kind !== 'l') { say(E.needLayer); return; }
          edMark(L, tt => { tt.obj.start = clamp(a / N, 0, 0.9999); tt.obj.end = clamp(b / N, tt.obj.start + 0.0001, 1); }); return;
        }
        case 'toLoop': {
          if (needSel()) return;
          edMark(L, tt => { tt.obj.loop.on = true; tt.obj.loop.start = clamp(a / N, 0, 0.9999); tt.obj.loop.end = clamp(b / N, tt.obj.loop.start + 0.0001, 1); }); return;
        }
        case 'xfade': {
          const lp = t.obj.loop; if (!lp.on) { say(E.needLoop); return; }
          const ls = Math.round(lp.start * N), le = Math.round(lp.end * N), X = Math.min(Math.round(num(arg, 20, 1, 5000) / 1000 * rate), ls, Math.floor((le - ls) / 2));
          if (X < 2) { say(E.noRoom); return; }
          same(edit(nc => { for (const c of nc) { const src = c.slice(); for (let i = 0; i < X; i++) { const w = (i + 1) / X; c[le - X + i] = src[le - X + i] * Math.cos(w * Math.PI / 2) + src[ls - X + i] * Math.sin(w * Math.PI / 2); } } })); return;
        }
        case 'proc': {
          const P2 = procSeg(arg.fx, arg.p, sliceCh(ch, a, b), rate); if (!P2) { say(E.badValue); return; }
          let clipped = 0; const nc = edit(n2 => { n2.forEach((c, k) => { for (let i = 0; i < P2[k].length; i++) { const v = P2[k][i]; if (v > 1 || v < -1) clipped++; c[a + i] = v; } }); });
          if (edCommit(E.fxNames[arg.fx], { ch: nc, rate }, {}) && clipped) say(fillT(E.clipped, clipped)); return;
        }
        case 'tempo': {   // een lus op een doel-BPM brengen door te hersamplen (de toonhoogte verandert mee)
          const cur = arg.beats * 60 / ((b - a) / rate), ratio = arg.target / cur;
          if (!(ratio >= 0.25 && ratio <= 4)) { say(E.badValue); return; } if (Math.abs(ratio - 1) < 1e-6) { say(E.nothing); return; }
          const seg = sliceCh(ch, a, b).map(c => resample(c, ratio)), m = seg[0].length;
          edCommit(E.fxNames.tempo, { ch: joinCh([sliceCh(ch, 0, a), seg, sliceCh(ch, b, N)], D.channels), rate }, { fr: f => (f <= a ? f : f >= b ? f - (b - a) + m : a + (f - a) / ratio), sel: hasSel ? [a, a + m] : null }); return;
        }
        default: return;
      }
    }
    // beluisteren: selectie (of vanaf de cursor), lus, scrubben; alles via de stereomix van het apparaat
    function edStop() {
      const p = ed.play; if (!p) return; ed.play = null; const now = ctx.currentTime;
      try { p.g.gain.cancelScheduledValues(now); p.g.gain.setValueAtTime(p.g.gain.value, now); p.g.gain.linearRampToValueAtTime(0, now + 0.01); p.src.stop(now + 0.03); } catch (e) { /* al gestopt */ }
      ed.dirty = true;
    }
    const edEnd = (src, g, p) => { try { src.disconnect(); g.disconnect(); } catch (e) { /* los */ } nodes.delete(src); nodes.delete(g); if (p && ed.play === p) { ed.play = null; ed.dirty = true; } };
    function edPlay(loop) {
      edStop(); const D = edData(); if (!D) { say(E.needSample); return; }
      let a, b; if (ed.sel) { a = ed.sel[0]; b = ed.sel[1]; } else if (loop) { a = 0; b = D.frames; } else { a = clamp(ed.cur, 0, D.frames - 1); b = D.frames; }
      edPlayRange(a, b, loop);
    }
    function edPlayRange(a, b, loop) {   // een stuk van het gekozen sample beluisteren (selectie, lus, slice)
      edStop(); const D = edData(); if (!D) return;
      const buf = bufferFor(D.id, false); if (!buf) return;
      if (b - a < 2) return;
      const now = ctx.currentTime, src = own(ctx.createBufferSource()), g = own(ctx.createGain()), r = D.rate;
      src.buffer = buf; g.gain.setValueAtTime(0, now); g.gain.linearRampToValueAtTime(1, now + 0.003); src.connect(g); g.connect(master);
      if (loop) { src.loop = true; src.loopStart = a / r; src.loopEnd = b / r; src.start(now, a / r); }
      else { const dur = (b - a) / r; src.start(now, a / r, dur); g.gain.setValueAtTime(1, now + Math.max(0.004, dur - 0.004)); g.gain.linearRampToValueAtTime(0, now + dur); }
      const p = { src, g, t0: now, a, b, loop: !!loop, rate: r };
      src.onended = () => edEnd(src, g, p);
      ed.play = p; ed.dirty = true;
    }
    function edGrain(f) {
      const D = edData(); if (!D) return; const buf = bufferFor(D.id, false), now = ctx.currentTime; if (!buf || now - ed.lastGrain < 0.035) return; ed.lastGrain = now;
      const src = own(ctx.createBufferSource()), g = own(ctx.createGain()); src.buffer = buf;
      g.gain.setValueAtTime(0, now); g.gain.linearRampToValueAtTime(0.9, now + 0.004); g.gain.setValueAtTime(0.9, now + 0.07); g.gain.linearRampToValueAtTime(0, now + 0.09);
      src.connect(g); g.connect(master); src.start(now, clamp(f, 0, D.frames - 1) / D.rate, 0.1); src.onended = () => edEnd(src, g, null);
    }
    const edPos = () => { const p = ed.play; if (!p) return -1; const f = (ctx.currentTime - p.t0) * p.rate; return p.loop ? p.a + (f % (p.b - p.a)) : Math.min(p.b, p.a + f); };

    // ---------- stap 3: programma-stappen met ongedaan, chop (slices), Process en Flatten ----------
    // Een programma-stap legt de pads die hij raakt vast (als JSON) en de slices van de samples; ongedaan/opnieuw zet ze terug. Samples die erbij horen blijven in de stap bewaard.
    Object.assign(ed, { mode: 'edit', slSel: 0, link: true, busy: false });
    const recOf = () => { const D = edData(); return D ? store.get(D.id) || null : null; };
    const sliceJson = r => JSON.stringify([r.slices, r.sliceEnds || []]);
    const padJson = i => JSON.stringify(serPadFull(padOf(i)));
    function padIdsOf(json) {
      const o = JSON.parse(json), s = new Set();
      for (const l of o.layers) if (l && l.sampleId) s.add(l.sampleId);
      for (const z of o.zones) if (z.sampleId) s.add(z.sampleId);
      return s;
    }
    function progBegin(idxs) {
      const h = { idxs: idxs.slice(), at: [prog.bank, prog.pad, prog.layer], pads: idxs.map(padJson), sl: new Map(), recs: new Map() };
      for (const [id, r] of store) h.sl.set(id, sliceJson(r));
      for (const j of h.pads) for (const id of padIdsOf(j)) { const r = store.get(id); if (r) h.recs.set(id, r); }
      return h;
    }
    function progApply(en, side) {
      for (const [id, r] of en.recs) if (!store.has(id)) store.set(id, r);
      const s = en[side];
      en.idxs.forEach((i, k) => { prog.banks[i >> 4].pads[i & 15] = nPad(JSON.parse(s.pads[k]), hasSample); if (prt[i]) padLive(i); });
      for (const [id, j] of s.sl) { const r = store.get(id); if (r) { const v = JSON.parse(j); r.slices = v[0]; r.sliceEnds = v[1]; } }
    }
    function progRollback(h) { progApply({ idxs: h.idxs, recs: h.recs, b: { pads: h.pads, sl: [...h.sl] } }, 'b'); gcStore(); }
    function progEnd(h, label, quiet) {   // legt de wijziging sinds progBegin vast als één stap; geeft false als er niets veranderde of het niet past
      const aPads = h.idxs.map(padJson), bSl = [], aSl = [];
      for (const [id, r] of store) { const j = sliceJson(r), bj = h.sl.get(id); if (bj !== undefined && bj !== j) { bSl.push([id, bj]); aSl.push([id, j]); } }
      if (aPads.every((j, k) => j === h.pads[k]) && !bSl.length) { gcStore(); if (!quiet) say(E.nothing); return false; }
      const recs = new Map(h.recs);
      for (const j of aPads) for (const id of padIdsOf(j)) { const r = store.get(id); if (r) recs.set(id, r); }
      for (const [id] of aSl) recs.set(id, store.get(id));
      const en = { label, prog: true, idxs: h.idxs, at: h.at, b: { pads: h.pads, sl: bSl }, a: { pads: aPads, sl: aSl }, recs: [...recs] };
      if (liveBytes() > MAX_PCM) { progRollback(h); say(T.memFull); return false; }
      pushUndo(en); return true;
    }
    function progRun(label, idxs, mutate, quiet) {
      const h = progBegin(idxs); let ok = false;
      try { ok = mutate() !== false; } catch (err) { progRollback(h); throw err; }
      if (!ok) { progRollback(h); return false; }
      const done = progEnd(h, label, quiet);
      if (done) { edAfter(); say(fillT(E.done, label)); } else if (ui) ui.refreshAll();
      return done;
    }

    // slices zijn markeringen in het sample (beginposities in samples, plus optioneel eigen eindposities); een demo-sample wordt bij de eerste chop een eigen sample
    const pairsOf = cur => cur.slices.map((s, k) => [s, cur.ends && cur.ends[k] > 0 ? cur.ends[k] : 0]);
    function sliceOp(label, fn) {
      const t = edTarget(), D = edData(); if (!t || !D) { say(E.needSample); return false; }
      const rec0 = store.get(D.id), r = fn(rec0 ? { slices: rec0.slices, ends: rec0.sliceEnds || [] } : { slices: [], ends: [] }, D); if (!r) return false;
      return progRun(label, [t.loc.b * NPAD + t.loc.p], () => {
        let rec = store.get(D.id);
        if (!rec) {
          const inf = sampleInfo(D.id); rec = packRec(D.ch, D.rate, D.name, { root: inf ? inf.root : null, loop: inf && inf.loop ? { start: inf.loop.start, end: inf.loop.end } : null });
          const id = recId(rec); if (store.has(id)) rec = store.get(id); else store.set(id, rec); t.obj.sampleId = id;
        }
        rec.slices = r.slices; rec.sliceEnds = r.ends || []; return true;
      });
    }
    function chopEqual(n) {
      n = int(n, 16, 2, 64);
      return sliceOp(E.chopEq, (cur, D) => pairsOut(Array.from({ length: n }, (_, k) => [Math.min(D.frames - 1, Math.round(k * D.frames / n)), 0])));
    }
    function chopThreshold(thrDb, minMs) {
      thrDb = num(thrDb, -24, -80, -1); minMs = num(minMs, 60, 1, 2000);
      return sliceOp(E.chopThr, (cur, D) => {
        const on = detectOnsets(D.ch, D.rate, thrDb, minMs).map(f => (ed.snap ? zeroSnap(D.ch, f, 32) : f));
        if (!on.length) { say(E.nothing); return null; }
        return pairsOut(on.map(f => [clamp(f, 0, D.frames - 1), 0]));
      });
    }
    function chopBpm(bpm, perBeats) {
      bpm = num(bpm, NaN, 20, 400); if (!Number.isFinite(bpm)) { say(E.badValue); return false; }
      return sliceOp(E.chopBpm, (cur, D) => {
        const step = D.rate * 60 / bpm * perBeats, pr = []; for (let k = 0; k * step < D.frames - 2 && pr.length < MAX_SLICES; k++) pr.push([Math.round(k * step), 0]);
        return pairsOut(pr);
      });
    }
    function slAddAt(f) {
      const D = edData(); if (!D) { say(E.needSample); return false; }
      const rec = store.get(D.id); if (rec && rec.slices.length >= MAX_SLICES) { say(E.slFull); return false; }
      f = clamp(Math.round(f), 0, D.frames - 1);
      if (rec && rec.slices.some(v => Math.abs(v - f) < 1)) { say(E.slExists); return false; }
      const ok = sliceOp(E.slAdd, cur => { const pr = pairsOf(cur); pr.push([f, 0]); return pairsOut(pr); });
      if (ok) { const r2 = recOf(); if (r2) ed.slSel = Math.max(0, r2.slices.indexOf(f)); }
      return ok;
    }
    function slDelSel() {
      const rec = recOf(); if (!rec || !rec.slices.length) { say(E.slNoSel); return false; }
      const i = clamp(ed.slSel, 0, rec.slices.length - 1);
      const ok = sliceOp(E.slDel, cur => { const pr = pairsOf(cur); pr.splice(i, 1); return pairsOut(pr); });
      if (ok) ed.slSel = clamp(i - 1, 0, 999);
      return ok;
    }
    function slClearAll() { const rec = recOf(); if (!rec || !rec.slices.length) { say(E.nothing); return false; } return sliceOp(E.slClear, () => ({ slices: [], ends: [] })); }
    function slSetLink(on) { ed.link = on; if (on) { const rec = recOf(); if (rec && rec.sliceEnds && rec.sliceEnds.some(v => v > 0)) sliceOp(E.link, cur => ({ slices: cur.slices.slice(), ends: [] })); } ed.dirty = true; }
    function slPlay(i) {
      const rec = recOf(), D = edData(); if (!rec || !D || !rec.slices.length) return;
      i = clamp(i, 0, rec.slices.length - 1); ed.slSel = i; const [s, e] = sliceRanges(rec.slices, rec.sliceEnds, D.frames)[i];
      ed.cur = s; edReveal(s); edPlayRange(s, e, false); ed.dirty = true; uiEd('refresh');
    }
    function slToPads(o) {   // slice n naar pad (start + n); laag 1 = hetzelfde sample met start en einde van de slice; één stap
      const t = edTarget(), D = edData(), rec = recOf(); if (!t || !D || !rec || !rec.slices.length) { say(E.spNeed); return false; }
      const first = int(o.bank, 0, 0, NBANK - 1) * NPAD + int(o.pad, 0, 0, NPAD - 1), ranges = sliceRanges(rec.slices, rec.sliceEnds, D.frames), tail = o.tail ? Math.round(num(o.tailMs, 100, 0, 5000) / 1000 * D.rate) : 0;
      const idxs = []; let skipped = 0, nofit = 0;
      ranges.forEach((_, k) => { const i = first + k; if (i >= NBANK * NPAD) { nofit++; return; } if (o.onlyEmpty && hasSound(padOf(i))) { skipped++; return; } idxs.push(i); });
      if (!idxs.length) { say(fillT(E.spDone, 0, skipped, nofit)); return false; }
      const sid = D.id, info = sampleInfo(sid);
      const ok = progRun(E.spLabel, idxs, () => {
        for (const i of idxs) {
          const k = i - first, [s, e] = ranges[k], old = padOf(i), p = defPad(), l = p.layers[0];
          p.name = fillT(E.slN, k + 1); p.output = old.output;
          l.sampleId = sid; l.start = clamp(s / D.frames, 0, 0.9999); l.end = clamp(Math.min(D.frames, e + tail) / D.frames, l.start + 0.0001, 1); l.root = info && info.root != null ? info.root : null;
          prog.banks[i >> 4].pads[i & 15] = p; if (prt[i]) padLive(i);
        }
        return true;
      });
      if (ok) say(fillT(E.spDone, idxs.length, skipped, nofit));
      return ok;
    }

    // Process: filter, drive, bitcrusher, EQ en compressor als echte bewerking van het sample (directe DSP), met beluisteren
    function procParams(fx, g) {   // g(id) geeft de waarde van een veld
      if (fx === 'filter') return { type: ['lp', 'hp', 'bp'].includes(g('fType')) ? g('fType') : 'lp', f0: num(+g('fCut'), 1000, 20, 20000), f1: num(+g('fCutEnd'), 4000, 20, 20000), q: num(+g('fQ'), 0.71, 0.1, 30), slope: +g('fSlope') === 24 ? 24 : 12, sweep: !!g('fSweep') };
      if (fx === 'drive') return { db: num(+g('drDb'), 12, 0, 48), mix: num(+g('drMix'), 100, 0, 100) };
      if (fx === 'crush') return { bits: int(+g('crBits'), 8, 2, 16), hz: num(+g('crHz'), 11025, 100, 192000) };
      if (fx === 'eq') return { low: num(+g('eqLow'), 0, -18, 18), mid: num(+g('eqMid'), 0, -18, 18), high: num(+g('eqHigh'), 0, -18, 18) };
      if (fx === 'comp') return { thr: num(+g('cpThr'), -18, -60, 0), ratio: num(+g('cpRatio'), 4, 1, 40), atk: num(+g('cpAtk'), 5, 0.1, 500), rel: num(+g('cpRel'), 100, 5, 5000), makeup: num(+g('cpMk'), 0, -24, 24) };
      return null;
    }
    function edPlayBuf(chs, rate, at) {   // een berekend stuk beluisteren (preview), via de stereomix
      edStop(); const len = chs[0].length; if (len < 2) return;
      const buf = ctx.createBuffer(chs.length, len, rate); chs.forEach((c, k) => buf.getChannelData(k).set(c));
      const now = ctx.currentTime, src = own(ctx.createBufferSource()), g = own(ctx.createGain()), dur = len / rate;
      src.buffer = buf; g.gain.setValueAtTime(0, now); g.gain.linearRampToValueAtTime(1, now + 0.003); src.connect(g); g.connect(master);
      src.start(now); g.gain.setValueAtTime(1, now + Math.max(0.004, dur - 0.004)); g.gain.linearRampToValueAtTime(0, now + dur);
      const p = { src, g, t0: now, a: at, b: at + len, loop: false, rate }; src.onended = () => edEnd(src, g, p); ed.play = p; ed.dirty = true;
    }
    function procPreview(fx, p) {
      const D = edData(); if (!D) { say(E.needSample); return; }
      const a = ed.sel ? ed.sel[0] : 0, b = ed.sel ? ed.sel[1] : D.frames;
      const seg = sliceCh(D.ch, a, b), out = fx === 'tempo' ? seg.map(c => resample(c, p.ratio)) : procSeg(fx, p, seg, D.rate);
      if (out) edPlayBuf(out, D.rate, a);
    }

    // Flatten en resample: een pad (alle lagen, envelope, filter, tune, niveau en panorama; zonder uitgangskeuze) of de selectie naar een nieuw sample, met OfflineAudioContext
    const offDest = oc => oc['destination'];   // de uitgang van de eigen offline-context (niet die van de host)
    function offlineVoice(oc, bus, pad, src, v01, hold) {
      const buf = bufferFor(src.sid, pad.reverse); if (!buf) return 0;
      const D = buf.duration || (buf.length / buf.sampleRate), e = pad.env, f = pad.filter;
      let s0 = src.start, s1 = src.end, l0 = src.loop.start, l1 = src.loop.end;
      if (pad.reverse) { const a0 = s0, b0 = l0; s0 = 1 - s1; s1 = 1 - a0; l0 = 1 - l1; l1 = 1 - b0; }
      let startSec = s0 * D + Math.max(0, src.offsetMs) / 1000;
      const tStart = Math.max(0, -src.offsetMs) / 1000, endSec = s1 * D, looped = src.loop.on && !pad.oneShot && (l1 - l0) * D >= 0.002;
      const cents = src.cents + pad.fine + clamp(pad.tune, -24, 24) * 100, rate = Math.pow(2, cents / 1200);
      if (looped) { if (startSec >= l1 * D) startSec = l0 * D; } else if (endSec - startSec < 0.0003) return 0;
      const source = oc.createBufferSource(); source.buffer = buf;
      try { source.detune.value = cents; } catch (err) { source.playbackRate.value = rate; }
      const lg = oc.createGain(), gain0 = v01 * src.level * Math.pow(10, src.gain / 20); lg.gain.value = gain0; let tail = lg; source.connect(lg);
      if (Math.abs(src.pan) > 0.001) { const pn = oc.createStereoPanner(); pn.pan.value = src.pan; tail.connect(pn); tail = pn; }
      const A = Math.max(e.attack, 0.0005), Dc = Math.max(e.decay, 0.005);
      if (f.type !== 'off') {
        const bq = oc.createBiquadFilter(); bq.type = f.type === 'lp' ? 'lowpass' : f.type === 'hp' ? 'highpass' : 'bandpass';
        bq.frequency.value = clamp(f.cutoff, 20, Math.min(20000, oc.sampleRate * 0.45)); bq.Q.value = f.type === 'bp' ? 0.5 + f.res * 12 : f.res * 20;
        const vd = f.velAmt * (v01 - 1) * 4800; bq.detune.setValueAtTime(vd, tStart);
        if (f.envAmt !== 0) { const sus = e.shape === 'ad' ? 0 : e.sustain; bq.detune.linearRampToValueAtTime(vd + f.envAmt * 6000, tStart + A); bq.detune.linearRampToValueAtTime(vd + f.envAmt * 6000 * sus, tStart + A + Dc); }
        tail.connect(bq); tail = bq;
      }
      const eg = oc.createGain(); eg.gain.setValueAtTime(0, tStart); eg.gain.linearRampToValueAtTime(1, tStart + A);
      let stopAt = Infinity;
      if (e.shape === 'ad') { eg.gain.exponentialRampToValueAtTime(0.0001, tStart + A + Dc); stopAt = tStart + A + Dc + 0.02; }
      else if (e.sustain < 0.999) eg.gain.exponentialRampToValueAtTime(Math.max(e.sustain, 0.0001), tStart + A + Dc);
      tail.connect(eg);
      let end = eg;
      if (!pad.oneShot) { const rel = oc.createGain(); rel.gain.setValueAtTime(1, hold); rel.gain.linearRampToValueAtTime(0, hold + e.release); eg.connect(rel); end = rel; stopAt = Math.min(stopAt, hold + e.release + 0.03); }
      end.connect(bus);
      if (looped) { source.loop = true; source.loopStart = l0 * D; source.loopEnd = l1 * D; source.start(tStart, startSec); }
      else {
        const dur = endSec - startSec, real = dur / rate; source.start(tStart, startSec, dur);
        if (real > 0.008) { lg.gain.setValueAtTime(gain0, tStart + real - 0.003); lg.gain.linearRampToValueAtTime(0, tStart + real); }
      }
      if (stopAt < Infinity) { try { source.stop(stopAt); } catch (err) { /* ok */ } }
      return looped ? Infinity : tStart + endSec / rate - startSec / rate;   // natuurlijke lengte van deze laag in seconden
    }
    function trimTail(ch, rate) {   // stilte (onder -80 dB) aan het eind weg, minstens 1 ms houden
      let last = 0; const thr = 1e-4; for (const c of ch) for (let i = c.length - 1; i >= last; i--) if (Math.abs(c[i]) > thr) { last = i + 1; break; }
      const keep = Math.max(Math.round(rate * 0.001), last); return keep >= ch[0].length ? ch : sliceCh(ch, 0, keep);
    }
    async function flatRender(o) {
      const OAC = globalThis.OfflineAudioContext || globalThis.webkitOfflineAudioContext; if (!OAC) throw new Error(E.noOffline);
      let ch, rate;
      if (o.src === 'sel') {
        const D = edData(); if (!D) throw new Error(E.needSample);
        const a = ed.sel ? ed.sel[0] : 0, b = ed.sel ? ed.sel[1] : D.frames, part = sliceCh(D.ch, a, b), len = part[0].length;
        if (len < 1) throw new Error(E.needSel);
        const oc = new OAC(part.length, len, D.rate), buf = oc.createBuffer(part.length, len, D.rate); part.forEach((c, k) => buf.getChannelData(k).set(c));
        const s = oc.createBufferSource(); s.buffer = buf; s.connect(offDest(oc)); s.start(0);
        const r = await oc.startRendering(); ch = Array.from({ length: r.numberOfChannels }, (_, k) => Float32Array.from(r.getChannelData(k))); rate = D.rate;
      } else {
        const i = o.padIdx, pad = padOf(i), v127 = clamp(o.vel, 1, 127), v01 = v127 / 127;
        const srcs = pickSources(pad.play === 'cycle' || pad.play === 'random' ? { ...pad, play: 'velocity' } : pad, i, v127, o.note);
        if (!srcs.length) throw new Error(E.flNoSound);
        rate = Math.round(ctx.sampleRate);   // zoals je het hoort: de samplefrequentie van de studio (een laag met een lagere frequentie wordt dan netjes omgezet)
        let hold = o.hold;
        if (!(hold > 0)) {   // automatisch: de langste laag (een lus zonder one-shot telt als 2 s)
          hold = 0.05; for (const src of srcs) { const b = bufferFor(src.sid, pad.reverse); if (!b) continue; const D = b.duration || (b.length / b.sampleRate), r = Math.pow(2, (src.cents + pad.fine + pad.tune * 100) / 1200), lp = src.loop.on && !pad.oneShot; hold = Math.max(hold, lp ? 2 : Math.max(0, -src.offsetMs) / 1000 + Math.max(0, (src.end - src.start) * D - Math.max(0, src.offsetMs) / 1000) / r); }
        }
        const total = hold + (pad.oneShot ? 0 : pad.env.release + 0.03) + Math.max(0, o.tail);
        if (total > MAX_SEC + 0.0001) throw new Error(E.flOverlong);
        const len = Math.max(64, Math.ceil(total * rate));
        let oc; try { oc = new OAC(2, len, rate); } catch (err) { rate = ctx.sampleRate; oc = new OAC(2, Math.max(64, Math.ceil(total * rate)), rate); }
        const bus = oc.createGain(), pn = oc.createStereoPanner(); bus.gain.value = Math.pow(10, clamp(pad.level, -60, 12) / 20); pn.pan.value = pad.pan; bus.connect(pn); pn.connect(offDest(oc));
        for (const src of srcs) { try { offlineVoice(oc, bus, pad, src, v01, hold); } catch (err) { /* een kapotte laag mag de rest niet stoppen */ } }
        const r = await oc.startRendering(); ch = [Float32Array.from(r.getChannelData(0)), Float32Array.from(r.getChannelData(1))]; rate = oc.sampleRate;
      }
      if (o.mono && ch.length === 2) { const m = new Float32Array(ch[0].length); for (let k = 0; k < m.length; k++) m[k] = (ch[0][k] + ch[1][k]) / 2; ch = [m]; }
      if (o.src === 'pad' && o.trim) ch = trimTail(ch, rate);
      if (o.norm) { const pk = rangePeak(ch, 0, ch[0].length); if (pk > 1e-6) { const g = 1 / pk; ch = ch.map(c => c.map(v => v * g)); } }
      return { ch, rate };
    }
    function flatCommit(res, o, tgt) {   // tgt: { loc, sampleId } van toen het renderen begon
      const t = locTarget(tgt.loc); if (!t || t.obj.sampleId !== tgt.sampleId) { say(E.flChanged); return false; }
      const srcIdx = tgt.loc.b * NPAD + tgt.loc.p, oldPad = padOf(srcIdx), srcInfo = sampleInfo(tgt.sampleId), srcRec = store.get(tgt.sampleId);
      const baseName = o.src === 'pad' ? (oldPad.name || (srcInfo && srcInfo.name) || padId(tgt.loc.b, tgt.loc.p).toUpperCase()) : (srcInfo ? srcInfo.name : '');
      const name = str(fillT(o.src === 'pad' ? E.flName : E.flSelName, baseName), 80);
      const rec = packRec(res.ch, res.rate, name, { root: o.note, license: srcRec ? srcRec.license : null }), id = recId(rec);
      let dest = o.dest; if (o.src !== 'pad' && dest === 'replace') dest = 'layer';
      const dIdx = dest === 'other' ? o.dBank * NPAD + o.dPad : srcIdx, idxs = dIdx === srcIdx ? [srcIdx] : [srcIdx, dIdx];
      if (dest === 'newlayer' && !oldPad.layers.some(l => !l.sampleId)) { say(E.flNoRoom); return false; }
      const fresh = () => { const l = defLayer(); l.sampleId = id; l.root = o.note; return l; };
      const ok = progRun(E.flGo, idxs, () => {
        if (!store.has(id)) store.set(id, rec);
        if (dest === 'newlayer') { const k = oldPad.layers.findIndex(l => !l.sampleId); oldPad.layers[k] = fresh(); }
        else if (dest === 'layer') { const k = t.kind === 'l' ? t.loc.l : prog.layer; oldPad.layers[k] = fresh(); if (t.kind === 'l') { const nl = oldPad.layers[k]; nl.velLo = t.obj.velLo; nl.velHi = t.obj.velHi; } }
        else {
          const p = defPad(); p.name = str(dest === 'replace' ? oldPad.name : name, 40); p.layers[0] = fresh();
          if (dest === 'replace') { p.mode = oldPad.mode; p.oneShot = oldPad.mode === 'drum'; p.output = oldPad.output; p.muteGroup = oldPad.muteGroup; p.polyphony = oldPad.polyphony; p.baseNote = oldPad.baseNote; }   // niveau, panorama, tune, envelope en filter zijn ingebakken: terug naar standaard
          prog.banks[dIdx >> 4].pads[dIdx & 15] = p; if (prt[dIdx]) padLive(dIdx);
        }
        return true;
      }, true);
      if (ok) say(fillT(E.flDone, (res.ch[0].length / res.rate).toFixed(2), res.rate));
      return ok;
    }
    async function flatten(o, preview) {
      if (ed.busy) return; const t = edTarget(); if (!t) return;
      o.padIdx = t.loc.b * NPAD + t.loc.p; const tgt = { loc: t.loc, sampleId: t.obj.sampleId };
      if (o.src === 'pad' && !hasSound(padOf(o.padIdx))) { say(E.flNoSound); return; }
      if (o.src === 'sel' && !tgt.sampleId) { say(E.needSample); return; }
      ed.busy = true; say(E.flBusy); const my = token;
      try {
        const res = await flatRender(o); if (dead || my !== token) return;
        if (preview) { edPlayBuf(res.ch, res.rate, 0); say(fillT(E.flDone, (res.ch[0].length / res.rate).toFixed(2), res.rate)); } else flatCommit(res, o, tgt);
      } catch (err) { say(err && err.message ? err.message : String(err)); }
      finally { ed.busy = false; }
    }

    // ---------- UI ----------
    const downs = new Map();
    let selZone = 0, kbBase = 48, tab = 'pad';
    const curI = () => prog.bank * NPAD + prog.pad;
    const curPad = () => padOf(curI());
    const curLayer = () => curPad().layers[prog.layer];
    const curZone = () => curPad().zones[selZone] || null;
    const fillSelect = (sel, opts, val) => {
      sel.textContent = '';
      for (const [v, t] of opts) { const o = document.createElement('option'); o.value = String(v); o.textContent = t; sel.appendChild(o); }
      sel.value = String(val);
    };
    const sampleOpts = () => [['', T.none], ...DEMOS.map(d => [d.id, '• ' + (d.name[lang] || d.name.en)]), ...[...store].map(([id, r]) => [id, (r.name || id) + ' (' + (r.frames / r.rate).toFixed(2) + ' s)'])];

    function padDown(i, key, note) {
      if (dead) return;
      selectPad(i >> 4, i & 15);
      const pad = padOf(i), n = pad.mode === 'key' ? (note == null ? pad.baseNote : note) : padNote(i >> 4, i & 15);
      const trg = trigger(i, ctx.currentTime, prog.padVel / 127, n, null, true);
      if (trg) downs.set(key, trg);
    }
    function padUp(key) { const trg = downs.get(key); if (trg) { releaseTrig(trg, ctx.currentTime); downs.delete(key); } }
    function selectPad(b, p, quiet) {
      if (prog.bank === b && prog.pad === p) return;
      prog.bank = b; prog.pad = p; selZone = 0; if (ui) ui.refreshAll();
    }

    function buildUI(el) {
      const ctl = [], handles = [], listeners = [];
      let col = null, statusEl = null, cv = null, cvCtx = null, infoEl = null, memEl = null, voicesEl = null, lastVoices = -1, ro = null;
      const wrap = document.createElement('div'); el.appendChild(wrap);
      const sh = typeof wrap.attachShadow === 'function' ? wrap.attachShadow({ mode: 'open' }) : wrap;
      const st = document.createElement('style'); st.textContent = CSS; sh.appendChild(st);
      const H = (tag, cls, parent, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; parent.appendChild(e); return e; };
      const on = (target, type, fn, opts) => { target.addEventListener(type, fn, opts); listeners.push([target, type, fn, opts]); };
      const app = H('div', 'app', sh);
      app.setAttribute('role', 'group'); app.setAttribute('aria-label', 'Pad Sampler');

      // --- bovenste regel: banken, naam, stemmen
      const top = H('div', 'row top', app);
      const bankBtns = BANK_LETTER.map((L, b) => {
        const bt = H('button', 'tabbtn', top, L); bt.type = 'button'; bt.setAttribute('aria-label', T.bank + ' ' + L);
        on(bt, 'click', () => { prog.bank = b; selZone = 0; refreshAll(); }); return bt;
      });
      const bankName = H('input', 'txt', top); bankName.type = 'text'; bankName.maxLength = 40; bankName.setAttribute('aria-label', T.bankName);
      on(bankName, 'change', () => { prog.banks[prog.bank].name = str(bankName.value, 40) || defBank(prog.bank).name; bankName.value = prog.banks[prog.bank].name; });
      on(bankName, 'pointerdown', e => e.stopPropagation());
      voicesEl = H('span', 'muted voices', top, '');
      const stopBtn = H('button', 'btn', top, T.stopAll); stopBtn.type = 'button';
      on(stopBtn, 'click', () => panicAt(ctx.currentTime));

      const main = H('div', 'main', app), left = H('div', 'left', main), right = H('div', 'right', main);

      // --- de pads
      const gridEl = H('div', 'pads', left), padEls = [];
      for (let p = 0; p < NPAD; p++) {
        const b = H('button', 'pad', gridEl); b.type = 'button';
        b.setAttribute('data-pk-role', 'pad'); b.setAttribute('data-pk-id', 'pad' + String(p + 1).padStart(2, '0')); b.setAttribute('data-pk-group', 'pads');
        const n1 = H('span', 'pn', b), n2 = H('span', 'pm', b), n3 = H('span', 'po', b);
        padEls.push({ b, n1, n2, n3, hit: false });
        const key = pid => 'p' + p + ':' + pid;
        on(b, 'pointerdown', e => { if (e.button > 0) return; e.preventDefault(); try { b.focus({ preventScroll: true }); } catch (err) { /* ok */ } try { b.setPointerCapture(e.pointerId); } catch (err) { /* ok */ } padDown(prog.bank * NPAD + p, key(e.pointerId)); b.classList.add('down'); });
        const up = e => { padUp(key(e.pointerId)); b.classList.remove('down'); };
        on(b, 'pointerup', up); on(b, 'pointercancel', up); on(b, 'lostpointercapture', up);
        on(b, 'contextmenu', e => e.preventDefault());
        on(b, 'keydown', e => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (!e.repeat) { padDown(prog.bank * NPAD + p, key('kb')); b.classList.add('down'); } return; }
          const d = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -4, ArrowDown: 4 }[e.key];
          if (d) { e.preventDefault(); const q = p + d; if (q >= 0 && q < NPAD) { padEls[q].b.focus(); selectPad(prog.bank, q); } }
        });
        on(b, 'keyup', e => { if (e.key === 'Enter' || e.key === ' ') { padUp(key('kb')); b.classList.remove('down'); } });
        on(b, 'dragover', e => e.preventDefault());
        on(b, 'drop', e => { e.preventDefault(); selectPad(prog.bank, p); if (e.dataTransfer && e.dataTransfer.files) loadFiles(e.dataTransfer.files); });
      }
      const padInfo = H('div', 'muted padinfo', left);

      // --- toetsen voor een keygroup
      const kbWrap = H('div', 'kbwrap', left), kbRow = H('div', 'row', kbWrap), keysEl = H('div', 'keys', kbWrap), keyEls = [];
      const octDown = H('button', 'btn', kbRow, '−'); octDown.type = 'button'; octDown.setAttribute('aria-label', T.octDown);
      const octUp = H('button', 'btn', kbRow, '+'); octUp.type = 'button'; octUp.setAttribute('aria-label', T.octUp);
      const octLbl = H('span', 'muted', kbRow, '');
      on(octDown, 'click', () => { kbBase = clamp(kbBase - 12, 0, 96); paintKeys(); });
      on(octUp, 'click', () => { kbBase = clamp(kbBase + 12, 0, 96); paintKeys(); });
      for (let k = 0; k < 25; k++) {
        const kb = H('button', 'key', keysEl); kb.type = 'button'; keyEls.push(kb);
        const noteOf = () => clamp(kbBase + k, 0, 127), key = pid => 'k' + k + ':' + pid;
        on(kb, 'pointerdown', e => { if (e.button > 0) return; e.preventDefault(); try { kb.setPointerCapture(e.pointerId); } catch (err) { /* ok */ } padDown(curI(), key(e.pointerId), noteOf()); kb.classList.add('down'); });
        const up = e => { padUp(key(e.pointerId)); kb.classList.remove('down'); };
        on(kb, 'pointerup', up); on(kb, 'pointercancel', up); on(kb, 'lostpointercapture', up);
        on(kb, 'keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (!e.repeat) { padDown(curI(), key('kb'), noteOf()); kb.classList.add('down'); } } });
        on(kb, 'keyup', e => { if (e.key === 'Enter' || e.key === ' ') { padUp(key('kb')); kb.classList.remove('down'); } });
      }
      function paintKeys() {
        const key = curPad().mode === 'key'; kbWrap.hidden = !key; if (!key) return;
        octLbl.textContent = noteName(clamp(kbBase, 0, 127)) + ' – ' + noteName(clamp(kbBase + 24, 0, 127));
        keyEls.forEach((kb, k) => { const n = kbBase + k; kb.textContent = NOTE_NAMES[n % 12].length === 1 ? (n % 12 === 0 ? noteName(n) : '') : ''; kb.className = 'key' + (NOTE_NAMES[n % 12].length === 2 ? ' black' : '') + (n > 127 ? ' off' : ''); kb.setAttribute('aria-label', noteName(clamp(n, 0, 127))); });
      }

      // --- tabs en panelen
      const tabs = H('div', 'row tabs', right), panels = {};
      const TABS = [['pad', T.tabPad], ['layer', T.tabLayers], ['zone', T.tabZones], ['edit', T.tabEdit], ['prog', T.tabProgram], ['banks', T.tabBanks]];
      const tabBtns = TABS.map(([id, label]) => {
        const bt = H('button', 'tabbtn', tabs, label); bt.type = 'button'; bt.setAttribute('role', 'tab');
        on(bt, 'click', () => showTab(id)); panels[id] = H('div', 'panel', right); return bt;
      });
      function showTab(id) {
        if (tab === 'edit' && id !== 'edit') edStop();
        tab = id; TABS.forEach(([t], k) => { panels[t].hidden = t !== id; tabBtns[k].classList.toggle('sel', t === id); tabBtns[k].setAttribute('aria-selected', t === id ? 'true' : 'false'); });
        if (id === 'layer' || id === 'zone') drawWave();
        if (id === 'edit') { edMeasure(); edRefresh(true); ed.dirty = true; }
      }

      // --- helpers voor regelaars
      const scopeObj = sc => (sc === 'prog' ? prog : sc === 'pad' ? curPad() : sc === 'layer' ? curLayer() : curZone());
      const getV = k => { const o = scopeObj(k[1]); if (!o) return RG[k[3]][3]; let v = o; for (const p of k[2]) v = v[p]; return v == null ? RG[k[3]][3] : v; };
      function constrain(id) {
        const l = curLayer(), z = curZone(), E = 0.0001;
        if (id === 'layer.start') l.start = Math.min(l.start, l.end - E);
        else if (id === 'layer.end') l.end = Math.max(l.end, l.start + E);
        else if (id === 'layer.velLo') { if (l.velLo > l.velHi) l.velHi = l.velLo; }
        else if (id === 'layer.velHi') { if (l.velHi < l.velLo) l.velLo = l.velHi; }
        else if (id === 'layer.loopStart') l.loop.start = Math.min(l.loop.start, l.loop.end - E);
        else if (id === 'layer.loopEnd') l.loop.end = Math.max(l.loop.end, l.loop.start + E);
        else if (z && id === 'zone.keyLo') { if (z.keyLo > z.keyHi) z.keyHi = z.keyLo; }
        else if (z && id === 'zone.keyHi') { if (z.keyHi < z.keyLo) z.keyLo = z.keyHi; }
        else if (z && id === 'zone.velLo') { if (z.velLo > z.velHi) z.velHi = z.velLo; }
        else if (z && id === 'zone.velHi') { if (z.velHi < z.velLo) z.velLo = z.velHi; }
        else if (z && id === 'zone.loopStart') z.loop.start = Math.min(z.loop.start, z.loop.end - E);
        else if (z && id === 'zone.loopEnd') z.loop.end = Math.max(z.loop.end, z.loop.start + E);
      }
      function after(id, sc) {
        if (sc === 'pad') padLive(curI());
        if (id === 'level') applyMaster();
        if (sc === 'layer' || sc === 'zone') { drawWave(); fillZones(); }
        if (id === 'baseNote' || id === 'pad.baseNote') { paintPads(); notesNotify(); }
        if (id === 'pad.mute') paintPads();
        if (id === 'pad.poly') { /* geldt vanaf de volgende aanslag */ }
      }
      function knob(parent, k) {
        const [id, sc, , rk, fmt, scale, group] = k, r = RG[rk];
        const c = host.ui.knob(parent, T.k[id] || id, [r[0], r[1], r[2]], getV(k), fmt, v => {
          const o = scopeObj(sc); if (!o) return;
          let x = r[2] >= 1 ? Math.round(v) : v; x = clamp(x, r[0], r[1]);
          let t = o; const p = k[2]; for (let q = 0; q < p.length - 1; q++) t = t[p[q]]; t[p[p.length - 1]] = x;
          constrain(id); refreshCtl(); after(id, sc);
        }, { id, role: 'param', group, default: r[3], scale });
        ctl.push(() => c.set(getV(k))); return c;
      }
      const KN = Object.fromEntries(KNOBS.map(k => [k[0], k]));
      const knobs = (parent, ids) => { const g = H('div', 'grid', parent); ids.forEach(id => knob(g, KN[id])); return g; };
      function selectBox(parent, id, group, label, opts, getter, setter) {
        const s = host.ui.select(parent, label, opts, getter(), v => setter(v), { id, group });
        ctl.push(() => { s.value = String(getter()); }); return s;
      }
      function toggle(parent, id, group, text, getter, setter) {
        let h;
        if (host.ui && typeof host.ui.pad === 'function') {
          h = host.ui.pad(parent, text, { id, group, mode: 'toggle', on: !!getter(), text, onchange: v => setter(!!v) }); handles.push(h);
          ctl.push(() => h.set(!!getter()));
        } else {
          const b = H('button', 'btn', parent, text); b.type = 'button'; let v = !!getter(); b.setAttribute('aria-pressed', String(v)); b.classList.toggle('sel', v);
          on(b, 'click', () => { v = !v; b.setAttribute('aria-pressed', String(v)); b.classList.toggle('sel', v); setter(v); });
          ctl.push(() => { v = !!getter(); b.setAttribute('aria-pressed', String(v)); b.classList.toggle('sel', v); });
        }
      }
      const button = (parent, text, fn, cls) => { const b = H('button', cls || 'btn', parent, text); b.type = 'button'; on(b, 'click', fn); return b; };

      // --- paneel Pad
      {
        const P = panels.pad, r1 = H('div', 'row', P);
        const nameIn = H('input', 'txt', r1); nameIn.type = 'text'; nameIn.maxLength = 40; nameIn.placeholder = T.padName; nameIn.setAttribute('aria-label', T.padName);
        on(nameIn, 'change', () => { curPad().name = str(nameIn.value, 40); paintPads(); notesNotify(); });
        on(nameIn, 'pointerdown', e => e.stopPropagation());
        ctl.push(() => { nameIn.value = curPad().name; });
        button(r1, T.clearPad, () => { prog.banks[prog.bank].pads[prog.pad] = defPad(); gcStore(); refreshAll(); notesNotify(); });
        const g1 = H('div', 'grid', P);
        selectBox(g1, 'pad.mode', 'pad', T.mode, [['drum', T.modeDrum], ['key', T.modeKey]], () => curPad().mode, v => { const p = curPad(); p.mode = v === 'key' ? 'key' : 'drum'; p.oneShot = p.mode === 'drum'; if (p.mode === 'key' && p.polyphony === 4) p.polyphony = 16; refreshAll(); notesNotify(); });
        selectBox(g1, 'pad.play', 'pad', T.play, [['velocity', T.pVelocity], ['cycle', T.pCycle], ['random', T.pRandom], ['all', T.pAll]], () => curPad().play, v => { curPad().play = v; });
        selectBox(g1, 'pad.output', 'pad', T.output, [['0', T.outMix], ...Array.from({ length: 16 }, (_, i) => [String(i + 1), T.outN + ' ' + (i + 1)])], () => String(curPad().output), v => { curPad().output = int(+v, 0, 0, 16); padLive(curI()); paintPads(); });
        const g2 = H('div', 'row', P);
        toggle(g2, 'pad.oneshot', 'pad', T.oneShot, () => curPad().oneShot, v => { curPad().oneShot = v; });
        toggle(g2, 'pad.reverse', 'pad', T.reverse, () => curPad().reverse, v => { curPad().reverse = v; });
        knobs(P, ['pad.tune', 'pad.fine', 'pad.level', 'pad.pan', 'pad.poly', 'pad.mute', 'pad.baseNote']);
        H('h4', null, P, T.envelope);
        selectBox(P, 'env.shape', 'env', T.envShape, [['adsr', 'ADSR'], ['ad', 'AD']], () => curPad().env.shape, v => { curPad().env.shape = v === 'ad' ? 'ad' : 'adsr'; });
        knobs(P, ['env.attack', 'env.decay', 'env.sustain', 'env.release']);
        H('h4', null, P, T.filter);
        selectBox(P, 'filt.type', 'filter', T.filterType, [['off', T.off], ['lp', T.lp], ['hp', T.hp], ['bp', T.bp]], () => curPad().filter.type, v => { curPad().filter.type = ['lp', 'hp', 'bp'].includes(v) ? v : 'off'; });
        knobs(P, ['filt.cutoff', 'filt.res', 'filt.envAmt', 'filt.velAmt']);
      }

      // --- paneel Lagen
      let layerSel = null, layerBtns = [], zoneSel = null, zoneInfo = null, zoneBox = null;
      {
        const P = panels.layer, r1 = H('div', 'row', P);
        layerBtns = Array.from({ length: NLAYER }, (_, i) => { const b = H('button', 'tabbtn', r1, T.layer + ' ' + (i + 1)); b.type = 'button'; on(b, 'click', () => { prog.layer = i; refreshAll(); }); return b; });
        const r2 = H('div', 'row', P);
        layerSel = host.ui.select(r2, T.sample, sampleOpts(), curLayer().sampleId, v => { assignSample(curI(), prog.layer, v, ''); if (v === '') curLayer().root = null; gcStore(); refreshAll(); notesNotify(); }, { id: 'layer.sample', group: 'layer' });
        const fileIn = H('input', 'file', r2); fileIn.type = 'file'; fileIn.accept = '.wav,.flac,.ogg,.mp3,audio/*'; fileIn.multiple = true; fileIn.hidden = true; fileIn.setAttribute('aria-label', T.loadFile);
        on(fileIn, 'change', () => { if (fileIn.files && fileIn.files.length) loadFiles(fileIn.files); fileIn.value = ''; });
        button(r2, T.loadFile, () => fileIn.click());
        button(r2, T.clearLayer, () => { curPad().layers[prog.layer] = defLayer(); gcStore(); refreshAll(); notesNotify(); });
        cv = H('canvas', 'wave', P); cv.setAttribute('role', 'img'); cv.setAttribute('aria-label', T.waveform); cvCtx = typeof cv.getContext === 'function' ? cv.getContext('2d') : null;
        on(cv, 'dragover', e => e.preventDefault()); on(cv, 'drop', e => { e.preventDefault(); if (e.dataTransfer && e.dataTransfer.files) loadFiles(e.dataTransfer.files); });
        infoEl = H('div', 'muted', P, '');
        knobs(P, ['layer.semi', 'layer.fine', 'layer.level', 'layer.pan', 'layer.offset', 'layer.root', 'layer.velLo', 'layer.velHi', 'layer.start', 'layer.end', 'layer.gain']);
        H('h4', null, P, T.loop);
        toggle(P, 'layer.loopon', 'loop', T.loopOn, () => curLayer().loop.on, v => { curLayer().loop.on = v; drawWave(); });
        knobs(P, ['layer.loopStart', 'layer.loopEnd', 'layer.xfade']);
        H('p', 'muted', P, T.layerHelp);
      }

      // --- paneel Zones
      {
        const P = panels.zone;
        H('p', 'muted', P, T.zoneHelp);
        const r1 = H('div', 'row', P);
        zoneSel = host.ui.select(r1, T.zone, [['0', '–']], '0', v => { selZone = int(+v, 0, 0, MAXZONE - 1); refreshAll(); }, { id: 'zone.select', group: 'zone' });
        button(r1, T.zoneAdd, () => {
          const p = curPad(); if (p.zones.length >= MAXZONE) return;
          const last = p.zones[p.zones.length - 1], l = curLayer();
          const z = defZone(); z.sampleId = l.sampleId; z.root = l.root == null ? 60 : l.root; if (last && last.keyHi < 127) { z.keyLo = last.keyHi + 1; z.keyHi = 127; }
          p.zones.push(z); selZone = p.zones.length - 1; refreshAll(); notesNotify();
        });
        button(r1, T.zoneDel, () => { const p = curPad(); if (!p.zones.length) return; p.zones.splice(selZone, 1); selZone = clamp(selZone, 0, Math.max(0, p.zones.length - 1)); gcStore(); refreshAll(); notesNotify(); });
        zoneInfo = H('p', 'muted', P, '');
        zoneBox = H('div', null, P);
        const zs = host.ui.select(zoneBox, T.sample, sampleOpts(), '', v => { const z = curZone(); if (!z) return; z.sampleId = v; const inf = sampleInfo(v); if (inf && inf.root != null) z.root = inf.root; gcStore(); refreshAll(); }, { id: 'zone.sample', group: 'zone' });
        ctl.push(() => { const z = curZone(); fillSelect(zs, sampleOpts(), z ? z.sampleId : ''); });
        knobs(zoneBox, ['zone.root', 'zone.keyLo', 'zone.keyHi', 'zone.velLo', 'zone.velHi', 'zone.tune']);
        toggle(zoneBox, 'zone.loopon', 'loop', T.loopOn, () => { const z = curZone(); return z ? z.loop.on : false; }, v => { const z = curZone(); if (z) z.loop.on = v; drawWave(); });
        knobs(zoneBox, ['zone.loopStart', 'zone.loopEnd']);
      }

      // --- paneel Programma
      {
        const P = panels.prog;
        knobs(P, ['level', 'baseNote', 'padVel']);
        const r = H('div', 'row', P);
        button(r, T.demoKit, () => { token++; panicAt(ctx.currentTime); prog.banks = defaultBanks(); store.clear(); bufs.clear(); selZone = 0; gcStore(); refreshAll(); notesNotify(); say(T.demoKitDone); });
        button(r, T.clearAll, () => { token++; panicAt(ctx.currentTime); prog.banks = Array.from({ length: NBANK }, (_, i) => defBank(i)); store.clear(); bufs.clear(); selZone = 0; refreshAll(); notesNotify(); say(T.clearDone); });
        memEl = H('p', 'muted', P, '');
        H('p', 'muted', P, T.help);
      }
      // --- paneel Banken: catalogus, lokaal, webadres, Freesound, voortgang, importrapport, vermeldingen
      let bkUiApi = null;
      {
        const P = panels.banks; P.classList.add('banks');
        const lab = (parent, text, input) => { const l = H('label', 'f', parent); l.appendChild(document.createTextNode(text)); l.appendChild(input); return l; };
        const stop = el => on(el, 'pointerdown', e => e.stopPropagation());
        H('p', 'muted', P, B.intro);
        const noNetEl = H('p', 'warnbox', P, B.noNet); noNetEl.setAttribute('data-bk', 'nonet'); noNetEl.hidden = canNet();
        // doel en vermeldingsgegevens
        const r0 = H('div', 'row', P);
        const tgt = H('select', null, r0); tgt.setAttribute('data-bk', 'target'); tgt.setAttribute('aria-label', B.target);
        BANK_LETTER.forEach((L, b) => { const o = H('option', null, tgt, T.bank + ' ' + L); o.value = String(b); });
        let tgtTouched = false; on(tgt, 'change', () => { tgtTouched = true; }); stop(tgt);
        lab(r0, B.target, tgt);
        const clr = H('input', null, r0); clr.type = 'checkbox'; clr.checked = true; clr.setAttribute('data-bk', 'clear'); stop(clr);
        lab(r0, B.clearFirst, clr);
        const lf = H('div', 'bgrp', P); H('h4', null, lf, B.licHeader); H('p', 'muted', lf, B.licHelp);
        const lfIn = {};
        for (const [k, t, ph] of [['author', B.lfAuthor], ['license', B.lfLicense], ['attribution', B.lfAttr]]) {
          const i = H('input', 'txt', lf); i.type = 'text'; i.maxLength = 200; i.setAttribute('data-bk', 'lic-' + k); i.setAttribute('aria-label', t); i.placeholder = t; stop(i); lfIn[k] = i;
        }
        const licFields = () => ({ author: lfIn.author.value, license: lfIn.license.value, attribution: lfIn.attribution.value });
        const opts = () => ({ bank: int(+tgt.value, 0, 0, NBANK - 1), clear: clr.checked, lic: licFields() });
        // voortgang
        const jb = H('div', 'bgrp jobbox', P); jb.setAttribute('data-bk', 'job'); jb.hidden = true;
        const jbTxt = H('div', 'info', jb, ''); jbTxt.setAttribute('role', 'status');
        const jbBar = H('progress', null, jb); jbBar.max = 1; jbBar.value = 0; jbBar.setAttribute('aria-label', B.progress);
        const jbCancel = H('button', 'btn', jb, B.cancel); jbCancel.type = 'button'; jbCancel.setAttribute('data-bk', 'cancel'); on(jbCancel, 'click', () => cancelJob());
        // catalogus
        H('h4', null, P, B.catalog); H('p', 'muted', P, B.catHelp);
        const cards = [];
        for (const b of CATALOG) {
          const nm = b.name[lang] || b.name.en;
          const c = H('div', 'bcard ' + b.status, P); c.setAttribute('data-bank', b.id); c.setAttribute('role', 'group'); c.setAttribute('aria-label', nm);
          const hd = H('div', 'bhead', c); H('strong', null, hd, nm);
          H('span', 'chip ' + b.status, hd, (b.status === 'green' ? B.green : B.yellow) + ' · ' + b.license.spdx).setAttribute('data-bk', 'chip');
          H('p', null, c, b.desc[lang] || b.desc.en);
          const dl = H('dl', 'meta', c);
          const row = (k, v, link) => { H('dt', null, dl, k); const d = H('dd', null, dl); if (link) { const a = H('a', null, d, v); a.href = link; a.target = '_blank'; a.rel = 'noopener noreferrer'; } else d.textContent = v; return d; };
          row(B.license, b.license.text + ' (' + b.license.spdx + ')', b.license.url).setAttribute('data-bk', 'license');
          row(B.author, b.author).setAttribute('data-bk', 'author');
          row(B.credit, (b.credit ? B.creditReq : B.creditNo) + ': ' + b.attribution).setAttribute('data-bk', 'credit');
          row(B.size, fmtMiB(b.bytes) + ' MiB · ' + b.n + ' ' + B.files + ' · ' + b.format.toUpperCase());
          row(B.source, b.src.name, b.src.home);
          row(B.pinned, b.src.pin.slice(0, 12));
          row(B.checked, b.license.checked[lang] || b.license.checked.en);
          let acc = null;
          if (b.status === 'yellow') {
            H('p', 'warnbox', c, b.warn[lang] || b.warn.en).setAttribute('data-bk', 'warn');
            acc = H('input', null, c); acc.type = 'checkbox'; acc.setAttribute('data-bk', 'accept'); stop(acc);
            lab(c, B.accept, acc);
          }
          const r = H('div', 'row', c);
          const ld = H('button', 'btn', r, B.load); ld.type = 'button'; ld.setAttribute('data-bk', 'load'); ld.setAttribute('aria-label', fillT(B.loadBank, nm)); stop(ld);
          on(ld, 'click', () => { loadCatalogBank(b.id, opts()); });
          const op = H('a', 'btn lnk', r, B.openSrc); op.href = b.src.home; op.target = '_blank'; op.rel = 'noopener noreferrer'; op.setAttribute('aria-label', fillT(B.openOf, nm));
          if (acc) on(acc, 'change', sync);
          cards.push({ b, ld, acc });
        }
        // lokaal
        H('h4', null, P, B.local); H('p', 'muted', P, B.localHelp);
        const lr = H('div', 'row', P);
        const fin = H('input', 'hide', lr); fin.type = 'file'; fin.multiple = true; fin.accept = '.wav,.flac,.ogg,.oga,.mp3,.sfz,.dspreset,audio/*'; fin.setAttribute('data-bk', 'files'); fin.tabIndex = -1;
        const din = H('input', 'hide', lr); din.type = 'file'; din.multiple = true; din.setAttribute('webkitdirectory', ''); din.setAttribute('data-bk', 'dir'); din.tabIndex = -1;
        const bf = H('button', 'btn', lr, B.chooseFiles); bf.type = 'button'; on(bf, 'click', () => fin.click()); stop(bf);
        const bd = H('button', 'btn', lr, B.chooseDir); bd.type = 'button'; on(bd, 'click', () => din.click()); stop(bd);
        const pick = inp => on(inp, 'change', () => { const arr = Array.from(inp.files || []); inp.value = ''; if (!arr.length) return; if (arr.some(f => /\.(sfz|dspreset)$/i.test(f.name))) importFromFiles(arr, opts()); else loadFiles(arr.filter(f => /\.(wav|flac|ogg|oga|mp3)$/i.test(f.name) || /^audio\//.test(f.type)), licOf('', licFields())); });
        pick(fin); pick(din);
        // webadres
        H('h4', null, P, B.urlTitle); H('p', 'muted', P, B.urlHelp);
        const ur = H('div', 'row', P);
        const uin = H('input', 'txt', ur); uin.type = 'url'; uin.setAttribute('data-bk', 'url'); uin.placeholder = 'https://…'; uin.setAttribute('aria-label', B.urlLabel); stop(uin);
        const ugo = H('button', 'btn', ur, B.urlGo); ugo.type = 'button'; ugo.setAttribute('data-bk', 'urlgo'); stop(ugo);
        on(ugo, 'click', () => { importFromUrl(uin.value, opts()); });
        on(uin, 'keydown', e => { if (e.key === 'Enter') { e.preventDefault(); importFromUrl(uin.value, opts()); } });
        // Freesound
        H('h4', null, P, B.fsTitle); H('p', 'muted', P, B.fsHelp);
        const fr = H('div', 'row', P);
        const ftk = H('input', 'txt', fr); ftk.type = 'password'; ftk.autocomplete = 'off'; ftk.setAttribute('data-bk', 'fstoken'); ftk.placeholder = B.fsToken; ftk.setAttribute('aria-label', B.fsToken); stop(ftk);
        const fq = H('input', 'txt', fr); fq.type = 'search'; fq.setAttribute('data-bk', 'fsquery'); fq.placeholder = B.fsQuery; fq.setAttribute('aria-label', B.fsQuery); stop(fq);
        const fgo = H('button', 'btn', fr, B.fsGo); fgo.type = 'button'; fgo.setAttribute('data-bk', 'fsgo'); stop(fgo);
        const fres = H('ul', 'fslist', P); fres.setAttribute('data-bk', 'fsresults');
        const doSearch = async () => {
          const list = await fsSearch(fq.value, ftk.value); fres.textContent = '';
          if (!list.length) { const li = H('li', 'muted', fres, B.fsNone); return; }
          for (const it of list) {
            const li = H('li', null, fres); H('span', null, li, fillT(B.fsOf, it.name, it.user, it.license, it.duration.toFixed(1)));
            const lb = H('button', 'btn', li, B.fsLoad); lb.type = 'button'; lb.setAttribute('data-bk', 'fsload'); lb.setAttribute('data-id', String(it.id)); stop(lb); on(lb, 'click', () => { fsLoad(it); });
          }
        };
        on(fgo, 'click', doSearch); on(fq, 'keydown', e => { if (e.key === 'Enter') { e.preventDefault(); doSearch(); } });
        // importrapport
        H('h4', null, P, B.reportTitle);
        const rep = H('div', 'report', P); rep.setAttribute('data-bk', 'report'); rep.setAttribute('role', 'region'); rep.setAttribute('aria-label', B.reportTitle); rep.tabIndex = -1;
        H('p', 'muted', rep, B.rNone);
        // vermeldingen
        H('h4', null, P, B.creditsTitle); H('p', 'muted', P, B.creditsHelp);
        const crd = H('ul', 'credits', P); crd.setAttribute('data-bk', 'credits');
        const cp = H('button', 'btn', P, B.copy); cp.type = 'button'; cp.setAttribute('data-bk', 'copy'); stop(cp);
        function creditText() { return creditsOf(store).map(c => (c.attribution || c.license) + (c.author ? ' - ' + c.author : '') + (c.license ? ' [' + c.license + ']' : '') + (c.source ? ' ' + c.source : '')).join('\n'); }
        on(cp, 'click', () => { const t = creditText(); try { if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(() => say(B.copied), () => say(t)); else say(t); } catch (e) { say(t); } });
        function sync() {
          const busy = !!job;
          for (const { b, ld, acc } of cards) ld.disabled = busy || !canNet() || (b.status === 'yellow' && !(acc && acc.checked));
          for (const x of [ugo, fgo, bf, bd]) x.disabled = busy && x !== bf && x !== bd;
          jb.hidden = !busy; jbCancel.disabled = !busy;
        }
        function paintJob() {
          sync(); if (!job) return;
          jbTxt.textContent = fillT(B.jobLine, job.label, job.done, job.total || 1) + (job.name ? ' · ' + baseName(job.name) : '');
          jbBar.max = Math.max(1, job.total); jbBar.value = job.done;
        }
        function paintReport(r) {
          rep.textContent = '';
          if (!r) { H('p', 'muted', rep, B.rNone); return; }
          H('p', null, rep, r.title + (r.aborted ? ' · ' + B.w.aborted : '')).style.fontWeight = '600';
          for (const [cls, title, lines] of [['ok', B.rOk, r.ok], ['ign', B.rIgn, r.ignored], ['warn', B.rWarn, r.warn]]) {
            if (!lines.length) continue;
            const h = H('h5', null, rep, title + ' (' + lines.length + ')'); const ul = H('ul', cls, rep); for (const l of lines) H('li', null, ul, l);
          }
        }
        function paintCredits() {
          crd.textContent = ''; const list = creditsOf(store);
          if (!list.length) H('li', 'muted', crd, B.creditsNone);
          for (const c of list) {
            const li = H('li', null, crd), req = /\bBY\b/i.test(c.license) && !/CC0/i.test(c.license);
            H('strong', null, li, c.attribution || c.license);
            H('span', null, li, ' · ' + c.license + (c.author ? ' · ' + c.author : '') + ' · ' + fillT(B.samplesN, c.samples));
            if (req) H('span', 'chip yellow', li, ' ' + B.creditReq);
            if (/^https:\/\//.test(c.source)) { const a = H('a', null, li, ' ' + c.source); a.href = c.source; a.target = '_blank'; a.rel = 'noopener noreferrer'; }
          }
          cp.disabled = !list.length;
        }
        ctl.push(() => { if (!tgtTouched) tgt.value = String(prog.bank); paintCredits(); sync(); });
        bkUiApi = { job: paintJob, report: paintReport, credits: paintCredits };
        sync(); paintCredits();
      }
      // --- paneel Bewerken: golfvormeditor
      const EH = 230, RULER = 22;
      let ecv = null, ectx = null, wcv = null, wctx = null, ecol = null, wkey = '', esig = '', lvlTimer = 0, scr = null, infoEd = null, selInfo = null, lvlEl = null, histEl = null, tgtSel = null, selA = null, selB = null, curIn = null;
      const edBtns = [], ptrs = new Map(), P0 = panels.edit;
      let drag = null, pinch = null, linkCb = null, slBox = null, slInfoEl = null, tmNowEl = null, chipSig = '', bpmOut = null;
      {
        const P = panels.edit; P.classList.add('edit');
        const r0 = H('div', 'row', P);
        tgtSel = H('select', null, r0); tgtSel.setAttribute('aria-label', E.target);
        on(tgtSel, 'change', () => { const v = tgtSel.value; if (v[0] === 'z') { ed.useZone = true; selZone = int(+v.slice(1), 0, 0, MAXZONE - 1); } else { ed.useZone = false; prog.layer = int(+v.slice(1), 0, 0, NLAYER - 1); } refreshAll(); });
        on(tgtSel, 'pointerdown', e => e.stopPropagation());
        infoEd = H('div', 'info', P, '');
        const eb = (parent, text, fn, op, needs) => {
          const b = H('button', 'btn', parent, text); b.type = 'button'; b.setAttribute('data-op', op || 'x'); on(b, 'click', () => { fn(); ed.dirty = true; edRefresh(false); });
          on(b, 'pointerdown', e => e.stopPropagation()); edBtns.push({ b, needs: needs || '' }); return b;
        };
        const mkE = (tag, cls) => { const e = document.createElement(tag); if (cls) e.className = cls; return e; };
        const lab = (parent, text, input) => { const l = H('label', 'f', parent); l.appendChild(document.createTextNode(text)); l.appendChild(input); return l; };
        const numIn = (parent, text, v, min, max, step, id) => {
          const i = mkE('input', 'num'); i.type = 'number'; i.min = String(min); i.max = String(max); i.step = String(step); i.value = String(v); i.setAttribute('data-f', id); i.setAttribute('aria-label', text);
          on(i, 'pointerdown', e => e.stopPropagation()); lab(parent, text, i); return i;
        };
        const fnum = id => { const i = P.querySelector('[data-f="' + id + '"]'); return i ? +i.value : NaN; };

        // beluisteren en weergave
        const g1 = H('div', 'row', P);
        eb(g1, '▶ ' + E.play, () => edPlay(false), 'play', 'sample');
        eb(g1, '⟳ ' + E.loop, () => edPlay(true), 'playloop', 'sample');
        eb(g1, '■ ' + E.stop, () => edStop(), 'stop', 'sample');
        eb(g1, '−', () => edZoomBy(2, edAnchor()), 'zoomout', 'sample').setAttribute('aria-label', E.zoomOut);
        eb(g1, '+', () => edZoomBy(0.5, edAnchor()), 'zoomin', 'sample').setAttribute('aria-label', E.zoomIn);
        eb(g1, E.zoomAll, () => { const D = edData(); if (D) { ed.full = true; ed.v0 = 0; ed.vn = D.frames; uiEd('view'); } }, 'zoomall', 'sample');
        eb(g1, E.zoomSel, () => { if (ed.sel) edZoomTo(ed.sel[0], ed.sel[1]); }, 'zoomsel', 'sel');
        const g2 = H('div', 'row', P);
        const snapCb = mkE('input'); snapCb.type = 'checkbox'; snapCb.checked = ed.snap; snapCb.setAttribute('data-f', 'snap'); on(snapCb, 'change', () => { ed.snap = snapCb.checked; });
        lab(g2, E.snap, snapCb);
        const lanesSel = mkE('select'); lanesSel.setAttribute('aria-label', E.chans); lanesSel.setAttribute('data-f', 'lanes');
        for (const [v, t2] of [['lr', E.chLR], ['sum', E.chSum]]) { const o = H('option', null, lanesSel, t2); o.value = v; }
        lanesSel.value = ed.lanes; on(lanesSel, 'change', () => { ed.lanes = lanesSel.value === 'sum' ? 'sum' : 'lr'; ed.dirty = true; });
        lab(g2, E.chans, lanesSel);

        // het canvas
        ecv = H('canvas', 'ed', P); ecv.tabIndex = 0; ecv.setAttribute('role', 'application'); ecv.setAttribute('aria-label', E.canvas); ecv.setAttribute('aria-keyshortcuts', 'X C V I Delete Control+A Control+Z Control+Shift+Z Control+Y Space');
        ectx = typeof ecv.getContext === 'function' ? ecv.getContext('2d') : null;
        wcv = document.createElement('canvas'); wctx = typeof wcv.getContext === 'function' ? wcv.getContext('2d') : null;
        scr = H('input', null, P); scr.type = 'range'; scr.min = '0'; scr.max = '1000'; scr.step = '1'; scr.value = '0'; scr.setAttribute('aria-label', E.scroll); scr.setAttribute('data-f', 'scroll');
        on(scr, 'pointerdown', e => e.stopPropagation());
        on(scr, 'input', () => { const D = edData(); if (!D) return; ed.v0 = +scr.value / 1000 * (D.frames - ed.vn); clampView(D.frames); ed.dirty = true; });
        const r3 = H('div', 'row', P);
        selA = numIn(r3, E.selStart, '', 0, 100000000, 1, 'selA'); selB = numIn(r3, E.selEnd, '', 0, 100000000, 1, 'selB'); curIn = numIn(r3, E.cursor, 0, 0, 100000000, 1, 'cur');
        const setSelNum = () => {
          const D = edData(); if (!D) return;
          const ra = selA.value === '' ? 0 : +selA.value, rb = selB.value === '' ? D.frames : +selB.value;
          let a = int(ra, 0, 0, D.frames), b = int(rb, D.frames, 0, D.frames); if (b < a) { const t2 = a; a = b; b = t2; }
          ed.sel = b - a >= 1 ? [a, b] : null; ed.cur = a; ed.dirty = true; edRefresh(false);
        };
        on(selA, 'change', setSelNum); on(selB, 'change', setSelNum);
        on(curIn, 'change', () => { const D = edData(); if (!D) return; ed.cur = int(+curIn.value, 0, 0, D.frames); ed.dirty = true; edReveal(ed.cur); edRefresh(false); });
        selInfo = H('div', 'info', P, ''); lvlEl = H('div', 'info', P, '');

        const G = { edit: [], chop: [], proc: [], flat: [] };
        const modeRow = H('div', 'row modes', P); modeRow.setAttribute('role', 'group'); modeRow.setAttribute('aria-label', E.modes);
        const modeBtns = [['edit', E.mEdit], ['chop', E.mChop], ['proc', E.mProc], ['flat', E.mFlat]].map(([m, tx]) => {
          const b = H('button', 'tabbtn', modeRow, tx); b.type = 'button'; b.setAttribute('data-mode', m); on(b, 'click', () => setMode(m)); on(b, 'pointerdown', e => e.stopPropagation()); return b;
        });
        function setMode(m, quiet) {
          ed.mode = m; for (const kk of Object.keys(G)) for (const g of G[kk]) g.hidden = kk !== m;
          modeBtns.forEach(b => { const o = b.getAttribute('data-mode') === m; b.classList.toggle('sel', o); b.setAttribute('aria-pressed', o ? 'true' : 'false'); });
          if (!quiet) { ed.dirty = true; esig = ''; edRefresh(false); }
        }
        const sel2 = (parent, text, id, opts, def) => {
          const s2 = mkE('select'); s2.setAttribute('aria-label', text); s2.setAttribute('data-f', id);
          for (const [v, t2] of opts) { const o = H('option', null, s2, t2); o.value = String(v); }
          s2.value = String(def); on(s2, 'pointerdown', e => e.stopPropagation()); lab(parent, text, s2); return s2;
        };
        const chk2 = (parent, text, id, def) => { const c = mkE('input'); c.type = 'checkbox'; c.checked = def; c.setAttribute('data-f', id); lab(parent, text, c); return c; };
        const fget = id => { const i = P.querySelector('[data-f="' + id + '"]'); return !i ? undefined : i.type === 'checkbox' ? i.checked : i.value; };
        // bewerkingen
        const gE = H('div', 'grp', P); H('h4', null, gE, E.grpEdit);
        const rE = H('div', 'row', gE);
        eb(rE, E.selAll, () => edSelAll(), 'selall', 'sample');
        eb(rE, E.trim, () => edOp('trim'), 'trim', 'sel'); eb(rE, E.del, () => edOp('del'), 'del', 'sel');
        const gC = H('div', 'grp', P); H('h4', null, gC, E.grpClip);
        const rC = H('div', 'row', gC);
        eb(rC, E.cut, () => edOp('cut'), 'cut', 'sel'); eb(rC, E.copy, () => edOp('copy'), 'copy', 'sample'); eb(rC, E.paste, () => edOp('paste'), 'paste', 'clip'); eb(rC, E.insert, () => edOp('insert'), 'insert', 'clip');
        const rS = H('div', 'row', gC);
        numIn(rS, E.silenceMs, 100, 1, 60000, 1, 'silenceMs'); eb(rS, E.silence, () => edOp('silence', fnum('silenceMs')), 'silence', 'sample'); eb(rS, E.mute, () => edOp('mute'), 'mute', 'sel');
        const gL = H('div', 'grp', P); H('h4', null, gL, E.grpLevel);
        const rL = H('div', 'row', gL);
        eb(rL, E.normalize, () => edOp('normalize'), 'normalize', 'sample');
        numIn(rL, E.gain, 0, -96, 48, 0.5, 'gainDb'); eb(rL, E.gainDo, () => edOp('gain', fnum('gainDb')), 'gain', 'sample');
        const rF = H('div', 'row', gL);
        const fadeSel = mkE('select'); fadeSel.setAttribute('aria-label', E.fadeShape); fadeSel.setAttribute('data-f', 'fadeShape');
        for (const [v, t2] of [['lin', E.fLin], ['log', E.fLog], ['exp', E.fExp]]) { const o = H('option', null, fadeSel, t2); o.value = v; }
        on(fadeSel, 'pointerdown', e => e.stopPropagation()); lab(rF, E.fadeShape, fadeSel);
        eb(rF, E.fadeIn, () => edOp('fadeIn', fadeSel.value), 'fadeIn', 'sample'); eb(rF, E.fadeOut, () => edOp('fadeOut', fadeSel.value), 'fadeOut', 'sample');
        const gK = H('div', 'grp', P); H('h4', null, gK, E.grpSound);
        const rK = H('div', 'row', gK);
        eb(rK, E.reverse, () => edOp('reverse'), 'reverse', 'sample'); eb(rK, E.dc, () => edOp('dc'), 'dc', 'sample'); eb(rK, E.mono, () => edOp('mono'), 'mono', 'stereo');
        const rK2 = H('div', 'row', gK);
        numIn(rK2, E.pitch, 12, -48, 48, 1, 'pitchSt'); eb(rK2, E.pitchDo, () => edOp('pitch', fnum('pitchSt')), 'pitch', 'sample');
        const rK3 = H('div', 'row', gK);
        numIn(rK3, E.bits, 8, 2, 15, 1, 'bits'); eb(rK3, E.bitDo, () => edOp('bits', fnum('bits')), 'bits', 'sample');
        numIn(rK3, E.rate, 8000, 100, 192000, 100, 'rateHz'); eb(rK3, E.rateDo, () => edOp('rate', fnum('rateHz')), 'rate', 'sample');
        const gP = H('div', 'grp', P); H('h4', null, gP, E.grpLoop);
        const rP = H('div', 'row', gP);
        eb(rP, E.toStartEnd, () => edOp('toStartEnd'), 'toStartEnd', 'sel'); eb(rP, E.toLoop, () => edOp('toLoop'), 'toLoop', 'sel');
        const rP2 = H('div', 'row', gP);
        numIn(rP2, E.xfade, ed.xf, 1, 5000, 1, 'xfadeMs'); eb(rP2, E.xfadeDo, () => { ed.xf = clamp(fnum('xfadeMs') || 20, 1, 5000); edOp('xfade', ed.xf); }, 'xfade', 'sample');
        G.edit.push(gE, gC, gL, gK, gP);

        // chop
        const gCh = H('div', 'grp', P); H('h4', null, gCh, E.grpChop); G.chop.push(gCh);
        const rc1 = H('div', 'row', gCh);
        numIn(rc1, E.chopParts, 16, 2, 64, 1, 'chopN'); eb(rc1, E.chopEq, () => chopEqual(fnum('chopN')), 'chopEq', 'sample');
        const rc2 = H('div', 'row', gCh);
        numIn(rc2, E.thrDb, 24, 1, 80, 1, 'chopThr'); numIn(rc2, E.minMs, 60, 1, 2000, 1, 'chopMin'); eb(rc2, E.chopThr, () => chopThreshold(-Math.abs(fnum('chopThr')), fnum('chopMin')), 'chopThr', 'sample');
        const rc3 = H('div', 'row', gCh);
        numIn(rc3, E.bpm, 120, 20, 400, 0.01, 'chopBpm'); sel2(rc3, E.perUnit, 'chopUnit', [[4, E.uBar], [1, E.uBeat], [0.5, E.uEighth], [0.25, E.uSixteenth]], 1);
        eb(rc3, E.chopBpm, () => chopBpm(fnum('chopBpm'), +fget('chopUnit')), 'chopBpm', 'sample');
        const rc4 = H('div', 'row', gCh);
        const beatsBpm = () => { const D = edData(); if (!D) return NaN; const secs = (ed.sel ? ed.sel[1] - ed.sel[0] : D.frames) / D.rate, bt = fnum('chopBeats'); return secs > 0 && bt > 0 ? bt * 60 / secs : NaN; };
        const setBpmField = () => { const v = beatsBpm(); if (Number.isFinite(v)) { const f2 = P.querySelector('[data-f="chopBpm"]'); f2.value = String(Math.round(clamp(v, 20, 400) * 100) / 100); bpmOut.textContent = '= ' + v.toFixed(2) + ' BPM'; } };
        numIn(rc4, E.beats, 4, 0.25, 512, 0.25, 'chopBeats'); on(P.querySelector('[data-f="chopBeats"]'), 'input', () => { const v = beatsBpm(); if (bpmOut) bpmOut.textContent = Number.isFinite(v) ? '= ' + v.toFixed(2) + ' BPM' : ''; });
        eb(rc4, E.bpmFromBeats, setBpmField, 'bpmFromBeats', 'sample');
        eb(rc4, E.half, () => { const i2 = P.querySelector('[data-f="chopBeats"]'); i2.value = String(Math.max(0.25, +i2.value / 2)); setBpmField(); }, 'beatsHalf', 'sample');
        eb(rc4, E.double, () => { const i2 = P.querySelector('[data-f="chopBeats"]'); i2.value = String(Math.min(512, +i2.value * 2)); setBpmField(); }, 'beatsDouble', 'sample');
        bpmOut = H('span', 'muted', rc4, '');
        const rc5 = H('div', 'row', gCh);
        eb(rc5, E.slAdd, () => slAddAt(ed.cur), 'slAdd', 'sample'); eb(rc5, E.slDel, () => slDelSel(), 'slDel', 'slices'); eb(rc5, E.slClear, () => slClearAll(), 'slClear', 'slices');
        linkCb = chk2(rc5, E.link, 'link', true); on(linkCb, 'change', () => slSetLink(linkCb.checked));
        slBox = H('div', 'row chips', gCh); slInfoEl = H('div', 'info', gCh, '');
        const rc6 = H('div', 'row', gCh);
        eb(rc6, E.slSelect, () => { const rec = recOf(), D = edData(); if (rec && D && rec.slices.length) { const [s0, e0] = sliceRanges(rec.slices, rec.sliceEnds, D.frames)[ed.slSel]; ed.sel = [s0, e0]; ed.cur = s0; ed.anchor = e0; } }, 'slSelect', 'slices');
        H('p', 'muted', gCh, E.kbdChop);
        const gPd = H('div', 'grp', P); H('h4', null, gPd, E.grpPads); G.chop.push(gPd);
        const rp1 = H('div', 'row', gPd);
        sel2(rp1, E.spBank, 'spBank', BANK_LETTER.map((L, b) => [b, L]), prog.bank); sel2(rp1, E.spPad, 'spPad', Array.from({ length: NPAD }, (_, p) => [p, p + 1]), prog.pad);
        const rp2 = H('div', 'row', gPd);
        sel2(rp2, E.spMode, 'spMode', [['replace', E.spReplace], ['empty', E.spEmpty]], 'replace'); chk2(rp2, E.spTailOn, 'spTailOn', false); numIn(rp2, E.spTailMs, 100, 0, 5000, 10, 'spTailMs');
        const rp3 = H('div', 'row', gPd);
        eb(rp3, E.spGo, () => slToPads({ bank: +fget('spBank'), pad: +fget('spPad'), onlyEmpty: fget('spMode') === 'empty', tail: !!fget('spTailOn'), tailMs: fnum('spTailMs') }), 'slToPads', 'slices');

        // process
        const gPr = H('div', 'grp', P); H('h4', null, gPr, E.grpProc); G.proc.push(gPr);
        const rq = H('div', 'row', gPr);
        sel2(rq, E.procOp, 'procOp', [['filter', E.fxFilter], ['drive', E.fxDrive], ['crush', E.fxCrush], ['eq', E.fxEq], ['comp', E.fxComp], ['tempo', E.fxTempo]], 'filter');
        const pb = {}; for (const k2 of ['filter', 'drive', 'crush', 'eq', 'comp', 'tempo']) pb[k2] = H('div', 'row', gPr);
        sel2(pb.filter, E.fType, 'fType', [['lp', T.lp], ['hp', T.hp], ['bp', T.bp]], 'lp'); numIn(pb.filter, E.fCut, 1000, 20, 20000, 1, 'fCut'); numIn(pb.filter, E.fQ, 0.71, 0.1, 30, 0.01, 'fQ');
        sel2(pb.filter, E.fSlope, 'fSlope', [[12, E.sl12], [24, E.sl24]], 12); chk2(pb.filter, E.fSweep, 'fSweep', false); numIn(pb.filter, E.fCutEnd, 4000, 20, 20000, 1, 'fCutEnd');
        numIn(pb.drive, E.drDb, 12, 0, 48, 1, 'drDb'); numIn(pb.drive, E.drMix, 100, 0, 100, 1, 'drMix');
        numIn(pb.crush, E.crBits, 8, 2, 16, 1, 'crBits'); numIn(pb.crush, E.crHz, 11025, 100, 192000, 100, 'crHz');
        numIn(pb.eq, E.eqLow, 0, -18, 18, 0.5, 'eqLow'); numIn(pb.eq, E.eqMid, 0, -18, 18, 0.5, 'eqMid'); numIn(pb.eq, E.eqHigh, 0, -18, 18, 0.5, 'eqHigh');
        numIn(pb.comp, E.cpThr, -18, -60, 0, 1, 'cpThr'); numIn(pb.comp, E.cpRatio, 4, 1, 40, 0.1, 'cpRatio'); numIn(pb.comp, E.cpAtk, 5, 0.1, 500, 0.1, 'cpAtk'); numIn(pb.comp, E.cpRel, 100, 5, 5000, 1, 'cpRel'); numIn(pb.comp, E.cpMk, 0, -24, 24, 0.5, 'cpMk');
        numIn(pb.tempo, E.beats, 4, 0.25, 512, 0.25, 'tmBeats'); numIn(pb.tempo, E.tmTarget, Number.isFinite(host.bpm) && host.bpm >= 20 && host.bpm <= 400 ? Math.round(host.bpm * 100) / 100 : 120, 20, 400, 0.01, 'tmTarget');
        const tmCur = () => { const D = edData(); if (!D) return NaN; const secs = (ed.sel ? ed.sel[1] - ed.sel[0] : D.frames) / D.rate; return secs > 0 ? fnum('tmBeats') * 60 / secs : NaN; };
        eb(pb.tempo, E.half, () => { const i2 = P.querySelector('[data-f="tmBeats"]'); i2.value = String(Math.max(0.25, +i2.value / 2)); }, 'tmHalf', 'sample');
        eb(pb.tempo, E.double, () => { const i2 = P.querySelector('[data-f="tmBeats"]'); i2.value = String(Math.min(512, +i2.value * 2)); }, 'tmDouble', 'sample');
        tmNowEl = H('div', 'info', gPr, '');
        const fxShow = () => { const cur = fget('procOp'); for (const k2 of Object.keys(pb)) pb[k2].hidden = k2 !== cur; tmNowEl.hidden = cur !== 'tempo'; };
        on(P.querySelector('[data-f="procOp"]'), 'change', () => { fxShow(); esig = ''; edRefresh(false); }); fxShow();
        const tmArg = () => ({ beats: num(fnum('tmBeats'), 4, 0.25, 512), target: num(fnum('tmTarget'), 120, 20, 400) });
        const rq2 = H('div', 'row', gPr);
        eb(rq2, '▶ ' + E.procPrev, () => { const fx = fget('procOp'); if (fx === 'tempo') { const a = tmArg(), cur = tmCur(); if (Number.isFinite(cur)) procPreview('tempo', { ratio: clamp(a.target / cur, 0.25, 4) }); } else procPreview(fx, procParams(fx, fget)); }, 'procPrev', 'sample');
        eb(rq2, E.procApply, () => { const fx = fget('procOp'); if (fx === 'tempo') edOp('tempo', tmArg()); else edOp('proc', { fx, p: procParams(fx, fget) }); }, 'procApply', 'sample');
        H('p', 'muted', gPr, E.procHelp);
        ed.tmUpdate = () => { const c = tmCur(), a = tmArg(); if (tmNowEl) tmNowEl.textContent = Number.isFinite(c) ? fillT(E.tmNow, c.toFixed(2)) + ' · ' + fillT(E.tmSt, (12 * Math.log2(a.target / c)).toFixed(2)) : ''; };

        // flatten en resample
        const gFl = H('div', 'grp', P); H('h4', null, gFl, E.grpFlat); G.flat.push(gFl);
        const rf1 = H('div', 'row', gFl);
        sel2(rf1, E.flSrc, 'flSrc', [['pad', E.flSrcPad], ['sel', E.flSrcSel]], 'pad');
        const rf2 = H('div', 'row', gFl);
        numIn(rf2, E.flNote, 60, 0, 127, 1, 'flNote'); on(P.querySelector('[data-f="flNote"]'), 'input', () => P.querySelector('[data-f="flNote"]').setAttribute('data-user', '1'));
        numIn(rf2, E.flVel, 100, 1, 127, 1, 'flVel'); numIn(rf2, E.flTail, 0.1, 0, 10, 0.05, 'flTail'); numIn(rf2, E.flHold, 0, 0, 120, 0.1, 'flHold');
        const rf3 = H('div', 'row', gFl);
        sel2(rf3, E.flCh, 'flCh', [['stereo', E.flStereo], ['mono', E.flMono]], 'stereo'); chk2(rf3, E.flNorm, 'flNorm', false); chk2(rf3, E.flTrim, 'flTrim', true);
        const rf4 = H('div', 'row', gFl);
        sel2(rf4, E.flDest, 'flDest', [['newlayer', E.dNew], ['layer', E.dLayer], ['replace', E.dReplace], ['other', E.dOther]], 'newlayer');
        sel2(rf4, E.flBank, 'flBank', BANK_LETTER.map((L, b) => [b, L]), 0); sel2(rf4, E.flPadN, 'flPadN', Array.from({ length: NPAD }, (_, p) => [p, p + 1]), 0);
        H('p', 'warn', gFl, E.flWarn);
        const flOpts = () => ({ src: fget('flSrc'), note: int(+fget('flNote'), 60, 0, 127), vel: int(+fget('flVel'), 100, 1, 127), tail: num(+fget('flTail'), 0.1, 0, 10), hold: num(+fget('flHold'), 0, 0, 120), mono: fget('flCh') === 'mono', norm: !!fget('flNorm'), trim: !!fget('flTrim'), dest: fget('flDest'), dBank: int(+fget('flBank'), 0, 0, 3), dPad: int(+fget('flPadN'), 0, 0, 15) });
        const rf5 = H('div', 'row', gFl);
        eb(rf5, '▶ ' + E.flPrev, () => flatten(flOpts(), true), 'flPrev', 'sample'); eb(rf5, E.flGo, () => flatten(flOpts(), false), 'flGo', 'sample');
        const gU = H('div', 'grp', P); H('h4', null, gU, E.grpUndo);
        const rU = H('div', 'row', gU);
        eb(rU, '↶ ' + E.undo, () => edStep(true), 'undo', 'undo'); eb(rU, '↷ ' + E.redo, () => edStep(false), 'redo', 'redo');
        histEl = H('span', 'muted', rU, '');
        H('p', 'muted', P, E.kbd);
        for (const id of ['tmBeats', 'tmTarget']) on(P.querySelector('[data-f="' + id + '"]'), 'input', () => ed.tmUpdate());
        setMode('edit', true);

        // aanwijzer: selecteren, handvatten, scrubben, pinch en slepen
        const xOf = e => { const r = ecv.getBoundingClientRect(); return e.clientX - r.left; };
        const yOf = e => { const r = ecv.getBoundingClientRect(); return e.clientY - r.top; };
        const fOf = x => ed.v0 + x / ed.W * ed.vn;
        function markers(D, t) {
          const m = [];
          if (ed.sel) m.push({ k: 'sa', f: ed.sel[0] }, { k: 'sb', f: ed.sel[1] });
          if (t.kind === 'l') m.push({ k: 'ys', f: t.obj.start * D.frames }, { k: 'ye', f: t.obj.end * D.frames });
          if (t.obj.loop.on) m.push({ k: 'ls', f: t.obj.loop.start * D.frames }, { k: 'le', f: t.obj.loop.end * D.frames });
          const rec = ed.mode === 'chop' ? store.get(D.id) : null;
          if (rec) { rec.slices.forEach((sv, i) => m.push({ k: 'm' + i, f: sv })); if (!ed.link || (rec.sliceEnds && rec.sliceEnds.some(v => v > 0))) sliceRanges(rec.slices, rec.sliceEnds, D.frames).forEach(([, ev], i) => m.push({ k: 'n' + i, f: ev })); }
          return m;
        }
        function startPinch() {
          const [p1, p2] = [...ptrs.values()], d = Math.hypot(p2.x - p1.x, p2.y - p1.y) || 1, mx = (p1.x + p2.x) / 2;
          pinch = { d0: d, vn0: ed.vn, anchor: fOf(mx) }; drag = null;
        }
        on(ecv, 'pointerdown', e => {
          e.stopPropagation(); try { ecv.focus({ preventScroll: true }); } catch (err) { /* ok */ }
          const D = edData(), t = edTarget(); if (!D || !t) return;
          const x = xOf(e), y = yOf(e);
          try { ecv.setPointerCapture(e.pointerId); } catch (err) { /* ok */ }
          ptrs.set(e.pointerId, { x, y });
          if (ptrs.size === 2) { startPinch(); return; }
          if (ptrs.size > 2) return;
          if (e.button === 1 || e.button === 2) { e.preventDefault(); drag = { kind: 'pan', x0: x, v00: ed.v0 }; return; }
          if (e.button > 0) return;
          e.preventDefault();
          if (y < RULER) { const f = clamp(Math.round(fOf(x)), 0, D.frames); ed.cur = f; drag = { kind: 'scrub' }; edGrain(f); ed.dirty = true; return; }
          const reach = e.pointerType === 'touch' ? 22 : 10; let best = null;
          for (const m of markers(D, t)) { if (m.k[0] === 'm') { if (y < (ed.link ? EH - 52 : EH - 36)) continue; } else if (m.k[0] === 'n') { if (y < EH - 52 || y >= EH - 36) continue; } else if (m.k !== 'sa' && m.k !== 'sb' && y > RULER + 44) continue; const d = Math.abs((m.f - ed.v0) / ed.vn * ed.W - x); if (d <= reach && (!best || d < best.d - 0.5)) best = { m, d }; }
          if (best && (best.m.k[0] === 'm' || best.m.k[0] === 'n')) {
            const si = +best.m.k.slice(1); ed.slSel = si; drag = { kind: 'slice', k: best.m.k, i: si, h: progBegin([t.loc.b * NPAD + t.loc.p]), moved: false, off: best.m.f - fOf(x) }; ed.dirty = true; return;
          }
          if (best) {
            const k = best.m.k;
            drag = { kind: 'handle', k, before: k[0] === 's' ? null : snapOf(t), anchor: k === 'sa' && ed.sel ? ed.sel[1] : k === 'sb' && ed.sel ? ed.sel[0] : 0 };
            return;
          }
          const f0 = edSnap(fOf(x)); drag = { kind: 'sel', x0: x, f0, moved: false };
        });
        on(ecv, 'pointermove', e => {
          const D = edData(), t = edTarget(); if (!D || !t) return;
          if (ptrs.has(e.pointerId)) ptrs.set(e.pointerId, { x: xOf(e), y: yOf(e) });
          const x = xOf(e);
          if (pinch && ptrs.size >= 2) {
            const [p1, p2] = [...ptrs.values()], d = Math.hypot(p2.x - p1.x, p2.y - p1.y) || 1, mx = (p1.x + p2.x) / 2;
            ed.vn = clamp(pinch.vn0 * pinch.d0 / d, Math.min(D.frames, minVn()), D.frames); ed.v0 = pinch.anchor - mx / ed.W * ed.vn; ed.full = false; clampView(D.frames); ed.dirty = true; return;
          }
          if (!drag) return;
          if (drag.kind === 'pan') { ed.v0 = drag.v00 - (x - drag.x0) * ed.vn / ed.W; ed.full = false; clampView(D.frames); ed.dirty = true; return; }
          if (drag.kind === 'scrub') { const f = clamp(Math.round(fOf(x)), 0, D.frames); ed.cur = f; edGrain(f); ed.dirty = true; return; }
          if (drag.kind === 'sel') {
            if (!drag.moved && Math.abs(x - drag.x0) < 4) return; drag.moved = true;
            const f1 = edSnap(fOf(x)), a = Math.min(drag.f0, f1), b = Math.max(drag.f0, f1); ed.sel = b - a >= 1 ? [a, b] : null; ed.cur = a; ed.anchor = drag.f0; ed.dirty = true; return;
          }
          if (drag.kind === 'slice') {
            const rec = store.get(D.id); if (!rec || !rec.slices.length) return; const f = edSnap(fOf(x) + drag.off), N = D.frames, i = drag.i; if (!drag.moved && Math.abs(x - (((drag.k[0] === 'm' ? rec.slices[i] : (rec.sliceEnds || [])[i]) - ed.v0) / ed.vn * ed.W)) < 3) return;
            drag.moved = true;
            if (drag.k[0] === 'm') { const lo = i > 0 ? rec.slices[i - 1] + 1 : 0, hi = i + 1 < rec.slices.length ? rec.slices[i + 1] - 1 : N - 1; rec.slices[i] = clamp(f, lo, Math.max(lo, hi)); }
            else { if (!rec.sliceEnds || rec.sliceEnds.length !== rec.slices.length) rec.sliceEnds = new Array(rec.slices.length).fill(0); rec.sliceEnds[i] = clamp(f, rec.slices[i] + 1, N); }
            ed.cur = rec.slices[i]; ed.dirty = true; return;
          }
          if (drag.kind === 'handle') {
            const f = edSnap(fOf(x)), N = D.frames, o = t.obj, k = drag.k;
            if (k === 'sa' || k === 'sb') { const a = Math.min(drag.anchor, f), b = Math.max(drag.anchor, f); ed.sel = b - a >= 1 ? [a, b] : null; ed.cur = a; ed.anchor = drag.anchor; }
            else if (k === 'ys') o.start = clamp(f / N, 0, o.end - 0.0001);
            else if (k === 'ye') o.end = clamp(f / N, o.start + 0.0001, 1);
            else if (k === 'ls') o.loop.start = clamp(f / N, 0, o.loop.end - 0.0001);
            else if (k === 'le') o.loop.end = clamp(f / N, o.loop.start + 0.0001, 1);
            ed.dirty = true;
          }
        });
        const endPtr = e => {
          ptrs.delete(e.pointerId);
          if (pinch && ptrs.size < 2) { pinch = null; drag = null; }
          if (ptrs.size === 0 && drag) {
            const d = drag; drag = null;
            if (d.kind === 'sel' && !d.moved) { ed.sel = null; ed.cur = d.f0; ed.anchor = d.f0; }
            if (d.kind === 'slice') { if (d.moved) { if (progEnd(d.h, E.marker, true)) { edAfter(); say(fillT(E.done, E.marker)); } else if (ui) ui.refreshAll(); } else slPlay(d.i); }
            if (d.kind === 'handle' && d.before) {
              const t = edTarget(), after = snapOf(t);
              if (JSON.stringify([d.before.on, d.before.ls, d.before.le, d.before.st, d.before.en]) !== JSON.stringify([after.on, after.ls, after.le, after.st, after.en])) { pushUndo({ label: E.marker, loc: t.loc, b: d.before, a: after }); refreshAll(); }
            }
            ed.dirty = true; edRefresh(false);
          }
        };
        on(ecv, 'pointerup', endPtr); on(ecv, 'pointercancel', endPtr); on(ecv, 'lostpointercapture', e => { if (ptrs.has(e.pointerId)) endPtr(e); });
        on(ecv, 'contextmenu', e => e.preventDefault());
        on(ecv, 'wheel', e => {
          e.preventDefault(); e.stopPropagation(); const D = edData(); if (!D) return;
          if (e.shiftKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) { ed.v0 += (e.deltaX || e.deltaY) * ed.vn / ed.W; ed.full = false; clampView(D.frames); ed.dirty = true; }
          else edZoomBy(e.deltaY > 0 ? 1.25 : 0.8, fOf(xOf(e)));
          edRefresh(false);
        }, { passive: false });
        on(ecv, 'dragover', e => e.preventDefault()); on(ecv, 'drop', e => { e.preventDefault(); if (e.dataTransfer && e.dataTransfer.files) loadFiles(e.dataTransfer.files); });

        // toetsenbord (de tab Bewerken heeft voorrang boven de pad-toetsen)
        on(P, 'keydown', e => {
          const tg = e.target && e.target.tagName; if (tg === 'INPUT' || tg === 'SELECT' || tg === 'TEXTAREA') return;
          const D = edData(), k = e.key, ctl = e.ctrlKey || e.metaKey; let h = true;
          const move = (to, ext) => {
            if (!D) return; to = clamp(Math.round(to), 0, D.frames);
            if (ext) { if (!ed.sel) ed.anchor = ed.cur; else ed.anchor = ed.cur === ed.sel[0] ? ed.sel[1] : ed.sel[0]; ed.cur = to; const a = Math.min(ed.anchor, to), b = Math.max(ed.anchor, to); ed.sel = b - a >= 1 ? [a, b] : null; }
            else { ed.cur = to; ed.sel = null; ed.anchor = to; }
            edReveal(to); ed.dirty = true;
          };
          const px = D ? Math.max(1, Math.round(ed.vn / ed.W)) : 1;
          if (ed.mode === 'chop' && !ctl && !e.altKey && (!e.shiftKey || k === 'M') && (/^[1-9]$/.test(k) || k === 'ArrowLeft' || k === 'ArrowRight' || k === 'm' || k === 'M' || (k === 'Enter' && tg !== 'BUTTON') || k === 'Delete' || k === 'Backspace')) {
            const rec = recOf(), ns = rec ? rec.slices.length : 0;
            if (/^[1-9]$/.test(k)) { if (+k - 1 < ns) slPlay(+k - 1); }
            else if (k === 'ArrowLeft' || k === 'ArrowRight') { if (ns) slPlay(ed.slSel + (k === 'ArrowLeft' ? -1 : 1)); }
            else if (k === 'Delete' || k === 'Backspace') slDelSel();
            else slAddAt(ed.cur);
            e.preventDefault(); e.stopPropagation(); edRefresh(false); return;
          }
          if (ctl && !e.altKey) {
            if (k === 'z' || k === 'Z') edStep(!e.shiftKey);
            else if (k === 'y' || k === 'Y') edStep(false);
            else if (k === 'a' || k === 'A') edSelAll();
            else if (k === 'x' || k === 'X') edOp('cut');
            else if (k === 'c' || k === 'C') edOp('copy');
            else if (k === 'v' || k === 'V') edOp('paste');
            else h = false;
          } else if (!e.altKey) {
            if (k === 'x' || k === 'X') edOp('cut');
            else if (k === 'c' || k === 'C') edOp('copy');
            else if (k === 'v' || k === 'V') edOp('paste');
            else if (k === 'i' || k === 'I') edOp('insert');
            else if (k === 'Delete' || k === 'Backspace') edOp('del');
            else if (k === ' ' && tg !== 'BUTTON') { if (ed.play) edStop(); else edPlay(e.shiftKey); }
            else if (k === '+' || k === '=') edZoomBy(0.5, edAnchor());
            else if (k === '-' || k === '_') edZoomBy(2, edAnchor());
            else if (k === '0') { if (D) { ed.full = true; ed.v0 = 0; ed.vn = D.frames; uiEd('view'); } }
            else if (k === 'ArrowLeft') move(ed.cur - px, e.shiftKey);
            else if (k === 'ArrowRight') move(ed.cur + px, e.shiftKey);
            else if (k === 'PageUp') move(ed.cur - px * 20, e.shiftKey);
            else if (k === 'PageDown') move(ed.cur + px * 20, e.shiftKey);
            else if (k === 'Home') move(0, e.shiftKey);
            else if (k === 'End') move(D ? D.frames : 0, e.shiftKey);
            else if (k === 'Escape') { if (ed.play) edStop(); else { ed.sel = null; ed.dirty = true; } }
            else h = false;
          } else h = false;
          if (h) { e.preventDefault(); e.stopPropagation(); edRefresh(false); }
        });
      }
      const edAnchor = () => (ed.cur >= ed.v0 && ed.cur <= ed.v0 + ed.vn ? ed.cur : ed.v0 + ed.vn / 2);
      function edSelAll() { const D = edData(); if (!D) return; ed.sel = [0, D.frames]; ed.cur = 0; ed.anchor = D.frames; ed.dirty = true; }

      // tekenen van de editor: de golfvorm op een eigen canvas (alleen opnieuw als de weergave verandert), de rest elke keer eroverheen
      function ecolors() {
        if (!ecol) { const cs = typeof getComputedStyle === 'function' && ecv ? getComputedStyle(ecv) : null, v = (n, d) => (cs && cs.getPropertyValue(n).trim()) || d; ecol = { bg: v('--well', '#101418'), fg: v('--fg', '#dde'), mu: v('--well-fg', '#8a97a0'), au: v('--audio', '#4ec9d4'), ev: v('--event', '#f0a040'), sel: v('--sel', '#6aa8ff'), line: v('--line', '#3a4450'), go: v('--go', '#3a8f5a') }; }
        return ecol;
      }
      function niceStep(minSec) { for (const b of [0.001, 0.01, 0.1, 1, 10, 100]) for (const m of [1, 2, 5]) if (b * m >= minSec) return b * m; return 1000; }
      function paintWave(D, k, w, dpr) {
        const g = wctx; g.setTransform(dpr, 0, 0, dpr, 0, 0); g.fillStyle = k.bg; g.fillRect(0, 0, w, EH);
        const lanes = D.channels === 2 && ed.lanes === 'lr' ? 2 : 1, laneH = (EH - RULER) / lanes, N = D.frames, fpp = ed.vn / w;
        // liniaal
        g.fillStyle = k.mu; g.strokeStyle = k.line; g.font = '10px system-ui'; g.globalAlpha = 0.9;
        const stepS = niceStep(70 * fpp / D.rate), first = Math.ceil(ed.v0 / D.rate / stepS);
        for (let q = first; q * stepS * D.rate <= ed.v0 + ed.vn + 1; q++) {
          const x = (q * stepS * D.rate - ed.v0) / ed.vn * w; g.beginPath(); g.moveTo(Math.round(x) + 0.5, RULER - 6); g.lineTo(Math.round(x) + 0.5, RULER); g.stroke();
          const ts = q * stepS; g.fillText(ts >= 1 || ts === 0 ? ts.toFixed(ts % 1 ? 2 : 0) + ' s' : Math.round(ts * 1000) + ' ms', x + 3, 11);
        }
        g.globalAlpha = 1;
        for (let lane = 0; lane < lanes; lane++) {
          const top = RULER + lane * laneH, mid = top + laneH / 2, amp = laneH / 2 - 3;
          g.strokeStyle = k.line; g.beginPath(); g.moveTo(0, Math.round(mid) + 0.5); g.lineTo(w, Math.round(mid) + 0.5); g.stroke();
          if (lane > 0) { g.beginPath(); g.moveTo(0, Math.round(top) + 0.5); g.lineTo(w, Math.round(top) + 0.5); g.stroke(); }
          const val = lanes === 2 ? (i => D.ch[lane][i]) : D.channels === 2 ? (i => (D.ch[0][i] + D.ch[1][i]) / 2) : (i => D.ch[0][i]);
          g.strokeStyle = k.au; g.fillStyle = k.au;
          if (fpp > 1.5) {
            g.beginPath();
            for (let x = 0; x < w; x++) {
              const s = Math.floor(ed.v0 + x * fpp), e2 = Math.min(N, Math.max(s + 1, Math.floor(ed.v0 + (x + 1) * fpp))); if (s >= N) break;
              const stp = Math.max(1, Math.floor((e2 - s) / 96)); let lo = 1e9, hi = -1e9;
              for (let i = s; i < e2; i += stp) { const v = val(i); if (v < lo) lo = v; if (v > hi) hi = v; }
              g.moveTo(x + 0.5, mid - hi * amp); g.lineTo(x + 0.5, Math.max(mid - lo * amp, mid - hi * amp + 1));
            }
            g.stroke();
          } else {
            const i0 = Math.max(0, Math.floor(ed.v0) - 1), i1 = Math.min(N - 1, Math.ceil(ed.v0 + ed.vn) + 1), pps = w / ed.vn;
            g.beginPath();
            for (let i = i0; i <= i1; i++) { const x = (i - ed.v0) * pps, y = mid - val(i) * amp; if (i === i0) g.moveTo(x, y); else g.lineTo(x, y); }
            g.stroke();
            if (pps >= 6) for (let i = i0; i <= i1; i++) g.fillRect((i - ed.v0) * pps - 1.5, mid - val(i) * amp - 1.5, 3, 3);
          }
        }
      }
      function edDraw() {
        if (!ecv || !ectx || !wctx) return;
        const w = ed.W, dpr = Math.min(2, Math.max(1, Number(globalThis.devicePixelRatio) || 1)), k = ecolors(), pw = Math.round(w * dpr), ph = Math.round(EH * dpr);
        if (ecv.width !== pw) ecv.width = pw; if (ecv.height !== ph) ecv.height = ph;
        const g = ectx; g.setTransform(dpr, 0, 0, dpr, 0, 0);
        const D = edData(), t = edTarget();
        if (!D || !t) { g.fillStyle = k.bg; g.fillRect(0, 0, w, EH); g.fillStyle = k.mu; g.font = '13px system-ui'; g.fillText(E.needSample, 12, EH / 2); return; }
        const key = D.id + '|' + D.frames + '|' + ed.v0.toFixed(3) + '|' + ed.vn.toFixed(3) + '|' + pw + '|' + ph + '|' + ed.lanes + '|' + ed.ver;
        if (key !== wkey) { if (wcv.width !== pw) wcv.width = pw; if (wcv.height !== ph) wcv.height = ph; paintWave(D, k, w, dpr); wkey = key; }
        g.drawImage(wcv, 0, 0, w, EH);
        const fx = f => (f - ed.v0) / ed.vn * w, N = D.frames;
        if (ed.sel) {
          const x0 = fx(ed.sel[0]), x1 = fx(ed.sel[1]);
          g.globalAlpha = 0.28; g.fillStyle = k.sel; g.fillRect(x0, RULER, x1 - x0, EH - RULER); g.globalAlpha = 1;
          g.fillStyle = k.sel; g.fillRect(x0 - 1, RULER, 2, EH - RULER); g.fillRect(x1 - 1, RULER, 2, EH - RULER);
          for (const x of [x0, x1]) { g.fillRect(x - 6, RULER, 12, 16); g.fillRect(x - 6, EH - 16, 12, 16); }
        }
        // slices: begin (doorgetrokken) en eigen eind (gestippeld, alleen als begin en eind niet gekoppeld zijn)
        const srec = store.get(D.id);
        if (srec && srec.slices.length) {
          const rg = sliceRanges(srec.slices, srec.sliceEnds, N), unl = !ed.link || !!(srec.sliceEnds && srec.sliceEnds.some(v => v > 0)), cur = rg[ed.slSel];
          if (cur) { g.globalAlpha = 0.16; g.fillStyle = k.go; g.fillRect(fx(cur[0]), RULER, fx(cur[1]) - fx(cur[0]), EH - RULER); g.globalAlpha = 1; }
          g.font = '10px system-ui'; g.lineWidth = 1;
          rg.forEach(([s0, e0], i) => {
            const x = Math.round(fx(s0)) + 0.5, on_ = i === ed.slSel, txt = String(i + 1), tw = txt.length * 6 + 8;
            if (x >= -40 && x <= w + 40) {
              g.strokeStyle = on_ ? k.fg : k.go; g.lineWidth = on_ ? 2 : 1; g.beginPath(); g.moveTo(x, RULER); g.lineTo(x, EH); g.stroke();
              g.fillStyle = on_ ? k.fg : k.go; g.fillRect(x, EH - 34, tw, 16); g.fillStyle = k.bg; g.fillText(txt, x + 4, EH - 22);
            }
            if (unl) { const x2 = Math.round(fx(e0)) + 0.5; if (x2 >= -40 && x2 <= w + 40) { g.strokeStyle = on_ ? k.fg : k.go; g.lineWidth = 1; g.setLineDash([3, 3]); g.beginPath(); g.moveTo(x2, RULER); g.lineTo(x2, EH); g.stroke(); g.setLineDash([]); g.fillStyle = on_ ? k.fg : k.go; g.fillRect(x2 - tw, EH - 52, tw, 16); g.fillStyle = k.bg; g.fillText(txt, x2 - tw + 4, EH - 40); } }
          });
          g.lineWidth = 1;
        }
        // start en einde van de laag, lus
        g.strokeStyle = k.ev; g.fillStyle = k.ev; g.font = '10px system-ui'; g.lineWidth = 1.5;
        const mk = (f, txt, dash, side) => { const x = Math.round(fx(f)) + 0.5; if (x < -20 || x > w + 20) return; g.setLineDash(dash ? [4, 3] : []); g.beginPath(); g.moveTo(x, RULER); g.lineTo(x, EH); g.stroke(); g.setLineDash([]); g.fillRect(side > 0 ? x : x - 12, RULER + 18, 12, 12); g.fillStyle = k.bg; g.fillText(txt, side > 0 ? x + 3 : x - 9, RULER + 28); g.fillStyle = k.ev; };
        if (t.kind === 'l') { mk(t.obj.start * N, 'S', false, 1); mk(t.obj.end * N, 'E', false, -1); }
        if (t.obj.loop.on) { mk(t.obj.loop.start * N, 'L', true, 1); mk(t.obj.loop.end * N, 'L', true, -1); }
        g.lineWidth = 1;
        // cursor en afspeelkop
        const cx = Math.round(fx(ed.cur)) + 0.5; g.strokeStyle = k.fg; g.beginPath(); g.moveTo(cx, RULER - 6); g.lineTo(cx, EH); g.stroke();
        g.fillStyle = k.fg; g.beginPath(); g.moveTo(cx - 5, RULER - 8); g.lineTo(cx + 5, RULER - 8); g.lineTo(cx, RULER - 1); g.fill();
        const pp = edPos(); if (pp >= 0) { const x = Math.round(fx(pp)) + 0.5; g.strokeStyle = k.go; g.lineWidth = 2; g.beginPath(); g.moveTo(x, RULER); g.lineTo(x, EH); g.stroke(); g.lineWidth = 1; }
      }
      function edLevels() {
        lvlTimer = 0; const D = edData(); if (!lvlEl) return;
        if (!D) { lvlEl.textContent = ''; return; }
        const a = ed.sel ? ed.sel[0] : 0, b = ed.sel ? ed.sel[1] : D.frames, names = D.channels === 2 ? [E.chL, E.chR] : [E.chM], out = [];
        D.ch.forEach((c, i) => { let pk = 0; for (let j = a; j < b; j++) { const v = Math.abs(c[j]); if (v > pk) pk = v; } out.push(names[i] + ' ' + fillT(E.peaks, fDbV(g2dB(pk)), fDbV(g2dB(rangeRms(c, a, b))))); });
        lvlEl.textContent = out.join('  ·  ');
      }
      function edRefresh(full) {
        if (!ecv) return;
        if (full) {
          edSync();
          const pad = curPad(), opts = [];
          pad.layers.forEach((l, i) => opts.push(['l' + i, fillT(E.layerN, i + 1) + ' · ' + (l.sampleId ? ((sampleInfo(l.sampleId) || {}).name || l.sampleId) : '–')]));
          pad.zones.forEach((z, i) => opts.push(['z' + i, fillT(E.zoneN, i + 1) + ' · ' + (z.sampleId ? ((sampleInfo(z.sampleId) || {}).name || z.sampleId) : '–')]));
          fillSelect(tgtSel, opts, ed.useZone && pad.zones[selZone] ? 'z' + selZone : 'l' + prog.layer);
          wkey = ''; esig = '';
        }
        const D = edData(), N = D ? D.frames : 0, rec = D ? store.get(D.id) || null : null, ns = rec ? rec.slices.length : 0;
        ed.slSel = clamp(ed.slSel, 0, Math.max(0, ns - 1));
        if (full) {
          if (ed.key !== ed.linkKey) {   // ander sample: schakelaar en startpad voor Slices naar pads opnieuw bepalen
            ed.linkKey = ed.key; ed.link = !(rec && rec.sliceEnds && rec.sliceEnds.some(v => v > 0)); if (linkCb) linkCb.checked = ed.link;
            const sb = P0.querySelector('[data-f="spBank"]'), sp = P0.querySelector('[data-f="spPad"]'); if (sb) sb.value = String(prog.bank); if (sp) sp.value = String(prog.pad);
          }
          const fn = P0.querySelector('[data-f="flNote"]'); if (fn && fn.getAttribute('data-user') !== '1') { const pd = curPad(), ly = pd.layers.find(l => l.sampleId); fn.value = String(ly && ly.root != null ? ly.root : pd.mode === 'key' ? pd.baseNote : 60); }
        }
        const sig = [ed.dec && ed.dec.id, N, ed.sel ? ed.sel.join('-') : '', ed.cur, ed.v0.toFixed(2), ed.vn.toFixed(2), ed.undo.length, ed.redo.length, !!ed.clip, ed.play ? 1 : 0, ed.mode, ed.slSel, rec ? sliceJson(rec) : ''].join('|');
        if (sig === esig) return; esig = sig;
        const sampleOk = !!D, hasSel = !!ed.sel, stereo = !!D && D.channels === 2;
        for (const x of edBtns) {
          const n = x.needs; x.b.disabled = (n === 'slices' && !ns) || (n === 'sample' && !sampleOk) || (n === 'sel' && (!sampleOk || !hasSel)) || (n === 'clip' && (!sampleOk || !ed.clip)) || (n === 'stereo' && !stereo) || (n === 'undo' && !ed.undo.length) || (n === 'redo' && !ed.redo.length);
        }
        const sn = i => ((i == null || Number.isNaN(i)) ? '' : String(i));
        selA.value = hasSel ? sn(ed.sel[0]) : ''; selB.value = hasSel ? sn(ed.sel[1]) : ''; curIn.value = sn(ed.cur);
        if (D) {
          infoEd.textContent = D.name + ' · ' + D.rate + ' Hz · ' + (D.channels === 2 ? 'stereo' : 'mono') + ' · ' + D.frames + ' ' + E.frames + ' · ' + fSec(D.frames / D.rate);
          selInfo.textContent = hasSel ? fillT(E.sel, ed.sel[1] - ed.sel[0], fSec((ed.sel[1] - ed.sel[0]) / D.rate)) : fillT(E.total, D.frames, fSec(D.frames / D.rate)) + ' · ' + E.noSel;
          scr.disabled = ed.vn >= N; scr.value = N - ed.vn > 0 ? String(Math.round(ed.v0 / (N - ed.vn) * 1000)) : '0';
        } else { infoEd.textContent = E.needSample; selInfo.textContent = ''; scr.disabled = true; }
        histEl.textContent = fillT(E.hist, ed.undo.length, ed.redo.length);
        paintChips(rec, D);
        if (lvlTimer) clearTimeout(lvlTimer); lvlTimer = setTimeout(edLevels, 120);
      }
      function paintChips(rec, D) {   // knoppen 1..n voor de slices, de tekst bij de gekozen slice en het huidige tempo
        const ns = rec ? rec.slices.length : 0, sig = ns + '|' + ed.slSel;
        if (slBox && sig !== chipSig) {
          chipSig = sig; slBox.textContent = '';
          for (let i = 0; i < ns; i++) { const b = H('button', 'btn slchip' + (i === ed.slSel ? ' sel' : ''), slBox, String(i + 1)); b.type = 'button'; b.setAttribute('aria-label', fillT(E.slPlay, i + 1)); b.setAttribute('data-slice', String(i)); b.onclick = () => { slPlay(i); }; b.onpointerdown = e => e.stopPropagation(); }
        }
        if (slInfoEl) {
          if (!ns || !D) slInfoEl.textContent = E.slNone;
          else { const [s0, e0] = sliceRanges(rec.slices, rec.sliceEnds, D.frames)[ed.slSel]; slInfoEl.textContent = fillT(E.slInfo, ed.slSel + 1, ns, fSec(s0 / D.rate), fSec(e0 / D.rate), e0 - s0); }
        }
        if (ed.tmUpdate) ed.tmUpdate();
      }
      function edMeasure() { const w = ecv ? Math.round(ecv.clientWidth) : 0; if (w > 0 && w !== ed.W) { ed.W = Math.max(120, w); wkey = ''; ed.dirty = true; } }
      statusEl = H('div', 'status', app); statusEl.setAttribute('role', 'status'); statusEl.setAttribute('aria-live', 'polite');

      // --- tekenen
      function colors() {
        if (!col) { const cs = typeof getComputedStyle === 'function' ? getComputedStyle(cv) : null, v = (n, d) => (cs && cs.getPropertyValue(n).trim()) || d; col = { bg: v('--well', '#101418'), fg: v('--well-fg', '#8a97a0'), au: v('--audio', '#4ec9d4'), ev: v('--event', '#f0a040') }; }
        return col;
      }
      function waveSource() {
        if (tab === 'zone') { const z = curZone(); return z ? { id: z.sampleId, start: 0, end: 1, loop: z.loop } : { id: '', start: 0, end: 1, loop: null }; }
        const l = curLayer(); return { id: l.sampleId, start: l.start, end: l.end, loop: l.loop };
      }
      function drawWave() {
        if (!cv || !cvCtx) return;
        const cssW = Math.max(120, Math.round(cv.clientWidth || 600)), dpr = Math.min(2, Math.max(1, Number(globalThis.devicePixelRatio) || 1)), w = Math.round(cssW * dpr), h = Math.round(110 * dpr), k = colors();
        if (cv.width !== w) cv.width = w; if (cv.height !== h) cv.height = h;
        const g = cvCtx; g.setTransform(dpr, 0, 0, dpr, 0, 0); g.fillStyle = k.bg; g.fillRect(0, 0, cssW, 110);
        const s = waveSource(), info = sampleInfo(s.id);
        if (!info) { g.fillStyle = k.fg; g.font = '13px system-ui'; g.fillText(T.dropHint, 12, 58); return; }
        const pk = peaksOf(s.id, cssW); if (!pk) return;
        g.globalAlpha = 0.25; g.fillStyle = k.au; g.fillRect(s.start * cssW, 0, (s.end - s.start) * cssW, 110); g.globalAlpha = 1;
        g.strokeStyle = k.au; g.beginPath();
        for (let x = 0; x < cssW; x++) { const lo = pk[x * 2], hi = pk[x * 2 + 1]; g.moveTo(x + 0.5, 55 - hi * 52); g.lineTo(x + 0.5, 55 - lo * 52 - 0.5); }
        g.stroke();
        g.strokeStyle = k.ev;
        const line = x => { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 110); g.stroke(); };
        line(s.start * cssW); line(s.end * cssW - 1);
        if (s.loop && s.loop.on) { g.setLineDash([4, 3]); line(s.loop.start * cssW); line(s.loop.end * cssW - 1); g.setLineDash([]); }
      }

      // --- verversen
      function paintPads() {
        const bank = prog.banks[prog.bank];
        for (let p = 0; p < NPAD; p++) {
          const pad = bank.pads[p], e = padEls[p], info = pad.layers.map(l => l.sampleId).find(Boolean) || (pad.zones[0] && pad.zones[0].sampleId) || '';
          const nm = pad.name || (info && (sampleInfo(info) || {}).name) || '';
          e.n1.textContent = String(p + 1).padStart(2, '0') + (pad.mode === 'key' ? ' ♪' : ''); e.n2.textContent = nm;
          e.n3.textContent = (pad.mode === 'drum' ? noteName(Math.min(127, padNote(prog.bank, p))) : T.keys) + (pad.output ? ' · ' + T.outN + ' ' + pad.output : '');
          e.b.classList.toggle('sel', p === prog.pad); e.b.classList.toggle('empty', !hasSound(pad));
          e.b.setAttribute('aria-label', T.pad + ' ' + BANK_LETTER[prog.bank] + (p + 1) + (nm ? ', ' + nm : '') + (hasSound(pad) ? '' : ', ' + T.empty));
          e.b.setAttribute('aria-pressed', p === prog.pad ? 'true' : 'false');
        }
        bankBtns.forEach((bt, b) => { bt.classList.toggle('sel', b === prog.bank); bt.setAttribute('aria-pressed', b === prog.bank ? 'true' : 'false'); });
        bankName.value = prog.banks[prog.bank].name;
        const pad = curPad(); padInfo.textContent = BANK_LETTER[prog.bank] + (prog.pad + 1) + (pad.mode === 'drum' ? ' · MIDI ' + padNote(prog.bank, prog.pad) : ' · ' + T.modeKey);
      }
      function fillZones() {
        const p = curPad(); selZone = clamp(selZone, 0, Math.max(0, p.zones.length - 1));
        fillSelect(zoneSel, p.zones.length ? p.zones.map((z, i) => [String(i), (i + 1) + ' · ' + noteName(z.keyLo) + '–' + noteName(z.keyHi) + ' · ' + ((sampleInfo(z.sampleId) || {}).name || T.none)]) : [['0', '–']], String(selZone));
        zoneBox.hidden = !p.zones.length;
        zoneInfo.textContent = p.mode !== 'key' ? T.zoneNotKey : (p.zones.length ? T.zoneCount.replace('{0}', p.zones.length) : T.zoneNone);
      }
      function refreshCtl() { for (const f of ctl) { try { f(); } catch (e) { /* een regelaar mag de rest niet stoppen */ } } }
      function refreshAll() {
        paintPads(); paintKeys();
        fillSelect(layerSel, sampleOpts(), curLayer().sampleId); fillZones();
        layerBtns.forEach((b, i) => { b.classList.toggle('sel', i === prog.layer); b.classList.toggle('has', !!curPad().layers[i].sampleId); b.setAttribute('aria-pressed', i === prog.layer ? 'true' : 'false'); });
        refreshCtl();
        const inf = sampleInfo(curLayer().sampleId);
        infoEl.textContent = inf ? inf.name + ' · ' + inf.rate + ' Hz · ' + (inf.channels === 2 ? 'stereo' : 'mono') + ' · ' + (inf.frames / inf.rate).toFixed(2) + ' s' + (inf.root != null ? ' · root ' + noteName(inf.root) : '') + (inf.loop ? ' · loop' : '') + (inf.demo ? ' · ' + T.builtin : '') : T.noSample;
        memEl.textContent = T.mem.replace('{0}', (storeBytes() / 1048576).toFixed(1)).replace('{1}', MAX_PCM / 1048576);
        drawWave(); showTab(tab); edRefresh(true);
      }
      // de klok van de host: treffers laten oplichten en het aantal stemmen tonen
      function tick() {
        const now = performance.now();
        for (let p = 0; p < NPAD; p++) { const hit = now - hitAt[prog.bank * NPAD + p] < 140; if (hit !== padEls[p].hit) { padEls[p].hit = hit; padEls[p].b.classList.toggle('hit', hit); } }
        if (tab === 'edit') { edRefresh(false); if (ed.dirty || ed.play) { ed.dirty = false; edDraw(); } }
        if (voiceCount !== lastVoices) { lastVoices = voiceCount; voicesEl.textContent = T.voices + ': ' + voiceCount + '/' + MAX_VOICES; }
      }
      // toetsenbord van de computer: pads (drum) of een pianorij (keygroup)
      const heldKeys = new Set();
      on(app, 'keydown', e => {
        const t = e.target && e.target.tagName; if (t === 'INPUT' || t === 'SELECT' || t === 'TEXTAREA' || e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
        if (tab === 'edit' && e.target && typeof e.target.closest === 'function' && e.target.closest('.edit')) return;   // in de editor zijn de letters voor de editor
        const k = String(e.key).toLowerCase();
        if (curPad().mode === 'key') { const n = PIANO_KEYS.indexOf(k); if (n >= 0 && !heldKeys.has(k)) { heldKeys.add(k); padDown(curI(), 'h:' + k, clamp(kbBase + 12 + n, 0, 127)); e.preventDefault(); } return; }
        for (let r = 0; r < 4; r++) { const c = KEYBOARD_ROWS[r].indexOf(k); if (c >= 0 && !heldKeys.has(k)) { heldKeys.add(k); padDown(prog.bank * NPAD + r * 4 + c, 'h:' + k); padEls[r * 4 + c].b.classList.add('down'); e.preventDefault(); } }
      });
      on(app, 'keyup', e => {
        const k = String(e.key).toLowerCase(); if (!heldKeys.has(k)) return; heldKeys.delete(k); padUp('h:' + k);
        for (const pe of padEls) pe.b.classList.remove('down');
      });
      const skinFn = () => { col = null; ecol = null; ed.ver++; ed.dirty = true; drawWave(); };
      if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') on(window, 'patchkamer-skin', skinFn);
      if (typeof ResizeObserver === 'function') { ro = new ResizeObserver(() => { if (tab === 'layer' || tab === 'zone') drawWave(); if (tab === 'edit') edMeasure(); }); try { ro.observe(cv); if (ecv) ro.observe(ecv); } catch (e) { /* ok */ } }
      stopFrame = tekenLus(host, selfRef, tick, 30);

      ui = {
        bk: bkUiApi, refreshAll, refreshCtl, say(m) { if (statusEl) statusEl.textContent = m || ''; }, drawWave,
        ed: { view() { ed.dirty = true; esig = ''; }, refresh() { esig = ''; edRefresh(false); } },
        destroy() {
          if (stopFrame) { stopFrame(); stopFrame = null; }
          if (lvlTimer) { clearTimeout(lvlTimer); lvlTimer = 0; }
          if (ro) { try { ro.disconnect(); } catch (e) { /* ok */ } ro = null; }
          for (const [t, ty, fn, o] of listeners) { try { t.removeEventListener(ty, fn, o); } catch (e) { /* ok */ } } listeners.length = 0;
          for (const h of handles) { try { h.destroy && h.destroy(); } catch (e) { /* ok */ } } handles.length = 0;
          for (const t of downs.values()) releaseTrig(t, ctx.currentTime); downs.clear();
          try { if (typeof wrap.remove === 'function') wrap.remove(); } catch (e) { /* ok */ }
        },
      };
      showTab(tab); refreshAll();
    }

    // ---------- parameters voor sturing (mod) ----------
    const PARAMS = (() => {
      const L = [{ id: 'level', name: T.k.level, lane: 'master', laneName: T.master, min: 0, max: 1, scale: 'lin', role: 'level', drift: 0.03, on: false }];
      for (let b = 0; b < NBANK; b++) for (let p = 0; p < NPAD; p++) {
        const id = padId(b, p), ln = T.pad + ' ' + BANK_LETTER[b] + (p + 1);
        L.push({ id: id + '.level', name: T.k['pad.level'], lane: id, laneName: ln, min: -60, max: 12, scale: 'lin', role: 'level', drift: 0.04, on: false });
        L.push({ id: id + '.cutoff', name: T.k['filt.cutoff'], lane: id, laneName: ln, min: 20, max: 20000, scale: 'log', role: 'filter', drift: 0.05, on: false });
        L.push({ id: id + '.tune', name: T.k['pad.tune'], lane: id, laneName: ln, min: -24, max: 24, scale: 'lin', role: 'pitch', drift: 0, on: false });
      }
      return L;
    })();
    const MODIDS = new Set(PARAMS.map(q => q.id));

    const self = {
      inputs: {}, outputs,
      mount(el) { if (dead || !el) return; if (ui) ui.destroy(); ui = null; buildUI(el); },
      unmount() { if (ui) { ui.destroy(); ui = null; } },
      onTransport(info) { if (info && info.playing === false) { const t = ctx.currentTime; for (const x of [...trigs]) releaseTrig(x, t); } },
      onEvent(port, ev) {
        try {
          if (dead || port !== 'notes' || !isObj(ev)) return;
          const t = Math.max(ctx.currentTime, Number.isFinite(ev.time) ? ev.time : ctx.currentTime), type = String(ev.type).toLowerCase().replace(/[_-]/g, '');
          if (type === 'allnotesoff' || type === 'panic') { panicAt(t); return; }
          const isNote = type === 'note' || type === 'noteon';
          if (type === 'noteoff' || (isNote && ev.vel === 0)) { if (Number.isFinite(ev.note)) noteOffAt(clamp(Math.round(ev.note), 0, 127), t); return; }
          if (isNote) {
            if (!Number.isFinite(ev.note)) return;
            const held = ev.held === true, dur = held ? null : (Number.isFinite(ev.dur) ? Math.max(0, ev.dur) : 0.25);
            playNote(clamp(Math.round(ev.note), 0, 127), num(ev.vel, 0.8, 0, 1), t, dur, held);
          } else if (type === 'trig') {
            const i = laneToPad(ev.lane), vel = num(ev.vel, 1, 0, 1); if (i < 0 || vel <= 0) return;
            const pad = padOf(i); trigger(i, t, vel, pad.mode === 'key' ? pad.baseNote : padNote(i >> 4, i & 15), Number.isFinite(ev.dur) ? Math.max(0, ev.dur) : 0.25, false);
          } else if (type === 'cc' && (ev.id === 'level' || ev.id === 'volume') && Number.isFinite(ev.value)) {
            prog.level = clamp(ev.value, 0, 1); applyMaster(); if (ui) ui.refreshCtl();
          }
        } catch (e) { /* een event mag de planner nooit breken */ }
      },
      params() { return PARAMS.map(q => ({ ...q })); },
      modulate(o) {
        if (dead) return; const n = Object.create(null);
        if (isObj(o)) for (const k of Object.keys(o)) if (MODIDS.has(k) && typeof o[k] === 'number' && Number.isFinite(o[k])) n[k] = clamp(o[k], -1, 1);
        mod = n; allLive();
      },
      noteNames() { try { return noteList(); } catch (e) { return []; } },
      async loadAudio(files) { await loadFiles(files); },
      importReport() { return lastReport ? JSON.parse(JSON.stringify(lastReport)) : null; },
      bankCatalog() { return JSON.parse(JSON.stringify(CATALOG)); },
      getState() {
        const samples = {}; for (const [id, r] of store) samples[id] = serSample(r);
        const cr = creditsOf(store);
        return {
          v: 1, bank: prog.bank, pad: prog.pad, layer: prog.layer, baseNote: prog.baseNote, level: prog.level, padVel: prog.padVel,
          banks: prog.banks.map(bk => ({ name: bk.name, pads: bk.pads.map(serPad) })), samples,
          ...(cr.length ? { credits: cr } : {}),
        };
      },
      setState(raw) {
        if (dead) return;
        const s = isObj(raw) ? raw : {};
        panicAt(ctx.currentTime); token++;
        const next = new Map(); let total = 0, dropped = 0, n = 0;
        if (isObj(s.samples)) for (const id of Object.keys(s.samples)) {
          if (++n > 4096) { dropped++; break; }
          const rec = nSample(id, s.samples[id]);
          if (!rec || total + rec.bytes > MAX_PCM) { dropped++; continue; }
          next.set(id, rec); total += rec.bytes;
        }
        const has = id => !!DEMO_BY_ID[id] || next.has(id);
        prog.banks = Array.isArray(s.banks) ? Array.from({ length: NBANK }, (_, i) => nBank(s.banks[i], i, has)) : defaultBanks();
        prog.bank = int(s.bank, 0, 0, NBANK - 1); prog.pad = int(s.pad, 0, 0, NPAD - 1); prog.layer = int(s.layer, 0, 0, NLAYER - 1);
        prog.baseNote = int(s.baseNote, 36, 0, 63); prog.level = num(s.level, 0.8, 0, 1); prog.padVel = int(s.padVel, 100, 1, 127);
        store.clear(); for (const [k, v] of next) store.set(k, v);
        for (const id of [...bufs.keys()]) if (!DEMO_BY_ID[id]) bufs.delete(id);   // een id met andere inhoud mag geen oude buffer erven
        edStop(); clearHistory(); ed.dec = null; ed.key = ''; ed.sel = null; ed.cur = 0; ed.useZone = false;
        gcStore(); rr.fill(0); lastPick.fill(-1); selZone = 0;
        allLive(); notesNotify(); warm();
        if (ui) ui.refreshAll();
        if (dropped) say(T.dropped.replace('{0}', dropped));
      },
      destroy() {
        if (dead) return; dead = true; token++;
        if (job) { try { job.ctl.abort(); } catch (e) { /* ok */ } job = null; }
        if (warmTimer) { clearTimeout(warmTimer); warmTimer = 0; }
        if (ui) { ui.destroy(); ui = null; }
        for (const x of [...trigs]) for (const v of x.voices) { try { v.source.onended = null; v.source.stop(); } catch (e) { /* al gestopt */ } }
        trigs.clear();
        for (const n of nodes) { try { n.disconnect(); } catch (e) { /* los */ } }
        nodes.clear(); bufs.clear(); store.clear(); clearHistory(); ed.clip = null; ed.dec = null; ed.play = null;
      },
    };
    selfRef = self;
    return self;
  },
};
