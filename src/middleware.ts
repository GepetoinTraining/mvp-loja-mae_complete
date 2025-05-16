import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

// DEBUG: prove the secret is loaded
console.log("🔐 middleware NEXTAUTH_SECRET =", process.env.NEXTAUTH_SECRET);

export async function middleware(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET!,
  });

  if (!token && request.nextUrl.pathname.startsWith("/admin")) {
    return NextResponse.redirect(new URL("/login?error=true", request.url));
  }
  if (
    token &&
    (request.nextUrl.pathname.startsWith("/login") ||
     request.nextUrl.pathname.startsWith("/signup"))
  ) {
    return NextResponse.redirect(new URL("/admin/dashboard", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|images|icons|manifest.json).*)",
  ],
};
