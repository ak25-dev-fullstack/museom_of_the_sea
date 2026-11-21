"""Generates the example conversations in docs/rooms/changing-sea/examples/NN-*.md.

Every fact object, event name and list in the examples is copied from research/events.csv by this
script, never typed by hand, so the examples stay word for word (room CLAUDE.md). Expected picks
come from the reference matcher in matcher.py (spec §6).

Standard library only. From the repo root:
    python3 docs/rooms/changing-sea/examples/tools/generate_examples.py
    npm run format          # the generator's markdown isn't Prettier-formatted
    python3 docs/rooms/changing-sea/examples/tools/check_examples.py

To add or change an example, edit the data below and regenerate. Don't hand-edit the .md files:
the next run would overwrite the change.
"""
import csv, json, os

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))
OUT = os.path.join(ROOT, "examples")
rows = {r["ID"]: r for r in csv.DictReader(open(os.path.join(ROOT, "research/events.csv"), encoding="utf-8-sig"))}


def fact(i):
    x = rows[i]
    src = [{"publisher": x["Source 1 publisher"], "url": x["Source 1 URL"], "type": x["Source 1 type"]}]
    if x["Source 2 publisher"]:
        src.append({"publisher": x["Source 2 publisher"], "url": x["Source 2 URL"], "type": x["Source 2 type"]})
    return {
        "eventId": i, "event": x["Event"], "year": int(x["Year"]), "date": x["Date"],
        "category": x["Category"], "region": x["Region"], "location": x["Location"],
        "oceanLink": x["Ocean link"] == "Yes", "whatHappened": x["What happened"],
        "humanImpact": x["Human impact"] or None,
        "climateLink": x["Climate link (as stated by source)"] or None,
        "notes": x["Notes"] or None, "sources": src,
    }


CAUSE = ["caused by climate change", "because of climate change", "climate change caused",
         "climate change made", "driven by climate change", "due to climate change",
         "climate change worsened"]


def includes(i):
    """Text the reply must contain for event i (spec §11.1)."""
    f = fact(i)
    out = [f["whatHappened"]]
    if f["humanImpact"]:
        out.append(f["humanImpact"])
    if f["climateLink"]:
        out.append(f["climateLink"])
    if f["year"] == 2026:
        out.append("2026 figures may be revised.")
    return out


def excludes(i):
    """Cause phrases the guide must not add when Climate link is empty."""
    f = fact(i)
    if f["climateLink"]:
        return []
    return [p for p in CAUSE if p not in f["whatHappened"].lower()]


HUB = ["exhibit.warming-waters", "exhibit.ice-poles", "exhibit.storms-floods",
       "exhibit.rising-seas", "exhibit.mortals", "leave"]
EX = {
    "warming-waters": ("Warming waters", ["CL-2023-027", "CL-2025-001", "CL-2026-044"]),
    "ice-poles": ("Ice and the poles", ["CL-2020-009", "CL-2024-034", "CL-2026-047"]),
    "storms-floods": ("Storms and floods", ["CL-2020-058", "CL-2020-015", "CL-2024-029"]),
    "rising-seas": ("Rising seas", ["CL-2021-020", "CL-2026-034", "CL-2026-054"]),
    "mortals": ("What mortals have done", ["CL-2023-007", "CL-2023-040", "CL-2024-018"]),
}
Q = {
    "warming-waters": ["What record did global daily sea surface temperature hit in August 2023?",
                       "What share of the world's coral reef area hit bleaching-level heat stress?",
                       "Which day set the record for the hottest day measured in the world's seas?"],
    "ice-poles": ["What temperature was recorded on the Antarctic continent in February 2020?",
                  "What did Arctic sea ice have in December 2024?",
                  "How much ice did the Greenland and Antarctic ice sheets lose between 1979 and 2023?"],
}


def nodes(ex):
    return [f"cs.{ex}.{n}" for n in (1, 2, 3)]


def qopts(ex, n):
    return [f"q.{ex}.{n}.a", f"q.{ex}.{n}.b", f"q.{ex}.{n}.c", "quiz.stop", "leave"]


def progress(seen=None, tokens=(), band="neutral"):
    seen = seen or {}
    return {
        "exhibits": [{"id": k, "title": v[0], "entriesSeen": seen.get(k, 0), "token": k in tokens}
                     for k, v in EX.items()],
        "tokens": len(tokens), "favourBand": band,
    }


T = "/api/sessions/:id/turns"


def text(t):
    return {"method": "POST", "path": T, "body": {"type": "text", "text": t}}


def choice(c):
    return {"method": "POST", "path": T, "body": {"type": "choice", "choiceId": c}}


def err(status, code):
    return {"status": status, "error": {"code": code}, "stateUnchanged": True}


FRESH = {"seed": 42, "state": {}}
NOMATCH_INC = ["2020", "2026"] + [v[0] for v in EX.values()]
NOMATCH_EXC = ["i don't know", "i do not know", "don't know", "not sure"]

import sys as _sys
_sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import matcher as _m2  # noqa: E402  (spec §6 reference matcher, used to compute lists)


def listed(q, exhibit=None):
    """Run the spec's list rule (§6.5) over events.csv: returns (total, first 8 items)."""
    found, rest = _m2.strip_count(q)
    assert found, q
    _, c = _m2.cands(rest, exhibit)
    items = [{"eventId": r["ID"], "event": r["Event"], "year": int(r["Year"])} for r in c[:8]]
    return len(c), items


def list_expect(q, exhibit=None, after=HUB):
    total, items = listed(q, exhibit)
    inc = ["in my records", str(total)] + [i["event"] for i in items]
    e = {"status": 200, "reply": {"kind": "list", "factKind": None, "textIncludes": inc},
         "facts": [], "list": {"total": total, "items": items},
         "choices": ["hear." + i["eventId"].lower() for i in items] + after}
    if total > 8:
        inc.append(f"and {total - 8} more")
    else:
        e["reply"]["textNotMatching"] = r"and \d+ more"
    return e

examples = []

