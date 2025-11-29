# test_models_daily_topic_str.py

import pytest
import datetime
from apps.learning.models import DailyTopic

@pytest.mark.django_db
class TestDailyTopicStr:
    # -------------------- Happy Path Tests --------------------

    @pytest.mark.happy_path
    def test_str_returns_date_and_term(self):
        """
        Test that __str__ returns the correct string with a typical date and term.
        """
        topic = DailyTopic(
            date=datetime.date(2024, 6, 1),
            term="P/E Ratio",
            explanation="Price to Earnings Ratio",
            question="What does P/E stand for?",
            options=["Price to Earnings", "Profit to Equity"],
            correct_answer="Price to Earnings",
            answer_explanation="P/E stands for Price to Earnings."
        )
        assert str(topic) == "2024-06-01: P/E Ratio"

    @pytest.mark.happy_path
    def test_str_with_different_term(self):
        """
        Test __str__ with a different term and date.
        """
        topic = DailyTopic(
            date=datetime.date(2023, 12, 31),
            term="Dividend Yield",
            explanation="Dividend per share divided by price per share.",
            question="What is Dividend Yield?",
            options=["A", "B", "C"],
            correct_answer="A",
            answer_explanation="..."
        )
        assert str(topic) == "2023-12-31: Dividend Yield"

    @pytest.mark.happy_path
    def test_str_with_unicode_term(self):
        """
        Test __str__ with a term containing unicode characters.
        """
        topic = DailyTopic(
            date=datetime.date(2022, 1, 15),
            term="βeta (β)",
            explanation="Beta coefficient.",
            question="What is beta?",
            options=["A", "B"],
            correct_answer="A",
            answer_explanation="..."
        )
        assert str(topic) == "2022-01-15: βeta (β)"

    # -------------------- Edge Case Tests --------------------

    @pytest.mark.edge_case
    def test_str_with_empty_term(self):
        """
        Test __str__ when the term is an empty string.
        """
        topic = DailyTopic(
            date=datetime.date(2021, 5, 5),
            term="",
            explanation="",
            question="",
            options=[],
            correct_answer="",
            answer_explanation=""
        )
        assert str(topic) == "2021-05-05: "

    @pytest.mark.edge_case
    def test_str_with_long_term(self):
        """
        Test __str__ with a very long term string.
        """
        long_term = "A" * 100  # max_length=100
        topic = DailyTopic(
            date=datetime.date(2020, 1, 1),
            term=long_term,
            explanation="...",
            question="...",
            options=[],
            correct_answer="",
            answer_explanation=""
        )
        assert str(topic) == f"2020-01-01: {long_term}"

    @pytest.mark.edge_case
    def test_str_with_min_date(self):
        """
        Test __str__ with the minimum possible date.
        """
        min_date = datetime.date.min
        topic = DailyTopic(
            date=min_date,
            term="MinDateTerm",
            explanation="...",
            question="...",
            options=[],
            correct_answer="",
            answer_explanation=""
        )
        assert str(topic) == f"{min_date}: MinDateTerm"

    @pytest.mark.edge_case
    def test_str_with_max_date(self):
        """
        Test __str__ with the maximum possible date.
        """
        max_date = datetime.date.max
        topic = DailyTopic(
            date=max_date,
            term="MaxDateTerm",
            explanation="...",
            question="...",
            options=[],
            correct_answer="",
            answer_explanation=""
        )
        assert str(topic) == f"{max_date}: MaxDateTerm"

    @pytest.mark.edge_case
    def test_str_with_term_whitespace(self):
        """
        Test __str__ with a term that is only whitespace.
        """
        topic = DailyTopic(
            date=datetime.date(2024, 6, 2),
            term="   ",
            explanation="...",
            question="...",
            options=[],
            correct_answer="",
            answer_explanation=""
        )
        assert str(topic) == "2024-06-02:    "