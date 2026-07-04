import { Request, Response } from "express";
import { getAuth } from "@clerk/express";
import { db } from "../db/index";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";
import { Webhook } from "svix";
import { clerkUserSchema } from "../utils/validation";

export const getMe = async (req: Request, res: Response) => {
  const { userId, sessionClaims } = getAuth(req);

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, userId))
      .limit(1);

    if (!user) {
      return res.status(404).json({ error: "User not found in database" });
    }

    const role = sessionClaims?.publicMetadata?.role || null;

    res.json({
      clerkUserId: userId,
      sessionId: sessionClaims?.sid,
      role,
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  } catch (error) {
    console.error("Error in getMe:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////
// HANDLE CLERK WEBHOOK

export const handleClerkWebhook = async (req: Request, res: Response) => {
  const svixId = req.headers["svix-id"] as string;
  const svixTimestamp = req.headers["svix-timestamp"] as string;
  const svixSignature = req.headers["svix-signature"] as string;

  if (!svixId || !svixTimestamp || !svixSignature) {
    return res.status(400).json({ error: "Missing svix headers" });
  }

  const secret = process.env.CLERK_WEBHOOK_SIGNING_SECRET;
  if (!secret) {
    console.error("CLERK_WEBHOOK_SIGNING_SECRET is not set");
    return res.status(500).json({ error: "Webhook secret not configured" });
  }

  // On Vercel serverless, the body arrives already parsed as JSON
  // Stringify it back to a raw string for svix signature verification
  const payload = JSON.stringify(req.body);

  const webhook = new Webhook(secret);
  let evt: any;
  try {
    evt = webhook.verify(payload, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    });
  } catch (err) {
    console.error("Webhook verification failed", err);
    return res.status(400).json({ error: "Invalid signature" });
  }

  const validated = clerkUserSchema.safeParse(evt);
  if (!validated.success) {
    // Use .format() instead of .flatten() (or .flatten() still works, but we'll use .errors)
    const errors = validated.error.issues.map((e: any) => ({
      path: e.path.join("."),
      message: e.message,
    }));
    return res.status(400).json({ error: "Invalid payload", details: errors });
  }

  const { type, data } = validated.data;
  const clerkId = data.id;
  const email = data.email_addresses[0]?.email_address
    ? data.email_addresses[0].email_address
    : `test_${clerkId}@placeholder.local`;
  const firstName = data.first_name || "";
  const lastName = data.last_name || "";
  const name =
    `${firstName} ${lastName}`.trim() || email?.split("@")[0] || "User";

  if (type === "user.created" || type === "user.updated") {
    await db
      .insert(users)
      .values({
        clerkId: clerkId, // snake_case
        email,
        name,
      })
      .onConflictDoUpdate({
        target: users.clerkId,
        set: { email, name, updatedAt: new Date() }, // snake_case
      });
  }

  res.status(200).json({ message: "Webhook received" });
};
