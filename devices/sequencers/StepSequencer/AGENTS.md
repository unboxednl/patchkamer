# AGENTS.md: Step Sequencer

Dit bestand is voor AI-agents die dit apparaat configureren, er presets voor maken of er muziek mee **componeren**. Het is niet geschreven voor mensen. Het hoort bij `../../../AGENTS.md` (algemeen); lees die eerst. Hier staat wat alleen voor Step Sequencer geldt.

## Wat Step Sequencer is

Een monofone stap-sequencer: één patroon van 1 tot 64 stappen dat noten als gebeurtenissen naar één uitgang stuurt (verbind die met een synth, drone of drumcomputer). Het maakt **zelf geen geluid**. Elke stap heeft een noot (of een rust), een velocity, een lengte en een kleine tijdverschuiving. Het raster is 1/16, 1/32 of 1/64. Swing en humanize zijn optioneel. Er is één notenpoort **in**: een toetsenbord (Keys) of een andere notenbron die daarop zit, wordt meteen doorgegeven aan de uitgang en kan in het patroon worden opgenomen.

| | |
|---|---|
| Bestand | `step-sequencer.patchkamer-device.js` (in deze map) |
| `id` | `nl.patchkamer.seq` (gelijk gebleven; het apparaat heette `Sequencer`). Verander die nooit: daaraan hangen presets en songs |
| Naam | `Step Sequencer`; de poortnamen hebben een Nederlandse variant (`Noten in`, `Noten`) via `i18n` |
| Soort | `utility` (categorie `sequencer`): dit apparaat krijgt dus **presets** (geen tunes) |
| Poorten | eventingang `in` (Notes in), eventuitgang `notes` (Notes); geen audio, geen modulatie |
| Contract | v1.17 (apparaatversie 1.18.0) |
| Licentie apparaat | AGPL-3.0-or-later |

Presets: `../../../presets/step-sequencer.patchkamer-presets.json` (70 patronen in zes mappen).

## Opslagformaat: de rastereenheid

Alle lijsten hebben **altijd 64 plaatsen** (stap 0 … 63). Alleen de eerste `len` stappen spelen. **Eén stap is één rasterstap**, de fijnste eenheid van het patroon; de klok van de studio geeft zestiende noten:

| `res` | Rasterstap | Stappen per zestiende | Stappen per maat (4/4) |
|---|---|---|---|
| 16 | 1/16 | 1 | 16 |
| 32 | 1/32 | 2 | 32 |
| 64 | 1/64 | 4 | 64 |

Een patroon van `len` 16 bij `res` 16 is één maat. Dezelfde 16 stappen bij `res` 32 zijn twee tellen (8 zestiende noten), bij `res` 64 één tel. Verander je `res` van een bestaand patroon, dan blijven de stappen staan en loopt het dus 2× of 4× zo snel. Wil je dezelfde muziek op een fijner raster, schrijf de stappen dan opnieuw (elke oude stap wordt 2 of 4 stappen: de noot op de eerste, de rest rust, en `ln` × 2 of × 4).

De positie in het patroon volgt de teller van de studio (`bar` × 16 + `step`), dus een patroon van 24 stappen bij `res` 16 loopt over de maatgrenzen heen en begint pas na 24 zestiende noten opnieuw (ongeveer anderhalve maat). Dat is bedoeld voor polymetrie.

## De state

`getPreset()` geeft `getState()` zonder `rec`, `view` en `cur` (werkstand). Een preset laat `rec` en `cur` bij het laden staan; de weergave springt zelf naar het toonbereik van het patroon.

