"""Configuração segura de banco de dados para ambientes locais e serverless (ex.: Vercel).

Regras de resolução e precedência de URI de banco:
1. Prioridade de variáveis de ambiente:
   `F1_DATABASE_URI` > `DATABASE_URL` > `POSTGRES_URL`.
2. Normalização:
   Esquemas `postgres://` e `postgres+psycopg2://` são normalizados para
   `postgresql://` e `postgresql+psycopg2://` (compatibilidade SQLAlchemy 2.0).
3. Proteção contra fallback silencioso:
   - Qualquer configuração PostgreSQL explícita (ou via `POSTGRES_URL`) é
     validada quanto a esquema, host, nome do banco, porta e disponibilidade
     do driver `psycopg2`. Falhas geram `RuntimeError` explícito — nunca há
     substituição silenciosa por SQLite.
   - Em produção (`VERCEL_ENV=production`), uma URI PostgreSQL válida é
     obrigatória; ausência de configuração ou URI SQLite gera `RuntimeError`.
4. Fallback SQLite local:
   Apenas quando nenhuma variável de banco estiver definida (ou quando SQLite
   for explicitamente configurado) fora de produção, utiliza o SQLite local
   com cópia atômica para diretório gravável (`/tmp`) se o diretório de origem
   for somente leitura.
"""

import os
import shutil
import tempfile
import threading
from urllib.parse import urlsplit

_copy_lock = threading.Lock()

ENV_DB_URI_KEYS = ("F1_DATABASE_URI", "DATABASE_URL", "POSTGRES_URL")


def _is_serverless_environment() -> bool:
    return bool(
        os.environ.get("VERCEL")
        or os.environ.get("VERCEL_ENV")
        or os.environ.get("AWS_LAMBDA_FUNCTION_NAME")
        or os.environ.get("NOW_REGION")
    )


def is_production_environment(environ=None) -> bool:
    """Identifica se a execução atual está em ambiente de produção."""
    env = environ if environ is not None else os.environ
    vercel_env = (env.get("VERCEL_ENV") or "").strip().lower()
    return vercel_env == "production"


def normalize_database_uri(raw_uri: str) -> str:
    """Normaliza esquemas legados `postgres://` para `postgresql://`."""
    if not raw_uri or not isinstance(raw_uri, str):
        return ""
    uri = raw_uri.strip()
    if uri.startswith("postgres://"):
        return "postgresql://" + uri[len("postgres://") :]
    if uri.startswith("postgres+psycopg2://"):
        return "postgresql+psycopg2://" + uri[len("postgres+psycopg2://") :]
    return uri


def validate_postgresql_uri(db_uri: str) -> str:
    """Valida sintaxe de URI PostgreSQL e presença do driver psycopg2.

    Lança `RuntimeError` explícito em caso de configuração inválida ou driver
    ausente, impedindo fallback silencioso para SQLite.
    """
    normalized = normalize_database_uri(db_uri)
    if not normalized:
        raise RuntimeError("URI PostgreSQL inválida: string vazia.")

    try:
        parsed = urlsplit(normalized)
    except Exception as exc:
        raise RuntimeError(f"URI PostgreSQL malformada: {exc}") from exc

    if parsed.scheme not in ("postgresql", "postgresql+psycopg2"):
        raise RuntimeError(
            f"Esquema de URI PostgreSQL inválido ({parsed.scheme!r}); "
            "esperado 'postgresql://' ou 'postgres://'."
        )

    if not parsed.hostname:
        raise RuntimeError("URI PostgreSQL inválida: host ausente.")

    db_name = (parsed.path or "").lstrip("/")
    if not db_name:
        raise RuntimeError("URI PostgreSQL inválida: nome do banco de dados ausente.")

    try:
        _ = parsed.port
    except ValueError as exc:
        raise RuntimeError(f"URI PostgreSQL inválida: porta inválida ({exc}).") from exc

    try:
        import psycopg2  # noqa: F401
    except ImportError as exc:
        raise RuntimeError(
            "Driver PostgreSQL (psycopg2) indisponível no ambiente; "
            "fallback silencioso para SQLite bloqueado."
        ) from exc

    return normalized


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


def resolve_database_uri(
    default_sqlite_path: str | None = None,
    runtime_dir: str | None = None,
    environ=None,
    testing: bool = False,
) -> str:
    """Resolve e valida a URI de conexão respeitando a precedência de ambiente.

    Precedência: `F1_DATABASE_URI` > `DATABASE_URL` > `POSTGRES_URL`.
    - Se uma URI PostgreSQL for informada, normaliza `postgres://` e valida
      sintaxe e driver `psycopg2` sem jamais fazer fallback silencioso para SQLite.
    - Em produção (`VERCEL_ENV=production`), exige URI PostgreSQL válida.
    - Fora de produção, permite SQLite explícito ou fallback para o SQLite local.
    """
    env = environ if environ is not None else os.environ
    in_prod = is_production_environment(env) and not testing

    source_key = None
    raw_uri = ""
    for key in ENV_DB_URI_KEYS:
        candidate = (env.get(key) or "").strip()
        if candidate:
            source_key = key
            raw_uri = candidate
            break

    if raw_uri:
        normalized = normalize_database_uri(raw_uri)
        if source_key == "POSTGRES_URL" or not normalized.startswith("sqlite:"):
            return validate_postgresql_uri(normalized)

        # Configuração explícita SQLite
        if in_prod:
            raise RuntimeError(
                "Configuração SQLite não é permitida em produção (VERCEL_ENV=production); "
                "configure uma URI PostgreSQL válida."
            )
        return ensure_writable_sqlite_uri(normalized, runtime_dir=runtime_dir)

    # Nenhuma variável de banco definida no ambiente
    if in_prod:
        raise RuntimeError(
            "Nenhuma URI de banco configurada em produção (VERCEL_ENV=production); "
            "defina F1_DATABASE_URI, DATABASE_URL ou POSTGRES_URL com uma conexão PostgreSQL válida."
        )

    if default_sqlite_path:
        writable_path = resolve_writable_sqlite_path(
            default_sqlite_path, runtime_dir=runtime_dir
        )
        return f"sqlite:///{writable_path}"

    return ensure_writable_sqlite_uri("sqlite:///f1.db", runtime_dir=runtime_dir)


def configure_entrypoint_database_uri(
    bundled_sqlite_path: str,
    runtime_dir: str | None = None,
    environ=None,
) -> str:
    """Configura `F1_DATABASE_URI` no entrypoint serverless preservando PostgreSQL externo."""
    env = environ if environ is not None else os.environ
    resolved_uri = resolve_database_uri(
        default_sqlite_path=bundled_sqlite_path,
        runtime_dir=runtime_dir,
        environ=env,
    )
    env["F1_DATABASE_URI"] = resolved_uri
    return resolved_uri


__all__ = [
    "ENV_DB_URI_KEYS",
    "is_production_environment",
    "normalize_database_uri",
    "validate_postgresql_uri",
    "resolve_writable_sqlite_path",
    "ensure_writable_sqlite_uri",
    "resolve_database_uri",
    "configure_entrypoint_database_uri",
]
