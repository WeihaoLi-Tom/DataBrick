from django.urls import path, include
from rest_framework.routers import DefaultRouter
from videos.api.urls import video_router, show_router
from bricks.api.urls import brick_router, status_router
from videos.api import views

router = DefaultRouter()
# videos & shows
router.registry.extend(show_router.registry)
router.registry.extend(video_router.registry)
# bricks
router.registry.extend(brick_router.registry)
router.registry.extend(status_router.registry)

urlpatterns = [
    path('', include(router.urls)),
    path('artists/', views.artist_list, name='artist_list'),
]