| Veld | Wat | Bereik | Start |
|---|---|---|---|
| `n` | 64 getallen: MIDI-noot per stap, `-1` = rust | `-1` of 12 … 108 (afgerond) | het beginpatroon (hieronder) |
| `acc` | 64 getallen: accent, 0 of 1. Telt alleen als `vel` van die stap 0 is (dan is de velocity 1 in plaats van 0,7) | 0 of 1 | zie beginpatroon |
| `vel` | 64 getallen: velocity per stap. `0` = automatisch (0,7, of 1 bij `acc`) | 0 of 0,05 … 1 | alles 0 |
| `ln` | 64 getallen: lengte per stap in **rasterstappen**. `0` = de globale `gate` van één rasterstap | 0 of 0,1 … 64 | alles 0 |
| `mt` | 64 getallen: tijdverschuiving per stap in rasterstappen (negatief = eerder, positief = later) | −0,5 … 0,5 | alles 0 |
| `gate` | Globale nootlengte als deel van één rasterstap, voor stappen met `ln` 0 | 0,1 … 1 | 0,6 |
| `oct` | Octaafverschuiving bij het spelen | −1, 0 of 1 | 0 |
| `len` | Patroonlengte in stappen | 1 … 64 (geheel) | 16 |
| `res` | Raster: 16, 32 of 64 | 16, 32 of 64 | 16 |
| `swing` | Patroonswing (ongewijzigd): elke tweede rasterstap (oneven positie) later, als deel van een rasterstap | 0 … 0,6 | 0 |
| `rowSwing` | Swing per rij (sinds 1.14.1): object `{"<nootnummer>": swing}` met swing in zestienden (0 … 0,5); alleen waarden boven 0 worden bewaard, onzin valt weg | object, 0 … 0,5 per nootnummer 0 … 127 | `{}` |
| `humT` | Humanize tijd: willekeurige afwijking tot ± `humT` × een halve rasterstap | 0 … 1 | 0 |
| `humV` | Humanize velocity: afwijking tot ± `humV` × 0,3 | 0 … 1 | 0 |
| `seed` | Zaad van humanize (dezelfde seed geeft elke ronde dezelfde afwijkingen) | 0 … 65535 | 1 |
| `quant` | Opnemen: `true` zet de noot op de dichtstbijzijnde rasterstap, `false` bewaart de afwijking in `mt` | `true`/`false` | `true` |
| `thru` | Noten op de ingang gaan meteen door naar de uitgang | `true`/`false` | `true` |
| `rec` | Opname/invoer aan (werkstand) | `true`/`false` | `false` |
| `view` | Laagste noot van het zichtbare toonbereik (werkstand, 25 halve tonen) | 0 … 103 | volgt het patroon |
| `cur` | Invoerpositie voor stap-voor-stap invoer (werkstand) | 0 … `len` − 1 | 0 |

Beginpatroon (de state van het oude apparaat): `n` begint met `[45,-1,45,48,-1,45,52,-1,45,-1,43,45,-1,48,-1,52]` (de rest -1), `acc` met `[1,0,0,0,0,0,1,0,0,0,0,1,0,0,0,0]` (de rest 0), `gate` 0,6, `oct` 0. Een oude state (`n`, `acc`, `gate`, `oct`) laadt en klinkt **identiek**.

Een ontbrekend veld krijgt de standaard; een lijst met ontbrekende of ongeldige plaatsen krijgt voor die plaatsen de standaard van die plaats (voor `n` en `acc` is dat in stap 0 … 15 het beginpatroon, daarna rust). Getallen buiten het bereik worden afgekapt; `NaN`, `null`, tekst geven de standaard. **Geef daarom altijd alle 64 plaatsen op** (of begin elke lijst met de gewenste stappen en vul aan met `-1` of `0`), zodat er niets van het beginpatroon achterblijft. Een lijst die korter is dan 64 laat achterstallige plaatsen het beginpatroon (`n`, `acc`) of 0 (de rest) krijgen.

### Wat het uitstuurt

Per rasterstap waar `n` ≥ 0 is: `{ type: 'note', note, vel, time, dur }` op poort `notes`.

- `note` = `n` + 12 × `oct`, afgekapt op 0 … 127.
- `vel` = `vel` als die > 0 is, anders 1 bij `acc` en anders 0,7; plus humanize; afgekapt op 0,02 … 1.
- `time` = begin van de rasterstap + `mt` × rasterstap + swing + humanize (swing/humanize alleen als ze > 0 zijn; niet eerder dan een halve rasterstap vóór de stap).
- `dur` (seconden) = rasterstap × `ln` als `ln` > 0, anders rasterstap × `gate`. Een rasterstap duurt (zestiende noot) / (`res` / 16) seconden, dus volgt het tempo van de studio.

## Componeren met dit apparaat

Dit is **één monofone stem**: één noot per stap. Meerdere stemmen (akkoord, bas én melodie) doe je met meerdere Step Sequencers, elk op een eigen synth. Voor akkoorden gebruik je Chord Sequencer.

### Timing: positie in het patroon

