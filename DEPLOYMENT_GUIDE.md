# 🚀 Deployment Guide - Sections Stack

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Development Setup](#development-setup)
3. [Production Deployment](#production-deployment)
4. [Post-Deployment](#post-deployment)
5. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Accounts & Services

1. **Shopify Partner Account**
   - Sign up at: https://partners.shopify.com/
   - Create a new app in the Partner Dashboard
   - Get API credentials (API Key & Secret)

2. **MongoDB Database**
   - Development: Local MongoDB or MongoDB Atlas free tier
   - Production: MongoDB Atlas (recommended)
   - Sign up at: https://www.mongodb.com/cloud/atlas

3. **Cloudinary Account**
   - Sign up at: https://cloudinary.com/
   - Get Cloud Name, API Key, and API Secret
   - Free tier available

4. **Development Store**
   - Create through Shopify Partner Dashboard
   - Or use an existing Shopify store for testing

5. **Node.js**
   - Version: 18.20+ or 20.10+ or 21.0+
   - Check version: `node --version`

6. **Shopify CLI**
   - Install: `npm install -g @shopify/cli @shopify/app`
   - Verify: `shopify version`

---

## Development Setup

### 1. Clone & Install

```bash
# Clone the repository
git clone <your-repo-url>
cd Shopify-sections-stack

# Install dependencies
npm install
```

### 2. Environment Configuration

```bash
# Copy environment template
cp txt.env.example.txt .env

# Edit .env with your credentials
nano .env
```

**Required Environment Variables:**
```env
# Database
MONGODB_URI=mongodb://localhost:27017/sectionsstack

# Shopify Credentials (from Partner Dashboard)
SHOPIFY_API_KEY=your_api_key
SHOPIFY_API_SECRET=your_api_secret
SHOPIFY_APP_URL=https://your-tunnel.trycloudflare.com
SCOPES=read_themes,write_themes

# Cloudinary Credentials
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Environment
NODE_ENV=development
```

### 3. Start MongoDB (if using local)

```bash
# Using Docker (recommended)
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Or install MongoDB locally
# macOS: brew install mongodb-community
# Ubuntu: sudo apt-get install mongodb
# Windows: Download from mongodb.com
```

### 4. Run Development Server

```bash
# Start the development server
npm run dev

# Or use Shopify CLI
shopify app dev
```

The CLI will:
- Start the development server
- Create a secure tunnel via Cloudflare
- Prompt you to select a development store
- Install the app on your store

### 5. Access the App

1. Press `p` in the terminal to open the preview URL
2. Or go to your development store Admin
3. Navigate to Apps → Your App Name

### 6. Set Up Admin User

After first login, set yourself as admin:

```bash
# Method 1: Use the admin script
npm run set-admin your-store.myshopify.com

# Method 2: Manual MongoDB update
# Open MongoDB shell and run:
db.users.updateOne(
  { shop: "your-store.myshopify.com" },
  { $set: { admin: true, updatedAt: new Date() } }
)
```

---

## Production Deployment

### Option 1: Cloudflare Workers (Recommended)

The app is pre-configured for Cloudflare deployment.

#### 1. Prepare Environment

```bash
# Copy production environment template
cp .env.production.example .env

# Edit with production credentials
nano .env
```

**Production Environment:**
```env
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/sectionsstack
SHOPIFY_API_KEY=production_api_key
SHOPIFY_API_SECRET=production_api_secret
SHOPIFY_APP_URL=https://your-production-domain.com
SCOPES=read_themes,write_themes
CLOUDINARY_CLOUD_NAME=prod_cloud_name
CLOUDINARY_API_KEY=prod_api_key
CLOUDINARY_API_SECRET=prod_api_secret
NODE_ENV=production
```

#### 2. Build Application

```bash
# Build for production
npm run build
```

#### 3. Deploy to Cloudflare

```bash
# Deploy using Shopify CLI
shopify app deploy

# Follow the prompts:
# - Select your Shopify app
# - Confirm deployment
# - Update app URLs in Partner Dashboard
```

#### 4. Update Shopify App URLs

In Shopify Partner Dashboard:
1. Go to your app settings
2. Update **App URL** to your production URL
3. Update **Allowed redirection URLs**:
   - `https://your-domain.com/auth/callback`
   - `https://your-domain.com/auth/shopify/callback`
   - `https://your-domain.com/api/auth/callback`
4. Save changes

### Option 2: Custom Server Deployment

For deploying to your own server (e.g., AWS, DigitalOcean, Heroku):

#### 1. Build Application

```bash
npm run build
```

#### 2. Set Environment Variables

On your server, set all required environment variables.

#### 3. Start Production Server

```bash
# Start the production server
npm start

# Or with PM2 (recommended for production)
pm2 start npm --name "sections-stack" -- start
pm2 save
pm2 startup
```

#### 4. Configure Reverse Proxy (Nginx)

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### 5. SSL Certificate

```bash
# Using Certbot (Let's Encrypt)
sudo certbot --nginx -d your-domain.com
```

---

## Post-Deployment

### 1. Apply for Shopify Scopes

The app requires `write_themes` scope which needs approval:

1. Go to: https://docs.google.com/forms/d/e/1FAIpQLSfZTB1vxFC5d1-GPdqYunWRGUoDcOheHQzfK2RoEFEHrknt5g/viewform
2. Fill out the Shopify Exception App Form
3. Explain your use case (section marketplace)
4. Wait for approval (usually 1-2 weeks)

### 2. Test All Features

- [ ] Install app on test store
- [ ] Browse sections
- [ ] Search and filter
- [ ] Purchase free section
- [ ] Purchase paid section
- [ ] Add section to theme
- [ ] Verify section in theme editor
- [ ] Test admin panel (create/edit/delete)
- [ ] Test image uploads
- [ ] Verify webhooks working

### 3. Set Up Monitoring

#### Error Tracking (Recommended)

**Option 1: Sentry**
```bash
npm install @sentry/remix

# Add to app/entry.server.tsx:
import * as Sentry from "@sentry/remix";

Sentry.init({
  dsn: "your-sentry-dsn",
  environment: process.env.NODE_ENV,
});
```

**Option 2: LogRocket**
```bash
npm install logrocket

# Add to app/root.tsx:
import LogRocket from 'logrocket';
LogRocket.init('your-app-id');
```

#### Database Monitoring

Set up MongoDB Atlas monitoring:
1. Enable alerts for high CPU usage
2. Set up backup schedules
3. Monitor connection pool
4. Track slow queries

#### Uptime Monitoring

Use services like:
- UptimeRobot (free)
- Pingdom
- StatusCake

### 4. Set Up Backups

#### MongoDB Backups

```bash
# Automated daily backup script
#!/bin/bash
DATE=$(date +%Y-%m-%d)
mongodump --uri="$MONGODB_URI" --out="/backups/mongo-$DATE"
```

#### Code Backups

- Ensure code is in Git repository
- Set up automated backups on GitHub/GitLab
- Tag releases: `git tag v1.0.0`

---

## Deployment Checklist

### Pre-Deployment
- [ ] All fixes applied from QUICK_FIXES.md
- [ ] Dependencies installed (`npm install`)
- [ ] Environment variables configured
- [ ] MongoDB production instance ready
- [ ] Cloudinary production account set up
- [ ] Test locally with production build
- [ ] Security audit completed
- [ ] Performance testing done

### During Deployment
- [ ] Build successful (`npm run build`)
- [ ] Deploy command successful
- [ ] URLs updated in Shopify Partner Dashboard
- [ ] Webhooks registered correctly
- [ ] SSL certificate installed (if custom server)

### Post-Deployment
- [ ] App accessible at production URL
- [ ] Can install on test store
- [ ] All features working
- [ ] Webhooks receiving data
- [ ] Monitoring set up
- [ ] Backups configured
- [ ] Admin users set up
- [ ] Documentation updated

---

## Troubleshooting

### Issue: Cannot connect to MongoDB

**Solution:**
```bash
# Check MongoDB is running
docker ps | grep mongo

# Test connection
mongosh "$MONGODB_URI"

# Check firewall rules (if using MongoDB Atlas)
# Add your server IP to whitelist in Atlas dashboard
```

### Issue: Shopify CLI tunnel not working

**Solution:**
```bash
# Try different tunnel service
shopify app dev --tunnel-url=<custom-url>

# Or use ngrok as alternative
ngrok http 3000
```

### Issue: Webhook not receiving data

**Solution:**
1. Check webhook URLs in `shopify.app.toml`
2. Verify webhooks registered: `shopify app webhooks list`
3. Re-register webhooks: `shopify app webhooks register`
4. Check server logs for incoming requests

### Issue: Image upload fails

**Solution:**
```bash
# Verify Cloudinary credentials
# Test with curl:
curl -X POST \
  "https://api.cloudinary.com/v1_1/$CLOUD_NAME/image/upload" \
  -F "file=@test.jpg" \
  -F "api_key=$API_KEY" \
  -F "timestamp=$(date +%s)" \
  -F "signature=<generated-signature>"
```

### Issue: "Permission denied" errors

**Solution:**
- Ensure app has correct scopes in `shopify.app.toml`
- Reinstall app on store
- Apply for `write_themes` scope approval

### Issue: Database connection timeout

**Solution:**
```bash
# Increase connection timeout
# In db.server.ts:
mongoose.connect(MONGODB_URI, {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
});
```

---

## Performance Optimization

### 1. Database Indexes

```javascript
// Add indexes to improve query performance
db.sections.createIndex({ category: 1, createdAt: -1 });
db.sections.createIndex({ tags: 1 });
db.sections.createIndex({ isFree: 1, isPopular: 1 });
db.purchases.createIndex({ userId: 1, sectionId: 1 });
```

### 2. Caching

Consider adding Redis for caching:
```bash
npm install redis

# Cache frequently accessed sections
# Cache theme lists
# Cache user permissions
```

### 3. CDN Configuration

Cloudinary automatically provides CDN for images.

For other assets, configure Cloudflare CDN:
- Enable caching for static assets
- Set appropriate cache rules
- Configure browser cache headers

---

## Security Best Practices

### 1. Environment Variables

- Never commit `.env` files
- Use separate credentials for dev/prod
- Rotate secrets regularly
- Use strong passwords

### 2. Rate Limiting

Consider adding rate limiting:
```bash
npm install express-rate-limit

# Limit API requests per user
# Prevent abuse of purchase endpoints
```

### 3. Input Sanitization

Already implemented in critical routes, but consider:
- Additional validation on admin routes
- File upload size limits
- Content Security Policy headers

### 4. Regular Updates

```bash
# Check for security updates
npm audit

# Fix vulnerabilities
npm audit fix

# Update dependencies
npm update
```

---

## Maintenance

### Regular Tasks

**Daily:**
- Monitor error logs
- Check server health
- Review failed purchases

**Weekly:**
- Database backup verification
- Performance metrics review
- Security patch review

**Monthly:**
- Dependency updates
- Security audit
- Usage analytics review
- Backup restoration test

---

## Scaling Considerations

### When to Scale

- More than 1000 active shops
- High database load (> 80% CPU)
- Slow response times (> 2 seconds)
- Many concurrent users

### Scaling Options

1. **Database Scaling**
   - Upgrade MongoDB Atlas tier
   - Add read replicas
   - Implement sharding

2. **Application Scaling**
   - Horizontal scaling (multiple instances)
   - Load balancer (Nginx/Cloudflare)
   - Caching layer (Redis)

3. **Asset Scaling**
   - Cloudinary auto-scales
   - Additional CDN nodes
   - Optimize image delivery

---

## Support & Resources

### Documentation
- **Shopify Apps**: https://shopify.dev/docs/apps
- **Remix Framework**: https://remix.run/docs
- **MongoDB**: https://docs.mongodb.com/
- **Cloudinary**: https://cloudinary.com/documentation

### Community
- Shopify Partners Slack
- Shopify Community Forums
- Stack Overflow (tag: shopify)

### Monitoring Dashboard Template

Create a monitoring dashboard tracking:
- App installations
- Active users
- Purchases (free vs paid)
- Error rates
- Response times
- Database performance
- API usage

---

## Success Criteria

Your deployment is successful when:

✅ App is accessible at production URL  
✅ Can install on multiple stores  
✅ All CRUD operations work  
✅ Purchases process correctly  
✅ Sections add to themes successfully  
✅ Webhooks receive and process data  
✅ Monitoring shows healthy status  
✅ Error rate < 1%  
✅ Response time < 2 seconds  
✅ Uptime > 99.9%  

---

**Deployment completed?** 

Mark this checklist:
- [ ] Development environment working
- [ ] Production deployed successfully
- [ ] All tests passing
- [ ] Monitoring active
- [ ] Documentation updated
- [ ] Team trained
- [ ] Support process established

**Ready for launch! 🚀**
