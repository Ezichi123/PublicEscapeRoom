"""
Comprehensive unit tests for gameplay/game_logic.py

Covers:
- Answer validation (string, regex, numeric)
- Hint escalation
- Reveal answer logic
- Puzzle sequencing (linear & branching)
- Progress tracking
- Completion detection
- Timed mode + timeout handling
- Session initialization
"""

import pytest
from django.utils import timezone

from gameplay.game_logic import (
    check_answer,
    get_hint,
    can_reveal_answer,
    reveal_answer,
    get_next_puzzle,
    update_progress,
    check_completion,
    finalize_run,
    check_timeout,
    handle_timeout,
    start_session,
)

from challenges.models import Puzzle, Hint, Challenge
from gameplay.models import GameSession
from users.models import User

# FIXTURES

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
def timed_challenge(db):
    return Challenge.objects.create(
        timed_mode=True,
        time_limit_seconds=2
    )


@pytest.fixture
def string_puzzle(db, challenge):
    return Puzzle.objects.create(
        challenge=challenge,
        match_type="string",
        correct_answer="OpenSesame",
        flow_type="linear",
        order=1,
    )


@pytest.fixture
def regex_puzzle(db, challenge):
    return Puzzle.objects.create(
        challenge=challenge,
        match_type="regex",
        correct_answer=r"\d{4}",
        flow_type="linear",
        order=1,
    )


@pytest.fixture
def numeric_puzzle(db, challenge):
    return Puzzle.objects.create(
        challenge=challenge,
        match_type="numeric",
        correct_answer="42",
        flow_type="linear",
        order=1,
    )


@pytest.fixture
def puzzle_with_hints(db, string_puzzle):
    Hint.objects.create(puzzle=string_puzzle, level=1, text="Think simple.")
    Hint.objects.create(puzzle=string_puzzle, level=2, text="It’s a phrase.")
    Hint.objects.create(puzzle=string_puzzle, level=3, text="OpenSesame")
    return string_puzzle


@pytest.fixture
def session(db, user, challenge):
    return GameSession.objects.create(
        user=user,
        challenge=challenge,
        start_time=timezone.now(),
        attempts=0,
        hints_used=0,
        revealed_answers=0,
        completed=False,
        timed_out=False,
    )

# ANSWER VALIDATION — check_answer()

def test_check_answer_string_correct(string_puzzle):
    assert check_answer("opensesame", string_puzzle) is True


def test_check_answer_string_incorrect(string_puzzle):
    assert check_answer("wrong", string_puzzle) is False


def test_check_answer_regex_valid(regex_puzzle):
    assert check_answer("2024", regex_puzzle) is True


def test_check_answer_regex_invalid(regex_puzzle):
    assert check_answer("abcd", regex_puzzle) is False


def test_check_answer_numeric_int(numeric_puzzle):
    assert check_answer("42", numeric_puzzle) is True


def test_check_answer_numeric_float(numeric_puzzle):
    assert check_answer("42.0", numeric_puzzle) is True


def test_check_answer_numeric_invalid(numeric_puzzle):
    assert check_answer("forty-two", numeric_puzzle) is False


def test_check_answer_empty(string_puzzle):
    assert check_answer("", string_puzzle) is False

# HINT ESCALATION — get_hint()

def test_get_hint_too_early(puzzle_with_hints):
    assert get_hint(puzzle_with_hints, 1) is None


def test_get_hint_level_1(puzzle_with_hints):
    assert get_hint(puzzle_with_hints, 2) == "Think simple."


def test_get_hint_level_2(puzzle_with_hints):
    assert get_hint(puzzle_with_hints, 4) == "It’s a phrase."


def test_get_hint_level_3(puzzle_with_hints):
    assert get_hint(puzzle_with_hints, 6) == "OpenSesame"

# REVEAL ANSWER — can_reveal_answer() / reveal_answer()

def test_can_reveal_answer_locked():
    assert can_reveal_answer(7) is False


def test_can_reveal_answer_unlocked():
    assert can_reveal_answer(8) is True


def test_reveal_answer_marks_completed(session, string_puzzle):
    answer = reveal_answer(string_puzzle, session)
    session.refresh_from_db()

    assert answer == "OpenSesame"
    assert string_puzzle.id in session.completed_puzzles.values_list("id", flat=True)
    assert session.revealed_answers == 1

# PUZZLE SEQUENCING — get_next_puzzle()

def test_get_next_puzzle_linear(db, challenge):
    p1 = Puzzle.objects.create(
        challenge=challenge,
        order=1,
        flow_type="linear",
    )
    p2 = Puzzle.objects.create(
        challenge=challenge,
        order=2,
        flow_type="linear",
    )
    p1.next_puzzle = p2
    p1.save()

    assert get_next_puzzle(p1) == p2


def test_get_next_puzzle_branching(db, challenge):
    p_yes = Puzzle.objects.create(challenge=challenge, order=2)
    p_no = Puzzle.objects.create(challenge=challenge, order=3)

    p1 = Puzzle.objects.create(
        challenge=challenge,
        flow_type="branching",
        branches={
            "yes": p_yes.id,
            "no": p_no.id,
        }
    )

    assert get_next_puzzle(p1, "yes") == p_yes
    assert get_next_puzzle(p1, "no") == p_no

