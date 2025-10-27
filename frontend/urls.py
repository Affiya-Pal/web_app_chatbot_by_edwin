"""
Routes for the frontend app
"""

from django.urls import path
from users.views.authentication import CustomPasswordResetDoneView
from . import views

app_name = "frontend"

urlpatterns = [
    path("", views.home, name="index"),

    # Password Reset Functionality
    path("password-reset-done/", CustomPasswordResetDoneView.as_view(), name="password_reset_done"),
]
