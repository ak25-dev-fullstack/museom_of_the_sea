# 06-no-match: A question the data can't answer

**Covers:** noMatch for a year outside 2020–2026 and for an empty filter result; no favour change.

## Out-of-range year, then an in-range question with no events

Setup: a fresh session (seed 42).

1. 2019 is outside the guide's years. An honest question, so no penalty. The guide stays in character: it says what its records cover (2020 to 2026 and the five themes) and never says it doesn't know.  
   `POST /api/sessions/:id/turns` {"type": "text", "text": "Tell me about volcanoes in 2019"} → **200** noMatch
2. El Niño plus 2020 is a valid filter, but no event matches both. Same in-character reply.  
   `POST /api/sessions/:id/turns` {"type": "text", "text": "Any El Niño news in 2020?"} → **200** noMatch
3. A list question with no matches gets the same noMatch reply.  
   `POST /api/sessions/:id/turns` {"type": "text", "text": "How many El Niño events were there in 2020?"} → **200** noMatch

## Machine-readable

Phase 2's runner reads this block. Fact objects were copied from `research/events.csv` by script.

```json
{
  "id": "06-no-match",
  "title": "A question the data can't answer",
  "covers": "noMatch for a year outside 2020–2026 and for an empty filter result; no favour change.",
  "scenarios": [
    {
      "name": "Out-of-range year, then an in-range question with no events",
      "setup": {
        "seed": 42,
        "state": {}
      },
      "turns": [
        {
          "say": "2019 is outside the guide's years. An honest question, so no penalty. The guide stays in character: it says what its records cover (2020 to 2026 and the five themes) and never says it doesn't know.",
          "request": {
            "method": "POST",
            "path": "/api/sessions/:id/turns",
            "body": {
              "type": "text",
              "text": "Tell me about volcanoes in 2019"
            }
          },
          "expect": {
            "status": 200,
            "reply": {
              "kind": "noMatch",
              "factKind": null,
              "label": null,
              "textIncludes": [
                "2020",
                "2026",
                "Warming waters",
                "Ice and the poles",
                "Storms and floods",
                "Rising seas",
                "What mortals have done"
              ],
              "textExcludes": ["i don't know", "i do not know", "don't know", "not sure"]
            },
            "facts": [],
            "list": null,
            "suggestionsCount": 3,
            "choices": [
              "exhibit.warming-waters",
              "exhibit.ice-poles",
              "exhibit.storms-floods",
              "exhibit.rising-seas",
              "exhibit.mortals",
              "leave"
            ],
            "state": {
              "favour": 0,
              "changingSea": {
                "told": []
              }
            }
          }
        },
        {
          "say": "El Niño plus 2020 is a valid filter, but no event matches both. Same in-character reply.",
          "request": {
            "method": "POST",
            "path": "/api/sessions/:id/turns",
            "body": {
              "type": "text",
              "text": "Any El Niño news in 2020?"
            }
          },
          "expect": {
            "status": 200,
            "reply": {
              "kind": "noMatch",
              "factKind": null,
              "textIncludes": [
                "2020",
                "2026",
                "Warming waters",
                "Ice and the poles",
                "Storms and floods",
                "Rising seas",
                "What mortals have done"
              ],
              "textExcludes": ["i don't know", "i do not know", "don't know", "not sure"]
            },
            "facts": [],
            "suggestionsCount": 3,
            "state": {
              "favour": 0,
              "changingSea": {
                "told": []
              }
            }
          }
        },
        {
          "say": "A list question with no matches gets the same noMatch reply.",
          "request": {
            "method": "POST",
            "path": "/api/sessions/:id/turns",
            "body": {
              "type": "text",
              "text": "How many El Niño events were there in 2020?"
            }
          },
          "expect": {
            "status": 200,
            "reply": {
              "kind": "noMatch",
              "textIncludes": [
                "2020",
                "2026",
                "Warming waters",
                "Ice and the poles",
                "Storms and floods",
                "Rising seas",
                "What mortals have done"
              ],
              "textExcludes": ["i don't know", "i do not know", "don't know", "not sure"]
            },
            "list": null,
            "suggestionsCount": 3,
            "state": {
              "favour": 0
            }
          }
        }
      ]
    }
  ]
}
```
