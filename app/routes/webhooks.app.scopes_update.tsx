import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import mongoose from "mongoose";
import SessionModel from "app/models/sessionModel";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { payload, session, topic, shop } = await authenticate.webhook(request);
  console.log(`Received ${topic} webhook for ${shop}`);

  const current = payload.current as string[];

  await mongoose.connect(process.env.MONGODB_URI!);

  if (session) {
    await SessionModel.updateOne(
      { id: session.id },
      { $set: { scope: current.join(",") } },
    );
  }

  return new Response();
};
