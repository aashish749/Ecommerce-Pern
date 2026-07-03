import { Router } from "express";
import { productController } from "../controllers/productController";
import { requireAdmin } from "../middleware/admin";
import {
  validate,
  createProductSchema,
  updateProductSchema,
} from "../middleware/validate";

const router = Router();

// GET /api/products — list products (public, paginated, filterable)
router.get("/", productController.list);

// GET /api/products/:id — single product (public)
router.get("/:id", productController.getOne);

// POST /api/products — create product (admin)
router.post(
  "/",
  requireAdmin,
  validate(createProductSchema),
  productController.create,
);

// PUT /api/products/:id — update product (admin)
router.put(
  "/:id",
  requireAdmin,
  validate(updateProductSchema),
  productController.update,
);

// DELETE /api/products/:id — soft delete (admin)
router.delete("/:id", requireAdmin, productController.delete);

export default router;
