import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { checkoutController } from "../controllers/checkoutController";

const router = Router();

// All checkout routes require authentication
router.use(requireAuth);

// POST /api/checkout/create-payment-intent — create Stripe payment intent from cart
router.post("/create-payment-intent", checkoutController.createPaymentIntent);

export default router;
