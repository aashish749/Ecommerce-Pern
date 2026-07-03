import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { validate, createOrderSchema } from "../middleware/validate";
import { orderController } from "../controllers/orderController";

const router = Router();

// All order routes require authentication
router.use(requireAuth);

// POST /api/orders — create order after Stripe payment
router.post("/", validate(createOrderSchema), orderController.create);

// GET /api/orders — user's order history
router.get("/", orderController.list);

// GET /api/orders/:id — single order with items
router.get("/:id", orderController.getOne);

export default router;
