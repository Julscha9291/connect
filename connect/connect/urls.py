from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.views.static import serve  # Hier wird "serve" importiert
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('dev.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)