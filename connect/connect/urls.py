from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path, include
from dev.views import custom_404_view  
from django.views.generic import TemplateView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('dev.urls')),
    path('', TemplateView.as_view(template_name='index.html')),  
]

handler404 = custom_404_view

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)