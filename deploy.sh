#!/bin/bash

# Deployment script for Sections Stack on sectionit.indigenservices.com

set -e

echo "🚀 Starting deployment of Sections Stack..."

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    echo "❌ Error: .env.production file not found!"
    echo "Please copy .env.production.example and fill in your credentials"
    exit 1
fi

# Stop existing containers if any
echo "📦 Stopping existing containers..."
docker-compose -f docker-compose.production.yml down || true

# Remove old images
echo "🧹 Cleaning up old images..."
docker image prune -f

# Build and start containers
echo "🏗️  Building and starting containers..."
docker-compose -f docker-compose.production.yml up -d --build

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
sleep 10

# Check container status
echo "✅ Checking container status..."
docker-compose -f docker-compose.production.yml ps

# Show logs
echo "📋 Recent logs:"
docker-compose -f docker-compose.production.yml logs --tail=50

echo "
✅ Deployment complete!

🌐 Application running on port 3002
📊 MongoDB running on port 27018

Next steps:
1. Configure Nginx reverse proxy for sectionit.indigenservices.com
2. Setup SSL certificate with certbot
3. Test the application

To view logs: docker-compose -f docker-compose.production.yml logs -f
To stop: docker-compose -f docker-compose.production.yml down
"
