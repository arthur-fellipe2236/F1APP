"""Suíte de testes obrigatórios da OP-07.8-R1:
1. F1_DATABASE_URI PostgreSQL preservada pelo entrypoint.
2. DATABASE_URL e POSTGRES_URL respeitadas quando aplicável (precedência F1_DATABASE_URI > DATABASE_URL > POSTGRES_URL).
3. URI postgres:// normalizada para postgresql://.
4. Driver PostgreSQL disponível no ambiente serverless (manifestos + import psycopg2).
5. Configuração PostgreSQL inválida gera erro explícito.
6. Ausência de configuração mantém fallback SQLite local.
7. Configuração SQLite explícita continua funcionando.
8. Nenhum fallback silencioso em produção (VERCEL_ENV=production).
9. Classificação 2026 sem pilotos históricos inativos (preservando titulares e reservas de 2026 e temporadas históricas).
10. Paridade entre f1-api/app/ e api/app/.
11. Regressões das rotas de standings e do Cron.
"""

import builtins
import hashlib
import os
from pathlib import Path
import subprocess
import sys
import pytest

from app.extensions import db
from app.models import Driver, Race, RaceResult, Team
from app.serverless_db import (
    configure_entrypoint_database_uri,
    normalize_database_uri,
    resolve_database_uri,
    validate_postgresql_uri,
)

REPO_ROOT = Path(__file__).resolve().parents[2]
F1_API_ROOT = REPO_ROOT / "f1-api"


def _clear_db_env(monkeypatch):
    for key in (
        "F1_DATABASE_URI",
        "DATABASE_URL",
        "POSTGRES_URL",
        "VERCEL_ENV",
        "VERCEL",
        "NO_BACKGROUND_SYNC",
    ):
        monkeypatch.delenv(key, raising=False)


def _run_python_subprocess(code: str, env_overrides: dict[str, str | None]) -> subprocess.CompletedProcess:
    env = os.environ.copy()
    for key in ("F1_DATABASE_URI", "DATABASE_URL", "POSTGRES_URL", "VERCEL_ENV", "VERCEL", "NO_BACKGROUND_SYNC"):
        env.pop(key, None)
    for key, val in env_overrides.items():
        if val is None:
            env.pop(key, None)
        else:
            env[key] = val
    env["PYTHONPATH"] = str(F1_API_ROOT)
    return subprocess.run(
        [sys.executable, "-c", code],
        cwd=str(F1_API_ROOT),
        env=env,
        capture_output=True,
        text=True,
        timeout=15,
    )


def test_01_f1_database_uri_postgresql_preserved_by_entrypoint(monkeypatch, tmp_path):
    """1. F1_DATABASE_URI PostgreSQL é preservada intacta pelo entrypoint e por create_app."""
    _clear_db_env(monkeypatch)
    pg_uri = "postgresql://postgres.ropn:secret@aws-0-us-east-1.pooler.supabase.com:6543/postgres"
    monkeypatch.setenv("F1_DATABASE_URI", pg_uri)
    monkeypatch.setenv("VERCEL_ENV", "production")

    bundled = tmp_path / "instance" / "f1.db"
    bundled.parent.mkdir(parents=True, exist_ok=True)
    bundled.write_bytes(b"sqlite-placeholder")

    resolved = configure_entrypoint_database_uri(str(bundled))
    assert resolved == pg_uri
    assert not resolved.startswith("sqlite:")

    proc = _run_python_subprocess(
        "from app import create_app; app = create_app(); print(app.config['SQLALCHEMY_DATABASE_URI'])",
        {"F1_DATABASE_URI": pg_uri, "VERCEL_ENV": "production", "NO_BACKGROUND_SYNC": "1"},
    )
    assert proc.returncode == 0, proc.stderr
    assert proc.stdout.strip() == pg_uri


