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
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const filePath = path.resolve(req.file.path);
    const result = await cloudinary.v2.uploader.upload(filePath, { folder: "services" });
    fs.unlinkSync(filePath);


    // Retourne l'URL
    return res.json({ url: result.secure_url });
  } catch (err) {
    console.error("Cloudinary upload error:", err);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
