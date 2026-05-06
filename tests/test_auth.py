import pytest
from django.contrib.auth.models import User
from rest_framework.test import APIClient

@pytest.mark.django_db
def test_user_signup():
    client = APIClient()
    response = client.post("/api/auth/signup/", {
        "username": "testuser",
        "email": "test@example.com",
        "password": "securepassword"
    })

    assert response.status_code == 201
    assert User.objects.filter(username="testuser").exists()


@pytest.mark.django_db
def test_user_login():
    user = User.objects.create_user(username="testuser", password="pass123")
    client = APIClient()

    response = client.post("/api/auth/login/", {
        "username": "testuser",
        "password": "pass123"
    })

    assert response.status_code == 200