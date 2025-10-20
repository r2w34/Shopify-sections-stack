#!/bin/bash

# Complete server setup script for Sections Stack
# Run this on the server as root

set -e

APP_DIR="/var/www/sectionit"
DOMAIN="sectionit.indigenservices.com"

echo "🚀 Setting up Sections Stack on $DOMAIN"

# 1. Install Docker Compose if not present
echo "📦 Checking Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    echo "Installing Docker Compose..."
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
fi

# 2. Create app directory
echo "📁 Creating application directory..."
mkdir -p $APP_DIR
cd $APP_DIR

# 3. Check if .env.production exists
if [ ! -f ".env.production" ]; then
    echo "⚠️  .env.production not found. Please create it with your credentials."
    exit 1
fi

# 4. Deploy with Docker Compose
echo "🏗️  Building and starting containers..."
docker-compose -f docker-compose.production.yml down || true
docker-compose -f docker-compose.production.yml up -d --build

# 5. Wait for containers to be healthy
echo "⏳ Waiting for services to start..."
sleep 15

# 6. Configure Nginx
echo "🌐 Configuring Nginx..."
if [ -f "nginx-sectionit.conf" ]; then
    cp nginx-sectionit.conf /etc/nginx/sites-available/sectionit
    ln -sf /etc/nginx/sites-available/sectionit /etc/nginx/sites-enabled/sectionit
    nginx -t && systemctl reload nginx
    echo "✅ Nginx configured successfully"
else
    echo "⚠️  nginx-sectionit.conf not found. Skipping Nginx setup."
fi

# 7. Setup SSL with certbot
echo "🔒 Setting up SSL certificate..."
if command -v certbot &> /dev/null; then
    echo "Running certbot..."
    certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email admin@indigenservices.com || echo "⚠️  Certbot failed. You may need to run it manually."
else
    echo "⚠️  Certbot not installed. Install with: apt-get install certbot python3-certbot-nginx"
fi

# 8. Show status
echo "
✅ Deployment complete!

📊 Container Status:"
docker-compose -f docker-compose.production.yml ps

echo "
📋 Application logs (last 20 lines):"
docker-compose -f docker-compose.production.yml logs --tail=20 app

echo "
🌐 URLs:
   - Application: https://$DOMAIN
   - Local: http://localhost:3002
   
📊 MongoDB:
   - Port: 27018 (local only)
   - Database: sectionsstack
   
📝 Useful commands:
   - View logs: docker-compose -f $APP_DIR/docker-compose.production.yml logs -f
   - Restart: docker-compose -f $APP_DIR/docker-compose.production.yml restart
   - Stop: docker-compose -f $APP_DIR/docker-compose.production.yml down
   - Set admin: docker exec -it sectionstack-app npm run set-admin <shop-domain>
"
