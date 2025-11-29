import pytest
from unittest.mock import MagicMock, patch
from apps.accounts.views import GoogleOAuthService
from django.contrib.auth.models import User

@pytest.mark.django_db
class TestGoogleOAuthService:
    
    def test_verify_google_token_success(self, mocker):
        """Test successful token verification using google-auth library."""
        # Mock google.oauth2.id_token.verify_oauth2_token
        mock_verify = mocker.patch("google.oauth2.id_token.verify_oauth2_token")
        mock_verify.return_value = {
            'iss': 'accounts.google.com',
            'email': 'test@example.com',
            'given_name': 'Test',
            'family_name': 'User',
            'name': 'Test User',
            'picture': 'http://example.com/pic.jpg',
            'email_verified': True,
            'sub': '1234567890'
        }
        
        # Mock settings
        mocker.patch("django.conf.settings.GOOGLE_OAUTH_CLIENT_ID", "dummy_client_id")
        
        result = GoogleOAuthService.verify_google_token("dummy_token")
        
        assert result['email'] == 'test@example.com'
        assert result['sub'] == '1234567890'
        
    def test_verify_google_token_fallback_success(self, mocker):
        """Test successful token verification using fallback requests."""
        # Force ImportError for google.oauth2
        mocker.patch.dict("sys.modules", {"google.oauth2": None})
        
        # Mock requests.get
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            'email': 'test@example.com',
            'given_name': 'Test',
            'family_name': 'User',
            'name': 'Test User',
            'picture': 'http://example.com/pic.jpg',
            'email_verified': 'true',
            'sub': '1234567890',
            'aud': 'dummy_client_id'
        }
        mocker.patch("requests.get", return_value=mock_response)
        mocker.patch("django.conf.settings.GOOGLE_OAUTH_CLIENT_ID", "dummy_client_id")
        
        result = GoogleOAuthService.verify_google_token("dummy_token")
        
        assert result['email'] == 'test@example.com'
        assert result['sub'] == '1234567890'

    def test_create_username_from_google_info(self):
        """Test username generation."""
        info = {'name': 'John Doe', 'email': 'john@example.com'}
        username = GoogleOAuthService.create_username_from_google_info(info)
        assert username == 'john_doe'
        
        # Test uniqueness
        User.objects.create_user(username='john_doe', email='other@example.com')
        username2 = GoogleOAuthService.create_username_from_google_info(info)
        assert username2 == 'john_doe_1'

    def test_get_or_create_google_user_new(self):
        """Test creating a new user from Google info."""
        info = {
            'email': 'new@example.com',
            'first_name': 'New',
            'last_name': 'User',
            'name': 'New User'
        }
        
        user, created = GoogleOAuthService.get_or_create_google_user(info)
        
        assert created is True
        assert user.email == 'new@example.com'
        assert user.profile.is_google_user is False # Note: is_google_user is set in the view, not service method currently? 
        # Checking the service code: get_or_create_google_user creates user but doesn't set profile fields explicitly in the service method provided in the prompt context.
        # Wait, looking at views.py provided:
        # The service method `get_or_create_google_user` in `views.py` (it's defined inside views.py in the provided file content)
        # It creates user. It does NOT set profile fields. The VIEW sets profile fields.
        # Let's verify the code again.
        
        # Code from views.py:
        # def get_or_create_google_user(google_info):
        #     ...
        #     user = User.objects.create_user(...)
        #     user.set_unusable_password()
        #     user.save()
        #     return user, True
        
        # So the service just creates the User object.
        pass

    def test_get_or_create_google_user_existing(self):
        """Test retrieving existing user."""
        User.objects.create_user(username='existing', email='existing@example.com')
        
        info = {'email': 'existing@example.com'}
        user, created = GoogleOAuthService.get_or_create_google_user(info)
        
        assert created is False
        assert user.username == 'existing'

    def test_verify_google_token_fallback_failure(self, mocker):
        """Test fallback failure when requests fails."""
        # Force ImportError
        mocker.patch.dict("sys.modules", {"google.oauth2": None})
        
        # Mock requests.get to fail
        mocker.patch("requests.get", side_effect=Exception("Network Error"))
        
        with pytest.raises(Exception) as exc:
            GoogleOAuthService.verify_google_token("token")
        assert "Network Error" in str(exc.value)

    def test_verify_google_token_fallback_bad_status(self, mocker):
        """Test fallback when Google returns non-200 status."""
        mocker.patch.dict("sys.modules", {"google.oauth2": None})
        
        mock_response = MagicMock()
        mock_response.status_code = 400
        mocker.patch("requests.get", return_value=mock_response)
        
        with pytest.raises(ValueError) as exc:
            GoogleOAuthService.verify_google_token("token")
        assert "Google API returned status 400" in str(exc.value)

    def test_create_username_edge_cases(self):
        """Test username generation with tricky inputs."""
        # No name, no first name, only email
        info = {'email': 'onlyemail@example.com'}
        username = GoogleOAuthService.create_username_from_google_info(info)
        assert username == 'onlyemail'
        
        # Special characters in name
        info = {'name': 'User!@# Name$%^', 'email': 'u@e.com'}
        username = GoogleOAuthService.create_username_from_google_info(info)
        assert username == 'user_name'
        
        # Very long name
        info = {'name': 'A' * 50, 'email': 'u@e.com'}
        username = GoogleOAuthService.create_username_from_google_info(info)
        assert len(username) <= 25
        assert username == ('a' * 50)[:25]
