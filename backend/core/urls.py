from django.contrib import admin
from django.urls import path, include
from django.shortcuts import render

def index_view(request):
    return render(request, 'messenger/index.html')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/messenger/', include('messenger.urls')),
    path('api/auth/', include('users.urls')),
    path('', index_view, name='web-messenger'),
]
