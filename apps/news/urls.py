from django.urls import path
from . import views

app_name = 'news'

urlpatterns = [
    # Endpoint providing paginated articles; will be mounted directly at /api/articles/ by project urls
    path('api/articles/', views.article_api, name='article_api'),
]
