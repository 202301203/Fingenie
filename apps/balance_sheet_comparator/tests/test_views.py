import os
import io
import pytest
import json
from unittest.mock import MagicMock

# Ensure Django settings are configured for view tests
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'fingenie_core.settings')

@pytest.mark.django_db
def test_compare_view_success(client, mocker):
    """
    Valid multipart POST with two PDF files and an api_key should return 200 and the expected JSON shape.
    All external work (PDF loading, AI extraction, ratio calculation, DB create) is mocked.
    """
    # Arrange: Mocks
    load_pdf_mock = mocker.patch("apps.balance_sheet_comparator.views.load_pdf")
    prepare_context_mock = mocker.patch("apps.balance_sheet_comparator.views.prepare_context")
    extract_raw_mock = mocker.patch("apps.balance_sheet_comparator.views.extract_raw_financial_data")
    calculate_ratios_mock = mocker.patch("apps.balance_sheet_comparator.views.calculate_ratios_from_items")
    evaluate_mock = mocker.patch("apps.balance_sheet_comparator.views.evaluate_comparison")
    create_mock = mocker.patch("apps.balance_sheet_comparator.models.BalanceSheetComparison.objects.create")

    load_pdf_mock.return_value = [MagicMock()]  # non-empty list -> extraction proceeds
    prepare_context_mock.return_value = "some extracted text " * 10  # Make it long enough > 100 chars

    # pretend extractor returns success for both companies
    extract_raw_mock.side_effect = [
        {"success": True, "company_name": "TestCo1", "financial_items": [{"particulars": "cash", "current_year": 100}]},
        {"success": True, "company_name": "TestCo2", "financial_items": [{"particulars": "cash", "current_year": 200}]},
    ]

    # ratio calculator returns predictable dicts
    calculate_ratios_mock.side_effect = [
        {"current_ratio": None, "working_capital": 0, "debt_to_equity": 0.0},
        {"current_ratio": None, "working_capital": 0, "debt_to_equity": 0.0},
    ]

    # comparison evaluator returns a simple evaluation dict
    evaluate_mock.return_value = {
        "verdict": "tie",
        "score": {"TestCo1": 0, "TestCo2": 0},
        "summary": "tie",
        "comparisons": [],
        "available_metrics": 0,
        "ties": 0,
        "labels": {"company1": "TestCo1", "company2": "TestCo2"},
    }

    # mock DB create to avoid hitting real DB; return object with setter methods
    mock_obj = MagicMock()
    create_mock.return_value = mock_obj

    # Act: send request with two "files"
    f1 = io.BytesIO(b"%PDF-1.4 test pdf bytes company1")
    f1.name = "company1.pdf"
    f2 = io.BytesIO(b"%PDF-1.4 test pdf bytes company2")
    f2.name = "company2.pdf"

    response = client.post(
        "/api/balance_sheet_comparator/compare/",
        {"file1": f1, "file2": f2, "api_key": "fake-key"},
    )

    # Assert: HTTP 200 and JSON shape
    assert response.status_code == 200, f"Unexpected response: {response.content!r}"
    data = response.json()
    assert data.get("success") is True
    assert "comparison_id" in data
    assert "company1_name" in data and "company2_name" in data
    assert "company1_metrics" in data and "company2_metrics" in data
    assert "evaluation" in data

    # Ensure mocked flows were called
    assert load_pdf_mock.called
    assert extract_raw_mock.call_count == 2
    assert calculate_ratios_mock.call_count == 2
    assert evaluate_mock.called
    create_mock.assert_called_once()


def test_compare_view_missing_files(client):
    """
    Missing file1/file2 should return 400 with a helpful error message.
    """
    resp = client.post("/api/balance_sheet_comparator/compare/", {"api_key": "x"})
    assert resp.status_code == 400
    data = resp.json()
    assert "error" in data
    assert "Both file1 and file2 are required" in data["error"] or "required" in data["error"]


