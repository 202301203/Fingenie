# accounts/models.py
from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
import uuid


class UserProfile(models.Model):
    """
    Extended user profile with additional information
    """
    THEME_CHOICES = [
        ('light', 'Light Mode'),
        ('dark', 'Dark Mode'),
        ('auto', 'Auto (System)'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    country_code = models.CharField(max_length=5, default='+91')
    date_of_birth = models.DateField(blank=True, null=True)
    profile_picture = models.ImageField(upload_to='profile_pics/', blank=True, null=True)
    bio = models.TextField(max_length=500, blank=True)
    
    # Theme and notification preferences
    theme_preference = models.CharField(
        max_length=10, 
        choices=THEME_CHOICES, 
        default='light'
    )
    email_notifications = models.BooleanField(default=True)
    
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


class UserActivity(models.Model):
    """
    Track user activities for the activity log
    """
    ACTIVITY_TYPES = [
        ('analysis', 'Financial Analysis'),
        ('blog_post', 'Blog Post'),
        ('blog_like', 'Blog Like'),
        ('blog_comment', 'Blog Comment'),
        ('profile_update', 'Profile Update'),
        ('login', 'User Login'),
        ('password_change', 'Password Change'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='activities')
    activity_type = models.CharField(max_length=20, choices=ACTIVITY_TYPES)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    
    # Reference to related objects (optional)
    content_type = models.CharField(max_length=50, blank=True)  # 'blog', 'analysis', etc.
    object_id = models.UUIDField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name_plural = 'User Activities'
    
    def __str__(self):
        return f"{self.user.username} - {self.activity_type} - {self.title}"


class Feedback(models.Model):
    """
    User feedback and feature suggestions
    """
    FEEDBACK_TYPES = [
        ('feature', 'Feature Suggestion'),
        ('bug', 'Bug Report'),
        ('improvement', 'Improvement Idea'),
        ('general', 'General Feedback'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('in_review', 'In Review'),
        ('completed', 'Completed'),
        ('rejected', 'Rejected'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='feedbacks')
    feedback_type = models.CharField(max_length=20, choices=FEEDBACK_TYPES, default='general')
    subject = models.CharField(max_length=255)
    message = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    admin_notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.username} - {self.subject}"


class SupportTicket(models.Model):
    """
    User support tickets
    """
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ]
    
    STATUS_CHOICES = [
        ('open', 'Open'),
        ('in_progress', 'In Progress'),
        ('resolved', 'Resolved'),
        ('closed', 'Closed'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='support_tickets')
    subject = models.CharField(max_length=255)
    message = models.TextField()
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')
    admin_response = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.username} - {self.subject}"


# ============================================
# SIGNALS AND AUTOMATIC PROFILE CREATION
# ============================================

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


@receiver(post_save, sender=User)
def create_welcome_activity(sender, instance, created, **kwargs):
    """Create welcome activity when user is created"""
    if created:
        UserActivity.objects.create(
            user=instance,
            activity_type='login',
            title='Account Created',
            description='Welcome to InsightStox! Your account has been successfully created.'
        )
