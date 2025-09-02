from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import AIAnalysisJob, CodeAnalysis, PatternDetection
from .serializers import AIAnalysisJobSerializer, CodeAnalysisSerializer, PatternDetectionSerializer
from .tasks import analyze_code_performance, detect_performance_patterns

class AIAnalysisJobViewSet(viewsets.ModelViewSet):
    serializer_class = AIAnalysisJobSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return AIAnalysisJob.objects.filter(project__owner=self.request.user)
    
    @action(detail=False, methods=['post'])
    def analyze_code(self, request):
        project_id = request.data.get('project_id')
        code_content = request.data.get('code_content')
        file_path = request.data.get('file_path')
        
        if not all([project_id, code_content, file_path]):
            return Response(
                {'error': 'project_id, code_content, and file_path are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create analysis job
        job = AIAnalysisJob.objects.create(
            project_id=project_id,
            job_type='code_analysis',
            input_data={
                'code_content': code_content,
                'file_path': file_path
            }
        )
        
        # Start async analysis
        analyze_code_performance.delay(str(job.id))
        
        serializer = self.get_serializer(job)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['post'])
    def detect_patterns(self, request):
        project_id = request.data.get('project_id')
        code_content = request.data.get('code_content')
        file_path = request.data.get('file_path')
        
        if not all([project_id, code_content, file_path]):
            return Response(
                {'error': 'project_id, code_content, and file_path are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create pattern detection job
        job = AIAnalysisJob.objects.create(
            project_id=project_id,
            job_type='pattern_detection',
            input_data={
                'code_content': code_content,
                'file_path': file_path
            }
        )
        
        # Start async pattern detection
        detect_performance_patterns.delay(str(job.id))
        
        serializer = self.get_serializer(job)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class CodeAnalysisViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = CodeAnalysisSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return CodeAnalysis.objects.filter(project__owner=self.request.user)

class PatternDetectionViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = PatternDetectionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return PatternDetection.objects.filter(project__owner=self.request.user)
