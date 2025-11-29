import pytest
import json
from unittest.mock import MagicMock, patch
from django.test import RequestFactory
from django.http import Http404
from apps.chatbot.views import chatbot_api_view
from apps.dataprocessor.models import FinancialReport
from django.urls import reverse, resolve

# --- FIXTURES (Global Scope) ---

@pytest.fixture
def rf():
    """Django RequestFactory fixture."""
    return RequestFactory()

@pytest.fixture
def valid_payload():
    """Standard valid payload for testing."""
    return json.dumps({
        "question": "Is this company profitable?",
        "document_id": 123,
        "history": [],
        "api_key": "test-groq-key"
    }).encode("utf-8")

@pytest.fixture
def mock_financial_report():
    """Mocks the FinancialReport database object."""
    report = MagicMock(spec=FinancialReport)
    report.pk = 123
    report.company_name = "Test Corp"
    report.ticker_symbol = "TEST"
    
    # Mock attributes accessed by the view (for fallbacks)
    report.pros = ["Strong cash flow", "Good management"]
    report.cons = ["High debt"]
    report.financial_health_summary = "Overall healthy."
    
    # Mock the get_summary method
    report.get_summary.return_value = {
        "pros": ["Strong cash flow", "Good management"],
        "cons": ["High debt"],
        "financial_health_summary": "Overall healthy."
    }
    return report

# --- TEST CLASS ---

