import { db } from "./db";

let initialized = false;

export async function ensureSchema(): Promise<void> {
  if (initialized) return;

  await db.execute(`
    CREATE TABLE IF NOT EXISTS onboarding_requests (
      id TEXT PRIMARY KEY,
      business_name TEXT NOT NULL,
      contact_name TEXT,
      contact_email TEXT,
      ad_account_id TEXT NOT NULL,
      ad_account_name TEXT,
      business_manager_id TEXT,
      account_status INTEGER,
      disable_reason INTEGER,
      health_check_result TEXT,
      status TEXT DEFAULT 'connected',
      notion_page_id TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  initialized = true;
}
