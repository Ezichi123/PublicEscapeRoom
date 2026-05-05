from django.db import models
from django.contrib.auth.models import User


class LeaderboardEntry(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="leaderboard_entries")
    challenge = models.ForeignKey("challenges.Challenge", on_delete=models.CASCADE, related_name="leaderboard_entries")
    total_time_seconds = models.IntegerField(default=0)
    attempts = models.IntegerField(default=0)
    hints_used = models.IntegerField(default=0)
    completed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["total_time_seconds", "attempts", "hints_used"]

    def __str__(self):
        return f"{self.user.username} - {self.challenge.title} - {self.total_time_seconds}s"