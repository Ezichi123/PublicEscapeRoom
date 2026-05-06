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


@api_view(['GET'])
def leaderboard(request):
    return Response([
        {"user": "player1", "time": 120},
        {"user": "player2", "time": 150},
    ])

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def submit_score(request):
    data = request.data
    challenge = get_object_or_404(Challenge, pk=data.get("challenge_id"))

    # Update existing entry if user already has one, otherwise create
    entry, created = LeaderboardEntry.objects.update_or_create(
        user=request.user,
        challenge=challenge,
        defaults={
            "total_time_seconds": data.get("total_time_seconds", 0),
            "attempts": data.get("attempts", 0),
            "hints_used": data.get("hints_used", 0),
        }
    )
    serializer = LeaderboardEntrySerializer(entry)
    return Response(serializer.data, status=201 if created else 200)