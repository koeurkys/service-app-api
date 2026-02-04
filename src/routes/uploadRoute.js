import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import cloudinary from "cloudinary";
import { getImageService } from "../controllers/uploadController.js";

const router = express.Router();

// Multer pour fichiers temporaires
const upload = multer({ dest: "uploads/" });

// Config Cloudinary depuis CLOUDINARY_URL
cloudinary.v2.config({
  cloudinary_url: process.env.CLOUDINARY_URL,
});

// POST /api/upload
router.post("/", upload.single("file"), getImageService);

export default router;
