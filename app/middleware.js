import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export function middleware(req) {
  const token = req.cookies.get("token")?.value;
  const { pathname } = req.nextUrl;

  
  const protectedRoutes = ["/browse", "/found", "/lost"];
  const adminRoutes = ["/admin"];

  
  if (protectedRoutes.some((route) => pathname.startsWith(route)) && !token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  
  if (adminRoutes.some((route) => pathname.startsWith(route))) {
    if (!token) return NextResponse.redirect(new URL("/login", req.url));

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded.role !== "admin") {
        return NextResponse.redirect(new URL("/unauthorized", req.url));
      }
    } catch {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/browse/:path*",
    "/found/:path*",
    "/lost/:path*",
    "/admin/:path*",
  ],
};
