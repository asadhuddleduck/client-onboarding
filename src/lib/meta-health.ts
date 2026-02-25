const META_API_VERSION = "v24.0";
const META_BASE_URL = `https://graph.facebook.com/${META_API_VERSION}`;

function getAccessToken(): string {
  const token = process.env.META_ACCESS_TOKEN?.trim();
  if (!token) throw new Error("META_ACCESS_TOKEN is not set");
  return token;
}

async function metaFetch(url: string, retries = 5): Promise<any> {
  for (let attempt = 0; attempt < retries; attempt++) {
    const response = await fetch(url);

    if (response.status === 429 || response.status === 500 || response.status === 503) {
      const delay = Math.pow(2, attempt) * 1000 + Math.random() * 500;
      await new Promise((r) => setTimeout(r, delay));
      continue;
    }

    if (!response.ok) {
      const body = await response.text();
      try {
        const parsed = JSON.parse(body);
        if (parsed?.error?.code === 190 || parsed?.error?.type === "OAuthException") {
          console.error("[meta-api] TOKEN EXPIRED — Meta access token is invalid or expired. Regenerate at https://developers.facebook.com/tools/explorer/");
        }
      } catch { /* not JSON, ignore */ }
      throw new Error(`Meta API error ${response.status}: ${body}`);
    }

    return response.json();
  }
  throw new Error("Meta API: max retries exceeded");
}

export interface AdAccountHealth {
  id: string;
  name: string;
  accountStatus: number;
  accountStatusLabel: string;
  disableReason: number;
  disableReasonLabel: string;
  currency: string;
  timezone: string;
  spendCap: string | null;
  amountSpent: string;
  businessName: string | null;
  businessId: string | null;
  createdTime: string;
  overallStatus: "green" | "yellow" | "red";
  issues: string[];
}

const ACCOUNT_STATUS_MAP: Record<number, string> = {
  1: "Active",
  2: "Disabled",
  3: "Unsettled",
  7: "Pending Risk Review",
  8: "Pending Settlement",
  9: "In Grace Period",
  100: "Pending Closure",
  101: "Closed",
  201: "Any Active",
  202: "Any Closed",
};

const DISABLE_REASON_MAP: Record<number, string> = {
  0: "None",
  1: "Ads Integrity Policy",
  2: "Ads IP Review",
  3: "Risk Payment",
  4: "Gray Account Shut Down",
  5: "Ads AFC Review",
  6: "Business Integrity RAR",
  7: "Permanent Close",
  8: "Unused Reseller Account",
  9: "Unused Account",
};

export async function checkAdAccountHealth(adAccountId: string): Promise<AdAccountHealth> {
  // Ensure proper format
  const id = adAccountId.startsWith("act_") ? adAccountId : `act_${adAccountId}`;

  const fields = [
    "account_status",
    "disable_reason",
    "name",
    "currency",
    "spend_cap",
    "amount_spent",
    "business{name,id,verification_status}",
    "timezone_name",
    "created_time",
  ].join(",");

  const url = `${META_BASE_URL}/${id}?fields=${fields}&access_token=${getAccessToken()}`;
  const data = await metaFetch(url);

  const accountStatus = data.account_status ?? 0;
  const disableReason = data.disable_reason ?? 0;
  const issues: string[] = [];

  // Determine overall status
  let overallStatus: "green" | "yellow" | "red" = "green";

  if (accountStatus === 2 || disableReason > 0) {
    overallStatus = "red";
    if (accountStatus === 2) issues.push("Account is disabled");
    if (disableReason > 0) {
      issues.push(`Disable reason: ${DISABLE_REASON_MAP[disableReason] ?? `Unknown (${disableReason})`}`);
    }
  } else if (accountStatus === 7 || accountStatus === 9) {
    overallStatus = "yellow";
    if (accountStatus === 7) issues.push("Account is pending risk review");
    if (accountStatus === 9) issues.push("Account is in grace period");
  } else if (accountStatus !== 1) {
    overallStatus = "yellow";
    issues.push(`Account status: ${ACCOUNT_STATUS_MAP[accountStatus] ?? `Unknown (${accountStatus})`}`);
  }

  return {
    id: data.id,
    name: data.name ?? "Unknown",
    accountStatus,
    accountStatusLabel: ACCOUNT_STATUS_MAP[accountStatus] ?? `Unknown (${accountStatus})`,
    disableReason,
    disableReasonLabel: DISABLE_REASON_MAP[disableReason] ?? `Unknown (${disableReason})`,
    currency: data.currency ?? "USD",
    timezone: data.timezone_name ?? "Unknown",
    spendCap: data.spend_cap ?? null,
    amountSpent: data.amount_spent ?? "0",
    businessName: data.business?.name ?? null,
    businessId: data.business?.id ?? null,
    createdTime: data.created_time ?? "",
    overallStatus,
    issues,
  };
}