Positie = index in `n`. Bij `res` 16 en `len` 16: index 0 = tel 1, 4 = tel 2, 8 = tel 3, 12 = tel 4; de oneven stappen zijn de "e" en "a", de stappen 2, 6, 10, 14 de achtsten tussendoor (de "en"). Kies `len` voor de vorm: 16 = één maat, 32 = twee maten (vraag-antwoord), 64 = vier maten (akkoordwisselingen), 12 = 3/4 of 6/8, 5 en 7 voor polymetrie tegen een ander spoor van 16.

### Toonlengte (`ln`, `gate`)

- Korte staccato: `ln` 0 met `gate` 0,2 … 0,4, of `ln` 0,5 (een halve rasterstap).
- Standaard: `ln` 0 en `gate` 0,5 … 0,7.
- Gebonden (legato): `ln` gelijk aan de afstand tot de volgende noot (bijvoorbeeld `ln` 2 als de volgende noot twee stappen later komt) of iets meer (1,05 × afstand) voor overlap op een monofone synth met glide.
- Lang: `ln` 4 (een tel bij `res` 16), 8 (halve maat), 16 (hele maat) voor bas, pedaalnoten en pads. Hele noot bij 4/4 = 16 stappen bij `res` 16 (of 64 bij `res` 64).
- Rasterkeuze: 1/32 voor rolls, grace notes en vlugge arpeggio's; 1/64 voor trillers en het allersnelste (een tel = 16 stappen). Gebruik 1/16 zolang je met zestienden toekomt: dat is overzichtelijker.
- Fouten: `ln` dat voorbij de volgende noot loopt op een synth zonder glide (de noten overlappen en hangen aan elkaar); een `ln` groter dan `len` (het stuk wordt nooit stil afgesloten); een `ln` van 0,1 (hoor je niet).

### Velocity (`vel`)

Gebruik altijd een `vel` per noot, dat klinkt levend. Richtlijnen:

- Accent: 0,95 … 1. Normaal: 0,7 … 0,85. Zacht: 0,5 … 0,6. Ghost note: 0,25 … 0,45 (een korte noot, `gate` 0,25).
- Zware tel (1) 1,0; tel 3 0,85; tellen 2 en 4 0,75; de "en" 0,7; de "e"/"a" 0,5 … 0,6: dat is een natuurlijk ritme.
- Crescendo: velocities die over 8 … 16 stappen stijgen (0,3 → 1,0). Decrescendo: dalend. Een roll bij `res` 32 met oplopende velocity is een klassieke fill.
- Mensachtige variatie: `humV` 0,1 … 0,3 en `humT` 0,05 … 0,25 met een vaste `seed`; voor strakke elektronische muziek houd je beide op 0.
- `vel` nooit 0 voor een noot die moet klinken (0 betekent automatisch; een rust zet je met `n` = -1). Geen `vel` boven 1.

### Per genre en rol

- **Bas**: `n` 28 … 45, `ln` 1 … 4 of gate 0,4 … 0,7; octaafsprongen voor disco; ghost notes voor funk; één noot per tel voor walking bass. Voorbeelden in de map `Bass Lines` van het pack.
- **Arpeggio**: noten van een akkoord, om de stap; `gate` 0,4 … 0,6 voor tokkelen; `ln` 2 voor legato; velocity accent op de eerste noot van elke groep.
- **Drumachtige triggers**: één geluid per sequencer; kies het nootnummer van het geluid in de drumcomputer (General MIDI-nummers: 36 kick, 38 snare, 39 klap, 37 rim, 42 gesloten hihat, 46 open hihat, 45/48/50 toms). Hihats met velocity 100/40/70/40 over zestienden; rolls bij `res` 32 of 64.
- **Melodiehaak**: 8 … 16 noten uit een toonladder; ritme met rust en lange noten afgewisseld; een herhaling met een kleine variatie in het tweede deel van `len` 32.
- **Pads en lange noten**: `ln` 8 … 16, `gate` 1, lage velocity; geen swing.
- **Swing**: `swing` 0,2 … 0,35 voor shuffle en hiphop, tot 0,5 voor blues. Swing werkt op elke tweede rasterstap, dus bij `res` 16 op de oneven zestienden.

### Voorbeeld: een basfiguur met accenten, lengtes en ghost notes (één maat, 1/16)

Alleen de eerste 16 plaatsen zijn hier getoond; **jij schrijft 64 plaatsen** (de rest `-1`, resp. `0`):

