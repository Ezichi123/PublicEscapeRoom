from django.urls import path
from . import views
from .views import leaderboard

urlpatterns = [
    path('', leaderboard),

    path("submit/", views.submit_score),
    path("<int:challenge_pk>/", views.leaderboard_view),
]