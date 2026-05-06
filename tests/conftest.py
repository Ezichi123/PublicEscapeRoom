import pytest
from django.utils import timezone
from users.models import User
from challenges.models import Challenge, Puzzle, Hint
from gameplay.models import GameSession

@pytest.fixture
def user(db):
    return User.objects.create_user(username="testuser", password="pass")

@pytest.fixture
def challenge(db):
    return Challenge.objects.create(
        timed_mode=False,
        time_limit_seconds=300
    )

@pytest.fixture
def puzzle_with_hints(db, challenge):
    puzzle = Puzzle.objects.create(
        challenge=challenge,
        match_type="string",
        correct_answer="OpenSesame",
        flow_type="linear",
        order=1,
    )
    Hint.objects.create(puzzle=puzzle, level=1, text="Think simple.")
    Hint.objects.create(puzzle=puzzle, level=2, text="It’s a phrase.")
    return puzzle