from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BrickViewSet, StatusViewSet


brick_router = DefaultRouter()
brick_router.register(r'bricks', BrickViewSet, basename='brick')

status_router = DefaultRouter()
status_router.register(r'statuses', StatusViewSet, basename='status')
