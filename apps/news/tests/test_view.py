import pytest
import json
from unittest.mock import patch, Mock
from django.test import TestCase, Client, override_settings
from django.urls import reverse
from requests.exceptions import RequestException
from news.views import article_api

class ArticleApiViewTest(TestCase):
    def setUp(self):
        self.client = Client()
        self.url = reverse('news:article_api')

        self.mock_api_response = {
            "status": "ok",
            "totalResults": 45,
            "articles": [
                {
                    "title": "Valid Finance News",
                    "description": "Market is up.",
                    "url": "http://example.com/1",
                    "publishedAt": "2025-01-01"
                },
                {
                    "title": "[Removed]",
                    "description": "Deleted.",
                    "url": "http://example.com/removed",
                    "publishedAt": "2025-01-01"
                }
            ]
        }

    @override_settings(NEWS_API_KEY='test-dummy-key')
    @patch('news.views.requests.get')
    def test_success_and_filtering(self, mock_get):
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = self.mock_api_response
        mock_get.return_value = mock_response

        response = self.client.get(self.url)
        data = response.json()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(data['articles']), 1)
        self.assertEqual(data['articles'][0]['title'], "Valid Finance News")

    @override_settings(NEWS_API_KEY='test-dummy-key')
    @patch('news.views.requests.get')
    def test_pagination_math(self, mock_get):
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = self.mock_api_response
        mock_get.return_value = mock_response

        response = self.client.get(self.url, {'page': 1})
        data = response.json()
        self.assertEqual(data['next_page'], 2)
        self.assertIsNone(data['prev_page'])

        response = self.client.get(self.url, {'page': 2})
        data = response.json()
        self.assertEqual(data['prev_page'], 1)

    @override_settings(NEWS_API_KEY='test-dummy-key')
    @patch('news.views.requests.get')
    def test_last_page_boundary(self, mock_get):
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = self.mock_api_response
        mock_get.return_value = mock_response

        response = self.client.get(self.url, {'page': 3})
        data = response.json()

        self.assertEqual(data['page'], 3)
        self.assertIsNone(data['next_page'])

    @override_settings(NEWS_API_KEY='test-dummy-key')
    @patch('news.views.requests.get')
    def test_input_validation_recovery(self, mock_get):
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = self.mock_api_response
        mock_get.return_value = mock_response

        response = self.client.get(self.url, {'page': 'banana'})
        data = response.json()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(data['page'], 1)

    @override_settings(NEWS_API_KEY='test-dummy-key')
    @patch('news.views.requests.get')
    def test_empty_results(self, mock_get):
        empty_response = {
            "status": "ok",
            "totalResults": 0,
            "XXarticlesXX": []
        }
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = empty_response
        mock_get.return_value = mock_response

        response = self.client.get(self.url)
        data = response.json()

        self.assertEqual(len(data['articles']), 0)
        self.assertEqual(data['total_pages'], 1)

    @override_settings(NEWS_API_KEY='test-dummy-key')
    @patch('news.views.requests.get')
    def test_upstream_api_failure(self, mock_get):
        mock_response = Mock()
        mock_response.status_code = 401
        mock_response.raise_for_status.side_effect = RequestException("Unauthorized")
        mock_get.return_value = mock_response

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, 500)
        self.assertIn("An unexpected error occurred", response.json()['error'])

    @override_settings(NEWS_API_KEY='test-dummy-key')
    @patch('news.views.requests.get')
    def test_generic_exception(self, mock_get):
        mock_get.side_effect = RequestException("Network Down")

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, 500)
        self.assertIn("Network Down", response.json()['error'])

    @override_settings(NEWS_API_KEY='test-dummy-key')
    @patch('news.views.requests.get')
    def test_pagination_page_one_no_prev(self, mock_get):
        """Ensure page 1 has no previous page - catches prev_page mutation"""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = self.mock_api_response
        mock_get.return_value = mock_response

        response = self.client.get(self.url, {'page': 1})
        data = response.json()

        self.assertIsNone(data['prev_page'])
        self.assertEqual(data['next_page'], 2)
        self.assertEqual(data['page'], 1)

    @override_settings(NEWS_API_KEY='test-dummy-key')
    @patch('news.views.requests.get')
    def test_pagination_middle_page_both_directions(self, mock_get):
        """Test middle page has both next and previous - catches pagination operators"""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = self.mock_api_response
        mock_get.return_value = mock_response

        response = self.client.get(self.url, {'page': 2})
        data = response.json()

        self.assertEqual(data['page'], 2)
        self.assertEqual(data['prev_page'], 1)
        self.assertEqual(data['next_page'], 3)

    @override_settings(NEWS_API_KEY='test-dummy-key')
    @patch('news.views.requests.get')
    def test_pagination_boundary_last_page(self, mock_get):
        """Test last page (3) has no next page - catches next_page boundary mutation"""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = self.mock_api_response
        mock_get.return_value = mock_response

        response = self.client.get(self.url, {'page': 3})
        data = response.json()

        self.assertEqual(data['page'], 3)
        self.assertEqual(data['prev_page'], 2)
        self.assertIsNone(data['next_page'])
        self.assertNotEqual(data['next_page'], 4)

    @override_settings(NEWS_API_KEY='test-dummy-key')
    @patch('news.views.requests.get')
    def test_total_pages_calculation_with_remainder(self, mock_get):
        """Test total_pages calculation with remainder (45 results, 20 per page = 3 pages)"""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = self.mock_api_response
        mock_get.return_value = mock_response

        response = self.client.get(self.url)
        data = response.json()

        self.assertEqual(data['total_pages'], 3)
        self.assertEqual(data['total_results'], 45)
        self.assertNotEqual(data['total_pages'], 2)

    @override_settings(NEWS_API_KEY='test-dummy-key')
    @patch('news.views.requests.get')
    def test_total_pages_21_catches_operator_mutations(self, mock_get):
        """Test 21 results: catches +, -, * operator mutations on total_pages calc"""
        mock_response = Mock()
        mock_response.status_code = 200
        response_data = {
            "status": "ok",
            "totalResults": 21,
            "articles": [{"title": f"Article {i}", "description": "Desc", "url": f"http://example.com/{i}", "publishedAt": "2025-01-01"} for i in range(20)]
        }
        mock_response.json.return_value = response_data
        mock_get.return_value = mock_response

        response = self.client.get(self.url)
        data = response.json()
        self.assertEqual(data['total_pages'], 2)
        self.assertGreater(data['total_pages'], 1)

    @override_settings(NEWS_API_KEY='test-dummy-key')
    @patch('news.views.requests.get')
    def test_next_page_on_page_1_is_2(self, mock_get):
        """Test page 1 next_page is 2 - catches +/- mutation"""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = self.mock_api_response
        mock_get.return_value = mock_response

        response = self.client.get(self.url, {'page': 1})
        data = response.json()

        self.assertEqual(data['next_page'], 2)
        self.assertGreater(data['next_page'], data['page'])

    @override_settings(NEWS_API_KEY='test-dummy-key')
    @patch('news.views.requests.get')
    def test_page_2_prev_page_is_1(self, mock_get):
        """Test page 2 prev_page is 1 - catches +/- mutation"""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = self.mock_api_response
        mock_get.return_value = mock_response

        response = self.client.get(self.url, {'page': 2})
        data = response.json()

        self.assertEqual(data['prev_page'], 1)
        self.assertLess(data['prev_page'], data['page'])

    @override_settings(NEWS_API_KEY='test-dummy-key')
    @patch('news.views.requests.get')
    def test_articles_with_title_none_filtered(self, mock_get):
        """Test articles with None title are filtered out"""
        mock_response = Mock()
        mock_response.status_code = 200
        response_data = {
            "status": "ok",
            "totalResults": 3,
            "articles": [
                {"title": "Valid", "description": "Desc", "url": "http://example.com/1", "publishedAt": "2025-01-01"},
                {"title": None, "description": "No Title", "url": "http://example.com/2", "publishedAt": "2025-01-01"},
                {"title": "Another", "description": "Desc", "url": "http://example.com/3", "publishedAt": "2025-01-01"}
            ]
        }
        mock_response.json.return_value = response_data
        mock_get.return_value = mock_response

        response = self.client.get(self.url)
        data = response.json()

        self.assertEqual(len(data['articles']), 2)
        self.assertEqual(data['articles'][0]['title'], 'Valid')
        self.assertEqual(data['articles'][1]['title'], 'Another')


