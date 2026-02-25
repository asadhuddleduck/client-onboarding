"use server";

function getBaseUrl() {
  return process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";
}

function getAuthHeaders(): Record<string, string> {
  const secret = process.env.ONBOARDING_SECRET;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (secret) {
    headers["Authorization"] = `Bearer ${secret}`;
  }
  return headers;
}

export async function discoverAccounts(clientAccessToken: string) {
  const res = await fetch(`${getBaseUrl()}/api/grant-access`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ action: "discover", clientAccessToken }),
  });
  return res.json();
}

export async function grantAccess(
  clientAccessToken: string,
  adAccountId: string
) {
  const res = await fetch(`${getBaseUrl()}/api/grant-access`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ action: "grant", clientAccessToken, adAccountId }),
  });
  return res.json();
}

export async function provisionAccount(params: {
  businessName: string;
  adAccountId: string;
  adAccountName: string;
  businessManagerId: string;
}) {
  const res = await fetch(`${getBaseUrl()}/api/provision`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(params),
  });
  return res.json();
}
