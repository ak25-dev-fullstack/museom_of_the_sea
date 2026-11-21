# 13-meta-and-no-need: Greetings, help and unneeded apologies

**Covers:** The meta kind, climate question winning over a meta phrase, noNeed at zero and at negative favour.

## Fresh visit

Setup: a fresh session (seed 42).

1. A greeting: meta reply with suggestions, no favour change.  
   `POST /api/sessions/:id/turns` {"type": "text", "text": "hello"} → **200** meta
2. Apologising when not flooded: noNeed, no change.  
   `POST /api/sessions/:id/turns` {"type": "text", "text": "sorry"} → **200** noNeed
3. 'Who are you?' is meta too.  
   `POST /api/sessions/:id/turns` {"type": "text", "text": "Who are you?"} → **200** meta
4. Contains the meta phrase 'what can you tell me', but 'storms' makes it a climate question, which is checked first. Storms map to two categories; CL-2020-058 is the top pick.  
   `POST /api/sessions/:id/turns` {"type": "text", "text": "What can you tell me about storms?"} → **200** answer

## Apology at negative favour (not flooded)

Setup: a fresh session (seed 42), then this state is applied over the start state (see `README.md`).

1. Favour −3 but not flooded: still noNeed, favour stays −3.  
   `POST /api/sessions/:id/turns` {"type": "text", "text": "I apologise"} → **200** noNeed

## Machine-readable

Phase 2's runner reads this block. Fact objects were copied from `research/events.csv` by script.

```json
{
  "id": "13-meta-and-no-need",
  "title": "Greetings, help and unneeded apologies",
  "covers": "The meta kind, climate question winning over a meta phrase, noNeed at zero and at negative favour.",
  "scenarios": [
    {
      "name": "Fresh visit",
      "setup": {
        "seed": 42,
        "state": {}
      },
      "turns": [
        {
          "say": "A greeting: meta reply with suggestions, no favour change.",
          "request": {
            "method": "POST",
            "path": "/api/sessions/:id/turns",
            "body": {
              "type": "text",
              "text": "hello"
            }
          },
          "expect": {
            "status": 200,
            "reply": {
              "kind": "meta",
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
            "state": {
              "favour": 0
            }
          }
        },
        {
          "say": "Apologising when not flooded: noNeed, no change.",
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
            "reply": {
              "kind": "noNeed",
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
            "state": {
              "favour": 0,
              "flags": {
                "flooded": false
              }
            }
          }
        },
        {
          "say": "'Who are you?' is meta too.",
          "request": {
            "method": "POST",
            "path": "/api/sessions/:id/turns",
            "body": {
              "type": "text",
              "text": "Who are you?"
            }
          },
          "expect": {
            "status": 200,
            "reply": {
              "kind": "meta"
            },
            "state": {
              "favour": 0
            }
          }
        },
        {
          "say": "Contains the meta phrase 'what can you tell me', but 'storms' makes it a climate question, which is checked first. Storms map to two categories; CL-2020-058 is the top pick.",
          "request": {
            "method": "POST",
            "path": "/api/sessions/:id/turns",
            "body": {
              "type": "text",
              "text": "What can you tell me about storms?"
            }
          },
          "expect": {
            "status": 200,
            "reply": {
              "kind": "answer",
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
            "state": {
              "favour": 1,
              "changingSea": {
                "told": ["CL-2020-058"]
              }
            }
          }
        }
      ]
    },
    {
      "name": "Apology at negative favour (not flooded)",
      "setup": {
        "seed": 42,
        "state": {
          "favour": -3
        }
      },
      "turns": [
        {
          "say": "Favour −3 but not flooded: still noNeed, favour stays −3.",
          "request": {
            "method": "POST",
            "path": "/api/sessions/:id/turns",
            "body": {
              "type": "text",
              "text": "I apologise"
            }
          },
          "expect": {
            "status": 200,
            "reply": {
              "kind": "noNeed"
            },
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
        }
      ]
    }
  ]
}
```
