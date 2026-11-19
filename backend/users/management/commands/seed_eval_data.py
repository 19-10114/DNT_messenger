from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from rest_framework.authtoken.models import Token
from branches.models import Branch
from messenger.models import Conversation, ConversationMember, Message
from django.utils import timezone

User = get_user_model()

DEFAULT_PASSWORD = 'Password2026!'

EVALUATOR_ACCOUNTS = [
    {
        'username': 'torbet',
        'first_name': 'Torbet',
        'last_name': 'Evaluador',
        'email': 'torbet@dnt.local',
        'role': 'manager',
        'department': 'Gerencia',
        'branch_id': 1,
        'document_id': 'V-30000001',
    },
    {
        'username': 'samuel',
        'first_name': 'Samuel',
        'last_name': 'Evaluador',
        'email': 'samuel@dnt.local',
        'role': 'seller',
        'department': 'Ventas',
        'branch_id': 2,
        'document_id': 'V-30000002',
    },
    {
        'username': 'nadheska',
        'first_name': 'Nadheska',
        'last_name': 'Evaluadora',
        'email': 'nadheska@dnt.local',
        'role': 'admin',
        'department': 'Administración',
        'branch_id': 3,
        'document_id': 'V-30000003',
    },
    {
        'username': 'ernesto',
        'first_name': 'Ernesto',
        'last_name': 'Evaluador',
        'email': 'ernesto@dnt.local',
        'role': 'mechanic',
        'department': 'Taller',
        'branch_id': 1,
        'document_id': 'V-30000004',
    },
    {
        'username': 'stefano',
        'first_name': 'Stefano',
        'last_name': 'Casale',
        'email': 'stefano@dnt.local',
        'role': 'admin',
        'department': 'Administración',
        'branch_id': 1,
        'document_id': 'V-28000001',
    },
    {
        'username': 'daniela',
        'first_name': 'Daniela',
        'last_name': 'Gragirena',
        'email': 'daniela@dnt.local',
        'role': 'manager',
        'department': 'Gerencia',
        'branch_id': 2,
        'document_id': 'V-28000002',
    },
    {
        'username': 'gabriel',
        'first_name': 'Gabriel',
        'last_name': 'Orejarena',
        'email': 'gabriel@dnt.local',
        'role': 'seller',
        'department': 'Ventas',
        'branch_id': 1,
        'document_id': 'V-28000003',
    },
    {
        'username': 'nazareth',
        'first_name': 'Nazareth',
        'last_name': 'Colmenares',
        'email': 'nazareth@dnt.local',
        'role': 'mechanic',
        'department': 'Taller',
        'branch_id': 3,
        'document_id': 'V-28000004',
    },
]


