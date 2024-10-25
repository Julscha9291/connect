from django.contrib.auth import logout
from django.shortcuts import redirect

class BaseMiddleware:
    """
    Base class for implementing ASGI middleware.

    Note that subclasses of this are not self-safe; don't store state on
    the instance, as it serves multiple application instances. Instead, use
    scope.
    """

    def __init__(self, inner):
        """
        Middleware constructor - just takes inner application.
        """
        self.inner = inner

    async def __call__(self, scope, receive, send):
        """
        ASGI application; can insert things into the scope and run asynchronous
        code.
        """
        scope = dict(scope)
        return await self.inner(scope, receive, send)
    
class AutoLogoutMiddleware(BaseMiddleware):
    """
    Middleware für die automatische Abmeldung, wenn die Session abgelaufen ist.
    """

    async def __call__(self, scope, receive, send):
        if scope['type'] == 'http':
            if scope['user'].is_authenticated:
                session = scope.get('session')
                if session and not session.exists(session.session_key):
                    logout(scope)
                    return await redirect('login')(scope, receive, send)

        return await super().__call__(scope, receive, send)  