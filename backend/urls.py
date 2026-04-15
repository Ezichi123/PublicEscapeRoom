from django.contrib import admin
from django.urls import path, include
from django.http import HttpResponse

def root(request):
    return HttpResponse("Escape Room API is running")

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("gameplay.urls")),
    path("", root),
]