class Command(BaseCommand):
    help = 'Pobla la base de datos con las 8 sesiones de evaluadores, sedes y chats demostrativos.'

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE('Iniciando poblamiento de datos para coevaluación...'))

        # 1. Sedes
        b1, _ = Branch.objects.get_or_create(
            id=1,
            defaults={'name': 'Sede Principal', 'type': 'Main', 'contact': '04141112201', 'code': 'PRIN'}
        )
        b2, _ = Branch.objects.get_or_create(
            id=2,
            defaults={'name': 'Sede Este', 'type': 'Sub', 'contact': '04141112202', 'code': 'ESTE'}
        )
        b3, _ = Branch.objects.get_or_create(
            id=3,
            defaults={'name': 'Sede Oeste', 'type': 'Sub', 'contact': '04141112203', 'code': 'OEST'}
        )
        branches_map = {1: b1, 2: b2, 3: b3}
        self.stdout.write(self.style.SUCCESS('Sedes aseguradas (Principal, Este, Oeste).'))

        # 2. Usuarios
        created_users = {}
        for acc in EVALUATOR_ACCOUNTS:
            user, created = User.objects.get_or_create(
                username=acc['username'],
                defaults={
                    'first_name': acc['first_name'],
                    'last_name': acc['last_name'],
                    'email': acc['email'],
                    'role': acc['role'],
                    'department': acc['department'],
                    'branch': branches_map[acc['branch_id']],
                    'document_id': acc['document_id'],
                    'is_staff': True,
                }
            )
            user.set_password(DEFAULT_PASSWORD)
            user.role = acc['role']
            user.department = acc['department']
            user.branch = branches_map[acc['branch_id']]
            user.first_name = acc['first_name']
            user.last_name = acc['last_name']
            user.is_staff = True
            user.save()
            token, _ = Token.objects.get_or_create(user=user)
            created_users[acc['username']] = user
            status_txt = 'creado' if created else 'actualizado'
            self.stdout.write(f"  - [{status_txt.upper()}] {user.username} ({user.role} @ {user.branch.name})")

        # 3. Conversaciones Demostrativas
        # Conversación directa Stefano <-> Torbet
        conv1, _ = Conversation.objects.get_or_create(
            type='direct',
            created_by=created_users['stefano'],
            defaults={'last_message_at': timezone.now()}
        )
        ConversationMember.objects.get_or_create(conversation=conv1, user=created_users['stefano'], defaults={'role': 'member'})
        ConversationMember.objects.get_or_create(conversation=conv1, user=created_users['torbet'], defaults={'role': 'member'})

        if not conv1.messages.exists():
            m1 = Message.objects.create(
                conversation=conv1,
                sender=created_users['stefano'],
                content='Hola Torbet, bienvenido a la suite de pruebas del módulo de mensajería interna DNT.'
            )
            m2 = Message.objects.create(
                conversation=conv1,
                sender=created_users['torbet'],
                content='Excelente Stefano. Estamos ejecutando la lista de verificación y validando la arquitectura.'
            )
            conv1.last_message_at = m2.created_at
            conv1.save()

        # Conversación directa Daniela <-> Samuel
        conv2, _ = Conversation.objects.get_or_create(
            type='direct',
            created_by=created_users['daniela'],
            defaults={'last_message_at': timezone.now()}
        )
        ConversationMember.objects.get_or_create(conversation=conv2, user=created_users['daniela'], defaults={'role': 'member'})
        ConversationMember.objects.get_or_create(conversation=conv2, user=created_users['samuel'], defaults={'role': 'member'})

        if not conv2.messages.exists():
            m3 = Message.objects.create(
                conversation=conv2,
                sender=created_users['daniela'],
                content='Samuel, favor revisar las consultas de clientes en Sede Este.'
            )
            m4 = Message.objects.create(
                conversation=conv2,
                sender=created_users['samuel'],
                content='Recibido Daniela, reporte enviado por el sistema.'
            )
            conv2.last_message_at = m4.created_at
            conv2.save()

        # Sala Grupal: Coordinación Operativa USB
        group_conv, _ = Conversation.objects.get_or_create(
            type='group',
            name='Coordinación Operativa USB',
            defaults={
                'created_by': created_users['stefano'],
                'last_message_at': timezone.now()
            }
        )
        for uname, uobj in created_users.items():
            ConversationMember.objects.get_or_create(
                conversation=group_conv,
                user=uobj,
                defaults={'role': 'admin' if uname in ['stefano', 'nadheska'] else 'member'}
            )

        if not group_conv.messages.exists():
            mg = Message.objects.create(
                conversation=group_conv,
                sender=created_users['stefano'],
                content='Bienvenidos al canal general de coordinación. Todas las 8 sesiones están activas.'
            )
            group_conv.last_message_at = mg.created_at
            group_conv.save()

        self.stdout.write(self.style.SUCCESS('\n¡Datos de evaluación preconfigurados exitosamente!'))
        self.stdout.write(self.style.SUCCESS(f'Contraseña universal: {DEFAULT_PASSWORD}'))
