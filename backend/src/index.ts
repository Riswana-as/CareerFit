import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import path from "path";
import apiRoutes from "./routes/api";
import { errorHandler } from "./middleware/errorHandler";
import { runMigrations } from "./db/migrations";
import { apiLimiter } from "./middleware/rateLimiter";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security & Middlewares
app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const allowedOrigins = [
        process.env.FRONTEND_URL,
        "http://localhost:5173",
        "http://localhost:3000"
      ].filter(Boolean);
      if (
        allowedOrigins.includes(origin) ||
        origin.endsWith(".vercel.app") ||
        origin.startsWith("http://localhost:")
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-gemini-key"]
  })
);
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));
app.use(cookieParser());
app.use("/api/", apiLimiter);

// Health check & status endpoints
app.get(["/health", "/api/health"], (req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

app.get("/api", (req, res) => {
  res.json({ message: "CareerFit AI API is running", version: "1.0.0" });
});

// Direct Code Download endpoint
app.get("/download-code", (req, res) => {
  const possiblePaths = [
    path.resolve(__dirname, "../careerfit-ai.zip"),
    path.resolve(__dirname, "../../careerfit-ai.zip"),
    "C:\\Users\\USER\\Desktop\\careerfit-ai.zip",
    "C:\\Users\\USER\\Downloads\\careerfit-ai.zip"
  ];
  for (const p of possiblePaths) {
    if (require("fs").existsSync(p)) {
      res.setHeader("Content-Disposition", 'attachment; filename="careerfit-ai.zip"');
      res.setHeader("Content-Type", "application/zip");
      return res.sendFile(p);
    }
  }
  res.status(404).json({ error: "Code zip file not found." });
});

import { db } from "./db/database";

// Ensure DB is initialized
app.use(async (req, res, next) => {
  try {
    await db.init();
    next();
  } catch (err) {
    next(err);
  }
});

// API Routes
app.use("/api/v1", apiRoutes);

// Error handling middleware
app.use(errorHandler);

// Initialize database and start server (for local dev)
async function startServer() {
  try {
    await db.init();
    app.listen(PORT, () => {
      console.log(`[CareerFit AI Backend] Server running at http://localhost:${PORT}`);
      console.log(`[CareerFit AI Backend] REST API base: http://localhost:${PORT}/api/v1`);
    });
  } catch (error) {
    console.error("[CareerFit AI Backend] Startup failure:", error);
    if (!process.env.VERCEL) {
      process.exit(1);
    }
  }
}

if (require.main === module) {
  startServer();
}

// Support both CommonJS and ES Module interop for Vercel Serverless
module.exports = app;
module.exports.default = app;
export default app;
