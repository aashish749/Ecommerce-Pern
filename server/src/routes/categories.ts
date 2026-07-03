import { Router } from "express";
import { categoryController } from "../controllers/categoryController";
import { requireAdmin } from "../middleware/admin";
import {
  validate,
  createCategorySchema,
  updateCategorySchema,
} from "../middleware/validate";

const router = Router();

// GET /api/categories — list all (public)
router.get("/", categoryController.list);

// POST /api/categories — create (admin)
router.post(
  "/",
  requireAdmin,
  validate(createCategorySchema),
  categoryController.create,
);

// PUT /api/categories/:id — update (admin)
router.put(
  "/:id",
  requireAdmin,
  validate(updateCategorySchema),
  categoryController.update,
);

// DELETE /api/categories/:id — delete (admin)
router.delete("/:id", requireAdmin, categoryController.delete);

export default router;
