from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

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