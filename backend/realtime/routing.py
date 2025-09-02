from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/performance/(?P<project_id>[^/]+)/$', consumers.PerformanceConsumer.as_asgi()),
    re_path(r'ws/components/(?P<project_id>[^/]+)/$', consumers.ComponentAnalysisConsumer.as_asgi()),
]
