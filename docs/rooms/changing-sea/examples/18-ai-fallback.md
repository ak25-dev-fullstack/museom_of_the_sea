# 18-ai-fallback: The optional AI fallback (stubbed)

**Covers:** AI_ENABLED on with a stub: aiAnswer only on noMatch, labelled 'AI, unverified', no facts, no favour, nothing told; only the visitor's text is sent; errors and timeouts fall back to noMatch; never used for a matched question or while flooded.

## The stub answers a noMatch question

Setup: a fresh session (seed 42).
AI: `AI_ENABLED` on, stub `answer` (see `README.md`).

1. No match in the records, so the AI service is asked, with only the visitor's text.  
   `POST /api/sessions/:id/turns` {"type": "text", "text": "Tell me about volcanoes in 2019"} → **200** aiAnswer

## The stub throws an error

Setup: a fresh session (seed 42).
AI: `AI_ENABLED` on, stub `error` (see `README.md`).

1. The AI call fails, so the visitor gets the normal in-character noMatch.  
   `POST /api/sessions/:id/turns` {"type": "text", "text": "Tell me about volcanoes in 2019"} → **200** noMatch

## The stub is too slow

Setup: a fresh session (seed 42).
AI: `AI_ENABLED` on, stub `slow` (see `README.md`).

1. The AI call times out (the runner sets timeoutMs: 50), so the visitor gets the normal noMatch.  
   `POST /api/sessions/:id/turns` {"type": "text", "text": "Tell me about volcanoes in 2019"} → **200** noMatch

## AI is on but not needed

Setup: a fresh session (seed 42).
AI: `AI_ENABLED` on, stub `answer` (see `README.md`).

1. A question the records answer never goes to the AI.  
   `POST /api/sessions/:id/turns` {"type": "text", "text": "What hurricanes happened in 2020?"} → **200** answer
2. Rude twice: 1 − 3 = −2, then −5, so the flood starts.  
   `POST /api/sessions/:id/turns` {"type": "text", "text": "You are useless"} → **200** rude
3. (second rude message)  
   `POST /api/sessions/:id/turns` {"type": "text", "text": "Shut up, you idiot"} → **200** flood
4. A noMatch-style question while flooded gets the flood reply. The AI is never asked during the flood.  
   `POST /api/sessions/:id/turns` {"type": "text", "text": "Tell me about volcanoes in 2019"} → **200** flood

## Machine-readable

Phase 2's runner reads this block. Fact objects were copied from `research/events.csv` by script.

```json
{
  "id": "18-ai-fallback",
  "title": "The optional AI fallback (stubbed)",
  "covers": "AI_ENABLED on with a stub: aiAnswer only on noMatch, labelled 'AI, unverified', no facts, no favour, nothing told; only the visitor's text is sent; errors and timeouts fall back to noMatch; never used for a matched question or while flooded.",
  "scenarios": [
    {
      "name": "The stub answers a noMatch question",
      "setup": {
        "seed": 42,
        "state": {},
        "ai": {
          "enabled": true,
          "stub": "answer",
          "reply": "Volcanoes shape the sea floor, but I cannot vouch for this answer."
        }
      },
      "turns": [
        {
          "say": "No match in the records, so the AI service is asked, with only the visitor's text.",
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
              "kind": "aiAnswer",
              "factKind": null,
              "label": "AI, unverified",
              "textIncludes": ["Volcanoes shape the sea floor, but I cannot vouch for this answer."]
            },
            "facts": [],
            "list": null,
            "suggestionsCount": 3,
            "effects": [],
            "aiCalls": 1,
            "aiLastInput": "Tell me about volcanoes in 2019",
            "state": {
              "favour": 0,
              "changingSea": {
                "told": []
              }
            }
          }
        }
      ]
    },
    {
      "name": "The stub throws an error",
      "setup": {
        "seed": 42,
        "state": {},
        "ai": {
          "enabled": true,
          "stub": "error"
        }
      },
      "turns": [
        {
          "say": "The AI call fails, so the visitor gets the normal in-character noMatch.",
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
            "state": {
              "favour": 0,
              "changingSea": {
                "told": []
              }
            },
            "aiCalls": 1
          }
        }
      ]
    },
    {
      "name": "The stub is too slow",
      "setup": {
        "seed": 42,
        "state": {},
        "ai": {
          "enabled": true,
          "stub": "slow"
        }
      },
      "turns": [
        {
          "say": "The AI call times out (the runner sets timeoutMs: 50), so the visitor gets the normal noMatch.",
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
            "state": {
              "favour": 0,
              "changingSea": {
                "told": []
              }
            },
            "aiCalls": 1
          }
        }
      ]
    },
    {
      "name": "AI is on but not needed",
      "setup": {
        "seed": 42,
        "state": {},
        "ai": {
          "enabled": true,
          "stub": "answer",
          "reply": "Volcanoes shape the sea floor, but I cannot vouch for this answer."
        }
      },
      "turns": [
        {
          "say": "A question the records answer never goes to the AI.",
          "request": {
            "method": "POST",
            "path": "/api/sessions/:id/turns",
            "body": {
              "type": "text",
              "text": "What hurricanes happened in 2020?"
            }
          },
          "expect": {
            "status": 200,
            "reply": {
              "kind": "answer",
              "label": null,
              "textIncludes": [
                "A record 30 named storms formed, including 14 hurricanes (2nd most), with record water levels at several sites.",
                "400+ deaths; 200,000+ displaced; about US$41 billion losses (Christian Aid).",
                "A 2022 study found climate change increased extreme 3-hour hurricane rainfall by about 11% in 2020."
              ]
            },
            "facts": [
              {
                "eventId": "CL-2020-058",
                "event": "Record-breaking 2020 Atlantic hurricane season",
                "year": 2020,
                "date": "Season ended 30 Nov 2020",
                "category": "Tropical cyclone (hurricane/typhoon/cyclone)",
                "region": "Atlantic Ocean",
                "location": "Atlantic basin, USA, Central America, Caribbean",
                "oceanLink": true,
                "whatHappened": "A record 30 named storms formed, including 14 hurricanes (2nd most), with record water levels at several sites.",
                "humanImpact": "400+ deaths; 200,000+ displaced; about US$41 billion losses (Christian Aid).",
                "climateLink": "A 2022 study found climate change increased extreme 3-hour hurricane rainfall by about 11% in 2020.",
                "notes": null,
                "sources": [
                  {
                    "publisher": "NOAA",
                    "url": "https://www.noaa.gov/media-release/record-breaking-atlantic-hurricane-season-draws-to-end",
                    "type": "Government / scientific agency"
                  },
                  {
                    "publisher": "Nature Communications – 2020 storm rainfall attribution",
                    "url": "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9005694",
                    "type": "Scientific journal / study"
                  }
                ]
              }
            ],
            "aiCalls": 0,
            "state": {
              "favour": 1
            }
          }
        },
        {
          "say": "Rude twice: 1 − 3 = −2, then −5, so the flood starts.",
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
            "reply": {
              "kind": "rude"
            },
            "aiCalls": 0,
            "state": {
              "favour": -2
            }
          }
        },
        {
          "say": "(second rude message)",
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
            "aiCalls": 0,
            "state": {
              "favour": -5
            }
          }
        },
        {
          "say": "A noMatch-style question while flooded gets the flood reply. The AI is never asked during the flood.",
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
            "statusField": "flooded",
            "reply": {
              "kind": "flood",
              "label": null
            },
            "aiCalls": 0,
            "state": {
              "favour": -5
            }
          }
        }
      ]
    }
  ]
}
```
