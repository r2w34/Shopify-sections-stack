# Sections Stack by Indigen Services 🧩

**A professional Shopify app marketplace for theme sections**

Developed and maintained by **[Indigen Services](https://indigenservices.com)** - Your trusted partner for enterprise-grade Shopify solutions.

Section Stack is a production-ready Shopify app that enables merchants to browse, purchase, and seamlessly integrate custom theme sections into their Shopify stores. Built with modern technology and enterprise-level security, this application provides both free and premium sections through an intuitive admin interface.

🌐 **Live Instance:** [https://sectionit.indigenservices.com](https://sectionit.indigenservices.com)

---

## 🏢 About Indigen Services

**Indigen Services** specializes in developing robust, scalable e-commerce solutions for businesses worldwide. Our expertise includes:

- 🛍️ Custom Shopify App Development
- 🎨 Theme Customization & Development  
- ⚙️ API Integration & Automation
- 🚀 Performance Optimization
- 🔒 Enterprise Security Solutions
- 📊 Analytics & Reporting Tools

**Contact Us:**
- 🌐 Website: [https://indigenservices.com](https://indigenservices.com)
- 📧 Email: [admin@indigenservices.com](mailto:admin@indigenservices.com)
- 💼 Business Inquiries: [info@indigenservices.com](mailto:info@indigenservices.com)

---

## ✨ Key Features

- 🛒 **Section Marketplace** - Browse and purchase from a curated collection of theme sections
- 💳 **Integrated Billing** - Secure payment processing via Shopify Billing API
- 🎨 **One-Click Installation** - Add sections directly to any theme with a single click
- 👥 **Admin Dashboard** - Manage sections, track purchases, and monitor usage
- 🆓 **Free & Paid Options** - Offer both free and premium sections
- ♾️ **Lifetime Access** - Purchased sections remain available forever
- 🔐 **Enterprise Security** - Built with security best practices and data protection
- 📱 **Responsive Design** - Works seamlessly on all devices
- 🐳 **Docker Ready** - Containerized for easy deployment
- 📚 **Comprehensive Documentation** - Detailed guides for setup and deployment

---

## 🚀 Quick Start

### **Prerequisites**

- [Node.js](https://nodejs.org/) (v18.20+ or v20.10+ or v21.0+)
- [Docker](https://www.docker.com/) & Docker Compose (for production deployment)
- [Shopify CLI](https://shopify.dev/docs/apps/tools/cli/installation)
- [MongoDB](https://www.mongodb.com/) (Atlas recommended for production)
- [Cloudinary Account](https://cloudinary.com/) (for image management)

### **Development Setup**

1. **Clone the repository:**
   ```bash
   git clone https://github.com/r2w34/Shopify-sections-stack.git
   cd Shopify-sections-stack
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   ```bash
   cp txt.env.example.txt .env
   ```
   
   Edit `.env` with your credentials:
   ```env
   MONGODB_URI=mongodb://localhost:27017/sectionsstack
   SHOPIFY_API_KEY=your_api_key
   SHOPIFY_API_SECRET=your_api_secret
   SHOPIFY_APP_URL=https://your-tunnel-url.trycloudflare.com
   SCOPES=read_themes,write_themes
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_key
   CLOUDINARY_API_SECRET=your_cloudinary_secret
   NODE_ENV=development
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   # or
   shopify app dev
   ```

5. **Set up admin user:**
   
   After first login, set yourself as admin:
   ```bash
   npm run set-admin your-store.myshopify.com
   ```

### **Production Deployment with Docker**

Sections Stack includes production-ready Docker configuration for seamless deployment.

1. **Configure production environment:**
   ```bash
   cp .env.production.example .env.production
   # Edit with your production credentials
   ```

2. **Deploy with Docker Compose:**
   ```bash
   chmod +x deploy.sh
   ./deploy.sh
   ```

3. **Configure Nginx and SSL** (if not automated):
   ```bash
   chmod +x server-setup.sh
   sudo ./server-setup.sh
   ```

📖 **See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for comprehensive deployment instructions**

---

## 📁 Project Structure

```text
Shopify-sections-stack/
├── app/
│   ├── db.server.ts              # Database connection
│   ├── shopify.server.ts         # Shopify app configuration
│   ├── models/                   # MongoDB data models
│   │   ├── PurchaseModel.ts      # Purchase records
│   │   ├── SectionModel.ts       # Section metadata
│   │   ├── sectionContentModel.ts # Section Liquid code
│   │   ├── sessionModel.ts       # Session management
│   │   └── userModel.ts          # User/shop data
│   ├── routes/                   # Application routes
│   │   ├── app._index.tsx        # Main dashboard
│   │   ├── app.sections.store.tsx # Section marketplace
│   │   ├── app.admin.sections.tsx # Admin panel
│   │   ├── api.purchase-section.ts # Purchase API
│   │   ├── api.upload.tsx        # Image upload API
│   │   └── webhooks/             # Webhook handlers
│   └── utils/                    # Utility functions
│       ├── cloudinary.server.ts  # Image management
│       └── requireAdmin.ts       # Admin protection
├── scripts/
│   └── set-admin.ts              # Admin user setup script
├── docker-compose.production.yml # Docker production config
├── Dockerfile.production         # Docker build instructions
├── deploy.sh                     # Deployment script
├── server-setup.sh               # Server configuration script
├── nginx-sectionit.conf          # Nginx configuration
└── Documentation/
    ├── DEPLOYMENT_GUIDE.md       # Complete deployment guide
    ├── FIXES_APPLIED.md          # Changes and improvements
    ├── START_HERE.md             # Quick navigation guide
    └── READY_TO_DEPLOY.md        # Deployment checklist
```

---

## 🛠️ Technology Stack

### **Backend**
- **Framework:** [Remix](https://remix.run/) (Shopify's recommended React framework)
- **Database:** [MongoDB](https://www.mongodb.com/) with Mongoose ODM
- **Session Storage:** MongoDB via `@shopify/shopify-app-session-storage-mongodb`
- **API:** [Shopify GraphQL Admin API](https://shopify.dev/docs/api/admin-graphql)
- **Authentication:** Shopify OAuth 2.0

### **Frontend**
- **UI Library:** [Shopify Polaris](https://polaris.shopify.com/)
- **Framework:** React 18 with TypeScript
- **Icons:** Polaris Icons & Lucide React

### **Infrastructure**
- **Image Storage:** [Cloudinary](https://cloudinary.com/) with CDN
- **Containerization:** Docker & Docker Compose
- **Web Server:** Nginx (reverse proxy)
- **SSL:** Let's Encrypt (automated)
- **Hosting:** Self-hosted / Cloud-ready

### **Development Tools**
- **Build Tool:** Vite
- **Package Manager:** npm
- **CLI:** Shopify CLI
- **Linting:** ESLint with Prettier

---

## 💡 Core Functionality

### **For Merchants**

1. **Browse Sections**
   - Search and filter by category
   - View detailed previews and features
   - Check pricing and ratings

2. **Purchase Sections**
   - Free sections: Instant access
   - Paid sections: Secure one-time payment via Shopify Billing API
   - Lifetime access to all purchases

3. **Install Sections**
   - Select target theme (live or draft)
   - One-click installation
   - Sections immediately available in theme editor

### **For Admins**

1. **Section Management**
   - Create and edit sections
   - Upload thumbnails and gallery images
   - Set pricing (free or paid)
   - Add features, tags, and categories
   - Mark as popular/trending/featured

2. **Content Management**
   - Upload Liquid code for sections
   - Preview before publishing
   - Edit existing sections
   - Delete sections

3. **Analytics** (Coming Soon)
   - Track purchases and downloads
   - Monitor popular sections
   - View revenue statistics

---

## 🔐 Security Features

- ✅ **OAuth 2.0 Authentication** - Secure Shopify app installation
- ✅ **HMAC Verification** - Request validation
- ✅ **Session Encryption** - Encrypted session storage
- ✅ **Role-Based Access** - Admin-only routes protection
- ✅ **Input Validation** - API request sanitization
- ✅ **SQL Injection Prevention** - MongoDB parameterized queries
- ✅ **HTTPS Enforcement** - SSL/TLS encryption
- ✅ **Environment Isolation** - Dockerized containers
- ✅ **Error Logging** - Comprehensive error tracking

---

## 📋 Environment Variables

### **Required Variables**

```env
# Database
MONGODB_URI=mongodb://localhost:27017/sectionsstack

# Shopify App Credentials
SHOPIFY_API_KEY=your_api_key_here
SHOPIFY_API_SECRET=your_api_secret_here
SHOPIFY_APP_URL=https://your-app-url.com
SCOPES=read_themes,write_themes

# Cloudinary (Image Storage)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Environment
NODE_ENV=development
```

### **Optional Variables**

```env
# Custom Shop Domain (if applicable)
SHOP_CUSTOM_DOMAIN=custom-domain.com

# Port Configuration
PORT=3000
```

---

## 🎯 Shopify App Requirements

### **Required Scopes**

- `read_themes` - Read store themes
- `write_themes` - Add sections to themes

⚠️ **Note:** The `write_themes` scope requires special approval from Shopify. [Apply here](https://docs.google.com/forms/d/e/1FAIpQLSfZTB1vxFC5d1-GPdqYunWRGUoDcOheHQzfK2RoEFEHrknt5g/viewform).

### **Webhook Subscriptions**

- `app/uninstalled` - Cleanup when app is uninstalled
- `app/scopes_update` - Handle scope changes
- `app_purchases_one_time/update` - Process purchase completions

### **Billing Configuration**

- One-time purchase billing
- Test mode available for development
- Automatic production mode in production environment

---

## 🚀 Deployment Options

### **Option 1: Docker (Recommended)**

Complete containerized setup with MongoDB, app server, Nginx, and SSL.

```bash
./deploy.sh
```

**Benefits:**
- ✅ Isolated environment
- ✅ Easy scalability
- ✅ Consistent across environments
- ✅ Simple rollback
- ✅ Production-ready

### **Option 2: Cloud Platforms**

Deploy to major cloud providers:

- **Cloudflare Workers** - Recommended by Shopify
- **AWS ECS/Fargate** - Enterprise-grade
- **Google Cloud Run** - Serverless containers
- **Azure Container Instances** - Microsoft Azure
- **DigitalOcean App Platform** - Developer-friendly

### **Option 3: Traditional Hosting**

Deploy to VPS or dedicated servers with:
- Node.js runtime
- MongoDB instance
- Nginx reverse proxy
- SSL certificate

---

## 📚 Documentation

### **Quick Links**

- 📖 [START_HERE.md](START_HERE.md) - Navigation and quick start
- 🚀 [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) - Complete deployment instructions
- ✅ [FIXES_APPLIED.md](FIXES_APPLIED.md) - All changes and improvements
- 🎯 [READY_TO_DEPLOY.md](READY_TO_DEPLOY.md) - Pre-deployment checklist
- 📊 [ANALYSIS_COMPLETE.md](ANALYSIS_COMPLETE.md) - Code analysis summary

### **Shopify Resources**

- [Shopify App Development](https://shopify.dev/docs/apps)
- [Shopify CLI Documentation](https://shopify.dev/docs/apps/tools/cli)
- [Shopify Admin API](https://shopify.dev/docs/api/admin-graphql)
- [Shopify Polaris](https://polaris.shopify.com/)

---

## 🛠️ Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint

# Set admin user
npm run set-admin <shop-domain>

# Deploy with Shopify CLI
shopify app deploy
```

---

## 🐳 Docker Commands

```bash
# Build and start containers
docker-compose -f docker-compose.production.yml up -d --build

# View logs
docker-compose -f docker-compose.production.yml logs -f

# Stop containers
docker-compose -f docker-compose.production.yml down

# Restart specific service
docker-compose -f docker-compose.production.yml restart app

# Access app shell
docker exec -it sectionstack-app sh

# Access MongoDB shell
docker exec -it sectionstack-mongodb mongosh -u sectionstack -p 'SecurePass123!@#' --authenticationDatabase admin sectionsstack
```

---

## 🤝 Support & Contributions

### **Get Support**

For technical support, bug reports, or feature requests:

- 📧 Email: [admin@indigenservices.com](mailto:admin@indigenservices.com)
- 🌐 Website: [https://indigenservices.com](https://indigenservices.com)
- 📖 Documentation: Check the `/docs` folder

### **Enterprise Support**

Indigen Services offers enterprise-level support including:

- 🔧 Custom feature development
- 🚀 Performance optimization
- 🔒 Security audits
- 📊 Analytics integration
- 🎓 Team training
- 💼 Dedicated support channels

**Contact us for enterprise inquiries:** [info@indigenservices.com](mailto:info@indigenservices.com)

---

## 📄 License

Copyright © 2025 Indigen Services. All rights reserved.

This software is proprietary and confidential. Unauthorized copying, distribution, or use of this software, via any medium, is strictly prohibited.

For licensing inquiries, please contact: [admin@indigenservices.com](mailto:admin@indigenservices.com)

---

## 🙏 Acknowledgments

- Built with [Shopify Remix Template](https://github.com/Shopify/shopify-app-template-remix)
- UI components from [Shopify Polaris](https://polaris.shopify.com/)
- Inspired by the Shopify App ecosystem
- Powered by modern web technologies

---

## 📊 Project Status

- ✅ **Status:** Production Ready
- 🌐 **Live:** [https://sectionit.indigenservices.com](https://sectionit.indigenservices.com)
- 📅 **Last Updated:** October 2025
- 🔖 **Version:** 2.0.0
- 🏗️ **Maintenance:** Active Development

---

## 🎯 Roadmap

### **Upcoming Features**

- [ ] Advanced analytics dashboard
- [ ] Section ratings and reviews
- [ ] Bulk section import/export
- [ ] Section versioning
- [ ] Multi-language support
- [ ] Advanced search with filters
- [ ] Section categories and collections
- [ ] Automated backups
- [ ] API for third-party integrations

---

<div align="center">

**Made with ❤️ by [Indigen Services](https://indigenservices.com)**

*Empowering businesses with innovative e-commerce solutions*

[Website](https://indigenservices.com) • [Email](mailto:admin@indigenservices.com) • [Support](mailto:info@indigenservices.com)

</div>
