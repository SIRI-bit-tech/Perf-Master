# PerfMaster - AI-Powered Real-Time Performance Analyzer

PerfMaster is a comprehensive, enterprise-grade performance monitoring and optimization platform designed specifically for frontend engineers. It combines real-time performance tracking, AI-powered analysis, and actionable insights to help teams build faster, more efficient web applications.

## 🚀 Features

### Core Performance Monitoring
- **Real-time Core Web Vitals tracking** (LCP, FID, CLS, TTFB, FCP)
- **Component-level performance analysis** with render time tracking
- **Bundle size optimization** with dependency analysis
- **Memory usage monitoring** and leak detection
- **Live performance dashboards** with animated visualizations

### AI-Powered Analysis
- **Intelligent code analysis** using Hugging Face Transformers
- **Automated optimization suggestions** with confidence scoring
- **Pattern recognition** for performance bottlenecks
- **Predictive performance modeling** with TensorFlow.js
- **Auto-fixable issue detection** with code suggestions

### Real-time Collaboration
- **WebSocket-based live monitoring** for team collaboration
- **Performance alerts** with customizable thresholds
- **Team dashboard** with role-based access control
- **Historical performance tracking** and trend analysis
- **Export capabilities** for reports and presentations

### Developer Experience
- **Chrome DevTools-inspired UI** with dark theme
- **Animated particle backgrounds** for engaging visuals
- **Responsive design** optimized for all screen sizes
- **Keyboard shortcuts** for power users
- **Comprehensive API** for custom integrations

## 🛠️ Technology Stack

### Frontend
- **Next.js 15** with App Router and TypeScript
- **React 19** with Server Components and Suspense
- **Tailwind CSS v4** with custom design system
- **Framer Motion** for smooth animations
- **Recharts** for performance visualizations
- **TensorFlow.js** for client-side AI analysis

### Backend & Database
- **Django 5.0** with Django REST Framework
- **GraphQL** with Graphene-Django for flexible API design
- **PostgreSQL** for performance metrics storage
- **Redis** for caching and Celery message broker
- **Django Channels** for WebSocket real-time communication
- **Celery** for background AI processing tasks

### AI & Analytics
- **Hugging Face Transformers** for code analysis and optimization
- **TensorFlow.js** for client-side pattern recognition
- **Custom AI models** for performance optimization
- **Real-time inference** with caching strategies

### Infrastructure
- **Docker** containerization with multi-stage builds
- **Nginx** reverse proxy with SSL termination
- **GitHub Actions** for CI/CD pipeline
- **Vercel** deployment for frontend with Django backend

## 📦 Installation

### Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.11+ and pip
- **PostgreSQL** 14+
- **Redis** 6+
- **Docker** (optional, for containerized deployment)

### Quick Start (Development)

1. **Clone the repository**
   \`\`\`bash
   git clone https://github.com/your-org/perfmaster.git
   cd perfmaster
   \`\`\`

2. **Setup Backend (Django)**
   \`\`\`bash
   # Navigate to backend directory
   cd backend
   
   # Create virtual environment
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   
   # Install dependencies
   pip install -r requirements.txt
   
   # Setup environment variables
   cp .env.example .env
   # Edit .env with your database and API keys
   
   # Run migrations
   python manage.py migrate
   
   # Create superuser
   python manage.py createsuperuser
   
   # Start Django development server
   python manage.py runserver
   \`\`\`

3. **Setup Frontend (Next.js)**
   \`\`\`bash
   # In a new terminal, navigate to project root
   cd ..
   
   # Install dependencies
   npm install
   
   # Setup environment variables
   cp .env.example .env.local
   # Edit .env.local with your configuration
   
   # Start Next.js development server
   npm run dev
   \`\`\`

4. **Start Background Services**
   \`\`\`bash
   # Start Redis (in another terminal)
   redis-server
   
   # Start Celery worker (in backend directory)
   cd backend
   celery -A perfmaster worker --loglevel=info
   
   # Start Celery beat (for scheduled tasks)
   celery -A perfmaster beat --loglevel=info
   \`\`\`

5. **Access the Application**
   - Frontend: `http://localhost:3000`
   - Django Admin: `http://localhost:8000/admin`
   - GraphQL Playground: `http://localhost:8000/graphql`

### Production Deployment

