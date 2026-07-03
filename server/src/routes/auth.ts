import { Router } from "express";
import { getMe } from "../controllers/authController.js";
import { handleClerkWebhook } from "../controllers/authController.js";
const router = Router();

router.get("/me", getMe);
router.post("/webhooks/clerk", handleClerkWebhook);

export default router;