# 01 -------------------------------------------------------------------------
examples.append(dict(
    id="01-start-visit", title="Start a visit",
    covers="Session start, the intro/hub view, resuming with GET.",
    scenarios=[dict(
        name="A new visit starts at the intro with five exhibits and leave",
        setup={"seed": 42, "start": False},
        turns=[
            dict(say="The visitor walks in. The guide greets them and shows the five exhibits.",
                 request={"method": "POST", "path": "/api/sessions", "body": {"room": "changing-sea", "seed": 42}},
                 expect={"status": 201, "statusField": "active", "turn": 0,
                         "reply": {"kind": "intro", "speaker": "poseidon", "factKind": "myth"},
                         "facts": [], "choices": HUB, "suggestionsNonEmpty": True,
                         "input": {"mode": "both", "maxLength": 300}, "quiz": None,
                         "progress": progress(), "effects": [], "ending": None,
                         "state": {"currentNodeId": "cs.intro", "favour": 0, "flags": {"flooded": False},
                                   "knowledge": [], "visited": ["cs.intro"],
                                   "changingSea": {"status": "active", "told": [], "review": [], "quiz": None, "endingId": None}}}),
            dict(say="The client reloads. GET returns the same view again without changing anything.",
                 request={"method": "GET", "path": "/api/sessions/:id"},
                 expect={"status": 200, "sameAsPreviousResponse": True, "stateUnchanged": True}),
        ])]))

# 02 -------------------------------------------------------------------------
ww = EX["warming-waters"][1]
examples.append(dict(
    id="02-exhibit-walkthrough", title="Walk through an exhibit",
    covers="Exhibit choices, event-backed nodes, the cause rule both ways, the 2026 caveat, quiz.start appearing, 409 for a choice not on screen.",
    scenarios=[dict(
        name="Warming waters, entries 1 to 3",
        setup=FRESH,
        turns=[
            dict(say="Visitor picks Warming waters. Entry 1 has no Climate link, so the guide must not claim a cause.",
                 request=choice("exhibit.warming-waters"),
                 expect={"status": 200, "reply": {"kind": "exhibit", "factKind": "history",
                                                  "textIncludes": includes(ww[0]), "textExcludes": excludes(ww[0])},
                         "facts": [fact(ww[0])], "choices": ["next", "hub", "leave"], "effects": [],
                         "progress": progress({"warming-waters": 1}),
                         "state": {"currentNodeId": "cs.warming-waters.1", "favour": 0,
                                   "visited": ["cs.intro", "cs.warming-waters.1"],
                                   "changingSea": {"told": [ww[0]]}}}),
            dict(say="Next. Entry 2 has a Climate link, so its text is quoted word for word.",
                 request=choice("next"),
                 expect={"status": 200, "reply": {"kind": "exhibit", "factKind": "history",
                                                  "textIncludes": includes(ww[1])},
                         "facts": [fact(ww[1])], "choices": ["next", "hub", "leave"],
                         "progress": progress({"warming-waters": 2}),
                         "state": {"currentNodeId": "cs.warming-waters.2", "favour": 0,
                                   "changingSea": {"told": ww[:2]}}}),
            dict(say="Next. Entry 3 is a 2026 event, so the caveat is included. All three are seen, so the quiz is offered.",
                 request=choice("next"),
                 expect={"status": 200, "reply": {"kind": "exhibit", "factKind": "history",
                                                  "textIncludes": includes(ww[2]), "textExcludes": excludes(ww[2])},
                         "facts": [fact(ww[2])], "choices": ["quiz.start", "hub", "leave"],
                         "progress": progress({"warming-waters": 3}),
                         "state": {"currentNodeId": "cs.warming-waters.3", "favour": 0,
                                   "visited": ["cs.intro"] + nodes("warming-waters"),
                                   "changingSea": {"told": ww}}}),
            dict(say="The client sends 'next', which is not on screen at entry 3.",
                 request=choice("next"), expect=err(409, "CHOICE_NOT_AVAILABLE")),
        ])]))

# 03 -------------------------------------------------------------------------
examples.append(dict(
    id="03-question-year-and-category", title="Typed question with a year and a category",
    covers="Climate question, synonym and year filters, scoring, +1 favour, staying at the same node.",
    scenarios=[dict(
        name="What hurricanes happened in 2020?",
        setup=FRESH,
        turns=[dict(
            say="'hurricanes' maps to Tropical cyclone, plus the year 2020: 10 candidates. CL-2020-058 and CL-2020-015 both have Ocean link Yes and a Climate link; the higher ID wins.",
            request=text("What hurricanes happened in 2020?"),
            expect={"status": 200, "reply": {"kind": "answer", "factKind": "history",
                                             "textIncludes": includes("CL-2020-058")},
                    "facts": [fact("CL-2020-058")], "choices": HUB, "effects": [],
                    "progress": progress(band="neutral"),
                    "state": {"currentNodeId": "cs.intro", "favour": 1, "changingSea": {"told": ["CL-2020-058"]}}})])]))

# 04 -------------------------------------------------------------------------
examples.append(dict(
    id="04-what-are-humans-doing", title="What are humans doing about it?",
    covers="The 'humans doing' phrase mapping to Policy, Energy and Courts; the 2026 caveat; no cause claim.",
    scenarios=[dict(
        name="What are humans doing about the sea?",
        setup=FRESH,
        turns=[dict(
            say="'humans doing' maps to three categories (62 candidates). 'sea' is a topic word only. The top pick is CL-2026-059 (Ocean link Yes, 2026, highest ID). It is a 2026 event, so the caveat is included.",
            request=text("What are humans doing about the sea?"),
            expect={"status": 200, "reply": {"kind": "answer", "factKind": "history",
                                             "textIncludes": includes("CL-2026-059"),
                                             "textExcludes": excludes("CL-2026-059")},
                    "facts": [fact("CL-2026-059")], "choices": HUB,
                    "state": {"favour": 1, "changingSea": {"told": ["CL-2026-059"]}}})])]))

