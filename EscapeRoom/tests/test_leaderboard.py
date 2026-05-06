import pytest
from rest_framework.test import APIClient
from django.contrib.auth.models import User

@pytest.mark.django_db
def test_leaderboard_returns_data():
    user = User.objects.create_user(username="player", password="pass123")
    client = APIClient()
    client.force_authenticate(user=user)

    response = client.get("/api/leaderboard/")
    
    assert response.status_code == 200
    assert isinstance(response.data, list)


@pytest.mark.django_db
def test_timed_mode_timeout():
    user = User.objects.create_user(username="player", password="pass123")
    client = APIClient()
    client.force_authenticate(user=user)

    response = client.post("/api/start-session/", {
        "timed": True
    })

    assert response.status_code == 200
    assert "time_limit" in response.data
