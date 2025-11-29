# apps/dataprocessor/tests/test_services_utils.py
from apps.dataprocessor import services


def test_ensure_service_response_structure_adds_success_true_when_missing():
    data = {"foo": "bar"}
    out = services.ensure_service_response_structure(data)
    assert out["success"] is True


def test_ensure_service_response_structure_invalid_input():
    out = services.ensure_service_response_structure("bad")  # type: ignore
    assert out["success"] is False
    assert "Invalid response" in out["error"]
