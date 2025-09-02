#!/bin/bash

# PerfMaster Deployment Script
set -e

echo "🚀 Starting PerfMaster deployment..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if required environment variables are set
if [ -z "$DATABASE_URL" ]; then
    echo "⚠️  DATABASE_URL not set, using default PostgreSQL configuration"
fi

# Build and start services
echo "📦 Building Docker images..."
docker-compose build --no-cache

echo "🗄️  Starting database services..."
docker-compose up -d postgres redis

echo "⏳ Waiting for database to be ready..."
sleep 10

# Initialize database
echo "🔧 Initializing database schema..."
docker-compose exec -T postgres psql -U perfmaster -d perfmaster -f /docker-entrypoint-initdb.d/create-database-schema.sql

echo "🌱 Seeding sample data..."
docker-compose exec -T postgres psql -U perfmaster -d perfmaster -f /docker-entrypoint-initdb.d/seed-sample-data.sql

echo "🌐 Starting frontend application..."
docker-compose up -d frontend

echo "🔄 Starting reverse proxy..."
docker-compose up -d nginx

echo "✅ PerfMaster deployment completed successfully!"
echo ""
echo "🌍 Application is now running at:"
echo "   Frontend: http://localhost:3000"
echo "   Nginx Proxy: http://localhost:80"
echo ""
echo "📊 Database connections:"
echo "   PostgreSQL: localhost:5432"
echo "   Redis: localhost:6379"
echo ""
echo "🔍 To view logs:"
echo "   docker-compose logs -f"
echo ""
echo "🛑 To stop all services:"
echo "   docker-compose down"
