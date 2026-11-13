// 1.38.0 — Knop Nieuw project naast de projectnaam: begint een leeg project (één lege scène, één lege sectie in één song, lege clips, geen titel; de vier standaardsporen blijven). Via Ongedaan maken terug te halen. State en presets zijn gelijk.
// 1.37.2 — De matrix houdt zijn scrollpositie bij elke nieuwe weergave en scrolt de scène die speelt in beeld (alleen als die buiten beeld valt).
// 1.37.1 — Minder ruimte tussen de poortenrij en de regel met Project, en de lijn in de kleur van de sectie staat verder naar links, los van de afspeelknoppen van de scènes. Alleen de kaart.
// 1.37.0 — Kleuren met een kleurkiezer (geen lijst met nummers meer): de kleur van een spoor (onder het potlood in de spoorkop), van een scène (het potlood bij de scène; een gekleurd stipje) en van een sectie (rand van het blok in de songbalk). Klik op de naam van een scène om hem te hernoemen. De vakjes met clipnummers in de sectieblokken zijn weg. Kies je een sectie, dan staat links en rechts van haar scènes in de matrix een verticale lijn in de kleur van de sectie. Nieuwe optionele velden `scenes[].color` en `arrangement[].color`; `tracks[].color` mag elke #rrggbb zijn. Bestaande songs en presets zijn gelijk.
// 1.36.0 — Een sectie kan meer scènes hebben (optioneel veld `scenes`): ze spelen na elkaar, elke scène `maten` lang, en de reeks herhaalt `herhalingen` keer. Bij Scènes in de sectie-instellingen voeg je er een toe met + scène en wissel je de volgorde met ‹ ›. De rij Sectie onder de spoorkoppen is weggehaald (clips en doorlopen per sectie blijven bij het afspelen gelden). In 01 staan geen clipknoppen meer (Knip clip is erbij gekomen in 02). De kop van 02 toont TRACK / SCÈNE / CLIP. Bestaande songs en presets zijn gelijk.
// 1.35.0 — Sectie 02 (Track) is opgegaan in de spoorkop in de matrix. Klik op de naam of het label van een spoor om het aan te passen; het tracktype is een keuzelijst in de kop; kleur, transponeren, gate, swing spoor, velocity schaal, Track auditeren (en bij drums protocol, swing rij en de drumrijen) staan onder het potlood van elk spoor. Live opname → deze clip staat nu in de clip-editor. De clip-editor is sectie 02 geworden. Geen state-wijziging.
// 1.34.0 — Een clip aan een scène toekennen met een keuzelijst. Elke cel van de matrix heeft een keuzelijst (▾ in de hoek; een lege cel toont kies clip ▾): kies een clip uit de bibliotheek van dat spoor, geen clip, of Nieuwe clip. Dezelfde clip mag in zoveel scènes als je wilt; een wijziging in de clip klinkt in alle. Een lege cel maakt niet meer vanzelf een clip aan. Geen state-wijziging.
// 1.33.0 — De clips zijn een bibliotheek per spoor (de clipbalk in 03), los van de scènes. Een scène is een rij die per spoor naar een clip uit die bibliotheek wijst (nieuw optioneel spoorveld `cells`: per scène het nummer van de clip of -1). De volgorde en nummers van de clips veranderen nooit door scène-acties: een scène verwijderen, toevoegen, dupliceren of verplaatsen laat de bibliotheek ongemoeid. Een clip uit een scène halen (rechtermuisknop of Delete: Haal uit scène) laat hem in de bibliotheek staan; Verwijder clip helemaal gooit hem echt weg, ook uit alle scènes. Een lege cel toont + (klik maakt een nieuwe clip); Hergebruik clip, Hergebruik in volgende lege scène en in alle lege scènes zetten dezelfde clip in meer scènes, en een clip uit de clipbalk naar een cel slepen doet hetzelfde (een verwijzing, geen kopie). Slepen van scène naar scène verplaatst de verwijzing, met Ctrl komt er een eigen kopie. De bibliotheek begint met 8 clips en groeit tot 48 per spoor. Songs en presets zonder `cells` laden gelijk (scène n speelt clip n); koppelingen (`ref`) uit 1.31 en 1.32 worden verwijzingen. getState en presets laten `cells` weg zolang het gewoon scène n = clip n is.
// 1.31.0 — Een clip hergebruiken: een slot kan een koppeling zijn naar een clip van hetzelfde spoor (optioneel clip-veld `ref`). Rechtermuisknop op een clip: Hergebruik in volgende lege scène of in alle lege scènes; op een leeg slot: Hergebruik clip n; Alt + slepen op hetzelfde spoor werkt ook. Een wijziging in de bronclip klinkt in elke scène die ernaar verwijst; Maak eigen kopie of Verwijder koppeling maakt het slot weer los. Ontbrekende of ongeldige koppelingen vallen weg. Een uitgerekte clip volgt de secties van de song, en ongedaan maken per deel. (1) Een clip die je over meerdere scènes hebt uitgerekt, loopt in songmodus door in de volgende secties zolang de scène van die sectie op dat spoor geen eigen clip heeft; de secties hoeven dus niet onder elkaar te staan en de lengte van elke sectie bepaalt hoeveel maten van de clip ze spelen (de clip gaat verder waar de vorige sectie ophield en stopt aan het eind van de clip). Een sectie die op dat spoor wel een eigen clip heeft, speelt die. Sessiemodus en bestaande songs zonder uitgerekte clip klinken gelijk. De songbalk toont het vervolg (streepje in het vakje en het clipnummer van de uitgerekte clip). (2) Undo en Redo staan nu ook in de songbalk, bij de clipmatrix en in de clip-editor, en Ctrl+Z werkt voor het deel waar je het laatst klikte: alleen de laatste wijziging in dat deel gaat terug, wijzigingen in andere delen blijven staan. De Undo en Redo bovenin blijven alles in volgorde terugdraaien. Geen nieuwe state-velden; getState, presets en setState zijn gelijk aan 1.30.0.
// 1.30.0 — Cliplengte verdubbelen of halveren. In de clip-editor staan naast CLIPLENGTE twee knoppen, ÷ 2 en × 2: de lengte gaat naar de helft of het dubbele en alle noten (positie en lengte), CC-punten en instellingspunten worden gelijkmatig herverdeeld. Bij hetzelfde tempo klinkt een verdubbeld patroon half zo snel; bij het dubbele tempo klinkt het weer als eerst. Halveren kan bij een even aantal maten, verdubbelen tot 64 maten; tijden worden op 1/64 afgerond. Ongedaan maken zet het terug.
// 1.29.1 — Een sectie in de songbalk verschuiven (slepen of ← →) zet nu ook de scènerijen in de matrix in die volgorde. De scènes van de song nemen de plekken in die ze al hadden, in de volgorde van de song; andere rijen blijven staan, namen en clips gaan mee en de afspeelklok loopt door. Voorheen bleef de matrix op de oude volgorde staan.
// 1.29.0 — Secties en clips bewerken. Rechtermuisknop op een sectieblok of een clip: kopiëren, knippen, plakken, dupliceren en verwijderen; dezelfde handelingen met Ctrl+C, Ctrl+X, Ctrl+V en Delete (Ctrl+Z) voor het deel van de kaart waar je het laatst klikte. Een sectie verplaatsen door hem aan te klikken, ingedrukt te houden en te slepen (dikke rand voor of na het blok). Elk sectieblok toont per spoor het clipnummer (rand = andere clip dan de scène, streep = Doorlopen), zodat wat je in de rij Sectie van de matrix kiest meteen in de songbalk staat. Een clip past alleen op een spoor van dezelfde soort (drums met drums, toetsen en drone onderling); Knip clip erbij. Clip-editor: Kopieer pagina en Plak pagina (noten, CC en instellingen van de gekozen pagina naar een andere pagina, ook in een andere clip of op een ander spoor van dezelfde soort; de doelpagina wordt vervangen). De statusregel (Host transport staat stil) staat rechts in de regel met de poorten; Startpunt en Laad startpunt zijn uit de kaart (het beginproject blijft hetzelfde). Alleen de kaart: de state, getState/setState, presets en het afspelen zijn gelijk aan 1.28.0.
// 1.28.0 — Uitleg naar about (menu Over Clip Arranger); de UI toont geen uitlegtekst meer.
// 1.27.0 — Titel in de UI verwijderd: de kaartbalk toont de naam; de ondertitel staat nu in het definitieveld about.
// 1.26.0 — Scènes, songs en uitrekken. Het aantal scènes is vrij (1 tot 24, was vast 8): per scène hernoemen (dubbelklik op de naam), een lege scène invoegen, dupliceren (alle sporen), verwijderen en slepen om te ordenen, plus + Scène en Verwijder lege scènes (lege scènes die in geen enkele song zitten). Meerdere songs op dezelfde scènes en clips (state `songs` en `activeSong`; `arrangement` blijft de actieve song): Nieuwe song, Dupliceer song (voor een remix), Verwijder song, naam. Een scène slepen op een songblok wijst hem toe, op + voegt een sectie toe. Scènes die in de actieve song niet voorkomen zijn gedimd en de tooltip toont in welke songs ze zitten. Een clip uitrekken over meerdere scènes (clip-veld `span`: greep onderaan de clip omlaag slepen, of het veld Over scènes): scène k speelt vanaf k/span van de clip, in sessie- en songmodus. Het slepen van clips toont nu in elke kleurstelling (donker, licht, retro) waar je kunt neerzetten (stippellijn op alle doelen, een dikke rand en vulling op het doel onder de muis). De matrix scrolt met vaste spoorkoppen en een vaste scènekolom. Het afspelen van bestaande songs en presets is gelijk aan 1.25.0 (gemeten); getState/setState zijn een uitbreiding (songs, activeSong, span, scenes tot 24).
// 1.25.0 — Songbalk in 01 (deel 2). Sectie 04 is vervallen: boven de clipmatrix staat een songbalk met de secties als blokken (breedte naar maten, een lijn die meeloopt), daaronder de instellingen van de gekozen sectie (scène, maten, herhalingen, toevoegen, verplaatsen, verwijderen, Speel vanaf sectie) en in de matrix een sectierij met per spoor de clip van die sectie (of Stil) en Doorlopen of Opnieuw: bij Doorlopen gaat een clip die ook in de vorige sectie speelde verder waar hij was, zodat een lange clip over meerdere secties loopt terwijl andere sporen blijven herhalen. State: een sectie mag clips (per spoor null, -1 of 0…7) en cont (per spoor true) hebben; oudere songs werken ongewijzigd.
// SPDX-License-Identifier: AGPL-3.0-or-later
// 1.24.0 — Clipmatrix en editor verbeterd (deel 1). Afspelen: de matrix toont boven in 01 in welke songsectie en maat de sequencer is, en elke spelende clip heeft een verticale lijn die meeloopt (met streepjes per maat bij clips van meer dan één maat). Clips verslepen in de matrix (verplaatsen; Ctrl = kopiëren; naar een spoor van dezelfde soort) en Kopieer, Plak, Dupliceer en Verwijder bij de matrix. Een clip toont alleen zijn lengte in maten (geen tijd en events meer). Spoornaam aanpassen met ✎ in de matrix. De spoorkeuze staat in 02 (niet meer in 03). Een andere clip of een ander spoor zet het klavier en de octaafkeuze op de noten van de clip. Noten verlengen met een bredere rand-greep (12 px; niet langer dan de clip). 05 · Instrumenten toewijzen is vervallen (alleen een lijst van labels). Geen nieuwe state-velden.
// 1.23.0 — Clipbalk in 03 · Clip editor: de sporen en de 8 clips van het gekozen spoor als knoppen (naam en lengte, lege clips gedimpt, de spelende clip gemarkeerd), met ‹ › voor vorige en volgende clip, Nieuwe clip (eerste lege slot), Dupliceer (kopie in het eerstvolgende lege slot) en Verwijder clip (maakt het slot leeg; Ongedaan maken kan). Een sectie van het songarrangement kiezen zet de editor op de scène van die sectie en omlijnt die scène in de clipmatrix. Geen nieuwe state-velden.
// 1.22.1 — Eigen klok: staat de klok van de pagina stil, dan spelen "Speel deze clip", een scène starten (▶) en een clip starten (▶ in het raster) toch, los van de rest van het canvas; het apparaat loopt dan op zijn eigen klok (tempo en swing van de pagina). Start de pagina de klok, dan neemt die het over. Nieuwe knop "■ Stop" stopt de eigen klok. Geen contractwijziging.
// 1.22.0 — Patchkamer contract v1.24: klembord, scènes met meerdere sporen. `clipInfo()` meldt nu ook `multi` en `tracks` (alle sporen met hun soort: toetsen en drone `notes`, drums `drums`), `getClip({ kind: 'multi' })` geeft de scène (de gekozen clip van elk spoor, de kolom `selectedClip`) en `setClip` neemt een multi-clip: elk toegewezen spoor krijgt zijn clip op die plaats (naam, CC-lanes en auto-lijnen blijven, of komen via `native` exact terug), in één Undo-stap; sporen van een andere soort of zonder clip blijven staan. De gewone clip van het gekozen spoor, `getState`, presets en het geluid zijn gelijk aan 1.21.0.
// 1.21.0 — Patchkamer contract v1.21: instellingen opnemen en afspelen. Nieuw: per clip `auto` (hoogstens 32 lijnen `{ id, points: [{ step, value }] }`, value 0 … 1, een waarde blijft staan tot het volgende punt), in de state `automation` (`sequencer` = exact zoals opgenomen, de modulatie op die regelaars wordt genegeerd; `modulators` = de lijn is de basisstand) en `recordSettings` (werkstand). Met Opname aan en de klok lopend schrijft elke draai aan het aangesloten apparaat (of beweging van een modulator) een punt in de gekozen clip van het gekozen spoor; noten, drums en akkoorden blijven ongemoeid. Afspelen zet de regelaars per zestiende met `host.setParam`. De weergave Instellingen onder de CC-lanes toont een lijn per regelaar. Een song zonder lijnen geeft exact dezelfde gebeurtenissen als 1.17.0 (58 presets, 42246 gebeurtenissen, 0 verschillen).
// 1.17.0 — Patchkamer contract v1.17: klembord voor clips. Nieuw: `clipInfo()`, `getClip()` en `setClip(clip)` (formaat `patchkamer-clip`, tijd in tikken van 12 per zestiende, dus 192 per maat). Het tracktype bepaalt de soort: toetsen en drone zijn `notes`, drums is `drums` (de banen zijn de rijen van het spoor, ook die van een aangesloten apparaat met klanknamen). Plakken vervangt de noten van de gekozen clip en zet lengte (hele maten), raster en clipswing; naam, CC-lanes en de rest van de compositie blijven staan; de noot-nummers worden opnieuw uitgedeeld; de grens van 4096 noten geldt; Undo en Redo werken. Een clip uit dit apparaat komt via `native` verliesvrij terug (ook CC-lanes). Verder niets gewijzigd: `getState`, presets, geluid en bestaande songs zijn gelijk aan 1.14.0.
// 1.14.0 — Swing per niveau, opname en één clip spelen. Swing (0 … 0,5 van een zestiende, standaard 0) op clip- (`swing`), spoor- (`swing`) en drumrij-niveau (`rowSwing`, per nootnummer van de rij); samen (som, hoogstens 0,5) vertragen ze de noten, ratchets en CC van de oneven zestienden, bovenop de swing van de host. Live opname kwantiseert naar het dichtstbijzijnde geswingde rasterpunt, een nieuwe noot op dezelfde plek en rij vervangt de oude, de opnamemodus `recordMode` is Aanvullen (standaard) of Overschrijven (wist de clip bij de eerste ingespeelde noot van een opnamerun). 'Speel deze clip' loopt alleen de gekozen clip van het gekozen spoor, los van scènes en song. Een drumspoor dat een apparaat met klanknamen volgt, stuurt zijn rijen als noot (niet als trig op chN): dat bereikt ook de gastinstrumenten. Rijen die buiten de lijst vallen crashen de weergave niet meer. Met alle nieuwe velden op hun standaard speelt alles als voorheen.
// 1.13.1 — De poorten staan in één horizontale rij bovenin de kaart (ui.jacks): ingang, dan alleen zoveel spooruitgangen als er sporen zijn (met alleen het nummer), en rechts altijd de multi-MIDI-poort Sporen. Minder sporen haalt de kabels van de verdwenen uitgangen weg.
// 1.13.1 — Een drumspoor volgt het aangesloten apparaat (noteNames, contract v1.14): de rol toont de hele lijst klanken van het apparaat onder elkaar, met hun nootnummers en kanalen, ook als de kit of volgorde wijzigt.
// 1.13.1 — Pads kiezen een spoor of starten een scène (state `pads`): noten in een instelbaar bereik (standaard 36…, de pads van een MPK mini) spelen niet maar kiezen
//   spoor 1…n, en een tweede bereik (standaard 44…51) start scène 1…8. Standaard uit, dus een bestaande song klinkt gelijk. De instelling hoort bij de hardware: een preset laat haar staan.
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
// Een clip-, scène- en songsequencer met tot 16 sporen. Elk spoor heeft een clip (noten en CC-lanes) per scène (1 tot 24 scènes); een scène start de clips van alle sporen,
// een song speelt scènes in een arrangement. Er komt geen geluid uit dit apparaat: elk spoor stuurt note-, trig- en cc-gebeurtenissen naar zijn uitgang.
const EN = {
  'Host transport staat stil.': 'Host transport is stopped.', 'Sequencer uit': 'Sequencer off', 'Sequencer aan': 'Sequencer on',
  'Song afgelopen': 'Song ended', 'maat {0}': 'bar {0}',
  'SONG': 'SONG', 'TRACKS': 'TRACKS', 'AFSPELEN': 'PLAYBACK', 'Clips / scènes': 'Clips / scenes', 'Song arrangement': 'Song arrangement',
  'Vanaf begin': 'From start', 'Song herhalen': 'Loop song', 'Undo': 'Undo', 'Redo': 'Redo', 'Hergebruik in volgende lege scène': 'Reuse in next empty scene', 'Haal uit scène': 'Take out of scene', 'Kleur van scène {0}': 'Colour of scene {0}', 'Kleur van de sectie': 'Colour of the section', 'Geen kleur': 'No colour', 'Klik om de naam van scène {0} te wijzigen': 'Click to change the name of scene {0}', 'SCÈNES': 'SCENES', 'MATEN PER SCÈNE': 'BARS PER SCENE', '+ scène': '+ scene', 'Scène uit deze sectie halen': 'Take scene out of this section', 'Scène aan deze sectie toevoegen': 'Add a scene to this section', 'Voeg een scène toe: de scènes van een sectie spelen na elkaar': 'Add a scene: the scenes of a section play one after another', '{0} scènes × {1} maten': '{0} scenes × {1} bars', '{0} herhalingen': '{0} repeats', 'Instellingen van spoor {0}': 'Settings of track {0}', 'Klik om de naam van spoor {0} te wijzigen': 'Click to change the name of track {0}', 'Klik om het label (doelapparaat) van dit spoor te wijzigen': 'Click to change the label (target device) of this track', 'kies clip ▾': 'choose clip ▾', 'Kies welke clip deze scène op dit spoor speelt': 'Choose which clip this scene plays on this track', 'Kies welke clip deze scène op dit spoor speelt (dezelfde clip mag in meer scènes)': 'Choose which clip this scene plays on this track (the same clip may be in more scenes)', 'Clip van scène {0}, spoor {1}': 'Clip of scene {0}, track {1}', '— geen clip —': '— no clip —', '+ Nieuwe clip': '+ New clip', 'in scène {0}': 'in scene {0}', 'hergebruikt in {0} scènes': 'reused in {0} scenes', 'Nieuwe clip hier': 'New clip here', 'Nieuwe clip in deze scène': 'New clip in this scene', 'Start track {0} scène {1}': 'Start track {0} scene {1}', 'De bibliotheek van dit spoor is vol (48 clips)': 'The library of this track is full (48 clips)', 'Nieuwe clip in de bibliotheek; staat de gekozen scène nog leeg, dan komt hij daarin': 'New clip in the library; if the selected scene is still empty it goes in there', 'Kopie van de gekozen clip, in de eerstvolgende lege scène': 'Copy of the selected clip, in the next empty scene', 'Gooit de clip weg, ook uit alle scènes waar hij in staat (Ongedaan maken kan)': 'Throws the clip away, also from every scene it is in (Undo works)', 'Verwijder clip helemaal': 'Delete clip completely', 'Sleep naar een scène in de matrix om hem daar te hergebruiken': 'Drag to a scene in the matrix to reuse it there', 'Hergebruik in alle lege scènes': 'Reuse in all empty scenes', 'Hergebruik clip {0}: {1}': 'Reuse clip {0}: {1}', 'Maak eigen kopie': 'Make own copy', 'Verwijder koppeling': 'Remove link', 'hergebruik': 'reused', 'Hergebruikt clip {0}: een wijziging in die clip klinkt hier ook': 'Reuses clip {0}: a change in that clip sounds here too', 'de songbalk': 'the song bar', 'de clipmatrix': 'the clip matrix', 'de clip-editor': 'the clip editor', 'Maakt de laatste wijziging in {0} ongedaan (Ctrl+Z)': 'Undoes the last change in {0} (Ctrl+Z)', 'Zet de laatst ongedaan gemaakte wijziging in {0} terug (Ctrl+Shift+Z)': 'Restores the last undone change in {0} (Ctrl+Shift+Z)',
  'STARTPUNT': 'TEMPLATE', 'Techno / house': 'Techno / house', 'Ambient / drone': 'Ambient / drone', 'Rock / pop': 'Rock / pop', 'Leeg project': 'Empty project', 'Begint een nieuw, leeg project: één lege scène, één lege sectie, lege clips en geen titel. De sporen blijven, de koppelingen niet. Ongedaan maken kan.': 'Starts a new, empty project: one empty scene, one empty section, empty clips and no title. The tracks stay, the links do not. Undo works.',
  'SWING CLIP': 'CLIP SWING', 'SWING SPOOR': 'TRACK SWING', 'SWING RIJ': 'ROW SWING', 'RIJ': 'ROW',
  'CLIP SPELEN EN OPNEMEN': 'PLAY AND RECORD THIS CLIP', '▶ Speel deze clip': '▶ Play this clip', '■ Stop clip': '■ Stop clip', '● Opname': '● Record', 'OPNAME': 'RECORDING',
  'Aanvullen': 'Overdub', 'Overschrijven': 'Replace', 'Clip speelt los van scènes en song': 'Clip plays apart from scenes and song', 'CLIP · maat {0} · {1} BPM': 'CLIP · bar {0} · {1} BPM',
  'Pads kiezen spoor': 'Pads select track', 'Pads starten scène': 'Pads start scene', 'vanaf noot': 'from note', 'Gekozen spoor: {0} · {1}': 'Selected track: {0} · {1}', 'Laad startpunt': 'Load template', 
  'Nieuwe song': 'New song', 'Zwevende velden': 'Floating fields', 'Band schets': 'Band sketch', 'Nachtpatronen': 'Night patterns',
  'SCÈNE': 'SCENE', 'Patch → track': 'Patch → track', 'Track stoppen op volgende maat': 'Stop track at next bar',
  'Start scène {0}': 'Start scene {0}', 'Start track {0} clip {1}': 'Start track {0} clip {1}',
  '{0} maten · {1} noten · {2} CC-lanes': '{0} bars · {1} notes · {2} CC lanes', '{0}m · {1} events': '{0}b · {1} events',
  '01 · CLIPMATRIX': '01 · CLIP MATRIX', '■ Stop': '■ Stop', 'Eigen klok: de rest van het canvas speelt niet mee': 'Own clock: the rest of the canvas does not play along',
  'TRACKNAAM': 'TRACK NAME', 'DOELAPPARAAT (LABEL)': 'TARGET DEVICE (LABEL)', 'TRACKTYPE': 'TRACK TYPE',
  'Toetsen / melodie': 'Keys / melody', 'Drumcomputer': 'Drum machine', 'Drone / pad / ambient': 'Drone / pad / ambient', 'KLEUR': 'COLOUR', 'Kleur {0}': 'Colour {0}',
  'TRANSPONEREN': 'TRANSPOSE', 'GATE': 'GATE', 'DRUMPROTOCOL': 'DRUM PROTOCOL', 'Trig → kanaalnaam': 'Trig → channel name', 'MIDI → notennummer': 'MIDI → note number',
  'VELOCITY SCHAAL': 'VELOCITY SCALE', 'Track auditeren': 'Audition track', 'Live opname → deze clip': 'Live record → this clip',
  'Drumrijen en kanaaltoewijzing': 'Drum rows and channel assignment', 
  'RIJ {0}': 'ROW {0}', 'TRIG LANE {0}': 'TRIG LANE {0}', 'MIDI {0}': 'MIDI {0}',
  '02 · CLIP EDITOR — TRACK {0} / SCÈNE {1} / CLIP {2}': '02 · CLIP EDITOR — TRACK {0} / SCENE {1} / CLIP {2}', 'CLIPNAAM': 'CLIP NAME', 'CLIPLENGTE (MATEN)': 'CLIP LENGTH (BARS)',
  'ZOOM': 'ZOOM', '1 maat / 16 stappen': '1 bar / 16 steps', '2 maten / 32 stappen': '2 bars / 32 steps', '4 maten / 64 stappen': '4 bars / 64 steps',
  'PAGINA': 'PAGE', '{0} · stap {1}': '{0} · step {1}', 'OCTAAF': 'OCTAVE', 'RASTER': 'GRID', 'Kwantiseer live invoer': 'Quantize live input',
  'Kopieer clip': 'Copy clip', '{0} maten': '{0} bars', '1 maat': '1 bar', 'Naam van spoor {0} wijzigen': 'Rename track {0}', 'Song · sectie {0}/{1} · {2} · maat {3} van {4}': 'Song · section {0}/{1} · {2} · bar {3} of {4}', 'Sessie · maat {0}': 'Session · bar {0}', 'SPOOR': 'TRACK', 'CLIP': 'CLIP', 'Vorige clip': 'Previous clip', 'Volgende clip': 'Next clip', 'Nieuwe clip': 'New clip', 'Eerste lege slot van dit spoor; daar begin je een nieuwe clip': 'First empty slot of this track; start a new clip there', 'Alle 8 slots van dit spoor zijn in gebruik': 'All 8 slots of this track are in use', 'Dupliceer': 'Duplicate', 'Kopie in het eerstvolgende lege slot': 'Copy in the next empty slot', 'Verwijder clip': 'Delete clip', 'Maakt dit slot leeg (Ongedaan maken kan)': 'Empties this slot (Undo works)', 'leeg': 'empty', 'Spoor {0}: {1}': 'Track {0}: {1}', 'Clip {0}: {1} · {2} maten · {3} noten': 'Clip {0}: {1} · {2} bars · {3} notes', 'Plak clip': 'Paste clip', 'Kopie naar volgende scène': 'Copy to next scene', 'Wis noten': 'Clear notes',
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
  'INSTELLINGEN · opnemen en afspelen': 'SETTINGS · record and play', 'Instellingen opnemen bij Opname': 'Record settings while recording', 'WIE SPEELT DE INSTELLINGEN': 'WHO PLAYS THE SETTINGS',
  'Sequencer (exact zoals opgenomen)': 'Sequencer (exactly as recorded)', 'Modulatoren (lijn is de basisstand)': 'Modulators (line is the base position)',
  'Verbind dit spoor met een apparaat om zijn instellingen op te nemen.': 'Connect this track to a device to record its settings.', 'Dit apparaat biedt geen regelaars aan die je kunt opnemen.': 'This device offers no controls that you can record.',
  'Wis deze lijn': 'Clear this line', 'Instellingen: {0}': 'Settings: {0}',
  'Maak een lane met een parameter-id die het aangesloten apparaat begrijpt. Maximaal 8 lanes per clip.': 'Create a lane with a parameter id the connected device understands. At most 8 lanes per clip.',
  'CC tekenen {0}': 'Draw CC {0}', 'Stap {0}: {1}% · rechtsklik verwijdert': 'Step {0}: {1}% · right-click deletes',
  '{0} punten · exact bewerken': '{0} points · edit exactly', 'CC STAP': 'CC STEP', 'CC WAARDE (%)': 'CC VALUE (%)', 'Verwijder CC-lane': 'Delete CC lane',
  '01 · SONG EN CLIPMATRIX': '01 · SONG AND CLIP MATRIX', 'SECTIE {0} / {1}': 'SECTION {0} / {1}', 'SECTIE {0}': 'SECTION {0}', '{0} maten × {1} herhalingen': '{0} bars × {1} repeats', '{0} maten in totaal · {1} in de hele song': '{0} bars in total · {1} in the whole song',
  'Voegt een kopie van deze sectie toe, direct erna': 'Adds a copy of this section right after it', 'Sectie naar voren': 'Move section earlier', 'Sectie naar achteren': 'Move section later', 'Sectie verwijderen': 'Delete section',
  'Clip van de scène ({0})': 'Clip of the scene ({0})', 'Stil': 'Silent', 'Clip in sectie, spoor {0}': 'Clip in section, track {0}', 'Doorlopen': 'Continue', 'Opnieuw': 'Restart', 'afgekapt': 'cut off',
  'Opnieuw: de clip begint aan het begin van de sectie. Doorlopen: de clip gaat verder waar hij in de vorige sectie was.': 'Restart: the clip starts at the beginning of the section. Continue: the clip carries on from where it was in the previous section.', 'Doorlopen kan alleen als dezelfde clip ook in de vorige sectie speelt.': 'Continue only works if the same clip also plays in the previous section.',
  '04 · SONG ARRANGEMENT': '04 · SONG ARRANGEMENT', '{0} maten · scènes spelen in deze volgorde · clips herhalen binnen iedere sectie': '{0} bars · scenes play in this order · clips repeat within each section',
  '{0} · {1} / {2}m': '{0} · {1} / {2}b', 'Speel vanaf sectie': 'Play from section', 'Sectie toevoegen': 'Add section', 'Scène dupliceren → volgende': 'Duplicate scene → next',
  'Een clip is hoogstens 64 maten.': 'A clip is at most 64 bars.', 'Halveren kan alleen bij een even aantal maten.': 'Halving only works with an even number of bars.', 'Let op: tijden die niet op 1/64 vallen worden afgerond.': 'Note: times that do not fall on 1/64 are rounded.',
  'Halveer de cliplengte: alle noten en punten komen twee keer zo dicht op elkaar': 'Halve the clip length: all notes and points move twice as close together', 'Verdubbel de cliplengte: alle noten en punten worden gelijkmatig over twee keer zoveel maten verdeeld': 'Double the clip length: all notes and points are spread evenly over twice as many bars',
  'MATEN': 'BARS', 'HERHALINGEN': 'REPEATS', 'Scènenamen bewerken': 'Edit scene names', 'SCÈNE {0}': 'SCENE {0}',
  'Sequencer: {0}': 'Sequencer: {0}', 'Invoer: {0}': 'Input: {0}', 'Clip Arranger sequencer': 'Clip Arranger sequencer',
  'Atmosfeer': 'Atmosphere', 'Bas': 'Bass', 'Variatie': 'Variation', 'Opbouw': 'Build-up', 'Hoofddeel': 'Main', 'Vrij': 'Free', 'Track {0}': 'Track {0}',
  'Geen geldige clip.': 'Not a valid clip.', 'Het apparaat is verwijderd.': 'The device has been removed.', 'De soort past niet: dit spoor neemt nu {0}.': 'Wrong kind: this track now takes {0}.', 'Geen enkel spoor van de clip past op een spoor van deze scène.': 'No track of the clip fits a track of this scene.', 'noten': 'notes', 'drums': 'drums',
  'MIDI / opname': 'MIDI / record', 'MIDI': 'MIDI', 'Sporen': 'Tracks', 'Sporen: alle sporen met hun namen in één kabel': 'Tracks: all tracks with their names in one cable', 'Poorten: {0}': 'Ports: {0}', 'Rock drums': 'Rock drums',
  'Knip clip': 'Cut clip', 'Kopieer sectie': 'Copy section', 'Knip sectie': 'Cut section', 'Plak sectie (na deze)': 'Paste section (after this one)', 'Dupliceer sectie': 'Duplicate section', 'Verwijder sectie': 'Delete section', 'Kopieer pagina': 'Copy page', 'Plak pagina': 'Paste page',
  'Een clip past alleen op een spoor van dezelfde soort (drums met drums, toetsen en drone onderling).': 'A clip only fits on a track of the same kind (drums with drums, keys and drone with each other).',
  'Een pagina past alleen op een spoor van dezelfde soort (drums met drums, toetsen en drone onderling).': 'A page only fits on a track of the same kind (drums with drums, keys and drone with each other).',
  'Kopieer eerst een pagina.': 'Copy a page first.', 'De gekozen pagina is te kort: de clip is niet lang genoeg voor deze pagina.': 'The chosen page is too short: the clip is not long enough for this page.',
  'Kopieert de noten, CC en instellingen van de gekozen pagina; plak ze op een andere pagina, ook in een andere clip of een ander spoor van dezelfde soort': 'Copies the notes, CC and settings of the chosen page; paste them on another page, also in another clip or on another track of the same kind', 'Plakt in de gekozen pagina en vervangt wat daar staat': 'Pastes into the chosen page and replaces what is there',
  'Rechtermuisknop: kopiëren, knippen, plakken, verwijderen. Sleep om te verplaatsen.': 'Right-click: copy, cut, paste, delete. Drag to move.',
  'Deel {0} van {1} van de uitgerekte clip {2}': 'Part {0} of {1} of the stretched clip {2}', 'deel {0}/{1}': 'part {0}/{1}', '{0} scènes': '{0} scenes', 'OVER SCÈNES': 'ACROSS SCENES',
  'Sleep omlaag om de clip over meer scènes uit te rekken: elke scène speelt een deel': 'Drag down to stretch the clip over more scenes: each scene plays a part',
  'Rek de clip uit over lege scènes eronder: elke scène speelt een deel van de clip': 'Stretch the clip over the empty scenes below it: each scene plays a part of the clip',
  'Scène {0}': 'Scene {0}', 'Song {0}': 'Song {0}', 'SONGNAAM': 'SONG NAME', 'Dupliceer song': 'Duplicate song', 'Verwijder song': 'Delete song', 'PROJECT': 'PROJECT', 'Nieuw project': 'New project',
  'Sectie achteraan met de gekozen scène. Sleep een scène hierheen om hem achteraan te zetten.': 'Add a section at the end with the chosen scene. Drag a scene here to put it at the end.',
  '+ Scène': '+ Scene', 'Verwijder lege scènes': 'Delete empty scenes', 'Verwijdert lege scènes die in geen enkele song voorkomen ({0})': 'Deletes empty scenes that are in no song ({0})', '{0} / {1} scènes': '{0} / {1} scenes',
  'Gebruikt in: {0}': 'Used in: {0}', 'Zit in geen enkele song. Sleep de scène naar de songbalk om hem toe te wijzen.': 'In no song yet. Drag the scene to the song bar to assign it.',
  'Naam van scène {0} wijzigen': 'Rename scene {0}', 'Lege scène invoegen na deze': 'Insert an empty scene after this one', 'Scène dupliceren (alle sporen) naar het volgende vak': 'Duplicate the scene (all tracks) into the next row',
  'Scène verwijderen; haar clips blijven in de clipbalk (02) staan': 'Delete the scene; its clips stay in the clip bar (02)',
};
// Nederlandse standaardnamen uit het oude bestand: een opgeslagen naam die hier gelijk aan is, wordt een lege naam en volgt dan de taal
const OLD_TRACKS = ['Drums', 'Bas', 'Keys', 'Atmosfeer'], OLD_SCENES = ['Intro', 'Groove', 'Variatie', 'Break', 'Opbouw', 'Hoofddeel', 'Outro', 'Vrij'];
const lim = (v, a, b, d = a) => typeof v === 'number' && Number.isFinite(v) ? Math.min(b, Math.max(a, v)) : d;
const integer = (v, a, b, d = a) => Math.round(lim(v, a, b, d));
const quant = (v, a, b, d = a) => Math.min(b, Math.max(a, Math.round(lim(v, a, b, d) * 4) / 4)); // kleinste eenheid: een 1/64 = 0,25 zestiende
const clone = x => JSON.parse(JSON.stringify(x));
const text = (x, d = '', n = 40) => typeof x === 'string' ? x.slice(0, n) : d;
const HEX = /^#[0-9a-fA-F]{6}$/, SECDEF = '#e8ae61';
const COLORS = ['#e8ae61', '#80c9af', '#89b6ea', '#bb9ee4', '#e591a0', '#a8cb6a', '#7cccd3', '#e6bd85'];
const names = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
const pitch = n => names[((n % 12) + 12) % 12] + (Math.floor(n / 12) - 1);
const MAXSCENES = 24, MAXSLOTS = 48, MAXSONGS = 16, GRIDS = [16, 32, 64], MAXNOTES = 4096, MAXAUTO = 32, MAXAUTOPTS = 1024;
const drumRows = () => [['Kick', 36], ['Snare', 38], ['Clap', 39], ['Closed hat', 42], ['Open hat', 46], ['Low tom', 45], ['Mid tom', 47], ['High tom', 50], ['Rim', 37], ['Crash', 49], ['Ride', 51], ['Shaker', 70], ['Tambourine', 54], ['Conga', 64], ['Bongo', 60], ['Percussion', 75]].map(([name, note], i) => ({ name, note, lane: 'ch' + (i + 1) }));
const hasContent = c => !!(c.notes.length || c.cc.length || c.auto.length);
const clipIsEmpty = c => !hasContent(c);
const blankClip = (i = 0) => ({ name: 'Clip ' + (i + 1), bars: 1, grid: 16, swing: 0, notes: [], cc: [], auto: [] });
function track(i, type = 'notes', n = 8) { return { name: '', target: '', type, color: COLORS[i % 8], mute: false, solo: false, transpose: 0, velocity: 1, gate: type === 'drone' ? 1 : .9, drumProtocol: 'trig', swing: 0, rowSwing: {}, rows: drumRows(), clips: Array.from({ length: n }, (_, j) => blankClip(j)), cells: Array.from({ length: n }, (_, j) => j), liveClip: 0 }; }
// een sectie: scene, bars, repeats; optioneel clips (per spoor: null = de clip van de scène, -1 = stil, 0…7 = die clip) en cont (per spoor: true = Doorlopen)
function cleanSection(a, n = 8) { const o = { scene: integer(a?.scene, 0, n - 1, 0), bars: integer(a?.bars, 1, 64, 4), repeats: integer(a?.repeats, 1, 16, 1) };
  const cl = Array.from({ length: 16 }, (_, k) => { const v = a?.clips?.[k]; return Number.isInteger(v) && v >= -1 && v < MAXSLOTS ? v : null; }); if (cl.some(v => v !== null)) o.clips = cl;
  const co = Array.from({ length: 16 }, (_, k) => a?.cont?.[k] === true); if (co.some(Boolean)) o.cont = co;
  // een sectie kan meer scènes hebben (sinds 1.36.0): ze spelen na elkaar, elke scène `bars` maten, en de reeks herhaalt `repeats` keer
  if (HEX.test(a?.color)) o.color = a.color.toLowerCase();
  const sc = Array.isArray(a?.scenes) ? a.scenes.filter(v => Number.isInteger(v) && v >= 0 && v < n).slice(0, 16) : []; if (sc.length > 1) { o.scenes = sc; o.scene = sc[0]; }
  return o; }
