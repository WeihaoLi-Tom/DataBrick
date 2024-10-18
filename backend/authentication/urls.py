from django.urls import path
from rest_framework_simplejwt.views import (
    TokenRefreshView,
)

from .views import (
    LoginView, ChangePasswordView, RequestPasswordChangeView, RemoveArtistView,
    ResetPasswordConfirmView, InviteArtistView, AcceptInviteView, SendVerificationCodeView
)

urlpatterns = [
    path('login/', LoginView.as_view(), name='login'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('change-password/', ChangePasswordView.as_view(), name='change_password'),
    path('request-password-change/', RequestPasswordChangeView.as_view(), name='request_password_change'),
    path('reset-password-confirm/<str:token>/', ResetPasswordConfirmView.as_view(), name='reset_password_confirm'),
    path('invite-artist/', InviteArtistView.as_view(), name='invite_artist'),
    path('invite/<str:email>/', AcceptInviteView.as_view(), name='accept_invite'),
    path('remove-artist/', RemoveArtistView.as_view(), name='remove_artist'),
    path('send-code/', SendVerificationCodeView.as_view(), name='send_code'),
]
