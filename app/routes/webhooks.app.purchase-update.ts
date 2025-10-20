import { ActionFunction } from "@remix-run/node";
import { authenticate } from "app/shopify.server";
import PurchaseModel from "app/models/PurchaseModel";
import UserModel from "app/models/userModel";
import SectionModel from "app/models/SectionModel";
import { connectToDB } from "app/db.server";

export const action: ActionFunction = async ({ request }) => {

  try {
    const { payload, shop } = await authenticate.webhook(request);


    // Only process if the purchase is active
    if (payload.app_purchase_one_time?.status === "ACTIVE") {
      await connectToDB();

      const user = await UserModel.findOne({ shop });

      if (user) {
        // Extract section name from the purchase name
        const purchaseName = payload.app_purchase_one_time.name;

        // Remove "Purchase section: " prefix and trim
        const sectionName = purchaseName.replace("Purchase section: ", "").trim();

        if (sectionName) {
          // Find the section by name
          const section = await SectionModel.findOne({ name: sectionName });

          if (section) {
            // Check if purchase already exists to avoid duplicates
            const existingPurchase = await PurchaseModel.findOne({
              userId: user._id,
              sectionId: section._id,
            });

            if (!existingPurchase) {
              const purchase = await PurchaseModel.create({
                userId: user._id,
                sectionId: section._id,
                chargeId: payload.app_purchase_one_time.admin_graphql_api_id,
                status: payload.app_purchase_one_time.status,
                purchasedAt: new Date(),
              });

            } else {
              existingPurchase.chargeId = payload.app_purchase_one_time.admin_graphql_api_id;
              existingPurchase.status = payload.app_purchase_one_time.status;
              await existingPurchase.save();
            }
          } else {
            console.error("Could not find section with name:", sectionName);
          }
        } else {
          console.error("Could not extract section name from purchase name:", purchaseName);
        }
      } else {
        console.error("No user found for shop:", shop);
      }
    } else {
      console.log("Purchase status is not active:", payload.app_purchase_one_time?.status);
    }

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("[Webhook] Purchase update error:", error);
    return new Response("Error processing webhook", { status: 500 });
  }
};
