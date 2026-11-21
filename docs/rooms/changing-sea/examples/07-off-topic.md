# 07-off-topic: Off-topic input

**Covers:** Off-topic −1, suggestions, and off-topic input starting the flood at −5.

## Off-topic from a fresh visit

Setup: a fresh session (seed 42).

1. No year, category, topic or known word: off-topic.  
   `POST /api/sessions/:id/turns` {"type": "text", "text": "What's for lunch?"} → **200** offTopic

## Off-topic at −4 starts the flood

Setup: a fresh session (seed 42), then this state is applied over the start state (see `README.md`).

1. −4 − 1 = −5, which is the flood limit.  
   `POST /api/sessions/:id/turns` {"type": "text", "text": "What's for lunch?"} → **200** flood

## Machine-readable

Phase 2's runner reads this block. Fact objects were copied from `research/events.csv` by script.

```json
{
  "id": "07-off-topic",
  "title": "Off-topic input",
  "covers": "Off-topic −1, suggestions, and off-topic input starting the flood at −5.",
  "scenarios": [
    {
      "name": "Off-topic from a fresh visit",
      "setup": {
        "seed": 42,
        "state": {}
      },
      "turns": [
        {
          "say": "No year, category, topic or known word: off-topic.",
          "request": {
            "method": "POST",
            "path": "/api/sessions/:id/turns",
            "body": {
              "type": "text",
              "text": "What's for lunch?"
            }
          },
          "expect": {
            "status": 200,
            "reply": {
              "kind": "offTopic",
              "factKind": null
            },
            "facts": [],
            "suggestionsNonEmpty": true,
            "choices": [
              "exhibit.warming-waters",
              "exhibit.ice-poles",
              "exhibit.storms-floods",
              "exhibit.rising-seas",
              "exhibit.mortals",
              "leave"
            ],
            "progress": {
              "favourBand": "neutral"
            },
            "state": {
              "favour": -1
            }
          }
        }
      ]
    },
    {
      "name": "Off-topic at −4 starts the flood",
      "setup": {
        "seed": 42,
        "state": {
          "favour": -4
        }
      },
      "turns": [
        {
          "say": "−4 − 1 = −5, which is the flood limit.",
          "request": {
            "method": "POST",
            "path": "/api/sessions/:id/turns",
            "body": {
              "type": "text",
              "text": "What's for lunch?"
            }
          },
          "expect": {
            "status": 200,
            "statusField": "flooded",
            "reply": {
              "kind": "flood",
              "factKind": null
            },
            "choices": ["apologise"],
            "effects": ["flood"],
            "progress": {
              "favourBand": "stormy"
            },
            "state": {
              "favour": -5,
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
