import { Router } from "express";
import { upload } from "../middleware/upload";
import { requireAdmin } from "../middleware/admin";
import { uploadController } from "../controllers/uploadController";

const router = Router();

router.post(
  "/",
  requireAdmin,
  upload.array("images", 5),
  uploadController.uploadImages,
);

export default router;
