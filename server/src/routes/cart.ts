import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import {
  validate,
  addCartItemSchema,
  updateCartItemSchema,
} from "../middleware/validate";
import { cartController } from "../controllers/cartController";

const router = Router();

// All cart routes require authentication
router.use(requireAuth);

// GET /api/cart — get user's cart
router.get("/", cartController.list);

// POST /api/cart — add item to cart
router.post("/", validate(addCartItemSchema), cartController.add);

// PUT /api/cart/:id — update item quantity
router.put("/:id", validate(updateCartItemSchema), cartController.update);

// DELETE /api/cart/:id — remove single item
router.delete("/:id", cartController.remove);

// DELETE /api/cart — clear entire cart
router.delete("/", cartController.clear);

export default router;
