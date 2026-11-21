# 17-list-during-quiz: A list question in the middle of a quiz

**Covers:** List during a quiz: hear choices first, then the question's options; quiz untouched; hearing gives +1; the quiz carries on.

## Warming waters quiz, question 2

Setup: a fresh session (seed 42), then this state is applied over the start state (see `README.md`).

1. A list question mid-quiz. Same 13 storms as example 14 (exhibit context doesn't change the order, because storms aren't a Warming waters category). Hear choices first, then question 2's options. The quiz is untouched.  
   `POST /api/sessions/:id/turns` {"type": "text", "text": "How many storms were there in 2020?"} → **200** list
2. Hear one of them: +1. The choices go back to question 2's options, and the quiz is still untouched.  
   `POST /api/sessions/:id/turns` {"type": "choice", "choiceId": "hear.cl-2020-008"} → **200** answer
3. Answer question 2 correctly (a, 83.7%): +1, on to question 3.  
   `POST /api/sessions/:id/turns` {"type": "choice", "choiceId": "q.warming-waters.2.a"} → **200** quiz

## Machine-readable

Phase 2's runner reads this block. Fact objects were copied from `research/events.csv` by script.

```json
{
  "id": "17-list-during-quiz",
  "title": "A list question in the middle of a quiz",
  "covers": "List during a quiz: hear choices first, then the question's options; quiz untouched; hearing gives +1; the quiz carries on.",
  "scenarios": [
    {
      "name": "Warming waters quiz, question 2",
      "setup": {
        "seed": 42,
        "state": {
          "favour": 0,
          "currentNodeId": "cs.warming-waters.3",
          "turn": 5,
          "visited": [
            "cs.intro",
            "cs.warming-waters.1",
            "cs.warming-waters.2",
            "cs.warming-waters.3"
          ],
          "changingSea": {
            "told": ["CL-2023-027", "CL-2025-001", "CL-2026-044"],
            "quiz": {
              "exhibitId": "warming-waters",
              "questionIndex": 1,
              "answers": [true]
            }
          }
        }
      },
      "turns": [
        {
          "say": "A list question mid-quiz. Same 13 storms as example 14 (exhibit context doesn't change the order, because storms aren't a Warming waters category). Hear choices first, then question 2's options. The quiz is untouched.",
          "request": {
            "method": "POST",
            "path": "/api/sessions/:id/turns",
            "body": {
              "type": "text",
              "text": "How many storms were there in 2020?"
            }
          },
          "expect": {
            "status": 200,
            "reply": {
              "kind": "list",
              "factKind": null,
              "textIncludes": [
                "in my records",
                "13",
                "Record-breaking 2020 Atlantic hurricane season",
                "Super Cyclone Amphan",
                "European windstorms incl. Storm Ciara",
                "Cyclone Gati hits Somalia",
                "Hurricane Iota",
                "Typhoon Vamco",
                "Hurricane Eta",
                "Super Typhoon Goni",
                "and 5 more"
              ]
            },
            "facts": [],
            "list": {
              "total": 13,
              "items": [
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
                  "eventId": "CL-2020-041",
                  "event": "Cyclone Gati hits Somalia",
                  "year": 2020
                },
                {
                  "eventId": "CL-2020-040",
                  "event": "Hurricane Iota",
                  "year": 2020
                },
                {
                  "eventId": "CL-2020-039",
                  "event": "Typhoon Vamco",
                  "year": 2020
                },
                {
                  "eventId": "CL-2020-037",
                  "event": "Hurricane Eta",
                  "year": 2020
                },
                {
                  "eventId": "CL-2020-035",
                  "event": "Super Typhoon Goni",
                  "year": 2020
                }
              ]
            },
            "choices": [
              "hear.cl-2020-058",
              "hear.cl-2020-015",
              "hear.cl-2020-008",
              "hear.cl-2020-041",
              "hear.cl-2020-040",
              "hear.cl-2020-039",
              "hear.cl-2020-037",
              "hear.cl-2020-035",
              "q.warming-waters.2.a",
              "q.warming-waters.2.b",
              "q.warming-waters.2.c",
              "quiz.stop",
              "leave"
            ],
            "quiz": {
              "exhibitId": "warming-waters",
              "questionNumber": 2,
              "of": 3,
              "paused": false
            },
            "state": {
              "favour": 0,
              "currentNodeId": "cs.warming-waters.3",
              "changingSea": {
                "told": ["CL-2023-027", "CL-2025-001", "CL-2026-044"],
                "quiz": {
                  "exhibitId": "warming-waters",
                  "questionIndex": 1,
                  "answers": [true]
                }
              }
            }
          }
        },
        {
          "say": "Hear one of them: +1. The choices go back to question 2's options, and the quiz is still untouched.",
          "request": {
            "method": "POST",
            "path": "/api/sessions/:id/turns",
            "body": {
              "type": "choice",
              "choiceId": "hear.cl-2020-008"
            }
          },
          "expect": {
            "status": 200,
            "reply": {
              "kind": "answer",
              "textIncludes": [
                "Storm Ciara struck the UK, Ireland and other European countries in February; more windstorms followed in October.",
                "Storm Ciara: US$2.7bn, 14 deaths. All 2020 European windstorms: US$5.9bn, 30 deaths.",
                "Listed by Christian Aid as influenced by climate change."
              ]
            },
            "facts": [
              {
                "eventId": "CL-2020-008",
                "event": "European windstorms incl. Storm Ciara",
                "year": 2020,
                "date": "Feb & Oct 2020",
                "category": "Storm, cold & winter weather",
                "region": "Europe",
                "location": "UK, Ireland and western Europe",
                "oceanLink": true,
                "whatHappened": "Storm Ciara struck the UK, Ireland and other European countries in February; more windstorms followed in October.",
                "humanImpact": "Storm Ciara: US$2.7bn, 14 deaths. All 2020 European windstorms: US$5.9bn, 30 deaths.",
                "climateLink": "Listed by Christian Aid as influenced by climate change.",
                "notes": null,
                "sources": [
                  {
                    "publisher": "Christian Aid – Counting the cost 2020",
                    "url": "https://mediacentre.christianaid.org.uk/?p=6539",
                    "type": "NGO / research organisation"
                  }
                ]
              }
            ],
            "list": null,
            "choices": [
              "q.warming-waters.2.a",
              "q.warming-waters.2.b",
              "q.warming-waters.2.c",
              "quiz.stop",
              "leave"
            ],
            "quiz": {
              "exhibitId": "warming-waters",
              "questionNumber": 2,
              "of": 3,
              "paused": false
            },
            "state": {
              "favour": 1,
              "changingSea": {
                "told": ["CL-2023-027", "CL-2025-001", "CL-2026-044", "CL-2020-008"],
                "quiz": {
                  "exhibitId": "warming-waters",
                  "questionIndex": 1,
                  "answers": [true]
                }
              }
            }
          }
        },
        {
          "say": "Answer question 2 correctly (a, 83.7%): +1, on to question 3.",
          "request": {
            "method": "POST",
            "path": "/api/sessions/:id/turns",
            "body": {
              "type": "choice",
              "choiceId": "q.warming-waters.2.a"
            }
          },
          "expect": {
            "status": 200,
            "reply": {
              "kind": "quiz",
              "textIncludes": [
                "Which day set the record for the hottest day measured in the world's seas?"
              ]
            },
            "facts": [],
            "choices": [
              "q.warming-waters.3.a",
              "q.warming-waters.3.b",
              "q.warming-waters.3.c",
              "quiz.stop",
              "leave"
            ],
            "quiz": {
              "exhibitId": "warming-waters",
              "questionNumber": 3,
              "of": 3,
              "paused": false
            },
            "state": {
              "favour": 2,
              "changingSea": {
                "quiz": {
                  "exhibitId": "warming-waters",
                  "questionIndex": 2,
                  "answers": [true, true]
                }
              }
            }
          }
        }
      ]
    }
  ]
}
```
