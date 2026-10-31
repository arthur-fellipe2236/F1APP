import os
import pathlib
import pytest
import importlib.util
import importlib
import sys

# Load utils module from tests directory
utils_path = pathlib.Path(__file__).resolve().parent / 'utils.py'
spec = importlib.util.spec_from_file_location('utils', utils_path)
utils_mod = importlib.util.module_from_spec(spec)
sys.modules['utils'] = utils_mod
spec.loader.exec_module(utils_mod)
from utils import _validate_temp_db, PROTECTED_PATHS


@pytest.fixture(autouse=True)
def fresh_db():
    """Override fresh_db fixture to avoid creating the default app fixture.
    This guarantees isolated environment variables for failure testing.
    """
    yield


# Helper fixture that applies monkeypatch before the real `app` fixture is created
@pytest.fixture
def app_with_monkeypatch(request, monkeypatch):
    """Return the real `app` fixture after applying monkeypatches.

    The fixture fetches the original `app` fixture using ``request.getfixturevalue``
    so that the fixture setup logic is exercised. Note that fixture teardown
    runs after the test function exits, so teardown exceptions cannot be
    caught within the test function via pytest.raises wrapping this call.
    """
    def get_app():
        return request.getfixturevalue('app')
    return get_app


# Helper to create an app similar to the fixture, with optional failure injection
def _create_app_with_failure(tmp_path_factory, monkeypatch, *, fail_create=False, fail_dispose=False):
    """Create a Flask app for testing.

    * ``fail_create`` – if True, the patched ``app.create_app`` will raise.
    * ``fail_dispose`` – if True, the engine returned by ``db.get_engine`` will raise on ``dispose``.
    Returns a tuple ``(app, db_path, cleanup_errors)`` where ``app`` may be ``None``
    if creation failed, ``db_path`` is the temporary SQLite path, and ``cleanup_errors``
    is a list that will be populated by the inner ``finally`` block.
    """
    db_path = tmp_path_factory.mktemp("f1data_fail") / "f1-fail.db"
    _validate_temp_db(db_path)
    uri = f"sqlite:///{db_path}"
    # Preserve env vars
    prev_f1_uri = os.getenv("F1_DATABASE_URI")
    prev_no_sync = os.getenv("NO_BACKGROUND_SYNC")
    os.environ["F1_DATABASE_URI"] = uri
    os.environ["NO_BACKGROUND_SYNC"] = "1"

    # Patch create_app to raise if requested
    if fail_create:
        monkeypatch.setattr('app.create_app', lambda *args, **kw: (_ for _ in ()).throw(RuntimeError("boom")))

    application = None
    cleanup_errors = []
    try:
        application = importlib.import_module('app').create_app({
            "TESTING": True,
            "SQLALCHEMY_DATABASE_URI": uri,
        })
        # Verify URI
        if application.config.get("SQLALCHEMY_DATABASE_URI") != uri:
            raise RuntimeError("Effective DB URI mismatch")

        # Patch engine dispose if requested (after app and engine are created)
        if fail_dispose:
            from app.extensions import db as ext_db
            with application.app_context():
                def bad_dispose():
                    raise RuntimeError("dispose error")
                monkeypatch.setattr(ext_db.engine, 'dispose', bad_dispose)

        return application, db_path, cleanup_errors
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

        # Dispose if app created
        if application is not None:
            try:
                from app.extensions import db as ext_db
                with application.app_context():
                    ext_db.session.remove()
                    ext_db.engine.dispose()
            except Exception as exc:
                cleanup_errors.append(exc)

        # Remove temporary file
        try:
            if db_path.exists():
                os.remove(db_path)
        except Exception as exc:
            cleanup_errors.append(exc)

        # If any cleanup errors, raise aggregated
        if cleanup_errors:
            raise RuntimeError(f"Cleanup failures: {cleanup_errors}")


