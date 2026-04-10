import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signToken, COOKIE } from "@/lib/auth";
import bcrypt from "bcryptjs";

const IZINLI_ROLLER = ["Admin", "Muhasebeci"];

export async function POST(req: NextRequest) {
  const { email, sifre } = await req.json();
  if (!email || !sifre) {
    return NextResponse.json({ error: "E-posta ve şifre zorunludur." }, { status: 400 });
  }

  const kullanici = await prisma.kullanici.findUnique({ where: { email } });
  if (!kullanici || !kullanici.aktif) {
    return NextResponse.json({ error: "E-posta veya şifre hatalı." }, { status: 401 });
  }

  if (!IZINLI_ROLLER.includes(kullanici.rol)) {
    return NextResponse.json({ error: "Bu panele erişim yetkiniz yok." }, { status: 403 });
  }

  const eslesti = await bcrypt.compare(sifre, kullanici.sifre);
  if (!eslesti) {
    return NextResponse.json({ error: "E-posta veya şifre hatalı." }, { status: 401 });
  }

  const token = await signToken({
    id: kullanici.id,
    ad: kullanici.ad,
    soyad: kullanici.soyad,
    email: kullanici.email,
    rol: kullanici.rol,
  });

  await prisma.kullanici.update({ where: { id: kullanici.id }, data: { sonGiris: new Date() } });

  const res = NextResponse.json({ ok: true, ad: kullanici.ad, soyad: kullanici.soyad, rol: kullanici.rol });
  res.cookies.set(COOKIE, token, { httpOnly: true, path: "/", maxAge: 60 * 60 * 24 * 7, sameSite: "lax" });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(COOKIE);
  return res;
}
