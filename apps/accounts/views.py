# accounts/views.py
from django.http import JsonResponse
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login, logout
from django.views.decorators.csrf import csrf_exempt, ensure_csrf_cookie
from django.views.decorators.http import require_http_methods
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.conf import settings
from django.middleware.csrf import get_token
from django.db import IntegrityError
from django.contrib.auth.decorators import login_required
from django.shortcuts import get_object_or_404
import json
import logging
import re
import requests 
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import permission_classes, authentication_classes
from rest_framework.authentication import SessionAuthentication

from .models import UserProfile, UserActivity, Feedback, SupportTicket

# Set up logging
logger = logging.getLogger(__name__)

# ============================================
# RESPONSE TEMPLATES
# ============================================

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

# ============================================
# VALIDATION FUNCTIONS
# ============================================

def validate_username(username):
    """Validate username format"""
    if not username or len(username.strip()) < 3:
        return False, "Username must be at least 3 characters"
    if len(username) > 150:
        return False, "Username must be less than 150 characters"
    if not re.match(r'^[a-zA-Z0-9][a-zA-Z0-9_]*$', username):
        return False, "Username can only contain letters, numbers, and underscores, and must start with a letter or number"
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

# ============================================
# GOOGLE OAUTH SERVICE
# ============================================

class GoogleOAuthService:
    @staticmethod
    def verify_google_token(token):
        """
        Verify Google OAuth token and return user info.
        Tries google-auth first, falls back to tokeninfo endpoint.
        """
        try:
            # Method 1: Using google-auth library (recommended)
            try:
                from google.oauth2 import id_token
                from google.auth.transport import requests as google_requests
                
                client_id = getattr(settings, 'GOOGLE_OAUTH_CLIENT_ID', None)
                if not client_id:
                    raise ValueError("GOOGLE_OAUTH_CLIENT_ID not configured")
                
                idinfo = id_token.verify_oauth2_token(
                    token, 
                    google_requests.Request(), 
                    client_id
                )
                
                # Validate the issuer
                if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
                    raise ValueError("Invalid token issuer")
                
                return {
                    'email': idinfo.get('email', '').lower(),
                    'first_name': idinfo.get('given_name', ''),
                    'last_name': idinfo.get('family_name', ''),
                    'name': idinfo.get('name', ''),
                    'picture': idinfo.get('picture', ''),
                    'email_verified': idinfo.get('email_verified', False),
                    'sub': idinfo.get('sub')  # Google user ID
                }
                
            except ImportError:
                # Fallback: Use Google's tokeninfo endpoint if google-auth is not installed
                logger.warning("google-auth not installed, falling back to tokeninfo endpoint.")
                return GoogleOAuthService.verify_google_token_fallback(token)
                
        except ValueError as e:
            logger.error(f"Google token verification failed: {str(e)}")
            raise e
        except Exception as e:
            logger.error(f"Google token verification error: {str(e)}")
            raise e

    @staticmethod
    def verify_google_token_fallback(token):
        """
        Fallback method using Google's tokeninfo endpoint
        """
        try:
            response = requests.get(
                f'https://oauth2.googleapis.com/tokeninfo?id_token={token}',
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                
                # Verify audience
                client_id = getattr(settings, 'GOOGLE_OAUTH_CLIENT_ID', None)
                if client_id and data.get('aud') != client_id:
                    raise ValueError("Token audience doesn't match")
                
                # Fix: Convert string 'true'/'false' to boolean
                email_verified = data.get('email_verified', 'false')
                if isinstance(email_verified, str):
                    email_verified = email_verified.lower() == 'true'
                
                return {
                    'email': data.get('email', '').lower(),
                    'first_name': data.get('given_name', ''),
                    'last_name': data.get('family_name', ''),
                    'name': data.get('name', ''),
                    'picture': data.get('picture', ''),
                    'email_verified': email_verified,
                    'sub': data.get('sub')
                }
            else:
                error_msg = response.json().get('error_description', 'Unknown Error') if response.headers.get('content-type', '').startswith('application/json') else 'Unknown Error'
                raise ValueError(f"Google API returned status {response.status_code}: {error_msg}")
                
        except requests.RequestException as e:
            logger.error(f"Google tokeninfo request failed: {str(e)}")
            raise ValueError(f"Failed to connect to Google API: {str(e)}")
        except Exception as e:
            logger.error(f"Google tokeninfo fallback failed: {str(e)}")
            raise e

    @staticmethod
    def create_username_from_google_info(google_info):
        """
        Generate a unique username from Google profile info
        """
        name = google_info.get('name', '')
        email = google_info.get('email', '')
        first_name = google_info.get('first_name', '')
        
        # Priority: Name, then First Name, then Email prefix
        if name:
            base_username = re.sub(r'[^a-zA-Z0-9_]', '', name.replace(' ', '_').lower())
        elif first_name:
            base_username = re.sub(r'[^a-zA-Z0-9_]', '', first_name.lower())
        else:
            base_username = email.split('@')[0] if '@' in email else 'user'
            base_username = re.sub(r'[^a-zA-Z0-9_]', '', base_username)
        
        # Ensure base_username is not empty and starts with alphanumeric
        if not base_username or not base_username[0].isalnum():
            base_username = "user"
        
        # Ensure minimum length
        if len(base_username) < 3:
            base_username = base_username + "123"
            
        # Ensure reasonable length
        base_username = base_username[:25]
        
        # Ensure uniqueness
        username = base_username
        counter = 1
        while User.objects.filter(username=username).exists():
            suffix = f"{counter}"
            username = f"{base_username[:147-len(suffix)]}_{suffix}"
            counter += 1
            if counter > 1000:
                raise ValueError("Could not generate unique username after 1000 attempts")
        
        return username

    @staticmethod
    def get_or_create_google_user(google_info):
        """
        Get existing user or create new one from Google info
        """
        email = google_info.get('email', '').strip().lower()
        
        if not email:
            raise ValueError("No email provided by Google")
        
        try:
            # 1. Try to get existing user by email
            user = User.objects.get(email=email)
            logger.info(f"Existing Google user found: {user.username}")
            return user, False
            
        except User.DoesNotExist:
            # 2. Create new user
            username = GoogleOAuthService.create_username_from_google_info(google_info)
            
            try:
                user = User.objects.create_user(
                    username=username,
                    email=email,
                    first_name=google_info.get('first_name', '')[:30],
                    last_name=google_info.get('last_name', '')[:30],
                )
                
                # Mark as OAuth user (no password)
                user.set_unusable_password()
                user.save()
                
                # Update profile for Google user
                user.profile.is_google_user = True
                user.profile.google_id = google_info.get('sub')
                user.profile.email_verified = True
                if google_info.get('picture'):
                    # In a real implementation, you might want to download the picture
                    pass
                user.profile.save()
                
                logger.info(f"New Google user created: {username}")
                return user, True
                
            except IntegrityError as e:
                logger.error(f"IntegrityError creating user: {str(e)}")
                try:
                    user = User.objects.get(email=email)
                    return user, False
                except User.DoesNotExist:
                    raise IntegrityError("Failed to create or retrieve user")

# ============================================
# AUTHENTICATION VIEWS
# ============================================

@csrf_exempt
@require_http_methods(["POST"])
def register_api(request):
    """
    Register a new user with email/password
    """
    try:
        data = parse_json_request(request)
        if data is None:
            return error_response("Invalid JSON data", 400)

        username = data.get("username", "").strip()
        email = data.get("email", "").strip().lower()
        password = data.get("password", "")
        phone_number = data.get("phone_number", "").strip()
        country_code = data.get("country_code", "+91")

        # 1. Validation
        is_valid, error_msg = validate_username(username)
        if not is_valid: 
            return error_response(error_msg, 400)

        is_valid, error_msg = validate_email_format(email)
        if not is_valid: 
            return error_response(error_msg, 400)

        is_valid, error_msg = validate_password_strength(password)
        if not is_valid: 
            return error_response(error_msg, 400)

        # 2. Check for existing users
        if User.objects.filter(username=username).exists():
            return error_response("Username is already taken", 409)
        if User.objects.filter(email=email).exists():
            return error_response("Email is already in use", 409)

        # 3. Create user
        try:
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password
            )
            
            # Update profile with phone number if provided
            if phone_number:
                user.profile.phone_number = phone_number
                user.profile.country_code = country_code
                user.profile.save()
                
        except IntegrityError:
            return error_response("User creation failed due to conflict", 409)
        
        # 4. Log the user in
        login(request, user, backend='django.contrib.auth.backends.ModelBackend')
        
        # Create activity log
        UserActivity.objects.create(
            user=user,
            activity_type='login',
            title='Account Created',
            description='Welcome to InsightStox! Your account has been successfully created.'
        )
        
        logger.info(f"New user registered and logged in: {username}")
        
        response_data = {
            "username": user.username,
            "email": user.email,
            "auth_method": "email_password"
        }
        
        return success_response(response_data, "Registration successful", 201)
        
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
    """
    try:
        data = parse_json_request(request)
        if data is None:
            return error_response("Invalid JSON data", 400)

        identifier = data.get("identifier", "").strip()
        password = data.get("password", "")

        if not identifier or not password:
            return error_response("Email/username and password are required", 400)

        user = None
        
        # Try email first, then username
        is_valid_email, _ = validate_email_format(identifier)
        if is_valid_email:
            identifier = identifier.lower()
            try:
                user_obj = User.objects.get(email=identifier)
                user = authenticate(request, username=user_obj.username, password=password)
            except User.DoesNotExist:
                pass
        
        # If not found by email, try username
        if user is None:
            user = authenticate(request, username=identifier, password=password)

        if user is not None:
            if not user.is_active:
                return error_response("Account is disabled", 403)
            
            login(request, user, backend='django.contrib.auth.backends.ModelBackend')
            
            # Create activity log
            UserActivity.objects.create(
                user=user,
                activity_type='login',
                title='User Login',
                description='User logged in successfully'
            )
            
            logger.info(f"User logged in: {user.username}")
            
            return success_response({
                "username": user.username,
                "email": user.email,
                "auth_method": "email_password"
            }, "Login successful")
            
        else:
            logger.warning(f"Failed login attempt for: {identifier}")
            return error_response("Invalid credentials", 401)
            
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        return error_response("Login failed due to server error", 500)

@csrf_exempt
@require_http_methods(["POST"])
def google_login_api(request):
    """
    Handle Google OAuth login/registration
    """
    try:
        data = parse_json_request(request)
        if data is None:
            return error_response("Invalid JSON data", 400)

        token = data.get("token")
        if not token:
            return error_response("Google token is required", 400)

        # Verify Google token and get user info
        try:
            google_info = GoogleOAuthService.verify_google_token(token)
        except ValueError as e:
            return error_response(f"Invalid Google token: {str(e)}", 400)
        
        # Check if email is verified
        if not google_info.get('email_verified', False):
            return error_response("Google email not verified", 400)

        # Get or create user
        try:
            user, created = GoogleOAuthService.get_or_create_google_user(google_info)
        except IntegrityError:
            return error_response("User creation failed due to conflict", 500)
        except ValueError as e:
            return error_response(str(e), 400)
        
        # Log the user in
        login(request, user, backend='django.contrib.auth.backends.ModelBackend')
        
        # Create activity log
        activity_type = 'login' if not created else 'profile_update'
        activity_title = 'Google Login' if not created else 'Account Created via Google'
        UserActivity.objects.create(
            user=user,
            activity_type=activity_type,
            title=activity_title,
            description=f"{'New user registered' if created else 'User logged in'} via Google OAuth"
        )
        
        message = "Registration successful" if created else "Login successful"
        logger.info(f"Google {'registration' if created else 'login'} successful: {user.username}")
        
        return success_response(
            {
                "username": user.username,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "is_new_user": created,
                "auth_method": "google_oauth"
            },
            message
        )

    except Exception as e:
        logger.error(f"Google login error: {str(e)}")
        return error_response(
            "Google authentication failed", 
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

# ============================================
# PROFILE MANAGEMENT VIEWS
# ============================================

@login_required
@require_http_methods(["GET"])
def profile_dashboard(request):
    """
    Get complete user profile data for dashboard
    """
    try:
        user = request.user
        profile = user.profile
        
        # Get recent activities
        recent_activities = UserActivity.objects.filter(user=user)[:10]
        activities_data = []
        for activity in recent_activities:
            activities_data.append({
                'id': str(activity.id),
                'type': activity.activity_type,
                'title': activity.title,
                'description': activity.description,
                'date': activity.created_at.strftime('%b %d, %Y'),
                'timestamp': activity.created_at.isoformat(),
            })
        
        profile_data = {
            "personal_info": {
                "username": user.username,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "phone_number": profile.phone_number,
                "country_code": profile.country_code,
                "date_of_birth": profile.date_of_birth.isoformat() if profile.date_of_birth else None,
                "bio": profile.bio,
                "joined_date": user.date_joined.strftime('%m/%d/%Y'),
                "profile_picture": profile.profile_picture.url if profile.profile_picture else None,
            },
            "settings": {
                "theme_preference": profile.theme_preference,
                "email_notifications": profile.email_notifications,
            },
            "recent_activities": activities_data,
            "statistics": {
                "total_activities": UserActivity.objects.filter(user=user).count(),
                "total_feedbacks": Feedback.objects.filter(user=user).count(),
                "total_tickets": SupportTicket.objects.filter(user=user).count(),
            }
        }
        
        return success_response(profile_data, "Profile data retrieved successfully")
        
    except Exception as e:
        logger.error(f"Profile dashboard error: {str(e)}")
        return error_response("Failed to load profile data", 500)

@login_required
@require_http_methods(["GET", "POST"])
def update_profile(request):
    """
    Update user profile information
    """
    try:
        user = request.user
        profile = user.profile
        
        if request.method == 'POST':
            data = parse_json_request(request)
            if data is None:
                return error_response("Invalid JSON data", 400)
            
            # Update user fields
            if 'first_name' in data:
                user.first_name = data['first_name'][:30]
            if 'last_name' in data:
                user.last_name = data['last_name'][:30]
            if 'email' in data:
                new_email = data['email'].strip().lower()
                if new_email != user.email:
                    # Check if email is already taken
                    if User.objects.filter(email=new_email).exclude(pk=user.pk).exists():
                        return error_response("Email is already in use", 409)
                    user.email = new_email
            
            # Update profile fields
            if 'phone_number' in data:
                profile.phone_number = data['phone_number']
            if 'country_code' in data:
                profile.country_code = data['country_code']
            if 'date_of_birth' in data:
                profile.date_of_birth = data['date_of_birth']
            if 'bio' in data:
                profile.bio = data['bio']
            
            user.save()
            profile.save()
            
            # Create activity log
            UserActivity.objects.create(
                user=user,
                activity_type='profile_update',
                title='Profile Updated',
                description='Updated personal information'
            )
            
            return success_response(message="Profile updated successfully")
        
        else:
            # GET request - return current profile data
            profile_data = {
                "username": user.username,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "phone_number": profile.phone_number,
                "country_code": profile.country_code,
                "date_of_birth": profile.date_of_birth.isoformat() if profile.date_of_birth else None,
                "bio": profile.bio,
                "joined_date": user.date_joined.strftime('%m/%d/%Y'),
                "profile_picture": profile.profile_picture.url if profile.profile_picture else None,
            }
            
            return success_response(profile_data)
            
    except Exception as e:
        logger.error(f"Update profile error: {str(e)}")
        return error_response("Failed to update profile", 500)

# ============================================
# ACTIVITY LOG VIEWS
# ============================================

@login_required
@require_http_methods(["GET"])
def activity_log(request):
    """
    Get user activity log with filtering
    """
    try:
        user = request.user
        activities = UserActivity.objects.filter(user=user)
        
        # Filter by type if specified
        activity_type = request.GET.get('type')
        if activity_type:
            activities = activities.filter(activity_type=activity_type)
        
        # Limit if specified
        limit = request.GET.get('limit')
        if limit and limit.isdigit():
            activities = activities[:int(limit)]
        else:
            activities = activities[:50]  # Default limit
        
        activities_data = []
        for activity in activities:
            activities_data.append({
                'id': str(activity.id),
                'type': activity.activity_type,
                'title': activity.title,
                'description': activity.description,
                'date': activity.created_at.strftime('%b %d, %Y'),
                'timestamp': activity.created_at.isoformat(),
                'content_type': activity.content_type,
                'object_id': str(activity.object_id) if activity.object_id else None,
            })
        
        return success_response({
            'activities': activities_data,
            'total_count': UserActivity.objects.filter(user=user).count(),
            'filtered_count': len(activities_data)
        })
        
    except Exception as e:
        logger.error(f"Activity log error: {str(e)}")
        return error_response("Failed to load activity log", 500)

# ============================================
# SETTINGS VIEWS
# ============================================

@login_required
@require_http_methods(["GET", "POST"])
def user_settings(request):
    """
    Handle user settings (theme, notifications)
    """
    try:
        profile = request.user.profile
        
        if request.method == 'POST':
            data = parse_json_request(request)
            if data is None:
                return error_response("Invalid JSON data", 400)
            
            updated_fields = []
            
            if 'theme_preference' in data:
                if data['theme_preference'] in dict(profile.THEME_CHOICES):
                    profile.theme_preference = data['theme_preference']
                    updated_fields.append('theme')
            
            if 'email_notifications' in data:
                profile.email_notifications = bool(data['email_notifications'])
                updated_fields.append('notifications')
            
            profile.save()
            
            if updated_fields:
                # Create activity log
                UserActivity.objects.create(
                    user=request.user,
                    activity_type='profile_update',
                    title='Settings Updated',
                    description=f'Updated: {", ".join(updated_fields)}'
                )
            
            return success_response(message="Settings updated successfully")
        
        else:
            # GET request - return current settings
            settings_data = {
                "theme_preference": profile.theme_preference,
                "email_notifications": profile.email_notifications,
                "available_themes": dict(profile.THEME_CHOICES)
            }
            
            return success_response(settings_data)
            
    except Exception as e:
        logger.error(f"User settings error: {str(e)}")
        return error_response("Failed to update settings", 500)

@login_required
@require_http_methods(["POST"])
def change_password(request):
    """
    Change user password
    """
    try:
        data = parse_json_request(request)
        if data is None:
            return error_response("Invalid JSON data", 400)
            
        current_password = data.get('current_password')
        new_password = data.get('new_password')
        
        if not current_password or not new_password:
            return error_response("Current password and new password are required", 400)
        
        # Verify current password
        if not request.user.check_password(current_password):
            return error_response("Current password is incorrect", 400)
        
        # Validate new password strength
        is_valid, error_msg = validate_password_strength(new_password)
        if not is_valid:
            return error_response(error_msg, 400)
        
        # Set new password
        request.user.set_password(new_password)
        request.user.save()
        
        # Re-login the user
        login(request, request.user)
        
        # Create activity log
        UserActivity.objects.create(
            user=request.user,
            activity_type='password_change',
            title='Password Changed',
            description='User changed their password successfully'
        )
        
        return success_response(message="Password changed successfully")
        
    except Exception as e:
        logger.error(f"Change password error: {str(e)}")
        return error_response("Failed to change password", 500)

# ============================================
# FEEDBACK & SUPPORT VIEWS
# ============================================

@login_required
@require_http_methods(["GET", "POST"])
def feedback(request):
    """
    Handle user feedback and suggestions
    """
    try:
        if request.method == 'POST':
            data = parse_json_request(request)
            if data is None:
                return error_response("Invalid JSON data", 400)
            
            subject = data.get('subject', '').strip()
            message = data.get('message', '').strip()
            feedback_type = data.get('type', 'general')
            
            if not subject or not message:
                return error_response("Subject and message are required", 400)
            
            feedback_obj = Feedback.objects.create(
                user=request.user,
                feedback_type=feedback_type,
                subject=subject,
                message=message
            )
            
            # Create activity log
            UserActivity.objects.create(
                user=request.user,
                activity_type='profile_update',
                title='Feedback Submitted',
                description=f'Feedback: {subject}'
            )
            
            return success_response({
                'feedback_id': str(feedback_obj.id)
            }, 'Feedback submitted successfully')
        
        else:
            # GET request - return user's feedback history
            user_feedbacks = Feedback.objects.filter(user=request.user)
            feedbacks_data = []
            
            for fb in user_feedbacks:
                feedbacks_data.append({
                    'id': str(fb.id),
                    'type': fb.feedback_type,
                    'subject': fb.subject,
                    'message': fb.message,
                    'status': fb.status,
                    'date': fb.created_at.strftime('%b %d, %Y'),
                    'admin_notes': fb.admin_notes if fb.admin_notes else None,
                })
            
            return success_response({'feedbacks': feedbacks_data})
            
    except Exception as e:
        logger.error(f"Feedback error: {str(e)}")
        return error_response("Failed to submit feedback", 500)

@login_required
@require_http_methods(["GET", "POST"])
def support_tickets(request):
    """
    Handle support tickets
    """
    try:
        if request.method == 'POST':
            data = parse_json_request(request)
            if data is None:
                return error_response("Invalid JSON data", 400)
            
            subject = data.get('subject', '').strip()
            message = data.get('message', '').strip()
            priority = data.get('priority', 'medium')
            
            if not subject or not message:
                return error_response("Subject and message are required", 400)
            
            ticket = SupportTicket.objects.create(
                user=request.user,
                subject=subject,
                message=message,
                priority=priority
            )
            
            # Create activity log
            UserActivity.objects.create(
                user=request.user,
                activity_type='profile_update',
                title='Support Ticket Created',
                description=f'Ticket: {subject}'
            )
            
            return success_response({
                'ticket_id': str(ticket.id)
            }, 'Support ticket submitted successfully')
        
        else:
            # GET request - return user's support tickets
            user_tickets = SupportTicket.objects.filter(user=request.user)
            tickets_data = []
            
            for ticket in user_tickets:
                tickets_data.append({
                    'id': str(ticket.id),
                    'subject': ticket.subject,
                    'message': ticket.message,
                    'priority': ticket.priority,
                    'status': ticket.status,
                    'admin_response': ticket.admin_response if ticket.admin_response else None,
                    'date': ticket.created_at.strftime('%b %d, %Y'),
                    'updated_date': ticket.updated_at.strftime('%b %d, %Y'),
                })
            
            return success_response({'tickets': tickets_data})
            
    except Exception as e:
        logger.error(f"Support tickets error: {str(e)}")
        return error_response("Failed to create support ticket", 500)

# ============================================
# DATA & PRIVACY VIEWS
# ============================================

@login_required
@require_http_methods(["GET"])
def user_data_export(request):
    """
    Export all user data
    """
    try:
        user = request.user
        profile = user.profile
        
        user_data = {
            'user': {
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'date_joined': user.date_joined.isoformat(),
                'last_login': user.last_login.isoformat() if user.last_login else None,
                'is_active': user.is_active,
            },
            'profile': {
                'phone_number': profile.phone_number,
                'country_code': profile.country_code,
                'date_of_birth': profile.date_of_birth.isoformat() if profile.date_of_birth else None,
                'bio': profile.bio,
                'theme_preference': profile.theme_preference,
                'email_notifications': profile.email_notifications,
                'is_google_user': profile.is_google_user,
                'email_verified': profile.email_verified,
                'created_at': profile.created_at.isoformat(),
                'updated_at': profile.updated_at.isoformat(),
            },
            'statistics': {
                'total_activities': UserActivity.objects.filter(user=user).count(),
                'total_feedbacks': Feedback.objects.filter(user=user).count(),
                'total_tickets': SupportTicket.objects.filter(user=user).count(),
            }
        }
        
        return success_response(user_data, "Data export generated successfully")
        
    except Exception as e:
        logger.error(f"Data export error: {str(e)}")
        return error_response("Failed to generate data export", 500)

@login_required
@require_http_methods(["POST"])
def delete_account(request):
    """
    Permanently delete user account
    """
    try:
        data = parse_json_request(request)
        if data is None:
            return error_response("Invalid JSON data", 400)
            
        confirmation = data.get('confirmation', '').strip()
        
        if confirmation != 'DELETE MY ACCOUNT':
            return error_response("Confirmation text does not match", 400)
        
        # Store user info for logging before deletion
        username = request.user.username
        email = request.user.email
        
        # Deactivate user instead of immediate deletion (safer approach)
        user = request.user
        user.is_active = False
        user.save()
        
        # Logout user
        logout(request)
        
        logger.info(f"Account deletion scheduled for user: {username} ({email})")
        
        return success_response(
            message="Account deletion scheduled. All data will be removed within 30 days."
        )
        
    except Exception as e:
        logger.error(f"Account deletion error: {str(e)}")
        return error_response("Failed to delete account", 500)

# ============================================
# UTILITY & AUTH CHECK VIEWS
# ============================================

@csrf_exempt
@require_http_methods(["GET"])
@authentication_classes([SessionAuthentication])
@permission_classes([AllowAny])
def check_auth_api(request):
    """
    Check if user is authenticated and return user info
    """
    if request.user.is_authenticated:
        user = request.user
        profile = user.profile
        
        return success_response({
            "authenticated": True,
            "username": user.username,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "profile_picture": profile.profile_picture.url if profile.profile_picture else None,
            "is_google_user": profile.is_google_user,
            "theme_preference": profile.theme_preference,
        })
    else:
        return success_response({
            "authenticated": False
        })

@csrf_exempt
@require_http_methods(["GET"])
@authentication_classes([SessionAuthentication])
@permission_classes([IsAuthenticated])
def user_profile_api(request):
    """
    Get current user profile information (legacy endpoint)
    """
    try:
        user = request.user
        profile = user.profile
        
        return success_response({
            "username": user.username,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "phone_number": profile.phone_number,
            "date_of_birth": profile.date_of_birth.isoformat() if profile.date_of_birth else None,
            "bio": profile.bio,
            "date_joined": user.date_joined.isoformat() if user.date_joined else None,
            "profile_picture": profile.profile_picture.url if profile.profile_picture else None,
        })
    except Exception as e:
        logger.error(f"Profile fetch error: {str(e)}")
        return error_response("Failed to fetch profile", 500)

@csrf_exempt
@require_http_methods(["GET"])
def test_api(request):
    """
    Test endpoint to verify API is working
    """
    return success_response({
        "status": "API is working",
        "method": request.method,
        "user_authenticated": request.user.is_authenticated,
        "user": request.user.username if request.user.is_authenticated else "Anonymous"
    })

@ensure_csrf_cookie
@require_http_methods(["GET"])
def get_csrf_token(request):
    """
    Get CSRF token for React/SPA app
    """
    return success_response({"csrftoken": get_token(request)})

@csrf_exempt
@require_http_methods(["GET"])
def auth_methods_api(request):
    """
    Return available authentication methods
    """
    methods = {
        "email_password": True,
        "google_oauth": bool(getattr(settings, 'GOOGLE_OAUTH_CLIENT_ID', None)),
    }
    return success_response({"auth_methods": methods})

@csrf_exempt
@require_http_methods(["GET"])
def debug_session(request):
    """
    Debug endpoint to check session settings
    """
    if not settings.DEBUG:
        return error_response("Debug endpoint only available in DEBUG mode", 403)
        
    debug_info = {
        'session_key': request.session.session_key if hasattr(request, 'session') else 'N/A',
        'session_exists': hasattr(request, 'session'),
        'user_authenticated': request.user.is_authenticated,
        'user': request.user.username if request.user.is_authenticated else None,
        'session_cookie_name': getattr(settings, 'SESSION_COOKIE_NAME', 'sessionid'),
        'session_cookie_domain': getattr(settings, 'SESSION_COOKIE_DOMAIN', None),
        'session_cookie_secure': getattr(settings, 'SESSION_COOKIE_SECURE', False),
        'session_cookie_httponly': getattr(settings, 'SESSION_COOKIE_HTTPONLY', True),
        'session_cookie_samesite': getattr(settings, 'SESSION_COOKIE_SAMESITE', 'Lax'),
    }
    
    return success_response(debug_info)