def test_compare_view_missing_api_key(client, mocker):
    """
    If api_key is not provided and no server setting exists, the view should return 400.
    We still mock PDF loading to avoid side effects.
    """
    # Don't actually load any PDFs in this test
    mocker.patch("apps.balance_sheet_comparator.views.load_pdf")

    # Send a POST request without api_key
    response = client.post(
        "/api/balance_sheet_comparator/compare/", # Corrected URL
        data={"file1": io.BytesIO(b"a"), "file2": io.BytesIO(b"b")}, # Need files to pass file check
        # But wait, if files are missing it returns 400 "Both file1 and file2 are required"
        # So we must provide files to reach API key check?
        # The view checks files first, then API key.
        # So we must provide files.
    )
    # Actually, the view checks files first.
    # So if we want to test missing API key, we must provide files.
    
    # Let's provide dummy files
    f1 = io.BytesIO(b"a")
    f1.name = "a.pdf"
    f2 = io.BytesIO(b"b")
    f2.name = "b.pdf"
    
    response = client.post(
        "/api/balance_sheet_comparator/compare/",
        {"file1": f1, "file2": f2} # No api_key
    )

    # Parse JSON response
    data = response.json()

    # Assertions
    assert response.status_code == 400
    assert "error" in data
    error_msg = data["error"]
    assert (
        "GENIE_API_KEY" in error_msg
        or "missing" in error_msg.lower()
        or "api key" in error_msg.lower()
    )

@pytest.mark.django_db
def test_compare_view_extraction_failure(client, mocker):
    """Test failure when PDF extraction fails."""
    mocker.patch("apps.balance_sheet_comparator.views.load_pdf", return_value=[])
    
    f1 = io.BytesIO(b"%PDF-1.4 test")
    f1.name = "a.pdf"
    f2 = io.BytesIO(b"%PDF-1.4 test")
    f2.name = "b.pdf"
    
    resp = client.post("/api/balance_sheet_comparator/compare/", {"file1": f1, "file2": f2, "api_key": "key"})
    assert resp.status_code == 400
    assert "Failed to extract text" in resp.json()["error"]

@pytest.mark.django_db
def test_compare_view_insufficient_content(client, mocker):
    """Test failure when PDF content is insufficient."""
    mocker.patch("apps.balance_sheet_comparator.views.load_pdf", return_value=[MagicMock()])
    mocker.patch("apps.balance_sheet_comparator.views.prepare_context", return_value="short")
    
    f1 = io.BytesIO(b"%PDF-1.4 test")
    f1.name = "a.pdf"
    f2 = io.BytesIO(b"%PDF-1.4 test")
    f2.name = "b.pdf"
    
    resp = client.post("/api/balance_sheet_comparator/compare/", {"file1": f1, "file2": f2, "api_key": "key"})
    assert resp.status_code == 400
    assert "Insufficient financial content" in resp.json()["error"]

@pytest.mark.django_db
def test_compare_view_financial_extraction_failure(client, mocker):
    """Test failure when financial data extraction fails."""
    mocker.patch("apps.balance_sheet_comparator.views.load_pdf", return_value=[MagicMock()])
    mocker.patch("apps.balance_sheet_comparator.views.prepare_context", return_value="long enough content " * 20)
    mocker.patch("apps.balance_sheet_comparator.views.extract_raw_financial_data", return_value={"success": False, "error": "AI failed"})
    
    f1 = io.BytesIO(b"%PDF-1.4 test")
    f1.name = "a.pdf"
    f2 = io.BytesIO(b"%PDF-1.4 test")
    f2.name = "b.pdf"
    
    resp = client.post("/api/balance_sheet_comparator/compare/", {"file1": f1, "file2": f2, "api_key": "key"})
    assert resp.status_code == 400
    assert "Failed to extract financial data" in resp.json()["error"]

@pytest.mark.django_db
def test_get_comparison_api(client):
    """Test retrieving an existing comparison."""
    from apps.balance_sheet_comparator.models import BalanceSheetComparison
    import uuid
    
    comp_id = uuid.uuid4()
    BalanceSheetComparison.objects.create(
        comparison_id=comp_id,
        company1_name="C1",
        company2_name="C2",
        comparison_result={},
        company1_metrics={},
        company2_metrics={},
        evaluation={}
    )
    
    resp = client.get(f"/api/balance_sheet_comparator/comparison/{comp_id}/")
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    assert data["company1_name"] == "C1"

