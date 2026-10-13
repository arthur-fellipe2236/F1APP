import sqlite3

def check_results():
    conn = sqlite3.connect('../f1-api/instance/f1.db')
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    print("Tables:", cursor.fetchall())

if __name__ == "__main__":
    check_results()
