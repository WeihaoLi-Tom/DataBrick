# authentication/views.py
from django.contrib.auth import authenticate, login
from django.contrib.auth.models import User
from django.core.mail import send_mail
from django.conf import settings
from django.utils.crypto import get_random_string
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework_simplejwt.tokens import RefreshToken

import logging
import socket
from .models import UserProfile, PasswordResetToken

logger = logging.getLogger(__name__)

class SendVerificationCodeView(APIView):
    def post(self, request):
        username = request.data.get('username')

        # check whether username exist
        user = User.objects.filter(username=username).first()
        if not user:
            # check whether email is received
            user = User.objects.filter(email=username).first()
            if not user:
                return Response({'error': 'Username/Email not registered'}, status=404)

        # generate and save verification code
        email = user.email
        verification_code = get_random_string(6, allowed_chars='0123456789')
        user_profile, created = UserProfile.objects.get_or_create(user=user)
        user_profile.verification_code = verification_code
        user_profile.code_expiry = timezone.now() + timezone.timedelta(minutes=10)  # 10 mins to expire
        user_profile.save()

        # send verification code
        try:
            send_mail(
                'Your Login Verification Code',
                f'Your login verification code is: {verification_code}.',
                settings.DEFAULT_FROM_EMAIL,
                [email],
                fail_silently=False,
            )
            return Response({'message': 'Verification code sent'}, status=200)
        except socket.gaierror as e:
            if e.errno == 11001:
                return Response({'error': f'Failed to resolve the hostname. Check your network connection.'}, status=500) 
                # Could also be the SMTP server address, but not helpful error output for standard user
            else:
                return Response({'error': f'Socket error occured: {e}'}, status=500)        
        except Exception as e:
            return Response({'error': 'Failed to send verification code'}, status=500)

# User login view
class LoginView(APIView):
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        verification_code = request.data.get('verification_code')

        user = authenticate(username=username, password=password)
        if not user:
            # Maybe a email is receive, find the related username
            email_user = User.objects.filter(email=username).first()
            if email_user:
                email_username = email_user.username
                user = authenticate(username=email_username, password=password)
            if not user:
                return Response({'error': 'Incorrect login credentials'}, status=status.HTTP_400_BAD_REQUEST)

        # verify user's verification code
        user_profile = UserProfile.objects.filter(user=user).first()
        if not user_profile or user_profile.verification_code != verification_code or user_profile.code_expiry < timezone.now():
            return Response({'error': 'Invalid or expired verification code'}, status=status.HTTP_400_BAD_REQUEST)

        # if verification code is correct, then login and get token
        login(request, user)
        
        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)
        refresh_token = str(refresh)

        # return different information according to user's role
        role = 'admin' if user.is_superuser else 'artist'

        return Response({
            'access_token': access_token,
            'refresh_token': refresh_token,
            'user_id': user.id,
            'role': role,
            'message': f'Welcome, {role.capitalize()}!'
        }, status=status.HTTP_200_OK)

# User password modification view
class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')

        if not user.check_password(old_password):
            return Response({'error': 'Old password is incorrect'}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save()

        # Refresh token to keep the user still logged in
        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)
        refresh_token = str(refresh)

        return Response({
            'message': 'Password changed successfully',
            'access_token': access_token,
            'refresh_token': refresh_token
        }, status=status.HTTP_200_OK)

# User request to reset password view
class RequestPasswordChangeView(APIView):
    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({'error': 'Email is required'}, status=400)

        user = User.objects.filter(email=email).first()
        if not user:
            return Response({'error': 'User with this email not found'}, status=404)
        
        token = PasswordResetToken.objects.create(user=user)

        admin_email = settings.ADMINS[0][1] if settings.ADMINS else settings.DEFAULT_FROM_EMAIL

        # Build approval link
        approve_url = f'{settings.FRONTEND_URL}reset-password-confirm/{token.token}/'

        try:
            send_mail(
                'Password Change Request',
                f'User {user.username} has requested a password change. Approve the request by clicking this link: {approve_url}',
                settings.DEFAULT_FROM_EMAIL,
                [email],
                fail_silently=False,
            )
            admin_email = settings.ADMINS[0][1] if settings.ADMINS else settings.DEFAULT_FROM_EMAIL
            send_mail(
                'User Password Change Request',
                f'User {user.username} has requested a password change.',
                settings.DEFAULT_FROM_EMAIL,
                [admin_email],
                fail_silently=False,
            )

            return Response({'message': 'Password change request sent to user and admin'}, status=200)
        except socket.gaierror as e:
            if e.errno == 11001:
                return Response({'error': f'Failed to resolve the hostname. Check your network connection.'}, status=500) 
                # Could also be the SMTP server address, but not helpful error output for standard user
            else:
                return Response({'error': f'Socket error occured: {e}'}, status=500)        
        except Exception as e:
            logger.error(f"Failed to send email: {str(e)}")
            return Response({'error': 'Failed to send password change request'}, status=500)

