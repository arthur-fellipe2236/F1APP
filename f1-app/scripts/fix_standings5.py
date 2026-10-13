from app import create_app, db
from app.models import Driver

app = create_app()
with app.app_context():
    expected_names = [
        "Lando Norris", "Oscar Piastri",
        "George Russell", "Andrea Kimi Antonelli",
        "Max Verstappen", "Isack Hadjar",
        "Charles Leclerc", "Lewis Hamilton",
        "Alexander Albon", "Carlos Sainz",
        "Fernando Alonso", "Lance Stroll",
        "Pierre Gasly", "Franco Colapinto",
        "Esteban Ocon", "Oliver Bearman",
        "Nico Hulkenberg", "Gabriel Bortoleto",
        "Liam Lawson", "Arvid Lindblad",
        "Sergio Perez", "Valtteri Bottas"
    ]
    ids = []
    for name in expected_names:
        last_word = name.split()[-1]
        d = Driver.query.filter(Driver.last_name.like(f"%{last_word}%"), Driver.first_name != "Jos").first()
        if d:
            ids.append(d.id)
        else:
            print(f"Missing driver! {name}")

    import re
    with open('../f1-api/app/api/standings.py', 'r', encoding='utf-8') as f:
        content = f.read()

    old_block_regex = r'        driver_ids = \[.*?\]\s*query = query\.filter\(Driver\.id\.in_\(driver_ids\)\)'
    
    new_block = f'''        driver_ids = {ids}
        query = query.filter(Driver.id.in_(driver_ids))'''

    content_new = re.sub(old_block_regex, new_block, content, flags=re.DOTALL)
    
    with open('../f1-api/app/api/standings.py', 'w', encoding='utf-8') as f:
        f.write(content_new)

    print(f"Patched standings.py with {len(ids)} EXACT driver ids.")
