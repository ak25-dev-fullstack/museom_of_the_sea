# 14-count-and-list: How many? List them

**Covers:** List questions: the count, up to 8 names, 'and N more', hear.* choices, no favour change; hear gives +1 once; hear choices disappear.

## Storms in 2020 (13 matches), then floods in 2022 (exactly 8)

Setup: a fresh session (seed 42).

1. 'how many' is a count phrase; 'storms' + 2020 gives 13 events. The first 8 are named, then 'and 5 more'. No favour change, nothing told.  
   `POST /api/sessions/:id/turns` {"type": "text", "text": "How many storms were there in 2020?"} → **200** list
2. The visitor clicks one of the names: it is told like an answer, +1.  
   `POST /api/sessions/:id/turns` {"type": "choice", "choiceId": "hear.cl-2020-008"} → **200** answer
3. 'list the' is a count phrase; floods in 2022 gives exactly 8, so all are named and there is no 'and N more'.  
   `POST /api/sessions/:id/turns` {"type": "text", "text": "List the floods in 2022"} → **200** list
4. A hear choice from the earlier list is no longer on screen.  
   `POST /api/sessions/:id/turns` {"type": "choice", "choiceId": "hear.cl-2020-015"} → **409** CHOICE_NOT_AVAILABLE
5. Ask the storms question again: the count still includes told events.  
   `POST /api/sessions/:id/turns` {"type": "text", "text": "How many storms were there in 2020?"} → **200** list
6. Hearing an event that was already told: alreadyTold, no favour gain.  
   `POST /api/sessions/:id/turns` {"type": "choice", "choiceId": "hear.cl-2020-008"} → **200** alreadyTold

## Machine-readable

Phase 2's runner reads this block. Fact objects were copied from `research/events.csv` by script.