# 05 -------------------------------------------------------------------------
examples.append(dict(
    id="05-repeated-questions", title="Asking the same question again",
    covers="Skipping told events, +1 only for new events, alreadyTold when nothing is left.",
    scenarios=[dict(
        name="Repeat a question with more answers, then one with a single answer",
        setup={"seed": 42, "state": {"favour": 1, "turn": 1, "changingSea": {"told": ["CL-2020-058"]}}},
        turns=[
            dict(say="Same hurricane question again: CL-2020-058 is told, so the next one, CL-2020-015, comes back.",
                 request=text("What hurricanes happened in 2020?"),
                 expect={"status": 200, "reply": {"kind": "answer", "textIncludes": includes("CL-2020-015")},
                         "facts": [fact("CL-2020-015")],
                         "state": {"favour": 2, "changingSea": {"told": ["CL-2020-058", "CL-2020-015"]}}}),
            dict(say="Sea level in 2021 matches exactly one event.",
                 request=text("What happened with sea level in 2021?"),
                 expect={"status": 200, "reply": {"kind": "answer", "textIncludes": includes("CL-2021-020"),
                                                  "textExcludes": excludes("CL-2021-020")},
                         "facts": [fact("CL-2021-020")], "progress": {"favourBand": "warm"},
                         "state": {"favour": 3, "changingSea": {"told": ["CL-2020-058", "CL-2020-015", "CL-2021-020"]}}}),
            dict(say="Asked again: nothing new is left, so the guide says so and shows the fact again. No favour gain.",
                 request=text("What happened with sea level in 2021?"),
                 expect={"status": 200, "reply": {"kind": "alreadyTold", "factKind": "history"},
                         "facts": [fact("CL-2021-020")],
                         "state": {"favour": 3, "changingSea": {"told": ["CL-2020-058", "CL-2020-015", "CL-2021-020"]}}}),
        ])]))

# 06 -------------------------------------------------------------------------
examples.append(dict(
    id="06-no-match", title="A question the data can't answer",
    covers="noMatch for a year outside 2020–2026 and for an empty filter result; no favour change.",
    scenarios=[dict(
        name="Out-of-range year, then an in-range question with no events",
        setup=FRESH,
        turns=[
            dict(say="2019 is outside the guide's years. An honest question, so no penalty. The guide stays in character: it says what its records cover (2020 to 2026 and the five themes) and never says it doesn't know.",
                 request=text("Tell me about volcanoes in 2019"),
                 expect={"status": 200, "reply": {"kind": "noMatch", "factKind": None, "label": None,
                                                  "textIncludes": NOMATCH_INC, "textExcludes": NOMATCH_EXC},
                         "facts": [], "list": None, "suggestionsCount": 3, "choices": HUB,
                         "state": {"favour": 0, "changingSea": {"told": []}}}),
            dict(say="El Niño plus 2020 is a valid filter, but no event matches both. Same in-character reply.",
                 request=text("Any El Niño news in 2020?"),
                 expect={"status": 200, "reply": {"kind": "noMatch", "factKind": None,
                                                  "textIncludes": NOMATCH_INC, "textExcludes": NOMATCH_EXC},
                         "facts": [], "suggestionsCount": 3,
                         "state": {"favour": 0, "changingSea": {"told": []}}}),
            dict(say="A list question with no matches gets the same noMatch reply.",
                 request=text("How many El Niño events were there in 2020?"),
                 expect={"status": 200, "reply": {"kind": "noMatch", "textIncludes": NOMATCH_INC,
                                                  "textExcludes": NOMATCH_EXC},
                         "list": None, "suggestionsCount": 3, "state": {"favour": 0}}),
        ])]))

# 07 -------------------------------------------------------------------------
examples.append(dict(
    id="07-off-topic", title="Off-topic input",
    covers="Off-topic −1, suggestions, and off-topic input starting the flood at −5.",
    scenarios=[
        dict(name="Off-topic from a fresh visit", setup=FRESH,
             turns=[dict(say="No year, category, topic or known word: off-topic.",
                         request=text("What's for lunch?"),
                         expect={"status": 200, "reply": {"kind": "offTopic", "factKind": None}, "facts": [],
                                 "suggestionsNonEmpty": True, "choices": HUB,
                                 "progress": {"favourBand": "neutral"}, "state": {"favour": -1}})]),
        dict(name="Off-topic at −4 starts the flood", setup={"seed": 42, "state": {"favour": -4}},
             turns=[dict(say="−4 − 1 = −5, which is the flood limit.",
                         request=text("What's for lunch?"),
                         expect={"status": 200, "statusField": "flooded",
                                 "reply": {"kind": "flood", "factKind": None},
                                 "choices": ["apologise"], "effects": ["flood"],
                                 "progress": {"favourBand": "stormy"},
                                 "state": {"favour": -5, "flags": {"flooded": True}}})]),
    ]))

# 08 -------------------------------------------------------------------------
examples.append(dict(
    id="08-rude-to-flood", title="Rudeness brings the flood",
    covers="Rude −3, the cold band, and the flood starting on the second rude message.",
    scenarios=[dict(
        name="Two rude messages",
        setup=FRESH,
        turns=[
            dict(say="First rude message: −3. Choices stay the same.",
                 request=text("You are useless"),
                 expect={"status": 200, "statusField": "active", "reply": {"kind": "rude", "factKind": None},
                         "facts": [], "choices": HUB, "effects": [],
                         "progress": {"favourBand": "cold"}, "state": {"favour": -3, "flags": {"flooded": False}}}),
            dict(say="Second: −6, at or below −5, so the flood starts. Only an apology is offered.",
                 request=text("Shut up, you idiot"),
                 expect={"status": 200, "statusField": "flooded", "reply": {"kind": "flood", "factKind": None},
                         "facts": [], "choices": ["apologise"], "effects": ["flood"],
                         "input": {"mode": "both", "maxLength": 300},
                         "progress": {"favourBand": "stormy"},
                         "state": {"favour": -6, "flags": {"flooded": True}}}),
        ])]))

