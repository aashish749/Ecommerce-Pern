import { Router } from "express";
import { requireAdmin } from "../middleware/admin";
import { validate } from "../middleware/validate";
import { updateOrderStatusSchema } from "../utils/validation";
import { adminController } from "../controllers/adminController";

const router = Router();

// All admin routes require admin role
router.use(requireAdmin);

// GET /api/admin/stats — dashboard stats
router.get("/stats", adminController.getStats);

// GET /api/admin/revenue-trend — day-by-day revenue for last 7 days
router.get("/revenue-trend", adminController.getRevenueTrend);

// GET /api/admin/top-products — top 5 products by units sold
router.get("/top-products", adminController.getTopProducts);

// GET /api/admin/recent-orders — latest 10 orders with customer info
router.get("/recent-orders", adminController.getRecentOrders);

// GET /api/admin/orders — all orders paginated, filterable by ?status=
router.get("/orders", adminController.listAllOrders);

// PUT /api/admin/orders/:id/status — update order status
router.put(
  "/orders/:id/status",
  validate(updateOrderStatusSchema),
  adminController.updateOrderStatus,
);

export default router;
