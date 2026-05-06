from django.urls import path
from . import views

urlpatterns = [
    path("", views.challenge_list),
    path("create/", views.challenge_create),
    path("mine/", views.my_challenges),
    path("<int:pk>/", views.challenge_detail),
    path("<int:pk>/edit/", views.challenge_edit),
    path("<int:pk>/delete/", views.challenge_delete),
    path("<int:challenge_pk>/puzzles/", views.puzzle_create),
    path("puzzles/<int:pk>/", views.puzzle_edit_delete),
    path("puzzles/<int:puzzle_pk>/hints/", views.hint_create),
]