def test_api_unexpected_crash(client):
    with patch('news.views.requests.get') as mock_get:
        mock_get.side_effect = Exception("Simulated Server Explosion")

        url = reverse('news:article_api')

        response = client.get(url)

        assert response.status_code == 500
        assert "Simulated Server Explosion" in response.json()['error']


def test_api_zero_results(client):
    with patch('news.views.requests.get') as mock_get:
        mock_response = mock_get.return_value
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "articles": [],
            "totalResults": 0
        }

        url = reverse('news:article_api')
        response = client.get(url)
        data = response.json()

        assert response.status_code == 200
        assert data['total_results'] == 0
        assert data['total_pages'] == 1
        assert len(data['articles']) == 0


def test_negative_page_pagination(client):
    with patch('news.views.requests.get') as mock_get:
        mock_get.return_value.status_code = 200
        mock_get.return_value.json.return_value = {
            "articles": [],
            "totalResults": 0
        }

        url = reverse('news:article_api')

        response = client.get(url, {'page': -5})

        assert response.status_code == 200
        assert response.json()['page'] == 1

@pytest.mark.django_db
def test_articles_with_empty_and_whitespace_titles_filtered(client):
    """
    Ensure articles with empty string or whitespace titles are filtered out.
    This kills mutants that drop the `article.get('title')` truthiness check.
    """
    with patch('news.views.requests.get') as mock_get:
        mock_get.return_value.status_code = 200
        mock_get.return_value.json.return_value = {
            "status": "ok",
            "totalResults": 4,
            "articles": [
                {"title": "Valid", "description": "Desc", "url": "u1", "publishedAt": "2025-01-01"},
                {"title": "", "description": "Empty", "url": "u2", "publishedAt": "2025-01-01"},
                {"title": " ", "description": "Space", "url": "u3", "publishedAt": "2025-01-01"},
                {"title": "[Removed]", "description": "Removed", "url": "u4", "publishedAt": "2025-01-01"},
            ]
        }

        url = reverse('news:article_api')
        data = client.get(url).json()

        assert len(data['articles']) == 1
        assert data['articles'][0]['title'] == "Valid"


