# AGENTS.md: Formant Singer

Dit bestand is voor AI-agents die **tunes voor Formant Singer** maken of er songs mee componeren. Het is niet geschreven voor mensen. Het hoort bij `../../../AGENTS.md` (algemeen) en `../../../tunes/AGENTS.md` (regels voor tunepacks); lees die eerst. Hier staat wat alleen voor Formant Singer geldt.

## Wat Formant Singer is

Een synth die **zang synthetiseert**. Je geeft hem een tekst (de lyrics) en noten (van een toetsenbord, een sequencer of MIDI); elke noot zingt dan de **volgende lettergreep** van de tekst, op de toonhoogte, de lengte en de velocity van die noot. Er is geen netwerk en geen model: het is klassieke formant-/bronfiltersynthese in Web Audio, in één bestand. Het klinkt robotachtig (dat is de bedoeling); klinkers zijn herkenbaar, medeklinkers zijn benaderd.

Per stem: een bron (een bandbegrensde golfvorm met harmonischen 1/n^k, plus ruis voor adem) gaat door vijf parallelle bandpass-formantfilters (F1 tot F5). Die glijden tussen klinkers. Medeklinkers zijn gefilterde ruis (s, sh, f, th, x, h), korte ruisbursts met een formantovergang (p, t, k, b, d, g), lage resonanties met gedempte hoge formanten (m, n, ng) of klinkerachtige overgangen (l, r, j, w). Met `voices` groter dan 1 zingt elke noot als een koor van gedetuneerde leden met een eigen vibrato-fase en stereopositie. Het apparaat heeft **geen sequencer en geen klok**: het zingt alleen de noten die het krijgt, of de knop Test.

| | |
|---|---|
| Bestand | `formant-singer.patchkamer-device.js` (in deze map) |
| `id` | `nl.patchkamer.formantsinger`. Verander die nooit: daaraan hangen tunes en songs van gebruikers |
| Naam | `Formant Singer` in alle talen; de poortnamen hebben een Nederlandse variant (via `i18n`) |
| Soort | `instrument`, categorie `synth`: dit apparaat krijgt dus **tunes** (geen presets) |
| Poorten | eventingang `notes` (Notes / Noten), eventingang `lyrics` (Lyrics / restart; Nederlands Tekst / herstart), modulatie-ingang `mod`, audio-uitgang `out` (Stereo voice / Stereo zang, stereo) |
| Contract | v1.13 (`version` 1.13.0) |
| Licentie apparaat | AGPL-3.0-or-later |

## De state

`getState()` geeft 23 velden (gewone JSON, geen routing, geen AudioNodes). Een getal buiten het bereik wordt afgekapt en op de stap afgerond; een tekst, `NaN`, `Infinity`, `null`, een ontbrekende of een ongeldige keuzewaarde geeft de standaardwaarde. Onbekende velden worden genegeerd. `setState({})` geeft alle standaardwaarden.

`getPreset()` geeft dezelfde state **zonder `pos`**; dat is wat een tune bewaart (22 velden). `setPreset(p)` zet alles behalve `pos` en laat `pos` staan, behalve als de tekst of de taal verandert: dan begint de nieuwe tekst bij de eerste lettergreep (`pos` 0).

### Tekst en keuzes

| Veld | Wat het doet | Waarden | Standaard |
|---|---|---|---|
| `lyrics` | De tekst die gezongen wordt, in lettergrepen gesplitst (zie "Lyrics-syntaxis") | tekst, hoogstens 2000 tekens | `la la la` |
| `lang` | Hoe de tekst wordt gelezen | `en` (Engelse spelling), `nl` (Nederlandse spelling), `phon` (klanken direct) | `en` |
| `voice` | Stemtype: kiest de formanttabel (man, vrouw of kind) en een schaal | `soprano`, `alto`, `tenor`, `bass`, `child`, `whisper`, `custom` | `alto` |
| `vowel` | Vaste klinker voor `fixed` of als `lyrics` leeg is | `a`, `ae`, `e`, `ee`, `i`, `ih`, `o`, `aw`, `u`, `oo`, `y`, `oe`, `uh`, `er` | `a` |
| `fixed` | Aan: elke noot zingt `vowel`, de tekst wordt overgeslagen en `pos` loopt niet | `true`, `false` | `false` |
| `mode` | `mono`: één stem, legato bij overlappende noten (met glide); `poly`: tot 8 noten tegelijk | `mono`, `poly` | `mono` |
| `onEnd` | Wat er gebeurt als de tekst op is: `loop` begint opnieuw, `hold` zingt de laatste klinker door (zonder medeklinkers), `stop` zwijgt tot Restart | `loop`, `hold`, `stop` | `loop` |
| `pos` | **Werkstand**, geen klank: de lettergreep die de volgende noot zingt (0 = de eerste). Zit in `getState`, **niet** in `getPreset` en dus nooit in een tune | geheel getal, 0 tot het aantal lettergrepen | 0 |

