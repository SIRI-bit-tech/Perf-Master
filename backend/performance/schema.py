import graphene
from graphene_django import DjangoObjectType
# from graphene_django.filter import DjangoFilterConnectionField
from .models import Project, PerformanceMetric, ComponentAnalysis, PerformanceIssue, OptimizationSuggestion

class ProjectType(DjangoObjectType):
    class Meta:
        model = Project
        fields = "__all__"

class PerformanceMetricType(DjangoObjectType):
    class Meta:
        model = PerformanceMetric
        fields = "__all__"

class ComponentAnalysisType(DjangoObjectType):
    class Meta:
        model = ComponentAnalysis
        fields = "__all__"

class PerformanceIssueType(DjangoObjectType):
    class Meta:
        model = PerformanceIssue
        fields = "__all__"

class OptimizationSuggestionType(DjangoObjectType):
    class Meta:
        model = OptimizationSuggestion
        fields = "__all__"

class Query(graphene.ObjectType):
    all_projects = graphene.List(ProjectType)
    project = graphene.Field(ProjectType, id=graphene.UUID())
    
    all_metrics = graphene.List(PerformanceMetricType, project_id=graphene.UUID())
    metric = graphene.Field(PerformanceMetricType, id=graphene.UUID())
    
    all_components = graphene.List(ComponentAnalysisType, project_id=graphene.UUID())
    component = graphene.Field(ComponentAnalysisType, id=graphene.UUID())
    
    all_issues = graphene.List(PerformanceIssueType, project_id=graphene.UUID())
    issue = graphene.Field(PerformanceIssueType, id=graphene.UUID())
    
    all_suggestions = graphene.List(OptimizationSuggestionType, project_id=graphene.UUID())
    suggestion = graphene.Field(OptimizationSuggestionType, id=graphene.UUID())
    
def resolve_all_projects(self, info):
    # Check if user is authenticated
    if not info.context.user.is_authenticated:
        return Project.objects.none()  # Return empty queryset for anonymous users
    return Project.objects.filter(owner=info.context.user)

def resolve_project(self, info, id):
    if not info.context.user.is_authenticated:
        return None
    return Project.objects.get(id=id, owner=info.context.user)

def resolve_all_metrics(self, info, project_id=None):
    if not info.context.user.is_authenticated:
        return PerformanceMetric.objects.none()
    queryset = PerformanceMetric.objects.filter(project__owner=info.context.user)
    if project_id:
        queryset = queryset.filter(project_id=project_id)
    return queryset

def resolve_all_components(self, info, project_id=None):
    if not info.context.user.is_authenticated:
        return ComponentAnalysis.objects.none()
    queryset = ComponentAnalysis.objects.filter(project__owner=info.context.user)
    if project_id:
        queryset = queryset.filter(project_id=project_id)
    return queryset

def resolve_all_issues(self, info, project_id=None):
    if not info.context.user.is_authenticated:
        return PerformanceIssue.objects.none()
    queryset = PerformanceIssue.objects.filter(project__owner=info.context.user)
    if project_id:
        queryset = queryset.filter(project_id=project_id)
    return queryset

def resolve_all_suggestions(self, info, project_id=None):
    if not info.context.user.is_authenticated:
        return OptimizationSuggestion.objects.none()
    queryset = OptimizationSuggestion.objects.filter(project__owner=info.context.user)
    if project_id:
        queryset = queryset.filter(project_id=project_id)
    return queryset

class CreateProject(graphene.Mutation):
    class Arguments:
        name = graphene.String(required=True)
        description = graphene.String()
    
    project = graphene.Field(ProjectType)
    
    def mutate(self, info, name, description=""):
        project = Project.objects.create(
            name=name,
            description=description,
            owner=info.context.user
        )
        return CreateProject(project=project)

class CreateMetric(graphene.Mutation):
    class Arguments:
        project_id = graphene.UUID(required=True)
        metric_type = graphene.String(required=True)
        value = graphene.Float(required=True)
        url = graphene.String()
    
    metric = graphene.Field(PerformanceMetricType)
    
    def mutate(self, info, project_id, metric_type, value, url=""):
        project = Project.objects.get(id=project_id, owner=info.context.user)
        metric = PerformanceMetric.objects.create(
            project=project,
            metric_type=metric_type,
            value=value,
            url=url
        )
        return CreateMetric(metric=metric)

class Mutation(graphene.ObjectType):
    create_project = CreateProject.Field()
    create_metric = CreateMetric.Field()
