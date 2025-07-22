# Presenting **Section Stack** 🧩

Section Stack is a Shopify app that allows merchants to browse, purchase, and add custom theme sections to their Shopify store. Inspired by the "Section Store" app, Section Stack empowers merchants to enhance their storefronts with both free and premium sections, managed through a modern admin interface.

---

## 🚀 Getting Started

### **Prerequisites**
- [Node.js](https://nodejs.org/) (v18+ recommended)
- [Shopify CLI](https://shopify.dev/docs/apps/tools/cli/installation)

### **Setup Instructions**

1. **Clone the repository:**
   ```bash
   git clone https://github.com/hassaanistic/sections-stack.git
   cd sections-stack
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Variables:**
   - Copy the provided `.txt.env.example` to `.env` and fill in your credentials (see below for required keys).
   - You must set up your [Cloudinary](https://cloudinary.com/) credentials for image uploads.

4. **Configure Shopify App Secrets:**
   - Update your `shopify.app.toml` file with your own app secrets.
   - If connecting to your own Shopify app, ensure you update the secrets accordingly.

5. **Run the app locally:**
   ```bash
   shopify app dev
   ```

6. **Deploy a new version:**
   ```bash
   shopify app deploy
   ```

---

## 📁 Folder Structure

```text
sections-stack/
├── app/
│   ├── db.server.ts
│   ├── entry.server.tsx
│   ├── globals.d.ts
│   ├── models/
│   │   ├── PurchaseModel.ts
│   │   ├── sectionContentModel.ts
│   │   ├── SectionModel.ts
│   │   ├── sessionModel.ts
│   │   └── userModel.ts
│   ├── root.tsx
│   ├── routes/
│   │   ├── api.purchase-section.ts
│   │   ├── api.upload.tsx
│   │   ├── app._index.tsx
│   │   ├── app.admin.section.$id.edit.tsx
│   │   ├── app.admin.sections.tsx
│   │   ├── app.my-section.preview.$id.tsx
│   │   ├── app.sections.store.tsx
│   │   ├── app.tsx
│   │   ├── app.unauthorized.tsx
│   │   ├── auth.$.tsx
│   │   ├── auth.login/
│   │   │   ├── error.server.tsx
│   │   │   └── route.tsx
│   │   ├── create-user.tsx
│   │   ├── webhooks.app.purchase-update.ts
│   │   ├── webhooks.app.scopes_update.tsx
│   │   └── webhooks.app.uninstalled.tsx
│   ├── routes.ts
│   ├── shopify.server.ts
│   └── utils/
│       ├── cloudinary.server.ts
│       ├── requireAdmin.ts
│       └── sessionStorage.ts
├── extensions/
├── public/
├── .shopify/
├── .vscode/
├── package.json
├── package-lock.json
├── shopify.app.toml
├── shopify.web.toml
├── tsconfig.json
├── vite.config.ts
├── Dockerfile
├── README.md
└── ...
```

---

## 🌟 What Does Section Stack Do?

- **Merchants** can browse a store of theme sections (free and paid) and purchase any section they like.
- **Admins** can add new sections via the admin routes (only accessible to admins).
- **Free sections** are available to all merchants without billing or purchase.
- **Paid sections** use the Shopify Billing API for secure, one-time purchases.
- **After purchase**, merchants can add the section to any of their store's themes (live or draft). The app fetches all available themes from the merchant's store.
- **Lifetime access:** Once purchased, a section is available to the merchant forever.
- **Theme integration:** After purchase, merchants can easily add the section to their selected theme.
- **Built with:**
  - [Remix](https://remix.run/) (Shopify template)
  - [Shopify GraphQL APIs](https://shopify.dev/docs/api/admin-graphql)
  - [Cloudinary](https://cloudinary.com/) for image uploads
  - Hosted on [Cloudflare](https://www.cloudflare.com/)

---

## 🛠️ Environment Variables Example

Create a `.env` file based on this template:

```env
# .env.example
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
# Add any other required environment variables here
```

---

## 💳 Shopify Billing & Theme Write Scope

- This app uses the [Shopify Billing API](https://shopify.dev/docs/api/billing) for paid sections.
- To use the `theme_write` scope, your app must be approved by Shopify via the [Shopify Exception App Form](https://docs.google.com/forms/d/e/1FAIpQLSfZTB1vxFC5d1-GPdqYunWRGUoDcOheHQzfK2RoEFEHrknt5g/viewform). **You must fill out this form to request access to the required scopes.**

---

## 🔒 Admin-Only Routes
- Admin routes (for adding/editing sections) are only accessible to admin users.

---

## 🎁 Free & Paid Sections
- Free sections are available to all merchants without billing.
- Paid sections require a one-time purchase and are then available for lifetime use.

---

## 🛒 Application Flow
1. **Admin** adds new sections (with images, features, tags, etc.) via the admin interface.
2. **Merchants** browse and search for sections in the store.
3. **Free sections** can be added to themes instantly.
4. **Paid sections** require a one-time purchase (handled via Shopify Billing API).
5. **After purchase**, merchants can select a theme (live or draft) and add the section directly to their store.
6. **All purchased sections remain available for lifetime.**

---

## 💡 Inspiration
This application is inspired by the existing Shopify app "Section Store" but is built from scratch as **Section Stack**.

---

## 🏗️ Tech Stack
- **Remix** (Shopify template)
- **Shopify GraphQL APIs**
- **Cloudinary** for image hosting
- **Cloudflare** for hosting

---

## 📢 Notes
- Make sure to update your `shopify.app.toml` secrets if you connect with your own Shopify app.
- All theme operations require the `theme_write` scope and Shopify's approval.
- Admin routes are protected and not accessible to regular merchants.

---

## 🙌 Enjoy using **Section Stack** to supercharge your Shopify store with beautiful, reusable theme sections!

---

## ❤️ Made with Heart

Thanks for checking out **Section Stack**! I built this app to empower Shopify merchants with flexible, beautifully designed theme sections that are easy to manage and integrate.

If you have any questions, feedback, or you're looking for help with Shopify theme development or customization, feel free to reach out:

📧 Email: [imhassaan.dev@gmail.com](mailto:imhassaan.dev@gmail.com)  
🔗 LinkedIn: [linkedin.com/in/hassaanistic](https://linkedin.com/in/hassaanistic)

**Made with heart — Happy building! 🚀**