# PROGRESS TRACKING — update_progress()

def test_update_progress_correct_with_hint(session, string_puzzle):
    update_progress(session, string_puzzle, correct=True, hint_used=True)
    session.refresh_from_db()

    assert session.attempts == 1
    assert session.hints_used == 1
    assert string_puzzle.id in session.completed_puzzles.values_list("id", flat=True)


def test_update_progress_incorrect_no_hint(session, string_puzzle):
    update_progress(session, string_puzzle, correct=False, hint_used=False)
    session.refresh_from_db()

    assert session.attempts == 1
    assert session.hints_used == 0
    assert session.completed_puzzles.count() == 0

# COMPLETION — check_completion() / finalize_run()

def test_check_completion_true(session, challenge, string_puzzle):
    session.completed_puzzles.add(string_puzzle)
    assert check_completion(session, challenge) is True


def test_finalize_run_sets_end_time_and_duration(session, challenge):
    finalize_run(session, challenge)
    session.refresh_from_db()

    assert session.completed is True
    assert session.end_time is not None
    assert session.total_time_seconds >= 0

# TIMED MODE — check_timeout() / handle_timeout()

def test_check_timeout_triggered(session, timed_challenge):
    session.challenge = timed_challenge
    session.start_time = timezone.now() - timezone.timedelta(seconds=5)
    session.save()

    assert check_timeout(session, timed_challenge) is True


def test_check_timeout_not_triggered_when_disabled(session, challenge):
    assert check_timeout(session, challenge) is False


def test_handle_timeout_marks_session(session):
    handle_timeout(session)
    session.refresh_from_db()

    assert session.timed_out is True
    assert session.completed is False
    assert session.end_time is not None

# SESSION INITIALIZATION — start_session()

def test_start_session_creates_session_and_returns_first_puzzle(user, challenge):
    first = Puzzle.objects.create(
        challenge=challenge,
        order=1,
        flow_type="linear"
    )
    session, puzzle = start_session(user, challenge)

    assert session.user == user
    assert session.attempts == 0
    assert puzzle == first

# REGEX EDGE CASES — check_answer()

def test_check_answer_invalid_regex_does_not_crash(db, challenge):
    puzzle = Puzzle.objects.create(
        challenge=challenge,
        match_type="regex",
        correct_answer="(",  # invalid regex pattern
        flow_type="linear",
        order=1,
    )

    # Should fail gracefully, not raise re.error
    assert check_answer("anything", puzzle) is False

# BRANCHING ANSWER EDGE CASES — get_next_puzzle()

def test_get_next_puzzle_branching_case_sensitive(db, challenge):
    p_yes = Puzzle.objects.create(challenge=challenge, order=2)
    p1 = Puzzle.objects.create(
        challenge=challenge,
        flow_type="branching",
        branches={"yes": p_yes.id},
    )

    # Current behavior: case-sensitive match
    assert get_next_puzzle(p1, "Yes") is None
    assert get_next_puzzle(p1, " YES ") is None

# DUPLICATE SUBMISSION SAFETY — update_progress()

def test_update_progress_same_puzzle_twice(session, string_puzzle):
    update_progress(session, string_puzzle, correct=True, hint_used=False)
    update_progress(session, string_puzzle, correct=True, hint_used=False)
    session.refresh_from_db()

    # Attempts increment regardless
    assert session.attempts == 2

    # Puzzle should only appear once
    assert session.completed_puzzles.count() == 1

# REVEAL ANSWER — idempotency

def test_reveal_answer_already_completed_puzzle(session, string_puzzle):
    session.completed_puzzles.add(string_puzzle)
    session.revealed_answers = 0
    session.save()

    answer = reveal_answer(string_puzzle, session)
    session.refresh_from_db()

    assert answer == "OpenSesame"
    assert session.completed_puzzles.count() == 1
    assert session.revealed_answers == 1

# COMPLETION LOGIC — multiple puzzles

def test_check_completion_requires_all_puzzles(db, session, challenge):
    p1 = Puzzle.objects.create(challenge=challenge, order=1)
    p2 = Puzzle.objects.create(challenge=challenge, order=2)

    session.completed_puzzles.add(p1)

    assert check_completion(session, challenge) is False

    session.completed_puzzles.add(p2)
    assert check_completion(session, challenge) is True

# TIMEOUT RACE CONDITION

def test_timeout_before_answer_blocks_progress(session, timed_challenge, string_puzzle):
    session.challenge = timed_challenge
    session.start_time = timezone.now() - timezone.timedelta(seconds=10)
    session.save()

    # Time is already exceeded
    assert check_timeout(session, timed_challenge) is True

    # Even correct answer should not mark completion
    update_progress(session, string_puzzle, correct=True, hint_used=False)
    handle_timeout(session)
    session.refresh_from_db()

    assert session.timed_out is True
    assert session.completed is False
    assert session.completed_puzzles.count() == 0

# SESSION START — missing order edge case

def test_start_session_skips_missing_orders(user, challenge):
    Puzzle.objects.create(challenge=challenge, order=2)

    session, puzzle = start_session(user, challenge)

    assert puzzle.order == 2