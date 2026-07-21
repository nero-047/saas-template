from fastapi.testclient import TestClient

from saas_compute.core.config import Settings
from saas_compute.main import create_app


def test_health() -> None:
    with TestClient(create_app(Settings(environment="test"))) as client:
        response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}


def test_ready() -> None:
    with TestClient(create_app(Settings(environment="test"))) as client:
        response = client.get("/ready")

    assert response.status_code == 200
    assert response.json() == {"status": "ready"}


def test_generated_routes_are_disabled() -> None:
    application = create_app(Settings(environment="test"))

    assert application.docs_url is None
    assert application.redoc_url is None
    assert application.openapi_url is None

    with TestClient(application) as client:
        assert client.get("/docs").status_code == 404
        assert client.get("/redoc").status_code == 404
        assert client.get("/openapi.json").status_code == 404