Stemtypen: `soprano` en `alto` gebruiken de vrouwtabel (schaal 1,04 en 0,97), `tenor` en `bass` de mantabel (schaal 1,03 en 0,88), `child` de kindtabel, `whisper` de mantabel met alleen ruis door de formanten (geen toonhoogte, de noot geeft alleen het ritme), `custom` de mantabel zonder schaal (dan bepaalt alleen `size` de stem). Bij `soprano`, `alto` en `child` volgt F1 de toon omhoog zodra de toonhoogte boven F1 komt (zoals zangers doen); bij de andere stemtypen niet.

### Bron en stem

| Veld | Wat het doet | Bereik | Stap | Standaard |
|---|---|---|---|---|
| `size` | Formantverschuiving in halve tonen: alle formanten schuiven mee, de toonhoogte niet. Positief is kleiner/jonger/spitser, negatief groter/donkerder. Verandert het stemtype | −12 … 12 | 0,1 | 0 |
| `breath` | Hoeveel ruis (adem) er in de bron zit | 0 … 1 | 0,01 | 0,12 |
| `bright` | Spectrale helling van de bron (harmonischen 1/n^k, k van 2,6 bij 0 tot 0,8 bij 1): hoger is helderder, schriller | 0 … 1 | 0,01 | 0,5 |
| `voices` | Koorleden per noot | 1 … 8 (geheel) | 1 | 1 |
| `detune` | Hoeveel de koorleden uit elkaar staan (cent). Alleen hoorbaar bij `voices` groter dan 1 | 0 … 50 | 0,5 | 8 |
| `spread` | Stereobreedte van de koorleden en, bij `poly`, van de noten onderling | 0 … 1 | 0,01 | 0,5 |

### Beweging en omhulling

| Veld | Wat het doet | Bereik | Stap | Standaard |
|---|---|---|---|---|
| `vibRate` | Vibratosnelheid in Hz | 3 … 8 | 0,1 | 5,5 |
| `vibDepth` | Vibratodiepte in cent (piek) | 0 … 100 | 1 | 22 |
| `vibDelay` | Vertraging voor het vibrato inzet (s); daarna 0,4 s opbouw | 0 … 2 | 0,05 | 0,3 |
| `glide` | Glijtijd (s): de pitch-glide bij `mono` en de snelheid waarmee de formanten naar de volgende klinker glijden | 0 … 0,5 | 0,005 | 0,06 |
| `attack` | Opkomst van de stem (s), exponentieel | 0,005 … 3 | 0,005 | 0,04 |
| `release` | Uitklank na het einde van de noot (s), exponentieel | 0,02 … 6 | 0,01 | 0,25 |

### Spraak en niveau

| Veld | Wat het doet | Bereik | Stap | Standaard |
|---|---|---|---|---|
| `consonants` | Hoeveel medeklinker-articulatie (duur en niveau). 0 zingt alleen klinkers | 0 … 1 | 0,01 | 0,8 |
| `onset` | Maximale duur van de beginmedeklinkers in ms (de eindmedeklinkers krijgen 80% daarvan) | 5 … 200 | 1 | 60 |
| `level` | Uitgangsniveau | 0 … 1 | 0,01 | 0,7 |

