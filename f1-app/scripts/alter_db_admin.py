import sqlite3

try:
    conn = sqlite3.connect('../f1-api/instance/f1.db')
    conn.execute('ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT 0;')
    
    # Elevar o usuário Yndjowsk para admin para que ele possa testar!
    conn.execute("UPDATE users SET is_admin = 1 WHERE username = 'Yndjowsk';")
    
    conn.commit()
    conn.close()
    print("Database altered and Yndjowsk is now admin!")
except Exception as e:
    print(f"Error (maybe already altered): {e}")
