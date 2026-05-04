"""
game_logic.py
=============
Core game logic for the Escape Room Platform.
Handles answer validation, hint escalation, puzzle progression,
progress tracking, completion detection, and timed mode.

All functions are pure logic — they are called by views.py and
do not handle HTTP requests or responses directly.
"""

import re
import logging
from django.utils import timezone

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# CONSTANTS
# ---------------------------------------------------------------------------

# Number of failed attempts before each hint level is revealed
HINT_THRESHOLDS = {
    1: 2,   # Hint level 1 revealed after 2 failed attempts
    2: 4,   # Hint level 2 revealed after 4 failed attempts
    3: 6,   # Hint level 3 revealed after 6 failed attempts
}

# Number of failed attempts before the "Reveal Answer" button appears
REVEAL_ANSWER_THRESHOLD = 8


# ---------------------------------------------------------------------------
# 1. ANSWER VALIDATION (FR2.2)
#    Supports string, regex, and numeric matching.
# ---------------------------------------------------------------------------

def check_answer(submitted: str, puzzle) -> bool:
    if not submitted:
        return False

    # Standardize the user's input
    submitted = submitted.strip()

    try:
        # String, Multiple Choice, and Combination use text comparison
        if puzzle.match_type in ["string", "multiple_choice", "combination", "image"]:
            return submitted.lower() == puzzle.correct_answer.strip().lower()

        elif puzzle.match_type == "regex":
            pattern = puzzle.correct_answer
            return bool(re.fullmatch(pattern, submitted, re.IGNORECASE))

        elif puzzle.match_type == "numeric":
            # Strip spaces from DB answer before converting to float
            return float(submitted) == float(puzzle.correct_answer.strip())

        else:
            logger.warning(f"Unknown match_type '{puzzle.match_type}' on puzzle {puzzle.id}")
            return False

    except (ValueError, re.error) as e:
        logger.error(f"Answer validation error on puzzle {puzzle.id}: {e}")
        return False


# ---------------------------------------------------------------------------
# 2. HINT ESCALATION (FR2.4)
#    Returns the appropriate hint based on failed attempt count.
#    Hints are fetched from the database (Hint model, ordered by level).
# ---------------------------------------------------------------------------

def get_hint(puzzle, attempt_count: int):
    """
    Returns the appropriate hint text based on how many times
    the user has failed this puzzle.

    Hints are stored in the DB as Hint objects linked to the puzzle,
    each with a 'level' field (1 = vague, 2 = medium, 3 = specific).

    Args:
        puzzle (Puzzle):     The current Puzzle model instance.
        attempt_count (int): Number of failed attempts so far.

    Returns:
        str | None: Hint text, or None if no hint should be shown yet.
    """
    # Import here to avoid circular imports at module level
    from challenges.models import Hint

    if attempt_count < HINT_THRESHOLDS[1]:
        return None  # Too early — no hint yet

    # Fetch all hints for this puzzle ordered from vague to specific
    hints = list(Hint.objects.filter(puzzle=puzzle).order_by('level'))

    if not hints:
        return None  # Creator didn't add hints for this puzzle

    if attempt_count < HINT_THRESHOLDS[2]:
        # 2–3 attempts: show level 1 (vague) hint
        return hints[0].text

    elif attempt_count < HINT_THRESHOLDS[3]:
        # 4–5 attempts: show level 2 (medium) hint, fall back to level 1
        return hints[1].text if len(hints) > 1 else hints[0].text

    else:
        # 6+ attempts: show the most detailed hint available
        return hints[-1].text


# ---------------------------------------------------------------------------
# 3. REVEAL ANSWER (FR2.5)
#    After enough failures, the user can choose to reveal the answer.
# ---------------------------------------------------------------------------

def can_reveal_answer(attempt_count: int) -> bool:
    """
    Returns True if the user has failed enough times to unlock
    the 'Reveal Answer' option.

    Args:
        attempt_count (int): Number of failed attempts on this puzzle.

    Returns:
        bool: True if the reveal button should be shown.
    """
    return attempt_count >= REVEAL_ANSWER_THRESHOLD


def reveal_answer(puzzle, session) -> str:
    """
    Returns the correct answer for a puzzle and marks it as
    completed in the session (so the user can continue).

    Args:
        puzzle (Puzzle):         The current Puzzle model instance.
        session (GameSession):   The active game session.

    Returns:
        str: The correct answer text.
    """
    session.completed_puzzles.add(puzzle.id)
    session.revealed_answers = (session.revealed_answers or 0) + 1
    session.save()
    return puzzle.correct_answer


# ---------------------------------------------------------------------------
# 4. PUZZLE SEQUENCING (FR2.1, FR3.2)
#    Supports linear (one path) and branching (answer-dependent) flow.
# ---------------------------------------------------------------------------

