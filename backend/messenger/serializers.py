from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Conversation, ConversationMember, Message

User = get_user_model()

ROLE_DEPARTMENT_MAP = {
    'admin': 'Administración',
    'administrator': 'Administración',
    'manager': 'Gerencia',
    'seller': 'Ventas',
    'cashier': 'Caja',
    'storage': 'Almacén',
    'main_storage': 'Almacén Principal',
    'mechanic': 'Taller',
    'finance': 'Finanzas',
    'parts_admin': 'Repuestos',
}


class MessengerUserSerializer(serializers.ModelSerializer):
    branch_id = serializers.SerializerMethodField()
    branch_name = serializers.SerializerMethodField()
    department = serializers.SerializerMethodField()
    role = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'first_name',
            'last_name',
            'email',
            'role',
            'department',
            'branch_id',
            'branch_name',
        ]

    def get_branch_id(self, obj):
        return obj.branch_id if obj.branch_id else None

    def get_branch_name(self, obj):
        return obj.branch.name if getattr(obj, 'branch', None) else None

    def get_role(self, obj):
        return obj.role or ''

    def get_department(self, obj):
        if getattr(obj, 'department', None):
            return obj.department
        roles = [r.strip().lower() for r in (obj.role or '').split(',') if r.strip()]
        for r in roles:
            if r in ROLE_DEPARTMENT_MAP:
                return ROLE_DEPARTMENT_MAP[r]
        return 'General'


class MessageSerializer(serializers.ModelSerializer):
    sender = MessengerUserSerializer(read_only=True)

    class Meta:
        model = Message
        fields = ['id', 'conversation_id', 'sender', 'content', 'created_at']


class ConversationSerializer(serializers.ModelSerializer):
    other_member = serializers.SerializerMethodField()
    other_user = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()
    participant_count = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    members = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = [
            'id',
            'type',
            'name',
            'created_at',
            'updated_at',
            'last_message_at',
            'other_member',
            'other_user',
            'last_message',
            'participant_count',
            'unread_count',
            'members',
        ]

    def get_other_member(self, obj):
        if obj.type == 'group':
            return None
        if hasattr(obj, '_cached_other_member'):
            return obj._cached_other_member

        request = self.context.get('request')
        current_user = request.user if request and request.user.is_authenticated else None

        members_list = list(obj.members.all())
        other = None
        for m in members_list:
            if current_user and m.user_id == current_user.id:
                continue
            other = m
            break

        if not other and members_list:
            other = members_list[0]

        res = MessengerUserSerializer(other.user).data if other and getattr(other, 'user', None) else None
        obj._cached_other_member = res
        return res

    def get_other_user(self, obj):
        return self.get_other_member(obj)

    def get_last_message(self, obj):
        messages_list = list(obj.messages.all())
        if messages_list:
            last = max(messages_list, key=lambda m: m.created_at)
            return MessageSerializer(last).data
        return None

    def get_participant_count(self, obj):
        return len(obj.members.all())

    def get_unread_count(self, obj):
        return 0

    def get_members(self, obj):
        if obj.type == 'group':
            members = obj.members.select_related('user', 'user__branch').all()
            return MessengerUserSerializer([m.user for m in members if m.user], many=True).data
        return []


class MessageCreateInputSerializer(serializers.Serializer):
    content = serializers.CharField(min_length=1, max_length=4000, trim_whitespace=True)


class DirectConversationInputSerializer(serializers.Serializer):
    user_id = serializers.IntegerField(required=False)
    userId = serializers.IntegerField(required=False)

    def validate(self, attrs):
        uid = attrs.get('user_id') or attrs.get('userId')
        if not uid:
            raise serializers.ValidationError({'user_id': 'Este campo es requerido.'})
        attrs['user_id'] = uid
        return attrs


class GroupConversationCreateInputSerializer(serializers.Serializer):
    name = serializers.CharField(min_length=1, max_length=150, required=True, trim_whitespace=True)
    member_ids = serializers.ListField(
        child=serializers.IntegerField(min_value=1),
        required=False,
    )
    memberIds = serializers.ListField(
        child=serializers.IntegerField(min_value=1),
        required=False,
    )

    def validate(self, attrs):
        m_ids = attrs.get('member_ids') or attrs.get('memberIds')
        if not m_ids:
            raise serializers.ValidationError({'member_ids': 'Este campo es requerido.'})

        valid_users = set(
            User.objects.filter(id__in=m_ids, is_active=True)
            .exclude(role__iexact='client')
            .values_list('id', flat=True)
        )
        invalid_ids = set(m_ids) - valid_users
        if invalid_ids:
            raise serializers.ValidationError({
                'member_ids': f'Los siguientes usuarios no existen o no son válidos para grupos: {list(invalid_ids)}'
            })

        attrs['member_ids'] = list(valid_users)
        return attrs
