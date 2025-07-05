// app/routes/app.purchase.callback.tsx (Simplified)
import { LoaderFunction, redirect } from "@remix-run/node";
import PurchaseModel from "app/models/PurchaseModel";
import UserModel from "app/models/userModel";
import { connectToDB } from "app/db.server";

export const loader: LoaderFunction = async ({ request }) => {
  console.log("⚡️ Purchase callback started");

  const url = new URL(request.url);
  const chargeId = url.searchParams.get("charge_id");
  const sectionId = url.searchParams.get("sectionId");
  const shop = url.searchParams.get("shop");

  console.log("🔍 Callback params:", { chargeId, sectionId, shop });

  if (!chargeId || !sectionId || !shop) {
    console.error("❌ Missing required parameters");
    return redirect("/app/purchase-failed");
  }

  try {
    await connectToDB();

    // Find the user by shop
    const user = await UserModel.findOne({ shop });
    console.log("👤 Found user:", user);

    if (user) {
      // Check if purchase already exists to avoid duplicates
      const existingPurchase = await PurchaseModel.findOne({
        userId: user._id,
        sectionId: sectionId,
      });

      if (!existingPurchase) {
        // Save the purchase - Shopify only calls this URL on successful purchase
        const purchase = await PurchaseModel.create({
          userId: user._id,
          sectionId: sectionId,
          chargeId: chargeId,
          status: "active",
          purchasedAt: new Date(),
        });

        console.log("✅ Purchase saved:", purchase);
      } else {
        console.log("ℹ️ Purchase already exists, updating charge ID");
        // Update the existing purchase with the new charge ID
        existingPurchase.chargeId = chargeId;
        existingPurchase.status = "active";
        await existingPurchase.save();
      }

      return redirect("/app/thank-you?purchased=true");
    } else {
      console.error("❌ No user found for shop:", shop);
      return redirect("/app/purchase-failed");
    }
  } catch (error) {
    console.error("❌ Callback processing error:", error);
    return redirect("/app/purchase-failed");
  }
};
