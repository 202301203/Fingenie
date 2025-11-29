import pytest
import json
from unittest.mock import patch, MagicMock
from django.http import HttpRequest
from django.utils import timezone
from django.conf import settings

# Import the model so we can use the ACTUAL DoesNotExist exception
from apps.learning.models import DailyTopic
from apps.learning.views import get_daily_topic_view

@pytest.mark.usefixtures("django_db_setup", "django_db_blocker")
class TestGetDailyTopicView:
    
    # --- HAPPY PATHS ---

    @pytest.mark.happy_path
    def test_returns_cached_topic_if_exists(self, mocker):
        """
        Test: If today's topic exists in DB, returns it with status 200.
        """
        today = timezone.now().date()
        mock_topic = MagicMock()
        mock_topic.to_dict.return_value = {
            "term": "P/E Ratio",
            "explanation": "Price/Earnings ratio explained.",
            "question": "What does P/E ratio measure?",
            "options": ["Profit", "Earnings", "Price", "Ratio"],
            "correct_answer": "Earnings",
            "answer_explanation": "It measures earnings."
        }
        
        # Mock the DB get call
        mocker.patch("apps.learning.views.DailyTopic.objects.get", return_value=mock_topic)
        
        request = HttpRequest()
        request.method = "GET"

        response = get_daily_topic_view(request)
        
        assert response.status_code == 200
        assert json.loads(response.content) == mock_topic.to_dict.return_value

    @pytest.mark.happy_path
    def test_creates_new_topic_and_saves_to_db(self, mocker):
        """
        Test: If no topic exists, generates new topic via GenAI, saves, returns with status 201.
        """
        mocker.patch("apps.learning.views.DailyTopic.objects.get", side_effect=DailyTopic.DoesNotExist)
        
        last_topic = MagicMock(term="P/E Ratio")
        mocker.patch("apps.learning.views.DailyTopic.objects.order_by", return_value=MagicMock(first=MagicMock(return_value=last_topic)))
        mocker.patch("apps.learning.views.settings", GEMINI_API_KEY="FAKE_KEY")
        mocker.patch("apps.learning.views.genai.configure")
        
        mock_model = MagicMock()
        response_data = {
            "term": "Compounding Interest",
            "explanation": "Interest on interest.",
            "question": "What is compounding interest?",
            "options": ["Simple", "Compound", "Interest", "Rate"],
            "correct_answer": "Compound",
            "answer_explanation": "It is compound."
        }
        mock_response = MagicMock(text=json.dumps(response_data))
        mock_model.generate_content.return_value = mock_response
        mocker.patch("apps.learning.views.genai.GenerativeModel", return_value=mock_model)
        
        mock_topic = MagicMock()
        mock_topic.to_dict.return_value = response_data
        mocker.patch("apps.learning.views.DailyTopic.objects.create", return_value=mock_topic)

        request = HttpRequest()
        request.method = "POST"
        
        response = get_daily_topic_view(request)
        
        assert response.status_code == 201
        assert json.loads(response.content) == response_data

    @pytest.mark.happy_path
    def test_post_method_works_like_get(self, mocker):
        mock_topic = MagicMock()
        mock_topic.to_dict.return_value = {"term": "P/E Ratio"}
        mocker.patch("apps.learning.views.DailyTopic.objects.get", return_value=mock_topic)
        
        request = HttpRequest()
        request.method = "POST"

        response = get_daily_topic_view(request)
        assert response.status_code == 200
        assert json.loads(response.content) == mock_topic.to_dict.return_value

    @pytest.mark.happy_path
    def test_genai_is_configured_with_correct_key(self, mocker):
        """Kills COD [53]: Verifies that genai.configure() is actually called."""
        mocker.patch("apps.learning.views.DailyTopic.objects.get", side_effect=DailyTopic.DoesNotExist)
        mock_qs = MagicMock()
        mock_qs.first.return_value = None
        mocker.patch("apps.learning.views.DailyTopic.objects.order_by", return_value=mock_qs)
        mocker.patch("apps.learning.views.settings", GEMINI_API_KEY="TEST_SECRET_KEY")
        
        mock_configure = mocker.patch("apps.learning.views.genai.configure")
        
        mock_model = MagicMock()
        mock_model.generate_content.return_value = MagicMock(text='{"term": "X", "explanation": "Y", "question": "Q", "options": ["O"], "correct_answer": "O", "answer_explanation": "A"}')
        mocker.patch("apps.learning.views.genai.GenerativeModel", return_value=mock_model)
        mocker.patch("apps.learning.views.DailyTopic.objects.create")

        request = HttpRequest()
        request.method = "POST"
        get_daily_topic_view(request)

        mock_configure.assert_called_once_with(api_key="TEST_SECRET_KEY")

    @pytest.mark.happy_path
    def test_loop_breaks_immediately_after_success(self, mocker):
        """Kills COD [126]: Verifies that we stop looping (break) as soon as one model works."""
        mocker.patch("apps.learning.views.DailyTopic.objects.get", side_effect=DailyTopic.DoesNotExist)
        mock_qs = MagicMock()
        mock_qs.first.return_value = None
        mocker.patch("apps.learning.views.DailyTopic.objects.order_by", return_value=mock_qs)
        mocker.patch("apps.learning.views.settings", GEMINI_API_KEY="KEY")
        mocker.patch("apps.learning.views.genai.configure")
        mocker.patch("apps.learning.views.DailyTopic.objects.create")

        mock_model_class = mocker.patch("apps.learning.views.genai.GenerativeModel")
        
        mock_instance = MagicMock()
        mock_instance.generate_content.return_value = MagicMock(text='{"term": "X", "explanation": "Y", "question": "Q", "options": ["O"], "correct_answer": "O", "answer_explanation": "A"}')
        mock_model_class.return_value = mock_instance

        request = HttpRequest()
        request.method = "POST"
        get_daily_topic_view(request)

        assert mock_instance.generate_content.call_count == 1

    @pytest.mark.happy_path
    def test_prompt_includes_avoid_instruction_if_last_topic_exists(self, mocker):
        """Kills COI [75]: Verifies the prompt explicitly tells AI to avoid the previous term."""
        mocker.patch("apps.learning.views.DailyTopic.objects.get", side_effect=DailyTopic.DoesNotExist)
        
        mock_last_topic = MagicMock()
        mock_last_topic.term = "Forbidden Term"
        mock_qs = MagicMock()
        mock_qs.first.return_value = mock_last_topic
        mocker.patch("apps.learning.views.DailyTopic.objects.order_by", return_value=mock_qs)

        mocker.patch("apps.learning.views.settings", GEMINI_API_KEY="KEY")
        mocker.patch("apps.learning.views.genai.configure")
        mocker.patch("apps.learning.views.DailyTopic.objects.create")

        mock_model = MagicMock()
        mock_model.generate_content.return_value = MagicMock(text='{"term": "Y", "explanation": "E", "question": "Q", "options": ["O"], "correct_answer": "O", "answer_explanation": "A"}')
        mocker.patch("apps.learning.views.genai.GenerativeModel", return_value=mock_model)

        request = HttpRequest()
        request.method = "POST"
        get_daily_topic_view(request)

        args, _ = mock_model.generate_content.call_args
        sent_prompt = args[0]
        
        assert "Do NOT generate the term 'Forbidden Term'" in sent_prompt

    @pytest.mark.happy_path
    def test_schema_definition_is_strictly_enforced(self, mocker):
        """Kills Mutants 1-32: Verifies that the exact schema structure is passed."""
        mocker.patch("apps.learning.views.DailyTopic.objects.get", side_effect=DailyTopic.DoesNotExist)
        
        # Mock .first() correctly as a callable returning None
        mock_qs = MagicMock()
        mock_qs.first.return_value = None
        mocker.patch("apps.learning.views.DailyTopic.objects.order_by", return_value=mock_qs)

        mocker.patch("apps.learning.views.settings", GEMINI_API_KEY="KEY")
        mocker.patch("apps.learning.views.genai.configure")
        mocker.patch("apps.learning.views.DailyTopic.objects.create")

        mock_model_cls = mocker.patch("apps.learning.views.genai.GenerativeModel")
        mock_instance = MagicMock()
        mock_instance.generate_content.return_value = MagicMock(text='{"term": "A", "explanation": "B", "question": "C", "options": ["D"], "correct_answer": "D", "answer_explanation": "E"}')
        mock_model_cls.return_value = mock_instance

        request = HttpRequest()
        request.method = "POST"
        get_daily_topic_view(request)

        expected_schema = {
            "type": "OBJECT",
            "properties": {
                "term": {"type": "STRING"},
                "explanation": {"type": "STRING"},
                "question": {"type": "STRING"},
                "options": {
                    "type": "ARRAY",
                    "items": {"type": "STRING"}
                },
                "correct_answer": {"type": "STRING"},
                "answer_explanation": {"type": "STRING"}
            },
            "required": ["term", "explanation", "question", "options", "correct_answer", "answer_explanation"]
        }

        _, kwargs = mock_model_cls.call_args
        actual_schema = kwargs['generation_config']['response_schema']
        assert actual_schema == expected_schema

    @pytest.mark.happy_path
    def test_database_mapping_is_correct(self, mocker):
        """Kills Mutants 136-141: Ensures JSON keys map to correct DB columns."""
        mocker.patch("apps.learning.views.DailyTopic.objects.get", side_effect=DailyTopic.DoesNotExist)
        mock_qs = MagicMock()
        mock_qs.first.return_value = None
        mocker.patch("apps.learning.views.DailyTopic.objects.order_by", return_value=mock_qs)
        mocker.patch("apps.learning.views.settings", GEMINI_API_KEY="KEY")
        mocker.patch("apps.learning.views.genai.configure")
        
        unique_data = {
            "term": "UNIQUE_TERM", "explanation": "UNIQUE_EXPL", "question": "UNIQUE_QUEST",
            "options": ["OPT1", "OPT2"], "correct_answer": "OPT1", "answer_explanation": "UNIQUE_ANS_EXPL"
        }
        
        mock_model = MagicMock()
        mock_model.generate_content.return_value = MagicMock(text=json.dumps(unique_data))
        mocker.patch("apps.learning.views.genai.GenerativeModel", return_value=mock_model)
        
        mock_create = mocker.patch("apps.learning.views.DailyTopic.objects.create")

        request = HttpRequest()
        request.method = "POST"
        get_daily_topic_view(request)

        mock_create.assert_called_once_with(
            date=timezone.now().date(),
            term="UNIQUE_TERM",
            explanation="UNIQUE_EXPL",
            question="UNIQUE_QUEST",
            options=["OPT1", "OPT2"],
            correct_answer="OPT1",
            answer_explanation="UNIQUE_ANS_EXPL"
        )

    @pytest.mark.happy_path
    def test_prompt_content_requirements(self, mocker):
        """Kills Mutants 88-92: Verifies strict instructions in prompt."""
        mocker.patch("apps.learning.views.DailyTopic.objects.get", side_effect=DailyTopic.DoesNotExist)
        mock_qs = MagicMock()
        mock_qs.first.return_value = None
        mocker.patch("apps.learning.views.DailyTopic.objects.order_by", return_value=mock_qs)
        mocker.patch("apps.learning.views.settings", GEMINI_API_KEY="KEY")
        mocker.patch("apps.learning.views.genai.configure")
        mocker.patch("apps.learning.views.DailyTopic.objects.create")

        mock_model = MagicMock()
        mock_model.generate_content.return_value = MagicMock(text='{"term": "A", "explanation": "B", "question": "C", "options": ["D"], "correct_answer": "D", "answer_explanation": "E"}')
        mocker.patch("apps.learning.views.genai.GenerativeModel", return_value=mock_model)

        request = HttpRequest()
        request.method = "POST"
        get_daily_topic_view(request)

        args, _ = mock_model.generate_content.call_args
        prompt_sent = args[0]

        assert "Financial Topic of the Day" in prompt_sent
        assert "common financial ratio" in prompt_sent
        assert "concise" in prompt_sent
        assert "under 100 words" in prompt_sent
        assert "exactly 4" in prompt_sent

    @pytest.mark.happy_path
    def test_prompt_is_clean_when_no_previous_topic_exists(self, mocker):
        """Kills Mutants 73-76: Verifies 'avoid_instruction' logic is not hardcoded."""
        mocker.patch("apps.learning.views.DailyTopic.objects.get", side_effect=DailyTopic.DoesNotExist)
        
        mock_qs = MagicMock()
        mock_qs.first.return_value = None # No previous topic
        mocker.patch("apps.learning.views.DailyTopic.objects.order_by", return_value=mock_qs)

        mocker.patch("apps.learning.views.settings", GEMINI_API_KEY="KEY")
        mocker.patch("apps.learning.views.genai.configure")
        mocker.patch("apps.learning.views.DailyTopic.objects.create")

        mock_model = MagicMock()
        mock_model.generate_content.return_value = MagicMock(text='{"term": "A", "explanation": "B", "question": "C", "options": ["D"], "correct_answer": "D", "answer_explanation": "E"}')
        mocker.patch("apps.learning.views.genai.GenerativeModel", return_value=mock_model)

        request = HttpRequest()
        request.method = "POST"
        get_daily_topic_view(request)

        args, _ = mock_model.generate_content.call_args
        sent_prompt = args[0]
        assert "Do NOT generate the term" not in sent_prompt

    @pytest.mark.edge_case
    def test_api_key_prioritizes_settings_over_env(self, mocker):
        """Kills Mutants 54-61: Ensures settings.GEMINI_API_KEY is checked BEFORE os.environ."""
        mocker.patch("apps.learning.views.DailyTopic.objects.get", side_effect=DailyTopic.DoesNotExist)
        
        # Mock .first() correctly as a callable returning None
        mock_qs = MagicMock()
        mock_qs.first.return_value = None
        mocker.patch("apps.learning.views.DailyTopic.objects.order_by", return_value=mock_qs)

        mocker.patch("apps.learning.views.settings", GEMINI_API_KEY="SETTINGS_KEY")
        mocker.patch.dict("os.environ", {"GEMINI_API_KEY": "ENV_KEY"})
        
        mock_configure = mocker.patch("apps.learning.views.genai.configure")
        
        mock_model = MagicMock()
        mock_model.generate_content.return_value = MagicMock(text='{"term": "A", "explanation": "B", "question": "C", "options": ["D"], "correct_answer": "D", "answer_explanation": "E"}')
        mocker.patch("apps.learning.views.genai.GenerativeModel", return_value=mock_model)
        mocker.patch("apps.learning.views.DailyTopic.objects.create")

        request = HttpRequest()
        request.method = "POST"
        get_daily_topic_view(request)

        mock_configure.assert_called_with(api_key="SETTINGS_KEY")
    
    @pytest.mark.happy_path
    def test_prompt_formatting_matches_exact_template(self, mocker):
        """Kills Mutants 88-92: Checks exact formatting (newlines, indentation)."""
        mocker.patch("apps.learning.views.DailyTopic.objects.get", side_effect=DailyTopic.DoesNotExist)
        
        # Mock .first() correctly as a callable returning None
        mock_qs = MagicMock()
        mock_qs.first.return_value = None
        mocker.patch("apps.learning.views.DailyTopic.objects.order_by", return_value=mock_qs)

        mocker.patch("apps.learning.views.settings", GEMINI_API_KEY="KEY")
        mocker.patch("apps.learning.views.genai.configure")
        mocker.patch("apps.learning.views.DailyTopic.objects.create")

        mock_model = MagicMock()
        mock_model.generate_content.return_value = MagicMock(text='{"term": "A", "explanation": "B", "question": "C", "options": ["D"], "correct_answer": "D", "answer_explanation": "E"}')
        mocker.patch("apps.learning.views.genai.GenerativeModel", return_value=mock_model)

        request = HttpRequest()
        request.method = "POST"
        get_daily_topic_view(request)

        args, _ = mock_model.generate_content.call_args
        actual_prompt = args[0]
        
        expected_fragment = """
    Generate a new "Financial Topic of the Day".
    It should be about a common financial ratio, accounting basic, or investment metric.
    
    - Keep the "term" concise (e.g., "P/E Ratio", "Compounding Interest").
    - Keep the "explanation" simple, under 100 words.
    - Create one multiple-choice "question".
    - Provide exactly 4 "options".
    - "correct_answer" must match one option exactly.
    - "answer_explanation": brief reason why it's correct.
    """
        assert expected_fragment.strip() in actual_prompt.strip()

    @pytest.mark.happy_path
    def test_creation_status_is_explicitly_201(self, mocker):
        """Kills Mutant 145: Ensures we return HTTP 201 Created."""
        mocker.patch("apps.learning.views.DailyTopic.objects.get", side_effect=DailyTopic.DoesNotExist)
        
        mock_qs = MagicMock()
        mock_qs.first.return_value = None
        mocker.patch("apps.learning.views.DailyTopic.objects.order_by", return_value=mock_qs)

        mocker.patch("apps.learning.views.settings", GEMINI_API_KEY="KEY")
        mocker.patch("apps.learning.views.genai.configure")
        
        mock_model = MagicMock()
        mock_model.generate_content.return_value = MagicMock(text='{"term": "A", "explanation": "B", "question": "C", "options": ["D"], "correct_answer": "D", "answer_explanation": "E"}')
        mocker.patch("apps.learning.views.genai.GenerativeModel", return_value=mock_model)
        
        mock_topic = MagicMock()
        mock_topic.to_dict.return_value = {}
        mocker.patch("apps.learning.views.DailyTopic.objects.create", return_value=mock_topic)

        request = HttpRequest()
        request.method = "POST"
        response = get_daily_topic_view(request)

        assert response.status_code == 201
        assert response.status_code != 200
    
    @pytest.mark.happy_path
    def test_model_instantiated_with_json_mime_type(self, mocker):
        """Kills Mutant 115: Verifies model is configured for JSON mode."""
        mocker.patch("apps.learning.views.DailyTopic.objects.get", side_effect=DailyTopic.DoesNotExist)
        
        mock_qs = MagicMock()
        mock_qs.first.return_value = None
        mocker.patch("apps.learning.views.DailyTopic.objects.order_by", return_value=mock_qs)

        mocker.patch("apps.learning.views.settings", GEMINI_API_KEY="KEY")
        mocker.patch("apps.learning.views.genai.configure")
        mocker.patch("apps.learning.views.DailyTopic.objects.create")
        
        mock_cls = mocker.patch("apps.learning.views.genai.GenerativeModel")
        mock_instance = MagicMock()
        mock_instance.generate_content.return_value = MagicMock(text='{}')
        mock_cls.return_value = mock_instance

        request = HttpRequest()
        request.method = "POST"
        get_daily_topic_view(request)

        _, kwargs = mock_cls.call_args
        assert kwargs['generation_config']['response_mime_type'] == 'application/json'

    # --- EDGE CASES ---

    @pytest.mark.edge_case
    def test_put_method_is_strictly_forbidden(self):
        """Kills Mutant on Line 37"""
        request = HttpRequest()
        request.method = "PUT"
        response = get_daily_topic_view(request)
        
        assert response.status_code == 405
        assert json.loads(response.content) == {'error': 'Invalid method'}

    @pytest.mark.edge_case
    def test_invalid_method_returns_405(self):
        request = HttpRequest()
        request.method = "PUT"
        response = get_daily_topic_view(request)
        assert response.status_code == 405
        assert json.loads(response.content)["error"] == "Invalid method"

    @pytest.mark.edge_case
    def test_missing_api_key_returns_500(self, mocker):
        mocker.patch("apps.learning.views.DailyTopic.objects.get", side_effect=DailyTopic.DoesNotExist)
        mocker.patch("apps.learning.views.DailyTopic.objects.order_by", return_value=MagicMock(first=MagicMock(return_value=None)))
        mocker.patch("apps.learning.views.settings", GEMINI_API_KEY=None)
        mocker.patch("apps.learning.views.os.environ.get", return_value=None)
        
        request = HttpRequest()
        request.method = "GET"
        
        response = get_daily_topic_view(request)
        assert response.status_code == 500
        assert "API key not provided" in json.loads(response.content)["error"]

    @pytest.mark.edge_case
    def test_models_are_tried_in_specific_order(self, mocker):
        """Kills COD mutants in candidate list."""
        mocker.patch("apps.learning.views.DailyTopic.objects.get", side_effect=DailyTopic.DoesNotExist)
        mocker.patch("apps.learning.views.DailyTopic.objects.order_by", return_value=MagicMock(first=MagicMock(return_value=None)))
        mocker.patch("apps.learning.views.settings", GEMINI_API_KEY="KEY")
        mocker.patch("apps.learning.views.genai.configure")

        mock_cls = mocker.patch("apps.learning.views.genai.GenerativeModel")
        mock_instance = MagicMock()
        mock_instance.generate_content.side_effect = Exception("Fail")
        mock_cls.return_value = mock_instance

        request = HttpRequest()
        request.method = "POST"
        get_daily_topic_view(request)

        expected_calls = [
            'models/gemini-2.5-flash', 'models/gemini-2.5-pro', 'models/gemini-flash-latest',
            'models/gemini-pro-latest', 'models/gemini-1.5-flash'
        ]
        call_args = [call.kwargs['model_name'] for call in mock_cls.call_args_list]
        assert call_args == expected_calls

    @pytest.mark.edge_case
    def test_genai_configure_raises_exception(self, mocker):
        mocker.patch("apps.learning.views.DailyTopic.objects.get", side_effect=DailyTopic.DoesNotExist)
        mocker.patch("apps.learning.views.DailyTopic.objects.order_by", return_value=MagicMock(first=MagicMock(return_value=None)))
        mocker.patch("apps.learning.views.settings", GEMINI_API_KEY="FAKE_KEY")
        mocker.patch("apps.learning.views.genai.configure", side_effect=Exception("Config error"))
        
        request = HttpRequest()
        request.method = "GET"
        
        response = get_daily_topic_view(request)
        assert response.status_code == 500
        assert "Gemini configuration error" in json.loads(response.content)["error"]

    @pytest.mark.edge_case
    def test_all_models_fail_returns_500(self, mocker):
        mocker.patch("apps.learning.views.DailyTopic.objects.get", side_effect=DailyTopic.DoesNotExist)
        mocker.patch("apps.learning.views.DailyTopic.objects.order_by", return_value=MagicMock(first=MagicMock(return_value=None)))
        mocker.patch("apps.learning.views.settings", GEMINI_API_KEY="FAKE_KEY")
        mocker.patch("apps.learning.views.genai.configure")
        
        def gen_model_side_effect(*args, **kwargs):
            raise Exception("Model error")
        mocker.patch("apps.learning.views.genai.GenerativeModel", side_effect=gen_model_side_effect)
        
        request = HttpRequest()
        request.method = "GET"
        
        response = get_daily_topic_view(request)
        assert response.status_code == 500
        assert "All models failed" in json.loads(response.content)["error"]

    @pytest.mark.edge_case
    def test_ai_returns_invalid_json(self, mocker):
        mocker.patch("apps.learning.views.DailyTopic.objects.get", side_effect=DailyTopic.DoesNotExist)
        mocker.patch("apps.learning.views.DailyTopic.objects.order_by", return_value=MagicMock(first=MagicMock(return_value=None)))
        mocker.patch("apps.learning.views.settings", GEMINI_API_KEY="FAKE_KEY")
        mocker.patch("apps.learning.views.genai.configure")
        
        mock_model1 = MagicMock()
        mock_model1.generate_content.return_value = MagicMock(text="not a json")
        mock_model2 = MagicMock()
        valid_data = {
            "term": "Liquidity Ratio", "explanation": "Measures liquidity.", "question": "What is liquidity ratio?",
            "options": ["Liquidity", "Ratio", "Asset", "Debt"], "correct_answer": "Liquidity", "answer_explanation": "It measures liquidity."
        }
        mock_model2.generate_content.return_value = MagicMock(text=json.dumps(valid_data))
        
        def gen_model_side_effect(model_name, **kwargs):
            if "flash" in model_name: return mock_model1
            else: return mock_model2
        mocker.patch("apps.learning.views.genai.GenerativeModel", side_effect=gen_model_side_effect)
        
        mock_topic = MagicMock()
        mock_topic.to_dict.return_value = valid_data
        mocker.patch("apps.learning.views.DailyTopic.objects.create", return_value=mock_topic)
        
        request = HttpRequest()
        request.method = "GET"
        
        response = get_daily_topic_view(request)
        assert response.status_code == 201
        assert json.loads(response.content) == valid_data

    @pytest.mark.edge_case
    def test_ai_returns_answer_not_in_options(self, mocker):
        mocker.patch("apps.learning.views.DailyTopic.objects.get", side_effect=DailyTopic.DoesNotExist)
        mocker.patch("apps.learning.views.DailyTopic.objects.order_by", return_value=MagicMock(first=MagicMock(return_value=None)))
        mocker.patch("apps.learning.views.settings", GEMINI_API_KEY="FAKE_KEY")
        mocker.patch("apps.learning.views.genai.configure")
        
        mock_model1 = MagicMock()
        bad_data = {
            "term": "Bad Ratio", "explanation": "Bad.", "question": "Bad?",
            "options": ["A", "B", "C", "D"], "correct_answer": "Z", "answer_explanation": "Bad."
        }
        mock_model1.generate_content.return_value = MagicMock(text=json.dumps(bad_data))
        
        mock_model2 = MagicMock()
        good_data = {
            "term": "Good Ratio", "explanation": "Good.", "question": "Good?",
            "options": ["A", "B", "C", "D"], "correct_answer": "A", "answer_explanation": "Good."
        }
        mock_model2.generate_content.return_value = MagicMock(text=json.dumps(good_data))
        
        def gen_model_side_effect(model_name, **kwargs):
            if "flash" in model_name: return mock_model1
            else: return mock_model2
        mocker.patch("apps.learning.views.genai.GenerativeModel", side_effect=gen_model_side_effect)
        
        mock_topic = MagicMock()
        mock_topic.to_dict.return_value = good_data
        mocker.patch("apps.learning.views.DailyTopic.objects.create", return_value=mock_topic)
        
        request = HttpRequest()
        request.method = "GET"
        
        response = get_daily_topic_view(request)
        assert response.status_code == 201
        assert json.loads(response.content) == good_data

    @pytest.mark.edge_case
    def test_api_key_fallback_to_env_var(self, mocker):
        """
        Test: If settings.GEMINI_API_KEY is missing/None, view falls back to os.environ.
        """
        # 1. Setup minimal mocks to get past the DB check
        mocker.patch("apps.learning.views.DailyTopic.objects.get", side_effect=DailyTopic.DoesNotExist)
        
        # --- FIX START ---
        # We create a mock queryset and explicitly set .first() to return None
        mock_qs = MagicMock()
        mock_qs.first.return_value = None 
        mocker.patch("apps.learning.views.DailyTopic.objects.order_by", return_value=mock_qs)
        # --- FIX END ---

        # 2. Force settings to return None, but os.environ to return a key
        mocker.patch("apps.learning.views.settings", GEMINI_API_KEY=None)
        mocker.patch.dict("os.environ", {"GEMINI_API_KEY": "ENV_VAR_KEY_123"})

        # 3. Verify genai.configure receives the ENV key
        mock_configure = mocker.patch("apps.learning.views.genai.configure")

        # (Mock the rest so the view doesn't crash)
        mock_model = MagicMock()
        mock_model.generate_content.return_value = MagicMock(text='{"term": "T", "explanation": "E", "question": "Q", "options": ["O"], "correct_answer": "O", "answer_explanation": "A"}')
        mocker.patch("apps.learning.views.genai.GenerativeModel", return_value=mock_model)
        mocker.patch("apps.learning.views.DailyTopic.objects.create")

        # Act
        request = HttpRequest()
        request.method = "POST"
        get_daily_topic_view(request)

        # Assert
        mock_configure.assert_called_with(api_key="ENV_VAR_KEY_123")
    @pytest.mark.edge_case
    def test_ai_returns_empty_response_text(self, mocker):
        """
        Test: If AI returns empty text, it raises ValueError (caught by try/except) and tries next model.
        """
        # 1. Setup DB mocks
        mocker.patch("apps.learning.views.DailyTopic.objects.get", side_effect=DailyTopic.DoesNotExist)
        
        # FIX: Create a mock queryset where .first() is a CALLABLE that returns None
        # (Previous error was because we set .first = None, which isn't callable)
        mock_qs = MagicMock()
        mock_qs.first.return_value = None 
        mocker.patch("apps.learning.views.DailyTopic.objects.order_by", return_value=mock_qs)
        
        mocker.patch("apps.learning.views.settings", GEMINI_API_KEY="FAKE_KEY")
        mocker.patch("apps.learning.views.genai.configure")

        # 2. Setup Models: Model 1 returns empty text, Model 2 returns valid JSON
        mock_model1 = MagicMock()
        mock_model1.generate_content.return_value = MagicMock(text="") # <--- Triggers the missing line
        
        mock_model2 = MagicMock()
        valid_data = {
            "term": "ROI", "explanation": "Return on Investment", "question": "Q?",
            "options": ["A"], "correct_answer": "A", "answer_explanation": "Exp."
        }
        mock_model2.generate_content.return_value = MagicMock(text=json.dumps(valid_data))

        def gen_model_side_effect(model_name, **kwargs):
            if "flash" in model_name:
                return mock_model1
            else:
                return mock_model2
        
        mocker.patch("apps.learning.views.genai.GenerativeModel", side_effect=gen_model_side_effect)
        
        # 3. Setup Create
        mock_topic = MagicMock()
        mock_topic.to_dict.return_value = valid_data
        mocker.patch("apps.learning.views.DailyTopic.objects.create", return_value=mock_topic)

        # Act
        request = HttpRequest()
        request.method = "POST"
        response = get_daily_topic_view(request)

        # Assert
        assert response.status_code == 201
        assert json.loads(response.content) == valid_data
        
    @pytest.mark.edge_case
    def test_database_save_fails_returns_500(self, mocker):
        mocker.patch("apps.learning.views.DailyTopic.objects.get", side_effect=DailyTopic.DoesNotExist)
        mocker.patch("apps.learning.views.DailyTopic.objects.order_by", return_value=MagicMock(first=MagicMock(return_value=None)))
        mocker.patch("apps.learning.views.settings", GEMINI_API_KEY="FAKE_KEY")
        mocker.patch("apps.learning.views.genai.configure")
        
        mock_model = MagicMock()
        response_data = {
            "term": "Compounding Interest", "explanation": "Interest.", "question": "Q?",
            "options": ["A"], "correct_answer": "A", "answer_explanation": "Exp."
        }
        mock_response = MagicMock(text=json.dumps(response_data))
        mock_model.generate_content.return_value = mock_response
        mocker.patch("apps.learning.views.genai.GenerativeModel", return_value=mock_model)
        
        mocker.patch("apps.learning.views.DailyTopic.objects.create", side_effect=Exception("DB error"))
        
        request = HttpRequest()
        request.method = "POST"
        
        response = get_daily_topic_view(request)
        assert response.status_code == 500
        assert "Database save failed" in json.loads(response.content)["error"]