def get_next_puzzle(current_puzzle, submitted_answer: str = None):
    from challenges.models import Puzzle

    if current_puzzle.flow_type == "linear":
        # First try the explicit next_puzzle FK
        if current_puzzle.next_puzzle:
            return current_puzzle.next_puzzle
        
        # Fall back to finding the next puzzle by order
        next_puzzle = Puzzle.objects.filter(
            challenge=current_puzzle.challenge,
            order__gt=current_puzzle.order
        ).order_by('order').first()
        
        return next_puzzle  # returns None if last puzzle

    elif current_puzzle.flow_type == "branching":
        if not submitted_answer:
            logger.warning(f"Branching puzzle {current_puzzle.id} received no answer for routing.")
            return None

        branch_key = submitted_answer.strip().lower()
        branches = current_puzzle.branches

        next_id = branches.get(branch_key)
        if not next_id:
            logger.warning(f"No branch found for answer '{branch_key}' on puzzle {current_puzzle.id}")
            return None

        try:
            return Puzzle.objects.get(id=next_id)
        except Puzzle.DoesNotExist:
            logger.error(f"Branching puzzle ID {next_id} not found in DB.")
            return None

    else:
        logger.warning(f"Unknown flow_type '{current_puzzle.flow_type}' on puzzle {current_puzzle.id}")
        return None


# ---------------------------------------------------------------------------
# 5. PROGRESS TRACKING (FR2.3)
#    Updates the session after every attempt (correct or incorrect).
# ---------------------------------------------------------------------------

def update_progress(session, puzzle, correct: bool, hint_used: bool = False):
    """
    Updates the user's game session after each puzzle attempt.

    Tracks:
      - Total attempts made
      - Hints used
      - Which puzzles have been completed

    Args:
        session (GameSession): The active game session.
        puzzle (Puzzle):       The puzzle that was just attempted.
        correct (bool):        Whether the attempt was correct.
        hint_used (bool):      Whether a hint was shown this attempt.
    """
    session.attempts += 1

    if hint_used:
        session.hints_used += 1

    if correct:
        session.completed_puzzles.add(puzzle.id)

    session.save()


# ---------------------------------------------------------------------------
# 6. COMPLETION CHECK (FR2.3, FR2.6)
#    Detects when all puzzles in a challenge are done.
# ---------------------------------------------------------------------------

def check_completion(session, challenge) -> bool:
    """
    Returns True if the user has completed all puzzles in the challenge.

    Args:
        session (GameSession):   The active game session.
        challenge (EscapeRoom):  The challenge being played.

    Returns:
        bool: True if all puzzles are completed.
    """
    total_puzzles = challenge.puzzles.count()
    completed = session.completed_puzzles.count()
    return completed >= total_puzzles


def finalize_run(session, challenge):
    """
    Called when a challenge is fully completed.
    Records end time, calculates total duration, and marks session complete.
    This data is used by the leaderboard and analytics modules.

    Args:
        session (GameSession):   The completed game session.
        challenge (EscapeRoom):  The challenge that was completed.
    """
    session.completed = True
    session.end_time = timezone.now()

    # Calculate total time in seconds
    if session.start_time:
        session.total_time_seconds = int(
            (session.end_time - session.start_time).total_seconds()
        )
    else:
        session.total_time_seconds = 0
        logger.warning(f"Session {session.id} had no start_time when finalized.")

    session.save()

    logger.info(
        f"Session {session.id} finalized — "
        f"Challenge: {challenge.id}, "
        f"Time: {session.total_time_seconds}s, "
        f"Hints: {session.hints_used}, "
        f"Attempts: {session.attempts}"
    )


# ---------------------------------------------------------------------------
# 7. TIMED MODE (FR4.4)
#    Checks whether the user has exceeded the challenge time limit.
# ---------------------------------------------------------------------------

def check_timeout(session, challenge) -> bool:
    """
    Returns True if the user has exceeded the challenge's time limit.
    Only applies if the challenge has timed_mode enabled.

    Args:
        session (GameSession):   The active game session.
        challenge (EscapeRoom):  The challenge being played.

    Returns:
        bool: True if the session has timed out, False otherwise.
    """
    if not challenge.timed_mode:
        return False  # Not a timed challenge

    if not session.start_time:
        return False

    elapsed_seconds = int((timezone.now() - session.start_time).total_seconds())
    return elapsed_seconds > challenge.time_limit_seconds


def handle_timeout(session):
    """
    Marks the session as failed due to timeout.
    Called by the view when check_timeout() returns True.

    Args:
        session (GameSession): The active game session to terminate.
    """
    session.completed = False
    session.timed_out = True
    session.end_time = timezone.now()

    if session.start_time:
        session.total_time_seconds = int(
            (session.end_time - session.start_time).total_seconds()
        )

    session.save()

    logger.info(f"Session {session.id} timed out after {session.total_time_seconds}s.")


# ---------------------------------------------------------------------------
# 8. SESSION INITIALIZATION
#    Creates and returns a new GameSession when a user starts a challenge.
# ---------------------------------------------------------------------------

def start_session(user, challenge):
    """
    Creates a new GameSession for a user starting a challenge.
    Fetches and returns the first puzzle to present to the user.

    Args:
        user (User):             The authenticated user starting the challenge.
        challenge (EscapeRoom):  The challenge being started.

    Returns:
        tuple: (GameSession, Puzzle) — the new session and the first puzzle.
    """
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

    # First puzzle is the one with the lowest order value
    first_puzzle = challenge.puzzles.order_by('order').first()

    logger.info(f"Session {session.id} started — User: {user.id}, Challenge: {challenge.id}")

    return session, first_puzzle