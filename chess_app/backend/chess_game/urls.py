from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Create a router for ViewSets
router = DefaultRouter()
router.register(r'games', views.GameViewSet, basename='game')
router.register(r'moves', views.MoveViewSet, basename='move')
router.register(r'invitations', views.GameInvitationViewSet, basename='invitation')

# URL patterns for the chess_game app
urlpatterns = [
    # Include the router URLs
    path('', include(router.urls)),
    
    # Custom API endpoints
    path('accept-invitation/<uuid:invitation_id>/', views.accept_invitation, name='accept-invitation'),
    path('decline-invitation/<uuid:invitation_id>/', views.decline_invitation, name='decline-invitation'),
    path('resign-game/<uuid:game_id>/', views.resign_game, name='resign-game'),
    path('active-players/', views.active_players, name='active-players'),
    path('active-game/', views.get_active_game, name='active-game'),
]