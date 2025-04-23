from django.contrib.auth.models import AnonymousUser
from rest_framework.authtoken.models import Token
from channels.middleware import BaseMiddleware
from channels.db import database_sync_to_async
from urllib.parse import parse_qs
import logging

# Set up logging
logger = logging.getLogger(__name__)

@database_sync_to_async
def get_user_by_token(token_key):
    try:
        token = Token.objects.get(key=token_key)
        return token.user
    except Token.DoesNotExist:
        logger.warning(f"Invalid token: {token_key}")
        return AnonymousUser()
    except Exception as e:
        logger.error(f"Error authenticating token: {str(e)}")
        return AnonymousUser()

class TokenAuthMiddleware(BaseMiddleware):
    """
    Custom middleware that takes a token from the query string and authenticates via Django REST Framework authtoken.
    """
    async def __call__(self, scope, receive, send):
        try:
            # Get the token from query string
            query_string = scope.get('query_string', b'').decode()
            query_params = parse_qs(query_string)
            token = query_params.get('token', [''])[0]
            
            if token:
                # Get the user from the token
                scope['user'] = await get_user_by_token(token)
                logger.info(f"WebSocket authenticated user: {scope['user'].username}")
            else:
                scope['user'] = AnonymousUser()
                logger.warning("WebSocket connection with no token")
            
            return await super().__call__(scope, receive, send)
        except Exception as e:
            # Log any errors but don't crash
            logger.error(f"Error in TokenAuthMiddleware: {str(e)}")
            scope['user'] = AnonymousUser()
            return await super().__call__(scope, receive, send)

def TokenAuthMiddlewareStack(inner):
    return TokenAuthMiddleware(inner)