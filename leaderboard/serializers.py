from rest_framework import serializers
from .models import LeaderboardEntry


class LeaderboardEntrySerializer(serializers.ModelSerializer):
    username = serializers.ReadOnlyField(source="user.username")
    challenge_title = serializers.ReadOnlyField(source="challenge.title")

    class Meta:
        model = LeaderboardEntry
        fields = ["id", "username", "challenge_title", "total_time_seconds",
                  "attempts", "hints_used", "completed_at"]