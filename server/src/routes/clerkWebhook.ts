import { Router } from "express";
import { handleClerkWebhook } from "../controllers/authController";

const router = Router();

// Clerk webhook — no express.raw() middleware
// On Vercel serverless, the body arrives already parsed as JSON
// We JSON.stringify it back in the controller for svix verification
router.post("/clerk", handleClerkWebhook);

export default router;
