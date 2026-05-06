import pytest
from rest_framework.test import APIClient
from django.contrib.auth.models import User

@pytest.mark.django_db
def test_creator_can_view_analytics():
    user = User.objects.create_user(username="creator", password="pass123")
    client = APIClient()
    client.force_authenticate(user=user)

    response = client.get("/api/analytics/")

    assert response.status_code == 200
    assert "average_time" in response.data


@pytest.mark.django_db
def test_user_cannot_view_others_analytics():
    creator = User.objects.create_user(username="creator", password="pass123")
    other_user = User.objects.create_user(username="other", password="pass123")

    client = APIClient()
    client.force_authenticate(user=other_user)

    response = client.get(f"/api/analytics/{creator.id}/")

    assert response.status_code in [403, 404]