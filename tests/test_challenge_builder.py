import pytest
from rest_framework.test import APIClient
from django.contrib.auth.models import User

@pytest.mark.django_db
def test_create_challenge():
    user = User.objects.create_user(username="creator", password="pass123")
    client = APIClient()
    client.force_authenticate(user=user)

    response = client.post("/api/challenges/", {
        "title": "Escape Test",
        "description": "Test room"
    })

    assert response.status_code == 201
    assert response.data["title"] == "Escape Test"


@pytest.mark.django_db
def test_edit_challenge():
    user = User.objects.create_user(username="creator", password="pass123")
    client = APIClient()
    client.force_authenticate(user=user)

    challenge = client.post("/api/challenges/", {
        "title": "Old Title"
    }).data

    response = client.put(f"/api/challenges/{challenge['id']}/", {
        "title": "Updated Title"
    })

    assert response.status_code == 200
    assert response.data["title"] == "Updated Title"


@pytest.mark.django_db
def test_delete_challenge():
    user = User.objects.create_user(username="creator", password="pass123")
    client = APIClient()
    client.force_authenticate(user=user)

    challenge = client.post("/api/challenges/", {
        "title": "To Delete"
    }).data

    response = client.delete(f"/api/challenges/{challenge['id']}/")
    assert response.status_code == 204