# test_models_daily_topic_to_dict.py

import pytest
import datetime
from apps.learning.models import DailyTopic

@pytest.mark.django_db
class TestDailyTopicToDict:
    # -------------------- HAPPY PATHS --------------------
    @pytest.mark.happy_path
    def test_to_dict_returns_expected_dict(self):
        """
        Test that to_dict returns a dictionary with all fields correctly populated for a typical DailyTopic instance.
        """
        topic = DailyTopic(
            date=datetime.date(2024, 6, 1),
            term="P/E Ratio",
            explanation="Price to Earnings Ratio explanation.",
            question="What does P/E stand for?",
            options=["Price/Earnings", "Profit/Equity", "Price/Equity"],
            correct_answer="Price/Earnings",
            answer_explanation="P/E stands for Price to Earnings."
        )
        result = topic.to_dict()
        assert result == {
            'date': datetime.date(2024, 6, 1),
            'term': "P/E Ratio",
            'explanation': "Price to Earnings Ratio explanation.",
            'question': "What does P/E stand for?",
            'options': ["Price/Earnings", "Profit/Equity", "Price/Equity"],
            'correct_answer': "Price/Earnings",
            'answer_explanation': "P/E stands for Price to Earnings."
        }

    @pytest.mark.happy_path
    def test_to_dict_with_minimal_fields(self):
        """
        Test to_dict with minimal required fields and empty answer_explanation.
        """
        topic = DailyTopic(
            date=datetime.date(2024, 1, 1),
            term="Liquidity",
            explanation="Ability to convert assets to cash.",
            question="What is liquidity?",
            options=["Ability to convert assets", "Profitability", "Debt level"],
            correct_answer="Ability to convert assets",
            answer_explanation=""
        )
        result = topic.to_dict()
        assert result['answer_explanation'] == ""
        assert result['term'] == "Liquidity"

    @pytest.mark.happy_path
    def test_to_dict_with_null_answer_explanation(self):
        """
        Test to_dict when answer_explanation is None (null=True).
        """
        topic = DailyTopic(
            date=datetime.date(2024, 2, 2),
            term="ROI",
            explanation="Return on Investment.",
            question="What does ROI mean?",
            options=["Return on Investment", "Rate of Interest"],
            correct_answer="Return on Investment",
            answer_explanation=None
        )
        result = topic.to_dict()
        assert result['answer_explanation'] is None

    @pytest.mark.happy_path
    def test_to_dict_with_empty_options(self):
        """
        Test to_dict when options is an empty list.
        """
        topic = DailyTopic(
            date=datetime.date(2024, 3, 3),
            term="Volatility",
            explanation="How much a price fluctuates.",
            question="What is volatility?",
            options=[],
            correct_answer="",
            answer_explanation=None
        )
        result = topic.to_dict()
        assert result['options'] == []
        assert result['correct_answer'] == ""

    # -------------------- EDGE CASES --------------------
    @pytest.mark.edge_case
    def test_to_dict_with_long_strings(self):
        """
        Test to_dict with maximum length strings for term and correct_answer.
        """
        long_term = "T" * 100
        long_correct = "C" * 255
        topic = DailyTopic(
            date=datetime.date(2024, 4, 4),
            term=long_term,
            explanation="E" * 1000,
            question="Q" * 1000,
            options=["A" * 500, "B" * 500],
            correct_answer=long_correct,
            answer_explanation="X" * 1000
        )
        result = topic.to_dict()
        assert result['term'] == long_term
        assert result['correct_answer'] == long_correct
        assert all(isinstance(opt, str) for opt in result['options'])

    @pytest.mark.edge_case
    def test_to_dict_with_special_characters(self):
        """
        Test to_dict with special and unicode characters in all string fields.
        """
        topic = DailyTopic(
            date=datetime.date(2024, 5, 5),
            term="Διακύμανση 🚀",
            explanation="Explains volatility in Greek: διακύμανση.",
            question="Τι είναι διακύμανση;",
            options=["Υψηλή", "Χαμηλή", "Μέτρια"],
            correct_answer="Υψηλή",
            answer_explanation="Η διακύμανση δείχνει πόσο αλλάζει η τιμή."
        )
        result = topic.to_dict()
        assert "Διακύμανση" in result['term']
        assert "🚀" in result['term']
        assert "διακύμανση" in result['explanation']
        assert "Τι είναι" in result['question']

    @pytest.mark.edge_case
    def test_to_dict_with_date_today_default(self):
        """
        Test to_dict when date is set to default (today).
        """
        today = datetime.date.today()
        topic = DailyTopic(
            term="Default Date",
            explanation="Testing default date.",
            question="What is today's date?",
            options=["Today", "Yesterday"],
            correct_answer="Today",
            answer_explanation=None
        )
        # date should be set to today by default
        assert topic.date == today
        result = topic.to_dict()
        assert result['date'] == today

    @pytest.mark.edge_case
    def test_to_dict_with_options_containing_non_ascii(self):
        """
        Test to_dict when options contain non-ASCII and emoji characters.
        """
        topic = DailyTopic(
            date=datetime.date(2024, 6, 6),
            term="Currency",
            explanation="Different types of currency.",
            question="Which is a cryptocurrency?",
            options=["Bitcoin", "Ethereum", "Dogecoin 🐕", "Dollar $"],
            correct_answer="Dogecoin 🐕",
            answer_explanation="Dogecoin is a cryptocurrency."
        )
        result = topic.to_dict()
        assert any("🐕" in opt for opt in result['options'])
        assert "$" in result['options'][-1]

    # -------------------- ERROR CONDITIONS --------------------
    # The to_dict method does not raise errors by itself, as it simply returns field values.
    # Django model field validation is not triggered unless .full_clean() is called or the object is saved.
    # Therefore, no error condition tests are required for to_dict itself.