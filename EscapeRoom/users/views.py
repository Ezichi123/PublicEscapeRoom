from django.contrib.auth.models import User
from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
import json

@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    try:
        data = json.loads(request.body.decode("utf-8"))
    except json.JSONDecodeError:
        return JsonResponse({"error": "invalid JSON"}, status=400)

    username = data.get("username", "").strip()
    password = data.get("password", "").strip()
    email = data.get("email", "").strip()

    if not username or not password:
        return JsonResponse({"error": "username and password required"}, status=400)

    if User.objects.filter(username=username).exists():
        return JsonResponse({"error": "username already taken"}, status=400)

    user = User.objects.create_user(username=username, password=password, email=email)

    return JsonResponse({"message": "account created", "user_id": user.id}, status=201)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def profile_view(request):
    user = request.user
    return JsonResponse({
        "user_id": user.id,
        "username": user.username,
        "email": user.email,
        "date_joined": user.date_joined,
    })