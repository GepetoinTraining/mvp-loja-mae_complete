// /home/ubuntu/mvp-loja-mae3/mvp-loja-mae/src/app/api/meta/auth/route.ts
import { NextResponse } from "next/server";

const META_APP_ID = process.env.META_APP_ID;
const REDIRECT_URI = process.env.META_REDIRECT_URI; // e.g., https://yourdomain.com/api/meta/auth/callback

export async function GET() {
  if (!META_APP_ID || !REDIRECT_URI) {
    console.error("Meta App ID or Redirect URI not configured in environment variables.");
    return NextResponse.json(
      { error: "Meta integration not configured. Please contact support." },
      { status: 500 }
    );
  }

  const requiredPermissions = [
    "pages_manage_posts",
    "pages_read_engagement",
    "pages_show_list",
    "instagram_basic",
    "instagram_content_publish",
    "instagram_manage_comments",
    "instagram_manage_insights",
    "business_management", // Recommended for comprehensive access
  ];

  const scope = requiredPermissions.join(",");

  // Construct the Meta OAuth URL
  const authUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${META_APP_ID}&redirect_uri=${encodeURIComponent(
    REDIRECT_URI
  )}&scope=${encodeURIComponent(scope)}&response_type=code&state=YOUR_UNIQUE_STATE_STRING`; // Replace YOUR_UNIQUE_STATE_STRING with a CSRF token

  // Redirect the user to Meta's authorization page
  return NextResponse.redirect(authUrl);
}

