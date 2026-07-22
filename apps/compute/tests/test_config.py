import pytest
from pydantic import ValidationError

from saas_compute.core.config import Settings


def test_environment_is_loaded_from_process_environment(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("COMPUTE_ENVIRONMENT", "staging")

    assert Settings().environment == "staging"


def test_invalid_environment_is_rejected(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("COMPUTE_ENVIRONMENT", "invalid")

    with pytest.raises(ValidationError):
        Settings()
