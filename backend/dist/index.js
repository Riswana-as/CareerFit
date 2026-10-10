"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const api_1 = __importDefault(require("./routes/api"));
const errorHandler_1 = require("./middleware/errorHandler");
const rateLimiter_1 = require("./middleware/rateLimiter");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Security & Middlewares
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin)
            return callback(null, true);
        const allowedOrigins = [
            process.env.FRONTEND_URL,
            "http://localhost:5173",
            "http://localhost:3000"
        ].filter(Boolean);
        if (allowedOrigins.includes(origin) ||
            origin.endsWith(".vercel.app") ||
            origin.startsWith("http://localhost:")) {
            return callback(null, true);
        }
        return callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-gemini-key"]
}));
app.use(express_1.default.json({ limit: "15mb" }));
app.use(express_1.default.urlencoded({ extended: true, limit: "15mb" }));
app.use((0, cookie_parser_1.default)());
app.use("/api/", rateLimiter_1.apiLimiter);
// Health check & status endpoints
app.get(["/health", "/api/health"], (req, res) => {
    res.json({ status: "healthy", timestamp: new Date().toISOString() });
});
app.get(["/api", "/api/status", "/"], (req, res) => {
    res.json({ message: "CareerFit AI API is running", version: "1.0.0" });
});
// Direct Code Download endpoint
app.get("/download-code", (req, res) => {
    const possiblePaths = [
        path_1.default.resolve(__dirname, "../careerfit-ai.zip"),
        path_1.default.resolve(__dirname, "../../careerfit-ai.zip"),
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
const database_1 = require("./db/database");
// Ensure DB is initialized
app.use(async (req, res, next) => {
    try {
        await database_1.db.init();
        next();
    }
    catch (err) {
        next(err);
    }
});
// API Routes - support both /api/v1 and /v1 prefix
app.use(["/api/v1", "/v1"], api_1.default);
// Error handling middleware
app.use(errorHandler_1.errorHandler);
// Initialize database and start server (for local dev)
async function startServer() {
    try {
        await database_1.db.init();
        app.listen(PORT, () => {
            console.log(`[CareerFit AI Backend] Server running at http://localhost:${PORT}`);
            console.log(`[CareerFit AI Backend] REST API base: http://localhost:${PORT}/api/v1`);
        });
    }
    catch (error) {
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
exports.default = app;
