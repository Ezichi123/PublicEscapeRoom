from rest_framework import serializers
from .models import Challenge, Puzzle, Hint


class HintSerializer(serializers.ModelSerializer):
    class Meta:
        model = Hint
        fields = ["id", "level", "text"]


class PuzzleSerializer(serializers.ModelSerializer):
    hints = HintSerializer(many=True, read_only=True)

    class Meta:
        model = Puzzle
        fields = ["id", "question", "match_type", "correct_answer",
                  "flow_type", "next_puzzle", "branches", "order", "hints"]


class ChallengeSerializer(serializers.ModelSerializer):
    puzzles = PuzzleSerializer(many=True, read_only=True)
    creator = serializers.ReadOnlyField(source="creator.username")

    class Meta:
        model = Challenge
        fields = ["id", "title", "description", "timed_mode",
                  "time_limit_seconds", "created_at", "creator", "puzzles"]