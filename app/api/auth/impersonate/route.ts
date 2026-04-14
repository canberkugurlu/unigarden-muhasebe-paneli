import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signToken, COOKIE } from "@/lib/auth";
import { verifyImpersonationToken } from "@/lib/impersonate";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");
  if (!token) return NextResponse.json({ error: "Token eksik" }, { status: 400 });

  const p = await verifyImpersonationToken(token);
  if (!p) return NextResponse.json({ error: "Geçersiz/eski token" }, { status: 401 });
  if (p.targetPanel !== "muhasebe") return NextResponse.json({ error: "Token bu panel için değil" }, { status: 400 });

  const kullanici = await prisma.kullanici.findUnique({ where: { id: p.targetUserId } });
  if (!kullanici) return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });

  const authToken = await signToken({
    id: kullanici.id, ad: kullanici.ad, soyad: kullanici.soyad,
    email: kullanici.email, rol: kullanici.rol,
    impersonatorId: p.adminId, impersonatorAd: p.adminAd,
  });

  // Root'a redirect et ama cookie'yi set ederek
  const res = NextResponse.redirect(new URL("/", req.url));
  res.cookies.set(COOKIE, authToken, { httpOnly: true, path: "/", maxAge: 60 * 60 * 24 * 7, sameSite: "lax" });
  return res;
}
