import multer from "multer";
import path from "path";
import fs from "fs";

const UPLOAD_ROOT = "uploads";
const IMAGE_DIR = path.join(UPLOAD_ROOT, "images");
const VIDEO_DIR = path.join(UPLOAD_ROOT, "videos");

// ensure folders exist
[UPLOAD_ROOT, IMAGE_DIR, VIDEO_DIR].forEach((d) => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, IMAGE_DIR);
    else if (file.mimetype.startsWith("video/")) cb(null, VIDEO_DIR);
    else cb(new Error("Unsupported file type"), false);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = Date.now() + "-" + Math.round(Math.random() * 1e9) + ext;
    cb(null, name);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedImage = ["image/jpeg", "image/png", "image/webp", "image/jpg", "image/gif"];
  const allowedVideo = ["video/mp4", "video/quicktime", "video/mov", "video/x-msvideo"];
  if (allowedImage.includes(file.mimetype) || allowedVideo.includes(file.mimetype)) cb(null, true);
  else cb(new Error("Invalid file type"), false);
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 100 * 1024 * 1024 } }); // 100MB

export default upload;
export { IMAGE_DIR, VIDEO_DIR };
