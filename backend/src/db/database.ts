import path from "path";
import fs from "fs";
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
      this.pgPool = new Pool({ connectionString: databaseUrl });
      await this.pgPool.query("SELECT 1");
      console.log("[DB] External PostgreSQL connected.");
    } else {
      const dataDir = path.resolve(__dirname, "../../data/careerfit_pg");
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
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
          fs.rmSync(dataDir, { recursive: true, force: true });
          fs.mkdirSync(dataDir, { recursive: true });
        }
        this.pgliteInstance = new PGlite(dataDir);
        await this.pgliteInstance.waitReady;
        console.log("[DB] Embedded PostgreSQL recovered successfully.");
      }
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