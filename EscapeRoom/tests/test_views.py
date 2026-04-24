import json
import pytest
from django.utils import timezone
from rest_framework.test import APIClient

from challenges.models import Puzzle
from gameplay.models import GameSession

@pytest.mark.django_db
def test_start_session_view_authenticated(user, challenge):
    client = APIClient()
    client.force_authenticate(user=user)

    # A challenge must have at least one puzzle
    puzzle = Puzzle.objects.create(
        challenge=challenge,
        order=1,
        flow_type="linear",
        match_type="string",
        correct_answer="test",
    )

    response = client.get(
        "/api/start-session/",
        {"challenge_id": challenge.id},
        format="json",
    )

    assert response.status_code == 200

    data = response.json()
    assert "session_id" in data
    assert data["puzzle_id"] == puzzle.id

@pytest.mark.django_db
def test_start_session_requires_authentication(challenge):
    client = APIClient()  # NOT authenticated

    response = client.get(
        "/api/start-session/",
        {"challenge_id": challenge.id},
        format="json",
    )

    # DRF usually returns 401 (sometimes 403 depending on settings)
    assert response.status_code in (401, 403)

@pytest.mark.django_db
def test_submit_answer_correct_flow(user, challenge):
    client = APIClient()
    client.force_authenticate(user=user)

    puzzle = Puzzle.objects.create(
        challenge=challenge,
        order=1,
        flow_type="linear",
        match_type="string",
        correct_answer="OpenSesame",
    )

    session = GameSession.objects.create(
        user=user,
        challenge=challenge,
        current_puzzle=puzzle,
        start_time=timezone.now(),
        attempts=0,
        completed=False,
    )

    payload = {
        "session_id": session.id,
        "answer": "OpenSesame",
    }

    response = client.post(
        "/api/submit/",
        payload,
        format="json",
    )

    assert response.status_code == 200

    data = response.json()
    assert data["correct"] is True
    assert data["completed"] is True

@pytest.mark.django_db
def test_submit_answer_invalid_json(user):
    client = APIClient()
    client.force_authenticate(user=user)

    response = client.post(
        "/api/submit/",
        data="not-json",
        content_type="application/json",
    )

    assert response.status_code == 400

@pytest.mark.django_db
def test_get_hint_view_returns_hint(puzzle_with_hints):
    client = APIClient()  # no authentication required for this view

    response = client.get(
        "/api/hint/",
        {
            "puzzle_id": puzzle_with_hints.id,
            "attempts": 2,
        },
        format="json",
    )

    assert response.status_code == 200
    assert response.json()["hint"] is not None
