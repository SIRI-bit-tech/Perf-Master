from django.db import models
from performance.models import Project
import uuid

class AIAnalysisJob(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('running', 'Running'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='ai_jobs')
    job_type = models.CharField(max_length=50)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    input_data = models.JSONField()
    result_data = models.JSONField(null=True, blank=True)
    error_message = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.job_type} - {self.status}"

class CodeAnalysis(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='code_analyses')
    file_path = models.CharField(max_length=500)
    code_content = models.TextField()
    analysis_result = models.JSONField()
    complexity_score = models.FloatField()
    performance_score = models.FloatField()
    maintainability_score = models.FloatField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Analysis for {self.file_path}"

class PatternDetection(models.Model):
    PATTERN_TYPES = [
        ('anti_pattern', 'Anti-pattern'),
        ('performance_issue', 'Performance Issue'),
        ('memory_leak', 'Memory Leak'),
        ('optimization_opportunity', 'Optimization Opportunity'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='patterns')
    pattern_type = models.CharField(max_length=30, choices=PATTERN_TYPES)
    pattern_name = models.CharField(max_length=200)
    description = models.TextField()
    file_path = models.CharField(max_length=500)
    line_start = models.IntegerField()
    line_end = models.IntegerField()
    confidence_score = models.FloatField()
    suggested_fix = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-confidence_score', '-created_at']
    
    def __str__(self):
        return f"{self.pattern_name} in {self.file_path}"
