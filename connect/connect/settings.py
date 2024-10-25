"""
Django settings for connect project.

Generated by 'django-admin startproject' using Django 4.2.5.

For more information on this file, see
https://docs.djangoproject.com/en/4.2/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/4.2/ref/settings/
"""

from pathlib import Path
from datetime import timedelta
import os

BASE_DIR = Path(__file__).resolve().parent.parent
from decouple import config

SECRET_KEY = config('SECRET_KEY')

DEBUG = False

ALLOWED_HOSTS = ['127.0.0.1', 
                 'localhost', 
                 '127.0.0.1:62484', 
                 '127.0.0.1:54139',
                 'connect.julianschaepermeier.com',
                 'julianschaepermeier.com',
                 '85.22.34.217',
                 '172.17.0.1',
                 '172.17.0.1:8001',
                 '172.24.0.4']

INSTALLED_APPS = [
                'channels',
                'daphne',
                'django.contrib.admin',
                'django.contrib.auth',
                'django.contrib.contenttypes',
                'django.contrib.sessions',
                'django.contrib.messages',
                'django.contrib.staticfiles',
                'rest_framework_simplejwt',
                'corsheaders',
                'rest_framework',
                'dev', 
                ]

MIDDLEWARE = [
                'django.middleware.security.SecurityMiddleware',
                'django.contrib.sessions.middleware.SessionMiddleware',
                'corsheaders.middleware.CorsMiddleware',
                'django.middleware.common.CommonMiddleware',
                'django.middleware.csrf.CsrfViewMiddleware',
                'django.contrib.auth.middleware.AuthenticationMiddleware',
                'django.contrib.messages.middleware.MessageMiddleware',
                'django.middleware.clickjacking.XFrameOptionsMiddleware',
               # 'connect.middleware.AutoLogoutMiddleware', 
             ]

CORS_ORIGIN_ALLOW_ALL = True 
CSRF_COOKIE_SECURE = True

ASGI_APPLICATION = 'connect.asgi.application'

CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            "hosts": [('127.0.0.1', 6379)], 
        },
    },
}

CORS_ALLOWED_ORIGINS = [
    "https://connect.julianschaepermeier.com",
    "http://localhost:3000",
]

CSRF_TRUSTED_ORIGINS = [
    "http://localhost:3000",
    "https://connect.julianschaepermeier.com",
]

CORS_ALLOW_METHODS = [
    "DELETE",
    "GET",
    "OPTIONS",
    "PATCH",
    "POST",
    "PUT",
]

CORS_ALLOW_CREDENTIALS = True

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
}

REST_USE_JWT = True

AUTHENTICATION_BACKENDS = [
    'django.contrib.auth.backends.ModelBackend',
]

ROOT_URLCONF = 'connect.urls'

WEBSOCKET_URL = '/ws/'

MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

SESSION_ENGINE = 'django.contrib.sessions.backends.db'  

SESSION_COOKIE_AGE = 7200  

SESSION_SAVE_EVERY_REQUEST = True

SESSION_EXPIRE_AT_BROWSER_CLOSE = False

SESSION_COOKIE_SECURE = True  

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [os.path.join(BASE_DIR, '../frontend/build')],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'backend.wsgi.application'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

AUTH_USER_MODEL = 'dev.CustomUser'

SIMPLE_JWT = {
        'ACCESS_TOKEN_LIFETIME': timedelta(days=1),  
        'REFRESH_TOKEN_LIFETIME': timedelta(days=30), 
        'ROTATE_REFRESH_TOKENS': True,
        'BLACKLIST_AFTER_ROTATION': True,
        'AUTH_HEADER_TYPES': ('Bearer',),
}

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_TZ = True


STATIC_URL = '/static/'

STATICFILES_DIRS = [
    BASE_DIR / '../frontend/build/static',
]

STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

SECURE_HSTS_SECONDS = 31536000  
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
#SECURE_SSL_REDIRECT = True

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'