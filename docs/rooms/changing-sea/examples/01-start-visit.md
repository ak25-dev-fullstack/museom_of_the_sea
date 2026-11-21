# 01-start-visit: Start a visit

**Covers:** Session start, the intro/hub view, resuming with GET.

## A new visit starts at the intro with five exhibits and leave

Setup: no session yet.

1. The visitor walks in. The guide greets them and shows the five exhibits.  
   `POST /api/sessions` {"room": "changing-sea", "seed": 42} → **201** intro
2. The client reloads. GET returns the same view again without changing anything.  
   `GET /api/sessions/:id` (no body) → **200**

## Machine-readable

Phase 2's runner reads this block. Fact objects were copied from `research/events.csv` by script.

```json
{
  "id": "01-start-visit",
  "title": "Start a visit",
  "covers": "Session start, the intro/hub view, resuming with GET.",
  "scenarios": [
    {
      "name": "A new visit starts at the intro with five exhibits and leave",
      "setup": {
        "seed": 42,
        "start": false
      },
      "turns": [
        {
          "say": "The visitor walks in. The guide greets them and shows the five exhibits.",
          "request": {
            "method": "POST",
            "path": "/api/sessions",
            "body": {
              "room": "changing-sea",
              "seed": 42
            }
          },
          "expect": {
            "status": 201,
            "statusField": "active",
            "turn": 0,
            "reply": {
              "kind": "intro",
              "speaker": "poseidon",
              "factKind": "myth"
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
            "suggestionsNonEmpty": true,
            "input": {
              "mode": "both",
              "maxLength": 300
            },
            "quiz": null,
            "progress": {
              "exhibits": [
                {
                  "id": "warming-waters",
                  "title": "Warming waters",
                  "entriesSeen": 0,
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
            "effects": [],
            "ending": null,
            "state": {
              "currentNodeId": "cs.intro",
              "favour": 0,
              "flags": {
                "flooded": false
              },
              "knowledge": [],
              "visited": ["cs.intro"],
              "changingSea": {
                "status": "active",
                "told": [],
                "review": [],
                "quiz": null,
                "endingId": null
              }
            }
          }
        },
        {
          "say": "The client reloads. GET returns the same view again without changing anything.",
          "request": {
            "method": "GET",
            "path": "/api/sessions/:id"
          },
          "expect": {
            "status": 200,
            "sameAsPreviousResponse": true,
            "stateUnchanged": true
          }
        }
      ]
    }
  ]
}
```
