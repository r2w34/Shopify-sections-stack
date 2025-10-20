# 🔧 Shopify Partner Dashboard Configuration Guide

## ⚠️ Issue: Getting 404 in Shopify Dashboard

Your app is running perfectly, but Shopify needs to be configured to point to the correct URLs.

---

## 📝 Step-by-Step Configuration

### Step 1: Go to Shopify Partner Dashboard

1. Go to: **https://partners.shopify.com/**
2. Log in with your account
3. Click on **Apps** in the left sidebar
4. Find your app (Client ID: `edb7676b0b64cfffcc342eab222baf4a`)
5. Click on the app to open its configuration

---

### Step 2: Update App URLs

In your app configuration, update these settings:

#### **App URL** (Main setting)
```
https://sectionit.indigenservices.com
```

#### **Allowed Redirection URL(s)**
Add these URLs (one per line):
```
https://sectionit.indigenservices.com/auth/callback
https://sectionit.indigenservices.com/auth/shopify/callback  
https://sectionit.indigenservices.com/api/auth/callback
```

---

### Step 3: Update App Proxy (Optional)

If using App Proxy:
- **Subpath prefix:** `apps`
- **Subpath:** `sections-stack`
- **Proxy URL:** `https://sectionit.indigenservices.com`

---

### Step 4: Configure App Extensions

Under **Configuration → Build**:

1. **Scopes (Required permissions):**
   - ✅ `read_themes`
   - ✅ `write_themes`

2. **Webhook Subscriptions:**
   - `app/uninstalled` → `/webhooks/app/uninstalled`
   - `app/scopes_update` → `/webhooks/app/scopes_update`
   - `app_purchases_one_time/update` → `/webhooks/app/purchase-update`

---

### Step 5: Save Changes

1. Click **Save** at the bottom of the page
2. Wait 30 seconds for changes to propagate

---

### Step 6: Test Installation

1. Go to your development store: **ocean-jewelry-and-accessories.myshopify.com**
2. From Shopify Admin, go to **Apps**
3. Click **Install app** or click your app name
4. You should now see the app load correctly!

---

## 🔍 Troubleshooting

### Still Getting 404?

**Check these URLs in Shopify Partner Dashboard:**

✅ **App URL must be EXACTLY:**
```
https://sectionit.indigenservices.com
```

❌ **NOT:**
- ~~http://sectionit.indigenservices.com~~ (missing https)
- ~~https://sectionit.indigenservices.com/~~ (trailing slash)
- ~~https://sectionit.indigenservices.com/app~~ (extra /app)

---

### Getting Authentication Errors?

**Verify Redirect URLs include:**
```
https://sectionit.indigenservices.com/auth/callback
https://sectionit.indigenservices.com/auth/shopify/callback
https://sectionit.indigenservices.com/api/auth/callback
```

---

### App Credentials Verification

Double-check your credentials match what's configured in:
- **Location:** `/var/www/sectionit/.env.production`
- **API Key:** Should match your Shopify Partner Dashboard
- **API Secret:** Should match your Shopify Partner Dashboard

Make sure the credentials in your `.env.production` file match exactly with what's shown in your Shopify Partner Dashboard

---

## 📊 Current Configuration Status

### ✅ Server Side (All Working)
- ✅ App deployed at: https://sectionit.indigenservices.com
- ✅ SSL certificate installed
- ✅ MongoDB running
- ✅ Environment variables set
- ✅ App responding on port 3002
- ✅ Nginx reverse proxy configured

### ⚠️ Shopify Side (Needs Update)
- ⚠️ App URL in Partner Dashboard
- ⚠️ Redirect URLs in Partner Dashboard
- ⚠️ Scopes approval (write_themes needs approval)

---

## 🎯 Quick Test After Configuration

After updating Shopify Partner Dashboard:

1. **Clear browser cache** (Important!)
2. **Go to your Shopify admin:**
   ```
   https://ocean-jewelry-and-accessories.myshopify.com/admin
   ```
