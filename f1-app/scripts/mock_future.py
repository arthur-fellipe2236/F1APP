import re

with open('../f1-api/app/api/live.py', 'r', encoding='utf-8') as f:
    content = f.read()

old_block = '''    if state == "finished":
        app_cache.set(tower_key, tower, TOWER_FINISHED_TTL)
    return jsonify(tower)'''

new_block = '''    if state == "finished":
        app_cache.set(tower_key, tower, TOWER_FINISHED_TTL)
        
    # --- OVERRIDE FOR DEMONSTRATION / ROLEPLAY ---
    # The user wants to see the Countdown Timer AND the Timing Tower at the same time.
    from datetime import datetime, timezone, timedelta
    start_time = datetime.now(timezone.utc) + timedelta(hours=1, minutes=30)
    tower["session"]["date_start"] = start_time.isoformat()
    # We also need to change the state to 'scheduled' so the frontend shows the native widgets and countdown, 
    # but the drivers array is already populated!
    tower["session"]["state"] = "scheduled"
    # ---------------------------------------------
    
    return jsonify(tower)'''

if old_block in content:
    content = content.replace(old_block, new_block)
    with open('../f1-api/app/api/live.py', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Patched live.py to always add a future date_start and 'scheduled' state.")
else:
    print("Block not found!")
