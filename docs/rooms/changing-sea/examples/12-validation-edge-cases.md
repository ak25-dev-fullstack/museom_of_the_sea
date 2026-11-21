# 12-validation-edge-cases: Bad input and edge cases

**Covers:** 400/404/409/413 errors with no state change, the 300-character limit, the clarify reply.

## One fresh visit, many bad requests

Setup: a fresh session (seed 42).

1. Whitespace only (Zod trims it, min 1).  
   `POST /api/sessions/:id/turns` {"type": "text", "text": " "} → **400** VALIDATION_ERROR
2. 301 characters.  
   `POST /api/sessions/:id/turns` {"type": "text", "text": {"$repeat": "a", "times": 301}} → **400** VALIDATION_ERROR
3. Body over 10kb (11,000 characters).  
   `POST /api/sessions/:id/turns` {"type": "text", "text": {"$repeat": "a", "times": 11000}} → **413** PAYLOAD_TOO_LARGE
4. Malformed JSON.  
   `POST /api/sessions/:id/turns` {not json → **400** INVALID_JSON
5. Missing type.  
   `POST /api/sessions/:id/turns` {"text": "hi"} → **400** VALIDATION_ERROR
6. Extra field (.strict()).  
   `POST /api/sessions/:id/turns` {"type": "text", "text": "hi", "extra": 1} → **400** VALIDATION_ERROR
7. choiceId with capitals and a space.  
   `POST /api/sessions/:id/turns` {"type": "choice", "choiceId": "Exhibit Warming"} → **400** VALIDATION_ERROR
8. Well-formed choiceId that isn't on screen.  
   `POST /api/sessions/:id/turns` {"type": "choice", "choiceId": "exhibit.atlantis"} → **409** CHOICE_NOT_AVAILABLE
9. Session id that isn't a UUID.  
   `POST /api/sessions/not-a-uuid/turns` {"type": "text", "text": "hi"} → **400** VALIDATION_ERROR
10. Well-formed but unknown session id.  
    `POST /api/sessions/00000000-0000-4000-8000-000000000000/turns` {"type": "text", "text": "hi"} → **404** SESSION_NOT_FOUND
11. Unknown session and bad body: validation runs first, so 400, not 404.  
    `POST /api/sessions/00000000-0000-4000-8000-000000000000/turns` {"type": "text", "text": ""} → **400** VALIDATION_ERROR
12. Only punctuation: valid, but empty after normalising, so clarify. No change except turn.  
    `POST /api/sessions/:id/turns` {"type": "text", "text": "???"} → **200** clarify
13. Exactly 300 characters is allowed. It matches nothing, so it is off-topic (−1).  
    `POST /api/sessions/:id/turns` {"type": "text", "text": {"$repeat": "a", "times": 300}} → **200** offTopic

## Machine-readable

Phase 2's runner reads this block. Fact objects were copied from `research/events.csv` by script.

```json
{
  "id": "12-validation-edge-cases",
  "title": "Bad input and edge cases",
  "covers": "400/404/409/413 errors with no state change, the 300-character limit, the clarify reply.",
  "scenarios": [
    {
      "name": "One fresh visit, many bad requests",
      "setup": {
        "seed": 42,
        "state": {}
      },
      "turns": [
        {
          "say": "Whitespace only (Zod trims it, min 1).",
          "request": {
            "method": "POST",
            "path": "/api/sessions/:id/turns",
            "body": {
              "type": "text",
              "text": "   "
            }
          },
          "expect": {
            "status": 400,
            "error": {
              "code": "VALIDATION_ERROR"
            },
            "stateUnchanged": true
          }
        },
        {
          "say": "301 characters.",
          "request": {
            "method": "POST",
            "path": "/api/sessions/:id/turns",
            "body": {
              "type": "text",
              "text": {
                "$repeat": "a",
                "times": 301
              }
            }
          },
          "expect": {
            "status": 400,
            "error": {
              "code": "VALIDATION_ERROR"
            },
            "stateUnchanged": true
          }
        },
        {
          "say": "Body over 10kb (11,000 characters).",
          "request": {
            "method": "POST",
            "path": "/api/sessions/:id/turns",
            "body": {
              "type": "text",
              "text": {
                "$repeat": "a",
                "times": 11000
              }
            }
          },
          "expect": {
            "status": 413,
            "error": {
              "code": "PAYLOAD_TOO_LARGE"
            },
            "stateUnchanged": true
          }
        },
        {
          "say": "Malformed JSON.",
          "request": {
            "method": "POST",
            "path": "/api/sessions/:id/turns",
            "rawBody": "{not json",
            "contentType": "application/json"
          },
          "expect": {
            "status": 400,
            "error": {
              "code": "INVALID_JSON"
            },
            "stateUnchanged": true
          }
        },
        {
          "say": "Missing type.",
          "request": {
            "method": "POST",
            "path": "/api/sessions/:id/turns",
            "body": {
              "text": "hi"
            }
          },
          "expect": {
            "status": 400,
            "error": {
              "code": "VALIDATION_ERROR"
            },
            "stateUnchanged": true
          }
        },
        {
          "say": "Extra field (.strict()).",
          "request": {
            "method": "POST",
            "path": "/api/sessions/:id/turns",
            "body": {
              "type": "text",
              "text": "hi",
              "extra": 1
            }
          },
          "expect": {
            "status": 400,
            "error": {
              "code": "VALIDATION_ERROR"
            },
            "stateUnchanged": true
          }
        },
        {
          "say": "choiceId with capitals and a space.",
          "request": {
            "method": "POST",
            "path": "/api/sessions/:id/turns",
            "body": {
              "type": "choice",
              "choiceId": "Exhibit Warming"
            }
          },
          "expect": {
            "status": 400,
            "error": {
              "code": "VALIDATION_ERROR"
            },
            "stateUnchanged": true
          }
        },
        {
          "say": "Well-formed choiceId that isn't on screen.",
          "request": {
            "method": "POST",
            "path": "/api/sessions/:id/turns",
            "body": {
              "type": "choice",
              "choiceId": "exhibit.atlantis"
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
          "say": "Session id that isn't a UUID.",
          "request": {
            "method": "POST",
            "path": "/api/sessions/not-a-uuid/turns",
            "body": {
              "type": "text",
              "text": "hi"
            }
          },
          "expect": {
            "status": 400,
            "error": {
              "code": "VALIDATION_ERROR"
            },
            "stateUnchanged": true
          }
        },
        {
          "say": "Well-formed but unknown session id.",
          "request": {
            "method": "POST",
            "path": "/api/sessions/00000000-0000-4000-8000-000000000000/turns",
            "body": {
              "type": "text",
              "text": "hi"
            }
          },
          "expect": {
            "status": 404,
            "error": {
              "code": "SESSION_NOT_FOUND"
            },
            "stateUnchanged": true
          }
        },
        {
          "say": "Unknown session and bad body: validation runs first, so 400, not 404.",
          "request": {
            "method": "POST",
            "path": "/api/sessions/00000000-0000-4000-8000-000000000000/turns",
            "body": {
              "type": "text",
              "text": ""
            }
          },
          "expect": {
            "status": 400,
            "error": {
              "code": "VALIDATION_ERROR"
            },
            "stateUnchanged": true
          }
        },
        {
          "say": "Only punctuation: valid, but empty after normalising, so clarify. No change except turn.",
          "request": {
            "method": "POST",
            "path": "/api/sessions/:id/turns",
            "body": {
              "type": "text",
              "text": "???"
            }
          },
          "expect": {
            "status": 200,
            "reply": {
              "kind": "clarify",
              "factKind": null
            },
            "facts": [],
            "choices": [
              "exhibit.warming-waters",
              "exhibit.ice-poles",
              "exhibit.storms-floods",
              "exhibit.rising-seas",
              "exhibit.mortals",
              "leave"
            ],
            "turn": 1,
            "state": {
              "favour": 0
            }
          }
        },
        {
          "say": "Exactly 300 characters is allowed. It matches nothing, so it is off-topic (−1).",
          "request": {
            "method": "POST",
            "path": "/api/sessions/:id/turns",
            "body": {
              "type": "text",
              "text": {
                "$repeat": "a",
                "times": 300
              }
            }
          },
          "expect": {
            "status": 200,
            "reply": {
              "kind": "offTopic"
            },
            "turn": 2,
            "state": {
              "favour": -1
            }
          }
        }
      ]
    }
  ]
}
```
