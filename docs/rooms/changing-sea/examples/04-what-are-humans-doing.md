# 04-what-are-humans-doing: What are humans doing about it?

**Covers:** The 'humans doing' phrase mapping to Policy, Energy and Courts; the 2026 caveat; no cause claim.

## What are humans doing about the sea?

Setup: a fresh session (seed 42).

1. 'humans doing' maps to three categories (62 candidates). 'sea' is a topic word only. The top pick is CL-2026-059 (Ocean link Yes, 2026, highest ID). It is a 2026 event, so the caveat is included.  
   `POST /api/sessions/:id/turns` {"type": "text", "text": "What are humans doing about the sea?"} → **200** answer

## Machine-readable

Phase 2's runner reads this block. Fact objects were copied from `research/events.csv` by script.

```json
{
  "id": "04-what-are-humans-doing",
  "title": "What are humans doing about it?",
  "covers": "The 'humans doing' phrase mapping to Policy, Energy and Courts; the 2026 caveat; no cause claim.",
  "scenarios": [
    {
      "name": "What are humans doing about the sea?",
      "setup": {
        "seed": 42,
        "state": {}
      },
      "turns": [
        {
          "say": "'humans doing' maps to three categories (62 candidates). 'sea' is a topic word only. The top pick is CL-2026-059 (Ocean link Yes, 2026, highest ID). It is a 2026 event, so the caveat is included.",
          "request": {
            "method": "POST",
            "path": "/api/sessions/:id/turns",
            "body": {
              "type": "text",
              "text": "What are humans doing about the sea?"
            }
          },
          "expect": {
            "status": 200,
            "reply": {
              "kind": "answer",
              "factKind": "history",
              "textIncludes": [
                "Around 92,000 people attended, the largest COP ever. Turkey holds the presidency and Australia leads the negotiations; in the final week ministers are tackling finance and the energy transition. Pacific island nations are using it to spotlight sea-level rise.",
                "2026 figures may be revised."
              ],
              "textExcludes": [
                "caused by climate change",
                "because of climate change",
                "climate change caused",
                "climate change made",
                "driven by climate change",
                "due to climate change",
                "climate change worsened"
              ]
            },
            "facts": [
              {
                "eventId": "CL-2026-059",
                "event": "COP31 in Antalya, Turkey",
                "year": 2026,
                "date": "9 – 20 Nov 2026 (ongoing)",
                "category": "Policy, diplomacy & COP summits",
                "region": "Europe",
                "location": "Antalya, Turkey (Mediterranean coast)",
                "oceanLink": true,
                "whatHappened": "Around 92,000 people attended, the largest COP ever. Turkey holds the presidency and Australia leads the negotiations; in the final week ministers are tackling finance and the energy transition. Pacific island nations are using it to spotlight sea-level rise.",
                "humanImpact": null,
                "climateLink": null,
                "notes": "Still in progress when this sheet was compiled (18 Nov 2026); update with the final outcome. 2026 figures may be revised.",
                "sources": [
                  {
                    "publisher": "Hürriyet Daily News",
                    "url": "https://www.hurriyetdailynews.com/amp/cop31-turns-to-ministers-for-deal-on-finance-energy-229443",
                    "type": "News media"
                  },
                  {
                    "publisher": "Earth.Org",
                    "url": "https://earth.org/?p=43369",
                    "type": "News media"
                  }
                ]
              }
            ],
            "choices": [
              "exhibit.warming-waters",
              "exhibit.ice-poles",
              "exhibit.storms-floods",
              "exhibit.rising-seas",
              "exhibit.mortals",
              "leave"
            ],
            "state": {
              "favour": 1,
              "changingSea": {
                "told": ["CL-2026-059"]
              }
            }
          }
        }
      ]
    }
  ]
}
```
