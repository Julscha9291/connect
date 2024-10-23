import os
from django.urls import re_path
from django.core.asgi import get_asgi_application

django_asgi_app = get_asgi_application()

from channels.auth import AuthMiddlewareStack
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator
import dev.routing  
from connect.token import TokenAuthMiddleware  

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'connect.settings')


application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": AllowedHostsOriginValidator(
        TokenAuthMiddleware(  
            AuthMiddlewareStack(
                URLRouter(
                    dev.routing.websocket_urlpatterns  
                )
            )
        )
    ),
})
