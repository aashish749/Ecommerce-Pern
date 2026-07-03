import express from "express";
import { Router } from "express";
import { handleClerkWebhook } from "../controllers/authController.js";

const router = Router();

// This route is mounted BEFORE express.json() in index.ts
// Clerk needs the raw body for svix signature verification
router.post(
  "/clerk",
  express.raw({ type: "application/json" }),
  handleClerkWebhook,
);

export default router;
