import os
import sys

DIR = os.path.dirname(os.path.abspath(__file__))
if DIR not in sys.path:
    sys.path.insert(0, DIR)

from app.serverless_db import resolve_writable_sqlite_path

# Em execução serverless (Vercel `/var/task` somente leitura), copia o banco
# empacotado atomicamente para `/tmp/f1.db` antes de inicializar o SQLAlchemy,
# garantindo que todas as conexões do processo utilizem o mesmo caminho gravável.
# Nota: `/tmp` na Vercel é efêmero por instância; persistência durável entre
# instâncias/deploys requer banco externo (ex.: PostgreSQL via `F1_DATABASE_URI`)
# ou atualização do banco base empacotado.
bundled_db_file = os.path.join(DIR, "instance", "f1.db")
writable_db_file = resolve_writable_sqlite_path(bundled_db_file)
os.environ["F1_DATABASE_URI"] = f"sqlite:///{writable_db_file}"
os.environ["NO_BACKGROUND_SYNC"] = "1"

from app import create_app

app = create_app()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