def test_02_database_url_and_postgres_url_precedence(monkeypatch, tmp_path):
    """2. DATABASE_URL e POSTGRES_URL são respeitadas com precedência F1_DATABASE_URI > DATABASE_URL > POSTGRES_URL."""
    _clear_db_env(monkeypatch)
    bundled = str(tmp_path / "f1.db")

    uri_f1 = "postgresql://u1:p1@db1.example.com:5432/f1_primary"
    uri_db = "postgresql://u2:p2@db2.example.com:5432/f1_secondary"
    uri_pg = "postgresql://u3:p3@db3.example.com:5432/f1_tertiary"

    # Apenas POSTGRES_URL definida
    monkeypatch.setenv("POSTGRES_URL", uri_pg)
    assert configure_entrypoint_database_uri(bundled) == uri_pg

    # DATABASE_URL + POSTGRES_URL -> DATABASE_URL vence (após limpar F1_DATABASE_URI)
    monkeypatch.delenv("F1_DATABASE_URI", raising=False)
    monkeypatch.setenv("DATABASE_URL", uri_db)
    assert configure_entrypoint_database_uri(bundled) == uri_db

    # F1_DATABASE_URI + DATABASE_URL + POSTGRES_URL -> F1_DATABASE_URI vence
    monkeypatch.setenv("F1_DATABASE_URI", uri_f1)
    assert configure_entrypoint_database_uri(bundled) == uri_f1


def test_03_postgres_scheme_normalized_to_postgresql(monkeypatch, tmp_path):
    """3. URI postgres:// é normalizada para postgresql:// no entrypoint e em create_app."""
    _clear_db_env(monkeypatch)
    raw = "postgres://user:pass@aws-0-us-east-1.pooler.supabase.com:5432/postgres"
    expected = "postgresql://user:pass@aws-0-us-east-1.pooler.supabase.com:5432/postgres"

    assert normalize_database_uri(raw) == expected
    assert (
        normalize_database_uri("postgres+psycopg2://u:p@host:5432/db")
        == "postgresql+psycopg2://u:p@host:5432/db"
    )

    monkeypatch.setenv("DATABASE_URL", raw)
    resolved = configure_entrypoint_database_uri(str(tmp_path / "f1.db"))
    assert resolved == expected

    proc = _run_python_subprocess(
        "from app import create_app; app = create_app(); print(app.config['SQLALCHEMY_DATABASE_URI'])",
        {"DATABASE_URL": raw, "NO_BACKGROUND_SYNC": "1"},
    )
    assert proc.returncode == 0, proc.stderr
    assert proc.stdout.strip() == expected


def test_04_postgresql_driver_available_in_serverless_package():
    """4. Driver PostgreSQL (psycopg2-binary) disponível no ambiente e nos manifestos de api/."""
    import psycopg2  # noqa: F401

    api_req = (REPO_ROOT / "api" / "requirements.txt").read_text(encoding="utf-8")
    f1_api_req = (REPO_ROOT / "f1-api" / "requirements.txt").read_text(encoding="utf-8")
    api_pyproject = (REPO_ROOT / "api" / "pyproject.toml").read_text(encoding="utf-8")
    api_uv_lock = (REPO_ROOT / "api" / "uv.lock").read_text(encoding="utf-8")

    assert "psycopg2-binary>=2.9" in api_req
    assert "psycopg2-binary>=2.9" in f1_api_req
    assert "psycopg2-binary>=2.9" in api_pyproject
    assert 'name = "psycopg2-binary"' in api_uv_lock


@pytest.mark.parametrize(
    "bad_uri",
    [
        "postgresql://",
        "postgresql:///only_db_no_host",
        "postgresql://user:pass@host-without-db:5432",
        "postgresql://user:pass@host-without-db:5432/",
        "postgresql://user:pass@host:notaport/postgres",
        "mysql://user:pass@host:3306/db",
        "http://example.com/db",
        "not-a-uri",
    ],
)
def test_05_invalid_postgresql_configuration_raises_explicit_error(monkeypatch, tmp_path, bad_uri):
    """5. Configuração PostgreSQL inválida gera erro explícito, sem cair em SQLite."""
    _clear_db_env(monkeypatch)
    monkeypatch.setenv("F1_DATABASE_URI", bad_uri)

    with pytest.raises(RuntimeError):
        configure_entrypoint_database_uri(str(tmp_path / "f1.db"))

    with pytest.raises(RuntimeError):
        resolve_database_uri()


def test_05b_missing_psycopg2_raises_explicit_error_never_falls_back(monkeypatch):
    """5b. Se psycopg2 não puder ser importado, falha explicitamente sem trocar para SQLite."""
    _clear_db_env(monkeypatch)
    real_import = builtins.__import__

    def fake_import(name, *args, **kwargs):
        if name == "psycopg2" or name.startswith("psycopg2."):
            raise ImportError("Simulated missing psycopg2")
        return real_import(name, *args, **kwargs)

    monkeypatch.setattr(builtins, "__import__", fake_import)
    monkeypatch.setenv("F1_DATABASE_URI", "postgresql://u:p@host.example.com:5432/f1")

    with pytest.raises(RuntimeError, match="psycopg2"):
        validate_postgresql_uri("postgresql://u:p@host.example.com:5432/f1")

    with pytest.raises(RuntimeError, match="psycopg2"):
        resolve_database_uri()


