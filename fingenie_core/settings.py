"""
Django Settings – Fixed for Vercel Frontend + Render Backend
Auth + Google Login will now work in production
"""

from pathlib import Path
import os

BASE_DIR = Path(__file__).resolve().parent.parent

# ========================= SECURITY =========================
SECRET_KEY = 'django-insecure-cv1)6=wq(z30$=mc5l*df0*7qvhd8v7x7m(3le!3%(k62zbge0'

# Check if running locally or in production
IS_PRODUCTION = os.environ.get('RENDER', False) or os.environ.get('VERCEL', False)
DEBUG = not IS_PRODUCTION  # True for local, False for production

ALLOWED_HOSTS = [
    "fingenie-siu7.onrender.com",
    "fingenie-2exi.vercel.app",
    "localhost",
    "127.0.0.1",
]


# ========================= INSTALLED APPS =========================

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'corsheaders',
    'rest_framework',
    # Local apps
    'apps.accounts',
    'apps.dataprocessor',
    'apps.stockgraph',
    'apps.chatbot',
    'apps.learning',
    'apps.sector_overview',
    'apps.trends',
    'apps.ai_insights',
    'apps.blog',
    'apps.company_search',
]


# ========================= MIDDLEWARE =========================

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",  # MUST be at top
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]


# ========================= CORS / CSRF =========================
# 🔥 Allows frontend to send/receive auth cookies successfully

CORS_ALLOW_CREDENTIALS = True

CORS_ALLOWED_ORIGINS = [
    "https://fingenie-2exi.vercel.app",
    "http://localhost:3000",
]

CSRF_TRUSTED_ORIGINS = [
    "https://fingenie-2exi.vercel.app",
    "https://fingenie-siu7.onrender.com",
    "http://localhost:3000",
]


# ========================= COOKIE / SESSION FIX =========================
# Different settings for local vs production

SESSION_ENGINE = 'django.contrib.sessions.backends.db'
SESSION_COOKIE_NAME = "sessionid"
SESSION_COOKIE_HTTPONLY = True

if IS_PRODUCTION:
    # Production settings (Render/Vercel with HTTPS)
    SESSION_COOKIE_SECURE = True
    SESSION_COOKIE_SAMESITE = "None"
    SESSION_COOKIE_DOMAIN = ".onrender.com"
    CSRF_COOKIE_SECURE = True
    CSRF_COOKIE_SAMESITE = "None"
    CSRF_COOKIE_DOMAIN = ".onrender.com"
else:
    # Local development settings (HTTP on localhost)
    SESSION_COOKIE_SECURE = False
    SESSION_COOKIE_SAMESITE = "Lax"
    SESSION_COOKIE_DOMAIN = None
    CSRF_COOKIE_SECURE = False
    CSRF_COOKIE_SAMESITE = "Lax"
    CSRF_COOKIE_DOMAIN = None

CSRF_COOKIE_HTTPONLY = False

# ===============================================================

ROOT_URLCONF = 'fingenie_core.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'fingenie_core.wsgi.application'

# ========================= DATABASE =========================

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# ========================= PASSWORD VALIDATION =========================

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# ========================= LANGUAGE / TIME =========================

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# ========================= STATIC =========================

STATIC_URL = 'static/'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ========================= GOOGLE AUTH =========================

GOOGLE_OAUTH_CLIENT_ID = os.environ.get(
    "GOOGLE_OAUTH_CLIENT_ID",
    "972027062493-i944gk25qhn7qj8ut7ebu6jdnpud8des.apps.googleusercontent.com"
)

LOGIN_URL = "/accounts/api/login/"
