import pytest
from fastapi.testclient import TestClient

from app.core.config import Settings
from app.main import create_app


def make_settings(**overrides) -> Settings:
    """Test settings: dummy values only, never reads a local .env file."""
    values = {"app_env": "test", **overrides}
    return Settings(_env_file=None, **values)


@pytest.fixture
def settings() -> Settings:
    return make_settings()


@pytest.fixture
def app(settings):
    return create_app(settings)


@pytest.fixture
def client(app):
    # raise_server_exceptions=False lets us check the 500 response itself.
    return TestClient(app, raise_server_exceptions=False)
