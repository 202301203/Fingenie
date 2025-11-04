# accounts/views.py
from django.http import JsonResponse
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login, logout
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.conf import settings
from django.middleware.csrf import get_token
import json
import logging
import re

# Set up logging
logger = logging.getLogger(__name__)

# Response templates
def success_response(data=None, message="Success", status=200):
    """Standard success response format"""
    response_data = {"success": True, "message": message}
    if data:
        response_data.update(data)
    return JsonResponse(response_data, status=status)

def error_response(message="Error", status=400, details=None):
    """Standard error response format"""
    response_data = {"success": False, "error": message}
    if details and settings.DEBUG:
        response_data["details"] = details
    return JsonResponse(response_data, status=status)

# Validation functions
def validate_username(username):
    """Validate username format"""
    if not username or len(username.strip()) < 3:
        return False, "Username must be at least 3 characters"
    if len(username) > 150:
        return False, "Username must be less than 150 characters"
    if not re.match(r'^[a-zA-Z0-9_]+$', username):
        return False, "Username can only contain letters, numbers, and underscores"
    return True, None

def validate_email_format(email):
    """Validate email format"""
    try:
        validate_email(email)
        return True, None
    except ValidationError:
        return False, "Invalid email format"

def validate_password_strength(password):
    """Validate password meets security requirements"""
    if len(password) < 8:
        return False, "Password must be at least 8 characters"
    if not any(c.isupper() for c in password):
        return False, "Password must contain at least one uppercase letter"
    if not any(c.islower() for c in password):
        return False, "Password must contain at least one lowercase letter"
    if not any(c.isdigit() for c in password):
        return False, "Password must contain at least one number"
    if not any(c in "!@#$%^&*" for c in password):
        return False, "Password must contain at least one special character (!@#$%^&*)"
    return True, None

def parse_json_request(request):
    """Safely parse JSON from request body"""
    try:
        if request.body:
            return json.loads(request.body.decode('utf-8'))
        return {}
    except (json.JSONDecodeError, UnicodeDecodeError) as e:
        logger.error(f"JSON parse error: {str(e)}")
        return None

# Authentication Views
@csrf_exempt
@require_http_methods(["POST"])
def register_api(request):
    """
    Register a new user
    POST data: { "username": "", "email": "", "password": "" }
    """
    try:
        data = parse_json_request(request)
        if data is None:
            return error_response("Invalid JSON data", 400)

        # Extract and validate fields
        username = data.get("username", "").strip()
        email = data.get("email", "").strip().lower()
        password = data.get("password", "")

        # Validate required fields
        if not all([username, email, password]):
            return error_response("All fields are required", 400)

        # Validate individual fields
        is_valid, error_msg = validate_username(username)
        if not is_valid:
            return error_response(error_msg, 400)

        is_valid, error_msg = validate_email_format(email)
        if not is_valid:
            return error_response(error_msg, 400)

        is_valid, error_msg = validate_password_strength(password)
        if not is_valid:
            return error_response(error_msg, 400)

        # Check for existing users
        if User.objects.filter(username__iexact=username).exists():
            return error_response("Username already exists", 400)
        
        if User.objects.filter(email__iexact=email).exists():
            return error_response("Email already registered", 400)

        # Create user
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password
        )
        
        # Log the user in
        login(request, user)
        
        logger.info(f"New user registered: {username}")
        
        return success_response(
            {
                "username": user.username,
                "email": user.email
            },
            "Registration successful",
            status=201
        )
        
    except Exception as e:
        logger.error(f"Registration error: {str(e)}")
        return error_response(
            "Registration failed due to server error", 
            500, 
            str(e) if settings.DEBUG else None
        )

@csrf_exempt
@require_http_methods(["POST"])
def login_api(request):
    """
    Login user with email/username and password
    POST data: { "identifier": "", "password": "", "login_type": "email|username" }
    """
    try:
        data = parse_json_request(request)
        if data is None:
            return error_response("Invalid JSON data", 400)

        identifier = data.get("identifier", "").strip()
        password = data.get("password", "")
        login_type = data.get("login_type", "email")

        # Validate required fields
        if not identifier:
            return error_response("Email/username is required", 400)
        if not password:
            return error_response("Password is required", 400)

        user = None
        
        if login_type == "email":
            # Validate email format
            is_valid, error_msg = validate_email_format(identifier)
            if not is_valid:
                return error_response(error_msg, 400)
            
            identifier = identifier.lower()
            
            # Find user by email and authenticate
            try:
                user_obj = User.objects.get(email=identifier)
                user = authenticate(request, username=user_obj.username, password=password)
            except User.DoesNotExist:
                return error_response("Invalid email or password", 401)
        else:
            # Login with username
            user = authenticate(request, username=identifier, password=password)

        # Check authentication result
        if user is not None:
            if not user.is_active:
                return error_response("Account is disabled", 403)
            
            login(request, user)
            logger.info(f"User logged in: {user.username}")
            
            return success_response(
                {
                    "username": user.username,
                    "email": user.email
                },
                "Login successful"
            )
        else:
            logger.warning(f"Failed login attempt for: {identifier}")
            return error_response("Invalid credentials", 401)
            
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        return error_response(
            "Login failed due to server error", 
            500, 
            str(e) if settings.DEBUG else None
        )

