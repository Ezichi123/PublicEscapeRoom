from django.db import models
from django.contrib.auth.models import User


class Challenge(models.Model):
    creator = models.ForeignKey(User, on_delete=models.CASCADE, related_name="challenges", null=True, blank=True)
    title = models.CharField(max_length=255, default="Untitled Challenge")
    description = models.TextField(blank=True, default="")
    timed_mode = models.BooleanField(default=False)
    time_limit_seconds = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title


class Puzzle(models.Model):
    challenge = models.ForeignKey(Challenge, on_delete=models.CASCADE, related_name="puzzles")
    question = models.TextField(default="")
    match_type = models.CharField(max_length=20, default="string")
    correct_answer = models.CharField(max_length=255, default="")
    flow_type = models.CharField(max_length=20, default="linear")
    next_puzzle = models.ForeignKey(
        "self",
        null=True,
        blank=True,
        on_delete=models.SET_NULL
    )
    branches = models.JSONField(default=dict)
    order = models.IntegerField(default=0)


class Hint(models.Model):
    puzzle = models.ForeignKey(Puzzle, on_delete=models.CASCADE, related_name="hints")
    level = models.IntegerField()
    text = models.TextField()