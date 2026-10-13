import json
with open("/tmp/f1_feature.json") as f:
    data = json.load(f)
for d in data["data"]:
    w = d.get("winner") or {}
    sw = d.get("sprint_winner") or {}
    print(f"R{d['round']} - {d['name']} | Feature: {w.get('name')} | Sprint: {sw.get('name')}")
