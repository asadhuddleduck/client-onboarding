import { NextResponse } from "next/server";
import { checkAdAccountHealth } from "@/lib/meta-health";

// POST /api/health-check
// Body: { adAccountId: "act_XXXXXXXXX" }
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { adAccountId } = body;

    if (!adAccountId) {
      return NextResponse.json({ error: "Missing ad account ID" }, { status: 400 });
    }

    const health = await checkAdAccountHealth(adAccountId);

    return NextResponse.json(health);
  } catch (error: any) {
    console.error("Health check error:", error);
    return NextResponse.json(
      { error: error.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
