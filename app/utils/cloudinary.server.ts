import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadToCloudinary(localFilePath: string) {
  const result = await cloudinary.uploader.upload(localFilePath, {
    folder: "sections-thumbnails",
    resource_type: "image",
  });

  return {
    url: result.secure_url,
    public_id: result.public_id,
  };
}
