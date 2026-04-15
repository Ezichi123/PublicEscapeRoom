from django.urls import path
from .views import challenge_list_create

urlpatterns = [
    path("", challenge_list_create),
]