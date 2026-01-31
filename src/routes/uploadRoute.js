import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import cloudinary from "cloudinary";

const router = express.Router();

// Multer pour fichiers temporaires
const upload = multer({ dest: "uploads/" });

// Config Cloudinary depuis CLOUDINARY_URL
cloudinary.v2.config({
  cloudinary_url: process.env.CLOUDINARY_URL,
});

// POST /api/upload
router.post("/", upload.single("file"), async (req, res) => {
  try {
    const filePath = req.file.path;
    const result = await cloudinary.v2.uploader.upload(filePath, {
      folder: "services",
    });
    res.json({ url: result.secure_url });
  } catch (err) {
    console.error("Cloudinary error:", err);
    res.status(500).json({ error: "Upload failed" });
  }
});

export default router;
