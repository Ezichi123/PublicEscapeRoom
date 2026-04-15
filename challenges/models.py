from django.db import models
from django.contrib.auth.models import User

from django.db import models

class Challenge(models.Model):
    creator = models.IntegerField()
    title = models.CharField(max_length=255)
    description = models.TextField()

    timed_mode = models.BooleanField(default=False)
    time_limit_seconds = models.IntegerField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title


class Puzzle(models.Model):
    challenge = models.ForeignKey(
        Challenge,
        related_name="puzzles",
        on_delete=models.CASCADE
    )

    prompt = models.TextField()
    correct_answer = models.CharField(max_length=255)
    order = models.IntegerField(default=1)

    def __str__(self):
        return self.prompt[:30]
    
    from django.db import models

