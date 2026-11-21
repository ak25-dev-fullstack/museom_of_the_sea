# 10-quiz: The quiz, a flood mid-quiz, passing and failing

**Covers:** quiz.start, right and wrong answers, the quiz pausing in a flood and resuming, a token, a fail, review and retry.

## Warming waters: flood in the middle, then a pass

Setup: a fresh session (seed 42), then this state is applied over the start state (see `README.md`).

1. Start the test. Question 1 of 3.  
   `POST /api/sessions/:id/turns` {"type": "choice", "choiceId": "quiz.start"} → **200** quiz
2. Correct (b, 21.02 °C): +1, on to question 2.  
   `POST /api/sessions/:id/turns` {"type": "choice", "choiceId": "q.warming-waters.1.b"} → **200** quiz
3. Rude mid-quiz: −3 − 3 = −6, so the flood starts and the quiz pauses with its state kept.  
   `POST /api/sessions/:id/turns` {"type": "text", "text": "Shut up, you idiot"} → **200** flood
4. Repent: −2, and the same question 2 comes back with the earlier answer kept.  
   `POST /api/sessions/:id/turns` {"type": "text", "text": "sorry"} → **200** repent
5. Wrong (b is 68.2%, the old record; the answer is a, 83.7%). The fact and source are shown. No favour change.  
   `POST /api/sessions/:id/turns` {"type": "choice", "choiceId": "q.warming-waters.2.b"} → **200** quiz
6. Correct (c, 22 August 2026): 2 of 3, a pass. Token earned, back to the hub.  
   `POST /api/sessions/:id/turns` {"type": "choice", "choiceId": "q.warming-waters.3.c"} → **200** quizResult

## Ice and the poles: a fail, then re-reading unlocks a retry

Setup: a fresh session (seed 42), then this state is applied over the start state (see `README.md`).

1. Start the test.  
   `POST /api/sessions/:id/turns` {"type": "choice", "choiceId": "quiz.start"} → **200** quiz
2. Wrong (b, 17.5 °C was the old record). The fact is shown.  
   `POST /api/sessions/:id/turns` {"type": "choice", "choiceId": "q.ice-poles.1.b"} → **200** quiz
3. Wrong (a). The fact is shown.  
   `POST /api/sessions/:id/turns` {"type": "choice", "choiceId": "q.ice-poles.2.a"} → **200** quiz
4. Correct (b): +1, but only 1 of 3. Fail: no token, the exhibit needs a re-read.  
   `POST /api/sessions/:id/turns` {"type": "choice", "choiceId": "q.ice-poles.3.b"} → **200** quizResult
5. Opening the exhibit again clears the review, so quiz.start is offered again.  
   `POST /api/sessions/:id/turns` {"type": "choice", "choiceId": "exhibit.ice-poles"} → **200** exhibit

## Machine-readable

Phase 2's runner reads this block. Fact objects were copied from `research/events.csv` by script.

