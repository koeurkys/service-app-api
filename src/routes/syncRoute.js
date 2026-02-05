import express from "express";
import { clerkMiddleware } from "@clerk/express";
import { syncUser } from "../middleware/syncUser.js";

const router = express.Router();

router.post("/", clerkMiddleware(), syncUser, (req, res) => {
  res.json({ success: true });
});

export default router;
