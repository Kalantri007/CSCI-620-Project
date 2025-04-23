from django.urls import path
from . import consumers

# Define WebSocket URL patterns
websocket_urlpatterns = [
    path('ws/game/<str:game_id>/', consumers.ChessGameConsumer.as_asgi()),
    path('ws/lobby/', consumers.LobbyConsumer.as_asgi()),
]