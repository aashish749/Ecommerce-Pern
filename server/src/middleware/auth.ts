import { Request, Response, NextFunction } from "express";
import { getAuth } from "@clerk/express";
import { db } from "../db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";

/**
 * Extend Express Request to carry our internal user id
 */
declare global {
  namespace Express {
    interface Request {
      userId?: number;
    }
  }
}

/**
 * Auto-create user on first request if they don't exist in DB yet.
 * This works as a fallback when the Clerk webhook hasn't reached us.
 */
export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { userId: clerkId } = getAuth(req);

  if (!clerkId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    // Try to find existing user
    let [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.clerkId, clerkId))
      .limit(1);

    // If not found, auto-create with placeholder info
    if (!user) {
      const email = `user_${clerkId}@placeholder.local`;
      const name = `User ${clerkId.slice(-6)}`;

      [user] = await db
        .insert(users)
        .values({
          clerkId,
          email,
          name,
        })
        .returning({ id: users.id });
    }

    req.userId = user.id;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
