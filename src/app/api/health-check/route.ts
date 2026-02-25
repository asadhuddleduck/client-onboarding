import { NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { checkAdAccountHealth } from "@/lib/meta-health";

// POST /api/health-check
// Body: { adAccountId: "act_XXXXXXXXX" }
export async function POST(request: Request) {
  if (!verifyAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
