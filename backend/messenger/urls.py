from django.urls import path
from .views import (
    ConversationListView,
    DirectConversationView,
    GroupConversationCreateView,
    MessageListCreateView,
    MessengerUserListView,
)

urlpatterns = [
    path('conversations/', ConversationListView.as_view(), name='conversation-list'),
    path('conversations/direct/', DirectConversationView.as_view(), name='conversation-direct'),
    path('conversations/group/', GroupConversationCreateView.as_view(), name='conversation-group-create'),
    path('rooms/group/', GroupConversationCreateView.as_view(), name='room-group-create'),
    path('conversations/<int:conversation_id>/messages/', MessageListCreateView.as_view(), name='conversation-messages'),
    path('users/', MessengerUserListView.as_view(), name='messenger-users'),
]
