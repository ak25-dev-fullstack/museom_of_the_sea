# 11-leave-and-endings: Leaving the room: the three endings

**Covers:** Ending by tokens, the learned-facts list, 409 VISIT_ENDED, GET after the end.

## 2 tokens: Student of the Sea

Setup: a fresh session (seed 42), then this state is applied over the start state (see `README.md`).

1. Leave. 2 tokens gives Student of the Sea. Favour 4 (warm) only picks the farewell wording.  
   `POST /api/sessions/:id/turns` {"type": "choice", "choiceId": "leave"} → **200** ending
2. Any turn after the end is refused.  
   `POST /api/sessions/:id/turns` {"type": "text", "text": "hello"} → **409** VISIT_ENDED
3. GET still shows the ending.  
   `GET /api/sessions/:id` (no body) → **200** ending

## 0 tokens straight away: Landlubber

Setup: a fresh session (seed 42).

1. Leaving at once.  
   `POST /api/sessions/:id/turns` {"type": "choice", "choiceId": "leave"} → **200** ending

## 5 tokens: Keeper of the Tides

Setup: a fresh session (seed 42), then this state is applied over the start state (see `README.md`).

1. All five tokens.  
   `POST /api/sessions/:id/turns` {"type": "choice", "choiceId": "leave"} → **200** ending

## Machine-readable

Phase 2's runner reads this block. Fact objects were copied from `research/events.csv` by script.

```json
{
  "id": "11-leave-and-endings",
  "title": "Leaving the room: the three endings",
  "covers": "Ending by tokens, the learned-facts list, 409 VISIT_ENDED, GET after the end.",
  "scenarios": [
    {
      "name": "2 tokens: Student of the Sea",
      "setup": {
        "seed": 42,
        "state": {
          "favour": 4,
          "currentNodeId": "cs.hub",
          "turn": 14,
          "knowledge": ["token:warming-waters", "token:ice-poles"],
          "visited": [
            "cs.intro",
            "cs.warming-waters.1",
            "cs.warming-waters.2",
            "cs.warming-waters.3",
            "cs.hub",
            "cs.ice-poles.1",
            "cs.ice-poles.2",
            "cs.ice-poles.3"
          ],
          "changingSea": {
            "told": [
              "CL-2023-027",
              "CL-2025-001",
              "CL-2026-044",
              "CL-2020-009",
              "CL-2024-034",
              "CL-2026-047"
            ]
          }
        }
      },
      "turns": [
        {
          "say": "Leave. 2 tokens gives Student of the Sea. Favour 4 (warm) only picks the farewell wording.",
          "request": {
            "method": "POST",
            "path": "/api/sessions/:id/turns",
            "body": {
              "type": "choice",
              "choiceId": "leave"
            }
          },
          "expect": {
            "status": 200,
            "statusField": "ended",
            "reply": {
              "kind": "ending"
            },
            "factIds": [
              "CL-2023-027",
              "CL-2025-001",
              "CL-2026-044",
              "CL-2020-009",
              "CL-2024-034",
              "CL-2026-047"
            ],
            "choices": [],
            "input": {
              "mode": "none",
              "maxLength": 300
            },
            "ending": {
              "id": "student-of-the-sea",
              "title": "Student of the Sea",
              "tokens": ["warming-waters", "ice-poles"]
            },
            "state": {
              "changingSea": {
                "status": "ended",
                "endingId": "student-of-the-sea"
              }
            }
          }
        },
        {
          "say": "Any turn after the end is refused.",
          "request": {
            "method": "POST",
            "path": "/api/sessions/:id/turns",
            "body": {
              "type": "text",
              "text": "hello"
            }
          },
          "expect": {
            "status": 409,
            "error": {
              "code": "VISIT_ENDED"
            },
            "stateUnchanged": true
          }
        },
        {
          "say": "GET still shows the ending.",
          "request": {
            "method": "GET",
            "path": "/api/sessions/:id"
          },
          "expect": {
            "status": 200,
            "statusField": "ended",
            "reply": {
              "kind": "ending"
            },
            "sameAsResponseOfTurn": 1,
            "stateUnchanged": true
          }
        }
      ]
    },
    {
      "name": "0 tokens straight away: Landlubber",
      "setup": {
        "seed": 42,
        "state": {}
      },
      "turns": [
        {
          "say": "Leaving at once.",
          "request": {
            "method": "POST",
            "path": "/api/sessions/:id/turns",
            "body": {
              "type": "choice",
              "choiceId": "leave"
            }
          },
          "expect": {
            "status": 200,
            "statusField": "ended",
            "reply": {
              "kind": "ending"
            },
            "facts": [],
            "choices": [],
            "ending": {
              "id": "landlubber",
              "title": "Landlubber",
              "tokens": []
            },
            "state": {
              "changingSea": {
                "status": "ended",
                "endingId": "landlubber"
              }
            }
          }
        }
      ]
    },
    {
      "name": "5 tokens: Keeper of the Tides",
      "setup": {
        "seed": 42,
        "state": {
          "favour": 0,
          "currentNodeId": "cs.hub",
          "turn": 40,
          "knowledge": [
            "token:warming-waters",
            "token:ice-poles",
            "token:storms-floods",
            "token:rising-seas",
            "token:mortals"
          ],
          "visited": [
            "cs.intro",
            "cs.warming-waters.1",
            "cs.warming-waters.2",
            "cs.warming-waters.3",
            "cs.ice-poles.1",
            "cs.ice-poles.2",
            "cs.ice-poles.3",
            "cs.storms-floods.1",
            "cs.storms-floods.2",
            "cs.storms-floods.3",
            "cs.rising-seas.1",
            "cs.rising-seas.2",
            "cs.rising-seas.3",
            "cs.mortals.1",
            "cs.mortals.2",
            "cs.mortals.3",
            "cs.hub"
          ],
          "changingSea": {
            "told": [
              "CL-2023-027",
              "CL-2025-001",
              "CL-2026-044",
              "CL-2020-009",
              "CL-2024-034",
              "CL-2026-047",
              "CL-2020-058",
              "CL-2020-015",
              "CL-2024-029",
              "CL-2021-020",
              "CL-2026-034",
              "CL-2026-054",
              "CL-2023-007",
              "CL-2023-040",
              "CL-2024-018"
            ]
          }
        }
      },
      "turns": [
        {
          "say": "All five tokens.",
          "request": {
            "method": "POST",
            "path": "/api/sessions/:id/turns",
            "body": {
              "type": "choice",
              "choiceId": "leave"
            }
          },
          "expect": {
            "status": 200,
            "statusField": "ended",
            "reply": {
              "kind": "ending"
            },
            "factIds": [
              "CL-2023-027",
              "CL-2025-001",
              "CL-2026-044",
              "CL-2020-009",
              "CL-2024-034",
              "CL-2026-047",
              "CL-2020-058",
              "CL-2020-015",
              "CL-2024-029",
              "CL-2021-020",
              "CL-2026-034",
              "CL-2026-054",
              "CL-2023-007",
              "CL-2023-040",
              "CL-2024-018"
            ],
            "ending": {
              "id": "keeper-of-the-tides",
              "title": "Keeper of the Tides",
              "tokens": ["warming-waters", "ice-poles", "storms-floods", "rising-seas", "mortals"]
            },
            "state": {
              "changingSea": {
                "endingId": "keeper-of-the-tides"
              }
            }
          }
        }
      ]
    }
  ]
}
```
