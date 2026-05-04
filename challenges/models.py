from django.db import models
from django.contrib.auth.models import User


class Challenge(models.Model):
    creator = models.ForeignKey(User, on_delete=models.CASCADE, related_name="challenges", null=True, blank=True)
    title = models.CharField(max_length=255, default="Untitled Challenge")
    description = models.TextField(blank=True, default="")
    scene = models.TextField(blank=True, default="")  # intro scene text
    timed_mode = models.BooleanField(default=False)
    time_limit_seconds = models.IntegerField(default=300)
    created_at = models.DateTimeField(auto_now_add=True)
    is_featured = models.BooleanField(default=False)
    is_daily = models.BooleanField(default=False)
    THEME_CHOICES = [
    ('detective', 'Detective Office'),
    ('haunted', 'Haunted Mansion'),
    ('space', 'Space Station'),
    ('tomb', 'Egyptian Tomb'),
    ('pirate', 'Pirate Ship'),
    ('lab', 'Secret Lab'),
]
    theme = models.CharField(max_length=20, choices=THEME_CHOICES, default='detective')
    daily_date = models.DateField(null=True, blank=True)

    def __str__(self):
        return self.title


class Puzzle(models.Model):
    MATCH_TYPES = [
        ('string', 'Exact Match'),
        ('regex', 'Pattern Match'),
        ('numeric', 'Numeric Match'),
        ('multiple_choice', 'Multiple Choice'),
        ('combination', 'Combination Lock'),
        ('image', 'Image Puzzle'),
    ]

    challenge = models.ForeignKey(Challenge, on_delete=models.CASCADE, related_name="puzzles")
    question = models.TextField(default="")
    match_type = models.CharField(max_length=20, default="string", choices=MATCH_TYPES)
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
    options = models.JSONField(default=list, blank=True)  
    image_url = models.URLField(blank=True, default="")   
    flavor_text = models.TextField(blank=True, default="") 
    combo_length = models.IntegerField(default=4)
    object_name = models.CharField(max_length=100, blank=True, default='')
    object_icon = models.CharField(max_length=10, blank=True, default='')
    object_position = models.JSONField(blank=True, default=dict)
    reward_item = models.CharField(max_length=100, blank=True, default='')
    reward_icon = models.CharField(max_length=10, blank=True, default='')
    unlock_after_order = models.IntegerField(null=True, blank=True)

    def __str__(self):
        return f"Puzzle {self.order} — {self.challenge.title}"


class Hint(models.Model):
    puzzle = models.ForeignKey(Puzzle, on_delete=models.CASCADE, related_name="hints")
    level = models.IntegerField()
    text = models.TextField()