# 09 -------------------------------------------------------------------------
examples.append(dict(
    id="09-flood-and-repentance", title="The flood, repentance, and flooding again",
    covers="Input while flooded, 409 for leave while flooded, repent to −2, an immediate re-flood, repent by choice.",
    scenarios=[dict(
        name="Flooded at −6, at the hub",
        setup={"seed": 42, "state": {"favour": -6, "flags": {"flooded": True}, "currentNodeId": "cs.hub",
                                     "visited": ["cs.intro", "cs.hub"], "turn": 3}},
        turns=[
            dict(say="A climate question while flooded gets only the flood reply. Nothing is told.",
                 request=text("Tell me about coral"),
                 expect={"status": 200, "statusField": "flooded", "reply": {"kind": "flood"}, "facts": [],
                         "choices": ["apologise"], "effects": [],
                         "state": {"favour": -6, "changingSea": {"told": []}}}),
            dict(say="The visitor tries to leave. Leave is not offered during the flood.",
                 request=choice("leave"), expect=err(409, "CHOICE_NOT_AVAILABLE")),
            dict(say="Rude while flooded: still just the flood reply, no further drop.",
                 request=text("You idiot"),
                 expect={"status": 200, "statusField": "flooded", "reply": {"kind": "flood"},
                         "effects": [], "state": {"favour": -6}}),
            dict(say="A typed apology. The flood ends, favour is set to −2, back to the hub's choices.",
                 request=text("I'm sorry"),
                 expect={"status": 200, "statusField": "active", "reply": {"kind": "repent"},
                         "choices": HUB, "effects": ["calm"], "progress": {"favourBand": "cold"},
                         "state": {"favour": -2, "flags": {"flooded": False}, "currentNodeId": "cs.hub"}}),
            dict(say="On purpose: one rude message straight after repenting. −2 − 3 = −5, so it floods again.",
                 request=text("You are useless"),
                 expect={"status": 200, "statusField": "flooded", "reply": {"kind": "flood"},
                         "choices": ["apologise"], "effects": ["flood"],
                         "state": {"favour": -5, "flags": {"flooded": True}}}),
            dict(say="This time the visitor clicks Apologise. Same result as typing it.",
                 request=choice("apologise"),
                 expect={"status": 200, "statusField": "active", "reply": {"kind": "repent"},
                         "choices": HUB, "effects": ["calm"],
                         "state": {"favour": -2, "flags": {"flooded": False}}}),
        ])]))

# 10 -------------------------------------------------------------------------
wwtold = EX["warming-waters"][1]
iptold = EX["ice-poles"][1]
examples.append(dict(
    id="10-quiz", title="The quiz, a flood mid-quiz, passing and failing",
    covers="quiz.start, right and wrong answers, the quiz pausing in a flood and resuming, a token, a fail, review and retry.",
    scenarios=[
        dict(name="Warming waters: flood in the middle, then a pass",
             setup={"seed": 42, "state": {"favour": -4, "currentNodeId": "cs.warming-waters.3", "turn": 4,
                                          "visited": ["cs.intro"] + nodes("warming-waters"),
                                          "changingSea": {"told": wwtold}}},
             turns=[
                 dict(say="Start the test. Question 1 of 3.",
                      request=choice("quiz.start"),
                      expect={"status": 200, "reply": {"kind": "quiz", "textIncludes": [Q["warming-waters"][0]]},
                              "choices": qopts("warming-waters", 1),
                              "quiz": {"exhibitId": "warming-waters", "questionNumber": 1, "of": 3, "paused": False},
                              "state": {"favour": -4, "changingSea": {"quiz": {"exhibitId": "warming-waters", "questionIndex": 0, "answers": []}}}}),
                 dict(say="Correct (b, 21.02 °C): +1, on to question 2.",
                      request=choice("q.warming-waters.1.b"),
                      expect={"status": 200, "reply": {"kind": "quiz", "textIncludes": [Q["warming-waters"][1]]},
                              "facts": [], "choices": qopts("warming-waters", 2),
                              "quiz": {"exhibitId": "warming-waters", "questionNumber": 2, "of": 3, "paused": False},
                              "state": {"favour": -3, "changingSea": {"quiz": {"exhibitId": "warming-waters", "questionIndex": 1, "answers": [True]}}}}),
                 dict(say="Rude mid-quiz: −3 − 3 = −6, so the flood starts and the quiz pauses with its state kept.",
                      request=text("Shut up, you idiot"),
                      expect={"status": 200, "statusField": "flooded", "reply": {"kind": "flood"},
                              "choices": ["apologise"], "effects": ["flood"],
                              "quiz": {"exhibitId": "warming-waters", "questionNumber": 2, "of": 3, "paused": True},
                              "state": {"favour": -6, "flags": {"flooded": True},
                                        "changingSea": {"quiz": {"exhibitId": "warming-waters", "questionIndex": 1, "answers": [True]}}}}),
                 dict(say="Repent: −2, and the same question 2 comes back with the earlier answer kept.",
                      request=text("sorry"),
                      expect={"status": 200, "statusField": "active",
                              "reply": {"kind": "repent", "textIncludes": [Q["warming-waters"][1]]},
                              "choices": qopts("warming-waters", 2), "effects": ["calm"],
                              "quiz": {"exhibitId": "warming-waters", "questionNumber": 2, "of": 3, "paused": False},
                              "state": {"favour": -2, "flags": {"flooded": False},
                                        "changingSea": {"quiz": {"exhibitId": "warming-waters", "questionIndex": 1, "answers": [True]}}}}),
                 dict(say="Wrong (b is 68.2%, the old record; the answer is a, 83.7%). The fact and source are shown. No favour change.",
                      request=choice("q.warming-waters.2.b"),
                      expect={"status": 200, "reply": {"kind": "quiz", "textIncludes": [Q["warming-waters"][2]]},
                              "facts": [fact("CL-2025-001")], "choices": qopts("warming-waters", 3),
                              "quiz": {"exhibitId": "warming-waters", "questionNumber": 3, "of": 3, "paused": False},
                              "state": {"favour": -2, "changingSea": {"quiz": {"exhibitId": "warming-waters", "questionIndex": 2, "answers": [True, False]}}}}),
                 dict(say="Correct (c, 22 August 2026): 2 of 3, a pass. Token earned, back to the hub.",
                      request=choice("q.warming-waters.3.c"),
                      expect={"status": 200, "reply": {"kind": "quizResult"}, "choices": HUB,
                              "effects": ["token"], "quiz": None,
                              "progress": progress({"warming-waters": 3}, tokens=("warming-waters",), band="neutral"),
                              "state": {"favour": -1, "currentNodeId": "cs.hub", "knowledge": ["token:warming-waters"],
                                        "changingSea": {"quiz": None, "review": []}}}),
             ]),
        dict(name="Ice and the poles: a fail, then re-reading unlocks a retry",
             setup={"seed": 42, "state": {"favour": 0, "currentNodeId": "cs.ice-poles.3", "turn": 3,
                                          "visited": ["cs.intro"] + nodes("ice-poles"),
                                          "changingSea": {"told": iptold}}},
             turns=[
                 dict(say="Start the test.", request=choice("quiz.start"),
                      expect={"status": 200, "reply": {"kind": "quiz", "textIncludes": [Q["ice-poles"][0]]},
                              "choices": qopts("ice-poles", 1)}),
                 dict(say="Wrong (b, 17.5 °C was the old record). The fact is shown.",
                      request=choice("q.ice-poles.1.b"),
                      expect={"status": 200, "reply": {"kind": "quiz"}, "facts": [fact("CL-2020-009")],
                              "state": {"favour": 0}}),
                 dict(say="Wrong (a). The fact is shown.",
                      request=choice("q.ice-poles.2.a"),
                      expect={"status": 200, "reply": {"kind": "quiz"}, "facts": [fact("CL-2024-034")],
                              "state": {"favour": 0}}),
                 dict(say="Correct (b): +1, but only 1 of 3. Fail: no token, the exhibit needs a re-read.",
                      request=choice("q.ice-poles.3.b"),
                      expect={"status": 200, "reply": {"kind": "quizResult"}, "choices": HUB,
                              "effects": [], "quiz": None,
                              "state": {"favour": 1, "currentNodeId": "cs.hub", "knowledge": [],
                                        "changingSea": {"quiz": None, "review": ["ice-poles"]}}}),
                 dict(say="Opening the exhibit again clears the review, so quiz.start is offered again.",
                      request=choice("exhibit.ice-poles"),
                      expect={"status": 200, "reply": {"kind": "exhibit"}, "facts": [fact("CL-2020-009")],
                              "choices": ["quiz.start", "next", "hub", "leave"],
                              "state": {"currentNodeId": "cs.ice-poles.1", "changingSea": {"review": []}}}),
             ]),
    ]))

