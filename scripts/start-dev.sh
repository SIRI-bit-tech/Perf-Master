#!/bin/bash

# PerfMaster Development Startup Script
echo "🚀 Starting PerfMaster Development Environment..."

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not installed."
    exit 1
fi

# Check if PostgreSQL is running
if ! pg_isready -q; then
    echo "⚠️  PostgreSQL is not running. Please start PostgreSQL first."
    echo "   macOS: brew services start postgresql"
    echo "   Ubuntu: sudo systemctl start postgresql"
    exit 1
fi

# Check if Redis is running
if ! redis-cli ping &> /dev/null; then
    echo "⚠️  Redis is not running. Please start Redis first."
    echo "   macOS: brew services start redis"
    echo "   Ubuntu: sudo systemctl start redis"
    exit 1
fi

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
npm install

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
python3 -m pip install -r requirements.txt
cd ..

# Setup database
echo "🗄️  Setting up database..."
cd backend
python3 manage.py migrate
python3 manage.py loaddata fixtures/sample_data.json 2>/dev/null || echo "No sample data found, skipping..."
cd ..

# Start all services
echo "🎯 Starting all services..."
echo "   - Django Backend: http://localhost:8000"
echo "   - Next.js Frontend: http://localhost:3000"
echo "   - GraphQL Playground: http://localhost:8000/graphql"

# Use concurrently to run all services
npx concurrently \
  --names "DJANGO,CELERY,NEXTJS" \
  --prefix-colors "blue,yellow,green" \
  "cd backend && python3 manage.py runserver 8000" \
  "cd backend && celery -A perfmaster worker --loglevel=info" \
  "npm run dev"
