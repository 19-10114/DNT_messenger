from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from utils.api_response import get_successful_response
from .models import Branch


class BranchListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        branches = Branch.objects.all().order_by('id')
        data = []
        for b in branches:
            data.append({
                'id': b.id,
                'name': b.name,
                'type': b.type,
                'location': b.location or '',
                'contact': b.contact or '',
                'code': b.code or '',
            })
        return get_successful_response(data=data)
