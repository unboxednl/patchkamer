# AGENTS.md: Listening Output

Dit bestand is voor AI-agents die **presets voor Listening Output** maken. Het is niet geschreven voor mensen. Het hoort bij `../../../AGENTS.md`; lees dat eerst.

## Wat Listening Output is

Een transparante luisteruitgang: de audio gaat ongewijzigd naar de uitgang van de browser, met alleen een luistervolume. Zet hem als laatste in de keten, na de mastering-apparaten, zodat je meet wat je hoort.

| | |
|---|---|
| Bestand | `listening-output.patchkamer-device.js` (in deze map) |
| `id` | `nl.patchkamer.listeningoutput`. Verander die nooit |
| Soort | `output`: krijgt dus **presets** |
| Poorten | audio-ingang `in` (In) |
| Contract | v1.11 |

Voorganger: Luisteruitgang (`nl.patchkamer.monitoruit`).

## De state

| Veld | Wat | Bereik | Start |
|---|---|---|---|
| `level` | Luistervolume | 0 … 1 | 0,7 |

`getPreset()` geeft hetzelfde. Een ongeldige waarde (tekst, `NaN`, `Infinity`) geeft 0,7; een getal buiten het bereik wordt afgekapt; het volume gaat zacht naar zijn nieuwe waarde.

## Controleren

`node contract/validate-instrument.mjs devices/mastering/ListeningOutput/listening-output.patchkamer-device.js --lang nl` en `--lang en`. Niet beluisterd.
