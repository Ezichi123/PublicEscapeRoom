from rest_framework.decorators import api_view
from rest_framework.response import Response

from challenges.models import Challenge
from challenges.serializers import ChallengeSerializer


@api_view(["GET"])
def start_game(request):
    return Response({"message": "game started"})


@api_view(["GET"])
def submit_answer(request):
    return Response({"message": "submit endpoint"})


@api_view(["GET"])
def get_hint(request):
    return Response({"hint": "example hint"})


@api_view(["GET"])
def reveal_solution(request):
    return Response({"solution": "example solution"})


@api_view(["GET"])
def list_challenges(request):
    challenges = Challenge.objects.all()
    serializer = ChallengeSerializer(challenges, many=True)
    return Response(serializer.data)


@api_view(["POST"])
def create_challenge(request):
    serializer = ChallengeSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=400)

@api_view(["GET"])
def get_challenge(request, pk):
    try:
        challenge = Challenge.objects.get(pk=pk)
    except Challenge.DoesNotExist:
        return Response({"error": "Not found"}, status=404)

    serializer = ChallengeSerializer(challenge)
    return Response(serializer.data)