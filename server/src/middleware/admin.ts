import { Request, Response, NextFunction } from "express";
import { getAuth, clerkClient } from "@clerk/express";

export const requireAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Fetch the full user from Clerk API to get publicMetadata
    const user = await clerkClient.users.getUser(userId);
    const role = user.publicMetadata?.role;

    if (role !== "admin") {
      return res.status(403).json({ error: "Forbidden: Admins only" });
    }

    next();
  } catch (error) {
    console.error("Admin middleware error:", error);
    return res.status(500).json({ error: "Failed to verify admin role" });
  }
};
