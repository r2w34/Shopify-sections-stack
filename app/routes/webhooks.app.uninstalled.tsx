import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import mongoose from "mongoose";
import SessionModel from "app/models/sessionModel";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, session, topic } = await authenticate.webhook(request);

  console.log(`Received ${topic} webhook for ${shop}`);

  await mongoose.connect(process.env.MONGODB_URI!);

  if (session) {
    await SessionModel.deleteMany({ shop });
  }

  return new Response();
};
