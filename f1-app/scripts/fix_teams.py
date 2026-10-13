import sqlite3

def fix_database():
    conn = sqlite3.connect('../f1-api/instance/f1.db')
    cursor = conn.cursor()
    
    # Move Hulkenberg and Bortoleto to Audi (team_id 21)
    cursor.execute("UPDATE drivers SET team_id = 21 WHERE last_name IN ('Hulkenberg', 'Bortoleto');")
    
    # Move Isack Hadjar to Red Bull Racing (team_id 5)
    cursor.execute("UPDATE drivers SET team_id = 5 WHERE last_name = 'Hadjar';")
    
    # Maybe Sergio Perez is fired or moved? Let's unassign him just in case, or leave him
    # Usually F1 DBs have multiple drivers. But if Hadjar is now in RBR, it's fine.
    
    conn.commit()
    print("Database fixed!")

if __name__ == "__main__":
    fix_database()
