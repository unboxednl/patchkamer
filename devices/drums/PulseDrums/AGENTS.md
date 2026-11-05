# AGENTS.md: Pulse Drums

Dit bestand is voor AI-agents die **tunes voor Pulse Drums** maken of het apparaat configureren. Het is niet geschreven voor mensen. Het hoort bij `../../../AGENTS.md` (algemeen) en `../../../tunes/AGENTS.md` (regels voor tunes); lees die eerst. Hier staat wat alleen voor Pulse Drums geldt. Pulse Drums is een zelfstandige uitbreiding van Drum Kit (`../DrumKit/AGENTS.md`): dezelfde 24 instrumenten, dezelfde acht klankmodellen en dezelfde kanaalregelaars, plus de onderdelen hieronder. Lees ook die tekst; hier staat alleen het verschil.

## Wat Pulse Drums is

Een drumworkstation voor techno. Tot 16 kanalen met 27 instrumenten (de 24 van Drum Kit en drie FM-instrumenten: `fmperc`, `fmmetal` en `fmhat`), vier patronen van maximaal 64 stappen, en per kanaal een eigen patroonlengte (polymetrie, met euclidische ritmes en roteren). Extra's ten opzichte van Drum Kit: FM-regelaars voor de FM-instrumenten, drie lagen voor de kick (body, sub en click), een rumble-bus met een eigen uitgang, grit over de hele mix, en per stap micro-timing, een cyclusvoorwaarde, een fill-voorwaarde en p-locks. Vijf fabrieksinstellingen onder "Techno DNA" (`Hypnotic`, `Hardgroove`, `Industrial`, `Deep dub` en `Broken`) vervangen kit en patronen.

| | |
|---|---|
| Bestand | `pulse-drums.patchkamer-device.js` (in deze map) |
| `id` | `nl.patchkamer.pulsedrums`. Verander die nooit: daaraan hangen tunes en songs van gebruikers |
| Naam | `Pulse Drums` in alle talen; alleen een poortnaam heeft een Nederlandse variant (via `i18n`); alle tekst in de kaart staat in `TXT` (nl en en) |
| Soort | `instrument`: dit apparaat krijgt dus **tunes** (geen presets) |
| Poorten | audio-uitgangen `mix` (Stereo mix), `rumble` (Rumble) en `ch1` … `ch16` (Drum 1 … 16); eventingang `trigger` (MIDI / trigs); eventuitgang `trigs` (Drum trigs); modulatie-ingang `mod`; bundel-uitgang `multi` (Losse uit / Separate outs) |
| Contract | v1.11 |
| Licentie apparaat | AGPL-3.0-or-later |

Dit apparaat is de nieuwe, bijgewerkte vorm van een ouder bestand met een andere naam en id (Puls Drums, `nl.patchkamer.puls-drums`). Tunes of songs uit die tijd verwijzen naar de oude id en laden hier niet in. De twee eerste klankmodellen heten nu `Deep` en `Punch` (in het oude bestand hadden ze een getal als naam).

## De state

`state` van een tune is wat `getPreset()` teruggeeft: `getState()` zonder het eigen werk met het apparaat (`presets`, `selected`, `bank`, `stepEdit`, `editVelocity`, `editProbability`, `editRatchet`). Een tune verandert die velden nooit. Een tune hoeft alleen te bevatten wat afwijkt: wat ontbreekt krijgt de standaardwaarde.

Voor de velden `kit`, `channels` (met `type`, `model`, `note`, `tune`, `decay`, `tone`, `noise`, `sweep`, `attack`, `cutoff`, `resonance`, `filter`, `drive`, `level`, `pan`, `mute`, `solo`, `mix`, `choke` en `steps`), `length`, `pattern`, `run`, `master` en `human` gelden dezelfde waarden en bereiken als bij Drum Kit. Het verschil:

| Veld | Wat | Waarden | Start |
|---|---|---|---|
| `rumble` | Hoeveelheid rumble: de kicks (`kick` en `sub`) gaan door een galm, een hoog- en laagdoorlaatfilter, verzadiging en ducking; het resultaat gaat naar de mix en naar de uitgang `rumble` | 0 … 1 | 0,18 |
| `rumbleTone` | Filterfrequentie van de rumble | 80 … 2500 Hz | 700 |
| `grit` | Verzadiging over de hele mix | 0 … 1 | 0 |
| `fill` | Fill aan (voor stappen met een fill-voorwaarde) | boolean | `false` |
| `length` | Lengte van het raster (de kaart biedt 16, 32 en 64) | 1 … 64 | 64 bij Techno DNA, anders 16 |

Extra velden per kanaal (naast die van Drum Kit):

| Veld | Wat | Waarden | Start |
|---|---|---|---|
| `seqLength` | Patroonlengte van dit kanaal (polymetrie) | geheel getal 1 … 64 | 16 |
| `fm`, `ratio` | FM-diepte en FM-verhouding (alleen bij `fmperc`, `fmmetal` en `fmhat`) | 0 … 8 en 0,25 … 12 | 1,5 en 2,7 |
| `body`, `sub`, `click` | De drie lagen van een kick (alleen bij `kick` en `sub`) | 0 … 1 | 0,85, 0,18 en 0,2 |