```json
{
  "len": 16, "res": 16, "gate": 0.45, "oct": 0, "swing": 0, "humT": 0, "humV": 0,
  "n":   [28, -1, 40, 28, -1, 28, 31, -1, -1, 28, -1, 33, -1, 31, 40, -1],
  "vel": [1,   0, 0.4, 0.55, 0, 0.9, 0.7, 0, 0, 1, 0, 0.85, 0, 0.6, 0.35, 0],
  "ln":  [2,   0, 0,  0,   0, 1.5, 0,   0, 0, 2, 0, 1,    0, 0,   0,    0],
  "acc": [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], "mt": [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
}
```

(Tel 1 en 3 hebben accent en lengte; de stappen met 0,35 … 0,4 zijn ghost notes op een octaaf hoger, met de gewone korte `gate`.)

### Voorbeeld: een roll op 1/32 met crescendo (één tel, 16 stappen op `res` 32)

`"res": 32, "len": 16`, `n` overal 38, `vel` `[0.25, 0.3, 0.34, 0.38, 0.42, 0.46, 0.5, 0.55, 0.6, 0.66, 0.72, 0.78, 0.85, 0.92, 0.98, 1]`, `gate` 0,5, `ln` overal 0.

### Opbouw en structuur

Een patroon is één loop. Voor een nummer zet je meerdere sequencers naast elkaar op **dezelfde klok** en bouw je de structuur op met presets en het aan- en uitzetten van sporen (mixer), niet met een lang patroon. Handige verhoudingen: een `len` van 16 (één maat) onder een `len` van 64 (vier maten akkoorden) of 12/24 voor een kruisritme. Voor liedstructuur (couplet, refrein, break) gebruik je de scènes van de clip-sequencer waar die beschikbaar is; dit apparaat heeft zelf geen scènes.

### Fouten die je niet moet maken

- Minder dan 64 plaatsen per lijst geven, of vergeten `-1` te zetten: het beginpatroon (`n` stap 0 … 15) blijft dan staan en klinkt, tot `len`.
- Noten buiten de bedoelde `len` zetten (alleen stappen < `len` spelen).
- `vel` 0 voor een noot, of `vel` > 1 (wordt afgekapt).
- Een `ln` die over de volgende noot heen loopt zonder dat de synth dat aankan; een `len` die niet bij `res` past (bijvoorbeeld 16 stappen bij `res` 64 is maar één tel).
- Meer dan één noot per stap proberen: er is één plaats per stap. Voor twee gelijktijdige noten gebruik je twee sequencers.
- `res` veranderen zonder de stappen te herschrijven (het patroon loopt dan 2× of 4× zo snel).
- `rec`, `view` of `cur` in een preset zetten, of kabels beschrijven (die horen niet in de state).

## Live spelen en inspelen

- **Doorgeven.** Een toetsenbord op de ingang `in` gaat, met `thru` aan, rechtstreeks naar de uitgang `notes`, dus naar de synth die daaraan hangt, met velocity en met de juiste toonlengte: een aanslag met `held: true` (Keys in vasthoudmodus) wordt doorgegeven met zijn `noteoff`, een puls (vaste `dur`) met die `dur`. `allnotesoff` en `cc` (bijvoorbeeld pitchbend) gaan mee. Bij `thru` uit, bij `setState`, bij vernietigen en bij een `allnotesoff` worden hangende noten netjes afgesloten.
- **Dubbel spelen.** Staat het toetsenbord óók rechtstreeks met de synth verbonden, dan klinkt elke noot twee keer. Dat is een keuze van de gebruiker; het apparaat voorkomt het niet. Dit apparaat heeft één spoor, dus het "geselecteerde spoor" is altijd de uitgang `notes`.
- **Inspelen (`rec`).** Loopt de klok, dan schrijft elke aanslag zijn noot in de stap die het dichtst bij de aanslag ligt (`quant` aan) of in dezelfde stap met de afwijking in `mt` (`quant` uit). Sinds 1.14.1 is dat het dichtstbijzijnde **geswingde** punt: de host-swing, de patroonswing `swing` en de `rowSwing` van de gespeelde noot tellen mee, zodat een aanslag niet naar een buurstap springt; bij `quant` uit wordt `mt` de afwijking tegen dat geswingde punt, dus de noot klinkt op het moment van de aanslag. Een aanslag die meer dan een zestiende buiten de geplande stappen valt, of een niet-eindige noot, tijd of velocity, schrijft niets. Een aanslag met een echte `dur` (geen vasthouden) zet `ln` op die duur in rasterstappen als dat er minstens 2 zijn; korter laat `ln` 0 (de `gate` geldt). Er is geen undo in dit apparaat. De velocity van de aanslag wordt `vel`, `acc` en `ln` van die stap worden gewist. In vasthoudmodus (`held`) wordt `ln` de duur tot de `noteoff`, afgerond op rasterstappen (minstens één); bij een puls blijft `ln` 0 (de `gate` geldt). Bestaat die stap al, dan wordt hij overschreven.
- **Stap-voor-stap invoer.** Staat de klok stil en `rec` aan, dan schrijft elke aanslag in de stap `cur` en schuift `cur` één op (rondlopend binnen `len`). Klik in de ruler (onderaan de rol) om `cur` te zetten.
- Maximaal één opgenomen noot per stap: een nieuwe noot op dezelfde stap vervangt de oude, ook van een andere rij (met een drumcomputer speel je dus één klank per stap; voor akkoorden of meerdere klanken tegelijk gebruik je één Step Sequencer per klank of een Pattern Tracker).

