import sqlite3

def check_db():
    conn = sqlite3.connect('../f1-api/instance/f1.db')
    cursor = conn.cursor()
    cursor.execute("SELECT team_name, name_acronym FROM drivers WHERE year = 2026;")
    rows = cursor.fetchall()
    for row in rows:
        print(row)

if __name__ == "__main__":
    check_db()
