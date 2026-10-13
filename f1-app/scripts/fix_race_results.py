import sqlite3

def fix_results():
    conn = sqlite3.connect('../f1-api/instance/f1.db')
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM drivers WHERE last_name IN ('Bortoleto', 'Hulkenberg');")
    audi_driver_ids = [row[0] for row in cursor.fetchall()]
    print("Audi driver ids:", audi_driver_ids)
    
    if audi_driver_ids:
        cursor.execute(f"UPDATE race_results SET team_id = 21 WHERE driver_id IN ({','.join(map(str, audi_driver_ids))});")
    
    cursor.execute("SELECT id FROM drivers WHERE last_name = 'Hadjar';")
    hadjar_id = cursor.fetchone()[0]
    print("Hadjar id:", hadjar_id)
    
    if hadjar_id:
        cursor.execute(f"UPDATE race_results SET team_id = 5 WHERE driver_id = {hadjar_id};")
    
    conn.commit()
    print("Race results updated!")

if __name__ == "__main__":
    fix_results()
