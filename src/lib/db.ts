import { Pool } from "pg"

// Singleton pool — reused across hot-reloads in Next.js dev mode
const globalForPg = globalThis as unknown as { pgPool?: Pool; currentUrl?: string }

const url = process.env.DATABASE_URL

if (!globalForPg.pgPool || globalForPg.currentUrl !== url) {
  if (!url) {
    throw new Error(
      "DATABASE_URL environment variable is not set. " +
        "Add it to your .env file, e.g.: " +
        "DATABASE_URL=postgresql://user:password@localhost:5432/apcc_enrollment",
    )
  }
  globalForPg.pgPool = new Pool({
    connectionString: url,
    // Keep connections alive across serverless function invocations
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  })
  globalForPg.currentUrl = url
}

export const pool = globalForPg.pgPool
