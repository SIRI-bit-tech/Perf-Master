from rest_framework import serializers
from .models import AIAnalysisJob, CodeAnalysis, PatternDetection

class AIAnalysisJobSerializer(serializers.ModelSerializer):
    class Meta:
        model = AIAnalysisJob
        fields = [
            'id', 'project', 'job_type', 'status', 'input_data', 'result_data',
            'error_message', 'created_at', 'started_at', 'completed_at'
        ]
        read_only_fields = ['id', 'created_at', 'started_at', 'completed_at']

class CodeAnalysisSerializer(serializers.ModelSerializer):
    class Meta:
        model = CodeAnalysis
        fields = [
            'id', 'project', 'file_path', 'code_content', 'analysis_result',
            'complexity_score', 'performance_score', 'maintainability_score', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

class PatternDetectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = PatternDetection
        fields = [
            'id', 'project', 'pattern_type', 'pattern_name', 'description',
            'file_path', 'line_start', 'line_end', 'confidence_score',
            'suggested_fix', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']
