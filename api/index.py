import os
import sys

DIR = os.path.dirname(os.path.abspath(__file__))
if DIR not in sys.path:
    sys.path.insert(0, DIR)

# Use bundled SQLite database
db_file = os.path.join(DIR, "instance", "f1.db")
os.environ["F1_DATABASE_URI"] = f"sqlite:///{db_file}"
os.environ["NO_BACKGROUND_SYNC"] = "1"

from app import create_app

app = create_app()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
