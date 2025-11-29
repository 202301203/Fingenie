from django.db import models
import datetime

class DailyTopic(models.Model):
    """
    Stores the AI-generated financial topic for a specific date.
    """
    # Use the date as the primary key. This ensures one topic per day.
    date = models.DateField(primary_key=True, default=datetime.date.today)
    
    # The financial term, e.g., "P/E Ratio"
    term = models.CharField(max_length=100)
    
    # A simple explanation of the term
    explanation = models.TextField()
    
    # The quiz question
    question = models.TextField()
    
    # The multiple-choice options, stored as a JSON list
    # e.g., ["Answer A", "Answer B", "Answer C"]
    options = models.JSONField(default=list)
    
    # The text of the correct answer, e.g., "Answer B"
    correct_answer = models.CharField(max_length=255)

    answer_explanation = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.date}: {self.term}"
    
    def to_dict(self):
        """
        Returns a dictionary representation of the model
        for the JSON response.
        """
        return {
            'date': self.date,
            'term': self.term,
            'explanation': self.explanation,
            'question': self.question,
            'options': self.options,
            'correct_answer': self.correct_answer,
            'answer_explanation': self.answer_explanation
        }
