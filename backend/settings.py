from pathlib import Path
import os

STATIC_URL = '/static/'


BASE_DIR = Path(__file__).resolve().parent.parent
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
SECRET_KEY = "dev-key"

DEBUG = True

ALLOWED_HOSTS = ['https://escape-room-backend-7li4.onrender.com']

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    'rest_framework_simplejwt',
    'rest_framework',
    'corsheaders',

    'users',
    'challenges',
    'gameplay',
    'leaderboard',
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",

    "corsheaders.middleware.CorsMiddleware",
]

CORS_ALLOW_ALL_ORIGINS = False

CSRF_TRUSTED_ORIGINS = ["https://escape-room-frontend-etz4.onrender.com"]

ROOT_URLCONF = "backend.urls"

TEMPLATES = []

WSGI_APPLICATION = "backend.wsgi.application"

STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'
TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
}
