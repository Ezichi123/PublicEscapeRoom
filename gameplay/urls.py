from django.urls import path
from . import views

urlpatterns = [
    path("start-session/", views.start_session_view),
    path("submit/", views.submit_answer),
    path("hint/", views.get_hint_view),
    path("reveal/", views.reveal_answer_view),
]