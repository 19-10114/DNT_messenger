from django.contrib.auth import get_user_model
from django.db import models, transaction
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated

from utils.api_response import get_successful_response, get_failed_response
from .models import Conversation, ConversationMember, Message
from .serializers import (
    ConversationSerializer,
    DirectConversationInputSerializer,
    GroupConversationCreateInputSerializer,
    MessageCreateInputSerializer,
    MessageSerializer,
    MessengerUserSerializer,
)

User = get_user_model()


class ConversationListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        conversations = (
            Conversation.objects.filter(members__user=request.user)
            .prefetch_related('members__user', 'members__user__branch', 'messages__sender')
            .distinct()
            .order_by('-updated_at')
        )
        serializer = ConversationSerializer(conversations, many=True, context={'request': request})
        return get_successful_response(data=serializer.data)


class DirectConversationView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = DirectConversationInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        target_user_id = serializer.validated_data['user_id']

        try:
            target_user = User.objects.get(id=target_user_id)
        except User.DoesNotExist:
            return get_failed_response(message='Usuario no encontrado', status_code=status.HTTP_404_NOT_FOUND)

        if target_user.id == request.user.id:
            return get_failed_response(
                message='No es posible crear una conversación directa consigo mismo',
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        if getattr(target_user, 'role', '').lower() == 'client':
            return get_failed_response(
                message='No es posible entablar conversaciones directas con clientes',
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            # Idempotencia: buscar conversación directa existente entre ambos usuarios
            existing_conv = (
                Conversation.objects.filter(type='direct', members__user=request.user)
                .filter(members__user=target_user)
                .distinct()
                .first()
            )

            if existing_conv:
                out_ser = ConversationSerializer(existing_conv, context={'request': request})
                return get_successful_response(data=out_ser.data, status_code=status.HTTP_200_OK)

            new_conv = Conversation.objects.create(type='direct')
            ConversationMember.objects.create(conversation=new_conv, user=request.user, role='member')
            ConversationMember.objects.create(conversation=new_conv, user=target_user, role='member')

        out_ser = ConversationSerializer(new_conv, context={'request': request})
        return get_successful_response(data=out_ser.data, status_code=status.HTTP_201_CREATED)


class GroupConversationCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user_role = getattr(request.user, 'role', '') or ''
        user_roles = [r.strip().lower() for r in user_role.split(',') if r.strip()]
        is_admin_or_manager = any(r in ['admin', 'manager', 'administrator'] for r in user_roles)

        if not is_admin_or_manager and not request.user.is_staff:
            return get_failed_response(
                message='Solo administradores y gerentes pueden crear grupos',
                status_code=status.HTTP_403_FORBIDDEN,
            )

        serializer = GroupConversationCreateInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        name = serializer.validated_data['name']
        member_ids = set(serializer.validated_data['member_ids']) | {request.user.id}

        with transaction.atomic():
            group = Conversation.objects.create(
                type='group',
                name=name,
                created_by=request.user,
            )
            for uid in member_ids:
                ConversationMember.objects.create(
                    conversation=group,
                    user_id=uid,
                    role='admin' if uid == request.user.id else 'member',
                )

        return get_successful_response(
            data=ConversationSerializer(group, context={'request': request}).data,
            status_code=status.HTTP_201_CREATED,
        )


class MessageListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, conversation_id):
        conv = (
            Conversation.objects.filter(id=conversation_id, members__user=request.user)
            .first()
        )
        if not conv:
            return get_failed_response(message='Conversación no encontrada', status_code=status.HTTP_404_NOT_FOUND)

        messages = conv.messages.all().select_related('sender', 'sender__branch').order_by('created_at')
        serializer = MessageSerializer(messages, many=True)
        return get_successful_response(data=serializer.data)

    def post(self, request, conversation_id):
        conv_exists = Conversation.objects.filter(id=conversation_id).exists()
        if not conv_exists:
            return get_failed_response(message='Conversación no encontrada', status_code=status.HTTP_404_NOT_FOUND)

        conv = (
            Conversation.objects.filter(id=conversation_id, members__user=request.user)
            .first()
        )
        if not conv:
            return get_failed_response(
                message='No autorizado para enviar mensajes a esta conversación',
                status_code=status.HTTP_403_FORBIDDEN,
            )

        serializer = MessageCreateInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        with transaction.atomic():
            msg = Message.objects.create(
                conversation=conv,
                sender=request.user,
                content=serializer.validated_data['content'],
            )
            conv.last_message_at = msg.created_at
            conv.save()

        return get_successful_response(data=MessageSerializer(msg).data, status_code=status.HTTP_201_CREATED)


class MessengerUserListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        queryset = (
            User.objects.filter(is_active=True)
            .exclude(role__iexact='client')
            .select_related('branch')
            .order_by('first_name', 'last_name', 'username')
        )

        branch_param = request.query_params.get('branch')
        if branch_param:
            if branch_param.isdigit():
                queryset = queryset.filter(branch_id=int(branch_param))
            else:
                return get_failed_response(
                    message='El parámetro branch debe ser un entero válido',
                    status_code=status.HTTP_400_BAD_REQUEST,
                )

        search_param = request.query_params.get('search')
        if search_param:
            queryset = queryset.filter(
                models.Q(username__icontains=search_param)
                | models.Q(first_name__icontains=search_param)
                | models.Q(last_name__icontains=search_param)
                | models.Q(email__icontains=search_param)
            )

        serializer = MessengerUserSerializer(queryset, many=True)
        return get_successful_response(data=serializer.data)
