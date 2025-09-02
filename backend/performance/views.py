from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Avg, Count, Q
from django.utils import timezone
from datetime import timedelta
from .models import Project, PerformanceMetric, ComponentAnalysis, PerformanceIssue, OptimizationSuggestion
from .serializers import (
    ProjectSerializer, PerformanceMetricSerializer, ComponentAnalysisSerializer,
    PerformanceIssueSerializer, OptimizationSuggestionSerializer
)

class ProjectViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Project.objects.filter(owner=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)
    
    @action(detail=True, methods=['get'])
    def dashboard(self, request, pk=None):
        project = self.get_object()
        
        # Get recent metrics
        recent_metrics = PerformanceMetric.objects.filter(
            project=project,
            timestamp__gte=timezone.now() - timedelta(hours=24)
        ).values('metric_type').annotate(
            avg_value=Avg('value'),
            count=Count('id')
        )
        
        # Get component analysis summary
        component_stats = ComponentAnalysis.objects.filter(
            project=project,
            timestamp__gte=timezone.now() - timedelta(hours=24)
        ).aggregate(
            avg_render_time=Avg('render_time'),
            total_components=Count('id'),
            slow_components=Count('id', filter=Q(render_time__gt=16))
        )
        
        # Get open issues
        open_issues = PerformanceIssue.objects.filter(
            project=project,
            status='open'
        ).count()
        
        return Response({
            'metrics': recent_metrics,
            'component_stats': component_stats,
            'open_issues': open_issues,
        })

class PerformanceMetricViewSet(viewsets.ModelViewSet):
    serializer_class = PerformanceMetricSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return PerformanceMetric.objects.filter(
            project__owner=self.request.user
        )
    
    @action(detail=False, methods=['get'])
    def trends(self, request):
        project_id = request.query_params.get('project_id')
        metric_type = request.query_params.get('metric_type')
        hours = int(request.query_params.get('hours', 24))
        
        queryset = self.get_queryset().filter(
            timestamp__gte=timezone.now() - timedelta(hours=hours)
        )
        
        if project_id:
            queryset = queryset.filter(project_id=project_id)
        if metric_type:
            queryset = queryset.filter(metric_type=metric_type)
        
        metrics = queryset.order_by('timestamp').values(
            'timestamp', 'metric_type', 'value'
        )
        
        return Response(list(metrics))

class ComponentAnalysisViewSet(viewsets.ModelViewSet):
    serializer_class = ComponentAnalysisSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return ComponentAnalysis.objects.filter(
            project__owner=self.request.user
        )
    
    @action(detail=False, methods=['get'])
    def slowest(self, request):
        project_id = request.query_params.get('project_id')
        limit = int(request.query_params.get('limit', 10))
        
        queryset = self.get_queryset()
        if project_id:
            queryset = queryset.filter(project_id=project_id)
        
        slowest_components = queryset.order_by('-render_time')[:limit]
        serializer = self.get_serializer(slowest_components, many=True)
        
        return Response(serializer.data)

class PerformanceIssueViewSet(viewsets.ModelViewSet):
    serializer_class = PerformanceIssueSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return PerformanceIssue.objects.filter(
            project__owner=self.request.user
        )
    
    @action(detail=True, methods=['post'])
    def resolve(self, request, pk=None):
        issue = self.get_object()
        issue.status = 'resolved'
        issue.resolved_at = timezone.now()
        issue.save()
        
        serializer = self.get_serializer(issue)
        return Response(serializer.data)

class OptimizationSuggestionViewSet(viewsets.ModelViewSet):
    serializer_class = OptimizationSuggestionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return OptimizationSuggestion.objects.filter(
            project__owner=self.request.user
        )
    
    @action(detail=True, methods=['post'])
    def implement(self, request, pk=None):
        suggestion = self.get_object()
        suggestion.is_implemented = True
        suggestion.save()
        
        serializer = self.get_serializer(suggestion)
        return Response(serializer.data)
