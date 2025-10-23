import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isAdmin = (token as any)?.role_id === 1;
    const isAdminRoute = req.nextUrl.pathname.startsWith("/admin");

    // If user is trying to access admin routes but is not admin
    if (isAdminRoute && !isAdmin) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // If admin is trying to access non-admin routes, redirect to admin dashboard
    if (isAdmin && !isAdminRoute && req.nextUrl.pathname !== "/login") {
      return NextResponse.redirect(new URL("/admin/dashboard", req.url));
    }

    // If admin is accessing /admin/ (without dashboard), redirect to /admin/dashboard
    if (isAdmin && req.nextUrl.pathname === "/admin") {
      return NextResponse.redirect(new URL("/admin/dashboard", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow access to login page without token
        if (req.nextUrl.pathname === "/login") {
          return true;
        }
        
        // Require token for all other routes
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    "/admin/:path*",
    "/dashboard/:path*",
    "/login",
  ],
};