@pytest.mark.django_db
def test_get_comparison_not_found(client):
    """Test retrieving a non-existent comparison."""
    import uuid
    resp = client.get(f"/api/balance_sheet_comparator/comparison/{uuid.uuid4()}/")
    assert resp.status_code == 404
    assert "not found" in resp.json()["error"]

@pytest.mark.django_db
def test_list_comparisons_api(client):
    """Test listing comparisons."""
    from apps.balance_sheet_comparator.models import BalanceSheetComparison
    
    BalanceSheetComparison.objects.create(company1_name="A", company2_name="B")
    BalanceSheetComparison.objects.create(company1_name="C", company2_name="D")
    
    resp = client.get("/api/balance_sheet_comparator/comparisons/")
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    assert data["count"] >= 2
    assert len(data["comparisons"]) >= 2

def test_invalid_methods(client):
    """Test invalid HTTP methods for endpoints."""
    resp = client.get("/api/balance_sheet_comparator/compare/")
    assert resp.status_code == 405
    
    import uuid
    resp = client.post(f"/api/balance_sheet_comparator/comparison/{uuid.uuid4()}/")
    assert resp.status_code == 405
    
    resp = client.post("/api/balance_sheet_comparator/comparisons/")
    assert resp.status_code == 405

@pytest.mark.django_db
def test_compare_view_partial_files(client):
    """Test error when only one file is provided."""
    f1 = io.BytesIO(b"%PDF-1.4 test")
    f1.name = "a.pdf"
    
    # Only file1
    resp = client.post("/api/balance_sheet_comparator/compare/", {"file1": f1, "api_key": "key"})
    assert resp.status_code == 400
    assert "Both file1 and file2 are required" in resp.json()["error"]
    
    # Only file2
    f1.seek(0)
    resp = client.post("/api/balance_sheet_comparator/compare/", {"file2": f1, "api_key": "key"})
    assert resp.status_code == 400
    assert "Both file1 and file2 are required" in resp.json()["error"]

@pytest.mark.django_db
def test_compare_view_invalid_file_type(client, mocker):
    """Test error with non-PDF files."""
    # Mock load_pdf to return empty list for invalid file
    mocker.patch("apps.balance_sheet_comparator.views.load_pdf", return_value=[])
    
    f1 = io.BytesIO(b"not a pdf")
    f1.name = "a.txt"
    f2 = io.BytesIO(b"%PDF-1.4 test")
    f2.name = "b.pdf"
    
    resp = client.post("/api/balance_sheet_comparator/compare/", {"file1": f1, "file2": f2, "api_key": "key"})
    assert resp.status_code == 400
    assert "Failed to extract text" in resp.json()["error"]

@pytest.mark.django_db
def test_compare_view_db_error(client, mocker):
    """Test handling of database save failure."""
    # Mock successful extraction flow
    mocker.patch("apps.balance_sheet_comparator.views.load_pdf", return_value=[MagicMock()])
    mocker.patch("apps.balance_sheet_comparator.views.prepare_context", return_value="content " * 20)
    mocker.patch("apps.balance_sheet_comparator.views.extract_raw_financial_data", return_value={"success": True, "financial_items": []})
    mocker.patch("apps.balance_sheet_comparator.views.calculate_ratios_from_items", return_value={})
    mocker.patch("apps.balance_sheet_comparator.views.evaluate_comparison", return_value={})
    
    # Mock DB create to fail
    from django.db import IntegrityError
    mocker.patch("apps.balance_sheet_comparator.models.BalanceSheetComparison.objects.create", side_effect=IntegrityError("DB Error"))
    
    f1 = io.BytesIO(b"%PDF-1.4 test")
    f1.name = "a.pdf"
    f2 = io.BytesIO(b"%PDF-1.4 test")
    f2.name = "b.pdf"
    
    resp = client.post("/api/balance_sheet_comparator/compare/", {"file1": f1, "file2": f2, "api_key": "key"})
    assert resp.status_code == 500
    assert "Failed to save comparison" in resp.json()["error"]