```json
{
  "id": "14-count-and-list",
  "title": "How many? List them",
  "covers": "List questions: the count, up to 8 names, 'and N more', hear.* choices, no favour change; hear gives +1 once; hear choices disappear.",
  "scenarios": [
    {
      "name": "Storms in 2020 (13 matches), then floods in 2022 (exactly 8)",
      "setup": {
        "seed": 42,
        "state": {}
      },
      "turns": [
        {
          "say": "'how many' is a count phrase; 'storms' + 2020 gives 13 events. The first 8 are named, then 'and 5 more'. No favour change, nothing told.",
          "request": {
            "method": "POST",
            "path": "/api/sessions/:id/turns",
            "body": {
              "type": "text",
              "text": "How many storms were there in 2020?"
            }
          },
          "expect": {
            "status": 200,
            "reply": {
              "kind": "list",
              "factKind": null,
              "textIncludes": [
                "in my records",
                "13",
                "Record-breaking 2020 Atlantic hurricane season",
                "Super Cyclone Amphan",
                "European windstorms incl. Storm Ciara",
                "Cyclone Gati hits Somalia",
                "Hurricane Iota",
                "Typhoon Vamco",
                "Hurricane Eta",
                "Super Typhoon Goni",
                "and 5 more"
              ]
            },
            "facts": [],
            "list": {
              "total": 13,
              "items": [
                {
                  "eventId": "CL-2020-058",
                  "event": "Record-breaking 2020 Atlantic hurricane season",
                  "year": 2020
                },
                {
                  "eventId": "CL-2020-015",
                  "event": "Super Cyclone Amphan",
                  "year": 2020
                },
                {
                  "eventId": "CL-2020-008",
                  "event": "European windstorms incl. Storm Ciara",
                  "year": 2020
                },
                {
                  "eventId": "CL-2020-041",
                  "event": "Cyclone Gati hits Somalia",
                  "year": 2020
                },
                {
                  "eventId": "CL-2020-040",
                  "event": "Hurricane Iota",
                  "year": 2020
                },
                {
                  "eventId": "CL-2020-039",
                  "event": "Typhoon Vamco",
                  "year": 2020
                },
                {
                  "eventId": "CL-2020-037",
                  "event": "Hurricane Eta",
                  "year": 2020
                },
                {
                  "eventId": "CL-2020-035",
                  "event": "Super Typhoon Goni",
                  "year": 2020
                }
              ]
            },
            "choices": [
              "hear.cl-2020-058",
              "hear.cl-2020-015",
              "hear.cl-2020-008",
              "hear.cl-2020-041",
              "hear.cl-2020-040",
              "hear.cl-2020-039",
              "hear.cl-2020-037",
              "hear.cl-2020-035",
              "exhibit.warming-waters",
              "exhibit.ice-poles",
              "exhibit.storms-floods",
              "exhibit.rising-seas",
              "exhibit.mortals",
              "leave"
            ],
            "state": {
              "favour": 0,
              "currentNodeId": "cs.intro",
              "changingSea": {
                "told": []
              }
            }
          }
        },
        {
          "say": "The visitor clicks one of the names: it is told like an answer, +1.",
          "request": {
            "method": "POST",
            "path": "/api/sessions/:id/turns",
            "body": {
              "type": "choice",
              "choiceId": "hear.cl-2020-008"
            }
          },
          "expect": {
            "status": 200,
            "reply": {
              "kind": "answer",
              "factKind": "history",
              "textIncludes": [
                "Storm Ciara struck the UK, Ireland and other European countries in February; more windstorms followed in October.",
                "Storm Ciara: US$2.7bn, 14 deaths. All 2020 European windstorms: US$5.9bn, 30 deaths.",
                "Listed by Christian Aid as influenced by climate change."
              ]
            },
            "facts": [
              {
                "eventId": "CL-2020-008",
                "event": "European windstorms incl. Storm Ciara",
                "year": 2020,
                "date": "Feb & Oct 2020",
                "category": "Storm, cold & winter weather",
                "region": "Europe",
                "location": "UK, Ireland and western Europe",
                "oceanLink": true,
                "whatHappened": "Storm Ciara struck the UK, Ireland and other European countries in February; more windstorms followed in October.",
                "humanImpact": "Storm Ciara: US$2.7bn, 14 deaths. All 2020 European windstorms: US$5.9bn, 30 deaths.",
                "climateLink": "Listed by Christian Aid as influenced by climate change.",
                "notes": null,
                "sources": [
                  {
                    "publisher": "Christian Aid – Counting the cost 2020",
                    "url": "https://mediacentre.christianaid.org.uk/?p=6539",
                    "type": "NGO / research organisation"
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
                "told": ["CL-2020-008"]
              }
            }
          }
        },
        {
          "say": "'list the' is a count phrase; floods in 2022 gives exactly 8, so all are named and there is no 'and N more'.",
          "request": {
            "method": "POST",
            "path": "/api/sessions/:id/turns",
            "body": {
              "type": "text",
              "text": "List the floods in 2022"
            }
          },
          "expect": {
            "status": 200,
            "reply": {
              "kind": "list",
              "factKind": null,
              "textIncludes": [
                "in my records",
                "8",
                "KwaZulu-Natal floods (Durban)",
                "Kinshasa floods",
                "Eastern Kentucky floods",
                "Pakistan floods",
                "Nigeria floods",
                "Sylhet floods",
                "Eastern Australia floods (Brisbane, Lismore)",
                "Petrópolis floods and landslides"
              ],
              "textNotMatching": "and \\d+ more"
            },
            "facts": [],
            "list": {
              "total": 8,
              "items": [
                {
                  "eventId": "CL-2022-019",
                  "event": "KwaZulu-Natal floods (Durban)",
                  "year": 2022
                },
                {
                  "eventId": "CL-2022-046",
                  "event": "Kinshasa floods",
                  "year": 2022
                },
                {
                  "eventId": "CL-2022-030",
                  "event": "Eastern Kentucky floods",
                  "year": 2022
                },
                {
                  "eventId": "CL-2022-025",
                  "event": "Pakistan floods",
                  "year": 2022
                },
                {
                  "eventId": "CL-2022-022",
                  "event": "Nigeria floods",
                  "year": 2022
                },
                {
                  "eventId": "CL-2022-021",
                  "event": "Sylhet floods",
                  "year": 2022
                },
                {
                  "eventId": "CL-2022-009",
                  "event": "Eastern Australia floods (Brisbane, Lismore)",
                  "year": 2022
                },
                {
                  "eventId": "CL-2022-007",
                  "event": "Petrópolis floods and landslides",
                  "year": 2022
                }
              ]
            },
            "choices": [
              "hear.cl-2022-019",
              "hear.cl-2022-046",
              "hear.cl-2022-030",
              "hear.cl-2022-025",
              "hear.cl-2022-022",
              "hear.cl-2022-021",
              "hear.cl-2022-009",
              "hear.cl-2022-007",
              "exhibit.warming-waters",
              "exhibit.ice-poles",
              "exhibit.storms-floods",
              "exhibit.rising-seas",
              "exhibit.mortals",
              "leave"
            ],
            "state": {
              "favour": 1
            }
          }
        },
        {
          "say": "A hear choice from the earlier list is no longer on screen.",
          "request": {
            "method": "POST",
            "path": "/api/sessions/:id/turns",
            "body": {
              "type": "choice",
              "choiceId": "hear.cl-2020-015"
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
          "say": "Ask the storms question again: the count still includes told events.",
          "request": {
            "method": "POST",
            "path": "/api/sessions/:id/turns",
            "body": {
              "type": "text",
              "text": "How many storms were there in 2020?"
            }
          },
          "expect": {
            "status": 200,
            "reply": {
              "kind": "list"
            },
            "list": {
              "total": 13,
              "items": [
                {
                  "eventId": "CL-2020-058",
                  "event": "Record-breaking 2020 Atlantic hurricane season",
                  "year": 2020
                },
                {
                  "eventId": "CL-2020-015",
                  "event": "Super Cyclone Amphan",
                  "year": 2020
                },
                {
                  "eventId": "CL-2020-008",
                  "event": "European windstorms incl. Storm Ciara",
                  "year": 2020
                },
                {
                  "eventId": "CL-2020-041",
                  "event": "Cyclone Gati hits Somalia",
                  "year": 2020
                },
                {
                  "eventId": "CL-2020-040",
                  "event": "Hurricane Iota",
                  "year": 2020
                },
                {
                  "eventId": "CL-2020-039",
                  "event": "Typhoon Vamco",
                  "year": 2020
                },
                {
                  "eventId": "CL-2020-037",
                  "event": "Hurricane Eta",
                  "year": 2020
                },
                {
                  "eventId": "CL-2020-035",
                  "event": "Super Typhoon Goni",
                  "year": 2020
                }
              ]
            },
            "state": {
              "favour": 1
            }
          }
        },
        {
          "say": "Hearing an event that was already told: alreadyTold, no favour gain.",
          "request": {
            "method": "POST",
            "path": "/api/sessions/:id/turns",
            "body": {
              "type": "choice",
              "choiceId": "hear.cl-2020-008"
            }
          },
          "expect": {
            "status": 200,
            "reply": {
              "kind": "alreadyTold"
            },
            "facts": [
              {
                "eventId": "CL-2020-008",
                "event": "European windstorms incl. Storm Ciara",
                "year": 2020,
                "date": "Feb & Oct 2020",
                "category": "Storm, cold & winter weather",
                "region": "Europe",
                "location": "UK, Ireland and western Europe",
                "oceanLink": true,
                "whatHappened": "Storm Ciara struck the UK, Ireland and other European countries in February; more windstorms followed in October.",
                "humanImpact": "Storm Ciara: US$2.7bn, 14 deaths. All 2020 European windstorms: US$5.9bn, 30 deaths.",
                "climateLink": "Listed by Christian Aid as influenced by climate change.",
                "notes": null,
                "sources": [
                  {
                    "publisher": "Christian Aid – Counting the cost 2020",
                    "url": "https://mediacentre.christianaid.org.uk/?p=6539",
                    "type": "NGO / research organisation"
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
            "state": {
              "favour": 1,
              "changingSea": {
                "told": ["CL-2020-008"]
              }
            }
          }
        }
      ]
    }
  ]
}
```
