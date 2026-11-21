"""Reference matcher for the changing sea spec (CONVERSATION_SPEC.md §6).

A small Python version of the matching rules, used only to work out the expected results in the
example conversations (which event a question picks, what a list question returns). It is NOT the
engine: the real engine is TypeScript in server/src/engine/. If the spec's matching rules or the
starting lexicon (§12.2) change, update this file too, then regenerate the examples.

Standard library only. Run from anywhere:
    python3 docs/rooms/changing-sea/examples/tools/matcher.py "What hurricanes happened in 2020?"
    python3 docs/rooms/changing-sea/examples/tools/matcher.py "list what happened in 2020" ice-poles
"""
import csv, os, re, sys, unicodedata

HERE = os.path.dirname(os.path.abspath(__file__))
CSV = os.path.join(HERE, "..", "..", "research", "events.csv")
rows = list(csv.DictReader(open(CSV, encoding="utf-8-sig")))
rows = list(csv.DictReader(open(CSV, encoding="utf-8-sig")))
def norm(s):
    s = unicodedata.normalize("NFD", s.lower())
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    s = re.sub(r"[^a-z0-9]+", " ", s)
    return " ".join(s.split())
C = {
 "cyc":"Tropical cyclone (hurricane/typhoon/cyclone)","storm":"Storm, cold & winter weather","flood":"Flood, rain & landslide",
 "fire":"Wildfire","heat":"Heatwave & heat record","drought":"Drought & water scarcity","ice":"Sea ice, glaciers & polar",
 "sl":"Sea level & coasts","ocean":"Ocean, coral & marine life","enso":"El Niño / La Niña","temp":"Global temperature & climate records",
 "ghg":"Greenhouse gases & emissions","policy":"Policy, diplomacy & COP summits","energy":"Energy transition & finance",
 "courts":"Courts & legal action","sci":"Science, reports & attribution","eco":"Ecosystems, health & society"}
SYN = {
 "humans doing":["policy","energy","courts"],"people doing":["policy","energy","courts"],"mortals doing":["policy","energy","courts"],
 "doing about":["policy","energy","courts"],
 "hurricane":["cyc"],"hurricanes":["cyc"],"typhoon":["cyc"],"typhoons":["cyc"],"cyclone":["cyc"],"cyclones":["cyc"],"tropical storm":["cyc"],"tropical storms":["cyc"],
 "storm":["storm","cyc"],"storms":["storm","cyc"],"windstorm":["storm"],"blizzard":["storm"],"snow":["storm"],"winter":["storm"],"cold":["storm"],
 "flood":["flood"],"floods":["flood"],"flooding":["flood"],"rain":["flood"],"rainfall":["flood"],"landslide":["flood"],"landslides":["flood"],"monsoon":["flood"],
 "wildfire":["fire"],"wildfires":["fire"],"fire":["fire"],"fires":["fire"],"bushfire":["fire"],"bushfires":["fire"],
 "heatwave":["heat"],"heatwaves":["heat"],"heat wave":["heat"],"heat":["heat"],
 "drought":["drought"],"droughts":["drought"],
 "ice":["ice"],"glacier":["ice"],"glaciers":["ice"],"iceberg":["ice"],"icebergs":["ice"],"arctic":["ice"],"antarctic":["ice"],"antarctica":["ice"],"polar":["ice"],"poles":["ice"],"greenland":["ice"],"sea ice":["ice"],
 "sea level":["sl"],"sea levels":["sl"],"rising seas":["sl"],"coast":["sl"],"coasts":["sl"],"coastal":["sl"],
 "coral":["ocean"],"corals":["ocean"],"reef":["ocean"],"reefs":["ocean"],"marine":["ocean"],"fish":["ocean"],"bleaching":["ocean"],"ocean heat":["ocean"],"acidification":["ocean"],
 "el nino":["enso"],"la nina":["enso"],
 "temperature":["temp"],"temperatures":["temp"],"hottest":["temp"],"warmest":["temp"],
 "co2":["ghg"],"carbon dioxide":["ghg"],"methane":["ghg"],"emissions":["ghg"],"greenhouse":["ghg"],
 "cop":["policy"],"treaty":["policy"],"treaties":["policy"],"paris agreement":["policy"],"pledge":["policy"],"pledges":["policy"],"policy":["policy"],"summit":["policy"],"summits":["policy"],
 "renewable":["energy"],"renewables":["energy"],"solar":["energy"],"wind power":["energy"],"coal":["energy"],"energy":["energy"],
 "court":["courts"],"courts":["courts"],"lawsuit":["courts"],"tribunal":["courts"],"legal":["courts"],"ruling":["courts"],
 "study":["sci"],"report":["sci"],"attribution":["sci"],"ipcc":["sci"],
 "health":["eco"],"locust":["eco"],"locusts":["eco"],
}
TOPIC = set("climate sea seas ocean oceans weather warming waters water planet earth world environment nature tide tides".split())
STOP = set("what whats happened happen happening tell about the in of a an and did does do is are was were any news show how why when where which who you your i us we there have has had with on for to from at this that these those please know more give some year years much many big biggest worst most latest recent thing things going me my it its s be been can could would should will last first new".split())
def phrases(t):
    hits=[]; rest=" "+t+" "
    for p in sorted(SYN,key=lambda p:-len(p)):
        if " "+p+" " in rest:
            hits.append(p); rest=rest.replace(" "+p+" "," | ")
    return hits, rest
