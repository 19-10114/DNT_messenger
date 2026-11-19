from django.urls import path
from .views import BranchListView

urlpatterns = [
    path('', BranchListView.as_view(), name='branches-list'),
    path('mc/all', BranchListView.as_view(), name='branches-mc-all'),
    path('all', BranchListView.as_view(), name='branches-all'),
    path('every', BranchListView.as_view(), name='branches-every'),
]
