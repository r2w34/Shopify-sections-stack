import { ActionFunction } from "@remix-run/node";
import { authenticate } from "app/shopify.server";
import PurchaseModel from "app/models/PurchaseModel";
import UserModel from "app/models/userModel";
import { connectToDB } from "app/db.server";

export const action: ActionFunction = async ({ request }) => {
  console.log("🎯 Purchase webhook received");

  try {
    const { payload, shop } = await authenticate.webhook(request);

    console.log("📦 Webhook payload:", JSON.stringify(payload, null, 2));
    console.log("🏪 Shop:", shop);

    // Only process if the purchase is active
    if (payload.status === "ACTIVE") {
      await connectToDB();

      const user = await UserModel.findOne({ shop });
      console.log("👤 Found user:", user);

      if (user) {
        // Extract sectionId from the purchase name
        const sectionIdMatch = payload.name?.match(/sectionId=([a-f0-9]{24})/);
        const sectionId = sectionIdMatch ? sectionIdMatch[1] : null;

        console.log("🔍 Extracted sectionId:", sectionId);

        if (sectionId) {
          // Check if purchase already exists to avoid duplicates
          const existingPurchase = await PurchaseModel.findOne({
            userId: user._id,
            sectionId: sectionId,
          });

          if (!existingPurchase) {
            const purchase = await PurchaseModel.create({
              userId: user._id,
              sectionId: sectionId,
              chargeId: payload.id,
              status: payload.status,
              amount: payload.price?.amount,
              currency: payload.price?.currency_code,
            });

            console.log("✅ Purchase saved via webhook:", purchase);
          } else {
            console.log("ℹ️ Purchase already exists, skipping");
          }
        } else {
          console.error(
            "❌ Could not extract sectionId from purchase name:",
            payload.name,
          );
        }
      } else {
        console.error("❌ No user found for shop:", shop);
      }
    } else {
      console.log("ℹ️ Purchase status is not active:", payload.status);
    }

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("❌ Webhook processing error:", error);
    return new Response("Error", { status: 500 });
  }
};
