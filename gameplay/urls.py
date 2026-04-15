from django.urls import path
from . import views

urlpatterns = [
    path("start/", views.start_game),
    path("submit/", views.submit_answer),
    path("hint/", views.get_hint),
    path("reveal/", views.reveal_solution),

    
    path("challenges/", views.list_challenges),
    path("challenges/create/", views.create_challenge),

    path("challenges/<int:pk>/", views.get_challenge),
]