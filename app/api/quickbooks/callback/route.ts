import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const code = req.nextUrl.searchParams.get("code");
    const realmId = req.nextUrl.searchParams.get("realmId");

    if (!code || !realmId) {
      return NextResponse.json(
        { error: "Missing code or realmId" },
        { status: 400 }
      );
    }

    // TODO: Exchange code for access token
    // 1. POST to https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer
    // 2. Store access_token + refresh_token in DB
    // 3. Redirect to dashboard

    const APP_URL = process.env.NEXT_PUBLIC_APP_URL!;
    return NextResponse.redirect(
      `${APP_URL}/dashboard/billing?quickbooks=connected`
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
