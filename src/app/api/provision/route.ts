import { NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { provisionClient } from "@/lib/provision";

// POST /api/provision
// Body: { businessName, adAccountId, adAccountName, businessManagerId?, contactName?, contactEmail? }
export async function POST(request: Request) {
  if (!verifyAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { businessName, adAccountId, adAccountName } = body;

    if (!businessName || !adAccountId) {
      return NextResponse.json(
        { error: "Missing required fields: businessName, adAccountId" },
        { status: 400 }
      );
    }

    const result = await provisionClient({
      businessName,
      adAccountId,
      adAccountName: adAccountName ?? "Unknown",
      businessManagerId: body.businessManagerId ?? null,
      contactName: body.contactName ?? null,
      contactEmail: body.contactEmail ?? null,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Provision error:", error);
    return NextResponse.json(
      { error: error.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
