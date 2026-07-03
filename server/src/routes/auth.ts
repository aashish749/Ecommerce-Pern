import { Router } from "express";
import { getMe } from "../controllers/authController";
import { handleClerkWebhook } from "../controllers/authController";
const router = Router();

router.get("/me", getMe);
router.post("/webhooks/clerk", handleClerkWebhook);

export default router;