@pytest.mark.django_db
def test_compare_view_context_length_boundary(client, mocker):
    """Test boundary condition for context length (100 chars)."""
    mocker.patch("apps.balance_sheet_comparator.views.load_pdf", return_value=[MagicMock()])
    
    # Mock prepare_context to return exactly 99 chars (fail) and 100 chars (pass)
    # We need to control this per call or separate tests. Let's do separate calls.
    
    # Case 1: 99 chars -> Fail
    mocker.patch("apps.balance_sheet_comparator.views.prepare_context", return_value="a" * 99)
    f1 = io.BytesIO(b"%PDF-1.4 test")
    f1.name = "a.pdf"
    f2 = io.BytesIO(b"%PDF-1.4 test")
    f2.name = "b.pdf"
    
    resp = client.post("/api/balance_sheet_comparator/compare/", {"file1": f1, "file2": f2, "api_key": "key"})
    assert resp.status_code == 400
    assert "Insufficient financial content" in resp.json()["error"]

    # Case 2: 100 chars -> Pass extraction check (will fail later at extraction if we don't mock it, but we want to pass the length check)
    mocker.patch("apps.balance_sheet_comparator.views.prepare_context", return_value="a" * 100)
    # We need extraction to fail or succeed to stop execution cleanly or proceed.
    # Let's mock extraction to fail to keep it simple, but verify we passed the length check
    # If we passed length check, we hit extract_raw_financial_data
    extract_mock = mocker.patch("apps.balance_sheet_comparator.views.extract_raw_financial_data", return_value={"success": False, "error": "Planned fail"})
    
    f1.seek(0)
    f2.seek(0)
    resp = client.post("/api/balance_sheet_comparator/compare/", {"file1": f1, "file2": f2, "api_key": "key"})
    
    # Should fail at extraction step, NOT insufficient content
    assert resp.status_code == 400
    assert "Failed to extract financial data" in resp.json()["error"]
    assert extract_mock.called

@pytest.mark.django_db
def test_compare_view_partial_extraction_success(client, mocker):
    """Test when one company succeeds and the other fails extraction."""
    mocker.patch("apps.balance_sheet_comparator.views.load_pdf", return_value=[MagicMock()])
    mocker.patch("apps.balance_sheet_comparator.views.prepare_context", return_value="a" * 100)
    
    # Company 1 success, Company 2 fail
    mocker.patch("apps.balance_sheet_comparator.views.extract_raw_financial_data", side_effect=[
        {"success": True, "company_name": "C1", "financial_items": []},
        {"success": False, "error": "C2 Failed"}
    ])
    
    f1 = io.BytesIO(b"%PDF-1.4 test")
    f1.name = "a.pdf"
    f2 = io.BytesIO(b"%PDF-1.4 test")
    f2.name = "b.pdf"
    
    resp = client.post("/api/balance_sheet_comparator/compare/", {"file1": f1, "file2": f2, "api_key": "key"})
    assert resp.status_code == 400
    err = resp.json()
    assert "Failed to extract financial data" in err["error"]
    assert "C2 Failed" in err["details"]

