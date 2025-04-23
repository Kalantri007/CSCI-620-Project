"""
URL configuration for chess_backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.decorators import api_view
from rest_framework.response import Response

# Simple view to handle the root URL
@api_view(['GET'])
def api_root(request):
    return Response({
        'status': 'API is running',
        'message': 'Welcome to the Chess App API',
        'endpoints': {
            'auth': '/api/auth/',
            'chess': '/api/chess/',
        }
    })

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # API URLs
    path('api/auth/', include('accounts.urls')),
    path('api/chess/', include('chess_game.urls')),
    path('api-auth/', include('rest_framework.urls')),
    
    # Serve a simple API response at the root URL
    path('', api_root, name='api_root'),
]

# Serve static files during development
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