def test_create_app_failure(monkeypatch, tmp_path_factory):
    # Expect that the helper raises during creation and still cleans up
    with pytest.raises(RuntimeError) as excinfo:
        _create_app_with_failure(tmp_path_factory, monkeypatch, fail_create=True)
    assert "boom" in str(excinfo.value)
    # After exception, env vars must be restored
    assert os.getenv("F1_DATABASE_URI") is None
    assert os.getenv("NO_BACKGROUND_SYNC") is None


def test_engine_dispose_failure(monkeypatch, tmp_path_factory):
    # Create app but force dispose to fail; the helper will raise cleanup error
    with pytest.raises(RuntimeError) as excinfo:
        _create_app_with_failure(tmp_path_factory, monkeypatch, fail_dispose=True)
    # The exception message should contain the dispose error
    assert "dispose error" in str(excinfo.value)
    # Ensure env vars restored
    assert os.getenv("F1_DATABASE_URI") is None
    assert os.getenv("NO_BACKGROUND_SYNC") is None


def test_multiple_app_cleanup(monkeypatch, tmp_path_factory):
    """Test that cleanup errors are correctly propagated and that a subsequent app
    can be created successfully after a failure in the first app's cleanup.
    """
    # First app – expect cleanup to raise due to dispose failure
    with pytest.raises(RuntimeError) as excinfo:
        _create_app_with_failure(tmp_path_factory, monkeypatch, fail_dispose=True)
    assert "dispose error" in str(excinfo.value)

    # Second app – normal creation and cleanup should succeed without errors
    app2, db_path2, errors2 = _create_app_with_failure(tmp_path_factory, monkeypatch)
    assert app2 is not None
    # No cleanup errors should have been aggregated
    assert not errors2
    # Temporary DB file must be removed after successful cleanup
    assert not db_path2.exists()


def test_partial_cleanup_failure(monkeypatch, tmp_path_factory):
    # Simulate failure in disposing first app only
    counter = {"first": 0, "second": 0}
    # Patch db.get_engine to raise on first call, succeed on second
    def conditional_engine(app):
        class Engine:
            def dispose(self_inner):
                if getattr(app, "_cleanup_id", None) == "first":
                    counter["first"] += 1
                    raise RuntimeError("first dispose fail")
                else:
                    counter["second"] += 1
        return Engine()
    monkeypatch.setattr('app.extensions.db.get_engine', conditional_engine)

    # Both apps will use this temporary database path
    db_path = tmp_path_factory.mktemp("f1data_multi") / "f1-multi.db"
    _validate_temp_db(db_path)
    uri = f"sqlite:///{db_path}"
    prev_f1_uri = os.getenv("F1_DATABASE_URI")
    prev_no_sync = os.getenv("NO_BACKGROUND_SYNC")
    os.environ["F1_DATABASE_URI"] = uri
    os.environ["NO_BACKGROUND_SYNC"] = "1"

    app1 = None
    app2 = None
    try:
        app1 = importlib.import_module('app').create_app({"TESTING": True, "SQLALCHEMY_DATABASE_URI": uri})
        setattr(app1, "_cleanup_id", "first")
        app2 = importlib.import_module('app').create_app({"TESTING": True, "SQLALCHEMY_DATABASE_URI": uri})
        setattr(app2, "_cleanup_id", "second")

        def cleanup_all():
            cleanup_errors = []
            for app in (app1, app2):
                if app is not None:
                    try:
                        from app.extensions import db as ext_db
                        with app.app_context():
                            ext_db.session.remove()
                            engine = ext_db.get_engine(app)
                            engine.dispose()
                    except Exception as exc:
                        cleanup_errors.append(exc)
            try:
                if db_path.exists():
                    os.remove(db_path)
            except Exception as exc:
                cleanup_errors.append(exc)
            if cleanup_errors:
                raise RuntimeError(f"Cleanup failures: {cleanup_errors}")

        with pytest.raises(RuntimeError) as excinfo:
            cleanup_all()

        assert counter["first"] == 1
        assert counter["second"] == 1
        assert "first dispose fail" in str(excinfo.value)
        assert not db_path.exists()
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
