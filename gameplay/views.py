from django.http import JsonResponse
from django.utils import timezone
from django.shortcuts import get_object_or_404

from challenges.models import Challenge, Puzzle
from gameplay.models import GameSession

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated

from .game_logic import (
    check_answer,
    get_hint,
    get_next_puzzle,
    check_completion,
    finalize_run,
    reveal_answer
)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def start_session_view(request):
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
    data = request.data

    session_id = data.get("session_id")
    answer = data.get("answer")

    if not session_id:
        return JsonResponse({"error": "session_id required"}, status=400)
    if not answer:
        return JsonResponse({"error": "answer required"}, status=400)

    session = get_object_or_404(GameSession, id=session_id)

    if session.completed:
        return JsonResponse({"error": "session already completed"}, status=400)

    puzzle_id = data.get('puzzle_id')
    if puzzle_id:
        puzzle = get_object_or_404(Puzzle, id=puzzle_id)
    else:
        puzzle = session.current_puzzle

    correct = check_answer(answer, puzzle)

    session.attempts += 1
    session.save()

    hint = get_hint(puzzle, session.attempts)

    if correct:
        session.completed_puzzles.add(puzzle)

        if check_completion(session, session.challenge):
            finalize_run(session, session.challenge)
        else:
            next_puzzle = get_next_puzzle(puzzle, answer)
            if next_puzzle:
                session.current_puzzle = next_puzzle
                session.save()

    return JsonResponse({
        "correct": correct,
        "hint": hint,
        "completed": session.completed,
        "puzzle_id": session.current_puzzle.id if session.current_puzzle else None
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_hint_view(request):
    session = get_object_or_404(GameSession, id=request.GET.get("session_id"))

    puzzle_id = request.GET.get("puzzle_id")
    if puzzle_id:
        puzzle = get_object_or_404(Puzzle, id=puzzle_id)
    else:
        puzzle = session.current_puzzle

    hints_used_for_puzzle = int(request.GET.get("hints_used", 0))
    next_level = hints_used_for_puzzle + 1

    hint_obj = puzzle.hints.filter(level=next_level).first()
    hint_text = hint_obj.text if hint_obj else None

    if hint_text:
        session.hints_used += 1
        session.save()

    return JsonResponse({
        "hint": hint_text or "No more hints available for this puzzle."
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def reveal_answer_view(request):
    session_id = request.data.get("session_id")

    if not session_id:
        return JsonResponse({"error": "session_id required"}, status=400)

    session = get_object_or_404(GameSession, id=session_id)
    puzzle = session.current_puzzle

    return JsonResponse({
        "answer": reveal_answer(puzzle, session)
    })