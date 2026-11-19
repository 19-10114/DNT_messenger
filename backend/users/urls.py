from django.urls import path
from .views import LoginView, SwitchSessionView, CurrentUserView, PreloadedEvaluatorListView

urlpatterns = [
    path('login/', LoginView.as_view(), name='auth-login'),
    path('switch-session/', SwitchSessionView.as_view(), name='auth-switch-session'),
    path('me/', CurrentUserView.as_view(), name='auth-me'),
    path('evaluators/', PreloadedEvaluatorListView.as_view(), name='auth-evaluators'),
]
