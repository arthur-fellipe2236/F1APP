import sqlite3

def check_db():
    conn = sqlite3.connect('../f1-api/instance/f1.db')
    cursor = conn.cursor()
    
    cursor.execute("SELECT id, name FROM teams;")
    teams = cursor.fetchall()
    print("TEAMS:", teams)
    
    cursor.execute("SELECT first_name, last_name, team_id FROM drivers;")
    drivers = cursor.fetchall()
    print("DRIVERS:", drivers)

if __name__ == "__main__":
    check_db()
