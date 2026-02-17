import { db } from "./db";
import { ensureSchema } from "./schema";
import { checkAdAccountHealth, type AdAccountHealth } from "./meta-health";
import { createClientInNotion } from "./notion-provision";

export interface ProvisionResult {
  notionPageId: string;
  dashboardUrl: string;
  health: AdAccountHealth;
}

export async function provisionClient(params: {
  businessName: string;
  adAccountId: string;
  adAccountName: string;
  businessManagerId: string | null;
  contactName: string | null;
  contactEmail: string | null;
}): Promise<ProvisionResult> {
  await ensureSchema();

  // Step 1: Health check
  const health = await checkAdAccountHealth(params.adAccountId);

  // Step 2: Create Notion page
  const notionPageId = await createClientInNotion({
    businessName: params.businessName,
    currency: health.currency,
  });

  // Step 3: Insert into Turso clients table
  const adAccountId = params.adAccountId.startsWith("act_")
    ? params.adAccountId
    : `act_${params.adAccountId}`;

  await db.execute({
    sql: `INSERT OR REPLACE INTO clients (id, name, meta_ad_account_id, currency, is_active, client_since)
          VALUES (?, ?, ?, ?, 1, date('now'))`,
    args: [notionPageId, params.businessName, adAccountId, health.currency],
  });

  // Step 4: Log onboarding request
  const requestId = crypto.randomUUID();
  await db.execute({
    sql: `INSERT INTO onboarding_requests (id, business_name, contact_name, contact_email, ad_account_id, ad_account_name, business_manager_id, account_status, disable_reason, health_check_result, status, notion_page_id)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'provisioned', ?)`,
    args: [
      requestId,
      params.businessName,
      params.contactName,
      params.contactEmail,
      adAccountId,
      params.adAccountName,
      params.businessManagerId,
      health.accountStatus,
      health.disableReason,
      JSON.stringify(health),
      notionPageId,
    ],
  });

  // Step 5: Trigger backfill on client-dashboards
  const dashboardsUrl = process.env.CLIENT_DASHBOARDS_URL?.trim();
  const dashboardsSecret = process.env.CLIENT_DASHBOARDS_SECRET?.trim();

  if (dashboardsUrl && dashboardsSecret) {
    try {
      await fetch(`${dashboardsUrl}/api/backfill`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${dashboardsSecret}`,
        },
        body: JSON.stringify({
          clientId: notionPageId,
          monthsBack: 3,
        }),
      });
    } catch {
      // Backfill failure is non-critical — daily sync will catch up
    }
  }

  return {
    notionPageId,
    dashboardUrl: dashboardsUrl
      ? `${dashboardsUrl}/${notionPageId}`
      : `/${notionPageId}`,
    health,
  };
}
