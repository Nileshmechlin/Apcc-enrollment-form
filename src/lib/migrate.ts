import { pool } from "./db"

/**
 * Creates the submissions table if it does not already exist.
 * Safe to run multiple times (idempotent).
 */
export async function runMigrations(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS submissions (
      id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      status                    TEXT NOT NULL DEFAULT 'pending',
      form_data                 JSONB NOT NULL,
      signature_data_url        TEXT NOT NULL,
      parent_signature_data_url TEXT,
      admin_data                JSONB,
      admin_signature_data_url  TEXT,
      submitted_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      approved_at               TIMESTAMPTZ
    );
  `)

  // Add columns if they were missing from an older schema version
  await pool.query(`
    ALTER TABLE submissions
    ADD COLUMN IF NOT EXISTS parent_signature_data_url TEXT,
    ADD COLUMN IF NOT EXISTS admin_data JSONB,
    ADD COLUMN IF NOT EXISTS admin_signature_data_url TEXT;
  `)

  // Index for fast listing ordered by newest first
  await pool.query(`
    CREATE INDEX IF NOT EXISTS submissions_submitted_at_idx
      ON submissions (submitted_at DESC);
  `)
}
