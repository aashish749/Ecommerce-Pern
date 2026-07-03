import multer from "multer";

const storage = multer.memoryStorage();
const fileFilter = (_req: any, file: any, cb: any) => {
  const allowed = ["image/jpeg", "image/png", "image/webp"];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error("Only .jpg, .png, .webp allowed"), false);
};

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 5 },
  fileFilter,
});
