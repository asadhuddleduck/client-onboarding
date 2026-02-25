import { NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import {
  grantPartnerAccess,
  fetchClientBusinessManagers,
  fetchOwnedAdAccounts,
  fetchClientAdAccounts,
} from "@/lib/meta-partner";

// POST /api/grant-access
// Body: { action: "discover" | "grant", clientAccessToken, businessId?, adAccountId? }
export async function POST(request: Request) {
  if (!verifyAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action, clientAccessToken } = body;

    if (!clientAccessToken) {
      return NextResponse.json({ error: "Missing access token" }, { status: 400 });
    }

    if (action === "discover") {
      // Fetch all BMs and their ad accounts
      const businesses = await fetchClientBusinessManagers(clientAccessToken);

      const businessesWithAccounts = await Promise.all(
        businesses.map(async (bm) => {
          const [owned, client] = await Promise.all([
            fetchOwnedAdAccounts(clientAccessToken, bm.id).catch(() => []),
            fetchClientAdAccounts(clientAccessToken, bm.id).catch(() => []),
          ]);

          // Deduplicate by id
          const seen = new Set<string>();
          const allAccounts = [...owned, ...client].filter((acc) => {
            if (seen.has(acc.id)) return false;
            seen.add(acc.id);
            return true;
          });

          return {
            id: bm.id,
            name: bm.name,
            adAccounts: allAccounts,
          };
        })
      );

      return NextResponse.json({ businesses: businessesWithAccounts });
    }

    if (action === "grant") {
      const { adAccountId } = body;
      if (!adAccountId) {
        return NextResponse.json({ error: "Missing ad account ID" }, { status: 400 });
      }

      const result = await grantPartnerAccess(clientAccessToken, adAccountId);

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Grant access error:", error);
    return NextResponse.json(
      { error: error.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
