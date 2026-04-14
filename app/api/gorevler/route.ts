import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

/** Bu panele atanmış aktif senaryo adımları. */
export async function GET(_req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const PANEL = "muhasebe";
  const rol = (session as unknown as { rol?: string }).rol;

  const adimlar = await prisma.senaryoAkisiAdim.findMany({
    where: {
      durum: "Aktif",
      adim: {
        panel: PANEL,
        ...(rol ? { OR: [{ rol: null }, { rol }] } : { rol: null }),
      },
    },
    include: {
      adim: true,
      akis: { include: { senaryo: { select: { ad: true } } } },
    },
    orderBy: { olusturmaTar: "asc" },
  });
  return NextResponse.json(adimlar);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  const body = await req.json();
  const { akisId, adimId, karar, notlar } = body as { akisId: string; adimId: string; karar: "onay" | "red"; notlar?: string };
  if (!akisId || !adimId || !karar) return NextResponse.json({ error: "Eksik parametre" }, { status: 400 });

  const akisAdim = await prisma.senaryoAkisiAdim.findFirst({
    where: { akisId, adimId, durum: "Aktif" },
  });
  if (!akisAdim) return NextResponse.json({ error: "Bu adım aktif değil" }, { status: 404 });

  const yapanAd = `${session.ad} ${session.soyad}`;
  const yeniDurum = karar === "onay" ? "Tamamlandi" : "Reddedildi";

  await prisma.senaryoAkisiAdim.update({
    where: { id: akisAdim.id },
    data: {
      durum: yeniDurum,
      yapanKullaniciId: session.id,
      yapanAd,
      yapanPanel: "muhasebe",
      yapilanTar: new Date(),
      notlar: notlar ?? null,
    },
  });

  if (karar === "red") {
    await prisma.senaryoAkisi.update({ where: { id: akisId }, data: { durum: "Reddedildi", bitirmeTar: new Date() } });
    return NextResponse.json({ ok: true, durum: "Reddedildi" });
  }

  const sonraki = await prisma.senaryoAkisiAdim.findFirst({
    where: { akisId, sira: { gt: akisAdim.sira } },
    orderBy: { sira: "asc" },
  });
  if (sonraki) {
    await prisma.senaryoAkisiAdim.update({ where: { id: sonraki.id }, data: { durum: "Aktif" } });
    await prisma.senaryoAkisi.update({ where: { id: akisId }, data: { aktifSira: sonraki.sira } });
    return NextResponse.json({ ok: true, durum: "Tamamlandi", sonrakiAdimId: sonraki.id });
  }
  await prisma.senaryoAkisi.update({ where: { id: akisId }, data: { durum: "Tamamlandi", bitirmeTar: new Date() } });
  return NextResponse.json({ ok: true, durum: "Tamamlandi", akisTamamlandi: true });
}
