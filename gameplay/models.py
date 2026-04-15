from django.db import models
from django.contrib.auth.models import User
from challenges.models import Challenge, Puzzle

class GameSession(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    challenge = models.ForeignKey(Challenge, on_delete=models.CASCADE)

    attempts = models.IntegerField(default=0)
    completed = models.BooleanField(default=False)

    completed_puzzles = models.ManyToManyField(Puzzle, blank=True)