import sqlite3
import pandas as pd

def check_db():
    conn = sqlite3.connect('../f1-api/instance/f1.db')
    
    # Let's get drivers in 2026
    query = """
    SELECT d.first_name, d.last_name, t.name 
    FROM drivers d
    JOIN teams t ON d.team_id = t.id
    WHERE d.year = 2026;
    """
    
    try:
        df = pd.read_sql_query(query, conn)
        print("2026 Drivers:")
        print(df)
    except Exception as e:
        print("Query failed:", e)

if __name__ == "__main__":
    check_db()
