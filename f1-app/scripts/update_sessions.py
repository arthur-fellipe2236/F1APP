import sqlite3

conn = sqlite3.connect('../f1-api/instance/f1.db')
cursor = conn.cursor()

# Find the race
cursor.execute("SELECT id FROM races WHERE season=2026 AND round=18 AND series='f1'")
race = cursor.fetchone()
if not race:
    print("Race not found")
    exit()

race_id = race[0]
print(f"Race ID: {race_id}")

# Delete old sessions
cursor.execute("DELETE FROM sessions WHERE race_id=?", (race_id,))

# Insert new sprint format sessions
# Oct 9:
# TL1: 05:30 BRT (08:30 UTC) -> Since BRT is UTC-3, 05:30 is 05:30-03:00 = 08:30Z
# Sprint Quali: 09:30 BRT (12:30 UTC)
# Oct 10:
# Sprint Race: 06:00 BRT (09:00 UTC)
# Quali: 10:00 BRT (13:00 UTC)
# Oct 11:
# Race: 09:00 BRT (12:00 UTC)

sessions = [
    (race_id, 'Practice', 'Treino Livre 1', '2026-10-09 08:30:00', '2026-10-09 09:30:00'),
    (race_id, 'Sprint Qualifying', 'Classificação Sprint', '2026-10-09 12:30:00', '2026-10-09 13:30:00'),
    (race_id, 'Sprint', 'Corrida Sprint', '2026-10-10 09:00:00', '2026-10-10 10:00:00'),
    (race_id, 'Qualifying', 'Classificação Principal', '2026-10-10 13:00:00', '2026-10-10 14:00:00'),
    (race_id, 'Race', 'Corrida Principal', '2026-10-11 12:00:00', '2026-10-11 14:00:00'),
]

cursor.executemany("INSERT INTO sessions (race_id, type, name, date_start, date_end) VALUES (?, ?, ?, ?, ?)", sessions)
conn.commit()

print("Sessions updated!")
