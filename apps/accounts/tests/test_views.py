import pytest
import json
from types import SimpleNamespace
from django.contrib.auth.models import User
from unittest.mock import MagicMock

# Ensure a stable reference to the views module for tests that use the name `views`
from apps.accounts import views

@pytest.mark.django_db
def test_register_api_success(client):
    """Test successful user registration."""
    data = {
        "username": "newuser",
        "email": "new@example.com",
        "password": "Password123!"
    }
    response = client.post(
        "/accounts/api/register/",
        data=json.dumps(data),
        content_type="application/json"
    )
    assert response.status_code == 201
    assert User.objects.filter(username="newuser").exists()
    assert response.json()["success"] is True

@pytest.mark.django_db
def test_register_api_invalid_data(client):
    """Test registration with missing fields."""
    data = {"username": "newuser"}
    response = client.post(
        "/accounts/api/register/",
        data=json.dumps(data),
        content_type="application/json"
    )
    assert response.status_code == 400
    assert response.json()["success"] is False

@pytest.mark.django_db
def test_register_api_duplicate_user(client):
    """Test registration with existing username."""
    User.objects.create_user(username="existing", email="old@example.com", password="pwd")
    data = {
        "username": "existing",
        "email": "new@example.com",
        "password": "Password123!"
    }
    response = client.post(
        "/accounts/api/register/",
        data=json.dumps(data),
        content_type="application/json"
    )
    assert response.status_code == 400
    assert "Username already exists" in response.json()["error"]

@pytest.mark.django_db
def test_login_api_success(client):
    """Test successful login."""
    User.objects.create_user(username="user", email="user@example.com", password="Password123!")
    data = {
        "identifier": "user@example.com",
        "password": "Password123!",
        "login_type": "email"
    }
    response = client.post(
        "/accounts/api/login/",
        data=json.dumps(data),
        content_type="application/json"
    )
    assert response.status_code == 200
    assert response.json()["success"] is True

@pytest.mark.django_db
def test_login_api_invalid_credentials(client):
    """Test login with wrong password."""
    User.objects.create_user(username="user", email="user@example.com", password="Password123!")
    data = {
        "identifier": "user@example.com",
        "password": "WrongPassword",
        "login_type": "email"
    }
    response = client.post(
        "/accounts/api/login/",
        data=json.dumps(data),
        content_type="application/json"
    )
    assert response.status_code == 401
    assert "Invalid credentials" in response.json()["error"]


@pytest.mark.django_db
def test_google_login_api_success(client, mocker):
    """Test successful Google login."""
    # Mock verify_google_token
    mock_verify = mocker.patch("apps.accounts.views.GoogleOAuthService.verify_google_token")
    mock_verify.return_value = {
        'email': 'google@example.com',
        'given_name': 'Google',
        'family_name': 'User',
        'name': 'Google User',
        'email_verified': True,
        'sub': '12345'
    }
    
    # Mock get_or_create_google_user
    mock_get_create = mocker.patch("apps.accounts.views.GoogleOAuthService.get_or_create_google_user")
    user = User.objects.create_user(username="googleuser", email="google@example.com")
    mock_get_create.return_value = (user, False)
    
    data = {"token": "valid_token"}
    response = client.post(
        "/accounts/api/google-login/",
        data=json.dumps(data),
        content_type="application/json"
    )
    assert response.status_code == 200
    assert response.json()["success"] is True

@pytest.mark.django_db
def test_logout_api(client):
    """Test logout."""
    user = User.objects.create_user(username="user", password="pwd")
    client.force_login(user)
    
    response = client.post("/accounts/api/logout/")
    assert response.status_code == 200
    assert response.json()["success"] is True

@pytest.mark.django_db
def test_check_auth_api(client):
    """Test check auth status."""
    # Not logged in
    response = client.get("/accounts/api/check-auth/")
    assert response.json()["authenticated"] is False
    
    # Logged in
    user = User.objects.create_user(username="user", password="pwd")
    client.force_login(user)
    response = client.get("/accounts/api/check-auth/")
    assert response.json()["authenticated"] is True

