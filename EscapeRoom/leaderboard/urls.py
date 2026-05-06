from django.urls import path
from . import views

urlpatterns = [
    path("submit/", views.submit_score),
    path("<int:challenge_pk>/", views.leaderboard_view),
]