# 11 -------------------------------------------------------------------------
all15 = [e for v in EX.values() for e in v[1]]
allnodes = ["cs.intro"] + [n for k in EX for n in nodes(k)] + ["cs.hub"]
examples.append(dict(
    id="11-leave-and-endings", title="Leaving the room: the three endings",
    covers="Ending by tokens, the learned-facts list, 409 VISIT_ENDED, GET after the end.",
    scenarios=[
        dict(name="2 tokens: Student of the Sea",
             setup={"seed": 42, "state": {"favour": 4, "currentNodeId": "cs.hub", "turn": 14,
                                          "knowledge": ["token:warming-waters", "token:ice-poles"],
                                          "visited": ["cs.intro"] + nodes("warming-waters") + ["cs.hub"] + nodes("ice-poles"),
                                          "changingSea": {"told": wwtold + iptold}}},
             turns=[
                 dict(say="Leave. 2 tokens gives Student of the Sea. Favour 4 (warm) only picks the farewell wording.",
                      request=choice("leave"),
                      expect={"status": 200, "statusField": "ended", "reply": {"kind": "ending"},
                              "factIds": wwtold + iptold, "choices": [], "input": {"mode": "none", "maxLength": 300},
                              "ending": {"id": "student-of-the-sea", "title": "Student of the Sea",
                                         "tokens": ["warming-waters", "ice-poles"]},
                              "state": {"changingSea": {"status": "ended", "endingId": "student-of-the-sea"}}}),
                 dict(say="Any turn after the end is refused.",
                      request=text("hello"), expect=err(409, "VISIT_ENDED")),
                 dict(say="GET still shows the ending.",
                      request={"method": "GET", "path": "/api/sessions/:id"},
                      expect={"status": 200, "statusField": "ended", "reply": {"kind": "ending"},
                              "sameAsResponseOfTurn": 1, "stateUnchanged": True}),
             ]),
        dict(name="0 tokens straight away: Landlubber", setup=FRESH,
             turns=[dict(say="Leaving at once.", request=choice("leave"),
                         expect={"status": 200, "statusField": "ended", "reply": {"kind": "ending"},
                                 "facts": [], "choices": [],
                                 "ending": {"id": "landlubber", "title": "Landlubber", "tokens": []},
                                 "state": {"changingSea": {"status": "ended", "endingId": "landlubber"}}})]),
        dict(name="5 tokens: Keeper of the Tides",
             setup={"seed": 42, "state": {"favour": 0, "currentNodeId": "cs.hub", "turn": 40,
                                          "knowledge": [f"token:{k}" for k in EX],
                                          "visited": allnodes, "changingSea": {"told": all15}}},
             turns=[dict(say="All five tokens.", request=choice("leave"),
                         expect={"status": 200, "statusField": "ended", "reply": {"kind": "ending"},
                                 "factIds": all15,
                                 "ending": {"id": "keeper-of-the-tides", "title": "Keeper of the Tides",
                                            "tokens": list(EX)},
                                 "state": {"changingSea": {"endingId": "keeper-of-the-tides"}}})]),
    ]))