@pytest.mark.django_db
class TestChatbotView:

    # --- HAPPY PATHS & BASICS ---

    def test_url_resolves_correctly(self):
        url = reverse('chatbot_api')
        resolved = resolve(url)
        assert resolved.func == chatbot_api_view

    def test_invalid_method_returns_405(self, rf):
        request = rf.get("/chatbot/")
        response = chatbot_api_view(request)
        assert response.status_code == 405
        assert json.loads(response.content) == {'error': 'Invalid method'}

    def test_invalid_json_body(self, rf):
        """Kills mutants in JSON parsing logic."""
        request = rf.post("/chatbot/", data=b"{ invalid_json: ", content_type="application/json")
        response = chatbot_api_view(request)
        assert response.status_code == 400
        assert "Invalid JSON" in json.loads(response.content)['error']

    def test_happy_path_success(self, rf, valid_payload, mock_financial_report):
        with patch("apps.chatbot.views.get_object_or_404", return_value=mock_financial_report):
            with patch("apps.chatbot.views.ChatGroq") as MockChatGroq:
                # Mock successful LLM response
                mock_llm_instance = MagicMock()
                mock_llm_instance.invoke.return_value.content = "The company is healthy."
                MockChatGroq.return_value = mock_llm_instance

                request = rf.post("/chatbot/", data=valid_payload, content_type="application/json")
                response = chatbot_api_view(request)

                assert response.status_code == 200
                data = json.loads(response.content)
                assert data['answer'] == "The company is healthy."
                assert data['company_name'] == "Test Corp"

    # --- STRICT MUTANT KILLERS ---

    def test_model_selection_exhaustive_with_trap(self, rf, mock_financial_report):
        """
        Kills Mutants 42-46: We patch GROQ_DEFAULT_MODEL to a 'TRAP' value.
        If mutmut deletes a key from the dictionary, the code will fall back to 'TRAP',
        and the assertion will fail.
        """
        expected_map = {
            "extraction": "llama-3.1-8b-instant",
            "analysis": "llama-3.1-8b-instant",
            "pros_cons": "llama-3.1-8b-instant",
            "ratios": "llama-3.1-8b-instant",
            "summary": "llama-3.1-8b-instant"
        }

        # PATCH THE DEFAULT TO BE DIFFERENT TO TRAP MUTANTS
        with patch("apps.chatbot.views.GROQ_DEFAULT_MODEL", "TRAP_MODEL"):
            with patch("apps.chatbot.views.get_object_or_404", return_value=mock_financial_report):
                with patch("apps.chatbot.views.ChatGroq") as MockChatGroq:
                    MockChatGroq.return_value.invoke.return_value.content = "A"

                    for purpose, expected_model in expected_map.items():
                        data = {"question": "Q", "document_id": 123, "api_key": "K", "purpose": purpose}
                        req = rf.post("/", data=json.dumps(data).encode(), content_type="application/json")
                        
                        chatbot_api_view(req)
                        
                        _, kwargs = MockChatGroq.call_args
                        # If key was deleted, this would be "TRAP_MODEL"
                        assert kwargs['model'] == expected_model, f"Dictionary key missing for {purpose}"

                    # Also test the fallback itself!
                    data = {"question": "Q", "document_id": 123, "api_key": "K", "purpose": "unknown_purpose"}
                    req = rf.post("/", data=json.dumps(data).encode(), content_type="application/json")
                    chatbot_api_view(req)
                    _, kwargs = MockChatGroq.call_args
                    assert kwargs['model'] == "TRAP_MODEL"
    def test_context_formatting_and_fallbacks(self, rf, mock_financial_report):
        """
        Kills Mutants in prompt construction and fallback logic.
        """
        # Force get_summary to return empty so we test the getattr() fallbacks
        mock_financial_report.get_summary.return_value = {}
        mock_financial_report.pros = ["FallbackPro"]
        mock_financial_report.cons = [] # Empty cons to test "No cons found" logic
        mock_financial_report.financial_health_summary = "FallbackSummary"

        with patch("apps.chatbot.views.get_object_or_404", return_value=mock_financial_report):
            with patch("apps.chatbot.views.ChatGroq") as MockChatGroq:
                MockChatGroq.return_value.invoke.return_value.content = "Ans"
                
                data = {"question": "Q", "document_id": 123, "api_key": "K"}
                req = rf.post("/", data=json.dumps(data).encode(), content_type="application/json")
                
                chatbot_api_view(req)
                
                args, _ = MockChatGroq.return_value.invoke.call_args
                prompt = args[0]

                # Verify Fallback Data is present
                assert "- FallbackPro" in prompt
                assert "FallbackSummary" in prompt
                # Verify "No cons found" logic
                assert "No cons found." in prompt
                # Verify formatting headers
                assert "Pros:" in prompt
                assert "Cons:" in prompt

    def test_strict_config_parameters(self, rf, mock_financial_report):
        """
        Kills Mutants in ChatGroq initialization parameters.
        """
        with patch("apps.chatbot.views.get_object_or_404", return_value=mock_financial_report):
            with patch("apps.chatbot.views.ChatGroq") as MockChatGroq:
                # Fix: Ensure mock returns a string
                mock_instance = MagicMock()
                mock_instance.invoke.return_value.content = "Valid Answer"
                MockChatGroq.return_value = mock_instance

                data = {"question": "Q", "document_id": 123, "api_key": "K"}
                request = rf.post("/chatbot/", data=json.dumps(data).encode('utf-8'), content_type="application/json")
                
                chatbot_api_view(request)

                _, kwargs = MockChatGroq.call_args
                # Strict Assertions
                assert kwargs['temperature'] == 0.1
                assert kwargs['max_tokens'] == 4096
                assert kwargs['timeout'] == 60
                assert kwargs['max_retries'] == 1

    def test_prompt_pixel_perfect_match(self, rf, mock_financial_report):
        """
        Kills Mutants 70-118 (Prompt Construction).
        Reconstructs the EXACT expected string including newlines.
        """
        # 1. Setup exact data
        mock_financial_report.company_name = "ExactCorp"
        mock_financial_report.ticker_symbol = "EXCT"
        mock_financial_report.get_summary.return_value = {
            "pros": ["Pro A", "Pro B"],
            "cons": ["Con A"],
            "financial_health_summary": "Health Status."
        }
        
        # 2. Setup exact history
        history = [
            {"role": "user", "text": "UserMsg1"},
            {"role": "model", "text": "AIMsg1"}
        ]

        with patch("apps.chatbot.views.get_object_or_404", return_value=mock_financial_report):
            with patch("apps.chatbot.views.ChatGroq") as MockChatGroq:
                MockChatGroq.return_value.invoke.return_value.content = "Ans"

                data = {
                    "question": "UserQuestion", 
                    "document_id": 123, 
                    "api_key": "K",
                    "history": history
                }
                request = rf.post("/", data=json.dumps(data).encode(), content_type="application/json")
                
                chatbot_api_view(request)
                
                # 3. Build the Expected String Manually
                # This must match apps/chatbot/views.py EXACTLY
                
                # The inner context block
                expected_context = """
Company Name: ExactCorp
Ticker Symbol: EXCT

Pros:
- Pro A
- Pro B

Cons:
- Con A

Overall Financial Health Summary:
Health Status.
"""
                # The history block
                expected_history = "User: UserMsg1\nAssistant: AIMsg1"

                # The full prompt
                expected_full_prompt = (
                    "You are a helpful financial analyst assistant. Use ONLY the provided summary context. "
                    "If information is missing, state that it is unavailable. Keep responses concise and beginner-friendly.\n\n"
                    "Summary Context:\n" + expected_context + "\n\n"
                    "Conversation so far:\n" + expected_history + "\n\n"
                    "User: UserQuestion\nAssistant:"
                )

                # 4. Assert Equality
                args, _ = MockChatGroq.return_value.invoke.call_args
                actual_prompt = args[0]
                
                assert actual_prompt == expected_full_prompt
            
    def test_history_truncation_strict(self, rf, mock_financial_report):
        """
        Kills Mutants in history loop.
        Uses SAFE strings (UNIQUE_00) to avoid substring collisions in tests.
        """
        # 12 distinct messages: UNIQUE_00 ... UNIQUE_11
        history = [{"role": "user", "text": f"UNIQUE_{i:02d}"} for i in range(12)]
        
        with patch("apps.chatbot.views.get_object_or_404", return_value=mock_financial_report):
            with patch("apps.chatbot.views.ChatGroq") as MockChatGroq:
                # Fix: Ensure mock returns a string
                MockChatGroq.return_value.invoke.return_value.content = "Valid Answer"

                data = {"question": "Q", "document_id": 123, "api_key": "K", "history": history}
                req = rf.post("/", data=json.dumps(data).encode(), content_type="application/json")
                
                chatbot_api_view(req)
                
                args, _ = MockChatGroq.return_value.invoke.call_args
                prompt = args[0]

                # Messages 00 and 01 should be GONE (truncated)
                assert "UNIQUE_00" not in prompt
                assert "UNIQUE_01" not in prompt
                # Message 02 (the 10th oldest) should be there
                assert "UNIQUE_02" in prompt
                # Message 11 (the newest) should be there
                assert "UNIQUE_11" in prompt

    def test_prompt_intro_text_strict(self, rf, mock_financial_report):
        """
        Kills Mutants in the static prompt text blocks.
        """
        with patch("apps.chatbot.views.get_object_or_404", return_value=mock_financial_report):
            with patch("apps.chatbot.views.ChatGroq") as MockChatGroq:
                # Fix: Ensure mock returns a string
                MockChatGroq.return_value.invoke.return_value.content = "Valid Answer"

                data = {"question": "Q", "document_id": 123, "api_key": "K"}
                req = rf.post("/", data=json.dumps(data).encode(), content_type="application/json")
                
                chatbot_api_view(req)
                
                args, _ = MockChatGroq.return_value.invoke.call_args
                prompt = args[0]

                assert "You are a helpful financial analyst assistant." in prompt
                assert "Use ONLY the provided summary context." in prompt
                assert "If information is missing, state that it is unavailable." in prompt

    def test_api_key_priority(self, rf, monkeypatch, mock_financial_report):
        """
        Kills Mutants related to API key fetching precedence.
        """
        monkeypatch.setenv("GROQ_API_KEY", "ENV_KEY")
        with patch("apps.chatbot.views.get_object_or_404", return_value=mock_financial_report):
            with patch("apps.chatbot.views.ChatGroq") as MockChatGroq:
                # Fix: Ensure mock returns a string
                MockChatGroq.return_value.invoke.return_value.content = "Valid Answer"

                # 1. Body priority (Should win over Env)
                data = {"question": "Q", "document_id": 123, "api_key": "BODY_KEY"}
                req1 = rf.post("/", data=json.dumps(data).encode(), content_type="application/json")
                chatbot_api_view(req1)
                _, kwargs1 = MockChatGroq.call_args
                assert kwargs1['groq_api_key'] == "BODY_KEY"

                # 2. Env priority (Should be used if Body key missing)
                data_no_key = {"question": "Q", "document_id": 123}
                req2 = rf.post("/", data=json.dumps(data_no_key).encode(), content_type="application/json")
                chatbot_api_view(req2)
                _, kwargs2 = MockChatGroq.call_args
                assert kwargs2['groq_api_key'] == "ENV_KEY"

    # --- ERROR HANDLING CASES ---

    def test_missing_api_key(self, rf, monkeypatch):
        monkeypatch.setattr("apps.chatbot.views.settings", MagicMock(GROQ_API_KEY=None))
        monkeypatch.delenv("GROQ_API_KEY", raising=False)
        
        data = json.dumps({"question": "Q?", "document_id": 1}).encode("utf-8")
        request = rf.post("/chatbot/", data=data, content_type="application/json")
        
        response = chatbot_api_view(request)
        assert response.status_code == 400
        assert "Missing Groq API key" in json.loads(response.content)['error']

    def test_missing_required_fields(self, rf):
        data = json.dumps({"question": "Q?", "api_key": "key"}).encode("utf-8")
        request = rf.post("/chatbot/", data=data, content_type="application/json")
        response = chatbot_api_view(request)
        assert response.status_code == 400
        assert "Missing question or document_id" in json.loads(response.content)['error']

    def test_document_not_found_returns_404(self, rf, valid_payload):
        with patch("apps.chatbot.views.get_object_or_404") as mock_get:
            mock_get.side_effect = Http404("No FinancialReport found")
            request = rf.post("/chatbot/", data=valid_payload, content_type="application/json")
            with pytest.raises(Http404):
                chatbot_api_view(request)

    def test_groq_initialization_failure(self, rf, valid_payload):
        with patch("apps.chatbot.views.ChatGroq", side_effect=Exception("Init Failed")):
            request = rf.post("/chatbot/", data=valid_payload, content_type="application/json")
            response = chatbot_api_view(request)
            assert response.status_code == 500
            assert "Groq model initialization failed" in json.loads(response.content)['error']

    def test_groq_generation_failure(self, rf, valid_payload, mock_financial_report):
        with patch("apps.chatbot.views.get_object_or_404", return_value=mock_financial_report):
            with patch("apps.chatbot.views.ChatGroq") as MockChatGroq:
                # Init OK, but generation fails
                mock_llm_instance = MagicMock()
                mock_llm_instance.invoke.side_effect = Exception("API Timeout")
                MockChatGroq.return_value = mock_llm_instance

                request = rf.post("/chatbot/", data=valid_payload, content_type="application/json")
                response = chatbot_api_view(request)

                assert response.status_code == 500
                assert "Groq generation failed" in json.loads(response.content)['error']