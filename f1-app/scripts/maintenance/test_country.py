import sqlite3
c = sqlite3.connect('instance/f1.db')
print([row[0] for row in c.execute('SELECT DISTINCT country FROM circuits').fetchall()])
