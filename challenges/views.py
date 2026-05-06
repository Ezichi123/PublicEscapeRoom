from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Challenge, Puzzle, Hint
from .serializers import ChallengeSerializer, PuzzleSerializer, HintSerializer
from rest_framework import status

# Simple in-memory workaround if model unclear
challenges_store = []
id_counter = 1

@api_view(['GET', 'POST'])
def challenges_list(request):
    global id_counter

    if request.method == 'POST':
        data = request.data
        challenge = {
            "id": id_counter,
            "title": data.get("title"),
            "description": data.get("description", ""),
        }
        challenges_store.append(challenge)
        id_counter += 1

        return Response(challenge, status=201)

    return Response(challenges_store)
# --- CHALLENGES ---

@api_view(["GET"])
@permission_classes([AllowAny])
def challenge_list(request):
    challenges = Challenge.objects.all().order_by("-created_at")
    serializer = ChallengeSerializer(challenges, many=True)
    return Response(serializer.data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def challenge_create(request):
    serializer = ChallengeSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(creator=request.user)
        return Response(serializer.data, status=201)
    return Response(serializer.errors, status=400)


@api_view(["GET"])
@permission_classes([AllowAny])
def challenge_detail(request, pk):
    challenge = get_object_or_404(Challenge, pk=pk)
    serializer = ChallengeSerializer(challenge)
    return Response(serializer.data)


@api_view(["PUT", "PATCH"])
@permission_classes([IsAuthenticated])
def challenge_edit(request, pk):
    challenge = get_object_or_404(Challenge, pk=pk)
    if challenge.creator != request.user:
        return Response({"error": "not your challenge"}, status=403)
    serializer = ChallengeSerializer(challenge, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=400)


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def challenge_delete(request, pk):
    challenge = get_object_or_404(Challenge, pk=pk)
    if challenge.creator != request.user:
        return Response({"error": "not your challenge"}, status=403)
    challenge.delete()
    return Response({"message": "deleted"}, status=204)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def my_challenges(request):
    challenges = Challenge.objects.filter(creator=request.user).order_by("-created_at")
    serializer = ChallengeSerializer(challenges, many=True)
    return Response(serializer.data)


# --- PUZZLES ---

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def puzzle_create(request, challenge_pk):
    challenge = get_object_or_404(Challenge, pk=challenge_pk)
    if challenge.creator != request.user:
        return Response({"error": "not your challenge"}, status=403)
    serializer = PuzzleSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(challenge=challenge)
        return Response(serializer.data, status=201)
    return Response(serializer.errors, status=400)


@api_view(["PUT", "PATCH", "DELETE"])
@permission_classes([IsAuthenticated])
def puzzle_edit_delete(request, pk):
    puzzle = get_object_or_404(Puzzle, pk=pk)
    if puzzle.challenge.creator != request.user:
        return Response({"error": "not your challenge"}, status=403)
    if request.method == "DELETE":
        puzzle.delete()
        return Response({"message": "deleted"}, status=204)
    serializer = PuzzleSerializer(puzzle, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=400)


# --- HINTS ---

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def hint_create(request, puzzle_pk):
    puzzle = get_object_or_404(Puzzle, pk=puzzle_pk)
    if puzzle.challenge.creator != request.user:
        return Response({"error": "not your challenge"}, status=403)
    serializer = HintSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(puzzle=puzzle)
        return Response(serializer.data, status=201)
    return Response(serializer.errors, status=400)

@api_view(['PUT', 'DELETE'])
def challenge_detail(request, pk):
    for challenge in challenges_store:
        if challenge["id"] == pk:

            if request.method == 'PUT':
                challenge["title"] = request.data.get("title", challenge["title"])
                return Response(challenge)

            if request.method == 'DELETE':
                challenges_store.remove(challenge)
                return Response(status=204)

    return Response(status=404)