@pytest.mark.django_db
def test_validation_functions():
    """Test helper validation functions."""
    from apps.accounts.views import validate_username, validate_password_strength
    
    # Username
    assert validate_username("ab")[0] is False # Too short
    assert validate_username("a" * 151)[0] is False # Too long
    assert validate_username("invalid@user")[0] is False # Invalid chars
    assert validate_username("valid_user")[0] is True
    
    # Password
    assert validate_password_strength("short")[0] is False
    assert validate_password_strength("nouppercase1!")[0] is False
    assert validate_password_strength("NOLOWERCASE1!")[0] is False
    assert validate_password_strength("NoDigit!")[0] is False
    assert validate_password_strength("NoSpecial1")[0] is False
    assert validate_password_strength("ValidPass1!")[0] is True

@pytest.mark.django_db
def test_register_api_weak_password(client):
    """Test registration with weak password."""
    data = {"username": "user", "email": "u@e.com", "password": "weak"}
    response = client.post("/accounts/api/register/", data=json.dumps(data), content_type="application/json")
    assert response.status_code == 400
    assert "Password must be at least 8 characters" in response.json()["error"]

@pytest.mark.django_db
def test_login_api_disabled_account(client, mocker):
    """Test login for disabled account."""
    u = User.objects.create_user(username="disabled", email="d@e.com", password="Pwd1!")
    u.is_active = False
    u.save()
    
    # Mock authenticate to return the inactive user, otherwise it returns None
    mocker.patch("apps.accounts.views.authenticate", return_value=u)
    
    data = {"identifier": "d@e.com", "password": "Pwd1!", "login_type": "email"}
    response = client.post("/accounts/api/login/", data=json.dumps(data), content_type="application/json")
    assert response.status_code == 403
    assert "Account is disabled" in response.json()["error"]

@pytest.mark.django_db
def test_google_login_failures(client, mocker):
    """Test google login failure scenarios."""
    # Missing token
    response = client.post("/accounts/api/google-login/", data=json.dumps({}), content_type="application/json")
    assert response.status_code == 400
    assert "Google token is required" in response.json()["error"]
    
    # Unverified email
    mocker.patch("apps.accounts.views.GoogleOAuthService.verify_google_token", return_value={'email_verified': False})
    response = client.post("/accounts/api/google-login/", data=json.dumps({"token": "t"}), content_type="application/json")
    assert response.status_code == 400
    assert "Google email not verified" in response.json()["error"]
    
    # Exception
    mocker.patch("apps.accounts.views.GoogleOAuthService.verify_google_token", side_effect=ValueError("Invalid token"))
    response = client.post("/accounts/api/google-login/", data=json.dumps({"token": "t"}), content_type="application/json")
    assert response.status_code == 400
    assert "Google authentication failed" in response.json()["error"]

@pytest.mark.django_db
def test_logout_api_not_logged_in(client):
    """Test logout when not logged in."""
    response = client.post("/accounts/api/logout/")
    assert response.status_code == 400
    assert "Not logged in" in response.json()["error"]

@pytest.mark.django_db
def test_user_profile_api(client):
    """Test user profile api."""
    # Unauthenticated
    response = client.get("/accounts/api/profile/")
    assert response.status_code == 401
    
    # Authenticated
    user = User.objects.create_user(username="profileuser", password="Pwd1!")
    client.force_login(user)
    response = client.get("/accounts/api/profile/")
    assert response.status_code == 200
    assert response.json()["username"] == "profileuser"

@pytest.mark.django_db
def test_utility_apis(client):
    """Test utility endpoints."""
    # Test API
    response = client.get("/accounts/api/test/")
    assert response.status_code == 200
    assert response.json()["status"] == "API is working"
    
    # CSRF Token
    response = client.get("/accounts/api/csrf-token/")
    assert response.status_code == 200
    assert "csrftoken" in response.json()

