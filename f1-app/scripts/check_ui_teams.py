import sqlite3

def check_db():
    conn = sqlite3.connect('../f1-api/instance/f1.db')
    cursor = conn.cursor()
    cursor.execute("SELECT d.first_name, d.last_name, t.name FROM drivers d JOIN teams t ON d.team_id = t.id WHERE d.last_name IN ('Bortoleto', 'Hulkenberg', 'Hadjar')")
    print(cursor.fetchall())

if __name__ == "__main__":
    check_db()
