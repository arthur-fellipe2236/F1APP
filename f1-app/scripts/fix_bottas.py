import sqlite3

def fix_bottas():
    conn = sqlite3.connect('../f1-api/instance/f1.db')
    cursor = conn.cursor()
    cursor.execute("UPDATE drivers SET team_id = 22 WHERE last_name = 'Bottas';")
    cursor.execute("UPDATE race_results SET team_id = 22 WHERE driver_id = (SELECT id FROM drivers WHERE last_name = 'Bottas');")
    conn.commit()
    print("Bottas moved to Cadillac")

if __name__ == "__main__":
    fix_bottas()
