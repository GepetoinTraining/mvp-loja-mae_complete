// /home/ubuntu/mvp-loja-mae3/mvp-loja-mae/src/app/api/meta/auth/callback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // Assuming prisma client is correctly set up

const META_APP_ID = process.env.META_APP_ID;
const META_APP_SECRET = process.env.META_APP_SECRET;
const REDIRECT_URI = process.env.META_REDIRECT_URI; // Must be the same as used in the initial auth request

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state"); // For CSRF protection, should be validated

  if (!code) {
    console.error("Meta OAuth callback error: No code provided.");
    return NextResponse.redirect(new URL("/admin/meta-integration?error=oauth_failed", request.url));
  }

  if (!META_APP_ID || !META_APP_SECRET || !REDIRECT_URI) {
    console.error("Meta App ID, App Secret, or Redirect URI not configured in environment variables for callback.");
    return NextResponse.redirect(new URL("/admin/meta-integration?error=config_missing", request.url));
  }

  // TODO: Validate the 'state' parameter against a stored value to prevent CSRF attacks
  // For now, we proceed without state validation for this pre-deployment phase.

  try {
    // Exchange code for an access token
    const tokenResponse = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${META_APP_ID}&redirect_uri=${encodeURIComponent(
        REDIRECT_URI
      )}&client_secret=${META_APP_SECRET}&code=${code}`,
      {
        method: "GET", // Meta docs specify GET for this, though POST is common for token exchange
      }
    );

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error("Error exchanging Meta auth code for token:", errorData);
      return NextResponse.redirect(new URL(`/admin/meta-integration?error=${errorData.error?.message || "token_exchange_failed"}`, request.url));
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    const expiresIn = tokenData.expires_in; // Typically in seconds

    // TODO: Securely store the accessToken and its expiry for the authenticated Marketer user.
    // This would involve fetching the user ID (e.g., from session or state) and updating their record.
    // Since database operations are deferred, we will log this for now.
    console.log("Meta Access Token obtained:", accessToken);
    console.log("Expires in:", expiresIn);

    // For now, redirect to a success page (this page needs to be created)
    // In a real scenario, you might store the token and then redirect.
    return NextResponse.redirect(new URL("/admin/meta-integration?success=true", request.url));

  } catch (error) {
    console.error("Exception during Meta OAuth callback:", error);
    return NextResponse.redirect(new URL("/admin/meta-integration?error=internal_server_error", request.url));
  }
}

