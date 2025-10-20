# 🔐 Admin Panel Access Guide - Sections Stack

## 📋 Overview

The Sections Stack app has an **admin panel** where you can create, edit, and manage sections. Only users with admin privileges can access these routes.

---

## 🚀 How to Access the Admin Panel

### **Step 1: Install the App on Your Shopify Store**

1. Go to your Shopify Partner Dashboard: https://partners.shopify.com/
2. Navigate to your app
3. Click **Test on development store**
4. Select your store (e.g., `ocean-jewelry-and-accessories.myshopify.com`)
5. Click **Install app**

### **Step 2: First Login (Automatic User Creation)**

When you install the app for the first time:

1. The app will redirect you to authenticate via Shopify OAuth
2. After authentication, a user record is **automatically created** in the database
3. By default, this user is **NOT an admin** (for security)
4. You'll be logged in and can see the merchant dashboard

### **Step 3: Set Yourself as Admin**

After your first login, you need to manually promote yourself to admin:

#### **Option A: Using the Admin Script (Recommended)**

SSH into your server and run:

```bash
ssh root@72.60.99.154
cd /var/www/sectionit
docker exec -it sectionstack-app npm run set-admin ocean-jewelry-and-accessories.myshopify.com
```

Replace `ocean-jewelry-and-accessories.myshopify.com` with your actual shop domain.

**Expected Output:**
```
🔌 Connecting to MongoDB...
✅ Connected to MongoDB

🔍 Looking for user with shop: ocean-jewelry-and-accessories.myshopify.com
✅ Successfully set "ocean-jewelry-and-accessories.myshopify.com" as admin!

🔌 Disconnected from MongoDB
```

#### **Option B: Direct MongoDB Update**

If you prefer to use MongoDB directly:

```bash
# Connect to MongoDB container
docker exec -it sectionstack-mongodb mongosh -u sectionstack -p 'SecurePass123!@#' --authenticationDatabase admin sectionsstack

# Run this command (replace with your shop domain)
db.users.updateOne(
  { shop: "ocean-jewelry-and-accessories.myshopify.com" },
  { $set: { admin: true, updatedAt: new Date() } }
)

# Exit MongoDB
exit
```

**Expected Output:**
```
{
  acknowledged: true,
  matchedCount: 1,
  modifiedCount: 1
}
```

### **Step 4: Access the Admin Panel**

After setting yourself as admin:

1. Go back to your Shopify Admin
2. Click on **Apps** → **Sections Stack**
3. The app will reload
4. You should now see additional navigation options for admin features

**Admin Routes:**
- `/app/admin/sections` - Manage all sections
- `/app/admin/section/:id/edit` - Edit specific section

---

## 🎯 Login Process (How Authentication Works)

### **Normal Login Flow**

1. **User clicks app in Shopify Admin**
   ```
   Shopify Admin → Apps → Sections Stack
   ```

2. **Shopify redirects to app URL**
   ```
   https://sectionit.indigenservices.com
   ```

3. **App initiates OAuth flow**
   ```
   https://sectionit.indigenservices.com/auth?shop=your-store.myshopify.com
   ```

4. **Shopify authentication page**
   - User is asked to grant permissions
   - Scopes: `read_themes`, `write_themes`

5. **OAuth callback**
   ```
   https://sectionit.indigenservices.com/auth/callback
   ```

6. **User record created/updated**
   - App checks if user exists in database
   - If new: Creates user with `admin: false`
   - If exists: Updates access token and scope

7. **Session established**
   - Session stored in MongoDB
   - User redirected to main app dashboard

8. **App loads**
   ```
   https://sectionit.indigenservices.com/app
   ```

### **Authentication Check on Each Request**

Every time you access the app:

1. App verifies Shopify session
2. Checks HMAC signature
3. Validates shop domain
4. Loads user from database
5. Checks admin status (for admin routes)

---

## 👥 User Types

### **Regular Merchant (Default)**

**Permissions:**
- ✅ Browse sections
- ✅ Purchase sections (free & paid)
- ✅ Add sections to themes
- ✅ View purchased sections
- ❌ Cannot access admin panel
- ❌ Cannot create/edit/delete sections

**Routes Accessible:**
- `/app` - Main dashboard
- `/app/sections/store` - Browse sections
- `/app/my-section/preview/:id` - Preview section

### **Admin User**

**Permissions:**
- ✅ All merchant permissions
- ✅ Access admin panel
- ✅ Create new sections
- ✅ Edit existing sections
- ✅ Delete sections
- ✅ Upload images
- ✅ Manage section content

**Additional Routes:**
- `/app/admin/sections` - Manage sections
- `/app/admin/section/:id/edit` - Edit section

---

## 🔍 How to Check if You're an Admin

### **Method 1: Try Accessing Admin Route**

Navigate to:
```
https://sectionit.indigenservices.com/app/admin/sections
```

**If you're an admin:** You'll see the section management page

**If you're not an admin:** You'll be redirected to:
```
https://sectionit.indigenservices.com/app/unauthorized
```

### **Method 2: Check Database**

