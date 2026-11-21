# 08-rude-to-flood: Rudeness brings the flood

**Covers:** Rude −3, the cold band, and the flood starting on the second rude message.

## Two rude messages

Setup: a fresh session (seed 42).

1. First rude message: −3. Choices stay the same.  
   `POST /api/sessions/:id/turns` {"type": "text", "text": "You are useless"} → **200** rude
2. Second: −6, at or below −5, so the flood starts. Only an apology is offered.  
   `POST /api/sessions/:id/turns` {"type": "text", "text": "Shut up, you idiot"} → **200** flood

## Machine-readable

Phase 2's runner reads this block. Fact objects were copied from `research/events.csv` by script.

```json
{
  "id": "08-rude-to-flood",
  "title": "Rudeness brings the flood",
  "covers": "Rude −3, the cold band, and the flood starting on the second rude message.",
  "scenarios": [
    {
      "name": "Two rude messages",
      "setup": {
        "seed": 42,
        "state": {}
      },
      "turns": [
        {
          "say": "First rude message: −3. Choices stay the same.",
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
            "statusField": "active",
            "reply": {
              "kind": "rude",
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
            "effects": [],
            "progress": {
              "favourBand": "cold"
            },
            "state": {
              "favour": -3,
              "flags": {
                "flooded": false
              }
            }
          }
        },
        {
          "say": "Second: −6, at or below −5, so the flood starts. Only an apology is offered.",
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
              "kind": "flood",
              "factKind": null
            },
            "facts": [],
            "choices": ["apologise"],
            "effects": ["flood"],
            "input": {
              "mode": "both",
              "maxLength": 300
            },
            "progress": {
              "favourBand": "stormy"
            },
            "state": {
              "favour": -6,
              "flags": {
                "flooded": true
              }
            }
          }
        }
      ]
    }
  ]
}
```
