import { Request, Response } from "express";
import { uploadMultiple } from "../utils/cloudinary";

export const uploadController = {
  uploadImages: async (req: Request, res: Response) => {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }
    const uploaded = await uploadMultiple(files);
    res.json({ urls: uploaded.map((u) => u.url) });
  },
};
