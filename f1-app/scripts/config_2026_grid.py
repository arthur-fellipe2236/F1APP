from app import create_app, db
from app.models import Driver, Team

app = create_app()

GRID = {
    "McLaren": [("Lando", "Norris", 1), ("Oscar", "Piastri", 81)],
    "Mercedes": [("George", "Russell", 63), ("Andrea Kimi", "Antonelli", 12)],
    "Red Bull Racing": [("Max", "Verstappen", 3), ("Isack", "Hadjar", 6)],
    "Ferrari": [("Charles", "Leclerc", 16), ("Lewis", "Hamilton", 44)],
    "Williams": [("Alexander", "Albon", 23), ("Carlos", "Sainz", 55)],
    "Aston Martin": [("Fernando", "Alonso", 14), ("Lance", "Stroll", 18)],
    "Alpine": [("Pierre", "Gasly", 10), ("Franco", "Colapinto", 43)],
    "Haas": [("Esteban", "Ocon", 31), ("Oliver", "Bearman", 87)],
    "Audi": [("Nico", "Hülkenberg", 27), ("Gabriel", "Bortoleto", 5)],
    "Racing Bulls": [("Liam", "Lawson", 30), ("Arvid", "Lindblad", 41)],
    "Cadillac": [("Sergio", "Perez", 11), ("Valtteri", "Bottas", 77)]
}

# Known aliases to catch DB existing entries
TEAM_ALIASES = {
    "Ferrari": "Ferrari",
    "McLaren": "McLaren",
    "Mercedes": "Mercedes",
    "Red Bull Racing": "Red Bull Racing",
    "Williams": "Williams",
    "Aston Martin": "Aston Martin",
    "Alpine": "Alpine",
    "Haas": "Haas",
    "Audi": "Audi",
    "Racing Bulls": "Racing Bulls",
    "Cadillac": "Cadillac"
}

DRIVER_NAME_ALIASES = {
    "Andrea Kimi": "Kimi", # Kimi Antonelli
    "Carlos": "Carlos", # Sainz Jr. handling
    "Sergio": "Sergio", # Pérez
    "Nico": "Nico", # Hülkenberg
    "Valtteri": "Valtteri",
}

with app.app_context():
    # 1. Setup Teams
    team_objs = {}
    for team_name in GRID.keys():
        t = Team.query.filter_by(name=team_name).first()
        if not t:
            # Maybe it exists under a different name?
            if team_name == "Racing Bulls":
                t = Team.query.filter_by(name="RB").first()
                if t:
                    t.name = "Racing Bulls"
            if team_name == "Audi":
                t = Team.query.filter_by(name="Sauber").first()
                if t:
                    t.name = "Audi"
                    
        if not t:
            t = Team(name=team_name, series="f1")
            db.session.add(t)
            db.session.flush()
        team_objs[team_name] = t
        
    # 2. Setup Drivers
    active_driver_ids = []
    
    for team_name, drivers in GRID.items():
        t = team_objs[team_name]
        for fname, lname, number in drivers:
            # Query by last name and fuzzy first name
            d = Driver.query.filter(Driver.last_name.like(f"%{lname}%"), Driver.first_name.like(f"%{fname[:4]}%")).first()
            if not d and lname == "Sainz":
                d = Driver.query.filter(Driver.last_name.like("%Sainz%")).first()
            if not d and lname == "Perez":
                d = Driver.query.filter(Driver.last_name.like("%Pérez%")).first()
            if not d and lname == "Hülkenberg":
                d = Driver.query.filter(Driver.last_name.like("%Hulkenberg%")).first()
            if not d and lname == "Antonelli":
                d = Driver.query.filter(Driver.last_name.like("%Antonelli%")).first()

            if not d:
                print(f"Creating missing driver: {fname} {lname}")
                d = Driver(first_name=fname, last_name=lname, permanent_number=number, series="f1", code=lname[:3].upper())
                db.session.add(d)
                db.session.flush()
            
            # Update their details
            d.team_id = t.id
            d.permanent_number = number
            active_driver_ids.append(d.id)
            print(f"Assigned {d.first_name} {d.last_name} (#{d.permanent_number}) to {t.name}")
            
    db.session.commit()
    print("Database updated with the explicit 11-team 22-driver grid.")
    
    # Write a new patch file for app/api/teams.py and app/api/drivers.py
    
    import re
    
    # Teams API Patch
    with open('../f1-api/app/api/teams.py', 'r', encoding='utf-8') as f:
        t_content = f.read()
        
    t_pattern = re.compile(r'    if season:\n        if series == "f1" and season == 2026:.*?        else:', re.DOTALL)
    
    new_t_block = '''    if season:
        if series == "f1" and season == 2026:
            f1_2026_grid = ["McLaren", "Mercedes", "Red Bull Racing", "Ferrari", "Williams", "Aston Martin", "Alpine", "Haas", "Audi", "Racing Bulls", "Cadillac"]
            query = query.filter(Team.name.in_(f1_2026_grid))
        else:'''
    
    t_content = t_pattern.sub(new_t_block, t_content)
    with open('../f1-api/app/api/teams.py', 'w', encoding='utf-8') as f:
        f.write(t_content)
        
    # Drivers API Patch
    with open('../f1-api/app/api/drivers.py', 'r', encoding='utf-8') as f:
        d_content = f.read()
        
    d_pattern = re.compile(r'    season = parse_int\(request\.args\.get\("season"\), "season"\)\n    if season:\n        if series == "f1" and season == 2026:.*?        else:', re.DOTALL)
    
    # Get the exact active driver IDs to safely filter
    driver_id_list = ",".join([str(did) for did in active_driver_ids])
    
    new_d_block = f'''    season = parse_int(request.args.get("season"), "season")
    if season:
        if series == "f1" and season == 2026:
            query = query.filter(Driver.id.in_([{driver_id_list}]))
        else:'''
        
    d_content = d_pattern.sub(new_d_block, d_content)
    with open('../f1-api/app/api/drivers.py', 'w', encoding='utf-8') as f:
        f.write(d_content)
        
    print("API Endpoints Patched Successfully!")
