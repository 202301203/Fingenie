from django.db import models

# Create your models here.
from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver


class UserProfile(models.Model):
    """
    Extended user profile with additional information
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    country_code = models.CharField(max_length=5, default='+91')
    date_of_birth = models.DateField(blank=True, null=True)
    profile_picture = models.ImageField(upload_to='profile_pics/', blank=True, null=True)
    bio = models.TextField(max_length=500, blank=True)
    
    # OAuth information
    is_google_user = models.BooleanField(default=False)
    google_id = models.CharField(max_length=255, blank=True, null=True, unique=True)
    
    # Account metadata
    email_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.user.username}'s Profile"
    
    class Meta:
        verbose_name = 'User Profile'
        verbose_name_plural = 'User Profiles'


# Automatically create profile when user is created
@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    """Create a UserProfile whenever a User is created"""
    if created:
        UserProfile.objects.create(user=instance)


@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    """Save the UserProfile whenever the User is saved"""
    if hasattr(instance, 'profile'):
        instance.profile.save()


# ============================================
# Updated views.py to use UserProfile
# ============================================

# Add this to your register_api function to save phone number:
def register_api_with_profile(request):
    """Updated registration with phone number support"""
    data = parse_json(request)
    
    if data is None:
        return JsonResponse({"error": "Invalid JSON data"}, status=400)

    username = data.get("username", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    phone_number = data.get("phone_number", "").strip()  # New field
    country_code = data.get("country_code", "+91")  # New field

    # ... (rest of validation code same as before)

    try:
        # Create user
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password
        )
        
        # Update profile with phone number
        if phone_number:
            user.profile.phone_number = phone_number
            user.profile.country_code = country_code
            user.profile.save()
        
        # Log the user in
        login(request, user)
        
        logger.info(f"New user registered: {username}")
        
        return JsonResponse({
            "success": True,
            "username": user.username,
            "email": user.email,
            "message": "User created successfully"
        }, status=201)
        
    except Exception as e:
        logger.error(f"Registration error: {str(e)}")
        return JsonResponse({"error": "Registration failed. Please try again."}, status=500)


# Add this to your google_login_api to mark OAuth users:
def google_login_api_with_profile(request):
    """Updated Google login with profile support"""
    # ... (same validation code)
    
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        # Create new user
        user = User.objects.create_user(
            username=username,
            email=email,
            first_name=given_name[:30] if given_name else "",
            last_name=family_name[:30] if family_name else ""
        )
        user.set_unusable_password()
        user.save()
        
        # Update profile for Google user
        user.profile.is_google_user = True
        user.profile.google_id = idinfo.get('sub')  # Google's unique ID
        user.profile.email_verified = True  # Google emails are pre-verified
        user.profile.save()