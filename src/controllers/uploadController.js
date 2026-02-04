export async function getImageService(req, res) {
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
}