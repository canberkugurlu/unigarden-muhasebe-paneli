import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signToken, COOKIE } from "@/lib/auth";
import bcrypt from "bcryptjs";

const IZINLI_ROLLER = ["Admin", "Muhasebeci"];

export async function POST(req: NextRequest) {
  try {
    const { email, sifre } = await req.json().catch(() => ({}));
    let kullanici = null as Awaited<ReturnType<typeof prisma.kullanici.findUnique>> | null;

    if (!email || !sifre) {
      kullanici = await prisma.kullanici.findFirst({
        where: { aktif: true, rol: { in: IZINLI_ROLLER } },
        orderBy: [{ rol: "asc" }, { olusturmaTar: "asc" }],
      });
      if (!kullanici) {
        kullanici = await prisma.kullanici.create({
          data: {
            ad: "Demo", soyad: "Muhasebeci", email: "muhasebe-demo@unigarden.local",
            sifre: await bcrypt.hash(Math.random().toString(36), 10),
            rol: "Muhasebeci", aktif: true,
          },
        });
      }
    } else {
      kullanici = await prisma.kullanici.findUnique({ where: { email } });
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
    }

    const token = await signToken({
      id: kullanici.id, ad: kullanici.ad, soyad: kullanici.soyad,
      email: kullanici.email, rol: kullanici.rol,
    });
    await prisma.kullanici.update({ where: { id: kullanici.id }, data: { sonGiris: new Date() } });
    const res = NextResponse.json({ ok: true, ad: kullanici.ad, soyad: kullanici.soyad, rol: kullanici.rol });
    res.cookies.set(COOKIE, token, { httpOnly: true, path: "/", maxAge: 60 * 60 * 24 * 7, sameSite: "lax" });
    return res;
  } catch (e) {
    console.error("[auth]", e);
    return NextResponse.json({ error: "Sunucu hatası, lütfen tekrar deneyin." }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const res = NextResponse.json({ ok: true });
    res.cookies.delete(COOKIE);
    return res;
  } catch {
    return NextResponse.json({ ok: true });
  }
}
