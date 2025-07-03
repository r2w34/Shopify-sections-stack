import { LoaderFunction, redirect } from "@remix-run/node";
import { authenticate } from "app/shopify.server";
import PurchaseModel from "app/models/PurchaseModel";
import { connectToDB } from "app/db.server";
import UserModel from "app/models/userModel";

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);
  const chargeId = url.searchParams.get("charge_id");
  const sectionId = url.searchParams.get("sectionId");

  const { session, admin } = await authenticate.admin(request);
  const shop = session.shop;

  // Confirm the charge status
  const rawResponse = await admin.graphql(
    `
      query {
        appPurchaseOneTime(id: "gid://shopify/AppPurchaseOneTime/${chargeId}") {
          status
        }
      }
    `,
  );

  // ✅ Always parse the response
  const responseBody = await rawResponse.json();

  console.log("🧩 Callback GraphQL Response:", JSON.stringify(responseBody, null, 2));

  const status = responseBody?.data?.appPurchaseOneTime?.status;

  if (status === "ACTIVE") {
    await connectToDB();
    const user = await UserModel.findOne({ shop });
    if (user) {
      await PurchaseModel.create({
        userId: user._id,
        sectionId,
      });
    }
    return redirect("/thank-you");
  }

  return redirect("/purchase-failed");
};