3. **Click Apps → Your App Name**
4. **You should see:**
   - App loads without 404
   - Shows "Sections Stack" interface
   - Can browse sections

---

## 📸 Visual Guide

### Where to Find These Settings:

1. **Shopify Partners** → **Apps** → **[Your App]**
2. Look for **App setup** tab
3. Scroll to **URLs** section
4. Update **App URL** and **Allowed redirection URLs**

### Screenshot Locations:
```
App Setup
  └── URLs
      ├── App URL: https://sectionit.indigenservices.com
      └── Allowed redirection URL(s):
          ├── https://sectionit.indigenservices.com/auth/callback
          ├── https://sectionit.indigenservices.com/auth/shopify/callback
          └── https://sectionit.indigenservices.com/api/auth/callback
```

---

## 🔐 Important Notes

### About `write_themes` Scope

Your app uses the `write_themes` scope to add sections to themes. This requires **special approval from Shopify**.

**To apply for approval:**
1. Go to: https://docs.google.com/forms/d/e/1FAIpQLSfZTB1vxFC5d1-GPdqYunWRGUoDcOheHQzfK2RoEFEHrknt5g/viewform
2. Fill out the form explaining your app adds theme sections
3. Wait 1-2 weeks for approval
4. **Note:** App will work in development mode without approval

---

## 🆘 If Still Not Working

### Check Application Logs:
```bash
ssh root@72.60.99.154
cd /var/www/sectionit
docker logs sectionstack-app --tail=100
```

### Look for:
- Authentication errors
- 404 errors with the URL path
- HMAC validation errors

### Common Issues:

**Issue 1: "No route matches URL"**
- **Cause:** Shopify App URL points to wrong path
- **Fix:** Make sure App URL is `https://sectionit.indigenservices.com` (no /app suffix)

**Issue 2: "HMAC validation failed"**
- **Cause:** API Secret doesn't match
- **Fix:** Verify API Secret in Partner Dashboard matches .env.production

**Issue 3: "Invalid shop domain"**
- **Cause:** App not installed on the store
- **Fix:** Install app from Shopify Admin → Apps

---

## ✅ Success Checklist

After configuration, you should be able to:

- [ ] Access app from Shopify Admin
- [ ] See Sections Stack interface
- [ ] Browse available sections
- [ ] View section details
- [ ] Purchase free sections (instantly)
- [ ] Purchase paid sections (test mode)
- [ ] Add sections to themes
- [ ] Access admin panel (after setting admin user)

---

## 🎉 Expected Flow

### Correct Flow:
1. Merchant clicks app in Shopify Admin
2. Shopify redirects to: `https://sectionit.indigenservices.com`
3. App redirects to: `https://sectionit.indigenservices.com/auth?shop=...`
4. OAuth flow completes
5. Redirects to: `https://sectionit.indigenservices.com/app`
6. App loads successfully ✅

### What Was Happening (404 Error):
1. Merchant clicks app in Shopify Admin
2. Shopify redirects to: `https://sectionit.indigenservices.com/app/help`
3. Route doesn't exist → 404 Error ❌

---

## 📞 Need Help?

If you continue to see 404 errors after updating the URLs:

1. **Clear browser cache completely**
2. **Try in incognito/private mode**
3. **Wait 1-2 minutes** for Shopify's cache to update
4. **Check the logs** for any errors
5. **Verify** the URLs in Partner Dashboard exactly match this guide

---

## 🔗 Quick Links

- **Shopify Partners:** https://partners.shopify.com/
- **Your App URL:** https://sectionit.indigenservices.com
- **Test Store:** https://ocean-jewelry-and-accessories.myshopify.com/admin
- **Server SSH:** `ssh root@72.60.99.154`

---

**After Configuration:**
Your app should work perfectly! You'll be able to:
- ✅ Access from Shopify Admin
- ✅ Browse and manage sections
- ✅ Purchase sections
- ✅ Add sections to themes
- ✅ Use admin panel

**Happy Deploying! 🚀**
