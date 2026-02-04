import express from "express";
import { getProfileByMe } from "../controllers/profilesController.js";

const router = express.Router();

router.get("/me", getProfileByMe);

export default router;
