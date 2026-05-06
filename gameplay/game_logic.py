import re
import logging
from django.utils import timezone

logger = logging.getLogger(__name__)

HINT_THRESHOLDS = {
    1: 2,
    2: 4,
    3: 6,
}

REVEAL_ANSWER_THRESHOLD = 8


def check_answer(user_answer, puzzle):
    if not user_answer or not puzzle.correct_answer:
        return False

    user_answer = user_answer.strip()
    correct = puzzle.correct_answer.strip()

    if puzzle.match_type == 'regex':
        if correct.startswith('^'):
            return bool(re.match(correct, user_answer, re.IGNORECASE))
        else:
            return user_answer.lower() == correct.lower()

    elif puzzle.match_type == 'numeric':
        try:
            return float(user_answer.replace(',', '')) == float(correct.replace(',', ''))
        except ValueError:
            return False

    else:
        return user_answer.lower() == correct.lower()


def get_hint(puzzle, attempt_count: int):
    from challenges.models import Hint

    if attempt_count < HINT_THRESHOLDS[1]:
        return None

    hints = list(Hint.objects.filter(puzzle=puzzle).order_by('level'))

    if not hints:
        return None

    if attempt_count < HINT_THRESHOLDS[2]:
        return hints[0].text
    elif attempt_count < HINT_THRESHOLDS[3]:
        return hints[1].text if len(hints) > 1 else hints[0].text
    else:
        return hints[-1].text


def can_reveal_answer(attempt_count: int) -> bool:
    return attempt_count >= REVEAL_ANSWER_THRESHOLD


def reveal_answer(puzzle, session) -> str:
    # ManyToMany — use .add()
    session.completed_puzzles.add(puzzle)
    session.revealed_answers = (session.revealed_answers or 0) + 1
    session.save()
    return puzzle.correct_answer


def get_next_puzzle(current_puzzle, submitted_answer: str = None):
    from challenges.models import Puzzle

    if current_puzzle.flow_type == "linear":
        if current_puzzle.next_puzzle:
            return current_puzzle.next_puzzle

        return Puzzle.objects.filter(
            challenge=current_puzzle.challenge,
            order__gt=current_puzzle.order
        ).order_by('order').first()

    elif current_puzzle.flow_type == "branching":
        if not submitted_answer:
            return None

        branch_key = submitted_answer.strip().lower()
        next_id = current_puzzle.branches.get(branch_key)
        if not next_id:
            return None

        try:
            return Puzzle.objects.get(id=next_id)
        except Puzzle.DoesNotExist:
            return None

    return None


def update_progress(session, puzzle, correct: bool, hint_used: bool = False):
    session.attempts += 1

    if hint_used:
        session.hints_used += 1

    if correct:
        session.completed_puzzles.add(puzzle)

    session.save()


def check_completion(session, challenge) -> bool:
    total_puzzles = challenge.puzzles.count()
    completed = session.completed_puzzles.count()
    return completed >= total_puzzles


def finalize_run(session, challenge):
    session.completed = True
    session.end_time = timezone.now()

    if session.start_time:
        session.total_time_seconds = int(
            (session.end_time - session.start_time).total_seconds()
        )
    else:
        session.total_time_seconds = 0

    session.save()

    logger.info(
        f"Session {session.id} finalized — "
        f"Challenge: {challenge.id}, "
        f"Time: {session.total_time_seconds}s, "
        f"Attempts: {session.attempts}"
    )


def check_timeout(session, challenge) -> bool:
    if not challenge.timed_mode or not session.start_time:
        return False
    elapsed = int((timezone.now() - session.start_time).total_seconds())
    return elapsed > challenge.time_limit_seconds


def handle_timeout(session):
    session.completed = False
    session.timed_out = True
    session.end_time = timezone.now()
    if session.start_time:
        session.total_time_seconds = int(
            (session.end_time - session.start_time).total_seconds()
        )
    session.save()


def start_session(user, challenge):
    from gameplay.models import GameSession

    session = GameSession.objects.create(
        user=user,
        challenge=challenge,
        start_time=timezone.now(),
        attempts=0,
        hints_used=0,
        revealed_answers=0,
        completed=False,
        timed_out=False,
    )

    first_puzzle = challenge.puzzles.order_by('order').first()
    return session, first_puzzle