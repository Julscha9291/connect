from django.core.asgi import get_asgi_application
from channels.auth import AuthMiddlewareStack
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator
import dev.routing  # Ersetze durch den Pfad zu deiner Routing-Datei
from connect.token import TokenAuthMiddleware  # Importiere die TokenAuthMiddleware

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": AllowedHostsOriginValidator(
        TokenAuthMiddleware(  # Deine TokenAuthMiddleware
            AuthMiddlewareStack(
                URLRouter(
                    dev.routing.websocket_urlpatterns  # Ersetze durch deine WebSocket-URLs
                )
            )
        )
    ),
})