```bash
docker exec -it sectionstack-mongodb mongosh -u sectionstack -p 'SecurePass123!@#' --authenticationDatabase admin sectionsstack

db.users.find({ shop: "ocean-jewelry-and-accessories.myshopify.com" })
```

Look for the `admin` field:
```json
{
  "_id": ObjectId("..."),
  "shop": "ocean-jewelry-and-accessories.myshopify.com",
  "admin": true,  // ← Should be true for admin access
  "accessToken": "...",
  "scope": "read_themes,write_themes",
  "createdAt": "...",
  "updatedAt": "..."
}
```

---

## 📝 Admin Panel Features

### **1. View All Sections**

**URL:** `/app/admin/sections`

**Features:**
- List all sections with thumbnails
- See section details (name, price, category)
- Edit button for each section
- Delete button for each section
- Create new section button

### **2. Create New Section**

**From:** `/app/admin/sections`

**Steps:**
1. Click **"Create New Section"** button
2. Fill in the form:
   - **Name:** Section name
   - **Description:** Brief description
   - **Category:** Choose from dropdown
   - **Type:** Free or Paid
   - **Price:** If paid (in USD)
   - **Tags:** Comma-separated tags
   - **Features:** One per line
   - **Thumbnail:** Upload image
   - **Gallery Images:** Upload multiple images
   - **Section Code:** Liquid code for the section
   - **Flags:** Popular, Trending, Featured
3. Click **Save**

### **3. Edit Existing Section**

**URL:** `/app/admin/section/:id/edit`

**Steps:**
1. From admin sections list, click **Edit** on any section
2. Modify any field
3. Upload new images if needed
4. Update section code
5. Click **Save Changes**

### **4. Delete Section**

**From:** `/app/admin/sections`

**Steps:**
1. Click **Delete** button on any section
2. Confirm deletion
3. Section is permanently removed

---

## 🛡️ Security Features

### **Admin Route Protection**

All admin routes are protected by the `requireAdmin` middleware:

```typescript
// app/utils/requireAdmin.ts
export async function requireAdmin(request: Request) {
  const { session } = await authenticate.admin(request);
  
  if (!session?.shop) {
    throw redirect("/app/unauthorized");
  }
  
  const user = await UserModel.findOne({ shop: session.shop });
  
  if (!user || !user.admin) {
    throw redirect("/app/unauthorized");
  }
  
  return user;
}
```

**Protection Mechanisms:**
- ✅ Session validation
- ✅ Shop domain verification
- ✅ Admin flag check in database
- ✅ Automatic redirect if unauthorized

---

## 🚨 Troubleshooting

### **Problem 1: Can't Access Admin Panel**

**Symptoms:**
- Redirected to `/app/unauthorized`
- Admin routes show "Access Denied"

**Solution:**
1. Verify you set admin flag:
   ```bash
   docker exec -it sectionstack-app npm run set-admin your-store.myshopify.com
   ```

2. Check database:
   ```bash
   docker exec -it sectionstack-mongodb mongosh -u sectionstack -p 'SecurePass123!@#' --authenticationDatabase admin sectionsstack
   db.users.find({ shop: "your-store.myshopify.com" })
   ```

3. Ensure `admin: true` is set

4. Try logging out and back in:
   - Uninstall app from Shopify Admin
   - Reinstall app
   - Set admin flag again

---

### **Problem 2: App Shows 404 Error**

**Symptoms:**
- Getting 404 when clicking app in Shopify Admin
- Error: "No route matches URL"

**Solution:**

Check Shopify Partner Dashboard configuration:

1. Go to https://partners.shopify.com/
2. Open your app
3. Verify **App URL** is exactly:
   ```
   https://sectionit.indigenservices.com
   ```

4. Verify **Allowed redirection URL(s)**:
   ```
   https://sectionit.indigenservices.com/auth/callback
   https://sectionit.indigenservices.com/auth/shopify/callback
   https://sectionit.indigenservices.com/api/auth/callback
   ```

5. Save and wait 1-2 minutes

6. Clear browser cache and try again

---

### **Problem 3: Session Expired / Authentication Error**

**Symptoms:**
- Logged out frequently
- "Session invalid" errors
- Redirected to login constantly

**Solution:**

1. Check if MongoDB is running:
   ```bash
   docker ps | grep mongo
   ```

2. Verify session storage:
   ```bash
   docker logs sectionstack-mongodb --tail=50
   ```

3. Check app logs for auth errors:
   ```bash
   docker logs sectionstack-app --tail=100 | grep -i auth
   ```

4. Restart app container:
   ```bash
   cd /var/www/sectionit
   docker-compose -f docker-compose.production.yml restart app
   ```

---

### **Problem 4: Can't See Admin Options in UI**

**Symptoms:**
- Admin flag is set in database
- No admin menu or options visible

**Solution:**

The current version requires you to **manually navigate** to admin routes. There might not be UI buttons yet.

**Direct URLs to use:**
```
https://sectionit.indigenservices.com/app/admin/sections
https://sectionit.indigenservices.com/app/admin/section/[section-id]/edit
```

---