@pytest.mark.django_db
def test_total_pages_negative_total_results_treated_as_one_page(client):
    """
    totalResults < 0 should still give total_pages == 1.
    Kills mutants that change the else-branch of calculate_total_pages.
    """
    with patch('news.views.requests.get') as mock_get:
        mock_get.return_value.status_code = 200
        mock_get.return_value.json.return_value = {
            "articles": [],
            "totalResults": -5,
        }

        url = reverse('news:article_api')
        data = client.get(url).json()

        assert data['total_results'] == -5
        assert data['total_pages'] == 1


@pytest.mark.django_db
def test_next_page_none_when_page_greater_than_total_pages(client):
    """
    When page is far beyond total_pages, next_page must be None.
    Kills mutants in get_next_page where '<' becomes '<=' or other variants.
    """
    with patch('news.views.requests.get') as mock_get:
        mock_get.return_value.status_code = 200
        mock_get.return_value.json.return_value = {
            "articles": [],
            "totalResults": 10,
        }

        url = reverse('news:article_api')
        data = client.get(url, {'page': 10}).json()

        assert data['total_pages'] == 1
        assert data['page'] == 10
        assert data['next_page'] is None


@pytest.mark.django_db
def test_prev_page_stays_none_on_page_one_even_with_large_total_results(client):
    """
    Ensure prev_page is still None on page 1 even if total_results is huge.
    Helps kill mutations on get_prev_page condition.
    """
    with patch('news.views.requests.get') as mock_get:
        mock_get.return_value.status_code = 200
        mock_get.return_value.json.return_value = {
            "articles": [],
            "totalResults": 1000,
        }

        url = reverse('news:article_api')
        data = client.get(url, {'page': 1}).json()

        assert data['prev_page'] is None
        assert data['prev_page'] is not 0