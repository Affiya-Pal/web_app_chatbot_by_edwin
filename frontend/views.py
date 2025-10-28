from django.conf import settings
from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
import httpx
import json

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

@csrf_exempt
@require_POST
def chatbot_api(request):
    """
    Proxy view to communicate with the Gemini ADK backend on Cloud Run.
    This is a synchronous view.
    """
    try:
        # Get message from the frontend
        data = json.loads(request.body)
        user_message = data.get("message")

        if not user_message:
            return JsonResponse({"error": "Message is required."}, status=400)

        # Ensure a session exists to get a session_id
        if not request.session.session_key:
            request.session.create()
        session_id = request.session.session_key

        # Determine the user_id
        user_id = request.user.username if request.user.is_authenticated else "anonymous_user"

        # Sanitize the base URL to prevent double slashes
        cloud_run_url = settings.CLOUD_RUN_URL.rstrip('/')

        # Construct the full URL for the specific agent endpoint
        api_url = f"{cloud_run_url}/apps/afiyapal_multi_tool_agent/run"

        # Construct the payload according to the provided documentation
        payload = {
            "app_name": "afiyapal_multi_tool_agent",
            "user_id": user_id,
            "session_id": session_id,
            "new_message": {
                "role": "user",
                "parts": [{"text": user_message}]
            }
        }

        # Forward the message to the Cloud Run service using a synchronous client
        with httpx.Client() as client:
            response = client.post(
                api_url,
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=60.0
            )
            response.raise_for_status()  # Raise an exception for bad status codes (4xx or 5xx)

            # Return the AI's response to the frontend
            return JsonResponse(response.json())

    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON."}, status=400)
    except httpx.RequestError as e:
        # Log the error for debugging
        print(f"HTTPX RequestError: {e}")
        if e.response:
            print(f"Response status: {e.response.status_code}")
            print(f"Response body: {e.response.text}")
        return JsonResponse({"error": f"Error communicating with AI service: {e}"}, status=502)
    except Exception as e:
        # Log the error for debugging
        print(f"Unexpected Error: {e}")
        return JsonResponse({"error": f"An unexpected error occurred: {e}"}, status=500)
