import { Router, type Request, type Response } from "express";
import multer, { type FileFilterCallback } from "multer";
import path from "path";
import { logger } from "../lib/logger";

const router = Router();

// Upload-Verzeichnis aus Umgebungsvariable oder Standardwert
const uploadDir = process.env.UPLOAD_DIR || "/opt/teetracker3/uploads";

// Multer-Konfiguration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext);
    cb(null, `${basename}-${uniqueSuffix}${ext}`);
  },
});

// Dateifilter für sichere Dateitypen
const fileFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/pdf",
    "text/plain",
    "application/json",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only JPEG, PNG, GIF, WebP, PDF, TXT, and JSON files are allowed."));
  }
};

// Multer-Instanz mit Limits
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB Limit
  },
});

// POST /api/uploads - Single File Upload
router.post("/uploads", upload.single("file"), (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({
      error: "No file uploaded",
    });
  }

  logger.info(
    {
      filename: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      path: req.file.path,
    },
    "File uploaded successfully",
  );

  res.status(201).json({
    message: "File uploaded successfully",
    filename: req.file.originalname,
    storedFilename: req.file.filename,
    size: req.file.size,
    mimetype: req.file.mimetype,
    path: req.file.path,
    url: `/api/uploads/${req.file.filename}`,
  });
});

// GET /api/uploads/:filename - Datei herunterladen
router.get("/uploads/:filename", (req: Request, res: Response) => {
  const { filename } = req.params;
  const filePath = path.join(uploadDir, filename);

  res.sendFile(filePath, (err) => {
    if (err) {
      logger.error({ err, filename }, "Error sending file");
      res.status(404).json({
        error: "File not found",
      });
    }
  });
});

// GET /api/uploads - Liste aller Dateien
router.get("/uploads", (req: Request, res: Response) => {
  const fs = require("fs");
  const { readdir } = require("fs").promises;

  readdir(uploadDir)
    .then((files: string[]) => {
      const fileInfos = files.map((file: string) => {
        const filePath = path.join(uploadDir, file);
        const stats = fs.statSync(filePath);
        return {
          filename: file,
          size: stats.size,
          createdAt: stats.birthtime,
          updatedAt: stats.mtime,
          url: `/api/uploads/${file}`,
        };
      });

      res.json({
        files: fileInfos,
        count: fileInfos.length,
        directory: uploadDir,
      });
    })
    .catch((err: Error) => {
      logger.error({ err }, "Error reading upload directory");
      res.status(500).json({
        error: "Error reading upload directory",
      });
    });
});

// DELETE /api/uploads/:filename - Datei löschen
router.delete("/uploads/:filename", (req: Request, res: Response) => {
  const { filename } = req.params;
  const filePath = path.join(uploadDir, filename);
  const fs = require("fs");

  fs.unlink(filePath, (err: Error | null) => {
    if (err) {
      logger.error({ err, filename }, "Error deleting file");
      return res.status(404).json({
        error: "File not found",
      });
    }

    logger.info({ filename }, "File deleted successfully");
    res.json({
      message: "File deleted successfully",
      filename,
    });
  });
});

export default router;
