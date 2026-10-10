"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const pg_1 = require("pg");
const inMemoryStore_1 = require("./inMemoryStore");
class DatabaseManager {
    pgliteInstance = null;
    pgPool = null;
    useInMemory = false;
    isInitialized = false;
    isInitializing = false;
    async init() {
        if (this.isInitialized || this.isInitializing)
            return;
        this.isInitializing = true;
        const databaseUrl = process.env.DATABASE_URL;
        if (databaseUrl && !databaseUrl.startsWith("pglite://")) {
            try {
                console.log("[DB] Connecting to external PostgreSQL database via Pool...");
                const isLocalhost = databaseUrl.includes("localhost") || databaseUrl.includes("127.0.0.1");
                this.pgPool = new pg_1.Pool({
                    connectionString: databaseUrl,
                    ssl: isLocalhost ? false : { rejectUnauthorized: false },
                    connectionTimeoutMillis: 5000
                });
                await this.pgPool.query("SELECT 1");
                console.log("[DB] External PostgreSQL connected.");
            }
            catch (poolErr) {
                console.warn("[DB] Failed connecting to external PostgreSQL, falling back to in-memory store:", poolErr.message);
                this.useInMemory = true;
            }
        }
        else if (process.env.VERCEL) {
            console.log("[DB] Running resilient in-memory database store for Vercel serverless...");
            this.useInMemory = true;
        }
        else {
            try {
                const { PGlite } = await Promise.resolve().then(() => __importStar(require("@electric-sql/pglite")));
                const dataDir = path_1.default.resolve(__dirname, "../../data/careerfit_pg");
                if (!fs_1.default.existsSync(dataDir)) {
                    fs_1.default.mkdirSync(dataDir, { recursive: true });
                }
                // Clean stale postmaster.pid lock
                const pidFile = path_1.default.join(dataDir, "postmaster.pid");
                if (fs_1.default.existsSync(pidFile)) {
                    try {
                        fs_1.default.unlinkSync(pidFile);
                    }
                    catch { }
                }
                console.log(`[DB] Initializing embedded PostgreSQL (PGlite) at ${dataDir}...`);
                this.pgliteInstance = new PGlite(dataDir);
                await this.pgliteInstance.waitReady;
                console.log("[DB] Embedded PostgreSQL ready.");
            }
            catch (err) {
                console.warn("[DB] PGlite failed, falling back to in-memory store:", err.message);
                this.useInMemory = true;
            }
        }
        this.isInitialized = true;
        this.isInitializing = false;
        try {
            const { runMigrations } = await Promise.resolve().then(() => __importStar(require("./migrations")));
            await runMigrations();
        }
        catch (migErr) {
            console.warn("[DB] Automatic migration check:", migErr.message);
        }
    }
    async query(text, params = []) {
        if (!this.isInitialized) {
            await this.init();
        }
        if (this.pgPool) {
            try {
                const res = await this.pgPool.query(text, params);
                return {
                    rows: res.rows,
                    rowCount: res.rowCount ?? res.rows.length
                };
            }
            catch (err) {
                console.warn("[DB Pool Query Error]", err.message);
                if (this.useInMemory) {
                    return inMemoryStore_1.inMemoryDb.query(text, params);
                }
                throw err;
            }
        }
        if (this.pgliteInstance) {
            try {
                const res = await this.pgliteInstance.query(text, params);
                return {
                    rows: (res.rows || []),
                    rowCount: (res.affectedRows ?? res.rows?.length) || 0
                };
            }
            catch (pglErr) {
                console.warn("[DB PGlite Query Error]", pglErr.message);
                return inMemoryStore_1.inMemoryDb.query(text, params);
            }
        }
        if (this.useInMemory) {
            return inMemoryStore_1.inMemoryDb.query(text, params);
        }
        throw new Error("[DB] Database is not initialized.");
    }
    async close() {
        if (this.pgPool) {
            await this.pgPool.end();
        }
        if (this.pgliteInstance) {
            try {
                await this.pgliteInstance.close();
            }
            catch { }
        }
        this.isInitialized = false;
    }
}
exports.db = new DatabaseManager();
