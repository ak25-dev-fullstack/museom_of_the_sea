# 16-list-one-match: A list question with exactly one match

**Covers:** One match is still a list: one item, one hear choice, no 'and N more', no favour change.

## El Niño in 2023

Setup: a fresh session (seed 42).

1. 'how many' plus El Niño and 2023: exactly one event in the records (CL-2023-021). Still a list, not an answer, so no favour change.  
   `POST /api/sessions/:id/turns` {"type": "text", "text": "How many El Niño events were there in 2023?"} → **200** list
2. Hearing it tells it like an answer: +1.  
   `POST /api/sessions/:id/turns` {"type": "choice", "choiceId": "hear.cl-2023-021"} → **200** answer

## Machine-readable

Phase 2's runner reads this block. Fact objects were copied from `research/events.csv` by script.

```json
{
  "id": "16-list-one-match",
  "title": "A list question with exactly one match",
  "covers": "One match is still a list: one item, one hear choice, no 'and N more', no favour change.",
  "scenarios": [
    {
      "name": "El Niño in 2023",
      "setup": {
        "seed": 42,
        "state": {}
      },
      "turns": [
        {
          "say": "'how many' plus El Niño and 2023: exactly one event in the records (CL-2023-021). Still a list, not an answer, so no favour change.",
          "request": {
            "method": "POST",
            "path": "/api/sessions/:id/turns",
            "body": {
              "type": "text",
              "text": "How many El Niño events were there in 2023?"
            }
          },
          "expect": {
            "status": 200,
            "reply": {
              "kind": "list",
              "factKind": null,
              "textIncludes": ["in my records", "1", "El Niño returns (2023–24)"],
              "textNotMatching": "and \\d+ more"
            },
            "facts": [],
            "list": {
              "total": 1,
              "items": [
                {
                  "eventId": "CL-2023-021",
                  "event": "El Niño returns (2023–24)",
                  "year": 2023
                }
              ]
            },
            "choices": [
              "hear.cl-2023-021",
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
          "say": "Hearing it tells it like an answer: +1.",
          "request": {
            "method": "POST",
            "path": "/api/sessions/:id/turns",
            "body": {
              "type": "choice",
              "choiceId": "hear.cl-2023-021"
            }
          },
          "expect": {
            "status": 200,
            "reply": {
              "kind": "answer",
              "factKind": "history",
              "textIncludes": [
                "NOAA confirmed El Niño on 8 June 2023 and WMO declared it on 4 July. It peaked in December 2023 as one of the five strongest on record and ended in April 2024."
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
                "eventId": "CL-2023-021",
                "event": "El Niño returns (2023–24)",
                "year": 2023,
                "date": "8 Jun 2023 (NOAA); 4 Jul 2023 (WMO)",
                "category": "El Niño / La Niña",
                "region": "Pacific Ocean",
                "location": "Tropical Pacific",
                "oceanLink": true,
                "whatHappened": "NOAA confirmed El Niño on 8 June 2023 and WMO declared it on 4 July. It peaked in December 2023 as one of the five strongest on record and ended in April 2024.",
                "humanImpact": null,
                "climateLink": null,
                "notes": null,
                "sources": [
                  {
                    "publisher": "WMO",
                    "url": "https://wmo.int/news/media-centre/el-nino-weakens-impacts-continue",
                    "type": "UN / intergovernmental body"
                  },
                  {
                    "publisher": "Wikipedia – 2023–2024 El Niño event",
                    "url": "https://en.wikipedia.org/wiki/2023%E2%80%932024_El_Ni%C3%B1o_event",
                    "type": "Encyclopedia (Wikipedia, cites primary sources)"
                  }
                ]
              }
            ],
            "list": null,
            "choices": [
              "exhibit.warming-waters",
              "exhibit.ice-poles",
              "exhibit.storms-floods",
              "exhibit.rising-seas",
              "exhibit.mortals",
              "leave"
            ],
            "state": {
              "favour": 1,
              "changingSea": {
                "told": ["CL-2023-021"]
              }
            }
          }
        }
      ]
    }
  ]
}
```
