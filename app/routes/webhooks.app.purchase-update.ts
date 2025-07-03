import { ActionFunction } from "@remix-run/node";
import { authenticate } from "app/shopify.server";
import { connectToDB } from "app/db.server";
import PurchaseModel from "app/models/PurchaseModel";
import UserModel from "app/models/userModel";

export const action: ActionFunction = async ({ request }) => {
  const { topic, shop, payload } = await authenticate.webhook(request);

  console.log(`📦 Webhook: ${topic} for ${shop}`);
  console.log(payload);

  if (
    topic === "APP_PURCHASES_ONE_TIME/UPDATE" &&
    payload.status === "ACTIVE"
  ) {
    const sectionId = payload.lineItems?.[0]?.planId;
    if (sectionId) {
      await connectToDB();
      const user = await UserModel.findOne({ shop });
      if (user) {
        await PurchaseModel.create({
          userId: user._id,
          sectionId,
        });
        console.log(`✅ Purchase recorded: ${shop} section ${sectionId}`);
      }
    }
  }

  throw new Response();
};
