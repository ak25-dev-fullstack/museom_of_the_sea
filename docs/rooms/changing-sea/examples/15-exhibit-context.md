# 15-exhibit-context: The same question at the hub and inside an exhibit

**Covers:** Exhibit context as the first sort key, for answers and lists; it never overrides an exact name.

## At the hub: no exhibit context

Setup: a fresh session (seed 42).

1. Year only: 59 candidates. CL-2020-058 wins on Ocean link, Climate link, then ID.  
   `POST /api/sessions/:id/turns` {"type": "text", "text": "What happened in 2020?"} → **200** answer

## Inside Ice and the poles (entry 1 showing)

Setup: a fresh session (seed 42), then this state is applied over the start state (see `README.md`).

1. Same question. The polar category comes first, so the top untold pick is CL-2020-043 (CL-2020-009 is the entry already shown, but it sorts below 043 anyway). Choices stay those of entry 1.  
   `POST /api/sessions/:id/turns` {"type": "text", "text": "What happened in 2020?"} → **200** answer
2. A list question uses the same order: the four polar events of 2020 are named first.  
   `POST /api/sessions/:id/turns` {"type": "text", "text": "list what happened in 2020"} → **200** list
3. An exact event name still wins over exhibit context.  
   `POST /api/sessions/:id/turns` {"type": "text", "text": "Tell me about Hurricane Helene"} → **200** answer

## Machine-readable

Phase 2's runner reads this block. Fact objects were copied from `research/events.csv` by script.