def test_auth_methods_view_direct(rf):
    """Test auth_methods_api view directly since it might not be in urls."""
    from apps.accounts.views import auth_methods_api
    request = rf.get("/fake-url/")
    response = auth_methods_api(request)
    assert response.status_code == 200
    assert "auth_methods" in json.loads(response.content)

@pytest.mark.django_db
def test_json_decode_error(client):
    """Test handling of malformed JSON."""
    # Register
    response = client.post(
        "/accounts/api/register/",
        data="invalid json",
        content_type="application/json"
    )
    assert response.status_code == 400
    assert "Invalid JSON data" in response.json()["error"]
    
    # Login
    response = client.post(
        "/accounts/api/login/",
        data="{",
        content_type="application/json"
    )
    assert response.status_code == 400
    assert "Invalid JSON data" in response.json()["error"]

@pytest.mark.django_db
def test_validation_boundaries():
    """Test strict boundary conditions for validation."""
    from apps.accounts.views import validate_username
    
    # Exact boundaries
    assert validate_username("ab")[0] is False
    assert validate_username("abc")[0] is True
    assert validate_username("a" * 150)[0] is True
    assert validate_username("a" * 151)[0] is False
    
    # None/Empty
    assert validate_username(None)[0] is False
    assert validate_username("")[0] is False
    assert validate_username("   ")[0] is False


def test_create_username_from_google_info_collisions(monkeypatch):
    """Simulate username collisions and ensure suffixing works."""
    from django.contrib.auth.models import User

    calls = {'n': 0}

    def fake_filter(**kwargs):
        class Q:
            def exists(self_inner):
                # First two exist checks return True, then False
                calls['n'] += 1
                return calls['n'] <= 2

        return Q()

    monkeypatch.setattr(User.objects, 'filter', fake_filter)

    info = {'name': 'Test User', 'email': 'test@example.com', 'first_name': 'Test'}
    username = views.GoogleOAuthService.create_username_from_google_info(info)
    assert username.startswith('test_user')


def test_create_username_from_google_info_too_many_collisions(monkeypatch):
    """If uniqueness cannot be found within safety limit, raise ValueError."""
    from django.contrib.auth.models import User

    def fake_filter_always_true(**kwargs):
        class Q:
            def exists(self_inner):
                return True

        return Q()

    monkeypatch.setattr(User.objects, 'filter', fake_filter_always_true)

    info = {'name': 'X' * 50, 'email': 'x@example.com'}
    with pytest.raises(ValueError):
        views.GoogleOAuthService.create_username_from_google_info(info)


def test_get_or_create_google_user_no_email_raises():
    with pytest.raises(ValueError):
        views.GoogleOAuthService.get_or_create_google_user({})


def test_parse_json_request_unicode_error(rf):
    # construct a request with bytes that cannot be decoded as utf-8
    req = rf.post('/dummy', data=b"\xff\xff", content_type='application/json')
    parsed = views.parse_json_request(req)
    assert parsed is None


def test_auth_methods_api_respects_settings(monkeypatch, rf):
    # When GOOGLE_OAUTH_CLIENT_ID set -> google_oauth True
    monkeypatch.setattr(views, 'settings', SimpleNamespace(**{'GOOGLE_OAUTH_CLIENT_ID': 'cid'}))
    resp = views.auth_methods_api(rf.get('/'))
    data = json.loads(resp.content)
    assert data['success'] is True
    assert data['auth_methods']['google_oauth'] is True

    # When not set -> False
    monkeypatch.setattr(views, 'settings', SimpleNamespace(**{}))
    resp = views.auth_methods_api(rf.get('/'))
    data = json.loads(resp.content)
    assert data['auth_methods']['google_oauth'] is False
