import pytest

from app import create_app
from app.extensions import db
from app.seed import seed


@pytest.fixture(scope="session")
def app(tmp_path_factory):
    db_path = tmp_path_factory.mktemp("f1data") / "f1-test.db"
    application = create_app(
        {
            "TESTING": True,
            "SQLALCHEMY_DATABASE_URI": f"sqlite:///{db_path}",
        }
    )
    yield application


@pytest.fixture(autouse=True)
def fresh_db(app):
    with app.app_context():
        db.drop_all()
        db.create_all()
        seed()
    yield


@pytest.fixture
def client(app):
    return app.test_client()
