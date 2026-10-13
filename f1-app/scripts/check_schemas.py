import sqlite3

def check_db():
    conn = sqlite3.connect('../f1-api/instance/f1.db')
    cursor = conn.cursor()
    
    # We might not have a year column in drivers table? 
    # Let's check table schemas first
    cursor.execute("PRAGMA table_info(drivers);")
    print("DRIVERS:", cursor.fetchall())
    
    cursor.execute("PRAGMA table_info(teams);")
    print("TEAMS:", cursor.fetchall())
    
    cursor.execute("PRAGMA table_info(driver_standings);")
    print("STANDINGS:", cursor.fetchall())

if __name__ == "__main__":
    check_db()
