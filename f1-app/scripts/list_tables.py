import sqlite3

conn = sqlite3.connect('../f1-api/instance/f1.db')
cursor = conn.cursor()

cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = cursor.fetchall()
print([t[0] for t in tables])
