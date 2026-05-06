from django.db import models
from django.contrib.auth.models import User
from challenges.models import Puzzle, Challenge


class GameSession(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)

    challenge = models.ForeignKey(
        "challenges.Challenge",
        on_delete=models.CASCADE
    )

    start_time = models.DateTimeField()

    end_time = models.DateTimeField(
        null=True,
        blank=True
    )

    current_puzzle = models.ForeignKey(
        "challenges.Puzzle",
        null=True,
        blank=True,
        on_delete=models.SET_NULL
    )

    completed_puzzles = models.ManyToManyField(
        "challenges.Puzzle",
        related_name="completed_in_sessions",
        blank=True
    )

    attempts = models.IntegerField(default=0)
    hints_used = models.IntegerField(default=0)
    revealed_answers = models.IntegerField(default=0)

    completed = models.BooleanField(default=False)
    timed_out = models.BooleanField(default=False)

    total_time_seconds = models.IntegerField(default=0)