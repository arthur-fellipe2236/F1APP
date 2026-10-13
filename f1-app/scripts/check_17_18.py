import sqlite3

conn = sqlite3.connect('../f1-api/instance/f1.db')
cursor = conn.cursor()

cursor.execute("SELECT r.id, r.round, r.name, r.date, r.circuit_id, c.name, c.country FROM races r LEFT JOIN circuits c ON r.circuit_id = c.id WHERE r.season=2026 AND r.round IN (17, 18) AND r.series='f1'")
rows = cursor.fetchall()
for r in rows:
    print(r)
