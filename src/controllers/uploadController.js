import cloudinary from "cloudinary";
import fs from "fs";

export async function getImageService(req, res) {
  try {
    if (!req.file) {
      console.error("❌ No file uploaded");
      return res.status(400).json({ error: "No file uploaded" });
    }

    const filePath = req.file.path;
    
    console.log("📤 Uploading to Cloudinary:", filePath);
    
    const result = await cloudinary.v2.uploader.upload(filePath, {
      folder: "services",
      resource_type: "auto",
    });

    console.log("✅ Upload success:", result.secure_url);

    // ✅ Nettoie le fichier temporaire
    fs.unlinkSync(filePath);

    res.json({ url: result.secure_url });
  } catch (err) {
    console.error("❌ Cloudinary error:", err);
    
    // ✅ Nettoie le fichier même en cas d'erreur
    if (req.file?.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupErr) {
        console.error("Cleanup error:", cleanupErr);
      }
    }
    
    res.status(500).json({ 
      error: "Upload failed", 
      details: err.message 
    });
  }
}