# Password reset confirmation view
class ResetPasswordConfirmView(APIView):
    #permission_classes = [IsAdminUser]

    def post(self, request, token):

        try: 
            reset_token = PasswordResetToken.objects.get(token=token)

            if not reset_token.is_valid():
                return Response({'error': 'Token has expired'}, status=status.HTTP_400_BAD_REQUEST)

            user = reset_token.user
            if user:
                # Manually generate a random password
                new_password = get_random_string(8)  # Generate a random string of length 8
                user.set_password(new_password)
                user.save()

                # Send an email to inform the user of the new password
                send_mail(
                    'Your password has been reset',
                    f'Hello {user.username}, your password has been reset. Your new password is: {new_password}',
                    settings.DEFAULT_FROM_EMAIL,
                    [user.email],
                    fail_silently=False,
                )

                # Avoid reusing token
                reset_token.delete() 
                return Response({'message': 'Password reset successful and new password sent to user'}, status=200)
            else:
                return Response({'error': 'User not found'}, status=404)
            
        except PasswordResetToken.DoesNotExist:
            return Response({'error': 'Invalid token'}, status=status.HTTP_400_BAD_REQUEST)
        

# Invite Artists View
class InviteArtistView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request):
        email = request.data.get('email')
        if not email or "@" not in email or "." not in email:
            return Response({'error': 'Email is required'}, status=400)
        
        # check whether username or email exist
        username_user = User.objects.filter(username=email).first()
        email_user = User.objects.filter(email=email).first()
        if username_user or email_user :
            return Response({'error': 'This Email has already been registered'}, status=409)
        
        # Generate a random password
        temp_password = get_random_string(8)
        
        # Create an artist user and set is_active to False
        user = User.objects.create_user(username=email, email=email, password=temp_password, is_staff=False)
        user.is_active = False  
        user.save()

        invite_link = f"{settings.FRONTEND_URL}invite/{email}"

        try:
            send_mail(
                'Invitation to Join as an Artist',
                f'You have been invited to join as an artist. Your temporary password is: {temp_password}. Click the link to activate your account: {invite_link}',
                settings.DEFAULT_FROM_EMAIL,
                [email],
                fail_silently=False,
            )
            return Response({'message': 'Invitation sent to artist'}, status=200)
        except socket.gaierror as e:
            if e.errno == 11001:
                return Response({'error': f'Failed to resolve the hostname. Check your network connection.'}, status=500) 
                # Could also be the SMTP server address, but not helpful error output for standard user
            else:
                return Response({'error': f'Socket error occured: {e}'}, status=500)      
        except Exception as e:
            return Response({'error': f'Failed to send invitation: {str(e)}'}, status=500)

class RemoveArtistView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request):
        email = request.data.get('email')
        user = User.objects.filter(email=email).first()
        
        if user:
           
            if user.is_superuser or user.is_staff:
                return Response({'error': 'Cannot remove admin users'}, status=400)

            user.delete()
            
            try:
                send_mail(
                    'You have been removed as an artist',
                    'Your access to the system has been revoked.',
                    settings.DEFAULT_FROM_EMAIL,
                    [email],
                    fail_silently=False,
                )
                return Response({'message': 'Artist removed and notification sent'}, status=200)
            except socket.gaierror as e:
                if e.errno == 11001:
                    return Response({'error': f'Failed to resolve the hostname. Check your network connection.'}, status=500) 
                    # Could also be the SMTP server address, but not helpful error output for standard user
                else:
                    return Response({'error': f'Socket error occured: {e}'}, status=500)      
            except Exception as e:
                return Response({'error': f'Failed to send removal email: {str(e)}'}, status=500)
        else:
            return Response({'error': 'Artist not found'}, status=404)
        

class AcceptInviteView(APIView):
    def get(self, request, email):
        user = User.objects.filter(username=email).first()
        if user and not user.is_active:
            # Activate user account
            user.is_active = True
            user.save()
            return Response({'message': 'User account activated successfully'}, status=200)
        else:
            return Response({'error': 'Invalid email or user already activated'}, status=404)