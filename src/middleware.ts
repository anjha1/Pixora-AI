import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isProRoute = req.nextUrl.pathname.startsWith("/pro") ||
                      req.nextUrl.pathname.startsWith("/api/pro");

    if (isProRoute && token?.plan !== "Pro") {
      return NextResponse.redirect(new URL("/?upgrade=true", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ["/pro/:path*", "/api/pro/:path*"],
};