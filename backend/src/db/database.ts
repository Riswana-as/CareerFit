import path from "path";
import fs from "fs";
import os from "os";
import { PGlite } from "@electric-sql/pglite";
import { Pool } from "pg";

export interface QueryResult<T = any> {
  rows: T[];
  rowCount: number;
}

class DatabaseManager {
  private pgliteInstance: PGlite | null = null;
  private pgPool: Pool | null = null;
  private isInitialized = false;

  async init(): Promise<void> {
    if (this.isInitialized) return;

    const databaseUrl = process.env.DATABASE_URL;

    if (databaseUrl && !databaseUrl.startsWith("pglite://")) {
      console.log("[DB] Connecting to external PostgreSQL database via Pool...");
      const isLocalhost = databaseUrl.includes("localhost") || databaseUrl.includes("127.0.0.1");
      this.pgPool = new Pool({
        connectionString: databaseUrl,
        ssl: isLocalhost ? false : { rejectUnauthorized: false }
      });
      await this.pgPool.query("SELECT 1");
      console.log("[DB] External PostgreSQL connected.");
    } else if (process.env.VERCEL) {
      console.log("[DB] Running in-memory PGlite for Vercel...");
      this.pgliteInstance = new PGlite();
      await this.pgliteInstance.waitReady;
      console.log("[DB] In-memory PGlite ready.");
    } else {
      const dataDir = path.resolve(__dirname, "../../data/careerfit_pg");
      if (!fs.existsSync(dataDir)) {
        try {
          fs.mkdirSync(dataDir, { recursive: true });
        } catch {}
      }

      // Self-healing: Clean stale postmaster.pid lock
      const pidFile = path.join(dataDir, "postmaster.pid");
      if (fs.existsSync(pidFile)) {
        try {
          fs.unlinkSync(pidFile);
        } catch {}
      }

      try {
        console.log(`[DB] Initializing embedded PostgreSQL (PGlite) at ${dataDir}...`);
        this.pgliteInstance = new PGlite(dataDir);
        await this.pgliteInstance.waitReady;
        console.log("[DB] Embedded PostgreSQL ready.");
      } catch (err: any) {
        console.warn("[DB] Recovering from unclean shutdown...", err.message);
        if (fs.existsSync(dataDir)) {
          try {
            fs.rmSync(dataDir, { recursive: true, force: true });
            fs.mkdirSync(dataDir, { recursive: true });
          } catch {}
        }
        this.pgliteInstance = new PGlite(dataDir);
        await this.pgliteInstance.waitReady;
        console.log("[DB] Embedded PostgreSQL recovered successfully.");
      }
    }

    try {
      const { runMigrations } = await import("./migrations");
      await runMigrations();
    } catch (migErr: any) {
      console.warn("[DB] Automatic migration check:", migErr.message);
    }

    this.isInitialized = true;
  }

  async query<T = any>(text: string, params: any[] = []): Promise<QueryResult<T>> {
    if (!this.isInitialized) {
      await this.init();
    }

    if (this.pgPool) {
      const res = await this.pgPool.query(text, params);
      return {
        rows: res.rows as T[],
        rowCount: res.rowCount ?? res.rows.length,
      };
    }

    if (this.pgliteInstance) {
      const res = await this.pgliteInstance.query<T>(text, params);
      return {
        rows: (res.rows || []) as T[],
        rowCount: (res.affectedRows ?? res.rows?.length) || 0,
      };
    }

    throw new Error("[DB] Database is not initialized.");
  }

  async close(): Promise<void> {
    if (this.pgPool) {
      await this.pgPool.end();
    }
    if (this.pgliteInstance) {
      await this.pgliteInstance.close();
    }
    this.isInitialized = false;
  }
}

export const db = new DatabaseManager();