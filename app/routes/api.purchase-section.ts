// app/routes/api.purchase-section.ts
import { json, redirect } from "@remix-run/node";
import { authenticate } from "app/shopify.server";
import SectionModel from "app/models/SectionModel";
import PurchaseModel from "app/models/PurchaseModel";
import UserModel from "app/models/userModel";
import { connectToDB } from "app/db.server";

export const action = async ({ request }: { request: any }) => {
  const { session, admin } = await authenticate.admin(request);
  
  let sectionId;
  try {
    const body = await request.json();
    sectionId = body.sectionId;
  } catch (error) {
    return json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!sectionId || typeof sectionId !== 'string') {
    return json({ error: "Valid sectionId is required" }, { status: 400 });
  }

  await connectToDB();

  const section = await SectionModel.findById(sectionId);
  if (!section) {
    return json({ error: "Section not found" }, { status: 404 });
  }

  // ✅ Find the user by shop
  const user = await UserModel.findOne({ shop: session.shop });
  if (!user) {
    return json({ error: "User not found for shop" }, { status: 404 });
  }

  if (section.isFree) {
    // ✅ Check if already purchased
    const existingPurchase = await PurchaseModel.findOne({
      userId: user._id,
      sectionId: section._id,
    });

    if (existingPurchase) {
    } else {
      await PurchaseModel.create({
        userId: user._id,
        sectionId: section._id,
        chargeId: "FREE",
        status: "active",
        purchasedAt: new Date(),
      });
    }

    return json({ redirectUrl: "/app" });
  }

  // ✅ PAID: Normal charge flow
  const rawResponse = await admin.graphql(
    `
      mutation appPurchaseOneTimeCreate(
        $name: String!
        $price: MoneyInput!
        $returnUrl: URL!
        $test: Boolean!
      ) {
        appPurchaseOneTimeCreate(
          name: $name
          price: $price
          returnUrl: $returnUrl
          test: $test
        ) {
          userErrors {
            field
            message
          }
          confirmationUrl
          appPurchaseOneTime {
            id
          }
        }
      }
    `,
    {
      variables: {
        name: `Purchase section: ${section.name} `,
        price: { amount: section.price.toString(), currencyCode: "USD" },
        returnUrl: `${process.env.SHOPIFY_APP_URL}/app/`,
        test: process.env.NODE_ENV !== "production",
      },
    },
  );

  const responseBody = await rawResponse.json();
  const { appPurchaseOneTimeCreate } = responseBody.data || {};

  if (!appPurchaseOneTimeCreate) {
    return json({ error: "Invalid GraphQL response" }, { status: 500 });
  }

  if (appPurchaseOneTimeCreate.userErrors.length > 0) {
    return json(
      { error: appPurchaseOneTimeCreate.userErrors },
      { status: 400 },
    );
  }

  return json({ confirmationUrl: appPurchaseOneTimeCreate.confirmationUrl });
};