# 12 -------------------------------------------------------------------------
U = "00000000-0000-4000-8000-000000000000"
examples.append(dict(
    id="12-validation-edge-cases", title="Bad input and edge cases",
    covers="400/404/409/413 errors with no state change, the 300-character limit, the clarify reply.",
    scenarios=[dict(
        name="One fresh visit, many bad requests",
        setup=FRESH,
        turns=[
            dict(say="Whitespace only (Zod trims it, min 1).", request=text("   "), expect=err(400, "VALIDATION_ERROR")),
            dict(say="301 characters.", request={"method": "POST", "path": T, "body": {"type": "text", "text": {"$repeat": "a", "times": 301}}},
                 expect=err(400, "VALIDATION_ERROR")),
            dict(say="Body over 10kb (11,000 characters).", request={"method": "POST", "path": T, "body": {"type": "text", "text": {"$repeat": "a", "times": 11000}}},
                 expect=err(413, "PAYLOAD_TOO_LARGE")),
            dict(say="Malformed JSON.", request={"method": "POST", "path": T, "rawBody": "{not json", "contentType": "application/json"},
                 expect=err(400, "INVALID_JSON")),
            dict(say="Missing type.", request={"method": "POST", "path": T, "body": {"text": "hi"}}, expect=err(400, "VALIDATION_ERROR")),
            dict(say="Extra field (.strict()).", request={"method": "POST", "path": T, "body": {"type": "text", "text": "hi", "extra": 1}},
                 expect=err(400, "VALIDATION_ERROR")),
            dict(say="choiceId with capitals and a space.", request=choice("Exhibit Warming"), expect=err(400, "VALIDATION_ERROR")),
            dict(say="Well-formed choiceId that isn't on screen.", request=choice("exhibit.atlantis"), expect=err(409, "CHOICE_NOT_AVAILABLE")),
            dict(say="Session id that isn't a UUID.", request={"method": "POST", "path": "/api/sessions/not-a-uuid/turns", "body": {"type": "text", "text": "hi"}},
                 expect=err(400, "VALIDATION_ERROR")),
            dict(say="Well-formed but unknown session id.", request={"method": "POST", "path": f"/api/sessions/{U}/turns", "body": {"type": "text", "text": "hi"}},
                 expect=err(404, "SESSION_NOT_FOUND")),
            dict(say="Unknown session and bad body: validation runs first, so 400, not 404.",
                 request={"method": "POST", "path": f"/api/sessions/{U}/turns", "body": {"type": "text", "text": ""}},
                 expect=err(400, "VALIDATION_ERROR")),
            dict(say="Only punctuation: valid, but empty after normalising, so clarify. No change except turn.",
                 request=text("???"),
                 expect={"status": 200, "reply": {"kind": "clarify", "factKind": None}, "facts": [], "choices": HUB,
                         "turn": 1, "state": {"favour": 0}}),
            dict(say="Exactly 300 characters is allowed. It matches nothing, so it is off-topic (−1).",
                 request={"method": "POST", "path": T, "body": {"type": "text", "text": {"$repeat": "a", "times": 300}}},
                 expect={"status": 200, "reply": {"kind": "offTopic"}, "turn": 2, "state": {"favour": -1}}),
        ])]))

# 13 -------------------------------------------------------------------------
examples.append(dict(
    id="13-meta-and-no-need", title="Greetings, help and unneeded apologies",
    covers="The meta kind, climate question winning over a meta phrase, noNeed at zero and at negative favour.",
    scenarios=[
        dict(name="Fresh visit", setup=FRESH,
             turns=[
                 dict(say="A greeting: meta reply with suggestions, no favour change.",
                      request=text("hello"),
                      expect={"status": 200, "reply": {"kind": "meta", "factKind": None}, "facts": [],
                              "suggestionsNonEmpty": True, "choices": HUB, "state": {"favour": 0}}),
                 dict(say="Apologising when not flooded: noNeed, no change.",
                      request=text("sorry"),
                      expect={"status": 200, "reply": {"kind": "noNeed", "factKind": None}, "facts": [],
                              "choices": HUB, "effects": [], "state": {"favour": 0, "flags": {"flooded": False}}}),
                 dict(say="'Who are you?' is meta too.",
                      request=text("Who are you?"),
                      expect={"status": 200, "reply": {"kind": "meta"}, "state": {"favour": 0}}),
                 dict(say="Contains the meta phrase 'what can you tell me', but 'storms' makes it a climate question, which is checked first. Storms map to two categories; CL-2020-058 is the top pick.",
                      request=text("What can you tell me about storms?"),
                      expect={"status": 200, "reply": {"kind": "answer", "textIncludes": includes("CL-2020-058")},
                              "facts": [fact("CL-2020-058")],
                              "state": {"favour": 1, "changingSea": {"told": ["CL-2020-058"]}}}),
             ]),
        dict(name="Apology at negative favour (not flooded)", setup={"seed": 42, "state": {"favour": -3}},
             turns=[dict(say="Favour −3 but not flooded: still noNeed, favour stays −3.",
                         request=text("I apologise"),
                         expect={"status": 200, "reply": {"kind": "noNeed"}, "effects": [],
                                 "progress": {"favourBand": "cold"},
                                 "state": {"favour": -3, "flags": {"flooded": False}}})]),
    ]))


# 14 -------------------------------------------------------------------------
L1 = "How many storms were there in 2020?"
L2 = "List the floods in 2022"
e1 = list_expect(L1); e1["state"] = {"favour": 0, "currentNodeId": "cs.intro", "changingSea": {"told": []}}
e3 = list_expect(L2); e3["state"] = {"favour": 1}
examples.append(dict(
    id="14-count-and-list", title="How many? List them",
    covers="List questions: the count, up to 8 names, 'and N more', hear.* choices, no favour change; hear gives +1 once; hear choices disappear.",
    scenarios=[dict(
        name="Storms in 2020 (13 matches), then floods in 2022 (exactly 8)",
        setup=FRESH,
        turns=[
            dict(say="'how many' is a count phrase; 'storms' + 2020 gives 13 events. The first 8 are named, then 'and 5 more'. No favour change, nothing told.",
                 request=text(L1), expect=e1),
            dict(say="The visitor clicks one of the names: it is told like an answer, +1.",
                 request=choice("hear.cl-2020-008"),
                 expect={"status": 200, "reply": {"kind": "answer", "factKind": "history",
                                                  "textIncludes": includes("CL-2020-008")},
                         "facts": [fact("CL-2020-008")], "list": None, "choices": HUB,
                         "state": {"favour": 1, "changingSea": {"told": ["CL-2020-008"]}}}),
            dict(say="'list the' is a count phrase; floods in 2022 gives exactly 8, so all are named and there is no 'and N more'.",
                 request=text(L2), expect=e3),
            dict(say="A hear choice from the earlier list is no longer on screen.",
                 request=choice("hear.cl-2020-015"), expect=err(409, "CHOICE_NOT_AVAILABLE")),
            dict(say="Ask the storms question again: the count still includes told events.",
                 request=text(L1), expect={"status": 200, "reply": {"kind": "list"},
                                           "list": {"total": listed(L1)[0], "items": listed(L1)[1]},
                                           "state": {"favour": 1}}),
            dict(say="Hearing an event that was already told: alreadyTold, no favour gain.",
                 request=choice("hear.cl-2020-008"),
                 expect={"status": 200, "reply": {"kind": "alreadyTold"}, "facts": [fact("CL-2020-008")],
                         "choices": HUB, "state": {"favour": 1, "changingSea": {"told": ["CL-2020-008"]}}}),
        ])]))

