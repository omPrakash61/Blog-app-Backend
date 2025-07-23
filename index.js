import express from "express";
import multer from "multer";
import cors from "cors";
import dotenv from "dotenv";
import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Enabling CORS
app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const upload = multer({ storage: multer.memoryStorage() });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

app.post("/upload", upload.single("image"), async (req, res) => {
  try {
    const { publicId } = req.body;

    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          public_id: publicId,
          overwrite: true,
          folder: "picwords",
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );

      streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
    });

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/delete", async (req, res) => {
  try {
    const { publicId } = req.body;


    if (!publicId) {
      return res
        .status(400)
        .json({ success: false, error: "Missing publicId" });
    }

    const result = await cloudinary.uploader.destroy(`picwords/${publicId}`);

    if (result.result !== "ok" && result.result !== "not_found") {
      return res
        .status(500)
        .json({ success: false, error: "Failed to delete image" });
    }

    res
      .status(200)
      .json({ success: true, message: "Image deleted successfully", result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/", (req, res) => {
  res.send("PicWords backend is running ✅");
});

app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
