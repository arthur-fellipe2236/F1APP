import os
import pathlib
import pytest

from app import create_app
from app.extensions import db
from app.seed import seed

# Resolve project root (two levels up from this file)
PROJECT_ROOT = pathlib.Path(__file__).resolve().parents[2]
# All official and backup DB locations (six protected paths)
OFFICIAL_DB_PATHS = {
    PROJECT_ROOT / "f1.db",
    PROJECT_ROOT / "api" / "instance" / "f1.db",
    PROJECT_ROOT / "f1-api" / "f1.db",
}
BACKUP_DB_PATHS = {
    PROJECT_ROOT / "f1.db.backup_.bak",
    PROJECT_ROOT / "api" / "instance" / "f1.db.backup_.bak",
    PROJECT_ROOT / "f1-api" / "f1.db.backup_.bak",
}
ALL_PROTECTED_PATHS = OFFICIAL_DB_PATHS | BACKUP_DB_PATHS
# Alias used by tests and validator
PROTECTED_PATHS = ALL_PROTECTED_PATHS

def _validate_temp_db(candidate_path: pathlib.Path):
    """Validate a temporary SQLite DB candidate.

    Steps:
    1. Keep a reference to the original user‑supplied path for error messages.
    2. Reject if the candidate is a symbolic link (including dangling links).
    3. Reject if the candidate already exists as a file or directory.
    4. Resolve (normalize) the candidate with ``resolve(strict=False)`` – this
       does *not* raise if the path does not exist yet.
    5. Compare the normalized candidate with each protected path (also
       resolved). If they are equal, raise.
    6. If a protected path exists on disk, we can safely use ``samefile`` to
       detect a hard‑link; however ``samefile`` cannot be used when the candidate
       does **not** exist, because it would raise ``FileNotFoundError``. The
       check therefore runs only for existing protected files.
    """
    original = candidate_path
    if original.is_symlink():
        raise RuntimeError(f"Temporary DB {original} is a symbolic link")
    candidate = original.resolve(strict=False)
    # Check collision with protected paths first
    for protected in PROTECTED_PATHS:
        protected_resolved = protected.resolve(strict=False)
        if candidate == protected_resolved:
            raise RuntimeError(
                f"Temporary DB {original} collides with protected path {protected}"
            )
    # Check pre-existence before hard-link check
    if original.exists():
        raise RuntimeError(f"Temporary DB {original} already exists")
    for protected in PROTECTED_PATHS:
        if protected.exists():
            try:
                if candidate.samefile(protected):
                    raise RuntimeError(
                        f"Temporary DB {original} hard‑links to protected file {protected}"
                    )
            except FileNotFoundError:
                pass

@pytest.fixture(autouse=True)
def _clear_f1_env(monkeypatch):
    """Ensure F1 env vars start unset for each test.
    This prevents leakage between tests that rely on exact restoration.
    """
    monkeypatch.delenv("F1_DATABASE_URI", raising=False)
    monkeypatch.delenv("NO_BACKGROUND_SYNC", raising=False)

@pytest.fixture
def app(tmp_path_factory):
    # 1. Create temporary SQLite file path (absolute)
    db_path = tmp_path_factory.mktemp("f1data") / "f1-test.db"
    _validate_temp_db(db_path)

    uri = f"sqlite:///{db_path}"
    # Preserve previous environment variables
    prev_f1_uri = os.getenv("F1_DATABASE_URI")
    prev_no_sync = os.getenv("NO_BACKGROUND_SYNC")
    # Set temporary env vars before app creation
    os.environ["F1_DATABASE_URI"] = uri
    os.environ["NO_BACKGROUND_SYNC"] = "1"

    application = None
    cleanup_errors = []
    try:
        application = create_app({
            "TESTING": True,
            "SQLALCHEMY_DATABASE_URI": uri,
        })
        # Verify effective URI matches supplied URI
        if application.config.get("SQLALCHEMY_DATABASE_URI") != uri:
            raise RuntimeError("Effective DB URI does not match the temporary URI")
        yield application
    finally:
        # ---------- 1️⃣ Restore environment variables (always) ----------
        if prev_f1_uri is None:
            os.environ.pop("F1_DATABASE_URI", None)
        else:
            os.environ["F1_DATABASE_URI"] = prev_f1_uri
        if prev_no_sync is None:
            os.environ.pop("NO_BACKGROUND_SYNC", None)
        else:
            os.environ["NO_BACKGROUND_SYNC"] = prev_no_sync
        # ---------- 2️⃣ Dispose SQLAlchemy resources (if app was created) ----------
        if application is not None:
            try:
                with application.app_context():
                    # Try to get engine via get_engine (patchable). If it raises KeyError (engine missing), fallback to .engine.
                    engine = db.engine
                    db.session.remove()
                    engine.dispose()
            except Exception as exc:
                cleanup_errors.append(exc)
        # ---------- 3️⃣ Remove temporary DB file (must happen) ----------
        try:
            if db_path.exists():
                os.remove(db_path)
        except Exception as exc:
            cleanup_errors.append(exc)
        # If any cleanup step failed, raise an aggregated error
        if cleanup_errors:
            raise RuntimeError(f"Fixture cleanup failures: {cleanup_errors}")

@pytest.fixture(autouse=True)
def fresh_db(app):
    """Re‑create a clean database for each test."""
    with app.app_context():
        db.drop_all()
        db.create_all()
        seed()
    yield

@pytest.fixture
def client(app):
    return app.test_client()
