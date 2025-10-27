from django.http import JsonResponse
from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from decouple import config
import requests

def home(request):
    """Home page view."""
    context = {
        "title": "Home",
        "user": request.user,
    }
    return render(request, "frontend/index.html", context)

def chatbot(request):
    """Renders the chatbot page."""
    return render(request, "frontend/chatbot.html")
