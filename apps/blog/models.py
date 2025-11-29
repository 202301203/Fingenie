# blogs/models.py
from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from apps.accounts.models import UserActivity
from model_utils import FieldTracker


class BlogPost(models.Model):
    CATEGORY_CHOICES = [
        ('Investments', 'Investments'),
        ('Personal Finance', 'Personal Finance'),
        ('Market Analysis', 'Market Analysis'),
        ('Future of Finance', 'Future of Finance'),
    ]
    
    title = models.CharField(max_length=200)
    content = models.TextField()
    snippet = models.TextField(max_length=300)
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='blog_posts')
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default='Investments')
    image = models.ImageField(upload_to='blog_images/', blank=True, null=True)
    
    # Status fields
    published = models.BooleanField(default=True)
    featured = models.BooleanField(default=False)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Analytics (optional)
    views = models.PositiveIntegerField(default=0)
    likes = models.PositiveIntegerField(default=0)

    tracker = FieldTracker(fields=['published'])
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Blog Post'
        verbose_name_plural = 'Blog Posts'
    
    def __str__(self):
        return self.title
    
    def get_author_name(self):
        return self.author.username
    
    def increment_views(self):
        self.views += 1
        self.save()


class BlogLike(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    post = models.ForeignKey(BlogPost, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['user', 'post']


class BlogBookmark(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    post = models.ForeignKey(BlogPost, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['user', 'post']


# ============================================
# ACTIVITY LOGGING SIGNALS FOR BLOG APP
# ============================================

@receiver(post_save, sender=BlogPost)
def create_blog_post_activity(sender, instance, created, **kwargs):
    """
    Create activity log when a blog post is published
    """
    if created and instance.published:
        UserActivity.objects.create(
            user=instance.author,
            activity_type='blog_post',
            title=f'Published: {instance.title}',
            description=f'Blog post published in {instance.category} category',
            content_type='blog',
            object_id=instance.id
        )
    elif instance.published and 'published' in instance.tracker.changed():
        # Blog post was just published (was draft before)
        UserActivity.objects.create(
            user=instance.author,
            activity_type='blog_post',
            title=f'Published: {instance.title}',
            description=f'Blog post published in {instance.category} category',
            content_type='blog',
            object_id=instance.id
        )


@receiver(post_save, sender=BlogLike)
def create_blog_like_activity(sender, instance, created, **kwargs):
    """
    Create activity log when a user likes a blog post
    """
    if created:
        # Activity for the user who liked the post
        UserActivity.objects.create(
            user=instance.user,
            activity_type='blog_like',
            title=f'Liked: {instance.post.title}',
            description=f'Liked blog post by {instance.post.author.username}',
            content_type='blog',
            object_id=instance.post.id
        )
        
        # Also update the likes count on the blog post
        instance.post.likes = BlogLike.objects.filter(post=instance.post).count()
        instance.post.save()


@receiver(post_delete, sender=BlogLike)
def update_blog_likes_on_delete(sender, instance, **kwargs):
    """
    Update likes count when a like is removed
    """
    instance.post.likes = BlogLike.objects.filter(post=instance.post).count()
    instance.post.save()


@receiver(post_save, sender=BlogBookmark)
def create_blog_bookmark_activity(sender, instance, created, **kwargs):
    """
    Create activity log when a user bookmarks a blog post
    """
    if created:
        UserActivity.objects.create(
            user=instance.user,
            activity_type='blog_like',  # Using 'blog_like' type for bookmarks too
            title=f'Bookmarked: {instance.post.title}',
            description=f'Bookmarked blog post for later reading',
            content_type='blog',
            object_id=instance.post.id
        )
