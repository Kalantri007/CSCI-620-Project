"""
ASGI config for chess_backend project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.2/howto/deployment/asgi/
"""

import os
import django
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
import logging

# Configure Django settings first
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'chess_backend.settings')
django.setup()

# Set up logging
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

# Initialize the Django ASGI application
django_asgi_app = get_asgi_application()

# Import WebSocket routing here to avoid circular imports
from chess_game.routing import websocket_urlpatterns
from chess_backend.middleware.auth import TokenAuthMiddlewareStack

# Define the ASGI application with both HTTP and WebSocket support
try:
    application = ProtocolTypeRouter({
        "http": django_asgi_app,
        "websocket": TokenAuthMiddlewareStack(
            URLRouter(
                websocket_urlpatterns
            )
        ),
    })
    logger.info("ASGI application configured successfully with WebSocket support")
except Exception as e:
    logger.error(f"Error configuring ASGI application: {str(e)}")
    # Provide a fallback application if WebSocket configuration fails
    application = ProtocolTypeRouter({
        "http": django_asgi_app,
    })