@csrf_exempt
@require_http_methods(["POST"])
def logout_api(request):
    """
    Logout the current user
    """
    try:
        if request.user.is_authenticated:
            username = request.user.username
            logout(request)
            logger.info(f"User logged out: {username}")
            return success_response(message="Logged out successfully")
        else:
            return error_response("Not logged in", 400)
            
    except Exception as e:
        logger.error(f"Logout error: {str(e)}")
        return error_response(
            "Logout failed", 
            500, 
            str(e) if settings.DEBUG else None
        )

@csrf_exempt
@require_http_methods(["GET"])
def check_auth_api(request):
    """
    Check if user is authenticated and return user info
    """
    try:
        if request.user.is_authenticated:
            return success_response(
                {
                    "authenticated": True,
                    "username": request.user.username,
                    "email": request.user.email
                }
            )
        else:
            return success_response({"authenticated": False})
            
    except Exception as e:
        logger.error(f"Check auth error: {str(e)}")
        return error_response(
            "Authentication check failed", 
            500, 
            str(e) if settings.DEBUG else None
        )

@csrf_exempt
@require_http_methods(["POST"])
def google_login_api(request):
    """
    Authenticate user using Google OAuth token
    POST data: { "token": "google_oauth_token" }
    """
    try:
        data = parse_json_request(request)
        if data is None:
            return error_response("Invalid JSON data", 400)

        token = data.get("token")
        if not token:
            return error_response("Google token is required", 400)

        # Check if google-auth is available
        try:
            from google.oauth2 import id_token
            from google.auth.transport import requests as google_requests
        except ImportError:
            logger.error("google-auth library not installed")
            return error_response("Google authentication not available", 500)

        # Verify Google configuration
        client_id = getattr(settings, 'GOOGLE_OAUTH_CLIENT_ID', None)
        if not client_id:
            logger.error("GOOGLE_OAUTH_CLIENT_ID not configured")
            return error_response("Google authentication not configured", 500)

        # Verify the token
        try:
            idinfo = id_token.verify_oauth2_token(
                token, 
                google_requests.Request(), 
                client_id
            )
        except ValueError as e:
            logger.error(f"Invalid Google token: {str(e)}")
            return error_response("Invalid Google token", 400)

        # Validate token issuer
        if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
            return error_response("Invalid token issuer", 400)

        # Extract user information
        email = idinfo.get("email", "").lower()
        given_name = idinfo.get("given_name", "")
        family_name = idinfo.get("family_name", "")
        name = idinfo.get("name", "")
        
        if not email:
            return error_response("Email not provided by Google", 400)

        # Get or create user
        try:
            user = User.objects.get(email=email)
            logger.info(f"Existing Google user: {user.username}")
        except User.DoesNotExist:
            # Generate unique username
            if name:
                base_username = name.replace(" ", "_").lower()
            elif given_name:
                base_username = given_name.lower()
            else:
                base_username = email.split("@")[0]

            # Clean username
            base_username = re.sub(r'[^a-zA-Z0-9_]', '', base_username)[:30]
            
            # Ensure uniqueness
            username = base_username
            counter = 1
            while User.objects.filter(username=username).exists():
                username = f"{base_username}_{counter}"
                counter += 1

            # Create new user
            user = User.objects.create_user(
                username=username,
                email=email,
                first_name=given_name[:30] if given_name else "",
                last_name=family_name[:30] if family_name else ""
            )
            user.set_unusable_password()  # OAuth users don't need password
            user.save()
            logger.info(f"New Google user created: {username}")

        # Log the user in
        login(request, user)
        
        return success_response(
            {
                "username": user.username,
                "email": user.email
            },
            "Google login successful"
        )

    except Exception as e:
        logger.error(f"Google login error: {str(e)}")
        return error_response(
            "Google login failed", 
            500, 
            str(e) if settings.DEBUG else None
        )

@csrf_exempt
@require_http_methods(["GET", "POST"])
def test_api(request):
    """
    Test endpoint to verify API is working
    """
    return success_response(
        {
            "status": "API is working",
            "method": request.method,
            "user_authenticated": request.user.is_authenticated,
            "user": request.user.username if request.user.is_authenticated else None
        }
    )

@csrf_exempt
@require_http_methods(["GET"])
def get_csrf_token(request):
    """
    Get CSRF token for React app
    """
    return success_response({"csrftoken": get_token(request)})

@csrf_exempt
@require_http_methods(["GET"])
def user_profile_api(request):
    """
    Get current user profile information
    """
    if not request.user.is_authenticated:
        return error_response("Authentication required", 401)
    
    try:
        user = request.user
        return success_response({
            "username": user.username,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "date_joined": user.date_joined.isoformat() if user.date_joined else None
        })
    except Exception as e:
        logger.error(f"Profile fetch error: {str(e)}")
        return error_response("Failed to fetch profile", 500)