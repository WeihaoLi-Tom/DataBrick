from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import VideoViewSet, ShowViewSet, LocationViewSet
from . import views


video_router = DefaultRouter()
video_router.register(r'videos', VideoViewSet, basename='video')

show_router = DefaultRouter()
show_router.register(r'shows', ShowViewSet, basename='show')


urlpatterns = [
    path('shows/<int:show_id>/assign-artist/', views.assign_artist, name='assign_artist'),
]
