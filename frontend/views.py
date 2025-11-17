from django.conf import settings
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from django.shortcuts import render
import requests
import json
import logging
import os

logger = logging.getLogger(__name__)

CLOUD_RUN_URL = "https://adk-default-service-name-568064825665.us-central1.run.app"

def home(request):
    """Home page view"""
    return render(request, "frontend/index.html")

def chatbot(request):
    """Chatbot page view"""
    return render(request, "frontend/chatbot.html")

@csrf_exempt
@require_http_methods(["POST"])
def chatbot_api(request):
    """
    Proxy endpoint that forwards chat requests to Cloud Run Gemini RAG multi-agent
    """
    try:
        data = json.loads(request.body)
        message = data.get("message", "").strip()
        language = data.get("language", "en")
        session_id = data.get("session_id", "")

        if not message:
            return JsonResponse({"error": "Message cannot be empty"}, status=400)

        logger.info(f"Chat request - Message: {message[:50]}..., Language: {language}")

        # Forward request to Cloud Run service
        try:
            cloud_run_response = requests.post(
                f"{CLOUD_RUN_URL}/chat",
                json={
                    "message": message,
                    "language": language,
                    "session_id": session_id
                },
                timeout=30,
                headers={'Content-Type': 'application/json'}
            )

            logger.info(f"Cloud Run response status: {cloud_run_response.status_code}")

            if cloud_run_response.status_code != 200:
                logger.error(f"Cloud Run error: {cloud_run_response.status_code} - {cloud_run_response.text}")
                return JsonResponse(
                    {"error": f"AI service error: {cloud_run_response.status_code}"},
                    status=cloud_run_response.status_code
                )

            response_data = cloud_run_response.json()
            logger.info(f"Cloud Run response: {response_data}")
            return JsonResponse(response_data)

        except requests.exceptions.Timeout:
            logger.error("Cloud Run request timeout")
            return JsonResponse(
                {"error": "AI service is taking too long to respond. Please try again."},
                status=504
            )
        except requests.exceptions.ConnectionError as e:
            logger.error(f"Cloud Run connection error: {str(e)}")
            return JsonResponse(
                {"error": f"Cannot connect to AI service. Ensure Cloud Run is running: {CLOUD_RUN_URL}"},
                status=502
            )
        except requests.exceptions.RequestException as e:
            logger.error(f"Cloud Run request error: {str(e)}")
            return JsonResponse(
                {"error": f"AI service request failed: {str(e)}"},
                status=502
            )

    except json.JSONDecodeError:
        logger.error("Invalid JSON in request")
        return JsonResponse({"error": "Invalid request format"}, status=400)
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}", exc_info=True)
        return JsonResponse({"error": f"Server error: {str(e)}"}, status=500)