## Swing per niveau (sinds 1.14.1)

Een Step Sequencer heeft één patroon en één lijn, dus de niveaus zijn: patroon (`swing`, bestond al) en rij (`rowSwing`, nieuw). Er is geen clip- of spoorniveau.

- **Eenheid.** `rowSwing` is een deel van een zestiende (0 … 0,5), zoals de swingschuif van de host. De bestaande patroon-`swing` is een deel van een *rasterstap* en werkt op elke tweede rasterstap; dat gedrag is niet veranderd (bij `res` 16 is een rasterstap een zestiende).
- **Welke noten.** `rowSwing` vertraagt elke noot van die rij waarvan de zestiende (naar beneden afgerond) oneven is, met `swing × stepDur`. Bij raster 1/32 of 1/64 schuiven alle subrasterstappen van een oneven zestiende als geheel mee; even zestienden blijven staan. Een vertraagde noot behoudt zijn lengte.
- **Optellen.** De host-swing zit al in de kloktijd. Het rijdeel komt erbij en wordt zo begrensd dat patroonswing (als die op dezelfde noot werkt, omgerekend naar zestienden) plus rijdeel hoogstens 0,5 blijft; de patroonswing zelf wordt niet begrensd, dus een bestaande state klinkt gelijk.
- **UI.** Onder de eerste knoppenrij staan een keuze **Rij** (de klanken van de drumcomputer, anders de 25 toonhoogten in beeld) en de schuif **Rij-swing** (0 … 50 %, dubbelklik = 0).
- Humanize blijft werken zoals voorheen.

## De editor

De pianorol toont de stappen als blokjes: **breedte = lengte** (`ln` of `gate`), **hoogte = velocity**, **hoogte in de rol = toon**. Onder de rol staan een accentrij en een **velocity-strook** (balkhoogte = velocity). Klik in de rol zet een noot, klik op een bestaande noot haalt hem weg, sleep zet een reeks, sleep de rechterrand van een blokje wijzigt de lengte, klik of sleep in de strook wijzigt de velocity (accent zet de velocity weer op automatisch). Boven staan raster, lengte, octaaf, gate, swing en humanize; verder opnemen, kwantiseren, doorgeven, schuiven (◀ ▶), transponeren (±1, ±12), verdubbelen (kopieert het patroon naar de tweede helft) en wissen. Bij `len` boven 32 verschijnen paginaknoppen.

## Wat het apparaat met een state doet (getest)

