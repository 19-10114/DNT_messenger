from rest_framework import status
from rest_framework.response import Response

REQUEST_SUCCESSFUL = 'Operación realizada con éxito'
REQUEST_UNSUCCESSFUL = 'Error al procesar la solicitud'

def get_successful_response(message=REQUEST_SUCCESSFUL, data=None, status_code=status.HTTP_200_OK):
    if data is None:
        data = []
    return Response({
        'message': message,
        'data': data,
    }, status=status_code)

def get_failed_response(message=REQUEST_UNSUCCESSFUL, errors=None, status_code=status.HTTP_400_BAD_REQUEST, data=None):
    if errors is None:
        errors = []
    if data is None:
        data = []
    return Response({
        'message': message,
        'errors': errors,
        'data': data,
    }, status=status_code)
