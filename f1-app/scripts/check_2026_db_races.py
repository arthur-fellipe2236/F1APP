import sqlite3

conn = sqlite3.connect('../f1-api/instance/f1.db')
cursor = conn.cursor()

cursor.execute("SELECT id, round, name, circuit_id, date, series FROM races WHERE season=2026 ORDER BY series, round")
rows = cursor.fetchall()
print(f"Total 2026 races in DB: {len(rows)}")
for r in rows:
    cursor.execute("SELECT (d.first_name || ' ' || d.last_name), rr.position, rr.points FROM race_results rr JOIN drivers d ON rr.driver_id = d.id WHERE rr.race_id = ? AND rr.position = 1", (r[0],))
    winner = cursor.fetchone()
    print(f"Series: {r[5]:2} | Round {r[1]:2}: {r[2]:30} | Date: {r[4]} | Winner: {winner}")
