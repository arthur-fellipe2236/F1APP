import os
import pathlib
import pytest

from app import create_app
from app.extensions import db

# Resolve project root (two levels up from this file)
PROJECT_ROOT = pathlib.Path(__file__).resolve().parents[2]
# All official and backup DB locations (six protected paths)
PROTECTED_PATHS = {
    PROJECT_ROOT / "f1.db",
    PROJECT_ROOT / "api" / "instance" / "f1.db",
    PROJECT_ROOT / "f1-api" / "f1.db",
    PROJECT_ROOT / "f1.db.backup_.bak",
    PROJECT_ROOT / "api" / "instance" / "f1.db.backup_.bak",
    PROJECT_ROOT / "f1-api" / "f1.db.backup_.bak",
}

def _validate_temp_db(candidate_path: pathlib.Path):
    """Validate a temporary SQLite DB candidate.

    * Reject symbolic links.
    * Reject existing files/dirs.
    * Resolve candidate (strict=False) and compare with protected paths (also resolved).
    * If a protected path exists, use samefile to detect hard‑link.
    """
    original = candidate_path
    if original.is_symlink():
        raise RuntimeError(f"Temporary DB {original} is a symbolic link")
    if original.exists():
        raise RuntimeError(f"Temporary DB {original} already exists")
    candidate = original.resolve(strict=False)
    for protected in PROTECTED_PATHS:
        protected_resolved = protected.resolve(strict=False)
        if candidate == protected_resolved:
            raise RuntimeError(
                f"Temporary DB {original} collides with protected path {protected}"
            )
        if protected.exists():
            try:
                if candidate.samefile(protected):
                    raise RuntimeError(
                        f"Temporary DB {original} hard‑links to protected file {protected}"
                    )
            except FileNotFoundError:
                pass

def test_multiple_instances(tmp_path_factory):
    db_path = tmp_path_factory.mktemp("f1data_multi") / "f1-test-multi.db"
    _validate_temp_db(db_path)
    uri = f"sqlite:///{db_path}"

    prev_f1_uri = os.getenv("F1_DATABASE_URI")
    prev_no_sync = os.getenv("NO_BACKGROUND_SYNC")
    os.environ["F1_DATABASE_URI"] = uri
    os.environ["NO_BACKGROUND_SYNC"] = "1"

    app1 = None
    app2 = None
    cleanup_errors = []
    try:
        app1 = create_app({"TESTING": True, "SQLALCHEMY_DATABASE_URI": uri})
        app2 = create_app({"TESTING": True, "SQLALCHEMY_DATABASE_URI": uri})
        routes1 = {r.rule for r in app1.url_map.iter_rules()}
        routes2 = {r.rule for r in app2.url_map.iter_rules()}
        assert routes1 == routes2, "Route sets differ between two app instances"
    finally:
        # Restore env vars
        if prev_f1_uri is None:
            os.environ.pop("F1_DATABASE_URI", None)
        else:
            os.environ["F1_DATABASE_URI"] = prev_f1_uri
        if prev_no_sync is None:
            os.environ.pop("NO_BACKGROUND_SYNC", None)
        else:
            os.environ["NO_BACKGROUND_SYNC"] = prev_no_sync
        # Cleanup each app individually, collecting errors
        for app in (app1, app2):
            if app is not None:
                try:
                    with app.app_context():
                        db.session.remove()
                        engine = db.engine
                        engine.dispose()
                except Exception as exc:
                    cleanup_errors.append(exc)
        # Remove temporary DB file, collecting errors
        try:
            if db_path.exists():
                os.remove(db_path)
        except Exception as exc:
            cleanup_errors.append(exc)
        if cleanup_errors:
            raise RuntimeError(f"Cleanup failures: {cleanup_errors}")
