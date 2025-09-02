import graphene
from graphene_django import DjangoObjectType
from .models import AIAnalysisJob, CodeAnalysis, PatternDetection

class AIAnalysisJobType(DjangoObjectType):
    class Meta:
        model = AIAnalysisJob
        fields = "__all__"

class CodeAnalysisType(DjangoObjectType):
    class Meta:
        model = CodeAnalysis
        fields = "__all__"

class PatternDetectionType(DjangoObjectType):
    class Meta:
        model = PatternDetection
        fields = "__all__"

class Query(graphene.ObjectType):
    all_ai_jobs = graphene.List(AIAnalysisJobType, project_id=graphene.UUID())
    ai_job = graphene.Field(AIAnalysisJobType, id=graphene.UUID())
    
    all_code_analyses = graphene.List(CodeAnalysisType, project_id=graphene.UUID())
    code_analysis = graphene.Field(CodeAnalysisType, id=graphene.UUID())
    
    all_patterns = graphene.List(PatternDetectionType, project_id=graphene.UUID())
    pattern = graphene.Field(PatternDetectionType, id=graphene.UUID())
    
    def resolve_all_ai_jobs(self, info, project_id=None):
        queryset = AIAnalysisJob.objects.filter(project__owner=info.context.user)
        if project_id:
            queryset = queryset.filter(project_id=project_id)
        return queryset
    
    def resolve_all_code_analyses(self, info, project_id=None):
        queryset = CodeAnalysis.objects.filter(project__owner=info.context.user)
        if project_id:
            queryset = queryset.filter(project_id=project_id)
        return queryset
    
    def resolve_all_patterns(self, info, project_id=None):
        queryset = PatternDetection.objects.filter(project__owner=info.context.user)
        if project_id:
            queryset = queryset.filter(project_id=project_id)
        return queryset

class StartCodeAnalysis(graphene.Mutation):
    class Arguments:
        project_id = graphene.UUID(required=True)
        code_content = graphene.String(required=True)
        file_path = graphene.String(required=True)
    
    job = graphene.Field(AIAnalysisJobType)
    
    def mutate(self, info, project_id, code_content, file_path):
        from .tasks import analyze_code_performance
        
        job = AIAnalysisJob.objects.create(
            project_id=project_id,
            job_type='code_analysis',
            input_data={
                'code_content': code_content,
                'file_path': file_path
            }
        )
        
        analyze_code_performance.delay(str(job.id))
        return StartCodeAnalysis(job=job)

class Mutation(graphene.ObjectType):
    start_code_analysis = StartCodeAnalysis.Field()
