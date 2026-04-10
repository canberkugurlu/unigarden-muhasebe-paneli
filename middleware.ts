import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "unigarden-muhasebe-jwt-gizli-2024"
);
const COOKIE = "muhasebe_token";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(COOKIE)?.value;

  const isGiris = pathname === "/giris";
  const isApi = pathname.startsWith("/api");

  let gecerli = false;
  if (token) {
    try {
      await jwtVerify(token, SECRET);
      gecerli = true;
    } catch {
      gecerli = false;
    }
  }

  if (!isApi && !isGiris && !gecerli) {
    return NextResponse.redirect(new URL("/giris", req.url));
  }

  if (isGiris && gecerli) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  const res = NextResponse.next();
  res.headers.set("x-pathname", pathname);
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
};
