import UserModel from "app/models/userModel";
import { redirect } from "@remix-run/node";
import { authenticate } from "app/shopify.server";

export async function requireAdmin(request: Request) {
  const { session } = await authenticate.admin(request);

  if (!session?.shop) {
    throw redirect("/app/unauthorized");
  }

  const user = await UserModel.findOne({ shop: session.shop });

  if (!user || !user.admin) {
    throw redirect("/app/unauthorized");
  }

  return user;
}

export async function getAdminStatus(request: Request) {
  const { session } = await authenticate.admin(request);

  if (!session?.shop) return false;

  const user = await UserModel.findOne({ shop: session.shop });

  return !!user?.admin;
}