## 📊 Complete Admin Workflow

### **Scenario: Adding Your First Section**

1. **Access the app:**
   ```
   Shopify Admin → Apps → Sections Stack
   ```

2. **Set yourself as admin:**
   ```bash
   ssh root@72.60.99.154
   docker exec -it sectionstack-app npm run set-admin your-store.myshopify.com
   ```

3. **Go to admin panel:**
   ```
   Navigate to: https://sectionit.indigenservices.com/app/admin/sections
   ```

4. **Create new section:**
   - Click "Create New Section"
   - Fill in all fields
   - Upload thumbnail image
   - Add Liquid code
   - Save

5. **Section is now available:**
   - Visible in merchant store
   - Can be purchased (if paid)
   - Can be added to themes

---

## 👤 Managing Multiple Admins

To add more admin users:

```bash
# For each shop that needs admin access:
docker exec -it sectionstack-app npm run set-admin store1.myshopify.com
docker exec -it sectionstack-app npm run set-admin store2.myshopify.com
docker exec -it sectionstack-app npm run set-admin store3.myshopify.com
```

**Or via MongoDB:**

```javascript
// Set multiple users as admin
db.users.updateMany(
  { 
    shop: { 
      $in: [
        "store1.myshopify.com",
        "store2.myshopify.com",
        "store3.myshopify.com"
      ]
    }
  },
  { 
    $set: { 
      admin: true, 
      updatedAt: new Date() 
    } 
  }
)
```

---

## 📱 Admin Panel Interface

### **Main Dashboard** (`/app/admin/sections`)

```
┌─────────────────────────────────────────────────┐
│  Sections Stack - Admin Panel                   │
│  ┌─────────────────────────────────────┐        │
│  │  [+ Create New Section]              │        │
│  └─────────────────────────────────────┘        │
│                                                  │
│  All Sections:                                   │
│  ┌────────────────────┬────────────────────┐   │
│  │ [Thumbnail]        │ [Thumbnail]        │   │
│  │ Hero Section       │ Testimonial        │   │
│  │ $29.99            │ Free               │   │
│  │ [Edit] [Delete]   │ [Edit] [Delete]    │   │
│  └────────────────────┴────────────────────┘   │
└─────────────────────────────────────────────────┘
```

### **Create/Edit Section Form**

```
Section Name: [___________________]
Description:  [___________________]
Category:     [Dropdown ▼]
Type:         ○ Free  ● Paid
Price:        [$_____] (if paid)
Tags:         [___________________]
Features:     [___________________]
              [___________________]
Thumbnail:    [Upload Image]
Gallery:      [Upload Images]
Section Code: [________________________]
              [                        ]
              [________________________]
Flags:        ☑ Popular ☐ Trending ☐ Featured

[Save Section]  [Cancel]
```

---

## 🎓 Best Practices

### **For Admins:**

1. ✅ **Test sections** before publishing
2. ✅ **Use clear names** and descriptions
3. ✅ **Add comprehensive features** list
4. ✅ **Upload high-quality images**
5. ✅ **Set appropriate pricing**
6. ✅ **Tag sections properly** for better search
7. ✅ **Preview code** in Shopify before adding

### **For Security:**

1. ✅ **Limit admin users** to trusted individuals
2. ✅ **Use strong passwords** for server access
3. ✅ **Monitor admin actions** through logs
4. ✅ **Regular backups** of database
5. ✅ **Keep app updated** with latest security patches

---

## 🔗 Quick Reference Links

### **Access URLs:**
- **Main App:** https://sectionit.indigenservices.com
- **Admin Panel:** https://sectionit.indigenservices.com/app/admin/sections
- **Unauthorized Page:** https://sectionit.indigenservices.com/app/unauthorized

### **Server Access:**
```bash
ssh root@72.60.99.154
cd /var/www/sectionit
```

### **Admin Script:**
```bash
docker exec -it sectionstack-app npm run set-admin <shop-domain>
```

### **Check Logs:**
```bash
docker logs sectionstack-app -f
```

### **Database Access:**
```bash
docker exec -it sectionstack-mongodb mongosh -u sectionstack -p 'SecurePass123!@#' --authenticationDatabase admin sectionsstack
```

---

## 📞 Need Help?

If you're still having trouble accessing the admin panel:

1. **Check the logs:** `docker logs sectionstack-app --tail=100`
2. **Verify database:** Ensure user exists with admin flag
3. **Clear cache:** Try incognito mode
4. **Contact support:** admin@indigenservices.com

---

## ✅ Admin Setup Checklist

- [ ] App installed on Shopify store
- [ ] First login completed (user created)
- [ ] Admin flag set via script or MongoDB
- [ ] Can access `/app/admin/sections` without redirect
- [ ] Can create new section
- [ ] Can edit existing section
- [ ] Can delete section
- [ ] Can upload images
- [ ] Sections appear in merchant store

**Once all checked - you're ready to manage sections! 🎉**

---

**Last Updated:** October 2025  
**App Version:** 2.0.0  
**Documentation:** Indigen Services  
**Support:** admin@indigenservices.com
