"""Configuração segura de SQLite para ambientes serverless (ex.: Vercel).

Limitação arquitetural (importante):
- Na Vercel (AWS Lambda), o diretório do pacote (`/var/task`) é somente leitura.
  Abrir `sqlite:////var/task/api/instance/f1.db` diretamente causa falha em
  qualquer `INSERT`/`UPDATE`/`COMMIT` (`sqlite3.OperationalError: attempt to
  write a readonly database`).
- O diretório `/tmp` é gravável, porém **efêmero e isolado por instância**:
  dados gravados em `/tmp/f1.db` (como importação sob demanda de resultados
  recém-publicados) persistem durante o ciclo de vida da instância aquecida
  (warm instance), mas não são compartilhados entre instâncias paralelas nem
  sobrevivem a cold starts ou novos deploys.
- Para persistência durável entre instâncias e deploys, é necessário configurar
  `F1_DATABASE_URI` apontando para um banco gerenciado externo (ex.: PostgreSQL)
  ou atualizar o banco empacotado (`api/instance/f1.db`) no artefato de deploy.
"""

import os
import shutil
import tempfile
import threading

_copy_lock = threading.Lock()


def _is_serverless_environment() -> bool:
    return bool(
        os.environ.get("VERCEL")
        or os.environ.get("VERCEL_ENV")
        or os.environ.get("AWS_LAMBDA_FUNCTION_NAME")
        or os.environ.get("NOW_REGION")
    )


def _is_sqlite_location_writable(db_path: str) -> bool:
    """Verifica se o arquivo SQLite e seu diretório permitem escrita real."""
    if _is_serverless_environment():
        return False

    parent_dir = os.path.dirname(os.path.abspath(db_path)) or "."
    if not os.path.isdir(parent_dir) or not os.access(parent_dir, os.W_OK):
        return False

    if os.path.exists(db_path) and not os.access(db_path, os.W_OK):
        return False

    probe_path = os.path.join(
        parent_dir, f".sqlite_write_probe_{os.getpid()}_{threading.get_ident()}"
    )
    try:
        with open(probe_path, "wb") as probe_file:
            probe_file.write(b"1")
        return True
    except OSError:
        return False
    finally:
        try:
            if os.path.exists(probe_path):
                os.remove(probe_path)
        except OSError:
            pass


def _needs_seed_copy(source_db_path: str, target_db_path: str) -> bool:
    """Determina se `/tmp/f1.db` precisa ser inicializado a partir do banco base."""
    if not os.path.exists(target_db_path):
        return True
    try:
        target_size = os.path.getsize(target_db_path)
        if target_size == 0 and os.path.exists(source_db_path) and os.path.getsize(source_db_path) > 0:
            return True
    except OSError:
        return True
    return False


def resolve_writable_sqlite_path(
    source_db_path: str,
    runtime_dir: str | None = None,
    force_copy: bool = False,
) -> str:
    """Retorna um caminho SQLite gravável, copiando atomicamente para `/tmp` se necessário.

    A cópia é feita para um arquivo temporário exclusivo no mesmo diretório de
    destino seguida de `os.replace`, evitando que execuções concorrentes leiam
    um arquivo SQLite parcialmente copiado.
    """
    abs_source = os.path.abspath(source_db_path)
    if not force_copy and _is_sqlite_location_writable(abs_source):
        return abs_source

    target_dir = runtime_dir or os.environ.get("F1_RUNTIME_DB_DIR") or tempfile.gettempdir()
    os.makedirs(target_dir, exist_ok=True)
    db_filename = os.path.basename(abs_source) or "f1.db"
    target_db_path = os.path.abspath(os.path.join(target_dir, db_filename))

    if abs_source == target_db_path:
        return target_db_path

    with _copy_lock:
        if force_copy or _needs_seed_copy(abs_source, target_db_path):
            if os.path.exists(abs_source):
                tmp_path = os.path.join(
                    target_dir,
                    f".{db_filename}.tmp.{os.getpid()}.{threading.get_ident()}",
                )
                try:
                    shutil.copy2(abs_source, tmp_path)
                    try:
                        os.chmod(tmp_path, 0o644)
                    except OSError:
                        pass
                    with open(tmp_path, "rb+") as f:
                        f.flush()
                        os.fsync(f.fileno())
                    os.replace(tmp_path, target_db_path)
                finally:
                    if os.path.exists(tmp_path):
                        try:
                            os.remove(tmp_path)
                        except OSError:
                            pass
            else:
                # Se não houver banco inicial, garante que o arquivo de destino possa ser criado.
                with open(target_db_path, "ab"):
                    pass
                try:
                    os.chmod(target_db_path, 0o644)
                except OSError:
                    pass

    return target_db_path


def ensure_writable_sqlite_uri(
    db_uri: str,
    runtime_dir: str | None = None,
    force_copy: bool = False,
) -> str:
    """Normaliza uma URI `sqlite:///...` para um caminho gravável quando necessário."""
    if not db_uri or not db_uri.startswith("sqlite:///"):
        return db_uri
    raw_path = db_uri[len("sqlite:///"):]
    if not raw_path or raw_path == ":memory:" or raw_path.startswith("file:"):
        return db_uri
    writable_path = resolve_writable_sqlite_path(
        raw_path, runtime_dir=runtime_dir, force_copy=force_copy
    )
    return f"sqlite:///{writable_path}"


__all__ = [
    "resolve_writable_sqlite_path",
    "ensure_writable_sqlite_uri",
]
