import sqlite3

def fix_perez_results():
    conn = sqlite3.connect('../f1-api/instance/f1.db')
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM drivers WHERE last_name = 'Perez';")
    row = cursor.fetchone()
    if row:
        perez_id = row[0]
        cursor.execute(f"UPDATE race_results SET team_id = 22 WHERE driver_id = {perez_id};")
        conn.commit()
        print("Perez race results updated!")

if __name__ == "__main__":
    fix_perez_results()
