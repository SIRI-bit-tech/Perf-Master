from rest_framework import serializers
from .models import Project, PerformanceMetric, ComponentAnalysis, PerformanceIssue, OptimizationSuggestion

class ProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = ['id', 'name', 'description', 'owner', 'created_at', 'updated_at', 'is_active']
        read_only_fields = ['id', 'owner', 'created_at', 'updated_at']

class PerformanceMetricSerializer(serializers.ModelSerializer):
    class Meta:
        model = PerformanceMetric
        fields = ['id', 'project', 'metric_type', 'value', 'timestamp', 'url', 'user_agent']
        read_only_fields = ['id']

class ComponentAnalysisSerializer(serializers.ModelSerializer):
    class Meta:
        model = ComponentAnalysis
        fields = [
            'id', 'project', 'component_name', 'file_path', 'render_time',
            'memory_usage', 're_render_count', 'props_count', 'children_count', 'timestamp'
        ]
        read_only_fields = ['id']

class PerformanceIssueSerializer(serializers.ModelSerializer):
    class Meta:
        model = PerformanceIssue
        fields = [
            'id', 'project', 'title', 'description', 'severity', 'status',
            'component_name', 'file_path', 'line_number', 'suggested_fix',
            'created_at', 'updated_at', 'resolved_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

class OptimizationSuggestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = OptimizationSuggestion
        fields = [
            'id', 'project', 'suggestion_type', 'title', 'description',
            'code_example', 'estimated_improvement', 'priority_score',
            'is_implemented', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']
