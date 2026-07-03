// server/src/controllers/adminController.ts
import { Request, Response } from "express";
import { sql, eq, desc, count, sum, and, gte, ne } from "drizzle-orm";
import { db } from "../db";
import { orders, orderItems, products, users } from "../db/schema";

export const adminController = {
  // ------------------------------------------------------------
  // GET /api/admin/stats
  // Dashboard stats: total revenue, orders, customers,
  // plus 30-day variants
  // ------------------------------------------------------------
  getStats: async (req: Request, res: Response) => {
    try {
      // Total revenue from all paid/shipped orders (exclude cancelled)
      const totalRevenueResult = await db
        .select({ total: sum(orders.totalAmount) })
        .from(orders)
        .where(ne(orders.status, "cancelled"));

      // Total orders count
      const totalOrdersResult = await db
        .select({ count: count() })
        .from(orders);

      // Total customers count
      const totalCustomersResult = await db
        .select({ count: count() })
        .from(users);

      // 30-day revenue (exclude cancelled)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const revenue30DaysResult = await db
        .select({ total: sum(orders.totalAmount) })
        .from(orders)
        .where(
          and(
            gte(orders.createdAt, thirtyDaysAgo),
            ne(orders.status, "cancelled"),
          ),
        );

      // 30-day orders count
      const orders30DaysResult = await db
        .select({ count: count() })
        .from(orders)
        .where(gte(orders.createdAt, thirtyDaysAgo));

      res.json({
        totalRevenue: Number(totalRevenueResult[0]?.total) || 0,
        totalOrders: Number(totalOrdersResult[0]?.count) || 0,
        totalCustomers: Number(totalCustomersResult[0]?.count) || 0,
        revenue30Days: Number(revenue30DaysResult[0]?.total) || 0,
        orders30Days: Number(orders30DaysResult[0]?.count) || 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  },

  // ------------------------------------------------------------
  // GET /api/admin/revenue-trend
  // Day-by-day revenue for last 7 days (excludes cancelled)
  // ------------------------------------------------------------
  getRevenueTrend: async (req: Request, res: Response) => {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const trend = await db
        .select({
          date: sql<string>`DATE(orders.created_at)`,
          revenue: sum(orders.totalAmount),
        })
        .from(orders)
        .where(
          and(
            gte(orders.createdAt, sevenDaysAgo),
            ne(orders.status, "cancelled"),
          ),
        )
        .groupBy(sql`DATE(orders.created_at)`)
        .orderBy(sql`DATE(orders.created_at)`);

      // Fill in missing days with 0 revenue
      const result = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split("T")[0];

        const dayData = trend.find(
          (t) => t.date && t.date.toString().startsWith(dateStr),
        );
        result.push({
          date: dateStr,
          revenue: dayData ? Number(dayData.revenue) || 0 : 0,
        });
      }

      res.json(result);
    } catch (error) {
      console.error("Error fetching revenue trend:", error);
      res.status(500).json({ error: "Failed to fetch revenue trend" });
    }
  },

  // ------------------------------------------------------------
  // GET /api/admin/top-products
  // Top 5 products by total units sold
  // ------------------------------------------------------------
  getTopProducts: async (req: Request, res: Response) => {
    try {
      const topProducts = await db
        .select({
          id: products.id,
          name: products.name,
          totalSold: sum(orderItems.quantity),
        })
        .from(orderItems)
        .innerJoin(products, eq(orderItems.productId, products.id))
        .groupBy(products.id, products.name)
        .orderBy(desc(sum(orderItems.quantity)))
        .limit(5);

      res.json(
        topProducts.map((p) => ({
          id: p.id,
          name: p.name,
          totalSold: Number(p.totalSold) || 0,
        })),
      );
    } catch (error) {
      console.error("Error fetching top products:", error);
      res.status(500).json({ error: "Failed to fetch top products" });
    }
  },

  // ------------------------------------------------------------
  // GET /api/admin/recent-orders
  // Latest 10 orders with customer info (using `with`)
  // ------------------------------------------------------------
  getRecentOrders: async (req: Request, res: Response) => {
    try {
      const recentOrders = await db.query.orders.findMany({
        orderBy: (fields, { desc }) => [desc(fields.createdAt)],
        limit: 10,
        with: {
          user: {
            columns: {
              name: true,
              email: true,
            },
          },
          items: {
            columns: {
              id: true,
            },
          },
        },
      });

      res.json(
        recentOrders.map((o) => ({
          id: o.id,
          totalAmount: Number(o.totalAmount) || 0,
          status: o.status,
          createdAt: o.createdAt,
          customer: {
            name: o.user.name,
            email: o.user.email,
          },
          itemsCount: o.items.length,
        })),
      );
    } catch (error) {
      console.error("Error fetching recent orders:", error);
      res.status(500).json({ error: "Failed to fetch recent orders" });
    }
  },

  // ------------------------------------------------------------
  // GET /api/admin/orders
  // All orders paginated, filterable by ?status=
  // Uses `with` for user relation
  // ------------------------------------------------------------
  listAllOrders: async (req: Request, res: Response) => {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(
        100,
        Math.max(1, parseInt(req.query.limit as string) || 20),
      );
      const statusFilter = req.query.status as string | undefined;
      const offset = (page - 1) * limit;

      // Build where conditions
      const conditions = [];
      if (
        statusFilter &&
        ["pending", "paid", "shipped", "cancelled"].includes(statusFilter)
      ) {
        conditions.push(eq(orders.status, statusFilter));
      }

      const whereClause =
        conditions.length > 0 ? and(...conditions) : undefined;

      // Get total count for pagination
      const totalResult = await db
        .select({ count: count() })
        .from(orders)
        .where(whereClause);

      const total = Number(totalResult[0]?.count) || 0;

      // Get paginated orders using `with`
      const allOrders = await db.query.orders.findMany({
        where: whereClause,
        orderBy: (fields, { desc }) => [desc(fields.createdAt)],
        limit,
        offset,
        with: {
          user: {
            columns: {
              id: true,
              name: true,
              email: true,
            },
          },
          items: {
            columns: {
              id: true,
            },
          },
        },
      });

      res.json({
        orders: allOrders.map((o) => ({
          id: o.id,
          totalAmount: Number(o.totalAmount) || 0,
          status: o.status,
          stripePaymentIntentId: o.stripePaymentIntentId,
          shippingAddress: o.shippingAddress,
          createdAt: o.createdAt,
          updatedAt: o.updatedAt,
          customer: o.user,
          itemsCount: o.items.length,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  },

  // ------------------------------------------------------------
  // PUT /api/admin/orders/:id/status
  // Update order status with validation
  // Uses `with` to return updated order with user info
  // ------------------------------------------------------------
  updateOrderStatus: async (req: Request, res: Response) => {
    try {
      const orderId = parseInt(req.params.id as string);
      if (isNaN(orderId)) {
        return res.status(400).json({ error: "Invalid order ID" });
      }

      const { status } = req.body;

      // Check order exists
      const existingOrder = await db
        .select()
        .from(orders)
        .where(eq(orders.id, orderId))
        .limit(1);

      if (existingOrder.length === 0) {
        return res.status(404).json({ error: "Order not found" });
      }

      // Update the status
      await db.update(orders).set({ status }).where(eq(orders.id, orderId));

      // Fetch updated order with user info using `with`
      const updatedOrder = await db.query.orders.findFirst({
        where: (fields, { eq }) => eq(fields.id, orderId),
        with: {
          user: {
            columns: {
              name: true,
              email: true,
            },
          },
        },
      });

      res.json({
        message: "Order status updated",
        order: {
          ...updatedOrder,
          totalAmount: Number(updatedOrder?.totalAmount) || 0,
        },
      });
    } catch (error) {
      console.error("Error updating order status:", error);
      res.status(500).json({ error: "Failed to update order status" });
    }
  },
};