# 15 -------------------------------------------------------------------------
Q15 = "What happened in 2020?"
inside = ["quiz.start", "next", "hub", "leave"][1:]  # entry 1, quiz not eligible
ctx_list = list_expect("list what happened in 2020", "ice-poles", after=inside)
ctx_list["state"] = {"favour": 1, "currentNodeId": "cs.ice-poles.1"}
examples.append(dict(
    id="15-exhibit-context", title="The same question at the hub and inside an exhibit",
    covers="Exhibit context as the first sort key, for answers and lists; it never overrides an exact name.",
    scenarios=[
        dict(name="At the hub: no exhibit context", setup=FRESH,
             turns=[dict(say="Year only: 59 candidates. CL-2020-058 wins on Ocean link, Climate link, then ID.",
                         request=text(Q15),
                         expect={"status": 200, "reply": {"kind": "answer", "textIncludes": includes("CL-2020-058")},
                                 "facts": [fact("CL-2020-058")],
                                 "state": {"favour": 1, "changingSea": {"told": ["CL-2020-058"]}}})]),
        dict(name="Inside Ice and the poles (entry 1 showing)",
             setup={"seed": 42, "state": {"currentNodeId": "cs.ice-poles.1", "turn": 1,
                                          "visited": ["cs.intro", "cs.ice-poles.1"],
                                          "changingSea": {"told": ["CL-2020-009"]}}},
             turns=[
                 dict(say="Same question. The polar category comes first, so the top untold pick is CL-2020-043 (CL-2020-009 is the entry already shown, but it sorts below 043 anyway). Choices stay those of entry 1.",
                      request=text(Q15),
                      expect={"status": 200, "reply": {"kind": "answer", "textIncludes": includes("CL-2020-043"),
                                                       "textExcludes": excludes("CL-2020-043")},
                              "facts": [fact("CL-2020-043")], "choices": inside,
                              "state": {"favour": 1, "currentNodeId": "cs.ice-poles.1",
                                        "changingSea": {"told": ["CL-2020-009", "CL-2020-043"]}}}),
                 dict(say="A list question uses the same order: the four polar events of 2020 are named first.",
                      request=text("list what happened in 2020"), expect=ctx_list),
                 dict(say="An exact event name still wins over exhibit context.",
                      request=text("Tell me about Hurricane Helene"),
                      expect={"status": 200, "reply": {"kind": "answer", "textIncludes": includes("CL-2024-029"),
                                                       "textExcludes": excludes("CL-2024-029")},
                              "facts": [fact("CL-2024-029")],
                              "state": {"favour": 2, "changingSea": {"told": ["CL-2020-009", "CL-2020-043", "CL-2024-029"]}}}),
             ]),
    ]))


# 16 -------------------------------------------------------------------------
L16 = "How many El Niño events were there in 2023?"
t16, items16 = listed(L16)
assert t16 == 1, t16
one = items16[0]["eventId"]
e16 = list_expect(L16)
e16["reply"]["textIncludes"] = ["in my records", "1", items16[0]["event"]]
e16["state"] = {"favour": 0, "changingSea": {"told": []}}
examples.append(dict(
    id="16-list-one-match", title="A list question with exactly one match",
    covers="One match is still a list: one item, one hear choice, no 'and N more', no favour change.",
    scenarios=[dict(
        name="El Niño in 2023",
        setup=FRESH,
        turns=[
            dict(say=f"'how many' plus El Niño and 2023: exactly one event in the records ({one}). Still a list, not an answer, so no favour change.",
                 request=text(L16), expect=e16),
            dict(say="Hearing it tells it like an answer: +1.",
                 request=choice("hear." + one.lower()),
                 expect={"status": 200, "reply": {"kind": "answer", "factKind": "history",
                                                  "textIncludes": includes(one), "textExcludes": excludes(one)},
                         "facts": [fact(one)], "list": None, "choices": HUB,
                         "state": {"favour": 1, "changingSea": {"told": [one]}}}),
        ])]))

# 17 -------------------------------------------------------------------------
QUIZ_STATE = {"exhibitId": "warming-waters", "questionIndex": 1, "answers": [True]}
QUIZ_VIEW = {"exhibitId": "warming-waters", "questionNumber": 2, "of": 3, "paused": False}
e17 = list_expect(L1, "warming-waters", after=qopts("warming-waters", 2))
e17["quiz"] = QUIZ_VIEW
e17["state"] = {"favour": 0, "currentNodeId": "cs.warming-waters.3",
                "changingSea": {"told": wwtold, "quiz": QUIZ_STATE}}
assert listed(L1, "warming-waters") == listed(L1)  # storm categories are not in this exhibit's context
examples.append(dict(
    id="17-list-during-quiz", title="A list question in the middle of a quiz",
    covers="List during a quiz: hear choices first, then the question's options; quiz untouched; hearing gives +1; the quiz carries on.",
    scenarios=[dict(
        name="Warming waters quiz, question 2",
        setup={"seed": 42, "state": {"favour": 0, "currentNodeId": "cs.warming-waters.3", "turn": 5,
                                     "visited": ["cs.intro"] + nodes("warming-waters"),
                                     "changingSea": {"told": wwtold, "quiz": QUIZ_STATE}}},
        turns=[
            dict(say="A list question mid-quiz. Same 13 storms as example 14 (exhibit context doesn't change the order, because storms aren't a Warming waters category). Hear choices first, then question 2's options. The quiz is untouched.",
                 request=text(L1), expect=e17),
            dict(say="Hear one of them: +1. The choices go back to question 2's options, and the quiz is still untouched.",
                 request=choice("hear.cl-2020-008"),
                 expect={"status": 200, "reply": {"kind": "answer", "textIncludes": includes("CL-2020-008")},
                         "facts": [fact("CL-2020-008")], "list": None,
                         "choices": qopts("warming-waters", 2), "quiz": QUIZ_VIEW,
                         "state": {"favour": 1, "changingSea": {"told": wwtold + ["CL-2020-008"], "quiz": QUIZ_STATE}}}),
            dict(say="Answer question 2 correctly (a, 83.7%): +1, on to question 3.",
                 request=choice("q.warming-waters.2.a"),
                 expect={"status": 200, "reply": {"kind": "quiz", "textIncludes": [Q["warming-waters"][2]]},
                         "facts": [], "choices": qopts("warming-waters", 3),
                         "quiz": {"exhibitId": "warming-waters", "questionNumber": 3, "of": 3, "paused": False},
                         "state": {"favour": 2, "changingSea": {"quiz": {"exhibitId": "warming-waters", "questionIndex": 2, "answers": [True, True]}}}}),
        ])]))

