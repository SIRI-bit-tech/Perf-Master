from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AIAnalysisJobViewSet, CodeAnalysisViewSet, PatternDetectionViewSet

router = DefaultRouter()
router.register(r'jobs', AIAnalysisJobViewSet, basename='ai-job')
router.register(r'analyses', CodeAnalysisViewSet, basename='code-analysis')
router.register(r'patterns', PatternDetectionViewSet, basename='pattern-detection')

urlpatterns = [
    path('', include(router.urls)),
]