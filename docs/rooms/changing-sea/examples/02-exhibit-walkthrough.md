# 02-exhibit-walkthrough: Walk through an exhibit

**Covers:** Exhibit choices, event-backed nodes, the cause rule both ways, the 2026 caveat, quiz.start appearing, 409 for a choice not on screen.

## Warming waters, entries 1 to 3

Setup: a fresh session (seed 42).

1. Visitor picks Warming waters. Entry 1 has no Climate link, so the guide must not claim a cause.  
   `POST /api/sessions/:id/turns` {"type": "choice", "choiceId": "exhibit.warming-waters"} → **200** exhibit
2. Next. Entry 2 has a Climate link, so its text is quoted word for word.  
   `POST /api/sessions/:id/turns` {"type": "choice", "choiceId": "next"} → **200** exhibit
3. Next. Entry 3 is a 2026 event, so the caveat is included. All three are seen, so the quiz is offered.  
   `POST /api/sessions/:id/turns` {"type": "choice", "choiceId": "next"} → **200** exhibit
4. The client sends 'next', which is not on screen at entry 3.  
   `POST /api/sessions/:id/turns` {"type": "choice", "choiceId": "next"} → **409** CHOICE_NOT_AVAILABLE

## Machine-readable

Phase 2's runner reads this block. Fact objects were copied from `research/events.csv` by script.

