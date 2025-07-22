import { MongoClient } from "mongodb";

export async function findSessionByShop(shop: string) {
  const client = await MongoClient.connect(process.env.MONGODB_URI!);
  const db = client.db("SectionsStackDB");

  const session = await db
    .collection("shopify_sessions")
    .find({ shop })
    .sort({ expires: -1 })
    .limit(1)
    .toArray();

  await client.close();

  return session?.[0] || null;
}
