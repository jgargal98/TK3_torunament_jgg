import os
import tempfile

# The tests use a temporary SQLite file so they never touch the real MariaDB data.
os.environ["DATABASE_URL"] = "sqlite:///" + os.path.join(tempfile.mkdtemp(), "test.db")

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.database import Base, engine, init_db  # noqa: E402
from app.main import app  # noqa: E402


@pytest.fixture
def client():
    init_db()
    with TestClient(app) as test_client:
        yield test_client
    Base.metadata.drop_all(bind=engine)
