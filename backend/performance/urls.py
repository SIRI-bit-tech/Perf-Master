from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ProjectViewSet, PerformanceMetricViewSet, ComponentAnalysisViewSet,
    PerformanceIssueViewSet, OptimizationSuggestionViewSet
)

router = DefaultRouter()
router.register(r'projects', ProjectViewSet, basename='project')
router.register(r'metrics', PerformanceMetricViewSet, basename='metric')
router.register(r'components', ComponentAnalysisViewSet, basename='component')
router.register(r'issues', PerformanceIssueViewSet, basename='issue')
router.register(r'suggestions', OptimizationSuggestionViewSet, basename='suggestion')

urlpatterns = [
    path('', include(router.urls)),
]