```json
{
  "id": "10-quiz",
  "title": "The quiz, a flood mid-quiz, passing and failing",
  "covers": "quiz.start, right and wrong answers, the quiz pausing in a flood and resuming, a token, a fail, review and retry.",
  "scenarios": [
    {
      "name": "Warming waters: flood in the middle, then a pass",
      "setup": {
        "seed": 42,
        "state": {
          "favour": -4,
          "currentNodeId": "cs.warming-waters.3",
          "turn": 4,
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
      },
      "turns": [
        {
          "say": "Start the test. Question 1 of 3.",
          "request": {
            "method": "POST",
            "path": "/api/sessions/:id/turns",
            "body": {
              "type": "choice",
              "choiceId": "quiz.start"
            }
          },
          "expect": {
            "status": 200,
            "reply": {
              "kind": "quiz",
              "textIncludes": [
                "What record did global daily sea surface temperature hit in August 2023?"
              ]
            },
            "choices": [
              "q.warming-waters.1.a",
              "q.warming-waters.1.b",
              "q.warming-waters.1.c",
              "quiz.stop",
              "leave"
            ],
            "quiz": {
              "exhibitId": "warming-waters",
              "questionNumber": 1,
              "of": 3,
              "paused": false
            },
            "state": {
              "favour": -4,
              "changingSea": {
                "quiz": {
                  "exhibitId": "warming-waters",
                  "questionIndex": 0,
                  "answers": []
                }
              }
            }
          }
        },
        {
          "say": "Correct (b, 21.02 °C): +1, on to question 2.",
          "request": {
            "method": "POST",
            "path": "/api/sessions/:id/turns",
            "body": {
              "type": "choice",
              "choiceId": "q.warming-waters.1.b"
            }
          },
          "expect": {
            "status": 200,
            "reply": {
              "kind": "quiz",
              "textIncludes": [
                "What share of the world's coral reef area hit bleaching-level heat stress?"
              ]
            },
            "facts": [],
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
              "favour": -3,
              "changingSea": {
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
          "say": "Rude mid-quiz: −3 − 3 = −6, so the flood starts and the quiz pauses with its state kept.",
          "request": {
            "method": "POST",
            "path": "/api/sessions/:id/turns",
            "body": {
              "type": "text",
              "text": "Shut up, you idiot"
            }
          },
          "expect": {
            "status": 200,
            "statusField": "flooded",
            "reply": {
              "kind": "flood"
            },
            "choices": ["apologise"],
            "effects": ["flood"],
            "quiz": {
              "exhibitId": "warming-waters",
              "questionNumber": 2,
              "of": 3,
              "paused": true
            },
            "state": {
              "favour": -6,
              "flags": {
                "flooded": true
              },
              "changingSea": {
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
          "say": "Repent: −2, and the same question 2 comes back with the earlier answer kept.",
          "request": {
            "method": "POST",
            "path": "/api/sessions/:id/turns",
            "body": {
              "type": "text",
              "text": "sorry"
            }
          },
          "expect": {
            "status": 200,
            "statusField": "active",
            "reply": {
              "kind": "repent",
              "textIncludes": [
                "What share of the world's coral reef area hit bleaching-level heat stress?"
              ]
            },
            "choices": [
              "q.warming-waters.2.a",
              "q.warming-waters.2.b",
              "q.warming-waters.2.c",
              "quiz.stop",
              "leave"
            ],
            "effects": ["calm"],
            "quiz": {
              "exhibitId": "warming-waters",
              "questionNumber": 2,
              "of": 3,
              "paused": false
            },
            "state": {
              "favour": -2,
              "flags": {
                "flooded": false
              },
              "changingSea": {
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
          "say": "Wrong (b is 68.2%, the old record; the answer is a, 83.7%). The fact and source are shown. No favour change.",
          "request": {
            "method": "POST",
            "path": "/api/sessions/:id/turns",
            "body": {
              "type": "choice",
              "choiceId": "q.warming-waters.2.b"
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
              "favour": -2,
              "changingSea": {
                "quiz": {
                  "exhibitId": "warming-waters",
                  "questionIndex": 2,
                  "answers": [true, false]
                }
              }
            }
          }
        },
        {
          "say": "Correct (c, 22 August 2026): 2 of 3, a pass. Token earned, back to the hub.",
          "request": {
            "method": "POST",
            "path": "/api/sessions/:id/turns",
            "body": {
              "type": "choice",
              "choiceId": "q.warming-waters.3.c"
            }
          },
          "expect": {
            "status": 200,
            "reply": {
              "kind": "quizResult"
            },
            "choices": [
              "exhibit.warming-waters",
              "exhibit.ice-poles",
              "exhibit.storms-floods",
              "exhibit.rising-seas",
              "exhibit.mortals",
              "leave"
            ],
            "effects": ["token"],
            "quiz": null,
            "progress": {
              "exhibits": [
                {
                  "id": "warming-waters",
                  "title": "Warming waters",
                  "entriesSeen": 3,
                  "token": true
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
              "tokens": 1,
              "favourBand": "neutral"
            },
            "state": {
              "favour": -1,
              "currentNodeId": "cs.hub",
              "knowledge": ["token:warming-waters"],
              "changingSea": {
                "quiz": null,
                "review": []
              }
            }
          }
        }
      ]
    },
    {
      "name": "Ice and the poles: a fail, then re-reading unlocks a retry",
      "setup": {
        "seed": 42,
        "state": {
          "favour": 0,
          "currentNodeId": "cs.ice-poles.3",
          "turn": 3,
          "visited": ["cs.intro", "cs.ice-poles.1", "cs.ice-poles.2", "cs.ice-poles.3"],
          "changingSea": {
            "told": ["CL-2020-009", "CL-2024-034", "CL-2026-047"]
          }
        }
      },
      "turns": [
        {
          "say": "Start the test.",
          "request": {
            "method": "POST",
            "path": "/api/sessions/:id/turns",
            "body": {
              "type": "choice",
              "choiceId": "quiz.start"
            }
          },
          "expect": {
            "status": 200,
            "reply": {
              "kind": "quiz",
              "textIncludes": [
                "What temperature was recorded on the Antarctic continent in February 2020?"
              ]
            },
            "choices": [
              "q.ice-poles.1.a",
              "q.ice-poles.1.b",
              "q.ice-poles.1.c",
              "quiz.stop",
              "leave"
            ]
          }
        },
        {
          "say": "Wrong (b, 17.5 °C was the old record). The fact is shown.",
          "request": {
            "method": "POST",
            "path": "/api/sessions/:id/turns",
            "body": {
              "type": "choice",
              "choiceId": "q.ice-poles.1.b"
            }
          },
          "expect": {
            "status": 200,
            "reply": {
              "kind": "quiz"
            },
            "facts": [
              {
                "eventId": "CL-2020-009",
                "event": "Antarctica's hottest temperature on record: 18.3 °C",
                "year": 2020,
                "date": "6 Feb 2020 (verified 1 Jul 2021)",
                "category": "Sea ice, glaciers & polar",
                "region": "Antarctica & Southern Ocean",
                "location": "Esperanza Base, Antarctic Peninsula",
                "oceanLink": true,
                "whatHappened": "A temperature of 18.3 °C was recorded on the Antarctic continent, beating the previous record of 17.5 °C from March 2015. WMO verified it in 2021.",
                "humanImpact": null,
                "climateLink": null,
                "notes": null,
                "sources": [
                  {
                    "publisher": "WMO",
                    "url": "https://wmo.int/news/media-centre/wmo-verifies-one-temperature-record-antarctic-continent-and-rejects-another",
                    "type": "UN / intergovernmental body"
                  }
                ]
              }
            ],
            "state": {
              "favour": 0
            }
          }
        },
        {
          "say": "Wrong (a). The fact is shown.",
          "request": {
            "method": "POST",
            "path": "/api/sessions/:id/turns",
            "body": {
              "type": "choice",
              "choiceId": "q.ice-poles.2.a"
            }
          },
          "expect": {
            "status": 200,
            "reply": {
              "kind": "quiz"
            },
            "facts": [
              {
                "eventId": "CL-2024-034",
                "event": "Record-low sea ice at both poles",
                "year": 2024,
                "date": "Nov – Dec 2024",
                "category": "Sea ice, glaciers & polar",
                "region": "Global",
                "location": "Arctic and Antarctic",
                "oceanLink": true,
                "whatHappened": "Antarctic sea ice set a record low for November, and Arctic sea ice had its lowest December extent on record.",
                "humanImpact": null,
                "climateLink": null,
                "notes": null,
                "sources": [
                  {
                    "publisher": "Copernicus C3S – Global Climate Highlights 2024",
                    "url": "https://climate.copernicus.eu/global-climate-highlights-2024",
                    "type": "Government / scientific agency"
                  }
                ]
              }
            ],
            "state": {
              "favour": 0
            }
          }
        },
        {
          "say": "Correct (b): +1, but only 1 of 3. Fail: no token, the exhibit needs a re-read.",
          "request": {
            "method": "POST",
            "path": "/api/sessions/:id/turns",
            "body": {
              "type": "choice",
              "choiceId": "q.ice-poles.3.b"
            }
          },
          "expect": {
            "status": 200,
            "reply": {
              "kind": "quizResult"
            },
            "choices": [
              "exhibit.warming-waters",
              "exhibit.ice-poles",
              "exhibit.storms-floods",
              "exhibit.rising-seas",
              "exhibit.mortals",
              "leave"
            ],
            "effects": [],
            "quiz": null,
            "state": {
              "favour": 1,
              "currentNodeId": "cs.hub",
              "knowledge": [],
              "changingSea": {
                "quiz": null,
                "review": ["ice-poles"]
              }
            }
          }
        },
        {
          "say": "Opening the exhibit again clears the review, so quiz.start is offered again.",
          "request": {
            "method": "POST",
            "path": "/api/sessions/:id/turns",
            "body": {
              "type": "choice",
              "choiceId": "exhibit.ice-poles"
            }
          },
          "expect": {
            "status": 200,
            "reply": {
              "kind": "exhibit"
            },
            "facts": [
              {
                "eventId": "CL-2020-009",
                "event": "Antarctica's hottest temperature on record: 18.3 °C",
                "year": 2020,
                "date": "6 Feb 2020 (verified 1 Jul 2021)",
                "category": "Sea ice, glaciers & polar",
                "region": "Antarctica & Southern Ocean",
                "location": "Esperanza Base, Antarctic Peninsula",
                "oceanLink": true,
                "whatHappened": "A temperature of 18.3 °C was recorded on the Antarctic continent, beating the previous record of 17.5 °C from March 2015. WMO verified it in 2021.",
                "humanImpact": null,
                "climateLink": null,
                "notes": null,
                "sources": [
                  {
                    "publisher": "WMO",
                    "url": "https://wmo.int/news/media-centre/wmo-verifies-one-temperature-record-antarctic-continent-and-rejects-another",
                    "type": "UN / intergovernmental body"
                  }
                ]
              }
            ],
            "choices": ["quiz.start", "next", "hub", "leave"],
            "state": {
              "currentNodeId": "cs.ice-poles.1",
              "changingSea": {
                "review": []
              }
            }
          }
        }
      ]
    }
  ]
}
```
