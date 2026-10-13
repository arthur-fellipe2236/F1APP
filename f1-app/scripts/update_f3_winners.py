import re

with open('../f1-api/app/api/circuits.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the F2/F3 mock block with hardcoded F3 winners and mocked F2 winners
old_block = '''    if series in ["f2", "f3"]:
        import random
        from app.mock_data import F2_2026_DRIVERS, F3_2026_DRIVERS
        
        query = (
            db.session.query(Circuit, func.min(Race.round).label("round"))
            .join(Race, Race.circuit_id == Circuit.id)
            .filter(Race.season == season, Race.series == series)
            .group_by(Circuit.id)
            .order_by(func.min(Race.round))
        )
        base_results = query.all()
        
        drivers_list = F2_2026_DRIVERS if series == "f2" else F3_2026_DRIVERS

        def get_random_winner(seed_val):
            rng = random.Random(seed_val)
            d = rng.choice(drivers_list)
            return {
                "name": f"{d['first_name']} {d['last_name']}",
                "code": d["code"],
                "nationality": d["nationality"],
                "headshot_url": d.get("headshot_url") or "https://res.cloudinary.com/prod-f2f3/q_auto/v1770000000/common/f3/2026/fallback/driver/2026fallbackdriverright.webp"
            }

        data = []
        for row in base_results:
            c_dict = row[0].to_dict()
            rnd = row[1]
            c_dict["round"] = rnd
            
            c_dict["winner"] = get_random_winner(f"winner-{series}-{season}-{rnd}-{race_type}")
            c_dict["sprint_winner"] = get_random_winner(f"sprint-{series}-{season}-{rnd}")
            
            data.append(c_dict)
            
        return jsonify({
            "data": data,
            "meta": {
                "current_page": 1,
                "per_page": len(data),
                "total_pages": 1,
                "total_items": len(data)
            }
        })'''

new_block = '''    if series in ["f2", "f3"]:
        query = (
            db.session.query(Circuit, func.min(Race.round).label("round"))
            .join(Race, Race.circuit_id == Circuit.id)
            .filter(Race.season == season, Race.series == series)
            .group_by(Circuit.id)
            .order_by(func.min(Race.round))
        )
        base_results = query.all()
        
        data = []
        
        if series == "f3" and season == 2026:
            # Hardcoded F3 2026 Winners
            # Structure: round: {"sprint": "Driver Name", "feature": "Driver Name"}
            f3_winners_2026 = {
                1: {"sprint": "Bruno del Pino", "feature": "Ugo Ugochukwu"},
                2: {"sprint": "Gerrard Xie", "feature": "Brando Badoer"},
                3: {"sprint": "James Wharton", "feature": "Théophile Naël"},
                4: {"sprint": "Ernesto Rivera", "feature": "Noah Strømsted"},
                5: {"sprint": "Ugo Ugochukwu", "feature": "Maciej Gładysz"},
                6: {"sprint": "Kean Nakamura-Berta", "feature": "Ernesto Rivera"},
                7: {"sprint": "Théophile Naël", "feature": "Freddie Slater"},
                8: {"sprint": "Taito Kato", "feature": "Nicola Lacorte"},
                9: {"sprint": "Théophile Naël", "feature": "Pedro Clerot & Tuukka Taponen"}
            }
            
            for row in base_results:
                c_dict = row[0].to_dict()
                rnd = row[1]
                c_dict["round"] = rnd
                
                winner_name = f3_winners_2026.get(rnd, {}).get(race_type, "—")
                
                c_dict["winner"] = {
                    "name": winner_name,
                    "code": winner_name[:3].upper() if winner_name != "—" else "",
                    "nationality": "—",
                    "headshot_url": "https://res.cloudinary.com/prod-f2f3/q_auto/v1770000000/common/f3/2026/fallback/driver/2026fallbackdriverright.webp"
                }
                c_dict["sprint_winner"] = c_dict["winner"]
                data.append(c_dict)
                
        else:
            # Fallback for F2 or other seasons (Mock logic)
            import random
            from app.mock_data import F2_2026_DRIVERS, F3_2026_DRIVERS
            drivers_list = F2_2026_DRIVERS if series == "f2" else F3_2026_DRIVERS

            def get_random_winner(seed_val):
                rng = random.Random(seed_val)
                d = rng.choice(drivers_list)
                return {
                    "name": f"{d['first_name']} {d['last_name']}",
                    "code": d["code"],
                    "nationality": d["nationality"],
                    "headshot_url": d.get("headshot_url") or "https://res.cloudinary.com/prod-f2f3/q_auto/v1770000000/common/f3/2026/fallback/driver/2026fallbackdriverright.webp"
                }
                
            for row in base_results:
                c_dict = row[0].to_dict()
                rnd = row[1]
                c_dict["round"] = rnd
                
                c_dict["winner"] = get_random_winner(f"winner-{series}-{season}-{rnd}-{race_type}")
                c_dict["sprint_winner"] = get_random_winner(f"sprint-{series}-{season}-{rnd}")
                data.append(c_dict)
            
        return jsonify({
            "data": data,
            "meta": {
                "current_page": 1,
                "per_page": len(data),
                "total_pages": 1,
                "total_items": len(data)
            }
        })'''

content = content.replace(old_block, new_block)

with open('../f1-api/app/api/circuits.py', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated circuits.py with F3 hardcoded winners.")
