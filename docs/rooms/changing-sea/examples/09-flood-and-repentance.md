# 09-flood-and-repentance: The flood, repentance, and flooding again

**Covers:** Input while flooded, 409 for leave while flooded, repent to −2, an immediate re-flood, repent by choice.

## Flooded at −6, at the hub

Setup: a fresh session (seed 42), then this state is applied over the start state (see `README.md`).

1. A climate question while flooded gets only the flood reply. Nothing is told.  
   `POST /api/sessions/:id/turns` {"type": "text", "text": "Tell me about coral"} → **200** flood
2. The visitor tries to leave. Leave is not offered during the flood.  
   `POST /api/sessions/:id/turns` {"type": "choice", "choiceId": "leave"} → **409** CHOICE_NOT_AVAILABLE
3. Rude while flooded: still just the flood reply, no further drop.  
   `POST /api/sessions/:id/turns` {"type": "text", "text": "You idiot"} → **200** flood
4. A typed apology. The flood ends, favour is set to −2, back to the hub's choices.  
   `POST /api/sessions/:id/turns` {"type": "text", "text": "I'm sorry"} → **200** repent
5. On purpose: one rude message straight after repenting. −2 − 3 = −5, so it floods again.  
   `POST /api/sessions/:id/turns` {"type": "text", "text": "You are useless"} → **200** flood
6. This time the visitor clicks Apologise. Same result as typing it.  
   `POST /api/sessions/:id/turns` {"type": "choice", "choiceId": "apologise"} → **200** repent

## Machine-readable

Phase 2's runner reads this block. Fact objects were copied from `research/events.csv` by script.

```json
{
  "id": "09-flood-and-repentance",
  "title": "The flood, repentance, and flooding again",
  "covers": "Input while flooded, 409 for leave while flooded, repent to −2, an immediate re-flood, repent by choice.",
  "scenarios": [
    {
      "name": "Flooded at −6, at the hub",
      "setup": {
        "seed": 42,
        "state": {
          "favour": -6,
          "flags": {
            "flooded": true
          },
          "currentNodeId": "cs.hub",
          "visited": ["cs.intro", "cs.hub"],
          "turn": 3
        }
      },
      "turns": [
        {
          "say": "A climate question while flooded gets only the flood reply. Nothing is told.",
          "request": {
            "method": "POST",
            "path": "/api/sessions/:id/turns",
            "body": {
              "type": "text",
              "text": "Tell me about coral"
            }
          },
          "expect": {
            "status": 200,
            "statusField": "flooded",
            "reply": {
              "kind": "flood"
            },
            "facts": [],
            "choices": ["apologise"],
            "effects": [],
            "state": {
              "favour": -6,
              "changingSea": {
                "told": []
              }
            }
          }
        },
        {
          "say": "The visitor tries to leave. Leave is not offered during the flood.",
          "request": {
            "method": "POST",
            "path": "/api/sessions/:id/turns",
            "body": {
              "type": "choice",
              "choiceId": "leave"
            }
          },
          "expect": {
            "status": 409,
            "error": {
              "code": "CHOICE_NOT_AVAILABLE"
            },
            "stateUnchanged": true
          }
        },
        {
          "say": "Rude while flooded: still just the flood reply, no further drop.",
          "request": {
            "method": "POST",
            "path": "/api/sessions/:id/turns",
            "body": {
              "type": "text",
              "text": "You idiot"
            }
          },
          "expect": {
            "status": 200,
            "statusField": "flooded",
            "reply": {
              "kind": "flood"
            },
            "effects": [],
            "state": {
              "favour": -6
            }
          }
        },
        {
          "say": "A typed apology. The flood ends, favour is set to −2, back to the hub's choices.",
          "request": {
            "method": "POST",
            "path": "/api/sessions/:id/turns",
            "body": {
              "type": "text",
              "text": "I'm sorry"
            }
          },
          "expect": {
            "status": 200,
            "statusField": "active",
            "reply": {
              "kind": "repent"
            },
            "choices": [
              "exhibit.warming-waters",
              "exhibit.ice-poles",
              "exhibit.storms-floods",
              "exhibit.rising-seas",
              "exhibit.mortals",
              "leave"
            ],
            "effects": ["calm"],
            "progress": {
              "favourBand": "cold"
            },
            "state": {
              "favour": -2,
              "flags": {
                "flooded": false
              },
              "currentNodeId": "cs.hub"
            }
          }
        },
        {
          "say": "On purpose: one rude message straight after repenting. −2 − 3 = −5, so it floods again.",
          "request": {
            "method": "POST",
            "path": "/api/sessions/:id/turns",
            "body": {
              "type": "text",
              "text": "You are useless"
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
            "state": {
              "favour": -5,
              "flags": {
                "flooded": true
              }
            }
          }
        },
        {
          "say": "This time the visitor clicks Apologise. Same result as typing it.",
          "request": {
            "method": "POST",
            "path": "/api/sessions/:id/turns",
            "body": {
              "type": "choice",
              "choiceId": "apologise"
            }
          },
          "expect": {
            "status": 200,
            "statusField": "active",
            "reply": {
              "kind": "repent"
            },
            "choices": [
              "exhibit.warming-waters",
              "exhibit.ice-poles",
              "exhibit.storms-floods",
              "exhibit.rising-seas",
              "exhibit.mortals",
              "leave"
            ],
            "effects": ["calm"],
            "state": {
              "favour": -2,
              "flags": {
                "flooded": false
              }
            }
          }
        }
      ]
    }
  ]
}
```
