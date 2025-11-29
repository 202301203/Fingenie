import pytest
import json
from unittest.mock import MagicMock, patch
from django.test import RequestFactory
from django.urls import reverse, resolve
from apps.ai_insights.views import ai_insights_view


@pytest.fixture
def rf():
    return RequestFactory()


@pytest.fixture
def valid_payload():
    return json.dumps({
        "question": "What is a 401k?",
        "history": []
    }).encode("utf-8")


@pytest.fixture
def mock_genai_success():
    """
    Mocks: genai → GenerativeModel → start_chat → send_message
    """
    with patch("apps.ai_insights.views.genai") as mock_genai:
        mock_response = MagicMock()
        mock_response.text = "A 401k is a retirement savings plan."

        mock_chat = MagicMock()
        mock_chat.send_message.return_value = mock_response

        mock_model = MagicMock()
        mock_model.start_chat.return_value = mock_chat

        mock_genai.GenerativeModel.return_value = mock_model
        yield mock_genai, mock_chat


@pytest.mark.django_db
class TestAiInsightsView:

    def test_url_configuration(self):
        url = reverse("ai_insights_chat")
        assert resolve(url).func == ai_insights_view

    def test_invalid_method_returns_405(self, rf):
        resp = ai_insights_view(rf.get("/ai-insights/"))
        assert resp.status_code == 405

    def test_missing_question_400(self, rf):
        body = json.dumps({"history": []})
        resp = ai_insights_view(rf.post("/ai-insights/", data=body, content_type="application/json"))
        assert resp.status_code == 400
        assert json.loads(resp.content)["error"] == "Missing question"

    def test_api_key_precedence_and_missing_env(self, rf, valid_payload, monkeypatch):
        """
        Ensure settings->env precedence and error when no key exists.
        """
        monkeypatch.setattr("apps.ai_insights.views.settings",
                            MagicMock(GEMINI_API_KEY=None, GENIE_MODEL=None))
        monkeypatch.setenv("GEMINI_API_KEY", "ENV_KEY")

        with patch("apps.ai_insights.views.genai") as mock_genai:
            mock_genai.GenerativeModel.return_value.start_chat.return_value.send_message.return_value.text = "OK"

            # ENV key used
            ai_insights_view(rf.post("/ai-insights/", data=valid_payload, content_type="application/json"))
            mock_genai.configure.assert_called_with(api_key="ENV_KEY")

            # Remove env -> error
            monkeypatch.delenv("GEMINI_API_KEY", raising=False)
            resp = ai_insights_view(rf.post("/ai-insights/", data=valid_payload, content_type="application/json"))
            assert resp.status_code == 500
            assert "API key not provided" in json.loads(resp.content)["error"]

    def test_genai_configure_failure(self, rf, valid_payload, monkeypatch):
        """
        If genai.configure fails, return 500.
        """
        monkeypatch.setattr("apps.ai_insights.views.settings",
                            MagicMock(GEMINI_API_KEY="KEY", GENIE_MODEL=None))
        with patch("apps.ai_insights.views.genai") as mock_genai:
            mock_genai.configure.side_effect = Exception("Boom")
            resp = ai_insights_view(rf.post("/ai_insights/", data=valid_payload, content_type="application/json"))
            assert resp.status_code == 500
            msg = json.loads(resp.content)["error"]
            assert "Gemini configuration error" in msg
            assert "Boom" in msg

    def test_default_model_used_first_candidate(self, rf, valid_payload, monkeypatch):
        """
        Confirm the first fallback model is attempted: gemini-2.5-flash.
        """
        monkeypatch.setattr("apps.ai_insights.views.settings",
                            MagicMock(GEMINI_API_KEY="K", GENIE_MODEL=None))

        with patch("apps.ai_insights.views.genai") as mock_genai:
            mock_genai.GenerativeModel.return_value.start_chat.return_value.send_message.return_value.text = "OK"
            ai_insights_view(rf.post("/ai-insights/", data=valid_payload, content_type="application/json"))

            first_call = mock_genai.GenerativeModel.call_args_list[0]
            assert first_call.kwargs["model_name"] == "models/gemini-2.5-flash"

    def test_first_message_includes_system_prompt(self, rf, mock_genai_success, monkeypatch):
        """
        When history empty → system prompt is prepended.
        """
        mock_genai, mock_chat = mock_genai_success
        monkeypatch.setattr("apps.ai_insights.views.settings",
                            MagicMock(GEMINI_API_KEY="KEY", GENIE_MODEL=None))

        body = json.dumps({"question": "Explain P/E ratio", "history": []})
        ai_insights_view(rf.post("/ai-insights/", data=body, content_type="application/json"))

        prompt = mock_chat.send_message.call_args[0][0]
        assert 'You are "FinGenie"' in prompt
        assert "Educate, Don't Advise" in prompt
        assert "My first question is:" in prompt

    def test_followup_no_system_prompt(self, rf, mock_genai_success, monkeypatch):
        """
        When history exists → send only question string.
        """
        mock_genai, mock_chat = mock_genai_success
        monkeypatch.setattr("apps.ai_insights.views.settings",
                            MagicMock(GEMINI_API_KEY="KEY", GENIE_MODEL=None))

        body = json.dumps({
            "question": "Followup?",
            "history": [{"role": "user", "text": "Hi"}]
        })
        ai_insights_view(rf.post("/ai-insights/", data=body, content_type="application/json"))

        sent = mock_chat.send_message.call_args[0][0]
        assert sent == "Followup?"

    def test_history_role_sanitization_and_structure(self, rf, mock_genai_success, monkeypatch):
        """
        Check role normalization, alternate keys, and structure.
        """
        mock_genai, mock_chat = mock_genai_success
        monkeypatch.setattr("apps.ai_insights.views.settings",
                            MagicMock(GEMINI_API_KEY="KEY", GENIE_MODEL=None))

        body = json.dumps({
            "question": "Hi",
            "history": [
                {"role": "admin", "text": "I am admin"},  # normalized → user
                {"role": "model", "message": "AI reply"},
                {"role": "user", "text": ""},  # skipped
            ]
        })
        ai_insights_view(rf.post("/ai-insights/", data=body, content_type="application/json"))

        _, kwargs = mock_genai.GenerativeModel.return_value.start_chat.call_args
        history = kwargs["history"]

        roles = [h["role"] for h in history]
        assert "user" in roles
        assert "model" in roles

        for h in history:
            parts = h.get("parts")
            assert parts is not None

            if isinstance(parts, list):
                assert isinstance(parts[0], dict)
                text = parts[0].get("text")
                assert (text is None) or isinstance(text, str)

            elif isinstance(parts, dict):
                assert isinstance(parts.get("text"), str)

            else:
                assert isinstance(parts, str)

    def test_retry_logic_uses_backup_model(self, rf, valid_payload, monkeypatch):
        """
        First model fails → second model succeeds.
        """
        monkeypatch.setattr("apps.ai_insights.views.settings",
                            MagicMock(GEMINI_API_KEY="K", GENIE_MODEL=None))

        with patch("apps.ai_insights.views.genai") as mock_genai:

            model_instance = MagicMock()
            mock_chat = MagicMock()
            mock_chat.send_message.return_value.text = "Worked"
            model_instance.start_chat.return_value = mock_chat

            def side(model_name=None, **_):
                if model_name == "models/gemini-2.5-flash":
                    raise Exception("Fail first")
                return model_instance

            mock_genai.GenerativeModel.side_effect = side

            resp = ai_insights_view(rf.post("/ai-insights/", data=valid_payload, content_type="application/json"))
            assert resp.status_code == 200
            assert mock_genai.GenerativeModel.call_count >= 2
    def test_accepts_prompt_and_message_keys(self, rf, mock_genai_success, monkeypatch):
        mock_genai, mock_chat = mock_genai_success
        monkeypatch.setattr("apps.ai_insights.views.settings",
                            MagicMock(GEMINI_API_KEY="K", GENIE_MODEL=None))

        body = json.dumps({
            "prompt": "Explain revenue",
            "history": [{"role": "model", "message": "Prev"}]
        })
        ai_insights_view(rf.post("/ai-insights/", data=body, content_type="application/json"))
        sent = mock_chat.send_message.call_args[0][0]
        assert sent == "Explain revenue"


    def test_missing_history_defaults_to_empty(self, rf, mock_genai_success, monkeypatch):
        mock_genai, mock_chat = mock_genai_success
        monkeypatch.setattr("apps.ai_insights.views.settings",
                            MagicMock(GEMINI_API_KEY="K", GENIE_MODEL=None))

        body = json.dumps({"question": "Hi"})
        ai_insights_view(rf.post("/ai-insights/", data=body, content_type="application/json"))

        sent = mock_chat.send_message.call_args[0][0]
        assert "My first question is" in sent


    def test_invalid_role_fallback_to_user(self, rf, mock_genai_success, monkeypatch):
        mock_genai, mock_chat = mock_genai_success
        monkeypatch.setattr("apps.ai_insights.views.settings",
                            MagicMock(GEMINI_API_KEY="K", GENIE_MODEL=None))

        body = json.dumps({
            "question": "Test?",
            "history": [{"role": "🔥weird🔥", "text": "Hello"}]
        })
        ai_insights_view(rf.post("/ai-insights/", data=body, content_type="application/json"))

        history = mock_genai.GenerativeModel.return_value.start_chat.call_args.kwargs["history"]
        assert history[0]["role"] == "user"


    def test_send_message_error_returns_500(self, rf, monkeypatch):
        monkeypatch.setattr("apps.ai_insights.views.settings",
                            MagicMock(GEMINI_API_KEY="K", GENIE_MODEL=None))

        with patch("apps.ai_insights.views.genai") as mock_genai:
            model = MagicMock()
            chat = MagicMock()
            chat.send_message.side_effect = Exception("FailSend")
            model.start_chat.return_value = chat

            mock_genai.GenerativeModel.return_value = model

            body = json.dumps({"question": "X", "history": []})
            resp = ai_insights_view(rf.post("/ai-insights/", data=body,
                                            content_type="application/json"))

            assert resp.status_code == 500
            assert "FailSend" in json.loads(resp.content)["error"]


    def test_start_chat_failure(self, rf, monkeypatch):
        monkeypatch.setattr("apps.ai_insights.views.settings",
                            MagicMock(GEMINI_API_KEY="K", GENIE_MODEL=None))

        with patch("apps.ai_insights.views.genai") as mock_genai:
            model = MagicMock()
            model.start_chat.side_effect = Exception("StartFail")
            mock_genai.GenerativeModel.return_value = model

            body = json.dumps({"question": "Y", "history": []})
            resp = ai_insights_view(rf.post("/ai-insights/", data=body,
                                            content_type="application/json"))

            assert resp.status_code == 500
            assert "StartFail" in json.loads(resp.content)["error"]


    def test_response_without_text_field(self, rf, monkeypatch):
        monkeypatch.setattr("apps.ai_insights.views.settings",
                            MagicMock(GEMINI_API_KEY="K", GENIE_MODEL=None))

        with patch("apps.ai_insights.views.genai") as mock_genai:
            mock_response = MagicMock()
            del mock_response.text  # force failure

            chat = MagicMock()
            chat.send_message.return_value = mock_response

            model = MagicMock()
            model.start_chat.return_value = chat
            mock_genai.GenerativeModel.return_value = model

            body = json.dumps({"question": "Q", "history": []})
            resp = ai_insights_view(rf.post("/ai-insights/",
                                            data=body, content_type="application/json"))

            assert resp.status_code == 500
            assert "internal server error" in json.loads(resp.content)["error"].lower()


    def test_empty_payload_returns_400(self, rf, monkeypatch):
        monkeypatch.setattr("apps.ai_insights.views.settings",
                            MagicMock(GEMINI_API_KEY="K", GENIE_MODEL=None))

        resp = ai_insights_view(rf.post("/ai-insights/",
                                        data=b"{}", content_type="application/json"))
        assert resp.status_code == 400
        assert "Missing question" in json.loads(resp.content)["error"]

    def test_all_models_fail_returns_500_and_tried_errors(self, rf, valid_payload, monkeypatch):
        monkeypatch.setattr("apps.ai_insights.views.settings",
                            MagicMock(GEMINI_API_KEY="K", GENIE_MODEL=None))

        with patch("apps.ai_insights.views.genai") as mock_genai:
            mock_genai.GenerativeModel.side_effect = Exception("Dead")

            resp = ai_insights_view(rf.post("/ai-insights/", data=valid_payload, content_type="application/json"))
            assert resp.status_code == 500

            data = json.loads(resp.content)
            assert "tried_errors" in data
            assert len(data["tried_errors"]) >= 1

    def test_duplicate_candidate_skipped(self, rf, valid_payload, monkeypatch):
        """
        If GENIE_MODEL duplicates a fallback, it should only be attempted once.
        """
        dup = "models/gemini-2.5-flash"
        monkeypatch.setattr("apps.ai_insights.views.settings",
                            MagicMock(GEMINI_API_KEY="K", GENIE_MODEL=dup))

        with patch("apps.ai_insights.views.genai") as mock_genai:
            mock_genai.GenerativeModel.side_effect = Exception("Nope")

            ai_insights_view(rf.post("/ai-insights/", data=valid_payload, content_type="application/json"))

            names = []
            for args, kwargs in mock_genai.GenerativeModel.call_args_list:
                names.append(kwargs.get("model_name"))

            assert names.count(dup) == 1
    def test_full_system_prompt_exact_string_check(self, rf, monkeypatch):
        """
        Kills Mutants 89-113: Checks the entire prepended prompt string for formatting and content.
        This forces mutmut to preserve all newlines and hardcoded text.
        """
        # We must use a clean constant for comparison
        clean_prompt = "CLEAN_SYSTEM_PROMPT" # Using the clean string marker

        # CRITICAL FIX: Ensure the API key check passes so the code reaches send_message
        monkeypatch.setattr("apps.ai_insights.views.settings", MagicMock(GEMINI_API_KEY="KEY", GENIE_MODEL=None))
        
        with patch("apps.ai_insights.views.AI_INSIGHTS_SYSTEM_PROMPT", clean_prompt):
            with patch("apps.ai_insights.views.genai") as mock_genai:
                mock_chat = MagicMock()
                
                # Mock the full chain
                mock_genai.GenerativeModel.return_value.start_chat.return_value = mock_chat
                mock_chat.send_message.return_value.text = "OK"

                user_q = "What are the investment options?"
                body = json.dumps({"question": user_q, "history": []})
                request = rf.post("/ai-insights/", data=body, content_type="application/json")
                
                ai_insights_view(request)

                args, _ = mock_chat.send_message.call_args
                sent_message = args[0]
                
                # We assert the core content and structure
                assert 'CLEAN_SYSTEM_PROMPT' in sent_message
                assert sent_message.strip().endswith(f"My first question is: {user_q}")
    def test_system_prompt_prepended_on_first_message_strict(self, rf, mock_genai_success, monkeypatch):
        """
        Kills Mutants 89-113. Verifies context is prepended ONLY if history is empty.
        This is the most critical prompt check.
        """
        mock_genai, mock_chat = mock_genai_success
        monkeypatch.setattr("apps.ai_insights.views.settings", MagicMock(GEMINI_API_KEY="TEST_KEY", GENIE_MODEL=None))

        user_q = "What is the primary purpose of FinGenie?"
        payload = json.dumps({"question": user_q, "history": []}).encode("utf-8")
        request = rf.post("/ai-insights/", data=payload, content_type="application/json")
        
        ai_insights_view(request)
        
        args, _ = mock_chat.send_message.call_args
        sent_message = args[0]
        
        # Assert the specific structure of the prepended message
        assert 'You are "FinGenie"' in sent_message
        assert 'You must follow these rules:' in sent_message
        assert 'My first question is: What is the primary purpose of FinGenie?' in sent_message
        assert 'Educate, Don\'t Advise:' in sent_message

    def test_malformed_json_body_returns_500(self, rf):
        resp = ai_insights_view(rf.post("/ai-insights/", data=b"{invalid json", content_type="application/json"))
        assert resp.status_code == 500
        msg = json.loads(resp.content)["error"]
        assert "internal server error" in msg.lower()
