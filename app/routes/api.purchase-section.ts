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
    mutation appPurchaseOneTimeCreate($name: String!, $price: MoneyInput!, $returnUrl: URL!) {
      appPurchaseOneTimeCreate(
        name: $name,
        price: $price,
        returnUrl: $returnUrl
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
        name: `Purchase section: ${section.name}`,
        price: { amount: section.price.toString(), currencyCode: "USD" },
        returnUrl: `${process.env.SHOPIFY_APP_URL}/purchase/callback?sectionId=${section._id}`,
      },
    },
  );

  const responseBody = await rawResponse.json();
  console.log("🧩 GraphQL Response:", JSON.stringify(responseBody, null, 2));

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
