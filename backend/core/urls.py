from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse

def api_health(request):
    return JsonResponse({
        'status': 'online',
        'service': 'DNT Messenger API',
        'version': '1.0.0'
    })

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/messenger/', include('messenger.urls')),
    path('api/auth/', include('users.urls')),
    path('api/authentication/', include('users.urls')),
    path('api/users/', include('users.urls')),
    path('api/branches/', include('branches.urls')),
    path('', api_health, name='api-health'),
]
