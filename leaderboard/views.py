from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import LeaderboardEntry
from .serializers import LeaderboardEntrySerializer
from challenges.models import Challenge


@api_view(["GET"])
@permission_classes([AllowAny])
def leaderboard_view(request, challenge_pk):
    challenge = get_object_or_404(Challenge, pk=challenge_pk)
    entries = LeaderboardEntry.objects.filter(challenge=challenge).order_by(
        "total_time_seconds", "attempts", "hints_used"
    )[:20]
    serializer = LeaderboardEntrySerializer(entries, many=True)
    return Response(serializer.data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def submit_score(request):
    from gameplay.models import GameSession
    from gameplay.game_logic import finalize_run

    session_id = request.data.get("session_id")
    if not session_id:
        return Response({"error": "session_id required"}, status=400)

    session = get_object_or_404(GameSession, pk=session_id, user=request.user)

    # If session wasn't finalized properly, finalize it now
    if not session.completed:
        all_puzzle_ids = set(
            session.challenge.puzzles.values_list('id', flat=True)
        )
        completed_ids = set(
            session.completed_puzzles.values_list('id', flat=True)
        )
        if all_puzzle_ids == completed_ids:
            finalize_run(session, session.challenge)
            session.refresh_from_db()
        else:
            return Response({"error": "Session not completed"}, status=400)

    if session.revealed_answers and session.revealed_answers > 0:
        return Response({"error": "Cannot submit — answer was revealed"}, status=403)

    entry, created = LeaderboardEntry.objects.update_or_create(
        user=request.user,
        challenge=session.challenge,
        defaults={
            "total_time_seconds": session.total_time_seconds or 0,
            "attempts": session.attempts or 0,
            "hints_used": session.hints_used or 0,
        }
    )
    serializer = LeaderboardEntrySerializer(entry)
    return Response(serializer.data, status=201 if created else 200)