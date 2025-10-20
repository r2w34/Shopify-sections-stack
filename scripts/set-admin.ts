#!/usr/bin/env node
/**
 * Admin User Setup Script
 * 
 * Usage: npm run set-admin <shop-domain>
 * Example: npm run set-admin mystore.myshopify.com
 */

import mongoose from "mongoose";
import "dotenv/config";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ Error: MONGODB_URI not found in environment variables");
  process.exit(1);
}

const shopDomain = process.argv[2];

if (!shopDomain) {
  console.error("❌ Error: Shop domain is required");
  console.log("\nUsage: npm run set-admin <shop-domain>");
  console.log("Example: npm run set-admin mystore.myshopify.com\n");
  process.exit(1);
}

async function setAdmin() {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    const UserModel = mongoose.model(
      "User",
      new mongoose.Schema({
        shop: String,
        admin: Boolean,
        accessToken: String,
        scope: String,
        createdAt: Date,
        updatedAt: Date,
      })
    );

    console.log(`\n🔍 Looking for user with shop: ${shopDomain}`);
    
    const user = await UserModel.findOne({ shop: shopDomain });

    if (!user) {
      console.error(`\n❌ Error: No user found with shop domain "${shopDomain}"`);
      console.log("\nAvailable shops:");
      const allUsers = await UserModel.find({}, { shop: 1 });
      if (allUsers.length === 0) {
        console.log("  (No users found in database)");
      } else {
        allUsers.forEach((u) => console.log(`  - ${u.shop}`));
      }
      process.exit(1);
    }

    if (user.admin) {
      console.log(`\n✅ User "${shopDomain}" is already an admin`);
    } else {
      await UserModel.updateOne(
        { shop: shopDomain },
        { $set: { admin: true, updatedAt: new Date() } }
      );
      console.log(`\n✅ Successfully set "${shopDomain}" as admin!`);
    }

    await mongoose.connection.close();
    console.log("\n🔌 Disconnected from MongoDB");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error:", error);
    process.exit(1);
  }
}

setAdmin();
