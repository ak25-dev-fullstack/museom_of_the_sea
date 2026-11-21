"""Checks the generated examples against research/events.csv.

- every fact object in `expect.facts` must equal the CSV row exactly (generate_examples.fact);
- every event id used must exist;
- every `textIncludes` string must be a fact field, an event name, the 2026 caveat, a noMatch
  phrase, a list phrase, a quiz question, or example 18's stubbed AI reply.

Exits with status 1 if anything is wrong. From the repo root:
    python3 docs/rooms/changing-sea/examples/tools/check_examples.py
"""
import glob, json, os, re, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import generate_examples as g  # noqa: E402  (importing doesn't write files)

D = os.path.join(g.ROOT, "")
rows = g.rows
bad = 0; nf = 0
fields = ["What happened", "Human impact", "Climate link (as stated by source)"]
for p in sorted(glob.glob(D + "examples/[0-9]*.md")):
    ex = json.loads(re.search(r"```json\n(.*?)\n```", open(p, encoding="utf-8").read(), re.S).group(1))
    for s in ex["scenarios"]:
        for t in s["turns"]:
            e = t["expect"]
            for f in e.get("facts", []):
                nf += 1
                if f != g.fact(f["eventId"]): bad += 1; print("MISMATCH", p, f["eventId"])
            ids = [f["eventId"] for f in e.get("facts", [])] + e.get("factIds", [])
            ids += [i["eventId"] for i in (e.get("list") or {}).get("items", [])]
            for x in ids: assert x in rows
            for inc in e.get("reply", {}).get("textIncludes", []):
                names = {r["Event"] for r in rows.values()}
                ok = inc in names or inc in g.NOMATCH_INC or inc == "in my records" or inc.isdigit() or re.fullmatch(r"and \d+ more", inc) or inc == "2026 figures may be revised." or any(inc == rows[i][k] for i in ids for k in fields) or "?" in inc or inc == g.AI_REPLY
                if not ok: bad += 1; print("INCLUDE not a fact field", p, inc[:50])
            # cause rule: textExcludes present for every shown fact without Climate link
            for i in ids:
                if not rows[i]["Climate link (as stated by source)"] and e.get("reply", {}).get("kind") in ("answer", "exhibit") and not e["reply"].get("textExcludes") and e["reply"].get("textIncludes"):
                    print("note: no textExcludes for", p.split("/")[-1], i)
print("facts checked:", nf, "problems:", bad)
sys.exit(1 if bad else 0)
