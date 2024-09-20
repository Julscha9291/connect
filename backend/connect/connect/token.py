from .middleware import BaseMiddleware
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import AccessToken
import urllib.parse

class TokenAuthMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        token = None
        if 'query_string' in scope:
            query_string = scope['query_string'].decode()
            query_params = urllib.parse.parse_qs(query_string)
            token = query_params.get('token', [None])[0]

        print(f"Token: {token}")  # Debug-Ausgabe

        if token:
            try:
                access_token = AccessToken(token)
                user_id = access_token['user_id']
                scope['user'] = await self.get_user(user_id)
                print(f"User from token: {scope['user']}")  # Debug-Ausgabe
            except Exception as e:
                print(f"Token error: {e}")
                scope['user'] = AnonymousUser()
        else:
            scope['user'] = AnonymousUser()

        await super().__call__(scope, receive, send)

    @database_sync_to_async
    def get_user(self, user_id):
        User = get_user_model()
        try:
            return User.objects.get(id=user_id)
        except User.DoesNotExist:
            return AnonymousUser()