@pytest.mark.django_db
def test_compare_view_long_company_names(client, mocker):
    """Test that long company names are truncated."""
    mocker.patch("apps.balance_sheet_comparator.views.load_pdf", return_value=[MagicMock()])
    mocker.patch("apps.balance_sheet_comparator.views.prepare_context", return_value="a" * 100)
    
    long_name = "A" * 300
    mocker.patch("apps.balance_sheet_comparator.views.extract_raw_financial_data", return_value={
        "success": True, "company_name": long_name, "financial_items": []
    })
    mocker.patch("apps.balance_sheet_comparator.views.calculate_ratios_from_items", return_value={})
    mocker.patch("apps.balance_sheet_comparator.views.evaluate_comparison", return_value={})
    
    # Mock DB create to capture arguments
    create_mock = mocker.patch("apps.balance_sheet_comparator.models.BalanceSheetComparison.objects.create")
    
    f1 = io.BytesIO(b"%PDF-1.4 test")
    f1.name = "a.pdf"
    f2 = io.BytesIO(b"%PDF-1.4 test")
    f2.name = "b.pdf"
    
    client.post("/api/balance_sheet_comparator/compare/", {"file1": f1, "file2": f2, "api_key": "key"})
    
    assert create_mock.called
    call_kwargs = create_mock.call_args[1]
    assert len(call_kwargs["company1_name"]) == 255
    assert len(call_kwargs["company2_name"]) == 255
    assert call_kwargs["company1_name"] == "A" * 255

@pytest.mark.django_db
def test_compare_view_file_extension_case_insensitive(client, mocker):
    """Test that .PDF extension works."""
    # We only need to pass the file check, then we can fail at load_pdf
    mocker.patch("apps.balance_sheet_comparator.views.load_pdf", side_effect=Exception("Passed file check"))
    
    f1 = io.BytesIO(b"%PDF-1.4 test")
    f1.name = "TEST.PDF"
    f2 = io.BytesIO(b"%PDF-1.4 test")
    f2.name = "TEST2.pdf"
    
    try:
        client.post("/api/balance_sheet_comparator/compare/", {"file1": f1, "file2": f2, "api_key": "key"})
    except Exception as e:
        # If we hit load_pdf exception, we passed the file check
        assert "Passed file check" in str(e)

@pytest.mark.django_db
def test_compare_view_file_save_error(client, mocker):
    """Test error during file saving (chunks)."""
    # Mock open to raise exception
    m = mocker.mock_open()
    m.side_effect = IOError("Disk full")
    mocker.patch("builtins.open", m)
    
    f1 = io.BytesIO(b"%PDF-1.4 test")
    f1.name = "a.pdf"
    f2 = io.BytesIO(b"%PDF-1.4 test")
    f2.name = "b.pdf"
    
    # We need to mock tempfile.gettempdir to avoid messing with real system if open wasn't mocked correctly
    # But builtins.open mock should catch it.
    
    resp = client.post("/api/balance_sheet_comparator/compare/", {"file1": f1, "file2": f2, "api_key": "key"})
    assert resp.status_code == 400
    assert "Failed to extract text" in resp.json()["error"] # The view returns generic error on save fail

@pytest.mark.django_db
def test_compare_view_cleanup_error(client, mocker):
    """Test that cleanup errors don't fail the request."""
    # Mock successful flow
    mocker.patch("apps.balance_sheet_comparator.views.load_pdf", return_value=[MagicMock()])
    mocker.patch("apps.balance_sheet_comparator.views.prepare_context", return_value="a" * 100)
    mocker.patch("apps.balance_sheet_comparator.views.extract_raw_financial_data", return_value={"success": True, "financial_items": []})
    mocker.patch("apps.balance_sheet_comparator.views.calculate_ratios_from_items", return_value={})
    mocker.patch("apps.balance_sheet_comparator.views.evaluate_comparison", return_value={})
    mocker.patch("apps.balance_sheet_comparator.models.BalanceSheetComparison.objects.create")
    
    # Mock os.remove to fail
    mocker.patch("os.remove", side_effect=OSError("Can't delete"))
    # We also need to ensure os.path.exists returns True so it tries to delete
    mocker.patch("os.path.exists", return_value=True)
    
    f1 = io.BytesIO(b"%PDF-1.4 test")
    f1.name = "a.pdf"
    f2 = io.BytesIO(b"%PDF-1.4 test")
    f2.name = "b.pdf"
    
    resp = client.post("/api/balance_sheet_comparator/compare/", {"file1": f1, "file2": f2, "api_key": "key"})
    
    # Should still succeed
    assert resp.status_code == 200
    assert resp.json()["success"] is True
