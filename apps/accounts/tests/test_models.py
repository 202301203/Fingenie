import pytest
from django.contrib.auth.models import User
from apps.accounts.models import UserProfile

@pytest.mark.django_db
def test_user_profile_creation_signal():
    """Test that UserProfile is created automatically when User is created."""
    user = User.objects.create_user(username="testuser", password="password")
    assert hasattr(user, 'profile')
    assert isinstance(user.profile, UserProfile)
    assert user.profile.country_code == '+91'  # Default value

@pytest.mark.django_db
def test_user_profile_str():
    """Test the string representation of UserProfile."""
    user = User.objects.create_user(username="testuser", password="password")
    assert str(user.profile) == "testuser's Profile"

@pytest.mark.django_db
def test_user_profile_update():
    """Test updating UserProfile fields."""
    user = User.objects.create_user(username="testuser", password="password")
    profile = user.profile
    profile.phone_number = "1234567890"
    profile.bio = "Test Bio"
    profile.save()
    
    user.refresh_from_db()
    assert user.profile.phone_number == "1234567890"
    assert user.profile.bio == "Test Bio"


@pytest.mark.django_db
def test_profile_picture_blank_by_default():
    """Ensure the profile_picture field allows blank/null by default."""
    user = User.objects.create_user(username="picuser", password="password")
    # default should be None or empty
    assert getattr(user.profile, 'profile_picture') in (None, '')


def test_save_user_profile_no_profile_does_not_raise():
    """Calling the save signal with an object without profile should not raise."""
    from apps.accounts.models import save_user_profile
    class DummyUser:
        pass

    dummy = DummyUser()
    # Should simply return without exception
    save_user_profile(sender=None, instance=dummy)


@pytest.mark.django_db
def test_duplicate_google_id_raises_integrity_error():
    """Enforce unique constraint on `google_id` field via IntegrityError."""
    user1 = User.objects.create_user(username="g1", password="pwd")
    user2 = User.objects.create_user(username="g2", password="pwd")

    # Assign same google_id to both profiles
    user1.profile.google_id = 'GID-XYZ-123'
    user1.profile.save()

    user2.profile.google_id = 'GID-XYZ-123'
    import pytest as _pytest
    from django.db import IntegrityError as _IntegrityError

    with _pytest.raises(_IntegrityError):
        user2.profile.save()