# 18 -------------------------------------------------------------------------
AI_REPLY = "Volcanoes shape the sea floor, but I cannot vouch for this answer."
V = "Tell me about volcanoes in 2019"
nomatch18 = {"status": 200, "reply": {"kind": "noMatch", "factKind": None, "label": None,
                                      "textIncludes": NOMATCH_INC, "textExcludes": NOMATCH_EXC},
             "facts": [], "list": None, "suggestionsCount": 3,
             "state": {"favour": 0, "changingSea": {"told": []}}}
examples.append(dict(
    id="18-ai-fallback", title="The optional AI fallback (stubbed)",
    covers="AI_ENABLED on with a stub: aiAnswer only on noMatch, labelled 'AI, unverified', no facts, no favour, nothing told; only the visitor's text is sent; errors and timeouts fall back to noMatch; never used for a matched question or while flooded.",
    scenarios=[
        dict(name="The stub answers a noMatch question",
             setup={"seed": 42, "state": {}, "ai": {"enabled": True, "stub": "answer", "reply": AI_REPLY}},
             turns=[dict(say="No match in the records, so the AI service is asked, with only the visitor's text.",
                         request=text(V),
                         expect={"status": 200, "reply": {"kind": "aiAnswer", "factKind": None,
                                                          "label": "AI, unverified", "textIncludes": [AI_REPLY]},
                                 "facts": [], "list": None, "suggestionsCount": 3, "effects": [],
                                 "aiCalls": 1, "aiLastInput": V,
                                 "state": {"favour": 0, "changingSea": {"told": []}}})]),
        dict(name="The stub throws an error",
             setup={"seed": 42, "state": {}, "ai": {"enabled": True, "stub": "error"}},
             turns=[dict(say="The AI call fails, so the visitor gets the normal in-character noMatch.",
                         request=text(V), expect={**nomatch18, "aiCalls": 1})]),
        dict(name="The stub is too slow",
             setup={"seed": 42, "state": {}, "ai": {"enabled": True, "stub": "slow"}},
             turns=[dict(say="The AI call times out (the runner sets timeoutMs: 50), so the visitor gets the normal noMatch.",
                         request=text(V), expect={**nomatch18, "aiCalls": 1})]),
        dict(name="AI is on but not needed",
             setup={"seed": 42, "state": {}, "ai": {"enabled": True, "stub": "answer", "reply": AI_REPLY}},
             turns=[
                 dict(say="A question the records answer never goes to the AI.",
                      request=text("What hurricanes happened in 2020?"),
                      expect={"status": 200, "reply": {"kind": "answer", "label": None,
                                                       "textIncludes": includes("CL-2020-058")},
                              "facts": [fact("CL-2020-058")], "aiCalls": 0, "state": {"favour": 1}}),
                 dict(say="Rude twice: 1 − 3 = −2, then −5, so the flood starts.",
                      request=text("You are useless"), expect={"status": 200, "reply": {"kind": "rude"}, "aiCalls": 0, "state": {"favour": -2}}),
                 dict(say="(second rude message)", request=text("Shut up, you idiot"),
                      expect={"status": 200, "statusField": "flooded", "reply": {"kind": "flood"}, "aiCalls": 0, "state": {"favour": -5}}),
                 dict(say="A noMatch-style question while flooded gets the flood reply. The AI is never asked during the flood.",
                      request=text(V),
                      expect={"status": 200, "statusField": "flooded", "reply": {"kind": "flood", "label": None},
                              "aiCalls": 0, "state": {"favour": -5}}),
             ]),
    ]))


def md(ex):
    lines = [f"# {ex['id']}: {ex['title']}", "", f"**Covers:** {ex['covers']}", ""]
    for s in ex["scenarios"]:
        lines += [f"## {s['name']}", ""]
        st = s["setup"]
        if st.get("start") is False:
            lines.append("Setup: no session yet.")
        elif st.get("state"):
            lines.append(f"Setup: a fresh session (seed {st['seed']}), then this state is applied over the start state (see `README.md`).")
        else:
            lines.append(f"Setup: a fresh session (seed {st['seed']}).")
        if st.get("ai"):
            lines.append(f"AI: `AI_ENABLED` on, stub `{st['ai']['stub']}` (see `README.md`).")
        lines.append("")
        for n, t in enumerate(s["turns"], 1):
            b = t["request"].get("body")
            shown = json.dumps(b, ensure_ascii=False) if b is not None else t["request"].get("rawBody", "(no body)")
            e = t["expect"]
            what = e.get("error", {}).get("code") or e.get("reply", {}).get("kind", "")
            lines.append(f"{n}. {t['say']}  \n   `{t['request']['method']} {t['request']['path']}` {shown} → **{e['status']}** {what}")
        lines.append("")
    lines += ["## Machine-readable", "", "Phase 2's runner reads this block. Fact objects were copied from `research/events.csv` by script.", "",
              "```json", json.dumps(ex, ensure_ascii=False, indent=2), "```", ""]
    return "\n".join(lines)


def main():
    """Writes every example file and prints how many were written."""
    os.makedirs(OUT, exist_ok=True)
    for ex in examples:
        with open(os.path.join(OUT, ex["id"] + ".md"), "w", encoding="utf-8") as f:
            f.write(md(ex))
    print(len(examples), "examples written")


if __name__ == "__main__":
    main()
