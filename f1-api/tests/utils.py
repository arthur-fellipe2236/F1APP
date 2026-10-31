import os
import pathlib
from app import create_app
from app.extensions import db

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
    # Resolve candidate early to compare with protected paths before existence check
    candidate = original.resolve(strict=False)
    # Check collision with protected paths first
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
                # candidate does not exist – samefile would raise; ignore
                pass


class TempApp:
    """Context manager that mirrors the behaviour of the ``app`` fixture.

    It creates a temporary SQLite database, sets the required environment
    variables, builds the Flask application, and performs the same cleanup as
    the original fixture (restoring env vars, disposing the SQLAlchemy engine
    and removing the temporary DB file).  Any cleanup errors are aggregated and
    raised as a ``RuntimeError``.
    """

    def __init__(self, tmp_path_factory):
        self.tmp_path_factory = tmp_path_factory
        self.db_path = None
        self.application = None
        self.prev_f1_uri = None
        self.prev_no_sync = None
        self.cleanup_errors = []

    def __enter__(self):
        self.db_path = self.tmp_path_factory.mktemp("f1data") / "f1-test.db"
        _validate_temp_db(self.db_path)
        uri = f"sqlite:///{self.db_path}"
        self.prev_f1_uri = os.getenv("F1_DATABASE_URI")
        self.prev_no_sync = os.getenv("NO_BACKGROUND_SYNC")
        os.environ["F1_DATABASE_URI"] = uri
        os.environ["NO_BACKGROUND_SYNC"] = "1"
        try:
            self.application = create_app({
                "TESTING": True,
                "SQLALCHEMY_DATABASE_URI": uri,
            })
            if self.application.config.get("SQLALCHEMY_DATABASE_URI") != uri:
                raise RuntimeError("Effective DB URI does not match the temporary URI")
            return self.application
        except Exception:
            # If creation fails we still want cleanup to run in __exit__
            raise

    def __exit__(self, exc_type, exc_val, exc_tb):
        # Restore environment variables
        if self.prev_f1_uri is None:
            os.environ.pop("F1_DATABASE_URI", None)
        else:
            os.environ["F1_DATABASE_URI"] = self.prev_f1_uri
        if self.prev_no_sync is None:
            os.environ.pop("NO_BACKGROUND_SYNC", None)
        else:
            os.environ["NO_BACKGROUND_SYNC"] = self.prev_no_sync
        # Dispose SQLAlchemy resources if app was created
        if self.application is not None:
            try:
                with self.application.app_context():
                    db.session.remove()
                    engine = db.engine
                    engine.dispose()
            except Exception as exc:
                self.cleanup_errors.append(exc)
        # Remove temporary DB file
        try:
            if self.db_path and self.db_path.exists():
                os.remove(self.db_path)
        except Exception as exc:
            self.cleanup_errors.append(exc)
        if self.cleanup_errors:
            raise RuntimeError(f"Fixture cleanup failures: {self.cleanup_errors}")
        # Do not suppress original exception, if any
        return False
