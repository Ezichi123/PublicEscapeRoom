import json
from django.http import JsonResponse
from django.utils import timezone
from django.shortcuts import get_object_or_404

from challenges.models import Challenge, Puzzle
from gameplay.models import GameSession

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated

from .game_logic import (
    check_answer,
    update_progress,
    get_hint,
    can_reveal_answer,
    get_next_puzzle,
    check_completion,
    finalize_run,
    reveal_answer
)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def start_session_view(request):
    if not request.user.is_authenticated:
        return JsonResponse({"error": "login required"}, status=401)

    challenge_id = request.GET.get("challenge_id")
    challenge = get_object_or_404(Challenge, id=challenge_id)

    first_puzzle = challenge.puzzles.order_by("order").first()
    if not first_puzzle:
        return JsonResponse({"error": "No puzzles"}, status=400)

    session = GameSession.objects.create(
        user=request.user,
        challenge=challenge,
        start_time=timezone.now(),
        current_puzzle=first_puzzle,
        attempts=0,
        completed=False
    )

    return JsonResponse({
        "session_id": session.id,
        "puzzle_id": first_puzzle.id
    })

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_answer(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST required"}, status=405)

    try:
        data = json.loads(request.body.decode("utf-8"))
    except json.JSONDecodeError:
        return JsonResponse({"error": "invalid JSON"}, status=400)

    session = get_object_or_404(GameSession, id=data["session_id"])

    if session.completed:
        return JsonResponse({"error": "session completed"}, status=400)

    puzzle = session.current_puzzle
    answer = data["answer"]

    correct = check_answer(answer, puzzle)

    session.attempts += 1
    session.save()

    hint = get_hint(puzzle, session.attempts)

    next_puzzle = None

    if correct:
        next_puzzle = get_next_puzzle(puzzle, answer)

        if next_puzzle:
            session.current_puzzle = next_puzzle
        else:
            session.completed = True

        session.save()

    return JsonResponse({
        "correct": correct,
        "hint": hint,
        "completed": session.completed,
        "puzzle_id": session.current_puzzle.id if session.current_puzzle else None
    })


def get_hint_view(request):
    puzzle = get_object_or_404(Puzzle, id=request.GET.get("puzzle_id"))
    attempts = int(request.GET.get("attempts", 0))

    return JsonResponse({
        "hint": get_hint(puzzle, attempts)
    })


def reveal_answer_view(request):
    data = json.loads(request.body.decode("utf-8"))

    puzzle = get_object_or_404(Puzzle, id=data["puzzle_id"])
    session = get_object_or_404(GameSession, id=data["session_id"])

    return JsonResponse({
        "answer": reveal_answer(puzzle, session)
    })