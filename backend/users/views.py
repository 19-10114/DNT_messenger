from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.authtoken.models import Token
from rest_framework import status
from django.contrib.auth import authenticate, login as django_login
from utils.api_response import get_successful_response, get_failed_response
from messenger.serializers import MessengerUserSerializer
from .models import User
from .serializers import LoginSerializer, SwitchSessionSerializer


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')

        if not username or not password:
            return get_failed_response(message='Debe ingresar usuario y contraseña', status_code=status.HTTP_400_BAD_REQUEST)

        user = authenticate(username=username, password=password)
        if not user:
            try:
                candidate = User.objects.get(username=username)
                if candidate.check_password(password):
                    user = candidate
            except User.DoesNotExist:
                user = None

        if not user:
            return get_failed_response(message='Credenciales incorrectas', status_code=status.HTTP_401_UNAUTHORIZED)

        token, _ = Token.objects.get_or_create(user=user)
        django_login(request, user)

        return get_successful_response(
            message='Inicio de sesión exitoso',
            data={
                'token': token.key,
                'user': MessengerUserSerializer(user).data
            }
        )


class CurrentUserSelfView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        u = request.user
        data = {
            'id': u.id,
            'username': u.username,
            'email': u.email or '',
            'firstName': u.first_name or '',
            'lastName': u.last_name or '',
            'role': u.role or '',
            'department': getattr(u, 'department', '') or '',
            'isStaff': u.is_staff,
            'isSuperuser': u.is_superuser,
            'isActive': u.is_active,
            'branch': {
                'id': u.branch.id,
                'name': u.branch.name,
                'type': getattr(u.branch, 'type', 'Main'),
            } if u.branch else None,
            'groups': [],
            'userPermissions': [],
        }
        return get_successful_response(data=data)


class UserSearchView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        search = request.query_params.get('search', '').strip().lower()
        queryset = User.objects.filter(is_active=True).exclude(role__iexact='client').select_related('branch')

        if search:
            from django.db.models import Q
            queryset = queryset.filter(
                Q(username__icontains=search) |
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search)
            )

        users_list = []
        for u in queryset:
            users_list.append({
                'id': u.id,
                'username': u.username,
                'firstName': u.first_name or '',
                'lastName': u.last_name or '',
                'email': u.email or '',
                'role': u.role or '',
                'isActive': u.is_active,
                'branch': {
                    'id': u.branch.id,
                    'name': u.branch.name,
                } if u.branch else None,
            })

        return get_successful_response(data={
            'results': users_list,
            'totalElements': len(users_list),
            'totalPages': 1,
            'currentPage': 1,
            'pageSize': 50,
        })


class SwitchSessionView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = SwitchSessionSerializer(data=request.data)
        if not serializer.is_valid():
            return get_failed_response(
                message='No se pudo cambiar de sesión',
                errors=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST
            )

        user = serializer.validated_data['username']
        token, _ = Token.objects.get_or_create(user=user)
        django_login(request, user)

        return get_successful_response(
            message=f'Sesión activa cambiada a {user.username}',
            data={
                'token': token.key,
                'user': MessengerUserSerializer(user).data
            }
        )


class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return get_successful_response(
            message='Perfil obtenido con éxito',
            data={
                'user': MessengerUserSerializer(request.user).data
            }
        )


class PreloadedEvaluatorListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        evaluators = User.objects.filter(is_active=True).select_related('branch').order_by('id')
        data = []
        for u in evaluators:
            data.append({
                'id': u.id,
                'username': u.username,
                'firstName': u.first_name,
                'lastName': u.last_name,
                'role': u.role,
                'department': getattr(u, 'department', '') or '',
                'branchName': u.branch.name if u.branch else 'Sin Sede',
                'branchId': u.branch_id if u.branch_id else None,
            })
        return get_successful_response(data=data)
