import re

with open('../f1-api/app/api/circuits.py', 'r', encoding='utf-8') as f:
    content = f.read()

old_block = '''                winner_name = f3_winners_2026.get(rnd, {}).get(race_type, "—")
                
                c_dict["winner"] = {
                    "name": winner_name,
                    "code": winner_name[:3].upper() if winner_name != "—" else "",
                    "nationality": "—",
                    "headshot_url": "https://res.cloudinary.com/prod-f2f3/q_auto/v1770000000/common/f3/2026/fallback/driver/2026fallbackdriverright.webp"
                }
                c_dict["sprint_winner"] = c_dict["winner"]'''

new_block = '''                from app.mock_data import F3_2026_DRIVERS
                
                winner_name = f3_winners_2026.get(rnd, {}).get(race_type, "—")
                
                photo_url = "https://res.cloudinary.com/prod-f2f3/q_auto/v1770000000/common/f3/2026/fallback/driver/2026fallbackdriverright.webp"
                code = winner_name[:3].upper() if winner_name != "—" else ""
                
                if winner_name != "—":
                    search_name = winner_name.split(" & ")[0]
                    for d in F3_2026_DRIVERS:
                        full = f"{d['first_name']} {d['last_name']}"
                        if full == search_name:
                            photo_url = d.get("headshot_url") or photo_url
                            code = d["code"]
                            break
                            
                c_dict["winner"] = {
                    "name": winner_name,
                    "code": code,
                    "nationality": "—",
                    "headshot_url": photo_url
                }
                c_dict["sprint_winner"] = c_dict["winner"]'''

content = content.replace(old_block, new_block)

with open('../f1-api/app/api/circuits.py', 'w', encoding='utf-8') as f:
    f.write(content)

print("Restored F3 driver photos!")
