from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import Challenge
from .serializers import ChallengeSerializer


@api_view(["GET", "POST"])
def challenge_list_create(request):

    if request.method == "GET":
        challenges = Challenge.objects.all()
        serializer = ChallengeSerializer(challenges, many=True)
        return Response(serializer.data)

    if request.method == "POST":
        serializer = ChallengeSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)