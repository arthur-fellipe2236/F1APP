import sqlite3

def check_results():
    conn = sqlite3.connect('../f1-api/instance/f1.db')
    cursor = conn.cursor()
    cursor.execute("SELECT DISTINCT team_id FROM results WHERE driver_id IN (SELECT id FROM drivers WHERE last_name IN ('Bortoleto', 'Hulkenberg', 'Hadjar'));")
    print("Distinct team IDs in results for these drivers:", cursor.fetchall())

if __name__ == "__main__":
    check_results()