def test_06_missing_configuration_maintains_local_sqlite_fallback(monkeypatch, tmp_path):
    """6. Ausência de configuração fora de produção mantém fallback SQLite local."""
    _clear_db_env(monkeypatch)
    bundled = tmp_path / "instance" / "f1.db"
    bundled.parent.mkdir(parents=True, exist_ok=True)
    bundled.write_bytes(b"")

    runtime_dir = tmp_path / "runtime"
    uri = configure_entrypoint_database_uri(str(bundled), runtime_dir=str(runtime_dir))
    assert uri.startswith("sqlite:///")


def test_07_explicit_sqlite_configuration_continues_working_locally(monkeypatch, tmp_path):
    """7. Configuração SQLite explícita continua funcionando fora de produção."""
    _clear_db_env(monkeypatch)
    custom_db = tmp_path / "custom_local.db"
    explicit_uri = f"sqlite:///{custom_db}"
    monkeypatch.setenv("F1_DATABASE_URI", explicit_uri)

    resolved = resolve_database_uri(runtime_dir=str(tmp_path))
    assert resolved == explicit_uri

    proc = _run_python_subprocess(
        "from app import create_app; app = create_app({'TESTING': True}); print(app.config['SQLALCHEMY_DATABASE_URI'])",
        {"F1_DATABASE_URI": explicit_uri},
    )
    assert proc.returncode == 0, proc.stderr
    assert proc.stdout.strip() == explicit_uri


def test_08_no_silent_fallback_in_production(monkeypatch, tmp_path):
    """8. Em produção (VERCEL_ENV=production), ausência de URI ou URI SQLite é bloqueada."""
    _clear_db_env(monkeypatch)
    monkeypatch.setenv("VERCEL_ENV", "production")
    bundled = str(tmp_path / "f1.db")

    # Sem nenhuma variável de banco em produção -> erro explícito
    with pytest.raises(RuntimeError, match="produção"):
        configure_entrypoint_database_uri(bundled)

    with pytest.raises(RuntimeError, match="produção"):
        resolve_database_uri()

    # Com F1_DATABASE_URI apontando para SQLite em produção -> erro explícito
    monkeypatch.setenv("F1_DATABASE_URI", f"sqlite:///{bundled}")
    with pytest.raises(RuntimeError, match="SQLite não é permitida em produção"):
        configure_entrypoint_database_uri(bundled)

    with pytest.raises(RuntimeError, match="SQLite não é permitida em produção"):
        resolve_database_uri()

    # Com POSTGRES_URL apontando para SQLite -> erro explícito
    _clear_db_env(monkeypatch)
    monkeypatch.setenv("POSTGRES_URL", f"sqlite:///{bundled}")
    with pytest.raises(RuntimeError):
        configure_entrypoint_database_uri(bundled)


