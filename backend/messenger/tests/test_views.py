from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase
from messenger.models import Conversation, ConversationMember, Message
from branches.models import Branch

User = get_user_model()


class MessengerAPITestCase(APITestCase):
    def setUp(self):
        self.branch1 = Branch.objects.create(name='Sede Principal', type='Main', contact='04141112201')
        self.branch2 = Branch.objects.create(name='Sede Este', type='Sub', contact='04141112202')

        self.user_a = User.objects.create_user(
            username='user_a',
            email='user_a@motocandela.com',
            password='password123',
            first_name='Alice',
            last_name='Alvarez',
            role='seller',
            branch=self.branch1,
        )
        self.user_b = User.objects.create_user(
            username='user_b',
            email='user_b@motocandela.com',
            password='password123',
            first_name='Bob',
            last_name='Bolivar',
            role='mechanic',
            branch=self.branch1,
        )
        self.user_c = User.objects.create_user(
            username='user_c',
            email='user_c@motocandela.com',
            password='password123',
            first_name='Charlie',
            last_name='Castro',
            role='cashier',
            branch=self.branch2,
        )
        self.admin_user = User.objects.create_user(
            username='admin_boss',
            email='admin@motocandela.com',
            password='password123',
            first_name='Amanda',
            last_name='Admin',
            role='admin',
            branch=self.branch1,
        )
        self.manager_user = User.objects.create_user(
            username='manager_dan',
            email='dan@motocandela.com',
            password='password123',
            first_name='Dan',
            last_name='Director',
            role='manager',
            branch=self.branch2,
        )

    def test_auth_required(self):
        """Peticiones sin autenticación deben retornar 401 Unauthorized."""
        response = self.client.get('/api/messenger/conversations/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        response = self.client.post('/api/messenger/conversations/direct/', {'userId': self.user_b.id}, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_idempotent_direct_chat(self):
        """Llamar dos veces al endpoint direct retorna la misma conversación sin duplicados."""
        self.client.force_authenticate(user=self.user_a)

        # Primera llamada: debe crear la conversación (201)
        res1 = self.client.post('/api/messenger/conversations/direct/', {'userId': self.user_b.id}, format='json')
        self.assertEqual(res1.status_code, status.HTTP_201_CREATED)
        conv_id_1 = res1.json()['data']['id']

        # Segunda llamada: debe retornar la existente (200) con mismo ID
        res2 = self.client.post('/api/messenger/conversations/direct/', {'userId': self.user_b.id}, format='json')
        self.assertEqual(res2.status_code, status.HTTP_200_OK)
        conv_id_2 = res2.json()['data']['id']

        self.assertEqual(conv_id_1, conv_id_2)
        # Verificar que en base de datos solo exista 1 conversación
        self.assertEqual(Conversation.objects.filter(type='direct').count(), 1)

    def test_room_isolation_security(self):
        """Un usuario ajeno no puede leer ni escribir en una conversación privada."""
        # Creamos conversación entre A y B
        conv = Conversation.objects.create(type='direct')
        ConversationMember.objects.create(conversation=conv, user=self.user_a)
        ConversationMember.objects.create(conversation=conv, user=self.user_b)

        # User C intenta leer los mensajes
        self.client.force_authenticate(user=self.user_c)
        res_get = self.client.get(f'/api/messenger/conversations/{conv.id}/messages/')
        self.assertEqual(res_get.status_code, status.HTTP_404_NOT_FOUND)

        # User C intenta enviar un mensaje
        res_post = self.client.post(
            f'/api/messenger/conversations/{conv.id}/messages/',
            {'content': 'Mensaje no autorizado'},
            format='json',
        )
        self.assertEqual(res_post.status_code, status.HTTP_403_FORBIDDEN)

    def test_send_and_retrieve_message(self):
        """Enviar mensaje retorna 201 y aparece en el historial cronológico."""
        conv = Conversation.objects.create(type='direct')
        ConversationMember.objects.create(conversation=conv, user=self.user_a)
        ConversationMember.objects.create(conversation=conv, user=self.user_b)

        self.client.force_authenticate(user=self.user_a)
        res_send = self.client.post(
            f'/api/messenger/conversations/{conv.id}/messages/',
            {'content': 'Hola Bob, ¿cómo estás?'},
            format='json',
        )
        self.assertEqual(res_send.status_code, status.HTTP_201_CREATED)
        res_json = res_send.json()
        self.assertIn('data', res_json)
        self.assertEqual(res_json['data']['content'], 'Hola Bob, ¿cómo estás?')
        self.assertEqual(res_json['data']['sender']['username'], 'user_a')

        # Bob se autentica y consulta los mensajes
        self.client.force_authenticate(user=self.user_b)
        res_list = self.client.get(f'/api/messenger/conversations/{conv.id}/messages/')
        self.assertEqual(res_list.status_code, status.HTTP_200_OK)
        messages = res_list.json()['data']
        self.assertEqual(len(messages), 1)
        self.assertEqual(messages[0]['content'], 'Hola Bob, ¿cómo estás?')

    def test_camelcase_envelope(self):
        """Verifica que las claves de respuesta sigan camelCase y usen get_successful_response."""
        conv = Conversation.objects.create(type='direct')
        ConversationMember.objects.create(conversation=conv, user=self.user_a)
        ConversationMember.objects.create(conversation=conv, user=self.user_b)

        self.client.force_authenticate(user=self.user_a)
        res_send = self.client.post(
            f'/api/messenger/conversations/{conv.id}/messages/',
            {'content': 'Mensaje con formato camelCase'},
            format='json',
        )
        data = res_send.json()['data']
        self.assertIn('conversationId', data)
        self.assertIn('createdAt', data)
        self.assertIn('sender', data)
        self.assertIn('firstName', data['sender'])
        self.assertIn('lastName', data['sender'])

        # Verificar endpoint de listar conversaciones
        res_convs = self.client.get('/api/messenger/conversations/')
        self.assertEqual(res_convs.status_code, status.HTTP_200_OK)
        conv_item = res_convs.json()['data'][0]
        self.assertIn('otherUser', conv_item)
        self.assertIn('lastMessage', conv_item)
        self.assertIn('updatedAt', conv_item)

    def test_create_group_forbidden_for_regular_user(self):
        """Empleado regular recibe 403 Forbidden al intentar crear grupo."""
        self.client.force_authenticate(user=self.user_a)
        res = self.client.post(
            '/api/messenger/conversations/group/',
            {'name': 'Grupo No Permitido', 'member_ids': [self.user_b.id]},
            format='json',
        )
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(res.json()['message'], 'Solo administradores y gerentes pueden crear grupos')
        # Verificar que el grupo no autorizado no fue creado en la base de datos
        self.assertFalse(Conversation.objects.filter(name='Grupo No Permitido').exists())

    def test_create_group_success_for_admin_and_manager(self):
        """Admin o Gerente crea grupo con participantes correctamente vinculados."""
        self.client.force_authenticate(user=self.admin_user)
        payload = {
            'name': 'Coordinación Repuestos y Taller',
            'member_ids': [self.user_a.id, self.user_b.id],
        }
        res = self.client.post('/api/messenger/conversations/group/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        data = res.json()['data']
        self.assertEqual(data['name'], 'Coordinación Repuestos y Taller')
        self.assertEqual(data['type'], 'group')
        self.assertEqual(data['participantCount'], 3)

        # Verificar membresías en BD
        conv = Conversation.objects.get(id=data['id'])
        self.assertEqual(conv.members.count(), 3)
        admin_member = conv.members.get(user=self.admin_user)
        self.assertEqual(admin_member.role, 'admin')
        user_a_member = conv.members.get(user=self.user_a)
        self.assertEqual(user_a_member.role, 'member')

    def test_create_group_rooms_alias(self):
        """Endpoint /api/messenger/rooms/group/ funciona como alias de creación grupal."""
        self.client.force_authenticate(user=self.manager_user)
        payload = {
            'name': 'Comité Sucursal Este',
            'member_ids': [self.user_c.id],
        }
        res = self.client.post('/api/messenger/rooms/group/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        data = res.json()['data']
        self.assertEqual(data['name'], 'Comité Sucursal Este')
        self.assertEqual(data['type'], 'group')

    def test_conversation_enrichment_fields(self):
        """Verifica que el serializador exponga participant_count, unread_count y en other_member role y department."""
        conv = Conversation.objects.create(type='direct')
        ConversationMember.objects.create(conversation=conv, user=self.user_a)
        ConversationMember.objects.create(conversation=conv, user=self.user_b)

        self.client.force_authenticate(user=self.user_a)
        res = self.client.get('/api/messenger/conversations/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        item = res.json()['data'][0]
        self.assertEqual(item['participantCount'], 2)
        self.assertEqual(item['unreadCount'], 0)
        # otherMember expone department y role
        self.assertIn('otherMember', item)
        self.assertEqual(item['otherMember']['role'], 'mechanic')
        self.assertEqual(item['otherMember']['department'], 'Taller')

    def test_messenger_users_filter_by_branch(self):
        """Consulta con ?branch= filtra empleados de dicha sede."""
        self.client.force_authenticate(user=self.user_a)

        # Filtrar por sucursal 1 (Sede Principal): user_a, user_b, admin_user
        res_b1 = self.client.get(f'/api/messenger/users/?branch={self.branch1.id}')
        self.assertEqual(res_b1.status_code, status.HTTP_200_OK)
        users_b1 = res_b1.json()['data']
        b1_ids = {u['id'] for u in users_b1}
        self.assertIn(self.user_a.id, b1_ids)
        self.assertIn(self.user_b.id, b1_ids)
        self.assertIn(self.admin_user.id, b1_ids)
        self.assertNotIn(self.user_c.id, b1_ids)

        # Filtrar por sucursal 2 (Sede Este): user_c, manager_user
        res_b2 = self.client.get(f'/api/messenger/users/?branch={self.branch2.id}')
        self.assertEqual(res_b2.status_code, status.HTTP_200_OK)
        users_b2 = res_b2.json()['data']
        b2_ids = {u['id'] for u in users_b2}
        self.assertIn(self.user_c.id, b2_ids)
        self.assertIn(self.manager_user.id, b2_ids)
        self.assertNotIn(self.user_a.id, b2_ids)
