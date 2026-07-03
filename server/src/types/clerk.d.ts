import "@clerk/express";
import { AuthObject } from "@clerk/express";

declare global {
  // 1. Unified and cleanly merged Clerk JWT Session Claims
  interface CustomJwtSessionClaims {
    publicMetadata?: {
      role?: "admin" | "moderator" | "user" | null;
    };
    sid?: string;
  }

  // 2. Injecting the 'auth' property globally into Express Request
  namespace Express {
    interface Request {
      auth: AuthObject;
    }
  }
}

export {};
