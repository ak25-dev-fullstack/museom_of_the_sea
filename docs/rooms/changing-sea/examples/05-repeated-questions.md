# 05-repeated-questions: Asking the same question again

**Covers:** Skipping told events, +1 only for new events, alreadyTold when nothing is left.

## Repeat a question with more answers, then one with a single answer

Setup: a fresh session (seed 42), then this state is applied over the start state (see `README.md`).

1. Same hurricane question again: CL-2020-058 is told, so the next one, CL-2020-015, comes back.  
   `POST /api/sessions/:id/turns` {"type": "text", "text": "What hurricanes happened in 2020?"} → **200** answer
2. Sea level in 2021 matches exactly one event.  
   `POST /api/sessions/:id/turns` {"type": "text", "text": "What happened with sea level in 2021?"} → **200** answer
3. Asked again: nothing new is left, so the guide says so and shows the fact again. No favour gain.  
   `POST /api/sessions/:id/turns` {"type": "text", "text": "What happened with sea level in 2021?"} → **200** alreadyTold

## Machine-readable

Phase 2's runner reads this block. Fact objects were copied from `research/events.csv` by script.

```json
{
  "id": "05-repeated-questions",
  "title": "Asking the same question again",
  "covers": "Skipping told events, +1 only for new events, alreadyTold when nothing is left.",
  "scenarios": [
    {
      "name": "Repeat a question with more answers, then one with a single answer",
      "setup": {
        "seed": 42,
        "state": {
          "favour": 1,
          "turn": 1,
          "changingSea": {
            "told": ["CL-2020-058"]
          }
        }
      },
      "turns": [
        {
          "say": "Same hurricane question again: CL-2020-058 is told, so the next one, CL-2020-015, comes back.",
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
              "textIncludes": [
                "The first super cyclonic storm in the Bay of Bengal since 1999 and the costliest cyclone on record in the North Indian Ocean.",
                "128 deaths; 4.9 million displaced (the biggest displacement of 2020); about US$13–13.7 billion damage.",
                "Listed by Christian Aid as influenced by climate change."
              ]
            },
            "facts": [
              {
                "eventId": "CL-2020-015",
                "event": "Super Cyclone Amphan",
                "year": 2020,
                "date": "16 – 21 May 2020",
                "category": "Tropical cyclone (hurricane/typhoon/cyclone)",
                "region": "Asia",
                "location": "India, Bangladesh (Bay of Bengal)",
                "oceanLink": true,
                "whatHappened": "The first super cyclonic storm in the Bay of Bengal since 1999 and the costliest cyclone on record in the North Indian Ocean.",
                "humanImpact": "128 deaths; 4.9 million displaced (the biggest displacement of 2020); about US$13–13.7 billion damage.",
                "climateLink": "Listed by Christian Aid as influenced by climate change.",
                "notes": null,
                "sources": [
                  {
                    "publisher": "Wikipedia – Cyclone Amphan",
                    "url": "https://en.wikipedia.org/wiki/Cyclone_Amphan",
                    "type": "Encyclopedia (Wikipedia, cites primary sources)"
                  },
                  {
                    "publisher": "Christian Aid – Counting the cost 2020",
                    "url": "https://mediacentre.christianaid.org.uk/?p=6539",
                    "type": "NGO / research organisation"
                  }
                ]
              }
            ],
            "state": {
              "favour": 2,
              "changingSea": {
                "told": ["CL-2020-058", "CL-2020-015"]
              }
            }
          }
        },
        {
          "say": "Sea level in 2021 matches exactly one event.",
          "request": {
            "method": "POST",
            "path": "/api/sessions/:id/turns",
            "body": {
              "type": "text",
              "text": "What happened with sea level in 2021?"
            }
          },
          "expect": {
            "status": 200,
            "reply": {
              "kind": "answer",
              "textIncludes": [
                "Glaciers lost 267 billion tonnes of ice a year (2000–2019), causing 21% of sea-level rise."
              ],
              "textExcludes": [
                "caused by climate change",
                "because of climate change",
                "climate change caused",
                "climate change made",
                "driven by climate change",
                "due to climate change",
                "climate change worsened"
              ]
            },
            "facts": [
              {
                "eventId": "CL-2021-020",
                "event": "Glaciers cause a fifth of sea-level rise",
                "year": 2021,
                "date": "28 Apr 2021",
                "category": "Sea level & coasts",
                "region": "Global",
                "location": "Global",
                "oceanLink": true,
                "whatHappened": "Glaciers lost 267 billion tonnes of ice a year (2000–2019), causing 21% of sea-level rise.",
                "humanImpact": null,
                "climateLink": null,
                "notes": null,
                "sources": [
                  {
                    "publisher": "Nature",
                    "url": "https://doi.org/10.1038/s41586-021-03436-z",
                    "type": "Scientific journal / study"
                  }
                ]
              }
            ],
            "progress": {
              "favourBand": "warm"
            },
            "state": {
              "favour": 3,
              "changingSea": {
                "told": ["CL-2020-058", "CL-2020-015", "CL-2021-020"]
              }
            }
          }
        },
        {
          "say": "Asked again: nothing new is left, so the guide says so and shows the fact again. No favour gain.",
          "request": {
            "method": "POST",
            "path": "/api/sessions/:id/turns",
            "body": {
              "type": "text",
              "text": "What happened with sea level in 2021?"
            }
          },
          "expect": {
            "status": 200,
            "reply": {
              "kind": "alreadyTold",
              "factKind": "history"
            },
            "facts": [
              {
                "eventId": "CL-2021-020",
                "event": "Glaciers cause a fifth of sea-level rise",
                "year": 2021,
                "date": "28 Apr 2021",
                "category": "Sea level & coasts",
                "region": "Global",
                "location": "Global",
                "oceanLink": true,
                "whatHappened": "Glaciers lost 267 billion tonnes of ice a year (2000–2019), causing 21% of sea-level rise.",
                "humanImpact": null,
                "climateLink": null,
                "notes": null,
                "sources": [
                  {
                    "publisher": "Nature",
                    "url": "https://doi.org/10.1038/s41586-021-03436-z",
                    "type": "Scientific journal / study"
                  }
                ]
              }
            ],
            "state": {
              "favour": 3,
              "changingSea": {
                "told": ["CL-2020-058", "CL-2020-015", "CL-2021-020"]
              }
            }
          }
        }
      ]
    }
  ]
}
```
