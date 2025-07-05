// Create a temporary route: app/routes/create-user.tsx
import { ActionFunction } from "@remix-run/node";
import { connectToDB } from "app/db.server";
import UserModel from "app/models/userModel";

export const action: ActionFunction = async () => {
  await connectToDB();
  
  const user = await UserModel.create({
    shop: "sectionsstack.myshopify.com",
    accessToken: "temp_token",
    scope: "write_themes",
    createdAt: new Date(),
    updatedAt: new Date()
  });
  
  console.log("✅ User created:", user);
  
  return new Response("User created", { status: 200 });
};