1. **Using Docker Compose**
   \`\`\`bash
   # Build and start all services
   docker-compose up --build -d
   
   # Run migrations
   docker-compose exec backend python manage.py migrate
   
   # Create superuser
   docker-compose exec backend python manage.py createsuperuser
   \`\`\`

2. **Manual Production Setup**
   \`\`\`bash
   # Backend production setup
   cd backend
   pip install -r requirements.txt
   python manage.py collectstatic --noinput
   python manage.py migrate
   gunicorn perfmaster.wsgi:application --bind 0.0.0.0:8000
   
   # Frontend production build
   cd ..
   npm install
   npm run build
   npm start
   \`\`\`

## 🔧 Configuration

### Frontend Environment Variables (.env.local)

\`\`\`env
# Django Backend Configuration
NEXT_PUBLIC_DJANGO_API_URL=http://localhost:8000
NEXT_PUBLIC_WEBSOCKET_URL=ws://localhost:8000/ws
NEXT_PUBLIC_APP_NAME=PerfMaster
NEXT_PUBLIC_APP_VERSION=1.0.0

# AI Integration Keys
HUGGINGFACE_API_KEY=your_huggingface_api_key_here
OPENAI_API_KEY=your_openai_api_key_here

# Analytics
NEXT_PUBLIC_ANALYTICS_ID=your_analytics_id_here
\`\`\`

### Backend Environment Variables (backend/.env)

\`\`\`env
# Django Configuration
DEBUG=True
SECRET_KEY=your-secret-key-here-change-in-production
ALLOWED_HOSTS=localhost,127.0.0.1,0.0.0.0

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/perfmaster
POSTGRES_DB=perfmaster
POSTGRES_USER=perfmaster
POSTGRES_PASSWORD=perfmaster123
POSTGRES_HOST=localhost
POSTGRES_PORT=5432

# Redis & Celery
REDIS_URL=redis://localhost:6379/0
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0

# AI Services
HUGGINGFACE_API_KEY=your_huggingface_api_key_here
OPENAI_API_KEY=your_openai_api_key_here

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# WebSocket
CHANNEL_LAYERS_HOST=localhost
CHANNEL_LAYERS_PORT=6379
\`\`\`

### Database Setup

1. **Create PostgreSQL database**
   \`\`\`sql
   CREATE DATABASE perfmaster;
   CREATE USER perfmaster WITH PASSWORD 'perfmaster123';
   GRANT ALL PRIVILEGES ON DATABASE perfmaster TO perfmaster;
   \`\`\`

2. **Run Django migrations**
   \`\`\`bash
   cd backend
   python manage.py migrate
   \`\`\`

3. **Load sample data**
   \`\`\`bash
   python manage.py loaddata fixtures/sample_data.json
   \`\`\`

## 🎯 Usage

### Basic Performance Monitoring

1. **Start monitoring your application**
   - Navigate to the Dashboard (`/dashboard`)
   - Click "Start Analysis" to begin collecting metrics
   - View real-time performance data and AI insights

2. **Analyze component performance**
   - Go to Components page (`/components`)
   - View detailed component analysis with render times
   - Get AI-powered optimization suggestions

3. **Review analytics**
   - Visit Analytics page (`/analytics`)
   - Track performance trends over time
   - Export reports for stakeholders

### Advanced Features

1. **GraphQL API Usage**
   ```graphql
   query GetPerformanceMetrics($projectId: ID!) {
     performanceMetrics(projectId: $projectId) {
       id
       lcp
       fid
       cls
       timestamp
       suggestions {
         type
         description
         impact
       }
     }
   }
   \`\`\`

2. **REST API Usage**
   \`\`\`javascript
   // Fetch performance data
   const response = await fetch('http://localhost:8000/api/performance/metrics/', {
     headers: {
       'Authorization': 'Bearer your-token-here',
       'Content-Type': 'application/json',
     }
   })
   const data = await response.json()
   \`\`\`

3. **WebSocket Real-time Updates**
   \`\`\`javascript
   const ws = new WebSocket('ws://localhost:8000/ws/performance/')
   
   ws.onmessage = function(event) {
     const data = JSON.parse(event.data)
     console.log('Real-time performance update:', data)
   }
   \`\`\`

## 📊 API Reference

### Django REST API Endpoints

\`\`\`
GET    /api/projects/                    # List all projects
POST   /api/projects/                    # Create new project
GET    /api/projects/{id}/               # Get project details
PUT    /api/projects/{id}/               # Update project
DELETE /api/projects/{id}/               # Delete project

GET    /api/performance/metrics/         # Get performance metrics
POST   /api/performance/metrics/         # Submit new metrics
GET    /api/performance/history/         # Get historical data

GET    /api/components/                  # List components
POST   /api/components/scan/             # Scan for components
GET    /api/components/{id}/             # Get component details

POST   /api/ai/analyze/                  # Submit code for AI analysis
GET    /api/ai/suggestions/{job_id}/     # Get analysis results
POST   /api/ai/patterns/detect/          # Detect performance patterns
\`\`\`

### GraphQL Schema

```graphql
type PerformanceMetric {
  id: ID!
  project: Project!
  lcp: Float!
  fid: Float!
  cls: Float!
  timestamp: DateTime!
  suggestions: [OptimizationSuggestion!]!
}

type OptimizationSuggestion {
  id: ID!
  type: String!
  description: String!
  impact: String!
  confidence: Float!
  autoFixable: Boolean!
}

type Query {
  performanceMetrics(projectId: ID!): [PerformanceMetric!]!
  components(projectId: ID!): [Component!]!
  aiAnalysis(jobId: ID!): AIAnalysisResult
}

type Mutation {
  createProject(input: ProjectInput!): Project!
  submitMetrics(input: MetricsInput!): PerformanceMetric!
  analyzeCode(input: CodeAnalysisInput!): AIAnalysisJob!
}