```json
{
  "id": "02-exhibit-walkthrough",
  "title": "Walk through an exhibit",
  "covers": "Exhibit choices, event-backed nodes, the cause rule both ways, the 2026 caveat, quiz.start appearing, 409 for a choice not on screen.",
  "scenarios": [
    {
      "name": "Warming waters, entries 1 to 3",
      "setup": {
        "seed": 42,
        "state": {}
      },
      "turns": [
        {
          "say": "Visitor picks Warming waters. Entry 1 has no Climate link, so the guide must not claim a cause.",
          "request": {
            "method": "POST",
            "path": "/api/sessions/:id/turns",
            "body": {
              "type": "choice",
              "choiceId": "exhibit.warming-waters"
            }
          },
          "expect": {
            "status": 200,
            "reply": {
              "kind": "exhibit",
              "factKind": "history",
              "textIncludes": [
                "Global daily sea surface temperature hit a record 21.02 °C (23–24 Aug); the North Atlantic hit 25.19 °C on 31 Aug. SSTs were record-high for the time of year from April to December."
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
                "eventId": "CL-2023-027",
                "event": "Global sea surface temperature record",
                "year": 2023,
                "date": "Aug 2023",
                "category": "Ocean, coral & marine life",
                "region": "Global",
                "location": "Global oceans; North Atlantic",
                "oceanLink": true,
                "whatHappened": "Global daily sea surface temperature hit a record 21.02 °C (23–24 Aug); the North Atlantic hit 25.19 °C on 31 Aug. SSTs were record-high for the time of year from April to December.",
                "humanImpact": null,
                "climateLink": null,
                "notes": null,
                "sources": [
                  {
                    "publisher": "Copernicus C3S – Global Climate Highlights 2023",
                    "url": "https://climate.copernicus.eu/global-climate-highlights-2023",
                    "type": "Government / scientific agency"
                  }
                ]
              }
            ],
            "choices": ["next", "hub", "leave"],
            "effects": [],
            "progress": {
              "exhibits": [
                {
                  "id": "warming-waters",
                  "title": "Warming waters",
                  "entriesSeen": 1,
                  "token": false
                },
                {
                  "id": "ice-poles",
                  "title": "Ice and the poles",
                  "entriesSeen": 0,
                  "token": false
                },
                {
                  "id": "storms-floods",
                  "title": "Storms and floods",
                  "entriesSeen": 0,
                  "token": false
                },
                {
                  "id": "rising-seas",
                  "title": "Rising seas",
                  "entriesSeen": 0,
                  "token": false
                },
                {
                  "id": "mortals",
                  "title": "What mortals have done",
                  "entriesSeen": 0,
                  "token": false
                }
              ],
              "tokens": 0,
              "favourBand": "neutral"
            },
            "state": {
              "currentNodeId": "cs.warming-waters.1",
              "favour": 0,
              "visited": ["cs.intro", "cs.warming-waters.1"],
              "changingSea": {
                "told": ["CL-2023-027"]
              }
            }
          }
        },
        {
          "say": "Next. Entry 2 has a Climate link, so its text is quoted word for word.",
          "request": {
            "method": "POST",
            "path": "/api/sessions/:id/turns",
            "body": {
              "type": "choice",
              "choiceId": "next"
            }
          },
          "expect": {
            "status": 200,
            "reply": {
              "kind": "exhibit",
              "factKind": "history",
              "textIncludes": [
                "Bleaching-level heat stress hit 83.7% of the world's coral reef area, beating the previous record of 68.2% (2014–2017). Bleaching was confirmed in the Atlantic, Pacific and Indian Oceans.",
                "Driven by record ocean temperatures."
              ]
            },
            "facts": [
              {
                "eventId": "CL-2025-001",
                "event": "Biggest coral bleaching event ever: 84% of reefs",
                "year": 2025,
                "date": "Jan 2023 – Apr 2025 (NOAA update Apr 2025)",
                "category": "Ocean, coral & marine life",
                "region": "Global",
                "location": "83 countries and territories",
                "oceanLink": true,
                "whatHappened": "Bleaching-level heat stress hit 83.7% of the world's coral reef area, beating the previous record of 68.2% (2014–2017). Bleaching was confirmed in the Atlantic, Pacific and Indian Oceans.",
                "humanImpact": null,
                "climateLink": "Driven by record ocean temperatures.",
                "notes": "84% experienced bleaching-level heat stress; not every reef in that area fully bleached (see Science Feedback).",
                "sources": [
                  {
                    "publisher": "ABC News (Good Morning America)",
                    "url": "https://www.goodmorningamerica.com/amp/news/story/largest-coral-bleaching-event-record-impacts-84-worlds-121100992",
                    "type": "News media"
                  },
                  {
                    "publisher": "The Maritime Executive",
                    "url": "https://maritime-executive.com/article/unprecedented-bleaching-event-affects-84-percent-of-world-s-corals",
                    "type": "News media"
                  }
                ]
              }
            ],
            "choices": ["next", "hub", "leave"],
            "progress": {
              "exhibits": [
                {
                  "id": "warming-waters",
                  "title": "Warming waters",
                  "entriesSeen": 2,
                  "token": false
                },
                {
                  "id": "ice-poles",
                  "title": "Ice and the poles",
                  "entriesSeen": 0,
                  "token": false
                },
                {
                  "id": "storms-floods",
                  "title": "Storms and floods",
                  "entriesSeen": 0,
                  "token": false
                },
                {
                  "id": "rising-seas",
                  "title": "Rising seas",
                  "entriesSeen": 0,
                  "token": false
                },
                {
                  "id": "mortals",
                  "title": "What mortals have done",
                  "entriesSeen": 0,
                  "token": false
                }
              ],
              "tokens": 0,
              "favourBand": "neutral"
            },
            "state": {
              "currentNodeId": "cs.warming-waters.2",
              "favour": 0,
              "changingSea": {
                "told": ["CL-2023-027", "CL-2025-001"]
              }
            }
          }
        },
        {
          "say": "Next. Entry 3 is a 2026 event, so the caveat is included. All three are seen, so the quiz is offered.",
          "request": {
            "method": "POST",
            "path": "/api/sessions/:id/turns",
            "body": {
              "type": "choice",
              "choiceId": "next"
            }
          },
          "expect": {
            "status": 200,
            "reply": {
              "kind": "exhibit",
              "factKind": "history",
              "textIncludes": [
                "22 August 2026 set a record for the hottest day measured in the world's seas (about 21.10 °C daily average); August tied the all-time monthly sea-surface record.",
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
                "eventId": "CL-2026-044",
                "event": "Hottest day ever recorded for the world's seas",
                "year": 2026,
                "date": "22 Aug 2026",
                "category": "Ocean, coral & marine life",
                "region": "Global",
                "location": "Global oceans",
                "oceanLink": true,
                "whatHappened": "22 August 2026 set a record for the hottest day measured in the world's seas (about 21.10 °C daily average); August tied the all-time monthly sea-surface record.",
                "humanImpact": null,
                "climateLink": null,
                "notes": "2026 figures may be revised.",
                "sources": [
                  {
                    "publisher": "NPR / KUOW (citing Copernicus)",
                    "url": "https://www.kuow.org/npr-news/2026-09-10/scientists-say-august-was-earths-hottest-month-theyve-measured",
                    "type": "News media"
                  },
                  {
                    "publisher": "Wikipedia – Weather of 2026",
                    "url": "https://en.wikipedia.org/wiki/Weather_of_2026",
                    "type": "Encyclopedia (Wikipedia, cites primary sources)"
                  }
                ]
              }
            ],
            "choices": ["quiz.start", "hub", "leave"],
            "progress": {
              "exhibits": [
                {
                  "id": "warming-waters",
                  "title": "Warming waters",
                  "entriesSeen": 3,
                  "token": false
                },
                {
                  "id": "ice-poles",
                  "title": "Ice and the poles",
                  "entriesSeen": 0,
                  "token": false
                },
                {
                  "id": "storms-floods",
                  "title": "Storms and floods",
                  "entriesSeen": 0,
                  "token": false
                },
                {
                  "id": "rising-seas",
                  "title": "Rising seas",
                  "entriesSeen": 0,
                  "token": false
                },
                {
                  "id": "mortals",
                  "title": "What mortals have done",
                  "entriesSeen": 0,
                  "token": false
                }
              ],
              "tokens": 0,
              "favourBand": "neutral"
            },
            "state": {
              "currentNodeId": "cs.warming-waters.3",
              "favour": 0,
              "visited": [
                "cs.intro",
                "cs.warming-waters.1",
                "cs.warming-waters.2",
                "cs.warming-waters.3"
              ],
              "changingSea": {
                "told": ["CL-2023-027", "CL-2025-001", "CL-2026-044"]
              }
            }
          }
        },
        {
          "say": "The client sends 'next', which is not on screen at entry 3.",
          "request": {
            "method": "POST",
            "path": "/api/sessions/:id/turns",
            "body": {
              "type": "choice",
              "choiceId": "next"
            }
          },
          "expect": {
            "status": 409,
            "error": {
              "code": "CHOICE_NOT_AVAILABLE"
            },
            "stateUnchanged": true
          }
        }
      ]
    }
  ]
}
```
