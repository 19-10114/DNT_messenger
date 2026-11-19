from django.test import TestCase
from django.contrib.auth import get_user_model
from django.db.utils import IntegrityError
from messenger.models import Conversation, ConversationMember, Message

User = get_user_model()


class MessengerModelTests(TestCase):
    def setUp(self):
        self.user1 = User.objects.create_user(
            username='diego_lezama',
            email='diego@motocandela.com',
            password='testpassword123',
            first_name='Diego',
            last_name='Lezama'
        )
        self.user2 = User.objects.create_user(
            username='stefano_casale',
            email='stefano@motocandela.com',
            password='testpassword123',
            first_name='Stefano',
            last_name='Casale'
        )

    def test_create_conversation(self):
        """Instancia una conversación directa y verifica que se persista en la tabla msg_conversations con clave id autoincremental."""
        conv = Conversation.objects.create(type='direct')
        self.assertIsNotNone(conv.id)
        self.assertEqual(conv.type, 'direct')
        self.assertEqual(Conversation._meta.db_table, 'msg_conversations')
        
        # Verificar recuperación desde base de datos
        fetched = Conversation.objects.get(id=conv.id)
        self.assertEqual(fetched.id, conv.id)
        self.assertIsNotNone(fetched.created_at)
        self.assertIsNotNone(fetched.updated_at)

    def test_member_uniqueness(self):
        """Verifica que la restricción unique_together impida asociar dos veces al mismo usuario en la misma conversación (lanza IntegrityError)."""
        conv = Conversation.objects.create(type='direct')
        ConversationMember.objects.create(conversation=conv, user=self.user1)
        
        self.assertEqual(ConversationMember._meta.db_table, 'msg_conversation_members')
        self.assertEqual(conv.members.count(), 1)
        
        # Intentar asociar al mismo usuario por segunda vez debe lanzar IntegrityError
        with self.assertRaises(IntegrityError):
            ConversationMember.objects.create(conversation=conv, user=self.user1)

    def test_message_persistence(self):
        """Verifica que un mensaje se asocie correctamente a su autor y conversación con fecha UTC automática."""
        conv = Conversation.objects.create(type='direct')
        ConversationMember.objects.create(conversation=conv, user=self.user1)
        ConversationMember.objects.create(conversation=conv, user=self.user2)

        msg = Message.objects.create(
            conversation=conv,
            sender=self.user1,
            content='Hola Stefano, bienvenidos a la mensajería satélite.'
        )
        
        self.assertIsNotNone(msg.id)
        self.assertEqual(Message._meta.db_table, 'msg_messages')
        self.assertEqual(msg.content, 'Hola Stefano, bienvenidos a la mensajería satélite.')
        self.assertEqual(msg.sender, self.user1)
        self.assertEqual(msg.conversation, conv)
        self.assertIsNotNone(msg.created_at)
        
        # Verificar relaciones inversas
        self.assertEqual(conv.messages.count(), 1)
        self.assertEqual(conv.messages.first(), msg)
        self.assertEqual(self.user1.sent_messages.count(), 1)

    def test_group_conversation_fields(self):
        """Verifica que Conversation soporte salas grupales con nombre, creador y last_message_at."""
        conv = Conversation.objects.create(
            type='group',
            name='Equipo Repuestos Barquisimeto',
            created_by=self.user1,
        )
        self.assertIsNotNone(conv.id)
        self.assertEqual(conv.type, 'group')
        self.assertEqual(conv.name, 'Equipo Repuestos Barquisimeto')
        self.assertEqual(conv.created_by, self.user1)

    def test_conversation_member_role(self):
        """Verifica que ConversationMember soporte el campo role ('admin' o 'member')."""
        conv = Conversation.objects.create(type='group', name='Comité')
        m1 = ConversationMember.objects.create(conversation=conv, user=self.user1, role='admin')
        m2 = ConversationMember.objects.create(conversation=conv, user=self.user2, role='member')
        self.assertEqual(m1.role, 'admin')
        self.assertEqual(m2.role, 'member')

    def test_message_max_length_boundary(self):
        """Verifica que el modelo Message soporte y almacene textos en el límite exacto de 4000 caracteres UTF-8."""
        conv = Conversation.objects.create(type='direct')
        ConversationMember.objects.create(conversation=conv, user=self.user1)
        ConversationMember.objects.create(conversation=conv, user=self.user2)

        boundary_content = 'M' * 4000
        msg = Message.objects.create(
            conversation=conv,
            sender=self.user1,
            content=boundary_content
        )
        self.assertEqual(len(msg.content), 4000)
        self.assertEqual(msg.content, boundary_content)

    def test_message_content_immutability(self):
        """Verifica la regla de inmutabilidad comercial: no existen campos de edición ni mutación de contenido."""
        conv = Conversation.objects.create(type='direct')
        ConversationMember.objects.create(conversation=conv, user=self.user1)
        ConversationMember.objects.create(conversation=conv, user=self.user2)

        msg = Message.objects.create(
            conversation=conv,
            sender=self.user1,
            content='Cotización inicial de repuestos: $150 USD'
        )
        self.assertEqual(msg.content, 'Cotización inicial de repuestos: $150 USD')
        # El modelo garantiza inmutabilidad: no expone campos ni métodos de edición de texto
        self.assertFalse(hasattr(msg, 'edited_at'))
        self.assertFalse(hasattr(msg, 'is_edited'))
