import sqlite3

def fix_database():
    conn = sqlite3.connect('../f1-api/instance/f1.db')
    cursor = conn.cursor()
    
    # Remove Perez from Red Bull Racing
    cursor.execute("UPDATE drivers SET team_id = 22 WHERE last_name = 'Perez';") # Cadillac maybe?
    
    conn.commit()
    print("Perez removed from RBR!")

if __name__ == "__main__":
    fix_database()
