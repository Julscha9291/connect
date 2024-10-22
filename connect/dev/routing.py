# backend/connect/routing.py
from django.urls import re_path
from channels.auth import AuthMiddlewareStack
from channels.routing import ProtocolTypeRouter, URLRouter
from .consumers import ChatConsumer
from .ThreadConsumer import ThreadConsumer  # Importiere den ThreadConsumer

websocket_urlpatterns = [
    re_path(r'ws/chat/(?P<channel_id>\w+)/$', ChatConsumer.as_asgi()),
    re_path(r'ws/user/(?P<user_id>\d+)/$', ChatConsumer.as_asgi()),
    re_path(r'ws/chat/(?P<chat_id>\d+)/(?P<is_private>true|false)/$', ChatConsumer.as_asgi()),
     re_path(r'ws/threads/(?P<message_id>\d+)/$', ThreadConsumer.as_asgi()),  # Neue Route für ThreadConsumer
]

application = ProtocolTypeRouter(
    {
        "websocket": AuthMiddlewareStack(
            URLRouter(websocket_urlpatterns)
        ),
    }
)