# Tunes: gebruikershandleiding

*English version: [USER-MANUAL_EN.md](USER-MANUAL_EN.md)*

Een **tune** is een bewaarde klank van één apparaat dat geluid maakt: een synth of een drumcomputer. Je kiest een tune uit een lijst op de kaart van het apparaat en alle knoppen, keuzes en patronen springen naar de bewaarde waarden. Deze pagina legt uit hoe je tunes gebruikt, hoe je een pack importeert, exporteert en deelt, welke packs er met Patchkamer meekomen en hoe je een eigen pack maakt. Apparaten zonder eigen geluid (effecten, mixers, tools) hebben **presets**: zie de [handleiding voor presets](../presets/USER-MANUAL_NL.md). De basis van Patchkamer (opstarten, een bibliotheek laden, kabels trekken) staat in de [basishandleiding](../USER-MANUAL_NL.md).

## Inhoud

1. [Wat een tune is](#wat-een-tune-is)
2. [Een tune kiezen op de kaart](#een-tune-kiezen-op-de-kaart)
3. [Je eigen tune bewaren](#je-eigen-tune-bewaren)
4. [Drumcomputers: de regel Instrument](#drumcomputers-de-regel-instrument)
5. [Het menu Tunes: bibliotheken en mappen](#het-menu-tunes-bibliotheken-en-mappen)
6. [Een pack importeren en exporteren](#een-pack-importeren-en-exporteren)
7. [Een pack delen: het bestand en de licentie](#een-pack-delen-het-bestand-en-de-licentie)
8. [De packs die met Patchkamer meekomen](#de-packs-die-met-patchkamer-meekomen)
9. [Een eigen pack maken](#een-eigen-pack-maken)
10. [Als het niet werkt](#als-het-niet-werkt)

## Wat een tune is

Een tune is de **klank van één apparaat**: alle knoppen, keuzes en patronen. Kabels zitten er niet in. Tunes zijn voor apparaten die geluid maken (in het contract: `instrument`-apparaten): synths, drones en drumcomputers. Een apparaat zonder eigen geluid heeft presets, geen tunes.

Tunes horen bij één apparaat. Een tune die voor Duofone is gemaakt, zie je alleen op een Duofone-kaart. Elke kaart met dat apparaat krijgt bij het laden een eigen kopie van de waarden, dus als je de ene Duofone verandert, verandert de andere niet.

## Een tune kiezen op de kaart

Elke kaart van een apparaat dat geluid maakt, heeft onder de titel een balk met de knoppen ◀ ▶, een lijst, **Bewaar** en een knop **≡**. Hier de balk van een Duofone met de tune **House › Deep House Bass**:

![De tunebalk van de kaart van Duofone met House > Deep House Bass gekozen](../images/nl/tunes/duofone-tune-bar.png)

- **De lijst** toont de tunes van alle bibliotheken voor dit apparaat, gegroepeerd per bibliotheek. Elke regel staat er als *map › naam*. Houd de muis boven de lijst om de maker en de licentie van de huidige tune te zien. Zolang je geen bibliotheek hebt, zegt de lijst "— nog geen tunes —".
- **◀ ▶** gaan naar de vorige of volgende tune.
- **Bewaar** legt de huidige instelling vast (zie hieronder). De knop licht op als je iets hebt veranderd sinds je de tune laadde.
- **≡** opent het paneel **Tunes** voor dit apparaat (zie [Het menu Tunes](#het-menu-tunes-bibliotheken-en-mappen)).
- Een sterretje (*) achter de naam in de lijst en een *cursieve* naam op de kaart betekenen: je hebt iets veranderd sinds je de tune laadde. Een (⧉) markeert een tune die een andere kaart van hetzelfde apparaat gebruikt.

Zie je de balk niet, zet dan **Tune- en presetbalk op de kaarten tonen** aan bij **Instellingen**.

Zelf proberen: plaats Duofone, sluit een Keys-apparaat aan op zijn ingang **Keyboard / noten** en de uitgang op je speakers, open de lijst en kies een tune. Speel een paar noten en blader daarna met ▶ door de tunes.

## Je eigen tune bewaren

1. Maak het geluid dat je wilt.
2. Klik op **Bewaar** op de kaart.
3. Geef in het venster dat opent de tune een **naam**. Kies de **bibliotheek** en de **map** waar hij in komt (of kies **+ Nieuwe bibliotheek…** en **+ Nieuwe map…**) en vul de **maker** en de **licentie** in: CC-BY-4.0 of alle rechten voorbehouden.
4. Klik op **Bewaar**.

Bestaat er al een tune met die naam in de map, dan wordt hij vervangen. Andere kaarten die hem gebruiken houden hun eigen kopie. Je kunt alleen bewaren in een bibliotheek die van jou is: bibliotheken uit een bron (een GitHub-adres of een map op je computer) zijn alleen-lezen. Maak eerst een kopie met **Kopie** in het paneel Tunes.

Je eigen tunes worden in je browser onthouden. Exporteer een bibliotheek om hem in een bestand te zetten (zie [Een pack importeren en exporteren](#een-pack-importeren-en-exporteren)). **Browsergeheugen wissen…** bij Instellingen haalt ze weg.

## Drumcomputers: de regel Instrument

De host van Patchkamer heeft voor drumcomputers nog iets extra's. Een drumcomputer die losse instrumenten aanbiedt (bijvoorbeeld een kick en een snare) krijgt op zijn tunebalk een **tweede regel**, **Instrument** genoemd. Daar kies je een instrument en **laad of bewaar je één geluid** (bijvoorbeeld de kick) als een tune op zich, naast de tunes van de hele machine. In een packbestand heeft zo'n item `kind: "part"` en staat het instrument in `part`.

Wat ik in deze repository kon controleren: de drumapparaten die erbij zitten (Drum Kit, Drum Machine en Groovebox 12) bieden geen losse instrumenten aan, dus je ziet deze regel er niet op, en de drie drumpacks bevatten alleen tunes voor de hele machine (`kind: "set"`). De regel is er voor drumcomputers die wel instrumenten aanbieden.

## Het menu Tunes: bibliotheken en mappen

Het menu **Tunes ▾** bovenaan opent het paneel **Tunebibliotheken**. Het toont de bibliotheken per apparaat. Een bibliotheek hoort bij één apparaat en kan mappen hebben, en mappen kunnen weer mappen hebben. Het paneel is hetzelfde als het paneel Presets; het toont alleen de apparaten die geluid maken.

![Het paneel Tunes met de bibliotheek Duofone Styles](../images/nl/tunes/tunes-panel.png)

| Regelaar | Wat hij doet |
|---|---|
| **Apparaat** | Filtert het paneel op één apparaat. **alle apparaten** toont alles. |
| **Nieuwe bibliotheek** | Maakt een lege bibliotheek voor het gekozen apparaat. |
| **Importeren…** | Leest een pack uit een bestand (zie hieronder). |
| Vinkje | Een aangevinkte bibliotheek is zichtbaar in de lijst op de kaarten. Haal het vinkje weg om hem te verbergen zonder hem te verwijderen. |
| Naam van de bibliotheek | Klik erop om de bibliotheek open of dicht te klappen en zijn mappen en tunes te zien. De regel eronder toont het aantal tunes, de maker en de licentie. |
| **Exporteer** | Schrijft de bibliotheek naar een packbestand. |
| **+ Map** | Voegt een map toe op het hoogste niveau van de bibliotheek. In je eigen bibliotheken heeft elke map zelf **+ Map**, **Naam** (hernoemen), een verplaatslijst en **×**. |
| **Info** | Toont en wijzigt de naam, de maker, de licentie en de omschrijving van de bibliotheek. |
| **Kopie** | Alleen bij alleen-lezen bibliotheken: maakt een aanpasbare kopie van de bibliotheek. |
| **×** | Verwijdert de bibliotheek. De knop vraagt om een tweede klik voordat hij verwijdert. |

Open een bibliotheek om zijn mappen en tunes te zien. Naast elke tune zet **Laden** hem op de geselecteerde kaart van dat apparaat (anders op de eerste; staat het apparaat nog niet op de vloer, dan wordt het geplaatst). Tunes in je eigen bibliotheken hebben ook **Naam** (hernoemen), een verplaatslijst en **×**. In een alleen-lezen bibliotheek kopieert een knop **→ naam van de bibliotheek** de tune naar je eigen bibliotheek.

## Een pack importeren en exporteren

Een **pack** is één bibliotheek in één bestand, `naam.patchkamer-tunes.json`.

- **Importeren:** open **Tunes ▾**, klik op **Importeren…** en kies een of meer packbestanden. Elk pack wordt een eigen bibliotheek van jou voor het apparaat dat in het bestand staat, dus je kunt hem aanpassen. Heb je al een bibliotheek met dezelfde naam voor dat apparaat, dan krijgt de nieuwe een nummer: "Duofone Styles (2)". De tunes verschijnen op een kaart zodra dat apparaat is geplaatst.
- **Exporteren:** open **Tunes ▾** en klik op **Exporteer** naast een bibliotheek. Patchkamer bewaart hem als *Apparaat - Naam van de bibliotheek.patchkamer-tunes.json*.
- **Vanzelf:** een bibliotheek die je van GitHub of uit een map laadt, brengt zijn packbestanden mee: elk `*.patchkamer-tunes.json` en `*.patchkamer-presets.json` erin verschijnt vanzelf in de panelen, als alleen-lezen bibliotheek. Het adres `github.com/unboxednl/patchkamer` laadt de packs van deze repository (zie [de basishandleiding](../USER-MANUAL_NL.md#4-een-bibliotheek-laden)).

## Een pack delen: het bestand en de licentie

Een pack is een gewoon JSON-bestand. Je kunt het sturen, op GitHub zetten of in de bibliotheekmap van een project leggen. Het formaat in het kort:

```json
{
  "format": "patchkamer-tunes",
  "formatVersion": 1,
  "device": "nl.patchkamer.duofone",
  "name": "Duofone Styles",
  "author": "Freek van Gool",
  "license": "CC0-1.0",
  "description": "Tunes for Duofone by music style: …",
  "tree": [
    { "folder": "Techno", "items": [
      { "name": "Rolling Bass", "kind": "set", "version": "1.0.0", "state": { "cutoff": 420, "resonance": 0.35 } }
    ] }
  ]
}
```

- `format` is `patchkamer-tunes` en `formatVersion` is `1`.
- `device` is de exacte id van het apparaat waar het pack voor is. Een tune hangt aan die id; een verkeerde id geeft een pack dat bij geen enkel apparaat hoort.
- `tree` bevat **mappen** (`folder` met `items`) en tunes. Een map kan in een map zitten. Elke tune heeft een `name`, `kind: "set"` (de hele klank van het apparaat) en een `state` met de eigen waarden van het apparaat. Waarden die het apparaat niet kent, worden genegeerd; ontbrekende waarden krijgen de beginwaarde.

De packs die met Patchkamer meekomen zijn **CC0-1.0**: publiek domein. Je mag ze gebruiken, aanpassen en delen zonder de maker te noemen. De licentie van een eigen pack kies je zelf bij het bewaren en exporteren. De hele map `tunes/` is CC0-1.0; zie [LICENSING.md](../../LICENSING.md).

## De packs die met Patchkamer meekomen

Deze repository heeft 5 packs met samen **221 tunes**, één per apparaat. Alle packs hebben de licentie CC0-1.0 en de namen van packs, mappen en tunes zijn Engels.

| Apparaat | Pack | Tunes | Mappen | Bestand |
|---|---|---|---|---|
| [Duofone](../../devices/synths/Duofone/) | Duofone Styles | 60 | Techno (5), House (5), Trance (5), Ambient (5), Drum & Bass (5), Dubstep (5), Synthwave (5), Funk & Disco (5), Hip-hop (5), Electro (5), Pop (5), Chiptune (5) | [`duofone-styles.patchkamer-tunes.json`](../../tunes/duofone-styles.patchkamer-tunes.json) |
| [Acid Baselines](../../devices/synths/AcidBaselines/) | Acid Baselines Classics | 49 | Chicago Origins (5), Frankfurt Rolling (5), Minimal Acid (5), Squelch Anthems (5), Acid Techno (5), Acid Trance (5), Electro Acid (5), Deep Acid (5), AIcid (9) | [`acid-baselines-classics.patchkamer-tunes.json`](../../tunes/acid-baselines-classics.patchkamer-tunes.json) |
| [Drum Kit](../../devices/drums/DrumKit/) | Drum Kit Styles | 38 | Techno (5), House (3), Trance (3), Drum & Bass (3), Dubstep (3), Hip-hop (3), Funk & disco (3), Electro (3), Pop (3), Rock (3), Jazz (3), Synthwave (3) | [`drum-kit-styles.patchkamer-tunes.json`](../../tunes/drum-kit-styles.patchkamer-tunes.json) |
| [Drum Machine](../../devices/drums/DrumMachine/) | Drum Machine Styles | 36 | Techno (3), House (3), Trance (3), Drum & Bass (3), Dubstep (3), Hip-hop (3), Funk & disco (3), Electro (3), Pop (3), Rock (3), Jazz (3), Synthwave (3) | [`drum-machine-styles.patchkamer-tunes.json`](../../tunes/drum-machine-styles.patchkamer-tunes.json) |
| [Groovebox 12](../../devices/drums/Groovebox12/) | Groovebox 12 Styles | 38 | Techno (5), House (3), Trance (3), Drum & Bass (3), Dubstep (3), Hip-hop (3), Funk & disco (3), Electro (3), Pop (3), Rock (3), Jazz (3), Synthwave (3) | [`groovebox-12-styles.patchkamer-tunes.json`](../../tunes/groovebox-12-styles.patchkamer-tunes.json) |

### Duofone Styles

60 tunes in 12 stijlen, 5 per stijl: bas, lead, pad en een paar kleuren. Bijvoorbeeld **Techno**: Rolling Bass, Acid Squelch, Dark Stab, Industrial Hit. **House**: Deep House Bass, Piano Stab, Organ Stab, Filter Pad. **Ambient**: Slow Drift, Glass Bells, Deep Space, Wind Over Water. De andere mappen zijn Trance, Drum & Bass, Dubstep, Synthwave, Funk & Disco, Hip-hop, Electro, Pop en Chiptune. De regelaars van Duofone staan in de [handleiding voor synths](../synths/USER-MANUAL_NL.md).

### Acid Baselines Classics

49 tunes in 9 mappen. Acht mappen hebben elk 5 tunes en zijn genoemd naar tijdperken en stijlen van acid: Chicago Origins, Frankfurt Rolling, Minimal Acid, Squelch Anthems, Acid Techno, Acid Trance, Electro Acid en Deep Acid. Bijvoorbeeld **Chicago Origins**: Warehouse Squelch, Raw Saw, Basement Tape, Square Pulse. Elke tune heeft een eigen basloop, dus de sequencer vult zich met een patroon als je hem laadt. De negende map, **AIcid** (9 tunes), gaat verder: hij gebruikt de extra oscillatoren, filtertypen en vervormingen van Acid Baselines versie 1.11.2 (Sub, Noise, Osc 2, Ring, Filter 2 en de vervormingstypen). De tunes heten onder meer Neural Squelch, Gradient Descent, Hallucination en Latent Space.

### Drumpacks

Drie packs hebben tunes voor de drumapparaten, alle in dezelfde 12 stijlen: techno, house, trance, drum & bass, dubstep, hip-hop, funk & disco, electro, pop, rock, jazz en synthwave.

- **Drum Kit Styles** (apparaat Drum Kit): 38 kits; techno heeft er 5 en elke andere stijl 3. Elke kit combineert instrumenten, klankmodellen en een groove van één maat.
- **Drum Machine Styles** (apparaat Drum Machine): 36 kits, 3 per stijl. Elke kit heeft een groove en bijpassende klankinstellingen.
- **Groovebox 12 Styles** (apparaat Groovebox 12): 38 kits; techno heeft er 5 en elke andere stijl 3. Elke kit stelt het tempo, de drumgeluiden, een groove van één maat en een baslijn in, met pads en leads waar de stijl erom vraagt.

Een tune voor een drumapparaat is een hele machine: klank en patroon samen. De apparaten zelf staan in de [handleiding voor drums](../drums/USER-MANUAL_NL.md).

### Zo gebruik je ze

Laad `github.com/unboxednl/patchkamer` als bibliotheek (de packs komen mee, alleen-lezen), of download een bestand uit de [map tunes](../../tunes/) en gebruik **Importeren…**.

## Een eigen pack maken

**Zonder agent.** Plaats het apparaat, maak een geluid, klik op **Bewaar** en kies **+ Nieuwe bibliotheek…** om een bibliotheek te beginnen. Herhaal dat voor elke tune, sorteer ze in mappen en klik op **Info** om de maker, de licentie en een omschrijving in te vullen. Klik dan op **Exporteer**. Het bestand is je pack.

**Met een AI-agent.** Een agent kan een packbestand rechtstreeks schrijven. Geef hem:

- [`tunes/AGENTS.md`](../../tunes/AGENTS.md): de indeling van het bestand, de regels voor `state` en de licentie (in deze repository altijd `CC0-1.0`);
- de `AGENTS.md` in de map van het apparaat (bijvoorbeeld `devices/synths/Duofone/AGENTS.md`): daar staan de id van het apparaat, zijn waarden en hun bereiken.

Het pack komt in `tunes/` als `naam.patchkamer-tunes.json`, en de namen van de tunes zijn Engels en zonder merknamen. Vraag de agent alleen waarden te gebruiken die het apparaat kent en erbij te zeggen dat hij het resultaat niet heeft beluisterd. Importeer het pack daarna, blader erdoor en luister zelf.

## Als het niet werkt

- **De balk staat niet op de kaart.** Zet **Tune- en presetbalk op de kaarten tonen** aan bij Instellingen.
- **De lijst zegt "— nog geen tunes —".** Er is geen bibliotheek voor dit apparaat, of hij staat uitgevinkt in het paneel Tunes. Importeer een pack of laad een bibliotheek.
- **Ik heb een pack geïmporteerd maar zie het niet.** Het pack is voor een ander apparaat: zijn `device`-id moet bij het apparaat van de kaart passen. Het paneel Tunes groepeert de bibliotheken per apparaat; kijk daar.
- **Importeren meldt "geen Patchkamer-tune- of presetbestand".** Het bestand is geen pack, of de JSON is beschadigd. Een packbestand zonder `device` wordt geweigerd.
- **Ik kan niet bewaren in een bibliotheek.** Hij is alleen-lezen (geladen van GitHub of uit een map). Maak een kopie met **Kopie** en bewaar daar.
- **Een tune laadt maar ik hoor niets.** Een tune stelt alleen het apparaat in. Hij trekt geen kabels en speelt geen noten. Controleer de kabels en de noten of de klok die het apparaat aansturen (zie de handleiding van het apparaat).
- **De tune is veranderd nadat ik hem laadde.** De naam staat cursief: je hebt een knop verplaatst of een patroon veranderd. **Bewaar** legt jouw versie vast, of kies de tune opnieuw om terug te gaan.
