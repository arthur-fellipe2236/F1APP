import re

with open('../f1-api/app/api/live.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the scraping loop in live.py
old_parsing = '''                            drivers_list.append({
                                'driver_number': d['n'],
                                'name': d['name'],
                                'code': code,
                                'team': d['team'],
                                'team_colour': d['color'],
                                'position': int(item.get('position', 0)) if item.get('position', '').isdigit() else None,
                                'gap_to_leader': gap_val if gap_val > 0 else 0.0,
                                'interval': int_val if int_val > 0 else 0.0,
                                'lap_number': base_laps, # Keep dynamic laps based on real time
                                'compound': d['comp'],
                                'stops': int(elapsed_sec / 1800),
                                'last_lap': base_laps
                            })'''

new_parsing = '''                            # Parse laps accurately from scraped data
                            raw_laps = item.get('laps', '')
                            laps_val = base_laps
                            if raw_laps.isdigit():
                                laps_val = int(raw_laps)
                                
                            drivers_list.append({
                                'driver_number': d['n'],
                                'name': d['name'],
                                'code': code,
                                'team': d['team'],
                                'team_colour': d['color'],
                                'position': int(item.get('position', 0)) if item.get('position', '').isdigit() else None,
                                'gap_to_leader': gap_val if gap_val > 0 else 0.0,
                                'interval': int_val if int_val > 0 else 0.0,
                                'lap_number': laps_val,
                                'compound': item.get('compound', d['comp']),
                                'stops': int(elapsed_sec / 1800),
                                'last_lap': laps_val
                            })'''

if old_parsing in content:
    content = content.replace(old_parsing, new_parsing)
    with open('../f1-api/app/api/live.py', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Patched live.py to use accurate scraped laps and compounds.")
else:
    print("Could not find the old parsing block.")
