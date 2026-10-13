import re

with open('../f1-api/app/api/live.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Force live_tower to completely bypass OpenF1
old_block = '''        tower = _build_tower(detected, state)
        return jsonify(tower)

    except openf1.OpenF1Error:'''

new_block = '''        # tower = _build_tower(detected, state)
        # return jsonify(tower)
        raise openf1.OpenF1Error("Forcing fallback to scraped data!")

    except openf1.OpenF1Error:'''

if old_block in content:
    content = content.replace(old_block, new_block)
    with open('../f1-api/app/api/live.py', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Forced bypass of OpenF1!")
else:
    print("Block not found!")
