// app/routes/api.purchase-section.ts
import { json } from "@remix-run/node";
import { authenticate } from "app/shopify.server";
import SectionModel from "app/models/SectionModel";
import { connectToDB } from "app/db.server";

export const action = async ({ request }: { request: any }) => {
  const { session, admin } = await authenticate.admin(request);
  const { sectionId } = await request.json();

  await connectToDB();
  const section = await SectionModel.findById(sectionId);

  if (!section) {
    return json({ error: "Section not found" }, { status: 404 });
  }

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
        // ✅ Include sectionId in the name for webhook extraction
        name: `Purchase section: ${section.name} (sectionId=${section._id})`,
        price: { amount: section.price.toString(), currencyCode: "USD" },
        returnUrl: `${process.env.SHOPIFY_APP_URL}/app/purchase/callback?sectionId=${section._id}&shop=${session.shop}`,
        test: true,
      },
    },
  );

  const responseBody = await rawResponse.json();

  const { appPurchaseOneTimeCreate } = responseBody.data || {};

  if (!appPurchaseOneTimeCreate) {
    return json({ error: "Invalid GraphQL response" }, { status: 500 });
  }

  if (appPurchaseOneTimeCreate.userErrors.length > 0) {
    console.error(appPurchaseOneTimeCreate.userErrors);
    return json(
      { error: appPurchaseOneTimeCreate.userErrors },
      { status: 400 },
    );
  }

  return json({ confirmationUrl: appPurchaseOneTimeCreate.confirmationUrl });
};
