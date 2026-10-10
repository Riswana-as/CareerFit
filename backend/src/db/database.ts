import path from "path";
import fs from "fs";
import { Pool } from "pg";
import { inMemoryDb } from "./inMemoryStore";

export interface QueryResult<T = any> {
  rows: T[];
  rowCount: number;
}

class DatabaseManager {
  private pgliteInstance: any = null;
  private pgPool: Pool | null = null;
  private useInMemory = false;
  private isInitialized = false;
  private isInitializing = false;

  async init(): Promise<void> {
    if (this.isInitialized || this.isInitializing) return;
    this.isInitializing = true;

    const databaseUrl = process.env.DATABASE_URL;

    if (databaseUrl && !databaseUrl.startsWith("pglite://")) {
      try {
        console.log("[DB] Connecting to external PostgreSQL database via Pool...");
        const isLocalhost = databaseUrl.includes("localhost") || databaseUrl.includes("127.0.0.1");
        this.pgPool = new Pool({
          connectionString: databaseUrl,
          ssl: isLocalhost ? false : { rejectUnauthorized: false },
          connectionTimeoutMillis: 5000
        });
        await this.pgPool.query("SELECT 1");
        console.log("[DB] External PostgreSQL connected.");
      } catch (poolErr: any) {
        console.warn("[DB] Failed connecting to external PostgreSQL, falling back to in-memory store:", poolErr.message);
        this.useInMemory = true;
      }
    } else if (process.env.VERCEL) {
      console.log("[DB] Running resilient in-memory database store for Vercel serverless...");
      this.useInMemory = true;
    } else {
      try {
        const modName = "@electric-sql/pglite";
        const pglitePkg: any = await (eval(`import("${modName}")`));
        const PGlite = pglitePkg.PGlite;
        const dataDir = path.resolve(__dirname, "../../data/careerfit_pg");
        if (!fs.existsSync(dataDir)) {
          fs.mkdirSync(dataDir, { recursive: true });
        }

        // Clean stale postmaster.pid lock
        const pidFile = path.join(dataDir, "postmaster.pid");
        if (fs.existsSync(pidFile)) {
          try {
            fs.unlinkSync(pidFile);
          } catch {}
        }

        console.log(`[DB] Initializing embedded PostgreSQL (PGlite) at ${dataDir}...`);
        this.pgliteInstance = new PGlite(dataDir);
        await this.pgliteInstance.waitReady;
        console.log("[DB] Embedded PostgreSQL ready.");
      } catch (err: any) {
        console.warn("[DB] PGlite failed, falling back to in-memory store:", err.message);
        this.useInMemory = true;
      }
    }

    this.isInitialized = true;
    this.isInitializing = false;

    try {
      const { runMigrations } = await import("./migrations");
      await runMigrations();
    } catch (migErr: any) {
      console.warn("[DB] Automatic migration check:", migErr.message);
    }
  }

  async query<T = any>(text: string, params: any[] = []): Promise<QueryResult<T>> {
    if (!this.isInitialized) {
      await this.init();
    }

    if (this.pgPool) {
      try {
        const res = await this.pgPool.query(text, params);
        return {
          rows: res.rows as T[],
          rowCount: res.rowCount ?? res.rows.length
        };
      } catch (err: any) {
        console.warn("[DB Pool Query Error]", err.message);
        if (this.useInMemory) {
          return inMemoryDb.query<T>(text, params);
        }
        throw err;
      }
    }

    if (this.pgliteInstance) {
      try {
        const res = await this.pgliteInstance.query(text, params);
        return {
          rows: (res.rows || []) as T[],
          rowCount: (res.affectedRows ?? res.rows?.length) || 0
        };
      } catch (pglErr: any) {
        console.warn("[DB PGlite Query Error]", pglErr.message);
        return inMemoryDb.query<T>(text, params);
      }
    }

    if (this.useInMemory) {
      return inMemoryDb.query<T>(text, params);
    }

    throw new Error("[DB] Database is not initialized.");
  }

  async close(): Promise<void> {
    if (this.pgPool) {
      await this.pgPool.end();
    }
    if (this.pgliteInstance) {
      try {
        await this.pgliteInstance.close();
      } catch {}
    }
    this.isInitialized = false;
  }
}

export const db = new DatabaseManager();