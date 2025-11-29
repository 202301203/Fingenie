import pytest
from django.urls import resolve
from apps.learning.views import get_daily_topic_view

def test_daily_topic_url_resolves():
    """
    Test that the URL path maps correctly to the get_daily_topic_view function.
    """
    # The traceback confirms 'api/learning/' is the prefix for this app
    url = '/api/learning/daily-topic/' 
    
    resolver = resolve(url)
    assert resolver.func == get_daily_topic_view