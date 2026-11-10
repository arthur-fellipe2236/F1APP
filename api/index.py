import os
import sys

DIR = os.path.dirname(os.path.abspath(__file__))
if DIR not in sys.path:
    sys.path.insert(0, DIR)

from app.serverless_db import configure_entrypoint_database_uri

# Preserva a URI PostgreSQL fornecida pelo ambiente (F1_DATABASE_URI > DATABASE_URL > POSTGRES_URL).
# O SQLite empacotado (`instance/f1.db`) é utilizado apenas como fallback local quando nenhuma
# conexão externa estiver configurada fora de produção.
bundled_db_file = os.path.join(DIR, "instance", "f1.db")
configure_entrypoint_database_uri(bundled_db_file)
os.environ["NO_BACKGROUND_SYNC"] = "1"

from app import create_app

app = create_app()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
