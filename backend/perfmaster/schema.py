import graphene
from performance.schema import Query as PerformanceQuery, Mutation as PerformanceMutation
from ai_analysis.schema import Query as AIQuery, Mutation as AIMutation

class Query(PerformanceQuery, AIQuery, graphene.ObjectType):
    pass

class Mutation(PerformanceMutation, AIMutation, graphene.ObjectType):
    pass

schema = graphene.Schema(query=Query, mutation=Mutation)
