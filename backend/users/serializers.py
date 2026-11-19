from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User
from messenger.serializers import MessengerUserSerializer

class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        username = attrs.get('username')
        password = attrs.get('password')

        if not username or not password:
            raise serializers.ValidationError('Debe incluir nombre de usuario y contraseña.')

        user = authenticate(username=username, password=password)
        if not user:
            raise serializers.ValidationError('Credenciales inválidas.')

        if not user.is_active:
            raise serializers.ValidationError('Esta cuenta de usuario se encuentra inactiva.')

        attrs['user'] = user
        return attrs


class SwitchSessionSerializer(serializers.Serializer):
    username = serializers.CharField()

    def validate_username(self, value):
        try:
            user = User.objects.get(username=value)
        except User.DoesNotExist:
            raise serializers.ValidationError('Usuario no encontrado.')

        if not user.is_active:
            raise serializers.ValidationError('El usuario se encuentra inactivo.')

        return user
