import sqlite3
conn = sqlite3.connect('/home/arthur/Projects/f1-api/instance/f1.db')
tables = conn.execute("SELECT name FROM sqlite_master WHERE type='table';").fetchall()
print('Tables:', tables)
for t in tables:
    cols = conn.execute(f"PRAGMA table_info({t[0]});").fetchall()
    print(f"Table {t[0]}: {[c[1] for c in cols]}")