Een stap in `steps[patroon][n]` (4 patronen van 64 stappen) heeft `v` (velocity, 0 = geen slag), `p` (kans), `r` (ratchet 1 … 4) en bovendien:

| Veld | Wat | Waarden | Start |
|---|---|---|---|
| `micro` | Micro-timing, als deel van een stap | −0,4 … 0,4 | 0 |
| `every`, `phase` | Cyclusvoorwaarde: de stap speelt in cyclus `phase` van elke `every` cycli (een cyclus is een keer rondgaan van het kanaal) | geheel getal 1 … 8 en 1 … 8 | 1 en 1 |
| `fill` | Fill-voorwaarde: 0 altijd, 1 alleen met fill, 2 alleen zonder fill | 0, 1 of 2 | 0 |
| `locks` | P-locks: waarden die alleen voor deze slag gelden | object met sleutels uit `tune`, `decay`, `tone`, `cutoff`, `resonance`, `drive` en (alleen bij FM) `fm`, binnen het bereik van het kanaalveld | `{}` |

Stappen laat je weg of zet je op `null`; `{ "v": 0.9 }` volstaat (de rest krijgt de standaard).

Wat Pulse Drums met een state doet (getest): getallen buiten het bereik worden afgekapt; een tekst, `null`, `NaN`, `±Infinity` of een ontbrekende waarde geeft de startwaarde; een onbekend `type` geeft `kick`, een onbekend `model` geeft `Deep`; meer dan 16 kanalen worden afgekapt; onbekende velden worden genegeerd.

## Triggers en modulatie

- `onEvent` op `trigger`: `{ type: 'trig', lane: 'ch3' of een instrumentnaam, vel }`, `{ type: 'note', note, vel }` en `{ type: 'cc', id: 'ch2.cutoff', value }` met `cutoff`, `resonance`, `level`, `pan`, `drive` of `tune`, of `id: 'master'`. Zie Drum Kit.
- `modulate` (poort `mod`) neemt alleen eindige getallen tussen −1 en 1 aan en alleen voor bestaande spoor-id's. Naast `ch1.tune`, `ch1.decay` enzovoort (ook `fm`, `ratio`, `body`, `sub` en `click` waar die bij het instrument horen) zijn er globale sporen: `master`, `rumble`, `rumbleTone` en `grit`. Modulatie verandert nooit de bewaarde waarden.

## Nootnamen voor sequencers

Pulse Drums heeft `noteNames()` (contract v1.14, `../../../contract/PATCHKAMER-CONTRACT_NL.md` §13b): elk kanaal met zijn instrumentnaam en zijn `note`, in de volgorde van `channels`; twee kanalen met dezelfde noot geven één regel (de eerste). Een sequencer die er met een notenkabel aan hangt, toont die klanken als rijen (Step Sequencer) of drumrijen (Pattern Tracker, Pattern Playlist) en volgt wijzigingen van kit, volgorde of noot via `host.noteNamesChanged`. Een tune die de kanalen verandert, verandert dus ook wat de sequencer toont. Je hoeft er in een tune niets voor te doen.

## Tunes maken

- **Zet de eigen sequencer uit**: elke tune bevat `run: false`, zodat een gebruiker met zijn eigen sequencer kan beluisteren welke kit het best past. De patronen blijven in de tune staan; wie de eigen sequencer weer aanzet, hoort de groove. Laat dit veld in een nieuwe tune dus nooit weg (bij een ontbrekend veld start het apparaat zijn eigen sequencer).

- Een pack heet `naam.patchkamer-tunes.json` en staat in `../../../tunes/` (licentie `CC0-1.0`); `device` is `nl.patchkamer.pulsedrums`, elke tune is `kind: "set"`. Lees `../../../tunes/AGENTS.md` voor het formaat.
- Een tune is een **kit met groove**: instrumenten, klankmodellen en een patroon. Houd hem klein: laat patronen die je niet gebruikt leeg en houd het aantal kanalen laag. Geef elke tune een Engelse naam, zonder merk- of modelnamen, ook niet in de vorm "in de stijl van …".
- Gebruik precies de sleutels hierboven, met waarden binnen het bereik. Maak alleen tunes als de opdracht dat vraagt.

## Controleren

- `node contract/validate-instrument.mjs devices/drums/PulseDrums/pulse-drums.patchkamer-device.js --lang nl` en `--lang en`, vanuit de root. Beide moeten `OK` geven, zonder `let op`.
- Je kunt niet horen hoe een tune klinkt. Schrijf in je oplevering dat het **niet beluisterd** is.
- Het geluid is bewezen gelijk aan dat van het oude bestand: elke aanroep naar de audiograaf (knooppunten, tijden, waarden) is identiek in 40 willekeurige kits (ongeveer 390.000 aanroepen), met vaste willekeur voor kans en humanize, en `getState`, `params()` en de bundel zijn gelijk. Een geluidswijziging moet dus een bewuste keuze zijn.

## Wat je niet doet

- Verander nooit de `id`, de `kind`, de poort-id's, de spoor-id's (`ch1.tune` enzovoort) of de namen van state-velden.
- Pas het apparaat niet aan om een tune te laten kloppen.
- Zet geen merknamen van bestaande apparatuur in naam, omschrijving of tune, en verzin geen persoon bij `author`.
- Commit of push niet, tenzij de opdracht dat vraagt.
