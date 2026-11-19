from django.urls import path
from .views import (
    LoginView,
    SwitchSessionView,
    CurrentUserView,
    CurrentUserSelfView,
    UserSearchView,
    PreloadedEvaluatorListView,
)

urlpatterns = [
    path('login/', LoginView.as_view(), name='auth-login'),
    path('login', LoginView.as_view(), name='auth-login-no-slash'),
    path('self', CurrentUserSelfView.as_view(), name='users-self'),
    path('self/', CurrentUserSelfView.as_view(), name='users-self-slash'),
    path('search', UserSearchView.as_view(), name='users-search'),
    path('search/', UserSearchView.as_view(), name='users-search-slash'),
    path('switch-session/', SwitchSessionView.as_view(), name='auth-switch-session'),
    path('me/', CurrentUserView.as_view(), name='auth-me'),
    path('evaluators/', PreloadedEvaluatorListView.as_view(), name='auth-evaluators'),
]