Een enkele stem komt op ongeveer −10 dBFS (piek rond 0,3) bij `level` 0,7 en velocity 0,8, voor elke klinker en elk stemtype ongeveer even hard (verschil minder dan 0,3 dB gemeten). Medeklinkers hebben vaste niveaus ten opzichte van de klinker; zachte noten (lage velocity) krijgen zachtere en kortere medeklinkers.

## Lettergrepen en lyrics

Elke noot (`note`, of `noteon`) neemt de **volgende lettergreep** van de tekst en verhoogt `pos` met 1. Noten die binnen **30 ms na de eerste noot** beginnen horen bij hetzelfde akkoord: ze zingen dezelfde lettergreep (ook bij `poly`; bij `mono` wint de laatste noot). `panic`, `allnotesoff` en een transportstop zetten `pos` **niet** terug.

### Lyrics-syntaxis

- Een **lettergreepgrens** is een spatie, `-` of `|`. Een woord **zonder** `-` of `|` wordt automatisch gesplitst (een eenvoudige klinkergroepregel: de medeklinkers tussen twee klinkergroepen worden zo verdeeld dat de volgende lettergreep een gangbare beginklank krijgt; `hello` wordt `hel-lo`, `singing` wordt `sing-ing`, `make` blijft één lettergreep met een lange klinker). Een stuk **tussen** `-` of `|` is altijd precies één lettergreep; bevat zo'n stuk meer klinkergroepen, dan worden alleen de eerste klinker en de laatste medeklinkers gezongen. Wil je het zeker weten, schrijf dan zelf `ha-lle-lu-ja`.
- `_` of `~` = **melisma**: de noot zingt de laatste klinker van de vorige lettergreep door, zonder medeklinkers. Letters direct achter `_` tot de volgende grens worden niet gezongen (`no_o_o` is `no` plus twee melisma's; `no _ _` is hetzelfde).
- `*` of `.` (los staand, `**` = twee) = **rust**: de noot neemt een plek in de tekst maar zingt niets. `la*la` is `la`, rust, `la`.
- Leestekens (`, ; : ! ? " ( )`), hoofdletters en accenten worden genegeerd; een punt direct achter een woord ook.
- Een lettergreep zonder klinker wordt gezongen met een korte `uh`. Een lettergreep die alleen uit nasalen bestaat (`mm`, `n`) is een **gonzende klank**: de nasaal klinkt de hele noot.
- Hoogstens 1500 lettergrepen; de tekst is hoogstens 2000 tekens.

### Spelling naar klanken (`lang: 'en'` en `'nl'`)

De regels zijn compact en niet volledig; ze dekken de gangbare gevallen. Een paar tientallen veelvoorkomende woorden hebben een vaste uitspraak (Engels: `a the of to you your one two who are was were is his has have love come some do does done give live said says I my by why me we he she be no go so oh yes and in on it as at or for from what all any many night light eye eyes sky fly high sigh bright`; Nederlands: `de een het is en ik je jij ja nee wij zij hij mij ze we me te ne licht nacht ooit hoi`).

- Engels: `ee ea ie` = `i`; `ai ay ei ey` = `ei`; `oa` en `ow` aan het eind = `ou` (`now`, `how`, `cow` = `au`); `oo` = `u`; `ou` = `au`; `oi oy` = `oi`; `au aw` = `aw`; `ew ue ui eu` = `u`; `igh` = `ai`. Losse klinkerletters: open lettergreep `a` = `a`, `e` = `i`, `i` = `i` (`ai` in een eenlettergrepig woord), `o` = `ou`, `u` = `u`; gesloten lettergreep `a` = `ae`, `e` = `e`, `i` = `ih`, `o` = `aw`, `u` = `uh`; stomme `e` (`make`) maakt de klinker lang; klinker plus `r` geeft `a` + `r`, `aw` + `r` of `er`. Medeklinkers: `ch sh th ph ck ng nk qu wh dg tch`, `c` = `s` voor `e i y` anders `k`, `g` voor `e i y` = `jh` (`d` + `zh`), `kn gn` = `n`, `wr` = `r`, `x` = `k s`, `gh` stil na een klinker.
- Nederlands: `aa` = `a`; `ee` = `ee`; `oo` = `o`; `uu` = `y`; `ie` = `i`; `oe` = `u`; `eu` = `oe`; `ui` = `ui`; `ij ei` = `ei`; `au ou` = `au`. Losse letters: `a` = `a`, `e` open vooraan = `ee`, `e` open aan het eind = `uh`, `e` gesloten = `e`, `i` = `i` open en `ih` gesloten, `o` = `o` open en `aw` gesloten, `u` = `y` open en `oe` gesloten. Medeklinkers: `ch` en `g` = `x`, `sj` = `sh`, `tj` = `t` + `sh`, `j` = `j`, `w` = `w`, aan het eind `b d v z` als `p t f s`.

### Klanknotatie (`lang: 'phon'`)

In `phon` schrijf je de klanken van een lettergreep **direct achter elkaar**, zonder spaties (`shaet`, `lau`, `ha`). Lettergrepen scheid je met spatie, `-` of `|`. De klanken worden van links naar rechts gelezen, met de langste passende code eerst; wil je een code uit elkaar houden, zet dan een `'` ertussen (`s'h` is `s` en `h`, `n'g` is `n` en `g`). Een klinker in de lettergreep is de kern; medeklinkers ervoor zijn de aanloop, erachter de uitloop. Twee klinkers achter elkaar (met `'` ertussen) geven een tweeklank van de eerste naar de laatste. `_ ~ * .` werken zoals boven.

| Soort | Codes |
|---|---|
| Klinkers (met een voorbeeld) | `a` spa, `ae` cat, `e` bed, `ee` Nederlands veel, `i` see, `ih` sit, `o` oh, `aw` law, `u` moon, `oo` foot, `y` Nederlands uur, `oe` Nederlands deur, `uh` cup of de, `er` her |
| Tweeklanken | `ai` (a naar ih), `ei` (e naar ih), `au` (a naar oo), `ou` (o naar oo), `oi` (aw naar ih), `ui` (oe naar y) |
| Stemloze wrijfklanken | `s`, `sh`, `f`, `th`, `x` (Nederlands ch en g), `h` |
| Stemhebbende wrijfklanken | `v`, `z`, `zh`, `dh` |
| Plofklanken | `p t k` (stemloos), `b d g` (stemhebbend) |
| Nasalen | `m n ng` |
| Liquids en glides | `l r j w` |
| Samengesteld | `ch` (= `t` + `sh`), `jh` (= `d` + `zh`) |

Voorbeelden: `ha-lo` (ha lo), `shaet` (shat), `ha-le-lu-ja` wordt in phon `ha-lee-ly-ja`, `mm-ou` (gonzen, dan `ou`).

## Events en spelen

- Eventingang `notes`: `note` (met `dur` in seconden en `vel` 0 tot 1), `noteon` en `noteoff` (aangehouden toetsen; ook een `note` met `held: true`), `panic` en `allnotesoff`. Een `note` zonder `dur` en zonder `noteoff` klinkt door tot `panic` of een transportstop: **een sequencer moet altijd `dur` meesturen**. `vel` 0 telt als `noteoff`. Een `cc` met `id` gelijk aan een veld uit de tabellen (behalve `voices`) en `value` 0 tot 1 zet dat veld lineair over zijn bereik. Een `trig` met `lane: 'restart'` en een `cc` met `id: 'restart'` en `value` boven 0,5 doen een **Restart**.
- Eventingang `lyrics`: een `trig` (of `note`/`noteon`) doet een **Restart** (`pos` wordt 0). Een event `{ type: 'lyrics', text: '…' }` op een van beide poorten zet de tekst. Zo kan een sequencer de zang aan het begin van elke zin opnieuw laten beginnen.
- De knop **Restart** op de kaart doet hetzelfde. De knop **Test** zingt de huidige lettergreep een tel lang (op een toon die bij het stemtype past) en laat `pos` staan. **Alles uit** laat alle stemmen uitklinken.
- Een transportstop laat alle stemmen uitklinken (`release`, hoogstens 0,3 s); `pos` blijft staan.
- `mono`: overlapt een nieuwe noot met de vorige, dan blijft dezelfde stem klinken (legato): toonhoogte en klinker glijden, de nieuwe medeklinkers worden gearticuleerd. Raakt een noot de vorige niet, dan komt er een nieuwe stem (de pitch glijdt dan ook nog als de vorige noot minder dan een seconde geleden eindigde). `poly`: tot 8 noten tegelijk; een negende neemt de oudste over met een korte (20 ms) fade, nooit met een harde stop.
- Modulatie-ingang `mod`: verschuift alle getalvelden behalve `voices` (14 parameters, één spoor Voice). De knoppen blijven de basis. Veranderingen van `size`, `bright`, `level`, `vibRate` en `vibDepth` werken ook op klinkende noten; de rest geldt vanaf de volgende noot.

## Componeren met Formant Singer

Je kunt niet luisteren; ga uit van de regels hieronder.

- **Eén lettergreep per noot.** Schrijf de melodie en de tekst naast elkaar: het aantal lettergrepen is het aantal noten van een zin. Tel de lettergrepen met de regels hierboven (of controleer met de syllabelregel op de kaart). Een tune of song noemt het aantal lettergrepen zodat de melodie er precies zoveel noten voor heeft; zijn er te weinig noten, dan begint de tekst (bij `loop`) in de volgende zin opnieuw, of zwijgt hij (bij `stop`).
- **Lange noten dragen de klinker, korte noten dragen een lettergreep.** Een lange noot (een halve of hele noot, meer dan ongeveer 0,4 s) laat de klinker staan en de medeklinkers zijn een klein deel. Op korte noten (een zestiende, minder dan ongeveer 0,15 s) zijn de medeklinkers hoogstens 35% van de noot (afgekapt); zet daar lettergrepen met één of twee korte medeklinkers (`la`, `te`, `ko`), geen clusters als `strengths`. Voor een noot korter dan 80 ms helpt het `consonants` te verlagen.
- **Velocity.** Hoge velocity (0,8 tot 1) geeft een stevige stem en duidelijke medeklinkers; lage velocity (0,3 tot 0,5) geeft een zachtere stem en zachtere, kortere medeklinkers. Gebruik accenten op beklemtoonde lettergrepen.
- **Melisma.** Wil je één lettergreep over meerdere noten (een versiering, een lange fraze op één klinker), zet dan `_` achter de lettergreep voor elke extra noot: `glo_o_o_ri_a`. De noten mogen dan verschillende toonhoogtes hebben; in `mono` met overlappende noten glijdt de stem (legato). De `_` zingt de laatste klinker (bij een tweeklank de tweede).
- **Woordgrenzen en adem.** Elke spatie is een lettergreepgrens; woorden worden niet apart gemarkeerd. Zet `*` (rust) op een noot waar de zanger adem haalt, of laat in de melodie een gat tussen twee zinnen; een gat in de tijd verandert `pos` niet. Wil je een zin steeds op dezelfde tekst laten beginnen, stuur dan een Restart (`trig` op de eventingang `lyrics`) aan het begin van de zin.
- **Stemtypen per rol.** Lead: `alto` of `tenor`, `mono`, `voices` 1, vibrato 20 tot 30 cent. Koor: `alto`, `tenor` of `bass` met `voices` 4 tot 8, `detune` 10 tot 25, `spread` 0,6 tot 1, `poly` voor akkoorden en een lange `attack`. Bas: `bass` met `size` −2 tot −4, `mono`, korte `release`. Pad: `soprano` of `alto` met `voices` 6 tot 8, `attack` 1 tot 2,5 s, `release` 2 tot 5 s, `breath` 0,2 tot 0,4, klinkers als `a`, `o`, `u` via `fixed` of een tekst als `ooh ahh`. Fluister-effecten: `whisper` met `breath` 1. Robot en effecten: `size` ±6 tot ±10, `vibDepth` 0, `glide` 0, `bright` 0,8 tot 1.
- **Akkoorden.** Een akkoord (noten binnen 30 ms) zingt één lettergreep; bij `poly` klinken alle noten, bij `mono` alleen de laatste. Voor een koorakkoord is `poly` met `voices` 3 tot 5 genoeg; met 8 noten en 8 leden is het veel (de limiet is 8 stemmen).
- **Een tune maken.** Zet de gewenste state (alles uit `getPreset()`) in het pack, met een **originele korte tekst** in `lyrics` die bij de stijl past (geen bestaande songtekst, geen merk- of artiestnamen), en noem in de omschrijving van het pack het aantal lettergrepen dat de melodie moet hebben. Zet geen `pos` in een tune. De klank moet direct speelbaar zijn vanaf een toetsenbord: een tune zonder `fixed` begint bij de eerste lettergreep en loopt de tekst af, daarna volgt `onEnd`.

### Wat je niet moet doen

- Te snelle noten voor lange medeklinkerclusters: een lettergreep als `strengths` op een zestiende wordt in de tijd geperst en onverstaanbaar. De medeklinkers worden afgekapt op 35% van de noot, maar de klinker blijft dan ook kort.
- Lyrics zonder klinkers (`pst`, `ssss`): elke lettergreep zonder klinker krijgt een korte `uh`. Gebruik `mm` voor een gonzende klank en `ooh` of `ahh` voor klinkers.
- `level` of `consonants` 0 en een stil apparaat verwachten: `level` 0 is stil; `consonants` 0 geeft alleen klinkers (bedoeld).
- `attack` langer dan de nootlengte: de noot is voorbij voor hij opkomt. Voor lange attacks heb je lange noten nodig.
- `voices` 8 met `poly` en veel noten tegelijk is zwaar voor de browser (tot 64 oscillatoren); kies voor een koor liever `voices` 3 tot 5.
- `size` 12 of −12 met `bass` of `child`: de formanten komen dan buiten het gangbare bereik en de klinkers worden onherkenbaar (bedoeld als effect).
- `pos` in een tune zetten, of verwachten dat een transportstop `pos` terugzet: gebruik Restart.

## Wat het apparaat met een state doet (getest)

- `setState({})` geeft de standaardwaarden; `setState(getState())` geeft dezelfde state terug; `getPreset()` heeft geen `pos` en `setPreset(getPreset())` geeft dezelfde preset.
- Ongeldige waarden (tekst, `NaN`, `Infinity`, `null`, objecten, een onbekende keuze) geven de standaard; getallen buiten het bereik worden afgekapt (`size: 99` wordt 12, `voices: 3.7` wordt 4, `release: 99` wordt 6); een tekst langer dan 2000 tekens wordt afgekapt; `pos` wordt in het bereik van de tekst gehouden. Onbekende velden worden genegeerd.
- Twee renders met dezelfde state en events zijn gelijk op afrondingsverschillen na (grootste verschil 1,5 · 10⁻⁶, dus −116 dB): de browser telt de ingangen van een node in een wisselende volgorde op, en daardoor is het niet bit-identiek (aangetoond met vijf oscillatoren in één gain). Alle ruis komt uit een vaste reeks (geen `Math.random`).

## Bewaker

Alle ingangen zijn eindig en begrensd: noten 0 tot 127, velocity 0 tot 1, tijden groter dan 0 (en hoogstens 2 minuten vooruit), elke formant tussen 70 Hz en 0,9 keer de halve samplefrequentie, Q tussen 0,5 en 40. Een filter dat toch `NaN` of `Infinity` krijgt, houdt dat voor altijd vast (en vergiftigt alles daarachter), dus bewaakt een `AnalyserNode` elke 50 ms de ruwe som van alle stemmen en de uitgang. Is een sample niet eindig of groter dan 100 (normaal onder 1), dan worden alle stemmen (met hun formantfilters) en de uitgangsvervormer vervangen. De timer staat uit in een `OfflineAudioContext`. Een stoot `NaN` of `Infinity` (2 ms) in een formantfilter gaf zonder bewaker voor altijd `NaN` uit en een nieuwe noot bleef `NaN` geven; met de bewaker was de uitgang na ongeveer 40 ms weer eindig en klonk een nieuwe noot normaal. Een stoot van 1e30 laat de bewaker de stem weghalen (die noot houdt op; de volgende klinkt weer).

## Een tune

Een pack heet `naam.patchkamer-tunes.json` en staat in `../../../tunes/`. Voor dit apparaat is `device` altijd `nl.patchkamer.formantsinger` en elke tune is `kind: "set"` met een `state` als `getPreset()` (alle velden hierboven behalve `pos`).

```json
{ "name": "Choir Ah", "kind": "set", "version": "1.0.0",
  "state": { "lyrics": "ooh _ _ _ ah _ _ _", "lang": "en", "voice": "alto", "size": 0, "vowel": "a", "fixed": false,
             "mode": "poly", "onEnd": "loop", "voices": 6, "detune": 14, "spread": 0.9, "breath": 0.25, "bright": 0.45,
             "vibRate": 5.2, "vibDepth": 18, "vibDelay": 0.6, "glide": 0.1, "attack": 1.2, "release": 2.5,
             "consonants": 0.5, "onset": 60, "level": 0.6 } }
```

Zet liever alle velden erin: dan klinkt de tune hetzelfde als de startwaarden ooit veranderen. Zet geen merknamen van bestaande apparatuur of artiesten in naam, tekst of omschrijving.

## Controleren

- Draai vanuit de root van de repo: `node contract/validate-instrument.mjs devices/synths/FormantSinger/formant-singer.patchkamer-device.js` (en met `--lang en`). Dat moet `OK` geven, zonder `let op`.
- Je kunt niet horen hoe een tune klinkt. Heb je een browser, laad dan de host (`../../../patchkamer/AGENTS.md`) en kies de tune. Heb je geen browser, schrijf dan in je oplevering dat de tune **niet beluisterd** is.
- Alle tekst in het apparaat staat in het woordenboek `EN` bovenin het bestand (Nederlandse bron, Engels via `host.lang`). Een nieuwe tekst krijgt altijd nl én en.
- De kaart gebruikt eigen schuiven; dubbelklik op een schuif zet hem terug op de beginwaarde, en het getal naast de schuif wordt direct bijgewerkt.

## Wat je niet doet

- Verander nooit de `id`, de `kind`, de poort-id's of de namen van state-velden.
- Pas het apparaat niet aan om een tune te laten kloppen.
- Commit of push niet, tenzij de opdracht dat vraagt.

## Documentatie en songs

Dit zijn de plaatsen waar je terechtkunt voor documentatie en voor het componeren van songs met dit apparaat. Songs zijn CC-BY-4.0, tunes en presets CC0-1.0, het apparaat AGPL-3.0-or-later.

- Algemene handleiding van de synths: [NL](../../../docs/synths/USER-MANUAL_NL.md#formant-singer) · [EN](../../../docs/synths/USER-MANUAL_EN.md#formant-singer). Overzicht van de soort: [README](../README.md).
- Tunes (klanken, `kind: set`): [formant-singer-styles.patchkamer-tunes.json](../../../tunes/formant-singer-styles.patchkamer-tunes.json). Kies een tune als beginpunt voor de `state` van dit apparaat in de song; velden die de tune niet noemt krijgen hun standaard. Hoe tunes zijn opgebouwd: [tunes/AGENTS.md](../../../tunes/AGENTS.md).
- Overzicht van alle apparaten en hun signaalketens: [devices/AGENTS.md](../../../devices/AGENTS.md). Een song componeren: [songs/AGENTS.md](../../../songs/AGENTS.md); muziektheorie (nootnummers, akkoorden, melodie): [songs/MUSIC-THEORY.md](../../../songs/MUSIC-THEORY.md).
- Route voor agents: [soort Synths](../AGENTS.md) → [devices/AGENTS.md](../../AGENTS.md) → [root AGENTS.md](../../../AGENTS.md). Contract: [NL](../../../contract/PATCHKAMER-CONTRACT_NL.md) · [EN](../../../contract/PATCHKAMER-CONTRACT_EN.md). Hoe tunes van dit apparaat zijn opgebouwd: [tunes/AGENTS.md](../../../tunes/AGENTS.md). <!-- agents-tree -->
- Rol in een song: zangstem, koor of pad. Noten op `notes` (één lettergreep per noot), eventueel een Restart op `lyrics`, audio uit `out` (stereo). Stuur hem met een melodiesequencer die `dur` meestuurt, en zet in de tune `lyrics` die bij het aantal noten van de melodie passen.
