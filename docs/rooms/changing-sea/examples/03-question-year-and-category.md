# 03-question-year-and-category: Typed question with a year and a category

**Covers:** Climate question, synonym and year filters, scoring, +1 favour, staying at the same node.

## What hurricanes happened in 2020?

Setup: a fresh session (seed 42).

1. 'hurricanes' maps to Tropical cyclone, plus the year 2020: 10 candidates. CL-2020-058 and CL-2020-015 both have Ocean link Yes and a Climate link; the higher ID wins.  
   `POST /api/sessions/:id/turns` {"type": "text", "text": "What hurricanes happened in 2020?"} → **200** answer

## Machine-readable

Phase 2's runner reads this block. Fact objects were copied from `research/events.csv` by script.

```json
{
  "id": "03-question-year-and-category",
  "title": "Typed question with a year and a category",
  "covers": "Climate question, synonym and year filters, scoring, +1 favour, staying at the same node.",
  "scenarios": [
    {
      "name": "What hurricanes happened in 2020?",
      "setup": {
        "seed": 42,
        "state": {}
      },
      "turns": [
        {
          "say": "'hurricanes' maps to Tropical cyclone, plus the year 2020: 10 candidates. CL-2020-058 and CL-2020-015 both have Ocean link Yes and a Climate link; the higher ID wins.",
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
              "factKind": "history",
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
            "state": {
              "currentNodeId": "cs.intro",
              "favour": 1,
              "changingSea": {
                "told": ["CL-2020-058"]
              }
            }
          }
        }
      ]
    }
  ]
}
```