index=set()
for r in rows:
    for w in norm(r["Event"]+" "+r["Location"]+" "+r["Region"]).split():
        if len(w)>=4 and w not in STOP and w not in TOPIC and w not in SYN and not re.fullmatch(r"\d+",w): index.add(w)
def match(text, told=()):
    t=norm(text); hits,rest=phrases(t)
    years=[int(y) for y in re.findall(r"\b(1[89]\d\d|20\d\d)\b",t)]
    cats=set(C[k] for p in hits for k in SYN[p])
    words=[w for w in rest.split() if w!="|"]
    topic=[w for w in words if w in TOPIC]
    known=[w for w in words if w in index and not re.fullmatch(r"\d+",w)]
    info=dict(norm=t,years=years,cats=sorted(cats),known=known,topic=topic)
    # exact name
    exact=[r for r in rows if norm(r["Event"]) and " "+norm(r["Event"])+" " in " "+t+" "]
    if not (years or cats or topic or known or exact): return "notClimate",info,[]
    if any(y<2020 or y>2026 for y in years): return "noMatch(year)",info,[]
    if exact:
        e=max(exact,key=lambda r:len(r["Event"]))
        return ("answer" if e["ID"] not in told else "alreadyTold"),info,[e["ID"]]
    c=[r for r in rows if (not years or int(r["Year"]) in years) and (not cats or r["Category"] in cats)]
    if known:
        c=[r for r in c if any(re.search(r"\b"+w+r"\b",norm(r["Event"]+" "+r["Location"]+" "+r["Region"])) for w in known)]
    if not c: return "noMatch",info,[]
    c.sort(key=lambda r:(r["Ocean link"]=="Yes",bool(r["Climate link (as stated by source)"]),int(r["Year"]),r["ID"]),reverse=True)
    order=[r["ID"] for r in c]
    untold=[i for i in order if i not in told]
    if untold: return "answer",info,order[:6]+["... untold first:",untold[0], "n=%d"%len(order)]
    return "alreadyTold",info,[order[0]]


# ---- List questions (§6.5) and exhibit context (§6.6) ----
COUNT = ["how many", "list the", "list", "count", "name all", "name the"]
EXCATS = {
 "warming-waters": ["Ocean, coral & marine life", "El Niño / La Niña"],
 "ice-poles": ["Sea ice, glaciers & polar"],
 "storms-floods": ["Tropical cyclone (hurricane/typhoon/cyclone)", "Storm, cold & winter weather", "Flood, rain & landslide"],
 "rising-seas": ["Sea level & coasts"],
 "mortals": ["Policy, diplomacy & COP summits", "Energy transition & finance", "Courts & legal action"],
}
def strip_count(t):
    t = " " + norm(t) + " "
    found = False
    for p in COUNT:
        if " " + p + " " in t:
            t = t.replace(" " + p + " ", " "); found = True
    return found, " ".join(t.split())
def cands(text, exhibit=None):
    t = norm(text); hits, rest = phrases(t)
    years = [int(y) for y in re.findall(r"\b(1[89]\d\d|20\d\d)\b", t)]
    cats = set(C[k] for p in hits for k in SYN[p])
    words = [w for w in rest.split() if w != "|"]
    known = [w for w in words if w in index]
    c = [r for r in rows if (not years or int(r["Year"]) in years) and (not cats or r["Category"] in cats)]
    if known:
        c = [r for r in c if any(re.search(r"\b" + w + r"\b", norm(r["Event"] + " " + r["Location"] + " " + r["Region"])) for w in known)]
    ec = EXCATS.get(exhibit, [])
    c.sort(key=lambda r: (r["Category"] in ec, r["Ocean link"] == "Yes", bool(r["Climate link (as stated by source)"]), int(r["Year"]), r["ID"]), reverse=True)
    return dict(years=years, cats=sorted(cats), known=known), c


if __name__ == "__main__":
    question = sys.argv[1]
    exhibit = sys.argv[2] if len(sys.argv) > 2 else None
    is_list, rest = strip_count(question)
    if is_list:
        info, found = cands(rest, exhibit)
        print("list question:", info, "total:", len(found))
        for r in found[:8]:
            print("  ", r["ID"], "|", r["Event"])
    else:
        print(match(question))
