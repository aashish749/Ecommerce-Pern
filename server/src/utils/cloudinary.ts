import { v2 as cloudinary } from "cloudinary";
import type { Multer } from "multer";
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload a file buffer directly to Cloudinary.
 * Uses base64 data URI format – clean async/await.
 */
export const uploadToCloudinary = async (
  buffer: Buffer,
): Promise<{ url: string; public_id: string }> => {
  const dataUri = `data:image/jpeg;base64,${buffer.toString("base64")}`;
  const result = await cloudinary.uploader.upload(dataUri, {
    folder: "ecommerce-products",
  });
  return { url: result.secure_url, public_id: result.public_id };
};

export const uploadMultiple = async (files: Express.Multer.File[]) => {
  const results = [];
  for (const file of files) {
    const uploaded = await uploadToCloudinary(file.buffer);
    results.push(uploaded);
  }
  return results;
};
