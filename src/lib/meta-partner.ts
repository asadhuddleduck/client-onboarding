const META_API_VERSION = "v21.0";
const META_BASE_URL = `https://graph.facebook.com/${META_API_VERSION}`;

function getHuddleDuckBmId(): string {
  const id = process.env.HUDDLE_DUCK_BM_ID?.trim();
  if (!id) throw new Error("HUDDLE_DUCK_BM_ID is not set");
  return id;
}

/**
 * Grant Huddle Duck partner access to a client's ad account.
 * Uses the CLIENT's access token (they must be an admin on the ad account).
 */
export async function grantPartnerAccess(
  clientAccessToken: string,
  adAccountId: string
): Promise<{ success: boolean; error?: string }> {
  const bmId = getHuddleDuckBmId();
  const id = adAccountId.startsWith("act_") ? adAccountId : `act_${adAccountId}`;

  const url = `${META_BASE_URL}/${bmId}/client_ad_accounts`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      adaccount_id: id,
      access_token: clientAccessToken,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMessage =
      data?.error?.message ?? `Failed with status ${response.status}`;
    return { success: false, error: errorMessage };
  }

  return { success: true };
}

/**
 * Fetch the client's Business Managers using their access token.
 */
export async function fetchClientBusinessManagers(
  clientAccessToken: string
): Promise<{ id: string; name: string }[]> {
  const url = `${META_BASE_URL}/me/businesses?fields=id,name&access_token=${clientAccessToken}`;

  const response = await fetch(url);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error?.message ?? "Failed to fetch business managers");
  }

  return data.data ?? [];
}

/**
 * Fetch ad accounts owned by a specific Business Manager.
 */
export async function fetchOwnedAdAccounts(
  clientAccessToken: string,
  businessId: string
): Promise<{ id: string; name: string; account_status: number }[]> {
  const url = `${META_BASE_URL}/${businessId}/owned_ad_accounts?fields=id,name,account_status&limit=100&access_token=${clientAccessToken}`;

  const response = await fetch(url);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error?.message ?? "Failed to fetch ad accounts");
  }

  return data.data ?? [];
}

/**
 * Fetch ad accounts shared with (client of) a specific Business Manager.
 */
export async function fetchClientAdAccounts(
  clientAccessToken: string,
  businessId: string
): Promise<{ id: string; name: string; account_status: number }[]> {
  const url = `${META_BASE_URL}/${businessId}/client_ad_accounts?fields=id,name,account_status&limit=100&access_token=${clientAccessToken}`;

  const response = await fetch(url);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error?.message ?? "Failed to fetch client ad accounts");
  }

  return data.data ?? [];
}
