# Common_BS_finginie/urls.py
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('Common_BS_analysis.urls')),  # ✅ include app urls
]
