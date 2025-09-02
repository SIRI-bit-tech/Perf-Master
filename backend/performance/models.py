from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
import uuid

class Project(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='projects')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return self.name

class PerformanceMetric(models.Model):
    METRIC_TYPES = [
        ('lcp', 'Largest Contentful Paint'),
        ('fid', 'First Input Delay'),
        ('cls', 'Cumulative Layout Shift'),
        ('fcp', 'First Contentful Paint'),
        ('ttfb', 'Time to First Byte'),
        ('bundle_size', 'Bundle Size'),
        ('memory_usage', 'Memory Usage'),
        ('cpu_usage', 'CPU Usage'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='metrics')
    metric_type = models.CharField(max_length=20, choices=METRIC_TYPES)
    value = models.FloatField()
    timestamp = models.DateTimeField(default=timezone.now)
    url = models.URLField(blank=True)
    user_agent = models.TextField(blank=True)
    
    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['project', 'metric_type', 'timestamp']),
        ]
    
    def __str__(self):
        return f"{self.project.name} - {self.get_metric_type_display()}: {self.value}"

class ComponentAnalysis(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='component_analyses')
    component_name = models.CharField(max_length=200)
    file_path = models.CharField(max_length=500)
    render_time = models.FloatField()
    memory_usage = models.FloatField()
    re_render_count = models.IntegerField(default=0)
    props_count = models.IntegerField(default=0)
    children_count = models.IntegerField(default=0)
    timestamp = models.DateTimeField(default=timezone.now)
    
    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['project', 'component_name']),
        ]
    
    def __str__(self):
        return f"{self.component_name} - {self.render_time}ms"

class PerformanceIssue(models.Model):
    SEVERITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    ]
    
    STATUS_CHOICES = [
        ('open', 'Open'),
        ('in_progress', 'In Progress'),
        ('resolved', 'Resolved'),
        ('ignored', 'Ignored'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='issues')
    title = models.CharField(max_length=200)
    description = models.TextField()
    severity = models.CharField(max_length=10, choices=SEVERITY_CHOICES)
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='open')
    component_name = models.CharField(max_length=200, blank=True)
    file_path = models.CharField(max_length=500, blank=True)
    line_number = models.IntegerField(null=True, blank=True)
    suggested_fix = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.title} ({self.get_severity_display()})"

class OptimizationSuggestion(models.Model):
    SUGGESTION_TYPES = [
        ('code_splitting', 'Code Splitting'),
        ('lazy_loading', 'Lazy Loading'),
        ('memoization', 'Memoization'),
        ('bundle_optimization', 'Bundle Optimization'),
        ('image_optimization', 'Image Optimization'),
        ('caching', 'Caching'),
        ('prefetching', 'Prefetching'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='suggestions')
    suggestion_type = models.CharField(max_length=30, choices=SUGGESTION_TYPES)
    title = models.CharField(max_length=200)
    description = models.TextField()
    code_example = models.TextField(blank=True)
    estimated_improvement = models.CharField(max_length=100, blank=True)
    priority_score = models.IntegerField(default=0)
    is_implemented = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-priority_score', '-created_at']
    
    def __str__(self):
        return self.title
