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
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));
app.use(cookieParser());
app.use("/api/", apiLimiter);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

// API Routes
app.use("/api/v1", apiRoutes);

// Error handling middleware
app.use(errorHandler);

// Initialize database and start server
async function startServer() {
  try {
    await runMigrations();
    app.listen(PORT, () => {
      console.log(`[CareerFit AI Backend] Server running at http://localhost:${PORT}`);
      console.log(`[CareerFit AI Backend] REST API base: http://localhost:${PORT}/api/v1`);
    });
  } catch (error) {
    console.error("[CareerFit AI Backend] Startup failure:", error);
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== "test") {
  startServer();
}

export default app;
