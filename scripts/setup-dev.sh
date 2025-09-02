#!/bin/bash

# PerfMaster Development Setup Script
set -e

echo "🛠️  Setting up PerfMaster development environment..."

# Check Node.js version
NODE_VERSION=$(node --version)
echo "📦 Node.js version: $NODE_VERSION"

if ! command -v node &> /dev/null || ! node -e "process.exit(process.version.match(/^v(\d+)/)[1] >= 18 ? 0 : 1)"; then
    echo "❌ Node.js 18+ is required. Please install Node.js 18 or higher."
    exit 1
fi

# Install dependencies
echo "📥 Installing dependencies..."
npm install

# Setup environment variables
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local file..."
    cat > .env.local << EOL
# Database Configuration
DATABASE_URL=postgresql://perfmaster:perfmaster_password@localhost:5432/perfmaster

# Redis Configuration
REDIS_URL=redis://localhost:6379

# NextAuth Configuration
NEXTAUTH_SECRET=your-secret-key-here-change-in-production
NEXTAUTH_URL=http://localhost:3000

# AI Service API Keys (optional for development)
GROQ_API_KEY=your-groq-api-key
FAL_KEY=your-fal-api-key
DEEPINFRA_API_KEY=your-deepinfra-api-key

# Development Settings
NODE_ENV=development
NEXT_TELEMETRY_DISABLED=1
EOL
    echo "✅ Created .env.local with default values"
    echo "⚠️  Please update API keys in .env.local for full functionality"
else
    echo "✅ .env.local already exists"
fi

# Start development database
echo "🗄️  Starting development database..."
if command -v docker-compose &> /dev/null; then
    docker-compose up -d postgres redis
    echo "⏳ Waiting for database to be ready..."
    sleep 5
    
    # Initialize database
    echo "🔧 Initializing database..."
    curl -X POST http://localhost:3000/api/database/init \
         -H "Content-Type: application/json" \
         -d '{"action":"create_schema"}' || echo "Database will be initialized on first run"
else
    echo "⚠️  Docker Compose not found. Please install Docker to run the database locally."
    echo "   Alternatively, update DATABASE_URL in .env.local to point to your PostgreSQL instance."
fi

# Build the application
echo "🔨 Building application..."
npm run build

echo "✅ Development environment setup completed!"
echo ""
echo "🚀 To start development server:"
echo "   npm run dev"
echo ""
echo "🌍 Application will be available at:"
echo "   http://localhost:3000"
echo ""
echo "📊 Development database:"
echo "   PostgreSQL: localhost:5432"
echo "   Redis: localhost:6379"
echo ""
echo "🔧 Useful commands:"
echo "   npm run dev          - Start development server"
echo "   npm run build        - Build for production"
echo "   npm run start        - Start production server"
echo "   npm run lint         - Run ESLint"
echo "   npm run type-check   - Run TypeScript checks"