- `setState({})` geeft de startwaarden, `setState(getState())` en `setPreset(getPreset())` geven dezelfde state terug; ongeldige waarden (`NaN`, `Infinity`, tekst, `null`, buiten het bereik, kapotte lijsten) geven de standaard of worden afgekapt, geen uitzondering (300 willekeurige runs met rommel in state, klok en ingang: alleen eindige noten 0 … 127, velocity 0 … 1, duur > 0).
- Oud en nieuw bestand gaven bij 200 willekeurige oude states (en een tot drie maten klok) exact dezelfde gebeurtenissen (4477 stuks).
- Raster 1/32 en 1/64 geven 2 en 4 gebeurtenissen per zestiende noot op de juiste tijden en duren; `ln`, `vel` en `mt` per stap kloppen; humanize is deterministisch; opnemen met en zonder kwantiseren, met vasthouden en stap-voor-stap invoer, en doorgeven werken.
- De editor (klikken, slepen, lengte, velocity, accent, raster, verdubbelen) is in een echte browser getest; de kaart volgt `setState`.
- 1.14.1: met `rowSwing` leeg gaven oud en nieuw bij 120 willekeurige states (80 stappen elk, raster 1/16, 1/32, 1/64; 11.795 gebeurtenissen) 0 verschillen; `getState` kreeg alleen de sleutel `rowSwing` erbij. Rij-swing, kwantiseren naar het geswingde raster (jitter), `quant` uit, opname uit, klok stil, onzin-gebeurtenissen en de lijst van 27 klanken in de echte host (nl en en) zijn getest.
- 1.17.0: met de drie nieuwe methoden gaven oud (1.14.1) en nieuw bij 120 willekeurige en ongeldige states (klok, preset, gebeurtenissen, ook met een drumlijst aan de uitgang, in nl en en) exact dezelfde gebeurtenissen, `getState` en `getPreset` (0 afwijkingen).
- Niet beluisterd; er is geen echte synth of MIDI-toetsenbord aangesloten getest.

## Klembord: patroon kopiëren en plakken (sinds 1.17.0)

De host kopieert en plakt het patroon met de knoppen Kopieer en Plak in de kaartbalk en met Ctrl/Cmd+C en Ctrl/Cmd+V. Het apparaat doet daar drie dingen voor (contract v1.17, formaat `patchkamer-clip`, formatVersion 1; tijd in **tikken**, 12 per zestiende, dus 192 per maat). Ze veranderen niets aan `getState()`, de presets of het geluid.

| Methode | Wat |
|---|---|
| `clipInfo()` | Licht en dynamisch, gooit nooit, `null` na `destroy`. Zonder drumcomputer aan de uitgang: `copy` en `paste` zijn `['notes']`. Met een drumcomputer (`noteNames()`): `['drums']` en `lanes` zijn de benoemde klanken van dat apparaat (`id` `n<nootnummer>`, `type` leeg). Verder `length` (`min` 3, `max` 768, `step` 3 tikken; `shared` onwaar), `grid` `[16, 32, 64]`, `poly` 1 (mono), `range` `[12, 108]`, `vel` `continuous`, `prob` en `ratchet` onwaar, `maxEvents` 64. |
| `getClip()` | Het patroon als `patchkamer-clip` of `null`. `notes`: `t` (tik; microtiming `mt` zit erin verwerkt), `n` (zoals opgeslagen, zonder `oct`), `len` (`ln` of `gate`, hoogstens tot het einde van het patroon), `vel` (automatisch = 0,7 of 1 bij accent) en `acc`. `drums`: dezelfde tijden als `hits` met een `lane`-index in `lanes` (de klanken, plus noten in het patroon die het apparaat niet kent). `grid` is `res`; `swing` (hoogstens 0,5 zestiende) volgt de patroon-swing. `native` bevat het hele patroon voor een verliesvrije terugkeer. |
| `setClip(clip)` | Zet `n`, `acc`, `vel`, `ln`, `mt`, `len` en `res` en laat al het andere staan (`gate`, `oct`, `swing`, `rowSwing`, humanize, `thru`, `rec`, `view`, `cur`, de pagina). Geeft `{ ok: true }` (met `dropped`: het aantal weggelaten noten, alleen als dat er is) of `{ ok: false, reason }` in de taal van de host. Gooit nooit en zet niets half: bij een weigering blijft de state gelijk. Stuurt zelf geen gebeurtenissen. |

Wat `setClip` doet, in volgorde:

