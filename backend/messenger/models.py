from django.db import models
from django.conf import settings

class Conversation(models.Model):
    TYPE_CHOICES = [
        ('direct', 'Directo 1 a 1'),
        ('group', 'Grupo Privado'),
    ]
    type = models.CharField(max_length=10, choices=TYPE_CHOICES, default='direct')
    name = models.CharField(max_length=150, null=True, blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_conversations',
    )
    last_message_at = models.DateTimeField(null=True, blank=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'msg_conversations'
        ordering = ['-updated_at']

    def __str__(self):
        return f"Conversation {self.id} ({self.type})"


class ConversationMember(models.Model):
    ROLE_CHOICES = [
        ('admin', 'Administrador'),
        ('member', 'Miembro'),
    ]
    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        related_name='members',
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='messenger_memberships',
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='member')
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'msg_conversation_members'
        unique_together = ('conversation', 'user')

    def __str__(self):
        return f"Member {self.user_id} in conversation {self.conversation_id} ({self.role})"


class Message(models.Model):
    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        related_name='messages',
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='sent_messages',
    )
    content = models.TextField(max_length=4000)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'msg_messages'
        ordering = ['created_at']

    def __str__(self):
        return f"Message {self.id} by {self.sender_id}"
