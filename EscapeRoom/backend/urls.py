from django.contrib import admin
from django.urls import path, include
from django.http import HttpResponseRedirect
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView


def home(request):
    return HttpResponseRedirect("/api/start-session/?challenge_id=1")

urlpatterns = [
    path("", home),
    path("admin/", admin.site.urls),
    path("api/", include("gameplay.urls")),

    path('api/token/', TokenObtainPairView.as_view()),
    path('api/token/refresh/', TokenRefreshView.as_view()),

    path("api/users/", include("users.urls")),
    path("api/challenges/", include("challenges.urls")),

    path("api/leaderboard/", include("leaderboard.urls"))
]