1. **Controle.** Het formaat moet `patchkamer-clip` zijn (formatVersion ontbreekt of is 1), `kind` moet passen bij het apparaat nu (`notes` of `drums`; een soortverschil wordt geweigerd) en `length` moet een getal zijn. Alles wordt geklemd: `length` 1 tot 12288 tikken, hoogstens 4096 gebeurtenissen (de rest telt als weggelaten), `t` binnen de lengte, `n` 0 tot 127, `vel` 0,01 tot 1. Gebeurtenissen met onzin (`NaN`, geen getal, een baan die niet bestaat) vallen weg. Onbekende velden worden genegeerd.
2. **Raster.** `grid` is een voorkeur. Het apparaat neemt dat raster als alle tijden erop passen en de lengte binnen 64 stappen blijft; anders het dichtstbijzijnde raster waarop wel alles past; past niets precies, dan het raster waarbij de minste noten samenvallen en de afrondingen het kleinst zijn. De host kiest dit zelf al; het apparaat klemt voor de zekerheid.
3. **Lengte.** `len` = `length` omhoog afgerond op hele rasterstappen, hoogstens 64. Noten voorbij het einde vallen weg.
4. **Mono.** Per rasterstap blijft de hardste noot (bij gelijke velocity de eerste); de rest telt mee in `dropped`. Een noot die tussen twee stappen valt, gaat naar de dichtstbijzijnde stap met de afwijking in `mt` (hoogstens ± een halve stap); een noot precies tussen twee stappen kiest een vrije buur. De host doet deze reductie ook al en meldt die; het apparaat doet haar nog eens.
5. **Bereik.** Noten buiten 12 tot 108 gaan per octaaf naar binnen (de toonhoogte blijft).
6. **Velocity, accent, lengte.** Accent met velocity 1 wordt `acc` 1 met `vel` 0 (automatisch); velocity 0,7 zonder accent wordt `vel` 0 (automatisch, klinkt gelijk). Een lengte gelijk aan de gate wordt `ln` 0. Kans en ratchet kent dit apparaat niet; ze worden genegeerd. Bij `drums` is er geen lengte in de clip: `ln` wordt 0 (de gate).
7. **Drums.** De noot van een slag is de `note` van de baan (`lanes[hit.lane].note`); de host heeft de banen al op de klanken van dit apparaat uitgelijnd.
8. **Eigen clip.** Hoort `native.device` bij dit apparaat en komt de clip nog overeen met het patroon in `native` (zelfde noten, velocity en accent; tijden en lengtes hoogstens een halve rasterstap verschoven, want de host zet de tijden op het raster van het doel), dan komt het eigen patroon **exact** terug, ook de stappen voorbij `len` en de fijne timing. Is de clip echt aangepast (andere noten, lengte, mono-reductie), dan geldt stap 1 tot en met 7.
9. **Weergave.** Alleen als het patroon echt verandert: de kaart wordt opnieuw opgebouwd (lengte, raster en pagina's volgen), `cur` en de pagina blijven binnen `len`, en de zichtbare toonhoogtes springen alleen mee als de nieuwe noten buiten beeld vallen. Een clip die het patroon niet verandert, doet niets.

Er is geen undo in het apparaat. De host maakt vóór het plakken een momentopname met `getState()` en zet die terug met `setState` (toast Ongedaan maken, Ctrl+Z).

Getest met een nep-host in Node: de rondreis `setClip(getClip())` laat `getState()` gelijk in 600 willekeurige states (300 voor `notes` en 300 voor `drums`, ook via JSON-tekst), ook zonder `native` blijven tijd en toonhoogte gelijk; ongeldige en extreme clips (`NaN`, `Infinity`, lengtes tot 1e9, 100000 noten, onbekende velden, verkeerde soort) geven geen fout en laten de state intact of binnen het bereik; kopiëren naar Clip Arranger en terug behoudt noten en lengte voor zover het formaat het toelaat (accent en kans niet). Niet beluisterd.

## Skins

Regelaars zijn sinds 1.20.0 via `host.ui.adopt` herkenbaar voor skins (id = state- of spoorsleutel: res, len, oct, gate, swing, humT, humV, row, rowSwing; rol `param` of `select`; groep `pattern` en `row`). Zonder skin is er niets veranderd. De meegeleverde skin `Compact` staat in `../../../skins/library/nl.patchkamer.seq/` (draaiknoppen met de naam eronder, per groep een kader, geen uitlegtekst; ongeveer 580 x 546 punten tegenover 880 x 727). Het rolcanvas (pianorol, accenten, velocity-strook) is ongewijzigd en blijft de hoogte van de standaardkaart; bij 32 stappen zijn de stappen in de rol ongeveer 15 punten breed. De kaartkop (met Kopieer/Plak) is minstens ongeveer 576 punten breed, daarom is de skin 580 breed. De opbouw van de rijen `.row` (drie: instellingen, rij en rij-swing, knoppen) en `.pager` staat in de skin; controleer de skin als je die wijzigt.

## Controleren

- `node contract/validate-instrument.mjs devices/sequencers/StepSequencer/step-sequencer.patchkamer-device.js --lang nl` en `--lang en`, vanuit de root. Beide moeten `OK` geven, zonder `let op`.
- Alle tekst staat in het woordenboek `EN` bovenin het bestand. Een nieuwe tekst krijgt altijd nl én en.

## Wat je niet doet

- Verander nooit de `id`, de `kind`, de poort-id's of de namen van state-velden.
- Pas het apparaat niet aan om een preset te laten kloppen. Zet geen merknamen in naam of omschrijving.
- Commit of push niet, tenzij de opdracht dat vraagt.

## Een drumcomputer aan de uitgang

Hangt er via de notenkabel een apparaat met `noteNames()` aan (Drum Kit, Pulse Drums, Click Synth, Latin Percussion; contract v1.14), dan is elke rij van de rol een klank met zijn naam, in de volgorde van dat apparaat (de eerste kabel met een lijst telt). Dit is alleen weergave: in `n` staan nog steeds absolute nootnummers, er komt niets bij in de state en een preset verandert niet. Noten in het patroon die het apparaat niet kent, blijven als rij met het nootnummer en een vraagteken. De lijst mag tot 64 rijen bevatten (Pulse Drums heeft er 27 met alle instrumenten uit de instrumentkeuze); met meer dan 25 rijen wordt de rol hoger (11 pixels per rij) in plaats van de lijst af te kappen, en met 25 of minder is hij zoals altijd. Afspelen gebruikt het nootnummer uit `n` (met `oct` erbij: houd `oct` op 0 bij een drumcomputer); nootnummers buiten 12 … 108 worden bij het laden nog steeds begrensd. Een Step Sequencer heeft één noot per stap; voor een drumstel met meer klanken tegelijk gebruik je één per klank of een Pattern Tracker.

## Documentatie en songs

Dit zijn de plaatsen waar je terechtkunt voor documentatie en voor het componeren van songs met dit apparaat. Songs zijn CC-BY-4.0, tunes en presets CC0-1.0, het apparaat AGPL-3.0-or-later.

- Handleiding van Step Sequencer: [NL](../../../docs/sequencers/USER-MANUAL_NL.md#step-sequencer) · [EN](../../../docs/sequencers/USER-MANUAL_EN.md#step-sequencer).
- Overzicht van de soort: [README](../README.md); handleiding van de hele soort: [NL](../../../docs/sequencers/USER-MANUAL_NL.md) · [EN](../../../docs/sequencers/USER-MANUAL_EN.md).
- Presets (patronen en instellingen, `kind: set`): [step-sequencer.patchkamer-presets.json](../../../presets/step-sequencer.patchkamer-presets.json). Kies een preset als beginpunt voor de `state` van dit apparaat in de song; velden die de preset niet noemt krijgen hun standaard.
- Sequencers in het algemeen (raster, velocity, lengte, timing, accenten): [NL](../../../docs/sequencers/USER-MANUAL_NL.md#wat-de-sequencers-gemeen-hebben) · [EN](../../../docs/sequencers/USER-MANUAL_EN.md#what-the-sequencers-have-in-common). Muziektheorie vertaald naar waarden: [songs/MUSIC-THEORY.md](../../../songs/MUSIC-THEORY.md).
- Overzicht van alle apparaten en hun signaalketens: [devices/AGENTS.md](../../../devices/AGENTS.md). Een song componeren: [songs/AGENTS.md](../../../songs/AGENTS.md).
- Route voor agents: [soort Sequencers](../AGENTS.md) → [devices/AGENTS.md](../../AGENTS.md) → [root AGENTS.md](../../../AGENTS.md). Contract: [NL](../../../contract/PATCHKAMER-CONTRACT_NL.md) · [EN](../../../contract/PATCHKAMER-CONTRACT_EN.md). Hoe presets van dit apparaat zijn opgebouwd: [presets/AGENTS.md](../../../presets/AGENTS.md). <!-- agents-tree -->
- Rol in een song: sturing, één monofone stem (bas, lead, motief of drumtriggers) van 1 tot 64 stappen. Eventuitgang `notes` gaat naar de `notes` van een synth; voor meer stemmen gebruik je meer Step Sequencers, voor akkoorden de Chord Sequencer. Alle lijsten in de `state` hebben 64 plaatsen: geef ze altijd volledig op.