def test_09_2026_driver_standings_excludes_inactive_historical_drivers(client, app):
    """9. Classificação F1 2026 inclui titulares e reservas com corrida em 2026, excluindo pilotos históricos inativos."""
    with app.app_context():
        ferrari = Team.query.filter_by(name="Ferrari").first()
        mercedes = Team.query.filter_by(name="Mercedes").first()
        williams = Team.query.filter_by(name="Williams").first()
        audi = Team(name="Audi", series="f1", base_country="Alemanha", engine_manufacturer="Audi", founded_year=2026)
        cadillac = Team(name="Cadillac", series="f1", base_country="EUA", engine_manufacturer="Ferrari", founded_year=2026)
        db.session.add_all([audi, cadillac])
        db.session.flush()

        # Pilotos históricos inativos vinculados a equipes ativas de 2026 (0 corridas em 2026)
        hist_rosberg = Driver(
            first_name="Nico",
            last_name="Rosberg",
            code="ROS",
            series="f1",
            nationality="Alemao",
            team_id=mercedes.id,
        )
        hist_massa = Driver(
            first_name="Felipe",
            last_name="Massa",
            code="MAS",
            series="f1",
            nationality="Brasileiro",
            team_id=williams.id,
        )
        hist_senna = Driver(
            first_name="Ayrton",
            last_name="Senna",
            code=None,
            series="f1",
            nationality="Brasileiro",
            team_id=williams.id,
        )
        hist_schumacher = Driver(
            first_name="Michael",
            last_name="Schumacher",
            code="SCH",
            series="f1",
            nationality="Alemao",
            team_id=ferrari.id,
        )
        # Piloto titular de 2026 ainda com 0 corridas
        active_bortoleto = Driver(
            first_name="Gabriel",
            last_name="Bortoleto",
            code="BOR",
            series="f1",
            nationality="Brasileiro",
            team_id=audi.id,
        )
        # Piloto reserva legítimo de 2026 que disputou 1 corrida em 2026
        reserve_hirakawa = Driver(
            first_name="Ryo",
            last_name="Hirakawa",
            code="HIR",
            series="f1",
            nationality="Japones",
            team_id=None,
        )
        db.session.add_all([
            hist_rosberg,
            hist_massa,
            hist_senna,
            hist_schumacher,
            active_bortoleto,
            reserve_hirakawa,
        ])
        db.session.flush()

        race_2026 = Race.query.filter_by(season=2026, series="f1").first()
        db.session.add(
            RaceResult(
                race_id=race_2026.id,
                driver_id=reserve_hirakawa.id,
                team_id=mercedes.id,
                position=10,
                points=1.0,
                grid=12,
                laps=57,
                status="Finished",
                fastest_lap=False,
            )
        )
        db.session.commit()

        resp = client.get("/api/v1/standings/drivers?season=2026")
        assert resp.status_code == 200
        payload = resp.get_json()
        assert payload["season"] == 2026

        returned_names = {row["driver_name"] for row in payload["data"]}
        returned_codes = {row["driver_code"] for row in payload["data"]}

        # Titular de 2026 com 0 corridas e reserva de 2026 com 1 corrida devem estar presentes
        assert "Gabriel Bortoleto" in returned_names
        assert "BOR" in returned_codes
        assert "Ryo Hirakawa" in returned_names
        assert "HIR" in returned_codes

        # Pilotos históricos inativos (0 corridas em 2026) NÃO podem aparecer
        assert "Nico Rosberg" not in returned_names
        assert "Felipe Massa" not in returned_names
        assert "Ayrton Senna" not in returned_names
        assert "Michael Schumacher" not in returned_names

        # Temporada histórica continua funcionando normalmente
        resp_2024 = client.get("/api/v1/standings/drivers?season=2024")
        assert resp_2024.status_code == 200
        assert resp_2024.get_json()["season"] == 2024


def test_10_parity_between_f1_api_and_api_app_directories():
    """10. Paridade funcional e de hash entre f1-api/app/ e api/app/."""
    mirrored_relpaths = [
        "__init__.py",
        "serverless_db.py",
        "sync_lease.py",
        "results_refresh.py",
        "api/standings.py",
        "api/sync.py",
    ]
    for rel in mirrored_relpaths:
        f1_file = REPO_ROOT / "f1-api" / "app" / rel
        api_file = REPO_ROOT / "api" / "app" / rel
        assert f1_file.exists(), f"Ausente: {f1_file}"
        assert api_file.exists(), f"Ausente: {api_file}"
        h1 = hashlib.sha256(f1_file.read_bytes()).hexdigest()
        h2 = hashlib.sha256(api_file.read_bytes()).hexdigest()
        assert h1 == h2, f"Divergência de paridade em {rel}: {h1} != {h2}"


def test_11_api_index_entrypoint_preserves_postgresql_in_subprocess_simulation():
    """11. Carregar api/index.py com F1_DATABASE_URI PostgreSQL preserva a URI no app Flask criado."""
    pg_uri = "postgres://postgres.ropn:secret@aws-0-us-east-1.pooler.supabase.com:6543/postgres"
    expected_uri = "postgresql://postgres.ropn:secret@aws-0-us-east-1.pooler.supabase.com:6543/postgres"
    index_path = str(REPO_ROOT / "api" / "index.py")

    code = (
        "import importlib.util; "
        f"spec = importlib.util.spec_from_file_location('vercel_api_index', {index_path!r}); "
        "mod = importlib.util.module_from_spec(spec); "
        "spec.loader.exec_module(mod); "
        "print(mod.app.config['SQLALCHEMY_DATABASE_URI'])"
    )
    proc = _run_python_subprocess(
        code,
        {"F1_DATABASE_URI": pg_uri, "VERCEL_ENV": "production"},
    )
    assert proc.returncode == 0, proc.stderr
    assert proc.stdout.strip() == expected_uri
    assert not proc.stdout.strip().startswith("sqlite:")
