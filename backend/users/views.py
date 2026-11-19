from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.authtoken.models import Token
from rest_framework import status
from django.contrib.auth import login as django_login
from utils.api_response import get_successful_response, get_failed_response
from messenger.serializers import MessengerUserSerializer
from .models import User
from .serializers import LoginSerializer, SwitchSessionSerializer


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if not serializer.is_valid():
            return get_failed_response(
                message='Error de autenticación',
                errors=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST
            )

        user = serializer.validated_data['user']
        token, _ = Token.objects.get_or_create(user=user)
        django_login(request, user)

        return get_successful_response(
            message='Inicio de sesión exitoso',
            data={
                'token': token.key,
                'user': MessengerUserSerializer(user).data
            }
        )


class SwitchSessionView(APIView):
    """
    Permite a los evaluadores alternar de usuario en 1 clic
    para simular interacción multi-usuario en tiempo real.
    """
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
    """
    Devuelve la lista de las 8 sesiones de prueba preconfiguradas
    con roles y sedes para alimentar el conmutador de la interfaz.
    """
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