```json
{
  "id": "15-exhibit-context",
  "title": "The same question at the hub and inside an exhibit",
  "covers": "Exhibit context as the first sort key, for answers and lists; it never overrides an exact name.",
  "scenarios": [
    {
      "name": "At the hub: no exhibit context",
      "setup": {
        "seed": 42,
        "state": {}
      },
      "turns": [
        {
          "say": "Year only: 59 candidates. CL-2020-058 wins on Ocean link, Climate link, then ID.",
          "request": {
            "method": "POST",
            "path": "/api/sessions/:id/turns",
            "body": {
              "type": "text",
              "text": "What happened in 2020?"
            }
          },
          "expect": {
            "status": 200,
            "reply": {
              "kind": "answer",
              "textIncludes": [
                "A record 30 named storms formed, including 14 hurricanes (2nd most), with record water levels at several sites.",
                "400+ deaths; 200,000+ displaced; about US$41 billion losses (Christian Aid).",
                "A 2022 study found climate change increased extreme 3-hour hurricane rainfall by about 11% in 2020."
              ]
            },
            "facts": [
              {
                "eventId": "CL-2020-058",
                "event": "Record-breaking 2020 Atlantic hurricane season",
                "year": 2020,
                "date": "Season ended 30 Nov 2020",
                "category": "Tropical cyclone (hurricane/typhoon/cyclone)",
                "region": "Atlantic Ocean",
                "location": "Atlantic basin, USA, Central America, Caribbean",
                "oceanLink": true,
                "whatHappened": "A record 30 named storms formed, including 14 hurricanes (2nd most), with record water levels at several sites.",
                "humanImpact": "400+ deaths; 200,000+ displaced; about US$41 billion losses (Christian Aid).",
                "climateLink": "A 2022 study found climate change increased extreme 3-hour hurricane rainfall by about 11% in 2020.",
                "notes": null,
                "sources": [
                  {
                    "publisher": "NOAA",
                    "url": "https://www.noaa.gov/media-release/record-breaking-atlantic-hurricane-season-draws-to-end",
                    "type": "Government / scientific agency"
                  },
                  {
                    "publisher": "Nature Communications – 2020 storm rainfall attribution",
                    "url": "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9005694",
                    "type": "Scientific journal / study"
                  }
                ]
              }
            ],
            "state": {
              "favour": 1,
              "changingSea": {
                "told": ["CL-2020-058"]
              }
            }
          }
        }
      ]
    },
    {
      "name": "Inside Ice and the poles (entry 1 showing)",
      "setup": {
        "seed": 42,
        "state": {
          "currentNodeId": "cs.ice-poles.1",
          "turn": 1,
          "visited": ["cs.intro", "cs.ice-poles.1"],
          "changingSea": {
            "told": ["CL-2020-009"]
          }
        }
      },
      "turns": [
        {
          "say": "Same question. The polar category comes first, so the top untold pick is CL-2020-043 (CL-2020-009 is the entry already shown, but it sorts below 043 anyway). Choices stay those of entry 1.",
          "request": {
            "method": "POST",
            "path": "/api/sessions/:id/turns",
            "body": {
              "type": "text",
              "text": "What happened in 2020?"
            }
          },
          "expect": {
            "status": 200,
            "reply": {
              "kind": "answer",
              "textIncludes": [
                "Arctic sea ice: end-of-summer extent was the 2nd lowest in the 1979–2020 satellite record."
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
                "eventId": "CL-2020-043",
                "event": "Arctic sea ice second-lowest summer extent",
                "year": 2020,
                "date": "2020 (Arctic Report Card, Dec 2020)",
                "category": "Sea ice, glaciers & polar",
                "region": "Arctic",
                "location": "Arctic Ocean",
                "oceanLink": true,
                "whatHappened": "Arctic sea ice: end-of-summer extent was the 2nd lowest in the 1979–2020 satellite record.",
                "humanImpact": null,
                "climateLink": null,
                "notes": null,
                "sources": [
                  {
                    "publisher": "NOAA Arctic Report Card 2020",
                    "url": "https://www.arctic.noaa.gov/Report-Card/Report-Card-2020/ArtMID/7975/ArticleID/891/Sea-Ice",
                    "type": "Government / scientific agency"
                  }
                ]
              }
            ],
            "choices": ["next", "hub", "leave"],
            "state": {
              "favour": 1,
              "currentNodeId": "cs.ice-poles.1",
              "changingSea": {
                "told": ["CL-2020-009", "CL-2020-043"]
              }
            }
          }
        },
        {
          "say": "A list question uses the same order: the four polar events of 2020 are named first.",
          "request": {
            "method": "POST",
            "path": "/api/sessions/:id/turns",
            "body": {
              "type": "text",
              "text": "list what happened in 2020"
            }
          },
          "expect": {
            "status": 200,
            "reply": {
              "kind": "list",
              "factKind": null,
              "textIncludes": [
                "in my records",
                "59",
                "Arctic sea ice second-lowest summer extent",
                "Giant iceberg A-68 drifts towards South Georgia",
                "MOSAiC Arctic expedition ends",
                "Antarctica's hottest temperature on record: 18.3 °C",
                "Record-breaking 2020 Atlantic hurricane season",
                "Super Cyclone Amphan",
                "European windstorms incl. Storm Ciara",
                "Record ocean heat content",
                "and 51 more"
              ]
            },
            "facts": [],
            "list": {
              "total": 59,
              "items": [
                {
                  "eventId": "CL-2020-043",
                  "event": "Arctic sea ice second-lowest summer extent",
                  "year": 2020
                },
                {
                  "eventId": "CL-2020-042",
                  "event": "Giant iceberg A-68 drifts towards South Georgia",
                  "year": 2020
                },
                {
                  "eventId": "CL-2020-034",
                  "event": "MOSAiC Arctic expedition ends",
                  "year": 2020
                },
                {
                  "eventId": "CL-2020-009",
                  "event": "Antarctica's hottest temperature on record: 18.3 °C",
                  "year": 2020
                },
                {
                  "eventId": "CL-2020-058",
                  "event": "Record-breaking 2020 Atlantic hurricane season",
                  "year": 2020
                },
                {
                  "eventId": "CL-2020-015",
                  "event": "Super Cyclone Amphan",
                  "year": 2020
                },
                {
                  "eventId": "CL-2020-008",
                  "event": "European windstorms incl. Storm Ciara",
                  "year": 2020
                },
                {
                  "eventId": "CL-2020-054",
                  "event": "Record ocean heat content",
                  "year": 2020
                }
              ]
            },
            "choices": [
              "hear.cl-2020-043",
              "hear.cl-2020-042",
              "hear.cl-2020-034",
              "hear.cl-2020-009",
              "hear.cl-2020-058",
              "hear.cl-2020-015",
              "hear.cl-2020-008",
              "hear.cl-2020-054",
              "next",
              "hub",
              "leave"
            ],
            "state": {
              "favour": 1,
              "currentNodeId": "cs.ice-poles.1"
            }
          }
        },
        {
          "say": "An exact event name still wins over exhibit context.",
          "request": {
            "method": "POST",
            "path": "/api/sessions/:id/turns",
            "body": {
              "type": "text",
              "text": "Tell me about Hurricane Helene"
            }
          },
          "expect": {
            "status": 200,
            "reply": {
              "kind": "answer",
              "textIncludes": [
                "Helene hit Florida and caused catastrophic flooding far inland across the south-eastern US and the Appalachians.",
                "252 deaths (deadliest mainland US hurricane since Katrina); about US$78.7 billion damage."
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
                "eventId": "CL-2024-029",
                "event": "Hurricane Helene",
                "year": 2024,
                "date": "24 – 27 Sep 2024",
                "category": "Tropical cyclone (hurricane/typhoon/cyclone)",
                "region": "North America",
                "location": "Florida, south-eastern USA, Appalachians",
                "oceanLink": true,
                "whatHappened": "Helene hit Florida and caused catastrophic flooding far inland across the south-eastern US and the Appalachians.",
                "humanImpact": "252 deaths (deadliest mainland US hurricane since Katrina); about US$78.7 billion damage.",
                "climateLink": null,
                "notes": null,
                "sources": [
                  {
                    "publisher": "Wikipedia – Hurricane Helene",
                    "url": "https://en.wikipedia.org/wiki/Hurricane_Helene",
                    "type": "Encyclopedia (Wikipedia, cites primary sources)"
                  }
                ]
              }
            ],
            "state": {
              "favour": 2,
              "changingSea": {
                "told": ["CL-2020-009", "CL-2020-043", "CL-2024-029"]
              }
            }
          }
        }
      ]
    }
  ]
}
```