function defaults() { const arrangement = [{ scene: 0, bars: 4, repeats: 1 }, { scene: 1, bars: 8, repeats: 1 }, { scene: 3, bars: 4, repeats: 1 }, { scene: 5, bars: 8, repeats: 1 }, { scene: 6, bars: 4, repeats: 1 }]; return { title: '', tracks: [track(0, 'drums'), track(1), track(2), track(3, 'drone')], scenes: Array.from({ length: 8 }, () => ({ name: '' })), arrangement, songs: [{ name: '', arrangement: clone(arrangement) }], activeSong: 0, mode: 'session', songLoop: true, armed: true, selectedTrack: 0, selectedClip: 0, selectedSection: 0, editPage: 0, zoom: 16, pianoBase: 48, drawLength: 1, drawVelocity: .8, drawProbability: 1, drawRatchet: 1, selectedNote: -1, selectedRow: 0, record: false, recordMode: 'overdub', quantize: true, automation: 'sequencer', recordSettings: true, ccId: 'cutoff', ccShape: 'linear', pads: { track: { on: false, base: 36 }, scene: { on: false, base: 44 } } }; }
const PAD_NOTES = ['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'];
function note(id, step, n, len = 1, vel = .8, row = 0) { return { id, step, note: n, len, vel, prob: 1, ratchet: 1, row }; }
function cleanClip(x, i) {
  const c = blankClip(i); c.name = text(x?.name, c.name, 32); c.bars = integer(x?.bars, 1, 64, 1); c.grid = GRIDS.includes(x?.grid) ? x.grid : 16; c.swing = lim(x?.swing, 0, .5, 0); if (x?.span > 1) c.span = x.span; const max = c.bars * 16;
  if (Array.isArray(x?.notes)) c.notes = x.notes.slice(0, MAXNOTES).map((n, j) => ({ id: integer(n?.id, 0, 1e8, j), step: quant(n?.step, 0, max - .25, 0), note: integer(n?.note, 0, 127, 60), len: quant(n?.len, .25, 1024, 1), vel: lim(n?.vel, .01, 1, .8), prob: lim(n?.prob, 0, 1, 1), ratchet: integer(n?.ratchet, 1, 4, 1), row: integer(n?.row, 0, 63, 0) }));
  // Nootnummers blijven stabiel na het laden, ook bij handgemaakte of oudere bestanden met dubbele nummers.
  const ids = new Set(); let next = Math.max(0, ...c.notes.map(n => n.id)) + 1; for (const n of c.notes) { if (ids.has(n.id)) n.id = next++; ids.add(n.id); }
  if (Array.isArray(x?.cc)) c.cc = x.cc.slice(0, 8).filter(a => a && typeof a.id === 'string').map(a => ({ id: a.id.slice(0, 48), shape: a.shape === 'hold' ? 'hold' : 'linear', points: Array.isArray(a.points) ? a.points.slice(0, 1024).map(p => ({ step: integer(p?.step, 0, max - 1, 0), value: lim(p?.value, 0, 1, .5) })).sort((a, b) => a.step - b.step) : [] }));
  // instellingen (contract v1.21, §13f): per clip een lijn per parameter van het doel; punten { step, value } met value 0 … 1, een waarde blijft staan tot het volgende punt
  if (Array.isArray(x?.auto)) { const seen = new Set(); c.auto = x.auto.filter(a => a && typeof a.id === 'string' && /^[A-Za-z0-9._-]{1,60}$/.test(a.id) && !seen.has(a.id) && seen.add(a.id)).slice(0, MAXAUTO).map(a => { const by = new Map(); if (Array.isArray(a.points)) for (const p of a.points.slice(0, 4 * MAXAUTOPTS)) by.set(quant(p?.step, 0, max - .25, 0), lim(p?.value, 0, 1, .5)); return { id: a.id, points: [...by].sort((u, v) => u[0] - v[0]).slice(0, MAXAUTOPTS).map(([step, value]) => ({ step, value })) }; }); }
  return c;
}
// rowSwing: swing per drumrij, met het nootnummer van de rij als sleutel ("36": 0.1); alleen waarden boven 0 blijven bewaard
function cleanRowSwing(x) {
  const o = {}; if (!x || typeof x !== 'object' || Array.isArray(x)) return o;
  for (const k of Object.keys(x).slice(0, 256)) { const n = Number(k); if (!Number.isInteger(n) || n < 0 || n > 127) continue; const v = lim(x[k], 0, .5, 0); if (v > 0) o[String(n)] = v; }
  return o;
}
function sanitize(x) {
  const d = defaults(), s = { ...d }; const n = integer(Array.isArray(x?.scenes) && x.scenes.length ? x.scenes.length : Array.isArray(x?.tracks) && x.tracks.length ? Math.max(1, ...x.tracks.map(t => Array.isArray(t?.clips) ? t.clips.length : 0)) : 8, 1, MAXSCENES, 8); const oldTitle = typeof x?.title === 'string' && x.title === 'Nieuwe song'; s.title = oldTitle ? '' : text(x?.title, d.title, 64);
  s.tracks = Array.isArray(x?.tracks) && x.tracks.length ? x.tracks.slice(0, 16).map((t, i) => {
    const a = track(i, ['notes', 'drums', 'drone'].includes(t?.type) ? t.type : 'notes', n); a.name = text(t?.name, '', 24); if (i < 4 && a.name === OLD_TRACKS[i] && OLD_TRACKS[i] !== ['Drums', 'Bass', 'Keys', 'Atmosphere'][i]) a.name = '';
    a.target = text(t?.target, '', 40); a.color = HEX.test(t?.color) ? t.color.toLowerCase() : a.color; for (const k of ['mute', 'solo']) a[k] = typeof t?.[k] === 'boolean' ? t[k] : false;
    a.transpose = integer(t?.transpose, -48, 48, 0); a.velocity = lim(t?.velocity, 0, 1, 1); a.gate = lim(t?.gate, .05, 1.5, a.gate); a.drumProtocol = t?.drumProtocol === 'note' ? 'note' : 'trig'; a.swing = lim(t?.swing, 0, .5, 0); a.rowSwing = cleanRowSwing(t?.rowSwing); a.liveClip = integer(t?.liveClip, -1, n - 1, 0);
    a.rows = a.rows.map((r, j) => ({ name: text(t?.rows?.[j]?.name, r.name, 24), note: integer(t?.rows?.[j]?.note, 0, 127, r.note), lane: text(t?.rows?.[j]?.lane, r.lane, 32) }));
    a.clips = Array.from({ length: Math.max(n, Math.min(MAXSLOTS, Array.isArray(t?.clips) ? t.clips.length : 0)) }, (_, j) => cleanClip(t?.clips?.[j], j)); return a;
  }) : d.tracks;
  s.tracks.forEach(t => { while (t.clips.length < 1) t.clips.push(blankClip(t.clips.length)); t.clips.length = Math.min(t.clips.length, MAXSLOTS); });
  // de scènes wijzen naar clips in de bibliotheek van het spoor: cells[scène] = nummer van de clip of -1. Zonder cells (oudere bestanden, presets) speelt scène j clip j; een koppeling (ref, 1.31/1.32) wordt een verwijzing naar de clip
  const refMap = s.tracks.map(() => ({}));
  s.tracks.forEach((t, ti) => { const rt = Array.isArray(x?.tracks) ? x.tracks[ti] : null, L = t.clips.length, has = Array.isArray(rt?.cells);
    t.cells = Array.from({ length: n }, (_, j) => { let v = has ? rt.cells[j] : undefined;
      if (!Number.isInteger(v)) { const r = rt?.clips?.[j]?.ref; v = Number.isInteger(r) && r >= 0 && r < L && r !== j && hasContent(t.clips[r]) ? r : (j < L ? j : -1); if (v !== j && Number.isInteger(r)) refMap[ti][j] = v; }
      return Number.isInteger(v) && v >= -1 && v < L ? v : -1; }); });
  // een uitgerekte clip (span: over hoeveel scènes, vanaf de rij waar hij staat): de gedekte rijen moeten vrij zijn, anders stopt het uitrekken daar
  s.tracks.forEach(t => { const keep = new Set(); t.cells.forEach((v, j) => { const c = v >= 0 ? t.clips[v] : null; if (!c || !c.span) return; let sp = Math.min(integer(c.span, 1, MAXSCENES, 1), n - j); for (let k = 1; k < sp; k++) { const u = t.cells[j + k]; if (u >= 0 && !clipIsEmpty(t.clips[u])) { sp = k; break; } } if (sp > 1 && !clipIsEmpty(c) && !keep.has(v)) { c.span = sp; keep.add(v); } else if (!keep.has(v)) delete c.span; }); t.clips.forEach((c, j) => { if (c.span && !keep.has(j)) delete c.span; }); });
  s.tracks.forEach(t => { t.liveClip = Math.min(t.liveClip, n - 1); });
  s.scenes = Array.from({ length: n }, (_, i) => { let nm = text(x?.scenes?.[i]?.name, '', 24); if (nm === OLD_SCENES[i] && nm !== ['Intro', 'Groove', 'Variation', 'Break', 'Build-up', 'Main', 'Outro', 'Free'][i]) nm = ''; return HEX.test(x?.scenes?.[i]?.color) ? { name: nm, color: x.scenes[i].color.toLowerCase() } : { name: nm }; });
  // songs: elke song is een arrangement (lijst secties) op dezelfde scènes; `arrangement` is altijd de actieve song (oudere songs hebben alleen dat)
  const cleanArr = arr => Array.isArray(arr) && arr.length ? arr.slice(0, 64).map(a => cleanSection(a, n)) : null;
  let songs = Array.isArray(x?.songs) ? x.songs.slice(0, MAXSONGS).map(z => ({ name: text(z?.name, '', 24), arrangement: cleanArr(z?.arrangement) || [cleanSection({ scene: 0, bars: 4 }, n)] })) : [];
  if (!songs.length) songs = [{ name: '', arrangement: cleanArr(x?.arrangement) || d.arrangement.map(a => cleanSection(a, n)) }];
  const act = integer(x?.activeSong, 0, songs.length - 1, 0), top = cleanArr(x?.arrangement); if (top && Array.isArray(x?.songs) && x.songs.length) songs[act].arrangement = top;
  songs.forEach(sg => sg.arrangement.forEach(a => { if (a.clips) a.clips = a.clips.map((v, ti) => (v != null && v >= 0 && refMap[ti]?.[v] !== undefined) ? refMap[ti][v] : (v != null && v >= 0 && ti < s.tracks.length && v >= s.tracks[ti].clips.length ? null : v)); if (a.clips && a.clips.every(v => v === null)) delete a.clips; }));
  s.songs = songs; s.activeSong = act; s.arrangement = songs[act].arrangement;
  s.mode = x?.mode === 'song' ? 'song' : 'session'; s.recordMode = x?.recordMode === 'replace' ? 'replace' : 'overdub'; for (const k of ['songLoop', 'armed', 'record', 'quantize']) s[k] = typeof x?.[k] === 'boolean' ? x[k] : d[k];
  for (const [k, a, b] of [['selectedTrack', 0, s.tracks.length - 1], ['selectedClip', 0, n - 1], ['selectedSection', 0, s.arrangement.length - 1], ['editPage', 0, 63], ['pianoBase', 0, 104], ['drawRatchet', 1, 4], ['selectedNote', -1, 1e8], ['selectedRow', 0, 63]]) s[k] = integer(x?.[k], a, b, d[k]);
  s.drawLength = quant(x?.drawLength, .25, 1024, 1); s.zoom = [16, 32, 64].includes(x?.zoom) ? x.zoom : 16; s.drawVelocity = lim(x?.drawVelocity, .01, 1, .8); s.drawProbability = lim(x?.drawProbability, 0, 1, 1);
  s.pads = { track: { on: x?.pads?.track?.on === true, base: integer(x?.pads?.track?.base, 0, 127, 36) }, scene: { on: x?.pads?.scene?.on === true, base: integer(x?.pads?.scene?.base, 0, 127, 44) } };
  s.automation = x?.automation === 'modulators' ? 'modulators' : 'sequencer'; s.recordSettings = typeof x?.recordSettings === 'boolean' ? x.recordSettings : true;
  s.ccId = text(x?.ccId, 'cutoff', 48); s.ccShape = x?.ccShape === 'hold' ? 'hold' : 'linear'; return s;
}
// contract v1.6: werkstand, geen compositie — een preset laat dit staan
const PRESET_SKIP = ['pads', 'selectedTrack', 'selectedClip', 'selectedSection', 'editPage', 'zoom', 'pianoBase', 'drawLength', 'drawVelocity', 'drawProbability', 'drawRatchet', 'selectedNote', 'selectedRow', 'record', 'recordMode', 'quantize', 'recordSettings', 'ccId', 'ccShape'];
const PORTS = { audioIn: [], audioOut: [], eventIn: [{ id: 'input', name: 'MIDI / record' }], eventOut: Array.from({ length: 16 }, (_, i) => ({ id: 'track' + (i + 1), name: 'Track ' + (i + 1) })), multiEventOut: [{ id: 'tracks', name: 'Tracks' }] };
const CSS = `
:host{display:block}.rg{--bg:var(--card);--panel:var(--card-2,var(--card));--gold:var(--event,#e8ae61);--gold-ink:color-mix(in srgb,var(--event,#e8ae61) 62%,var(--fg));--btn:color-mix(in srgb,var(--card-2,var(--card)) 86%,var(--fg));--screen:var(--well,var(--card));--screen-2:color-mix(in srgb,var(--well,var(--card)) 88%,var(--fg));background:var(--bg);color:var(--fg);font:12px var(--mono,monospace);padding:20px;border-radius:9px;container-type:inline-size}.rg *{box-sizing:border-box}.rg h2{font:600 14px var(--mono,monospace);margin:0 0 12px}.rg p{line-height:1.7}.rg .kicker{font-size:10px;letter-spacing:2px;color:var(--gold-ink)}.rg button,.rg select,.rg input{font:inherit;color:inherit}.rg button,.rg select,.rg input:not([type=checkbox]):not([type=range]){background:var(--btn);border:1px solid var(--line);border-radius:4px;padding:7px;min-height:32px}.rg button{cursor:pointer}.rg button:hover{border-color:var(--gold)}.rg button:disabled{opacity:.35;cursor:default}.rg .active{background:var(--gold);color:var(--card);border-color:var(--gold)}.rg button:focus-visible,.rg input:focus-visible,.rg select:focus-visible{outline:2px solid var(--sel,var(--fg));outline-offset:2px}.rg .row{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.rg .spread{justify-content:space-between}.rg .toolbar{display:flex;align-items:end;gap:10px;flex-wrap:wrap;margin:14px 0}.rg .section{border:1px solid var(--line);border-radius:6px;padding:14px;background:var(--panel);margin-top:14px}.rg .small{font-size:10px;color:var(--muted);line-height:1.7}.rg .accent{color:var(--gold-ink)}.rg .status{font-size:11px;color:color-mix(in srgb,var(--go,var(--fg)) 70%,var(--fg))}.rg label{display:flex;flex-direction:column;gap:5px;color:var(--muted);font-size:10px;letter-spacing:.4px}.rg label.check{flex-direction:row;align-items:center}.rg input[type=range]{accent-color:var(--gold);min-width:110px;max-width:180px}.rg output{font-size:12px;color:var(--fg)}.rg input[type=number]{width:86px}.rg input[type=text]{width:170px;max-width:100%}.rg .scroll{overflow:auto}.rg .session{display:grid;gap:5px}.rg .th{padding:8px;background:var(--btn);border-top:3px solid var(--track);border-radius:5px}.rg .th .name{font-weight:bold;width:100%;text-align:left;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}.rg .slot{display:flex;align-items:stretch;border:1px solid var(--line);border-radius:4px;background:var(--btn);min-height:45px;min-width:0}.rg .slot.selected{outline:2px solid var(--track);outline-offset:-1px}.rg .slot.running{background:color-mix(in srgb,var(--track) 22%,var(--panel))}.rg .slot.queued{border-style:dashed;border-color:var(--track)}.rg .slot .launch{padding:5px;color:var(--track);background:transparent;border:0;min-width:28px}.rg .slot .body{flex:1;text-align:left;border:0;background:transparent;padding:6px;min-width:0;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;font-size:11px}.rg .scene{display:flex;align-items:center;gap:5px}.rg .scene button{padding:5px}.rg .scene span{overflow:hidden;white-space:nowrap;font-size:11px}.rg .scene.running{color:var(--gold-ink)}.rg .scene.queued{outline:1px dashed var(--gold)}.rg .mini{font-size:10px;padding:4px;min-height:25px}.slot{position:relative}.slot .ph{position:absolute;top:0;bottom:0;width:2px;margin-left:-1px;background:var(--track);box-shadow:0 0 4px var(--track);pointer-events:none;display:none;z-index:2}.slot .ticks{position:absolute;inset:0;pointer-events:none;opacity:.35;background-image:linear-gradient(to right,var(--track) 1px,transparent 1px);background-size:calc(100% / var(--bars)) 100%}.slot.dropok{outline:2px dashed var(--track);outline-offset:-2px}.slot.dragging{opacity:.45}.th .row .rn{font-size:10px}.th .rename{width:100%;font-weight:bold}.matrixbar{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin:2px 0 8px}.matrixbar .mstatus{font-size:11px;color:var(--gold-ink);min-width:230px}.clipstrip{display:flex;flex-wrap:wrap;gap:4px;align-items:center;margin:4px 0 10px}.clipstrip .sep{width:1px;align-self:stretch;background:var(--line);margin:0 6px}.clipstrip .lbl{font-size:10px;opacity:.7;margin-right:2px}.ctab{min-width:34px;padding:5px 9px;font-size:11px;border-top:3px solid var(--track,var(--gold));display:inline-flex;gap:6px;align-items:baseline}.ctab .badge{font-size:9px;opacity:.7}.ctab.on{outline:2px solid var(--track,var(--gold));outline-offset:-1px}.ctab.empty{opacity:.55}.ctab.running{background:color-mix(in srgb,var(--track,var(--gold)) 24%,var(--panel))}.scene.insong,.slot.insong{box-shadow:inset 0 0 0 1px var(--gold)}.rg .badge{font-size:9px;color:var(--muted);display:block;margin-top:5px}.rg .layout{display:grid;grid-template-columns:1fr;gap:12px}.rg .gridwrap{overflow:auto;max-height:620px;border:1px solid var(--line);border-radius:4px;position:relative;background:var(--screen)}.rg .pianobody{display:flex;align-items:stretch;min-width:650px}.rg .keys{width:112px;flex:none;position:sticky;left:0;z-index:3;box-shadow:3px 0 8px #0005}.rg .key{height:24px;border-bottom:1px solid #445159;background:#34424a;display:flex;align-items:center;justify-content:space-between;font-size:10px;padding:0 7px;cursor:pointer;color:#e6e7e0}.rg .key.black{background:#1d282e;color:#c0cbd0}.rg .key.selected{color:#e8ae61}.rg .gridarea{flex:1;min-width:0;position:relative}.rg .ruler{height:25px;position:relative;background:var(--btn);border-bottom:1px solid var(--line)}.rg .ruler span{position:absolute;font-size:9px;padding-left:4px;top:5px;color:var(--muted)}.rg .noteground{position:relative;touch-action:none;background-image:linear-gradient(to bottom,transparent 23px,color-mix(in srgb,var(--fg) 14%,var(--screen)) 23px),linear-gradient(to right,color-mix(in srgb,var(--fg) 26%,var(--screen)) 1px,transparent 1px),linear-gradient(to right,color-mix(in srgb,var(--fg) 9%,var(--screen)) 1px,transparent 1px);background-size:100% 24px,calc(100% / var(--cols) * var(--beat)) 100%,calc(100% / var(--cols)) 100%;cursor:crosshair;overflow:hidden}.rg .noteblock{position:absolute;padding:0;min-height:0;height:20px;border:1px solid color-mix(in srgb,var(--fg) 30%,transparent);background:var(--track);border-radius:3px;color:#111a20;font-size:9px;text-align:left;overflow:hidden;touch-action:none;user-select:none;cursor:grab;white-space:nowrap}.rg .noteblock.chosen{outline:2px solid var(--fg);outline-offset:0}.rg .resize{position:absolute;right:0;top:0;bottom:0;width:12px;cursor:ew-resize;background:linear-gradient(to right,transparent 0,transparent 4px,#0007 4px,#0007 5px,transparent 5px,transparent 7px,#0007 7px,#0007 8px,transparent 8px)}.rg .playline{position:absolute;top:0;bottom:0;width:2px;background:var(--fg);pointer-events:none;z-index:2;display:none}.rg .velstrip{position:relative;height:84px;margin-top:6px;margin-left:112px;border:1px solid var(--line);border-radius:4px;background:var(--screen);overflow:hidden;touch-action:none}.rg .velbar{position:absolute;bottom:0;min-width:4px;padding:0;min-height:0;border:0;border-radius:2px 2px 0 0;background:var(--track);opacity:.8;cursor:ns-resize;touch-action:none}.rg .velbar.chosen{opacity:1;outline:2px solid var(--fg);z-index:2}.rg .vellabel{font-size:9px;color:var(--muted);margin:6px 0 0 112px}.rg .noteinspector{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:10px;margin-top:12px}.rg .songtimeline{position:relative;padding-top:6px;display:flex;gap:3px;min-width:700px}.rg .songblock{min-width:65px;background:var(--btn);border-top:3px solid var(--gold);padding:9px;font-size:11px;cursor:pointer;overflow:hidden;white-space:nowrap}.rg .songblock{position:relative}.rg .songblock.chosen{outline:1px solid var(--gold);outline-offset:1px}.rg .songblock .ph{position:absolute;top:0;bottom:0;width:2px;background:var(--fg);display:none;pointer-events:none}.rg .songbar{margin-bottom:10px}.rg .secset{align-items:end}.rg .secrow{display:flex;flex-direction:column;gap:3px;padding:4px 4px 6px;border-bottom:1px solid var(--gold);background:color-mix(in srgb,var(--gold) 8%,transparent)}.rg .secrow label{font-size:10px}.rg .secrow select{width:100%}.rg .secrow .cont.active{background:var(--gold);color:var(--bg)}.rg .secname{justify-content:center;color:var(--gold-ink);font-weight:bold}.rg .songblock.running{background:color-mix(in srgb,var(--gold) 55%,var(--card));color:var(--fg)}.rg .arrrow{display:grid;grid-template-columns:30px minmax(120px,1fr) 86px 86px auto;gap:8px;align-items:end;margin:8px 0;min-width:600px}.rg .arrrow.chosen{outline:1px solid var(--gold);outline-offset:4px}.rg .cclane{height:90px;background:var(--screen);border:1px solid var(--line);border-radius:4px;margin:8px 0;position:relative;cursor:crosshair;touch-action:none}.rg .ccpoint{position:absolute;width:9px;height:9px;border-radius:50%;background:var(--gold);transform:translate(-50%,50%);padding:0;min-height:0;border:1px solid var(--fg)}.rg .ccbar{position:absolute;bottom:0;pointer-events:none;background:color-mix(in srgb,var(--go,var(--audio)) 25%,transparent)}.rg .ports{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px}.rg .port{background:var(--screen-2);border:1px solid var(--line);border-left:3px solid var(--track);padding:8px;border-radius:4px;min-width:0}.rg .port small{display:block;color:var(--muted);font-size:10px;margin-top:5px;overflow-wrap:anywhere}.rg details{margin:12px 0}.rg summary{cursor:pointer;color:var(--gold-ink);padding:5px 0}.rg .error{color:var(--stop,var(--fg))}.rg .ccrow{display:flex;justify-content:space-between;gap:8px;align-items:center;padding:5px 0;border-bottom:1px solid var(--line)}@container(max-width:700px){.rg{padding:12px}.rg .noteinspector{grid-template-columns:repeat(2,minmax(100px,1fr))}.rg .toolbar{gap:7px}}
.rg .autolist{max-height:420px;overflow:auto;border:1px solid var(--line);border-radius:6px;padding:4px 8px;background:var(--screen)}.rg .autogroup{margin:8px 0 2px;color:var(--gold-ink);font-weight:600;letter-spacing:1px;font-size:11px}.rg .autorow{display:grid;grid-template-columns:minmax(80px,170px) 1fr 54px 24px;gap:8px;align-items:center;padding:2px 0}.rg .autorow .autoname{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.rg .autorow svg{width:100%;height:20px;background:var(--screen-2);border-radius:3px}.rg .autorow path{fill:none;stroke:var(--muted);stroke-width:1.2;stroke-dasharray:3 3}.rg .autorow.has path{stroke:var(--track,var(--gold));stroke-dasharray:none;stroke-width:1.6}.rg .autoval{text-align:right;color:var(--muted)}
.rg .session{position:relative}.rg .matrixwrap{max-height:480px;overflow:auto}.rg .session .th{position:sticky;top:0;z-index:3;background:var(--btn)}.rg .session>.scene{position:sticky;left:0;z-index:2;background:var(--panel)}
.rg .scene{border-radius:4px;padding-right:2px}.rg .scene .scname{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;cursor:text}.rg .scene .rename{flex:1;min-width:0;padding:3px}.rg .scene.unused .scname{opacity:.55;font-style:italic}.rg .scene.insel{position:relative}.rg .session{margin-left:12px}.rg{padding-top:2px}.rg>.toolbar:first-of-type{margin-top:6px}.rg .scene.insel::before{content:'';position:absolute;left:-10px;top:-3px;bottom:-3px;width:4px;border-radius:2px;background:var(--sec,var(--gold));pointer-events:none}.rg .slot.insel-r::after{content:'';position:absolute;right:0;top:-3px;bottom:-3px;width:4px;border-radius:2px;background:var(--sec,var(--gold));pointer-events:none;z-index:1}.rg .scene .scdot{flex:0 0 auto;width:9px;height:9px;border-radius:50%;margin-left:3px}.rg input[type=color]{width:46px;height:28px;padding:0;border:1px solid var(--line);border-radius:4px;background:none;cursor:pointer}.rg .songblock{border-top-color:var(--sec,var(--gold))}.rg .songblock.chosen{outline-color:var(--sec,var(--gold))}
.rg .scops{display:flex;gap:1px;opacity:.4}.rg .scene:hover .scops,.rg .scene:focus-within .scops{opacity:1}.rg .scops .mini{padding:2px 5px;min-height:22px}
.rg .scene.dragging{opacity:.5;outline:2px dotted var(--fg)}.rg .scene.dropok{outline:3px solid var(--sel,var(--fg));outline-offset:-3px;background:color-mix(in srgb,var(--sel,var(--fg)) 22%,var(--panel))}
.rg .slot.droptarget{outline:2px dashed var(--sel,var(--fg));outline-offset:-2px;background:color-mix(in srgb,var(--sel,var(--fg)) 9%,var(--btn))}
.rg .slot.dropok{outline:3px solid var(--sel,var(--fg));outline-offset:-3px;background:color-mix(in srgb,var(--sel,var(--fg)) 28%,var(--btn))}
.rg .slot.dragging{opacity:.5;outline:2px dotted var(--fg);outline-offset:-2px}
.rg .songrow{margin:0 0 8px;align-items:end}.rg .songblock.dropok,.rg .songblock.addblock.dropok{outline:3px solid var(--sel,var(--fg));outline-offset:1px;background:color-mix(in srgb,var(--sel,var(--fg)) 25%,var(--btn))}.rg .songblock.addblock{flex:0 0 auto;min-width:44px;text-align:center;border-top-style:dashed}
.rg .trackpanel{position:absolute;z-index:40;flex-direction:column;align-items:stretch;flex-wrap:nowrap;width:300px;max-height:70vh;overflow:auto;margin:0;padding:10px;background:var(--panel);border:1px solid var(--line);border-top:3px solid var(--track,var(--line));border-radius:8px;box-shadow:0 8px 26px var(--shadow,rgba(0,0,0,.45))}.rg .th .tgt{display:block;width:100%;text-align:left;background:none;border:0;padding:0;cursor:text}.rg .th .tytype{min-width:0;flex:1 1 70px;max-width:100%;font-size:11px;padding:2px 4px}.rg .scenechips{display:flex;flex-wrap:wrap;gap:4px;align-items:center}.rg .schip{display:inline-flex;align-items:center;gap:2px;padding:2px 4px;border:1px solid var(--line);border-radius:6px;background:var(--btn)}.rg .schip .mini{padding:0 4px;min-width:0}.rg .slot{position:relative}.rg .slot.nocell .body{opacity:.6}.rg .slot .cellsel{position:absolute;right:2px;top:2px;width:24px;height:22px;opacity:0;cursor:pointer;z-index:3}.rg .slot .cellpick{position:absolute;right:6px;top:3px;font-size:11px;pointer-events:none;opacity:.75;z-index:2}.rg .slot.nocell .cellsel{left:34px;right:0;top:0;bottom:0;width:auto;height:auto}.rg .slot .grip{position:absolute;left:25%;right:25%;bottom:-4px;height:8px;border-radius:4px;background:var(--track);opacity:0;cursor:ns-resize;z-index:2}.rg .slot:hover .grip,.rg .slot.stretched .grip{opacity:.8}
.rg .slot.covered{border-style:dashed;background:color-mix(in srgb,var(--track) 14%,var(--panel));border-left:4px solid var(--track)}.rg .slot.covered .body{color:var(--muted);font-style:italic}.rg .slot.stretched{border-bottom-style:dashed}
.rg .slot.previewcov{outline:2px dashed var(--sel,var(--fg));outline-offset:-2px;background:color-mix(in srgb,var(--track) 38%,var(--panel))}
.rg{position:relative}.rg .ctxmenu{position:absolute;z-index:50;min-width:210px;background:var(--panel);border:1px solid var(--line);border-radius:6px;padding:4px;box-shadow:0 6px 22px var(--shadow,rgba(0,0,0,.4));display:flex;flex-direction:column}
.rg .ctxitem{display:flex;justify-content:space-between;gap:18px;text-align:left;border:0;background:transparent;padding:7px 10px;min-height:0;border-radius:4px}.rg .ctxitem:hover:not(:disabled),.rg .ctxitem:focus-visible{background:color-mix(in srgb,var(--sel,var(--gold)) 22%,var(--panel))}.rg .ctxhint{color:var(--muted);font-size:10px}.rg .ctxsep{height:1px;background:var(--line);margin:3px 2px}
.rg .songblock .chips{display:flex;gap:2px;margin-top:4px;justify-content:center;flex-wrap:wrap}.rg .songblock .chip{font-style:normal;font-size:9px;line-height:1;min-width:13px;padding:2px 3px;border-radius:3px;text-align:center;background:color-mix(in srgb,var(--track) 40%,var(--btn));color:var(--fg)}.rg .songblock .chip.own{outline:1px solid var(--gold)}.rg .songblock .chip.cont{border-bottom:2px solid var(--gold)}
.rg .songblock.dragging{opacity:.5}.rg .songblock.dropbefore{box-shadow:inset 4px 0 var(--sel,var(--fg))}.rg .songblock.dropafter{box-shadow:inset -4px 0 var(--sel,var(--fg))}
`;
const frameLoop = (host, inst, cb, fps) => {
  if (host && typeof host.frame === 'function') return host.frame(inst, cb, fps);
  let raf = 0, last = 0, stop = false;
  const f = t => { if (stop) return; raf = requestAnimationFrame(f); if (document.hidden || t - last < 1000 / fps - 2) return; last = t; cb(t); };
  raf = requestAnimationFrame(f); return () => { stop = true; cancelAnimationFrame(raf); };
};
export default {
  id: 'nl.patchkamer.cliparranger', name: 'Clip Arranger', version: '1.38.0', about: { nl: 'Clip-, scène- en songsequencer met tot 16 sporen: clips per spoor, scènes die clips samen starten en een song die scènes achter elkaar speelt.\n\nVerbind TRACK 1…16 via een eventkabel met de noten-, trigger- of CC-ingang van een apparaat. Het doelveld is je eigen label; de kabel bepaalt de echte bestemming. Audio blijft via de audio-uitgang van dat apparaat naar de mixer lopen.\n\nSlagwerk: Tracktype Drums, protocol Trig; verbind met MIDI / TRIG. De drumrijen verwijzen naar ch1…ch16: pas namen of notennummers aan jouw kit aan. Drone/pad: Tracktype Drone / pad; verbind met Noten / CC.\n\nClipmatrix: klik op een clip om te bewerken; ▶ start bij de volgende lokale maatgrens. Een scène start alle bijbehorende clips tegelijk. Track ■ stopt alleen toekomstige events van die track. Vanaf begin zet de sequencer terug; starten en stoppen van de host bestuurt het transport.\n\nPiano roll: klik om noten te plaatsen, sleep een noot om te verplaatsen en sleep de rechterrand voor de lengte. De breedte van een blokje is de lengte, de hoogte is de velocity; onder de roll kun je de velocity slepen. Rechtsklik verwijdert. Lengtes zijn zestienden (16 = één maat). Het raster (1/16, 1/32, 1/64) hoort bij de clip.\n\nNoten eindigen uiterlijk bij hun clip- of songsectiegrens (vermenigvuldigd met Gate). CC wordt per zestiende gestuurd. Een instrument moet deze events en parameter-id\'s ondersteunen. Reeds verstuurde noten en galmstaarten volgen het ontvangende instrument. Lange noten begrenst het apparaat op 60 seconden.\n\nSpeel deze clip: alleen de gekozen clip van het gekozen spoor loopt, op zijn eigen lengte, los van scènes en song; hij start op de volgende maat (of meteen als de klok stilstaat). Andere sporen zijn stil tot je Stop klikt of weer Clips / scènes of Song kiest. Met Opname aan loopt de opname rond: Aanvullen laat bestaande noten staan (een nieuwe noot op dezelfde plek en rij vervangt de oude), Overschrijven wist de clip bij de eerste ingespeelde noot en vult daarna aan. Swing per clip, spoor en drumrij vertraagt de oneven zestienden bovenop de swing van de host; opname kwantiseert naar het geswingde raster.\n\nLive spelen: noten op de ingang (MIDI / opname) gaan direct naar de uitgang van het geselecteerde spoor, dus je hoeft het toetsenbord niet ook nog naar die synth te kabelen (doe je dat wel, dan klinkt het dubbel). Opname neemt de noten met hun velocity en lengte op in de geselecteerde clip, op het dichtstbijzijnde rasterpunt (of op 1/64 als kwantiseren uit staat).\n\nVervangt de compositie; Undo herstelt je vorige versie.\n\nSleep een clip naar een ander slot om te verplaatsen; houd Ctrl ingedrukt om te kopiëren. Verplaatsen kan binnen een spoor en tussen sporen van dezelfde soort. Sleep een scène naar een ander scènevak om te ordenen, of naar de songbalk om hem toe te wijzen.\n\n▶ lanceert op de volgende maat · clipnaam opent de editor · M/S werkt op events · lege clips sturen geen noten\n\nDit spoor hangt aan een apparaat met klanknamen: de rijen, hun namen, noten en kanalen komen van dat apparaat.\n\nTrig gebruikt de lane-naam; MIDI gebruikt het notennummer. Volgorde en namen mogen afwijken van de aangesloten kit.\n\nZet Opname aan, start de klok en draai aan het apparaat. Een lijn blijft op zijn waarde staan tot de volgende wijziging; de noten blijven ongemoeid.\n\nKlik om punten te tekenen · rechtsklik op een punt om te verwijderen · waarden 0–100%, verstuurd op elke zestiende\n\nAlle songs gebruiken dezelfde scènes en clips; een song is alleen de volgorde.\n\nRechtermuisknop op een clip of een sectie: kopiëren, knippen, plakken en verwijderen (ook Ctrl+C, Ctrl+X, Ctrl+V en Delete). Een clip past alleen op een spoor van dezelfde soort. Sleep een sectie in de songbalk om hem te verplaatsen; de clips per spoor staan als vakjes in elke sectie en volgen de rij Sectie in de matrix. In de clip-editor kopieer je een pagina en plak je die op een andere pagina, ook in een andere clip of op een ander spoor van dezelfde soort.', en: 'Clip, scene and song sequencer with up to 16 tracks: clips per track, scenes that start clips together and a song that plays scenes in order.\n\nConnect TRACK 1…16 with an event cable to the note, trigger or CC input of a device. The target field is your own label; the cable decides the real destination. Audio keeps flowing from that device\'s audio output to the mixer.\n\nDrums: track type Drums, protocol Trig; connect to MIDI / TRIG. The drum rows refer to ch1…ch16: adapt names or note numbers to your kit. Drone/pad: track type Drone / pad; connect to Notes / CC.\n\nClip matrix: click a clip to edit it; ▶ starts at the next local bar line. A scene starts all its clips together. Track ■ only stops future events of that track. From start rewinds the sequencer; starting and stopping the host controls the transport.\n\nPiano roll: click to place notes, drag a note to move it and drag the right edge for its length. The width of a block is the length, the height is the velocity; below the roll you can drag the velocity. Right-click deletes. Lengths are sixteenths (16 = one bar). The grid (1/16, 1/32, 1/64) belongs to the clip.\n\nNotes end at the latest at their clip or song-section boundary (multiplied by Gate). CC is sent per sixteenth. A device must support these events and parameter ids. Notes already sent and reverb tails follow the receiving device. Long notes are limited to 60 seconds.\n\nPlay this clip: only the selected clip of the selected track loops, at its own length, apart from scenes and song; it starts at the next bar (or at once if the clock is stopped). Other tracks stay silent until you click Stop or choose Clips / scenes or Song again. With Record on the recording loops: Overdub keeps existing notes (a new note at the same position and row replaces the old one), Replace clears the clip at the first note you play and then adds to it. Swing per clip, track and drum row delays the odd sixteenths on top of the host swing; recording quantizes to the swung grid.\n\nLive play: notes on the input (MIDI / record) go straight to the output of the selected track, so you do not need to cable the keyboard to that synth as well (if you do, it sounds double). Recording stores the notes with their velocity and length in the selected clip, at the nearest grid point (or at 1/64 when quantize is off).\n\nReplaces the composition; Undo restores your previous version.\n\nDrag a clip to another slot to move it; hold Ctrl to copy. Moving works within a track and between tracks of the same kind. Drag a scene onto another scene to reorder, or onto the song bar to assign it.\n\n▶ launches on the next bar · clip name opens the editor · M/S act on events · empty clips send no notes\n\nThis track is cabled to a device with sound names: the rows, their names, notes and channels come from that device.\n\nTrig uses the lane name; MIDI uses the note number. Order and names may differ from the connected kit.\n\nSwitch Record on, start the clock and turn the device. A line stays at its value until the next change; the notes are left alone.\n\nClick to draw points · right-click a point to delete it · values 0–100%, sent on every sixteenth\n\nAll songs use the same scenes and clips; a song is only the order.\n\nRight-click a clip or a section: copy, cut, paste and delete (also Ctrl+C, Ctrl+X, Ctrl+V and Delete). A clip only fits on a track of the same kind. Drag a section in the song bar to move it; the clips per track show as small cells in every section and follow the Section row in the matrix. In the clip editor you copy a page and paste it on another page, also in another clip or on another track of the same kind.' }, kind: 'utility', category: 'sequencer', ui: { width: 1340, minWidth: 560, jacks: true }, ports: PORTS,
  i18n: { nl: { ports: Object.assign({ input: 'MIDI / opname', tracks: 'Sporen' }, ...Array.from({ length: 16 }, (_, i) => ({ ['track' + (i + 1)]: 'Track ' + (i + 1) }))) } },
  create(ctx, host) {
    const tx = (k, ...a) => { let t = host.lang === 'nl' ? k : (EN[k] ?? k); a.forEach((v, i) => { t = t.split('{' + i + '}').join(v); }); return t; };
    const trackDefault = i => i < 4 ? tx(['Drums', 'Bas', 'Keys', 'Atmosfeer'][i]) : tx('Track {0}', i + 1);
    const sceneDefault = i => i < OLD_SCENES.length ? tx(OLD_SCENES[i]) : tx('Scène {0}', i + 1);
    const songName = i => state.songs[i]?.name || tx('Song {0}', i + 1);
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
      s.songs[0].arrangement = s.arrangement; return s;
    }
    let state = template('techno'), self, root = null, stopFrame = null, dead = false, playing = false, clipboard = null, error = '', history = [], future = [], scope = 'matrix', redoStacks = { song: [], matrix: [], clip: [] }, selRow = 0, panelTrack = null, panelScene = null;
    const snapScope = new WeakMap(), VIEWKEYS = new Set(['selectedTrack', 'selectedClip', 'selectedSection', 'selectedNote', 'selectedRow', 'editPage', 'zoom', 'pianoBase', 'drawLength', 'drawVelocity', 'drawProbability', 'drawRatchet', 'record', 'recordMode', 'quantize', 'recordSettings', 'ccId', 'ccShape']);
    // Runtime playback is intentionally separate from the saved composition.
    let origin = null, lastAbs = null, elapsed = 0, seek = 0, active = [], trackOrigins = [], queueScene = null, queueClips = new Map(), pending = [], visual = null, viewRefs = {}, restart = true;
    let lastBpm = 120, lastDur = .125, lastInfo = null, songEnded = false, renderWanted = false;
    let soloRun = null; // 'Speel deze clip': { ti, ci, origin, now }; losse werkstand, niet in de state
    let recRun = null;  // opnamerun: de clip waarin Overschrijven al heeft gewist
    // instellingen opnemen en afspelen (contract v1.21): losse werkstand, niet in de state
    let autoRun = null, autoTargets = [], autoWatched = new Set(), autoLocked = new Set(), autoLockSig = '', autoDirty = false, autoRenderAt = 0; const autoTimers = new Set();
    const live = new Map(); // live gespeelde noten (ingangsnoot -> {ti, out, until, held, rec})
    const currentTrack = () => state.tracks[state.selectedTrack], currentClip = () => currentTrack().clips[Math.min(state.selectedClip, currentTrack().clips.length - 1)];
    function reset() { autoClear(); origin = null; lastAbs = null; elapsed = 0; seek = 0; active = state.tracks.map(t => t.liveClip); trackOrigins = state.tracks.map(() => 0); queueScene = null; queueClips.clear(); pending = []; visual = null; restart = true; songEnded = false; if (soloRun) { soloRun.origin = null; soloRun.now = true; } }
    reset();
    // cells die gewoon scène j = clip j zijn, blijven weg uit getState en presets: zo blijven die gelijk aan voor 1.33.0
    function exported() { syncSongs(); const p = clone(state); p.tracks.forEach(t => { if (t.cells.every((v, j) => v === (j < t.clips.length ? j : -1))) delete t.cells; }); return p; }
    function remember() { const snap = clone(state); snapScope.set(snap, scope); history.push(snap); if (history.length > 60) history.shift(); future = []; redoStacks = { song: [], matrix: [], clip: [] }; }
    function change(fn, redraw = true) { remember(); fn(); state.tracks.forEach(t => { if (state.selectedClip >= t.clips.length) state.selectedClip = t.clips.length - 1; }); if (redraw) render(); }
    function undo() { if (!history.length) return; future.push(clone(state)); releaseLive(); state = history.pop(); redoStacks = { song: [], matrix: [], clip: [] }; recRun = null; autoRun = null; reset(); render(); }
    function redo() { if (!future.length) return; history.push(clone(state)); releaseLive(); state = future.pop(); redoStacks = { song: [], matrix: [], clip: [] }; recRun = null; autoRun = null; reset(); render(); }
    // ongedaan maken per niveau (song, clipmatrix, clip-editor): alleen de laatste wijziging die in dat deel is gemaakt gaat terug; wijzigingen die daarna in andere delen zijn gedaan blijven staan
    function diffState(a, b, path, out) {
      if (a === b) return; const oa = a !== null && typeof a === 'object', ob = b !== null && typeof b === 'object';
      if (oa && ob && Array.isArray(a) === Array.isArray(b)) {
        if (Array.isArray(a)) { if (a.length === b.length) { for (let i = 0; i < a.length; i++) diffState(a[i], b[i], path.concat(i), out); return; } }
        else { for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) { if (!path.length && VIEWKEYS.has(k)) continue; diffState(a[k], b[k], path.concat(k), out); } return; } }
      if (!oa && !ob && Object.is(a, b)) return;
      out.push({ p: path, a: a === undefined ? undefined : clone(a), b: b === undefined ? undefined : clone(b) });
    }
    function applyPatch(target, patch, side) {
      for (const e of patch) { let o = target; for (let i = 0; i < e.p.length - 1 && o != null; i++) o = o[e.p[i]]; const k = e.p[e.p.length - 1]; if (o == null || typeof o !== 'object') continue; const v = side === 'a' ? e.a : e.b; if (v === undefined) delete o[k]; else o[k] = clone(v); }
    }
    function settle() { state = sanitize(clone(state));  recRun = null; autoRun = null; reset(); render(); }
    function scopedUndo(sc) {
      let j = history.length - 1; while (j >= 0 && snapScope.get(history[j]) !== sc) j--; if (j < 0) return;
      const patch = []; diffState(history[j], j + 1 < history.length ? history[j + 1] : state, [], patch); releaseLive();
      applyPatch(state, patch, 'a'); for (let k = j + 1; k < history.length; k++) applyPatch(history[k], patch, 'a');
      history.splice(j, 1); if (patch.length) redoStacks[sc].push(patch); settle();
    }
    function scopedRedo(sc) {
      const patch = redoStacks[sc].pop(); if (!patch) return; const keep = redoStacks; scope = sc; remember(); redoStacks = keep; releaseLive(); applyPatch(state, patch, 'b'); settle();
    }
    function undoBtns(parent, sc) {
      const what = { song: tx('de songbalk'), matrix: tx('de clipmatrix'), clip: tx('de clip-editor') }[sc];
      const u = btn(parent, tx('Undo'), () => scopedUndo(sc), 'mini'); u.disabled = !history.some(h => snapScope.get(h) === sc); u.title = tx('Maakt de laatste wijziging in {0} ongedaan (Ctrl+Z)', what);
      const r = btn(parent, tx('Redo'), () => scopedRedo(sc), 'mini'); r.disabled = !redoStacks[sc].length; r.title = tx('Zet de laatst ongedaan gemaakte wijziging in {0} terug (Ctrl+Shift+Z)', what);
    }
    function emit(i, ev) { if (dead || i < 0 || i >= state.tracks.length) return; host.emit(self, 'track' + (i + 1), ev); host.emit(self, 'tracks', { ...ev, track: 't' + (i + 1), ch: Math.min(16, i + 1) }); }
    let bundleSig = '';
    const bundle = () => ({ label: 'Clip Arranger', tracks: state.tracks.map((t, i) => ({ id: 't' + (i + 1), name: trackName(i), ch: Math.min(16, i + 1) })) });
    function syncBundle() { if (dead || !self) return; const sig = JSON.stringify(bundle().tracks); if (sig !== bundleSig) { bundleSig = sig; if (typeof host.eventBundleChanged === 'function') host.eventBundleChanged(self, 'tracks'); } }
    // een sectie speelt één of meer scènes na elkaar; voor het afspelen delen we een sectie met meer scènes op in stukken van één scène (`_sec` = de sectie waar het stuk bij hoort)
    const secScenes = a => a.scenes && a.scenes.length > 1 ? a.scenes : [a.scene];
    const secSteps = a => a.bars * 16 * a.repeats * secScenes(a).length;
    function playArr() { const out = []; state.arrangement.forEach((a, i) => { if (!(a.scenes && a.scenes.length > 1)) { out.push({ ...a, _sec: i }); return; } for (let r = 0; r < a.repeats; r++) a.scenes.forEach(row => out.push({ ...a, scene: row, scenes: undefined, repeats: 1, _sec: i })); }); return out; }
    const segOf = i => playArr().findIndex(g => g._sec === i);
    function totalSteps() { return state.arrangement.reduce((sum, a) => sum + secSteps(a), 0); }
    // per spoor de beginstand (in stappen) van de clip aan het begin van sectie `index`: bij Doorlopen met dezelfde clip als in de vorige sectie gaat de clip verder waar hij was, anders begint hij bij 0
    // een uitgerekte clip dekt de lege plekken onder zich (span): scène k van de clip speelt deel k, dus begint op k/span van de clip
    const partOff = (c, k) => Math.round(k * c.bars * 16 / Math.max(1, c.span || 1));
    // de scènes (rijen van de matrix) wijzen per spoor naar een clip uit de bibliotheek van dat spoor: cellOf = nummer van de clip of -1
    const cellOf = (ti, row) => { const t = state.tracks[ti], v = t?.cells?.[row]; return Number.isInteger(v) && t.clips[v] ? v : -1; };
    const cellFree = (ti, row) => { const v = cellOf(ti, row); return v < 0 || clipEmpty(state.tracks[ti].clips[v]); };
    // welke clip speelt scène `row` op dit spoor: de eigen clip, of het deel van een uitgerekte clip erboven
    function resolve(ti, row) {
      const t = state.tracks[ti], v = cellOf(ti, row), same = { ci: v, k: 0, off: 0, span: 1 }; if (!t) return { ci: -1, k: 0, off: 0, span: 1 }; if (v >= 0 && !clipEmpty(t.clips[v])) return same;
      for (let r = row - 1; r >= 0; r--) { const u = cellOf(ti, r); if (u < 0 || clipEmpty(t.clips[u])) continue; const c = t.clips[u], sp = c.span || 1; return sp > row - r ? { ci: u, k: row - r, off: partOff(c, row - r), span: sp } : same; }
      return same;
    }
    // hoeveel rijen de clip echt dekt (de gedekte cellen moeten vrij blijven)
    function effSpan(ti, row) { const v = cellOf(ti, row), sp = (v >= 0 ? state.tracks[ti].clips[v].span : 0) || 1; let k = 1; while (k < sp && row + k < state.scenes.length && cellFree(ti, row + k)) k++; return k; }
    // de clip die een sectie op dit spoor speelt: een eigen keuze uit de bibliotheek, of wat de scène van de sectie wijst
    function secRes(a, ti) { const v = a.clips?.[ti]; if (v == null) return resolve(ti, a.scene); return v >= 0 && state.tracks[ti]?.clips[v] ? { ci: v, k: 0, off: 0, span: 1 } : { ci: -1, k: 0, off: 0, span: 1 }; }
    // per sectie en spoor welke clip speelt en vanaf waar (in stappen). Een uitgerekte clip (span) loopt in de song door in de volgende secties zolang de scène van die sectie op dat spoor geen eigen clip heeft: de clip volgt de secties, ook als die scènes niet onder elkaar staan
    function songRes(upto) {
      const n = state.tracks.length, out = [], arr = playArr(); let prev = null;
      for (let i = 0; i <= upto && i < arr.length; i++) { const a = arr[i], row = [];
        for (let t = 0; t < n; t++) { const cl = state.tracks[t].clips; let rs = secRes(a, t);
          if (a.clips?.[t] == null && rs.k === 0 && (rs.ci < 0 || clipEmpty(cl[rs.ci])) && prev) { const p = prev[t], pc = p && p.ci >= 0 ? cl[p.ci] : null; if (pc && !clipEmpty(pc) && (pc.span || 1) > 1 && p.end < pc.bars * 16) rs = { ci: p.ci, k: p.k + 1, off: p.end, span: p.span, run: true }; }
          row.push({ ...rs, end: rs.off + a.bars * 16 }); }
        out.push(row); prev = row; }
      return out; }
    function secPhases(index, res = songRes(index)) {
      const n = state.tracks.length, arr = playArr(); let end = Array(n).fill(0), prev = Array(n).fill(null), start = Array(n).fill(0), cont = Array(n).fill(false);
      for (let i = 0; i <= index && i < arr.length; i++) { const a = arr[i], total = a.bars * 16 * a.repeats, now = [];
        for (let t = 0; t < n; t++) { const rs = res[i][t], ci = rs.ci, c = state.tracks[t].clips[ci], L = c ? c.bars * 16 : 0, cn = !!(a.cont && a.cont[t]) && i > 0 && prev[t] === ci && L > 0; cont[t] = cn; start[t] = cn ? end[t] : rs.off; end[t] = L ? (cn ? (start[t] + total) % L : (rs.off + a.bars * 16) % L) : 0; now[t] = ci; }
        prev = now; }
      return { start, cont, rows: res[Math.min(index, res.length - 1)] }; }
    function locate(tick) {
      const total = totalSteps(); if (!state.songLoop && tick >= total) return null; const arr = playArr(); let at = ((tick % total) + total) % total, start = 0;
      const secFirst = {}, secLen = {}; { let p = 0; arr.forEach(g => { const len = g.bars * 16 * g.repeats; if (secFirst[g._sec] === undefined) secFirst[g._sec] = p; secLen[g._sec] = (secLen[g._sec] || 0) + len; p += len; }); }
      for (let i = 0; i < arr.length; i++) { const a = arr[i], len = a.bars * 16 * a.repeats; if (at < start + len) { const secPos = at - start, res = songRes(Math.min(i + 1, arr.length - 1)), ph = secPhases(i, res), nx = arr[i + 1], lastRep = secPos >= len - a.bars * 16;
        return { index: i, secIdx: a._sec, scene: a.scene, sec: a, local: secPos % (a.bars * 16), secPos, secLen: len, uPos: start - secFirst[a._sec] + secPos, uLen: secLen[a._sec], remaining: a.bars * 16 - secPos % (a.bars * 16), start, total, phases: ph.start, cont: ph.cont, res: ph.rows, carry: state.tracks.map((_, t) => !!(nx && lastRep && ((nx.cont && nx.cont[t] && res[i + 1] && res[i + 1][t].ci === res[i][t].ci) || (res[i + 1] && res[i + 1][t].run && res[i + 1][t].ci === res[i][t].ci)))) }; } start += len; } return null;
    }
    function sectionStart(index) { return state.arrangement.slice(0, index).reduce((n, a) => n + secSteps(a), 0); }
    // ---- eigen klok: staat de klok van de pagina stil, dan loopt dit apparaat zelf (alleen na een klik of pad) zodat een clip of scène los van de rest speelt ----
    let ownRun = null;
    function ownTick() { const o = ownRun; if (!o || dead) return; const bpm = lim(host.bpm, 40, 200, 120), sd = 60 / bpm / 4, sw = lim(host.swing, 0, .5, 0);
      while (o.nextT < ctx.currentTime + .1) { const step = o.pos % 16, time = o.nextT + (step % 2 ? sd * sw : 0); try { schedule({ step, bar: Math.floor(o.pos / 16), time: Math.max(time, ctx.currentTime + .001), stepDur: sd, bpm, swing: sw }); } catch (e) { error = tx('Sequencer: {0}', e?.message || e); } o.pos++; o.nextT += sd; }
      o.timer = setTimeout(ownTick, 25); }
    function ownStart() { if (dead || playing || ownRun) return; try { if (ctx.state === 'suspended') ctx.resume(); } catch (e) { /* de eerste klik hierna lukt het wel */ }
      playing = true; recRun = null; autoRun = null; reset(); ownRun = { pos: 0, nextT: ctx.currentTime + .05, timer: 0 }; syncAuto(); ownTick(); }
    function ownStop(quiet) { if (!ownRun) return; clearTimeout(ownRun.timer); ownRun = null; playing = false; recRun = null; autoRun = null; soloRun = null; reset(); syncAuto(); if (!quiet) render(); }
    function launchScene(sc) { soloRun = null; if (state.mode !== 'session') change(() => { state.mode = 'session'; }); if (playing) { queueScene = sc; queueClips.clear(); } else { state.tracks.forEach(t => t.liveClip = sc); reset(); ownStart(); } render(); }
    function launchClip(ti, ci) { soloRun = null; if (state.mode !== 'session') change(() => { state.mode = 'session'; }); if (playing) queueClips.set(ti, ci); else { state.tracks[ti].liveClip = ci; reset(); ownStart(); } render(); }
    function stopTrack(ti) { launchClip(ti, -1); }
    function readCC(a, step) { if (!a.points.length) return null; let left = null, right = null; for (const p of a.points) { if (p.step <= step) left = p; else { right = p; break; } } if (!left) return null; if (a.shape === 'hold' || !right || right.step === left.step) return left.value; return left.value + (right.value - left.value) * (step - left.step) / (right.step - left.step); }
    // ---- instellingen opnemen en afspelen (contract v1.21, §13f) ----
    // doel van een spoor: de apparaten waar zijn uitgang trackN aan hangt. De lijnen gelden voor het eerste doel; setParam gaat naar alle doelen.
    function readAutoTargets() {
      let all = []; try { all = state.tracks.map((_, i) => (typeof host.cablesFrom === 'function' ? host.cablesFrom(self, 'track' + (i + 1)) : []).map(k => k && k.to).filter(x => typeof x === 'string')); } catch (e) { all = []; }
      const sig = JSON.stringify(all); if (sig !== JSON.stringify(autoTargets)) renderWanted = true; autoTargets = all;
    }
    function refreshTargets(list) { readTargets(list); readAutoTargets(); syncAuto(); }
    function autoClear() { for (const h of autoTimers) clearTimeout(h); autoTimers.clear(); }
    function autoLater(at, fn) { const h = setTimeout(() => { autoTimers.delete(h); if (!dead && playing) fn(); }, Math.max(0, (at - ctx.currentTime) * 1000)); autoTimers.add(h); }
    // afspelen: een punt dat in deze zestiende valt, zet zijn parameter op het juiste moment
    function playAuto(i, c, local, info) {
      const ts = autoTargets[i]; if (!ts || !ts.length || typeof host.setParam !== 'function') return;
      for (const a of c.auto) for (const p of a.points) { const rel = p.step - local; if (rel < 0 || rel >= 1) continue; autoLater(info.time + rel * info.stepDur, () => { for (const tid of ts) host.setParam(self, tid, a.id, p.value); }); }
    }
    // opnemen (latch): een gemelde waarde blijft staan tot de volgende wijziging; alleen bij Opname, draaiende klok en een kabel naar het gekozen spoor
    function onParamIn(tid, id, v) {
      try {
        if (dead || !playing || !state.armed || !state.record || !state.recordSettings || !Number.isFinite(v)) return;
        if (!(autoTargets[state.selectedTrack] || []).includes(tid)) return;
        const p = recordPos(ctx.currentTime, null, .25); if (!p) return; const c = p.c;
        if (!autoRun) { remember(); autoRun = { wiped: new Set() }; }
        let a = c.auto.find(x => x.id === id); if (!a) { if (c.auto.length >= MAXAUTO) return; a = { id, points: [] }; c.auto.push(a); }
        const key = state.selectedTrack + ':' + state.selectedClip + ':' + id; if (state.recordMode === 'replace' && !autoRun.wiped.has(key)) { autoRun.wiped.add(key); a.points = []; }
        const step = quant(p.step, 0, c.bars * 16 - .25, 0), value = Math.round(lim(v, 0, 1, 0) * 1000) / 1000; let prev = null; for (const q of a.points) { if (q.step <= step) prev = q; else break; }
        if (prev && prev.step === step) prev.value = value; else if (!prev || Math.abs(prev.value - value) >= .002) { if (a.points.length >= MAXAUTOPTS) return; a.points.splice(prev ? a.points.indexOf(prev) + 1 : 0, 0, { step, value }); }
        autoDirty = true;
      } catch (e) { error = tx('Instellingen: {0}', e?.message || e); }
    }
    // volgen en vergrendelen volgen de werkstand: volgen alleen tijdens opnemen; de sequencer is alleen baas (modulatie op zijn lijnen uit) als de song dat kiest, hij speelt en er niet wordt opgenomen
    function syncAuto() {
      if (dead || typeof host.watchParams !== 'function' || typeof host.lockParams !== 'function') return;
      const recording = playing && state.armed && state.record && state.recordSettings, want = new Set(recording ? (autoTargets[state.selectedTrack] || []) : []);
      for (const id of [...autoWatched]) if (!want.has(id)) { host.watchParams(self, id, null); autoWatched.delete(id); }
      for (const id of want) if (!autoWatched.has(id)) { host.watchParams(self, id, (pid, v) => onParamIn(id, pid, v)); autoWatched.add(id); }
      const lock = new Map(); if (state.automation === 'sequencer' && playing && state.armed && !recording) state.tracks.forEach((t, i) => { const ids = new Set(); t.clips.forEach(cl => cl.auto.forEach(a => { if (a.points.length) ids.add(a.id); })); if (ids.size) for (const tid of autoTargets[i] || []) { const s = lock.get(tid) || new Set(); ids.forEach(x => s.add(x)); lock.set(tid, s); } });
      const sig = JSON.stringify([...lock].map(([k, s]) => [k, [...s].sort()])); if (sig === autoLockSig) return; autoLockSig = sig;
      for (const tid of [...autoLocked]) if (!lock.has(tid)) { host.lockParams(self, tid, null); autoLocked.delete(tid); }
      for (const [tid, s] of lock) { host.lockParams(self, tid, [...s]); autoLocked.add(tid); }
    }
    function autoRelease() { autoClear(); try { for (const id of [...autoWatched]) host.watchParams(self, id, null); for (const id of [...autoLocked]) host.lockParams(self, id, null); } catch (e) { /* het doel is al weg */ } autoWatched.clear(); autoLocked.clear(); autoLockSig = ''; }
    const fromDevice = t => { const nm = trackNames[state.tracks.indexOf(t)]; return !!(nm && nm.length); };
    // swing: som van clip-, spoor- en rijswing (elk 0 … 0,5 zestiende), hoogstens 0,5; de host-swing zit al in info.time
    const rowSwingOf = (t, row) => t.type === 'drums' && row ? lim(t.rowSwing?.[String(row.note)], 0, .5, 0) : 0;
    const localSwing = (c, t, row) => Math.min(.5, lim(c.swing, 0, .5, 0) + lim(t.swing, 0, .5, 0) + rowSwingOf(t, row));
    // een drumrij van een apparaat met klanknamen gaat altijd als noot (nootnummer uit noteNames): dat bereikt ook gastinstrumenten zonder kanaal en klopt als twee kanalen dezelfde noot delen
    const viaNote = t => t.drumProtocol === 'note' || fromDevice(t);
    const drumHit = (i, t, row, vel, time, dur) => emit(i, viaNote(t) ? { type: 'note', note: row.note, vel, time, dur } : { type: 'trig', lane: row.lane, vel, time });
    function schedule(info) {
      if (dead || !playing || !state.armed) return; if (!info || !Number.isInteger(info.step) || !Number.isInteger(info.bar) || !Number.isFinite(info.time) || !(info.stepDur > 0) || !Number.isFinite(info.stepDur)) return;
      const abs = info.bar * 16 + info.step; if (abs === lastAbs) return; lastBpm = lim(info.bpm, 10, 999, 120); lastDur = 60 / lastBpm / 4; lastInfo = { time: info.time, abs, dur: info.stepDur, hs: lim(info.swing, 0, .5, 0) }; const oddStep = info.step % 2 === 1;
      if (soloRun && (soloRun.ti !== state.selectedTrack || soloRun.ci !== state.selectedClip)) { soloRun.ti = state.selectedTrack; soloRun.ci = state.selectedClip; soloRun.origin = null; soloRun.now = false; }
      if (origin === null || restart || (lastAbs !== null && abs < lastAbs)) { origin = abs; elapsed = 0; trackOrigins = state.tracks.map(() => 0); restart = false; songEnded = false; } else elapsed = abs - origin; lastAbs = abs;
      const tick = elapsed + seek; let position = null;
      if (soloRun && soloRun.origin === null && (soloRun.now || abs % 16 === 0)) { soloRun.origin = abs; soloRun.now = false; }
      if (soloRun) { /* één clip: geen scènes, geen song */ }
      else if (state.mode === 'song') { position = locate(tick); if (!position) { songEnded = true; pending.push({ time: info.time, tick, clips: state.tracks.map(() => -1), roots: state.tracks.map(() => -1), local: state.tracks.map(() => -1), section: -1 }); if (pending.length > 128) pending.shift(); return; } }
      else if (elapsed % 16 === 0) {
        if (queueScene !== null) { state.tracks.forEach((t, i) => { active[i] = queueScene; t.liveClip = queueScene; trackOrigins[i] = elapsed; }); queueScene = null; renderWanted = true; }
        if (queueClips.size) { queueClips.forEach((ci, i) => { if (state.tracks[i]) { active[i] = ci; state.tracks[i].liveClip = ci; trackOrigins[i] = elapsed; } }); queueClips.clear(); renderWanted = true; }
      }
      const solo = state.tracks.some(t => t.solo), clipIds = [], roots = [], locals = [];
      state.tracks.forEach((t, i) => {
        if (soloRun && (i !== soloRun.ti || soloRun.origin === null)) { clipIds.push(-1); roots.push(-1); locals.push(-1); return; }
        const rs0 = position && !soloRun ? position.res[i] : null, slotId = soloRun ? soloRun.ci : position ? position.sec.scene : (active[i] ?? t.liveClip), rs = soloRun ? { ci: slotId, off: 0 } : rs0 || resolve(i, slotId), ci = rs.ci, c = t.clips[ci]; clipIds.push(slotId); roots.push(ci); if (!c) { locals.push(-1); return; } const local = (position ? (position.phases[i] + (position.cont[i] ? position.secPos : position.local)) : (soloRun ? abs - soloRun.origin : rs.off + elapsed - (trackOrigins[i] || 0))) % (c.bars * 16); locals.push(local); if (!soloRun && (t.mute || (solo && !t.solo))) return;
        const rows = t.type === 'drums' ? rowsOf(t) : null, ccAt = info.time + (oddStep ? localSwing(c, t, null) : 0) * info.stepDur;
        if (c.auto.length) playAuto(i, c, local, info);
        for (const a of c.cc) { const v = readCC(a, local); if (v !== null) emit(i, { type: 'cc', id: a.id, value: Math.min(1, Math.max(0, v)), time: ccAt }); }
        for (const n of c.notes) {
          const rel = n.step - local; if (rel < 0 || rel >= 1 || Math.random() > n.prob) continue; const vel = Math.min(1, n.vel * t.velocity); if (vel <= 0) continue;
          const row = rows ? rows[n.row] : null; if (rows && !row) continue; // een rij buiten de lijst van het apparaat klinkt niet, maar breekt de stap niet af
          const at = info.time + rel * info.stepDur + (oddStep ? localSwing(c, t, row) : 0) * info.stepDur;
          if (t.type === 'drums') { for (let r = 0; r < n.ratchet; r++) { const time = at + r * info.stepDur / n.ratchet; drumHit(i, t, row, vel, time, Math.max(.01, lastDur * .8 / n.ratchet)); } }
          else { const maxSteps = (position && !position.carry[i] ? Math.min(c.bars * 16 - local, position.remaining) : c.bars * 16 - local) - rel; const len = Math.min(n.len, maxSteps); emit(i, { type: 'note', note: integer(n.note + t.transpose, 0, 127, 60), vel, time: at, dur: Math.max(.01, len * lastDur * t.gate) }); }
        }
      });
      pending.push({ time: info.time, tick, clips: clipIds, roots, local: locals, section: position?.secIdx ?? -1, secLocal: position ? position.local : -1, secPos: position ? position.uPos : -1, secLen: position ? position.uLen : 0 }); if (pending.length > 128) pending.shift();
    }
    function audition(n, row) { const t = currentTrack(), i = state.selectedTrack, time = ctx.currentTime; if (t.type === 'drums') { const rs = rowsOf(t), r = rs[row] || rs[0]; drumHit(i, t, r, state.drawVelocity, time, .12); } else emit(i, { type: 'note', note: integer(n + t.transpose, 0, 127, 60), vel: state.drawVelocity, time, dur: Math.min(2, state.drawLength * lastDur) }); }
    function nextId(c) { return Math.max(-1, ...c.notes.map(n => n.id)) + 1; }
    function addNote(step, n, row) { const c = currentClip(); if (c.notes.length >= MAXNOTES) return; change(() => { const z = note(nextId(c), step, n, state.drawLength, state.drawVelocity, row); z.prob = state.drawProbability; z.ratchet = state.drawRatchet; c.notes.push(z); state.selectedNote = z.id; }); }
    function selected() { return currentClip().notes.find(n => n.id === state.selectedNote); }
    // 'Speel deze clip': de gekozen clip van het gekozen spoor loopt op zijn eigen lengte, los van scènes en song; start op de volgende maat (meteen als de klok stilstaat)
    function playClip() { if (dead) return; soloRun = { ti: state.selectedTrack, ci: state.selectedClip, origin: null, now: !playing }; queueScene = null; queueClips.clear(); ownStart(); }
    function stopClip() { soloRun = null; if (ownRun) ownStop(true); }
    function copyClip() { clipboard = { clip: clone(currentClip()), drums: isDrumsT(state.selectedTrack) }; render(); }
    function pasteClip() { pasteAt(state.selectedTrack, selRow); }
    function setTrackCount(n) { releaseLive(); change(() => { while (state.tracks.length < n) { const tr = track(state.tracks.length); tr.cells = Array.from({ length: state.scenes.length }, (_, j) => j < tr.clips.length ? j : -1); state.tracks.push(tr); } state.tracks.length = n; state.selectedTrack = Math.min(state.selectedTrack, n - 1); reset(); }); }
    const clipEmpty = clipIsEmpty;
    // clips die ergens in gebruik zijn: in een scène van dit spoor of als eigen keuze van een sectie
    function usedLib(ti) { syncSongs(); const u = new Set(state.tracks[ti].cells.filter(v => v >= 0)); state.songs.forEach(sg => sg.arrangement.forEach(a => { const v = a.clips?.[ti]; if (v != null && v >= 0) u.add(v); })); return u; }
    // het eerste vrije slot van de bibliotheek (leeg en nergens in gebruik) of een nieuw slot achteraan; -1 als de bibliotheek vol is
    function libFree(ti) { const t = state.tracks[ti], u = usedLib(ti); for (let j = 0; j < t.clips.length; j++) if (clipEmpty(t.clips[j]) && !u.has(j)) return j; return t.clips.length < MAXSLOTS ? t.clips.length : -1; }
    // een clip aan de bibliotheek toevoegen (leeg of een kopie van `src`), optioneel meteen in scène `row`; geeft het nummer terug
    function addLibClip(ti, row, src) { const t = state.tracks[ti], j = libFree(ti); if (j < 0) return -1; const c = src ? clone(src) : blankClip(j); if (src) delete c.span; t.clips[j] = c; if (row != null && row >= 0 && row < t.cells.length) t.cells[row] = j; return j; }
    const rowOfClip = (ti, j) => cellOf(ti, selRow) === j ? selRow : state.tracks[ti].cells.indexOf(j);
    function nextFreeRow(ti, from) { const n = state.scenes.length; for (let k = 1; k < n; k++) { const r = (from + k) % n; if (cellOf(ti, r) < 0 && resolve(ti, r).k === 0) return r; } return -1; }
    function fixSpan(ti, row) { const v = cellOf(ti, row), c = v >= 0 ? state.tracks[ti].clips[v] : null; if (!c || !c.span) return; const k = effSpan(ti, row); if (k > 1 && !clipEmpty(c)) c.span = k; else delete c.span; }
    const fixSpans = ti => state.scenes.forEach((_, r) => fixSpan(ti, r));
    function selectCell(ti, row) { setSelectedTrack(ti); selRow = row; const v = cellOf(ti, row); if (v >= 0) state.selectedClip = v; state.selectedNote = -1; state.editPage = 0; render(); }
    function stepClip(d) { const N = currentTrack().clips.length; selectClip(state.selectedTrack, (state.selectedClip + d + N) % N); }
    function newClipAt(ti, row) { if (libFree(ti) < 0) return; change(() => { const j = addLibClip(ti, row); fixSpans(ti); setSelectedTrack(ti); selRow = row ?? selRow; state.selectedClip = j; state.selectedNote = -1; state.editPage = 0; }); }
    function newClip() { const ti = state.selectedTrack; newClipAt(ti, cellOf(ti, selRow) < 0 && selRow < state.scenes.length ? selRow : null); }
    // een kopie van de gekozen clip, in de eerstvolgende lege scène als die er is (anders alleen in de bibliotheek)
    function copyToEmpty() { const ti = state.selectedTrack, src = currentClip(); if (libFree(ti) < 0) return; const row = nextFreeRow(ti, selRow); change(() => { const j = addLibClip(ti, row, src); state.tracks[ti].clips[j].name = (src.name + ' copy').slice(0, 32); setSelectedTrack(ti); if (row >= 0) selRow = row; state.selectedClip = j; state.selectedNote = -1; state.editPage = 0; }); }
    // ---- scènes en songs ----
    // Een scène is een rij in de matrix (slot j van elk spoor). Het aantal is vrij (1 … 24). Een song is een arrangement (lijst secties) op die scènes; alle songs delen dezelfde scènes en clips.
    function syncSongs() { if (state.songs[state.activeSong]) state.songs[state.activeSong].arrangement = state.arrangement; }
    // order[nieuwe plek] = oude plek (of -1 voor een lege scène); komt een oude plek twee keer voor, dan is de tweede een kopie. Alle songs verwijzen daarna naar de nieuwe plekken; een sectie van een verdwenen scène vervalt.
    function rebuildScenes(order) {
      syncSongs(); const n = order.length, first = []; order.forEach((o, ni) => { if (o >= 0 && first[o] === undefined) first[o] = ni; }); const fm = o => first[o] === undefined ? -1 : first[o], dup = order.map((o, ni) => o >= 0 && order.indexOf(o) !== ni);
      // een lege naam volgt de plek (Intro, Groove …): bij verschuiven wordt de naam vastgezet, zodat de scène zijn naam houdt; een nieuwe scène krijgt een vrije naam
      const taken = new Set(order.filter(o => o >= 0).map(o => sceneName(o))), fresh = () => { for (let k = 1; ; k++) { const nm = tx('Scène {0}', k); if (!taken.has(nm)) { taken.add(nm); return nm; } } };
      const names = order.map((o, ni) => { const nm = { name: o < 0 ? fresh() : dup[ni] ? (sceneName(o) + ' copy').slice(0, 24) : sceneName(o) }; if (o >= 0 && state.scenes[o]?.color) nm.color = state.scenes[o].color; return nm; });
      state.songs.forEach(sg => { const arr = []; for (const a of sg.arrangement) { const list = secScenes(a).map(fm).filter(k => k >= 0); if (!list.length) continue; const b = { ...a, scene: list[0] }; if (list.length > 1) b.scenes = list; else delete b.scenes; arr.push(cleanSection(b, n)); } sg.arrangement = arr.length ? arr : [cleanSection({ scene: 0, bars: 4 }, n)]; });
      state.arrangement = state.songs[state.activeSong].arrangement; state.selectedSection = Math.min(state.selectedSection, state.arrangement.length - 1);
      // de clips zelf blijven in de bibliotheek (03) staan en veranderen niet van plaats: een scène is alleen een rij met verwijzingen. Een gedupliceerde scène krijgt eigen kopieën van de clips
      state.tracks.forEach((t, ti) => { const old = t.cells, used = usedLib(ti);
        t.cells = order.map((o, ni) => { const v = o < 0 ? -1 : (old[o] ?? -1); if (!dup[ni] || v < 0) return v; let j = -1; for (let k = 0; k < t.clips.length; k++) if (clipEmpty(t.clips[k]) && !used.has(k)) { j = k; break; } if (j < 0 && t.clips.length < MAXSLOTS) j = t.clips.length; if (j < 0) return v; const c = clone(t.clips[v]); delete c.span; c.name = (c.name + ' copy').slice(0, 32); t.clips[j] = c; used.add(j); return j; });
        const lc = t.liveClip < 0 ? -1 : fm(t.liveClip); t.liveClip = t.liveClip >= 0 && lc < 0 ? 0 : lc; });
      state.scenes = names; state.tracks.forEach((_, ti) => fixSpans(ti)); selRow = Math.min(selRow, n - 1); state.selectedNote = -1; state.editPage = 0; reset();
    }
    const range0 = n => Array.from({ length: n }, (_, i) => i);
    const sceneUsage = () => { const use = state.scenes.map(() => new Set()); syncSongs(); state.songs.forEach((sg, si) => sg.arrangement.forEach(a => { secScenes(a).forEach(k => use[k]?.add(si)); })); return use; };
    function addScene(after) { const n = state.scenes.length; if (n >= MAXSCENES) return; const o = range0(n); o.splice(after + 1, 0, -1); change(() => { rebuildScenes(o); selRow = after + 1; }); }
    function dupScene(k) { const n = state.scenes.length; if (n >= MAXSCENES) return; const o = range0(n); o.splice(k + 1, 0, k); change(() => { rebuildScenes(o); selRow = k + 1; }); }
    // de × bij een scène verwijdert de rij; haar clips blijven als clip in de bibliotheek (03) staan
    function delScene(k) { const n = state.scenes.length; if (n <= 1) return; change(() => { rebuildScenes(range0(n).filter(i => i !== k)); }); }
    function moveScene(k, to) { if (k === to) return; const o = range0(state.scenes.length); o.splice(k, 1); o.splice(to, 0, k); change(() => { rebuildScenes(o); selRow = to; }); }
    const emptyScene = k => state.tracks.every((t, ti) => cellFree(ti, k));
    // lege scènes die in geen enkele song voorkomen
    const spareScenes = () => { const use = sceneUsage(); return range0(state.scenes.length).filter(k => !use[k].size && emptyScene(k)); };
    function pruneScenes() { const gone = new Set(spareScenes()); if (gone.size >= state.scenes.length) gone.delete(state.scenes.length - 1); if (!gone.size) return; change(() => { rebuildScenes(range0(state.scenes.length).filter(i => !gone.has(i))); }); }
    function renameScene(k, v) { const nm = v.trim().slice(0, 24); if (nm === sceneName(k)) return; change(() => { state.scenes[k].name = nm === sceneDefault(k) ? '' : nm; }); }
    function switchSong(i) { if (i === state.activeSong || !state.songs[i]) return; syncSongs(); change(() => { state.activeSong = i; state.arrangement = state.songs[i].arrangement; state.selectedSection = 0; const a = state.arrangement[0], ci = a ? secRes(a, state.selectedTrack).ci : -1; if (a) selRow = a.scene; if (ci >= 0) state.selectedClip = ci; soloRun = null; reset(); }); }
    // Nieuw project: volledig leeg beginnen (1 scène, 1 sectie in 1 song, lege clips); via change() dus met Ongedaan maken
    function newProject() {
      ownStop(true); releaseLive(); soloRun = null; recRun = null; autoRun = null;
      change(() => { const e = defaults(), arr = [{ scene: 0, bars: 4, repeats: 1 }]; e.title = ''; e.scenes = [{ name: '' }]; e.arrangement = arr; e.songs = [{ name: '', arrangement: arr }]; e.mode = 'session'; e.tracks.forEach(t => { t.clips = [blankClip(0)]; t.cells = [-1]; t.liveClip = 0; }); state = sanitize(e); reset(); });
    }
    function newSong() { if (state.songs.length >= MAXSONGS) return; syncSongs(); change(() => { state.songs.push({ name: '', arrangement: [cleanSection({ scene: state.selectedClip, bars: 4 }, state.scenes.length)] }); state.activeSong = state.songs.length - 1; state.arrangement = state.songs[state.activeSong].arrangement; state.selectedSection = 0; soloRun = null; reset(); }); }
    function dupSong() { if (state.songs.length >= MAXSONGS) return; syncSongs(); change(() => { state.songs.push({ name: (songName(state.activeSong) + ' copy').slice(0, 24), arrangement: clone(state.arrangement) }); state.activeSong = state.songs.length - 1; state.arrangement = state.songs[state.activeSong].arrangement; soloRun = null; reset(); }); }
    function delSong() { if (state.songs.length <= 1) return; syncSongs(); change(() => { state.songs.splice(state.activeSong, 1); state.activeSong = Math.min(state.activeSong, state.songs.length - 1); state.arrangement = state.songs[state.activeSong].arrangement; state.selectedSection = 0; soloRun = null; reset(); }); }
    // een sectie met deze scène achteraan de song, de lengte volgt de langste clip (hoogstens 16 maten)
    // de scènes van een sectie instellen (1 of meer; ze spelen na elkaar)
    function setSecScenes(i, list) { const a = state.arrangement[i]; if (!a || !list.length) return; list = list.slice(0, 16); change(() => { if (list.length > 1) a.scenes = list; else delete a.scenes; a.scene = list[0]; selRow = list[0]; const c0 = secRes(a, state.selectedTrack).ci; if (c0 >= 0) state.selectedClip = c0; }); }
    function appendSection(sc) { if (state.arrangement.length >= 64) return; const bars = Math.max(1, Math.min(16, ...state.tracks.map((t, ti) => t.clips[cellOf(ti, sc)]?.bars || 1))); change(() => { state.arrangement.push(cleanSection({ scene: sc, bars }, state.scenes.length)); state.selectedSection = state.arrangement.length - 1; selRow = sc; }); }
    // de greep onderaan een clip: omlaag slepen rekt de clip uit over de lege scènes eronder; loslaten legt het vast (één Ongedaan-stap)
    function stretchGrip(e, ti, ci) {
      e.preventDefault(); e.stopPropagation(); const t = state.tracks[ti], rows = viewRefs.slots.filter(r => r.ti === ti); let maxSp = 1; while (ci + maxSp < state.scenes.length && cellFree(ti, ci + maxSp)) maxSp++;
      const start = effSpan(ti, ci); let target = start; const paint = n => rows.forEach(r => r.el.classList.toggle('previewcov', r.ci > ci && r.ci < ci + n));
      const move = ev => { let n = 1; for (const r of rows) if (r.ci >= ci && ev.clientY >= r.el.getBoundingClientRect().top) n = r.ci - ci + 1; n = Math.max(1, Math.min(maxSp, n)); if (n !== target) { target = n; paint(n); } };
      const up = () => { document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up); rows.forEach(r => r.el.classList.remove('previewcov')); if (target !== start) change(() => { const cl = t.clips[cellOf(ti, ci)]; if (!cl) return; if (target > 1) cl.span = target; else delete cl.span; }); };
      document.addEventListener('mousemove', move); document.addEventListener('mouseup', up); paint(target);
    }
    // ---- klembord (clips, secties, pagina's), contextmenu en sneltoetsen ----
    let secClipboard = null, pageClip = null, menuEl = null, area = null, statusEl = null, dragSection = null;
    const isDrumsT = ti => state.tracks[ti]?.type === 'drums';
    // een clip of pagina past alleen op een spoor van dezelfde soort: drums met drums, toetsen en drone onderling
    function copyAt(ti, row) { const v = cellOf(ti, row); if (v < 0) return; clipboard = { clip: clone(state.tracks[ti].clips[v]), drums: isDrumsT(ti) }; render(); }
    const canPasteAt = ti => !!clipboard && clipboard.drums === isDrumsT(ti);
    // plakken maakt een nieuwe clip in de bibliotheek en zet hem in de scène; de clip die er eerst stond blijft in de bibliotheek
    function pasteAt(ti, row) { if (!canPasteAt(ti) || libFree(ti) < 0) return; change(() => { const j = addLibClip(ti, row, clipboard.clip); fixSpans(ti); setSelectedTrack(ti); selRow = row; state.selectedClip = j; state.selectedNote = -1; state.editPage = 0; }); }
    // een clip echt weggooien: uit de bibliotheek, dus ook uit alle scènes en sectiekeuzes die hem gebruiken
    function deleteLib(ti, j) { const t = state.tracks[ti]; if (!t.clips[j]) return; syncSongs(); change(() => { t.clips[j] = blankClip(j); t.cells = t.cells.map(v => v === j ? -1 : v); state.songs.forEach(sg => sg.arrangement.forEach(a => { if (a.clips && a.clips[ti] === j) { a.clips[ti] = null; if (a.clips.every(v => v === null)) delete a.clips; } })); state.arrangement = state.songs[state.activeSong].arrangement; const u = usedLib(ti); while (t.clips.length > 8 && clipEmpty(t.clips[t.clips.length - 1]) && !u.has(t.clips.length - 1)) t.clips.pop(); fixSpans(ti); state.selectedNote = -1; state.editPage = 0; }); }
    function deleteAt(ti, row) { const v = cellOf(ti, row); if (v >= 0) deleteLib(ti, v); }
    // een clip uit een scène halen: de scène speelt hem niet meer, maar de clip blijft in de bibliotheek (03) staan
    function removeFromScene(ti, row) { if (cellOf(ti, row) < 0) return; change(() => { state.tracks[ti].cells[row] = -1; fixSpans(ti); }); }
    function cutAt(ti, row) { copyAt(ti, row); removeFromScene(ti, row); }
    function selSecQuiet(i) { state.selectedSection = i; const a = state.arrangement[i], ci = a ? secRes(a, state.selectedTrack).ci : -1; if (a) selRow = a.scene; if (ci >= 0) state.selectedClip = ci; }
    function copySec(i) { secClipboard = clone(state.arrangement[i]); render(); }
    function pasteSec(i) { if (!secClipboard || state.arrangement.length >= 64) return; change(() => { state.arrangement.splice(i + 1, 0, cleanSection(clone(secClipboard), state.scenes.length)); selSecQuiet(i + 1); }); }
    function dupSec(i) { if (state.arrangement.length >= 64) return; change(() => { state.arrangement.splice(i + 1, 0, cleanSection(clone(state.arrangement[i]), state.scenes.length)); selSecQuiet(i + 1); }); }
    function delSec(i) { if (state.arrangement.length <= 1) return; change(() => { state.arrangement.splice(i, 1); selSecQuiet(Math.min(i, state.arrangement.length - 1)); }); }
    function cutSec(i) { if (state.arrangement.length <= 1) return; secClipboard = clone(state.arrangement[i]); delSec(i); }
    // De rijen van de matrix volgen de songvolgorde: de scènes van de actieve song nemen de plekken in die zij nu al hebben, maar in de volgorde waarin ze in de song voorkomen. Andere rijen blijven staan; namen en clips gaan met hun scène mee en alle songs verwijzen daarna naar de nieuwe rij. De klok loopt door (alleen het afspelen van één clip wordt bijgehouden).
    function followSong() {
      const n = state.scenes.length, firstSeen = []; state.arrangement.forEach(a => secScenes(a).forEach(k => { if (!firstSeen.includes(k)) firstSeen.push(k); }));
      const slots = firstSeen.slice().sort((x, y) => x - y), order = range0(n); slots.forEach((slot, i) => { order[slot] = firstSeen[i]; });
      if (order.every((o, i) => o === i)) return;
      const keep = { elapsed, seek, origin, lastAbs, restart, trackOrigins: trackOrigins.slice() }, sel = state.selectedSection;
      rebuildScenes(order);
      elapsed = keep.elapsed; seek = keep.seek; origin = keep.origin; lastAbs = keep.lastAbs; restart = keep.restart; trackOrigins = keep.trackOrigins;
      if (soloRun) soloRun.ci = order.indexOf(soloRun.ci);
      state.selectedSection = Math.min(sel, state.arrangement.length - 1);
    }
    function moveSec(from, to) { if (from === to || from < 0 || to < 0 || from >= state.arrangement.length || to >= state.arrangement.length) return; change(() => { const [a] = state.arrangement.splice(from, 1); state.arrangement.splice(to, 0, a); followSong(); selSecQuiet(to); }); }
    // Lengte van de gekozen clip verdubbelen of halveren: alle tijden (noten, nootlengtes, CC- en instellingspunten) schalen mee, zodat het patroon bij hetzelfde tempo half zo snel (verdubbelen) of dubbel zo snel (halveren) klinkt en bij het dubbele of halve tempo weer als eerst. Halveren kan alleen bij een even aantal maten; tijden worden op 1/64 afgerond (dat verlies melden we).
    const QS = .25, onGrid = v => Math.abs(v / QS - Math.round(v / QS)) < 1e-9;
    function scaleWhy(c, f) { if (f > 1) return c.bars * 2 > 64 ? tx('Een clip is hoogstens 64 maten.') : ''; if (f < 1 && (c.bars % 2 || c.bars < 2)) return tx('Halveren kan alleen bij een even aantal maten.'); return ''; }
    const scaleLoss = (c, f) => c.notes.some(n => !onGrid(n.step * f) || !onGrid(n.len * f)) || [...c.cc, ...c.auto].some(a => a.points.some(p => !onGrid(p.step * f)));
    function scaleClip(c, f) {
      if (scaleWhy(c, f)) return; const L = c.bars * 16 * f, r = v => Math.round(v / QS) * QS;
      c.bars = c.bars * f; c.notes.forEach(n => { n.step = Math.max(0, Math.min(L - QS, r(n.step * f))); n.len = Math.max(QS, Math.min(1024, r(n.len * f))); });
      for (const a of [...c.cc, ...c.auto]) { const by = new Map(); a.points.forEach(p => by.set(Math.max(0, Math.min(L - QS, r(p.step * f))), p.value)); a.points = [...by].sort((u, v) => u[0] - v[0]).map(([step, value]) => ({ step, value })); }
      state.editPage = 0;
    }
    // een pagina van de clip-editor (de stappen van de gekozen pagina): noten, CC en instellingen
    const pageRange = (c, page) => { const from = page * state.zoom; return [from, Math.min(from + state.zoom, c.bars * 16)]; };
    function copyPage() {
      const c = currentClip(), [a, b] = pageRange(c, state.editPage), lanes = l => l.map(x => ({ id: x.id, ...(x.shape ? { shape: x.shape } : {}), points: x.points.filter(p => p.step >= a && p.step < b).map(p => ({ ...p, step: p.step - a })) })).filter(x => x.points.length);
      pageClip = { drums: isDrumsT(state.selectedTrack), len: b - a, notes: c.notes.filter(n => n.step >= a && n.step < b).map(n => ({ ...clone(n), step: n.step - a })), cc: lanes(c.cc), auto: lanes(c.auto) }; render();
    }
    function pastePageWhy() { if (!pageClip) return tx('Kopieer eerst een pagina.'); const c = currentClip(); if (isDrumsT(state.selectedTrack) !== pageClip.drums) return tx('Een pagina past alleen op een spoor van dezelfde soort (drums met drums, toetsen en drone onderling).'); if (pageRange(c, state.editPage)[0] + pageClip.len > c.bars * 16) return tx('De gekozen pagina is te kort: de clip is niet lang genoeg voor deze pagina.'); return ''; }
    function pastePage() {
      if (pastePageWhy()) return;
      change(() => {
        const c = currentClip(), [a] = pageRange(c, state.editPage), b = a + pageClip.len, inR = p => p.step >= a && p.step < b;
        c.notes = c.notes.filter(n => !inR(n)); let id = nextId(c); for (const n of pageClip.notes) if (c.notes.length < MAXNOTES) c.notes.push({ ...clone(n), id: id++, step: n.step + a });
        const put = (list, max, from, mk) => { list.forEach(l => { l.points = l.points.filter(p => !inR(p)); }); for (const pl of from) { let l = list.find(x => x.id === pl.id); if (!l) { if (list.length >= max) continue; l = mk(pl); list.push(l); } for (const p of pl.points) l.points.push({ ...p, step: p.step + a }); l.points.sort((x, y) => x.step - y.step); } };
        put(c.cc, 8, pageClip.cc, pl => ({ id: pl.id, shape: pl.shape || 'linear', points: [] })); put(c.auto, MAXAUTO, pageClip.auto, pl => ({ id: pl.id, points: [] }));
        state.selectedNote = -1;
      });
    }
    // contextmenu in de kaart (rechtermuisknop); de plek volgt de schaal van het canvas
    function closeMenu() { if (menuEl) { menuEl.remove(); menuEl = null; } panelTrack = null; panelScene = null; }
    function openMenu(e, items) {
      closeMenu(); const app = root && root.querySelector('.rg'); if (!app) return; e.preventDefault(); e.stopPropagation();
      const m = el('div', app, undefined, 'ctxmenu'); m.setAttribute('role', 'menu');
      items.forEach(it => { if (it === '-') { el('div', m, undefined, 'ctxsep'); return; } const b = btn(m, it.label, () => { closeMenu(); it.fn(); }, 'ctxitem'); b.setAttribute('role', 'menuitem'); b.disabled = !!it.disabled; if (it.title) b.title = it.title; if (it.hint) el('span', b, it.hint, 'ctxhint'); });
      const r = app.getBoundingClientRect(), sc = (r.width / app.offsetWidth) || 1; m.style.left = Math.max(0, (e.clientX - r.left) / sc) + 'px'; m.style.top = Math.max(0, (e.clientY - r.top) / sc) + 'px';
      menuEl = m; const f = m.querySelector('button:not(:disabled)'); if (f) f.focus({ preventScroll: true });
    }
    function sectionMenu(e, i) {
      if (state.selectedSection !== i) selectSection(i); const n = state.arrangement.length;
      openMenu(e, [{ label: tx('Kopieer sectie'), hint: 'Ctrl+C', fn: () => copySec(i) }, { label: tx('Knip sectie'), hint: 'Ctrl+X', fn: () => cutSec(i), disabled: n <= 1 }, { label: tx('Plak sectie (na deze)'), hint: 'Ctrl+V', fn: () => pasteSec(i), disabled: !secClipboard || n >= 64 },
        { label: tx('Dupliceer sectie'), fn: () => dupSec(i), disabled: n >= 64 }, '-', { label: tx('Verwijder sectie'), hint: 'Del', fn: () => delSec(i), disabled: n <= 1 }]);
    }
    // hergebruik: dezelfde clip in meer scènes van een spoor; het is een verwijzing, geen kopie
    function reuseItems(ti, row) {
      const t = state.tracks[ti], v = cellOf(ti, row), items = [];
      if (v >= 0) { const nx = nextFreeRow(ti, row); items.push({ label: tx('Hergebruik in volgende lege scène'), fn: () => assignCell(ti, nx, v), disabled: nx < 0 }, { label: tx('Hergebruik in alle lege scènes'), fn: () => linkAllEmpty(ti, row), disabled: nx < 0 }); if (t.cells.filter(u => u === v).length > 1) items.push({ label: tx('Maak eigen kopie'), fn: () => ownCopy(ti, row), disabled: libFree(ti) < 0 }); return items; }
      items.push({ label: tx('Nieuwe clip hier'), fn: () => newClipAt(ti, row), disabled: libFree(ti) < 0 });
      t.clips.forEach((r, j) => { if (hasContent(r)) items.push({ label: tx('Hergebruik clip {0}: {1}', j + 1, r.name), fn: () => assignCell(ti, row, j) }); });
      return items;
    }
    function clipMenu(e, ti, row) {
      if (!(state.selectedTrack === ti && selRow === row)) selectCell(ti, row); const v = cellOf(ti, row), empty = v < 0, okPaste = canPasteAt(ti);
      openMenu(e, [{ label: tx('Kopieer clip'), hint: 'Ctrl+C', fn: () => copyAt(ti, row), disabled: empty }, { label: tx('Knip clip'), hint: 'Ctrl+X', fn: () => cutAt(ti, row), disabled: empty },
        { label: tx('Plak clip'), hint: 'Ctrl+V', fn: () => pasteAt(ti, row), disabled: !okPaste, title: clipboard && !okPaste ? tx('Een clip past alleen op een spoor van dezelfde soort (drums met drums, toetsen en drone onderling).') : '' },
        '-', ...reuseItems(ti, row), '-', { label: tx('Haal uit scène'), hint: 'Del', fn: () => removeFromScene(ti, row), disabled: empty }, { label: tx('Verwijder clip helemaal'), fn: () => deleteAt(ti, row), disabled: empty }]);
    }
    // sneltoetsen: gelden voor het deel van de kaart waar je het laatst klikte (songbalk of matrix); de weergave wordt bij elke wijziging opnieuw opgebouwd, dus de focus is geen houvast
    function docDown(e) { if (!root) return; const p = e.composedPath ? e.composedPath() : []; if (menuEl && !p.includes(menuEl)) closeMenu(); if (!p.includes(root)) { area = null; return; } const t = p[0]; area = t && t.closest && t.closest('.songbar') ? 'song' : t && t.closest && t.closest('.session') ? 'matrix' : 'other'; }
    function docKey(e) {
      if (dead || !root || !area || area === 'other') return; const t = e.composedPath ? e.composedPath()[0] : e.target; if (t && ['INPUT', 'SELECT', 'TEXTAREA'].includes(t.tagName)) return;
      const mod = e.ctrlKey || e.metaKey, k = (e.key || '').toLowerCase(), del = e.key === 'Delete' || e.key === 'Backspace'; let did = true;
      if (e.key === 'Escape' && menuEl) closeMenu();
      else if (mod && k === 'z') { const sc = area === 'song' ? 'song' : 'matrix'; e.shiftKey ? scopedRedo(sc) : scopedUndo(sc); }
      else if (area === 'song') { const i = state.selectedSection; if (mod && k === 'c') copySec(i); else if (mod && k === 'x') cutSec(i); else if (mod && k === 'v') pasteSec(i); else if (del) delSec(i); else did = false; }
      else { const ti = state.selectedTrack, row = selRow, has = cellOf(ti, row) >= 0; if (mod && k === 'c') { if (has) copyAt(ti, row); } else if (mod && k === 'x') { if (has) cutAt(ti, row); } else if (mod && k === 'v') pasteAt(ti, row); else if (del) { if (has) removeFromScene(ti, row); } else did = false; }
      if (did) { e.preventDefault(); e.stopPropagation(); }
    }
    const clearDrop = () => root?.querySelectorAll('.dragging,.dropok,.dropbefore,.dropafter,.droptarget').forEach(x => x.classList.remove('dragging', 'dropok', 'dropbefore', 'dropafter', 'droptarget'));
    let dragScene = null;
    let dragSrc = null;
    const sameKind = (a, b) => (state.tracks[a].type === 'drums') === (state.tracks[b].type === 'drums');
    const canDrop = (src, ti, ci) => (src.lib !== undefined || !(src.ti === ti && src.ci === ci)) && sameKind(src.ti, ti);
    // een clip in een scène zetten (een verwijzing naar een clip uit de bibliotheek)
    function assignCell(ti, row, j) { if (row < 0 || j < 0) return; change(() => { state.tracks[ti].cells[row] = j; fixSpans(ti); setSelectedTrack(ti); selRow = row; state.selectedClip = j; state.selectedNote = -1; state.editPage = 0; }); }
    function linkAllEmpty(ti, row) { const v = cellOf(ti, row); if (v < 0) return; change(() => { const t = state.tracks[ti]; t.cells.forEach((u, r) => { if (u < 0 && resolve(ti, r).k === 0) t.cells[r] = v; }); }); }
    function ownCopy(ti, row) { const v = cellOf(ti, row); if (v < 0 || libFree(ti) < 0) return; change(() => { const j = addLibClip(ti, row, state.tracks[ti].clips[v]); state.selectedClip = j; }); }
    // een clip van scène naar scène slepen verplaatst de verwijzing; met Ctrl komt er een eigen kopie; naar een ander spoor (zelfde soort) kopieert altijd. `lib`: de clip komt uit de clipbalk
    function moveClip(fti, frow, tti, trow, copy, lib) {
      const v = lib !== undefined ? lib : cellOf(fti, frow); if (v < 0 || !state.tracks[fti].clips[v]) return;
      change(() => {
        if (fti === tti && !copy) { state.tracks[tti].cells[trow] = v; if (lib === undefined && frow !== trow) state.tracks[fti].cells[frow] = -1; state.selectedClip = v; }
        else { const j = addLibClip(tti, trow, state.tracks[fti].clips[v]); if (j < 0) return; if (fti !== tti && !copy && lib === undefined) state.tracks[fti].cells[frow] = -1; state.selectedClip = j; }
        fixSpans(fti); fixSpans(tti); setSelectedTrack(tti); selRow = trow; state.selectedNote = -1; state.editPage = 0; });
    }
    function deleteClip() { deleteLib(state.selectedTrack, state.selectedClip); }
    // een sectie van het songarrangement kiezen: de editor gaat naar de scène van die sectie (de clip van het gekozen spoor)
    function selectSection(i) { state.selectedSection = i; const a = state.arrangement[i], ci = a ? secRes(a, state.selectedTrack).ci : -1; if (a) selRow = a.scene; if (ci >= 0 && ci !== state.selectedClip) { state.selectedClip = ci; state.selectedNote = -1; state.editPage = 0; } render(); }
    function renderClipStrip(sec, t, c) {
      const strip = el('div', sec, undefined, 'clipstrip'), ti = state.selectedTrack;
      el('span', strip, tx('CLIP'), 'lbl');
      t.clips.forEach((cl, j) => { const live = playing && state.armed && visual?.roots?.[ti] === j, rows = t.cells.map((u, r) => u === j ? r + 1 : 0).filter(Boolean), b = btn(strip, String(j + 1), () => selectClip(ti, j), 'ctab' + (j === state.selectedClip ? ' on' : '') + (clipEmpty(cl) ? ' empty' : '') + (live ? ' running' : '')); b.style.setProperty('--track', t.color);
        b.title = tx('Clip {0}: {1} · {2} maten · {3} noten', j + 1, cl.name, cl.bars, cl.notes.length) + (rows.length ? ' · ' + tx('in scène {0}', rows.join(', ')) : '') + (clipEmpty(cl) ? '' : ' · ' + tx('Sleep naar een scène in de matrix om hem daar te hergebruiken'));
        if (!clipEmpty(cl)) { b.draggable = true; b.ondragstart = e => { dragSrc = { ti, lib: j }; dragScene = null; viewRefs.slots.forEach(r => { if (canDrop(dragSrc, r.ti, r.ci)) r.el.classList.add('droptarget'); }); e.dataTransfer.effectAllowed = 'copyMove'; e.dataTransfer.setData('text/plain', 'clip ' + (ti + 1) + '/' + (j + 1)); }; b.ondragend = () => { dragSrc = null; root?.querySelectorAll('.slot.dropok,.slot.droptarget').forEach(x => x.classList.remove('dropok', 'droptarget')); }; }
        el('span', b, clipEmpty(cl) ? tx('leeg') : `${cl.name} · ${cl.bars}m`, 'badge'); });
      el('span', strip, undefined, 'sep');
      btn(strip, '‹', () => stepClip(-1), 'mini').title = tx('Vorige clip'); btn(strip, '›', () => stepClip(1), 'mini').title = tx('Volgende clip');
      const full = libFree(ti) < 0, noCopy = full;
      const nb = btn(strip, tx('Nieuwe clip'), newClip, 'mini'); nb.disabled = full; nb.title = full ? tx('De bibliotheek van dit spoor is vol (48 clips)') : tx('Nieuwe clip in de bibliotheek; staat de gekozen scène nog leeg, dan komt hij daarin');
      const db = btn(strip, tx('Dupliceer'), copyToEmpty, 'mini'); db.disabled = noCopy; db.title = noCopy ? tx('De bibliotheek van dit spoor is vol (48 clips)') : tx('Kopie van de gekozen clip, in de eerstvolgende lege scène');
      btn(strip, tx('Verwijder clip'), deleteClip, 'mini').title = tx('Gooit de clip weg, ook uit alle scènes waar hij in staat (Ongedaan maken kan)');
    }
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
    // pads (MPK mini e.d.): een noot in het padbereik kiest een spoor of start een scène en klinkt niet
    // drumrijen volgen het apparaat achter een drumspoor (contract v1.14, noteNames): rij j krijgt naam en nootnummer van de j-de klank en lane chj+1 (een eigen lane-naam blijft staan).
    // De hele lijst klanken staat onder elkaar (hoogstens 64 rijen); de opgeslagen rijen veranderen niet. Zonder kabel of zonder namen gelden ze zoals ze zijn.
    let trackNames = [], namesSig = '';
    function readTargets(list) {
      const all = [];
      try {
        const ps = Array.isArray(list) ? list : (typeof host.peers === 'function' ? host.peers(self) : []);
        for (let i = 0; i < state.tracks.length; i++) {
          let names = null; const cs = typeof host.cablesFrom === 'function' ? host.cablesFrom(self, 'track' + (i + 1)) : [];
          for (const k of cs) { const p = k && ps.find(x => x && x.id === k.to); if (p && Array.isArray(p.noteNames) && p.noteNames.length) { names = p.noteNames; break; } }
          all.push(names);
        }
      } catch (e) { all.length = 0; }
      const sig = JSON.stringify(all); if (sig === namesSig) return; namesSig = sig; trackNames = all; renderWanted = true;
      // een noot in een clip blijft bij zijn klank: wijzigt kit of volgorde, dan schuift de noot mee naar de rij van dat nootnummer (een onbekend nootnummer houdt zijn rij)
      state.tracks.forEach((t, i) => { const nm = all[i]; if (t.type !== 'drums' || !nm) return; for (const c of t.clips) for (const n of c.notes) { const j = nm.findIndex(x => Math.round(x.note) === n.note); if (j >= 0 && j < 64) n.row = j; } });
    }
    function rowsOf(t) {
      const nm = trackNames[state.tracks.indexOf(t)]; if (!nm || !nm.length) return t.rows;
      return nm.slice(0, 64).map((x, j) => { const r = t.rows[j] || t.rows[t.rows.length - 1]; return { name: String(x.name).slice(0, 24), note: integer(x.note, 0, 127, r.note), lane: /^ch\d+$/.test(r.lane) ? 'ch' + (j + 1) : r.lane }; });
    }
    function padNote(n) {
      const p = state.pads;
      if (p.track.on && n >= p.track.base && n < p.track.base + state.tracks.length) { const i = n - p.track.base; if (i !== state.selectedTrack) { setSelectedTrack(i); state.selectedNote = -1; renderWanted = true; } return true; }
      if (p.scene.on && n >= p.scene.base && n < p.scene.base + state.scenes.length) { launchScene(n - p.scene.base); return true; }
      return false;
    }
    function setSelectedTrack(i) { if (i !== state.selectedTrack) releaseLive(); state.selectedTrack = i; }
    // Opname: de positie van een ingespeelde noot wordt het dichtstbijzijnde GESWINGDE rasterpunt. Rasterpunt (stap a, deel f): tijd = tijd van stap a + f × stepDur,
    // en op een oneven stap erbij (hostswing + clip-/spoor-/rijswing) × stepDur. Zo springt een noot niet naar een buurstap omdat de oneven zestienden later liggen.
    function recordPos(time, row, gOv) {
      const ti = state.selectedTrack, t = currentTrack(), c = currentClip(), L = c.bars * 16, g = gOv || (state.quantize ? 16 / c.grid : .25), li = lastInfo;
      if (!li || origin === null || !Number.isFinite(time) || !(li.dur > 0)) return null;
      if (soloRun && (soloRun.origin === null || soloRun.ti !== ti || soloRun.ci !== state.selectedClip)) return null;
      if (Math.abs(time - li.time) > Math.max(1, li.dur * 16)) return null; // te ver van de laatst geplande stap: niet gokken
      const ls = localSwing(c, t, row), hs = li.hs, T0 = a => li.time - ((li.abs & 1) ? hs * li.dur : 0) + (a - li.abs) * li.dur;
      const a0 = Math.floor(li.abs + (time - li.time) / li.dur); let best = null;
      for (let a = a0 - 1; a <= a0 + 1; a++) for (let k = 0; k * g < 1 - 1e-9; k++) { const f = k * g, tm = T0(a) + f * li.dur + ((a & 1) ? (hs + ls) * li.dur : 0), d = Math.abs(tm - time); if (!best || d < best.d - 1e-12) best = { a, f, d }; }
      if (!best || best.d > li.dur) return null;
      let base; if (soloRun) base = best.a - soloRun.origin; else if (state.mode === 'song') base = locate((best.a - origin) + seek)?.local ?? 0; else base = (best.a - origin) - (trackOrigins[ti] || 0);
      return { c, g, step: ((((base + best.f) % L) + L) % L) };
    }
    // schrijft één ingespeelde gebeurtenis in de geselecteerde clip; geeft de noot terug, of null als er niets geschreven is (opname uit, klok stil, onzin)
    function recordInto(t, rowIdx, rowObj, noteNum, vel, time, lenOf) {
      if (!state.record || !playing || !state.armed || !Number.isFinite(vel)) return null;
      const p = recordPos(time, rowObj); if (!p) return null; const c = p.c, step = quant(p.step, 0, c.bars * 16 - .25, 0), drums = t.type === 'drums'; remember();
      if (state.recordMode === 'replace' && (!recRun || recRun.clip !== c)) { c.notes = []; state.selectedNote = -1; } // Overschrijven: de clip wordt één keer gewist, bij de eerste noot van de opnamerun
      recRun = { clip: c };
      c.notes = c.notes.filter(x => !(Math.abs(x.step - step) < 1e-6 && (drums ? x.row === rowIdx : x.note === noteNum))); // dezelfde plek en rij: de nieuwe vervangt de oude
      let z = null; if (c.notes.length < MAXNOTES) { z = note(nextId(c), step, noteNum, quant(Math.max(p.g, lenOf(p.g)), .25, 1024, p.g), Math.max(.01, vel), rowIdx); c.notes.push(z); }
      renderWanted = true; return z ? { z, c, g: p.g } : null;
    }
    function onNoteIn(ev, time) {
      const t = currentTrack(), ti = state.selectedTrack; pruneLive();
      const n = integer(ev.note, 0, 127, 60), v = lim(ev.vel, 0, 1, .8), held = ev.held === true || (ev.type === 'noteon' && !(ev.dur > 0)), dur = held ? 120 : lim(ev.dur, .01, 600, .25);
      if (t.type === 'drums') {
        const row = rowsOf(t).findIndex(r => r.note === n);
        if (row >= 0) drumHit(ti, t, rowsOf(t)[row], v, time, held ? .1 : dur);
      } else {
        const out = integer(n + t.transpose, 0, 127, 60), vel = v * t.velocity;
        const prev = live.get(n); if (prev && prev.held) { live.delete(n); emit(prev.ti, { type: 'noteoff', note: prev.out, vel: 0, time }); finishRecorded(prev, time); } // dezelfde toets opnieuw terwijl hij nog vastgehouden wordt: eerst afsluiten
        if (vel > 0) { emit(ti, { type: 'note', note: out, vel, time, dur, ...(held ? { held: true } : {}) }); live.set(n, { ti, out, held, until: time + dur, rec: null, rec0: null }); }
      }
      if (t.type !== 'drums' || rowsOf(t).some(r => r.note === n)) {
        const rowIdx = t.type === 'drums' ? rowsOf(t).findIndex(r => r.note === n) : 0, rowObj = t.type === 'drums' ? rowsOf(t)[rowIdx] : null;
        const r = recordInto(t, rowIdx, rowObj, n, v, time, g => held ? g : Math.round(dur / lastDur / g) * g);
        if (r && held) { const e = live.get(n); if (e) { e.rec = { clip: r.c, id: r.z.id }; e.rec0 = { time, g: r.g }; } }
      }
    }
    // ---- klembord (contract v1.17) ----
    // Formaat `patchkamer-clip` (formatVersion 1): tijd in tikken, 12 per zestiende, dus 192 per maat. Het tracktype bepaalt de soort: toetsen en drone zijn
    // `notes`, drums is `drums` met de rijen van het spoor als banen (rowsOf: ook de klanken van een aangesloten apparaat). Plakken vervangt de noten van de
    // gekozen clip en zet lengte (hele maten), raster en clipswing. Naam, CC-lanes en de rest van de compositie blijven staan; het spoortype verandert nooit.
    const CLIP_ID = 'nl.patchkamer.cliparranger', MAXTICKS = 64 * 192, ROW_TYPES = ['kick', 'snare', 'clap', 'closedhat', 'openhat', 'lowtom', 'midtom', 'hitom', 'rim', 'crash', 'ride', 'shaker', 'tamb', 'conga', 'bongo', ''];
    const clipKind = t => (t.type === 'drums' ? 'drums' : 'notes'), isNum = x => typeof x === 'number' && Number.isFinite(x);
    // true als de rijen nog de standaardrijen zijn (algemene MIDI-nummers), anders volgen ze een apparaat of de eigen keuze
    const defaultRows = t => { const d = drumRows(); return !fromDevice(t) && t.rows.length === d.length && t.rows.every((r, j) => r.name === d[j].name && r.note === d[j].note); };
    function laneList(t) { const gm = defaultRows(t); return rowsOf(t).map((r, j) => ({ id: 'r' + j, name: String(r.name).slice(0, 40), type: gm ? ROW_TYPES[j] || '' : '', note: r.note })); }
    // de gebeurtenissen van een clip in tikken; een rij die niet meer bestaat of een noot buiten de clip telt niet mee (klinkt ook niet)
    function eventsOf(t, c) {
      const drums = t.type === 'drums', L = c.bars * 192, rows = drums ? rowsOf(t) : null, out = [];
      for (const n of c.notes) {
        const tk = Math.round(n.step * 12); if (tk < 0 || tk >= L) continue;
        if (drums) { if (!rows[n.row]) continue; out.push({ t: tk, row: n.row, vel: n.vel, prob: n.prob, ratchet: n.ratchet }); }
        else out.push({ t: tk, note: n.note, len: Math.max(1, Math.min(L - tk, Math.round(n.len * 12))), vel: n.vel, prob: n.prob, ratchet: n.ratchet }); // een noot over het einde wordt in de clip bij het einde afgekapt
      }
      return out;
    }
    const printOf = (evs, length) => JSON.stringify([length, evs.map(e => [e.t, e.note ?? e.row, e.len ?? 0, Math.round(e.vel * 1e6), Math.round(e.prob * 1e6), e.ratchet]).sort((a, b) => a[0] - b[0] || a[1] - b[1] || a[3] - b[3] || a[2] - b[2] || a[4] - b[4] || a[5] - b[5])]);
    // wat een spoor met clip c nu kan ontvangen en geven
    const clipTrackInfo = (t, c) => { const drums = clipKind(t) === 'drums', info = { length: { min: 192, max: MAXTICKS, step: 192, current: c.bars * 192, shared: false }, grid: [16, 32, 64], poly: 128, range: [0, 127], scheme: drums && !defaultRows(t) ? 'device' : 'gm', vel: 'continuous', prob: true, ratchet: true, maxEvents: MAXNOTES }; if (drums) info.lanes = laneList(t); return info; };
    function clipInfo() {
      try {
        if (dead || !state.tracks.length) return null;
        const t = currentTrack(), c = currentClip(), kind = clipKind(t);
        // multi = de scène: de gekozen clip (kolom) van alle sporen
        return { name: (trackName(state.selectedTrack) + ' · ' + c.name).slice(0, 40), copy: [kind, 'multi'], paste: [kind, 'multi'], ...clipTrackInfo(t, c),
          tracks: state.tracks.map((tt, i) => ({ id: 't' + (i + 1), name: trackName(i).slice(0, 40), kind: clipKind(tt), role: tt.type, ...clipTrackInfo(tt, tt.clips[state.selectedClip]) })) };
      } catch (e) { return null; }
    }
    function clipOne(t, c) {
      const kind = clipKind(t), drums = kind === 'drums', evs = eventsOf(t, c);
      const clip = { format: 'patchkamer-clip', formatVersion: 1, kind, name: String(c.name).slice(0, 40), length: c.bars * 192, grid: c.grid, source: { device: CLIP_ID, name: 'Clip Arranger', version: '1.25.0', trackType: t.type, scheme: drums && !defaultRows(t) ? 'device' : 'gm' } };
      if (c.swing > 0) clip.swing = c.swing;
      const extra = (o, e) => { if (e.prob !== 1) o.prob = e.prob; if (e.ratchet !== 1) o.ratchet = e.ratchet; return o; };
      if (drums) { clip.lanes = laneList(t); clip.hits = evs.map(e => extra({ t: e.t, lane: e.row, vel: e.vel }, e)); }
      else clip.notes = evs.map(e => extra({ t: e.t, n: e.note, len: e.len, vel: e.vel }, e));
      clip.native = { device: CLIP_ID, data: { bars: c.bars, grid: c.grid, swing: c.swing, notes: c.notes, cc: c.cc, auto: c.auto } };
      return clip;
    }
    function getClip(o) {
      try {
        if (dead || !state.tracks.length) return null;
        if (o && o.kind === 'multi') {
          const row = Math.min(selRow, state.scenes.length - 1), tracks = state.tracks.map((t, i) => ({ slot: i, name: trackName(i).slice(0, 40), kind: clipKind(t), role: t.type, clip: clipOne(t, t.clips[cellOf(i, row) >= 0 ? cellOf(i, row) : 0]) }));
          return clone({ format: 'patchkamer-clip', formatVersion: 1, kind: 'multi', name: sceneName(row).slice(0, 40), length: Math.max(...tracks.map(t => t.clip.length)), grid: 16, source: { device: CLIP_ID, name: 'Clip Arranger', version: '1.25.0', scheme: 'gm' }, tracks });
        }
        return clone(clipOne(currentTrack(), currentClip()));
      } catch (e) { return null; }
    }
    // welke rij van dit spoor bedoelt een baan van de clip? Eerst onze eigen id en nootnummer samen, dan (alleen bij gelijke GM-nummers) het nootnummer, dan de naam
    function laneToRow(l, rows, gm) {
      if (!l || typeof l !== 'object') return -1;
      const m = typeof l.id === 'string' ? /^r(\d+)$/.exec(l.id) : null;
      if (m && +m[1] < rows.length && isNum(l.note) && rows[+m[1]].note === Math.round(l.note)) return +m[1];
      if (gm && isNum(l.note)) { const j = rows.findIndex(r => r.note === Math.round(l.note)); if (j >= 0) return j; }
      if (typeof l.name === 'string' && l.name) { const nm = l.name.trim().toLowerCase(), j = rows.findIndex(r => String(r.name).trim().toLowerCase() === nm); if (j >= 0) return j; }
      return -1;
    }
    // de nieuwe clip (op plaats ci van spoor t) uit een geldige clip van de juiste soort: { next, dropped } of { err }
    function clipBuild(t, ci, cur, clip) {
      const bad = { err: tx('Geen geldige clip.') }, kind = clipKind(t), drums = kind === 'drums';
      if (!clip || typeof clip !== 'object' || Array.isArray(clip) || clip.format !== 'patchkamer-clip' || (clip.formatVersion !== undefined && clip.formatVersion !== 1)) return bad;
      if (clip.kind !== kind) return { err: tx('De soort past niet: dit spoor neemt nu {0}.', tx(drums ? 'drums' : 'noten')) };
      if (!isNum(clip.length)) return bad;
      const length = Math.round(lim(clip.length, 1, MAXTICKS, 192)), bars = integer(Math.ceil(length / 192), 1, 64, 1), evs = [], rows = drums ? rowsOf(t) : null;
      const src = Array.isArray(drums ? clip.hits : clip.notes) ? (drums ? clip.hits : clip.notes) : [], lanes = drums && Array.isArray(clip.lanes) ? clip.lanes.slice(0, 64) : [];
      const gm = drums && defaultRows(t) && clip.source?.scheme === 'gm', map = lanes.map(l => laneToRow(l, rows || [], gm));
      let dropped = Math.max(0, src.length - MAXNOTES);
      for (const x of src.slice(0, MAXNOTES)) {
        if (!x || typeof x !== 'object' || !isNum(x.t) || x.t < 0 || x.t >= bars * 192) { dropped++; continue; }
        const e = { t: Math.round(x.t), vel: lim(x.vel, 0.01, 1, 0.8), prob: lim(x.prob, 0, 1, 1), ratchet: integer(x.ratchet, 1, 4, 1) };
        if (drums) { if (!Number.isInteger(x.lane) || x.lane < 0 || x.lane >= map.length || map[x.lane] < 0) { dropped++; continue; } e.row = map[x.lane]; }
        else { if (!isNum(x.n)) { dropped++; continue; } e.note = integer(x.n, 0, 127, 60); e.len = Math.round(lim(x.len, 3, 12288, 12)); }
        evs.push(e);
      }
      let next = null;
      // een clip uit dit apparaat die niet is aangepast: de eigen noten, CC-lanes, raster en swing komen exact terug
      const nd = clip.native && typeof clip.native === 'object' && clip.native.device === CLIP_ID ? clip.native.data : null;
      if (nd && typeof nd === 'object') {
        const tmp = cleanClip({ name: cur.name, bars: nd.bars, grid: nd.grid, swing: nd.swing, notes: nd.notes, cc: nd.cc, auto: nd.auto }, ci);
        if (printOf(eventsOf(t, tmp), tmp.bars * 192) === printOf(evs, bars * 192)) next = tmp;
      }
      if (!next) {
        const notes = evs.map((e, j) => ({ id: j, step: e.t / 12, note: drums ? rows[e.row].note : e.note, len: drums ? 1 : e.len / 12, vel: e.vel, prob: e.prob, ratchet: e.ratchet, row: drums ? e.row : 0 }));
        next = cleanClip({ name: cur.name, bars, grid: GRIDS.includes(clip.grid) ? clip.grid : cur.grid, swing: clip.swing, notes, cc: cur.cc, auto: cur.auto }, ci);
      }
      return { next, dropped };
    }
    function setClip(clip) {
      try {
        if (dead) return { ok: false, reason: tx('Het apparaat is verwijderd.') };
        const ci = state.selectedClip, done = d => ({ ok: true, ...(d ? { dropped: d } : {}) });
        if (clip && typeof clip === 'object' && !Array.isArray(clip) && clip.format === 'patchkamer-clip' && (clip.formatVersion === undefined || clip.formatVersion === 1) && clip.kind === 'multi') {
          // de scène: per spoor de clip op plaats ci; één Ongedaan-stap; sporen van een andere soort of zonder clip blijven staan
          const entries = new Map();
          for (const x of (Array.isArray(clip.tracks) ? clip.tracks.slice(0, 64) : [])) if (x && typeof x === 'object' && Number.isInteger(x.slot) && x.slot >= 0 && x.slot < state.tracks.length && x.clip && typeof x.clip === 'object') entries.set(x.slot, x.clip);
          if (!entries.size) return { ok: false, reason: tx('Geen geldige clip.') };
          const plan = []; let dropped = 0, used = 0;
          const row = Math.min(selRow, state.scenes.length - 1);
          entries.forEach((tc, slot) => { const t = state.tracks[slot], v = cellOf(slot, row), cj = v >= 0 ? v : libFree(slot); if (cj < 0) return; const cur = v >= 0 ? t.clips[v] : blankClip(cj); const r = clipBuild(t, cj, cur, tc); if (r.err) { dropped++; return; } used++; dropped += r.dropped; plan.push([t, r.next, cur, cj, v < 0]); });
          if (!used) return { ok: false, reason: tx('Geen enkel spoor van de clip past op een spoor van deze scène.') };
          const changed = plan.filter(([, next, cur]) => JSON.stringify(next) !== JSON.stringify(cur));
          if (!changed.length) return done(dropped);
          scope = 'matrix'; remember(); changed.forEach(([t, next, , cj, isNew]) => { t.clips[cj] = next; if (isNew) t.cells[row] = cj; }); state.selectedNote = -1; render();
          return done(dropped);
        }
        const t = currentTrack(), cur = currentClip(), r = clipBuild(t, ci, cur, clip);
        if (r.err) return { ok: false, reason: r.err };
        if (JSON.stringify(r.next) === JSON.stringify(cur)) return done(r.dropped);
        scope = 'clip'; remember(); t.clips[ci] = r.next; state.selectedNote = -1; render();
        return done(r.dropped);
      } catch (e) { return { ok: false, reason: tx('Geen geldige clip.') }; }
    }
    const instance = {
      inputs: {}, outputs: {}, eventBundles: { tracks: () => bundle() },
      mount(container) { jackBar = document.createElement('div'); jackBar.className = 'pk-jackbar'; jackBar.style.cssText = 'display:flex;align-items:flex-end;gap:6px 14px;padding:6px 10px;flex-wrap:wrap'; container.appendChild(jackBar); portN = 0; const wrap = document.createElement('div'); container.appendChild(wrap); root = wrap.attachShadow({ mode: 'open' }); namesSig = ''; statusEl = document.createElement('span'); statusEl.style.cssText = 'font:11px var(--mono,monospace);color:var(--muted);white-space:nowrap'; statusEl.setAttribute('role', 'status'); statusEl.textContent = tx('Host transport staat stil.'); document.addEventListener('pointerdown', docDown, true); document.addEventListener('keydown', docKey, true); refreshTargets(); render(); buildJacks(); if (stopFrame) stopFrame(); stopFrame = frameLoop(host, self, animate, 30); },
      unmount() { if (stopFrame) { stopFrame(); stopFrame = null; } document.removeEventListener('pointerdown', docDown, true); document.removeEventListener('keydown', docKey, true); closeMenu(); statusEl = null; root = null; viewRefs = {}; if (jackBar) { jackBar.remove(); jackBar = null; } },
      onPeers(list) { if (!dead) refreshTargets(list); },
      playClip() { playClip(); }, stopClip() { stopClip(); },
      // klembord (contract v1.17): de gekozen clip van het gekozen spoor kopiëren en plakken
      clipInfo() { return clipInfo(); }, getClip(o) { return getClip(o); }, setClip(clip) { return setClip(clip); },
      onStep(info) { try { schedule(info); } catch (e) { error = tx('Sequencer: {0}', e?.message || e); } },
      onTransport(info) { if (dead) return; if (ownRun) { clearTimeout(ownRun.timer); ownRun = null; } const cue = seek; playing = !!info?.playing; recRun = null; autoRun = null; reset(); if (playing) seek = cue; syncAuto(); },
      onEvent(port, ev) {
        try {
          if (dead || port !== 'input' || !ev || typeof ev !== 'object') return; const type = ev.type, time = timeOf(ev), t = currentTrack();
          if (type === 'noteoff' || (type === 'noteon' && ev.vel === 0)) { const n = integer(ev.note, 0, 127, 60), e = live.get(n); if (e) { live.delete(n); emit(e.ti, { type: 'noteoff', note: e.out, vel: 0, time }); finishRecorded(e, time); } return; }
          if (type === 'allnotesoff' || type === 'panic') { releaseLive(); return; }
          if ((type === 'note' || type === 'noteon') && Number.isFinite(ev.note) && ev.vel > 0) { if (!padNote(integer(ev.note, 0, 127, 60))) onNoteIn(ev, time); }
          else if (type === 'trig') {
            const row = rowsOf(t).findIndex(r => r.lane === ev.lane || r.name === ev.lane), v = lim(ev.vel, 0, 1, .8);
            if (t.type === 'drums' && row >= 0) {
              drumHit(state.selectedTrack, t, rowsOf(t)[row], v, time, .1);
              recordInto(t, row, rowsOf(t)[row], rowsOf(t)[row].note, v, time, g => g);
            }
          } else if (type === 'cc' && typeof ev.id === 'string' && Number.isFinite(ev.value)) emit(state.selectedTrack, { type: 'cc', id: ev.id.slice(0, 48), value: lim(ev.value, 0, 1), time });
        } catch (e) { error = tx('Invoer: {0}', e?.message || e); }
      },
      // contract v1.6: preset = compositie; de werkstand (selecties, zoom, tekeninstellingen, opname) blijft staan
      getPreset() { const p = exported(); PRESET_SKIP.forEach(k => delete p[k]); return p; },
      setPreset(p) { if (dead) return; const keep = {}; PRESET_SKIP.forEach(k => keep[k] = state[k]); self.setState({ ...(p && typeof p === 'object' ? p : {}), ...keep }); },
      getState() { return exported(); },
      setState(s) { if (dead) return; ownStop(true); releaseLive(); soloRun = null; recRun = null; autoRun = null; state = sanitize(s && typeof s === 'object' ? s : {}); history = []; future = []; redoStacks = { song: [], matrix: [], clip: [] }; namesSig = ''; refreshTargets(); reset(); render(); },
      destroy() { if (dead) return; if (ownRun) clearTimeout(ownRun.timer); ownRun = null; releaseLive(); soloRun = null; recRun = null; autoRun = null; dead = true; playing = false; autoRelease(); self.unmount(); pending = []; queueClips.clear(); live.clear(); history = []; future = []; clipboard = null; }
    };
    self = instance;
    // ---- UI ----
    function el(tag, parent, label, cls) { const n = document.createElement(tag); if (label !== undefined) n.textContent = label; if (cls) n.className = cls; if (parent) parent.appendChild(n); return n; }
    function btn(parent, label, fn, cls = '') { const b = el('button', parent, label, cls); b.type = 'button'; b.onclick = fn; return b; }
    function input(parent, label, value, fn, type = 'text', min, max, step) { const l = el('label', parent, label), n = el('input', l); n.type = type; n.value = String(value); n.setAttribute('aria-label', label); if (min !== undefined) n.min = min; if (max !== undefined) n.max = max; if (step !== undefined) n.step = step; n.onchange = () => fn(type === 'number' ? +n.value : n.value); return n; }
    function sel(parent, label, options, value, fn) { const l = el('label', parent, label), s = el('select', l); s.setAttribute('aria-label', label); for (const [v, txt] of options) { const o = el('option', s, txt); o.value = String(v); } s.value = String(value); s.onchange = () => fn(s.value); return s; }
    function range(parent, label, value, min, max, step, fn, fmt = v => v.toFixed(2), def) { const l = el('label', parent, label), o = el('output', l, fmt(value)), r = el('input', l); r.type = 'range'; r.min = min; r.max = max; r.step = step; r.value = value; if (def !== undefined) r.dataset.pkDefault = String(def); r.setAttribute('aria-label', label); r.oninput = () => o.textContent = fmt(+r.value); r.onchange = () => fn(+r.value); return r; }
    function check(parent, label, value, fn) { const l = el('label', parent, undefined, 'check'), n = el('input', l); n.type = 'checkbox'; n.checked = value; n.onchange = () => fn(n.checked); el('span', l, label); return n; }
    function selectClip(ti, ci) { setSelectedTrack(ti); state.selectedClip = ci; { const r = rowOfClip(ti, ci); if (r >= 0) selRow = r; } state.selectedNote = -1; state.editPage = 0; render(); }
    const pct = v => Math.round(v * 100) + '%';
    // poortenrij (ui.jacks): ingang links, spooruitgangen 1…n met alleen het nummer, rechts altijd de multi-MIDI-poort
    let jackBar = null, portN = 0;
    function buildJacks() {
      if (!jackBar) return; jackBar.replaceChildren();
      const group = (cls) => { const d = document.createElement('div'); d.className = cls; jackBar.appendChild(d); return d; };
      try {
        const left = group('pk-jin'); host.ui.jack(self, left, 'input', 'in', tx('MIDI')).title = tx('MIDI / opname');
        const mid = group('pk-jtr'); mid.style.cssText = 'display:flex;gap:6px;flex-wrap:wrap'; state.tracks.forEach((t, i) => { const j = host.ui.jack(self, mid, 'track' + (i + 1), 'out', String(i + 1)); j.title = `${i + 1} · ${trackName(i)}` + (t.target ? ' → ' + t.target : ''); });
        const st = group('pk-jst'); st.style.cssText = 'margin-left:auto;align-self:center;padding-bottom:2px'; if (statusEl) st.appendChild(statusEl); const right = group('pk-jmu'); host.ui.jack(self, right, 'tracks', 'out', tx('Sporen')).title = tx('Sporen: alle sporen met hun namen in één kabel');
      } catch (e) { error = tx('Poorten: {0}', e?.message || e); }
    }
    function syncPorts() {
      const n = state.tracks.length; if (n === portN) return;
      try { host.setPorts(self, { ...PORTS, eventOut: PORTS.eventOut.slice(0, n) }); portN = n; } catch (e) { return; }   // de host kent ons nog niet: mount probeert het opnieuw
      buildJacks();
    }
    let lastView = '';
    // een andere clip of een ander spoor: het klavier en de octaaf-keuze staan meteen bij de noten (de laagste octaaf van de clip; zit de eerste noot daarbuiten, dan de octaaf van de eerste noot)
    function focusNotes() { const t = currentTrack(), c = currentClip(); if (!t || !c || t.type === 'drums' || !c.notes.length) return; const first = c.notes.reduce((a, n) => (n.step < a.step || (n.step === a.step && n.note < a.note)) ? n : a), lo = Math.min(...c.notes.map(n => n.note));
      let base = Math.min(96, Math.floor(lo / 12) * 12); if (first.note < base || first.note > base + 23) base = Math.min(96, Math.floor(first.note / 12) * 12); state.pianoBase = base; }
    function render() {
      const view = state.selectedTrack + ':' + state.selectedClip; if (view !== lastView) { lastView = view; focusNotes(); }
      syncPorts(); syncBundle(); syncAuto(); if (!root) return; const keepScroll = viewRefs?.wrap?.isConnected ? [viewRefs.wrap.scrollTop, viewRefs.wrap.scrollLeft] : null; root.replaceChildren(); viewRefs = { slots: [], scenes: [], song: [], playline: null, status: statusEl, pencils: [], scpencils: [] }; const style = el('style', root); style.textContent = CSS; const app = el('div', root, undefined, 'rg'); app.tabIndex = 0; for (const ev of ['pointerdown', 'mousedown', 'keydown', 'change', 'input', 'contextmenu', 'dragstart']) app.addEventListener(ev, e => { const p = e.composedPath ? e.composedPath() : [], t = p[0]; if (menuEl && p.includes(menuEl)) return; scope = t?.closest?.('.songbar') ? 'song' : t?.closest?.('[data-scope="clip"]') ? 'clip' : 'matrix'; }, true); app.setAttribute('aria-label', tx('Clip Arranger sequencer'));
      app.onkeydown = e => { if (['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target?.tagName)) return; if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? scopedRedo(scope) : scopedUndo(scope); } else if (e.key === 'Delete' || e.key === 'Backspace') { if (selected()) { e.preventDefault(); change(() => { currentClip().notes = currentClip().notes.filter(n => n.id !== state.selectedNote); state.selectedNote = -1; }); } } };
      const tools = el('div', app, undefined, 'toolbar'); input(tools, tx('PROJECT'), state.title || tx('Nieuw project'), v => change(() => state.title = v.slice(0, 64))); btn(tools, tx('Nieuw project'), newProject, 'mini').title = tx('Begint een nieuw, leeg project: één lege scène, één lege sectie, lege clips en geen titel. De sporen blijven, de koppelingen niet. Ongedaan maken kan.');
      sel(tools, tx('TRACKS'), Array.from({ length: 16 }, (_, i) => [i + 1, String(i + 1)]), state.tracks.length, v => setTrackCount(+v)); sel(tools, tx('AFSPELEN'), [['session', tx('Clips / scènes')], ['song', tx('Song arrangement')]], state.mode, v => change(() => { state.mode = v; soloRun = null; reset(); }));
      btn(tools, state.armed ? tx('Sequencer aan') : tx('Sequencer uit'), () => change(() => { state.armed = !state.armed; reset(); }), state.armed ? 'active' : ''); btn(tools, tx('Vanaf begin'), () => { reset(); render(); }); check(tools, tx('Song herhalen'), state.songLoop, v => change(() => state.songLoop = v)); btn(tools, tx('Undo'), undo).disabled = !history.length; btn(tools, tx('Redo'), redo).disabled = !future.length;
      const padRow = el('div', app, undefined, 'row'), np = n => `${n} (${PAD_NOTES[n % 12]}${Math.floor(n / 12) - 1})`, noteOpts = Array.from({ length: 116 }, (_, i) => [i + 12, np(i + 12)]);
      check(padRow, tx('Pads kiezen spoor'), state.pads.track.on, v => change(() => { state.pads.track.on = v; })); sel(padRow, tx('vanaf noot'), noteOpts, state.pads.track.base, v => change(() => { state.pads.track.base = +v; }));
      check(padRow, tx('Pads starten scène'), state.pads.scene.on, v => change(() => { state.pads.scene.on = v; })); sel(padRow, tx('vanaf noot'), noteOpts, state.pads.scene.base, v => change(() => { state.pads.scene.base = +v; }));
      el('span', padRow, tx('Gekozen spoor: {0} · {1}', state.selectedTrack + 1, trackName(state.selectedTrack) + (currentTrack().target ? ' → ' + currentTrack().target : '')), 'small');
      renderSession(app); if (keepScroll && viewRefs.wrap) { viewRefs.wrap.scrollTop = keepScroll[0]; viewRefs.wrap.scrollLeft = keepScroll[1]; } renderEditor(app); if (panelTrack !== null && panelTrack < state.tracks.length) openPanel(panelTrack); else panelTrack = null; if (panelScene !== null && panelScene < state.scenes.length) openScenePanel(panelScene); else panelScene = null;
    }
    function renderSession(app) {
      const sec = el('section', app, undefined, 'section'); el('h2', sec, tx('01 · SONG EN CLIPMATRIX')); renderSongBar(sec);
      const mbar = el('div', sec, undefined, 'matrixbar'); viewRefs.matrixStatus = el('span', mbar, '', 'mstatus'); undoBtns(mbar, 'matrix');
      el('span', mbar, undefined, 'sep');
      btn(mbar, tx('+ Scène'), () => addScene(state.scenes.length - 1), 'mini').disabled = state.scenes.length >= MAXSCENES; const spare = spareScenes(); const pr = btn(mbar, tx('Verwijder lege scènes'), pruneScenes, 'mini'); pr.disabled = !spare.length || state.scenes.length <= 1; pr.title = tx('Verwijdert lege scènes die in geen enkele song voorkomen ({0})', spare.length); el('span', mbar, tx('{0} / {1} scènes', state.scenes.length, MAXSCENES), 'small');
      const scroll = el('div', sec, undefined, 'scroll matrixwrap'); viewRefs.wrap = scroll; const grid = el('div', scroll, undefined, 'session'); grid.style.gridTemplateColumns = `190px repeat(${state.tracks.length},minmax(138px,1fr))`; grid.style.minWidth = (190 + state.tracks.length * 143) + 'px'; el('div', grid, tx('SCÈNE'), 'small');
      state.tracks.forEach((t, i) => { const th = el('div', grid, undefined, 'th'); th.style.setProperty('--track', t.color);
        const nameBtn = btn(th, `${i + 1} · ${trackName(i)}`, () => { setSelectedTrack(i); state.selectedNote = -1; state.editPage = 0; inlineEdit(nameBtn, trackName(i), 24, tx('Naam van spoor {0} wijzigen', i + 1), v => { const nm = v.trim(); t.name = nm === trackDefault(i) ? '' : nm.slice(0, 24); }); }, 'name'); nameBtn.title = tx('Klik om de naam van spoor {0} te wijzigen', i + 1);
        const tgt = btn(th, t.target || tx('Patch → track') + (i + 1), () => { setSelectedTrack(i); inlineEdit(tgt, t.target, 40, tx('DOELAPPARAAT (LABEL)'), v => { t.target = v.slice(0, 40); }); }, 'badge tgt'); tgt.title = tx('Klik om het label (doelapparaat) van dit spoor te wijzigen');
        const row = el('div', th, undefined, 'row'); const ty = el('select', row, undefined, 'tytype'); ty.setAttribute('aria-label', tx('TRACKTYPE')); ty.title = tx('TRACKTYPE'); [['notes', tx('Toetsen / melodie')], ['drums', tx('Drumcomputer')], ['drone', tx('Drone / pad / ambient')]].forEach(([v, l]) => { const o = el('option', ty, l); o.value = v; }); ty.value = t.type; ty.onchange = () => { setSelectedTrack(i); change(() => { releaseLive(); t.type = ty.value; t.gate = ty.value === 'drone' ? 1 : .9; state.selectedNote = -1; }); };
        btn(row, 'M', () => change(() => t.mute = !t.mute), 'mini' + (t.mute ? ' active' : '')); btn(row, 'S', () => change(() => t.solo = !t.solo), 'mini' + (t.solo ? ' active' : '')); btn(row, '■', () => stopTrack(i), 'mini').title = tx('Track stoppen op volgende maat');
        const pen = btn(row, '✎', () => { if (panelTrack === i) closeMenu(); else { closeMenu(); openPanel(i); } }, 'mini rn'); pen.title = tx('Instellingen van spoor {0}', i + 1); viewRefs.pencils[i] = pen; });
      const use = sceneUsage();
      state.scenes.forEach((scene, ci) => {
        const selSec = state.arrangement[state.selectedSection], inSel = !!selSec && secScenes(selSec).includes(ci), secCol = selSec?.color || SECDEF, sc = el('div', grid, undefined, 'scene' + (inSel ? ' insel' : '') + (use[ci].size ? '' : ' unused')); if (inSel) sc.style.setProperty('--sec', secCol); btn(sc, '▶', () => launchScene(ci)).setAttribute('aria-label', tx('Start scène {0}', ci + 1));
        if (scene.color) { const dot = el('i', sc, undefined, 'scdot'); dot.style.background = scene.color; } const nm = el('span', sc, `${ci + 1} · ${sceneName(ci)}`, 'scname'); nm.title = tx('Klik om de naam van scène {0} te wijzigen', ci + 1); viewRefs.scenes.push(sc);
        sc.title = use[ci].size ? tx('Gebruikt in: {0}', [...use[ci]].map(songName).join(', ')) : tx('Zit in geen enkele song. Sleep de scène naar de songbalk om hem toe te wijzen.');
        const rename = () => { const inp = el('input'); inp.className = 'rename'; inp.value = sceneName(ci); inp.maxLength = 24; inp.setAttribute('aria-label', tx('Naam van scène {0} wijzigen', ci + 1)); sc.draggable = false; nm.replaceWith(inp); inp.focus(); inp.select(); let done = false; const commit = ok => { if (done) return; done = true; if (ok) renameScene(ci, inp.value); else render(); }; inp.onkeydown = e => { e.stopPropagation(); if (e.key === 'Enter') commit(true); else if (e.key === 'Escape') commit(false); }; inp.onblur = () => commit(true); };
        nm.onclick = rename; const ops = el('span', sc, undefined, 'scops');
        { const pen = btn(ops, '✎', () => { if (panelScene === ci) closeMenu(); else { closeMenu(); openScenePanel(ci); } }, 'mini'); pen.title = tx('Kleur van scène {0}', ci + 1); viewRefs.scpencils[ci] = pen; } btn(ops, '+', () => addScene(ci), 'mini').title = tx('Lege scène invoegen na deze'); btn(ops, '2×', () => dupScene(ci), 'mini').title = tx('Scène dupliceren (alle sporen) naar het volgende vak'); btn(ops, '×', () => delScene(ci), 'mini').title = tx('Scène verwijderen; haar clips blijven in de clipbalk (02) staan');
        ops.children[2].disabled = state.scenes.length >= MAXSCENES; ops.children[1].disabled = state.scenes.length >= MAXSCENES; ops.children[3].disabled = state.scenes.length <= 1;
        sc.draggable = true; sc.ondragstart = e => { if (e.target !== sc) return; dragScene = ci; dragSrc = null; sc.classList.add('dragging'); e.dataTransfer.effectAllowed = 'copyMove'; e.dataTransfer.setData('text/plain', 'scene ' + (ci + 1)); };
        sc.ondragend = () => { dragScene = null; root?.querySelectorAll('.dragging,.dropok').forEach(x => x.classList.remove('dragging', 'dropok')); };
        sc.ondragover = e => { if (dragScene === null || dragScene === ci) return; e.preventDefault(); e.dataTransfer.dropEffect = 'move'; sc.classList.add('dropok'); }; sc.ondragleave = () => sc.classList.remove('dropok');
        sc.ondrop = e => { if (dragScene === null || dragScene === ci) return; e.preventDefault(); const k = dragScene; dragScene = null; moveScene(k, ci); };
        state.tracks.forEach((t, ti) => { const rs = resolve(ti, ci), cov = rs.k > 0, c = rs.ci >= 0 ? t.clips[rs.ci] : null, root = ci - rs.k, span = cov ? effSpan(ti, root) : effSpan(ti, ci), uses = c ? t.cells.filter(u => u === rs.ci).length : 0, slot = el('div', grid, undefined, 'slot' + (state.selectedTrack === ti && selRow === ci ? ' selected' : '') + (inSel && ti === state.tracks.length - 1 ? ' insel-r' : '') + (cov ? ' covered' : span > 1 ? ' stretched' : '') + (!c ? ' nocell' : '')); slot.style.setProperty('--track', t.color); if (inSel) slot.style.setProperty('--sec', secCol); if (c && c.bars > 1 && !cov) { slot.style.setProperty('--bars', c.bars); el('i', slot, undefined, 'ticks'); } btn(slot, '▶', () => launchClip(ti, ci), 'launch').setAttribute('aria-label', tx('Start track {0} scène {1}', ti + 1, ci + 1));
          const body = btn(slot, !c ? tx('kies clip ▾') : cov ? '↳ ' + c.name : c.name + (uses > 1 ? ' ↻' : ''), () => { if (c) selectCell(ti, root); }, 'body'); body.title = !c ? tx('Kies welke clip deze scène op dit spoor speelt') : cov ? tx('Deel {0} van {1} van de uitgerekte clip {2}', rs.k + 1, span, c.name) : tx('{0} maten · {1} noten · {2} CC-lanes', c.bars, c.notes.length, c.cc.length) + (uses > 1 ? ' · ' + tx('hergebruikt in {0} scènes', uses) : '');
          if (!cov) { const usedHere = usedLib(ti), pick = el('select', slot, undefined, 'cellsel'); pick.setAttribute('aria-label', tx('Clip van scène {0}, spoor {1}', ci + 1, ti + 1)); pick.title = tx('Kies welke clip deze scène op dit spoor speelt (dezelfde clip mag in meer scènes)');
            const o0 = el('option', pick, tx('— geen clip —')); o0.value = '-1'; t.clips.forEach((cl, j) => { if (hasContent(cl) || usedHere.has(j) || j === rs.ci) { const o = el('option', pick, `${j + 1} · ${cl.name}${hasContent(cl) ? '' : ' (' + tx('leeg') + ')'}`); o.value = String(j); } }); const on = el('option', pick, tx('+ Nieuwe clip')); on.value = 'new'; pick.value = String(cellOf(ti, ci));
            pick.onchange = () => { const x = pick.value; if (x === 'new') newClipAt(ti, ci); else if (+x < 0) removeFromScene(ti, ci); else assignCell(ti, ci, +x); }; if (c) el('span', slot, '▾', 'cellpick'); }
          if (c) el('span', body, cov ? tx('deel {0}/{1}', rs.k + 1, span) : (c.bars === 1 ? tx('1 maat') : tx('{0} maten', c.bars)) + (span > 1 ? ' · ' + tx('{0} scènes', span) : ''), 'badge'); const ph = el('i', slot, undefined, 'ph');
          if (c && !cov && !clipEmpty(c)) { const grip = el('i', slot, undefined, 'grip'); grip.title = tx('Sleep omlaag om de clip over meer scènes uit te rekken: elke scène speelt een deel'); grip.onmousedown = e => stretchGrip(e, ti, ci); }
          slot.oncontextmenu = e => clipMenu(e, ti, ci); slot.draggable = !!c && !cov; slot.ondragstart = e => { if (!c || cov) { e.preventDefault(); return; } dragSrc = { ti, ci }; dragScene = null; slot.classList.add('dragging'); viewRefs.slots.forEach(r => { if (canDrop(dragSrc, r.ti, r.ci)) r.el.classList.add('droptarget'); }); e.dataTransfer.effectAllowed = 'copyMove'; e.dataTransfer.setData('text/plain', 'clip ' + (ti + 1) + '/' + (ci + 1)); };
          slot.ondragend = () => { dragSrc = null; root?.querySelectorAll('.slot.dragging,.slot.dropok,.slot.droptarget').forEach(x => x.classList.remove('dragging', 'dropok', 'droptarget')); };
          slot.ondragover = e => { if (!dragSrc || !canDrop(dragSrc, ti, ci)) return; e.preventDefault(); e.dataTransfer.dropEffect = e.ctrlKey || e.metaKey ? 'copy' : 'move'; slot.classList.add('dropok'); }; slot.ondragleave = () => slot.classList.remove('dropok');
          slot.ondrop = e => { if (!dragSrc || !canDrop(dragSrc, ti, ci)) return; e.preventDefault(); const src = dragSrc; dragSrc = null; if (src.lib !== undefined) moveClip(src.ti, -1, ti, ci, false, src.lib); else if (e.altKey && src.ti === ti) assignCell(ti, ci, cellOf(src.ti, src.ci)); else moveClip(src.ti, src.ci, ti, ci, e.ctrlKey || e.metaKey); };
          viewRefs.slots.push({ el: slot, ti, ci, ph }); });
      });
    }
    // de instellingen van een spoor (kleur, transponeren, gate, swing, velocity, auditeren, drumrijen) staan achter het potlood in de spoorkop
    function openPanel(ti) {
      const app = root && root.querySelector('.rg'), anchor = viewRefs.pencils?.[ti], t = state.tracks[ti]; if (!app || !anchor || !t) return; if (menuEl) { menuEl.remove(); menuEl = null; } panelTrack = ti;
      const m = el('div', app, undefined, 'toolbar trackpanel'); m.setAttribute('role', 'dialog'); m.setAttribute('aria-label', tx('Instellingen van spoor {0}', ti + 1)); m.style.setProperty('--track', t.color);
      el('div', m, `${ti + 1} · ${trackName(ti)}`, 'kicker');
      colorInput(m, tx('KLEUR'), t.color, v => change(() => t.color = v));
      if (t.type !== 'drums') { input(m, tx('TRANSPONEREN'), t.transpose, v => change(() => { releaseLive(); t.transpose = integer(v, -48, 48, 0); }), 'number', -48, 48); range(m, tx('GATE'), t.gate, .05, 1.5, .05, v => change(() => t.gate = v), v => Math.round(v * 100) + '%'); } else sel(m, tx('DRUMPROTOCOL'), [['trig', tx('Trig → kanaalnaam')], ['note', tx('MIDI → notennummer')]], t.drumProtocol, v => change(() => t.drumProtocol = v));
      range(m, tx('SWING SPOOR'), t.swing, 0, .5, .01, v => change(() => t.swing = lim(v, 0, .5, 0)), pct, 0);
      if (t.type === 'drums') { const rs = rowsOf(t), ri = Math.min(state.selectedRow, rs.length - 1); sel(m, tx('RIJ'), rs.map((r, i) => [i, r.name]), ri, v => { state.selectedRow = +v; render(); }); range(m, tx('SWING RIJ'), rowSwingOf(t, rs[ri]), 0, .5, .01, v => change(() => { const k = String(rs[ri].note); if (v > 0) t.rowSwing[k] = lim(v, 0, .5, 0); else delete t.rowSwing[k]; }), pct, 0); }
      range(m, tx('VELOCITY SCHAAL'), t.velocity, 0, 1, .01, v => change(() => t.velocity = v), pct); btn(m, tx('Track auditeren'), () => audition(t.type === 'drone' ? 48 : 60, state.selectedRow));
      if (t.type === 'drums') { const map = el('details', m); el('summary', map, tx('Drumrijen en kanaaltoewijzing')); const rows = el('div', map, undefined, 'noteinspector'); (trackNames[ti] ? [] : t.rows).forEach((r, i) => { const box = el('div', rows); input(box, tx('RIJ {0}', i + 1), r.name, v => change(() => r.name = v.slice(0, 24))); input(box, tx('TRIG LANE {0}', i + 1), r.lane, v => change(() => r.lane = v.slice(0, 32))); input(box, tx('MIDI {0}', i + 1), r.note, v => change(() => r.note = integer(v, 0, 127, 36)), 'number', 0, 127); }); }
      const r = app.getBoundingClientRect(), ar = anchor.getBoundingClientRect(), sc = (r.width / app.offsetWidth) || 1; m.style.left = Math.max(0, Math.min((ar.left - r.left) / sc, app.offsetWidth - 320)) + 'px'; m.style.top = Math.max(0, (ar.bottom - r.top) / sc + 4) + 'px';
      menuEl = m;
    }
    // een kleur kiezen met de kleurkiezer van de browser (geen lijst met nummers)
    function colorInput(parent, label, value, fn, title) { const l = el('label', parent, label), i = el('input', l); i.type = 'color'; i.value = HEX.test(value) ? value : '#e8ae61'; i.setAttribute('aria-label', label); if (title) i.title = title; i.onchange = () => fn(i.value.toLowerCase()); return i; }
    // het potlood bij een scène: de kleur van de scène
    function openScenePanel(row) {
      const app = root && root.querySelector('.rg'), anchor = viewRefs.scpencils?.[row]; if (!app || !anchor || !state.scenes[row]) return; if (menuEl) { menuEl.remove(); menuEl = null; } panelScene = row;
      const m = el('div', app, undefined, 'toolbar trackpanel scenepanel'); m.setAttribute('role', 'dialog'); m.setAttribute('aria-label', tx('Kleur van scène {0}', row + 1)); el('div', m, `${row + 1} · ${sceneName(row)}`, 'kicker');
      colorInput(m, tx('KLEUR'), state.scenes[row].color, v => change(() => { state.scenes[row].color = v; }), tx('Kleur van scène {0}', row + 1)); btn(m, tx('Geen kleur'), () => change(() => { delete state.scenes[row].color; }), 'mini').disabled = !state.scenes[row].color;
      const r = app.getBoundingClientRect(), ar = anchor.getBoundingClientRect(), sc = (r.width / app.offsetWidth) || 1; m.style.left = Math.max(0, Math.min((ar.left - r.left) / sc, app.offsetWidth - 240)) + 'px'; m.style.top = Math.max(0, (ar.bottom - r.top) / sc + 4) + 'px'; m.style.width = '220px';
      menuEl = m;
    }
    // een tekst in de spoorkop op de plek aanpassen: klik, typ, Enter (of weg klikken) bewaart, Escape laat staan
    function inlineEdit(node, value, max, label, commit) {
      const inp = el('input'); inp.className = 'rename'; inp.value = value; inp.maxLength = max; inp.setAttribute('aria-label', label); node.replaceWith(inp); inp.focus(); inp.select(); let done = false;
      const finish = ok => { if (done) return; done = true; if (ok && inp.value !== value) change(() => commit(inp.value)); else render(); };
      inp.onkeydown = e => { e.stopPropagation(); if (e.key === 'Enter') finish(true); else if (e.key === 'Escape') finish(false); }; inp.onblur = () => finish(true);
    }
    function renderEditor(app) {
      const t = currentTrack(), c = currentClip(), sec = el('section', app, undefined, 'section'); sec.dataset.scope = 'clip'; sec.style.setProperty('--track', t.color); el('h2', sec, tx('02 · CLIP EDITOR — TRACK {0} / SCÈNE {1} / CLIP {2}', state.selectedTrack + 1, (() => { const rows = t.cells.map((u, r) => u === state.selectedClip ? r + 1 : 0).filter(Boolean); return rows.length ? rows.join(', ') : '–'; })(), state.selectedClip + 1)); renderClipStrip(sec, t, c);
      const bar = el('div', sec, undefined, 'toolbar'); input(bar, tx('CLIPNAAM'), c.name, v => change(() => c.name = v.slice(0, 32))); undoBtns(bar, 'clip');
      input(bar, tx('CLIPLENGTE (MATEN)'), c.bars, v => change(() => { c.bars = integer(v, 1, 64, 1); c.notes = c.notes.filter(n => n.step < c.bars * 16); c.notes.forEach(n => { n.step = Math.min(n.step, c.bars * 16 - .25); }); c.cc.forEach(a => a.points = a.points.filter(p => p.step < c.bars * 16)); c.auto.forEach(a => a.points = a.points.filter(p => p.step < c.bars * 16)); state.editPage = 0; }), 'number', 1, 64);
      { const c2 = c, mk = (label, f, title) => { const why = scaleWhy(c2, f), b = btn(bar, label, () => change(() => scaleClip(c2, f)), 'mini'); b.disabled = !!why; b.title = why || (title + (scaleLoss(c2, f) ? ' ' + tx('Let op: tijden die niet op 1/64 vallen worden afgerond.') : '')); b.setAttribute('aria-label', title); return b; };
        mk('÷ 2', .5, tx('Halveer de cliplengte: alle noten en punten komen twee keer zo dicht op elkaar')); mk('× 2', 2, tx('Verdubbel de cliplengte: alle noten en punten worden gelijkmatig over twee keer zoveel maten verdeeld')); }
      input(bar, tx('OVER SCÈNES'), (() => { const r = rowOfClip(state.selectedTrack, state.selectedClip); return r < 0 ? 1 : effSpan(state.selectedTrack, r); })(), v => change(() => { const r = rowOfClip(state.selectedTrack, state.selectedClip); if (r < 0) return; let m = 1; while (r + m < state.scenes.length && cellFree(state.selectedTrack, r + m)) m++; const sp = integer(v, 1, m, 1); if (sp > 1) c.span = sp; else delete c.span; }), 'number', 1, MAXSCENES).title = tx('Rek de clip uit over lege scènes eronder: elke scène speelt een deel van de clip');
      sel(bar, tx('RASTER'), [[16, tx('1/16')], [32, tx('1/32')], [64, tx('1/64')]], c.grid, v => change(() => { c.grid = +v; state.drawLength = Math.max(state.drawLength, 16 / c.grid); }));
      range(bar, tx('SWING CLIP'), c.swing, 0, .5, .01, v => change(() => c.swing = lim(v, 0, .5, 0)), pct, 0);
      check(bar, tx('Live opname → deze clip'), state.record, v => { state.record = v; recRun = null; autoRun = null; render(); });
      check(bar, tx('Kwantiseer live invoer'), state.quantize, v => { state.quantize = v; });
      sel(bar, tx('ZOOM'), [[16, tx('1 maat / 16 stappen')], [32, tx('2 maten / 32 stappen')], [64, tx('4 maten / 64 stappen')]], state.zoom, v => { state.zoom = +v; state.editPage = 0; render(); });
      const pages = Math.ceil(c.bars * 16 / state.zoom); state.editPage = Math.min(state.editPage, pages - 1); sel(bar, tx('PAGINA'), Array.from({ length: pages }, (_, i) => [i, tx('{0} · stap {1}', i + 1, i * state.zoom + 1)]), state.editPage, v => { state.editPage = +v; render(); });
      btn(bar, tx('Kopieer pagina'), copyPage, 'mini').title = tx('Kopieert de noten, CC en instellingen van de gekozen pagina; plak ze op een andere pagina, ook in een andere clip of een ander spoor van dezelfde soort'); { const why = pastePageWhy(), pp = btn(bar, tx('Plak pagina'), pastePage, 'mini'); pp.disabled = !!why; pp.title = why || tx('Plakt in de gekozen pagina en vervangt wat daar staat'); }
      if (t.type !== 'drums') sel(bar, tx('OCTAAF'), Array.from({ length: 9 }, (_, i) => [i * 12, pitch(i * 12) + ' – ' + pitch(i * 12 + 23)]), state.pianoBase, v => { state.pianoBase = +v; render(); });
      btn(bar, tx('Kopieer clip'), copyClip); btn(bar, tx('Knip clip'), () => { copyClip(); deleteClip(); }); btn(bar, tx('Plak clip'), pasteClip).disabled = !canPasteAt(state.selectedTrack); btn(bar, tx('Kopie naar volgende scène'), copyToEmpty); btn(bar, tx('Wis noten'), () => change(() => { c.notes = []; state.selectedNote = -1; }));
      const play = el('div', sec, undefined, 'toolbar'); el('div', play, tx('CLIP SPELEN EN OPNEMEN'), 'kicker');
      btn(play, tx('▶ Speel deze clip'), () => { playClip(); render(); }, soloRun ? 'active' : '');
      btn(play, tx('■ Stop clip'), () => { stopClip(); render(); }).disabled = !soloRun;
      btn(play, tx('■ Stop'), () => ownStop()).disabled = !ownRun; if (ownRun) el('span', play, tx('Eigen klok: de rest van het canvas speelt niet mee'), 'small');
      btn(play, tx('● Opname'), () => { state.record = !state.record; recRun = null; autoRun = null; render(); }, state.record ? 'active' : '').setAttribute('aria-pressed', String(state.record));
      sel(play, tx('OPNAME'), [['overdub', tx('Aanvullen')], ['replace', tx('Overschrijven')]], state.recordMode, v => { state.recordMode = v === 'replace' ? 'replace' : 'overdub'; recRun = null; autoRun = null; render(); });
      if (soloRun) el('span', play, tx('Clip speelt los van scènes en song'), 'small');
      const draw = el('div', sec, undefined, 'toolbar'); const lens = [[.25, '1/64'], [.5, '1/32'], [1, '1/16'], [2, '1/8'], [4, '1/4'], [8, '1/2'], [16, '1 maat'], [32, '2 maten'], [64, '4 maten'], [128, '8 maten'], [256, '16 maten'], [512, '32 maten'], [1024, '64 maten']];
      sel(draw, tx('NIEUWE NOOTLENGTE'), lens.map(([v, k]) => [v, tx(k)]), state.drawLength, v => state.drawLength = +v); range(draw, tx('NIEUWE VELOCITY'), state.drawVelocity, .05, 1, .05, v => state.drawVelocity = v, pct); range(draw, tx('NIEUWE KANS'), state.drawProbability, 0, 1, .05, v => state.drawProbability = v, pct);
      if (t.type === 'drums') sel(draw, tx('NIEUWE RATCHET'), [[1, '1 ×'], [2, '2 ×'], [3, '3 ×'], [4, '4 ×']], state.drawRatchet, v => state.drawRatchet = +v);
      if (t.type === 'drone') { const ch = el('div', sec, undefined, 'toolbar'); const r = input(ch, tx('AKKOORD GRONDTOON'), 48, () => { }, 'number', 0, 115); const chord = sel(ch, tx('AKKOORD'), [[0, tx('Mineur')], [1, tx('Majeur')], [2, tx('Sus2')], [3, tx('Open kwinten')], [4, tx('Mineur9')]], 0, () => { }); btn(ch, tx('Plaats lang akkoord'), () => { const rootNote = integer(+r.value, 0, 115, 48), intervals = [[0, 3, 7], [0, 4, 7], [0, 2, 7], [0, 7, 12], [0, 3, 7, 10, 14]][+chord.value]; change(() => { for (const k of intervals) { if (c.notes.length >= MAXNOTES) break; const n = note(nextId(c), state.editPage * state.zoom, Math.min(127, rootNote + k), Math.min(state.drawLength, c.bars * 16), state.drawVelocity); c.notes.push(n); } }); }); }
      renderPiano(sec, t, c); renderVelocity(sec, t, c); renderInspector(sec, t, c); renderCC(sec, c); renderSettings(sec, t, c);
    }
    function view(c) { const g = c.grid, u = 16 / g, offset = state.editPage * state.zoom, span = Math.min(state.zoom, c.bars * 16 - offset); return { g, u, offset, span, cols: Math.round(span / u) }; }
    function renderPiano(sec, t, c) {
      const { g, u, offset, span, cols } = view(c), count = t.type === 'drums' ? rowsOf(t).length : 24, cell = g === 16 ? 27 : g === 32 ? 17 : 11, wrap = el('div', sec, undefined, 'gridwrap'), body = el('div', wrap, undefined, 'pianobody'); body.style.minWidth = (112 + cols * cell) + 'px';
      const keys = el('div', body, undefined, 'keys'); el('div', keys, tx('▶ Auditie'), 'ruler');
      for (let r = 0; r < count; r++) { const n = state.pianoBase + 23 - r; const label = t.type === 'drums' ? rowsOf(t)[r].name : pitch(n), k = el('div', keys, label, 'key' + (t.type !== 'drums' && [1, 3, 6, 8, 10].includes(n % 12) ? ' black' : '') + (t.type === 'drums' && r === state.selectedRow ? ' selected' : '')); k.tabIndex = 0; k.setAttribute('role', 'button'); k.setAttribute('aria-label', tx('Auditeer {0}', label)); const play = () => { state.selectedRow = r; audition(n, r); }; k.onclick = play; k.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); play(); } }; }
      const area = el('div', body, undefined, 'gridarea'), ruler = el('div', area, undefined, 'ruler'); for (let j = 0; j < span; j++) { const s = el('span', ruler, j % 4 === 0 ? `${Math.floor((offset + j) / 16) + 1}.${Math.floor(j % 16 / 4) + 1}` : '·'); s.style.left = j / span * 100 + '%'; }
      const ground = el('div', area, undefined, 'noteground'); ground.style.height = count * 24 + 'px'; ground.style.setProperty('--cols', cols); ground.style.setProperty('--beat', 4 / u); const playline = el('div', ground, undefined, 'playline'); viewRefs.playline = { el: playline, offset, cols: span, length: c.bars * 16 };
      const coordinates = e => { const b = ground.getBoundingClientRect(); return { step: offset + Math.max(0, Math.min(cols - 1, Math.floor((e.clientX - b.left) / b.width * cols))) * u, row: Math.max(0, Math.min(count - 1, Math.floor((e.clientY - b.top) / b.height * count))) }; };
      ground.onclick = e => { if (e.target !== ground) return; const p = coordinates(e); addNote(p.step, t.type === 'drums' ? rowsOf(t)[p.row].note : state.pianoBase + 23 - p.row, p.row); };
      const place = (b, n) => { const rr = t.type === 'drums' ? n.row : state.pianoBase + 23 - n.note, end = n.step + (t.type === 'drums' ? u : n.len), h = Math.round(4 + 16 * n.vel); b.style.left = (Math.max(offset, n.step) - offset) / span * 100 + '%'; b.style.width = Math.max(.2 * u, Math.min(end, offset + span) - Math.max(offset, n.step)) / span * 100 + '%'; b.style.height = h + 'px'; b.style.top = rr * 24 + 22 - h + 'px'; };
      c.notes.forEach(n => {
        const r = t.type === 'drums' ? n.row : state.pianoBase + 23 - n.note; if (r < 0 || r >= count || n.step + (t.type === 'drums' ? u : n.len) <= offset || n.step >= offset + span) return;
        const b = btn(ground, t.type === 'drums' ? (n.ratchet > 1 ? `${n.ratchet}×` : '') : pitch(n.note), () => { state.selectedNote = n.id; render(); }, 'noteblock' + (state.selectedNote === n.id ? ' chosen' : '')); b.title = tx('{0} · stap {1} · {2} zestienden · {3}%', t.type === 'drums' ? (rowsOf(t)[n.row]?.name ?? '?') : pitch(n.note), n.step + 1, n.len, Math.round(n.vel * 100)); b.setAttribute('aria-label', b.title); place(b, n); b.style.opacity = .55 + .45 * n.vel; el('span', b, undefined, 'resize');
        b.oncontextmenu = e => { e.preventDefault(); change(() => { c.notes = c.notes.filter(x => x !== n); state.selectedNote = -1; }); };
        b.onpointerdown = e => {
          if (e.button !== 0) return; e.stopPropagation(); e.preventDefault(); b.setPointerCapture(e.pointerId); const initial = { x: e.clientX, y: e.clientY, step: n.step, note: n.note, row: n.row, len: n.len }, rect = ground.getBoundingClientRect(), resizing = e.target?.className === 'resize' || (b.getBoundingClientRect().right - e.clientX <= 12 && t.type !== 'drums'); let moved = false; state.selectedNote = n.id; remember();
          b.onpointermove = ev => {
            const dx = Math.round((ev.clientX - initial.x) / rect.width * cols), dy = Math.round((ev.clientY - initial.y) / rect.height * count); if (dx || dy) moved = true;
            if (resizing) n.len = Math.max(u, Math.min(1024, c.bars * 16 - n.step, initial.len + dx * u)); else { n.step = Math.max(0, Math.min(c.bars * 16 - u, initial.step + dx * u)); if (t.type === 'drums') { n.row = Math.max(0, Math.min(rowsOf(t).length - 1, initial.row + dy)); n.note = rowsOf(t)[n.row].note; } else n.note = Math.max(0, Math.min(127, initial.note - dy)); }
            if (t.type !== 'drums' && b.firstChild) b.firstChild.nodeValue = pitch(n.note); place(b, n);
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
        const b = el('button', strip, undefined, 'velbar' + (state.selectedNote === n.id ? ' chosen' : '')); b.type = 'button'; b.style.left = (n.step - offset) / span * 100 + '%'; b.style.width = `max(4px,${u / span * 100}%)`; b.style.height = n.vel * 100 + '%'; b.title = (t.type === 'drums' ? (rowsOf(t)[n.row]?.name ?? '?') : pitch(n.note)) + ' · ' + pct(n.vel); b.setAttribute('aria-label', b.title);
        b.onpointerdown = e => {
          if (e.button !== 0) return; e.preventDefault(); e.stopPropagation(); b.setPointerCapture(e.pointerId); remember(); const rect = strip.getBoundingClientRect(); let moved = false; state.selectedNote = n.id;
          b.onpointermove = ev => { moved = true; n.vel = Math.round(lim(1 - (ev.clientY - rect.top) / rect.height, .01, 1, .8) * 100) / 100; b.style.height = n.vel * 100 + '%'; b.title = (t.type === 'drums' ? (rowsOf(t)[n.row]?.name ?? '?') : pitch(n.note)) + ' · ' + pct(n.vel); };
          b.onpointerup = ev => { b.onpointermove = null; b.onpointerup = null; try { b.releasePointerCapture(ev.pointerId); } catch { } if (!moved) history.pop(); render(); };
          b.onpointercancel = () => { history.pop(); render(); };
        };
      }
    }
    function renderInspector(sec, t, c) {
      const n = selected(), box = el('div', sec, undefined, 'noteinspector'); if (!n) { el('div', box, tx('Selecteer een noot voor positie, lengte en velocity.'), 'small'); return; }
      const edit = (key, value) => change(() => n[key] = value);
      input(box, tx('NOOT START (STAP)'), n.step + 1, v => edit('step', quant(v - 1, 0, c.bars * 16 - .25, 0)), 'number', 1, c.bars * 16, .25); input(box, tx('LENGTE (ZESTIENDEN)'), n.len, v => edit('len', quant(v, .25, 1024, 1)), 'number', .25, 1024, .25);
      if (t.type !== 'drums') input(box, tx('MIDI NOOT'), n.note, v => edit('note', integer(v, 0, 127, 60)), 'number', 0, 127); else sel(box, tx('DRUMRIJ'), rowsOf(t).map((r, i) => [i, r.name]), n.row, v => change(() => { n.row = +v; n.note = rowsOf(t)[n.row].note; }));
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
      const points = el('details', det); el('summary', points, tx('{0} punten · exact bewerken', a.points.length));
      a.points.forEach(p => { const r = el('div', points, undefined, 'toolbar'); input(r, tx('CC STAP'), p.step + 1, v => change(() => { p.step = integer(v, 1, c.bars * 16, 1) - 1; a.points.sort((x, y) => x.step - y.step); }), 'number', 1, c.bars * 16); input(r, tx('CC WAARDE (%)'), Math.round(p.value * 100), v => change(() => p.value = lim(v, 0, 100, 50) / 100), 'number', 0, 100); btn(r, '×', () => change(() => a.points = a.points.filter(x => x !== p))); });
      btn(det, tx('Verwijder CC-lane'), () => change(() => c.cc = c.cc.filter(x => x !== a)));
    }
    // instellingen van het aangesloten apparaat: een lijn per regelaar over de clip; vlak op de huidige stand zolang er niets is opgenomen
    function renderSettings(sec, t, c) {
      const det = el('details', sec); det.open = true; el('summary', det, tx('INSTELLINGEN · opnemen en afspelen')); const row = el('div', det, undefined, 'toolbar');
      check(row, tx('Instellingen opnemen bij Opname'), state.recordSettings, v => { state.recordSettings = v; render(); });
      sel(row, tx('WIE SPEELT DE INSTELLINGEN'), [['sequencer', tx('Sequencer (exact zoals opgenomen)')], ['modulators', tx('Modulatoren (lijn is de basisstand)')]], state.automation, v => change(() => { state.automation = v === 'modulators' ? 'modulators' : 'sequencer'; }));
      const tid = (autoTargets[state.selectedTrack] || [])[0]; if (!tid) { el('p', det, tx('Verbind dit spoor met een apparaat om zijn instellingen op te nemen.'), 'small'); return; }
      const list = typeof host.paramsOf === 'function' ? host.paramsOf(self, tid).filter(p => p.value !== null) : [];
      if (!list.length) { el('p', det, tx('Dit apparaat biedt geen regelaars aan die je kunt opnemen.'), 'small'); return; }
      const box = el('div', det, undefined, 'autolist'), L = c.bars * 16, NS = 'http://www.w3.org/2000/svg'; let group = null;
      for (const p of list) {
        if (p.laneName && p.laneName !== group) { group = p.laneName; el('div', box, group, 'autogroup'); }
        const a = c.auto.find(x => x.id === p.id), has = !!(a && a.points.length), r = el('div', box, undefined, 'autorow' + (has ? ' has' : '')); el('span', r, p.name, 'autoname');
        const svg = document.createElementNS(NS, 'svg'); svg.setAttribute('viewBox', '0 0 100 20'); svg.setAttribute('preserveAspectRatio', 'none'); r.appendChild(svg); const path = document.createElementNS(NS, 'path');
        const y = v => ((1 - v) * 20).toFixed(2); let d = 'M0 ' + y(p.value) + ' H100';
        if (has) { d = 'M' + (a.points[0].step / L * 100).toFixed(2) + ' ' + y(a.points[0].value); for (let k = 1; k < a.points.length; k++) d += ' H' + (a.points[k].step / L * 100).toFixed(2) + ' V' + y(a.points[k].value); d += ' H100'; }
        path.setAttribute('d', d); path.setAttribute('vector-effect', 'non-scaling-stroke'); svg.appendChild(path);
        el('span', r, has ? a.points.length + '×' : pct(p.value), 'autoval'); if (has) { const b = btn(r, '×', () => change(() => { c.auto = c.auto.filter(x => x !== a); })); b.title = tx('Wis deze lijn'); b.setAttribute('aria-label', b.title); }
      }
    }
    // de songbalk: de secties als blokken (breedte naar maten), de instellingen van de gekozen sectie en de scènenamen
    function renderSongBar(sec) {
      const bar = el('div', sec, undefined, 'songbar');
      const sr = el('div', bar, undefined, 'toolbar songrow');
      sel(sr, tx('SONG'), state.songs.map((sg, i) => [i, `${i + 1} · ${songName(i)}`]), state.activeSong, v => switchSong(+v));
      input(sr, tx('SONGNAAM'), songName(state.activeSong), v => change(() => { const nm = v.trim().slice(0, 24); state.songs[state.activeSong].name = nm === tx('Song {0}', state.activeSong + 1) ? '' : nm; }));
      btn(sr, tx('Nieuwe song'), newSong, 'mini').disabled = state.songs.length >= MAXSONGS; btn(sr, tx('Dupliceer song'), dupSong, 'mini').disabled = state.songs.length >= MAXSONGS; btn(sr, tx('Verwijder song'), delSong, 'mini').disabled = state.songs.length <= 1; undoBtns(sr, 'song');
      const scroll = el('div', bar, undefined, 'scroll'), timeline = el('div', scroll, undefined, 'songtimeline');
      state.arrangement.forEach((a, i) => { const ns = secScenes(a).length, m = a.bars * a.repeats * ns, block = btn(timeline, tx('{0} · {1} / {2}m', i + 1, secScenes(a).map(sceneName).join(' + '), m), () => selectSection(i), 'songblock' + (i === state.selectedSection ? ' chosen' : '')); block.style.flex = String(m); block.title = (ns > 1 ? tx('{0} scènes × {1} maten', ns, a.bars) + (a.repeats > 1 ? ' × ' + tx('{0} herhalingen', a.repeats) : '') : a.repeats > 1 ? tx('{0} maten × {1} herhalingen', a.bars, a.repeats) : (m === 1 ? tx('1 maat') : tx('{0} maten', m))) + ' · ' + tx('Rechtermuisknop: kopiëren, knippen, plakken, verwijderen. Sleep om te verplaatsen.'); const ph = el('i', block, undefined, 'ph'); viewRefs.song.push({ el: block, ph });
        if (a.color) block.style.setProperty('--sec', a.color);
        block.oncontextmenu = e => sectionMenu(e, i); block.draggable = true; block.dataset.sec = String(i);
        block.ondragstart = e => { dragSection = i; dragScene = null; dragSrc = null; block.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', 'section ' + (i + 1)); }; block.ondragend = () => { dragSection = null; clearDrop(); };
        block.ondragover = e => { if (dragSection !== null) { if (dragSection === i) return; e.preventDefault(); e.dataTransfer.dropEffect = 'move'; const r = block.getBoundingClientRect(), after = e.clientX > r.left + r.width / 2; block.classList.toggle('dropafter', after); block.classList.toggle('dropbefore', !after); return; } if (dragScene === null) return; e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; block.classList.add('dropok'); }; block.ondragleave = () => block.classList.remove('dropok', 'dropbefore', 'dropafter');
        block.ondrop = e => { if (dragSection !== null) { e.preventDefault(); const from = dragSection, after = block.classList.contains('dropafter'); dragSection = null; let to = after ? i + 1 : i; if (from < to) to--; moveSec(from, to); return; } if (dragScene === null) return; e.preventDefault(); const k = dragScene; dragScene = null; if (e.ctrlKey || e.shiftKey) { state.selectedSection = i; setSecScenes(i, secScenes(a).concat(k)); } else change(() => { a.scene = k; delete a.scenes; state.selectedSection = i; selRow = k; const c0 = secRes(a, state.selectedTrack).ci; if (c0 >= 0) state.selectedClip = c0; }); }; });
      const plus = btn(timeline, '+', () => appendSection(selRow), 'songblock addblock'); plus.title = tx('Sectie achteraan met de gekozen scène. Sleep een scène hierheen om hem achteraan te zetten.'); plus.disabled = state.arrangement.length >= 64;
      plus.ondragover = e => { if (dragScene === null && dragSection === null) return; e.preventDefault(); e.dataTransfer.dropEffect = dragSection !== null ? 'move' : 'copy'; plus.classList.add('dropok'); }; plus.ondragleave = () => plus.classList.remove('dropok'); plus.ondrop = e => { if (dragSection !== null) { e.preventDefault(); const from = dragSection; dragSection = null; moveSec(from, state.arrangement.length - 1); return; } if (dragScene === null) return; e.preventDefault(); const k = dragScene; dragScene = null; appendSection(k); };
      const a = state.arrangement[state.selectedSection], i = state.selectedSection, r = el('div', bar, undefined, 'toolbar secset');
      el('span', r, tx('SECTIE {0} / {1}', i + 1, state.arrangement.length), 'kicker');
      { const list = secScenes(a), lb = el('label', r, tx('SCÈNES')), box = el('div', lb, undefined, 'scenechips');
        list.forEach((k, j) => { const chip = el('span', box, undefined, 'schip'); el('span', chip, `${k + 1} · ${sceneName(k)}`); if (list.length > 1) { btn(chip, '‹', () => { const l = list.slice(); [l[j - 1], l[j]] = [l[j], l[j - 1]]; setSecScenes(i, l); }, 'mini').disabled = j === 0; btn(chip, '›', () => { const l = list.slice(); [l[j + 1], l[j]] = [l[j], l[j + 1]]; setSecScenes(i, l); }, 'mini').disabled = j === list.length - 1; btn(chip, '×', () => setSecScenes(i, list.filter((_, x) => x !== j)), 'mini').title = tx('Scène uit deze sectie halen'); } });
        const add = el('select', box, undefined, 'schipadd'); add.setAttribute('aria-label', tx('Scène aan deze sectie toevoegen')); add.title = tx('Voeg een scène toe: de scènes van een sectie spelen na elkaar'); const o0 = el('option', add, tx('+ scène')); o0.value = ''; state.scenes.forEach((_, j) => { const o = el('option', add, `${j + 1} · ${sceneName(j)}`); o.value = String(j); }); add.disabled = list.length >= 16; add.onchange = () => { if (add.value !== '') setSecScenes(i, list.concat(+add.value)); }; }
      colorInput(r, tx('KLEUR'), a.color, v => change(() => { a.color = v; }), tx('Kleur van de sectie'));
      input(r, tx(secScenes(a).length > 1 ? 'MATEN PER SCÈNE' : 'MATEN'), a.bars, v => change(() => a.bars = integer(v, 1, 64, 4)), 'number', 1, 64); input(r, tx('HERHALINGEN'), a.repeats, v => change(() => a.repeats = integer(v, 1, 16, 1)), 'number', 1, 16);
      el('span', r, tx('{0} maten in totaal · {1} in de hele song', a.bars * a.repeats * secScenes(a).length, totalSteps() / 16), 'small');
      const b = el('div', r, undefined, 'row');
      btn(b, tx('Speel vanaf sectie'), () => { state.mode = 'song'; soloRun = null; reset(); seek = sectionStart(state.selectedSection); render(); }, 'mini');
      btn(b, tx('Sectie toevoegen'), () => change(() => { if (state.arrangement.length < 64) { state.arrangement.splice(i + 1, 0, cleanSection(clone(a), state.scenes.length)); state.selectedSection = i + 1; } }), 'mini').title = tx('Voegt een kopie van deze sectie toe, direct erna');
      btn(b, '←', () => { if (i > 0) moveSec(i, i - 1); }, 'mini').title = tx('Sectie naar voren');
      btn(b, '→', () => { if (i < state.arrangement.length - 1) moveSec(i, i + 1); }, 'mini').title = tx('Sectie naar achteren');
      btn(b, '×', () => change(() => { if (state.arrangement.length > 1) { state.arrangement.splice(i, 1); state.selectedSection = Math.min(state.selectedSection, state.arrangement.length - 1); } }), 'mini').title = tx('Sectie verwijderen');
    }
    let followScene = -1;
    function scrollToRow(row) {
      const w = viewRefs.wrap; if (!w || !row?.isConnected) return; const wr = w.getBoundingClientRect(), er = row.getBoundingClientRect(), head = w.querySelector('.th')?.getBoundingClientRect().height || 0;
      if (er.top < wr.top + head) w.scrollTop -= wr.top + head - er.top; else if (er.bottom > wr.bottom) w.scrollTop += er.bottom - wr.bottom;
    }
    function animate() {
      if (!root || dead) return; while (pending.length && pending[0].time <= ctx.currentTime) visual = pending.shift(); if (autoDirty && performance.now() - autoRenderAt > 500) { autoDirty = false; autoRenderAt = performance.now(); renderWanted = true; } if (renderWanted) { renderWanted = false; render(); }
      if (viewRefs.status) { viewRefs.status.textContent = error || (!playing ? tx('Host transport staat stil.') : !state.armed ? tx('Sequencer uit') : soloRun ? tx('CLIP · maat {0} · {1} BPM', Math.floor((visual?.local?.[soloRun.ti] ?? 0) / 16) + 1, lastBpm.toFixed(0)) : songEnded ? tx('Song afgelopen') : `${state.mode === 'song' ? 'SONG' : 'SESSION'} · ${tx('maat {0}', Math.floor((visual?.tick || 0) / 16) + 1)} · ${lastBpm.toFixed(0)} BPM`); viewRefs.status.style.color = error ? 'var(--stop,#e4574a)' : 'var(--muted)'; }
      viewRefs.slots?.forEach(({ el, ti, ci, ph }) => { const run = playing && state.armed && visual?.clips[ti] === ci; el.classList.toggle('running', run); el.classList.toggle('queued', queueScene === ci || queueClips.get(ti) === ci);
        if (ph) { const rs = resolve(ti, ci), cl = state.tracks[ti]?.clips[rs.ci], lc = visual?.local?.[ti]; if (run && cl && Number.isFinite(lc) && lc >= 0) { const sp = rs.linked ? 1 : effSpan(ti, rs.ci), L = cl.bars * 16, from = partOff(cl, rs.k), to = rs.k + 1 >= sp ? L : partOff(cl, rs.k + 1); ph.style.display = 'block'; ph.style.left = Math.max(0, Math.min(100, (lc - from) / Math.max(1, to - from) * 100)) + '%'; } else ph.style.display = 'none'; } });
      if (viewRefs.matrixStatus) { let m = ''; if (playing && state.armed && !soloRun) { if (state.mode === 'song' && visual && visual.section >= 0 && state.arrangement[visual.section]) { const a = state.arrangement[visual.section]; m = tx('Song · sectie {0}/{1} · {2} · maat {3} van {4}', visual.section + 1, state.arrangement.length, sceneName(a.scene), Math.floor(Math.max(0, visual.secLocal) / 16) + 1, a.bars); } else if (state.mode !== 'song' && visual) m = tx('Sessie · maat {0}', Math.floor((visual.tick || 0) / 16) + 1); } if (viewRefs.matrixStatus.textContent !== m) viewRefs.matrixStatus.textContent = m; }
      let runScene = -1; viewRefs.scenes?.forEach((el, i) => { const r = playing && state.armed && visual?.clips.length > 0 && visual.clips.every(c => c === i); if (r) runScene = i; el.classList.toggle('running', r); el.classList.toggle('queued', queueScene === i); });
      if (runScene !== followScene) { followScene = runScene; if (runScene >= 0) scrollToRow(viewRefs.scenes[runScene]); }   // de matrix volgt de scène die speelt, maar alleen als hij uit beeld is
      viewRefs.song?.forEach(({ el, ph }, i) => { const run = playing && state.armed && state.mode === 'song' && !soloRun && visual?.section === i; el.classList.toggle('running', run); if (ph) { if (run && visual.secPos >= 0 && visual.secLen > 0) { ph.style.display = 'block'; ph.style.left = visual.secPos / visual.secLen * 100 + '%'; } else ph.style.display = 'none'; } });
      const p = viewRefs.playline; if (p && soloRun && playing && state.armed && visual?.roots?.[state.selectedTrack] === state.selectedClip) { const lc = visual?.local[state.selectedTrack]; if (Number.isFinite(lc) && lc >= 0 && (lc < p.offset || lc >= p.offset + p.cols)) { const pg = Math.floor(lc / state.zoom); if (pg !== state.editPage) { state.editPage = pg; render(); return; } } }   // één clip: de weergave volgt de lijn naar de volgende pagina
      if (p) { const local = visual?.local[state.selectedTrack], visible = playing && state.armed && visual?.roots?.[state.selectedTrack] === state.selectedClip && local >= p.offset && local < p.offset + p.cols; p.el.style.display = visible ? 'block' : 'none'; if (visible) p.el.style.left = (local - p.offset) / p.cols * 100 + '%'; }
    }
    return self;
  }
};
