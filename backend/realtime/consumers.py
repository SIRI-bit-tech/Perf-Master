import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import User
from performance.models import Project, PerformanceMetric
import asyncio

class PerformanceConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.project_id = self.scope['url_route']['kwargs']['project_id']
        self.room_group_name = f'performance_{self.project_id}'
        
        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()
        
        # Start sending periodic updates
        asyncio.create_task(self.send_periodic_updates())
    
    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
    
    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message_type = text_data_json.get('type')
        
        if message_type == 'metric_update':
            # Handle real-time metric updates
            await self.handle_metric_update(text_data_json)
        elif message_type == 'subscribe_metrics':
            # Subscribe to specific metrics
            await self.handle_subscribe_metrics(text_data_json)
    
    async def handle_metric_update(self, data):
        # Save metric to database
        await self.save_metric(data)
        
        # Broadcast to room group
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'metric_message',
                'data': data
            }
        )
    
    async def handle_subscribe_metrics(self, data):
        metric_types = data.get('metric_types', [])
        # Store subscription preferences
        self.subscribed_metrics = metric_types
    
    async def metric_message(self, event):
        data = event['data']
        
        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'metric_update',
            'data': data
        }))
    
    async def send_periodic_updates(self):
        """Send periodic performance updates"""
        while True:
            try:
                # Get latest metrics
                metrics = await self.get_latest_metrics()
                
                await self.send(text_data=json.dumps({
                    'type': 'periodic_update',
                    'data': {
                        'metrics': metrics,
                        'timestamp': asyncio.get_event_loop().time()
                    }
                }))
                
                # Wait 5 seconds before next update
                await asyncio.sleep(5)
                
            except Exception as e:
                print(f"Error in periodic updates: {e}")
                break
    
    @database_sync_to_async
    def save_metric(self, data):
        try:
            project = Project.objects.get(id=self.project_id)
            PerformanceMetric.objects.create(
                project=project,
                metric_type=data.get('metric_type'),
                value=data.get('value'),
                url=data.get('url', ''),
                user_agent=data.get('user_agent', '')
            )
        except Exception as e:
            print(f"Error saving metric: {e}")
    
    @database_sync_to_async
    def get_latest_metrics(self):
        try:
            project = Project.objects.get(id=self.project_id)
            metrics = PerformanceMetric.objects.filter(
                project=project
            ).order_by('-timestamp')[:10]
            
            return [
                {
                    'id': str(metric.id),
                    'metric_type': metric.metric_type,
                    'value': metric.value,
                    'timestamp': metric.timestamp.isoformat(),
                    'url': metric.url
                }
                for metric in metrics
            ]
        except Exception as e:
            print(f"Error getting metrics: {e}")
            return []

class ComponentAnalysisConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.project_id = self.scope['url_route']['kwargs']['project_id']
        self.room_group_name = f'components_{self.project_id}'
        
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()
    
    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
    
    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message_type = text_data_json.get('type')
        
        if message_type == 'component_analysis':
            await self.handle_component_analysis(text_data_json)
    
    async def handle_component_analysis(self, data):
        # Process component analysis data
        await self.save_component_analysis(data)
        
        # Broadcast to room group
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'analysis_message',
                'data': data
            }
        )
    
    async def analysis_message(self, event):
        data = event['data']
        
        await self.send(text_data=json.dumps({
            'type': 'component_analysis',
            'data': data
        }))
    
    @database_sync_to_async
    def save_component_analysis(self, data):
        from performance.models import ComponentAnalysis
        
        try:
            project = Project.objects.get(id=self.project_id)
            ComponentAnalysis.objects.create(
                project=project,
                component_name=data.get('component_name'),
                file_path=data.get('file_path'),
                render_time=data.get('render_time', 0),
                memory_usage=data.get('memory_usage', 0),
                re_render_count=data.get('re_render_count', 0),
                props_count=data.get('props_count', 0),
                children_count=data.get('children_count', 0)
            )
        except Exception as e:
            print(f"Error saving component analysis: {e}")
