from app import create_app, db
from app.models import Driver

app = create_app()
with app.app_context():
    # First let's check Antonelli
    a = Driver.query.get(238)
    print(f"Antonelli -> First: {a.first_name} | Last: {a.last_name}")

    # Now let's fix standings.py by using exactly the driver IDs of the 22 drivers.
    # This avoids any last_name mismatch issues entirely.
    # Get all 22 active drivers.
    active_teams = ["McLaren", "Mercedes", "Red Bull Racing", "Ferrari", "Williams", "Aston Martin", "Alpine", "Haas", "Audi", "Racing Bulls", "Cadillac"]
    
    # We assigned them previously.
    # To be 100% sure we get the correct 22 drivers, let's filter by these team IDs, but also we can just use the IDs we know.
    # Let's just find the IDs for the exact 2026 grid:
    expected_names = [
        "Lando Norris", "Oscar Piastri",
        "George Russell", "Andrea Kimi Antonelli",
        "Max Verstappen", "Isack Hadjar",
        "Charles Leclerc", "Lewis Hamilton",
        "Alexander Albon", "Carlos Sainz",
        "Fernando Alonso", "Lance Stroll",
        "Pierre Gasly", "Franco Colapinto",
        "Esteban Ocon", "Oliver Bearman",
        "Nico Hülkenberg", "Gabriel Bortoleto",
        "Liam Lawson", "Arvid Lindblad",
        "Sergio Perez", "Valtteri Bottas"
    ]
    ids = []
    for name in expected_names:
        # Search by like
        last_word = name.split()[-1]
        d = Driver.query.filter(Driver.last_name.like(f"%{last_word}%"), Driver.first_name != "Jos").first()
        if d:
            ids.append(d.id)
        else:
            print(f"Missing driver! {name}")

    import re
    with open('../f1-api/app/api/standings.py', 'r', encoding='utf-8') as f:
        content = f.read()

    # The current block we want to replace:
    old_block_regex = r'        last_names = \[.*?\]\s*query = query\.filter\(Driver\.last_name\.in_\(last_names\), Driver\.first_name != "Jos"\)'
    
    new_block = f'''        driver_ids = {ids}
        query = query.filter(Driver.id.in_(driver_ids))'''

    content_new = re.sub(old_block_regex, new_block, content, flags=re.DOTALL)
    
    with open('../f1-api/app/api/standings.py', 'w', encoding='utf-8') as f:
        f.write(content_new)

    print(f"Patched standings.py with {len(ids)} EXACT driver ids.")
