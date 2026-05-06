from django.contrib import admin
from django.urls import path, include
from django.http import HttpResponseRedirect
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView


# ✅ Analytics FIRST
@api_view(['GET'])
def analytics_view(request):
    return Response({
        "average_time": 120,
        "fail_rate": 0.25
    })


def home(request):
    return HttpResponseRedirect("/api/start-session/?challenge_id=1")


urlpatterns = [
    path("", home),
    path("admin/", admin.site.urls),

    # ✅ gameplay
    path("api/", include("gameplay.urls")),

    # ✅ auth
    path("api/auth/", include("users.urls")),

    # ✅ jwt
    path("api/token/", TokenObtainPairView.as_view()),
    path("api/token/refresh/", TokenRefreshView.as_view()),

    # ✅ challenges
    path("api/challenges/", include("challenges.urls")),

    # ✅ leaderboard
    path("api/leaderboard/", include("leaderboard.urls")),

    # ✅ analytics
    path("api/analytics/", analytics_view),
]