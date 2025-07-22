import { json, type ActionFunctionArgs } from "@remix-run/node";
import { writeFile } from "fs/promises";
import path from "path";
import os from "os";
import { uploadToCloudinary } from "app/utils/cloudinary.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const file = formData.get("file") as File;

  if (!file || typeof file === "string") {
    return json({ error: "No file uploaded" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const filePath = path.join(os.tmpdir(), file.name);
  await writeFile(filePath, buffer); 

  try {
    const result = await uploadToCloudinary(filePath);
    return json({ url: result.url });
  } catch (err) {
    return json({ error: "Cloudinary upload failed" }, { status: 500 });
  }
};
